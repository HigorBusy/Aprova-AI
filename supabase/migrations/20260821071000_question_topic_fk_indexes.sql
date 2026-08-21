create index if not exists question_sessions_topic_id_idx
  on public.question_sessions(topic_id);

create index if not exists question_topic_stats_topic_id_idx
  on public.question_topic_stats(topic_id);
