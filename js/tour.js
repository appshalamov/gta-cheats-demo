// Знакомство (Игорь 22.11.2026; сценарий «Гибрид», выбор Fable — «Онбординг — на согласование (22.11.2026)/02 Выбор Fable.md»).
// Карта: пролёт к Ocean Drive и карточка сами → человек тянет ползунок «игра ⇄ жизнь» → жмёт «Где в жизни» → «дальше сами».
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
    next(fn) { const b = $('.tr-next', el); b.hidden = false; b.onclick = fn; last = ''; },
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
// ctx: t, tf, haptic, setSnap, reduced, pro (без замка: текст финала без «20 секунд»)
export async function mapTour(ctx) {
  const m = await import('./map.js');
  const B = ctx.base || 0, M = ctx.total || 3;   // после кодов шаги карты — 4–6 из 6
  const ok = await waitFor(() => window.__gtaMap?.loaded && window.__gtaMap.isStyleLoaded(), 8000);
  if (!ok) return 'nomap';   // нет сети / карта не поднялась — сразу к кодам
  const L = layer(ctx);
  let done = false, resolve;
  const finished = new Promise((r) => { resolve = r; });
  const end = (why) => { if (done) return; done = true; cur = null; L.destroy(); resolve(why); };
  cur = { end };
  L.onSkip(() => { ctx.haptic(); end('skip'); });
  const alive = () => !done;

  (async () => {
    // 1. пролёт к Ocean Drive, карточка раскрывается сама
    L.show(ctx.t('onb_fly'), { n: B + 1, m: M }, { block: true });
    const opened = await m.tourOpen(PLACE, ctx.reduced ? 0 : 2200);
    if (!alive()) return;
    if (!opened) { end('noplace'); return; }
    const st = await waitFor(() => $('#sheet-layer.open #sheet-body .cmp-inline'), 3000);
    if (!alive()) return;
    if (!st) { end('nocard'); return; }
    // фото «в игре» и «в жизни» проявляются вместе (до 2,5 с) — ждём, чтобы тянуть было что
    await waitFor(() => !st.classList.contains('ld'), 2600);
    await wait(ctx.reduced ? 0 : 350);
    if (!alive()) return;

    // 2. ползунок: человек тянет сам; «палец» показывает жест один раз (и ещё раз через 5 с бездействия)
    L.show(ctx.t('onb_slide'), { n: B + 2, m: M }, { target: st, block: true, onGone: () => end('gone') });
    let anim = false, moved = false;
    const slide = async () => { if (ctx.reduced) { st.classList.add('tr-ring'); return; } anim = true; await fingerSlide(L, st, m.tourSlide); anim = false; };
    const passed = new Promise((res) => {
      const mo = new MutationObserver(() => {
        if (anim || moved) return;
        const v = +st.getAttribute('aria-valuenow');
        if (Math.abs(v - 50) >= 15) { moved = true; mo.disconnect(); ctx.haptic(); setTimeout(res, 600); }
      });
      mo.observe(st, { attributes: true, attributeFilter: ['aria-valuenow'] });
      L.next(() => { mo.disconnect(); res(); });
      document.querySelector('#tour .tr-next').hidden = true;
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

    // 3. «Где в жизни»: карточка поднимается, строка подсвечена; тап — карта меняется на настоящую
    const row = $('#sheet-body .mp-inreal');
    if (!row) { end('norow'); return; }
    ctx.setSnap('full');
    await wait(ctx.reduced ? 60 : 380);
    const sc = $('#sheet-body');
    if (sc && row.getBoundingClientRect().bottom > innerHeight - 24) sc.scrollTo({ top: sc.scrollTop + row.getBoundingClientRect().bottom - innerHeight * 0.7, behavior: ctx.reduced ? 'auto' : 'smooth' });
    await wait(ctx.reduced ? 0 : 420);
    if (!alive()) return;
    L.show(ctx.t('onb_real'), { n: B + 3, m: M }, { target: row, block: true });
    const tapped = new Promise((res) => {
      row.addEventListener('click', () => res(), { once: true, capture: true });
      setTimeout(() => { if (alive()) { row.classList.add('tr-ring'); L.next(() => row.click()); } }, 6000);
    });
    await tapped;
    row.classList.remove('tr-ring');
    if (!alive()) return;
    L.hide();
    await waitFor(() => m.tourMode() === 'real', 5000);
    await waitFor(() => window.__gtaMap?.loaded && window.__gtaMap.isStyleLoaded(), 4000);
    await wait(ctx.reduced ? 100 : 700);
    if (!alive()) return;

    // финал: подсказка на 2,5 с, затемнения нет, карта свободна
    L.el.classList.remove('out');
    L.show(ctx.t(ctx.pro ? 'onb_free_pro' : 'onb_free'), null, {});
    const fin = () => end('done');
    setTimeout(fin, 2500);
    setTimeout(() => addEventListener('pointerdown', fin, { once: true, capture: true }), 200);
  })().catch(() => end('error'));

  return finished;
}

// ───── коды (Игорь 23.11.2026: знакомство начинается с кодов) ─────
// Главная → карточка самого популярного кода → шторка раскрывается, кнопки загораются по порядку, «Озвучить» (тап; нет — дальше
// сами) → сердечко «в Избранное» (тап; нет — сохраняем сами через 4 с) → «Готово» → шторка закрывается, дальше карта (app.js).
// ctx: t, tf, haptic, reduced, codeId, isFav(id), alone (только коды: старое знакомство «карта, потом коды»)
export async function codesFirst(ctx) {
  const M = ctx.alone ? 3 : 6;
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
  L.onSkip(() => { ctx.haptic(); end('skip'); });
  const alive = () => !done;
  const tapOr = (el, ms, auto) => new Promise((res) => {
    let fired = false;
    const go = (how) => { if (fired) return; fired = true; res(how); };
    el.addEventListener('click', () => go('tap'), { once: true, capture: true });
    setTimeout(() => { if (alive() && !fired) { auto?.(); go('auto'); } }, ms);
  });

  (async () => {
    // 1. карточка кода на Главной; через 4 с шторка открывается сама
    L.show(ctx.t('onb_code1'), { n: 1, m: M }, { target: card, block: true, find: findCard });
    await new Promise((res) => {   // тап по карточке (в том числе по перерисованной) или сами через 4 с
      let fired = false;
      const go = () => { if (fired) return; fired = true; removeEventListener('click', on, true); res(); };
      const on = (e) => { if (e.target.closest?.(`[data-id="${CSS.escape(ctx.codeId)}"]`)) go(); };
      addEventListener('click', on, true);
      setTimeout(() => { if (alive() && !fired) { if (!$('#sheet-layer.open')) (findCard() || card).click(); go(); } }, 4000);
    });
    if (!alive()) return;
    const combo = await waitFor(() => $('#sheet-layer.open #sheet-body .combo'), 3000);
    if (!alive()) return;
    if (!combo) { end('nocombo'); return; }
    await wait(ctx.reduced ? 0 : 400);
    if (!alive()) return;

    // 2. кнопки загораются по порядку (один проход) и «Озвучить»: тап — продиктуем; нет за 5 с — дальше
    const play = $('#sheet-body #play-btn');
    const keys = [...combo.querySelectorAll('[data-i]')];
    L.show(ctx.t(play ? 'onb_voice' : 'onb_code2'), { n: 2, m: M }, { target: play || combo, block: !!play, dim: !!play });
    if (!play) L.el.classList.remove('block');
    const lit = (async () => {
      if (ctx.reduced) { keys.forEach((k) => k.classList.add('tr-lit')); await wait(1200); unlit(); return; }
      for (const k of keys) { if (!alive()) return; k.classList.add('tr-lit'); await wait(280); k.classList.remove('tr-lit'); }
    })();
    if (play) {
      const how = await tapOr(play, 5000 + keys.length * 280);
      if (how === 'tap') {   // ждём, пока код продиктуют (кнопка снова «Озвучить»), но не дольше 14 с
        await wait(300);
        await waitFor(() => !alive() || !play.isConnected || !play.classList.contains('playing'), 14000, 150);
      }
    } else { await lit; await wait(1500); }
    await lit;
    if (!alive()) return;

    // 3. сердечко: «в Избранное»; нет тапа за 4 с — сохраняем сами
    const heart = $('#sheet-body .d-head [data-action="fav"]');
    if (heart && !ctx.isFav(ctx.codeId)) {
      L.show(ctx.t('onb_fav'), { n: 3, m: M }, { target: heart, block: true });
      await tapOr(heart, 4000, () => heart.click());
      await wait(120);
      if (!alive()) return;
    }
    if (heart) {
      L.show(ctx.t(ctx.alone ? 'onb_saved1' : 'onb_saved'), ctx.alone ? null : { n: 3, m: M }, { target: heart, dim: false });
      L.el.classList.remove('block');
    }
    await wait(ctx.reduced ? 900 : 1500);
    end('done');
  })().catch(() => end('error'));

  return finished;
}
// старое название: Главная после пейвола у тех, кто прошёл карту до 23.11
export const codesTour = (ctx) => codesFirst({ ...ctx, alone: true });

// «Назад» браузера, «Начать заново» — убрать подсказки
export function skip() { cur?.end('skip'); }
export const running = () => !!cur;
