// Чит-коды GTA — демо PWA.
// Архитектура как у Cheats Pro: онбординг (игра → платформа) → пейвол →
// 4 вкладки (Главная / Поиск / Избранное / Настройки) → шторка чита.

import { APP, CATEGORIES, DEFAULT_CATEGORY, PLATFORMS, GAMES, PAYWALL } from './config.js';
import { t, L, setLang, getLang, SPEAK } from './i18n.js';
import { I, platformIcon, comboHTML } from './icons.js';

// ───────── хранилище ─────────
const KEY = 'cheats.v1';
const DEFAULTS = { onboarded: false, game: 'gta5', platform: 'playstation', favs: [], pro: false, theme: 'dark', lang: null, haptic: true, installHint: false };
const store = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { }
  return { ...DEFAULTS, ...s };
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { } }

// ───────── состояние экрана ─────────
const ui = { prevTab: 'home', tab: 'home', cat: DEFAULT_CATEGORY, query: '', obStep: 'game', obGame: null, obPlatform: null, stopPlay: null };
const data = {}; // gameId -> {cheats, ...}

const $ = (sel, root = document) => root.querySelector(sel);
const mapMod = () => import('./map.js');
const mapCtx = () => ({ openSheet, haptic, toast, I });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const game = () => GAMES.find((g) => g.id === store.game) || GAMES[0];
const cheats = () => (data[store.game]?.cheats) || [];
const byId = (id) => Object.values(data).flatMap((d) => d.cheats).find((c) => c.id === id);
const isLocked = (c) => c.pro && !store.pro;

// ───────── отклик ─────────
const hapticEl = (() => {
  const l = document.createElement('label');
  l.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden';
  l.innerHTML = '<input type="checkbox" switch>';
  document.body.appendChild(l);
  return l;
})();
function haptic() {
  if (!store.haptic) return;
  if (navigator.vibrate) navigator.vibrate(10); else hapticEl.click(); // iOS 18+: переключатель даёт тактильный отклик
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ───────── высота окна ─────────
// iOS 26, режим «на экране Домой»: innerHeight/100dvh занижены на высоту чёлки (WebKit 301994),
// а fixed-корень обрезается по ним. Поэтому корень в обычном потоке (css/layout.css), а высота:
// standalone → 100vh (iOS её не занижает), браузер → 100dvh. Пиксели innerHeight/screen.height не используем.
// Проверка без iPhone: ?vptest=805x852 включает режим standalone.
const VPTEST = /[?&]vptest=(\d+)x(\d+)/.exec(location.search);
if (VPTEST) {
  Object.defineProperty(screen, 'height', { get: () => +VPTEST[2], configurable: true });
  Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true });
}
const isStandalone = () => !!(matchMedia('(display-mode: standalone)').matches || navigator.standalone);
function probe(css) {
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;' + css;
  document.documentElement.appendChild(d);
  const v = Math.round(d.getBoundingClientRect().height || parseFloat(getComputedStyle(d).paddingBottom) || 0);
  d.remove(); return v;
}
function fitViewport() {
  const root = document.documentElement;
  const sa = isStandalone();
  root.style.setProperty('--app-h', sa ? '100vh' : '100dvh');
  // у iPhone с полосой жеста env() в standalone иногда отдаёт 0 — минимум 20px, чтобы иконки не легли под полосу
  const faceId = Math.max(screen.height, screen.width) >= 812 && /iphone/i.test(navigator.userAgent + (VPTEST ? 'iphone' : ''));
  if (sa && faceId) root.style.setProperty('--safe-b-min', '20px'); else root.style.removeProperty('--safe-b-min');
  window.__vp = {
    inner: window.innerHeight, vh: probe('height:100vh'), dvh: probe('height:100dvh'), screen: screen.height,
    safeB: probe('height:0;padding-bottom:env(safe-area-inset-bottom)'), standalone: sa, guard: false,
  };
  setTimeout(() => { guardTabbar(); checkDocOverflow(); }, 50);
}
fitViewport();
addEventListener('resize', fitViewport);
addEventListener('orientationchange', () => setTimeout(fitViewport, 300));
// Страница никогда не должна прокручиваться (всё листается внутри своих блоков).
// Предохранитель: любая прокрутка документа — сразу назад. Самопроверка: документ не выше body.
addEventListener('scroll', () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); }, { passive: true });
function checkDocOverflow() {
  const se = document.scrollingElement, bh = document.body.getBoundingClientRect().height;
  const over = se.scrollHeight > Math.ceil(bh) + 1 || se.scrollWidth > window.innerWidth + 1;
  if (over) console.warn('[layout] документ шире/выше body — страница может прокручиваться', se.scrollWidth, se.scrollHeight, bh);
  if (window.__vp) window.__vp.overflow = over;
  return over;
}
window.__checkDocOverflow = checkDocOverflow;
// без fixed-корня iOS при открытии клавиатуры сдвигает страницу вверх — возвращаем
['focusin', 'focusout'].forEach((ev) => addEventListener(ev, () => {
  if (!isStandalone()) return;
  [0, 16, 50, 100, 200].forEach((ms) => setTimeout(() => window.scrollTo(0, 0), ms));
}));

// Предохранитель: панель вкладок обязана стоять в пределах экрана (в standalone — полный экран,
// в браузере — окно). Если вылезла из-за будущей правки CSS — каркас ужимается до окна.
function guardTabbar() {
  const tb = document.getElementById('tabbar');
  if (!tb || !tb.offsetParent) return;
  const limit = isStandalone() ? Math.max(window.innerHeight, window.__vp?.vh || 0) : window.innerHeight;
  const r = tb.getBoundingClientRect();
  if (r.bottom > limit + 1) {
    document.documentElement.style.setProperty('--app-h', limit + 'px');
    if (window.__vp) window.__vp.guard = true;
  }
}
window.__guardTabbar = guardTabbar; // для проверки
fitViewport();
addEventListener('resize', fitViewport);
addEventListener('orientationchange', () => setTimeout(fitViewport, 300));

// ───────── тема и язык ─────────
function applyTheme() {
  const th = store.theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : store.theme;
  document.documentElement.dataset.theme = th;
  $('meta[name="theme-color"]').setAttribute('content', th === 'light' ? '#f7f7f9' : '#101013'); // = цвет нижней панели
}
matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', applyTheme);

// ───────── данные ─────────
async function loadGame(id) {
  if (data[id]) return data[id];
  const g = GAMES.find((x) => x.id === id);
  if (!g || g.status === 'soon') return null;
  const r = await fetch(`data/${id}.json`);
  data[id] = await r.json();
  return data[id];
}

// ───────── блоки кода ─────────
function phoneLine(phone) {
  return phone ? `<div class="phone-line">${t('phone_code')}: <b>${esc(phone)}</b></div>` : '';
}
function chars(str, cls) {
  return `<div class="${cls}">${[...str].map((ch, i) => ch === '-' ? '<i class="dash">-</i>' : `<span class="ch" data-i="${i}">${esc(ch)}</span>`).join('')}</div>`;
}
function codeBlock(c, platform, big = false) {
  const k = c.codes || {};
  const none = `<div class="no-code">${I.sparkle}<span>${t('no_code_yet')}</span></div>`;
  if (platform === 'phone') return k.phone ? (big ? chars(k.phone, 'phone-big') : `<div class="phone-big">${esc(k.phone)}</div>`) : none;
  if (platform === 'pc') {
    if (k.pc) return (big ? chars(k.pc, 'pc-code') : `<div class="pc-code">${esc(k.pc)}</div>`) + phoneLine(k.phone);
    if (k.phone) return `<div class="sub-label">${t('phone_only')}</div>` + (big ? chars(k.phone, 'phone-big') : `<div class="phone-big">${esc(k.phone)}</div>`);
    return none;
  }
  const combo = k[platform];
  if (combo && combo.length) return phoneLine(k.phone) + comboHTML(combo, platform, big);
  if (k.phone) return `<div class="sub-label">${t('phone_only')}</div>` + (big ? chars(k.phone, 'phone-big') : `<div class="phone-big">${esc(k.phone)}</div>`);
  return none;
}

function badge(c) {
  if (c.status !== 'forecast') return '';
  return `<span class="badge badge-fc">${t('forecast')}</span>`;
}

function cardHTML(c) {
  const fav = store.favs.includes(c.id);
  const locked = isLocked(c);
  return `<article class="card${locked ? ' is-locked' : ''}" data-action="open" data-id="${c.id}">
    <div class="card-top">
      <h3 class="card-title">${esc(L(c.name))}</h3>${badge(c)}
      <button class="fav${fav ? ' on' : ''}" data-action="fav" data-id="${c.id}" aria-label="favorite">${fav ? I.heartFill : I.heart}</button>
    </div>
    <div class="card-code">${codeBlock(c, store.platform)}${locked ? `<div class="lock-veil"><span>${I.lock}${t('locked')}</span></div>` : ''}</div>
  </article>`;
}

// ───────── Главная ─────────
function daysTo(dateStr) {
  const ms = new Date(dateStr + 'T00:00:00').getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
function forecastBanner() {
  const g = game();
  if (g.status !== 'forecast') return '';
  const d = daysTo(g.release);
  const date = new Date(g.release).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<div class="fc-banner">
    <div class="fc-count">${d > 0 ? `<b>${d}</b><span>${t('days')}</span>` : `<b>🎉</b>`}</div>
    <div class="fc-text"><div class="fc-title">${d > 0 ? `${t('release_in')} · ${date}` : t('released')}</div><div class="fc-sub">${t('forecast_banner')}</div></div>
  </div>`;
}

function renderHome() {
  const g = game();
  $('#home-title').textContent = L(g.header);
  $('#home-banner').innerHTML = forecastBanner();
  $('#segs').innerHTML = CATEGORIES.map((c) => `<button class="seg${c.id === ui.cat ? ' on' : ''}" data-action="cat" data-cat="${c.id}">${L(c)}</button>`).join('') + '<span class="seg-ink"></span>';
  $('#pager').innerHTML = CATEGORIES.map((cat) => {
    const list = cheats().filter((c) => c.category === cat.id);
    return `<section class="page" data-cat="${cat.id}">${list.map(cardHTML).join('') || `<div class="empty">${t('search_empty')}</div>`}</section>`;
  }).join('');
  requestAnimationFrame(() => { scrollToCat(ui.cat, false); moveInk(); });
}

function scrollToCat(cat, smooth = true) {
  const i = CATEGORIES.findIndex((c) => c.id === cat);
  const p = $('#pager');
  p.scrollTo({ left: i * p.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
}
function moveInk() {
  const p = $('#pager'); const segs = [...document.querySelectorAll('#segs .seg')]; const ink = $('#segs .seg-ink');
  if (!p || !segs.length || !ink || !p.clientWidth) return; // вкладка скрыта — не трогаем выбор
  const pos = p.scrollLeft / Math.max(1, p.clientWidth);
  const i0 = Math.floor(pos), f = pos - i0;
  const a = segs[Math.min(i0, segs.length - 1)], b = segs[Math.min(i0 + 1, segs.length - 1)];
  const x = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * f;
  const w = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * f;
  ink.style.transform = `translateX(${x}px)`; ink.style.width = `${w}px`;
  const idx = Math.round(pos);
  segs.forEach((s, i) => s.classList.toggle('on', i === idx));
  if (CATEGORIES[idx]) ui.cat = CATEGORIES[idx].id;
}

// ───────── Поиск ─────────
const SYN = { vehicle: 'транспорт машина авто тачка vehicle car', weapon: 'оружие пушка патроны weapon gun', player: 'игрок герой player', world: 'мир погода world' };
const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е');
function renderSearch() {
  const q = norm(ui.query.trim());
  const box = $('#search-results');
  if (!q) {
    const hints = getLang() === 'ru' ? ['вертолёт', 'бессмертие', 'оружие', 'погода', 'мотоцикл', 'розыск'] : ['helicopter', 'invincibility', 'weapons', 'weather', 'bike', 'wanted'];
    box.innerHTML = `<div class="hints"><div class="hints-t">${t('search_hint')}</div>${hints.map((h) => `<button class="chip" data-action="hint" data-q="${h}">${h}</button>`).join('')}</div>`;
    return;
  }
  const qd = q.replace(/\D/g, '');
  const res = cheats().filter((c) => {
    const hay = norm([c.name.ru, c.name.en, c.desc?.ru, c.desc?.en, c.codes.pc, SYN[c.category]].join(' '));
    return hay.includes(q) || (qd.length >= 3 && (c.codes.phone || '').replace(/\D/g, '').includes(qd));
  });
  box.innerHTML = res.map(cardHTML).join('') || `<div class="empty">${t('search_empty')}</div>`;
}

// ───────── Избранное ─────────
function renderFavs() {
  const list = cheats().filter((c) => store.favs.includes(c.id));
  $('#fav-list').innerHTML = list.map(cardHTML).join('') ||
    `<div class="empty-big">${I.heart}<h3>${t('fav_empty_t')}</h3><p>${t('fav_empty')}</p></div>`;
}

// ───────── Настройки ─────────
function row(action, icon, label, value = '', chevron = true) {
  return `<button class="row" data-action="${action}"><span class="row-ic">${icon}</span><span class="row-l">${label}</span><span class="row-v">${value}</span>${chevron ? `<span class="row-chev">${I.chevron}</span>` : ''}</button>`;
}
function renderSettings() {
  const g = game();
  const th = { dark: t('th_dark'), light: t('th_light'), auto: t('th_auto') };
  $('#settings-body').innerHTML = `
    <button class="pro-card${store.pro ? ' on' : ''}" data-action="${store.pro ? 'noop' : 'paywall'}">
      <span class="pro-ic">${I.crown}</span>
      <span><b>${t('st_pro')}</b><small>${store.pro ? t('st_pro_on') : t('st_get_pro')}</small></span>
      ${store.pro ? `<span class="pro-ok">${I.check}</span>` : `<span class="row-chev">${I.chevron}</span>`}
    </button>
    <div class="group">
      ${row('pick-game', I.gamepad, t('st_game'), esc(g.title))}
      ${row('pick-platform', platformIcon(store.platform), t('st_platform'), L(PLATFORMS[store.platform]))}
    </div>
    <div class="group">
      <div class="row row-static"><span class="row-ic">${I.moon}</span><span class="row-l">${t('st_theme')}</span>
        <span class="mini-seg">${['dark', 'light', 'auto'].map((k) => `<button class="${store.theme === k ? 'on' : ''}" data-action="theme" data-v="${k}">${th[k]}</button>`).join('')}</span></div>
      <div class="row row-static"><span class="row-ic">${I.globe}</span><span class="row-l">${t('st_lang')}</span>
        <span class="mini-seg">${[['ru', 'RU'], ['en', 'EN']].map(([k, n]) => `<button class="${getLang() === k ? 'on' : ''}" data-action="lang" data-v="${k}">${n}</button>`).join('')}</span></div>
      <div class="row row-static"><span class="row-ic">${I.vibe}</span><span class="row-l">${t('st_haptic')}</span>
        <button class="switch${store.haptic ? ' on' : ''}" data-action="haptic-toggle" aria-label="haptics"><i></i></button></div>
    </div>
    <div class="group">
      ${row('howto', I.info, t('st_howto'))}
      ${row('share-app', I.share, t('st_share_app'))}
      ${row('rate', I.star, t('st_rate'))}
      ${row('about', I.info, t('st_about'))}
    </div>
    <div class="group">${row('reset', I.reset, t('st_reset'), '', false)}</div>
    <div class="ver">${esc(APP.name)} · v${esc(APP.version)}</div>`;
}

function updateFavBadge(pulse = false) {
  const n = cheats().filter((c) => store.favs.includes(c.id)).length;
  const b = $('#fav-badge'); if (!b) return;
  b.textContent = n > 99 ? '99+' : n; b.classList.toggle('show', n > 0);
  if (pulse && n > 0) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
}

// ───────── общая перерисовка ─────────
function renderAll() {
  $('#plat-btn').innerHTML = platformIcon(store.platform);
  const tabs = [...document.querySelectorAll('.tab')];
  tabs.forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  const ti = tabs.findIndex((b) => b.dataset.tab === ui.tab);
  $('#tabbar').style.setProperty('--i', Math.max(0, ti));
  $('#tabbar').style.setProperty('--n', tabs.length);
  $('#tabbar').classList.toggle('no-pill', ti < 0);
  document.body.dataset.tab = ui.tab;
  if (ui.tab === 'map') mapMod().then((m) => m.open(mapCtx(), store.game)).catch(() => toast('Map error'));
  updateFavBadge();
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.id === 'view-' + ui.tab));
  const titles = { search: t('tab_search'), fav: t('tab_fav'), settings: t('tab_settings') };
  $('#search-title').textContent = titles.search; $('#fav-title').textContent = titles.fav; $('#settings-title').textContent = titles.settings;
  $('#search-input').placeholder = t('search_ph');
  document.querySelectorAll('.tab-l').forEach((s) => { s.textContent = t('tab_' + s.dataset.k); });
  renderHome(); renderSearch(); renderFavs(); renderSettings();
}

// ───────── шторки ─────────
let sheetOnClose = null;
function openSheet(html, cls = '', onClose = null) {
  const layer = $('#sheet-layer');
  $('#sheet').className = 'sheet ' + cls;
  $('#sheet-body').innerHTML = html;
  $('#sheet-body').scrollTop = 0;
  sheetOnClose = onClose;
  layer.classList.add('open');
}
function closeSheet() {
  ui.stopPlay?.();
  $('#sheet-layer').classList.remove('open');
  $('#sheet').style.transform = '';
  const cb = sheetOnClose; sheetOnClose = null; cb?.();
}

// перетаскивание шторки вниз
(() => {
  const sheet = $('#sheet'); let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', (e) => {
    const body = $('#sheet-body');
    if (body.scrollTop > 0 && !e.target.closest('.grab')) return;
    y0 = e.touches[0].clientY; dy = 0; sheet.style.transition = 'none';
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 == null) return;
    sheet.style.transition = ''; y0 = null;
    if (dy > 110) closeSheet(); else sheet.style.transform = '';
  });
})();

// Экран чита
const CAT_COLORS = { vehicle: ['#0EA5E9', '#1E3A8A'], weapon: ['#F97316', '#7C2D12'], player: ['#22C55E', '#14532D'], world: ['#A855F7', '#3B0764'] };
function mediaHTML(c) {
  if (c.media) return `<video src="${esc(c.media)}" autoplay muted loop playsinline></video>`;
  const [a, b] = CAT_COLORS[c.category] || CAT_COLORS.vehicle;
  return `<div class="poster" style="--c1:${a};--c2:${b}"><span class="poster-emoji">${c.icon || '🎮'}</span><span class="poster-tag">${I.play}${t('video_soon')}</span></div>`;
}
function openCheat(id) {
  const c = byId(id);
  if (!c) return;
  if (isLocked(c)) { openPaywall(); return; }
  const g = game();
  const conf = c.confidence && data[store.game]?.confidenceLabels?.[c.confidence];
  const others = g.platforms.filter((p) => p !== store.platform).map((p) => {
    const note = g.platformNote?.[p] ? ` <small>${L(g.platformNote[p])}</small>` : '';
    return `<div class="plat-row"><div class="plat-h">${platformIcon(p)}<span>${L(PLATFORMS[p])}${note}</span></div>${codeBlock(c, p)}</div>`;
  }).join('');
  const hasCode = !!(c.codes.phone || c.codes.pc || c.codes[store.platform]);
  const fav = store.favs.includes(c.id);
  openSheet(`
    <div class="d-head">
      <h2><span class="d-emoji">${c.icon || '🎮'}</span>${esc(L(c.name))}</h2>
      <button class="icon-btn" data-action="fav" data-id="${c.id}">${fav ? I.heartFill : I.heart}</button>
      <button class="icon-btn" data-action="share" data-id="${c.id}">${I.share}</button>
    </div>
    <div class="media">${mediaHTML(c)}</div>
    ${c.status === 'forecast' ? `<div class="fc-note"><span class="badge badge-fc">${t('forecast')}</span>${conf ? `<span>${t('confidence')}: <b>${getLang() === 'ru' ? conf[0] : conf[1]}</b></span>` : ''}</div>` : ''}
    <p class="d-desc">${esc(L(c.desc))}</p>
    ${c.note ? `<p class="d-note">${esc(L(c.note))}</p>` : ''}
    <div class="d-code" id="d-code"><div class="plat-h">${platformIcon(store.platform)}<span>${L(PLATFORMS[store.platform])}</span></div>${codeBlock(c, store.platform, true)}</div>
    ${hasCode ? `<button class="btn-primary" id="play-btn" data-action="play" data-id="${c.id}">${I.play}<span>${t('play')}</span></button>` : ''}
    ${store.platform === 'pc' && c.codes.pc ? `<button class="btn-ghost" data-action="copy" data-v="${esc(c.codes.pc)}">${I.copy}<span>${t('copy')}</span></button>` : ''}
    ${others ? `<h4 class="d-sub">${t('all_platforms')}</h4><div class="plat-list">${others}</div>` : ''}
    <p class="d-how">${esc(howto(store.platform))}</p>
  `, 'sheet-detail');
}
function howto(p) { return t({ playstation: 'howto_ps', xbox: 'howto_xbox', pc: 'howto_pc', phone: 'howto_phone' }[p]); }

// Озвучка кода с подсветкой кнопок
function speechItems(c) {
  const p = store.platform, k = c.codes, lang = getLang(), sp = SPEAK[lang];
  const combo = (p === 'playstation' || p === 'xbox') && k[p];
  if (combo && combo.length) return combo.map((tk) => sp[(p === 'xbox' && 'ABXY'.includes(tk) && tk.length === 1) ? 'x' + tk : tk] || tk);
  const str = (p === 'pc' && k.pc) ? k.pc : k.phone;
  return [...(str || '')].map((ch) => ch === '-' ? null : ch).map((ch) => ch && (/[A-Z]/.test(ch) ? ch : ch));
}
function pickVoice() {
  const vs = speechSynthesis.getVoices?.() || [];
  const want = getLang() === 'ru' ? 'ru' : 'en';
  return vs.find((v) => v.lang?.toLowerCase().startsWith(want) && /Milena|Yuri|Samantha|Daniel|Google/.test(v.name)) || vs.find((v) => v.lang?.toLowerCase().startsWith(want));
}
function play(id) {
  if (ui.stopPlay) { ui.stopPlay(); return; }
  const c = byId(id); const items = speechItems(c);
  const els = [...document.querySelectorAll('#d-code [data-i]')];
  const btn = $('#play-btn');
  const setBtn = (on) => { btn.innerHTML = on ? `${I.stop}<span>${t('stop')}</span>` : `${I.play}<span>${t('play')}</span>`; btn.classList.toggle('playing', on); };
  let i = -1, stopped = false, timer;
  const synth = window.speechSynthesis;
  const voice = synth && pickVoice();
  const mark = (n) => els.forEach((e) => { const ix = +e.dataset.i; e.classList.toggle('hit', ix === n); e.classList.toggle('done', ix < n); });
  const finish = () => { stopped = true; clearTimeout(timer); synth?.cancel(); els.forEach((e) => e.classList.remove('hit', 'done')); setBtn(false); ui.stopPlay = null; };
  // индексы элементов, у которых есть что произносить
  const seq = items.map((txt, ix) => ({ txt, ix })).filter((x) => x.txt);
  let n = 0;
  function next() {
    if (stopped) return;
    if (n >= seq.length) { timer = setTimeout(finish, 500); return; }
    const { txt, ix } = seq[n++]; mark(ix); haptic();
    let moved = false; const go = () => { if (moved) return; moved = true; clearTimeout(timer); timer = setTimeout(next, 90); };
    if (synth) {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = getLang() === 'ru' ? 'ru-RU' : 'en-US'; if (voice) u.voice = voice; u.rate = 1.05;
      u.onend = go; u.onerror = go; synth.speak(u);
      timer = setTimeout(go, 2600);
    } else timer = setTimeout(go, 650);
  }
  synth?.cancel();
  setBtn(true); ui.stopPlay = finish; next();
}

// Выбор игры / платформы
function gameListHTML(selected, action) {
  return GAMES.map((g) => {
    const soon = g.status === 'soon';
    const tag = soon ? `<span class="tag">${t('soon')}</span>` : g.status === 'forecast' ? `<span class="tag tag-fc">${t('forecast')}</span>` : '';
    return `<button class="opt${g.id === selected ? ' on' : ''}${soon ? ' dis' : ''}" data-action="${soon ? 'noop' : action}" data-v="${g.id}">${esc(g.title)}${tag}</button>`;
  }).join('');
}
function platListHTML(gameId, selected, action) {
  const g = GAMES.find((x) => x.id === gameId);
  return g.platforms.map((p) => {
    const note = g.platformNote?.[p] ? `<small>${L(g.platformNote[p])}</small>` : '';
    return `<button class="opt opt-ic${p === selected ? ' on' : ''}" data-action="${action}" data-v="${p}">${platformIcon(p)}<span>${L(PLATFORMS[p])}</span>${note}</button>`;
  }).join('');
}
function openPickGame() { openSheet(`<h2 class="pick-t">${t('select_game')}</h2><div class="opts">${gameListHTML(store.game, 'set-game')}</div>`, 'sheet-pick'); }
function openPickPlatform() { openSheet(`<h2 class="pick-t">${t('select_platform')}</h2><div class="opts">${platListHTML(store.game, store.platform, 'set-platform')}</div>`, 'sheet-pick'); }

function openHowto() {
  const g = game();
  openSheet(`<h2 class="pick-t">${t('st_howto')}</h2>${g.platforms.map((p) => `<div class="howto"><div class="plat-h">${platformIcon(p)}<span>${L(PLATFORMS[p])}</span></div><p>${esc(howto(p))}</p></div>`).join('')}<p class="d-note">${t('howto_warn')}</p>`, 'sheet-pick');
}
function openAbout() {
  openSheet(`<h2 class="pick-t">${t('st_about')}</h2><p class="about">${t('about_text')}</p><p class="d-note">${esc(data[store.game]?.source || '')}</p><div class="ver">v${esc(APP.version)} · ${window.__vp ? `vp in ${__vp.inner} vh ${__vp.vh} dvh ${__vp.dvh} scr ${__vp.screen} sb ${__vp.safeB}${__vp.standalone ? ' sa' : ''}${__vp.guard ? ' guard' : ''}${__vp.overflow ? ' OVERFLOW' : ''}` : ''}</div>`, 'sheet-pick');
}

// ───────── пейвол ─────────
let plan = 'week';
function openPaywall() {
  const pw = $('#paywall');
  const plans = PAYWALL.plans.map((p) => `<button class="plan${p.id === plan ? ' on' : ''}" data-action="plan" data-v="${p.id}">
      <span class="plan-radio"></span><span class="plan-n">${L(p)}${p.badge ? `<em>${L(p.badge)}</em>` : ''}${p.trial ? `<small>${t('pw_trial')} ${p.price}${L(p.per)}</small>` : ''}</span>
      <span class="plan-p">${p.price}<small>${L(p.per)}</small></span></button>`).join('');
  const sel = PAYWALL.plans.find((p) => p.id === plan);
  pw.innerHTML = `
    <button class="pw-close" data-action="pw-close" aria-label="close">${I.close}</button>
    <div class="pw-hero"><div class="pw-orb">${I.crown}</div>
      <div class="pw-chips">${comboHTML(['O', 'X', 'L1', 'T', '→', 'R2', 'S', '↑'], 'playstation')}</div></div>
    <h1 class="pw-title">${t('pw_title')}</h1>
    <ul class="pw-feat">${['pw_f1', 'pw_f2', 'pw_f3', 'pw_f4'].map((k) => `<li>${I.check}<span>${t(k)}</span></li>`).join('')}</ul>
    <div class="plans">${plans}</div>
    <button class="btn-primary pw-cta" data-action="buy">${sel.trial ? t('pw_cta') : t('pw_cta2')}</button>
    <div class="pw-links"><button data-action="buy">${t('pw_restore')}</button><span>·</span><button data-action="noop">${t('pw_terms')}</button><span>·</span><button data-action="noop">${t('pw_privacy')}</button></div>
    <div class="pw-demo">${t('pw_demo')}</div>`;
  pw.classList.add('open');
  pw.querySelector('.pw-close').classList.remove('show');
  setTimeout(() => pw.querySelector('.pw-close')?.classList.add('show'), 900);
}
function closePaywall() { $('#paywall').classList.remove('open'); maybeInstallHint(); }

// ───────── онбординг ─────────
// Один тап по варианту = выбор и сразу дальше (без второго нажатия «Продолжить»).
// «Продолжить» всегда активна (вариант выбран заранее), на втором шаге есть «Назад».
let obBusy = false; // защита от двойного тапа во время перехода
function obDefaultPlatform(gameId) {
  const g = GAMES.find((x) => x.id === gameId);
  return g.platforms.includes(store.platform) ? store.platform : g.platforms[0];
}
function renderOnboarding(dir = 0) {
  const ob = $('#onboarding');
  const step = ui.obStep;
  const g = ui.obGame || store.game;
  ob.innerHTML = `
    <div class="ob-bar">
      ${step === 'platform' ? `<button class="ob-back" data-action="ob-back">${I.back}<span>${t('back')}</span></button>` : '<span></span>'}
      <span class="ob-step">${step === 'game' ? 1 : 2} / 2</span>
    </div>
    <div class="ob-progress"><i style="width:${step === 'game' ? 50 : 100}%"></i></div>
    <div class="ob-brand"><img src="icons/icon-192.png" alt=""><span>${esc(APP.shortName)}</span></div>
    <div class="ob-body${dir > 0 ? ' ob-in-right' : dir < 0 ? ' ob-in-left' : ''}">
      <div class="ob-top"><div class="ob-ic">${step === 'game' ? I.gamepad : platformIcon(ui.obPlatform || 'playstation')}</div>
        <h1>${step === 'game' ? t('ob_game_title') : t('ob_platform_title')}</h1><p>${t('ob_sub')}</p></div>
      <div class="opts">${step === 'game' ? gameListHTML(g, 'ob-game') : platListHTML(g, ui.obPlatform, 'ob-platform')}</div>
    </div>
    <button class="btn-primary ob-cta" data-action="ob-next">${t('continue')}</button>`;
}
function showOnboarding() {
  ui.obStep = 'game'; ui.obGame = store.game; ui.obPlatform = obDefaultPlatform(store.game); obBusy = false;
  document.body.classList.add('in-ob');
  renderOnboarding();
}
function obGo(step) {
  ui.obStep = step;
  if (step === 'platform' && !GAMES.find((x) => x.id === ui.obGame).platforms.includes(ui.obPlatform)) ui.obPlatform = obDefaultPlatform(ui.obGame);
  renderOnboarding(step === 'platform' ? 1 : -1);
}
// подсветить выбор, дать увидеть его ~0,25 с, затем дальше
function obPickThen(el, fn) {
  if (obBusy) return;
  obBusy = true;
  document.querySelectorAll('#onboarding .opt').forEach((o) => o.classList.toggle('on', o === el));
  el.classList.add('picked');
  setTimeout(() => { obBusy = false; fn(); }, 260);
}
async function finishOnboarding() {
  store.game = ui.obGame; store.platform = ui.obPlatform; store.onboarded = true; save();
  try { await loadGame(store.game); } catch { /* нет сети при первом запуске — данные подгрузятся позже, не держим на онбординге */ }
  document.body.classList.remove('in-ob');
  ui.tab = 'home'; ui.cat = DEFAULT_CATEGORY;
  renderAll();
  if (!store.pro) openPaywall(); else maybeInstallHint();
}

// ───────── установка на экран ─────────
let deferredPrompt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function maybeInstallHint() {
  if (standalone() || store.installHint) return;
  store.installHint = true; save();
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const el = $('#install');
  el.innerHTML = `<div class="ins-ic">${I.share}</div><div class="ins-t"><b>${t('install_t')}</b><small>${ios || !deferredPrompt ? t('install_ios') : ''}</small></div>
    ${deferredPrompt ? `<button class="ins-btn" data-action="install">${t('install_btn')}</button>` : ''}<button class="ins-x" data-action="install-x">${I.close}</button>`;
  el.classList.add('show');
}

// ───────── поделиться ─────────
async function shareText(text) {
  try {
    if (navigator.share) { await navigator.share({ title: APP.name, text, url: location.href.split('#')[0] }); return; }
  } catch { return; }
  try { await navigator.clipboard.writeText(text + '\n' + location.href.split('#')[0]); toast(t('copied')); } catch { }
}
function cheatShareText(c) {
  const k = c.codes, lines = [`${t('share_text')} ${game().title}: ${L(c.name)}`];
  if (k.playstation) lines.push('PlayStation: ' + k.playstation.join(' '));
  if (k.xbox) lines.push('Xbox: ' + k.xbox.join(' '));
  if (k.pc) lines.push('PC: ' + k.pc);
  if (k.phone) lines.push(t('phone_code') + ': ' + k.phone);
  lines.push(t('open_app'));
  return lines.join('\n');
}

// ───────── события ─────────
function refreshCards() { renderHome(); renderSearch(); renderFavs(); }

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action, v = el.dataset.v, id = el.dataset.id;
  switch (a) {
    case 'tab': {
      const tab = el.dataset.tab; haptic();
      el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce');
      if (tab === ui.tab) { // повторное нажатие — наверх, как в iOS
        if (tab === 'map') { mapMod().then((m) => m.refit()); break; }
        const box = tab === 'home' ? document.querySelector(`.page[data-cat="${ui.cat}"]`) : document.querySelector(`#view-${tab} .scroll`);
        box?.scrollTo({ top: 0, behavior: 'smooth' });
        if (tab === 'search') $('#search-input').focus();
        break;
      }
      ui.tab = tab; renderAll();
      if (tab === 'search') $('#search-input').focus();
      break;
    }
    case 'cat': ui.cat = el.dataset.cat; haptic(); scrollToCat(ui.cat); break;
    case 'open': openCheat(id); haptic(); break;
    case 'fav': {
      e.stopPropagation(); haptic();
      const i = store.favs.indexOf(id); if (i >= 0) store.favs.splice(i, 1); else store.favs.push(id);
      save(); refreshCards(); updateFavBadge(true);
      if (el.classList.contains('icon-btn')) el.innerHTML = store.favs.includes(id) ? I.heartFill : I.heart;
      el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300);
      break;
    }
    case 'share': shareText(cheatShareText(byId(id))); break;
    case 'share-app': shareText(APP.name); break;
    case 'copy': try { await navigator.clipboard.writeText(v); toast(t('copied')); } catch { } break;
    case 'play': play(id); break;
    case 'plat': case 'pick-platform': haptic(); openPickPlatform(); break;
    case 'pick-game': haptic(); openPickGame(); break;
    case 'set-game': {
      haptic(); store.game = v;
      const g = game(); if (!g.platforms.includes(store.platform)) store.platform = g.platforms[0];
      save(); await loadGame(v); closeSheet(); renderAll(); break;
    }
    case 'set-platform': haptic(); store.platform = v; save(); closeSheet(); renderAll(); break;
    case 'sheet-close': closeSheet(); break;
    case 'map-layer': haptic(); (await mapMod()).toggle(v); break;
    case 'map-game': haptic(); (await mapMod()).setGame(v); break;
    case 'map-locate': haptic(); (await mapMod()).locate(); break;
    case 'map-fit': haptic(); (await mapMod()).refit(); break;
    case 'hint': ui.query = el.dataset.q; $('#search-input').value = ui.query; renderSearch(); break;
    case 'search-clear': ui.query = ''; $('#search-input').value = ''; renderSearch(); $('#search-input').focus(); break;
    case 'theme': store.theme = v; save(); applyTheme(); renderSettings(); mapMod().then((m) => m.retheme()); break;
    case 'lang': store.lang = v; save(); setLang(v); renderAll(); mapMod().then((m) => m.relang()); break;
    case 'haptic-toggle': store.haptic = !store.haptic; save(); haptic(); renderSettings(); break;
    case 'howto': openHowto(); break;
    case 'about': openAbout(); break;
    case 'rate': toast(t('rated')); break;
    case 'reset': {
      ui.stopPlay?.(); Object.assign(store, { ...DEFAULTS, lang: store.lang, theme: store.theme }); save();
      closeSheet(); showOnboarding(); break;
    }
    case 'paywall': openPaywall(); break;
    case 'plan': plan = v; haptic(); openPaywall(); $('#paywall .pw-close').classList.add('show'); break;
    case 'buy': store.pro = true; save(); haptic(); closePaywall(); toast(t('pro_unlocked')); refreshCards(); renderSettings(); break;
    case 'pw-close': closePaywall(); break;
    case 'ob-game': haptic(); obPickThen(el, () => { ui.obGame = v; obGo('platform'); }); break;
    case 'ob-platform': haptic(); obPickThen(el, () => { ui.obPlatform = v; finishOnboarding(); }); break;
    case 'ob-back': haptic(); if (!obBusy) obGo('game'); break;
    case 'ob-next':
      haptic();
      if (obBusy) break;
      if (ui.obStep === 'game') obGo('platform');
      else finishOnboarding();
      break;
    case 'install': deferredPrompt?.prompt(); deferredPrompt = null; $('#install').classList.remove('show'); break;
    case 'install-x': $('#install').classList.remove('show'); break;
  }
});
$('#sheet-layer').addEventListener('click', (e) => { if (e.target.id === 'sheet-layer') closeSheet(); });
$('#search-input').addEventListener('input', (e) => { ui.query = e.target.value; renderSearch(); });
$('#pager').addEventListener('scroll', () => requestAnimationFrame(moveInk), { passive: true });
addEventListener('resize', () => scrollToCat(ui.cat, false));

// ───────── старт ─────────
(async function init() {
  setLang(store.lang || (navigator.language || 'ru').slice(0, 2));
  applyTheme();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // новая версия на сервере → перезагрузка в свежую (только если уже была старая)
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
    navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => { });
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();
  await loadGame(store.game).catch(() => { });
  renderAll();
  if (!store.onboarded) showOnboarding();
  document.body.classList.add('ready');
  requestAnimationFrame(guardTabbar);
})();
