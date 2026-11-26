// «Не упустить навсегда» — предупреждения и сохранения (26.11.2026, «Гид по игре», функция guide-saves). Черновик для решения Fable.
// Данные — data/guide/saves.json (warn[] привязаны к миссиям по id из data/guide/missions.json, его ведёт guide-walkthrough;
// пока его нет — порядок из saves.json ms[]). Прогресс игрока — общий ключ sb.gp {игра: {m: id последней пройденной, at}};
// отметки «сделал» — sb.gs {игра: [id]}. Инструкция «как сохраняться» открывается тем же экраном «По шагам» (js/guide.js).
// Для экрана миссии гида: savesFor(game, missionId) → { miss, req } — подставить в how.miss и how.req, guide.js рисует сам.
// Для Главной: nextWarn(game) → ближайшая точка невозврата впереди (или null).

const S = {
  ru: {
    title: 'Не упустить навсегда', close: 'Закрыть', share: 'Поделиться',
    lead: 'Миссии в GTA 6 не переиграть: повтора из меню нет. Назад — только через своё ручное сохранение. Вот что сделать до точек невозврата.',
    meta: '{n} предупреждений, {k} — навсегда', trust: 'Сверено по {n} гайдам и справке PlayStation и Xbox',
    where: 'Где вы сейчас', where_none: 'Отметьте последнюю пройденную миссию — покажем, что сделать до следующей точки невозврата.',
    where_set: 'Пройдена «{m}», глава {c}', change: 'Изменить', pick: 'Отметить, где я', pick_t: 'Последняя пройденная миссия', start0: 'Ещё не начинал',
    soon: 'До «{m}»', soon_h: 'До точки невозврата', soon_n: 'через {n} миссии|через {n} миссию|через {n} миссий', soon_0: 'следующая миссия',
    how_t: 'Сохраниться грамотно', how_btn: 'Как сохраняться на {p}', how_meta: '{n} шагов, около {m} минут',
    by_m: 'По миссиям', before: 'До «{m}»', ch: 'глава {c}', past: 'Позади', past_t: 'Уже пройдено. Если не успели — поможет только ручное сохранение до этой миссии.',
    always: 'Всегда, в любой главе', trophies: 'Трофеи', bugs: 'Баги сохранений', next: 'Дальше',
    lv1: 'навсегда', lv2: 'можно вернуть', one: 'по одному гайду — проверяем', sp: 'Спойлер — нажмите, чтобы открыть', sp_m: 'Название миссии скрыто — открыть', n_w: '{n} пункта|{n} пункт|{n} пунктов', hid_m: 'Миссия (название скрыто)', ch_t: 'Глава {c}',
    done: 'Сделано', undo: 'Отметить как не сделано', sources: 'Источники', report: 'Сообщить об ошибке', report_ok: 'Спасибо, проверим',
    n_bug: 'Баг перепроверим после следующего патча',
    nx_egg: 'Угнать Bugatti по шагам', nx_eggs: 'Все пасхалки GTA 6', nx_codes: 'Коды GTA 6: деньги, оружие, сбросить розыск',
    nx_walk: 'Гид прохождения: следующая миссия', nx_end: 'Концовки: какой выбор на что влияет',
  },
  en: {
    title: "Don't miss it forever", close: 'Close', share: 'Share',
    lead: "You can't replay GTA 6 missions from a menu. The only way back is your own manual save. Here's what to do before each point of no return.",
    meta: '{n} warnings, {k} permanent', trust: 'Cross-checked across {n} guides and PlayStation and Xbox support',
    where: 'Where you are', where_none: "Mark the last mission you finished — we'll show what to do before the next point of no return.",
    where_set: 'Finished “{m}”, chapter {c}', change: 'Change', pick: 'Mark where I am', pick_t: 'Last mission you finished', start0: "Haven't started",
    soon: 'Before “{m}”', soon_h: 'Before a point of no return', soon_n: 'in {n} mission|in {n} missions', soon_0: 'next mission',
    how_t: 'Save the smart way', how_btn: 'How to save on {p}', how_meta: '{n} steps, about {m} min',
    by_m: 'By mission', before: 'Before “{m}”', ch: 'chapter {c}', past: 'Behind you', past_t: 'Already done. If you missed something, only a manual save from before that mission helps.',
    always: 'Any time, any chapter', trophies: 'Trophies', bugs: 'Save bugs', next: 'Next',
    lv1: 'permanent', lv2: 'recoverable', one: 'one guide says — checking', sp: 'Spoiler — tap to reveal', sp_m: 'Mission name hidden — reveal', n_w: '{n} item|{n} items', hid_m: 'Mission (name hidden)', ch_t: 'Chapter {c}',
    done: 'Done', undo: 'Mark as not done', sources: 'Sources', report: 'Report a mistake', report_ok: "Thanks, we'll check",
    n_bug: "We'll recheck bugs after the next patch",
    nx_egg: 'Steal the Bugatti step by step', nx_eggs: 'All GTA 6 easter eggs', nx_codes: 'GTA 6 cheats: money, weapons, lose wanted level',
    nx_walk: 'Walkthrough: your next mission', nx_end: 'Endings: what each choice changes',
  },
};
const GP = 'sb.gp', GS = 'sb.gs';
let C = null, D = null, M = null, layer = null, open1 = new Set();

const L = () => (C?.lang === 'ru' ? 'ru' : C?.lang && S[C.lang] ? C.lang : 'en');
const s = (k, v = {}) => { let x = S[L()][k] ?? S.en[k] ?? k; for (const [a, b] of Object.entries(v)) x = x.split(`{${a}}`).join(b); return x; };
const plural = (k, n) => {   // «через 2 миссии» — формы ru: 2–4 | 1 | 5+
  const f = s(k, { n }).split('|');
  if (L() !== 'ru') return f[n === 1 ? 0 : 1] || f[0];
  const a = n % 10, b = n % 100;
  return (a === 1 && b !== 11 ? f[1] : a >= 2 && a <= 4 && (b < 12 || b > 14) ? f[0] : f[2]) || f[0];
};
const tx = (o) => (o ? o[L()] || o.en || o.ru || '' : '');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jget = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
const base = () => new URL('.', document.baseURI).href;

// ── данные ──
const cache = {};
async function load(game) {
  if (cache[game]) return cache[game];
  const get = (p) => fetch(base() + p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const d = await get('data/guide/saves.json');
  if (!d || d.game !== game) return (cache[game] = null);
  // база миссий гида прохождения: путь в saves.json base (null — ветки guide-walkthrough ещё нет, без лишнего запроса и 404)
  const m = d.base ? await get(d.base) : null;
  // миссии: из общей базы гида прохождения (контракт guide-walkthrough: m[] по порядку, ch "c1", id без «m:»), иначе запасной ms[] из saves.json
  const raw = m?.m || m?.missions || [], num = (c) => +String(c ?? '').replace(/\D/g, '') || 0, bare = (id) => String(id || '').replace(/^m:/, '');
  const list = raw.length ? raw.map((x, i) => ({ id: bare(x.id), o: i, ch: num(x.ch), t: x.t, pnr: x.pnr, sp: x.sp || 0 })) : d.ms.map((x) => ({ ...x, ch: num(x.ch) }));
  const mm = new Map(list.map((x) => [x.id, x]));
  d.ms.forEach((x) => { if (!mm.has(x.id)) mm.set(x.id, { ...x, ch: num(x.ch), o: list.length + x.o }); });   // финал и т. п., которых ещё нет в общей базе
  // подсказки гида прохождения «сделайте до миссии» (tips, miss — навсегда) показываем здесь же, свои warn[] они не повторяют
  const own = new Set(d.warn.map((w) => w.id));
  (m?.tips || []).filter((q) => (q.miss || q.lose) && q.until && !own.has(q.id)).forEach((q) => d.warn.push({
    id: 't:' + q.id, m: bare(q.until), k: q.goal || 'side', lvl: q.miss ? 1 : 2, st: (q.c || 0) >= 2 ? 'ok' : 'one', sp: q.sp || 0,
    t: q.t, why: q.lose || q.rw || { ru: '', en: '' }, src: q.s || [],
  }));
  return (cache[game] = { d, m: [...mm.values()].sort((a, b) => a.o - b.o), mm });
}
const progressM = (game) => (jget(GP)[game]?.m || '').replace(/^m:/, '') || null;
const doneSet = (game) => new Set(jget(GS)[game] || []);
function toggleDone(game, id) {
  const all = jget(GS), set = new Set(all[game] || []);
  set.has(id) ? set.delete(id) : set.add(id); all[game] = [...set]; jset(GS, all); return set.has(id);
}
function setProgress(game, id) { const all = jget(GP); if (id) all[game] = { m: 'm:' + id, at: Date.now(), via: 'self' }; else delete all[game]; jset(GP, all); }

// миссии с предупреждениями — по порядку; где игрок сейчас (o пройденной; -1 — не начинал)
function groups(x, game) {
  const cur = x.mm.get(progressM(game))?.o ?? -1;
  const by = new Map();
  x.d.warn.forEach((w) => { const m = x.mm.get(w.m); if (m) (by.get(m) || by.set(m, []).get(m)).push(w); });
  return [...by.entries()].sort((a, b) => a[0].o - b[0].o)
    .map(([m, ws]) => { const ahead = x.m.filter((q) => q.o > cur && q.o < m.o).length;
      // правило гида прохождения: названия миссий дальше текущей + 1 не показываем, sp 2 — даже следующую
      return { m, ws, past: m.o <= cur, ahead, hide: m.o > cur && (ahead > 0 || m.sp >= 2) }; });
}

// ── API для других экранов ──
export async function savesFor(game, missionId, lang = 'ru') {
  C = C || { lang }; const x = await load(game); if (!x) return null;
  const ws = x.d.warn.filter((w) => w.m === missionId); if (!ws.length) return null;
  const pick = (w) => ({ ru: w.t.ru, en: w.t.en });
  const lv1 = ws.filter((w) => w.lvl === 1 && w.k !== 'pnr');
  return {
    miss: lv1.length ? { ru: lv1.map((w) => w.t.ru).join('. '), en: lv1.map((w) => w.t.en).join('. ') } : null,
    req: ws.map((w) => ({ t: pick(w) })),
  };
}
export async function nextWarn(game) {
  const x = await load(game); if (!x) return null;
  const g = groups(x, game).find((q) => !q.past && q.ws.some((w) => w.lvl === 1));
  return g ? { m: g.m, ahead: g.ahead, n: g.ws.length } : null;
}

// ── экран ──
function css() {
  for (const [id, href] of [['guide-css', 'css/guide.css'], ['saves-css', 'css/saves.css']]) {
    if (document.getElementById(id)) continue;
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
}
const plat = () => (C.platform === 'xbox' ? 'xbox' : 'playstation');
const platName = () => (plat() === 'xbox' ? 'Xbox' : 'PS5');

function wHTML(w, done, spoil) {
  const I = C.I, hid = spoil && w.sp && !open1.has(w.id);
  if (hid) return `<li class="sv-w is-sp"><button class="sv-sp" data-s="spoil" data-id="${esc(w.id)}">${I.eye}<span>${esc(s('sp'))}</span></button></li>`;
  return `<li class="sv-w${done ? ' is-done' : ''}${w.lvl === 1 ? ' is-l1' : ''}">
    <button class="g-tc sv-tc" data-s="done" data-id="${esc(w.id)}" aria-pressed="${done}" aria-label="${esc(done ? s('undo') : s('done'))}">${I.check}</button>
    <div class="sv-wb"><p class="sv-t">${esc(tx(w.t))}</p><p class="sv-why">${esc(tx(w.why))}</p>
      <p class="sv-lv">${esc(w.lvl === 1 ? s('lv1') : s('lv2'))}${w.st === 'one' ? `<span>${esc(s('one'))}</span>` : ''}</p></div></li>`;
}
function render() {
  const { d } = D, I = C.I, game = C.game, dn = doneSet(game), gs = groups(D, game), pm = D.mm.get(progressM(game));
  const all = [...d.warn, ...d.always], k1 = all.filter((w) => w.lvl === 1).length;
  const soon = gs.find((g) => !g.past && g.ahead <= 2 && pm);
  const how = d.save[plat()];
  const tn = (n) => plural('n_w', n);
  const rowW = (ws) => `<ul class="sv-list">${ws.map((w) => wHTML(w, dn.has(w.id), true)).join('')}</ul>`;
  const nx = [
    window.SB?.openWalk ? ['walk', s('nx_walk')] : null,
    window.SB?.openEndings ? ['end', s('nx_end')] : null,
    ['egg', s('nx_egg')], ['eggs', s('nx_eggs')], ['codes', s('nx_codes')],
  ].filter(Boolean).slice(0, 3);
  layer.innerHTML = `<div class="g-scroll" id="sv-scroll">
    <header class="g-top"><button class="g-ib" data-s="close" aria-label="${esc(s('close'))}">${I.chevron}</button>
      <button class="g-ib" data-s="share" aria-label="${esc(s('share'))}">${I.share}</button></header>
    <h1 class="g-h1">${esc(s('title'))}</h1>
    <p class="g-rw">${esc(s('lead'))}</p>
    <p class="g-meta">${esc(s('meta', { n: all.length, k: k1 }))}</p>
    <p class="g-trust">${I.check}<span>${esc(s('trust', { n: (d.sn || []).length - 2 }))}</span></p>

    <section class="g-sec"><h2>${esc(s('where'))}</h2>
      ${pm ? `<div class="sv-where"><p>${esc(s('where_set', { m: tx(pm.t), c: pm.ch }))}</p><button class="g-link" data-s="pick">${esc(s('change'))}</button></div>`
        : `<p class="sv-p">${esc(s('where_none'))}</p><button class="g-link" data-s="pick">${I.pin}<span>${esc(s('pick'))}</span></button>`}
    </section>

    ${soon ? `<section class="g-sec sv-soon"><p class="g-miss">${I.alert}<span>${esc(soon.hide && !open1.has('m:' + soon.m.id) ? s('soon_h') : s('soon', { m: tx(soon.m.t) }))}, ${esc(soon.ahead ? plural('soon_n', soon.ahead) : s('soon_0'))}</span></p>
      ${soon.hide && !open1.has('m:' + soon.m.id) ? `<button class="sv-sp" data-s="spoil" data-id="m:${esc(soon.m.id)}">${C.I.eye}<span>${esc(s('sp_m'))}</span></button>` : rowW(soon.ws)}</section>` : ''}

    <section class="g-sec"><h2>${esc(s('how_t'))}</h2>
      <ol class="sv-rules">${d.rules.map((r) => `<li>${esc(tx(r))}</li>`).join('')}</ol>
      <button class="sv-how" data-s="how">${I[plat() === 'xbox' ? 'xbox' : 'ps']}<span><b>${esc(s('how_btn', { p: platName() }))}</b><small>${esc(s('how_meta', { n: how.st.length, m: how.min }))}</small></span>${I.chevron}</button>
    </section>

    <section class="g-sec"><h2>${esc(s('by_m'))}</h2>
      ${gs.filter((g) => !g.past && g !== soon).map((g) => `<h3 class="sv-h3">${g.hide && !open1.has('m:' + g.m.id) ? `<span class="sv-hid">${esc(s('ch_t', { c: g.m.ch }))}</span><small>${esc(tn(g.ws.length))}</small></h3><button class="sv-sp" data-s="spoil" data-id="m:${esc(g.m.id)}">${C.I.eye}<span>${esc(s('sp_m'))}</span></button>` : `${esc(s('before', { m: tx(g.m.t) }))}<small>${esc(s('ch', { c: g.m.ch }))}</small></h3>${rowW(g.ws)}`}`).join('')}
      ${gs.some((g) => g.past) ? `<details class="g-alt sv-past"><summary>${esc(s('past'))}: ${gs.filter((g) => g.past).reduce((a, g) => a + g.ws.length, 0)}</summary><p class="g-note">${esc(s('past_t'))}</p>
        ${gs.filter((g) => g.past).map((g) => `<h3 class="sv-h3">${esc(s('before', { m: tx(g.m.t) }))}<small>${esc(s('ch', { c: g.m.ch }))}</small></h3>${rowW(g.ws)}`).join('')}</details>` : ''}
    </section>

    <section class="g-sec"><h2>${esc(s('always'))}</h2>${rowW(d.always)}</section>
    <section class="g-sec"><h2>${esc(s('trophies'))}</h2><p class="sv-p">${esc(tx(d.trophies.t))}</p></section>
    <section class="g-sec"><h2>${esc(s('bugs'))}</h2><ul class="sv-bugs">${d.bugs.map((b) => `<li><b>${esc(tx(b.t))}</b><span>${esc(tx(b.fix))}</span></li>`).join('')}</ul>
      <p class="g-note">${esc(s('n_bug'))}</p></section>

    <section class="g-sec sv-next"><h2>${esc(s('next'))}</h2>
      ${nx.map(([a, t]) => `<button class="sv-nx" data-s="nx" data-v="${a}"><span>${esc(t)}</span>${I.chevron}</button>`).join('')}</section>

    <section class="g-sec g-foot">
      <p class="g-note">${esc(s('sources'))}: ${esc((d.sn || []).join(', '))}</p>
      <button class="g-link" data-s="report">${esc(s('report'))}</button>
    </section>
  </div>
  <div class="g-sheet" id="sv-pick" hidden></div>
  <footer class="g-bar">${pm ? `<button class="g-main" data-s="how">${esc(s('how_btn', { p: platName() }))}</button>`
    : `<button class="g-main" data-s="pick">${esc(s('pick'))}</button>`}</footer>`;
}
function rerender() { const y = layer.querySelector('#sv-scroll')?.scrollTop || 0; render(); layer.querySelector('#sv-scroll').scrollTop = y; }

function openPick() {
  const box = layer.querySelector('#sv-pick'), cur = progressM(C.game), co = D.mm.get(cur)?.o ?? -1;
  const byCh = new Map(); D.m.forEach((m) => (byCh.get(m.ch) || byCh.set(m.ch, []).get(m.ch)).push(m));
  box.innerHTML = `<div class="g-sh-in"><div class="g-sh-top"><b>${esc(s('pick_t'))}</b><button class="g-ib" data-s="unpick" aria-label="${esc(s('close'))}">${C.I.close}</button></div>
    <ul class="sv-ms"><li><button data-s="setm" data-id="" class="${cur ? '' : 'on'}">${esc(s('start0'))}</button></li>
    ${[...byCh.entries()].map(([c, ms]) => `<li class="sv-msc">${esc(s('ch_t', { c }))}</li>${ms.map((m) => `<li><button data-s="setm" data-id="${esc(m.id)}" class="${m.id === cur ? 'on' : ''}">${esc((m.sp >= 1 && m.o > co + 1) || (m.sp >= 2 && m.o > co) ? s('hid_m') : tx(m.t))}${m.id === cur ? C.I.check : ''}</button></li>`).join('')}`).join('')}</ul></div>`;
  box.hidden = false;
}

async function onClick(e) {
  const b = e.target.closest('[data-s]'); if (!b || !layer.contains(b)) return;
  const a = b.dataset.s, id = b.dataset.id;
  switch (a) {
    case 'close': closeSaves(); break;
    case 'share': C.share?.(); break;
    case 'pick': openPick(); break;
    case 'unpick': layer.querySelector('#sv-pick').hidden = true; break;
    case 'setm': C.haptic?.(); setProgress(C.game, id); layer.querySelector('#sv-pick').hidden = true; rerender(); C.event?.('saves_progress', { m: id }); break;
    case 'done': { C.haptic?.(); const on = toggleDone(C.game, id); rerender(); C.event?.('saves_done', { id, on }); break; }
    case 'spoil': open1.add(id); rerender(); break;
    case 'how': {
      const h = D.d.save[plat()];
      C.openHow?.({ id: `saves-${plat()}`, game: C.game, k: 'reference', t: h.ta, sn: [], how: { ta: h.ta, rw: h.rw, min: h.min, st: h.st } });
      C.event?.('saves_how', { p: plat() });
      break;
    }
    case 'nx': C.event?.('saves_next', { v: b.dataset.v }); C.next?.(b.dataset.v); break;
    case 'report': C.toast?.(s('report_ok')); C.event?.('saves_report', {}); break;
  }
}

export async function openSaves(ctx) {
  C = ctx; css();
  D = await load(ctx.game); if (!D) return false;
  layer = document.getElementById('saves');
  if (!layer) {
    layer = document.createElement('div'); layer.id = 'saves'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    document.body.appendChild(layer); layer.addEventListener('click', onClick);
  }
  render();
  requestAnimationFrame(() => layer.classList.add('open'));
  document.documentElement.classList.add('guide-open');
  history.pushState({ saves: 1 }, '');
  C.event?.('saves_open', { from: ctx.from || '' });
  return true;
}
export function closeSaves(fromPop = false) {
  if (!layer?.classList.contains('open')) return false;
  layer.classList.remove('open'); document.documentElement.classList.remove('guide-open');
  C?.onClose?.();
  if (!fromPop && history.state?.saves) history.back();
  return true;
}
export const isOpen = () => !!layer?.classList.contains('open');
addEventListener('popstate', () => { if (isOpen() && !document.getElementById('guide')?.classList.contains('open')) closeSaves(true); });
