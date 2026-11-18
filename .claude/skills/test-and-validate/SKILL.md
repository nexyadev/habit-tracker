---
name: test-and-validate
description: Procedimento de testes e validação do projeto: testes unitários com node:test, checagem de sintaxe, revisão de segurança e checklist da rubrica.
---

# Teste e validação

- Testes unitários: `npm test` (runner nativo `node:test`, sem dependências).
- Casos obrigatórios para métricas: lista vazia, datas duplicadas/desordenadas, virada de mês e de ano, sequência atual com hoje pendente, mês corrente x passado x futuro.
- Casos de sessão: token válido, assinatura adulterada, segredo errado, token expirado.
- Sintaxe: `node --check <arquivo>` em todos os `.js`.
- Segurança: toda rota de dados exige sessão; todo acesso a hábito filtra por `user_id`; SQL apenas com `bind`; nenhum segredo no repositório.
- Rubrica: chave no README e rodapé, LICENSE MIT, AGENTS.md, skills, repositório público, URL online.
