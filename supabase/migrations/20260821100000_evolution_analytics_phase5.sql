-- Phase 5: real evolution metrics and first-party product events.

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_events_name_check check (char_length(event_name) between 3 and 80),
  constraint product_events_properties_check check (jsonb_typeof(properties) = 'object')
);

create index if not exists product_events_user_created_idx
  on public.product_events (user_id, created_at desc);
create index if not exists product_events_name_created_idx
  on public.product_events (event_name, created_at desc);

alter table public.product_events enable row level security;

drop policy if exists "Users read own product events" on public.product_events;
create policy "Users read own product events"
  on public.product_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.product_events to authenticated;
revoke insert, update, delete on public.product_events from anon, authenticated;

create or replace function public.track_product_event(p_event_name text, p_properties jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
  v_allowed constant text[] := array[
    'signup_completed', 'trial_credit_granted', 'first_essay_started', 'first_essay_completed',
    'first_question_answered', 'question_session_completed', 'simulation_started',
    'simulation_completed', 'weakness_detected', 'question_reviewed', 'tutor_used',
    'credits_exhausted', 'checkout_opened', 'subscription_started', 'evolution_viewed'
  ];
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_event_name is null or not (p_event_name = any(v_allowed)) then raise exception 'INVALID_EVENT'; end if;
  if p_properties is null or jsonb_typeof(p_properties) <> 'object' then raise exception 'INVALID_PROPERTIES'; end if;

  insert into public.product_events (user_id, event_name, properties)
  values (v_user_id, p_event_name, p_properties)
  returning id into v_event_id;
  return v_event_id;
end;
$$;

create or replace function public.capture_question_product_events()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.selected_option is null and new.selected_option is not null then
    if not exists (
      select 1 from public.product_events
      where user_id = new.user_id and event_name = 'first_question_answered'
    ) then
      insert into public.product_events (user_id, event_name, properties)
      values (new.user_id, 'first_question_answered', jsonb_build_object('questionId', new.question_id, 'sessionId', new.session_id));
    end if;
  end if;

  if not old.marked_review and new.marked_review then
    insert into public.product_events (user_id, event_name, properties)
    values (new.user_id, 'question_reviewed', jsonb_build_object('questionId', new.question_id, 'sessionId', new.session_id));
  end if;
  return new;
end;
$$;

drop trigger if exists capture_question_product_events on public.question_session_items;
create trigger capture_question_product_events
after update of selected_option, marked_review on public.question_session_items
for each row execute function public.capture_question_product_events();

create or replace function public.capture_session_product_events()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.mode = 'simulation' then
    insert into public.product_events (user_id, event_name, properties)
    values (new.user_id, 'simulation_started', jsonb_build_object(
      'sessionId', new.id, 'questionCount', new.question_count,
      'timeLimitMinutes', new.time_limit_minutes, 'areas', new.selected_areas
    ));
  elsif tg_op = 'UPDATE' and old.status = 'active' and new.status = 'completed' then
    insert into public.product_events (user_id, event_name, properties)
    values (
      new.user_id,
      case when new.mode = 'simulation' then 'simulation_completed' else 'question_session_completed' end,
      jsonb_build_object('sessionId', new.id, 'mode', new.mode, 'questionCount', new.question_count, 'correct', new.correct_count)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists capture_session_product_events on public.question_sessions;
create trigger capture_session_product_events
after insert or update of status on public.question_sessions
for each row execute function public.capture_session_product_events();

create or replace function public.capture_essay_product_events()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.product_events
    where user_id = new.user_id and event_name = 'first_essay_completed'
  ) then
    insert into public.product_events (user_id, event_name, properties)
    values (new.user_id, 'first_essay_completed', jsonb_build_object('essayId', new.id, 'score', new.score));
  end if;
  return new;
end;
$$;

drop trigger if exists capture_essay_product_events on public.essay_reviews;
create trigger capture_essay_product_events
after insert on public.essay_reviews
for each row execute function public.capture_essay_product_events();

create or replace function public.get_evolution_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile jsonb;
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_profile := public.refresh_student_learning_profile_for(v_user_id);

  with recent_questions as (
    select
      count(*) filter (where i.answered_at >= now() - interval '7 days')::int current_attempts,
      count(*) filter (where i.answered_at >= now() - interval '7 days' and i.is_correct)::int current_correct,
      count(*) filter (where i.answered_at >= now() - interval '14 days' and i.answered_at < now() - interval '7 days')::int previous_attempts,
      count(*) filter (where i.answered_at >= now() - interval '14 days' and i.answered_at < now() - interval '7 days' and i.is_correct)::int previous_correct
    from public.question_session_items i
    where i.user_id = v_user_id and i.selected_option is not null
  ), activity as (
    select date_key, studied_minutes, tasks_completed, questions_answered
    from public.daily_progress
    where user_id = v_user_id and progress_date >= (timezone('America/Sao_Paulo', now())::date - 27)
    order by progress_date
  ), essay_history as (
    select id, score, c1, c2, c3, c4, c5, theme, created_at
    from public.essay_reviews
    where user_id = v_user_id
    order by created_at desc
    limit 12
  ), simulation_history as (
    select s.id, s.question_count, s.correct_count, s.started_at, s.completed_at,
      answered.count answered,
      case when answered.count = 0 then 0 else round(s.correct_count::numeric / answered.count * 100) end accuracy
    from public.question_sessions s
    cross join lateral (
      select count(*)::int from public.question_session_items i
      where i.session_id = s.id and i.selected_option is not null
    ) answered
    where s.user_id = v_user_id and s.mode = 'simulation' and s.status = 'completed'
    order by s.completed_at desc
    limit 12
  )
  select jsonb_build_object(
    'generatedAt', now(),
    'profile', v_profile,
    'comparison', jsonb_build_object(
      'current7Days', jsonb_build_object(
        'attempts', rq.current_attempts,
        'correct', rq.current_correct,
        'accuracy', case when rq.current_attempts = 0 then null else round(rq.current_correct::numeric / rq.current_attempts * 100) end
      ),
      'previous7Days', jsonb_build_object(
        'attempts', rq.previous_attempts,
        'correct', rq.previous_correct,
        'accuracy', case when rq.previous_attempts = 0 then null else round(rq.previous_correct::numeric / rq.previous_attempts * 100) end
      )
    ),
    'activity', coalesce((select jsonb_agg(jsonb_build_object(
      'dateKey', a.date_key, 'studiedMinutes', a.studied_minutes,
      'tasksCompleted', a.tasks_completed, 'questionsAnswered', a.questions_answered
    ) order by a.date_key) from activity a), '[]'::jsonb),
    'activeDays28', (select count(*) from activity where studied_minutes > 0 or tasks_completed > 0 or questions_answered > 0),
    'essayHistory', coalesce((select jsonb_agg(jsonb_build_object(
      'id', e.id, 'score', e.score, 'c1', e.c1, 'c2', e.c2, 'c3', e.c3,
      'c4', e.c4, 'c5', e.c5, 'theme', e.theme, 'createdAt', e.created_at
    ) order by e.created_at desc) from essay_history e), '[]'::jsonb),
    'simulationHistory', coalesce((select jsonb_agg(jsonb_build_object(
      'sessionId', s.id, 'questionCount', s.question_count, 'answered', s.answered,
      'correct', s.correct_count, 'accuracy', s.accuracy,
      'startedAt', s.started_at, 'completedAt', s.completed_at,
      'durationSeconds', greatest(0, extract(epoch from (s.completed_at - s.started_at))::int)
    ) order by s.completed_at desc) from simulation_history s), '[]'::jsonb)
  ) into v_result
  from recent_questions rq;

  return v_result;
end;
$$;

revoke all on function public.track_product_event(text, jsonb) from public, anon;
revoke all on function public.get_evolution_dashboard() from public, anon;
revoke all on function public.capture_question_product_events() from public, anon, authenticated;
revoke all on function public.capture_session_product_events() from public, anon, authenticated;
revoke all on function public.capture_essay_product_events() from public, anon, authenticated;

grant execute on function public.track_product_event(text, jsonb) to authenticated;
grant execute on function public.get_evolution_dashboard() to authenticated;
