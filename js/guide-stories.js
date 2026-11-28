// Вид «сторис» листа «По шагам» (27.11.2026; Игорь: «минимум текста, больше визуала, листать как сторис, два способа переключать проще;
// не писать про патч — показывать статус бага»). Решение Fable — «Критика 27.11/07 Решение Fable — Bugatti сторис.md».
// Включается данными: how.vw === 'stories' (Bugatti первая); инструкция без кадров остаётся списком.
// Обложка: настоящий кадр, заголовок и подзаголовок в одну строку, способы словами с временем и статусом бага, «Все шаги: N», одна кнопка
// «Начать квест» / «Начать через баг» / «Продолжить: шаг N». Карточки: «Перед выездом» (один раз) → шаги (кадр во весь экран, заголовок
// до 34 знаков, одно крупное значение) → «Готово» + «Дальше». Шапка карточки: полоски (тап — «Все шаги»), способы словами, марка sbgta.app,
// крестик. Низ: строка «Подробнее» (шторка; свайп вверх — то же), «Не получается» слева, «Сделано» справа.
// Тап справа — вперёд, слева — назад (только листает, отмечает одна «Сделано»), свайп вбок — то же, вниз — к обложке.
// Позиция карточки — своя у каждого способа (sb.gd: p.k = {quest: 3, bug: 1}), p.rq — «Перед выездом» уже видели.
// Подключается к js/guide.js крючками вида (как guide-set.js): list, render, click, stop.

const SS = {
  ru: {
    min: '{m} мин', go: 'Начать', cont: 'Продолжить', works: 'Работает', broken: 'Не работает с {d}', checked: 'проверено {d}',
    ready: 'Всё есть', done: 'Сделано', more: 'Подробнее', less: 'Свернуть', where_t: 'Где искать', tip_t: 'Подсказка', mvid: 'Ролик меню с {t}', mcap: 'Схема меню, наша. Названия пунктов как в игре.', all: 'Все шаги: {n}', toc: 'Все шаги',
    tags_t: 'Метки No Flusher', tags_any: 'любые {need} из {of}', tag_add: 'Отметить метку', tag_del: 'Снять метку',
    to_cover: 'К обложке', ways_aria: 'Способ', lock_t: 'Дальше в Pro', wall_s: 'Шаги {a}–{b}, точные места и разбор ошибок', hint: 'Тап справа — дальше',
    way_at: '{w}: шаг {a} из {b}', way_0: '{w}: перед выездом', way_fin: '{w}: всё пройдено', fin: 'Готово. Машина ваша', fin_left: 'Отмечено {a} из {b}',
    mon: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  },
  en: {
    min: '{m} min', go: 'Start', cont: 'Continue', works: 'Works', broken: 'Broken since {d}', checked: 'checked {d}',
    ready: 'Got it all', done: 'Done', more: 'Details', less: 'Hide', where_t: 'Where to look', tip_t: 'Tip', mvid: 'Menu video from {t}', mcap: 'Our menu diagram. Item names as in the game.', all: 'All steps: {n}', toc: 'All steps',
    tags_t: 'No Flusher tags', tags_any: 'any {need} of {of}', tag_add: 'Mark a tag', tag_del: 'Unmark a tag',
    to_cover: 'Back to cover', ways_aria: 'Way', lock_t: 'The rest is in Pro', wall_s: 'Steps {a}–{b}, exact spots and fixes', hint: 'Tap right for next',
    way_at: '{w}: step {a} of {b}', way_0: '{w}: before you go', way_fin: '{w}: all done', fin: 'Done. The car is yours', fin_left: 'Marked {a} of {b}',
    mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
};
const DOM = 'sbgta.app', HINT = 'sb.gdtap';
const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
// значки «Перед выездом» (в icons.js таких нет): пистолет с глушителем, машина; телефон и деньги — из общего набора
const IC = {
  gun: sv('<path d="M2 8.5h16.5V12H12l-1 2.5H8L9 12H4.5z"/><path d="M9.5 14.5 8.5 19H5l1.4-5.5"/><path d="M18.5 9.2H22v2.1h-3.5"/>'),
  car: sv('<path d="M3.5 16.5V13l2-4.5h13l2 4.5v3.5"/><path d="M3.5 13h17"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>'),
};
// двойной тап (Игорь 27.11): два касания подряд срабатывают один раз — иначе тап листал две карточки, а метка ставилась и снималась.
// Кнопки нижней панели глушит guide.js (450 мс); здесь — одно окно 350 мс на все касания вида: после касания, которое меняет экран
// («Начать заново», смена способа, оглавление), второе касание двойного тапа не попадает в то, что оказалось под пальцем (QA 27.11, урок 4)
const DEB = new Set(['sfin', 'lvid', 'stap', 'tag', 'sway', 'path', 'stoc', 'smore', 'sstuck', 'sgoto', 'sclose', 'sagain', 'sless', 'sgo', 'snext', 'sdone']);

let live = null, bound = null;   // один слой #guide на всё время: слушатели касаний вешаем один раз, работают с последним видом
document.fonts?.addEventListener?.('loadingdone', () => live?.resize());   // догрузился шрифт — строки [data-fit] шире, пересчитать

export function view(A) {
  const { C, O, tx, esc, mmss } = A;
  const s = (k, v = {}) => { const t = (SS[C.lang] || SS.en)[k] ?? SS.en[k]; if (t == null) return A.s(k, v); let x = t; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
  const H = () => O.how, PA = () => H().pa || [];
  const L = () => A.layer();
  // Игорь 27.11: лист всегда открывается сверху — сторис всегда с обложки, на ней «Продолжить: шаг N»
  let mode = 'cover', sheet = false, fixAll = false, touch = null, note = '', last0 = 0, lastTag = 0, drag = null, shutT = 0, leaving = false;

  const path = () => A.PATH();
  const pid = () => path().id || 'one';
  const list = () => path().st || [];
  const date = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return ''; const mo = s('mon')[+m[2] - 1]; return C.lang === 'ru' ? `${+m[3]} ${mo}` : `${mo} ${+m[3]}`; };
  // карточки: 0 — «Перед выездом» (если есть), дальше шаги, последняя — «Готово»
  const reqs = () => path().req || H().req || [];
  const off = () => (reqs().length ? 1 : 0);
  const rqT = () => tx(H().rqt) || A.s('before');   // заголовок первой карточки: «Перед выездом» или свой («Где это в меню» у настроек)
  const last = () => list().length + off();
  function kGet() {
    const p = A.prog(), k = p.k?.[pid()];
    if (Number.isInteger(k)) return Math.max(0, Math.min(k, last()));
    const st = list(), i = st.findIndex((x) => !p.d.includes(x.id));   // первая не отмеченная — для старых прогрессов без p.k (v2)
    return st.some((x) => p.d.includes(x.id)) ? (i < 0 ? last() : i + off()) : 0;
  }
  // «Продолжить» ведёт на карточку, где остановились; «Перед выездом» после «Всё есть» пропускаем (назад свайпом она доступна)
  const kEff = () => { const k = kGet(); return k < off() && A.prog().rq ? off() : k; };
  const started = () => { const p = A.prog(); return !!p.s && (Number.isInteger(p.k?.[pid()]) || list().some((x) => p.d.includes(x.id))); };
  function kSet(k, p = A.prog()) { p.k = { ...(p.k || {}), [pid()]: k }; if (k >= off() && off()) p.rq = 1; A.setProg(p); return p; }
  const wayName = (x) => tx(x.sh) || tx(x.t);
  const title = (x) => (x.tg?.length ? esc(s('tags_t')) : A.rich(x.hd || x.t));

  // кадр обрезается по высоте карточки: держим x центра кольца (img.fx) посередине, без выхода за края кадра
  function focus() {
    L().querySelectorAll('img[data-fx]').forEach((im) => {
      const box = im.parentElement, W = box.clientWidth, Hh = box.clientHeight, r = (im.naturalWidth / im.naturalHeight) || 16 / 9;
      const iw = Hh * r; if (!W || !Hh || iw <= W) { im.style.objectPosition = '50% 50%'; return; }
      const offx = Math.min(0, Math.max(W - iw, W / 2 - (+im.dataset.fx) * iw));
      im.style.objectPosition = `${(offx / (W - iw)) * 100}% 50%`;
    });
  }
  // заголовок, подзаголовок, заголовок шага и строка финала — одна строка: ужимаем шрифт, пока не влезет (не ниже 70 %)
  function fit() {
    L().querySelectorAll('[data-fit]').forEach((el) => {
      el.style.fontSize = ''; const f0 = parseFloat(getComputedStyle(el).fontSize); let f = f0;
      while (el.scrollWidth > el.clientWidth + 1 && f > f0 * 0.7) { f -= 0.5; el.style.fontSize = `${f}px`; }
    });
  }
  const img = (x, cls = '') => `<img class="${cls}" src="${esc(C.imgUrl(x.f))}" alt="" decoding="async" data-fx="${x.fx ?? 0.5}">`;
  const cover = (fx = 0.36) => (O.cv ? `<img src="${esc(C.imgUrl(O.cv.f))}" alt="" decoding="async" data-fx="${fx}">` : '');
  // домен (навык domen-na-ekranah): та же марка, что в шапке списка (.sb-brand) — знак SB, Secret Base, sbgta.app; на кадре шторки — .sb-wm
  const brand = (cls = 'st-brand') => `<span class="sb-brand ${cls}" aria-hidden="true"><img src="icons/brand-mark.svg" alt="" width="22" height="16"><span><b>Secret Base</b><small>${DOM}</small></span></span>`;
  const up = () => `<span class="st-up" aria-hidden="true">${C.I.chevron}</span>`;
  const sheetBox = () => `<div class="st-scrim" data-g="sless" hidden></div><div class="st-sheet" id="st-sheet" role="dialog" hidden></div>`;

  // ── обложка ──
  function statusHTML(x) {
    if (!x.sta) return '';
    return x.sta.ok ? `<span class="sc-st is-ok"><i></i>${esc(s('works'))}</span><small>${esc(s('checked', { d: date(x.sta.d) }))}</small>`
      : `<span class="sc-st is-bad"><i></i>${esc(s('broken', { d: date(x.sta.d) }))}</span>`;
  }
  function mainLabel() {
    const k = kEff();
    if (!started()) return tx(path().go) || s('go');
    return k >= off() && k < last() ? A.s('resume', { n: k - off() + 1 }) : s('cont');
  }
  function coverHTML() {
    const h = H(), cur = path(), I = C.I;
    const ways = PA().length > 1 ? `<div class="sc-ways" role="radiogroup" aria-label="${esc(s('ways_aria'))}">${PA().map((x) => `<button class="sc-way${x.id === cur.id ? ' on' : ''}" role="radio" data-g="path" data-v="${esc(x.id)}" aria-checked="${x.id === cur.id}">
      <b>${esc(wayName(x))}</b><span>${esc(x.min ? s('min', { m: x.min }) : '')}</span>${statusHTML(x)}</button>`).join('')}</div>` : '';
    return `<div class="sc">
      <div class="sc-media">${cover()}${O.cv?.by ? `<span class="st-by">${esc(O.cv.by)}</span>` : ''}</div>
      <header class="st-row sc-top"><button class="g-ib st-ib" data-g="close" aria-label="${esc(A.s('close'))}">${I.back}</button>${brand()}
        <button class="g-ib st-ib" data-g="share" aria-label="${esc(A.s('share'))}">${I.share}</button></header>
      <div class="sc-body">
        <h1 class="g-h1 sc-h1" data-fit>${esc(tx(h.ta) || tx(O.t))}</h1>
        ${h.sb || h.rw ? `<p class="sc-rw" data-fit>${esc(tx(h.sb) || tx(h.rw))}</p>` : ''}
        ${ways}
        <button class="sc-all" data-g="stoc" aria-haspopup="dialog"><span>${esc(s('all', { n: list().length }))}</span>${I.chevron}</button>
        ${C.after?.(O) || ''}
      </div>
      <footer class="g-bar st-bar"><button class="g-main" data-g="sgo">${esc(mainLabel())}</button></footer>
      ${sheetBox()}
    </div>`;
  }

  // ── карточки ──
  function topHTML(k) {
    const st = list(), p = A.prog(), i = k - off(), cur = path();
    const bars = `<button class="st-bars" data-g="stoc" aria-haspopup="dialog" aria-label="${esc(s('all', { n: st.length }))}">${st.map((x, j) => `<i class="${p.d.includes(x.id) ? 'on' : ''}${j === i ? ' cur' : ''}"></i>`).join('')}</button>`;
    // Fable п. 3: способы словами «Квест  Баг» — выбранный белый с подчёркиванием, второй приглушён и переключает одним тапом; у бага точка статуса
    const way = (x) => { const dot = x.sta ? `<i class="st-dot ${x.sta.ok ? 'is-ok' : 'is-bad'}"></i>` : '';
      return x.id === cur.id ? `<span class="st-way on" aria-current="true">${esc(wayName(x))}${dot}</span>`
        : `<button class="st-way" data-g="sway" data-v="${esc(x.id)}">${esc(wayName(x))}${dot}</button>`; };
    const ways = PA().length > 1 ? `<div class="st-ways" role="group" aria-label="${esc(s('ways_aria'))}">${PA().map(way).join('')}</div>` : '<span></span>';
    return `<div class="st-top">${bars}<div class="st-row">${ways}${brand()}
      <button class="g-ib st-ib" data-g="sclose" aria-label="${esc(s('to_cover'))}">${C.I.close}</button></div>
      ${note ? `<p class="st-note" role="status">${esc(note)}</p>` : ''}</div>`;
  }
  const bar = (main) => `<footer class="g-bar st-bar">${main}</footer>`;
  const stuckBar = (done) => bar(`<button class="g-sub st-stuck" data-g="sstuck" aria-haspopup="dialog">${esc(A.s('stuck'))}</button>
    <button class="g-main${done ? ' is-done' : ''}" data-g="sdone">${done ? C.I.check : ''}<span>${esc(s('done'))}</span></button>`);
  const moreRow = (lbl = s('more'), x = '') => `<button class="st-more" data-g="smore"${x ? ` data-x="${x}"` : ''} aria-haspopup="dialog"><span>${esc(lbl)}</span>${up()}</button>`;
  function reqCard() {
    // Fable: фон — обложка, затемнённая до 25 %; три строки со значками без точек; последствия — в «Подробнее»
    return `<div class="st-card st-plain" data-g="stap"><div class="st-bg st-bg-cv">${cover()}</div>
      <div class="st-mid"><h2 class="st-h">${esc(rqT())}</h2>
        <ul class="st-req">${reqs().slice(0, 3).map((r) => `<li>${IC[r.ic] || C.I[{ phone: 'phone', cash: 'wallet' }[r.ic]] || C.I.check}<span>${esc(tx(r.s) || tx(r.t))}</span></li>`).join('')}</ul></div>
      ${moreRow()}${bar(`<button class="g-main" data-g="snext">${esc(s('ready'))}</button>`)}</div>`;
  }
  function tagsCard(x, i) {
    // Fable п. 7: 10 кружков без цифр, заполняются по порядку; тап по пустому — плюс одна, по последнему заполненному — минус одна
    const n = Math.min(A.got(x, i, A.prog()).size, x.need), bg = [...list().slice(0, i)].reverse().find((y) => y.img)?.img;
    return `<div class="st-card st-plain" data-g="stap">${bg ? `<div class="st-bg">${img(bg)}</div>` : ''}
      <div class="st-mid"><h2 class="st-h">${esc(s('tags_t'))}</h2>
        <p class="g-tn st-count"><b>${n}</b> ${esc(A.s('of'))} ${x.need}</p>
        ${x.n?.of ? `<p class="st-sub">${esc(s('tags_any', { of: x.n.of, need: x.need }))}</p>` : ''}
        <ol class="st-tags">${Array.from({ length: x.need }, (_, k) => `<li><button class="${k < n ? 'on' : ''}" data-g="tag" data-i="${i}" data-k="${k}" aria-pressed="${k < n}"
          aria-label="${esc(k < n ? s('tag_del') : s('tag_add'))}">${k < n ? C.I.check : ''}</button></li>`).join('')}</ol></div>
      ${moreRow(s('where_t'), 'where')}${stuckBar(A.prog().d.includes(x.id))}</div>`;
  }
  function lockCard() {
    const fr = H().fr ?? 2, n = list().length;
    return `<div class="st-card st-plain g-wall" data-g="stap"><div class="st-bg st-bg-cv">${cover()}</div><div class="st-mid st-mid-top"><span class="st-lock">${C.I.lock}</span><h2 class="st-h">${esc(s('lock_t'))}</h2>
      <p class="st-sub">${esc(s('wall_s', { a: fr + 1, b: n }))}</p>${A.next(true)}</div>
      ${bar(`<button class="g-main" data-g="pw">${esc(A.s('get_pro'))}</button>`)}</div>`;
  }
  function stepCard(x, i, k) {
    if (A.shut(i)) return lockCard();
    if (x.tg?.length) return tagsCard(x, i);
    let hint = false; try { hint = k === off() && !localStorage.getItem(HINT); } catch { }
    // на карточке — заголовок до 34 знаков и одно крупное значение; ловушка кода — одной янтарной строкой под ним (Fable)
    return `<div class="st-card" data-g="stap">
      <div class="st-media${x.img ? '' : ' st-cvbg'}">${x.img ? img(x.img) : cover()}${x.img?.by ? `<span class="st-by">${esc(A.s('frame', { by: x.img.by }))}</span>` : !x.img && O.cv?.by ? `<span class="st-by">${esc(O.cv.by)}</span>` : ''}
        ${hint ? `<span class="st-hint" aria-hidden="true">${esc(s('hint'))}${C.I.chevron}</span>` : ''}</div>
      <div class="st-txt">${x.pre ? `<p class="st-pre">${esc(tx(x.pre))}</p>` : ''}<p class="st-hd" data-fit>${A.rich(x.hd || x.t)}</p>
        ${x.am ? `<p class="st-trap">${esc(tx(x.am))}</p>` : ''}
        ${x.c ? `<p class="g-big st-big">${esc(x.c)}</p>${x.cw ? `<p class="st-trap">${esc(A.s('not_this', { c: x.cw }))}</p>` : ''}` : x.bv ? `<p class="g-big g-big-t st-big">${esc(x.bv)}</p>` : ''}</div>
      ${moreRow()}${stuckBar(A.prog().d.includes(x.id))}</div>`;
  }
  function finCard() {
    const p = A.prog(), st = list(), n = st.filter((x) => p.d.includes(x.id)).length, all = n === st.length;
    // Fable: сверху обложка на треть экрана (её скриншотят — домен в шапке), одна строка результата, «Дальше» 1–3 строки, одна главная кнопка
    return `<div class="st-card st-fin"><div class="st-fin-media">${cover()}${O.cv?.by ? `<span class="st-by">${esc(O.cv.by)}</span>` : ''}</div>
      <div class="st-mid st-mid-top">
        <h2 class="st-h st-fin-h" data-fit>${all ? `${C.I.check}<span>${esc(tx(H().fin) || s('fin'))}</span>` : `<span>${esc(s('fin_left', { a: n, b: st.length }))}</span>`}</h2>
        ${A.next(true)}${C.after?.(O) || ''}
        <button class="st-again" data-g="sagain">${esc(A.s('again'))}</button></div>
      ${bar(H().fgo && O.onFin ? `<button class="g-main" data-g="sfin">${esc(tx(H().fgo))}</button>` : `<button class="g-main" data-g="close">${esc(A.s('close'))}</button>`)}</div>`;
  }
  function cardHTML(k) {
    if (k < off()) return reqCard();
    if (k >= last()) return finCard();
    return stepCard(list()[k - off()], k - off(), k);
  }

  // ── шторка «Подробнее»: сразу — целый кадр с подписью кольца, текст шага, ловушка, «Получилось, если»;
  // остальное — строки со стрелкой, раскрываются по тапу и не закрывают друг друга (Игорь 27.11) ──
  const row = (x, lbl, body, open) => `<details class="st-x" data-x="${x}"${open ? ' open' : ''}><summary><span>${esc(lbl)}</span>${C.I.chevron}</summary><div class="st-xb">${body}</div></details>`;
  const vrow = (v, lbl) => `<button class="st-x st-xv" data-g="video" data-v="${esc(v[0])}" data-t="${v[1]}"><span>${esc(lbl)}</span>${C.I.play}</button>`;
  function moreHTML(k, open) {
    if (k < off()) {
      const wh = path().wh || H().wh;
      return `<h2 class="st-sh-h">${esc(rqT())}</h2><ul class="g-req">${reqs().map((r) => `<li>${esc(tx(r.t))}</li>`).join('')}</ul>
        ${wh ? `<div class="st-rows">${vrow(wh, wh[3] && wh[2] ? A.s('whole_by', { by: wh[3], n: wh[2], u: A.ruMin(wh[2]) }) : A.s('whole0'))}</div>` : ''}`;
    }
    const i = k - off(), x = list()[i];
    const fig = x.img ? `<figure class="g-img st-fig"><button data-g="zoom" data-src="${esc(C.imgUrl(x.img.f))}" aria-label="${esc(A.s('zoom'))}"><img src="${esc(C.imgUrl(x.img.f))}" alt="" decoding="async"></button><span class="sb-wm" aria-hidden="true">${DOM}</span>
      ${x.img.cap || x.img.by ? `<figcaption>${x.img.cap ? `<b>${esc(A.s('ring', { c: A.plain(x.img.cap) }))}</b> ` : ''}${x.img.by ? esc(A.s('frame2', { by: x.img.by })) : ''}</figcaption>` : ''}</figure>` : '';
    const places = x.tg?.length ? `<ol class="st-places">${x.tg.map((q) => `<li><span>${esc(tx(q.p))}${q.a ? `<small>${esc(q.a)}</small>` : ''}</span>
        ${q.v ? `<button class="g-tv" data-g="video" data-v="${esc(q.v[0])}" data-t="${q.v[1]}" aria-label="${esc(A.s('video_at', { t: mmss(q.v[1]) }))}">${C.I.play}<span>${mmss(q.v[1])}</span></button>` : ''}</li>`).join('')}</ol>` : '';
    return `${fig}<p class="g-tx st-sh-t">${A.rich(x.t)}</p>
      ${x.bn ? `<p class="g-tx">${esc(tx(x.bn))}</p>` : ''}
      ${x.tr ? `<p class="g-trap">${A.rich(x.tr)}</p>` : ''}
      ${x.ok ? `<p class="g-ok"><b>${esc(A.s('ok'))}</b> ${A.rich(x.ok).replace(/^(It worked if|Получилось, если)\s*/i, '')}</p>` : ''}
      <div class="st-rows">
        ${places ? row('where', s('where_t'), places, open.has('where')) : ''}
        ${x.tip ? row('tip', s('tip_t'), `<p class="g-tip">${A.rich(x.tip)}</p>`, open.has('tip')) : ''}
        ${x.at ? row('at', A.s('in_game'), `<p class="g-at">${C.I.pin}<span>${esc(typeof x.at === 'string' ? x.at : tx(x.at))}</span></p>`, open.has('at')) : ''}
        ${x.v ? vrow(x.v, A.s('video_at', { t: mmss(x.v[1]) })) : ''}
        ${x.mv ? `<button class="st-x st-xv" data-g="lvid" data-src="${esc(x.mv.src.replace('{l}', C.lang === 'ru' ? 'ru' : 'en'))}" data-t="${+x.mv.t || 0}"><span>${esc(s('mvid', { t: mmss(+x.mv.t || 0) }))}</span>${C.I.play}</button>`: ''}
        ${row('stuck', A.s('stuck'), A.stuck(i, fixAll), open.has('stuck'))}
      </div>`;
  }
  // «Все шаги» (Fable п. 8): оглавление коротких названий, тап ведёт на карточку; внизу — «Дальше» (серии без тупиков)
  function tocHTML() {
    const p = A.prog(), st = list(), cur = kGet();
    const r = (k, n, t, done, lock) => `<li><button class="st-toc-r${k === cur ? ' on' : ''}${done ? ' is-done' : ''}" data-g="sgoto" data-k="${k}"${k === cur ? ' aria-current="step"' : ''}>
      <span class="st-toc-n">${lock ? C.I.lock : done ? C.I.check : n}</span><span class="st-toc-t">${t}</span></button></li>`;
    return `<h2 class="st-sh-h">${esc(s('toc'))}</h2><ol class="st-toc">
      ${off() ? r(0, '', esc(rqT()), !!p.rq, false) : ''}
      ${st.map((x, i) => r(i + off(), i + 1, title(x), p.d.includes(x.id), A.shut(i))).join('')}</ol>${A.next(true)}`;
  }

  function render() {
    if (sheet) closeMore();   // шторка закрывается вместе со своей записью «Назад»
    const lay = L();
    if (mode === 'cover') {
      lay.innerHTML = `${coverHTML()}<div class="g-video" id="g-video" hidden></div>`;
    } else {
      const k = kGet();
      lay.innerHTML = `<div class="st" data-k="${k}">${topHTML(k)}${cardHTML(k)}${sheetBox()}</div><div class="g-video" id="g-video" hidden></div>`;
      const nx = list()[k + 1 - off()]?.img; if (nx) { const im = new Image(); im.src = C.imgUrl(nx.f); }   // следующий кадр — заранее
      if (note) { const t = note; setTimeout(() => { if (note === t) { note = ''; L().querySelector('.st-note')?.classList.add('out'); } }, 1800); }
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
  function begin() {   // первый вход в сторис (кнопка обложки или строка «Все шаги»)
    const p = A.prog(); if (!p.s) { p.s = 1; A.setProg(p); A.first(); C.event?.('guide_start', { id: O.id }); }
    A.wake(true); mode = 'story';
  }
  function openSheet(html, at) {
    const box = L().querySelector('#st-sheet'); if (!box) return;
    // Игорь 28.11: детали — понятно открыть и закрыть: ручка сверху (тянуть вниз), «Свернуть ↓» словами, выезжает снизу и уезжает вниз
    box.innerHTML = `<div class="st-sh-top"><span class="st-grab" aria-hidden="true"></span>${brand('st-sh-brand')}<button class="st-less" data-g="sless"><span>${esc(s('less'))}</span><span class="st-dn" aria-hidden="true">${C.I.chevron}</span></button></div><div class="st-sh-in">${html}</div>`;
    const was = sheet;
    if (!sheet) A.ovlOpen('sheet');   // «Назад» (свайп от края, кнопка Android) закрывает шторку, а не инструкцию (QA 27.11)
    clearTimeout(shutT); box.classList.remove('is-out'); box.style.transform = '';
    box.hidden = false; L().querySelector('.st-scrim').hidden = false; sheet = true; box.scrollTop = 0;
    if (!was) { box.classList.remove('is-in'); void box.offsetWidth; box.classList.add('is-in'); }
    const el = at && box.querySelector(`[data-x="${at}"]`); if (el) box.scrollTop = Math.max(0, el.offsetTop - 64);
  }
  function openMore(at) {
    const box = L().querySelector('#st-sheet');
    const open = new Set(sheet && box ? [...box.querySelectorAll('details[open]')].map((d) => d.dataset.x) : []);
    if (at) open.add(at);
    openSheet(moreHTML(kGet(), open), at);
    C.event?.('guide_more', { id: O.id, k: kGet(), at: at || '' });
  }
  function hideSheet() { clearTimeout(shutT); const box = L()?.querySelector('#st-sheet'); if (box) { box.hidden = true; box.innerHTML = ''; box.classList.remove('is-in', 'is-out'); box.style.transform = ''; } const sc = L()?.querySelector('.st-scrim'); if (sc) sc.hidden = true; sheet = false; drag = null; }
  // закрыть с уездом вниз (180 мс); листание карточек работает сразу — sheet = false до конца анимации
  function closeMore() {
    if (!sheet) return hideSheet();
    leaving = true; A.ovlClose(); leaving = false; sheet = false; drag = null;
    const box = L()?.querySelector('#st-sheet'), sc = L()?.querySelector('.st-scrim');
    if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return hideSheet();
    box.classList.remove('is-in'); box.classList.add('is-out'); if (sc) sc.hidden = true;
    clearTimeout(shutT); shutT = setTimeout(() => { if (!sheet) hideSheet(); }, 190);
  }
  // шторку тянут вниз за любое место, когда она прокручена к началу: едет за пальцем, > 90 px или быстрый рывок — закрыть
  function shStart(e, box) { if (!sheet || e.touches.length !== 1 || box.scrollTop > 0) { drag = null; return; } drag = { y: e.touches[0].clientY, t: Date.now(), dy: 0 }; }
  function shMove(e, box) { if (!drag) return; const dy = e.touches[0].clientY - drag.y; if (box.scrollTop > 0 && dy > 0) { drag = null; box.style.transform = ''; return; } drag.dy = dy; box.style.transform = dy > 0 ? `translateY(${dy}px)` : ''; }
  function shEnd(e, box) {
    if (!drag) return; const { dy, t } = drag; drag = null;
    if (dy > 90 || (dy > 30 && dy / Math.max(1, Date.now() - t) > 0.5)) { box.style.transform = ''; closeMore(); return; }
    box.style.transition = 'transform .18s ease-out'; box.style.transform = ''; setTimeout(() => { box.style.transition = ''; }, 200);
  }
  function hintSeen() { try { localStorage.setItem(HINT, '1'); } catch { } L().querySelector('.st-hint')?.remove(); }
  function done() {
    const k = kGet(), i = k - off(), st = list(), p = A.prog();
    if (i >= 0 && i < st.length) {
      if (A.shut(i)) { C.paywall(); return; }
      if (!p.d.includes(st[i].id)) { p.d.push(st[i].id); A.setProg(p); C.event?.('guide_step', { id: O.id, step: i + 1 }); }
      C.haptic();
    }
    hintSeen(); go(k + 1);
  }
  // Fable п. 2: тап только листает; отмечает шаг одна кнопка «Сделано»
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
    if (mode === 'story') {   // короткая строка, где вы в другом способе: «Баг: шаг 6 из 10»; «Перед выездом» уже видели — сразу к шагу
      const k = kEff(), w = wayName(path()), n = list().length; kSet(k);
      note = k < off() ? s('way_0', { w }) : k >= last() ? s('way_fin', { w }) : s('way_at', { w, a: k - off() + 1, b: n });
    }
    render();
  }
  function tag(i, k) {
    // метка, уже отсканированная отдельным шагом раньше (тот же ролик с той же секунды), засчитана сама — «1 из 10» сразу (QA 27.11)
    const st = list(), x = st[i], p = A.prog(), man = [...(p.t[x.id] || [])], auto = A.auto(x, i, p);
    const was = A.got(x, i, p).size, n = Math.min(was, x.need);
    if (k >= n && n < x.need) { for (let j = 0; j < (x.tg?.length || x.need); j++) if (!man.includes(j) && !auto.has(j)) { man.push(j); break; } }
    else if (k === n - 1 && man.length) man.pop();
    else return;
    p.t[x.id] = man; C.haptic();
    const got = A.got(x, i, p).size;
    if (was >= x.need && got < x.need && p.d.includes(x.id)) p.d = p.d.filter((q) => q !== x.id);   // сняли ниже нужного — шаг снова не сделан
    if (got >= x.need && !p.d.includes(x.id)) {   // набрали нужное — шаг сделан, тост и следующая карточка
      p.d.push(x.id); A.setProg(p); const nx = st[i + 1];
      C.toast(A.s('tags_done', { a: x.need, next: nx ? A.plain(nx.hd || nx.t) : A.s('fin') }));
      C.event?.('guide_step', { id: O.id, step: i + 1 });
      go(i + off() + 1); return;
    }
    A.setProg(p); render();
  }

  // жесты: тап по карточке — слева назад, справа вперёд; свайп вбок — то же; вниз — к обложке, вверх — шторка «Подробнее».
  // Только чтение касаний, без preventDefault: touch-action у экрана pan-y (не none), в шторке — обычная прокрутка (её касания не трогаем)
  function onStart(e) { if (mode !== 'story' || sheet || e.touches.length !== 1 || e.target.closest('.st-sheet, .g-video')) { touch = null; return; } touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }
  function onEnd(e) {
    if (!touch) return; const c = e.changedTouches[0], dx = c.clientX - touch.x, dy = c.clientY - touch.y; touch = null;
    if (dy > 80 && dy > Math.abs(dx) * 1.3) { mode = 'cover'; render(); return; }
    if (dy < -70 && -dy > Math.abs(dx) * 1.3) { openMore(); return; }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { hintSeen(); nav(dx < 0 ? 1 : -1); }
  }
  function bind() {
    const lay = L(); if (bound === lay) return; bound = lay;
    lay.addEventListener('touchstart', (e) => live?.onStart(e), { passive: true }); lay.addEventListener('touchend', (e) => live?.onEnd(e), { passive: true });
    // шторка «Подробнее» / «Все шаги» — тянуть вниз (элемент шторки пересоздаётся, поэтому слушаем слой)
    const sh = (f) => (e) => { const box = e.target.closest?.('.st-sheet'); if (box && live?.[f]) live[f](e, box); };
    lay.addEventListener('touchstart', sh('shStart'), { passive: true }); lay.addEventListener('touchmove', sh('shMove'), { passive: true });
    lay.addEventListener('touchend', sh('shEnd'), { passive: true }); lay.addEventListener('touchcancel', sh('shEnd'), { passive: true });
    addEventListener('resize', () => live?.resize());
  }

  const api = {
    stories: true, onStart, onEnd, shStart, shMove, shEnd,
    sheetOpen: () => sheet, sheetHide: () => { if (!leaving) hideSheet(); },   // своё закрытие (уезд вниз) не обрывать
    // текущий шаг для «шаг X из N» на Главной, в ленте и «Гид по игре» — где откроется «Продолжить» (guide.js setProg → sc)
    at(p) {
      const pa = PA().find((x) => x.id === p.path) || PA()[0] || {}, st = pa.st || [], o0 = (pa.req || H().req || []).length ? 1 : 0, k = p.k?.[pa.id || 'one'];
      const f = st.findIndex((x) => !p.d.includes(x.id)), fo = f < 0 ? st.length : f;
      if (!Number.isInteger(k)) return fo;
      const i = Math.max(0, k - o0); return i >= st.length ? fo : i;
    },
    list,
    render() { bind(); render(); },
    stop() { touch = null; sheet = false; note = ''; if (live === api) live = null; },
    click(a, b, i, ev) {
      // метка меняет только кружок — у неё своё окно, чтобы «метка → Сделано» подряд работало; остальные касания меняют экран — общее окно
      // «Свернуть» не глушится окном 350 мс (Игорь 28.11: открыл «Подробнее» и сразу закрыл — должно закрыться), но окно ставит:
      // второй тап того же касания не листает карточку под уехавшей шторкой
      if (DEB.has(a)) { const now = Date.now(); if (a !== 'sless' && (now - last0 < 350 || (a === 'tag' && now - lastTag < 350))) return true; if (a === 'tag') lastTag = now; else last0 = now; }
      switch (a) {
        case 'path': if (mode === 'cover') { switchWay(b.dataset.v); return true; } return false;
        case 'sgo': begin(); C.haptic(); go(kEff()); return true;
        case 'sway': switchWay(b.dataset.v); return true;
        case 'sclose': mode = 'cover'; note = ''; render(); return true;
        case 'stap': { const r = b.getBoundingClientRect(), x = (ev?.clientX ?? r.right) - r.left; hintSeen(); nav(x < r.width / 3 ? -1 : 1); return true; }
        case 'snext': go(kGet() + 1); return true;
        case 'sdone': done(); return true;
        case 'smore': openMore(b.dataset.x); return true;
        case 'sstuck': openMore('stuck'); return true;
        case 'stoc': openSheet(tocHTML()); C.event?.('guide_toc', { id: O.id }); return true;
        case 'sgoto': {
          let k = +b.dataset.k; const fr = H().fr ?? 2;
          if (k >= off() && A.shut(k - off())) k = fr + off();   // закрытый шаг — на стену Pro
          if (mode === 'cover') begin();
          go(k); return true;
        }
        case 'lvid': {   // свой ролик (схема меню, mp4 со своего хостинга) поверх шторки; крестик и «Назад» закрывают только его
          const v = L().querySelector('#g-video'); if (!v) return true;
          v.innerHTML = `<div class="g-vbox"><button class="g-ib g-vx" data-g="vclose" aria-label="${esc(A.s('close'))}">${C.I.close}</button>${brand('st-vbrand')}
            <div class="g-vf"><video src="${esc(b.dataset.src)}#t=${+b.dataset.t || 0}" controls autoplay playsinline muted preload="metadata"></video></div><p class="g-note st-mcap">${esc(s('mcap'))}</p></div>`;
          v.hidden = false; A.ovlOpen('video'); C.event?.('guide_video', { id: O.id, v: 'menu', t: +b.dataset.t || 0 }); return true;
        }
        case 'sfin': { const f = O.onFin; A.closeGuide(); setTimeout(() => f?.(), 80); return true; }   // «Прошёл «X»» (Прохождение): отметить и вернуться
        case 'sless': closeMore(); return true;
        case 'sagain': { const p = A.prog(); A.setProg({ ...p, d: p.d.filter((id) => !list().some((x) => x.id === id)), t: {}, rq: 0, k: { ...(p.k || {}), [pid()]: 0 } }); mode = 'cover'; render(); return true; }
        case 'still': fixAll = true; if (sheet) openMore('stuck'); return true;
        case 'tag': tag(i, +b.dataset.k); return true;
        // старые действия списка («Начать», «Сделано, дальше», «Не получается») в сторис ведут себя по-новому
        case 'start': return this.click('sgo', b, i, ev);
        case 'next': done(); return true;
        case 'stuck': openMore('stuck'); return true;
        case 'open': case 'tocur': case 'again': case 'unstuck': return true;
        default: return false;
      }
    },
    resize() { if (L()?.classList.contains('open')) { focus(); fit(); } },
  };
  live = api;
  return api;
}
