# Aprova.AI

App web mobile-first para estudantes do ENEM começarem do zero com diagnóstico, plano diário, progresso visual, gamificação, conquistas e mentor de dúvidas.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase Auth + Postgres
- Vercel

## Status da integração

- Repositório: `HigorBusy/Aprova-AI`
- Supabase: projeto `Aprova-AI` (`vlusabbvvbzdncxwcqzv`)
- Schema: aplicado via migrations `initial_aprova_ai_schema` e `add_indexes_and_refine_subjects_policies`
- RLS: habilitado em todas as tabelas públicas do app
- Vercel: pronto para importar/deployar o repositório como projeto Next.js

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do Supabase. O deploy em produção também pode usar `.env.production`, que contém apenas variáveis públicas `NEXT_PUBLIC_*`.

## Banco

O SQL completo está em `supabase/schema.sql`. Ele cria as tabelas pedidas, habilita RLS, adiciona grants explícitos para a Data API do Supabase e cria índices para as chaves estrangeiras.

Tabelas principais:

- `profiles`
- `study_goals`
- `daily_progress`
- `subjects`
- `topics`
- `tasks`
- `xp_history`
- `achievements`
- `notifications`
- `doubt_uploads`
- `mentor_messages`
- `streaks`
