// Чит-коды GTA — демо PWA.
// Архитектура как у Cheats Pro: онбординг (игра → платформа) → пейвол →
// 4 вкладки (Главная / Поиск / Избранное / Настройки) → шторка чита.

import { APP, CATEGORIES, DEFAULT_CATEGORY, PLATFORMS, GAMES, PAYWALL, HERO, OWN_ART } from './config.js';
import { t, tn, L, setLang, getLang, SPEAK } from './i18n.js';
import { I, platformIcon, comboHTML, btn } from './icons.js';
import { SKINS, switchTo } from './skin.js';
import { loadPlaces, loadedPlaces, MAP_GAMES, placeKey, parseKey, findByKey, featured, searchPlaces, realName, realSub, cityOf, thumbOf, catLabel, catIcon, CAT_LABELS, CONF } from './places.js';

// ───────── хранилище ─────────
const KEY = 'cheats.v1';
// pro / proPlan / proUntil — демо-покупка на устройстве; trialStart — первое открытие (пробный 72 часа, 31 §4.2);
// linkKeys — места, открытые по ссылке «поделиться»: видны и без Pro (31 §4.2, «одна вещь из ссылки»)
const DEFAULTS = { onboarded: false, game: 'gta5', platform: 'playstation', favs: [], favPlaces: [], recent: [], pro: false, proPlan: null, proUntil: 0, trialStart: 0, trialEndSeen: false, linkKeys: [], theme: 'dark', lang: null, haptic: true, installHint: false, mapsApp: 'google' };
const store = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { }
  return { ...DEFAULTS, ...s };
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { } }

// ───────── состояние экрана ─────────
const ui = { mapGame: null, mapPrefer: null, prevTab: 'home', tab: 'home', cat: DEFAULT_CATEGORY, query: '', obStep: 'game', obGame: null, obPlatform: null, stopPlay: null };
const data = {}; // gameId -> {cheats, ...}

const $ = (sel, root = document) => root.querySelector(sel);
const mapMod = () => import('./map.js');
// экраны креаторов (js/league.js, данные — window.SB.api из js/api.js): хаб «Для авторов» вверху Настроек и слой Лиги
const crMod = () => import('./league.js');
let crHub = '';   // последняя разметка хаба — Настройки рисуются сразу, без прыжка
const crCtx = () => ({ openSheet, closeSheet, toast, haptic, openOnMap, game: () => store.game, isFav: (k) => isFavPlace(k), toggleFav: (k) => toggleFavPlace(k), onProfile: setProfile });
let crLoaded = false;   // модуль грузится при первом заходе в Настройки или по вызову экрана креатора — не на старте
function renderCrHub() {
  if (!crLoaded && ui.tab !== 'settings') return;
  crLoaded = true;
  crMod().then((m) => { m.init(crCtx()); return m.renderHub(); }).then((h) => { crHub = h || ''; }).catch(() => { });
}
// вход для сессии карты: кнопка «Ролики об этом месте» в карточке места вызывает window.SB.openPlaceVideos(игра, id места)
window.SB = window.SB || {};
window.SB.openPlaceVideos = (world, placeId) => { crLoaded = true; return crMod().then((m) => { m.init(crCtx()); return m.openPlaceVideos(world, placeId); }); };
window.SB.openCreator = (id, args) => { crLoaded = true; return crMod().then((m) => { m.init(crCtx()); return m.openCreator(id, args); }); };
window.SB.shootPlace = (world, placeId) => { crLoaded = true; return crMod().then((m) => { m.init(crCtx()); return m.shootPlace(world, placeId); }); };   // «Снять про это» из карточки места
// для сессии карты: «Поправить» в карточке места и новое место долгим тапом (форма вклада, 08 №12)
window.SB.fixPlace = (world, placeId) => { crLoaded = true; return crMod().then((m) => { m.init(crCtx()); return m.fixPlace(world, placeId); }); };
window.SB.addPlaceAt = (world, lat, lon) => { crLoaded = true; return crMod().then((m) => { m.init(crCtx()); return m.addPlaceAt(world, lat, lon); }); };
window.SB.becomePartner = () => { crLoaded = true; return crMod().then((m) => { m.init(crCtx()); return m.becomePartner(); }); };
const mapCtx = () => ({ mapsApp: () => store.mapsApp || 'google', openSheet, closeSheet, setSnap, sheetSnap: () => snap, sheetPx: snapPx, restSheet, haptic, toast, I, isFav: (k) => isFavPlace(k), toggleFav: (k) => toggleFavPlace(k) });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const game = () => GAMES.find((g) => g.id === store.game) || GAMES.find((g) => g.id === DEFAULTS.game);   // GTA 6 стоит в GAMES первой — запасная игра не от порядка
const cheats = () => (data[store.game]?.cheats) || [];
const byId = (id) => Object.values(data).flatMap((d) => d.cheats).find((c) => c.id === id);
const tf = (k, o = {}) => t(k).replace(/\{(\w+)\}/g, (_, x) => o[x] ?? '');

// ───────── доступ: пробный 72 часа, Pro, рабочий Pro партнёра (Ресерч 31 §4.2–4.5, решение №14; концепт v11) ─────────
// Тарифов «бесплатно навсегда» нет. Пробный — все коды и поиск; карта игр — 10 секунд показа и замок; места «в жизни» —
// в Pro (кроме места из ссылки). После пробного без Pro — код с замком (codelock) и пейвол trial_end.
// Pro — демо-покупка на устройстве (store.pro) или профиль SB.api: pro_until (год, пропуск, месяц), work_pro_until (рабочий Pro
// партнёра: Лига и заработок от Pro не зависят — js/league.js). Профиль мока берём, только если состояние выбрано явно
// (?sbmock=…) или пришло после входа в партнёры; иначе пробный считается от первого запуска на устройстве.
const DAY = 864e5, HOUR = 36e5;
const acc = { P: null };
const until = (v) => (v ? new Date(/T/.test(v) ? v : v + 'T23:59:59').getTime() : 0);
function setProfile(P) { acc.P = P || null; onAccess(); }
const workUntil = () => until(acc.P?.work_pro_until || (acc.P?.pro_kind === 'work' ? acc.P?.pro_until : null));
const paidUntil = () => (acc.P?.pro_kind === 'work' ? 0 : until(acc.P?.pro_until));
function hasPro() { const now = Date.now(); return !!store.pro || paidUntil() > now || workUntil() > now; }
function proKind() {
  const now = Date.now();
  if (store.pro) return store.proPlan || 'year';
  if (paidUntil() > now) return acc.P.pro_kind || 'year';
  return workUntil() > now ? 'work' : null;
}
function proEnds() { const k = proKind(); return k === 'work' ? workUntil() : store.pro ? store.proUntil : paidUntil(); }
const trialEnd = () => (acc.P?.trial_until ? until(acc.P.trial_until) : (store.trialStart || Date.now()) + PAYWALL.trialHours * HOUR);
function access() { return hasPro() ? 'pro' : Date.now() < trialEnd() ? 'trial' : 'locked'; }
const isLocked = () => access() === 'locked';
// что закончилось: пробный (→ «Пробные 3 дня закончились») или рабочий Pro партнёра
const workEnded = () => !!workUntil() && workUntil() <= Date.now() && workUntil() >= trialEnd();
const gift = () => (!hasPro() && acc.P?.gift?.from ? acc.P.gift : null);
const giftKey = () => { const g = gift(); return g?.place ? placeKey({ kind: 'place', game: g.place.world, id: g.place.id }) : ''; };
// место из ссылки (друг или креатор) видно и без Pro; остальные места и карта — в Pro
const canOpenPlace = (key) => access() === 'pro' || store.linkKeys.includes(key) || key === giftKey();
// пояс цен (31 §1 п. 2): страна из профиля сервера; до него — регион языка браузера (pt-BR → Бразилия). Только показ.
const country = () => String(acc.P?.country || (navigator.language || '').split('-')[1] || '').toUpperCase();
const zone = () => PAYWALL.zones[PAYWALL.countries[country()] || 1];
// оплата не принимается (Россия, Беларусь) — только по стране профиля, не по языку
const noPay = () => PAYWALL.noPay.includes(String(acc.P?.country || '').toUpperCase());
const usd = (v) => '$' + v.toFixed(2).replace('.', getLang() === 'ru' ? ',' : '.');
function dlong(ms) {
  const d = new Date(ms), o = { day: 'numeric', month: 'long' };
  if (d.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
  return d.toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-US', o).replace(/\s?г\.$/, '');
}
// «2 дня 14 ч», «3 дня», «5 ч», «20 мин» — остаток пробного по часам вверх
function trialLeft() {
  const ms = Math.max(0, trialEnd() - Date.now()), h = Math.ceil(ms / HOUR), d = Math.floor(h / 24), hh = h % 24;
  if (d) return tn(d, 'n_days') + (hh ? ` ${hh} ${t('trial_h')}` : '');
  if (ms > HOUR) return `${h} ${t('trial_h')}`;
  return `${Math.max(1, Math.ceil(ms / 6e4))} ${t('trial_m')}`;
}
let lastAccess = '';
function onAccess() {
  const a = access(), was = lastAccess; lastAccess = a;
  if (!document.body.classList.contains('ready')) return;
  if (a !== was) { refreshCards(); renderSettings(); }
  renderTrialLine(); renderMapLock();
  checkTrialEnd();
}
// пробный кончился (при запуске или по таймеру) — один раз пейвол trial_end (28 §6.0: «потом пейвол… и по таймеру»)
function checkTrialEnd() {
  if (access() !== 'locked' || store.trialEndSeen || !store.onboarded || document.body.classList.contains('in-ob')) return;
  store.trialEndSeen = true; save();
  openPaywall(workEnded() ? '' : 'trial_end');
}

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
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), msg.length > 40 ? 4200 : 1800);
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

// Клавиатура iPhone (Игорь 28.10.2026: «поле, куда надо ввести текст, — под клавиатурой»). Страницу мы держим на месте
// (выше: scrollTo(0,0) при фокусе), поэтому iOS не может сама поднять поле — поднимаем сами: высота клавиатуры из
// visualViewport → переменная --kb; шторка стоит над клавиатурой, экраны креаторов получают отступ снизу, поле — в центр.
function kbInset() {
  const vv = window.visualViewport; if (!vv) return;
  const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  const open = kb > 80;   // меньше — панель подсказок/полоса, не клавиатура
  document.documentElement.style.setProperty('--kb', (open ? kb : 0) + 'px');
  document.body.classList.toggle('kb-open', open);
  const a = document.activeElement;
  if (open && a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) setTimeout(() => {   // в центр видимой части — прокруткой своего блока, не страницы
    const box = a.closest('.sheet-body, .cr-body'); if (!box) return;
    const r = a.getBoundingClientRect(), vis = window.innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kb')) || 0);
    if (r.bottom > vis - 16 || r.top < 0) box.scrollTop += r.top - vis / 2 + r.height / 2;
  }, 420);   // после подъёма шторки (.38 с)
}
// body тоже не должен прокручиваться: при фокусе на поле браузер «довозит» его прокруткой body (overflow:hidden это
// не запрещает), и весь экран уезжает вверх под шторкой. Держим body на месте, как и окно.
document.body.addEventListener('scroll', () => { if (document.body.scrollTop || document.body.scrollLeft) document.body.scrollTo(0, 0); }, { passive: true });
window.visualViewport?.addEventListener('resize', kbInset);
window.visualViewport?.addEventListener('scroll', kbInset);
addEventListener('focusout', () => setTimeout(kbInset, 250));
window.__kbInset = kbInset;   // для проверки

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
// скин по игре на экране: акцент и картинки из tokens.css [data-skin]. На карте — игра карты (её можно сменить
// вкладкой на самой карте, не меняя игру приложения), на остальных экранах — выбранная игра.
// gid — на время онбординга: до выбора игры скин GTA 6 (главная в рекламе), после — выбранной игры.
// Смена игры пользователем идёт с анимацией через changeGame() → skin.switchTo(); здесь — без анимации.
const skinGame = () => (ui.tab === 'map' && ui.mapGame) || store.game;
function applySkin(gid = skinGame()) {
  const sk = SKINS[gid];
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

// фото эпохи: <picture> AVIF → WebP (img/ui/<скин>/<имя>)
function pic(b, cls = '', w = 860, h = 676, lazy = false) {
  return b ? `<picture class="${cls}"><source type="image/avif" srcset="${b}.avif"><img src="${b}.webp" alt="" width="${w}" height="${h}" decoding="async"${lazy ? ' loading="lazy"' : ''}></picture>` : '';
}
// совпадение с запросом — цветом эпохи (Поиск)
function hl(text, q) {
  const s = String(text ?? ''), w = norm(q.trim()).split(/\s+/).filter((x) => x.length > 1).sort((a, b) => b.length - a.length)[0];
  const i = w ? norm(s).indexOf(w) : -1;
  return i < 0 ? esc(s) : `${esc(s.slice(0, i))}<mark class="hl">${esc(s.slice(i, i + w.length))}</mark>${esc(s.slice(i + w.length))}`;
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

// Строка кода в списках («Коды категории», Поиск, Избранное) — как в референсе Cheats Pro и в проде: название, строка номера
// телефона, ВСЯ комбинация выбранной платформы значками (переносится на 2–3 ряда), сердце. Что делает — только в шторке кода.
// 26.10.2026, Игорь: «хочу меньше кнопок делать, когда я играю. И лучше показывать им вот эти кнопки» — комбинация видна без
// открытия шторки. Предохранитель — тест cheat_list_combo в «Тестирование 21.10/deep.py».
// После пробного (codelock): той же длины подставные кнопки под размытием, настоящего кода в разметке нет (как в шторке).
const FAKE_KEYS = ['↑', '→', '↓', '←'];
function rowKeys(str, cls) {
  return `<span class="${cls}">${[...str].map((ch) => ch === '-' ? '<i class="dash">-</i>' : `<span class="ch">${esc(ch)}</span>`).join('')}</span>`;
}
function rowCode(c, p, locked) {
  const k = c.codes || {};
  const phone = locked ? (k.phone || '').replace(/\d/g, '0') : k.phone;
  const pline = (v) => (v ? `<span class="row-ph">${t('phone_code')}: <b>${esc(v)}</b></span>` : '');
  const combo = (p === 'playstation' || p === 'xbox') && k[p]?.length ? k[p] : null;
  if (combo) return pline(phone) + comboHTML(locked ? combo.map((_, i) => FAKE_KEYS[i % 4]) : combo, p);
  if (p === 'pc' && k.pc) return pline(phone) + rowKeys(locked ? k.pc.replace(/[a-z0-9]/gi, 'X') : k.pc, 'row-pc');
  if (k.phone) return (p !== 'phone' ? `<span class="row-sub">${t('phone_only')}</span>` : '') + `<span class="row-num">${esc(phone)}</span>`;
  return `<span class="row-none">${I.sparkle}<span>${t('no_code_yet')}</span></span>`;
}
function cardHTML(c, opt = {}) {
  const fav = store.favs.includes(c.id);
  const locked = isLocked();
  const fc = opt.badge && c.status === 'forecast' ? `<em class="card-fc">${t('forecast')}</em>` : '';
  return `<article class="card${locked ? ' is-locked' : ''}" data-action="open" data-id="${c.id}">
    <span class="card-m"><span class="card-top"><h3 class="card-title">${opt.q ? hl(L(c.name), opt.q) : esc(L(c.name))}</h3>${fc}</span>
      <span class="card-code"${locked ? ' aria-hidden="true"' : ''}>${rowCode(c, store.platform, locked)}</span>${locked ? `<span class="card-lock">${I.lock}<b>${t('cl_lock')}</b></span>` : ''}</span>
    <button class="fav${fav ? ' on' : ''}" data-action="fav" data-id="${c.id}" aria-label="${esc(t('save'))}">${fav ? I.heartFill : I.heart}</button>
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
  // дни до выхода — во вкладке мира на Главной; здесь короткая пометка, как на экранах этапа 2
  return `<div class="fc-banner">
    <span class="fc-ic">${I.info}</span>
    <div class="fc-text"><div class="fc-title">${d > 0 ? t('release_in').replace('{d}', date) : t('released')}</div><div class="fc-sub">${t('forecast_banner')}</div></div>
  </div>`;
}
const POPULAR = {
  gta5: ['invincible', 'weapons', 'health', 'wanted_down', 'buzzard', 'superjump', 'sanchez', 'weather'],
  gta6: ['g6_invincible', 'g6_weapons', 'g6_health', 'g6_wanted_down', 'g6_v_heli', 'g6_superjump', 'g6_v_super', 'g6_weather'],
};
const liveGames = () => GAMES.filter((g) => g.status !== 'soon');
const mapPlaceName = (gid) => ({ gta6: t('place_gta6'), gta5: t('place_gta5') }[gid] || '');

function miniCheat(c) {
  const k = c.codes || {}, p = store.platform, locked = isLocked();
  let code = '';
  if (locked) code = '';
  else if ((p === 'playstation' || p === 'xbox') && k[p]?.length) code = comboHTML(k[p].slice(0, 5), p) + (k[p].length > 5 ? `<i class="more">+${k[p].length - 5}</i>` : '');
  else if (p === 'pc' && k.pc) code = `<span class="mc-pc">${esc(k.pc)}</span>`;
  else if (k.phone) code = `<span class="mc-pc">${esc(k.phone)}</span>`;
  return `<button class="mini-cheat${locked ? ' is-locked' : ''}" data-action="open" data-id="${c.id}">
    <span class="mc-top"><span class="mc-ic">${cheatIc(c)}</span>${locked ? `<span class="mc-lock">${I.lock}</span>` : ''}</span>
    <b>${esc(L(c.name))}</b><span class="mc-code">${code}</span></button>`;
}
function placeCard(o, opt = {}) {
  const key = placeKey(o), fav = store.favPlaces.includes(key), img = thumbOf(o, o.kind === 'egg' ? 'game' : 'real');
  return `<div class="pcard" data-action="open-place" data-key="${esc(key)}" role="button" tabindex="0">
    ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pc-ph">${o.kind === 'egg' ? I.egg : I[catIcon(o.c)]}</span>`}
    <span class="pc-grad"></span>
    <span class="pc-tags">${o.kind === 'egg' ? `<i class="tag-egg">${t('map_egg')}</i>` : `<i class="conf conf-${o.cf}">${t('conf_' + o.cf)}</i>`}${opt.game ? `<i class="tag-game">${GAMES.find((g) => g.id === o.game)?.title || ''}</i>` : ''}</span>
    <button class="pc-fav${fav ? ' on' : ''}" data-action="fav-place" data-key="${esc(key)}" aria-label="${esc(t('save'))}">${fav ? I.heartFill : I.heart}</button>
    <span class="pc-txt"><b>${esc(realName(o))}</b>${o.kind === 'egg' ? (realSub(o) ? `<small>${esc(realSub(o))}</small>` : '') : `<small>${I.pin}${esc(cityOf(o) || realSub(o))}</small>`}</span>
  </div>`;
}
// строка места (Поиск, Избранное): фото, настоящее место (решение №15, без игрового названия), адрес, точность — строкой, без рамки-карточки
function placeRow(o, opt = {}) {
  const key = placeKey(o), fav = store.favPlaces.includes(key), img = thumbOf(o, o.kind === 'egg' ? 'game' : 'real');
  const city = cityOf(o), q = opt.q || '';
  const meta = [t('conf_' + o.cf), o.kind === 'place' && o.c ? catLabel(o.c) : '', city].filter(Boolean).map(esc).join(', ');
  const gt = opt.game ? GAMES.find((g) => g.id === o.game)?.title : '';
  return `<div class="prow" data-action="open-place" data-key="${esc(key)}" role="button" tabindex="0">
    <span class="pr-th">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pr-ph">${o.kind === 'egg' ? I.egg : I[catIcon(o.c)]}</span>`}</span>
    <span class="pr-t"><b>${q ? hl(realName(o), q) : esc(realName(o))}</b><small>${q ? hl(realSub(o), q) : esc(realSub(o))}</small>
      <span class="pr-meta"><i class="dot conf-${o.cf}"></i>${gt ? `${esc(gt)}, ` : ''}${meta}</span></span>
    <button class="fav${fav ? ' on' : ''}" data-action="fav-place" data-key="${esc(key)}" aria-label="${esc(t('save'))}">${fav ? I.heartFill : I.heart}</button>
  </div>`;
}
function hubSection(title, sub, action, body, extra = '') {
  return `<section class="hub-sec"><div class="hub-h"><div><h2>${title}</h2>${sub ? `<small>${sub}</small>` : ''}</div>${action || ''}</div>${body}${extra}</section>`;
}

// ── верх Главной: фото эпохи (листание пальцем, без автопрокрутки), вкладки мира, город, поиск ──
const placeCounts = {}; // число мест по играм — когда данные карты уже загружены
let heroKey = '';
function worldTab(x) {
  const on = x.id === store.game;
  let sub;
  if (x.status === 'forecast') { const d = daysTo(x.release); sub = d > 0 ? t('w_in_days').replace('{n}', tn(d, 'n_days')) : t('released'); }
  else sub = placeCounts[x.id] != null ? tn(placeCounts[x.id], 'n_places') : t('hub_live');
  return `<button class="world${on ? ' on' : ''}" data-action="hub-game" data-v="${x.id}" aria-pressed="${on}"><b>${esc(x.title)}${x.status === 'forecast' ? '<i class="new"></i>' : ''}</b><span>${esc(sub)}</span></button>`;
}
function heroMeta() {
  const n = placeCounts[store.game];
  return [n != null ? tn(n, 'n_places') : '', cheats().length ? tn(cheats().length, 'n_codes') : ''].filter(Boolean).join(', ');
}
function heroHTML() {
  const h = HERO[store.game], g = game();
  const slides = h ? h.banners.map((b, i) => `<picture class="hero-slide"><source type="image/avif" srcset="${b}.avif"><img src="${b}.webp" alt="" width="860" height="676" decoding="async" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></picture>`).join('') : '';
  return `<div class="hero${h ? '' : ' no-photo'}">
    <div class="hero-track">${slides}</div><span class="hero-scrim"></span>
    <div class="worlds" id="hero-worlds">${liveGames().map(worldTab).join('')}</div>
    <div class="hero-city"><h2${(h ? L(h.city) : g.title).length > 8 ? ' class="long"' : ''}>${esc(h ? L(h.city) : g.title)}</h2><p id="hero-meta">${esc(heroMeta())}</p></div>
    ${h && h.banners.length > 1 ? `<div class="hero-dots">${h.banners.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
    ${h && !OWN_ART ? `<span class="hero-credit">${esc(t('frame_credit'))}</span>` : ''}
  </div>
  <button class="hub-search" data-action="tab" data-tab="search">${I.search}<span>${esc(t('search_ph'))}</span></button>
  <div class="hub-trial" id="hub-trial"></div>`;
}
// под поиском: «Пробный доступ: ещё 2 дня 14 ч» (тап — пейвол) и подарок по ссылке креатора; у Pro строк нет
function renderTrialLine() {
  const box = $('#hub-trial'); if (!box) return;
  const a = access(), g = gift();
  box.innerHTML = (a === 'trial' ? `<button class="h-trial" data-action="paywall">${I.clock}<span>${esc(tf('trial_left', { t: trialLeft() }))}</span>${I.chevron}</button>` : '')
    + (g ? `<button class="h-trial h-gift" data-action="paywall" data-pw="link">${I.gift}<span>${esc(tf('gift_home', { n: g.from }))}</span>${I.chevron}</button>` : '');
}
function renderHero() {
  const key = store.game + '|' + getLang();
  if (key !== heroKey) { heroKey = key; $('#home-hero').innerHTML = heroHTML(); bindHero(); renderTrialLine(); return; }
  // данные догрузились — меняем только подписи, фото и положение листания не трогаем
  const w = $('#hero-worlds'), m = $('#hero-meta');
  if (w) w.innerHTML = liveGames().map(worldTab).join('');
  if (m) m.textContent = heroMeta();
}
function bindHero() {
  const tr = $('#home-hero .hero-track'), dots = [...document.querySelectorAll('#home-hero .hero-dots i')];
  if (!tr || dots.length < 2) return;
  let raf = 0;
  tr.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; const i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); });
  }, { passive: true });
}
// число мест другой игры — только если её данные уже есть (лишние 1–2 МБ ради подписи не качаем)
function watchPlaceCounts() {
  MAP_GAMES.forEach((gid) => {
    const p = placeCounts[gid] == null && loadedPlaces(gid);
    if (p) p.then((d) => { if (d?.places?.length && placeCounts[gid] == null) { placeCounts[gid] = d.places.length; renderHero(); } }).catch(() => { });
  });
}

let hubSeq = 0;
async function renderHub() {
  const my = ++hubSeq;
  renderHero();
  const g = game(), box = $('#home-main');
  const pd = MAP_GAMES.includes(store.game) ? await loadPlaces(store.game) : null;
  if (pd?.places?.length) placeCounts[store.game] = pd.places.length;
  watchPlaceCounts();
  const favCount = store.favs.length + store.favPlaces.length;
  if (my !== hubSeq) return;
  const list = cheats();
  const popular = (POPULAR[store.game] || []).map((id) => list.find((c) => c.id === id)).filter(Boolean);
  const places = pd ? featured(pd, 'place', 14) : [];
  const eggs = pd ? featured(pd, 'egg', 12) : [];
  const favPreview = await favItems();
  if (my !== hubSeq) return;
  renderHero();
  box.innerHTML = `
    ${forecastBanner()}
    ${hubSection(t('hub_cheats'), L(PLATFORMS[store.platform]), `<button class="hub-more" data-action="open-cheats" data-cat="">${t('see_all')}${I.chevron}</button>`,
      `<div class="cat-grid">${CATEGORIES.map((c) => `<button class="cat-tile cat-${c.id}" data-action="open-cheats" data-cat="${c.id}">
        <span class="ct-ic">${I[c.icon]}</span><span class="ct-t"><b>${L(c)}</b><small>${tn(list.filter((x) => x.category === c.id).length, 'n_codes')}</small></span></button>`).join('')}</div>`)}
    ${popular.length ? hubSection(t('hub_popular'), '', '', `<div class="hscroll">${popular.map(miniCheat).join('')}</div>`) : ''}
    ${places.length ? hubSection(t('hub_places'), t('hub_places_sub'), `<button class="hub-more" data-action="tab" data-tab="map">${t('open_map')}${I.chevron}</button>`,
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
    return `<section class="page" data-cat="${cat.id}">${list.map(cardHTML).join('') || `<div class="empty">${t('cat_empty')}</div>`}</section>`;
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
  // та же логика, что в map.js open(): игра из настроек приложения переключает карту, если её там поменяли
  if (preferGame !== ui.mapPrefer) { ui.mapPrefer = preferGame; ui.mapGame = preferGame; applySkin(); }
  if (!mapOpening) mapOpening = mapMod().then((m) => m.open(mapCtx(), preferGame).then(() => m)).catch((e) => { mapOpening = null; toast(t('map_error')); throw e; });
  else mapOpening.then((m) => m.open(mapCtx(), preferGame)).catch(() => { });
  return mapOpening;
}
// открыть место на карте
async function openOnMap(key) {
  const { kind, game: g, id } = parseKey(key);
  closeSheet();
  if (!canOpenPlace(key)) { openPaywall(mapPw()); return; }
  if (!mapOpening) openMap(g);
  ui.tab = 'map'; renderAll();
  ui.mapGame = g; applySkin();   // карта откроет место в его игре (focus) — скин за ней
  try {
    const m = await mapOpening;
    if (m.focus) await m.focus(g, kind, id);
    else { await m.setGame(g); toast(t('map_find_hint')); }
  } catch { }
}

// ───────── Поиск: читы, места, пасхалки ─────────
const CODE_WORDS = 'код коды чит читы чит-код чит-коды code codes cheat cheats';
const SYN = { vehicle: 'транспорт машина авто тачка vehicle car', weapon: 'оружие пушка патроны weapon gun', player: 'игрок герой player', world: 'мир погода world' };
const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е');
const sf = ui.sf = { type: 'all', game: null, cat: '', conf: '' };
function searchCheats(list, q, cat) {
  const qq = norm(q.trim()), qd = qq.replace(/\D/g, '');
  return list.filter((c) => {
    if (cat && c.category !== cat) return false;
    if (!qq) return true;
    const hay = norm([c.name.ru, c.name.en, c.desc?.ru, c.desc?.en, c.codes.pc, SYN[c.category], CODE_WORDS].join(' '));
    return qq.split(/\s+/).every((w) => hay.includes(w)) || (qd.length >= 3 && (c.codes.phone || '').replace(/\D/g, '').includes(qd));
  });
}
function chip(action, v, label, on, extra = '') {
  return `<button class="fchip${on ? ' on' : ''}" data-action="${action}" data-v="${esc(v)}" aria-pressed="${!!on}" ${extra}>${label}</button>`;
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
  // счётчики видны и в обзоре (экран 8 этапа 2): в обзоре — сколько всего, при запросе — сколько нашлось
  renderSearchFilters(browsing ? { cheats: cheatList.length, places: pd.places.length, eggs: pd.eggs.length } : { all: R.cheats.length + R.places.length + R.eggs.length, cheats: R.cheats.length, places: R.places.length, eggs: R.eggs.length });
  if (browsing) {
    const hints = getLang() === 'ru' ? ['вертолёт', 'бессмертие', 'Ocean Drive', 'мост', 'отель', 'розыск'] : ['helicopter', 'invincibility', 'Ocean Drive', 'bridge', 'hotel', 'wanted'];
    const qchip = (h, ic = '') => `<button class="qchip" data-action="hint" data-q="${esc(h)}">${ic}<span>${esc(h)}</span></button>`;
    // плитки «Обзор» — настоящие фото мест; без сети — подложка эпохи со значком
    const ph = (list, prefer) => { const o = list.find((x) => thumbOf(x, prefer)); return o ? `<img src="${esc(thumbOf(o, prefer))}" alt="" loading="lazy" decoding="async">` : ''; };
    const tile = (type, ic, label, img) => `<button class="btile" data-action="search-browse" data-type="${type}"><span class="bt-ic">${ic}</span>${img}<b>${label}</b></button>`;
    box.innerHTML = `
      ${store.recent.length ? `<div class="s-sec"><div class="s-h">${t('recent')}<button data-action="recent-clear">${t('clear')}</button></div><div class="qchips">${store.recent.map((h) => qchip(h, I.search)).join('')}</div></div>` : ''}
      <div class="s-sec"><div class="s-h">${t('search_hint')}</div><div class="qchips">${hints.map((h) => qchip(h)).join('')}</div></div>
      <div class="s-sec"><div class="s-h">${t('browse')}</div>
        <div class="browse">
          ${tile('places', I.map, t('browse_places'), ph(featured(pd, 'place', 4), 'real'))}
          ${tile('eggs', I.egg, t('browse_eggs'), ph(featured(pd, 'egg', 4), 'game'))}
          ${tile('cheats', I.gamepad, t('browse_cheats'), ph(featured(pd, 'place', 4).slice(1), 'game'))}
        </div></div>`;
    return;
  }
  const sec = (k, title, items, render, limit) => {
    if (!items.length) return '';
    const shown = limit ? items.slice(0, limit) : items.slice(0, 120);
    return `<div class="s-sec"><div class="s-h">${title} <em>${items.length}</em>${limit && items.length > limit ? `<button data-action="sf-type" data-v="${k}">${t('show_all')}</button>` : ''}</div>${shown.map((x) => render(x)).join('')}</div>`;
  };
  const lim = sf.type === 'all' ? 4 : 0;
  const html = (sf.type === 'all' || sf.type === 'cheats' ? sec('cheats', t('f_cheats'), R.cheats, (c) => cardHTML(c, { badge: true, q }), lim) : '')
    + (sf.type === 'all' || sf.type === 'places' ? sec('places', t('f_places'), R.places, (o) => placeRow(o, { q }), lim) : '')
    + (sf.type === 'all' || sf.type === 'eggs' ? sec('eggs', t('f_eggs'), R.eggs, (o) => placeRow(o, { q }), lim) : '');
  box.innerHTML = html || `<div class="empty-big"><span class="eb-ic">${I.search}</span><h3>${t('search_empty')}</h3><p>${t('search_empty_hint')}</p>${(sf.cat || sf.conf) ? `<button class="btn-ghost" data-action="sf-reset">${t('clear_filters')}</button>` : ''}</div>`;
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
    $('#fav-list').innerHTML = `<div class="empty-big"><span class="eb-ic">${I.heart}</span><h3>${t('fav_empty_t')}</h3><p>${t('fav_empty')}</p>
      <div class="empty-acts"><button class="btn-primary" data-action="tab" data-tab="map">${I.map}${t('go_map')}</button><button class="btn-ghost" data-action="open-cheats" data-cat="">${I.gamepad}${t('browse_cheats')}</button></div></div>`;
    return;
  }
  const showP = f !== 'cheats' && places.length, showC = f !== 'places' && cheatsF.length;
  $('#fav-list').innerHTML = (showP ? `<div class="s-sec"><div class="s-h">${t('f_places')} <em>${places.length}</em></div>${places.map((o) => placeRow(o, { game: true })).join('')}</div>` : '')
    + (showC ? `<div class="s-sec"><div class="s-h">${t('f_cheats')} <em>${cheatsF.length}</em></div>${cheatsF.map((c) => cardHTML(c, { badge: true })).join('')}</div>` : '')
    || `<div class="empty">${t('fav_filter_empty')}</div>`;
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
// карточка Pro в Настройках (концепт v11 settings): без Pro — что внутри и цена года; в пробном — остаток;
// с Pro — срок; пропуск за 7 дней до конца — тап открывает пейвол renew
function proCardHTML() {
  const a = access(), kind = proKind(), end = proEnds(), d = end ? dlong(end) : '';
  const renew = a === 'pro' && kind === 'pass' && end - Date.now() < 7 * DAY;
  const sub = a === 'pro' ? (d ? tf({ work: 'st_pro_work', pass: 'st_pro_pass', month: 'st_pro_month' }[kind] || 'st_pro_year', { d }) : '')
    : a === 'trial' ? tf('trial_left', { t: trialLeft() }) : tf('st_pro_free', { p: usd(zone().year) });
  return `<button class="pro-card${a === 'pro' ? ' on' : ''}" data-action="${a === 'pro' && !renew ? 'noop' : 'paywall'}">
      ${pic(HERO[store.game]?.banners[0], 'pro-photo', 860, 676, true)}
      <span class="pro-txt"><b>${a === 'pro' ? t('st_pro_on') : t('st_pro')}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
      <span class="pro-end">${a === 'pro' && !renew ? I.check : I.chevron}</span>
    </button>`;
}
// в каких картах открывать место (Игорь 15.10.2026: «Google по умолчанию, в настройках — Apple, потом любые другие»).
// Новая карта — строка здесь и ветка в mapsLink (map.js); наружу — только карты (правило «не уводить из приложения»).
const MAPS_APPS = [['google', 'Google'], ['apple', 'Apple']];
function renderSettings() {
  const g = game();
  const th = { dark: t('th_dark'), light: t('th_light'), auto: t('th_auto') };
  $('#settings-body').innerHTML = `
    <div id="cr-hub" class="cr-hub"${crHub ? '' : ' hidden'}>${crHub}</div>
    ${proCardHTML()}
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
    <p class="ver">${t('hub_foot')}<br>${esc(APP.shortName)}, v${esc(APP.version)}</p>`;
  renderCrHub();
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
  renderMapLock();
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
  // видео кода — только настоящее; заглушки-постера нет (решение 8: без кадров игры)
  return c.media ? `<div class="media"><video src="${esc(c.media)}" autoplay muted loop playsinline></video></div>` : '';
}
// Код как посадочный талон (экран 3 этапа 2), компактный (решение Игоря №15: «проще и короче инфу»):
// одна строка «категория, платформа», линия отрыва, кнопки по порядку с номерами.
// Элементы с data-i внутри #d-code подсвечивает озвучка (play) — порядок индексов как в коде.
function passCode(c, p) {
  const k = c.codes || {};
  const combo = (p === 'playstation' || p === 'xbox') && k[p];
  if (combo && combo.length) return { shown: 'combo', html: `<div class="pass-keys">${combo.map((tk, i) => { const b = btn(tk, p); return `<span class="pk"><span class="${b.cls}" data-i="${i}">${b.html}</span><i>${i + 1}</i></span>`; }).join('')}</div>` };
  if (p === 'pc' && k.pc) return { shown: 'pc', html: chars(k.pc, 'pc-code pc-keys') };
  if (k.phone) return { shown: 'phone', html: (p !== 'phone' ? `<div class="sub-label">${t('phone_only')}</div>` : '') + chars(k.phone, 'phone-big') };
  return { shown: '', html: `<div class="no-code">${I.sparkle}<span>${t('no_code_yet')}</span></div>` };
}
function openCheat(id) {
  const c = byId(id);
  if (!c) return;
  if (isLocked()) { openCodeLock(c); return; }
  const g = game(), p = store.platform, k = c.codes || {};
  const cat = CATEGORIES.find((x) => x.id === c.category);
  const pass = passCode(c, p);
  // вместо полей «Категория / Вероятность / Платформа» — одна строка; шанс вернуться (GTA 6) — справа
  const meta = [cat ? L(cat) : '', L(PLATFORMS[p])].filter(Boolean).join(', ');
  const chance = c.confidence && ['high', 'medium', 'low'].includes(c.confidence) ? t('chance_' + c.confidence) : '';
  // код на ПК и номер телефона — строками под талоном (если их нет в самом талоне)
  const alt = [k.pc && pass.shown !== 'pc' ? [t('pc_code'), `<b class="alt-pc">${esc(k.pc)}</b>`] : null,
    k.phone && pass.shown !== 'phone' ? [t('phone_code'), `<b>${esc(k.phone)}</b>`] : null].filter(Boolean);
  // другие платформы — кнопки PS/Xbox; ПК — только если у него своя пометка («ожидается в 2027»), код ПК и телефон уже выше.
  // Свёрнуты под одну строку «Другие платформы», раскрываются по тапу
  const others = g.platforms.filter((x) => x !== p && (x === 'playstation' || x === 'xbox' || (x === 'pc' && !k.pc && g.platformNote?.pc))).map((x) => {
    const note = g.platformNote?.[x] ? ` <small>${L(g.platformNote[x])}</small>` : '';
    const kx = k[x];
    return `<div class="plat-row"><div class="plat-h">${platformIcon(x)}<span>${L(PLATFORMS[x])}${note}</span></div>${x === 'pc' ? '' : kx && kx.length ? comboHTML(kx, x) : `<div class="no-code">${I.sparkle}<span>${t('no_code_yet')}</span></div>`}</div>`;
  }).join('');
  const hasCode = !!(k.phone || k.pc || k[p]);
  const fav = store.favs.includes(c.id);
  // прогноз: пометка из данных одной строкой; если пометки нет — только плашка «Прогноз»
  const note = c.note ? esc(L(c.note)) : c.status === 'forecast' ? `<span class="badge badge-fc">${t('forecast')}</span>` : '';
  // как вводить — одна короткая строка под кнопками (полный текст — Настройки, «Как вводить коды»)
  const how = { combo: 'how_ps', pc: 'how_pc', phone: 'how_phone' }[pass.shown];
  openSheet(`
    <div class="d-head">
      <h2><span class="d-emoji">${cheatIc(c)}</span>${esc(L(c.name))}</h2>
      <button class="icon-btn" data-action="fav" data-id="${c.id}" aria-label="${esc(t('save'))}">${fav ? I.heartFill : I.heart}</button>
      <button class="icon-btn" data-action="share" data-id="${c.id}" aria-label="${esc(t('share'))}">${I.share}</button>
    </div>
    ${mediaHTML(c)}
    <p class="d-desc" data-action="desc">${esc(L(c.desc))}</p>
    <div class="pass">
      <div class="pass-meta"><span>${esc(meta)}</span>${chance ? `<b>${esc(chance)}</b>` : ''}</div>
      <div class="pass-cut"></div>
      <div class="d-code" id="d-code">${pass.html}</div>
    </div>
    ${alt.length ? `<div class="pass-alt">${alt.map(([a, b]) => `<div class="pass-f"><span>${esc(a)}</span>${b}</div>`).join('')}</div>` : ''}
    ${note ? `<p class="d-note">${I.info}<span>${note}</span></p>` : ''}
    <div class="d-btns${p === 'pc' && k.pc ? ' two' : ''}">
      ${hasCode ? `<button class="btn-primary" id="play-btn" data-action="play" data-id="${c.id}">${I.voice}<span>${t('play')}</span></button>` : ''}
      ${p === 'pc' && k.pc ? `<button class="btn-ghost" data-action="copy" data-v="${esc(k.pc)}">${I.copy}<span>${t('copy')}</span></button>` : ''}
    </div>
    ${how ? `<p class="d-how">${esc(t(how))}</p>` : ''}
    ${others ? `<details class="d-other"><summary><span>${t('other_platforms')}</span>${I.chevron}</summary><div class="plat-list">${others}</div></details>` : ''}
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
  const pbtn = $('#play-btn');
  const setBtn = (on) => { pbtn.innerHTML = on ? `${I.stop}<span>${t('stop')}</span>` : `${I.voice}<span>${t('play')}</span>`; pbtn.classList.toggle('playing', on); };
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
// вариант выбора (онбординг и шторки «Игра», «Платформа»): значок в квадрате, название, подпись
function optHTML(cls, action, v, ico, title, sub = '', mark = '') {
  return `<button class="opt${cls}" data-action="${action}" data-v="${v}"><span class="opt-ico">${ico}</span><span class="opt-m"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${mark ? `<span class="opt-mk">${mark}</span>` : ''}</button>`;
}
function gameListHTML(selected, action, ob = false) {
  const live = GAMES.filter((g) => g.status !== 'soon'), soon = GAMES.filter((g) => g.status === 'soon' && SKINS[g.id]);   // будущие эпохи из тон.md §6 (GTA San Andreas, GTA 4), полными названиями
  // будущие части — одной неактивной строкой (выбрать их и раньше было нельзя)
  return live.map((g) => optHTML(g.id === selected ? ' on' : '', action, g.id, esc(g.title.replace(/^GTA\s*/, '')), esc(g.title), esc(mapPlaceName(g.id)), g.status === 'forecast' ? esc(ob ? t('ob_release') : t('forecast')) : '')).join('')   // онбординг: у GTA 6 дата выхода (концепт v11)
    + (soon.length ? optHTML(' dis', 'noop', soon[0].id, 'SA', esc(soon.map((g) => g.title).join(', ')), esc(t('soon'))) : '');
}
function platListHTML(gameId, selected, action) {
  const g = GAMES.find((x) => x.id === gameId);
  return g.platforms.map((p) => optHTML(`${p === selected ? ' on' : ''}`, action, p, platformIcon(p), esc(L(PLATFORMS[p])), g.platformNote?.[p] ? esc(L(g.platformNote[p])) : '')).join('');
}
function openPickGame() { openSheet(`<h2 class="pick-t">${t('select_game')}</h2><div class="opts">${gameListHTML(store.game, 'set-game')}</div>`, 'sheet-pick'); }
function openPickPlatform() { openSheet(`<h2 class="pick-t">${t('select_platform')}</h2><div class="opts">${platListHTML(store.game, store.platform, 'set-platform')}</div>`, 'sheet-pick'); }

function openHowto() {
  const g = game();
  openSheet(`<h2 class="pick-t">${t('st_howto')}</h2>${g.platforms.map((p) => `<div class="howto"><div class="plat-h">${platformIcon(p)}<span>${L(PLATFORMS[p])}</span></div><p>${esc(howto(p))}</p></div>`).join('')}<p class="d-note">${t('howto_warn')}</p>`, 'sheet-pick');
}
function openAbout() {
  openSheet(`<h2 class="pick-t">${t('st_about')}</h2><p class="about">${t('about_text')}</p>${OWN_ART ? '' : `<p class="about">${esc(t('frames_credit'))}</p>`}<p class="d-note">${esc(data[store.game]?.source || '')}</p><div class="ver">v${esc(APP.version)} · ${window.__vp ? `vp in ${__vp.inner} vh ${__vp.vh} dvh ${__vp.dvh} scr ${__vp.screen} sb ${__vp.safeB}${__vp.standalone ? ' sa' : ''}${__vp.guard ? ' guard' : ''}${__vp.overflow ? ' OVERFLOW' : ''}` : ''}</div>`, 'sheet-pick');
}

// ───────── код после пробного (codelock, концепт v11; 31 §4.2) ─────────
// Название и эффект видны, комбинация размыта под замком «Комбинация — в Pro». Настоящих кнопок в разметке нет —
// под размытием подставные той же длины. «Открыть Pro» → пейвол trial_end; «Сохранить» работает без Pro.
function blurPass(c, p) {
  const k = c.codes || {}, combo = (p === 'playstation' || p === 'xbox') && k[p], fake = ['↑', '→', '↓', '←'];
  if (combo && combo.length) return `<div class="pass-keys">${combo.map((_, i) => { const b = btn(fake[i % 4], p); return `<span class="pk"><span class="${b.cls}">${b.html}</span><i>${i + 1}</i></span>`; }).join('')}</div>`;
  if (p === 'pc' && k.pc) return chars(k.pc.replace(/[a-z0-9]/gi, 'X'), 'pc-code pc-keys');
  return chars((k.phone || '1-999-000-0000').replace(/\d/g, '0'), 'phone-big');
}
function codeLockHTML(c) {
  const fav = store.favs.includes(c.id), p = store.platform;
  const cat = CATEGORIES.find((x) => x.id === c.category);
  const meta = [cat ? L(cat) : '', L(PLATFORMS[p])].filter(Boolean).join(', ');
  const note = c.note ? esc(L(c.note)) : '';
  return `
    <div class="d-head"><h2><span class="d-emoji">${cheatIc(c)}</span>${esc(L(c.name))}</h2></div>
    <p class="d-desc open">${esc(L(c.desc))}</p>
    <div class="pass cl-pass">
      <div class="pass-meta"><span>${esc(meta)}</span></div>
      <div class="pass-cut"></div>
      <div class="d-code cl-blur" aria-hidden="true">${blurPass(c, p)}</div>
      <div class="cl-over"><span class="cl-ic">${I.lock}</span><b>${t('cl_lock')}</b><span>${t(workEnded() ? 'cl_work' : 'cl_trial')}</span></div>
    </div>
    ${note ? `<p class="d-note">${I.info}<span>${note}</span></p>` : ''}
    <div class="cl-btns">
      <button class="btn-primary" data-action="paywall" data-pw="${workEnded() ? '' : 'trial_end'}">${I.lock}<span>${t('open_pro')}</span></button>
      <button class="btn-ghost cl-save${fav ? ' on' : ''}" data-action="cl-save" data-id="${c.id}" aria-pressed="${fav}">${fav ? I.heartFill : I.heart}<span>${t(fav ? 'saved' : 'save')}</span></button>
    </div>`;
}
function openCodeLock(c) { openSheet(codeLockHTML(c), 'sheet-detail sheet-lock'); }

// ───────── карта без Pro: 10 секунд показа за запуск, потом размытие и замок (концепт v11 map:trial; 31 §4.2) ─────────
// Замок — слой поверх вкладки «Карта» (js/map.js не трогаем); шторка места из ссылки открывается над ним.
const mapLock = { t0: 0, timer: 0, paywall: false };
const mapPw = () => (access() === 'trial' ? 'map' : workEnded() ? '' : 'trial_end');
function renderMapLock() {
  let el = $('#map-lock');
  if (ui.tab !== 'map' || access() === 'pro' || document.body.classList.contains('in-ob')) {
    if (el) el.hidden = true;
    clearInterval(mapLock.timer); mapLock.timer = 0; return;
  }
  if (!el) { el = document.createElement('div'); el.id = 'map-lock'; $('#view-map').appendChild(el); }
  el.hidden = false;
  if (!mapLock.t0) mapLock.t0 = Date.now();
  el.innerHTML = `<div class="ml-veil"></div><div class="ml-box"><span class="ml-ic">${I.lock}</span><b id="ml-t"></b><span class="ml-bar"><i id="ml-bar"></i></span>
    <button class="btn-primary" data-action="paywall" data-pw="${mapPw()}">${t('open_pro')}</button></div>`;
  const tick = () => {
    const left = Math.max(0, 10000 - (Date.now() - mapLock.t0)), done = !left;
    el.classList.toggle('done', done);
    $('#ml-t').textContent = t(done ? 'map_locked' : 'map10');
    $('#ml-bar').style.width = ((1 - left / 10000) * 100).toFixed(1) + '%';
    if (done) {
      clearInterval(mapLock.timer); mapLock.timer = 0;
      if (!mapLock.paywall && ui.tab === 'map') { mapLock.paywall = true; openPaywall(mapPw()); }
    }
  };
  tick();
  if (!mapLock.timer && Date.now() - mapLock.t0 < 10000) mapLock.timer = setInterval(tick, 250);
}

// ───────── пейвол: только платные тарифы, 6 состояний (Ресерч 31 §4.5; концепт v11 paywall) ─────────
// trial_end — пробный кончился, нажат код; map — «Карта» в пробном; link — пришёл по ссылке креатора; prerelease — до 19.11;
// renew — до конца пропуска 7 дней; nopay — Россия, Беларусь. Обычный вход (строка пробного, Настройки): до 19.11 —
// prerelease, после — pro. Ни слова о деньгах авторов (tools/check_code.py). Покупка — демо: Pro на устройстве.
let plan = 'year';
const beforeRelease = () => Date.now() < new Date(PAYWALL.release + 'T00:00:00').getTime();
function pwResolve(want) {
  if (noPay()) return 'nopay';
  if (want) return want;
  if (proKind() === 'pass' && proEnds() - Date.now() < 7 * DAY) return 'renew';
  if (gift()) return 'link';
  return beforeRelease() ? 'prerelease' : 'pro';
}
function pwValues() {
  const n5 = data.gta5?.cheats?.length, np = MAP_GAMES.every((g) => placeCounts[g] != null) ? MAP_GAMES.reduce((a, g) => a + placeCounts[g], 0) : 0;
  return [n5 ? tf('pw_v1', { n: n5 }) : t('pw_v1n'), t('pw_v2'), np ? tf('pw_v3', { n: tn(np, 'n_places') }) : t('pw_v3n'), t('pw_v4')]
    .concat(PAYWALL.scouts > 0 ? [tf('pw_scouts', { n: PAYWALL.scouts, m: 0 })] : []);
}
function paywallPanel(st) {
  const Z = zone(), g = gift();
  const head = st === 'renew' ? tf('pw_h_renew', { d: dlong(proEnds()) }) : t('pw_h_' + (st === 'link' ? 'pro' : st));
  const lead = st === 'renew' ? tf('pw_l_renew', { p: usd(Z.pass), y: usd(Z.year) }) : t('pw_l_' + (st === 'link' ? 'pro' : st));
  if (!Z.month && plan === 'month') plan = 'year';
  const card = (id, title, sub, best) => `<button class="plan pw-plan${plan === id ? ' on' : ''}" data-action="plan" data-v="${id}" aria-pressed="${plan === id}">
      <span class="plan-n"><b>${esc(title)}${best ? `<em>${esc(best)}</em>` : ''}</b><small>${esc(sub)}</small></span></button>`;
  const buy = st === 'nopay'
    ? `<button class="btn-primary pw-cta" data-action="pw-partner">${t('pw_partner')}</button>`
    : `<div class="plans">${card('year', tf('pw_year', { p: usd(Z.year) }), tf('pw_year_s', { m: usd(Math.round(Z.year / 12 * 100) / 100) }), t('pw_best'))}${card('pass', tf('pw_pass', { p: usd(Z.pass) }), t('pw_pass_s'))}</div>
      ${Z.month ? `<button class="pw-month${plan === 'month' ? ' on' : ''}" data-action="plan" data-v="month" aria-pressed="${plan === 'month'}">${esc(tf('pw_month', { p: usd(Z.month) }))}</button>` : ''}
      <button class="btn-primary pw-cta" data-action="buy">${t('pw_cta')}</button>`;
  return `<h1 class="pw-title${head.length > 24 ? ' pw-long' : ''}">${esc(head)}</h1>
    <p class="pw-lead">${esc(lead)}</p>
    <ul class="pw-feat">${pwValues().map((x) => `<li>${I.check}<span>${esc(x)}</span></li>`).join('')}</ul>
    ${g && st !== 'nopay' ? `<p class="pw-gift">${I.gift}<b>${esc(tf('pw_gift', { n: g.from }))}</b></p>` : ''}
    ${buy}
    <div class="pw-links"><button data-action="buy">${t('pw_restore')}</button><button data-action="noop">${t('pw_terms')}</button><button data-action="noop">${t('pw_privacy')}</button></div>
    <p class="pw-fine">${t(st === 'nopay' ? 'pw_fine_np' : 'pw_fine')}</p>
    <p class="pw-demo">${t('pw_demo')}</p>`;
}
// вещь из ссылки — стеклянная карточка наверху, видна и без Pro (тап — это место)
async function pwThing(pw) {
  const k = giftKey(); if (!k) return;
  const o = await findByKey(k).catch(() => null); if (!o || !pw.classList.contains('open')) return;
  const img = thumbOf(o, 'real');
  const el = pw.querySelector('.pw-thing'); if (!el) return;
  el.innerHTML = `${img ? `<img src="${esc(img)}" alt="" decoding="async">` : `<span class="pt-ph">${I.pin}</span>`}<span class="pt-t"><b>${esc(realName(o))}</b><small>${t('pw_thing')}</small></span>`;
  el.hidden = false;
}
let pwSt = 'pro';
function openPaywall(want) {
  const st = pwResolve(want);
  const pw = $('#paywall');
  const key = store.game + '|' + getLang() + '|' + st;
  // выбор срока перерисовывает только панель: фото не мигает
  if (pw.classList.contains('open') && pw.dataset.k === key) { pw.querySelector('.pw-panel').innerHTML = paywallPanel(st); return; }
  pwSt = st; pw.dataset.k = key; pw.dataset.st = st;
  pw.innerHTML = `
    <div class="pw-photo">${pic(HERO[store.game]?.load, '', 860, 1864)}</div>
    <button class="pw-close" data-action="pw-close" aria-label="${esc(t('close'))}">${I.close}</button>
    ${giftKey() && st !== 'nopay' ? '<button class="pw-thing" data-action="pw-thing" hidden></button>' : ''}
    <div class="pw-panel">${paywallPanel(st)}</div>`;
  pw.scrollTop = 0;
  pw.classList.add('open');
  pw.querySelector('.pw-close').classList.remove('show');
  setTimeout(() => pw.querySelector('.pw-close')?.classList.add('show'), 900);
  pwThing(pw);
  // живые счётчики: коды GTA 5 — сразу (25 КБ); места — только уже загруженных игр (данные карты 1–2 МБ ради подписи не качаем)
  if (!data.gta5) loadGame('gta5').then(() => { if (pw.classList.contains('open') && pw.dataset.k === key) pw.querySelector('.pw-panel').innerHTML = paywallPanel(st); }).catch(() => { });
}
function closePaywall() { $('#paywall').classList.remove('open'); maybeInstallHint(); }
// демо-покупка: срок как у настоящей (пропуск до 19.11 считается с 19.11 — 31 §4.4); настоящая — Paddle / покупки Apple (сервер)
function demoBuy() {
  const now = new Date(), d = new Date(Math.max(now.getTime(), plan === 'pass' && beforeRelease() ? new Date(PAYWALL.release + 'T00:00:00').getTime() : 0));
  if (plan === 'year') d.setFullYear(d.getFullYear() + 1); else d.setMonth(d.getMonth() + (plan === 'pass' ? 3 : 1));
  Object.assign(store, { pro: true, proPlan: plan, proUntil: d.getTime() }); save();
}

// ───────── онбординг: три экрана (32 §3.7, концепт v11): обещание → игра → платформа ─────────
// Один тап по варианту = выбор и сразу дальше. Пейвола в онбординге нет (пробный доступ уже идёт); «Просто смотрю» — на карту.
let obBusy = false; // защита от двойного тапа во время перехода
function obDefaultPlatform(gameId) {
  const g = GAMES.find((x) => x.id === gameId);
  return g.platforms.includes(store.platform) ? store.platform : g.platforms[0];
}
// экран 1 «Обещание»: фото эпохи и стеклянная панель снизу, в зоне большого пальца
function welcomeHTML() {
  return `<span class="ob-mark"><img src="icons/favicon.svg" alt="" width="40" height="40"></span>
    <h1>${t('w_title')}</h1>
    <p class="ob-lead">${t('w_sub')}</p>
    <ul class="ob-ticks">${['w_f1', 'w_f2', 'w_f3'].map((k) => `<li>${I.check}<span><b>${t(k)}</b></span></li>`).join('')}</ul>
    ${access() === 'trial' ? `<div class="o-trial">${I.clock}<span>${esc(tf('trial_left', { t: trialLeft() }))}</span></div>` : ''}
    <button class="btn-primary ob-cta" data-action="ob-start">${t('next')}</button>
    <p class="ob-fine">${t('w_note')}</p>`;
}
function renderOnboarding(dir = 0) {
  const ob = $('#onboarding');
  const step = ui.obStep;
  const g = ui.obGame || store.game;
  // скин: до выбора игры — GTA 6, на шаге платформы — выбранной игры; фото — «Привет» баннер, дальше «вид» (без анимации смены игры)
  const sk = step === 'platform' ? g : 'gta6';
  applySkin(sk);
  const img = step === 'welcome' ? HERO.gta6.banners[0] : HERO[sk]?.load;
  if (!ob.querySelector('.ob-photo')) ob.innerHTML = '<div class="ob-photo"></div><div class="ob-ui"></div>';
  const ph = ob.querySelector('.ob-photo');
  if (ph.dataset.src !== img) { ph.dataset.src = img; ph.classList.toggle('is-banner', step === 'welcome'); ph.innerHTML = step === 'welcome' ? pic(img) : pic(img, '', 860, 1864); }
  const anim = dir > 0 ? ' ob-in-right' : dir < 0 ? ' ob-in-left' : '';
  if (step === 'welcome') { ob.querySelector('.ob-ui').innerHTML = `<div class="ob-panel wl${anim}">${welcomeHTML()}</div>`; return; }
  const isGame = step === 'game';
  ob.querySelector('.ob-ui').innerHTML = `
    <button class="ob-back" data-action="ob-back" aria-label="${esc(t('back'))}">${I.back}</button>
    <div class="ob-panel${anim}">
      <div class="ob-prog" aria-label="${isGame ? 1 : 2} / 2"><i class="on"></i><i${isGame ? '' : ' class="on"'}></i></div>
      <h1>${isGame ? t('ob_game_title') : t('ob_platform_title')}</h1><p class="ob-lead">${isGame ? t('ob_game_sub') : t('ob_plat_sub')}</p>
      <div class="opts">${isGame ? gameListHTML(g, 'ob-game', true) : platListHTML(g, ui.obPlatform, 'ob-platform') + optHTML('', 'ob-watch', 'watch', I.map, esc(t('ob_watch')), esc(t('ob_watch_s')))}</div>
      <button class="btn-primary ob-cta" data-action="ob-next">${isGame ? t('next') : t('start')}</button>
    </div>`;
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
async function finishOnboarding(tab = 'home') {
  store.game = ui.obGame; store.platform = ui.obPlatform; store.onboarded = true; save();
  try { await loadGame(store.game); } catch { /* нет сети при первом запуске — данные подгрузятся позже, не держим на онбординге */ }
  document.body.classList.remove('in-ob');
  ui.tab = tab; ui.cat = DEFAULT_CATEGORY;
  renderAll();
  if (tab === 'home') maybeInstallHint();   // на карте подсказка закрыла бы замок карты
  checkTrialEnd();
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
    if (navigator.share) { await navigator.share({ title: APP.shortName, text, url: location.href.split('#')[0] }); return; }
  } catch { return; }
  try { await navigator.clipboard.writeText(text + '\n' + location.href.split('#')[0]); toast(t('link_copied')); } catch { }
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

// смена игры приложения (Главная, Настройки): данные грузятся сразу, экран перерисовывается под слоем анимации
function changeGame(v, fromSheet = false) {
  store.game = v;
  const g = game(); if (!g.platforms.includes(store.platform)) store.platform = g.platforms[0];
  save();
  switchTo(v, { prepare: () => loadGame(v), apply: () => { if (fromSheet) closeSheet(); renderAll(); }, haptic });
}
// бета: игру на карте меняет сама карта (data-mp="game", map.js) — слой смены идёт поверх, скин за картой
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-mp="game"]');
  const v = el?.dataset.v;
  if (!v || v === ui.mapGame || ui.tab !== 'map') return;
  ui.mapGame = v;
  switchTo(v, { haptic });
}, true);

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
    case 'share-app': shareText(t('share_app_text')); break;
    case 'copy': try { await navigator.clipboard.writeText(v); toast(t('copied')); } catch { } break;
    case 'play': play(id); break;
    case 'desc': el.classList.toggle('open'); break;   // описание кода в шторке — одной строкой, по тапу целиком
    case 'plat': case 'pick-platform': haptic(); openPickPlatform(); break;
    case 'pick-game': haptic(); openPickGame(); break;
    case 'set-game': {
      if (v === store.game) { closeSheet(); break; }   // та же игра — без анимации
      haptic(); changeGame(v, true); break;
    }
    case 'set-platform': haptic(); store.platform = v; save(); closeSheet(); renderAll(); break;
    case 'sheet-close': closeSheet(); break;
    case 'open-cheats': {
      // из карточки места на карте («Читы на оружие»): шторку карты закрыть и показать коды игры этого места
      // (до 21.10.2026 карточка оставалась поверх экрана кодов, а коды были текущей игры приложения — тест 21.10)
      haptic(); closeSheet();
      if (el.dataset.cat) ui.cat = el.dataset.cat;
      const g = el.dataset.game;
      if (g && g !== store.game && GAMES.some((x) => x.id === g)) {
        store.game = g;
        const g2 = game(); if (!g2.platforms.includes(store.platform)) store.platform = g2.platforms[0];
        save(); await loadGame(g);
      }
      ui.tab = 'cheats'; renderAll(); setTimeout(() => scrollToCat(ui.cat, false), 0); break;
    }
    case 'back-home': haptic(); ui.tab = 'home'; renderAll(); break;
    case 'hub-game': {
      if (v === store.game) break;
      haptic(); changeGame(v); break;
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
    case 'map-game': {
      // игра карты (не приложения): анимация смены, под слоем — один setGame, карту заново не создаём
      if (el.classList.contains('on') || v === ui.mapGame) break;
      haptic(); ui.mapGame = v;
      switchTo(v, { prepare: mapMod, apply: () => mapMod().then((m) => m.setGame(v)).catch(() => toast(t('map_error'))), haptic });   // слой — в том же кадре, что и тап
      break;
    }
    case 'map-locate': haptic(); (await mapMod()).locate(); break;
    case 'map-fit': haptic(); (await mapMod()).refit(); break;
    case 'hint': ui.query = el.dataset.q; $('#search-input').value = ui.query; renderSearch(); break;
    case 'search-clear': ui.query = ''; $('#search-input').value = ''; renderSearch(); $('#search-input').focus(); break;
    case 'theme': store.theme = v; save(); applyTheme(); renderSettings(); mapMod().then((m) => m.retheme()); break;
    case 'maps-app': haptic(); store.mapsApp = v; save(); renderSettings(); break;
    case 'lang': store.lang = v; save(); setLang(v); renderAll(); mapMod().then((m) => m.relang()); if (crLoaded) crMod().then((m) => m.relang()).catch(() => { }); break;
    case 'haptic-toggle': store.haptic = !store.haptic; save(); haptic(); renderSettings(); break;
    case 'howto': openHowto(); break;
    case 'about': openAbout(); break;
    case 'rate': toast(t('rated')); break;
    case 'reset': {   // «Начать заново»: демо-Pro снят, пробный — заново с этого момента
      ui.stopPlay?.(); Object.assign(store, { ...DEFAULTS, lang: store.lang, theme: store.theme, trialStart: Date.now(), linkKeys: [] }); save();
      Object.assign(mapLock, { t0: 0, paywall: false }); clearInterval(mapLock.timer); mapLock.timer = 0;
      closeSheet(); closePaywall(); $('#install').classList.remove('show'); lastAccess = access(); showOnboarding(); renderMapLock(); break;
    }
    case 'paywall': haptic(); closeSheet(); openPaywall(el.dataset.pw || ''); break;
    case 'plan': plan = v; haptic(); openPaywall(pwSt); $('#paywall .pw-close').classList.add('show'); break;
    case 'buy': demoBuy(); haptic(); closePaywall(); toast(t('pro_unlocked')); onAccess(); renderAll(); break;
    case 'pw-close': closePaywall(); break;
    case 'pw-partner': closePaywall(); window.SB.becomePartner(); break;
    case 'pw-thing': { const k = giftKey(); closePaywall(); if (k) openOnMap(k); break; }
    case 'cl-save': {   // «Сохранить» у кода с замком — без Pro
      haptic(); const i = store.favs.indexOf(id), on = i < 0; if (on) store.favs.push(id); else store.favs.splice(i, 1);
      save(); refreshFavUI(); el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); el.innerHTML = `${on ? I.heartFill : I.heart}<span>${t(on ? 'saved' : 'save')}</span>`;
      break;
    }
    case 'ob-watch': haptic(); obPickThen(el, () => finishOnboarding('map')); break;
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
// шапка Главной: над фото — прозрачная, когда фото уехало — сжимается в полосу на стекле
(() => {
  const hb = $('#home-body'), hdr = $('#hub-hdr'); let raf = 0;
  const upd = () => { raf = 0; const hero = $('#home-hero .hero'); const lim = hero ? hero.offsetHeight - hdr.offsetHeight - 24 : 40; hdr.classList.toggle('is-solid', hb.scrollTop > lim); };
  hb.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
})();
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
  // пробный доступ: 72 часа с первого открытия на устройстве (если сервер не дал trial_until)
  if (!store.trialStart) { store.trialStart = Date.now(); save(); }
  // профиль SB.api: доступ (Pro, рабочий Pro, пробный, подарок, страна). Источник выбирает js/api.js: закрытый доступ на
  // устройстве (новый человек — гость), demo для съёмки (включает экран «Для админов»), ?sbmock — только на localhost
  const apiP = import('./api.js').then(() => { const api = window.SB.api; return api && (!api.isMock || api.useProfile || api.mockChosen) ? api.getProfile() : null; }).catch(() => null);
  const [P] = await Promise.all([apiP, loadGame(store.game).catch(() => { })]);
  acc.P = P; lastAccess = access();
  renderAll();
  // ссылка «поделиться местом» (…/?open=place:gta5:<id>): друг сразу видит это место (и без Pro); знакомство — в следующий раз
  const openKey = new URLSearchParams(location.search).get('open');
  if (openKey) { store.linkKeys = [openKey, ...store.linkKeys.filter((k) => k !== openKey)].slice(0, 5); save(); history.replaceState(null, '', location.pathname); openOnMap(openKey); }
  else if (/[?&#]admin\b/.test(location.search + location.hash)) {   // экран «Для админов» (только веб): ?admin или #admin
    store.onboarded = true; save(); if (location.hash) history.replaceState(null, '', location.pathname + location.search); window.SB.openCreator('admin');
  }
  else if (!store.onboarded) showOnboarding();
  document.body.classList.add('ready');
  requestAnimationFrame(guardTabbar);
  checkTrialEnd();
  // таймер пробного: строка «ещё …» и конец пробного без перезапуска
  setInterval(() => { if (access() !== lastAccess || access() === 'trial') onAccess(); }, 30000);
})();
