create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_prompt text not null,
  audience text not null default 'Público geral',
  objective text not null default '',
  tone text not null default 'didático',
  theme text not null default 'Acadêmico',
  duration_minutes integer not null default 8 check (duration_minutes between 1 and 180),
  status text not null default 'planned' check (status in ('planned', 'generated', 'archived')),
  plan jsonb not null default '{}'::jsonb check (jsonb_typeof(plan) = 'object'),
  slide_count integer not null default 0 check (slide_count between 0 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists presentations_user_updated_idx
  on public.presentations (user_id, updated_at desc);

create table if not exists public.presentation_slides (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_index integer not null check (order_index between 0 and 39),
  slide_type text not null check (slide_type in ('cover', 'section', 'text_image', 'comparison', 'timeline', 'process', 'data', 'chart', 'quote', 'conclusion', 'call_to_action')),
  title text not null,
  subtitle text not null default '',
  body jsonb not null default '[]'::jsonb check (jsonb_typeof(body) = 'array'),
  visual jsonb not null default '{}'::jsonb check (jsonb_typeof(visual) = 'object'),
  speaker_notes text not null default '',
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (presentation_id, order_index)
);

create index if not exists presentation_slides_presentation_order_idx
  on public.presentation_slides (presentation_id, order_index);

alter table public.presentations enable row level security;
alter table public.presentation_slides enable row level security;

drop policy if exists presentations_owner_all on public.presentations;
create policy presentations_owner_all
  on public.presentations
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists presentation_slides_owner_all on public.presentation_slides;
create policy presentation_slides_owner_all
  on public.presentation_slides
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.presentations, public.presentation_slides from anon;
grant select, insert, update, delete on public.presentations, public.presentation_slides to authenticated;

create or replace function public.complete_presentation_generation(
  p_presentation_id uuid,
  p_deck jsonb,
  p_cost integer default 10
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
  presentation_record public.presentations%rowtype;
  slide jsonb;
  slide_total integer;
  slide_position integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_cost <> 10 then
    raise exception 'Invalid credit cost' using errcode = '22023';
  end if;

  if jsonb_typeof(p_deck) <> 'object' or jsonb_typeof(p_deck -> 'slides') <> 'array' then
    raise exception 'Invalid presentation deck' using errcode = '22023';
  end if;

  slide_total := jsonb_array_length(p_deck -> 'slides');
  if slide_total < 3 or slide_total > 20 then
    raise exception 'Invalid slide count' using errcode = '22023';
  end if;

  select * into presentation_record
  from public.presentations
  where id = p_presentation_id and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Presentation not found' using errcode = 'P0002';
  end if;

  if presentation_record.status <> 'planned'
    or exists (select 1 from public.presentation_slides where presentation_id = p_presentation_id) then
    raise exception 'Presentation already generated' using errcode = 'P0001';
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
  values (current_user_id, -p_cost, 'ai_chat', 'Criação de apresentação completa');

  for slide in select value from jsonb_array_elements(p_deck -> 'slides')
  loop
    insert into public.presentation_slides (
      presentation_id,
      user_id,
      order_index,
      slide_type,
      title,
      subtitle,
      body,
      visual,
      speaker_notes,
      sources
    ) values (
      p_presentation_id,
      current_user_id,
      slide_position,
      coalesce(nullif(slide ->> 'type', ''), 'text_image'),
      left(coalesce(nullif(slide ->> 'title', ''), 'Slide sem título'), 140),
      left(coalesce(slide ->> 'subtitle', ''), 240),
      coalesce(slide -> 'body', '[]'::jsonb),
      coalesce(slide -> 'visual', '{}'::jsonb),
      left(coalesce(slide ->> 'speaker_notes', ''), 4000),
      coalesce(slide -> 'sources', '[]'::jsonb)
    );
    slide_position := slide_position + 1;
  end loop;

  update public.presentations
  set
    title = left(coalesce(nullif(p_deck ->> 'title', ''), title), 160),
    audience = left(coalesce(nullif(p_deck ->> 'audience', ''), audience), 160),
    objective = left(coalesce(nullif(p_deck ->> 'objective', ''), objective), 500),
    tone = left(coalesce(nullif(p_deck ->> 'tone', ''), tone), 80),
    theme = left(coalesce(nullif(p_deck ->> 'theme', ''), theme), 80),
    status = 'generated',
    slide_count = slide_total,
    updated_at = now()
  where id = p_presentation_id;

  return query select true, current_balance, 'presentation_generated'::text;
end;
$$;

revoke all on function public.complete_presentation_generation(uuid, jsonb, integer) from public, anon;
grant execute on function public.complete_presentation_generation(uuid, jsonb, integer) to authenticated;
