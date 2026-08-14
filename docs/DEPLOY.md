# Deploying Sitekit

Sitekit is a standard Next.js app with no Vercel-only primitives. It deploys to
Vercel, any Node host, or a container — and in file mode it needs **no
environment variables and no database at all**.

Before deploying, run `npm run verify && npm run build` locally. The build must
succeed with zero env vars set; if it doesn't, `site.config.ts` has a validation
error and the message will name the field.

---

## Vercel

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Framework preset,
   build command, and output directory are auto-detected.
3. Add environment variables under **Settings → Environment Variables** (see
   [Environment variables](#environment-variables) below). At minimum set
   `NEXT_PUBLIC_SITE_URL` to your production URL.
4. Deploy. Add your custom domain under **Settings → Domains**, then update
   `NEXT_PUBLIC_SITE_URL` and `site.url` in `site.config.ts` to match and
   redeploy — canonical URLs, the sitemap, and OG tags all read from them.

Changing an env var requires a redeploy to take effect.

## Any Node host (Fly.io, Render, Railway, a VPS)

```bash
npm ci
npm run build
npm start          # serves on $PORT, default 3000
```

Requires Node 20 or newer. Put the same environment variables in the host's
config. Run it behind a reverse proxy that terminates TLS.

## Docker

```dockerfile
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/content ./content
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t sitekit .
docker run -p 3000:3000 -e NEXT_PUBLIC_SITE_URL=https://example.com sitekit
```

Public env vars (`NEXT_PUBLIC_*`) are inlined at **build** time, so pass them as
build args if you need them baked into the client bundle; server-only vars can
be passed at run time.

`content/` and `next.config.ts` must ship in the runtime image even though the
build already ran: in file mode (no CMS), `lib/content/sources/file.ts` and the
`/privacy` and `/terms` pages read `content/**/*.md` from disk on every request
(including ISR revalidation) rather than bundling it at build time, and
`next start` reads `next.config.ts` itself. Skip either `COPY` and content
silently disappears — or `next start` falls back to defaults — after the first
revalidation, not on first boot, which makes it easy to miss in a quick smoke
test. `site.config.ts` needs no such copy: it's a TypeScript import compiled
into the build output, not read from disk at runtime.

---

## Environment variables

Every variable is optional — each one switches on a capability. See
`.env.example` for the annotated list.

| Feature | Variables |
|---|---|
| **Nothing (file mode)** | none — the site runs bare |
| Correct canonical URLs / sitemap / OG | `NEXT_PUBLIC_SITE_URL` |
| Contact-form email + welcome email | `RESEND_API_KEY`, optionally `RESEND_FROM` |
| CMS + admin UI | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` |
| Gated download / unsubscribe links | `UNSUBSCRIBE_SECRET` (`openssl rand -hex 32`) |
| Durable lead rate limiting | `LEAD_RATE_LIMIT_SALT` (`openssl rand -hex 32`) |
| Search-engine verification | `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` |

`SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security. Set it as a
server-only secret; never prefix it with `NEXT_PUBLIC_`.

Analytics needs no env vars — set `features.analytics` and `analytics.*` in
`site.config.ts`.

---

## Supabase setup (CMS mode only)

Skip this entirely if you're happy editing markdown in `content/`.

1. Create a project at <https://supabase.com/dashboard>. From **Settings → API**
   copy the project URL, the `anon` key, and the `service_role` key.

2. Apply both migrations, **in order** — they are a fresh-apply pair and
   `0002_seed.sql` assumes `0001_init.sql` has run:

   ```bash
   # Supabase CLI
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   ```bash
   # or psql, using the connection string from Settings -> Database
   psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
   psql "$DATABASE_URL" -f supabase/migrations/0002_seed.sql
   ```

   This creates the content, leads, and download tables, their RLS policies, the
   storage buckets, and the rate-limit RPC. Don't edit the policies.

3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_EMAILS` (comma-separated) in your
   host's environment.

4. Set `features.cms: true` in `site.config.ts` and redeploy.

5. Visit `/login`, enter an email from `ADMIN_EMAILS`, and click the magic link
   Supabase sends you. You land in `/admin`.

To rotate admins, edit `ADMIN_EMAILS` and redeploy. To add the gated download,
also set `features.gatedDownload: true` and `UNSUBSCRIBE_SECRET` — see
`AGENTS.md` §8.

### Auth redirect URLs

In Supabase, under **Authentication → URL Configuration**, set the **Site URL**
to your production origin and add your deploy previews to **Redirect URLs**.
Magic links fail silently against an unlisted origin.
