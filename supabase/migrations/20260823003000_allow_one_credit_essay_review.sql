do $$
declare
  target_function regprocedure := to_regprocedure(
    'public.complete_essay_review(text,text,integer,text,text,integer,integer,integer,integer,integer,integer)'
  );
  function_sql text;
begin
  if target_function is null then
    raise exception 'complete_essay_review function was not found';
  end if;

  select pg_get_functiondef(target_function)
  into function_sql;

  if position('if p_cost <> 5 then' in function_sql) = 0 then
    raise exception 'Expected essay credit validation was not found';
  end if;

  execute replace(
    function_sql,
    'if p_cost <> 5 then',
    'if p_cost <> 1 then'
  );
end;
$$;

revoke all on function public.complete_essay_review(text, text, integer, text, text, integer, integer, integer, integer, integer, integer)
  from public, anon;
grant execute on function public.complete_essay_review(text, text, integer, text, text, integer, integer, integer, integer, integer, integer)
  to authenticated;
