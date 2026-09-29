-- Indexes for the lookups the API makes on every page load, poll and write.

-- My bouquets: bouquets sent back in reply to yours (reply_to in (...)).
create index if not exists bouquets_reply_to_idx on public.bouquets (reply_to) where reply_to is not null;

-- My bouquets (signed in): the account's received list, newest first. The primary key leads with user_id but can't sort.
create index if not exists bouquet_receipts_user_created_idx on public.bouquet_receipts (user_id, created_at desc);
-- Deleting a bouquet cascades to receipts; without this each delete scans the table.
create index if not exists bouquet_receipts_bouquet_idx on public.bouquet_receipts (bouquet_id);

-- Reaction rate limit: messages from one IP in the last 10 minutes.
create index if not exists reactions_ip_created_idx on public.reactions (ip_hash, created_at desc) where ip_hash is not null;

-- Reports: one per IP per bouquet, and the auto-flag trigger counts reports per bouquet (also covers the cascade).
create index if not exists reports_bouquet_ip_idx on public.reports (bouquet_id, ip_hash);
