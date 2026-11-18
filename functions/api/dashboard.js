import { authed, err, json } from '../_lib/http.js';
import { daysInMonth, habitStats, isValidMonth, todayISO } from '../_lib/stats.js';

// GET /api/dashboard?month=YYYY-MM
// Retorna hábitos, conclusões do mês e métricas consolidadas calculadas no servidor.
export const onRequestGet = authed(async ({ request, env, user }) => {
  const today = todayISO();
  const month = new URL(request.url).searchParams.get('month') || today.slice(0, 7);
  if (!isValidMonth(month)) return err('Mês inválido (use YYYY-MM).');

  const habits = (await env.DB.prepare('SELECT id, name FROM habits WHERE user_id = ? ORDER BY id').bind(user.id).all()).results;
  const rows = (await env.DB.prepare(
    `SELECT c.habit_id, c.date FROM completions c
     JOIN habits h ON h.id = c.habit_id WHERE h.user_id = ?`
  ).bind(user.id).all()).results;

  const byHabit = new Map(habits.map((h) => [h.id, []]));
  for (const r of rows) byHabit.get(r.habit_id)?.push(r.date);

  const out = habits.map((h) => {
    const dates = byHabit.get(h.id);
    return {
      id: h.id,
      name: h.name,
      done_dates: dates.filter((d) => d.startsWith(month)),
      stats: habitStats(dates, month, today),
    };
  });

  const overall = out.length
    ? {
        longest_streak: Math.max(...out.map((h) => h.stats.longest_streak)),
        current_streak: Math.max(...out.map((h) => h.stats.current_streak)),
        monthly_rate: Math.round((out.reduce((s, h) => s + h.stats.monthly_rate, 0) / out.length) * 10) / 10,
      }
    : { longest_streak: 0, current_streak: 0, monthly_rate: 0 };

  return json({ month, today, days_in_month: daysInMonth(month), habits: out, overall });
});
