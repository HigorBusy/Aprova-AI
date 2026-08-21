-- Phase 3: timed simulations built on the existing question session model.

alter table public.question_sessions
  add column if not exists selected_areas text[] not null default '{}'::text[],
  add column if not exists time_limit_minutes integer,
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists ended_reason text;

alter table public.question_sessions drop constraint if exists question_sessions_mode_check;
alter table public.question_sessions add constraint question_sessions_mode_check
  check (mode in ('quick', 'area', 'weakness', 'errors', 'simulation'));

alter table public.question_sessions add constraint question_sessions_selected_areas_check
  check (selected_areas <@ array['math', 'languages', 'humanities', 'nature']::text[]);
alter table public.question_sessions add constraint question_sessions_time_limit_check
  check (time_limit_minutes is null or time_limit_minutes between 5 and 300);
alter table public.question_sessions add constraint question_sessions_ended_reason_check
  check (ended_reason is null or ended_reason in ('submitted', 'time_expired'));

create index if not exists question_sessions_user_mode_started_idx
  on public.question_sessions (user_id, mode, started_at desc);

create or replace function public.get_question_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select jsonb_build_object(
    'id', s.id,
    'mode', s.mode,
    'areaKey', s.area_key,
    'selectedAreas', s.selected_areas,
    'status', s.status,
    'questionCount', s.question_count,
    'correctCount', s.correct_count,
    'timeLimitMinutes', s.time_limit_minutes,
    'startedAt', s.started_at,
    'lastActivityAt', s.last_activity_at,
    'completedAt', s.completed_at,
    'endedReason', s.ended_reason,
    'questions', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'position', i.position,
        'areaKey', t.area_key,
        'discipline', t.discipline,
        'topicId', t.id,
        'topic', t.name,
        'difficulty', q.difficulty,
        'prompt', q.prompt,
        'alternatives', q.alternatives,
        'sourceType', q.source_type,
        'sourceName', q.source_name,
        'sourceYear', q.source_year,
        'sourceReference', q.source_reference,
        'rightsNote', q.rights_note,
        'imageUrl', q.image_url,
        'selectedOption', i.selected_option,
        'markedReview', i.marked_review,
        'answeredAt', i.answered_at,
        'result', case
          when i.selected_option is null then null
          when s.mode = 'simulation' and s.status = 'active' then null
          else jsonb_build_object(
            'isCorrect', i.is_correct,
            'selectedOption', i.selected_option,
            'correctOption', q.correct_option,
            'explanation', q.explanation,
            'topicId', t.id,
            'topic', t.name,
            'discipline', t.discipline,
            'areaKey', t.area_key
          )
        end
      ) order by i.position
    ) filter (where q.id is not null), '[]'::jsonb)
  )
  into v_result
  from public.question_sessions s
  left join public.question_session_items i on i.session_id = s.id
  left join public.question_bank q on q.id = i.question_id
  left join public.question_topics t on t.id = q.topic_id
  where s.id = p_session_id and s.user_id = v_user_id
  group by s.id;

  if v_result is null then raise exception 'SESSION_NOT_FOUND'; end if;
  return v_result;
end;
$$;

create or replace function public.get_active_question_session()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select id into v_session_id
  from public.question_sessions
  where user_id = v_user_id and status = 'active' and mode <> 'simulation'
  order by started_at desc
  limit 1;
  if v_session_id is null then return null; end if;
  return public.get_question_session(v_session_id);
end;
$$;

create or replace function public.start_simulation(
  p_question_count integer default 10,
  p_area_keys text[] default array['math', 'languages', 'humanities', 'nature']::text[],
  p_time_limit_minutes integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_count integer := greatest(5, least(coalesce(p_question_count, 10), 20));
  v_time integer := greatest(5, least(coalesce(p_time_limit_minutes, 30), 300));
  v_areas text[] := coalesce(p_area_keys, array['math', 'languages', 'humanities', 'nature']::text[]);
  v_inserted integer;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if cardinality(v_areas) = 0 or exists (
    select 1 from unnest(v_areas) area_key
    where area_key not in ('math', 'languages', 'humanities', 'nature')
  ) then raise exception 'INVALID_AREAS'; end if;

  update public.question_sessions
  set status = 'abandoned', last_activity_at = now()
  where user_id = v_user_id and status = 'active';

  insert into public.question_sessions (
    user_id, mode, question_count, selected_areas, time_limit_minutes
  ) values (
    v_user_id, 'simulation', v_count, v_areas, v_time
  ) returning id into v_session_id;

  with candidates as (
    select q.id
    from public.question_bank q
    join public.question_topics t on t.id = q.topic_id
    where q.is_active and t.area_key = any(v_areas)
    order by random()
    limit v_count
  )
  insert into public.question_session_items (session_id, user_id, question_id, position)
  select v_session_id, v_user_id, c.id, row_number() over ()
  from candidates c;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    delete from public.question_sessions where id = v_session_id;
    raise exception 'NO_QUESTIONS_AVAILABLE';
  end if;

  update public.question_sessions
  set question_count = v_inserted
  where id = v_session_id;

  return public.get_question_session(v_session_id);
end;
$$;

create or replace function public.get_active_simulation()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select id into v_session_id
  from public.question_sessions
  where user_id = v_user_id and mode = 'simulation' and status = 'active'
  order by started_at desc
  limit 1;
  if v_session_id is null then return null; end if;
  return public.get_question_session(v_session_id);
end;
$$;

create or replace function public.save_simulation_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_selected_option text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_correct_option text;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_selected_option not in ('A', 'B', 'C', 'D', 'E') then raise exception 'INVALID_OPTION'; end if;

  select q.correct_option into v_correct_option
  from public.question_session_items i
  join public.question_sessions s on s.id = i.session_id
  join public.question_bank q on q.id = i.question_id
  where i.session_id = p_session_id
    and i.question_id = p_question_id
    and i.user_id = v_user_id
    and s.user_id = v_user_id
    and s.mode = 'simulation'
    and s.status = 'active'
  for update of i;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;

  update public.question_session_items
  set selected_option = p_selected_option,
      is_correct = (p_selected_option = v_correct_option),
      answered_at = now()
  where session_id = p_session_id and question_id = p_question_id and user_id = v_user_id;

  update public.question_sessions
  set last_activity_at = now()
  where id = p_session_id and user_id = v_user_id;

  return jsonb_build_object('saved', true, 'selectedOption', p_selected_option);
end;
$$;

create or replace function public.complete_simulation(
  p_session_id uuid,
  p_ended_reason text default 'submitted'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.question_sessions%rowtype;
  v_total integer;
  v_answered integer;
  v_correct integer;
  v_review integer;
  v_date_key text := to_char(timezone('America/Sao_Paulo', now()), 'YYYY-MM-DD');
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_ended_reason not in ('submitted', 'time_expired') then raise exception 'INVALID_END_REASON'; end if;

  select * into v_session
  from public.question_sessions
  where id = p_session_id and user_id = v_user_id and mode = 'simulation'
  for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;

  if v_session.status = 'active' then
    insert into public.question_topic_stats (
      user_id, topic_id, total_attempts, correct_attempts, wrong_attempts, last_answered_at, updated_at
    )
    select v_user_id, q.topic_id, count(*), count(*) filter (where i.is_correct),
      count(*) filter (where not i.is_correct), now(), now()
    from public.question_session_items i
    join public.question_bank q on q.id = i.question_id
    where i.session_id = p_session_id and i.user_id = v_user_id and i.selected_option is not null
    group by q.topic_id
    on conflict (user_id, topic_id) do update set
      total_attempts = public.question_topic_stats.total_attempts + excluded.total_attempts,
      correct_attempts = public.question_topic_stats.correct_attempts + excluded.correct_attempts,
      wrong_attempts = public.question_topic_stats.wrong_attempts + excluded.wrong_attempts,
      last_answered_at = now(),
      updated_at = now();

    select count(*), count(*) filter (where selected_option is not null),
      count(*) filter (where is_correct), count(*) filter (where marked_review)
    into v_total, v_answered, v_correct, v_review
    from public.question_session_items
    where session_id = p_session_id and user_id = v_user_id;

    update public.question_sessions
    set status = 'completed', correct_count = v_correct, completed_at = now(),
      last_activity_at = now(), ended_reason = p_ended_reason
    where id = p_session_id;

    insert into public.daily_progress (user_id, progress_date, date_key, questions_answered)
    values (v_user_id, v_date_key::date, v_date_key, v_answered)
    on conflict (user_id, date_key) do update set
      questions_answered = public.daily_progress.questions_answered + excluded.questions_answered;
  end if;

  return public.get_simulation_result(p_session_id);
end;
$$;

create or replace function public.get_simulation_result(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;

  with session_data as (
    select * from public.question_sessions
    where id = p_session_id and user_id = v_user_id and mode = 'simulation' and status = 'completed'
  ), totals as (
    select count(*)::int total,
      count(*) filter (where i.selected_option is not null)::int answered,
      count(*) filter (where i.is_correct)::int correct,
      count(*) filter (where i.marked_review)::int marked_review
    from public.question_session_items i join session_data s on s.id = i.session_id
  ), by_area as (
    select t.area_key, count(*)::int total,
      count(*) filter (where i.selected_option is not null)::int answered,
      count(*) filter (where i.is_correct)::int correct
    from public.question_session_items i
    join session_data s on s.id = i.session_id
    join public.question_bank q on q.id = i.question_id
    join public.question_topics t on t.id = q.topic_id
    group by t.area_key
  ), review as (
    select jsonb_agg(jsonb_build_object(
      'id', q.id, 'position', i.position, 'areaKey', t.area_key,
      'discipline', t.discipline, 'topicId', t.id, 'topic', t.name,
      'difficulty', q.difficulty, 'prompt', q.prompt, 'alternatives', q.alternatives,
      'sourceType', q.source_type, 'sourceName', q.source_name, 'sourceYear', q.source_year,
      'sourceReference', q.source_reference, 'rightsNote', q.rights_note, 'imageUrl', q.image_url,
      'selectedOption', i.selected_option, 'markedReview', i.marked_review, 'answeredAt', i.answered_at,
      'result', case when i.selected_option is null then null else jsonb_build_object(
        'isCorrect', i.is_correct, 'selectedOption', i.selected_option,
        'correctOption', q.correct_option, 'explanation', q.explanation,
        'topicId', t.id, 'topic', t.name, 'discipline', t.discipline, 'areaKey', t.area_key
      ) end
    ) order by i.position) questions
    from public.question_session_items i
    join session_data s on s.id = i.session_id
    join public.question_bank q on q.id = i.question_id
    join public.question_topics t on t.id = q.topic_id
  )
  select jsonb_build_object(
    'sessionId', s.id, 'total', totals.total, 'answered', totals.answered,
    'blank', totals.total - totals.answered, 'correct', totals.correct,
    'wrong', totals.answered - totals.correct, 'markedReview', totals.marked_review,
    'accuracy', case when totals.answered = 0 then 0 else round(totals.correct::numeric / totals.answered * 100) end,
    'startedAt', s.started_at, 'completedAt', s.completed_at,
    'durationSeconds', greatest(0, extract(epoch from (s.completed_at - s.started_at))::int),
    'endedReason', s.ended_reason,
    'byArea', coalesce((select jsonb_agg(jsonb_build_object(
      'areaKey', a.area_key, 'total', a.total, 'answered', a.answered, 'correct', a.correct,
      'accuracy', case when a.answered = 0 then 0 else round(a.correct::numeric / a.answered * 100) end
    ) order by a.area_key) from by_area a), '[]'::jsonb),
    'questions', coalesce(review.questions, '[]'::jsonb)
  ) into v_result
  from session_data s cross join totals cross join review;

  if v_result is null then raise exception 'SIMULATION_RESULT_NOT_FOUND'; end if;
  return v_result;
end;
$$;

create or replace function public.get_simulation_history(p_limit integer default 12)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'sessionId', s.id,
    'questionCount', s.question_count,
    'correct', s.correct_count,
    'accuracy', case when answered.count = 0 then 0 else round(s.correct_count::numeric / answered.count * 100) end,
    'answered', answered.count,
    'startedAt', s.started_at,
    'completedAt', s.completed_at,
    'durationSeconds', greatest(0, extract(epoch from (s.completed_at - s.started_at))::int),
    'selectedAreas', s.selected_areas,
    'endedReason', s.ended_reason
  ) order by s.completed_at desc), '[]'::jsonb)
  from (
    select * from public.question_sessions
    where user_id = auth.uid() and mode = 'simulation' and status = 'completed'
    order by completed_at desc
    limit greatest(1, least(coalesce(p_limit, 12), 50))
  ) s
  cross join lateral (
    select count(*)::int from public.question_session_items i
    where i.session_id = s.id and i.selected_option is not null
  ) answered;
$$;

create or replace function public.submit_question_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_selected_option text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_item public.question_session_items%rowtype;
  v_question public.question_bank%rowtype;
  v_topic public.question_topics%rowtype;
  v_is_correct boolean;
  v_date_key text := to_char(timezone('America/Sao_Paulo', now()), 'YYYY-MM-DD');
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_selected_option not in ('A', 'B', 'C', 'D', 'E') then raise exception 'INVALID_OPTION'; end if;

  select i.* into v_item
  from public.question_session_items i
  join public.question_sessions s on s.id = i.session_id
  where i.session_id = p_session_id and i.question_id = p_question_id
    and i.user_id = v_user_id and s.user_id = v_user_id
    and s.status = 'active' and s.mode <> 'simulation'
  for update of i;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;

  select * into v_question from public.question_bank where id = p_question_id;
  select * into v_topic from public.question_topics where id = v_question.topic_id;

  if v_item.selected_option is null then
    v_is_correct := p_selected_option = v_question.correct_option;
    update public.question_session_items
    set selected_option = p_selected_option, is_correct = v_is_correct, answered_at = now()
    where id = v_item.id;

    insert into public.question_topic_stats (user_id, topic_id, total_attempts, correct_attempts, wrong_attempts, last_answered_at, updated_at)
    values (v_user_id, v_question.topic_id, 1, case when v_is_correct then 1 else 0 end, case when v_is_correct then 0 else 1 end, now(), now())
    on conflict (user_id, topic_id) do update set
      total_attempts = public.question_topic_stats.total_attempts + 1,
      correct_attempts = public.question_topic_stats.correct_attempts + case when v_is_correct then 1 else 0 end,
      wrong_attempts = public.question_topic_stats.wrong_attempts + case when v_is_correct then 0 else 1 end,
      last_answered_at = now(), updated_at = now();

    insert into public.daily_progress (user_id, progress_date, date_key, questions_answered)
    values (v_user_id, v_date_key::date, v_date_key, 1)
    on conflict (user_id, date_key) do update set
      questions_answered = public.daily_progress.questions_answered + 1;
  else
    v_is_correct := v_item.is_correct;
    p_selected_option := v_item.selected_option;
  end if;

  return jsonb_build_object(
    'isCorrect', v_is_correct, 'selectedOption', p_selected_option,
    'correctOption', v_question.correct_option, 'explanation', v_question.explanation,
    'topicId', v_topic.id, 'topic', v_topic.name,
    'discipline', v_topic.discipline, 'areaKey', v_topic.area_key
  );
end;
$$;

create or replace function public.complete_question_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_total integer;
  v_answered integer;
  v_correct integer;
  v_review integer;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if exists (select 1 from public.question_sessions where id = p_session_id and user_id = v_user_id and mode = 'simulation') then
    raise exception 'USE_COMPLETE_SIMULATION';
  end if;

  select count(*), count(*) filter (where selected_option is not null),
    count(*) filter (where is_correct), count(*) filter (where marked_review)
  into v_total, v_answered, v_correct, v_review
  from public.question_session_items
  where session_id = p_session_id and user_id = v_user_id;
  if v_total = 0 then raise exception 'SESSION_NOT_FOUND'; end if;

  update public.question_sessions
  set status = 'completed', correct_count = v_correct, completed_at = coalesce(completed_at, now()), last_activity_at = now()
  where id = p_session_id and user_id = v_user_id and mode <> 'simulation';
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;

  return jsonb_build_object(
    'sessionId', p_session_id, 'total', v_total, 'answered', v_answered,
    'blank', v_total - v_answered, 'correct', v_correct,
    'wrong', v_answered - v_correct, 'markedReview', v_review,
    'accuracy', case when v_answered = 0 then 0 else round(v_correct::numeric / v_answered * 100) end
  );
end;
$$;

create or replace function public.get_question_catalog()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  return jsonb_build_object(
    'availableQuestions', (select count(*) from public.question_bank where is_active),
    'errorCount', (select count(distinct question_id) from public.question_session_items where user_id = auth.uid() and is_correct = false),
    'activeSessionId', (select id from public.question_sessions where user_id = auth.uid() and status = 'active' and mode <> 'simulation' order by started_at desc limit 1),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'areaKey', t.area_key, 'discipline', t.discipline,
        'name', t.name, 'slug', t.slug,
        'questionCount', (select count(*) from public.question_bank q where q.topic_id = t.id and q.is_active),
        'attempts', coalesce(s.total_attempts, 0), 'correct', coalesce(s.correct_attempts, 0),
        'wrong', coalesce(s.wrong_attempts, 0),
        'accuracy', case when coalesce(s.total_attempts, 0) = 0 then null else round(s.correct_attempts::numeric / s.total_attempts * 100) end
      ) order by t.area_key, t.sort_order)
      from public.question_topics t
      left join public.question_topic_stats s on s.topic_id = t.id and s.user_id = auth.uid()
      where exists (select 1 from public.question_bank q where q.topic_id = t.id and q.is_active)
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.start_simulation(integer, text[], integer) from public, anon;
revoke all on function public.get_active_simulation() from public, anon;
revoke all on function public.save_simulation_answer(uuid, uuid, text) from public, anon;
revoke all on function public.complete_simulation(uuid, text) from public, anon;
revoke all on function public.get_simulation_result(uuid) from public, anon;
revoke all on function public.get_simulation_history(integer) from public, anon;

grant execute on function public.start_simulation(integer, text[], integer) to authenticated;
grant execute on function public.get_active_simulation() to authenticated;
grant execute on function public.save_simulation_answer(uuid, uuid, text) to authenticated;
grant execute on function public.complete_simulation(uuid, text) to authenticated;
grant execute on function public.get_simulation_result(uuid) to authenticated;
grant execute on function public.get_simulation_history(integer) to authenticated;
