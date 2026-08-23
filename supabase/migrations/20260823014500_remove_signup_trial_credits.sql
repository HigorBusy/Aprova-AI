do $$
declare
  target_function regprocedure := to_regprocedure('private.handle_new_aprova_user()');
  function_sql text;
begin
  if target_function is null then
    raise exception 'handle_new_aprova_user function was not found';
  end if;

  select pg_get_functiondef(target_function)
  into function_sql;

  if position('initial_credits := CASE' in function_sql) > 0 then
    function_sql := regexp_replace(
      function_sql,
      'initial_credits := CASE[\s\S]*?END;',
      'initial_credits := 0;',
      'i'
    );
  elsif position('initial_credits := case when is_paid_access then 0 else 3 end;' in function_sql) > 0 then
    function_sql := replace(
      function_sql,
      'initial_credits := case when is_paid_access then 0 else 3 end;',
      'initial_credits := 0;'
    );
  else
    raise exception 'Expected signup credit rule was not found';
  end if;

  execute function_sql;
end;
$$;

revoke all on function private.handle_new_aprova_user()
  from public, anon, authenticated;
