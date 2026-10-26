// Экраны креаторов: хаб «Для авторов» вверху Настроек, Лига (задания, ролики, заработок, рейтинг), «Мой заработок»,
// «Мои ролики», «Ролики об этом месте» (вертикальная лента, встроенный плеер), «Добавить», «Проверка» (лента карточек),
// «Моя ссылка и код», «Честные правила», вход почтой и 18+. Источники: «Дизайн Secret Base/02 концепт/экраны-лига.md»,
// Ресерч 28 §6.0 (решения №11–№16, файл 31), 00 §4. Данные — только через window.SB.api (js/api.js; сейчас мок).
// Слой #cr — над приложением, без таб-бара; шторки — общие (#sheet-layer из app.js), поэтому идут поверх слоя.
// Деньги: рядом с любой суммой — строка медианы, до первого раунда — «Первые выплаты — 20 ноября. Медиану покажем после них».
// Страна без выплат (РФ, РБ) и младше 18 — только дни Pro, о выплатах ни слова. Пробный доступ — вход в «Для авторов» скрыт.

import './api.js';
import { APP, HERO } from './config.js';
import { getLang, L } from './i18n.js';
import { I } from './icons.js';
import { loadPlaces, realOf, thumbOf, placeKey, searchPlaces, featured, imgUrl } from './places.js';

const api = () => window.SB.api;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ───────── строки ─────────
const S = {
  ru: {
    for_authors: 'Для авторов', league: 'Лига креаторов', title: 'Зарабатывайте, снимая ролики о местах',
    title_np: 'Снимайте ролики о местах', title_minor: 'Места и пасхалки от вас',
    first_pay: 'Первые выплаты — {d}. Медиану покажем после них', median: 'Медиана у креаторов: {m}',
    hub_np_sub: 'За принятый ролик от 1 000 просмотров — 30 дней Pro', hub_minor_sub: 'За принятые вклады — дни Pro. Креатором можно стать с 18 лет',
    hub_open: 'Лига открыта: задания недели', hub_lock: 'Лига откроется на 10 000 просмотров ролика о месте',
    hub_guest: 'Войти почтой', hub_player: 'Стать партнёром', hub_partner_note: 'Бесплатно, без подписки. 18+ и вход почтой',
    partner: 'Партнёрство бесплатное, с 18 лет, покупка не нужна. Условия одинаковые для всех партнёров. Для съёмки — рабочий Pro: 14 дней после подтверждения аккаунта и +30 дней за каждый принятый ролик',
    trial_t: 'Пробный доступ', trial_p: 'Все коды и поиск открыты без входа и без карты оплаты. Карта и места из жизни — в Pro',
    buys_h: 'Покупки по вашей ссылке', buy_pass: '3 месяца — {p}', buy_year: 'Год — {p}', buy_month: 'Месяц — {p} за каждую оплату', n_buys: '{n} покупка|{n} покупки|{n} покупок', n_pays: '{n} оплата|{n} оплаты|{n} оплат',
    buys_note: 'Доступно через 30 дней после покупки. При возврате доля откатывается из будущих начислений', work_pro: 'Рабочий Pro до {d}. +30 дней за каждый принятый ролик от 1 000 просмотров', work_pro_end: 'Рабочий Pro закончился {d}. +30 дней за каждый принятый ролик от 1 000 просмотров',
    how1: 'Снимите место из игры в жизни', how2: 'Подайте ролик со своей ссылкой', how3: 'Получайте 40% с покупок по коду',
    how3_np: 'Получайте дни Pro за принятые ролики',
    my_earn: 'Мой заработок', my_earn_sub: 'Начисления по дням, ролики, вывод', pro_days: 'Дни Pro', pro_days_sub: 'За вклады, ролики и подарки друзьям',
    my_videos: 'Мои ролики', my_link: 'Моя ссылка и код', review: 'Проверка', review_sub: 'Лента карточек: смахните вправо или влево',
    review_how: 'Как стать модератором', add: 'Добавить ролик или место', add_minor: 'Добавить место или пасхалку', rules: 'Честные правила',
    rules_sub: 'Доли, сроки, что запрещено', rules_sub_np: 'Как устроены вклады, ролики и дни Pro', code_sub: 'Код {c}',
    gift_sub: 'Подарок другу по ссылке', n_days_x: '{n} день|{n} дня|{n} дней', n_videos: '{n} ролик|{n} ролика|{n} роликов', n_on_review: 'на проверке',
    tab_tasks: 'Задания', tab_videos: 'Ролики', tab_earn: 'Заработок', tab_rating: 'Рейтинг',
    close: 'Закрыть', back: 'Назад', copy: 'Скопировать', copied: 'Скопировано', share: 'Поделиться', save: 'Сохранить', next: 'Дальше', done: 'Готово', ok: 'Понятно',
    t_unlock: 'Наберите 10 000 просмотров на ролике о месте — откроется Лига', t_unlock_d: 'Любая площадка, ваша ссылка в описании',
    t_week: 'Снимите про место недели: {p}', t_week_d: 'Место в жизни и сравнение в приложении, до 60 секунд',
    t_fresh: 'Свежая находка игрока: {p}, роликов ещё нет', t_fresh_d: 'Нашёл {who} {d}. Снимите первым',
    t_month: 'Наберите 100 000 просмотров за месяц', t_month_d: 'Все ваши ролики о местах вместе',
    t_done: 'Выполнено', of: '{a} из {b}', submit_video: 'Подать ролик', invite: 'Ввести код приглашения',
    rates_h: 'Ставки за просмотры', r_main: 'TikTok, Reels и YouTube', r_shorts: 'YouTube Shorts', r_line: '{r} за 1 000, до {cap} за ролик, от {min}',
    r_ex: 'Пример: ролик набрал 1 000 000 просмотров', r_note: 'Ставка зависит от того, сколько зрители ролика оплачивают. Пересматривается раз в две недели.',
    r_main_earn: 'Главный заработок — 40% с каждой покупки по вашему коду. Просмотры — добавка.',
    lock_minor: 'Лига креаторов — с 18 лет. Задания и ролики можно смотреть уже сейчас',
    np_tasks: 'За принятый ролик от 1 000 просмотров — 30 дней Pro. Ролик с вашей ссылкой дарит другу место и +30 дней к первой покупке',
    v_all: 'Все', v_mine: 'Мои', v_note: 'У чужих роликов видны только просмотры и место. Заработок со своего ролика — во вкладке «Мои» и в «Моём заработке».',
    rating_empty: 'Рейтинг появится после первого раунда', rating_note: 'Просмотры роликов с кодом и начисления — с согласия автора, команда вне зачёта.',
    for_month: 'начислено за {m}', month_10: 'октябрь', accruing: 'Начисляется', available: 'Доступно', paid: 'Выплачено', in_payout: 'В выплате',
    round_in: 'Раунд {d}, через {n}', round_on: 'Раунд {d}', withdraw: 'Вывести {s}', withdraw_min: 'Вывод от {min}: доступно {s}',
    by_day: 'Начисления по дням', tap_bar: 'Нажмите на столбик — покажем сумму дня', no_acc: 'начислений нет',
    leg_code: 'Доля по коду', leg_views: 'Просмотры', leg_other: 'Задания, авторы, креаторы',
    sources: 'Откуда деньги', funnel: 'Путь зрителя', f_views: 'Просмотры', f_clicks: 'Переходы по ссылке', f_trials: 'Пробный доступ', f_pays: 'Покупки по коду', f_earned: 'Начислено', c_views: '{n} просмотр|{n} просмотра|{n} просмотров', c_clicks: '{n} переход|{n} перехода|{n} переходов', c_pays: '{n} покупка|{n} покупки|{n} покупок', c_earned: 'начислено',
    f_of: '{p} от прошлого шага', per_video: 'Мои ролики', all_days: 'Все дни: {n}', collapse: 'Свернуть', days_list: 'По дням',
    rs_share: 'Доля 40% по коду {c}', rs_share_d: '{n} покупок, холд 30 дней', rs_rpm: 'Просмотры', rs_rpm_d: 'Половина — авансом по 10-му дню ролика, остаток — по 30-му',
    rs_cpa: '$15 за приведённого креатора', rs_cpa_d: 'когда он заработает $50 доли за 90 дней', rs_task: 'Задания', rs_task_d: 'Пары «игра и жизнь», доступно через 7 дней после проверки',
    rs_author: 'Доля автора места', rs_author_d: '10% сверху к роликам о вашем месте, 12 месяцев', rs_queue: 'Проверки', rs_queue_d: '$0,01 за решение при точности от 70%',
    st_maturing: 'начисляется', st_available: 'доступно', st_paid: 'выплачено', st_reversed: 'отменено',
    d_share: '{n} покупка по коду|{n} покупки по коду|{n} покупок по коду', d_rpm: 'просмотры', d_task: 'задание принято', d_cpa: 'приведённый креатор', d_author: 'доля автора места', d_queue: 'проверки',
    hold_note: 'Доля по коду и $15 за креатора — после холда 30 дней. Задания — через 7 дней после проверки. Вывод — 20-го числа, от $25.',
    mock_note: 'Пример данных. Настоящие цифры придут с сервера.', earn_empty: 'Здесь появятся деньги за ваши ролики', earn_empty_p: 'Подайте первый — проверим до 48 часов',
    pd_total: '{n} дней Pro', pd_sub_minor: 'До 18 лет за вклады начисляем дни Pro', pd_sub_np: 'За принятые вклады, ролики и подарки друзьям',
    pd_friend: 'Друг купил Pro по вашей ссылке', pd_contrib: 'Принятые вклады', pd_video: 'Принятый ролик от 1 000 просмотров', pd_note: 'Подарки друзьям — не больше 12 в год.',
    vs_submitted: 'Подан', vs_in_review: 'На проверке', vs_pending_review: 'На проверке', vs_awaiting_threshold: 'Ждёт порога', vs_accruing: 'Начисляется', vs_rejected: 'Не принят', vs_unavailable: 'Удалён или скрыт', vs_closed: 'Итог', vs_frozen: 'Проверяем просмотры',
    vf_all: 'Все', vf_review: 'Проверка', vf_acc: 'Начисляется', vf_no: 'Не принят',
    rj_no_code: 'В описании нет кода {code}. Добавьте его и подайте снова',
    rj_gameplay: 'Есть кадры из игры: без оплаты просмотров, остальное засчитано',
    rj_not_place: 'Это не то место. Выберите другое или подайте ролик без него', rj_reused: 'Этот ролик уже подавали',
    rj_place_not_at_timecode: 'На этой секунде места не видно и не слышно. Укажите секунду, где оно есть', rj_unsafe: 'Ролик снят на частной территории или небезопасно',
    vu_note: 'Ролик удалён или скрыт. Начисления остановлены',
    steps_review: 'На проверке', steps_review_d: 'ищем код {code} в описании; первый ролик каждого автора смотрит человек',
    steps_wait: 'Ждёт порога', steps_wait_d: 'от 1 000 просмотров', steps_acc: 'Начисляется', steps_acc_d: 'аванс — половина по снимку 10-го дня, остаток — по 30-му',
    send_again: 'Отправить снова', videos_empty: 'Роликов пока нет', videos_empty_p: 'Снимите место из игры в жизни и подайте ролик со своей ссылкой.',
    feed_place: 'Об этом месте', feed_mine: 'Мои ролики', counter: '{a} из {b}', views_n: '{n} просмотров', your_video: 'ваш ролик', team: 'команда',
    shoot: 'Снять про это', stats: 'Статистика', preview_only: 'Превью: этот ролик смотрят в приложении площадки', example_play: 'Пример: здесь играет ролик',
    earn_video: 'Заработок с ролика', feed_empty: 'Про это место роликов пока нет', feed_empty_p: 'Снимите первым: ваш ролик появится здесь после проверки.',
    vstat_h: 'Статистика ролика', vstat_by_day: 'Просмотры по дням', vstat_tap: 'Нажмите на столбик — покажем просмотры за день', vstat_link: 'Ваша ссылка для этого ролика',
    vstat_link_note: 'Переходы и покупки считаем по этой ссылке. Другие видят у ролика только просмотры.', s_share: 'Доля 40% по коду', s_rpm: 'Оплата просмотров',
    s_rpm_low: 'меньше $3 — не начисляется', s_since: 'с {d}',
    add_h: 'Добавить', ty_video: 'Ролик', ty_video_d: 'Ссылка на ваш ролик о месте', ty_place: 'Место или пасхалка', ty_place_d: 'Новое место, пасхалка или другой ракурс',
    ty_pair: 'Пара «игра и жизнь»', ty_pair_d: 'Откроется Скаутам: 5 принятых вкладов', ty_found: 'Нашёл тут', ty_found_d6: 'В GTA 6 — с выхода игры 19 ноября', ty_found_d5: 'Пасхалка, которую видите в игре',
    ty_report: 'Сообщить об ошибке', ty_report_d: 'Не то место, неверный адрес, нарушение',
    sv_h: 'Подать ролик', sv_url: 'Ссылка на ролик', sv_url_ph: 'tiktok.com/@ник/video/…', sv_place: 'Место', sv_pick: 'Выбрать', sv_change: 'Сменить', sv_code: 'Ваш код',
    sv_note: 'После отправки дадим код SB- для описания: так мы подтвердим, что ролик ваш. Его можно удалить через 7 дней после проверки',
    sv_send: 'Подать', sv_bad_url: 'Это не ссылка на ролик TikTok, YouTube, Instagram или Snapchat', sv_no_place: 'Выберите место',
    sv_ok: 'Ролик подан', sv_ok_code: 'Добавьте в описание ролика код', sv_ok_link: 'Ваша ссылка для этого ролика',
    sv_ok_link_note: 'Отдельно от общей ссылки: по ней считаем переходы и покупки с этого ролика',
    pick_h: 'Выберите место', pick_ph: 'Название или адрес', pick_none: 'Ничего не нашли. Попробуйте другое слово.',
    pf_h: 'Место или пасхалка', pf_side: 'Где видно', pf_kind: 'Что это', pf_where: 'Где', pf_where_ph: 'Адрес или ориентир', pf_src: 'Источник', pf_src_ph: 'Ссылка или откуда вы знаете',
    k_place: 'Место', k_egg: 'Пасхалка', in_game: 'В игре', in_life: 'В жизни',
    rp_h: 'Сообщить об ошибке', rp_r1: 'Не то место', rp_r2: 'Неверный адрес', rp_r3: 'Плохое фото', rp_r4: 'Нарушение', rp_note: 'Что не так', rp_note_ph: 'Коротко, одной фразой',
    sent_h: 'Отправлено', sent_1: 'Вклад на проверке', sent_2: 'Модератор сверит место и источник', sent_p: 'За принятый вклад — «Найдено @{n}» и дни Pro.',
    req_fields: 'Заполните отмеченные поля',
    lg_h: 'Стать партнёром', lg_sub: '18+ и вход почтой. Партнёрство бесплатное, покупка не нужна', lg_email: 'Почта', lg_send: 'Прислать код', lg_note: 'Пароль не нужен: пришлём код на почту.',
    lg_code_h: 'Код из письма', lg_code_sub: 'Отправили на {e}', lg_code: 'Код', lg_enter: 'Войти', lg_bad_email: 'Проверьте адрес почты', lg_bad_code: 'Код — 4–6 цифр из письма',
    lg_age_h: 'Вам есть 18 лет?', lg_age_sub: 'Деньги начисляем только с 18 лет. Возраст подтвердим при первом выводе вместе с личностью', lg_yes: 'Да, мне 18', lg_no: 'Нет',
    lg_minor_h: 'Пока без денег', lg_minor_sub: 'До 18 лет за принятые вклады начисляем дни Pro. Вклады и «Найдено @ник» работают как обычно',
    lg_draft: 'Черновик сохранён на этом устройстве и отправится после входа',
    wd_h: 'Вывести {s}', wd_sub: 'Выплата {d}, от {min}. Первый вывод — с проверкой личности', wd_1: 'Сумма: {s}, всё доступное', wd_2: 'Проверка личности и возраста 18+ у платёжного партнёра, один раз. Ссылку пришлём на {e}', wd_3: 'Раунд {d}',
    wd_fee: 'Комиссию способа выплаты платит получатель.', wd_send: 'Отправить заявку', wd_below_h: 'Пока меньше {min}', wd_below_p: 'Доступно {s}. Остаток перейдёт на следующий раунд и сложится с новыми начислениями.',
    wd_ok_h: 'Заявка принята', wd_ok_1: 'Заявка отправлена', wd_ok_2: 'На проверке: первую выплату смотрит человек', wd_ok_3: 'Выплата в раунд {d}', wd_status: 'Статус выплаты: на проверке',
    ml_code: 'Ваш код', ml_link: 'Общая ссылка', ml_gift: 'Зритель получит это место и +30 дней к первой покупке. Вам — 40% с его покупки после холда 30 дней',
    ml_gift_np: 'Друг получит это место и +30 дней к первой покупке. Вам — 30 дней Pro, когда он купит Pro', my_link_p: 'Моя ссылка',
    ml_cpa: '$15 за приведённого креатора, когда он заработает $50 доли за 90 дней.', ml_pro: 'Рабочий Pro: 14 дней после подтверждения аккаунта площадки и +30 дней за каждый принятый ролик от 1 000 просмотров',
    ml_acc_h: 'Аккаунты площадок', ml_acc_p: 'Один раз добавьте код {c} в описание профиля на площадке. Так мы знаем, что ролики с этого аккаунта ваши.',
    acc_verified: 'подтверждён', acc_pending: 'ищем код', acc_none: 'не подключён', acc_soon: 'подключение — с ноября',
    rv_today: 'Сегодня: проверено {n}, точность {a}%.', rv_cents: 'Начислено {s}', rv_ok: 'Подходит', rv_no: 'Не подходит', rv_why: 'Почему не подходит?',
    rv_k_video: 'Ролик', rv_k_place: 'Новое место', rv_k_photo: 'Новое фото к месту', rv_done: 'Пачка проверена', rv_done_p: 'Новые карточки появятся, когда авторы пришлют вклады.', rv_more: 'Ещё раз',
    rv_left: 'Осталось {n}', rv_hint: 'Смахните вправо — подходит, влево — не подходит',
    fc_code_found: 'Код SB- в описании найден', fc_code_missing: 'Кода SB- в описании нет', fc_place_named: 'Место названо в описании', fc_street: 'Снято с улицы',
    fc_no_people: 'Без лиц и номеров машин', fc_source_link: 'Есть ссылка на источник', fc_side_real: 'Вид в жизни',
    rr_v1: 'Нет кода SB- в описании', rr_v2: 'Геймплей GTA в ролике', rr_v3: 'Ролик не про это место', rr_v4: 'Чужой ролик',
    rr_p1: 'Похоже на снимок Google Maps или Street View', rr_p2: 'Кадр игры или ИИ-картинка', rr_p3: 'В кадре лица или номера машин', rr_p4: 'Не то место', rr_p5: 'Слишком темно или размыто',
    mod_how: 'Два пути: 5 принятых вкладов или приглашение модератора. Дальше — короткий экзамен на 20 примеров.', mod_how_pay: ' Модераторы получают деньги за точные проверки.',
    mod_exam: 'Экзамен: 20 примеров, нужно 16 верных', mod_student: 'Режим ученика: ваши решения сверяются с модераторами, {n} проверок с точностью от {a}%',
    mod_now: 'У вас {n} из 5 принятых вкладов',
    ru_h_rates: 'Доли и ставки', ru_code: 'По вашему коду', ru_code_v: '40% с каждой покупки, после холда 30 дней', ru_views: 'Просмотры TikTok, Reels и YouTube', ru_shorts: 'YouTube Shorts',
    ru_author: 'Автор места', ru_author_v: '10% сверху к роликам о нём, 12 месяцев', ru_scout: 'Скаут', ru_scout_v: '$10 за принятую пару', ru_cpa: 'Приведённый креатор', ru_cpa_v: '$15, когда он заработает $50 за 90 дней',
    ru_mod: 'Модератор', ru_mod_v: '$0,01 за решение при точности от 70%',
    ru_h_terms: 'Сроки', ru_views_t: 'Просмотры', ru_views_tv: 'половина — по 10-му дню ролика, остаток — по 30-му', ru_tasks_t: 'Задания', ru_tasks_tv: 'через 7 дней после проверки',
    ru_hold: 'Доля по коду', ru_hold_v: 'холд 30 дней', ru_pay: 'Выплата', ru_pay_v: '20-го числа, от $25', ru_first: 'Первый вывод', ru_first_v: 'с проверкой личности, 18+', ru_big: 'Больше $500', ru_big_v: 'смотрит человек',
    ru_h_pro: 'Рабочий Pro для партнёров', ru_pro_p: '{a} дней после подтверждения аккаунта площадки и +{b} дней за каждый принятый ролик от {v} просмотров. Pro не меняет ни одной цифры заработка. Стать партнёром — бесплатно.',
    ru_h_np: 'Что вы получаете', ru_np1: 'Принятый вклад', ru_np1v: '«Найдено @ник» и дни Pro', ru_np2: 'Принятый ролик от 1 000 просмотров', ru_np2v: '30 дней Pro', ru_np3: 'Друг купил Pro по ссылке', ru_np3v: '30 дней Pro, до 12 в год',
    ru_h_no: 'Что запрещено', ru_no1: 'Накрутка просмотров и покупок', ru_no1v: 'пауза кода', ru_no2: 'Коды в чужих сообществах', ru_no2v: 'пауза 7 дней, повтор — исключение',
    ru_no3: 'Один ролик с нескольких аккаунтов', ru_no3v: 'отказ', ru_no4: 'Геймплей GTA в ролике с кодом', ru_no4v: 'отказ', ru_no5: 'Снимки Street View с экрана, чужие ролики', ru_no5v: 'отказ',
    ru_h_rate: 'Как считаем ставку за просмотры', ru_rate_p: 'Ставка считается от того, сколько зрители по вашему коду покупают, за вычетом доли креатора {p}%. Пересматривается раз в две недели: повышение — сразу, снижение — с предупреждением за {d} дней.',
    ru_h_ad: 'Реклама', ru_ad_p: 'Ролик с вашим кодом — реклама. Скажите об этом голосом и напишите в подписи.',
    ru_change: 'Правила меняем не чаще раза в месяц, с анонсом за 30 дней и никогда задним числом.',
    inv_h: 'Код приглашения', inv_p: 'Код от модератора или амбассадора открывает Лигу сразу. Одноразовый, действует 30 дней.', inv_ph: 'Например, LIGA-7Q2K', inv_send: 'Открыть Лигу',
    inv_bad: 'Код не подошёл. Проверьте буквы и цифры', inv_old: 'Срок кода истёк. Попросите новый', inv_ok: 'Лига открыта',
    err: 'Не получилось. Проверьте сеть и попробуйте ещё раз', soon_pair: 'Пара откроется после 5 принятых вкладов', soon_found: 'Откроется с выхода GTA 6, 19 ноября',
    // режимы (08 ТЗ §1, §2.4): demo — «Пример интерфейса» на каждом экране с суммами (FTC; check_code.py), beta — «предварительные»
    demo_note: 'Пример интерфейса. Цифры показаны для примера', beta_note: 'Суммы предварительные: программа в закрытом доступе',
    beta_pay: 'Выплаты начнутся, когда программа откроется для всех. Начисления сохранятся', for_month_pre: 'предварительно за {m}',
    rs_pair: 'Пары Скаута', rs_pair_d: '$10 за принятую пару «игра и жизнь»', d_pair: 'пара принята',
    rj_no_disclosure: 'В начале ролика нет пометки о рекламе. Добавьте её голосом и текстом',
    // список ожидания и приглашение (08 §2)
    wl_title: 'Снимайте ролики о местах из игр — мы платим за просмотры и делимся покупками',
    wl_l1: '{r} за 1 000 просмотров, до {cap} за ролик, от {min}. Shorts — {rs}', wl_l2: '{p}% с каждой покупки по вашей ссылке в течение {m} месяцев',
    wl_l3: 'Участие бесплатное, с 18 лет', wl_plate: 'Программа откроется {d}, в день выхода GTA 6. Сейчас — закрытый доступ по приглашениям',
    wl_join: 'Записаться', wl_have: 'У меня есть приглашение', wl_partner: 'Стать партнёром',
    wl_joined: 'Вы в списке. Номер {n}', wl_joined_p: 'Пришлём приглашение на почту, когда программа откроется', wl_since: 'В списке с {d}',
    wl_early: 'Хотите раньше? Подтвердите канал — авторов с подтверждённым каналом приглашаем первыми', wl_verify: 'Подтвердить канал',
    wl_verified: 'Канал подтверждён. Вы в первой волне', wl_pending: 'Проверяем канал {h}. Обычно это несколько минут',
    wj_h: 'Записаться', wj_sub: 'Пришлём приглашение на эту почту', wj_where: 'Где вы снимаете?', wj_where_sub: 'Можно выбрать несколько',
    wj_profile: 'Ссылка на профиль — необязательно', wj_profile_ph: 'tiktok.com/@ник', wj_send: 'Записаться', wj_pick: 'Выберите хотя бы одну площадку',
    inv_b_h: 'Приглашение', inv_b_sub: 'Код из письма или сообщения: SB- и 6 знаков', inv_b_send: 'Принять приглашение',
    inv_nf: 'Код не найден', inv_used: 'Код уже использован', inv_exp: 'Срок приглашения закончился', inv_b_ok: 'Приглашение принято',
    inv_card: 'Приглашение принято', inv_card_p: 'Осталось стать партнёром: 18+, правила и страна. Это бесплатно', inv_open: 'Программа открыта для всех',
    gate_p: 'Раздел откроется по приглашению или в день открытия программы',
    // «Стать партнёром» (02 §7.1, §7.9)
    pt_step: 'Шаг {a} из {b}', pt_age_sub: 'Партнёрство — с 18 лет. Возраст подтвердим при первом выводе вместе с личностью',
    pt_minor_h: 'Партнёрство с 18 лет', pt_minor_p: 'Вы можете добавлять места и получать дни Pro', pt_add: 'Добавить место',
    pt_terms_h: 'Правила партнёрства', pt_terms_sub: 'Коротко, по пунктам. Полностью — в «Честных правилах»',
    tm_rate: 'Ставка за просмотры', tm_rate_v: '{r} за 1 000 просмотров TikTok, Reels и YouTube, Shorts — {rs}. Ставку считаем от того, сколько покупают зрители, поэтому она может вырасти',
    tm_count: 'Что засчитываем', tm_count_v: 'Ролик про место и упоминание места. Shorts — по своей ставке. Snapchat и ролики с кадрами игры — без оплаты просмотров, доля с покупок остаётся',
    tm_hold: 'Холд и раунд', tm_hold_v: 'Доля с покупки — после холда {h} дней. Выплата {day}-го числа, от {min}',
    tm_lim: 'Лимиты', tm_lim_v: 'До {cap} за ролик по просмотрам, от {floor}. Новый партнёр — до {np} в месяц за просмотры до первой выплаты. Первую выплату и всё больше {big} проверяет человек',
    tm_no: 'Что нельзя', tm_no_v: 'Накрутка, чужие ролики, обещания заработка зрителям, кадры Rockstar как основа ролика, съёмка на частной территории',
    tm_appeal: 'Апелляция', tm_appeal_v: 'Одна апелляция на решение, ответ до {ah} часов',
    tm_change: 'Изменения правил', tm_change_v: 'С анонсом за {nd} дней. Ставка вниз — только с анонсом, вверх — сразу',
    pt_accept: 'Принимаю условия партнёрства', pt_need: 'Отметьте, что принимаете условия',
    pt_country_h: 'Страна', pt_country_sub: 'Определили по сети — поправьте, если нужно', pt_country: 'Страна проживания',
    pt_np_h: 'Вы партнёр', pt_np_p: 'Для вашей страны за ролики и вклады — дни Pro: 30 дней за каждый принятый ролик от 1 000 просмотров',
    // подтверждение канала (02 §7.1 п. 5)
    vf_h: 'Подтвердите канал', vf_sub: 'Так мы знаем, что ролики с этого аккаунта ваши', vf_url: 'Ссылка на профиль',
    vf_bad: 'Нужна ссылка на профиль {p}', vf_code_h: 'Добавьте код в профиль', vf_code_p: 'Добавьте в описание профиля код {c}',
    vf_code_s1: 'Откройте профиль {h} в {p}', vf_code_s2: 'Вставьте код в описание и сохраните', vf_code_s3: 'Вернитесь и нажмите «Проверить» — проверим за несколько минут',
    vf_code_note: 'Код можно удалить после проверки', vf_check: 'Проверить', vf_pending_h: 'Проверяем канал',
    vf_pending_p: 'Ищем код {c} в описании профиля {h}. Обычно несколько минут — экран обновится сам', vf_again: 'Проверить ещё раз',
    vf_ok_h: 'Канал подтверждён', vf_ok_p: '{h} в {p}', vf_ok_pro: 'Рабочий Pro включён на 14 дней', vf_ok_wl: 'Вы в первой волне: пришлём приглашение раньше остальных',
    vf_fail_h: 'Код не нашли', vf_fail_p: 'В описании профиля {h} нет кода {c}. Добавьте его, сохраните профиль и проверьте снова', vf_other: 'Другой аккаунт',
    // «Готово» (02 §7.1)
    dn_h: 'Готово', dn_sub: 'Вы партнёр Secret Base', dn_link: 'Ваша ссылка', dn_code: 'Код', dn_pro: 'Рабочий Pro до {d}',
    dn_shoot: 'Снять про это место', dn_shoot_d: 'Место недели: {p}', dn_submit: 'Подать ролик', dn_hub: 'К разделу «Для авторов»',
    hub_verify: 'Подтвердите канал, чтобы ролики засчитывались', hub_verify_np: 'Подтвердите канал, чтобы получать дни Pro за ролики',
    // «Для админов» (08 №18)
    ad_h: 'Для админов', ad_code: 'Код админа', ad_in: 'Войти', ad_bad: 'Код не подошёл', ad_nocrypto: 'Браузер не умеет проверять код. Откройте сайт по https',
    ad_mode: 'Режим показа', ad_demo: 'Демо для съёмки', ad_demo_p: 'Цифры из набора @sunset_drive. На каждом экране с суммами — «Пример интерфейса»',
    ad_off: 'Выкл', ad_on: 'Вкл', ad_stage: 'Что показать', ad_st_partner: 'Партнёр с роликами', ad_st_start: 'Путь с начала', ad_reset: 'Сбросить демо',
    ad_inv: 'Приглашения', ad_inv_p: 'Одноразовые коды SB- для своих. Действуют до {d}', ad_make: 'Создать 10', ad_copy_all: 'Скопировать все',
    ad_inv_none: 'Пока не создавали', ad_inv_used: 'принят', ad_inv_left: 'Коды кончились: нужна новая партия',
    ad_wl: 'Список ожидания', ad_wl_line: 'Записались {j}, каналы {v} из {g}', ad_wl_j: 'Записались', ad_wl_v: 'Подтверждённые каналы',
    ad_wl_p: 'Боевые выплаты — когда 500 записавшихся, из них 100 с подтверждённым каналом, ответ юриста, касса и Whop',
    ad_req: 'Подтверждение каналов', ad_req_p: 'Найдите код в описании профиля и отметьте', ad_req_none: 'Заявок нет',
    ad_yes: 'Подтвердить', ad_no: 'Не нашли', ad_st_verified: 'подтверждён', ad_st_failed: 'код не нашли', ad_out: 'Выйти',
    // экран 5 «Снять про это» (02 §7.2)
    sh_h: 'Снять про это', sh_card: 'Картинка для конца ролика', sh_card_pair: '1080 × 1920: пара «игра и жизнь», ваш ник, код и ссылка',
    sh_card_photo: '1080 × 1920: фото места из жизни, ваш ник, код и ссылка', sh_making: 'Готовим картинку',
    sh_link: 'Ссылка для описания ролика', sh_link_note: 'Номер ролика {v} уже в ссылке: переходы и покупки считаем именно по этому ролику',
    sh_t1: 'Покажите место в начале', sh_t2: 'Скажите голосом и напишите в начале: «Реклама, партнёр Secret Base»',
    sh_t3: 'Без записи экрана игры — тогда ролик получает оплату просмотров', sh_t3_np: 'Без записи экрана игры — тогда ролик засчитаем полностью',
    sh_save: 'Скачать картинку', sh_copy: 'Скопировать ссылку', sh_copied: 'Ссылка скопирована', sh_copied_p: 'Вставьте её в описание ролика и закрепите комментарием',
    sh_submit: 'Ролик готов — подать', sh_saved: 'Картинка сохранена', sh_saved_p: 'Поставьте её на последние 2–3 секунды ролика',
    sh_hold_h: 'Сохраните картинку', sh_hold_p: 'Нажмите на картинку и подержите, затем «Сохранить в Фото». На компьютере — правой кнопкой «Сохранить картинку»',
    sh_nopair_h: 'Картинки для этого места нет', sh_nopair_p: 'У места пока нет фото из жизни, а кадр игры крупно мы не используем. Ссылка работает — снимите место сами',
    card_cmp: 'Игра и жизнь — в Secret Base', card_code: 'код {c}', card_photo: 'Фото: {c}',
    // экран 6 «Подача ролика» (02 §7.3, решение №17)
    sv_fmt: '{p}: {r} за 1 000 просмотров', sv_fmt_snap: 'Snapchat: принимаем без оплаты просмотров', sv_fmt_np: 'Площадка: {p}',
    sv_what: 'Что в ролике', sv_about: 'Про место', sv_mention: 'Упоминание', sv_about_d: 'Ролик целиком об одном месте',
    sv_mention_d: 'До 5 мест, у каждого — секунда, где оно видно или слышно', sv_at: 'Секунда', sv_add_place: 'Добавить место', sv_del: 'Убрать место',
    sv_bad_at: 'Укажите секунду в виде мм:сс, например 0:21', sv_max: 'В одном ролике — до 5 мест',
    sv_gp: 'В ролике есть кадры из игры', sv_gp_on: 'Без оплаты просмотров. 40% с покупок и порог Лиги остаются', sv_gp_on_np: 'Без дней Pro за просмотры. Порог Лиги остаётся',
    sv_vcode: 'Код ролика в описании', sv_vcode_note: 'Можно удалить через 7 дней после проверки',
    sv_disc: 'В начале ролика есть раскрытие рекламы', sv_disc_need: 'Отметьте, что в начале ролика есть пометка о рекламе', sv_sending: 'Отправляем',
    sv_dup_h: 'Этот ролик уже подан', sv_dup_p: 'Ролик с этой ссылкой уже есть в «Моих роликах»: {id}', sv_dup_open: 'Открыть ролик',
    sv_unv: 'Подтвердите аккаунт площадки, чтобы получать оплату', sv_unv_np: 'Подтвердите аккаунт площадки, чтобы получать дни Pro',
    // экран 7 «Мои ролики» и карточка ролика (02 §7.4)
    vd_submitted: 'Подан. Проверяем код в описании', vd_in_review: 'На проверке, обычно до 48 часов', vd_rejected: 'Не принят: {r}',
    vd_awaiting_threshold: 'Принят. Оплата просмотров начнётся с 1 000 просмотров. Сейчас {n}', vd_awaiting_np: 'Принят. Дни Pro — с 1 000 просмотров. Сейчас {n}',
    vd_accruing: 'Начисляется: {v}, {s}', vd_accruing_np: 'Засчитан: {v}', vd_closed: 'Итог: {v}, {s} за просмотры, {b} по ссылке', vd_closed_np: 'Итог: {v}',
    vd_unavailable: 'Ролик удалён или скрыт. Начисления остановлены', vd_frozen: 'Проверяем просмотры. Начисления приостановлены',
    vs_wait_n: 'Ждёт порога: {a} из {b}', vc_fix: 'Исправить и подать снова', vc_stats: 'Статистика ролика', vc_feed: 'Смотреть в ленте',
    vc_places: 'Места в ролике', role_about: 'про место', role_mention: 'упоминание, {t}', vc_gp: 'Есть кадры из игры: без оплаты просмотров',
    // экран 8 «Статистика ролика» (02 §9 п. 6)
    vt_total: 'Начислено с ролика', vt_calc_h: 'Оплата просмотров', vt_calc: '{v} × {r} / 1 000 = {s}',
    vt_min: 'Меньше {min} за ролик — начисляем минимум {min}', vt_cap: 'Предел — {cap} за ролик', vt_wait: 'Оплата начнётся с 1 000 просмотров. Сейчас {a} из {b}',
    vt_gp: 'Есть кадры из игры: без оплаты просмотров. Доля 40% с покупок остаётся', vt_snap: 'Snapchat: без оплаты просмотров. Доля 40% с покупок остаётся',
    vt_calc_note: 'Половина — авансом по снимку 10-го дня, остаток — по 30-му', vt_buys_h: 'Покупки по ссылке ролика', vt_buys_none: 'Покупок по ссылке ролика пока нет',
    vt_per: 'Переходов на 1 000 просмотров: {n}', vt_low: 'Переходов меньше 1 на 1 000 просмотров. Скажите ссылку голосом и закрепите комментарий',
    vt_frozen: 'Начисления по ролику приостановлены: проверяем просмотры. Ответим до 48 часов',
    // экран 9 «Мой заработок» — состояния (02 §9)
    e_hold: 'Пока всё в холде: доля с покупок — 30 дней, просмотры — по 10-му и 30-му дню ролика',
    e_below: 'Доступно {s}. Выплата начнётся с {min} — остаток перейдёт на следующий раунд', e_paid: 'Выплачено {s}, {d}',
    e_frozen: 'Начисления по ролику {id} приостановлены: проверяем просмотры. Ответим до 48 часов', e_pd: 'Дни Pro: {n}',
  },
  en: {
    for_authors: 'For creators', league: 'Creator League', title: 'Earn by filming videos about places',
    title_np: 'Film videos about places', title_minor: 'Your places and easter eggs',
    first_pay: 'First payouts on {d}. We will show the median after them', median: 'Creator median: {m}',
    hub_np_sub: '30 days of Pro for each accepted video with 1,000+ views', hub_minor_sub: 'Accepted contributions earn Pro days. Creators must be 18+',
    hub_open: 'League is open: tasks of the week', hub_lock: 'The League opens at 10,000 views on a place video',
    hub_guest: 'Sign in with email', hub_player: 'Become a partner', hub_partner_note: 'Free, no subscription. 18+ and email sign-in',
    partner: 'Partnership is free, 18+, no purchase needed. The terms are the same for all partners. For filming, a working Pro: 14 days after confirming your account and +30 days for each accepted video',
    trial_t: 'Trial access', trial_p: 'All codes and search are open without sign-in or a card. The map and real-life places are in Pro',
    buys_h: 'Purchases with your link', buy_pass: '3 months — {p}', buy_year: 'Year — {p}', buy_month: 'Month — {p} for each payment', n_buys: '{n} purchase|{n} purchases', n_pays: '{n} payment|{n} payments',
    buys_note: 'Available 30 days after purchase. On a refund the share is taken back from future earnings', work_pro: 'Working Pro until {d}. +30 days for each accepted video with 1,000+ views', work_pro_end: 'Working Pro ended on {d}. +30 days for each accepted video with 1,000+ views',
    how1: 'Film a game place in real life', how2: 'Submit the video with your link', how3: 'Get 40% of purchases with your code',
    how3_np: 'Get Pro days for accepted videos',
    my_earn: 'My earnings', my_earn_sub: 'Daily earnings, videos, payout', pro_days: 'Pro days', pro_days_sub: 'For contributions, videos and friend gifts',
    my_videos: 'My videos', my_link: 'My link and code', review: 'Review', review_sub: 'Card feed: swipe right or left',
    review_how: 'How to become a moderator', add: 'Add a video or a place', add_minor: 'Add a place or an easter egg', rules: 'Fair rules',
    rules_sub: 'Shares, timing, what is not allowed', rules_sub_np: 'How contributions, videos and Pro days work', code_sub: 'Code {c}',
    gift_sub: 'A gift for a friend by link', n_days_x: '{n} day|{n} days', n_videos: '{n} video|{n} videos|{n} videos', n_on_review: 'in review',
    tab_tasks: 'Tasks', tab_videos: 'Videos', tab_earn: 'Earnings', tab_rating: 'Rating',
    close: 'Close', back: 'Back', copy: 'Copy', copied: 'Copied', share: 'Share', save: 'Save', next: 'Next', done: 'Done', ok: 'Got it',
    t_unlock: 'Get 10,000 views on a place video to open the League', t_unlock_d: 'Any platform, your link in the description',
    t_week: 'Film the place of the week: {p}', t_week_d: 'The place in real life and the comparison in the app, up to 60 seconds',
    t_fresh: 'Fresh find by a player: {p}, no videos yet', t_fresh_d: 'Found by {who} on {d}. Be the first to film it',
    t_month: 'Get 100,000 views in a month', t_month_d: 'All your place videos together',
    t_done: 'Done', of: '{a} of {b}', submit_video: 'Submit a video', invite: 'Enter an invite code',
    rates_h: 'Rates for views', r_main: 'TikTok, Reels and YouTube', r_shorts: 'YouTube Shorts', r_line: '{r} per 1,000, up to {cap} per video, from {min}',
    r_ex: 'Example: a video got 1,000,000 views', r_note: 'The rate depends on how much viewers of the video buy. It is reviewed every two weeks.',
    r_main_earn: 'Your main income is 40% of every purchase with your code. Views are a bonus.',
    lock_minor: 'The Creator League is 18+. You can already look at tasks and videos',
    np_tasks: '30 days of Pro for each accepted video with 1,000+ views. A video with your link gives a friend the place and +30 days to their first purchase',
    v_all: 'All', v_mine: 'Mine', v_note: 'Other people’s videos show only views and the place. Earnings from your video are under “Mine” and in “My earnings”.',
    rating_empty: 'The rating will appear after the first round', rating_note: 'Views of videos with a code and earnings, with the creator’s consent; the team is not ranked.',
    for_month: 'earned in {m}', month_10: 'October', accruing: 'Accruing', available: 'Available', paid: 'Paid', in_payout: 'In payout',
    round_in: 'Round on {d}, in {n}', round_on: 'Round on {d}', withdraw: 'Withdraw {s}', withdraw_min: 'Withdraw from {min}: {s} available',
    by_day: 'Earnings by day', tap_bar: 'Tap a bar to see the day total', no_acc: 'no earnings',
    leg_code: 'Code share', leg_views: 'Views', leg_other: 'Tasks, authors, creators',
    sources: 'Where it comes from', funnel: 'Viewer path', f_views: 'Views', f_clicks: 'Link visits', f_trials: 'Trial access', f_pays: 'Purchases with code', f_earned: 'Earned', c_views: '{n} view|{n} views', c_clicks: '{n} visit|{n} visits', c_pays: '{n} purchase|{n} purchases', c_earned: 'earned',
    f_of: '{p} of previous step', per_video: 'My videos', all_days: 'All days: {n}', collapse: 'Collapse', days_list: 'By day',
    rs_share: '40% share with code {c}', rs_share_d: '{n} purchases, 30-day hold', rs_rpm: 'Views', rs_rpm_d: 'Half paid in advance on the video’s day 10, the rest on day 30',
    rs_cpa: '$15 for a referred creator', rs_cpa_d: 'once they earn $50 of share in 90 days', rs_task: 'Tasks', rs_task_d: 'Game and life pairs, available 7 days after review',
    rs_author: 'Place author share', rs_author_d: '10% on top for videos about your place, 12 months', rs_queue: 'Reviews', rs_queue_d: '$0.01 per decision at 70%+ accuracy',
    st_maturing: 'accruing', st_available: 'available', st_paid: 'paid', st_reversed: 'reversed',
    d_share: '{n} purchase with code|{n} purchases with code|{n} purchases with code', d_rpm: 'views', d_task: 'task accepted', d_cpa: 'referred creator', d_author: 'place author share', d_queue: 'reviews',
    hold_note: 'Code share and $15 per creator come after a 30-day hold. Tasks are available 7 days after review. Payouts on the 20th, from $25.',
    mock_note: 'Sample data. Real numbers will come from the server.', earn_empty: 'Money for your videos will show up here', earn_empty_p: 'Submit your first one — we review within 48 hours',
    pd_total: '{n} Pro days', pd_sub_minor: 'Under 18, contributions earn Pro days', pd_sub_np: 'For accepted contributions, videos and friend gifts',
    pd_friend: 'A friend bought Pro with your link', pd_contrib: 'Accepted contributions', pd_video: 'Accepted video with 1,000+ views', pd_note: 'Friend gifts are limited to 12 a year.',
    vs_submitted: 'Submitted', vs_in_review: 'In review', vs_pending_review: 'In review', vs_awaiting_threshold: 'Waiting for views', vs_accruing: 'Accruing', vs_rejected: 'Not accepted', vs_unavailable: 'Deleted or hidden', vs_closed: 'Final', vs_frozen: 'Checking views',
    vf_all: 'All', vf_review: 'Review', vf_acc: 'Accruing', vf_no: 'Not accepted',
    rj_no_code: 'The description has no {code} code. Add it and submit again',
    rj_gameplay: 'The video has game footage: no view pay, everything else counts',
    rj_not_place: 'This is not the place. Pick another one or submit the video without it', rj_reused: 'This video was already submitted',
    rj_place_not_at_timecode: 'The place is not seen or heard at this second. Give the second where it is', rj_unsafe: 'The video was filmed on private property or unsafely',
    vu_note: 'The video was deleted or hidden. Earnings stopped',
    steps_review: 'In review', steps_review_d: 'we look for {code} in the description; a person checks each creator’s first video',
    steps_wait: 'Waiting for views', steps_wait_d: 'from 1,000 views', steps_acc: 'Accruing', steps_acc_d: 'half in advance on the day 10 snapshot, the rest on day 30',
    send_again: 'Send again', videos_empty: 'No videos yet', videos_empty_p: 'Film a game place in real life and submit the video with your link.',
    feed_place: 'About this place', feed_mine: 'My videos', counter: '{a} of {b}', views_n: '{n} views', your_video: 'your video', team: 'team',
    shoot: 'Film this', stats: 'Stats', preview_only: 'Preview: this video plays in the platform’s app', example_play: 'Sample: the video plays here',
    earn_video: 'Earnings from the video', feed_empty: 'No videos about this place yet', feed_empty_p: 'Be the first: your video will show up here after review.',
    vstat_h: 'Video stats', vstat_by_day: 'Views by day', vstat_tap: 'Tap a bar to see the day’s views', vstat_link: 'Your link for this video',
    vstat_link_note: 'Visits and purchases are counted by this link. Others see only the views.', s_share: '40% code share', s_rpm: 'Paid views',
    s_rpm_low: 'under $3, not accrued', s_since: 'since {d}',
    add_h: 'Add', ty_video: 'Video', ty_video_d: 'A link to your video about a place', ty_place: 'Place or easter egg', ty_place_d: 'A new place, an easter egg or another angle',
    ty_pair: 'Game and life pair', ty_pair_d: 'Opens for Scouts: 5 accepted contributions', ty_found: 'Found here', ty_found_d6: 'In GTA 6, from the game’s release on November 19', ty_found_d5: 'An easter egg you see in the game',
    ty_report: 'Report a mistake', ty_report_d: 'Wrong place, wrong address, a violation',
    sv_h: 'Submit a video', sv_url: 'Video link', sv_url_ph: 'tiktok.com/@name/video/…', sv_place: 'Place', sv_pick: 'Choose', sv_change: 'Change', sv_code: 'Your code',
    sv_note: 'After sending we give you an SB- code for the description to confirm the video is yours. You can remove it 7 days after review',
    sv_send: 'Submit', sv_bad_url: 'This is not a TikTok, YouTube, Instagram or Snapchat video link', sv_no_place: 'Choose a place',
    sv_ok: 'Video submitted', sv_ok_code: 'Add this code to the video description', sv_ok_link: 'Your link for this video',
    sv_ok_link_note: 'Separate from your general link: visits and purchases from this video are counted by it',
    pick_h: 'Choose a place', pick_ph: 'Name or address', pick_none: 'Nothing found. Try another word.',
    pf_h: 'Place or easter egg', pf_side: 'Where it shows', pf_kind: 'What it is', pf_where: 'Where', pf_where_ph: 'Address or landmark', pf_src: 'Source', pf_src_ph: 'A link or how you know',
    k_place: 'Place', k_egg: 'Easter egg', in_game: 'In game', in_life: 'In real life',
    rp_h: 'Report a mistake', rp_r1: 'Wrong place', rp_r2: 'Wrong address', rp_r3: 'Bad photo', rp_r4: 'Violation', rp_note: 'What is wrong', rp_note_ph: 'Briefly, in one phrase',
    sent_h: 'Sent', sent_1: 'Contribution in review', sent_2: 'A moderator will check the place and the source', sent_p: 'An accepted contribution earns “Found by @{n}” and Pro days.',
    req_fields: 'Fill in the marked fields',
    lg_h: 'Become a partner', lg_sub: '18+ and email sign-in. Partnership is free, no purchase needed', lg_email: 'Email', lg_send: 'Send code', lg_note: 'No password: we email you a code.',
    lg_code_h: 'Code from the email', lg_code_sub: 'Sent to {e}', lg_code: 'Code', lg_enter: 'Sign in', lg_bad_email: 'Check the email address', lg_bad_code: 'The code is 4–6 digits from the email',
    lg_age_h: 'Are you 18 or older?', lg_age_sub: 'We pay only from 18. We confirm age with identity on the first payout', lg_yes: 'Yes, I am 18+', lg_no: 'No',
    lg_minor_h: 'No money for now', lg_minor_sub: 'Under 18, accepted contributions earn Pro days. Contributions and “Found by @name” work as usual',
    lg_draft: 'The draft is saved on this device and goes out after you sign in',
    wd_h: 'Withdraw {s}', wd_sub: 'Payout on {d}, from {min}. The first payout includes an identity check', wd_1: 'Amount: {s}, everything available', wd_2: 'Identity and 18+ check with the payout partner, once. We will email the link to {e}', wd_3: 'Round on {d}',
    wd_fee: 'The payout method fee is paid by the recipient.', wd_send: 'Send request', wd_below_h: 'Less than {min} so far', wd_below_p: '{s} available. The rest moves to the next round and adds up with new earnings.',
    wd_ok_h: 'Request received', wd_ok_1: 'Request sent', wd_ok_2: 'In review: a person checks the first payout', wd_ok_3: 'Payout in the {d} round', wd_status: 'Payout status: in review',
    ml_code: 'Your code', ml_link: 'General link', ml_gift: 'A viewer gets this place and +30 days to their first purchase. You get 40% of their purchase after a 30-day hold',
    ml_gift_np: 'A friend gets this place and +30 days to their first purchase. You get 30 days of Pro when they buy Pro', my_link_p: 'My link',
    ml_cpa: '$15 for a referred creator once they earn $50 of share in 90 days.', ml_pro: 'Working Pro: 14 days after confirming a platform account and +30 days for each accepted video with 1,000+ views',
    ml_acc_h: 'Platform accounts', ml_acc_p: 'Add the code {c} to your profile description once. That is how we know videos from this account are yours.',
    acc_verified: 'confirmed', acc_pending: 'looking for code', acc_none: 'not connected', acc_soon: 'connection from November',
    rv_today: 'Today: {n} checked, {a}% accuracy.', rv_cents: 'Earned {s}', rv_ok: 'Fits', rv_no: 'Does not fit', rv_why: 'Why does it not fit?',
    rv_k_video: 'Video', rv_k_place: 'New place', rv_k_photo: 'New photo for a place', rv_done: 'Batch reviewed', rv_done_p: 'New cards show up when creators send contributions.', rv_more: 'Again',
    rv_left: '{n} left', rv_hint: 'Swipe right if it fits, left if it does not',
    fc_code_found: 'SB- code found in the description', fc_code_missing: 'No SB- code in the description', fc_place_named: 'Place named in the description', fc_street: 'Shot from the street',
    fc_no_people: 'No faces or license plates', fc_source_link: 'Has a source link', fc_side_real: 'Real-life view',
    rr_v1: 'No SB- code in the description', rr_v2: 'GTA gameplay in the video', rr_v3: 'Not about this place', rr_v4: 'Someone else’s video',
    rr_p1: 'Looks like a Google Maps or Street View capture', rr_p2: 'Game frame or AI image', rr_p3: 'Faces or license plates in frame', rr_p4: 'Wrong place', rr_p5: 'Too dark or blurry',
    mod_how: 'Two ways in: 5 accepted contributions or a moderator invite. Then a short exam of 20 examples.', mod_how_pay: ' Moderators get paid for accurate reviews.',
    mod_exam: 'Exam: 20 examples, 16 correct needed', mod_student: 'Trainee mode: your decisions are compared with moderators, {n} reviews at {a}%+ accuracy',
    mod_now: 'You have {n} of 5 accepted contributions',
    ru_h_rates: 'Shares and rates', ru_code: 'With your code', ru_code_v: '40% of every purchase, after a 30-day hold', ru_views: 'TikTok, Reels and YouTube views', ru_shorts: 'YouTube Shorts',
    ru_author: 'Place author', ru_author_v: '10% on top for videos about it, 12 months', ru_scout: 'Scout', ru_scout_v: '$10 per accepted pair', ru_cpa: 'Referred creator', ru_cpa_v: '$15 once they earn $50 in 90 days',
    ru_mod: 'Moderator', ru_mod_v: '$0.01 per decision at 70%+ accuracy',
    ru_h_terms: 'Timing', ru_views_t: 'Views', ru_views_tv: 'half on the video’s day 10, the rest on day 30', ru_tasks_t: 'Tasks', ru_tasks_tv: '7 days after review',
    ru_hold: 'Code share', ru_hold_v: '30-day hold', ru_pay: 'Payout', ru_pay_v: 'on the 20th, from $25', ru_first: 'First payout', ru_first_v: 'with identity check, 18+', ru_big: 'Over $500', ru_big_v: 'checked by a person',
    ru_h_pro: 'Working Pro for partners', ru_pro_p: '{a} days after confirming a platform account and +{b} days for each accepted video with {v}+ views. Pro does not change any earnings number. Becoming a partner is free.',
    ru_h_np: 'What you get', ru_np1: 'Accepted contribution', ru_np1v: '“Found by @name” and Pro days', ru_np2: 'Accepted video with 1,000+ views', ru_np2v: '30 days of Pro', ru_np3: 'A friend bought Pro with your link', ru_np3v: '30 days of Pro, up to 12 a year',
    ru_h_no: 'Not allowed', ru_no1: 'Boosting views or purchases', ru_no1v: 'code paused', ru_no2: 'Codes in other people’s communities', ru_no2v: '7-day pause, then removal',
    ru_no3: 'One video from several accounts', ru_no3v: 'rejected', ru_no4: 'GTA gameplay in a video with a code', ru_no4v: 'rejected', ru_no5: 'Street View screen captures, other people’s videos', ru_no5v: 'rejected',
    ru_h_rate: 'How the view rate is set', ru_rate_p: 'The rate comes from how much viewers buy with your code, minus the {p}% creator share. It is reviewed every two weeks: raises apply at once, cuts with {d} days’ notice.',
    ru_h_ad: 'Advertising', ru_ad_p: 'A video with your code is an ad. Say so out loud and write it in the caption.',
    ru_change: 'We change the rules at most once a month, with 30 days’ notice and never retroactively.',
    inv_h: 'Invite code', inv_p: 'A code from a moderator or ambassador opens the League at once. Single use, valid for 30 days.', inv_ph: 'For example, LIGA-7Q2K', inv_send: 'Open the League',
    inv_bad: 'The code did not work. Check letters and digits', inv_old: 'The code has expired. Ask for a new one', inv_ok: 'League is open',
    err: 'Something went wrong. Check the connection and try again', soon_pair: 'Pairs open after 5 accepted contributions', soon_found: 'Opens with the GTA 6 release on November 19',
    demo_note: 'Interface example. Numbers are shown as an example', beta_note: 'Amounts are preliminary: the program is invite-only',
    beta_pay: 'Payouts start when the program opens to everyone. Your earnings are kept', for_month_pre: 'preliminary for {m}',
    rs_pair: 'Scout pairs', rs_pair_d: '$10 per accepted game and life pair', d_pair: 'pair accepted',
    rj_no_disclosure: 'The start of the video has no ad disclosure. Add it by voice and on screen',
    wl_title: 'Film videos about places from games — we pay for views and share purchases',
    wl_l1: '{r} per 1,000 views, up to {cap} per video, from {min}. Shorts — {rs}', wl_l2: '{p}% of every purchase with your link for {m} months',
    wl_l3: 'Free to join, 18+', wl_plate: 'The program opens on {d}, the day GTA 6 comes out. For now it is invite-only',
    wl_join: 'Join the list', wl_have: 'I have an invite', wl_partner: 'Become a partner',
    wl_joined: 'You are on the list. Number {n}', wl_joined_p: 'We will email your invite when the program opens', wl_since: 'On the list since {d}',
    wl_early: 'Want in sooner? Confirm your channel — creators with a confirmed channel are invited first', wl_verify: 'Confirm channel',
    wl_verified: 'Channel confirmed. You are in the first wave', wl_pending: 'Checking the channel {h}. Usually a few minutes',
    wj_h: 'Join the list', wj_sub: 'We will send the invite to this email', wj_where: 'Where do you post?', wj_where_sub: 'You can pick several',
    wj_profile: 'Profile link — optional', wj_profile_ph: 'tiktok.com/@name', wj_send: 'Join the list', wj_pick: 'Pick at least one platform',
    inv_b_h: 'Invite', inv_b_sub: 'The code from the email or message: SB- and 6 characters', inv_b_send: 'Accept invite',
    inv_nf: 'Code not found', inv_used: 'Code already used', inv_exp: 'The invite has expired', inv_b_ok: 'Invite accepted',
    inv_card: 'Invite accepted', inv_card_p: 'One step left: 18+, the rules and your country. It is free', inv_open: 'The program is open to everyone',
    gate_p: 'This section opens with an invite or on the day the program opens',
    pt_step: 'Step {a} of {b}', pt_age_sub: 'Partners must be 18+. We confirm age with identity on the first payout',
    pt_minor_h: 'Partnership is 18+', pt_minor_p: 'You can add places and get Pro days', pt_add: 'Add a place',
    pt_terms_h: 'Partner rules', pt_terms_sub: 'Short, point by point. In full — in “Fair rules”',
    tm_rate: 'View rate', tm_rate_v: '{r} per 1,000 views on TikTok, Reels and YouTube, Shorts — {rs}. The rate comes from how much viewers buy, so it can go up',
    tm_count: 'What counts', tm_count_v: 'A video about a place and a mention of a place. Shorts at their own rate. Snapchat and videos with game footage — no view pay, the purchase share stays',
    tm_hold: 'Hold and round', tm_hold_v: 'The purchase share comes after a {h}-day hold. Payouts on day {day} of the month, from {min}',
    tm_lim: 'Limits', tm_lim_v: 'Up to {cap} per video for views, from {floor}. New partners — up to {np} a month for views until the first payout. A person checks the first payout and anything over {big}',
    tm_no: 'Not allowed', tm_no_v: 'Boosting, other people’s videos, promising viewers income, Rockstar footage as the base of a video, filming on private property',
    tm_appeal: 'Appeal', tm_appeal_v: 'One appeal per decision, answered within {ah} hours',
    tm_change: 'Rule changes', tm_change_v: 'With {nd} days’ notice. Rate cuts only with notice, raises at once',
    pt_accept: 'I accept the partner terms', pt_need: 'Tick that you accept the terms',
    pt_country_h: 'Country', pt_country_sub: 'Detected from your network — change it if needed', pt_country: 'Country of residence',
    pt_np_h: 'You are a partner', pt_np_p: 'In your country videos and contributions earn Pro days: 30 days for each accepted video with 1,000+ views',
    vf_h: 'Confirm your channel', vf_sub: 'That is how we know videos from this account are yours', vf_url: 'Profile link',
    vf_bad: 'We need a link to your {p} profile', vf_code_h: 'Add the code to your profile', vf_code_p: 'Add the code {c} to your profile description',
    vf_code_s1: 'Open the profile {h} on {p}', vf_code_s2: 'Paste the code into the description and save', vf_code_s3: 'Come back and tap “Check” — it takes a few minutes',
    vf_code_note: 'You can remove the code after the check', vf_check: 'Check', vf_pending_h: 'Checking the channel',
    vf_pending_p: 'Looking for {c} in the profile description of {h}. Usually a few minutes — this screen updates itself', vf_again: 'Check again',
    vf_ok_h: 'Channel confirmed', vf_ok_p: '{h} on {p}', vf_ok_pro: 'Working Pro is on for 14 days', vf_ok_wl: 'You are in the first wave: we will invite you before others',
    vf_fail_h: 'Code not found', vf_fail_p: 'The profile description of {h} has no {c}. Add it, save the profile and check again', vf_other: 'Another account',
    dn_h: 'Done', dn_sub: 'You are a Secret Base partner', dn_link: 'Your link', dn_code: 'Code', dn_pro: 'Working Pro until {d}',
    dn_shoot: 'Film this place', dn_shoot_d: 'Place of the week: {p}', dn_submit: 'Submit a video', dn_hub: 'Back to “For creators”',
    hub_verify: 'Confirm your channel so your videos count', hub_verify_np: 'Confirm your channel to get Pro days for videos',
    ad_h: 'For admins', ad_code: 'Admin code', ad_in: 'Sign in', ad_bad: 'The code did not work', ad_nocrypto: 'This browser cannot check the code. Open the site over https',
    ad_mode: 'Display mode', ad_demo: 'Demo for filming', ad_demo_p: 'Numbers from the @sunset_drive set. Every screen with amounts says “Interface example”',
    ad_off: 'Off', ad_on: 'On', ad_stage: 'What to show', ad_st_partner: 'Partner with videos', ad_st_start: 'From the start', ad_reset: 'Reset demo',
    ad_inv: 'Invites', ad_inv_p: 'Single-use SB- codes for your people. Valid until {d}', ad_make: 'Create 10', ad_copy_all: 'Copy all',
    ad_inv_none: 'None created yet', ad_inv_used: 'accepted', ad_inv_left: 'No codes left: a new batch is needed',
    ad_wl: 'Waitlist', ad_wl_line: '{j} joined, {v} of {g} channels', ad_wl_j: 'Joined', ad_wl_v: 'Confirmed channels',
    ad_wl_p: 'Live payouts start at 500 joined with 100 confirmed channels, the lawyer’s answer, checkout and Whop',
    ad_req: 'Channel checks', ad_req_p: 'Find the code in the profile description and mark it', ad_req_none: 'No requests',
    ad_yes: 'Confirm', ad_no: 'Not found', ad_st_verified: 'confirmed', ad_st_failed: 'code not found', ad_out: 'Sign out',
    sh_h: 'Film this', sh_card: 'Picture for the end of the video', sh_card_pair: '1080 × 1920: the game and life pair, your name, code and link',
    sh_card_photo: '1080 × 1920: a real-life photo of the place, your name, code and link', sh_making: 'Preparing the picture',
    sh_link: 'Link for the video description', sh_link_note: 'The video number {v} is already in the link: visits and purchases count for this video',
    sh_t1: 'Show the place at the start', sh_t2: 'At the start, say and write: “Ad, Secret Base partner”',
    sh_t3: 'No game screen recording — then the video gets paid for views', sh_t3_np: 'No game screen recording — then the video counts in full',
    sh_save: 'Download picture', sh_copy: 'Copy link', sh_copied: 'Link copied', sh_copied_p: 'Paste it into the video description and pin it in a comment',
    sh_submit: 'Video ready — submit', sh_saved: 'Picture saved', sh_saved_p: 'Put it on the last 2–3 seconds of the video',
    sh_hold_h: 'Save the picture', sh_hold_p: 'Press and hold the picture, then “Save to Photos”. On a computer, right-click and “Save image”',
    sh_nopair_h: 'No picture for this place', sh_nopair_p: 'The place has no real-life photo yet, and we do not use game frames large. The link works — film the place yourself',
    card_cmp: 'Game vs real life — in Secret Base', card_code: 'code {c}', card_photo: 'Photo: {c}',
    sv_fmt: '{p}: {r} per 1,000 views', sv_fmt_snap: 'Snapchat: accepted without view pay', sv_fmt_np: 'Platform: {p}',
    sv_what: 'What is in the video', sv_about: 'About a place', sv_mention: 'Mentions', sv_about_d: 'The whole video is about one place',
    sv_mention_d: 'Up to 5 places, each with the second where it is seen or heard', sv_at: 'Second', sv_add_place: 'Add a place', sv_del: 'Remove place',
    sv_bad_at: 'Give the second as mm:ss, for example 0:21', sv_max: 'Up to 5 places in one video',
    sv_gp: 'The video has game footage', sv_gp_on: 'No view pay. The 40% purchase share and the League threshold stay', sv_gp_on_np: 'No Pro days for views. The League threshold stays',
    sv_vcode: 'Video code in the description', sv_vcode_note: 'You can remove it 7 days after review',
    sv_disc: 'The start of the video has an ad disclosure', sv_disc_need: 'Tick that the start of the video has an ad disclosure', sv_sending: 'Sending',
    sv_dup_h: 'This video is already submitted', sv_dup_p: 'A video with this link is already in “My videos”: {id}', sv_dup_open: 'Open the video',
    sv_unv: 'Confirm your platform account to get paid', sv_unv_np: 'Confirm your platform account to get Pro days',
    vd_submitted: 'Submitted. Checking the code in the description', vd_in_review: 'In review, usually within 48 hours', vd_rejected: 'Not accepted: {r}',
    vd_awaiting_threshold: 'Accepted. View pay starts at 1,000 views. Now {n}', vd_awaiting_np: 'Accepted. Pro days start at 1,000 views. Now {n}',
    vd_accruing: 'Accruing: {v}, {s}', vd_accruing_np: 'Counted: {v}', vd_closed: 'Final: {v}, {s} for views, {b} with the link', vd_closed_np: 'Final: {v}',
    vd_unavailable: 'The video was deleted or hidden. Earnings stopped', vd_frozen: 'Checking views. Earnings are paused',
    vs_wait_n: 'Waiting: {a} of {b}', vc_fix: 'Fix and submit again', vc_stats: 'Video stats', vc_feed: 'Watch in the feed',
    vc_places: 'Places in the video', role_about: 'about the place', role_mention: 'mention, {t}', vc_gp: 'Has game footage: no view pay',
    vt_total: 'Earned from the video', vt_calc_h: 'View pay', vt_calc: '{v} × {r} / 1,000 = {s}',
    vt_min: 'Under {min} per video — we pay the minimum {min}', vt_cap: 'The cap is {cap} per video', vt_wait: 'Pay starts at 1,000 views. Now {a} of {b}',
    vt_gp: 'Has game footage: no view pay. The 40% purchase share stays', vt_snap: 'Snapchat: no view pay. The 40% purchase share stays',
    vt_calc_note: 'Half in advance on the day 10 snapshot, the rest on day 30', vt_buys_h: 'Purchases with the video link', vt_buys_none: 'No purchases with the video link yet',
    vt_per: 'Visits per 1,000 views: {n}', vt_low: 'Under 1 visit per 1,000 views. Say the link out loud and pin a comment',
    vt_frozen: 'Earnings for the video are paused: we are checking views. We answer within 48 hours',
    e_hold: 'Everything is on hold for now: the purchase share for 30 days, views until the video’s day 10 and day 30',
    e_below: '{s} available. Payouts start from {min} — the rest moves to the next round', e_paid: 'Paid {s} on {d}',
    e_frozen: 'Earnings for video {id} are paused: we are checking views. We answer within 48 hours', e_pd: 'Pro days: {n}',
  },
};
// строки доски заданий, формы вклада и «Моих вкладов» (08 ТЗ §3 №11–13, §4; 02 §6). Словарь: «место / пасхалка», «Pro»
const TS = {
  ru: {
    board_h: 'Задания', bd_a: 'Для всех', bd_a_p: 'Нужен только вход почтой при отправке. Награда указана на каждой карточке',
    bd_b: 'Для партнёров', bd_b_p: 'Видно всем, делать — после «Стать партнёром». Деньги — партнёрам 18+ за ролик, пару фото и проверку',
    bd_b_p_np: 'Видно всем, делать — после «Стать партнёром»', bd_c: 'Лига', bd_c_p: 'Задания с фиксированной оплатой из бюджета. Сумма видна только партнёру',
    bd_c_p_np: 'Задания для участников Лиги: ролик о нескольких местах', hub_tasks: 'Задания', hub_tasks_sub: 'Места, пасхалки, фото и ролики',
    hub_mine: 'Мои вклады', hub_mine_sub: 'Принято {a}, на проверке {b}', hub_mine_none: 'Ваши находки и правки', you_nick: 'ваш_ник',
    tk_found: 'Узнаю это место', tk_found_d: '{p}: это то место из игры? «Нашёл» или «Не то место»', tk_found_v: 'Отметить',
    tk_fix: 'Поправьте место', tk_fix_d: '{p}: не там, закрыто, не то здание или нет координат', tk_fix_v: 'Поправить',
    tk_new_place: 'Новое место', tk_new_place_d: 'Нашли место из игры в жизни: точка, название, что в игре и источник', tk_new_place_v: 'Добавить место',
    tk_new_egg: 'Новая пасхалка', tk_new_egg_d: 'Отсылка или прообраз из игры: где это и откуда известно', tk_new_egg_v: 'Добавить пасхалку',
    tk_game_frame: 'Кадр из игры', tk_game_frame_d: '{p}: свой снимок экрана из игры с того же ракурса, что фото из жизни', tk_game_frame_v: 'Добавить кадр',
    tk_free_photo: 'Свободное фото', tk_free_photo_d: '{p}: фото из жизни ещё нет. Нужна ссылка на фото со свободной лицензией', tk_free_photo_v: 'Добавить фото',
    tk_place_week: 'Снимите ролик о месте недели: {p}', tk_place_week_d: 'Место недели получает «Снято про это» в карточке и первым стоит в ленте', tk_place_week_v: 'Снять',
    tk_fresh_find: 'Свежая находка: {p}, роликов ещё нет', tk_fresh_find_d: 'Нашёл {who}, {d}. Первый ролик места закрепим в ленте на 30 дней', tk_fresh_find_v: 'Снять',
    tk_mention3: 'Снимите ролик с упоминанием 3 мест', tk_mention3_d: 'До 5 мест в ролике, у каждого — секунда, где его видно или слышно', tk_mention3_v: 'Подать ролик',
    tk_need_pair: 'Нужна пара: {p}', tk_need_pair_d: 'Снимите тот же ракурс, что кадр игры: камера покажет его полупрозрачно', tk_need_pair_v: 'Переснять ракурс',
    tk_review: 'Проверка', tk_review_d: 'Карточки по одной: «Подходит» или «Не подходит». Решаем только: законно, то место, не чужое', tk_review_v: 'Проверять',
    tk_review_today: 'Сегодня: проверено {n}, точность {a}%',
    tk_league_d: '{pl}. Мест в ролике: {n}. Осталось участников: {s} из {all}', tk_league_v: 'Подать ролик', tk_until: 'Срок — до {d}',
    rw_check: 'Галочка у места', rw_found: 'Найдено {n}', rw_photo: 'Фото: {n}', rw_frame: 'Кадр: {n}', rw_free_photo: 'Фото: найдено {n}',
    rw_author: '{p}% с роликов о месте', rw_pair: '{s} за принятую пару', rw_dec: '{s} за точное решение', rw_rpm: '{r} за 1 000 просмотров и {p}% с покупок по ссылке',
    rw_fixed: '{s} при {v} просмотров', rw_league_np: 'Сумма видна партнёрам. Порог — {v} просмотров', rw_vpro: '{d} за ролик от {v} просмотров',
    rw_pre: 'Предварительно: {x}', rw_frame_note: 'Без денег: права на кадры игры — у её издателя',
    st_draft: 'Черновик', st_draft_p: 'Сохранён на этом устройстве', st_continue: 'Продолжить', st_sent: 'На проверке', st_sent_p: 'На проверке, обычно до 48 часов',
    st_ok: 'Принято', st_no: 'Не принято', st_fix: 'Исправить', st_more_place: 'Добавить ещё место', st_more_egg: 'Добавить ещё пасхалку', st_more_video: 'Снять ещё',
    lk_release: 'Откроется в день выхода GTA 6, {d}', lk_adult: 'Только с 18 лет', lk_invite: 'Откроется по приглашению в закрытый доступ',
    lk_partner: 'Откроется после «Стать партнёром»', lk_scout: 'Откроется после 5 принятых вкладов: у вас {n}', lk_mod: 'Для модераторов: 5 принятых вкладов и экзамен',
    lk_league: 'Откроется после 10 000 просмотров ролика (сейчас {n}) или по коду приглашения', lk_starts: 'Откроется {d}',
    tr_opens: 'Ваше место открыли {n} раз за неделю', tr_videos: ', о нём {v}', tr_compares: 'По вашей паре сравнивают {n}', tr_frame: 'По вашему кадру сравнивают {n}',
    tr_fixed: 'Ваша правка исправила адрес для {n}', n_people: '{n} человек|{n} человека|{n} человек',
    tr_votes: '«Нашёл»: {n} из {need}. Три голоса — и место «Проверено игроками»', tr_votes_ok: 'Место проверено игроками: {n} из {need} «Нашёл»',
    rjc_checked_ok: 'Мы проверили: место на карте верное', rjc_no_source: 'Нет источника: ссылки на ролик, кадр или статью', rjc_duplicate: 'Это место уже есть на карте',
    rjc_license: 'У фото нет свободной лицензии', rjc_angle: 'Ракурс не совпадает с кадром игры', rjc_not_game: 'Это не кадр из игры', rjc_people: 'На фото видны лица людей',
    rjc_other: 'Не подходит под правила',
    mc_h: 'Мои вклады', mc_empty: 'Здесь будут ваши находки', mc_empty_p: 'Начните с «Узнаю это место» на любой карточке.', mc_open_board: 'Открыть задания',
    mc_drafts: 'Черновики', mc_places: 'Ваши места', mc_places_p: 'Вы автор: ваше имя у места навсегда', mc_places_p_money: 'Вы автор: ваше имя у места навсегда и {p}% с роликов о нём {m} месяцев',
    mc_edits: 'Ваши правки и фото', mc_edits_p: 'Ваш ник у правок и фото', mc_sum: 'Принято {a}, на проверке {b}',
    mc_pro: '{d} за вклады. Не больше 60 дней в год', mc_pro_beta: 'Дни Pro за вклады начнутся, когда программа откроется для всех',
    ct_found: 'Узнаю это место', ct_fix: 'Правка', ct_new_place: 'Новое место', ct_new_egg: 'Новая пасхалка', ct_pair: 'Фото из жизни', ct_game_frame: 'Кадр из игры', ct_free_photo: 'Свободное фото',
    ty_new_place: 'Новое место', ty_new_place_d: 'Точка, название, что в игре и источник', ty_new_egg: 'Новая пасхалка', ty_new_egg_d: 'Отсылка или прообраз из игры',
    ty_fix: 'Поправить место', ty_fix_d: 'Не там, закрыто, не то здание, нет координат', ty_pair2: 'Фото из жизни', ty_pair2_d: 'Тот же ракурс, что кадр игры. Для Скаутов: 5 принятых вкладов',
    ty_frame: 'Кадр из игры', ty_frame_d: 'Свой снимок экрана из игры, без денег', ty_free: 'Свободное фото', ty_free_d: 'Ссылка на фото со свободной лицензией',
    cf_point_sub: 'Точка, название, что в игре и источник. Черновик сохраняется на этом устройстве', cf_where_h: 'Где это в жизни', cf_where: 'Координаты или адрес',
    cf_where_ph: '25.7617, -80.1918 или улица и город', cf_pick: 'Выбрать место на карте', cf_point: 'Точка на карте', cf_name: 'Название', cf_name_ph: 'Как называется в жизни',
    cf_what: 'Что в игре', cf_what_ph: 'Как это выглядит в игре', cf_what_egg_ph: 'Что за отсылка и где в игре', cf_src: 'Источник', cf_src_ph: 'Ролик с таймкодом, кадр или статья',
    cf_src_need: 'Нужна ссылка на ролик, кадр или статью, где это видно', cf_or_photo: 'Или фото', cf_add_photo: 'Добавить фото', cf_photo_ok: 'Фото добавлено',
    cf_next: 'Дальше', cf_place: 'Место', cf_dup_h: 'Похоже, это место уже есть', cf_dup_q: 'Это оно?', cf_dup_yes: 'Да, дополнить', cf_dup_no: 'Нет, другое',
    fx_wrong_spot: 'Не там', fx_closed: 'Закрыто', fx_wrong_building: 'Не то здание', fx_no_coords: 'Нет координат', fx_violation: 'Нарушение',
    cf_note: 'Что не так', cf_note_ph: 'Одной строкой', cf_pr_sub: 'Пересними ракурс: встаньте так, чтобы кадр игры совпал с видом',
    cf_cam: 'Открыть камеру', cf_shot: 'Снять', cf_ghost: 'Кадр игры', cf_ghost_p: 'Камера покажет его полупрозрачно поверх вида', cf_cam_off: 'Камера недоступна: выберите фото с того же ракурса',
    cf_pick_photo: 'Выбрать фото', cf_retake: 'Переснять', cf_your_photo: 'Ваше фото', cf_opacity: 'Прозрачность кадра игры',
    cf_pg_sub: 'Снимок экрана из игры с того же ракурса, что фото из жизни', cf_ref: 'Фото из жизни', cf_ref_p: 'Снимите в игре этот же ракурс', cf_pg_pick: 'Выбрать снимок экрана',
    cf_pg_other: 'Выбрать другой', cf_fp_url: 'Ссылка на фото', cf_fp_ph: 'commons.wikimedia.org/… или flickr.com/…',
    cf_fp_note: 'Подойдут фото со свободной лицензией: Wikimedia Commons или Flickr с CC BY и CC BY-SA', cf_found_q: 'Это то место из игры? Сравните ползунком на карте',
    cf_yes: 'Нашёл', cf_no: 'Не то место', cf_on_map: 'Открыть на карте',
    cf_draft_h: 'Черновик сохранён', cf_draft_p: 'Он на этом устройстве. Войдите почтой — отправим без повторного заполнения', cf_login_send: 'Войти и отправить', cf_later: 'Позже',
    cf_kind: 'Что', cf_sent_h: 'Отправлено', cf_sent_1: 'На проверке, обычно до 48 часов', cf_sent_2: 'Модератор проверит место и источник', cf_sent_found: 'Голос учтён',
    cf_sent_found_p: 'Место с тремя «Нашёл» помечается «Проверено игроками» — его чаще открывают', cf_reward: 'После проверки: {r}', cf_to_mine: 'Мои вклады',
    ce_no_place: 'Выберите место', ce_no_point: 'Укажите точку: координаты, адрес или место на карте', ce_no_name: 'Напишите название', ce_no_source: 'Нужна ссылка на ролик, кадр или статью, где это видно',
    ce_no_photo: 'Добавьте фото', ce_bad_reason: 'Выберите, что не так', ce_bad_url: 'Нужна ссылка на страницу фото', ce_limit: 'Не больше 5 мест в сутки. Остальные — завтра',
    ce_photo: 'Не получилось открыть фото', cf_send: 'Отправить', lg_h_c: 'Вход почтой', lg_sub_c: 'Чтобы ваш ник стоял у находки. Без пароля и покупки',
  },
  en: {
    board_h: 'Tasks', bd_a: 'For everyone', bd_a_p: 'You only sign in with email when sending. Each card shows its reward',
    bd_b: 'For partners', bd_b_p: 'Everyone can see them; you do them after “Become a partner”. Money goes to partners 18+ for a video, a photo pair or a review',
    bd_b_p_np: 'Everyone can see them; you do them after “Become a partner”', bd_c: 'League', bd_c_p: 'Tasks with fixed pay from the budget. Only partners see the amount',
    bd_c_p_np: 'Tasks for League members: a video about several places', hub_tasks: 'Tasks', hub_tasks_sub: 'Places, easter eggs, photos and videos',
    hub_mine: 'My contributions', hub_mine_sub: '{a} accepted, {b} in review', hub_mine_none: 'Your finds and fixes', you_nick: 'your_nick',
    tk_found: 'I know this place', tk_found_d: '{p}: is it the place from the game? “Found” or “Not this place”', tk_found_v: 'Mark',
    tk_fix: 'Fix the place', tk_fix_d: '{p}: wrong spot, closed, wrong building or no coordinates', tk_fix_v: 'Fix',
    tk_new_place: 'New place', tk_new_place_d: 'Found a game place in real life: a point, a name, what it is in the game and a source', tk_new_place_v: 'Add a place',
    tk_new_egg: 'New easter egg', tk_new_egg_d: 'A reference or a prototype from the game: where it is and how you know', tk_new_egg_v: 'Add an easter egg',
    tk_game_frame: 'Game frame', tk_game_frame_d: '{p}: your own game screenshot from the same angle as the real-life photo', tk_game_frame_v: 'Add a frame',
    tk_free_photo: 'Free photo', tk_free_photo_d: '{p}: no real-life photo yet. We need a link to a photo with a free license', tk_free_photo_v: 'Add a photo',
    tk_place_week: 'Film a video about the place of the week: {p}', tk_place_week_d: 'The place of the week gets “Filmed here” on its card and leads the feed', tk_place_week_v: 'Film',
    tk_fresh_find: 'Fresh find: {p}, no videos yet', tk_fresh_find_d: 'Found by {who}, {d}. We pin the place’s first video in its feed for 30 days', tk_fresh_find_v: 'Film',
    tk_mention3: 'Film a video that mentions 3 places', tk_mention3_d: 'Up to 5 places in a video, each with the second where it is seen or heard', tk_mention3_v: 'Submit a video',
    tk_need_pair: 'Pair needed: {p}', tk_need_pair_d: 'Shoot the same angle as the game frame: the camera shows it see-through', tk_need_pair_v: 'Reshoot the angle',
    tk_review: 'Review', tk_review_d: 'One card at a time: “Fits” or “Does not fit”. We only decide: legal, the right place, not someone else’s', tk_review_v: 'Review',
    tk_review_today: 'Today: {n} reviewed, accuracy {a}%',
    tk_league_d: '{pl}. Places in the video: {n}. Spots left: {s} of {all}', tk_league_v: 'Submit a video', tk_until: 'Due {d}',
    rw_check: 'A check mark on the place', rw_found: 'Found by {n}', rw_photo: 'Photo: {n}', rw_frame: 'Frame: {n}', rw_free_photo: 'Photo: found by {n}',
    rw_author: '{p}% of videos about the place', rw_pair: '{s} per accepted pair', rw_dec: '{s} per accurate decision', rw_rpm: '{r} per 1,000 views and {p}% of purchases with your link',
    rw_fixed: '{s} at {v} views', rw_league_np: 'Partners see the amount. Threshold: {v} views', rw_vpro: '{d} for a video with {v}+ views',
    rw_pre: 'Preliminary: {x}', rw_frame_note: 'No money: the rights to game frames belong to the game’s publisher',
    st_draft: 'Draft', st_draft_p: 'Saved on this device', st_continue: 'Continue', st_sent: 'In review', st_sent_p: 'In review, usually within 48 hours',
    st_ok: 'Accepted', st_no: 'Not accepted', st_fix: 'Fix', st_more_place: 'Add another place', st_more_egg: 'Add another easter egg', st_more_video: 'Film another',
    lk_release: 'Opens on the GTA 6 release day, {d}', lk_adult: '18+ only', lk_invite: 'Opens with an invite to the closed access',
    lk_partner: 'Opens after “Become a partner”', lk_scout: 'Opens after 5 accepted contributions: you have {n}', lk_mod: 'For moderators: 5 accepted contributions and an exam',
    lk_league: 'Opens after a video reaches 10,000 views (now {n}) or with an invite code', lk_starts: 'Opens {d}',
    tr_opens: 'Your place was opened {n} times this week', tr_videos: ', {v} about it', tr_compares: 'People comparing with your pair: {n}', tr_frame: 'People comparing with your frame: {n}',
    tr_fixed: 'Your fix corrected the address for {n}', n_people: '{n} person|{n} people',
    tr_votes: '“Found”: {n} of {need}. Three votes and the place is “Checked by players”', tr_votes_ok: 'Checked by players: {n} of {need} “Found”',
    rjc_checked_ok: 'We checked: the place on the map is right', rjc_no_source: 'No source: a link to a video, a frame or an article', rjc_duplicate: 'This place is already on the map',
    rjc_license: 'The photo has no free license', rjc_angle: 'The angle does not match the game frame', rjc_not_game: 'This is not a game frame', rjc_people: 'People’s faces are visible in the photo',
    rjc_other: 'Does not fit the rules',
    mc_h: 'My contributions', mc_empty: 'Your finds will be here', mc_empty_p: 'Start with “I know this place” on any card.', mc_open_board: 'Open tasks',
    mc_drafts: 'Drafts', mc_places: 'Your places', mc_places_p: 'You are the author: your name stays on the place', mc_places_p_money: 'You are the author: your name stays on the place, plus {p}% of videos about it for {m} months',
    mc_edits: 'Your fixes and photos', mc_edits_p: 'Your nick on fixes and photos', mc_sum: '{a} accepted, {b} in review',
    mc_pro: '{d} for contributions. Up to 60 days a year', mc_pro_beta: 'Pro days for contributions start when the program opens for everyone',
    ct_found: 'I know this place', ct_fix: 'Fix', ct_new_place: 'New place', ct_new_egg: 'New easter egg', ct_pair: 'Real-life photo', ct_game_frame: 'Game frame', ct_free_photo: 'Free photo',
    ty_new_place: 'New place', ty_new_place_d: 'A point, a name, what it is in the game and a source', ty_new_egg: 'New easter egg', ty_new_egg_d: 'A reference or a prototype from the game',
    ty_fix: 'Fix a place', ty_fix_d: 'Wrong spot, closed, wrong building, no coordinates', ty_pair2: 'Real-life photo', ty_pair2_d: 'The same angle as the game frame. For Scouts: 5 accepted contributions',
    ty_frame: 'Game frame', ty_frame_d: 'Your own game screenshot, no money', ty_free: 'Free photo', ty_free_d: 'A link to a photo with a free license',
    cf_point_sub: 'A point, a name, what it is in the game and a source. The draft is saved on this device', cf_where_h: 'Where it is in real life', cf_where: 'Coordinates or address',
    cf_where_ph: '25.7617, -80.1918 or a street and city', cf_pick: 'Choose a place on the map', cf_point: 'Point on the map', cf_name: 'Name', cf_name_ph: 'What it is called in real life',
    cf_what: 'In the game', cf_what_ph: 'How it looks in the game', cf_what_egg_ph: 'What the reference is and where in the game', cf_src: 'Source', cf_src_ph: 'A video with a timecode, a frame or an article',
    cf_src_need: 'We need a link to a video, a frame or an article where it is seen', cf_or_photo: 'Or a photo', cf_add_photo: 'Add a photo', cf_photo_ok: 'Photo added',
    cf_next: 'Next', cf_place: 'Place', cf_dup_h: 'This place may already exist', cf_dup_q: 'Is this it?', cf_dup_yes: 'Yes, add to it', cf_dup_no: 'No, a different one',
    fx_wrong_spot: 'Wrong spot', fx_closed: 'Closed', fx_wrong_building: 'Wrong building', fx_no_coords: 'No coordinates', fx_violation: 'Violation',
    cf_note: 'What is wrong', cf_note_ph: 'In one line', cf_pr_sub: 'Reshoot the angle: stand where the game frame lines up with the view',
    cf_cam: 'Open the camera', cf_shot: 'Shoot', cf_ghost: 'Game frame', cf_ghost_p: 'The camera shows it see-through over the view', cf_cam_off: 'The camera is not available: choose a photo from the same angle',
    cf_pick_photo: 'Choose a photo', cf_retake: 'Reshoot', cf_your_photo: 'Your photo', cf_opacity: 'Game frame opacity',
    cf_pg_sub: 'A game screenshot from the same angle as the real-life photo', cf_ref: 'Real-life photo', cf_ref_p: 'Shoot this same angle in the game', cf_pg_pick: 'Choose a screenshot',
    cf_pg_other: 'Choose another', cf_fp_url: 'Photo link', cf_fp_ph: 'commons.wikimedia.org/… or flickr.com/…',
    cf_fp_note: 'Photos with a free license work: Wikimedia Commons or Flickr with CC BY and CC BY-SA', cf_found_q: 'Is it the place from the game? Compare with the slider on the map',
    cf_yes: 'Found', cf_no: 'Not this place', cf_on_map: 'Open on the map',
    cf_draft_h: 'Draft saved', cf_draft_p: 'It is on this device. Sign in with email and we send it without filling it in again', cf_login_send: 'Sign in and send', cf_later: 'Later',
    cf_kind: 'What', cf_sent_h: 'Sent', cf_sent_1: 'In review, usually within 48 hours', cf_sent_2: 'A moderator checks the place and the source', cf_sent_found: 'Vote counted',
    cf_sent_found_p: 'A place with three “Found” is marked “Checked by players” and gets opened more', cf_reward: 'After review: {r}', cf_to_mine: 'My contributions',
    ce_no_place: 'Choose a place', ce_no_point: 'Set a point: coordinates, an address or a place on the map', ce_no_name: 'Write the name', ce_no_source: 'We need a link to a video, a frame or an article where it is seen',
    ce_no_photo: 'Add a photo', ce_bad_reason: 'Choose what is wrong', ce_bad_url: 'We need a link to the photo page', ce_limit: 'Up to 5 places a day. The rest tomorrow',
    ce_photo: 'Could not open the photo', cf_send: 'Send', lg_h_c: 'Sign in with email', lg_sub_c: 'So your nick stays on the find. No password, no purchase',
  },
};
// ───────── строки экранов 10, 14–17 (08 ТЗ §3, §7 задачи 8–9; 02 §7.8, §7.9, §10, §11) ─────────
const S4 = {
  ru: {
    ex_h: 'Экзамен модератора', ex_lead: '{t} примеров, нужно {n} верных',
    ex_p1: 'Карточки вперемешку: ролики, новые места и фото. Часть из них — ловушки с известным ответом',
    ex_p2: 'Решаем только три вещи: законно, то место, не чужое. «Красиво или нет» модератор не решает',
    ex_p3: 'Смотрите каждую карточку: решение быстрее {s} секунд не засчитывается', ex_p4: 'Не получилось — повторить можно через {d} дней',
    ex_start: 'Начать экзамен', ex_q: 'Пример {i} из {t}', ex_sending: 'Считаем результат',
    ex_fast: 'Не засчитано: решение быстрее {s} секунд. Посмотрите карточку внимательнее',
    ex_pass_h: 'Готово. Теперь {n} проверок в режиме ученика', ex_pass_p: '{c} из {t} верных. Решения ученика сверяем с модераторами. От {a}% совпадений — роль модератора',
    ex_pass_pay: 'За проверки ученика денег нет, у модератора — {s} за точное решение', ex_go: 'Начать проверки',
    ex_fail_h: '{c} из {t}. Повторить можно через {d} дней', ex_fail_p: 'Нужно {n} верных. Новая попытка — {date}', ex_fast_n: 'Не засчитано из-за спешки: {n}',
    ex_cd_h: 'Повторить экзамен можно {date}', ex_cd_p: 'Прошлая попытка — {c} из {t}, нужно {n}. До повтора {days}',
    ex_cd_p2: 'Места, правки и фото тем временем засчитываются как обычно', ex_tasks: 'К заданиям', ex_take: 'Сдать экзамен', ex_again: 'Сдать экзамен ещё раз',
    mod_ready: 'Принятых вкладов: {n}. Можно сдавать экзамен', mod_now2: 'У вас {n} из {need} принятых вкладов',
    rv_student: 'Режим ученика: {d} из {n}. Совпадений с модераторами {a}%', rv_student_pay: 'За проверки ученика денег нет',
    rv_acc: 'Точность — по карточкам с известным ответом, последние {n}', rv_empty_h: 'Очередь пуста. Загляните через час',
    rv_empty_p: 'Новые карточки появятся, когда авторы пришлют ролики, места и фото', rv_done_today: 'Сегодня: проверено {n}',
    rv_paused_h: 'Проверка на паузе: точность ниже {a}%', rv_paused_p: 'Точность считаем по карточкам с известным ответом, последние {w}. Сейчас — {x}%. Сдайте экзамен ещё раз, и очередь откроется',
    rv_paused_st: 'Совпадений с модераторами меньше {a}%. Сдайте экзамен ещё раз, и очередь откроется',
    rr_no_code: 'Нет кода SB- в описании', rr_not_at: 'На этой секунде места нет', rr_no_disc: 'Нет пометки о рекламе в начале', rr_not_place: 'Не то место',
    rr_reused: 'Ролик уже подавали', rr_unsafe: 'Частная территория или опасная съёмка', rr_license: 'Лицензия фото не свободная', rr_no_src: 'Нет источника', rr_dup: 'Такое место уже есть',
    fc_disclosure_ok: 'Пометка о рекламе в начале', fc_place_at: 'Место видно на {at}', fc_license_ok: 'Свободная лицензия, автор указан', fc_same_angle: 'Тот же ракурс, что кадр игры',
    fc_disclosure_missing: 'В начале нет пометки о рекламе', fc_place_missing: 'На {at} места не видно и не слышно', fc_streetview_missing: 'Похоже на снимок Street View с экрана',
    fc_faces_missing: 'Лица людей крупно', fc_game_missing: 'Это кадр из игры, а не фото из жизни', fc_source_missing: 'Нет ссылки на источник',
    fc_dup_place_missing: 'Такое место уже есть на карте', fc_private_missing: 'Снято во дворе частного дома',
    wd_title: 'Вывод', wd_av: 'Доступно', wd_av_pre: 'Доступно, предварительно',
    wd_first: 'Для первой выплаты подтвердите личность. Это делает {p}, мы не видим документы', wd_kyc_go: 'Подтвердить личность',
    wd_kyc_fail: 'Личность не подтверждена. Попробуйте ещё раз: проверку проводит {p}',
    wd_kyc_h: '{p} проверяет документы. Ответ придёт на {e}', wd_kyc_check: 'Проверить статус',
    wd_ready: 'Доступно {s}. Выплата {d}. От {min}', wd_method: 'Способ выбираете у {p}: банк, PayPal или карта. Комиссию способа платит получатель, её покажут до подтверждения',
    wd_queued: 'Заявка в раунде {d}: {s}', wd_failed: 'Выплата не дошла: проверьте реквизиты у {p}', wd_retry: 'Отправить снова',
    wd_s1: 'Проверка личности у {p}, один раз', wd_s2: 'Заявка от {min}', wd_s3: 'Раунд {d}: первую выплату и всё больше {big} проверяет человек',
    wd_s_paid: 'Выплачено {s}, {d}', wd_kyc_sent: 'Окно проверки откроется у {p}. Без сервера проверка на этом устройстве идёт сама',
    lg_closed: 'Лига креаторов. Откроется, когда ваш ролик о месте или с его упоминанием наберёт {g} просмотров (сейчас {n}), или по коду приглашения',
    lg_closed_tasks: 'Задания Лиги с фиксированной оплатой откроются вместе с Лигой', lg_closed_tasks_np: 'Задания Лиги откроются вместе с Лигой',
    lg_tasks_h: 'Задания Лиги', lg_tasks_p: 'Сумма при пороге просмотров, без «до». Ролик по заданию подайте из карточки — он свяжется с заданием',
    lg_tasks_p_np: 'Ролик по заданию подайте из карточки — он свяжется с заданием', lg_none: 'Заданий сейчас нет. Ролик о месте засчитается как обычно',
    lg_prog: 'Ролик {id}: {a} из {b} просмотров', lg_done: 'Порог набран: {s}', lg_done_np: 'Порог набран', sv_task: 'По заданию Лиги: {t}',
    sv_task_places: 'Для задания нужно мест в ролике: {n}. Добавьте их в «Упоминание»', sv_task_closed: 'Задание закрыто или ещё не открыто',
    ru_h_count: 'Что засчитываем', ru_h_lim: 'Лимиты', ru_lim_v: 'До {cap} за ролик по просмотрам, от {floor}. Новый партнёр — до {np} в месяц за просмотры, пока не прошла первая выплата. Автор места — до {an} в месяц, после первой выплаты — до {ab}',
    ru_h_appeal: 'Апелляция', ru_appeal_v: 'Одна апелляция на решение, ответ до {h} часов', ru_h_change: 'Изменения правил', ru_change_v: 'С анонсом за {d} дней. Ставка вниз — только с анонсом, вверх — сразу. Задним числом — никогда',
    ru_code_v2: '{p}% с каждой покупки, после холда {h} дней', ru_author_v2: '{p}% сверху к роликам о нём, {m} месяцев', ru_scout_v2: '{s} за принятую пару',
    ru_cpa_v2: '{s}, когда он заработает {a} за {d} дней', ru_mod_v2: '{s} за точное решение при точности от {a}%', ru_league: 'Задание Лиги', ru_league_v: 'фиксированная сумма при пороге просмотров',
    ru_snap: 'Snapchat и ролики с кадрами из игры', ru_snap_v: 'без оплаты просмотров, доля с покупок остаётся',
    ru_views_tv2: 'половина — по {a}-му дню ролика, остаток — по {b}-му', ru_tasks_tv2: 'через {d} дней после проверки', ru_pay_v2: '{day}-го числа, от {min}',
    ru_first_v2: 'с проверкой личности у {p}, 18+', ru_big2: 'Больше {big}', ru_hold_v2: 'холд {h} дней, потом — в ближайший раунд',
    ru_no6: 'Чужие ролики и перезаливы', ru_no6v: 'отказ', ru_no7: 'Обещания заработка зрителям', ru_no7v: 'отказ',
    ru_no8: 'Кадры Rockstar как основа ролика', ru_no8v: 'отказ; кадры из игры как часть ролика — без оплаты просмотров', ru_no9: 'Частная территория, опасная съёмка', ru_no9v: 'отказ',
    ru_np2v2: '{d} дней Pro', ru_np3v2: '{d} дней Pro, до 12 в год', ru_np_max: 'Дни Pro за вклады', ru_np_max_v: 'до {d} в год',
    ad_st_mod: 'Модератор', ad_st_exam: 'Экзамен модератора', ad_cq: 'Вклады на проверке',
    ad_cq_p: 'Без сервера вклады видно только на этом устройстве. Принятый получает «Найдено @ник» и дни Pro', ad_cq_none: 'Вкладов на проверке нет',
    ad_accept: 'Принять', ad_reject: 'Отклонить', ad_c_accepted: 'принят', ad_c_rejected: 'отклонён',
  },
  en: {
    ex_h: 'Moderator exam', ex_lead: '{t} examples, {n} correct to pass',
    ex_p1: 'Cards are mixed: videos, new places and photos. Some of them are traps with a known answer',
    ex_p2: 'You decide only three things: legal, the right place, not someone else’s. Moderators don’t judge beauty',
    ex_p3: 'Look at each card: a decision faster than {s} seconds does not count', ex_p4: 'If you don’t pass, you can retry in {d} days',
    ex_start: 'Start the exam', ex_q: 'Example {i} of {t}', ex_sending: 'Counting the result',
    ex_fast: 'Not counted: the decision took less than {s} seconds. Take a closer look',
    ex_pass_h: 'Done. Now {n} checks in trainee mode', ex_pass_p: '{c} of {t} correct. Trainee decisions are compared with moderators. From {a}% agreement you become a moderator',
    ex_pass_pay: 'Trainee checks are not paid, a moderator gets {s} per accurate decision', ex_go: 'Start checking',
    ex_fail_h: '{c} of {t}. You can retry in {d} days', ex_fail_p: '{n} correct needed. Next attempt: {date}', ex_fast_n: 'Not counted because of haste: {n}',
    ex_cd_h: 'You can retake the exam on {date}', ex_cd_p: 'Last attempt: {c} of {t}, {n} needed. {days} left',
    ex_cd_p2: 'Meanwhile places, fixes and photos count as usual', ex_tasks: 'To tasks', ex_take: 'Take the exam', ex_again: 'Retake the exam',
    mod_ready: 'Accepted contributions: {n}. You can take the exam', mod_now2: 'You have {n} of {need} accepted contributions',
    rv_student: 'Trainee mode: {d} of {n}. Agreement with moderators {a}%', rv_student_pay: 'Trainee checks are not paid',
    rv_acc: 'Accuracy is measured on cards with a known answer, last {n}', rv_empty_h: 'The queue is empty. Check back in an hour',
    rv_empty_p: 'New cards show up when creators send videos, places and photos', rv_done_today: 'Checked today: {n}',
    rv_paused_h: 'Checking paused: accuracy below {a}%', rv_paused_p: 'Accuracy is measured on cards with a known answer, last {w}. Now {x}%. Retake the exam to reopen the queue',
    rv_paused_st: 'Agreement with moderators is below {a}%. Retake the exam to reopen the queue',
    rr_no_code: 'No SB- code in the description', rr_not_at: 'The place is not at this second', rr_no_disc: 'No ad disclosure at the start', rr_not_place: 'Not this place',
    rr_reused: 'This video was already submitted', rr_unsafe: 'Private property or unsafe filming', rr_license: 'The photo license is not free', rr_no_src: 'No source', rr_dup: 'This place already exists',
    fc_disclosure_ok: 'Ad disclosure at the start', fc_place_at: 'The place is visible at {at}', fc_license_ok: 'Free license, author credited', fc_same_angle: 'Same angle as the game frame',
    fc_disclosure_missing: 'No ad disclosure at the start', fc_place_missing: 'The place is not visible or heard at {at}', fc_streetview_missing: 'Looks like a Street View screenshot',
    fc_faces_missing: 'Faces in close-up', fc_game_missing: 'This is a game frame, not a real-life photo', fc_source_missing: 'No source link',
    fc_dup_place_missing: 'This place is already on the map', fc_private_missing: 'Filmed in the yard of a private house',
    wd_title: 'Withdrawal', wd_av: 'Available', wd_av_pre: 'Available, preliminary',
    wd_first: 'Confirm your identity for the first payout. {p} does it, we don’t see your documents', wd_kyc_go: 'Confirm identity',
    wd_kyc_fail: 'Identity not confirmed. Try again: {p} runs the check',
    wd_kyc_h: '{p} is checking your documents. The answer will come to {e}', wd_kyc_check: 'Check status',
    wd_ready: '{s} available. Payout on {d}. From {min}', wd_method: 'You choose the method at {p}: bank, PayPal or card. The recipient pays the method fee, shown before you confirm',
    wd_queued: 'Request in the {d} round: {s}', wd_failed: 'The payout did not arrive: check your details at {p}', wd_retry: 'Send again',
    wd_s1: 'Identity check at {p}, once', wd_s2: 'Request from {min}', wd_s3: 'Round on {d}: a person reviews the first payout and anything over {big}',
    wd_s_paid: 'Paid {s}, {d}', wd_kyc_sent: 'The check window opens at {p}. Without a server the check on this device runs by itself',
    lg_closed: 'Creator League. Opens when your video about a place or mentioning it reaches {g} views (now {n}), or with an invite code',
    lg_closed_tasks: 'League tasks with fixed pay open together with the League', lg_closed_tasks_np: 'League tasks open together with the League',
    lg_tasks_h: 'League tasks', lg_tasks_p: 'An amount at a view threshold, no “up to”. Submit the video from the task card, it gets linked to the task',
    lg_tasks_p_np: 'Submit the video from the task card, it gets linked to the task', lg_none: 'No tasks right now. A video about a place counts as usual',
    lg_prog: 'Video {id}: {a} of {b} views', lg_done: 'Threshold reached: {s}', lg_done_np: 'Threshold reached', sv_task: 'For the League task: {t}',
    sv_task_places: 'The task needs {n} places in the video. Add them under “Mention”', sv_task_closed: 'The task is closed or not open yet',
    ru_h_count: 'What counts', ru_h_lim: 'Limits', ru_lim_v: 'Up to {cap} per video for views, from {floor}. A new partner — up to {np} a month for views until the first payout. Place author — up to {an} a month, after the first payout up to {ab}',
    ru_h_appeal: 'Appeal', ru_appeal_v: 'One appeal per decision, answer within {h} hours', ru_h_change: 'Rule changes', ru_change_v: 'Announced {d} days ahead. A lower rate only with notice, a higher one right away. Never retroactively',
    ru_code_v2: '{p}% of every purchase, after a {h}-day hold', ru_author_v2: '{p}% on top for videos about it, {m} months', ru_scout_v2: '{s} per accepted pair',
    ru_cpa_v2: '{s} once they earn {a} within {d} days', ru_mod_v2: '{s} per accurate decision at {a}%+ accuracy', ru_league: 'League task', ru_league_v: 'a fixed amount at a view threshold',
    ru_snap: 'Snapchat and videos with game footage', ru_snap_v: 'no pay for views, the purchase share stays',
    ru_views_tv2: 'half on day {a} of the video, the rest on day {b}', ru_tasks_tv2: '{d} days after review', ru_pay_v2: 'on day {day} of the month, from {min}',
    ru_first_v2: 'with an identity check at {p}, 18+', ru_big2: 'Over {big}', ru_hold_v2: 'a {h}-day hold, then the next round',
    ru_no6: 'Other people’s videos and re-uploads', ru_no6v: 'rejected', ru_no7: 'Promising earnings to viewers', ru_no7v: 'rejected',
    ru_no8: 'Rockstar footage as the base of a video', ru_no8v: 'rejected; game footage as part of a video — no pay for views', ru_no9: 'Private property, unsafe filming', ru_no9v: 'rejected',
    ru_np2v2: '{d} days of Pro', ru_np3v2: '{d} days of Pro, up to 12 a year', ru_np_max: 'Pro days for contributions', ru_np_max_v: 'up to {d} a year',
    ad_st_mod: 'Moderator', ad_st_exam: 'Moderator exam', ad_cq: 'Contributions in review',
    ad_cq_p: 'Without a server contributions are visible only on this device. An accepted one gets “Found by @nick” and Pro days', ad_cq_none: 'No contributions in review',
    ad_accept: 'Accept', ad_reject: 'Reject', ad_c_accepted: 'accepted', ad_c_rejected: 'rejected',
  },
};
Object.assign(S.ru, TS.ru, S4.ru); Object.assign(S.en, TS.en, S4.en);
const lang = () => (getLang() === 'en' ? 'en' : 'ru');
function tx(k, v = {}) {
  let s = S[lang()][k] ?? S.ru[k] ?? k;
  for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b);
  return s;
}
function plural(n, k) {
  const f = tx(k, { n: num(n) }).split('|');
  if (lang() === 'en') return n === 1 ? f[0] : f[1] || f[0];
  const m10 = n % 10, m100 = n % 100;
  return f[m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 1 : 2] || f[0];
}
const num = (n) => (lang() === 'en' ? Number(n).toLocaleString('en-US') : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
function money(c) {
  if (!c) return '$0';
  const s = c % 100 ? (c / 100).toFixed(2) : String(c / 100);
  return '$' + (lang() === 'en' ? Number(s).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 }) : s.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
}
// суммы заработка — всегда с центами ($20,00), кроме нуля ($0): цифры 08 §5 «до цента»
function money2(c) {
  if (!c) return '$0';
  const s = (Math.abs(c) / 100).toFixed(2), neg = c < 0 ? '−' : '';
  return neg + '$' + (lang() === 'en' ? Number(s).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : s.replace('.', ',').replace(/\B(?=(\d{3})+,)/g, ' '));
}
const MON = { ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
function dfmt(iso) { const [, m, d] = String(iso).split('-').map(Number); return lang() === 'en' ? `${MON.en[m - 1]} ${d}` : `${d} ${MON.ru[m - 1]}`; }
const pct = (a, b) => (b ? (a / b * 100).toFixed(a / b < 0.1 ? 1 : 0) : '0').replace('.', lang() === 'en' ? '.' : ',') + '%';
const PLAT = { tiktok: 'TikTok', youtube: 'YouTube', shorts: 'YouTube Shorts', reels: 'Instagram Reels', instagram: 'Instagram', snapchat: 'Snapchat' };
const shortName = (s) => String(s || '').split(/[,(–]/)[0].trim();
const slugOf = (id, world) => String(id || '').replace(new RegExp('^' + world + '-'), '');

// ───────── состояние ─────────
let ctx = null;              // из app.js: openSheet, closeSheet, toast, haptic, openOnMap, game, isFav, toggleFav, rerenderSettings
let P = null, R = null;      // профиль и правила (SB.api)
let hubCache = '';
const placeCache = {};       // world → Map(id → place)
async function place(ref) {
  if (!ref) return null;
  if (!placeCache[ref.world]) { const d = await loadPlaces(ref.world); placeCache[ref.world] = new Map(d.places.map((p) => [p.id, p])); }
  if (/^db-/.test(ref.id) && !placeCache[ref.world].has(ref.id)) await dbPoint(ref);
  return placeCache[ref.world].get(ref.id) || null;
}
// точка сообщества gtadb (id db-<L-id>, карточка карты): мест в places.js нет — название и адрес из data/map/gtadb_<игра>.json.
// Фото не берём: фото из жизни там часто кадр Street View, кадр игры — © Rockstar (крупно не ставим) → «Снять про это» = no_pair
const gtadbCache = {};
async function dbPoint(ref) {
  const j = await (gtadbCache[ref.world] = gtadbCache[ref.world] || fetch(`data/map/gtadb_${ref.world}.json`).then((r) => r.json()).catch(() => null));
  const q = j?.points?.find((x) => 'db-' + x[0] === ref.id); if (!q) return;
  const [n, ...rest] = String(q[3] || q[1] || '').split(',');
  placeCache[ref.world].set(ref.id, { id: ref.id, kind: 'place', game: ref.world, n: n.trim(), a: rest.join(',').trim(), lat: q[4], lon: q[5], db: true });
}
async function placesOf(list) { await Promise.all(list.map((x) => x && x.place && place(x.place))); }
const pSync = (ref) => (ref && placeCache[ref.world]?.get(ref.id)) || null;
const pName = (ref) => shortName(realOf(pSync(ref) || {})) || '';
const pImg = (ref, big = false) => { const p = pSync(ref); if (!p) return ''; const ph = p.pr || p.pg; return ph ? imgUrl((big ? ph.file || ph.thumb : ph.thumb || ph.file) || '') : ''; };
const pCity = (ref) => (ref?.world === 'gta6' ? (lang() === 'en' ? 'Miami' : 'Майами') : (lang() === 'en' ? 'Los Angeles' : 'Лос-Анджелес'));

// даты профиля: 'YYYY-MM-DD' — до конца дня, ISO со временем — как есть
const until = (v) => (v ? new Date(/T/.test(v) ? v : v + 'T23:59:59') : null);
const active = (v) => !!v && until(v) > new Date();
const workPro = () => (P && (P.work_pro_until || (P.pro_kind === 'work' ? P.pro_until : null))) || null;
const hasPro = () => !!(P && (active(P.pro_until) || active(workPro())));
const isTrial = () => !!(P && P.trial_until && !hasPro() && active(P.trial_until));
const isGuest = () => !P || !P.email;
const isMinor = () => !!(P && P.minor);
const noPay = () => !!(P && P.payouts === false);
const isPartner = () => !!(P && P.roles.includes('creator') && P.adult_at);
const isMod = () => !!(P && P.roles.includes('mod'));
// Партнёрство — договор, а не тариф (31 §4.3, FTC 16 CFR 437; решение ведения 16.10): Лига, подача роликов, «Мой заработок»,
// ссылка и код открыты партнёру (вход почтой + 18+) без покупки, в пробном тоже. Скрыто только у пробного, кто партнёром не стал.
const moneyOK = () => isPartner() && !noPay();
const trialOnly = () => isTrial() && !isPartner();
// строка рабочего Pro партнёра: «до <дата>» или «закончился <дата>» — с правилом +30 дней за принятый ролик
const workLine = () => { const w = workPro(); return w && isPartner() && !noPay() ? `<div class="cr-note">${I.star}<span>${esc(tx(active(w) ? 'work_pro' : 'work_pro_end', { d: dfmt(String(w).slice(0, 10)) }))}</span></div>` : ''; };
// подпись под суммами: beta — «Выплаты начнутся, когда программа откроется для всех» (08 §2.4); demo и live до раунда — первые выплаты
const medLine = () => (mode() === 'beta' ? tx('beta_pay') : R && R.median_cents != null ? tx('median', { m: money(R.median_cents) }) : tx('first_pay', { d: dfmt(R?.first_round || '2026-11-20') }));
const med = (cls = '') => `<p class="cr-med${cls ? ' ' + cls : ''}">${esc(medLine())}</p>`;
// ───────── режимы площадки (08 ТЗ §1): rules.mode из SB.api — экраны не знают, откуда данные ─────────
const mode = () => R?.mode || 'beta';
// пометка внизу экрана: в demo — на КАЖДОМ экране и шторке (FTC, реклама с суммами; check_code.py правило 10), в beta — где есть суммы
const modeNote = (html = '', rates = false) => (mode() === 'demo' ? `<p class="cr-mode">${I.info}<span>${esc(tx('demo_note'))}</span></p>`
  : mode() === 'beta' && !rates && /\$\d/.test(html) ? `<p class="cr-mode">${I.info}<span>${esc(tx('beta_note'))}</span></p>` : '');
// все шторки раздела — только через sheet(): пометка режима добавляется сама
const sheet = (html, onClose) => ctx.openSheet(html.replace(/<\/div>\s*$/, modeNote(html) + '</div>'), 'cr-sheet', onClose);
// открыт ли раздел с деньгами: demo, live, приглашение или день открытия (rules.open_at); иначе — список ожидания (08 §2)
const today = () => new Date().toISOString().slice(0, 10);
const isOpen = () => mode() === 'live' || (R?.open_at && today() >= R.open_at);
const hasAccess = () => isOpen() || !!P?.invited;
const verifiedAcc = () => (P?.accounts || []).find((a) => a.status === 'verified');
const workingAcc = () => [...(P?.accounts || [])].reverse().find((a) => a.status === 'pending' || a.status === 'failed');
const link = (code, world, id, v) => `${APP.domain}/${code}${world ? `/${world}/${slugOf(id, world)}` : ''}${v ? `?v=${v}` : ''}`;
const daysTo = (iso) => Math.max(0, Math.ceil((new Date(iso + 'T00:00:00') - new Date()) / 864e5));

async function load(force = false) {
  if (P && R && !force) return;
  [P, R] = await Promise.all([api().getProfile(), api().getRules()]);
}

// ───────── общие куски разметки ─────────
const ic = (n) => I[n] || '';
function picture(b, cls = '') {
  return b ? `<picture class="${cls}"><source type="image/avif" srcset="${b}.avif"><img src="${b}.webp" alt="" width="860" height="676" decoding="async"></picture>` : '';
}
function row(go, icon, label, sub = '', attrs = '') {
  return `<button class="row cr-row" data-cr="${go}" ${attrs}><span class="row-ic">${ic(icon)}</span><span class="row-l">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="row-chev">${I.chevron}</span></button>`;
}
const bar = (p) => `<span class="cr-bar"><i style="width:${Math.max(2, Math.min(100, p)).toFixed(1)}%"></i></span>`;
const tag = (k, t) => `<span class="cr-tag ${k}">${esc(t)}</span>`;
// статусы ролика 02 §7.4 (8 штук); старое имя pending_review = in_review
const vst = (s) => (s === 'pending_review' ? 'in_review' : s);
const THRESHOLD = 1000;   // порог оплаты просмотров (02 §7.4)
const VST = { accruing: 'ok', closed: 'ok', rejected: 'no', unavailable: 'no', frozen: 'wait', in_review: 'wait', submitted: 'wait', awaiting_threshold: 'wait' };
const stTag = (s, v) => tag(VST[vst(s)] || '', vst(s) === 'awaiting_threshold' && v ? tx('vs_wait_n', { a: num(v.views), b: num(THRESHOLD) }) : tx('vs_' + vst(s)));
function field(label, value, copy = '', note = '') {
  return `<div class="cr-field"><span>${esc(label)}</span><b>${esc(value)}</b>${copy ? `<button class="cr-mini" data-cr="copy" data-v="${esc(copy)}">${I.copy}${esc(tx('copy'))}</button>` : ''}${note ? `<small>${esc(note)}</small>` : ''}</div>`;
}
function steps(n, code) {
  const st = [['steps_review', 'steps_review_d'], ['steps_wait', 'steps_wait_d'], ['steps_acc', 'steps_acc_d']];
  return `<div class="cr-steps">${st.map(([a, b], k) => `<div class="${k < n ? 'on' : ''}">${k < n ? I.check : I.clock}<span><b>${esc(tx(a))}</b>. ${esc(tx(b, { code }))}</span></div>`).join('')}</div>`;
}

// ───────── хаб «Для авторов» вверху Настроек ─────────
export function hubHTMLSync() { return hubCache; }
async function hubHTML() {
  await load();
  if (window.Capacitor?.isNativePlatform?.()) return '';   // раздел только на вебе: в iOS-сборке его нет (07 §2.2)
  const admin = await api().adminState().then((x) => x.admin).catch(() => false);
  const tail = (admin ? `<div class="group">${row('open:admin', 'shield', tx('ad_h'))}</div>` : '') + (mode() === 'demo' ? modeNote() : '');
  if (trialOnly()) return (await trialHub()) + tail;
  // без приглашения (и до rules.open_at) — список ожидания: waitlist_new / waitlist_joined / waitlist_verified (08 §2.1)
  if (!hasAccess()) return `<div class="cr-hub-h">${esc(tx('for_authors'))}</div>${waitlistHTML()}<div class="group">${await workRows()}${row('open:rules', 'doc', tx('rules'), tx('rules_sub'))}</div>${tail}`;
  return (await hubMain()) + tail;
}
async function hubMain() {
  const game = ctx?.game?.() || 'gta6', banner = HERO[game]?.banners[0];
  const np = noPay(), minor = isMinor(), guest = isGuest(), partner = isPartner();
  const title = minor ? tx('title_minor') : np ? tx('title_np') : tx('title');
  const sub = minor ? tx('hub_minor_sub') : np ? tx('hub_np_sub') : medLine();
  let foot = '';
  if (guest) foot = `<span class="cr-hcta">${I.mail}${esc(tx('hub_guest'))}</span>`;
  else if (!partner && !minor) foot = `<span class="cr-hcta">${esc(tx('hub_player'))}</span>`;
  else if (!minor) {
    const pr = P.league_progress || { views: 0, goal: 10000 };
    foot = P.league_unlocked ? `<span class="cr-hline">${esc(tx('hub_open'))}${I.chevron}</span>`
      : `<span class="cr-hline">${esc(tx('hub_lock'))}</span>${bar(pr.views / pr.goal * 100)}<span class="cr-prog">${esc(tx('of', { a: num(pr.views), b: num(pr.goal) }))}</span>`;
  }
  const go = guest || (!partner && !minor) ? 'login' : 'open:league';
  // приглашение принято (или программа открыта), партнёром ещё не стал — состояние invite: дальше «Стать партнёром»
  const card = !partner && !minor
    ? `<button class="cr-hero" data-cr="login">${picture(banner, 'cr-hero-ph')}<span class="cr-hero-in glass-plate"><b>${esc(P.invited ? tx('inv_card') : tx('inv_open'))}</b><span class="cr-hero-sub">${esc(tx('inv_card_p'))}</span><span class="cr-hcta">${esc(tx('wl_partner'))}</span></span></button>`
    : `<button class="cr-hero" data-cr="${go}">${picture(banner, 'cr-hero-ph')}<span class="cr-hero-in glass-plate"><b>${esc(title)}</b><span class="cr-hero-sub">${esc(sub)}</span>${foot}</span></button>`;
  // партнёр без подтверждённого канала — partner_unverified: подтверждение обязательно для денег, можно позже (02 §7.1 п. 5)
  const wa = workingAcc();
  const verify = partner && !minor && !verifiedAcc() ? `<button class="cr-verify" data-cr="open:verify">${I.shield}<span><b>${esc(np ? tx('hub_verify_np') : tx('hub_verify'))}</b>${wa ? `<small>${esc(wa.status === 'failed' ? tx('vf_fail_h') : tx('wl_pending', { h: wa.handle }))}</small>` : ''}</span>${I.chevron}</button>` : '';
  const how = (!partner || (P.league_unlocked === false && !minor)) ? `<ol class="cr-how">${[tx('how1'), tx('how2'), np ? tx('how3_np') : tx('how3')].map((t, i) => `<li><span>${i + 1}</span>${esc(t)}</li>`).join('')}</ol>` : '';
  let rows = '';
  const work = await workRows();   // «Задания» и «Мои вклады» (08 №11, №13) — у всех, вклады без денег
  if (guest) rows = work + row('open:rules', 'doc', tx('rules'), tx('rules_sub'));
  else if (minor) rows = work + row('add', 'plus', tx('add_minor')) + row('open:earn', 'star', tx('pro_days'), tx('pro_days_sub')) + row('open:rules', 'doc', tx('rules'), tx('rules_sub_np'));
  else if (!partner) rows = row('login', 'link', tx('hub_player'), tx('partner')) + row('open:mylink', 'gift', tx('my_link_p'), tx('gift_sub')) + work + row('add', 'plus', tx('add_minor')) + row('open:rules', 'doc', tx('rules'), tx('rules_sub'));
  else {
    const vids = await api().listMyVideos(), rev = vids.filter((v) => ['submitted', 'in_review', 'pending_review'].includes(v.status)).length;
    rows = (np ? row('open:earn', 'star', tx('pro_days'), tx('pro_days_sub')) : row('open:earn', 'wallet', tx('my_earn'), tx('my_earn_sub')))
      + row('open:myvideos', 'video', tx('my_videos'), vids.length ? `${plural(vids.length, 'n_videos')}${rev ? `, ${rev} ${tx('n_on_review')}` : ''}` : '')
      + row('open:mylink', 'link', tx('my_link'), tx('code_sub', { c: P.ref_code }))
      + (isMod() || ['student', 'paused'].includes(P.mod?.stage) ? row('open:review', 'shield', tx('review'), tx('review_sub')) : row('open:review', 'shield', tx('review_how')))
      + work + row('add', 'plus', tx('add'))
      + row('open:rules', 'doc', tx('rules'), np ? tx('rules_sub_np') : tx('rules_sub'));
  }
  const me = guest ? '' : `<div class="cr-me"><span class="cr-av">${esc((P.nick || '?').charAt(0).toUpperCase())}</span><span class="m"><b>@${esc(P.nick)}</b><small>${esc(tx('code_sub', { c: P.ref_code }))}</small></span>${partner ? `<button class="cr-ib" data-cr="share-link" aria-label="${esc(tx('share'))}">${I.share}</button>` : ''}</div>`;
  return `<div class="cr-hub-h">${esc(tx('for_authors'))}</div>${me}${verify}${card}${how}${partner ? workLine() : ''}<div class="group">${rows}</div>`;
}
async function workRows() {
  const mine = isGuest() ? [] : await api().listMyContributions().catch(() => []);
  const acc = mine.filter((c) => c.status === 'accepted').length, rev = mine.filter((c) => c.status === 'in_review' || c.status === 'pending_review').length;
  return row('open:board', 'star', tx('hub_tasks'), tx('hub_tasks_sub')) + (isGuest() ? '' : row('open:contribs', 'doc', tx('hub_mine'), mine.length ? tx('hub_mine_sub', { a: acc, b: rev }) : tx('hub_mine_none')));
}
// Блок списка ожидания: заголовок и три строки (ставки из rules), плашка даты из rules.open_at, «Записаться» / «У меня есть приглашение».
// После открытия плашки нет, «Записаться» → «Стать партнёром» (08 §2.3). Записался — номер и дата; подтвердил канал — первая волна.
function waitlistHTML() {
  const game = ctx?.game?.() || 'gta6', banner = HERO[game]?.banners[0], w = P?.waitlist, open = isOpen();
  const lines = [tx('wl_l1', { r: money(R.rpm.tiktok), cap: money(R.rpm_cap_cents), min: money(R.rpm_min_cents), rs: money(R.rpm.shorts) }),
    tx('wl_l2', { p: R.share_pct, m: R.author_fee_months || 12 }), tx('wl_l3')];
  const top = `<div class="cr-hero cr-wl-top">${picture(banner, 'cr-hero-ph')}<span class="cr-hero-in glass-plate"><b>${esc(tx('wl_title'))}</b></span></div>`;
  const list = `<ul class="cr-wl-l">${lines.map((t, i) => `<li>${[I.eye, I.link, I.check][i]}<span>${esc(t)}</span></li>`).join('')}</ul>`;
  const plate = open ? '' : `<div class="cr-note cr-plate">${I.clock}<span>${esc(tx('wl_plate', { d: dfmt(R.open_at) }))}</span></div>`;
  const acc = workingAcc(), ver = w?.status === 'verified' || !!verifiedAcc();
  let st = '';
  if (open) st = `<button class="btn-primary" data-cr="login">${esc(tx('wl_partner'))}</button>`;
  else if (!w) st = `<button class="btn-primary" data-cr="wl-join">${esc(tx('wl_join'))}</button><button class="btn-ghost" data-cr="inv-beta">${esc(tx('wl_have'))}</button>`;
  else {
    st = `<div class="cr-wl-me"><b>${esc(tx('wl_joined', { n: num(w.no) }))}</b><span>${esc(tx('wl_joined_p'))}</span><small>${esc(tx('wl_since', { d: dfmt(w.joined_at) }))}</small></div>`
      + (ver ? `<div class="cr-note ok">${I.check}<span>${esc(tx('wl_verified'))}</span></div>`
        : acc ? `<button class="cr-verify" data-cr="open:verify">${I.shield}<span><b>${esc(acc.status === 'failed' ? tx('vf_fail_h') : tx('vf_pending_h'))}</b><small>${esc(acc.status === 'failed' ? tx('vf_fail_p', { h: acc.handle, c: acc.verify_code }) : tx('wl_pending', { h: acc.handle }))}</small></span>${I.chevron}</button>`
        : `<div class="cr-note">${I.shield}<span>${esc(tx('wl_early'))}</span></div><button class="btn-primary" data-cr="open:verify">${esc(tx('wl_verify'))}</button>`)
      + `<button class="btn-ghost" data-cr="inv-beta">${esc(tx('wl_have'))}</button>`;
  }
  return `<div class="cr-wl">${top}${list}${plate}<div class="cr-wl-act">${st}</div></div>`;
}
// Пробный доступ 72 часа (файл 31, решение №14), пока человек не стал партнёром: Лиги, «Моего заработка» и «Моей ссылки» нет;
// «Стать партнёром» есть — партнёрство бесплатное по закону (FTC, 16 CFR 437); правила — без слов о деньгах.
// Стал партнёром — обычный хаб партнёра (Лига, ролики, заработок) и рабочий Pro 14 дней.
async function trialHub() {
  const rows = `<div class="group">${row('login', 'link', tx('hub_player'), tx('partner'))}`
    + await workRows() + row('add', 'plus', tx('add_minor')) + row('open:rules', 'doc', tx('rules'), tx('rules_sub_np')) + '</div>';
  return `<div class="cr-hub-h">${esc(tx('for_authors'))}</div><div class="cr-trial"><span class="row-ic">${I.clock}</span><span><b>${esc(tx('trial_t'))}</b><small>${esc(tx('trial_p'))}</small></span></div>${rows}`;
}
export async function renderHub(el) {
  try { hubCache = await hubHTML(); } catch { hubCache = ''; }
  const box = el || document.getElementById('cr-hub');
  if (box) { box.innerHTML = hubCache; box.hidden = !hubCache; }
  return hubCache;
}

// ───────── слой и стопка экранов ─────────
const stack = [];
// без приглашения денежные экраны не открываются: вместо них — список ожидания в том же месте (08 §7, задача 2)
const GATED = new Set(['league', 'earn', 'myvideos', 'mylink', 'review', 'exam', 'payout']);
const screenOf = (id) => (GATED.has(id) && !hasAccess() ? SCREENS.authors : SCREENS[id]);
function layer() {
  let el = document.getElementById('cr');
  if (!el) { el = document.createElement('div'); el.id = 'cr'; el.hidden = true; document.body.insertBefore(el, document.getElementById('sheet-layer')); }
  return el;
}
async function push(id, args = {}, replace = false) {
  await load();
  const el = layer();
  el.scrollTop = 0;
  const scr = document.createElement('section');
  scr.className = 'cr-scr'; scr.dataset.s = id;
  scr.innerHTML = await screenOf(id).html(args);
  const first = el.hidden;
  if (first) { el.hidden = false; el.classList.remove('out'); requestAnimationFrame(() => el.classList.add('on')); }
  const prev = stack[stack.length - 1];
  if (replace && prev) { prev.el.remove(); stack.pop(); }
  else if (prev && !first) { prev.el.classList.add('under'); scr.classList.add('in'); requestAnimationFrame(() => requestAnimationFrame(() => scr.classList.remove('in'))); }
  el.appendChild(scr);
  stack.push({ id, args, el: scr });
  screenOf(id).bind?.(scr, args);
  ctx?.haptic?.();
}
function pop() {
  const top = stack.pop(); if (!top) return;
  if (!stack.length) { close(top); return; }
  stack[stack.length - 1].el.classList.remove('under');
  top.el.classList.add('in'); stopPlayers(top.el);
  setTimeout(() => top.el.remove(), 320);
}
function close(top) {
  const el = layer();
  el.classList.remove('on'); el.classList.add('out');
  stack.splice(0).forEach((s) => stopPlayers(s.el));
  setTimeout(() => { if (!el.classList.contains('on')) { el.hidden = true; el.classList.remove('out'); el.innerHTML = ''; } }, 300);
  if (top) stopPlayers(top.el);
  renderHub();
}
async function rerender() {
  const top = stack[stack.length - 1]; if (!top) return;
  const y = top.el.querySelector('.cr-body')?.scrollTop || 0;
  top.el.innerHTML = await screenOf(top.id).html(top.args);
  screenOf(top.id).bind?.(top.el, top.args);
  const b = top.el.querySelector('.cr-body'); if (b) b.scrollTop = y;
}
const head = (title, opts = {}) => `<header class="cr-hd${opts.big ? ' big' : ''}">${opts.noBack ? '' : `<button class="cr-ib" data-cr="back" aria-label="${esc(tx('back'))}">${I.back}</button>`}<h1>${esc(title)}</h1>${opts.close ? `<button class="cr-ib" data-cr="close" aria-label="${esc(tx('close'))}">${I.close}</button>` : ''}</header>`;
// rates = true: на экране ставки и правила, а не начисления — в beta без «предварительные» (в demo пометка есть всегда)
const body = (html, cls = '', rates = false) => `<div class="cr-body${cls ? ' ' + cls : ''}">${html}${modeNote(html, rates)}</div>`;

// ───────── Лига ─────────
function ratesHTML() {
  const r = (c) => money(c);
  const line = (k) => tx('r_line', { r: r(R.rpm[k]), cap: r(R.rpm_cap_cents), min: r(R.rpm_min_cents) });
  return `<h2 class="cr-h">${esc(tx('rates_h'))}</h2><div class="cr-rates">
    <div><b>${esc(tx('r_main'))}</b><span>${esc(line('tiktok'))}</span></div><div><b>${esc(tx('r_shorts'))}</b><span>${esc(line('shorts'))}</span></div>
    <div><b>${esc(tx('r_ex'))}</b><span class="cr-num">${r(R.rpm_example.cents)}</span></div></div>
    <p class="cr-p">${esc(tx('r_note'))} ${esc(tx('r_main_earn'))}</p>${med()}`;
}
// экран 16 «Лига», вкладка «Задания»: closed — прогресс к 10 000 и код приглашения; tasks — задания Лиги с фиксированной оплатой
// (карточки доски заданий, раздел В). Ролик по заданию подаётся из карточки и связывается с заданием (submitVideo task_id)
async function tasksHTML() {
  const [lg, all, vids] = await Promise.all([api().getLeague(), api().getTasks({ world: ctx?.game?.() || 'gta6' }), api().listMyVideos().catch(() => [])]);
  const tasks = all.filter((t) => t.section === 'league'); board = { tasks, vids, world: ctx?.game?.() || 'gta6' };
  await placesOf(vids);
  const np = noPay() || isMinor();
  if (!lg.unlocked) {
    const pr = lg.progress || { views: 0, goal: R.league_goal_views };
    return `<div class="cr-lgc" data-st="closed"><p class="cr-lead">${esc(tx('lg_closed', { g: num(pr.goal), n: num(pr.views) }))}</p>${bar(pr.views / pr.goal * 100)}<span class="cr-prog">${esc(tx('of', { a: num(pr.views), b: num(pr.goal) }))}</span></div>
      <div class="cr-two"><button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button><button class="btn-ghost" data-cr="invite">${esc(tx('invite'))}</button></div>
      <h2 class="cr-h">${esc(tx('lg_tasks_h'))}</h2><p class="cr-p">${esc(tx(np ? 'lg_closed_tasks_np' : 'lg_closed_tasks'))}</p><div class="cr-tasks">${tasks.map(taskCard).join('')}</div>`;
  }
  return `<div data-st="tasks"><h2 class="cr-h">${esc(tx('lg_tasks_h'))}</h2><p class="cr-p">${esc(tx(np ? 'lg_tasks_p_np' : 'lg_tasks_p'))}</p></div>
    ${tasks.length ? `<div class="cr-tasks">${tasks.map(taskCard).join('')}</div>` : `<div class="cr-empty">${I.star}<b>${esc(tx('lg_none'))}</b></div>`}`;
}
async function leagueTab(tab) {
  if (isMinor()) return `<div class="cr-note">${I.lock}<span>${esc(tx('lock_minor'))}</span></div>${tab === 'videos' ? await videosGrid() : await tasksHTML().then((h) => h.replace(/<button class="cr-mini acc"[^>]*>[\s\S]*?<\/button>/g, ''))}`;
  if (tab === 'videos') return videosGrid();
  if (tab === 'earn') return earnBody(true);
  if (tab === 'rating') return `<div class="cr-empty">${I.chart}<b>${esc(tx('rating_empty'))}</b><p>${esc(dfmt(R.first_round))}</p></div><p class="cr-p">${esc(tx('rating_note'))}</p>`;
  const open = !!P.league_unlocked;
  return `${await tasksHTML()}${noPay() ? `<div class="cr-note">${I.star}<span>${esc(tx('np_tasks'))}</span></div>` : ratesHTML()}
    ${open ? `<div class="cr-two"><button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button><button class="btn-ghost" data-cr="open:mylink">${esc(tx('my_link'))}</button></div>` : `<button class="btn-ghost" data-cr="open:mylink">${esc(tx('my_link'))}</button>`}`;
}
async function videosGrid(filter = 'all') {
  const vids = await api().listLeagueVideos(); await placesOf(vids);
  return `<div class="cr-seg" role="tablist">${['all', 'mine'].map((k) => `<button role="tab" data-cr="vf" data-v="${k}" aria-selected="${k === filter}">${esc(tx(k === 'all' ? 'v_all' : 'v_mine'))}</button>`).join('')}</div>
    <div class="cr-grid">${vids.map((v, i) => `<button class="cr-th" data-cr="feed-league" data-i="${i}" data-mine="${v.mine ? 1 : 0}"${filter === 'mine' && !v.mine ? ' hidden' : ''} aria-label="${esc(L(v.title))}">
      <img src="${esc(pImg(v.place))}" alt="" loading="lazy"><span class="pl">${esc(PLAT[v.platform])}</span><span class="vw">${I.play}${num(v.views)}</span></button>`).join('')}</div>
    <p class="cr-p">${esc(tx('v_note'))}</p>`;
}
const LTABS = ['tasks', 'videos', 'earn', 'rating'];

// ───────── «Мой заработок» ─────────
const GRP = { share: 'code', rpm: 'views', task: 'other', pair: 'other', cpa: 'other', author_fee: 'other', queue_batch: 'other' };
const monthName = (m) => (lang() === 'en' ? MON.en : ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'])[+String(m).slice(5, 7) - 1] || '';
function dayBars(days, keys, ymax, label, fmt, Lp = 40) {
  const W = 343, H = 172, Rp = 4, T = 10, B = 24, n = days.length, pw = (W - Lp - Rp) / n, bw = Math.max(2, pw - 2.4), y = (v) => T + (H - T - B) * (1 - v / ymax);
  const ticks = [0, ymax / 2, ymax];
  const grid = ticks.map((t) => `<line x1="${Lp}" x2="${W - Rp}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" class="g"/><text x="${Lp - 6}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end" class="ax">${fmt(t)}</text>`).join('');
  const xl = [0, 7, 14, 21, n - 1].filter((i, k, a) => i < n && a.indexOf(i) === k && (i === n - 1 || i <= n - 4)).map((i) => `<text x="${(Lp + (i + 0.5) * pw).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ax">${+days[i].date.slice(8)}</text>`).join('');
  const bars = days.map((o, i) => {
    let acc = 0;
    const segs = keys.map((k) => { const v = o[k] || 0; if (!v) return ''; const y1 = y(acc + v), y0 = y(acc); acc += v; return `<rect x="${(Lp + i * pw + 1.2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1.5, y0 - y1 - 1).toFixed(1)}" rx="1.6" class="s-${k}"/>`; }).join('');
    return `<g class="d" data-i="${i}">${segs}<rect x="${(Lp + i * pw).toFixed(1)}" y="${T}" width="${pw.toFixed(1)}" height="${H - T - B}" class="hit"/></g>`;
  }).join('');
  return `<svg class="cr-chart" viewBox="0 0 ${W} ${H}" data-l="${Lp}" data-n="${n}" role="img" aria-label="${esc(label)}">${grid}<line x1="${Lp}" x2="${W - Rp}" y1="${y(0)}" y2="${y(0)}" class="b"/>${bars}${xl}</svg>`;
}
function niceMax(v) { if (v <= 0) return 100; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
function monthDays(month) { const [y, m] = month.split('-').map(Number); const n = new Date(y, m, 0).getDate(); return Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`); }
async function proDaysBody() {
  const e = await api().getEarnings();
  const why = { friend: tx('pd_friend'), contrib: tx('pd_contrib'), video: tx('pd_video') };
  return `<div class="cr-big"><b>${esc(tx('pd_total', { n: num(e.pro_days_total) }))}</b><span>${esc(isMinor() ? tx('pd_sub_minor') : tx('pd_sub_np'))}</span></div>
    <div class="cr-ledger">${e.pro_days.map((x) => `<div><span class="d">${esc(dfmt(x.date))}</span><b>${esc(why[x.note] || '')}</b><span class="v">+${x.days}</span></div>`).join('')}</div>
    <p class="cr-p">${esc(tx('pd_note'))}</p>`;
}
async function earnBody(inLeague = false) {
  if (!moneyOK()) return proDaysBody();
  const [e, vids] = await Promise.all([api().getEarnings(), api().listMyVideos()]);
  await placesOf(vids);
  // состояния экрана 9 (02 §9): empty, hold, below, paying, paid, minor / nopay (дни Pro), beta (предварительные суммы — med() и подпись)
  if (!e.ledger.length) return `<div class="cr-empty" data-st="empty">${I.wallet}<b>${esc(tx('earn_empty'))}</b><p>${esc(tx('earn_empty_p'))}</p>${med()}<button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button></div>`;
  const T = e.totals, game = ctx?.game?.() || 'gta6';
  const days = monthDays(e.month).map((date) => { const o = { date, code: 0, views: 0, other: 0, items: [] }; e.ledger.filter((x) => x.date === date).forEach((x) => { o[GRP[x.reason] || 'other'] += x.amount_cents; o.items.push(x); }); return o; });
  const ymax = niceMax(Math.max(...days.map((o) => o.code + o.views + o.other)));
  const dayText = (o) => {
    const s = o.code + o.views + o.other;
    if (!s) return `<b>${esc(dfmt(o.date))}</b>: ${esc(tx('no_acc'))}`;
    return `<b>${esc(dfmt(o.date))}, ${money2(s)}</b>: ${[o.code ? `${tx('leg_code').toLowerCase()} ${money2(o.code)}` : '', o.views ? `${tx('leg_views').toLowerCase()} ${money2(o.views)}` : '', o.other ? `${tx('leg_other').toLowerCase()} ${money2(o.other)}` : ''].filter(Boolean).map(esc).join(', ')}`;
  };
  const by = (r) => e.ledger.filter((x) => x.reason === r), sum = (a) => a.reduce((s, x) => s + x.amount_cents, 0);
  const stOf = (a) => { const st = [...new Set(a.map((x) => x.status))]; return st.map((s) => tx('st_' + s)).join(', '); };
  const SRC = [['share', 'code', tx('rs_share', { c: P.ref_code }), tx('rs_share_d', { n: by('share').length })], ['rpm', 'views', tx('rs_rpm'), tx('rs_rpm_d')],
    ['cpa', 'other', tx('rs_cpa'), tx('rs_cpa_d')], ['task', 'other', tx('rs_task'), tx('rs_task_d')], ['pair', 'other', tx('rs_pair'), tx('rs_pair_d')], ['author_fee', 'other', tx('rs_author'), tx('rs_author_d')], ['queue_batch', 'other', tx('rs_queue'), tx('rs_queue_d')]]
    .map(([r, k, t, d]) => ({ r, k, t, d, c: sum(by(r)), st: stOf(by(r)) })).filter((x) => x.c);
  const totalAll = SRC.reduce((a, x) => a + x.c, 0) || 1;
  const buys = ['year', 'pass', 'month'].map((k) => { const l = by('share').filter((x) => x.plan === k); return { k, n: l.length, c: l[0]?.amount_cents || 0 }; }).filter((x) => x.n);
  const pays = e.funnel.pays, earned = T.total;
  // путь зрителя за месяц: просмотры → переходы → пробный → покупки (02 §9 п. 5; demo 653 140 → 922 → 322 → 28)
  const fun = [[tx('f_views'), num(e.funnel.views), ''], [tx('f_clicks'), num(e.funnel.clicks), tx('f_of', { p: pct(e.funnel.clicks, e.funnel.views) })],
    [tx('f_trials'), num(e.funnel.trials), tx('f_of', { p: pct(e.funnel.trials, e.funnel.clicks) })],
    [tx('f_pays'), num(pays), tx('f_of', { p: pct(pays, e.funnel.trials) })], [tx('f_earned'), money2(earned), '']];
  const own = vids.filter((v) => v.views || v.earned.total_cents);
  const payout = e.payout;
  const stE = payout?.status === 'paid' ? 'paid' : payout?.status === 'failed' ? 'failed' : payout ? 'paying' : T.available >= R.payout_min_cents ? 'ready' : T.available > 0 ? 'below' : 'hold';
  const btn = stE === 'paid' ? `<div class="cr-note ok">${I.check}<span>${esc(tx('e_paid', { s: money2(payout.amount_cents), d: dfmt(payout.paid_at || payout.round_date) }))}</span></div>`
    : stE === 'paying' ? `<div class="cr-note ok">${I.clock}<span>${esc(tx('wd_status'))}, ${money2(payout.amount_cents)}. ${esc(tx('wd_ok_3', { d: dfmt(payout.round_date) }))}</span></div>`
    : stE === 'failed' ? `<button class="cr-verify" data-cr="open:payout">${I.alert}<span><b>${esc(tx('wd_failed', { p: R.payout_provider }))}</b></span>${I.chevron}</button>`
    : stE === 'ready' ? `<button class="btn-primary" data-cr="open:payout">${I.wallet}${esc(tx('withdraw', { s: money2(T.available) }))}</button>`
    : `<div class="cr-wd">${bar(T.available / R.payout_min_cents * 100)}<span>${esc(stE === 'below' ? tx('e_below', { s: money2(T.available), min: money(R.payout_min_cents) }) : tx('e_hold'))}</span></div><button class="btn-ghost" data-cr="open:payout">${I.wallet}${esc(tx('wd_title'))}</button>`;
  const frozen = (e.frozen_videos || []).map((id) => `<div class="cr-note no">${I.clock}<span>${esc(tx('e_frozen', { id }))}</span></div>`).join('');
  const rows = days.filter((o) => o.code + o.views + o.other).reverse();
  const dayParts = (o) => {
    const c = (r) => o.items.filter((x) => x.reason === r).length, parts = [];
    if (c('share')) parts.push(plural(c('share'), 'd_share'));
    if (c('rpm')) parts.push(tx('d_rpm')); if (c('task')) parts.push(tx('d_task')); if (c('pair')) parts.push(tx('d_pair')); if (c('cpa')) parts.push(tx('d_cpa')); if (c('author_fee')) parts.push(tx('d_author')); if (c('queue_batch')) parts.push(tx('d_queue'));
    const s = parts.join(', '); return s.charAt(0).toUpperCase() + s.slice(1);
  };
  return `<div class="cr-money" data-st="${stE}">${picture(HERO[game]?.banners[1] || HERO[game]?.banners[0], 'cr-money-ph')}<div class="cr-money-in glass-plate">
      <b class="cr-money-v">${money2(T.total)}</b><span class="cr-money-s">${esc(tx(mode() === 'beta' ? 'for_month_pre' : 'for_month', { m: monthName(e.month) }))}</span>
      ${med('on-photo')}
      <span class="cr-money-r">${I.clock}${esc(tx('round_in', { d: dfmt(e.round_date), n: plural(daysTo(e.round_date), 'n_days_x') }))}</span></div></div>
    <div class="cr-tri"><div><span>${esc(tx('accruing'))}</span><b>${money2(T.maturing)}</b></div><div class="hi"><span>${esc(stE === 'paying' ? tx('in_payout') : tx('available'))}</span><b>${money2(T.available)}</b></div><div><span>${esc(tx('paid'))}</span><b>${money2(T.paid)}</b></div></div>
    ${btn}${frozen}
    <h2 class="cr-h">${esc(tx('by_day'))}</h2>
    <div class="cr-box" data-days="${esc(JSON.stringify(days.map(dayText)))}">
      <div class="cr-leg"><span><i class="s-code"></i>${esc(tx('leg_code'))}</span><span><i class="s-views"></i>${esc(tx('leg_views'))}</span><span><i class="s-other"></i>${esc(tx('leg_other'))}</span></div>
      ${dayBars(days, ['code', 'views', 'other'], ymax, tx('by_day'), (t) => '$' + Math.round(t / 100))}
      <p class="cr-read">${esc(tx('tap_bar'))}</p></div>
    <h2 class="cr-h">${esc(tx('sources'))}</h2>
    <div class="cr-srcs">${SRC.map((x) => `<div class="cr-src"><div class="h"><b>${esc(x.t)}</b><span>${money2(x.c)}</span></div><span class="cr-sb"><i class="s-${x.k}" style="width:${Math.max(1.5, x.c / totalAll * 100).toFixed(1)}%"></i></span><small>${esc(x.d)}. <em>${esc(x.st)}</em></small></div>`).join('')}</div>
    <p class="cr-p">${esc(tx('r_main_earn'))}</p>
    ${buys.length ? `<h2 class="cr-h">${esc(tx('buys_h'))}</h2><div class="cr-ledger">${buys.map((x) => `<div><b>${esc(tx('buy_' + x.k, { p: money2(x.c) }))}<small>${esc(plural(x.n, x.k === 'month' ? 'n_pays' : 'n_buys'))}</small></b><span class="v">${money2(x.n * x.c)}</span></div>`).join('')}</div>
    <p class="cr-p">${esc(tx('buys_note'))}</p>${workLine()}` : ''}
    <h2 class="cr-h">${esc(tx('funnel'))}</h2>
    <div class="cr-fun">${fun.map(([a, b, c], i) => `<div><span class="cr-k">${i + 1}</span><span class="t">${esc(a)}${c ? `<small>${esc(c)}</small>` : ''}</span><b>${b}</b></div>`).join('')}</div>
    ${own.length ? `<h2 class="cr-h">${esc(tx('per_video'))}</h2><div class="cr-vrows">${own.map((v) => `<button class="cr-vrow" data-cr="vstats" data-id="${esc(v.id)}">
      <img src="${esc(pImg(v.place))}" alt="" loading="lazy"><span class="m"><b>${esc(L(v.title))}</b><small>${esc(PLAT[v.platform])}, ${esc(pName(v.place))}</small>
      <span class="cr-chain">${[['c_views', v.views], ['c_clicks', v.clicks], ['c_pays', v.pays]].map(([k, n]) => `<span>${num(n)}<i>${esc(plural(n, k).slice(num(n).length + 1))}</i></span>`).join('')}<span class="acc">${money2(v.earned.total_cents)}<i>${esc(tx('c_earned'))}</i></span></span></span></button>`).join('')}</div>${med()}` : ''}
    <h2 class="cr-h">${esc(tx('days_list'))}</h2>
    <div class="cr-ledger cr-days">${rows.map((o, i) => `<div${i >= 5 ? ' hidden' : ''}><span class="d">${esc(dfmt(o.date))}</span><b>${esc(dayParts(o))}</b><span class="v">${money2(o.code + o.views + o.other)}</span></div>`).join('')}</div>
    ${rows.length > 5 ? `<button class="btn-ghost" data-cr="alldays" data-n="${rows.length}">${esc(tx('all_days', { n: rows.length }))}</button>` : ''}
    <p class="cr-p">${esc(tx('hold_note'))}</p>${inLeague ? '' : `<button class="btn-ghost" data-cr="open:rules">${esc(tx('rules'))}</button>`}`;
}
function bindChart(root) {
  $$('.cr-chart', root).forEach((svg) => {
    const box = svg.closest('.cr-box'), out = box?.querySelector('.cr-read'); if (!out) return;
    const rows = JSON.parse(box.dataset.days || '[]'), Lp = +svg.dataset.l, n = +svg.dataset.n;
    const pick = (i) => { $$('.d', svg).forEach((g) => g.classList.toggle('dim', +g.dataset.i !== i)); out.innerHTML = rows[i] || ''; };
    const at = (ev) => { const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width * 343; return Math.max(0, Math.min(n - 1, Math.floor((x - Lp) / ((343 - Lp - 4) / n)))); };
    let drag = false;
    svg.addEventListener('pointerdown', (ev) => { drag = true; pick(at(ev)); });
    svg.addEventListener('pointermove', (ev) => { if (drag) pick(at(ev)); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => svg.addEventListener(t, () => { drag = false; }));
  });
}

// ───────── экран 7 «Мои ролики» и карточка ролика: 8 статусов 02 §7.4 ─────────
const RJ = { no_code: 'rj_no_code', gameplay: 'rj_gameplay', not_place: 'rj_not_place', reused: 'rj_reused', no_disclosure: 'rj_no_disclosure', place_not_at_timecode: 'rj_place_not_at_timecode', unsafe: 'rj_unsafe' };
const rjText = (v) => tx(RJ[v.reject_code] || 'rj_not_place', { code: 'SB-' + v.id });
// строка статуса — тексты 02 §7.4: «Начисляется: 48 200 просмотров, $5,78», «Итог: 210 400 просмотров, $25,25 за просмотры, 9 покупок по ссылке»
function vdesc(v) {
  const st = vst(v.status), np = !moneyOK(), views = plural(v.views, 'c_views');
  const rpm = v.earned?.rpm_cents || 0;
  if (st === 'rejected') return tx('vd_rejected', { r: rjText(v) });
  if (st === 'awaiting_threshold') return tx(np ? 'vd_awaiting_np' : 'vd_awaiting_threshold', { n: num(v.views) });
  if (st === 'accruing') return np ? tx('vd_accruing_np', { v: views }) : tx('vd_accruing', { v: views, s: money2(rpm) });
  if (st === 'closed') return np ? tx('vd_closed_np', { v: views }) : tx('vd_closed', { v: views, s: money2(rpm), b: plural(v.pays, 'c_pays') });
  return tx('vd_' + st);
}
const VF = { all: () => true, review: (v) => ['submitted', 'in_review'].includes(vst(v.status)), acc: (v) => ['awaiting_threshold', 'accruing', 'frozen', 'closed'].includes(vst(v.status)), no: (v) => ['rejected', 'unavailable'].includes(vst(v.status)) };
async function myVideosHTML(filter = 'all') {
  const vids = await api().listMyVideos(); await placesOf(vids);
  if (!vids.length) return `<div class="cr-empty">${I.video}<b>${esc(tx('videos_empty'))}</b><p>${esc(tx('videos_empty_p'))}</p><button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button></div>`;
  const cnt = (k) => vids.filter(VF[k]).length;
  return `<div class="cr-seg cr-seg4" role="tablist">${[['all', 'vf_all'], ['review', 'vf_review'], ['acc', 'vf_acc'], ['no', 'vf_no']].map(([k, l]) => `<button role="tab" data-cr="mvf" data-v="${k}" aria-selected="${k === filter}">${esc(tx(l))}<em>${cnt(k)}</em></button>`).join('')}</div>
    <div class="cr-list">${vids.filter(VF[filter]).map((v) => `<button class="cr-li" data-cr="video" data-id="${esc(v.id)}" data-st="${esc(vst(v.status))}"><img src="${esc(pImg(v.place))}" alt="" loading="lazy">
      <span class="m"><b>${esc(L(v.title) || pName(v.place))}</b><small>${esc(PLAT[v.platform])}${L(v.title) ? `, ${esc(pName(v.place))}` : ''}${v.places.length > 1 ? ` +${v.places.length - 1}` : ''}</small>${stTag(v.status, v)}
      ${vst(v.status) === 'rejected' ? `<small class="no">${esc(rjText(v))}</small>` : v.views ? `<small>${esc(tx('views_n', { n: num(v.views) }))}${moneyOK() && v.earned.total_cents ? `, ${money2(v.earned.total_cents)}` : ''}</small>` : ''}</span>${I.chevron}</button>`).join('')}</div>
    ${moneyOK() ? med() : ''}<button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button>`;
}
// карточка ролика — шторка: статус, места с ролями и таймкодами, код и ссылка ролика, что делать дальше
async function videoSheet(id) {
  const v = (await api().listMyVideos()).find((x) => x.id === id); if (!v) return;
  await placesOf(v.places.map((x) => ({ place: x })));
  const st = vst(v.status), code = 'SB-' + v.id, l = link(P.ref_code, v.place.world, v.place.id, v.id);
  const cls = { accruing: 'ok', closed: 'ok', rejected: 'no', unavailable: 'no', frozen: 'no' }[st] || '';
  const icon = { accruing: I.chart, closed: I.check, rejected: I.alert, unavailable: I.info, frozen: I.clock }[st] || I.clock;
  const prog = { submitted: 0, in_review: 1, awaiting_threshold: 2 }[st];
  const places = `<h3 class="cr-h">${esc(tx('vc_places'))}</h3><div class="cr-ledger">${v.places.map((x) => `<div><b>${esc(pName(x))}<small>${esc(x.role === 'mention' ? tx('role_mention', { t: x.at || '' }) : tx('role_about'))}</small></b><span class="v"></span></div>`).join('')}</div>`;
  let btn = '';
  if (st === 'rejected') btn = `<button class="btn-primary" data-cr="submit" data-w="${esc(v.place.world)}" data-p="${esc(v.place.id)}">${esc(tx('vc_fix'))}</button><button class="btn-ghost" data-cr="open:rules">${esc(tx('rules'))}</button>`;
  else if (['accruing', 'closed', 'awaiting_threshold', 'frozen'].includes(st)) btn = `<button class="btn-primary" data-cr="vstats" data-id="${esc(v.id)}">${I.chart}${esc(tx('vc_stats'))}</button>${['accruing', 'closed'].includes(st) ? `<button class="btn-ghost" data-cr="feed-mine" data-id="${esc(v.id)}">${esc(tx('vc_feed'))}</button>` : ''}`;
  else btn = `<button class="btn-ghost" data-cr="sheet-close">${esc(tx(st === 'unavailable' ? 'ok' : 'done'))}</button>`;
  sheet(`<div class="cr-sh" data-st="${esc(st)}"><h2>${esc(L(v.title) || pName(v.place))}</h2><p class="sub">${esc(PLAT[v.platform])}, ${esc(dfmt(v.submitted_at))}</p>${stTag(v.status, v)}
    <div class="cr-note cr-vst ${cls}">${icon}<span>${esc(nb(vdesc(v)))}</span></div>
    ${v.has_gameplay && st !== 'rejected' ? `<div class="cr-note">${I.info}<span>${esc(tx('vc_gp'))}</span></div>` : ''}
    ${prog != null ? steps(prog, code) : ''}${places}
    ${field(tx('sv_ok_code'), code, code)}${field(tx('vstat_link'), l, 'https://' + l)}
    ${btn}</div>`);
}

// ───────── «Ролики об этом месте» — вертикальная лента ─────────
let feedList = [];
async function feedHTML(args) {
  let list = [];
  if (args.source === 'place') list = await api().listPlaceVideos(args.world, args.id);
  else if (args.source === 'league') list = await api().listLeagueVideos();
  else list = (await api().listMyVideos()).filter((v) => v.status === 'accruing' || v.status === 'closed').map((v) => ({ ...v, mine: true, author: '@' + P.nick }));
  if (args.mineOnly) list = list.filter((v) => v.mine);
  await placesOf(list.length ? list : [{ place: { world: args.world, id: args.id } }]);
  feedList = list;
  const tabs = args.source === 'place' && moneyOK() ? `<div class="cr-vtabs" role="tablist"><button role="tab" data-cr="feed-tab" data-v="place" aria-selected="${!args.mineOnly}">${esc(tx('feed_place'))}</button><button role="tab" data-cr="feed-tab" data-v="mine" aria-selected="${!!args.mineOnly}">${esc(tx('feed_mine'))}</button></div>` : '';
  if (!list.length) {
    const ref = { world: args.world, id: args.id };
    return `${head(tx('feed_place'))}${body(`<p class="cr-p">${pName(ref) ? esc(pName(ref)) + ', ' : ''}${esc(pCity(ref))}</p><div class="cr-empty">${I.video}<b>${esc(tx('feed_empty'))}</b><p>${esc(tx('feed_empty_p'))}</p><button class="btn-primary" data-cr="${isMinor() ? 'submit' : 'shoot'}" data-w="${esc(args.world)}" data-p="${esc(args.id)}">${I.camera}${esc(tx('shoot'))}</button></div>`)}`;
  }
  const myStats = {};
  if (moneyOK()) (await api().listMyVideos()).forEach((v) => { myStats[v.id] = v; });
  const reel = (v, i) => {
    const my = v.mine && moneyOK() ? myStats[v.id] : null, plays = !!v.embed;
    return `<section class="cr-reel" data-i="${i}" aria-label="${esc(L(v.title))}">
      <div class="cr-stage" data-cr="play" data-i="${i}"><img class="cr-poster" src="${esc(pImg(v.place, true))}" alt="" style="object-position:${[50, 30, 70, 40, 60][i % 5]}% 50%"${i > 1 ? ' loading="lazy"' : ''}><span class="cr-shade"></span>
        ${plays ? `<span class="cr-playbtn">${I.play}</span><span class="cr-pbar"><i></i></span>` : `<p class="cr-prev cr-solid">${esc(tx('preview_only'))}</p>`}</div>
      <div class="cr-side">
        <button class="cr-act${ctx?.isFav?.(placeKey({ kind: 'place', game: v.place.world, id: v.place.id })) ? ' on' : ''}" data-cr="vsave" data-w="${v.place.world}" data-p="${esc(v.place.id)}">${I.heart}<span>${esc(tx('save'))}</span></button>
        <button class="cr-act" data-cr="vshare" data-i="${i}">${I.share}<span>${esc(tx('share'))}</span></button>
        ${!isMinor() ? `<button class="cr-act" data-cr="shoot" data-w="${v.place.world}" data-p="${esc(v.place.id)}">${I.camera}<span>${esc(tx('shoot'))}</span></button>` : ''}
        ${my ? `<button class="cr-act on" data-cr="vstats" data-id="${esc(v.id)}">${I.chart}<span>${esc(tx('stats'))}</span></button>` : ''}
      </div>
      <div class="cr-info">
        <p class="cr-who"><b>${esc(v.author)}</b>${v.mine ? `<em>${esc(tx('your_video'))}</em>` : v.team ? `<em>${esc(tx('team'))}</em>` : ''}<span>${esc(PLAT[v.platform])}</span></p>
        <p class="cr-vt">${esc(L(v.title))}</p><p class="cr-views">${I.eye}${esc(tx('views_n', { n: num(v.views) }))}</p>
        ${my ? `<div class="cr-vearn cr-solid"><div class="h"><span>${esc(tx('earn_video'))}</span><b>${money(my.earned.total_cents)}</b></div>${med('on-photo')}${modeNote('$0')}<div class="f"><span><b>${num(my.views)}</b>${esc(tx('f_views'))}</span><span><b>${num(my.clicks)}</b>${esc(tx('f_clicks'))}</span><span><b>${num(my.pays)}</b>${esc(tx('f_pays'))}</span></div></div>` : ''}
        ${!my && mode() === 'demo' ? modeNote() : ''}<button class="cr-place cr-solid" data-cr="vplace" data-w="${v.place.world}" data-p="${esc(v.place.id)}"><img src="${esc(pImg(v.place))}" alt=""><span class="m"><b>${esc(pName(v.place))}</b><span>${esc(pCity(v.place))}</span></span>${I.chevron}</button>
      </div></section>`;
  };
  return `<div class="cr-feed" data-feed>${list.map(reel).join('')}</div>
    <div class="cr-vtop"><button class="cr-ib glass-chip" data-cr="back" aria-label="${esc(tx('back'))}">${I.back}</button>${tabs}<span class="cr-cnt glass-chip" data-cnt>${esc(tx('counter', { a: 1, b: list.length }))}</span></div>`;
}
let playTimer = 0;
function stopPlayers(root) {
  clearInterval(playTimer); playTimer = 0;
  $$('.cr-stage.playing', root || document).forEach((s) => { s.classList.remove('playing'); s.querySelector('iframe')?.remove(); });
}
function bindFeed(scr, args) {
  const f = scr.querySelector('[data-feed]'), c = scr.querySelector('[data-cnt]'); if (!f) return;
  const n = f.children.length;
  let last = 0;
  f.addEventListener('scroll', () => {
    const i = Math.min(n - 1, Math.round(f.scrollTop / f.clientHeight));
    if (i !== last) { last = i; if (c) c.textContent = tx('counter', { a: i + 1, b: n }); stopPlayers(scr); }
  }, { passive: true });
  if (args.start) requestAnimationFrame(() => { f.scrollTop = args.start * f.clientHeight; });
}
function play(stage, v) {
  const on = stage.classList.contains('playing');
  stopPlayers(stage.closest('.cr-scr'));
  if (on || !v.embed) return;
  stage.classList.add('playing');
  if (v.embed.id) {   // встроенный плеер площадки: наружу не уводим
    const src = v.embed.kind === 'tiktok' ? `https://www.tiktok.com/player/v1/${encodeURIComponent(v.embed.id)}?autoplay=1&rel=0` : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.embed.id)}?playsinline=1&autoplay=1&rel=0`;
    stage.insertAdjacentHTML('beforeend', `<iframe class="cr-frame" src="${src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${esc(PLAT[v.platform])}"></iframe>`);
    return;
  }
  // мок: роликов ещё нет — идёт полоса прогресса над превью и подпись «пример»
  const barEl = stage.querySelector('.cr-pbar i'); let p = 0;
  if (!stage.querySelector('.cr-sample')) stage.insertAdjacentHTML('beforeend', `<span class="cr-sample cr-solid">${esc(tx('example_play'))}</span>`);
  playTimer = setInterval(() => { p = (p + 0.6) % 100; if (barEl) barEl.style.transform = `scaleX(${p / 100})`; }, 60);
}
// ───────── экран 8 «Статистика ролика» (02 §9 п. 6): график просмотров, путь зрителя, покупки, расчёт строкой ─────────
const nb = (t) => String(t).replace(/(\d) (\d)/g, '$1 $2');   // число не рвётся на строки: «412 300»
async function vstatsHTML(a) {
  const [s, v] = await Promise.all([api().getVideoStats(a.id), api().listMyVideos().then((x) => x.find((y) => y.id === a.id))]);
  await placesOf(v.places.map((x) => ({ place: x })));
  const st = vst(s.status), mOK = moneyOK(), l = link(P.ref_code, v.place.world, v.place.id, v.id);
  const days = s.views_by_day.map((o) => ({ date: o.date, views: o.views }));
  const ymax = niceMax(Math.max(1, ...days.map((o) => o.views)));
  const read = days.map((o) => `<b>${esc(dfmt(o.date))}</b>: ${esc(tx('views_n', { n: num(o.views) }))}`);
  // расчёт оплаты просмотров строкой — числа этого ролика: «48 200 × $0,12 / 1 000 = $5,78»
  const line = tx('vt_calc', { v: num(s.views), r: money(s.rate_cents), s: money2(s.rpm.calc_cents) });
  const calc = { ok: [line, tx('vt_calc_note')], min: [line, tx('vt_min', { min: money(R.rpm_min_cents) })], cap: [line, tx('vt_cap', { cap: money(R.rpm_cap_cents) })],
    wait: [tx('vt_wait', { a: num(s.views), b: num(THRESHOLD) }), ''], gameplay: [tx('vt_gp'), ''], no_rpm: [tx('vt_snap'), ''] }[s.rpm.rule] || [line, ''];
  const per = s.views ? (s.clicks / s.views * 1000).toFixed(1).replace('.', lang() === 'en' ? '.' : ',') : '0';
  const buys = ['year', 'pass', 'month'].filter((k) => s.buys[k]).map((k) => `<div><b>${esc(tx('buy_' + k, { p: money2(s.share_cents_each[k]) }))}<small>${esc(plural(s.buys[k], k === 'month' ? 'n_pays' : 'n_buys'))}</small></b><span class="v">${money2(s.buys[k] * s.share_cents_each[k])}</span></div>`).join('');
  const fun = [[tx('f_views'), num(s.views), ''], [tx('f_clicks'), num(s.clicks), tx('f_of', { p: pct(s.clicks, s.views) })], [tx('f_trials'), num(s.trials), tx('f_of', { p: pct(s.trials, s.clicks) })], [tx('f_pays'), num(s.pays), tx('f_of', { p: pct(s.pays, s.trials) })]];
  return `<div class="cr-vhead" data-st="${esc(st)}"><img src="${esc(pImg(v.place))}" alt=""><span class="m"><b>${esc(L(v.title) || pName(v.place))}</b><small>${esc(PLAT[v.platform])}, ${esc(pName(v.place))}${v.places.length > 1 ? ` +${v.places.length - 1}` : ''}, ${esc(tx('s_since', { d: dfmt(v.submitted_at) }))}</small>${stTag(v.status, v)}</span></div>
    ${st === 'frozen' ? `<div class="cr-note no">${I.clock}<span>${esc(tx('vt_frozen'))}</span></div>` : ''}
    ${mOK ? `<div class="cr-sbig"><span>${esc(tx('vt_total'))}</span><b>${money2(s.earned.share_cents + s.earned.rpm_cents)}</b></div>${med()}
    <div class="cr-ledger"><div><b>${esc(tx('s_share'))}<small>${esc(plural(s.pays, 'd_share'))}, ${esc(tx('ru_hold_v'))}</small></b><span class="v">${money2(s.earned.share_cents)}</span></div>
      <div><b>${esc(tx('s_rpm'))}<small>${esc(tx('views_n', { n: num(s.views) }))}</small></b><span class="v">${money2(s.earned.rpm_cents)}</span></div></div>
    <h2 class="cr-h">${esc(tx('vt_calc_h'))}</h2><div class="cr-calc"><b>${esc(nb(calc[0]))}</b>${calc[1] ? `<small>${esc(calc[1])}</small>` : ''}</div>` : ''}
    ${days.length ? `<h2 class="cr-h">${esc(tx('vstat_by_day'))}</h2><div class="cr-box" data-days="${esc(JSON.stringify(read))}">${dayBars(days, ['views'], ymax, tx('vstat_by_day'), (t) => (t >= 1000 ? Math.round(t / 1000) + (lang() === 'en' ? 'k' : ' тыс') : String(t)), 56)}<p class="cr-read">${esc(tx('vstat_tap'))}</p></div>` : ''}
    <h2 class="cr-h">${esc(tx('funnel'))}</h2>
    <div class="cr-fun">${fun.map(([x, y, z], i) => `<div><span class="cr-k">${i + 1}</span><span class="t">${esc(x)}${z ? `<small>${esc(z)}</small>` : ''}</span><b>${y}</b></div>`).join('')}</div>
    ${s.views ? `<p class="cr-p">${esc(tx('vt_per', { n: per }))}</p>` : ''}
    ${s.views >= THRESHOLD && s.clicks / s.views * 1000 < 1 ? `<div class="cr-note">${I.info}<span>${esc(tx('vt_low'))}</span></div>` : ''}
    ${mOK ? `<h2 class="cr-h">${esc(tx('vt_buys_h'))}</h2>${buys ? `<div class="cr-ledger">${buys}</div>` : `<p class="cr-p">${esc(tx('vt_buys_none'))}</p>`}` : ''}
    ${field(tx('vstat_link'), l, 'https://' + l, tx('vstat_link_note'))}`;
}

// ───────── «Моя ссылка и код» ─────────
async function mylinkHTML() {
  const np = noPay() || !isPartner(), l = link(P.ref_code);
  if (!isPartner()) return `${head(tx('my_link_p'))}${body(`<div class="cr-code"><span>${esc(tx('ml_code'))}</span><b>${esc(P.ref_code || '')}</b></div>${field(tx('ml_link'), l, 'https://' + l)}
    <button class="btn-primary" data-cr="share-link">${I.share}${esc(tx('share'))}</button><div class="cr-note">${I.gift}<span>${esc(tx('ml_gift_np'))}</span></div><p class="cr-p">${esc(tx('pd_note'))}</p>
    ${isMinor() ? '' : `<h2 class="cr-h">${esc(tx('hub_player'))}</h2><p class="cr-p">${esc(tx('partner'))}</p><button class="btn-ghost" data-cr="login">${esc(tx('hub_player'))}</button>`}`)}`;
  const acc = (P.accounts || []).map((a) => `<div><b>${esc(PLAT[a.platform])}</b><span class="v">${tag({ verified: 'ok', pending: 'wait', none: '', soon: '' }[a.status], tx('acc_' + a.status))}</span></div>`).join('');
  return `${head(tx('my_link'))}${body(`<div class="cr-code"><span>${esc(tx('ml_code'))}</span><b>${esc(P.ref_code)}</b></div>
    ${field(tx('ml_link'), l, 'https://' + l)}
    <button class="btn-primary" data-cr="share-link">${I.share}${esc(tx('share'))}</button>
    <div class="cr-note">${I.gift}<span>${esc(np ? tx('ml_gift_np') : tx('ml_gift'))}</span></div>
    ${np ? '' : `<p class="cr-p">${esc(tx('ml_cpa'))}</p>${med()}`}
    <div class="cr-note">${I.star}<span>${esc(tx('ml_pro'))}</span></div>
    <h2 class="cr-h">${esc(tx('ml_acc_h'))}</h2><p class="cr-p">${esc(tx('ml_acc_p', { c: 'SB-' + P.ref_code }))}</p>
    <div class="cr-ledger">${acc}</div>`)}`;
}

// ───────── экраны 14 «Экзамен модератора» и 15 «Проверка» (02 §10): одна лента карточек «как в Тиндере» — смахнуть вправо «Подходит»,
// влево «Не подходит» → причина. Решение быстрее 2 с не засчитывается: карточка возвращается с подсказкой (сервер тоже не засчитывает ms < 2000).
// Ловушки ничем не отличаются: точность считает сервер по ним (скользящие 50), экран показывает только итог ─────────
let queue = [], qi = 0, shownAt = 0, pendMs = 0, deckMode = 'queue', MS = null, exam = null;
const MIN_MS = () => R?.mod_min_ms || 2000;
const secs = () => String(MIN_MS() / 1000).replace('.', lang() === 'en' ? '.' : ',');
const RR = { video: ['rr_no_code', 'rr_not_at', 'rr_no_disc', 'rr_not_place', 'rr_reused', 'rr_unsafe'], place: ['rr_p4', 'rr_no_src', 'rr_dup', 'rr_p2', 'rr_p1'],
  photo: ['rr_p1', 'rr_p2', 'rr_p3', 'rr_p4', 'rr_license', 'rr_p5'] };
const noMoney = () => noPay() || isMinor() || !isPartner();
const deckBtns = (hide) => `<p class="cr-hint"${hide ? ' hidden' : ''}>${esc(tx('rv_hint'))}</p><p class="cr-fast" role="status" hidden>${I.clock}<span>${esc(tx('ex_fast', { s: secs() }))}</span></p>
    <div class="cr-rvbtns"${hide ? ' hidden' : ''}><button class="cr-rb no" data-cr="rv" data-v="no" aria-label="${esc(tx('rv_no'))}">${I.close}<span>${esc(tx('rv_no'))}</span></button><button class="cr-rb ok" data-cr="rv" data-v="ok" aria-label="${esc(tx('rv_ok'))}">${I.check}<span>${esc(tx('rv_ok'))}</span></button></div>`;
const deckBody = (top, hide) => { const inner = `${top}<div class="cr-deck" data-deck data-st="${deckState()}">${deckCards()}</div>${deckBtns(hide)}`; return `<div class="cr-body cr-rv">${inner}${modeNote(inner)}</div>`; };
async function reviewHTML() {
  MS = await api().getModStatus(); deckMode = 'queue';
  const st = MS.stage;
  if (st === 'none' || st === 'exam' || st === 'cooldown') {
    // путь: 5 принятых вкладов или приглашение модератора → экзамен → 20 проверок ученика (02 §10.1)
    const ready = st !== 'none', n = MS.accepted, need = MS.need;
    const btn = ready ? `<button class="btn-primary" data-cr="open:exam">${I.shield}${esc(tx('ex_take'))}</button>` : `<button class="btn-primary" data-cr="add">${I.plus}${esc(tx('add_minor'))}</button>`;
    return `${head(tx('review_how'))}${body(`<p class="cr-lead" data-st="${ready ? st : 'how'}">${esc(tx('mod_how') + (noMoney() ? '' : tx('mod_how_pay')))}</p>
      <div class="cr-lad2"><div class="on"><b>${esc(ready ? tx('mod_ready', { n }) : tx('mod_now2', { n, need }))}</b>${bar(Math.min(1, n / need) * 100)}</div>
        <div class="${ready ? 'on' : ''}"><b>${esc(tx('ex_h'))}: ${esc(tx('ex_lead', { t: R.mod_exam_total, n: R.mod_exam_need }))}</b></div><div><b>${esc(tx('mod_student', { n: R.mod_student_n, a: R.mod_min_accuracy }))}</b></div></div>
      ${btn}<button class="btn-ghost" data-cr="open:board">${esc(tx('hub_tasks'))}</button>`)}`;
  }
  if (st === 'paused') {
    const stu = MS.student && MS.student.done >= MS.student.need;
    return `${head(tx('review'))}${body(`<div class="cr-empty" data-st="paused">${I.clock}<b>${esc(tx('rv_paused_h', { a: MS.min_accuracy }))}</b>
      <p>${esc(stu ? tx('rv_paused_st', { a: MS.min_accuracy }) : tx('rv_paused_p', { w: R.mod_window, x: MS.accuracy }))}</p>
      <button class="btn-primary" data-cr="open:exam">${esc(tx('ex_again'))}</button><button class="btn-ghost" data-cr="open:board">${esc(tx('hub_tasks'))}</button></div>`)}`;
  }
  queue = await api().getReviewQueue().catch(() => []); qi = 0;
  await placesOf(queue);
  return `${head(tx('review'))}${deckBody(reviewTop(), !queue.length)}`;
}
function reviewTop() {
  if (deckMode === 'exam') return `<div class="cr-rvtop" data-st="q"><b>${esc(tx('ex_q', { i: Math.min(qi + 1, queue.length), t: queue.length }))}</b>${bar(qi / Math.max(1, queue.length) * 100)}</div>`;
  const left = `<span class="cr-left">${esc(tx('rv_left', { n: Math.max(0, queue.length - qi) }))}</span>`;
  if (MS?.stage === 'student') {
    const s = MS.student || { done: 0, agree: 0, need: R.mod_student_n };
    return `<div class="cr-rvtop" data-st="student"><b>${esc(tx('rv_student', { d: s.done, n: s.need, a: s.done ? Math.round(s.agree / s.done * 100) : 0 }))}</b>${bar(s.done / s.need * 100)}${noMoney() ? '' : `<small>${esc(tx('rv_student_pay'))}</small>`}${left}</div>`;
  }
  const m = MS?.today || P.mod?.today || { checked: 0, accuracy: 0, cents: 0 };
  return `<div class="cr-rvtop" data-st="mod"><b>${esc(tx('rv_today', { n: num(m.checked), a: m.accuracy }))}${noMoney() ? '' : ' ' + esc(tx('rv_cents', { s: money2(m.cents) }))}</b>${noMoney() ? '' : med()}<small>${esc(tx('rv_acc', { n: R.mod_window }))}</small>${left}</div>`;
}
function cardHTML(q, depth) {
  const k = { video: tx('rv_k_video'), place: tx('rv_k_place'), photo: tx('rv_k_photo') }[q.kind];
  return `<article class="cr-card" data-id="${esc(q.id)}"${depth ? '' : ' data-top'} style="--d:${depth}" aria-hidden="${depth ? 'true' : 'false'}">
    <div class="cr-card-ph"><img src="${esc(pImg(q.place, true))}" alt="" draggable="false">${q.kind === 'video' ? `<span class="cr-playbtn sm">${I.play}</span>` : ''}
      <span class="cr-stamp ok">${esc(tx('rv_ok'))}</span><span class="cr-stamp no">${esc(tx('rv_no'))}</span></div>
    <div class="cr-card-tx"><span class="cr-k">${esc(k)}${q.platform ? `, ${esc(PLAT[q.platform])}` : ''}</span><b>${esc(q.title ? L(q.title) : pName(q.place))}</b><small>${esc(pName(q.place))}, ${esc(pCity(q.place))}${q.author ? `, ${esc(q.author)}` : ''}</small>
      <ul>${(q.facts || []).map((f) => `<li class="${/missing/.test(f) ? 'no' : ''}">${/missing/.test(f) ? I.alert : I.check}${esc(tx('fc_' + f, { at: q.at || '' }))}</li>`).join('')}</ul></div></article>`;
}
const deckState = () => (qi < queue.length ? 'card' : deckMode === 'exam' ? 'sending' : queue.length ? 'done' : 'empty');
function deckCards() {
  const st = deckState();
  if (st === 'sending') return `<div class="cr-empty">${I.clock}<b>${esc(tx('ex_sending'))}</b></div>`;
  if (st === 'empty') return `<div class="cr-empty">${I.clock}<b>${esc(tx('rv_empty_h'))}</b><p>${esc(tx('rv_empty_p'))}</p></div>`;
  if (st === 'done') return `<div class="cr-empty">${I.check}<b>${esc(tx('rv_done'))}</b><p>${esc(MS?.stage === 'student' ? tx('rv_student', { d: MS.student.done, n: MS.student.need, a: MS.student.done ? Math.round(MS.student.agree / MS.student.done * 100) : 0 }) : tx('rv_done_today', { n: num(MS?.today?.checked || 0) }))}</p><button class="btn-ghost" data-cr="rv-again">${esc(tx('rv_more'))}</button></div>`;
  return queue.slice(qi, qi + 3).map((q, i) => cardHTML(q, i)).reverse().join('');
}
function redrawDeck(scr) {
  const d = scr.querySelector('[data-deck]'); if (!d) return;
  d.innerHTML = deckCards(); d.dataset.st = deckState(); scr.querySelector('.cr-rvtop').outerHTML = reviewTop(); bindDeck(scr);
  const end = qi >= queue.length; scr.querySelector('.cr-rvbtns').hidden = end; scr.querySelector('.cr-hint').hidden = end;
}
// слишком быстро: карточка возвращается, подсказка «не засчитано» (02 §10.2, 03 §5.3)
function tooFast(scr) {
  const f = scr?.querySelector('.cr-fast'); if (f) { f.hidden = false; f.classList.remove('pulse'); void f.offsetWidth; f.classList.add('pulse'); }
  const c = scr?.querySelector('.cr-card[data-top]'); if (c) { c.style.transform = ''; c.style.setProperty('--ok', 0); c.style.setProperty('--no', 0); }
  ctx.haptic?.();
}
function tryDecide(scr, decision) {
  const q = queue[qi]; if (!q || !scr) return;
  const ms = Date.now() - shownAt;
  if (ms < MIN_MS()) { tooFast(scr); return; }
  if (decision === 'ok') decide(scr, 'ok', null, ms);
  else { const c = scr.querySelector('.cr-card[data-top]'); if (c) c.style.transform = 'translateX(-24px) rotate(-1.5deg)'; askReason(scr, ms); }
}
async function decide(scr, decision, reason, ms = pendMs) {
  const q = queue[qi]; if (!q) return;
  if (deckMode === 'exam') {
    exam.answers.push({ item_id: q.id, decision, reason_code: reason || null, ms: Math.round(ms) });
  } else {
    let r; try { r = await api().reviewDecision(q.id, decision, reason, Math.round(ms)); } catch { ctx.toast(tx('err')); return; }
    if (!r.counted) { tooFast(scr); return; }
    const was = MS.stage; MS = { ...MS, stage: r.stage, today: r.today, accuracy: r.accuracy, student: r.student }; if (P.mod) P.mod.today = r.today;
    if (r.stage !== was) { P = await api().getProfile(); renderHub(); qi++; setTimeout(() => rerender(), 260); return; }
  }
  const f = scr.querySelector('.cr-fast'); if (f) f.hidden = true;
  const top = scr.querySelector(`.cr-card[data-id="${CSS.escape(q.id)}"]`);
  qi++;
  if (top) { top.classList.add(decision === 'ok' ? 'fly-r' : 'fly-l'); setTimeout(() => redrawDeck(scr), 260); } else redrawDeck(scr);
  if (deckMode === 'exam' && qi >= queue.length) setTimeout(() => finishExam(), 300);
}
function askReason(scr, ms) {
  const q = queue[qi]; if (!q) return; pendMs = ms;
  const card = scr.querySelector(`.cr-card[data-id="${CSS.escape(q.id)}"]`);
  sheet(`<div class="cr-sh" data-st="reason"><h2>${esc(tx('rv_why'))}</h2><div class="cr-reasons">${RR[q.kind].map((r) => `<button class="row" data-cr="rv-reason" data-v="${r}"><span class="row-l">${esc(tx(r))}</span></button>`).join('')}</div>
    <button class="btn-ghost" data-cr="sheet-close">${esc(tx('back'))}</button></div>`, () => { if (card && !card.classList.contains('fly-l')) card.style.transform = ''; });
}
function bindDeck(scr) {
  shownAt = Date.now();
  const card = scr.querySelector('.cr-card[data-top]'); if (!card) return;
  let x0 = 0, y0 = 0, dx = 0, on = false, id = null;
  const set = (x) => { card.style.transform = `translateX(${x}px) rotate(${x / 18}deg)`; card.style.setProperty('--ok', Math.max(0, Math.min(1, x / 110))); card.style.setProperty('--no', Math.max(0, Math.min(1, -x / 110))); };
  card.addEventListener('pointerdown', (e) => { on = true; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; try { card.setPointerCapture?.(id); } catch { } card.classList.add('drag'); });
  card.addEventListener('pointermove', (e) => { if (!on) return; dx = e.clientX - x0; if (Math.abs(e.clientY - y0) > Math.abs(dx) * 1.5 && Math.abs(dx) < 10) return; set(dx); });
  const end = () => {
    if (!on) return; on = false; card.classList.remove('drag');
    if (dx > 100) { ctx.haptic?.(); tryDecide(scr, 'ok'); }
    else if (dx < -100) { ctx.haptic?.(); tryDecide(scr, 'no'); }
    else { card.style.transform = ''; card.style.setProperty('--ok', 0); card.style.setProperty('--no', 0); }
  };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
}
// экзамен: intro → q (20 карточек) → pass | fail; не сдал — cooldown 7 дней (02 §10.1)
async function examHTML(a) {
  MS = await api().getModStatus();
  if (!a.view) a.view = MS.stage === 'cooldown' ? 'cooldown' : MS.stage === 'mod' || MS.stage === 'student' ? 'pass' : 'intro';
  const h = head(tx('ex_h')), v = a.view, np = noMoney();
  if (v === 'q') {
    deckMode = 'exam'; queue = exam.items; qi = exam.answers.length;
    return `${h}${deckBody(reviewTop(), qi >= queue.length)}`;
  }
  if (v === 'intro') {
    const L4 = [['ex_p1', 'shield'], ['ex_p2', 'check'], ['ex_p3', 'clock'], ['ex_p4', 'info']];
    return `${h}${body(`<p class="cr-q" data-st="intro">${esc(tx('ex_lead', { t: R.mod_exam_total, n: R.mod_exam_need }))}</p>
      <ul class="cr-wl-l cr-ex-l">${L4.map(([k, i]) => `<li>${ic(i)}<span>${esc(tx(k, { s: secs(), d: R.mod_exam_cooldown_days }))}</span></li>`).join('')}</ul>
      <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="ex-start">${esc(tx('ex_start'))}</button>`)}`;
  }
  const r = a.result || { correct: MS.exam?.correct || 0, total: MS.exam?.total || R.mod_exam_total, not_counted: 0, cooldown_until: MS.cooldown_until };
  const fast = r.not_counted ? `<p>${esc(tx('ex_fast_n', { n: r.not_counted }))}</p>` : '';
  if (v === 'pass') {
    return `${h}${body(`<div class="cr-empty" data-st="pass">${I.check}<b>${esc(tx('ex_pass_h', { n: R.mod_student_n }))}</b><p>${esc(tx('ex_pass_p', { c: r.correct, t: r.total, a: R.mod_min_accuracy }))}</p>
      ${np ? '' : `<p>${esc(tx('ex_pass_pay', { s: money2(R.mod_decision_cents) }))}</p>`}${fast}<button class="btn-primary" data-cr="ex-go">${esc(tx('ex_go'))}</button></div>`)}`;
  }
  const until = r.cooldown_until || MS.cooldown_until, left = until ? daysTo(until) : R.mod_exam_cooldown_days;
  if (v === 'fail') {
    return `${h}${body(`<div class="cr-empty" data-st="fail">${I.alert}<b>${esc(tx('ex_fail_h', { c: r.correct, t: r.total, d: R.mod_exam_cooldown_days }))}</b><p>${esc(tx('ex_fail_p', { n: R.mod_exam_need, date: dfmt(until) }))}</p>${fast}
      <p>${esc(tx('ex_cd_p2'))}</p><button class="btn-primary" data-cr="open:board">${esc(tx('ex_tasks'))}</button></div>`)}`;
  }
  return `${h}${body(`<div class="cr-empty" data-st="cooldown">${I.clock}<b>${esc(tx('ex_cd_h', { date: dfmt(until) }))}</b><p>${esc(tx('ex_cd_p', { c: r.correct, t: r.total, n: R.mod_exam_need, days: plural(left, 'n_days_x') }))}</p>
    <p>${esc(tx('ex_cd_p2'))}</p><button class="btn-primary" data-cr="open:board">${esc(tx('ex_tasks'))}</button></div>`)}`;
}
async function finishExam() {
  const top = stack[stack.length - 1]; if (!top || top.id !== 'exam' || !exam) return;
  try { const r = await api().submitExam({ id: exam.id, answers: exam.answers }); top.args.result = r; top.args.view = r.passed ? 'pass' : 'fail'; }
  catch (x) { top.args.view = x.code === 'cooldown' ? 'cooldown' : 'intro'; }
  exam = null; P = await api().getProfile(); renderHub(); deckMode = 'queue'; rerender();
}

// ───────── экран 17 «Честные правила» (02 §7.9): all — по пунктам, все цифры из rules; nopay (РФ, РБ, младше 18, пробный без партнёрства) — без денег ─────────
function rulesHTML() {
  const kv = (rows) => `<div class="cr-ledger kv">${rows.map(([a, b]) => `<div><b>${esc(a)}</b><span class="v">${esc(b)}</span></div>`).join('')}</div>`;
  const sec = (t, rows) => `<h2 class="cr-h">${esc(tx(t))}</h2>${kv(rows)}`;
  const par = (t, p) => `<h2 class="cr-h">${esc(tx(t))}</h2><p class="cr-p">${esc(p)}</p>`;
  const m = money, rl = (k) => tx('r_line', { r: m(R.rpm[k]), cap: m(R.rpm_cap_cents), min: m(R.rpm_min_cents) });
  const no = [['ru_no1', 'ru_no1v'], ['ru_no6', 'ru_no6v'], ['ru_no7', 'ru_no7v'], ['ru_no8', 'ru_no8v'], ['ru_no9', 'ru_no9v'], ['ru_no2', 'ru_no2v']].map(([a, b]) => [tx(a), tx(b)]);
  const tail = par('ru_h_appeal', tx('ru_appeal_v', { h: R.appeal_hours })) + par('ru_h_change', tx('ru_change_v', { d: R.rules_notice_days }));
  if (noPay() || isMinor() || trialOnly()) {
    return `${head(tx('rules'))}${body(`<div data-st="nopay">${sec('ru_h_np', [[tx('ru_np1'), tx('ru_np1v')], [tx('ru_np2'), tx('ru_np2v2', { d: R.partner_pro_per_video_days })],
      [tx('ru_np3'), tx('ru_np3v2', { d: R.gift_days })], [tx('ru_np_max'), tx('ru_np_max_v', { d: R.pro_days_year_cap })]])}</div>${sec('ru_h_no', no)}${tail}`, '', true)}`;
  }
  return `${head(tx('rules'))}${body(`<div data-st="all">${med()}</div>
    ${sec('ru_h_rates', [[tx('ru_code'), tx('ru_code_v2', { p: R.share_pct, h: R.hold_days })], [tx('ru_views'), rl('tiktok')], [tx('ru_shorts'), rl('shorts')], [tx('ru_snap'), tx('ru_snap_v')],
      [tx('ru_author'), tx('ru_author_v2', { p: R.author_fee_pct, m: R.author_fee_months })], [tx('ru_scout'), tx('ru_scout_v2', { s: m(R.scout_pair_cents) })],
      [tx('ru_cpa'), tx('ru_cpa_v2', { s: m(R.cpa_cents), a: m(R.cpa_after_cents), d: R.cpa_days })], [tx('ru_mod'), tx('ru_mod_v2', { s: money2(R.mod_decision_cents), a: R.mod_min_accuracy })],
      [tx('ru_league'), tx('ru_league_v')]])}
    ${par('ru_h_count', tx('tm_count_v'))}
    ${sec('ru_h_terms', [[tx('ru_views_t'), tx('ru_views_tv2', { a: R.rpm_advance_day, b: R.rpm_rest_day })], [tx('ru_tasks_t'), tx('ru_tasks_tv2', { d: R.task_after_days })],
      [tx('ru_hold'), tx('ru_hold_v2', { h: R.hold_days })], [tx('ru_pay'), tx('ru_pay_v2', { day: R.payout_day, min: m(R.payout_min_cents) })],
      [tx('ru_first'), tx('ru_first_v2', { p: R.payout_provider })], [tx('ru_big2', { big: m(R.big_payout_cents) }), tx('ru_big_v')]])}
    ${par('ru_h_lim', tx('ru_lim_v', { cap: m(R.rpm_cap_cents), floor: m(R.rpm_min_cents), np: m(R.new_partner_cap_cents), an: m(R.author_cap_new_cents), ab: m(R.author_cap_cents) }))}
    ${par('ru_h_pro', tx('ru_pro_p', { a: R.partner_pro_days, b: R.partner_pro_per_video_days, v: num(R.partner_pro_min_views) }))}${sec('ru_h_no', no)}${par('ru_h_rate', tx('ru_rate_p', { p: R.share_pct, d: R.rules_notice_days }))}${par('ru_h_ad', tx('ru_ad_p'))}${tail}`, '', true)}`;
}

// ───────── экран 11 «Доска заданий» (02 §6.2, 08 §4): разделы А «Для всех», Б «Для партнёров», В «Лига»;
// карточки open, in_progress (черновик), sent, accepted (со следом), rejected (причина и «Исправить»), locked (что откроет) ─────────
// Награды и состояния карточек отдаёт SB.api.getTasks — экран их только показывает (demo и live — по ставкам, beta — «предварительно»).
const TICON = { found: 'check', fix: 'alert', new_place: 'pin', new_egg: 'egg', game_frame: 'gamepad', free_photo: 'camera', place_week: 'video', fresh_find: 'video',
  mention3: 'video', need_pair: 'swap', review: 'shield', league_fixed: 'star' };
const REPEAT = { new_place: 'st_more_place', new_egg: 'st_more_egg', place_week: 'st_more_video', fresh_find: 'st_more_video', mention3: 'st_more_video' };
const nickTag = () => '@' + (P?.nick || tx('you_nick'));
const proDays = (n) => plural(n, 'n_days_x') + ' Pro';
// награда строкой: «Найдено @ник, +7 дней Pro, 10% с роликов о месте»; «Кадр из игры» денег не имеет (api.js правило 13 check_code.py)
function rwText(r = {}) {
  const n = nickTag(), out = [];
  if (r.name) out.push(tx('rw_' + r.name, { n }));
  if (r.pro_days) out.push('+' + proDays(r.pro_days));
  if (r.author_pct) out.push(tx('rw_author', { p: r.author_pct }));
  if (r.cents && r.per) out.push(tx(r.per === 'pair' ? 'rw_pair' : 'rw_dec', { s: money(r.cents) }));
  if (r.rpm) out.push(tx('rw_rpm', { r: money(R.rpm.tiktok), p: r.share_pct }));
  if (r.fixed_cents) out.push(tx('rw_fixed', { s: money(r.fixed_cents), v: num(r.threshold_views) }));
  else if (r.video_pro_days) out.push(tx('rw_vpro', { d: proDays(r.video_pro_days), v: num(r.threshold_views) }));
  else if (r.threshold_views) out.push(tx('rw_league_np', { v: num(r.threshold_views) }));
  const s = out.join(', ');
  return s && r.preliminary ? tx('rw_pre', { x: s }) : s;
}
const lockText = (l = {}) => tx('lk_' + l.code, { n: num(l.n || 0), d: l.date ? dfmt(l.date) : '' });
const rjcText = (code) => tx('rjc_' + code) === 'rjc_' + code ? tx('rjc_other') : tx('rjc_' + code);
// след принятого вклада (02 §6.1, v_place_stats): «Ваше место открыли 1 240 раз за неделю»
function traceText(t) {
  if (!t) return '';
  if (t.kind === 'opens') return tx('tr_opens', { n: num(t.n) }) + (t.videos ? tx('tr_videos', { v: plural(t.videos, 'n_videos') }) : '');
  if (t.kind === 'compares') return tx('tr_compares', { n: plural(t.n, 'n_people') });
  if (t.kind === 'frame_compares') return tx('tr_frame', { n: plural(t.n, 'n_people') });
  if (t.kind === 'fixed_for') return tx('tr_fixed', { n: plural(t.n, 'n_people') });
  if (t.kind === 'votes') return tx(t.n >= t.need ? 'tr_votes_ok' : 'tr_votes', { n: t.n, need: t.need });
  return '';
}
function taskText(t) {
  const p = t.place ? pName(t.place) : '';
  if (t.kind === 'league_fixed') return { t: L(t.title), d: tx('tk_league_d', { pl: t.platforms.map((k) => PLAT[k]).join(', '), n: t.places_n, s: t.slots_left, all: t.slots }) + (t.ends_at ? '. ' + tx('tk_until', { d: dfmt(t.ends_at) }) : ''), v: tx('tk_league_v') };
  return { t: tx('tk_' + t.kind, { p }), d: tx('tk_' + t.kind + '_d', { p, who: t.found_by || '', d: t.found_at ? dfmt(t.found_at) : '' }), v: tx('tk_' + t.kind + '_v') };
}
let board = { tasks: [], vids: [] };
function taskCard(t) {
  const x = taskText(t), img = t.place ? pImg(t.place) : '', st = t.state, c = t.claim;
  const v = c?.kind === 'video' ? board.vids.find((y) => y.id === c.id) : null;
  let stl = '', btn = '';
  if (st === 'locked') stl = `<p class="cr-task-lk">${I.lock}<span>${esc(lockText(t.lock))}</span></p>`;
  else if (st === 'in_progress') { stl = `${tag('wait', tx('st_draft'))}<small>${esc(tx('st_draft_p'))}</small>`; btn = tx('st_continue'); }
  else if (st === 'sent') stl = `${tag('wait', tx('st_sent'))}<small>${esc(v ? nb(vdesc(v)) : tx('st_sent_p'))}</small>`;
  else if (st === 'rejected') { stl = `${tag('no', tx('st_no'))}<small class="no">${esc(v ? rjText(v) : rjcText(c.reject_code))}</small>`; btn = tx('st_fix'); }
  else if (st === 'accepted' && t.kind === 'league_fixed' && v) {
    // ролик по заданию Лиги: прогресс к порогу просмотров, после порога — фиксированная сумма (02 §6.2 В, ledger task)
    const thr = t.threshold_views || 0, ok = v.views >= thr, fx = t.reward?.fixed_cents;
    stl = `${tag('ok', tx('st_ok'))}<p class="cr-trace">${I.chart}<span>${esc(nb(ok ? (fx ? tx('lg_done', { s: money(fx) }) : tx('lg_done_np')) : tx('lg_prog', { id: v.id, a: num(v.views), b: num(thr) })))}</span></p>${ok ? '' : bar(v.views / Math.max(1, thr) * 100)}`;
  } else if (st === 'accepted') {
    const tr = v ? vdesc(v) : traceText(c.trace);
    stl = `${tag('ok', tx('st_ok'))}${tr ? `<p class="cr-trace">${v ? I.chart : I.eye}<span>${esc(nb(tr))}</span></p>` : ''}`;
    if (REPEAT[t.kind]) btn = tx(REPEAT[t.kind]);
  } else btn = x.v;
  const rw = rwText(t.reward);
  const tday = t.kind === 'review' && t.today && st !== 'locked' ? `<p class="cr-task-rw">${I.chart}<span>${esc(tx('tk_review_today', { n: num(t.today.checked), a: t.today.accuracy }))}</span></p>` : '';
  return `<article class="cr-task${st === 'locked' ? ' off' : ''}" data-k="${esc(t.kind)}" data-st="${esc(st)}" data-id="${esc(t.id)}">
    <div class="cr-task-h">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="cr-task-ic">${ic(TICON[t.kind])}</span>`}<div class="m"><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div></div>
    ${rw ? `<p class="cr-task-rw">${I.star}<span>${esc(nb(rw))}</span></p>` : ''}${t.kind === 'game_frame' ? `<p class="cr-task-rw sub">${I.info}<span>${esc(tx('rw_frame_note'))}</span></p>` : ''}${tday}
    ${stl ? `<div class="cr-task-st">${stl}</div>` : ''}${btn ? `<button class="cr-mini acc" data-cr="tk-go" data-id="${esc(t.id)}">${esc(btn)}</button>` : ''}</article>`;
}
async function boardHTML(a) {
  const world = a.world || ctx?.game?.() || 'gta6'; a.world = world;
  const [tasks, vids, mine] = await Promise.all([api().getTasks({ world }), api().listMyVideos().catch(() => []), api().listMyContributions().catch(() => [])]);
  board = { tasks, vids, world };
  await placesOf(tasks.filter((t) => t.place));
  const np = noPay() || isMinor();
  const sec = (k, h, p, extra = '') => { const list = tasks.filter((t) => t.section === k); return list.length ? `<h2 class="cr-h">${esc(tx(h))}</h2><p class="cr-p">${esc(tx(p))}</p>${extra}<div class="cr-tasks">${list.map(taskCard).join('')}</div>` : ''; };
  const join = isMinor() || isPartner() ? '' : hasAccess() ? `<button class="btn-ghost" data-cr="login">${esc(tx('wl_partner'))}</button>` : `<button class="btn-ghost" data-cr="inv-beta">${esc(tx('wl_have'))}</button>`;
  const acc = mine.filter((c) => c.status === 'accepted').length, rev = mine.filter((c) => c.status === 'in_review' || c.status === 'pending_review').length;
  return `${head(tx('board_h'))}${body(`<div class="cr-seg" role="tablist">${['gta6', 'gta5'].map((g) => `<button role="tab" data-cr="bd-w" data-v="${g}" aria-selected="${g === world}">${g === 'gta6' ? 'GTA 6' : 'GTA 5'}</button>`).join('')}</div>
    ${sec('all', 'bd_a', 'bd_a_p')}${sec('partner', 'bd_b', np ? 'bd_b_p_np' : 'bd_b_p', join)}${sec('league', 'bd_c', np ? 'bd_c_p_np' : 'bd_c_p')}
    <div class="group">${row('open:contribs', 'doc', tx('hub_mine'), mine.length ? tx('hub_mine_sub', { a: acc, b: rev }) : tx('hub_mine_none'))}</div>`)}`;
}
async function taskGo(id) {
  const t = board.tasks.find((x) => x.id === id); if (!t) return;
  const fixFrom = t.state === 'rejected' && t.claim?.kind === 'contribution' ? t.claim.id : null;
  switch (t.kind) {
    case 'found': return foundSheet(t.place, t.id);
    case 'review': return push('review', {});
    case 'place_week': case 'fresh_find': return shootSheet(t.place.world, t.place.id);
    case 'mention3': form = { mode: 'mention', places: [] }; return submitSheet();
    case 'league_fixed': form = { task: t.id, taskTitle: L(t.title), taskN: t.places_n || 1, mode: (t.places_n || 1) > 1 ? 'mention' : 'about', places: [] }; return submitSheet();
    default: return cfOpen(t.kind === 'need_pair' ? 'pair' : t.kind, { place: t.place, task: t.id, world: t.place?.world || board.world, from: fixFrom, fresh: t.state === 'accepted' });
  }
}

// ───────── экран 13 «Мои вклады» (02 §6.4): list, empty; «Ваши места» (автор) и «Ваши правки и фото»; след под каждым принятым ─────────
const CST = { in_review: 'wait', pending_review: 'wait', accepted: 'ok', rejected: 'no' };
const cbName = (c) => (c.place ? pName(c.place) : '') || c.payload?.name || c.name || tx('ct_' + c.type);
function contribRow(c, draft = false) {
  const img = c.place ? pImg(c.place) : c.payload?.photo || c.photo || '';
  const st = draft ? 'draft' : c.status === 'pending_review' ? 'in_review' : c.status;
  let line = '', btn = '';
  if (draft) { line = `<small>${esc(tx('st_draft_p'))}</small>`; btn = `<button class="cr-mini acc" data-cr="cf-resume" data-v="${esc(c.type)}">${esc(tx('st_continue'))}</button>`; }
  else if (st === 'in_review') line = `<small>${esc(tx('st_sent_p'))}</small>`;
  else if (st === 'rejected') { line = `<small class="no">${esc(rjcText(c.reject_code))}</small>`; btn = `<button class="cr-mini acc" data-cr="cf-refix" data-v="${esc(c.id)}">${esc(tx('st_fix'))}</button>`; }
  else if (st === 'accepted') { const tr = traceText(c.trace); line = `<small>${esc(nb(rwText(c.reward)))}</small>${tr ? `<p class="cr-trace">${I.eye}<span>${esc(nb(tr))}</span></p>` : ''}`; }
  const tg = draft ? tag('wait', tx('st_draft')) : tag(CST[st] || '', tx(st === 'accepted' ? 'st_ok' : st === 'rejected' ? 'st_no' : 'st_sent'));
  return `<div class="cr-li cr-ci" data-st="${esc(st)}" data-t="${esc(c.type)}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="cr-task-ic">${ic(TICON[c.type] || 'pin')}</span>`}
    <span class="m"><b>${esc(cbName(c))}</b><small>${esc(tx('ct_' + c.type))}${c.created_at || c.saved_at ? `, ${esc(dfmt(c.created_at || c.saved_at))}` : ''}</small>${tg}${line}${btn}</span></div>`;
}
async function contribsHTML() {
  const [list, drafts] = await Promise.all([api().listMyContributions(), api().getDrafts()]);
  await placesOf([...list, ...drafts].filter((x) => x.place));
  if (!list.length && !drafts.length) return `${head(tx('mc_h'))}${body(`<div class="cr-empty">${I.pin}<b>${esc(tx('mc_empty'))}</b><p>${esc(tx('mc_empty_p'))}</p><button class="btn-primary" data-cr="open:board">${esc(tx('mc_open_board'))}</button></div>`)}`;
  const acc = list.filter((c) => c.status === 'accepted'), rev = list.filter((c) => CST[c.status] === 'wait');
  const pro = Math.min(60, acc.reduce((a, c) => a + (c.reward?.pro_days || 0), 0));
  const places = list.filter((c) => c.type === 'new_place' || c.type === 'new_egg'), edits = list.filter((c) => !places.includes(c));
  const grp = (h, p, rows) => (rows.length ? `<h2 class="cr-h">${esc(tx(h))}</h2>${p ? `<p class="cr-p">${esc(p)}</p>` : ''}<div class="cr-list">${rows.join('')}</div>` : '');
  const author = moneyOK() && mode() !== 'beta' ? tx('mc_places_p_money', { p: R.author_fee_pct, m: R.author_fee_months }) : tx('mc_places_p');
  return `${head(tx('mc_h'))}${body(`<div class="cr-note">${I.star}<span><b>${esc(tx('mc_sum', { a: acc.length, b: rev.length }))}</b>. ${esc(mode() === 'beta' ? tx('mc_pro_beta') : tx('mc_pro', { d: '+' + proDays(pro) }))}</span></div>
    ${grp('mc_drafts', '', drafts.map((d) => contribRow(d, true)))}${grp('mc_places', author, places.map((c) => contribRow(c)))}${grp('mc_edits', tx('mc_edits_p'), edits.map((c) => contribRow(c)))}
    <button class="btn-primary" data-cr="open:board">${esc(tx('mc_open_board'))}</button>`)}`;
}

// ───────── экран 12 «Форма вклада» (шторка, 02 §6.3, 08 §4): types → point → dup → draft → вход → sent; photo_real («Пересними ракурс»), photo_game.
// Черновик — SB.api.saveDraft: сохраняется на устройстве до входа почтой и после входа отправляется без повторного заполнения ─────────
let cf = null, cam = null;
const LL_RE = /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/;
const fmtLL = (o) => `${Number(o.lat).toFixed(5)}, ${Number(o.lon).toFixed(5)}`.replace(/-/g, '−');
function cfCollect() {
  if (!cf) return;
  for (const [id, k] of [['cf-where', 'where'], ['cf-name', 'name'], ['cf-what', 'what'], ['cf-src', 'source'], ['cf-note', 'note'], ['cf-url', 'url']]) { const e = $('#' + id); if (e) cf[k] = e.value.trim(); }
  const m = LL_RE.exec(cf.where || ''); if (m && !cf.from_map) { cf.lat = +m[1]; cf.lon = +m[2]; } else if (!cf.from_map) { cf.lat = null; cf.lon = null; }
}
const cfHas = () => !!(cf && (cf.name || cf.what || cf.where || cf.source || cf.photo || cf.note || cf.url || cf.reason || cf.from_map));
function cfKeep() { stopCam(); if (!cf || cf.view === 'sent') return; cfCollect(); if (cfHas()) api().saveDraft(cfDraft()).catch(() => { }); }
const cfDraft = () => { const { view, dup, busy, ...d } = cf; return d; };
const srcOK = () => !!(cf.source || cf.photo);
async function cfOpen(type, o = {}) {
  await load(); stopCam();
  const dr = o.fresh ? null : (await api().getDrafts()).find((d) => d.type === type && (!o.place || !d.place || (d.place.world === o.place.world && d.place.id === o.place.id)));
  cf = dr ? { ...dr } : { type, world: o.place?.world || o.world || ctx?.game?.() || 'gta6', place: o.place || null, task: o.task || null };
  if (o.from) {   // «Исправить» у не принятого: прежние ответы — в форму
    const c = (await api().listMyContributions()).find((x) => x.id === o.from);
    if (c) Object.assign(cf, { place: c.place, reason: c.payload?.reason, note: c.payload?.note || '', name: c.payload?.name || '', url: c.source_url || '', source: c.source_url || '' });
  }
  if (o.lat != null) Object.assign(cf, { lat: o.lat, lon: o.lon, from_map: true, place: null });
  if (cf.what && typeof cf.what === 'object') cf.what = L(cf.what);
  if (cf.place) await place(cf.place);
  if (type === 'found') return foundSheet(cf.place, cf.task);
  cf.view = '';
  cfRender();
}
const cfHead = (k) => `<h2>${esc(tx(k))}</h2>${cf.place ? `<p class="sub">${esc([pName(cf.place), pCity(cf.place)].filter(Boolean).join(', '))}</p>` : ''}`;
const placeField = () => `<div class="cr-field"><span>${esc(tx('cf_place'))}</span><b>${cf.place ? esc(pName(cf.place)) : '—'}</b><button class="cr-mini" data-cr="pick" data-next="cf">${esc(cf.place ? tx('sv_change') : tx('sv_pick'))}</button></div>`;
const photoBox = (label) => (cf.photo ? `<div class="cr-ph"><img src="${cf.photo}" alt=""><span><b>${esc(tx('cf_your_photo'))}</b><small>${esc(tx('cf_photo_ok'))}</small></span></div>` : '')
  + `<input id="cf-file" type="file" accept="image/*" hidden${cf.type === 'pair' ? ' capture="environment"' : ''}><button class="btn-ghost" data-cr="cf-photo">${I.camera}${esc(tx(cf.photo ? (cf.type === 'pair' ? 'cf_retake' : 'cf_pg_other') : label))}</button>`;
const inp = (id, label, ph, val, type = 'text') => `<label class="cr-in"><span>${esc(tx(label))}</span><input id="${id}" data-cf type="${type}" autocomplete="off"${type === 'url' ? ' inputmode="url" autocapitalize="off" spellcheck="false"' : ''} placeholder="${esc(tx(ph))}" value="${esc(val || '')}"></label>`;
function cfView() {
  const t = cf.type, send = (k = 'cf_send', dis = false) => `<p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="cf-send"${dis ? ' disabled' : ''}>${I.send}${esc(tx(k))}</button>`;
  if (cf.view === 'draft') {
    const rows = [['cf_kind', tx('ct_' + t)], ...(cf.place ? [['cf_place', pName(cf.place)]] : []), ...(cf.name ? [['cf_name', cf.name]] : []), ...(cf.lat != null ? [['cf_point', fmtLL(cf)]] : cf.where ? [['cf_where', cf.where]] : []),
      ...(cf.source ? [['cf_src', cf.source]] : []), ...(cf.reason ? [['cf_note', tx('fx_' + cf.reason)]] : [])];
    return { st: 'draft', html: `<h2>${esc(tx('cf_draft_h'))}</h2><p class="sub">${esc(tx('cf_draft_p'))}</p>
      <div class="cr-ledger kv">${rows.map(([a, b]) => `<div><b>${esc(tx(a))}</b><span class="v">${esc(b)}</span></div>`).join('')}</div>${cf.photo ? `<div class="cr-ph"><img src="${cf.photo}" alt=""><span><b>${esc(tx('cf_your_photo'))}</b></span></div>` : ''}
      <button class="btn-primary" data-cr="cf-login">${I.mail}${esc(tx('cf_login_send'))}</button><button class="btn-ghost" data-cr="sheet-close">${esc(tx('cf_later'))}</button>` };
  }
  if (cf.view === 'dup') {
    const ref = cf.dup, p = pSync(ref);
    return { st: 'dup', html: `<h2>${esc(tx('cf_dup_h'))}</h2><p class="sub">${esc(tx('cf_dup_q'))}</p>
      <div class="cr-li"><img src="${esc(pImg(ref))}" alt=""><span class="m"><b>${esc(pName(ref))}</b><small>${esc(p?.a || pCity(ref))}</small></span></div>
      <div class="cr-two"><button class="btn-primary" data-cr="cf-dup" data-v="yes">${esc(tx('cf_dup_yes'))}</button><button class="btn-ghost" data-cr="cf-dup" data-v="no">${esc(tx('cf_dup_no'))}</button></div>` };
  }
  if (t === 'new_place' || t === 'new_egg') {
    const where = cf.place ? `<div class="cr-field"><span>${esc(tx('cf_place'))}</span><b>${esc(pName(cf.place))}</b><button class="cr-mini" data-cr="cf-unplace">${esc(tx('sv_change'))}</button></div>`
      : cf.from_map ? field(tx('cf_point'), fmtLL(cf)) : inp('cf-where', 'cf_where', 'cf_where_ph', cf.where);
    return { st: 'point', html: `<h2>${esc(tx('tk_' + t))}</h2><p class="sub">${esc(tx('cf_point_sub'))}</p>
      <p class="cr-lbl">${esc(tx('cf_where_h'))}</p>${where}${cf.place || cf.from_map ? '' : `<button class="cr-mini" data-cr="pick" data-next="cf">${I.pin}${esc(tx('cf_pick'))}</button>`}
      ${inp('cf-name', 'cf_name', 'cf_name_ph', cf.name)}${inp('cf-what', 'cf_what', t === 'new_egg' ? 'cf_what_egg_ph' : 'cf_what_ph', cf.what)}${inp('cf-src', 'cf_src', 'cf_src_ph', cf.source, 'url')}
      <p class="cr-lbl">${esc(tx('cf_or_photo'))}</p>${photoBox('cf_add_photo')}
      <p class="cr-hint cr-need" id="cf-need"${srcOK() ? ' hidden' : ''}>${esc(tx('cf_src_need'))}</p><p class="cr-err" id="cr-err" hidden></p>
      <button class="btn-primary" data-cr="cf-next"${srcOK() ? '' : ' disabled'}>${esc(tx('cf_next'))}</button>` };
  }
  if (t === 'fix') return { st: 'fix', html: `${cfHead('tk_fix')}${cf.place ? '' : placeField()}
      <div class="cr-chips">${['wrong_spot', 'closed', 'wrong_building', 'no_coords', 'violation'].map((r) => `<button data-cr="cf-reason" data-v="${r}" aria-pressed="${cf.reason === r}">${esc(tx('fx_' + r))}</button>`).join('')}</div>
      ${inp('cf-note', 'cf_note', 'cf_note_ph', cf.note)}${send()}` };
  if (t === 'free_photo') return { st: 'free', html: `${cfHead('tk_free_photo')}${cf.place ? '' : placeField()}${inp('cf-url', 'cf_fp_url', 'cf_fp_ph', cf.url, 'url')}<p class="cr-p">${esc(tx('cf_fp_note'))}</p>${send()}` };
  if (t === 'game_frame') {
    const ref = cf.place ? pSync(cf.place) : null, real = ref?.pr ? imgUrl(ref.pr.thumb || ref.pr.file) : '';
    return { st: 'photo_game', html: `${cfHead('tk_game_frame')}${cf.place ? '' : placeField()}<p class="cr-p">${esc(tx('cf_pg_sub'))}</p>
      ${real ? `<div class="cr-ph ref"><img src="${esc(real)}" alt=""><span><b>${esc(tx('cf_ref'))}</b><small>${esc(tx('cf_ref_p'))}</small></span></div>` : ''}
      <div class="cr-note">${I.info}<span>${esc(tx('rw_frame_note'))}</span></div>${photoBox('cf_pg_pick')}${cf.photo ? send() : ''}` };
  }
  if (t === 'pair') {
    const ref = cf.place ? pSync(cf.place) : null, ghost = ref?.pg ? imgUrl(ref.pg.file || ref.pg.thumb) : '', small = ref?.pg ? imgUrl(ref.pg.thumb || ref.pg.file) : '';
    const live = cam && cam.live;
    const view = live ? `<div class="cr-cam"><video id="cf-video" playsinline muted autoplay></video>${ghost ? `<img class="ghost" id="cf-ghost" src="${esc(ghost)}" alt="" style="opacity:${cam.op}">` : ''}</div>
      <label class="cr-in cr-range"><span>${esc(tx('cf_opacity'))}</span><input id="cf-op" type="range" min="0.1" max="0.8" step="0.05" value="${cam.op}"></label>
      <button class="btn-primary" data-cr="cf-shot">${I.camera}${esc(tx('cf_shot'))}</button>`
      : `${small && !cf.photo ? `<div class="cr-ph ref"><img src="${esc(small)}" alt=""><span><b>${esc(tx('cf_ghost'))}</b><small>${esc(tx('cf_ghost_p'))}</small></span></div>` : ''}
      ${cf.cam_off && !cf.photo ? `<div class="cr-note">${I.info}<span>${esc(tx('cf_cam_off'))}</span></div>` : ''}
      ${cf.photo || cf.cam_off ? '' : `<button class="btn-primary" data-cr="cf-cam">${I.camera}${esc(tx('cf_cam'))}</button>`}${photoBox('cf_pick_photo')}${cf.photo ? send() : ''}`;
    return { st: 'photo_real', html: `${cfHead('ty_pair2')}${cf.place ? '' : placeField()}<p class="cr-p">${esc(tx('cf_pr_sub'))}</p>${view}` };
  }
  return { st: 'types', html: '' };
}
function cfRender(e = '') {
  const v = cfView();
  sheet(`<div class="cr-sh cr-cf" data-st="${v.st}" data-t="${esc(cf.type)}">${v.html}</div>`, cfKeep);
  if (e) err(e);
  if (cam?.live) { const vd = $('#cf-video'); if (vd) { vd.srcObject = cam.stream; vd.play?.().catch(() => { }); } }
}
// «Узнаю это место»: фото из жизни, «Нашёл» / «Не то место», сравнить ползунком — на карте
async function foundSheet(ref, task) {
  await load(); if (ref) await place(ref);
  cf = { type: 'found', world: ref?.world || ctx?.game?.() || 'gta6', place: ref, task: task || null };
  const p = pSync(ref), real = p?.pr ? imgUrl(p.pr.thumb || p.pr.file) : '';
  sheet(`<div class="cr-sh cr-cf" data-st="found" data-t="found">${cfHead('tk_found')}${real ? `<img class="cr-lad-ph" src="${esc(real)}" alt="" loading="lazy">` : ''}
    <p class="cr-p">${esc(tx('cf_found_q'))}</p><p class="cr-err" id="cr-err" hidden></p>
    <div class="cr-two"><button class="btn-primary" data-cr="cf-vote" data-v="yes">${I.check}${esc(tx('cf_yes'))}</button><button class="btn-ghost" data-cr="cf-vote" data-v="no">${esc(tx('cf_no'))}</button></div>
    ${ref ? `<button class="cr-mini" data-cr="vplace" data-w="${esc(ref.world)}" data-p="${esc(ref.id)}">${I.map}${esc(tx('cf_on_map'))}</button>` : ''}</div>`, cfKeep);
}
const CE = { no_place: 'ce_no_place', no_point: 'ce_no_point', no_name: 'ce_no_name', no_source: 'ce_no_source', no_photo: 'ce_no_photo', bad_reason: 'ce_bad_reason', bad_url: 'ce_bad_url', limit: 'ce_limit' };
// проверки до отправки — те же, что у SB.api.submitContribution (ошибка видна сразу, без входа)
function cfCheck() {
  const t = cf.type;
  if (['fix', 'pair', 'game_frame', 'free_photo', 'found'].includes(t) && !cf.place) return 'no_place';
  if (t === 'new_place' || t === 'new_egg') { if (!cf.place && cf.lat == null && !cf.where) return 'no_point'; if (!cf.name) return 'no_name'; if (!srcOK()) return 'no_source'; }
  if ((t === 'pair' || t === 'game_frame') && !cf.photo) return 'no_photo';
  if (t === 'fix' && !cf.reason) return 'bad_reason';
  if (t === 'free_photo' && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}\/\S+/i.test(cf.url || '')) return 'bad_url';
  return '';
}
async function cfNext() {
  cfCollect(); const e = cfCheck(); if (e) { err(tx(CE[e])); return; }
  if (!cf.place && !cf.dupChecked) {
    const r = await api().checkDuplicate({ world: cf.world, name: cf.name, lat: cf.lat, lon: cf.lon }).catch(() => ({ match: null }));
    if (r.match) { await place(r.match); cf.dup = r.match; cf.view = 'dup'; cfRender(); return; }
  }
  cfSend();
}
let loginFor = null;
async function cfSend() {
  if (!cf) return; cfCollect(); stopCam();
  const e = cfCheck(); if (e) { if (cf.view === 'draft') { cf.view = ''; cfRender(tx(CE[e])); } else err(tx(CE[e])); return; }
  if (isGuest()) { await api().saveDraft(cfDraft()); cf.view = 'draft'; cfRender(); return; }   // вход почтой — после него отправим без повторного заполнения
  const b = $('[data-cr="cf-send"], [data-cr="cf-next"], [data-cr="cf-login"]'); if (b) b.disabled = true;
  const payload = { name: cf.name || '', what: cf.what || '', where: cf.where || '', lat: cf.lat ?? null, lon: cf.lon ?? null, reason: cf.reason || null, note: cf.note || '', vote: cf.vote || null, photo: cf.photo || null, extend: !!cf.extend };
  try { await api().submitContribution({ type: cf.type, task_id: cf.task, place: cf.place, payload, source_url: cf.type === 'free_photo' ? cf.url : cf.source || '' }); }
  catch (x) { if (b) b.disabled = false; const k = CE[x.code]; if (cf.view === 'draft') { cf.view = ''; cfRender(k ? tx(k) : tx('err')); } else err(k ? tx(k) : tx('err')); return; }
  const done = cf; cf = null;
  const r = rwText((board.tasks.find((t) => t.id === done.task) || board.tasks.find((t) => t.type === done.type) || {}).reward || {});
  sheet(`<div class="cr-sh" data-st="sent" data-t="${esc(done.type)}"><h2>${esc(tx(done.type === 'found' ? 'cf_sent_found' : 'cf_sent_h'))}</h2>
    ${done.type === 'found' ? `<p class="cr-p">${esc(tx('cf_sent_found_p'))}</p>` : `<div class="cr-steps"><div class="on">${I.check}<span>${esc(tx('cf_sent_1'))}</span></div><div>${I.clock}<span>${esc(tx('cf_sent_2'))}</span></div></div>`}
    ${r && done.type !== 'found' ? `<p class="cr-p">${esc(nb(tx('cf_reward', { r })))}</p>` : ''}
    <button class="btn-primary" data-cr="open:contribs">${esc(tx('cf_to_mine'))}</button><button class="btn-ghost" data-cr="sheet-close">${esc(tx('done'))}</button></div>`);
  if (stack.length && ['board', 'contribs'].includes(stack[stack.length - 1].id)) rerender();
  renderHub();
}
// снимок → JPEG до 720 px (на устройстве; с сервером — загрузка в хранилище)
function shrink(src, max = 720) {
  return new Promise((ok, no) => {
    const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); const cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); ok(cv.toDataURL('image/jpeg', 0.72)); };
    im.onerror = no; im.src = src;
  });
}
async function cfFile(file) {
  if (!cf || !file) return;
  const u = URL.createObjectURL(file);
  try { cf.photo = await shrink(u); cfRender(); } catch { err(tx('ce_photo')); } finally { URL.revokeObjectURL(u); }
}
// «Пересними ракурс»: камера с полупрозрачным кадром игры поверх вида (кадр — только в живом видоискателе, не в превью)
async function startCam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
    cam = { stream, live: true, op: 0.35 }; cfRender();
  } catch { cf.cam_off = true; cfRender(); }
}
function stopCam() { if (cam?.stream) cam.stream.getTracks().forEach((t) => t.stop()); cam = null; }
async function camShot() {
  const v = $('#cf-video'); if (!v || !v.videoWidth) return;
  const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight)), cv = document.createElement('canvas');
  cv.width = Math.round(v.videoWidth * k); cv.height = Math.round(v.videoHeight * k); cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
  cf.photo = cv.toDataURL('image/jpeg', 0.72); stopCam(); cfRender();
}

// ───────── шторки: добавить, подать ролик, место, сообщить, вход, вывод, приглашение ─────────
let form = {};   // черновик формы — переживает вход почтой
// «Добавить» (шаг 8, В9) — первое состояние формы вклада `types` (08 №12): ролик, новое место, пасхалка, правка, фото из жизни, кадр из игры, свободное фото
function addSheet() {
  const g = ctx?.game?.() || 'gta6', minor = isMinor(), scout = !!P?.roles?.includes('scout');
  const it = (cr, icon, t, d, attrs = '', lock = false) => `<button class="row cr-row${lock ? ' off' : ''}" data-cr="${cr}" ${attrs}><span class="row-ic">${ic(icon)}</span><span class="row-l">${esc(t)}<small>${esc(d)}</small></span><span class="row-chev">${lock ? I.lock : I.chevron}</span></button>`;
  const release = g === 'gta6' && today() < '2026-11-19';
  sheet(`<div class="cr-sh" data-st="types"><h2>${esc(tx('add_h'))}</h2><div class="group">
    ${minor ? '' : it('submit', 'video', tx('ty_video'), tx('ty_video_d'))}
    ${it('cf-type', 'pin', tx('ty_new_place'), tx('ty_new_place_d'), 'data-v="new_place"')}
    ${it('cf-type', 'egg', tx('ty_new_egg'), tx('ty_new_egg_d'), 'data-v="new_egg"')}
    ${it('cf-type', 'alert', tx('ty_fix'), tx('ty_fix_d'), 'data-v="fix"')}
    ${scout && !minor ? it('cf-type', 'swap', tx('ty_pair2'), tx('ty_pair2_d'), 'data-v="pair"') : it('locked', 'swap', tx('ty_pair2'), tx('ty_pair2_d'), 'data-v="soon_pair"', true)}
    ${release ? it('locked', 'gamepad', tx('ty_frame'), tx('ty_found_d6'), 'data-v="soon_found"', true) : it('cf-type', 'gamepad', tx('ty_frame'), tx('ty_frame_d'), 'data-v="game_frame"')}
    ${it('cf-type', 'camera', tx('ty_free'), tx('ty_free_d'), 'data-v="free_photo"')}</div>
    <div class="group">${row('open:board', 'star', tx('hub_tasks'), tx('hub_tasks_sub'))}</div></div>`);
}
// ───────── экран 6 «Подача ролика» (02 §7.3, решение №17): form, places (упоминания с таймкодами), gameplay_on, submitting, duplicate, sent ─────────
const AT_RE = /^\d{1,2}:[0-5]\d$/;
const platOf = (u) => {
  const x = String(u || '').toLowerCase();
  if (!/(tiktok\.com|youtube\.com|youtu\.be|instagram\.com|snapchat\.com)\//.test(x)) return null;
  return /tiktok/.test(x) ? 'tiktok' : /shorts\//.test(x) ? 'shorts' : /youtu/.test(x) ? 'youtube' : /instagram/.test(x) ? 'reels' : 'snapchat';
};
// формат по ссылке: «YouTube Shorts: $0,05 за 1 000 просмотров»; страна без выплат — только площадка
function fmtLine(url) {
  const k = platOf(url); if (!k) return '';
  if (noPay()) return tx('sv_fmt_np', { p: PLAT[k] });
  return k === 'snapchat' ? tx('sv_fmt_snap') : tx('sv_fmt', { p: PLAT[k], r: money(R.rpm[k] ?? R.rpm.tiktok) });
}
async function submitSheet(pref) {
  if (pref) { form.place = pref; if (form.mode === 'mention' && !(form.places || []).some((x) => x.id === pref.id)) (form.places = form.places || []).push({ ...pref, at: '' }); }
  if (!form.task && !form.place && !(form.places || []).length) { const lg = await api().getLeague().catch(() => null); const w = lg?.tasks.find((x) => x.place)?.place; if (w) form.place = w; }
  if (!hasAccess()) { ctx.closeSheet(); push('authors', {}); return; }   // без приглашения роликов не подают
  if (isGuest() || !isPartner()) { loginSheet(() => submitSheet()); return; }
  form.mode = form.mode || 'about'; form.places = form.places || []; form.busy = false; form.dup = null;
  await placesOf([form.place, ...form.places].filter(Boolean).map((x) => ({ place: x })));
  // номер ролика выдан заранее (02 §7.2): код SB-… для описания виден до подачи
  if (!form.v) { const r = await api().reserveVideo({ world: form.place?.world, place_id: form.place?.id }).catch(() => null); if (r) form.v = r.v; }
  svRender();
}
function keepSv() {
  const u = $('#cr-url'); if (u) form.url = u.value.trim();
  const d = $('#cr-disc'); if (d) form.disc = d.checked;
  $$('[data-at]').forEach((i) => { const x = form.places[+i.dataset.at]; if (x) x.at = i.value.trim(); });
}
function svRender() {
  const p = form.place, busy = !!form.busy, code = 'SB-' + (form.v || ''), fl = fmtLine(form.url), np = noPay();
  const what = `<p class="cr-lbl">${esc(tx('sv_what'))}</p><div class="cr-seg" role="radiogroup">${[['about', 'sv_about'], ['mention', 'sv_mention']].map(([k, l]) => `<button role="radio" data-cr="sv-mode" data-v="${k}" aria-selected="${form.mode === k}" aria-checked="${form.mode === k}">${esc(tx(l))}</button>`).join('')}</div>
    <p class="cr-p">${esc(tx(form.mode === 'about' ? 'sv_about_d' : 'sv_mention_d'))}</p>`;
  const about = form.mode === 'about' ? `<div class="cr-field"><span>${esc(tx('sv_place'))}</span><b>${p ? `${esc(pName(p))}, ${esc(pCity(p))}` : '—'}</b><button class="cr-mini" data-cr="pick" data-next="submit">${esc(p ? tx('sv_change') : tx('sv_pick'))}</button></div>` : '';
  const mention = form.mode === 'mention' ? `<div class="cr-mpl">${form.places.map((x, i) => `<div class="cr-mrow"><img src="${esc(pImg(x))}" alt=""><span class="m"><b>${esc(pName(x))}</b><small>${esc(pCity(x))}</small></span>
      <label class="cr-at"><span class="vh">${esc(tx('sv_at'))}</span><input data-at="${i}" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="${lang() === 'en' ? 'mm:ss' : 'мм:сс'}" value="${esc(x.at || '')}"></label>
      <button class="cr-ib" data-cr="sv-del" data-i="${i}" aria-label="${esc(tx('sv_del'))}">${I.close}</button></div>`).join('')}</div>
    ${form.places.length < 5 ? `<button class="btn-ghost" data-cr="pick" data-next="mention">${I.plus}${esc(tx('sv_add_place'))}</button>` : `<p class="cr-p">${esc(tx('sv_max'))}</p>`}` : '';
  const gp = `<div class="cr-tog"><span>${esc(tx('sv_gp'))}</span><button class="switch${form.gp ? ' on' : ''}" role="switch" aria-checked="${!!form.gp}" data-cr="sv-gp" aria-label="${esc(tx('sv_gp'))}"><i></i></button></div>
    ${form.gp ? `<div class="cr-note">${I.info}<span>${esc(tx(np ? 'sv_gp_on_np' : 'sv_gp_on'))}</span></div>` : ''}`;
  const dup = form.dup ? `<div class="cr-note no">${I.alert}<span><b>${esc(tx('sv_dup_h'))}</b>. ${esc(tx('sv_dup_p', { id: 'SB-' + form.dup }))}</span></div><button class="btn-ghost" data-cr="video" data-id="${esc(form.dup)}">${esc(tx('sv_dup_open'))}</button>` : '';
  sheet(`<div class="cr-sh" data-st="${busy ? 'submitting' : form.dup ? 'duplicate' : form.gp ? 'gameplay_on' : form.mode === 'mention' ? 'places' : 'form'}"><h2>${esc(tx('sv_h'))}</h2>
    <label class="cr-in"><span>${esc(tx('sv_url'))}</span><input id="cr-url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(tx('sv_url_ph'))}" value="${esc(form.url || '')}"${busy ? ' disabled' : ''}></label>
    <p class="cr-fmt" id="cr-fmt"${fl ? '' : ' hidden'}>${esc(fl)}</p>
    ${form.task ? `<div class="cr-note ok">${I.star}<span>${esc(tx('sv_task', { t: form.taskTitle || '' }))}</span></div>` : ''}${what}${about}${mention}${gp}
    ${field(tx('sv_vcode'), code, form.v ? code : '', tx('sv_vcode_note'))}
    <label class="cr-check"><input id="cr-disc" type="checkbox"${form.disc ? ' checked' : ''}${busy ? ' disabled' : ''}><span>${esc(tx('sv_disc'))}</span></label>
    ${dup}<p class="cr-err" id="cr-err" hidden></p>
    <button class="btn-primary" data-cr="sv-send"${busy ? ' disabled aria-busy="true"' : ''}>${busy ? `<span class="cr-spin" aria-hidden="true"></span>${esc(tx('sv_sending'))}` : `${I.send}${esc(tx('sv_send'))}`}</button></div>`);
  $('#cr-url')?.addEventListener('input', (e) => { form.url = e.target.value.trim(); const f = $('#cr-fmt'), t = fmtLine(form.url); if (f) { f.textContent = t; f.hidden = !t; } });
}
async function svSend() {
  keepSv();
  const mention = form.mode === 'mention';
  if (!platOf(form.url)) { err(tx('sv_bad_url')); return; }
  if (form.task && (mention ? form.places.length : 1) < (form.taskN || 1)) { err(tx('sv_task_places', { n: form.taskN })); return; }
  if (mention ? !form.places.length : !form.place) { err(tx('sv_no_place')); return; }
  if (mention && form.places.some((x) => !AT_RE.test(x.at || ''))) { err(tx('sv_bad_at')); return; }
  if (!form.disc) { err(tx('sv_disc_need')); return; }
  const places = mention ? form.places.map((x) => ({ world: x.world, id: x.id, role: 'mention', at: x.at })) : [{ world: form.place.world, id: form.place.id, role: 'about' }];
  form.busy = true; form.dup = null; svRender();
  try {
    const r = await api().submitVideo({ url: form.url, places, has_gameplay: !!form.gp, disclosure: true, v: form.v, ...(form.task ? { task_id: form.task } : {}) });
    const p = places[0], l = link(P.ref_code, p.world, p.id, r.link_v), np = noPay();
    form = {};
    sheet(`<div class="cr-sh" data-st="sent"><h2>${esc(tx('sv_ok'))}</h2><p class="sub">${esc(pName(p))}, ${esc(pCity(p))}${places.length > 1 ? ` +${places.length - 1}` : ''}</p>${steps(0, r.verify_code)}
      ${field(tx('sv_ok_code'), r.verify_code, r.verify_code)}${field(tx('sv_ok_link'), l, 'https://' + l, tx('sv_ok_link_note'))}
      ${r.account_verified ? '' : `<div class="cr-note">${I.shield}<span>${esc(tx(np ? 'sv_unv_np' : 'sv_unv'))}</span></div>`}
      <button class="btn-primary" data-cr="open:myvideos">${esc(tx('my_videos'))}</button></div>`);
    renderHub(); if (stack.length) rerender();
  } catch (e) {
    form.busy = false;
    if (e.code === 'duplicate') { form.dup = e.video_id; svRender(); return; }
    svRender();
    err(e.code === 'task_places' ? tx('sv_task_places', { n: e.need || form.taskN }) : tx({ no_place: 'sv_no_place', bad_url: 'sv_bad_url', bad_at: 'sv_bad_at', too_many: 'sv_max', need_disclosure: 'sv_disc_need', task_closed: 'sv_task_closed' }[e.code] || 'err'));
  }
}

// ───────── экран 5 «Снять про это» (02 §7.2): ссылка с номером ролика, картинка 1080×1920 для конца ролика, три подсказки ─────────
// Картинка — только наша пара «игра | жизнь» (s/og, как превью ссылок) или фото места из жизни; кадр игры крупно не ставим:
// у места без фото из жизни картинки нет (no_pair). Сохранение на iPhone — Web Share с одним файлом, иначе картинка для долгого нажатия.
const ROOTP = /\/(beta|design)\//.test(location.pathname) ? '../' : '';   // s/og лежит в корне сайта, /beta/ и /design/ ходят на уровень выше
let ogP = null;
const ogMap = () => (ogP ||= fetch(ROOTP + 's/og/p.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const CARD = { bg: '#1c1b20', text: '#ffffff', muted: '#b9b4c2', acc: { gta6: '#ff8aa0', gta5: '#f4ad3d' } };   // картинка всегда тёмная, акцент — скин игры
let shoot = null;   // { ref, v, kind:'pair'|'photo'|null, src, credit, view:'ready'|'no_pair'|'copied'|'downloaded', copied, saved, file, url }
async function cardSource(ref) {
  const p = await place(ref);
  if (!p?.pr) return { kind: null };
  if (p.pg) { const j = await ogMap(), h = j[`${ref.world}/${ref.id}`]; if (h) return { kind: 'pair', src: `${ROOTP}s/og/${ref.world}/${ref.id}.${h}.jpg` }; }
  return { kind: 'photo', src: imgUrl(p.pr.file), credit: p.pr.credit || '' };
}
function wrapText(g, text, max, lines = 2) {
  const words = String(text).split(' '), out = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width <= max || !cur) cur = t; else { out.push(cur); cur = w; } }
  if (cur) out.push(cur);
  if (out.length > lines) { out.length = lines; let t = out[lines - 1]; while (t && g.measureText(t + '…').width > max) t = t.slice(0, -1); out[lines - 1] = t.trim() + '…'; }
  return out;
}
async function drawCard(ref, v, k) {
  const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), F = '"Onest", system-ui, sans-serif', font = (w, px) => `${w} ${px}px ${F}`, X = 84, MAX = W - 2 * X;
  try { await Promise.all(['700 78px', '600 46px', '500 40px'].map((f) => document.fonts.load(`${f} "Onest"`))); } catch { }
  const [img, icon] = await Promise.all([loadImg(k.src), loadImg('icons/icon-192.png').catch(() => null)]);
  g.fillStyle = CARD.bg; g.fillRect(0, 0, W, H);
  if (icon) g.drawImage(icon, X, 112, 80, 80);
  g.fillStyle = CARD.text; g.font = font(600, 46); g.textBaseline = 'alphabetic'; g.fillText(APP.shortName, X + (icon ? 104 : 0), 168);
  g.font = font(700, 78); let y = 330;
  for (const t of wrapText(g, pName(ref), MAX)) { g.fillText(t, X, y); y += 88; }
  g.fillStyle = CARD.muted; g.font = font(500, 40); g.fillText(pCity(ref), X, y - 20);
  let y0 = Math.max(560, y + 40), yT;
  if (k.kind === 'pair') { g.drawImage(img, 0, y0, W, Math.round(W * img.height / img.width)); yT = y0 + Math.round(W * img.height / img.width) + 110; }
  else {
    // CC BY-SA и непонятные лицензии — фото целиком, без обрезки (как tools/og_render.py licence()); CC0, PD, CC BY — по ширине
    const h = 700, whole = !/CC0|PUBLIC DOMAIN|CC BY (?!-?SA)/i.test(k.credit) || /BY-SA|GFDL/i.test(k.credit);
    if (whole) { const s = Math.min(W / img.width, h / img.height), dw = img.width * s, dh = img.height * s; g.drawImage(img, (W - dw) / 2, y0 + (h - dh) / 2, dw, dh); }
    else { const s = Math.max(W / img.width, h / img.height), sw = W / s, sh = h / s; g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, y0, W, h); }
    g.fillStyle = CARD.muted; g.font = font(500, 26); g.fillText(wrapText(g, tx('card_photo', { c: k.credit }), MAX, 1)[0], X, y0 + h + 44);
    yT = y0 + h + 140;
  }
  g.fillStyle = CARD.muted; g.font = font(500, 40); g.fillText(tx('card_cmp'), X, yT);
  const l = link(P.ref_code);
  let px = 70; g.font = font(700, px); while (g.measureText(l).width > MAX && px > 40) { px -= 2; g.font = font(700, px); }
  g.fillStyle = CARD.acc[ref.world] || CARD.acc.gta6; g.fillText(l, X, yT + 96);
  g.fillStyle = CARD.text; g.font = font(600, 44); g.fillText(`@${P.nick}, ${tx('card_code', { c: P.ref_code })}`, X, yT + 170);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.92));
  const name = `secretbase-${P.ref_code}-${slugOf(ref.id, ref.world)}.jpg`;
  return { blob, url: URL.createObjectURL(blob), file: new File([blob], name, { type: 'image/jpeg' }) };
}
async function shootSheet(world, id) {
  await load();
  if (!hasAccess()) { ctx.closeSheet(); push('authors', {}); return; }
  if (isGuest() || !isPartner()) { loginSheet(() => shootSheet(world, id)); return; }
  const ref = { world, id }; await place(ref);
  const [r, k] = await Promise.all([api().reserveVideo({ world, place_id: id }), cardSource(ref)]);
  if (shoot?.url) URL.revokeObjectURL(shoot.url);
  shoot = { ref, v: r.v, ...k, view: k.kind ? 'ready' : 'no_pair', copied: false, saved: false, file: null, url: '' };
  shootRender();
  if (!k.kind) return;
  const mine = shoot;
  drawCard(ref, r.v, k).then((c) => {
    if (shoot !== mine) { URL.revokeObjectURL(c.url); return; }
    Object.assign(shoot, c);
    const im = $('#cr-shot-pv'); if (im) { im.src = c.url; im.closest('.cr-shot')?.classList.remove('wait'); im.closest('.cr-shot')?.querySelector('.wt')?.remove(); }
    const b = $('[data-cr="sh-save"]'); if (b) b.disabled = false;
  }).catch(() => { });
}
function shootRender() {
  const s = shoot, ref = s.ref, l = link(P.ref_code, ref.world, ref.id, s.v), np = noPay();
  const card = s.kind ? `<div class="cr-shot${s.url ? '' : ' wait'}"><img id="cr-shot-pv" alt="" width="108" height="192"${s.url ? ` src="${s.url}"` : ''}><span class="m"><b>${esc(tx('sh_card'))}</b><small>${esc(tx(s.kind === 'pair' ? 'sh_card_pair' : 'sh_card_photo'))}</small>${s.url ? '' : `<small class="wt">${esc(tx('sh_making'))}</small>`}</span></div>`
    : `<div class="cr-note">${I.info}<span><b>${esc(tx('sh_nopair_h'))}</b>. ${esc(tx('sh_nopair_p'))}</span></div>`;
  const done = (s.saved ? `<div class="cr-note ok">${I.check}<span><b>${esc(tx('sh_saved'))}</b>. ${esc(tx('sh_saved_p'))}</span></div>` : '')
    + (s.copied ? `<div class="cr-note ok">${I.check}<span><b>${esc(tx('sh_copied'))}</b>. ${esc(tx('sh_copied_p'))}</span></div>` : '');
  const tips = [tx('sh_t1'), tx('sh_t2'), tx(np ? 'sh_t3_np' : 'sh_t3')];
  sheet(`<div class="cr-sh" data-st="${esc(s.view)}"><h2>${esc(tx('sh_h'))}</h2><p class="sub">${esc([pName(ref), pCity(ref)].filter(Boolean).join(', '))}</p>
    ${field(tx('sh_link'), l, '', tx('sh_link_note', { v: s.v }))}
    ${card}
    <div class="cr-steps cr-tips">${tips.map((t, i) => `<div>${[I.pin, I.voice, I.camera][i]}<span>${esc(t)}</span></div>`).join('')}</div>
    ${done}
    ${s.kind ? `<button class="btn-primary" data-cr="sh-save"${s.url ? '' : ' disabled'}>${I.share}${esc(tx('sh_save'))}</button>` : ''}
    <button class="${s.kind ? 'btn-ghost' : 'btn-primary'}" data-cr="sh-copy">${s.copied ? I.check : I.copy}${esc(tx(s.copied ? 'copied' : 'sh_copy'))}</button>
    <button class="btn-ghost" data-cr="sh-submit">${I.video}${esc(tx('sh_submit'))}</button></div>`);
}
// сохранить картинку: Web Share только с файлом — без ссылки и текста (check_code.py правило 2), иначе — картинка на весь экран для долгого нажатия
async function saveCard() {
  const s = shoot; if (!s?.file) return;
  if (navigator.canShare?.({ files: [s.file] })) {
    try { await navigator.share({ files: [s.file] }); s.saved = true; s.view = 'downloaded'; shootRender(); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  sheet(`<div class="cr-sh" data-st="hold"><h2>${esc(tx('sh_hold_h'))}</h2><p class="sub">${esc(tx('sh_hold_p'))}</p>
    <img class="cr-shot-big" src="${s.url}" alt="${esc(tx('sh_card'))}" width="1080" height="1920"><button class="btn-primary" data-cr="sh-held">${esc(tx('done'))}</button></div>`);
}
async function pickSheet(next, world) {
  const g = world || form.place?.world || ctx?.game?.() || 'gta6';
  sheet(`<div class="cr-sh"><h2>${esc(tx('pick_h'))}</h2><label class="cr-in"><span class="vh">${esc(tx('pick_ph'))}</span><input id="cr-q" type="search" autocomplete="off" placeholder="${esc(tx('pick_ph'))}" enterkeyhint="search"></label><div class="cr-picks" id="cr-picks"></div></div>`);
  const box = $('#cr-picks'), d = await loadPlaces(g);
  const draw = (q) => {
    const res = (q ? searchPlaces(d, q) : featured(d, 'place', 12)).slice(0, 12);
    box.innerHTML = res.length ? res.map((o) => `<button class="cr-li" data-cr="picked" data-w="${g}" data-p="${esc(o.id)}" data-next="${next}"><img src="${esc(thumbOf(o))}" alt="" loading="lazy"><span class="m"><b>${esc(shortName(realOf(o)))}</b><small>${esc(o.a || '')}</small></span></button>`).join('') : `<p class="cr-p">${esc(tx('pick_none'))}</p>`;
  };
  draw('');
  $('#cr-q').addEventListener('input', (e) => draw(e.target.value.trim()));
}
let loginNext = null, loginEmail = '';
function loginSheet(next, draft = false) {
  loginNext = next || null; if (!draft) loginFor = null;
  if (!isGuest() && !isPartner() && !isMinor() && hasAccess()) { ageSheet(); return; }   // вошёл, но не партнёр — экран 2
  sheet(`<div class="cr-sh"><h2>${esc(tx(draft ? 'lg_h_c' : 'lg_h'))}</h2><p class="sub">${esc(tx(draft ? 'lg_sub_c' : 'lg_sub'))}</p>
    <label class="cr-in"><span>${esc(tx('lg_email'))}</span><input id="cr-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="name@mail.com" value="${esc(loginEmail || P?.email || '')}"></label>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="lg-send">${I.mail}${esc(tx('lg_send'))}</button>
    <p class="cr-p">${esc(tx('lg_note'))}${draft ? ' ' + esc(tx('lg_draft')) + '.' : ''}</p></div>`);
}
function codeSheet() {
  sheet(`<div class="cr-sh"><h2>${esc(tx('lg_code_h'))}</h2><p class="sub">${esc(tx('lg_code_sub', { e: loginEmail }))}</p>
    <label class="cr-in"><span>${esc(tx('lg_code'))}</span><input id="cr-code" class="otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="0000"></label>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="lg-code">${esc(tx('lg_enter'))}</button></div>`);
}
// «Стать партнёром» — отдельный экран (08 №2): 18+, правила, страна. Старая шторка 18+ — только запасной путь
function ageSheet() {
  if (hasAccess()) { ctx.closeSheet(); loginNext = null; push('partner', {}); return; }
  sheet(`<div class="cr-sh"><h2>${esc(tx('lg_age_h'))}</h2><p class="sub">${esc(tx('lg_age_sub'))}</p>
    <div class="cr-two"><button class="btn-primary" data-cr="lg-age" data-v="1">${esc(tx('lg_yes'))}</button><button class="btn-ghost" data-cr="lg-age" data-v="0">${esc(tx('lg_no'))}</button></div></div>`);
}
async function afterLogin() {
  P = await api().getProfile(); ctx?.onProfile?.(P); await renderHub(); if (stack.length) await rerender();
  const n = loginNext; loginNext = null; loginFor = null;
  if (n) n(); else ctx.closeSheet();
}
// ───────── экран 10 «Вывод» (02 §7.8): first (проверка личности у Whop), kyc_pending, below, ready, queued, paid, failed;
// beta_off — выплат пока нет: «Выплаты начнутся, когда программа откроется для всех» (08 §2.4). Одна разметка на все состояния:
// сумма, строка статуса, полоса до минимума (below, beta_off), три шага, способ выплаты, одна главная кнопка ─────────
const IN_ROUND = ['queued', 'approved', 'sent'];
function payoutState(e) {
  const p = e.payout, av = e.totals.available, kyc = P.kyc || 'none';
  if (!R.payouts_open) return 'beta_off';
  if (p?.status === 'failed') return 'failed';
  if (p && IN_ROUND.includes(p.status)) return 'queued';
  if (p?.status === 'paid' && av < R.payout_min_cents) return 'paid';
  if (av < R.payout_min_cents) return 'below';
  if (kyc === 'pending') return 'kyc_pending';
  return kyc === 'verified' ? 'ready' : 'first';
}
async function payoutHTML() {
  if (!moneyOK()) return `${head(tx('pro_days'))}${body(await earnBody())}`;   // РФ, РБ, младше 18 — дни Pro, о выплатах ни слова
  const [e, p] = await Promise.all([api().getEarnings(), api().getProfile()]); P = p;
  const st = payoutState(e), av = e.totals.available, pv = R.payout_provider, min = money(R.payout_min_cents), d = dfmt(e.round_date), pay = e.payout;
  const big = st === 'queued' ? [tx('in_payout'), pay.amount_cents] : st === 'paid' ? [tx('paid'), pay.amount_cents] : [tx(st === 'beta_off' ? 'wd_av_pre' : 'wd_av'), av];
  const NOTE = {
    beta_off: ['', I.clock, tx('beta_pay')], below: ['', I.clock, tx('wd_below_h', { min })],
    first: ['', I.shield, P.kyc === 'failed' ? tx('wd_kyc_fail', { p: pv }) : tx('wd_first', { p: pv })], kyc_pending: ['', I.clock, tx('wd_kyc_h', { p: pv, e: P.email || '' })],
    ready: ['ok', I.check, tx('wd_ready', { s: money2(av), d, min })], queued: ['ok', I.clock, tx('wd_queued', { d: dfmt(pay?.round_date || e.round_date), s: money2(pay?.amount_cents || 0) })],
    paid: ['ok', I.check, tx('wd_s_paid', { s: money2(pay?.amount_cents || 0), d: dfmt(pay?.paid_at || pay?.round_date || e.round_date) })], failed: ['no', I.alert, tx('wd_failed', { p: pv })],
  }[st];
  const kycOK = P.kyc === 'verified', sent = st === 'queued' || st === 'paid';
  const S = [[kycOK, tx('wd_s1', { p: pv })], [sent, tx('wd_s2', { min })], [st === 'paid', tx('wd_s3', { d, big: money(R.big_payout_cents) })]];
  const BTN = {
    beta_off: ['submit', I.video + esc(tx('submit_video'))], below: ['submit', I.video + esc(tx('submit_video'))], paid: ['submit', I.video + esc(tx('submit_video'))],
    first: ['wd-kyc', I.shield + esc(tx('wd_kyc_go'))], kyc_pending: ['wd-check', esc(tx('wd_kyc_check'))], ready: ['wd-send', I.wallet + esc(tx('withdraw', { s: money2(av) }))],
    queued: ['back', esc(tx('done'))], failed: ['wd-send', esc(tx('wd_retry'))],
  }[st];
  const barRow = st === 'below' || st === 'beta_off' ? `<div class="cr-wd">${bar(av / R.payout_min_cents * 100)}<span>${esc(tx('e_below', { s: money2(av), min }))}</span></div>` : '';
  return `${head(tx('wd_title'))}${body(`<div class="cr-sbig" data-st="${st}"><span>${esc(big[0])}</span><b>${money2(big[1])}</b></div>
    <div class="cr-note${NOTE[0] ? ' ' + NOTE[0] : ''}">${NOTE[1]}<span>${esc(NOTE[2])}</span></div>${barRow}
    <div class="cr-steps">${S.map(([on, t]) => `<div class="${on ? 'on' : ''}">${on ? I.check : I.clock}<span>${esc(t)}</span></div>`).join('')}</div>
    <p class="cr-p">${esc(tx('wd_method', { p: pv }))}</p><p class="cr-err" id="cr-err" hidden></p>
    <button class="btn-primary" data-cr="${BTN[0]}">${BTN[1]}</button><button class="btn-ghost" data-cr="open:rules">${esc(tx('rules'))}</button>`)}`;
}
// проверка личности идёт у Whop: экран сам смотрит статус раз в 3 с, пока состояние kyc_pending
function bindPayout(scr) {
  if (!scr.querySelector('[data-st="kyc_pending"]')) return;
  const t = setInterval(async () => {
    if (!scr.isConnected) { clearInterval(t); return; }
    const p = await api().getProfile().catch(() => null);
    if (p && p.kyc !== 'pending') { clearInterval(t); P = p; const top = stack[stack.length - 1]; if (top && top.el === scr) rerender(); }
  }, 3000);
}
function inviteSheet() {
  sheet(`<div class="cr-sh"><h2>${esc(tx('inv_h'))}</h2><p class="sub">${esc(tx('inv_p'))}</p>
    <label class="cr-in"><span>${esc(tx('inv_h'))}</span><input id="cr-inv" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(tx('inv_ph'))}"></label>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="inv-send">${esc(tx('inv_send'))}</button></div>`);
}

// ───────── список ожидания и приглашение (08 §2.1, §2.2) ─────────
let wlForm = { platforms: [] };
function wlSheet(step = 1) {
  if (step === 1) {
    sheet(`<div class="cr-sh"><h2>${esc(tx('wj_h'))}</h2><p class="sub">${esc(tx('wj_sub'))}</p>
      <label class="cr-in"><span>${esc(tx('lg_email'))}</span><input id="cr-wmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="name@mail.com" value="${esc(wlForm.email || '')}"></label>
      <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="wl-next">${esc(tx('next'))}</button></div>`);
    return;
  }
  if (step === 2) {
    sheet(`<div class="cr-sh"><h2>${esc(tx('wj_where'))}</h2><p class="sub">${esc(tx('wj_where_sub'))}</p>
      <div class="cr-chips">${['tiktok', 'youtube', 'instagram'].map((k) => `<button data-cr="wl-pl" data-v="${k}" aria-pressed="${wlForm.platforms.includes(k)}">${esc(PLAT[k])}</button>`).join('')}</div>
      <label class="cr-in"><span>${esc(tx('wj_profile'))}</span><input id="cr-wprof" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(tx('wj_profile_ph'))}" value="${esc(wlForm.profile || '')}"></label>
      <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="wl-send">${esc(tx('wj_send'))}</button></div>`);
    return;
  }
  const w = P.waitlist || {};
  sheet(`<div class="cr-sh"><h2>${esc(tx('wl_joined', { n: num(w.no) }))}</h2><p class="sub">${esc(tx('wl_joined_p'))}</p>
    <div class="cr-note">${I.shield}<span>${esc(tx('wl_early'))}</span></div>
    <button class="btn-primary" data-cr="open:verify">${esc(tx('wl_verify'))}</button><button class="btn-ghost" data-cr="sheet-close">${esc(tx('done'))}</button></div>`);
}
function inviteBetaSheet() {
  sheet(`<div class="cr-sh"><h2>${esc(tx('inv_b_h'))}</h2><p class="sub">${esc(tx('inv_b_sub'))}</p>
    <label class="cr-in"><span>${esc(tx('inv_b_h'))}</span><input id="cr-binv" class="cr-codein" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" placeholder="SB-"></label>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="inv-b-send">${esc(tx('inv_b_send'))}</button></div>`);
}
const err = (t) => { const e = $('#cr-err'); if (e) { e.hidden = false; e.textContent = t; } };
// после входа почтой: партнёр — дальше по просьбе, иначе — «Стать партнёром» (экран 2)
async function afterSignIn() {
  P = await api().getProfile(); ctx?.onProfile?.(P); renderHub();
  if (loginFor === 'contrib' || isPartner() || isMinor() || !hasAccess()) return afterLogin();   // вклад: после входа — сразу отправка черновика
  ctx.closeSheet(); loginNext = null; push('partner', {});
}

// ───────── экран 2 «Стать партнёром»: 18+, правила, страна (02 §7.1, §7.9) ─────────
const COUNTRIES = ['US', 'CA', 'GB', 'IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'PL', 'UA', 'KZ', 'TR', 'MX', 'BR', 'CL', 'AR', 'IN', 'ID', 'PH', 'AU', 'AE', 'RU', 'BY'];
const cName = (c) => { try { return new Intl.DisplayNames([lang()], { type: 'region' }).of(c) || c; } catch { return c; } };
const stepLbl = (a) => `<p class="cr-lbl">${esc(tx('pt_step', { a, b: 4 }))}</p>`;
function partnerStep(a = {}) {
  if (a.step) return a.step;
  if (isMinor()) return 'minor';
  if (!P.adult_at) return 'age';
  if (!P.terms_at) return 'terms';
  if (isPartner() && noPay()) return 'nopay';
  return 'country';
}
function partnerHTML(a = {}) {
  const st = partnerStep(a), h = head(tx('wl_partner'));
  if (st === 'age') return `${h}${body(`${stepLbl(1)}<h2 class="cr-q">${esc(tx('lg_age_h'))}</h2><p class="cr-lead">${esc(tx('pt_age_sub'))}</p>
    <div class="cr-two"><button class="btn-primary" data-cr="pt-age" data-v="1">${esc(tx('lg_yes'))}</button><button class="btn-ghost" data-cr="pt-age" data-v="0">${esc(tx('lg_no'))}</button></div>`)}`;
  if (st === 'minor') return `${h}${body(`<div class="cr-empty">${I.star}<b>${esc(tx('pt_minor_h'))}</b><p>${esc(tx('pt_minor_p'))}</p>
    <button class="btn-primary" data-cr="add">${I.plus}${esc(tx('pt_add'))}</button><button class="btn-ghost" data-cr="close">${esc(tx('done'))}</button></div>`)}`;
  if (st === 'terms') {
    const m = money, v = { r: m(R.rpm.tiktok), rs: m(R.rpm.shorts), min: m(R.payout_min_cents), cap: m(R.rpm_cap_cents), floor: m(R.rpm_min_cents), h: R.hold_days, day: R.payout_day,
      np: m(R.new_partner_cap_cents), big: m(R.big_payout_cents), ah: R.appeal_hours, nd: R.rules_notice_days };
    const T = [['tm_rate', 'tm_rate_v'], ['tm_count', 'tm_count_v'], ['tm_hold', 'tm_hold_v'], ['tm_lim', 'tm_lim_v'], ['tm_no', 'tm_no_v'], ['tm_appeal', 'tm_appeal_v'], ['tm_change', 'tm_change_v']];
    return `${h}${body(`${stepLbl(2)}<h2 class="cr-q">${esc(tx('pt_terms_h'))}</h2><p class="cr-lead">${esc(tx('pt_terms_sub'))}</p>
      <ol class="cr-terms">${T.map(([a1, b1]) => `<li><b>${esc(tx(a1))}</b><span>${esc(tx(b1, v))}</span></li>`).join('')}</ol>
      <label class="cr-check"><input id="cr-terms" type="checkbox"><span>${esc(tx('pt_accept'))}</span></label>
      <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="pt-terms">${esc(tx('next'))}</button>
      <button class="btn-ghost" data-cr="open:rules">${esc(tx('rules'))}</button>`, '', true)}`;
  }
  if (st === 'country') {
    const guess = String(P.country || (navigator.language || '').split('-')[1] || 'US').toUpperCase();
    const list = COUNTRIES.includes(guess) ? COUNTRIES : [guess, ...COUNTRIES];
    return `${h}${body(`${stepLbl(3)}<h2 class="cr-q">${esc(tx('pt_country_h'))}</h2><p class="cr-lead">${esc(tx('pt_country_sub'))}</p>
      <label class="cr-in"><span>${esc(tx('pt_country'))}</span><select id="cr-country">${list.map((c) => `<option value="${c}"${c === guess ? ' selected' : ''}>${esc(cName(c))}</option>`).join('')}</select></label>
      <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="pt-country">${esc(tx('next'))}</button>`)}`;
  }
  // nopay: Россия, Беларусь — роль партнёра есть, вместо денег дни Pro; о выплатах ни слова (02 §7.1 п. 4)
  return `${h}${body(`<div class="cr-empty">${I.star}<b>${esc(tx('pt_np_h'))}</b><p>${esc(tx('pt_np_p'))}</p>
    <button class="btn-primary" data-cr="vf-go">${esc(tx('wl_verify'))}</button><button class="btn-ghost" data-cr="close">${esc(tx('done'))}</button></div>`)}`;
}

// ───────── экран 3 «Подтверждение канала»: pick, code, pending, verified, failed (02 §7.1 п. 5) ─────────
let vfForm = { platform: 'tiktok', url: '' };
const VF_PH = { tiktok: 'tiktok.com/@ник', youtube: 'youtube.com/@ник', instagram: 'instagram.com/ник' };
async function verifyHTML(a = {}) {
  P = await api().getProfile();
  const acc = a.pick ? null : (a.id ? (P.accounts || []).find((x) => x.id === a.id) : workingAcc() || (a.flow ? null : verifiedAcc()));
  const view = !acc ? 'pick' : acc.status === 'pending' ? (a.view === 'code' ? 'code' : 'pending') : acc.status;
  const h = head(tx('vf_h')), lbl = a.flow ? stepLbl(4) : '';
  if (view === 'pick') {
    return `${h}${body(`${lbl}<h2 class="cr-q">${esc(tx('vf_h'))}</h2><p class="cr-lead">${esc(tx('vf_sub'))}</p>
      <div class="cr-seg" role="radiogroup">${['tiktok', 'youtube', 'instagram'].map((k) => `<button role="radio" data-cr="vf-pl" data-v="${k}" aria-selected="${vfForm.platform === k}" aria-checked="${vfForm.platform === k}">${esc(PLAT[k])}</button>`).join('')}</div>
      <label class="cr-in"><span>${esc(tx('vf_url'))}</span><input id="cr-vurl" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(VF_PH[vfForm.platform])}" value="${esc(vfForm.url)}"></label>
      <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="vf-send">${esc(tx('next'))}</button>`)}`;
  }
  const pn = PLAT[acc.platform] || acc.platform, c = acc.verify_code, hd = acc.handle;
  if (view === 'code') {
    return `${h}${body(`${lbl}<h2 class="cr-q">${esc(tx('vf_code_h'))}</h2><p class="cr-lead">${esc(tx('vf_code_p', { c }))}</p>
      <div class="cr-code"><span>${esc(pn)}, ${esc(hd)}</span><b>${esc(c)}</b><button class="cr-mini" data-cr="copy" data-v="${esc(c)}">${I.copy}${esc(tx('copy'))}</button></div>
      <div class="cr-steps">${[tx('vf_code_s1', { h: hd, p: pn }), tx('vf_code_s2'), tx('vf_code_s3')].map((t, i) => `<div>${[I.link, I.doc, I.check][i]}<span>${esc(t)}</span></div>`).join('')}</div>
      <p class="cr-p">${esc(tx('vf_code_note'))}</p><button class="btn-primary" data-cr="vf-check" data-id="${esc(acc.id)}">${esc(tx('vf_check'))}</button>`)}`;
  }
  if (view === 'pending') {
    return `${h}${body(`${lbl}<div class="cr-empty" data-wait="${esc(acc.id)}">${I.clock}<b>${esc(tx('vf_pending_h'))}</b><p>${esc(tx('vf_pending_p', { c, h: hd }))}</p></div>
      <div class="cr-code"><span>${esc(pn)}, ${esc(hd)}</span><b>${esc(c)}</b><button class="cr-mini" data-cr="copy" data-v="${esc(c)}">${I.copy}${esc(tx('copy'))}</button></div>
      <button class="btn-primary" data-cr="vf-again">${esc(tx('vf_again'))}</button><button class="btn-ghost" data-cr="vf-other">${esc(tx('vf_other'))}</button>`)}`;
  }
  if (view === 'failed') {
    return `${h}${body(`${lbl}<div class="cr-empty">${I.alert}<b>${esc(tx('vf_fail_h'))}</b><p>${esc(tx('vf_fail_p', { h: hd, c }))}</p></div>
      <div class="cr-code"><span>${esc(pn)}, ${esc(hd)}</span><b>${esc(c)}</b><button class="cr-mini" data-cr="copy" data-v="${esc(c)}">${I.copy}${esc(tx('copy'))}</button></div>
      <button class="btn-primary" data-cr="vf-retry" data-id="${esc(acc.id)}">${esc(tx('vf_again'))}</button><button class="btn-ghost" data-cr="vf-other">${esc(tx('vf_other'))}</button>`)}`;
  }
  const partner = isPartner();
  return `${h}${body(`${lbl}<div class="cr-empty">${I.check}<b>${esc(tx('vf_ok_h'))}</b><p>${esc(tx('vf_ok_p', { h: hd, p: pn }))}</p></div>
    ${partner && !noPay() ? `<div class="cr-note ok">${I.star}<span>${esc(a.flow || !workPro() ? tx('vf_ok_pro') : tx('dn_pro', { d: dfmt(String(workPro()).slice(0, 10)) }))}</span></div>` : !partner ? `<div class="cr-note ok">${I.check}<span>${esc(tx('vf_ok_wl'))}</span></div>` : ''}
    <button class="btn-primary" data-cr="${partner ? 'vf-next' : 'close'}">${esc(partner ? tx('next') : tx('done'))}</button>`)}`;
}
// ожидание проверки: экран сам смотрит статус раз в 3 секунды, пока открыт
function bindVerify(scr, a) {
  const w = scr.querySelector('[data-wait]'); if (!w) return;
  const id = w.dataset.wait;
  const t = setInterval(async () => {
    if (!scr.isConnected) { clearInterval(t); return; }
    const p = await api().getProfile().catch(() => null), acc = p?.accounts?.find((x) => x.id === id);
    if (acc && acc.status !== 'pending') { clearInterval(t); P = p; ctx?.onProfile?.(p); renderHub(); const top = stack[stack.length - 1]; if (top && top.el === scr) { top.args = { ...a, id, view: '' }; rerender(); } }
  }, 3000);
}

// ───────── экран 4 «Готово»: ссылка, код, рабочий Pro, «Снять про это место», «Подать ролик» (02 §7.1) ─────────
async function doneHTML() {
  P = await api().getProfile();
  const l = link(P.ref_code), lg = await api().getLeague().catch(() => null), wk = lg?.tasks?.find((x) => x.kind === 'place_week')?.place || null;
  if (wk) await place(wk);
  const w = workPro();
  return `${head(tx('dn_h'), { noBack: true, close: true })}${body(`<div class="cr-empty cr-done">${I.check}<b>${esc(tx('dn_sub'))}</b><p>@${esc(P.nick)}</p></div>
    ${field(tx('dn_link'), l, 'https://' + l)}${field(tx('dn_code'), P.ref_code, P.ref_code)}
    ${w && active(w) ? `<div class="cr-note ok">${I.star}<span>${esc(tx('dn_pro', { d: dfmt(String(w).slice(0, 10)) }))}</span></div>` : ''}
    ${wk ? `<button class="cr-li" data-cr="dn-shoot" data-w="${esc(wk.world)}" data-p="${esc(wk.id)}"><img src="${esc(pImg(wk))}" alt="" loading="lazy"><span class="m"><b>${esc(tx('dn_shoot'))}</b><small>${esc(tx('dn_shoot_d', { p: pName(wk) }))}</small></span>${I.chevron}</button>` : ''}
    <button class="btn-primary" data-cr="submit">${I.video}${esc(tx('dn_submit'))}</button><button class="btn-ghost" data-cr="close">${esc(tx('dn_hub'))}</button>`)}`;
}

// ───────── экран 18 «Для админов» (только веб): вход по коду, demo, приглашения, список ожидания, каналы ─────────
async function adminHTML() {
  const st = await api().adminState();
  if (!st.admin) {
    return `${head(tx('ad_h'))}${body(`<label class="cr-in"><span>${esc(tx('ad_code'))}</span><input id="cr-adm" type="password" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>
      <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="ad-in">${esc(tx('ad_in'))}</button>`)}`;
  }
  const [inv, wl, req, cq] = await Promise.all([api().listInvites().catch(() => []), api().getWaitlistStats().catch(() => null), api().listAccountRequests().catch(() => []),
    api().listContributionRequests().catch(() => [])]);
  await placesOf(cq);
  const seg = (cr, opts, cur) => `<div class="cr-seg">${opts.map(([v, l]) => `<button data-cr="${cr}" data-v="${v}" aria-selected="${cur === v}">${esc(tx(l))}</button>`).join('')}</div>`;
  const until = inv.find((x) => !x.used)?.until || '2026-12-31';
  return `${head(tx('ad_h'))}${body(`<h2 class="cr-h">${esc(tx('ad_mode'))}</h2>
    <p class="cr-lbl">${esc(tx('ad_demo'))}</p>${seg('ad-demo', [['0', 'ad_off'], ['1', 'ad_on']], st.demo ? '1' : '0')}
    <p class="cr-p">${esc(tx('ad_demo_p'))}</p>
    ${st.demo ? `<p class="cr-lbl">${esc(tx('ad_stage'))}</p>${seg('ad-stage', [['partner', 'ad_st_partner'], ['start', 'ad_st_start']], st.stage)}${seg('ad-stage', [['mod', 'ad_st_mod'], ['exam', 'ad_st_exam']], st.stage)}<button class="btn-ghost" data-cr="ad-stage" data-v="${esc(st.stage)}">${esc(tx('ad_reset'))}</button>` : ''}
    <h2 class="cr-h">${esc(tx('ad_inv'))}</h2><p class="cr-p">${esc(tx('ad_inv_p', { d: dfmt(until) }))}</p>
    <div class="cr-two"><button class="btn-primary" data-cr="ad-make">${I.plus}${esc(tx('ad_make'))}</button>${inv.length ? `<button class="btn-ghost" data-cr="copy" data-v="${esc(inv.filter((x) => !x.used).map((x) => x.code).join('\n'))}">${esc(tx('ad_copy_all'))}</button>` : ''}</div>
    <p class="cr-err" id="cr-err" hidden></p>
    ${inv.length ? `<div class="cr-inv">${inv.map((x) => `<div><b>${esc(x.code)}</b><small>${esc(x.used ? tx('ad_inv_used') : dfmt(x.until))}</small><button class="cr-mini" data-cr="copy" data-v="${esc(x.code)}">${I.copy}${esc(tx('copy'))}</button></div>`).join('')}</div>` : `<p class="cr-p">${esc(tx('ad_inv_none'))}</p>`}
    <h2 class="cr-h">${esc(tx('ad_wl'))}</h2>
    ${wl ? `<p class="cr-lead">${esc(tx('ad_wl_line', { j: num(wl.joined), v: num(wl.verified), g: num(wl.goal_verified) }))}</p>
      <div class="cr-wlbar"><span>${esc(tx('ad_wl_j'))}</span>${bar(wl.joined / wl.goal_joined * 100)}<span class="cr-prog">${esc(tx('of', { a: num(wl.joined), b: num(wl.goal_joined) }))}</span></div>
      <div class="cr-wlbar"><span>${esc(tx('ad_wl_v'))}</span>${bar(wl.verified / wl.goal_verified * 100)}<span class="cr-prog">${esc(tx('of', { a: num(wl.verified), b: num(wl.goal_verified) }))}</span></div>` : ''}
    <p class="cr-p">${esc(tx('ad_wl_p'))}</p>
    <h2 class="cr-h">${esc(tx('ad_req'))}</h2><p class="cr-p">${esc(tx('ad_req_p'))}</p>
    ${req.length ? `<div class="cr-reqs">${req.map((r) => `<div><span class="m"><b>@${esc(String(r.nick).replace(/^@/, ''))}, ${esc(PLAT[r.platform] || r.platform)}</b><small>${esc(r.url)}, ${esc(tx('ml_code').toLowerCase())} ${esc(r.verify_code)}</small></span>
      ${r.status === 'pending' ? `<span class="b"><button class="cr-mini acc" data-cr="ad-mark" data-id="${esc(r.id)}" data-v="verified">${esc(tx('ad_yes'))}</button><button class="cr-mini" data-cr="ad-mark" data-id="${esc(r.id)}" data-v="failed">${esc(tx('ad_no'))}</button></span>` : `<span class="cr-tag ${r.status === 'verified' ? 'ok' : 'no'}">${esc(tx('ad_st_' + r.status))}</span>`}</div>`).join('')}</div>` : `<p class="cr-p">${esc(tx('ad_req_none'))}</p>`}
    <h2 class="cr-h">${esc(tx('ad_cq'))}</h2><p class="cr-p">${esc(tx('ad_cq_p'))}</p>
    ${cq.length ? `<div class="cr-reqs">${cq.map((c) => `<div><span class="m"><b>${esc(tx('ct_' + c.type))}: ${esc(cbName(c))}</b><small>${c.nick ? `@${esc(c.nick)}, ` : ''}${esc(dfmt(c.created_at))}${c.source_url ? `, ${esc(c.source_url)}` : ''}</small></span>
      <span class="b"><button class="cr-mini acc" data-cr="ad-cq" data-id="${esc(c.id)}" data-v="accepted">${esc(tx('ad_accept'))}</button><button class="cr-mini" data-cr="ad-cq" data-id="${esc(c.id)}" data-v="rejected">${esc(tx('ad_reject'))}</button></span></div>`).join('')}</div>`
      : `<p class="cr-p">${esc(tx('ad_cq_none'))}</p>`}
    <button class="btn-ghost" data-cr="ad-out">${esc(tx('ad_out'))}</button>`)}`;
}

// ───────── экраны ─────────
const SCREENS = {
  league: {
    html: async (a) => {
      const tab = a.tab || 'tasks', big = tab === 'tasks';
      const title = isMinor() ? tx('league') : noPay() ? tx('title_np') : tx('title');
      const hd = big ? `<header class="cr-hd big"><h1>${esc(title)}</h1><button class="cr-ib" data-cr="close" aria-label="${esc(tx('close'))}">${I.close}</button></header>${noPay() || isMinor() ? '' : `<div class="cr-sub">${esc(medLine())}</div>`}`
        : head(tx('league'), { noBack: true, close: true });
      return `${hd}<nav class="cr-tabs" role="tablist">${LTABS.map((k) => `<button role="tab" data-cr="ltab" data-v="${k}" aria-selected="${k === tab}">${esc(tx('tab_' + k))}</button>`).join('')}</nav>${body(await leagueTab(tab))}`;
    },
    bind: (s) => bindChart(s),
  },
  earn: { html: async () => `${head(moneyOK() ? tx('my_earn') : tx('pro_days'))}${body(await earnBody())}`, bind: (s) => bindChart(s) },
  myvideos: { html: async (a) => `${head(tx('my_videos'))}${body(await myVideosHTML(a.filter || 'all'))}` },
  mylink: { html: mylinkHTML },
  rules: { html: async () => rulesHTML() },
  review: { html: reviewHTML, bind: (s) => { if (s.querySelector('[data-deck]')) bindDeck(s); } },
  exam: { html: examHTML, bind: (s) => { if (s.querySelector('[data-deck]')) bindDeck(s); } },
  payout: { html: payoutHTML, bind: bindPayout },
  feed: { html: async (a) => `<div class="cr-vscr">${await feedHTML(a)}</div>`, bind: bindFeed },
  // без приглашения: вместо денежных экранов — список ожидания (08 §2, задача 2)
  authors: { html: async () => `${head(tx('for_authors'))}${body(`${waitlistHTML()}<p class="cr-p">${esc(tx('gate_p'))}</p>`, '', true)}` },
  partner: { html: async (a) => partnerHTML(a) },
  verify: { html: verifyHTML, bind: bindVerify },
  done: { html: doneHTML },
  vstats: { html: async (a) => `${head(tx('vstat_h'))}${body(await vstatsHTML(a))}`, bind: (s) => bindChart(s) },
  admin: { html: adminHTML },
  board: { html: boardHTML },
  contribs: { html: async () => contribsHTML() },
};
function feedMine(id) {
  api().listMyVideos().then((a) => { const acc = a.filter((v) => v.status === 'accruing' || v.status === 'closed'); const i = Math.max(0, acc.findIndex((v) => v.id === id)); ctx.closeSheet(); push('feed', { source: 'mine', start: i }); });
}

// ───────── события ─────────
async function onClick(e) {
  const el = e.target.closest('[data-cr]'); if (!el) return;
  const a = el.dataset.cr, v = el.dataset.v;
  const scr = el.closest('.cr-scr');
  e.preventDefault();
  if (a.startsWith('open:')) { const s = a.slice(5); ctx.closeSheet(); await load(); push(s === 'league' ? 'league' : s, {}); return; }
  switch (a) {
    case 'back': pop(); break;
    case 'close': close(); break;
    case 'login': await load(); loginSheet(); break;
    case 'ltab': { const top = stack[stack.length - 1]; if (top) { top.args.tab = v; await rerender(); } break; }
    case 'vf': $$('[data-cr="vf"]', scr).forEach((b) => b.setAttribute('aria-selected', String(b === el))); $$('.cr-th', scr).forEach((t) => { t.hidden = v === 'mine' && t.dataset.mine !== '1'; }); break;
    case 'mvf': { const top = stack[stack.length - 1]; top.args.filter = v; await rerender(); break; }
    case 'feed-league': push('feed', { source: 'league', start: +el.dataset.i }); break;
    case 'feed-mine': feedMine(el.dataset.id); break;
    case 'feed-tab': { const top = stack[stack.length - 1]; top.args.mineOnly = v === 'mine'; await rerender(); bindFeed(top.el, top.args); break; }
    case 'play': play(el, feedList[+el.dataset.i]); break;
    case 'vsave': {
      const key = placeKey({ kind: 'place', game: el.dataset.w, id: el.dataset.p });
      ctx.toggleFav?.(key); el.classList.toggle('on', !!ctx.isFav?.(key)); ctx.haptic?.(); break;
    }
    case 'vshare': {
      const x = feedList[+el.dataset.i]; const u = 'https://' + link(P?.ref_code || 'SB', x.place.world, x.place.id, x.id);
      try { if (navigator.share) { await navigator.share({ url: u, title: APP.shortName }); break; } } catch { break; }
      try { await navigator.clipboard.writeText(u); ctx.toast(tx('copied')); } catch { } break;
    }
    case 'vplace': close(); ctx.openOnMap(placeKey({ kind: 'place', game: el.dataset.w, id: el.dataset.p })); break;
    case 'vstats': ctx.closeSheet(); push('vstats', { id: el.dataset.id }); break;
    case 'video': videoSheet(el.dataset.id); break;
    case 'copy': try { await navigator.clipboard.writeText(v); ctx.toast(tx('copied')); } catch { ctx.toast(v); } break;
    case 'share-link': { const u = 'https://' + link(P.ref_code); try { if (navigator.share) await navigator.share({ url: u, title: APP.shortName }); else { await navigator.clipboard.writeText(u); ctx.toast(tx('copied')); } } catch { } break; }
    case 'alldays': { const open = el.dataset.open !== '1'; $$('.cr-days > div', scr).forEach((r, i) => { if (i >= 5) r.hidden = !open; }); el.dataset.open = open ? '1' : '0'; el.textContent = open ? tx('collapse') : tx('all_days', { n: el.dataset.n }); break; }
    case 'add': await load(); addSheet(); break;
    case 'submit': await load(); submitSheet(el.dataset.p ? { world: el.dataset.w, id: el.dataset.p } : null); break;
    case 'sv-send': svSend(); break;
    case 'pick':
      if (el.dataset.next === 'cf') { cfCollect(); if (cf && cfHas()) api().saveDraft(cfDraft()).catch(() => { }); stopCam(); pickSheet('cf', cf?.world); break; }
      keepSv(); pickSheet(el.dataset.next); break;
    case 'picked': {
      const ref = { world: el.dataset.w, id: el.dataset.p }; await place(ref);
      if (el.dataset.next === 'mention') { form.places = form.places || []; if (!form.places.some((x) => x.id === ref.id) && form.places.length < 5) form.places.push({ ...ref, at: '' }); submitSheet(); break; }
      if (el.dataset.next === 'cf') { if (cf) { cf.place = ref; cf.world = ref.world; cf.dupChecked = false; cfRender(); } break; }
      form.place = ref; ({ submit: () => submitSheet() })[el.dataset.next]?.(); break;
    }
    // подача ролика: «Про место» / «Упоминание», кадры из игры, убрать место
    case 'sv-mode': {
      keepSv(); form.mode = v; form.dup = null;
      if (v === 'mention' && !form.places?.length && form.place) form.places = [{ ...form.place, at: '' }];
      if (v === 'about' && !form.place && form.places?.length) form.place = { world: form.places[0].world, id: form.places[0].id };
      svRender(); break;
    }
    case 'sv-gp': keepSv(); form.gp = !form.gp; svRender(); break;
    case 'sv-del': keepSv(); form.places.splice(+el.dataset.i, 1); svRender(); break;
    // «Снять про это»
    case 'shoot': shootSheet(el.dataset.w, el.dataset.p); break;
    case 'sh-save': saveCard(); break;
    case 'sh-held': if (shoot) { shoot.saved = true; shoot.view = 'downloaded'; shootRender(); } break;
    case 'sh-copy': {
      if (!shoot) break;
      const u = 'https://' + link(P.ref_code, shoot.ref.world, shoot.ref.id, shoot.v);
      try { await navigator.clipboard.writeText(u); shoot.copied = true; shoot.view = 'copied'; shootRender(); ctx.haptic?.(); } catch { ctx.toast(u); }
      break;
    }
    case 'sh-submit': if (shoot) { form = { place: shoot.ref, v: shoot.v, mode: 'about' }; submitSheet(); } break;
    // задания и вклады (08 №11–13)
    case 'bd-w': { const top = stack[stack.length - 1]; if (top) { top.args.world = v; await rerender(); } break; }
    case 'tk-go': await taskGo(el.dataset.id); break;
    case 'cf-type': await cfOpen(v, { world: ctx?.game?.() || 'gta6' }); break;
    case 'cf-resume': ctx.closeSheet(); await cfOpen(v, {}); break;
    case 'cf-refix': { const c = (await api().listMyContributions()).find((x) => x.id === v); if (c) await cfOpen(c.type, { place: c.place, from: c.id, fresh: true }); break; }
    case 'cf-next': cfNext(); break;
    case 'cf-send': cfSend(); break;
    case 'cf-dup': if (cf) { if (v === 'yes') { cf.place = cf.dup; cf.extend = true; } cf.dupChecked = true; cf.view = ''; cfSend(); } break;
    case 'cf-unplace': if (cf) { cf.place = null; cf.dupChecked = false; cfRender(); } break;
    case 'cf-reason': if (cf) { cfCollect(); cf.reason = v; cfRender(); } break;
    case 'cf-vote': if (cf) { cf.vote = v; cfSend(); } break;
    case 'cf-photo': cfCollect(); $('#cf-file')?.click(); break;
    case 'cf-cam': if (cf) startCam(); break;
    case 'cf-shot': camShot(); break;
    case 'cf-login': if (cf) { cfCollect(); await api().saveDraft(cfDraft()); loginFor = 'contrib'; const t = cf.type; loginSheet(async () => { const d = (await api().getDrafts()).find((x) => x.type === t); if (d) { cf = { ...d, view: '' }; await cfSend(); } else ctx.closeSheet(); }, true); } break;
    case 'locked': ctx.toast(tx(v)); break;
    case 'lg-send': {
      const em = $('#cr-email').value.trim(), er = $('#cr-err');
      try {
        const r = await api().signIn(em); loginEmail = em;
        if (r.signed_in) { afterSignIn(); break; }   // закрытый доступ без сервера: вход по принятому приглашению, без письма (08 §6)
        codeSheet(); setTimeout(() => $('#cr-code')?.focus(), 350);
      } catch { er.hidden = false; er.textContent = tx('lg_bad_email'); }
      break;
    }
    case 'lg-code': {
      const c = $('#cr-code').value.trim(), er = $('#cr-err');
      try { P = await api().verifyCode(loginEmail, c); if (loginFor === 'contrib') afterLogin(); else if (!isPartner() && !P.minor) { if (hasAccess()) afterSignIn(); else ageSheet(); } else afterLogin(); } catch { er.hidden = false; er.textContent = tx('lg_bad_code'); }
      break;
    }
    case 'lg-age': {
      P = await api().confirmAge(v === '1'); ctx?.onProfile?.(P);
      if (v === '1') afterLogin();
      else { loginNext = null; await renderHub(); sheet(`<div class="cr-sh"><h2>${esc(tx('lg_minor_h'))}</h2><p class="sub">${esc(tx('lg_minor_sub'))}</p><button class="btn-primary" data-cr="sheet-close">${esc(tx('ok'))}</button></div>`); }
      break;
    }
    case 'withdraw': push('payout', {}); break;
    // экран 10 «Вывод»: проверка личности у Whop, заявка, повтор после failed
    case 'wd-kyc': {
      try { await api().startKyc(); P = await api().getProfile(); ctx.toast(tx('wd_kyc_sent', { p: R.payout_provider })); await rerender(); } catch (x) { err(tx(x.code === 'beta_off' ? 'beta_pay' : 'err')); }
      break;
    }
    case 'wd-check': P = await api().getProfile(); await rerender(); break;
    case 'wd-send': {
      try { await api().requestPayout(); P = await api().getProfile(); ctx.haptic?.(); await rerender(); renderHub(); }
      catch (x) { if (x.code === 'kyc_required' || x.code === 'below_min' || x.code === 'in_round') await rerender(); else err(tx(x.code === 'beta_off' ? 'beta_pay' : 'err')); }
      break;
    }
    // экран 14 «Экзамен»: начать, после сдачи — очередь ученика
    case 'ex-start': {
      const top = stack[stack.length - 1]; if (!top) break;
      try { const x = await api().startExam(); await placesOf(x.items); exam = { id: x.id, items: x.items, answers: [] }; top.args.view = 'q'; await rerender(); }
      catch (x) { if (x.code === 'cooldown') { top.args.view = 'cooldown'; await rerender(); } else err(tx('err')); }
      break;
    }
    case 'ex-go': push('review', {}, true); break;
    case 'invite': inviteSheet(); break;
    case 'inv-send': {
      const er = $('#cr-err');
      try { await api().redeemInvite($('#cr-inv').value.trim()); P = await api().getProfile(); ctx.closeSheet(); ctx.toast(tx('inv_ok')); rerender(); renderHub(); }
      catch (x) { er.hidden = false; er.textContent = tx(x.code === 'expired' ? 'inv_old' : 'inv_bad'); }
      break;
    }
    case 'rv': tryDecide(stack[stack.length - 1]?.el, v); break;
    case 'rv-reason': { ctx.closeSheet(); decide(stack[stack.length - 1]?.el, 'no', v); break; }
    case 'rv-again': await rerender(); break;
    case 'sheet-close': ctx.closeSheet(); break;
    // список ожидания и приглашение
    case 'wl-join': await load(); wlForm = { platforms: [], email: P?.email || '' }; wlSheet(1); break;
    case 'wl-next': { const em = $('#cr-wmail').value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err(tx('lg_bad_email')); break; } wlForm.email = em; wlSheet(2); break; }
    case 'wl-pl': { wlForm.profile = $('#cr-wprof')?.value.trim(); const i = wlForm.platforms.indexOf(v); if (i >= 0) wlForm.platforms.splice(i, 1); else wlForm.platforms.push(v); el.setAttribute('aria-pressed', String(i < 0)); break; }
    case 'wl-send': {
      wlForm.profile = $('#cr-wprof')?.value.trim();
      if (!wlForm.platforms.length) { err(tx('wj_pick')); break; }
      try { await api().joinWaitlist({ email: wlForm.email, platforms: wlForm.platforms, profile_url: wlForm.profile }); P = await api().getProfile(); renderHub(); if (stack.length) rerender(); wlSheet(3); }
      catch (x) { err(tx(x.code === 'bad_email' ? 'lg_bad_email' : 'err')); }
      break;
    }
    case 'inv-beta': await load(); inviteBetaSheet(); setTimeout(() => $('#cr-binv')?.focus(), 350); break;
    case 'inv-b-send': {
      try { await api().redeemInvite($('#cr-binv').value); P = await api().getProfile(); ctx.toast(tx('inv_b_ok')); renderHub(); ctx.closeSheet(); if (stack.length) close(); setTimeout(() => loginSheet(), stack.length ? 320 : 0); }
      catch (x) { err(tx({ used: 'inv_used', expired: 'inv_exp' }[x.code] || 'inv_nf')); }
      break;
    }
    // «Стать партнёром»
    case 'pt-age': {
      P = await api().confirmAge(v === '1'); ctx?.onProfile?.(P); renderHub();
      push('partner', { step: v === '1' ? 'terms' : 'minor' }, true); break;
    }
    case 'pt-terms': {
      if (!$('#cr-terms')?.checked) { err(tx('pt_need')); break; }
      try { P = await api().acceptTerms(); push('partner', { step: 'country' }, true); } catch { err(tx('err')); }
      break;
    }
    case 'pt-country': {
      try { P = await api().becomePartner({ country: $('#cr-country').value }); } catch { err(tx('err')); break; }
      ctx?.onProfile?.(P); renderHub();
      if (P.payouts === false) push('partner', { step: 'nopay' }, true);
      else if (verifiedAcc()) push('done', {}, true);
      else push('verify', { flow: true }, true);
      break;
    }
    // подтверждение канала
    case 'vf-go': push('verify', { flow: isPartner() }, true); break;
    case 'vf-pl': vfForm = { platform: v, url: $('#cr-vurl')?.value.trim() || '' }; await rerender(); break;
    case 'vf-send': {
      vfForm.url = $('#cr-vurl').value.trim();
      try { const acc = await api().verifyAccount({ platform: vfForm.platform, url: vfForm.url }); const top = stack[stack.length - 1]; top.args = { ...top.args, pick: false, id: acc.id, view: 'code' }; await rerender(); renderHub(); }
      catch { err(tx('vf_bad', { p: PLAT[vfForm.platform] })); }
      break;
    }
    case 'vf-check': case 'vf-again': { const top = stack[stack.length - 1]; top.args = { ...top.args, view: '' }; await rerender(); break; }
    case 'vf-retry': {
      const acc = (P.accounts || []).find((x) => x.id === el.dataset.id); if (!acc) break;
      try { const n = await api().verifyAccount({ platform: acc.platform, url: acc.url }); const top = stack[stack.length - 1]; top.args = { ...top.args, id: n.id, view: 'code' }; await rerender(); } catch { ctx.toast(tx('err')); }
      break;
    }
    case 'vf-other': { const top = stack[stack.length - 1]; top.args = { ...top.args, pick: true, id: null }; vfForm = { platform: 'tiktok', url: '' }; await rerender(); break; }
    case 'vf-next': push('done', {}, true); break;
    case 'dn-shoot': shootSheet(el.dataset.w, el.dataset.p); break;
    // «Для админов»
    case 'ad-in': {
      try { await api().adminSignIn($('#cr-adm').value); await rerender(); renderHub(); } catch (x) { err(tx(x.code === 'no_crypto' ? 'ad_nocrypto' : 'ad_bad')); }
      break;
    }
    case 'ad-demo': case 'ad-stage': {
      const st = await api().adminState(), on = a === 'ad-demo' ? v === '1' : true;
      if (a === 'ad-demo' && on === st.demo) break;
      await api().adminSetDemo(on, a === 'ad-stage' ? v : st.stage);
      history.replaceState(null, '', location.pathname + location.search + '#admin'); location.reload(); break;   // app.js откроет экран снова
    }
    case 'ad-make': { try { await api().createInvites(10); await rerender(); } catch (x) { err(tx(x.code === 'no_invites_left' ? 'ad_inv_left' : 'err')); } break; }
    case 'ad-mark': { await api().markAccount(el.dataset.id, v); P = await api().getProfile(); ctx?.onProfile?.(P); await rerender(); renderHub(); break; }
    case 'ad-out': await api().adminSignOut(); await rerender(); renderHub(); break;
    case 'ad-cq': { try { await api().decideContribution(el.dataset.id, v, 'other'); ctx.toast(tx(v === 'accepted' ? 'ad_c_accepted' : 'ad_c_rejected')); } catch { ctx.toast(tx('err')); } await rerender(); renderHub(); break; }
  }
}

// ───────── вход ─────────
export function init(c) {
  ctx = c;
  if (init.done) return; init.done = true;
  document.addEventListener('click', onClick);
  // форма вклада: поля переживают перерисовку, «Дальше» без источника не активна (02 §6.3), фото — с устройства
  document.addEventListener('input', (e) => {
    if (e.target.id === 'cf-op' && cam) { cam.op = +e.target.value; const g = $('#cf-ghost'); if (g) g.style.opacity = cam.op; return; }
    if (!cf || !e.target.matches?.('[data-cf]')) return;
    cfCollect(); const ok = srcOK(), b = $('[data-cr="cf-next"]'), h = $('#cf-need'); if (b) b.disabled = !ok; if (h) h.hidden = ok;
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'cf-file') cfFile(e.target.files?.[0]); });
}
/** Лента «Ролики об этом месте» — вызывает карточка места (сессия карты): window.SB.openPlaceVideos('gta6', 'gta6-…') */
export async function openPlaceVideos(world, placeId) { await load(); ctx?.closeSheet?.(); return push('feed', { source: 'place', world, id: placeId }); }
/** «Снять про это» — вызывает карточка места (сессия карты): window.SB.shootPlace('gta6', 'gta6-stiltsville'). Не партнёр — вход и «Стать партнёром» */
export async function shootPlace(world, placeId) { await load(); return shootSheet(world, placeId); }
/** «Поправить» из карточки места (сессия карты): window.SB.fixPlace('gta6', 'gta6-…') — форма вклада, вид «Поправить место» */
export async function fixPlace(world, placeId) { await load(); return cfOpen('fix', { place: { world, id: placeId }, world }); }
/** Новое место долгим тапом по карте (сессия карты): window.SB.addPlaceAt('gta6', lat, lon) — форма вклада с точкой */
export async function addPlaceAt(world, lat, lon) { await load(); return cfOpen('new_place', { world, lat: +lat, lon: +lon }); }
/** Любой экран креатора: league ({ tab }) | earn | payout | myvideos | mylink | review | exam | rules | vstats ({ id }) | board ({ world }) | contribs */
export async function openCreator(id = 'league', args = {}) { await load(); return push(id, args); }
/** «Стать партнёром» снаружи (пейвол nopay): вход почтой и 18+; уже партнёр — Лига */
export async function becomePartner() { await load(); if (isPartner()) return push('league', {}); loginSheet(); }
/** Сброс кэша профиля (смена языка, вход) — хаб перерисуется */
export async function refresh() { await load(true); return renderHub(); }
export function relang() { renderHub(); if (stack.length) rerender(); }
