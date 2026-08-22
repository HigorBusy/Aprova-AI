# AprovaAI Reconstruction Plan

## Promessa central

O AprovaAI corrige sua redacao do ENEM por competencia e mostra exatamente o que fazer para subir nota na proxima.

## Direcao de produto

O corretor de redacao e o coracao do produto. Chat, apresentacoes, OCR, PDF, voz, gamificacao e ferramentas extras devem existir apenas se reforcarem a correcao e a evolucao da proxima redacao.

## Auditoria do sistema atual

### O que já existia e foi preservado

- Next.js App Router com Supabase Auth e rotas privadas no cliente.
- Correção de redação no backend, chamada Groq protegida e consumo atômico de 1 crédito.
- Saída JSON, histórico em `essay_reviews` e resumo em `student_profile`.
- Benchmark local sem custo de API.
- Tutor IA, uploads, apresentações, painel administrativo e telemetria como módulos secundários.
- RLS nas tabelas sensíveis e funções de consumo protegidas.

### Gargalos encontrados

- O prompt solicitava a chave `competencias`, mas o normalizador lia `competencies`. As notas eram preservadas pelos campos de fallback, porém justificativas, evidências e exercícios podiam virar conteúdo genérico.
- `student_profile` guardava somente um resumo da última redação e não registrava frequência, severidade ou evolução de fraquezas.
- O dashboard mostrava ferramentas e telemetria, mas não transformava o histórico em uma ação prioritária.
- Não havia uma leitura simples e dedicada do diagnóstico do aluno.
- A calibragem local ainda valida normalização; ela não substitui uma bateria cega com redações oficiais e chamadas reais do modelo.

## Arquitetura proposta

1. `essay-review`: extrai avaliação estruturada, evidências, trechos críticos e ação recomendada.
2. `essay_reviews`: fonte imutável do histórico de correções.
3. `user_weaknesses`: memória derivada por competência, atualizada automaticamente após cada correção.
4. `/diagnostico`: transforma histórico e memória em leitura rápida para o aluno.
5. Dashboard: escolhe uma prioridade e conduz para correção ou diagnóstico.
6. Tutor e plano de estudos: nas fases seguintes, consomem esse contexto enxuto em vez do histórico inteiro.

## Fase 1 implementada

- Criada uma primeira suite local de benchmarks para calibragem do corretor.
- Adicionado comando `npm run test:essay`.
- Criados casos base para redacao fraca, mediana e forte.
- A suite testa a normalizacao atual sem consumir creditos, sem chamar Groq e sem mexer no banco.
- Corrigido o contrato `competencias` entre prompt e normalizador.
- Adicionados evidências, exercício recomendado, erros recorrentes e trechos críticos à saída estruturada.
- Criada memória `user_weaknesses` com frequência, severidade, último resultado e status.
- Criado gatilho que atualiza a memória após novas correções, sem apagar ou reescrever o histórico.
- Criada a rota `/diagnostico`.
- Adicionado “Seu próximo passo” ao dashboard com recomendação baseada nos dados reais do aluno.

## Leitura do primeiro benchmark

- Redacao fraca: passou, mas ficou no teto da faixa esperada.
- Redacao mediana: passou, mas ficou no piso da faixa esperada.
- Redacao forte: passou em faixa alta.

Conclusao: a calibragem atual evita alguns absurdos, mas ainda nao prova qualidade comercial. O proximo passo e testar respostas reais do modelo e transformar a avaliacao em um fluxo mais verificavel.

## Próximas fases

1. Expandir benchmarks para 6 faixas: 400, 600, 800, 920, 960 e 1000.
2. Criar testes com resposta real da IA quando `GROQ_API_KEY` estiver disponivel no ambiente local.
3. Separar internamente a correção em etapas:
   - extracao de evidencias do texto;
   - avaliacao por competencia;
   - aplicacao de travas;
   - nota final;
   - feedback acionavel.
4. Reescrever o prompt do corretor para obrigar evidencias antes da nota.
5. Ajustar a interface de resultado para parecer uma devolutiva de professor, nao um relatorio generico.
6. Validar a experiência com estudantes antes de ampliar plano, treino e retenção.

### Fase 2 — Evolução

- Plano semanal derivado das fraquezas.
- Timeline de evolução e comparação entre redações.
- Resolução e reabertura de padrões recorrentes por evidência.

### Fase 3 — Tutor contextual

- Tutor alimentado por `student_profile`, `user_weaknesses` e últimas correções.
- Explicação de erros e exercícios curtos baseados no diagnóstico.

### Fora desta entrega

- Não foi criado RAG complexo, novo provedor, gamificação, simulado ou agentes autônomos.
- Ferramentas atuais não foram removidas; apenas perderam prioridade conceitual diante do corretor.

## Critério comercial

Antes de campanha, o AprovaAI precisa corrigir uma redacao ruim sem inflar nota, reconhecer uma redacao excelente sem inventar defeitos e entregar um plano de melhoria claro para a proxima tentativa.
