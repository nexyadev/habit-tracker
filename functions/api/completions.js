import { authed, err, json, readJson } from '../_lib/http.js';
import { isValidDate, todayISO } from '../_lib/stats.js';

// PUT /api/completions  { habit_id, date, done }
// Regras validadas no servidor: dono do hábito, data válida, não pode ser futura.
export const onRequestPut = authed(async ({ request, env, user }) => {
  const body = await readJson(request);
  const habitId = Number(body?.habit_id);
  const { date, done } = body || {};

  if (!Number.isInteger(habitId)) return err('habit_id inválido.');
  if (!isValidDate(date)) return err('Data inválida (use YYYY-MM-DD).');
  if (typeof done !== 'boolean') return err('Campo "done" deve ser booleano.');
  if (date > todayISO()) return err('Não é possível marcar dias futuros.', 422);

  const habit = await env.DB.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').bind(habitId, user.id).first();
  if (!habit) return err('Hábito não encontrado.', 404);

  if (done) {
    await env.DB.prepare('INSERT OR IGNORE INTO completions (habit_id, date) VALUES (?, ?)').bind(habitId, date).run();
  } else {
    await env.DB.prepare('DELETE FROM completions WHERE habit_id = ? AND date = ?').bind(habitId, date).run();
  }
  return json({ habit_id: habitId, date, done });
});
