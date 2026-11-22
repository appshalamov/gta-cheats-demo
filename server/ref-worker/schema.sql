-- Рефералка Secret Base (server/ref-worker). Сырые IP и почты не храним: только хэши с солью IP_SALT.
-- creators: код креатора → владелец (ключи устройств в creator_keys). email_h — чтобы второй профиль того же человека
--           (Safari и «на экране Домой» — разные хранилища) получил тот же код, а не новый.
CREATE TABLE IF NOT EXISTS creators (code TEXT PRIMARY KEY, nick TEXT, email_h TEXT, ip_h TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS creator_keys (key_h TEXT PRIMARY KEY, code TEXT NOT NULL, device TEXT, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS creator_keys_device ON creator_keys(device);
-- devices: одно устройство (хранилище браузера) = одна строка. code — за кем закреплено (первое касание, навсегда).
--   via: link (пришёл по ссылке), match (приложение «на экране Домой» узнано по сети и модели телефона), account (тот же аккаунт оплаты)
--   counted: 1 — засчитано креатору; 0 — свой, сверх лимита с одного IP, или это второе хранилище того же человека (parent)
CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, code TEXT, via TEXT, counted INTEGER NOT NULL DEFAULT 0, parent TEXT,
  ip_h TEXT, ua_c TEXT, standalone INTEGER NOT NULL DEFAULT 0, v TEXT, pay_h TEXT,
  first_at INTEGER NOT NULL, attr_at INTEGER, installed_at INTEGER, onboarded_at INTEGER, seen_at INTEGER);
CREATE INDEX IF NOT EXISTS devices_code ON devices(code, counted);
CREATE INDEX IF NOT EXISTS devices_ip ON devices(ip_h, code, attr_at);
-- clicks: открытие ссылки креатора, одно на пару (код, устройство)
CREATE TABLE IF NOT EXISTS clicks (code TEXT NOT NULL, device TEXT NOT NULL, at INTEGER NOT NULL, ip_h TEXT, ua_c TEXT, v TEXT,
  standalone INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (code, device));
CREATE INDEX IF NOT EXISTS clicks_match ON clicks(ip_h, ua_c, at);
CREATE INDEX IF NOT EXISTS clicks_code_at ON clicks(code, at);
-- accounts: аккаунт оплаты (хэш почты Google) → креатор; pays: оплата Pro (одна на аккаунт)
CREATE TABLE IF NOT EXISTS accounts (pay_h TEXT PRIMARY KEY, code TEXT NOT NULL, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS pays (pay_h TEXT PRIMARY KEY, code TEXT NOT NULL, device TEXT, plan TEXT, counted INTEGER NOT NULL DEFAULT 1, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS pays_code ON pays(code, counted);
