// Демо-данные для съёмки рекламы (Дизайн Secret Base/08 MVP/08 ТЗ §5): персонаж @sunset_drive, все цифры — пример.
// Формы — те же, что отдаёт SB.api (04 §2): профиль, ролики, журнал начислений в центах, даты 'YYYY-MM-DD'.
// Подключается только в режиме demo (экран «Для админов»), на каждом экране с суммами — «Пример интерфейса».
//
// Сверка с §5 (до цента):
//   покупки по ссылке 28 = 9 «год» × $10,31 + 11 «3 месяца» × $4,35 + 8 «месяц» × $1,90 = $92,79 + $47,85 + $15,20 = $155,84
//   за просмотры: 412 300 × $0,12 / 1 000 = $49,48; 186 000 × $0,05 / 1 000 = $9,30; 54 200 × $0,12 / 1 000 = $6,50 → $65,28
//   пары Скаута: 2 × $10 = $20,00.  Всего $241,12: начисляется $221,12, доступно $20,00, выплачено $0
//   путь зрителя: просмотры 653 140 → переходы 922 → пробный 322 → покупки 28

const MONTH = '2026-11';
const d = (n) => `${MONTH}-${String(n).padStart(2, '0')}`;
const pl = (world, id) => ({ world, id });
export const SHARE = { year: 1031, pass: 435, month: 190 };   // 40% чистыми, пояс 1 (03 §1): год, «3 месяца», месяц

// просмотры по дням: целые сотни, сумма точно равна total (последний день добирает остаток)
function spread(total, from, to, decay) {
  const w = []; let sw = 0;
  for (let k = from; k <= to; k++) { w[k] = Math.exp(-(k - from) / decay) * (1 + 0.2 * Math.sin(k * 1.7)); sw += w[k]; }
  const out = []; let acc = 0;
  for (let k = from; k <= to; k++) { const v = Math.round(total * w[k] / sw / 100) * 100; out.push({ date: d(k), views: v }); acc += v; }
  out[0].views += total - acc; return out;
}
// покупки по ссылке ролика: план и день — ровно, без случайности
function buys(year, pass, month, days) {
  const plans = [...Array(year).fill('year'), ...Array(pass).fill('pass'), ...Array(month).fill('month')];
  const order = plans.map((p, i) => [p, (i * 7) % plans.length]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);   // планы вперемешку
  return { buys: order, pay_days: order.map((_, i) => days[i % days.length]) };
}

function videos() {
  const a = buys(6, 7, 5, [3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 23, 26, 29]);
  const b = buys(1, 2, 1, [7, 11, 17, 25]);
  const c = buys(2, 2, 2, [10, 12, 15, 19, 24, 28]);
  return [
    { id: '7K2Q', platform: 'tiktok', fmt: 'v', place: pl('gta6', 'gta6-stiltsville'), places: [{ ...pl('gta6', 'gta6-stiltsville'), as: 'about', status: 'ok' }],
      title: { ru: 'Этот мост есть в GTA 6', en: 'This bridge is in GTA 6' }, status: 'accruing', submitted_at: d(2), url: 'tiktok.com/@sunset_drive/video/7431902218641505566', has_gameplay: false,
      views: 412300, clicks: 618, trials: 210, pays: 18, ...a, by_day: spread(412300, 2, 30, 5), embed: { kind: 'tiktok', id: '' } },
    { id: '9MX4', platform: 'shorts', fmt: 'v', place: pl('gta6', 'gta6-portmiami'),
      places: [{ ...pl('gta6', 'gta6-portmiami'), as: 'about', status: 'ok' }, { ...pl('gta6', 'gta6-midtown-interchange'), as: 'mention', at: '0:21', status: 'ok' }, { ...pl('gta6', 'gta6-ten-museum-park'), as: 'mention', at: '0:38', status: 'ok' }],
      title: { ru: '3 места Майами из трейлера', en: '3 Miami places from the trailer' }, status: 'accruing', submitted_at: d(5), url: 'youtube.com/shorts/q9MX4sunset', has_gameplay: false,
      views: 186000, clicks: 140, trials: 52, pays: 4, ...b, by_day: spread(186000, 5, 30, 6), embed: { kind: 'youtube', id: '' } },
    { id: 'P2LD', platform: 'youtube', fmt: 'h', place: pl('gta5', 'gta5-bay-city-incline'), places: [{ ...pl('gta5', 'gta5-bay-city-incline'), as: 'about', status: 'ok' }],
      title: { ru: 'Где в жизни этот спуск к океану', en: 'Where this slope to the ocean is in real life' }, status: 'accruing', submitted_at: d(8), url: 'youtube.com/watch?v=P2LDsunset1', has_gameplay: false,
      views: 54200, clicks: 163, trials: 59, pays: 6, ...c, by_day: spread(54200, 8, 30, 7), embed: { kind: 'youtube', id: '' } },
    { id: 'R8TW', platform: 'tiktok', fmt: 'v', place: pl('gta6', 'gta6-providence-canyon'), places: [{ ...pl('gta6', 'gta6-providence-canyon'), as: 'about', status: 'ok' }],
      title: { ru: 'Место недели', en: 'Place of the week' }, status: 'awaiting_threshold', submitted_at: d(24), url: 'tiktok.com/@sunset_drive/video/7436118270331229471', has_gameplay: false,
      views: 640, clicks: 1, trials: 1, pays: 0, buys: [], pay_days: [], by_day: spread(640, 24, 30, 3), embed: { kind: 'tiktok', id: '' } },
    { id: 'Z1QA', platform: 'reels', fmt: 'v', place: pl('gta6', 'gta6-little-haiti'), places: [{ ...pl('gta6', 'gta6-little-haiti'), as: 'about', status: 'ok' }],
      title: '', status: 'rejected', reject_code: 'no_disclosure', submitted_at: d(26), url: 'instagram.com/reel/Z1QAsunset', has_gameplay: false,
      views: 0, clicks: 0, trials: 0, pays: 0, buys: [], pay_days: [], by_day: [], embed: null },
  ];
}

// журнал: доля 40% по каждой покупке (холд 30 дней — начисляется), просмотры по снимку 10-го дня (начисляется), пары Скаута (доступно)
function ledger(vids) {
  const L = []; let n = 0;
  const add = (o) => L.push({ id: 'D' + (++n), ...o });
  const RPM = { '7K2Q': 4948, '9MX4': 930, P2LD: 650 };
  for (const v of vids) {
    v.buys.forEach((p, i) => add({ date: d(v.pay_days[i]), reason: 'share', amount_cents: SHARE[p], status: 'maturing', ref: v.id, plan: p }));
    if (RPM[v.id]) add({ date: d(+v.submitted_at.slice(8) + 10), reason: 'rpm', amount_cents: RPM[v.id], status: 'maturing', ref: v.id });
  }
  add({ date: d(6), reason: 'pair', amount_cents: 1000, status: 'available', ref: 'pair:gta6-stiltsville' });
  add({ date: d(13), reason: 'pair', amount_cents: 1000, status: 'available', ref: 'pair:gta6-portmiami' });
  return L.sort((x, y) => x.date.localeCompare(y.date));
}

// ссылки роликов (url) — вымышленные, нужны, чтобы повторная подача той же ссылки показала «Этот ролик уже подан» (02 §7.3)
// цифры вокруг персонажа: модератор, автор места, список ожидания (экран админа), коды для показа приглашения
export const DEMO = {
  month: MONTH,
  first_round: '2026-11-20',
  moderator: { nick: 'palm_route', today: { checked: 40, accuracy: 92, cents: 40 }, stage: 'mod', exam: { correct: 18, total: 20 } },
  place_stats: [{ world: 'gta6', id: 'gta6-stiltsville', opens_week: 1240, videos: 3 }],
  whitelist: { joined: 312, verified: 47, goal_joined: 500, goal_verified: 100 },
  waitlist_no: 1284,
  verify_code: 'SB-7F3K',
  partner_since: '2026-10-26',
  work_pro_first: '2026-11-09',   // 14 дней после подтверждения канала 26.10 — экран «Готово»
  // приглашения в demo: принимается OK, остальные — чтобы снять ошибки (любой другой код — «Код не найден»)
  invites: { ok: ['SB-SUNS26'], used: ['SB-USED26'], expired: ['SB-PAST26'] },
  // заявки на подтверждение канала (экран админа), вымышленные ники
  requests: [
    { id: 'R1', nick: 'palm_route', platform: 'tiktok', url: 'tiktok.com/@palm_route', verify_code: 'SB-P4RM', at: '2026-10-25', status: 'pending' },
    { id: 'R2', nick: 'keys_hunter', platform: 'instagram', url: 'instagram.com/keys_hunter', verify_code: 'SB-K9HT', at: '2026-10-26', status: 'pending' },
    { id: 'R3', nick: 'night_owl', platform: 'youtube', url: 'youtube.com/@night_owl', verify_code: 'SB-N7WL', at: '2026-10-26', status: 'pending' },
  ],
};

// вклады @sunset_drive (доска заданий, «Мои вклады», 08 ТЗ §3 №11–13, §4) — форма contributions 04 §1.4 / §2:
// { id, type, place, payload, source_url, status: 'in_review'|'accepted'|'rejected', reject_code, reward, trace, created_at, decided_at }.
// Награды — как в live (demo показывает программу целиком): дни Pro, «Найдено @ник», $10 за пару; «Кадр из игры» — без денег.
// След (v_place_stats): stiltsville — 1 240 открытий за неделю и 3 ролика (08 §5); 312 и 4 800 — примеры 02 §6.1; 148 — пример для второй пары.
// Пары stiltsville и portmiami — те же, что в журнале (pair, $10 + $10 = $20,00 доступно).
function contributions() {
  return [
    { id: 'C1', type: 'new_place', place: pl('gta6', 'gta6-stiltsville'), payload: { name: 'Stiltsville' }, source_url: 'youtube.com/watch?v=sunsetTrail1&t=48',
      status: 'accepted', reward: { name: 'found', pro_days: 7, author_pct: 10 }, trace: { kind: 'opens', n: 1240, period: 'week', videos: 3 }, created_at: d(1), decided_at: d(2) },
    { id: 'C2', type: 'pair', place: pl('gta6', 'gta6-stiltsville'), payload: {}, status: 'accepted', reward: { name: 'photo', cents: 1000, per: 'pair' }, trace: { kind: 'compares', n: 312 }, created_at: d(5), decided_at: d(6) },
    { id: 'C3', type: 'pair', place: pl('gta6', 'gta6-portmiami'), payload: {}, status: 'accepted', reward: { name: 'photo', cents: 1000, per: 'pair' }, trace: { kind: 'compares', n: 148 }, created_at: d(12), decided_at: d(13) },
    { id: 'C4', type: 'fix', place: pl('gta5', 'gta5-bay-city-incline'), payload: { reason: 'wrong_spot', note: '' }, status: 'accepted', reward: { name: 'found', pro_days: 1 },
      trace: { kind: 'fixed_for', n: 4800 }, created_at: d(8), decided_at: d(9) },
    { id: 'C5', type: 'found', place: pl('gta5', 'gta5-pleasure-pier'), payload: { vote: 'yes' }, status: 'accepted', reward: { name: 'check' }, trace: { kind: 'votes', n: 3, need: 3 }, created_at: d(10), decided_at: d(10) },
    { id: 'C6', type: 'fix', place: pl('gta6', 'gta6-little-haiti-ne60-mural'), payload: { reason: 'closed', note: '' }, status: 'rejected', reject_code: 'checked_ok', reward: { name: 'found', pro_days: 1 }, created_at: d(19), decided_at: d(20) },
    { id: 'C7', type: 'free_photo', place: pl('gta6', 'gta6-stuart-yard'), payload: {}, source_url: 'commons.wikimedia.org/wiki/File:Stuart_Florida_rail_yard.jpg', status: 'in_review', reward: { name: 'free_photo', pro_days: 2 }, created_at: d(27) },
    { id: 'C8', type: 'game_frame', place: pl('gta5', 'gta5-vinewood-walk-of-fame'), payload: {}, status: 'in_review', reward: { name: 'frame', pro_days: 2 }, created_at: d(28) },
  ];
}
// черновик «Новая пасхалка» (состояние in_progress): сохранён на устройстве, источника ещё нет — кнопка «Дальше» не активна
const drafts = () => ({ new_egg: { type: 'new_egg', world: 'gta6', step: 'point', name: 'Wynwood Walls',
  what: { ru: 'Граффити у входа, как в трейлере', en: 'The graffiti at the entrance, as in the trailer' }, where: '25.8010, -80.1994', source: '', saved_at: d(29) } });

// stage: 'partner' — партнёр с роликами за ноябрь; 'start' — новый человек: путь с записи в список до «Готово»
export function demoDB(stage = 'partner') {
  const vids = videos();
  const P = {
    nick: 'sunset_drive', ref_code: 'SUNSET', email: 'sunset_drive@mail.com', country: 'US', payouts: true,
    roles: ['player', 'creator', 'mod', 'author', 'scout'], level: 'creator', adult_at: DEMO.partner_since, terms_at: DEMO.partner_since,
    partner_since: DEMO.partner_since, invited: true, waitlist: null, demo: true,
    pro_until: null, trial_until: null, work_pro_until: '2027-02-07',   // 9 ноября + 30 дней за каждый из 3 принятых роликов от 1 000 просмотров
    league_unlocked: true, league_progress: { views: 412300, goal: 10000 },
    accounts: [
      { id: 'A1', platform: 'tiktok', status: 'verified', handle: '@sunset_drive', url: 'tiktok.com/@sunset_drive', verify_code: DEMO.verify_code, verified_at: DEMO.partner_since },
      { id: 'A2', platform: 'youtube', status: 'verified', handle: '@sunset_drive', url: 'youtube.com/@sunset_drive', verify_code: DEMO.verify_code, verified_at: DEMO.partner_since },
    ],
    mod: { today: { ...DEMO.moderator.today }, stage: 'mod', exam: { ...DEMO.moderator.exam } },
    author: { places: DEMO.place_stats.map((x) => ({ ...x })) },
  };
  if (stage === 'start') {
    Object.assign(P, { email: null, roles: [], level: 'new', adult_at: null, terms_at: null, partner_since: null, invited: false,
      work_pro_until: null, league_unlocked: false, league_progress: { views: 0, goal: 10000 }, accounts: [], mod: null, author: null });
  }
  const own = stage === 'start' ? { contributions: [], drafts: {} } : { contributions: contributions(), drafts: drafts() };
  return { P, videos: vids, ledger: ledger(vids), pro_days: [], payout: null, decisions: [], month: MONTH, stage, ...own };
}
