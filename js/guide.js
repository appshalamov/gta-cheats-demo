// Инструкция «По шагам» (26.11.2026, «Гид по игре», функция 1). Проект — «Гид по игре — пасхалки (26.11.2026)/01 Проект Fable.md»,
// финальное решение — «02 Решение Fable.md». Один экран для всех входов (Новости, «Пасхалки», карта, ссылка): openGuide(o, ctx).
// Телефон лежит рядом с геймпадом: текущий шаг раскрыт под большим пальцем, внизу «Не получается» и «Сделано, дальше».
// У шага: действие, «Получилось, если…», ловушка, крупное значение (код, адрес), список мест с роликом с секунды, «Где в игре».
// Данные — egg.how из data/map/<игра>.json (tools/build_map.py guide_fields). Прогресс — на телефоне (localStorage sb.gd), по id шагов.
// Тот же компонент потом — гид прохождения (req.ty mission/chapter + ref) и предупреждения (miss).

import { view as setView } from './guide-set.js';
import { view as storiesView } from './guide-stories.js';   // вид «сторис» (how.vw === 'stories', Bugatti первая; черновик 27.11)
import { recByKey, nextFor } from './guide-core.js';
import { btn } from './icons.js';   // {enter} в тексте шага — кнопка геймпада по платформе (Bugatti v2, 27.11)   // «Дальше» в финале — по указателю (серии, seriya-uderzhanie)   // вид «настройки» (guide-settings)

const S = {
  ru: {
    close: 'Закрыть', share: 'Поделиться', whole: 'Весь путь в ролике, {n} минут', whole0: 'Весь путь в ролике', before: 'Перед выездом',
    start: 'Начать', next: 'Сделано, дальше', finish: 'Готово', stuck: 'Не получается', still: 'Всё равно не выходит',
    ok: 'Получилось, если', video_at: 'Ролик с {t}', in_game: 'Где в игре', not_this: 'Не {c}', of: 'из',
    tags_n: '{a} из {b}', alt: 'Обходной путь (глитч)', sources: 'Источники', report: 'Сообщить об ошибке', report_ok: 'Спасибо, проверим',
    self: 'Прошли сами {d}', collected: 'Собрано по {n} источникам. Сами ещё не проходили', one: 'Один источник: {s}. Проверяем',
    wall: 'Дальше в Pro: шаги {a}–{b}, точные места и разбор ошибок', get_pro: 'Оформить Pro',
    fin_car: 'Готово. Машина ваша.', fin: 'Готово. Всё получилось.', again: 'Начать заново',
    meta: '{n} шагов, около {m} минут', meta0: '{n} шагов', missable: 'Можно упустить навсегда', no_fix: 'Для этого шага частых ошибок нет. Посмотрите ролик или общий список.',
    en_only: 'Инструкция на английском', offline: 'Ролики работают с сетью',
    up: 'Дальше', inLife: 'Это место в жизни', path_meta: '{n} шагов, около {m} минут', works: 'работает, проверено {d}', quiet: 'Как заехать тихо', bugPart: 'Баг: сквозь дверь гаража',
    questPart: 'Квест No Flusher', finPart: 'Гараж и регистрация', frame: 'кадр: {by}, YouTube', zoom: 'Открыть кадр',
    // Bugatti v2 (27.11): два способа, ролик пути, «Пока ждёте», «К шагу N», счётчик меток, ролик неудачи, кнопка геймпада
    ways: 'Два способа', always: 'Работает всегда', path_tm: '{n} шагов, {m} минут', whole_by: 'Весь путь в ролике {by}, {n} {u}',
    min1: 'минуту', min2: 'минуты', min5: 'минут', wait: 'Пока ждёте или если надоело', back_to: 'К шагу {n}', resume: 'Продолжить: шаг {n}', fold: 'Свернуть шаг', unfold: 'Раскрыть шаг',
    tags_any: 'В игре их {of}, нужно любые {need}', tags_done: '{a} из {a}. {next}', fail_v: 'Как выглядит неудача — ролик с {t}',
    ring: 'Кольцо: {c}.', frame2: 'Кадр: {by}, YouTube', or: 'или',
  },
  en: {
    close: 'Close', share: 'Share', whole: 'Watch the whole route, {n} min', whole0: 'Watch the whole route', before: 'Before you go',
    start: 'Start', next: 'Done, next', finish: 'Finish', stuck: "I'm stuck", still: 'Still stuck',
    ok: 'It worked if', video_at: 'Video from {t}', in_game: 'In game', not_this: 'Not {c}', of: 'of',
    tags_n: '{a} of {b}', alt: 'Shortcut (glitch)', sources: 'Sources', report: 'Report a mistake', report_ok: "Thanks, we'll check",
    self: 'We did it ourselves on {d}', collected: 'Collected from {n} sources. Not tested by us yet', one: 'Single source: {s}. Checking',
    wall: 'The rest is in Pro: steps {a}–{b}, exact spots and fixes', get_pro: 'Get Pro',
    fin_car: 'Done. The car is yours.', fin: 'Done. You made it.', again: 'Start over',
    meta: '{n} steps, about {m} min', meta0: '{n} steps', missable: 'Missable', no_fix: 'No common mistakes for this step. Watch the video or the full list.',
    en_only: 'Guide in English', offline: 'Videos need a connection',
    up: 'Next', inLife: 'This place in real life', path_meta: '{n} steps, about {m} min', works: 'works, checked {d}', quiet: 'Get in quietly', bugPart: 'Bug: through the garage door',
    questPart: 'No Flusher quest', finPart: 'Garage and registration', frame: 'frame: {by}, YouTube', zoom: 'Open frame',
    ways: 'Two ways', always: 'Always works', path_tm: '{n} steps, {m} min', whole_by: 'Watch the whole route by {by}, {n} {u}',
    min1: 'min', min2: 'min', min5: 'min', wait: 'While you wait, or for a break', back_to: 'Back to step {n}', resume: 'Continue: step {n}', fold: 'Collapse step', unfold: 'Expand step',
    tags_any: 'There are {of}, any {need} will do', tags_done: '{a} of {a}. {next}', fail_v: 'What a fail looks like — video from {t}',
    ring: 'Ring: {c}.', frame2: 'Frame: {by}, YouTube', or: 'or',
  },
};
const KEY = 'sb.gd', FIRST = 'sb.gd1';
let C = null, O = null, layer = null, lock = null, stuckAll = false;
// Игорь 27.11: шаги раскрываются по тапу и не закрывают уже открытые (несколько сразу); набор живёт, пока лист открыт
let openSet = new Set(), barAway = false, lastMain = 0;
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
// {enter} — кнопка «сесть в машину»: △ на PlayStation, Y на Xbox; на ПК и телефоне — обе с подписью (других данных о клавише нет)
const keyHTML = (tk, pl) => { const b = btn(tk, pl); return `<span class="${b.cls}">${b.html}</span>`; };
function enterHTML() {
  const pl = C.platform;
  if (pl === 'playstation') return keyHTML('T', pl);
  if (pl === 'xbox') return keyHTML('Y', pl);
  return `${keyHTML('T', 'playstation')} (PS) ${esc(s('or'))} ${keyHTML('Y', 'xbox')} (Xbox)`;
}
const enterTxt = () => (C.platform === 'playstation' ? '△' : C.platform === 'xbox' ? 'Y' : '△ / Y');
const rich = (o) => esc(tx(o)).split('{enter}').join(enterHTML());   // текст шага с кнопкой геймпада
const plain = (o) => tx(o).split('{enter}').join(enterTxt());          // то же для alt и тостов
const ruMin = (n) => { const a = n % 10, b = n % 100; return s(a === 1 && b !== 11 ? 'min1' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'min2' : 'min5'); };
// шаги выбранного пути (квест / баг): по ним считается «шаг X из N» везде — в ленте, поиске, на Главной и в шторке карты
export const pathSt = (o, p) => ((o.how?.pa || []).find((x) => x.id === p?.path) || (o.how?.pa || [])[0] || o.how || {}).st || [];
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
function prog() { const p = read()[kOf(O)] || {}; return { d: p.d || [], t: p.t || {}, s: p.s || 0, o: p.o, path: p.path, ...(p.k ? { k: p.k } : {}), ...(p.rq ? { rq: 1 } : {}) }; }   // k — карточка сторис по способам, rq — «Перед выездом» уже видели
function setProg(p) { try { const all = read(); all[kOf(O)] = { ...p, at: Date.now() }; localStorage.setItem(KEY, JSON.stringify(all)); } catch { } }
// для строк ленты и шторки на карте: сколько шагов пройдено (0 — не начато)
export function progressOf(o) { const p = read()[kOf(o)]; return p ? pathSt(o, p).filter((x) => (p.d || []).includes(x.id)).length + (p.s ? 0.001 : 0) : 0; }

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
// Bugatti v2 (27.11): у шага с hd — короткий заголовок в свёрнутой строке и крупно в раскрытой; кадр во всю ширину с подписью
// «Кольцо: … Кадр: …»; порядок: hd → кадр → t → крупное значение → ловушка → «Получилось, если» → tip → места → «Где в игре» → ролик.
// Без hd (Mile Zero) — как раньше, только t в 2 строки и видна подсказка tip.
function figHTML(x) {
  if (!x.img || C.frames === false) return '';
  const src = esc(C.imgUrl(x.img.f)), cap = x.img.cap ? plain(x.img.cap) : '';
  const fc = x.img.cap ? `<figcaption><b>${esc(s('ring', { c: cap }))}</b>${x.img.by ? ` ${esc(s('frame2', { by: x.img.by }))}` : ''}</figcaption>`
    : x.img.by ? `<figcaption>${esc(s('frame', { by: x.img.by }))}</figcaption>` : '';
  return `<figure class="g-img${x.hd ? ' g-img-w' : ''}"><button data-g="zoom" data-src="${src}" data-alt="${esc(cap)}" aria-label="${esc(s('zoom'))}"><img src="${src}" alt="${esc(cap)}" loading="lazy" decoding="async"></button><span class="sb-wm" aria-hidden="true">sbgta.app</span>${fc}</figure>`;
}
function stepHTML(x, i, p, open) {
  const I = C.I, done = p.d.includes(x.id), n = i + 1;
  const cls = `g-step${done ? ' is-done' : ''}${open ? ' is-cur' : ''}${shut(i) ? ' is-lock' : ''}${x.hd ? ' has-hd' : ''}`;
  const line = x.hd ? rich(x.hd) : rich(x.t), ck = done ? `<span class="g-ck">${I.check}</span>` : '';
  if (shut(i)) return `<li class="${cls}" data-g="pw"><span class="g-num">${I.lock}</span><p class="g-t">${line}</p></li>`;
  if (!open) return `<li class="${cls}" data-g="open" data-i="${i}" role="button" aria-expanded="false" aria-label="${esc(s('unfold'))}"><span class="g-num">${n}</span><p class="g-t">${line}</p>${ck}<span class="g-chev" aria-hidden="true">${I.chevron}</span></li>`;
  const tg = x.tg || [], got = p.t[x.id] || [];
  const trapC = x.tr ? `<p class="g-trap">${rich(x.tr)}${x.cw && !tx(x.tr).includes(x.cw) ? ` ${esc(s('not_this', { c: x.cw }))}.` : ''}</p>` : '';
  const foldB = open === 'extra' ? `<button class="g-fold" data-g="fold" data-i="${i}" aria-label="${esc(s('fold'))}">${I.chevron}</button>` : '';
  return `<li class="${cls}" data-i="${i}" aria-expanded="true"><span class="g-num">${n}</span>${foldB}<div class="g-body">
    ${x.hd ? `<p class="g-hd">${rich(x.hd)}</p>${figHTML(x)}<p class="g-tx">${rich(x.t)}</p>` : `<p class="g-t">${rich(x.t)}</p>${figHTML(x)}`}
    ${x.c ? `<p class="g-big">${esc(x.c)}</p>${trapC}` : ''}
    ${x.bv ? `<p class="g-big g-big-t">${esc(x.bv)}</p>${x.bn ? `<p class="g-trap">${esc(tx(x.bn))}</p>` : ''}` : ''}
    ${!x.c && x.tr ? `<p class="g-trap">${rich(x.tr)}</p>` : ''}
    ${x.ok ? `<p class="g-ok"><b>${esc(s('ok'))}</b> ${rich(x.ok).replace(/^(It worked if|Получилось, если)\s*/i, '')}</p>` : ''}
    ${x.tip ? `<p class="g-tip">${rich(x.tip)}</p>` : ''}
    ${tg.length ? `<div class="g-tags"><p class="g-tn">${esc(s('tags_n', { a: Math.min(got.length, x.need), b: x.need }))}</p>${x.n?.of ? `<p class="g-tsub">${esc(s('tags_any', { of: x.n.of, need: x.need }))}</p>` : ''}<ol>${tg.map((q, k) => `<li class="${got.includes(k) ? 'on' : ''}">
        <button class="g-tc" data-g="tag" data-i="${i}" data-k="${k}" aria-pressed="${got.includes(k)}">${I.check}</button>
        <span>${esc(tx(q.p))}${q.a ? `<small>${esc(q.a)}</small>` : ''}</span>
        ${q.v ? `<button class="g-tv" data-g="video" data-v="${esc(q.v[0])}" data-t="${q.v[1]}" aria-label="${esc(s('video_at', { t: mmss(q.v[1]) }))}">${I.play}<span>${mmss(q.v[1])}</span></button>` : ''}</li>`).join('')}</ol></div>` : ''}
    ${x.at ? `<p class="g-at">${I.pin}<span>${esc(s('in_game'))}: ${esc(typeof x.at === 'string' ? x.at : tx(x.at))}</span></p>` : ''}
    ${x.v ? `<button class="g-tb" data-g="video" data-v="${esc(x.v[0])}" data-t="${x.v[1]}">${I.play}<span>${esc(s('video_at', { t: mmss(x.v[1]) }))}</span></button>` : ''}
  </div>${ck}</li>`;
}
// два способа (решение 09, Bugatti v2): подзаголовок «Два способа», кружок-переключатель, мета «N шагов, M минут»;
// у бага — зелёный статус «работает, проверено <дата>» (поле ok у пути; Игорь 27.11: про патч не писать)
function pathsHTML(h, cur) {
  const anyBug = h.pa.some((x) => x.bug);
  return `<h2 class="g-ways">${esc(s('ways'))}</h2><div class="g-paths">${h.pa.map((x) => `<button class="g-path${x.id === cur.id ? ' on' : ''}" data-g="path" data-v="${esc(x.id)}" aria-pressed="${x.id === cur.id}">
    <i class="g-radio" aria-hidden="true"></i><span class="g-pt"><b>${esc(tx(x.t))}</b><span>${esc(x.tm ? s('path_tm', { n: x.st.length, m: x.tm }) : x.min ? s('path_meta', { n: x.st.length, m: x.min }) : s('meta0', { n: x.st.length }))}${x.bug ? ` <em class="g-works"><i aria-hidden="true"></i>${esc(s('works', { d: C.date(x.sta?.d || x.ok || '2026-11-26') }))}</em>` : anyBug ? `. ${esc(s('always'))}` : ''}</span></span></button>`).join('')}</div>
    `;   // Игорь 27.11: про патч не пишем — у бага статус «работает, проверено <дата>»
}
// заголовок части листа: «Как заехать тихо» → «Баг» / «Квест» → «Гараж и регистрация»
function partHTML(path, st, i) {
  if (!path.id) return '';
  const pt = st[i].pt || '', prev = i ? st[i - 1].pt || '' : null;
  if (prev === pt) return '';
  const first = st.findIndex((x) => (x.pt || '') === pt) === i && i === 0;
  const PT = { quest: 'questPart', quiet: 'quiet', bug: 'bugPart', fin: 'finPart' };   // Bugatti v2: часть по явному pt
  const label = PT[pt] ? s(PT[pt]) : pt === 'quiet' ? s('quiet') : path.id === 'bug' ? s('bugPart') : (i === 0 || first) ? s('questPart') : s('finPart');
  return `<li class="g-part"><h2>${esc(label)}</h2></li>`;
}
// «Дальше» в финале (1–3 строки): next[] записи указателя → только то, что сборка умеет открыть (C.canOpen); место — «в жизни»
// Bugatti v2: «Дальше» всегда в конце списка — до финала с заголовком «Пока ждёте или если надоело» (серии без тупиков)
function nextHTML(fin = true) {
  const rec = recByKey(O.game || 'gta6', `guide:${O.game || 'gta6'}:${O.id}`);
  const rows = (rec ? nextFor(rec, O.game || 'gta6') : []).filter((r) => !C.canOpen || C.canOpen(r.k) || /^(place|egg):/.test(r.k));
  if (!rows.length) return '';
  return `<section class="g-sec g-next"><h2>${esc(s(fin ? 'up' : 'wait'))}</h2>${rows.map((r) => `<button class="g-nx" data-g="go" data-k="${esc(r.k)}"><span class="g-nxt"><b>${esc(r.t ? tx(r.t) : s('inLife'))}</b>${r.sub ? `<small>${esc(tx(r.sub))}</small>` : ''}</span>${C.I.chevron}</button>`).join('')}</section>`;
}
function stuckHTML(ci) {
  const h = H(), st = STEPS(), x = st[ci];
  // ошибки без привязки к шагам — первыми на шагах части «баг»; у ошибки может быть ролик неудачи (f.v)
  const mine = [...(x?.pt === 'bug' ? (h.fx || []).filter((f) => !f.s?.length) : []), ...(h.fx || []).filter((f) => x && (f.s || []).includes(x.id))];
  const all = (h.fx || []).filter((f) => !mine.includes(f));
  const fx = (f) => `<p>${esc(tx(f.t))}</p>${f.v ? `<button class="g-tb" data-g="video" data-v="${esc(f.v[0])}" data-t="${f.v[1]}">${C.I.play}<span>${esc(s('fail_v', { t: mmss(f.v[1]) }))}</span></button>` : ''}`;
  return `<div class="g-fix">${mine.length ? mine.map(fx).join('') : `<p>${esc(s('no_fix'))}</p>`}
    ${all.length || h.alt ? (stuckAll ? all.map(fx).join('') + (h.alt ? `<p><b>${esc(s('alt'))}.</b> ${esc(tx(h.alt.t))}${h.alt.nt ? ` ${esc(tx(h.alt.nt))}` : ''}</p>${h.alt.v ? `<button class="g-tb" data-g="video" data-v="${esc(h.alt.v[0])}" data-t="${h.alt.v[1]}">${C.I.play}<span>${esc(s('video_at', { t: mmss(h.alt.v[1]) }))}</span></button>` : ''}` : '')
      : `<button class="g-link" data-g="still">${esc(s('still'))}</button>`) : ''}</div>`;
}
function render() {
  if (V) { V.render(); return; }
  const h = H(), p = prog(), st = STEPS(), path = PATH(), I = C.I, ci = cur(p), started = p.d.length > 0 || p.s;
  const fr = h.fr ?? 2, wall = !free() && fr < st.length ? fr : -1;
  const sn = O.sn || [], one = O.st === 'one' || sn.length === 1;
  // строка доверия: зелёная с галочкой — только «прошли сами»; у бага её заменяет янтарная строка проверки (Bugatti v2, А7)
  const trust = path.bug ? '' : h.self ? s('self', { d: C.date(h.self) }) : one && sn.length ? s('one', { s: sn[0] }) : sn.length ? s('collected', { n: sn.length }) : '';
  const wh = path.wh || h.wh, req = path.req || h.req;
  const enOnly = !['ru', 'en'].includes(C.lang) && !st[0].t[C.lang];
  layer.innerHTML = `<div class="g-scroll" id="g-scroll">
    <header class="g-top${O.cv ? ' g-top-over' : ''}"><button class="g-ib" data-g="close" aria-label="${esc(s('close'))}">${I.chevron}</button>
      <span class="sb-brand" aria-hidden="true"><img src="icons/brand-mark.svg" alt="" width="26" height="19"><span><b>Secret Base</b><small>sbgta.app</small></span></span>
      <button class="g-ib" data-g="share" aria-label="${esc(s('share'))}">${I.share}</button></header>
    ${O.cv ? `<figure class="g-cover"><img src="${esc(C.imgUrl(O.cv.f))}" alt="" decoding="async" fetchpriority="high"><span class="sb-wm" aria-hidden="true">sbgta.app</span>${O.cv.by ? `<figcaption>${esc(O.cv.by)}</figcaption>` : ''}</figure>` : ''}
    <h1 class="g-h1">${esc(tx(h.ta) || tx(O.t))}</h1>
    ${h.rw ? `<p class="g-rw">${esc(tx(h.rw))}</p>` : ''}
    ${path.sm ? `<p class="g-sm">${esc(tx(path.sm))}</p>` : ''}
    ${h.pa?.length ? pathsHTML(h, path) : `<p class="g-meta">${esc(h.min ? s('meta', { n: st.length, m: h.min }) : s('meta0', { n: st.length }))}</p>`}
    ${trust ? `<p class="g-trust${h.self ? '' : ' g-trust-one'}">${h.self ? I.check : ''}<span>${esc(trust)}</span></p>` : ''}
    ${enOnly ? `<p class="g-meta">${esc(s('en_only'))}</p>` : ''}
    ${wh ? `<button class="g-link g-whole" data-g="video" data-v="${esc(wh[0])}" data-t="${wh[1]}">${I.play}<span>${esc(wh[3] && wh[2] ? s('whole_by', { by: wh[3], n: wh[2], u: ruMin(wh[2]) }) : wh[2] ? s('whole', { n: wh[2] }) : s('whole0'))}</span></button>` : ''}
    ${h.miss ? `<p class="g-miss">${I.alert}<span>${esc(s('missable'))}${typeof h.miss === 'object' ? `. ${esc(tx(h.miss))}` : ''}</span></p>` : ''}
    ${req?.length ? `<section class="g-sec"><h2>${esc(s('before'))}</h2><ul class="g-req">${req.slice(0, 3).map((r) => `<li>${esc(tx(r.t))}</li>`).join('')}</ul></section>` : ''}
    <ol class="g-steps">${st.map((x, i) => partHTML(path, st, i) + (i === wall ? `<li class="g-wall"><p>${esc(s('wall', { a: fr + 1, b: st.length }))}</p><button class="g-pro" data-g="pw">${esc(s('get_pro'))}</button></li>` : '')
      + stepHTML(x, i, p, started && i === ci ? true : openSet.has(i) ? 'extra' : false)).join('')}</ol>
    ${ci >= st.length ? `<p class="g-fin">${I.check}<span>${esc(O.k === 'vehicle' ? s('fin_car') : s('fin'))}</span></p>` : ''}
    ${nextHTML(ci >= st.length)}
    ${path.ret && !path.bug ? `<p class="g-ret">${esc(tx(path.ret))}</p>` : ''}
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
  if (!started) return `<button class="g-main" data-g="start">${esc(PATH().go ? tx(PATH().go) : s('start'))}</button>`;
  if (ci >= st.length) return `<button class="g-sub" data-g="again">${esc(s('again'))}</button><button class="g-main" data-g="close">${esc(s('finish'))}</button>`;
  if (shut(ci)) return `<button class="g-main" data-g="pw">${esc(s('get_pro'))}</button>`;
  // раскрыт не текущий шаг — главная кнопка ведёт к текущему и ничего не отмечает (Bugatti v2, А12)
  if (barAway) return `<button class="g-sub" data-g="stuck">${esc(s('stuck'))}</button><button class="g-main" data-g="tocur">${esc(s('resume', { n: ci + 1 }))}</button>`;
  return `<button class="g-sub" data-g="stuck">${esc(s('stuck'))}</button><button class="g-main" data-g="next">${esc(ci === st.length - 1 ? s('finish') : s('next'))}</button>`;
}
function toStep(i, smooth = true) {
  const el = layer.querySelector(`.g-step[data-i="${i}"]`), sc = layer.querySelector('#g-scroll'); if (!el || !sc) return;
  const y = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 72;
  sc.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
}
// текущий шаг виден на экране? нет — главная кнопка «Продолжить: шаг N» вместо «Сделано, дальше»
function curVisible() {
  const sc = layer?.querySelector('#g-scroll'), p = prog(), el = sc && layer.querySelector(`.g-step[data-i="${cur(p)}"]`);
  if (!sc || !el) return true;
  const a = el.getBoundingClientRect(), v = sc.getBoundingClientRect();
  return a.top < v.bottom - 140 && a.bottom > v.top + 60;
}
// шапка поверх обложки прозрачная, после обложки — сплошная (Игорь 27.11: «обрезано несуразно»)
function syncTop() { const t = layer?.querySelector('.g-top-over'), sc = layer?.querySelector('#g-scroll'), cv = layer?.querySelector('.g-cover');
  if (t && sc && cv) t.classList.toggle('solid', sc.scrollTop > cv.offsetHeight - t.offsetHeight - 8); }
function syncBar() {
  syncTop();
  if (!layer || V) return; const p = prog(), started = p.d.length > 0 || p.s, away = started && !curVisible();
  if (away === barAway) return; barAway = away; const f = layer.querySelector('.g-bar'); if (f) f.innerHTML = barHTML(p, cur(p));
}
let scRaf = 0; function onScroll() { if (scRaf) return; scRaf = requestAnimationFrame(() => { scRaf = 0; syncBar(); }); }
function rerender() { const y = layer.querySelector('#g-scroll')?.scrollTop || 0; render(); layer.querySelector('#g-scroll').scrollTop = y; barAway = !barAway; syncBar(); }

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
  // Игорь 27.11: двойной тап по «Сделано, дальше» отмечал два шага — главная кнопка игнорирует повтор в течение 450 мс
  if (b.classList.contains('g-main')) { const now = Date.now(); if (now - lastMain < 450) return; lastMain = now; }
  if (V?.click(a, b, i, e)) return;
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
    case 'open': C.haptic?.(); openSet.add(i); rerender(); break;
    case 'fold': openSet.delete(i); rerender(); break;
    case 'tocur': delete p.o; setProg(p); toStep(cur(p)); break;
    case 'path': if (p.path !== b.dataset.v) { C.haptic(); p.path = b.dataset.v; delete p.o; setProg(p); rerender(); C.event?.('guide_path', { id: O.id, path: p.path }); } break;
    case 'zoom': { const v = layer.querySelector('#g-video'); v.innerHTML = `<div class="g-vbox"><button class="g-ib g-vx" data-g="vclose" aria-label="${esc(s('close'))}">${C.I.close}</button><img class="g-zoom" src="${esc(b.dataset.src)}" alt="${esc(b.dataset.alt || '')}"><span class="sb-wm sb-wm-z" aria-hidden="true">sbgta.app</span></div>`; v.hidden = false; break; }
    case 'tag': {
      const x = st[i], k = +b.dataset.k, got = new Set(p.t[x.id] || []);
      got.has(k) ? got.delete(k) : got.add(k); p.t[x.id] = [...got]; C.haptic();
      if (got.size >= x.need && !p.d.includes(x.id)) {   // набрали нужное число — шаг сделан, тост и к следующему шагу
        p.d.push(x.id); delete p.o; setProg(p); rerender();
        const nx = st[i + 1];
        C.toast(s('tags_done', { a: x.need, next: nx ? plain(nx.hd || nx.t) : s('fin') }));
        C.event?.('guide_step', { id: O.id, step: i + 1 });
        const n = cur(p); if (n < st.length) toStep(n);
        break;
      }
      setProg(p); rerender(); break;
    }
    case 'stuck': openStuck(); break;
    case 'still': stuckAll = true; openStuck(); break;
    case 'unstuck': layer.querySelector('#g-stuck').hidden = true; break;
    case 'video': video(b.dataset.v, +b.dataset.t || 0); break;
    case 'vclose': { const v = layer.querySelector('#g-video'); v.innerHTML = ''; v.hidden = true; break; }
    case 'again': setProg({ d: [], t: {}, s: 0, path: p.path }); render(); break;
    case 'go': C.event?.('guide_next', { id: O.id, to: b.dataset.k }); C.open?.(b.dataset.k); break;   // C.open сам закрывает инструкцию
    case 'pw': C.paywall(); break;
    case 'report': C.toast(s('report_ok')); C.event?.('guide_report', { id: O.id, step: cur(p) + 1 }); break;
  }
}

export function openGuide(o, ctx) {
  if (!o?.how?.st?.length) return false;
  C = ctx; O = o; stuckAll = false; openSet = new Set(); barAway = false; css();
  V?.stop(); V = o.how.vw === 'settings' ? setView({ C, O, layer: () => layer, prog, s, tx, esc, mmss, rerender, closeGuide })
    : o.how.vw === 'stories' && o.how.pa?.length ? storiesView({ C, O, layer: () => layer, prog, setProg, s, tx, esc, mmss, rich, plain, ruMin, PATH, shut,
      next: nextHTML, stuck: (i, all) => { stuckAll = !!all; return stuckHTML(i); }, wake, closeGuide,
      first: () => { try { if (!localStorage.getItem(FIRST)) localStorage.setItem(FIRST, kOf(O)); } catch { } } }) : null;
  layer = document.getElementById('guide');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'guide'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick); layer.addEventListener('scroll', onScroll, { capture: true, passive: true });
  }
  render();
  layer.classList.add('open');
  document.documentElement.classList.add('guide-open');
  const p = prog();
  // Игорь 27.11: лист всегда открывается сверху (раньше прыгал к текущему шагу — «открывается с середины»); к шагу ведёт кнопка внизу
  const sc0 = layer.querySelector('#g-scroll'); if (sc0) sc0.scrollTop = 0;
  if (p.d.length || p.s) wake(true);
  requestAnimationFrame(syncBar);
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
