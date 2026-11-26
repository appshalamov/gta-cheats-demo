// «Авторам и партнёрам» → «Снимать сейчас», «Материалы» находки, «Банк исходников», «Задание агенту» (26.11.2026, ветка feature/guide-creators).
// ЧЕРНОВАЯ ДЕМКА для системного Fable: решения — «Гид по игре — пасхалки (26.11.2026)/05 Решение Fable — радар и гид.md» п. 2 и 7,
// итог — «Гид по игре — система (26.11.2026)/Итог для Fable — креаторы.md». В прод не выкладывать (монетизация — только ветка).
// Данные — пример на находках радара 26.11 (очередь community_watch.py); сервера каталога нет. Экраны живут в слое раздела креаторов
// (js/league.js): league.js отдаёт сюда свои помощники через setup(), сам этот модуль league.js не импортирует.
import { I } from './icons.js';
import { getLang } from './i18n.js';
import { REWARDS } from './config.js';   // одна таблица ставок (решение Fable «система гида» §7)

let H = null;   // помощники league.js: head, body, row, tag, push, pop, close, ctx(), P(), isPartner(), isMinor(), link(), esc
export function setup(h) { H = h; }

const ru = () => getLang() !== 'en';
const T = {
  ru: {
    now_h: 'Снимать сейчас', now_sub: '{n} находки ждут первых роликов', now_p: 'Подтверждённые находки, по которым роликов ещё мало. Кто снимет первым, соберёт поиск.',
    t_now: 'Снимать', t_conf: 'Подтверждено', t_out: 'Вышло',
    st_now: 'Снимать сейчас', st_conf: 'Подтверждено', st_guide: 'Есть инструкция', st_first: 'Статей ещё нет: можно первым', st_late: 'Уже есть статьи: снимайте свой ракурс',
    meta: 'Нашли {d}, источников {s}, роликов около {v}', score: 'Оценка радара {n} из 100',
    home_row: 'Снимать сейчас: {n}', home_sub: 'Свежие находки, роликов почти нет',
    first_by: 'Первым показал: {who}, {where}, {d}', first_none: 'Кто нашёл первым, не установлено. Первый разбор: {who}, {d}',
    plan_h: 'План ролика', plan_hook: 'Начало', plan_show: 'Показать', plan_titles: 'Названия',
    mat_h: 'Материалы', mat_p: 'Игровые записи — ссылкой у автора. Скачать можно только то, что автор разрешил.',
    k_game: 'Запись игры', k_life: 'Съёмка в жизни', k_ours: 'Наше',
    p_yes: 'Автор разрешил нарезки с указанием канала', p_asked: 'Разрешение запрошено', p_no: 'Разрешения нет: только смотреть', p_auto: 'Нашёл автопоиск, разрешение не запрошено', p_own: 'Наш материал, можно всё',
    watch: 'Смотреть с {t}', dl_author: 'Скачать у автора', dl: 'Скачать',
    agent_btn: 'Задание агенту', my_link: 'Ссылка на находку с вашим кодом', add_src: 'Добавить исходник', bank_btn: 'Банк исходников',
    life_need: 'Нет съёмки места в жизни. Снимите набор (горизонталь и вертикаль, от 30 секунд): {s}', life_need_np: 'Нет съёмки места в жизни. За принятый набор — 7 дней Pro',
    first_fee: 'Нашли сами и статей нет? Отправьте находку: {s} и строка первооткрывателя',
    pre: 'Предварительно: деньги начнём платить после серверной проверки',
    next_h: 'Дальше', nx_guide: 'По шагам: {t}', nx_map: 'Показать место на карте', nx_next: 'Следующая находка: {t}', nx_bank: 'Банк исходников', nx_bank_d: 'Чистые записи, съёмка в жизни, схемы',
    nx_link: 'Моя ссылка и код', nx_link_d: 'Кто пришёл по вашим роликам', nx_tasks: 'Задания недели', nx_now_d: '{n} находки ждут первых роликов',
    bank_h: 'Банк исходников', bank_p: 'Записи без интерфейса и голоса, съёмка мест в жизни и наши схемы. Для нарезок по находкам.',
    b_game: 'Игра', b_life: 'Жизнь', b_ours: 'Схемы',
    auto_h: 'Автопоиск нашёл {n} записи', auto_p: 'Длинные прохождения без голоса. Мы спросим авторов, можно ли нарезать.',
    for_find: 'К находке: {t}',
    add_h: 'Добавить исходник', add_p: 'Свою запись игры — ссылкой (YouTube, Twitch, Drive). Съёмку места в жизни — файлом.',
    add_kind: 'Что это', add_url: 'Ссылка на запись', add_url_ph: 'https://youtube.com/watch?v=…', add_at: 'С какой секунды находка', add_at_ph: '12:40',
    add_file: 'Выбрать видео', add_file_p: 'Горизонталь и вертикаль, от 30 секунд, без людей крупно и без частных домов',
    add_mine: 'Это моя запись. Разрешаю нарезки с указанием канала', add_send: 'Отправить на проверку', add_ok: 'Отправлено. Проверим за сутки',
    add_rules: 'Чужие записи не принимаем. Ссылка видна другим после проверки.',
    ag_h: 'Задание агенту', ag_p: 'Скопируйте и вставьте в Claude Code с навыком нарезки. Видео режется на вашем компьютере, к нам не уходит.',
    ag_copy: 'Скопировать задание', ag_how: 'Как запустить', ag_1: 'Один раз поставьте навык: /plugin install sb-clipper', ag_2: 'Скачайте исходник у автора или возьмите свою запись', ag_3: 'Вставьте задание. Агент сделает 3 ролика 9:16 с субтитрами, схемой и концовкой со ссылкой',
    ag_out: 'Что получится', ag_out_p: '3 вертикальных ролика по 20–45 секунд, субтитры RU и EN, наша схема в нужном шаге, последний кадр с вашей ссылкой и QR',
    sn_h: 'Что дальше', sn_what: 'Что будет с исходником', sn_rev: 'Проверим за сутки: ваша ли запись, есть ли находка на указанной секунде, нет ли людей крупно и частных домов',
    sn_bank: 'После проверки исходник появится в банке и в «Материалах» находки с именем вашего канала', sn_credit: 'Ваш канал будет подписан у находки и в «Источниках» инструкции, зрители смотрят запись во встроенном плеере',
    sn_pay: 'Съёмка места засчитается: {s} в «Заработке»', sn_pro: 'Съёмка места засчитается: 7 дней Pro', sn_mine: 'Мои вклады', sn_mine_d: 'Статус проверки и что принято',
    copied: 'Скопировано', demo: 'Пример интерфейса на находках радара 26 ноября', soon: 'В демке не работает',
  },
  en: {
    now_h: 'Film now', now_sub: '{n} finds waiting for first videos', now_p: 'Confirmed finds with few videos so far. Whoever films first gets the search traffic.',
    t_now: 'Film', t_conf: 'Confirmed', t_out: 'Covered',
    st_now: 'Film now', st_conf: 'Confirmed', st_guide: 'Guide ready', st_first: 'No articles yet: you can be first', st_late: 'Articles are out: film your own angle',
    meta: 'Found {d}, {s} sources, about {v} videos', score: 'Radar score {n} of 100',
    home_row: 'Film now: {n}', home_sub: 'Fresh finds, almost no videos yet',
    first_by: 'First shown by {who}, {where}, {d}', first_none: 'Who found it first is unknown. First breakdown: {who}, {d}',
    plan_h: 'Video plan', plan_hook: 'Open with', plan_show: 'Show', plan_titles: 'Titles',
    mat_h: 'Materials', mat_p: 'Gameplay recordings stay with their authors as links. You can download only what the author allowed.',
    k_game: 'Gameplay', k_life: 'Real-life footage', k_ours: 'Ours',
    p_yes: 'Author allows clips with channel credit', p_asked: 'Permission requested', p_no: 'No permission: watch only', p_auto: 'Found by auto search, not asked yet', p_own: 'Our material, free to use',
    watch: 'Watch from {t}', dl_author: 'Download from author', dl: 'Download',
    agent_btn: 'Task for the agent', my_link: 'Link to this find with your code', add_src: 'Add a source', bank_btn: 'Source bank',
    life_need: 'No real-life footage of the place. Film a set (landscape and vertical, 30+ seconds): {s}', life_need_np: 'No real-life footage of the place. An accepted set earns 7 days of Pro',
    first_fee: 'Found it yourself and there are no articles? Send the find: {s} and a discoverer credit',
    pre: 'Preliminary: payouts start once server checks are live',
    next_h: 'Next', nx_guide: 'Step by step: {t}', nx_map: 'Show the place on the map', nx_next: 'Next find: {t}', nx_bank: 'Source bank', nx_bank_d: 'Clean recordings, real-life footage, diagrams',
    nx_link: 'My link and code', nx_link_d: 'Who came from your videos', nx_tasks: 'Tasks of the week', nx_now_d: '{n} finds waiting for first videos',
    bank_h: 'Source bank', bank_p: 'Recordings without HUD or voice, real-life footage of places and our diagrams. For clips about finds.',
    b_game: 'Game', b_life: 'Real life', b_ours: 'Diagrams',
    auto_h: 'Auto search found {n} recordings', auto_p: 'Long walkthroughs without voice. We will ask the authors if clips are OK.',
    for_find: 'For: {t}',
    add_h: 'Add a source', add_p: 'Your gameplay recording as a link (YouTube, Twitch, Drive). Real-life footage of a place as a file.',
    add_kind: 'What is it', add_url: 'Link to the recording', add_url_ph: 'https://youtube.com/watch?v=…', add_at: 'Second where the find starts', add_at_ph: '12:40',
    add_file: 'Choose a video', add_file_p: 'Landscape and vertical, 30+ seconds, no close-up people or private homes',
    add_mine: 'This is my recording. I allow clips with channel credit', add_send: 'Send for review', add_ok: 'Sent. We review within a day',
    add_rules: 'We do not accept other people’s recordings. Links become visible after review.',
    ag_h: 'Task for the agent', ag_p: 'Copy and paste into Claude Code with the clipping skill. The video is cut on your computer and never sent to us.',
    ag_copy: 'Copy the task', ag_how: 'How to run it', ag_1: 'Install the skill once: /plugin install sb-clipper', ag_2: 'Download the source from the author or use your own recording', ag_3: 'Paste the task. The agent makes 3 vertical 9:16 videos with captions, our diagram and an end card with your link',
    ag_out: 'What you get', ag_out_p: '3 vertical videos of 20–45 seconds, RU and EN captions, our diagram at the right step, a last frame with your link and QR',
    sn_h: 'What’s next', sn_what: 'What happens to your source', sn_rev: 'We check it within a day: that it is your recording, the find is at the given second, no close-up people or private homes',
    sn_bank: 'Once approved, it appears in the bank and in the find’s Materials with your channel name', sn_credit: 'Your channel is credited on the find and in the guide’s Sources; viewers watch it in the built-in player',
    sn_pay: 'The footage counts: {s} in Earnings', sn_pro: 'The footage counts: 7 days of Pro', sn_mine: 'My contributions', sn_mine_d: 'Review status and what was accepted',
    copied: 'Copied', demo: 'Interface example on radar finds from November 26', soon: 'Not available in the demo',
  },
};
const tx = (k, v = {}) => String((ru() ? T.ru : T.en)[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
const L2 = (o) => (o && typeof o === 'object' ? (ru() ? o.ru : o.en) || o.en || o.ru : o || '');
const dd = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString(ru() ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });

// ── данные-пример (радар 26.11; ступени — 05 п. 1). sources: kind game|life|ours, perm yes|asked|no|auto|own ──
const FINDS = [
  { id: 'vc-portal', stage: 'now', score: 78, first: false, d: '2026-11-25', srcN: 8, vids: 6, ico: 'sparkle',
    t: { ru: 'Портал в Vice City 2002 года', en: 'Portal to 2002 Vice City' },
    where: { ru: 'Ocean Beach, ночью в грозу', en: 'Ocean Beach, at night in a storm' },
    who: { by: '80 Level', d: '2026-11-24' },
    plan: { hook: { ru: 'Кадр: молния бьёт в тот же фонарь, картинка становится как в 2002', en: 'Lightning hits the same streetlight and the image turns 2002' },
      show: { ru: ['Где встать и во сколько', 'Какая погода нужна', 'Что меняется после портала'], en: ['Where to stand and when', 'What weather you need', 'What changes after the portal'] },
      titles: { ru: ['В GTA 6 есть портал в 2002 год', 'Rockstar спрятали старый Vice City', 'Как попасть в Vice City 2002 в GTA 6'], en: ['GTA 6 has a portal to 2002', 'Rockstar hid the old Vice City', 'How to reach 2002 Vice City in GTA 6'] } },
    src: [{ kind: 'game', who: 'GTA Series Videos', len: '1:02:14', q: '4K 60', clean: true, at: '41:20', perm: 'auto' },
      { kind: 'ours', who: 'Secret Base', len: { ru: 'Схема места', en: 'Place diagram' }, perm: 'own' }], life: false },
  { id: 'ghost-ship', stage: 'now', score: 71, first: true, d: '2026-11-25', srcN: 4, vids: 3, ico: 'egg',
    t: { ru: 'Корабль-призрак у Keys', en: 'The ghost ship off the Keys' },
    where: { ru: 'Залив у Mile Zero, после 3 ночи', en: 'Bay near Mile Zero, after 3 a.m.' },
    who: { by: 'u/drift_keys', where: 'Reddit', d: '2026-11-25' },
    plan: { hook: { ru: 'Туман, на горизонте огни корабля, которого нет на карте', en: 'Fog, lights of a ship that is not on the map' },
      show: { ru: ['Время и точка, откуда видно', 'Как подплыть, не потеряв корабль', 'Что внутри'], en: ['Time and spot to see it', 'How to reach it without losing it', 'What is inside'] },
      titles: { ru: ['В GTA 6 плавает корабль-призрак', 'Этот корабль появляется только ночью', 'Нашёл корабль, которого нет на карте GTA 6'], en: ['There is a ghost ship in GTA 6', 'This ship only shows up at night', 'I found a ship that is not on the GTA 6 map'] } },
    src: [{ kind: 'game', who: 'drift_keys', len: '0:48', q: '1080p 30', clean: false, at: '0:12', perm: 'asked' }], life: false },
  { id: 'arthur', stage: 'now', score: 64, first: false, d: '2026-11-21', srcN: 3, vids: 9, ico: 'egg',
    t: { ru: 'Костюм Артура Моргана', en: 'Arthur Morgan’s outfit' },
    where: { ru: 'Магазин одежды в Port Gellhorn', en: 'Clothing store in Port Gellhorn' },
    who: { by: 'Ahirex', d: '2026-11-21' },
    plan: { hook: { ru: 'Лусия выходит из примерочной в шляпе Артура', en: 'Lucia walks out of the fitting room in Arthur’s hat' },
      show: { ru: ['Что открыть до этого', 'Где магазин', 'Весь комплект на персонаже'], en: ['What to unlock first', 'Where the store is', 'The full set on the character'] },
      titles: { ru: ['Костюм Артура Моргана в GTA 6', 'RDR2 спрятали в GTA 6', 'Как одеть Лусию как Артура'], en: ['Arthur Morgan outfit in GTA 6', 'RDR2 is hidden in GTA 6', 'How to dress Lucia like Arthur'] } },
    src: [{ kind: 'game', who: 'Ahirex', len: '8:31', q: '4K 30', clean: false, at: '2:05', perm: 'no' }], life: true },
  { id: 'mario', stage: 'conf', score: 55, first: false, d: '2026-11-24', srcN: 4, vids: 14, ico: 'egg',
    t: { ru: 'Шапки Марио и Луиджи', en: 'Mario and Luigi hats' },
    where: { ru: 'Сантехническая лавка в Little Havana', en: 'Plumbing shop in Little Havana' },
    who: { by: 'Eurogamer', d: '2026-11-25' },
    plan: { hook: { ru: 'Две шапки на прилавке, рядом зелёная труба', en: 'Two caps on the counter next to a green pipe' },
      show: { ru: ['Где лавка', 'Как надеть обе', 'Пасхалка с трубой'], en: ['Where the shop is', 'How to wear both', 'The pipe easter egg'] },
      titles: { ru: ['Марио в GTA 6', 'Nintendo в GTA 6? Шапки Марио и Луиджи', 'Где взять шапку Марио в GTA 6'], en: ['Mario in GTA 6', 'Nintendo in GTA 6? Mario and Luigi hats', 'Where to get the Mario hat in GTA 6'] } },
    src: [{ kind: 'game', who: 'Joe Iz Gaming', len: '1:24:50', q: '4K 60', clean: true, at: '1:02:10', perm: 'yes' }], life: true },
  { id: 'bugatti', stage: 'guide', score: 82, first: false, d: '2026-11-23', srcN: 8, vids: 40, ico: 'guide', guide: 'guide:gta6:egg-bugatti-thrax-andrew-node', map: 'egg:gta6:egg-bugatti-thrax-andrew-node',
    img: 'img/map/gta6/t/egg-bugatti-thrax-andrew-node_real.jpg',
    t: { ru: 'Bugatti без трекера через баг', en: 'Trackerless Bugatti via a glitch' },
    where: { ru: 'Starfish Island, гараж Эндрю Нода', en: 'Starfish Island, Andrew Node’s garage' },
    who: { by: 'JFM', d: '2026-11-23' },
    plan: { hook: { ru: 'Машина за $3 млн уезжает из закрытого гаража без погони', en: 'A $3M car leaves a locked garage with no chase' },
      show: { ru: ['Как заехать тихо', 'Баг с дверью по шагам', 'Настройки, чтобы её не разбить'], en: ['Getting in quietly', 'The door glitch step by step', 'Settings so you don’t wreck it'] },
      titles: { ru: ['Bugatti в GTA 6 бесплатно', 'Угнал Bugatti за 10 минут', 'Баг, который Rockstar ещё не закрыли'], en: ['Free Bugatti in GTA 6', 'I stole a Bugatti in 10 minutes', 'The glitch Rockstar hasn’t patched yet'] } },
    src: [{ kind: 'game', who: 'MrDalekJD', len: '41:20', q: '4K 60', clean: true, at: '18:44', perm: 'asked' },
      { kind: 'game', who: 'JFM', len: '12:05', q: '1080p 60', clean: false, at: '3:10', perm: 'no' },
      { kind: 'life', who: 'Secret Base', len: '0:42', q: '4K 30', perm: 'own', place: { ru: 'Star Island, Майами', en: 'Star Island, Miami' } },
      { kind: 'ours', who: 'Secret Base', len: { ru: 'Схема двора и плакат «Через баг»', en: 'Yard diagram and “Via glitch” poster' }, perm: 'own' }], life: true },
];
const AUTO = 2;   // записей нашёл автопоиск (пример)
const byId = (id) => FINDS.find((f) => f.id === id);
const nowList = () => FINDS.filter((f) => f.stage === 'now');

const esc = (s) => H.esc(s);
const permTag = (p) => H.tag({ yes: 'ok', own: 'ok', asked: 'wait', auto: 'wait', no: 'no' }[p] || '', tx('p_' + p));
const tile = (f) => (f.img ? `<span class="cn-th"><img src="${f.img}" alt="" loading="lazy" decoding="async"></span>` : `<span class="cn-th cn-ic">${I[f.ico] || I.egg}</span>`);
const stageTag = (f) => H.tag(f.stage === 'now' ? 'wait' : 'ok', tx(f.stage === 'now' ? 'st_now' : f.stage === 'guide' ? 'st_guide' : 'st_conf'));
const findCard = (f) => `<button class="cn-card" data-cr="cn-find" data-v="${f.id}">${tile(f)}<span class="cn-m"><b>${esc(L2(f.t))}</b>
  ${stageTag(f)}<small>${esc(f.first ? tx('st_first') : tx('st_late'))}</small><small>${esc(tx('meta', { d: dd(f.d), s: f.srcN, v: f.vids }))}</small>
  <span class="cn-score"><i style="width:${f.score}%"></i></span></span>${I.chevron}</button>`;
const nextBlock = (rows) => `<h2 class="cr-h">${esc(tx('next_h'))}</h2><div class="group">${rows.slice(0, 3).join('')}</div>`;
const demoLine = () => `<p class="cn-demo">${esc(tx('demo'))}</p>`;
const money = () => !H.isMinor();
const usd = (c) => `$${c % 100 ? (c / 100).toFixed(2) : c / 100}`;
/** Раздел авторов в демке виден только под ?sbmock=partner (решение Fable «система гида», guide-creators): в выпуски 1–2 не идёт */
export const on = () => /[?&]sbmock=partner\b/.test(location.search);

// ── «Снимать сейчас» ──
async function nowHTML(a) {
  const tab = a.tab || 'now';
  const list = FINDS.filter((f) => (tab === 'now' ? f.stage === 'now' : tab === 'conf' ? f.stage === 'conf' : f.stage === 'guide'));
  const seg = `<div class="cr-seg" role="tablist">${[['now', 't_now'], ['conf', 't_conf'], ['out', 't_out']].map(([k, l]) => `<button role="tab" data-cr="cn-tab" data-v="${k}" aria-selected="${k === tab}">${esc(tx(l))}<em>${FINDS.filter((f) => (k === 'now' ? f.stage === 'now' : k === 'conf' ? f.stage === 'conf' : f.stage === 'guide')).length}</em></button>`).join('')}</div>`;
  const nx = nextBlock([H.row('cn-bank', 'video', tx('nx_bank'), tx('nx_bank_d')), H.row('open:mylink', 'link', tx('nx_link'), tx('nx_link_d')), H.row('open:board', 'star', tx('nx_tasks'))]);
  return `${H.head(tx('now_h'))}${H.body(`<p class="cr-p">${esc(tx('now_p'))}</p>${seg}<div class="cn-list">${list.map(findCard).join('')}</div>${nx}${demoLine()}`)}`;
}

// ── находка: план ролика, материалы, ссылка, задание агенту ──
function srcRow(s, f) {
  const len = L2(s.len), q = s.q ? `${s.q}${s.clean ? (ru() ? ', без интерфейса и голоса' : ', no HUD or voice') : ''}` : '';
  const what = s.kind === 'life' ? `${tx('k_life')}: ${L2(s.place)}` : s.kind === 'ours' ? `${tx('k_ours')}: ${len}` : `${tx('k_game')}: ${s.who}`;
  const sub = [s.kind === 'game' ? len : s.kind === 'life' ? `${len}, ${s.q}` : '', s.kind === 'game' ? q : ''].filter(Boolean).join(', ');
  const btn = s.kind === 'game'
    ? `<span class="cn-acts"><button class="cr-mini" data-cr="cn-watch">${I.play}${esc(tx('watch', { t: s.at }))}</button>${s.perm === 'yes' ? `<button class="cr-mini" data-cr="cn-soon">${I.link}${esc(tx('dl_author'))}</button>` : ''}</span>`
    : `<span class="cn-acts"><button class="cr-mini" data-cr="cn-soon">${I.copy}${esc(tx('dl'))}</button></span>`;
  return `<div class="cn-src"><b>${esc(what)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${permTag(s.perm)}${btn}</div>`;
}
async function findHTML(a) {
  const f = byId(a.id) || FINDS[0], P = H.P(), i = FINDS.indexOf(f), nx = FINDS[(i + 1) % FINDS.length];
  const first = f.who.where ? tx('first_by', { who: f.who.by, where: f.who.where, d: dd(f.who.d) }) : tx('first_none', { who: f.who.by, d: dd(f.who.d) });
  const lnk = P?.ref_code ? `${H.link(P.ref_code)}&open=${f.guide || 'find:gta6:' + f.id}` : '';
  const plan = `<h2 class="cr-h">${esc(tx('plan_h'))}</h2><div class="cn-plan">
    <div><span>${esc(tx('plan_hook'))}</span><p>${esc(L2(f.plan.hook))}</p></div>
    <div><span>${esc(tx('plan_show'))}</span><ol>${L2(f.plan.show).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div><span>${esc(tx('plan_titles'))}</span><ol>${L2(f.plan.titles).map((x) => `<li>${esc(x)}<button class="cn-cp" data-cr="copy" data-v="${esc(x)}" aria-label="copy">${I.copy}</button></li>`).join('')}</ol></div></div>`;
  const reward = !f.life ? `<div class="cn-reward">${I.camera}<span><b>${esc(money() ? tx('life_need', { s: usd(REWARDS.creator.life_set) }) : tx('life_need_np'))}</b>${money() ? `<small>${esc(tx('pre'))}</small>` : ''}</span></div>` : '';
  const mats = `<h2 class="cr-h">${esc(tx('mat_h'))}</h2><p class="cr-p">${esc(tx('mat_p'))}</p><div class="cn-srcs">${f.src.map((s) => srcRow(s, f)).join('')}</div>${reward}
    <button class="btn-ghost" data-cr="cn-add" data-v="${f.id}">${I.plus}${esc(tx('add_src'))}</button>`;
  const rows = [];
  if (f.guide) rows.push(H.row('cn-guide', 'doc', tx('nx_guide', { t: L2(f.t) }), '', `data-v="${f.guide}"`));
  if (f.map) rows.push(H.row('cn-map', 'map', tx('nx_map'), '', `data-v="${f.map}"`));
  rows.push(H.row('cn-find', 'video', tx('nx_next', { t: L2(nx.t) }), '', `data-v="${nx.id}" data-replace="1"`));
  rows.push(H.row('cn-bank', 'video', tx('nx_bank'), tx('nx_bank_d')));
  return `${H.head(L2(f.t))}${H.body(`<div class="cn-top">${tile(f)}<span>${stageTag(f)}<small>${esc(L2(f.where))}</small><small>${esc(tx('score', { n: f.score }))}</small></span></div>
    <p class="cn-first">${esc(first)}</p>
    <button class="btn-primary" data-cr="cn-agent" data-v="${f.id}">${I.sparkle}${esc(tx('agent_btn'))}</button>
    ${lnk ? `<div class="cr-field"><span>${esc(tx('my_link'))}</span><b>${esc(lnk)}</b><button class="cr-mini" data-cr="copy" data-v="https://${esc(lnk)}">${I.copy}${esc(ru() ? 'Копировать' : 'Copy')}</button></div>` : ''}
    ${plan}${mats}${nextBlock(rows)}${demoLine()}`)}`;
}

// ── банк исходников ──
async function bankHTML(a) {
  const tab = a.tab || 'game', kind = tab === 'ours' ? 'ours' : tab;
  const items = FINDS.flatMap((f) => f.src.filter((s) => s.kind === kind).map((s) => ({ s, f })));
  const seg = `<div class="cr-seg" role="tablist">${[['game', 'b_game'], ['life', 'b_life'], ['ours', 'b_ours']].map(([k, l]) => `<button role="tab" data-cr="cn-btab" data-v="${k}" aria-selected="${k === tab}">${esc(tx(l))}</button>`).join('')}</div>`;
  const auto = tab === 'game' ? `<div class="cn-reward">${I.search}<span><b>${esc(tx('auto_h', { n: AUTO }))}</b><small>${esc(tx('auto_p'))}</small></span></div>` : '';
  const list = items.map(({ s, f }) => `<div class="cn-bk">${srcRow(s, f)}<button class="cn-for" data-cr="cn-find" data-v="${f.id}">${esc(tx('for_find', { t: L2(f.t) }))}${I.chevron}</button></div>`).join('');
  const nx = nextBlock([H.row('cn-now', 'video', tx('now_h'), tx('nx_now_d', { n: nowList().length })), H.row('open:mylink', 'link', tx('nx_link'), tx('nx_link_d'))]);
  return `${H.head(tx('bank_h'))}${H.body(`<p class="cr-p">${esc(tx('bank_p'))}</p>${seg}${auto}<div class="cn-srcs">${list}</div>
    <button class="btn-ghost" data-cr="cn-add">${I.plus}${esc(tx('add_src'))}</button>${money() ? `<p class="cn-note">${esc(tx('first_fee', { s: usd(REWARDS.creator.first_find) }))}. ${esc(tx('pre'))}</p>` : ''}${nx}${demoLine()}`)}`;
}

// ── добавить исходник ──
async function addHTML(a) {
  const k = a.kind || 'game';
  const seg = `<div class="cr-seg" role="tablist">${[['game', 'k_game'], ['life', 'k_life']].map(([x, l]) => `<button role="tab" data-cr="cn-akind" data-v="${x}" aria-selected="${x === k}">${esc(tx(l))}</button>`).join('')}</div>`;
  const f = a.find ? byId(a.find) : null;
  const fields = k === 'game'
    ? `<label class="cn-in"><span>${esc(tx('add_url'))}</span><input type="url" inputmode="url" placeholder="${esc(tx('add_url_ph'))}"></label>
       <label class="cn-in"><span>${esc(tx('add_at'))}</span><input inputmode="numeric" placeholder="${esc(tx('add_at_ph'))}"></label>
       <label class="cn-chk"><input type="checkbox" checked><span>${esc(tx('add_mine'))}</span></label>`
    : `<button class="btn-ghost" data-cr="cn-soon">${I.camera}${esc(tx('add_file'))}</button><p class="cn-note">${esc(tx('add_file_p'))}</p>
       ${money() ? `<p class="cn-note">${esc(tx('life_need', { s: usd(REWARDS.creator.life_set) }))}. ${esc(tx('pre'))}</p>` : ''}`;
  return `${H.head(tx('add_h'))}${H.body(`${f ? `<p class="cn-first">${esc(tx('for_find', { t: L2(f.t) }))}</p>` : ''}<p class="cr-p">${esc(tx('add_p'))}</p>${seg}${fields}
    <button class="btn-primary" data-cr="cn-send">${I.send}${esc(tx('add_send'))}</button><p class="cn-note">${esc(tx('add_rules'))}</p>`)}`;
}

// ── задание агенту (формат — «Креаторы — ресёрч/11 Готовое — агент-нарезчик.md») ──
function taskText(f) {
  const P = H.P(), s = f.src.find((x) => x.kind === 'game') || {};
  return JSON.stringify({ find_id: `gta6:${f.id}`, title: { ru: f.t.ru, en: f.t.en },
    source: { author: s.who, at: s.at, quality: s.q, permission: s.perm }, highlight: s.at,
    steps: f.plan.show.en, schema: f.src.some((x) => x.kind === 'ours') ? `https://sbgta.app/media/schemes/${f.id}.svg` : null,
    formats: ['9:16'], count: 3, subtitles: ['ru', 'en'], hook: f.plan.hook.en, titles: f.plan.titles.en,
    outro: { text: 'Secret Base', ref_url: P?.ref_code ? `https://${H.link(P.ref_code)}&open=${f.guide || 'find:gta6:' + f.id}` : 'https://sbgta.app', qr: true } }, null, 2);
}
async function agentHTML(a) {
  const f = byId(a.id) || FINDS[0], txt = taskText(f);
  return `${H.head(tx('ag_h'))}${H.body(`<p class="cr-p">${esc(tx('ag_p'))}</p><pre class="cn-pre">${esc(txt)}</pre>
    <button class="btn-primary" data-cr="copy" data-v="${esc(txt)}">${I.copy}${esc(tx('ag_copy'))}</button>
    <h2 class="cr-h">${esc(tx('ag_how'))}</h2><ol class="cn-steps">${['ag_1', 'ag_2', 'ag_3'].map((k, i) => `<li><span>${i + 1}</span>${esc(tx(k))}</li>`).join('')}</ol>
    <h2 class="cr-h">${esc(tx('ag_out'))}</h2><p class="cr-p">${esc(tx('ag_out_p'))}</p>
    ${nextBlock([H.row('cn-bank', 'video', tx('nx_bank'), tx('nx_bank_d')), H.row('cn-now', 'video', tx('now_h'), tx('nx_now_d', { n: nowList().length }))])}${demoLine()}`)}`;
}

// ── «Что дальше» после отправки исходника (решение Fable «система гида», guide-creators) ──
async function sentHTML(a) {
  const f = a.find ? byId(a.find) : null, life = a.kind === 'life';
  const st = life ? ['sn_rev', 'sn_bank', money() ? 'sn_pay' : 'sn_pro'] : ['sn_rev', 'sn_bank', 'sn_credit'];
  const rows = [];
  if (f) rows.push(H.row('cn-agent', 'sparkle', tx('agent_btn'), L2(f.t), `data-v="${f.id}"`));
  rows.push(H.row('cn-now', 'video', tx('now_h'), tx('nx_now_d', { n: nowList().length })));
  rows.push(H.row('open:contribs', 'doc', tx('sn_mine'), tx('sn_mine_d')));
  return `${H.head(tx('sn_h'))}${H.body(`<div class="cn-sent">${I.check}<b>${esc(tx('add_ok'))}</b>${f ? `<small>${esc(tx('for_find', { t: L2(f.t) }))}</small>` : ''}</div>
    <h2 class="cr-h">${esc(tx('sn_what'))}</h2><ol class="cn-steps">${st.map((k, i) => `<li><span>${i + 1}</span>${esc(tx(k, { s: usd(REWARDS.creator.life_set) }))}</li>`).join('')}</ol>
    ${life && money() ? `<p class="cn-note">${esc(tx('pre'))}</p>` : ''}${nextBlock(rows)}${demoLine()}`)}`;
}

export const SCREENS = {
  cn_sent: { html: sentHTML },
  cn_now: { html: nowHTML }, cn_find: { html: findHTML }, cn_bank: { html: bankHTML }, cn_add: { html: addHTML }, cn_agent: { html: agentHTML },
};

/** Строка раздела «Авторам и партнёрам» (хаб) */
export const hubRow = () => !on() ? '' : H.row('cn-now', 'video', tx('now_h'), tx('now_sub', { n: nowList().length }), `data-badge="${nowList().length}"`) + H.row('cn-bank', 'doc', tx('bank_btn'), tx('nx_bank_d'));
/** Строка на Главной у автора с рефкодом (05 п. 2): «Снимать сейчас: N» */
export const homeHTML = () => `<button class="cn-home" data-action="cn-home"><span class="row-ic">${I.video}</span><span class="row-l">${esc(tx('home_row', { n: nowList().length }))}<small>${esc(tx('home_sub'))}</small></span><span class="row-chev">${I.chevron}</span></button>`;

/** Клики «cn-…» из league.js: true — обработано */
export async function onAction(a, el) {
  const v = el.dataset.v, top = H.top();
  switch (a) {
    case 'cn-now': H.push('cn_now', {}); return true;
    case 'cn-bank': H.push('cn_bank', {}); return true;
    case 'cn-find': H.push('cn_find', { id: v }, el.dataset.replace === '1'); return true;
    case 'cn-agent': H.push('cn_agent', { id: v }); return true;
    case 'cn-add': H.push('cn_add', { find: v || null }); return true;
    case 'cn-tab': case 'cn-btab': case 'cn-akind': if (top) { top.args[a === 'cn-akind' ? 'kind' : 'tab'] = v; await H.rerender(); } return true;
    case 'cn-send': { const t = H.top(); H.push('cn_sent', { kind: t?.args.kind || 'game', find: t?.args.find || null }, true); return true; }
    case 'cn-watch': case 'cn-soon': H.ctx().toast(tx('soon')); return true;
    case 'cn-guide': H.close(); window.SB?.openGuideKey?.(v); return true;
    case 'cn-map': H.close(); H.ctx().openOnMap(v); return true;
  }
  return false;
}
