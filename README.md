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
- Video/GIF of the opening are rendered on-device (`lib/bouquet/animate.ts`, MediaRecorder + gifenc): envelope cover frame, unwrap, bloom, petal rain, card, branded logo pill

## Sharing, chat and threads

- **Link preview is a teaser.** `/b/[slug]/og` renders the sender's own envelope (colour, seal, liner) with "from X" copy, never the bouquet. `?r=<key>` personalises it for a personal link.
- **Personal links.** One bouquet, many people: `bouquet_links` gives each recipient `/b/<slug>?r=<key>` with their name on the envelope, their own open count and their own chat.
- **Chat.** `reactions` rows are chat messages (`author` = recipient | sender) grouped by `conversation`: `l:<link key>` or `d:<random device id>` (kept in `localStorage`). Whoever holds the link/device id reads that chat; the sender (edit token or signed-in owner) reads and answers all of them.
- **Live.** When both sides have a chat open, Supabase Realtime broadcast (`lib/realtime.ts`) delivers "new message" pings, typing and "is here" presence on `chat:<slug>:<conversation>`. Only pings travel; clients refetch from the API. My bouquets listens on `inbox:<slug>` and also polls every 30s. Chats load 30 messages at a time (scroll up for older).
- **Note display.** `card_style.note` is `tucked` (default) or `pinned`. The recipient page (`components/reveal/note-pick.tsx`) and the video/GIF timeline (`lib/bouquet/animate.ts`) both read it; the recipient's own pin choice lives in `localStorage` (`pp-note-pin-v1`).
- **Received.** Opening someone else's bouquet stores it on the device (and in `bouquet_receipts` when signed in), so it shows under My bouquets → Received with its chat.
- **Threads.** "Send one back" sets `reply_to`; `thread_id` is the first bouquet's id. My bouquets groups sent and received bouquets by thread; the recipient page shows only direct ancestors (never other people's replies).
- **Sender preview.** My bouquets → Preview replays the recipient view with every chat. It never counts as an open, and `/view` ignores the signed-in owner.

## v2: AI writer, song and voice, garden stats, app and push

- **AI note writer (bring your own key).** `lib/ai/providers.ts` calls Gemini, OpenAI, Anthropic or OpenRouter straight from the browser (all allow CORS). The key lives in `sessionStorage`, or in `localStorage` with "Remember" (`lib/ai/key.ts`), and never reaches our server. OpenRouter sign-in uses OAuth PKCE and returns to `/ai/callback`. The setup guide is at `/guides/ai-note-writer-api-key`.
- **Song.** `/api/song` looks up a Spotify / YouTube / Apple Music link (oEmbed, plus Open Graph for the artist). The server looks it up again on create and edit. The player is an iframe that loads only on tap.
- **Voice note.** Recorded with MediaRecorder (max 60 s) and uploaded at once to `/api/voice`, which stores it in the private `voice-notes` bucket under `pending/` and returns an HMAC-signed path. On send it moves to `b/<bouquet id>`. It plays through 1-hour signed URLs and is deleted with the bouquet.
- **Your garden.** `/api/garden/stats` computes the weekly streak, totals, referrals (`ref_bouquet_id`, distinct IP hashes) and badges (`lib/garden/badges.ts`). The panel is collapsible, closed by default.
- **Scheduled reveal time zones.** The sender picks the time in their own time zone (shown next to the picker). The recipient's countdown and My bouquets show it in the viewer's time zone (`lib/time/zone.ts`).
- **App and push.** `public/sw.js` caches the app shell (`/`, `/create`, `/garden`) and hashed assets. It never caches `/b/*`, `/api/*` or RSC. Web Push (VAPID) notifies on first open, a new message or reaction, a bouquet sent back, and a scheduled bouquet unlocking (on page visit, plus the daily `/api/cron/reveals`). Subscriptions are in `push_subscriptions` and `push_bouquets`. Endpoints are allowlisted to real push services.
- **Asking for push and install** (`components/pwa/nudge.tsx`, `lib/pwa/nudge.ts`). One card per visit, 12 s in, never on `/create`, `/b/*` or auth pages. Push is offered to people who have sent a bouquet; install from the second visit. "Not now" waits 3, then 10, then 30 days, and stops after 4 asks. Accepting ends it. The browser's own permission prompt only appears after a tap.
- **Brave:** push is off by default ("Registration failed - push service error"). Enable "Use Google services for push messaging" in `brave://settings/privacy`. The app says this when it happens.

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in values
node --env-file=.env.local scripts/migrate.mjs   # applies supabase/migrations/* (0006 adds song, voice, push, badges, referrals)
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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Vercel + local | Web Push keys (`npx web-push generate-vapid-keys`). Private key is **secret** |
| `VAPID_SUBJECT` | Vercel + local | `mailto:` contact for push services |
| `CRON_SECRET` | Vercel | Random string; Vercel Cron sends it to `/api/cron/reveals` |
| `VOICE_SIGNING_SECRET` | optional | Signs voice note paths; falls back to the service role key |

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
app/b/[slug]/og/     teaser link-preview image (sealed envelope)
app/api/             bouquets (create/edit/delete/view/mine/received/receive/links/chat), reactions, reports,
                     song, voice, garden/stats, push/(subscribe|prefs), cron/reveals
app/ai/callback/     OpenRouter sign-in return (noindex)
lib/bouquet/         art, catalog, composition (layout, SVG render), card schema, chat types, store, PNG/video/GIF export
lib/server/          bouquet loading, threads, personal links, chat grouping, song lookup, voice storage, push
lib/ai/              AI note writer providers + browser key storage
lib/pwa/             service worker registration, install prompt, push client, ask backoff
lib/garden/          streak and badge rules, badge share image
public/sw.js         service worker (app shell cache + Web Push)
lib/content/         flower meanings, occasions, guides (drives SEO pages + llms.txt)
lib/seo/             JSON-LD helpers, llms.txt generators
supabase/migrations/ SQL schema
```

## Abuse protection

Optional Cloudflare Turnstile, honeypot field, per-IP-hash rate limits (12 bouquets / 10 min, 60 / day; 30 reactions or chat messages / 10 min), a small blocklist for threats and slurs, one report per IP per bouquet, and auto-hide after 3 reports.

## Quality checks

`.github/workflows/ci.yml` runs lint, type-check, build and Lighthouse CI (`lighthouserc.json`: accessibility and SEO must be 100; performance and best practices warn below 90/95).

Last local audit (2026-09-30, production build):

| | Mobile | Desktop |
|---|---|---|
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| Performance | 92–94 (`/create` 85) | 99–100 |

- Mobile performance is capped by Lighthouse's simulated slow 4G, which counts the framework JavaScript. The real LCP is about 150ms.
- `/garden` scores lower on SEO by design: it is noindex.
- Vercel Analytics and Speed Insights render only when `VERCEL` is set, since their scripts 404 on other hosts.
- Tap targets are at least 24px, and every page is checked for horizontal overflow at 360, 768 and 1024px.

## Analytics

Events go to Firebase Analytics (GA4) and Clarity through `track()` in `lib/analytics/track.ts`.

**Loading and consent** (`components/analytics/consent.tsx`)
- EU/UK: nothing loads until the visitor accepts.
- Elsewhere: GA (first-party cookies) starts about 2s after page load, so visitors who never interact are still counted. Clarity (third-party cookies) waits for the first tap, scroll or key. A notice offers opt-out.
- Crawlers and automated browsers are skipped.
- Events fired before analytics load are queued (up to 50).
- Note text and names carry `data-clarity-mask`.

**Automatic events** (`components/analytics/listeners.tsx`, mounted in the root layout)

| Event | When | Params |
|---|---|---|
| `cta_clicked` | any link to `/create` | `cta_text`, `placement` (hero, header, footer, mobile_menu, section id), `destination` |
| `nav_clicked` | header, footer, mobile menu or breadcrumb link | `destination`, `link_text`, `placement` |
| `select_content` | link to an occasion, flower or guide page | `content_type`, `item_id`, `placement` |
| `web_vitals` | each Core Web Vital | `metric_name`, `metric_value` (CLS ×1000), `rating` |
| `page_not_found` | 404 page | — |
| any `data-track` | click on the element, or open for `<details>` | every `data-track-*` attribute, snake_cased |

Every automatic event also carries `page_path`. To track a new element, add `data-track="event_name"` plus any `data-track-some-param="value"` instead of writing a handler. `<TrackOnMount name="…" />` fires one event when a server-rendered page mounts.

**Product events**
- **Builder:** `builder_opened`, `preset_selected`, `flower_added`, `flower_removed`, `wrap_selected`, `shuffle_used`, `undo_used`, `redo_used`, `builder_step`, `message_idea_used`, `preview_opened`, `form_error`, `captcha_failed`, `bouquet_created`, `bouquet_edited`, `bouquet_send_failed`, `make_another_clicked`
  - `bouquet_created` carries every design choice: flower count, occasion, font, template, note mode, envelope colour, stickers, expiry, wrap, reveal, reply and message length.
- **Sharing:** `share_clicked` (`channel`, `where`), `personal_link_created`, `personal_link_deleted`, `image_downloaded`, `export_failed`
- **Recipient:**
  - `bouquet_viewed`: `is_creator`, `personal_link`, `occasion`, `flower_count`, `source` (the `utm_source` or referrer host)
  - `bouquet_locked_viewed`, `bouquet_unwrapped`, `note_opened`, `note_pinned`, `chat_toggled`, `reaction_sent`, `sender_reply_sent`, `send_back_clicked`, `report_opened`, `bouquet_reported`
- **My bouquets:** `garden_tab`, `sent_preview_opened`, `bouquet_deleted`, `received_removed`, `bouquets_claimed`, `sync_prompt_opened`, `sync_prompt_dismissed`, `login_started`, `login`, `signup_completed`, `auth_failed`, `password_reset_requested`
- **Consent and errors:** `consent_granted` (EU accept), `app_error`
- **AI note writer:** `ai_writer_opened`, `ai_setup_started`, `ai_key_connected` (`provider`, `method` paste|oauth, `remember`), `ai_key_failed` (`provider`, `reason`), `ai_oauth_started`, `ai_note_generated` (`provider`, `tone`, `tweak`), `ai_note_failed`, `ai_note_used`, `ai_key_disconnected`. The key, prompt and draft text are never sent.
- **Song and voice:** `song_added` (`provider`), `song_removed`, `song_played`, `voice_recorded` (`seconds`), `voice_removed`, `voice_mic_denied`, `voice_played`. `bouquet_created` also carries `has_song` and `has_voice`.
- **Garden stats:** `garden_stats_toggled`, `badge_earned_shown` (`badge`), `badge_shared`
- **Install and push:** `nudge_shown` / `nudge_accepted` / `nudge_dismissed` (`kind` push|install, `ask`), `install_clicked`, `install_prompt_result` (`outcome`, `where`), `install_dismissed`, `push_prompt_accepted`, `push_enabled` (`where`), `push_denied`, `push_prefs_changed`, `push_disabled`

**Traffic attribution.** Links shared through a channel carry `utm_source=<channel>&utm_medium=share` (`withUtm()`):
- Channels: whatsapp, telegram, x, sms, email, native_share, qr.
- Opens from in-app browsers, which send no referrer, then show up as that channel in GA instead of "direct".
- The copy-link URL stays clean.

**GA4 setup** (one-time, in the GA admin)
- Register the params you want in reports as custom dimensions: `placement`, `occasion`, `source`, `channel`, `flower_slug`, `metric_name`, `content_type`.
- Mark `bouquet_created`, `bouquet_unwrapped` and `signup_completed` as key events.
- Keep Enhanced measurement → "Page changes based on browser history events" on, so client-side route changes count as page views.
