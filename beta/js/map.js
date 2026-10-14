// Вкладка «Карта»: реальные места GTA 6 (Майами / Флорида) и GTA 5 (Лос-Анджелес).
// MapLibre GL (vendor/maplibre) грузится лениво при первом открытии вкладки.
// Подложка — OpenFreeMap (векторная, OpenStreetMap, без ключа). Точки — GeoJSON-слои кружков.
// Данные: data/map/<game>.json (места + пасхалки), data/map/gtadb_<game>.json (слой сообщества).
// Интерфейс карточек — «картинки и значки прежде слов»: пара фото «в игре / в реальности»,
// пиктограммы типа места, доступа и точности совпадения, короткие подписи на языке устройства.
// Свои клики обрабатываем здесь через атрибут data-mp (app.js их не трогает).

import { t, L as tr, getLang } from './i18n.js';

const COLORS = { confirmed: '#22c3d9', likely: '#f5b942', speculative: '#9a8cab', egg: '#f472b6', gtadb: '#8b93a1' };
const GAMES = {
  gta6: { title: 'GTA 6', place: { ru: 'Vice City → Майами', en: 'Vice City → Miami' }, real: { ru: 'Майами', en: 'Miami' }, gameCity: { ru: 'Вайс-Сити', en: 'Vice City' } },
  gta5: { title: 'GTA 5', place: { ru: 'Los Santos → Лос-Анджелес', en: 'Los Santos → Los Angeles' }, real: { ru: 'Лос-Анджелес', en: 'Los Angeles' }, gameCity: { ru: 'Лос-Сантос', en: 'Los Santos' } },
};
// ── режим «Карта игры»: точки по координатам игры (gm из build_map), подложка — плитки gtadb.
// Мир игры −16384…16384 единиц ↔ веб-Меркатор; плитка gtadb z ↔ плитка MapLibre z+2 (переписывает transformRequest).
// Бета «карта игры в основе» (гипотеза Игоря 14.10.2026: миру известна карта GTA 5 — люди ищут, что из игры есть в жизни).
export const BETA = /\/beta\//.test(location.pathname) || new URLSearchParams(location.search).has('beta');
let mode = !BETA ? 'real' : (() => { try { return localStorage.getItem('secret.map.mode') === 'real' ? 'real' : 'game'; } catch { return 'game'; } })();
let wantMode = mode;     // что выбрал человек; у игры без своей карты (GAME_MAP) показываем реальную
// Карта игры GTA 6 выключена (14.10.2026): фанатская карта Леониды (yanis) и игровые координаты GTA 6 в gtadb собраны
// с опорой на утечки 2022 и 2026 годов (так пишет сам gtadb в FAQ), а правило проекта — утечки не показывать.
// Включать только вместе с новой подложкой из вышедшей игры — не по дате.
// До выхода в бете — своя приблизительная карта «Леонида» (Игорь 14.10.2026: «давай её нарисуем в стиле GTA 5,
// чтобы примерно показывать, где будет локация; точно обновим, когда выйдет»): реальная Флорида из OpenStreetMap
// в стиле радара GTA 5 с акцентами GTA 6 и официальными названиями регионов. Не по утечкам. 'approx' — точки по реальным
// координатам; true — плитки игры и игровые координаты (gm).
const GAME_MAP = { gta5: true, gta6: BETA ? 'approx' : false };
const approx = (g = game) => GAME_MAP[g] === 'approx';
const tilesGame = () => mode === 'game' && !approx();   // карта игры из плиток: свои зумы (2…8) и игровые координаты
// категории для игрока (бета): цвет, подпись, что тут делать, какие читы открыть
const CATS = {
  w: { c: '#ff5a5a', t: { ru: 'Оружие', en: 'Weapons' }, what: { ru: 'Оружейный магазин: оружие, патроны, бронежилеты, модификации.', en: 'Gun store: weapons, ammo, body armor, attachments.' }, cheat: 'weapon', ct: { ru: 'Читы на оружие', en: 'Weapon cheats' } },
  c: { c: '#3b9cff', t: { ru: 'Машины', en: 'Cars' }, what: { ru: 'Машины: тюнинг, покраска, покупка и продажа.', en: 'Cars: tuning, paint, buying and selling.' }, cheat: 'vehicle', ct: { ru: 'Читы на машины', en: 'Vehicle cheats' } },
  h: { c: '#f5b942', t: { ru: 'Ограбления', en: 'Heists' }, what: { ru: 'Банк или ювелирный: место ограблений и миссий.', en: 'Bank or jeweler: a heist and mission spot.' }, cheat: 'player', ct: { ru: 'Читы на игрока', en: 'Player cheats' } },
  s: { c: '#b07cff', t: { ru: 'Магазины', en: 'Shops' }, what: { ru: 'Магазин: одежда, маски, стрижки или тату для персонажа.', en: 'Shop: clothes, masks, haircuts or tattoos for your character.' } },
};
let activeCat = null;
const G2M = (gx, gy) => { const fx = (gx + 16384) / 32768, fy = (16384 - gy) / 32768; return [fx * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * fy))) * 180 / Math.PI]; };
const ll = (x) => (!tilesGame() ? [x.lon, x.lat] : x.gm ? G2M(x.gm[0], x.gm[1]) : null);
const llPt = (q) => (!tilesGame() ? [q[5], q[4]] : q[11] ? G2M(q[11][0], q[11][1]) : null);
// ───── «Леонида» — приблизительная карта GTA 6 до выхода игры ─────
// Регионы — официальные названия Rockstar и их реальные прототипы (проверено по официальным материалам, без утечек).
// Источник и проверка — «Карта локаций GTA — реальный мир/данные/регионы_gta6_официальные.json» (tier: 0 штат, 1 регион, 2 округ, 3 район).
const LEONIDA_REGIONS = [
  { name: "Leonida", tier: 0, lat: 28.1, lon: -81.6 },
  { name: "Ambrosia", tier: 1, lat: 26.754, lon: -80.934 },
  { name: "Grassrivers", tier: 1, lat: 25.6, lon: -80.85 },
  { name: "Lake Leonida", tier: 1, lat: 26.9442, lon: -80.8029 },
  { name: "Leonida Keys", tier: 1, lat: 24.7136, lon: -81.0903 },
  { name: "Mount Kalaga National Park", tier: 1, lat: 30.65, lon: -84.97 },
  { name: "Port Gellhorn", tier: 1, lat: 29.812, lon: -85.303 },
  { name: "Vice City", tier: 1, lat: 25.7742, lon: -80.1936 },
  { name: "Vice Dale County", tier: 2, lat: 25.6, lon: -80.45 },
  { name: "Little Cuba", tier: 3, lat: 25.7656, lon: -80.2195 },
  { name: "Ocean Beach", tier: 3, lat: 25.779, lon: -80.1315 },
  { name: "Shore Drive", tier: 3, lat: 25.78, lon: -80.1306 },
  { name: "Stockyard", tier: 3, lat: 25.8014, lon: -80.1991 },
  { name: "Tisha-Wocka flea market", tier: 3, lat: 25.8905, lon: -80.2645 },
  { name: "VC Port", tier: 3, lat: 25.7735, lon: -80.1692 },
  { name: "Washington Beach", tier: 3, lat: 25.79, lon: -80.132 },
];
const LEO = { land: '#15171c', block: '#20232a', build: '#292d35', green: '#17221d', wet: '#14211f', sand: '#2b2922',
  water: '#0b2c37', road: '#555a64', major: '#9097a2', hwy: '#ff9a5c', glow: 'rgba(255,79,163,.30)', label: '#ffd0a6' };
function leonidaStyle() {
  const cls = (c) => ['match', ['get', 'class'], c, true, false];
  const w = (a, b, c) => ['interpolate', ['exponential', 1.5], ['zoom'], 6, a, 12, b, 17, c];
  const src = { source: 'omt' };
  return {
    version: 8, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '≈ GTA 6 по мотивам Флориды · © OpenStreetMap · OpenFreeMap' },
      regions: { type: 'geojson', data: fc(LEONIDA_REGIONS.map((r) => pt(r.lon, r.lat, { name: r.name, tier: r.tier }))) },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': LEO.land } },
      { id: 'lc-wet', type: 'fill', ...src, 'source-layer': 'landcover', filter: cls(['wetland']), paint: { 'fill-color': LEO.wet } },
      { id: 'lc-green', type: 'fill', ...src, 'source-layer': 'landcover', filter: cls(['wood', 'grass', 'farmland', 'scrub']), paint: { 'fill-color': LEO.green, 'fill-opacity': 0.8 } },
      { id: 'lc-sand', type: 'fill', ...src, 'source-layer': 'landcover', filter: cls(['sand']), paint: { 'fill-color': LEO.sand } },
      { id: 'lu-city', type: 'fill', ...src, 'source-layer': 'landuse', filter: cls(['residential', 'commercial', 'industrial', 'retail', 'suburb', 'neighbourhood']), paint: { 'fill-color': LEO.block } },
      { id: 'park', type: 'fill', ...src, 'source-layer': 'park', paint: { 'fill-color': LEO.green } },
      { id: 'water', type: 'fill', ...src, 'source-layer': 'water', paint: { 'fill-color': LEO.water } },
      { id: 'building', type: 'fill', ...src, 'source-layer': 'building', minzoom: 14, paint: { 'fill-color': LEO.build } },
      { id: 'rd-minor', type: 'line', ...src, 'source-layer': 'transportation', minzoom: 11, filter: cls(['minor', 'service', 'tertiary']),
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': LEO.road, 'line-width': w(0.2, 0.8, 7) } },
      { id: 'rd-major', type: 'line', ...src, 'source-layer': 'transportation', minzoom: 7, filter: cls(['primary', 'secondary', 'trunk']),
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': LEO.major, 'line-width': w(0.4, 1.5, 10) } },
      { id: 'hwy-glow', type: 'line', ...src, 'source-layer': 'transportation', filter: cls(['motorway']),
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': LEO.glow, 'line-width': w(2, 6, 20), 'line-blur': 3 } },
      { id: 'hwy', type: 'line', ...src, 'source-layer': 'transportation', filter: cls(['motorway']),
        layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': LEO.hwy, 'line-width': w(0.7, 2, 9) } },
      // подписи по уровням: штат — издалека, регионы — средний масштаб, районы Вайс-Сити — вблизи
      { id: 'lbl-state', type: 'symbol', source: 'regions', minzoom: 3, maxzoom: 6.5, filter: ['==', ['get', 'tier'], 0],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.3,
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 16, 6, 26], 'text-max-width': 9, 'text-allow-overlap': false, 'text-padding': 4 },
        paint: { 'text-color': '#ff8fbf', 'text-halo-color': 'rgba(0,0,0,.85)', 'text-halo-width': 1.6, 'text-opacity': 0.92 } },
      { id: 'lbl-region', type: 'symbol', source: 'regions', minzoom: 5.5, maxzoom: 11.5, filter: ['==', ['get', 'tier'], 1],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.16,
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 12, 9, 19, 11, 22], 'text-max-width': 9, 'text-allow-overlap': false, 'text-padding': 4 },
        paint: { 'text-color': LEO.label, 'text-halo-color': 'rgba(0,0,0,.85)', 'text-halo-width': 1.6, 'text-opacity': 0.92 } },
      { id: 'lbl-county', type: 'symbol', source: 'regions', minzoom: 8.5, maxzoom: 10.5, filter: ['==', ['get', 'tier'], 2],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.12,
          'text-size': 13, 'text-max-width': 9, 'text-allow-overlap': false, 'text-padding': 4 },
        paint: { 'text-color': '#c9b6a6', 'text-halo-color': 'rgba(0,0,0,.85)', 'text-halo-width': 1.6, 'text-opacity': 0.92 } },
      { id: 'lbl-district', type: 'symbol', source: 'regions', minzoom: 12, maxzoom: 17, filter: ['==', ['get', 'tier'], 3],
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-transform': 'uppercase', 'text-letter-spacing': 0.1,
          'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 15, 15], 'text-max-width': 9, 'text-allow-overlap': false, 'text-padding': 4 },
        paint: { 'text-color': '#ffe1c4', 'text-halo-color': 'rgba(0,0,0,.85)', 'text-halo-width': 1.6, 'text-opacity': 0.92 } },
    ],
  };
}
const gameStyle = (g) => ({
  version: 8, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { gtamap: { type: 'raster', tiles: [`https://gtadb-tile.invalid/${g}/{z}/{x}/{y}`], tileSize: 256, minzoom: 2, maxzoom: 8,
    attribution: 'gtadb.org (CC BY 4.0) · © Rockstar Games' } },
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': g === 'gta5' ? '#1b1f23' : '#0e0f12' } },
    { id: 'gtamap', type: 'raster', source: 'gtamap', paint: { 'raster-fade-duration': 150, ...(g === 'gta6' ? { 'raster-saturation': -1, 'raster-contrast': 0.35, 'raster-brightness-max': 0.42, 'raster-brightness-min': 0.04 } : { 'raster-saturation': -0.6, 'raster-brightness-max': 0.7, 'raster-contrast': 0.15 }) } }],
});
const gameStyleFor = (g) => (approx(g) ? leonidaStyle() : gameStyle(g));
function tileUrl(url) {   // https://gtadb-tile.invalid/gta5/6/40/52 → плитка gtadb z−2 в репозитории на GitHub
  const m = url.match(/^https:\/\/gtadb-tile\.invalid\/(gta[56])\/(\d+)\/(\d+)\/(\d+)$/);
  if (!m) return null;
  const c = GMAP[m[1]], z = +m[2] - 2;
  return `${tileBase(c.v)}maps/tiles/${c.v}/${c.set}/${z}/${z},${m[4]},${m[3]}.jpg`;
}
// Свой хостинг плиток и кадров игры (Игорь 14.10.2026: «используй мой GitHub»): копия нужного из gtadb.org (CC BY 4.0)
// в appshalamov/gta-map-assets на GitHub Pages — автор gtadb просит не тянуть живые файлы, у raw.githubusercontent лимиты.
// Фото из жизни (,rl.jpg) там нет — их у себя не храним (часто это кадры Street View), они идут ссылкой на gtadb.
const ASSETS = 'https://appshalamov.github.io/gta-map-assets/';
const GTADB_RAW = 'https://raw.githubusercontent.com/rolux/gtadb.org/main/';
const tileBase = (v) => (v === 5 ? ASSETS : GTADB_RAW);   // GTA 6 (yanis) не переносили: карта выключена
const STYLE = { dark: 'https://tiles.openfreemap.org/styles/dark', light: 'https://tiles.openfreemap.org/styles/positron' };

// ───── короткие подписи к значкам на многих языках (остальное понимается по картинке) ─────
const W = {
  game:   { en: 'In game', ru: 'В игре', es: 'En el juego', pt: 'No jogo', fr: 'En jeu', de: 'Im Spiel', it: 'Nel gioco', tr: 'Oyunda', uk: 'У грі', pl: 'W grze', zh: '游戏中', ja: 'ゲーム内', ko: '게임 속' },
  real:   { en: 'Real life', ru: 'В жизни', es: 'En la vida real', pt: 'Na vida real', fr: 'En vrai', de: 'In echt', it: 'Dal vivo', tr: 'Gerçekte', uk: 'У житті', pl: 'W realu', zh: '现实中', ja: '実際', ko: '실제' },
  route:  { en: 'Go there', ru: 'Проложить путь', es: 'Cómo llegar', pt: 'Como chegar', fr: 'Y aller', de: 'Route', it: 'Indicazioni', tr: 'Yol tarifi', uk: 'Маршрут', pl: 'Trasa', zh: '导航', ja: '経路', ko: '길찾기' },
  look:   { en: 'Look around 360°', ru: 'Осмотреться 360°', es: 'Ver en 360°', pt: 'Ver em 360°', fr: 'Voir à 360°', de: '360°-Ansicht', it: 'Vista a 360°', tr: '360° bak', uk: 'Огляд 360°', pl: 'Widok 360°', zh: '360° 街景', ja: '360°で見る', ko: '360° 둘러보기' },
  share:  { en: 'Share', ru: 'Поделиться', es: 'Compartir', pt: 'Compartilhar', fr: 'Partager', de: 'Teilen', it: 'Condividi', tr: 'Paylaş', uk: 'Поділитися', pl: 'Udostępnij', zh: '分享', ja: '共有', ko: '공유' },
  here:   { en: 'Several places here', ru: 'Здесь несколько мест', es: 'Varios lugares aquí', pt: 'Vários lugares aqui', fr: 'Plusieurs lieux ici', de: 'Mehrere Orte hier', it: 'Più luoghi qui', tr: 'Burada birkaç yer', uk: 'Тут кілька місць', pl: 'Kilka miejsc tutaj', zh: '这里有多个地点', ja: 'ここに複数の場所', ko: '여기에 여러 장소' },
  also:   { en: 'Also here', ru: 'Здесь же', es: 'También aquí', pt: 'Também aqui', fr: 'Aussi ici', de: 'Auch hier', it: 'Anche qui', tr: 'Burada ayrıca', uk: 'Тут же', pl: 'Także tutaj', zh: '这里还有', ja: 'ここにも', ko: '여기도' },
  back:   { en: 'Back', ru: 'Назад', es: 'Atrás', pt: 'Voltar', fr: 'Retour', de: 'Zurück', it: 'Indietro', tr: 'Geri', uk: 'Назад', pl: 'Wstecz', zh: '返回', ja: '戻る', ko: '뒤로' },
  close:  { en: 'Close', ru: 'Закрыть', es: 'Cerrar', pt: 'Fechar', fr: 'Fermer', de: 'Schließen', it: 'Chiudi', tr: 'Kapat', uk: 'Закрити', pl: 'Zamknij', zh: '关闭', ja: '閉じる', ko: '닫기' },
  vhint:  { en: 'Swipe ↔ to switch · ↓ to close', ru: 'Листайте ↔ разделы · ↓ закрыть', es: 'Desliza ↔ para cambiar · ↓ para cerrar', pt: 'Deslize ↔ para trocar · ↓ para fechar', fr: 'Glissez ↔ pour changer · ↓ pour fermer', de: 'Wischen ↔ wechseln · ↓ schließen', it: 'Scorri ↔ per cambiare · ↓ per chiudere', tr: '↔ kaydır değiştir · ↓ kapat', uk: 'Гортайте ↔ розділи · ↓ закрити', pl: 'Przesuń ↔ zmiana · ↓ zamknij', zh: '左右滑动切换 · 下滑关闭', ja: '左右にスワイプで切替 · 下で閉じる', ko: '좌우로 넘기기 · 아래로 닫기' },
  approx: { en: '≈ nearby', ru: '≈ рядом', es: '≈ cerca', pt: '≈ perto', fr: '≈ à côté', de: '≈ in der Nähe', it: '≈ vicino', tr: '≈ yakında', uk: '≈ поруч', pl: '≈ w pobliżu', zh: '≈ 附近', ja: '≈ 近く', ko: '≈ 근처' },
  approxT: { en: 'Approximate photo: taken nearby, not exactly this spot', ru: 'Примерное фото: снято рядом, не точно это место', es: 'Foto aproximada: tomada cerca, no exactamente aquí', pt: 'Foto aproximada: tirada perto, não exatamente aqui', fr: 'Photo approximative : prise à proximité', de: 'Ungefähres Foto: in der Nähe aufgenommen', it: 'Foto approssimativa: scattata nelle vicinanze', tr: 'Yaklaşık fotoğraf: yakında çekildi', uk: 'Приблизне фото: знято поруч, не точно тут', pl: 'Zdjęcie przybliżone: zrobione w pobliżu', zh: '近似照片：在附近拍摄', ja: '参考写真：近くで撮影', ko: '참고 사진: 근처에서 촬영' },
  noPhoto: { en: 'No photo yet', ru: 'Фото пока нет', es: 'Aún sin foto', pt: 'Ainda sem foto', fr: 'Pas encore de photo', de: 'Noch kein Foto', it: 'Ancora nessuna foto', tr: 'Henüz fotoğraf yok', uk: 'Фото поки немає', pl: 'Brak zdjęcia', zh: '暂无照片', ja: '写真はまだありません', ko: '아직 사진 없음' },
  life:   { en: 'Real life', ru: 'Жизнь', es: 'Vida real', pt: 'Vida real', fr: 'Réel', de: 'Echt', it: 'Reale', tr: 'Gerçek', uk: 'Життя', pl: 'Realnie', zh: '现实', ja: '現実', ko: '현실' },
  inGame: { en: 'Game', ru: 'Игра', es: 'Juego', pt: 'Jogo', fr: 'Jeu', de: 'Spiel', it: 'Gioco', tr: 'Oyun', uk: 'Гра', pl: 'Gra', zh: '游戏', ja: 'ゲーム', ko: '게임' },
  promo6: { en: 'GTA 6: Vice City spots in real Miami', ru: 'GTA 6: места Вайс-Сити в реальном Майами', es: 'GTA 6: lugares de Vice City en Miami', pt: 'GTA 6: locais de Vice City em Miami', fr: 'GTA 6 : lieux de Vice City à Miami', de: 'GTA 6: Vice-City-Orte in Miami', it: 'GTA 6: luoghi di Vice City a Miami', tr: 'GTA 6: Miami’de Vice City yerleri', uk: 'GTA 6: місця Вайс-Сіті в реальному Маямі', pl: 'GTA 6: miejsca Vice City w Miami', zh: 'GTA 6：迈阿密的罪恶都市地点', ja: 'GTA 6：マイアミのバイスシティの場所', ko: 'GTA 6: 마이애미 속 바이스 시티' },
  promo5: { en: 'GTA 5: Los Santos spots in real LA', ru: 'GTA 5: места Лос-Сантоса в реальном Лос-Анджелесе', es: 'GTA 5: lugares de Los Santos en LA', pt: 'GTA 5: locais de Los Santos em LA', fr: 'GTA 5 : lieux de Los Santos à LA', de: 'GTA 5: Los-Santos-Orte in LA', it: 'GTA 5: luoghi di Los Santos a LA', tr: 'GTA 5: LA’de Los Santos yerleri', uk: 'GTA 5: місця Лос-Сантоса в реальному Лос-Анджелесі', pl: 'GTA 5: miejsca Los Santos w LA', zh: 'GTA 5：洛杉矶的洛圣都地点', ja: 'GTA 5：ロサンゼルスのロスサントスの場所', ko: 'GTA 5: LA 속 로스 산토스' },
  places_n: { en: 'places', ru: 'мест', es: 'lugares', pt: 'locais', fr: 'lieux', de: 'Orte', it: 'luoghi', tr: 'yer', uk: 'місць', pl: 'miejsc', zh: '个地点', ja: 'か所', ko: '곳' },
  modeReal: { en: 'Real map', ru: 'Реальная карта', es: 'Mapa real', pt: 'Mapa real', fr: 'Carte réelle', de: 'Echte Karte', it: 'Mappa reale', tr: 'Gerçek harita', uk: 'Реальна мапа', pl: 'Prawdziwa mapa', zh: '真实地图', ja: '実際の地図', ko: '실제 지도' },
  modeGame: { en: 'Game map', ru: 'Карта игры', es: 'Mapa del juego', pt: 'Mapa do jogo', fr: 'Carte du jeu', de: 'Spielkarte', it: 'Mappa del gioco', tr: 'Oyun haritası', uk: 'Мапа гри', pl: 'Mapa gry', zh: '游戏地图', ja: 'ゲームの地図', ko: '게임 지도' },
  showInGame: { en: 'Show on the GTA map', ru: 'Показать на карте GTA', es: 'Ver en el mapa de GTA', pt: 'Ver no mapa do GTA', fr: 'Voir sur la carte GTA', de: 'Auf der GTA-Karte zeigen', it: 'Mostra sulla mappa GTA', tr: 'GTA haritasında göster', uk: 'Показати на мапі GTA', pl: 'Pokaż na mapie GTA', zh: '在 GTA 地图上显示', ja: 'GTAマップで表示', ko: 'GTA 지도에서 보기' },
  showInReal: { en: 'Show on the real map', ru: 'Показать на реальной карте', es: 'Ver en el mapa real', pt: 'Ver no mapa real', fr: 'Voir sur la carte réelle', de: 'Auf der echten Karte zeigen', it: 'Mostra sulla mappa reale', tr: 'Gerçek haritada göster', uk: 'Показати на реальній мапі', pl: 'Pokaż na prawdziwej mapie', zh: '在真实地图上显示', ja: '実際の地図で表示', ko: '실제 지도에서 보기' },
  whereReal: { en: 'Where in real life', ru: 'Где в жизни', es: 'Dónde en la vida real', pt: 'Onde na vida real', fr: 'Où dans la réalité', de: 'Wo in echt', it: 'Dove nella realtà', tr: 'Gerçekte nerede', uk: 'Де в житті', pl: 'Gdzie w rzeczywistości', zh: '现实中的位置', ja: '現実の場所', ko: '현실 속 위치' },
  backReal: { en: 'Real map', ru: 'Реальная карта', es: 'Mapa real', pt: 'Mapa real', fr: 'Carte réelle', de: 'Echte Karte', it: 'Mappa reale', tr: 'Gerçek harita', uk: 'Реальна мапа', pl: 'Prawdziwa mapa', zh: '真实地图', ja: '実際の地図', ko: '실제 지도' },
  whereGame: { en: 'Where in the game', ru: 'Где в игре', es: 'Dónde en el juego', pt: 'Onde no jogo', fr: 'Où dans le jeu', de: 'Wo im Spiel', it: 'Dove nel gioco', tr: 'Oyunda nerede', uk: 'Де в грі', pl: 'Gdzie w grze', zh: '游戏中的位置', ja: 'ゲーム内の場所', ko: '게임 속 위치' },
  openGtaMap: { en: 'Open GTA map', ru: 'Открыть карту GTA', es: 'Abrir mapa de GTA', pt: 'Abrir mapa do GTA', fr: 'Ouvrir la carte GTA', de: 'GTA-Karte öffnen', it: 'Apri mappa GTA', tr: 'GTA haritasını aç', uk: 'Відкрити мапу GTA', pl: 'Otwórz mapę GTA', zh: '打开 GTA 地图', ja: 'GTAマップを開く', ko: 'GTA 지도 열기' },
  approxMap: { en: '≈ GTA 6 map inspired by Florida · exact map on release, Nov 19', ru: '≈ Карта GTA 6 по мотивам Флориды · точная — в день выхода, 19 ноября', es: '≈ Mapa de GTA 6 inspirado en Florida · el exacto, el 19 de noviembre', pt: '≈ Mapa do GTA 6 inspirado na Flórida · o exato em 19 de novembro', fr: '≈ Carte de GTA 6 inspirée de la Floride · la vraie le 19 novembre', de: '≈ GTA-6-Karte nach Florida · die genaue zum Release am 19. Nov.', it: '≈ Mappa di GTA 6 ispirata alla Florida · quella esatta il 19 novembre', tr: '≈ Florida esinli GTA 6 haritası · kesini 19 Kasım’da', uk: '≈ Мапа GTA 6 за мотивами Флориди · точна — 19 листопада', pl: '≈ Mapa GTA 6 na wzór Florydy · dokładna 19 listopada', zh: '≈ 以佛罗里达为原型的 GTA 6 地图 · 精确版 11月19日', ja: '≈ フロリダをもとにしたGTA 6マップ · 正確版は11月19日', ko: '≈ 플로리다 기반 GTA 6 지도 · 정확한 지도는 11월 19일' },
  soon6: { en: 'The exact spot on the GTA 6 map — on release day, Nov 19', ru: 'Точное место на карте GTA 6 — в день выхода, 19 ноября', es: 'El lugar exacto en el mapa de GTA 6, el día del lanzamiento: 19 de noviembre', pt: 'O local exato no mapa do GTA 6 — no lançamento, 19 de novembro', fr: 'L’endroit exact sur la carte de GTA 6 — à la sortie, le 19 novembre', de: 'Die genaue Stelle auf der GTA-6-Karte — zum Release am 19. November', it: 'Il punto esatto sulla mappa di GTA 6 — all’uscita, il 19 novembre', tr: 'GTA 6 haritasındaki tam yer — çıkış günü, 19 Kasım', uk: 'Точне місце на мапі GTA 6 — у день виходу, 19 листопада', pl: 'Dokładne miejsce na mapie GTA 6 — w dniu premiery, 19 listopada', zh: 'GTA 6 地图上的确切位置——11月19日发售当天公布', ja: 'GTA 6マップでの正確な場所は発売日の11月19日に', ko: 'GTA 6 지도의 정확한 위치는 출시일인 11월 19일에' },
  approxHere: { en: '≈ approximately here', ru: '≈ примерно здесь', es: '≈ aproximadamente aquí', pt: '≈ aproximadamente aqui', fr: '≈ à peu près ici', de: '≈ ungefähr hier', it: '≈ più o meno qui', tr: '≈ yaklaşık burada', uk: '≈ приблизно тут', pl: '≈ mniej więcej tutaj', zh: '≈ 大致在这里', ja: '≈ だいたいこの辺り', ko: '≈ 대략 여기' },
  nextTo: { en: 'next to', ru: 'рядом', es: 'junto a', pt: 'perto de', fr: 'à côté de', de: 'neben', it: 'accanto a', tr: 'yanında', uk: 'поруч', pl: 'obok', zh: '旁边', ja: '近く', ko: '옆' },
  nearby: { en: 'Nearby', ru: 'Рядом', es: 'Cerca', pt: 'Perto', fr: 'À proximité', de: 'In der Nähe', it: 'Nelle vicinanze', tr: 'Yakında', uk: 'Поруч', pl: 'W pobliżu', zh: '附近', ja: '近く', ko: '근처' },
  full:   { en: 'Full screen', ru: 'На весь экран', es: 'Pantalla completa', pt: 'Tela cheia', fr: 'Plein écran', de: 'Vollbild', it: 'Schermo intero', tr: 'Tam ekran', uk: 'На весь екран', pl: 'Pełny ekran', zh: '全屏', ja: '全画面', ko: '전체 화면' },
  allPhotos: { en: 'All photos', ru: 'Все фото', es: 'Todas las fotos', pt: 'Todas as fotos', fr: 'Toutes les photos', de: 'Alle Fotos', it: 'Tutte le foto', tr: 'Tüm fotoğraflar', uk: 'Усі фото', pl: 'Wszystkie zdjęcia', zh: '全部照片', ja: 'すべての写真', ko: '모든 사진' },
  fav:    { en: 'Favorite', ru: 'В избранное', es: 'Favorito', pt: 'Favorito', fr: 'Favori', de: 'Favorit', it: 'Preferito', tr: 'Favori', uk: 'В обране', pl: 'Ulubione', zh: '收藏', ja: 'お気に入り', ko: '즐겨찾기' },
  compare: { en: 'Compare', ru: 'Сравнить', es: 'Comparar', pt: 'Comparar', fr: 'Comparer', de: 'Vergleichen', it: 'Confronta', tr: 'Karşılaştır', uk: 'Порівняти', pl: 'Porównaj', zh: '对比', ja: '比較', ko: '비교' },
  copied: { en: 'Link copied', ru: 'Ссылка скопирована', es: 'Enlace copiado', pt: 'Link copiado', fr: 'Lien copié', de: 'Link kopiert', it: 'Link copiato', tr: 'Bağlantı kopyalandı', uk: 'Посилання скопійовано', pl: 'Skopiowano link', zh: '链接已复制', ja: 'リンクをコピーしました', ko: '링크 복사됨' },
  trans:  { en: 'Translate', ru: 'Перевести', es: 'Traducir', pt: 'Traduzir', fr: 'Traduire', de: 'Übersetzen', it: 'Traduci', tr: 'Çevir', uk: 'Перекласти', pl: 'Przetłumacz', zh: '翻译', ja: '翻訳', ko: '번역' },
  why:    { en: 'Why it matches', ru: 'Почему похоже', es: 'Por qué coincide', pt: 'Por que combina', fr: 'Pourquoi', de: 'Warum', it: 'Perché', tr: 'Neden', uk: 'Чому схоже', pl: 'Dlaczego', zh: '为何相似', ja: '似ている理由', ko: '닮은 이유' },
  tip:    { en: 'Visit tip', ru: 'Совет', es: 'Consejo', pt: 'Dica', fr: 'Conseil', de: 'Tipp', it: 'Consiglio', tr: 'İpucu', uk: 'Порада', pl: 'Wskazówka', zh: '提示', ja: 'ヒント', ko: '팁' },
  fun:    { en: 'Fun fact', ru: 'Интересно', es: 'Dato curioso', pt: 'Curiosidade', fr: 'Le saviez-vous', de: 'Wissenswert', it: 'Curiosità', tr: 'İlginç', uk: 'Цікаво', pl: 'Ciekawostka', zh: '趣闻', ja: '豆知識', ko: '재미있는 사실' },
  seen:   { en: 'Watch in trailer', ru: 'Смотреть в трейлере', es: 'Ver en el tráiler', pt: 'Ver no trailer', fr: 'Voir la bande-annonce', de: 'Im Trailer', it: 'Nel trailer', tr: 'Fragmanda', uk: 'У трейлері', pl: 'W zwiastunie', zh: '预告片', ja: '予告編', ko: '예고편' },
  match:  { en: 'Match', ru: 'Сходство', es: 'Parecido', pt: 'Semelhança', fr: 'Ressemblance', de: 'Treffer', it: 'Somiglianza', tr: 'Benzerlik', uk: 'Схожість', pl: 'Zgodność', zh: '相似度', ja: '一致度', ko: '일치도' },
  near:   { en: 'Nearby on the map', ru: 'Рядом на карте', es: 'Cerca en el mapa', pt: 'Perto no mapa', fr: 'À proximité', de: 'In der Nähe', it: 'Nelle vicinanze', tr: 'Yakında', uk: 'Поруч на мапі', pl: 'W pobliżu', zh: '附近', ja: '近くの場所', ko: '근처 장소' },
  zoom:   { en: 'Zoom in to see places', ru: 'Приблизьте карту', es: 'Acerca el mapa', pt: 'Aproxime o mapa', fr: 'Zoomez', de: 'Hineinzoomen', it: 'Ingrandisci', tr: 'Yakınlaştırın', uk: 'Наблизьте мапу', pl: 'Przybliż mapę', zh: '放大地图', ja: '拡大してください', ko: '지도를 확대하세요' },
  src:    { en: 'Sources', ru: 'Источники', es: 'Fuentes', pt: 'Fontes', fr: 'Sources', de: 'Quellen', it: 'Fonti', tr: 'Kaynaklar', uk: 'Джерела', pl: 'Źródła', zh: '来源', ja: '出典', ko: '출처' },
  help:   { en: 'How to read the map', ru: 'Как читать карту', es: 'Cómo leer el mapa', pt: 'Como ler o mapa', fr: 'Légende', de: 'Legende', it: 'Legenda', tr: 'Harita rehberi', uk: 'Як читати мапу', pl: 'Legenda', zh: '图例', ja: '凡例', ko: '범례' },
  // точность совпадения
  confirmed: { en: 'Exact copy', ru: 'Точная копия', es: 'Copia exacta', pt: 'Cópia exata', fr: 'Copie exacte', de: 'Exakte Kopie', it: 'Copia esatta', tr: 'Birebir', uk: 'Точна копія', pl: 'Dokładna kopia', zh: '完全一致', ja: 'そっくり', ko: '똑같음' },
  likely:    { en: 'Very similar', ru: 'Очень похоже', es: 'Muy parecido', pt: 'Muito parecido', fr: 'Très proche', de: 'Sehr ähnlich', it: 'Molto simile', tr: 'Çok benzer', uk: 'Дуже схоже', pl: 'Bardzo podobne', zh: '非常相似', ja: 'よく似ている', ko: '매우 비슷함' },
  speculative: { en: 'Fan theory', ru: 'Версия фанатов', es: 'Teoría de fans', pt: 'Teoria de fãs', fr: 'Théorie de fans', de: 'Fan-Theorie', it: 'Teoria dei fan', tr: 'Hayran teorisi', uk: 'Версія фанатів', pl: 'Teoria fanów', zh: '粉丝推测', ja: 'ファン説', ko: '팬 추측' },
  // доступ
  public:   { en: 'Free to visit', ru: 'Можно свободно', es: 'Acceso libre', pt: 'Acesso livre', fr: 'Accès libre', de: 'Frei zugänglich', it: 'Accesso libero', tr: 'Serbest giriş', uk: 'Вільний вхід', pl: 'Wstęp wolny', zh: '免费参观', ja: '自由に見学', ko: '자유 방문' },
  business: { en: 'Open to guests', ru: 'Для гостей', es: 'Para clientes', pt: 'Para clientes', fr: 'Pour les clients', de: 'Für Gäste', it: 'Per clienti', tr: 'Misafirlere açık', uk: 'Для гостей', pl: 'Dla gości', zh: '对顾客开放', ja: '利用客向け', ko: '손님 이용' },
  view_from_street: { en: 'View from street', ru: 'Смотреть с улицы', es: 'Ver desde la calle', pt: 'Ver da rua', fr: 'Voir depuis la rue', de: 'Nur von außen', it: 'Solo dall’esterno', tr: 'Dışarıdan bakın', uk: 'Дивитися з вулиці', pl: 'Z ulicy', zh: '仅外观', ja: '外から見る', ko: '밖에서 보기' },
  restricted: { en: 'No entry', ru: 'Вход закрыт', es: 'Prohibido el paso', pt: 'Entrada proibida', fr: 'Accès interdit', de: 'Kein Zutritt', it: 'Vietato l’accesso', tr: 'Giriş yok', uk: 'Вхід заборонено', pl: 'Zakaz wstępu', zh: '禁止入内', ja: '立入禁止', ko: '출입 금지' },
  gone: { en: 'Closed / gone', ru: 'Закрыто / снесено', es: 'Cerrado', pt: 'Fechado', fr: 'Fermé', de: 'Geschlossen', it: 'Chiuso', tr: 'Kapalı', uk: 'Закрито', pl: 'Zamknięte', zh: '已关闭', ja: '閉鎖', ko: '폐쇄됨' },
  // тип места
  landmark: { en: 'Landmark', ru: 'Символ места', es: 'Monumento', pt: 'Marco', fr: 'Monument', de: 'Wahrzeichen', it: 'Monumento', tr: 'Simge', uk: 'Пам’ятка', pl: 'Symbol', zh: '地标', ja: 'ランドマーク', ko: '랜드마크' },
  building: { en: 'Building', ru: 'Здание', es: 'Edificio', pt: 'Prédio', fr: 'Bâtiment', de: 'Gebäude', it: 'Edificio', tr: 'Bina', uk: 'Будівля', pl: 'Budynek', zh: '建筑', ja: '建物', ko: '건물' },
  hotel: { en: 'Hotel', ru: 'Отель', es: 'Hotel', pt: 'Hotel', fr: 'Hôtel', de: 'Hotel', it: 'Hotel', tr: 'Otel', uk: 'Готель', pl: 'Hotel', zh: '酒店', ja: 'ホテル', ko: '호텔' },
  beach: { en: 'Beach', ru: 'Пляж', es: 'Playa', pt: 'Praia', fr: 'Plage', de: 'Strand', it: 'Spiaggia', tr: 'Plaj', uk: 'Пляж', pl: 'Plaża', zh: '海滩', ja: 'ビーチ', ko: '해변' },
  street: { en: 'Street', ru: 'Улица', es: 'Calle', pt: 'Rua', fr: 'Rue', de: 'Straße', it: 'Strada', tr: 'Cadde', uk: 'Вулиця', pl: 'Ulica', zh: '街道', ja: '通り', ko: '거리' },
  bridge: { en: 'Bridge', ru: 'Мост', es: 'Puente', pt: 'Ponte', fr: 'Pont', de: 'Brücke', it: 'Ponte', tr: 'Köprü', uk: 'Міст', pl: 'Most', zh: '桥', ja: '橋', ko: '다리' },
  park: { en: 'Park', ru: 'Парк', es: 'Parque', pt: 'Parque', fr: 'Parc', de: 'Park', it: 'Parco', tr: 'Park', uk: 'Парк', pl: 'Park', zh: '公园', ja: '公園', ko: '공원' },
  nature: { en: 'Nature', ru: 'Природа', es: 'Naturaleza', pt: 'Natureza', fr: 'Nature', de: 'Natur', it: 'Natura', tr: 'Doğa', uk: 'Природа', pl: 'Przyroda', zh: '自然', ja: '自然', ko: '자연' },
  business_c: { en: 'Shop / bar', ru: 'Заведение', es: 'Local', pt: 'Loja / bar', fr: 'Commerce', de: 'Lokal', it: 'Locale', tr: 'Mekân', uk: 'Заклад', pl: 'Lokal', zh: '商店', ja: '店', ko: '가게' },
  neighborhood: { en: 'District', ru: 'Район', es: 'Barrio', pt: 'Bairro', fr: 'Quartier', de: 'Viertel', it: 'Quartiere', tr: 'Semt', uk: 'Район', pl: 'Dzielnica', zh: '街区', ja: '地区', ko: '동네' },
  venue: { en: 'Venue', ru: 'Площадка', es: 'Recinto', pt: 'Arena', fr: 'Salle', de: 'Arena', it: 'Arena', tr: 'Mekân', uk: 'Арена', pl: 'Arena', zh: '场馆', ja: '会場', ko: '경기장' },
  infrastructure: { en: 'Port / road', ru: 'Порт / дорога', es: 'Puerto / vía', pt: 'Porto / via', fr: 'Port / route', de: 'Hafen / Straße', it: 'Porto / strada', tr: 'Liman / yol', uk: 'Порт / дорога', pl: 'Port / droga', zh: '港口/道路', ja: '港・道路', ko: '항구/도로' },
  sign: { en: 'Sign', ru: 'Вывеска', es: 'Letrero', pt: 'Placa', fr: 'Enseigne', de: 'Schild', it: 'Insegna', tr: 'Tabela', uk: 'Вивіска', pl: 'Znak', zh: '招牌', ja: '看板', ko: '간판' },
  other: { en: 'Place', ru: 'Место', es: 'Lugar', pt: 'Lugar', fr: 'Lieu', de: 'Ort', it: 'Luogo', tr: 'Yer', uk: 'Місце', pl: 'Miejsce', zh: '地点', ja: '場所', ko: '장소' },
  egg: { en: 'Easter egg', ru: 'Пасхалка', es: 'Easter egg', pt: 'Easter egg', fr: 'Easter egg', de: 'Easter Egg', it: 'Easter egg', tr: 'Sürpriz', uk: 'Пасхалка', pl: 'Easter egg', zh: '彩蛋', ja: 'イースターエッグ', ko: '이스터에그' },
};
const devLang = () => (navigator.language || 'en').slice(0, 2).toLowerCase();
function uiLang() {
  if (getLang() === 'ru') return 'ru';
  const d = devLang();
  return W.game[d] ? d : 'en';
}
const w = (k) => (W[k] && (W[k][uiLang()] || W[k].en)) || k;

// ───── значки (SVG, stroke = currentColor) ─────
const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  game: sv('<path d="M6 9h4M8 7v4M15 10h.01M18 8h.01"/><path d="M7.5 4h9A5.5 5.5 0 0 1 22 9.5v3.8a3.7 3.7 0 0 1-6.6 2.3L14 14h-4l-1.4 1.6A3.7 3.7 0 0 1 2 13.3V9.5A5.5 5.5 0 0 1 7.5 4z"/>'),
  camera: sv('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
  pin: sv('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  nav: sv('<path d="M3 11.5 21 3l-8.5 18-2-7.5z"/>'),
  grid: sv('<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'),
  chevL: sv('<path d="m15 5-7 7 7 7"/>'),
  expand: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  chevR: sv('<path d="m9 5 7 7-7 7"/>'),
  pano: sv('<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>'),
  heart: sv('<path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/>'),
  share: sv('<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  translate: sv('<path d="M4 5h9M8.5 3v2M6 5c.8 3 3 5.5 6 7M11 5c-.7 3.5-3.3 6.5-7 8"/><path d="m13 21 4-9 4 9M14.5 18h5"/>'),
  play: sv('<path fill="currentColor" stroke="none" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/>'),
  close: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  swap: sv('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  bulb: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>'),
  spark: sv('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  help: sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.5v.01"/>'),
  egg: sv('<path d="M12 3c3.5 0 7 6 7 10.5A7 7 0 0 1 5 13.5C5 9 8.5 3 12 3z"/><path d="m7 13 2.5-2 2.5 2 2.5-2L17 13"/>'),
  // доступ
  public: sv('<circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6.5L14 17v4M10 9.5l3-1.5 2.5 3 2.5 1M11.5 14.5l1-5-3.5 1.5-1.5 3"/>'),
  business: sv('<path d="M4 10v10h16V10M3 10l2-6h14l2 6zM9 20v-5h6v5"/>'),
  view_from_street: sv('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  restricted: sv('<circle cx="12" cy="12" r="9"/><path d="M7 12h10"/>'),
  gone: sv('<path d="M3 21h18M5 21V10l4-3 4 3v11M13 21v-6l3-2 3 2v6"/><path d="m3 3 18 18"/>'),
  // типы
  landmark: sv('<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>'),
  building: sv('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>'),
  hotel: sv('<path d="M3 20V8M21 20v-6a3 3 0 0 0-3-3H10v9M3 16h18"/><circle cx="6.5" cy="12" r="1.8"/>'),
  beach: sv('<path d="M3 20c2 0 2-1.5 4.5-1.5S10 20 12 20s2.5-1.5 4.5-1.5S19 20 21 20"/><path d="M12 17 8 7M4 9a8 8 0 0 1 14-3z"/>'),
  street: sv('<path d="M8 3 5 21M16 3l3 18M12 4v2M12 10v3M12 17v3"/>'),
  bridge: sv('<path d="M2 17h20M4 17v-4M20 17v-4M2 13h20M6 13a6 6 0 0 1 12 0"/>'),
  park: sv('<path d="M12 21v-6M7 15h10l-5-11z"/>'),
  nature: sv('<path d="m3 20 6-10 4 6 2-3 6 7z"/><circle cx="17" cy="6" r="2"/>'),
  business_c: sv('<path d="M5 4h14l1 5H4zM5 9v11h14V9M10 20v-5h4v5"/>'),
  neighborhood: sv('<path d="M3 21V11l5-4 5 4v10M13 21V8l4-3 4 3v13M6 21v-4h4v4"/>'),
  venue: sv('<ellipse cx="12" cy="10" rx="9" ry="4"/><path d="M3 10v5c0 2.2 4 4 9 4s9-1.8 9-4v-5"/>'),
  infrastructure: sv('<path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-6h4v6"/>'),
  sign: sv('<path d="M12 21V4M5 6h12l2 2.5L17 11H5z"/>'),
  other: sv('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
};
const HOTEL_RE = /hotel|motel|resort|inn\b|отел/i;
function catKey(p) {
  if ((p.c === 'building' || p.c === 'business') && HOTEL_RE.test(`${p.n} ${p.g}`)) return 'hotel';
  if (p.c === 'business') return 'business_c';
  return IC[p.c] ? p.c : 'other';
}

let ctx = null;          // {openSheet, haptic, toast, I}
let map = null, game = null, styleKey = null;
const data = {}, gtadb = {};
const show = { places: true, eggs: true, gtadb: true };   // «все точки» видны при приближении (minzoom)
let me = null;            // последняя известная позиция пользователя [lat, lon]
let selected = null;      // индекс выбранного места
let selectedD = null;     // индекс выбранной точки сообщества (gtadb)
let viewer = null;        // {p, k}

// одновременные вызовы ждут одну загрузку; после ошибки — можно повторить
const pending = {};
function once(key, make) {
  return (pending[key] ||= make().catch((err) => { delete pending[key]; throw err; }));
}
function loadLib() {
  if (window.maplibregl) return Promise.resolve();
  return once('lib', () => new Promise((ok, fail) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'vendor/maplibre/maplibre-gl.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'vendor/maplibre/maplibre-gl.js'; s.onload = ok;
    s.onerror = () => { s.remove(); css.remove(); fail(new Error('maplibre')); }; document.head.appendChild(s);
  }));
}
const IMG_BASE = /\/beta\//.test(location.pathname) ? '../' : '';
const rebase = (o) => (typeof o === 'string' ? (IMG_BASE && o.startsWith('img/map/') ? IMG_BASE + o : o) : Array.isArray(o) ? o.map(rebase)
  : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, rebase(v)])) : o);
async function loadGame(g) {
  if (!data[g]) data[g] = await once('d:' + g, () => fetch(`data/map/${g}.json`).then((r) => r.json()).then(rebase));
  return data[g];
}
async function loadGtadb(g) {
  if (!gtadb[g]) gtadb[g] = await once('g:' + g, () => fetch(`data/map/gtadb_${g}.json`).then((r) => r.json()));
  return gtadb[g];
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const mapsLink = (lat, lon, q) => isIOS()
  ? `https://maps.apple.com/?daddr=${lat},${lon}&q=${encodeURIComponent(q || `${lat},${lon}`)}`
  : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
const themeKey = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
const txt = (o) => (o ? tr(o) : '');

function km(a, b) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function distLabel(p) {
  if (!me) return '';
  return fmtKm(km(me, [p.lat, p.lon]));
}
function fmtKm(d) {
  if (navigator.language === 'en-US') { const mi = d * 0.621; return mi < 0.2 ? `${Math.round(mi * 5280 / 10) * 10} ft` : `${mi.toFixed(mi < 10 ? 1 : 0)} mi`; }
  return d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : `${d.toFixed(d < 10 ? 1 : 0)} km`;
}
function meter(cf) {
  const n = cf === 'confirmed' ? 3 : cf === 'likely' ? 2 : 1;
  return `<span class="mp-meter" style="--c:${COLORS[cf] || COLORS.likely}">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}
function ytLink(ref) {
  const m = /(Trailer\s*1|Trailer\s*2|Extended\s*Look)\D{0,12}(\d{1,2}):(\d{2})/i.exec(ref || '');
  if (!m) return null;
  const id = /trailer\s*1/i.test(m[1]) ? 'QdBZY2fkU-0' : /trailer\s*2/i.test(m[1]) ? 'VQRLujxTm3c' : 'tJbzMqJGH4k';
  return { id, t: (+m[2]) * 60 + (+m[3]), url: '', label: `${/1/.test(m[1]) && /trailer/i.test(m[1]) ? 'Trailer 1' : /trailer/i.test(m[1]) ? 'Trailer 2' : 'Extended Look'} · ${m[2]}:${m[3]}` };
}
// кнопка «Перевести» — если текст не на языке устройства (часть советов пока только по-русски)
function needsTranslate(text) {
  if (!text || !text.trim()) return false;
  const cyr = /[а-яё]/i.test(text), dl = devLang();
  if (dl === 'ru') return !cyr;
  if (dl === 'en') return cyr;
  return true;
}
// ряд действий: главная кнопка «Осмотреться 360°» (Street View — место видно из любой страны), маленькие «маршрут» и «поделиться»
// view {pano, heading, pitch, fov, lat, lon} — проверенный вид (данные/виды_360.json); без него Google берёт ближайшую панораму и смотрит куда попало
const panoLink = (lat, lon, v) => {
  let u = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${v?.lat ?? lat},${v?.lon ?? lon}`;
  if (v?.pano) u += `&pano=${encodeURIComponent(v.pano)}`;
  for (const k of ['heading', 'pitch', 'fov']) if (Number.isFinite(v?.[k])) u += `&${k}=${v[k]}`;
  return u;
};
const favKey = (kind, id) => `${kind}:${game}:${id}`;
function favBtn(kind, id, small = false) {
  if (!ctx?.toggleFav || !id) return '';
  const on = !!ctx.isFav?.(favKey(kind, id));
  return `<button class="mp-ib mp-fav${on ? ' on' : ''}${small ? ' sm' : ''}" data-mp="fav" data-kind="${kind}" data-id="${esc(id)}" aria-label="${esc(w('fav'))}" aria-pressed="${on}" title="${esc(w('fav'))}">${IC.heart}</button>`;
}
function actions(lat, lon, name, shareText, fav = '', view = null) {
  return `<div class="mp-acts">
    <a class="mp-cta" href="${panoLink(lat, lon, view)}" target="_blank" rel="noopener">${IC.pano}<span>${esc(w('look'))}</span></a>
    <a class="mp-ib" href="${mapsLink(lat, lon, name)}" target="_blank" rel="noopener" aria-label="${esc(w('route'))}" title="${esc(w('route'))}">${IC.nav}</a>
    ${fav}<button class="mp-ib" data-mp="share" data-t="${esc(shareText)}" aria-label="${esc(w('share'))}" title="${esc(w('share'))}">${IC.share}</button>
  </div>`;
}
async function sharePlace(text) {
  const url = location.href.split('#')[0];
  try { if (navigator.share) { await navigator.share({ title: text, text, url }); return; } } catch { return; }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); ctx?.toast?.(w('copied')); } catch { }
}
function translateLink(text) {
  const tl = devLang();
  return `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(tl)}&text=${encodeURIComponent(text.slice(0, 1800))}&op=translate`;
}

// ───── галереи «в игре» и «в жизни»: стрелки ‹ ›, счётчик, свайп, миниатюры; фото игроков и лайки ─────
const galleries = {};   // 'g:p12' | 'r:p12' | 'g:e3' | 'r:d5' → [{id, src, url, thumb, credit, likes, liked}]
const galNames = {};    // 'p12' → {g: имя в игре, r: имя в жизни}
const placeKey = (p) => `${game}:${p.id}`;
function asItem(ph) {
  const url = ph.url || ph.file;
  return { url, thumb: ph.thumb || url, credit: ph.credit || '', ap: !!ph.ap };
}
const gameList = (o) => [o.pg, ...(o.gg || [])].filter(Boolean).map((ph) => asItem(ph));
const realList = (o) => [o.pr, ...(o.gl || [])].filter(Boolean).map((ph) => asItem(ph));
const pairsOf = {};     // key → [{g, r}] — только пары с одного ракурса (подобраны людьми в gtadb)
function heroBox(key, pairs, gl, rl, names, o = {}) {
  galNames[key] = names; galleries[`g:${key}`] = gl; galleries[`r:${key}`] = rl;
  pairsOf[key] = (pairs || []).map((x) => ({ g: asItem(x.g), r: asItem(x.r), ap: !!x.ap }));
  const P = pairsOf[key];
  const all = gl.length + rl.length > 2
    ? `<button class="mp-allbtn" data-mp="all" data-key="${key}">${IC.grid}<span>${esc(w('allPhotos'))}</span><em>${IC.camera}${rl.length}</em><em>${IC.game}${gl.length}</em><i class="mp-chev">${IC.chevR}</i></button>`
    : '';
  if (P.length) {
    inl[key] = { pi: 0, x: 50 };
    hintInline();
    return `<div class="mp-media-box" data-key="${key}">
      <div class="cmp-stage cmp-inline" data-key="${key}" data-i="${o.i ?? ''}" style="--x:50%" role="slider" tabindex="0" aria-label="${esc(w('compare'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
        <img class="cmp-g" src="${esc(P[0].g.url)}" alt="${esc(w('game'))}" draggable="false" decoding="async">
        <img class="cmp-r" src="${esc(P[0].r.url)}" alt="${esc(w('real'))}" draggable="false" decoding="async">
        <span class="cmp-lab g">${IC.game}<b>${esc(w('game'))}</b></span>
        <span class="cmp-lab r">${IC.camera}<b>${esc(w('real'))}</b></span>
        <div class="cmp-line"><span class="cmp-knob">${IC.chevL}${IC.chevR}</span></div>
        <button class="cmp-full" data-mp="compare" data-key="${key}" data-i="${o.i ?? ''}" aria-label="${esc(w('full'))}" title="${esc(w('full'))}">${IC.expand}</button>
        ${P[0].ap ? `<span class="mp-approx cmp-approx" title="${esc(w('approxT'))}">${esc(w('approx'))}</span>` : ''}
      </div>
      ${P.length > 1 ? `<div class="cmp-ipairs">${P.map((x, k) => `<button class="${k ? '' : 'on'}" data-mp="ipair" data-key="${key}" data-n="${k}" aria-label="${k + 1}/${P.length}"><img src="${esc(x.g.url)}" alt="" loading="lazy"><img src="${esc(x.r.url)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      ${all}</div>`;
  }
  const cov = [gl[0], rl[0]];
  const tile = (ph, kind) => {
    const icon = kind === 'g' ? IC.game : IC.camera, label = w(kind === 'g' ? 'game' : 'real');
    if (!ph && kind === 'r' && o.pano)   // нет фото из жизни — плитка ведёт в Street View на это место
      return `<a class="mp-shot empty r mp-shot-360" href="${o.pano}" target="_blank" rel="noopener"><span class="mp-shot-ic">${IC.pano}</span><small>${esc(w('look'))}</small></a>`;
    if (!ph) return `<div class="mp-shot empty ${kind}"><span class="mp-shot-ic">${icon}</span><small>${esc(w('noPhoto'))}</small></div>`;
    const act = `data-mp="view" data-ref="${kind}:${key}" data-n="0" data-i="${o.i ?? ''}"`;
    return `<button class="mp-shot ${kind}" ${act} aria-label="${esc(label)}"><img src="${esc(ph.url)}" alt="${esc(label)}" loading="lazy" decoding="async"><span class="mp-badge">${icon}<b>${esc(label)}</b></span>${ph.ap ? `<span class="mp-approx" title="${esc(w('approxT'))}">${esc(w('approx'))}</span>` : ''}<span class="mp-shot-exp" aria-hidden="true">${IC.expand}</span></button>`;
  };
  const mid = `<span class="mp-vs">${o.egg ? IC.egg : IC.swap}</span>`;
  return `<div class="mp-media-box" data-key="${key}"><div class="mp-hero">${tile(cov[0], 'g')}${tile(cov[1], 'r')}${mid}</div>${all}</div>`;
}
// ───── карточки (шторка) ─────
// «Где в игре»: плитки карты игры из репозитория gtadb (GTA 5 — спутник, GTA 6 — фанатская карта Леониды «yanis»).
// Мир игры −16384…16384 единиц; при z=4 одна точка картинки = 2 единицы, плитка 256 px = 512 единиц (~500 м).
// GTA 5 — набор «radar»: карта из меню паузы игры (тёмная суша, светлые дороги) — просьба Игоря 14.10.2026 «как в GTA».
const GMAP = { gta5: { v: 5, key: 'V', set: 'radar', z: 4 }, gta6: { v: 6, key: 'VI', set: 'yanis,16', z: 4 } };
function gameBlock(gm, addr, region, gid, ref = {}) {
  if (!GAME_MAP[game]) return `<div class="mp-ingame mp-ig-soon"><span class="mp-ig-txt"><small>${IC.game}${esc(w('whereGame'))}</small><b>${esc(w('soon6'))}</b></span></div>`;
  const at = `data-k="${ref.k || ''}" data-i="${ref.i ?? ''}"`;
  if (approx() && mode !== 'game' && ref.k !== 'd')   // GTA 6 до выхода: место на «Леониде» — по реальным координатам, примерно
    return `<button class="mp-ingame mp-ig-approx" data-mp="ingame" ${at}>
      <span class="mp-ig-txt"><small>${IC.game}${esc(w('whereGame'))} · ≈</small><b>${esc(region || GAMES[game].gameCity[uiLang()] || GAMES[game].gameCity.en)}</b><em>${esc(w('soon6'))}</em></span>
      <span class="mp-ig-open">${esc(w('showInGame'))}${IC.chevR}</span></button>`;
  if (!gm && !(approx() && mode === 'game')) return '';
  if (mode === 'game') {   // на карте игры — обратный путь: где это в жизни
    return `<button class="mp-ingame mp-inreal" data-mp="inreal" ${at}>
      <span class="mp-ig-txt"><small>${IC.pin}${esc(w('whereReal'))}</small><b>${esc(ref.real || '')}</b></span>
      <span class="mp-ig-open">${esc(w('showInReal'))}${IC.chevR}</span></button>`;
  }
  const [gx, gy, acc] = gm, c = GMAP[game], k = 2 ** (5 - c.z);
  const px = (gx + 16384) / k, py = (16384 - gy) / k, tx = Math.floor(px / 256), ty = Math.floor(py / 256);
  let tiles = '';
  for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++)
    tiles += `<img src="${tileBase(c.v)}maps/tiles/${c.v}/${c.set}/${c.z}/${c.z},${y},${x}.jpg" style="left:${Math.round(x * 256 - px)}px;top:${Math.round(y * 256 - py)}px" alt="" loading="lazy" decoding="async" onerror="this.remove()">`;
  const line = acc === 2 ? `${region ? esc(region) + ' · ' : ''}<em>${esc(w('approxHere'))}</em>` : esc(addr || region || '') + (acc === 1 ? ` <em>· ${esc(w('nextTo'))}</em>` : '');
  return `<button class="mp-ingame" data-mp="ingame" ${at}>
      <span class="mp-ig-map"><span class="mp-ig-tiles">${tiles}</span><span class="mp-ig-pin${acc === 2 ? ' est' : ''}"></span></span>
      <span class="mp-ig-txt"><small>${IC.game}${esc(w('whereGame'))}</small><b>${line}</b></span>
      <span class="mp-ig-open">${esc(w('showInGame'))}${IC.chevR}</span></button>`;
}
// пасхалки места (в бете — выше реального мира: игрокам они интереснее)
function eggBlocks(p) {
  return (p.eggs || []).map((e) => { const yt = (e.m || []).map(ytLink).filter(Boolean)[0]; return `<div class="mp-eggblk">${favBtn('egg', e.id, true)}<span class="mp-eggic">${IC.egg}</span><div><small>${esc(w('egg'))}</small><b>${esc(txt(e.t))}</b><p>${esc(txt(e.d))}</p>${yt ? `<button class="mp-ytbtn" data-mp="yt" data-v="${yt.id}" data-t="${yt.t}" data-l="${esc(yt.label)}">${IC.play}<span>${esc(yt.label)}</span></button>` : ''}</div></div>`; }).join('');
}
function playerBlock(gc) {
  const c = CATS[gc];
  if (!BETA || !c) return '';
  return `<div class="mp-player" style="--c:${c.c}"><span class="mp-player-t"><i></i>${esc(tr(c.t))}</span><p>${esc(tr(c.what))}</p>
    ${c.cheat ? `<button class="mp-player-go" data-action="open-cheats" data-cat="${c.cheat}">${IC.game}<span>${esc(tr(c.ct))}</span>${IC.chevR}</button>` : ''}</div>`;
}
function placeSheet(p, i) {
  const ck = catKey(p);
  const dist = distLabel(p);
  const media = (p.m || []).map(ytLink).filter(Boolean);
  return `
    ${heroBox('p' + i, p.pairs, gameList(p), realList(p), { g: p.g, r: p.n }, { pano: panoLink(p.lat, p.lon, p.view) })}
    <div class="mp-names">
      <div class="mp-nm g"><span class="mp-nic">${IC.game}</span><div><b>${esc(p.g)}</b>${p.r ? `<small>${esc(p.r)}</small>` : ''}</div></div>
      <a class="mp-nm r mp-nm-link" href="${mapsLink(p.lat, p.lon, p.n)}" target="_blank" rel="noopener" aria-label="${esc(w('route'))}: ${esc(p.n)}"><span class="mp-nic">${IC.pin}</span><div><b>${esc(p.n)}</b>${p.a ? `<small>${esc(p.a)}</small>` : ''}</div><span class="mp-nm-go">${IC.nav}</span></a>
    </div>
    ${gameBlock(p.gm, p.ga, p.r, '', { k: 'p', i, real: [p.n, p.a].filter(Boolean).join(' · ') })}
    ${playerBlock(p.gc)}
    ${BETA ? eggBlocks(p) : ''}
    <div class="mp-picto">
      <span class="mp-pic">${IC[ck]}<small>${esc(w(ck))}</small></span>
      ${p.ac && IC[p.ac] ? `<span class="mp-pic ac-${p.ac}">${IC[p.ac]}<small>${esc(w(p.ac))}</small></span>` : ''}
      <span class="mp-pic">${meter(p.cf)}<small>${esc(w(p.cf || 'likely'))}</small></span>
      ${dist ? `<span class="mp-pic">${IC.pin}<small>${dist}</small></span>` : ''}
    </div>
    ${actions(p.lat, p.lon, p.n, `${p.g} → ${p.n}`, favBtn('place', p.id), p.view)}
    ${BETA ? '' : eggBlocks(p)}
    ${(p.alias || []).length ? `<p class="mp-alias">${IC.game}<span>${esc(w('also'))}: ${p.alias.map(esc).join(' · ')}</span></p>` : ''}
    ${txt(p.s) ? `<p class="mp-text">${esc(txt(p.s))}</p>` : ''}
    ${txt(p.why) ? `<div class="mp-blk">${IC.info}<div><b>${esc(w('why'))}</b><p>${esc(txt(p.why))}</p></div></div>` : ''}
    ${txt(p.tip) ? `<div class="mp-blk">${IC.bulb}<div><b>${esc(w('tip'))}</b><p>${esc(txt(p.tip))}</p></div></div>` : ''}
    ${txt(p.fun) ? `<div class="mp-blk">${IC.spark}<div><b>${esc(w('fun'))}</b><p>${esc(txt(p.fun))}</p></div></div>` : ''}
    ${media.length ? `<div class="mp-yt">${media.map((m) => `<button data-mp="yt" data-v="${m.id}" data-t="${m.t}" data-l="${esc(m.label)}">${IC.play}<span>${esc(m.label)}</span></button>`).join('')}</div>` : ''}
    ${nearbyRow(p, i)}
    ${(p.src || []).length ? `<div class="mp-src">${IC.link}${p.src.slice(0, 3).map((u) => `<span>${esc(u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</span>`).join('')}</div>` : ''}
    <p class="mp-cred">${[p.pg, p.pr].filter(Boolean).map((x) => esc(x.credit)).join(' · ')}</p>`;
}
// ближайшие места (до 5 км) — следующий шаг прогулки в одно касание
function nearbyRow(p, i) {
  const all = data[game].places;
  const near = all.map((q, k) => [k, km([p.lat, p.lon], [q.lat, q.lon])]).filter(([k, d]) => k !== i && d <= 5)
    .sort((a, b) => a[1] - b[1]).slice(0, 8);
  if (!near.length) return '';
  const pic = (q) => q.pr?.thumb || q.pg?.thumb || q.pr?.file || q.pg?.file || q.pairs?.[0]?.r?.url || '';
  return `<div class="mp-near"><b class="mp-near-t">${IC.pin}<span>${esc(w('nearby'))}</span></b><div class="mp-near-row">${near.map(([k, d]) => {
    const q = all[k], img = pic(q);
    return `<button class="mp-near-c" data-mp="near" data-i="${k}">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="mp-ch-ic">${IC.pin}</span>`}<span><b>${esc(q.g || q.n)}</b><small>${esc(fmtKm(d))} · ${esc(q.n)}</small></span></button>`;
  }).join('')}</div></div>`;
}
function eggSheet(e, i) {
  const yt = (e.m || []).map(ytLink).filter(Boolean);
  const cta = yt.length
    ? `<button class="mp-cta mp-cta-yt" data-mp="yt" data-v="${yt[0].id}" data-t="${yt[0].t}" data-l="${esc(yt[0].label)}">${IC.play}<span>${esc(w('seen'))} · ${esc(yt[0].label.split(' · ')[1] || '')}</span></button>`
    : `<a class="mp-cta" href="${panoLink(e.lat, e.lon, e.view)}" target="_blank" rel="noopener">${IC.pano}<span>${esc(w('look'))}</span></a>`;
  return `
    ${heroBox('e' + i, e.pairs, gameList(e), realList(e), { g: txt(e.t), r: (e.p || '').split(',')[0] }, { egg: true })}
    <div class="mp-egghead"><span class="mp-eggic">${IC.egg}</span><div><small>${esc(w('egg'))}</small><h2>${esc(txt(e.t))}</h2></div></div>
    ${e.p ? `<div class="mp-nm r"><span class="mp-nic">${IC.pin}</span><div><b>${esc(e.p.split(',')[0])}</b><small>${esc(e.p.split(',').slice(1).join(',').trim())}</small></div></div>` : ''}
    ${gameBlock(e.gm, e.ga, '', '', { k: 'e', i, real: e.p || '' })}
    <div class="mp-picto"><span class="mp-pic">${meter(e.cf)}<small>${esc(w(e.cf || 'likely'))}</small></span>${me ? `<span class="mp-pic">${IC.pin}<small>${distLabel(e)}</small></span>` : ''}</div>
    <div class="mp-acts">${cta}
      <a class="mp-ib" href="${mapsLink(e.lat, e.lon, e.p)}" target="_blank" rel="noopener" aria-label="${esc(w('route'))}">${IC.nav}</a>
      ${favBtn('egg', e.id)}<button class="mp-ib" data-mp="share" data-t="${esc(txt(e.t))}" aria-label="${esc(w('share'))}">${IC.share}</button></div>
    <p class="mp-text">${esc(txt(e.d))}</p>
    ${yt.length > 1 ? `<div class="mp-yt">${yt.slice(1).map((m) => `<button data-mp="yt" data-v="${m.id}" data-t="${m.t}" data-l="${esc(m.label)}">${IC.play}<span>${esc(m.label)}</span></button>`).join('')}</div>` : ''}
    ${e.src ? `<div class="mp-src">${IC.link}<span>${esc(String(e.src).replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</span></div>` : ''}
    <p class="mp-cred">${[e.pg, e.pr].filter(Boolean).map((x) => esc(x.credit)).join(' · ')}</p>`;
}
// фото точек сообщества — из открытого репозитория gtadb.org на GitHub (CC BY 4.0; кадры игры © Rockstar Games).
// Пара «игра ⇄ жизнь» с одного ракурса — для сравнения ползунком (главная функция, Игорь 14.10.2026: не убирать).
// Фото из жизни — ссылкой на gtadb (часто кадр Street View), у себя копию не храним.
function gtadbPhotos(p, g) {
  const v = g === 'VI' ? 6 : 5, id = encodeURIComponent(p[0]);
  const u = (k) => `${k === 'ig' ? ASSETS : GTADB_RAW}map/photos/${v}/${id},${k}.jpg`;
  return { pg: p[7] ? { file: u('ig'), credit: '© Rockstar Games · gtadb.org' } : null, pr: p[8] ? { file: u('rl'), credit: 'gtadb.org and contributors (CC BY 4.0)' } : null };
}
function gtadbSheet(p, g, i) {
  const [id, name, district, real, lat, lon, type] = p;
  const ph = gtadbPhotos(p, g);
  return `
    ${heroBox('d' + i, ph.pg && ph.pr ? [{ g: ph.pg, r: ph.pr }] : [], gameList(ph), realList(ph), { g: name || district || id, r: real.split(',')[0] })}
    <div class="mp-names">
      <div class="mp-nm g"><span class="mp-nic">${IC.game}</span><div><b>${esc(name || district || id)}</b>${name && district ? `<small>${esc(district)}</small>` : ''}</div></div>
      <a class="mp-nm r mp-nm-link" href="${mapsLink(lat, lon, real)}" target="_blank" rel="noopener" aria-label="${esc(w('route'))}: ${esc(real.split(',')[0])}"><span class="mp-nic">${IC.pin}</span><div><b>${esc(real.split(',')[0])}</b><small>${esc(real.split(',').slice(1).join(',').trim())}</small></div><span class="mp-nm-go">${IC.nav}</span></a>
    </div>
    ${p[11] ? gameBlock([p[11][0], p[11][1], 0], [name, district].filter(Boolean).join(', '), '', id, { k: 'd', i, real }) : ''}
    ${playerBlock(p[12])}
    <div class="mp-picto"><span class="mp-pic">${IC.other}<small>${esc(type || w('other'))}</small></span>${me ? `<span class="mp-pic">${IC.pin}<small>${distLabel({ lat, lon })}</small></span>` : ''}</div>
    ${(p[9] || []).length ? `<div class="mp-also"><small>${esc(w('also'))}</small><span class="mp-also-list">${p[9].map(esc).join(' · ')}</span></div>` : ''}
    ${actions(lat, lon, real, `${name || district || id} → ${real.split(',')[0]}`, '', p[10] || null)}
    <div class="mp-src">${IC.link}<span>gtadb.org (CC BY 4.0)</span></div>
    <p class="d-note">${t('map_gtadb_credit')}</p>`;
}
function helpSheet() {
  const row = (ic, label, extra = '') => `<div class="mp-hrow"><span class="mp-pic">${ic}</span><span>${esc(label)}</span>${extra}</div>`;
  return `<h2 class="pick-t">${esc(w('help'))}</h2>
    <div class="mp-help">
      ${row(`<i class="mp-dot" style="background:${COLORS.confirmed}"></i>`, w('confirmed'), meter('confirmed'))}
      ${row(`<i class="mp-dot" style="background:${COLORS.likely}"></i>`, w('likely'), meter('likely'))}
      ${row(`<i class="mp-dot" style="background:${COLORS.speculative}"></i>`, w('speculative'), meter('speculative'))}
      ${row(`<i class="mp-dot" style="background:${COLORS.egg};box-shadow:0 0 0 2px #fff"></i>`, w('egg'))}
      <hr>
      ${row(IC.game, w('game'))}${row(IC.camera, w('real'))}
      <hr>
      ${['public', 'business', 'view_from_street', 'restricted', 'gone'].map((k) => row(IC[k], w(k))).join('')}
    </div>`;
}

// ───── сравнение прямо в карточке ─────
// Пара с одного ракурса показывается сразу ползунком: палец вбок — двигает, вверх-вниз — листает карточку,
// короткое нажатие или ⤢ — на весь экран. Пока ползунок едет, шторка не тянется вниз.
const inl = {};          // key → { pi: номер пары, x: положение ползунка, % }
let cmpDrag = null;      // { st, id, x0, y0, mode: null | 'h' | 'v' }
function hintInline() {
  if (hintInline.done || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  hintInline.done = true;
  requestAnimationFrame(() => {
    const st = document.querySelector('#sheet-body .cmp-inline');
    if (!st) { hintInline.done = false; return; }
    setTimeout(() => { st.classList.add('hint'); setTimeout(() => st.classList.remove('hint'), 1600); }, 350);
  });
}
function setInlineX(st, v) {
  v = Math.max(0, Math.min(100, v));
  st.style.setProperty('--x', v + '%'); st.setAttribute('aria-valuenow', String(Math.round(v)));
  (inl[st.dataset.key] ||= { pi: 0 }).x = v;
}
function setInlinePair(btn) {
  const key = btn.dataset.key, n = +btn.dataset.n, pr = (pairsOf[key] || [])[n];
  const box = btn.closest('.mp-media-box'), st = box?.querySelector('.cmp-inline');
  if (!pr || !st) return;
  st.querySelector('.cmp-g').src = pr.g.url; st.querySelector('.cmp-r').src = pr.r.url;
  box.querySelectorAll('.cmp-ipairs button').forEach((b) => b.classList.toggle('on', b === btn));
  (inl[key] ||= {}).pi = n; setInlineX(st, 50);   // новый ракурс — снова пополам
}
// Ползунок «игра ⇄ жизнь» в карточке. Корень бага (14.10.2026): с touch-action: pan-y iOS при малейшем
// вертикальном смещении начинала прокрутку карточки и слала ползунку pointercancel.
// Лечение: направление решается на ПЕРВОМ touchmove (с перевесом в пользу горизонтали). Если вбок —
// preventDefault на всех touchmove жеста: iOS не начинает прокрутку, ползунок едет до отпускания пальца.
// Если вверх-вниз — жест остаётся родной прокруткой браузера (с инерцией и отскоком).
const CMP_H_BIAS = 0.7;   // вбок, если |dx| ≥ 0.7·|dy| на первом движении
let cmpT = null;          // текущее касание над ползунком: { x, y, h: null | true | false }
addEventListener('touchstart', (e) => {
  const st = e.target.closest?.('.cmp-inline');
  cmpT = st && !e.target.closest('button') && e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, h: null } : null;
}, { capture: true, passive: true });
addEventListener('touchmove', (e) => {
  if (!cmpT) return;
  if (cmpT.h === null) {
    const t = e.touches[0], dx = Math.abs(t.clientX - cmpT.x), dy = Math.abs(t.clientY - cmpT.y);
    if (dx + dy < 1) return;
    cmpT.h = dx >= dy * CMP_H_BIAS;
    const d = cmpDrag;
    if (d) {
      d.mode = cmpT.h ? 'h' : 'v';
      if (cmpT.h) {
        d.st.classList.remove('hint'); d.st.classList.add('drag');
        try { d.st.setPointerCapture(d.id); } catch { }
        const sh = document.getElementById('sheet'); if (sh) sh.style.transform = '';
      }
    }
  }
  if (cmpT.h && e.cancelable) e.preventDefault();      // отменяет прокрутку карточки на весь жест
}, { capture: true, passive: false });
addEventListener('touchend', () => { cmpT = null; }, { capture: true, passive: true });
addEventListener('touchcancel', () => { cmpT = null; }, { capture: true, passive: true });

document.addEventListener('pointerdown', (e) => {
  const st = e.target.closest?.('.cmp-inline');
  if (!st || e.target.closest('button') || e.button > 0) return;
  cmpDrag = { st, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, mode: null, touch: e.pointerType === 'touch',
    v0: inl[st.dataset.key]?.x ?? 50 };
});
document.addEventListener('pointermove', (e) => {
  const d = cmpDrag;
  if (!d || e.pointerId !== d.id) return;
  if (!d.mode && !d.touch) {                             // мышь: направление по порогу
    const dx = Math.abs(e.clientX - d.x0), dy = Math.abs(e.clientY - d.y0);
    if (dx > 4 && dx >= dy * CMP_H_BIAS) {
      d.mode = 'h'; d.st.classList.remove('hint'); d.st.classList.add('drag');
      try { d.st.setPointerCapture(e.pointerId); } catch { }
    } else if (dy > 6) d.mode = 'v';
  }
  if (d.mode !== 'h') return;
  d.px = e.clientX;                                      // одно обновление ползунка на кадр
  if (!d.raf) d.raf = requestAnimationFrame(() => {
    d.raf = 0; const b = d.st.getBoundingClientRect(), v = ((d.px - b.left) / b.width) * 100;
    const edge = v <= 0 ? 0 : v >= 100 ? 100 : null;
    if (edge !== null && d.edge !== edge) ctx?.haptic?.();   // лёгкий отклик у краёв
    d.edge = edge; setInlineX(d.st, v);
  });
});
function endInlineDrag(e) {
  const d = cmpDrag;
  if (!d || e.pointerId !== d.id) return;
  cmpDrag = null; d.st.classList.remove('drag');
  if (d.raf) { cancelAnimationFrame(d.raf); d.raf = 0; }
  const b = d.st.getBoundingClientRect();
  if (d.mode === 'h' && d.px != null) setInlineX(d.st, ((d.px - b.left) / b.width) * 100);   // последний кадр не теряем
  // Тап = сдвиг за всё касание < 6px и < 350 мс, даже если дрожь пальца успела выбрать «вбок»:
  // ползунок возвращается, открывается полный экран. Порог направления не поднимаем — иначе iOS начнёт прокрутку.
  const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0);
  const tap = e.type === 'pointerup' && moved < 6 && e.timeStamp - d.t0 < 350;
  if (!tap) return;
  if (d.mode === 'h') setInlineX(d.st, d.v0);
  ctx?.haptic?.();                                     // короткое нажатие — на весь экран
  const s = inl[d.st.dataset.key] || {};
  ghostUntil = performance.now() + 450;   // click этого же касания не должен попасть в открывшуюся панель (вкладку, крестик)
  openCompare(d.st.dataset.key, s.pi || 0, s.x ?? 50);
}
document.addEventListener('pointerup', endInlineDrag);
document.addEventListener('pointercancel', endInlineDrag);
// жест вбок (ползунок, полоса «Рядом», миниатюры пар) не должен тянуть шторку: её жест — touchmove на #sheet
let hTouch = null;
addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  hTouch = e.target.closest?.('.mp-near-row, .cmp-ipairs') ? { x: t.clientX, y: t.clientY, h: null } : null;
}, { capture: true, passive: true });
addEventListener('touchmove', (e) => {
  if (cmpDrag?.mode === 'h') { e.stopPropagation(); return; }
  if (!hTouch) return;
  const t = e.touches[0];
  if (hTouch.h == null) { const dx = Math.abs(t.clientX - hTouch.x), dy = Math.abs(t.clientY - hTouch.y); if (dx > 6 || dy > 6) hTouch.h = dx > dy; }
  if (hTouch.h) e.stopPropagation();
}, { capture: true, passive: true });
addEventListener('keydown', (e) => {
  if (viewer) return;
  const st = e.target.closest?.('.cmp-inline');
  if (!st || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  e.preventDefault();
  setInlineX(st, (inl[st.dataset.key]?.x ?? 50) + (e.key === 'ArrowLeft' ? -5 : 5));
});

// ───── просмотр на весь экран ─────
// Одна панель в стиле карточки: ручка, название, вкладки «Сравнить · Жизнь · Игра».
// Вбок — соседняя вкладка (на фото «Сравнить» вбок двигает ползунок), в открытом снимке — соседний снимок.
// Вниз — закрыть. «Назад» (кнопка ‹, системный жест Android, свайп от левого края на iPhone, Esc) — на шаг:
// из снимка в сетку, из панели в карточку. Каждый уровень — запись в истории (тот же адрес, только state).
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function viewerEl() {
  let el = document.getElementById('mp-viewer');
  if (!el) { el = document.createElement('div'); el.id = 'mp-viewer'; document.body.appendChild(el); bindViewerGestures(el); }
  return el;
}
function vSections(key) {
  const s = [];
  if ((pairsOf[key] || []).length) s.push('cmp');
  if ((galleries[`r:${key}`] || []).length) s.push('r');
  if ((galleries[`g:${key}`] || []).length) s.push('g');
  return s;
}
let closeTimer = 0, ghostUntil = 0, lastFocus = null;
let navPending = false, afterNav = null;   // своя перемотка истории после закрытия ещё не дошла — новую запись ставим после неё
function openViewerAt(key, sec, o = {}) {
  const el = viewerEl();
  clearTimeout(closeTimer); el.classList.remove('closing'); el.style.removeProperty('--dim');
  lastFocus = document.activeElement; lastFocus?.blur?.();
  viewer = { key, sec, pi: o.pi ?? 0, x: o.x ?? 50, one: o.one || null, depth: 1 };
  const push = () => history.pushState({ mpv: 1 }, '');
  if (navPending) afterNav = push; else push();
  renderViewer('in');
}
addEventListener('click', (e) => {
  if (performance.now() < ghostUntil && e.target.closest?.('#mp-viewer')) { e.preventDefault(); e.stopPropagation(); }
}, true);
function openViewer(ref, n = 0) { openSingle(ref, n); }
function openCompare(key, pi = 0, x = 50) {
  if (!vSections(key).includes('cmp')) return openAll(key, 'r');
  const P = pairsOf[key];
  pi = (pi + P.length) % P.length;
  if (viewer && viewer.key === key) { Object.assign(viewer, { sec: 'cmp', pi, x }); renderViewer(); return; }
  openViewerAt(key, 'cmp', { pi, x });
}
function openAll(key, tab = 'r') {
  const secs = vSections(key).filter((x) => x !== 'cmp');
  const sec = secs.includes(tab) ? tab : secs[0];
  if (!sec) return;
  if (viewer && viewer.key === key) { viewer.sec = sec; renderViewer(); return; }
  openViewerAt(key, sec);
}
function openSingle(ref, n = 0) {
  const list = galleries[ref] || [];
  if (!list.length) return;
  const kind = ref[0], key = ref.slice(2);
  n = (n + list.length) % list.length;
  if (viewer && viewer.key === key) {
    if (!viewer.one) { viewer.depth = 2; history.pushState({ mpv: 2 }, ''); }
    viewer.one = { list: kind, n }; renderViewer('in-one'); return;
  }
  openViewerAt(key, kind, { one: { list: kind, n } });   // прямо из карточки: «назад» сразу в карточку
}
function stepSingle(d) {
  const v = viewer, list = galleries[`${v.one.list}:${v.key}`] || [], n = v.one.n + d;
  if (n < 0 || n >= list.length) return false;
  v.one.n = n; renderViewer(d > 0 ? 'from-r' : 'from-l'); return true;
}
function stepSection(d) {
  const secs = vSections(viewer.key), k = secs.indexOf(viewer.sec) + d;
  if (k < 0 || k >= secs.length) return false;
  viewer.sec = secs[k]; renderViewer(d > 0 ? 'from-r' : 'from-l'); return true;
}
function openVideo(id, t, label) {
  if (!/^[\w-]{6,20}$/.test(id || '')) return;
  const el = viewerEl();
  clearTimeout(closeTimer); el.classList.remove('closing'); el.style.removeProperty('--dim');
  lastFocus = document.activeElement; lastFocus?.blur?.();
  viewer = { key: null, video: { id, t, label }, one: null, depth: 1 };
  const push = () => history.pushState({ mpv: 1 }, '');
  if (navPending) afterNav = push; else push();
  renderViewer('in');
}
function renderViewer(anim = '') {
  const v = viewer;
  if (!v) return;
  if (v.video) {
    const el = viewerEl(), src = `https://www.youtube-nocookie.com/embed/${v.video.id}?start=${v.video.t}&autoplay=1&playsinline=1&rel=0&modestbranding=1`;
    el.innerHTML = `<div class="mpv-panel${anim === 'in' ? ' enter' : ''}" role="dialog" aria-modal="true" tabindex="-1">
      <div class="mpv-top"><span class="mpv-grab" aria-hidden="true"></span>
        <div class="mpv-head"><div class="mpv-ttl"><b>${IC.play}<span>${esc(v.video.label)}</span></b><small>Rockstar Games</small></div>
          <button class="mpv-x" data-mp="viewer-close" aria-label="${esc(w('close'))}">${IC.close}</button></div></div>
      <div class="mpv-body"><div class="mpv-video"><iframe src="${src}" title="${esc(v.video.label)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div></div>`;
    el.classList.add('open');
    return;
  }
  const el = viewerEl(), key = v.key, names = galNames[key] || {};
  const P = pairsOf[key] || [], R = galleries[`r:${key}`] || [], G = galleries[`g:${key}`] || [];
  const secs = vSections(key);
  if (!secs.includes(v.sec)) v.sec = secs[0];
  let head, tabs = '', body;
  if (v.one) {
    const list = v.one.list === 'r' ? R : G, n = v.one.n, ph = list[n] || {};
    head = `<button class="mpv-back" data-mp="viewer-back" aria-label="${esc(w('back'))}" title="${esc(w('back'))}">${IC.chevL}</button>
      <div class="mpv-ttl"><b>${v.one.list === 'g' ? IC.game : IC.camera}<span>${esc(v.one.list === 'g' ? names.g || '' : names.r || '')}</span></b><small>${n + 1} / ${list.length}</small></div>`;
    body = `<div class="mpv-stage" id="mpv-stage"><img src="${esc(ph.url)}" alt="" draggable="false">
        ${n > 0 ? `<button class="mpv-arr l" data-mp="viewer-step" data-d="-1" aria-label="‹">${IC.chevL}</button>` : ''}
        ${n < list.length - 1 ? `<button class="mpv-arr r" data-mp="viewer-step" data-d="1" aria-label="›">${IC.chevR}</button>` : ''}</div>
      <p class="mpv-credit">${ph.ap ? `<b class="mpv-approx">${esc(w('approxT'))}</b> · ` : ''}${esc(ph.credit || '')}</p>`;
  } else {
    const lab = { cmp: [IC.swap, w('compare'), P.length > 1 ? P.length : ''], r: [IC.camera, w('real'), R.length], g: [IC.game, w('game'), G.length] };
    head = `<div class="mpv-ttl"><b>${IC.game}<span>${esc(names.g || '')}</span></b><small>${esc(names.r || '')}</small></div>`;
    tabs = secs.length > 1 ? `<div class="mpv-seg" role="tablist">${secs.map((s) => `<button role="tab" aria-selected="${s === v.sec}" class="${s === v.sec ? 'on' : ''}" data-mp="sec" data-s="${s}">${lab[s][0]}<span>${esc(lab[s][1])}</span>${lab[s][2] ? `<em>${lab[s][2]}</em>` : ''}</button>`).join('')}</div>` : '';
    if (v.sec === 'cmp') {
      const pr = P[v.pi];
      body = `<div class="cmp-stage mpv-cmp" id="cmp-stage" style="--x:${v.x}%">
          <img class="cmp-g" src="${esc(pr.g.url)}" alt="" draggable="false">
          <img class="cmp-r" src="${esc(pr.r.url)}" alt="" draggable="false">
          <span class="cmp-lab g">${IC.game}<b>${esc(w('game'))}</b></span>
          <span class="cmp-lab r">${IC.camera}<b>${esc(w('real'))}</b></span>
          <div class="cmp-line"><span class="cmp-knob">${IC.chevL}${IC.chevR}</span></div>
        </div>
        ${P.length > 1 ? `<div class="cmp-pairs">${P.map((x, k) => `<button class="${k === v.pi ? 'on' : ''}" data-mp="pair" data-n="${k}" aria-label="${k + 1}/${P.length}"><img src="${esc(x.g.url)}" alt="" loading="lazy"><img src="${esc(x.r.url)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        <p class="mpv-credit">${esc(pr.g.credit)} · ${esc(pr.r.credit)}</p>`;
    } else {
      const list = v.sec === 'r' ? R : G;
      body = `<div class="mpa-grid">${list.map((ph, k) => `<button class="mpa-img" data-mp="view" data-ref="${v.sec}:${key}" data-n="${k}"><img src="${esc(ph.thumb)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>`;
    }
  }
  const hint = !renderViewer.hinted && (secs.length > 1 || v.one) ? `<p class="mpv-hint">${esc(w('vhint'))}</p>` : '';
  if (hint) renderViewer.hinted = true;
  el.innerHTML = `<div class="mpv-panel${anim === 'in' ? ' enter' : ''}" role="dialog" aria-modal="true" tabindex="-1">
      <div class="mpv-top"><span class="mpv-grab" aria-hidden="true"></span>
        <div class="mpv-head">${head}<button class="mpv-x" data-mp="viewer-close" aria-label="${esc(w('close'))}" title="${esc(w('close'))}">${IC.close}</button></div>${tabs}</div>
      <div class="mpv-body ${anim}">${body}</div>${hint}</div>`;
  el.classList.add('open');
  if (anim === 'in') el.querySelector('.mpv-panel')?.focus({ preventScroll: true });
  const stage = el.querySelector('#cmp-stage');
  if (stage) {   // мышь: тянуть ползунок (касания — в жестах панели)
    let drag = false;
    stage.onpointerdown = (e) => { if (e.pointerType === 'touch') return; stage.classList.remove('hint'); drag = true; stage.setPointerCapture?.(e.pointerId); setCmpX(stage, e.clientX); };
    stage.onpointermove = (e) => { if (drag) setCmpX(stage, e.clientX); };
    stage.onpointerup = stage.onpointercancel = () => { drag = false; };
    if (!openCompare.hinted && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      openCompare.hinted = true; stage.classList.add('hint'); setTimeout(() => stage.classList.remove('hint'), 1600);
    }
  }
}
function setCmpX(stage, cx) {
  const b = stage.getBoundingClientRect(), v = Math.max(0, Math.min(100, ((cx - b.left) / b.width) * 100));
  stage.style.setProperty('--x', v + '%'); if (viewer) viewer.x = v;
}
function viewerBack() { if (viewer) history.back(); }          // popstate сделает шаг
function hideViewer() {
  const el = document.getElementById('mp-viewer');
  viewer = null; vg = null; resetDocScroll();
  if (!el?.classList.contains('open')) return;
  const panel = el.querySelector('.mpv-panel');
  const done = () => { if (viewer) return; el.classList.remove('open', 'closing'); el.style.removeProperty('--dim'); el.innerHTML = ''; };
  if (panel && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add('closing'); panel.style.transition = ''; panel.style.transform = 'translateY(100%)';
    clearTimeout(closeTimer); closeTimer = setTimeout(done, 230);
  } else done();
  if (lastFocus?.isConnected) lastFocus.focus?.({ preventScroll: true });
  lastFocus = null;
}
// закрыть крестиком/свайпом: убрать свои записи из истории (popstate придёт при viewer = null и ничего не сделает)
function closeViewer() {
  if (!viewer) return;
  const d = viewer.depth || 1;
  hideViewer();
  navPending = true; history.go(-d);
  setTimeout(() => { if (navPending) finishNav(); }, 800);   // страховка, если popstate не придёт
}
function finishNav() { navPending = false; const f = afterNav; afterNav = null; f?.(); }
addEventListener('popstate', (e) => {
  if (navPending) { finishNav(); return; }   // это наша перемотка после закрытия
  const to = e.state?.mpv || 0;
  if (!viewer) { if (to) history.go(-to); return; }      // устаревшая запись просмотра (вперёд после закрытия, перезагрузка) — пройти её
  if (to > viewer.depth) { history.go(viewer.depth - to); return; }   // «вперёд» дальше текущего уровня — вернуться
  if (to === 0) { hideViewer(); return; }
  if (to === 1 && viewer.depth === 2) { viewer.one = null; viewer.depth = 1; renderViewer('back'); }
});
if (history.state?.mpv) history.go(-history.state.mpv);   // map.js загрузился после перезагрузки на записи просмотра
// жесты панели (касания): решаем направление на первом touchmove — иначе iOS успеет начать свою прокрутку
let vg = null;
function bindViewerGestures(el) {
  const reset = () => {
    const panel = el.querySelector('.mpv-panel'), body = el.querySelector('.mpv-body');
    for (const n of [panel, body]) if (n) { n.style.transition = ''; n.style.transform = ''; }
    el.style.removeProperty('--dim');
  };
  el.addEventListener('touchstart', (e) => {
    if (!viewer || e.touches.length !== 1) { if (vg?.mode) reset(); vg = null; return; }   // второй палец — отпустить жест
    const t = e.touches[0], tg = e.target;
    vg = { x0: t.clientX, y0: t.clientY, t0: e.timeStamp, dx: 0, dy: 0, mode: null,
      stage: tg.closest('.mpv-cmp'), grid: tg.closest('.mpa-grid'), strip: tg.closest('.cmp-pairs, .mpv-seg'),
      edge: isStandalone() && t.clientX < 20 && !(tg.closest('.mpv-cmp') && (viewer.x ?? 50) < 15) };
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    const g = vg;
    if (!g || !viewer) return;
    const t = e.touches[0];
    g.dx = t.clientX - g.x0; g.dy = t.clientY - g.y0;
    if (!g.mode) {
      const ax = Math.abs(g.dx), ay = Math.abs(g.dy);
      const scroller = g.grid || (g.strip && g.strip.scrollWidth > g.strip.clientWidth + 2 ? g.strip : null);
      if (!scroller && ax + ay < 6) { if (e.cancelable) e.preventDefault(); return; }   // своей прокрутки нет — ждём явного направления
      if (scroller && ax + ay < 1) return;
      if (g.edge && g.dx > 0 && ax >= ay) g.mode = 'edge';
      else if (g.grid) g.mode = ax > ay * 2 && ax >= 2 ? 'swipe' : (g.dy > 0 && ay > ax && g.grid.scrollTop <= 0 ? 'dismiss' : 'native');   // в сетке спорное — прокрутка
      else if (ay > ax * 1.2) g.mode = g.dy > 0 ? 'dismiss' : 'native';
      else if (g.stage) { g.mode = 'slider'; g.stage.classList.remove('hint'); }
      else if (g.strip && scroller) g.mode = 'native';
      else g.mode = 'swipe';
    }
    if (g.mode === 'native') return;
    if (e.cancelable) e.preventDefault();
    const panel = el.querySelector('.mpv-panel'), body = el.querySelector('.mpv-body');
    if (g.mode === 'dismiss') { panel.style.transition = 'none'; panel.style.transform = `translateY(${Math.max(0, g.dy)}px)`; el.style.setProperty('--dim', String(Math.max(0, 1 - g.dy / 500))); }
    else if (g.mode === 'edge') { panel.style.transition = 'none'; panel.style.transform = `translateX(${Math.max(0, g.dx)}px)`; }
    else if (g.mode === 'slider') setCmpX(g.stage, t.clientX);
    else if (g.mode === 'swipe') {
      const can = viewer.one ? (g.dx < 0 ? viewer.one.n < (galleries[`${viewer.one.list}:${viewer.key}`] || []).length - 1 : viewer.one.n > 0)
        : (() => { const s = vSections(viewer.key), k = s.indexOf(viewer.sec); return g.dx < 0 ? k < s.length - 1 : k > 0; })();
      body.style.transition = 'none'; body.style.transform = `translateX(${g.dx * (can ? 1 : 0.25)}px)`;
    }
  }, { passive: false });
  const end = (e) => {
    const g = vg; vg = null;
    if (g && viewer && !g.mode && g.stage && e.type === 'touchend' && e.timeStamp - g.t0 < 350) { setCmpX(g.stage, g.x0); return; }   // тап по фото — ползунок сюда
    if (!g || !viewer || !g.mode || g.mode === 'native' || g.mode === 'slider') return;
    const panel = el.querySelector('.mpv-panel'), body = el.querySelector('.mpv-body');
    const dt = Math.max(1, e.timeStamp - g.t0), vx = g.dx / dt, vy = g.dy / dt;
    const snap = (node) => { if (!node) return; node.style.transition = ''; node.style.transform = ''; el.style.removeProperty('--dim'); };
    if (e.type === 'touchcancel' || e.touches.length) { reset(); return; }
    if (g.mode === 'dismiss') { if (g.dy > 110 || (vy > 0.6 && g.dy > 30)) { ctx?.haptic?.(); closeViewer(); } else snap(panel); }
    else if (g.mode === 'edge') { snap(panel); if (g.dx > 80 || (vx > 0.5 && g.dx > 30)) viewerBack(); }
    else if (g.mode === 'swipe') {
      const d = g.dx < 0 ? 1 : -1;
      const go = (Math.abs(g.dx) > 60 || (Math.abs(vx) > 0.45 && Math.abs(g.dx) > 20)) && (viewer.one ? stepSingle(d) : stepSection(d));
      if (go) ctx?.haptic?.(); else snap(body);
    }
  };
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
}

// Страница приложения никогда не прокручивается целиком (иначе на iPhone вылезают спрятанные слои — например, экран оплаты).
// Любую прокрутку документа сразу возвращаем в ноль. Корень и проверка — tools/check_no_doc_scroll.js.
function resetDocScroll() { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); }
addEventListener('scroll', resetDocScroll, { passive: true });

// ───── лента карточек внизу карты ─────
function ensureChrome() {
  const view = document.getElementById('view-map');
  if (!document.getElementById('map-cards')) {
    const c = document.createElement('div'); c.id = 'map-cards'; c.className = 'map-cards'; view.appendChild(c);
  }
  const fabs = view.querySelector('.map-fabs');
  if (fabs && !fabs.querySelector('[data-mp="help"]')) {
    const b = document.createElement('button'); b.className = 'map-fab'; b.dataset.mp = 'help'; b.setAttribute('aria-label', 'help'); b.innerHTML = IC.help;
    fabs.prepend(b);
  }
}
function renderCards() {
  const box = document.getElementById('map-cards');
  if (!box || !map || !data[game]) return;
  const places = data[game].places;
  const b = map.getBounds(), c = map.getCenter();
  const vis = show.places ? places.map((p, i) => ({ p, i, c: ll(p) })).filter(({ p, c }) => c && (activeCat ? p.gc === activeCat : b.contains(c))) : [];
  // на общем плане — сначала самые узнаваемые (точная копия, обе фотографии), при приближении — ближайшие к центру
  const rank = (p) => (p.cf === 'confirmed' ? 0 : p.cf === 'likely' ? 1 : 2) + (p.pg && p.pr ? 0 : 1.5);
  const dc = (x) => km([c.lat, c.lng], [x.c[1], x.c[0]]);
  if (map.getZoom() < (tilesGame() ? 5 : 12.5)) vis.sort((a, z) => rank(a.p) - rank(z.p) || dc(a) - dc(z));
  else vis.sort((a, z) => dc(a) - dc(z));
  const top = vis.slice(0, 30);
  if (selected != null && !top.some((x) => x.i === selected)) { const s = vis.find((x) => x.i === selected); if (s) top.unshift(s); }
  let extra = '';
  if (show.gtadb && gtadb[game] && (activeCat || map.getZoom() >= (tilesGame() ? 6 : 13)) && top.length < 30) {
    const g = gtadb[game];
    const pts = g.points.map((q, i) => ({ q, i, c: llPt(q) })).filter(({ q, c }) => c && (activeCat ? q[12] === activeCat : b.contains(c)));
    pts.sort((a, z) => km([c.lat, c.lng], [a.c[1], a.c[0]]) - km([c.lat, c.lng], [z.c[1], z.c[0]]));
    extra = pts.slice(0, 30 - top.length).map(({ q, i }) => {
      const ph = gtadbPhotos(q, g.game);
      return `<button class="mc mc-d${i === selectedD ? ' on' : ''}" data-mp="dcard" data-d="${i}" data-i="${i}">
        <span class="mc-ph">${ph.pg ? `<img src="${esc(ph.pg.file)}" alt="" loading="lazy" decoding="async">` : `<i class="g">${IC.game}</i>`}${ph.pr ? `<img src="${esc(ph.pr.file)}" alt="" loading="lazy" decoding="async">` : `<i class="r">${IC.camera}</i>`}<em>${IC.game}</em><em class="r">${IC.camera}</em></span>
        <span class="mc-t"><b>${esc(q[3].split(',')[0])}</b><small>${IC.game}${esc(q[1] || q[2] || q[0])}</small></span>
        <span class="mc-ic">${IC.other}<span class="mc-dot"></span>${me ? `<em>${distLabel({ lat: q[4], lon: q[5] })}</em>` : ''}</span>
      </button>`;
    }).join('');
  }
  const other = game === 'gta6' ? 'gta5' : 'gta6';
  const promo = BETA && !activeCat && map.getZoom() < (tilesGame() ? 4.5 : 11) ? `<button class="mc mc-promo${other === 'gta6' ? ' g6' : ''}" data-mp="game" data-v="${other}">
      <span class="mc-promo-t"><b>${GAMES[other].title}</b><small>${esc(w(other === 'gta6' ? 'promo6' : 'promo5'))}</small></span>
      <span class="mc-promo-n">${data[other] ? `<em>${data[other].places.length}</em> ${esc(w('places_n'))}` : ''}${IC.chevR}</span></button>` : '';
  if (BETA && !data[other]) loadGame(other).then(() => { if (promo === '') return; renderCards(); }).catch(() => { });
  if (!top.length && !extra) { box.innerHTML = promo + `<div class="mc-empty">${IC.pin}<span>${esc(w('zoom'))}</span></div>`; return; }
  box.innerHTML = promo + (extra && !top.length ? extra : top.map(({ p, i }) => {
    const ck = catKey(p);
    return `<button class="mc${i === selected ? ' on' : ''}" data-mp="card" data-i="${i}">
      <span class="mc-ph">${p.pg ? `<img src="${esc(p.pg.thumb || p.pg.file)}" alt="" loading="lazy" decoding="async">` : `<i class="g">${IC.game}</i>`}${p.pr ? `<img src="${esc(p.pr.thumb || p.pr.file)}" alt="" loading="lazy" decoding="async">` : `<i class="r">${IC.camera}</i>`}<em>${IC.game}</em><em class="r">${IC.camera}</em></span>
      <span class="mc-t"><b>${esc(p.n)}</b><small>${IC.game}${esc(p.g)}</small></span>
      <span class="mc-ic">${IC[ck]}${p.ac && IC[p.ac] ? IC[p.ac] : ''}${meter(p.cf)}${me ? `<em>${distLabel(p)}</em>` : ''}</span>
    </button>`;
  }).join('') + (top.length ? extra : ''));
}
function scrollCardIntoView(i) {
  const el = document.querySelector(`#map-cards .mc[data-i="${i}"]`);
  el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

// ───── слои ─────
const fc = (features) => ({ type: 'FeatureCollection', features });
const pt = (lon, lat, props) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: props });

function geo(kind) {
  const d = data[game];
  const at = (c, props) => (c ? pt(c[0], c[1], props) : null);
  const est = (x) => (mode === 'game' && x.gm && x.gm[2] === 2 ? 1 : 0);   // место в игре оценено по соседним точкам
  if (kind === 'places') return fc((d?.places || []).map((p, i) => at(ll(p), { i, cf: p.cf, egg: (p.eggs || []).length ? 1 : 0, est: est(p), gc: p.gc || '' })).filter(Boolean));
  if (kind === 'eggs') return fc((d?.eggs || []).map((e, i) => at(ll(e), { i, cf: e.cf, est: est(e) })).filter(Boolean));
  if (kind === 'gtadb') return fc(show.gtadb && gtadb[game] ? gtadb[game].points.map((p, i) => at(llPt(p), { i, gc: p[12] || '' })).filter(Boolean) : []);
  if (kind === 'sel') {
    const p = selected != null && d?.places[selected];
    if (p) return fc([at(ll(p), {})].filter(Boolean));
    const q = selectedD != null && gtadb[game]?.points[selectedD];
    return fc(q ? [at(llPt(q), {})].filter(Boolean) : []);
  }
  return fc([]);
}

// ───── метки на карте игры — как значки (blips) в GTA: белый силуэт с тёмной обводкой ─────
const BLIP = {
  w: 'M2 7h18v4h-8.5l-1.2 2.2H8.6L7.4 19H3.2l1.6-8H2z',                                             // пистолет — оружие
  c: 'M5.2 10.5 7 6.2C7.3 5.5 8 5 8.8 5h6.4c.8 0 1.5.5 1.8 1.2l1.8 4.3H20c.6 0 1 .4 1 1V16h-1.6a2.4 2.4 0 0 1-4.8 0H8.4a2.4 2.4 0 0 1-4.8 0H3v-4.5c0-.6.4-1 1-1z', // машина
  s: 'M8.5 3 3 6l2.2 4.2L7 9.3V21h10V9.3l1.8.9L21 6l-5.5-3c-.5 1.6-1.9 2.6-3.5 2.6S9 4.6 8.5 3z',   // футболка — магазины
};
function blipImage(kind) {
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.92)'; g.fillStyle = '#ffffff';
  if (kind === 'pt' || kind === 'dot') {           // обычное место — белый кружок; точка сообщества — меньше и серее
    const r = kind === 'pt' ? 15 : 10;
    g.beginPath(); g.arc(S / 2, S / 2, r, 0, Math.PI * 2); g.lineWidth = 6; g.stroke();
    g.fillStyle = kind === 'pt' ? '#ffffff' : '#c9ced6'; g.fill();
  } else if (kind === 'h' || kind === 'egg') {      // ограбление — «$», пасхалка — «?» (как случайные события в GTA)
    g.font = `900 ${kind === 'h' ? 50 : 46}px system-ui, -apple-system, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kind === 'egg') g.fillStyle = COLORS.egg;
    g.lineWidth = 8; g.strokeText(kind === 'h' ? '$' : '?', S / 2, S / 2 + 3); g.fillText(kind === 'h' ? '$' : '?', S / 2, S / 2 + 3);
  } else {
    const p = new Path2D(BLIP[kind]);
    g.translate(S / 2 - 24, S / 2 - 24); g.scale(2, 2);
    g.lineWidth = 3; g.stroke(p); g.fill(p);
  }
  return g.getImageData(0, 0, S, S);
}
function ensureBlips() {
  for (const k of ['w', 'c', 'h', 's', 'pt', 'dot', 'egg']) if (!map.hasImage('blip-' + k)) map.addImage('blip-' + k, blipImage(k), { pixelRatio: 2 });
}
const blipFor = (fallback) => ['match', ['get', 'gc'], 'w', 'blip-w', 'c', 'blip-c', 'h', 'blip-h', 's', 'blip-s', fallback];

function addLayers() {
  const dark = themeKey() === 'dark';
  const stroke = dark ? '#0b0b0d' : '#ffffff';
  for (const k of ['gtadb', 'places', 'eggs', 'sel']) if (!map.getSource(k)) map.addSource(k, { type: 'geojson', data: geo(k) });
  const z = tilesGame() ? (a, b) => ['interpolate', ['linear'], ['zoom'], 2, a, 8, b] : (a, b) => ['interpolate', ['linear'], ['zoom'], 8, a, 15, b];
  if (mode === 'game') { addGameLayers(z); applyShow(); applyCat(); return; }
  if (!map.getLayer('gtadb')) map.addLayer({ id: 'gtadb', type: 'circle', source: 'gtadb', minzoom: mode === 'game' ? 5 : 11.5,
    paint: { 'circle-radius': BETA ? z(['case', ['!=', ['get', 'gc'], ''], 4.5, 2.5], ['case', ['!=', ['get', 'gc'], ''], 9, 6]) : z(2.5, 6),
      'circle-color': BETA ? ['match', ['get', 'gc'], 'w', CATS.w.c, 'c', CATS.c.c, 'h', CATS.h.c, 's', CATS.s.c, COLORS.gtadb] : COLORS.gtadb,
      'circle-opacity': .85, 'circle-stroke-width': 1, 'circle-stroke-color': stroke } });
  if (!map.getLayer('places-glow')) map.addLayer({ id: 'places-glow', type: 'circle', source: 'places', filter: ['==', ['get', 'cf'], 'confirmed'],
    paint: { 'circle-radius': z(9, 18), 'circle-color': COLORS.confirmed, 'circle-opacity': .18, 'circle-blur': .6 } });
  if (!map.getLayer('places')) map.addLayer({ id: 'places', type: 'circle', source: 'places',
    paint: { 'circle-radius': z(4.5, 10), 'circle-stroke-width': 1.5, 'circle-stroke-color': stroke,
      'circle-color': ['match', ['get', 'cf'], 'confirmed', COLORS.confirmed, 'speculative', COLORS.speculative, COLORS.likely],
      'circle-opacity': ['case', ['==', ['get', 'est'], 1], 0.55, 1] } });
  if (!map.getLayer('places-egg')) map.addLayer({ id: 'places-egg', type: 'circle', source: 'places', filter: ['==', ['get', 'egg'], 1],
    paint: { 'circle-radius': z(7, 14), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 2.2, 'circle-stroke-color': COLORS.egg } });
  if (!map.getLayer('eggs')) map.addLayer({ id: 'eggs', type: 'circle', source: 'eggs',
    paint: { 'circle-radius': z(5, 11), 'circle-color': COLORS.egg, 'circle-stroke-width': 2.2, 'circle-stroke-color': '#ffffff' } });
  if (!map.getLayer('sel')) map.addLayer({ id: 'sel', type: 'circle', source: 'sel',
    paint: { 'circle-radius': z(11, 18), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 3, 'circle-stroke-color': dark ? '#ffffff' : '#0b0b0d' } });
  if (!map.getSource('me')) {
    map.addSource('me', { type: 'geojson', data: fc(me && mode === 'real' ? [pt(me[1], me[0], {})] : []) });
    map.addLayer({ id: 'me', type: 'circle', source: 'me', paint: { 'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
  }
  applyShow(); applyCat();
}
// карта игры: метки — значки как в GTA; тень под значком, розовая точка «тут пасхалка», кольцо выбора
function addGameLayers(z) {
  ensureBlips();
  const sym = (id, source, icon, size, extra = {}) => map.addLayer({ id, type: 'symbol', source, ...extra,
    layout: { 'icon-image': icon, 'icon-size': size, 'icon-allow-overlap': true, 'icon-ignore-placement': true },
    paint: { 'icon-opacity': ['case', ['==', ['get', 'est'], 1], 0.6, 1] } });
  if (!map.getLayer('gtadb')) sym('gtadb', 'gtadb', blipFor('blip-dot'), z(['case', ['!=', ['get', 'gc'], ''], 0.55, 0.5], ['case', ['!=', ['get', 'gc'], ''], 0.95, 0.8]), { minzoom: tilesGame() ? 5 : 11.5 });
  if (!map.getLayer('places-glow')) map.addLayer({ id: 'places-glow', type: 'circle', source: 'places',
    paint: { 'circle-radius': z(9, 15), 'circle-color': '#000', 'circle-opacity': .28, 'circle-blur': .7 } });
  if (!map.getLayer('places')) sym('places', 'places', blipFor('blip-pt'), z(0.62, 1.05));
  if (!map.getLayer('places-egg')) map.addLayer({ id: 'places-egg', type: 'circle', source: 'places', filter: ['==', ['get', 'egg'], 1],
    paint: { 'circle-radius': z(3, 4.5), 'circle-color': COLORS.egg, 'circle-stroke-width': 1.5, 'circle-stroke-color': '#000', 'circle-translate': [9, -9] } });
  if (!map.getLayer('eggs')) sym('eggs', 'eggs', 'blip-egg', z(0.62, 1.05));
  if (!map.getLayer('sel')) map.addLayer({ id: 'sel', type: 'circle', source: 'sel',
    paint: { 'circle-radius': z(13, 19), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' } });
  if (!map.getSource('me')) {
    map.addSource('me', { type: 'geojson', data: fc([]) });
    map.addLayer({ id: 'me', type: 'circle', source: 'me', paint: { 'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
  }
}
// выбрана категория — показать все её точки на экране
function fitCat() {
  if (!activeCat || !map) return;
  const cs = [...(data[game]?.places || []).filter((p) => p.gc === activeCat).map(ll), ...(gtadb[game]?.points || []).filter((q) => q[12] === activeCat).map(llPt)].filter(Boolean);
  if (!cs.length) return;
  const b = cs.reduce((bb, c) => bb.extend(c), new window.maplibregl.LngLatBounds(cs[0], cs[0]));
  map.fitBounds(b, { padding: { top: 140, bottom: 220, left: 40, right: 40 }, maxZoom: tilesGame() ? 6 : 14, duration: 700 });
}
// фильтр категории (бета): только точки этой категории — места и точки gtadb
function applyCat() {
  if (!map?.getLayer('places')) return;
  const f = activeCat ? ['==', ['get', 'gc'], activeCat] : null;
  const glow = mode === 'game' ? null : ['==', ['get', 'cf'], 'confirmed'];
  for (const l of ['places', 'places-glow', 'places-egg', 'gtadb']) if (map.getLayer(l)) map.setFilter(l, l === 'places-glow' ? (f && glow ? ['all', glow, f] : f || glow) : l === 'places-egg' ? (f ? ['all', ['==', ['get', 'egg'], 1], f] : ['==', ['get', 'egg'], 1]) : f);
  if (map.getLayer('gtadb')) map.setLayerZoomRange('gtadb', activeCat ? 0 : (tilesGame() ? 5 : 11.5), 24);
  if (map.getLayer('eggs')) map.setLayoutProperty('eggs', 'visibility', activeCat ? 'none' : (show.eggs ? 'visible' : 'none'));
}
function refreshData() {
  for (const k of ['gtadb', 'places', 'eggs', 'sel']) map.getSource(k)?.setData(geo(k));
}
function applyShow() {
  const vis = (on) => (on ? 'visible' : 'none');
  if (!map.getLayer('places')) return;
  map.setLayoutProperty('gtadb', 'visibility', vis(show.gtadb));
  map.setLayoutProperty('places', 'visibility', vis(show.places));
  map.setLayoutProperty('places-glow', 'visibility', vis(show.places));
  if (map.getLayer('places-egg')) map.setLayoutProperty('places-egg', 'visibility', vis(show.places));
  map.setLayoutProperty('eggs', 'visibility', vis(show.eggs));
}

function openPlace(i, fly) {
  const p = data[game].places[i];
  selected = i; selectedD = null;
  map?.getSource('sel')?.setData(geo('sel'));
  const c = ll(p);
  if (fly && c) map.easeTo({ center: c, zoom: Math.max(map.getZoom(), tilesGame() ? 6.5 : 14.5), duration: 700, offset: [0, -90] });
  renderCards(); scrollCardIntoView(i);
  mapSheet(placeSheet(p, i));
}

// «Несколько мест здесь»: карточку, открытую из этого списка, смахнули вниз — снова открывается список,
// чтобы не терять, откуда пришёл (Игорь 14.10.2026). Повторное смахивание закрывает список как обычно.
let chooserHtml = null, backToChooser = false;
function mapSheet(html) {
  const back = backToChooser && chooserHtml; backToChooser = false;
  ctx.openSheet(html, 'sheet-map', back ? () => setTimeout(() => {
    if (document.body.dataset.tab === 'map' && !document.getElementById('sheet-layer')?.classList.contains('open')) ctx.openSheet(back, 'sheet-map');
  }, 120) : null);
}
// нажатие по карте ждёт 250 мс: если за это время началось второе касание (двойной тап или «тап и тяни» —
// масштаб одним пальцем, как в навигаторе), точку не открываем (Игорь 14.10.2026: «палец попадает на точку — она открывается»)
let tapTimer = null;
const TAP_WAIT = 250;
function onTap(e) {
  clearTimeout(tapTimer);
  const point = e.point;
  tapTimer = setTimeout(() => { tapTimer = null; pickAt({ point }); }, TAP_WAIT);
}
function cancelTap() { if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; } }
// ищем точку в радиусе пальца, приоритет пасхалки > места > сообщество
function pickAt(e) {
  if (!map) return;
  const r = 14, { x, y } = e.point;
  const layers = ['eggs', 'places', 'gtadb'].filter((l) => map.getLayer(l) && map.getLayoutProperty(l, 'visibility') !== 'none');
  const hits = map.queryRenderedFeatures([[x - r, y - r], [x + r, y + r]], { layers });
  if (!hits.length) return;
  const uniq = []; const seenHit = new Set();
  for (const h of hits.sort((a, b) => dist(a, e) - dist(b, e))) { const k = h.layer.id + ':' + h.properties.i; if (!seenHit.has(k)) { seenHit.add(k); uniq.push(h); } }
  if (uniq.length > 1) { ctx.haptic(); chooserHtml = chooserSheet(uniq.slice(0, 12)); backToChooser = false; ctx.openSheet(chooserHtml, 'sheet-map'); return; }
  chooserHtml = null;
  const nearest = uniq[0];
  const i = nearest.properties.i, l = nearest.layer.id;
  ctx.haptic();
  if (l === 'eggs') mapSheet(eggSheet(data[game].eggs[i], i));
  else if (l === 'places') openPlace(i, false);
  else openPoint(i, false);
}
function chooserSheet(hits) {
  const row = (h) => {
    const i = h.properties.i, l = h.layer.id;
    let img = '', title = '', sub = '', ic = IC.pin;
    if (l === 'places') { const p = data[game].places[i]; img = (p.pg || p.pr || {}).thumb || (p.pg || p.pr || {}).file || ''; title = p.n; sub = p.g; }
    else if (l === 'eggs') { const e = data[game].eggs[i]; img = (e.pg || e.pr || {}).thumb || (e.pg || e.pr || {}).file || ''; title = txt(e.t); sub = w('egg'); ic = IC.egg; }
    else { const q = gtadb[game].points[i]; const ph = gtadbPhotos(q, gtadb[game].game); img = (ph.pg || ph.pr || {}).file || ''; title = q[3].split(',')[0]; sub = q[1] || q[2]; }
    return `<button class="mp-ch" data-mp="pick" data-l="${l}" data-i="${i}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="mp-ch-ic">${ic}</span>`}<span><b>${esc(title)}</b><small>${IC.game}${esc(sub || '')}</small></span></button>`;
  };
  return `<h2 class="pick-t">${esc(w('here'))}</h2><div class="mp-chooser">${hits.map(row).join('')}</div>`;
}
function openPoint(i, fly) {
  const q = gtadb[game].points[i];
  selected = null; selectedD = i;
  map?.getSource('sel')?.setData(geo('sel'));
  const c = llPt(q);
  if (fly && c) map.easeTo({ center: c, zoom: Math.max(map.getZoom(), tilesGame() ? 7 : 15), duration: 700, offset: [0, -90] });
  renderCards();
  document.querySelector(`#map-cards .mc[data-d="${i}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  mapSheet(gtadbSheet(q, gtadb[game].game, i));
}
function dist(f, e) {
  const p = map.project(f.geometry.coordinates);
  return (p.x - e.point.x) ** 2 + (p.y - e.point.y) ** 2;
}

// ───── интерфейс поверх карты ─────
function renderChips() {
  const d = data[game]; if (!d) return;
  const n = { places: d.places.length, eggs: d.eggs.length, gtadb: gtadb[game]?.points.length ?? '' };
  document.getElementById('map-chips').innerHTML = [
    ['places', t('map_places'), COLORS.confirmed], ['eggs', t('map_eggs'), COLORS.egg], ['gtadb', t('map_all'), COLORS.gtadb],
  ].map(([k, label, c]) => `<button class="mchip${show[k] ? ' on' : ''}" data-action="map-layer" data-v="${k}" style="--c:${c}"><i></i>${label}${n[k] !== '' ? ` <em>${n[k]}</em>` : ''}</button>`).join('')
    + (BETA ? Object.entries(CATS).map(([k, c]) => {
      const cnt = d.places.filter((p) => p.gc === k).length + (gtadb[game]?.points.filter((q) => q[12] === k).length || 0);
      return cnt ? `<button class="mchip mchip-cat${activeCat === k ? ' on' : ''}" data-mp="cat" data-v="${k}" style="--c:${c.c}"><i></i>${esc(tr(c.t))} <em>${cnt}</em></button>` : '';
    }).join('') : '');
  const G = GAMES[game];
  if (!BETA && mode === 'game') {
    document.getElementById('map-games').innerHTML =
      `<button class="mg-back" data-mp="mode" data-v="real">${IC.chevL}<b>${esc(w('backReal'))}</b></button>` +
      `<button class="on mg-title" data-mp="noop"><b>${IC.game}${esc(w('modeGame'))}</b><small>${esc(G.title)} · ${esc(tr(G.gameCity))}</small></button>`;
  } else if (!BETA) {
    document.getElementById('map-games').innerHTML = Object.entries(GAMES).map(([id, g]) =>
      `<button class="${id === game ? 'on' : ''}" data-action="map-game" data-v="${id}"><b>${g.title}</b><small>${tr(g.place)}</small></button>`).join('');
  } else document.getElementById('map-games').innerHTML =
    `<div class="mg-seg mg-games" role="group" aria-label="GTA">${['gta6', 'gta5'].map((id) => `<button class="${id === game ? 'on' : ''}${id === 'gta6' ? ' g6' : ''}" data-mp="game" data-v="${id}" aria-pressed="${id === game}"><b>${GAMES[id].title}</b>${id === 'gta6' && game !== 'gta6' ? '<i class="mg-new" aria-hidden="true"></i>' : ''}</button>`).join('')}</div>` +
    `<div class="mg-seg mg-mode" role="group">` +
    `<button class="${mode === 'real' ? 'on' : ''}" data-mp="mode" data-v="real" aria-pressed="${mode === 'real'}" title="${esc(w('modeReal'))}: ${esc(tr(G.real))}">${IC.pin}<b>${esc(w('life'))}</b></button>` +
    (GAME_MAP[game]
      ? `<button class="${mode === 'game' ? 'on' : ''}" data-mp="mode" data-v="game" aria-pressed="${mode === 'game'}" title="${esc(w('modeGame'))}: ${esc(tr(G.gameCity))}">${IC.game}<b>${esc(w('inGame'))}${approx() ? ' ≈' : ''}</b></button></div>`
      : `<button class="mg-soon" disabled title="${esc(w('soon6'))}" aria-label="${esc(w('inGame'))}: ${esc(w('soon6'))}">${IC.game}<b>19.11</b></button></div>`);
  const lg = document.getElementById('map-legend');
  if (lg) { const on = mode === 'game' && approx(); lg.classList.toggle('map-approx', on); lg.innerHTML = on ? `<span>${esc(w('approxMap'))}</span>` : ''; }
}

// свои клики (data-mp) — шторка, лента, просмотрщик
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-mp]');
  if (!el || !data[game]) return;
  const a = el.dataset.mp;
  if (a === 'card') { ctx?.haptic(); openPlace(+el.dataset.i, true); }
  else if (a === 'dcard') { ctx?.haptic(); openPoint(+el.dataset.i, true); }
  else if (a === 'view') { ctx?.haptic(); openViewer(el.dataset.ref, +(el.dataset.n || 0)); }
  else if (a === 'viewer-step') { if (viewer?.one) stepSingle(+el.dataset.d); }
  else if (a === 'viewer-back') { ctx?.haptic(); viewerBack(); }
  else if (a === 'sec') { ctx?.haptic(); const k = vSections(viewer.key).indexOf(viewer.sec), j = vSections(viewer.key).indexOf(el.dataset.s); viewer.sec = el.dataset.s; renderViewer(j > k ? 'from-r' : j < k ? 'from-l' : ''); }
  else if (a === 'compare') {
    ctx?.haptic(); const st = inl[el.dataset.key];
    if (viewer?.key === el.dataset.key) openCompare(el.dataset.key, viewer.pi, viewer.x ?? 50);
    else openCompare(el.dataset.key, st?.pi ?? 0, st?.x ?? 50);
  }
  else if (a === 'ipair') { ctx?.haptic(); setInlinePair(el); }
  else if (a === 'near') { ctx?.haptic(); openPlace(+el.dataset.i, true); }
  else if (a === 'pair') { if (viewer) { viewer.pi = +el.dataset.n; viewer.x = 50; renderViewer(); } }
  else if (a === 'all') { ctx?.haptic(); openAll(el.dataset.key, 'r'); }
  else if (a === 'viewer-close') closeViewer();
  else if (a === 'pick') { const i = +el.dataset.i, l = el.dataset.l; backToChooser = true; if (l === 'places') openPlace(i, false); else if (l === 'eggs') mapSheet(eggSheet(data[game].eggs[i], i)); else openPoint(i, false); }
  else if (a === 'fav') {
    e.stopPropagation(); ctx?.haptic?.();
    const on = !!ctx?.toggleFav?.(favKey(el.dataset.kind, el.dataset.id), { kind: el.dataset.kind, game, id: el.dataset.id });
    el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on));
    el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300);
  }
  else if (a === 'share') { ctx?.haptic(); sharePlace(el.dataset.t); }
  else if (a === 'help') { ctx?.haptic(); ctx.openSheet(helpSheet(), 'sheet-map'); }
  else if (a === 'mode') { ctx?.haptic(); setMode(el.dataset.v); }
  else if (a === 'cat') {
    ctx?.haptic(); activeCat = activeCat === el.dataset.v ? null : el.dataset.v;
    if (activeCat && !show.gtadb) { show.gtadb = true; loadGtadb(game).then(() => { refreshData(); applyShow(); applyCat(); renderCards(); }); }
    applyCat(); renderChips(); renderCards(); fitCat();
  }
  else if (a === 'ingame' || a === 'inreal') { ctx?.haptic(); showOnMap(a === 'ingame' ? 'game' : 'real', el.dataset.k, +el.dataset.i); }
  else if (a === 'yt') { ctx?.haptic(); openVideo(el.dataset.v, +el.dataset.t || 0, el.dataset.l || ''); }
  else if (a === 'game') { ctx?.haptic(); userGame = el.dataset.v; setGame(el.dataset.v); }
});
addEventListener('keydown', (e) => {
  if (!viewer) return;
  if (e.key === 'Escape') viewerBack();
  else if (e.key === 'ArrowRight') viewer.one ? stepSingle(1) : stepSection(1);
  else if (e.key === 'ArrowLeft') viewer.one ? stepSingle(-1) : stepSection(-1);
});

let opening = null;   // карта создаётся один раз: второй open() во время загрузки ждёт первый
let lastPrefer = null, userGame = null;   // игра из настроек приложения / выбранная на самой карте
export async function open(c, preferGame) {
  ctx = c;
  ensureChrome();
  if (map) {
    retheme();
    // игра из настроек приложения — если её там поменяли; выбор на самой карте не сбрасываем
    if (preferGame && GAMES[preferGame] && preferGame !== lastPrefer && preferGame !== game) await setGame(preferGame);
  } else await (opening ||= create(preferGame).finally(() => { opening = null; }));
  if (preferGame) lastPrefer = preferGame;
  requestAnimationFrame(() => map?.resize());
}

async function create(preferGame) {
  const box = document.getElementById('map');
  box.classList.add('loading');
  try {
    game = preferGame === 'gta5' ? 'gta5' : 'gta6';
    if (!GAME_MAP[game]) mode = 'real';
    const [d] = await Promise.all([loadGame(game), loadLib(), loadGtadb(game).catch(() => null)]);
    styleKey = mode === 'game' ? 'game:' + game : themeKey();
    const start = startView(d);
    map = new window.maplibregl.Map({
      container: box, style: mode === 'game' ? gameStyleFor(game) : STYLE[styleKey], center: start.center, zoom: start.zoom,
      attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, touchPitch: false, fadeDuration: 150,
      transformRequest: (url) => { const u = tileUrl(url); return u ? { url: u } : { url }; },
    });
    map.on('error', (e) => { if (e?.sourceId === 'gtamap') return; console.error(e?.error || e); });   // плиток игры за краем карты нет — это не ошибка
    map.touchZoomRotate.disableRotation();
    window.__gtaMap = map; // для проверки из консоли (?vptest и т. п.)
    map.on('style.load', addLayers);
    map.on('load', () => { box.classList.remove('loading'); renderCards(); });
    map.on('moveend', renderCards);
    map.on('click', onTap);
    for (const ev of ['touchstart', 'mousedown', 'dblclick', 'zoomstart', 'dragstart']) map.on(ev, cancelTap);
    renderChips();
  } catch (err) {
    box.classList.remove('loading');
    throw err;
  }
}

export async function setGame(g) {
  if (!map || g === game) return;
  game = g; selected = null; selectedD = null;
  const d = await loadGame(g);
  if (show.gtadb) await loadGtadb(g);
  const was = mode;
  mode = wantMode === 'game' && GAME_MAP[g] ? 'game' : 'real';
  const v = startView(d);
  if (mode === 'game') { styleKey = 'game:' + g; map.setStyle(gameStyleFor(g), { diff: false }); map.jumpTo(v); }   // style.load → addLayers
  else if (was === 'game') { styleKey = themeKey(); map.setStyle(STYLE[styleKey], { diff: false }); map.jumpTo(v); }
  else { refreshData(); map.flyTo({ ...v, duration: 1100, essential: true }); }
  renderChips();
}
// начальный вид: реальная карта — центр города; карта игры — середина мест игры
function startView(d) {
  if (!tilesGame()) return { center: [d.center[1], d.center[0]], zoom: d.zoom - 0.6 };
  const g = d.places.filter((p) => p.gm && p.gm[2] < 2);
  const mid = (k) => g.map((p) => p.gm[k]).sort((a, b) => a - b)[Math.floor(g.length / 2)] || 0;
  return { center: G2M(mid(0), mid(1)), zoom: 3.6 };
}
// «Показать на карте GTA» / «на реальной карте» из карточки: переключить вид и открыть это же место там
async function showOnMap(m, k, i) {
  await setMode(m);
  const d = data[game];
  if (k === 'p') openPlace(i, true);
  else if (k === 'd') openPoint(i, true);
  else if (k === 'e' && d.eggs[i]) { const e = d.eggs[i], c = ll(e); if (c) map.easeTo({ center: c, zoom: tilesGame() ? 6.5 : 15, duration: 600, offset: [0, -90] }); ctx.openSheet(eggSheet(e, i), 'sheet-map'); }
}
// переключение «Реальная карта ⇄ Карта игры»: остаёмся у того же места (выбранного или ближайшего к центру)
export async function setMode(m) {
  if (!map || (m !== 'real' && m !== 'game')) return;
  if (m === 'game' && !GAME_MAP[game]) return;
  wantMode = m;
  if (m === mode) return;
  const d = data[game]; if (!d) return;
  let ref = selected != null ? d.places[selected] : null;
  if (!ref) {
    const c = map.getCenter(), b = map.getBounds();
    let best = Infinity;
    for (const p of d.places) { const q = ll(p); if (!q || !b.contains(q)) continue; const k = (q[0] - c.lng) ** 2 + (q[1] - c.lat) ** 2; if (k < best) { best = k; ref = p; } }
  }
  const zr = map.getZoom();
  mode = m;
  if (BETA) try { localStorage.setItem('secret.map.mode', m); } catch { }
  styleKey = m === 'game' ? 'game:' + game : themeKey();
  map.setStyle(m === 'game' ? gameStyleFor(game) : STYLE[styleKey], { diff: false });   // style.load → addLayers (точки уже в координатах режима)
  const c = ref && ll(ref);
  const zoom = approx() ? (selected != null ? Math.max(zr, 15) : zr)
    : selected != null ? (m === 'game' ? 6.5 : 15) : m === 'game' ? Math.min(7, Math.max(3.5, zr - 8.5)) : Math.min(16, Math.max(9, zr + 8.5));
  if (c) map.jumpTo({ center: c, zoom });
  else map.jumpTo(startView(d));
  renderChips(); setTimeout(renderCards, 300);
}

export async function toggle(k) {
  show[k] = !show[k];
  if (k === 'gtadb' && show[k]) { await loadGtadb(game); refreshData(); }
  applyShow(); renderChips(); renderCards();
}

export async function focus(g, kind, id) {
  if (!map && opening) await opening.catch(() => null);
  if (!map) return false;
  if (g && g !== game) await setGame(g);
  const d = await loadGame(game);
  if (kind === 'place') {
    const i = d.places.findIndex((x) => x.id === id);
    if (i < 0) return false;
    openPlace(i, true); return true;
  }
  const ei = d.eggs.findIndex((x) => x.id === id);
  if (ei >= 0) {
    const e = d.eggs[ei], c = ll(e);
    if (c) map.easeTo({ center: c, zoom: Math.max(map.getZoom(), tilesGame() ? 6.5 : 15), duration: 700, offset: [0, -90] });
    ctx.openSheet(eggSheet(e, ei), 'sheet-map'); return true;
  }
  const pi = d.places.findIndex((x) => (x.eggs || []).some((e) => e.id === id));   // пасхалка показана в карточке места
  if (pi < 0) return false;
  openPlace(pi, true);
  setTimeout(() => document.querySelector(`#sheet-body [data-mp="fav"][data-id="${CSS.escape(id)}"]`)?.closest('.mp-eggblk')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 450);
  return true;
}

export async function locate() {
  if (!map || !navigator.geolocation) return;
  if (mode === 'game') await setMode('real');   // «где я» — только на реальной карте
  navigator.geolocation.getCurrentPosition((pos) => {
    me = [pos.coords.latitude, pos.coords.longitude];
    map.getSource('me')?.setData(fc([pt(me[1], me[0], {})]));
    map.flyTo({ center: [me[1], me[0]], zoom: 13, duration: 1000 });
  }, () => ctx?.toast?.(t('map_no_geo')), { enableHighAccuracy: true, timeout: 8000 });
}

export function refit() {
  const d = data[game]; if (map && d) map.flyTo({ ...startView(d), duration: 800 });
}

export function retheme() {
  if (!map) return;
  if (mode === 'game') return;   // у карты игры одна тема
  const k = themeKey();
  if (k !== styleKey) { styleKey = k; map.setStyle(STYLE[k], { diff: false }); } // style.load → addLayers
}
export function relang() { if (map) { renderChips(); renderCards(); } }
