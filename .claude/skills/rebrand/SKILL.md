---
name: rebrand
description: Use when the user wants to make this template their own — new business name, colors, fonts, copy, or logo. Guides a complete Sitekit rebrand.
---

# Rebrand this site

Turn the Sitekit default (Summit Services, a Denver HVAC shop) into the user's
actual business. `AGENTS.md` is the authority on *where* things live; this skill
is the order of operations.

## 1. Gather the facts (conversationally, not as a form)

Ask for what you don't already have. Don't ask for all of it at once, and don't
block on the optional bits — placeholders are fine and clearly marked as such.

- **Business name** and a one-line tagline.
- **What they do** → map it to the closest preset and say which you picked:
  `local-service` (trades, cleaning, pest, landscaping), `professional` (law,
  accounting, consulting, agency), `hospitality` (restaurant, cafe, salon, gym),
  `portfolio` (photographer, designer, studio).
- **Colors.** If they hand you a logo file, read it and pull the hexes out. If
  not, ask for a primary (dark, used for surfaces and text) and an accent (the
  CTA/link color), or propose two that suit the vertical and confirm.
- **Contact / NAP** — phone, email, street address, city, state, ZIP, hours,
  service areas. This feeds the LocalBusiness JSON-LD, the footer, the contact
  band, and the legal pages, so it's worth getting right.
- **Logo file?** If yes, put it in `public/` and set `site.logo`. If no, leave
  `site.logo: null` — the header and favicon generate a monogram.

## 2. Pick a path

- **Fresh clone, nothing customized yet** → run `npm run setup` and feed it the
  answers. It rewrites `site.config.ts`, `app/theme.css`, `lib/theme.ts`, the
  fonts region of `app/layout.tsx`, and `.env.local` in one shot. Then hand-edit
  the preset copy so it describes *their* business, not the sample one.
- **Already customized** (config differs from the preset, custom copy, extra
  pages) → do **not** run setup; it overwrites. Hand-edit instead, following the
  rebrand checklist in `AGENTS.md` §2 step by step.

Either way, finish by walking `site.copy` section by section and rewriting the
text in the owner's voice. Preset copy is realistic on purpose — that makes it
easy to miss that it's still about someone else's business. Check the stats
footnote, testimonial names, FAQ answers, and gallery `alt` text especially.

## 3. Rules that don't bend

- **Colors live in two files.** `app/theme.css` and `lib/theme.ts` must carry
  identical hexes. After any color change run:
  `npx vitest run tests/unit/theme-sync.test.ts`
- **Never edit the do-not-touch list** in `AGENTS.md` §6: `lib/content/sources/*`,
  `lib/leads/sinks/*`, RLS policies in `supabase/migrations/*.sql`,
  `lib/validation/*`, `lib/rate-limit/*`, `proxy.ts`, `lib/config/validate.ts`.
  A rebrand never needs them. If it seems to, you've misread the task.
- **No hardcoded hexes in components.** Use the token classes.
- **Don't invent facts.** No fake awards, review counts, or years in business —
  ask, or leave the placeholder with its "replace with yours" footnote intact.

## 4. Verify and show them

1. `npm run verify` — typecheck + lint + unit tests. Must pass.
2. `npm run dev`, then look at `/` and `/preview` in a browser.
3. **Screenshot `/` and show it to the user.** A rebrand isn't done until they
   have seen it. Point out anything still holding placeholder content
   (`public/logos/`, `public/gallery/`, the stats band) and what's left to do.
