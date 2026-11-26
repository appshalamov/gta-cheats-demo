// sb-progress — трофеи GTA 6 игрока с PlayStation / Xbox по открытому профилю (26.11.2026, «Гид по игре», guide-progress).
// Игрок даёт только PSN Online ID или Xbox Gamertag — без пароля. Сервер читает полученные трофеи служебным доступом
// и отдаёт список {name (EN), at}; где игрок в сюжете, считает приложение (js/progress.js) по data/guide/trophies.json.
//   GET /psn/<onlineId>?game=gta6   → {earned:[{name, at}], platform:'psn'}  | {error:'private'|'notfound'|'nogame'|'limit'|'net'}
//   GET /xbox/<gamertag>?game=gta6  → то же
//   GET /health                     → {ok, psn: есть ли доступ, xbox: есть ли ключ}
// Трофеи НЕ сохраняются (приватность): ответ живёт 10 минут в кэше Cloudflare по хэшу ID, в KV — только токены служебного PSN-аккаунта.
// Профили sb-test-* отвечают без ключей (те же данные, что data/guide/progress-test.json) — для тестов без настоящих аккаунтов.
//
// PSN — неофициальные адреса мобильного приложения PlayStation, как в open-source psn-api (MIT, github.com/achievements-app/psn-api):
// NPSSO служебного аккаунта → код → access/refresh токены → профиль по Online ID → трофеи. Константы сверить с psn-api ≥ 2.18 перед выкладкой.
// Xbox — OpenXBL (xbl.io, ключ приложения, Free 150 запросов в час): поиск по gamertag → xuid → достижения по titleId GTA 6.

const GAMES = { gta6: { psnName: /grand theft auto vi/i, xboxTitle: '2035456122' } };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' };
const PSN = {
  auth: 'https://ca.account.sony.com/api/authz/v3/oauth',
  client: '09515159-7237-4370-9b40-3806e67c0891',
  basic: 'MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=',
  redirect: 'com.scee.psxandroid.scecompcall://redirect',
  scope: 'psn:mobile.v2.core psn:clientapp',
  api: 'https://m.np.playstation.com/api/trophy/v1',
  profile: 'https://us-prof.np.community.playstation.net/userProfile/v1/users',
};
const TEST = {
  'sb-test-start': ['Just Like Paradise'],
  'sb-test-ch2': ['Just Like Paradise', 'Paradise Lost', 'Baited My Tackle', 'Hot Together', 'Trust'],
  'sb-test-heist': ['Just Like Paradise', 'Paradise Lost', 'Trust', 'T**s Ass Drug Money', 'Break the Bank', 'Road to Rehabilitation', 'Spin On This!'],
  'sb-test-private': 'private', 'sb-test-nogame': 'nogame',
};

const json = (o, status = 200, maxAge = 0) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store', 'X-Content-Type-Options': 'nosniff' } });
class Err extends Error { constructor(code) { super(code); this.code = code; } }

// ---------- PSN ----------
async function psnTokens(env) {
  const now = Date.now();
  const saved = env.TOK ? await env.TOK.get('psn', { type: 'json' }) : null;
  if (saved?.access && saved.exp > now + 60e3) return saved.access;
  let body;
  if (saved?.refresh && saved.rexp > now + 60e3) {
    body = new URLSearchParams({ refresh_token: saved.refresh, grant_type: 'refresh_token', token_format: 'jwt', scope: PSN.scope });
  } else {
    if (!env.PSN_NPSSO) throw new Err('net');
    const q = new URLSearchParams({ access_type: 'offline', client_id: PSN.client, redirect_uri: PSN.redirect, response_type: 'code', scope: PSN.scope });
    const r = await fetch(`${PSN.auth}/authorize?${q}`, { headers: { Cookie: `npsso=${env.PSN_NPSSO}` }, redirect: 'manual' });
    const code = new URL(r.headers.get('location') || 'x:', 'https://x').searchParams.get('code');
    if (!code) throw new Err('net');                                   // NPSSO истёк — нужен новый (см. Итог, раздел «Обслуживание»)
    body = new URLSearchParams({ code, redirect_uri: PSN.redirect, grant_type: 'authorization_code', token_format: 'jwt' });
  }
  const r = await fetch(`${PSN.auth}/token`, { method: 'POST', body, headers: { Authorization: `Basic ${PSN.basic}`, 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!r.ok) throw new Err('net');
  const t = await r.json();
  const rec = { access: t.access_token, exp: now + t.expires_in * 1e3, refresh: t.refresh_token || saved?.refresh, rexp: t.refresh_token_expires_in ? now + t.refresh_token_expires_in * 1e3 : saved?.rexp };
  if (env.TOK) await env.TOK.put('psn', JSON.stringify(rec));
  return rec.access;
}
async function psnGet(url, tok, lang = 'en-US') {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}`, 'Accept-Language': lang } });
  if (r.status === 404) throw new Err('notfound');
  if (r.status === 403) throw new Err('private');
  if (r.status === 429) throw new Err('limit');
  if (!r.ok) throw new Err('net');
  return r.json();
}
async function psn(id, game, env) {
  const tok = await psnTokens(env);
  const prof = await psnGet(`${PSN.profile}/${encodeURIComponent(id)}/profile2?fields=accountId,onlineId`, tok);
  const acc = prof?.profile?.accountId; if (!acc) throw new Err('notfound');
  const titles = await psnGet(`${PSN.api}/users/${acc}/trophyTitles?limit=800`, tok).catch((e) => { throw e.code === 'notfound' ? new Err('private') : e; });
  const t = (titles.trophyTitles || []).find((x) => GAMES[game].psnName.test(x.trophyTitleName || ''));
  if (!t) throw new Err((titles.trophyTitles || []).length ? 'nogame' : 'private');   // пустой список у живого профиля = скрыт
  const svc = t.npServiceName || 'trophy2';
  const [mine, all] = await Promise.all([
    psnGet(`${PSN.api}/users/${acc}/npCommunicationIds/${t.npCommunicationId}/trophyGroups/all/trophies?npServiceName=${svc}`, tok),
    psnGet(`${PSN.api}/npCommunicationIds/${t.npCommunicationId}/trophyGroups/all/trophies?npServiceName=${svc}`, tok),
  ]);
  const name = new Map((all.trophies || []).map((x) => [x.trophyId, x.trophyName]));
  return { earned: (mine.trophies || []).filter((x) => x.earned).map((x) => ({ name: name.get(x.trophyId), at: x.earnedDateTime, pid: x.trophyId })), np: t.npCommunicationId };
}

// ---------- Xbox (OpenXBL) ----------
async function xbl(path, env) {
  if (!env.XBL_KEY) throw new Err('net');
  const r = await fetch(`https://xbl.io/api/v2/${path}`, { headers: { 'X-Authorization': env.XBL_KEY, Accept: 'application/json', 'Accept-Language': 'en-US' } });
  if (r.status === 429) throw new Err('limit');
  if (r.status === 403 || r.status === 401) throw new Err('private');
  if (!r.ok) throw new Err(r.status === 404 ? 'notfound' : 'net');
  return r.json();
}
async function xbox(tag, game, env) {
  const s = await xbl(`search/${encodeURIComponent(tag)}`, env);
  const p = (s.people || []).find((x) => (x.gamertag || '').toLowerCase() === tag.toLowerCase()) || (s.people || [])[0];
  if (!p?.xuid) throw new Err('notfound');
  const a = await xbl(`achievements/player/${p.xuid}/${GAMES[game].xboxTitle}`, env);
  const list = a.achievements || [];
  if (!list.length) throw new Err('nogame');
  return { earned: list.filter((x) => x.progressState === 'Achieved').map((x) => ({ name: x.name, at: x.progression?.timeUnlocked, xid: x.id })) };
}

async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32); }

export async function handle(req, env = {}, ctx = { waitUntil() { } }) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  const u = new URL(req.url);
  if (u.pathname === '/health') return json({ ok: true, psn: !!env.PSN_NPSSO, xbox: !!env.XBL_KEY });
  const m = u.pathname.match(/^\/(psn|xbox)\/([^/]{3,32})$/);
  const game = u.searchParams.get('game') || 'gta6';
  if (!m || !GAMES[game]) return json({ error: 'notfound' }, 404);
  const [, plat] = m; const id = decodeURIComponent(m[2]).trim();
  if (!/^[\w\- ]{3,16}$/.test(id) && !/^sb-test-/i.test(id)) return json({ error: 'notfound' }, 400);
  const tk = TEST[id.toLowerCase()];
  if (tk) return typeof tk === 'string' ? json({ error: tk }, tk === 'private' ? 403 : 404) : json({ earned: tk.map((name) => ({ name })), platform: plat, test: true });
  const key = new Request(`https://cache.sb-progress/${plat}/${game}/${await sha(id.toLowerCase())}`);
  const cache = globalThis.caches?.default;
  const hit = cache && await cache.match(key); if (hit) return hit;
  try {
    const r = plat === 'psn' ? await psn(id, game, env) : await xbox(id, game, env);
    const res = json({ ...r, platform: plat }, 200, 600);
    if (cache) ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (e) {
    const code = e instanceof Err ? e.code : 'net';
    return json({ error: code }, { private: 403, notfound: 404, nogame: 404, limit: 429 }[code] || 502);
  }
}
export default { fetch: handle };
