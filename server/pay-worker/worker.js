// Secret Base — сервер оплаты и входа (Cloudflare Worker + D1). Без зависимостей: fetch + WebCrypto.
//
// Вход: Google OAuth 2.0 (код + PKCE), только полные переходы страницы — работает в приложении «на экране Домой» iPhone.
//   GET  /auth/google?return=<адрес приложения>&plan=year|month|pass&lang=ru|en → Google → /auth/google/callback
//        → (если выбран тариф) сразу Stripe Checkout → возврат в приложение с ?login=<билет>&paid=<cs_…>
//   POST /auth/exchange {ticket} → {token, user}           одноразовый билет (10 минут) → сессия приложения
//   POST /auth/pair (Bearer) → {code}; POST /auth/pair/redeem {code} → {token}   вход кодом на другом устройстве
//   POST /auth/logout (Bearer)
// Вход по почте (20.11.2026): покупка без входа → почта из Stripe → пароль после оплаты.
//   POST /checkout/guest {plan, return} → {url}                     оплата без аккаунта: почту человек вводит в Stripe
//   POST /claim/guest {session_id} → {token?, need_login?, …/me}    после оплаты: аккаунт по почте из Stripe (один раз на оплату)
//   POST /auth/login {email, password} → {token}                    вход паролем (ограничение попыток)
//   POST /auth/password (Bearer) {password, old?}                   придумать / сменить пароль
//   POST /auth/email/code {email} → {ok}; POST /auth/email/verify {email, code, password?} → {token}   код на почту: «забыли пароль» и «восстановить покупку»
//   Письма: Cloudflare Email Sending (привязка EMAIL); адреса @sbgta.test не отправляются — код лежит в «исходящих» для тестов (GET /admin/outbox)
// Оплата:
//   GET  /me[?sync=1] (Bearer) → {user, pro, prices, country}       Pro — только по данным Stripe (вебхук или прямой запрос)
//   POST /checkout {plan, return} (Bearer) → {url}                   Stripe Checkout (Apple Pay — сам Stripe)
//   POST /claim {session_id} (Bearer) → как /me                      возврат из оплаты: Worker сам спрашивает Stripe
//   POST /portal {return} (Bearer) → {url}                           Stripe Customer Portal: отмена, карта, чеки
//   POST /webhook                                                    Stripe: checkout.session.completed, customer.subscription.*, charge.refunded
//   POST /admin/setup (Bearer ADMIN_TOKEN)                           создать вебхук и конфигурацию портала в Stripe
// Адрес «?paid=…» в приложении ничего не включает сам: Pro даёт только ответ этого сервера.
//
// Секреты (wrangler secret put): STRIPE_SECRET_KEY, GOOGLE_CLIENT_SECRET, ADMIN_TOKEN. Переменные — wrangler.toml.

const ENC = new TextEncoder();
const now = () => Date.now();
const DAY = 864e5;
const PLANS = ['year', 'month', 'pass'];
const EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'customer.subscription.created',
  'customer.subscription.updated', 'customer.subscription.deleted', 'charge.refunded'];

// ───────── мелочи ─────────
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rand = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async (s) => b64u(await crypto.subtle.digest('SHA-256', ENC.encode(s)));
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
function b64uDecode(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return atob(s); }
function safeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
class HttpError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }

const isTest = (env) => !String(env.STRIPE_SECRET_KEY || '').startsWith('sk_live') && !String(env.STRIPE_SECRET_KEY || '').startsWith('rk_live');
const stripeBase = (env) => env.STRIPE_API || 'https://api.stripe.com';

// адреса приложения, куда можно вернуть человека; localhost — только в тестовом режиме Stripe
function okReturn(env, raw) {
  let u; try { u = new URL(raw); } catch { throw new HttpError(400, 'bad_return'); }
  const allowed = String(env.APP_ORIGINS || 'https://sbgta.app').split(',').map((s) => s.trim()).filter(Boolean);
  const local = /^(localhost|127\.0\.0\.1)$/.test(u.hostname) && isTest(env);
  if (!allowed.includes(u.origin) && !local) throw new HttpError(400, 'bad_return');
  return u.origin + u.pathname;   // без старых параметров
}
function corsHeaders(env, req) {
  const o = req.headers.get('Origin') || '';
  let ok = false; try { okReturn(env, o + '/'); ok = true; } catch { }
  return ok ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : { Vary: 'Origin' };
}
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
const redirect = (url) => new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } });
const withParams = (base, p) => base + '?' + Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => `${k}=${k === 'paid' && v === '{CHECKOUT_SESSION_ID}' ? v : encodeURIComponent(v)}`).join('&');

// ───────── Stripe API (form-encoded) ─────────
function form(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  }
  return out.join('&');
}
async function stripe(env, method, path, params) {
  const url = stripeBase(env) + path + (method === 'GET' && params ? '?' + form(params) : '');
  const r = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded', ...(env.STRIPE_VERSION ? { 'Stripe-Version': env.STRIPE_VERSION } : {}) },
    body: method === 'GET' || !params ? undefined : form(params),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.log('stripe', method, path, r.status, d?.error?.message); throw new HttpError(r.status === 404 ? 404 : 502, 'stripe_' + (d?.error?.code || r.status)); }
  return d;
}

// ───────── цены: пояса как в приложении (js/config.js PAYWALL.zones), страна — от Cloudflare ─────────
function prices(env, country) {
  const P = JSON.parse(env.PRICES || '{}');
  const zone = (P.countries || {})[country] || 1;
  return { zone, ...((P.zones || {})[zone] || (P.zones || {})[1] || {}) };
}
const noPay = (env, country) => String(env.NO_PAY || 'RU,BY').split(',').includes(country);

// ───────── сессии и пользователи ─────────
async function userFromReq(env, req) {
  const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const row = await env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires > ?').bind(await sha256(m[1]), now()).first();
  return row || null;
}
async function needUser(env, req) { const u = await userFromReq(env, req); if (!u) throw new HttpError(401, 'auth'); return u; }
async function newSession(env, userId) {
  const token = rand(32);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created, expires) VALUES (?, ?, ?, ?)').bind(await sha256(token), userId, now(), now() + 180 * DAY).run();
  return token;
}
async function newTicket(env, kind, userId, ttl, code) {
  const t = code || rand(24);
  await env.DB.prepare('INSERT OR REPLACE INTO tickets (hash, kind, user_id, expires, tries) VALUES (?, ?, ?, ?, 0)').bind(await sha256(kind + ':' + t), kind, userId, now() + ttl).run();
  return t;
}
async function useTicket(env, kind, t) {
  const h = await sha256(kind + ':' + t);
  const row = await env.DB.prepare('DELETE FROM tickets WHERE hash = ? AND kind = ? RETURNING user_id, expires').bind(h, kind).first();
  if (!row || row.expires < now()) throw new HttpError(400, 'ticket');
  return row.user_id;
}
const pubUser = (u) => ({ email: u.email, name: u.name || '', has_pw: !!u.pw, google: !!u.google_sub });

async function ensureCustomer(env, u) {
  if (u.customer_id) return u.customer_id;
  const c = await stripe(env, 'POST', '/v1/customers', { email: u.email, name: u.name || undefined, metadata: { user_id: u.id } });
  await env.DB.prepare('UPDATE users SET customer_id = ? WHERE id = ?').bind(c.id, u.id).run();
  u.customer_id = c.id;
  return c.id;
}

// ───────── пароли: PBKDF2-SHA256 (WebCrypto в Workers — не больше 100 000 итераций), соль 16 байт ─────────
const PW_ITER = 100000;
async function pbkdf2(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', ENC.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return b64u(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function hashPw(pw) { const salt = crypto.getRandomValues(new Uint8Array(16)); return `pbkdf2$${PW_ITER}$${b64u(salt)}$${await pbkdf2(pw, salt, PW_ITER)}`; }
async function checkPw(pw, stored) {
  const [alg, it, salt, h] = String(stored || '').split('$');
  if (alg !== 'pbkdf2' || !h) return false;
  return safeEq(await pbkdf2(pw, Uint8Array.from(b64uDecode(salt), (c) => c.charCodeAt(0)), Number(it)), h);
}
const okPw = (pw) => typeof pw === 'string' && pw.length >= 8 && pw.length <= 200;
const normEmail = (e) => String(e || '').trim().toLowerCase();
const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200;
const byEmail = (env, email) => env.DB.prepare('SELECT * FROM users WHERE email = ? ORDER BY created LIMIT 1').bind(email).first();
// ограничение попыток: счётчик неудач в D1 (таблица fails), окно в минутах
async function tooMany(env, key, limit, minutes) { return ((await env.DB.prepare('SELECT COUNT(*) n FROM fails WHERE k = ? AND at > ?').bind(key, now() - minutes * 60e3).first())?.n || 0) >= limit; }
async function addFail(env, ...keys) {
  await env.DB.batch([...keys.map((k) => env.DB.prepare('INSERT INTO fails (k, at) VALUES (?, ?)').bind(k, now())), env.DB.prepare('DELETE FROM fails WHERE at < ?').bind(now() - 6 * 3600e3)]);
}
const ipOf = (req) => req.headers.get('CF-Connecting-IP') || 'x';

// ───────── письма: Cloudflare Email Sending; @sbgta.test и тестовый режим без привязки — в «исходящие» (D1 config), не наружу ─────────
async function sendMail(env, to, subject, text) {
  const dry = to.endsWith('@sbgta.test');   // тестовые адреса не уходят наружу никогда
  if (dry) { await setCfg(env, 'outbox:' + to, JSON.stringify({ subject, text, at: now() })); return 'outbox'; }
  if (!env.EMAIL) throw new HttpError(503, 'email_off');
  await env.EMAIL.send({ to, from: { email: env.MAIL_FROM || 'no-reply@sbgta.app', name: 'Secret Base' }, subject, text });
  return 'sent';
}

// ───────── доступ Pro ─────────
const ACTIVE = ['active', 'trialing', 'past_due', 'paid'];
function subUntil(s) {
  const end = s.items?.data?.[0]?.current_period_end || s.current_period_end || 0;
  if (s.status === 'canceled') return Math.min(end * 1000 || now(), (s.ended_at || s.canceled_at || end) * 1000);
  return end * 1000;
}
async function saveSub(env, s, userId) {
  const plan = s.metadata?.plan || (s.items?.data?.[0]?.price?.recurring?.interval === 'month' ? 'month' : 'year');
  const uid = userId || s.metadata?.user_id || (await env.DB.prepare('SELECT id FROM users WHERE customer_id = ?').bind(s.customer).first())?.id || null;
  await env.DB.prepare(`INSERT INTO ents (id, user_id, customer_id, kind, plan, status, until, cancel_at_end, live, updated) VALUES (?, ?, ?, 'sub', ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET user_id = COALESCE(excluded.user_id, ents.user_id), status = excluded.status, until = excluded.until, cancel_at_end = excluded.cancel_at_end, plan = excluded.plan, updated = excluded.updated`)
    .bind(s.id, uid, s.customer, plan, s.status, subUntil(s), s.cancel_at_period_end || s.cancel_at ? 1 : 0, s.livemode ? 1 : 0, now()).run();
}
// разовый пропуск на 3 месяца: срок с покупки, а купленный до выхода игры — с даты выхода (Ресерч 31 §4.4)
function passUntil(env, createdSec) {
  const start = new Date(Math.max(createdSec * 1000, new Date((env.RELEASE || '2026-11-19') + 'T00:00:00Z').getTime()));
  start.setUTCMonth(start.getUTCMonth() + 3);
  return start.getTime();
}
async function saveCheckout(env, cs) {
  const paid = cs.status === 'complete' && (cs.payment_status === 'paid' || cs.payment_status === 'no_payment_required');
  if (!paid) return false;
  const uid = cs.client_reference_id || cs.metadata?.user_id || null;   // без входа — null: аккаунт найдётся по покупателю (/claim/guest)
  if (cs.customer && uid) await env.DB.prepare('UPDATE users SET customer_id = COALESCE(customer_id, ?) WHERE id = ?').bind(cs.customer, uid).run();
  if (cs.mode === 'subscription') {
    const s = typeof cs.subscription === 'object' && cs.subscription ? cs.subscription : await stripe(env, 'GET', '/v1/subscriptions/' + cs.subscription);
    await saveSub(env, s, uid);
  } else {
    const pi = typeof cs.payment_intent === 'object' ? cs.payment_intent?.id : cs.payment_intent;
    await env.DB.prepare(`INSERT INTO ents (id, user_id, customer_id, kind, plan, status, until, cancel_at_end, live, updated) VALUES (?, ?, ?, 'pass', 'pass', 'paid', ?, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET user_id = COALESCE(excluded.user_id, ents.user_id), updated = excluded.updated`)
      .bind(pi || cs.id, uid, cs.customer, passUntil(env, cs.created), cs.livemode ? 1 : 0, now()).run();
  }
  return true;
}
// сверка со Stripe: подписки и пропуски покупателя (вход на новом устройстве, ?sync=1 после портала)
async function syncCustomer(env, u) {
  if (u.email_ok) {   // почта подтверждена: все покупатели Stripe с этой почтой (покупки без входа создают нового покупателя каждый раз)
    const found = await stripe(env, 'GET', '/v1/customers', { email: u.email, limit: 20 });
    for (const c of found.data || []) {
      if (c.id === u.customer_id) continue;
      await env.DB.prepare('UPDATE ents SET user_id = ? WHERE customer_id = ? AND user_id IS NULL').bind(u.id, c.id).run();
      const subs = await stripe(env, 'GET', '/v1/subscriptions', { customer: c.id, status: 'all', limit: 20 });
      for (const s of subs.data || []) await saveSub(env, s, u.id);
      const css = await stripe(env, 'GET', '/v1/checkout/sessions', { customer: c.id, limit: 20 });
      for (const cs of css.data || []) if (cs.mode === 'payment') await saveCheckout(env, { ...cs, client_reference_id: u.id });
      if (!u.customer_id || (subs.data || []).some((s) => ACTIVE.includes(s.status))) { u.customer_id = c.id; await env.DB.prepare('UPDATE users SET customer_id = ? WHERE id = ?').bind(c.id, u.id).run(); }
    }
  }
  if (!u.customer_id && u.email_ok) {   // купил раньше с этим же email — найдём покупателя
    const found = await stripe(env, 'GET', '/v1/customers', { email: u.email, limit: 10 });
    for (const c of found.data || []) {
      const subs = await stripe(env, 'GET', '/v1/subscriptions', { customer: c.id, status: 'all', limit: 20 });
      if ((subs.data || []).length || !u.customer_id) { u.customer_id = c.id; }
      if ((subs.data || []).length) break;
    }
    if (u.customer_id) await env.DB.prepare('UPDATE users SET customer_id = ? WHERE id = ?').bind(u.customer_id, u.id).run();
  }
  if (!u.customer_id) return;
  const subs = await stripe(env, 'GET', '/v1/subscriptions', { customer: u.customer_id, status: 'all', limit: 20 });
  for (const s of subs.data || []) await saveSub(env, s, u.id);
  const css = await stripe(env, 'GET', '/v1/checkout/sessions', { customer: u.customer_id, limit: 20 });
  for (const cs of css.data || []) if (cs.mode === 'payment') await saveCheckout(env, cs);
  await env.DB.prepare('UPDATE ents SET user_id = ? WHERE customer_id = ? AND user_id IS NULL').bind(u.id, u.customer_id).run();
}
async function proOf(env, u) {
  const rows = (await env.DB.prepare('SELECT * FROM ents WHERE user_id = ? OR (customer_id IS NOT NULL AND customer_id = ?)').bind(u.id, u.customer_id || '-').all()).results || [];
  const live = rows.filter((r) => ACTIVE.includes(r.status) && r.until > now()).sort((a, b) => b.until - a.until);
  const best = live[0];
  const hasSub = rows.some((r) => r.kind === 'sub' && ACTIVE.includes(r.status));
  if (!best) return { active: false, plan: null, until: 0, cancel: false, manage: !!u.customer_id, sub: hasSub };
  return { active: true, plan: best.plan, until: best.until, status: best.status, cancel: !!best.cancel_at_end, manage: !!u.customer_id, sub: hasSub };
}
async function meOf(env, req, u) {
  const country = req.cf?.country || '';
  return { user: pubUser(u), pro: await proOf(env, u), prices: prices(env, country), country, nopay: noPay(env, country), test: isTest(env) };
}

// ───────── Checkout и портал ─────────
const NAMES = { year: 'Secret Base Pro — 1 year', month: 'Secret Base Pro — 1 month', pass: 'Secret Base Pro — 3 months (one payment)' };
async function checkoutUrl(env, req, u, plan, ret, ticket, lang) {
  if (!PLANS.includes(plan)) throw new HttpError(400, 'bad_plan');
  const country = req.cf?.country || '';
  if (noPay(env, country)) throw new HttpError(403, 'nopay');
  const pr = prices(env, country);
  if (!pr[plan]) throw new HttpError(400, 'bad_plan');
  const customer = u ? await ensureCustomer(env, u) : null;   // без входа: почту человек вводит в Stripe, покупатель создаётся там
  const sub = plan !== 'pass';
  const meta = { ...(u ? { user_id: u.id } : { guest: '1' }), plan, zone: String(pr.zone) };
  // Managed Payments: Stripe — продавец (merchant of record), сам считает и платит налоги/VAT; нужен tax_code товара
  const mp = String(env.MANAGED_PAYMENTS || '') === '1';
  const cs = await stripe(env, 'POST', '/v1/checkout/sessions', {
    mode: sub ? 'subscription' : 'payment',
    ...(customer ? { customer } : (sub ? {} : { customer_creation: 'always' })),
    ...(u ? { client_reference_id: u.id } : {}),
    success_url: withParams(ret, { paid: '{CHECKOUT_SESSION_ID}', login: ticket }),
    cancel_url: withParams(ret, { paid: 'cancel', login: ticket }),
    line_items: { 0: { quantity: 1, price_data: { currency: 'usd', tax_behavior: env.TAX_BEHAVIOR || 'inclusive', unit_amount: Math.round(pr[plan] * 100), product_data: { name: NAMES[plan], ...(mp ? { tax_code: env.TAX_CODE || 'txcd_10103000' } : {}) }, ...(sub ? { recurring: { interval: plan } } : {}) } } },
    metadata: meta,
    ...(sub ? { subscription_data: { metadata: meta } } : { payment_intent_data: { metadata: meta } }),
    locale: lang === 'ru' ? 'ru' : 'auto',
    ...(mp ? { managed_payments: { enabled: 'true' } } : {}),
    allow_promotion_codes: 'true',   // поле «Промокод» на странице Stripe (бесплатный доступ — /admin/promo)
    ...(sub ? { payment_method_collection: 'if_required' } : {}),   // при сумме $0 карту не спрашивать
  });
  return cs.url;
}
async function cfg(env, k) { return (await env.DB.prepare('SELECT v FROM config WHERE k = ?').bind(k).first())?.v || null; }
async function setCfg(env, k, v) { await env.DB.prepare('INSERT OR REPLACE INTO config (k, v) VALUES (?, ?)').bind(k, v).run(); }

// ───────── вебхук Stripe: подпись (HMAC-SHA256 по «t.тело»), окно 5 минут, без повторов ─────────
async function verifyStripe(env, raw, header) {
  const secret = env.STRIPE_WEBHOOK_SECRET || await cfg(env, 'whsec');
  if (!secret || !header) return false;
  const parts = Object.fromEntries([]); const v1 = [];
  for (const p of header.split(',')) { const [k, v] = p.split('='); if (k === 'v1') v1.push(v); else parts[k] = v; }
  const t = Number(parts.t);
  if (!t || Math.abs(now() / 1000 - t) > 300) return false;
  const key = await crypto.subtle.importKey('raw', ENC.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = hex(await crypto.subtle.sign('HMAC', key, ENC.encode(`${t}.${raw}`)));
  return v1.some((s) => safeEq(s, sig));
}
// полный возврат: пропуск — снять сразу; подписка — отменить в Stripe (без новых списаний) и снять Pro сразу
async function refunded(env, ch) {
  const pi = ch.payment_intent, t = now();
  const pass = await env.DB.prepare("UPDATE ents SET status = 'refunded', until = ?, updated = ? WHERE id = ? RETURNING id").bind(t, t, pi).first();
  if (pass) return;
  let subId = null;
  try {   // новый API: платёж → invoice_payment → счёт → подписка
    const ip = await stripe(env, 'GET', '/v1/invoice_payments', { payment: { type: 'payment_intent', payment_intent: pi }, limit: 1 });
    const invId = ip.data?.[0]?.invoice;
    if (invId) { const inv = await stripe(env, 'GET', '/v1/invoices/' + invId); subId = inv.parent?.subscription_details?.subscription || inv.subscription || null; }
  } catch { }
  if (!subId && ch.invoice) { const inv = await stripe(env, 'GET', '/v1/invoices/' + ch.invoice).catch(() => null); subId = inv?.subscription || inv?.parent?.subscription_details?.subscription || null; }
  if (!subId) return;
  await env.DB.prepare("UPDATE ents SET status = 'refunded', until = ?, updated = ? WHERE id = ?").bind(t, t, subId).run();
  await stripe(env, 'DELETE', '/v1/subscriptions/' + subId).catch(() => { });   // уже отменена — не страшно
}
async function webhook(env, req) {
  const raw = await req.text();
  if (!(await verifyStripe(env, raw, req.headers.get('Stripe-Signature')))) return json({ error: 'signature' }, 400);
  const ev = JSON.parse(raw);
  const seen = await env.DB.prepare('INSERT OR IGNORE INTO events (id, type, created) VALUES (?, ?, ?) RETURNING id').bind(ev.id, ev.type, now()).first();
  if (!seen) return json({ ok: true, dup: true });
  const o = ev.data?.object || {};
  try {
    if (ev.type.startsWith('checkout.session.')) await saveCheckout(env, o);
    else if (ev.type.startsWith('customer.subscription.')) await saveSub(env, await stripe(env, 'GET', '/v1/subscriptions/' + o.id).catch(() => o));   // свежая версия: события приходят не по порядку
    else if (ev.type === 'charge.refunded' && o.payment_intent && o.refunded) await refunded(env, o);   // только полный возврат; частичный Pro не снимает
  } catch (e) {
    await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(ev.id).run();   // Stripe повторит
    throw e;
  }
  return json({ ok: true });
}

// ───────── Google ─────────
const GOOGLE_AUTH = (env) => env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = (env) => env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
async function googleStart(env, req, url) {
  const ret = okReturn(env, url.searchParams.get('return') || '');
  const plan = PLANS.includes(url.searchParams.get('plan')) ? url.searchParams.get('plan') : null;
  const lang = url.searchParams.get('lang') === 'ru' ? 'ru' : 'en';
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, 'google_off');
  const state = rand(24), verifier = rand(48);
  await env.DB.prepare('DELETE FROM auth_states WHERE created < ?').bind(now() - 15 * 60e3).run();
  await env.DB.prepare('INSERT INTO auth_states (state, verifier, return_url, plan, lang, created) VALUES (?, ?, ?, ?, ?, ?)').bind(state, verifier, ret, plan, lang, now()).run();
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: url.origin + '/auth/google/callback', response_type: 'code', scope: 'openid email profile',
    state, code_challenge: await sha256(verifier), code_challenge_method: 'S256', prompt: 'select_account', hl: lang,
  });
  return redirect(GOOGLE_AUTH(env) + '?' + q);
}
async function googleCallback(env, req, url) {
  const state = url.searchParams.get('state') || '';
  const st = await env.DB.prepare('DELETE FROM auth_states WHERE state = ? RETURNING *').bind(state).first();
  if (!st || st.created < now() - 10 * 60e3) return htmlMsg('Ссылка входа устарела. Вернитесь в приложение и нажмите «Войти через Google» ещё раз.');
  if (url.searchParams.get('error') || !url.searchParams.get('code')) return redirect(withParams(st.return_url, { login: 'cancel' }));
  const r = await fetch(GOOGLE_TOKEN(env), {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET || '', redirect_uri: url.origin + '/auth/google/callback', grant_type: 'authorization_code', code_verifier: st.verifier }),
  });
  const tok = await r.json().catch(() => ({}));
  if (!r.ok || !tok.id_token) { console.log('google token', r.status, tok.error); return redirect(withParams(st.return_url, { login: 'error' })); }
  // id_token получен напрямую от Google по TLS — подпись можно не проверять (OpenID Connect Core 3.1.3.7 п. 6); проверяем поля
  let c; try { c = JSON.parse(b64uDecode(tok.id_token.split('.')[1])); } catch { return redirect(withParams(st.return_url, { login: 'error' })); }
  const issOk = ['accounts.google.com', 'https://accounts.google.com'].includes(c.iss) || (env.GOOGLE_ISS && c.iss === env.GOOGLE_ISS);
  if (!issOk || c.aud !== env.GOOGLE_CLIENT_ID || c.exp * 1000 < now() || !c.sub || !c.email || c.email_verified === false) return redirect(withParams(st.return_url, { login: 'error' }));
  const email = String(c.email).toLowerCase();
  let u = await env.DB.prepare('SELECT * FROM users WHERE google_sub = ?').bind(c.sub).first();
  if (!u) {   // покупал без входа с этой же почтой — тот же аккаунт (почту подтвердил Google)
    const same = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND google_sub IS NULL ORDER BY created LIMIT 1').bind(email).first();
    if (same) { await env.DB.prepare('UPDATE users SET google_sub = ?, name = COALESCE(name, ?), email_ok = 1, last_login = ? WHERE id = ?').bind(c.sub, c.name || '', now(), same.id).run(); u = { ...same, google_sub: c.sub, email_ok: 1 }; }
  }
  if (!u) {
    u = { id: crypto.randomUUID(), google_sub: c.sub, email, name: c.name || '', customer_id: null, email_ok: 1 };
    await env.DB.prepare('INSERT INTO users (id, google_sub, email, name, created, last_login, email_ok) VALUES (?, ?, ?, ?, ?, ?, 1)').bind(u.id, c.sub, email, u.name, now(), now()).run();
  } else {
    await env.DB.prepare('UPDATE users SET email = ?, name = ?, last_login = ?, email_ok = 1 WHERE id = ?').bind(email, c.name || u.name, now(), u.id).run();
    Object.assign(u, { email, name: c.name || u.name, email_ok: 1 });
  }
  await syncCustomer(env, u).catch((e) => console.log('sync', e.code || e.message));
  const ticket = await newTicket(env, 'login', u.id, 10 * 60e3);
  if (st.plan && !(await proOf(env, u)).active) {   // выбрал тариф до входа — сразу на оплату
    try { return redirect(await checkoutUrl(env, req, u, st.plan, st.return_url, ticket, st.lang)); }
    catch (e) { return redirect(withParams(st.return_url, { login: ticket, paid: 'error' })); }
  }
  return redirect(withParams(st.return_url, { login: ticket }));
}
function htmlMsg(text) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Secret Base</title><body style="font:17px/1.5 -apple-system,system-ui,sans-serif;background:#0b0b10;color:#f3f1f6;padding:48px 24px"><p>${text}</p><p><a style="color:#ff5fa2" href="https://sbgta.app/">Открыть Secret Base</a></p>`, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ───────── маршруты ─────────
async function route(env, req) {
  const url = new URL(req.url), p = url.pathname, M = req.method;
  const body = async () => (M === 'POST' ? await req.json().catch(() => ({})) : {});
  if (p === '/health') return json({ ok: true, test: isTest(env) });
  if (p === '/webhook' && M === 'POST') return webhook(env, req);
  if (p === '/auth/google' && M === 'GET') return googleStart(env, req, url);
  if (p === '/auth/google/callback' && M === 'GET') return googleCallback(env, req, url);
  if (p === '/auth/exchange' && M === 'POST') {
    const b = await body(); const uid = await useTicket(env, 'login', String(b.ticket || ''));
    const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first();
    return json({ token: await newSession(env, uid), ...(await meOf(env, req, u)) });
  }
  if (p === '/auth/pair' && M === 'POST') {   // код для входа на другом устройстве: 6 цифр, 10 минут, 5 попыток
    const u = await needUser(env, req);
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, '0');
    await newTicket(env, 'pair', u.id, 10 * 60e3, code);
    return json({ code, expires: now() + 10 * 60e3 });
  }
  if (p === '/auth/pair/redeem' && M === 'POST') {
    // защита от подбора 6 цифр: 10 попыток в минуту с адреса и 100 в минуту на всех (Cloudflare Rate Limiting)
    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    for (const [rl, key] of [[env.RL_IP, 'pair:' + ip], [env.RL_ALL, 'pair:all']]) if (rl && !(await rl.limit({ key })).success) throw new HttpError(429, 'slow_down');
    const since = now() - 10 * 60e3;
    const cnt = async (k) => (await env.DB.prepare('SELECT COUNT(*) n FROM fails WHERE k = ? AND at > ?').bind(k, since).first())?.n || 0;
    if ((await cnt('pair:' + ip)) >= 20 || (await cnt('pair:all')) >= 300) throw new HttpError(429, 'slow_down');
    const b = await body(); const code = String(b.code || '').replace(/\D/g, '');
    let uid;
    try { if (code.length !== 6) throw new HttpError(400, 'ticket'); uid = await useTicket(env, 'pair', code); }
    catch (e) {
      await env.DB.batch([env.DB.prepare('INSERT INTO fails (k, at) VALUES (?, ?)').bind('pair:' + ip, now()), env.DB.prepare('INSERT INTO fails (k, at) VALUES (?, ?)').bind('pair:all', now()),
        env.DB.prepare('DELETE FROM fails WHERE at < ?').bind(now() - 3600e3)]);
      throw e;
    }
    const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first();
    return json({ token: await newSession(env, uid), ...(await meOf(env, req, u)) });
  }
  if (p === '/auth/logout' && M === 'POST') {
    const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || '');
    if (m) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(m[1])).run();
    return json({ ok: true });
  }
  if (p === '/me' && M === 'GET') {
    const u = await needUser(env, req);
    if (url.searchParams.get('sync')) await syncCustomer(env, u).catch((e) => console.log('sync', e.code || e.message));
    return json(await meOf(env, req, u));
  }
  if (p === '/checkout' && M === 'POST') {
    const u = await needUser(env, req), b = await body();
    if ((await proOf(env, u)).sub && b.plan !== 'pass') throw new HttpError(409, 'has_sub');   // вторую подписку не продаём — управление в портале
    return json({ url: await checkoutUrl(env, req, u, String(b.plan || ''), okReturn(env, b.return || ''), null, b.lang) });
  }
  if (p === '/checkout/guest' && M === 'POST') {   // оплата без входа
    const b = await body();
    return json({ url: await checkoutUrl(env, req, null, String(b.plan || ''), okReturn(env, b.return || ''), null, b.lang) });
  }
  if (p === '/claim/guest' && M === 'POST') {   // вернулся из оплаты без входа: аккаунт по почте из Stripe
    const b = await body(), id = String(b.session_id || '');
    if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new HttpError(400, 'bad_session');
    const cs = await stripe(env, 'GET', '/v1/checkout/sessions/' + id, { expand: { 0: 'subscription' } });
    if (cs.created * 1000 < now() - DAY) throw new HttpError(403, 'old_session');
    const email = normEmail(cs.customer_details?.email || cs.customer_email);
    const cust = typeof cs.customer === 'object' ? cs.customer?.id : cs.customer;
    if (!(await saveCheckout(env, cs))) return json({ paid: false });   // ещё не оплачено (банк думает) — приложение спросит ещё раз
    if (!email || !cust) throw new HttpError(502, 'no_email');
    let u = await env.DB.prepare('SELECT * FROM users WHERE customer_id = ?').bind(cust).first() || await byEmail(env, email), fresh = false;
    if (!u) {
      u = { id: crypto.randomUUID(), google_sub: null, email, name: cs.customer_details?.name || '', customer_id: cust, pw: null, email_ok: 0 };
      await env.DB.prepare('INSERT INTO users (id, email, name, customer_id, created, last_login) VALUES (?, ?, ?, ?, ?, ?)').bind(u.id, email, u.name, cust, now(), now()).run();
      fresh = true;
    } else if (!u.customer_id) { await env.DB.prepare('UPDATE users SET customer_id = ? WHERE id = ?').bind(cust, u.id).run(); u.customer_id = cust; }
    await env.DB.prepare('UPDATE ents SET user_id = ? WHERE customer_id = ? AND (user_id IS NULL OR user_id = ?)').bind(u.id, cust, u.id).run();
    // сессию выдаём один раз на оплату и только «чистому» аккаунту: новый, или без пароля/Google и без чужих покупок.
    // Иначе (почта уже с паролем/Google или с прежними покупками) — покупка привязана, человек входит своим способом.
    const first = await env.DB.prepare('INSERT OR IGNORE INTO events (id, type, created) VALUES (?, ?, ?) RETURNING id').bind('claim:' + cs.id, 'claim', now()).first();
    const other = (await env.DB.prepare('SELECT COUNT(*) n FROM ents WHERE user_id = ? AND customer_id IS NOT ?').bind(u.id, cust).first())?.n || 0;
    const me = await meOf(env, req, u);
    if (first && (fresh || (!u.pw && !u.google_sub && !other))) return json({ paid: true, token: await newSession(env, u.id), new_account: !u.pw, ...me });
    return json({ paid: true, need_login: true, email: u.email, has_pw: !!u.pw, google: !!u.google_sub });
  }
  if (p === '/auth/login' && M === 'POST') {   // почта + пароль
    const b = await body(), email = normEmail(b.email), ip = ipOf(req);
    if (await tooMany(env, 'login:' + email, 10, 15) || await tooMany(env, 'loginip:' + ip, 40, 15)) throw new HttpError(429, 'slow_down');
    const u = okEmail(email) ? await env.DB.prepare('SELECT * FROM users WHERE email = ? AND pw IS NOT NULL ORDER BY created LIMIT 1').bind(email).first() : null;
    if (!u || !(await checkPw(String(b.password || ''), u.pw))) { await addFail(env, 'login:' + email, 'loginip:' + ip); throw new HttpError(401, 'bad_login'); }
    await env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(now(), u.id).run();
    return json({ token: await newSession(env, u.id), ...(await meOf(env, req, u)) });
  }
  if (p === '/auth/password' && M === 'POST') {   // придумать (после оплаты) или сменить пароль
    const u = await needUser(env, req), b = await body();
    if (!okPw(b.password)) throw new HttpError(400, 'weak_password');
    if (u.pw && !(await checkPw(String(b.old || ''), u.pw))) {
      if (await tooMany(env, 'pwchg:' + u.id, 10, 15)) throw new HttpError(429, 'slow_down');
      await addFail(env, 'pwchg:' + u.id); throw new HttpError(403, 'bad_old');
    }
    await env.DB.prepare('UPDATE users SET pw = ?, pw_at = ? WHERE id = ?').bind(await hashPw(b.password), now(), u.id).run();
    u.pw = 'set';
    return json({ ok: true, ...(await meOf(env, req, u)) });
  }
  if (p === '/auth/email/code' && M === 'POST') {   // код на почту: «забыли пароль», «восстановить покупку»
    const b = await body(), email = normEmail(b.email), ip = ipOf(req);
    if (!okEmail(email)) throw new HttpError(400, 'bad_email');
    if (await tooMany(env, 'code:' + email, 5, 60) || await tooMany(env, 'codeip:' + ip, 30, 60)) throw new HttpError(429, 'slow_down');
    await addFail(env, 'code:' + email, 'codeip:' + ip);   // считаем каждую отправку
    let u = await byEmail(env, email);
    if (!u) {   // аккаунта нет, но покупка с этой почтой в Stripe есть — заведём аккаунт
      const found = await stripe(env, 'GET', '/v1/customers', { email, limit: 1 }).catch(() => ({ data: [] }));
      if (found.data?.length) {
        u = { id: crypto.randomUUID(), email, customer_id: found.data[0].id };
        await env.DB.prepare('INSERT INTO users (id, email, name, customer_id, created) VALUES (?, ?, ?, ?, ?)').bind(u.id, email, found.data[0].name || '', u.customer_id, now()).run();
      }
    }
    if (!u) return json({ ok: true });   // не говорим, есть ли такая почта
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, '0');
    await newTicket(env, 'email', u.id, 15 * 60e3, email + '|' + code);
    const ru = b.lang === 'ru';
    const how = await sendMail(env, email, ru ? `Код входа в Secret Base: ${code}` : `Your Secret Base sign-in code: ${code}`,
      ru ? `Ваш код входа: ${code}\n\nОн действует 15 минут. Если вы не запрашивали код, просто игнорируйте это письмо.\n\nSecret Base — https://sbgta.app/`
        : `Your sign-in code: ${code}\n\nIt is valid for 15 minutes. If you did not request it, ignore this email.\n\nSecret Base — https://sbgta.app/`);
    return json({ ok: true, ...(how === 'outbox' ? { outbox: true } : {}) });
  }
  if (p === '/auth/email/verify' && M === 'POST') {
    const b = await body(), email = normEmail(b.email), code = String(b.code || '').replace(/\D/g, ''), ip = ipOf(req);
    if (await tooMany(env, 'verify:' + email, 8, 15) || await tooMany(env, 'verifyip:' + ip, 40, 15)) throw new HttpError(429, 'slow_down');
    let uid;
    try { if (code.length !== 6) throw new HttpError(400, 'ticket'); uid = await useTicket(env, 'email', email + '|' + code); }
    catch (e) { await addFail(env, 'verify:' + email, 'verifyip:' + ip); throw e; }
    if (b.password != null && !okPw(b.password)) throw new HttpError(400, 'weak_password');
    await env.DB.prepare('UPDATE users SET email_ok = 1, last_login = ?' + (b.password ? ', pw = ?, pw_at = ?' : '') + ' WHERE id = ?')
      .bind(...(b.password ? [now(), await hashPw(b.password), now(), uid] : [now(), uid])).run();
    const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first();
    await syncCustomer(env, u).catch((e) => console.log('sync', e.code || e.message));
    return json({ token: await newSession(env, uid), ...(await meOf(env, req, u)) });
  }
  if (p === '/admin/outbox' && M === 'GET') {   // тесты: последнее «письмо» на адрес @sbgta.test
    const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || '');
    if (!env.ADMIN_TOKEN || !m || !safeEq(m[1], env.ADMIN_TOKEN)) throw new HttpError(401, 'auth');
    return json(JSON.parse((await cfg(env, 'outbox:' + normEmail(url.searchParams.get('email')))) || '{}'));
  }
  if (p === '/claim' && M === 'POST') {
    const u = await needUser(env, req), b = await body();
    const id = String(b.session_id || '');
    if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new HttpError(400, 'bad_session');
    const cs = await stripe(env, 'GET', '/v1/checkout/sessions/' + id, { expand: { 0: 'subscription' } });
    if (cs.client_reference_id !== u.id && cs.customer !== u.customer_id) throw new HttpError(403, 'not_yours');
    const ok = await saveCheckout(env, cs);
    return json({ paid: ok, ...(await meOf(env, req, u)) });
  }
  if (p === '/portal' && M === 'POST') {
    const u = await needUser(env, req), b = await body();
    if (!u.customer_id) throw new HttpError(404, 'no_customer');
    const configuration = await cfg(env, 'portal_cfg');
    const s = await stripe(env, 'POST', '/v1/billing_portal/sessions', { customer: u.customer_id, return_url: withParams(okReturn(env, b.return || ''), { portal: 'back' }), ...(configuration ? { configuration } : {}), locale: b.lang === 'ru' ? 'ru' : 'auto' });
    return json({ url: s.url });
  }
  if (p === '/admin/promo' && M === 'POST') {   // промокод в Stripe: { code, percent_off=100, duration='forever'|'once'|'repeating', months, max }
    const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || '');
    if (!env.ADMIN_TOKEN || !m || !safeEq(m[1], env.ADMIN_TOKEN)) throw new HttpError(401, 'auth');
    const b = await body(), code = String(b.code || '').toUpperCase();
    if (!/^[A-Z0-9]{4,30}$/.test(code)) throw new HttpError(400, 'bad_code');
    const duration = b.duration || 'forever';
    const cp = await stripe(env, 'POST', '/v1/coupons', { percent_off: String(b.percent_off || 100), duration, ...(duration === 'repeating' ? { duration_in_months: String(b.months || 12) } : {}), name: 'Secret Base ' + code });
    const lim = b.max ? { max_redemptions: String(b.max) } : {};
    let pc;
    try { pc = await stripe(env, 'POST', '/v1/promotion_codes', { promotion: { type: 'coupon', coupon: cp.id }, code, ...lim }); }
    catch { pc = await stripe(env, 'POST', '/v1/promotion_codes', { coupon: cp.id, code, ...lim }); }
    return json({ ok: true, code: pc.code, id: pc.id, coupon: cp.id, test: isTest(env) });
  }
  if (p === '/admin/setup' && M === 'POST') {
    const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || '');
    if (!env.ADMIN_TOKEN || !m || !safeEq(m[1], env.ADMIN_TOKEN)) throw new HttpError(401, 'auth');
    const b = await body(), out = {};
    if (!(await cfg(env, 'whsec')) || b.force) {
      const old = await cfg(env, 'webhook_id');   // пересоздание (смена ключа или версии API) — старый вебхук удалить, чтобы события не шли дважды
      if (old && b.force) await stripe(env, 'DELETE', '/v1/webhook_endpoints/' + old).catch(() => { });
      const wh = await stripe(env, 'POST', '/v1/webhook_endpoints', { url: url.origin + '/webhook', enabled_events: Object.fromEntries(EVENTS.map((e, i) => [i, e])), description: 'Secret Base Pro', ...(env.STRIPE_VERSION ? { api_version: env.STRIPE_VERSION } : {}) });
      await setCfg(env, 'whsec', wh.secret); await setCfg(env, 'webhook_id', wh.id); out.webhook = wh.id;
    }
    const pc = await stripe(env, 'POST', '/v1/billing_portal/configurations', {
      business_profile: { headline: 'Secret Base Pro' },
      default_return_url: (String(env.APP_ORIGINS || 'https://sbgta.app').split(',')[0]).trim() + '/',
      features: {
        invoice_history: { enabled: 'true' }, payment_method_update: { enabled: 'true' },
        customer_update: { enabled: 'true', allowed_updates: { 0: 'email' } },
        subscription_cancel: { enabled: 'true', mode: env.CANCEL_MODE || 'at_period_end', ...(env.CANCEL_MODE === 'immediately' ? { proration_behavior: 'none' } : {}) },
      },
    });
    await setCfg(env, 'portal_cfg', pc.id); out.portal = pc.id;
    return json({ ok: true, ...out, test: isTest(env) });
  }
  throw new HttpError(404, 'not_found');
}

export default {
  async fetch(req, env) {
    const cors = corsHeaders(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let res;
    try { res = await route(env, req); }
    catch (e) { if (!(e instanceof HttpError)) console.log('error', e.stack || e); res = json({ error: e.code || 'server' }, e.status || 500); }
    if (res.status !== 302) for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
};
