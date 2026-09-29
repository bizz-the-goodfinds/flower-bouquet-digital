-- Optional accounts: a signed-in creator owns their bouquets across devices.
alter table public.bouquets add column if not exists owner_id uuid references auth.users(id) on delete set null;
create index if not exists bouquets_owner_idx on public.bouquets (owner_id, created_at desc) where owner_id is not null;
