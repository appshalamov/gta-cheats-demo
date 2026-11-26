// Инструкция «По шагам» (26.11.2026, «Гид по игре», функция 1). Проект — «Гид по игре — пасхалки (26.11.2026)/01 Проект Fable.md»,
// финальное решение — «02 Решение Fable.md». Один экран для всех входов (Новости, «Пасхалки», карта, ссылка): openGuide(o, ctx).
// Телефон лежит рядом с геймпадом: текущий шаг раскрыт под большим пальцем, внизу «Не получается» и «Сделано, дальше».
// У шага: действие, «Получилось, если…», ловушка, крупное значение (код, адрес), список мест с роликом с секунды, «Где в игре».
// Данные — egg.how из data/map/<игра>.json (tools/build_map.py guide_fields). Прогресс — на телефоне (localStorage sb.gd), по id шагов.
// Тот же компонент потом — гид прохождения (req.ty mission/chapter + ref) и предупреждения (miss).

import { pathTo, screenHTML, key, keyHTML, platOf, fitScreens } from './guide-menu.js';

const S = {
  ru: {
    close: 'Закрыть', share: 'Поделиться', whole: 'Весь путь в ролике, {n} минут', whole0: 'Весь путь в ролике', before: 'Перед выездом',
    start: 'Начать', next: 'Сделано, дальше', finish: 'Готово', stuck: 'Не получается', still: 'Всё равно не выходит',
    ok: 'Получилось, если', video_at: 'Ролик с {t}', in_game: 'Где в игре', not_this: 'Не {c}', of: 'из',
    tags_n: '{a} из {b}', alt: 'Обходной путь (глитч)', sources: 'Источники', report: 'Сообщить об ошибке', report_ok: 'Спасибо, проверим',
    self: 'Прошли сами {d}', collected: 'Собрано по {n} источникам, сами пока не проходили',
    wall: 'Дальше в Pro: шаги {a}–{b}, точные места и разбор ошибок', get_pro: 'Оформить Pro',
    fin_car: 'Готово. Машина ваша.', fin: 'Готово. Всё получилось.', again: 'Начать заново',
    meta: '{n} шагов, около {m} минут', meta0: '{n} шагов', missable: 'Можно упустить навсегда', no_fix: 'Для этого шага частых ошибок нет. Посмотрите ролик или общий список.',
    en_only: 'Инструкция на английском', offline: 'Ролики работают с сетью',
    // вид «настройки» (путь по меню игры)
    set_meta: '{n} настроек, около {m} минут', for_plat: 'Для {p}.', show_for: 'Показать для {p}', pc_note: 'На ПК меню то же, кнопки — как на PlayStation.',
    open_set: 'Откройте настройки', a_pause: 'Нажмите {k}, игра встанет на паузу', a_pick: 'Нажмите {k} на «{to}»', a_tab: '{k} до вкладки «{to}»',
    a_tab_n: '{k} {n} раза до вкладки «{to}»', a_move: '{k} до пункта «{to}»', a_set: '{k} до значения «{to}»',
    why: 'Зачем', was: 'По умолчанию {v}', ps_only: 'Только PlayStation', fin_set: 'Готово. Настройки на месте.', up_next: 'Дальше',
    shot_cap: 'Схема меню, наша. Названия пунктов как в игре.', unsure: 'Кнопки Xbox сверяем с записью меню', video_set: 'Весь путь в ролике, {n}', video_step: 'Ролик с {t}',
    show_path: 'Показать по шагам', w_select: 'Выбрать', w_back: 'Назад', w_reset: 'Сброс', src_n: 'Источники: {s}', hyp: 'Совет по общим правилам, в гайдах по GTA 6 не проверен',
  },
  en: {
    close: 'Close', share: 'Share', whole: 'Watch the whole route, {n} min', whole0: 'Watch the whole route', before: 'Before you go',
    start: 'Start', next: 'Done, next', finish: 'Finish', stuck: "I'm stuck", still: 'Still stuck',
    ok: 'It worked if', video_at: 'Video from {t}', in_game: 'In game', not_this: 'Not {c}', of: 'of',
    tags_n: '{a} of {b}', alt: 'Shortcut (glitch)', sources: 'Sources', report: 'Report a mistake', report_ok: "Thanks, we'll check",
    self: 'We did it ourselves on {d}', collected: 'Collected from {n} sources, not yet tested by us',
    wall: 'The rest is in Pro: steps {a}–{b}, exact spots and fixes', get_pro: 'Get Pro',
    fin_car: 'Done. The car is yours.', fin: 'Done. You made it.', again: 'Start over',
    meta: '{n} steps, about {m} min', meta0: '{n} steps', missable: 'Missable', no_fix: 'No common mistakes for this step. Watch the video or the full list.',
    en_only: 'Guide in English', offline: 'Videos need a connection',
    set_meta: '{n} settings, about {m} min', for_plat: 'For {p}.', show_for: 'Show for {p}', pc_note: 'On PC the menu is the same; buttons shown for PlayStation.',
    open_set: 'Open Settings', a_pause: 'Press {k} to pause the game', a_pick: 'Press {k} on “{to}”', a_tab: '{k} to the “{to}” tab',
    a_tab_n: '{k} {n} times to the “{to}” tab', a_move: '{k} to “{to}”', a_set: '{k} to “{to}”',
    why: 'Why', was: 'Default {v}', ps_only: 'PlayStation only', fin_set: 'Done. Your settings are set.', up_next: 'Up next',
    shot_cap: 'Our menu diagram. Item names as in the game.', unsure: 'Xbox buttons being checked against a menu recording', video_set: 'Whole route on video, {n}', video_step: 'Video from {t}',
    show_path: 'Play the steps', w_select: 'Select', w_back: 'Back', w_reset: 'Defaults', src_n: 'Sources: {s}', hyp: 'General advice, not yet checked in GTA 6 guides',
  },
};
const KEY = 'sb.gd', FIRST = 'sb.gd1';
let C = null, O = null, layer = null, lock = null, stuckAll = false, plat = null;   // plat — платформа экранов вида «настройки»

const s = (k, v = {}) => {
  let x = (S[C.lang] || S.en)[k] ?? S.en[k] ?? k;
  for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b);
  return x;
};
const tx = (o) => (o ? o[C.lang] || o.en || o.ru || '' : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mmss = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
const kOf = (o) => `${o.game}:${o.id}`;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
function prog() { const p = read()[kOf(O)] || {}; return { d: p.d || [], t: p.t || {}, s: p.s || 0, o: p.o }; }
function setProg(p) { try { const all = read(); all[kOf(O)] = { ...p, at: Date.now() }; localStorage.setItem(KEY, JSON.stringify(all)); } catch { } }
// для строк ленты и шторки на карте: сколько шагов пройдено (0 — не начато)
export function progressOf(o) { const p = read()[kOf(o)]; return p ? (o.how?.st || []).filter((x) => (p.d || []).includes(x.id)).length + (p.s ? 0.001 : 0) : 0; }

const H = () => O.how;
// Pro (решение Fable): бесплатно целиком — первая начатая инструкция, пробные дни, вход по ссылке, короткие (≤ 3 шагов) и отсылки
function firstFree() { try { const f = localStorage.getItem(FIRST); return !f || f === kOf(O); } catch { return true; } }
const free = () => H().vw === 'settings' || C.access() !== 'locked' || !!C.linked || H().st.length <= 3 || O.k === 'reference' || firstFree();
const shut = (i) => !free() && i >= (H().fr ?? 2);
const cur = (p) => { const L = H().vw === 'settings' ? shownSt() : H().st, i = L.findIndex((x) => !p.d.includes(x.id)); return i < 0 ? L.length : i; };

function css() {
  if (document.getElementById('guide-css')) return;
  const l = document.createElement('link'); l.id = 'guide-css'; l.rel = 'stylesheet'; l.href = 'css/guide.css'; document.head.appendChild(l);
}

// ── шаг ──
function stepHTML(x, i, p, open) {
  const I = C.I, done = p.d.includes(x.id), n = i + 1;
  const cls = `g-step${done ? ' is-done' : ''}${open ? ' is-cur' : ''}${shut(i) ? ' is-lock' : ''}`;
  if (shut(i)) return `<li class="${cls}" data-g="pw"><span class="g-num">${I.lock}</span><p class="g-t">${esc(tx(x.t))}</p></li>`;
  if (!open) return `<li class="${cls}" data-g="open" data-i="${i}"><span class="g-num">${done ? I.check : n}</span><p class="g-t">${esc(tx(x.t))}</p></li>`;
  const tg = x.tg || [], got = p.t[x.id] || [];
  return `<li class="${cls}" data-i="${i}"><span class="g-num">${done ? I.check : n}</span><div class="g-body">
    <p class="g-t">${esc(tx(x.t))}</p>
    ${x.c ? `<p class="g-big">${esc(x.c)}</p>${x.tr ? `<p class="g-trap">${esc(tx(x.tr))}${x.cw ? ` ${esc(s('not_this', { c: x.cw }))}.` : ''}</p>` : ''}` : ''}
    ${x.bv ? `<p class="g-big g-big-t">${esc(x.bv)}</p>${x.bn ? `<p class="g-trap">${esc(tx(x.bn))}</p>` : ''}` : ''}
    ${x.ok ? `<p class="g-ok"><b>${esc(s('ok'))}</b> ${esc(tx(x.ok).replace(/^(It worked if|Получилось, если)\s*/i, ''))}</p>` : ''}
    ${!x.c && x.tr ? `<p class="g-trap">${esc(tx(x.tr))}</p>` : ''}
    ${tg.length ? `<div class="g-tags"><p class="g-tn">${esc(s('tags_n', { a: Math.min(got.length, x.need), b: x.need }))}</p><ol>${tg.map((q, k) => `<li class="${got.includes(k) ? 'on' : ''}">
        <button class="g-tc" data-g="tag" data-i="${i}" data-k="${k}" aria-pressed="${got.includes(k)}">${I.check}</button>
        <span>${esc(tx(q.p))}${q.a ? `<small>${esc(q.a)}</small>` : ''}</span>
        ${q.v ? `<button class="g-tv" data-g="video" data-v="${esc(q.v[0])}" data-t="${q.v[1]}" aria-label="${esc(s('video_at', { t: mmss(q.v[1]) }))}">${I.play}<span>${mmss(q.v[1])}</span></button>` : ''}</li>`).join('')}</ol></div>` : ''}
    ${x.at ? `<p class="g-at">${I.pin}<span>${esc(s('in_game'))}: ${esc(typeof x.at === 'string' ? x.at : tx(x.at))}</span></p>` : ''}
    ${x.v ? `<button class="g-tb" data-g="video" data-v="${esc(x.v[0])}" data-t="${x.v[1]}">${I.play}<span>${esc(s('video_at', { t: mmss(x.v[1]) }))}</span></button>` : ''}
  </div></li>`;
}
function stuckHTML(ci) {
  const h = H(), st = h.st, x = st[ci];
  const mine = (h.fx || []).filter((f) => x && (f.s || []).includes(x.id));
  const all = (h.fx || []).filter((f) => !mine.includes(f));
  return `<div class="g-fix">${mine.length ? mine.map((f) => `<p>${esc(tx(f.t))}</p>`).join('') : `<p>${esc(s('no_fix'))}</p>`}
    ${all.length || h.alt ? (stuckAll ? all.map((f) => `<p>${esc(tx(f.t))}</p>`).join('') + (h.alt ? `<p><b>${esc(s('alt'))}.</b> ${esc(tx(h.alt.t))}${h.alt.nt ? ` ${esc(tx(h.alt.nt))}` : ''}</p>${h.alt.v ? `<button class="g-tb" data-g="video" data-v="${esc(h.alt.v[0])}" data-t="${h.alt.v[1]}">${C.I.play}<span>${esc(s('video_at', { t: mmss(h.alt.v[1]) }))}</span></button>` : ''}` : '')
      : `<button class="g-link" data-g="still">${esc(s('still'))}</button>`) : ''}</div>`;
}
function render() {
  if (H().vw === 'settings') { renderSet(); return; }
  const h = H(), p = prog(), st = h.st, I = C.I, ci = cur(p), started = p.d.length > 0 || p.s;
  const fr = h.fr ?? 2, wall = !free() && fr < st.length ? fr : -1;
  const trust = h.self ? s('self', { d: C.date(h.self) }) : (O.sn || []).length ? s('collected', { n: O.sn.length }) : '';
  const enOnly = !['ru', 'en'].includes(C.lang) && !st[0].t[C.lang];
  layer.innerHTML = `<div class="g-scroll" id="g-scroll">
    <header class="g-top"><button class="g-ib" data-g="close" aria-label="${esc(s('close'))}">${I.chevron}</button>
      <button class="g-ib" data-g="share" aria-label="${esc(s('share'))}">${I.share}</button></header>
    <h1 class="g-h1">${esc(tx(h.ta) || tx(O.t))}</h1>
    ${h.rw ? `<p class="g-rw">${esc(tx(h.rw))}</p>` : ''}
    <p class="g-meta">${esc(h.min ? s('meta', { n: st.length, m: h.min }) : s('meta0', { n: st.length }))}</p>
    ${trust ? `<p class="g-trust">${I.check}<span>${esc(trust)}</span></p>` : ''}
    ${enOnly ? `<p class="g-meta">${esc(s('en_only'))}</p>` : ''}
    ${h.wh ? `<button class="g-link g-whole" data-g="video" data-v="${esc(h.wh[0])}" data-t="${h.wh[1]}">${I.play}<span>${esc(h.wh[2] ? s('whole', { n: h.wh[2] }) : s('whole0'))}</span></button>` : ''}
    ${h.miss ? `<p class="g-miss">${I.alert}<span>${esc(s('missable'))}${typeof h.miss === 'object' ? `. ${esc(tx(h.miss))}` : ''}</span></p>` : ''}
    ${h.req?.length ? `<section class="g-sec"><h2>${esc(s('before'))}</h2><ul class="g-req">${h.req.slice(0, 3).map((r) => `<li>${esc(tx(r.t))}</li>`).join('')}</ul></section>` : ''}
    <ol class="g-steps">${st.map((x, i) => (i === wall ? `<li class="g-wall"><p>${esc(s('wall', { a: fr + 1, b: st.length }))}</p><button class="g-pro" data-g="pw">${esc(s('get_pro'))}</button></li>` : '')
      + stepHTML(x, i, p, (started && i === ci) || p.o === i)).join('')}</ol>
    ${ci >= st.length ? `<p class="g-fin">${I.check}<span>${esc(O.k === 'vehicle' ? s('fin_car') : s('fin'))}</span></p>` : ''}
    <section class="g-sec g-foot">
      ${h.alt && free() ? `<details class="g-alt"><summary>${esc(s('alt'))}</summary><p>${esc(tx(h.alt.t))}</p>${h.alt.nt ? `<p class="g-note">${esc(tx(h.alt.nt))}</p>` : ''}
        ${h.alt.v ? `<button class="g-tb" data-g="video" data-v="${esc(h.alt.v[0])}" data-t="${h.alt.v[1]}">${I.play}<span>${esc(s('video_at', { t: mmss(h.alt.v[1]) }))}</span></button>` : ''}</details>` : ''}
      ${(O.sn || []).length ? `<p class="g-note">${esc(s('sources'))}: ${esc(O.sn.join(', '))}</p>` : ''}
      <button class="g-link" data-g="report">${esc(s('report'))}</button>
      ${navigator.onLine === false ? `<p class="g-note">${esc(s('offline'))}</p>` : ''}
    </section>
  </div>
  <div class="g-sheet" id="g-stuck" hidden></div>
  <footer class="g-bar">${barHTML(p, ci)}</footer>
  <div class="g-video" id="g-video" hidden></div>`;
}
// ── вид «настройки»: шаг = один пункт меню игры; в раскрытом шаге — путь по меню строками «экран + кнопка + действие» ──
const PN = { playstation: 'PlayStation', xbox: 'Xbox' };
const M = () => H().menu;
const shownSt = () => H().st.filter((x) => !x.only || x.only === plat);
const W = () => ({ lab: tx, w: { select: s('w_select'), back: s('w_back'), reset: s('w_reset') } });
let sel = {}, playT = null;   // sel[шаг] — какой узел пути показан на экране шага; playT — «Показать» листает узлы сам
function lineHTML(nd, i, si, on) {
  const k = key(M(), plat, nd.btn), kh = keyHTML(k);
  const ph = { pause: 'a_pause', pick: 'a_pick', tab: nd.n > 1 ? 'a_tab_n' : 'a_tab', move: 'a_move', set: 'a_set' }[nd.act];
  const txt = esc(s(ph, { k: '\u0001', to: tx(nd.lab) || nd.to, n: nd.n })).replace('\u0001', kh || esc(k?.tok || ''));
  return `<li class="gs-line${on ? ' on' : ''}" data-g="node" data-i="${si}" data-n="${i}"><span class="gs-dot"></span><p class="gs-act">${txt}</p></li>`;
}
function setStepHTML(x, i, p, open, first) {
  const I = C.I, done = p.d.includes(x.id), n = i + 1;
  const cls = `g-step gs-step${done ? ' is-done' : ''}${open ? ' is-cur' : ''}`;
  const val = `<span class="gs-val">${esc(tx(x.val))}</span>`;
  if (!open) return `<li class="${cls}" data-g="open" data-i="${i}"><span class="g-num">${done ? I.check : n}</span><p class="g-t">${esc(tx(x.hn) || tx(x.t))}</p>${val}</li>`;
  const nodes = pathTo(M(), x.it, x.set);
  // общее начало «пауза → настройки» целиком только в первом шаге, дальше одной строкой «Откройте настройки»
  const from = first ? 0 : 2, n0 = sel[i] ?? nodes.length - 1, nd = nodes[Math.max(from, Math.min(n0, nodes.length - 1))];
  const vt = H().vid?.[plat]?.ch?.[x.id];
  return `<li class="${cls}" data-i="${i}"><span class="g-num">${done ? I.check : n}</span><div class="g-body">
    <div class="gs-head"><p class="g-t">${esc(tx(x.hn) || tx(x.t))}<small class="gs-lab">${esc(tx(x.t))}</small></p>${val}</div>
    ${x.why ? `<p class="g-ok"><b>${esc(s('why'))}.</b> ${esc(tx(x.why))}</p>` : ''}
    ${x.def != null && x.set != null ? `<p class="g-note">${esc(s('was', { v: x.def }))}${x.only ? `. ${esc(s('ps_only'))}` : ''}</p>` : ''}
    ${x.hyp ? `<p class="g-trap">${esc(s('hyp'))}</p>` : ''}
    <button class="gs-shot" data-g="shot" data-i="${i}" aria-label="${esc(s('shot_cap'))}">${screenHTML(M(), plat, nd.scr, W())}</button>
    <div class="gs-row"><button class="g-link gs-play" data-g="play" data-i="${i}">${I.play}<span>${esc(s('show_path'))}</span></button>
      ${vt != null ? `<button class="g-link" data-g="svid" data-t="${vt}">${I.video || I.play}<span>${esc(s('video_step', { t: mmss(vt) }))}</span></button>` : ''}</div>
    <ol class="gs-path">${first ? '' : `<li class="gs-line gs-open"><span class="gs-dot"></span><p class="gs-act">${esc(s('open_set'))} <span class="gs-keys">${keyHTML(key(M(), plat, 'pause'))}${keyHTML(key(M(), plat, 'confirm'))}</span></p></li>`}
      ${nodes.slice(from).map((q, k) => lineHTML(q, k + from, i, k + from === nodes.indexOf(nd))).join('')}</ol>
    ${x.src?.length ? `<p class="g-note">${esc(s('src_n', { s: x.src.join(', ') }))}</p>` : ''}
  </div></li>`;
}
function nextHTML() {
  const nx = H().next || []; if (!nx.length) return '';
  return `<section class="g-sec gs-next"><h2>${esc(s('up_next'))}</h2>${nx.map((q) => `<button class="gs-nx" data-g="go" data-k="${esc(q.k)}"><b>${esc(tx(q.t))}</b>${q.s ? `<small>${esc(tx(q.s))}</small>` : ''}${C.I.chevron}</button>`).join('')}</section>`;
}
function renderSet() {
  const h = H(), I = C.I, p = prog(), st = shownSt(), all = h.st;
  const ci = (() => { const k = st.findIndex((x) => !p.d.includes(x.id)); return k < 0 ? st.length : k; })(), started = p.d.length > 0 || p.s;
  const other = plat === 'xbox' ? 'playstation' : 'xbox';
  const vid = h.vid?.[plat], trust = (O.sn || []).length ? s('collected', { n: O.sn.length }) : '';
  const unsure = (M().btn.st?.[plat] || 'ok') !== 'ok';
  layer.innerHTML = `<div class="g-scroll gs" id="g-scroll">
    <header class="g-top"><button class="g-ib" data-g="close" aria-label="${esc(s('close'))}">${I.chevron}</button>
      <button class="g-ib" data-g="share" aria-label="${esc(s('share'))}">${I.share}</button></header>
    <h1 class="g-h1">${esc(tx(h.ta))}</h1>
    ${h.rw ? `<p class="g-rw">${esc(tx(h.rw))}</p>` : ''}
    <p class="g-meta">${esc(s('set_meta', { n: st.length, m: h.min || Math.max(2, Math.round(st.length * 0.7)) }))}</p>
    <p class="gs-plat">${esc(s('for_plat', { p: PN[plat] }))} <button class="g-link" data-g="plat">${esc(s('show_for', { p: PN[other] }))}</button></p>
    ${!['playstation', 'xbox'].includes(C.platform) ? `<p class="g-note">${esc(s('pc_note'))}</p>` : ''}
    ${unsure ? `<p class="g-note">${esc(s('unsure'))}</p>` : ''}
    ${trust ? `<p class="g-trust">${I.check}<span>${esc(trust)}</span></p>` : ''}
    ${vid ? `<button class="g-link g-whole" data-g="svid" data-t="0">${I.play}<span>${esc(s('video_set', { n: vid.len }))}</span></button>` : ''}
    <ol class="g-steps">${st.map((x, i) => setStepHTML(x, i, p, (started && i === ci) || p.o === i, i === 0 || all.indexOf(x) === 0)).join('')}</ol>
    ${ci >= st.length ? `<p class="g-fin">${I.check}<span>${esc(s('fin_set'))}</span></p>
      ${vid ? `<button class="g-link" data-g="svid" data-t="0">${I.play}<span>${esc(s('video_set', { n: vid.len }))}</span></button>` : ''}` : ''}
    ${ci >= st.length || !started ? nextHTML() : ''}
    <section class="g-sec g-foot">
      ${(O.sn || []).length ? `<p class="g-note">${esc(s('sources'))}: ${esc(O.sn.join(', '))}</p>` : ''}
      <p class="g-note">${esc(s('shot_cap'))}</p>
      <button class="g-link" data-g="report">${esc(s('report'))}</button>
    </section>
  </div>
  <div class="g-shotv" id="g-shotv" hidden></div>
  <footer class="g-bar">${setBarHTML(p, ci, st)}</footer>
  <div class="g-video" id="g-video" hidden></div>`;
  requestAnimationFrame(() => fitScreens(layer));
}
function setBarHTML(p, ci, st) {
  const started = p.d.length > 0 || p.s;
  if (!started) return `<button class="g-main" data-g="start">${esc(s('start'))}</button>`;
  if (ci >= st.length) return `<button class="g-sub" data-g="again">${esc(s('again'))}</button><button class="g-main" data-g="close">${esc(s('finish'))}</button>`;
  return `<button class="g-main" data-g="next">${esc(ci === st.length - 1 ? s('finish') : s('next'))}</button>`;
}
// сменить экран шага без перерисовки всего слоя (строка пути → её экран)
function swapScreen(i) {
  const li = layer.querySelector(`.gs-step[data-i="${i}"]`); if (!li) return;
  const x = shownSt()[i], first = i === 0, nodes = pathTo(M(), x.it, x.set), n = Math.max(first ? 0 : 2, Math.min(sel[i] ?? nodes.length - 1, nodes.length - 1));
  li.querySelector('.gs-shot').innerHTML = screenHTML(M(), plat, nodes[n].scr, W());
  li.querySelectorAll('.gs-line[data-n]').forEach((e) => e.classList.toggle('on', +e.dataset.n === n));
  fitScreens(li);
}
function stopPlay() { clearInterval(playT); playT = null; }
function playPath(i) {
  stopPlay();
  const x = shownSt()[i], nodes = pathTo(M(), x.it, x.set); let n = i === 0 ? 0 : 2;
  sel[i] = n; swapScreen(i); C.event?.('guide_play', { id: O.id, step: i + 1 });
  playT = setInterval(() => { n++; if (n >= nodes.length || !layer.classList.contains('open')) { stopPlay(); return; } sel[i] = n; swapScreen(i); }, 1300);
}
// экран меню на весь экран (поворот не нужен: 16:9 во всю ширину, ниже — подпись действия)
function openShot(b) {
  const v = layer.querySelector('#g-shotv'), act = b.closest('.g-body')?.querySelector('.gs-line.on .gs-act')?.innerHTML || '';
  v.innerHTML = `<button class="g-ib g-vx" data-g="shotx" aria-label="${esc(s('close'))}">${C.I.close}</button><div class="gs-big">${b.innerHTML}</div><p class="gs-act">${act}</p><p class="g-note">${esc(s('shot_cap'))}</p>`;
  v.hidden = false; fitScreens(v);
}
// свой ролик прохода по меню (mp4 со своего хостинга), с главы шага
function setVideo(t) {
  const vd = H().vid?.[plat]; if (!vd) return;
  const v = layer.querySelector('#g-video');
  v.innerHTML = `<div class="g-vbox"><button class="g-ib g-vx" data-g="vclose" aria-label="${esc(s('close'))}">${C.I.close}</button>
    <div class="g-vf"><video src="${esc(vd.src.replace('{l}', C.lang === 'ru' ? 'ru' : 'en'))}#t=${t}" ${vd.poster ? `poster="${esc(vd.poster)}"` : ''} controls autoplay playsinline muted preload="metadata"></video></div></div>`;
  v.hidden = false;
  C.event?.('guide_video', { id: O.id, v: plat, t });
}
function barHTML(p, ci) {
  const st = H().st, started = p.d.length > 0 || p.s;
  if (!started) return `<button class="g-main" data-g="start">${esc(s('start'))}</button>`;
  if (ci >= st.length) return `<button class="g-sub" data-g="again">${esc(s('again'))}</button><button class="g-main" data-g="close">${esc(s('finish'))}</button>`;
  if (shut(ci)) return `<button class="g-main" data-g="pw">${esc(s('get_pro'))}</button>`;
  return `<button class="g-sub" data-g="stuck">${esc(s('stuck'))}</button><button class="g-main" data-g="next">${esc(ci === st.length - 1 ? s('finish') : s('next'))}</button>`;
}
function toStep(i, smooth = true) {
  const el = layer.querySelector(`.g-step[data-i="${i}"]`), sc = layer.querySelector('#g-scroll'); if (!el || !sc) return;
  const y = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 72;
  sc.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
}
function rerender() { const y = layer.querySelector('#g-scroll')?.scrollTop || 0; render(); layer.querySelector('#g-scroll').scrollTop = y; }

// ── ролик внутри приложения (youtube-nocookie, с секунды; наружу не уводит) ──
function video(id, t) {
  if (!/^[\w-]{6,20}$/.test(id)) return;
  const v = layer.querySelector('#g-video'), lg = C.lang;
  v.innerHTML = `<div class="g-vbox"><button class="g-ib g-vx" data-g="vclose" aria-label="${esc(s('close'))}">${C.I.close}</button>
    <div class="g-vf"><iframe src="https://www.youtube-nocookie.com/embed/${id}?start=${t}&autoplay=1&playsinline=1&rel=0&modestbranding=1&hl=${lg}&cc_lang_pref=${lg}" title="video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div>`;
  v.hidden = false;
  C.event?.('guide_video', { id: O.id, v: id, t });
}
async function wake(on) {
  try { if (on && !lock && navigator.wakeLock) lock = await navigator.wakeLock.request('screen'); else if (!on && lock) { await lock.release(); lock = null; } } catch { }
}
function openStuck() {
  const box = layer.querySelector('#g-stuck'), ci = cur(prog());
  box.innerHTML = `<div class="g-sh-in"><div class="g-sh-top"><b>${esc(s('stuck'))}</b><button class="g-ib" data-g="unstuck" aria-label="${esc(s('close'))}">${C.I.close}</button></div>${stuckHTML(ci)}</div>`;
  box.hidden = false;
  C.event?.('guide_stuck', { id: O.id, step: ci + 1 });
}

function onClick(e) {
  const b = e.target.closest('[data-g]'); if (!b || !layer.contains(b)) return;
  const a = b.dataset.g, p = prog(), st = H().vw === 'settings' ? shownSt() : H().st, i = +b.dataset.i;
  switch (a) {
    case 'close': closeGuide(); break;
    case 'share': C.share(O); break;
    case 'start':
      C.haptic(); p.s = 1; setProg(p);
      try { if (!localStorage.getItem(FIRST)) localStorage.setItem(FIRST, kOf(O)); } catch { }
      rerender(); toStep(cur(p)); wake(true); C.event?.('guide_start', { id: O.id });
      break;
    case 'next': {
      const ci = cur(p); if (ci >= st.length) break;
      C.haptic(); p.d.push(st[ci].id); delete p.o; setProg(p); stuckAll = false; rerender();
      C.event?.('guide_step', { id: O.id, step: ci + 1 });
      const n = cur(p); if (n < st.length) toStep(n); else layer.querySelector('#g-scroll').scrollTo({ top: 1e6, behavior: 'smooth' });
      break;
    }
    case 'open': p.o = p.o === i ? undefined : i; setProg(p); rerender(); break;
    case 'tag': {
      const x = st[i], k = +b.dataset.k, got = new Set(p.t[x.id] || []);
      got.has(k) ? got.delete(k) : got.add(k); p.t[x.id] = [...got]; C.haptic();
      if (got.size >= x.need && !p.d.includes(x.id)) { setProg(p); rerender(); break; }
      setProg(p); rerender(); break;
    }
    case 'stuck': openStuck(); break;
    case 'still': stuckAll = true; openStuck(); break;
    case 'unstuck': layer.querySelector('#g-stuck').hidden = true; break;
    case 'video': video(b.dataset.v, +b.dataset.t || 0); break;
    case 'vclose': { const v = layer.querySelector('#g-video'); v.innerHTML = ''; v.hidden = true; break; }
    case 'again': setProg({ d: [], t: {}, s: 0 }); render(); break;
    case 'pw': C.paywall(); break;
    case 'plat': stopPlay(); sel = {}; plat = plat === 'xbox' ? 'playstation' : 'xbox'; C.haptic(); rerender(); C.event?.('guide_plat', { id: O.id, p: plat }); break;
    case 'shot': openShot(b); break;
    case 'node': stopPlay(); sel[i] = +b.dataset.n; swapScreen(i); break;
    case 'play': playPath(i); break;
    case 'shotx': { const v = layer.querySelector('#g-shotv'); v.innerHTML = ''; v.hidden = true; break; }
    case 'svid': setVideo(+b.dataset.t || 0); break;
    case 'go': closeGuide(); setTimeout(() => C.open?.(b.dataset.k), 60); C.event?.('guide_next', { id: O.id, to: b.dataset.k }); break;
    case 'report': C.toast(s('report_ok')); C.event?.('guide_report', { id: O.id, step: cur(p) + 1 }); break;
  }
}

export function openGuide(o, ctx) {
  if (!o?.how?.st?.length) return false;
  C = ctx; O = o; stuckAll = false; plat = platOf(ctx.platform); sel = {}; stopPlay(); css();
  layer = document.getElementById('guide');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'guide'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick);
  }
  render();
  layer.classList.add('open');
  document.documentElement.classList.add('guide-open');
  const p = prog();
  if (p.d.length || p.s) { requestAnimationFrame(() => toStep(cur(p), false)); wake(true); }
  history.pushState({ guide: 1 }, '');
  C.event?.('guide_open', { id: o.id, from: ctx.from || '' });
  return true;
}
export function closeGuide(fromPop = false) {
  if (!layer?.classList.contains('open')) return false;
  layer.classList.remove('open'); document.documentElement.classList.remove('guide-open');
  const v = layer.querySelector('#g-video'); if (v) { v.innerHTML = ''; v.hidden = true; }
  wake(false);
  C?.onClose?.();
  if (!fromPop && history.state?.guide) history.back();
  return true;
}
export const isOpen = () => !!layer?.classList.contains('open');
addEventListener('popstate', () => { if (isOpen()) closeGuide(true); });
