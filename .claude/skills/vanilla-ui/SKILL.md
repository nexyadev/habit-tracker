---
name: vanilla-ui
description: Boas práticas de interface com HTML, CSS e JavaScript puro: DOM seguro, atualização otimista, acessibilidade e responsividade.
---

# UI em Vanilla JS

- Construir DOM com `createElement`/`textContent`; evitar `innerHTML` com dados externos (XSS).
- Estado em um objeto simples; funções `render*` separadas de ações (`toggle`, `removeHabit`).
- Atualização otimista: alterar a interface na hora, chamar a API e reverter se falhar.
- Barras de progresso em CSS: `width` em porcentagem com `transition`.
- Grade larga: contêiner com `overflow-x: auto` e primeira coluna `position: sticky`.
- Acessibilidade: `label` ou `aria-label` em todo controle, `role="progressbar"`, `aria-live` para mensagens.
- Responsividade: `auto-fit/minmax` nos indicadores e media query para telas estreitas.
