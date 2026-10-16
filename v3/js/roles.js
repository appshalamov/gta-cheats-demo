// v2: экраны ролей — креатор, автор находки, фотограф-скаут, проверяющий.
// Правки Игоря с панели 16.10.2026: хаб — дружелюбнее (приветствие, уровень, большие плитки на фото);
// проверка — лента карточек «как в Тиндере» (вправо — подходит, влево — не подходит и причина);
// заработок — дашборд с привязкой к выходу GTA 6; площадки — только TikTok, Reels, YouTube.
// Факты по решению №13 (аналитика запуска): ставки 0,12 $ / 0,05 $ за 1 000 (файл 31, 16.10), потолок 150 $, минимум 3 $, аванс на 10-й день,
// первая выплата 20.11, суммы — только рядом с медианой; проверка владения — одноразовый код SB-XXXX в описании;
// ссылка автора — домен/КОД/мир/место; кадр игры проверяется перед публикацией.
// Сервера ещё нет (ветка feature/server), поэтому всё — демо в этом браузере: отправленное креатором сразу попадает
// в очередь проверки, и цепочку можно прокликать целиком. Цифры заработка и ставок — примеры, на экранах так и подписано.
// Наружу ничего не открываем: ссылка на ролик показывается текстом (правило «не уводить из приложения»).

import { getLang } from './i18n.js';
import { LINK_DOMAIN } from './config.js';
import { I } from './icons.js';
import { loadPlaces, featured, placeKey, cityOf } from './places.js';
import { ERAS, eraOf, cityOf as eraCity, pic } from './skin.js';

const tr = (ru, en) => (getLang() === 'ru' ? ru : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'sb.v2.roles';
const R = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } })();
R.mine = R.mine || [];        // мои отправки: {id, type, title, place, link, platform, vcode, status, reason, at}
R.done = R.done || 0;         // проверено всего
R.agree = R.agree || 0;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ ...R, mine: R.mine.map(({ blobs, ...x }) => x) })); } catch { } };

let ctx = null;               // { game, toast, haptic, back }
let stack = ['hub'];
const draft = {};             // формы, пока не отправлены
const sess = { n: 0 };        // проверено за этот заход в ленту
const $ = (s, r = document) => r.querySelector(s);
const short = (o) => String(o.n || o.g || '').split(/,| \(/)[0];
const ROLE_CODE = 'MIA';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// одноразовый проверочный код для описания ролика: SB- и 4 знака без похожих (0/O, 1/I)
const oneTimeCode = () => 'SB-' + Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

// деньги и слова
const usd = (n) => (getLang() === 'ru' ? `${n.toFixed(2).replace('.', ',')}\u00a0$` : `$${n.toFixed(2)}`);   // неразрывный пробел: «$» не уезжает на новую строку
const usd0 = (n) => (getLang() === 'ru' ? `${n}\u00a0$` : `$${n}`);
const plural = (n, f) => { const a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2]; };
const ph = (p) => (p ? p.file || p.thumb || p.url || '' : '');
const dayLabel = (d) => d.toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' }).replace('.', '');

// ── демо-цифры (примеры; суммы показываем только рядом с медианой — решение №13) ──
const PER_CHECK = 0.05;                        // за одну проверку
const DAYS14 = [0.2, 0.5, 0.3, 0.9, 0, 0.6, 1.1, 0.8, 0.4, 1.4, 0.9, 1.2, 1.6, 1.0];   // последние 14 дней, последний — сегодня
const MED_DAY = 0.6;                           // медиана авторов лиги, $ в день
const TOTAL = 14.34, MED_TOTAL = 9.8;          // начислено и медиана авторов лиги за месяц
const PENDING = 9.14, PAYOUT_MIN = 3;          // ждут аванса или проверки; минимум к выплате
const MED_VIDEO = 2.4, CAP_VIDEO = 150;        // медиана и потолок за ролик
const MED_10MIN = 1.8;                         // медиана проверяющих за 10 минут
const sources = () => [
  [tr(`Доля по коду ${ROLE_CODE}`, `Share by code ${ROLE_CODE}`), 6.0],
  [tr('Просмотры, 46 000', 'Views, 46,000'), 4.14],
  [tr('Находки и пары', 'Finds and pairs'), 3.0],
  [tr('Проверки', 'Reviews'), 1.2],
];
const RELEASE = new Date(2026, 10, 19);        // GTA 6, 19 ноября 2026
const DAY = 864e5;
const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const daysTo = () => Math.round((RELEASE - today()) / DAY);

// площадки — только TikTok, Reels, YouTube (решение №13)
const PLATFORMS = [
  [/tiktok\.com/i, 'TikTok'], [/instagram\.com\/(reel|reels|p)\//i, 'Reels'], [/youtube\.com\/shorts|youtu\.be\/|youtube\.com\/watch/i, 'YouTube'],
];
const PF_NAMES = PLATFORMS.map((p) => p[1]);
const platformOf = (url) => (PLATFORMS.find(([re]) => re.test(url)) || [])[1] || '';
const pfHint = (link, pf) => (link && !pf ? tr('Не узнали площадку. Подходят TikTok, Reels и YouTube.', 'Unknown platform. TikTok, Reels and YouTube work.') : pf ? `${tr('Площадка', 'Platform')}: ${pf}` : '');

// ───────── общие куски ─────────
const head = (title, right = '') => `<header class="rl-head"><button class="rl-back" data-action="rl-back" aria-label="${tr('Назад', 'Back')}">${I.back}</button><h1>${title}</h1>${right}</header>`;
const row = (act, icon, b, s, right = `<span class="row-chev">${I.chevron}</span>`, extra = '') =>
  `<button class="row rl-row" data-action="${act}" ${extra}><span class="row-ic">${I[icon] || icon}</span><span class="rl-m"><b>${b}</b><small>${s}</small></span>${right}</button>`;
const example = () => `<p class="rl-ex">${tr('Все суммы и ставки здесь — примеры для показа. Настоящие появятся вместе с сервером.', 'All amounts and rates here are examples. Real ones come with the server.')}</p>`;
const status = (s) => ({
  review: `<i class="rl-st st-review">${tr('На проверке', 'In review')}</i>`,
  ok: `<i class="rl-st st-ok">${tr('Принято', 'Accepted')}</i>`,
  no: `<i class="rl-st st-no">${tr('Отклонено', 'Declined')}</i>`,
}[s] || '');
const prog = (p, label) => { const v = Math.round(Math.min(1, p) * 100); return `<span class="rl-prog" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}"><i style="width:${v}%"></i></span>`; };
// сравнение «в игре | в жизни» со швом: ползунок — обычный range поверх, работает пальцем и с клавиатуры
const compare = (g, r, gl = tr('В игре', 'In game'), rl = tr('В жизни', 'In real life')) => `
  <div class="rl-cmp" style="--x:50%">
    <img src="${esc(r)}" alt="">
    <img class="rl-cmp-g" src="${esc(g)}" alt="">
    <i class="rl-seam"><span>${I.compare || ''}</span></i>
    <span class="rl-tag l">${gl}</span><span class="rl-tag r">${rl}</span>
    <input type="range" min="0" max="100" value="50" aria-label="${tr('Сравнить', 'Compare')}" data-cmp>
  </div>`;
// задание лиги — карточка на фото; сумма — только рядом с медианой
const taskCard = (o, i) => `<button class="rl-task" data-action="rl-task" data-v="${esc(placeKey(o))}">
  ${ph(o.pr) || ph(o.pg) ? `<img src="${esc(ph(o.pr) || ph(o.pg))}" alt="" loading="lazy">` : ''}
  ${i === 1 ? `<i class="rl-x">${tr('×1,5 ещё 72 часа', '×1.5 for 72 more hours')}</i>` : ''}
  <span class="rl-task-t"><b>${tr('Снять', 'Film')} ${esc(short(o))}</b><small>${esc(cityOf(o))}</small><em class="tnum">${tr(`медиана ${usd(MED_VIDEO)} за ролик, потолок ${usd0(CAP_VIDEO)}`, `median ${usd(MED_VIDEO)} per video, cap ${usd0(CAP_VIDEO)}`)}</em></span></button>`;

// уровень скаута: демо — 6 принятых до этого, до 3-го уровня нужно 10
function level() {
  const okN = R.mine.filter((x) => x.status === 'ok').length;
  const need = Math.max(0, 4 - okN);
  return { need, p: need ? (6 + okN) / 10 : 1 };
}

// ───────── экраны ─────────
const SCREENS = {
  // Хаб «Для авторов»: приветствие и уровень на фото эпохи, три большие плитки, лента проверки, ссылки
  hub: async () => {
    const [q, pd] = await Promise.all([queue(), loadPlaces(ctx.game())]);
    const pairs = featured(pd, 'place', 40).filter((o) => o.pg && o.pr);
    const pairO = pairs[0], vidO = pairs[3] || pairs[1] || pairs[0];
    const egg = featured(pd, 'egg', 6).find((o) => o.pg || o.pr);
    const era = eraOf(ctx.game()) || ERAS.gta6;
    const lv = level();
    const lvTxt = lv.need
      ? tr(`Скаут, уровень 2. До уровня 3 осталось ${lv.need} ${plural(lv.need, ['принятая находка', 'принятые находки', 'принятых находок'])}`,
        `Scout, level 2. ${lv.need} more accepted ${lv.need === 1 ? 'find' : 'finds'} to level 3`)
      : tr('Скаут, уровень 3 открыт, ставка за пару выросла', 'Scout, level 3 unlocked, your pair rate went up');
    const fan = q.map((c) => c.r || c.thumb || c.photo || '').filter(Boolean).slice(0, 3);
    const inReview = R.mine.filter((x) => x.status === 'review').length;
    return `
    ${head(tr('Для авторов', 'For creators'))}
    <section class="rl-hero">
      ${pic(era.banners[1] || era.banners[0], { cls: 'rl-hero-ph', eager: true })}
      <div class="rl-hero-top">
        <h2>${tr('Привет, Миа', 'Hi, Mia')}</h2>
        <p>${lvTxt}</p>
        ${prog(lv.p, tr('Прогресс до следующего уровня', 'Progress to the next level'))}
      </div>
      <button class="rl-hero-bar" data-action="rl-go" data-v="earn">
        <span class="rl-hero-nums">
          <span><small>${tr('Сегодня', 'Today')}</small><b class="tnum">+${usd(DAYS14[13])}</b></span>
          <span><small>${tr('За месяц', 'This month')}</small><b class="tnum">${usd(TOTAL)}</b></span>
          <span class="rl-hero-go">${tr('Заработок', 'Earnings')}${I.chevron}</span>
        </span>
        <small class="rl-hero-med tnum">${tr(`Медиана у авторов лиги — ${usd(MED_TOTAL)} за месяц. Пример`, `League median is ${usd(MED_TOTAL)} a month. Example`)}</small>
      </button>
    </section>

    <div class="rl-tiles">
      <button class="rl-tile rl-tile-pair" data-action="rl-go" data-v="pair">
        ${pairO ? `<span class="rl-split"><img src="${esc(ph(pairO.pg))}" alt="" loading="lazy"><img src="${esc(ph(pairO.pr))}" alt="" loading="lazy"></span><i class="rl-split-seam"></i>` : ''}
        <span class="rl-tile-ic">${I.camera}</span>
        <span class="rl-tile-t"><b>${tr('Фото «в игре и в жизни»', 'In game and in real life')}</b><small>${tr('кадр из игры и снимок того же места', 'a game frame and a photo of the same place')}</small></span>
      </button>
      <button class="rl-tile" data-action="rl-go" data-v="video">
        ${vidO ? `<img src="${esc(ph(vidO.pr))}" alt="" loading="lazy">` : ''}
        <span class="rl-tile-ic">${I.video}</span>
        <span class="rl-tile-t"><b>${tr('Ролик', 'Video')}</b><small>${tr('о месте или коде', 'about a place or code')}</small></span>
      </button>
      <button class="rl-tile" data-action="rl-go" data-v="find">
        ${egg ? `<img src="${esc(ph(egg.pg) || ph(egg.pr))}" alt="" loading="lazy">` : ''}
        <span class="rl-tile-ic">${I.pin}</span>
        <span class="rl-tile-t"><b>${tr('Находка', 'Find')}</b><small>${tr('место или пасхалка', 'a place or easter egg')}</small></span>
      </button>
    </div>

    <button class="rl-revcard" data-action="rl-go" data-v="review">
      <span class="rl-rev-txt">
        <b>${tr('Проверка', 'Review')}</b>
        <span><em class="tnum">${q.length}</em> ${tr(plural(q.length, ['карточка ждёт', 'карточки ждут', 'карточек ждут']), q.length === 1 ? 'card waiting' : 'cards waiting')}</span>
        <small>${tr(`Медиана ${usd(MED_10MIN)} за 10 минут, ${usd(PER_CHECK)} за карточку. Пример`, `Median ${usd(MED_10MIN)} per 10 minutes, ${usd(PER_CHECK)} per card. Example`)}</small>
        <span class="rl-rev-cta">${tr('Листать', 'Start swiping')}</span>
      </span>
      <span class="rl-fan" aria-hidden="true">${fan.map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join('')}</span>
    </button>

    <div class="group rl-more">
      <div class="row rl-row"><span class="row-ic">${I.share}</span><span class="rl-m"><b>${tr('Моя ссылка', 'My link')}</b><small>${LINK_DOMAIN}/${ROLE_CODE}</small></span><button class="rl-copy" data-action="rl-copy">${tr('Скопировать', 'Copy')}</button></div>
      ${row('rl-go', 'trip', tr('Мои отправки', 'My submissions'), R.mine.length ? `${inReview} ${tr('на проверке', 'in review')}, ${R.mine.length} ${tr('всего', 'total')}` : tr('пока пусто', 'nothing yet'), undefined, 'data-v="mine"')}
      ${row('rl-go', 'star', tr('Лига креаторов', 'Creator league'), tr('задания недели и ставки', 'weekly tasks and rates'), undefined, 'data-v="league"')}
      ${row('rl-go', 'info', tr('Честные правила', 'Fair rules'), tr('доли, сроки, что нельзя', 'shares, timing, what is not allowed'), undefined, 'data-v="rules"')}
    </div>
    ${example()}`;
  },

  // Креатор: ссылка на ролик → площадка, место, одноразовый код в описании → на проверку
  video: async () => {
    const d = draft.video ||= { link: '', place: '', code: false };
    d.vcode ||= oneTimeCode();
    const pd = await loadPlaces(ctx.game());
    const pf = platformOf(d.link);
    const places = featured(pd, 'place', 8);
    return `
    ${head(tr('Ролик', 'Video'))}
    <p class="rl-lead">${tr('Вставьте ссылку на ваш ролик. Проверим, что он про это место и в описании есть проверочный код, — и ролик появится в карточке места.', 'Paste a link to your video. We check it is about this place and the check code is in the description, then it shows on the place card.')}</p>
    <label class="rl-field"><span>${tr('Ссылка на ролик', 'Video link')}</span>
      <input id="rl-link" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://www.tiktok.com/@you/video/…" value="${esc(d.link)}"></label>
    <div class="rl-pf">${PF_NAMES.map((p) => `<i class="${p === pf ? 'on' : ''}">${p}</i>`).join('')}</div>
    <p class="rl-hint" id="rl-link-hint">${pfHint(d.link, pf)}</p>
    <div class="s-h">${tr('Про какое место', 'Which place')}</div>
    <div class="rl-places">${places.map((o) => { const k = placeKey(o); const th = o.pr?.thumb || o.pr?.file || o.pg?.thumb || ''; return `<button class="rl-pl${d.place === k ? ' on' : ''}" data-action="rl-place" data-v="${esc(k)}">${th ? `<img src="${esc(th)}" alt="" loading="lazy">` : ''}<b>${esc(short(o))}</b><small>${esc(cityOf(o))}</small></button>`; }).join('')}</div>
    <div class="rl-vcode"><span><small>${tr('Проверочный код для описания', 'Check code for the description')}</small><b class="tnum">${d.vcode}</b></span><button class="rl-copy" data-action="rl-copy-vcode">${tr('Скопировать', 'Copy')}</button></div>
    <button class="rl-check${d.code ? ' on' : ''}" data-action="rl-code"><i>${I.check}</i><span>${tr(`Код ${d.vcode} есть в описании ролика`, `Code ${d.vcode} is in the description`)}</span></button>
    <button class="btn-primary" data-action="rl-send-video" ${pf && d.place && d.code ? '' : 'disabled'}>${I.share}<span>${tr('Отправить на проверку', 'Send for review')}</span></button>
    <p class="rl-fine">${tr('Код одноразовый: по нему видно, что ролик ваш. После проверки его можно убрать. Просмотры — по ставкам лиги, аванс на 10-й день. Накрутка — бан.', 'The code is one-time: it shows the video is yours. You can remove it after the check. Views are paid at league rates, advance on day 10. Fake views mean a ban.')}</p>`;
  },

  // Скаут: пара «в игре и в жизни» — два снимка, предпросмотр со швом
  pair: async () => {
    const d = draft.pair ||= { g: '', r: '', gv: false, rv: false, place: '' };
    const slot = (k, label, hint) => `<label class="rl-slot${d[k] ? ' has' : ''}">
      ${d[k] ? (d[k + 'v'] ? `<video src="${d[k]}" muted playsinline loop autoplay></video>` : `<img src="${d[k]}" alt="">`) : `<span class="rl-slot-ic">${I.camera || ''}</span>`}
      <span class="rl-slot-t"><b>${label}</b><small>${hint}</small></span>
      <input type="file" accept="image/*,video/*" data-slot="${k}" ${k === 'r' ? 'capture="environment"' : ''}></label>`;
    return `
    ${head(tr('Пара «в игре и в жизни»', 'In game and in real life'))}
    <p class="rl-lead">${tr('Кадр из вашей игры и фото того же места с того же ракурса. Видео до 15 секунд тоже подходит.', 'A frame from your game and a photo of the same place from the same angle. Videos up to 15 seconds work too.')}</p>
    <div class="rl-slots">${slot('g', tr('Кадр из игры', 'Game frame'), tr('скриншот или запись экрана', 'screenshot or screen recording'))}${slot('r', tr('В жизни', 'In real life'), tr('снимите сейчас или из галереи', 'shoot now or pick from gallery'))}</div>
    ${d.g && d.r && !d.gv && !d.rv ? `<div class="s-h">${tr('Так увидят на карточке', 'How it looks on the card')}</div>${compare(d.g, d.r)}` : ''}
    <div class="rl-tips">
      <p>${I.check}<span>${tr('Тот же ракурс и высота камеры, горизонт на одной линии', 'Same angle and camera height, horizon on one line')}</span></p>
      <p>${I.check}<span>${tr('Без людей крупно и без номеров машин', 'No close-up faces or licence plates')}</span></p>
      <p>${I.check}<span>${tr('Только свои снимки — чужие фото отклоним', 'Your own shots only, others will be declined')}</span></p>
      <p>${I.info}<span>${tr('Кадр из игры проверим перед публикацией', 'We check the game frame before publishing')}</span></p>
    </div>
    <button class="btn-primary" data-action="rl-send-pair" ${d.g && d.r ? '' : 'disabled'}>${I.share}<span>${tr('Отправить на проверку', 'Send for review')}</span></button>`;
  },

  // Автор находки: место или пасхалка с источником
  find: async () => {
    const d = draft.find ||= { kind: 'egg', title: '', where: '', src: '' };
    return `
    ${head(tr('Находка', 'Find'))}
    <div class="frow rl-kinds">${[['egg', tr('Пасхалка', 'Easter egg')], ['place', tr('Место', 'Place')], ['wrong', tr('Не то место', 'Wrong place')]].map(([k, l]) => `<button class="fchip${d.kind === k ? ' on' : ''}" data-action="rl-kind" data-v="${k}">${l}</button>`).join('')}</div>
    <label class="rl-field"><span>${tr('Что это', 'What it is')}</span><input id="rl-f-title" value="${esc(d.title)}" placeholder="${tr('Например: вывеска как в фильме 1983 года', 'For example: a sign like in a 1983 film')}"></label>
    <label class="rl-field"><span>${tr('Где в жизни', 'Where in real life')}</span><input id="rl-f-where" value="${esc(d.where)}" placeholder="${tr('Адрес или название места', 'Address or place name')}"></label>
    <label class="rl-field"><span>${tr('Источник', 'Source')}</span><input id="rl-f-src" value="${esc(d.src)}" placeholder="${tr('Ссылка, кадр трейлера, минута ролика', 'Link, trailer frame, video timestamp')}"></label>
    <label class="rl-slot rl-slot-wide"><span class="rl-slot-ic">${I.photos || I.camera || ''}</span><span class="rl-slot-t"><b>${tr('Фото или видео', 'Photo or video')}</b><small>${tr('по желанию, до 3 файлов', 'optional, up to 3 files')}</small></span><input type="file" accept="image/*,video/*" multiple data-slot="f"></label>
    <button class="btn-primary" data-action="rl-send-find" ${d.title && d.where ? '' : 'disabled'}>${I.share}<span>${tr('Отправить на проверку', 'Send for review')}</span></button>
    <p class="rl-fine">${tr('Первым нашли — на карточке будет «Найдено @ник», и 10% от роликов о ней.', 'Found it first: the card says Found by @you, plus 10% of videos about it.')}</p>`;
  },

  // Мои отправки: статусы и причины
  mine: async () => `
    ${head(tr('Мои отправки', 'My submissions'))}
    ${R.mine.length ? `<div class="rl-list">${R.mine.slice().reverse().map((x) => `<div class="rl-item">
      <span class="rl-ic">${I[{ video: 'video', pair: 'camera', find: 'pin' }[x.type]] || I.pin}</span>
      <span class="rl-m"><b>${esc(x.title)}</b><small>${esc(x.sub || '')}</small>${x.reason ? `<small class="rl-why">${esc(x.reason)}</small>` : ''}</span>${status(x.status)}</div>`).join('')}</div>`
      : `<div class="empty-big">${I.empty || I.info}<h3>${tr('Пока пусто', 'Nothing yet')}</h3><p>${tr('Отправьте ролик, пару или находку — здесь будет её проверка.', 'Send a video, a pair or a find and track its review here.')}</p></div>`}`,

  // Проверяющий: лента карточек — вправо «подходит», влево «не подходит» и причина; кнопки для тех, кто не смахивает
  review: async () => {
    const q = await queue();
    const c = q[0], n = q[1];
    const acc = R.done ? Math.round((R.agree / R.done) * 100) : 92;
    const tally = `<div class="rl-tally"><span>${tr(`+${usd(PER_CHECK)} за проверку, пример`, `+${usd(PER_CHECK)} per review, example`)}</span><b class="tnum" id="rl-tally">${sess.n ? `${sess.n} ${tr(plural(sess.n, ['проверка', 'проверки', 'проверок']), sess.n === 1 ? 'review' : 'reviews')}, +${usd(sess.n * PER_CHECK)}` : tr('пока 0', 'none yet')}</b></div>`;
    if (!c) return `${head(tr('Проверка', 'Review'))}${tally}<div class="empty-big">${I.check}<h3>${tr('Все карточки проверены', 'All cards reviewed')}</h3><p>${tr('Новые ролики, пары и находки придут сюда. Спасибо за помощь.', 'New videos, pairs and finds will show up here. Thank you.')}</p></div>`;
    const reasons = c.type === 'video'
      ? [tr('Нет кода', 'No code'), tr('Не про это место', 'Not about this place'), tr('Чужой ролик', "Someone else's video")]
      : c.type === 'find'
        ? [tr('Нет источника', 'No source'), tr('Уже есть', 'Already listed'), tr('Не то место', 'Wrong place')]
        : [tr('Не то место', 'Wrong place'), tr('Другой ракурс', 'Different angle'), tr('Чужое фото', "Someone else's photo"), tr('Люди или номера', 'Faces or plates')];
    const ask = c.type === 'video' ? tr('Ролик подходит?', 'Does the video fit?') : c.type === 'find' ? tr('Находка верна?', 'Is the find right?') : tr('Это то же место?', 'Is it the same place?');
    return `
    ${head(tr('Проверка', 'Review'), `<span class="rl-cnt">1 ${tr('из', 'of')} ${q.length}</span>`)}
    ${tally}
    <div class="rl-deck">${n ? card(n, true) : ''}${card(c)}</div>
    <div class="rl-acts" id="rl-acts">
      <div class="rl-btns">
        <button class="rl-round no" data-action="rl-no" aria-label="${tr('Не подходит', 'Decline')}">${I.close}</button>
        <span class="rl-ask">${ask}</span>
        <button class="rl-round ok" data-action="rl-yes" aria-label="${tr('Подходит', 'Accept')}">${I.check}</button>
      </div>
      <div class="rl-whybox">
        <p>${tr('Что не так?', 'What is wrong?')}</p>
        <div class="rl-reasons">${reasons.map((r) => `<button class="fchip" data-action="rl-why" data-r="${esc(r)}">${r}</button>`).join('')}</div>
        <button class="rl-undo" data-action="rl-undo">${tr('Вернуть карточку', 'Bring the card back')}</button>
      </div>
    </div>
    <p class="rl-fine">${tr(`Ваша точность ${acc}% на последних проверках. Среди карточек есть контрольные — они ничем не отличаются.`, `Your accuracy is ${acc}%. Some cards are control cards and look the same.`)}</p>`;
  },

  // Лига: задания недели на фото и ставки
  league: async () => {
    const pd = await loadPlaces(ctx.game());
    const tasks = featured(pd, 'place', 3);
    return `
    ${head(tr('Лига креаторов', 'Creator league'))}
    <div class="rl-tasks">${tasks.map(taskCard).join('')}</div>
    <div class="s-h">${tr('Ставки за просмотры', 'Rates per views')}</div>
    <div class="group rl-rates">
      <p><span>TikTok, Reels</span><b>${tr('0,12 $ за 1 000', '$0.12 per 1,000')}</b></p>
      <p><span>YouTube Shorts</span><b>${tr('0,05 $ за 1 000', '$0.05 per 1,000')}</b></p>
      <p><span>${tr('Медиана за ролик', 'Median per video')}</span><b>${usd(MED_VIDEO)}</b></p>
      <p><span>${tr('Потолок за ролик', 'Cap per video')}</span><b>${usd0(CAP_VIDEO)}</b></p>
      <p><span>${tr('Минимум к выплате', 'Minimum payout')}</span><b>${usd0(PAYOUT_MIN)}</b></p>
      <p><span>${tr('Доля по вашему коду', 'Share by your code')}</span><b>${tr('40% с каждой покупки', '40% of every purchase')}</b></p>
    </div>
    ${example()}`;
  },

  // Заработок: дашборд с привязкой к выходу GTA 6
  earn: async () => {
    const pd = await loadPlaces('gta6');
    const tasks = featured(pd, 'place', 6).filter((o) => o.pr || o.pg).slice(0, 3);
    const days = daysTo();
    const avail = +(TOTAL - PENDING).toFixed(2);
    const src = sources(), sum = src.reduce((a, s) => a + s[1], 0);
    const last14 = DAYS14.reduce((a, b) => a + b, 0);
    const gta = days > 0
      ? `<span class="rl-gta-n tnum">${days}</span><span class="rl-gta-t"><b>${tr(`${plural(days, ['день', 'дня', 'дней'])} до выхода GTA 6`, `${days === 1 ? 'day' : 'days'} until GTA 6`)}</b><small>${tr('19 ноября. В день выхода ставки ×2, пример', 'November 19. Rates ×2 on launch day, example')}</small></span>`
      : `<span class="rl-gta-t"><b>${days === 0 ? tr('GTA 6 выходит сегодня', 'GTA 6 is out today') : tr('GTA 6 уже вышла', 'GTA 6 is out')}</b><small>${tr('Первую неделю ставки ×2, пример', 'Rates ×2 for the first week, example')}</small></span>`;
    return `
    ${head(tr('Мой заработок', 'My earnings'))}
    <section class="rl-hero rl-ehero">
      ${pic('gta6-banner-01', { cls: 'rl-hero-ph', eager: true })}
      <div class="rl-hero-top">
        <b class="rl-big tnum">${usd(TOTAL)}</b>
        <p>${tr(`за месяц, медиана у авторов лиги — ${usd(MED_TOTAL)}. Пример`, `this month, league median ${usd(MED_TOTAL)}. Example`)}</p>
      </div>
      <div class="rl-gta">${gta}</div>
    </section>

    <div class="s-h">${tr('Как растут ставки к выходу', 'How rates grow towards launch')}</div>
    <div class="rl-panel">${rampChart()}<p class="rl-cap">${tr('Неделя до выхода ×1,5, первая неделя после ×2. Снимайте места из трейлеров заранее — ролики наберут просмотры в пик. Пример.', 'The week before launch ×1.5, the first week after ×2. Film trailer places early so videos peak at launch. Example.')}</p></div>

    <div class="s-h">${tr('Последние 14 дней', 'Last 14 days')} <em class="tnum">${usd(last14)}</em></div>
    <div class="rl-panel">${barChart(DAYS14)}<p class="rl-cap rl-cap-med"><i></i>${tr(`медиана у авторов лиги — ${usd(MED_DAY)} в день. Пример`, `league median ${usd(MED_DAY)} a day. Example`)}</p></div>

    <div class="s-h">${tr('Откуда деньги', 'Where it comes from')}</div>
    <div class="rl-panel">
      <div class="rl-stack" role="img" aria-label="${tr('Доли источников заработка', 'Earnings by source')}">${src.map(([, v], i) => `<i class="s${i}" style="width:${(v / sum * 100).toFixed(1)}%"></i>`).join('')}</div>
      <div class="rl-legend">${src.map(([l, v], i) => `<p><i class="s${i}"></i><span>${l}</span><b class="tnum">${usd(v)}</b><em class="tnum">${Math.round(v / sum * 100)}%</em></p>`).join('')}</div>
    </div>

    <div class="rl-panel rl-pay">
      <div class="rl-pay-h"><b>${tr('Первая выплата 20 ноября', 'First payout on Nov 20')}</b><span class="tnum">${tr(`доступно ${usd(avail)}, минимум ${usd0(PAYOUT_MIN)}`, `${usd(avail)} available, minimum ${usd0(PAYOUT_MIN)}`)}</span></div>
      ${prog(avail / PAYOUT_MIN, tr('До минимальной выплаты', 'To the minimum payout'))}
      <p>${avail >= PAYOUT_MIN ? tr('Минимум набран.', 'Minimum reached.') : tr(`Ещё ${usd(PAYOUT_MIN - avail)} до минимума.`, `${usd(PAYOUT_MIN - avail)} more to the minimum.`)} ${tr(`Аванс за ролик — на 10-й день, ещё ${usd(PENDING)} ждут аванса или проверки. В первый раз — подтверждение личности, 18+.`, `Advance per video on day 10, ${usd(PENDING)} more is waiting for an advance or review. First time: identity check, 18+.`)}</p>
    </div>

    <div class="s-h rl-sh-row">${tr('Задания лиги в GTA 6', 'GTA 6 league tasks')}<button data-action="rl-go" data-v="league">${tr('Все', 'All')}</button></div>
    <div class="rl-tasks-x">${tasks.map(taskCard).join('')}</div>
    ${example()}`;
  },

  // Правила и вход
  rules: async () => `
    ${head(tr('Честные правила', 'Fair rules'))}
    <div class="rl-rules">
      <p><b>40%</b><span>${tr('с каждой покупки по вашей ссылке, после холда 30 дней', 'of every purchase via your link, after a 30-day hold')}</span></p>
      <p><b>10%</b><span>${tr('сверху автору находки за ролики о ней', 'on top for the author of a find, from videos about it')}</span></p>
      <p><b>${tr('10 дней', '10 days')}</b><span>${tr('до аванса за ролик, первая выплата 20 ноября, от 3 $', 'to the advance per video, first payout on Nov 20, from $3')}</span></p>
      <p><b>${tr('Нельзя', 'Not allowed')}</b><span>${tr('накрутка, свой же код, чужие фото, кадры игры вместо фото', 'fake views, your own code, other people’s photos, game frames as photos')}</span></p>
    </div>
    <div class="s-h">${tr('Вход для денежных ролей', 'Sign-in for paid roles')}</div>
    <label class="rl-field"><span>${tr('Почта', 'Email')}</span><input id="rl-mail" type="email" inputmode="email" placeholder="you@mail.com"></label>
    <button class="rl-check" data-action="rl-18"><i>${I.check}</i><span>${tr('Мне есть 18 лет', 'I am 18 or older')}</span></button>
    <button class="btn-primary" data-action="rl-noop" disabled>${tr('Получить код', 'Get a code')}</button>
    <p class="rl-fine">${tr('Вход появится вместе с сервером. Игрокам вход не нужен.', 'Sign-in comes with the server. Players never need it.')}</p>`,
};

// ───────── карточка ленты проверки ─────────
function card(c, peek = false) {
  const kind = { video: tr('Ролик', 'Video'), pair: tr('Пара', 'Pair'), find: tr('Находка', 'Find') }[c.type];
  let media = '', extra = '';
  if (c.type === 'video') {
    media = `<div class="rl-media">${c.thumb ? `<img src="${esc(c.thumb)}" alt="">` : ''}<span class="rl-media-pf">${esc(c.platform)}</span><span class="rl-media-play">${I.play}</span></div>`;
    extra = `<p class="rl-vlink">${esc(c.link)}</p>
      <div class="rl-qs"><p>${I.check}<span>${tr('Ролик про это место', 'The video is about this place')}</span></p><p>${I.check}<span>${tr('В описании код', 'Code in the description')} <b>${esc(c.vcode || 'SB-7Q4K')}</b></span></p></div>
      <small class="rl-note">${tr('Откройте ролик в приложении площадки и сверьте место и код.', 'Open the video in its own app and check the place and code.')}</small>`;
  } else if (c.g && c.r) {
    media = compare(c.g, c.r);
  } else {
    media = `<div class="rl-media${c.photo ? '' : ' rl-media-empty'}">${c.photo ? `<img src="${esc(c.photo)}" alt="">` : I.pin}</div>`;
    if (c.src) extra = `<p class="rl-vlink">${tr('Источник', 'Source')}: ${esc(c.src)}</p>`;
  }
  return `<article class="rl-swipe ${peek ? 'next' : 'top'}" ${peek ? 'aria-hidden="true" inert' : `data-id="${esc(c.id)}"`}>
    ${peek ? '' : `<span class="rl-stamp ok">${tr('Подходит', 'Accept')}</span><span class="rl-stamp no">${tr('Не подходит', 'Decline')}</span>`}
    <div class="rl-card-h"><span class="rl-kind">${kind}</span><span>${esc(c.by || '@user')}</span></div>
    ${media}
    <div class="rl-grab">
      <h3>${esc(c.type === 'video' ? c.sub || c.title : c.title)}</h3>
      <p class="rl-sub">${esc(c.type === 'video' ? c.city || '' : c.sub)}</p>
      ${extra}
      <p class="rl-swipe-hint"><span>${I.back}${tr('не подходит', 'decline')}</span><span>${tr('подходит', 'accept')}${I.chevron}</span></p>
    </div>
  </article>`;
}

// ───────── графики заработка (inline SVG, в масштабе) ─────────
function barChart(vals) {
  const W = 343, H = 172, L = 40, Rr = 6, T = 24, B = 26, pw = W - L - Rr, phh = H - T - B, max = 2;
  const step = pw / vals.length, bw = Math.round(step * 0.6), y = (v) => T + phh - (v / max) * phh;
  const t = today();
  const grid = [0, 1, 2].map((v) => `<line class="g" x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${getLang() === 'ru' ? `${v} $` : `$${v}`}</text>`).join('');
  const bars = vals.map((v, i) => {
    const x = L + i * step + (step - bw) / 2, h = (v / max) * phh;
    return v > 0 ? `<rect class="${i === vals.length - 1 ? 'b on' : 'b'}" x="${x.toFixed(1)}" y="${(T + phh - h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="3"><title>${usd(v)}</title></rect>` : '';
  }).join('');
  const lx = (i) => (L + i * step + step / 2).toFixed(1);
  const d0 = new Date(t - 13 * DAY), d7 = new Date(t - 6 * DAY);
  const lastX = L + 13 * step + step / 2, lastY = y(vals[13]);
  return `<svg class="rl-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr('Заработок по дням за 14 дней и медиана авторов, пример', 'Daily earnings for 14 days and the league median, example')}">
    ${grid}${bars}
    <line class="med" x1="${L}" x2="${W - Rr}" y1="${y(MED_DAY).toFixed(1)}" y2="${y(MED_DAY).toFixed(1)}"/>
    <text class="val" x="${Math.min(lastX, W - 24).toFixed(1)}" y="${(lastY - 7).toFixed(1)}" text-anchor="middle">${usd(vals[13])}</text>
    <text class="ax" x="${lx(0)}" y="${H - 6}" text-anchor="middle">${dayLabel(d0)}</text>
    <text class="ax" x="${lx(7)}" y="${H - 6}" text-anchor="middle">${dayLabel(d7)}</text>
    <text class="ax" x="${W - Rr}" y="${H - 6}" text-anchor="end">${tr('сегодня', 'today')}</text>
  </svg>`;
}

function rampChart() {
  const t0 = +today(), rel = +RELEASE;
  const start = Math.min(t0, rel - 21 * DAY), end = rel + 21 * DAY;
  if (t0 > end) return '';
  const W = 343, H = 150, L = 8, Rr = 8, T = 26, B = 28, pw = W - L - Rr, phh = H - T - B;
  const x = (tt) => L + ((tt - start) / (end - start)) * pw, y = (m) => T + phh - (m / 2) * phh;
  const seg = [[start, rel - 7 * DAY, 1], [rel - 7 * DAY, rel, 1.5], [rel, rel + 7 * DAY, 2], [rel + 7 * DAY, end, 1.5]];
  const line = seg.map(([a, b, m], i) => `${i ? 'L' : 'M'}${x(a).toFixed(1)} ${y(m).toFixed(1)} L${x(b).toFixed(1)} ${y(m).toFixed(1)}`).join(' ');
  const area = `${line} L${x(end).toFixed(1)} ${y(0)} L${x(start).toFixed(1)} ${y(0)} Z`;
  const mult = (m) => `×${String(m).replace('.', getLang() === 'ru' ? ',' : '.')}`;
  const labels = seg.map(([a, b, m]) => `<text class="m${m === 2 ? ' on' : ''}" x="${((x(a) + x(b)) / 2).toFixed(1)}" y="${(y(m) - 8).toFixed(1)}" text-anchor="middle">${mult(m)}</text>`).join('');
  const xr = x(rel), xt = x(t0);
  const near = Math.abs(xr - xt) < 70;
  return `<svg class="rl-chart rl-ramp" viewBox="0 0 ${W} ${H}" role="img" aria-label="${tr('Множитель ставок вокруг выхода GTA 6, пример', 'Rate multiplier around the GTA 6 launch, example')}">
    <path class="area" d="${area}"/><path class="ln" d="${line}"/>
    <line class="base" x1="${L}" x2="${W - Rr}" y1="${y(0)}" y2="${y(0)}"/>
    ${labels}
    <line class="rel" x1="${xr.toFixed(1)}" x2="${xr.toFixed(1)}" y1="${T - 4}" y2="${y(0)}"/>
    <text class="ax on" x="${xr.toFixed(1)}" y="${H - 8}" text-anchor="${near ? 'start' : 'middle'}">${tr('выход 19 ноября', 'launch Nov 19')}</text>
    ${t0 >= start && !near ? `<line class="now" x1="${xt.toFixed(1)}" x2="${xt.toFixed(1)}" y1="${T - 4}" y2="${y(0)}"/><circle class="now-d" cx="${xt.toFixed(1)}" cy="${y(1).toFixed(1)}" r="4"/><text class="ax" x="${xt.toFixed(1)}" y="${H - 8}" text-anchor="start">${tr('сегодня', 'today')}</text>` : ''}
  </svg>`;
}

// очередь проверки: сначала отправленное в этом браузере, потом демо — пары, ролики и находка из данных карты
let demoQ = null;
async function queue() {
  if (!demoQ) {
    const pd = await loadPlaces(ctx.game());
    const by = ['@vice_walks', '@la_scout', '@keys_hunter', '@leonida_eye'];
    const pairs = featured(pd, 'place', 30).filter((o) => o.pg && o.pr).slice(0, 8).map((o, i) => ({
      id: 'demo-' + o.id, type: 'pair', title: short(o), sub: cityOf(o) || eraCity(ctx.game()), g: ph(o.pg), r: ph(o.pr), by: by[i % 4],
    }));
    const vids = featured(pd, 'place', 40).filter((o) => o.pr).slice(10, 12).map((o, i) => ({
      id: 'demo-v-' + o.id, type: 'video', platform: ['TikTok', 'Reels'][i], title: short(o), sub: short(o), city: cityOf(o), thumb: ph(o.pr), vcode: ['SB-7Q4K', 'SB-M3TX'][i],
      link: ['https://www.tiktok.com/@vice_walks/video/7351820', 'https://www.instagram.com/reel/C9x2kLm'][i], by: by[(i + 1) % 4],
    }));
    const egg = featured(pd, 'egg', 6).find((o) => o.pg || o.pr);
    const finds = egg ? [{ id: 'demo-f-' + egg.id, type: 'find', title: (egg.t?.[getLang()] || egg.t?.ru || ''), sub: String(egg.p || '').split(',').slice(0, 2).join(','), photo: ph(egg.pg) || ph(egg.pr), src: tr('кадр второго трейлера, 1:12', 'second trailer frame, 1:12'), by: by[3] }] : [];
    demoQ = [];
    pairs.forEach((p, i) => { demoQ.push(p); if (i === 0 && vids[0]) demoQ.push(vids[0]); if (i === 2 && finds[0]) demoQ.push(finds[0]); if (i === 4 && vids[1]) demoQ.push(vids[1]); });
  }
  return [...R.mine.filter((x) => x.status === 'review' && !x.reviewed), ...demoQ.filter((x) => !R['seen_' + x.id])];
}

// ───────── отрисовка и события ─────────
export async function render() {
  const box = $('#roles-body');
  if (!box) return;
  const scr = stack[stack.length - 1];
  const html = await SCREENS[scr]();
  box.innerHTML = html;
  box.dataset.screen = scr;
  box.scrollTop = 0;
}
export function open(c) { ctx = c; stack = ['hub']; sess.n = 0; return render(); }
const go = (s) => { if (s === 'review') sess.n = 0; stack.push(s); render(); };
const back = () => { if (stack.length > 1) { stack.pop(); render(); } else ctx.back(); };

function submit(type, item) {
  R.mine.push({ id: type + '-' + Date.now(), type, status: 'review', at: new Date().toISOString(), by: '@mia_keys', ...item });
  save(); delete draft[type];
  ctx.toast(tr('Отправлено на проверку', 'Sent for review')); ctx.haptic();
  stack = ['hub', 'mine']; render();
}

// решение по карточке: своя отправка меняет статус и причину в «Мои отправки»
function verdict(id, ok, reason = '') {
  const mine = R.mine.find((x) => x.id === id);
  if (mine) { mine.reviewed = true; mine.status = ok ? 'ok' : 'no'; mine.reason = reason; }
  else R['seen_' + id] = 1;
  R.done++; if (ok) R.agree++; sess.n++;
  save(); ctx.haptic();
  if (mine) ctx.toast(ok ? tr('Ваша отправка принята', 'Your submission is accepted') : `${tr('Ваша отправка отклонена', 'Your submission is declined')}: ${reason}`);
  render();
}

// ── свайп: только горизонтальный жест по карточке вне сравнения (шов двигается своим ползунком) ──
const topCard = () => $('#roles-body .rl-swipe.top');
const nextCard = () => $('#roles-body .rl-swipe.next');
function paint(card, dx) {
  const p = Math.max(-1, Math.min(1, dx / 110));
  card.style.transform = dx ? `translateX(${dx}px) rotate(${reduce() ? 0 : dx / 22}deg)` : '';
  card.style.setProperty('--pok', Math.max(0, p).toFixed(2));
  card.style.setProperty('--pno', Math.max(0, -p).toFixed(2));
  const n = nextCard();
  if (n) { const k = Math.min(1, Math.abs(dx) / 140); n.style.transform = dx ? `translateY(${(12 * (1 - k)).toFixed(1)}px) scale(${(0.94 + 0.06 * k).toFixed(3)})` : ''; }
}
function snapBack(card) {
  card.style.transition = 'transform 200ms var(--e-out)';
  const n = nextCard(); if (n) n.style.transition = 'transform 200ms var(--e-out)';
  paint(card, 0);
}
function fling(card, dir, then) {
  const rm = reduce(), n = nextCard();
  card.classList.add('gone');
  card.style.setProperty(dir > 0 ? '--pok' : '--pno', '1');
  card.style.setProperty(dir > 0 ? '--pno' : '--pok', '0');
  if (rm) { card.style.transition = 'opacity 200ms linear'; card.style.opacity = '0'; }
  else { card.style.transition = 'transform 260ms cubic-bezier(.3,.6,.4,1), opacity 260ms linear'; card.style.transform = `translateX(${dir * (innerWidth + 120)}px) rotate(${dir * 16}deg)`; card.style.opacity = '.4'; }
  if (n) { n.style.transition = rm ? 'none' : 'transform 260ms var(--e-out)'; n.style.transform = 'none'; }
  setTimeout(then, rm ? 200 : 260);
}
function hold(card) {   // «не подходит» — карточка чуть уходит влево и ждёт причину
  card.classList.add('held');
  card.style.transition = 'transform 220ms var(--e-out)';
  card.style.transform = reduce() ? '' : 'translateX(-18px) rotate(-2.5deg)';
  card.style.setProperty('--pok', '0'); card.style.setProperty('--pno', '1');
  const n = nextCard(); if (n) { n.style.transition = 'transform 220ms var(--e-out)'; n.style.transform = ''; }
  $('#rl-acts')?.classList.add('why');
  $('#rl-acts .rl-reasons .fchip')?.focus({ preventScroll: true });
  $('#rl-acts')?.scrollIntoView({ block: 'end', behavior: reduce() ? 'auto' : 'smooth' });   // причины не прячутся под панелью вкладок
}
function unhold(card) {
  card.classList.remove('held');
  snapBack(card);
  $('#rl-acts')?.classList.remove('why');
}

let drag = null;
document.addEventListener('pointerdown', (e) => {
  if (!ctx || stack[stack.length - 1] !== 'review') return;
  const card = e.target.closest?.('.rl-swipe.top');
  if (!card || card.classList.contains('held') || card.classList.contains('gone')) return;
  if (e.target.closest('.rl-cmp, button, input, a')) return;      // шов сравнения и кнопки — не свайп
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  drag = { card, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, lock: null, lx: e.clientX, lt: performance.now(), vx: 0 };
});
document.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.lock) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    drag.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
    if (drag.lock === 'y') { drag = null; return; }       // вертикальный жест — прокрутка страницы
    drag.card.style.transition = 'none';
    const n = nextCard(); if (n) n.style.transition = 'none';
    try { drag.card.setPointerCapture(e.pointerId); } catch { }
  }
  e.preventDefault();
  const now = performance.now();
  if (now > drag.lt) { drag.vx = (e.clientX - drag.lx) / (now - drag.lt); drag.lx = e.clientX; drag.lt = now; }
  drag.dx = dx;
  paint(drag.card, dx);
}, { passive: false });
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  if (d.lock !== 'x') return;
  const go = e.type !== 'pointercancel' && (Math.abs(d.dx) > 100 || (Math.abs(d.vx) > 0.6 && Math.abs(d.dx) > 30));
  if (go && d.dx > 0) fling(d.card, 1, () => verdict(d.card.dataset.id, true));
  else if (go) hold(d.card);
  else snapBack(d.card);
};
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);
document.addEventListener('keydown', (e) => {
  if (!ctx || stack[stack.length - 1] !== 'review' || e.target.closest?.('input, textarea')) return;
  const card = topCard(); if (!card || card.classList.contains('gone')) return;
  if (e.key === 'ArrowRight' && !card.classList.contains('held')) { e.preventDefault(); fling(card, 1, () => verdict(card.dataset.id, true)); }
  if (e.key === 'ArrowLeft' && !card.classList.contains('held')) { e.preventDefault(); hold(card); }
  if (e.key === 'Escape' && card.classList.contains('held')) unhold(card);
});

const copy = async (text, msg) => { try { await navigator.clipboard.writeText(text); ctx.toast(msg); } catch { } };

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action^="rl-"]');
  if (!el || !ctx) return;
  const a = el.dataset.action, v = el.dataset.v;
  switch (a) {
    case 'rl-back': ctx.haptic(); back(); break;
    case 'rl-go': ctx.haptic(); go(v); break;
    // ссылка автора: домен/КОД/мир (место добавляется из карточки места)
    case 'rl-copy': copy(`https://${LINK_DOMAIN}/${ROLE_CODE}`, tr('Ссылка скопирована', 'Link copied')); break;
    case 'rl-copy-vcode': copy(draft.video?.vcode || '', tr('Код скопирован', 'Code copied')); break;
    case 'rl-place': draft.video.place = v; ctx.haptic(); render(); break;
    case 'rl-code': draft.video.code = !draft.video.code; render(); break;
    case 'rl-18': el.classList.toggle('on'); break;
    case 'rl-kind': draft.find.kind = v; render(); break;
    case 'rl-task': draft.video = { link: '', place: v, code: false }; stack = ['hub', 'video']; render(); break;
    case 'rl-send-video': {
      const d = draft.video, pd = await loadPlaces(ctx.game());
      const o = pd.places.find((x) => placeKey(x) === d.place);
      submit('video', { title: `${platformOf(d.link)}: ${o ? short(o) : ''}`, sub: o ? short(o) : '', city: o ? cityOf(o) : '', thumb: o ? ph(o.pr) || ph(o.pg) : '', place: d.place, link: d.link, platform: platformOf(d.link), vcode: d.vcode });
      break;
    }
    case 'rl-send-pair': {
      const d = draft.pair;
      submit('pair', { title: tr('Пара «в игре и в жизни»', 'Pair'), sub: eraCity(ctx.game()), g: d.gv ? '' : d.g, r: d.rv ? '' : d.r });
      break;
    }
    case 'rl-send-find': {
      const d = draft.find;
      submit('find', { title: d.title, sub: d.where, src: d.src });
      break;
    }
    // лента проверки
    case 'rl-yes': { const c = topCard(); if (c && !c.classList.contains('gone')) { if (c.classList.contains('held')) unhold(c); fling(c, 1, () => verdict(c.dataset.id, true)); } break; }
    case 'rl-no': { const c = topCard(); if (c && !c.classList.contains('gone')) hold(c); break; }
    case 'rl-undo': { const c = topCard(); if (c) unhold(c); break; }
    case 'rl-why': {
      const c = topCard(); if (!c || c.classList.contains('gone')) break;
      $('#rl-acts')?.classList.remove('why');
      fling(c, -1, () => verdict(c.dataset.id, false, el.dataset.r || ''));
      break;
    }
  }
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'rl-link') {
    draft.video.link = t.value.trim();
    const pf = platformOf(draft.video.link);
    document.querySelectorAll('.rl-pf i').forEach((i) => i.classList.toggle('on', i.textContent === pf));
    $('#rl-link-hint').textContent = pfHint(draft.video.link, pf);
    const btn = $('[data-action=rl-send-video]'); if (btn) btn.disabled = !(pf && draft.video.place && draft.video.code);
  }
  if (t.id === 'rl-f-title' || t.id === 'rl-f-where' || t.id === 'rl-f-src') {
    draft.find[{ 'rl-f-title': 'title', 'rl-f-where': 'where', 'rl-f-src': 'src' }[t.id]] = t.value;
    const btn = $('[data-action=rl-send-find]'); if (btn) btn.disabled = !(draft.find.title && draft.find.where);
  }
  if (t.matches('[data-cmp]')) t.closest('.rl-cmp').style.setProperty('--x', t.value + '%');
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (!t.matches('input[type=file][data-slot]') || !t.files?.length) return;
  const f = t.files[0], k = t.dataset.slot;
  if (k === 'f') { ctx.toast(`${tr('Файлов', 'Files')}: ${Math.min(3, t.files.length)}`); return; }
  draft.pair[k] = URL.createObjectURL(f); draft.pair[k + 'v'] = f.type.startsWith('video');
  render();
});
