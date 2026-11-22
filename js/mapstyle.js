// Режим «Жизнь» в стиле карты GTA 6 (Игорь 22.11.2026: «карту обновить, чтобы она была дизайном, как с игры, сейчас там
// какая-то техническая карта с полосками»). Реальный мир — векторные плитки OpenFreeMap (OpenStreetMap, схема OpenMapTiles,
// без ключа); палитра снята с карты паузы вышедшей GTA 6 (плитки gtadb «day», 22.11.2026): бирюзовая вода, зелёная суша,
// серые кварталы, сиренево-голубые здания, светлые дороги, песок пляжей. Готового стиля «как в GTA» для MapLibre нет
// (проверка — «Карта как в игре (22.11.2026)/готовые стили — проверка.md»). Без железных дорог, ЛЭП и прочих «технических» линий.
// Варианты: day — как карта паузы (по умолчанию), night — та же карта ночью, neon — тёмная с неоном Вайс-Сити.
const P = {
  day: { land: '#a3aab0', city: '#9fa5ad', green: '#5a9480', green2: '#6aa086', wet: '#5d9a8c', sand: '#d2c596', water: '#41a2c2', deep: '#2f90b0',
    bld: '#a2adbf', bldLine: '#8e9aae', minor: '#d2d3d8', major: '#e2e3e8', casing: '#b0b5bf', hwy: '#eceef1', hwyLine: '#d8c77a', hwyCase: '#aeb2b9',
    runway: '#e6e7eb', label: '#ffffff', halo: 'rgba(35,52,64,.85)', road: '#4b5462', roadHalo: 'rgba(240,242,246,.9)', waterLabel: '#e9f7fc', waterHalo: 'rgba(31,104,132,.9)' },
  night: { land: '#232b31', city: '#29313a', green: '#1f3d35', green2: '#24443a', wet: '#1d3c3a', sand: '#4b4636', water: '#13506a', deep: '#0e3f55',
    bld: '#36404f', bldLine: '#2c3542', minor: '#566170', major: '#7c8798', casing: '#1a2027', hwy: '#a9b2bf', hwyLine: '#d8c068', hwyCase: '#151a20',
    runway: '#4a5360', label: '#eef3f8', halo: 'rgba(8,14,20,.9)', road: '#c3cad4', roadHalo: 'rgba(10,15,20,.9)', waterLabel: '#bfe6f3', waterHalo: 'rgba(6,30,42,.9)' },
  neon: { land: '#17171d', city: '#1d1e26', green: '#162a26', green2: '#1a302b', wet: '#142a2a', sand: '#3a3326', water: '#0d3a48', deep: '#092d39',
    bld: '#2a2b37', bldLine: '#22232d', minor: '#4d4f5e', major: '#9a8fb5', casing: '#121219', hwy: '#ff5fae', hwyLine: '#ffd0e8', hwyCase: 'rgba(255,79,163,.35)',
    runway: '#3a3b48', label: '#ffe3f1', halo: 'rgba(10,8,14,.9)', road: '#d9cbe8', roadHalo: 'rgba(12,10,16,.9)', waterLabel: '#9fe6f0', waterHalo: 'rgba(4,22,28,.9)' },
};
export const LIFE_VARIANTS = Object.keys(P);

export function lifeStyle(v = 'day') {
  const c = P[v] || P.day;
  const src = { source: 'omt' };
  const cls = (...a) => ['match', ['get', 'class'], a, true, false];
  const w = (a, b, d) => ['interpolate', ['exponential', 1.6], ['zoom'], 8, a, 13, b, 18, d];
  const line = (id, minzoom, filter, color, width, extra = {}) => ({ id, type: 'line', ...src, 'source-layer': 'transportation', minzoom,
    filter: ['all', ['==', ['geometry-type'], 'LineString'], filter, ['!', ['in', ['get', 'brunnel'], ['literal', ['tunnel']]]]],
    layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': width, ...extra } });
  const label = (id, minzoom, maxzoom, filter, size, extra = {}) => ({ id, type: 'symbol', ...src, 'source-layer': 'place', minzoom, maxzoom, filter,
    layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Bold'], 'text-transform': 'uppercase',
      'text-letter-spacing': 0.12, 'text-size': size, 'text-max-width': 8, 'text-padding': 6, ...extra },
    paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 1.4 } });
  return {
    version: 8, name: `GTA 6 — ${v}`, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenStreetMap · OpenFreeMap · цвета карты GTA 6' } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': c.land } },
      { id: 'lu-city', type: 'fill', ...src, 'source-layer': 'landuse', filter: cls('residential', 'commercial', 'industrial', 'retail', 'suburb', 'neighbourhood', 'quarter', 'school', 'hospital', 'university', 'railway'),
        paint: { 'fill-color': c.city } },
      { id: 'lc-green', type: 'fill', ...src, 'source-layer': 'landcover', filter: cls('wood', 'grass', 'farmland', 'scrub', 'forest'), paint: { 'fill-color': c.green, 'fill-opacity': 0.92 } },
      { id: 'lc-wet', type: 'fill', ...src, 'source-layer': 'landcover', filter: cls('wetland'), paint: { 'fill-color': c.wet } },
      { id: 'lc-sand', type: 'fill', ...src, 'source-layer': 'landcover', filter: cls('sand', 'beach'), paint: { 'fill-color': c.sand } },
      { id: 'lu-green', type: 'fill', ...src, 'source-layer': 'landuse', filter: cls('cemetery', 'pitch', 'stadium', 'playground', 'garden', 'golf'), paint: { 'fill-color': c.green2 } },
      { id: 'park', type: 'fill', ...src, 'source-layer': 'park', paint: { 'fill-color': c.green2, 'fill-opacity': 0.95 } },
      { id: 'water', type: 'fill', ...src, 'source-layer': 'water', filter: ['!', ['in', ['get', 'brunnel'], ['literal', ['tunnel']]]],
        paint: { 'fill-color': ['interpolate', ['linear'], ['zoom'], 6, c.deep, 11, c.water], 'fill-antialias': true } },
      { id: 'waterway', type: 'line', ...src, 'source-layer': 'waterway', minzoom: 9, filter: cls('river', 'canal', 'stream'),
        paint: { 'line-color': c.water, 'line-width': w(0.5, 1.5, 6) } },
      { id: 'aeroway', type: 'fill', ...src, 'source-layer': 'aeroway', minzoom: 10, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': c.runway, 'fill-opacity': 0.7 } },
      { id: 'runway', type: 'line', ...src, 'source-layer': 'aeroway', minzoom: 10, filter: cls('runway', 'taxiway'),
        paint: { 'line-color': c.runway, 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10, 1, 13, 6, 17, 40] } },
      { id: 'building', type: 'fill', ...src, 'source-layer': 'building', minzoom: 13.5,
        paint: { 'fill-color': c.bld, 'fill-outline-color': c.bldLine, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.5, 1] } },
      // дороги: светлые полосы на сером, как в игре; трассы шире, с жёлтой осевой
      line('rd-case', 12, cls('primary', 'secondary', 'tertiary', 'trunk'), c.casing, w(0.8, 3.2, 22)),
      line('rd-minor', 11, cls('minor', 'service'), c.minor, w(0.2, 1.2, 12), { 'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 13, 1] }),
      line('rd-major', 8, cls('primary', 'secondary', 'tertiary', 'trunk'), c.major, w(0.4, 2.4, 18)),
      line('hwy-case', 6, cls('motorway'), c.hwyCase, w(1.6, 5, 30)),
      line('hwy', 6, cls('motorway'), c.hwy, w(1, 3.6, 24)),
      line('hwy-axis', 11, cls('motorway'), c.hwyLine, w(0.2, 0.7, 3)),
      { id: 'road-name', type: 'symbol', ...src, 'source-layer': 'transportation_name', minzoom: 15, filter: cls('primary', 'secondary', 'tertiary', 'trunk', 'minor'),
        layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-max-angle': 30, 'text-padding': 10 },
        paint: { 'text-color': c.road, 'text-halo-color': c.roadHalo, 'text-halo-width': 1.3 } },
      { id: 'water-name', type: 'symbol', ...src, 'source-layer': 'water_name', minzoom: 9,
        layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Italic'], 'text-size': 12, 'text-letter-spacing': 0.08, 'text-max-width': 8 },
        paint: { 'text-color': c.waterLabel, 'text-halo-color': c.waterHalo, 'text-halo-width': 1.2 } },
      label('lbl-hood', 13, 17, cls('neighbourhood', 'quarter', 'suburb'), ['interpolate', ['linear'], ['zoom'], 13, 10, 16, 13]),
      label('lbl-town', 9, 15, cls('town', 'village'), ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 14]),
      label('lbl-city', 4, 13, cls('city'), ['interpolate', ['linear'], ['zoom'], 5, 11, 10, 17], { 'text-letter-spacing': 0.18 }),
    ],
  };
}
