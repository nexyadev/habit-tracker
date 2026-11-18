'use strict';
// Rastreador de Hábitos - cliente em Vanilla JS (sem frameworks).
// Toda renderização usa textContent/createElement (sem innerHTML com dados do usuário).

const $ = (id) => document.getElementById(id);
const state = { month: null, data: null };

const pad = (n) => String(n).padStart(2, '0');
const fmt1 = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) { showLogin(); throw new Error('Não autenticado'); }
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Erro ${res.status}`);
  return body;
}

function showMessage(text) {
  const el = $('msg');
  el.textContent = text || '';
  el.hidden = !text;
}

function showLogin() {
  $('login-view').hidden = false;
  $('app-view').hidden = true;
  $('userbox').hidden = true;
}

function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

// ---------- Métricas e barras de progresso (atualização imediata no cliente) ----------
function elapsedDays(d) {
  const { month, today, days_in_month } = d;
  const cur = today.slice(0, 7);
  if (month < cur) return days_in_month;
  if (month > cur) return 0;
  return Number(today.slice(8, 10));
}

function updateProgress(habit) {
  const elapsed = elapsedDays(state.data);
  const pct = elapsed ? Math.min(100, (habit.done_dates.length / elapsed) * 100) : 0;
  const bar = document.querySelector(`[data-progress="${habit.id}"]`);
  if (bar) bar.style.width = pct + '%';
  const meta = document.querySelector(`[data-meta="${habit.id}"]`);
  if (meta) {
    meta.textContent = `${habit.done_dates.length}/${elapsed} dias · ${fmt1(pct)}% · maior seq.: ${habit.stats.longest_streak} · atual: ${habit.stats.current_streak}`;
  }
}

function renderIndicators() {
  const o = state.data.overall;
  $('ind-longest').textContent = o.longest_streak;
  $('ind-current').textContent = o.current_streak;
  $('ind-rate').textContent = fmt1(o.monthly_rate) + '%';
}

// ---------- Renderização da grade ----------
function renderGrid() {
  const d = state.data;
  const table = $('grid');
  table.replaceChildren();
  $('empty').hidden = d.habits.length > 0;
  if (!d.habits.length) return;

  const head = table.createTHead().insertRow();
  const corner = document.createElement('th');
  corner.className = 'sticky';
  corner.textContent = 'Hábito';
  head.appendChild(corner);
  for (let day = 1; day <= d.days_in_month; day++) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = day;
    if (`${d.month}-${pad(day)}` === d.today) th.className = 'today';
    head.appendChild(th);
  }

  const body = table.createTBody();
  for (const habit of d.habits) {
    const row = body.insertRow();
    const first = row.insertCell();
    first.className = 'sticky';

    const top = document.createElement('div');
    top.className = 'habit-head';
    const name = document.createElement('span');
    name.className = 'habit-name';
    name.textContent = habit.name;
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.title = 'Excluir hábito';
    del.setAttribute('aria-label', `Excluir ${habit.name}`);
    del.textContent = '✕';
    del.addEventListener('click', () => removeHabit(habit));
    top.append(name, del);

    const meta = document.createElement('div');
    meta.className = 'habit-meta';
    meta.dataset.meta = habit.id;

    const prog = document.createElement('div');
    prog.className = 'progress';
    prog.setAttribute('role', 'progressbar');
    const fill = document.createElement('span');
    fill.dataset.progress = habit.id;
    prog.appendChild(fill);
    first.append(top, meta, prog);

    const done = new Set(habit.done_dates);
    for (let day = 1; day <= d.days_in_month; day++) {
      const date = `${d.month}-${pad(day)}`;
      const cell = row.insertCell();
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = done.has(date);
      box.disabled = date > d.today;
      box.setAttribute('aria-label', `${habit.name} em ${pad(day)}/${d.month.slice(5)}`);
      box.addEventListener('change', () => toggle(habit, date, box));
      cell.appendChild(box);
    }
    updateProgress(habit);
  }
}

// ---------- Ações ----------
async function toggle(habit, date, box) {
  const wanted = box.checked;
  // Atualização otimista: barra de progresso muda imediatamente.
  const idx = habit.done_dates.indexOf(date);
  if (wanted && idx === -1) habit.done_dates.push(date);
  if (!wanted && idx > -1) habit.done_dates.splice(idx, 1);
  updateProgress(habit);
  showMessage('');
  try {
    await api('/api/completions', { method: 'PUT', body: JSON.stringify({ habit_id: habit.id, date, done: wanted }) });
    await load(false); // métricas oficiais vêm do backend
  } catch (e) {
    box.checked = !wanted; // reverte
    await load(true);
    showMessage(e.message);
  }
}

async function removeHabit(habit) {
  if (!confirm(`Excluir o hábito "${habit.name}" e todo o seu histórico?`)) return;
  try {
    await api(`/api/habits/${habit.id}`, { method: 'DELETE' });
    await load(true);
  } catch (e) { showMessage(e.message); }
}

async function load(rerender = true) {
  const data = await api(`/api/dashboard?month=${state.month}`);
  if (!rerender && state.data && state.data.month === data.month) {
    // Mantém os mesmos objetos (referenciados pelos listeners dos checkboxes) e só atualiza os valores.
    for (const fresh of data.habits) {
      const old = state.data.habits.find((h) => h.id === fresh.id);
      if (old) Object.assign(old, fresh);
    }
    Object.assign(state.data, { ...data, habits: state.data.habits });
  } else {
    state.data = data;
    rerender = true;
  }
  $('month-label').textContent = monthLabel(data.month);
  renderIndicators();
  if (rerender) renderGrid();
  else state.data.habits.forEach(updateProgress);
}

// ---------- Inicialização ----------
$('habit-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const input = $('habit-name');
  const name = input.value.trim();
  if (!name) return;
  try {
    await api('/api/habits', { method: 'POST', body: JSON.stringify({ name }) });
    input.value = '';
    showMessage('');
    await load(true);
  } catch (e) { showMessage(e.message); }
});
$('prev').addEventListener('click', () => { state.month = shiftMonth(state.month, -1); load(true); });
$('next').addEventListener('click', () => { state.month = shiftMonth(state.month, 1); load(true); });
$('logout').addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
  showLogin();
});

(async function init() {
  try {
    const { user } = await api('/api/me');
    $('avatar').src = user.avatar || '';
    $('username').textContent = user.username;
    $('userbox').hidden = false;
    $('login-view').hidden = true;
    $('app-view').hidden = false;
    const now = new Date();
    state.month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    await load(true);
  } catch {
    showLogin();
  }
})();
