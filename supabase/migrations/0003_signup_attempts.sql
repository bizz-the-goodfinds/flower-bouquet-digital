-- Rate limiting for password sign-ups (accounts are created server-side without email verification).
create table if not exists public.signup_attempts (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index if not exists signup_attempts_ip_idx on public.signup_attempts (ip_hash, created_at desc);
alter table public.signup_attempts enable row level security;
