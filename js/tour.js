// Знакомство (Игорь 22.11.2026; сценарий «Гибрид», выбор Fable — «Онбординг — на согласование (22.11.2026)/02 Выбор Fable.md»).
// Карта: пролёт к Ocean Drive и карточка сами → человек тянет ползунок «игра ⇄ жизнь» → точка-находка Bugatti → обложка сторис.
// Коды: карточка самого популярного кода на Главной → шторка, кнопки загораются по порядку. Один проход, петель нет.
// 60 кадров: двигаются только transform и opacity; затемнение — тень вокруг «окна», у пузыря сплошной фон без backdrop-filter.
// Касания вне подсвеченного блока закрыты четырьмя прозрачными полосами; «Пропустить» — в пузыре на каждом шаге.

export const PLACE = 'gta6-ocean-drive-art-deco';   // кадр из трейлера 1 и та же улица ночью — своя пара
let cur = null;   // текущий тур: { end(reason) }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (s, r = document) => r.querySelector(s);
async function waitFor(fn, ms, step = 80) {
  const t0 = Date.now();
  for (;;) { const v = fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await wait(step); }
}

// ───── слой подсказок ─────
function layer(ctx) {
  let el = $('#tour');
  if (el) el.remove();
  el = document.createElement('div');
  el.id = 'tour';
  el.innerHTML = `<div class="tr-spot"></div><div class="tr-blk"></div><div class="tr-blk"></div><div class="tr-blk"></div><div class="tr-blk"></div>
    <div class="tr-finger" aria-hidden="true"></div>
    <div class="tr-bub" role="dialog" aria-live="polite"><p class="tr-txt"></p>
      <div class="tr-row"><span class="tr-n"></span><button class="tr-next" type="button" hidden>${ctx.t('onb_next')}</button><button class="tr-skip" type="button">${ctx.t('onb_skip')}</button></div></div>`;
  document.body.appendChild(el);
  const spot = $('.tr-spot', el), blk = [...el.querySelectorAll('.tr-blk')], bub = $('.tr-bub', el), finger = $('.tr-finger', el);
  let target = null, block = false, last = '', raf = 0, gone = null, find = null;
  const W = () => innerWidth, H = () => innerHeight;
  const safeT = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-t')) || 0;
  function place() {
    raf = requestAnimationFrame(place);
    let r = null;
    if (target) {
      if (!target.isConnected) { const t = find?.(); if (t) target = t; else { target = null; gone?.(); } }
      else r = target.getBoundingClientRect();
    }
    const key = r ? [r.left, r.top, r.width, r.height].map(Math.round).join() : 'none';
    const k2 = key + '|' + block + '|' + bub.offsetHeight + '|' + W() + 'x' + H();
    if (k2 === last) return;
    last = k2;
    const pad = 6;
    if (r) {
      const x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2;
      spot.style.transform = `translate(${x}px,${y}px)`; spot.style.width = w + 'px'; spot.style.height = h + 'px';
      spot.classList.add('on');
      // полосы вокруг окна: верх, низ, лево, право
      const set = (b, l, t, ww, hh) => { b.style.transform = `translate(${l}px,${t}px)`; b.style.width = Math.max(0, ww) + 'px'; b.style.height = Math.max(0, hh) + 'px'; };
      set(blk[0], 0, 0, W(), y); set(blk[1], 0, y + h, W(), H() - y - h); set(blk[2], 0, y, x, h); set(blk[3], x + w, y, W() - x - w, h);
      // пузырь: над блоком, если блок в нижней половине, иначе под ним
      const bh = bub.offsetHeight, above = r.top + r.height / 2 > H() / 2;
      let top = above ? y - bh - 12 : y + h + 12;
      top = Math.max(safeT() + 8, Math.min(H() - bh - 8, top));
      bub.style.transform = `translate(0,${Math.round(top)}px)`;
    } else {
      spot.classList.remove('on');
      blk.forEach((b, i) => { b.style.transform = 'translate(0,0)'; b.style.width = i ? '0px' : W() + 'px'; b.style.height = i ? '0px' : H() + 'px'; });
      bub.style.transform = `translate(0,${Math.round(safeT() + 64)}px)`;
    }
    el.classList.toggle('block', block);
  }
  raf = requestAnimationFrame(place);
  return {
    el, finger, bub,
    show(text, n, opts = {}) {
      target = opts.target || null; block = !!opts.block; gone = opts.onGone || null; find = opts.find || null;
      $('.tr-txt', el).textContent = text;
      $('.tr-n', el).textContent = n ? ctx.tf('onb_of', n) : '';
      $('.tr-next', el).hidden = true;
      el.classList.toggle('dim', !!(target && opts.dim !== false));
      bub.classList.remove('in'); void bub.offsetWidth; bub.classList.add('in');
      last = '';
    },
    next(fn, label) { const b = $('.tr-next', el); b.hidden = false; b.onclick = fn; b.textContent = label || ctx.t('onb_next'); last = ''; },
    onSkip(fn) { $('.tr-skip', el).onclick = fn; },
    hide() { el.classList.add('out'); },
    destroy() { cancelAnimationFrame(raf); el.classList.add('out'); setTimeout(() => el.remove(), 220); },
  };
}

// один проход «пальца» по ползунку: середина → влево → вправо → середина (1,8 с), ползунок едет вместе с ним
function fingerSlide(L, st, setX, ms = 1800) {
  return new Promise((res) => {
    const f = L.finger, ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    const pts = [[0, 50], [0.3, 22], [0.72, 78], [1, 50]];
    const t0 = performance.now();
    f.classList.add('on');
    (function tick(now) {
      const p = Math.min(1, (now - t0) / ms);
      let i = 0; while (i < pts.length - 2 && p > pts[i + 1][0]) i++;
      const [a, va] = pts[i], [b, vb] = pts[i + 1], k = ease((p - a) / (b - a || 1)), v = va + (vb - va) * k;
      const r = st.getBoundingClientRect();
      if (!st.isConnected) { f.classList.remove('on'); res(); return; }
      f.style.transform = `translate(${r.left + r.width * v / 100 - 22}px,${r.top + r.height / 2 - 22}px)`;
      setX(st, v);
      if (p < 1) requestAnimationFrame(tick); else { setTimeout(() => f.classList.remove('on'), 120); res(); }
    })(t0);
  });
}

// ───── карта ─────
// Решение Fable 28.11 п. 4: шаг 2 из 3 — ползунок на Ocean Drive, шаг 3 из 3 — точка-находка Bugatti → обложка сторис.
// «Где в жизни» из тура убрано (страховка — ringReal ниже). ctx: t, tf, haptic, setSnap, reduced, pro, closeSheet, openStory, event
export const FIND = 'egg-bugatti-thrax-andrew-node';
const G2M = (gx, gy) => { const fx = (gx + 16384) / 32768, fy = (16384 - gy) / 32768; return [fx * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * fy))) * 180 / Math.PI]; };
// где точка находки на карте: сначала из источника карты (те же координаты, что у точки), иначе из данных
let eggsP = null;
async function findCenter(map, mode) {
  try {
    const d = await (eggsP ||= fetch('data/map/gta6.json').then((r) => r.json()));
    const i = (d.eggs || []).findIndex((x) => x.id === FIND); if (i < 0) return null;
    try { const f = map.querySourceFeatures('eggs').find((x) => x.properties?.i === i); if (f) return f.geometry.coordinates; } catch { }
    const e = d.eggs[i];
    return mode === 'game' && e.gm ? G2M(e.gm[0], e.gm[1]) : [e.lon, e.lat];
  } catch { return null; }
}
export async function mapTour(ctx) {
  const m = await import('./map.js');
  const B = ctx.base || 0, M = ctx.total || 3;
  const ev = (n, d) => { try { ctx.event?.(n, d); } catch { } };
  const ok = await waitFor(() => window.__gtaMap?.loaded && window.__gtaMap.isStyleLoaded(), 8000);
  if (!ok) return 'nomap';   // нет сети / карта не поднялась — остаёмся на Главной с блоком «С чего начать»
  const L = layer(ctx);
  let done = false, resolve, step = B + 2;
  const finished = new Promise((r) => { resolve = r; });
  const end = (why) => { if (done) return; done = true; cur = null; L.destroy(); document.querySelector('#tr-pt')?.remove(); resolve(why); };
  cur = { end };
  L.onSkip(() => { ctx.haptic(); ev('onb_skip', { n: step }); end('skip'); });
  const alive = () => !done;

  (async () => {
    // пролёт к Ocean Drive, карточка раскрывается сама; подпись без номера шага
    L.show(ctx.t('onb_fly'), null, { block: true });
    const opened = await m.tourOpen(PLACE, ctx.reduced ? 0 : 2200);
    if (!alive()) return;
    if (!opened) { end('noplace'); return; }
    const st = await waitFor(() => $('#sheet-layer.open #sheet-body .cmp-inline'), 3000);
    if (!alive()) return;
    if (!st) { end('nocard'); return; }
    await waitFor(() => !st.classList.contains('ld'), 2600);
    await wait(ctx.reduced ? 0 : 350);
    if (!alive()) return;

    // 2 из 3. ползунок: человек тянет сам; «палец» показывает жест один раз (и ещё раз через 5 с бездействия) + «Дальше»
    ev('onb_step', { n: B + 2 });
    L.show(ctx.t('onb_slide'), { n: B + 2, m: M }, { target: st, block: true, onGone: () => end('gone') });
    let anim = false, moved = false;
    const t0 = Date.now();
    const slide = async () => { if (ctx.reduced) { st.classList.add('tr-ring'); return; } anim = true; await fingerSlide(L, st, m.tourSlide); anim = false; };
    const passed = new Promise((res) => {
      const mo = new MutationObserver(() => {
        if (anim || moved) return;
        const v = +st.getAttribute('aria-valuenow');
        if (Math.abs(v - 50) >= 15) { moved = true; mo.disconnect(); ctx.haptic(); ev('onb_slide_ms', { ms: Date.now() - t0 }); setTimeout(res, 600); }
      });
      mo.observe(st, { attributes: true, attributeFilter: ['aria-valuenow'] });
      setTimeout(async () => {
        if (!alive() || moved) return;
        await slide();
        if (alive() && !moved) L.next(() => { mo.disconnect(); res(); });
      }, 5000 + (ctx.reduced ? 0 : 1800));
    });
    await slide();
    await passed;
    st.classList.remove('tr-ring');
    if (!alive()) return;

    // 3 из 3. карточка закрыта, карта игры едет к точке Bugatti, кольцо; тап — обложка сторис
    step = B + 3;
    L.show(ctx.t('onb_find'), { n: B + 3, m: M }, { block: true });
    ctx.closeSheet?.();
    const map = window.__gtaMap;
    await wait(ctx.reduced ? 60 : 380);
    const c = map && await findCenter(map, m.tourMode());
    if (!alive()) return;
    if (!c) { end('nofind'); return; }
    await new Promise((res) => {
      const tm = setTimeout(res, 2600);
      map.once('moveend', () => { clearTimeout(tm); res(); });
      map.easeTo({ center: c, zoom: Math.max(map.getZoom(), 6.8), duration: ctx.reduced ? 0 : 1600 });
    });
    if (!alive()) return;
    const pt = document.createElement('button');
    pt.id = 'tr-pt'; pt.type = 'button'; pt.className = 'tr-pt tr-ring'; pt.setAttribute('aria-label', ctx.t('onb_find'));
    L.el.appendChild(pt);
    const placePt = () => { if (!pt.isConnected) return; const p = map.project(c), r = map.getContainer().getBoundingClientRect(); pt.style.transform = `translate(${Math.round(r.left + p.x - 26)}px,${Math.round(r.top + p.y - 26)}px)`; requestAnimationFrame(placePt); };
    placePt();
    ev('onb_step', { n: B + 3 });
    L.show(ctx.t('onb_find'), { n: B + 3, m: M }, { target: pt, block: true });
    const go = () => { if (!alive()) return; ctx.haptic(); ev('onb_story_open', {}); end('story'); ctx.openStory?.(); };
    pt.addEventListener('click', go);
    setTimeout(() => { if (!alive()) return; pt.classList.remove('tr-ring'); void pt.offsetWidth; pt.classList.add('tr-ring'); L.next(go); }, 6000);
  })().catch(() => end('error'));

  return finished;
}
// после сторис (или «Пропустить» на карте): пузырь «Дальше сами» на 2,5 с, затемнения нет, карта свободна
export function freeHint(ctx) {
  const L = layer(ctx);
  L.show(ctx.t(ctx.pro ? 'onb_free_pro' : 'onb_free'), null, {});
  L.el.querySelector('.tr-skip').hidden = true;
  let gone = false; const fin = () => { if (gone) return; gone = true; L.destroy(); };
  setTimeout(fin, 2500);
  setTimeout(() => addEventListener('pointerdown', fin, { once: true, capture: true }), 200);
}
// страховка: в первой карточке места за 20 с показа строка «Где в жизни» один раз обводится кольцом, без пузыря
export function ringReal(ms = 20000) {
  const until = Date.now() + ms;
  const mo = new MutationObserver(() => {
    if (Date.now() > until) { mo.disconnect(); return; }
    const row = document.querySelector('#sheet-layer.open #sheet-body .mp-inreal');
    if (row) { mo.disconnect(); row.classList.add('tr-ring'); setTimeout(() => row.classList.remove('tr-ring'), 2200); }
  });
  const host = document.getElementById('sheet-body') || document.body;
  mo.observe(host, { childList: true, subtree: true });
  setTimeout(() => mo.disconnect(), ms + 500);
}
// «3 дня бесплатно» нажато после показа карты: точка Bugatti один раз пульсирует
export async function pulseFind() {
  const map = window.__gtaMap; if (!map) return;
  const m = await import('./map.js'); const c = await findCenter(map, m.tourMode()); if (!c) return;
  const r0 = map.getContainer().getBoundingClientRect(), p = map.project(c);
  if (p.x < 0 || p.y < 0 || p.x > r0.width || p.y > r0.height) return;
  const el = document.createElement('span'); el.className = 'tr-pt tr-ring tr-pulse'; el.setAttribute('aria-hidden', 'true');
  el.style.transform = `translate(${Math.round(r0.left + p.x - 26)}px,${Math.round(r0.top + p.y - 26)}px)`;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2400);
}

// ───── коды (Игорь 23.11.2026: знакомство начинается с кодов) ─────
// Главная → карточка самого популярного кода → шторка раскрывается, кнопки загораются по порядку, «Озвучить» по желанию →
// «К карте» в пузыре → шторка закрывается, дальше карта (app.js). Сердечко из тура убрано (решение Fable 28.11 п. 4).
// ctx: t, tf, haptic, reduced, codeId, isFav(id), alone (только коды: старое знакомство «карта, потом коды»)
export async function codesFirst(ctx) {
  const M = 3;
  const ev = (n, d) => { try { ctx.event?.(n, d); } catch { } };
  const findCard = () => document.querySelector(`#view-home .hscroll [data-id="${CSS.escape(ctx.codeId)}"]`)
    || document.querySelector(`#view-home [data-id="${CSS.escape(ctx.codeId)}"][data-action="open"]`);
  // Главная перерисовывается, когда догружаются данные и новости: ждём, пока карточка простоит одной и той же 0,5 с
  let card = null;
  for (let t0 = Date.now(), seen = null, since = 0; Date.now() - t0 < 5000; await wait(100)) {
    const c = findCard();
    if (c !== seen) { seen = c; since = Date.now(); }
    if (c && Date.now() - since >= 500) { card = c; break; }
  }
  card ||= findCard();
  if (!card) return 'nocard';
  card.scrollIntoView({ block: 'center', behavior: ctx.reduced ? 'auto' : 'smooth' });
  await wait(ctx.reduced ? 50 : 600);
  card = findCard() || card;
  const L = layer(ctx);
  let done = false, resolve;
  const finished = new Promise((r) => { resolve = r; });
  const unlit = () => document.querySelectorAll('.tr-lit').forEach((x) => x.classList.remove('tr-lit'));
  const end = (why) => { if (done) return; done = true; cur = null; L.destroy(); unlit(); resolve(why); };
  cur = { end };
  L.onSkip(() => { ctx.haptic(); ev('onb_skip', { n: 1 }); end('skip'); });
  const alive = () => !done;
  const tapOr = (el, ms, auto) => new Promise((res) => {
    let fired = false;
    const go = (how) => { if (fired) return; fired = true; res(how); };
    el.addEventListener('click', () => go('tap'), { once: true, capture: true });
    setTimeout(() => { if (alive() && !fired) { auto?.(); go('auto'); } }, ms);
  });

  (async () => {
    // 1. карточка кода на Главной; через 4 с шторка открывается сама
    ev('onb_step', { n: 1 });
    L.show(ctx.t('onb_code1'), { n: 1, m: M }, { target: card, block: true, find: findCard });
    await new Promise((res) => {   // тап по карточке (в том числе по перерисованной) или сами через 4 с
      let fired = false;
      const go = () => { if (fired) return; fired = true; removeEventListener('click', on, true); res(); };
      const on = (e) => { if (e.target.closest?.(`[data-id="${CSS.escape(ctx.codeId)}"]`)) go(); };
      addEventListener('click', on, true);
      setTimeout(() => { if (alive() && !fired) { if (!$('#sheet-layer.open')) (findCard() || card).click(); go(); } }, 4000);
    });
    if (!alive()) return;
    const combo = await waitFor(() => $('#sheet-layer.open #sheet-body #d-code'), 3000);   // талон кода своей платформы (.combo ниже — «Другие платформы»)
    if (!alive()) return;
    if (!combo) { end('nocombo'); return; }
    await wait(ctx.reduced ? 0 : 400);
    if (!alive()) return;

    // 1 из 3, в шторке (решение Fable 28.11 п. 4): кнопки загораются по порядку; «Озвучить» — по желанию, пузырь не уходит;
    // дальше — кнопкой в пузыре «К карте». Не торопим: само не уходит. Шторку закрыли — тоже дальше.
    const play = $('#sheet-body #play-btn');
    const keys = [...combo.querySelectorAll('[data-i]')];
    L.show(ctx.t(play ? 'onb_voice' : 'onb_code2'), { n: 1, m: M }, { target: combo, dim: true });
    L.el.classList.remove('block');
    (async () => {
      if (ctx.reduced) { keys.forEach((k) => k.classList.add('tr-lit')); await wait(1200); unlit(); return; }
      for (const k of keys) { if (!alive()) return; k.classList.add('tr-lit'); await wait(280); k.classList.remove('tr-lit'); }
    })();
    await new Promise((res) => {
      L.next(() => { ctx.haptic(); res(); }, ctx.t(ctx.alone ? 'onb_done' : 'onb_tomap'));
      const iv = setInterval(() => { if (!alive() || !$('#sheet-layer.open #sheet-body #d-code')) { clearInterval(iv); res(); } }, 250);
    });
    end('done');
  })().catch(() => end('error'));

  return finished;
}
// старое название: Главная после пейвола у тех, кто прошёл карту до 23.11
export const codesTour = (ctx) => codesFirst({ ...ctx, alone: true });

// «Назад» браузера, «Начать заново» — убрать подсказки
export function skip() { cur?.end('skip'); }
export const running = () => !!cur;
