# Agentes, Harness e Skills

Projeto #10 — Rastreador de Hábitos
Chave Única Oficial: `P26-3A-A62B-A2AD-D639-37FA`

## Harness

O projeto foi desenvolvido com **Claude (Anthropic)** no ambiente **Claude Code**, usando o formato de *subagents* e *skills* do próprio harness:

- Agentes: `.claude/agents/*.md` (frontmatter com `name`, `description`, `tools` e `skills`).
- Skills: `.claude/skills/<nome>/SKILL.md`.

## Agentes

| # | Agente | Função | Skills usados | Arquivo |
|---|--------|--------|---------------|---------|
| 1 | `backend-architect` | Esquema D1, Functions, OAuth2 Discord, sessão, regras de negócio e métricas | `cloudflare-d1-functions`, `discord-oauth2` | `.claude/agents/backend-architect.md` |
| 2 | `frontend-builder` | Interface HTML/CSS/JS puro: grade, checkboxes, barras de progresso, indicadores | `vanilla-ui` | `.claude/agents/frontend-builder.md` |
| 3 | `qa-validator` | **Teste e validação** (somente leitura de código de produção): testes, sintaxe, revisão de segurança e da rubrica | `test-and-validate` | `.claude/agents/qa-validator.md` |

## Fluxo de trabalho

1. `backend-architect` definiu o contrato da API e o esquema do banco.
2. `frontend-builder` consumiu esse contrato para montar a interface.
3. `qa-validator` rodou `npm test` (9 testes unitários), checou a sintaxe e revisou segurança e rubrica antes da entrega.

## Skills

| Skill | Conteúdo | Arquivo |
|-------|----------|---------|
| `cloudflare-d1-functions` | Rotas por arquivo, bindings D1, SQL parametrizado, migrações, segredos | `.claude/skills/cloudflare-d1-functions/SKILL.md` |
| `discord-oauth2` | Fluxo authorization code, `state`, sessão assinada | `.claude/skills/discord-oauth2/SKILL.md` |
| `vanilla-ui` | DOM seguro, atualização otimista, acessibilidade, responsividade | `.claude/skills/vanilla-ui/SKILL.md` |
| `test-and-validate` | Testes, sintaxe, segurança e checklist da rubrica | `.claude/skills/test-and-validate/SKILL.md` |
