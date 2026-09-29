-- Digital flower bouquet: core schema.
-- All reads and writes go through Next.js route handlers using the service role,
-- so RLS is enabled with no public policies (anon/authenticated get nothing directly).

create extension if not exists pgcrypto;

create table if not exists public.bouquets (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[A-Za-z0-9_-]{6,16}$'),
  edit_token_hash text not null,
  schema_version  int  not null default 1,
  composition     jsonb not null,
  wrapper         text not null,
  background      text not null,
  occasion        text,
  recipient_name  text check (char_length(recipient_name) <= 60),
  sender_name     text check (char_length(sender_name) <= 60),
  message         text check (char_length(message) <= 500),
  card_style      jsonb not null default '{}'::jsonb,
  reveal_at       timestamptz,
  expires_at      timestamptz,
  reply_to        text,
  view_count      int not null default 0,
  is_flagged      boolean not null default false,
  ip_hash         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists bouquets_ip_hash_created_idx on public.bouquets (ip_hash, created_at desc);
create index if not exists bouquets_created_idx on public.bouquets (created_at desc);

create table if not exists public.reactions (
  id          uuid primary key default gen_random_uuid(),
  bouquet_id  uuid not null references public.bouquets(id) on delete cascade,
  emoji       text not null check (char_length(emoji) <= 16),
  reply       text check (char_length(reply) <= 280),
  ip_hash     text,
  created_at  timestamptz not null default now()
);
create index if not exists reactions_bouquet_idx on public.reactions (bouquet_id, created_at desc);

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  bouquet_id  uuid not null references public.bouquets(id) on delete cascade,
  reason      text not null check (char_length(reason) <= 500),
  ip_hash     text,
  created_at  timestamptz not null default now()
);

alter table public.bouquets  enable row level security;
alter table public.reactions enable row level security;
alter table public.reports   enable row level security;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists bouquets_touch on public.bouquets;
create trigger bouquets_touch before update on public.bouquets
  for each row execute function public.touch_updated_at();

-- Atomic view counter, called when a recipient unwraps a bouquet.
create or replace function public.increment_bouquet_view(p_slug text) returns void
language sql security definer set search_path = public as $$
  update public.bouquets set view_count = view_count + 1
  where slug = p_slug and deleted_at is null;
$$;
revoke all on function public.increment_bouquet_view(text) from public, anon, authenticated;

-- Auto-hide a bouquet after 3 reports.
create or replace function public.flag_after_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports where bouquet_id = new.bouquet_id) >= 3 then
    update public.bouquets set is_flagged = true where id = new.bouquet_id;
  end if;
  return new;
end $$;

drop trigger if exists reports_flag on public.reports;
create trigger reports_flag after insert on public.reports
  for each row execute function public.flag_after_reports();
