-- Secret Base — аккаунты (вход через Google) и оплата Stripe. D1 (SQLite). Применить: wrangler d1 execute sb-pay --file schema.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- свой id (uuid)
  google_sub TEXT UNIQUE NOT NULL,   -- id пользователя Google
  email TEXT NOT NULL,
  name TEXT,
  customer_id TEXT,                  -- покупатель Stripe (cus_…)
  created INTEGER NOT NULL,
  last_login INTEGER
);
CREATE INDEX IF NOT EXISTS users_email ON users(email);
CREATE INDEX IF NOT EXISTS users_customer ON users(customer_id);

-- сессии приложения: храним только SHA-256 токена
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL
);

-- вход через Google: state и PKCE живут здесь 10 минут (не в браузере: на iPhone Safari и приложение «на экране Домой» — разные хранилища)
CREATE TABLE IF NOT EXISTS auth_states (
  state TEXT PRIMARY KEY,
  verifier TEXT NOT NULL,
  return_url TEXT NOT NULL,
  plan TEXT,
  lang TEXT,
  created INTEGER NOT NULL
);

-- одноразовые билеты: возврат в приложение после входа (login) и вход кодом на другом устройстве (pair)
CREATE TABLE IF NOT EXISTS tickets (
  hash TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires INTEGER NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0
);

-- доступ Pro: одна строка на подписку (sub_…) или разовый пропуск (cs_…)
CREATE TABLE IF NOT EXISTS ents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_id TEXT,
  kind TEXT NOT NULL,                -- 'sub' | 'pass'
  plan TEXT NOT NULL,                -- 'year' | 'month' | 'pass'
  status TEXT NOT NULL,              -- статус Stripe: active, trialing, past_due, canceled, paid, refunded…
  until INTEGER NOT NULL,            -- мс: до какого момента действует
  cancel_at_end INTEGER NOT NULL DEFAULT 0,
  live INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ents_user ON ents(user_id);
CREATE INDEX IF NOT EXISTS ents_customer ON ents(customer_id);

-- вебхуки: повторная доставка не обрабатывается дважды
CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, type TEXT, created INTEGER);

-- настройки, которые Worker создал сам в Stripe (секрет вебхука, конфигурация портала)
CREATE TABLE IF NOT EXISTS config (k TEXT PRIMARY KEY, v TEXT NOT NULL);

-- неудачные попытки ввода кода с другого устройства (защита от подбора): ключ 'pair:<ip>' и 'pair:all'
CREATE TABLE IF NOT EXISTS fails (k TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS fails_k_at ON fails(k, at);
