# Flower Bouquet Digital — Product & Build Plan

Status (2026-09-30): v1, v1.1 and v1.2 are built. v2 (AI note writer with bring-your-own-key, song and voice notes, streaks/badges/referral stats, PWA install and push, Sentry) is planned; see section 3. Monetization is v3. Brand: **Flower Bouquet Digital**. See "Build status" at the end of this file for what is done and what remains.

---

## 1. Product in one line

A free, no-signup web app where anyone can arrange a digital bouquet by hand, attach a handwritten-style note, and send it as a link that "unwraps" beautifully on the recipient's phone. Built for Gen Z: aesthetic, fast, meme-able, made to be shared on WhatsApp, Instagram Stories and TikTok.

Core loop (the growth engine):

```
Build bouquet → Share link → Recipient unwraps → "Send one back" → Build bouquet → ...
```

Every received bouquet is an ad for the product. The "send one back" button is the single most important CTA.

---

## 2. Target users & occasions

- Gen Z / young millennials, 15–30, mobile-first (90%+ traffic will be phones).
- Use cases: birthday, anniversary, crush / "situationship", apology, best friend, get well, graduation, Mother's Day, Valentine's, Galentine's, long-distance, "just because", condolence.
- Seasonal spikes to plan content around: Valentine's (Feb), Women's Day (Mar), Mother's Day (May), Friendship Day (Aug), Diwali / festive, Christmas / New Year.

---

## 3. Feature scope

### MVP (v1 — the "one go" build)

**Builder**
- Pick a wrapper (paper style) and background.
- Add flowers, fillers and greenery from a tray (up to ~12 stems).
- Drag, rotate, scale, flip, bring forward / send back. Touch-first gestures.
- "Shuffle" button: auto-arranges selected flowers into a nice bouquet (key for users who don't want to fiddle).
- Undo / redo, reset.
- Presets per occasion ("Birthday bunch", "Sorry bouquet") for a 1-tap start.
- Flower meaning shown on long-press / hover (floriography — also feeds SEO).

**Note card**
- To / From / message (max ~500 chars).
- 4–6 card styles, 3–4 handwriting fonts, optional emoji stickers.

**Share**
- Unique short link: `/b/{slug}` (8-char nanoid).
- Dynamic Open Graph image per bouquet (link previews on WhatsApp / iMessage / X show the actual bouquet).
- One-tap share: native share sheet, WhatsApp, copy link, QR code.
- Download: PNG (square) and 9:16 story image for Instagram / TikTok.
- Optional: scheduled reveal ("opens on her birthday at 00:00"), link expiry.

**Recipient view**
- Envelope / wrapped state → tap to unwrap → flowers bloom in with stagger animation → card flips open.
- React with an emoji + short reply (sender sees it if logged in).
- Big "Send one back 💐" CTA.

**Accounts (optional, never forced)**
- Anonymous by default. Creator gets a private edit token stored in the browser.
- Optional sign-in (Google + email magic link) to keep a "my garden" history of sent / received bouquets and see reactions.

**Content / SEO pages**
- Landing page, How it works, FAQ.
- Flower meaning pages: `/flowers/{rose|tulip|sunflower|...}`.
- Occasion pages: `/occasions/{birthday|apology|...}` with ready presets.
- Blog/guides: "What flowers to give for an apology", "Flower meanings by color", etc.

**Trust & safety**
- Cloudflare Turnstile (invisible captcha) on bouquet creation.
- Rate limit per IP.
- Profanity / abuse filter on note text, report button on recipient view.
- Shared bouquet pages are `noindex` (private by default).

### v2 (planned 2026-09-30, one-go build)

Five features. Dropped from v2: group bouquet, public "garden" gallery, more languages. Monetization moved to v3.

**1. AI note writer: bring your own key**
- A "Help me write" button on the Write step. The sender picks a tone (cute, funny, deep, romantic, sorry, short and sweet) and can add a few details ("we met at uni", "she loves cats"). The recipient name and occasion are filled in for them. The writer returns 3 drafts; tapping one puts it in the note, where it can be edited. Follow-up buttons: "Shorter", "More emoji", "Try again". Drafts stay within the 500-character note limit.
- **We never pay for AI and never hold keys.** Each user connects their own AI account in one of two ways:
  - **Paste a key** from OpenAI (ChatGPT), Anthropic (Claude) or Google (Gemini). Gemini has a free tier, so the guide suggests it to people without a paid account.
  - **Sign in with OpenRouter.** This uses OpenRouter's OAuth flow (PKCE): the user logs in, approves, and comes back with a key. No copy-pasting. One OpenRouter account covers models from every major provider.
- **Built-in guides.** A setup sheet walks through each provider: where to sign up, the exact page for creating a key, whether it's free or paid (with a rough cost per note, a fraction of a cent), and how to set a spending limit. A "Test key" button confirms the key works before it is saved. The same guides are published as a public page, `/guides/ai-note-writer-api-key`, which also works as SEO/AEO content.
- **Key safety.**
  - The key stays in the user's browser. By default it lasts for the session only; a "Remember on this device" option keeps it in localStorage.
  - The browser calls the provider directly (all four support browser requests), so the key never reaches our server, database, logs, analytics or Clarity recordings. The key field is masked in Clarity and Sentry.
  - "Disconnect" deletes it.
  - Fallback, only if a provider blocks browser calls: a pass-through route that forwards the request without storing or logging it.
- Default models are each provider's cheap, fast tier (Claude: Haiku 4.5; the others are picked at build time). An advanced setting lets users change the model.
- The system prompt keeps drafts kind and on-occasion. Drafts still go through the existing note moderation when the bouquet is created.
- Errors get plain messages: invalid key, out of credit, rate limited, provider down.
- Analytics events: `ai_setup_started`, `ai_key_connected` (provider, method), `ai_note_generated` (provider, tone), `ai_note_used`. Never the key, the prompt or the draft text.

**2. Song and voice note**
- **Song.** The sender pastes a Spotify, YouTube or Apple Music link. The server validates it and fetches the title, artist and thumbnail through each service's oEmbed endpoint (no API keys needed). The recipient sees a small song card after the note; tapping it loads the embedded player. The player only loads on tap, so no third-party cookies are set before then and autoplay rules aren't an issue. PNG, video and GIF exports show the song card as a static image.
- **Voice note.**
  - Recorded in the browser, up to 60 seconds, with preview, re-record and delete.
  - Uploaded to a private Supabase Storage bucket (`voice-notes`, max 2 MB) and played through a short-lived signed URL.
  - Deleted along with its bouquet. Covered by rate limits and the report flow.
  - Plays after the note on the recipient page. Chrome records WebM/Opus and Safari records MP4/AAC; playback is tested on iOS Safari, Android Chrome and in-app browsers.
- Both are optional and are added from the Write step.

**3. Streaks, badges and referral stats**
- **Streak:** the number of weeks in a row the user has sent at least one bouquet. Weekly, not daily, because nobody sends flowers every day.
- **Badges:** first bouquet; 5, 25 and 100 sent; first reply received; a thread 5 deep; every occasion used once; first voice note; first song. Earned badges get a small celebration and a shareable badge image.
- **Referral stats:** "3 people sent their first bouquet after opening one of yours." Counted when a recipient creates a bouquet from the "Send one back" link or another link carrying `ref`. Opens and reactions per bouquet are already tracked.
- Shown in a "Your garden" stats strip at the top of My bouquets. Works on a device without an account and syncs once signed in.

**4. PWA install and push notifications**
- **Service worker.** Caches the app shell and static assets so the builder opens fast and survives a flaky connection. Private bouquet pages and API responses are never cached.
- **Install.** An "Add to home screen" button uses the browser's install prompt on Android and desktop Chrome/Edge. iOS gets a short illustrated "Share → Add to Home Screen" sheet. The button is offered after a user's second bouquet, not on first visit.
- **Push.**
  - Permission is asked in context, after sending: "Want to know when Sam opens it?"
  - Notifications:
    - bouquet opened for the first time (for personal links, per recipient)
    - new chat message or reaction
    - a scheduled bouquet has been revealed
  - Sent from our API with Web Push (VAPID) when the event is recorded. Subscriptions live in a new `push_subscriptions` table tied to the owner token or account.
  - Users choose which notifications they get in My bouquets, and can turn them all off.
  - iOS only supports push for apps added to the home screen (iOS 16.4+). The UI says so instead of failing silently.

**5. Sentry error tracking**
- `@sentry/nextjs` on client, server and edge, with source maps uploaded on each Vercel build and a tunnel route so ad blockers don't drop reports.
- Scrubbing: note text, names, emails, AI keys and provider request bodies never leave the browser or server. Replays are off.
- Sample rates are kept inside the free tier. Alerts go to email for new issues and error spikes.

**Supporting work**
- Migration `0006_v2.sql`:
  - song and voice columns on bouquets
  - `voice-notes` storage bucket and policies
  - `push_subscriptions` table
  - `badges` table
  - `ref_bouquet_id` on bouquets
  - streak/stats view
  - RLS for all of the above
- Privacy policy and terms: AI providers (keys stay in the browser; text goes straight to the chosen provider), voice storage, embedded players, push, Sentry. FAQ entries and llms.txt updated.
- New dependencies: `web-push` (server) and `@sentry/nextjs`. No AI SDKs; plain `fetch` keeps the bundle small.
- QA: the existing overflow, CTA and Lighthouse checks must still pass, plus tests for mic permission, push permission and install on real iOS and Android devices.

**Build order for v2**
1. Migration + types.
2. Sentry, so the rest of the build is monitored.
3. AI note writer + guides page.
4. Song + voice note (Write step, recipient page, exports).
5. Streaks, badges, referral stats.
6. Service worker, install, push.
7. Privacy/terms/FAQ/llms.txt, analytics events, QA pass.

### v3 (later)
- Monetization: premium flower packs, removing the watermark, custom wrappers, and an affiliate link for real flower delivery.
- Commissioned flower art. This pairs with premium packs.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React 19, TypeScript) | SSG/SSR for SEO, route handlers, OG image generation, best on Vercel |
| Styling | Tailwind CSS v4 + CSS variables for tokens | Fast, themeable |
| Animation | Motion (Framer Motion) | Unwrap / bloom / card flip |
| Builder canvas | SVG + pointer events (custom), `@use-gesture/react` for pinch/rotate | Crisp at any size, easy PNG export, light bundle vs Konva |
| State | Zustand (+ zundo for undo/redo) | Tiny, simple |
| Validation | Zod | Shared client/server schemas |
| DB / Auth / Storage | Supabase (Postgres + RLS, Auth, Storage) | As requested |
| Hosting | Vercel (Edge + Node runtimes, ISR) | As requested |
| OG images | `next/og` (Satori) | Per-bouquet preview images at the edge |
| Image export | `html-to-image` / SVG → canvas | Client-side PNG + story export |
| Analytics | Microsoft Clarity + Firebase Analytics (GA4) + Vercel Speed Insights | Heatmaps/replays + funnels + real-user Core Web Vitals |
| Bot protection | Cloudflare Turnstile | Free, invisible |
| Error tracking | Sentry (v2) | Production bugs |
| AI note writer | User's own key: OpenAI, Anthropic, Gemini or OpenRouter (OAuth), called from the browser (v2) | No AI cost for us, no keys on our servers |
| Push | Web Push (VAPID) via `web-push` + service worker (v2) | "Your bouquet was opened" |
| Fonts | `next/font` self-hosted | No layout shift, no third-party font request |

---

## 5. Architecture

```
Browser (Next.js client)
   │  builder state (Zustand) ── export PNG locally
   │
   ▼
Vercel
   ├─ Static/ISR pages: landing, /flowers/*, /occasions/*, /blog/*   (SEO)
   ├─ /b/[slug]         SSR recipient page (noindex, OG meta)
   ├─ /b/[slug]/opengraph-image   edge OG image
   ├─ /api/bouquets     POST create (Turnstile + rate limit + moderation)
   ├─ /api/bouquets/[slug]  PATCH (edit token) / GET
   └─ /api/reactions    POST
   │
   ▼
Supabase
   ├─ Postgres (RLS on every table)
   ├─ Auth (anonymous + Google + magic link)
   └─ Storage (flower SVG/PNG assets, rendered bouquet images)
```

Writes go through Next.js route handlers using the service role key (server-only), so we can enforce Turnstile, rate limits and moderation in one place. Reads of public catalog data (flowers, wrappers) use the anon key with RLS.

---

## 6. Database schema (Supabase / Postgres) — proposed

```sql
-- Catalog
create table flowers (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,          -- 'red-rose'
  name        text not null,                  -- 'Red Rose'
  kind        text not null check (kind in ('flower','filler','greenery')),
  meaning     text,                           -- floriography
  colors      text[] default '{}',
  asset_path  text not null,                  -- storage path to SVG/PNG
  width       int, height int,                -- natural size for layout
  is_premium  boolean default false,
  sort_order  int default 0,
  active      boolean default true
);

create table wrappers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null,
  back_asset_path text not null,              -- layer behind stems
  front_asset_path text not null,             -- layer in front of stems
  is_premium boolean default false, sort_order int default 0, active boolean default true
);

-- Users (optional accounts)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Bouquets
create type bouquet_visibility as enum ('unlisted','public');

create table bouquets (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,                 -- nanoid(8), used in URL
  owner_id        uuid references profiles(id) on delete set null,
  edit_token_hash text,                                 -- for anonymous creators
  schema_version  int not null default 1,
  composition     jsonb not null,                       -- see below
  wrapper_id      uuid references wrappers(id),
  background      text,
  occasion        text,
  recipient_name  text check (char_length(recipient_name) <= 60),
  sender_name     text check (char_length(sender_name) <= 60),
  message         text check (char_length(message) <= 500),
  card_style      jsonb,                                -- {template, font, color, stickers[]}
  visibility      bouquet_visibility not null default 'unlisted',
  reveal_at       timestamptz,
  expires_at      timestamptz,
  image_path      text,                                 -- rendered PNG in storage
  view_count      int not null default 0,
  is_flagged      boolean not null default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz
);
create index on bouquets (owner_id, created_at desc);

-- composition jsonb shape:
-- { "items": [ { "flowerId": "uuid", "x": 0.42, "y": 0.31, "rotation": -12,
--                "scale": 1.1, "flipX": false, "z": 3 } ],
--   "canvas": { "w": 1000, "h": 1250 } }

-- Recipient reactions
create table reactions (
  id uuid primary key default gen_random_uuid(),
  bouquet_id uuid not null references bouquets(id) on delete cascade,
  emoji text not null,
  reply text check (char_length(reply) <= 280),
  created_at timestamptz default now()
);

-- Moderation
create table reports (
  id uuid primary key default gen_random_uuid(),
  bouquet_id uuid not null references bouquets(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now()
);
```

RLS summary:
- `flowers`, `wrappers`: public `select` where `active`.
- `bouquets`: no direct public select; recipient page reads via a `security definer` RPC `get_bouquet(slug)` that hides `edit_token_hash`, respects `reveal_at` / `expires_at` / `deleted_at`, and increments `view_count`.
- `bouquets` insert/update: server only (service role) — anon creators prove ownership with the edit token.
- `profiles`: users read/update own row.
- `reactions`: insert via server; bouquet owner can select reactions on their bouquets.

If you already have a schema in mind, share it and I will adapt to it instead.

---

## 7. Brand: name, logo, fonts, colors

### Name shortlist (availability NOT yet checked — I will verify domains + social handles once you pick)
1. **petalpost** — "send petals like a post". Clear, sayable, verb-friendly ("petalpost me").
2. **posy** — a posy is a small bouquet. Short, cute. Likely taken as .com; try posy.gg / getposy.
3. **bloomdrop** — Gen Z "drop" culture. Good for seasonal "drops" of new flowers.
4. **stemz** — playful, lowercase meme energy.
5. **sendbloom** — very SEO-literal (good for "send flowers online free" intent).
6. **bouq** — short slang for bouquet; "bouq me".

My pick: **petalpost** (best balance of meaning, memorability and SEO), fallback **bloomdrop**.

### Visual direction — pick one
**A. Soft editorial (recommended)**
Cream paper with subtle grain, hand-drawn watercolor/ink flowers, big elegant serif headlines, tiny mono labels. Feels like a Pinterest moodboard / indie zine. Timeless, screenshot-friendly.
- Fonts: Instrument Serif (display), Geist or Inter (UI), Geist Mono (labels), Caveat / Homemade Apple / Nanum Pen Script (card handwriting).
- Colors: cream `#FBF6EE`, ink `#1B1A17`, petal pink `#F4A6C0`, sage `#9DB59A`, butter `#F7DE8A`, lilac `#C9B8F2`, tomato accent `#E8553E`.

**B. Y2K / pixel-cute**
Pixel-art flowers, chunky borders, sticker energy, Windows-98-style card windows. Very viral on TikTok, less "premium".
- Fonts: Silkscreen / Press Start 2P (display), Space Grotesk (UI).

**C. Dreamy 3D / glossy**
Soft 3D clay flowers, gradients, glassmorphism. Most "wow", heaviest to produce assets for.

### Logo
Wordmark in the display serif, lowercase, with a small single-stem flower mark that doubles as favicon / app icon. I will deliver: SVG logo (full + mark), favicon set, apple-touch-icon, default OG image, and a 1-page brand sheet (colors, fonts, usage). Dark mode variants included.

### Flower artwork (biggest quality lever — decision needed)
The product lives or dies on how pretty the flowers look. Options:
1. You provide / commission illustrator art (best, unique). Need ~20 flowers + 6 greenery + 6 wrappers as transparent PNG (2x) or SVG.
2. Licensed pack (e.g. Creative Market watercolor florals) — fast, cheap, check commercial + app-use license.
3. AI-generated then cleaned/vectorized — fast, variable quality, check ownership terms.
4. I code stylized SVG flowers myself — consistent flat/minimal look, fully owned, free, but less "painterly". Good placeholder for launch.

---

## 8. SEO, AEO, GEO plan ("100%" targets)

Realistic goal: Lighthouse 100/100/100/100 on landing and content pages, all Core Web Vitals "good" in field data, zero Search Console errors, and full structured-data coverage. The builder page will target 95+ performance because it is interactive.

### Technical SEO
- SSG/ISR for every indexable page; recipient pages `noindex, nofollow`.
- Per-page `generateMetadata`: unique title (≤60 chars), description (≤155), canonical, OG + Twitter cards.
- `sitemap.xml` (auto-generated, split by type), `robots.txt`.
- Clean URLs, breadcrumbs, internal linking between flowers ↔ occasions ↔ guides.
- Core Web Vitals budgets: LCP < 1.8s, INP < 150ms, CLS < 0.05, JS on landing < 90KB gz.
- Images: AVIF/WebP via `next/image`, explicit sizes, lazy below fold; flower sprites preloaded only in builder.
- Fonts: `next/font`, `display: swap`, subset, max 3 families on critical path.
- Accessibility (WCAG 2.2 AA): builder fully keyboard operable, alt text, focus states, reduced-motion support. Accessibility also feeds SEO score.

### Structured data (JSON-LD)
- `Organization`, `WebSite` (+ SearchAction if we add search).
- `WebApplication` on landing (free, category LifestyleApplication, offers price 0).
- `FAQPage` on FAQ and occasion pages.
- `HowTo` on "How to send a digital bouquet".
- `Article` + `BreadcrumbList` on guides and flower pages.
- `CollectionPage` + `ItemList` on the occasions, flowers and guides hubs; `AboutPage` on About.

### AEO (answer engines: Google AI Overviews, featured snippets, voice)
- Every content page opens with a 40–60 word direct answer, then detail.
- Question-shaped H2s ("What does a yellow rose mean?").
- Comparison tables and lists (snippet-friendly).
- FAQ blocks with schema on every occasion page.

### GEO (generative engines: ChatGPT, Perplexity, Claude, Gemini)
- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended.
- `/llms.txt` and `/llms-full.txt` describing the product, pages and flower-meaning dataset.
- Consistent entity description everywhere (same one-sentence definition of the product on site, socials, directories).
- Original, citable content: a proper flower-meaning dataset (by flower × color × culture), "most sent flowers" stats from our own anonymized data.
- Listings: Product Hunt, There's An AI For That–style directories, Reddit/Pinterest presence (sources LLMs pull from).

### Content plan at launch
- ~25 flower meaning pages, ~12 occasion pages, ~8 guides, FAQ. All written for humans first, with presets that link straight into the builder.

### Status (2026-09-30)
Local production build, Lighthouse 12:

| | Mobile | Desktop |
|---|---|---|
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| Performance | 92–94 (`/create` 85) | 99–100 |

- **Done:**
  - Every structured-data type above except SearchAction (there's no site search yet).
  - A direct answer at the top of every content page, and FAQ schema on the home, FAQ, occasion, flower and guide pages.
  - `robots.txt` welcomes AI crawlers, and `llms.txt` + `llms-full.txt` are generated from the content files.
  - The same one-sentence product definition (`site.definition`) is used everywhere.
- **Mobile performance gap:** Lighthouse's slow-4G simulation counts the framework JavaScript, which caps the score. The real LCP is about 150ms. Getting to 100 would mean cutting React/Next runtime code, which isn't worth it. The builder is heavy on purpose.
- **Not 100 on purpose:** `/garden` is private (noindex), so its SEO score stays low by design.
- **Still open:**
  - Submit the sitemap to Search Console and Bing.
  - Directory listings (Product Hunt and similar).
  - A citable "most sent flowers" stat from our own anonymized data.
  - Rankings and AI citations depend on content and backlinks over time; code can't guarantee them.

---

## 9. Analytics & tracking

- **Microsoft Clarity:** heatmaps and session replays. Note text and names are masked (`data-clarity-mask`); private messages must never be recorded.
- **Firebase Analytics (GA4):** funnels, retention and traffic sources.
- **Vercel Speed Insights + Analytics:** real-user Web Vitals (rendered only on Vercel).

### Loading and consent (built)
- **EU/UK (detected by timezone):** opt-in banner. Nothing loads until the visitor accepts.
- **Elsewhere:** a notice with opt-out.
  - GA uses first-party cookies and starts about 2s after page load, so visitors who never interact are still counted.
  - Clarity sets third-party cookies, so it waits for the first tap, scroll or key.
- Crawlers and automated browsers are skipped.
- Events fired before analytics load are queued.

### What is tracked (built)
The full event and parameter reference is in README.md → Analytics. In short:
- **Automatic, site-wide** (`components/analytics/listeners.tsx`): `cta_clicked` (with placement: hero, header, footer, section), `nav_clicked`, `select_content` (occasion, flower or guide opened), `faq_opened`, `mobile_menu_opened`, `web_vitals`, `page_not_found`. Any element can be tracked by adding `data-track="event"` and `data-track-*` params.
- **Builder funnel:** opened, preset, flowers added/removed, wrap, shuffle, undo/redo, step changes, message ideas, preview, send failures, captcha failures.
  - `bouquet_created` carries every design choice (template, font, note mode, envelope, stickers, expiry, wrap, reveal, reply, message length).
- **Sharing:** channel clicks, personal links created/deleted, downloads and export failures.
- **Recipient:** viewed (with source, occasion, personal link), locked view, unwrapped, note opened/pinned, chat toggled, reactions, replies, send-back, reports.
- **My bouquets:** tabs, previews, deletes, claims, sign-in/sign-up (including failures), password resets, sync prompt.

### Traffic attribution (built)
- Share links carry `utm_source=<channel>&utm_medium=share`.
  - Channels: whatsapp, telegram, x, sms, email, native_share, qr.
  - Without these tags, opens from in-app browsers (which send no referrer) would show as "direct".
- The copy-link URL stays clean.

### GA4 admin (to do once)
- Register `placement`, `occasion`, `source`, `channel`, `flower_slug`, `metric_name` and `content_type` as custom dimensions.
- Mark `bouquet_created`, `bouquet_unwrapped` and `signup_completed` as key events.
- Keep Enhanced measurement → "Page changes based on browser history events" on.

### Questions the data should answer
- Where do bouquets get lost? The drop-off from `builder_opened` → `builder_step: card` → `preview_opened` → `bouquet_created`.
- Which options and presets lead to sent bouquets?
- Which share channel brings the most opens? `bouquet_viewed.source` shows this.
- How many recipients unwrap, react or send one back?
- Which landing sections and content pages drive `cta_clicked`?

North-star metric: **bouquets opened per week**. Viral coefficient = send-back bouquets created ÷ bouquets opened.

---

## 10. Pages & routes

```
/                         landing (hero bouquet animation, CTA, how it works, FAQ)
/create                   builder (?preset=birthday, ?replyTo=slug)
/create/note              note step (or same page, step 2)
/b/[slug]                 recipient view (noindex)
/b/[slug]/edit            edit with token
/garden                   my bouquets (logged in)
/flowers                  flower meanings index
/flowers/[slug]           single flower meaning
/occasions/[slug]         occasion page + presets
/guides/[slug]            articles
/faq, /about, /privacy, /terms
/llms.txt, /llms-full.txt, /sitemap.xml, /robots.txt
```

---

## 11. Project structure

```
app/
  (marketing)/page.tsx, faq/, about/, flowers/, occasions/, guides/
  create/                 builder
  b/[slug]/               recipient view + opengraph-image.tsx
  garden/
  api/bouquets/, api/reactions/, api/reports/
  sitemap.ts, robots.ts, llms.txt/route.ts
components/
  builder/  (Canvas, FlowerTray, Toolbar, Stem, ShuffleButton)
  card/     (NoteCard, FontPicker)
  reveal/   (Envelope, Bloom, CardFlip)
  ui/       (Button, Sheet, Toast ...)
lib/
  supabase/ (client.ts, server.ts, admin.ts)
  analytics/ (track.ts → Clarity + Firebase)
  seo/      (jsonld.ts, metadata.ts)
  composition/ (schema.ts, shuffle.ts, export.ts)
content/    (flowers.json, occasions MDX, guides MDX)
supabase/
  migrations/  seed.sql
public/     (icons, fonts fallback)
```

---

## 12. Build order (one-go plan)

1. Scaffold Next.js + Tailwind + tokens + fonts + lint/format.
2. Supabase migrations, RLS, seed catalog, typed client.
3. Brand kit: logo SVGs, favicons, default OG image.
4. Builder: canvas, tray, gestures, shuffle, undo/redo, presets.
5. Note card step.
6. Create API (Turnstile, rate limit, moderation) + share sheet + QR + PNG/story export.
7. Recipient page: unwrap/bloom/card animations, reactions, send-back.
8. Dynamic OG image.
9. Optional auth + garden.
10. Marketing + content pages, JSON-LD, sitemap, robots, llms.txt.
11. Clarity + Firebase + consent banner + event wiring.
12. Accessibility + performance pass (Lighthouse CI), cross-device QA (iOS Safari, Android Chrome, in-app browsers: Instagram, WhatsApp).
13. Vercel deploy, domain, Search Console + Bing Webmaster submission.

---

## 13. Risks

- **Art quality** — mitigated by picking an asset strategy up front (section 7).
- **Abuse / harassment via notes** — Turnstile, rate limits, filter, report button, takedown flow.
- **In-app browsers** (Instagram/WhatsApp webviews) break some share and download APIs — explicit fallbacks and testing.
- **"100% SEO"** — lab scores can be 100; rankings and AI citations depend on content and backlinks over time, not only code.

---

## 14. Inputs needed before build

See the checklist in the chat reply / below.

1. Reference site link you mentioned ("like this one").
2. Name choice (or your own) + whether a domain is already bought.
3. Visual direction: A, B or C.
4. Flower artwork option: 1, 2, 3 or 4 (and files if 1/2).
5. Supabase: project URL, anon key, service role key (put in `.env.local`, not chat), or your own DB schema.
6. Firebase web app config (apiKey, authDomain, projectId, appId, measurementId).
7. Microsoft Clarity project ID.
8. Vercel: team/account, and GitHub repo to connect.
9. Cloudflare Turnstile site key + secret key.
10. Auth: anonymous only, or also Google / magic link?
11. Target markets / languages (affects consent banner, content, hreflang).
12. Include any v2 features in first build? (AI note writer needs an Anthropic API key.)
13. Monetization now, later, or never?

---

## 15. Build status (updated 2026-09-30)

### Done
- Builder: 31 flowers/fillers + 4 greenery, 8 wrap shapes (cone, tissue wrap, sleeve, hat box, vase, layered, basket, mason jar) × 20 papers, 14 ribbons, 14 backgrounds; drag, pinch/rotate, keyboard, undo/redo, shuffle, surprise, occasion presets; picker order Wrap → Wrap colour → Flowers → Fillers & greens → Ribbon → Background; clickable steps; tooltips; fits one screen on every size.
- Card: 6 templates, 6 letter fonts (Playfair Display, Handlee, Playwrite CA Guides, Cutive Mono, Sacramento, Bitcount Single), 18 stickers, envelope colour/seal/liner, scheduled reveal, link expiry; live bouquet + card preview.
- Preview before sending: full-screen replay of exactly what the recipient sees, with Keep editing / Replay / Send at the top.
- Sharing: short link, dynamic OG image per bouquet (and per occasion/flower/guide page), WhatsApp/Telegram/X/SMS/email/native share, QR, PNG post + 9:16 story, MP4/WebM video and GIF of the full opening (envelope → bloom → card).
- Recipient: envelope → unwrap → bloom → card; reactions + reply; send one back; save image/video/GIF; report; fits one screen on desktop.
- Accounts (optional): email + password without email verification, sync across devices, claim device bouquets, forgot password, edit/delete sent bouquets.
- Safety: honeypot, IP-hash rate limits (bouquets, reactions, sign-ups), blocklist, reports with auto-hide, noindex bouquet pages, Turnstile ready.
- SEO/AEO/GEO: 42 indexable pages with unique titles/descriptions/canonicals/OG, JSON-LD (Organization, WebSite, WebApplication, FAQ, HowTo, Article, Breadcrumb), sitemap, robots (AI crawlers allowed), llms.txt + llms-full.txt, favicon/PNG/maskable icons, manifest.
- Analytics: Clarity + Firebase + Vercel, consent (EU/UK opt-in), typed events, masked notes.
- Error pages (404, bouquet not found, error boundary, global error), privacy policy and terms updated.
- QA: overflow checks on every page at 9 widths, CTA visibility at 10 viewports, Lighthouse CI in GitHub Actions.

### v1.1 (2026-09-30)
- Link previews tease instead of spoil: the OG image is the sender's own envelope (from the Write step) with "from X / break the seal" copy; share texts updated to match.
- Video/GIF: the first frame is the sender's envelope (no more blank/black cover), the petal rain from the recipient page is baked in, and every frame (and PNG) carries a logo + wordmark pill.
- Loaders: bouquet-themed loader (flowers bloom into a little cone) for route loading and edits, flower spinner in buttons, petal-shimmer skeletons in My bouquets.
- Received bouquets: opening someone's bouquet adds it to My bouquets → Received (device, or account when signed in).
- Chat: reactions became a chat between the sender and each recipient, themed like the note cards; the sender replies from their preview.
- Threads: "send one back" chains share a thread; My bouquets groups them into one connected row; the recipient page shows "Earlier in this thread".
- Several recipients: personal links per person (their name on the envelope, their own opens and chat).
- My bouquets cards show a one-line summary ("Sam and 2 others reacted ❤️", new badge) instead of the full reactions; "Preview" replays the bouquet without counting an open.
- Opened bouquet is bouquet-first and fits one screen: the note is a florist card tucked into the bouquet (tap: it flies out and unfolds; "Tuck it back" returns it), and chat, thread and extras live in a small floating dock that can be hidden (unread badge; opens itself after the note is first read).
- Note display is a preference: the sender picks "Tucked in" (a gift tag hanging off the ribbon on a string, clear of the flowers; tap to open) or "Pinned" (always shown beside the bouquet) on the Write step; the recipient can pin/unpin it themselves (remembered per bouquet). Video and GIF follow the sender's choice: pinned slides the card up under the bouquet, tucked shows the tag on the ribbon, then flies it out and unfolds it.
- Catalog: 3 new wraps (layered, basket, mason jar) = 8; 8 new papers incl. stripes, hearts, gingham and starry prints = 20; 7 new ribbons = 14; 7 new backgrounds incl. 3 dark = 14.
- Needs: run migration `0004_threads_chat_links.sql` before deploying (the recipient page reads the new columns).

### v1.2 (2026-09-30): analytics, SEO and mobile polish
- **Analytics.** GA starts about 2s after load, so visitors who bounce are counted. Clarity still waits for an interaction, and bots are skipped.
  - Site-wide auto-tracking: CTA, nav and content clicks, FAQ opens, the mobile menu, Web Vitals and 404s. Any element can be tracked with `data-track` attributes.
  - Funnel events across the builder, sharing, the recipient view and My bouquets.
  - `bouquet_created` records every design choice.
  - Share links are UTM-tagged per channel.
- **SEO/AEO/GEO.**
  - CollectionPage/ItemList schema on the hubs and AboutPage on About.
  - Fixed the FAQ heading order, the logo's accessible name and a double period in llms.txt.
  - Vercel scripts render only on Vercel.
  - Lighthouse: accessibility, best practices and SEO are 100 on every public page. Performance is 99–100 on desktop and 92–94 on mobile.
- **Mobile/tablet.**
  - Footer links and breadcrumbs meet the 24px tap-target minimum, with a two-column footer on phones.
  - Occasion flower descriptions no longer cut off mid-word.
  - No overflow at 360, 768 or 1024px.
- **Privacy policy** updated for GA load timing and UTM tags.

### Remaining (needs you or a decision)
- GA4 admin: register the event params as custom dimensions, mark `bouquet_created`, `bouquet_unwrapped` and `signup_completed` as key events, and keep history-based page views on (see README → Analytics).
- Vercel: attach `flower-bouquet-digital.vercel.app` to the project, turn off Deployment Protection for Production, set env vars.
- Supabase: add `/auth/callback` redirect URLs; add custom SMTP (e.g. Resend) so password-reset emails are branded and not rate-limited.
- Rotate the database password and service-role key that were shared in chat.
- Optional keys: Cloudflare Turnstile; Google OAuth (then set `NEXT_PUBLIC_AUTH_GOOGLE=1`).
- A real contact email for the privacy/terms pages.
- Submit the sitemap to Google Search Console and Bing Webmaster Tools; verify Clarity masking on production.
- Sign-ups are not email-verified, so someone could register an email they don't own. Acceptable for syncing bouquets; revisit before adding anything sensitive.

### v2 inputs (needed before the v2 build)
1. **Sentry:** DSN, org slug and project slug (not secret), and an auth token for source maps (secret: put it in Vercel env and `.env.local`, not chat).
2. **Web Push:** a contact email for the VAPID `mailto:` subject (it can be the same as the privacy/terms contact email). The VAPID key pair gets generated during the build and goes into Vercel env.
3. **AI testing:** your own key for at least one provider, or an OpenRouter account, entered in the app to test it, not in chat. No app registration is needed on our side, including for OpenRouter sign-in.
4. **Supabase:** run `0006_v2.sql` after the build (it also creates the `voice-notes` bucket).
5. **Decisions** (defaults in section 3 are used unless you say otherwise): which AI providers to support, whether the key is remembered by default, voice note length (60s), song sources (Spotify, YouTube, Apple Music), weekly streaks, push triggers.

### Not started
- v2: everything in section 3 → v2.
- v3: monetization, commissioned flower art.
