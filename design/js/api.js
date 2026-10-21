// SB.api — контракт экранов креаторов с сервером. ЭТОТ ФАЙЛ — МОК (пример данных, без сети).
// Сессия feature/server заменит его настоящим с теми же именами методов и полями (docs/api-contract.md).
// Экраны (js/league.js) ходят только через window.SB.api; все методы возвращают Promise.
//
// Статусы ролика:     submitted → pending_review → awaiting_threshold → accruing → rejected (reject_code) / unavailable
// Статусы начисления: maturing → available → paid / reversed
// Причины начисления: share (40% с покупки по коду), cpa ($15 за приведённого креатора), task (задание, пара Скаута),
//                     queue_batch (проверки модератора), rpm (оплата просмотров), author_fee (10% автору места), friend_pro (дни Pro)
// Профиль: roles, level, adult_at, ref_code, pro_until, pro_kind, work_pro_until, trial_until, league_unlocked, gift
// (+ email, nick, country, payouts). Доступ (шаг 9, файл 31 §4.2–4.3): Pro — pro_until (куплен: year | pass | month)
// или work_pro_until (рабочий Pro партнёра: 14 дней после «Стать партнёром», +30 дней за принятый ролик от 1 000 просмотров);
// пробный — trial_until (ISO с временем, 72 часа с первого открытия); gift — пришёл по ссылке домен/КОД/…:
// { from: ник, days: 30, place: {world,id} } → «+30 дней к первой покупке» и вещь из ссылки без Pro.
// Деньги — в центах (целые), даты — ISO 'YYYY-MM-DD'.
//
// Состояние мока для показа: ?sbmock=<имя> (запоминается в sessionStorage) — league (по умолчанию), newbie, empty,
// player, guest, minor, nopay, trial, trialend, partner, partnerend, link, renew, pro. Всё ниже — ПРИМЕР,
// настоящие цифры придут с сервера. Приложение (app.js) берёт доступ из профиля мока, только если состояние выбрано явно
// (?sbmock=…); без него пробный доступ считается от первого запуска на устройстве.

const FIRST_ROUND = '2026-11-20';
const RULES = {
  first_round: FIRST_ROUND, median_cents: null,            // медиана — только после первого раунда
  share_pct: 40, hold_days: 30, payout_min_cents: 2500, payout_day: 20,
  rpm: { tiktok: 12, reels: 12, youtube: 12, shorts: 5 },   // центов за 1 000 просмотров (файл 31)
  rpm_min_cents: 300, rpm_cap_cents: 15000, rpm_example: { views: 1000000, cents: 12000 },
  cpa_cents: 1500, cpa_after_cents: 5000, cpa_days: 90, author_fee_pct: 10, author_fee_months: 12,
  scout_pair_cents: 1000, mod_decision_cents: 1, mod_min_accuracy: 70, task_after_days: 7,
  league_goal_views: 10000, partner_pro_days: 14, partner_pro_per_video_days: 30, partner_pro_min_views: 1000,
  gift_days: 30,
};
const PLACES = {   // id мест из data/map — подписи и фото экраны берут из places.js
  a: ['gta6', 'gta6-bayside-marketplace-skyviews'], b: ['gta6', 'gta6-arsht-center'], c: ['gta5', 'gta5-pleasure-pier'],
  d: ['gta6', 'gta6-one-biscayne-tower'], e: ['gta5', 'gta5-clock-tower-building'], f: ['gta6', 'gta6-marquis-grayson'],
  g: ['gta6', 'gta6-shark-valley-everglades'], h: ['gta5', 'gta5-ferris-whale'], i: ['gta5', 'gta5-del-perro-heights'],
};
const pl = (k) => ({ world: PLACES[k][0], id: PLACES[k][1] });

const STATES = ['league', 'newbie', 'empty', 'player', 'guest', 'minor', 'nopay', 'trial', 'trialend', 'partner', 'partnerend', 'link', 'renew', 'pro'];
function mockPick() {
  let s = null;
  try { s = new URLSearchParams(location.search).get('sbmock'); if (s) sessionStorage.setItem('sb.mock', s); } catch { }
  try { s = s || sessionStorage.getItem('sb.mock') || localStorage.getItem('sb.mock'); } catch { }
  return STATES.includes(s) ? s : null;
}
const mockState = () => mockPick() || 'league';

// ── ролики автора ──
const day = (d) => `2026-10-${String(d).padStart(2, '0')}`;
const inH = (h) => new Date(Date.now() + h * 36e5).toISOString();          // момент через h часов (ISO со временем)
const inD = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);   // дата через d дней
function spread(total, from, to, decay) {   // просмотры по дням: целые, сумма точно = total
  const w = []; let sw = 0;
  for (let d = from; d <= to; d++) { w[d] = Math.exp(-(d - from) / decay) * (1 + 0.22 * Math.sin(d * 1.7)); sw += w[d]; }
  const out = []; let acc = 0;
  for (let d = from; d <= to; d++) { const v = Math.round(total * w[d] / sw / 100) * 100; out.push({ date: day(d), views: v }); acc += v; }
  out[0].views += total - acc; return out;
}
const PRICE = { year: 1031, pass: 435, month: 190 };   // 40% с покупки, пояс 1 (файл 31): год $29,99, пропуск $12,99, месяц $5,99
function videosFull() {
  return [
    { id: '7K2Q', platform: 'tiktok', place: pl('a'), title: { ru: 'Skyviews Miami: тот самый ракурс', en: 'Skyviews Miami: the exact angle' }, status: 'accruing', submitted_at: day(8),
      views: 120000, clicks: 1260, trials: 112, pays: 9, buys: ['pass', 'year', 'month', 'pass', 'month', 'year', 'month', 'pass', 'month'], pay_days: [9, 10, 12, 15, 18, 21, 24, 27, 28],
      by_day: spread(120000, 8, 31, 6), embed: { kind: 'tiktok', id: '' } },
    { id: '3M8D', platform: 'shorts', place: pl('b'), title: { ru: 'Arsht Center с высоты', en: 'Arsht Center from above' }, status: 'accruing', submitted_at: day(14),
      views: 80000, clicks: 610, trials: 51, pays: 3, buys: ['pass', 'year', 'month'], pay_days: [16, 19, 26], rpm_done: true,
      by_day: spread(80000, 14, 31, 7), embed: { kind: 'youtube', id: '' } },
    { id: '9P4L', platform: 'reels', place: pl('c'), title: { ru: 'Santa Monica Pier вечером', en: 'Santa Monica Pier at night' }, status: 'accruing', submitted_at: day(20),
      views: 9400, clicks: 95, trials: 9, pays: 1, buys: ['pass'], pay_days: [22], by_day: spread(9400, 20, 31, 5), embed: null },
    { id: 'Q2W9', platform: 'tiktok', place: pl('d'), title: { ru: 'One Biscayne Tower на закате', en: 'One Biscayne Tower at sunset' }, status: 'pending_review', submitted_at: day(30),
      views: 0, clicks: 0, trials: 0, pays: 0, buys: [], pay_days: [], by_day: [], embed: { kind: 'tiktok', id: '' } },
    { id: 'R7T1', platform: 'tiktok', place: pl('e'), title: { ru: 'Clock Tower в Санта-Монике', en: 'Clock Tower in Santa Monica' }, status: 'rejected', reject_code: 'no_code', submitted_at: day(25),
      views: 0, clicks: 0, trials: 0, pays: 0, buys: [], pay_days: [], by_day: [], embed: { kind: 'tiktok', id: '' } },
    { id: 'U5Y3', platform: 'youtube', place: pl('f'), title: { ru: 'Marquis: где снимали', en: 'Marquis: where it was shot' }, status: 'unavailable', submitted_at: day(5),
      views: 3100, clicks: 22, trials: 1, pays: 0, buys: [], pay_days: [], by_day: spread(3100, 5, 12, 3), embed: null },
  ];
}
function videosNewbie() {
  return [
    { id: 'N1A4', platform: 'tiktok', place: pl('g'), title: { ru: 'Shark Valley: как в игре', en: 'Shark Valley, just like the game' }, status: 'awaiting_threshold', submitted_at: day(24),
      views: 2340, clicks: 31, trials: 4, pays: 1, buys: ['pass'], pay_days: [29], by_day: spread(2340, 24, 31, 3), embed: { kind: 'tiktok', id: '' } },
    { id: 'N2B7', platform: 'shorts', place: pl('h'), title: { ru: 'Колесо на пирсе', en: 'The wheel on the pier' }, status: 'submitted', submitted_at: day(31),
      views: 0, clicks: 0, trials: 0, pays: 0, buys: [], pay_days: [], by_day: [], embed: { kind: 'youtube', id: '' } },
    { id: 'N3C2', platform: 'reels', place: pl('i'), title: 'Del Perro Heights', status: 'rejected', reject_code: 'gameplay', submitted_at: day(27),
      views: 0, clicks: 0, trials: 0, pays: 0, buys: [], pay_days: [], by_day: [], embed: null },
  ];
}
const rate = (v) => RULES.rpm[v.platform] ?? 12;
function rpmCents(v) { const c = Math.round(v.views * rate(v) / 1000); return c < RULES.rpm_min_cents ? 0 : Math.min(c, RULES.rpm_cap_cents); }
function ledgerOf(videos, extra) {
  const L = []; let n = 0;
  const add = (o) => L.push({ id: 'L' + (++n), ...o });
  for (const v of videos) {
    v.buys.forEach((b, i) => add({ date: day(v.pay_days[i]), reason: 'share', amount_cents: PRICE[b], status: 'maturing', ref: v.id, plan: b }));
    const r = rpmCents(v);
    if (r && v.status === 'accruing') {
      const d10 = Math.min(31, +v.submitted_at.slice(8) + 10), half = Math.floor(r / 2);
      add({ date: day(d10), reason: 'rpm', amount_cents: half, status: 'available', ref: v.id, part: 'advance' });
      add({ date: day(d10), reason: 'rpm', amount_cents: r - half, status: v.rpm_done ? 'available' : 'maturing', ref: v.id, part: 'rest' });
    }
  }
  extra.forEach(add);
  return L.sort((a, b) => a.date.localeCompare(b.date));
}

function build(state) {
  const base = { nick: 'sunset_drive', ref_code: 'SUNSET', email: 'sunset_drive@mail.com', country: 'US', payouts: true,
    roles: ['player'], level: 'new', adult_at: '2026-10-02', pro_until: null, trial_until: null, league_unlocked: false,
    league_progress: { views: 0, goal: RULES.league_goal_views }, mod: null, accounts: [] };
  const P = { ...base }; let videos = [], ledger = [], pro_days = [];
  const accts = [{ platform: 'tiktok', status: 'verified' }, { platform: 'reels', status: 'pending' }, { platform: 'youtube', status: 'soon' }];
  if (state === 'league') {
    Object.assign(P, { roles: ['player', 'creator', 'mod', 'author'], level: 'creator', league_unlocked: true, work_pro_until: '2026-12-12',
      league_progress: { views: 120000, goal: RULES.league_goal_views }, accounts: accts,
      mod: { today: { checked: 40, accuracy: 92, cents: 40 }, stage: 'mod' } });
    videos = videosFull();
    ledger = ledgerOf(videos, [
      { date: day(4), reason: 'share', amount_cents: PRICE.month, status: 'maturing', ref: 'profile', plan: 'month' },
      { date: day(15), reason: 'task', amount_cents: 1000, status: 'available', ref: 'pair:gta6-arsht-metromover' },
      { date: day(22), reason: 'task', amount_cents: 1000, status: 'available', ref: 'pair:gta5-hedera-hotel' },
      { date: day(26), reason: 'cpa', amount_cents: 1500, status: 'maturing', ref: 'palm_route' },
      ...[[18, 130], [21, 130], [24, 130], [27, 130], [30, 132]].map(([d, c]) => ({ date: day(d), reason: 'author_fee', amount_cents: c, status: 'maturing', ref: 'place:gta6-cedar-key-dock-street' })),
    ]);
  } else if (state === 'newbie') {
    Object.assign(P, { roles: ['player', 'creator'], level: 'new', league_progress: { views: 2340, goal: RULES.league_goal_views }, accounts: accts.slice(0, 1).concat([{ platform: 'reels', status: 'none' }, { platform: 'youtube', status: 'soon' }]) });
    videos = videosNewbie();
    ledger = ledgerOf(videos, []);
  } else if (state === 'empty') {
    Object.assign(P, { roles: ['player', 'creator'], level: 'new', accounts: [{ platform: 'tiktok', status: 'none' }, { platform: 'reels', status: 'none' }, { platform: 'youtube', status: 'soon' }] });
  } else if (state === 'player') {
    Object.assign(P, { roles: ['player'], adult_at: null });
  } else if (state === 'guest') {
    Object.assign(P, { nick: null, ref_code: null, email: null, adult_at: null, roles: [] });
  } else if (state === 'minor') {
    Object.assign(P, { roles: ['player', 'author'], adult_at: null, minor: true });
    pro_days = [{ date: day(28), reason: 'friend_pro', days: 30, note: 'friend' }, { date: day(19), reason: 'friend_pro', days: 7, note: 'contrib' }];
  } else if (state === 'nopay') {
    Object.assign(P, { roles: ['player', 'creator', 'author'], country: 'RU', payouts: false, league_progress: { views: 2340, goal: RULES.league_goal_views }, accounts: accts });
    videos = videosNewbie().slice(0, 2);
    pro_days = [{ date: day(26), reason: 'friend_pro', days: 30, note: 'video' }, { date: day(19), reason: 'friend_pro', days: 7, note: 'contrib' }];
  } else if (state === 'trial') {   // пробный 72 часа: осталось 2 дня 14 ч (концепт v11)
    Object.assign(P, { roles: ['player'], adult_at: null, trial_until: inH(62) });
  } else if (state === 'trialend') {   // пробный кончился, Pro нет → codelock, карта с замком, пейвол trial_end
    Object.assign(P, { roles: ['player'], adult_at: null, trial_until: inH(-2) });
  } else if (state === 'link') {   // пришёл по ссылке креатора домен/KEYS/gta6/… — подарок и вещь из ссылки
    Object.assign(P, { roles: ['player'], adult_at: null, trial_until: inH(70), gift: { from: 'keys_hunter', days: RULES.gift_days, place: pl('a') } });
  } else if (state === 'partner') {   // стал партнёром в пробном: Лига и заработок открыты, рабочий Pro 14 дней
    Object.assign(P, { roles: ['player', 'creator'], level: 'new', adult_at: day(16), trial_until: inH(40), work_pro_until: inD(14),
      accounts: [{ platform: 'tiktok', status: 'none' }, { platform: 'reels', status: 'none' }, { platform: 'youtube', status: 'soon' }] });
  } else if (state === 'partnerend') {   // рабочий Pro кончился, принятых роликов нет: закрыт только контент Pro
    Object.assign(P, { roles: ['player', 'creator'], level: 'new', adult_at: day(1), trial_until: inH(-24 * 13), work_pro_until: inD(-2),
      league_progress: { views: 0, goal: RULES.league_goal_views },
      accounts: [{ platform: 'tiktok', status: 'verified' }, { platform: 'reels', status: 'none' }, { platform: 'youtube', status: 'soon' }] });
    videos = videosNewbie().filter((v) => v.status !== 'awaiting_threshold');
    ledger = ledgerOf(videos, []);
  } else if (state === 'renew') {   // пропуск релиза кончается через 5 дней
    Object.assign(P, { roles: ['player'], adult_at: null, pro_until: inD(5), pro_kind: 'pass' });
  } else if (state === 'pro') {   // купил год
    Object.assign(P, { roles: ['player'], adult_at: null, pro_until: inD(365), pro_kind: 'year' });
  }
  return { P, videos, ledger, pro_days, payout: null, decisions: [] };
}

let DB = null;
const db = () => (DB = DB || build(mockState()));
const wait = (v, ms = 120) => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms));
const fail = (code) => Promise.reject(Object.assign(new Error(code), { code }));
const pub = (v) => ({ id: v.id, platform: v.platform, place: v.place, title: v.title, views: v.views, author: '@' + db().P.nick, mine: true, embed: v.embed, submitted_at: v.submitted_at });
const sumBy = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

const api = {
  isMock: true,
  mockState,
  mockStates: STATES,
  /** состояние мока выбрано явно (?sbmock=…): только тогда приложение берёт доступ (Pro, пробный, подарок) из профиля мока */
  mockChosen: !!mockPick(),

  /** Профиль: { nick, ref_code, email, country, payouts, roles[], level, adult_at, pro_until, pro_kind:'year'|'pass'|'month'|'work', work_pro_until, trial_until (ISO), gift{from,days,place}|null, league_unlocked, league_progress{views,goal}, mod{today{checked,accuracy,cents},stage}, accounts[{platform,status}] } */
  getProfile: () => wait(db().P, 60),
  /** Правила и цифры (rules.json на сервере): ставки, холды, порог вывода, дата первого раунда, медиана (null до раунда) */
  getRules: () => wait(RULES, 40),

  /** Вход почтой: код на почту */
  signIn: (email) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email)) ? wait({ sent: true, email }, 300) : fail('bad_email')),
  /** Проверка кода из письма → профиль */
  verifyCode: (email, code) => {
    if (!/^\d{4,6}$/.test(String(code))) return fail('bad_code');
    const P = db().P; if (!P.email) Object.assign(P, { email, nick: String(email).split('@')[0].replace(/[^a-z0-9_]/gi, '').slice(0, 20) || 'author', ref_code: 'NEW' + Math.floor(Math.random() * 90 + 10), roles: ['player'] });
    return wait(P, 300);
  },
  /** 18+ — в момент первой денежной роли. adult=true → роль creator и код; false → дни Pro вместо денег */
  confirmAge: (adult) => {
    const P = db().P;
    if (adult) {
      P.adult_at = new Date().toISOString().slice(0, 10); P.minor = false; if (!P.roles.includes('creator')) P.roles.push('creator');
      // рабочий Pro партнёра — сразу 14 дней (решение ведения 16.10, 31 §4.3); дальше +30 дней за принятый ролик от 1 000 просмотров
      if (!P.work_pro_until || P.work_pro_until < inD(0)) P.work_pro_until = inD(RULES.partner_pro_days);
    }
    else { P.adult_at = null; P.minor = true; P.roles = P.roles.filter((r) => r !== 'creator' && r !== 'mod'); }
    return wait(P, 200);
  },

  /** Лига: { unlocked, progress{views,goal}, tasks[{ id, kind:'unlock'|'place_week'|'fresh_find'|'month_views', goal?, progress?, done?, place?{world,id}, found_by?, found_at? }], rating_after } */
  getLeague: () => {
    const { P } = db();
    const tasks = [
      { id: 't1', kind: 'unlock', goal: RULES.league_goal_views, progress: P.league_progress.views, done: P.league_unlocked },
      { id: 't2', kind: 'place_week', place: pl('a') },
      { id: 't3', kind: 'fresh_find', place: pl('g'), found_by: '@keys_hunter', found_at: day(14) },
      { id: 't4', kind: 'month_views', goal: 100000, progress: sumBy(db().videos, (v) => v.views), done: sumBy(db().videos, (v) => v.views) >= 100000 },
    ];
    return wait({ unlocked: P.league_unlocked, progress: P.league_progress, tasks, rating_after: FIRST_ROUND });
  },

  /** Код приглашения в Лигу → { ok, unlocked } (одноразовый, 30 дней) */
  redeemInvite: (code) => {
    if (!/^[A-Z0-9-]{4,12}$/i.test(String(code || '').trim())) return fail('bad_code');
    if (/^OLD/i.test(code)) return fail('expired');
    db().P.league_unlocked = true; return wait({ ok: true, unlocked: true }, 250);
  },

  /** Мои ролики: [{ id, platform, place{world,id}, title, status, reject_code?, submitted_at, views, clicks, trials, pays, earned{share_cents,rpm_cents,total_cents}, link_v }] */
  listMyVideos: () => {
    const { videos, ledger } = db();
    return wait(videos.map((v) => {
      const own = ledger.filter((x) => x.ref === v.id), share = sumBy(own.filter((x) => x.reason === 'share'), (x) => x.amount_cents), rpm = sumBy(own.filter((x) => x.reason === 'rpm'), (x) => x.amount_cents);
      const { buys, pay_days, by_day, ...rest } = v;
      return { ...rest, link_v: v.id, earned: { share_cents: share, rpm_cents: rpm, total_cents: share + rpm } };
    }));
  },
  /** Подать ролик → { id, status:'submitted', verify_code:'SB-…', link_v } */
  submitVideo: ({ url, world, place_id }) => {
    if (!/^(https?:\/\/)?(www\.|m\.|vm\.)?(tiktok\.com|youtube\.com|youtu\.be|instagram\.com|snapchat\.com)\//i.test(String(url || '').trim())) return fail('bad_url');
    if (!place_id) return fail('no_place');
    const id = Math.random().toString(36).slice(2, 6).toUpperCase();
    const platform = /tiktok/i.test(url) ? 'tiktok' : /shorts/i.test(url) ? 'shorts' : /youtu/i.test(url) ? 'youtube' : /instagram/i.test(url) ? 'reels' : 'snapchat';
    const v = { id, platform, place: { world, id: place_id }, title: '', status: 'submitted', submitted_at: new Date().toISOString().slice(0, 10), views: 0, clicks: 0, trials: 0, pays: 0, buys: [], pay_days: [], by_day: [], embed: null };
    db().videos.unshift(v);
    return wait({ id, status: 'submitted', verify_code: 'SB-' + id, link_v: id }, 350);
  },
  /** Статистика своего ролика (только автор): { id, views_by_day[{date,views}], views, clicks, trials, pays, earned{…} } */
  getVideoStats: (id) => {
    const v = db().videos.find((x) => x.id === id); if (!v) return fail('not_found');
    const own = db().ledger.filter((x) => x.ref === id);
    return wait({ id, views_by_day: v.by_day, views: v.views, clicks: v.clicks, trials: v.trials, pays: v.pays, rate_cents: rate(v),
      earned: { share_cents: sumBy(own.filter((x) => x.reason === 'share'), (x) => x.amount_cents), rpm_cents: sumBy(own.filter((x) => x.reason === 'rpm'), (x) => x.amount_cents),
        rpm_available_cents: sumBy(own.filter((x) => x.reason === 'rpm' && x.status === 'available'), (x) => x.amount_cents) } });
  },
  /** Публичная лента о месте — без сумм: [{ id, platform, place, title, views, author, mine, embed{kind,id}|null }] */
  listPlaceVideos: (world, placeId) => {
    const mine = db().videos.filter((v) => v.status === 'accruing' && v.place.world === world).map(pub);
    const others = [
      { id: 'SB01', platform: 'youtube', title: { ru: 'Игра и жизнь за 60 секунд', en: 'Game and life in 60 seconds' }, views: 128000, author: 'Secret Base', team: true, embed: { kind: 'youtube', id: '' } },
      { id: 'PR22', platform: 'reels', title: { ru: 'Вечером, с набережной', en: 'Evening, from the waterfront' }, views: 18400, author: '@palm_route', embed: null },
      { id: 'KH31', platform: 'shorts', title: { ru: 'Тот самый ракурс', en: 'The exact angle' }, views: 36000, author: '@keys_hunter', embed: { kind: 'youtube', id: '' } },
      { id: 'KH32', platform: 'snapchat', title: { ru: 'С тротуара', en: 'From the sidewalk' }, views: 9800, author: '@keys_hunter', embed: null },
    ].map((v) => ({ ...v, place: { world, id: placeId }, mine: false }));
    if (placeId && /empty/.test(placeId)) return wait([]);
    const own = mine.filter((v) => v.place.id === placeId);
    return wait([others[0], ...own, ...others.slice(1)]);
  },
  /** Ролики Лиги (сетка): те же поля, что в ленте, без сумм */
  listLeagueVideos: () => {
    const mine = db().videos.filter((v) => v.status === 'accruing').map(pub);
    const o = [
      { id: 'SB01', platform: 'youtube', place: pl('a'), title: { ru: 'Игра и жизнь за 60 секунд', en: 'Game and life in 60 seconds' }, views: 128000, author: 'Secret Base', team: true, embed: { kind: 'youtube', id: '' } },
      { id: 'PR41', platform: 'tiktok', place: pl('g'), title: { ru: 'Shark Valley на рассвете', en: 'Shark Valley at dawn' }, views: 52000, author: '@palm_route', embed: { kind: 'tiktok', id: '' } },
      { id: 'PR22', platform: 'reels', place: pl('c'), title: { ru: 'Вечером, с набережной', en: 'Evening, from the waterfront' }, views: 18400, author: '@palm_route', embed: null },
      { id: 'KH31', platform: 'shorts', place: pl('h'), title: { ru: 'Тот самый ракурс', en: 'The exact angle' }, views: 36000, author: '@keys_hunter', embed: { kind: 'youtube', id: '' } },
      { id: 'KH44', platform: 'shorts', place: pl('i'), title: { ru: 'Del Perro сверху', en: 'Del Perro from above' }, views: 14300, author: '@keys_hunter', embed: { kind: 'youtube', id: '' } },
      { id: 'KH32', platform: 'snapchat', place: pl('e'), title: { ru: 'С тротуара', en: 'From the sidewalk' }, views: 9800, author: '@keys_hunter', embed: null },
    ].map((v) => ({ ...v, mine: false }));
    return wait([o[0], mine[0], o[1], o[2], mine[1], o[3], mine[2], o[4], o[5]].filter(Boolean));
  },

  /** Заработок за месяц: { month, totals{maturing,available,paid,total}, round_date, median_cents|null, payout|null,
   *  ledger[{id,date,reason,amount_cents,status,ref,part?,plan?}], funnel{views,clicks,trials,pays}, pro_days[{date,reason,days,note}], pro_days_total } */
  getEarnings: (month = '2026-10') => {
    const { ledger, videos, payout, pro_days } = db();
    const t = (s) => sumBy(ledger.filter((x) => x.status === s), (x) => x.amount_cents);
    const totals = { maturing: t('maturing'), available: t('available'), paid: t('paid') }; totals.total = totals.maturing + totals.available + totals.paid;
    const funnel = { views: sumBy(videos, (v) => v.views), clicks: sumBy(videos, (v) => v.clicks) + (ledger.some((x) => x.ref === 'profile') ? 40 : 0),
      trials: sumBy(videos, (v) => v.trials) + (ledger.some((x) => x.ref === 'profile') ? 3 : 0), pays: ledger.filter((x) => x.reason === 'share').length };
    return wait({ month, totals, round_date: FIRST_ROUND, median_cents: RULES.median_cents, payout, ledger, funnel, pro_days, pro_days_total: sumBy(pro_days, (x) => x.days) });
  },
  /** Вывод доступного (от $25) → { status:'pending_review', amount_cents, round_date } */
  requestPayout: () => {
    const d = db(), av = sumBy(d.ledger.filter((x) => x.status === 'available'), (x) => x.amount_cents);
    if (!d.P.adult_at || !d.P.payouts) return fail('not_allowed');
    if (av < RULES.payout_min_cents) return fail('below_min');
    d.payout = { status: 'pending_review', amount_cents: av, round_date: FIRST_ROUND };
    return wait(d.payout, 300);
  },

  /** Вклад: { type:'place'|'pair'|'report'|'found', place?{world,id}|null, where?, side:'game'|'real', ref_kind, source, note } → { id, status:'pending_review' } */
  submitContribution: (c) => (c && c.type ? wait({ id: 'C' + Date.now().toString(36).toUpperCase(), status: 'pending_review' }, 300) : fail('bad_type')),

  /** Очередь проверки (модератор): [{ id, kind:'video'|'place'|'photo', place{world,id}, platform?, title?, facts[], trap? }] — ловушки ничем не отличаются */
  getReviewQueue: () => {
    if (!db().P.roles.includes('mod')) return fail('not_mod');
    return wait([
      { id: 'q1', kind: 'video', platform: 'tiktok', place: pl('g'), title: { ru: 'Shark Valley: как в игре', en: 'Shark Valley, just like the game' }, author: '@palm_route', facts: ['code_found', 'place_named'] },
      { id: 'q2', kind: 'photo', place: pl('b'), facts: ['street', 'no_people'] },
      { id: 'q3', kind: 'place', place: pl('h'), facts: ['source_link', 'side_real'] },
      { id: 'q4', kind: 'video', platform: 'shorts', place: pl('i'), title: { ru: 'Del Perro сверху', en: 'Del Perro from above' }, author: '@keys_hunter', facts: ['code_found'] },
      { id: 'q5', kind: 'photo', place: pl('e'), facts: ['street'] },
      { id: 'q6', kind: 'video', platform: 'reels', place: pl('a'), title: { ru: 'Колесо обозрения ночью', en: 'The wheel at night' }, author: '@night_owl', facts: ['code_missing'] },
    ]);
  },
  /** Решение по карточке: decision 'ok'|'no', reason_code при 'no' → { ok, today{checked,accuracy,cents} } */
  reviewDecision: (id, decision, reason_code) => {
    const m = db().P.mod; if (!m) return fail('not_mod');
    if (decision === 'no' && !reason_code) return fail('reason_required');
    m.today.checked += 1; m.today.cents += 1; db().decisions.push({ id, decision, reason_code });
    return wait({ ok: true, today: m.today }, 80);
  },
};

window.SB = window.SB || {};
window.SB.api = api;
export default api;
