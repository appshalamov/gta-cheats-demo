// Раздел «Гид по игре» на Главной и экран-оглавление (26.11.2026, «Решение Fable — система гида», разделы 1 и 4).
// Главная: одна строка состояния (до двух) из guide-core.stateLine → тап открывает нужное. Оглавление — шторка «Гид по игре»:
// «Где вы» (позиция, «Изменить»), «Прохождение», «Не упустить навсегда», «Концовки», «По шагам» (пасхалки, баги, начатые), «Настроить игру», «Дальше».
// Строки показываются, только если у игры есть записи этого вида в указателе (функции других веток появляются после слияния).
import * as core from './guide-core.js';

const S = {
  ru: { title: 'Гид по игре', all: 'Весь гид', where: 'Где вы', change: 'Изменить', none: 'Отметьте, где вы в игре', walk: 'Прохождение', saves: 'Не упустить навсегда',
    endings: 'Концовки', steps: 'По шагам: пасхалки и баги', settings: 'Настроить игру', next: 'Дальше', codes: 'Коды', map: 'Карта', cont: 'шаг {a} из {b}',
    n_tips: 'совет|совета|советов', n_steps: 'шаг|шага|шагов', after: 'После «{m}»', ch: 'Глава {n}', stale: 'Всё ещё здесь?', yes: 'Да' },
  en: { title: 'Game guide', all: 'Full guide', where: 'Where you are', change: 'Change', none: 'Mark where you are in the game', walk: 'Walkthrough', saves: 'Don’t miss it forever',
    endings: 'Endings', steps: 'Step by step: easter eggs and bugs', settings: 'Set up the game', next: 'Next', codes: 'Cheats', map: 'Map', cont: 'step {a} of {b}',
    n_tips: 'tip|tips', n_steps: 'step|steps', after: 'After “{m}”', ch: 'Chapter {n}', stale: 'Still here?', yes: 'Yes' },
};
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const tx = (o, lg) => (o ? o[lg] || o.en || o.ru || '' : '');
function plural(lg, n, forms) {
  const f = forms.split('|');
  if (lg === 'ru') { const a = n % 10, b = n % 100; return `${n} ${f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2]}`; }
  return `${n} ${f[n === 1 ? 0 : 1]}`;
}

// Есть ли у игры гид (раздел на Главной не показываем у GTA 5 без записей)
export async function ready(game) { await Promise.all([core.loadIndex(game), core.loadBase(game)]); return (core.index(game).items || []).length > 0; }

// Строки раздела на Главной: [{k, type, text}] — тап открывает ключ через приложение (data-action="gopen")
export function homeRows(game, lang) { return core.stateLine(game, lang); }
export function homeHTML(game, lang, esc, I) {
  const T = S[lang] || S.en;
  const rows = homeRows(game, lang);
  return {
    title: T.title, more: T.all,
    body: `<div class="gh-rows">${rows.map((r) => `<button class="gh-row gh-${r.type}" data-action="gopen" data-k="${esc(r.k)}">${r.type === 'warn' ? I.alert : r.type === 'cont' ? I.play : I.pin}<span>${esc(r.text)}</span>${I.chevron}</button>`).join('')}</div>`,
  };
}

// Оглавление «Гид по игре» (шторка): секции по видам записей указателя
export function tocHTML(game, lang, esc, I, progressOf) {
  const T = S[lang] || S.en, items = core.index(game).items || [], b = core.base(game), p = core.pos(game);
  const has = (kinds) => items.some((x) => kinds.includes(x.kind));
  const here = p ? (p.m ? tx(b?.byId[p.m]?.t, lang) : fill(T.ch, { n: b?.ch.find((c) => c.id === p.c)?.n || '' })) : '';
  const row = (k, title, sub, cls = '') => `<button class="gh-toc-row${cls}" data-action="gopen" data-k="${esc(k)}"><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${I.chevron}</button>`;
  const guides = items.filter((x) => x.kind === 'egg' || x.kind === 'bug');
  const sets = items.filter((x) => x.kind === 'set');
  const warns = core.stateLine(game, lang).filter((x) => x.type === 'warn');
  return `<div class="gh-toc">
    <h2>${esc(T.title)}</h2>
    ${b ? `<div class="gh-where"><span><small>${esc(T.where)}</small><b>${esc(here ? fill(T.after, { m: here }) : T.none)}</b>${p && core.posStale(game) ? `<em>${esc(T.stale)}</em>` : ''}</span>
      <button class="gh-link" data-action="gopen" data-k="progress">${esc(T.change)}</button></div>` : ''}
    ${warns.map((w) => `<button class="gh-row gh-warn" data-action="gopen" data-k="${esc(w.k)}">${I.alert}<span>${esc(w.text)}</span>${I.chevron}</button>`).join('')}
    ${b && has(['tip', 'warn']) ? row(`walk:${game}`, T.walk, '') : ''}
    ${has(['warn', 'save']) ? row(`saves:${game}:all`, T.saves, '') : ''}
    ${has(['ending', 'fork']) ? row(`endings:${game}`, T.endings, '') : ''}
    ${guides.length ? `<h3>${esc(T.steps)}</h3>${guides.map((g) => {
      const d = progressOf ? progressOf(g) : -1;
      const sub = d >= 0 && d < g.steps_n ? fill(T.cont, { a: d + 1, b: g.steps_n }) : tx(g.sub, lang);
      return row(g.k, tx(g.t, lang), sub);
    }).join('')}` : ''}
    ${sets.length ? row(sets[0].k, T.settings, plural(lang, sets.length, T.n_tips)) : ''}
    <h3>${esc(T.next)}</h3>
    <div class="gh-next">${row('codes', T.codes, '')}${row('map', T.map, '')}</div>
  </div>`;
}
