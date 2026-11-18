// Funções puras de data e métricas (testáveis em Node, sem dependência da Cloudflare).

export const TZ = 'America/Sao_Paulo';

/** Data de hoje (YYYY-MM-DD) no fuso do Brasil. */
export function todayISO(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return parts; // en-CA => YYYY-MM-DD
}

export function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function isValidMonth(s) {
  return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export function daysInMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function dayNumber(iso) {
  return Math.floor(new Date(iso + 'T00:00:00Z').getTime() / 86400000);
}

/**
 * Maior sequência de dias consecutivos em todo o histórico.
 * @param {string[]} dates datas YYYY-MM-DD (podem vir desordenadas/duplicadas)
 */
export function longestStreak(dates) {
  const nums = [...new Set(dates)].map(dayNumber).sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = n;
  }
  return best;
}

/**
 * Sequência atual: dias consecutivos terminando hoje.
 * Se hoje ainda não foi marcado, a sequência que termina ontem continua válida
 * (o usuário ainda tem o dia de hoje para cumprir).
 */
export function currentStreak(dates, today) {
  const set = new Set(dates);
  let n = dayNumber(today);
  if (!set.has(today)) n -= 1;
  let streak = 0;
  while (set.has(isoFromDayNumber(n))) { streak++; n--; }
  return streak;
}

function isoFromDayNumber(n) {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}

/**
 * Taxa de cumprimento do mês (0-100).
 * Mês corrente: considera apenas os dias já decorridos (até hoje).
 * Mês passado: mês inteiro. Mês futuro: 0.
 */
export function monthlyRate(dates, month, today) {
  const total = daysInMonth(month);
  const thisMonth = today.slice(0, 7);
  let elapsed;
  if (month < thisMonth) elapsed = total;
  else if (month > thisMonth) elapsed = 0;
  else elapsed = Number(today.slice(8, 10));
  if (elapsed === 0) return 0;
  const done = new Set(dates.filter((d) => d.startsWith(month) && d <= today));
  return Math.round((done.size / elapsed) * 1000) / 10; // 1 casa decimal
}

export function habitStats(dates, month, today) {
  return {
    longest_streak: longestStreak(dates),
    current_streak: currentStreak(dates, today),
    monthly_rate: monthlyRate(dates, month, today),
    month_done: new Set(dates.filter((d) => d.startsWith(month))).size,
  };
}
