alter table public.presentations
  add column if not exists share_token uuid,
  add column if not exists is_public boolean not null default false,
  add column if not exists shared_at timestamptz;

create unique index if not exists presentations_share_token_idx
  on public.presentations (share_token)
  where share_token is not null;

create or replace function public.duplicate_presentation(p_presentation_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  source_record public.presentations%rowtype;
  duplicate_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into source_record
  from public.presentations
  where id = p_presentation_id and user_id = current_user_id;

  if not found then
    raise exception 'Presentation not found' using errcode = 'P0002';
  end if;

  insert into public.presentations (
    user_id, title, source_prompt, audience, objective, tone, theme,
    duration_minutes, status, plan, slide_count
  ) values (
    current_user_id,
    left(source_record.title || ' (cópia)', 160),
    source_record.source_prompt,
    source_record.audience,
    source_record.objective,
    source_record.tone,
    source_record.theme,
    source_record.duration_minutes,
    source_record.status,
    source_record.plan,
    source_record.slide_count
  ) returning id into duplicate_id;

  insert into public.presentation_slides (
    presentation_id, user_id, order_index, slide_type, title, subtitle,
    body, visual, speaker_notes, sources
  )
  select
    duplicate_id, current_user_id, order_index, slide_type, title, subtitle,
    body, visual, speaker_notes, sources
  from public.presentation_slides
  where presentation_id = p_presentation_id and user_id = current_user_id
  order by order_index;

  return duplicate_id;
end;
$$;

revoke all on function public.duplicate_presentation(uuid) from public, anon;
grant execute on function public.duplicate_presentation(uuid) to authenticated;
