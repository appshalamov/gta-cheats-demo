// «Прохождение» — гид по прогрессу (26.11.2026, «Гид по игре», функция 2). Итог и вопросы — «Гид по игре — система (26.11.2026)/
// Итог для Fable — гид прохождения.md»; окончательное место в приложении решает Fable («Решение Fable — система гида.md»).
// Игрок отмечает последнюю пройденную миссию → экран показывает, что сделать ДО следующих миссий (подсказка = инструкция «По шагам»
// из js/guide.js), следующую миссию без спойлеров и «Дальше» в другие функции. Дальше текущего места ничего не раскрываем.
// Данные — data/guide/missions.json (общая база миссий и глав GTA 6; контракт — заметка «guide-walkthrough — база миссий (контракт)»).
// Прогресс — localStorage sb.gp = {gta6: {m:'m:<id>' | null, c:'c<N>' (глава без списка миссий), via:'self'|'psn'|'xbox', at, t:{ru,en}}}.
// Позже прогресс приходит с PlayStation/Xbox (сессия guide-progress): та же запись с via:'psn'|'xbox' — экран не меняется.

const S = {
  ru: {
    title: 'Прохождение', sub: 'Что сделать перед следующими миссиями. Дальше вашего места ничего не раскрываем.',
    where: 'Где вы в игре', last: 'Последняя пройденная', none: 'Ещё ничего не прошли', change: 'Изменить', set: 'Отметить, где я',
    set_sub: 'Отметьте последнюю пройденную миссию — покажем, что важно сделать до следующих.',
    now: 'Сделать сейчас', now0: 'Сейчас ничего не упустите. Проходите дальше.', until: 'До миссии «{m}»', until_any: 'В любой момент',
    during: 'Во время миссии «{m}»', missable: 'Можно упустить навсегда', steps: '{n} из {m} сделано',
    next: 'Следующая миссия', hidden: 'Название скрыто, чтобы не было спойлера', show: 'Показать название', passed: 'Прошёл «{m}»', passed0: 'Прошёл эту миссию',
    later: 'Ещё {n} подсказок откроются дальше по сюжету', marked: 'Отмечено. Новых подсказок: {n}',
    pick: 'Где вы в игре', start: 'Только начинаю', ch: 'Глава {n}', ch_soon: 'Миссии этой главы добавим после проверки по двум источникам',
    ch_here: 'Я в этой главе', done: 'Готово', via_psn: 'По трофеям PlayStation', via_xbox: 'По достижениям Xbox',
    more: 'Дальше', on_map: 'На карте: {p}', on_map_s: 'Где это в игре и в жизни', eggs: 'Пасхалки по шагам', eggs_s: 'Секретные машины и находки сообщества',
    codes: 'Коды для GTA 6', codes_s: 'Деньги, оружие, машины', end: 'Финал главы', src: 'Источники: {s}', close: 'Закрыть', fin: 'Вы прошли всё, что есть в гиде.',
    official: 'Так в русской версии игры', unofficial: 'В игре миссия называется по-английски',
  },
  en: {
    title: 'Walkthrough', sub: 'What to do before your next missions. Nothing past your point is revealed.',
    where: 'Where you are', last: 'Last completed', none: 'Nothing completed yet', change: 'Change', set: 'Mark where I am',
    set_sub: 'Mark the last mission you finished, and we will show what to do before the next ones.',
    now: 'Do it now', now0: "Nothing to miss right now. Keep playing.", until: 'Before “{m}”', until_any: 'Any time',
    during: 'During “{m}”', missable: 'Missable', steps: '{n} of {m} done',
    next: 'Next mission', hidden: 'Title hidden to avoid spoilers', show: 'Show title', passed: 'Finished “{m}”', passed0: 'Finished this mission',
    later: '{n} more tips unlock later in the story', marked: 'Saved. New tips: {n}',
    pick: 'Where you are', start: 'Just starting', ch: 'Chapter {n}', ch_soon: 'Missions of this chapter will be added once checked by two sources',
    ch_here: "I'm in this chapter", done: 'Done', via_psn: 'From PlayStation trophies', via_xbox: 'From Xbox achievements',
    more: 'Next up', on_map: 'On the map: {p}', on_map_s: 'Where it is in the game and in real life', eggs: 'Easter eggs step by step', eggs_s: 'Secret cars and community finds',
    codes: 'GTA 6 cheats', codes_s: 'Money, weapons, vehicles', end: 'Chapter finale', src: 'Sources: {s}', close: 'Close', fin: 'You have finished everything in the guide.',
    official: 'As in the game', unofficial: '',
  },
};
const KEY = 'sb.gp';
let C = null, D = null, layer = null, reveal = false, openCh = null;

const s = (k, v = {}) => { let x = (S[C?.lang] || S.en)[k] ?? S.en[k] ?? k; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
const tx = (o, lg = C?.lang) => (o ? o[lg] || o.en || o.ru || '' : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── данные ──
export async function loadGuide(game = 'gta6') {
  if (D?.game === game) return D;
  const r = await fetch('data/guide/missions.json', { cache: 'no-cache' }).catch(() => null);
  if (!r?.ok) return null;
  const d = await r.json(); if (d.game !== game) return null;
  const chN = Object.fromEntries(d.ch.map((c) => [c.id, c.n]));
  d.order = d.m.filter((m) => m.k === 'main').sort((a, b) => chN[a.ch] - chN[b.ch] || a.n - b.n);
  d.pos = Object.fromEntries(d.order.map((m, i) => [`m:${m.id}`, i]));
  d.mid = Object.fromEntries(d.m.map((m) => [`m:${m.id}`, m]));
  d.chEnd = {};   // позиция последней миссии каждой главы (для отметки «я в главе N» без списка миссий)
  d.ch.forEach((c) => { const ms = d.order.filter((m) => chN[m.ch] < c.n); d.chEnd[c.id] = ms.length - 1; });
  D = d; return d;
}
const readAll = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
export function getProg(game = 'gta6') { return readAll()[game] || null; }
export function setProg(game, p) {
  try { const all = readAll(); if (p) all[game] = { ...p, at: Date.now() }; else delete all[game]; localStorage.setItem(KEY, JSON.stringify(all)); } catch { }
}
// позиция игрока в общем порядке основных миссий: индекс последней пройденной (-1 — ничего не прошёл; null — не отмечал)
export function stage(d = D, p = getProg(d?.game)) {
  if (!d || !p) return null;
  if (p.m && d.pos[p.m] != null) return d.pos[p.m];
  if (p.c && d.chEnd[p.c] != null) return d.chEnd[p.c];
  return -1;
}
const posOf = (ref) => (ref && D.pos[ref] != null ? D.pos[ref] : null);
// подсказка видна, когда миссия from пройдена, а until ещё нет (until null — до конца игры)
export function activeTips(st, d = D) {
  if (st == null) return [];
  return d.tips.filter((t) => { const f = t.from ? d.pos[t.from] ?? Infinity : -1, u = t.until ? d.pos[t.until] ?? Infinity : Infinity; return f <= st && st < u; })
    .sort((a, b) => (b.miss ? 1 : 0) - (a.miss ? 1 : 0) || (d.pos[a.until] ?? 1e9) - (d.pos[b.until] ?? 1e9));
}
const laterTips = (st) => D.tips.filter((t) => (t.from ? D.pos[t.from] ?? Infinity : -1) > (st ?? -1)).length;
// строка для Главной без загрузки базы: последняя отметка с названием, сохранённым при отметке
export function summary(game, lang) {
  const p = getProg(game); if (!p) return null;
  return { t: p.t ? (p.t[lang] || p.t.en) : '', c: p.cn || 0 };
}

// ── экран ──
function css() {
  for (const [id, href] of [['guide-css', 'css/guide.css'], ['walk-css', 'css/walk.css']]) {
    if (document.getElementById(id)) continue;
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
}
const mTitle = (m) => tx(m.t);
const chOf = (m) => D.ch.find((c) => c.id === m.ch);
function tipRow(t) {
  const n = t.how?.st?.length || 0, d = C.done?.({ game: D.game, id: `walk-${t.id}`, how: t.how }) || 0;
  const u = t.until ? D.mid[t.until] : null;
  const when = !u ? s('until_any') : t.dur ? s('during', { m: mTitle(u) }) : s('until', { m: mTitle(u) });
  return `<button class="w-tip${t.miss ? ' is-miss' : ''}" data-w="tip" data-id="${esc(t.id)}">
    <span class="w-tt"><b>${esc(tx(t.t))}</b><small>${esc(tx(t.rw))}</small>
      <small class="w-when">${t.miss ? `<span class="w-mi">${C.I.alert}${esc(s('missable'))}. ${esc(when)}</span>` : `<span>${esc(when)}</span>`}${n && d ? `<span class="w-dn">${esc(s('steps', { n: Math.floor(d), m: n }))}</span>` : ''}</small></span>
    <i class="w-chev">${C.I.chevron}</i></button>`;
}
function render() {
  const I = C.I, p = getProg(D.game), st = stage(D, p), last = st != null && st >= 0 ? D.order[st] : null;
  const next = st == null ? null : D.order[st + 1] || null, tips = activeTips(st), later = laterTips(st);
  const ch = next ? chOf(next) : last ? chOf(last) : D.ch[0];
  const via = p?.via === 'psn' ? s('via_psn') : p?.via === 'xbox' ? s('via_xbox') : '';
  const pl = next?.pl ? C.place?.(next.pl) : null;
  layer.innerHTML = `<div class="g-scroll" id="w-scroll">
    <header class="g-top"><button class="g-ib" data-w="close" aria-label="${esc(s('close'))}">${I.chevron}</button></header>
    <h1 class="g-h1">${esc(s('title'))}</h1>
    <p class="g-meta">${esc(s('sub'))}</p>
    <section class="w-where">
      ${st == null ? `<p class="w-set-sub">${esc(s('set_sub'))}</p><button class="g-main w-set" data-w="pick">${esc(s('set'))}</button>`
      : `<button class="w-pos" data-w="pick"><span class="w-tt"><small>${esc(ch ? `${s('ch', { n: ch.n })}. ${tx(ch.t)}` : '')}</small>
          <b>${esc(last ? mTitle(last) : s('none'))}</b><small>${esc(last ? s('last') : '')}${via ? `${last ? '. ' : ''}${esc(via)}` : ''}</small></span>
          <span class="w-chg">${esc(s('change'))}</span></button>`}
    </section>
    ${st != null ? `<section class="g-sec"><h2>${esc(s('now'))}</h2>
      ${tips.length ? `<div class="w-tips">${tips.map(tipRow).join('')}</div>` : `<p class="g-meta">${esc(s('now0'))}</p>`}
      ${later ? `<p class="g-note w-later">${esc(s('later', { n: later }))}</p>` : ''}</section>` : ''}
    ${next ? `<section class="g-sec w-next"><h2>${esc(s('next'))}</h2>
      ${next.sp >= 2 && !reveal ? `<p class="w-nt w-hid">${esc(s('hidden'))}</p><button class="g-link" data-w="reveal">${I.eye}<span>${esc(s('show'))}</span></button>`
      : `<p class="w-nt">${esc(mTitle(next))}</p>`}
      ${next.o ? `<p class="w-no">${esc(tx(next.o))}</p>` : ''}
      ${next.timed ? `<p class="g-trap">${esc(tx(next.timed))}</p>` : ''}
      <button class="g-main w-pass" data-w="pass">${I.check}<span>${esc(next.sp >= 2 && !reveal ? s('passed0') : s('passed', { m: mTitle(next) }))}</span></button>
    </section>` : st != null && st >= D.order.length - 1 ? `<p class="g-fin">${I.check}<span>${esc(s('fin'))}</span></p>` : ''}
    ${st != null ? `<section class="g-sec w-more"><h2>${esc(s('more'))}</h2>
      ${pl ? `<button class="w-row" data-w="map" data-k="${esc(next.pl)}"><span class="w-ic">${I.pin}</span><span class="w-tt"><b>${esc(s('on_map', { p: pl }))}</b><small>${esc(s('on_map_s'))}</small></span><i class="w-chev">${I.chevron}</i></button>` : ''}
      <button class="w-row" data-w="eggs"><span class="w-ic">${I.egg}</span><span class="w-tt"><b>${esc(s('eggs'))}</b><small>${esc(s('eggs_s'))}</small></span><i class="w-chev">${I.chevron}</i></button>
      ${pl ? '' : `<button class="w-row" data-w="codes"><span class="w-ic">${I.gamepad}</span><span class="w-tt"><b>${esc(s('codes'))}</b><small>${esc(s('codes_s'))}</small></span><i class="w-chev">${I.chevron}</i></button>`}
    </section>
    <p class="g-note w-src">${esc(s('src', { s: Object.values(D.src).map((x) => x.n).join(', ') }))}</p>` : ''}
    <div class="g-pad"></div>
  </div>
  <div class="g-sheet w-sheet" id="w-pick" hidden></div>`;
}
// выбор места в игре: главы по порядку; миссии главы раскрываются по тапу (чтобы не видеть названия следующих глав)
function pickHTML() {
  const p = getProg(D.game), cur = p?.m || (p ? 'start' : ''), I = C.I;
  const sel = p?.m ? D.mid[p.m]?.ch : p?.c || 'c1';
  if (openCh == null) openCh = sel;
  return `<div class="g-sh-in"><div class="g-sh-top"><b>${esc(s('pick'))}</b><button class="g-ib" data-w="unpick" aria-label="${esc(s('close'))}">${I.close}</button></div>
    <button class="w-opt${cur === 'start' && !p?.c ? ' on' : ''}" data-w="set" data-m=""><span>${esc(s('start'))}</span>${I.check}</button>
    ${D.ch.map((c) => {
      const ms = D.order.filter((m) => m.ch === c.id), open = openCh === c.id;
      return `<div class="w-ch${open ? ' open' : ''}"><button class="w-chh" data-w="ch" data-c="${c.id}" aria-expanded="${open}">
        <span class="w-tt"><b>${esc(s('ch', { n: c.n }))}${open || c.n <= (D.ch.find((x) => x.id === sel)?.n || 1) ? `. ${esc(tx(c.t))}` : ''}</b>${ms.length ? `<small>${ms.length}</small>` : ''}</span><i class="w-chev">${I.chevron}</i></button>
        ${open ? (ms.length ? `<ol class="w-ms">${ms.map((m) => `<li><button class="w-opt${cur === `m:${m.id}` ? ' on' : ''}" data-w="set" data-m="m:${m.id}"><span><em>${m.n}</em>${esc(mTitle(m))}</span>${I.check}</button></li>`).join('')}</ol>`
          : `<p class="g-note">${esc(s('ch_soon'))}</p><button class="w-opt${p?.c === c.id ? ' on' : ''}" data-w="setc" data-c="${c.id}"><span>${esc(s('ch_here'))}</span>${I.check}</button>`) : ''}</div>`;
    }).join('')}</div>`;
}
function openPick() { const b = layer.querySelector('#w-pick'); openCh = null; b.innerHTML = pickHTML(); b.hidden = false; }
function mark(ref, chId = null) {
  const before = stage();
  const m = ref ? D.mid[ref] : null;
  setProg(D.game, ref ? { m: ref, via: 'self', t: m.t } : chId ? { c: chId, via: 'self', t: { ru: `${S.ru.ch.replace('{n}', D.ch.find((c) => c.id === chId).n)}`, en: `${S.en.ch.replace('{n}', D.ch.find((c) => c.id === chId).n)}` } } : { m: null, via: 'self' });
  const st = stage(), fresh = activeTips(st).filter((t) => !activeTips(before).includes(t)).length;
  reveal = false; render(); C.haptic?.();
  C.event?.('walk_mark', { m: ref || chId || 'start', from: before });
  return fresh;
}
function openTip(id) {
  const t = D.tips.find((x) => x.id === id); if (!t) return;
  C.openTip?.({ game: D.game, id: `walk-${t.id}`, k: 'tip', t: t.t, how: { ...t.how, ta: t.t, rw: t.rw, miss: t.miss ? t.lose || true : undefined }, sn: (t.s || []).map((k) => D.src[k]?.n).filter(Boolean) });
  C.event?.('walk_tip', { id: t.id });
}
function onClick(e) {
  const b = e.target.closest('[data-w]'); if (!b || !layer.contains(b)) return;
  switch (b.dataset.w) {
    case 'close': closeWalk(); break;
    case 'pick': openPick(); break;
    case 'unpick': layer.querySelector('#w-pick').hidden = true; break;
    case 'ch': openCh = openCh === b.dataset.c ? '' : b.dataset.c; layer.querySelector('#w-pick').innerHTML = pickHTML(); break;
    case 'set': mark(b.dataset.m || null); break;
    case 'setc': mark(null, b.dataset.c); break;
    case 'pass': { const st = stage(), nx = D.order[(st ?? -1) + 1]; if (!nx) break; const n = mark(`m:${nx.id}`); C.toast?.(s('marked', { n })); layer.querySelector('#w-scroll').scrollTo({ top: 0, behavior: 'smooth' }); break; }
    case 'reveal': reveal = true; render(); break;
    case 'tip': openTip(b.dataset.id); break;
    case 'map': C.openPlace?.(b.dataset.k); break;
    case 'eggs': C.openFeed?.('eggs'); break;
    case 'codes': C.openCheats?.(); break;
  }
}

export async function openWalk(ctx, game = 'gta6') {
  C = ctx; reveal = false; css();
  const d = await loadGuide(game); if (!d) return false;
  layer = document.getElementById('walk');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'walk'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick);
  }
  render();
  layer.classList.add('open'); document.documentElement.classList.add('walk-open');
  history.pushState({ walk: 1 }, '');
  C.event?.('walk_open', { from: ctx.from || '', st: stage() });
  return true;
}
export const refresh = () => { if (layer?.classList.contains('open')) { const y = layer.querySelector('#w-scroll')?.scrollTop || 0; render(); layer.querySelector('#w-scroll').scrollTop = y; } };
export function closeWalk(fromPop = false) {
  if (!layer?.classList.contains('open')) return false;
  layer.classList.remove('open'); document.documentElement.classList.remove('walk-open');
  C?.onClose?.();
  if (!fromPop && history.state?.walk) history.back();
  return true;
}
export const isOpen = () => !!layer?.classList.contains('open');
// «назад» в системе: сначала закрывается инструкция поверх (guide.js), этот экран — только когда его запись истории снята
addEventListener('popstate', () => { if (isOpen() && !history.state?.walk && !history.state?.guide) closeWalk(true); });
