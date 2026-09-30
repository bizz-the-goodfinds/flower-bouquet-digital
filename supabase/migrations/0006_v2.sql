-- v2: song and voice notes, referrals, badges, push notifications.
-- Like the rest of the schema, everything is read and written by route handlers with the service role,
-- so RLS is on with no public policies.

-- Song: a validated Spotify / YouTube / Apple Music link with its oEmbed title, artist and thumbnail.
alter table public.bouquets add column if not exists song jsonb;
-- Voice note: object path in the private `voice-notes` bucket and its length in seconds.
alter table public.bouquets add column if not exists voice_path text check (voice_path ~ '^b/[0-9a-f-]{36}\.(webm|m4a|ogg|mp3)$');
alter table public.bouquets add column if not exists voice_seconds int check (voice_seconds between 1 and 60);
-- The bouquet whose link brought this sender here ("Send one back" or any link carrying ?ref=).
alter table public.bouquets add column if not exists ref_bouquet_id uuid references public.bouquets(id) on delete set null;
create index if not exists bouquets_ref_idx on public.bouquets (ref_bouquet_id) where ref_bouquet_id is not null;
-- Set once the sender has been told a scheduled bouquet opened up.
alter table public.bouquets add column if not exists reveal_notified_at timestamptz;
create index if not exists bouquets_reveal_pending_idx on public.bouquets (reveal_at) where reveal_at is not null and reveal_notified_at is null;

-- Private bucket for voice notes, played back through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice-notes', 'voice-notes', false, 2097152, array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- No policies on storage.objects for this bucket: anon and authenticated can't list, read or write it.
-- Uploads and signed URLs go through the service role only.

-- Rate limiting for things that aren't rows elsewhere (voice uploads).
create table if not exists public.rate_events (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('voice_upload')),
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_kind_ip_idx on public.rate_events (kind, ip_hash, created_at desc);
alter table public.rate_events enable row level security;

-- Web Push subscriptions. The endpoint is unguessable and acts as the device's secret for its own settings.
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  user_id     uuid references auth.users(id) on delete cascade,
  prefs       jsonb not null default '{"opened": true, "chat": true, "reveal": true}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id) where user_id is not null;
alter table public.push_subscriptions enable row level security;
drop trigger if exists push_subscriptions_touch on public.push_subscriptions;
create trigger push_subscriptions_touch before update on public.push_subscriptions
  for each row execute function public.touch_updated_at();

-- Bouquets a signed-out device proved it owns (edit token) when subscribing.
create table if not exists public.push_bouquets (
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  bouquet_id      uuid not null references public.bouquets(id) on delete cascade,
  primary key (subscription_id, bouquet_id)
);
create index if not exists push_bouquets_bouquet_idx on public.push_bouquets (bouquet_id);
alter table public.push_bouquets enable row level security;

-- Badges earned by an account (devices without an account keep theirs locally).
create table if not exists public.badges (
  user_id    uuid not null references auth.users(id) on delete cascade,
  badge      text not null check (badge ~ '^[a-z0-9_]{2,32}$'),
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge)
);
alter table public.badges enable row level security;

-- Referral stats: distinct people (by IP hash) who sent a bouquet after opening one of yours.
create or replace view public.bouquet_referrals with (security_invoker = true) as
  select ref_bouquet_id as bouquet_id, count(distinct coalesce(ip_hash, id::text))::int as people
    from public.bouquets
   where ref_bouquet_id is not null and deleted_at is null
   group by ref_bouquet_id;
revoke all on public.bouquet_referrals from public, anon, authenticated;
