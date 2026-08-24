# Pontuei — Fases 3 a 5

## Fase 3 — Simulados

- Rota: `/simulado`.
- Configurações: 5 questões/15 min, 10 questões/30 min ou 20 questões/60 min.
- Áreas selecionáveis: Matemática, Linguagens, Humanas e Natureza.
- Respostas persistidas a cada seleção.
- Sessão retomável após recarregar a página.
- Cronômetro calculado a partir do horário do servidor.
- Gabarito e explicação ocultos durante a prova.
- Entrega manual ou automática por tempo esgotado.
- Resultado por área, questões em branco, duração e revisão comentada.
- Histórico de simulados sem nota fictícia de 0 a 1000.

## Fase 4 — Inteligência de aprendizagem

- `student_learning_profile` reúne redações, questões e simulados.
- Uma recomendação central é usada no dashboard, na tela Evolução e no Tutor.
- Um assunto só vira fraqueza após pelo menos duas tentativas.
- O Tutor recebe evidências agregadas e a recomendação atual.
- O perfil é recalculado ao ser solicitado; não depende de cache desatualizado.

## Fase 5 — Evolução e retenção

- Comparação de questões nos últimos 7 dias contra os 7 dias anteriores.
- Atividade real nos últimos 28 dias.
- Histórico de notas e competências de redação.
- Histórico de simulados e desempenho por área.
- Eventos próprios em `product_events`, protegidos por RLS e gravados por RPC/trigger.
- Eventos de questões, simulados, redação, Tutor, créditos e visualização de evolução.

## Segurança

- Todas as funções públicas exigem `auth.uid()`.
- IDs de sessão são sempre validados contra o usuário autenticado.
- `student_learning_profile` e `product_events` possuem RLS por proprietário.
- O banco de questões permanece sem leitura direta no cliente para não expor gabaritos.
- Funções `SECURITY DEFINER` têm `search_path` fixo, EXECUTE revogado de `public`/`anon` e liberado apenas quando necessário para `authenticated`.

## Validação executada

- `npm.cmd run typecheck`.
- `npm.cmd run build`.
- RPCs autenticados de perfil e evolução.
- Simulado completo em transação com rollback: criar, salvar resposta, entregar e carregar revisão.
- Advisors de segurança e performance do Supabase revisados.

## Teste manual recomendado

1. Entrar na conta.
2. Abrir Questões e clicar em Simulado.
3. Escolher 5 questões e duas áreas.
4. Responder, marcar uma questão e recarregar a página.
5. Confirmar que a sessão e o cronômetro foram retomados.
6. Entregar com uma questão em branco.
7. Conferir resultado, gabarito comentado e histórico.
8. Abrir Evolução e conferir comparação, áreas e recomendação.
9. Perguntar ao Tutor qual deve ser o próximo foco e conferir se ele usa os dados do perfil.
