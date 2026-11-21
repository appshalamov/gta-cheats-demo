-- 20.11.2026: вход по почте и паролю. google_sub становится необязательным (покупатель без Google), добавлены пароль и «почта подтверждена».
-- Применить один раз: sh ./cf.sh d1 execute sb-pay --remote --file migrations/002_email_auth.sql
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  customer_id TEXT,
  created INTEGER NOT NULL,
  last_login INTEGER,
  pw TEXT,
  pw_at INTEGER,
  email_ok INTEGER NOT NULL DEFAULT 0
);
INSERT INTO users_new (id, google_sub, email, name, customer_id, created, last_login, email_ok)
  SELECT id, google_sub, lower(email), name, customer_id, created, last_login, 1 FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
CREATE INDEX IF NOT EXISTS users_email ON users(email);
CREATE INDEX IF NOT EXISTS users_customer ON users(customer_id);
