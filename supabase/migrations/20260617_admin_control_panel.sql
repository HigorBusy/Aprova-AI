create schema if not exists private;

alter table public.profiles
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_at timestamptz,
  add column if not exists last_seen_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_plan_tag_check;

alter table public.profiles
  add constraint profiles_plan_tag_check
  check (plan_tag in ('free', 'premium', 'ADM'));

update public.profiles
set plan_tag = 'ADM'
where lower(email) = 'spacekase925@gmail.com';

create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_messages_user_unread_idx
  on public.admin_messages (user_id, created_at desc)
  where read_at is null;

create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen_at desc);

alter table public.admin_messages enable row level security;

revoke all on public.admin_messages from anon, authenticated;
grant select on public.admin_messages to authenticated;
grant update (read_at) on public.admin_messages to authenticated;

drop policy if exists admin_messages_select_own on public.admin_messages;
create policy admin_messages_select_own
  on public.admin_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists admin_messages_mark_read_own on public.admin_messages;
create policy admin_messages_mark_read_own
  on public.admin_messages
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function private.is_aprova_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as users
    join public.profiles as profiles on profiles.id = users.id
    where users.id = p_user_id
      and lower(users.email) = 'spacekase925@gmail.com'
      and profiles.plan_tag = 'ADM'
      and not profiles.is_blocked
  );
$$;

create or replace function private.touch_aprova_presence()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  blocked boolean;
begin
  if current_user_id is null then
    return false;
  end if;

  select profiles.is_blocked
  into blocked
  from public.profiles as profiles
  where profiles.id = current_user_id;

  if coalesce(blocked, false) then
    return false;
  end if;

  update public.profiles
  set last_seen_at = now()
  where id = current_user_id;

  return found;
end;
$$;

create or replace function private.admin_list_aprova_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  plan_tag text,
  balance integer,
  is_blocked boolean,
  last_seen_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_aprova_admin() then
    raise exception 'Acesso administrativo negado.' using errcode = '42501';
  end if;

  return query
  select
    users.id,
    users.email::text,
    coalesce(profiles.name, profiles.full_name, 'Candidato')::text,
    coalesce(profiles.plan_tag, 'free')::text,
    coalesce(credits.balance, 0)::integer,
    coalesce(profiles.is_blocked, false),
    profiles.last_seen_at,
    users.created_at
  from auth.users as users
  left join public.profiles as profiles on profiles.id = users.id
  left join public.user_credits as credits on credits.user_id = users.id
  order by users.created_at desc;
end;
$$;

create or replace function private.admin_add_five_credits(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_balance integer;
begin
  if not private.is_aprova_admin() then
    raise exception 'Acesso administrativo negado.' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuario nao encontrado.' using errcode = 'P0002';
  end if;

  insert into public.user_credits (user_id, balance)
  values (p_user_id, 5)
  on conflict (user_id) do update
  set balance = public.user_credits.balance + 5,
      updated_at = now()
  returning balance into new_balance;

  insert into public.credit_transactions (user_id, amount, type, description)
  values (p_user_id, 5, 'admin_adjustment', 'Bonus de 5 creditos enviado pelo administrador');

  return new_balance;
end;
$$;

create or replace function private.admin_set_aprova_blocked(p_user_id uuid, p_blocked boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_aprova_admin() then
    raise exception 'Acesso administrativo negado.' using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'A conta administradora nao pode bloquear a si mesma.' using errcode = '22023';
  end if;

  update public.profiles
  set
    is_blocked = p_blocked,
    blocked_at = case when p_blocked then now() else null end
  where id = p_user_id;

  if not found then
    raise exception 'Usuario nao encontrado.' using errcode = 'P0002';
  end if;

  return p_blocked;
end;
$$;

create or replace function private.admin_send_aprova_message(p_user_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_message_id uuid;
  clean_message text := trim(p_message);
begin
  if not private.is_aprova_admin() then
    raise exception 'Acesso administrativo negado.' using errcode = '42501';
  end if;

  if char_length(clean_message) < 1 or char_length(clean_message) > 500 then
    raise exception 'A mensagem deve ter entre 1 e 500 caracteres.' using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuario nao encontrado.' using errcode = 'P0002';
  end if;

  insert into public.admin_messages (user_id, sender_id, message)
  values (p_user_id, auth.uid(), clean_message)
  returning id into new_message_id;

  return new_message_id;
end;
$$;

create or replace function public.touch_user_presence()
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.touch_aprova_presence();
$$;

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  plan_tag text,
  balance integer,
  is_blocked boolean,
  last_seen_at timestamptz,
  created_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.admin_list_aprova_users();
$$;

create or replace function public.admin_add_credits(p_user_id uuid)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.admin_add_five_credits(p_user_id);
$$;

create or replace function public.admin_set_user_blocked(p_user_id uuid, p_blocked boolean)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.admin_set_aprova_blocked(p_user_id, p_blocked);
$$;

create or replace function public.admin_send_message(p_user_id uuid, p_message text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.admin_send_aprova_message(p_user_id, p_message);
$$;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_aprova_admin(uuid) to authenticated;
grant execute on function private.touch_aprova_presence() to authenticated;
grant execute on function private.admin_list_aprova_users() to authenticated;
grant execute on function private.admin_add_five_credits(uuid) to authenticated;
grant execute on function private.admin_set_aprova_blocked(uuid, boolean) to authenticated;
grant execute on function private.admin_send_aprova_message(uuid, text) to authenticated;

revoke all on function public.touch_user_presence() from public, anon;
revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_add_credits(uuid) from public, anon;
revoke all on function public.admin_set_user_blocked(uuid, boolean) from public, anon;
revoke all on function public.admin_send_message(uuid, text) from public, anon;

grant execute on function public.touch_user_presence() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_add_credits(uuid) to authenticated;
grant execute on function public.admin_set_user_blocked(uuid, boolean) to authenticated;
grant execute on function public.admin_send_message(uuid, text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_messages'
  ) then
    alter publication supabase_realtime add table public.admin_messages;
  end if;
end
$$;
