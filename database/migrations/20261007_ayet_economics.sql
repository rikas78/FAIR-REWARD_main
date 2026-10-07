create table if not exists public.ayet_conversions (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  external_identifier text not null,
  event_type text not null default 'conversion',
  payout_usd numeric(18,6) not null default 0,
  currency_amount numeric(18,6) not null default 0,
  currency_identifier text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ayet_conversions_external_identifier_idx
  on public.ayet_conversions(external_identifier);

create table if not exists public.user_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  external_identifier text not null,
  transaction_id text not null unique,
  entry_type text not null,
  amount numeric(18,6) not null,
  currency_identifier text,
  provider_payout_usd numeric(18,6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_reward_ledger_external_identifier_idx
  on public.user_reward_ledger(external_identifier);

create table if not exists public.platform_revenue (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  revenue_type text not null,
  provider_payout_usd numeric(18,6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ayet_conversions enable row level security;
alter table public.user_reward_ledger enable row level security;
alter table public.platform_revenue enable row level security;
