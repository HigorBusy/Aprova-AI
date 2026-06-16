create table if not exists public.repertorios (
  id uuid primary key default gen_random_uuid(),
  autor text not null,
  obra text,
  tema text not null,
  explicacao text not null,
  categoria text not null,
  created_at timestamptz not null default now(),
  unique (autor, obra, tema)
);

alter table public.repertorios enable row level security;

drop policy if exists repertorios_select_authenticated on public.repertorios;
create policy repertorios_select_authenticated
  on public.repertorios
  for select
  to authenticated
  using (true);

grant select on public.repertorios to authenticated;

insert into public.repertorios (autor, obra, tema, explicacao, categoria)
values
  ('Zygmunt Bauman', 'Modernidade Liquida', 'relacoes sociais e instabilidade', 'Ajuda a explicar fragilidade de vinculos, consumo rapido e dificuldade de compromisso coletivo.', 'sociologia'),
  ('Michel Foucault', 'Vigiar e Punir', 'controle social e instituicoes', 'Permite discutir vigilancia, disciplina, normalizacao de comportamentos e poder institucional.', 'filosofia'),
  ('Milton Santos', 'O espaco do cidadao', 'desigualdade territorial e cidadania', 'Mostra como o territorio brasileiro produz acessos desiguais a direitos, servicos e oportunidades.', 'geografia'),
  ('Hannah Arendt', 'A Condicao Humana', 'espaco publico e responsabilidade', 'Ajuda a defender participacao coletiva, responsabilidade politica e preservacao do debate publico.', 'filosofia'),
  ('Achille Mbembe', 'Necropolitica', 'violencia, exclusao e vidas vulneraveis', 'Serve para discutir como grupos vulneraveis sofrem maior exposicao a abandono, violencia e falta de direitos.', 'filosofia'),
  ('Brasil', 'Constituicao Federal de 1988', 'direitos sociais e cidadania', 'Base juridica para temas de educacao, saude, seguranca, moradia, dignidade e igualdade.', 'legislacao'),
  ('George Orwell', '1984', 'vigilancia, manipulacao e autoritarismo', 'Repertorio literario para discutir controle de informacao, monitoramento e perda de liberdade.', 'literatura'),
  ('Aldous Huxley', 'Admiravel Mundo Novo', 'alienacao, consumo e controle social', 'Ajuda a discutir conformismo, prazer imediato, padronizacao e manipulacao social.', 'literatura'),
  ('Aluisio Azevedo', 'O Cortico', 'desigualdade social e determinismo do meio', 'Permite discutir pobreza, moradia precaria, exploracao e efeitos do ambiente sobre trajetorias sociais.', 'literatura')
on conflict (autor, obra, tema) do update
set
  explicacao = excluded.explicacao,
  categoria = excluded.categoria;

create table if not exists public.student_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  average_score numeric(6,2) not null default 0,
  best_score integer not null default 0,
  worst_competency text,
  best_competency text,
  total_essays integer not null default 0,
  last_essay_date timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.student_profile enable row level security;

drop policy if exists student_profile_select_own on public.student_profile;
create policy student_profile_select_own
  on public.student_profile
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.student_profile to authenticated;

create table if not exists public.essay_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text,
  score integer not null check (score between 0 and 1000),
  c1 integer not null check (c1 between 0 and 200),
  c2 integer not null check (c2 between 0 and 200),
  c3 integer not null check (c3 between 0 and 200),
  c4 integer not null check (c4 between 0 and 200),
  c5 integer not null check (c5 between 0 and 200),
  review jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists essay_reviews_user_created_idx
  on public.essay_reviews (user_id, created_at desc);

alter table public.essay_reviews enable row level security;

drop policy if exists essay_reviews_select_own on public.essay_reviews;
create policy essay_reviews_select_own
  on public.essay_reviews
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.essay_reviews to authenticated;

create or replace function public.complete_essay_review(
  p_user_content text,
  p_assistant_content text,
  p_cost integer,
  p_description text,
  p_theme text,
  p_score integer,
  p_c1 integer,
  p_c2 integer,
  p_c3 integer,
  p_c4 integer,
  p_c5 integer
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
  min_comp text;
  max_comp text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_cost <> 5 then
    raise exception 'Invalid credit cost' using errcode = '22023';
  end if;

  if p_score < 0 or p_score > 1000
    or p_c1 < 0 or p_c1 > 200
    or p_c2 < 0 or p_c2 > 200
    or p_c3 < 0 or p_c3 > 200
    or p_c4 < 0 or p_c4 > 200
    or p_c5 < 0 or p_c5 > 200 then
    raise exception 'Invalid essay scores' using errcode = '22023';
  end if;

  select credits.balance
  into current_balance
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

  select label
  into min_comp
  from (values ('C1', p_c1), ('C2', p_c2), ('C3', p_c3), ('C4', p_c4), ('C5', p_c5)) as scores(label, score)
  order by score asc, label asc
  limit 1;

  select label
  into max_comp
  from (values ('C1', p_c1), ('C2', p_c2), ('C3', p_c3), ('C4', p_c4), ('C5', p_c5)) as scores(label, score)
  order by score desc, label asc
  limit 1;

  update public.user_credits as credits
  set balance = credits.balance - p_cost
  where credits.user_id = current_user_id
  returning credits.balance into current_balance;

  insert into public.credit_transactions (
    user_id,
    amount,
    type,
    description
  ) values (
    current_user_id,
    -p_cost,
    'essay_review',
    coalesce(nullif(trim(p_description), ''), 'Correcao de redacao pelo Comandante IA')
  );

  insert into public.ai_messages (user_id, role, content)
  values
    (current_user_id, 'user', trim(p_user_content)),
    (current_user_id, 'assistant', trim(p_assistant_content));

  insert into public.essay_reviews (
    user_id,
    theme,
    score,
    c1,
    c2,
    c3,
    c4,
    c5,
    review
  ) values (
    current_user_id,
    nullif(trim(p_theme), ''),
    p_score,
    p_c1,
    p_c2,
    p_c3,
    p_c4,
    p_c5,
    p_assistant_content::jsonb
  );

  insert into public.student_profile (
    user_id,
    average_score,
    best_score,
    worst_competency,
    best_competency,
    total_essays,
    last_essay_date,
    updated_at
  ) values (
    current_user_id,
    p_score,
    p_score,
    min_comp,
    max_comp,
    1,
    now(),
    now()
  )
  on conflict (user_id) do update
  set
    average_score = round(((public.student_profile.average_score * public.student_profile.total_essays) + p_score)::numeric / (public.student_profile.total_essays + 1), 2),
    best_score = greatest(public.student_profile.best_score, p_score),
    worst_competency = min_comp,
    best_competency = max_comp,
    total_essays = public.student_profile.total_essays + 1,
    last_essay_date = now(),
    updated_at = now();

  return query select true, current_balance, 'essay_review_completed'::text;
end;
$$;

revoke all on function public.complete_essay_review(text, text, integer, text, text, integer, integer, integer, integer, integer, integer)
  from public, anon;
grant execute on function public.complete_essay_review(text, text, integer, text, text, integer, integer, integer, integer, integer, integer)
  to authenticated;
