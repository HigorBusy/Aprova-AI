-- Phase 4: one evidence-based learning profile shared by dashboard, evolution and Tutor.

create table if not exists public.student_learning_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary jsonb not null default '{}'::jsonb,
  evidence_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.student_learning_profile enable row level security;

drop policy if exists "Users read own learning profile" on public.student_learning_profile;
create policy "Users read own learning profile"
  on public.student_learning_profile for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.refresh_student_learning_profile_for(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_summary jsonb;
  v_essay_count integer := 0;
  v_question_attempts integer := 0;
  v_simulation_count integer := 0;
  v_question_priority jsonb;
  v_essay_priority jsonb;
  v_recommendation jsonb;
begin
  if p_user_id is null then raise exception 'INVALID_USER'; end if;

  select count(*)::int into v_essay_count
  from public.essay_reviews where user_id = p_user_id;

  select coalesce(sum(total_attempts), 0)::int into v_question_attempts
  from public.question_topic_stats where user_id = p_user_id;

  select count(*)::int into v_simulation_count
  from public.question_sessions
  where user_id = p_user_id and mode = 'simulation' and status = 'completed';

  select jsonb_build_object(
    'kind', 'questions',
    'topicId', t.id,
    'topic', t.name,
    'discipline', t.discipline,
    'areaKey', t.area_key,
    'attempts', s.total_attempts,
    'accuracy', round(s.correct_attempts::numeric / nullif(s.total_attempts, 0) * 100)
  ) into v_question_priority
  from public.question_topic_stats s
  join public.question_topics t on t.id = s.topic_id
  where s.user_id = p_user_id and s.total_attempts >= 2
  order by (s.correct_attempts::numeric / nullif(s.total_attempts, 0)) asc, s.total_attempts desc
  limit 1;

  select jsonb_build_object(
    'kind', 'essay',
    'competency', competency,
    'weakness', weakness_type,
    'frequency', frequency,
    'latestScore', latest_score,
    'status', status
  ) into v_essay_priority
  from public.user_weaknesses
  where user_id = p_user_id and status <> 'resolved'
  order by severity desc, frequency desc, updated_at desc
  limit 1;

  v_recommendation := case
    when v_essay_count = 0 then jsonb_build_object(
      'kind', 'first_essay',
      'title', 'Crie sua linha de base na redação',
      'description', 'A primeira correção mostra onde você perde pontos nas cinco competências.',
      'href', '/#centro-redacao',
      'action', 'Enviar redação'
    )
    when v_question_priority is not null and coalesce((v_question_priority->>'accuracy')::numeric, 100) < 70 then jsonb_build_object(
      'kind', 'questions',
      'title', 'Retome ' || (v_question_priority->>'topic'),
      'description', 'Seu aproveitamento está em ' || (v_question_priority->>'accuracy') || '% após ' || (v_question_priority->>'attempts') || ' tentativas.',
      'href', '/questoes?area=' || (v_question_priority->>'areaKey') || '&topic=' || (v_question_priority->>'topicId'),
      'action', 'Treinar assunto'
    )
    when v_essay_priority is not null then jsonb_build_object(
      'kind', 'essay',
      'title', 'Treine ' || (v_essay_priority->>'competency') || ': ' || (v_essay_priority->>'weakness'),
      'description', 'Esse padrão apareceu ' || (v_essay_priority->>'frequency') || ' vezes e sua marca mais recente foi ' || (v_essay_priority->>'latestScore') || '/200.',
      'href', '/#centro-redacao',
      'action', 'Reescrever e corrigir'
    )
    when v_simulation_count = 0 and v_question_attempts >= 5 then jsonb_build_object(
      'kind', 'simulation',
      'title', 'Teste seu desempenho sob tempo',
      'description', 'Você já treinou questões isoladas. Agora meça decisão e ritmo em um simulado.',
      'href', '/simulado',
      'action', 'Fazer simulado'
    )
    else jsonb_build_object(
      'kind', 'essay',
      'title', 'Meça uma nova evolução',
      'description', 'Faça uma nova redação para confirmar se os padrões anteriores foram superados.',
      'href', '/#centro-redacao',
      'action', 'Nova correção'
    )
  end;

  select jsonb_build_object(
    'generatedAt', now(),
    'evidence', jsonb_build_object(
      'essayCount', v_essay_count,
      'questionAttempts', v_question_attempts,
      'simulationCount', v_simulation_count
    ),
    'essay', coalesce((
      select jsonb_build_object(
        'averageScore', round(avg(score)),
        'bestScore', max(score),
        'latestScore', (array_agg(score order by created_at desc))[1],
        'latestAt', max(created_at),
        'priority', v_essay_priority
      ) from public.essay_reviews where user_id = p_user_id
    ), jsonb_build_object('averageScore', null, 'bestScore', null, 'latestScore', null, 'latestAt', null, 'priority', v_essay_priority)),
    'questions', jsonb_build_object(
      'attempts', v_question_attempts,
      'correct', coalesce((select sum(correct_attempts)::int from public.question_topic_stats where user_id = p_user_id), 0),
      'accuracy', case when v_question_attempts = 0 then null else round(
        coalesce((select sum(correct_attempts) from public.question_topic_stats where user_id = p_user_id), 0)::numeric / v_question_attempts * 100
      ) end,
      'priority', v_question_priority,
      'areas', coalesce((
        select jsonb_agg(jsonb_build_object(
          'areaKey', area_key, 'attempts', attempts, 'correct', correct,
          'accuracy', case when attempts = 0 then null else round(correct::numeric / attempts * 100) end
        ) order by area_key)
        from (
          select t.area_key, sum(s.total_attempts)::int attempts, sum(s.correct_attempts)::int correct
          from public.question_topic_stats s join public.question_topics t on t.id = s.topic_id
          where s.user_id = p_user_id group by t.area_key
        ) area_totals
      ), '[]'::jsonb)
    ),
    'simulations', jsonb_build_object(
      'count', v_simulation_count,
      'latest', (
        select jsonb_build_object(
          'sessionId', s.id, 'questionCount', s.question_count, 'correct', s.correct_count,
          'answered', answered.count,
          'accuracy', case when answered.count = 0 then 0 else round(s.correct_count::numeric / answered.count * 100) end,
          'completedAt', s.completed_at,
          'durationSeconds', greatest(0, extract(epoch from (s.completed_at - s.started_at))::int)
        )
        from public.question_sessions s
        cross join lateral (
          select count(*)::int from public.question_session_items i
          where i.session_id = s.id and i.selected_option is not null
        ) answered
        where s.user_id = p_user_id and s.mode = 'simulation' and s.status = 'completed'
        order by s.completed_at desc limit 1
      )
    ),
    'recommendation', v_recommendation
  ) into v_summary;

  insert into public.student_learning_profile (user_id, summary, updated_at)
  values (p_user_id, v_summary, now())
  on conflict (user_id) do update set summary = excluded.summary, updated_at = now();

  return v_summary;
end;
$$;

create or replace function public.refresh_student_learning_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  return public.refresh_student_learning_profile_for(auth.uid());
end;
$$;

create or replace function public.get_student_learning_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  return public.refresh_student_learning_profile_for(auth.uid());
end;
$$;

revoke all on function public.refresh_student_learning_profile_for(uuid) from public, anon, authenticated;
revoke all on function public.refresh_student_learning_profile() from public, anon;
revoke all on function public.get_student_learning_profile() from public, anon;
grant execute on function public.refresh_student_learning_profile() to authenticated;
grant execute on function public.get_student_learning_profile() to authenticated;

grant select on public.student_learning_profile to authenticated;
