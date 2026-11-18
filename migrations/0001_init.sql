-- Habit Tracker - esquema inicial (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- Discord user_id
  username TEXT NOT NULL,
  avatar TEXT,                      -- URL completa do avatar
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

CREATE TABLE IF NOT EXISTS completions (
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,               -- YYYY-MM-DD
  PRIMARY KEY (habit_id, date)
);
