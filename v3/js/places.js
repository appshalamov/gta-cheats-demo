// Места и пасхалки из data/map/<game>.json — для Главной, Поиска и Избранного.
// Сама карта (js/map.js) грузит те же файлы отдельно; здесь только чтение и поиск.

import { L, getLang } from './i18n.js';
import { ic } from './sprite.js';

const cache = {};
// бета и v3 лежат в подпапке и берут картинки карты из общей ../img/map (как map.js: IMG_BASE)
const IMG_BASE = /\/(beta|v3)\//.test(location.pathname) ? '../' : '';
const rebase = (o) => (typeof o === 'string' ? (IMG_BASE && o.startsWith('img/map/') ? IMG_BASE + o : o) : Array.isArray(o) ? o.map(rebase)
  : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, rebase(v)])) : o);
export const MAP_GAMES = ['gta6', 'gta5'];

export async function loadPlaces(game) {
  if (!cache[game]) {
    cache[game] = fetch(`data/map/${game}.json`).then((r) => r.json()).then(rebase).then((d) => {
      d.places.forEach((p) => { p.kind = 'place'; p.game = game; });
      d.eggs.forEach((e) => { e.kind = 'egg'; e.game = game; });
      // часть пасхалок лежит внутри карточки места (p.eggs) — добавляем их в общий список
      const seen = new Set(d.eggs.map((e) => e.id));
      d.places.forEach((p) => (p.eggs || []).forEach((e) => {
        if (seen.has(e.id)) return;
        seen.add(e.id); d.eggs.push({ ...e, kind: 'egg', game, parent: p.id });
      }));
      return d;
    }).catch(() => ({ places: [], eggs: [] }));
  }
  return cache[game];
}
export const loadedPlaces = (game) => cache[game];

export const placeKey = (o) => `${o.kind}:${o.game}:${o.id}`;
export function parseKey(key) {
  const [kind, game, ...rest] = String(key).split(':');
  return { kind, game, id: rest.join(':') };
}
export async function findByKey(key) {
  const { kind, game, id } = parseKey(key);
  const d = await loadPlaces(game);
  return (kind === 'egg' ? d.eggs : d.places).find((x) => x.id === id) || null;
}

// ── подписи ── (icon — имя значка спрайта js/sprite.js)
export const CAT_LABELS = {
  building: { ru: 'Здания', en: 'Buildings', icon: 'home' },
  neighborhood: { ru: 'Районы', en: 'Neighborhoods', icon: 'layers' },
  business: { ru: 'Заведения', en: 'Businesses', icon: 'trip' },
  landmark: { ru: 'Достопримечательности', en: 'Landmarks', icon: 'star' },
  bridge: { ru: 'Мосты', en: 'Bridges', icon: 'swap' },
  venue: { ru: 'Арены и клубы', en: 'Venues', icon: 'sparkle' },
  infrastructure: { ru: 'Транспорт и инфраструктура', en: 'Infrastructure', icon: 'vehicle' },
  nature: { ru: 'Природа', en: 'Nature', icon: 'world' },
  street: { ru: 'Улицы', en: 'Streets', icon: 'route' },
  park: { ru: 'Парки', en: 'Parks', icon: 'sun' },
  beach: { ru: 'Пляжи', en: 'Beaches', icon: 'cheat-boat' },
  sign: { ru: 'Вывески', en: 'Signs', icon: 'info' },
};
export const catLabel = (c) => (CAT_LABELS[c] ? L(CAT_LABELS[c]) : c || '');
export const catIcon = (c, cls = '') => ic(CAT_LABELS[c]?.icon || 'pin', ('ic-cat ' + cls).trim());
export const CONF = ['confirmed', 'likely', 'speculative'];

export const titleOf = (o) => (o.kind === 'egg' ? L(o.t) : o.g || '');
export const realOf = (o) => (o.kind === 'egg' ? (o.p || '').split(',')[0] : o.n || '');
export function cityOf(o) {
  const parts = String(o.kind === 'egg' ? o.p : o.a || '').split(',').map((s) => s.trim()).filter(Boolean);
  const st = parts.findIndex((s) => /^(FL|CA)\b/.test(s));
  if (st > 0) return parts[st - 1];
  return parts.length > 1 ? parts[parts.length - 2] : '';
}
export const textOf = (o) => (o.kind === 'egg' ? L(o.d) : L(o.s));
export function thumbOf(o, prefer = 'real') {
  const a = prefer === 'game' ? [o.pg, o.pr] : [o.pr, o.pg];
  const ph = a.find(Boolean);
  return ph ? (ph.thumb || ph.file) : '';
}
export const hasPhoto = (o) => !!(o.pr || o.pg);

// ── поиск ──
const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е');
function hay(o) {
  if (!o._hay) {
    o._hay = norm(o.kind === 'egg'
      ? [o.t?.ru, o.t?.en, o.d?.ru, o.d?.en, o.p].join(' ')
      : [o.g, o.r, o.n, o.a, o.c, catLabel(o.c), CAT_LABELS[o.c]?.en, o.s?.ru, o.s?.en].join(' '));
  }
  return o._hay;
}
// filter: {kind:'place'|'egg', cat, conf}
export function searchPlaces(d, q, filter = {}) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  const list = filter.kind === 'egg' ? d.eggs : d.places;
  const confRank = { confirmed: 0, likely: 1, speculative: 2 };
  return list
    .filter((o) => (!filter.cat || o.c === filter.cat) && (!filter.conf || o.cf === filter.conf))
    .map((o) => {
      if (!words.length) return { o, score: 0 };
      const h = hay(o); let score = 0;
      for (const w of words) {
        if (!h.includes(w)) return null;
        if (norm(titleOf(o)).includes(w)) score += 3;
        if (norm(realOf(o)).includes(w)) score += 2;
      }
      return { o, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || (confRank[a.o.cf] ?? 3) - (confRank[b.o.cf] ?? 3) || hasPhoto(b.o) - hasPhoto(a.o))
    .map((x) => x.o);
}

// для ленты на Главной: подтверждённые и с фото — первыми
export function featured(d, kind = 'place', n = 12) {
  const list = (kind === 'egg' ? d.eggs : d.places).filter(hasPhoto);
  const rank = { confirmed: 0, likely: 1, speculative: 2 };
  return list.slice().sort((a, b) => (rank[a.cf] ?? 3) - (rank[b.cf] ?? 3) || !!b.pr - !!a.pr).slice(0, n);
}

export const lang = () => getLang();
