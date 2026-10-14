// Фото сообщества, лайки и баллы для карточек карты.
//
// Два режима (выбирается в js/community-config.js):
//   'local'    — всё хранится на этом устройстве (IndexedDB). Работает сразу, без сервера:
//                свои фото видит только автор, лайки и баллы тоже локальные. Это каркас и демо.
//   'supabase' — общий сервер (Supabase: Postgres + Storage + Auth). Фото видят все, лайки общие,
//                баллы начисляет база триггерами (см. backend/supabase.sql). Включается заполнением url и anonKey.
//
// Баллы (одинаковые правила для обоих режимов, на сервере — истина в базе):
//   +10 за фото, +5 если снято рядом с местом (GPS снимка или устройства ≤ 300 м), +20 за съёмку с дрона,
//   +1 автору за каждый лайк, +50 автору фото, которое стало главным у места (больше всех лайков).

import { COMMUNITY } from './community-config.js';

export const POINTS = { upload: 10, on_site: 5, drone: 20, like_received: 1, featured: 50 };
export const KINDS = ['ground', 'night', 'drone'];
const ON_SITE_M = 300;

// ───── общие помощники ─────
function km(a, b) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
export const photoKey = (url) => 'u' + Array.from(url).reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7).toString(36);

// Сжать фото на телефоне: длинная сторона ≤ 1600 px (и превью 360 px), JPEG. Метаданные (EXIF) при этом пропадают —
// координаты мы прочитали заранее, а лишнее (модель телефона, время) наружу не уходит.
async function resize(file, max) {
  const bmp = await createImageBitmap(file).catch(() => null);
  let w, h, src = bmp;
  if (!bmp) {
    src = await new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = URL.createObjectURL(file); });
  }
  w = src.width; h = src.height;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return { blob: await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.84)), w: c.width, h: c.height };
}

// Минимальный разбор EXIF (JPEG): широта/долгота съёмки, если телефон их сохранил.
export async function exifGps(file) {
  try {
    const buf = new DataView(await file.slice(0, 256 * 1024).arrayBuffer());
    if (buf.getUint16(0) !== 0xFFD8) return null;
    let o = 2;
    while (o < buf.byteLength - 4) {
      const marker = buf.getUint16(o), len = buf.getUint16(o + 2);
      if (marker === 0xFFE1 && buf.getUint32(o + 4) === 0x45786966) { // "Exif"
        const t = o + 10, le = buf.getUint16(t) === 0x4949;
        const u16 = (p) => buf.getUint16(p, le), u32 = (p) => buf.getUint32(p, le);
        const ifd0 = t + u32(t + 4);
        let gpsPtr = 0;
        for (let i = 0, n = u16(ifd0); i < n; i++) { const e = ifd0 + 2 + i * 12; if (u16(e) === 0x8825) gpsPtr = t + u32(e + 8); }
        if (!gpsPtr) return null;
        const tags = {};
        for (let i = 0, n = u16(gpsPtr); i < n; i++) {
          const e = gpsPtr + 2 + i * 12, tag = u16(e), type = u16(e + 2), cnt = u32(e + 4);
          if (type === 2) tags[tag] = String.fromCharCode(buf.getUint8(e + 8));
          if (type === 5 && cnt === 3) { const p = t + u32(e + 8); tags[tag] = [0, 1, 2].map((k) => u32(p + k * 8) / (u32(p + k * 8 + 4) || 1)); }
        }
        if (!tags[2] || !tags[4]) return null;
        const dms = (v) => v[0] + v[1] / 60 + v[2] / 3600;
        const lat = dms(tags[2]) * (tags[1] === 'S' ? -1 : 1), lon = dms(tags[4]) * (tags[3] === 'W' ? -1 : 1);
        return Number.isFinite(lat) && Number.isFinite(lon) && (lat || lon) ? [lat, lon] : null;
      }
      o += 2 + len;
    }
  } catch { }
  return null;
}
function hereNow() {
  return new Promise((ok) => {
    if (!navigator.geolocation) return ok(null);
    navigator.geolocation.getCurrentPosition((p) => ok([p.coords.latitude, p.coords.longitude]), () => ok(null), { enableHighAccuracy: true, timeout: 7000, maximumAge: 120000 });
  });
}
// Где снято: GPS из файла → иначе где сейчас телефон. Рядом с местом (≤ 300 м) — бонус.
export async function whereTaken(file, place) {
  const gps = await exifGps(file);
  const pos = gps || await hereNow();
  const d = pos ? km(pos, [place.lat, place.lon]) * 1000 : null;
  return { pos, from: gps ? 'exif' : pos ? 'device' : null, dist_m: d, on_site: d != null && d <= ON_SITE_M };
}

// ───── режим «на устройстве» (IndexedDB) ─────
const DB = 'secretbase-community', VER = 1;
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((ok, fail) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore('photos', { keyPath: 'id' }).createIndex('place', 'place');
      d.createObjectStore('likes', { keyPath: 'id' });
      d.createObjectStore('ledger', { keyPath: 'id', autoIncrement: true });
    };
    r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error);
  });
  return dbp;
}
function tx(store, mode, fn) {
  return db().then((d) => new Promise((ok, fail) => {
    const t = d.transaction(store, mode); const s = t.objectStore(store);
    const out = fn(s); t.oncomplete = () => ok(out?.result ?? out); t.onerror = () => fail(t.error);
  }));
}
const all = (store, idx, key) => tx(store, 'readonly', (s) => (idx ? s.index(idx).getAll(key) : s.getAll()));
const urls = new Map(); // id → objectURL (держим, пока открыта вкладка)
function blobUrl(id, blob) { if (!urls.has(id)) urls.set(id, URL.createObjectURL(blob)); return urls.get(id); }

const Local = {
  mode: 'local',
  async photos(placeKey) {
    const [mine, likes] = await Promise.all([all('photos', 'place', placeKey), all('likes')]);
    const liked = new Set(likes.map((l) => l.id));
    return mine.map((p) => ({
      id: p.id, url: blobUrl(p.id, p.blob), thumb: blobUrl(p.id + ':t', p.thumb), kind: p.kind, mine: true,
      credit: 'Ваше фото · видно только вам, пока не подключён общий сервер', likes: liked.has(p.id) ? 1 : 0, liked: liked.has(p.id),
      on_site: p.on_site, status: 'local', created: p.created,
    }));
  },
  async likedSet() { return new Set((await all('likes')).map((l) => l.id)); },
  async like(id) {
    const liked = (await this.likedSet()).has(id);
    await tx('likes', 'readwrite', (s) => (liked ? s.delete(id) : s.put({ id, ts: Date.now() })));
    return !liked;
  },
  async add(placeKey, place, file, kind) {
    const where = await whereTaken(file, place);
    const [big, small] = await Promise.all([resize(file, 1600), resize(file, 360)]);
    const id = 'my-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await tx('photos', 'readwrite', (s) => s.put({ id, place: placeKey, blob: big.blob, thumb: small.blob, w: big.w, h: big.h, kind, on_site: where.on_site, gps_from: where.from, dist_m: where.dist_m, created: Date.now() }));
    const gained = [['upload', POINTS.upload]];
    if (where.on_site) gained.push(['on_site', POINTS.on_site]);
    if (kind === 'drone') gained.push(['drone', POINTS.drone]);
    for (const [reason, delta] of gained) await tx('ledger', 'readwrite', (s) => s.add({ reason, delta, ref: id, ts: Date.now() }));
    return { id, points: gained.reduce((a, [, d]) => a + d, 0), on_site: where.on_site, dist_m: where.dist_m };
  },
  async stats() {
    const [led, mine] = await Promise.all([all('ledger'), all('photos')]);
    return { points: led.reduce((a, l) => a + l.delta, 0), uploads: mine.length, history: led.sort((a, b) => b.ts - a.ts).slice(0, 30) };
  },
};

// ───── режим «общий сервер» (Supabase, без SDK — REST) ─────
// Не проверен на живом сервере: включится после создания проекта по backend/supabase.sql и заполнения конфигурации.
const Supa = {
  mode: 'supabase',
  token: null,
  h(json = true) {
    const h = { apikey: COMMUNITY.anonKey, Authorization: `Bearer ${this.token || COMMUNITY.anonKey}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  },
  async auth() { // анонимный аккаунт на устройство (потом можно привязать почту/Apple/Google)
    if (this.token) return;
    let s = null; try { s = JSON.parse(localStorage.getItem('sb.session') || 'null'); } catch { }
    if (s && s.expires_at * 1000 > Date.now() + 60000) { this.token = s.access_token; this.user = s.user?.id; return; }
    const url = s?.refresh_token ? `${COMMUNITY.url}/auth/v1/token?grant_type=refresh_token` : `${COMMUNITY.url}/auth/v1/signup`;
    const r = await fetch(url, { method: 'POST', headers: this.h(), body: JSON.stringify(s?.refresh_token ? { refresh_token: s.refresh_token } : { data: {} }) });
    const j = await r.json(); if (!j.access_token) throw new Error('auth');
    try { localStorage.setItem('sb.session', JSON.stringify(j)); } catch { }
    this.token = j.access_token; this.user = j.user?.id;
  },
  async photos(placeKey) {
    const q = `${COMMUNITY.url}/rest/v1/photos_public?place_key=eq.${encodeURIComponent(placeKey)}&order=likes_count.desc,created_at.desc&limit=30`;
    const rows = await fetch(q, { headers: this.h(false) }).then((r) => r.json());
    const liked = await this.likedSet();
    const pub = (p) => `${COMMUNITY.url}/storage/v1/object/public/place-photos/${p}`;
    return rows.map((r) => ({ id: r.id, url: pub(r.path), thumb: pub(r.thumb_path || r.path), kind: r.kind, mine: r.user_id === this.user,
      credit: `${r.author || 'Игрок'} · ${r.license || 'CC BY 4.0'}`, likes: r.likes_count, liked: liked.has(r.id), on_site: r.on_site, status: r.status }));
  },
  async likedSet() {
    let has = false; try { has = !!localStorage.getItem('sb.session'); } catch { }
    if (!has) return new Set(); // аккаунт создаём только при первом лайке/фото, не при просмотре
    try { await this.auth(); } catch { return new Set(); }
    const rows = await fetch(`${COMMUNITY.url}/rest/v1/likes?select=photo_id&user_id=eq.${this.user}`, { headers: this.h(false) }).then((r) => r.json());
    return new Set(rows.map((r) => r.photo_id));
  },
  async like(id) {
    await this.auth();
    const liked = (await this.likedSet()).has(id);
    if (liked) await fetch(`${COMMUNITY.url}/rest/v1/likes?photo_id=eq.${id}&user_id=eq.${this.user}`, { method: 'DELETE', headers: this.h(false) });
    else await fetch(`${COMMUNITY.url}/rest/v1/likes`, { method: 'POST', headers: this.h(), body: JSON.stringify({ photo_id: id }) });
    return !liked;
  },
  async add(placeKey, place, file, kind) {
    await this.auth();
    const where = await whereTaken(file, place);
    const [big, small] = await Promise.all([resize(file, 1600), resize(file, 360)]);
    const base = `${this.user}/${placeKey.replace(/[^a-z0-9:-]/gi, '_')}/${Date.now().toString(36)}`;
    const put = (path, blob) => fetch(`${COMMUNITY.url}/storage/v1/object/place-photos/${path}`, { method: 'POST', headers: { ...this.h(false), 'Content-Type': 'image/jpeg' }, body: blob });
    await put(`${base}.jpg`, big.blob); await put(`${base}_t.jpg`, small.blob);
    const row = { place_key: placeKey, path: `${base}.jpg`, thumb_path: `${base}_t.jpg`, kind, width: big.w, height: big.h,
      taken_lat: where.pos?.[0] ?? null, taken_lon: where.pos?.[1] ?? null, gps_from: where.from, dist_m: where.dist_m };
    const r = await fetch(`${COMMUNITY.url}/rest/v1/photos`, { method: 'POST', headers: { ...this.h(), Prefer: 'return=representation' }, body: JSON.stringify(row) });
    const [saved] = await r.json();
    return { id: saved?.id, points: POINTS.upload + (where.on_site ? POINTS.on_site : 0) + (kind === 'drone' ? POINTS.drone : 0), on_site: where.on_site, dist_m: where.dist_m, pending: true };
  },
  async stats() {
    await this.auth();
    const [me] = await fetch(`${COMMUNITY.url}/rest/v1/profile_points?user_id=eq.${this.user}`, { headers: this.h(false) }).then((r) => r.json());
    const hist = await fetch(`${COMMUNITY.url}/rest/v1/points_ledger?user_id=eq.${this.user}&order=created_at.desc&limit=30`, { headers: this.h(false) }).then((r) => r.json());
    return { points: me?.points || 0, uploads: me?.uploads || 0, history: hist.map((h) => ({ reason: h.reason, delta: h.delta, ts: Date.parse(h.created_at) })) };
  },
};

export const localStore = Local; // лайки редакционных фото (Commons/gtadb) — всегда на устройстве
export const backend = COMMUNITY.mode === 'supabase' && COMMUNITY.url && COMMUNITY.anonKey ? Supa : Local;
