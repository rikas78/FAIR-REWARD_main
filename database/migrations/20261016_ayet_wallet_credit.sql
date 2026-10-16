-- FairReward ayeT wallet credit. Apply to staging first; do not run test SQL against Supabase.
create table if not exists public.ayet_settings (
  singleton boolean primary key default true check (singleton),
  expected_currency text not null default 'EUR',
  max_reward_cents bigint not null default 100000 check (max_reward_cents > 0),
  updated_at timestamptz not null default now()
);
insert into public.ayet_settings(singleton, expected_currency) values (true, 'EUR')
on conflict (singleton) do nothing;

create table if not exists public.ayet_clicks (
  click_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  offer_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes'
);
create index if not exists ayet_clicks_user_created_idx on public.ayet_clicks(user_id, created_at desc);

create table if not exists public.ayet_callbacks (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null unique,
  event_type text not null check (event_type in ('conversion','chargeback')),
  external_identifier text not null,
  user_id uuid references public.profiles(id),
  click_id uuid,
  offer_id text,
  currency_identifier text,
  currency_amount numeric(18,6) not null,
  payout_usd numeric(18,6) not null default 0,
  status text not null,
  reason text,
  credited_cents bigint not null default 0 check (credited_cents >= 0),
  reversed_cents bigint not null default 0 check (reversed_cents >= 0),
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);
alter table public.ayet_settings enable row level security;
alter table public.ayet_clicks enable row level security;
alter table public.ayet_callbacks enable row level security;
revoke all on public.ayet_settings, public.ayet_clicks, public.ayet_callbacks from anon, authenticated;

create or replace function public.ayet_apply_callback(
  p_transaction_id text, p_external_identifier text, p_callback_type text,
  p_is_chargeback boolean, p_payout_usd numeric, p_currency_amount numeric,
  p_currency_identifier text, p_offer_id text, p_custom_1 text, p_payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
  v_click_user uuid;
  v_click uuid;
  v_original public.ayet_callbacks%rowtype;
  v_settings public.ayet_settings%rowtype;
  v_cents bigint;
  v_take bigint;
  v_pending bigint;
  v_available bigint;
  v_from_pending bigint;
  v_from_available bigint;
  v_base text;
begin
  if coalesce(btrim(p_transaction_id),'') = '' or coalesce(btrim(p_external_identifier),'') = '' then
    raise exception 'transaction_id and external_identifier are required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('ayet:' || regexp_replace(p_transaction_id, '^r-', ''), 0));
  if exists(select 1 from public.ayet_callbacks where transaction_id = p_transaction_id) then
    return jsonb_build_object('status','duplicate');
  end if;
  select * into v_settings from public.ayet_settings where singleton = true;
  if p_external_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select p.id into v_user from public.profiles p where p.id = p_external_identifier::uuid;
    if v_user is not null then
      insert into public.wallets(user_id) values(v_user) on conflict (user_id) do nothing;
    end if;
  end if;
  if p_custom_1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select c.click_id, c.user_id into v_click, v_click_user
      from public.ayet_clicks c where c.click_id = p_custom_1::uuid;
  end if;

  if p_is_chargeback then
    v_base := regexp_replace(p_transaction_id, '^r-', '');
    select * into v_original from public.ayet_callbacks
      where transaction_id = v_base and event_type = 'conversion' for update;
    if not found then
      insert into public.ayet_callbacks(transaction_id,event_type,external_identifier,user_id,click_id,offer_id,currency_identifier,currency_amount,payout_usd,status,reason,payload)
      values(p_transaction_id,'chargeback',p_external_identifier,v_user,v_click,p_offer_id,p_currency_identifier,p_currency_amount,p_payout_usd,'reversal_orphan','original_not_found',coalesce(p_payload,'{}'::jsonb));
      return jsonb_build_object('status','reversal_orphan');
    end if;
    v_cents := least(floor(abs(p_currency_amount)*100)::bigint, greatest(0,v_original.credited_cents-v_original.reversed_cents));
    if v_cents > 0 then
      select pending_cents, available_cents into v_pending, v_available
        from public.wallets where user_id = v_original.user_id for update;
      v_from_pending := least(coalesce(v_pending,0), v_cents);
      v_from_available := least(coalesce(v_available,0), v_cents-v_from_pending);
      v_take := v_from_pending + v_from_available;
      update public.wallets
         set pending_cents = pending_cents-v_from_pending,
             available_cents = available_cents-v_from_available,
             lifetime_earned_cents = greatest(0,lifetime_earned_cents-v_take),
             updated_at=now()
       where user_id = v_original.user_id;
      insert into public.wallet_transactions(user_id,type,amount_cents,currency,reference_type,reference_id,description)
      values(v_original.user_id,'reversal',-v_take,'EUR','ayet_chargeback',p_transaction_id,'ayeT reversal');
      update public.ayet_callbacks set reversed_cents = reversed_cents+v_take where transaction_id=v_base;
      v_cents := v_take;
    end if;
    insert into public.ayet_callbacks(transaction_id,event_type,external_identifier,user_id,click_id,offer_id,currency_identifier,currency_amount,payout_usd,status,credited_cents,payload)
    values(p_transaction_id,'chargeback',p_external_identifier,v_original.user_id,v_original.click_id,p_offer_id,p_currency_identifier,p_currency_amount,p_payout_usd,'reversal_applied',v_cents,coalesce(p_payload,'{}'::jsonb));
    return jsonb_build_object('status','reversal_applied','reversed_cents',v_cents);
  end if;

  if v_user is null then
    insert into public.ayet_callbacks(transaction_id,event_type,external_identifier,user_id,click_id,offer_id,currency_identifier,currency_amount,payout_usd,status,reason,payload)
    values(p_transaction_id,'conversion',p_external_identifier,null,v_click,p_offer_id,p_currency_identifier,p_currency_amount,p_payout_usd,'unattributed','unknown_user',coalesce(p_payload,'{}'::jsonb));
    return jsonb_build_object('status','unattributed');
  end if;
  if v_click is null or v_click_user is distinct from v_user then
    insert into public.ayet_callbacks(transaction_id,event_type,external_identifier,user_id,click_id,offer_id,currency_identifier,currency_amount,payout_usd,status,reason,payload)
    values(p_transaction_id,'conversion',p_external_identifier,v_user,v_click,p_offer_id,p_currency_identifier,p_currency_amount,p_payout_usd,'rejected','click_missing_or_user_mismatch',coalesce(p_payload,'{}'::jsonb));
    return jsonb_build_object('status','rejected','reason','click_missing_or_user_mismatch');
  end if;
  if p_currency_identifier is distinct from v_settings.expected_currency then
    insert into public.ayet_callbacks(transaction_id,event_type,external_identifier,user_id,click_id,offer_id,currency_identifier,currency_amount,payout_usd,status,reason,payload)
    values(p_transaction_id,'conversion',p_external_identifier,v_user,v_click,p_offer_id,p_currency_identifier,p_currency_amount,p_payout_usd,'rejected','currency_mismatch',coalesce(p_payload,'{}'::jsonb));
    return jsonb_build_object('status','rejected','reason','currency_mismatch');
  end if;
  v_cents := floor(p_currency_amount*100)::bigint;
  if v_cents <= 0 or v_cents > v_settings.max_reward_cents then
    insert into public.ayet_callbacks(transaction_id,event_type,external_identifier,user_id,click_id,offer_id,currency_identifier,currency_amount,payout_usd,status,reason,payload)
    values(p_transaction_id,'conversion',p_external_identifier,v_user,v_click,p_offer_id,p_currency_identifier,p_currency_amount,p_payout_usd,'rejected','invalid_or_over_limit_amount',coalesce(p_payload,'{}'::jsonb));
    return jsonb_build_object('status','rejected','reason','invalid_or_over_limit_amount');
  end if;
  update public.wallets set pending_cents=pending_cents+v_cents, lifetime_earned_cents=lifetime_earned_cents+v_cents, updated_at=now() where user_id=v_user;
  if not found then raise exception 'wallet_missing'; end if;
  insert into public.wallet_transactions(user_id,type,amount_cents,currency,reference_type,reference_id,description)
  values(v_user,'reward',v_cents,'EUR','ayet_conversion',p_transaction_id,'ayeT conversion pending');
  insert into public.ayet_callbacks(transaction_id,event_type,external_identifier,user_id,click_id,offer_id,currency_identifier,currency_amount,payout_usd,status,credited_cents,payload)
  values(p_transaction_id,'conversion',p_external_identifier,v_user,v_click,p_offer_id,p_currency_identifier,p_currency_amount,p_payout_usd,'credited',v_cents,coalesce(p_payload,'{}'::jsonb));
  return jsonb_build_object('status','credited','user_id',v_user,'credited_cents',v_cents);
end $$;
revoke all on function public.ayet_apply_callback(text,text,text,boolean,numeric,numeric,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.ayet_apply_callback(text,text,text,boolean,numeric,numeric,text,text,text,jsonb) to service_role;
