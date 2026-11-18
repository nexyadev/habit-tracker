---
name: discord-oauth2
description: Fluxo OAuth2 (authorization code) do Discord com escopo identify, state anti-CSRF e sessão por cookie assinado.
---

# Discord OAuth2

1. `GET /auth/login`: gerar `state` aleatório, gravar em cookie HttpOnly de curta duração e redirecionar para `https://discord.com/oauth2/authorize` com `client_id`, `redirect_uri`, `response_type=code`, `scope=identify`, `state`.
2. `GET /auth/callback`: comparar `state` da URL com o cookie; trocar `code` em `POST https://discord.com/api/oauth2/token` (form-urlencoded, com `client_secret`); buscar `GET https://discord.com/api/users/@me`.
3. Persistir `id` (user_id), nome (`global_name` ou `username`) e avatar (URL do CDN) via upsert em `users`.
4. Criar cookie de sessão `HttpOnly; Secure; SameSite=Lax` contendo `{uid, exp}` assinado com HMAC-SHA256 (`SESSION_SECRET`).
5. A redirect URI cadastrada no Discord Developer Portal deve ser exatamente `https://<dominio>/auth/callback`.
