# AprovaAI - Fase 1 da reforma

Data: 21 de agosto de 2026

## Entregue

- configuracao central da data do ENEM e dos custos em creditos;
- trial de 5 creditos, suficiente para uma correcao completa;
- concessao inicial registrada no ledger e protegida contra duplicacao trivial;
- onboarding academico de cinco perguntas;
- home autenticada reorganizada em torno de Hoje;
- contagem regressiva em dias para o primeiro dia do ENEM 2026;
- proximo passo calculado a partir de redacoes e fraquezas reais;
- corretor de redacao como ferramenta principal;
- resultado detalhado por competencia, diagnostico e ate tres proximas acoes;
- Tutor IA aberto com contexto da dificuldade detectada;
- navegacao simplificada para Hoje, Evolucao e Tutor IA;
- criacao de apresentacoes removida da experiencia e bloqueada nos endpoints;
- dados historicos de apresentacoes preservados, mas ocultos do Tutor.

## Banco

A migration `20260821043955_phase1_trial_and_learning_profile.sql` foi aplicada ao projeto Supabase `vlusabbvvbzdncxwcqzv`.

Ela adiciona os campos academicos do onboarding, cria a RPC segura de conclusao do diagnostico, configura o saldo inicial e revoga as operacoes de criacao e edicao de apresentacoes. Nenhuma tabela ou dado existente foi apagado.

## Validacao

- TypeScript: aprovado;
- build Next.js: aprovado;
- benchmark de redacao: 4 cenarios aprovados;
- mobile 390x844: sem overflow horizontal;
- cadastro gratuito: interface e saldo inicial exibidos corretamente;
- endpoint de apresentacoes: HTTP 410 antes de autenticacao, creditos ou IA;
- producao: deployment `dpl_9pL3rbYY3n7iXuBADTRhVMxsQ64C` marcado como Ready e Current;
- dominio: `https://aprova-ai-gray.vercel.app`;
- teste autenticado: dashboard, creditos, historico de redacoes e Tutor contextual carregados.

## Fora da Fase 1

O Centro de Questoes e Simulados pertence as Fases 2 e 3. Ele nao foi simulado com dados falsos nem adicionado de forma superficial nesta entrega.
