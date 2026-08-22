-- Rebalance only the welcome balance for accounts created after this migration.
-- Existing balances and transactions are intentionally preserved.
create or replace function private.handle_new_aprova_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_source text;
  is_paid_access boolean;
  initial_credits integer;
  credit_created uuid;
begin
  access_source := coalesce(new.raw_app_meta_data ->> 'access_source', '');
  is_paid_access := access_source = 'cakto_payment';
  initial_credits := case when is_paid_access then 0 else 3 end;

  insert into public.profiles (
    id, user_id, email, name, full_name, plan_tag, premium, is_blocked
  ) values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Candidato'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Candidato'),
    case when is_paid_access then 'premium' else 'free' end,
    is_paid_access,
    false
  )
  on conflict (id) do update
  set
    user_id = excluded.user_id,
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    is_blocked = false;

  insert into public.user_credits (user_id, balance)
  values (new.id, initial_credits)
  on conflict (user_id) do nothing
  returning id into credit_created;

  if credit_created is not null and initial_credits > 0 then
    insert into public.credit_transactions (user_id, amount, type, description)
    values (new.id, initial_credits, 'initial_bonus', 'Três correções completas gratuitas')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_aprova_user() from public, anon, authenticated;
