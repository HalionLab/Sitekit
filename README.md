# Sitekit

**A real website for a small business — one you own, in a repo you control.**

No page builder, no monthly platform fee, no "upgrade to remove the badge." It's
a Next.js app: clone it, run it, deploy it anywhere Node runs. And it's built to
be handed to Claude Code — the whole brand lives in one config file, eleven
color tokens, and a folder of markdown, so an agent can rebrand it end to end
without touching a component.

Out of the box you get a finished-looking marketing site: 15 restylable
sections, a blog, a contact form that emails you, legal pages that fill
themselves in from your business details, SEO metadata, LocalBusiness JSON-LD,
generated OG images, and a generated favicon. Flip one flag and it grows a
Supabase-backed CMS with an admin UI.

## Quick start

1. Click **Use this template** on GitHub (or `git clone` it).
2. `npm install`
3. `npm run dev` → http://localhost:3000

That's it. **Zero environment variables, zero database.** The site renders
immediately with a complete sample business (Summit Services, a Denver HVAC
shop) so you can see what you're editing before you edit it.

Then, optionally:

```bash
npm run setup     # interactive wizard: name, vertical preset, colors, fonts, contact details
```

It rewrites `site.config.ts`, `app/theme.css`, `lib/theme.ts`, the fonts region
of `app/layout.tsx`, and `.env.local` for your brand. It warns before
overwriting hand-edited files.

## Make it yours with Claude

Open the repo in [Claude Code](https://claude.com/claude-code) and say:

> rebrand this for Ridgeline Roofing, a roofing contractor in Boise

Sitekit ships a `/rebrand` skill (`.claude/skills/rebrand/`). Claude will ask
for your business details, pull colors out of your logo if you give it one, pick
the closest vertical preset, rewrite the copy in your voice, run the test suite,
and show you a screenshot of the result.

The manual it follows is [`AGENTS.md`](AGENTS.md) — the architecture map,
rebrand checklist, token table, copy map, and the list of files that must not be
touched. Worth reading yourself if you'd rather drive.

## What you get

| | File mode (default) | + Supabase (`features.cms: true`) |
|---|---|---|
| Homepage, 15 sections | ✅ | ✅ |
| Blog | ✅ markdown in `content/posts/` | ✅ posts in Postgres |
| Extra pages | ✅ markdown in `content/pages/` | ✅ pages in Postgres |
| Contact form | ✅ emails you (Resend) | ✅ stored as leads + email |
| Legal pages | ✅ auto-filled from config | ✅ |
| SEO, sitemap, JSON-LD, OG + favicon images | ✅ | ✅ |
| Analytics (Plausible / Umami / GA4) | ✅ config-driven | ✅ |
| Admin UI at `/admin` | — | ✅ posts, pages, leads, downloads |
| Draft previews | — | ✅ |
| Gated PDF download + welcome email | — | ✅ |
| Rate limiting | in-process | durable, shared across instances |
| **Setup required** | **none** | Supabase project + 2 migrations |

## Environment variables

**Every variable is optional.** The site builds and runs with none of them set;
each one switches on a specific capability. Copy `.env.example` to `.env.local`
to start.

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap, OG | Falls back to `site.url`, then localhost. Set it in production. |
| `NEXT_PUBLIC_SUPABASE_URL` | CMS mode | From your Supabase project settings. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | CMS mode | Public key; RLS is what protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | CMS mode | **Server only.** Never expose to the browser. |
| `ADMIN_EMAILS` | `/admin` access | Comma-separated. Magic-link sign-in at `/login`. |
| `RESEND_API_KEY` | contact-form + welcome email | Without it, sends are skipped and logged. |
| `RESEND_FROM` | branded sender address | Defaults to Resend's shared sandbox sender. |
| `UNSUBSCRIBE_SECRET` | signed unsubscribe links | `openssl rand -hex 32`. Needed with the gated download. |
| `LEAD_RATE_LIMIT_SALT` | hashing IPs for rate limits | Recommended in production. Rotating it resets the ledger. |
| `GOOGLE_SITE_VERIFICATION` | Search Console meta tag | |
| `BING_SITE_VERIFICATION` | Bing Webmaster meta tag | |

Analytics is **not** configured with env vars — it's config. Set
`features.analytics` and `analytics.{provider, siteId, scriptUrl}` in
`site.config.ts`.

## Scripts

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run setup` | interactive rebrand wizard |
| `npm run verify` | typecheck + lint + unit tests — run before you ship |
| `npm run build` / `npm start` | production build and serve |
| `npm run test:e2e` | Playwright end-to-end tests |

`npm run test:e2e` needs Playwright's browser binaries, which aren't installed
by `npm install`. Run `npx playwright install chromium` once before the first
`npm run test:e2e`.

## Deploy

Vercel, any Node host, or Docker — see [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Contributing

Issues and pull requests are welcome at
[HalionLab/Sitekit](https://github.com/HalionLab/Sitekit). Please run
`npm run verify` before opening a PR, and read `AGENTS.md` first — the
adapter and security boundaries it lists are deliberate.

## License

MIT — see [`LICENSE`](LICENSE). Build client sites with it, sell them, ship it
however you like.
