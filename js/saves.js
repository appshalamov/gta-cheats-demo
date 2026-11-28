// «Не упустить навсегда» — справочник сохранений и точек невозврата (guide-saves, «Гид по игре»; «Решение Fable — система гида.md», 26.11.2026).
// Справочник, а не список дел: правила сохранений, «Как сохраняться» (PS5/Xbox) и «перед кодом» — экраном «По шагам» (js/guide.js),
// все точки невозврата по главам, «Всегда», трофеи, баги. Срочное отсюда показывает «Прохождение» (guide-walkthrough) янтарным блоком
// через nextWarn/savesFor, галочки дел — sb.gs (toggleDone). Позиция игрока — общий ключ sb.gp, отметку меняет общая шторка «Где вы»
// (window.SB.pickPos — guide-walkthrough / guide-core), своей шторки нет. Позиция, порядок миссий, спойлеры, «раскрыто» — ядро js/guide-core.js
// (pos, rankOf, canShow, reveal, setPos, loadBase); без отметки названий миссий нет вовсе (решение Fable: «Глава 2: дом и вещи»).
// Данные: data/guide/saves.json, миссии — data/guide/missions.json (путь в saves.json base).

const S = {
  ru: {
    title: 'Не упустить навсегда', close: 'Закрыть', share: 'Поделиться',
    lead: 'Миссии в GTA 6 не переиграть: повтора из меню нет. Назад — только через своё ручное сохранение. Здесь все точки невозврата и как сохраняться, чтобы не потерять часы игры.',
    where: 'Где вы', where_none: 'Отметьте, где вы в игре, — покажем, сколько осталось до ближайшей точки невозврата.', where_set: 'Глава {c}. После «{m}»',
    where_c: 'Начало главы {c}', change: 'Изменить', mark: 'Отметить, где я', still: 'Всё ещё после «{m}»?', yes: 'Да',
    soon: 'Через {n} точка невозврата: {l}', soon_0: 'Следующая миссия — точка невозврата: {l}', to_walk: 'Что сделать — в «Прохождении»',
    n_m: '{n} миссии|{n} миссию|{n} миссий',
    how_t: 'Сохраниться грамотно', how_btn: 'Как сохраняться на {p}', how_meta: '{n} шага, около {m} минут|{n} шаг, около {m} минут|{n} шагов, около {m} минут',
    code_btn: 'Как сохраниться перед кодом',
    pnr_t: 'Точки невозврата', ch: 'Глава {c}', hid: 'Название скрыто — открыть', passed: 'Пройдено',
    always: 'Всегда, в любой главе', trophies: 'Трофеи', bugs: 'Баги сохранений', next: 'Дальше',
    lv1: 'навсегда', lv2: 'можно вернуть', one: 'Один источник: {s}. Проверяем', dispute: 'Источники спорят', rumor: 'Слух, проверяем',
    chk: 'Проверено {d}, версия игры {v}', sources: 'Источники', report: 'Сообщить об ошибке', report_ok: 'Спасибо, проверим',
    nx_walk: 'Прохождение: что сделать до следующей миссии', nx_end: 'Концовки: сохранитесь до выбора', nx_egg: 'Угнать Bugatti по шагам',
    nx_eggs: 'Все пасхалки GTA 6', nx_codes: 'Коды GTA 6: деньги, оружие, сбросить розыск',
  },
  en: {
    title: "Don't miss it forever", close: 'Close', share: 'Share',
    lead: "You can't replay GTA 6 missions from a menu. The only way back is your own manual save. Here are all the points of no return and how to save so you don't lose hours.",
    where: 'Where you are', where_none: "Mark where you are in the game — we'll show how far the next point of no return is.", where_set: 'Chapter {c}. After “{m}”',
    where_c: 'Start of chapter {c}', change: 'Change', mark: 'Mark where I am', still: 'Still after “{m}”?', yes: 'Yes',
    soon: 'Point of no return in {n}: {l}', soon_0: 'Next mission is a point of no return — {l}', to_walk: 'What to do — in the Walkthrough',
    n_m: '{n} mission|{n} missions',
    how_t: 'Save the smart way', how_btn: 'How to save on {p}', how_meta: '{n} step, about {m} min|{n} steps, about {m} min',
    code_btn: 'How to save before a cheat',
    pnr_t: 'Points of no return', ch: 'Chapter {c}', hid: 'Name hidden — reveal', passed: 'Done',
    always: 'Any time, any chapter', trophies: 'Trophies', bugs: 'Save bugs', next: 'Next',
    lv1: 'permanent', lv2: 'recoverable', one: 'One source: {s}. Checking', dispute: 'Sources disagree', rumor: 'Rumour, checking',
    chk: 'Checked {d}, game version {v}', sources: 'Sources', report: 'Report a mistake', report_ok: "Thanks, we'll check",
    nx_walk: 'Walkthrough: what to do before your next mission', nx_end: 'Endings: save before the choice', nx_egg: 'Steal the Bugatti step by step',
    nx_eggs: 'All GTA 6 easter eggs', nx_codes: 'GTA 6 cheats: money, weapons, lose wanted level',
  },
};
const GP = 'sb.gp', GS = 'sb.gs', DAY = 864e5;
import { COVERS, topHTML, coverHTML, bindTop } from './hub-cover.js';   // обложка хаба и марка (решение Fable 28.11)
let C = null, D = null, layer = null, langK = 'ru', core = null;
const coreP = import('./guide-core.js').then((m) => (core = m)).catch(() => null);

const L = () => (langK === 'ru' ? 'ru' : 'en');
const s = (k, v = {}) => { let x = S[L()][k] ?? S.en[k] ?? k; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
function pl(k, n, v = {}) {   // формы: ru «2–4 | 1 | 5+», en «1 | много»
  const f = s(k, { n, ...v }).split('|');
  if (L() !== 'ru') return f[n === 1 ? 0 : 1] || f[0];
  const a = n % 10, b = n % 100;
  return (a === 1 && b !== 11 ? f[1] : a >= 2 && a <= 4 && (b < 12 || b > 14) ? f[0] : f[2]) || f[0];
}
const tx = (o) => (o ? o[L()] || o.en || o.ru || '' : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jget = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
const base = () => new URL('.', document.baseURI).href;
const bare = (id) => String(id || '').replace(/^[mc]:/, '');
const num = (c) => +String(c ?? '').replace(/\D/g, '') || 0;
const HOST = { 'powerpyx.com': 'PowerPyx', 'bloxodes.com': 'Bloxodes', 'videogameschronicle.com': 'VGC', 'gtabase.com': 'GTABase', 'kotaku.com': 'Kotaku',
  'dexerto.com': 'Dexerto', 'ibtimes.com.au': 'IBTimes', 'beebom.com': 'Beebom', 'game8.jp': 'Game8', 'ofzenandcomputing.com': 'Of Zen', 'playstation.com': 'PlayStation',
  'gamesradar.com': 'GamesRadar', 'learn.microsoft.com': 'Microsoft', 'cloudwards.net': 'Cloudwards', 'thewindowsclub.com': 'TheWindowsClub' };
const srcName = (u) => { try { const h = new URL(u).hostname.replace(/^www\./, ''); return HOST[h] || h; } catch { return ''; } };

// ── данные ──
const cache = {};
async function load(game) {
  if (cache[game]) return cache[game];
  await coreP;
  const get = (p) => fetch(base() + p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const d = await get('data/guide/saves.json');
  if (!d || d.game !== game) return (cache[game] = null);
  const b = d.base && core ? await core.loadBase(game) : null;   // база миссий guide-walkthrough (порядок, главы, sp)
  const list = (b?.m || []).map((x, i) => ({ id: x.id, i, ch: num(x.ch), t: x.t, sp: x.sp || 0 }));
  const mm = new Map(list.map((x) => [x.id, x]));
  return (cache[game] = { d, list, mm });
}

// позиция из ядра: i — номер в сюжете (миссия → её индекс, глава → начало главы, как rankOf ядра); -1 — нет отметки
function pos(x, game) {
  const g = core?.pos(game); if (!g || !(g.m || g.c)) return { i: -1, set: false };
  const i = core.rankOf(game, g.m || g.c), m = g.m ? x.mm.get(bare(g.m)) : null;
  return { i, m, c: num(g.c), at: g.at || 0, set: i >= 0, raw: g };
}
// название точки невозврата (правило Fable): без отметки — никогда (глава и вид потери); иначе canShow ядра по sp миссии,
// from — предыдущая миссия (следующая видна, дальше — по правилу), «раскрыто» — reveal ядра (sb.gr)
const recOf = (r, m, x) => ({ k: r.k, sp: m.sp, from: m.i > 0 ? 'm:' + x.list[m.i - 1].id : undefined });
function canShow(r, m, p, x) {
  if (!core) return false;
  const rec = recOf(r, m, x);
  const opened = (() => { try { return JSON.parse(localStorage.getItem('sb.gr') || '[]').includes(rec.k); } catch { return false; } })();
  if (opened) return true;
  if (!p.set) return false;
  return m.sp === 0 || m.i <= p.i || core.canShow(rec, C?.game || 'gta6').title;
}
const doneSet = (game) => new Set(jget(GS)[game] || []);
export function toggleDone(game, id) {
  const all = jget(GS), set = new Set(all[game] || []);
  set.has(id) ? set.delete(id) : set.add(id); all[game] = [...set]; jset(GS, all); return set.has(id);
}
// точки невозврата по порядку сюжета с миссией из базы (запись без миссии в базе не показывается: сборка указателя её остановит)
function pnrs(x, p) {
  return x.d.pnr.map((r) => ({ r, m: x.mm.get(r.m) })).filter((q) => q.m).sort((a, b) => a.m.i - b.m.i)
    .map((q) => ({ ...q, past: q.m.i <= p.i, ahead: q.m.i - p.i - 1 }));
}

// ── API для «Прохождения» (янтарный блок), Главной (строка состояния) и указателя ──
// ближайшая точка невозврата впереди: {id, m, ahead (миссий между), lt, t, items[{id,t,why,lvl,st,done}], k} или null
export async function nextWarn(game, lang) {
  if (lang) langK = lang;
  const x = await load(game); if (!x) return null;
  const p = pos(x, game); if (!p.set) return null;
  const q = pnrs(x, p).find((z) => !z.past); if (!q) return null;
  const dn = doneSet(game);
  return { id: q.r.id, m: q.m.id, ch: q.r.ch, ahead: q.ahead, d: q.ahead + 1, lt: q.r.lt, t: q.r.t, k: q.r.k, show: canShow(q.r, q.m, p, x),
    items: q.r.items.map((w) => ({ id: w.id, t: w.t, why: w.why, lvl: w.lvl, st: w.st, done: dn.has(w.id) })) };
}
// для экрана миссии: {miss, req} — подставить в how.miss / how.req, guide.js рисует сам
export async function savesFor(game, missionId) {
  const x = await load(game); if (!x) return null;
  const r = x.d.pnr.find((q) => q.m === bare(missionId)); if (!r) return null;
  return { miss: { ru: `${r.t.ru}. ${r.items.filter((w) => w.lvl === 1).map((w) => w.t.ru).join('. ')}`, en: `${r.t.en}. ${r.items.filter((w) => w.lvl === 1).map((w) => w.t.en).join('. ')}` },
    req: r.items.map((w) => ({ t: w.t })), items: r.items, k: r.k };
}
// объекты «По шагам» для «Как сохраняться» и «перед кодом» — для openKey и указателя
const SV_NX = {   // «Дальше» (решение Fable 28.11): как сохраняться → Прохождение → Концовки; перед кодом → точки невозврата → Прохождение
  how: [{ k: 'walk:gta6', t: { ru: 'Прохождение: что сейчас важно', en: 'Walkthrough: what matters now' }, sub: { ru: 'Дела до следующей миссии', en: 'Things to do before the next mission' } },
    { k: 'endings:gta6', t: { ru: 'Концовки: сохранитесь до выбора', en: 'Endings: save before the choice' }, sub: { ru: 'Какие выборы меняют финал', en: 'Which choices change the finale' } }],
  code: [{ k: 'saves:gta6:all', t: { ru: 'Все точки невозврата', en: 'All points of no return' }, sub: { ru: 'Что закрывается навсегда', en: 'What closes forever' } },
    { k: 'walk:gta6', t: { ru: 'Прохождение: что сейчас важно', en: 'Walkthrough: what matters now' }, sub: { ru: 'Дела до следующей миссии', en: 'Things to do before the next mission' } }],
};
const SV_FIN = { ru: 'Готово. Прогресс под защитой', en: 'Done. Your progress is safe' };
export async function howObj(game, which) {
  const x = await load(game); if (!x) return null;
  const h = x.d.save[which]; if (!h) return null;
  // st — статус источников для общей строки доверия (4 состояния, guide.js у eggs-community); пока guide.js его не знает, «спорят» сказано в rw
  // сторис (решение Fable 28.11): обложка хаба, затемнённая на карточках; короткие заголовки шагов hd ≤ 34 — в saves.json
  return { id: `saves-${which}`, game, k: 'reference', t: h.ta, st: h.ix?.st || 'ok', free: true, sn: [...new Set((h.src || []).map(srcName))], cv: COVERS.saves,
    nx: SV_NX[which === 'code' ? 'code' : 'how'],
    how: { vw: 'stories', ta: h.ta, rw: h.rw, sb: { ru: `Шагов: ${h.st.length}, около ${h.min} мин`, en: `${h.st.length} steps, about ${h.min} min` }, min: h.min, st: h.st, fin: SV_FIN } };
}

// ── экран ──
function css() {
  for (const [id, href] of [['guide-css', 'css/guide.css'], ['saves-css', 'css/saves.css']]) {
    if (document.getElementById(id)) continue;
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
}
const plat = () => (C.platform === 'xbox' ? 'xbox' : 'playstation');
const platName = () => (plat() === 'xbox' ? 'Xbox' : 'PS5');
function trust(w) {
  if (w.st === 'one') return `<span class="sv-st">${esc(s('one', { s: srcName((w.src || [])[0]) || '—' }))}</span>`;
  if (w.st === 'dispute') return `<span class="sv-st is-dis">${esc(s('dispute'))}</span>`;
  if (w.st === 'rumor') return `<span class="sv-st">${esc(s('rumor'))}</span>`;
  return '';
}
const wHTML = (w) => `<li class="sv-w${w.lvl === 1 ? ' is-l1' : ''}"><div class="sv-wb"><p class="sv-t">${esc(tx(w.t))}</p><p class="sv-why">${esc(tx(w.why))}</p>
  <p class="sv-lv">${esc(w.lvl === 1 ? s('lv1') : s('lv2'))}${trust(w)}</p></div></li>`;

function pnrHTML(q, p) {
  const { r, m } = q, open = canShow(r, m, p, D);
  const head = open ? `<h3 class="sv-h3">${esc(s('ch', { c: r.ch }))}. ${esc(tx(m.t))}${q.past ? `<small>${esc(s('passed'))}</small>` : ''}</h3>`
    : `<h3 class="sv-h3">${esc(s('ch', { c: r.ch }))}: ${esc(tx(r.lt))}</h3>`;
  if (!open) return `<div class="sv-pnr" data-id="${esc(r.id)}">${head}<button class="sv-sp" data-s="spoil" data-id="${esc(r.k)}">${C.I.eye}<span>${esc(s('hid'))}</span></button></div>`;
  return `<div class="sv-pnr${q.past ? ' is-past' : ''}" data-id="${esc(r.id)}">${head}<p class="sv-pt">${esc(tx(r.t))}</p><p class="sv-why">${esc(tx(r.why))}</p>
    <ul class="sv-list">${r.items.map(wHTML).join('')}</ul></div>`;
}

function render() {
  const { d } = D, I = C.I, game = C.game, p = pos(D, game), qs = pnrs(D, p);
  const soon = p.set ? qs.find((q) => !q.past && q.ahead + 1 <= 2) : null;   // как stateLine ядра: «через d миссий», d = до точки включительно
  const how = d.save[plat()], code = d.save.code;
  const stale = p.set && p.at && Date.now() - p.at > 3 * DAY && p.m;
  const whereTxt = p.m ? s('where_set', { c: p.m.ch, m: tx(p.m.t) }) : p.c ? s('where_c', { c: p.c }) : '';
  const nx = [
    window.SB?.openWalk ? ['walk', s('nx_walk')] : null,
    window.SB?.openEndings ? ['end', s('nx_end')] : null,
    ['egg', s('nx_egg')], ['eggs', s('nx_eggs')], ['codes', s('nx_codes')],
  ].filter(Boolean).slice(0, 3);
  const canPick = !!(window.SB?.pickPos || window.SB?.openWalk);
  layer.innerHTML = `<div class="g-scroll" id="sv-scroll">
    ${topHTML(`<button class="g-ib" data-s="close" aria-label="${esc(s('close'))}">${I.chevron}</button>`, `<button class="g-ib" data-s="share" aria-label="${esc(s('share'))}">${I.share}</button>`)}${coverHTML('saves', esc)}
    <h1 class="g-h1">${esc(s('title'))}</h1>
    <p class="g-rw">${esc(s('lead'))}</p>

    <section class="g-sec"><h2>${esc(s('where'))}</h2>
      ${p.set ? `<div class="sv-where"><p>${esc(whereTxt)}</p>${canPick ? `<button class="g-link" data-s="pick">${esc(s('change'))}</button>` : ''}</div>
        ${stale ? `<div class="sv-where sv-stale"><p>${esc(s('still', { m: tx(p.m.t) }))}</p><span><button class="g-link" data-s="still">${esc(s('yes'))}</button>${canPick ? `<button class="g-link" data-s="pick">${esc(s('change'))}</button>` : ''}</span></div>` : ''}`
        : `<p class="sv-p">${esc(s('where_none'))}</p>${canPick ? `<button class="g-link" data-s="pick">${I.pin}<span>${esc(s('mark'))}</span></button>` : ''}`}
      ${soon ? `<p class="g-miss sv-soon">${I.alert}<span>${esc(soon.ahead ? s('soon', { n: pl('n_m', soon.ahead + 1), l: tx(soon.r.lt) }) : s('soon_0', { l: tx(soon.r.lt) }))}</span></p>
        ${window.SB?.openWalk ? `<button class="g-link" data-s="nx" data-v="walk">${esc(s('to_walk'))}</button>` : ''}` : ''}
    </section>

    <section class="g-sec"><h2>${esc(s('how_t'))}</h2>
      <ol class="sv-rules">${d.rules.map((r) => `<li>${esc(tx(r))}</li>`).join('')}</ol>
      <button class="sv-how" data-s="how" data-v="${plat()}">${I[plat() === 'xbox' ? 'xbox' : 'ps']}<span><b>${esc(s('how_btn', { p: platName() }))}</b><small>${esc(pl('how_meta', how.st.length, { m: how.min }))}</small></span>${I.chevron}</button>
      ${code ? `<button class="sv-how" data-s="how" data-v="code" id="sv-code">${I.gamepad}<span><b>${esc(s('code_btn'))}</b><small>${esc(pl('how_meta', code.st.length, { m: code.min }))}</small></span>${I.chevron}</button>` : ''}
    </section>

    <section class="g-sec"><h2>${esc(s('pnr_t'))}</h2>${qs.map((q) => pnrHTML(q, p)).join('')}</section>
    <section class="g-sec"><h2>${esc(s('always'))}</h2><ul class="sv-list">${d.always.map(wHTML).join('')}</ul></section>
    <section class="g-sec"><h2>${esc(s('trophies'))}</h2><p class="sv-p">${esc(tx(d.trophies.t))}</p></section>
    <section class="g-sec"><h2>${esc(s('bugs'))}</h2><ul class="sv-bugs">${d.bugs.map((b) => `<li><b>${esc(tx(b.t))}</b><span>${esc(tx(b.fix))}</span>
      <small>${esc(s('chk', { d: C.date ? C.date(b.chk) : b.chk, v: b.v }))}${b.st === 'one' ? `. ${esc(s('one', { s: srcName(b.src[0]) }))}` : ''}</small></li>`).join('')}</ul></section>

    <section class="g-sec sv-next"><h2>${esc(s('next'))}</h2>
      ${nx.map(([a, t]) => `<button class="sv-nx" data-s="nx" data-v="${a}"><span>${esc(t)}</span>${I.chevron}</button>`).join('')}</section>

    <section class="g-sec g-foot">
      <p class="g-note">${esc(s('sources'))}: ${esc((d.sn || []).join(', '))}</p>
      <button class="g-link" data-s="report">${esc(s('report'))}</button>
    </section>
  </div>
  <footer class="g-bar"><button class="g-main" data-s="how" data-v="${plat()}">${esc(s('how_btn', { p: platName() }))}</button></footer>`;
}
function rerender() { const y = layer.querySelector('#sv-scroll')?.scrollTop || 0; render(); layer.querySelector('#sv-scroll').scrollTop = y; bindTop(layer); }

async function onClick(e) {
  const b = e.target.closest('[data-s]'); if (!b || !layer.contains(b)) return;
  const a = b.dataset.s, v = b.dataset.v;
  switch (a) {
    case 'close': closeSaves(false, 'close'); break;
    case 'share': C.share?.(); break;
    case 'pick': C.haptic?.(); if (window.SB?.pickPos) window.SB.pickPos(C.game, () => rerender()); else window.SB?.openWalk?.(); break;
    case 'still': { const g = core?.pos(C.game); if (g) core.setPos(C.game, { m: g.m, c: g.m ? undefined : g.c, via: 'self' }); rerender(); break; }
    case 'spoil': core?.reveal(b.dataset.id); rerender(); C.event?.('saves_spoil', { id: b.dataset.id }); break;
    case 'how': { const o = await howObj(C.game, v); if (o) C.openHow?.(o); C.event?.('saves_how', { v }); break; }
    case 'nx': C.event?.('saves_next', { v }); C.next?.(v); break;
    case 'report': C.toast?.(s('report_ok')); C.event?.('saves_report', {}); break;
  }
}

// key: all | <id точки невозврата> (прокрутить к ней) | playstation | xbox | code / before-code (сразу «По шагам»)
export async function openSaves(ctx, key = 'all') {
  C = ctx; langK = ctx.lang; css();
  D = await load(ctx.game); if (!D) return false;
  if (key === 'before-code') key = 'code';
  if (key === 'how') key = plat();   // saves:gta6:how — «Как сохраняться» для платформы пользователя (опись 28.11, п. 3)
  if (['playstation', 'xbox', 'code'].includes(key)) { const o = await howObj(ctx.game, key); if (o) { C.openHow?.(o); return true; } }
  layer = document.getElementById('saves');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'saves'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick);
  }
  render(); bindTop(layer);
  requestAnimationFrame(() => layer.classList.add('open'));
  document.documentElement.classList.add('guide-open');
  history.pushState({ saves: 1 }, '');
  if (key !== 'all') { const r = D.d.pnr.find((q) => q.id === key); if (r) core?.reveal(r.k); rerender(); requestAnimationFrame(() => { const el = layer.querySelector(`.sv-pnr[data-id="${CSS.escape(key)}"]`), sc = layer.querySelector('#sv-scroll');
    if (el && sc) sc.scrollTop = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 64; }); }
  C.event?.('saves_open', { from: ctx.from || '', key });
  return true;
}
export function closeSaves(fromPop = false, why = '') {
  if (!layer?.classList.contains('open')) return false;
  layer.classList.remove('open'); document.documentElement.classList.remove('guide-open');
  C?.onClose?.(fromPop ? 'pop' : why);   // стек серий в app.js: 'pop' — системное «Назад», 'close' — крестик хаба
  if (!fromPop && history.state?.saves) history.back();
  return true;
}
export const isOpen = () => !!layer?.classList.contains('open');
// закрыли инструкцию поверх хаба (крестик, «Готово», «Назад») — её history.back приводит на запись хаба {saves}: хаб остаётся (опись 28.11, п. 1)
addEventListener('popstate', () => { if (isOpen() && !history.state?.saves && !history.state?.guide) closeSaves(true); });
