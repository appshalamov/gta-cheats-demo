// Офлайн-кэш. Оболочка — из кэша (быстро). Данные data/*.json: запросы «в реальном времени» (cache: 'no-cache' —
// места, лента) — сначала сеть, но не дольше 3 с, затем кэш; остальные (карта, коды) — сразу из кэша и в фоне обновить
// (23.11.2026: на слабой сети Главная ждала 1–2 МБ данных при каждом запуске). Плитки карты (своя карта игры и OpenFreeMap) — свой кэш, переживает обновления приложения.
// При изменении файлов оболочки поднимите VERSION.
const VERSION = 'v137';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/styles.css', 'css/onboarding.css', 'css/hub.css', 'css/layout.css', 'css/map-glass.css', 'css/skin.css', 'css/league.css', 'css/sections.css', 'css/guide.css', 'js/app.js', 'js/config.js', 'js/i18n.js', 'js/icons.js', 'js/map.js', 'js/mapstyle.js', 'js/places.js', 'js/live.js', 'js/skin.js', 'js/league.js', 'js/api.js', 'js/demo-data.js', 'js/pay.js', 'js/ref.js', 'js/tour.js', 'js/guide.js', 'js/guide-core.js', 'js/guide-hub.js', 'data/guide/index-gta6.json', 'js/guide-menu.js', 'js/guide-set.js', 'js/guide-stories.js', 'js/hub-cover.js', 'data/guide/gta6-settings.json', 'css/walk.css', 'js/walk.js', 'data/guide/missions.json', 'data/guide/walk-stories-gta6.json', 'vendor/maplibre/maplibre-gl.js', 'vendor/maplibre/maplibre-gl.css', 'data/gta5.json', 'data/gta6.json', 'data/news.json', 'css/saves.css', 'js/saves.js', 'data/guide/saves.json', 'css/endings.css', 'js/endings.js', 'data/guide/endings-gta6.json', 'js/progress.js', 'css/progress.css', 'data/guide/trophies.json', 'js/creators.js',
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

// Первая установка: страница регистрирует SW после прогрева карты (js/app.js), так что оболочка вместе с картой
// (maplibre, map.js) уже лежит в HTTP-кэше — установка берёт её оттуда без сети, и Chrome заранее компилирует
// скрипты, положенные при установке (тёплый старт карты быстрее на ~0,6 с). Не нужное сразу (раздел авторов,
// знакомство, большие значки) при первой установке не качаем — ляжет в кэш при первом обращении (fetch ниже).
// 23.11.2026: раньше первая установка качала ~600 КБ, ровно когда человек открывал Главную или карту на 3G.
const LAZY = new Set(['js/league.js', 'js/tour.js', 'js/guide.js', 'css/guide.css', 'js/guide-hub.js', 'data/guide/index-gta6.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'js/guide-menu.js', 'js/guide-set.js', 'js/guide-stories.js', 'js/hub-cover.js', 'data/guide/gta6-settings.json', 'js/walk.js', 'css/walk.css', 'data/guide/missions.json', 'data/guide/walk-stories-gta6.json', 'js/saves.js', 'css/saves.css', 'js/endings.js', 'css/endings.css', 'data/guide/endings-gta6.json', 'js/progress.js', 'css/progress.css', 'data/guide/trophies.json', 'js/creators.js']);
self.addEventListener('install', (e) => {
  // обновление: cache: 'reload' — мимо HTTP-кэша браузера, иначе в новую версию может попасть старый файл; всё, как раньше.
  // Первая установка (своих кэшей ещё нет): только то, что уже скачала сама страница, — из HTTP-кэша, без второй закачки;
  // фото эпох — по сигналу страницы после прогрева карты (message 'warm-ui').
  e.waitUntil(caches.keys().then((ks) => {
    const first = !ks.some((k) => family(k) === family(VERSION));
    const list = first ? SHELL.filter((u) => !LAZY.has(u)) : SHELL;
    return Promise.all([caches.open(VERSION).then((c) => c.addAll(list.map((u) => new Request(u, { cache: first ? 'default' : 'reload' })))), first ? null : uiPrecache()]);
  }).then(() => self.skipWaiting()));
});
self.addEventListener('message', (e) => { if (e.data === 'warm-ui') e.waitUntil(uiPrecache()); });
// своё из оболочки, чего нет в кэше (LAZY при первой установке): из сети и в кэш версии — дальше работает без сети
const shellish = (p) => /\/(js|css|vendor|fonts|icons)\/[^?]+\.(js|css|woff2|svg|png)$/.test(p);
// искать только в кэше версии: caches.match по всем кэшам с ignoreSearch перебирает и тысячи плиток (+0,7 с к карте, 23.11.2026)
let shellC = null;
const shell = () => (shellC ||= caches.open(VERSION));
async function own(req, ev, url) {
  const hit = await (await shell()).match(req, { ignoreSearch: true });
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok && shellish(url.pathname)) { const copy = r.clone(); ev.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => { })); }
  return r;
}
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
  (u.origin === location.origin && (u.pathname.includes('/img/map/') || u.pathname.includes('/img/guide/')))   // img/guide — кадры и обложки сторис (опись 28.11, п. 7)
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
// данные: сразу из кэша (если есть), в фоне — свежие с сервера в кэш; нет в кэше — из сети (и в кэш)
// фоновая проверка свежести — не на каждый запрос: тот же файл просят и предзагрузка, и приложение, и карта
// (WebKit 23.11.2026: data/map 265 КБ качался дважды на каждом запуске). Данные карты — раз в 30 мин, остальное — раз в минуту.
const revAt = {};
const revDue = (u) => { const now = Date.now(), gap = /\/data\/map\//.test(u) ? 30 * 6e4 : 6e4; if (now - (revAt[u] || 0) < gap) return false; revAt[u] = now; return true; };
async function data(req, ev) {
  const hit = await (await shell()).match(req, { ignoreSearch: true });
  // «в реальном времени» (places.js/loadNews: cache 'no-cache'): сначала сеть, но не дольше 3 с — дальше кэш,
  // а свежая версия ляжет в кэш в фоне (на 3G Главная не ждёт 265 КБ мест, 23.11.2026)
  if (hit && (req.cache === 'no-cache' || req.cache === 'reload')) {
    const net = fetch(req).then((r) => {
      if (r.ok) { const copy = r.clone(); ev.waitUntil(shell().then((c) => c.put(req, copy)).catch(() => { })); }
      return r;
    });
    ev.waitUntil(net.catch(() => { }));
    return Promise.race([net.then((r) => (r.ok ? r : hit)).catch(() => hit), new Promise((ok) => setTimeout(() => ok(hit), 3000))]);
  }
  if (hit && !revDue(new URL(req.url).pathname)) return hit;
  // есть в кэше — отдаём, а свежую версию берём с проверкой на сервере (no-cache); нет — обычный запрос
  // (HTTP-кэш браузера свежий 10 мин: без лишней проверки по сети, на 3G это ~0,6 с)
  const net = fetch(req, hit ? { cache: 'no-cache' } : undefined).then((r) => {
    if (r.ok) { const copy = r.clone(); ev.waitUntil(shell().then((c) => c.put(req, copy)).catch(() => { })); }
    return r;
  });
  if (hit) { ev.waitUntil(net.catch(() => { })); return hit; }
  return net.catch(() => Response.error());
}
// Плитки карты: игра (gta-map-assets/maps/tiles, gtadb) и «Жизнь» (OpenFreeMap: стиль, плитки, шрифты, значки).
// Сами плитки по адресу не меняются — из кэша без сети; описание набора (TileJSON) и стиль — из кэша и в фоне обновить.
// Сменили картинки плиток под теми же адресами — поднять TILES (tiles-v1 → v2).
const TILES = 'tiles-v1', TILES_MAX = 4000;
const isTile = (u) => (u.host === 'appshalamov.github.io' && u.pathname.startsWith('/gta-map-assets/maps/tiles/'))
  || (u.host === 'raw.githubusercontent.com' && /^\/rolux\/gtadb\.org\/.*\/tiles\//.test(u.pathname))
  || u.host === 'tiles.openfreemap.org';
let tilePuts = 0;
let tilesC = null;   // один раз открытый кэш плиток: карта просит десятки плиток разом
async function tile(req, ev) {
  const c = await (tilesC ||= caches.open(TILES));
  const hit = await c.match(req.url);
  const fixed = /\.(pbf|png|jpe?g|webp|mvt)$/i.test(new URL(req.url).pathname);
  if (hit && fixed) return hit;
  // сам запрос карты (cors, с отменой: карта сдвинулась — плитка не докачивается зря)
  const net = fetch(req).then((r) => {
    if (r.ok && r.type !== 'opaque') ev.waitUntil(c.put(req.url, r.clone()).then(() => { if (++tilePuts % 100 === 0) return trimTiles(c); }).catch(() => { }));
    return r;
  });
  if (hit) { ev.waitUntil(net.catch(() => { })); return hit; }
  return net;
}
async function trimTiles(c) {   // не больше TILES_MAX: самые старые — вон
  const ks = await c.keys();
  for (const k of ks.slice(0, Math.max(0, ks.length - TILES_MAX))) await c.delete(k);
}
// Живой контент live.sbgta.app (js/live.js, 23.11.2026): JSON — сначала сеть, без сети — последний ответ из кэша live-v1
// (лента и новые места остаются офлайн); картинки — из кэша сразу, в фоне обновить. Кэш не привязан к VERSION.
const LIVE_C = 'live-v1';
const isLive = (u) => u.host === 'live.sbgta.app';
async function live(req, ev, url) {
  const c = await caches.open(LIVE_C);
  const net = fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); ev.waitUntil(c.put(req.url, copy).catch(() => { })); } return r; });
  if (url.pathname.startsWith('/img/')) {
    const hit = await c.match(req.url);
    if (hit) { ev.waitUntil(net.catch(() => { })); return hit; }
    return net;
  }
  return net.then((r) => (r.ok ? r : c.match(req.url).then((h) => h || r))).catch(() => c.match(req.url).then((h) => h || Response.error()));
}
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && isLive(url)) { e.respondWith(live(e.request, e, url)); return; }
  if (e.request.method === 'GET' && isTile(url)) { e.respondWith(tile(e.request, e)); return; }
  if (e.request.method === 'GET' && e.request.destination === 'image' && isPhoto(url)) { e.respondWith(photo(e.request, e)); return; }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // фото эпох (img/ui/<скин>/): сразу из кэша, в фоне обновить; без кэша — из сети и в кэш.
  // Берётся только формат, который выбрал браузер (AVIF или WebP), поэтому не в SHELL — там качались бы оба.
  if (url.pathname.includes('/img/ui/')) { e.respondWith(uiImg(e.request, e)); return; }
  if (url.pathname.includes('/data/')) { e.respondWith(data(e.request, e)); return; }
  e.respondWith(own(e.request, e, url));
});
