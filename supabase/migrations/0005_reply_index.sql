-- My bouquets looks up the bouquets sent back in reply to yours (reply_to in (...)); without this it scans the table.
create index if not exists bouquets_reply_to_idx on public.bouquets (reply_to) where reply_to is not null;
