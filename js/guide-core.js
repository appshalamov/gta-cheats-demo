// Ядро «Гида по игре» (26.11.2026, «Решение Fable — система гида.md», раздел 3). Одно на всё приложение:
//   pos / setPos   — позиция игрока sb.gp = {gta6: {m:'m:<id>' | null, c:'c<N>', via:'self'|'pct'|'psn'|'xbox', at, t}}
//   canShow        — одно правило спойлеров (sp 0/1/2 + from)
//   openKey        — одна таблица ключей ?open= (guide:, walk:, saves:, endings:, progress, set:, place:, egg:, db:)
//   nextFor        — «Дальше» (1–3 строки) по next[] записи указателя
//   stateLine      — строка состояния на Главной (до 2 строк, по старшинству)
//   pickPos        — шторка «Где вы» (главы → миссии + строки других модулей: «По проценту», «Подтянуть с консоли»)
// Указатель записей — data/guide/index-<игра>.json (tools/build_guide_index.py). База миссий — data/guide/missions.json (guide-walkthrough).
// Модуль без DOM-зависимостей, кроме pickPos (рисует в шторку, которую даёт приложение). Хозяин — сессия eggs-community (сборщик).

const GP = 'sb.gp', GR = 'sb.gr', GD = 'sb.gd';
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
};
const tx = (o, lang) => (o ? (typeof o === 'string' ? o : o[lang] || o.en || o.ru || '') : '');

// ── база миссий: порядок для сравнения позиций ──
const bases = {};      // game → {ch:[], m:[], rank:{'m:id': n}, chFirst:{c1: n}, byId:{}}
export function setBase(game, data) {
  if (!data) return;
  const ch = (data.ch || []).slice().sort((a, b) => a.n - b.n);
  const chN = Object.fromEntries(ch.map((c) => [c.id, c.n]));
  const m = (data.m || []).slice().sort((a, b) => (chN[a.ch] - chN[b.ch]) || (a.n - b.n));
  const rank = {}, chFirst = {}, byId = {};
  m.forEach((x, i) => { rank['m:' + x.id] = i; byId['m:' + x.id] = x; if (!(x.ch in chFirst)) chFirst[x.ch] = i; });
  bases[game] = { ch, m, rank, chFirst, byId, chN };
}
// data/guide/game.json — какие файлы гида есть у игры (has: {index, missions}); без него лишних запросов (404) не делаем
let metaP = null;
export function loadMeta() { return (metaP ||= fetch('data/guide/game.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))); }
const hasFile = async (game, f) => !!(await loadMeta())?.[game]?.has?.[f];
export async function loadBase(game) {
  if (bases[game]) return bases[game];
  if (!(await hasFile(game, 'missions'))) return null;
  try { const r = await fetch(`data/guide/missions.json`, { cache: 'no-cache' }); if (r.ok) { const d = await r.json(); if (!d.game || d.game === game) setBase(game, d); } } catch { }
  return bases[game] || null;
}
export const base = (game) => bases[game] || null;
// номер позиции в сюжете: миссия → её индекс; глава без миссии → начало главы; нет — -1
export function rankOf(game, ref) {
  const b = bases[game]; if (!b || !ref) return -1;
  if (ref.startsWith('m:')) return b.rank[ref] ?? -1;
  if (ref.startsWith('c')) return ref in b.chFirst ? b.chFirst[ref] - 1 : -1;   // «только начал главу» — до первой миссии главы (guide-walkthrough 26.11)
  return -1;
}

// ── позиция игрока ──
export function pos(game) { return (ls.get(GP, {})[game]) || null; }
const posRank = (game, p) => (p ? (p.m ? rankOf(game, p.m) : rankOf(game, p.c)) : -1);
// Правила (раздел 3): ручная отметка всегда последняя по силе, в том числе назад; процент и консоль двигают только вперёд
// и не затирают ручную отметку, которая дальше. Возвращает true, если позиция изменилась.
export function setPos(game, next) {
  if (!next || !(next.m || next.c)) return false;
  const all = ls.get(GP, {}), cur = all[game];
  const via = next.via || 'self';
  if (via !== 'self' && cur) {
    const a = posRank(game, cur), b = posRank(game, next);
    if (b >= 0 && a >= 0 && b <= a) return false;
  }
  all[game] = { m: next.m || null, c: next.c || (next.m && bases[game]?.byId[next.m]?.ch) || null, via, at: Date.now(), ...(next.t ? { t: next.t } : {}) };
  ls.set(GP, all);
  try { dispatchEvent(new CustomEvent('sb:gp', { detail: { game, pos: all[game] } })); } catch { }
  return true;
}
export const posStale = (game, days = 3) => { const p = pos(game); return !!p && Date.now() - (p.at || 0) > days * 864e5; };

// ── спойлеры ──
// запись: {k, sp:0|1|2, from:'m:id'|'c2'}. Возвращает {title, body}: можно ли показать название и суть.
export function canShow(rec, game = 'gta6') {
  const sp = rec?.sp || 0;
  if (!sp) return { title: true, body: true };
  const opened = (ls.get(GR, [])).includes(rec.k);
  const p = pos(game), reached = !rec.from || (p && posRank(game, p) >= rankOf(game, rec.from) && rankOf(game, rec.from) >= 0);
  const body = opened || !!reached;
  return { title: sp === 1 ? true : body, body };
}
export function reveal(k) { const s = new Set(ls.get(GR, [])); s.add(k); ls.set(GR, [...s]); }
// текст для поиска, превью ссылок и новостей: записи с sp ≥ 1 не отдаём (раздел 3)
export const searchable = (rec) => !(rec?.sp >= 1);

// ── ключи открытия ?open= ──
export const KEY_RE = /^(guide|walk|saves|endings|progress|set|place|egg|db)(:(gta6|gta5))?(:[\w.-]{1,120})?$/;
const openers = {};
export function registerOpener(prefix, fn) { openers[prefix] = fn; }
export const hasOpener = (prefix) => !!openers[prefix];   // кнопки saves:/endings: — только когда их модуль в сборке
export function parseOpen(key) {
  if (!KEY_RE.test(key || '')) return null;
  const [kind, game, ...rest] = key.split(':');
  return { kind, game: game || 'gta6', id: rest.join(':') || '' };
}
// возвращает true, если ключ открыт зарегистрированным модулем; иначе приложение откроет сам (place/egg/db → карта)
export function openKey(key, ctx = {}) {
  const k = parseOpen(key); if (!k) return false;
  const fn = openers[k.kind]; if (!fn) return false;
  fn(k, ctx); return true;
}

// ── указатель ──
const idx = {};
export async function loadIndex(game) {
  if (idx[game]) return idx[game];
  if (!(await hasFile(game, 'index'))) return (idx[game] = { items: [] });
  try { const r = await fetch(`data/guide/index-${game}.json`, { cache: 'no-cache' }); if (r.ok) idx[game] = await r.json(); } catch { }
  return idx[game] || { items: [] };
}
export const index = (game) => idx[game] || { items: [] };
export const recByKey = (game, k) => (idx[game]?.items || []).find((x) => x.k === k) || null;

// ── «Дальше» ──
// next[] записи → до 3 записей указателя, которые можно показать; пустые ключи и недоступное (спойлер без отметки) — мимо.
// Если next[] не хватило — добивает по правилу «тот же вид → то же место → настройки» (seriya-uderzhanie).
export function nextFor(rec, game = 'gta6', max = 3) {
  const items = idx[game]?.items || [];
  const seen = new Set([rec?.k]); const out = [];
  const push = (r) => { if (r && !seen.has(r.k) && canShow(r, game).title) { seen.add(r.k); out.push(r); } };
  (rec?.next || []).forEach((k) => push(items.find((x) => x.k === k) || (k.startsWith('place:') || k.startsWith('egg:') ? { k, t: null, kind: 'place' } : null)));
  if (out.length < max) items.filter((x) => x.kind === rec?.kind).forEach(push);
  if (out.length < max && rec?.place) items.filter((x) => x.place === rec.place).forEach(push);
  if (out.length < max) items.filter((x) => x.kind === 'set').forEach(push);
  return out.slice(0, max);
}

// ── строка состояния на Главной (раздел 1): до 2 строк по старшинству ──
// (1) точка невозврата ≤ 2 миссий — янтарная; (2) начатая инструкция — «Продолжить»; (3) отметка есть — «После «X»: N дел до «Y»»;
// (4) отметки нет — «Где вы в игре?». Вторая строка — только если одновременно (1) и (2).
const S = {
  ru: { warn: 'Через {n} {mis} точка невозврата: {t}', warn1: 'Следующая миссия — точка невозврата: {t}', cont: 'Продолжить: {t}, шаг {a} из {b}',
    after: 'После «{m}»: {n} {del} до «{y}»', afterNone: 'После «{m}»: срочного нет', where: 'Где вы в игре? Отметьте, покажем, что не упустить', mis: 'миссии|миссии|миссий', del: 'дело|дела|дел' },
  en: { warn: 'Point of no return in {n} {mis}: {t}', warn1: 'Next mission is a point of no return: {t}', cont: 'Continue: {t}, step {a} of {b}',
    after: 'After “{m}”: {n} {del} before “{y}”', afterNone: 'After “{m}”: nothing urgent', where: 'Where are you in the game? Mark it — we’ll show what not to miss', mis: 'mission|missions', del: 'thing to do|things to do' },
};
function plural(lang, n, forms) {
  const f = forms.split('|');
  if (lang === 'ru') { const a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2]; }
  return f[n === 1 ? 0 : 1];
}
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
export function stateLine(game = 'gta6', lang = 'ru') {
  const L = S[lang] || S.en, items = idx[game]?.items || [], p = pos(game), pr = posRank(game, p), b = bases[game];
  const mt = (ref) => tx(b?.byId[ref]?.t, lang) || '';
  const lines = [];
  // (1) ближайшая точка невозврата впереди
  let warn = null;
  if (pr >= 0) {
    for (const r of items) {
      if (r.kind !== 'warn' || r.lvl !== 1 || !r.until) continue;
      const d = rankOf(game, r.until) - pr;
      if (d >= 0 && d <= 2 && (!warn || d < warn.d)) warn = { r, d };
    }
  }
  if (warn) lines.push({ type: 'warn', k: warn.r.k, text: warn.d <= 1 ? fill(L.warn1, { t: tx(warn.r.t, lang) }) : fill(L.warn, { n: warn.d, mis: plural(lang, warn.d, L.mis), t: tx(warn.r.t, lang) }) });
  // (2) начатая инструкция (прогресс листа «По шагам» — sb.gd)
  const gd = ls.get(GD, {}); let started = null;
  for (const [key, v] of Object.entries(gd)) {
    const [g, id] = key.split(':'); if (g !== game || !v || (!v.s && !(v.d || []).length)) continue;
    const r = items.find((x) => x.k === `guide:${game}:${id}`); if (!r || !r.steps_n) continue;
    const done = (v.d || []).length; if (done >= r.steps_n) continue;
    if (!started || (v.at || 0) > started.at) started = { r, a: done + 1, at: v.at || 0 };
  }
  if (started) lines.push({ type: 'cont', k: started.r.k, text: fill(L.cont, { t: tx(started.r.t, lang), a: started.a, b: started.r.steps_n }) });
  if (lines.length === 2) return lines;
  if (lines.length === 1) return lines.slice(0, 1);
  // (3) отметка есть: дела, открытые после позиции и действующие до следующей точки
  if (p && pr >= 0) {
    const open = items.filter((r) => (r.kind === 'tip' || r.kind === 'warn') && (!r.from || rankOf(game, r.from) <= pr) && (!r.until || rankOf(game, r.until) > pr));   // until строго впереди: пройденные не считаем
    const until = open.map((r) => r.until).filter(Boolean).sort((x, y) => rankOf(game, x) - rankOf(game, y))[0];
    const here = p.m ? mt(p.m) : tx(b?.ch.find((c) => c.id === p.c)?.t, lang);
    if (open.length && until) return [{ type: 'after', k: `walk:${game}`, text: fill(L.after, { m: here, n: open.length, del: plural(lang, open.length, L.del), y: mt(until) }) }];
    return [{ type: 'after', k: `walk:${game}`, text: fill(L.afterNone, { m: here }) }];
  }
  // (4) отметки нет
  return [{ type: 'where', k: 'progress', text: L.where }];
}

// ── шторка «Где вы» (одна на приложение; строки других модулей добавляются через registerPickRow) ──
const pickRows = [];   // {id, html(lang) → строка, onTap(game) → Promise<pos|null>}
export function registerPickRow(row) { if (!pickRows.find((r) => r.id === row.id)) pickRows.push(row); }
export const pickRowsList = () => pickRows;
// общая шторка «Где вы» — у guide-walkthrough (#gpos, z 46, своя запись истории): если зарегистрирована, pickPos отдаёт работу ей
let sheetImpl = null;
export const registerPickSheet = (fn) => { sheetImpl = fn; };
const PS = {
  ru: { title: 'Где вы в игре?', sub: 'Отметьте последнюю пройденную миссию — покажем, что не упустить. Можно вернуться назад.', ch: 'Глава {n}', chOnly: 'Только начал главу', cur: 'вы здесь' },
  en: { title: 'Where are you in the game?', sub: 'Mark the last mission you finished — we’ll show what not to miss. You can go back.', ch: 'Chapter {n}', chOnly: 'Just started this chapter', cur: 'you are here' },
};
// ctx: {openSheet(html, cls), closeSheet(), lang, esc}. Возвращает Promise<{m|c}|null>
export function pickPos(game, ctx) {
  if (sheetImpl) return sheetImpl(game, ctx);
  const b = bases[game], lang = ctx.lang in PS ? ctx.lang : 'en', T = PS[lang], esc = ctx.esc || ((x) => String(x));
  if (!b) return Promise.resolve(null);
  const p = pos(game);
  return new Promise((resolve) => {
    const rows = pickRows.map((r) => `<button class="g-pk-row" data-gpk="row" data-id="${esc(r.id)}">${r.html(lang)}</button>`).join('');
    const chs = b.ch.map((c) => `<details class="g-pk-ch"${p?.c === c.id ? ' open' : ''}><summary><b>${esc(fill(T.ch, { n: c.n }))}</b> ${esc(tx(c.t, lang))}</summary>
      <button class="g-pk-m" data-gpk="c" data-v="${esc(c.id)}">${esc(T.chOnly)}</button>
      ${b.m.filter((m) => m.ch === c.id && (m.k === 'main' || !m.k)).map((m) => `<button class="g-pk-m${p?.m === 'm:' + m.id ? ' on' : ''}" data-gpk="m" data-v="m:${esc(m.id)}">${esc(tx(m.t, lang))}${p?.m === 'm:' + m.id ? `<small>${esc(T.cur)}</small>` : ''}</button>`).join('')}
    </details>`).join('');
    ctx.openSheet(`<div class="g-pick"><h2>${esc(T.title)}</h2><p>${esc(T.sub)}</p>${rows}${chs}</div>`, 'g-pick-sheet');
    const host = document.querySelector('.g-pick');
    const done = (v) => { host?.removeEventListener('click', onTap); resolve(v); };
    async function onTap(e) {
      const el = e.target.closest('[data-gpk]'); if (!el) return;
      const t = el.dataset.gpk;
      if (t === 'row') { const r = pickRows.find((x) => x.id === el.dataset.id); const v = r ? await r.onTap(game) : null; if (v) { setPos(game, v); ctx.closeSheet(); done(v); } return; }
      const v = t === 'm' ? { m: el.dataset.v, via: 'self' } : { c: el.dataset.v, via: 'self' };
      setPos(game, v); ctx.closeSheet(); done(v);
    }
    host?.addEventListener('click', onTap);
  });
}
