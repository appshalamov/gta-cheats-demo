// Вкладка «Заработок» (MVP, Игорь 02.11.2026: «разделы заработка на креаторстве и на проверке оставить, но упростить,
// чтобы всё было легко и понятно»). Вместо 18 экранов js/league.js — три состояния и шторки:
//   1) «За что платим» и «Начать» (почта и 18+ одной шторкой) — до партнёрства;
//   2) «Ролики»: мой заработок одной строкой цифр, «Подать ролик», «Как снять ролик», мои ролики со статусом;
//   3) «Проверка»: одна карточка «Это одно и то же место? Да / Нет» и счётчик заработанного.
// Данные — те же window.SB.api (js/api.js): signIn, confirmAge, acceptTerms, becomePartner, submitVideo, listMyVideos,
// getEarnings, mvpReviewOn, getReviewQueue, reviewDecision. Лига, задания, вклады, вывод и админка — в league.js (вход ?admin).
import { getLang } from './i18n.js';
import { I } from './icons.js';
import { loadPlaces, findByKey, searchPlaces, realName, thumbOf, MAP_GAMES } from './places.js';

const S = {
  ru: {
    intro_h: 'Зарабатывайте на местах из GTA', intro_p: 'Два способа, оба бесплатные. Участие — с 18 лет.',
    w1: 'Снимайте ролики о местах', w1s: '{rpm} за 1 000 просмотров и {pct}% с покупок по вашему коду',
    w2: 'Проверяйте места', w2s: '{mod} за каждый ответ «совпадает» или «нет»',
    start: 'Начать', rules: 'Правила',
    join_h: 'Участие в программе', join_p: 'Почта нужна для выплат и вашего кода. Писем с рекламой не будет.',
    email: 'Почта', adult: 'Мне есть 18 лет, правила принимаю', join_go: 'Готово',
    e_email: 'Проверьте почту: похоже на опечатку', e_adult: 'Отметьте, что вам есть 18 лет и правила понятны', e_net: 'Не получилось. Попробуйте ещё раз',
    seg_v: 'Ролики', seg_r: 'Проверка',
    my_earn: 'Мой заработок', t_mat: 'Начисляется', t_av: 'Можно вывести', t_paid: 'Выплачено',
    pay_beta: 'Программа открывается {d}. До этого суммы предварительные, выплат нет.', pay_live: 'Выплаты — {day}-го числа, от {min}.',
    nopay: 'В вашей стране выплат нет. За принятые ролики — дни Pro.',
    rate: 'Платим {rpm} за 1 000 просмотров (Shorts — {rpms}) и {pct}% с покупок по коду {code}.',
    submit: 'Подать ролик', howto: 'Как снять ролик', my_videos: 'Мои ролики', no_videos: 'Здесь появятся ваши ролики и их статус.',
    sv_h: 'Подать ролик', sv_url: 'Ссылка на ролик', sv_place: 'О каком месте ролик', sv_q: 'Название места или улицы', sv_change: 'Изменить',
    sv_note: 'TikTok, Reels, YouTube или Shorts. В описании — ваш код {code} и пометка #реклама.', sv_send: 'Отправить', sv_ok: 'Ролик отправлен на проверку',
    e_bad_url: 'Нужна ссылка на ролик TikTok, Instagram или YouTube', e_duplicate: 'Этот ролик уже подан', e_no_place: 'Выберите место из ролика', sv_none: 'Ничего не нашлось',
    ht_h: 'Как снять ролик',
    ht1: 'Откройте место на «Карте» и сдвиньте ползунок: покажите кадр игры и ту же улицу сегодня.',
    ht2: 'Снимите вертикальный ролик на 15–60 секунд: на месте или записью экрана.',
    ht3: 'В описании — код {code} и пометка #реклама. Пришлите ссылку здесь: после проверки начнём считать просмотры.',
    open_map: 'Открыть карту',
    vs_submitted: 'На проверке', vs_in_review: 'На проверке', vs_awaiting_threshold: 'Ждём 1 000 просмотров', vs_accruing: 'Начисляется',
    vs_closed: 'Завершён', vs_rejected: 'Отклонён', vs_unavailable: 'Недоступен', vs_frozen: 'Приостановлен',
    rv_today: 'Сегодня: {n}', rv_earned: 'заработано {m}', rv_q: 'Это одно и то же место?', yes: 'Да', no: 'Нет',
    rv_in_game: 'В игре', rv_in_real: 'В жизни', rv_slow: 'Посмотрите на фото пару секунд', rv_empty_h: 'Всё проверено',
    rv_empty_p: 'Новые места появятся позже. Загляните завтра.', rv_paused: 'Проверка на паузе: много ошибок на контрольных карточках. Вернём через неделю.',
    rv_n: 'проверка|проверки|проверок',
    rl_h: 'Правила', rl1: 'Участие бесплатное, с 18 лет.', rl2: 'За просмотры: {rpm} за 1 000 (Shorts — {rpms}), не больше {cap} за ролик.',
    rl3: '{pct}% с покупок Pro по вашему коду. Деньги — через {hold} дней после покупки.',
    rl4: 'Проверка мест: {mod} за ответ. Если часто ошибаться на контрольных карточках, проверка встанет на паузу.',
    rl5: 'Выплаты — {day}-го числа, от {min}. Без накруток, чужих роликов и скрытой рекламы: в описании — #реклама.',
    rl6: 'В России и Беларуси выплат нет: вместо денег — дни Pro. Страну подтверждаем перед первой выплатой.',
    ok: 'Понятно',
  },
  en: {
    intro_h: 'Earn with places from GTA', intro_p: 'Two ways, both free. You need to be 18 or older.',
    w1: 'Film videos about places', w1s: '{rpm} per 1,000 views and {pct}% of purchases with your code',
    w2: 'Check places', w2s: '{mod} for every match or no-match answer',
    start: 'Start', rules: 'Rules',
    join_h: 'Join the program', join_p: 'We need your email for payouts and your code. No promo emails.',
    email: 'Email', adult: 'I am 18 or older and accept the rules', join_go: 'Done',
    e_email: 'Check the email, it looks like a typo', e_adult: 'Confirm that you are 18 or older and accept the rules', e_net: 'Something went wrong. Try again',
    seg_v: 'Videos', seg_r: 'Checks',
    my_earn: 'My earnings', t_mat: 'Accruing', t_av: 'Available', t_paid: 'Paid',
    pay_beta: 'The program opens on {d}. Until then amounts are preliminary and there are no payouts.', pay_live: 'Payouts on day {day} of the month, from {min}.',
    nopay: 'There are no payouts in your country. Accepted videos earn Pro days.',
    rate: 'We pay {rpm} per 1,000 views (Shorts {rpms}) and {pct}% of purchases with code {code}.',
    submit: 'Submit a video', howto: 'How to film a video', my_videos: 'My videos', no_videos: 'Your videos and their status will show up here.',
    sv_h: 'Submit a video', sv_url: 'Video link', sv_place: 'Which place is it about', sv_q: 'Place or street name', sv_change: 'Change',
    sv_note: 'TikTok, Reels, YouTube or Shorts. Put your code {code} and #ad in the description.', sv_send: 'Send', sv_ok: 'Video sent for review',
    e_bad_url: 'Paste a link to a TikTok, Instagram or YouTube video', e_duplicate: 'This video has already been submitted', e_no_place: 'Pick the place from the video', sv_none: 'Nothing found',
    ht_h: 'How to film a video',
    ht1: 'Open the place on Map and move the slider: show the game shot and the same street today.',
    ht2: 'Film a vertical video, 15 to 60 seconds: on site or as a screen recording.',
    ht3: 'Put code {code} and #ad in the description. Send the link here: we start counting views after review.',
    open_map: 'Open map',
    vs_submitted: 'In review', vs_in_review: 'In review', vs_awaiting_threshold: 'Waiting for 1,000 views', vs_accruing: 'Accruing',
    vs_closed: 'Closed', vs_rejected: 'Rejected', vs_unavailable: 'Unavailable', vs_frozen: 'On hold',
    rv_today: 'Today: {n}', rv_earned: 'earned {m}', rv_q: 'Is this the same place?', yes: 'Yes', no: 'No',
    rv_in_game: 'In game', rv_in_real: 'In real life', rv_slow: 'Look at the photos for a couple of seconds', rv_empty_h: 'All checked',
    rv_empty_p: 'New places will come later. Come back tomorrow.', rv_paused: 'Checks are paused: too many mistakes on control cards. Back in a week.',
    rv_n: 'check|checks|checks',
    rl_h: 'Rules', rl1: 'Joining is free, 18 or older.', rl2: 'Views: {rpm} per 1,000 (Shorts {rpms}), up to {cap} per video.',
    rl3: '{pct}% of Pro purchases with your code. Money comes {hold} days after the purchase.',
    rl4: 'Checking places: {mod} per answer. Too many mistakes on control cards pause your checks.',
    rl5: 'Payouts on day {day} of the month, from {min}. No fake views, no other people’s videos, no hidden ads: put #ad in the description.',
    rl6: 'No payouts in Russia and Belarus: Pro days instead of money. We confirm your country before the first payout.',
    ok: 'Got it',
  },
};
const lang = () => (getLang() === 'en' ? 'en' : 'ru');
const tx = (k, o = {}) => String(S[lang()][k] ?? S.ru[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => o[x] ?? '');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (c) => '$' + (Math.round(c || 0) / 100).toFixed(2).replace('.', lang() === 'ru' ? ',' : '.');
const plural = (n, forms) => { const f = forms.split('|'); if (lang() === 'en') return n === 1 ? f[0] : f[2]; const a = n % 10, b = n % 100; return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2]; };
const dateLong = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString(lang() === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });
const api = () => window.SB.api;
const GT = { gta6: 'GTA 6', gta5: 'GTA 5' };
// город — по-русски и без года (решение №15); cityOf из places.js отдаёт английское имя из данных
const CITY = { gta6: { ru: 'Майами', en: 'Miami' }, gta5: { ru: 'Лос-Анджелес', en: 'Los Angeles' } };
const where = (g) => `${GT[g] || ''}, ${CITY[g]?.[lang()] || ''}`;
const PL = { tiktok: 'TikTok', reels: 'Reels', youtube: 'YouTube', shorts: 'Shorts', instagram: 'Instagram' };

let ctx = null, P = null, R = null, seg = 'videos', rv = null, busy = false;
export function init(c) { ctx = c; }
const isPartner = () => !!(P?.roles?.includes('creator') && P.adult_at);
const noPay = () => P?.payouts === false;
const nums = () => ({ rpm: money(R.rpm.tiktok), rpms: money(R.rpm.shorts), pct: R.share_pct, mod: money(R.mod_decision_cents), cap: money(R.rpm_cap_cents),
  hold: R.hold_days, day: R.payout_day, min: money(R.payout_min_cents), code: P?.ref_code || '' });
const box = () => document.getElementById('earn-body');

async function load() { [P, R] = await Promise.all([api().getProfile(), api().getRules()]); }

export async function render() {
  const b = box(); if (!b) return;
  try { await load(); } catch { return; }
  b.innerHTML = isPartner() ? await partnerHTML() : introHTML();
  if (isPartner() && seg === 'review') showCard();
}
export const relang = render;

// ── 1. За что платим ──
function introHTML() {
  const n = nums();
  return `<div class="ea">
    <h2 class="ea-h">${esc(tx('intro_h'))}</h2><p class="ea-p">${esc(tx('intro_p'))}</p>
    <div class="group">
      <div class="row row-static ea-way"><span class="row-ic">${I.camera}</span><span class="row-l"><b>${esc(tx('w1'))}</b><small>${esc(tx('w1s', n))}</small></span></div>
      <div class="row row-static ea-way"><span class="row-ic">${I.check}</span><span class="row-l"><b>${esc(tx('w2'))}</b><small>${esc(tx('w2s', n))}</small></span></div>
    </div>
    <button class="btn-primary ea-cta" data-ea="join">${esc(tx('start'))}</button>
    <button class="btn-ghost ea-cta" data-ea="rules">${esc(tx('rules'))}</button>
    <p class="ea-fine">${esc(payLine())}</p>
  </div>`;
}
const payLine = () => (R.payouts_open ? tx('pay_live', nums()) : tx('pay_beta', { d: dateLong(R.open_at) }));

function joinSheet(err = '') {
  ctx.openSheet(`<h2 class="pick-t">${esc(tx('join_h'))}</h2><p class="ea-p">${esc(tx('join_p'))}</p>
    <label class="ea-lbl" for="ea-email">${esc(tx('email'))}</label>
    <input class="ea-in" id="ea-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" enterkeyhint="done" value="${esc(P?.email || '')}">
    <label class="ea-check"><input type="checkbox" id="ea-adult"><span>${esc(tx('adult'))}</span></label>
    <button class="ea-link" data-ea="rules">${esc(tx('rules'))}</button>
    <p class="ea-err" id="ea-err" role="alert">${esc(err)}</p>
    <button class="btn-primary ea-cta" data-ea="join-go">${esc(tx('join_go'))}</button>`, 'sheet-pick sheet-ea');
}
async function joinGo() {
  const email = document.getElementById('ea-email')?.value.trim() || '', adult = document.getElementById('ea-adult')?.checked;
  const err = (k) => { const e = document.getElementById('ea-err'); if (e) e.textContent = tx(k); };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('e_email');
  if (!adult) return err('e_adult');
  if (busy) return; busy = true;
  try {
    // страну не угадываем по языку устройства (русский язык ≠ Россия): её подтвердит проверка личности перед первой выплатой
    const a = api();
    if (!P.email || P.email !== email) await a.signIn(email);
    await a.confirmAge(true); await a.acceptTerms(); await a.becomePartner({});
    await a.mvpReviewOn();
    P = await a.getProfile(); ctx.onProfile?.(P);
    ctx.closeSheet(); ctx.haptic(); seg = 'videos'; await render();
  } catch { err('e_net'); } finally { busy = false; }
}
function rulesSheet() {
  const n = nums();
  ctx.openSheet(`<h2 class="pick-t">${esc(tx('rl_h'))}</h2><ol class="ea-rules">${['rl1', 'rl2', 'rl3', 'rl4', 'rl5', 'rl6'].map((k) => `<li>${esc(tx(k, n))}</li>`).join('')}</ol>
    <button class="btn-primary ea-cta" data-ea="close">${esc(tx('ok'))}</button>`, 'sheet-pick sheet-ea');
}

// ── 2. Ролики и заработок ──
async function partnerHTML() {
  const segs = `<div class="mini-seg ea-seg" role="tablist">${[['videos', 'seg_v'], ['review', 'seg_r']].map(([k, l]) => `<button role="tab" aria-selected="${seg === k}" class="${seg === k ? 'on' : ''}" data-ea="seg" data-v="${k}">${esc(tx(l))}</button>`).join('')}</div>`;
  if (seg === 'review') return `<div class="ea">${segs}<div id="ea-rv"></div></div>`;
  const [E, V] = await Promise.all([api().getEarnings(), api().listMyVideos()]);
  const n = nums(), tot = E.totals || {};
  const money3 = noPay() ? `<p class="ea-p">${esc(tx('nopay'))}</p>` : `
    <div class="ea-money"><span>${esc(tx('my_earn'))}</span><b>${money(tot.total)}</b></div>
    <div class="ea-tri"><span><small>${esc(tx('t_mat'))}</small><b>${money(tot.maturing)}</b></span><span><small>${esc(tx('t_av'))}</small><b>${money(tot.available)}</b></span><span><small>${esc(tx('t_paid'))}</small><b>${money(tot.paid)}</b></span></div>
    <p class="ea-fine">${esc(payLine())}</p>`;
  const vids = await Promise.all(V.map(videoRow));
  return `<div class="ea">${segs}${money3}
    <p class="ea-rate">${esc(tx('rate', n))}</p>
    <button class="btn-primary ea-cta" data-ea="submit">${I.plus}${esc(tx('submit'))}</button>
    <button class="btn-ghost ea-cta" data-ea="howto">${esc(tx('howto'))}</button>
    <h3 class="ea-sh">${esc(tx('my_videos'))}</h3>
    ${vids.length ? `<div class="group">${vids.join('')}</div>` : `<p class="ea-empty">${esc(tx('no_videos'))}</p>`}
  </div>`;
}
const ST = { accruing: 'ok', closed: 'ok', rejected: 'no', unavailable: 'no' };
async function videoRow(v) {
  const pl = v.place ? await findByKey(`place:${v.place.world}:${v.place.id}`).catch(() => null) : null;
  const name = pl ? realName(pl) : v.url;
  const earned = v.earned?.total_cents ? ` ${money(v.earned.total_cents)}` : '';
  return `<div class="row row-static ea-vid"><span class="row-ic">${I.video}</span><span class="row-l"><b>${esc(name)}</b><small>${esc([PL[v.platform] || '', GT[v.place?.world] || ''].filter(Boolean).join(', '))}</small></span>
    <span class="ea-st ${ST[v.status] || 'wait'}">${esc(tx('vs_' + v.status))}${esc(earned)}</span></div>`;
}

// «Подать ролик»: ссылка и место (из карточки места — уже выбрано)
let svPlace = null;
export async function submitFor(world, placeId) {
  try { await load(); } catch { return; }
  if (!isPartner()) { ctx.goTab('earn'); return; }
  svPlace = world && placeId ? { world, id: placeId } : null;
  await submitSheet();
}
async function submitSheet(url = '') {
  const pl = svPlace ? await findByKey(`place:${svPlace.world}:${svPlace.id}`).catch(() => null) : null;
  const placeHTML = pl ? `<div class="row row-static ea-chosen"><span class="row-ic">${I.pin}</span><span class="row-l"><b>${esc(realName(pl))}</b><small>${esc(where(svPlace.world))}</small></span>
      <button class="ea-link" data-ea="unplace">${esc(tx('sv_change'))}</button></div>`
    : `<input class="ea-in" id="ea-q" type="search" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" placeholder="${esc(tx('sv_q'))}"><div class="ea-sug" id="ea-sug"></div>`;
  ctx.openSheet(`<h2 class="pick-t">${esc(tx('sv_h'))}</h2>
    <label class="ea-lbl" for="ea-url">${esc(tx('sv_url'))}</label>
    <input class="ea-in" id="ea-url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://www.tiktok.com/@…" value="${esc(url)}">
    <span class="ea-lbl">${esc(tx('sv_place'))}</span>${placeHTML}
    <p class="ea-fine">${esc(tx('sv_note', nums()))}</p>
    <p class="ea-err" id="ea-err" role="alert"></p>
    <button class="btn-primary ea-cta" data-ea="sv-send">${esc(tx('sv_send'))}</button>`, 'sheet-pick sheet-ea');
  const q = document.getElementById('ea-q');
  if (q) q.addEventListener('input', () => suggest(q.value));
}
let sugSeq = 0;
async function suggest(q) {
  const my = ++sugSeq, el = document.getElementById('ea-sug'); if (!el) return;
  if (q.trim().length < 2) { el.innerHTML = ''; return; }
  const games = [ctx.game(), ...MAP_GAMES.filter((g) => g !== ctx.game())].filter((g) => MAP_GAMES.includes(g));
  const lists = await Promise.all(games.map((g) => loadPlaces(g).then((d) => searchPlaces(d, q, { kind: 'place' }).map((o) => ({ o, g }))).catch(() => [])));
  if (my !== sugSeq) return;
  const hits = lists.flat().slice(0, 5);
  el.innerHTML = hits.length ? hits.map(({ o, g }) => `<button class="row ea-hit" data-ea="pick" data-g="${g}" data-id="${esc(o.id)}"><span class="row-ic">${I.pin}</span><span class="row-l"><b>${esc(realName(o))}</b><small>${esc(where(g))}</small></span></button>`).join('')
    : `<p class="ea-empty">${esc(tx('sv_none'))}</p>`;
}
async function svSend() {
  const url = document.getElementById('ea-url')?.value.trim() || '';
  const err = (k) => { const e = document.getElementById('ea-err'); if (e) e.textContent = tx(k); };
  if (!svPlace) return err(url ? 'e_no_place' : 'e_bad_url');
  if (busy) return; busy = true;
  try {
    await api().submitVideo({ url, places: [{ world: svPlace.world, id: svPlace.id, role: 'about' }], disclosure: true });
    svPlace = null; ctx.closeSheet(); ctx.haptic(); ctx.toast(tx('sv_ok')); seg = 'videos'; render();
  } catch (e) { err('e_' + (['bad_url', 'duplicate', 'no_place'].includes(e?.code) ? e.code : 'bad_url')); } finally { busy = false; }
}
function howtoSheet() {
  const n = nums();
  ctx.openSheet(`<h2 class="pick-t">${esc(tx('ht_h'))}</h2><ol class="ea-rules">${['ht1', 'ht2', 'ht3'].map((k) => `<li>${esc(tx(k, n))}</li>`).join('')}</ol>
    <button class="btn-primary ea-cta" data-ea="to-map">${I.map}${esc(tx('open_map'))}</button>`, 'sheet-pick sheet-ea');
}

// ── 3. Проверка мест: одна карточка ──
// В MVP проверяем только места и фото (кадр игры и снимок из жизни); ролики проверяет команда — смотреть их пришлось бы
// снаружи приложения (правило «не уводить из приложения»). Ответ «Нет» — причина «Не то место» (rr_p4).
let shownAt = 0;
async function showCard() {
  const el = document.getElementById('ea-rv'); if (!el) return;
  let st;
  try { st = await api().mvpReviewOn(); } catch { el.innerHTML = ''; return; }
  const today = st.today || { checked: 0, cents: 0 };
  const count = `<p class="ea-count"><b>${esc(tx('rv_today', { n: `${today.checked} ${plural(today.checked, tx('rv_n'))}` }))}</b>${noPay() ? '' : `, ${esc(tx('rv_earned', { m: money(today.cents) }))}`}</p>`;
  if (st.stage === 'paused') { el.innerHTML = `${count}<p class="ea-empty">${esc(tx('rv_paused'))}</p>`; return; }
  const q = (await api().getReviewQueue().catch(() => [])).filter((x) => x.kind !== 'video');
  if (!q.length) { el.innerHTML = `${count}<div class="ea-done">${I.check}<h3>${esc(tx('rv_empty_h'))}</h3><p>${esc(tx('rv_empty_p'))}</p></div>`; return; }
  rv = q[0];
  const pl = await findByKey(`place:${rv.place.world}:${rv.place.id}`).catch(() => null);
  const g = pl && thumbOf(pl, 'game'), r = pl && thumbOf(pl, 'real');
  const fig = (src, cap) => `<figure>${src ? `<img src="${esc(src)}" alt="" decoding="async">` : '<span class="ea-noimg"></span>'}<figcaption>${esc(cap)}</figcaption></figure>`;
  el.innerHTML = `${count}<div class="ea-rv">
    <div class="ea-pair">${fig(g, tx('rv_in_game'))}${fig(r, tx('rv_in_real'))}</div>
    <h3>${esc(pl ? realName(pl) : '')}</h3><p class="ea-fine">${esc(where(rv.place.world))}</p>
    <p class="ea-q">${esc(tx('rv_q'))}</p>
    <div class="ea-yn"><button class="btn-ghost" data-ea="rv" data-v="no">${esc(tx('no'))}</button><button class="btn-primary" data-ea="rv" data-v="ok">${esc(tx('yes'))}</button></div>
  </div>`;
  shownAt = Date.now();
}
async function decide(v) {
  if (!rv || busy) return;
  const ms = Date.now() - shownAt;
  if (ms < (R?.mod_min_ms || 2000)) { ctx.toast(tx('rv_slow')); return; }
  busy = true;
  try { await api().reviewDecision(rv.id, v, v === 'no' ? 'rr_p4' : null, ms); ctx.haptic(); } catch { } finally { busy = false; }
  rv = null; showCard();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-ea]'); if (!el || !ctx) return;
  const a = el.dataset.ea, v = el.dataset.v;
  switch (a) {
    case 'join': ctx.haptic(); joinSheet(); break;
    case 'join-go': joinGo(); break;
    case 'rules': ctx.haptic(); rulesSheet(); break;
    case 'close': ctx.closeSheet(); break;
    case 'seg': if (v !== seg) { ctx.haptic(); seg = v; render(); } break;
    case 'submit': ctx.haptic(); svPlace = null; submitSheet(); break;
    case 'howto': ctx.haptic(); howtoSheet(); break;
    case 'to-map': ctx.closeSheet(); ctx.goTab('map'); break;
    case 'pick': svPlace = { world: el.dataset.g, id: el.dataset.id }; submitSheet(document.getElementById('ea-url')?.value || ''); break;
    case 'unplace': svPlace = null; submitSheet(document.getElementById('ea-url')?.value || ''); break;
    case 'sv-send': svSend(); break;
    case 'rv': decide(v); break;
  }
});
