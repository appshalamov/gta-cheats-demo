// Офлайн-кэш. Оболочка — из кэша (быстро), данные data/*.json — сначала из сети,
// чтобы новые коды (например, GTA 6 после релиза) появлялись без обновления приложения.
// При изменении файлов оболочки поднимите VERSION.
const VERSION = 'v29';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'css/onboarding.css', 'css/hub.css', 'css/layout.css',
  'js/app.js', 'js/config.js', 'js/i18n.js', 'js/icons.js', 'js/map.js', 'js/places.js',
  'vendor/maplibre/maplibre-gl.js', 'vendor/maplibre/maplibre-gl.css',
  'data/gta5.json', 'data/gta6.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' — мимо HTTP-кэша браузера, иначе в новую версию может попасть старый файл
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/data/')) {
    e.respondWith(fetch(e.request).then((r) => {
      const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
