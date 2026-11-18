import { authed, err, json, readJson } from '../../_lib/http.js';

const MAX_HABITS = 30;

// POST /api/habits  { name }
export const onRequestPost = authed(async ({ request, env, user }) => {
  const body = await readJson(request);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 60) return err('Nome deve ter de 1 a 60 caracteres.');

  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM habits WHERE user_id = ?').bind(user.id).first();
  if (n >= MAX_HABITS) return err(`Limite de ${MAX_HABITS} hábitos atingido.`, 409);

  const res = await env.DB.prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)').bind(user.id, name).run();
  return json({ habit: { id: res.meta.last_row_id, name } }, 201);
});
