// Тест «прогресс с PlayStation / Xbox» без сети и без настоящих аккаунтов: node tools/test_progress.mjs
// 1) карта трофеев → место в сюжете (js/progress.js), 2) сервер sb-progress: тестовые профили и весь путь PSN/Xbox на подменённом fetch.
import { readFileSync } from 'node:fs';
const root = new URL('..', import.meta.url);
const J = (p) => JSON.parse(readFileSync(new URL(p, root)));
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };

globalThis.localStorage = { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } };
const P = await import(new URL('js/progress.js', root));
const tro = J('data/guide/trophies.json');
// база миссий: MISSIONS=<путь> (настоящая из ветки guide-walkthrough), иначе data/guide/missions.json, иначе запасная
let mis; try { mis = process.env.MISSIONS ? JSON.parse(readFileSync(process.env.MISSIONS)) : J('data/guide/missions.json'); } catch { mis = J('data/guide/missions.stub.json'); }
const D = P.index(tro, mis);
const T = J('data/guide/progress-test.json').profiles;
const title = (i) => D.order[i]?.t.en;

ok(D.marks.length === 12, `сюжетных вех ${D.marks.length} из 12 нашли в базе миссий (${mis.stub ? 'запасная' : 'missions.json'})`);
ok(D.marks.every((m, k) => k === 0 || m.i >= D.marks[k - 1].i), 'вехи идут по порядку сюжета (две вехи могут стоять на одной миссии)');
let r = P.fromEarned(D, []); ok(r.idx === -1 && r.next?.t.k === 'just-like-paradise', 'нет трофеев → начало игры, следующая веха Gone Fishing');
r = P.fromEarned(D, T['sb-test-ch2'].earned);
ok(title(r.idx) === 'Breakfast Run', `sb-test-ch2 → последняя пройденная «${title(r.idx)}»`);
ok(r.next?.t.k === 'tees-ass-drug-money' && r.gap.length > 0 && r.gap[0].t.en === 'Coffee Break', `уточнение: ${r.gap.length} миссий до конца главы 2, первая «${r.gap[0]?.t.en}»`);
ok(r.sides.includes('cal') && r.n === 5, 'побочная линия Кэла и все 5 трофеев учтены');
r = P.fromEarned(D, T['sb-test-heist'].earned); ok(title(r.idx) === 'The Cartel Heist', `sb-test-heist → «${title(r.idx)}»`);
r = P.fromEarned(D, T['sb-test-done'].earned); ok(r.idx === D.order.length - 1 && !r.next && !r.gap.length, 'sb-test-done → сюжет пройден, уточнять нечего');
r = P.fromEarned(D, [{ name: 'paradise lost' }, { name: 'Just Like Paradise' }]); ok(D.order[r.idx].ch === 'c1' && D.order[r.idx + 1].ch === 'c2', 'конец главы 1 → последняя миссия главы 1 (имя без учёта регистра)');
ok(P.fromPercent(D, 0) === -1 && P.fromPercent(D, 100) === D.order.length - 1, 'процент 0 и 100 — края');
ok(D.order[0].id.replace(/^m:/, '') === 'prologue' || mis.stub, `первая миссия в порядке — «${title(0)}»`);
ok(title(D.order.length - 1) === 'The End of the Road', `последняя миссия в порядке — «${title(D.order.length - 1)}» (n — номер внутри главы)`);
ok(D.order.every((m, k) => k === 0 || (D.ch.find((c) => c.id === m.ch).n >= D.ch.find((c) => c.id === D.order[k - 1].ch).n)), 'главы идут подряд, без перемешивания');
ok(P.pctStart(D, 50) === P.fromPercent(D, 50) - 2 && P.pctStart(D, 0) === -1, 'процент: старт вопросов на 2 миссии раньше оценки');
// запись: трофеи не затирают более дальнюю ручную отметку
P.save(D, 40, 'self'); ok(P.save(D, 20, 'psn') === false && P.getProg().via === 'self', 'ручная отметка дальше трофеев — оставили');
ok(P.save(D, 40, 'pct') === false && P.getProg().via === 'self', 'процент на ту же миссию не затирает ручную');
P.save(D, 60, 'pct'); ok(P.save(D, 55, 'xbox') === false && P.getProg().via === 'pct', 'консоль не двигает назад и отметку процента');
ok(P.save(D, 10, 'self') === true && P.getProg().via === 'self', 'ручная отметка назад — всегда');
ok(P.save(D, 50, 'psn') === true && P.getProg().via === 'psn' && P.getProg().m.startsWith('m:'), 'трофеи дальше — записали в sb.gp с via:psn');

// ---------- сервер ----------
const W = await import(new URL('server/progress-worker/worker.js', root));
const call = async (p, env = {}) => { const res = await W.handle(new Request('https://progress.sbgta.app' + p), env); return { s: res.status, j: await res.json() }; };
let x = await call('/psn/sb-test-ch2?game=gta6'); ok(x.s === 200 && x.j.earned.length === 5, 'сервер: тестовый профиль без ключей');
x = await call('/xbox/sb-test-private'); ok(x.s === 403 && x.j.error === 'private', 'сервер: закрытый профиль → private');
x = await call('/psn/../../etc'); ok(x.s === 404, 'сервер: мусорный путь отклонён');
x = await call('/psn/a'); ok(x.s === 404, 'сервер: слишком короткий ID отклонён');
x = await call('/psn/SomePlayer'); ok(x.s === 502 && x.j.error === 'net', 'сервер: без служебного доступа честно отвечает net');

// весь путь PSN на подменённом fetch (как отвечает Sony по документации psn-api)
const real = globalThis.fetch;
const kv = { m: {}, async get(k) { return this.m[k] ? JSON.parse(this.m[k]) : null; }, async put(k, v) { this.m[k] = v; } };
const seen = [];
globalThis.fetch = async (u, o = {}) => {
  u = String(u); seen.push(u);
  const R = (b, s = 200, h = {}) => new Response(typeof b === 'string' ? b : JSON.stringify(b), { status: s, headers: h });
  if (u.includes('/oauth/authorize')) return R('', 302, { location: 'com.scee.psxandroid.scecompcall://redirect/?code=v3.TEST' });
  if (u.includes('/oauth/token')) return R({ access_token: 'AT', expires_in: 3600, refresh_token: 'RT', refresh_token_expires_in: 5e6 });
  if (u.includes('/profile2')) return u.includes('Nobody') ? R({}, 404) : R({ profile: { accountId: '111', onlineId: 'Tester' } });
  if (u.endsWith('trophyTitles?limit=800')) return R({ trophyTitles: [{ npCommunicationId: 'NPWR00000_00', trophyTitleName: 'Grand Theft Auto VI', npServiceName: 'trophy2' }] });
  if (u.includes('/users/111/npCommunicationIds')) return R({ trophies: [{ trophyId: 1, earned: true, earnedDateTime: '2026-11-20T10:00:00Z' }, { trophyId: 7, earned: true }, { trophyId: 2, earned: false }] });
  if (u.includes('/npCommunicationIds/NPWR00000_00/')) return R({ trophies: [{ trophyId: 1, trophyName: 'Just Like Paradise' }, { trophyId: 2, trophyName: 'Paradise Lost' }, { trophyId: 7, trophyName: 'Trust' }] });
  if (u.includes('xbl.io/api/v2/search')) return R({ people: [{ xuid: '2533', gamertag: 'Tester X' }] });
  if (u.includes('xbl.io/api/v2/achievements/player/2533/2035456122')) return R({ achievements: [{ id: '1', name: 'Just Like Paradise', progressState: 'Achieved', progression: { timeUnlocked: '2026-11-20T10:00:00Z' } }, { id: '3', name: 'Paradise Lost', progressState: 'NotStarted' }] });
  return R({}, 500);
};
x = await call('/psn/Tester', { PSN_NPSSO: 'test-npsso', TOK: kv });
ok(x.s === 200 && x.j.earned.map((e) => e.name).join() === 'Just Like Paradise,Trust', 'PSN: NPSSO → токен → профиль → трофеи с EN-именами');
ok(seen.some((u) => u.includes('npServiceName=trophy2')) && JSON.parse(kv.m.psn).refresh === 'RT', 'PSN: trophy2 и refresh-токен сохранён');
seen.length = 0; x = await call('/psn/Tester', { PSN_NPSSO: 'test-npsso', TOK: kv }); ok(!seen.some((u) => u.includes('/oauth/')), 'PSN: второй запрос без нового входа (токен из KV)');
x = await call('/psn/Nobody', { PSN_NPSSO: 'test-npsso', TOK: kv }); ok(x.j.error === 'notfound', 'PSN: нет такого Online ID → notfound');
x = await call('/xbox/Tester%20X', { XBL_KEY: 'k' }); ok(x.s === 200 && x.j.earned.length === 1 && x.j.earned[0].name === 'Just Like Paradise', 'Xbox: gamertag → xuid → достижения GTA 6 (titleId 2035456122)');
r = P.fromEarned(D, x.j.earned); ok(title(r.idx) === 'Gone Fishing', 'Xbox-ответ понимается той же картой');
globalThis.fetch = real;
console.log(fail ? `\nПРОВАЛОВ: ${fail}` : '\nвсё зелёное'); process.exit(fail ? 1 : 0);
