-- FairReward: define the wallet schema in version control and restrict
-- browser access to the authenticated wallet owner.
--
-- The server-side service role continues to reconcile balances through
-- reconcile_ayet_wallet. Authenticated clients may only read their own wallet.

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fail loudly rather than silently applying owner policies to an unexpected
-- pre-existing table created manually with an incompatible schema.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallets'
      and column_name = 'user_id'
      and data_type = 'uuid'
  ) then
    raise exception 'public.wallets must contain user_id uuid; reconcile the existing schema before applying this migration';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallets'
      and column_name = 'available_cents'
      and data_type = 'bigint'
  ) then
    raise exception 'public.wallets must contain available_cents bigint; reconcile the existing schema before applying this migration';
  end if;
end;
$$;

alter table public.wallets enable row level security;

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own"
  on public.wallets
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.wallets from anon;
revoke insert, update, delete on public.wallets from authenticated;
grant select on public.wallets to authenticated;

-- No client-side write policy is intentionally provided. Balance changes
-- must be performed by trusted server-side database functions only.
