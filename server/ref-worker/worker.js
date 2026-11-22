// Secret Base — рефералка (креаторские ссылки): Cloudflare Worker + D1, адрес https://ref.sbgta.app. Сервер оплаты не трогает:
// оплату проверяет вызовом /me сервера оплаты (service binding PAY → sb-pay) с токеном входа самого человека.
//
// Как человек закрепляется за креатором (первое касание, навсегда):
//  1. Ссылка sbgta.app/?r=КОД (или s/<игра>/<место>.html?r=КОД, или sbgta.app/КОД через 404.html) → приложение шлёт POST /hit
//     со своим номером устройства d (случайный, localStorage sb.did) → строка devices.code = КОД, если устройство ещё ни за кем.
//  2. iPhone «на экране Домой» — отдельное хранилище и новый d. Его первый /hit (sa=1) ищет открытие ссылки в Safari с той же
//     сети (хэш IP) и той же моделью/версией iOS за 72 часа → то же закрепление (via=match), а Safari-строке ставится «установил».
//  3. Вход Google (сервер оплаты): аккаунт → креатор (accounts); другое устройство того же аккаунта получает того же креатора.
// Защита от накруток: одно устройство считается один раз; с одного IP в сутки на код — не больше CAP_IP_UA с той же моделью
// телефона и CAP_IP всего (сверх — counted=0);
// своё устройство и своя почта креатора не засчитываются; лимит запросов с IP (RL_IP).
// Сырые IP и почты не храним — только хэши с солью IP_SALT (секрет Worker).

const DAY = 864e5;
const CAP_IP_UA = 3;         // новых людей с одного IP и одной модели/версии системы на один код за сутки (тот же телефон с чисткой данных)
const CAP_IP = 20;           // всего с одного IP на код за сутки (общий IP оператора — много разных людей, поэтому больше)
const MATCH_MS = 3 * DAY;    // окно «открыл ссылку в Safari → открыл приложение на экране Домой»
const now = () => Date.now();

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, 'Cache-Control': 'no-store' } });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400' };
const bad = (error, status = 400) => json({ error }, status);

export const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
const okCode = (c) => /^[A-Z0-9]{3,20}$/.test(c);
const okDev = (d) => typeof d === 'string' && /^[a-z0-9]{16,40}$/.test(d);
const okKey = (k) => typeof k === 'string' && /^[a-z0-9]{24,64}$/.test(k);

async function sha(env, s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((env.IP_SALT || 'sb-ref-dev') + ':' + s));
  return [...new Uint8Array(b)].slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join('');
}
// «модель» для сопоставления Safari ⇄ «на экране Домой»: платформа и версия системы (одинаковы в обоих хранилищах)
export function uaClass(ua) {
  ua = String(ua || ''); let m;
  if ((m = ua.match(/(iPhone|iPad|iPod).*? OS (\d+)_(\d+)/))) return `ios:${m[1]}:${m[2]}.${m[3]}`;
  if ((m = ua.match(/Android (\d+)/))) return `and:${m[1]}`;
  if (/Macintosh/.test(ua)) return 'mac';
  if (/Windows/.test(ua)) return 'win';
  return 'other';
}
// IP человека. С 22.11.2026 sbgta.app на Cloudflare другого аккаунта: ref.sbgta.app обслуживает пересыльщик sb-edge
// (cheats-pwa-stripe/server/edge-worker), и CF-Connecting-IP — его адрес. Настоящий — в X-SB-IP, верим только при
// X-SB-Proxy == PROXY_SECRET (тот же секрет, что у sb-pay). Прямые запросы на workers.dev — как раньше.
function clientIp(env, req) {
  const h = req.headers;
  if (env.PROXY_SECRET && h.get('X-SB-Proxy') === env.PROXY_SECRET && h.get('X-SB-IP')) return h.get('X-SB-IP');
  return h.get('CF-Connecting-IP') || '0';
}
async function body(req) { try { return JSON.parse(await req.text() || '{}') || {}; } catch { return {}; } }
const one = (env, sql, ...a) => env.DB.prepare(sql).bind(...a).first();
const run = (env, sql, ...a) => env.DB.prepare(sql).bind(...a).run();
const all = async (env, sql, ...a) => (await env.DB.prepare(sql).bind(...a).all()).results || [];

async function isSelf(env, device, code) {
  return !!(await one(env, 'SELECT 1 AS x FROM creator_keys WHERE device = ? AND code = ?', device, code));
}
// закрепить устройство за кодом (первое касание): counted = 1, если не своё и не сверх лимита с этого IP
async function attribute(env, dev, code, via, v, extra = {}) {
  if (await isSelf(env, dev.id, code)) return false;
  const c = await one(env, 'SELECT COUNT(*) AS n, SUM(ua_c = ?) AS m FROM devices WHERE ip_h = ? AND code = ? AND counted = 1 AND attr_at > ?', dev.ua_c, dev.ip_h, code, now() - DAY);
  const counted = (c.n || 0) < CAP_IP && (c.m || 0) < CAP_IP_UA ? 1 : 0;
  const t = now();
  const r = await run(env, 'UPDATE devices SET code = ?, via = ?, counted = ?, attr_at = ?, v = ?, parent = ?, installed_at = COALESCE(installed_at, ?) WHERE id = ? AND code IS NULL',
    code, via, extra.parent ? 0 : counted, t, v || null, extra.parent || null, extra.installed ? t : null, dev.id);
  if (!r.meta?.changes) return false;
  Object.assign(dev, { code, via, counted: extra.parent ? 0 : counted, attr_at: t, parent: extra.parent || null });
  return true;
}

async function hit(env, req, b) {
  const d = b.d; if (!okDev(d)) return bad('bad_device');
  const sa = b.sa ? 1 : 0, t = now();
  const ip_h = await sha(env, 'ip:' + (clientIp(env, req))), ua_c = uaClass(req.headers.get('User-Agent'));
  let dev = await one(env, 'SELECT * FROM devices WHERE id = ?', d);
  if (!dev) {
    await run(env, 'INSERT OR IGNORE INTO devices (id, ip_h, ua_c, standalone, first_at, seen_at) VALUES (?, ?, ?, ?, ?, ?)', d, ip_h, ua_c, sa, t, t);
    dev = await one(env, 'SELECT * FROM devices WHERE id = ?', d);
  } else await run(env, 'UPDATE devices SET seen_at = ?, standalone = MAX(standalone, ?) WHERE id = ?', t, sa, d);
  const code = normCode(b.r), v = String(b.v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) || null;
  // закрепляем и считаем переход только по коду, который сервер знает (зарегистрированный креатор): опечатка или выдуманный код
  // не должен занять «первое касание» (тестировщики 22.11)
  const valid = okCode(code) && !!(await one(env, 'SELECT 1 AS x FROM creators WHERE code = ?', code));
  if (!dev.code && sa && t - dev.first_at < 3600e3) {
    // приложение «на экране Домой»: тот же человек недавно открыл ссылку в Safari?
    const p = await one(env, `SELECT c.code, c.device FROM clicks c WHERE c.ip_h = ? AND c.ua_c = ? AND c.at > ? AND c.standalone = 0 ${valid ? 'AND c.code = ?' : ''} ORDER BY c.at DESC LIMIT 1`,
      ...[ip_h, ua_c, t - MATCH_MS, ...(valid ? [code] : [])]);
    if (p) {
      const par = await one(env, 'SELECT * FROM devices WHERE id = ?', p.device);
      const pc = par?.code || p.code;
      if (await attribute(env, dev, pc, 'match', v, { parent: p.device, installed: true }))
        await run(env, 'UPDATE devices SET installed_at = COALESCE(installed_at, ?) WHERE id = ?', t, p.device);
    }
  }
  if (!dev.code && valid) await attribute(env, dev, code, 'link', v, { installed: !!sa });
  if (valid && !dev.parent && !(await isSelf(env, d, code)))
    await run(env, 'INSERT OR IGNORE INTO clicks (code, device, at, ip_h, ua_c, v, standalone) VALUES (?, ?, ?, ?, ?, ?, ?)', code, d, t, ip_h, ua_c, v, sa);
  if (sa) {
    await run(env, 'UPDATE devices SET installed_at = COALESCE(installed_at, ?) WHERE id = ?', t, d);
    if (dev.parent) await run(env, 'UPDATE devices SET installed_at = COALESCE(installed_at, ?) WHERE id = ?', t, dev.parent);
  }
  return json({ code: dev.code || null, via: dev.via || null });
}

async function event(env, b) {
  const d = b.d; if (!okDev(d)) return bad('bad_device');
  if (b.e !== 'onboard') return bad('bad_event');
  const dev = await one(env, 'SELECT id, parent FROM devices WHERE id = ?', d);
  if (!dev) return json({ ok: false });
  const t = now();
  await run(env, 'UPDATE devices SET onboarded_at = COALESCE(onboarded_at, ?) WHERE id = ?', t, d);
  if (dev.parent) await run(env, 'UPDATE devices SET onboarded_at = COALESCE(onboarded_at, ?) WHERE id = ?', t, dev.parent);
  return json({ ok: true });
}

// креатор: регистрация кода с устройства (ключ k — секрет устройства, хранится у него в localStorage sb.ref.key)
async function creator(env, req, b) {
  const d = b.d, k = b.k; if (!okDev(d)) return bad('bad_device'); if (!okKey(k)) return bad('bad_key');
  const key_h = await sha(env, 'k:' + k), t = now();
  const nick = String(b.nick || '').replace(/[^\w.]/g, '').slice(0, 30) || null;
  const have = await one(env, 'SELECT code FROM creator_keys WHERE key_h = ?', key_h);
  let code;
  if (have) {
    code = have.code;
    if (nick) await run(env, 'UPDATE creators SET nick = ? WHERE code = ? AND (nick IS NULL OR nick = \'\')', nick, code);
  } else {
    const want = okCode(normCode(b.code)) ? normCode(b.code) : (normCode(nick).slice(0, 8) || 'SB');
    const email = String(b.email || '').trim().toLowerCase();
    const email_h = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? await sha(env, 'e:' + email) : null;
    const ip_h = await sha(env, 'ip:' + (clientIp(env, req)));
    const c = await one(env, 'SELECT * FROM creators WHERE code = ?', want);
    if (!c) { const r = await run(env, 'INSERT OR IGNORE INTO creators (code, nick, email_h, ip_h, created_at) VALUES (?, ?, ?, ?, ?)', want, nick, email_h, ip_h, t); if (r.meta?.changes) code = want; }
    else if (email_h && c.email_h === email_h) code = want;   // тот же человек со второго хранилища (Safari ⇄ «на экране Домой»)
    if (!code) {   // код занят другим человеком: ближайший свободный КОД2…КОД99
      const base = want.slice(0, 18);
      for (let i = 2; i < 100 && !code; i++) {
        const r = await run(env, 'INSERT OR IGNORE INTO creators (code, nick, email_h, ip_h, created_at) VALUES (?, ?, ?, ?, ?)', base + i, nick, email_h, ip_h, t);
        if (r.meta?.changes) code = base + i;
      }
      if (!code) return bad('code_busy', 409);
    }
    await run(env, 'INSERT OR IGNORE INTO creator_keys (key_h, code, device, created_at) VALUES (?, ?, ?, ?)', key_h, code, d, t);
  }
  // своё устройство, если оно было закреплено за этим же кодом, не засчитывается
  await run(env, 'UPDATE devices SET counted = 0 WHERE id = ? AND code = ?', d, code);
  await run(env, 'DELETE FROM clicks WHERE device = ? AND code = ?', d, code);
  const cr = await one(env, 'SELECT code, nick FROM creators WHERE code = ?', code);
  return json({ code: cr.code, nick: cr.nick || null });
}

async function statsOf(env, code) {
  const t = now(), wk = t - 7 * DAY;
  const n = async (sql, ...a) => (await one(env, sql, ...a)).n;
  return {
    code,
    clicks: await n('SELECT COUNT(*) AS n FROM clicks WHERE code = ?', code),
    people: await n('SELECT COUNT(*) AS n FROM devices WHERE code = ? AND counted = 1', code),
    installs: await n('SELECT COUNT(*) AS n FROM devices WHERE code = ? AND counted = 1 AND installed_at IS NOT NULL', code),
    onboarded: await n('SELECT COUNT(*) AS n FROM devices WHERE code = ? AND counted = 1 AND onboarded_at IS NOT NULL', code),
    pays: await n('SELECT COUNT(*) AS n FROM pays WHERE code = ? AND counted = 1', code),
    week: {
      clicks: await n('SELECT COUNT(*) AS n FROM clicks WHERE code = ? AND at > ?', code, wk),
      people: await n('SELECT COUNT(*) AS n FROM devices WHERE code = ? AND counted = 1 AND attr_at > ?', code, wk),
    },
    at: t,
  };
}
async function stats(env, req) {
  const k = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!okKey(k)) return bad('no_key', 401);
  const row = await one(env, 'SELECT code FROM creator_keys WHERE key_h = ?', await sha(env, 'k:' + k));
  if (!row) return bad('unknown_key', 401);
  const cr = await one(env, 'SELECT nick FROM creators WHERE code = ?', row.code);
  return json({ ...(await statsOf(env, row.code)), nick: cr?.nick || null });
}

// оплата: токен входа сервера оплаты → его /me (почта и Pro) → аккаунт закрепляется за креатором устройства, оплата засчитывается раз
async function payMe(env, tok) {
  const init = { headers: { Authorization: 'Bearer ' + tok } };
  // PAY_URL — стенд (wrangler dev: свой сервер оплаты); в проде — service binding PAY (Worker к Worker на одной зоне напрямую нельзя)
  const r = env.PAY_URL || !env.PAY ? await fetch((env.PAY_URL || 'https://pay.sbgta.app') + '/me', init) : await env.PAY.fetch('https://pay.sbgta.app/me', init);
  if (!r.ok) return null;
  return r.json().catch(() => null);
}
async function pay(env, b) {
  const d = b.d; if (!okDev(d)) return bad('bad_device');
  if (typeof b.t !== 'string' || b.t.length < 10 || b.t.length > 200) return bad('bad_token');
  const me = await payMe(env, b.t);
  const email = String(me?.user?.email || '').trim().toLowerCase();
  if (!email) return bad('not_signed_in', 401);
  const pay_h = await sha(env, 'e:' + email), t = now();
  const dev = await one(env, 'SELECT * FROM devices WHERE id = ?', d);
  let acc = await one(env, 'SELECT code FROM accounts WHERE pay_h = ?', pay_h);
  if (!acc && dev?.code) { await run(env, 'INSERT OR IGNORE INTO accounts (pay_h, code, at) VALUES (?, ?, ?)', pay_h, dev.code, t); acc = { code: dev.code }; }
  if (acc && dev && !dev.code && !(await isSelf(env, d, acc.code)))   // то же лицо на другом устройстве: закрепить, но второй раз не считать
    await run(env, 'UPDATE devices SET code = ?, via = \'account\', counted = 0, attr_at = ? WHERE id = ? AND code IS NULL', acc.code, t, d);
  if (dev) await run(env, 'UPDATE devices SET pay_h = ? WHERE id = ?', pay_h, d);
  let paid = false;
  if (acc && me.pro?.active) {
    const own = await one(env, 'SELECT 1 AS x FROM creators WHERE code = ? AND email_h = ?', acc.code, pay_h);
    const self = own || (await isSelf(env, d, acc.code));
    const r = await run(env, 'INSERT OR IGNORE INTO pays (pay_h, code, device, plan, counted, at) VALUES (?, ?, ?, ?, ?, ?)', pay_h, acc.code, d, String(me.pro.plan || ''), self ? 0 : 1, t);
    paid = !!r.meta?.changes;
  }
  return json({ code: acc?.code || null, paid });
}

async function admin(env, req, p) {
  const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_TOKEN || tok !== env.ADMIN_TOKEN) return bad('forbidden', 403);
  if (p === '/admin/creators') {
    const cs = await all(env, 'SELECT code, nick, created_at FROM creators ORDER BY created_at DESC LIMIT 500');
    const out = [];
    for (const c of cs) out.push({ ...c, ...(await statsOf(env, c.code)) });
    const totals = await one(env, 'SELECT (SELECT COUNT(*) FROM devices) AS devices, (SELECT COUNT(*) FROM devices WHERE counted = 1) AS people, (SELECT COUNT(*) FROM clicks) AS clicks, (SELECT COUNT(*) FROM pays WHERE counted = 1) AS pays');
    return json({ creators: out, totals });
  }
  if (p === '/admin/purge' && req.method === 'POST') {   // убрать тестовый код и его следы (проверки на проде; коды QA…)
    const code = normCode((await body(req)).code);
    if (!/^QA[A-Z0-9]{2,18}$/.test(code)) return bad('only_qa_codes');
    for (const sql of ['DELETE FROM clicks WHERE code = ?', 'DELETE FROM pays WHERE code = ?', 'DELETE FROM accounts WHERE code = ?', 'DELETE FROM devices WHERE code = ?', 'DELETE FROM creator_keys WHERE code = ?', 'DELETE FROM creators WHERE code = ?'])
      await run(env, sql, code);
    return json({ ok: true, code });
  }
  return bad('not_found', 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname.replace(/\/+$/, '') || '/';
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (p === '/health') return json({ ok: true });
    if (env.RL_IP && req.method === 'POST') {
      const { success } = await env.RL_IP.limit({ key: clientIp(env, req) });
      if (!success) return bad('rate_limited', 429);
    }
    try {
      if (p === '/hit' && req.method === 'POST') return await hit(env, req, await body(req));
      if (p === '/event' && req.method === 'POST') return await event(env, await body(req));
      if (p === '/creator' && req.method === 'POST') return await creator(env, req, await body(req));
      if (p === '/stats' && req.method === 'GET') return await stats(env, req);
      if (p === '/pay' && req.method === 'POST') return await pay(env, await body(req));
      if (p.startsWith('/admin/')) return await admin(env, req, p);
      return bad('not_found', 404);
    } catch (e) {
      console.log('ref error', p, e && e.stack || e);
      return bad('server_error', 500);
    }
  },
};
