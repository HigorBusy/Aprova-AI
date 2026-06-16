alter table public.daily_progress
  add column if not exists date_key text;

update public.daily_progress
set date_key = to_char(progress_date, 'YYYY-MM-DD')
where date_key is null;

alter table public.daily_progress
  alter column date_key set not null;

alter table public.daily_progress
  drop constraint if exists daily_progress_date_key_format;

alter table public.daily_progress
  add constraint daily_progress_date_key_format
  check (date_key ~ '^\d{4}-\d{2}-\d{2}$');

create unique index if not exists daily_progress_user_date_key_idx
  on public.daily_progress (user_id, date_key);

alter table public.streaks
  add column if not exists last_study_date_key text;

update public.streaks
set last_study_date_key = to_char(last_study_date, 'YYYY-MM-DD')
where last_study_date is not null
  and last_study_date_key is null;

alter table public.streaks
  drop constraint if exists streaks_last_study_date_key_format;

alter table public.streaks
  add constraint streaks_last_study_date_key_format
  check (last_study_date_key is null or last_study_date_key ~ '^\d{4}-\d{2}-\d{2}$');
