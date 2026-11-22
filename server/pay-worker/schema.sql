-- Secret Base — аккаунты (вход через Google) и оплата Stripe. D1 (SQLite). Применить: wrangler d1 execute sb-pay --file schema.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- свой id (uuid)
  google_sub TEXT UNIQUE,            -- id пользователя Google (если входил через Google)
  email TEXT NOT NULL,               -- в нижнем регистре
  name TEXT,
  customer_id TEXT,                  -- покупатель Stripe (cus_…)
  created INTEGER NOT NULL,
  last_login INTEGER,
  pw TEXT,                           -- пароль: pbkdf2$<итерации>$<соль>$<хэш>, только хэш
  pw_at INTEGER,
  email_ok INTEGER NOT NULL DEFAULT 0 -- почта подтверждена (Google или код из письма); только тогда ищем покупки по почте
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

-- свои промокоды приложения (22.11.2026): migrations/003_promos.sql
CREATE TABLE IF NOT EXISTS promos (
  code TEXT PRIMARY KEY,             -- ЗАГЛАВНЫЕ латиница и цифры
  kind TEXT NOT NULL,                -- 'free' | 'trial'
  days INTEGER NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  max INTEGER NOT NULL DEFAULT 0,    -- 0 — без лимита
  used INTEGER NOT NULL DEFAULT 0,
  expires INTEGER NOT NULL DEFAULT 0,-- мс; 0 — бессрочно
  active INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created INTEGER NOT NULL
);
-- активации: один раз на почту и один раз на устройство (для каждого кода)
CREATE TABLE IF NOT EXISTS promo_uses (
  id TEXT PRIMARY KEY,               -- 'free:<код>:<user>' или id сессии Stripe
  code TEXT NOT NULL,
  kind TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  device TEXT,
  status TEXT NOT NULL,              -- 'ok' (free выдан), 'started' (оплата открыта), 'paid' (триал оплачен)
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS promo_uses_code ON promo_uses(code);
CREATE INDEX IF NOT EXISTS promo_uses_email ON promo_uses(code, email);
CREATE INDEX IF NOT EXISTS promo_uses_device ON promo_uses(code, device);
