create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_user_created_idx
  on public.ai_messages (user_id, created_at desc);

alter table public.ai_messages enable row level security;

drop policy if exists ai_messages_select_own on public.ai_messages;
create policy ai_messages_select_own
  on public.ai_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.ai_messages from anon, authenticated;
grant select on public.ai_messages to authenticated;

alter table public.user_credits
  alter column balance set default 20;

alter table public.credit_transactions
  drop constraint if exists credit_transactions_type_check;

alter table public.credit_transactions
  add constraint credit_transactions_type_check
  check (
    type in (
      'initial_bonus',
      'essay_correction',
      'ai_chat',
      'essay_review',
      'purchase',
      'admin_adjustment'
    )
  );

with upgraded_bonus as (
  update public.credit_transactions
  set
    amount = 20,
    description = '20 creditos iniciais da conta free'
  where type = 'initial_bonus'
    and amount = 1
  returning user_id
)
update public.user_credits as credits
set balance = credits.balance + 19
where credits.user_id in (select user_id from upgraded_bonus);

create or replace function private.handle_new_aprova_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  credit_created uuid;
begin
  insert into public.profiles (
    id,
    user_id,
    email,
    name,
    full_name,
    plan_tag,
    premium
  ) values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Candidato'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Candidato'),
    'free',
    false
  )
  on conflict (id) do update
  set
    user_id = excluded.user_id,
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.user_credits (user_id, balance)
  values (new.id, 20)
  on conflict (user_id) do nothing
  returning id into credit_created;

  if credit_created is not null then
    insert into public.credit_transactions (
      user_id,
      amount,
      type,
      description
    ) values (
      new.id,
      20,
      'initial_bonus',
      '20 creditos iniciais da conta free'
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

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

  if p_cost not in (1, 5) then
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

revoke all on function public.complete_ai_exchange(text, text, integer, text, text)
  from public, anon;
grant execute on function public.complete_ai_exchange(text, text, integer, text, text)
  to authenticated;
