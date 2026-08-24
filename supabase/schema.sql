-- Pontuei - schema inicial Supabase
-- Execute em um projeto Supabase dedicado ao Pontuei.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  quiz_profile text check (quiz_profile in ('Iniciante Perdido', 'Sem Rotina', 'Evolução Acelerada', 'Última Hora')),
  daily_goal_minutes integer not null default 60 check (daily_goal_minutes between 1 and 1440),
  premium boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_minutes integer not null check (daily_minutes between 1 and 1440),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_date date not null default current_date,
  date_key text not null,
  studied_minutes integer not null default 0 check (studied_minutes >= 0),
  tasks_completed integer not null default 0 check (tasks_completed >= 0),
  questions_answered integer not null default 0 check (questions_answered >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, progress_date),
  unique (user_id, date_key),
  constraint daily_progress_date_key_format check (date_key ~ '^\d{4}-\d{2}-\d{2}$')
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text not null,
  title text not null,
  status text not null default 'Não iniciado' check (status in ('Não iniciado', 'Estudando', 'Concluído')),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  task_date date not null default current_date,
  completed boolean not null default false,
  xp_reward integer not null default 10 check (xp_reward >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.xp_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.doubt_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'mentor')),
  message text not null,
  doubt_upload_id uuid references public.doubt_uploads(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_study_date date,
  last_study_date_key text check (last_study_date_key is null or last_study_date_key ~ '^\d{4}-\d{2}-\d{2}$'),
  created_at timestamptz not null default now()
);

create index if not exists study_goals_user_id_idx on public.study_goals (user_id);
create index if not exists daily_progress_user_id_idx on public.daily_progress (user_id);
create index if not exists subjects_user_id_idx on public.subjects (user_id);
create index if not exists topics_user_id_idx on public.topics (user_id);
create index if not exists topics_subject_id_idx on public.topics (subject_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists xp_history_user_id_idx on public.xp_history (user_id);
create index if not exists achievements_user_id_idx on public.achievements (user_id);
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists doubt_uploads_user_id_idx on public.doubt_uploads (user_id);
create index if not exists mentor_messages_user_id_idx on public.mentor_messages (user_id);
create index if not exists mentor_messages_doubt_upload_id_idx on public.mentor_messages (doubt_upload_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.study_goals,
  public.daily_progress,
  public.subjects,
  public.topics,
  public.tasks,
  public.xp_history,
  public.achievements,
  public.notifications,
  public.doubt_uploads,
  public.mentor_messages,
  public.streaks
to authenticated;

alter table public.profiles enable row level security;
alter table public.study_goals enable row level security;
alter table public.daily_progress enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.tasks enable row level security;
alter table public.xp_history enable row level security;
alter table public.achievements enable row level security;
alter table public.notifications enable row level security;
alter table public.doubt_uploads enable row level security;
alter table public.mentor_messages enable row level security;
alter table public.streaks enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "study_goals_own" on public.study_goals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_progress_own" on public.daily_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "subjects_own_or_seed" on public.subjects for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
create policy "subjects_insert_own" on public.subjects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "subjects_update_own" on public.subjects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "subjects_delete_own" on public.subjects for delete to authenticated using ((select auth.uid()) = user_id);
create policy "topics_own" on public.topics for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks_own" on public.tasks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "xp_history_own" on public.xp_history for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "achievements_own" on public.achievements for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notifications_own" on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "doubt_uploads_own" on public.doubt_uploads for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mentor_messages_own" on public.mentor_messages for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "streaks_own" on public.streaks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into public.subjects (name, sort_order)
values
  ('Matemática', 1),
  ('Redação', 2),
  ('Linguagens', 3),
  ('Humanas', 4),
  ('Natureza', 5)
on conflict do nothing;
