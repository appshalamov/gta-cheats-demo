// Инструкция «По шагам» (26.11.2026, «Гид по игре», функция 1). Проект — «Гид по игре — пасхалки (26.11.2026)/01 Проект Fable.md»,
// финальное решение — «02 Решение Fable.md». Один экран для всех входов (Новости, «Пасхалки», карта, ссылка): openGuide(o, ctx).
// Телефон лежит рядом с геймпадом: текущий шаг раскрыт под большим пальцем, внизу «Не получается» и «Сделано, дальше».
// У шага: действие, «Получилось, если…», ловушка, крупное значение (код, адрес), список мест с роликом с секунды, «Где в игре».
// Данные — egg.how из data/map/<игра>.json (tools/build_map.py guide_fields). Прогресс — на телефоне (localStorage sb.gd), по id шагов.
// Тот же компонент потом — гид прохождения (req.ty mission/chapter + ref) и предупреждения (miss).

import { view as setView } from './guide-set.js';   // вид «настройки» (guide-settings)

const S = {
  ru: {
    close: 'Закрыть', share: 'Поделиться', whole: 'Весь путь в ролике, {n} минут', whole0: 'Весь путь в ролике', before: 'Перед выездом',
    start: 'Начать', next: 'Сделано, дальше', finish: 'Готово', stuck: 'Не получается', still: 'Всё равно не выходит',
    ok: 'Получилось, если', video_at: 'Ролик с {t}', in_game: 'Где в игре', not_this: 'Не {c}', of: 'из',
    tags_n: '{a} из {b}', alt: 'Обходной путь (глитч)', sources: 'Источники', report: 'Сообщить об ошибке', report_ok: 'Спасибо, проверим',
    self: 'Прошли сами {d}', collected: 'Собрано по {n} источникам, сами пока не проходили', one: 'Один источник: {s}. Проверяем',
    wall: 'Дальше в Pro: шаги {a}–{b}, точные места и разбор ошибок', get_pro: 'Оформить Pro',
    fin_car: 'Готово. Машина ваша.', fin: 'Готово. Всё получилось.', again: 'Начать заново',
    meta: '{n} шагов, около {m} минут', meta0: '{n} шагов', missable: 'Можно упустить навсегда', no_fix: 'Для этого шага частых ошибок нет. Посмотрите ролик или общий список.',
    en_only: 'Инструкция на английском', offline: 'Ролики работают с сетью',
    path_meta: '{n} шагов, около {m} минут', patch: 'могут закрыть патчем', quiet: 'Как заехать тихо', bugPart: 'Баг: сквозь дверь гаража',
    questPart: 'Квест No Flusher', finPart: 'Гараж и регистрация', frame: 'кадр: {by}, YouTube', zoom: 'Открыть кадр',
  },
  en: {
    close: 'Close', share: 'Share', whole: 'Watch the whole route, {n} min', whole0: 'Watch the whole route', before: 'Before you go',
    start: 'Start', next: 'Done, next', finish: 'Finish', stuck: "I'm stuck", still: 'Still stuck',
    ok: 'It worked if', video_at: 'Video from {t}', in_game: 'In game', not_this: 'Not {c}', of: 'of',
    tags_n: '{a} of {b}', alt: 'Shortcut (glitch)', sources: 'Sources', report: 'Report a mistake', report_ok: "Thanks, we'll check",
    self: 'We did it ourselves on {d}', collected: 'Collected from {n} sources, not yet tested by us', one: 'Single source: {s}. Checking',
    wall: 'The rest is in Pro: steps {a}–{b}, exact spots and fixes', get_pro: 'Get Pro',
    fin_car: 'Done. The car is yours.', fin: 'Done. You made it.', again: 'Start over',
    meta: '{n} steps, about {m} min', meta0: '{n} steps', missable: 'Missable', no_fix: 'No common mistakes for this step. Watch the video or the full list.',
    en_only: 'Guide in English', offline: 'Videos need a connection',
    path_meta: '{n} steps, about {m} min', patch: 'may be patched out', quiet: 'Get in quietly', bugPart: 'Bug: through the garage door',
    questPart: 'No Flusher quest', finPart: 'Garage and registration', frame: 'frame: {by}, YouTube', zoom: 'Open frame',
  },
};
const KEY = 'sb.gd', FIRST = 'sb.gd1';
let C = null, O = null, layer = null, lock = null, stuckAll = false;
let V = null;   // вид листа не «шаги» (settings) — свой модуль guide-set.js

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
function prog() { const p = read()[kOf(O)] || {}; return { d: p.d || [], t: p.t || {}, s: p.s || 0, o: p.o, path: p.path }; }
function setProg(p) { try { const all = read(); all[kOf(O)] = { ...p, at: Date.now() }; localStorage.setItem(KEY, JSON.stringify(all)); } catch { } }
// для строк ленты и шторки на карте: сколько шагов пройдено (0 — не начато)
export function progressOf(o) { const p = read()[kOf(o)]; return p ? (o.how?.st || []).filter((x) => (p.d || []).includes(x.id)).length + (p.s ? 0.001 : 0) : 0; }

const H = () => O.how;
// путь (квест / баг): выбор хранится в прогрессе (p.path); по умолчанию — первый путь (сильнее строка доверия, решение «система гида»)
const PATH = () => { const h = H(); if (!h.pa?.length) return { st: h.st }; const id = prog().path; return h.pa.find((x) => x.id === id) || h.pa[0]; };
const STEPS = () => (V ? V.list() : PATH().st);   // V — вид «настройки» (guide-set.js): свой список шагов
// Pro (решение Fable): бесплатно целиком — первая начатая инструкция, пробные дни, вход по ссылке, короткие (≤ 3 шагов) и отсылки
function firstFree() { try { const f = localStorage.getItem(FIRST); return !f || f === kOf(O); } catch { return true; } }
const free = () => !!V?.free || C.access() !== 'locked' || !!C.linked || STEPS().length <= 3 || O.k === 'reference' || firstFree();
const shut = (i) => !free() && i >= (H().fr ?? 2);
const cur = (p) => { const st = STEPS(); const i = st.findIndex((x) => !p.d.includes(x.id)); return i < 0 ? st.length : i; };

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
    ${x.img && C.frames !== false ? `<figure class="g-img"><button data-g="zoom" data-src="${esc(C.imgUrl(x.img.f))}" aria-label="${esc(s('zoom'))}"><img src="${esc(C.imgUrl(x.img.f))}" alt="" loading="lazy" decoding="async"></button>${x.img.by ? `<figcaption>${esc(s('frame', { by: x.img.by }))}</figcaption>` : ''}</figure>` : ''}
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
// две строки-пути под заголовком (решение 09): выбранная — акцентом; у бага янтарная пометка «могут закрыть патчем»
function pathsHTML(h, cur) {
  return `<div class="g-paths">${h.pa.map((x) => `<button class="g-path${x.id === cur.id ? ' on' : ''}" data-g="path" data-v="${esc(x.id)}" aria-pressed="${x.id === cur.id}">
    <b>${esc(tx(x.t))}</b><span>${esc(x.min ? s('path_meta', { n: x.st.length, m: x.min }) : s('meta0', { n: x.st.length }))}${x.bug ? `, <em>${esc(s('patch'))}</em>` : ''}</span></button>`).join('')}</div>
    ${cur.bug && cur.nt ? `<p class="g-miss">${C.I.alert}<span>${esc(tx(cur.nt))}</span></p>` : ''}`;
}
// заголовок части листа: «Как заехать тихо» → «Баг» / «Квест» → «Гараж и регистрация»
function partHTML(path, st, i) {
  if (!path.id) return '';
  const pt = st[i].pt || '', prev = i ? st[i - 1].pt || '' : null;
  if (prev === pt) return '';
  const first = st.findIndex((x) => (x.pt || '') === pt) === i && i === 0;
  const label = pt === 'quiet' ? s('quiet') : path.id === 'bug' ? s('bugPart') : (i === 0 || first) ? s('questPart') : s('finPart');
  return `<li class="g-part"><h2>${esc(label)}</h2></li>`;
}
function stuckHTML(ci) {
  const h = H(), st = STEPS(), x = st[ci];
  const mine = (h.fx || []).filter((f) => x && (f.s || []).includes(x.id));
  const all = (h.fx || []).filter((f) => !mine.includes(f));
  return `<div class="g-fix">${mine.length ? mine.map((f) => `<p>${esc(tx(f.t))}</p>`).join('') : `<p>${esc(s('no_fix'))}</p>`}
    ${all.length || h.alt ? (stuckAll ? all.map((f) => `<p>${esc(tx(f.t))}</p>`).join('') + (h.alt ? `<p><b>${esc(s('alt'))}.</b> ${esc(tx(h.alt.t))}${h.alt.nt ? ` ${esc(tx(h.alt.nt))}` : ''}</p>${h.alt.v ? `<button class="g-tb" data-g="video" data-v="${esc(h.alt.v[0])}" data-t="${h.alt.v[1]}">${C.I.play}<span>${esc(s('video_at', { t: mmss(h.alt.v[1]) }))}</span></button>` : ''}` : '')
      : `<button class="g-link" data-g="still">${esc(s('still'))}</button>`) : ''}</div>`;
}
function render() {
  if (V) { V.render(); return; }
  const h = H(), p = prog(), st = STEPS(), path = PATH(), I = C.I, ci = cur(p), started = p.d.length > 0 || p.s;
  const fr = h.fr ?? 2, wall = !free() && fr < st.length ? fr : -1;
  const sn = O.sn || [], one = O.st === 'one' || sn.length === 1;
  const trust = h.self ? s('self', { d: C.date(h.self) }) : one && sn.length ? s('one', { s: sn[0] }) : sn.length ? s('collected', { n: sn.length }) : '';
  const enOnly = !['ru', 'en'].includes(C.lang) && !st[0].t[C.lang];
  layer.innerHTML = `<div class="g-scroll" id="g-scroll">
    <header class="g-top"><button class="g-ib" data-g="close" aria-label="${esc(s('close'))}">${I.chevron}</button>
      <button class="g-ib" data-g="share" aria-label="${esc(s('share'))}">${I.share}</button></header>
    <h1 class="g-h1">${esc(tx(h.ta) || tx(O.t))}</h1>
    ${h.rw ? `<p class="g-rw">${esc(tx(h.rw))}</p>` : ''}
    ${h.pa?.length ? pathsHTML(h, path) : `<p class="g-meta">${esc(h.min ? s('meta', { n: st.length, m: h.min }) : s('meta0', { n: st.length }))}</p>`}
    ${trust ? `<p class="g-trust${one && !h.self ? ' g-trust-one' : ''}">${one && !h.self ? '' : I.check}<span>${esc(trust)}</span></p>` : ''}
    ${enOnly ? `<p class="g-meta">${esc(s('en_only'))}</p>` : ''}
    ${h.wh ? `<button class="g-link g-whole" data-g="video" data-v="${esc(h.wh[0])}" data-t="${h.wh[1]}">${I.play}<span>${esc(h.wh[2] ? s('whole', { n: h.wh[2] }) : s('whole0'))}</span></button>` : ''}
    ${h.miss ? `<p class="g-miss">${I.alert}<span>${esc(s('missable'))}${typeof h.miss === 'object' ? `. ${esc(tx(h.miss))}` : ''}</span></p>` : ''}
    ${h.req?.length ? `<section class="g-sec"><h2>${esc(s('before'))}</h2><ul class="g-req">${h.req.slice(0, 3).map((r) => `<li>${esc(tx(r.t))}</li>`).join('')}</ul></section>` : ''}
    <ol class="g-steps">${st.map((x, i) => partHTML(path, st, i) + (i === wall ? `<li class="g-wall"><p>${esc(s('wall', { a: fr + 1, b: st.length }))}</p><button class="g-pro" data-g="pw">${esc(s('get_pro'))}</button></li>` : '')
      + stepHTML(x, i, p, (started && i === ci) || p.o === i)).join('')}</ol>
    ${ci >= st.length ? `<p class="g-fin">${I.check}<span>${esc(O.k === 'vehicle' ? s('fin_car') : s('fin'))}</span></p>` : ''}
    ${C.after?.(O) || ''}
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
function barHTML(p, ci) {
  const st = STEPS(), started = p.d.length > 0 || p.s;
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
  const a = b.dataset.g, p = prog(), st = STEPS(), i = +b.dataset.i;
  if (V?.click(a, b, i)) return;
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
    case 'path': if (p.path !== b.dataset.v) { C.haptic(); p.path = b.dataset.v; delete p.o; setProg(p); rerender(); C.event?.('guide_path', { id: O.id, path: p.path }); } break;
    case 'zoom': { const v = layer.querySelector('#g-video'); v.innerHTML = `<div class="g-vbox"><button class="g-ib g-vx" data-g="vclose" aria-label="${esc(s('close'))}">${C.I.close}</button><img class="g-zoom" src="${esc(b.dataset.src)}" alt=""></div>`; v.hidden = false; break; }
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
    case 'again': setProg({ d: [], t: {}, s: 0, path: p.path }); render(); break;
    case 'pw': C.paywall(); break;
    case 'report': C.toast(s('report_ok')); C.event?.('guide_report', { id: O.id, step: cur(p) + 1 }); break;
  }
}

export function openGuide(o, ctx) {
  if (!o?.how?.st?.length) return false;
  C = ctx; O = o; stuckAll = false; css();
  V?.stop(); V = o.how.vw === 'settings' ? setView({ C, O, layer: () => layer, prog, s, tx, esc, mmss, rerender, closeGuide }) : null;
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
  wake(false); V?.stop();
  C?.onClose?.();
  if (!fromPop && history.state?.guide) history.back();
  return true;
}
export const isOpen = () => !!layer?.classList.contains('open');
addEventListener('popstate', () => { if (isOpen()) closeGuide(true); });
