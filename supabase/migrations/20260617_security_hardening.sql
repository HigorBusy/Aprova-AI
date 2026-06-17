alter table public.profiles enable row level security;
alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.ai_messages enable row level security;
alter table public.student_profile enable row level security;
alter table public.essay_reviews enable row level security;
alter table public.daily_progress enable row level security;
alter table public.streaks enable row level security;

revoke all on public.user_credits from anon;
revoke all on public.credit_transactions from anon;
revoke all on public.ai_messages from anon;
revoke all on public.student_profile from anon;
revoke all on public.essay_reviews from anon;

revoke insert, update, delete on public.user_credits from authenticated;
revoke insert, update, delete on public.credit_transactions from authenticated;
revoke insert, update, delete on public.ai_messages from authenticated;
revoke insert, update, delete on public.student_profile from authenticated;
revoke insert, update, delete on public.essay_reviews from authenticated;

grant select on public.user_credits to authenticated;
grant select on public.credit_transactions to authenticated;
grant select on public.ai_messages to authenticated;
grant select on public.student_profile to authenticated;
grant select on public.essay_reviews to authenticated;

revoke all on function public.complete_ai_exchange(text, text, integer, text, text) from public, anon;
revoke all on function public.complete_essay_review(text, text, integer, text, text, integer, integer, integer, integer, integer, integer) from public, anon;
grant execute on function public.complete_ai_exchange(text, text, integer, text, text) to authenticated;
grant execute on function public.complete_essay_review(text, text, integer, text, text, integer, integer, integer, integer, integer, integer) to authenticated;
