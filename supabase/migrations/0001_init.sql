-- Sitekit schema. Apply to a fresh Supabase project: supabase db push.
--
-- Tables: content_items (posts + pages), reserved_slugs, leads, lead_attempts,
--         download_items (gated PDF downloads).
-- Storage buckets: media (public images), downloads (public-by-link PDFs).
-- RLS: public can read published content + reserved slugs + insert leads;
--      everything else (admin writes, lead reads, download issues) is
--      service-role only.

set check_function_bodies = off;

-- ============================================================================
-- Helper functions
-- ============================================================================
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- content_items — posts and pages share this table
-- ============================================================================
create table content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('post','page')),
  slug text not null,
  title text not null,
  body_markdown text not null default '',
  excerpt text,
  cover_image_path text,
  cover_image_alt text,
  meta_title text,
  meta_description text,
  og_image_path text,
  jsonld_overrides jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug),
  constraint cover_image_requires_alt
    check (cover_image_path is null
           or (cover_image_alt is not null and length(trim(cover_image_alt)) > 0)),
  constraint slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index content_items_published on content_items (kind, status, published_at desc);

create trigger content_items_touch_updated_at
  before update on content_items
  for each row execute function touch_updated_at();

-- ============================================================================
-- reserved_slugs — top-level segments with a real route; blocked from
-- content_items so an authored post/page can never shadow an app route.
-- ============================================================================
create table reserved_slugs (
  slug text primary key
);

insert into reserved_slugs (slug) values
  ('blog'),
  ('admin'),
  ('api'),
  ('sitemap.xml'),
  ('robots.txt'),
  ('pricing'),
  ('contact'),
  ('login'),
  ('signup'),
  ('checkout'),
  ('dashboard'),
  ('account'),
  ('terms'),
  ('privacy'),
  ('unsubscribe'),
  ('auth'),
  ('llms.txt'),
  ('opengraph-image');

alter table reserved_slugs enable row level security;

create policy reserved_slugs_public_read
  on reserved_slugs for select
  to anon, authenticated
  using (true);

create or replace function block_reserved_slugs() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from reserved_slugs where slug = new.slug) then
    raise exception 'slug % is reserved', new.slug
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger content_items_block_reserved_slugs
  before insert or update of slug on content_items
  for each row execute function block_reserved_slugs();

-- ============================================================================
-- leads — contact / newsletter / quote / download captures
-- ============================================================================
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text not null check (source in ('contact','newsletter','quote','download','other')),
  notes text,
  user_agent text,
  ip_hash text,
  -- Stamped when this (email, source) pair opts out of future transactional
  -- email; NULL = still subscribed. Suppression is checked before every send.
  unsubscribed_at timestamptz,
  -- Atomic welcome-email dedup claim marker. The send path claims by
  -- stamping this column before sending:
  --   update leads set welcome_sent_at = now()
  --    where id = $1 and welcome_sent_at is null
  --   returning id;
  -- Only the row-lock winner gets a row back and sends; a failed send clears
  -- the stamp again so the next submit retries.
  welcome_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index leads_created_at on leads (created_at desc);

-- Supports the (email, source) suppression check before welcome sends and
-- the pair-wide update in the unsubscribe route.
create index leads_email_source_idx on leads (email, source);

-- The single serialization point for "one welcome per (email, source)". A
-- second concurrent claim for the same pair fails with SQLSTATE 23505, so
-- exactly one send ever wins -- closing the read-then-write race without an
-- advisory lock or RPC. Partial: rows that have never been welcomed
-- (welcome_sent_at is null) are unconstrained.
create unique index leads_one_welcome_per_pair
  on leads (email, source)
  where welcome_sent_at is not null;

-- ============================================================================
-- lead_attempts — rate-limit ledger (IP-hash based, 5/hour)
-- ============================================================================
create table lead_attempts (
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);

create index lead_attempts_ip_time on lead_attempts (ip_hash, attempted_at desc);

create or replace function try_record_lead_attempt(
  p_ip_hash text,
  p_max int,
  p_window interval
) returns boolean
language plpgsql as $$
declare
  recent_count int;
begin
  -- Opportunistic sweep: keep the ledger small.
  delete from lead_attempts where attempted_at < now() - interval '24 hours';

  select count(*) into recent_count
    from lead_attempts
    where ip_hash = p_ip_hash and attempted_at > now() - p_window;

  if recent_count >= p_max then return false; end if;

  insert into lead_attempts (ip_hash) values (p_ip_hash);
  return true;
end;
$$;

-- ============================================================================
-- download_items — gated PDF downloads (e.g. a guide, menu, or price sheet);
-- exactly one row may be the current issue served to new signups.
-- ============================================================================
create table download_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,                 -- human label, e.g. "2026 Service Guide"
  storage_path text not null,          -- key within the `downloads` bucket
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exactly-one-current invariant. Partial unique index: at most one row may
-- have is_current = true at a time (false rows are unconstrained). "Mark
-- current" is a transactional flip (clear all -> set one) in the admin
-- action; this index is the database-level backstop that makes a second
-- `true` impossible.
create unique index download_items_one_current
  on download_items (is_current)
  where is_current;

create index download_items_created_at on download_items (created_at desc);

create trigger download_items_touch_updated_at
  before update on download_items
  for each row execute function touch_updated_at();

-- RLS: service-role only. The public site never queries this table directly
-- -- the lead-capture action resolves the current issue server-side (service
-- role) and hands out only the resolved public URL. With RLS enabled and no
-- anon/authenticated policies, those roles are denied by default; service
-- role bypasses RLS.
alter table download_items enable row level security;

-- ============================================================================
-- Row Level Security — content_items, leads, lead_attempts
-- ============================================================================
alter table content_items   enable row level security;
alter table leads           enable row level security;
alter table lead_attempts   enable row level security;

-- content_items: public can read published only.
create policy content_items_read_published
  on content_items for select
  to anon, authenticated
  using (status = 'published');

-- No insert/update/delete policy for anon/authenticated.
-- Service role bypasses RLS, so admin writes go through admin actions.

-- leads: no anon/authenticated policies at all — service role only. All
-- writes go through server actions (lib/leads/sinks/supabase.ts) using the
-- service-role client, which resolves honeypot + rate-limit checks first. An
-- anon INSERT policy would let a caller with only the public anon key bypass
-- those checks entirely by hitting the table directly, so none is granted;
-- anon/authenticated are denied by default with RLS enabled and no matching
-- policy.

-- lead_attempts: no public access. Service role only.

-- ============================================================================
-- Storage bucket: media — public images used in posts/pages.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'media', 'media', true,
    5242880,  -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  on conflict (id) do nothing;

-- Idempotent backstop: enforce the settings even if the bucket pre-existed.
-- App-level validation (lib/admin/upload.ts) is the first gate with friendly
-- errors; these bucket-level limits are the server-side backstop that holds
-- even if an upload bypasses the app. Supabase rejects violations with
-- HTTP 413 (too large) / 415 (wrong type).
update storage.buckets
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  where id = 'media';

-- Public read for the media bucket; writes only via service role. Anon has
-- SELECT, so this bucket IS publicly listable/enumerable -- by design, since
-- it only ever holds already-public post/page imagery.
create policy media_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

-- ============================================================================
-- Storage bucket: downloads — public by direct link, NOT enumerable.
-- ============================================================================
-- public = true so /storage/v1/object/public/downloads/<key> serves the PDF
-- to anyone with the link (shareable on purpose, no signed-URL expiry). 25 MB
-- cap + application/pdf only as a server-side backstop (mirrors the media
-- hardening above).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('downloads', 'downloads', true, 26214400, array['application/pdf'])
  on conflict (id) do nothing;

update storage.buckets
  set public = true,
      file_size_limit = 26214400,           -- 25 MB
      allowed_mime_types = array['application/pdf']
  where id = 'downloads';

-- DELIBERATELY no "create policy ... on storage.objects for select" for
-- bucket_id = 'downloads'. Public buckets serve direct object reads without
-- RLS, so shareable links work; but the Storage list API enforces RLS
-- SELECT, which anon does not have here -- so the bucket is NOT publicly
-- enumerable. (Contrast the media bucket above, which grants anon SELECT and
-- is therefore listable.) Writes are service-role only (no INSERT policy).
