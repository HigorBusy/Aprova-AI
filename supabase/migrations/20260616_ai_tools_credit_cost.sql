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

  if p_cost not in (1, 2, 5) then
    raise exception 'Invalid credit cost' using errcode = '22023';
  end if;

  if p_transaction_type not in ('ai_chat', 'essay_review') then
    raise exception 'Invalid transaction type' using errcode = '22023';
  end if;

  if nullif(trim(p_user_content), '') is null
    or nullif(trim(p_assistant_content), '') is null then
    raise exception 'Messages cannot be empty' using errcode = '22023';
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

  return query select true, current_balance, 'exchange_completed'::text;
end;
$$;
