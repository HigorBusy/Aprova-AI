# Fase 2 - Questões

## Escopo entregue

- banco inicial com 20 questões autorais, distribuídas entre Matemática, Linguagens, Humanas e Natureza;
- taxonomia por área, disciplina e assunto;
- treino rápido, por área, por fraqueza e por erros anteriores;
- correção imediata com gabarito e explicação;
- marcação para revisão e caderno de erros;
- sessões persistentes e retomada automática;
- métricas por assunto no painel Evolução;
- recomendação de próximo passo baseada em aproveitamento real;
- contexto de questões integrado ao Tutor IA;
- treino armazenado sem consumo de créditos.

## Integridade editorial

Todas as questões desta primeira carga estão marcadas como `authored`, com fonte `Pontuei` e aviso explícito de que não são questões oficiais do ENEM. O gabarito não possui política de leitura direta: ele é entregue pelas funções autenticadas somente durante a correção.

## Banco e segurança

Tabelas:

- `question_topics`
- `question_bank`
- `question_sessions`
- `question_session_items`
- `question_topic_stats`

As cinco tabelas possuem RLS. Sessões, respostas e estatísticas só podem ser lidas pelo próprio usuário. Toda mutação passa por RPC autenticada, com validação de propriedade por `auth.uid()`.

## Teste manual recomendado

1. Entre em uma conta existente.
2. Abra **Questões** na navegação.
3. Inicie um treino rápido e responda uma alternativa.
4. Confirme a correção imediata e a explicação.
5. Marque uma questão para revisão e conclua o treino.
6. Abra o caderno de erros após errar uma resposta.
7. Confira os novos números em **Evolução**.
8. Abra o Tutor pelo link “Não entendi” e confirme que o contexto da questão já aparece no campo.
9. Recarregue durante um treino e confirme a retomada da sessão.

## Validação técnica

- `npm.cmd run typecheck`: aprovado.
- `npm.cmd run build`: aprovado.
- rota gerada: `/questoes`.
- carga conferida no Supabase: 20 assuntos, 20 questões autorais e 8 RPCs.
