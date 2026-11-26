// «Советы по настройкам» — путь по меню игры (26.11.2026, «Гид по игре», функция «настройки»; ТЗ — «09 Решение Fable», п. 6).
// Экраны меню не картинки, а схема из данных: одна модель меню игры (вкладки → разделы → пункты по порядку) даёт и путь к любому
// пункту, и экран на каждом шаге пути, и ролик (tools/settings_video.py снимает те же экраны). Поправили порядок пунктов в меню —
// исправились все пути, экраны и ролики. Кнопки в данных не пишутся: действие (confirm, tab_next…) → значок из таблицы btn[платформа].
import { btn } from './icons.js';

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// платформа экрана: PlayStation и Xbox свои; ПК и телефон — показываем PlayStation (строка об этом — в guide.js)
export const platOf = (p) => (p === 'xbox' ? 'xbox' : 'playstation');

// значок кнопки действия на платформе: { html, cls, word }. Неподтверждённые значки (btn.st[платформа] !== 'ok') — словом, без значка.
export function key(M, plat, act) {
  const tok = M.btn?.[plat]?.[act];
  if (!tok) return null;
  const b = btn(tok, plat);
  return { cls: b.cls, html: b.html, tok, sure: (M.btn.st?.[plat] || 'ok') === 'ok' };
}
export const keyHTML = (k, big = false) => (k ? `<span class="${k.cls}${big ? ' k-big' : ''}${k.sure ? '' : ' k-unsure'}">${k.html}</span>` : '');

// ── путь к пункту меню: список узлов { act, btn, to, n, value } ──
// act: open (пауза), pick (выбрать строку и войти), tab (вкладка), move (вниз до пункта), set (значение)
export function pathTo(M, itemId, value) {
  const nodes = walk(M, itemId); if (!nodes.length) return nodes;
  const { it } = find(M, itemId), last = nodes[nodes.length - 1].scr;
  if (value != null && it.ty !== 'go') {   // значение: влево или вправо по списку вариантов (слайдер — к меньшему или большему)
    const o = it.o || [], a = o.indexOf(String(it.v)), b = o.indexOf(String(value));
    const dir = a >= 0 && b >= 0 ? (b < a ? 'left' : 'right') : (+value < +it.v ? 'left' : 'right');
    nodes.push({ act: 'set', btn: dir, to: value, scr: { ...last, set: value } });
  } else if (it.ty === 'go') nodes.push({ act: 'pick', btn: 'confirm', to: it.l, scr: last });
  return nodes;
}
function walk(M, itemId) {
  const loc = find(M, itemId); if (!loc) return [];
  const { tab, ti, sec, it } = loc, nodes = [];
  nodes.push({ act: 'pause', btn: 'pause', scr: { at: 'game' } });
  nodes.push({ act: 'pick', btn: 'confirm', to: M.pause.target, scr: { at: 'pause', hi: M.pause.target } });
  const t0 = M.tabs.findIndex((x) => x.id === (M.start || M.tabs[0].id));
  const d = ti - t0;
  if (d) nodes.push({ act: 'tab', btn: d > 0 ? 'tab_next' : 'tab_prev', n: Math.abs(d), to: tab.l, scr: { at: 'tab', tab: tab.id } });
  if (sec && sec.sub) {   // раздел — отдельная страница: встать на него и войти
    nodes.push({ act: 'move', btn: 'down', to: sec.l, scr: { at: 'tab', tab: tab.id, hi: sec.id } });
    nodes.push({ act: 'pick', btn: 'confirm', to: sec.l, scr: { at: 'sec', tab: tab.id, sec: sec.id } });
  }
  nodes.push({ act: 'move', btn: 'down', to: it.l, scr: { at: sec?.sub ? 'sec' : 'tab', tab: tab.id, sec: sec?.id, hi: it.id } });
  return nodes;
}
export function find(M, itemId) {
  for (let ti = 0; ti < M.tabs.length; ti++) {
    const tab = M.tabs[ti];
    for (const sec of tab.sec || []) for (const it of sec.it || []) if (it.id === itemId) return { tab, ti, sec, it };
  }
  return null;
}

// ── экран меню (схема): 16:9, вкладки сверху, список пунктов со значениями, описание пункта, строка кнопок внизу ──
// scr: { at: game|pause|tab|sec, tab, sec, hi, set } ; set — значение, которое уже поставили (подсветка «стало»)
export function screenHTML(M, plat, scr, o = {}) {
  const lab = o.lab || ((x) => x);
  const hint = (acts) => `<div class="gm-hint">${acts.map(([a, w]) => { const k = key(M, plat, a); return k ? `<span>${keyHTML(k)}<i>${esc(w)}</i></span>` : ''; }).join('')}</div>`;
  if (scr.at === 'game') {
    return `<div class="gm gm-game" data-at="game"><div class="gm-sky"></div><div class="gm-hud"><span class="gm-mm"></span></div>
      <div class="gm-center">${keyHTML(key(M, plat, 'pause'), true)}</div>${hint([])}</div>`;
  }
  if (scr.at === 'pause') {
    return `<div class="gm gm-pause" data-at="pause"><div class="gm-sky dim"></div><ul class="gm-pl">${M.pause.items.map((x) => `<li class="${x === scr.hi ? 'hi ring' : ''}">${esc(x)}</li>`).join('')}</ul>
      ${hint([['confirm', o.w?.select || 'Select'], ['back', o.w?.back || 'Back']])}</div>`;
  }
  const ti = M.tabs.findIndex((x) => x.id === scr.tab), tab = M.tabs[ti] || M.tabs[0];
  // вкладки: видно 5 вокруг текущей, как в игре лента прокручивается
  const tabs = M.tabs.map((x) => `<li class="${x.id === tab.id ? 'on' : ''}${x.id === tab.id && scr.ringTab ? ' ring' : ''}">${esc(x.l)}</li>`).join('');
  let rows = '', desc = '';
  const secs = tab.sec || [];
  const inSec = scr.at === 'sec' ? secs.find((s) => s.id === scr.sec) : null;
  const list = inSec ? [inSec] : secs;
  for (const s of list) {
    if (!inSec && s.sub) { rows += `<li class="gm-row gm-go${s.id === scr.hi ? ' hi ring' : ''}"><b>${esc(s.l)}</b><span>›</span></li>`; continue; }
    if (s.l && !inSec) rows += `<li class="gm-sh">${esc(s.l)}</li>`;
    for (const it of s.it || []) {
      const on = it.id === scr.hi, v = on && scr.set != null ? scr.set : it.v;
      rows += `<li class="gm-row${on ? ' hi ring' : ''}${on && scr.set != null ? ' gm-set' : ''}"><b>${esc(it.l)}</b><span>${on && it.ty !== 'go' ? '‹ ' : ''}${esc(v ?? '')}${on && it.ty !== 'go' ? ' ›' : ''}</span></li>`;
      if (on && it.d) desc = lab(it.d);
    }
  }
  const head = inSec ? `<p class="gm-crumb">${esc(tab.l)} › ${esc(inSec.l)}</p>` : '';
  return `<div class="gm gm-menu" data-at="${scr.at}"><div class="gm-sky dim"></div>
    <div class="gm-tabs">${keyHTML(key(M, plat, 'tab_prev'))}<ul>${tabs}</ul>${keyHTML(key(M, plat, 'tab_next'))}</div>
    ${head}<div class="gm-body"><ul class="gm-list">${rows}</ul>${desc ? `<p class="gm-desc">${esc(desc)}</p>` : ''}</div>
    ${hint([['confirm', o.w?.select || 'Select'], ['back', o.w?.back || 'Back'], ['reset', o.w?.reset || 'Defaults']])}</div>`;
}

// прокрутить список экрана так, чтобы выделенная строка была видна (экран маленький, пунктов во вкладке до 20)
export function fitScreens(root) {
  for (const u of root.querySelectorAll('.gm-tabs ul')) {   // лента вкладок: текущая видна целиком
    const on = u.querySelector('.on'); if (!on) continue;
    if (on.offsetLeft + on.offsetWidth > u.clientWidth + u.scrollLeft) u.scrollLeft = on.offsetLeft + on.offsetWidth - u.clientWidth + 8;
  }
  for (const l of root.querySelectorAll('.gm-list')) {
    const h = l.querySelector('.hi'); if (!h) continue;
    const y = h.offsetTop - l.clientHeight / 2 + h.offsetHeight / 2;
    l.scrollTop = Math.max(0, y);
  }
}
