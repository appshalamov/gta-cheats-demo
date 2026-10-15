// Чит-коды GTA — демо PWA.
// Архитектура как у Cheats Pro: онбординг (игра → платформа) → пейвол →
// 4 вкладки (Главная / Поиск / Избранное / Настройки) → шторка чита.

import { APP, CATEGORIES, DEFAULT_CATEGORY, PLATFORMS, GAMES, PAYWALL } from './config.js';
import { t, L, setLang, getLang, SPEAK } from './i18n.js';
import { I, platformIcon, comboHTML } from './icons.js';
import { loadPlaces, MAP_GAMES, placeKey, parseKey, findByKey, featured, searchPlaces, titleOf, realOf, cityOf, thumbOf, catLabel, catIcon, CAT_LABELS, CONF } from './places.js';

// ───────── хранилище ─────────
const KEY = 'cheats.v1';
const DEFAULTS = { onboarded: false, game: 'gta5', platform: 'playstation', favs: [], favPlaces: [], recent: [], pro: false, theme: 'dark', lang: null, haptic: true, installHint: false, mapsApp: 'google' };
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
const mapCtx = () => ({ mapsApp: () => store.mapsApp || 'google', openSheet, closeSheet, setSnap, sheetSnap: () => snap, sheetPx: snapPx, restSheet, haptic, toast, I, isFav: (k) => isFavPlace(k), toggleFav: (k) => toggleFavPlace(k) });
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
  // = фон из tokens.css (--bg) = цвет нижней панели; при ручной теме обе метки (тёмная и светлая) получают её цвет
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg));
}
// скин по выбранной игре: акцент и картинки из tokens.css [data-skin]
const SKINS = { gta6: 'gta6', gta5: 'gta5', gta4: 'gta4', gtasa: 'sa' };
function applySkin() {
  const sk = SKINS[store.game];
  if (sk) document.documentElement.dataset.skin = sk; else delete document.documentElement.dataset.skin;
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

// ───────── Главная (центр приложения) ─────────
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
    <div class="fc-count">${d > 0 ? `<b>${d}</b><span>${t('days')}</span>` : `<b>${I.sparkle}</b>`}</div>
    <div class="fc-text"><div class="fc-title">${d > 0 ? `${t('release_in')} · ${date}` : t('released')}</div><div class="fc-sub">${t('forecast_banner')}</div></div>
  </div>`;
}
const POPULAR = {
  gta5: ['invincible', 'weapons', 'health', 'wanted_down', 'buzzard', 'superjump', 'sanchez', 'weather'],
  gta6: ['g6_invincible', 'g6_weapons', 'g6_health', 'g6_wanted_down', 'g6_v_heli', 'g6_superjump', 'g6_v_super', 'g6_weather'],
};
const liveGames = () => GAMES.filter((g) => g.status !== 'soon');
const mapPlaceName = (gid) => ({ gta6: t('place_gta6'), gta5: t('place_gta5') }[gid] || '');

function miniCheat(c) {
  const k = c.codes || {}, p = store.platform, locked = isLocked(c);
  let code = '';
  if ((p === 'playstation' || p === 'xbox') && k[p]?.length) code = comboHTML(k[p].slice(0, 5), p) + (k[p].length > 5 ? `<i class="more">+${k[p].length - 5}</i>` : '');
  else if (p === 'pc' && k.pc) code = `<span class="mc-pc">${esc(k.pc)}</span>`;
  else if (k.phone) code = `<span class="mc-pc">${esc(k.phone)}</span>`;
  return `<button class="mini-cheat${locked ? ' is-locked' : ''}" data-action="open" data-id="${c.id}">
    <span class="mc-top"><span class="mc-ic">${cheatIc(c)}</span>${locked ? `<span class="mc-lock">${I.lock}</span>` : ''}</span>
    <b>${esc(L(c.name))}</b><span class="mc-code">${code}</span></button>`;
}
function placeCard(o, opt = {}) {
  const key = placeKey(o), fav = store.favPlaces.includes(key), img = thumbOf(o, o.kind === 'egg' ? 'game' : 'real');
  return `<div class="pcard${opt.grid ? ' pcard-grid' : ''}" data-action="open-place" data-key="${esc(key)}" role="button" tabindex="0">
    ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pc-ph">${o.kind === 'egg' ? I.egg : I[catIcon(o.c)]}</span>`}
    <span class="pc-grad"></span>
    <span class="pc-tags">${o.kind === 'egg' ? `<i class="tag-egg">${t('map_egg')}</i>` : `<i class="conf conf-${o.cf}">${t('conf_' + o.cf)}</i>`}${opt.game ? `<i class="tag-game">${GAMES.find((g) => g.id === o.game)?.title || ''}</i>` : ''}</span>
    <button class="pc-fav${fav ? ' on' : ''}" data-action="fav-place" data-key="${esc(key)}" aria-label="favorite">${fav ? I.heartFill : I.heart}</button>
    <span class="pc-txt"><b>${esc(titleOf(o))}</b><small>${o.kind === 'egg' ? esc(realOf(o)) : `${I.pin}${esc(realOf(o))}`}</small></span>
  </div>`;
}
function placeRow(o) {
  const key = placeKey(o), fav = store.favPlaces.includes(key), img = thumbOf(o, o.kind === 'egg' ? 'game' : 'real');
  const city = cityOf(o);
  return `<div class="prow" data-action="open-place" data-key="${esc(key)}" role="button" tabindex="0">
    ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pr-ph">${o.kind === 'egg' ? I.egg : I[catIcon(o.c)]}</span>`}
    <span class="pr-t"><b>${esc(titleOf(o))}</b><small>→ ${esc(realOf(o))}</small>
      <span class="pr-meta"><i class="dot conf-${o.cf}"></i>${t('conf_' + o.cf)}${o.kind === 'place' && o.c ? ` · ${esc(catLabel(o.c))}` : ''}${city ? ` · ${esc(city)}` : ''}</span></span>
    <button class="fav${fav ? ' on' : ''}" data-action="fav-place" data-key="${esc(key)}" aria-label="favorite">${fav ? I.heartFill : I.heart}</button>
  </div>`;
}
function hubSection(title, sub, action, body, extra = '') {
  return `<section class="hub-sec"><div class="hub-h"><div><h2>${title}</h2>${sub ? `<small>${sub}</small>` : ''}</div>${action || ''}</div>${body}${extra}</section>`;
}

let hubSeq = 0;
async function renderHub() {
  const my = ++hubSeq;
  const g = game(), box = $('#home-body');
  const pd = MAP_GAMES.includes(store.game) ? await loadPlaces(store.game) : null;
  const favCount = store.favs.length + store.favPlaces.length;
  if (my !== hubSeq) return;
  const list = cheats();
  const popular = (POPULAR[store.game] || []).map((id) => list.find((c) => c.id === id)).filter(Boolean);
  const places = pd ? featured(pd, 'place', 14) : [];
  const eggs = pd ? featured(pd, 'egg', 12) : [];
  const favPreview = await favItems();
  if (my !== hubSeq) return;
  box.innerHTML = `
    <div class="hub-games">${liveGames().map((x) => `<button class="${x.id === store.game ? 'on' : ''}" data-action="hub-game" data-v="${x.id}">
      <b>${esc(x.title)}</b><small>${x.status === 'forecast' ? t('hub_forecast') : t('hub_live')}</small></button>`).join('')}</div>
    ${forecastBanner()}
    ${hubSection(t('hub_cheats'), L(PLATFORMS[store.platform]), `<button class="hub-more" data-action="open-cheats" data-cat="">${t('see_all')}${I.chevron}</button>`,
      `<div class="cat-grid">${CATEGORIES.map((c) => `<button class="cat-tile cat-${c.id}" data-action="open-cheats" data-cat="${c.id}">
        <span class="ct-ic">${I[c.icon]}</span><b>${L(c)}</b><small>${list.filter((x) => x.category === c.id).length} ${t('codes_n')}</small></button>`).join('')}</div>`)}
    ${popular.length ? hubSection(t('hub_popular'), '', '', `<div class="hscroll">${popular.map(miniCheat).join('')}</div>`) : ''}
    ${places.length ? hubSection(t('hub_places'), mapPlaceName(store.game), `<button class="hub-more" data-action="tab" data-tab="map">${t('open_map')}${I.chevron}</button>`,
      `<div class="hscroll">${places.map((o) => placeCard(o)).join('')}</div>`) : ''}
    ${eggs.length ? hubSection(t('hub_eggs'), t('hub_eggs_sub'), `<button class="hub-more" data-action="search-browse" data-type="eggs">${t('see_all')}${I.chevron}</button>`,
      `<div class="hscroll">${eggs.map((o) => placeCard(o)).join('')}</div>`) : ''}
    ${favCount ? hubSection(t('hub_favs'), '', `<button class="hub-more" data-action="tab" data-tab="fav">${t('see_all')}${I.chevron}</button>`,
      `<div class="hscroll">${favPreview.slice(0, 10).map((x) => (x.kind ? placeCard(x, { game: x.game !== store.game }) : miniCheat(x))).join('')}</div>`) : ''}
    <div class="hub-foot">${t('hub_foot')}</div>`;
}

// Все читы (экран внутри Главной)
function renderCheats() {
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
function renderHome() { renderHub(); renderCheats(); }

function scrollToCat(cat, smooth = true) {
  const i = CATEGORIES.findIndex((c) => c.id === cat);
  const p = $('#pager');
  p.scrollTo({ left: i * p.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
}
function moveInk() {
  const p = $('#pager'); const segs = [...document.querySelectorAll('#segs .seg')]; const ink = $('#segs .seg-ink');
  if (!p || !segs.length || !ink || !p.clientWidth) return; // экран скрыт — не трогаем выбор
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

// Карта открывается одним общим обещанием: два одновременных open() создавали карту дважды.
let mapOpening = null;
function openMap(preferGame = store.game) {
  if (!mapOpening) mapOpening = mapMod().then((m) => m.open(mapCtx(), preferGame).then(() => m)).catch((e) => { mapOpening = null; toast('Map error'); throw e; });
  else mapOpening.then((m) => m.open(mapCtx(), preferGame)).catch(() => { });
  return mapOpening;
}
// открыть место на карте
async function openOnMap(key) {
  const { kind, game: g, id } = parseKey(key);
  closeSheet();
  if (!mapOpening) openMap(g);
  ui.tab = 'map'; renderAll();
  try {
    const m = await mapOpening;
    if (m.focus) await m.focus(g, kind, id);
    else { await m.setGame(g); toast(t('map_find_hint')); }
  } catch { }
}

// ───────── Поиск: читы, места, пасхалки ─────────
const SYN = { vehicle: 'транспорт машина авто тачка vehicle car', weapon: 'оружие пушка патроны weapon gun', player: 'игрок герой player', world: 'мир погода world' };
const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е');
const sf = ui.sf = { type: 'all', game: null, cat: '', conf: '' };
function searchCheats(list, q, cat) {
  const qq = norm(q.trim()), qd = qq.replace(/\D/g, '');
  return list.filter((c) => {
    if (cat && c.category !== cat) return false;
    if (!qq) return true;
    const hay = norm([c.name.ru, c.name.en, c.desc?.ru, c.desc?.en, c.codes.pc, SYN[c.category]].join(' '));
    return qq.split(/\s+/).every((w) => hay.includes(w)) || (qd.length >= 3 && (c.codes.phone || '').replace(/\D/g, '').includes(qd));
  });
}
function chip(action, v, label, on, extra = '') {
  return `<button class="fchip${on ? ' on' : ''}" data-action="${action}" data-v="${esc(v)}" ${extra}>${label}</button>`;
}
function renderSearchFilters(counts = {}) {
  const sg = sf.game || store.game;
  const types = [['all', t('f_all')], ['cheats', t('f_cheats')], ['places', t('f_places')], ['eggs', t('f_eggs')]];
  let row2 = liveGames().map((g) => chip('sf-game', g.id, esc(g.title), g.id === sg)).join('');
  let row3 = '';
  if (sf.type === 'cheats') row3 = chip('sf-cat', '', t('any'), !sf.cat) + CATEGORIES.map((c) => chip('sf-cat', c.id, `${I[c.icon]}${L(c)}`, sf.cat === c.id)).join('');
  if (sf.type === 'places') {
    const cats = Object.keys(CAT_LABELS).filter((c) => (loadedPlacesSync(sg)?.places || []).some((p) => p.c === c));
    row3 = chip('sf-cat', '', t('any'), !sf.cat) + cats.map((c) => chip('sf-cat', c, `${I[catIcon(c)]}${esc(catLabel(c))}`, sf.cat === c)).join('');
  }
  if (sf.type === 'places' || sf.type === 'eggs') {
    row2 += '<span class="fsep"></span>' + chip('sf-conf', '', t('any_conf'), !sf.conf) + CONF.map((k) => chip('sf-conf', k, `<i class="dot conf-${k}"></i>${t('conf_' + k)}`, sf.conf === k)).join('');
  }
  $('#search-filters').innerHTML = `
    <div class="frow">${types.map(([k, l]) => chip('sf-type', k, `${l}${counts[k] != null ? ` <em>${counts[k]}</em>` : ''}`, sf.type === k)).join('')}</div>
    <div class="frow">${row2}</div>${row3 ? `<div class="frow">${row3}</div>` : ''}`;
}
const placesSync = {};
const loadedPlacesSync = (g) => placesSync[g];
let searchSeq = 0;
async function renderSearch() {
  const my = ++searchSeq;
  const sg = sf.game || store.game;
  const q = ui.query.trim();
  const box = $('#search-results');
  const [pd] = await Promise.all([loadPlaces(sg), loadGame(sg).catch(() => null)]);
  placesSync[sg] = pd;
  if (my !== searchSeq) return;
  const browsing = !q && sf.type === 'all' && !sf.cat && !sf.conf;
  const cheatList = data[sg]?.cheats || [];
  const R = {
    cheats: searchCheats(cheatList, q, sf.type === 'cheats' ? sf.cat : ''),
    places: searchPlaces(pd, q, { kind: 'place', cat: sf.type === 'places' ? sf.cat : '', conf: sf.conf }),
    eggs: searchPlaces(pd, q, { kind: 'egg', conf: sf.conf }),
  };
  renderSearchFilters(browsing ? {} : { all: R.cheats.length + R.places.length + R.eggs.length, cheats: R.cheats.length, places: R.places.length, eggs: R.eggs.length });
  if (browsing) {
    const hints = getLang() === 'ru' ? ['вертолёт', 'бессмертие', 'Ocean Drive', 'мост', 'отель', 'розыск'] : ['helicopter', 'invincibility', 'Ocean Drive', 'bridge', 'hotel', 'wanted'];
    box.innerHTML = `
      ${store.recent.length ? `<div class="s-sec"><div class="s-h">${t('recent')}<button data-action="recent-clear">${t('clear')}</button></div>${store.recent.map((h) => `<button class="chip" data-action="hint" data-q="${esc(h)}">${esc(h)}</button>`).join('')}</div>` : ''}
      <div class="s-sec"><div class="s-h">${t('search_hint')}</div>${hints.map((h) => `<button class="chip" data-action="hint" data-q="${esc(h)}">${esc(h)}</button>`).join('')}</div>
      <div class="s-sec"><div class="s-h">${t('browse')}</div>
        <div class="browse">
          <button data-action="search-browse" data-type="places"><span>${I.map}</span><b>${t('browse_places')}</b><small>${pd.places.length}</small></button>
          <button data-action="search-browse" data-type="eggs"><span>${I.egg}</span><b>${t('browse_eggs')}</b><small>${pd.eggs.length}</small></button>
          <button data-action="search-browse" data-type="cheats"><span>${I.gamepad}</span><b>${t('browse_cheats')}</b><small>${cheatList.length}</small></button>
        </div></div>`;
    return;
  }
  const sec = (k, title, items, render, limit) => {
    if (!items.length) return '';
    const shown = limit ? items.slice(0, limit) : items.slice(0, 120);
    return `<div class="s-sec"><div class="s-h">${title} <em>${items.length}</em>${limit && items.length > limit ? `<button data-action="sf-type" data-v="${k}">${t('show_all')}</button>` : ''}</div>${shown.map(render).join('')}</div>`;
  };
  const lim = sf.type === 'all' ? 4 : 0;
  const html = (sf.type === 'all' || sf.type === 'cheats' ? sec('cheats', t('f_cheats'), R.cheats, cardHTML, lim) : '')
    + (sf.type === 'all' || sf.type === 'places' ? sec('places', t('f_places'), R.places, placeRow, lim) : '')
    + (sf.type === 'all' || sf.type === 'eggs' ? sec('eggs', t('f_eggs'), R.eggs, placeRow, lim) : '');
  box.innerHTML = html || `<div class="empty-big">${I.search}<h3>${t('search_empty')}</h3><p>${t('search_empty_hint')}</p>${(sf.cat || sf.conf) ? `<button class="btn-ghost" data-action="sf-reset">${t('clear_filters')}</button>` : ''}</div>`;
}
function rememberQuery() {
  const q = ui.query.trim();
  if (q.length < 2) return;
  store.recent = [q, ...store.recent.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6); save();
}

// ───────── Избранное: читы и места ─────────
async function favItems() {
  const games = [...new Set([...store.favPlaces.map((k) => parseKey(k).game), ...liveGames().map((g) => g.id)])];
  await Promise.all(games.map((g) => Promise.all([loadGame(g).catch(() => null), MAP_GAMES.includes(g) ? loadPlaces(g) : null])));
  const places = (await Promise.all(store.favPlaces.map(findByKey))).filter(Boolean);
  const cheatsF = store.favs.map((id) => byId(id)).filter(Boolean);
  return [...places, ...cheatsF];
}
let favSeq = 0;
async function renderFavs() {
  const my = ++favSeq;
  const all = await favItems();
  if (my !== favSeq) return;
  const places = all.filter((x) => x.kind), cheatsF = all.filter((x) => !x.kind);
  const f = ui.favFilter || 'all';
  $('#fav-filters').innerHTML = all.length ? `<div class="frow">${[['all', t('f_all'), all.length], ['cheats', t('f_cheats'), cheatsF.length], ['places', t('f_places'), places.length]]
    .map(([k, l, n]) => chip('fav-filter', k, `${l} <em>${n}</em>`, f === k)).join('')}</div>` : '';
  if (!all.length) {
    $('#fav-list').innerHTML = `<div class="empty-big">${I.heart}<h3>${t('fav_empty_t')}</h3><p>${t('fav_empty')}</p>
      <div class="empty-acts"><button class="btn-ghost" data-action="open-cheats" data-cat="">${I.gamepad}${t('browse_cheats')}</button><button class="btn-ghost" data-action="tab" data-tab="map">${I.map}${t('open_map')}</button></div></div>`;
    return;
  }
  const showP = f !== 'cheats' && places.length, showC = f !== 'places' && cheatsF.length;
  $('#fav-list').innerHTML = (showP ? `<div class="s-sec"><div class="s-h">${t('f_places')} <em>${places.length}</em></div><div class="pgrid">${places.map((o) => placeCard(o, { grid: true, game: true })).join('')}</div></div>` : '')
    + (showC ? `<div class="s-sec"><div class="s-h">${t('f_cheats')} <em>${cheatsF.length}</em></div>${cheatsF.map(cardHTML).join('')}</div>` : '')
    || `<div class="empty">${t('search_empty')}</div>`;
}
function isFavPlace(key) { return store.favPlaces.includes(key); }
function toggleFavPlace(key) {
  const i = store.favPlaces.indexOf(key);
  if (i >= 0) store.favPlaces.splice(i, 1); else store.favPlaces.push(key);
  save(); haptic(); refreshFavUI();
  return i < 0;
}

// ───────── Настройки ─────────
function row(action, icon, label, value = '', chevron = true) {
  return `<button class="row" data-action="${action}"><span class="row-ic">${icon}</span><span class="row-l">${label}</span><span class="row-v">${value}</span>${chevron ? `<span class="row-chev">${I.chevron}</span>` : ''}</button>`;
}
// карты для маршрута (Игорь 15.10.2026: «Google по умолчанию, в настройках — Apple, потом любые другие»).
// Новая карта — строка здесь и ветка в mapsLink (map.js); наружу — только карты (правило «не уводить из приложения»).
const MAPS_APPS = [['google', 'Google'], ['apple', 'Apple']];
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
      <div class="row row-static"><span class="row-ic">${I.globe}</span><span class="row-l">${t('st_maps')}</span>
        <span class="mini-seg">${MAPS_APPS.map(([k, n]) => `<button class="${(store.mapsApp || 'google') === k ? 'on' : ''}" data-action="maps-app" data-v="${k}">${n}</button>`).join('')}</span></div>
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
  const n = store.favs.length + store.favPlaces.length;
  const b = $('#fav-badge'); if (!b) return;
  b.textContent = n > 99 ? '99+' : n; b.classList.toggle('show', n > 0);
  if (pulse && n > 0) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
}

// ───────── общая перерисовка ─────────
function renderAll() {
  applySkin();
  $('#plat-btn').innerHTML = platformIcon(store.platform);
  $('#plat-btn2').innerHTML = platformIcon(store.platform);
  const tabs = [...document.querySelectorAll('.tab')];
  const tabOf = ui.tab === 'cheats' ? 'home' : ui.tab; // «Все читы» — экран внутри Главной
  tabs.forEach((b) => b.classList.toggle('on', b.dataset.tab === tabOf));
  const ti = tabs.findIndex((b) => b.dataset.tab === tabOf);
  $('#tabbar').style.setProperty('--i', Math.max(0, ti));
  $('#tabbar').style.setProperty('--n', tabs.length);
  $('#tabbar').classList.toggle('no-pill', ti < 0);
  document.body.dataset.tab = ui.tab;
  if (ui.tab === 'map') openMap();
  updateFavBadge();
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.id === 'view-' + ui.tab));
  const titles = { search: t('tab_search'), fav: t('tab_fav'), settings: t('tab_settings') };
  $('#search-title').textContent = titles.search; $('#fav-title').textContent = titles.fav; $('#settings-title').textContent = titles.settings;
  $('#search-input').placeholder = t('search_ph');
  document.querySelectorAll('.tab-l').forEach((s) => { s.textContent = t('tab_' + s.dataset.k); });
  document.querySelectorAll('[data-t]').forEach((s) => { s.textContent = t(s.dataset.t); });
  renderHome(); renderSearch(); renderFavs(); renderSettings();
}

// ───────── шторки ─────────
let sheetOnClose = null;
// Шторка карты как в Google Maps (Игорь 14.10.2026): три положения — полоска (peek), половина (half), весь экран (full).
// В peek и half карта за шторкой живая, затемнение — только в full. Шторка стоит над нижней панелью.
// Обычные шторки (чит, выбор игры, оплата) — модальные, как раньше: openSheet без opts.snap.
let snap = null;
const SNAP_ORDER = ['peek', 'half', 'full'];
function snapPx(s) {
  const H = $('#sheet-layer').clientHeight || innerHeight;
  if (s === 'peek') return 112;
  if (s === 'half') return Math.max(340, Math.min(460, Math.round(H * 0.5)));
  return H;
}
function applySnap(animate = true) {
  if (!snap) return;
  const sheet = $('#sheet'), h = sheet.offsetHeight, vis = Math.min(h, snapPx(snap));
  if (!animate) sheet.style.transition = 'none';
  sheet.style.transform = `translateY(${h - vis}px)`;
  document.documentElement.style.setProperty('--sheet-vis', vis + 'px');
  if (!animate) requestAnimationFrame(() => { sheet.style.transition = ''; });
}
// вернуть шторку в её текущее положение (после чужого жеста). Положение шторки меняет только app.js:
// 15.10.2026 ползунок в map.js писал sheet.style.transform = '' — у шторки с положениями это «весь экран».
function restSheet() { if (snap) applySnap(); else $('#sheet').style.transform = ''; }
function setSnap(s) {
  if (!snap || !SNAP_ORDER.includes(s)) return;
  snap = s;
  $('#sheet-layer').dataset.snap = s;
  document.body.dataset.sheet = s;
  $('#sheet-body').scrollTop = s === 'full' ? $('#sheet-body').scrollTop : 0;
  applySnap();
}
function openSheet(html, cls = '', onClose = null, opts = null) {
  const layer = $('#sheet-layer'), body = $('#sheet-body');
  // карточка карты уже открыта и открываем другую — как в Google Maps: новое содержимое плавно проявляется,
  // шторка мягко едет в нужное положение (с «весь экран» — на половину), без резкой подмены
  const swap = !!(opts?.snap && snap && layer.classList.contains('open'));
  $('#sheet').className = 'sheet ' + cls;
  body.innerHTML = html;
  body.scrollTop = 0;
  if (swap) { body.classList.add('swap-in'); requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('swap-in'))); }
  sheetOnClose = onClose;
  if (opts?.snap) {
    snap = opts.snap; layer.classList.add('snap', 'open');
    layer.dataset.snap = snap; document.body.dataset.sheet = snap;
    applySnap();
  } else {
    snap = null; layer.classList.remove('snap'); delete layer.dataset.snap; delete document.body.dataset.sheet;
    $('#sheet').style.transform = '';
    layer.classList.add('open');
  }
}
function closeSheet() {
  ui.stopPlay?.();
  const layer = $('#sheet-layer');
  layer.classList.remove('open');
  $('#sheet').style.transform = '';
  if (snap) {   // режим положений снимаем после того, как шторка уехала вниз (иначе прыжок на высоту нижней панели)
    snap = null; delete document.body.dataset.sheet; document.documentElement.style.setProperty('--sheet-vis', '0px');
    setTimeout(() => { if (!layer.classList.contains('open')) { layer.classList.remove('snap'); delete layer.dataset.snap; } }, 380);
  }
  const cb = sheetOnClose; sheetOnClose = null; cb?.();
}
addEventListener('resize', () => applySnap(false));

// Перетаскивание шторки вниз — с фиксацией направления, как в iOS.
// Направление решается по первым ~10px: шторка едет, только если палец идёт явно вниз
// (|dy| > 1.6·|dx|). Если первым пошло движение вбок — весь жест отдаётся листанию
// (фото, ползунок «игра ⇄ жизнь», ленты), и шторка не двигается до отпускания пальца.
const SHEET_LOCK_PX = 10, SHEET_V_RATIO = 1.6, SHEET_CLOSE_PX = 110, SHEET_FLICK_PX_MS = 0.6;
(() => {
  const sheet = $('#sheet');
  let x0 = 0, y0 = null, t0 = 0, dy = 0, dir = null;
  let base = 0, hist = [], fromH = false;
  // Игорь 15.10.2026: «карточка на половине, веду влево-вправо — она открывается во весь экран». Живой палец в начале
  // горизонтального свайпа чуть уходит вверх: шторка считала это рывком вверх. Теперь: шторка едет только при явно
  // вертикальном движении, положение меняется только после сдвига ≥ 28 px, скорость — за последние 80 мс.
  const SNAP_MIN_PX = 28, SNAP_LOCK_PX = 12, SNAP_V_RATIO = 1.8, SNAP_V_RATIO_H = 2.6;
  sheet.addEventListener('touchstart', (e) => {
    const body = $('#sheet-body');
    if (e.touches.length > 1 || (body.scrollTop > 0 && !e.target.closest('.grab'))) { y0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = e.timeStamp; dy = 0; dir = null;
    hist = [[t0, y0]];
    // начало на ползунке сравнения или горизонтальной ленте — вертикаль должна быть совсем явной
    fromH = !!e.target.closest('.cmp-stage, .cmp-ipairs, .mp-near-row, .mp-chooser, [data-hscroll]');
    const m = /translateY\((-?[\d.]+)px\)/.exec(sheet.style.transform); base = m ? +m[1] : 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (y0 == null || dir === 'h') return;
    const dx = e.touches[0].clientX - x0, d = e.touches[0].clientY - y0;
    if (!dir) {
      const lock = snap ? SNAP_LOCK_PX : SHEET_LOCK_PX;
      if (Math.abs(dx) < lock && Math.abs(d) < lock) return;
      // в режиме положений шторку можно тянуть и вверх (кроме «весь экран» — там вверх листается содержимое)
      const upOk = snap && snap !== 'full';
      const ratio = snap ? (fromH ? SNAP_V_RATIO_H : SNAP_V_RATIO) : SHEET_V_RATIO;
      dir = (d > 0 || upOk) && Math.abs(d) > Math.abs(dx) * ratio ? 'v' : 'h';
      if (dir === 'h') return;
      sheet.style.transition = 'none';
    }
    hist.push([e.timeStamp, e.touches[0].clientY]); if (hist.length > 12) hist.shift();
    if (snap) {
      dy = d - Math.sign(d) * SHEET_LOCK_PX;
      sheet.style.transform = `translateY(${Math.max(0, base + dy)}px)`;
      return;
    }
    dy = Math.max(0, d - SHEET_LOCK_PX);
    sheet.style.transform = dy ? `translateY(${dy}px)` : '';
  }, { passive: true });
  const end = (e) => {
    if (y0 == null) return;
    const wasV = dir === 'v', speed = dy / Math.max(1, e.timeStamp - t0);
    y0 = null; dir = null;
    if (!wasV) return;
    sheet.style.transition = '';
    if (snap) {   // к ближайшему положению с учётом скорости; ниже полоски или рывок вниз из полоски — закрыть
      const tEnd = e.timeStamp, recent = hist.filter(([t]) => tEnd - t <= 80), a = recent[0] || hist[0], b = hist[hist.length - 1];
      const v = b && a && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
      if (Math.abs(dy) < SNAP_MIN_PX) { setSnap(snap); return; }   // едва сдвинули — остаёмся где были
      const h = sheet.offsetHeight, vis = h - Math.max(0, base + dy), proj = vis - v * 150;
      if (vis < snapPx('peek') - 60 || (snap === 'peek' && v > SHEET_FLICK_PX_MS && dy > SNAP_MIN_PX)) { closeSheet(); return; }
      let next = SNAP_ORDER.reduce((a, b) => (Math.abs(Math.min(h, snapPx(b)) - proj) < Math.abs(Math.min(h, snapPx(a)) - proj) ? b : a));
      if (Math.abs(v) > SHEET_FLICK_PX_MS) { const i = SNAP_ORDER.indexOf(snap) + (v < 0 ? 1 : -1); next = SNAP_ORDER[Math.max(0, Math.min(2, i))]; }
      if (next !== snap) haptic?.();
      setSnap(next); return;
    }
    if (dy > SHEET_CLOSE_PX || (dy > 40 && speed > SHEET_FLICK_PX_MS)) closeSheet(); else sheet.style.transform = '';
  };
  sheet.addEventListener('touchend', end);
  sheet.addEventListener('touchcancel', end);
})();

// Экран чита
// значок кода — по категории (решение: своя иконка категории, без кадров игры и эмодзи из данных)
const cheatIc = (c) => I[CATEGORIES.find((x) => x.id === c.category)?.icon] || I.gamepad;
function mediaHTML(c) {
  if (c.media) return `<video src="${esc(c.media)}" autoplay muted loop playsinline></video>`;
  return `<div class="poster"><span class="poster-emoji">${cheatIc(c)}</span><span class="poster-tag">${I.play}${t('video_soon')}</span></div>`;
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
      <h2><span class="d-emoji">${cheatIc(c)}</span>${esc(L(c.name))}</h2>
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
function welcomeHTML() {
  const feats = [[I.gamepad, 'w_f1'], [I.map, 'w_f2'], [I.star, 'w_f3']];
  return `
    <div class="wl-hero">
      <img class="wl-icon" src="icons/icon-512.png" alt="">
      <h1>${esc(APP.shortName)}</h1>
      <p>${t('w_sub')}</p>
    </div>
    <ul class="wl-feats">${feats.map(([ic, k]) => `<li><span>${ic}</span><div><b>${t(k)}</b><small>${t(k + 's')}</small></div></li>`).join('')}</ul>
    <button class="btn-primary ob-cta" data-action="ob-start">${t('start')}</button>
    <p class="wl-note">${t('w_note')}</p>`;
}
function renderOnboarding(dir = 0) {
  const ob = $('#onboarding');
  const step = ui.obStep;
  const g = ui.obGame || store.game;
  if (step === 'welcome') { ob.innerHTML = `<div class="ob-body wl${dir < 0 ? ' ob-in-left' : ''}">${welcomeHTML()}</div>`; return; }
  ob.innerHTML = `
    <div class="ob-bar">
      <button class="ob-back" data-action="ob-back">${I.back}<span>${t('back')}</span></button>
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
  ui.obStep = 'welcome'; ui.obGame = store.game; ui.obPlatform = obDefaultPlatform(store.game); obBusy = false;
  document.body.classList.add('in-ob');
  renderOnboarding();
}
function obGo(step, dir) {
  ui.obStep = step;
  if (step === 'platform' && !GAMES.find((x) => x.id === ui.obGame).platforms.includes(ui.obPlatform)) ui.obPlatform = obDefaultPlatform(ui.obGame);
  renderOnboarding(dir ?? (step === 'platform' ? 1 : -1));
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
// Сердечко меняется на месте: перерисовка экранов сбрасывала прокрутку лент и списков.
function refreshFavUI() {
  document.querySelectorAll('[data-action=fav][data-id]').forEach((b) => {
    const on = store.favs.includes(b.dataset.id); b.classList.toggle('on', on);
    b.innerHTML = on ? I.heartFill : I.heart;
  });
  refreshPlaceHearts();
  if (ui.tab === 'fav') renderFavs();
  updateFavBadge(true);
}
function refreshPlaceHearts() { document.querySelectorAll('[data-action=fav-place]').forEach((b) => { const on = isFavPlace(b.dataset.key); b.classList.toggle('on', on); b.innerHTML = on ? I.heartFill : I.heart; }); }

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
        const box = document.querySelector(`#view-${tab} .scroll`);
        box?.scrollTo({ top: 0, behavior: 'smooth' });
        if (tab === 'search') $('#search-input').focus();
        break;
      }
      ui.tab = tab; renderAll(); // клавиатуру поиска не открываем сами: сначала видны фильтры и подборки
      break;
    }
    case 'cat': ui.cat = el.dataset.cat; haptic(); scrollToCat(ui.cat); break;
    case 'open': if (ui.tab === 'search') rememberQuery(); openCheat(id); haptic(); break;
    case 'fav': {
      e.stopPropagation(); haptic();
      const i = store.favs.indexOf(id); if (i >= 0) store.favs.splice(i, 1); else store.favs.push(id);
      save(); refreshFavUI();
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
    case 'open-cheats': haptic(); if (el.dataset.cat) ui.cat = el.dataset.cat; ui.tab = 'cheats'; renderAll(); setTimeout(() => scrollToCat(ui.cat, false), 0); break;
    case 'back-home': haptic(); ui.tab = 'home'; renderAll(); break;
    case 'hub-game': {
      if (v === store.game) break;
      haptic(); store.game = v;
      const g2 = game(); if (!g2.platforms.includes(store.platform)) store.platform = g2.platforms[0];
      save(); await loadGame(v); renderAll(); break;
    }
    case 'open-place': haptic(); rememberQuery(); openOnMap(el.dataset.key); break;
    case 'fav-place': {
      e.stopPropagation(); toggleFavPlace(el.dataset.key);
      el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300); break;
    }
    case 'search-browse': haptic(); sf.type = el.dataset.type; sf.cat = ''; sf.conf = ''; ui.tab = 'search'; renderAll(); break;
    case 'sf-type': haptic(); sf.type = v; sf.cat = ''; if (v === 'cheats' || v === 'all') sf.conf = ''; renderSearch(); $('#search-results').scrollTop = 0; break;
    case 'sf-game': haptic(); sf.game = v; sf.cat = ''; renderSearch(); break;
    case 'sf-cat': haptic(); sf.cat = v; renderSearch(); break;
    case 'sf-conf': haptic(); sf.conf = v; renderSearch(); break;
    case 'sf-reset': sf.cat = ''; sf.conf = ''; renderSearch(); break;
    case 'recent-clear': store.recent = []; save(); renderSearch(); break;
    case 'fav-filter': haptic(); ui.favFilter = v; renderFavs(); break;
    case 'map-layer': haptic(); (await mapMod()).toggle(v); break;
    case 'map-game': haptic(); (await mapMod()).setGame(v); break;
    case 'map-locate': haptic(); (await mapMod()).locate(); break;
    case 'map-fit': haptic(); (await mapMod()).refit(); break;
    case 'hint': ui.query = el.dataset.q; $('#search-input').value = ui.query; renderSearch(); break;
    case 'search-clear': ui.query = ''; $('#search-input').value = ''; renderSearch(); $('#search-input').focus(); break;
    case 'theme': store.theme = v; save(); applyTheme(); renderSettings(); mapMod().then((m) => m.retheme()); break;
    case 'maps-app': haptic(); store.mapsApp = v; save(); renderSettings(); break;
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
    case 'ob-game': haptic(); obPickThen(el, () => { ui.obGame = v; obGo('platform', 1); }); break;
    case 'ob-platform': haptic(); obPickThen(el, () => { ui.obPlatform = v; finishOnboarding(); }); break;
    case 'ob-back': haptic(); if (!obBusy) obGo(ui.obStep === 'platform' ? 'game' : 'welcome', -1); break;
    case 'ob-start': haptic(); obGo('game', 1); break;
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
$('#sheet-layer').addEventListener('click', (e) => { if (e.target.id === 'sheet-layer') { if (snap === 'full') setSnap('half'); else closeSheet(); } });
// нажатие на «ручку» шторки карты — на положение выше: полоска → половина → весь экран → половина
$('#sheet .grab').addEventListener('click', () => { if (snap) setSnap(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half'); });
$('#search-input').addEventListener('input', (e) => { ui.query = e.target.value; renderSearch(); });
$('#search-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { rememberQuery(); e.target.blur(); } });
$('#pager').addEventListener('scroll', () => requestAnimationFrame(moveInk), { passive: true });
addEventListener('resize', () => scrollToCat(ui.cat, false));

// ───────── старт ─────────
(async function init() {
  setLang(store.lang || (navigator.language || 'ru').slice(0, 2));
  applyTheme(); applySkin();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // новая версия на сервере → перезагрузка в свежую (только если уже была старая)
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
    navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => { });
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();
  await loadGame(store.game).catch(() => { });
  renderAll();
  // ссылка «поделиться местом» (…/?open=place:gta5:<id>): друг сразу видит это место; знакомство — в следующий раз
  const openKey = new URLSearchParams(location.search).get('open');
  if (openKey) { history.replaceState(null, '', location.pathname); openOnMap(openKey); }
  else if (!store.onboarded) showOnboarding();
  document.body.classList.add('ready');
  requestAnimationFrame(guardTabbar);
})();
