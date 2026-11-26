// Прогресс «где я в сюжете» без ручного списка (26.11.2026, «Гид по игре», сессия guide-progress).
// Итог и выбор пути — «Гид по игре — система (26.11.2026)/Итог для Fable — прогресс PS и Xbox.md», правила —
// «Решение Fable — система гида.md» (раздел 1: строка внутри шторки «Где вы», не отдельный экран; раздел 3: sb.gp; раздел 7: консоли).
// Две строки для общей шторки «Где вы» (js/guide-core.js pickPos): registerRows(ctx) → registerPickRow; позицию пишет ядро (setPos).
// Запасной вход — mountRows(el, ctx) в любой контейнер.
//  1) «По проценту из игры»: Пауза → Прогресс → Статистика → «Сюжет» N % → стартовая миссия с запасом назад →
//     «Прошли «X»? Да / Нет, я на ней» по одной (названий впереди не видно) → sb.gp via:'pct'.
//  2) «Подтянуть с PlayStation | Xbox» (сразу под платформу из Настроек; в выпуске 1 — только под ?sbmock=<имя>, напр. ?sbmock=progress, тестовые профили sb-test-*):
//     ник без пароля → сервер sb-progress (server/progress-worker, НЕ выложен) → трофеи → 12 сюжетных вех по data/guide/trophies.json →
//     то же уточнение по одной → sb.gp via:'psn'|'xbox'. Только сюжет; побочные линии — позже.
// sb.gp = {gta6:{m:'m:<id>'|null | c:'c<N>', via:'self'|'pct'|'psn'|'xbox', at, t}}. Ручная отметка сильнее всего; pct и консоль — только вперёд.
// Ссылка ?open=progress открывает те же строки в своей шторке (openProgress).

import { registerPickRow, setBase, base as coreBase, setPos, pos as corePos, rankOf } from './guide-core.js';

const S = {
  ru: {
    title: 'Где вы в сюжете', close: 'Закрыть', back: 'Назад',
    pct: 'По проценту из игры', pct_s: 'Пауза, Прогресс, Статистика, строка «Сюжет»', pct_go: 'Дальше',
    con: 'Подтянуть с {p}', con_s: 'По трофеям, без пароля', psn: 'PlayStation', xbox: 'Xbox', other: 'У меня {p}',
    id_psn: 'PSN Online ID', id_xbox: 'Gamertag', find: 'Найти',
    open_psn: 'Трофеи должны быть открыты всем: PS5, Настройки, Пользователи и учётные записи, Конфиденциальность, «Кто может видеть ваши трофеи» — «Все».',
    open_xbox: 'История игр должна быть открыта: Xbox, Настройки, Учётная запись, Конфиденциальность, «Другие могут видеть историю игр» — «Все».',
    wait: 'Ищем трофеи GTA 6…',
    e_private: 'Профиль закрыт, трофеи не видны.', e_notfound: 'Такой профиль не нашли. Проверьте написание.',
    e_nogame: 'В профиле пока нет GTA 6. Трофеи появятся после первого.',
    e_net: 'Сервер прогресса сейчас недоступен. Отметьте миссию в списке выше или по проценту.', e_limit: 'Слишком много проверок. Попробуйте через минуту.',
    found: 'Нашли трофеев GTA 6: {n}', none_story: 'Сюжетных трофеев пока нет: вы в начале первой главы.',
    passed: 'Вы прошли «{m}»', ch: 'Глава {n}', by: 'Последний сюжетный трофей «{t}»', start: 'Вы в самом начале',
    q: 'Прошли «{m}»?', q_yes: 'Да, прошёл', q_here: 'Нет, я на ней',
    q_hint: 'Спросим по одной миссии, без спойлеров.', pct_note: 'Начали чуть раньше оценки, чтобы не показать лишнего.',
    save: 'Сохранить', saved: 'Сохранили. Гид покажет, что важно перед следующей миссией.', keep: 'Ваша отметка уже дальше, оставили её.',
    privacy: 'Ник хранится только на телефоне. Сервер не сохраняет трофеи.',
  },
  en: {
    title: 'Where you are in the story', close: 'Close', back: 'Back',
    pct: 'From the in-game percentage', pct_s: 'Pause, Progress, Stats, the Story line', pct_go: 'Next',
    con: 'Sync from {p}', con_s: 'From your trophies, no password', psn: 'PlayStation', xbox: 'Xbox', other: 'I play on {p}',
    id_psn: 'PSN Online ID', id_xbox: 'Gamertag', find: 'Find',
    open_psn: 'Trophies must be visible to Anyone: PS5 Settings, Users and Accounts, Privacy, "Who can see your trophies" set to Anyone.',
    open_xbox: 'Game history must be public: Xbox Settings, Account, Privacy, "Others can see your game and app history" set to Everybody.',
    wait: 'Looking for GTA 6 trophies…',
    e_private: 'This profile is private, trophies are hidden.', e_notfound: "We couldn't find that profile. Check the spelling.",
    e_nogame: 'No GTA 6 on this profile yet. Trophies show up after your first one.',
    e_net: 'The progress server is unavailable. Mark your mission in the list above or by percentage.', e_limit: 'Too many checks. Try again in a minute.',
    found: 'GTA 6 trophies found: {n}', none_story: 'No story trophies yet: you are early in Chapter 1.',
    passed: 'You finished "{m}"', ch: 'Chapter {n}', by: 'Last story trophy "{t}"', start: 'You are at the very start',
    q: 'Finished "{m}"?', q_yes: 'Yes, done', q_here: "No, I'm on it",
    q_hint: "We'll ask one mission at a time, no spoilers.", pct_note: 'We start a little before the estimate so nothing ahead is shown.',
    save: 'Save', saved: 'Saved. The guide will show what matters before your next mission.', keep: 'Your own mark is already further, we kept it.',
    privacy: 'Your ID stays on this phone. The server does not keep your trophies.',
  },
};
export const API = 'https://progress.sbgta.app';      // server/progress-worker (не выложен: нужен служебный аккаунт, см. Итог для Fable)
const KEY = 'sb.gp', LINK = 'sb.gl';

let C = null, D = null, root = null, sheet = null, V = {}, resolver = null;
const lang = () => (C?.lang === 'ru' ? 'ru' : 'en');
const s = (k, v = {}) => { let x = S[lang()][k] ?? S.en[k] ?? k; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
const tx = (o) => (o ? o[lang()] || o.en || o.ru || '' : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rd = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
const norm = (x) => String(x || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
// кнопки консоли — только в демке (Решение Fable: «Кнопки PlayStation и Xbox — только под ?sbmock»)
// как js/api.js: ?sbmock=<имя> пишет sessionStorage sb.mock только на стенде (localhost) или в demo — в боевой сборке кнопок нет
export const consoleOn = () => { try { return !!sessionStorage.getItem('sb.mock') || (/[?&]sbmock=\w/.test(location.search) && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)); } catch { return false; } };

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
  // n в базе guide-walkthrough — номер внутри главы (26.11), поэтому порядок: номер главы, потом n
  const cn = Object.fromEntries((mis.ch || []).map((c) => [c.id, c.n]));
  const order = mis.m.filter((m) => (m.k || 'main') === 'main').sort((a, b) => ((cn[a.ch] ?? 0) - (cn[b.ch] ?? 0)) || (a.n - b.n));
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
  return { game, tro, raw: mis, order, ch: mis.ch || [], marks, tByName, mid: Object.fromEntries(order.map((m) => [mid(m.id), m])) };
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
export function getProg(game = 'gta6') { return corePos(game); }
// запись позиции — через ядро гида (js/guide-core.js setPos, правила раздела 3): ручная — всегда, в том числе назад;
// процент и консоль — только вперёд и не затирают отметку там же или дальше. i = -1 — самое начало (глава 1).
const posFor = (d, i) => (i >= 0 ? { m: ref(d.order[i]), t: d.order[i].t } : { c: d.ch[0]?.id || 'c1' });
export function save(d, i, via) {
  if (!coreBase(d.game)) setBase(d.game, d.raw);
  return setPos(d.game, { ...posFor(d, i), via });
}
// сдвинет ли запись позицию (для подсказки «Ваша отметка уже дальше» до закрытия шторки)
export function wouldMove(d, i, via) {
  if (via === 'self') return true;
  if (!coreBase(d.game)) setBase(d.game, d.raw);
  const cur = corePos(d.game); if (!cur) return true;
  const a = rankOf(d.game, cur.m || cur.c), p = posFor(d, i), b = rankOf(d.game, p.m || p.c);
  return !(a >= 0 && b >= 0 && b <= a);
}
// процент → с какой миссии начать вопросы: оценка с запасом назад (2 миссии), чтобы не показать название впереди игрока
export const pctStart = (d, pct) => Math.max(-1, fromPercent(d, pct) - 2);

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

// ---------- строки для шторки «Где вы» ----------
function css() {
  for (const [id, f] of [['guide-css', 'guide.css'], ['progress-css', 'progress.css']]) {   // g-* (кнопки, шторка) — из guide.css
    if (document.getElementById(id)) continue;
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = `${C.base || ''}css/${f}`; document.head.appendChild(l);
  }
}
const I = (n) => C.I?.[n] || '';
const plat = () => V.plat || (C.platform === 'xbox' ? 'xbox' : 'psn');
const row = (act, b, sm, open) => `<button class="pg-row${open ? ' open' : ''}" data-p="${act}" aria-expanded="${!!open}"><span class="pg-tt"><b>${esc(b)}</b><small>${esc(sm)}</small></span><i class="pg-chev">${I('chevron')}</i></button>`;
function refine() {          // результат + вопросы по одной миссии + «Сохранить»
  const i = V.i, m = i >= 0 ? D.order[i] : null, ch = m ? D.ch.find((c) => c.id === m.ch) : null;
  const q = V.q != null && !V.stop ? D.order[V.q] : null;
  const head = m ? s('passed', { m: tx(m.t) }) : V.r?.n ? s('none_story') : s('start');
  return `<div class="pg-res">
    ${V.r ? `<p class="pg-note">${esc(s('found', { n: V.r.n }))}</p>` : ''}
    <p class="pg-big">${esc(head)}</p>
    ${ch ? `<p class="pg-note">${esc(s('ch', { n: ch.n }))}${V.r?.last ? `. ${esc(s('by', { t: V.r.last.t.en }))}` : ''}</p>` : ''}
    ${V.via === 'pct' && V.q != null && i === V.start ? `<p class="pg-note">${esc(s('pct_note'))}</p>` : ''}
    ${q ? `<div class="pg-q"><p class="pg-note">${esc(s('q_hint'))}</p><p class="pg-qt">${esc(s('q', { m: tx(q.t) }))}</p>
      <div class="pg-yn"><button class="g-main" data-p="yes">${esc(s('q_yes'))}</button><button class="pg-no" data-p="here">${esc(s('q_here'))}</button></div></div>`
    : V.done ? `<p class="pg-ok" role="status">${esc(V.done)}</p>` : `<button class="g-main pg-save" data-p="save">${esc(s('save'))}</button>`}
  </div>`;
}
function body() {
  const P = plat(), other = P === 'psn' ? 'xbox' : 'psn', lk = rd(LINK)[D.game]?.[P];
  const pctOpen = V.open === 'pct', conOpen = V.open === 'con';
  return `<div class="pg-rows">
    ${row('pct', s('pct'), s('pct_s'), pctOpen)}
    ${pctOpen ? `<div class="pg-pane">${V.via === 'pct' && V.i != null ? refine()
      : `<div class="pg-in"><input id="pg-pct" type="number" inputmode="numeric" min="0" max="100" placeholder="34" aria-label="${esc(s('pct'))}"><span>%</span>
        <button class="g-main pg-go" data-p="pct-go">${esc(s('pct_go'))}</button></div>`}</div>` : ''}
    ${consoleOn() ? `${row('con', s('con', { p: s(P) }), s('con_s'), conOpen)}
    ${conOpen ? `<div class="pg-pane">${V.via === P && V.i != null ? refine() : `
      <label class="pg-lab" for="pg-id">${esc(s(`id_${P}`))}</label>
      <input id="pg-id" class="pg-field" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(V.id || lk?.id || '')}" enterkeyhint="search">
      ${V.err ? `<p class="g-trap pg-err">${esc(s(`e_${V.err}`))}</p>` : ''}
      ${!V.err || V.err === 'private' ? `<p class="pg-note">${esc(s(`open_${P}`))}</p>` : ''}
      <button class="g-main" data-p="find"${V.busy ? ' disabled' : ''}>${esc(V.busy ? s('wait') : s('find'))}</button>
      <button class="g-link pg-other" data-p="other">${esc(s('other', { p: s(other) }))}</button>
      <p class="pg-note">${esc(s('privacy'))}</p>`}</div>` : ''}` : ''}
  </div>`;
}
function paint() {
  if (!root) return;
  root.innerHTML = body();
  if (sheet) root.insertAdjacentHTML('afterbegin', `<div class="g-sh-top"><b>${esc(s('title'))}</b><button class="g-ib" data-p="close" aria-label="${esc(s('close'))}">${I('close') || '×'}</button></div>`);
}
function startRefine(via, i, r = null) {
  const lim = r?.next ? r.next.i : D.order.length;
  V = { ...V, via, i, start: i, r, q: i + 1 < lim ? i + 1 : null, lim, stop: false, done: '' };
  paint();
}
async function find() {
  const id = root.querySelector('#pg-id')?.value.trim(); if (!id) return;
  const P = plat();
  V = { ...V, id, busy: true, err: null }; paint();
  const r = await (C.fetchEarned || fetchEarned)(P, id, { base: C.base || '' });
  if (r.error) { V = { ...V, busy: false, err: r.error }; paint(); C.event?.('progress_err', { p: P, e: r.error }); return; }
  const lk = rd(LINK); lk[D.game] = { ...(lk[D.game] || {}), [P]: { id, at: Date.now() } }; wr(LINK, lk);
  const res = fromEarned(D, r.earned || []);
  V.busy = false; startRefine(P, res.idx, res);
  C.event?.('progress_found', { p: P, n: res.n, i: res.idx });
}
function onClick(e) {
  const b = e.target.closest('[data-p]'); if (!b || !root?.contains(b)) return;
  e.stopPropagation();
  switch (b.dataset.p) {
    case 'close': close(); break;
    case 'pct': V = { open: V.open === 'pct' ? '' : 'pct', plat: V.plat }; paint(); root.querySelector('#pg-pct')?.focus(); break;
    case 'con': V = { open: V.open === 'con' ? '' : 'con', plat: V.plat }; paint(); break;
    case 'other': V = { open: 'con', plat: plat() === 'psn' ? 'xbox' : 'psn' }; paint(); break;
    case 'pct-go': { const v = root.querySelector('#pg-pct')?.value; if (v === '' || v == null) break; startRefine('pct', pctStart(D, v)); C.event?.('progress_pct', { v: Number(v) }); break; }
    case 'find': find(); break;
    case 'yes': V.i = V.q; V.q = V.q + 1 < V.lim ? V.q + 1 : null; paint(); C.haptic?.(); break;
    case 'here': V.stop = true; paint(); break;
    case 'save': {
      if (resolver) {                                  // строка шторки «Где вы» ядра: позицию пишет pickPos через setPos
        if (!wouldMove(D, V.i, V.via)) { V.done = s('keep'); paint(); break; }
        const r = resolver; resolver = null; C.event?.('progress_save', { via: V.via, i: V.i, ok: true });
        sheet.hidden = true; r({ ...posFor(D, V.i), via: V.via }); break;
      }
      const ok = save(D, V.i, V.via); V.done = ok ? s('saved') : s('keep'); paint();
      C.onSaved?.(getProg(D.game)); C.event?.('progress_save', { via: V.via, i: V.i, ok }); break;
    }
  }
}
function onKey(e) { if (e.key === 'Enter') { if (e.target.id === 'pg-id') find(); if (e.target.id === 'pg-pct') root.querySelector('[data-p="pct-go"]')?.click(); } }
// для шторки «Где вы» гида прохождения: el — пустой контейнер внутри pickPos(); ctx = {lang, I, platform: 'playstation'|'xbox', game, onSaved, haptic, event}
export async function mountRows(el, ctx, game = 'gta6') {
  C = ctx; css(); D = await loadData(game, ctx.base || '');
  if (root && root !== el) { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); }
  root = el; sheet = null; V = { open: ctx.open || '' };
  root.addEventListener('click', onClick); root.addEventListener('keydown', onKey);
  paint();
  return true;
}
// ссылка ?open=progress[:psn|:xbox] — те же строки в своей шторке (ctx.con — сразу раскрыть консоль, только под ?sbmock)
export async function openProgress(ctx, game = 'gta6') {
  let host = document.getElementById('pg');
  if (!host) { host = document.createElement('div'); host.id = 'pg'; host.className = 'g-sheet pg-sheet'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); document.body.appendChild(host); }
  await mountRows(host, { ...ctx, open: ctx.con && consoleOn() ? 'con' : 'pct' }, game);
  sheet = host; paint(); host.hidden = false;
  C.event?.('progress_open', { from: ctx.from || '' });
  return true;
}
export function close() { if (sheet) sheet.hidden = true; if (resolver) { const r = resolver; resolver = null; r(null); } C?.onClose?.(); }

// ---------- строки ядра: registerPickRow (Решение Fable, js/guide-core.js pickPos) ----------
// ctx = {lang, I, platform: 'playstation'|'xbox' | () => …, haptic, event}. Строка «По проценту» — всегда, «Подтянуть с консоли» — только под ?sbmock.
// onTap открывает уточнение поверх «Где вы» и отдаёт ядру {m|c, via} после «Сохранить» (null — закрыли).
const rowHTML = (lang, b, sm) => `<span class="pg-tt"><b>${esc(b)}</b><small>${esc(sm)}</small></span>`;
const platOf = (ctx) => { const p = typeof ctx.platform === 'function' ? ctx.platform() : ctx.platform; return p === 'xbox' ? 'xbox' : 'psn'; };
const sx = (lang, k, v = {}) => { let x = (S[lang] || S.en)[k] ?? S.en[k]; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
export function registerRows(ctx) {
  registerPickRow({ id: 'progress-pct', html: (lang) => rowHTML(lang, sx(lang, 'pct'), sx(lang, 'pct_s')), onTap: (game) => ask(ctx, game, 'pct') });
  if (consoleOn()) registerPickRow({ id: 'progress-console', html: (lang) => rowHTML(lang, sx(lang, 'con', { p: sx(lang, platOf(ctx)) }), sx(lang, 'con_s')), onTap: (game) => ask(ctx, game, 'con') });
}
async function ask(ctx, game, open) {
  if (resolver) { const r = resolver; resolver = null; r(null); }
  await openProgress({ ...ctx, platform: typeof ctx.platform === 'function' ? ctx.platform() : ctx.platform, con: open === 'con', from: 'pick' }, game);
  if (open === 'pct') { V.open = 'pct'; paint(); }
  return new Promise((res) => { resolver = res; });
}
