# Petalpost – digital flower bouquets

Arrange a hand-drawn bouquet, write a note, and send it as a link that unwraps and blooms on the recipient's phone. Free, no signup, no app.

Live: https://flower-bouquet-digital.vercel.app

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
- Supabase Postgres (service-role access from route handlers only; RLS on, no public policies)
- Motion for the unwrap/bloom animation, Zustand for builder state
- Analytics: Microsoft Clarity + Firebase Analytics (GA4) + Vercel Analytics / Speed Insights
- All flower art is procedural SVG in `lib/bouquet/art.ts` (no image assets)

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in values
node --env-file=.env.local scripts/migrate.mjs   # applies supabase/migrations/*
pnpm dev
```

## Environment variables

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel + local | Canonical origin, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + local | Not used yet (reserved for auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local | **Secret.** Server only |
| `SUPABASE_DB_URL` | local only | Session pooler URL, used by `scripts/migrate.mjs` |
| `IP_HASH_SALT` | Vercel + local | Random string; salts IP hashes for rate limiting |
| `NEXT_PUBLIC_CLARITY_ID` | Vercel + local | |
| `NEXT_PUBLIC_FIREBASE_*` | Vercel + local | Web app config incl. `MEASUREMENT_ID` |

## Project map

```
app/(site)/          landing, /create builder, /flowers, /occasions, /guides, /faq, legal, /garden
app/b/[slug]/        recipient page (noindex) + dynamic Open Graph image
app/api/             bouquets (create/delete/view/mine), reactions, reports
lib/bouquet/         art, catalog, composition (layout, SVG render), card schema, store, PNG export
lib/content/         flower meanings, occasions, guides (drives SEO pages + llms.txt)
lib/seo/             JSON-LD helpers, llms.txt generators
supabase/migrations/ SQL schema
```

## Abuse protection

Honeypot field, per-IP-hash rate limits (12 bouquets / 10 min, 60 / day; 15 reactions / 10 min), a small blocklist for threats and slurs, one report per IP per bouquet, and auto-hide after 3 reports.

## Analytics events

`builder_opened`, `preset_selected`, `flower_added`, `shuffle_used`, `bouquet_created`, `share_clicked`, `image_downloaded`, `bouquet_viewed`, `bouquet_unwrapped`, `reaction_sent`, `send_back_clicked`. Note text and names carry `data-clarity-mask`. Analytics load on first interaction; in Europe/UK only after opt-in.
