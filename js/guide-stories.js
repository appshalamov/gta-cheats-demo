// Вид «сторис» листа «По шагам» (27.11.2026, черновик для решения Fable; Игорь: «минимум текста, больше визуала, листать как сторис,
// два способа переключать проще; не писать про патч — показывать статус бага»). Включается данными: how.vw === 'stories' (Bugatti первая).
// Первый экран — обложка, заголовок и награда в одну строку, переключатель «Квест / Баг» со статусом бага, «Начать».
// Дальше карточки: «Перед выездом» (значки) → шаги (кадр на всю карточку, одна строка действия, «Подробнее» — шторка) → «Готово» + «Дальше».
// Тап справа — вперёд, слева — назад, свайп вбок — то же, свайп вниз — к обложке; «Сделано» отмечает шаг. Позиция карточки — своя у каждого способа
// (sb.gd: p.k = {quest: 3, bug: 1}). Домен sbgta.app — в верхней строке каждой карточки и обложки (навык domen-na-ekranah).
// Подключается к js/guide.js крючками вида (как guide-set.js): list, render, click, stop.

const SS = {
  ru: {
    min: '{m} мин', go: 'Начать', cont: 'Продолжить', works: 'Работает', broken: 'Не работает с {d}', checked: 'проверено {d}',
    ready: 'Всё есть', done: 'Сделано', more: 'Подробнее', sway: 'Сменить способ', fin_t: 'Готово', fin_car: 'Машина ваша', fin_ok: 'Всё получилось', tags_t: 'Метки No Flusher',
    tap_tag: 'Метка {n}', step_of: 'Шаг {a} из {b}', to_cover: 'К обложке', ways_aria: 'Способ', lock_t: 'Дальше в Pro',
    mon: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  },
  en: {
    min: '{m} min', go: 'Start', cont: 'Continue', works: 'Works', broken: 'Broken since {d}', checked: 'checked {d}',
    ready: 'Got it all', done: 'Done', more: 'Details', sway: 'Switch way', fin_t: 'Done', fin_car: 'The car is yours', fin_ok: 'You made it', tags_t: 'No Flusher tags',
    tap_tag: 'Tag {n}', step_of: 'Step {a} of {b}', to_cover: 'Back to cover', ways_aria: 'Way', lock_t: 'The rest is in Pro',
    mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
};
const DOM = 'sbgta.app';
const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
// значки «Перед выездом» (в icons.js таких нет): пистолет с глушителем, машина; телефон и деньги — из общего набора
const IC = {
  gun: sv('<path d="M2 8.5h16.5V12H12l-1 2.5H8L9 12H4.5z"/><path d="M9.5 14.5 8.5 19H5l1.4-5.5"/><path d="M18.5 9.2H22v2.1h-3.5"/>'),
  car: sv('<path d="M3.5 16.5V13l2-4.5h13l2 4.5v3.5"/><path d="M3.5 13h17"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>'),
};

let live = null, bound = null;   // один слой #guide на всё время: слушатели касаний вешаем один раз, работают с последним видом

export function view(A) {
  const { C, O, tx, esc, mmss } = A;
  const s = (k, v = {}) => { const t = (SS[C.lang] || SS.en)[k] ?? SS.en[k]; if (t == null) return A.s(k, v); let x = t; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
  const H = () => O.how, PA = () => H().pa || [];
  const L = () => A.layer();
  // Игорь 27.11: лист всегда открывается сверху — сторис всегда с обложки, на ней «Продолжить: шаг N»
  let mode = 'cover', sheet = false, fixAll = false, touch = null;

  const path = () => A.PATH();
  const list = () => path().st || [];
  const date = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return ''; const mo = s('mon')[+m[2] - 1]; return C.lang === 'ru' ? `${+m[3]} ${mo}` : `${mo} ${+m[3]}`; };
  // карточки: 0 — «Перед выездом» (если есть), дальше шаги, последняя — «Готово»
  const hasReq = () => !!(path().req || H().req || []).length;
  const off = () => (hasReq() ? 1 : 0);
  const last = () => list().length + off();
  function kGet() {
    const p = A.prog(), k = p.k?.[path().id || 'one'];
    if (Number.isInteger(k)) return Math.max(0, Math.min(k, last()));
    const st = list(), i = st.findIndex((x) => !p.d.includes(x.id));   // первая не отмеченная — для старых прогрессов без p.k (v2)
    return p.d.length ? (i < 0 ? last() : i + off()) : 0;
  }
  function kSet(k, p = A.prog()) { p.k = { ...(p.k || {}), [path().id || 'one']: k }; A.setProg(p); return p; }

  // кадр обрезается по высоте карточки: держим x центра кольца (img.fx) посередине, без выхода за края кадра
  function focus() {
    L().querySelectorAll('img[data-fx]').forEach((im) => {
      const box = im.parentElement, W = box.clientWidth, Hh = box.clientHeight, r = (im.naturalWidth / im.naturalHeight) || 16 / 9;
      const iw = Hh * r; if (!W || !Hh || iw <= W) { im.style.objectPosition = '50% 50%'; return; }
      const offx = Math.min(0, Math.max(W - iw, W / 2 - (+im.dataset.fx) * iw));
      im.style.objectPosition = `${(offx / (W - iw)) * 100}% 50%`;
    });
  }
  // заголовок и награда — одна строка: ужимаем шрифт, пока не влезет (не ниже 70 %)
  function fit() {
    L().querySelectorAll('[data-fit]').forEach((el) => {
      el.style.fontSize = ''; const f0 = parseFloat(getComputedStyle(el).fontSize); let f = f0;
      while (el.scrollWidth > el.clientWidth + 1 && f > f0 * 0.7) { f -= 0.5; el.style.fontSize = `${f}px`; }
    });
  }
  const img = (x, cls = '') => `<img class="${cls}" src="${esc(C.imgUrl(x.f))}" alt="" decoding="async" data-fx="${x.fx ?? 0.5}">`;
  // домен (навык domen-na-ekranah): та же марка, что в шапке списка (.sb-brand) — знак SB, Secret Base, sbgta.app; на кадре шторки — .sb-wm
  const wm = `<span class="sb-brand st-brand" aria-hidden="true"><img src="icons/brand-mark.svg" alt="" width="22" height="16"><span><b>Secret Base</b><small>${DOM}</small></span></span>`;

  // ── первый экран ──
  function statusHTML(x) {
    if (!x.sta) return '';
    return x.sta.ok ? `<span class="sc-st is-ok"><i></i>${esc(s('works'))}</span><small>${esc(s('checked', { d: date(x.sta.d) }))}</small>`
      : `<span class="sc-st is-bad"><i></i>${esc(s('broken', { d: date(x.sta.d) }))}</span>`;
  }
  function coverHTML() {
    const h = H(), cur = path(), p = A.prog(), I = C.I;
    const ways = PA().length > 1 ? `<div class="sc-ways" role="radiogroup" aria-label="${esc(s('ways_aria'))}">${PA().map((x) => `<button class="sc-way${x.id === cur.id ? ' on' : ''}" role="radio" data-g="path" data-v="${esc(x.id)}" aria-checked="${x.id === cur.id}">
      <b>${esc(tx(x.sh) || tx(x.t))}</b><span>${esc(x.min ? s('min', { m: x.min }) : '')}</span>${statusHTML(x)}</button>`).join('')}</div>` : '';
    return `<div class="sc">
      <div class="sc-media">${O.cv ? `<img src="${esc(C.imgUrl(O.cv.f))}" alt="" decoding="async" fetchpriority="high" data-fx="0.36">${O.cv.by ? `<span class="st-by">${esc(O.cv.by)}</span>` : ''}` : ''}</div>
      <header class="st-row sc-top"><button class="g-ib st-ib" data-g="close" aria-label="${esc(s('close'))}">${I.back}</button>${wm}
        <button class="g-ib st-ib" data-g="share" aria-label="${esc(s('share'))}">${I.share}</button></header>
      <div class="sc-body">
        <h1 class="g-h1 sc-h1" data-fit>${esc(tx(h.ta) || tx(O.t))}</h1>
        ${h.sb || h.rw ? `<p class="sc-rw" data-fit>${esc(tx(h.sb) || tx(h.rw))}</p>` : ''}
        ${ways}
      </div>
      <footer class="g-bar st-bar"><button class="g-main" data-g="sgo">${esc(!p.s ? s('go') : kGet() >= off() && kGet() < last() ? A.s('resume', { n: kGet() - off() + 1 }) : s('cont'))}</button></footer>
    </div>`;
  }

  // ── карточки ──
  function barsHTML(k) {
    const st = list(), p = A.prog(), i = k - off();
    return `<div class="st-bars" aria-hidden="true">${st.map((x, j) => `<i class="${p.d.includes(x.id) ? 'on' : ''}${j === i ? ' cur' : ''}"></i>`).join('')}</div>`;
  }
  function topHTML(k) {
    const cur = path(), two = PA().length > 1, dot = cur.sta ? `<i class="st-dot ${cur.sta.ok ? 'is-ok' : 'is-bad'}"></i>` : '';
    return `<div class="st-top">${barsHTML(k)}<div class="st-row">
      ${two ? `<button class="st-way" data-g="sway" aria-label="${esc(s('sway'))}">${dot}<b>${esc(tx(cur.sh) || tx(cur.t))}</b>${C.I.swap}</button>` : '<span></span>'}
      ${wm}<button class="g-ib st-ib" data-g="sclose" aria-label="${esc(s('to_cover'))}">${C.I.close}</button></div></div>`;
  }
  function reqCard() {
    const rq = (path().req || H().req || []).slice(0, 3), bg = list().find((x) => x.img)?.img;
    return `<div class="st-card st-plain" data-g="stap">${bg ? `<div class="st-bg">${img(bg)}</div>` : ''}
      <div class="st-mid"><h2 class="st-h">${esc(s('before'))}</h2>
        <ul class="st-req">${rq.map((r) => `<li>${IC[r.ic] || C.I[{ phone: 'phone', cash: 'wallet' }[r.ic]] || C.I.check}<span>${esc(tx(r.s) || tx(r.t))}</span></li>`).join('')}</ul>
        <button class="st-more" data-g="smore" aria-haspopup="dialog"><span>${esc(s('more'))}</span>${C.I.chevron}</button></div>
      <footer class="g-bar st-bar"><button class="g-main" data-g="snext">${esc(s('ready'))}</button></footer></div>`;
  }
  function tagsCard(x, i) {
    const got = A.prog().t[x.id] || [], bg = [...list().slice(0, i)].reverse().find((y) => y.img)?.img;
    return `<div class="st-card st-plain" data-g="stap">${bg ? `<div class="st-bg">${img(bg)}</div>` : ''}
      <div class="st-mid"><h2 class="st-h">${A.rich(x.hd || { ru: s('tags_t'), en: s('tags_t') })}</h2>
        <p class="g-tn st-count"><b>${Math.min(got.length, x.need)}</b> ${esc(A.s('of'))} ${x.need}</p>
        ${x.n?.of ? `<p class="st-sub">${esc(A.s('tags_any', { of: x.n.of, need: x.need }))}</p>` : ''}
        <ol class="st-tags">${x.tg.map((q, k) => `<li><button class="${got.includes(k) ? 'on' : ''}" data-g="tag" data-i="${i}" data-k="${k}" aria-pressed="${got.includes(k)}" aria-label="${esc(s('tap_tag', { n: k + 1 }))}">${got.includes(k) ? C.I.check : k + 1}</button></li>`).join('')}</ol>
        <button class="st-more" data-g="smore" aria-haspopup="dialog"><span>${esc(s('more'))}</span>${C.I.chevron}</button></div>
      <footer class="g-bar st-bar"><button class="g-main" data-g="sdone">${esc(s('done'))}</button></footer></div>`;
  }
  function lockCard(i) {
    const fr = H().fr ?? 2, n = list().length;
    return `<div class="st-card st-plain g-wall" data-g="stap"><div class="st-mid"><span class="st-lock">${C.I.lock}</span><h2 class="st-h">${esc(s('lock_t'))}</h2>
      <p class="st-sub">${esc(A.s('wall', { a: fr + 1, b: n }))}</p></div>
      <footer class="g-bar st-bar"><button class="g-main" data-g="pw">${esc(A.s('get_pro'))}</button></footer></div>`;
  }
  function stepCard(x, i) {
    if (A.shut(i)) return lockCard(i);
    if (x.tg?.length) return tagsCard(x, i);
    const done = A.prog().d.includes(x.id);
    return `<div class="st-card" data-g="stap">
      <div class="st-media">${x.img ? img(x.img) : ''}${x.img?.by ? `<span class="st-by">${esc(A.s('frame', { by: x.img.by }))}</span>` : ''}</div>
      <div class="st-txt"><p class="st-hd">${A.rich(x.hd || x.t)}</p>
        ${x.c ? `<p class="g-big st-big">${esc(x.c)}</p>` : x.bv ? `<p class="g-big g-big-t st-big">${esc(x.bv)}</p>` : ''}
        <button class="st-more" data-g="smore" aria-haspopup="dialog"><span>${esc(s('more'))}</span>${C.I.chevron}</button></div>
      <footer class="g-bar st-bar"><button class="g-main${done ? ' is-done' : ''}" data-g="sdone">${done ? C.I.check : ''}<span>${esc(s('done'))}</span></button></footer></div>`;
  }
  function finCard() {
    const p = A.prog(), all = list().every((x) => p.d.includes(x.id));
    return `<div class="st-card st-plain st-fin"><div class="st-mid">
      <span class="st-finck">${C.I.check}</span><h2 class="st-h">${esc(s('fin_t'))}</h2>
      ${all ? `<p class="st-sub st-fin-s">${esc(O.k === 'vehicle' ? s('fin_car') : s('fin_ok'))}</p>` : ''}
      ${A.next(true)}</div>
      <footer class="g-bar st-bar"><button class="g-sub" data-g="sagain">${esc(A.s('again'))}</button><button class="g-main" data-g="close">${esc(A.s('close'))}</button></footer></div>`;
  }
  function cardHTML(k) {
    if (k < off()) return reqCard();
    if (k >= last()) return finCard();
    return stepCard(list()[k - off()], k - off());
  }

  // ── шторка «Подробнее»: кадр целиком, полный текст, «Получилось, если», ролик с секунды, «Не получается» ──
  function moreHTML(k) {
    const I = C.I;
    if (k < off()) {
      const rq = path().req || H().req || [], wh = path().wh || H().wh;
      return `<h2 class="st-sh-h">${esc(s('before'))}</h2><ul class="g-req">${rq.map((r) => `<li>${esc(tx(r.t))}</li>`).join('')}</ul>
        ${wh ? `<button class="g-tb" data-g="video" data-v="${esc(wh[0])}" data-t="${wh[1]}">${I.play}<span>${esc(wh[3] && wh[2] ? A.s('whole_by', { by: wh[3], n: wh[2], u: A.ruMin(wh[2]) }) : A.s('whole0'))}</span></button>` : ''}`;
    }
    const i = k - off(), x = list()[i], p = A.prog(), got = p.t[x.id] || [];
    const fig = x.img ? `<figure class="g-img st-fig"><button data-g="zoom" data-src="${esc(C.imgUrl(x.img.f))}" aria-label="${esc(A.s('zoom'))}"><img src="${esc(C.imgUrl(x.img.f))}" alt="" decoding="async"></button><span class="sb-wm" aria-hidden="true">${DOM}</span>
      ${x.img.cap || x.img.by ? `<figcaption>${x.img.cap ? `<b>${esc(A.s('ring', { c: A.plain(x.img.cap) }))}</b> ` : ''}${x.img.by ? esc(A.s('frame2', { by: x.img.by })) : ''}</figcaption>` : ''}</figure>` : '';
    const tags = x.tg?.length ? `<ol class="g-tags st-tlist">${x.tg.map((q, k2) => `<li class="${got.includes(k2) ? 'on' : ''}">
        <button class="g-tc" data-g="tag" data-i="${i}" data-k="${k2}" aria-pressed="${got.includes(k2)}">${I.check}</button>
        <span>${esc(tx(q.p))}${q.a ? `<small>${esc(q.a)}</small>` : ''}</span>
        ${q.v ? `<button class="g-tv" data-g="video" data-v="${esc(q.v[0])}" data-t="${q.v[1]}" aria-label="${esc(A.s('video_at', { t: mmss(q.v[1]) }))}">${I.play}<span>${mmss(q.v[1])}</span></button>` : ''}</li>`).join('')}</ol>` : '';
    return `${fig}<p class="st-sh-h">${A.rich(x.hd || x.t)}</p><p class="g-tx">${A.rich(x.t)}</p>
      ${x.c ? `<p class="g-big">${esc(x.c)}</p>` : ''}${x.bv ? `<p class="g-big g-big-t">${esc(x.bv)}</p>${x.bn ? `<p class="g-trap">${esc(tx(x.bn))}</p>` : ''}` : ''}
      ${x.tr ? `<p class="g-trap">${A.rich(x.tr)}</p>` : ''}
      ${x.ok ? `<p class="g-ok"><b>${esc(A.s('ok'))}</b> ${A.rich(x.ok).replace(/^(It worked if|Получилось, если)\s*/i, '')}</p>` : ''}
      ${x.tip ? `<p class="g-tip">${A.rich(x.tip)}</p>` : ''}${tags}
      ${x.at ? `<p class="g-at">${I.pin}<span>${esc(A.s('in_game'))}: ${esc(typeof x.at === 'string' ? x.at : tx(x.at))}</span></p>` : ''}
      ${x.v ? `<button class="g-tb" data-g="video" data-v="${esc(x.v[0])}" data-t="${x.v[1]}">${I.play}<span>${esc(A.s('video_at', { t: mmss(x.v[1]) }))}</span></button>` : ''}
      <details class="st-fix"${fixAll ? ' open' : ''}><summary>${esc(A.s('stuck'))}</summary>${A.stuck(i, fixAll)}</details>`;
  }

  function render() {
    const lay = L(); sheet = false;
    if (mode === 'cover') {
      lay.innerHTML = `${coverHTML()}<div class="g-video" id="g-video" hidden></div>`;
    } else {
      const k = kGet();
      lay.innerHTML = `<div class="st" data-k="${k}">${topHTML(k)}${cardHTML(k)}
        <div class="st-scrim" data-g="sless" hidden></div><div class="st-sheet" id="st-sheet" hidden></div></div>
        <div class="g-video" id="g-video" hidden></div>`;
      const nx = list()[k + 1 - off()]?.img; if (nx) { const im = new Image(); im.src = C.imgUrl(nx.f); }   // следующий кадр — заранее
    }
    lay.querySelectorAll('img[data-fx]').forEach((im) => { if (!im.complete) im.addEventListener('load', focus, { once: true }); });
    requestAnimationFrame(() => { focus(); fit(); });
    document.fonts?.ready.then(() => { if (live === api) fit(); });   // шрифт приложения догрузился — строка заголовка шире
  }
  function go(k) {
    const p = kSet(Math.max(0, Math.min(k, last())));
    if (mode !== 'story') mode = 'story';
    render(); return p;
  }
  function openMore() {
    const box = L().querySelector('#st-sheet'); if (!box) return;
    box.innerHTML = `<div class="st-sh-top"><button class="g-ib" data-g="sless" aria-label="${esc(A.s('close'))}">${C.I.close}</button></div><div class="st-sh-in">${moreHTML(kGet())}</div>`;
    box.hidden = false; L().querySelector('.st-scrim').hidden = false; sheet = true;
    C.event?.('guide_more', { id: O.id, k: kGet() });
  }
  function closeMore() { const box = L().querySelector('#st-sheet'); if (box) { box.hidden = true; box.innerHTML = ''; } const sc = L().querySelector('.st-scrim'); if (sc) sc.hidden = true; sheet = false; }
  function done() {
    const k = kGet(), i = k - off(), st = list(), p = A.prog();
    if (i >= 0 && i < st.length) {
      if (A.shut(i)) { C.paywall(); return; }
      if (!p.d.includes(st[i].id)) { p.d.push(st[i].id); A.setProg(p); C.event?.('guide_step', { id: O.id, step: i + 1 }); }
      C.haptic();
    }
    go(k + 1);
  }
  function nav(dir) {
    const k = kGet(), i = k - off();
    if (dir > 0 && i >= 0 && i < list().length && A.shut(i)) return;   // за стеной Pro дальше не листаем
    if (dir < 0 && k === 0) return;
    if (dir > 0 && k >= last()) return;
    go(k + dir);
  }
  function switchWay(id) {
    const ids = PA().map((x) => x.id), cur = path().id;
    const to = id || ids[(ids.indexOf(cur) + 1) % ids.length];
    if (!to || to === cur) return;
    const p = A.prog(); p.path = to; A.setProg(p); C.haptic(); fixAll = false;
    C.event?.('guide_path', { id: O.id, path: to });
    render();
  }

  // жесты: тап по карточке — слева назад, справа вперёд; свайп вбок — то же; свайп вниз — к обложке. Только чтение касаний, без preventDefault:
  // вертикальный свайп у экрана свой (нечего прокручивать), в шторке «Подробнее» — обычная прокрутка (её касания не трогаем)
  function onStart(e) { if (mode !== 'story' || sheet || e.touches.length !== 1 || e.target.closest('.st-sheet, .g-video')) { touch = null; return; } touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }
  function onEnd(e) {
    if (!touch) return; const c = e.changedTouches[0], dx = c.clientX - touch.x, dy = c.clientY - touch.y; touch = null;
    if (dy > 80 && dy > Math.abs(dx) * 1.3) { mode = 'cover'; render(); return; }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) nav(dx < 0 ? 1 : -1);
  }
  function bind() {
    const lay = L(); if (bound === lay) return; bound = lay;
    lay.addEventListener('touchstart', (e) => live?.onStart(e), { passive: true }); lay.addEventListener('touchend', (e) => live?.onEnd(e), { passive: true });
    addEventListener('resize', () => live?.resize());
  }

  const api = {
    stories: true, onStart, onEnd,
    list,
    render() { bind(); render(); },
    stop() { touch = null; sheet = false; if (live === api) live = null; },
    click(a, b, i, ev) {
      switch (a) {
        case 'path': if (mode === 'cover') { switchWay(b.dataset.v); return true; } return false;
        case 'sgo': {
          const p = A.prog(); if (!p.s) { p.s = 1; A.setProg(p); A.first(); C.event?.('guide_start', { id: O.id }); }
          C.haptic(); A.wake(true); mode = 'story'; go(kGet()); return true;
        }
        case 'sway': switchWay(); return true;
        case 'sclose': mode = 'cover'; render(); return true;
        case 'stap': { const r = b.getBoundingClientRect(), x = (ev?.clientX ?? r.right) - r.left; nav(x < r.width / 3 ? -1 : 1); return true; }
        case 'snext': go(kGet() + 1); return true;
        case 'sdone': done(); return true;
        case 'smore': openMore(); return true;
        case 'sless': closeMore(); return true;
        case 'sagain': { const p = A.prog(); A.setProg({ ...p, d: p.d.filter((id) => !list().some((x) => x.id === id)), t: {}, k: { ...(p.k || {}), [path().id || 'one']: 0 } }); mode = 'cover'; render(); return true; }
        case 'still': fixAll = true; if (sheet) openMore(); return true;
        case 'tag': {
          const st = list(), x = st[i], k = +b.dataset.k, p = A.prog(), got = new Set(p.t[x.id] || []);
          got.has(k) ? got.delete(k) : got.add(k); p.t[x.id] = [...got]; C.haptic();
          if (got.size >= x.need && !p.d.includes(x.id)) {   // набрали нужное — шаг сделан, тост и следующая карточка
            p.d.push(x.id); A.setProg(p); const nx = st[i + 1];
            C.toast(A.s('tags_done', { a: x.need, next: nx ? A.plain(nx.hd || nx.t) : A.s('fin') }));
            C.event?.('guide_step', { id: O.id, step: i + 1 });
            go(i + off() + 1); return true;
          }
          A.setProg(p);
          if (sheet) { const y = L().querySelector('#st-sheet')?.scrollTop || 0; render(); openMore(); L().querySelector('#st-sheet').scrollTop = y; } else render();
          return true;
        }
        // старые действия списка («Начать», «Сделано, дальше», «Не получается») в сторис ведут себя по-новому
        case 'start': return this.click('sgo', b, i, ev);
        case 'next': done(); return true;
        case 'stuck': openMore(); return true;
        case 'open': case 'tocur': case 'again': case 'unstuck': return true;
        default: return false;
      }
    },
    resize() { if (L()?.classList.contains('open')) { focus(); fit(); } },
  };
  live = api;
  return api;
}
