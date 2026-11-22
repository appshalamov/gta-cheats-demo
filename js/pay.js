// Оплата Stripe и вход через Google. Сервер — server/pay-worker (Cloudflare Worker + D1); адрес — PAY.api в config.js.
// PAY.api = null — оплаты нет, работает демо-покупка на устройстве (как раньше).
//
// Pro здесь — только ответ сервера: тот проверяет платёж в Stripe (вебхук или прямой запрос по cs_…). Адрес «?paid=…» сам
// ничего не включает: это лишь номер платёжной сессии, которую сервер сверяет со Stripe и с аккаунтом.
// Последний ответ хранится на устройстве (sb.pay.v1), чтобы Pro работал без сети до конца оплаченного срока.
// Все переходы — в том же окне (location.href): так приложение «на экране Домой» iPhone возвращается к себе, а не в Safari.
import { PAY } from './config.js';
import { getLang } from './i18n.js';

const KEY = 'sb.pay.v1';
const DEV = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { } } };
// стенд и тесты: свой сервер через localStorage sb.payapi — только на localhost
// sb.payapi = 'off' — выключить оплату на стенде (старые тесты с демо-Pro)
export const apiBase = () => { const o = DEV ? ls.get('sb.payapi') : null; return o === 'off' ? '' : (o || PAY.api || '').replace(/\/$/, ''); };
// Пока Stripe в тестовом режиме (PAY.test), оплата включена только у тех, кто сам её включил: ?paytest=1 в адресе или
// 5 нажатий на заголовок «О приложении» (для приложения «на экране Домой» — у него своё хранилище). Остальные видят демо, как раньше.
const PT = 'sb.paytest';
try { const v = new URLSearchParams(location.search).get('paytest'); if (v === '1') ls.set(PT, '1'); if (v === '0') ls.set(PT, null); } catch { }
export const paytest = () => ls.get(PT) === '1';
export function togglePaytest() { ls.set(PT, paytest() ? null : '1'); return paytest(); }
export const enabled = () => !!apiBase() && (!PAY.test || (DEV ? !!ls.get('sb.payapi') : paytest()));

let st = {};
try { st = JSON.parse(ls.get(KEY) || '{}') || {}; } catch { st = {}; }
const persist = () => ls.set(KEY, JSON.stringify(st));
export const state = () => st;
export const signedIn = () => !!st.token;
export const user = () => st.user || null;
export const pro = () => st.pro || null;
export const isTest = () => (st.test != null ? !!st.test : !!PAY.test);
export function proActive() { return enabled() && !!st.token && !!st.pro?.active && st.pro.until > Date.now(); }

const appUrl = () => location.origin + location.pathname;
const lang = () => getLang();

function applyMe(d) {
  if (!d || !d.user) return;
  Object.assign(st, { user: d.user, pro: d.pro, prices: d.prices || null, nopay: !!d.nopay, country: d.country || '', test: !!d.test, checked: Date.now() });
  if (d.token) st.token = d.token;
  persist();
}
function dropSession() { st = {}; persist(); }

async function call(path, { body, auth = true } = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (auth && st.token) h.Authorization = 'Bearer ' + st.token;
  const r = await fetch(apiBase() + path, { method: body ? 'POST' : 'GET', headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && auth) dropSession();
  if (!r.ok) { const e = new Error(d.error || 'http_' + r.status); e.code = d.error || 'http_' + r.status; e.status = r.status; throw e; }
  return d;
}

// возврат в приложение: ?login=<билет> (после Google), ?paid=cs_…|cancel|error (после Stripe), ?portal=back (после портала).
// Адрес чистится сразу — повторное открытие или «Поделиться» не унесут билет.
// → { login: 'ok'|'cancel'|'error'|null, paid: 'ok'|'pending'|'cancel'|'error'|'login'|null, portal: bool, fresh: bool, email }
//   paid 'login' — оплатил без входа, но у почты уже есть пароль/Google или прежние покупки: покупка привязана, нужно войти
export async function handleReturn() {
  const q = new URLSearchParams(location.search);
  const login = q.get('login'), paid = q.get('paid'), portal = q.get('portal');
  const out = { login: null, paid: null, portal: false, fresh: false, email: '' };
  if (q.has('paytest')) { q.delete('paytest'); if (!login && !paid && !portal) history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); }
  if (!login && !paid && !portal) return out;
  ['login', 'paid', 'portal'].forEach((k) => q.delete(k));
  history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
  if (!enabled()) return out;
  if (login) {
    if (login === 'cancel' || login === 'error') out.login = login;
    else {
      try { const d = await call('/auth/exchange', { body: { ticket: login }, auth: false }); applyMe(d); out.login = 'ok'; }
      catch { out.login = st.token ? null : 'error'; }   // билет одноразовый: при перезагрузке страницы уже вошли
    }
  }
  if (paid) {
    if (paid === 'cancel' || paid === 'error') out.paid = paid;
    else if (/^cs_[A-Za-z0-9_]+$/.test(paid)) Object.assign(out, await claimPaid(paid));
    else out.paid = 'error';
  }
  if (portal) { out.portal = true; await refresh(true).catch(() => { }); }
  return out;
}

// оплата прошла (возврат по адресу или onComplete встроенной оплаты): сервер сверяет сессию со Stripe и даёт Pro.
// Без входа — аккаунт по почте из Stripe (сессия «чистому» аккаунту, иначе нужно войти). → { paid, fresh, email }
async function claimPaid(id) {
  const out = { paid: 'pending', fresh: false, email: '' };
  for (let i = 0; i < 6; i++) {   // оплата могла ещё не подтвердиться (3-D Secure, банк) — несколько попыток
    try {
      if (!st.token) {
        const d = await call('/claim/guest', { body: { session_id: id }, auth: false });
        if (d.token) { applyMe(d); out.paid = 'ok'; out.fresh = !!d.new_account; out.email = d.user?.email || ''; break; }
        if (d.need_login) { out.paid = 'login'; out.email = d.email || ''; st.hint = { email: d.email, has_pw: d.has_pw, google: d.google }; persist(); break; }
      } else {
        const d = await call('/claim', { body: { session_id: id } }); applyMe(d);
        if (d.paid && d.pro?.active) { out.paid = 'ok'; break; }
      }
    } catch (e) { if (e.status === 400 || e.status === 401 || e.status === 403 || e.status === 404) { out.paid = 'error'; break; } }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return out;
}

// свежий статус с сервера (при запуске и при возвращении в приложение); без сети — остаётся последний
export async function refresh(sync = false) {
  if (!enabled() || !st.token) return null;
  const d = await call('/me' + (sync ? '?sync=1' : ''));
  applyMe(d); return d;
}

// вход через Google; plan — сразу после входа открыть оплату этого срока
export function signIn(plan = null) {
  const q = new URLSearchParams({ return: appUrl(), lang: lang() });
  if (plan) q.set('plan', plan);
  location.href = apiBase() + '/auth/google?' + q;   // check_links: оплата (вход Google через наш сервер)
}
// «Оформить» с переходом на страницу Stripe (запасной путь, если встроенная оплата не загрузилась).
// Без входа — почту человек вводит в Stripe, пароль придумает после оплаты; со входом — Stripe с его аккаунтом. promo — код триала.
export async function checkout(plan, promo = null) {
  const body = { plan, return: appUrl(), lang: lang(), device: deviceId(), ...(promo ? { promo } : {}) };
  if (!st.token) {
    const d = await call('/checkout/guest', { body, auth: false });
    location.href = d.url; return 'redirect';   // check_links: оплата (Stripe Checkout без входа)
  }
  try {
    const d = await call('/checkout', { body });
    location.href = d.url; return 'redirect';   // check_links: оплата (Stripe Checkout)
  } catch (e) {
    if (e.status === 401) return checkout(plan, promo);   // сессия истекла — оплата без входа
    if (e.code === 'has_sub') { await portal(); return 'portal'; }
    throw e;
  }
}

// ───────── оплата внутри приложения (22.11.2026): Stripe Embedded Checkout в шторке пейвола, без ухода на checkout.stripe.com ─────────
// Скрипт Stripe.js грузится только при открытии оплаты. На стенде (localhost) — подставной: localStorage sb.stripejs = <адрес>/stripe.js
let sjs = null, emb = null;
function loadStripe() {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  return sjs || (sjs = new Promise((ok, no) => {
    const fake = DEV ? ls.get('sb.stripejs') : null;
    if (fake) window.SB_FAKE_STRIPE_BASE = fake.replace(/\/stripe\.js$/, '');
    const s = document.createElement('script');
    s.src = fake || 'https://js.stripe.com/v3/';   // check_links: оплата (Stripe.js — форма оплаты внутри приложения)
    s.onload = () => (window.Stripe ? ok(window.Stripe) : no(new Error('stripe_js')));
    s.onerror = () => { sjs = null; s.remove(); no(new Error('stripe_js')); };
    document.head.appendChild(s);
  }));
}
export function closeInApp() { try { emb?.destroy(); } catch { } emb = null; }
// → { id } после монтирования; onDone({ paid, fresh, email }) — когда оплата прошла. Ошибка 'has_sub' — уже есть подписка (портал).
export async function checkoutInApp(plan, { promo = null, mount, onDone } = {}) {
  closeInApp();
  const body = { plan, return: appUrl(), lang: lang(), device: deviceId(), embedded: true, ...(promo ? { promo } : {}) };
  let d;
  if (st.token) {
    try { d = await call('/checkout', { body }); }
    catch (e) { if (e.status !== 401) throw e; }   // сессия истекла — без входа
  }
  if (!d) d = await call('/checkout/guest', { body, auth: false });
  if (!d.client_secret) { const e = new Error('no_embedded'); e.code = 'no_embedded'; throw e; }
  const Stripe = await loadStripe();
  const stripe = Stripe(d.pk || 'pk_test_fake');
  emb = await stripe.initEmbeddedCheckout({ fetchClientSecret: async () => d.client_secret, onComplete: async () => { const R = await claimPaid(d.id); closeInApp(); onDone?.(R); } });
  emb.mount(mount);
  return { id: d.id };
}

// что умеет сервер оплаты (GET /health): { promo, embedded }. Старый сервер этих полей не знает — тогда без промокодов и
// с переходом на страницу Stripe, как раньше (клиент можно выкладывать раньше сервера)
let feat = null, featP = null;
export const features = () => feat || {};
export function loadFeatures() {
  if (feat || !enabled()) return Promise.resolve(feat || {});
  return featP || (featP = fetch(apiBase() + '/health', { cache: 'no-store' }).then((r) => r.json())
    .then((d) => (feat = { promo: d.promo === true, embedded: d.embedded === true }))
    .catch(() => ({})).finally(() => { featP = null; }));
}

// ───────── свои промокоды: бесплатный доступ без карты и платный триал (сервер: /promo/check, /promo/redeem) ─────────
export function deviceId() {   // случайный номер устройства: «один раз на устройство» для промокодов
  let d = ls.get('sb.dev');
  if (!d) { d = [...crypto.getRandomValues(new Uint8Array(12))].map((x) => x.toString(16).padStart(2, '0')).join(''); ls.set('sb.dev', d); }
  return d;
}
export const promoCheck = (code) => call('/promo/check', { body: { code, device: deviceId() }, auth: !!st.token });
// бесплатный код → { ok, promo, token?, new_account?, need_login?, email? }; Pro — сразу (со входом или новым аккаунтом по почте)
export async function promoRedeem(code, email) {
  const d = await call('/promo/redeem', { body: { code, device: deviceId(), ...(email ? { email } : {}) }, auth: !!st.token });
  if (d.user) applyMe(d);
  if (d.need_login) { st.hint = { email: d.email, has_pw: d.has_pw, google: d.google }; persist(); }
  return d;
}
// Stripe Customer Portal: отмена подписки, карта, чеки
export async function portal() {
  const d = await call('/portal', { body: { return: appUrl(), lang: lang() } });
  location.href = d.url;   // check_links: оплата (портал Stripe)
}
export async function signOut() {
  const tok = st.token; dropSession();
  if (tok) fetch(apiBase() + '/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + tok } }).catch(() => { });
}
// вход на другом устройстве без Google: код из 6 цифр на 10 минут (выдаёт устройство, где уже вошли)
export async function pairCode() { return (await call('/auth/pair', { body: {} })).code; }
export async function redeem(code) {
  const d = await call('/auth/pair/redeem', { body: { code }, auth: false });
  applyMe(d); return d;
}

// ───────── вход по почте ─────────
export const hint = () => st.hint || null;   // почта, к которой привязана последняя покупка без входа
export async function login(email, password) { const d = await call('/auth/login', { body: { email, password }, auth: false }); delete st.hint; applyMe(d); return d; }
export async function setPassword(password, old) { const d = await call('/auth/password', { body: { password, ...(old ? { old } : {}) } }); applyMe(d); return d; }
export async function emailCode(email) { return call('/auth/email/code', { body: { email, lang: lang() }, auth: false }); }
export async function emailVerify(email, code, password) {
  const d = await call('/auth/email/verify', { body: { email, code, ...(password ? { password } : {}) }, auth: false });
  delete st.hint; applyMe(d); return d;
}
