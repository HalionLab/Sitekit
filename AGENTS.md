<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sitekit — rebrand manual

A brand-neutral small-business site template. Everything a business owner needs
to change lives in **config, tokens, and markdown** — not in component code.
This file is the map. Read it before editing anything.

## 1. Architecture map

```
site.config.ts          the whole brand: name, NAP, nav, CTAs, sections[], copy, features
app/theme.css           11 color tokens + 3 font vars (Tailwind v4 @theme)
lib/theme.ts            the same 11 colors as TS, for OG images + emails (MUST match theme.css)
app/layout.tsx          fonts (marked region), metadata, LocalBusiness JSON-LD
components/sections/    15 section components + registry.tsx (renderSections drives the homepage)
presets/                4 vertical starter configs — consumed ONLY by scripts/setup.ts
content/                markdown: posts/, pages/, legal/ — the default content source
lib/content, lib/leads  adapters: file-vs-Supabase content, email-vs-Supabase leads
supabase/migrations/    0001_init.sql + 0002_seed.sql — apply as a pair, CMS mode only
app/(site)/preview      kitchen sink: every section with demo copy, for visual checks
```

## 2. Rebrand checklist

Do these in order. Steps 2–6 are the hand-edit path; step 1 is the shortcut.

1. **Fresh start?** `npm run setup` — interactive wizard. It writes `site.config.ts`,
   `app/theme.css`, `lib/theme.ts`, the fonts region of `app/layout.tsx`, and
   `.env.local` from a preset. It warns before overwriting hand-edits (sentinel
   line + `.sitekit-config-hash`). If the owner already customized things, skip
   it and hand-edit instead.
2. **`site.config.ts`** — `name`, `tagline`, `description`, `url`, `business.*`
   (legal name, phone, email, address, hours, serviceAreas, services, schemaType),
   `nav`, `footerLinks`, `social`, `cta`, then `sections[]` and `copy`. Validated
   at import: a bad config throws with `site.config.ts: <field> ...` at build time.
3. **`app/theme.css` AND `lib/theme.ts`** — the 11 colors exist in both files.
   ⚠️ **Change one, change the other.** `tests/unit/theme-sync.test.ts` fails the
   build if a single hex diverges. CSS can't reach Satori (OG images) or email
   HTML, which is why the TS copy exists.
4. **Fonts** — `app/layout.tsx`, between `// sitekit:fonts-start` and
   `// sitekit:fonts-end`. Edit the `next/font/google` import line and the three
   consts; keep the `--font-g-display` / `--font-g-body` / `--font-g-mono`
   variable names, which `app/theme.css` maps to `--font-*`.
5. **`content/`** — `posts/*.md` and `pages/*.md` (frontmatter: `title`,
   `excerpt`, `status`, `publishedAt` for posts). `legal/privacy.md` and
   `legal/terms.md` are templates: they use `{{businessName}}`, `{{legalName}}`,
   `{{email}}`, `{{phone}}`, `{{address}}`, `{{siteUrl}}`, `{{date}}` and fill
   themselves from config — usually leave them alone.
6. **`public/`** — `logos/brand-*.svg` (logoStrip) and `gallery/placeholder-*.svg`
   are placeholders. Replace them with real files and update the `src`/`alt` in
   `copy.logoStrip.logos` / `copy.gallery.images`. **The gallery `alt` text in the
   hospitality and portfolio presets describes real photographs** — swap in real
   images or rewrite the alt text; shipping placeholder SVGs with those alts is
   an accessibility lie. A real logo goes in `site.logo` (`{src, alt, width,
   height}`); leave it `null` for the auto monogram. The favicon is generated
   (`app/icon.tsx`) — it rebrands itself, nothing to swap.
7. **Preset testimonials and stats are sample copy, not facts.** Every preset
   ships invented quotes, names, and numbers so the first render looks real.
   During a rebrand, replace them with the owner's real testimonials and
   numbers — or drop those sections from `sections[]` rather than shipping
   fabricated social proof.
7. **`npm run verify`** — typecheck + lint + unit tests. Must pass.
8. **Look at it** — `npm run dev`, then `/` (the real homepage) and `/preview`
   (every section, so restyling is visible even for unused ones).

## 3. Design tokens

Defined in `app/theme.css` (`@theme`), mirrored in `lib/theme.ts` as `themeColors`.
Use them via Tailwind classes (`bg-surface`, `text-fg-muted`, `border-border-token`).
Never hardcode a hex in a component.

| Token | Role | `lib/theme.ts` key |
|---|---|---|
| `--color-surface` | page background | `surface` |
| `--color-surface-alt` | tinted band on light | `surfaceAlt` |
| `--color-surface-inverse` | dark band background | `surfaceInverse` |
| `--color-surface-inverse-alt` | raised panel on dark | `surfaceInverseAlt` |
| `--color-fg` | body text on light | `fg` |
| `--color-fg-inverse` | text on dark bands | `fgInverse` |
| `--color-fg-muted` | secondary text on light | `fgMuted` |
| `--color-accent` | links, primary CTA | `accent` |
| `--color-accent-alt` | secondary accent, gradients | `accentAlt` |
| `--color-accent-contrast` | text on accent backgrounds | `accentContrast` |
| `--color-border-token` | hairlines | `borderToken` |
| `--font-display` | headings | set in `app/layout.tsx` |
| `--font-body` | body text | set in `app/layout.tsx` |
| `--font-mono` | eyebrows, labels | set in `app/layout.tsx` |

## 4. Copy map

Every homepage section is a key in `site.sections[]`; its text is `site.copy.<key>`.
Sections marked *optional copy* render from `site.business` when the key is absent.

| Section key | Copy path | Component | Also reads |
|---|---|---|---|
| `hero` | `copy.hero` | `components/sections/Hero.tsx` | — |
| `servicesGrid` | `copy.servicesGrid` *(optional)* | `ServicesGrid.tsx` | `business.services` |
| `about` | `copy.about` | `About.tsx` | — |
| `testimonials` | `copy.testimonials` | `Testimonials.tsx` | — |
| `gallery` | `copy.gallery` | `Gallery.tsx` | — |
| `faq` | `copy.faq` | `Faq.tsx` | — |
| `pricing` | `copy.pricing` | `Pricing.tsx` | — |
| `contactBand` | `copy.contactBand` *(optional)* | `ContactBand.tsx` | `business.address`, contact form |
| `teamGrid` | `copy.teamGrid` | `TeamGrid.tsx` | — |
| `processSteps` | `copy.processSteps` | `ProcessSteps.tsx` | — |
| `statsBand` | `copy.statsBand` | `StatsBand.tsx` | — |
| `logoStrip` | `copy.logoStrip` | `LogoStrip.tsx` | `public/logos/` |
| `ctaBand` | `copy.ctaBand` | `CtaBand.tsx` | — |
| `hoursMap` | `copy.hoursMap` *(optional)* | `HoursMap.tsx` | `business.hours`, `business.address` |
| `blogTeaser` | `copy.blogTeaser` *(optional)* | `BlogTeaser.tsx` | latest posts; needs `features.blog` |

Shapes live in `lib/config/types.ts`. Off-homepage copy: header/footer from `nav`
/ `footerLinks` / `cta`, page bodies from `content/`.

## 5. Feature flags

`site.features` in `site.config.ts`. All gating is route-level via
`notFoundUnless()` (`lib/config/features.ts`).

| Flag | Off behavior |
|---|---|
| `blog` | `/blog` and `/blog/[slug]` 404; nav + footer entries hidden; sitemap and `llms.txt` omit posts; `blogTeaser` renders nothing (and the validator rejects it in `sections[]`) |
| `cms` | `/admin/*`, `/login`, `/auth/confirm`, `/api/draft/*`, `/unsubscribe` 404; content comes from `content/*.md`; leads go out by email instead of into Postgres; rate limiting uses the in-process limiter; the proxy skips Supabase entirely |
| `gatedDownload` | no lead-magnet CTA is placed (`components/marketing/LeadCaptureForm.tsx` is the piece you mount when it's on). **Requires `cms`** — the validator throws otherwise. Note: `/admin/downloads` today is gated by `cms`, not by this flag |
| `analytics` | no analytics script tag is emitted at all |

`cms` off is the default and is fully functional — file mode is a complete site.

## 6. Do not touch

These are load-bearing. Changing them to "make the rebrand work" breaks security
or portability. If a rebrand seems to need one, you have misread the task.

- **`lib/content/sources/*`, `lib/leads/sinks/*`** — the adapter implementations.
  Import `lib/content` / `lib/leads` only; never a concrete source or sink.
  Importing one directly hard-wires the site to Supabase and breaks file mode.
- **RLS policies in `supabase/migrations/*.sql`** — they are the only thing
  standing between the anon key and every lead in the database.
- **`lib/validation/*`** — input validation for public forms.
- **`lib/rate-limit/*`** — abuse protection on lead capture (5/hour per hashed IP).
- **`proxy.ts`** — Supabase session refresh; the only place cookies can be
  rotated. Without it admin sessions get revoked.
- **`lib/config/validate.ts`** — the guardrail that turns a bad config into a
  clear build error instead of a blank page. Extend it, don't weaken it.

## 7. Verification

| Command | Catches |
|---|---|
| `npm run verify` | everything below except e2e — run this before saying you're done |
| `npm run typecheck` | config shape errors, broken imports, bad copy shapes |
| `npm run lint` | unused imports, React/Next rule violations |
| `npm test` | 285+ unit tests, incl. **theme-sync** (`theme.css` ↔ `lib/theme.ts`), config validation, preset completeness, section rendering |
| `npm run build` | config validator throwing at import; RSC/route errors. Must pass with **zero env vars** |
| `npm run test:e2e` | real page loads for `/`, `/blog`, `/contact`, `/preview`; Supabase-only specs skip themselves without env |
| `npm run dev` + eyeball `/` and `/preview` | the part no test catches: does it look like this business? |

Run `npx vitest run tests/unit/theme-sync.test.ts` on its own after any color change.

## 8. Common tasks

- **Add a page** — create `content/pages/<slug>.md` with `title`, `excerpt`,
  `status: published`. It serves at `/<slug>` via `app/(site)/[slug]/page.tsx`.
  Slugs in `lib/content/reserved-slugs.ts` (`blog`, `contact`, `privacy`, …) are
  refused. Add it to `nav`/`footerLinks` if it should be linked.
- **Add / remove / reorder a homepage section** — edit `site.sections[]` (order
  is render order) and add the matching `site.copy.<key>`. Sections requiring
  copy are listed in `lib/config/validate.ts`; omitting it throws at build.
- **Swap fonts** — see checklist step 4. Any `next/font/google` family works;
  keep the CSS variable names.
- **Enable the blog** — `features.blog: true` (default) and drop markdown in
  `content/posts/`.
- **Enable CMS (Supabase)** — create a Supabase project → apply
  `supabase/migrations/0001_init.sql` then `0002_seed.sql` (both, in order) →
  set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` → set `features.cms: true`.
  Sign in at `/login` with an email from `ADMIN_EMAILS` (magic link).
  See `docs/DEPLOY.md`.
- **Enable the gated download** — needs `features.cms` first. Set
  `features.gatedDownload: true`, upload a PDF at `/admin/downloads` and mark it
  current, then mount `<LeadCaptureForm source="download" />` where the CTA
  belongs. Set `RESEND_API_KEY` + `UNSUBSCRIBE_SECRET` for the delivery email.
- **Enable analytics** — config only, no env vars: `features.analytics: true`
  plus `analytics: { provider, siteId, scriptUrl? }`. `plausible` takes the
  domain as `siteId`; `umami` needs both `siteId` and `scriptUrl`; `ga4` needs a
  measurement ID in `G-XXXXXXX` form (the validator enforces the shape).
  **The template emits the script and nothing else** — a cookie/consent banner
  and consent-mode defaults are the site owner's legal responsibility.
- **Start over** — `npm run setup`. It regenerates config + theme + fonts from a
  preset and warns first if `site.config.ts` was hand-edited.
