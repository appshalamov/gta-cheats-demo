// Вкладка «Карта»: реальные места GTA 6 (Майами / Флорида) и GTA 5 (Лос-Анджелес).
// MapLibre GL (vendor/maplibre) грузится лениво при первом открытии вкладки.
// Подложка — OpenFreeMap (векторная, OpenStreetMap, без ключа). Точки — GeoJSON-слои кружков.
// Данные: data/map/<game>.json (места + пасхалки), data/map/gtadb_<game>.json (слой сообщества).

import { t, L as tr, getLang } from './i18n.js';

const COLORS = { confirmed: '#22c3d9', likely: '#f5b942', speculative: '#9a8cab', egg: '#f472b6', gtadb: '#8b93a1' };
const GAMES = {
  gta6: { title: 'GTA 6', place: { ru: 'Vice City → Майами', en: 'Vice City → Miami' } },
  gta5: { title: 'GTA 5', place: { ru: 'Los Santos → Лос-Анджелес', en: 'Los Santos → Los Angeles' } },
};
const STYLE = { dark: 'https://tiles.openfreemap.org/styles/dark', light: 'https://tiles.openfreemap.org/styles/positron' };

let ctx = null;          // {openSheet, haptic, toast, I}
let map = null, game = null, styleKey = null;
const data = {}, gtadb = {};
const show = { places: true, eggs: true, gtadb: false };

function loadLib() {
  if (window.maplibregl) return Promise.resolve();
  return new Promise((ok, fail) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'vendor/maplibre/maplibre-gl.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'vendor/maplibre/maplibre-gl.js'; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
  });
}
async function loadGame(g) {
  if (!data[g]) data[g] = await fetch(`data/map/${g}.json`).then((r) => r.json());
  return data[g];
}
async function loadGtadb(g) {
  if (!gtadb[g]) gtadb[g] = await fetch(`data/map/gtadb_${g}.json`).then((r) => r.json());
  return gtadb[g];
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const mapsLink = (lat, lon, q) => isIOS()
  ? `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(q || `${lat},${lon}`)}`
  : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
const themeKey = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function confLabel(cf) { return t('conf_' + (cf || 'likely')); }

// ───── карточки (шторка) ─────
function placeSheet(p) {
  const I = ctx.I;
  return `
    <div class="mp-tags"><span class="mp-conf" style="--c:${COLORS[p.cf] || COLORS.likely}">${confLabel(p.cf)}</span>${p.c ? `<span class="mp-cat">${esc(p.c)}</span>` : ''}</div>
    <div class="mp-pair">
      <div class="mp-side"><small>${t('map_in_game')}</small><h2>${esc(p.g)}</h2>${p.r ? `<span>${esc(p.r)}</span>` : ''}</div>
      <div class="mp-arrow">${I.chevron}</div>
      <div class="mp-side mp-real"><small>${t('map_in_real')}</small><b>${esc(p.n)}</b>${p.a ? `<span>${esc(p.a)}</span>` : ''}</div>
    </div>
    ${p.ph ? `<figure class="mp-photo"><img src="${esc(p.ph.file)}" alt="" loading="lazy"><figcaption>${esc(p.ph.credit)}</figcaption></figure>` : ''}
    ${p.s ? `<p class="mp-text">${esc(tr(p.s))}</p>` : ''}
    ${tr(p.tip) ? `<div class="mp-tip"><b>${t('map_tip')}</b>${esc(tr(p.tip))}</div>` : ''}
    ${p.m?.length ? `<div class="mp-media"><b>${t('map_where_seen')}</b>${p.m.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    <div class="mp-btns">
      <a class="btn-primary" href="${mapsLink(p.lat, p.lon, p.n)}" target="_blank" rel="noopener">${I.pin}<span>${t('map_route')}</span></a>
      ${p.src ? `<a class="btn-ghost" href="${esc(p.src)}" target="_blank" rel="noopener">${I.info}<span>${t('map_source')}</span></a>` : ''}
    </div>
    ${getLang() === 'ru' && p.s && p.s.ru === p.s.en ? `<p class="d-note">${t('map_en_note')}</p>` : ''}`;
}
function eggSheet(e) {
  const I = ctx.I;
  return `
    <div class="mp-tags"><span class="mp-conf" style="--c:${COLORS.egg}">${t('map_egg')}</span><span class="mp-conf" style="--c:${COLORS[e.cf] || COLORS.likely}">${confLabel(e.cf)}</span></div>
    <h2 class="mp-h">${esc(tr(e.t))}</h2>
    ${e.p ? `<div class="mp-addr">${I.pin}<span>${esc(e.p)}</span></div>` : ''}
    <p class="mp-text">${esc(tr(e.d))}</p>
    ${e.m?.length ? `<div class="mp-media"><b>${t('map_where_seen')}</b>${e.m.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    <div class="mp-btns">
      <a class="btn-primary" href="${mapsLink(e.lat, e.lon, e.p)}" target="_blank" rel="noopener">${I.pin}<span>${t('map_route')}</span></a>
      ${e.src ? `<a class="btn-ghost" href="${esc(e.src)}" target="_blank" rel="noopener">${I.info}<span>${t('map_source')}</span></a>` : ''}
    </div>`;
}
function gtadbSheet(p, g) {
  const [id, name, district, real, lat, lon, type] = p;
  const I = ctx.I;
  return `
    <div class="mp-tags"><span class="mp-conf" style="--c:${COLORS.gtadb}">gtadb.org</span>${type ? `<span class="mp-cat">${esc(type)}</span>` : ''}</div>
    <div class="mp-pair">
      <div class="mp-side"><small>${t('map_in_game')}</small><h2>${esc(name || district || id)}</h2>${name && district ? `<span>${esc(district)}</span>` : ''}</div>
      <div class="mp-arrow">${I.chevron}</div>
      <div class="mp-side mp-real"><small>${t('map_in_real')}</small><b>${esc(real.split(',')[0])}</b><span>${esc(real.split(',').slice(1).join(',').trim())}</span></div>
    </div>
    <div class="mp-btns">
      <a class="btn-primary" href="${mapsLink(lat, lon, real)}" target="_blank" rel="noopener">${I.pin}<span>${t('map_route')}</span></a>
      <a class="btn-ghost" href="https://map.gtadb.org/#${g},${esc(id)}" target="_blank" rel="noopener">${I.info}<span>gtadb.org</span></a>
    </div>
    <p class="d-note">${t('map_gtadb_credit')}</p>`;
}

// ───── слои ─────
const fc = (features) => ({ type: 'FeatureCollection', features });
const pt = (lon, lat, props) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: props });

function geo(kind) {
  const d = data[game];
  if (kind === 'places') return fc((d?.places || []).map((p, i) => pt(p.lon, p.lat, { i, cf: p.cf })));
  if (kind === 'eggs') return fc((d?.eggs || []).map((e, i) => pt(e.lon, e.lat, { i, cf: e.cf })));
  if (kind === 'gtadb') return fc(show.gtadb && gtadb[game] ? gtadb[game].points.map((p, i) => pt(p[5], p[4], { i })) : []);
  return fc([]);
}

function addLayers() {
  const dark = themeKey() === 'dark';
  const stroke = dark ? '#0b0b0d' : '#ffffff';
  for (const k of ['gtadb', 'places', 'eggs']) if (!map.getSource(k)) map.addSource(k, { type: 'geojson', data: geo(k) });
  const z = (a, b) => ['interpolate', ['linear'], ['zoom'], 8, a, 15, b];
  if (!map.getLayer('gtadb')) map.addLayer({ id: 'gtadb', type: 'circle', source: 'gtadb',
    paint: { 'circle-radius': z(2.5, 6), 'circle-color': COLORS.gtadb, 'circle-opacity': .75, 'circle-stroke-width': 1, 'circle-stroke-color': stroke } });
  if (!map.getLayer('places-glow')) map.addLayer({ id: 'places-glow', type: 'circle', source: 'places', filter: ['==', ['get', 'cf'], 'confirmed'],
    paint: { 'circle-radius': z(9, 18), 'circle-color': COLORS.confirmed, 'circle-opacity': .18, 'circle-blur': .6 } });
  if (!map.getLayer('places')) map.addLayer({ id: 'places', type: 'circle', source: 'places',
    paint: { 'circle-radius': z(4.5, 10), 'circle-stroke-width': 1.5, 'circle-stroke-color': stroke,
      'circle-color': ['match', ['get', 'cf'], 'confirmed', COLORS.confirmed, 'speculative', COLORS.speculative, COLORS.likely] } });
  if (!map.getLayer('eggs')) map.addLayer({ id: 'eggs', type: 'circle', source: 'eggs',
    paint: { 'circle-radius': z(5, 11), 'circle-color': COLORS.egg, 'circle-stroke-width': 2.2, 'circle-stroke-color': '#ffffff' } });
  if (!map.getSource('me')) {
    map.addSource('me', { type: 'geojson', data: fc([]) });
    map.addLayer({ id: 'me', type: 'circle', source: 'me', paint: { 'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
  }
  applyShow();
}
function refreshData() {
  for (const k of ['gtadb', 'places', 'eggs']) map.getSource(k)?.setData(geo(k));
}
function applyShow() {
  const vis = (on) => (on ? 'visible' : 'none');
  if (!map.getLayer('places')) return;
  map.setLayoutProperty('gtadb', 'visibility', vis(show.gtadb));
  map.setLayoutProperty('places', 'visibility', vis(show.places));
  map.setLayoutProperty('places-glow', 'visibility', vis(show.places));
  map.setLayoutProperty('eggs', 'visibility', vis(show.eggs));
}

// нажатие: ищем точку в радиусе пальца, приоритет пасхалки > места > сообщество
function onTap(e) {
  const r = 14, { x, y } = e.point;
  const layers = ['eggs', 'places', 'gtadb'].filter((l) => map.getLayer(l) && map.getLayoutProperty(l, 'visibility') !== 'none');
  const hits = map.queryRenderedFeatures([[x - r, y - r], [x + r, y + r]], { layers });
  if (!hits.length) return;
  const best = layers.map((l) => hits.filter((h) => h.layer.id === l)).find((a) => a.length);
  const nearest = best.sort((a, b) => dist(a, e) - dist(b, e))[0];
  const i = nearest.properties.i, l = nearest.layer.id;
  ctx.haptic();
  if (l === 'eggs') ctx.openSheet(eggSheet(data[game].eggs[i]), 'sheet-map');
  else if (l === 'places') ctx.openSheet(placeSheet(data[game].places[i]), 'sheet-map');
  else ctx.openSheet(gtadbSheet(gtadb[game].points[i], gtadb[game].game), 'sheet-map');
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
  ].map(([k, label, c]) => `<button class="mchip${show[k] ? ' on' : ''}" data-action="map-layer" data-v="${k}" style="--c:${c}"><i></i>${label}${n[k] !== '' ? ` <em>${n[k]}</em>` : ''}</button>`).join('');
  document.getElementById('map-games').innerHTML = Object.entries(GAMES).map(([id, g]) =>
    `<button class="${id === game ? 'on' : ''}" data-action="map-game" data-v="${id}"><b>${g.title}</b><small>${tr(g.place)}</small></button>`).join('');
  document.getElementById('map-legend').innerHTML = ['confirmed', 'likely', 'speculative'].map((k) => `<span><i style="background:${COLORS[k]}"></i>${confLabel(k)}</span>`).join('')
    + `<span><i style="background:${COLORS.egg};box-shadow:0 0 0 1.5px #fff"></i>${t('map_egg')}</span>`;
}

export async function open(c, preferGame) {
  ctx = c;
  const box = document.getElementById('map');
  if (!map) {
    box.classList.add('loading');
    game = preferGame === 'gta5' ? 'gta5' : 'gta6';
    const [d] = await Promise.all([loadGame(game), loadLib()]);
    styleKey = themeKey();
    map = new window.maplibregl.Map({
      container: box, style: STYLE[styleKey], center: [d.center[1], d.center[0]], zoom: d.zoom - 0.6,
      attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, touchPitch: false, fadeDuration: 150,
    });
    map.touchZoomRotate.disableRotation();
    map.on('style.load', addLayers);
    map.on('load', () => box.classList.remove('loading'));
    map.on('click', onTap);
    renderChips();
  } else {
    retheme();
  }
  requestAnimationFrame(() => map.resize());
}

export async function setGame(g) {
  if (!map || g === game) return;
  game = g;
  const d = await loadGame(g);
  if (show.gtadb) await loadGtadb(g);
  refreshData(); renderChips();
  map.flyTo({ center: [d.center[1], d.center[0]], zoom: d.zoom - 0.6, duration: 1100, essential: true });
}

export async function toggle(k) {
  show[k] = !show[k];
  if (k === 'gtadb' && show[k]) { await loadGtadb(game); refreshData(); }
  applyShow(); renderChips();
}

export function locate() {
  if (!map || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    const ll = [pos.coords.longitude, pos.coords.latitude];
    map.getSource('me')?.setData(fc([pt(ll[0], ll[1], {})]));
    map.flyTo({ center: ll, zoom: 13, duration: 1000 });
  }, () => ctx?.toast?.(t('map_no_geo')), { enableHighAccuracy: true, timeout: 8000 });
}

export function refit() {
  const d = data[game]; if (map && d) map.flyTo({ center: [d.center[1], d.center[0]], zoom: d.zoom - 0.6, duration: 800 });
}

export function retheme() {
  if (!map) return;
  const k = themeKey();
  if (k !== styleKey) { styleKey = k; map.setStyle(STYLE[k]); } // style.load → addLayers
}
export function relang() { if (map) renderChips(); }
