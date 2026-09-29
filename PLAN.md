# Digital Flower Bouquet — Product & Build Plan

Status: v1 built 2026-09-29 (see README.md). All MVP items in section 3 are implemented, including optional sign-in (email magic link; Google behind a flag), edit after sending, link expiry, card stickers, and Turnstile (active once keys are set). Defaults chosen for open inputs: brand "Petalpost", visual direction A, coded SVG flowers.

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

### v2 (after launch, not in first build unless you say so)
- AI note writer ("help me write something cute / funny / deep") via Claude API.
- Song attachment (Spotify / YouTube link card) and voice note.
- Group bouquet: multiple friends each add a flower + message to one bouquet.
- Public "garden" gallery of opted-in bouquets.
- Streaks / badges, referral stats.
- More languages (Hindi, Spanish, etc.) with hreflang.
- PWA install + push ("your bouquet was opened").
- Monetization: premium flower packs, remove watermark, custom wrapper, physical flower delivery affiliate.

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, React 19, TypeScript) | SSG/SSR for SEO, route handlers, OG image generation, best on Vercel |
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
| Error tracking | Sentry (optional) | Production bugs |
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

---

## 9. Analytics & tracking

- **Microsoft Clarity**: heatmaps + session replays. Note text and names masked (`data-clarity-mask`) — private messages must never be recorded.
- **Firebase Analytics (GA4)**: funnels and retention.
- **Vercel Speed Insights + Analytics**: real-user Web Vitals.
- Cookie / consent banner (Google Consent Mode v2) — required if you have EU/UK users; recommended for India DPDP too.

Event taxonomy:

| Event | Key params |
|---|---|
| `builder_opened` | source (landing, preset, send_back, direct) |
| `preset_selected` | occasion |
| `flower_added` | flower_slug, count |
| `shuffle_used` | — |
| `note_written` | length_bucket, font |
| `bouquet_created` | flower_count, occasion, has_reveal_at |
| `share_clicked` | channel (native, whatsapp, copy, qr) |
| `image_downloaded` | format (square, story) |
| `bouquet_viewed` | is_creator |
| `bouquet_unwrapped` | time_to_unwrap_ms |
| `reaction_sent` | emoji |
| `send_back_clicked` | — |
| `signup_completed` | method |

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
