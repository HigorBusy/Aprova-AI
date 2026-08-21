alter table public.cakto_webhook_events
  add column if not exists processed_at timestamptz,
  add column if not exists processing_error text;

create or replace function public.claim_purchase_access(
  p_access_id uuid,
  p_user_id uuid,
  p_email text,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_access public.purchase_accesses%rowtype;
  next_balance integer;
begin
  update public.purchase_accesses
  set
    status = 'claimed',
    claimed_user_id = p_user_id,
    claimed_at = now(),
    updated_at = now()
  where id = p_access_id
    and status = 'pending'
    and expires_at > now()
  returning * into claimed_access;

  if not found then
    raise exception 'purchase_access_not_claimable' using errcode = 'P0001';
  end if;

  insert into public.profiles (
    id,
    user_id,
    email,
    name,
    full_name,
    plan_tag,
    premium,
    is_blocked,
    blocked_at,
    updated_at
  ) values (
    p_user_id,
    p_user_id,
    p_email,
    p_name,
    p_name,
    claimed_access.plan_tag,
    claimed_access.plan_tag = 'premium',
    false,
    null,
    now()
  )
  on conflict (id) do update
  set
    user_id = excluded.user_id,
    email = excluded.email,
    name = excluded.name,
    full_name = excluded.full_name,
    plan_tag = excluded.plan_tag,
    premium = excluded.premium,
    is_blocked = false,
    blocked_at = null,
    updated_at = now();

  insert into public.user_credits (user_id, balance, updated_at)
  values (p_user_id, claimed_access.credits, now())
  on conflict (user_id) do update
  set
    balance = greatest(0, public.user_credits.balance) + claimed_access.credits,
    updated_at = now()
  returning balance into next_balance;

  insert into public.credit_transactions (
    user_id,
    amount,
    type,
    description
  ) values (
    p_user_id,
    claimed_access.credits,
    'purchase',
    'Créditos liberados pela compra ' || coalesce(claimed_access.ref_id, claimed_access.order_id)
  );

  return jsonb_build_object(
    'credits', claimed_access.credits,
    'balance', next_balance,
    'plan_tag', claimed_access.plan_tag
  );
end;
$$;

revoke all on function public.claim_purchase_access(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_purchase_access(uuid, uuid, text, text) to service_role;

create or replace function public.revoke_purchase_access(
  p_order_id text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  revoked_access public.purchase_accesses%rowtype;
  next_balance integer;
begin
  update public.purchase_accesses
  set
    status = 'revoked',
    raw_event = p_payload,
    updated_at = now()
  where order_id = p_order_id
    and status in ('pending', 'claimed')
  returning * into revoked_access;

  if not found then
    return jsonb_build_object('revoked', false);
  end if;

  if revoked_access.claimed_user_id is not null then
    update public.profiles
    set
      is_blocked = true,
      blocked_at = now(),
      premium = false,
      plan_tag = 'free',
      updated_at = now()
    where id = revoked_access.claimed_user_id
       or user_id = revoked_access.claimed_user_id;

    update public.user_credits
    set
      balance = greatest(0, balance - revoked_access.credits),
      updated_at = now()
    where user_id = revoked_access.claimed_user_id
    returning balance into next_balance;

    insert into public.credit_transactions (
      user_id,
      amount,
      type,
      description
    ) values (
      revoked_access.claimed_user_id,
      -revoked_access.credits,
      'purchase',
      'Estorno de créditos da compra ' || coalesce(revoked_access.ref_id, revoked_access.order_id)
    );
  end if;

  return jsonb_build_object(
    'revoked', true,
    'user_id', revoked_access.claimed_user_id,
    'balance', next_balance
  );
end;
$$;

revoke all on function public.revoke_purchase_access(text, jsonb) from public, anon, authenticated;
grant execute on function public.revoke_purchase_access(text, jsonb) to service_role;

revoke all on function private.handle_new_aprova_user() from public, anon, authenticated;
