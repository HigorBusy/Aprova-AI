alter table public.presentations
  add column if not exists rehearsal jsonb not null default '{}'::jsonb check (jsonb_typeof(rehearsal) = 'object'),
  add column if not exists rehearsal_updated_at timestamptz;
