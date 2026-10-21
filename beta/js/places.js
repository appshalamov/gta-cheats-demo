// Места и пасхалки из data/map/<game>.json — для Главной, Поиска и Избранного.
// Сама карта (js/map.js) грузит те же файлы отдельно; здесь только чтение и поиск.

import { L, getLang } from './i18n.js';

const cache = {};
export const MAP_GAMES = ['gta6', 'gta5'];

export async function loadPlaces(game) {
  if (!cache[game]) {
    cache[game] = fetch(`data/map/${game}.json`).then((r) => r.json()).then((d) => {
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

// ── подписи ──
export const CAT_LABELS = {
  building: { ru: 'Здания', en: 'Buildings', icon: '🏢' },
  neighborhood: { ru: 'Районы', en: 'Neighborhoods', icon: '🏘️' },
  business: { ru: 'Заведения', en: 'Businesses', icon: '🛍️' },
  landmark: { ru: 'Достопримечательности', en: 'Landmarks', icon: '🗽' },
  bridge: { ru: 'Мосты', en: 'Bridges', icon: '🌉' },
  venue: { ru: 'Арены и клубы', en: 'Venues', icon: '🏟️' },
  infrastructure: { ru: 'Транспорт и инфраструктура', en: 'Infrastructure', icon: '🛣️' },
  nature: { ru: 'Природа', en: 'Nature', icon: '🌴' },
  street: { ru: 'Улицы', en: 'Streets', icon: '🛤️' },
  park: { ru: 'Парки', en: 'Parks', icon: '🌳' },
  beach: { ru: 'Пляжи', en: 'Beaches', icon: '🏖️' },
  sign: { ru: 'Вывески', en: 'Signs', icon: '🪧' },
};
export const catLabel = (c) => (CAT_LABELS[c] ? L(CAT_LABELS[c]) : c || '');
export const catIcon = (c) => CAT_LABELS[c]?.icon || '📍';
export const CONF = ['confirmed', 'likely', 'speculative'];

export const titleOf = (o) => (o.kind === 'egg' ? L(o.t) : o.g || '');
// у пасхалки место в жизни — первая часть адреса без пояснений («Piru United Methodist Church — прообраз …», «(Оаху)»):
// пояснения в данных по-русски и с игровыми названиями (тест 21.10.2026: русский текст на Главной в английском интерфейсе)
export const realOf = (o) => (o.kind === 'egg' ? (o.p || '').split(',')[0].split(' — ')[0].replace(/\s*\([^)]*[А-Яа-яЁё][^)]*\)/g, '').trim() : o.n || '');
export function cityOf(o) {
  const parts = String(o.kind === 'egg' ? o.p : o.a || '').split(',').map((s) => s.trim()).filter(Boolean);
  const st = parts.findIndex((s) => /^(FL|CA)\b/.test(s));
  if (st > 0) return parts[st - 1];
  return parts.length > 1 ? parts[parts.length - 2] : '';
}
export const textOf = (o) => (o.kind === 'egg' ? L(o.d) : L(o.s));
// Копии сайта в подпапках (/beta/, /design/) берут картинки карты из общей img/map корня — как rebase в map.js.
// До 21.10.2026 миниатюры Главной, Поиска и Избранного в бете шли в /beta/img/map/… и давали 404 (тест 21.10).
const IMG_BASE = /\/(beta|design)\//.test(location.pathname) ? '../' : '';
export function thumbOf(o, prefer = 'real') {
  const a = prefer === 'game' ? [o.pg, o.pr] : [o.pr, o.pg];
  const ph = a.find(Boolean);
  const u = ph ? (ph.thumb || ph.file) : '';
  return IMG_BASE && typeof u === 'string' && u.startsWith('img/map/') ? IMG_BASE + u : u;
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
