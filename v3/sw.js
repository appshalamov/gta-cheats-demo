// Офлайн-кэш. Оболочка — из кэша (быстро), данные data/*.json — сначала из сети,
// чтобы новые коды (например, GTA 6 после релиза) появлялись без обновления приложения.
// При изменении файлов оболочки поднимите VERSION.
// v2/glass-city: своя ветка номеров (v2-N, на основе main v72), при слиянии в main взять следующий свободный номер
const VERSION = 'v3-v2-10';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'css/onboarding.css', 'css/hub.css', 'css/layout.css',
  'js/app.js', 'js/config.js', 'js/i18n.js', 'js/icons.js', 'js/map.js', 'js/map-icons.js', 'js/places.js',
  'vendor/maplibre/maplibre-gl.js', 'vendor/maplibre/maplibre-gl.css',
  'data/gta5.json', 'data/gta6.json', 'data/gtasa.json', 'data/gtavc.json', 'data/gta4.json', 'data/gta3.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  // v2: токены, слой стекла, смена игры, значки, шрифт, знак
  'css/tokens.css', 'css/v2.css', 'css/v2-map.css', 'js/skin.js', 'js/sprite.js', 'js/roles.js', 'css/v2-roles.css', 'fonts/onest.woff2', 'icons/mark.svg', 'icons/favicon.svg',
];
// Картинки эпох (img/ui/<скин>/): критичный набор GTA 6 и GTA 5 — с установкой, чтобы смена игры работала офлайн;
// остальное — при обращении и по просьбе skin.js ({type: 'warm'}). Отдельный кэш, переживает обновления оболочки.
const UI = 'v3-ui-v2-10';
const UI_CRITICAL = ['gta6/gta6-banner-01', 'gta6/gta6-load-02', 'gta5/gta5-banner-01', 'gta5/gta5-load-01']
  .flatMap((n) => [`img/ui/${n}.avif`, `img/ui/${n}.webp`]);
async function uiAsset(req) {
  const c = await caches.open(UI);
  const hit = await c.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const r = await fetch(req).catch(() => null);
  if (r && r.ok) c.put(req, r.clone());
  return r || Response.error();
}
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'warm' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(UI).then((c) => Promise.all(e.data.urls.filter((u) => /^img\/ui\//.test(u)).map((u) =>
    c.match(u).then((hit) => hit || fetch(u).then((r) => r.ok && c.put(u, r))).catch(() => { })))));
});

self.addEventListener('install', (e) => {
  // cache: 'reload' — мимо HTTP-кэша браузера, иначе в новую версию может попасть старый файл
  e.waitUntil(Promise.all([
    caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))),
    caches.open(UI).then((c) => c.addAll(UI_CRITICAL)).catch(() => { }),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('v3-') && k !== VERSION && k !== UI).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && e.request.destination === 'image' && isPhoto(url)) { e.respondWith(photo(e.request, e)); return; }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/img/ui/')) { e.respondWith(uiAsset(e.request)); return; }
  if (url.pathname.includes('/data/')) {
    e.respondWith(fetch(e.request).then((r) => {
      const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
