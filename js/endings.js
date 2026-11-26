// «Концовки и лучшее прохождение» (26.11.2026, «Гид по игре», функция 4; ветка feature/guide-endings).
// Итог и вопросы — «Гид по игре — система (26.11.2026)/Итог для Fable — концовки.md»; место в приложении решает Fable.
// Экран на основе «По шагам» (js/guide.js, css/guide.css): список на фоне, текущая развилка раскрыта, внизу главная кнопка.
// Без спойлеров: игрок отмечает, докуда дошёл; развилки дальше этого — только числом, концовки — силуэтами.
// Текст концовки попадает в DOM только после тапа («Намёк» → «Показать целиком»), не размытием.
// Данные — data/guide/endings.json; миссии и главы — общая база data/guide/missions.json (ведёт guide-walkthrough), здесь только ссылки по id.
// Прогресс — на телефоне, localStorage sb.ge: { <игра>: { ch: <n главы>, c: {<развилка>: <вариант>}, r: {<концовка>: 1|2}, rs: [<шаги маршрута>], all: 0|1 } }.

const S = {
  ru: {
    close: 'Закрыть', share: 'Поделиться', title: 'Концовки', found: 'Найдено {n}', found_note: 'Как считают', src_n: 'Собрано по {n} источникам',
    where: 'Докуда вы дошли', where_none: 'Отметьте главу, и откроются развилки, которые вы уже прошли', where_pick: 'Выбрать главу',
    ch: 'Глава {n}', ch_cur: 'Сейчас', ch_ahead: 'Название откроется, когда дойдёте',
    open_n: 'Открыто {a} из {b}', best_ok: 'Лучшая концовка ещё возможна', best_lost: 'Лучшая концовка закрыта выбором в миссии «{m}»',
    best_on: 'Вы идёте к лучшей концовке', forks: 'Развилки', forks_ahead: 'Впереди ещё {n}. Откроются, когда дойдёте.',
    pick: 'Что вы выбрали?', not_yet: 'Ещё не дошёл', change: 'Изменить', in_m: 'Миссия «{m}»', save: 'Сохранитесь перед этой миссией',
    pnr: 'Точка невозврата', effect: 'Что это меняет', endings: 'Концовки', hidden: 'Скрыта', hint: 'Намёк', show: 'Показать целиком',
    possible: 'Ещё возможна', closed: 'Закрыта', yours: 'Ваш путь', how_get: 'Как получить', keep: 'Что остаётся после финала',
    best: 'Лучшее прохождение', best_why: 'Почему лучшая', best_route: 'Маршрут развилок', best_start: 'Показать маршрут',
    step_next: 'Следующая развилка, глава {n}', step_show: 'Показать, что выбрать', step_lock: 'Шаг в главе {n}',
    dispute: 'Источники спорят', one_src: 'Один источник: {s}. Проверяем', rumor: 'Слух, не проверено', best_tag: 'Лучшая',
    check4: 'Перед финалом: проверьте 4 вещи', check4_sub: 'Отметьте, что у вас сейчас. Посмотреть можно в меню игры.', mark_it: 'Отметить',
    show_pro: 'Показать целиком в Pro', step_pro: 'Что выбрать — в Pro', free_one: 'Одна концовка целиком бесплатно', factors: 'Что ещё влияет', before: 'До финала',
    all: 'Показать всё сразу', all_off: 'Скрыть спойлеры', all_q: 'Откроются все концовки и развилки, включая ещё не пройденные.',
    next: 'Дальше', back_hook: 'Новые находки о концовках проверяем каждый день', report: 'Сообщить об ошибке', report_ok: 'Спасибо, проверим',
    sources: 'Источники', reset: 'Начать заново', start: 'Отметить, докуда дошёл', done: 'Готово',
  },
  en: {
    close: 'Close', share: 'Share', title: 'Endings', found: '{n} found', found_note: 'How we count', src_n: 'Collected from {n} sources',
    where: 'How far you are', where_none: 'Pick your chapter to unlock the choices you have already made', where_pick: 'Pick a chapter',
    ch: 'Chapter {n}', ch_cur: 'Now', ch_ahead: 'Name unlocks when you get there',
    open_n: '{a} of {b} still open', best_ok: 'The best ending is still possible', best_lost: 'The best ending was closed by a choice in “{m}”',
    best_on: 'You are on track for the best ending', forks: 'Choices', forks_ahead: '{n} more ahead. They unlock when you get there.',
    pick: 'What did you choose?', not_yet: 'Not there yet', change: 'Change', in_m: 'Mission “{m}”', save: 'Save before this mission',
    pnr: 'Point of no return', effect: 'What it changes', endings: 'Endings', hidden: 'Hidden', hint: 'Hint', show: 'Show all of it',
    possible: 'Still possible', closed: 'Closed', yours: 'Your path', how_get: 'How to get it', keep: 'What you keep after the finale',
    best: 'Best playthrough', best_why: 'Why it is the best', best_route: 'Route of choices', best_start: 'Show the route',
    step_next: 'Next choice, chapter {n}', step_show: 'Show what to pick', step_lock: 'Step in chapter {n}',
    dispute: 'Sources disagree', one_src: 'One source: {s}. Checking', rumor: 'Rumor, unverified', best_tag: 'Best',
    check4: 'Before the finale: check 4 things', check4_sub: 'Mark where you are now. You can see it in the game menu.', mark_it: 'Mark',
    show_pro: 'Show all of it in Pro', step_pro: 'What to pick is in Pro', free_one: 'One ending in full for free', factors: 'What else matters', before: 'Before the finale',
    all: 'Show everything', all_off: 'Hide spoilers', all_q: 'All endings and choices will open, including ones you have not reached.',
    next: 'Next', back_hook: 'We check new ending finds every day', report: 'Report a mistake', report_ok: "Thanks, we'll check",
    sources: 'Sources', reset: 'Start over', start: 'Mark how far I am', done: 'Done',
  },
};
const KEY = 'sb.ge';
let C = null, D = null, M = null, G = 'gta6', layer = null, sheet = null;

const s = (k, v = {}) => {
  let x = (S[C.lang] || S.en)[k] ?? S.en[k] ?? k;
  for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b);
  return x;
};
const tx = (o) => (o ? (typeof o === 'string' ? o : o[C.lang] || o.en || o.ru || '') : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const readAll = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
// глава из общего прогресса гида прохождения (sb.gp: последняя пройденная миссия, сам или по трофеям PS/Xbox)
function gpCh() {
  try {
    const g = JSON.parse(localStorage.getItem('sb.gp') || '{}')[G] || {}, m = g.m && (M?.m || []).find((x) => `m:${x.id}` === g.m || x.id === g.m);
    return m ? chN(m.ch) : g.c ? chN(g.c) : 0;
  } catch { return 0; }
}
function prog() { const p = readAll()[G] || {}; return { ch: Math.max(p.ch || 0, gpCh()), c: p.c || {}, r: p.r || {}, rs: p.rs || [], all: p.all || 0, of: p.of, fe: p.fe }; }
function setProg(p) { try { const a = readAll(); a[G] = { ...p, at: Date.now() }; localStorage.setItem(KEY, JSON.stringify(a)); } catch { } }

// ── модель ──
// главы и миссии: из общей базы missions.json (guide-walkthrough), запасной вариант — chapters/mt в endings.json
const chapters = () => (M?.ch?.length ? M.ch.filter((c) => c.n > 0) : D.chapters || []).slice().sort((a, b) => a.n - b.n);
const chN = (id) => chapters().find((c) => c.id === id)?.n ?? +(String(id).replace(/\D/g, '') || 99);
const mission = (f) => (M?.m || []).find((m) => m.id === f.m || `m:${m.id}` === f.m);
const mTitle = (f) => tx(mission(f)?.t) || tx(f.mt) || f.m;
// где развилка: «Миссия «X»» или, у состояний (отношения, счёт, профили), их короткое имя
const where = (f) => (f.qs ? tx(f.qs) : s('in_m', { m: mTitle(f) }));
const real = () => D.endings.filter((e) => e.st !== 'rumor');   // слухи в счёт не идут
const forkCh = (f) => (mission(f)?.ch ? chN(mission(f).ch) : chN(f.ch));
const fork = (id) => D.forks.find((f) => f.id === id);
// концовка: closed — уже выбран другой вариант нужной развилки; yours — все условия выполнены выбором
function state(e, p) {
  let met = 0;
  for (const n of e.need || []) {
    const c = p.c[n.f];
    if (c && !n.o.includes(c)) return 'closed';
    if (c) met++;
  }
  return (e.need || []).length && met === e.need.length ? 'yours' : 'open';
}
const reached = (f, p) => p.all || forkCh(f) <= p.ch;
const bestE = () => D.endings.find((e) => e.id === D.best?.e);
// какая развилка закрыла лучшую концовку
function bestKiller(p) {
  const b = bestE(); if (!b) return null;
  for (const n of b.need || []) { const c = p.c[n.f]; if (c && !n.o.includes(c)) return fork(n.f); }
  return null;
}
// строка доверия (решение Fable «система гида», §2): «Источники спорят: …» — янтарная, «Один источник: X. Проверяем» — серая, слух — янтарная
const mark = (st, why, src) => (st === 'dispute' ? `<p class="e-flag">${esc(s('dispute'))}${why ? `: ${esc(tx(why))}` : ''}</p>`
  : st === 'one' ? `<p class="e-flag e-flag-2">${esc(s('one_src', { s: (src || [])[0] || '?' }))}</p>` : st === 'rumor' ? `<p class="e-flag">${esc(s('rumor'))}</p>` : '');
// Pro (решение Fable §5): бесплатно — счёт, развилки, силуэты, намёки и ОДНА концовка целиком; Pro — остальные целиком, «Показать всё сразу»,
// в маршруте — «что выбрать» дальше ближайшей развилки. Пейвол — существующий, после тапа (не стеной поперёк экрана).
const pro = () => !C.access || C.access() !== 'locked' || !!C.linked;
const canFull = (id, p) => pro() || !p.fe || p.fe === id;
const isState = (f) => f.kind === 'state';
// развилка видна только на своей ветке: after {развилка: вариант} — если выбран другой вариант, развилки нет
const onBranch = (f, p) => !f.after || Object.entries(f.after).every(([k, v]) => !p.c[k] || p.c[k] === v);

// ── экран ──
function topHTML(p) {
  const open = real().filter((e) => state(e, p) !== 'closed').length, b = bestE(), k = bestKiller(p);
  const bs = b ? (k ? `<p class="g-miss">${C.I.alert}<span>${esc(s('best_lost', { m: mTitle(k) }))}</span></p>`
    : state(b, p) === 'yours' ? `<p class="g-trust">${C.I.check}<span>${esc(s('best_on'))}</span></p>`
      : `<p class="g-trust">${C.I.check}<span>${esc(s('best_ok'))}</span></p>`) : '';
  return `<h1 class="g-h1">${esc(tx(D.t) || s('title'))}</h1>
    <p class="g-rw">${esc(tx(D.rw))}</p>
    <p class="e-count"><b>${esc(s('open_n', { a: open, b: real().length }))}</b></p>
    ${bs}
    ${D.found ? `<details class="g-alt e-found"><summary>${esc(s('found', { n: D.found.n }))}. ${esc(s('found_note'))}</summary><p>${esc(tx(D.found.note))}</p>${mark(D.found.st, null)}</details>` : ''}`;
}
function whereHTML(p) {
  const ch = chapters(), cur = ch.find((c) => c.n === p.ch);
  return `<section class="g-sec"><h2>${esc(s('where'))}</h2>
    ${cur ? `<button class="e-where" data-e="where"><span><b>${esc(s('ch', { n: cur.n }))}</b><small>${esc(tx(cur.t))}</small></span><i>${esc(s('change'))}</i></button>`
      : `<p class="g-meta">${esc(s('where_none'))}</p><button class="g-pro e-where-go" data-e="where">${esc(s('where_pick'))}</button>`}</section>`;
}
function optHTML(f, o, p) {
  const on = p.c[f.id] === o.id;
  return `<li class="${on ? 'on' : ''}"><button class="g-tc" data-e="pick" data-f="${esc(f.id)}" data-o="${esc(o.id)}" aria-pressed="${on}">${C.I.check}</button>
    <span>${esc(tx(o.t))}${on && o.eff ? `<small>${esc(tx(o.eff))}</small>` : ''}</span></li>`;
}
function forksHTML(p, st = false) {
  const fs = D.forks.filter((f) => isState(f) === st).sort((a, b) => forkCh(a) - forkCh(b) || (a.n || 0) - (b.n || 0));
  const vis = fs.filter((f) => reached(f, p) && onBranch(f, p)), ahead = st ? 0 : fs.filter((f) => !reached(f, p) && onBranch(f, p)).length;
  if (!vis.length && !ahead) return '';
  const curI = p.of && vis.some((f) => f.id === p.of) ? -1 : vis.findIndex((f) => !p.c[f.id]);
  return `<section class="g-sec${st ? ' e-check' : ''}"><h2>${esc(s(st ? 'check4' : 'forks'))}</h2>${st ? `<p class="g-meta">${esc(s('check4_sub'))}</p>` : ''}
    <ol class="g-steps e-forks">${vis.map((f, i) => {
    const done = !!p.c[f.id], open = i === curI || p.of === f.id;
    if (!open) return `<li class="g-step${done ? ' is-done' : ''}" data-e="fopen" data-f="${esc(f.id)}"><span class="g-num">${done ? C.I.check : i + 1}</span>
        <p class="g-t">${esc(st ? tx(f.qs) : tx(f.q))}${done ? ` <span class="e-chosen">${esc(tx(f.opts.find((o) => o.id === p.c[f.id])?.t))}</span>` : st ? ` <span class="e-mark">${esc(s('mark_it'))}</span>` : ''}</p></li>`;
    return `<li class="g-step is-cur"><span class="g-num">${done ? C.I.check : i + 1}</span><div class="g-body">
        <p class="g-t">${esc(tx(f.q))}</p>
        ${f.qs ? '' : `<p class="g-at">${C.I.pin}<span>${esc(where(f))}</span></p>`}
        ${f.pnr ? `<p class="g-trap">${esc(s('pnr'))}. ${esc(tx(f.save) || s('save'))}</p>` : ''}
        ${f.hint ? `<p class="g-ok">${esc(tx(f.hint))}</p>` : ''}
        <div class="g-tags"><p class="e-pick">${esc(s('pick'))}</p><ol>${f.opts.map((o) => optHTML(f, o, p)).join('')}</ol></div>
        ${mark(f.st, f.dispute, f.src)}</div></li>`;
  }).join('')}</ol>
    ${ahead ? `<p class="g-meta e-ahead">${C.I.lock}<span>${esc(s('forks_ahead', { n: ahead }))}</span></p>` : ''}</section>`;
}
function endHTML(e, i, p) {
  const st = state(e, p), n = e.n || i + 1, lv = p.all && pro() ? 2 : Math.min(p.r[e.id] || 0, canFull(e.id, p) ? 2 : 1);
  const badge = st === 'closed' ? `<i class="e-st e-st-x">${esc(s('closed'))}</i>` : st === 'yours' ? `<i class="e-st e-st-y">${esc(s('yours'))}</i>` : `<i class="e-st">${esc(s('possible'))}</i>`;
  if (!lv) return `<li class="e-end is-hid${st === 'closed' ? ' is-x' : ''}"><span class="g-num">${n}</span>
      <p class="g-t">${esc(s('hidden'))}</p>${badge}<button class="g-link e-rv" data-e="rv" data-id="${esc(e.id)}">${esc(s('hint'))}</button></li>`;
  if (lv === 1) return `<li class="e-end${st === 'closed' ? ' is-x' : ''}"><span class="g-num">${n}</span><div class="g-body">
      <p class="g-t">${esc(tx(e.tease))}</p>${badge}
      <button class="g-link" data-e="rv" data-id="${esc(e.id)}">${esc(s(canFull(e.id, p) ? 'show' : 'show_pro'))}</button>
      ${!pro() && !p.fe ? `<p class="g-note">${esc(s('free_one'))}</p>` : ''}</div></li>`;
  return `<li class="e-end is-open${st === 'closed' ? ' is-x' : ''}"><span class="g-num">${n}</span><div class="g-body">
      <p class="g-t"><b>${esc(tx(e.t))}</b></p>${badge}${e.kind === 'best' ? `<i class="e-st e-st-y">${esc(s('best_tag'))}</i>` : ''}${mark(e.st, e.dispute, e.src)}
      <p class="g-ok">${esc(tx(e.d))}</p>
      ${(e.need || []).length ? `<p class="e-h3">${esc(s('how_get'))}</p><ol class="e-path">${e.need.map((nd) => {
    const f = fork(nd.f); if (!f) return '';
    return `<li>${esc(where(f))}: <b>${esc(nd.o.map((o) => tx(f.opts.find((x) => x.id === o)?.t)).join(' / '))}</b></li>`;
  }).join('')}</ol>` : ''}
      ${e.how ? `<p class="g-ok">${esc(tx(e.how))}</p>` : ''}
      ${e.keep ? `<p class="e-h3">${esc(s('keep'))}</p><p class="g-ok">${esc(tx(e.keep))}</p>` : ''}
      ${(e.src || []).length ? `<p class="g-note">${esc(s('sources'))}: ${esc(e.src.join(', '))}</p>` : ''}</div></li>`;
}
function bestHTML(p) {
  const b = D.best; if (!b?.route?.length) return '';
  const shown = new Set(p.rs);
  const rows = b.route.map((r, i) => {
    const f = fork(r.f); if (!f) return '';
    const n = forkCh(f), ok = (p.all && pro()) || n <= p.ch || shown.has(i), chosen = p.c[f.id], right = chosen === r.o;
    if (!ok) {
      const isNext = i === b.route.findIndex((x) => { const ff = fork(x.f); return ff && forkCh(ff) > p.ch; });
      const can = isNext || pro();
      return `<li class="g-step${isNext ? '' : ' is-lock'}"><span class="g-num">${isNext ? i + 1 : C.I.lock}</span><div class="g-body">
        <p class="g-t">${esc(s(isNext ? 'step_next' : 'step_lock', { n }))}</p>
        <button class="g-link" data-e="${can ? 'rs' : 'pw'}" data-i="${i}">${esc(s(can ? 'step_show' : 'step_pro'))}</button></div></li>`;
    }
    const o = f.opts.find((x) => x.id === r.o);
    return `<li class="g-step${chosen ? (right ? ' is-done' : ' is-x') : ' is-cur'}"><span class="g-num">${chosen ? (right ? C.I.check : C.I.close) : i + 1}</span><div class="g-body">
      <p class="g-t">${esc(where(f))}: <b>${esc(tx(o?.t))}</b></p>
      ${r.tip ? `<p class="g-ok">${esc(tx(r.tip))}</p>` : ''}${f.pnr ? `<p class="g-trap">${esc(tx(f.save) || s('save'))}</p>` : ''}</div></li>`;
  }).join('');
  const bl = (p.all && pro()) || (p.r[b.e] === 2 && canFull(b.e, p));
  return `<section class="g-sec e-best"><h2>${esc(s('best'))}</h2>
    ${bl && b.why ? `<p class="g-ok"><b>${esc(s('best_why'))}.</b> ${esc(tx(b.why))}</p>` : ''}
    ${b.dispute ? `<p class="g-note">${esc(s('dispute'))}: ${esc(tx(b.dispute))}</p>` : ''}
    ${(b.before || []).length ? `<p class="e-h3">${esc(s('before'))}</p><ul class="g-req">${b.before.map((x) => `<li>${esc(tx(x))}</li>`).join('')}</ul>` : ''}
    <p class="e-h3">${esc(s('best_route'))}</p><ol class="g-steps">${rows}</ol></section>`;
}
function nextHTML() {
  const rows = (D.next || []).filter((n) => n.a !== 'open-key' || C.openKey).slice(0, 3);   // ключ ?open= (справочник saves:) — только если ядро гида подключено
  if (!rows.length) return '';
  return `<section class="g-sec e-next"><h2>${esc(s('next'))}</h2>${rows.map((n) => `<button class="e-nx" data-e="nx" data-action="${esc(n.a)}"${Object.entries(n.d || {}).map(([k, v]) => ` data-${esc(k)}="${esc(v)}"`).join('')}>
      <span>${esc(tx(n.t))}</span>${C.I.chevron}</button>`).join('')}
    <p class="g-note">${esc(s('back_hook'))}</p></section>`;
}
function render() {
  const p = prog();
  layer.innerHTML = `<div class="g-scroll" id="e-scroll">
    <header class="g-top"><button class="g-ib" data-e="close" aria-label="${esc(s('close'))}">${C.I.chevron}</button>
      <button class="g-ib" data-e="share" aria-label="${esc(s('share'))}">${C.I.share}</button></header>
    ${topHTML(p)}
    ${p.all ? '' : whereHTML(p)}
    ${forksHTML(p, true)}
    ${forksHTML(p)}
    <section class="g-sec"><h2>${esc(s('endings'))}</h2><ol class="e-ends">${D.endings.map((e, i) => endHTML(e, i, p)).join('')}</ol></section>
    ${bestHTML(p)}
    ${(D.hidden || []).length && (p.all || p.ch) ? `<section class="g-sec"><h2>${esc(s('factors'))}</h2><ul class="g-req">${D.hidden.map((h) => `<li>${esc(tx(h.t))}${mark(h.st, null, h.src)}</li>`).join('')}</ul></section>` : ''}
    ${nextHTML()}
    <section class="g-sec g-foot">
      <button class="g-link" data-e="all">${esc(s(p.all ? 'all_off' : 'all'))}</button>
      ${(D.src || []).length ? `<p class="g-note">${esc(s('src_n', { n: D.src.length }))}: ${esc(D.src.join(', '))}</p>` : ''}
      <button class="g-link" data-e="report">${esc(s('report'))}</button>
      ${p.ch || Object.keys(p.c).length ? `<button class="g-link e-reset" data-e="reset">${esc(s('reset'))}</button>` : ''}
    </section><div class="g-pad"></div>
  </div>
  <div class="g-sheet" id="e-sheet" hidden></div>
  <footer class="g-bar">${p.ch || p.all ? `<button class="g-main" data-e="close">${esc(s('done'))}</button>` : `<button class="g-main" data-e="where">${esc(s('start'))}</button>`}</footer>`;
  sheet = layer.querySelector('#e-sheet');
}
function rerender() { const y = layer.querySelector('#e-scroll')?.scrollTop || 0; render(); layer.querySelector('#e-scroll').scrollTop = y; }
// выбор главы: пройденные и текущая — с названием, дальше — только номер (название — спойлер)
function whereSheet() {
  const p = prog();
  sheet.innerHTML = `<div class="g-sh-in"><div class="g-sh-top"><b>${esc(s('where'))}</b><button class="g-ib" data-e="unsheet" aria-label="${esc(s('close'))}">${C.I.close}</button></div>
    <ol class="e-chs">${chapters().map((c) => `<li><button data-e="ch" data-n="${c.n}" class="${c.n === p.ch ? 'on' : ''}"><b>${esc(s('ch', { n: c.n }))}</b>
      <small>${c.n <= Math.max(p.ch, 1) || p.all ? esc(tx(c.t)) : esc(s('ch_ahead'))}</small></button></li>`).join('')}</ol></div>`;
  sheet.hidden = false;
}
function onClick(e) {
  const b = e.target.closest('[data-e]'); if (!b || !layer.contains(b)) return;
  const a = b.dataset.e, p = prog();
  switch (a) {
    case 'close': closeEndings(); break;
    case 'share': C.share?.(); break;
    case 'where': whereSheet(); break;
    case 'unsheet': sheet.hidden = true; break;
    case 'ch': C.haptic(); p.ch = +b.dataset.n; setProg(p); sheet.hidden = true; rerender(); C.event?.('endings_ch', { ch: p.ch }); break;
    case 'pick': {
      const f = b.dataset.f, o = b.dataset.o; C.haptic();
      if (p.c[f] === o) delete p.c[f]; else p.c[f] = o;
      delete p.of; setProg(p); rerender(); C.event?.('endings_pick', { f, o });
      break;
    }
    case 'fopen': p.of = p.of === b.dataset.f ? undefined : b.dataset.f; setProg(p); rerender(); break;
    case 'rv': {
      const id = b.dataset.id, lv = Math.min(2, (p.r[id] || 0) + 1);
      if (lv === 2 && !canFull(id, p)) { C.event?.('endings_paywall', { id }); C.paywall?.(); break; }   // вторая концовка целиком — Pro
      if (lv === 2 && !p.fe) p.fe = id;
      p.r[id] = lv; setProg(p); rerender(); C.event?.('endings_reveal', { id, lv }); break;
    }
    case 'pw': C.event?.('endings_paywall', { i: b.dataset.i || '' }); C.paywall?.(); break;
    case 'rs': p.rs = [...new Set([...p.rs, +b.dataset.i])]; setProg(p); rerender(); C.event?.('endings_route_step', { i: +b.dataset.i }); break;
    case 'all':
      if (!p.all && !pro()) { C.event?.('endings_paywall', { all: 1 }); C.paywall?.(); break; }
      if (!p.all && !confirm(s('all_q'))) break;
      p.all = p.all ? 0 : 1; setProg(p); rerender(); break;
    case 'reset': setProg({ ch: 0, c: {}, r: {}, rs: [], all: 0, fe: p.fe }); render(); break;   // бесплатная концовка остаётся той же
    case 'report': C.toast(s('report_ok')); C.event?.('endings_report', {}); break;
    case 'nx': C.event?.('endings_next', { a: b.dataset.action, v: b.dataset.v || b.dataset.key || '' }); closeEndings();
      if (b.dataset.action === 'open-key') C.openKey(b.dataset.key);   // иначе переход делает общий обработчик data-action в app.js
      break;
  }
}
function css() {
  for (const f of ['guide', 'endings']) {
    if (document.getElementById(`${f}-css`)) continue;
    const l = document.createElement('link'); l.id = `${f}-css`; l.rel = 'stylesheet'; l.href = `css/${f}.css`; document.head.appendChild(l);
  }
}
async function load(game) {
  const j = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [d, m] = await Promise.all([j(`data/guide/endings-${game}.json`), j(`data/guide/missions.json`)]);
  return [d, m && (m[game] || m)];
}
export async function openEndings(game, ctx) {
  const [d, m] = await load(game);
  if (!d?.endings?.length) return false;
  C = ctx; D = d; M = m; G = game; css();
  layer = document.getElementById('endings');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'endings'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick);
  }
  render();
  requestAnimationFrame(() => layer.classList.add('open'));
  document.documentElement.classList.add('guide-open');
  history.pushState({ endings: 1 }, '');
  C.event?.('endings_open', { from: ctx.from || '' });
  return true;
}
export function closeEndings(fromPop = false) {
  if (!layer?.classList.contains('open')) return false;
  layer.classList.remove('open'); document.documentElement.classList.remove('guide-open');
  C?.onClose?.();
  if (!fromPop && history.state?.endings) history.back();
  return true;
}
export const isOpen = () => !!layer?.classList.contains('open');
addEventListener('popstate', () => { if (isOpen()) closeEndings(true); });
