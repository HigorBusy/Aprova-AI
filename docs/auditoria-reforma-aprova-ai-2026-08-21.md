# Auditoria da reforma do produto autenticado Pontuei

Data: 21/08/2026

## Resumo executivo

O Pontuei ja possui um corretor de redacao funcional, historico estruturado por competencia, memoria inicial de fraquezas, Tutor com contexto das ultimas redacoes, autenticacao Supabase e consumo atomico de creditos no backend.

O produto, porem, ainda nao forma um ciclo unico de preparacao. A home mistura redacao, apresentacoes, Tutor, telemetria local e componentes herdados da antiga narrativa espacial. O proximo passo usa apenas dados de redacao, grande parte do progresso geral vive em localStorage e nao existe uma arquitetura real de questoes ou simulados.

A decisao recomendada e preservar o core de redacao, desativar apresentacoes somente na experiencia, consolidar os dados academicos e construir questoes em fases. Tabelas e dados de apresentacoes nao devem ser apagados.

## PRESERVAR

- Autenticacao Supabase por email e senha, restauracao de sessao e logout.
- Bloqueio de usuario aplicado nas APIs autenticadas.
- Corretor de redacao com custo de 5 creditos.
- Chamada da IA com temperatura 0.2, resposta estruturada e normalizacao de notas.
- Persistencia em `essay_reviews` e atualizacao de `student_profile`.
- Memoria de competencias em `user_weaknesses`.
- Diagnostico atual por C1-C5 como ponto de partida da futura pagina Evolucao.
- Tutor IA com historico e contexto das ultimas redacoes.
- RPCs atomicas que descontam creditos somente ao salvar uma operacao concluida.
- Ledger em `credit_transactions` e saldo protegido contra escrita direta pelo cliente.
- Helper de data de Brasilia e constante central da data do ENEM.
- Rate limit, limite de payload, sanitizacao textual e respostas JSON UTF-8 das APIs atuais.
- Dados existentes de apresentacoes, mesmo depois que a feature sair da navegacao.
- Landing, pagina de vendas, checkout e fluxo Cakto, fora do escopo desta reforma.

## REFATORAR

- Home: trocar o dashboard de cards por uma tela `Hoje`, orientada a uma decisao.
- Contagem: exibir `CONTAGEM REGRESSIVA PARA O ENEM` e dias totais, removendo meses, horas, minutos, segundos, grafico decorativo e copy concorrente.
- Proximo passo: transformar a regra atual, baseada apenas em redacao, em um motor deterministico que aceite evidencias de redacao, questoes e simulados.
- Onboarding: manter quatro respostas curtas, retirar vocabulario espacial e salvar dados academicos estruturados no servidor.
- Redacao: separar entrada, resultado e historico; priorizar visao geral, competencias, evidencias, reescrita e no maximo tres proximas acoes.
- Tutor: manter interface e backend, mas substituir contexto limitado por um resumo unificado do perfil academico.
- Diagnostico: evoluir de C1-C5 para Redacao + Areas + Assuntos, sem graficos sem decisao.
- Estado de estudo: migrar gradualmente os indicadores relevantes de localStorage para dados reais no Supabase.
- Creditos iniciais: eliminar divergencia entre migrations de 1, 20 e fluxos posteriores. Usar concessao idempotente de 5 creditos registrada no ledger.
- Navegacao: `Hoje`, `Redacao`, `Questoes`, `Tutor`, `Evolucao`, `Conta`.
- Microcopy: remover restos de nave, rota, territorio, comando, missao e sinais de prova.
- Nomenclatura interna da IA: separar avaliacao, feedback, perfil, recomendacao e Tutor em responsabilidades menores.

## REMOVER DA EXPERIENCIA

- Item `Apresentacoes` da sidebar e navegacao mobile.
- Card do Estudio de Apresentacoes na home.
- CTAs, templates e referencias de apresentacao no produto autenticado.
- Rotas publicamente descobriveis da feature, depois de incluir uma flag/guard de desativacao.
- Telemetria decorativa ou derivada apenas de valores locais sem evidencia academica.
- XP, ranks e tarefas espaciais que nao traduzem aprendizagem real.

Nao remover nesta fase:

- Tabelas `presentations` e `presentation_slides`.
- Registros de apresentacoes de usuarios.
- Migrations historicas.
- Codigo de exportacao antes de confirmar que nenhum fluxo compartilhado depende dele.

## CRIAR

- Configuracao central do produto: data do ENEM, custo de redacao e creditos do trial.
- Concessao idempotente `FREE_TRIAL_INITIAL_CREDITS = 5` no backend.
- Perfil academico unificado por usuario.
- Motor de proxima acao baseado em evidencias e com fallback claro para usuario novo.
- Centro de Questoes e Simulados em fases.
- Taxonomia de areas, disciplinas e assuntos.
- Banco de questoes com procedencia explicita: oficial ou autoral.
- Sessoes de treino, respostas persistentes e caderno de erros.
- Tentativas de simulado com salvamento progressivo.
- Eventos de ativacao, repeticao e retencao.

## Estado real por area

### Autenticacao

Funcional no codigo. Login, recuperacao de senha, sessao e logout existem. Cadastro direto esta escondido pela UI, embora o ramo de signup ainda exista no componente. APIs validam o token com `getUser` e consultam `profiles.is_blocked`.

### Creditos

O saldo e protegido por RLS e sem escrita direta do cliente. Chat custa 1, ferramenta IA custa 2 e redacao custa 5. A cobranca final ocorre em RPC atomica. O risco atual e historico de migrations divergentes para o bonus inicial; o valor efetivo de novos usuarios precisa ser consolidado em uma migration idempotente.

### Corretor

E o core mais maduro. Entrega nota, competencias, diagnostico, erros, pontos fortes, plano, trechos criticos e reescrita orientada. Persiste resultado e atualiza fraquezas. Ainda precisa de uma experiencia de resultado mais focada e de ligacoes diretas com Tutor e proximos treinos.

### Tutor

Funciona, tem historico e recebe ate tres redacoes recentes, perfil agregado e repertorios. Ainda nao conhece questoes, simulados ou atividades gerais. Portanto, hoje e um Tutor contextual de redacao, nao um Tutor academico completo.

### Home e onboarding

O countdown usa uma constante central e data real. A home ja consulta fraquezas para sugerir um passo, mas ainda mistura apresentacoes, redacao, Tutor, saldo e telemetria. O onboarding coleta quatro respostas, mas usa vocabulario espacial e salva pouco contexto academico estruturado.

### Questoes e simulados

Nao existem como produto. Ha contadores locais, tarefas demonstrativas e referencias textuais, mas nao ha banco de questoes, respostas, tentativas, explicacoes, procedencia, caderno de erros ou simulados persistentes. Nada disso deve ser tratado como pronto.

### Apresentacoes

E um modulo completo e fortemente acoplado a navegacao, dashboard, APIs, bibliotecas, exportacao e seis migrations. Deve ser desativado por camadas, sem `DROP TABLE` e sem apagar arquivos na primeira etapa.

### Seguranca

As APIs centrais exigem autenticacao, usam limites de requisicao, sanitizam texto e nao expoem a chave Groq. RLS existe nas tabelas principais auditadas. Antes de novas tabelas, cada migration deve incluir RLS, ownership, indices e funcoes idempotentes. O rate limit atual e em memoria do processo e nao e global entre instancias Vercel; serve como protecao basica, nao como limite distribuido forte.

## Arquitetura proposta

### Modulos de dominio

- `essay`: envio, avaliacao, feedback, historico e evolucao por competencia.
- `questions`: catalogo, taxonomia, sessoes de treino, respostas e revisao.
- `simulations`: configuracao, tentativa, autosave, finalizacao e analise.
- `learning-profile`: evidencias agregadas, fraquezas, forcas e prioridades.
- `tutor`: conversa contextual e explicacao vinculada a evidencias.
- `next-action`: escolhe uma unica acao recomendada e explica por que.
- `credits`: custos, saldo, ledger e idempotencia.
- `analytics`: eventos de ativacao, repeticao e esgotamento.

### Schema conceitual minimo

- `student_learning_profiles`: resumo versionado das prioridades do aluno.
- `learning_evidence`: evidencia normalizada de redacao, questao ou simulado.
- `question_sources`: procedencia e licenca.
- `questions`: enunciado, alternativas, resposta, explicacao, origem e metadados.
- `question_sessions`: treino iniciado/finalizado e modo.
- `question_attempts`: resposta, acerto, tempo, revisao e status.
- `simulations`: configuracao da prova.
- `simulation_attempts`: estado da tentativa e progresso.
- `next_actions`: recomendacoes emitidas e resolvidas.
- `analytics_events`: eventos de produto sem dados sensiveis desnecessarios.

Nao criar todas as tabelas de uma vez. Na Fase 1, apenas consolidar perfil/trial/home/redacao. Questoes entram na Fase 2.

## Fluxo alvo da Fase 1

1. Usuario autenticado sem perfil conclui onboarding curto.
2. Backend garante uma unica concessao de 5 creditos de trial.
3. Home mostra dias para o ENEM e uma unica proxima acao.
4. Usuario escolhe primeira redacao ou diagnostico inicial de questoes.
5. Na Fase 1, o caminho de redacao fica completo; o diagnostico de questoes pode aparecer somente quando a Fase 2 estiver pronta.
6. Correcao salva resultado e atualiza perfil/fraquezas.
7. Home passa a recomendar a competencia mais relevante.
8. Acao abre Redacao ou Tutor ja com contexto, sem copiar texto.

## Ordem segura de implementacao

1. Criar flag interna que desativa apresentacoes na navegacao, home e acesso comum.
2. Preservar tabelas, migrations e dados de apresentacoes.
3. Centralizar configuracao do ENEM e creditos em um unico modulo server-safe.
4. Criar migration idempotente para trial de 5 creditos e ledger unico.
5. Refatorar onboarding e persistencia de perfil.
6. Remodelar Home `Hoje` com countdown em dias e proxima acao real.
7. Separar a experiencia da Redacao em fluxo focado e responsivo.
8. Ligar diagnostico de redacao ao Tutor com contexto.
9. Validar desktop, mobile, auth, creditos e primeira correcao.
10. Somente depois iniciar schema e UI de Questoes.

## Validacao obrigatoria da Fase 1

- Usuario novo recebe exatamente 5 creditos uma unica vez.
- Reabrir a conta nao concede novos creditos.
- Uma correcao completa consome 5 e nunca deixa saldo negativo.
- Falha da Groq nao desconta saldo.
- Home exibe data real e somente dias ate o ENEM.
- Usuario sem historico recebe acao de primeira redacao.
- Usuario com fraqueza recebe acao baseada no dado salvo.
- Apresentacoes somem da experiencia sem perder registros.
- Redacao funciona em desktop e mobile.
- Tutor abre com contexto da fraqueza selecionada.
- Build, typecheck e fluxo autenticado passam.

## Verificacao tecnica desta auditoria

- `npm run typecheck`: aprovado.
- `npm run build`: aprovado com Next.js 14.2.35; 18 paginas geradas.
- Nenhum arquivo da landing foi alterado durante a auditoria.
- Nenhuma migration foi aplicada.
- Nenhum dado foi removido.

