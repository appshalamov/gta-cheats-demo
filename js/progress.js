// Прогресс игрока с PlayStation / Xbox (26.11.2026, «Гид по игре», сессия guide-progress). Ресёрч и выбор пути —
// «Гид по игре — система (26.11.2026)/Итог для Fable — прогресс PS и Xbox.md».
// Как работает: игрок вводит PSN Online ID или Xbox Gamertag (без пароля) → сервер sb-progress читает полученные трофеи GTA 6
// служебным аккаунтом → здесь по карте data/guide/trophies.json находим последний сюжетный трофей (12 вех на ~109 миссий) →
// между вехами игрок уточняет по одной миссии «Прошли X? Да / Я здесь» (названия дальше не показываются) → запись в общий
// ключ гида прохождения localStorage sb.gp = {gta6:{m:'m:<id>'|null, c:'c<N>', via:'psn'|'xbox'|'self', at, t:{ru,en}}}.
// Запасные пути без консоли: процент «Сюжет» из меню игры (Пауза → Прогресс → Статистика) и обычный выбор миссии (js/walk.js).
// Профили sb-test-* — тестовые, отвечают без сети (data/guide/progress-test.json); настоящих аккаунтов в тестах нет.

const S = {
  ru: {
    title: 'Подтянуть прогресс с консоли', sub: 'Найдём, где вы в сюжете, по трофеям. Пароль не нужен.',
    psn: 'PlayStation', psn_s: 'По PSN Online ID', xbox: 'Xbox', xbox_s: 'По Gamertag',
    id_psn: 'PSN Online ID', id_xbox: 'Gamertag', find: 'Найти', back: 'Назад', close: 'Закрыть',
    pct: 'Или по проценту из игры', pct_s: 'Пауза, затем Прогресс, Статистика, строка «Сюжет»', pct_go: 'Показать главу',
    open_psn: 'Трофеи должны быть открыты всем: PS5, Настройки, Пользователи и учётные записи, Конфиденциальность, «Кто может видеть ваши трофеи» — «Все».',
    open_xbox: 'История игр должна быть открыта: Xbox, Настройки, Учётная запись, Конфиденциальность, «Другие могут видеть историю игр» — «Все».',
    wait: 'Ищем трофеи GTA 6…',
    e_private: 'Профиль закрыт, трофеи не видны.', e_notfound: 'Такой профиль не нашли. Проверьте написание.',
    e_nogame: 'В профиле пока нет GTA 6. Если только что начали, трофеи появятся после первого.',
    e_net: 'Сервер прогресса сейчас недоступен. Отметьте миссию сами, это 2 тапа.', e_limit: 'Слишком много проверок. Попробуйте через минуту.',
    found: 'Нашли трофеев GTA 6: {n}', none_story: 'Сюжетных трофеев пока нет: вы в начале первой главы.',
    passed: 'Вы прошли «{m}»', passed_ch: 'Вы прошли главу {c}', ch: 'Глава {n}', by: 'Последний сюжетный трофей «{t}»',
    q: 'Прошли «{m}»?', q_yes: 'Да, прошёл', q_here: 'Нет, я на ней', q_hint: 'До следующего сюжетного трофея ещё есть миссии. Спросим по одной, без спойлеров.',
    save: 'Сохранить', saved: 'Сохранили. Гид покажет подсказки к следующей миссии.', keep: 'Ваша отметка дальше трофеев, оставили её.',
    sides: 'Закрытые побочные линии', upd: 'Обновить', unlink: 'Отвязать', linked: 'Подключено: {id}, проверено {d}',
    pct_r: 'Скорее всего вы в главе {n}, около миссии «{m}»', pct_note: 'Это примерная оценка. Поправьте, если не так.',
    more: 'Дальше', m_tips: 'Подсказки к следующей миссии', m_tips_s: 'Что взять и что можно упустить', m_eggs: 'Пасхалки рядом с сюжетом', m_eggs_s: 'Находки, до которых вы уже дошли',
    manual: 'Отметить миссию самому', privacy: 'ID хранится только на телефоне. Сервер не сохраняет трофеи.',
  },
  en: {
    title: 'Sync progress from your console', sub: "We'll find where you are in the story from your trophies. No password needed.",
    psn: 'PlayStation', psn_s: 'By PSN Online ID', xbox: 'Xbox', xbox_s: 'By Gamertag',
    id_psn: 'PSN Online ID', id_xbox: 'Gamertag', find: 'Find', back: 'Back', close: 'Close',
    pct: 'Or use the in-game percentage', pct_s: 'Pause, then Progress, Stats, the Story line', pct_go: 'Show my chapter',
    open_psn: 'Trophies must be visible to Anyone: PS5 Settings, Users and Accounts, Privacy, "Who can see your trophies" set to Anyone.',
    open_xbox: 'Game history must be public: Xbox Settings, Account, Privacy, "Others can see your game and app history" set to Everybody.',
    wait: 'Looking for GTA 6 trophies…',
    e_private: 'This profile is private, trophies are hidden.', e_notfound: "We couldn't find that profile. Check the spelling.",
    e_nogame: 'No GTA 6 on this profile yet. Trophies show up after your first one.',
    e_net: 'The progress server is unavailable. Mark your mission yourself, it takes 2 taps.', e_limit: 'Too many checks. Try again in a minute.',
    found: 'GTA 6 trophies found: {n}', none_story: 'No story trophies yet: you are early in Chapter 1.',
    passed: 'You finished "{m}"', passed_ch: 'You finished Chapter {c}', ch: 'Chapter {n}', by: 'Last story trophy "{t}"',
    q: 'Finished "{m}"?', q_yes: 'Yes, done', q_here: "No, I'm on it", q_hint: "There are more missions before the next story trophy. We'll ask one at a time, no spoilers.",
    save: 'Save', saved: 'Saved. The guide will show tips for your next mission.', keep: 'Your own mark is further than the trophies, we kept it.',
    sides: 'Side stories finished', upd: 'Refresh', unlink: 'Unlink', linked: 'Linked: {id}, checked {d}',
    pct_r: 'You are probably in Chapter {n}, around "{m}"', pct_note: 'This is an estimate. Adjust it if it is off.',
    more: 'Next', m_tips: 'Tips for your next mission', m_tips_s: 'What to bring and what you can miss', m_eggs: 'Easter eggs along the story', m_eggs_s: "Finds you've already unlocked",
    manual: 'Mark my mission myself', privacy: 'Your ID stays on this phone. The server does not keep your trophies.',
  },
};
export const API = 'https://progress.sbgta.app';      // server/progress-worker (не выложен: нужен служебный аккаунт, см. Итог для Fable)
const KEY = 'sb.gp', LINK = 'sb.gl';
const SIDE_NAMES = { en: { andy: 'Andy', kenton: 'Kenton', billy: 'Billy', randy: 'Randy', tyrone: 'Tyrone', cal: 'Cal', bret: 'Bret' },
  ru: { andy: 'Энди', kenton: 'Кентон', billy: 'Билли', randy: 'Рэнди', tyrone: 'Тайрон', cal: 'Кэл', bret: 'Брет' } };

let C = null, D = null, layer = null, V = { step: 'home' };
const lang = () => (C?.lang === 'ru' ? 'ru' : 'en');
const s = (k, v = {}) => { let x = S[lang()][k] ?? S.en[k] ?? k; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
const tx = (o) => (o ? o[lang()] || o.en || o.ru || '' : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rd = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
const norm = (x) => String(x || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- данные ----------
async function getJSON(u) { const r = await fetch(u); if (!r.ok) throw new Error(r.status); return r.json(); }
export async function loadData(game = 'gta6', base = '') {
  const [tro, mis] = await Promise.all([
    getJSON(`${base}data/guide/trophies.json`),
    getJSON(`${base}data/guide/missions.json`).catch(() => getJSON(`${base}data/guide/missions.stub.json`)),
  ]);
  return index(tro, mis, game);
}
// общий порядок миссий (как у walk.js: сюжетные по n), вехи-трофеи с индексом в этом порядке
export function index(tro, mis, game = 'gta6') {
  const mid = (x) => String(x || '').replace(/^m:/, '');
  const order = mis.m.filter((m) => (m.k || 'main') === 'main').sort((a, b) => a.n - b.n);
  const pos = new Map(order.map((m, i) => [mid(m.id), i]));
  const byTitle = new Map(order.map((m, i) => [norm(m.t?.en), i]));
  const lastOf = (cid) => { let k = -1; order.forEach((m, i) => { if (m.ch === cid) k = i; }); return k; };
  const tByName = new Map();
  const marks = [];
  for (const t of tro.t) {
    tByName.set(norm(t.en), t); if (t.xb) tByName.set(norm(t.xb), t);
    if (t.kind !== 'story') continue;
    const i = t.m ? (pos.get(mid(t.m)) ?? byTitle.get(norm(t.mt)) ?? -1) : lastOf(t.end);
    if (i >= 0) marks.push({ t, i });
  }
  marks.sort((a, b) => a.i - b.i);
  return { game, tro, order, ch: mis.ch || [], marks, tByName, mid: Object.fromEntries(order.map((m) => [mid(m.id), m])) };
}
// трофеи → место в сюжете. earned: [{name|k, at}] (имя EN или ключ k из trophies.json)
export function fromEarned(d, earned) {
  const got = new Set();
  const keys = [];
  for (const e of earned) { const t = e.k ? d.tro.t.find((x) => x.k === e.k) : d.tByName.get(norm(e.name)); if (t) { got.add(t.k); keys.push({ ...t, at: e.at }); } }
  let last = null;
  for (const mk of d.marks) if (got.has(mk.t.k)) last = mk;          // вехи по порядку: берём самую дальнюю
  const idx = last ? last.i : -1;
  const next = d.marks.find((mk) => mk.i > idx) || null;
  const gap = d.order.slice(idx + 1, next ? next.i : d.order.length);  // где-то здесь игрок: уточняем по одной
  const sides = keys.filter((t) => t.kind === 'side' && t.p).map((t) => t.p.slice(2));
  return { n: keys.length, last, idx, next, gap, sides, keys: [...got] };
}
// процент «Сюжет» из меню игры → примерная миссия (по доле пройденных сюжетных миссий; подсказка, не истина)
export function fromPercent(d, pct) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  return Math.max(-1, Math.min(d.order.length - 1, Math.round(p / 100 * d.order.length) - 1));
}
const ref = (m) => `m:${String(m.id).replace(/^m:/, '')}`;
export function getProg(game = 'gta6') { return rd(KEY)[game] || null; }
function posOf(d, p) {
  if (!p) return null;
  if (p.m) { const m = d.mid[p.m.replace(/^m:/, '')]; return m ? d.order.indexOf(m) : null; }
  if (p.c) { let k = -1; d.order.forEach((m, i) => { const ch = d.ch.find((c) => c.id === p.c); if (ch && d.ch.find((c) => c.id === m.ch)?.n < ch.n) k = i; }); return k; }
  return -1;
}
// запись в общий ключ; отметку игрока, которая дальше трофеев, не затираем
export function save(d, i, via) {
  const all = rd(KEY), cur = all[d.game], ci = posOf(d, cur);
  if (via !== 'self' && cur?.via === 'self' && ci != null && ci > i) return false;
  const m = i >= 0 ? d.order[i] : null;
  all[d.game] = m ? { m: ref(m), via, at: Date.now(), t: m.t } : { m: null, via, at: Date.now() };
  wr(KEY, all);
  return true;
}

// ---------- сервер ----------
export async function fetchEarned(platform, id, { api = API, base = '' } = {}) {
  const clean = String(id || '').trim();
  if (/^sb-test-/i.test(clean)) {                                      // тестовые профили — без сети
    const f = await getJSON(`${base}data/guide/progress-test.json`);
    const r = f.profiles[clean.toLowerCase()];
    if (!r) return { error: 'notfound' };
    return r.error ? { error: r.error } : { earned: r.earned, platform };
  }
  try {
    const r = await fetch(`${api}/${platform}/${encodeURIComponent(clean)}?game=gta6`, { headers: { Accept: 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.error || (r.status === 429 ? 'limit' : 'net') };
    return j;
  } catch { return { error: 'net' }; }
}

// ---------- экран (шторка поверх гида) ----------
function css() {
  for (const [id, href] of [['guide-css', 'css/guide.css'], ['progress-css', 'css/progress.css']]) {
    if (document.getElementById(id)) continue;
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
}
const I = (n) => C.I?.[n] || '';
function home() {
  const lk = rd(LINK)[D.game] || {};
  const row = (p) => `<button class="pg-row" data-p="plat" data-v="${p}"><span class="pg-tt"><b>${s(p)}</b><small>${esc(lk[p] ? s('linked', { id: lk[p].id, d: new Date(lk[p].at).toLocaleDateString(lang()) }) : s(`${p}_s`))}</small></span><i class="pg-chev">${I('chevron')}</i></button>`;
  return `<h2 class="pg-h">${esc(s('title'))}</h2><p class="pg-sub">${esc(s('sub'))}</p>
    <div class="pg-list">${row('psn')}${row('xbox')}</div>
    <section class="pg-pct"><h3>${esc(s('pct'))}</h3><p class="pg-note">${esc(s('pct_s'))}</p>
      <div class="pg-in"><input id="pg-pct" type="number" inputmode="numeric" min="0" max="100" placeholder="34" aria-label="%"><span>%</span>
      <button class="g-main pg-go" data-p="pct">${esc(s('pct_go'))}</button></div></section>
    <button class="g-link pg-manual" data-p="manual">${esc(s('manual'))}</button>`;
}
function ask() {
  const p = V.plat, lk = rd(LINK)[D.game]?.[p];
  return `<button class="g-link pg-back" data-p="home">${I('chevron')}<span>${esc(s('back'))}</span></button>
    <h2 class="pg-h">${esc(s(p))}</h2>
    <label class="pg-lab" for="pg-id">${esc(s(`id_${p}`))}</label>
    <input id="pg-id" class="pg-field" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(V.id || lk?.id || '')}" enterkeyhint="search">
    ${V.err ? `<p class="g-trap pg-err">${esc(s(`e_${V.err}`))}</p>` : ''}
    ${V.err === 'private' || !V.err ? `<p class="pg-note">${esc(s(`open_${p}`))}</p>` : ''}
    ${V.err === 'net' ? `<button class="g-main" data-p="manual">${esc(s('manual'))}</button>` : `<button class="g-main" data-p="find"${V.busy ? ' disabled' : ''}>${esc(V.busy ? s('wait') : s('find'))}</button>`}
    <p class="pg-note pg-priv">${esc(s('privacy'))}</p>`;
}
function result() {
  const r = V.r, i = V.i, m = i >= 0 ? D.order[i] : null, ch = m ? D.ch.find((c) => c.id === m.ch) : null;
  const q = V.q != null && !V.stop ? D.order[V.q] : null;
  const head = r.last ? (r.last.t.end && i === r.last.i ? s('passed_ch', { c: r.last.t.end.slice(1) }) : s('passed', { m: tx(m.t) })) : s('none_story');
  return `<p class="pg-note">${esc(V.plat ? s('found', { n: r.n }) : s('pct_note'))}</p>
    <h2 class="pg-h">${esc(V.plat ? (i === r.idx ? head : s('passed', { m: tx(m?.t) })) : s('pct_r', { n: ch?.n ?? 1, m: tx(m?.t) || tx(D.order[0].t) }))}</h2>
    ${ch ? `<p class="pg-sub">${esc(s('ch', { n: ch.n }))}${r.last && V.plat ? `. ${esc(s('by', { t: r.last.t.en }))}` : ''}</p>` : ''}
    ${q ? `<section class="pg-q"><p class="pg-note">${esc(s('q_hint'))}</p>
      <p class="pg-qt">${esc(s('q', { m: tx(q.t) }))}</p>
      <div class="pg-yn"><button class="g-main" data-p="yes">${esc(s('q_yes'))}</button><button class="g-sec-btn" data-p="here">${esc(s('q_here'))}</button></div></section>` : ''}
    ${r.sides?.length ? `<p class="pg-note">${esc(s('sides'))}: ${esc(r.sides.map((x) => SIDE_NAMES[lang()][x] || x).join(', '))}</p>` : ''}
    ${q || V.saved ? '' : `<button class="g-main pg-save" data-p="save">${esc(s('save'))}</button>`}
    ${V.msg ? `<p class="pg-ok" role="status">${esc(V.msg)}</p>` : ''}
    ${V.saved ? `<section class="pg-more"><h3>${esc(s('more'))}</h3>
      <button class="pg-row" data-p="tips"><span class="pg-tt"><b>${esc(s('m_tips'))}</b><small>${esc(s('m_tips_s'))}</small></span><i class="pg-chev">${I('chevron')}</i></button>
      <button class="pg-row" data-p="eggs"><span class="pg-tt"><b>${esc(s('m_eggs'))}</b><small>${esc(s('m_eggs_s'))}</small></span><i class="pg-chev">${I('chevron')}</i></button></section>` : ''}`;
}
function paint() {
  const body = V.step === 'ask' ? ask() : V.step === 'res' ? result() : home();
  layer.innerHTML = `<div class="g-sh-in pg-in-sheet"><div class="g-sh-top"><b></b><button class="g-ib" data-p="close" aria-label="${esc(s('close'))}">${I('close') || '×'}</button></div>${body}</div>`;
}
async function find() {
  const id = layer.querySelector('#pg-id')?.value.trim(); if (!id) return;
  V = { ...V, id, busy: true, err: null }; paint();
  const r = await (C.fetchEarned || fetchEarned)(V.plat, id, { base: C.base || '' });
  if (r.error) { V = { ...V, busy: false, err: r.error }; paint(); C.event?.('progress_err', { p: V.plat, e: r.error }); return; }
  const lk = rd(LINK); lk[D.game] = { ...(lk[D.game] || {}), [V.plat]: { id, at: Date.now() } }; wr(LINK, lk);
  const res = fromEarned(D, r.earned || []);
  V = { step: 'res', plat: V.plat, r: res, i: res.idx, q: res.gap.length ? res.idx + 1 : null };
  paint(); C.event?.('progress_found', { p: V.plat, n: res.n, i: res.idx });
}
function onClick(e) {
  const b = e.target.closest('[data-p]'); if (!b || !layer.contains(b)) return;
  switch (b.dataset.p) {
    case 'close': close(); break;
    case 'home': V = { step: 'home' }; paint(); break;
    case 'plat': V = { step: 'ask', plat: b.dataset.v }; paint(); layer.querySelector('#pg-id')?.focus(); break;
    case 'find': find(); break;
    case 'pct': { const v = layer.querySelector('#pg-pct')?.value; if (v === '') break; const i = fromPercent(D, v);
      V = { step: 'res', plat: null, r: { n: 0, idx: i, last: null, next: null, gap: [] }, i, q: null }; paint(); break; }
    case 'yes': { V.i = V.q; const nx = V.q + 1, lim = V.r.next ? V.r.next.i : D.order.length; V.q = nx < lim ? nx : null; paint(); C.haptic?.(); break; }
    case 'here': V.stop = true; paint(); break;
    case 'save': { const ok = save(D, V.i, V.plat || 'self'); V.saved = true; V.msg = ok ? s('saved') : s('keep'); paint(); C.onSaved?.(getProg(D.game)); C.event?.('progress_save', { via: V.plat || 'pct', i: V.i, ok }); break; }
    case 'manual': close(); C.openWalkPick?.(); break;
    case 'tips': close(); C.openWalk?.(); break;
    case 'eggs': close(); C.openFeed?.('eggs'); break;
  }
}
function onKey(e) { if (e.key === 'Enter' && e.target.id === 'pg-id') find(); }
export async function openProgress(ctx, game = 'gta6') {
  C = ctx; css(); D = await loadData(game, ctx.base || '');
  layer = document.getElementById('pg');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'pg'; layer.className = 'g-sheet pg-sheet'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick); layer.addEventListener('keydown', onKey);
  }
  V = { step: ctx.platform ? 'ask' : 'home', plat: ctx.platform || null }; paint(); layer.hidden = false;
  C.event?.('progress_open', { from: ctx.from || '' });
  return true;
}
export function close() { if (layer) layer.hidden = true; C?.onClose?.(); }
