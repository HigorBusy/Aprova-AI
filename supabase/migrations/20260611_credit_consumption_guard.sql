create or replace function public.consume_essay_credit(
  p_description text default 'Correção de redação'
)
returns table (
  success boolean,
  balance integer,
  message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_balance integer;
  current_plan text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select profiles.plan_tag
  into current_plan
  from public.profiles as profiles
  where profiles.user_id = current_user_id;

  select credits.balance
  into current_balance
  from public.user_credits as credits
  where credits.user_id = current_user_id
  for update;

  if current_balance is null then
    return query select false, 0, 'credit_account_not_found'::text;
    return;
  end if;

  if current_plan = 'premium' then
    return query select true, current_balance, 'premium_no_charge'::text;
    return;
  end if;

  if current_balance <= 0 then
    return query select false, current_balance, 'insufficient_credits'::text;
    return;
  end if;

  update public.user_credits as credits
  set balance = credits.balance - 1
  where credits.user_id = current_user_id
    and credits.balance > 0
  returning credits.balance into current_balance;

  if current_balance is null then
    return query select false, 0, 'insufficient_credits'::text;
    return;
  end if;

  insert into public.credit_transactions (
    user_id,
    amount,
    type,
    description
  ) values (
    current_user_id,
    -1,
    'essay_correction',
    coalesce(nullif(trim(p_description), ''), 'Correção de redação')
  );

  return query select true, current_balance, 'credit_consumed'::text;
end;
$$;

revoke all on function public.consume_essay_credit(text) from public, anon;
grant execute on function public.consume_essay_credit(text) to authenticated;
