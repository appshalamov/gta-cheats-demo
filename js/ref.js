// Рефералка: ссылки креаторов и их статистика. Сервер — server/ref-worker (https://ref.sbgta.app, REF.api в config.js).
//
// Ссылка креатора: sbgta.app/?r=КОД (общая) и sbgta.app/s/<игра>/<место>.html?r=КОД&v=<ролик> (место, превью «игра | жизнь»).
// Короткая sbgta.app/КОД и старые адреса (github.io, домен/КОД/игра/место) приводит сюда 404.html.
// Закрепление — на сервере, по первому касанию и навсегда: устройство (sb.did, случайный номер) → код креатора.
// iPhone «на экране Домой» — своё хранилище и свой номер: сервер узнаёт тот же телефон по сети и версии iOS (до 72 ч после
// ссылки), а при входе Google — по аккаунту. Сама страница ?r= в адресе остаётся, чтобы «На экран Домой» унёс код в запуск.
import { REF } from './config.js';

const DEV = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { } } };
// стенд и тесты: свой сервер через localStorage sb.refapi ('off' — выключить); только на localhost
export const apiBase = () => { const o = DEV ? ls.get('sb.refapi') : null; return o === 'off' ? '' : (o || REF.api || '').replace(/\/$/, ''); };
const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => x.toString(16).padStart(2, '0')).join('');
export function did() { let d = ls.get('sb.did'); if (!/^[a-z0-9]{16,40}$/.test(d || '')) { d = hex(16); ls.set('sb.did', d); } return d; }
const key = () => { let k = ls.get('sb.ref.key'); if (!/^[a-z0-9]{24,64}$/.test(k || '')) { k = hex(16); ls.set('sb.ref.key', k); } return k; };
export const standalone = () => { try { return !!navigator.standalone || matchMedia('(display-mode: standalone)').matches; } catch { return false; } };
export const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);

async function call(path, { body, auth } = {}) {
  const base = apiBase(); if (!base) throw Object.assign(new Error('off'), { code: 'off' });
  const h = { 'Content-Type': 'application/json' }; if (auth) h.Authorization = 'Bearer ' + auth;
  const r = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'http_' + r.status), { code: d.error || 'http_' + r.status, status: r.status });
  return d;
}

// код из адреса (?r=, старое ?ref=) → первое касание на устройстве (sb.ref.first, не перезаписывается)
export function fromUrl() {
  let q; try { q = new URLSearchParams(location.search); } catch { return null; }
  const r = normCode(q.get('r') || q.get('ref')), v = String(q.get('v') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
  if (r.length < 3) return null;
  if (!ls.get('sb.ref.first')) ls.set('sb.ref.first', JSON.stringify({ r, v, at: Date.now() }));
  return { r, v };
}
const first = () => { try { return JSON.parse(ls.get('sb.ref.first') || 'null'); } catch { return null; } };

// запуск приложения: отметиться на сервере (ссылка, «на экране Домой»), дальше — знакомство и вход в оплату
export async function boot({ onboarded, payToken } = {}) {
  if (!apiBase()) return null;
  const u = fromUrl(), f = u || first();
  let res = null;
  try {
    res = await call('/hit', { body: { d: did(), r: f?.r || '', v: f?.v || '', sa: standalone() ? 1 : 0 } });
    if (res.code) ls.set('sb.ref.code', res.code);
  } catch { }
  watchOnboard(onboarded);
  if (payToken) syncPay(payToken());
  return res;
}
// знакомство пройдено (store.onboarded): отметка один раз на устройство
function watchOnboard(get) {
  if (!get || ls.get('sb.ref.onb')) return;
  const tick = () => { if (!get()) return false; call('/event', { body: { d: did(), e: 'onboard' } }).then(() => ls.set('sb.ref.onb', '1')).catch(() => { }); return true; };
  if (tick()) return;
  const t = setInterval(() => { if (tick()) clearInterval(t); }, 3000);
}
// вход Google / оплата: сервер сам проверяет Pro у сервера оплаты; раз в сутки или сразу после входа/оплаты
export async function syncPay(token, force = false) {
  if (!token || !apiBase()) return null;
  const last = +(ls.get('sb.ref.pay') || 0);
  if (!force && Date.now() - last < 864e5) return null;
  try { const d = await call('/pay', { body: { d: did(), t: token } }); ls.set('sb.ref.pay', String(Date.now())); return d; } catch { return null; }
}

// креатор: регистрация своего кода на сервере (ключ — секрет этого устройства). Код может вернуться другим, если занят.
export async function register({ code, nick, email }) {
  if (!apiBase() || !code) return null;
  const d = await call('/creator', { body: { d: did(), k: key(), code, nick: nick || '', email: email || '' } });
  ls.set('sb.ref.cr', d.code);
  return d;
}
export const registered = () => ls.get('sb.ref.cr');
// статистика креатора: { clicks, people, installs, onboarded, pays, week{clicks,people} }; без сети — последний ответ
export async function stats() {
  if (!apiBase() || !registered()) return null;
  try { const d = await call('/stats', { auth: key() }); ls.set('sb.ref.stats', JSON.stringify(d)); return d; }
  catch { try { return JSON.parse(ls.get('sb.ref.stats') || 'null'); } catch { return null; } }
}
