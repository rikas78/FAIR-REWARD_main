-- Link ayeT's external_identifier to the authenticated FairReward user and
-- apply each ledger entry to the wallet exactly once.
create table if not exists public.user_external_identifiers (
  external_identifier text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists user_external_identifiers_user_id_idx
  on public.user_external_identifiers(user_id);

alter table public.user_reward_ledger
  add column if not exists wallet_applied_at timestamptz;

-- This FairReward ayeT placement is configured to pay users in EUR.
update public.user_reward_ledger
   set currency_identifier = 'EUR'
 where currency_identifier is null or btrim(currency_identifier) = '';

update public.ayet_conversions
   set currency_identifier = 'EUR'
 where currency_identifier is null or btrim(currency_identifier) = '';

create unique index if not exists wallets_user_id_uidx
  on public.wallets(user_id);

alter table public.user_external_identifiers enable row level security;

create or replace function public.reconcile_ayet_wallet(p_external_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_delta_cents bigint;
begin
  select user_id into v_user_id
  from public.user_external_identifiers
  where external_identifier = p_external_identifier;

  if v_user_id is null then
    return;
  end if;

  with pending as (
    select id, amount
    from public.user_reward_ledger
    where external_identifier = p_external_identifier
      and wallet_applied_at is null
      and upper(coalesce(currency_identifier, '')) = 'EUR'
    for update
  ),
  marked as (
    update public.user_reward_ledger l
       set wallet_applied_at = now()
      from pending p
     where l.id = p.id
    returning p.amount
  )
  select coalesce(round(sum(amount) * 100), 0)::bigint
    into v_delta_cents
  from marked;

  if v_delta_cents <> 0 then
    insert into public.wallets(user_id, available_cents)
    values (v_user_id, v_delta_cents)
    on conflict (user_id) do update
      set available_cents = coalesce(public.wallets.available_cents, 0) + excluded.available_cents;
  end if;
end;
$$;

revoke all on function public.reconcile_ayet_wallet(text) from public, anon, authenticated;
grant execute on function public.reconcile_ayet_wallet(text) to service_role;
