// Админка промокодов Secret Base: https://pay.sbgta.app/admin (22.11.2026).
// Пароль — ADMIN_TOKEN сервера (файл ~/.config/sbgta-cf/admin_token); хранится только во вкладке (sessionStorage).
// Свои коды: «Бесплатный доступ» (Pro на N дней без карты) и «Платный триал» ($X сразу, N дней, потом полная цена подписки).
// Скидка Stripe — прежний купон для поля промокода на странице Stripe.
export const ADMIN_HTML = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Промокоды Secret Base</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#101014;--fg:#ecebf0;--mute:#9a98a6;--line:#2a2a33;--acc:#8fd6b4;--bad:#f08a8a}
@media (prefers-color-scheme:light){:root{--bg:#f7f6f2;--fg:#17161b;--mute:#66646f;--line:#dddbd3;--acc:#1d7a52;--bad:#b23a3a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 'Golos Text',system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:28px 16px 64px}h1{font-size:28px;margin:0 0 4px}h2{font-size:19px;margin:36px 0 10px}
p.m{color:var(--mute);margin:0 0 18px}label{display:block;font-size:14px;color:var(--mute);margin-bottom:4px}
input,select,button{font:inherit;color:inherit}input,select{width:100%;padding:9px 10px;background:transparent;border:1px solid var(--line);border-radius:6px}
button{padding:10px 16px;border:0;border-radius:6px;background:var(--fg);color:var(--bg);font-weight:600;cursor:pointer}
button.l{background:none;color:var(--acc);padding:4px 0;font-weight:400}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;align-items:end}
table{width:100%;border-collapse:collapse;font-size:15px}th,td{text-align:left;padding:8px 10px 8px 0;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--mute);font-weight:400}.w{overflow-x:auto}#msg{min-height:24px;margin-top:10px}.bad{color:var(--bad)}.ok{color:var(--acc)}
.off{color:var(--mute)}[hidden]{display:none!important}
</style></head><body><main>
<h1>Промокоды</h1>
<p class="m">Свои коды приложения вводятся в пейволе Secret Base в строке «Есть промокод?». Скидки Stripe вводятся на странице оплаты Stripe.</p>
<section id="login"><div class="g"><div><label for="tok">Пароль администратора</label><input id="tok" type="password" autocomplete="off"></div><div><button id="enter">Войти</button></div></div></section>
<section id="app" hidden>
<h2>Новый код</h2>
<div class="g">
 <div><label for="type">Тип</label><select id="type"><option value="free">Бесплатный доступ без карты</option><option value="trial">Платный триал</option><option value="stripe">Скидка Stripe</option></select></div>
 <div><label for="code">Код</label><input id="code" placeholder="TRY1" autocapitalize="characters"></div>
 <div data-for="free trial"><label for="days">Дней доступа</label><input id="days" type="number" min="1" value="3"></div>
 <div data-for="trial"><label for="price">Цена сразу, $</label><input id="price" type="number" min="0" step="0.01" value="1"></div>
 <div data-for="stripe"><label for="pct">Скидка, %</label><input id="pct" type="number" min="1" max="100" value="100"></div>
 <div><label for="max">Лимит активаций (0 — без лимита)</label><input id="max" type="number" min="0" value="100"></div>
 <div data-for="free trial"><label for="exp">Действует до</label><input id="exp" type="date"></div>
 <div data-for="free trial"><label for="note">Заметка</label><input id="note" placeholder="для кого"></div>
 <div><button id="save">Создать</button></div>
</div>
<div id="msg"></div>
<h2>Коды приложения</h2><div class="w"><table><thead><tr><th>Код</th><th>Тип</th><th>Условия</th><th>Активаций</th><th>До</th><th>Заметка</th><th></th></tr></thead><tbody id="codes"></tbody></table></div>
<h2>Активации</h2><div class="w"><table><thead><tr><th>Когда</th><th>Код</th><th>Почта</th><th>Устройство</th><th>Статус</th></tr></thead><tbody id="uses"></tbody></table></div>
<h2>Скидки Stripe</h2><div class="w"><table><thead><tr><th>Код</th><th>Скидка</th><th>Использовано</th><th>Включён</th></tr></thead><tbody id="sc"></tbody></table></div>
</section>
<script>
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let tok = ''; try { tok = sessionStorage.getItem('sbadm') || ''; } catch {}
const api = async (path, body) => {
  const r = await fetch(path, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || r.status); return d;
};
const ERR = { auth: 'Неверный пароль', bad_code: 'Код — 3–30 латинских букв и цифр', bad_days: 'Дней — от 1 до 3650', bad_price: 'Цена — от 0 до 100 $', bad_expires: 'Неверная дата' };
const day = (ms) => ms ? new Date(ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'бессрочно';
const when = (ms) => new Date(ms).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const terms = (p) => p.kind === 'free' ? p.days + ' дн. Pro без карты' : '$' + (p.price_cents / 100).toFixed(2) + ' сразу, ' + p.days + ' дн., потом полная цена';
const ST = { ok: 'выдан', started: 'открыл оплату', paid: 'оплачен' };
function showType() { const t = $('#type').value; document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = !el.dataset.for.split(' ').includes(t); }); }
async function load() {
  const d = await api('/admin/promo');
  $('#codes').innerHTML = d.promos.map((p) => '<tr class="' + (p.active ? '' : 'off') + '"><td><b>' + esc(p.code) + '</b></td><td>' + (p.kind === 'free' ? 'бесплатный' : 'триал') + '</td><td>' + esc(terms(p)) + '</td><td>' + p.used + (p.max ? ' из ' + p.max : '') + '</td><td>' + day(p.expires) + '</td><td>' + esc(p.note) + '</td><td><button class="l" data-t="' + (p.active ? 'off' : 'on') + '" data-c="' + esc(p.code) + '">' + (p.active ? 'Выключить' : 'Включить') + '</button></td></tr>').join('') || '<tr><td colspan="7" class="off">Пока нет</td></tr>';
  $('#uses').innerHTML = d.uses.map((u) => '<tr><td>' + when(u.at) + '</td><td>' + esc(u.code) + '</td><td>' + esc(u.email || '—') + '</td><td>' + esc((u.device || '—').slice(0, 8)) + '</td><td>' + (ST[u.status] || esc(u.status)) + '</td></tr>').join('') || '<tr><td colspan="5" class="off">Пока нет</td></tr>';
  $('#sc').innerHTML = d.stripe.map((c) => '<tr><td>' + esc(c.code) + '</td><td>' + (c.percent != null ? c.percent + ' %' : '—') + '</td><td>' + c.used + (c.max ? ' из ' + c.max : '') + '</td><td>' + (c.active ? 'да' : 'нет') + '</td></tr>').join('') || '<tr><td colspan="4" class="off">Нет</td></tr>';
}
async function enter() {
  tok = $('#tok').value.trim() || tok;
  try { await load(); try { sessionStorage.setItem('sbadm', tok); } catch {} $('#login').hidden = true; $('#app').hidden = false; }
  catch (e) { $('#login').insertAdjacentHTML('beforeend', '<p class="bad">' + esc(ERR[e.message] || e.message) + '</p>'); }
}
$('#enter').onclick = enter; $('#tok').onkeydown = (e) => { if (e.key === 'Enter') enter(); };
$('#type').onchange = showType; showType();
$('#save').onclick = async () => {
  const t = $('#type').value, m = $('#msg');
  const b = t === 'stripe' ? { type: 'stripe', code: $('#code').value, percent_off: +$('#pct').value, max: +$('#max').value || undefined }
    : { type: t, code: $('#code').value, days: +$('#days').value, price: +$('#price').value, max: +$('#max').value, expires: $('#exp').value || '', note: $('#note').value };
  try { await api('/admin/promo', b); m.className = 'ok'; m.textContent = 'Код ' + b.code.toUpperCase() + ' создан'; await load(); }
  catch (e) { m.className = 'bad'; m.textContent = ERR[e.message] || ('Ошибка: ' + e.message); }
};
$('#codes').onclick = async (e) => { const b = e.target.closest('button[data-c]'); if (!b) return; await api('/admin/promo', { type: b.dataset.t, code: b.dataset.c }); load(); };
if (tok) enter();
</script></main></body></html>`;
