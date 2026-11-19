// Secret Base — сервер оплаты и входа (Cloudflare Worker + D1). Без зависимостей: fetch + WebCrypto.
//
// Вход: Google OAuth 2.0 (код + PKCE), только полные переходы страницы — работает в приложении «на экране Домой» iPhone.
//   GET  /auth/google?return=<адрес приложения>&plan=year|month|pass&lang=ru|en → Google → /auth/google/callback
//        → (если выбран тариф) сразу Stripe Checkout → возврат в приложение с ?login=<билет>&paid=<cs_…>
//   POST /auth/exchange {ticket} → {token, user}           одноразовый билет (10 минут) → сессия приложения
//   POST /auth/pair (Bearer) → {code}; POST /auth/pair/redeem {code} → {token}   вход кодом на другом устройстве
//   POST /auth/logout (Bearer)
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
const pubUser = (u) => ({ email: u.email, name: u.name || '' });

async function ensureCustomer(env, u) {
  if (u.customer_id) return u.customer_id;
  const c = await stripe(env, 'POST', '/v1/customers', { email: u.email, name: u.name || undefined, metadata: { user_id: u.id } });
  await env.DB.prepare('UPDATE users SET customer_id = ? WHERE id = ?').bind(c.id, u.id).run();
  u.customer_id = c.id;
  return c.id;
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
  const uid = cs.client_reference_id || cs.metadata?.user_id;
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
  if (!u.customer_id) {   // купил раньше с этим же email — найдём покупателя
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
  const customer = await ensureCustomer(env, u);
  const sub = plan !== 'pass';
  const meta = { user_id: u.id, plan, zone: String(pr.zone) };
  // Managed Payments: Stripe — продавец (merchant of record), сам считает и платит налоги/VAT; нужен tax_code товара
  const mp = String(env.MANAGED_PAYMENTS || '') === '1';
  const cs = await stripe(env, 'POST', '/v1/checkout/sessions', {
    mode: sub ? 'subscription' : 'payment',
    customer,
    client_reference_id: u.id,
    success_url: withParams(ret, { paid: '{CHECKOUT_SESSION_ID}', login: ticket }),
    cancel_url: withParams(ret, { paid: 'cancel', login: ticket }),
    line_items: { 0: { quantity: 1, price_data: { currency: 'usd', tax_behavior: env.TAX_BEHAVIOR || 'inclusive', unit_amount: Math.round(pr[plan] * 100), product_data: { name: NAMES[plan], ...(mp ? { tax_code: env.TAX_CODE || 'txcd_10103000' } : {}) }, ...(sub ? { recurring: { interval: plan } } : {}) } } },
    metadata: meta,
    ...(sub ? { subscription_data: { metadata: meta } } : { payment_intent_data: { metadata: meta } }),
    locale: lang === 'ru' ? 'ru' : 'auto',
    ...(mp ? { managed_payments: { enabled: 'true' } } : {}),
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
    else if (ev.type === 'charge.refunded' && o.payment_intent) await env.DB.prepare("UPDATE ents SET status = 'refunded', until = ?, updated = ? WHERE id = ?").bind(now(), now(), o.payment_intent).run();
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
  if (!u) {
    u = { id: crypto.randomUUID(), google_sub: c.sub, email, name: c.name || '', customer_id: null };
    await env.DB.prepare('INSERT INTO users (id, google_sub, email, name, created, last_login) VALUES (?, ?, ?, ?, ?, ?)').bind(u.id, c.sub, email, u.name, now(), now()).run();
  } else {
    await env.DB.prepare('UPDATE users SET email = ?, name = ?, last_login = ? WHERE id = ?').bind(email, c.name || u.name, now(), u.id).run();
    Object.assign(u, { email, name: c.name || u.name });
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
    const b = await body(); const code = String(b.code || '').replace(/\D/g, '');
    if (code.length !== 6) throw new HttpError(400, 'ticket');
    const uid = await useTicket(env, 'pair', code);
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
  if (p === '/admin/setup' && M === 'POST') {
    const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || '');
    if (!env.ADMIN_TOKEN || !m || !safeEq(m[1], env.ADMIN_TOKEN)) throw new HttpError(401, 'auth');
    const b = await body(), out = {};
    if (!(await cfg(env, 'whsec')) || b.force) {
      const wh = await stripe(env, 'POST', '/v1/webhook_endpoints', { url: url.origin + '/webhook', enabled_events: Object.fromEntries(EVENTS.map((e, i) => [i, e])), description: 'Secret Base Pro' });
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
