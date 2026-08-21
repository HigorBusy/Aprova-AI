create table if not exists public.cakto_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event text not null,
  order_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_accesses (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  customer_name text,
  order_id text not null unique,
  ref_id text,
  activation_code_hash text not null,
  product_id text,
  product_name text,
  offer_id text,
  offer_name text,
  plan_tag text not null default 'premium' check (plan_tag in ('free', 'premium')),
  credits integer not null default 0 check (credits >= 0),
  status text not null default 'pending' check (status in ('pending', 'claimed', 'revoked', 'expired')),
  expires_at timestamptz not null,
  claimed_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchase_accesses_email_status_idx
  on public.purchase_accesses (email, status, created_at desc);

create index if not exists purchase_accesses_ref_id_idx
  on public.purchase_accesses (ref_id);

alter table public.cakto_webhook_events enable row level security;
alter table public.purchase_accesses enable row level security;

revoke all on public.cakto_webhook_events from anon, authenticated;
revoke all on public.purchase_accesses from anon, authenticated;

alter table public.credit_transactions
  drop constraint if exists credit_transactions_type_check;

alter table public.credit_transactions
  add constraint credit_transactions_type_check
  check (
    type in (
      'initial_bonus',
      'essay_review',
      'essay_correction',
      'ai_chat',
      'purchase',
      'admin_adjustment'
    )
  );

create schema if not exists private;

create or replace function private.handle_new_aprova_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_source text;
  is_paid_access boolean;
begin
  access_source := coalesce(new.raw_app_meta_data ->> 'access_source', '');
  is_paid_access := access_source = 'cakto_payment';

  insert into public.profiles (
    id,
    user_id,
    email,
    name,
    full_name,
    plan_tag,
    premium,
    is_blocked
  ) values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Candidato'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Candidato'),
    case when is_paid_access then 'premium' else 'free' end,
    is_paid_access,
    not is_paid_access
  )
  on conflict (id) do update
  set
    user_id = excluded.user_id,
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    is_blocked = case
      when is_paid_access then false
      else public.profiles.is_blocked
    end;

  insert into public.user_credits (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_aprova on auth.users;
create trigger on_auth_user_created_aprova
after insert on auth.users
for each row execute function private.handle_new_aprova_user();
