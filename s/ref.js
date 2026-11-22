// Страницы «Поделиться» (s/<игра>/<место>.html): ссылка креатора ?r=КОД&v=<ролик> → отметка на сервере рефералки и код в кнопке
// «Открыть в Secret Base». Тот же номер устройства (sb.did) и первое касание (sb.ref.first), что у приложения (js/ref.js):
// страница и приложение на одном адресе sbgta.app, хранилище общее. Подключает tools/build_share.py.
(() => {
  try {
    const q = new URLSearchParams(location.search);
    const r = String(q.get('r') || q.get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (r.length < 3) return;
    const v = String(q.get('v') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
    let d = '', api = 'https://ref.sbgta.app';
    try {
      if (!localStorage.getItem('sb.ref.first')) localStorage.setItem('sb.ref.first', JSON.stringify({ r, v, at: Date.now() }));
      d = localStorage.getItem('sb.did') || '';
      if (!/^[a-z0-9]{16,40}$/.test(d)) { d = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, '0')).join(''); localStorage.setItem('sb.did', d); }
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { const o = localStorage.getItem('sb.refapi'); api = o === 'off' ? '' : (o || api); }
    } catch (e) { }
    const sa = !!navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    if (api && d) {
      const body = JSON.stringify({ d, r, v, sa: sa ? 1 : 0 });
      if (!(navigator.sendBeacon && navigator.sendBeacon(api.replace(/\/$/, '') + '/hit', body))) fetch(api.replace(/\/$/, '') + '/hit', { method: 'POST', body, keepalive: true }).catch(() => { });
    }
    document.querySelectorAll('a.cta').forEach((a) => { const u = new URL(a.href, location.href); u.searchParams.set('r', r); if (v) u.searchParams.set('v', v); a.href = u.href; });
  } catch (e) { }
})();
