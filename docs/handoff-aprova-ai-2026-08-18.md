# Handoff Pontuei - 18/08/2026

## Estado atual

- Produção: https://pontuei-enem.vercel.app
- Estúdio: https://pontuei-enem.vercel.app/apresentacoes
- Vercel project: `aprova-ai`
- Vercel project ID: `prj_cCgQof0MxKEVlehT0SYHascofNXB`
- Supabase project: `vlusabbvvbzdncxwcqzv`
- Último deployment validado: `dpl_147zvnB4Lhoo8wjD8h8vQUjKVwRU`
- Status do deployment: `READY`
- Conta administrativa: `spacekase925@gmail.com`
- Saldo confirmado após os testes: `952` créditos

## Promessa central preservada

O Pontuei não deve virar uma coleção genérica de ferramentas. O coração comercial continua sendo a evolução do aluno, com o corretor de redação como prova principal. O Estúdio de Apresentações foi reconstruído como um entregável completo, não como texto devolvido por chatbot.

## Estúdio de Apresentações concluído

### Fase 1

- Entrada focada em criação, sem abrir em chat genérico.
- Planejamento antes da geração.
- Perguntas essenciais limitadas.
- Estrutura editável com ordem, tipo, título e objetivo de cada slide.
- Geração estruturada em JSON.
- Preview real.
- Edição manual e salvamento automático.

### Fase 2

- Agentes separados: `presentation_planner`, `slide_writer`, `visual_director`, `presentation_editor`.
- Oito temas: Acadêmico, Moderno, Minimalista, Dark, Corporativo, Criativo, Educacional e Premium.
- Conteúdo, design, notas e IA em painéis separados.
- Notas do apresentador e fontes por slide.
- Edição por IA somente no slide selecionado.
- Edição por IA custa 1 crédito.
- Criação completa custa 10 créditos.

### Fase 3

- Biblioteca de apresentações.
- Reabrir planos e apresentações prontas.
- Renomear, duplicar e excluir com confirmação.
- Exportação real em PDF.
- Exportação real em PPTX com notas e fontes.
- Compartilhamento revogável por link somente leitura.
- Modo público de apresentação e navegação por teclado.
- Histórico, duplicação, exportação e compartilhamento não consomem créditos.

### Fase 4

- Agente `presentation_coach`.
- Roteiro por slide em 30s, 60s e 2min.
- Abertura e fechamento.
- Pontos essenciais.
- Perguntas prováveis e respostas.
- Perguntas gerais do trabalho.
- Modo ensaio com cronômetro e progresso.
- Ocultar roteiro para treinar sem leitura.
- Atalhos: setas navegam, espaço pausa/inicia e Escape retorna ao editor.
- Treino salvo no banco e reutilizado enquanto os slides não mudarem.
- Treino não consome créditos adicionais.

## Banco aplicado

Tabelas principais:

- `presentations`
- `presentation_slides`

Migrations aplicadas:

- `20260818213000_presentation_studio_phase1.sql`
- `20260818214500_presentation_slides_user_index.sql`
- `20260818223000_presentation_slide_ai_edit.sql`
- `20260818233000_presentation_studio_phase3.sql`
- `20260819003000_presentation_rehearsal.sql`

Proteções:

- RLS por proprietário.
- Geração e edição debitam créditos atomicamente.
- Duplicação usa `SECURITY INVOKER` e respeita RLS.
- Compartilhamento público não concede acesso anônimo às tabelas.
- APIs de exportação, treino, duplicação e edição exigem sessão.
- Tokens públicos inexistentes retornam `404`.

## Variáveis confirmadas na Vercel

Os nomes abaixo existem em Production. Os valores permanecem ocultos:

- `GROQ_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Não copie, remova ou recrie essas variáveis sem necessidade.

## Teste obrigatório quando voltar ao computador

1. Acesse https://pontuei-enem.vercel.app e entre na conta.
2. Abra `/apresentacoes`.
3. Crie: `Revolução Francesa em 8 slides para o ensino médio, duração de 8 minutos`.
4. Revise o plano, mova um slide e aprove a geração.
5. Confirme débito de exatamente 10 créditos.
6. Edite manualmente título e notas de um slide; aguarde aparecer `Salvo`.
7. Troque o tema e confirme que o conteúdo não muda.
8. Use IA em apenas um slide; confirme débito de exatamente 1 crédito e que os demais slides permanecem iguais.
9. Clique em `Treinar`; teste 30s, 60s, 2min, perguntas, cronômetro e navegação.
10. Exporte PDF e confirme páginas, acentos e layout.
11. Exporte PPTX e abra no PowerPoint; confira notas do apresentador.
12. Crie link público, abra em aba anônima e depois desative o link.
13. Volte à biblioteca, reabra a apresentação e duplique.
14. Só teste exclusão em uma cópia descartável.
15. Atualize a página e confirme persistência.

## O que foi validado automaticamente

- Contratos e normalização de plano, deck, edição e ensaio.
- TypeScript sem erros.
- Build local.
- Build limpo dentro da Vercel.
- PDF reaberto com contagem correta de páginas.
- PPTX renderizado e validado sem overflow.
- Acentos em PDF, PPTX e respostas JSON.
- Rotas protegidas retornando `401` sem sessão.
- Migration e colunas de ensaio presentes.
- Deployment final `READY` e alias correto.

## O que ainda exige teste humano autenticado

- Geração real pela Groq usando uma apresentação da sua conta.
- Download pelo navegador autenticado.
- Abertura do PPTX no seu PowerPoint.
- Link compartilhado criado por uma apresentação real.
- Experiência visual completa do modo ensaio em desktop e celular.

Não foi consumido crédito para simular esses testes sem sua presença.

## Riscos conhecidos

### Dependências

- Aplicação usa Next.js `14.2.35`.
- Vercel está configurada com Node.js `24.x`.
- O build em produção está funcionando.
- `npm audit --omit=dev` ainda aponta 5 alertas altos transitivos, principalmente Next 14 e `image-size`.
- `pptxgenjs` já foi atualizado para `4.0.1`.
- Não executar `npm audit fix --force`.
- O upgrade principal do Next deve ser uma sprint isolada com teste de login, Supabase, Groq, Cakto, APIs e Vercel.

### Git

O worktree possui muitas alterações acumuladas e arquivos não rastreados de trabalhos anteriores.

Não execute:

- `git reset --hard`
- `git clean -fd`
- `git checkout -- .`
- exclusão manual em massa

Esses comandos podem apagar trabalho ainda não consolidado.

### Supabase

- Nunca apague tabelas ou dados.
- Não desative RLS.
- Não altere saldos diretamente pelo frontend.
- Não exponha `SUPABASE_SERVICE_ROLE_KEY`.

## Comandos locais

Diretório:

```powershell
cd 'C:\Users\Higor Daniel\Documents\Codex\2026-06-08\files-mentioned-by-the-user-texto'
```

Ativar Node local usado nos testes:

```powershell
$env:Path = "$PWD\.tools\node-v20.19.5-win-x64;$env:Path"
```

Verificações:

```powershell
npm.cmd run test:presentation
npm.cmd run test:presentation-export
npm.cmd run typecheck
npm.cmd run build
```

Servidor local:

```powershell
npm.cmd run dev
```

Publicação, somente após build passar:

```powershell
npx.cmd --yes vercel@latest --prod --yes
```

Confirme no final que aparece:

- `readyState: READY`
- `Aliased https://pontuei-enem.vercel.app`

## Arquivos centrais

- `components/presentation-studio.tsx`
- `components/shared-presentation.tsx`
- `lib/ai/presentations/schema.ts`
- `lib/ai/presentations/prompts.ts`
- `lib/ai/presentations/themes.ts`
- `lib/ai/presentations/records.ts`
- `lib/ai/presentations/export.ts`
- `app/api/presentations/`
- `supabase/migrations/`

## Prioridade quando o Kars voltar

1. Executar o fluxo autenticado completo acima.
2. Corrigir qualquer problema real encontrado, sem redesign amplo.
3. Auditar qualidade de uma apresentação gerada pela Groq.
4. Verificar PDF/PPTX com conteúdo longo e 10-14 slides.
5. Só depois planejar upgrade do Next e endurecimento das dependências.
