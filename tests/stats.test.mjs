import test from 'node:test';
import assert from 'node:assert/strict';
import {
  currentStreak, daysInMonth, habitStats, isValidDate, isValidMonth, longestStreak, monthlyRate, todayISO,
} from '../functions/_lib/stats.js';
import { sign, verify } from '../functions/_lib/session.js';

test('isValidDate / isValidMonth', () => {
  assert.equal(isValidDate('2026-02-28'), true);
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2026-2-3'), false);
  assert.equal(isValidDate(20260101), false);
  assert.equal(isValidMonth('2026-12'), true);
  assert.equal(isValidMonth('2026-13'), false);
});

test('daysInMonth (inclui bissexto)', () => {
  assert.equal(daysInMonth('2026-02'), 28);
  assert.equal(daysInMonth('2028-02'), 29);
  assert.equal(daysInMonth('2026-11'), 30);
});

test('longestStreak', () => {
  assert.equal(longestStreak([]), 0);
  assert.equal(longestStreak(['2026-11-01']), 1);
  assert.equal(longestStreak(['2026-11-03', '2026-11-01', '2026-11-02', '2026-11-10', '2026-11-11']), 3);
  assert.equal(longestStreak(['2026-11-01', '2026-11-01']), 1); // duplicadas
  assert.equal(longestStreak(['2026-10-31', '2026-11-01']), 2); // vira o mês
  assert.equal(longestStreak(['2026-12-31', '2027-01-01']), 2); // vira o ano
});

test('currentStreak: termina hoje ou ontem', () => {
  const today = '2026-11-17';
  assert.equal(currentStreak([], today), 0);
  assert.equal(currentStreak(['2026-11-15', '2026-11-16', '2026-11-17'], today), 3);
  assert.equal(currentStreak(['2026-11-15', '2026-11-16'], today), 2); // hoje ainda pendente
  assert.equal(currentStreak(['2026-11-14', '2026-11-15'], today), 0); // quebrou
  assert.equal(currentStreak(['2026-11-10', '2026-11-17'], today), 1);
});

test('monthlyRate: mês corrente usa dias decorridos', () => {
  const today = '2026-11-10';
  const dates = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
  assert.equal(monthlyRate(dates, '2026-11', today), 50);
});

test('monthlyRate: mês passado usa o mês inteiro; futuro é 0', () => {
  const today = '2026-11-10';
  const dates = Array.from({ length: 15 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
  assert.equal(monthlyRate(dates, '2026-10', today), Math.round((15 / 31) * 1000) / 10);
  assert.equal(monthlyRate(dates, '2026-12', today), 0);
});

test('habitStats consolida as métricas', () => {
  const s = habitStats(['2026-11-08', '2026-11-09', '2026-11-10'], '2026-11', '2026-11-10');
  assert.deepEqual(s, { longest_streak: 3, current_streak: 3, monthly_rate: 30, month_done: 3 });
});

test('todayISO retorna formato YYYY-MM-DD', () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(todayISO(new Date('2026-11-18T02:00:00Z')), '2026-11-17'); // UTC-3
});

test('sessão assinada: válida, adulterada e expirada', async () => {
  const secret = 'segredo-de-teste';
  const exp = Math.floor(Date.now() / 1000) + 60;
  const token = await sign({ uid: '123', exp }, secret);
  assert.equal((await verify(token, secret)).uid, '123');
  assert.equal(await verify(token, 'outro-segredo'), null);
  assert.equal(await verify(token.slice(0, -2) + 'xx', secret), null);
  const expired = await sign({ uid: '123', exp: Math.floor(Date.now() / 1000) - 5 }, secret);
  assert.equal(await verify(expired, secret), null);
});
