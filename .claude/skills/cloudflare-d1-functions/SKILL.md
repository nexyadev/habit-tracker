---
name: cloudflare-d1-functions
description: Padrões para Cloudflare Pages Functions com D1: roteamento por arquivos, bindings, migrações, consultas parametrizadas e deploy via Wrangler.
---

# Cloudflare Pages Functions + D1

- Rotas por arquivo em `functions/`: `functions/api/habits/[id].js` -> `/api/habits/:id`. Exporte `onRequestGet`, `onRequestPost`, `onRequestPut`, `onRequestDelete`.
- O banco chega em `context.env.DB` (binding D1 definido em `wrangler.toml` e no painel do Pages).
- Sempre usar `env.DB.prepare(sql).bind(...)`; nunca concatenar entrada do usuário.
- Operações que devem ser atômicas usam `env.DB.batch([...])`.
- `INSERT OR IGNORE` com chave primária composta torna a marcação de dia idempotente.
- Migração: `wrangler d1 execute <db> --local|--remote --file=migrations/0001_init.sql`.
- Segredos (`DISCORD_CLIENT_SECRET`, `SESSION_SECRET`) vão em `wrangler pages secret put` ou no painel; localmente em `.dev.vars` (ignorado pelo git).
- Validar no servidor: autenticação, propriedade do recurso, formato e intervalo de datas.
