create or replace function public.complete_presentation_slide_edit(
  p_presentation_id uuid,
  p_slide_id uuid,
  p_slide jsonb,
  p_cost integer default 1
)
returns table (
  success boolean,
  balance integer,
  message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_balance integer;
  target_slide public.presentation_slides%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_cost <> 1 or jsonb_typeof(p_slide) <> 'object' then
    raise exception 'Invalid edit request' using errcode = '22023';
  end if;

  select slides.* into target_slide
  from public.presentation_slides as slides
  join public.presentations as presentations on presentations.id = slides.presentation_id
  where slides.id = p_slide_id
    and slides.presentation_id = p_presentation_id
    and slides.user_id = current_user_id
    and presentations.user_id = current_user_id
    and presentations.status = 'generated'
  for update of slides;

  if not found then
    raise exception 'Slide not found' using errcode = 'P0002';
  end if;

  select credits.balance into current_balance
  from public.user_credits as credits
  where credits.user_id = current_user_id
  for update;

  if current_balance is null then
    return query select false, 0, 'credit_account_not_found'::text;
    return;
  end if;

  if current_balance < p_cost then
    return query select false, current_balance, 'insufficient_credits'::text;
    return;
  end if;

  update public.user_credits as credits
  set balance = credits.balance - p_cost, updated_at = now()
  where credits.user_id = current_user_id
  returning credits.balance into current_balance;

  insert into public.credit_transactions (user_id, amount, type, description)
  values (current_user_id, -p_cost, 'ai_chat', 'Edição de slide por IA');

  update public.presentation_slides
  set
    slide_type = coalesce(nullif(p_slide ->> 'type', ''), slide_type),
    title = left(coalesce(nullif(p_slide ->> 'title', ''), title), 140),
    subtitle = left(coalesce(p_slide ->> 'subtitle', ''), 240),
    body = coalesce(p_slide -> 'body', body),
    visual = coalesce(p_slide -> 'visual', visual),
    speaker_notes = left(coalesce(p_slide ->> 'speaker_notes', ''), 4000),
    sources = coalesce(p_slide -> 'sources', sources),
    updated_at = now()
  where id = p_slide_id;

  update public.presentations
  set updated_at = now()
  where id = p_presentation_id;

  return query select true, current_balance, 'slide_updated'::text;
end;
$$;

revoke all on function public.complete_presentation_slide_edit(uuid, uuid, jsonb, integer) from public, anon;
grant execute on function public.complete_presentation_slide_edit(uuid, uuid, jsonb, integer) to authenticated;
