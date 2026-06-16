create or replace function public.complete_ai_exchange(
  p_user_content text,
  p_assistant_content text,
  p_cost integer,
  p_transaction_type text,
  p_description text
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
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_cost not in (1, 2, 3, 5) then
    raise exception 'Invalid credit cost' using errcode = '22023';
  end if;

  select credits.balance
  into current_balance
  from public.user_credits as credits
  where credits.user_id = current_user_id
  for update;

  if current_balance is null then
    return query select false, 0, 'credit_account_not_found'::text;
    return;
  end if;

  if current_balance < p_cost then
    return query select false, current_balance, 'insufficient_credits'::text;
    return;
  end if;

  update public.user_credits as credits
  set balance = credits.balance - p_cost
  where credits.user_id = current_user_id
  returning credits.balance into current_balance;

  insert into public.credit_transactions (
    user_id,
    amount,
    type,
    description
  ) values (
    current_user_id,
    -p_cost,
    p_transaction_type,
    coalesce(nullif(trim(p_description), ''), 'Uso do Comandante IA')
  );

  insert into public.ai_messages (user_id, role, content)
  values
    (current_user_id, 'user', trim(p_user_content)),
    (current_user_id, 'assistant', trim(p_assistant_content));

  return query select true, current_balance, 'ai_exchange_completed'::text;
end;
$$;

revoke all on function public.complete_ai_exchange(text, text, integer, text, text)
  from public, anon;
grant execute on function public.complete_ai_exchange(text, text, integer, text, text)
  to authenticated;
