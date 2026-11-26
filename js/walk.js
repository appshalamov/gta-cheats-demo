// «Прохождение» — лента по прогрессу (26.11.2026, «Гид по игре», функция guide-walkthrough). Решение — «Гид по игре — система (26.11.2026)/
// Решение Fable — система гида.md»: шаблон «лента по прогрессу» (Где вы → срочное → список → Дальше), подсказка открывается листом «По шагам».
// Здесь же — общая для всего приложения шторка «Где вы в игре» pickPos() и база миссий GTA 6 (data/guide/missions.json, хозяин — эта функция).
// Прогресс — sb.gp = {gta6: {m:'m:<id>' | c:'c<N>', via:'self'|'pct'|'psn'|'xbox', at, t:{ru,en}}}. Правила (Fable, раздел 3): ручная отметка
// сильнее всего, в том числе назад; консоль и процент двигают только вперёд. Когда придёт js/guide-core.js — pos/setPos/canShow берём оттуда.
// Строка на Главной — core.stateLine() по указателю (подсказки этой функции — data/guide/entries-walk-gta6.json, tools/build_guide.py).
// Срочное у точки невозврата: свои подсказки miss + saves.js (nextWarn, savesFor), если ctx.saves подключён (ветка guide-saves).

import * as core from './guide-core.js';   // ядро гида (eggs-community): pos/setPos по правилам sb.gp, база миссий, строки шторки
import { I as ICONS } from './icons.js';

const S = {
  ru: {
    title: 'Прохождение', sub: 'Что сделать перед следующими миссиями. Дальше вашего места ничего не раскрываем.',
    where: 'Где вы в игре', last: 'Последняя пройденная', none: 'Ещё ничего не прошли', change: 'Изменить', set: 'Отметить, где я',
    set_sub: 'Отметьте последнюю пройденную миссию: покажем, что важно сделать до следующих.',
    stale: 'Всё ещё после «{m}»?', yes: 'Да', g_perm: 'Навсегда', g_next: 'До следующей миссии', g_any: 'Когда удобно', more_n: 'Ещё {n}',
    now0: 'Сейчас ничего не упустите. Проходите дальше.', until: 'До миссии «{m}»', until_any: 'В любой момент', until_ch: 'До конца главы {n}',
    during: 'Во время миссии «{m}»', missable: 'Можно упустить навсегда', steps: '{n} из {m} сделано', one: 'Один источник: {s}. Проверяем',
    next: 'Следующая миссия', hidden: 'Название скрыто, чтобы не было спойлера', show: 'Открыть название', passed: 'Прошёл «{m}»', passed0: 'Прошёл эту миссию',
    later: 'Ещё {n} подсказок откроются дальше по сюжету', marked: 'Отмечено. Новых подсказок: {n}',
    amb2: 'Через 2 миссии точка невозврата', amb1: 'Следующая миссия — точка невозврата', amb_do: 'Сделайте до неё: {n}',
    pnr_next: 'Точка невозврата. Сначала сохранитесь', how_save: 'Как сохраняться',
    start: 'Только начинаю', ch: 'Глава {n}', ch_soon: 'Миссии этой главы добавим после проверки по двум источникам', ch_here: 'Я в начале этой главы',
    via_psn: 'По трофеям PlayStation', via_xbox: 'По достижениям Xbox', via_pct: 'По проценту из игры',
    more: 'Дальше', on_map: 'На карте: {p}', on_map_s: 'Где это в игре и в жизни', eggs: 'Пасхалки по шагам', eggs_s: 'Секретные машины и находки сообщества',
    codes: 'Коды для GTA 6', codes_s: 'Деньги, оружие, машины', end: 'Концовки: что влияет', end_s: 'Какие выборы меняют финал', src: 'Источники: {s}', close: 'Закрыть',
    fin: 'Вы прошли всё, что есть в гиде.',
    st_pnr: 'Через {n} миссии точка невозврата: {k} дел', st_pnr1: 'Следующая миссия — точка невозврата: {k} дел', st_mark: 'После «{m}»: {k} дел до «{x}»',
    st_mark0: 'После «{m}»: что сделать до следующих миссий', st_none: 'Где вы в игре? Отметьте, покажем, что не упустить',
  },
  en: {
    title: 'Walkthrough', sub: 'What to do before your next missions. Nothing past your point is revealed.',
    where: 'Where you are', last: 'Last completed', none: 'Nothing completed yet', change: 'Change', set: 'Mark where I am',
    set_sub: 'Mark the last mission you finished and we will show what to do before the next ones.',
    stale: 'Still after “{m}”?', yes: 'Yes', g_perm: 'Gone for good', g_next: 'Before the next mission', g_any: 'Whenever you like', more_n: '{n} more',
    now0: 'Nothing to miss right now. Keep playing.', until: 'Before “{m}”', until_any: 'Any time', until_ch: 'Before the end of Chapter {n}',
    during: 'During “{m}”', missable: 'Missable', steps: '{n} of {m} done', one: 'Single source: {s}. Checking',
    next: 'Next mission', hidden: 'Title hidden to avoid spoilers', show: 'Show title', passed: 'Finished “{m}”', passed0: 'Finished this mission',
    later: '{n} more tips unlock later in the story', marked: 'Saved. New tips: {n}',
    amb2: 'Point of no return in 2 missions', amb1: 'Next mission is a point of no return', amb_do: 'Do before it: {n}',
    pnr_next: 'Point of no return. Save first', how_save: 'How to save',
    start: 'Just starting', ch: 'Chapter {n}', ch_soon: 'Missions of this chapter will be added once checked by two sources', ch_here: "I'm at the start of this chapter",
    via_psn: 'From PlayStation trophies', via_xbox: 'From Xbox achievements', via_pct: 'From the in-game percentage',
    more: 'Next up', on_map: 'On the map: {p}', on_map_s: 'Where it is in the game and in real life', eggs: 'Easter eggs step by step', eggs_s: 'Secret cars and community finds',
    codes: 'GTA 6 cheats', codes_s: 'Money, weapons, vehicles', end: 'Endings: what matters', end_s: 'Which choices change the finale', src: 'Sources: {s}', close: 'Close',
    fin: 'You have finished everything in the guide.',
    st_pnr: 'Point of no return in {n} missions: {k} to do', st_pnr1: 'Next mission is a point of no return: {k} to do', st_mark: 'After “{m}”: {k} to do before “{x}”',
    st_mark0: 'After “{m}”: what to do before your next missions', st_none: "Where are you in the game? Mark it and we'll show what not to miss",
  },
};
const STALE = 3 * 864e5;
let C = null, D = null, layer = null, reveal = false, openAny = false, moreNext = false;

const lgOf = (lg) => (S[lg] ? lg : 'en');
const s = (k, v = {}, lg = C?.lang) => { let x = S[lgOf(lg)][k] ?? S.en[k] ?? k; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
const tx = (o, lg = C?.lang) => (o ? o[lg] || o.en || o.ru || '' : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── данные ──
const LOADS = {};
export function loadGuide(game = 'gta6') {
  if (D?.game === game) return Promise.resolve(D);
  return (LOADS[game] ||= (async () => {
    const r = await fetch(new URL('data/guide/missions.json', document.baseURI).href, { cache: 'no-cache' }).catch(() => null);
    if (!r?.ok) { delete LOADS[game]; return null; }
    const d = await r.json(); if (d.game !== game) return null;
    const chN = Object.fromEntries(d.ch.map((c) => [c.id, c.n]));
    d.order = d.m.filter((m) => m.k === 'main').sort((a, b) => chN[a.ch] - chN[b.ch] || a.n - b.n);
    d.pos = Object.fromEntries(d.order.map((m, i) => [`m:${m.id}`, i]));
    d.mid = Object.fromEntries(d.m.map((m) => [`m:${m.id}`, m]));
    d.chStart = {};   // отметка главы без миссии = начало главы: позиция последней миссии предыдущих глав
    d.ch.forEach((c) => { d.chStart[c.id] = d.order.filter((m) => chN[m.ch] < c.n).length - 1; });
    core.setBase(game, d);   // порядок миссий для ядра (stateLine, canShow, setPos)
    D = d; return d;
  })());
}
export function getProg(game = 'gta6') { return core.pos(game); }
// позиция игрока: индекс последней пройденной основной миссии (-1 — ничего не прошёл; null — не отмечал)
export function stage(d = D, p = getProg(d?.game)) {
  if (!d || !p) return null;
  if (p.m && d.pos[p.m] != null) return d.pos[p.m];
  if (p.c && d.chStart[p.c] != null) return d.chStart[p.c];
  return -1;
}
// запись позиции по правилам Fable: ручная (self) — всегда; консоль и процент — только вперёд
// «Только начинаю» = начало главы 1 ({c:'c1'}); для своей ленты глава без миссии = ничего из неё не пройдено (stage → chStart)
export function setProg(game, p) { return core.setPos(game, p && (p.m || p.c) ? p : { c: 'c1', via: (p && p.via) || 'self' }); }
const posOf = (ref) => (ref && D.pos[ref] != null ? D.pos[ref] : null);
// подсказка видна, когда миссия from пройдена, а until ещё нет (until null — до конца игры)
export function activeTips(st, d = D) {
  if (st == null) return [];
  return d.tips.filter((t) => { const f = t.from ? d.pos[t.from] ?? Infinity : -1, u = t.until ? d.pos[t.until] ?? Infinity : Infinity; return f <= st && st < u; })
    .sort((a, b) => (b.miss ? 1 : 0) - (a.miss ? 1 : 0) || (d.pos[a.until] ?? 1e9) - (d.pos[b.until] ?? 1e9));
}
const laterTips = (st) => D.tips.filter((t) => (t.from ? D.pos[t.from] ?? Infinity : -1) > (st ?? -1)).length;
// ближайшая точка невозврата не дальше 2 миссий: {m, ahead (1 — следующая), tips (свои «навсегда» до неё)}
export function nearPnr(st, d = D) {
  if (st == null) return null;
  for (let k = 1; k <= 2; k++) {
    const m = d.order[st + k]; if (!m?.pnr) continue;
    const ref = `m:${m.id}`, p = d.pos[ref];
    return { m, ref, ahead: k, tips: activeTips(st, d).filter((t) => t.miss && (d.pos[t.until] ?? Infinity) <= p) };
  }
  return null;
}
function css() {
  for (const [id, href] of [['guide-css', 'css/guide.css'], ['walk-css', 'css/walk.css']]) {
    if (document.getElementById(id)) continue;
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
}

// ── общая шторка «Где вы в игре» (одна на приложение: прохождение, справочник, концовки, прогресс с консоли) ──
// pickPos(ctx {lang, I, haptic?, event?}, game, {extra: [{id, t:{ru,en}, sub?:{ru,en}, on: () => void}], onDone(prog)}) → Promise<prog|null>
let P = null;   // открытая шторка
export async function pickPos(ctx, game = 'gta6', opts = {}) {
  css();
  const d = await loadGuide(game); if (!d) return null;
  try { await window.SB?.registerProgressRows?.(); } catch { }   // строки guide-progress регистрируются в ядре лениво — до отрисовки
  closePick();
  const lg = ctx.lang, I = ctx.I || ICONS, p = getProg(game);
  const cur = p?.m || (p?.c ? '' : p ? 'start' : ''), sel = p?.m ? d.mid[p.m]?.ch : p?.c || 'c1';
  let open = sel;
  const el = document.createElement('div'); el.id = 'gpos'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  const selN = d.ch.find((c) => c.id === sel)?.n || 1;
  const html = () => `<div class="gp-bg" data-p="close"></div><div class="g-sheet gp-sheet"><div class="g-sh-in">
    <div class="g-sh-top"><b>${esc(s('where', {}, lg))}</b><button class="g-ib" data-p="close" aria-label="${esc(s('close', {}, lg))}">${I.close}</button></div>
    ${(core.pickRowsList?.() || []).map((r) => `<button class="w-opt gp-x" data-p="row" data-id="${esc(r.id)}"><span>${r.html(lg)}</span>${I.chevron}</button>`).join('')}
    ${(opts.extra || []).map((x) => `<button class="w-opt gp-x" data-p="x" data-id="${esc(x.id)}"><span>${esc(tx(x.t, lg))}${x.sub ? `<small>${esc(tx(x.sub, lg))}</small>` : ''}</span>${I.chevron}</button>`).join('')}
    <button class="w-opt${cur === 'start' ? ' on' : ''}" data-p="set" data-m=""><span>${esc(s('start', {}, lg))}</span>${I.check}</button>
    ${d.ch.map((c) => {
      const ms = d.order.filter((m) => m.ch === c.id), o = open === c.id;
      // название главы видно у текущей и пройденных; у следующих — только номер, пока не откроете
      return `<div class="w-ch${o ? ' open' : ''}"><button class="w-chh" data-p="ch" data-c="${c.id}" aria-expanded="${o}">
        <span class="w-tt"><b>${esc(s('ch', { n: c.n }, lg))}${o || c.n <= selN ? `. ${esc(tx(c.t, lg))}` : ''}</b>${ms.length ? `<small>${ms.length}</small>` : ''}</span><i class="w-chev">${I.chevron}</i></button>
        ${o ? `${ms.some((m) => m.o) || c.n <= 2 ? '' : `<p class="g-note">${esc(s('ch_soon', {}, lg))}</p>`}
          <button class="w-opt${p?.c === c.id ? ' on' : ''}" data-p="setc" data-c="${c.id}"><span>${esc(s('ch_here', {}, lg))}</span>${I.check}</button>
          <ol class="w-ms">${ms.map((m) => `<li><button class="w-opt${cur === `m:${m.id}` ? ' on' : ''}" data-p="set" data-m="m:${m.id}"><span><em>${m.n}</em>${esc(tx(m.t, lg))}</span>${I.check}</button></li>`).join('')}</ol>` : ''}</div>`;
    }).join('')}</div></div>`;
  const saved = () => { const got = getProg(game); P = null; el.classList.remove('open'); setTimeout(() => el.remove(), 300); if (history.state?.gpos) history.back(); opts.onDone?.(got); P0?.(got); };
  let P0 = null;
  el.innerHTML = html(); document.body.appendChild(el);
  history.pushState({ gpos: 1 }, '');   // «назад» закрывает шторку, а не экран под ней
  requestAnimationFrame(() => el.classList.add('open'));
  return new Promise((res) => {
    P = { el, res }; P0 = res;
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const a = b.dataset.p;
      if (a === 'close') { closePick(); return; }
      if (a === 'ch') { open = open === b.dataset.c ? '' : b.dataset.c; const y = el.querySelector('.g-sheet').scrollTop; el.innerHTML = html(); el.querySelector('.g-sheet').scrollTop = y; return; }
      if (a === 'row') {   // строка модуля (guide-progress: «По проценту», «С консоли») — свой ввод, потом позиция в ядро
        const r = (core.pickRowsList?.() || []).find((q) => q.id === b.dataset.id); const v = r ? await r.onTap(game) : null;
        if (v) { core.setPos(game, v); saved(); } return;
      }
      if (a === 'x') { const x = (opts.extra || []).find((q) => q.id === b.dataset.id); closePick(); x?.on?.(); return; }
      const ref = a === 'set' ? b.dataset.m || null : null, c = a === 'setc' ? b.dataset.c : null;
      const t = ref ? d.mid[ref].t : c ? { ru: s('ch', { n: d.ch.find((q) => q.id === c).n }, 'ru'), en: s('ch', { n: d.ch.find((q) => q.id === c).n }, 'en') } : null;
      const np = ref ? { m: ref, via: 'self', t } : c ? { c, via: 'self', t } : { m: null, via: 'self' };
      setProg(game, np); ctx.haptic?.(); ctx.event?.('walk_mark', { m: ref || c || 'start' });
      const got = getProg(game); P = null; el.classList.remove('open'); setTimeout(() => el.remove(), 300); if (history.state?.gpos) history.back();
      opts.onDone?.(got); res(got);
    });
  });
}
export function closePick(fromPop = false) {
  if (!P) return false; const { el, res } = P; P = null; el.classList.remove('open'); setTimeout(() => el.remove(), 300); res(null);
  if (!fromPop && history.state?.gpos) history.back();
  return true;
}

// ── экран ──
const mTitle = (m) => tx(m.t);
const chOf = (m) => D.ch.find((c) => c.id === m.ch);
function whenOf(t) {
  const u = t.until ? D.mid[t.until] : null;
  // срок «до первой миссии следующей главы» = «до конца главы»: название следующей главы не раскрываем
  const chEnd = u && u.n === 1 && !t.dur ? D.ch.find((c) => c.id === u.ch) : null;
  return !u ? s('until_any') : chEnd ? s('until_ch', { n: chEnd.n - 1 }) : t.dur ? s('during', { m: mTitle(u) }) : s('until', { m: mTitle(u) });
}
function tipRow(t) {
  const n = t.how?.st?.length || 0, d = C.done?.({ game: D.game, id: `walk-${t.id}`, how: t.how }) || 0;
  const when = whenOf(t);
  return `<button class="w-tip${t.miss ? ' is-miss' : ''}" data-w="tip" data-id="${esc(t.id)}">
    <span class="w-tt"><b>${esc(tx(t.t))}</b><small>${esc(tx(t.rw))}</small>
      <small class="w-when">${t.miss ? `<span class="w-mi">${C.I.alert}${esc(s('missable'))}. ${esc(when)}</span>` : `<span>${esc(when)}</span>`}${n && d ? `<span class="w-dn">${esc(s('steps', { n: Math.floor(d), m: n }))}</span>` : ''}</small>
      ${t.st === 'one' ? `<small class="w-one">${esc(s('one', { s: (t.s || []).map((k) => D.src[k]?.n).filter(Boolean)[0] || '' }))}</small>` : ''}</span>
    <i class="w-chev">${C.I.chevron}</i></button>`;
}
// «Сделать сейчас» — три группы (Fable, раздел 2): «Навсегда» целиком, «До следующей миссии» 2 строки и «Ещё N», «Когда удобно» свёрнуто
function groupsHTML(tips, next) {
  const nref = next ? `m:${next.id}` : null;
  const perm = tips.filter((t) => t.miss), rest = tips.filter((t) => !t.miss);
  const soon = rest.filter((t) => t.until && t.until === nref), any = rest.filter((t) => !soon.includes(t));
  const shown = moreNext ? soon : soon.slice(0, 2);
  return `${perm.length ? `<h3 class="w-gh w-gh-perm">${esc(s('g_perm'))}</h3><div class="w-tips">${perm.map(tipRow).join('')}</div>` : ''}
    ${soon.length ? `<h3 class="w-gh">${esc(s('g_next'))}</h3><div class="w-tips">${shown.map(tipRow).join('')}</div>
      ${soon.length > shown.length ? `<button class="g-link w-more-n" data-w="more">${esc(s('more_n', { n: soon.length - shown.length }))}</button>` : ''}` : ''}
    ${any.length ? `<details class="w-any"${openAny ? ' open' : ''}><summary data-w="any"><h3 class="w-gh">${esc(s('g_any'))}</h3><small>${any.length}</small><i class="w-chev">${C.I.chevron}</i></summary>
      <div class="w-tips">${any.map(tipRow).join('')}</div></details>` : ''}`;
}
// янтарный блок у точки невозврата: свои «навсегда» до неё + предупреждения справочника (saves.js), без названия, если до неё 2 миссии
function amberHTML(near, ext) {
  const I = C.I, items = [...near.tips.map((t) => tx(t.t)), ...(ext || [])].filter((x, i, a) => x && a.indexOf(x) === i);
  const head = near.ahead === 1 ? s('amb1') : s('amb2');
  return `<section class="w-amb" role="note"><p class="w-amb-h">${I.alert}<span>${esc(head)}${near.ahead === 1 && near.m.sp < 2 ? `: «${esc(mTitle(near.m))}»` : ''}</span></p>
    <p class="w-amb-t">${esc(tx(near.m.pnr))}</p>
    ${items.length ? `<p class="w-amb-t">${esc(s('amb_do', { n: items.length }))}</p><ul class="w-amb-l">${items.slice(0, 4).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${C.can?.('saves:gta6:how') ? `<button class="g-link" data-w="save">${I.doc}<span>${esc(s('how_save'))}</span></button>` : ''}</section>`;
}
let EXT = null;   // предупреждения справочника для текущей точки невозврата (подгружаются асинхронно)
function render() {
  const I = C.I, p = getProg(D.game), st = stage(D, p), last = st != null && st >= 0 ? D.order[st] : null;
  const next = st == null ? null : D.order[st + 1] || null, tips = activeTips(st), later = laterTips(st);
  const ch = next ? chOf(next) : last ? chOf(last) : D.ch[0], near = nearPnr(st);
  const via = p?.via === 'psn' ? s('via_psn') : p?.via === 'xbox' ? s('via_xbox') : p?.via === 'pct' ? s('via_pct') : '';
  const stale = p && last && p.at && Date.now() - p.at > STALE;
  const pl = next?.pl ? tx(next.pln) : '';
  const fork = next && ['hey-arnold', 'safe-word'].includes(next.id) && C.can?.('endings:gta6');
  layer.innerHTML = `<div class="g-scroll" id="w-scroll">
    <header class="g-top"><button class="g-ib" data-w="close" aria-label="${esc(s('close'))}">${I.chevron}</button></header>
    <h1 class="g-h1">${esc(s('title'))}</h1>
    <p class="g-meta">${esc(s('sub'))}</p>
    <section class="w-where">
      ${st == null ? `<p class="w-set-sub">${esc(s('set_sub'))}</p><button class="g-main w-set" data-w="pick">${esc(s('set'))}</button>`
      : `<button class="w-pos" data-w="pick"><span class="w-tt"><small>${esc(ch ? `${s('ch', { n: ch.n })}. ${tx(ch.t)}` : '')}</small>
          <b>${esc(last ? mTitle(last) : p?.c ? s('ch', { n: ch.n }) : s('none'))}</b><small>${esc(last ? s('last') : '')}${via ? `${last ? '. ' : ''}${esc(via)}` : ''}</small></span>
          <span class="w-chg">${esc(s('change'))}</span></button>
        ${stale ? `<p class="w-stale"><span>${esc(s('stale', { m: mTitle(last) }))}</span><button class="g-link" data-w="fresh">${esc(s('yes'))}</button><button class="g-link" data-w="pick">${esc(s('change'))}</button></p>` : ''}`}
    </section>
    ${near ? amberHTML(near, EXT) : ''}
    ${st != null ? `<section class="g-sec w-now">${tips.length ? groupsHTML(tips, next) : `<p class="g-meta">${esc(s('now0'))}</p>`}
      ${later ? `<p class="g-note w-later">${esc(s('later', { n: later }))}</p>` : ''}</section>` : ''}
    ${next ? `<section class="g-sec w-next"><h2>${esc(s('next'))}</h2>
      ${next.sp >= 2 && !reveal ? `<p class="w-nt w-hid">${esc(s('hidden'))}</p><button class="g-link" data-w="reveal">${I.eye}<span>${esc(s('show'))}</span></button>`
      : `<p class="w-nt">${esc(mTitle(next))}</p>`}
      ${next.o && (next.sp < 2 || reveal) ? `<p class="w-no">${esc(tx(next.o))}</p>` : ''}
      ${next.pnr ? `<p class="g-trap w-pnr">${I.alert}<span>${esc(s('pnr_next'))}</span></p>${C.can?.('saves:gta6:how') ? `<button class="g-link" data-w="save">${I.doc}<span>${esc(s('how_save'))}</span></button>` : ''}` : ''}
      ${next.timed ? `<p class="g-trap">${esc(tx(next.timed))}</p>` : ''}
      <button class="g-main w-pass" data-w="pass">${I.check}<span>${esc(next.sp >= 2 && !reveal ? s('passed0') : s('passed', { m: mTitle(next) }))}</span></button>
    </section>` : st != null && st >= D.order.length - 1 ? `<p class="g-fin">${I.check}<span>${esc(s('fin'))}</span></p>` : ''}
    ${st != null ? `<section class="g-sec w-more"><h2>${esc(s('more'))}</h2>
      ${pl ? `<button class="w-row" data-w="map" data-k="${esc(next.pl)}"><span class="w-ic">${I.pin}</span><span class="w-tt"><b>${esc(s('on_map', { p: pl }))}</b><small>${esc(s('on_map_s'))}</small></span><i class="w-chev">${I.chevron}</i></button>` : ''}
      ${fork ? `<button class="w-row" data-w="key" data-k="endings:gta6"><span class="w-ic">${I.star}</span><span class="w-tt"><b>${esc(s('end'))}</b><small>${esc(s('end_s'))}</small></span><i class="w-chev">${I.chevron}</i></button>` : ''}
      <button class="w-row" data-w="eggs"><span class="w-ic">${I.egg}</span><span class="w-tt"><b>${esc(s('eggs'))}</b><small>${esc(s('eggs_s'))}</small></span><i class="w-chev">${I.chevron}</i></button>
      ${pl || fork ? '' : `<button class="w-row" data-w="codes"><span class="w-ic">${I.gamepad}</span><span class="w-tt"><b>${esc(s('codes'))}</b><small>${esc(s('codes_s'))}</small></span><i class="w-chev">${I.chevron}</i></button>`}
    </section>
    <p class="g-note w-src">${esc(s('src', { s: Object.values(D.src).slice(0, 8).map((x) => x.n).join(', ') }))}</p>` : ''}
    <div class="g-pad"></div>
  </div>`;
}
const rerender = () => { const y = layer.querySelector('#w-scroll')?.scrollTop || 0; render(); layer.querySelector('#w-scroll').scrollTop = y; };
// предупреждения справочника у ближайшей точки невозврата — если ветка guide-saves подключена (ctx.saves = () => import('./saves.js'))
async function loadExt() {
  EXT = null; const near = nearPnr(stage()); if (!near || !C.saves) return;
  try { const m = await C.saves(); const r = await m.savesFor(D.game, near.m.id, C.lang); EXT = (r?.req || []).map((q) => tx(q.t)); if (EXT.length) rerender(); } catch { }
}
function openTip(id) {
  const t = D.tips.find((x) => x.id === id); if (!t) return;
  C.openTip?.({ game: D.game, id: `walk-${t.id}`, k: 'tip', t: t.t, next: t.next, how: { ...t.how, ta: t.t, rw: t.rw, miss: t.miss ? t.lose || true : undefined }, sn: (t.s || []).map((k) => D.src[k]?.n).filter(Boolean), st: t.st });
  C.event?.('walk_tip', { id: t.id });
}
function afterMark(before) {
  const st = stage(), fresh = activeTips(st).filter((t) => !activeTips(before).includes(t)).length;
  reveal = false; moreNext = false; render(); loadExt(); return fresh;
}
function onClick(e) {
  const b = e.target.closest('[data-w]'); if (!b || !layer.contains(b)) return;
  switch (b.dataset.w) {
    case 'close': closeWalk(); break;
    case 'pick': { const before = stage(); pickPos(C, D.game, { extra: C.pickExtra?.(D.game) || [], onDone: () => afterMark(before) }); break; }
    case 'fresh': { const p = getProg(D.game); setProg(D.game, { ...p, via: 'self' }); render(); break; }
    case 'pass': {
      const before = stage(), nx = D.order[(before ?? -1) + 1]; if (!nx) break;
      setProg(D.game, { m: `m:${nx.id}`, via: 'self', t: nx.t }); C.haptic?.(); C.event?.('walk_mark', { m: nx.id, from: before });
      C.toast?.(s('marked', { n: afterMark(before) })); layer.querySelector('#w-scroll').scrollTo({ top: 0, behavior: 'smooth' }); break;
    }
    case 'reveal': reveal = true; rerender(); break;
    case 'more': moreNext = true; rerender(); break;
    case 'any': e.preventDefault(); openAny = !openAny; rerender(); break;
    case 'tip': openTip(b.dataset.id); break;
    case 'save': C.openKey?.('saves:gta6:how'); break;
    case 'key': C.openKey?.(b.dataset.k); break;
    case 'map': C.openPlace?.(b.dataset.k); break;
    case 'eggs': C.openFeed?.('eggs'); break;
    case 'codes': C.openCheats?.(); break;
  }
}

export async function openWalk(ctx, game = 'gta6', tipId = '') {
  C = ctx; reveal = false; moreNext = false; css();
  const d = await loadGuide(game); if (!d) return false;
  layer = document.getElementById('walk');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'walk'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick);
  }
  render(); loadExt();
  if (tipId && D.tips.some((t) => t.id === tipId)) setTimeout(() => openTip(tipId), 60);   // ключ walk:gta6:<подсказка>
  layer.classList.add('open'); document.documentElement.classList.add('walk-open');
  history.pushState({ walk: 1 }, '');
  C.event?.('walk_open', { from: ctx.from || '', st: stage() });
  return true;
}
export const refresh = () => { if (layer?.classList.contains('open')) rerender(); };
export function closeWalk(fromPop = false) {
  if (!layer?.classList.contains('open')) return false;
  closePick();
  layer.classList.remove('open'); document.documentElement.classList.remove('walk-open');
  C?.onClose?.();
  if (!fromPop && history.state?.walk) history.back();
  return true;
}
export const isOpen = () => !!layer?.classList.contains('open');
// «назад» в системе: сначала шторка «Где вы», потом инструкция поверх (guide.js); этот экран — когда его запись истории снята
addEventListener('popstate', () => { if (closePick(true)) return; if (isOpen() && !history.state?.walk && !history.state?.guide) closeWalk(true); });
// одна шторка на приложение: ядро отдаёт pickPos сюда (если сборщик добавил registerPickSheet), иначе вызывают SB.pickPos
core.registerPickSheet?.((game, ctx = {}) => pickPos({ lang: ctx.lang || document.documentElement.lang || 'ru', haptic: ctx.haptic, event: ctx.event, I: ctx.I }, game, ctx));
