// Живой контент с сервера (Игорь 23.11.2026: «новости и новое на карте обновлять с сервера», раз в сутки, без выкладки приложения).
// Сервер — Worker sb-live (server/live-worker) на live.sbgta.app, данные в Cloudflare KV, их кладёт tools/publish_live.py.
//   /news.json            — лента «Новости» (как data/news.json, картинки — абсолютные адреса live.sbgta.app/img/…)
//   /newmap/<игра>.json   — места и пасхалки, которых ещё нет в выложенном приложении (+ свежие): {places, eggs}
// Без сети и при сбое — запас из своих файлов (data/news.json, data/map/<игра>.json); ответы сервера кэширует sw.js (live-v1).
// Стенд (localhost) по умолчанию без сервера; включить — localStorage sb.liveapi = 'https://live.sbgta.app' (тесты).
import { LIVE } from './config.js';

function base() {
  let v = null;
  try { v = localStorage.getItem('sb.liveapi'); } catch { }
  if (v) return v === 'off' ? '' : v.replace(/\/$/, '');
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return '';
  return LIVE.api || '';
}

// JSON с сервера: не дольше ms, иначе отказ (вызывающий берёт свой запас)
export function liveJSON(path, ms = 2500) {
  const b = base();
  if (!b) return Promise.reject(new Error('live off'));
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  return fetch(b + path, { cache: 'no-cache', signal: c.signal, credentials: 'omit' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .finally(() => clearTimeout(t));
}

const extras = {};
// места и пасхалки с сервера для игры (один запрос на сессию; resetLive — перечитать при возврате в приложение)
export function liveExtras(game) {
  return (extras[game] ||= liveJSON(`/newmap/${game}.json`).then((x) => ({ places: x?.places || [], eggs: x?.eggs || [] }))
    .catch(() => ({ places: [], eggs: [] })));
}
export function resetLive(game) { if (game) delete extras[game]; else Object.keys(extras).forEach((k) => delete extras[k]); }

// подмешать к данным игры: запись сервера заменяет запись с тем же id (исправление), новые — добавляются
export function mergeExtras(d, x) {
  if (!d || !x) return d;
  for (const k of ['places', 'eggs']) {
    const list = d[k] || (d[k] = []);
    const at = new Map(list.map((o, i) => [o.id, i]));
    for (const o of x[k] || []) {
      if (!o || !o.id) continue;
      if (at.has(o.id)) list[at.get(o.id)] = o; else { at.set(o.id, list.length); list.push(o); }
    }
  }
  return d;
}
