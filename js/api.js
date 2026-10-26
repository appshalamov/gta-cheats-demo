// SB.api — контракт экранов креаторов с сервером (04 §2, docs/api-contract.md). Сервера пока нет: этот файл сам выбирает
// источник данных, а экраны (js/league.js) ходят только через window.SB.api и не знают, откуда данные (08 ТЗ §1, §6).
// Все методы возвращают Promise; ошибки — Error с полем code; деньги — в центах (целые), даты — ISO 'YYYY-MM-DD'.
//
// Источники (SOURCE):
//   'demo' — набор js/demo-data.js (@sunset_drive, 08 §5). Включает только экран «Для админов» после кода админа:
//            localStorage sb.demo = '1'. Режим площадки (rules.mode) тогда 'demo' — на экранах с суммами «Пример интерфейса».
//   'beta' — закрытый доступ без сервера: профиль, список ожидания, приглашение, каналы и ролики — на устройстве
//            (localStorage sb.beta.v1). rules.mode = CREATOR_MODE из config.js ('beta'): суммы «предварительные».
//   'mock' — примеры состояний для стендов (?sbmock=<имя>), ТОЛЬКО на localhost / 127.0.0.1 или при включённом demo
//            (06 В-1: в боевой сборке ?sbmock не работает). Состояния: league, newbie, empty, player, guest, minor, nopay, trial,
//            trialend, partner, partnerend, link, renew, pro; для экранов 7–9 — statuses (8 статусов ролика 02 §7.4),
//            paying (выплата в раунде), paid (выплачено); экраны 14–15 — exam, cooldown, student, paused, qempty;
//            экран 10 — wd_first, wd_kyc, wd_ready, wd_failed, wd_below (+ paying, paid).
//   потом 'server' — та же форма методов, данные из Supabase (feature/server заменит реализацию, не имена).
//
// Статусы ролика (02 §7.4): submitted → in_review → awaiting_threshold → accruing → closed; ветки rejected (reject_code),
//                     unavailable, frozen. Ролик: places[{world,id,role:'about'|'mention',at:'м:сс'}], has_gameplay, url, fmt
// Статусы начисления: maturing → available → paid / reversed
// Модератор (02 §10, 04 §1.4 mod_stats): P.mod { stage:'exam'|'cooldown'|'student'|'mod'|'paused', today{checked,accuracy,cents},
//   window{correct,total} (ловушки, скользящие 50), exam{correct,total,at}, cooldown_until, student{done,agree,need}, done_ids[] }.
//   Нет P.mod — 'none' (меньше 5 принятых вкладов) или 'exam' (5 вкладов или приглашение модератора). Решение < 2 с не засчитывается.
// Вывод (02 §7.8): P.kyc 'none'|'pending'|'verified'|'failed' (проверка личности у Whop); выплата { status:'queued'|'approved'|'sent'|'paid'|'failed' }.
//   rules.payouts_open = false в beta: экран «Вывод» — beta_off («Выплаты начнутся, когда программа откроется для всех»).
// Причины начисления: share (40% с покупки по коду), cpa ($15 за приведённого креатора), task (задание), pair (пара Скаута),
//                     queue_batch (проверки модератора), rpm (оплата просмотров), author_fee (10% автору места), friend_pro (дни Pro)
// Профиль: roles, level, adult_at, terms_at, partner_since, ref_code, pro_until, pro_kind, work_pro_until, trial_until,
// league_unlocked, gift, invited (принято приглашение в закрытый доступ), waitlist {no, joined_at, status:'joined'|'verified'},
// accounts [{id, platform:'tiktok'|'youtube'|'instagram'|'reels', status:'none'|'pending'|'verified'|'failed'|'soon', handle, url,
// verify_code}], demo (+ email, nick, country, payouts). Доступ (шаг 9): Pro — pro_until; рабочий Pro партнёра —
// work_pro_until (14 дней после подтверждения канала, +30 дней за принятый ролик от 1 000 просмотров); пробный — trial_until.

import { CREATOR_MODE, CREATOR } from './config.js';
import { demoDB, DEMO } from './demo-data.js';
import { loadPlaces } from './places.js';

const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { } } };
const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const DEMO_ON = ls.get('sb.demo') === '1';
const devGate = () => DEV || DEMO_ON;   // ?sbmock и подмена даты открытия — только здесь
const today = () => new Date().toISOString().slice(0, 10);

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
  // лимиты, раунд, апелляция, модерация (02 §7.7–§7.9, §10; 03 §5): экраны «Честные правила», экзамен и очередь берут цифры отсюда
  new_partner_cap_cents: 10000, author_cap_new_cents: 10000, author_cap_cents: 50000, big_payout_cents: 50000, payout_provider: 'Whop',
  appeal_hours: 48, review_hours: 48, rules_notice_days: 30, rpm_advance_day: 10, rpm_rest_day: 30, max_places: 5, video_code_keep_days: 7,
  mod_need_contribs: 5, mod_exam_total: 20, mod_exam_need: 16, mod_exam_cooldown_days: 7, mod_min_ms: 2000, mod_student_n: 20, mod_trap_pct: 10,
  mod_window: 50, mod_invites_month: 3, pro_days_year_cap: 60,
};
const PLACES = {   // id мест из data/map — подписи и фото экраны берут из places.js
  a: ['gta6', 'gta6-bayside-marketplace-skyviews'], b: ['gta6', 'gta6-arsht-center'], c: ['gta5', 'gta5-pleasure-pier'],
  d: ['gta6', 'gta6-one-biscayne-tower'], e: ['gta5', 'gta5-clock-tower-building'], f: ['gta6', 'gta6-marquis-grayson'],
  g: ['gta6', 'gta6-shark-valley-everglades'], h: ['gta5', 'gta5-ferris-whale'], i: ['gta5', 'gta5-del-perro-heights'],
};
const pl = (k) => ({ world: PLACES[k][0], id: PLACES[k][1] });

const STATES = ['league', 'newbie', 'empty', 'player', 'guest', 'minor', 'nopay', 'trial', 'trialend', 'partner', 'partnerend', 'link', 'renew', 'pro', 'statuses', 'paying', 'paid',
  'exam', 'cooldown', 'student', 'paused', 'qempty', 'wd_first', 'wd_kyc', 'wd_ready', 'wd_failed', 'wd_below'];
function mockPick() {
  if (!devGate()) { try { sessionStorage.removeItem('sb.mock'); } catch { } return null; }   // боевая сборка: ?sbmock не действует
  let s = null;
  try { s = new URLSearchParams(location.search).get('sbmock'); if (s) sessionStorage.setItem('sb.mock', s); } catch { }
  try { s = s || sessionStorage.getItem('sb.mock') || localStorage.getItem('sb.mock'); } catch { }
  return STATES.includes(s) ? s : null;
}
const MOCK = mockPick();
const SOURCE = MOCK ? 'mock' : DEMO_ON ? 'demo' : 'beta';
const MODE = DEMO_ON ? 'demo' : CREATOR_MODE;
// дата открытия программы для всех (08 §2.3); на стенде можно подменить: ?sbopen=2026-10-01 (только localhost / demo)
const OPEN_AT = (() => {
  if (devGate()) { try { const q = new URLSearchParams(location.search).get('sbopen'); if (q) sessionStorage.setItem('sb.open_at', q); return sessionStorage.getItem('sb.open_at') || CREATOR.open_at; } catch { } }
  return CREATOR.open_at;
})();
const mockState = () => MOCK || 'guest';

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
    { id: 'Q2W9', platform: 'tiktok', place: pl('d'), title: { ru: 'One Biscayne Tower на закате', en: 'One Biscayne Tower at sunset' }, status: 'in_review', submitted_at: day(30),
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
const rate = (v) => (v.platform === 'snapchat' ? 0 : RULES.rpm[v.platform] ?? 12);   // Snapchat — без оплаты просмотров (02 §7.3)
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
    roles: ['player'], level: 'new', adult_at: '2026-10-02', terms_at: '2026-10-02', invited: true, waitlist: null, pro_until: null, trial_until: null, league_unlocked: false,
    league_progress: { views: 0, goal: RULES.league_goal_views }, mod: null, accounts: [] };
  const P = { ...base }; let videos = [], ledger = [], pro_days = [], payout = null;
  const accts = [{ platform: 'tiktok', status: 'verified' }, { platform: 'reels', status: 'pending' }, { platform: 'youtube', status: 'soon' }];
  if (state === 'league') {
    Object.assign(P, { roles: ['player', 'creator', 'mod', 'author'], level: 'creator', league_unlocked: true, work_pro_until: '2026-12-12',
      league_progress: { views: 120000, goal: RULES.league_goal_views }, accounts: accts,
      mod: { today: { checked: 40, accuracy: 92, cents: 40 }, stage: 'mod', window: { correct: 23, total: 25 }, exam: { correct: 18, total: 20, at: day(3) }, done_ids: [] } });
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
    Object.assign(P, { nick: null, ref_code: null, email: null, adult_at: null, terms_at: null, roles: [], invited: false });
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
  } else if (state === 'statuses' || state === 'paying' || state === 'paid') {
    // стенд экранов 7–9: восемь статусов ролика (тексты 02 §7.4 — 48 200 просмотров → $5,78; итог 210 400 → $25,25, 9 покупок),
    // выплата в раунде (paying) и выплаченная (paid)
    Object.assign(P, { roles: ['player', 'creator'], level: 'creator', work_pro_until: '2026-12-12', accounts: accts, kyc: 'verified' });
    if (state === 'statuses') {
      const v = (id, st, k, views, o = {}) => ({ id, platform: 'tiktok', place: pl(k), title: '', status: st, submitted_at: day(o.d || 6), url: `tiktok.com/@sunset_drive/video/74${id}`,
        views, clicks: Math.round(views / 900), trials: Math.round(views / 2800), pays: (o.buys || []).length, buys: o.buys || [], pay_days: (o.buys || []).map((_, i) => 8 + i * 2),
        by_day: views ? spread(views, o.d || 6, 31, 6) : [], embed: null, ...o.x });
      videos = [v('S1B2', 'submitted', 'a', 0, { d: 31 }), v('S2C3', 'in_review', 'b', 0, { d: 30 }), v('S3D4', 'rejected', 'c', 0, { d: 27, x: { reject_code: 'no_code' } }),
        v('S4E5', 'awaiting_threshold', 'g', 640, { d: 25 }), v('S5F6', 'accruing', 'd', 48200, { d: 12, buys: ['pass', 'month'] }),
        v('S6G7', 'closed', 'h', 210400, { d: 1, buys: ['year', 'pass', 'month', 'year', 'pass', 'month', 'year', 'pass', 'month'] }),
        v('S7H8', 'unavailable', 'e', 3100, { d: 5 }), v('S8J9', 'frozen', 'i', 96500, { d: 9, buys: ['month'] })];
      ledger = ledgerOf(videos.map((x) => (x.status === 'closed' || x.status === 'frozen' ? { ...x, status: 'accruing', rpm_done: x.status === 'closed' } : x)), []);
      ledger.filter((x) => x.ref === 'S8J9').forEach((x) => { x.status = 'frozen'; });
    } else {
      videos = videosFull();
      ledger = ledgerOf(videos, [{ date: day(15), reason: 'pair', amount_cents: 1000, status: 'available', ref: 'pair:gta6-arsht-metromover' }]);
      const av = ledger.filter((x) => x.status === 'available');
      const amount = av.reduce((a, x) => a + x.amount_cents, 0);
      if (state === 'paying') payout = { status: 'queued', amount_cents: amount, round_date: FIRST_ROUND };   // в раунде (queued → approved → sent)
      else { av.forEach((x) => { x.status = 'paid'; }); payout = { status: 'paid', amount_cents: amount, round_date: FIRST_ROUND, paid_at: FIRST_ROUND }; }
    }
  } else if (['exam', 'cooldown', 'student', 'paused', 'qempty'].includes(state)) {
    // стенды экранов 14–15: допущен к экзамену (5 принятых вкладов), пауза после провала, ученик 7 из 20, пауза по точности, пустая очередь
    Object.assign(P, { roles: ['player', 'creator', 'author'], level: 'creator', accounts: accts.slice(0, 1) });
    if (state === 'cooldown') P.mod = { stage: 'cooldown', today: { checked: 0, accuracy: 0, cents: 0 }, window: { correct: 0, total: 0 }, exam: { correct: 15, total: 20, at: inD(-2) }, cooldown_until: inD(5), done_ids: [] };
    if (state === 'student') P.mod = { stage: 'student', today: { checked: 0, accuracy: 0, cents: 0 }, window: { correct: 0, total: 0 }, exam: { correct: 18, total: 20, at: inD(-1) }, student: { done: 7, agree: 6, need: RULES.mod_student_n }, done_ids: [] };
    if (state === 'paused') P.mod = { stage: 'paused', today: { checked: 12, accuracy: 60, cents: 8 }, window: { correct: 6, total: 10 }, exam: { correct: 17, total: 20, at: inD(-9) }, done_ids: [] };
    if (state === 'qempty') { P.roles.push('mod'); P.mod = { stage: 'mod', today: { checked: 40, accuracy: 92, cents: 40 }, window: { correct: 23, total: 25 }, exam: { correct: 18, total: 20, at: inD(-9) }, done_ids: QUEUE.map((q) => q.id) }; }
    return { P, videos, ledger, pro_days, payout, decisions: [], contributions: acceptedFive(), drafts: {} };
  } else if (/^wd_/.test(state)) {
    // стенды экрана 10 «Вывод»: доступно $31,20 (02 §7.8) или $12,40 (below); проверка личности none / pending / verified; выплата не дошла
    Object.assign(P, { roles: ['player', 'creator'], level: 'creator', work_pro_until: '2026-12-12', accounts: accts, kyc: { wd_first: 'none', wd_kyc: 'pending', wd_below: 'none' }[state] || 'verified' });
    videos = videosFull();
    ledger = ledgerOf(videos, []);
    const want = state === 'wd_below' ? 1240 : 3120, have = sumBy(ledger.filter((x) => x.status === 'available'), (x) => x.amount_cents);
    if (want > have) ledger.push({ id: 'LW', date: day(22), reason: 'pair', amount_cents: want - have, status: 'available', ref: 'pair:gta6-arsht-metromover' });
    if (state === 'wd_failed') payout = { status: 'failed', amount_cents: 3120, round_date: FIRST_ROUND, fail_code: 'details' };
  } else if (state === 'renew') {   // пропуск релиза кончается через 5 дней
    Object.assign(P, { roles: ['player'], adult_at: null, pro_until: inD(5), pro_kind: 'pass' });
  } else if (state === 'pro') {   // купил год
    Object.assign(P, { roles: ['player'], adult_at: null, pro_until: inD(365), pro_kind: 'year' });
  }
  return { P, videos, ledger, pro_days, payout, decisions: [], contributions: [], drafts: {} };
}

// ── закрытый доступ без сервера (08 §6): всё на устройстве, форма — как у сервера ──
const BKEY = 'sb.beta.v1', DKEY = 'sb.demo.db';
function freshBeta() {
  return { P: { nick: null, ref_code: null, email: null, country: null, payouts: true, roles: [], level: 'new', adult_at: null, terms_at: null,
    partner_since: null, invited: false, invite: null, waitlist: null, pro_until: null, trial_until: null, work_pro_until: null, league_unlocked: false,
    league_progress: { views: 0, goal: RULES.league_goal_views }, mod: null, kyc: 'none', accounts: [] }, videos: [], ledger: [], pro_days: [], payout: null, decisions: [], contributions: [], drafts: {} };
}
function loadStore(key) { try { const v = JSON.parse(ls.get(key) || 'null'); return v && v.P ? v : null; } catch { return null; } }
let DB = null;
const DEMO_STAGES = ['partner', 'start', 'mod', 'exam'];   // партнёр с роликами, путь с начала, модератор @palm_route, его экзамен
const demoStage = () => (DEMO_STAGES.includes(ls.get('sb.demo.stage')) ? ls.get('sb.demo.stage') : 'partner');
const db = () => (DB = DB || (SOURCE === 'mock' ? build(mockState()) : SOURCE === 'demo' ? (loadStore(DKEY) || demoDB(demoStage())) : (loadStore(BKEY) || freshBeta())));
// изменения профиля и роликов переживают перезагрузку (beta — до сервера, demo — до «Сбросить демо» у админа)
const persist = () => { if (SOURCE === 'beta') ls.set(BKEY, JSON.stringify(db())); else if (SOURCE === 'demo') ls.set(DKEY, JSON.stringify(db())); };
const wait = (v, ms = 120) => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms));
const fail = (code) => Promise.reject(Object.assign(new Error(code), { code }));
const pub = (v) => ({ id: v.id, platform: v.platform, place: v.place, title: v.title, views: v.views, author: '@' + db().P.nick, mine: true, embed: v.embed, submitted_at: v.submitted_at });
const sumBy = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const addDays = (iso, n) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const NOPAY = ['RU', 'BY'];

// ── задания и вклады (08 ТЗ §3 №11–13, §4; 02 §6) ──
// Задание (GET /tasks, таблица tasks 04 §1.4): { id, kind, section:'all'|'partner'|'league', world, type? (вид вклада), place?, title?, platforms?,
//   threshold_views?, reward_cents?, slots?, slots_left?, starts_at?, ends_at?, found_by?, found_at?,
//   reward { name?:'check'|'found'|'photo'|'frame'|'free_photo', pro_days?, author_pct?, cents?, per?:'pair'|'decision', rpm?, share_pct?, pin_days?,
//            fixed_cents?, threshold_views?, video_pro_days?, preliminary },
//   state:'open'|'in_progress'|'sent'|'accepted'|'rejected'|'locked', lock? { code, n?, need?, date? }, claim? { kind:'contribution'|'video', id, status, reject_code, trace } }
// Виды заданий: found, fix, new_place, new_egg, game_frame, free_photo (раздел А); place_week, fresh_find, mention3, need_pair, review (Б); league_fixed (В).
// Вклад (POST/GET /contributions): { id, type:'found'|'fix'|'new_place'|'new_egg'|'free_photo'|'pair'|'game_frame', task_id?, place|null,
//   payload { name, what, where, lat, lon, reason, note, vote, photo (уменьшенный снимок) }, source_url, status:'in_review'|'accepted'|'rejected',
//   reject_code, reward, trace { kind:'opens'|'compares'|'frame_compares'|'fixed_for'|'votes', n, need?, period?, videos? }, created_at, decided_at }
// Черновик — только на устройстве (saveDraft / getDrafts / clearDraft): переживает вход почтой и перезагрузку, отправляется после входа.
const RELEASE6 = '2026-11-19';   // GTA 6: до выхода нет своих кадров из игры
const TASKS = [
  { id: 'a-found-6', kind: 'found', section: 'all', world: 'gta6', type: 'found', place: { world: 'gta6', id: 'gta6-bayside-marketplace-skyviews' } },
  { id: 'a-fix-6', kind: 'fix', section: 'all', world: 'gta6', type: 'fix', place: { world: 'gta6', id: 'gta6-little-haiti-ne60-mural' } },
  { id: 'a-new-6', kind: 'new_place', section: 'all', world: 'gta6', type: 'new_place' },
  { id: 'a-egg-6', kind: 'new_egg', section: 'all', world: 'gta6', type: 'new_egg' },
  { id: 'a-frame-6', kind: 'game_frame', section: 'all', world: 'gta6', type: 'game_frame', place: { world: 'gta6', id: 'gta6-fisher-island' } },
  { id: 'a-free-6', kind: 'free_photo', section: 'all', world: 'gta6', type: 'free_photo', place: { world: 'gta6', id: 'gta6-stuart-yard' } },
  { id: 'a-found-5', kind: 'found', section: 'all', world: 'gta5', type: 'found', place: { world: 'gta5', id: 'gta5-pleasure-pier' } },
  { id: 'a-fix-5', kind: 'fix', section: 'all', world: 'gta5', type: 'fix', place: { world: 'gta5', id: 'gta5-bay-city-incline' } },
  { id: 'a-new-5', kind: 'new_place', section: 'all', world: 'gta5', type: 'new_place' },
  { id: 'a-egg-5', kind: 'new_egg', section: 'all', world: 'gta5', type: 'new_egg' },
  { id: 'a-frame-5', kind: 'game_frame', section: 'all', world: 'gta5', type: 'game_frame', place: { world: 'gta5', id: 'gta5-vinewood-walk-of-fame' } },
  { id: 'a-free-5', kind: 'free_photo', section: 'all', world: 'gta5', type: 'free_photo', place: { world: 'gta5', id: 'gta5-rancho' } },
  { id: 'b-week-6', kind: 'place_week', section: 'partner', world: 'gta6', place: { world: 'gta6', id: 'gta6-providence-canyon' } },
  { id: 'b-fresh-6', kind: 'fresh_find', section: 'partner', world: 'gta6', place: { world: 'gta6', id: 'gta6-shark-valley-everglades' }, found_by: '@keys_hunter', found_at: '2026-11-14' },
  { id: 'b-week-5', kind: 'place_week', section: 'partner', world: 'gta5', place: { world: 'gta5', id: 'gta5-del-perro-pier' } },
  { id: 'b-fresh-5', kind: 'fresh_find', section: 'partner', world: 'gta5', place: { world: 'gta5', id: 'gta5-chumash' }, found_by: '@palm_route', found_at: '2026-11-12' },
  { id: 'b-three', kind: 'mention3', section: 'partner', world: '*' },
  { id: 'b-pair-6', kind: 'need_pair', section: 'partner', world: 'gta6', type: 'pair', place: { world: 'gta6', id: 'gta6-no-name-pub' } },
  { id: 'b-pair-5', kind: 'need_pair', section: 'partner', world: 'gta5', type: 'pair', place: { world: 'gta5', id: 'gta5-vinewood-police-station' } },
  { id: 'b-review', kind: 'review', section: 'partner', world: '*' },
  // Лига (02 §6.2 В): создаёт оператор; сумма видна только партнёру, «$30 при 20 000 просмотров» — без «до»
  { id: 'c-miami5', kind: 'league_fixed', section: 'league', world: '*', title: { ru: 'Ролик о 5 местах Майами до 19 ноября', en: 'A video about 5 Miami places by November 19' },
    places_n: 5, platforms: ['tiktok', 'shorts', 'reels'], threshold_views: 20000, reward_cents: 3000, slots: 20, slots_left: 12, ends_at: '2026-11-19' },
  { id: 'c-keys', kind: 'league_fixed', section: 'league', world: '*', title: { ru: 'Мосты Оверсиз-хайвей: ролик о 3 мостах', en: 'Overseas Highway bridges: a video about 3 bridges' },
    places_n: 3, platforms: ['tiktok', 'shorts'], threshold_views: 10000, reward_cents: 1500, slots: 10, slots_left: 10, starts_at: '2026-11-19' },
];
const isPartnerP = (P) => !!(P.roles.includes('creator') && P.adult_at);
// награда задания по режиму (08 §4): beta — имя на карте и «предварительные» суммы; demo и live — по ставкам.
// «Кадр из игры» — НИКОГДА без денег: права на кадры игры у издателя (красная линия, check_code.py правило 13)
function rewardOf(kind, P) {
  const live = MODE !== 'beta', money = isPartnerP(P) && P.payouts !== false && !P.minor, pre = !live;
  switch (kind) {
    case 'found': return { name: 'check' };
    case 'fix': return { name: 'found', ...(live ? { pro_days: 1 } : {}) };
    case 'new_place': case 'new_egg': return { name: 'found', ...(live ? { pro_days: 7 } : {}), ...(live && money ? { author_pct: RULES.author_fee_pct } : {}) };
    case 'game_frame': return { name: 'frame', ...(live ? { pro_days: 2 } : {}) };
    case 'free_photo': return { name: 'free_photo', ...(live ? { pro_days: 2 } : {}) };
    case 'need_pair': case 'pair': return live && P.payouts !== false && !P.minor ? { name: 'photo', cents: RULES.scout_pair_cents, per: 'pair' } : { name: 'photo' };
    case 'review': return P.payouts === false || P.minor ? {} : { cents: RULES.mod_decision_cents, per: 'decision', preliminary: pre };
    case 'place_week': case 'fresh_find': case 'mention3':
      if (P.payouts === false || P.minor) return { video_pro_days: RULES.partner_pro_per_video_days, threshold_views: RULES.partner_pro_min_views };
      return { rpm: true, share_pct: RULES.share_pct, preliminary: pre, ...(kind === 'fresh_find' ? { pin_days: 30 } : {}) };
    default: return {};
  }
}
function leagueReward(t, P) {
  if (P.payouts === false || P.minor) return { video_pro_days: RULES.partner_pro_per_video_days, threshold_views: RULES.partner_pro_min_views };
  return isPartnerP(P) ? { fixed_cents: t.reward_cents, threshold_views: t.threshold_views, preliminary: MODE === 'beta' } : { threshold_views: t.threshold_views };
}
const contribs = () => (db().contributions = db().contributions || []);
const draftsOf = () => (db().drafts = db().drafts || {});
const sameRef = (a, b) => !!(a && b && a.world === b.world && a.id === b.id);
function lockOf(t, P) {
  const access = programOpen() || !!P.invited, partner = isPartnerP(P), acc = contribs().filter((c) => c.status === 'accepted').length;
  if (t.section === 'all') return t.kind === 'game_frame' && t.world === 'gta6' && today() < RELEASE6 ? { code: 'release', date: RELEASE6 } : null;
  if (P.minor) return { code: 'adult' };
  if (!access) return { code: 'invite' };
  if (!partner) return { code: 'partner' };
  if (t.kind === 'need_pair' && !P.roles.includes('scout') && acc < 5) return { code: 'scout', n: acc, need: 5 };
  if (t.kind === 'review' && !P.roles.includes('mod')) return { code: 'mod' };
  if (t.section === 'league' && !P.league_unlocked) return { code: 'league', n: P.league_progress?.views || 0, need: RULES.league_goal_views };
  if (t.starts_at && today() < t.starts_at) return { code: 'starts', date: t.starts_at };
  return null;
}
const C_STATE = { in_review: 'sent', pending_review: 'sent', accepted: 'accepted', rejected: 'rejected' };
const V_STATE = (s) => (['submitted', 'in_review', 'pending_review'].includes(s) ? 'sent' : s === 'rejected' ? 'rejected' : 'accepted');
function claimOf(t) {
  if (t.type) {
    const c = contribs().filter((x) => x.type === t.type && (!t.place || sameRef(x.place, t.place))).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
    return c ? { kind: 'contribution', id: c.id, status: c.status, state: C_STATE[c.status] || 'sent', reject_code: c.reject_code || null, trace: c.trace || null, place: c.place } : null;
  }
  const vs = db().videos.filter((v) => (t.kind === 'mention3' ? placesOfVideo(v).length >= 3 : t.kind === 'league_fixed' ? v.task_id === t.id : t.place && placesOfVideo(v).some((x) => sameRef(x, t.place))));
  const v = vs.sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)))[0];
  return v ? { kind: 'video', id: v.id, status: v.status === 'pending_review' ? 'in_review' : v.status, state: V_STATE(v.status), reject_code: v.reject_code || null } : null;
}
const NEED_SOURCE = ['new_place', 'new_egg'], NEED_PHOTO = ['pair', 'game_frame'], NEED_PLACE = ['found', 'fix', 'pair', 'game_frame', 'free_photo'];
const FIX_REASONS = ['wrong_spot', 'closed', 'wrong_building', 'no_coords', 'violation'];
const near = (a, b) => { const k = Math.PI / 180, x = (b.lon - a.lon) * k * Math.cos((a.lat + b.lat) / 2 * k), y = (b.lat - a.lat) * k; return Math.sqrt(x * x + y * y) * 6371e3; };
const normName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, ' ').trim();

// ── хэши кодов (config.js → CREATOR, tools/make_invites.py): PBKDF2-SHA256 50 000, коды приглашений — HMAC от кода админа ──
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const enc = (x) => new TextEncoder().encode(x);
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
async function kdf(code, salt, bytes) {
  const k = await crypto.subtle.importKey('raw', enc(code), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc(salt), iterations: 50000 }, k, bytes * 8));
}
async function inviteCode(admin, i) {
  const k = await crypto.subtle.importKey('raw', enc(admin), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const b = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc('sb-invite:' + i)));
  return 'SB-' + [...b.slice(0, 6)].map((x) => ALPHA[x % 32]).join('');
}
const normCode = (c) => String(c || '').toUpperCase().replace(/[\s_]/g, '').replace(/^SB(?!-)/, 'SB-');
const INVITE_RE = /^SB-[A-Z0-9]{6}$/;
const usedInvites = () => { try { return JSON.parse(ls.get('sb.inv.used') || '[]'); } catch { return []; } };
// приглашение: { status: 'ok' | 'not_found' | 'used' | 'expired', until }
async function checkInvite(code) {
  const c = normCode(code);
  if (!INVITE_RE.test(c)) return { status: 'not_found' };
  if (SOURCE !== 'beta') {   // demo и стенды: коды для показа (demo-data.js) + настоящие
    if (DEMO.invites.ok.includes(c)) return { status: 'ok', until: '2026-12-31' };
    if (DEMO.invites.used.includes(c)) return { status: 'used' };
    if (DEMO.invites.expired.includes(c)) return { status: 'expired' };
  }
  let h; try { h = await kdf(c, 'sb-invite-v1', 8); } catch { return { status: 'not_found' }; }
  const batch = CREATOR.invites.find(([, hs]) => hs.split(' ').includes(h));
  if (!batch) return { status: 'not_found' };
  if (usedInvites().includes(h)) return { status: 'used' };
  if (batch[0] < today()) return { status: 'expired', until: batch[0] };
  return { status: 'ok', until: batch[0], h };
}
// ── экран «Для админов»: вход по коду админа (хэш в config.js), код хранится только на устройстве админа ──
const adminCode = () => ls.get('sb.admin');
let adminOK = null;
async function isAdmin() {
  if (adminOK !== null) return adminOK;
  const c = adminCode(); if (!c) return (adminOK = false);
  try { adminOK = (await kdf(c, 'sb-admin-v1', 32)) === CREATOR.admin; } catch { adminOK = false; }
  return adminOK;
}
const created = () => { try { return JSON.parse(ls.get('sb.admin.invites') || '[]'); } catch { return []; } };
// подтверждение канала — код для описания профиля; в demo — SB-7F3K (08 ТЗ §3, 02 §7.1)
const verifyCodeFor = () => (SOURCE === 'beta' ? 'SB-' + Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * 32)]).join('') : DEMO.verify_code);
function setAccount(acc, status) {
  const P = db().P; acc.status = status;
  if (status === 'verified') {
    acc.verified_at = today();
    if (P.waitlist) P.waitlist.status = 'verified';
    // рабочий Pro на 14 дней после подтверждения (02 §7.1), только партнёру
    if (P.roles.includes('creator')) {
      // demo «с начала»: подтвердил канал — дальше это @sunset_drive с роликами за ноябрь, «Рабочий Pro до 9 ноября»
      if (SOURCE === 'demo' && db().stage === 'start') { demoFinish(); P.accounts = [acc, ...P.accounts.filter((x) => x.platform !== acc.platform)]; return; }
      const w = addDays(today(), RULES.partner_pro_days);
      if (!P.work_pro_until || P.work_pro_until < w) P.work_pro_until = w;
    }
  }
}
const programOpen = () => MODE === 'live' || today() >= OPEN_AT;
function signInLocal(P, email) {
  const e = String(email).trim(), nick = e.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'author';
  const code = nick.replace(/[^a-z0-9]/g, '').toUpperCase().slice(0, 8) || 'AUTHOR';
  Object.assign(P, { email: e, nick: P.nick || nick, ref_code: P.ref_code || code });
  if (!P.roles.includes('player')) P.roles.unshift('player');
  // demo «с начала»: вход — это и есть @sunset_drive из набора
  if (SOURCE === 'demo') Object.assign(P, { email: 'sunset_drive@mail.com', nick: 'sunset_drive', ref_code: 'SUNSET' });
}
// demo «с начала»: после «Готово» персонаж — партнёр с роликами за ноябрь (тот же набор, что в режиме «партнёр»)
function demoFinish() { const full = demoDB('partner'); Object.assign(db().P, { ...full.P, work_pro_until: DEMO.work_pro_first }); db().stage = 'partner'; persist(); }
const PLAT_RE = { tiktok: /tiktok\.com\/@?[\w.]+/i, youtube: /(youtube\.com\/(@|c\/|channel\/)[\w.-]+|youtu\.be)/i, instagram: /instagram\.com\/[\w.]+/i };
// ссылка на ролик → { platform, fam, id }: семейство youtube одно у YouTube и Shorts (один ролик нельзя подать дважды, 02 §7.3)
function videoIdOf(url) {
  const u = String(url || '').trim().replace(/^https?:\/\//i, '').replace(/^(www\.|m\.|vm\.)/i, '');
  let m;
  if ((m = u.match(/^tiktok\.com\/@[\w.]+\/video\/(\d{6,})/i)) || (m = u.match(/^tiktok\.com\/t\/(\w{5,})/i))) return { platform: 'tiktok', fam: 'tiktok', id: m[1] };
  if ((m = u.match(/^youtube\.com\/shorts\/([\w-]{6,})/i))) return { platform: 'shorts', fam: 'youtube', id: m[1] };
  if ((m = u.match(/^youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/i)) || (m = u.match(/^youtu\.be\/([\w-]{6,})/i))) return { platform: 'youtube', fam: 'youtube', id: m[1] };
  if ((m = u.match(/^instagram\.com\/(?:reels?|p)\/([\w-]{5,})/i))) return { platform: 'reels', fam: 'instagram', id: m[1] };
  if ((m = u.match(/^snapchat\.com\/(?:spotlight|t)\/([\w-]{5,})/i))) return { platform: 'snapchat', fam: 'snapchat', id: m[1] };
  return null;
}
const fmtOf = (platform) => (platform === 'youtube' ? 'h' : 'v');
const placesOfVideo = (v) => (v.places && v.places.length ? v.places : v.place ? [{ ...v.place, role: 'about' }] : []).map((x) => ({ world: x.world, id: x.id, role: x.role || x.as || 'about', ...(x.at ? { at: x.at } : {}), status: x.status || 'ok' }));
const handleOf = (url) => '@' + (String(url).replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop() || '').replace(/^@/, '');

// ── модерация (02 §10, 03 §5.3): банк экзамена (20 карточек вперемешку: ролики, места, фото) и очередь (10% — ловушки).
// Правильный ответ и пометка ловушки — только здесь (на сервере — review_items.trap_answer), экран их не получает: ловушки ничем не отличаются.
// facts — что модератор видит на карточке; *_missing — нарушение (красный значок). Место — только с фото из жизни (кадр игры крупно не ставим).
const Q = (id, kind, world, pid, facts, answer, o = {}) => ({ id, kind, place: { world, id: pid }, facts, answer, ...o });
const V = (ru, en) => ({ ru, en });
const EXAM = [
  Q('E01', 'video', 'gta6', 'gta6-wynwood-walls', ['code_found', 'disclosure_ok', 'place_at'], 'ok', { platform: 'tiktok', title: V('Стены Винвуда в жизни', 'Wynwood Walls in real life'), at: '0:12' }),
  Q('E02', 'video', 'gta6', 'gta6-portmiami', ['code_missing', 'disclosure_ok'], 'no', { platform: 'shorts', title: V('Порт Майами с воды', 'PortMiami from the water') }),
  Q('E03', 'photo', 'gta6', 'gta6-cardozo', ['street', 'no_people', 'license_ok'], 'ok'),
  Q('E04', 'place', 'gta6', 'gta6-coconut-grove', ['source_link', 'side_real'], 'ok'),
  Q('E05', 'photo', 'gta5', 'gta5-vinewood-sign', ['streetview_missing'], 'no'),
  Q('E06', 'video', 'gta5', 'gta5-pleasure-pier', ['code_found', 'disclosure_missing'], 'no', { platform: 'reels', title: V('Пирс на закате', 'The pier at sunset') }),
  Q('E07', 'photo', 'gta6', 'gta6-espanola-way', ['street', 'same_angle', 'no_people'], 'ok'),
  Q('E08', 'place', 'gta5', 'gta5-kortz-center', ['source_missing'], 'no'),
  Q('E09', 'video', 'gta5', 'gta5-galileo-observatory', ['code_found', 'disclosure_ok', 'place_at'], 'ok', { platform: 'youtube', title: V('Обсерватория из игры', 'The observatory from the game'), at: '1:04' }),
  Q('E10', 'photo', 'gta5', 'gta5-legion-square', ['faces_missing'], 'no'),
  Q('E11', 'video', 'gta6', 'gta6-old-seven-mile-bridge', ['code_found', 'disclosure_ok', 'place_missing'], 'no', { platform: 'tiktok', title: V('Старый мост в Кис', 'The old bridge in the Keys'), at: '0:40' }),
  Q('E12', 'photo', 'gta6', 'gta6-tides', ['license_ok', 'street'], 'ok'),
  Q('E13', 'place', 'gta6', 'gta6-brickell-key', ['source_link', 'side_real'], 'ok'),
  Q('E14', 'photo', 'gta5', 'gta5-maze-bank-tower', ['game_missing'], 'no'),
  Q('E15', 'video', 'gta6', 'gta6-bayfront-park', ['code_found', 'disclosure_ok', 'place_named'], 'ok', { platform: 'shorts', title: V('Парк у залива', 'The bayfront park') }),
  Q('E16', 'place', 'gta5', 'gta5-ten-cent-theater', ['dup_place_missing'], 'no'),
  Q('E17', 'photo', 'gta6', 'gta6-colony-hotel', ['street', 'no_people', 'same_angle'], 'ok'),
  Q('E18', 'video', 'gta5', 'gta5-del-perro-heights', ['code_found', 'private_missing'], 'no', { platform: 'tiktok', title: V('Двор у башни', 'The courtyard by the tower') }),
  Q('E19', 'photo', 'gta5', 'gta5-vespucci-canals', ['license_ok', 'no_people'], 'ok'),
  Q('E20', 'video', 'gta6', 'gta6-hotel-victor', ['code_found', 'disclosure_ok', 'place_at'], 'ok', { platform: 'youtube', title: V('Отель на Оушен-драйв', 'The hotel on Ocean Drive'), at: '0:33' }),
];
const QUEUE = [
  Q('q1', 'video', 'gta6', 'gta6-shark-valley-everglades', ['code_found', 'place_named'], 'ok', { platform: 'tiktok', title: V('Shark Valley: как в игре', 'Shark Valley, just like the game'), author: '@keys_hunter' }),
  Q('q2', 'photo', 'gta6', 'gta6-arsht-center', ['street', 'no_people'], 'ok'),
  Q('q3', 'place', 'gta5', 'gta5-ferris-whale', ['source_link', 'side_real'], 'ok'),
  Q('q4', 'video', 'gta5', 'gta5-del-perro-heights', ['code_found'], 'ok', { platform: 'shorts', title: V('Del Perro сверху', 'Del Perro from above'), author: '@keys_hunter' }),
  Q('q5', 'photo', 'gta5', 'gta5-clock-tower-building', ['streetview_missing'], 'no', { trap: true }),
  Q('q6', 'video', 'gta6', 'gta6-bayside-marketplace-skyviews', ['code_missing'], 'no', { platform: 'reels', title: V('Колесо обозрения ночью', 'The wheel at night'), author: '@night_owl' }),
  Q('q7', 'photo', 'gta6', 'gta6-beacon-hotel', ['street', 'same_angle'], 'ok'),
  Q('q8', 'place', 'gta6', 'gta6-design-district', ['source_link'], 'ok'),
  Q('q9', 'video', 'gta5', 'gta5-vespucci-beach', ['code_found', 'disclosure_ok', 'place_at'], 'ok', { platform: 'tiktok', title: V('Пляж Веспуччи утром', 'Vespucci Beach in the morning'), author: '@night_owl', at: '0:18' }),
  Q('q10', 'photo', 'gta5', 'gta5-hedera-hotel', ['license_ok', 'street'], 'ok'),
];
const card = (q) => { const { answer, trap, ...pub } = q; return pub; };   // наружу — без ответа и без пометки ловушки
// 5 принятых вкладов — допуск к экзамену (стенды и demo-этап «exam»)
function acceptedFive() {
  const c = (id, type, world, pid, n) => ({ id, type, place: { world, id: pid }, payload: {}, status: 'accepted', reward: { name: type === 'found' ? 'check' : 'found', pro_days: type === 'found' ? 0 : 1 },
    trace: type === 'found' ? { kind: 'votes', n: 3, need: 3 } : { kind: 'fixed_for', n }, created_at: day(n % 20 + 2), decided_at: day(n % 20 + 3) });
  return [c('M1', 'fix', 'gta6', 'gta6-cardozo', 1200), c('M2', 'found', 'gta6', 'gta6-tides', 3), c('M3', 'fix', 'gta5', 'gta5-legion-square', 640), c('M4', 'found', 'gta5', 'gta5-pleasure-pier', 7), c('M5', 'fix', 'gta6', 'gta6-colony-hotel', 380)];
}
const accOf = (m) => (m.window?.total ? Math.round(m.window.correct / m.window.total * 100) : m.today?.accuracy || 0);
function modOf(P) {
  if (P.mod) {
    if (P.mod.stage === 'cooldown' && P.mod.cooldown_until && today() >= P.mod.cooldown_until) P.mod.stage = 'exam';
    return P.mod;
  }
  const n = contribs().filter((c) => c.status === 'accepted').length;
  return { stage: n >= RULES.mod_need_contribs || P.mod_invite ? 'exam' : 'none', accepted: n };
}
const KYC_WAIT = 4000;   // demo: проверка личности «проходит» сама через 4 с, как подтверждение канала
function kycTick(P) { if (SOURCE === 'demo' && P.kyc === 'pending' && Date.now() - (P.kyc_at || 0) > KYC_WAIT) { P.kyc = 'verified'; persist(); } }

const api = {
  isMock: true,   // сервера нет: данные на устройстве, в demo — набор, на стенде — ?sbmock
  mockState,
  mockStates: STATES,
  /** профиль из SB.api задаёт доступ в приложении (app.js): Pro, рабочий Pro, пробный, подарок. Новый человек — гость, без чужого профиля */
  useProfile: true,
  mockChosen: !!MOCK,

  /** Профиль: { nick, ref_code, email, country, payouts, roles[], level, adult_at, pro_until, pro_kind:'year'|'pass'|'month'|'work', work_pro_until, trial_until (ISO), gift{from,days,place}|null, league_unlocked, league_progress{views,goal}, mod{today{checked,accuracy,cents},stage}, accounts[{platform,status}] } */
  getProfile: () => { kycTick(db().P); return wait({ ...db().P, demo: MODE === 'demo' }, 60); },
  /** Правила и цифры (rules.json на сервере): ставки, холды, порог вывода, дата первого раунда, медиана (null до раунда) */
  // payouts_open: выплаты идут (live; demo и стенды показывают путь целиком). В beta — false: экран «Вывод» в состоянии beta_off (08 §2.4)
  getRules: () => wait({ ...RULES, mode: MODE, open_at: OPEN_AT, payouts_open: MODE !== 'beta' || SOURCE === 'mock', ...(SOURCE === 'demo' ? { first_round: DEMO.first_round } : {}) }, 40),

  /** Вход почтой: код на почту */
  // В закрытом доступе без сервера письмо с кодом не уходит: вход — по принятому приглашению (08 §6), ответ { sent:false, signed_in:true }.
  signIn: (email) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) return fail('bad_email');
    if (SOURCE === 'mock') return wait({ sent: true, email }, 300);
    const P = db().P; signInLocal(P, email); persist();
    return wait({ sent: false, signed_in: true, email }, 250);
  },
  /** Проверка кода из письма → профиль */
  verifyCode: (email, code) => {
    if (!/^\d{4,6}$/.test(String(code))) return fail('bad_code');
    const P = db().P; if (!P.email) signInLocal(P, email); persist();
    return wait(P, 300);
  },
  /** «Стать партнёром», шаг 18+ (02 §7.1 п. 2). adult=false → дни Pro вместо денег (minor). Роль creator — после правил и страны */
  confirmAge: (adult) => {
    const P = db().P;
    if (adult) { P.adult_at = today(); P.minor = false; }
    else { P.adult_at = null; P.minor = true; P.roles = P.roles.filter((r) => r !== 'creator' && r !== 'mod'); }
    persist(); return wait(P, 200);
  },
  /** Правила партнёрства приняты (02 §7.1 п. 3) → partner_terms_accepted_at */
  acceptTerms: () => { const P = db().P; if (!P.adult_at) return fail('need_age'); P.terms_at = today(); persist(); return wait(P, 150); },
  /** Страна и роль партнёра (02 §7.1 п. 4): РФ, РБ — payouts:false, вместо денег дни Pro. Бесплатно, без покупки (07 §3, решение B) */
  becomePartner: ({ country } = {}) => {
    const P = db().P;
    if (!P.adult_at) return fail('need_age'); if (!P.terms_at) return fail('need_terms');
    const c = String(country || P.country || 'US').toUpperCase();
    Object.assign(P, { country: c, payouts: !NOPAY.includes(c), partner_since: P.partner_since || today(), level: P.level || 'new' });
    if (!P.roles.includes('creator')) P.roles.push('creator');
    // канал подтвердили ещё в списке ожидания — рабочий Pro начинается сейчас
    if ((P.accounts || []).some((a) => a.status === 'verified') && !P.work_pro_until) P.work_pro_until = addDays(today(), RULES.partner_pro_days);
    persist(); return wait(P, 200);
  },
  /** Подтверждение канала (02 §7.1 п. 5): { platform:'tiktok'|'youtube'|'instagram', url } → { id, status:'pending', verify_code, handle }.
   *  Сервер ищет код в описании профиля (YouTube — Data API, TikTok и Instagram — оператор). Без сервера — отметка на экране «Для админов»;
   *  в demo — подтверждается сам через несколько секунд. Ошибки: bad_platform, bad_url */
  verifyAccount: ({ platform, url } = {}) => {
    if (!PLAT_RE[platform]) return fail('bad_platform');
    if (!PLAT_RE[platform].test(String(url || ''))) return fail('bad_url');
    const P = db().P; P.accounts = (P.accounts || []).filter((a) => !(a.platform === platform && a.status !== 'verified'));
    const acc = { id: 'A' + Date.now().toString(36).toUpperCase(), platform, url: String(url).trim().replace(/^https?:\/\//, ''), handle: handleOf(url), verify_code: verifyCodeFor(), status: 'pending', at: today() };
    P.accounts.push(acc); persist();
    if (SOURCE !== 'beta' && !/fail/i.test(url)) setTimeout(() => { setAccount(acc, 'verified'); persist(); }, 4000);   // demo: «проверили за несколько минут»
    else if (SOURCE !== 'beta') setTimeout(() => { setAccount(acc, 'failed'); persist(); }, 4000);
    return wait(acc, 300);
  },
  /** Список ожидания (08 §2.1): { email, platforms[], profile_url? } → { no, joined_at, status:'joined'|'verified' }. Ошибка bad_email */
  joinWaitlist: ({ email, platforms = [], profile_url = '' } = {}) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email || ''))) return fail('bad_email');
    const P = db().P;
    if (!P.waitlist) {
      const no = SOURCE === 'beta' ? CREATOR.waitlist_count + 1 : DEMO.waitlist_no;
      P.waitlist = { no, joined_at: today(), email: String(email).trim(), platforms, profile_url: String(profile_url || '').trim(), status: (P.accounts || []).some((a) => a.status === 'verified') ? 'verified' : 'joined' };
      if (SOURCE === 'beta' && CREATOR.waitlist_endpoint) {   // Cloudflare-форма на почту админа (адрес — только из config.js)
        try { fetch(CREATOR.waitlist_endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ email: P.waitlist.email, platforms: platforms.join(','), profile: P.waitlist.profile_url }) }).catch(() => { }); } catch { }
      }
      persist();
    }
    return wait(P.waitlist, 300);
  },

  /** Лига: { unlocked, progress{views,goal}, tasks[{ id, kind:'unlock'|'place_week'|'fresh_find'|'month_views', goal?, progress?, done?, place?{world,id}, found_by?, found_at? }], rating_after } */
  getLeague: () => {
    const { P } = db();
    const tasks = [
      { id: 't1', kind: 'unlock', goal: RULES.league_goal_views, progress: P.league_progress.views, done: P.league_unlocked },
      { id: 't2', kind: 'place_week', place: SOURCE === 'demo' ? { world: 'gta6', id: 'gta6-providence-canyon' } : pl('a') },   // demo: место недели — ролик R8TW
      { id: 't3', kind: 'fresh_find', place: pl('g'), found_by: '@keys_hunter', found_at: day(14) },
      { id: 't4', kind: 'month_views', goal: 100000, progress: sumBy(db().videos, (v) => v.views), done: sumBy(db().videos, (v) => v.views) >= 100000 },
    ];
    return wait({ unlocked: P.league_unlocked, progress: P.league_progress, tasks, rating_after: FIRST_ROUND });
  },

  /** Код приглашения. SB- + 6 знаков — закрытый доступ (08 §2.2) → { ok, kind:'beta' }; ошибки not_found, used, expired.
   *  Другие коды — приглашение в Лигу → { ok, unlocked } (одноразовый, 30 дней); ошибки bad_code, expired */
  redeemInvite: async (code) => {
    const c = normCode(code);
    if (/^SB-/.test(c)) {
      const r = await checkInvite(c);
      if (r.status !== 'ok') return fail(r.status);
      const P = db().P; P.invited = true; P.invite = { at: today(), until: r.until };
      if (r.h) ls.set('sb.inv.used', JSON.stringify([...usedInvites(), r.h]));
      persist(); return wait({ ok: true, kind: 'beta' }, 200);
    }
    if (!/^[A-Z0-9-]{4,12}$/i.test(String(code || '').trim())) return fail('bad_code');
    if (/^OLD/i.test(code)) return fail('expired');
    db().P.league_unlocked = true; persist(); return wait({ ok: true, unlocked: true }, 250);
  },

  /** Мои ролики: [{ id, platform, fmt, place{world,id}, places[{world,id,role,at}], title, status, reject_code?, submitted_at, url, has_gameplay,
   *  views, clicks, trials, pays, rate_cents, earned{share_cents,rpm_cents,total_cents}, link_v }]. Статусы — 02 §7.4 (8 штук) */
  listMyVideos: () => {
    const { videos, ledger } = db();
    return wait(videos.map((v) => {
      const own = ledger.filter((x) => x.ref === v.id), share = sumBy(own.filter((x) => x.reason === 'share'), (x) => x.amount_cents), rpm = sumBy(own.filter((x) => x.reason === 'rpm'), (x) => x.amount_cents);
      const { buys, pay_days, by_day, ...rest } = v;
      return { ...rest, status: v.status === 'pending_review' ? 'in_review' : v.status, places: placesOfVideo(v), fmt: v.fmt || fmtOf(v.platform), rate_cents: rate(v),
        link_v: v.id, earned: { share_cents: share, rpm_cents: rpm, total_cents: share + rpm } };
    }));
  },
  /** «Снять про это» (02 §7.2): номер ролика выдаём заранее, чтобы ссылка в описании сразу считала переходы этого ролика.
   *  { world, place_id } → { v, verify_code:'SB-…' }. Повторный вызов для того же места — тот же номер, пока ролик не подан.
   *  В demo у места с роликом из набора — номер этого ролика (stiltsville → 7K2Q, ссылка домен/SUNSET/gta6/stiltsville?v=7K2Q) */
  reserveVideo: ({ world, place_id } = {}) => {
    const d = db(), key = `${world || ''}/${place_id || ''}`;
    d.reserved = d.reserved || {};
    let v = d.reserved[key];
    if (!v && SOURCE !== 'beta' && place_id) v = d.videos.find((x) => x.place?.id === place_id)?.id;
    if (!v) { do { v = Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * 32)]).join(''); } while (d.videos.some((x) => x.id === v)); }
    d.reserved[key] = v; persist();
    return wait({ v, verify_code: 'SB-' + v }, 80);
  },
  /** Подать ролик (02 §7.3, решение №17): { url, places[{world,id,role:'about'|'mention',at?:'м:сс'}], has_gameplay, disclosure, v? }
   *  (старая форма { url, world, place_id } — одно место «про место»). → { id, status:'submitted', verify_code, link_v, account_verified }.
   *  Ошибки: bad_url (не ссылка на ролик), duplicate (тот же platform + id ролика уже подан; поле video_id), no_place, bad_at (таймкод
   *  упоминания не м:сс), too_many (больше 5 мест), need_disclosure (нет отметки о раскрытии рекламы) */
  submitVideo: ({ url, places, world, place_id, has_gameplay = false, disclosure = true, v: want, task_id = null } = {}) => {
    const u = String(url || '').trim(), pv = videoIdOf(u);
    if (!pv) return fail('bad_url');
    const dup = db().videos.find((x) => { const o = videoIdOf(x.url || ''); return o && o.fam === pv.fam && o.id === pv.id; });
    if (dup) return Promise.reject(Object.assign(new Error('duplicate'), { code: 'duplicate', video_id: dup.id }));
    const list = (places && places.length ? places : place_id ? [{ world, id: place_id, role: 'about' }] : []).map((x) => ({ world: x.world, id: x.id, role: x.role === 'mention' ? 'mention' : 'about', ...(x.role === 'mention' ? { at: String(x.at || '').trim() } : {}) }));
    if (!list.length) return fail('no_place');
    if (list.length > 5) return fail('too_many');
    if (list.some((x) => x.role === 'mention' && !/^\d{1,2}:[0-5]\d$/.test(x.at))) return fail('bad_at');
    if (!disclosure) return fail('need_disclosure');
    // ролик по заданию Лиги (02 §6.2 В): связывается с заданием при подаче — карточка задания идёт по статусу ролика (task_claims)
    const task = task_id ? TASKS.find((t) => t.id === task_id && t.kind === 'league_fixed') : null;
    if (task_id && (!task || lockOf(task, db().P))) return fail('task_closed');
    if (task && list.length < (task.places_n || 1)) return Promise.reject(Object.assign(new Error('task_places'), { code: 'task_places', need: task.places_n }));
    const d = db();
    let id = want && /^[A-Z0-9]{4}$/.test(want) && !d.videos.some((x) => x.id === want) ? want : null;
    while (!id || d.videos.some((x) => x.id === id)) id = Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * 32)]).join('');
    const vid = { id, platform: pv.platform, fmt: fmtOf(pv.platform), place: { world: list[0].world, id: list[0].id }, places: list.map((x) => ({ ...x, status: 'ok' })),
      title: '', status: 'submitted', submitted_at: today(), url: u.replace(/^https?:\/\//, ''), has_gameplay: !!has_gameplay, ...(task ? { task_id: task.id } : {}),
      views: 0, clicks: 0, trials: 0, pays: 0, buys: [], pay_days: [], by_day: [], embed: null };
    d.videos.unshift(vid);
    if (d.reserved) Object.keys(d.reserved).forEach((k) => { if (d.reserved[k] === id) delete d.reserved[k]; });
    persist();
    const verified = (d.P.accounts || []).some((a) => a.status === 'verified');
    return wait({ id, status: 'submitted', verify_code: 'SB-' + id, link_v: id, account_verified: verified, task_id: task ? task.id : null }, 350);
  },
  /** Статистика своего ролика (только автор, 02 §9 п. 6): { id, status, views_by_day[{date,views}], views, clicks, trials, pays, rate_cents,
   *  rpm{calc_cents, cents, rule:'ok'|'min'|'cap'|'wait'|'gameplay'|'no_rpm'}, buys{year,pass,month}, earned{share_cents,rpm_cents,rpm_available_cents} } */
  getVideoStats: (id) => {
    const v = db().videos.find((x) => x.id === id); if (!v) return fail('not_found');
    const own = db().ledger.filter((x) => x.ref === id), calc = Math.round(v.views * rate(v) / 1000);
    const rule = v.platform === 'snapchat' ? 'no_rpm' : v.has_gameplay ? 'gameplay' : v.views < 1000 ? 'wait' : calc < RULES.rpm_min_cents ? 'min' : calc > RULES.rpm_cap_cents ? 'cap' : 'ok';
    const cents = rule === 'ok' ? calc : rule === 'min' ? RULES.rpm_min_cents : rule === 'cap' ? RULES.rpm_cap_cents : 0;
    const buys = { year: 0, pass: 0, month: 0 }; (v.buys || []).forEach((b) => { buys[b] = (buys[b] || 0) + 1; });
    return wait({ id, status: v.status === 'pending_review' ? 'in_review' : v.status, views_by_day: v.by_day, views: v.views, clicks: v.clicks, trials: v.trials, pays: v.pays, rate_cents: rate(v),
      rpm: { calc_cents: calc, cents, rule }, buys, share_cents_each: { ...PRICE },
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
    // чужие ролики — только примеры demo и стендов, и только у мест каталога; в beta (и у точек gtadb) — лишь свои ролики
    if (SOURCE === 'beta' || /^db-/.test(String(placeId))) return wait(mine.filter((v) => v.place.id === placeId));
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
  getEarnings: (month = db().month || '2026-10') => {
    const { ledger, videos, payout, pro_days } = db();
    const t = (s) => sumBy(ledger.filter((x) => x.status === s), (x) => x.amount_cents);
    // frozen (антифрод, 03 §5) — в «Начисляется», но приостановлено: список роликов — в frozen_videos
    const totals = { maturing: t('maturing') + t('frozen'), available: t('available'), paid: t('paid') }; totals.total = totals.maturing + totals.available + totals.paid;
    const funnel = { views: sumBy(videos, (v) => v.views), clicks: sumBy(videos, (v) => v.clicks) + (ledger.some((x) => x.ref === 'profile') ? 40 : 0),
      trials: sumBy(videos, (v) => v.trials) + (ledger.some((x) => x.ref === 'profile') ? 3 : 0), pays: ledger.filter((x) => x.reason === 'share').length };
    const frozen_videos = videos.filter((v) => v.status === 'frozen').map((v) => v.id);
    return wait({ month, totals, round_date: SOURCE === 'demo' ? DEMO.first_round : FIRST_ROUND, median_cents: RULES.median_cents, payout, ledger, funnel, frozen_videos, pro_days, pro_days_total: sumBy(pro_days, (x) => x.days) });
  },
  /** Вывод доступного (от $25, 02 §7.8) → { status:'queued', amount_cents, round_date }; ошибки not_allowed, beta_off, below_min, kyc_required, in_round.
   *  Статусы выплаты: queued → approved → sent → paid | failed («Выплата не дошла: проверьте реквизиты у Whop» — заявку можно подать снова) */
  requestPayout: () => {
    const d = db(), av = sumBy(d.ledger.filter((x) => x.status === 'available'), (x) => x.amount_cents);
    if (!d.P.adult_at || !d.P.payouts || d.P.minor) return fail('not_allowed');
    if (MODE === 'beta' && SOURCE !== 'mock') return fail('beta_off');   // выплаты начнутся, когда программа откроется для всех (08 §2.4)
    if (d.payout && ['queued', 'approved', 'sent'].includes(d.payout.status)) return fail('in_round');
    if (av < RULES.payout_min_cents) return fail('below_min');
    if (d.P.kyc !== 'verified') return fail('kyc_required');
    d.payout = { status: 'queued', amount_cents: av, round_date: SOURCE === 'demo' ? DEMO.first_round : FIRST_ROUND };
    persist(); return wait(d.payout, 300);
  },
  /** Проверка личности для первой выплаты (02 §7.8): документы смотрит Whop, мы — нет → { kyc:'pending', url } (url — окно Whop; без сервера null).
   *  POST /payouts/kyc; статус приходит вебхуком Whop: pending → verified | failed */
  startKyc: () => {
    const P = db().P;
    if (!P.adult_at || P.payouts === false || P.minor) return fail('not_allowed');
    if (MODE === 'beta' && SOURCE !== 'mock') return fail('beta_off');
    if (P.kyc === 'verified') return wait({ kyc: 'verified', url: null }, 60);
    P.kyc = 'pending'; P.kyc_at = Date.now(); persist();
    return wait({ kyc: 'pending', url: null }, 250);
  },

  /** Вклад: { type:'place'|'pair'|'report'|'found', place?{world,id}|null, where?, side:'game'|'real', ref_kind, source, note } → { id, status:'pending_review' } */
  // ───────── задания и вклады (08 №11–13) ─────────
  /** Доска заданий (GET /tasks?world=): разделы А «Для всех», Б «Для партнёров», В «Лига» с наградой по режиму и состоянием карточки */
  getTasks: ({ world = 'gta6' } = {}) => {
    const P = db().P, dr = draftsOf();
    const out = TASKS.filter((t) => t.world === '*' || t.world === world).map((t) => {
      const lock = lockOf(t, P), claim = lock ? null : claimOf(t);
      const draft = !lock && t.type && dr[t.type] && (!t.place || !dr[t.type].place || sameRef(dr[t.type].place, t.place)) && (dr[t.type].world || world) === (t.place?.world || world);
      const state = lock ? 'locked' : draft ? 'in_progress' : claim ? claim.state : 'open';
      const reward = t.section === 'league' ? leagueReward(t, P) : rewardOf(t.kind, P);
      const extra = t.kind === 'review' && P.mod ? { today: P.mod.today } : {};
      return { ...t, reward, state, lock, claim, ...extra };
    });
    return wait(out, 120);
  },
  /** Отправить вклад (POST /contributions) → { id, status:'in_review'|'accepted' }. «Узнаю это место» засчитывается сразу (3 голоса = проверено).
   *  Ошибки: need_login, bad_type, no_place, no_point, no_name, no_source (новое место без ссылки или фото), no_photo, bad_reason, bad_url, limit (≤ 5 мест в сутки) */
  submitContribution: (c = {}) => {
    const P = db().P, type = c.type === 'report' ? 'fix' : c.type;
    if (!P.email) return fail('need_login');
    if (!['found', 'fix', 'new_place', 'new_egg', 'free_photo', 'pair', 'game_frame'].includes(type)) return fail('bad_type');
    const pay = c.payload || {}, place = c.place || null;
    if (NEED_PLACE.includes(type) && !place) return fail('no_place');
    if (NEED_SOURCE.includes(type)) {
      if (!place && !(Number.isFinite(pay.lat) && Number.isFinite(pay.lon)) && !String(pay.where || '').trim()) return fail('no_point');
      if (!String(pay.name || '').trim()) return fail('no_name');
      if (!String(c.source_url || '').trim() && !pay.photo) return fail('no_source');
      if (contribs().filter((x) => NEED_SOURCE.includes(x.type) && x.created_at === today()).length >= 5) return fail('limit');
    }
    if (NEED_PHOTO.includes(type) && !pay.photo) return fail('no_photo');
    if (type === 'fix' && !FIX_REASONS.includes(pay.reason)) return fail('bad_reason');
    if (type === 'free_photo' && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}\/\S+/i.test(String(c.source_url || ''))) return fail('bad_url');
    const found = type === 'found';
    const x = { id: 'C' + Date.now().toString(36).toUpperCase(), type, task_id: c.task_id || null, place, payload: pay, source_url: String(c.source_url || '').trim(),
      status: found ? 'accepted' : 'in_review', reward: rewardOf(type === 'pair' ? 'pair' : type, P), created_at: today(), decided_at: found ? today() : null,
      ...(found ? { trace: { kind: 'votes', n: pay.vote === 'yes' ? 1 : 0, need: 3 } } : {}) };
    contribs().push(x); delete draftsOf()[type]; persist();
    return wait({ id: x.id, status: x.status }, 300);
  },
  /** «Мои вклады» (GET /contributions): новые сверху, со следом у принятых (v_place_stats) */
  listMyContributions: () => wait([...contribs()].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || String(b.id).localeCompare(String(a.id))), 80),
  /** Черновик вклада — только на устройстве: один на вид вклада. Переживает вход почтой и перезагрузку */
  saveDraft: (d = {}) => { if (!d.type) return fail('bad_type'); draftsOf()[d.type] = { ...d, saved_at: today() }; persist(); return wait({ ok: true }, 20); },
  getDrafts: () => wait(Object.values(draftsOf()), 20),
  clearDraft: (type) => { delete draftsOf()[type]; persist(); return wait({ ok: true }, 20); },
  /** Проверка дубля до отправки (02 §6.3): то же название или точка ближе 200 м → { match: { world, id } | null }. С сервером — GET /places/near */
  checkDuplicate: async ({ world = 'gta6', name = '', lat = null, lon = null } = {}) => {
    const d = await loadPlaces(world), q = normName(name);
    const byPt = Number.isFinite(lat) && Number.isFinite(lon) ? d.places.filter((p) => Number.isFinite(p.lat) && near({ lat, lon }, p) < 200).sort((a, b) => near({ lat, lon }, a) - near({ lat, lon }, b))[0] : null;
    const byName = q.length >= 4 ? d.places.find((p) => [p.n, p.g, p.r].some((v) => { const n = normName(v); return n && (n === q || (q.length >= 5 && (' ' + n + ' ').includes(' ' + q + ' '))); })) : null;
    const m = byPt || byName;
    return wait({ match: m ? { world, id: m.id } : null }, 150);
  },

  // ───────── модерация (02 §10; экраны 14 «Экзамен» и 15 «Проверка»). С сервером — GET /review, POST /review/:id, /mod/exam ─────────
  /** Путь модератора → { stage:'none'|'exam'|'cooldown'|'student'|'mod'|'paused', accepted, need, exam{correct,total,at}|null, cooldown_until,
   *  student{done,agree,need}|null, today{checked,accuracy,cents}, accuracy (по ловушкам, скользящие 50), min_accuracy } */
  getModStatus: () => {
    const P = db().P, m = modOf(P), n = contribs().filter((c) => c.status === 'accepted').length;
    return wait({ stage: m.stage, accepted: n, need: RULES.mod_need_contribs, exam: m.exam || null, cooldown_until: m.cooldown_until || null, student: m.student || null,
      today: m.today || { checked: 0, accuracy: 0, cents: 0 }, accuracy: accOf(m), min_accuracy: RULES.mod_min_accuracy }, 60);
  },
  /** Экзамен (02 §10.1): 20 карточек вперемешку, нужно 16 верных → { id, total, need, min_ms, items[] } (без ответов);
   *  ошибки not_eligible (меньше 5 принятых вкладов и нет приглашения), cooldown (+ until), already_mod */
  startExam: () => {
    const P = db().P, m = modOf(P);
    if (m.stage === 'mod' || m.stage === 'student') return fail('already_mod');
    if (m.stage === 'cooldown') return Promise.reject(Object.assign(new Error('cooldown'), { code: 'cooldown', until: m.cooldown_until }));
    if (m.stage === 'none') return fail('not_eligible');
    return wait({ id: 'EX-' + Date.now().toString(36), total: RULES.mod_exam_total, need: RULES.mod_exam_need, min_ms: RULES.mod_min_ms, items: EXAM.slice(0, RULES.mod_exam_total).map(card) }, 150);
  },
  /** Итог экзамена: answers [{ item_id, decision:'ok'|'no', reason_code?, ms }] → { correct, total, need, passed, not_counted, stage, cooldown_until }.
   *  Решение быстрее 2 с (ms < min_ms) не засчитывается — считается неверным. Сдал — 20 проверок ученика; не сдал — повтор через 7 дней */
  submitExam: ({ answers = [] } = {}) => {
    const P = db().P, m = modOf(P);
    if (!['exam', 'paused'].includes(m.stage)) return fail(m.stage === 'cooldown' ? 'cooldown' : 'not_eligible');
    const key = new Map(EXAM.map((q) => [q.id, q.answer])), seen = new Set();
    let correct = 0, fast = 0;
    for (const a of answers) {
      if (!key.has(a.item_id) || seen.has(a.item_id)) continue; seen.add(a.item_id);
      if (!(+a.ms >= RULES.mod_min_ms)) { fast++; continue; }
      if (a.decision === key.get(a.item_id)) correct++;
    }
    const total = RULES.mod_exam_total, passed = correct >= RULES.mod_exam_need, exam = { correct, total, at: today() };
    const keep = { today: P.mod?.today || { checked: 0, accuracy: 0, cents: 0 }, done_ids: P.mod?.done_ids || [] };
    P.mod = passed ? { ...keep, stage: 'student', exam, window: { correct: 0, total: 0 }, student: { done: 0, agree: 0, need: RULES.mod_student_n } }
      : { ...keep, stage: 'cooldown', exam, window: P.mod?.window || { correct: 0, total: 0 }, cooldown_until: addDays(today(), RULES.mod_exam_cooldown_days) };
    P.roles = P.roles.filter((r) => r !== 'mod');
    persist();
    return wait({ correct, total, need: RULES.mod_exam_need, passed, not_counted: fast, stage: P.mod.stage, cooldown_until: P.mod.cooldown_until || null }, 300);
  },
  /** Очередь «Проверка» (ученик и модератор): [{ id, kind:'video'|'place'|'photo', place{world,id}, platform?, title?, author?, at?, facts[] }].
   *  Одна карточка за раз; ловушки (10%) ничем не отличаются; свои вклады не показываются. Пусто — []; пауза — ошибка paused */
  getReviewQueue: () => {
    const P = db().P, m = modOf(P);
    if (m.stage === 'paused') return fail('paused');
    if (!['mod', 'student'].includes(m.stage)) return fail('not_mod');
    const done = new Set(m.done_ids || []);
    return wait(QUEUE.filter((q) => !done.has(q.id)).map(card), 120);
  },
  /** Решение: decision 'ok'|'no' (+ reason_code при 'no'), ms — сколько смотрел карточку → { counted, stage, today, accuracy, student }.
   *  ms < 2000 — не засчитывается (counted:false, карточка остаётся). Точность — по ловушкам (скользящие 50); ниже 70% — пауза и повтор экзамена.
   *  Ученик: 20 решений сверяются с итогом, денег нет; от 70% совпадений — роль mod, иначе пауза */
  reviewDecision: (id, decision, reason_code, ms = RULES.mod_min_ms) => {
    const P = db().P, m = P.mod, q = QUEUE.find((x) => x.id === id);
    if (!m || !['mod', 'student'].includes(m.stage)) return fail(m?.stage === 'paused' ? 'paused' : 'not_mod');
    if (!q) return fail('not_found');
    if (decision === 'no' && !reason_code) return fail('reason_required');
    const out = () => wait({ counted, stage: m.stage, today: { ...m.today }, accuracy: accOf(m), student: m.student ? { ...m.student } : null }, 80);
    let counted = +ms >= RULES.mod_min_ms;
    if (!counted) return out();
    m.done_ids = [...(m.done_ids || []), id];
    db().decisions.push({ id, decision, reason_code: reason_code || null, ms: Math.round(+ms) });
    const right = decision === q.answer;
    if (m.stage === 'student') {
      m.student.done += 1; if (right) m.student.agree += 1;
      if (m.student.done >= m.student.need) {
        const ok = m.student.agree / m.student.need * 100 >= RULES.mod_min_accuracy;
        m.stage = ok ? 'mod' : 'paused'; if (ok && !P.roles.includes('mod')) P.roles.push('mod');
      }
    } else {
      m.today.checked += 1;
      if (q.trap) { m.window = m.window || { correct: 0, total: 0 }; m.window.total += 1; if (right) m.window.correct += 1;
        if (m.window.total > RULES.mod_window) { m.window.correct = Math.round(m.window.correct * RULES.mod_window / m.window.total); m.window.total = RULES.mod_window; } }
      if (!q.trap || right) m.today.cents += RULES.mod_decision_cents;   // $0,01 за решение; ловушка — только за верное
      m.today.accuracy = accOf(m);
      if (m.window?.total >= 10 && m.today.accuracy < RULES.mod_min_accuracy) { m.stage = 'paused'; P.roles = P.roles.filter((r) => r !== 'mod'); }
    }
    persist(); return out();
  },
  // ───────── экран «Для админов» (08 №18, только веб). С сервером — роль admin в GET /me и методы /ops ─────────
  /** Вход по коду админа → { ok }; ошибка bad_code. Код остаётся только на этом устройстве (нужен, чтобы выводить коды приглашений) */
  adminSignIn: async (code) => {
    const c = String(code || '').trim().toUpperCase();
    let h = ''; try { h = await kdf(c, 'sb-admin-v1', 32); } catch { return fail('no_crypto'); }
    if (h !== CREATOR.admin) return fail('bad_code');
    ls.set('sb.admin', c); adminOK = true; return wait({ ok: true }, 100);
  },
  adminSignOut: () => { ls.set('sb.admin', null); adminOK = false; return wait({ ok: true }, 50); },
  /** { admin, demo, stage:'partner'|'start'|'mod'|'exam' } */
  adminState: async () => wait({ admin: await isAdmin(), demo: DEMO_ON, stage: demoStage() }, 30),
  /** Режим demo вкл/выкл (только админ). stage: 'partner' — партнёр с роликами, 'start' — путь с начала, 'mod' — модератор @palm_route,
   *  'exam' — @palm_route перед экзаменом (5 принятых вкладов). После — перезагрузка */
  adminSetDemo: async (on, stage = 'partner') => {
    if (!(await isAdmin())) return fail('not_admin');
    ls.set('sb.demo', on ? '1' : null); ls.set('sb.demo.stage', DEMO_STAGES.includes(stage) && stage !== 'partner' ? stage : null); ls.set(DKEY, null);
    return wait({ demo: !!on, stage }, 50);
  },
  /** «Создать 10»: следующие коды SB-XXXXXX из партий config.js (действующих, не прошедших) → [{ code, i, until, created_at }] */
  createInvites: async (n = 10) => {
    if (!(await isAdmin())) return fail('not_admin');
    const have = created(), top = have.reduce((m, x) => Math.max(m, x.i), 9), out = [];
    for (let i = top + 1; out.length < n && i < CREATOR.invites.length * 10; i++) {
      const until = CREATOR.invites[Math.floor(i / 10)][0]; if (until < today()) continue;
      out.push({ code: await inviteCode(adminCode(), i), i, until, created_at: today() });
    }
    if (!out.length) return fail('no_invites_left');   // партии кончились: tools/make_invites.py --batches N
    ls.set('sb.admin.invites', JSON.stringify([...out, ...have])); return wait(out, 120);
  },
  /** Созданные на этом устройстве приглашения → [{ code, until, created_at, used }] (used — принят на этом устройстве; с сервером — у всех) */
  listInvites: async () => {
    if (!(await isAdmin())) return fail('not_admin');
    const used = usedInvites(), all = created();
    const hs = await Promise.all(all.map((x) => kdf(x.code, 'sb-invite-v1', 8).catch(() => '')));
    return wait(all.map((x, k) => ({ code: x.code, until: x.until, created_at: x.created_at, used: used.includes(hs[k]) })), 40);
  },
  /** Счётчик списка ожидания (08 §2.4): { joined, verified, goal_joined:500, goal_verified:100 } */
  getWaitlistStats: async () => {
    if (!(await isAdmin())) return fail('not_admin');
    if (SOURCE !== 'beta') return wait({ ...DEMO.whitelist }, 60);
    const P = db().P, me = P.waitlist ? 1 : 0;
    return wait({ joined: CREATOR.waitlist_count + me, verified: P.waitlist?.status === 'verified' ? 1 : 0, goal_joined: 500, goal_verified: 100 }, 60);
  },
  /** Заявки на подтверждение канала (заглушка §6: видно админу на том же устройстве) → [{ id, nick, platform, url, verify_code, at, status }] */
  listAccountRequests: async () => {
    if (!(await isAdmin())) return fail('not_admin');
    const P = db().P, mine = (P.accounts || []).filter((a) => a.status === 'pending' || a.status === 'failed').map((a) => ({ ...a, nick: P.nick || String(a.handle || '').replace(/^@/, ''), own: true }));
    const extra = SOURCE === 'beta' ? [] : DEMO.requests.map((r) => ({ ...r, status: (db().reqs || {})[r.id] || r.status }));
    return wait([...mine, ...extra], 60);
  },
  /** Вклады на проверке (заглушка §6, видно админу на том же устройстве): без сервера в beta их иначе некому принять → [{ id, type, place, payload, source_url, created_at, nick }] */
  listContributionRequests: async () => {
    if (!(await isAdmin())) return fail('not_admin');
    return wait(contribs().filter((c) => c.status === 'in_review' || c.status === 'pending_review').map((c) => ({ ...c, nick: db().P.nick || '' })), 60);
  },
  /** Решение админа по вкладу: 'accepted' | 'rejected' (+ reject_code из причин «Моих вкладов») */
  decideContribution: async (id, status, reject_code = 'other') => {
    if (!(await isAdmin())) return fail('not_admin');
    if (!['accepted', 'rejected'].includes(status)) return fail('bad_status');
    const c = contribs().find((x) => x.id === id); if (!c) return fail('not_found');
    c.status = status; c.decided_at = today(); if (status === 'rejected') c.reject_code = reject_code; else delete c.reject_code;
    persist(); return wait({ id, status }, 120);
  },
  /** Ручная отметка «канал подтверждён» / «код не нашли»: status 'verified' | 'failed' */
  markAccount: async (id, status) => {
    if (!(await isAdmin())) return fail('not_admin');
    if (!['verified', 'failed'].includes(status)) return fail('bad_status');
    const acc = (db().P.accounts || []).find((a) => a.id === id);
    if (acc) setAccount(acc, status); else { const d = db(); d.reqs = { ...(d.reqs || {}), [id]: status }; }
    persist(); return wait({ id, status }, 120);
  },
};
// стенд (localhost / demo): тот же набор в источнике beta — проверка «demo ⇄ beta не меняет разметку» (08 §6)
if (devGate()) api._seedBeta = (stage = 'partner') => { const x = demoDB(stage); x.P.demo = false; ls.set(BKEY, JSON.stringify(x)); return true; };

window.SB = window.SB || {};
window.SB.api = api;
export default api;
