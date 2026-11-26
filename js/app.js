// Чит-коды GTA — демо PWA.
// Архитектура как у Cheats Pro: онбординг (игра → платформа) → пейвол →
// 4 вкладки (Главная / Поиск / Избранное / Настройки) → шторка чита.

import { APP, CATEGORIES, DEFAULT_CATEGORY, PLATFORMS, GAMES, PAYWALL, HERO, OWN_ART, GTA6 } from './config.js';
import * as pay from './pay.js';
import * as ref from './ref.js';
import { t, tn, L, setLang, getLang, SPEAK, credit } from './i18n.js';
import { I, platformIcon, comboHTML, btn, balanceCombos } from './icons.js';
import { SKINS, switchTo } from './skin.js';
import { loadPlaces, loadedPlaces, MAP_GAMES, placeKey, parseKey, findByKey, featured, isNew, loadNews, newsUpdated, refreshPlaces, newOnMap, hasPhoto, placesNow, newsNow, imgUrl, searchPlaces, realName, realSub, cityOf, thumbOf, catLabel, catIcon, CAT_LABELS, CONF } from './places.js';

// ───────── хранилище ─────────
const KEY = 'cheats.v1';
// pro / proPlan / proUntil — демо-покупка на устройстве; trialStart — первое открытие (пробный 72 часа, 31 §4.2);
// linkKeys — места, открытые по ссылке «поделиться»: видны и без Pro (31 §4.2, «одна вещь из ссылки»)
const DEFAULTS = { onboarded: false, game: 'gta6', g6: 0, platform: 'playstation', favs: [], favPlaces: [], recent: [], pro: false, proPlan: null, proUntil: 0, trialStart: 0, trialEndSeen: false, linkKeys: [], theme: 'dark', lang: null, haptic: true, installHint: false, mapsApp: 'google', ftUntil: 0, tourMap: false, tourCodes: false, platByGame: {} };
const store = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { }
  const st = { ...DEFAULTS, ...s };
  if (s.onboarded && s.tourMap === undefined) st.tourMap = st.tourCodes = true;   // знакомство 22.11.2026 — только новым
  return st;
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { } }

// ───────── состояние экрана ─────────
const ui = { mapGame: null, mapPrefer: null, prevTab: 'home', tab: 'home', cat: DEFAULT_CATEGORY, query: '', obStep: 'game', obGame: null, obPlatform: null, stopPlay: null };
const data = {}; // gameId -> {cheats, ...}

const $ = (sel, root = document) => root.querySelector(sel);
const mapMod = () => import('./map.js');
// экраны креаторов (js/league.js, данные — window.SB.api из js/api.js): раздел «Авторам и партнёрам» — строкой в Настройках,
// сам хаб открывается отдельным экраном (Fable 23.11.2026, вариант B); слой Лиги
const crMod = () => import('./league.js');
const guideMod = () => import('./guide.js');   // инструкция «По шагам» (26.11.2026) — грузится при первом открытии
const walkMod = () => import('./walk.js');   // «Прохождение» и общая шторка «Где вы в игре» (26.11.2026, «Гид по игре»)
const crCtx = () => ({ openSheet, closeSheet, toast, haptic, openOnMap, game: () => store.game, isFav: (k) => isFavPlace(k), toggleFav: (k) => toggleFavPlace(k), onProfile: setProfile });
let crLoaded = false;   // модуль грузится при первом заходе в Настройки или по вызову экрана креатора — не на старте
// вход для сессии карты: кнопка «Ролики об этом месте» в карточке места вызывает window.SB.openPlaceVideos(игра, id места)
window.SB = window.SB || {};
// после первого экрана: страница загрузилась, + пауза, + простой браузера (фоновое не мешает Главной)
function afterFirstScreen(fn, delay = 0) {
  const go = () => setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(() => fn(), { timeout: 3000 }) : fn()), delay);
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}
// после главного фото Главной (или 3 с, если его нет/долго) + простой
function afterHero(fn, delay = 0) {
  let done = false;
  const go = () => { if (done) return; done = true; setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(() => fn(), { timeout: 1500 }) : fn()), delay); };
  const img = $('#home-hero .hero-slide img[src]');
  if (!img || (img.complete && img.naturalWidth)) go();
  else { img.addEventListener('load', go, { once: true }); img.addEventListener('error', go, { once: true }); }
  setTimeout(go, 3000);
}
// Прогрев карты (Игорь 23.11.2026; контракт с онбордингом): библиотека, данные мест, стиль и плитки стартового вида
// «Игра», затем «Жизнь» — в фоне, без показа. → Promise<{ game, life }>. Повторный вызов той же игры — тот же Promise.
// Экономия трафика в системе (Save-Data) — не греем. Открыли настоящую карту — прогрев уступает ей (map.js warmStop).
const warmP = {};
let swAfterWarm = null;   // первая регистрация SW ждёт прогрева (init)
// фото эпох обеих игр для офлайна (sw.js uiPrecache) — после прогрева карты, чтобы не отнимать канал у первого экрана и карты
const warmUI = () => { try { navigator.serviceWorker?.controller?.postMessage('warm-ui'); } catch { } };
window.SB.prewarmMap = (g = MAP_OF(store.game)) => {
  if (navigator.connection?.saveData) return Promise.resolve({ game: false, life: false });
  window.SB.prewarmMap.ready = warmP[g] ||= mapMod().then((m) => m.prewarm(g)).catch(() => ({ game: false, life: false }))
    .then((r) => { if (!r.game && !r.life) delete warmP[g]; swAfterWarm?.(); if (r.game && r.life && !r.byMap) setTimeout(warmUI, 4000); return r; });   // не вышло (нет сети) — следующий вызов попробует снова   // карта открылась раньше — фото позже (sb:map-idle)
  return window.SB.prewarmMap.ready;
};
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
// с оплатой (PAY.api) Pro — только ответ сервера (js/pay.js); store.pro — демо-покупка, пока оплаты нет
// демо-покупка (Pro без оплаты) — только на localhost, в «демо для съёмки» (sb.demo) и у тестов (sb.demopay). В проде, пока
// оплата не включена для всех, «Оформить» Pro не даёт (Игорь 19.11.2026: «пропустило в карту без оплаты»)
const demoPay = () => { try { return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || localStorage.getItem('sb.demopay') === '1' || localStorage.getItem('sb.demo') === '1'; } catch { return false; } };
const demoPro = () => !pay.enabled() && demoPay() && !!store.pro;
// «Попробовать 3 дня бесплатно» на пейволе (Игорь 22.11.2026): полный доступ с картой на 72 часа, один раз на устройство
const freeUntil = () => store.ftUntil || 0;
const canTryFree = () => !store.ftUntil && !hasPaid();
function hasPaid() { const now = Date.now(); return demoPro() || pay.proActive() || paidUntil() > now || workUntil() > now; }
function hasPro() { const now = Date.now(); return freeUntil() > now || demoPro() || pay.proActive() || paidUntil() > now || workUntil() > now; }
function proKind() {
  const now = Date.now();
  if (pay.proActive()) return pay.pro().plan || 'year';
  if (demoPro()) return store.proPlan || 'year';
  if (paidUntil() > now) return acc.P.pro_kind || 'year';
  if (workUntil() > now) return 'work';
  return freeUntil() > now ? 'free' : null;
}
function proEnds() { const k = proKind(); return k === 'free' ? freeUntil() : k === 'work' ? workUntil() : pay.proActive() ? pay.pro().until : demoPro() ? store.proUntil : paidUntil(); }
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
const usdS = (v) => (Number.isInteger(v) ? '$' + v : usd(v));   // цена промокода: «$1», а не «$1,00»
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
// фото в карточке, просмотре и на Главной не загрузилось — прячем значок битой картинки, пишем «Фото не загрузилось» (QA 20.11.2026)
document.addEventListener('error', (e) => {
  const im = e.target;
  if (im?.tagName !== 'IMG' || !im.closest('#sheet-body, #mp-viewer, #main') || im.closest('#map')) return;
  im.classList.add('img-fail');
  const box = im.parentElement; if (box && !box.classList.contains('img-fail-box') && box.offsetWidth > 120) { box.classList.add('img-fail-box'); box.dataset.nf = t('photo_nf'); }
}, true);
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
  // от высоты НАШЕГО каркаса (body = --app-h), а не innerHeight: в установленном приложении (standalone) каркас — 100vh
  // на весь экран, а innerHeight с клавиатурой может уменьшаться вместе с visualViewport — тогда разница была 0
  // и шторка оставалась под клавиатурой (Игорь 28.10: «в браузере работает, в установленном — нет»)
  const frame = document.body.clientHeight || window.innerHeight;
  const kb = Math.max(0, Math.round(frame - vv.height - Math.max(0, vv.offsetTop)));
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
// в установленном приложении iOS не всегда присылает resize от visualViewport — пока клавиатура выезжает, меряем сами
addEventListener('focusin', (e) => {
  if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)) return;
  [60, 200, 350, 500, 700, 1000, 1400].forEach((ms) => setTimeout(kbInset, ms));
});
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

// фото показано (или не пришло) — скелетон под ним больше не нужен (css/hub.css «Скелетоны»)
const imgDone = (e) => { if (e.target?.tagName === 'IMG') e.target.classList.add('ok'); };
document.addEventListener('load', imgDone, true); document.addEventListener('error', imgDone, true);

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
    <div class="fc-text"><div class="fc-title">${d > 0 ? t('release_in').replace('{d}', date) : t('released')}</div><div class="fc-sub">${t(d > 0 ? 'forecast_banner' : 'forecast_banner_out')}</div></div>
  </div>`;
}
const POPULAR = {
  gta5: ['invincible', 'weapons', 'health', 'wanted_down', 'buzzard', 'superjump', 'sanchez', 'weather'],
  gta6: ['g6_money', 'g6_armor', 'g6_max_ammo', 'g6_weather', 'g6_inf_ammo', 'g6_boomazoom', 'g6_focus', 'g6_no_reload'],   // настоящие коды GTA 6 (18.11.2026)
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
  return `<div class="pcard${hasGuide(o) ? ' has-how' : ''}" data-action="${hasGuide(o) ? 'open-guide' : 'open-place'}" data-key="${esc(key)}" role="button" tabindex="0">
    ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pc-ph">${o.kind === 'egg' ? I.egg : I[catIcon(o.c)]}</span>`}
    <span class="pc-grad"></span>
    <span class="pc-tags">${isNew(o) ? `<i class="tag-new">${t('news_new')}</i>` : ''}${o.kind === 'egg' ? `<i class="tag-egg">${t('map_egg')}</i>` : `<i class="conf conf-${o.cf}">${t('conf_' + o.cf)}</i>`}${opt.game ? `<i class="tag-game">${GAMES.find((g) => g.id === o.game)?.title || ''}</i>` : ''}</span>
    <button class="pc-fav${fav ? ' on' : ''}" data-action="fav-place" data-key="${esc(key)}" aria-label="${esc(t('save'))}">${fav ? I.heartFill : I.heart}</button>
    <span class="pc-txt"><b>${esc(hasGuide(o) ? guideTitle(o) : realName(o))}</b>${hasGuide(o) ? `<small>${esc(guideMeta(o))}</small>` : o.kind === 'egg' ? (realSub(o) ? `<small>${esc(realSub(o))}</small>` : '') : `<small>${I.pin}${esc(cityOf(o) || realSub(o))}</small>`}</span>
  </div>`;
}
// ── Разделы «Новости», «Новое на карте», «Пасхалки» (Игорь 23.11.2026: «чтобы видели новости и события в реальном времени») ──
// подпись кадра — коротко «© Rockstar Games» на любом языке (без «официальный скриншот …»: русский в EN)
const creditShort = (c) => String(c || '').split('·')[0].trim();
function agoText(iso) {
  const ms = Date.parse(iso || ''); if (!ms) return '';
  const m = Math.max(0, Math.round((Date.now() - ms) / 6e4));
  if (m < 1) return t('upd_now');
  if (m < 60) return tf('upd_min', { n: m });
  const h = Math.round(m / 60); if (h < 24) return tf('upd_h', { n: h });
  return tf('upd_d', { n: Math.round(h / 24) });
}
const newsOf = async () => (await loadNews()).filter((n) => n.game === store.game).sort((a, b) => String(b.date).localeCompare(String(a.date)));
const eggsNewFirst = (pd) => pd.eggs.slice().sort((a, b) => (guideDone(b) >= 0 && hasGuide(b)) - (guideDone(a) >= 0 && hasGuide(a)) || isNew(b) - isNew(a) || hasGuide(b) - hasGuide(a) || String(b.dt || '').localeCompare(String(a.dt || '')) || hasPhoto(b) - hasPhoto(a));
// строка новости на экране «Все»: кадр, дата, заголовок, источник; тап — шторка
function newsRow(n) {
  const img = n.img ? imgUrl(n.img.thumb || n.img.file) : '';
  return `<div class="prow nrow" data-action="open-news" data-id="${esc(n.id)}" role="button" tabindex="0">
    <span class="pr-th nr-th">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pr-ph">${I.egg}</span>`}</span>
    <span class="pr-t"><small class="nr-date">${esc(newsDate(n.date))}</small><b>${esc(L(n.t))}</b><small>${esc((n.src || []).join(', '))}</small></span>
  </div>`;
}
// ── Инструкция «По шагам» (26.11.2026, «Гид по игре»; решение Fable — «Гид по игре — пасхалки (26.11.2026)/02»):
// пасхалка с полем how открывает свой экран (js/guide.js) — из ленты, Новостей, карты и по ссылке guide:<игра>:<id>
const hasGuide = (o) => !!o?.how?.st?.length;
function guideDone(o) {   // сколько шагов пройдено (прогресс на телефоне, sb.gd); -1 — не начинали
  try { const p = JSON.parse(localStorage.getItem('sb.gd') || '{}')[`${o.game}:${o.id}`]; if (!p) return -1; return o.how.st.filter((x) => (p.d || []).includes(x.id)).length; } catch { return -1; }
}
function guideMeta(o) {
  const n = o.how.st.length, d = guideDone(o);
  if (d >= 0 && d < n) return tf('g_cont', { n: d + 1, m: n });
  return o.how.min ? tf('g_meta', { s: tn(n, 'n_steps'), m: o.how.min }) : tn(n, 'n_steps');
}
const guideTitle = (o) => L(o.how?.ta) || L(o.t);
const guideDate = (d) => { const x = Date.parse((d || '') + 'T12:00:00Z'); return x ? new Date(x).toLocaleDateString(getLang(), { day: 'numeric', month: 'long' }) : ''; };
function guideCtx(g, from, linked, shareKey, onClose) {
  return {
    lang: getLang(), I, from, linked, access, haptic, toast, date: guideDate, imgUrl, credit,
    paywall: () => openPaywall(mapPw()),
    share: (x) => shareText(`${guideTitle(x)} — ${APP.shortName}\n${location.origin}${location.pathname}?open=${shareKey(x)}`),
    event: (n, d) => { try { window.SB?.track?.(n, d); } catch { } },
    onClose: onClose || (() => { if (ui.tab === 'feed') renderFeed(); else if (ui.tab === 'home') renderHub(); }),
  };
}
async function openGuideKey(key, from = '', linked = false) {
  const { kind, game: g, id } = parseKey(key.replace(/^guide:/, 'egg:'));
  const o = kind === 'egg' ? await findByKey(`egg:${g}:${id}`) : null;
  if (!hasGuide(o)) { openOnMap(key.replace(/^guide:/, 'egg:')); return; }
  closeSheet();
  const m = await guideMod();
  m.openGuide({ ...o, game: g }, guideCtx(g, from, linked || store.linkKeys.includes(`guide:${g}:${id}`) || store.linkKeys.includes(`egg:${g}:${id}`), (x) => `guide:${g}:${x.id}`));
}
window.SB.openWalk = (from = 'sb') => openWalk(from);   // для оглавления гида и тестов
// ядро гида: ключ walk:gta6[:<подсказка>] открывает «Прохождение» (и сразу подсказку); таблицу ключей ведёт сборщик (guide-core)
let core = null;
import('./guide-core.js').then((m) => { core = m; m.registerOpener('walk', (k) => openWalk('key', k.game || 'gta6', k.id || '')); }).catch(() => { });
const posCtx = () => ({ lang: getLang(), I, haptic, event: (n, d) => { try { window.SB?.track?.(n, d); } catch { } },
  // строки guide-progress в шторке «Где вы в игре»: подключаются, когда в сборке есть js/progress.js (ветка feature/guide-progress)
  mountProgress: window.SB.hasProgress ? (el, o) => import('./progress.js').then((m) => m.mountRows(el, { ...o, platform: store.platform })) : null });
window.SB.pickPos = (opts = {}) => walkMod().then((w) => w.pickPos(posCtx(), store.game, opts));   // общая шторка «Где вы в игре»
// ── «Прохождение» (js/walk.js): игрок отмечает последнюю миссию, экран показывает подсказки «перед миссией» (инструкции «По шагам»)
async function openWalk(from = '', g = 'gta6', tipId = '') {
  closeSheet();
  const w = await walkMod();
  const leave = (fn) => { w.closeWalk(); setTimeout(fn, 80); };   // сначала снять экран и его запись истории, потом переход
  const ok = await w.openWalk({
    lang: getLang(), I, from, haptic, toast, event: (n, d) => { try { window.SB?.track?.(n, d); } catch { } },
    done: (o) => Math.max(0, guideDone(o)),
    openTip: async (o) => (await guideMod()).openGuide(o, guideCtx(g, 'walk', false, (x) => `walk:${g}:${String(x.id).replace(/^walk-/, '')}`, () => w.refresh())),
    openPlace: (k) => leave(() => openOnMap(k)),
    openFeed: (v) => leave(() => { ui.feed = v; ui.tab = 'feed'; renderAll(); }),
    openCheats: () => leave(() => { ui.tab = 'cheats'; renderAll(); }),
    // ключи «Дальше» (решение Fable: одна таблица ?open= будет в js/guide-core.js у сборщика; здесь — то, что есть в этой ветке)
    can: (k) => /^guide:(gta6|gta5):/.test(k) || !!core?.hasOpener?.(String(k).split(':')[0]),
    openKey: (k) => { if (/^guide:(gta6|gta5):/.test(k)) leave(() => openGuideKey(k, 'walk')); else leave(() => core?.openKey(k, { from: 'walk' })); },
    onClose: () => { if (ui.tab === 'home') renderHub(); },
  }, g, tipId);
  if (!ok) toast(t('place_nf'));
}
// строка пасхалки: кадр, название, настоящее место, кнопка «На карте»; с инструкцией — заголовок-действие, «10 шагов, около 40 минут», «По шагам»
function eggRow(o) {
  if (hasGuide(o)) {
    const key = placeKey(o), img = thumbOf(o, 'game') || thumbOf(o, 'real');
    return `<div class="prow erow has-how" data-action="open-guide" data-key="${esc(key)}" role="button" tabindex="0">
    <span class="pr-th">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pr-ph">${I.egg}</span>`}</span>
    <span class="pr-t">${isNew(o) ? `<small class="nr-date">${esc(t('news_new'))}</small>` : ''}<b>${esc(guideTitle(o))}</b><small>${esc(guideMeta(o))}</small></span>
    <button class="er-map" data-action="open-guide" data-key="${esc(key)}">${I.doc}<span>${esc(t('g_btn'))}</span></button>
  </div>`;
  }
  const key = placeKey(o), img = thumbOf(o, 'game');
  return `<div class="prow erow" data-action="open-place" data-key="${esc(key)}" role="button" tabindex="0">
    <span class="pr-th">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pr-ph">${I.egg}</span>`}</span>
    <span class="pr-t">${isNew(o) ? `<small class="nr-date">${esc(t('news_new'))}</small>` : ''}<b>${esc(L(o.t))}</b><small>${esc(realName(o))}</small></span>
    <button class="er-map" data-action="open-place" data-key="${esc(key)}">${I.pin}<span>${esc(t('on_map'))}</span></button>
  </div>`;
}
let feedSeq = 0;
async function renderFeed() {
  if (ui.tab !== 'feed') return;
  const my = ++feedSeq, k = ui.feed || 'news';
  $('#feed-title').textContent = t({ news: 'hub_news', eggs: 'hub_eggs', newmap: 'hub_newmap' }[k] || 'hub_news');
  let html = '';
  if (k === 'news') {
    const list = await newsOf(), ago = agoText(newsUpdated());
    html = (ago ? `<p class="feed-upd">${esc(ago)}</p>` : '') + list.map(newsRow).join('');
  } else if (MAP_GAMES.includes(store.game)) {
    const pd = await loadPlaces(store.game);
    html = k === 'eggs' ? eggsNewFirst(pd).map(eggRow).join('') : newOnMap(pd).map((o) => placeRow(o)).join('');
  }
  if (my !== feedSeq) return;
  $('#feed-body').innerHTML = html || `<div class="empty">${esc(t('feed_empty'))}</div>`;
}
// возврат в приложение и каждые 10 минут на виду: свежие новости (и места — не чаще раза в 30 минут), перерисовать разделы
let liveAt = Date.now(), placesAt = Date.now();
async function liveRefresh(force = false) {
  if (document.visibilityState !== 'visible' || (!force && Date.now() - liveAt < 5 * 6e4)) return;
  liveAt = Date.now();
  const jobs = [loadNews(true)];
  if (MAP_GAMES.includes(store.game) && Date.now() - placesAt > 30 * 6e4) { placesAt = Date.now(); jobs.push(refreshPlaces(store.game)); }
  await Promise.all(jobs).catch(() => { });
  if (ui.tab === 'home') renderHub(); else if (ui.tab === 'feed') renderFeed();
}
document.addEventListener('visibilitychange', () => liveRefresh());
setInterval(() => liveRefresh(), 10 * 6e4);

// ── «Новое» на Главной: карточка новости в стиле ленты; подробности — в шторке, источник подписью без ссылки ──
function newsDate(d) {
  const days = Math.floor((Date.now() - Date.parse(d + 'T00:00:00Z')) / 864e5);
  if (days <= 0) return t('news_today');
  if (days === 1) return t('news_yday');
  return new Date(d + 'T12:00:00Z').toLocaleDateString(getLang(), { day: 'numeric', month: 'long' });
}
function newsCard(n) {
  const img = n.img ? imgUrl(n.img.thumb || n.img.file) : '';
  return `<div class="pcard ncard" data-action="open-news" data-id="${esc(n.id)}" role="button" tabindex="0">
    ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="pc-ph">${I.egg}</span>`}
    <span class="pc-grad"></span>
    <span class="pc-tags"><i class="tag-new">${esc(newsDate(n.date))}</i></span>
    <span class="pc-txt"><b>${esc(L(n.t))}</b><small>${esc((n.src || []).join(', '))}</small></span>
  </div>`;
}
async function openNews(id) {
  const n = (await loadNews()).find((x) => x.id === id); if (!n) return;
  const guide = /^egg:/.test(n.key || '') ? await findByKey(n.key).then((o) => (hasGuide(o) ? o : null)).catch(() => null) : null;
  const img = n.img ? imgUrl(n.img.file) : '';
  const src = n.src || [];
  openSheet(`<div class="news-sheet">
    ${img ? `<figure class="ns-img sk-photo">${n.img.thumb ? `<img class="ns-th" src="${esc(imgUrl(n.img.thumb))}" alt="" aria-hidden="true">` : ''}<img src="${esc(img)}" alt="" decoding="async">${n.img.credit && !OWN_ART ? `<figcaption>${esc(credit(n.img.credit))}</figcaption>` : ''}</figure>` : ''}
    <small class="ns-date">${esc(newsDate(n.date))}</small>
    <h2>${esc(L(n.t))}</h2>
    <p>${esc(L(n.d))}</p>
    ${src.length ? `<p class="ns-src">${esc(t(src.length > 1 ? 'news_srcs' : 'news_src'))}: ${esc(src.join(', '))}</p>` : ''}
    ${guide ? `${guide.how.self ? `<p class="ns-trust">${I.check}<span>${esc(tf('g_self', { d: guideDate(guide.how.self) }))}</span></p>` : ''}
      <button class="btn-primary" data-action="open-guide" data-key="${esc(n.key)}" data-from="news">${I.doc}<span>${esc(t('g_btn'))}</span></button>
      <button class="ns-map" data-action="open-place" data-key="${esc(n.key)}">${I.pin}<span>${esc(t('news_on_map'))}</span></button>`
    : n.key ? `<button class="btn-primary" data-action="open-place" data-key="${esc(n.key)}">${I.pin}<span>${esc(t('news_on_map'))}</span></button>` : ''}
  </div>`, 'news');
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

// ── верх Главной: фото эпохи (листание пальцем, без автопрокрутки), город, поиск. Игра выбирается только значком в шапке
// (Игорь 23.11.2026 перечеркнул вкладки «GTA 6 / GTA 5» в герое; GTA 5 — в 2 тапа: значок → карточка игры) ──
// число мест по играм — из загруженных данных карты; помним между запусками (sb.pc), чтобы подписи («196 мест») были сразу
const placeCounts = new Proxy((() => { try { return JSON.parse(localStorage.getItem('sb.pc') || '{}'); } catch { return {}; } })(), {
  set(o, k, v) { o[k] = v; try { localStorage.setItem('sb.pc', JSON.stringify(o)); } catch { } return true; },
});
let heroKey = '';
function heroMeta() {
  const n = placeCounts[store.game];
  return [n != null ? tn(n, 'n_places') : '', cheats().length ? tn(cheats().length, 'n_codes') : ''].filter(Boolean).join(', ');
}
function heroHTML() {
  const h = HERO[store.game], g = game();
  // 2-е и 3-е фото — без адреса до первого экрана (bindHero): на слабой сети они отнимали канал у Главной (~110 КБ, 23.11.2026)
  const slides = h ? h.banners.map((b, i) => (i ? `<picture class="hero-slide"><source type="image/avif" data-srcset="${b}.avif"><img data-src="${b}.webp" alt="" width="860" height="676" decoding="async"></picture>`
    : `<picture class="hero-slide"><source type="image/avif" srcset="${b}.avif"><img src="${b}.webp" alt="" width="860" height="676" decoding="async" fetchpriority="high"></picture>`)).join('') : '';
  return `<div class="hero${h ? '' : ' no-photo'}">
    <div class="hero-track">${slides}</div><span class="hero-scrim"></span>
    <div class="hero-city"><h2${(h ? L(h.city) : g.title).length > 8 ? ' class="long"' : ''}>${esc(h ? L(h.city) : g.title)}</h2><p id="hero-meta">${esc(heroMeta())}</p></div>
    ${h && h.banners.length > 1 ? `<div class="hero-dots">${h.banners.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
    ${h && !OWN_ART ? `<span class="hero-credit">${esc(credit('© Rockstar Games'))}</span>` : ''}
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
  const m = $('#hero-meta');
  if (m) m.textContent = heroMeta();
}
function bindHero() {
  const tr = $('#home-hero .hero-track'), dots = [...document.querySelectorAll('#home-hero .hero-dots i')];
  if (!tr || dots.length < 2) return;
  const fill = () => tr.querySelectorAll('[data-srcset],[data-src]').forEach((x) => {
    if (x.dataset.srcset) { x.srcset = x.dataset.srcset; delete x.dataset.srcset; }
    if (x.dataset.src) { x.src = x.dataset.src; delete x.dataset.src; }
  });
  tr.addEventListener('scroll', fill, { once: true, passive: true });
  afterFirstScreen(fill, 15000);   // листнул — сразу; иначе позже, когда карта и Главная уже взяли своё
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
// Главная рисуется сразу: коды и всё, что уже в памяти; ленты, которым нужны данные мест и новости, — скелетоном
// тех же размеров (без прыжков), затем дорисовка (Игорь 23.11.2026: «интерфейс уже подгрузился, на клик сразу отреагировали»)
async function renderHub() {
  const my = ++hubSeq;
  renderHero();
  const box = $('#home-main'), isMap = MAP_GAMES.includes(store.game);
  const favCount = store.favs.length + store.favPlaces.length;
  const pdP = isMap ? loadPlaces(store.game) : null, newsP = loadNews(), favP = favCount ? favItems() : Promise.resolve([]);
  const pd0 = isMap ? placesNow(store.game) : null, news0 = newsNow();
  const full0 = (!isMap || pd0) && news0 && !favCount;
  if (pd0?.places?.length) placeCounts[store.game] = pd0.places.length;
  paintHub(box, isMap, pd0, news0, favCount ? null : []);
  if (full0) { watchPlaceCounts(); return; }
  const [pd, news, fav] = await Promise.all([pdP, newsP, favP]);
  if (my !== hubSeq) return;
  if (pd?.places?.length) placeCounts[store.game] = pd.places.length;
  watchPlaceCounts();
  renderHero();
  paintHub(box, isMap, pd, news, fav);
}
// скелетон ленты: те же карточки по размеру, мерцание вместо фото
const skRow = (cls = '', n = 3) => `<div class="hscroll sk-row" aria-hidden="true">${`<div class="pcard sk${cls}"><span class="sk-line"></span><span class="sk-line short"></span></div>`.repeat(n)}</div>`;
function paintHub(box, isMap, pd, newsAll, favPreview) {
  const list = cheats();
  const popular = (POPULAR[store.game] || []).map((id) => list.find((c) => c.id === id)).filter(Boolean);
  // разделы «Новости / Новое на карте / Пасхалки» с кнопками «Все» (выпуск 23.11); без данных — скелетоны тех же размеров
  const freshIds = new Set(pd ? newOnMap(pd).map((o) => o.id) : []);
  const places = pd ? featured(pd, 'place', 14 + freshIds.size).filter((o) => !freshIds.has(o.id)).slice(0, 14) : [];
  const eggs = pd ? eggsNewFirst(pd).filter(hasPhoto).slice(0, 12) : [];
  const fresh = pd ? newOnMap(pd, 'place', 12) : [];
  const news = newsAll ? newsAll.filter((n) => n.game === store.game).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 12) : null;
  const favCount = store.favs.length + store.favPlaces.length;
  const more = (v) => `<button class="hub-more" data-action="open-feed" data-v="${v}">${t('see_all')}${I.chevron}</button>`;
  const placesBtn = `<button class="hub-more" data-action="tab" data-tab="map">${t('open_map')}${I.chevron}</button>`;
  const noPd = isMap && !pd;
  box.innerHTML = `
    ${forecastBanner()}
    ${!news ? hubSection(t('hub_news'), '', more('news'), skRow(' ncard')) : news.length ? hubSection(t('hub_news'), esc(agoText(newsUpdated())), more('news'), `<div class="hscroll" data-sec="news">${news.map(newsCard).join('')}</div>`) : ''}
    ${noPd ? hubSection(t('hub_newmap'), t('hub_newmap_sub'), more('newmap'), skRow()) : fresh.length ? hubSection(t('hub_newmap'), t('hub_newmap_sub'), more('newmap'), `<div class="hscroll" data-sec="newmap">${fresh.map((o) => placeCard(o)).join('')}</div>`) : ''}
    ${hubSection(t('hub_cheats'), `<button class="hub-plat" data-action="switch">${esc(L(PLATFORMS[store.platform]))}<i class="gsw-chev">${I.chevron}</i></button>`, `<button class="hub-more" data-action="open-cheats" data-cat="">${t('see_all')}${I.chevron}</button>`,
      `<div class="cat-grid">${CATEGORIES.map((c) => `<button class="cat-tile cat-${c.id}" data-action="open-cheats" data-cat="${c.id}">
        <span class="ct-ic">${I[c.icon]}</span><span class="ct-t"><b>${L(c)}</b><small>${tn(list.filter((x) => x.category === c.id).length, 'n_codes')}</small></span></button>`).join('')}</div>`)}
    ${popular.length ? hubSection(t('hub_popular'), '', '', `<div class="hscroll">${popular.map(miniCheat).join('')}</div>`) : ''}
    ${noPd ? hubSection(t('hub_places'), t('hub_places_sub'), placesBtn, skRow()) + hubSection(t('hub_eggs'), t('hub_eggs_sub'), more('eggs'), skRow()) : ''}
    ${places.length ? hubSection(t('hub_places'), t('hub_places_sub'), placesBtn, `<div class="hscroll">${places.map((o) => placeCard(o)).join('')}</div>`) : ''}
    ${eggs.length ? hubSection(t('hub_eggs'), t('hub_eggs_sub'), more('eggs'), `<div class="hscroll" data-sec="eggs">${eggs.map((o) => placeCard(o)).join('')}</div>`) : ''}
    ${favCount ? hubSection(t('hub_favs'), '', `<button class="hub-more" data-action="tab" data-tab="fav">${t('see_all')}${I.chevron}</button>`,
      favPreview ? `<div class="hscroll">${favPreview.slice(0, 10).map((x) => (x.kind ? placeCard(x, { game: x.game !== store.game }) : miniCheat(x))).join('')}</div>` : skRow()) : ''}
    <div class="hub-foot">${t('hub_foot')}</div>`;
}

// Все читы (экран внутри Главной)
function renderCheats() {
  const g = game();
  $('#home-title').textContent = t('hub_cheats');
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
// вкладка «Карта» открывает карту выбранной игры: GTA 5 → Лос-Анджелес, GTA 6 → Майами (Игорь 22.11.2026: «выбрал GTA 5,
// перешёл в карты — Майами, это грубая ошибка»); место другой игры из карточки открывается в своей игре (ui.mapHold)
const MAP_OF = (g) => (MAP_GAMES.includes(g) ? g : 'gta6');
// превью карты в момент тапа (до загрузки map.js и maplibre): снимок стартового вида с мерцанием; map.js (phShow/phHide)
// подхватывает этот же элемент и убирает его, когда плитки легли
const mapPhUrl = (g) => { let m = 'game'; try { if (localStorage.getItem('secret.map.mode') === 'real') m = 'life'; } catch { } return `${location.pathname.includes('/beta/') ? '../' : ''}img/ui/map-ph/${m}-${g}.webp`; };
function mapPlaceholder(g) {
  const box = $('#map');
  if (!box || box.querySelector('.map-ph, canvas')) return;
  const el = document.createElement('div'); el.className = 'map-ph'; el.setAttribute('aria-hidden', 'true');
  el.style.backgroundImage = `url(${mapPhUrl(g)})`;
  box.prepend(el); box.classList.add('loading', 'has-ph');
}
function openMap(preferGame = ui.mapHold || MAP_OF(store.game)) {
  if (!mapOpening) mapPlaceholder(preferGame);
  // та же логика, что в map.js open(): игра из настроек приложения переключает карту, если её там поменяли
  if (preferGame !== ui.mapPrefer) { ui.mapPrefer = preferGame; ui.mapGame = preferGame; applySkin(); }
  if (!mapOpening) mapOpening = mapMod().then((m) => m.open(mapCtx(), preferGame).then(() => { ui.mapReady = true; return m; })).catch((e) => { mapOpening = null; toast(t('map_error')); throw e; });
  else mapOpening.then((m) => m.open(mapCtx(), preferGame)).catch(() => { });
  return mapOpening;
}
// открыть место на карте
async function openOnMap(key) {
  const { kind, game: g, id } = parseKey(key);
  closeSheet();
  if (!canOpenPlace(key)) { openPaywall(mapPw()); return; }
  ui.mapHold = g;
  if (!mapOpening) openMap(g);
  ui.tab = 'map'; renderAll();
  ui.mapGame = g; applySkin();   // карта откроет место в его игре (focus) — скин за ней
  let early = false;
  // карта ещё грузится — карточка открывается сразу: название и превью-фото из данных мест, остальное мерцает;
  // карта подменит содержимое плавно (openSheet swap), без прыжка (Игорь 23.11.2026)
  if (!ui.mapReady) {
    placeSkeleton(kind, g, id);
    mapMod().then((m) => (!ui.mapReady && ui.tab === 'map' ? m.sheetEarly?.(g, kind, id) : false)).then((r) => { early = !!r; }).catch(() => { });   // содержимое — по данным, не дожидаясь карты
  }
  try {
    const m = await mapOpening;
    ui.mapReady = true;
    if (early && !$('#sheet-layer').classList.contains('open')) return;   // карточку уже закрыли, пока грузилась карта, — не открываем снова
    let ok = true;
    if (m.focus) { ok = await m.focus(g, kind, id); if (!ok) toast(t('place_nf')); }   // места нет (ссылка устарела) — сказать, а не молчать
    else { await m.setGame(g); toast(t('map_find_hint')); }
    if (!ok && $('#sheet-body .mp-sk')) closeSheet();
  } catch { if ($('#sheet-body .mp-sk')) closeSheet(); }
}

function placeSkeleton(kind, g, id) {
  const d = placesNow(g); if (!d) return;
  const o = kind === 'egg' ? d.eggs.find((x) => x.id === id) : kind === 'place' ? d.places.find((x) => x.id === id) : null;
  if (!o) return;
  const img = thumbOf(o, kind === 'egg' ? 'game' : 'real');
  const line = (w, h = 13) => `<span class="sk-box" style="display:block;width:${w};height:${h}px;margin:0 0 10px"></span>`;
  openSheet(`<div class="mp-sk" aria-busy="true">
      <div class="cmp-stage cmp-inline sk-photo">${img ? `<img src="${esc(img)}" alt="" decoding="async" style="width:100%;height:100%;object-fit:cover;filter:blur(6px);transform:scale(1.06)">` : ''}</div>
      <div class="mp-names"><div class="mp-nm r"><span class="mp-nic">${I.pin}</span><div><b>${esc(kind === 'egg' ? L(o.t) : realName(o))}</b></div></div></div>
      ${line('86%')}${line('64%')}${line('92%', 44)}${line('72%')}
    </div>`, 'sheet-map', null, { snap: 'half' });
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
    const hay = norm([c.name.ru, c.name.en, c.desc?.ru, c.desc?.en, c.codes.pc, SYN[c.category]].join(' '));
    // служебные слова («код», «cheat») — только с начала слова: «heat» внутри «cheat» находил все коды (QA 20.11.2026)
    return qq.split(/\s+/).every((w) => hay.includes(w) || (w.length >= 3 && CODE_WORDS.split(' ').some((cw) => cw.startsWith(w)))) || (qd.length >= 3 && (c.codes.phone || '').replace(/\D/g, '').includes(qd));
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
  // данных мест ещё нет — сразу скелетон списка (вкладка отвечает на тап мгновенно), потом результаты
  if (MAP_GAMES.includes(sg) && !placesNow(sg)) box.innerHTML = `<div class="s-sec sk-list" aria-busy="true">${'<div class="sk-item"><span class="sk-box sk-ava"></span><span class="sk-txt"><span class="sk-box"></span><span class="sk-box"></span></span></div>'.repeat(7)}</div>`;
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
    // подсказки — под игру пользователя: у GTA 6 нет «бессмертия» и «вертолёта» (QA 20.11.2026)
    const hints = store.game === 'gta6'
      ? (getLang() === 'ru' ? ['патроны', 'бронежилет', 'Ocean Drive', 'мост', 'отель', 'розыск'] : ['ammo', 'armor', 'Ocean Drive', 'bridge', 'hotel', 'wanted'])
      : (getLang() === 'ru' ? ['вертолёт', 'бессмертие', 'Ocean Drive', 'мост', 'отель', 'розыск'] : ['helicopter', 'invincibility', 'Ocean Drive', 'bridge', 'hotel', 'wanted']);
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
  // данные мест — только игр, где есть сохранённые места (23.11.2026: Главная GTA 6 ждала ещё 340 КБ мест GTA 5 при пустом Избранном)
  const pGames = new Set(store.favPlaces.map((k) => parseKey(k).game));
  const games = [...new Set([...pGames, ...liveGames().map((g) => g.id)])];
  await Promise.all(games.map((g) => Promise.all([loadGame(g).catch(() => null), MAP_GAMES.includes(g) && pGames.has(g) ? loadPlaces(g) : null])));
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
// строка Pro в Настройках (Fable 23.11.2026, вариант B: без фото, но заметнее остальных строк): без Pro — что внутри и цена года;
// в пробном — остаток; с Pro — срок; пропуск за 7 дней до конца — тап открывает пейвол renew. Класс pro-card — для тестов.
function proRowHTML() {
  const a = access(), kind = proKind(), end = proEnds(), d = end ? dlong(end) : '';
  const renew = a === 'pro' && kind === 'pass' && end - Date.now() < 7 * DAY;
  const ended = a === 'pro' && pay.proActive() && pay.pro()?.cancel;   // подписка отменена: Pro до конца оплаченного срока, без продления
  const sub = a === 'pro' ? (d ? tf(ended ? 'st_pro_cancelled' : { work: 'st_pro_work', pass: 'st_pro_pass', month: 'st_pro_month', free: 'st_pro_free3' }[kind] || 'st_pro_year', { d }) : '')
    : a === 'trial' ? tf('trial_left', { t: trialLeft() }) : tf('st_pro_row', { p: usd(zone().year) });
  const done = a === 'pro' && !renew;
  return `<button class="row pro-card pro-row${a === 'pro' ? ' on' : ''}" data-action="${done ? 'noop' : 'paywall'}"><span class="row-ic">${I.crown}</span>
    <span class="row-l">${a === 'pro' ? t('st_pro_on') : t('st_pro')}${sub ? `<small>${esc(sub)}</small>` : ''}</span>${done ? `<span class="row-v">${I.check}</span>` : `<span class="row-chev">${I.chevron}</span>`}</button>`;
}
// аккаунт (вход через Google): покупка Pro привязана к нему и восстанавливается на любом устройстве входом
function acctHTML() {
  if (!pay.enabled()) return '';
  if (!pay.signedIn()) return `<div class="group">${row('acct-email', I.users, t('acct_email_in'))}${row('acct-in', I.users, t('acct_in'))}${row('acct-code', I.link, t('acct_code'))}</div>`;
  const p = pay.pro(), u = pay.user() || {};
  return `<div class="group">
      <div class="row row-static"><span class="row-ic">${I.users}</span><span class="row-l">${esc(u.email || '')}</span><span class="row-v">${u.google ? t('acct_google') : ''}</span></div>
      ${row('acct-setpw', I.link, t(u.has_pw ? 'au_chpw' : 'au_setpw_row'))}
      ${p?.manage ? row('acct-portal', I.wallet, t('acct_portal'), p?.cancel && p.active ? esc(tf('acct_cancelled', { d: dlong(p.until) })) : '') : ''}
      ${row('acct-pair', I.link, t('acct_pair'))}
      ${row('acct-out', I.close, t('acct_out'), '', false)}
    </div>`;
}
// ───────── вход по почте (20.11.2026): оплата без входа → пароль после оплаты; вход паролем; код на почту ─────────
// mode: 'setpw' — сразу после оплаты (почта из Stripe, можно «Позже»); 'chpw' — сменить; 'login' — почта+пароль; 'code' — код на почту
function authSheet(mode, o = {}) {
  const u = pay.user() || {}, h = pay.hint() || {};
  const email = esc(o.email || u.email || h.email || '');
  const inp = (id, type, ph, val = '', ac = '') => `<input class="au-in" id="${id}" type="${type}" placeholder="${esc(ph)}" value="${val}" autocomplete="${ac}" ${type === 'email' ? 'inputmode="email" autocapitalize="off" spellcheck="false"' : ''}>`;
  let body;
  if (mode === 'setpw' || mode === 'chpw') {
    body = `<h2 class="pick-t">${t(mode === 'setpw' ? 'au_setpw_h' : 'au_chpw')}</h2>
      ${mode === 'setpw' ? `<p class="au-p">${t('au_setpw_p')}</p>` : ''}
      <input type="email" id="au-user" value="${email}" autocomplete="username" readonly class="au-in au-ro">
      ${mode === 'chpw' && u.has_pw ? inp('au-old', 'password', t('au_old'), '', 'current-password') : ''}
      ${inp('au-pw', 'password', t('au_pw'), '', 'new-password')}
      <button type="button" class="btn-primary" data-action="au-setpw">${t('au_save')}</button>
      ${mode === 'setpw' ? `<button type="button" class="btn-ghost" data-action="au-later">${t('au_later')}</button>` : ''}`;
  } else if (mode === 'login') {
    body = `<h2 class="pick-t">${t('au_login_h')}</h2>
      <p class="au-p">${o.note ? esc(o.note) : t('au_login_p')}</p>
      ${inp('au-email', 'email', t('au_email'), email, 'username')}
      ${inp('au-pw', 'password', t('au_pw_in'), '', 'current-password')}
      <button type="button" class="btn-primary" data-action="au-login">${t('au_go')}</button>
      <button type="button" class="au-lnk" data-action="au-forgot">${t('au_forgot')}</button>
      <button type="button" class="au-lnk" data-action="acct-in">${t('au_google')}</button>`;
  } else {
    const sent = !!o.sent;
    body = `<h2 class="pick-t">${t('au_code_h')}</h2>
      <p class="au-p">${t(sent ? 'au_sent' : 'au_code_p')}</p>
      ${inp('au-email', 'email', t('au_email'), email, 'username')}
      ${sent ? inp('au-code', 'text', t('au_code'), '', 'one-time-code').replace('type="text"', 'type="text" inputmode="numeric" maxlength="6"') + inp('au-pw', 'password', t('au_newpw'), '', 'new-password') : ''}
      <button type="button" class="btn-primary" data-action="${sent ? 'au-verify' : 'au-send'}">${t(sent ? 'au_go' : 'au_send')}</button>
      ${sent ? `<button type="button" class="au-lnk" data-action="au-send">${t('au_resend')}</button>` : ''}`;
  }
  openSheet(`<form class="au" data-mode="${mode}" novalidate>${body}</form>`, 'sheet-au');
  setTimeout(() => { const f = [...document.querySelectorAll('#sheet-body .au input:not([readonly])')].find((x) => !x.value); try { f?.focus({ preventScroll: true }); } catch { } }, 350);
}
const auVal = (id) => ($('#' + id)?.value || '').trim();
function auDone(msg) { closeSheet(); onAccess(); renderAll(); if (pay.proActive()) closePaywall(); if (msg) toast(msg); }
function auErr(e) {
  toast(t(e.status === 429 ? 'acct_code_slow' : e.code === 'weak_password' ? 'au_weak' : e.code === 'bad_login' ? 'au_bad_login'
    : e.code === 'bad_old' ? 'au_bad_old' : e.code === 'email_off' ? 'au_mail_off' : e.code === 'bad_email' ? 'au_bad_email' : e.code === 'ticket' ? 'acct_code_bad' : 'pay_err_net'));
}
document.addEventListener('submit', (e) => { if (e.target.closest('form.au')) e.preventDefault(); });
document.addEventListener('input', (e) => { if (e.target.id === 'pw-code') promoTyped = e.target.value; });
document.addEventListener('keydown', (e) => {   // Enter в поле промокода / почты на пейволе
  if (e.key !== 'Enter') return;
  if (e.target.id === 'pw-code') { e.preventDefault(); $('#paywall [data-action=promo-apply]')?.click(); }
  else if (e.target.id === 'pw-email') { e.preventDefault(); $('#paywall [data-action=promo-redeem]')?.click(); }
});
document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' || !e.target.closest?.('form.au input')) return; e.preventDefault(); e.target.closest('form.au').querySelector('.btn-primary')?.click(); });
async function auAction(a, el) {
  el.disabled = true;
  try {
    if (a === 'au-setpw') {
      const pw = auVal('au-pw'); if (pw.length < 8) { toast(t('au_weak')); return; }
      await pay.setPassword(pw, auVal('au-old')); auDone(t('au_saved'));
    } else if (a === 'au-later') { auDone(); }
    else if (a === 'au-login') {
      const em = auVal('au-email'), pw = auVal('au-pw'); if (!em || !pw) { toast(t('au_fill')); return; }
      await pay.login(em, pw); auDone(pay.proActive() ? t('pay_restored') : tf('acct_hi', { e: pay.user()?.email || '' }));
    } else if (a === 'au-forgot') { authSheet('code', { email: auVal('au-email') }); }
    else if (a === 'au-send') {
      const em = auVal('au-email'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast(t('au_bad_email')); return; }
      await pay.emailCode(em); authSheet('code', { email: em, sent: true });
    } else if (a === 'au-verify') {
      const em = auVal('au-email'), code = auVal('au-code').replace(/\D/g, ''), pw = auVal('au-pw');
      if (code.length !== 6) { toast(t('acct_code_bad')); return; }
      if (pw && pw.length < 8) { toast(t('au_weak')); return; }
      await pay.emailVerify(em, code, pw || null);
      auDone(pay.proActive() ? t('pay_restored') : tf('acct_hi', { e: pay.user()?.email || '' }));
      if (!pw && !pay.user()?.has_pw) setTimeout(() => authSheet('setpw'), 400);
    }
  } catch (e) { auErr(e); }
  finally { el.disabled = false; }
}
// в каких картах открывать место (Игорь 15.10.2026: «Google по умолчанию, в настройках — Apple, потом любые другие»).
// Новая карта — строка здесь и ветка в mapsLink (map.js); наружу — только карты (правило «не уводить из приложения»).
const MAPS_APPS = [['google', 'Google'], ['apple', 'Apple']];
// Настройки по смыслу (Игорь 23.11.2026: «каша»): Pro и аккаунт → игра → приложение → карты → помощь и условия → авторам →
// начать заново. У группы свой заголовок, строки одного вида (значок, подпись, значение или переключатель), зоны нажатия от 44.
// Вариант B по решению Fable (Варианты A и B — «Настройки и подписи (23.11.2026)/»): Pro строкой, авторы — строкой с отдельным экраном.
const stGroup = (title, body, cls = '') => body ? `<section class="st-sec${cls ? ' ' + cls : ''}"><h3 class="st-h">${esc(title)}</h3>${body}</section>` : '';
const segRow = (icon, label, items, cur, action) => `<div class="row row-static"><span class="row-ic">${icon}</span><span class="row-l">${esc(label)}</span>
  <span class="mini-seg" role="radiogroup" aria-label="${esc(label)}">${items.map(([k, n]) => `<button class="${cur === k ? 'on' : ''}" role="radio" aria-checked="${cur === k}" data-action="${action}" data-v="${k}">${esc(n)}</button>`).join('')}</span></div>`;
// только свои страницы (terms, privacy): адрес всегда «./<страница>.html» — check_links видит, что это не наружу
const linkRow = (page, icon, label) => `<a class="row" href="./${page}.html?lang=${getLang()}"><span class="row-ic">${icon}</span><span class="row-l">${esc(label)}</span><span class="row-v"></span><span class="row-chev">${I.chevron}</span></a>`;
function renderSettings() {
  const g = game(), lg = getLang();
  const th = { dark: t('th_dark'), light: t('th_light'), auto: t('th_auto') };
  const acct = acctHTML().replace(/^<div class="group">|<\/div>$/g, '');
  const authors = window.Capacitor?.isNativePlatform?.() ? ''   // в iOS-сборке раздела нет (07 §2.2)
    : `<div class="group">${row('creators', I.video, `${t('st_creators_row')}<small class="one">${esc(t(noPay() ? 'st_creators_sub_np' : 'st_creators_sub'))}</small>`)}</div>`;
  $('#settings-body').innerHTML = `
    ${stGroup(t('st_g_account'), `<div class="group">${proRowHTML()}${acct}</div>`)}
    ${stGroup(t('st_g_game'), `<div class="group">
      ${row('switch', platformIcon(store.platform), t('st_codes_for'), esc(`${g.title}, ${L(PLATFORMS[store.platform])}`))}
      ${row('howto', I.info, t('st_howto'))}</div>`)}
    ${stGroup(t('st_g_app'), `<div class="group">
      ${segRow(I.globe, t('st_lang'), [['ru', 'RU'], ['en', 'EN']], lg, 'lang')}
      ${segRow(I.moon, t('st_theme'), ['dark', 'light', 'auto'].map((k) => [k, th[k]]), store.theme, 'theme')}
      <div class="row row-static"><span class="row-ic">${I.vibe}</span><span class="row-l">${t('st_haptic')}</span>
        <button class="switch${store.haptic ? ' on' : ''}" data-action="haptic-toggle" role="switch" aria-checked="${!!store.haptic}" aria-label="${esc(t('st_haptic'))}"><i></i></button></div></div>`)}
    ${stGroup(t('st_g_maps'), `<div class="group">${segRow(I.pin, t('st_maps_open'), MAPS_APPS, store.mapsApp || 'google', 'maps-app')}</div>`)}
    ${stGroup(t('st_g_help'), `<div class="group">
      ${row('tour', I.map, t('st_tour'))}
      ${row('share-app', I.share, t('st_share_app'))}
      ${row('rate', I.star, t('st_rate'))}
      ${linkRow('terms', I.doc, t('pw_terms'))}
      ${linkRow('privacy', I.shield, t('pw_privacy'))}
      ${row('about', I.home, t('st_about'))}</div>`)}
    ${stGroup(t('st_g_authors'), authors)}
    <div class="group st-reset">${row('reset', I.reset, t('st_reset'), '', false)}</div>
    <p class="ver">${t('hub_foot')}<br>${esc(APP.shortName)}, v${esc(APP.version)}</p>`;
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
  // единый значок «игра + платформа» (Игорь 22.11.2026, решение Fable — вариант A): иконка платформы, название игры, шеврон
  const swHTML = `${platformIcon(store.platform)}<b>${esc(game().title)}</b><i class="gsw-chev">${I.chevron}</i>`;
  const swAria = tf('sw_aria', { g: game().title, p: L(PLATFORMS[store.platform]) });
  ['#plat-btn', '#plat-btn2'].forEach((sel) => { const b = $(sel); if (!b) return; b.innerHTML = swHTML; b.setAttribute('aria-label', swAria); });
  const tabs = [...document.querySelectorAll('.tab')];
  const tabOf = ui.tab === 'cheats' || ui.tab === 'feed' ? 'home' : ui.tab; // «Все читы» и «Все» разделов — экраны внутри Главной
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
  document.querySelectorAll('[data-ta]').forEach((s) => s.setAttribute('aria-label', t(s.dataset.ta)));   // подписи кнопок-значков для VoiceOver на языке интерфейса (QA 22.11)
  renderHome(); renderFeed(); renderSearch(); renderFavs(); renderSettings();
  maybeCodesTour();
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
  // GTA 6: не «нажмите во время игры», а телефон (↑) + L1+R1 / LB+RB + стрелки (18.11.2026)
  const how = { combo: store.game === 'gta6' && GTA6.codes === 'live' ? 'how6' : 'how_ps', pc: 'how_pc', phone: 'how_phone' }[pass.shown];
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
function howto(p) {   // GTA 6: телефон (↑) + зажать L1+R1 / LB+RB + стрелки, только после сюжета (18.11.2026)
  if (store.game === 'gta6' && GTA6.codes === 'live' && (p === 'playstation' || p === 'xbox')) return t(p === 'xbox' ? 'howto6_xbox' : 'howto6_ps');
  return t({ playstation: 'howto_ps', xbox: 'howto_xbox', pc: 'howto_pc', phone: 'howto_phone' }[p]);
}

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
// шторка «Игра и платформа»: две карточки игр (город = карта игры), платформы выбранной игры, будущие части строкой
function swGameCard(g) {
  const on = g.id === store.game, h = HERO[g.id], img = h?.banners?.[0];
  const n = placeCounts[g.id], c = data[g.id]?.cheats?.length;
  const meta = [n != null ? tn(n, 'n_places') : '', c ? tn(c, 'n_codes') : ''].filter(Boolean).join(', ');
  return `<button class="gsw-game${on ? ' on' : ''}" data-action="sw-game" data-v="${g.id}" role="radio" aria-checked="${on}">
    ${img ? `<picture><source type="image/avif" srcset="${img}.avif"><img src="${img}.webp" alt="" loading="lazy" decoding="async"></picture>` : ''}
    <span class="gsw-scrim"></span><span class="pw-radio" aria-hidden="true">${I.check}</span>
    <span class="gsw-t"><b>${esc(g.title)}</b><small>${esc(h ? L(h.city) : mapPlaceName(g.id))}</small>${meta ? `<small>${esc(meta)}</small>` : ''}</span></button>`;
}
function swPlatsHTML() {
  const g = game();
  return g.platforms.map((p) => `<button class="gsw-plat${p === store.platform ? ' on' : ''}" data-action="sw-plat" data-v="${p}" role="radio" aria-checked="${p === store.platform}">
    <span class="opt-ico">${platformIcon(p)}</span><span class="gsw-pn"><b>${esc(L(PLATFORMS[p]))}</b>${g.platformNote?.[p] ? `<small>${esc(L(g.platformNote[p]))}</small>` : ''}</span></button>`).join('');
}
function openSwitch() {
  const live = GAMES.filter((g) => g.status !== 'soon'), soon = GAMES.filter((g) => g.status === 'soon');
  openSheet(`<h2 class="pick-t">${t('sw_title')}</h2>
    <div class="gsw-games" role="radiogroup" aria-label="${esc(t('st_game'))}">${live.map(swGameCard).join('')}</div>
    <h3 class="gsw-h">${t('sw_plat')}</h3>
    <div class="gsw-plats" role="radiogroup" aria-label="${esc(t('sw_plat'))}">${swPlatsHTML()}</div>
    ${soon.length ? `<p class="gsw-soon">${esc(tf('sw_soon', { g: soon.map((g) => g.title).join(', ') }))}</p>` : ''}`, 'sheet-pick sheet-gsw');
}
function openPickGame() { openSheet(`<h2 class="pick-t">${t('select_game')}</h2><div class="opts">${gameListHTML(store.game, 'set-game')}</div>`, 'sheet-pick'); }
function openPickPlatform() { openSheet(`<h2 class="pick-t">${t('select_platform')}</h2><div class="opts">${platListHTML(store.game, store.platform, 'set-platform')}</div>`, 'sheet-pick'); }

function openHowto() {
  const g = game();
  openSheet(`<h2 class="pick-t">${t('st_howto')}</h2>${g.platforms.map((p) => `<div class="howto"><div class="plat-h">${platformIcon(p)}<span>${L(PLATFORMS[p])}</span></div><p>${esc(howto(p))}</p></div>`).join('')}<p class="d-note">${t('howto_warn')}</p>`, 'sheet-pick');
}
function openAbout() {
  openSheet(`<h2 class="pick-t">${t('st_about')}</h2><p class="about">${t('about_text')}</p>${OWN_ART ? '' : `<p class="about">${esc(t('frames_credit'))}</p>`}<p class="d-note">${esc((getLang() === 'en' ? data[store.game]?.source_en : data[store.game]?.source) || '')}</p><div class="ver">v${esc(APP.version)} · ${window.__vp ? `vp in ${__vp.inner} vh ${__vp.vh} dvh ${__vp.dvh} scr ${__vp.screen} sb ${__vp.safeB}${__vp.standalone ? ' sa' : ''}${__vp.guard ? ' guard' : ''}${__vp.overflow ? ' OVERFLOW' : ''}` : ''}</div>`, 'sheet-pick');
  // 5 нажатий на заголовок — включить или выключить тестовую оплату Stripe (для проверки до live)
  const h = document.querySelector('#sheet-body .pick-t'); let n = 0, tm = 0;
  if (h && pay.apiBase()) h.addEventListener('click', () => { clearTimeout(tm); tm = setTimeout(() => { n = 0; }, 2500); if (++n < 5) return; n = 0; toast(pay.togglePaytest() ? t('pay_test_on') : t('pay_test_off')); onAccess(); renderAll(); });
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
const MAP_DEMO = 20000;   // демо карты в пробном: 20 с (Игорь 20.11.2026: «15–20 секунд, а не как сейчас»)
const mapLock = { t0: 0, seen: 0, timer: 0, paywall: false, pausedAt: 0 };
const mapPw = () => (access() === 'trial' ? 'map' : workEnded() ? '' : 'trial_end');
function renderMapLock() {
  let el = $('#map-lock');
  if (ui.tab !== 'map' || access() === 'pro' || document.body.classList.contains('in-ob') || document.body.classList.contains('in-tour')) {
    if (el) el.hidden = true;
    clearInterval(mapLock.timer); mapLock.timer = 0; return;
  }
  if (!el) { el = document.createElement('div'); el.id = 'map-lock'; $('#view-map').appendChild(el); }
  el.hidden = false;
  // 20 с считаются с момента, когда карта видна, а не с тапа по вкладке: на iPhone карта грузится 10–16 с
  // и живого показа оставалось ~10 с (QA 22.11, роль «карта»)
  // карта не загрузилась за 12 с (плохая сеть) — отсчёт всё равно идёт, демо не бесконечное
  if (!mapLock.seen) mapLock.seen = Date.now();
  const mapShown = () => (!!window.__gtaMap && !document.getElementById('map')?.classList.contains('loading')) || Date.now() - mapLock.seen > 12000;
  if (!mapLock.t0 && mapShown()) mapLock.t0 = Date.now();
  el.innerHTML = `<div class="ml-veil"></div><div class="ml-box"><span class="ml-ic">${I.lock}</span><b id="ml-t"></b><span class="ml-bar"><i id="ml-bar"></i></span>
    <button class="btn-primary" data-action="paywall" data-pw="${mapPw()}">${t('open_pro')}</button></div>`;
  const tick = () => {
    if (!mapLock.t0 && mapShown()) mapLock.t0 = Date.now();
    const left = mapLock.t0 ? Math.max(0, MAP_DEMO - (Date.now() - mapLock.t0)) : MAP_DEMO, done = !left;
    el.classList.toggle('done', done);
    $('#ml-t').textContent = t(done ? 'map_locked' : 'map10');
    $('#ml-bar').style.width = ((1 - left / MAP_DEMO) * 100).toFixed(1) + '%';
    if (done) {
      clearInterval(mapLock.timer); mapLock.timer = 0;
      if (!mapLock.paywall && ui.tab === 'map') { mapLock.paywall = true; openPaywall(mapPw()); }
    }
  };
  tick();
  if (!mapLock.timer && (!mapLock.t0 || Date.now() - mapLock.t0 < MAP_DEMO)) mapLock.timer = setInterval(tick, 250);
}

// ───────── пейвол: только платные тарифы, 6 состояний (Ресерч 31 §4.5; концепт v11 paywall) ─────────
// trial_end — пробный кончился, нажат код; map — «Карта» в пробном; link — пришёл по ссылке креатора; prerelease — до 19.11;
// renew — до конца пропуска 7 дней; nopay — Россия, Беларусь. Обычный вход (строка пробного, Настройки): до 19.11 —
// prerelease, после — pro. Ни слова о деньгах авторов (tools/check_code.py). Покупка — демо: Pro на устройстве.
let plan = 'year';
// свой промокод на пейволе (22.11.2026): null | { code, kind: 'free'|'trial', days, price }. promoUi 'open' — поле ввода раскрыто
let promo = null, promoUi = '', promoTyped = '';
const promoErr = (e) => ({ bad_promo: 'pw_promo_bad', promo_kind: 'pw_promo_bad', promo_plan: 'pw_promo_bad', promo_expired: 'pw_promo_exp', promo_used_up: 'pw_promo_full',
  promo_used: 'pw_promo_used', slow_down: 'acct_code_slow', bad_email: 'au_bad_email', nopay: 'pay_nopay' }[e?.code] || 'pay_err_net');
const beforeRelease = () => Date.now() < new Date(PAYWALL.release + 'T00:00:00').getTime();
function pwResolve(want) {
  if (noPay()) return 'nopay';
  if (want) return want;
  if (proKind() === 'pass' && proEnds() - Date.now() < 7 * DAY) return 'renew';
  if (gift()) return 'link';
  return beforeRelease() ? 'prerelease' : 'pro';
}
function pwValues() {
  const g = store.game, n5 = data[g]?.cheats?.length, gt = GAMES.find((x) => x.id === g)?.title || 'GTA', np = MAP_GAMES.every((g) => placeCounts[g] != null) ? MAP_GAMES.reduce((a, g) => a + placeCounts[g], 0) : 0;
  return [n5 ? tf('pw_v1', { n: n5, g: gt }) : tf('pw_v1n', { g: gt }), t('pw_v2'), np ? tf('pw_v3', { n: tn(np, 'n_places') }) : t('pw_v3n'), t('pw_v4')]
    .concat(PAYWALL.scouts > 0 ? [tf('pw_scouts', { n: PAYWALL.scouts, m: 0 })] : []);
}
// честный текст триала по промокоду (скилл paywall-konversiya): сегодня $X, с такого-то числа — полная цена, продление, отмена
const trialAfter = (tr, pl, full) => tf('pw_after_trial_' + pl, { p: usdS(tr.price), f: usd(full), d: dlong(Date.now() + tr.days * DAY) });
// оплата внутри приложения (22.11.2026): панель пейвола превращается в форму Stripe (Embedded Checkout, Managed Payments).
// Запасной путь — страница Stripe, как раньше (Stripe.js не загрузился, старый сервер).
async function payInApp(pl) {
  const pw = $('#paywall'), panel = pw.querySelector('.pw-panel'); if (!panel) return;
  const Z = zone(), tr = promo?.kind === 'trial' ? promo : null;
  panel.innerHTML = `<div class="pw-pay">
    <div class="pw-pay-h"><button type="button" class="pw-pay-back" data-action="pw-pay-back" aria-label="${esc(t('back'))}">${I.back}</button><h2>${t('pay_h')}</h2></div>
    <p class="pw-pay-sum">${esc(tr ? trialAfter(tr, pl, Z[pl]) : tf('pay_sum_' + pl, { p: usd(Z[pl]) }))}</p>
    <div class="pw-embed"><p class="pw-embed-wait">${t('pay_loading')}</p><div id="pw-embed"></div></div>
    <p class="pw-after">${I.lock}<span>${t('pay_secure')}</span></p></div>`;
  pw.scrollTop = 0;
  try {
    await pay.checkoutInApp(pl, { promo: tr?.code, mount: '#pw-embed', onDone: (R) => { if (R.paid === 'ok') promo = null; onAccess(); renderAll(); payToast(R); } });
    pw.querySelector('.pw-embed-wait')?.remove();
  } catch (e) {
    if (!pw.querySelector('.pw-pay')) return;   // уже закрыли
    if (e.code === 'has_sub') { pay.portal().catch(() => toast(t('pay_err_net'))); return; }
    if (e.code === 'nopay' || /promo/.test(e.code || '')) { if (/promo/.test(e.code)) promo = null; toast(t(promoErr(e))); openPaywall(pwSt); return; }
    toast(t('pay_open'));
    pay.checkout(pl, tr?.code).catch((e2) => { toast(t(promoErr(e2))); openPaywall(pwSt); });
  }
}
function paywallPanel(st) {
  const Z = zone(), g = gift();
  const head = st === 'renew' ? tf('pw_h_renew', { d: dlong(proEnds()) }) : t('pw_h_' + (st === 'link' ? 'pro' : st));
  const lead = st === 'renew' ? tf('pw_l_renew', { p: usd(Z.pass), y: usd(Z.year) }) : t('pw_l_' + (st === 'link' ? 'pro' : st));
  if (!Z.month && plan === 'month') plan = 'year';
  const tr = promo?.kind === 'trial' ? promo : null, fr = promo?.kind === 'free' ? promo : null;
  if (tr && plan === 'pass') plan = 'year';   // платный триал — только у подписки
  // Пейвол по чек-листу конверсии (скилл paywall-konversiya, 22.11.2026): год выбран сразу и это видно (кружок с галочкой,
  // заливка, рамка 2 px); цена списания — крупно справа, «в месяц» — мельче; на кнопке — действие и цена выбранного срока;
  // под кнопкой — что будет дальше (автопродление или разовый платёж); «3 дня бесплатно» — рядом, с честным «без карты».
  const anchor = Z.month ? Z.month * 12 : Z.pass * 4, save = Math.round((1 - Z.year / anchor) * 100);
  const P = {
    year: { n: t('pw_n_year'), s: tf('pw_year_s', { m: usd(Math.round(Z.year / 12 * 100) / 100) }), p: Z.year, u: t('pw_u_year'), best: tf('pw_best', { n: save }) },
    pass: { n: t('pw_n_pass'), s: t('pw_pass_s'), p: Z.pass, u: t('pw_u_pass') },
    month: Z.month ? { n: t('pw_n_month'), s: t('pw_month_s'), p: Z.month, u: t('pw_u_month') } : null,
  };
  const card = (id) => { const c = P[id]; if (!c) return ''; const on = plan === id;
    return `<button class="plan pw-plan pw-${id}${on ? ' on' : ''}" data-action="plan" data-v="${id}" role="radio" aria-checked="${on}">
      <span class="pw-radio" aria-hidden="true">${I.check}</span>
      <span class="plan-n"><b>${esc(c.n)}${c.best ? `<em>${esc(c.best)}</em>` : ''}</b><small>${esc(c.s)}</small></span>
      <span class="plan-p"><b>${usd(c.p)}</b><small>${esc(c.u)}</small></span></button>`; };
  if (tr) P.pass = null;
  const cur = P[plan] || P.year;
  const pn = promo ? tn(promo.days, 'n_days') : '';
  const promoOn = promo ? `<p class="pw-promo-on">${I.check}<span>${esc(tf(tr ? 'pw_promo_trial' : 'pw_promo_free', { c: promo.code, n: pn, p: usdS(promo.price) }))}</span><button type="button" data-action="promo-clear">${t('pw_promo_clear')}</button></p>` : '';
  // «Есть промокод?» — тихая строка под кнопкой; поле раскрывается по тапу (код вводится здесь, а не на странице Stripe)
  const promoRow = !pay.enabled() || !pay.features().promo || st === 'renew' || promo ? '' : promoUi === 'open'
    ? `<div class="pw-promo"><input id="pw-code" class="au-in" type="text" value="${esc(promoTyped)}" placeholder="${esc(t('pw_promo_ph'))}" autocapitalize="characters" autocomplete="off" spellcheck="false" enterkeyhint="go" aria-label="${esc(t('pw_promo_ph'))}"><button type="button" class="pw-promo-go" data-action="promo-apply">${t('pw_promo_apply')}</button></div>`
    : `<button type="button" class="pw-promo-l" data-action="promo-open">${t('pw_promo_q')}</button>`;
  const buy = fr && st !== 'nopay'
    ? `${promoOn}
      ${pay.signedIn() ? '' : `<input id="pw-email" class="au-in pw-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="${esc(t('pw_free_email'))}" aria-label="${esc(t('pw_free_email'))}">`}
      <button class="btn-primary pw-cta" data-action="promo-redeem">${esc(tf('pw_free_cta', { n: pn }))}</button>
      <p class="pw-after">${I.lock}<span>${esc(tf('pw_free_after', { n: pn }))}</span></p>`
    : st === 'nopay'
    ? `<button class="btn-primary pw-cta" data-action="pw-partner">${t('pw_partner')}</button>`
    : `<div class="plans" role="radiogroup" aria-label="${esc(t('pw_plans'))}">${card('year')}${card('pass')}${card('month')}</div>
      ${promoOn}
      <button class="btn-primary pw-cta" data-action="buy">${esc(tr ? tf('pw_cta_trial', { n: pn, p: usdS(tr.price), f: usd(cur.p) }) : tf('pw_cta_' + plan, { p: usd(cur.p) }))}</button>
      <p class="pw-after">${I.lock}<span>${esc(tr ? trialAfter(tr, plan, cur.p) : t('pw_after_' + plan))}</span></p>
      ${promoRow}
      ${canTryFree() && st !== 'renew' && !tr ? `<button class="pw-try" data-action="try-free"><b>${t('pw_try')}</b><small>${t('pw_try_s')}</small></button>` : ''}
      ${pay.enabled() ? `<p class="pw-acct">${esc(pay.signedIn() ? tf('pw_acct_in', { e: pay.user()?.email || '' }) : t('pw_acct'))}</p>` : ''}`;
  return `<h1 class="pw-title${head.length > 24 ? ' pw-long' : ''}">${esc(head)}</h1>
    <p class="pw-lead">${esc(lead)}</p>
    <ul class="pw-feat">${pwValues().map((x) => `<li>${I.check}<span>${esc(x)}</span></li>`).join('')}</ul>
    ${g && st !== 'nopay' ? `<p class="pw-gift">${I.gift}<b>${esc(tf('pw_gift', { n: g.from }))}</b></p>` : ''}
    ${buy}
    <div class="pw-links"><button data-action="${pay.enabled() ? 'restore' : 'buy'}">${t('pw_restore')}</button><a href="terms.html">${t('pw_terms')}</a><a href="privacy.html">${t('pw_privacy')}</a></div>
    <p class="pw-fine">${t(st === 'nopay' ? 'pw_fine_np' : 'pw_fine')}</p>
    ${pay.enabled() ? (pay.isTest() ? `<p class="pw-demo">${t('pw_test')}</p>` : '') : (demoPay() ? `<p class="pw-demo">${t('pw_demo')}</p>` : '')}`;
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
  // сервер оплаты умеет промокоды и оплату внутри? — узнаём один раз, затем перерисовываем панель (строка «Есть промокод?»)
  if (pay.enabled() && !pay.features().promo) pay.loadFeatures().then((f) => { if (f.promo && pw.classList.contains('open') && pw.dataset.k === key && !pw.querySelector('.pw-pay')) pw.querySelector('.pw-panel').innerHTML = paywallPanel(st); });
  // живые счётчики: коды GTA 5 — сразу (25 КБ); места — только уже загруженных игр (данные карты 1–2 МБ ради подписи не качаем)
  if (!data[store.game]) loadGame(store.game).then(() => { if (pw.classList.contains('open') && pw.dataset.k === key && !pw.querySelector('.pw-pay')) pw.querySelector('.pw-panel').innerHTML = paywallPanel(st); }).catch(() => { });
}
// «Назад» браузера и свайп назад в Safari (QA 20.11.2026: уводили со страницы из открытой шторки кода).
// Над исходной записью истории ставим одну свою ({sbg:1}). «Назад» снимает её — закрываем верхнее (просмотр фото — map.js сам,
// экран раздела креатора, шторку, пейвол, вкладку → Главная) и ставим запись снова. На Главной без открытого — уходим как обычно.
function backGuard() {
  if (!history.state?.sbg) { history.replaceState({ ...(history.state || {}), sbg: 0 }, ''); history.pushState({ sbg: 1 }, ''); }
  addEventListener('popstate', (e) => {
    if (e.state?.sbg !== 0) return;   // вернулись на свою запись (после просмотра фото) или чужая — не наше
    const again = () => history.pushState({ sbg: 1 }, '');
    if (document.getElementById('mp-viewer')?.classList.contains('open')) { again(); return; }
    const cr = document.getElementById('cr');
    if (cr && !cr.hidden && crLoaded) { crMod().then((m) => m.back?.()).catch(() => { }); again(); return; }
    if (document.getElementById('tour')) { import('./tour.js').then((m) => m.skip()); again(); return; }   // тур раньше шторки (QA 22.11)
    // пейвол лежит поверх шторки: «назад» закрывает сначала его (QA 22.11 круг 2: закрывалась карточка под пейволом)
    const pw = $('#paywall');
    if (pw.classList.contains('open')) { if (pw.querySelector('.pw-close.show')) closePaywall(); again(); return; }
    if ($('#sheet-layer').classList.contains('open')) { closeSheet(); again(); return; }
    if (document.body.classList.contains('in-ob')) { again(); return; }
    if (ui.tab !== 'home') { ui.tab = 'home'; renderAll(); again(); }
  });
}
function closePaywall() {
  pay.closeInApp(); promoUi = '';
  $('#paywall').classList.remove('open');
  if (store.tourMap && !store.tourCodes && ui.tab === 'map' && store.onboarded) { closeSheet(); ui.tab = 'home'; renderAll(); return; }   // после пейвола — Главная и одна анимация кодов; карточку места закрыть (QA 22.11: оставалась поверх Главной и тур кодов не начинался)
  maybeInstallHint();
}
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
  const sec = (ic, k) => `<div class="ob-sec"><span class="ob-sec-ic">${ic}</span><span><b>${t(k)}</b><small>${t(k + '_s')}</small></span></div>`;
  return `<div class="ob-brand"><img src="icons/favicon.svg" alt="" width="44" height="44"><h1>Secret Base</h1></div>
    ${sec(I.gamepad, 'w_codes')}${sec(I.map, 'w_map')}
    <p class="ob-more">${t('w_more')}</p>
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
// ───────── знакомство на карте и с кодами (js/tour.js; Игорь 22.11.2026, сценарий «Гибрид») ─────────
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const tourCtx = () => ({ t, tf, haptic, setSnap, reduced: reducedMotion(), pro: access() === 'pro',
  codeId: (POPULAR[store.game] || [])[0] || 'g6_money', isFav: (id) => store.favs.includes(id) });
let codesBusy = false;
async function startMapTour(replay = false, after = false) {
  document.body.classList.add('in-tour');
  if (mapLock.t0 && !mapLock.pausedAt) mapLock.pausedAt = Date.now();   // повтор из Настроек: показ стоит, не сбрасывается
  renderMapLock();
  let r = 'error';
  try { r = await (await import('./tour.js')).mapTour({ ...tourCtx(), ...(after ? { base: 3, total: 6 } : {}) }); } catch { }
  store.tourMap = true; save();
  document.body.classList.remove('in-tour');
  if (mapLock.pausedAt) { mapLock.t0 += Date.now() - mapLock.pausedAt; mapLock.pausedAt = 0; }
  if (r === 'nomap') { ui.tab = 'home'; renderAll(); }   // нет карты (нет сети) — на Главную
  else renderMapLock();
}
// Игорь 23.11.2026: знакомство начинается с кодов — Главная → популярный код (кнопки, «Озвучить») → «в Избранное» → карта Майами
// (пролёт, ползунок «игра ⇄ жизнь», «Где в жизни»). Пока идёт шаг с кодом, карта прогревается: сначала «Игра», потом «Жизнь».
// «Пропустить» на шаге кодов — сразу карта и 20 с показа, без подсказок карты.
async function startTour(replay = false) {
  document.body.classList.add('in-tour');
  if (!store.tourCodes || replay) {
    if (ui.tab !== 'home') { closeSheet(); ui.tab = 'home'; renderAll(); }
    let r = 'error';
    try {
      const tm = await import('./tour.js');
      // прогрев карты: общий window.SB.prewarmMap (сессия скорости, perf/skeleton-23-11), без него — свой из js/map.js
      if (window.SB?.prewarmMap) Promise.resolve(window.SB.prewarmMap('gta6')).catch(() => { });
      else mapMod().then((m) => m.prewarmMap?.('gta6', tm.PLACE)).catch(() => { });
      r = await tm.codesFirst(tourCtx());
    } catch { }
    store.tourCodes = true; save();
    closeSheet();
    if (r === 'skip') {
      store.tourMap = true; save();
      document.body.classList.remove('in-tour');
      ui.tab = 'map'; renderAll(); return;
    }
    await new Promise((ok) => setTimeout(ok, 320));   // шторка уехала — потом вкладка «Карта»
  }
  ui.tab = 'map'; renderAll();
  await startMapTour(replay, true);
}
function maybeCodesTour() {
  if (codesBusy || !store.tourMap || store.tourCodes || ui.tab !== 'home' || !store.onboarded) return;
  const b = document.body.classList;
  if (b.contains('in-ob') || b.contains('in-tour') || $('#paywall').classList.contains('open') || $('#sheet-layer').classList.contains('open')) return;
  codesBusy = true;
  setTimeout(async () => {
    if (ui.tab !== 'home') { codesBusy = false; return; }
    try { await (await import('./tour.js')).codesTour(tourCtx()); } catch { }
    store.tourCodes = true; save(); codesBusy = false;
  }, 450);
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
  const tour = !store.tourMap;
  if (tour) document.body.classList.add('in-tour');   // 20 с показа карты стоят, пока идёт знакомство
  document.body.classList.remove('in-ob');
  ui.tab = tour ? 'home' : tab; ui.cat = DEFAULT_CATEGORY;   // знакомство начинается на Главной с кода (23.11.2026)
  renderAll();
  if (tour) startTour();
  else if (tab === 'home') maybeInstallHint();   // на карте подсказка закрыла бы замок карты
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
  store.platByGame = { ...(store.platByGame || {}), [store.game]: store.platform };   // «Телефон» в GTA 5 не теряется после GTA 6
  store.game = v;
  const g = game(), pb = store.platByGame[v];
  if (pb && g.platforms.includes(pb)) store.platform = pb; else if (!g.platforms.includes(store.platform)) store.platform = g.platforms[0];
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
      if (tab === 'map') ui.mapHold = null;   // своя вкладка карты — снова GTA 6
      el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce');
      if (tab === ui.tab) { // повторное нажатие — наверх, как в iOS
        if (tab === 'map') { mapMod().then((m) => m.refit()); break; }
        const box = document.querySelector(`#view-${tab} .scroll`);
        box?.scrollTo({ top: 0, behavior: 'smooth' });
        if (tab === 'search') $('#search-input').focus();
        break;
      }
      // ушли с карты — карточка места не остаётся висеть над другой вкладкой, отложенный тап по карте отменяем
      // (Игорь 22.11.2026: «между картами назад-вперёд — двойные попапы открываются и перезакрываются»)
      if (ui.tab === 'map') { mapMod().then((m) => m.cancelTap?.()).catch(() => { }); if ($('#sheet').classList.contains('sheet-map') && $('#sheet-layer').classList.contains('open')) closeSheet(); }
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
    case 'copy': try { await navigator.clipboard.writeText(v); toast(t('copied')); } catch { toast(t('copy_fail')); } break;
    case 'play': play(id); break;
    case 'desc': el.classList.toggle('open'); break;   // описание кода в шторке — одной строкой, по тапу целиком
    case 'plat': case 'pick-platform': haptic(); openPickPlatform(); break;
    case 'pick-game': haptic(); openPickGame(); break;
    case 'set-game': {
      if (v === store.game) { closeSheet(); break; }   // та же игра — без анимации
      haptic(); changeGame(v, true); break;
    }
    case 'set-platform': haptic(); store.platform = v; store.platByGame = { ...(store.platByGame || {}), [store.game]: v }; save(); closeSheet(); renderAll(); break;
    case 'switch': haptic(); openSwitch(); break;
    case 'sw-game': {   // другая игра — отметить сразу, применить и закрыть шторку (Главная, коды, карта, скин)
      if (v === store.game) break;
      haptic(); document.querySelectorAll('.gsw-game').forEach((b) => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      setTimeout(() => changeGame(v, true), 220); break;
    }
    case 'sw-plat': {
      haptic(); store.platform = v; store.platByGame = { ...(store.platByGame || {}), [store.game]: v }; save();
      document.querySelectorAll('.gsw-plat').forEach((b) => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      setTimeout(() => { closeSheet(); renderAll(); }, 160); break;
    }
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
    case 'open-feed': haptic(); ui.feed = el.dataset.v || 'news'; ui.tab = 'feed'; renderAll(); { const b = $('#feed-body'); if (b) b.scrollTop = 0; } break;
    case 'hub-game': {
      if (v === store.game) break;
      haptic(); changeGame(v); break;
    }
    case 'open-news': haptic(); openNews(el.dataset.id); break;
    case 'open-guide': haptic(); openGuideKey(el.dataset.key, el.dataset.from || ui.tab); break;
    case 'open-walk': haptic(); openWalk(ui.tab); break;
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
    case 'tour': haptic(); closeSheet(); startTour(true); break;
    case 'about': openAbout(); break;
    case 'creators': haptic(); window.SB.openCreator('hub'); break;
    case 'rate': toast(t('rated')); break;
    case 'reset': {   // «Начать заново»: демо-Pro снят, настройки и избранное — по умолчанию; срок пробного прежний
      ui.stopPlay?.(); Object.assign(store, { ...DEFAULTS, lang: store.lang, theme: store.theme, trialStart: store.trialStart || Date.now(), ftUntil: store.ftUntil, linkKeys: [] }); save();   // пробный НЕ начинается заново (QA 20.11.2026: «Начать заново» давал ещё 72 ч)
      Object.assign(mapLock, { t0: 0, seen: 0, paywall: false }); clearInterval(mapLock.timer); mapLock.timer = 0;
      closeSheet(); closePaywall(); $('#install').classList.remove('show'); lastAccess = access(); showOnboarding(); renderMapLock(); break;
    }
    case 'paywall': haptic(); closeSheet(); openPaywall(el.dataset.pw || ''); break;
    case 'try-free':
      haptic();
      if (!canTryFree()) break;
      store.ftUntil = Date.now() + 3 * DAY; save();
      closePaywall(); toast(t('pw_try_on')); onAccess(); renderAll();
      break;
    case 'plan': plan = v; haptic(); openPaywall(pwSt); $('#paywall .pw-close').classList.add('show'); break;
    case 'buy':
      haptic();
      if (!pay.enabled() && !demoPay()) { toast(t('pay_soon')); break; }
      if (!pay.enabled()) { demoBuy(); closePaywall(); toast(t('pro_unlocked')); onAccess(); renderAll(); break; }
      el.disabled = true;
      if (pay.features().embedded) { payInApp(plan); break; }
      toast(t('pay_open'));   // сервер без встроенной оплаты — страница Stripe, как раньше
      pay.checkout(plan, promo?.kind === 'trial' ? promo.code : null).catch((e) => { el.disabled = false; toast(t(promoErr(e))); });
      break;
    case 'pw-pay-back': haptic(); pay.closeInApp(); openPaywall(pwSt); break;
    case 'promo-open': haptic(); promoUi = 'open'; openPaywall(pwSt); setTimeout(() => { try { $('#pw-code')?.focus({ preventScroll: true }); } catch { } }, 60); break;
    case 'promo-clear': haptic(); promo = null; promoUi = ''; openPaywall(pwSt); break;
    case 'promo-apply': {
      const c = ($('#pw-code')?.value || '').trim(); if (!c) break;
      haptic(); el.disabled = true;
      pay.promoCheck(c).then((r) => { promo = r; promoUi = ''; promoTyped = ''; openPaywall(pwSt); toast(t('pw_promo_ok')); })
        .catch((e) => { el.disabled = false; toast(t(promoErr(e))); });
      break;
    }
    case 'promo-redeem': {   // бесплатный код: Pro без карты; без входа — по почте (дальше «Придумайте пароль», как после оплаты)
      if (!promo) break;
      const em = pay.signedIn() ? '' : ($('#pw-email')?.value || '').trim();
      if (!pay.signedIn() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast(t('au_bad_email')); $('#pw-email')?.focus(); break; }
      haptic(); el.disabled = true;
      const p0 = promo;
      pay.promoRedeem(p0.code, em).then((d) => {
        promo = null; onAccess(); renderAll(); closePaywall();
        if (d.need_login) { authSheet('login', { email: d.email, note: tf('pw_promo_linked', { e: d.email }) }); return; }
        toast(tf('pw_promo_done', { n: tn(p0.days, 'n_days') }));
        if (d.new_account) setTimeout(() => authSheet('setpw'), 1600);
      }).catch((e) => { el.disabled = false; toast(t(promoErr(e))); });
      break;
    }
    case 'restore':   // «Восстановить покупку»: вход через Google (покупка привязана к аккаунту) или сверка со Stripe
      haptic();
      if (!pay.signedIn()) { closePaywall(); setTimeout(() => authSheet('login'), 250); break; }   // шторка — над приложением, не под пейволом
      pay.refresh(true).then(() => { onAccess(); renderAll(); toast(t(pay.proActive() ? 'pay_restored' : 'pay_none')); if (pay.proActive()) closePaywall(); })
        .catch(() => toast(t('pay_err_net')));
      break;
    case 'acct-in': haptic(); toast(t('acct_open')); pay.signIn().then((ok) => { if (ok === false) toast(t('pay_err_net')); }); break;
    case 'acct-email': haptic(); authSheet('login'); break;
    case 'acct-setpw': haptic(); authSheet(pay.user()?.has_pw ? 'chpw' : 'setpw'); break;
    case 'au-setpw': case 'au-later': case 'au-login': case 'au-forgot': case 'au-send': case 'au-verify': haptic(); auAction(a, el); break;
    case 'acct-out': haptic(); pay.signOut().then(() => { onAccess(); renderAll(); toast(t('acct_bye')); }); break;
    case 'acct-portal': haptic(); toast(t('pay_open')); pay.portal().catch(() => toast(t('pay_err_net'))); break;
    case 'acct-pair': haptic(); pay.pairCode().then((c) => toast(tf('acct_pair_code', { c: c.slice(0, 3) + ' ' + c.slice(3) }))).catch(() => toast(t('pay_err_net'))); break;
    case 'acct-code': {   // вход кодом с устройства, где уже вошли (например, вход прошёл в Safari, а приложение — на экране Домой)
      haptic(); const c = (prompt(t('acct_code_ask')) || '').replace(/\D/g, '');
      if (c.length === 6) pay.redeem(c).then(() => { onAccess(); renderAll(); toast(tf('acct_hi', { e: pay.user()?.email || '' })); }).catch((e) => toast(t(e.status === 429 ? 'acct_code_slow' : 'acct_code_bad')));
      break;
    }
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
    case 'ob-platform': haptic(); obPickThen(el, () => { ui.obPlatform = v; finishOnboarding('map'); }); break;   // Игорь 22.11.2026: после платформы — карта Майами
    case 'ob-back': haptic(); if (!obBusy) obGo('welcome', -1); break;
    case 'ob-start': haptic(); ui.obGame = 'gta6'; obGo('platform', 1); break;   // шаг выбора игры убран: сразу GTA 6 (20.11.2026)
    case 'ob-next':
      haptic();
      if (obBusy) break;
      if (ui.obStep === 'game') obGo('platform');
      else finishOnboarding('map');
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
// комбинации в списках — ровными рядами (js/icons.js balanceCombos): после любой перерисовки и при смене ширины
{ let q = 0; const run = () => { q = 0; balanceCombos(); };
  const later = () => { if (!q) q = requestAnimationFrame(run); };
  new MutationObserver((ms) => { if (ms.some((m) => m.addedNodes.length)) later(); }).observe(document.getElementById('main') || document.body, { childList: true, subtree: true });
  addEventListener('resize', later); later(); }

// итог возврата из Google / Stripe / портала — одной строкой
function payToast(R) {
  if (!R) return;
  if (R.paid === 'ok') { toast(t('pay_ok')); closePaywall(); if (R.fresh) setTimeout(() => authSheet('setpw'), 2000); return; }
  if (R.paid === 'login') { closePaywall(); authSheet('login', { email: R.email, note: tf('au_linked', { e: R.email }) }); return; }
  if (R.paid === 'pending') { toast(t('pay_pending')); return; }
  if (R.paid === 'cancel') { toast(t('pay_cancel')); return; }
  if (R.paid === 'error') { toast(t('pay_err')); return; }
  if (R.portal) { toast(t(pay.proActive() ? (pay.pro()?.cancel ? 'pay_portal_end' : 'pay_portal') : 'pay_portal_off')); return; }
  if (R.login === 'ok') toast(pay.proActive() ? t('pay_restored') : tf('acct_hi', { e: pay.user()?.email || '' }));
  else if (R.login === 'error') toast(t('acct_err'));
  else if (R.login === 'cancel') toast(t('acct_cancel'));
}
// вернулись в приложение (портал в другой вкладке, долгий фон) — свежий статус Pro
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && pay.signedIn() && Date.now() - (pay.state().checked || 0) > 60e3) pay.refresh().then(() => onAccess()).catch(() => { });
});

// ───────── старт ─────────
(async function init() {
  setLang(store.lang || (navigator.language || 'ru').slice(0, 2));
  applyTheme(); applySkin();
  // данные Главной (места и лента «Новое») — качаем сразу, параллельно с профилем и кодами; Главная не ждёт их, а рисует скелетон
  if (MAP_GAMES.includes(store.game)) loadPlaces(store.game);
  loadNews();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // новая версия на сервере → перезагрузка в свежую (только если уже была старая)
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
    // первый запуск: офлайн-кэш ставим ПОСЛЕ первого экрана — иначе на слабой сети он качает оболочку (~1 МБ)
    // одновременно со страницей и Главная ждёт вдвое дольше (замер 23.11.2026). Уже стоящий SW — проверяем обновление сразу.
    let regd = false;
    const reg = () => { if (regd) return; regd = true; navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => { }); };
    // первый раз — после прогрева карты (её файлы уже в HTTP-кэше, установка не качает их второй раз) или когда карта
    // открылась и легла, но не позже 20 с после первого экрана
    if (hadController) reg();
    else { swAfterWarm = reg; addEventListener('sb:map-idle', () => setTimeout(reg, 4000), { once: true }); afterFirstScreen(reg, 20000); }   // не в момент, когда «запасная карта» грузит «Жизнь»
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();
  // пробный доступ: 72 часа с первого открытия на устройстве (если сервер не дал trial_until)
  if (!store.trialStart) { store.trialStart = Date.now(); save(); }
  // Игорь 20.11.2026: приложение про GTA 6 — у всех (и у прежних пользователей) один раз открываем GTA 6; прошлые части — в Настройках
  if (!store.g6) { store.game = 'gta6'; store.g6 = 1; save(); }
  // профиль SB.api: доступ (Pro, рабочий Pro, пробный, подарок, страна). Источник выбирает js/api.js: закрытый доступ на
  // устройстве (новый человек — гость), demo для съёмки (включает экран «Для админов»), ?sbmock — только на localhost
  // рефералка: ссылка креатора (?r=КОД) и запуск «на экране Домой» → закрепление на сервере (js/ref.js), не ждём ответа
  ref.boot({ onboarded: () => store.onboarded, payToken: () => (pay.signedIn() ? pay.state().token : null) }).catch(() => { });
  const apiP = import('./api.js').then(() => { const api = window.SB.api; return api && (!api.isMock || api.useProfile || api.mockChosen) ? api.getProfile() : null; }).catch(() => null);
  const ret = pay.handleReturn().catch(() => ({}));
  pay.loadFeatures();   // что умеет сервер оплаты (промокоды, оплата внутри) — заранее, чтобы пейвол открылся сразу полным
  const [P, R] = await Promise.all([apiP, ret, loadGame(store.game).catch(() => { })]);
  acc.P = P; lastAccess = access();
  renderAll();
  payToast(R);
  if ((R?.login === 'ok' || R?.paid === 'ok') && pay.signedIn()) ref.syncPay(pay.state().token, true);   // аккаунт и оплата → креатору
  if (pay.signedIn() && !R?.login && !R?.paid && !R?.portal) pay.refresh().then(() => onAccess()).catch(() => { });
  // ссылка «поделиться местом» (…/?open=place:gta5:<id>): друг сразу видит это место (и без Pro); знакомство — в следующий раз
  // ключ проверяем по виду: мусор в ?open= молча открывал пейвол карты (QA 20.11.2026)
  const openRaw = new URLSearchParams(location.search).get('open');
  const walkKey = /^walk:gta6(:[\w-]{1,80})?$/.exec(openRaw || '');
  if (walkKey) { history.replaceState(null, '', location.pathname); if (store.onboarded) setTimeout(() => openWalk('link', 'gta6', (walkKey[1] || '').slice(1)), 0); }
  const openKey = /^(place|egg|db|guide):(gta6|gta5):[\w.-]{1,120}$/.test(openRaw || '') ? openRaw : null;
  if (openRaw && !openKey && !walkKey) { history.replaceState(null, '', location.pathname); toast(t('place_nf')); }
  if (openKey) { store.linkKeys = [openKey, ...store.linkKeys.filter((k) => k !== openKey)].slice(0, 5); save(); history.replaceState(null, '', location.pathname); if (openKey.startsWith('guide:')) openGuideKey(openKey, 'link', true); else openOnMap(openKey); }
  else if (/[?&#]admin\b/.test(location.search + location.hash)) {   // экран «Для админов» (только веб): ?admin или #admin
    store.onboarded = true; save(); if (location.hash) history.replaceState(null, '', location.pathname + location.search); window.SB.openCreator('admin');
  }
  else if (!store.onboarded) showOnboarding();
  // перезагрузка посреди знакомства на карте (QA 22.11: тур и анимация кодов пропадали навсегда) — продолжить с карты
  else if (!store.tourMap) startTour();   // с кода, если до него не дошли; иначе — карта
  backGuard();
  document.body.classList.add('ready');
  requestAnimationFrame(guardTabbar);
  // карта «Игра», потом «Жизнь» — прогрев в простое, пока человек на Главной: вкладка карты откроется без ожидания
  // прогрев — как только показано главное фото Главной (не ждём остальных картинок): к тапу по карте она уже в пути
  // во время знакомства (body.in-tour) прогрев зовёт сам онбординг — второй не запускаем
  if (store.onboarded) afterHero(() => { if (document.body.classList.contains('in-tour')) return; new Image().src = mapPhUrl(MAP_OF(store.game)); window.SB.prewarmMap(); }, 600);
  // фото эпох для офлайна — когда канал свободен: карта открылась и плитки легли (+6 с) или через 45 с без карты
  addEventListener('sb:map-idle', () => setTimeout(warmUI, 10000), { once: true });
  afterFirstScreen(warmUI, 45000);
  checkTrialEnd();
  // таймер пробного: строка «ещё …» и конец пробного без перезапуска
  setInterval(() => { if (access() !== lastAccess || access() === 'trial') onAccess(); }, 30000);
})();
