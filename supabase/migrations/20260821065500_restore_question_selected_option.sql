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
    'status', s.status,
    'questionCount', s.question_count,
    'correctCount', s.correct_count,
    'startedAt', s.started_at,
    'completedAt', s.completed_at,
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
        'result', case when i.selected_option is null then null else jsonb_build_object(
          'isCorrect', i.is_correct,
          'selectedOption', i.selected_option,
          'correctOption', q.correct_option,
          'explanation', q.explanation
        ) end
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

revoke all on function public.get_question_session(uuid) from public, anon;
grant execute on function public.get_question_session(uuid) to authenticated;
