-- Threads, per-recipient links, sender/recipient chat and received bouquets.

-- A "send one back" chain shares the id of its first bouquet. Null means the bouquet starts its own thread.
alter table public.bouquets add column if not exists thread_id uuid;
update public.bouquets b
   set thread_id = coalesce(p.thread_id, p.id)
  from public.bouquets p
 where b.reply_to = p.slug and b.thread_id is null;
create index if not exists bouquets_thread_idx on public.bouquets (thread_id, created_at) where thread_id is not null;

-- Personal links: the same bouquet sent to several people, each with their own link, opens and chat.
create table if not exists public.bouquet_links (
  id          uuid primary key default gen_random_uuid(),
  bouquet_id  uuid not null references public.bouquets(id) on delete cascade,
  key         text not null check (key ~ '^[A-Za-z0-9]{6,12}$'),
  name        text not null check (char_length(name) between 1 and 60),
  view_count  int not null default 0,
  opened_at   timestamptz,
  created_at  timestamptz not null default now(),
  unique (bouquet_id, key)
);
alter table public.bouquet_links enable row level security;

-- Reactions become a chat: each conversation is one recipient (a personal link or a device) talking with the sender.
alter table public.reactions alter column emoji drop not null;
alter table public.reactions add column if not exists author text not null default 'recipient' check (author in ('recipient', 'sender'));
alter table public.reactions add column if not exists conversation text check (conversation ~ '^[ld]:[A-Za-z0-9_-]{6,32}$');
alter table public.reactions drop constraint if exists reactions_has_content;
alter table public.reactions add constraint reactions_has_content check (emoji is not null or reply is not null);
create index if not exists reactions_conversation_idx on public.reactions (bouquet_id, conversation, created_at);

-- Bouquets a signed-in person received, so they show up under My bouquets on every device.
create table if not exists public.bouquet_receipts (
  user_id       uuid not null references auth.users(id) on delete cascade,
  bouquet_id    uuid not null references public.bouquets(id) on delete cascade,
  conversation  text not null check (conversation ~ '^[ld]:[A-Za-z0-9_-]{6,32}$'),
  link_key      text,
  created_at    timestamptz not null default now(),
  primary key (user_id, bouquet_id)
);
alter table public.bouquet_receipts enable row level security;

create or replace function public.increment_link_view(p_bouquet uuid, p_key text) returns void
language sql security definer set search_path = public as $$
  update public.bouquet_links
     set view_count = view_count + 1, opened_at = coalesce(opened_at, now())
   where bouquet_id = p_bouquet and key = p_key;
$$;
revoke all on function public.increment_link_view(uuid, text) from public, anon, authenticated;
