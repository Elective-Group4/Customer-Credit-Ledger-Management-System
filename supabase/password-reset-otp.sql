create table if not exists public.password_reset_otps (
  email text primary key,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  reset_token_hash text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.password_reset_otps enable row level security;

revoke all on table public.password_reset_otps from anon, authenticated;
