// Вид «настройки» листа «По шагам» (26.11.2026, «Гид по игре», функция «Советы по настройкам»; решения — 09 п. 6 и «Решение Fable — система гида»).
// Шаг = один пункт меню игры: имя по-человечески, название как в игре, крупное значение, «Зачем», один экран-схема меню на шаг
// и путь строками со значками кнопок выбранной платформы (тап по строке — её экран, «Показать по шагам» листает сам), свой ролик с главы шага,
// смена PlayStation ⇄ Xbox внутри совета, финал с «Дальше». Модель меню и путь — js/guide-menu.js, данные — data/guide/<игра>-settings.json.
// Подключается к js/guide.js (владелец — сборщик гида) семью крючками: view() в openGuide, render, free, cur, onClick, closeGuide.
import { pathTo, screenHTML, key, keyHTML, platOf, fitScreens } from './guide-menu.js';

const SS = {
  ru: {
    set_meta: '{n} настроек, около {m} минут', for_plat: 'Для {p}.', show_for: 'Показать для {p}', pc_note: 'На ПК меню то же, кнопки — как на PlayStation.',
    open_set: 'Откройте настройки', a_pause: 'Нажмите {k}, игра встанет на паузу', a_pick: 'Нажмите {k} на «{to}»', a_tab: '{k} до вкладки «{to}»',
    a_tab_n: '{k} {n} раза до вкладки «{to}»', a_move: '{k} до пункта «{to}»', a_set: '{k} до значения «{to}»',
    why: 'Зачем', was: 'По умолчанию {v}', ps_only: 'Только PlayStation', fin_set: 'Готово. Настройки на месте.', up_next: 'Дальше',
    shot_cap: 'Схема меню, наша. Названия пунктов как в игре.', unsure: 'Кнопки Xbox сверяем с записью меню', video_set: 'Весь путь в ролике, {n}', video_step: 'Ролик с {t}',
    show_path: 'Показать по шагам', w_select: 'Выбрать', w_back: 'Назад', w_reset: 'Сброс', src_n: 'Источники: {s}', hyp: 'Совет по общим правилам, в гайдах по GTA 6 не проверен',
    upd: 'Сверено с гайдами {d}. Сверим после патча', upd_v: 'Сверено для версии {v}, {d}. Сверим после патча',
  },
  en: {
    set_meta: '{n} settings, about {m} min', for_plat: 'For {p}.', show_for: 'Show for {p}', pc_note: 'On PC the menu is the same; buttons shown for PlayStation.',
    open_set: 'Open Settings', a_pause: 'Press {k} to pause the game', a_pick: 'Press {k} on “{to}”', a_tab: '{k} to the “{to}” tab',
    a_tab_n: '{k} {n} times to the “{to}” tab', a_move: '{k} to “{to}”', a_set: '{k} to “{to}”',
    why: 'Why', was: 'Default {v}', ps_only: 'PlayStation only', fin_set: 'Done. Your settings are set.', up_next: 'Up next',
    shot_cap: 'Our menu diagram. Item names as in the game.', unsure: 'Xbox buttons being checked against a menu recording', video_set: 'Whole route on video, {n}', video_step: 'Video from {t}',
    show_path: 'Play the steps', w_select: 'Select', w_back: 'Back', w_reset: 'Defaults', src_n: 'Sources: {s}', hyp: 'General advice, not yet checked in GTA 6 guides',
    upd: 'Checked against guides on {d}. We re-check after each patch', upd_v: 'Checked for version {v}, {d}. We re-check after each patch',
  },
};
const PN = { playstation: 'PlayStation', xbox: 'Xbox' };

// A — что даёт guide.js: { C, O, layer(), prog(), s(k, v), tx, esc, mmss, rerender(), closeGuide() }
export function view(A) {
  const { C, O, tx, esc, mmss } = A;
  const H = () => O.how, M = () => H().menu;
  const s = (k, v = {}) => { const t = (SS[C.lang] || SS.en)[k] ?? SS.en[k]; if (t == null) return A.s(k, v); let x = t; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
  let plat = platOf(C.platform), sel = {}, playT = null;
  const list = () => H().st.filter((x) => !x.only || x.only === plat);
  const W = () => ({ lab: tx, w: { select: s('w_select'), back: s('w_back'), reset: s('w_reset') } });
  const L = () => A.layer();

  function lineHTML(nd, i, si, on) {
    const k = key(M(), plat, nd.btn), kh = keyHTML(k);
    const ph = { pause: 'a_pause', pick: 'a_pick', tab: nd.n > 1 ? 'a_tab_n' : 'a_tab', move: 'a_move', set: 'a_set' }[nd.act];
    const txt = esc(s(ph, { k: '\u0001', to: tx(nd.lab) || nd.to, n: nd.n })).replace('\u0001', kh || esc(k?.tok || ''));
    return `<li class="gs-line${on ? ' on' : ''}" data-g="node" data-i="${si}" data-n="${i}"><span class="gs-dot"></span><p class="gs-act">${txt}</p></li>`;
  }
  function stepHTML(x, i, p, open, first) {
    const I = C.I, done = p.d.includes(x.id), n = i + 1;
    const cls = `g-step gs-step${done ? ' is-done' : ''}${open ? ' is-cur' : ''}`;
    const val = `<span class="gs-val">${esc(tx(x.val))}</span>`;
    if (!open) return `<li class="${cls}" data-g="open" data-i="${i}"><span class="g-num">${done ? I.check : n}</span><p class="g-t">${esc(tx(x.hn) || tx(x.t))}</p>${val}</li>`;
    const nodes = pathTo(M(), x.it, x.set);
    // общее начало «пауза → настройки» целиком только в первом шаге, дальше одной строкой «Откройте настройки»
    const from = first ? 0 : 2, nd = nodes[Math.max(from, Math.min(sel[i] ?? nodes.length - 1, nodes.length - 1))];
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
    // строка «Дальше» — только на то, что приложение умеет открыть (C.canOpen; walk:… появится с «Прохождением»)
    const nx = (H().next || []).filter((q) => (C.canOpen ? C.canOpen(q.k) : true)); if (!nx.length) return '';
    return `<section class="g-sec gs-next"><h2>${esc(s('up_next'))}</h2>${nx.map((q) => `<button class="gs-nx" data-g="go" data-k="${esc(q.k)}"><b>${esc(tx(q.t))}</b>${q.s ? `<small>${esc(tx(q.s))}</small>` : ''}${C.I.chevron}</button>`).join('')}</section>`;
  }
  function barHTML(p, ci, st) {
    const started = p.d.length > 0 || p.s;
    if (!started) return `<button class="g-main" data-g="start">${esc(s('start'))}</button>`;
    if (ci >= st.length) return `<button class="g-sub" data-g="again">${esc(s('again'))}</button><button class="g-main" data-g="close">${esc(s('finish'))}</button>`;
    return `<button class="g-main" data-g="next">${esc(ci === st.length - 1 ? s('finish') : s('next'))}</button>`;
  }
  function render() {
    const h = H(), I = C.I, p = A.prog(), st = list(), all = h.st;
    const ci = (() => { const k = st.findIndex((x) => !p.d.includes(x.id)); return k < 0 ? st.length : k; })(), started = p.d.length > 0 || p.s;
    const other = plat === 'xbox' ? 'playstation' : 'xbox';
    const vid = h.vid?.[plat], trust = (O.sn || []).length ? s('collected', { n: O.sn.length }) : '';
    const unsure = (M().btn.st?.[plat] || 'ok') !== 'ok';
    const upd = h.upd ? (h.gv ? s('upd_v', { v: h.gv, d: C.date(h.upd) }) : s('upd', { d: C.date(h.upd) })) : '';
    L().innerHTML = `<div class="g-scroll gs" id="g-scroll">
      <header class="g-top"><button class="g-ib" data-g="close" aria-label="${esc(s('close'))}">${I.chevron}</button>
        <button class="g-ib" data-g="share" aria-label="${esc(s('share'))}">${I.share}</button></header>
      <h1 class="g-h1">${esc(tx(h.ta))}</h1>
      ${h.rw ? `<p class="g-rw">${esc(tx(h.rw))}</p>` : ''}
      <p class="g-meta">${esc(s('set_meta', { n: st.length, m: h.min || Math.max(2, Math.round(st.length * 0.7)) }))}</p>
      <p class="gs-plat">${esc(s('for_plat', { p: PN[plat] }))} <button class="g-link" data-g="plat">${esc(s('show_for', { p: PN[other] }))}</button></p>
      ${!['playstation', 'xbox'].includes(C.platform) ? `<p class="g-note">${esc(s('pc_note'))}</p>` : ''}
      ${unsure ? `<p class="g-note gs-unsure">${esc(s('unsure'))}</p>` : ''}
      ${trust ? `<p class="g-trust">${I.check}<span>${esc(trust)}</span></p>` : ''}
      ${upd ? `<p class="g-note gs-upd">${esc(upd)}</p>` : ''}
      ${vid ? `<button class="g-link g-whole" data-g="svid" data-t="0">${I.play}<span>${esc(s('video_set', { n: vid.len }))}</span></button>` : ''}
      <ol class="g-steps">${st.map((x, i) => stepHTML(x, i, p, (started && i === ci) || p.o === i, i === 0 || all.indexOf(x) === 0)).join('')}</ol>
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
    <footer class="g-bar">${barHTML(p, ci, st)}</footer>
    <div class="g-video" id="g-video" hidden></div>`;
    requestAnimationFrame(() => fitScreens(L()));
  }
  // сменить экран шага без перерисовки всего слоя (строка пути → её экран)
  function swap(i) {
    const li = L().querySelector(`.gs-step[data-i="${i}"]`); if (!li) return;
    const x = list()[i], nodes = pathTo(M(), x.it, x.set), n = Math.max(i === 0 ? 0 : 2, Math.min(sel[i] ?? nodes.length - 1, nodes.length - 1));
    li.querySelector('.gs-shot').innerHTML = screenHTML(M(), plat, nodes[n].scr, W());
    li.querySelectorAll('.gs-line[data-n]').forEach((e) => e.classList.toggle('on', +e.dataset.n === n));
    fitScreens(li);
  }
  function stop() { clearInterval(playT); playT = null; }
  function play(i) {
    stop();
    const x = list()[i], nodes = pathTo(M(), x.it, x.set); let n = i === 0 ? 0 : 2;
    sel[i] = n; swap(i); C.event?.('guide_play', { id: O.id, step: i + 1 });
    playT = setInterval(() => { n++; if (n >= nodes.length || !L().classList.contains('open')) { stop(); return; } sel[i] = n; swap(i); }, 1300);
  }
  // экран меню на весь экран: 16:9 во всю ширину, ниже — подпись действия
  function shot(b) {
    const v = L().querySelector('#g-shotv'), act = b.closest('.g-body')?.querySelector('.gs-line.on .gs-act')?.innerHTML || '';
    v.innerHTML = `<button class="g-ib g-vx" data-g="shotx" aria-label="${esc(s('close'))}">${C.I.close}</button><div class="gs-big">${b.innerHTML}</div><p class="gs-act">${act}</p><p class="g-note">${esc(s('shot_cap'))}</p>`;
    v.hidden = false; fitScreens(v);
  }
  // свой ролик прохода по меню (mp4 со своего хостинга, {l} — язык), с главы шага
  function video(t) {
    const vd = H().vid?.[plat]; if (!vd) return;
    const v = L().querySelector('#g-video');
    v.innerHTML = `<div class="g-vbox"><button class="g-ib g-vx" data-g="vclose" aria-label="${esc(s('close'))}">${C.I.close}</button>
      <div class="g-vf"><video src="${esc(vd.src.replace('{l}', C.lang === 'ru' ? 'ru' : 'en'))}#t=${t}" ${vd.poster ? `poster="${esc(vd.poster)}"` : ''} controls autoplay playsinline muted preload="metadata"></video></div></div>`;
    v.hidden = false;
    C.event?.('guide_video', { id: O.id, v: plat, t });
  }
  // свои действия; true — обработано (общие start/next/open/again/close/share/report/vclose — у guide.js)
  function click(a, b, i) {
    switch (a) {
      case 'plat': stop(); sel = {}; plat = plat === 'xbox' ? 'playstation' : 'xbox'; C.haptic(); A.rerender(); C.event?.('guide_plat', { id: O.id, p: plat }); return true;
      case 'shot': shot(b); return true;
      case 'node': stop(); sel[i] = +b.dataset.n; swap(i); return true;
      case 'play': play(i); return true;
      case 'shotx': { const v = L().querySelector('#g-shotv'); v.innerHTML = ''; v.hidden = true; return true; }
      case 'svid': video(+b.dataset.t || 0); return true;
      case 'go': C.open?.(b.dataset.k); C.event?.('guide_next', { id: O.id, to: b.dataset.k }); return true;
      case 'open': case 'next': case 'again': stop(); return false;
    }
    return false;
  }
  return { list, render, click, stop, free: true };
}
