-- Phase 1: one complete essay review for new free users and an academic onboarding profile.

alter table public.student_profile
  add column if not exists target_exam_year integer,
  add column if not exists main_difficulty text,
  add column if not exists priority_area text,
  add column if not exists essay_level text,
  add column if not exists study_frequency text,
  add column if not exists onboarding_completed_at timestamptz;

-- Credit creation is explicit in trusted functions. A neutral default prevents
-- an accidental insert from granting the legacy 20-credit bonus.
alter table public.user_credits alter column balance set default 0;

create or replace function public.complete_student_onboarding(
  p_quiz_profile text,
  p_daily_goal_minutes integer,
  p_target_exam_year integer,
  p_main_difficulty text,
  p_priority_area text,
  p_essay_level text,
  p_study_frequency text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_quiz_profile not in ('Iniciante Perdido', 'Sem Rotina', 'Evolução Acelerada', 'Última Hora')
    or p_daily_goal_minutes not between 1 and 1440
    or p_target_exam_year not between 2026 and 2030
    or p_main_difficulty not in ('start', 'routine', 'subjects', 'motivation')
    or p_priority_area not in ('math', 'essay', 'nature', 'humanities', 'languages')
    or p_essay_level not in ('zero', 'basic', 'messy', 'improve')
    or p_study_frequency not in ('1-2', '3-4', '5-7') then
    raise exception 'Invalid onboarding data' using errcode = '22023';
  end if;

  update public.profiles
  set
    quiz_profile = p_quiz_profile,
    daily_goal_minutes = p_daily_goal_minutes,
    updated_at = now()
  where id = current_user_id;

  insert into public.student_profile (
    user_id,
    target_exam_year,
    main_difficulty,
    priority_area,
    essay_level,
    study_frequency,
    onboarding_completed_at,
    updated_at
  ) values (
    current_user_id,
    p_target_exam_year,
    p_main_difficulty,
    p_priority_area,
    p_essay_level,
    p_study_frequency,
    now(),
    now()
  )
  on conflict (user_id) do update
  set
    target_exam_year = excluded.target_exam_year,
    main_difficulty = excluded.main_difficulty,
    priority_area = excluded.priority_area,
    essay_level = excluded.essay_level,
    study_frequency = excluded.study_frequency,
    onboarding_completed_at = excluded.onboarding_completed_at,
    updated_at = now();
end;
$$;

revoke all on function public.complete_student_onboarding(text, integer, integer, text, text, text, text) from public, anon;
grant execute on function public.complete_student_onboarding(text, integer, integer, text, text, text, text) to authenticated;

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
  initial_credits := case when is_paid_access then 0 else 5 end;

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
    values (new.id, initial_credits, 'initial_bonus', 'Uma correção completa gratuita')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_aprova_user() from public, anon, authenticated;

-- Presentation data remains readable by its owner, but the retired feature can
-- no longer create or mutate decks through the authenticated Data API.
revoke insert, update, delete on public.presentations, public.presentation_slides from authenticated;
grant select on public.presentations, public.presentation_slides to authenticated;
revoke all on function public.complete_presentation_generation(uuid, jsonb, integer) from authenticated;
revoke all on function public.complete_presentation_slide_edit(uuid, uuid, jsonb, integer) from authenticated;
revoke all on function public.duplicate_presentation(uuid) from authenticated;
