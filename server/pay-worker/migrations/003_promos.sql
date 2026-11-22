-- 22.11.2026: свои промокоды приложения (не Stripe). Применить один раз: sh ./cf.sh d1 execute sb-pay --remote --file migrations/003_promos.sql
--   kind 'free'  — Pro на days дней без карты и без оплаты (сервер выдаёт сам)
--   kind 'trial' — платный триал: price_cents сразу, days дней доступа, потом полная цена подписки (Stripe trial + разовая позиция)
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
