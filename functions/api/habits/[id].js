import { authed, err } from '../../_lib/http.js';

// DELETE /api/habits/:id  (só o dono; remove conclusões em cascata)
export const onRequestDelete = authed(async ({ env, user, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return err('ID inválido.');
  const owned = await env.DB.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!owned) return err('Hábito não encontrado.', 404);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM completions WHERE habit_id = ?').bind(id),
    env.DB.prepare('DELETE FROM habits WHERE id = ?').bind(id),
  ]);
  return new Response(null, { status: 204 });
});
