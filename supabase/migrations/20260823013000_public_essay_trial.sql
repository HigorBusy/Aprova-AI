create table if not exists public.free_essay_trials (
  id uuid primary key default gen_random_uuid(),
  device_hash text not null unique,
  cookie_hash text not null unique,
  ip_hash text not null,
  user_agent_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  theme text,
  score integer check (score between 0 and 1000),
  claimed_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists free_essay_trials_ip_claimed_idx
  on public.free_essay_trials (ip_hash, claimed_at desc);

alter table public.free_essay_trials enable row level security;
revoke all on table public.free_essay_trials from public, anon, authenticated;

create or replace function public.claim_free_essay_trial(
  p_device_hash text,
  p_cookie_hash text,
  p_ip_hash text,
  p_user_agent_hash text
)
returns table (
  success boolean,
  trial_id uuid,
  reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_trial_id uuid;
  ip_usage integer;
begin
  if length(p_device_hash) <> 64
    or length(p_cookie_hash) <> 64
    or length(p_ip_hash) <> 64
    or length(p_user_agent_hash) <> 64 then
    raise exception 'Invalid trial identity' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_ip_hash));

  delete from public.free_essay_trials
  where status = 'pending'
    and claimed_at < now() - interval '15 minutes';

  if exists (
    select 1
    from public.free_essay_trials
    where device_hash = p_device_hash
       or cookie_hash = p_cookie_hash
  ) then
    return query select false, null::uuid, 'trial_already_used'::text;
    return;
  end if;

  select count(*)::integer
  into ip_usage
  from public.free_essay_trials
  where ip_hash = p_ip_hash
    and claimed_at >= now() - interval '30 days';

  if ip_usage >= 3 then
    return query select false, null::uuid, 'network_limit_reached'::text;
    return;
  end if;

  insert into public.free_essay_trials (
    device_hash,
    cookie_hash,
    ip_hash,
    user_agent_hash
  ) values (
    p_device_hash,
    p_cookie_hash,
    p_ip_hash,
    p_user_agent_hash
  )
  returning id into new_trial_id;

  return query select true, new_trial_id, 'trial_reserved'::text;
end;
$$;

revoke all on function public.claim_free_essay_trial(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_free_essay_trial(text, text, text, text)
  to service_role;
