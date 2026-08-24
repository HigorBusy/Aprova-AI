-- Atualiza apenas rotulos autorais exibidos ao usuario. IDs, respostas e historico permanecem intactos.
update public.question_bank
set
  source_name = replace(replace(source_name, 'AprovaAI', 'Pontuei'), 'Aprova.AI', 'Pontuei'),
  rights_note = replace(replace(rights_note, 'AprovaAI', 'Pontuei'), 'Aprova.AI', 'Pontuei'),
  updated_at = now()
where source_name ilike '%aprova%'
   or rights_note ilike '%aprova%';
