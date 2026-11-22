// Места и пасхалки из data/map/<game>.json — для Главной, Поиска и Избранного.
// Сама карта (js/map.js) грузит те же файлы отдельно; здесь только чтение и поиск.

import { L, getLang, rn, ra, rg, rp } from './i18n.js';

const cache = {}, done = {};
export const MAP_GAMES = ['gta6', 'gta5'];

export async function loadPlaces(game) {
  if (!cache[game]) {
    cache[game] = fetch(`data/map/${game}.json`, { cache: 'no-cache' }).then((r) => r.json()).then((d) => {
      d.places.forEach((p) => { p.kind = 'place'; p.game = game; });
      d.eggs.forEach((e) => { e.kind = 'egg'; e.game = game; });
      // часть пасхалок лежит внутри карточки места (p.eggs) — добавляем их в общий список
      const seen = new Set(d.eggs.map((e) => e.id));
      d.places.forEach((p) => (p.eggs || []).forEach((e) => {
        if (seen.has(e.id)) return;
        seen.add(e.id); d.eggs.push({ ...e, kind: 'egg', game, parent: p.id });
      }));
      done[game] = d;
      return d;
    }).catch(() => ({ places: [], eggs: [] }));
  }
  return cache[game];
}
export const loadedPlaces = (game) => cache[game];
// данные уже в памяти (без ожидания) — Главная рисует карточки сразу, иначе скелетон и дорисовка
export const placesNow = (game) => done[game] || null;

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
  building: { ru: 'Здания', en: 'Buildings', icon: 'plBuilding' },
  neighborhood: { ru: 'Районы', en: 'Neighborhoods', icon: 'plHood' },
  business: { ru: 'Заведения', en: 'Businesses', icon: 'plStore' },
  landmark: { ru: 'Достопримечательности', en: 'Landmarks', icon: 'plLandmark' },
  bridge: { ru: 'Мосты', en: 'Bridges', icon: 'plBridge' },
  venue: { ru: 'Арены и клубы', en: 'Venues', icon: 'plVenue' },
  infrastructure: { ru: 'Транспорт и инфраструктура', en: 'Infrastructure', icon: 'plRoad' },
  nature: { ru: 'Природа', en: 'Nature', icon: 'plNature' },
  street: { ru: 'Улицы', en: 'Streets', icon: 'plStreet' },
  park: { ru: 'Парки', en: 'Parks', icon: 'plPark' },
  beach: { ru: 'Пляжи', en: 'Beaches', icon: 'plBeach' },
  sign: { ru: 'Вывески', en: 'Signs', icon: 'plSign' },
};
export const catLabel = (c) => (CAT_LABELS[c] ? L(CAT_LABELS[c]) : c || '');
export const catIcon = (c) => CAT_LABELS[c]?.icon || 'pin'; // id значка из I (js/icons.js)
export const CONF = ['confirmed', 'likely', 'speculative'];

export const titleOf = (o) => (o.kind === 'egg' ? L(o.t) : rg(o));
// у пасхалки место в жизни — первая часть адреса без пояснений («Piru United Methodist Church — прообраз …», «(Оаху)»):
// пояснения в данных по-русски и с игровыми названиями (тест 21.10.2026: русский текст на Главной в английском интерфейсе)
export const realOf = (o) => (o.kind === 'egg' ? rp(o).split(',')[0].split(' — ')[0].replace(/\s*\([^)]*[А-Яа-яЁё][^)]*\)/g, '').trim() : rn(o));
// Решение Игоря №15: на карточках мест (Главная, Поиск, Избранное) крупно — настоящее место, как в карточке карты
// (map.js realShort: до первой запятой или скобки); игровое название не показываем. Мелко — адрес (место) или город (пасхалка).
export const realName = (o) => { const r = realOf(o); return (o.kind === 'egg' ? r : r.split(/,| \(/)[0].trim()) || r || catLabel(o.c); };
export const realSub = (o) => (o.kind === 'egg' ? cityOf(o) : ra(o) || cityOf(o));
export function cityOf(o) {
  const parts = String(o.kind === 'egg' ? rp(o) : ra(o)).split(',').map((s) => s.trim()).filter(Boolean);
  const st = parts.findIndex((s) => /^(FL|CA)\b/.test(s));
  if (st > 0) return parts[st - 1];
  return parts.length > 1 ? parts[parts.length - 2] : '';
}
export const textOf = (o) => (o.kind === 'egg' ? L(o.d) : L(o.s));
// Копии сайта в подпапках (/beta/, /design/) берут картинки карты из общей img/map корня — как rebase в map.js.
// До 21.10.2026 миниатюры Главной, Поиска и Избранного в бете шли в /beta/img/map/… и давали 404 (тест 21.10).
const IMG_BASE = /\/(beta|design)\//.test(location.pathname) ? '../' : '';
export const imgUrl = (u) => (IMG_BASE && typeof u === 'string' && u.startsWith('img/map/') ? IMG_BASE + u : u);
export function thumbOf(o, prefer = 'real') {
  const a = prefer === 'game' ? [o.pg, o.pr] : [o.pr, o.pg];
  const ph = a.find(Boolean);
  return imgUrl(ph ? (ph.thumb || ph.file) : '');
}
export const hasPhoto = (o) => !!(o.pr || o.pg);

// ── поиск ──
const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е');
function hay(o) {
  if (!o._hay) {
    o._hay = norm(o.kind === 'egg'
      ? [o.t?.ru, o.t?.en, o.d?.ru, o.d?.en, o.p].join(' ')
      : [o.g, o.gr, o.r, o.n, o.nr, o.a, o.c, catLabel(o.c), CAT_LABELS[o.c]?.en, o.s?.ru, o.s?.en].join(' '));
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
        if (norm(realOf(o)).includes(w) || norm(o.n).includes(w)) score += 2;
      }
      return { o, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || (confRank[a.o.cf] ?? 3) - (confRank[b.o.cf] ?? 3) || hasPhoto(b.o) - hasPhoto(a.o))
    .map((x) => x.o);
}

// «Новое»: dt — дата, когда место/пасхалку добавили (YYYY-MM-DD, из поля found в данных); свежее 7 дней — первым в ленте
export const NEW_DAYS = 7;
export const isNew = (o) => !!o.dt && (Date.now() - Date.parse(o.dt + 'T00:00:00Z')) / 864e5 < NEW_DAYS;
// для ленты на Главной: новое, затем подтверждённые и с фото
export function featured(d, kind = 'place', n = 12) {
  const list = (kind === 'egg' ? d.eggs : d.places).filter(hasPhoto);
  const rank = { confirmed: 0, likely: 1, speculative: 2 };
  return list.slice().sort((a, b) => isNew(b) - isNew(a) || (isNew(a) && isNew(b) ? String(b.dt).localeCompare(String(a.dt)) : 0)
    || (rank[a.cf] ?? 3) - (rank[b.cf] ?? 3) || !!b.pr - !!a.pr).slice(0, n);
}

// Новости и инфоповоды (data/news.json): заголовок, дата, кадр, источник — без ссылок наружу
// «В реальном времени» (23.11.2026): cache: 'no-cache' — SW идёт в сеть (не дольше 3 с, иначе кэш и докачка в фоне);
// при возврате в приложение app.js зовёт loadNews(true) / refreshPlaces(). newsNow() — уже полученная лента без ожидания
// (Главная рисует её сразу, иначе скелетон).
let newsP = null, newsDone = null, newsMeta = { updated: '', fetched: 0 };
export const newsNow = () => newsDone;
export function loadNews(force = false) {
  if (!newsP || force) {
    const prev = newsP;
    newsP = fetch('data/news.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { newsMeta = { updated: d.updated || '', fetched: Date.now() }; return (newsDone = d.items || []); })
      .catch(() => (prev || Promise.resolve((newsDone ||= []))));
  }
  return newsP;
}
export const newsUpdated = () => newsMeta.updated;   // ISO-время сборки ленты (tools/build_news.py)
// перечитать места и пасхалки игры с сервера (возврат в приложение); старые данные остаются, если сети нет
export async function refreshPlaces(game) {
  const old = cache[game];
  delete cache[game];
  const d = await loadPlaces(game);
  if (!d.places.length && old) { cache[game] = old; return old; }
  return d;
}
// «Новое на карте»: места с датой добавления, свежее первым
export function newOnMap(d, kind = 'place', n = 0) {
  const list = (kind === 'egg' ? d.eggs : d.places).filter((o) => o.dt).sort((a, b) => String(b.dt).localeCompare(String(a.dt)) || hasPhoto(b) - hasPhoto(a));
  return n ? list.slice(0, n) : list;
}

export const lang = () => getLang();
