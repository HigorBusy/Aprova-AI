create table if not exists public.question_topics (
  id uuid primary key default gen_random_uuid(),
  area_key text not null check (area_key in ('math', 'languages', 'humanities', 'nature')),
  discipline text not null,
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.question_topics(id) on delete restrict,
  source_type text not null check (source_type in ('official_enem', 'official_other', 'authored')),
  source_name text not null,
  source_year integer,
  source_reference text not null unique,
  rights_note text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  prompt text not null check (char_length(prompt) between 20 and 12000),
  alternatives jsonb not null check (jsonb_typeof(alternatives) = 'array' and jsonb_array_length(alternatives) between 2 and 5),
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D', 'E')),
  explanation text not null check (char_length(explanation) between 20 and 8000),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('quick', 'area', 'weakness', 'errors')),
  area_key text check (area_key is null or area_key in ('math', 'languages', 'humanities', 'nature')),
  topic_id uuid references public.question_topics(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  question_count integer not null check (question_count between 1 and 20),
  correct_count integer not null default 0 check (correct_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.question_session_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.question_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.question_bank(id) on delete restrict,
  position integer not null check (position >= 1),
  selected_option text check (selected_option is null or selected_option in ('A', 'B', 'C', 'D', 'E')),
  is_correct boolean,
  marked_review boolean not null default false,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, question_id),
  unique (session_id, position)
);

create table if not exists public.question_topic_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.question_topics(id) on delete cascade,
  total_attempts integer not null default 0 check (total_attempts >= 0),
  correct_attempts integer not null default 0 check (correct_attempts >= 0),
  wrong_attempts integer not null default 0 check (wrong_attempts >= 0),
  last_answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id),
  check (correct_attempts + wrong_attempts = total_attempts)
);

create index if not exists question_bank_topic_active_idx on public.question_bank(topic_id, is_active);
create index if not exists question_sessions_user_status_idx on public.question_sessions(user_id, status, started_at desc);
create index if not exists question_session_items_user_answered_idx on public.question_session_items(user_id, answered_at desc);
create index if not exists question_session_items_question_idx on public.question_session_items(question_id);
create index if not exists question_topic_stats_user_priority_idx on public.question_topic_stats(user_id, total_attempts desc, wrong_attempts desc);

alter table public.question_topics enable row level security;
alter table public.question_bank enable row level security;
alter table public.question_sessions enable row level security;
alter table public.question_session_items enable row level security;
alter table public.question_topic_stats enable row level security;

drop policy if exists question_topics_authenticated_read on public.question_topics;
create policy question_topics_authenticated_read on public.question_topics
  for select to authenticated using (true);

drop policy if exists question_sessions_read_own on public.question_sessions;
create policy question_sessions_read_own on public.question_sessions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists question_session_items_read_own on public.question_session_items;
create policy question_session_items_read_own on public.question_session_items
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists question_topic_stats_read_own on public.question_topic_stats;
create policy question_topic_stats_read_own on public.question_topic_stats
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.question_bank from anon, authenticated;
revoke insert, update, delete on public.question_topics from anon, authenticated;
revoke insert, update, delete on public.question_sessions from anon, authenticated;
revoke insert, update, delete on public.question_session_items from anon, authenticated;
revoke insert, update, delete on public.question_topic_stats from anon, authenticated;
grant select on public.question_topics, public.question_sessions, public.question_session_items, public.question_topic_stats to authenticated;

insert into public.question_topics (area_key, discipline, name, slug, sort_order) values
  ('math', 'Matemática', 'Porcentagem', 'matematica-porcentagem', 10),
  ('math', 'Matemática', 'Funções', 'matematica-funcoes', 20),
  ('math', 'Matemática', 'Probabilidade', 'matematica-probabilidade', 30),
  ('math', 'Matemática', 'Estatística', 'matematica-estatistica', 40),
  ('math', 'Matemática', 'Geometria plana', 'matematica-geometria-plana', 50),
  ('languages', 'Linguagens', 'Interpretação de texto', 'linguagens-interpretacao', 10),
  ('languages', 'Linguagens', 'Figuras de linguagem', 'linguagens-figuras', 20),
  ('languages', 'Linguagens', 'Coesão e referência', 'linguagens-coesao', 30),
  ('languages', 'Linguagens', 'Variação linguística', 'linguagens-variacao', 40),
  ('languages', 'Linguagens', 'Gêneros publicitários', 'linguagens-publicidade', 50),
  ('humanities', 'História', 'Revolução Industrial', 'humanas-revolucao-industrial', 10),
  ('humanities', 'Sociologia', 'Cidadania', 'humanas-cidadania', 20),
  ('humanities', 'Geografia', 'Globalização', 'humanas-globalizacao', 30),
  ('humanities', 'Geografia', 'Migrações', 'humanas-migracoes', 40),
  ('humanities', 'Filosofia', 'Iluminismo', 'humanas-iluminismo', 50),
  ('nature', 'Biologia', 'Ecologia', 'natureza-ecologia', 10),
  ('nature', 'Biologia', 'Cadeias alimentares', 'natureza-cadeias', 20),
  ('nature', 'Física', 'Energia elétrica', 'natureza-energia-eletrica', 30),
  ('nature', 'Química', 'Acidez e pH', 'natureza-ph', 40),
  ('nature', 'Biologia', 'Genética', 'natureza-genetica', 50)
on conflict (slug) do update set
  area_key = excluded.area_key,
  discipline = excluded.discipline,
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.question_bank (
  topic_id, source_type, source_name, source_reference, rights_note, difficulty,
  prompt, alternatives, correct_option, explanation
)
select t.id, 'authored', 'AprovaAI', q.reference, 'Conteúdo autoral AprovaAI. Não é uma questão oficial do ENEM.', q.difficulty,
  q.prompt, q.alternatives::jsonb, q.correct_option, q.explanation
from public.question_topics t
join (values
  ('matematica-porcentagem', 'APROVA-AUTORAL-MAT-001', 'easy', 'Uma mochila custa R$ 250,00 e recebeu desconto de 20% para pagamento à vista. Qual é o valor final da mochila?', '[{"key":"A","text":"R$ 180,00"},{"key":"B","text":"R$ 190,00"},{"key":"C","text":"R$ 200,00"},{"key":"D","text":"R$ 210,00"},{"key":"E","text":"R$ 230,00"}]', 'C', 'Vinte por cento de R$ 250,00 corresponde a R$ 50,00. Subtraindo o desconto, 250 - 50 = 200.'),
  ('matematica-funcoes', 'APROVA-AUTORAL-MAT-002', 'medium', 'Uma corrida de táxi é calculada por C(x) = 6 + 2,5x, em que x representa os quilômetros percorridos e C(x), o preço em reais. Quanto custa uma corrida de 8 km?', '[{"key":"A","text":"R$ 18,00"},{"key":"B","text":"R$ 20,00"},{"key":"C","text":"R$ 24,00"},{"key":"D","text":"R$ 26,00"},{"key":"E","text":"R$ 28,00"}]', 'D', 'Substituindo x por 8: C(8) = 6 + 2,5 × 8 = 6 + 20 = 26 reais.'),
  ('matematica-probabilidade', 'APROVA-AUTORAL-MAT-003', 'easy', 'Uma caixa contém três fichas vermelhas e duas fichas azuis, todas indistinguíveis ao toque. Ao retirar uma ficha ao acaso, qual é a probabilidade de ela ser vermelha?', '[{"key":"A","text":"2/5"},{"key":"B","text":"3/5"},{"key":"C","text":"1/2"},{"key":"D","text":"2/3"},{"key":"E","text":"3/2"}]', 'B', 'Há 3 resultados favoráveis em um total de 5 fichas. Portanto, a probabilidade é 3/5.'),
  ('matematica-estatistica', 'APROVA-AUTORAL-MAT-004', 'easy', 'As notas de um estudante em cinco atividades foram 6, 7, 8, 9 e 10. Qual foi a média aritmética dessas notas?', '[{"key":"A","text":"7,0"},{"key":"B","text":"7,5"},{"key":"C","text":"8,0"},{"key":"D","text":"8,5"},{"key":"E","text":"9,0"}]', 'C', 'A soma é 40. Dividindo esse valor pelas cinco atividades, a média é 8.'),
  ('matematica-geometria-plana', 'APROVA-AUTORAL-MAT-005', 'easy', 'Um jardim retangular tem 12 metros de comprimento e 8 metros de largura. Qual é a área desse jardim?', '[{"key":"A","text":"20 m²"},{"key":"B","text":"40 m²"},{"key":"C","text":"48 m²"},{"key":"D","text":"96 m²"},{"key":"E","text":"192 m²"}]', 'D', 'A área de um retângulo é comprimento vezes largura: 12 × 8 = 96 m².'),
  ('linguagens-interpretacao', 'APROVA-AUTORAL-LIN-001', 'medium', 'Em uma campanha de bem-estar digital, lê-se: “Desligue a tela por alguns minutos. Ligue-se ao que está ao seu redor.” O uso dos verbos no imperativo tem como principal efeito', '[{"key":"A","text":"narrar um acontecimento passado"},{"key":"B","text":"orientar o leitor a adotar uma atitude"},{"key":"C","text":"descrever tecnicamente um aparelho"},{"key":"D","text":"expressar dúvida sobre a tecnologia"},{"key":"E","text":"comparar dois períodos históricos"}]', 'B', 'O imperativo “desligue” e “ligue-se” convoca diretamente o leitor e busca influenciar seu comportamento.'),
  ('linguagens-figuras', 'APROVA-AUTORAL-LIN-002', 'medium', 'Depois de esperar quarenta minutos por um amigo, uma estudante afirma: “Que pontualidade impressionante!”. Nesse contexto, a fala produz humor porque emprega', '[{"key":"A","text":"metáfora para explicar o atraso"},{"key":"B","text":"eufemismo para elogiar o amigo"},{"key":"C","text":"ironia ao afirmar o contrário do que ocorreu"},{"key":"D","text":"hipérbole para calcular o tempo"},{"key":"E","text":"personificação para descrever o relógio"}]', 'C', 'A estudante diz “pontualidade” quando a situação demonstra atraso. Essa oposição entre o dito e o sentido pretendido caracteriza ironia.'),
  ('linguagens-coesao', 'APROVA-AUTORAL-LIN-003', 'medium', 'Na frase “Ana entregou o relatório a Beatriz porque ela precisava revisá-lo”, o pronome “ela” prejudica a clareza porque', '[{"key":"A","text":"não concorda com nenhum substantivo"},{"key":"B","text":"retoma obrigatoriamente a palavra relatório"},{"key":"C","text":"deveria estar sempre no plural"},{"key":"D","text":"pode se referir tanto a Ana quanto a Beatriz"},{"key":"E","text":"elimina a relação de causa"}]', 'D', 'Como Ana e Beatriz são referentes femininos singulares, o pronome “ela” pode retomar qualquer uma delas, criando ambiguidade.'),
  ('linguagens-variacao', 'APROVA-AUTORAL-LIN-004', 'medium', 'A expressão popular “nóis vai chegar cedo”, quando usada em uma conversa informal, deve ser compreendida pela análise linguística como', '[{"key":"A","text":"prova de incapacidade intelectual do falante"},{"key":"B","text":"forma sem qualquer regra de funcionamento"},{"key":"C","text":"variedade linguística associada a determinados grupos e contextos"},{"key":"D","text":"única forma adequada em textos formais"},{"key":"E","text":"erro que impede necessariamente a comunicação"}]', 'C', 'A sociolinguística entende essas construções como variedades com padrões próprios. A adequação depende do contexto, sem associar variedade a inteligência.'),
  ('linguagens-publicidade', 'APROVA-AUTORAL-LIN-005', 'easy', 'Uma campanha de consumo consciente utiliza a frase “Compre menos. Escolha melhor.” A construção curta e paralela busca principalmente', '[{"key":"A","text":"estimular uma decisão de consumo mais refletida"},{"key":"B","text":"apresentar dados estatísticos detalhados"},{"key":"C","text":"narrar a origem de um produto"},{"key":"D","text":"ensinar regras gramaticais"},{"key":"E","text":"defender o aumento do consumo impulsivo"}]', 'A', 'Os dois imperativos formam uma orientação direta: reduzir compras e aumentar a qualidade da escolha.'),
  ('humanas-revolucao-industrial', 'APROVA-AUTORAL-HUM-001', 'medium', 'A industrialização europeia dos séculos XVIII e XIX alterou profundamente a organização das cidades. Uma consequência diretamente relacionada a esse processo foi', '[{"key":"A","text":"a redução definitiva das desigualdades sociais"},{"key":"B","text":"o crescimento urbano associado à formação do operariado"},{"key":"C","text":"o desaparecimento do trabalho assalariado"},{"key":"D","text":"o retorno da produção ao modelo feudal"},{"key":"E","text":"a substituição das fábricas pelo artesanato doméstico"}]', 'B', 'A concentração de fábricas atraiu trabalhadores para as cidades e ampliou a formação de uma classe operária assalariada.'),
  ('humanas-cidadania', 'APROVA-AUTORAL-HUM-002', 'medium', 'A Constituição brasileira de 1988 ficou conhecida como Constituição Cidadã. Essa denominação se relaciona principalmente à', '[{"key":"A","text":"eliminação das eleições diretas"},{"key":"B","text":"concentração de direitos no Poder Executivo"},{"key":"C","text":"ampliação de direitos civis, políticos e sociais"},{"key":"D","text":"proibição da participação popular"},{"key":"E","text":"redução das garantias trabalhistas"}]', 'C', 'Promulgada após a ditadura militar, a Constituição de 1988 ampliou garantias democráticas e direitos sociais e individuais.'),
  ('humanas-globalizacao', 'APROVA-AUTORAL-HUM-003', 'medium', 'Um telefone pode ser projetado em um país, utilizar componentes produzidos em vários continentes e ser montado em outro. Esse exemplo evidencia', '[{"key":"A","text":"o fim do comércio internacional"},{"key":"B","text":"a autossuficiência produtiva de cada país"},{"key":"C","text":"a redução da circulação de capitais"},{"key":"D","text":"a integração das cadeias globais de produção"},{"key":"E","text":"a ausência de empresas transnacionais"}]', 'D', 'A produção distribuída entre diferentes países demonstra a integração econômica e produtiva característica da globalização.'),
  ('humanas-migracoes', 'APROVA-AUTORAL-HUM-004', 'easy', 'Uma família deixa uma região atingida por seca prolongada e se muda para uma cidade com maior oferta de empregos. Nesse deslocamento, atuam respectivamente fatores de', '[{"key":"A","text":"atração e repulsão"},{"key":"B","text":"repulsão e atração"},{"key":"C","text":"urbanização e natalidade"},{"key":"D","text":"imigração e vegetação"},{"key":"E","text":"industrialização e mortalidade"}]', 'B', 'A seca funciona como fator de repulsão da área de origem, enquanto os empregos atraem a família para o destino.'),
  ('humanas-iluminismo', 'APROVA-AUTORAL-HUM-005', 'medium', 'Ao defender a divisão do poder político em Executivo, Legislativo e Judiciário, Montesquieu pretendia', '[{"key":"A","text":"fortalecer o absolutismo monárquico"},{"key":"B","text":"eliminar todas as leis escritas"},{"key":"C","text":"limitar abusos por meio do equilíbrio entre poderes"},{"key":"D","text":"transferir o poder político para a Igreja"},{"key":"E","text":"impedir a existência de instituições públicas"}]', 'C', 'A separação dos poderes busca criar controles recíprocos e reduzir a concentração capaz de favorecer abusos políticos.'),
  ('natureza-ecologia', 'APROVA-AUTORAL-NAT-001', 'medium', 'O aumento da concentração de dióxido de carbono na atmosfera intensifica o efeito estufa porque esse gás', '[{"key":"A","text":"impede totalmente a entrada de luz solar"},{"key":"B","text":"absorve parte da radiação infravermelha emitida pela superfície"},{"key":"C","text":"destrói todo o oxigênio atmosférico"},{"key":"D","text":"transforma calor em matéria sólida"},{"key":"E","text":"elimina o vapor de água da atmosfera"}]', 'B', 'Gases de efeito estufa absorvem e reemitem radiação infravermelha, dificultando a perda de calor da Terra para o espaço.'),
  ('natureza-cadeias', 'APROVA-AUTORAL-NAT-002', 'hard', 'Em um ambiente contaminado por uma substância persistente, ocorre biomagnificação ao longo da cadeia alimentar. Em qual organismo tende a aparecer a maior concentração da substância?', '[{"key":"A","text":"No produtor"},{"key":"B","text":"No consumidor primário"},{"key":"C","text":"No decompositor isoladamente"},{"key":"D","text":"No predador do nível trófico mais alto"},{"key":"E","text":"Em todos os níveis na mesma concentração"}]', 'D', 'Na biomagnificação, a concentração aumenta a cada nível trófico. Por isso, predadores de topo acumulam as maiores concentrações.'),
  ('natureza-energia-eletrica', 'APROVA-AUTORAL-NAT-003', 'medium', 'Um aparelho de potência 1 100 W permanece ligado durante 2 horas. Qual é o consumo de energia elétrica nesse período?', '[{"key":"A","text":"0,55 kWh"},{"key":"B","text":"1,1 kWh"},{"key":"C","text":"2,2 kWh"},{"key":"D","text":"22 kWh"},{"key":"E","text":"2 200 kWh"}]', 'C', 'Convertendo 1 100 W para 1,1 kW e multiplicando por 2 horas, o consumo é 2,2 kWh.'),
  ('natureza-ph', 'APROVA-AUTORAL-NAT-004', 'hard', 'Comparada a uma solução de pH 4, uma solução de pH 2 apresenta concentração de íons H+ aproximadamente', '[{"key":"A","text":"duas vezes maior"},{"key":"B","text":"quatro vezes maior"},{"key":"C","text":"dez vezes maior"},{"key":"D","text":"cem vezes maior"},{"key":"E","text":"mil vezes menor"}]', 'D', 'A escala de pH é logarítmica. Uma diferença de duas unidades representa 10², isto é, concentração cem vezes maior de H+.'),
  ('natureza-genetica', 'APROVA-AUTORAL-NAT-005', 'medium', 'Em um cruzamento entre dois indivíduos heterozigotos para uma característica determinada por A e a, qual é a probabilidade de um descendente apresentar o genótipo recessivo aa?', '[{"key":"A","text":"0%"},{"key":"B","text":"25%"},{"key":"C","text":"50%"},{"key":"D","text":"75%"},{"key":"E","text":"100%"}]', 'B', 'No cruzamento Aa × Aa, os genótipos esperados são AA, Aa, Aa e aa. Um em quatro é aa, correspondendo a 25%.')
) as q(topic_slug, reference, difficulty, prompt, alternatives, correct_option, explanation)
  on q.topic_slug = t.slug
on conflict (source_reference) do update set
  topic_id = excluded.topic_id,
  difficulty = excluded.difficulty,
  prompt = excluded.prompt,
  alternatives = excluded.alternatives,
  correct_option = excluded.correct_option,
  explanation = excluded.explanation,
  rights_note = excluded.rights_note,
  is_active = true,
  updated_at = now();

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

create or replace function public.start_question_session(
  p_mode text default 'quick',
  p_area_key text default null,
  p_topic_id uuid default null,
  p_count integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_count integer := greatest(1, least(coalesce(p_count, 5), 10));
  v_inserted integer;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_mode not in ('quick', 'area', 'weakness', 'errors') then raise exception 'INVALID_MODE'; end if;
  if p_area_key is not null and p_area_key not in ('math', 'languages', 'humanities', 'nature') then raise exception 'INVALID_AREA'; end if;

  update public.question_sessions
  set status = 'abandoned'
  where user_id = v_user_id and status = 'active';

  insert into public.question_sessions (user_id, mode, area_key, topic_id, question_count)
  values (v_user_id, p_mode, p_area_key, p_topic_id, v_count)
  returning id into v_session_id;

  with ranked_weaknesses as (
    select s.topic_id
    from public.question_topic_stats s
    where s.user_id = v_user_id and s.total_attempts >= 2
    order by (s.wrong_attempts::numeric / nullif(s.total_attempts, 0)) desc, s.total_attempts desc
    limit 3
  ),
  previous_errors as (
    select distinct i.question_id
    from public.question_session_items i
    where i.user_id = v_user_id and i.is_correct = false
  ),
  candidates as (
    select q.id
    from public.question_bank q
    join public.question_topics t on t.id = q.topic_id
    where q.is_active
      and (p_mode <> 'area' or t.area_key = p_area_key)
      and (p_topic_id is null or q.topic_id = p_topic_id)
      and (p_mode <> 'weakness' or q.topic_id in (select topic_id from ranked_weaknesses))
      and (p_mode <> 'errors' or q.id in (select question_id from previous_errors))
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

  update public.question_sessions set question_count = v_inserted where id = v_session_id;
  return public.get_question_session(v_session_id);
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
  where user_id = v_user_id and status = 'active'
  order by started_at desc
  limit 1;
  if v_session_id is null then return null; end if;
  return public.get_question_session(v_session_id);
end;
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
  where i.session_id = p_session_id
    and i.question_id = p_question_id
    and i.user_id = v_user_id
    and s.user_id = v_user_id
    and s.status = 'active'
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
      last_answered_at = now(),
      updated_at = now();

    insert into public.daily_progress (user_id, progress_date, date_key, questions_answered)
    values (v_user_id, v_date_key::date, v_date_key, 1)
    on conflict (user_id, date_key) do update set
      questions_answered = public.daily_progress.questions_answered + 1;
  else
    v_is_correct := v_item.is_correct;
    p_selected_option := v_item.selected_option;
  end if;

  return jsonb_build_object(
    'isCorrect', v_is_correct,
    'selectedOption', p_selected_option,
    'correctOption', v_question.correct_option,
    'explanation', v_question.explanation,
    'topicId', v_topic.id,
    'topic', v_topic.name,
    'discipline', v_topic.discipline,
    'areaKey', v_topic.area_key
  );
end;
$$;

create or replace function public.set_question_review(
  p_session_id uuid,
  p_question_id uuid,
  p_marked boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.question_session_items
  set marked_review = coalesce(p_marked, false)
  where session_id = p_session_id and question_id = p_question_id and user_id = v_user_id;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
  return coalesce(p_marked, false);
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
  select count(*), count(*) filter (where selected_option is not null), count(*) filter (where is_correct), count(*) filter (where marked_review)
  into v_total, v_answered, v_correct, v_review
  from public.question_session_items
  where session_id = p_session_id and user_id = v_user_id;
  if v_total = 0 then raise exception 'SESSION_NOT_FOUND'; end if;

  update public.question_sessions
  set status = 'completed', correct_count = v_correct, completed_at = coalesce(completed_at, now())
  where id = p_session_id and user_id = v_user_id;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;

  return jsonb_build_object(
    'sessionId', p_session_id,
    'total', v_total,
    'answered', v_answered,
    'blank', v_total - v_answered,
    'correct', v_correct,
    'wrong', v_answered - v_correct,
    'markedReview', v_review,
    'accuracy', case when v_answered = 0 then 0 else round((v_correct::numeric / v_answered) * 100) end
  );
end;
$$;

create or replace function public.get_question_catalog()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'availableQuestions', (select count(*) from public.question_bank where is_active),
    'errorCount', (
      select count(distinct question_id) from public.question_session_items
      where user_id = auth.uid() and is_correct = false
    ),
    'activeSessionId', (
      select id from public.question_sessions where user_id = auth.uid() and status = 'active' order by started_at desc limit 1
    ),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'areaKey', t.area_key,
        'discipline', t.discipline,
        'name', t.name,
        'slug', t.slug,
        'questionCount', (select count(*) from public.question_bank q where q.topic_id = t.id and q.is_active),
        'attempts', coalesce(s.total_attempts, 0),
        'correct', coalesce(s.correct_attempts, 0),
        'wrong', coalesce(s.wrong_attempts, 0),
        'accuracy', case when coalesce(s.total_attempts, 0) = 0 then null else round((s.correct_attempts::numeric / s.total_attempts) * 100) end
      ) order by t.area_key, t.sort_order)
      from public.question_topics t
      left join public.question_topic_stats s on s.topic_id = t.id and s.user_id = auth.uid()
      where exists (select 1 from public.question_bank q where q.topic_id = t.id and q.is_active)
    ), '[]'::jsonb)
  );
$$;

create or replace function public.get_question_error_notebook(p_limit integer default 30)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  with latest_errors as (
    select distinct on (i.question_id)
      i.question_id, i.selected_option, i.answered_at
    from public.question_session_items i
    where i.user_id = auth.uid() and i.is_correct = false
    order by i.question_id, i.answered_at desc
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'questionId', q.id,
    'areaKey', t.area_key,
    'discipline', t.discipline,
    'topicId', t.id,
    'topic', t.name,
    'prompt', q.prompt,
    'alternatives', q.alternatives,
    'selectedOption', e.selected_option,
    'correctOption', q.correct_option,
    'explanation', q.explanation,
    'answeredAt', e.answered_at,
    'attempts', coalesce(s.total_attempts, 0),
    'wrongAttempts', coalesce(s.wrong_attempts, 0),
    'accuracy', case when coalesce(s.total_attempts, 0) = 0 then 0 else round((s.correct_attempts::numeric / s.total_attempts) * 100) end
  ) order by e.answered_at desc), '[]'::jsonb)
  from (select * from latest_errors order by answered_at desc limit greatest(1, least(coalesce(p_limit, 30), 100))) e
  join public.question_bank q on q.id = e.question_id
  join public.question_topics t on t.id = q.topic_id
  left join public.question_topic_stats s on s.topic_id = t.id and s.user_id = auth.uid();
$$;

revoke all on function public.get_question_session(uuid) from public, anon;
revoke all on function public.start_question_session(text, text, uuid, integer) from public, anon;
revoke all on function public.get_active_question_session() from public, anon;
revoke all on function public.submit_question_answer(uuid, uuid, text) from public, anon;
revoke all on function public.set_question_review(uuid, uuid, boolean) from public, anon;
revoke all on function public.complete_question_session(uuid) from public, anon;
revoke all on function public.get_question_catalog() from public, anon;
revoke all on function public.get_question_error_notebook(integer) from public, anon;

grant execute on function public.get_question_session(uuid) to authenticated;
grant execute on function public.start_question_session(text, text, uuid, integer) to authenticated;
grant execute on function public.get_active_question_session() to authenticated;
grant execute on function public.submit_question_answer(uuid, uuid, text) to authenticated;
grant execute on function public.set_question_review(uuid, uuid, boolean) to authenticated;
grant execute on function public.complete_question_session(uuid) to authenticated;
grant execute on function public.get_question_catalog() to authenticated;
grant execute on function public.get_question_error_notebook(integer) to authenticated;
