// sb-live — живой контент Secret Base (23.11.2026, Игорь: «новости и новое на карте обновлять с сервера, раз в 24 часа»).
// Только чтение из Cloudflare KV (binding LIVE); писать в KV может только владелец аккаунта через wrangler
// (tools/publish_live.py), записи по HTTP нет — нечего ломать снаружи.
//   GET /news.json              → KV "news"           (лента «Новости»)
//   GET /newmap/<игра>.json     → KV "newmap:<игра>"   (места и пасхалки, которых ещё нет в выложенном приложении)
//   GET /img/<путь>             → KV "img:<путь>"      (кадры новостей и фото новых мест, webp/jpg)
//   GET /health                 → {ok, news: updated}
const TYPES = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Max-Age': '86400' };

function json(body, status = 200, maxAge = 120) {
  return new Response(body, { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}`, 'X-Content-Type-Options': 'nosniff' } });
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json('{"error":"method"}', 405, 0);
    const p = new URL(req.url).pathname;
    if (p === '/health') {
      const n = await env.LIVE.get('news', { type: 'json', cacheTtl: 60 });
      return json(JSON.stringify({ ok: true, news: n?.updated || null }), 200, 0);
    }
    if (p === '/news.json') {
      const v = await env.LIVE.get('news', { cacheTtl: 60 });
      return v ? json(v) : json('{"error":"empty"}', 404, 30);
    }
    let m = p.match(/^\/newmap\/(gta[0-9a-z]+)\.json$/);
    if (m) {
      const v = await env.LIVE.get('newmap:' + m[1], { cacheTtl: 60 });
      return json(v || '{"places":[],"eggs":[]}');
    }
    m = p.match(/^\/img\/([\w\-./]+)\.(webp|jpe?g|png|avif)$/);
    if (m && !m[1].includes('..')) {
      const v = await env.LIVE.get('img:' + m[1] + '.' + m[2], { type: 'arrayBuffer', cacheTtl: 3600 });
      if (!v) return new Response('not found', { status: 404, headers: CORS });
      return new Response(v, { headers: { ...CORS, 'Content-Type': TYPES[m[2]], 'Cache-Control': 'public, max-age=86400' } });
    }
    return json('{"error":"not found"}', 404, 60);
  },
};
