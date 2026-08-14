-- 0002_seed.sql — sample content for first-deploy demo.
-- Two posts (one published, one draft) + an /about page. Sourced verbatim
-- from content/posts/*.md and content/pages/about.md so file mode and
-- Supabase mode demo identically. No cover images.

-- Post 1: published.
insert into content_items (
  kind, slug, title, excerpt, body_markdown,
  meta_title, meta_description,
  status, published_at
) values (
  'post',
  'welcome-to-our-new-website',
  'Welcome to our new website',
  'We rebuilt our site to make it faster to get a quote, see our services, and reach a real person — no more digging through a phone tree.',
  $md$
We built this site to make it easy to reach us. If you've called around for HVAC or plumbing help before, you know the drill: hold music, a callback that never comes, or a quote that changes the moment the technician shows up. We wanted a front door that actually works, so here's what changed.

## What's new

- **A real quote, faster.** The [contact form](/contact) goes straight to our scheduling team, not a call center. Most requests get a same-week appointment window.
- **No more mystery pricing.** Every job starts with a flat-rate quote before any work begins — you'll find that policy explained on the [about page](/about) along with the rest of how we operate.
- **A place for the questions we get most.** We're using this blog to answer the things people ask us on every job, starting with a post on what to ask before you hire *any* home-services contractor, not just us.

### Why it matters

A website is a small thing next to a furnace that won't start on the coldest night of the year. But we hear the same frustration constantly: not knowing the price until the invoice, and not knowing when — or if — anyone is coming. This site exists to fix both, before you ever pick up the phone.

> "The technician who quotes the job is the one who shows up to do it." That's not a slogan, it's how we've scheduled every job for fifteen years — this site just makes it easier to see that up front.

If something on the new site is confusing, broken, or missing, tell us. We'd rather hear it from you than guess. And if you're dealing with no heat, an active leak, or anything that can't wait, skip the form and call — that number's at the top of every page.

Thanks for reading, and welcome to the new site.
$md$,
  'Welcome to our new website',
  'We rebuilt our site to make it faster to get a quote, see our services, and reach a real person — no more digging through a phone tree.',
  'published',
  now()
);

-- Post 2: DRAFT. Verifies that draft filtering on /blog works and preview
-- mode shows it.
insert into content_items (
  kind, slug, title, excerpt, body_markdown,
  status
) values (
  'post',
  'five-questions-before-hiring',
  'Five questions to ask before hiring any home-services contractor',
  'Whoever you end up hiring — us or someone else — these five questions separate a contractor you can trust from one you''ll regret.',
  $md$
Every year we get called in to fix a job someone else started — a furnace re-installed twice, a re-pipe that leaked within a month, a "flat rate" that tripled at the door. Most of it was avoidable. Here are the five questions that would have caught it, whoever you end up hiring.

## 1. Is the price fixed before work starts?

Ask for a number in writing before any tools come out, not an hourly estimate that "depends what we find." A contractor who's confident in their diagnosis can quote it up front.

## 2. Are you licensed and insured for this specific trade?

HVAC and plumbing licenses aren't interchangeable, and neither is insurance coverage. Ask to see the license number and confirm it's active — most state licensing boards let you look it up in thirty seconds.

## 3. Who actually shows up to do the work?

Some outfits sell the job with one person and send someone else — sometimes a subcontractor you've never vetted — to do it. Ask directly: is the person quoting the job the one doing it?

## 4. What's covered if it fails in six months?

A workmanship guarantee should be specific: how long, and what it covers. "We stand behind our work" isn't an answer. A number of months and a scope in writing is.

## 5. Can they explain the problem, not just the fix?

A contractor who can walk you through *why* the part failed — not just that it needs replacing — is one who's actually diagnosing the issue instead of guessing. If the explanation doesn't make sense, ask again before you agree to anything.

None of these questions are unreasonable to ask, and a contractor worth hiring will expect them. If the answers make you uneasy, that's information too.
$md$
);

-- Page: published.
insert into content_items (
  kind, slug, title, excerpt, body_markdown,
  meta_title, meta_description,
  status, published_at
) values (
  'page',
  'about',
  'About Summit Services',
  'Local, licensed HVAC and plumbing crew serving the Denver metro for over fifteen years — flat-rate quotes, no subcontractors, no disappearing after install.',
  $md$
Summit Services has been fixing furnaces, air conditioners, and pipes across the Denver metro for over fifteen years. We're a local crew, not a franchise call center — the technician who quotes your job is the same one who shows up to do it.

## How we work

We built the business around the two things homeowners complain about most with contractors: not knowing the price until the invoice, and not knowing when — or if — anyone is coming. Every job gets a flat-rate quote up front, based on an on-site diagnosis, and a scheduled window we keep.

That means:

- **No commission pressure.** Our technicians aren't paid to upsell you.
- **No surprise line items.** The price we quote is the price you pay.
- **No bait-and-switch coupons.** The "too good to be true" number isn't the real one.
- **No disappearing after install.** Every repair and installation carries a 12-month workmanship guarantee.

## Who we serve

We work across Denver, Aurora, Lakewood, Arvada, Littleton, and Centennial — heating, cooling, and anything with a pipe attached, in homes old and new. Most jobs get a same-week appointment window, and true emergencies (no heat, active leaks) are usually seen same-day or the next morning.

> "We'd rather lose the upsell than lose your trust." That's been the rule since day one, and it's why most of our new customers come from a referral, not an ad.

If you're not sure whether we cover your issue or your neighborhood, the fastest way to find out is to call — we'll tell you straight away, and if we can't help, we'll usually know who can.
$md$,
  'About Summit Services',
  'Local, licensed HVAC and plumbing crew serving the Denver metro for over fifteen years — flat-rate quotes, no subcontractors, no disappearing after install.',
  'published',
  now()
);
