# Rastreador de Hábitos

**Chave Única Oficial (Hash):** `P26-3A-A62B-A2AD-D639-37FA`

Projeto #10 — Eduardo Grabowski · Turma 3A · RA 2025207270

Painel de hábitos diários com grade mensal, login via Discord, persistência no Cloudflare D1 e métricas calculadas no backend (maior sequência, sequência atual e taxa de cumprimento mensal).

- **Aplicação online:** `https://SEU-PROJETO.pages.dev` (preencher após o deploy)
- **Licença:** MIT (ver `LICENSE`)
- **Agentes, harness e skills:** ver [`AGENTS.md`](AGENTS.md)

## Stack

- Cliente: HTML5, CSS3 e JavaScript puro (sem frameworks) em `public/`
- Backend: Cloudflare Pages Functions em `functions/`
- Banco: Cloudflare D1 (`migrations/0001_init.sql`)
- Autenticação: OAuth2 do Discord (`user_id`, nome e avatar), sessão em cookie assinado (HMAC-SHA256)

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/login` | Inicia o OAuth2 com o Discord |
| GET | `/auth/callback` | Conclui o login e cria a sessão |
| POST | `/auth/logout` | Encerra a sessão |
| GET | `/api/me` | Usuário autenticado |
| GET | `/api/dashboard?month=YYYY-MM` | Hábitos, conclusões do mês e métricas |
| POST | `/api/habits` | Cria hábito `{ name }` |
| DELETE | `/api/habits/:id` | Remove hábito (somente o dono) |
| PUT | `/api/completions` | Marca/desmarca dia `{ habit_id, date, done }` |

Regras validadas no servidor: sessão obrigatória, dono do hábito, data válida, sem datas futuras, nome de 1 a 60 caracteres, máximo de 30 hábitos por usuário.

## Métricas

- **Maior sequência:** maior número de dias consecutivos em todo o histórico do hábito.
- **Sequência atual:** dias consecutivos até hoje; se hoje ainda não foi marcado, conta até ontem.
- **Taxa mensal:** dias cumpridos ÷ dias decorridos do mês (mês corrente) ou ÷ dias do mês (mês passado). Fuso: `America/Sao_Paulo`.
- Os indicadores gerais mostram o maior valor de sequência entre os hábitos e a média das taxas.

## Como publicar (Cloudflare)

1. `npm install`
2. `npx wrangler login`
3. `npx wrangler d1 create habit-tracker-db` e copie o `database_id` para `wrangler.toml`.
4. `npm run db:remote` (cria as tabelas).
5. Crie um app em <https://discord.com/developers/applications>. Em OAuth2 > Redirects, adicione `https://SEU-PROJETO.pages.dev/auth/callback`.
6. `npx wrangler pages project create habit-tracker --production-branch main`
7. `npm run deploy`
8. No painel Cloudflare, em Pages > habit-tracker > Settings:
   - Bindings > D1: variável `DB` apontando para `habit-tracker-db`.
   - Variables and Secrets: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SESSION_SECRET` (string aleatória longa).
9. Refaça o deploy (`npm run deploy`) para aplicar bindings e segredos.

## Desenvolvimento local

Crie `.dev.vars` (não versionado):

```
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
SESSION_SECRET=uma-string-aleatoria-longa
```

Adicione `http://localhost:8788/auth/callback` como redirect no Discord e rode `npm run db:local && npm run dev`.

## Testes

```
npm test
```

## Licença

MIT. Veja `LICENSE`.
