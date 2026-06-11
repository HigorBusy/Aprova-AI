create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists email text,
  add column if not exists name text,
  add column if not exists plan_tag text not null default 'free',
  add column if not exists updated_at timestamptz not null default now();

update public.profiles as profiles
set
  user_id = profiles.id,
  email = users.email,
  name = coalesce(profiles.name, profiles.full_name, 'Candidato'),
  plan_tag = case when profiles.premium then 'premium' else 'free' end,
  updated_at = now()
from auth.users as users
where users.id = profiles.id;

alter table public.profiles
  alter column user_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_user_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_user_id_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_user_id_key unique (user_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_plan_tag_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_tag_check
      check (plan_tag in ('free', 'premium'));
  end if;
end
$$;

create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance integer not null default 1 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  type text not null check (
    type in ('initial_bonus', 'essay_correction', 'purchase', 'admin_adjustment')
  ),
  description text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_transactions_initial_bonus_once
  on public.credit_transactions (user_id, type)
  where type = 'initial_bonus';

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

create policy user_credits_select_own
  on public.user_credits
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy credit_transactions_select_own
  on public.credit_transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, name, quiz_profile, daily_goal_minutes)
  on public.profiles to authenticated;

revoke insert, update, delete on public.user_credits from anon, authenticated;
revoke insert, update, delete on public.credit_transactions from anon, authenticated;
grant select on public.user_credits to authenticated;
grant select on public.credit_transactions to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.sync_profile_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.premium, false) or new.plan_tag = 'premium' then
      new.premium := true;
      new.plan_tag := 'premium';
    else
      new.premium := false;
      new.plan_tag := 'free';
    end if;
  elsif new.plan_tag is distinct from old.plan_tag then
    new.premium := (new.plan_tag = 'premium');
  elsif new.premium is distinct from old.premium then
    new.plan_tag := case when new.premium then 'premium' else 'free' end;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists profiles_sync_plan on public.profiles;
create trigger profiles_sync_plan
before insert or update of plan_tag, premium on public.profiles
for each row execute function private.sync_profile_plan();

drop trigger if exists user_credits_set_updated_at on public.user_credits;
create trigger user_credits_set_updated_at
before update on public.user_credits
for each row execute function private.set_updated_at();

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
  values (new.id, 1)
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
      1,
      'initial_bonus',
      'CrÃ©dito inicial da conta free'
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_aprova on auth.users;
create trigger on_auth_user_created_aprova
after insert on auth.users
for each row execute function private.handle_new_aprova_user();

with inserted_credits as (
  insert into public.user_credits (user_id, balance)
  select users.id, 1
  from auth.users as users
  on conflict (user_id) do nothing
  returning user_id
)
insert into public.credit_transactions (
  user_id,
  amount,
  type,
  description
)
select
  inserted_credits.user_id,
  1,
  'initial_bonus',
  'CrÃ©dito inicial da conta free'
from inserted_credits
on conflict do nothing;
