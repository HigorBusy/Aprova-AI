# Aprova.AI

App web mobile-first para estudantes do ENEM começarem do zero com diagnóstico, plano diário, progresso visual, gamificação, conquistas e mentor de dúvidas.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase Auth + Postgres
- Vercel

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do Supabase.

## Banco

O SQL completo está em `supabase/schema.sql`. Ele cria as tabelas pedidas, habilita RLS e adiciona grants explícitos para a Data API do Supabase.
