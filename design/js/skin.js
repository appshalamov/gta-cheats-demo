// Смена игры (экран 4 этапа 2): размытие → табло города (без года, решение Игоря №15) → вид города → вспышка → новый интерфейс.
// switchTo(id): слой #skin-cover накрывает экран, под ним ставится новый data-skin и экран перерисовывается
// (apply от вызывающего), потом слой снимается. Жёсткий потолок 2,5 с, пропуск тапом или клавишей,
// меньше движения — растворение 200 мс. Двигаются только transform / opacity / filter (css/skin.css).
import { HERO, GAMES } from './config.js';
import { t, getLang } from './i18n.js';

export const SKINS = { gta6: 'gta6', gta5: 'gta5', gta4: 'gta4', gtasa: 'sa' };

const MAX = 2500;                    // --d-skin-switch-max: что бы ни случилось, интерфейс показан
// метки времени от тапа, мс (CSS-задержки в css/skin.css — те же числа)
const TL = { swap: 860, haptic: 1760, out: 1880, outDur: 320 };
const SKIP_OUT = 140;                // пропуск: слой гаснет за 140 мс
const DISSOLVE = 100;                // меньше движения: 100 мс в слой + 100 мс из слоя
const root = document.documentElement;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pic = (b) => `<picture><source type="image/avif" srcset="${b}.avif"><img src="${b}.webp" alt="" width="860" height="1864" decoding="async"></picture>`;

let cur = null;                      // идущая смена

function cover() {
  let c = document.getElementById('skin-cover');
  if (!c) { c = document.createElement('div'); c.id = 'skin-cover'; c.hidden = true; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c); }
  if (!c.firstChild) {
    c.innerHTML = '<div class="sc-frost"></div><div class="sc-air"></div><div class="sc-shade"></div>'
      + '<div class="sc-board"><div class="sc-flap sc-city"></div><div class="sc-game"></div><div class="sc-load"><i></i></div></div>'
      + '<div class="sc-flash"></div><span class="sc-skip"></span><div class="sc-warm" hidden></div>';
    c.addEventListener('click', skip);
  }
  return c;
}

// акцент эпохи для полосы загрузки — из tokens.css (тёмная тема: слой всегда над тёмным фото), до смены скина
const accents = {};
function accentOf(sk) {
  if (sk in accents) return accents[sk];
  let v = '';
  for (const s of document.styleSheets) {
    let rules; try { rules = s.cssRules; } catch { continue; }
    for (const r of rules || []) {
      const sel = r.selectorText || '';
      if (sel.includes(`[data-skin="${sk}"]`) && !sel.includes('light')) { v = r.style.getPropertyValue('--accent').trim(); if (v) break; }
    }
    if (v) break;
  }
  return (accents[sk] = v);
}

// прогрев: «вид» и первый баннер нового скина. Ждать не дольше 300 мс — дальше анимация идёт без фото.
const warmed = {};
export function warm(id) {
  const h = HERO[id];
  if (!h) return Promise.resolve(false);
  if (warmed[id]) return warmed[id];
  const box = cover().querySelector('.sc-warm');
  box.querySelectorAll(`[data-w="${id}"]`).forEach((x) => x.remove());
  const imgs = [h.load, h.banners[0]].map((b) => {
    const d = document.createElement('div'); d.dataset.w = id; d.innerHTML = pic(b); box.appendChild(d);
    return d.querySelector('img');
  });
  const p = Promise.all(imgs.map((i) => i.decode().then(() => true, () => false))).then((ok) => {
    if (!ok.every(Boolean)) delete warmed[id];   // без сети — в следующий раз попробуем снова
    return ok[0];
  });
  return (warmed[id] = p);
}

const RND = { ru: 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789', en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' };
// табло: ячейки по длине новой надписи, каждая перелистывается 2–4 раза
function flap(el, from, to, delay, st) {
  const set = RND[getLang()] || RND.en;
  el.style.setProperty('--n', to.length);
  el.innerHTML = [...to].map((_, i) => `<i>${esc(from[i] && from[i] !== ' ' ? from[i] : '')}</i>`).join('');
  [...el.children].forEach((cell, i) => {
    const target = to[i], flips = 2 + (i % 3); let n = 0;
    const tick = () => {
      cell.className = n % 2 ? 'f1' : 'f2';   // два одинаковых ключевых кадра по очереди — перезапуск без пересчёта раскладки
      cell.textContent = n < flips && target !== ' ' ? set[(Math.random() * set.length) | 0] : target;
      if (++n <= flips) st.timers.push(setTimeout(tick, 80));
    };
    st.timers.push(setTimeout(tick, delay + i * 40));
  });
}
// табло — только город (года у городов убраны, решение Игоря №15); подпись игры — строкой ниже (.sc-game)
const cityOf = (id) => ({ city: (HERO[id]?.city?.[getLang()] || HERO[id]?.city?.en || String(t('place_' + id)).split(/,\s*/)[0] || '').toUpperCase() });

function fill(c, id, fromSk) {
  const to = cityOf(id);
  const fromId = Object.keys(SKINS).find((k) => SKINS[k] === fromSk);
  const from = fromId && HERO[fromId] ? cityOf(fromId) : { city: '' };
  c.style.setProperty('--sc-acc', accentOf(SKINS[id]) || 'currentColor');
  const air = c.querySelector('.sc-air');
  air.innerHTML = HERO[id] ? pic(HERO[id].load) : '';
  c.querySelector('.sc-game').textContent = GAMES.find((g) => g.id === id)?.title || '';
  c.querySelector('.sc-skip').textContent = t('skin_skip');
  c.querySelector('.sc-city').textContent = '';
  return { to, from, img: air.querySelector('img') };
}

const mark = (k) => { if (window.__skinLast && cur) window.__skinLast[k] = Math.round(performance.now() - cur.t0); };

// под слоем: новый скин, затем перерисовка от вызывающего (после данных, но не дольше потолка)
function swap(st) {
  if (st.swapped) return;
  st.swapped = true;
  root.dataset.skin = st.sk;
  mark('swap');
  let applied = false;
  const go = () => { if (st.cancelled) return; try { st.apply?.(); } catch (e) { setTimeout(() => { throw e; }); } };
  st.applied = new Promise((res) => {
    const once = () => { if (!applied) { applied = true; go(); res(); } };
    st.p.then(once);
    // данные не пришли (нет сети) — рисуем с тем, что есть; когда придут — ещё раз. Таймер не в st.timers: пропуск его не снимает
    setTimeout(() => { if (!applied) { once(); st.p.then(go); } }, Math.max(0, MAX - 260 - (performance.now() - st.t0)));
  });
}

function reveal(st, dur) {
  if (st.revealing) return;
  st.revealing = true;
  mark('reveal');
  const c = cover();
  c.style.setProperty('--sc-out', dur + 'ms');
  c.classList.add('out');
  st.timers.push(setTimeout(() => end(st), dur));
}

function end(st) {
  if (st.done) return;
  st.done = true;
  st.timers.forEach(clearTimeout); clearTimeout(st.hard);
  if (!st.swapped) swap(st);
  const c = cover();
  c.hidden = true; c.className = '';
  c.querySelector('.sc-air').innerHTML = '';
  root.classList.remove('skin-switching');
  removeEventListener('keydown', onKey, true);
  mark('shown');
  if (cur === st) cur = null;
  dispatchEvent(new CustomEvent('skin:shown', { detail: { ...window.__skinLast } }));
}

const buzz = (st) => { if (!st.buzzed) { st.buzzed = true; st.haptic?.(); } };   // отклик один раз — в момент смены

function onKey(e) { if (!cur) return; e.preventDefault(); e.stopPropagation(); skip(); }

// тап по слою или клавиша: сразу конечное состояние
function skip() {
  const st = cur;
  if (!st || st.revealing) return;
  st.timers.forEach(clearTimeout); st.timers = [];
  if (window.__skinLast) window.__skinLast.skipped = true;
  mark('skip');
  swap(st);
  buzz(st);
  reveal(st, SKIP_OUT);
}

export const switching = () => !!cur;

/**
 * Сменить игру с анимацией.
 * id — игра (gta6 / gta5 / gta4 / gtasa); apply — перерисовать экран под слоем; prepare — загрузка данных (промис),
 * стартует сразу и идёт параллельно с анимацией; haptic — тактильный отклик в момент смены.
 * Та же игра (скин уже стоит) — без анимации: только apply. Повторный вызов во время смены — игнор.
 */
export function switchTo(id, { apply, prepare, haptic } = {}) {
  const sk = SKINS[id];
  const p = Promise.resolve().then(() => prepare?.()).catch(() => null);
  if (!sk || root.dataset.skin === sk) { p.then(() => apply?.()); return false; }
  if (cur) { p.then(() => apply?.()); return false; }   // вторая смена во время первой (ввод закрыт слоем, но на всякий случай) — без анимации
  const t0 = performance.now();
  const rm = reduce();
  const c = cover();
  const fromSk = root.dataset.skin;
  const st = cur = { id, sk, t0, p, apply, haptic, timers: [], swapped: false, revealing: false, done: false };
  window.__skinLast = { id, mode: rm ? 'reduce' : 'full', t0: Math.round(t0) };
  addEventListener('keydown', onKey, true);
  // жёсткий потолок: слой снимается в любом случае
  st.hard = setTimeout(() => { swap(st); end(st); }, MAX);
  if (rm) {
    c.className = 'sc-reduce';
    c.hidden = false;
    void c.offsetWidth;
    c.classList.add('run');
    st.timers.push(setTimeout(() => { swap(st); buzz(st); st.applied.then(() => reveal(st, DISSOLVE)); }, DISSOLVE));
    return true;
  }
  const w = warm(id);
  const { to, from, img } = fill(c, id, fromSk);
  c.className = '';
  c.hidden = false;
  root.classList.add('skin-switching');   // will-change — только на время анимации
  void c.offsetWidth;
  c.classList.add('run');
  // фото: если «вид» уже в кэше — в полёт с ним; нет за 300 мс — слой без фото, анимация не ждёт сеть
  const showPhoto = () => { if (!st.done && performance.now() - t0 < 700 && img?.naturalWidth) c.classList.add('has-photo'); };
  if (img) { if (img.complete && img.naturalWidth) c.classList.add('has-photo'); else img.addEventListener('load', showPhoto, { once: true }); }
  w.then(showPhoto);
  flap(c.querySelector('.sc-city'), from.city, to.city, 120, st);
  st.timers.push(setTimeout(() => swap(st), TL.swap));
  st.timers.push(setTimeout(() => buzz(st), TL.haptic));
  st.timers.push(setTimeout(() => {
    // данные ещё грузятся — держим слой, пока не перерисовали, но в пределах потолка
    const left = MAX - (performance.now() - t0);
    Promise.race([st.applied, new Promise((r) => setTimeout(r, Math.max(0, left - TL.outDur - 40)))])
      .then(() => reveal(st, Math.max(80, Math.min(TL.outDur, MAX - (performance.now() - t0) - 20))));
  }, TL.out));
  return true;
}
