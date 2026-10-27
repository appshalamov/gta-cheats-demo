// Офлайн-кэш. Оболочка — из кэша (быстро), данные data/*.json — сначала из сети,
// чтобы новые коды (например, GTA 6 после релиза) появлялись без обновления приложения.
// При изменении файлов оболочки поднимите VERSION.
const VERSION = 'v80';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/styles.css', 'css/onboarding.css', 'css/hub.css', 'css/layout.css', 'css/map-glass.css', 'css/skin.css', 'css/league.css',
  'js/app.js', 'js/config.js', 'js/i18n.js', 'js/icons.js', 'js/map.js', 'js/places.js', 'js/skin.js', 'js/league.js', 'js/api.js', 'js/demo-data.js',
  'vendor/maplibre/maplibre-gl.js', 'vendor/maplibre/maplibre-gl.css',
  'data/gta5.json', 'data/gta6.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg',
  'icons/brand-lockup-dark.svg', 'icons/brand-lockup-light.svg', 'icons/brand-mark.svg', 'icons/brand-mark-light.svg', 'fonts/onest.woff2',
];

// Картинки эпох (img/ui/<скин>/) — свой кэш «сразу из кэша, в фоне обновить», привязан к VERSION: с новой версией старый
// кэш удаляется в activate, и картинки, заменённые под теми же именами (пакет 2 этапа 5), приходят сразу, а не со второго показа.
// Цена — ~210 КБ критичного набора заново при каждом поднятии VERSION.
// Критичный набор кладём при установке: первый баннер Главной и «вид» (смена игры, пейвол, онбординг) GTA 6 и GTA 5 —
// смена игры и Главная без сети открываются с фото. Формат — AVIF (его берёт <picture> на iOS и в Chrome);
// WebP — запас для браузеров без AVIF, кэшируется при обращении. Обложки категорий, карточки игр, предметы сюда не кладём.
const UI = 'ui-' + VERSION, UI_MAX = 120;
// В iOS-сборке со своими картинками (config.js OWN_ART) пути здесь — img/ui/<скин>/own/….
const UI_CRIT = ['img/ui/gta6/gta6-banner-01.avif', 'img/ui/gta6/gta6-load-02.avif', 'img/ui/gta5/gta5-banner-01.avif', 'img/ui/gta5/gta5-load-01.avif'];
// докачать недостающие; уже лежащие не качаем заново (обновятся в фоне при показе). Сбой сети установку не валит.
const uiPrecache = () => caches.open(UI).then((c) => Promise.all(UI_CRIT.map((u) => c.match(u).then((hit) => hit || c.add(new Request(u, { cache: 'reload' }))))))
  .catch(() => { });

self.addEventListener('install', (e) => {
  // cache: 'reload' — мимо HTTP-кэша браузера, иначе в новую версию может попасть старый файл
  e.waitUntil(Promise.all([caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))), uiPrecache()])
    .then(() => self.skipWaiting()));
});
// Прод, /beta/, /design/ и /v3/ живут на одном домене и делят хранилище кэшей: удаляем только старые версии своего
// семейства (v73 → v74, beta-v73 → beta-v74), чужие не трогаем. До 21.10.2026 каждая версия стирала кэши остальных —
// открыл прод, и бета или /design/ без сети не открывались (тест 21.10).
const family = (k) => k.replace(/\d+$/, '');
self.addEventListener('activate', (e) => {
  // удаляем только старые версии своего семейства (design-v74 → design-v75, ui-design-v74 → …); прод, бета, v3 и общий кэш фото не трогаем
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== UI && (family(k) === family(VERSION) || family(k) === family(UI))).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Фото мест (кадры игры, фото из жизни) — отдельный кэш, переживает обновления приложения: второй раз карточка
// открывается мгновенно и на слабом интернете (Игорь 15.10.2026: «на слабом интернете хуже открывается»).
// Чужие сайты (хостинг кадров, gtadb, Commons) отдают CORS — берём копию в режиме cors (не «непрозрачную»).
const PHOTOS = 'photos-v2', PHOTOS_MAX = 600;
const isPhoto = (u) => /\.(jpe?g|png|webp)$/i.test(u.pathname) && (
  (u.origin === location.origin && u.pathname.includes('/img/map/'))
  || u.host === 'appshalamov.github.io' && /^\/gta-map-assets\/(map\/photos|official)\//.test(u.pathname)   // official/ — чистые кадры GTA 6
  || u.host === 'raw.githubusercontent.com' && u.pathname.startsWith('/rolux/gtadb.org/')
  || u.host === 'upload.wikimedia.org');
async function photo(req, ev) {
  const c = await caches.open(PHOTOS);
  const hit = await c.match(req.url);
  // свои фото (img/map) могут замениться под тем же адресом (15.10.2026: люк LOST — старое фото держалось из кэша):
  // отдаём из кэша сразу, а в фоне обновляем — следующее открытие уже с новым снимком. Чужие (кадры, gtadb, Commons) не меняются.
  if (hit && new URL(req.url).origin === location.origin) {
    ev.waitUntil(fetch(req.url, { cache: 'no-cache' }).then((r) => r.ok && c.put(req.url, r)).catch(() => { }));
    return hit;
  }
  if (hit) return hit;
  const r = await fetch(req.url, { mode: 'cors', credentials: 'omit' }).catch(() => null);
  if (r && r.ok) {
    c.put(req.url, r.clone()).then(async () => {   // держим не больше PHOTOS_MAX снимков: старые — вон
      const ks = await c.keys(); for (const k of ks.slice(0, Math.max(0, ks.length - PHOTOS_MAX))) c.delete(k);
    }).catch(() => { });
    return r;
  }
  return fetch(req);   // CORS не дали — как обычная картинка
}
async function uiImg(req, ev) {
  const c = await caches.open(UI);
  const hit = await c.match(req, { ignoreSearch: true });
  const net = fetch(req).then((r) => {
    if (r.ok) ev.waitUntil(c.put(req, r.clone()).then(() => uiTrim(c)).catch(() => { }));
    return r;
  });
  if (hit) { ev.waitUntil(net.catch(() => { })); return hit; }
  return net.catch(() => Response.error());
}
async function uiTrim(c) {   // не больше UI_MAX картинок: самые старые — вон, критичный набор не трогаем
  const ks = (await c.keys()).filter((k) => !UI_CRIT.some((u) => k.url.endsWith(u)));
  const n = ks.length + UI_CRIT.length - UI_MAX;
  for (const k of ks.slice(0, Math.max(0, n))) await c.delete(k);
}
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && e.request.destination === 'image' && isPhoto(url)) { e.respondWith(photo(e.request, e)); return; }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // фото эпох (img/ui/<скин>/): сразу из кэша, в фоне обновить; без кэша — из сети и в кэш.
  // Берётся только формат, который выбрал браузер (AVIF или WebP), поэтому не в SHELL — там качались бы оба.
  if (url.pathname.includes('/img/ui/')) { e.respondWith(uiImg(e.request, e)); return; }
  if (url.pathname.includes('/data/')) {
    e.respondWith(fetch(e.request).then((r) => {
      const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
