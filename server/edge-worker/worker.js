// sb-edge — пересыльщик на Cloudflare аккаунта app.shalamov (22.11.2026). Домен sbgta.app живёт здесь, а серверы оплаты и
// рефералки пока работают на прежнем аккаунте (их ключи нельзя перенести без новых ключей Stripe/Google). Этот Worker
// принимает pay.sbgta.app и ref.sbgta.app и пересылает запросы как есть на их адреса workers.dev, добавляя адрес и страну
// покупателя в заголовках X-SB-IP / X-SB-Country с общим секретом X-SB-Proxy (сервер оплаты верит им только с этим секретом).
// Когда серверы переедут сюда целиком — этот Worker удалить, custom domains повесить на сами серверы.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const target = { 'pay.sbgta.app': env.PAY_ORIGIN, 'ref.sbgta.app': env.REF_ORIGIN }[url.hostname] || (url.searchParams.has('ref') ? env.REF_ORIGIN : env.PAY_ORIGIN);
    if (!target) return new Response('no upstream', { status: 502 });
    const h = new Headers(req.headers);
    h.delete('host');
    h.set('X-SB-Proxy', env.PROXY_SECRET || '');
    h.set('X-SB-IP', req.headers.get('CF-Connecting-IP') || '');
    h.set('X-SB-Country', req.cf?.country || '');
    const r = await fetch(target + url.pathname + url.search, {
      method: req.method, headers: h, redirect: 'manual',
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    });
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers });
  },
};
