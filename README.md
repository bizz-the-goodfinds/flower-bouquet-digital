# Flower Bouquet Digital

Arrange a hand-drawn bouquet, write a note, and send it as a link that unwraps and blooms on the recipient's phone. Free, no signup, no app.

Live: https://flower-bouquet-digital.vercel.app

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
- Supabase Postgres (service-role access from route handlers only; RLS on, no public policies)
- Motion for the unwrap/bloom animation, Zustand for builder state
- Analytics: Microsoft Clarity + Firebase Analytics (GA4) + Vercel Analytics / Speed Insights
- All flower, wrap and envelope art is procedural SVG (`lib/bouquet/art.ts`, `lib/bouquet/envelope.ts`)
- Fonts: Playfair Display (headings), Geist (UI); letter fonts Handlee, Playwrite CA Guides, Cutive Mono, Sacramento, Bitcount Single
- Video/GIF of the opening are rendered on-device (`lib/bouquet/animate.ts`, MediaRecorder + gifenc)

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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + local | Browser key for optional sign-in |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local | **Secret.** Server only |
| `SUPABASE_DB_URL` | local only | Session pooler URL, used by `scripts/migrate.mjs` |
| `IP_HASH_SALT` | Vercel + local | Random string; salts IP hashes for rate limiting |
| `NEXT_PUBLIC_CLARITY_ID` | Vercel + local | |
| `NEXT_PUBLIC_FIREBASE_*` | Vercel + local | Web app config incl. `MEASUREMENT_ID` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | optional | Cloudflare Turnstile on bouquet creation; off when empty |
| `NEXT_PUBLIC_AUTH_GOOGLE` | optional | `1` shows "Continue with Google" (enable the provider in Supabase first) |

## Optional sign-in (Supabase Auth)

Sign-in is optional and only used to sync "My bouquets" across devices. Accounts use email + password and are created
server-side already confirmed (`/api/auth/signup`), so no verification email is sent.

1. Supabase → Authentication → URL Configuration: set **Site URL** to the production URL and add
   `https://flower-bouquet-digital.vercel.app/auth/callback` and `http://localhost:3000/auth/callback` to **Redirect URLs**
   (needed for "Forgot password" and Google).
2. "Forgot password" sends Supabase's reset email. The built-in sender is unbranded and rate-limited; configure custom SMTP
   (e.g. Resend) and edit the email template in Supabase before launch.
3. For Google: enable the Google provider in Supabase with an OAuth client, then set `NEXT_PUBLIC_AUTH_GOOGLE=1`.

## Deploying on Vercel

1. Project → Settings → Domains: add `flower-bouquet-digital.vercel.app`.
2. Settings → Deployment Protection: disable Vercel Authentication for Production (otherwise visitors hit a login wall).
3. Add all variables from `.env.example` (except `SUPABASE_DB_URL`) and redeploy.

## Project map

```
app/(site)/          landing, /flowers, /occasions, /guides, /faq, legal, /garden, /account/reset
app/(app)/create/    builder (header only, full-height)
app/b/[slug]/        recipient page (noindex) + dynamic Open Graph image
app/api/             bouquets (create/delete/view/mine), reactions, reports
lib/bouquet/         art, catalog, composition (layout, SVG render), card schema, store, PNG export
lib/content/         flower meanings, occasions, guides (drives SEO pages + llms.txt)
lib/seo/             JSON-LD helpers, llms.txt generators
supabase/migrations/ SQL schema
```

## Abuse protection

Optional Cloudflare Turnstile, honeypot field, per-IP-hash rate limits (12 bouquets / 10 min, 60 / day; 15 reactions / 10 min), a small blocklist for threats and slurs, one report per IP per bouquet, and auto-hide after 3 reports.

## Quality checks

`.github/workflows/ci.yml` runs lint, type-check, build and Lighthouse CI (`lighthouserc.json`: accessibility and SEO must be 100; performance and best practices warn below 90/95).

## Analytics events

`preview_opened`, `wrap_selected`, `app_error`, `login`, `bouquet_edited`, `signup_completed`, `builder_opened`, `preset_selected`, `flower_added`, `shuffle_used`, `bouquet_created`, `share_clicked`, `image_downloaded`, `bouquet_viewed`, `bouquet_unwrapped`, `reaction_sent`, `send_back_clicked`. Note text and names carry `data-clarity-mask`. Analytics load on first interaction; in Europe/UK only after opt-in.
