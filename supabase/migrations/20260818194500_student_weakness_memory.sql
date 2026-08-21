create table if not exists public.user_weaknesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competency text not null check (competency in ('C1', 'C2', 'C3', 'C4', 'C5')),
  weakness_type text not null,
  frequency integer not null default 1 check (frequency > 0),
  severity smallint not null default 1 check (severity between 1 and 3),
  latest_score integer not null check (latest_score between 0 and 200),
  status text not null default 'active' check (status in ('active', 'improving', 'resolved')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, competency)
);

create index if not exists user_weaknesses_user_priority_idx
  on public.user_weaknesses (user_id, status, severity desc, frequency desc);

alter table public.user_weaknesses enable row level security;

drop policy if exists user_weaknesses_select_own on public.user_weaknesses;
create policy user_weaknesses_select_own
  on public.user_weaknesses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_weaknesses from anon;
revoke insert, update, delete on public.user_weaknesses from authenticated;
grant select on public.user_weaknesses to authenticated;

create or replace function private.sync_essay_weaknesses()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  competency_score record;
  next_severity smallint;
begin
  for competency_score in
    select * from (values
      ('C1', new.c1, 'Domínio da norma padrão'),
      ('C2', new.c2, 'Tema e repertório'),
      ('C3', new.c3, 'Argumentação'),
      ('C4', new.c4, 'Coesão'),
      ('C5', new.c5, 'Proposta de intervenção')
    ) as scores(competency, score, weakness_type)
  loop
    next_severity := case
      when competency_score.score < 100 then 3
      when competency_score.score < 140 then 2
      else 1
    end;

    if competency_score.score < 160 then
      insert into public.user_weaknesses (
        user_id,
        competency,
        weakness_type,
        frequency,
        severity,
        latest_score,
        status,
        first_seen_at,
        last_seen_at,
        updated_at
      ) values (
        new.user_id,
        competency_score.competency,
        competency_score.weakness_type,
        1,
        next_severity,
        competency_score.score,
        'active',
        new.created_at,
        new.created_at,
        now()
      )
      on conflict (user_id, competency) do update
      set
        frequency = public.user_weaknesses.frequency + 1,
        severity = next_severity,
        latest_score = competency_score.score,
        status = case
          when competency_score.score > public.user_weaknesses.latest_score then 'improving'
          else 'active'
        end,
        last_seen_at = new.created_at,
        updated_at = now();
    else
      update public.user_weaknesses
      set
        latest_score = competency_score.score,
        status = 'resolved',
        updated_at = now()
      where user_id = new.user_id
        and competency = competency_score.competency;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists sync_essay_weaknesses_after_insert on public.essay_reviews;
create trigger sync_essay_weaknesses_after_insert
  after insert on public.essay_reviews
  for each row execute function private.sync_essay_weaknesses();

insert into public.user_weaknesses (
  user_id,
  competency,
  weakness_type,
  frequency,
  severity,
  latest_score,
  status,
  first_seen_at,
  last_seen_at,
  updated_at
)
select
  ranked.user_id,
  ranked.competency,
  ranked.weakness_type,
  ranked.frequency,
  case when ranked.latest_score < 100 then 3 when ranked.latest_score < 140 then 2 else 1 end,
  ranked.latest_score,
  'active',
  ranked.first_seen_at,
  ranked.last_seen_at,
  now()
from (
  select
    scores.user_id,
    scores.competency,
    scores.weakness_type,
    count(*)::integer as frequency,
    (array_agg(scores.score order by scores.created_at desc))[1] as latest_score,
    min(scores.created_at) as first_seen_at,
    max(scores.created_at) as last_seen_at
  from (
    select reviews.user_id, reviews.created_at, values_set.competency, values_set.score, values_set.weakness_type
    from public.essay_reviews as reviews
    cross join lateral (values
      ('C1', reviews.c1, 'Domínio da norma padrão'),
      ('C2', reviews.c2, 'Tema e repertório'),
      ('C3', reviews.c3, 'Argumentação'),
      ('C4', reviews.c4, 'Coesão'),
      ('C5', reviews.c5, 'Proposta de intervenção')
    ) as values_set(competency, score, weakness_type)
    where values_set.score < 160
  ) as scores
  group by scores.user_id, scores.competency, scores.weakness_type
) as ranked
on conflict (user_id, competency) do nothing;
