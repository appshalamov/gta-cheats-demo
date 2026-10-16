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
import { loadPlaces, realOf, thumbOf, placeKey, searchPlaces, featured } from './places.js';

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
    trial_t: 'Пробный доступ', trial_p: 'Все коды и поиск открыты без входа и без карты оплаты. Карта и места из жизни — в Pro', trial_partner: 'Вы партнёр. Лига и ролики откроются после подтверждения аккаунта площадки: тогда начнётся рабочий Pro',
    buys_h: 'Покупки по вашей ссылке', buy_pass: 'Пропуск по вашей ссылке — {p}', buy_year: 'Год — {p}', buy_month: 'Месяц — {p} за каждую оплату', n_buys: '{n} покупка|{n} покупки|{n} покупок', n_pays: '{n} оплата|{n} оплаты|{n} оплат',
    buys_note: 'Доступно через 30 дней после покупки. При возврате доля откатывается из будущих начислений', work_pro: 'Рабочий Pro до {d}. +30 дней за каждый принятый ролик от 1 000 просмотров',
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
    mock_note: 'Пример данных. Настоящие цифры придут с сервера.', earn_empty: 'Начислений пока нет', earn_empty_p: 'Здесь появятся доля по коду, просмотры роликов и задания. Начните с ссылки на место.',
    pd_total: '{n} дней Pro', pd_sub_minor: 'До 18 лет за вклады начисляем дни Pro', pd_sub_np: 'За принятые вклады, ролики и подарки друзьям',
    pd_friend: 'Друг купил Pro по вашей ссылке', pd_contrib: 'Принятые вклады', pd_video: 'Принятый ролик от 1 000 просмотров', pd_note: 'Подарки друзьям — не больше 12 в год.',
    vs_submitted: 'Отправлен', vs_pending_review: 'На проверке', vs_awaiting_threshold: 'Ждёт порога', vs_accruing: 'Начисляется', vs_rejected: 'Отклонено', vs_unavailable: 'Недоступно',
    vf_all: 'Все', vf_review: 'На проверке', vf_acc: 'Начисляется', vf_no: 'Отклонено',
    rj_no_code: 'В описании нет кода {code}, поэтому мы не можем подтвердить, что ролик ваш. Добавьте код и отправьте снова',
    rj_gameplay: 'В ролике геймплей GTA. В роликах с кодом — только места в жизни и экран приложения',
    rj_not_place: 'Ролик не про место из приложения', rj_reused: 'Этот ролик уже подан с другого аккаунта',
    vu_note: 'Ролик удалён на площадке или закрыт. Начисленное до удаления остаётся, новых начислений нет',
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
    sv_send: 'Отправить на проверку', sv_bad_url: 'Нужна ссылка на ролик TikTok, YouTube, Instagram или Snapchat', sv_no_place: 'Выберите место',
    sv_ok: 'Ролик отправлен', sv_ok_code: 'Добавьте в описание ролика код', sv_ok_link: 'Ваша ссылка для этого ролика',
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
    lg_draft: 'Черновик сохранится, пока вы вводите код',
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
    mod_exam: 'Экзамен: 20 примеров, нужно 16 верных', mod_student: 'Режим ученика: ваши решения сверяются с модераторами, 20 проверок с точностью от 70%',
    mod_now: 'У вас {n} из 5 принятых вкладов',
    ru_h_rates: 'Доли и ставки', ru_code: 'По вашему коду', ru_code_v: '40% с каждой покупки, после холда 30 дней', ru_views: 'Просмотры TikTok, Reels и YouTube', ru_shorts: 'YouTube Shorts',
    ru_author: 'Автор места', ru_author_v: '10% сверху к роликам о нём, 12 месяцев', ru_scout: 'Скаут', ru_scout_v: '$10 за принятую пару', ru_cpa: 'Приведённый креатор', ru_cpa_v: '$15, когда он заработает $50 за 90 дней',
    ru_mod: 'Модератор', ru_mod_v: '$0,01 за решение при точности от 70%',
    ru_h_terms: 'Сроки', ru_views_t: 'Просмотры', ru_views_tv: 'половина — по 10-му дню ролика, остаток — по 30-му', ru_tasks_t: 'Задания', ru_tasks_tv: 'через 7 дней после проверки',
    ru_hold: 'Доля по коду', ru_hold_v: 'холд 30 дней', ru_pay: 'Выплата', ru_pay_v: '20-го числа, от $25', ru_first: 'Первый вывод', ru_first_v: 'с проверкой личности, 18+', ru_big: 'Больше $500', ru_big_v: 'смотрит человек',
    ru_h_pro: 'Рабочий Pro для партнёров', ru_pro_p: '14 дней после подтверждения аккаунта площадки и +30 дней за каждый принятый ролик от 1 000 просмотров. Pro не меняет ни одной цифры заработка. Стать партнёром — бесплатно.',
    ru_h_np: 'Что вы получаете', ru_np1: 'Принятый вклад', ru_np1v: '«Найдено @ник» и дни Pro', ru_np2: 'Принятый ролик от 1 000 просмотров', ru_np2v: '30 дней Pro', ru_np3: 'Друг купил Pro по ссылке', ru_np3v: '30 дней Pro, до 12 в год',
    ru_h_no: 'Что запрещено', ru_no1: 'Накрутка просмотров и покупок', ru_no1v: 'пауза кода', ru_no2: 'Коды в чужих сообществах', ru_no2v: 'пауза 7 дней, повтор — исключение',
    ru_no3: 'Один ролик с нескольких аккаунтов', ru_no3v: 'отказ', ru_no4: 'Геймплей GTA в ролике с кодом', ru_no4v: 'отказ', ru_no5: 'Снимки Street View с экрана, чужие ролики', ru_no5v: 'отказ',
    ru_h_rate: 'Как считаем ставку за просмотры', ru_rate_p: 'Ставка считается от того, сколько зрители по вашему коду покупают, за вычетом доли креатора 40%. Пересматривается раз в две недели: повышение — сразу, снижение — с предупреждением за 30 дней.',
    ru_h_ad: 'Реклама', ru_ad_p: 'Ролик с вашим кодом — реклама. Скажите об этом голосом и напишите в подписи.',
    ru_change: 'Правила меняем не чаще раза в месяц, с анонсом за 30 дней и никогда задним числом.',
    inv_h: 'Код приглашения', inv_p: 'Код от модератора или амбассадора открывает Лигу сразу. Одноразовый, действует 30 дней.', inv_ph: 'Например, LIGA-7Q2K', inv_send: 'Открыть Лигу',
    inv_bad: 'Код не подошёл. Проверьте буквы и цифры', inv_old: 'Срок кода истёк. Попросите новый', inv_ok: 'Лига открыта',
    err: 'Не получилось. Проверьте сеть и попробуйте ещё раз', soon_pair: 'Пара откроется после 5 принятых вкладов', soon_found: 'Откроется с выхода GTA 6, 19 ноября',
  },
  en: {
    for_authors: 'For creators', league: 'Creator League', title: 'Earn by filming videos about places',
    title_np: 'Film videos about places', title_minor: 'Your places and easter eggs',
    first_pay: 'First payouts on {d}. We will show the median after them', median: 'Creator median: {m}',
    hub_np_sub: '30 days of Pro for each accepted video with 1,000+ views', hub_minor_sub: 'Accepted contributions earn Pro days. Creators must be 18+',
    hub_open: 'League is open: tasks of the week', hub_lock: 'The League opens at 10,000 views on a place video',
    hub_guest: 'Sign in with email', hub_player: 'Become a partner', hub_partner_note: 'Free, no subscription. 18+ and email sign-in',
    partner: 'Partnership is free, 18+, no purchase needed. The terms are the same for all partners. For filming, a working Pro: 14 days after confirming your account and +30 days for each accepted video',
    trial_t: 'Trial access', trial_p: 'All codes and search are open without sign-in or a card. The map and real-life places are in Pro', trial_partner: 'You are a partner. The League and videos open after you confirm a platform account, which starts your working Pro',
    buys_h: 'Purchases with your link', buy_pass: 'Release pass with your link — {p}', buy_year: 'Year — {p}', buy_month: 'Month — {p} for each payment', n_buys: '{n} purchase|{n} purchases', n_pays: '{n} payment|{n} payments',
    buys_note: 'Available 30 days after purchase. On a refund the share is taken back from future earnings', work_pro: 'Working Pro until {d}. +30 days for each accepted video with 1,000+ views',
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
    mock_note: 'Sample data. Real numbers will come from the server.', earn_empty: 'No earnings yet', earn_empty_p: 'Code share, video views and tasks will show up here. Start with a link to a place.',
    pd_total: '{n} Pro days', pd_sub_minor: 'Under 18, contributions earn Pro days', pd_sub_np: 'For accepted contributions, videos and friend gifts',
    pd_friend: 'A friend bought Pro with your link', pd_contrib: 'Accepted contributions', pd_video: 'Accepted video with 1,000+ views', pd_note: 'Friend gifts are limited to 12 a year.',
    vs_submitted: 'Sent', vs_pending_review: 'In review', vs_awaiting_threshold: 'Waiting for views', vs_accruing: 'Accruing', vs_rejected: 'Rejected', vs_unavailable: 'Unavailable',
    vf_all: 'All', vf_review: 'In review', vf_acc: 'Accruing', vf_no: 'Rejected',
    rj_no_code: 'The description has no {code} code, so we cannot confirm the video is yours. Add the code and send it again',
    rj_gameplay: 'The video has GTA gameplay. Videos with a code show only real places and the app screen',
    rj_not_place: 'The video is not about a place from the app', rj_reused: 'This video was already submitted from another account',
    vu_note: 'The video was deleted or made private. What was earned before stays, nothing new accrues',
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
    sv_send: 'Send for review', sv_bad_url: 'We need a TikTok, YouTube, Instagram or Snapchat video link', sv_no_place: 'Choose a place',
    sv_ok: 'Video sent', sv_ok_code: 'Add this code to the video description', sv_ok_link: 'Your link for this video',
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
    lg_draft: 'Your draft is kept while you enter the code',
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
    mod_exam: 'Exam: 20 examples, 16 correct needed', mod_student: 'Trainee mode: your decisions are compared with moderators, 20 reviews at 70%+ accuracy',
    mod_now: 'You have {n} of 5 accepted contributions',
    ru_h_rates: 'Shares and rates', ru_code: 'With your code', ru_code_v: '40% of every purchase, after a 30-day hold', ru_views: 'TikTok, Reels and YouTube views', ru_shorts: 'YouTube Shorts',
    ru_author: 'Place author', ru_author_v: '10% on top for videos about it, 12 months', ru_scout: 'Scout', ru_scout_v: '$10 per accepted pair', ru_cpa: 'Referred creator', ru_cpa_v: '$15 once they earn $50 in 90 days',
    ru_mod: 'Moderator', ru_mod_v: '$0.01 per decision at 70%+ accuracy',
    ru_h_terms: 'Timing', ru_views_t: 'Views', ru_views_tv: 'half on the video’s day 10, the rest on day 30', ru_tasks_t: 'Tasks', ru_tasks_tv: '7 days after review',
    ru_hold: 'Code share', ru_hold_v: '30-day hold', ru_pay: 'Payout', ru_pay_v: 'on the 20th, from $25', ru_first: 'First payout', ru_first_v: 'with identity check, 18+', ru_big: 'Over $500', ru_big_v: 'checked by a person',
    ru_h_pro: 'Working Pro for partners', ru_pro_p: '14 days after confirming a platform account and +30 days for each accepted video with 1,000+ views. Pro does not change any earnings number. Becoming a partner is free.',
    ru_h_np: 'What you get', ru_np1: 'Accepted contribution', ru_np1v: '“Found by @name” and Pro days', ru_np2: 'Accepted video with 1,000+ views', ru_np2v: '30 days of Pro', ru_np3: 'A friend bought Pro with your link', ru_np3v: '30 days of Pro, up to 12 a year',
    ru_h_no: 'Not allowed', ru_no1: 'Boosting views or purchases', ru_no1v: 'code paused', ru_no2: 'Codes in other people’s communities', ru_no2v: '7-day pause, then removal',
    ru_no3: 'One video from several accounts', ru_no3v: 'rejected', ru_no4: 'GTA gameplay in a video with a code', ru_no4v: 'rejected', ru_no5: 'Street View screen captures, other people’s videos', ru_no5v: 'rejected',
    ru_h_rate: 'How the view rate is set', ru_rate_p: 'The rate comes from how much viewers buy with your code, minus the 40% creator share. It is reviewed every two weeks: raises apply at once, cuts with 30 days’ notice.',
    ru_h_ad: 'Advertising', ru_ad_p: 'A video with your code is an ad. Say so out loud and write it in the caption.',
    ru_change: 'We change the rules at most once a month, with 30 days’ notice and never retroactively.',
    inv_h: 'Invite code', inv_p: 'A code from a moderator or ambassador opens the League at once. Single use, valid for 30 days.', inv_ph: 'For example, LIGA-7Q2K', inv_send: 'Open the League',
    inv_bad: 'The code did not work. Check letters and digits', inv_old: 'The code has expired. Ask for a new one', inv_ok: 'League is open',
    err: 'Something went wrong. Check the connection and try again', soon_pair: 'Pairs open after 5 accepted contributions', soon_found: 'Opens with the GTA 6 release on November 19',
  },
};
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
const MON = { ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
function dfmt(iso) { const [, m, d] = String(iso).split('-').map(Number); return lang() === 'en' ? `${MON.en[m - 1]} ${d}` : `${d} ${MON.ru[m - 1]}`; }
const pct = (a, b) => (b ? (a / b * 100).toFixed(a / b < 0.1 ? 1 : 0) : '0').replace('.', lang() === 'en' ? '.' : ',') + '%';
const PLAT = { tiktok: 'TikTok', youtube: 'YouTube', shorts: 'YouTube Shorts', reels: 'Instagram Reels', snapchat: 'Snapchat' };
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
  return placeCache[ref.world].get(ref.id) || null;
}
async function placesOf(list) { await Promise.all(list.map((x) => x && x.place && place(x.place))); }
const pSync = (ref) => (ref && placeCache[ref.world]?.get(ref.id)) || null;
const pName = (ref) => shortName(realOf(pSync(ref) || {})) || '';
const pImg = (ref, big = false) => { const p = pSync(ref); if (!p) return ''; const ph = p.pr || p.pg; return ph ? (big ? ph.file || ph.thumb : ph.thumb || ph.file) || '' : ''; };
const pCity = (ref) => (ref?.world === 'gta6' ? (lang() === 'en' ? 'Miami' : 'Майами') : (lang() === 'en' ? 'Los Angeles' : 'Лос-Анджелес'));

const isTrial = () => !!(P && P.trial_until && !P.pro_until && new Date(P.trial_until + 'T23:59:59') > new Date());
const isGuest = () => !P || !P.email;
const isMinor = () => !!(P && P.minor);
const noPay = () => !!(P && P.payouts === false);
const isPartner = () => !!(P && P.roles.includes('creator') && P.adult_at);
const isMod = () => !!(P && P.roles.includes('mod'));
const moneyOK = () => isPartner() && !noPay() && !isTrial();
const medLine = () => (R && R.median_cents != null ? tx('median', { m: money(R.median_cents) }) : tx('first_pay', { d: dfmt(R?.first_round || '2026-11-20') }));
const med = (cls = '') => `<p class="cr-med${cls ? ' ' + cls : ''}">${esc(medLine())}</p>`;
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
const stTag = (s) => tag({ accruing: 'ok', rejected: 'no', unavailable: 'no', pending_review: 'wait', submitted: 'wait', awaiting_threshold: 'wait' }[s] || '', tx('vs_' + s));
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
  if (isTrial()) return trialHub();
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
  const card = `<button class="cr-hero" data-cr="${go}">${picture(banner, 'cr-hero-ph')}<span class="cr-hero-in glass-plate"><b>${esc(title)}</b><span class="cr-hero-sub">${esc(sub)}</span>${foot}</span></button>`;
  const how = (!partner || (P.league_unlocked === false && !minor)) ? `<ol class="cr-how">${[tx('how1'), tx('how2'), np ? tx('how3_np') : tx('how3')].map((t, i) => `<li><span>${i + 1}</span>${esc(t)}</li>`).join('')}</ol>` : '';
  let rows = '';
  if (guest) rows = row('open:rules', 'doc', tx('rules'), tx('rules_sub'));
  else if (minor) rows = row('add', 'plus', tx('add_minor')) + row('open:earn', 'star', tx('pro_days'), tx('pro_days_sub')) + row('open:rules', 'doc', tx('rules'), tx('rules_sub_np'));
  else if (!partner) rows = row('login', 'link', tx('hub_player'), tx('partner')) + row('open:mylink', 'gift', tx('my_link_p'), tx('gift_sub')) + row('add', 'plus', tx('add_minor')) + row('open:rules', 'doc', tx('rules'), tx('rules_sub'));
  else {
    const vids = await api().listMyVideos(), rev = vids.filter((v) => ['submitted', 'pending_review'].includes(v.status)).length;
    rows = (np ? row('open:earn', 'star', tx('pro_days'), tx('pro_days_sub')) : row('open:earn', 'wallet', tx('my_earn'), tx('my_earn_sub')))
      + row('open:myvideos', 'video', tx('my_videos'), vids.length ? `${plural(vids.length, 'n_videos')}${rev ? `, ${rev} ${tx('n_on_review')}` : ''}` : '')
      + row('open:mylink', 'link', tx('my_link'), tx('code_sub', { c: P.ref_code }))
      + (isMod() ? row('open:review', 'shield', tx('review'), tx('review_sub')) : row('open:review', 'shield', tx('review_how')))
      + row('add', 'plus', tx('add'))
      + row('open:rules', 'doc', tx('rules'), np ? tx('rules_sub_np') : tx('rules_sub'));
  }
  const me = guest ? '' : `<div class="cr-me"><span class="cr-av">${esc((P.nick || '?').charAt(0).toUpperCase())}</span><span class="m"><b>@${esc(P.nick)}</b><small>${esc(tx('code_sub', { c: P.ref_code }))}</small></span>${partner ? `<button class="cr-ib" data-cr="share-link" aria-label="${esc(tx('share'))}">${I.share}</button>` : ''}</div>`;
  return `<div class="cr-hub-h">${esc(tx('for_authors'))}</div>${me}${card}${how}<div class="group">${rows}</div>`;
}
// Пробный доступ 72 часа (файл 31, решение №14): Лиги, «Моего заработка» и «Моей ссылки» нет; «Стать партнёром» есть —
// партнёрство бесплатное по закону (FTC, 16 CFR 437); правила — без слов о деньгах.
function trialHub() {
  const rows = (isPartner() ? `<div class="cr-note">${I.info}<span>${esc(tx('trial_partner'))}</span></div><div class="group">` : `<div class="group">${row('login', 'link', tx('hub_player'), tx('partner'))}`)
    + row('add', 'plus', tx('add_minor')) + row('open:rules', 'doc', tx('rules'), tx('rules_sub_np')) + '</div>';
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
  scr.innerHTML = await SCREENS[id].html(args);
  const first = el.hidden;
  if (first) { el.hidden = false; el.classList.remove('out'); requestAnimationFrame(() => el.classList.add('on')); }
  const prev = stack[stack.length - 1];
  if (replace && prev) { prev.el.remove(); stack.pop(); }
  else if (prev && !first) { prev.el.classList.add('under'); scr.classList.add('in'); requestAnimationFrame(() => requestAnimationFrame(() => scr.classList.remove('in'))); }
  el.appendChild(scr);
  stack.push({ id, args, el: scr });
  SCREENS[id].bind?.(scr, args);
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
  top.el.innerHTML = await SCREENS[top.id].html(top.args);
  SCREENS[top.id].bind?.(top.el, top.args);
  const b = top.el.querySelector('.cr-body'); if (b) b.scrollTop = y;
}
const head = (title, opts = {}) => `<header class="cr-hd${opts.big ? ' big' : ''}">${opts.noBack ? '' : `<button class="cr-ib" data-cr="back" aria-label="${esc(tx('back'))}">${I.back}</button>`}<h1>${esc(title)}</h1>${opts.close ? `<button class="cr-ib" data-cr="close" aria-label="${esc(tx('close'))}">${I.close}</button>` : ''}</header>`;
const body = (html, cls = '') => `<div class="cr-body${cls ? ' ' + cls : ''}">${html}${api().isMock ? `<p class="cr-mock">${I.info}${esc(tx('mock_note'))}</p>` : ''}</div>`;

// ───────── Лига ─────────
function ratesHTML() {
  const r = (c) => money(c);
  const line = (k) => tx('r_line', { r: r(R.rpm[k]), cap: r(R.rpm_cap_cents), min: r(R.rpm_min_cents) });
  return `<h2 class="cr-h">${esc(tx('rates_h'))}</h2><div class="cr-rates">
    <div><b>${esc(tx('r_main'))}</b><span>${esc(line('tiktok'))}</span></div><div><b>${esc(tx('r_shorts'))}</b><span>${esc(line('shorts'))}</span></div>
    <div><b>${esc(tx('r_ex'))}</b><span class="cr-num">${r(R.rpm_example.cents)}</span></div></div>
    <p class="cr-p">${esc(tx('r_note'))} ${esc(tx('r_main_earn'))}</p>${med()}`;
}
async function tasksHTML() {
  const lg = await api().getLeague(); await placesOf(lg.tasks);
  const open = lg.unlocked;
  const T = lg.tasks.map((x) => {
    if (x.kind === 'unlock') return { t: tx('t_unlock'), d: tx('t_unlock_d'), done: x.done, prog: x.done ? null : [x.progress, x.goal] };
    if (x.kind === 'place_week') return { t: tx('t_week', { p: pName(x.place) }), d: tx('t_week_d'), img: pImg(x.place), place: x.place };
    if (x.kind === 'fresh_find') return { t: tx('t_fresh', { p: pName(x.place) }), d: tx('t_fresh_d', { who: x.found_by, d: dfmt(x.found_at) }), img: pImg(x.place), place: x.place };
    return { t: tx('t_month'), d: tx('t_month_d'), done: x.done, prog: x.done ? null : [x.progress, x.goal], doneTxt: x.done ? num(x.progress) : '' };
  });
  const cur = T.findIndex((x) => !x.done);
  return `<ol class="cr-lad">${T.map((x, i) => `<li class="${x.done ? 'done' : i === cur ? 'cur' : ''}"><span class="n">${x.done ? I.check : i + 1}</span><div class="m">
      ${x.img ? `<img class="cr-lad-ph" src="${esc(x.img)}" alt="" loading="lazy">` : ''}<b>${esc(x.t)}</b><span>${esc(x.d)}</span>
      ${x.prog ? `${bar(x.prog[0] / x.prog[1] * 100)}<span class="cr-prog">${esc(tx('of', { a: num(x.prog[0]), b: num(x.prog[1]) }))}</span>` : x.done ? `<span class="cr-ok">${esc(tx('t_done'))}${x.doneTxt ? `, ${x.doneTxt}` : ''}</span>` : ''}
      ${x.done ? '' : `<button class="cr-mini acc" data-cr="submit"${x.place ? ` data-w="${x.place.world}" data-p="${esc(x.place.id)}"` : ''}>${I.video}${esc(tx('submit_video'))}</button>`}</div></li>`).join('')}</ol>
    ${open ? '' : `<button class="btn-ghost" data-cr="invite">${esc(tx('invite'))}</button>`}`;
}
async function leagueTab(tab) {
  if (isMinor()) return `<div class="cr-note">${I.lock}<span>${esc(tx('lock_minor'))}</span></div>${tab === 'videos' ? await videosGrid() : await tasksHTML().then((h) => h.replace(/<button class="cr-mini acc"[^>]*>[\s\S]*?<\/button>/g, ''))}`;
  if (tab === 'videos') return videosGrid();
  if (tab === 'earn') return earnBody(true);
  if (tab === 'rating') return `<div class="cr-empty">${I.chart}<b>${esc(tx('rating_empty'))}</b><p>${esc(dfmt(R.first_round))}</p></div><p class="cr-p">${esc(tx('rating_note'))}</p>`;
  return `${await tasksHTML()}${noPay() ? `<div class="cr-note">${I.star}<span>${esc(tx('np_tasks'))}</span></div>` : ratesHTML()}
    <div class="cr-two"><button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button><button class="btn-ghost" data-cr="open:mylink">${esc(tx('my_link'))}</button></div>`;
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
const GRP = { share: 'code', rpm: 'views', task: 'other', cpa: 'other', author_fee: 'other', queue_batch: 'other' };
function dayBars(days, keys, ymax, label, fmt) {
  const W = 343, H = 172, Lp = 40, Rp = 4, T = 10, B = 24, n = days.length, pw = (W - Lp - Rp) / n, bw = Math.max(2, pw - 2.4), y = (v) => T + (H - T - B) * (1 - v / ymax);
  const ticks = [0, ymax / 2, ymax];
  const grid = ticks.map((t) => `<line x1="${Lp}" x2="${W - Rp}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" class="g"/><text x="${Lp - 6}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end" class="ax">${fmt(t)}</text>`).join('');
  const xl = [0, 7, 14, 21, n - 1].filter((i, k, a) => i < n && a.indexOf(i) === k).map((i) => `<text x="${(Lp + (i + 0.5) * pw).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="ax">${+days[i].date.slice(8)}</text>`).join('');
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
  if (!e.ledger.length) return `<div class="cr-empty">${I.wallet}<b>${esc(tx('earn_empty'))}</b><p>${esc(tx('earn_empty_p'))}</p>${med()}<button class="btn-primary" data-cr="open:mylink">${esc(tx('my_link'))}</button></div>`;
  const T = e.totals, game = ctx?.game?.() || 'gta6';
  const days = monthDays(e.month).map((date) => { const o = { date, code: 0, views: 0, other: 0, items: [] }; e.ledger.filter((x) => x.date === date).forEach((x) => { o[GRP[x.reason] || 'other'] += x.amount_cents; o.items.push(x); }); return o; });
  const ymax = niceMax(Math.max(...days.map((o) => o.code + o.views + o.other)));
  const dayText = (o) => {
    const s = o.code + o.views + o.other;
    if (!s) return `<b>${esc(dfmt(o.date))}</b>: ${esc(tx('no_acc'))}`;
    return `<b>${esc(dfmt(o.date))}, ${money(s)}</b>: ${[o.code ? `${tx('leg_code').toLowerCase()} ${money(o.code)}` : '', o.views ? `${tx('leg_views').toLowerCase()} ${money(o.views)}` : '', o.other ? `${tx('leg_other').toLowerCase()} ${money(o.other)}` : ''].filter(Boolean).map(esc).join(', ')}`;
  };
  const by = (r) => e.ledger.filter((x) => x.reason === r), sum = (a) => a.reduce((s, x) => s + x.amount_cents, 0);
  const stOf = (a) => { const st = [...new Set(a.map((x) => x.status))]; return st.map((s) => tx('st_' + s)).join(', '); };
  const SRC = [['share', 'code', tx('rs_share', { c: P.ref_code }), tx('rs_share_d', { n: by('share').length })], ['rpm', 'views', tx('rs_rpm'), tx('rs_rpm_d')],
    ['cpa', 'other', tx('rs_cpa'), tx('rs_cpa_d')], ['task', 'other', tx('rs_task'), tx('rs_task_d')], ['author_fee', 'other', tx('rs_author'), tx('rs_author_d')], ['queue_batch', 'other', tx('rs_queue'), tx('rs_queue_d')]]
    .map(([r, k, t, d]) => ({ r, k, t, d, c: sum(by(r)), st: stOf(by(r)) })).filter((x) => x.c);
  const totalAll = SRC.reduce((a, x) => a + x.c, 0) || 1;
  const buys = ['pass', 'year', 'month'].map((k) => { const l = by('share').filter((x) => x.plan === k); return { k, n: l.length, c: l[0]?.amount_cents || 0 }; }).filter((x) => x.n);
  const pays = e.funnel.pays, earned = T.total;
  const fun = [[tx('f_views'), num(e.funnel.views), ''], [tx('f_clicks'), num(e.funnel.clicks), tx('f_of', { p: pct(e.funnel.clicks, e.funnel.views) })],
    [tx('f_pays'), num(pays), tx('f_of', { p: pct(pays, e.funnel.clicks) })], [tx('f_earned'), money(earned), '']];
  const own = vids.filter((v) => v.views || v.earned.total_cents);
  const payout = e.payout;
  const btn = payout ? `<div class="cr-note ok">${I.clock}<span>${esc(tx('wd_status'))}, ${money(payout.amount_cents)}. ${esc(tx('wd_ok_3', { d: dfmt(payout.round_date) }))}</span></div>`
    : T.available >= R.payout_min_cents ? `<button class="btn-primary" data-cr="withdraw">${I.wallet}${esc(tx('withdraw', { s: money(T.available) }))}</button>`
    : `<div class="cr-wd">${bar(T.available / R.payout_min_cents * 100)}<span>${esc(tx('withdraw_min', { min: money(R.payout_min_cents), s: money(T.available) }))}</span></div>`;
  const rows = days.filter((o) => o.code + o.views + o.other).reverse();
  const dayParts = (o) => {
    const c = (r) => o.items.filter((x) => x.reason === r).length, parts = [];
    if (c('share')) parts.push(plural(c('share'), 'd_share'));
    if (c('rpm')) parts.push(tx('d_rpm')); if (c('task')) parts.push(tx('d_task')); if (c('cpa')) parts.push(tx('d_cpa')); if (c('author_fee')) parts.push(tx('d_author')); if (c('queue_batch')) parts.push(tx('d_queue'));
    const s = parts.join(', '); return s.charAt(0).toUpperCase() + s.slice(1);
  };
  return `<div class="cr-money">${picture(HERO[game]?.banners[1] || HERO[game]?.banners[0], 'cr-money-ph')}<div class="cr-money-in glass-plate">
      <b class="cr-money-v">${money(T.total)}</b><span class="cr-money-s">${esc(tx('for_month', { m: tx('month_10') }))}</span>
      ${med('on-photo')}
      <span class="cr-money-r">${I.clock}${esc(tx('round_in', { d: dfmt(e.round_date), n: plural(daysTo(e.round_date), 'n_days_x') }))}</span></div></div>
    <div class="cr-tri"><div><span>${esc(tx('accruing'))}</span><b>${money(T.maturing)}</b></div><div class="hi"><span>${esc(payout ? tx('in_payout') : tx('available'))}</span><b>${money(T.available)}</b></div><div><span>${esc(tx('paid'))}</span><b>${money(T.paid)}</b></div></div>
    ${btn}
    <h2 class="cr-h">${esc(tx('by_day'))}</h2>
    <div class="cr-box" data-days="${esc(JSON.stringify(days.map(dayText)))}">
      <div class="cr-leg"><span><i class="s-code"></i>${esc(tx('leg_code'))}</span><span><i class="s-views"></i>${esc(tx('leg_views'))}</span><span><i class="s-other"></i>${esc(tx('leg_other'))}</span></div>
      ${dayBars(days, ['code', 'views', 'other'], ymax, tx('by_day'), (t) => '$' + Math.round(t / 100))}
      <p class="cr-read">${esc(tx('tap_bar'))}</p></div>
    <h2 class="cr-h">${esc(tx('sources'))}</h2>
    <div class="cr-srcs">${SRC.map((x) => `<div class="cr-src"><div class="h"><b>${esc(x.t)}</b><span>${money(x.c)}</span></div><span class="cr-sb"><i class="s-${x.k}" style="width:${Math.max(1.5, x.c / totalAll * 100).toFixed(1)}%"></i></span><small>${esc(x.d)}. <em>${esc(x.st)}</em></small></div>`).join('')}</div>
    <p class="cr-p">${esc(tx('r_main_earn'))}</p>
    ${buys.length ? `<h2 class="cr-h">${esc(tx('buys_h'))}</h2><div class="cr-ledger">${buys.map((x) => `<div><b>${esc(tx('buy_' + x.k, { p: money(x.c) }))}<small>${esc(plural(x.n, x.k === 'month' ? 'n_pays' : 'n_buys'))}</small></b><span class="v">${money(x.n * x.c)}</span></div>`).join('')}</div>
    <p class="cr-p">${esc(tx('buys_note'))}</p>${P.pro_until ? `<div class="cr-note">${I.star}<span>${esc(tx('work_pro', { d: dfmt(P.pro_until) }))}</span></div>` : ''}` : ''}
    <h2 class="cr-h">${esc(tx('funnel'))}</h2>
    <div class="cr-fun">${fun.map(([a, b, c], i) => `<div><span class="cr-k">${i + 1}</span><span class="t">${esc(a)}${c ? `<small>${esc(c)}</small>` : ''}</span><b>${b}</b></div>`).join('')}</div>
    ${own.length ? `<h2 class="cr-h">${esc(tx('per_video'))}</h2><div class="cr-vrows">${own.map((v) => `<button class="cr-vrow" data-cr="feed-mine" data-id="${esc(v.id)}">
      <img src="${esc(pImg(v.place))}" alt="" loading="lazy"><span class="m"><b>${esc(L(v.title))}</b><small>${esc(PLAT[v.platform])}, ${esc(pName(v.place))}</small>
      <span class="cr-chain">${[['c_views', v.views], ['c_clicks', v.clicks], ['c_pays', v.pays]].map(([k, n]) => `<span>${num(n)}<i>${esc(plural(n, k).slice(num(n).length + 1))}</i></span>`).join('')}<span class="acc">${money(v.earned.total_cents)}<i>${esc(tx('c_earned'))}</i></span></span></span></button>`).join('')}</div>${med()}` : ''}
    <h2 class="cr-h">${esc(tx('days_list'))}</h2>
    <div class="cr-ledger cr-days">${rows.map((o, i) => `<div${i >= 5 ? ' hidden' : ''}><span class="d">${esc(dfmt(o.date))}</span><b>${esc(dayParts(o))}</b><span class="v">${money(o.code + o.views + o.other)}</span></div>`).join('')}</div>
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

// ───────── «Мои ролики» ─────────
const RJ = { no_code: 'rj_no_code', gameplay: 'rj_gameplay', not_place: 'rj_not_place', reused: 'rj_reused' };
async function myVideosHTML(filter = 'all') {
  const vids = await api().listMyVideos(); await placesOf(vids);
  if (!vids.length) return `<div class="cr-empty">${I.video}<b>${esc(tx('videos_empty'))}</b><p>${esc(tx('videos_empty_p'))}</p><button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button></div>`;
  const F = { all: () => true, review: (v) => ['submitted', 'pending_review', 'awaiting_threshold'].includes(v.status), acc: (v) => v.status === 'accruing', no: (v) => ['rejected', 'unavailable'].includes(v.status) };
  const cnt = (k) => vids.filter(F[k]).length;
  return `<div class="cr-seg cr-seg4" role="tablist">${[['all', 'vf_all'], ['review', 'vf_review'], ['acc', 'vf_acc'], ['no', 'vf_no']].map(([k, l]) => `<button role="tab" data-cr="mvf" data-v="${k}" aria-selected="${k === filter}">${esc(tx(l))}<em>${cnt(k)}</em></button>`).join('')}</div>
    <div class="cr-list">${vids.filter(F[filter]).map((v) => `<button class="cr-li" data-cr="video" data-id="${esc(v.id)}"><img src="${esc(pImg(v.place))}" alt="" loading="lazy">
      <span class="m"><b>${esc(L(v.title) || pName(v.place))}</b><small>${esc(PLAT[v.platform])}, ${esc(pName(v.place))}</small>${stTag(v.status)}
      ${v.status === 'rejected' ? `<small class="no">${esc(tx(RJ[v.reject_code] || 'rj_not_place', { code: 'SB-' + v.id }))}</small>` : v.views ? `<small>${esc(tx('views_n', { n: num(v.views) }))}${moneyOK() && v.earned.total_cents ? `, ${money(v.earned.total_cents)}` : ''}</small>` : ''}</span>${I.chevron}</button>`).join('')}</div>
    ${moneyOK() ? med() : ''}<button class="btn-primary" data-cr="submit">${I.video}${esc(tx('submit_video'))}</button>`;
}
async function videoSheet(id) {
  const v = (await api().listMyVideos()).find((x) => x.id === id); if (!v) return;
  await place(v.place);
  if (v.status === 'accruing') { feedMine(id); return; }
  const code = 'SB-' + v.id, n = { submitted: 0, pending_review: 1, awaiting_threshold: 2 }[v.status] ?? 0;
  let h = `<div class="cr-sh"><h2>${esc(tx('vs_' + v.status))}</h2><p class="sub">${esc(PLAT[v.platform])}, ${esc(pName(v.place))}, ${esc(dfmt(v.submitted_at))}</p>`;
  if (v.status === 'rejected') h += `<div class="cr-note no">${I.alert}<span>${esc(tx(RJ[v.reject_code] || 'rj_not_place', { code }))}</span></div><button class="btn-primary" data-cr="submit" data-w="${v.place.world}" data-p="${esc(v.place.id)}">${esc(tx('send_again'))}</button><button class="btn-ghost" data-cr="open:rules">${esc(tx('rules'))}</button>`;
  else if (v.status === 'unavailable') h += `<div class="cr-note no">${I.info}<span>${esc(tx('vu_note'))}</span></div><button class="btn-ghost" data-cr="sheet-close">${esc(tx('ok'))}</button>`;
  else h += `${steps(n, code)}${field(tx('sv_ok_code'), code, code)}${field(tx('vstat_link'), link(P.ref_code, v.place.world, v.place.id, v.id), 'https://' + link(P.ref_code, v.place.world, v.place.id, v.id))}${v.views ? `<p class="cr-p">${esc(tx('views_n', { n: num(v.views) }))}</p>` : ''}<button class="btn-ghost" data-cr="sheet-close">${esc(tx('done'))}</button>`;
  ctx.openSheet(h + '</div>', 'cr-sheet');
}

// ───────── «Ролики об этом месте» — вертикальная лента ─────────
let feedList = [];
async function feedHTML(args) {
  let list = [];
  if (args.source === 'place') list = await api().listPlaceVideos(args.world, args.id);
  else if (args.source === 'league') list = await api().listLeagueVideos();
  else list = (await api().listMyVideos()).filter((v) => v.status === 'accruing').map((v) => ({ ...v, mine: true, author: '@' + P.nick }));
  if (args.mineOnly) list = list.filter((v) => v.mine);
  await placesOf(list.length ? list : [{ place: { world: args.world, id: args.id } }]);
  feedList = list;
  const tabs = args.source === 'place' && moneyOK() ? `<div class="cr-vtabs" role="tablist"><button role="tab" data-cr="feed-tab" data-v="place" aria-selected="${!args.mineOnly}">${esc(tx('feed_place'))}</button><button role="tab" data-cr="feed-tab" data-v="mine" aria-selected="${!!args.mineOnly}">${esc(tx('feed_mine'))}</button></div>` : '';
  if (!list.length) {
    const ref = { world: args.world, id: args.id };
    return `${head(tx('feed_place'))}${body(`<p class="cr-p">${pName(ref) ? esc(pName(ref)) + ', ' : ''}${esc(pCity(ref))}</p><div class="cr-empty">${I.video}<b>${esc(tx('feed_empty'))}</b><p>${esc(tx('feed_empty_p'))}</p><button class="btn-primary" data-cr="submit" data-w="${esc(args.world)}" data-p="${esc(args.id)}">${I.camera}${esc(tx('shoot'))}</button></div>`)}`;
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
        ${!isMinor() ? `<button class="cr-act" data-cr="submit" data-w="${v.place.world}" data-p="${esc(v.place.id)}">${I.camera}<span>${esc(tx('shoot'))}</span></button>` : ''}
        ${my ? `<button class="cr-act on" data-cr="vstats" data-id="${esc(v.id)}">${I.chart}<span>${esc(tx('stats'))}</span></button>` : ''}
      </div>
      <div class="cr-info">
        <p class="cr-who"><b>${esc(v.author)}</b>${v.mine ? `<em>${esc(tx('your_video'))}</em>` : v.team ? `<em>${esc(tx('team'))}</em>` : ''}<span>${esc(PLAT[v.platform])}</span></p>
        <p class="cr-vt">${esc(L(v.title))}</p><p class="cr-views">${I.eye}${esc(tx('views_n', { n: num(v.views) }))}</p>
        ${my ? `<div class="cr-vearn cr-solid"><div class="h"><span>${esc(tx('earn_video'))}</span><b>${money(my.earned.total_cents)}</b></div>${med('on-photo')}<div class="f"><span><b>${num(my.views)}</b>${esc(tx('f_views'))}</span><span><b>${num(my.clicks)}</b>${esc(tx('f_clicks'))}</span><span><b>${num(my.pays)}</b>${esc(tx('f_pays'))}</span></div></div>` : ''}
        <button class="cr-place cr-solid" data-cr="vplace" data-w="${v.place.world}" data-p="${esc(v.place.id)}"><img src="${esc(pImg(v.place))}" alt=""><span class="m"><b>${esc(pName(v.place))}</b><span>${esc(pCity(v.place))}</span></span>${I.chevron}</button>
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
async function statsSheet(id) {
  const [s, v] = await Promise.all([api().getVideoStats(id), api().listMyVideos().then((a) => a.find((x) => x.id === id))]);
  await place(v.place);
  const days = s.views_by_day.map((o) => ({ date: o.date, views: o.views }));
  const ymax = niceMax(Math.max(1, ...days.map((o) => o.views)));
  const read = days.map((o) => `<b>${esc(dfmt(o.date))}</b>: ${esc(tx('views_n', { n: num(o.views) }))}`);
  const l = link(P.ref_code, v.place.world, v.place.id, v.id);
  const h = `<div class="cr-sh"><h2>${esc(tx('vstat_h'))}</h2><p class="sub">${esc(PLAT[v.platform])}, ${esc(pName(v.place))}, ${esc(tx('s_since', { d: dfmt(v.submitted_at) }))}</p>
    <div class="cr-sbig"><span>${esc(tx('earn_video'))}</span><b>${money(s.earned.share_cents + s.earned.rpm_cents)}</b></div>${med()}
    <div class="cr-ledger"><div><b>${esc(tx('s_share'))}<small>${esc(plural(s.pays, 'd_share'))}, ${esc(tx('ru_hold_v'))}</small></b><span class="v">${money(s.earned.share_cents)}</span></div>
      <div><b>${esc(tx('s_rpm'))}<small>${esc(tx('views_n', { n: num(s.views) }))}${s.earned.rpm_cents ? '' : ', ' + esc(tx('s_rpm_low'))}</small></b><span class="v">${money(s.earned.rpm_cents)}</span></div></div>
    ${days.length ? `<h3 class="cr-h">${esc(tx('vstat_by_day'))}</h3><div class="cr-box" data-days="${esc(JSON.stringify(read))}">${dayBars(days, ['views'], ymax, tx('vstat_by_day'), (t) => (t >= 1000 ? Math.round(t / 1000) + (lang() === 'en' ? 'k' : ' тыс') : String(t)))}<p class="cr-read">${esc(tx('vstat_tap'))}</p></div>` : ''}
    <h3 class="cr-h">${esc(tx('funnel'))}</h3>
    <div class="cr-fun">${[[tx('f_views'), num(s.views), ''], [tx('f_clicks'), num(s.clicks), tx('f_of', { p: pct(s.clicks, s.views) })], [tx('f_trials'), num(s.trials), tx('f_of', { p: pct(s.trials, s.clicks) })], [tx('f_pays'), num(s.pays), tx('f_of', { p: pct(s.pays, s.trials) })]].map(([a, b, c], i) => `<div><span class="cr-k">${i + 1}</span><span class="t">${esc(a)}${c ? `<small>${esc(c)}</small>` : ''}</span><b>${b}</b></div>`).join('')}</div>
    ${field(tx('vstat_link'), l, 'https://' + l, tx('vstat_link_note'))}
    <button class="btn-ghost" data-cr="sheet-close">${esc(tx('close'))}</button></div>`;
  ctx.openSheet(h, 'cr-sheet');
  bindChart($('#sheet-body'));
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

// ───────── «Проверка» — лента карточек (смахнуть вправо / влево) ─────────
let queue = [], qi = 0;
const RR = { video: ['rr_v1', 'rr_v2', 'rr_v3', 'rr_v4'], place: ['rr_p4', 'rr_p2', 'rr_p1', 'rr_p5'], photo: ['rr_p1', 'rr_p2', 'rr_p3', 'rr_p4', 'rr_p5'] };
async function reviewHTML() {
  if (!isMod()) {
    return `${head(tx('review_how'))}${body(`<p class="cr-lead">${esc(tx('mod_how') + (noPay() ? '' : tx('mod_how_pay')))}</p>
      <div class="cr-lad2"><div class="on"><b>${esc(tx('mod_now', { n: 3 }))}</b>${bar(60)}</div><div><b>${esc(tx('mod_exam'))}</b></div><div><b>${esc(tx('mod_student'))}</b></div></div>
      <button class="btn-primary" data-cr="add">${I.plus}${esc(tx('add_minor'))}</button>`)}`;
  }
  queue = await api().getReviewQueue().catch(() => []); qi = 0;
  await placesOf(queue);
  return `${head(tx('review'))}<div class="cr-body cr-rv">${reviewTop()}<div class="cr-deck" data-deck>${deckCards()}</div>
    <p class="cr-hint">${esc(tx('rv_hint'))}</p>
    <div class="cr-rvbtns"><button class="cr-rb no" data-cr="rv" data-v="no" aria-label="${esc(tx('rv_no'))}">${I.close}<span>${esc(tx('rv_no'))}</span></button><button class="cr-rb ok" data-cr="rv" data-v="ok" aria-label="${esc(tx('rv_ok'))}">${I.check}<span>${esc(tx('rv_ok'))}</span></button></div></div>`;
}
function reviewTop() {
  const m = P.mod?.today || { checked: 0, accuracy: 0, cents: 0 };
  return `<div class="cr-rvtop"><b>${esc(tx('rv_today', { n: num(m.checked), a: m.accuracy }))}${noPay() ? '' : ' ' + esc(tx('rv_cents', { s: money(m.cents) }))}</b>${noPay() ? '' : med()}<span class="cr-left">${esc(tx('rv_left', { n: Math.max(0, queue.length - qi) }))}</span></div>`;
}
function cardHTML(q, depth) {
  const k = { video: tx('rv_k_video'), place: tx('rv_k_place'), photo: tx('rv_k_photo') }[q.kind];
  return `<article class="cr-card" data-id="${esc(q.id)}" style="--d:${depth}" aria-hidden="${depth ? 'true' : 'false'}">
    <div class="cr-card-ph"><img src="${esc(pImg(q.place, true))}" alt="" draggable="false">${q.kind === 'video' ? `<span class="cr-playbtn sm">${I.play}</span>` : ''}
      <span class="cr-stamp ok">${esc(tx('rv_ok'))}</span><span class="cr-stamp no">${esc(tx('rv_no'))}</span></div>
    <div class="cr-card-tx"><span class="cr-k">${esc(k)}${q.platform ? `, ${esc(PLAT[q.platform])}` : ''}</span><b>${esc(q.title ? L(q.title) : pName(q.place))}</b><small>${esc(pName(q.place))}, ${esc(pCity(q.place))}${q.author ? `, ${esc(q.author)}` : ''}</small>
      <ul>${(q.facts || []).map((f) => `<li class="${/missing/.test(f) ? 'no' : ''}">${/missing/.test(f) ? I.alert : I.check}${esc(tx('fc_' + f))}</li>`).join('')}</ul></div></article>`;
}
function deckCards() {
  if (qi >= queue.length) return `<div class="cr-empty">${I.check}<b>${esc(tx('rv_done'))}</b><p>${esc(tx('rv_done_p'))}</p><button class="btn-ghost" data-cr="rv-again">${esc(tx('rv_more'))}</button></div>`;
  return queue.slice(qi, qi + 3).map((q, i) => cardHTML(q, i)).reverse().join('');
}
function redrawDeck(scr) {
  const d = scr.querySelector('[data-deck]'); if (!d) return;
  d.innerHTML = deckCards(); scr.querySelector('.cr-rvtop').outerHTML = reviewTop(); bindDeck(scr);
  scr.querySelector('.cr-rvbtns').hidden = qi >= queue.length; scr.querySelector('.cr-hint').hidden = qi >= queue.length;
}
async function decide(scr, decision, reason) {
  const q = queue[qi]; if (!q) return;
  try { const r = await api().reviewDecision(q.id, decision, reason); if (P.mod) P.mod.today = r.today; } catch { ctx.toast(tx('err')); return; }
  const top = scr.querySelector(`.cr-card[data-id="${CSS.escape(q.id)}"]`);
  qi++;
  if (top) { top.classList.add(decision === 'ok' ? 'fly-r' : 'fly-l'); setTimeout(() => redrawDeck(scr), 260); } else redrawDeck(scr);
}
function askReason(scr) {
  const q = queue[qi]; if (!q) return;
  const card = scr.querySelector(`.cr-card[data-id="${CSS.escape(q.id)}"]`);
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('rv_why'))}</h2><div class="cr-reasons">${RR[q.kind].map((r) => `<button class="row" data-cr="rv-reason" data-v="${r}"><span class="row-l">${esc(tx(r))}</span></button>`).join('')}</div>
    <button class="btn-ghost" data-cr="sheet-close">${esc(tx('back'))}</button></div>`, 'cr-sheet', () => { if (card && !card.classList.contains('fly-l')) card.style.transform = ''; });
}
function bindDeck(scr) {
  const card = scr.querySelector('.cr-card[style*="--d:0"]'); if (!card) return;
  let x0 = 0, y0 = 0, dx = 0, on = false, id = null;
  const set = (x) => { card.style.transform = `translateX(${x}px) rotate(${x / 18}deg)`; card.style.setProperty('--ok', Math.max(0, Math.min(1, x / 110))); card.style.setProperty('--no', Math.max(0, Math.min(1, -x / 110))); };
  card.addEventListener('pointerdown', (e) => { on = true; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; card.setPointerCapture?.(id); card.classList.add('drag'); });
  card.addEventListener('pointermove', (e) => { if (!on) return; dx = e.clientX - x0; if (Math.abs(e.clientY - y0) > Math.abs(dx) * 1.5 && Math.abs(dx) < 10) return; set(dx); });
  const end = () => {
    if (!on) return; on = false; card.classList.remove('drag');
    if (dx > 100) { ctx.haptic?.(); decide(scr, 'ok'); }
    else if (dx < -100) { ctx.haptic?.(); card.style.transform = 'translateX(-24px) rotate(-1.5deg)'; askReason(scr); }
    else { card.style.transform = ''; card.style.setProperty('--ok', 0); card.style.setProperty('--no', 0); }
  };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
}

// ───────── «Честные правила» ─────────
function rulesHTML() {
  const sec = (t, rows) => `<h2 class="cr-h">${esc(tx(t))}</h2><div class="cr-ledger kv">${rows.map(([a, b]) => `<div><b>${esc(tx(a))}</b><span class="v">${esc(b.startsWith('=') ? b.slice(1) : tx(b))}</span></div>`).join('')}</div>`;
  const rl = (k) => '=' + tx('r_line', { r: money(R.rpm[k]), cap: money(R.rpm_cap_cents), min: money(R.rpm_min_cents) });
  if (noPay() || isMinor() || isTrial()) return `${head(tx('rules'))}${body(`${sec('ru_h_np', [['ru_np1', 'ru_np1v'], ['ru_np2', 'ru_np2v'], ['ru_np3', 'ru_np3v']])}
    ${sec('ru_h_no', [['ru_no1', 'ru_no1v'], ['ru_no2', 'ru_no2v'], ['ru_no3', 'ru_no3v'], ['ru_no4', 'ru_no4v'], ['ru_no5', 'ru_no5v']])}<p class="cr-p">${esc(tx('ru_change'))}</p>`)}`;
  return `${head(tx('rules'))}${body(`${med()}${sec('ru_h_rates', [['ru_code', 'ru_code_v'], ['ru_views', rl('tiktok')], ['ru_shorts', rl('shorts')], ['ru_author', 'ru_author_v'], ['ru_scout', 'ru_scout_v'], ['ru_cpa', 'ru_cpa_v'], ['ru_mod', 'ru_mod_v']])}
    ${sec('ru_h_terms', [['ru_views_t', 'ru_views_tv'], ['ru_tasks_t', 'ru_tasks_tv'], ['ru_hold', 'ru_hold_v'], ['ru_pay', 'ru_pay_v'], ['ru_first', 'ru_first_v'], ['ru_big', 'ru_big_v']])}
    <h2 class="cr-h">${esc(tx('ru_h_pro'))}</h2><p class="cr-p">${esc(tx('ru_pro_p'))}</p>
    ${sec('ru_h_no', [['ru_no1', 'ru_no1v'], ['ru_no2', 'ru_no2v'], ['ru_no3', 'ru_no3v'], ['ru_no4', 'ru_no4v'], ['ru_no5', 'ru_no5v']])}
    <h2 class="cr-h">${esc(tx('ru_h_rate'))}</h2><p class="cr-p">${esc(tx('ru_rate_p'))}</p>
    <h2 class="cr-h">${esc(tx('ru_h_ad'))}</h2><p class="cr-p">${esc(tx('ru_ad_p'))}</p><p class="cr-p">${esc(tx('ru_change'))}</p>`)}`;
}

// ───────── шторки: добавить, подать ролик, место, сообщить, вход, вывод, приглашение ─────────
let form = {};   // черновик формы — переживает вход почтой
function addSheet() {
  const g = ctx?.game?.() || 'gta6', minor = isMinor();
  const it = (cr, icon, t, d, attrs = '', lock = false) => `<button class="row cr-row${lock ? ' off' : ''}" data-cr="${cr}" ${attrs}><span class="row-ic">${ic(icon)}</span><span class="row-l">${esc(t)}<small>${esc(d)}</small></span><span class="row-chev">${lock ? I.lock : I.chevron}</span></button>`;
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('add_h'))}</h2><div class="group">
    ${minor ? '' : it('submit', 'video', tx('ty_video'), tx('ty_video_d'))}
    ${it('pform', 'pin', tx('ty_place'), tx('ty_place_d'))}
    ${it('locked', 'swap', tx('ty_pair'), tx('ty_pair_d'), 'data-v="soon_pair"', true)}
    ${g === 'gta6' ? it('locked', 'egg', tx('ty_found'), tx('ty_found_d6'), 'data-v="soon_found"', true) : it('pform', 'egg', tx('ty_found'), tx('ty_found_d5'), 'data-v="found"')}
    ${it('report', 'alert', tx('ty_report'), tx('ty_report_d'))}</div></div>`, 'cr-sheet');
}
async function submitSheet(pref) {
  if (pref) form.place = pref;
  if (!form.place) { const lg = await api().getLeague().catch(() => null); const w = lg?.tasks.find((x) => x.place)?.place; if (w) form.place = w; }
  if (isGuest() || !isPartner()) { loginSheet(() => submitSheet()); return; }
  if (form.place) await place(form.place);
  const p = form.place;
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('sv_h'))}</h2>
    <label class="cr-in"><span>${esc(tx('sv_url'))}</span><input id="cr-url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(tx('sv_url_ph'))}" value="${esc(form.url || '')}"></label>
    <div class="cr-field"><span>${esc(tx('sv_place'))}</span><b>${p ? `${esc(pName(p))}, ${esc(pCity(p))}` : '—'}</b><button class="cr-mini" data-cr="pick" data-next="submit">${esc(p ? tx('sv_change') : tx('sv_pick'))}</button></div>
    ${field(tx('sv_code'), P.ref_code)}
    <div class="cr-note">${I.info}<span>${esc(tx('sv_note'))}</span></div>
    <p class="cr-err" id="cr-err" hidden></p>
    <button class="btn-primary" data-cr="sv-send">${I.send}${esc(tx('sv_send'))}</button></div>`, 'cr-sheet');
}
async function svSend() {
  form.url = $('#cr-url')?.value.trim();
  const err = $('#cr-err');
  try {
    const r = await api().submitVideo({ url: form.url, world: form.place?.world, place_id: form.place?.id });
    const p = form.place, l = link(P.ref_code, p.world, p.id, r.link_v);
    form = {};
    ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('sv_ok'))}</h2><p class="sub">${esc(pName(p))}, ${esc(pCity(p))}</p>${steps(0, r.verify_code)}
      ${field(tx('sv_ok_code'), r.verify_code, r.verify_code)}${field(tx('sv_ok_link'), l, 'https://' + l, tx('sv_ok_link_note'))}
      <button class="btn-primary" data-cr="open:myvideos">${esc(tx('my_videos'))}</button></div>`, 'cr-sheet');
    renderHub(); if (stack.length) rerender();
  } catch (e) {
    if (err) { err.hidden = false; err.textContent = tx(e.code === 'no_place' ? 'sv_no_place' : e.code === 'bad_url' ? 'sv_bad_url' : 'err'); }
  }
}
async function pickSheet(next) {
  const g = form.place?.world || ctx?.game?.() || 'gta6';
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('pick_h'))}</h2><label class="cr-in"><span class="vh">${esc(tx('pick_ph'))}</span><input id="cr-q" type="search" autocomplete="off" placeholder="${esc(tx('pick_ph'))}" enterkeyhint="search"></label><div class="cr-picks" id="cr-picks"></div></div>`, 'cr-sheet');
  const box = $('#cr-picks'), d = await loadPlaces(g);
  const draw = (q) => {
    const res = (q ? searchPlaces(d, q) : featured(d, 'place', 12)).slice(0, 12);
    box.innerHTML = res.length ? res.map((o) => `<button class="cr-li" data-cr="picked" data-w="${g}" data-p="${esc(o.id)}" data-next="${next}"><img src="${esc(thumbOf(o))}" alt="" loading="lazy"><span class="m"><b>${esc(shortName(realOf(o)))}</b><small>${esc(o.a || '')}</small></span></button>`).join('') : `<p class="cr-p">${esc(tx('pick_none'))}</p>`;
  };
  draw('');
  $('#cr-q').addEventListener('input', (e) => draw(e.target.value.trim()));
}
async function placeForm(kind = 'place') {
  form.kind = form.kind || (kind === 'found' ? 'egg' : 'place'); form.side = form.side || 'real';
  if (form.place) await place(form.place);
  const seg = (k, opts) => `<div class="cr-seg">${opts.map(([v, l]) => `<button data-cr="pf-set" data-k="${k}" data-v="${v}" aria-selected="${form[k] === v}">${esc(tx(l))}</button>`).join('')}</div>`;
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('pf_h'))}</h2>
    <p class="cr-lbl">${esc(tx('pf_kind'))}</p>${seg('kind', [['place', 'k_place'], ['egg', 'k_egg']])}
    <p class="cr-lbl">${esc(tx('pf_side'))}</p>${seg('side', [['real', 'in_life'], ['game', 'in_game']])}
    <div class="cr-field"><span>${esc(tx('pf_where'))}</span><b>${form.place ? `${esc(pName(form.place))}, ${esc(pCity(form.place))}` : '—'}</b><button class="cr-mini" data-cr="pick" data-next="pform">${esc(form.place ? tx('sv_change') : tx('sv_pick'))}</button></div>
    <label class="cr-in"><span>${esc(tx('pf_where'))}</span><input id="cr-where" type="text" autocomplete="off" placeholder="${esc(tx('pf_where_ph'))}" value="${esc(form.where || '')}"></label>
    <label class="cr-in"><span>${esc(tx('pf_src'))}</span><input id="cr-src" type="text" autocomplete="off" placeholder="${esc(tx('pf_src_ph'))}" value="${esc(form.source || '')}"></label>
    <p class="cr-err" id="cr-err" hidden></p>
    <button class="btn-primary" data-cr="pf-send">${I.send}${esc(tx('sv_send'))}</button></div>`, 'cr-sheet');
}
function keepPlaceFields() { form.where = $('#cr-where')?.value.trim() ?? form.where; form.source = $('#cr-src')?.value.trim() ?? form.source; }
async function pfSend(type) {
  keepPlaceFields();
  if (!form.place && !form.where) { const e = $('#cr-err'); if (e) { e.hidden = false; e.textContent = tx('req_fields'); } return; }
  if (isGuest()) { loginSheet(() => pfSend(type), true); return; }
  try { await api().submitContribution({ type, place: form.place || null, where: form.where, side: form.side, ref_kind: form.kind, source: form.source, note: form.note }); } catch { ctx.toast(tx('err')); return; }
  form = {};
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('sent_h'))}</h2><div class="cr-steps"><div class="on">${I.check}<span>${esc(tx('sent_1'))}</span></div><div>${I.clock}<span>${esc(tx('sent_2'))}</span></div></div>
    <p class="cr-p">${esc(tx('sent_p', { n: P.nick || 'nick' }))}</p><button class="btn-ghost" data-cr="sheet-close">${esc(tx('done'))}</button></div>`, 'cr-sheet');
}
function reportSheet() {
  form.reason = form.reason || 'rp_r1';
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('rp_h'))}</h2><div class="cr-chips">${['rp_r1', 'rp_r2', 'rp_r3', 'rp_r4'].map((r) => `<button data-cr="rp-set" data-v="${r}" aria-pressed="${form.reason === r}">${esc(tx(r))}</button>`).join('')}</div>
    <label class="cr-in"><span>${esc(tx('rp_note'))}</span><input id="cr-note" type="text" autocomplete="off" placeholder="${esc(tx('rp_note_ph'))}" value="${esc(form.note || '')}"></label>
    <div class="cr-field"><span>${esc(tx('pf_where'))}</span><b>${form.place ? `${esc(pName(form.place))}` : '—'}</b><button class="cr-mini" data-cr="pick" data-next="report">${esc(form.place ? tx('sv_change') : tx('sv_pick'))}</button></div>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="rp-send">${I.send}${esc(tx('sv_send'))}</button></div>`, 'cr-sheet');
}
let loginNext = null, loginEmail = '';
function loginSheet(next, draft = false) {
  loginNext = next || null;
  if (!isGuest() && !P.adult_at && !P.minor) { ageSheet(); return; }
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('lg_h'))}</h2><p class="sub">${esc(tx('lg_sub'))}</p>
    <label class="cr-in"><span>${esc(tx('lg_email'))}</span><input id="cr-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="name@mail.com" value="${esc(loginEmail || P?.email || '')}"></label>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="lg-send">${I.mail}${esc(tx('lg_send'))}</button>
    <p class="cr-p">${esc(tx('lg_note'))}${draft ? ' ' + esc(tx('lg_draft')) + '.' : ''}</p></div>`, 'cr-sheet');
}
function codeSheet() {
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('lg_code_h'))}</h2><p class="sub">${esc(tx('lg_code_sub', { e: loginEmail }))}</p>
    <label class="cr-in"><span>${esc(tx('lg_code'))}</span><input id="cr-code" class="otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="0000"></label>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="lg-code">${esc(tx('lg_enter'))}</button></div>`, 'cr-sheet');
}
function ageSheet() {
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('lg_age_h'))}</h2><p class="sub">${esc(tx('lg_age_sub'))}</p>
    <div class="cr-two"><button class="btn-primary" data-cr="lg-age" data-v="1">${esc(tx('lg_yes'))}</button><button class="btn-ghost" data-cr="lg-age" data-v="0">${esc(tx('lg_no'))}</button></div></div>`, 'cr-sheet');
}
async function afterLogin() {
  P = await api().getProfile(); await renderHub(); if (stack.length) await rerender();
  const n = loginNext; loginNext = null;
  if (n) n(); else ctx.closeSheet();
}
async function withdrawSheet() {
  const e = await api().getEarnings(), av = e.totals.available;
  if (av < R.payout_min_cents) {
    ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('wd_below_h', { min: money(R.payout_min_cents) }))}</h2><p class="cr-p">${esc(tx('wd_below_p', { s: money(av) }))}</p>${med()}<button class="btn-ghost" data-cr="sheet-close">${esc(tx('ok'))}</button></div>`, 'cr-sheet');
    return;
  }
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('wd_h', { s: money(av) }))}</h2><p class="sub">${esc(tx('wd_sub', { d: dfmt(e.round_date), min: money(R.payout_min_cents) }))}</p>${med()}
    <div class="cr-steps"><div class="on">${I.check}<span>${esc(tx('wd_1', { s: money(av) }))}</span></div><div>${I.clock}<span>${esc(tx('wd_2', { e: P.email }))}</span></div><div>${I.clock}<span>${esc(tx('wd_3', { d: dfmt(e.round_date) }))}</span></div></div>
    <p class="cr-p">${esc(tx('wd_fee'))}</p><button class="btn-primary" data-cr="wd-send">${esc(tx('wd_send'))}</button></div>`, 'cr-sheet');
}
function inviteSheet() {
  ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('inv_h'))}</h2><p class="sub">${esc(tx('inv_p'))}</p>
    <label class="cr-in"><span>${esc(tx('inv_h'))}</span><input id="cr-inv" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(tx('inv_ph'))}"></label>
    <p class="cr-err" id="cr-err" hidden></p><button class="btn-primary" data-cr="inv-send">${esc(tx('inv_send'))}</button></div>`, 'cr-sheet');
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
  review: { html: reviewHTML, bind: (s) => bindDeck(s) },
  feed: { html: async (a) => `<div class="cr-vscr">${await feedHTML(a)}</div>`, bind: bindFeed },
};
function feedMine(id) {
  api().listMyVideos().then((a) => { const acc = a.filter((v) => v.status === 'accruing'); const i = Math.max(0, acc.findIndex((v) => v.id === id)); ctx.closeSheet(); push('feed', { source: 'mine', start: i }); });
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
    case 'vstats': statsSheet(el.dataset.id); break;
    case 'video': videoSheet(el.dataset.id); break;
    case 'copy': try { await navigator.clipboard.writeText(v); ctx.toast(tx('copied')); } catch { ctx.toast(v); } break;
    case 'share-link': { const u = 'https://' + link(P.ref_code); try { if (navigator.share) await navigator.share({ url: u, title: APP.shortName }); else { await navigator.clipboard.writeText(u); ctx.toast(tx('copied')); } } catch { } break; }
    case 'alldays': { const open = el.dataset.open !== '1'; $$('.cr-days > div', scr).forEach((r, i) => { if (i >= 5) r.hidden = !open; }); el.dataset.open = open ? '1' : '0'; el.textContent = open ? tx('collapse') : tx('all_days', { n: el.dataset.n }); break; }
    case 'add': await load(); addSheet(); break;
    case 'submit': await load(); submitSheet(el.dataset.p ? { world: el.dataset.w, id: el.dataset.p } : null); break;
    case 'sv-send': svSend(); break;
    case 'pick': form.url = $('#cr-url')?.value.trim() ?? form.url; keepPlaceFields(); form.note = $('#cr-note')?.value.trim() ?? form.note; pickSheet(el.dataset.next); break;
    case 'picked': form.place = { world: el.dataset.w, id: el.dataset.p }; await place(form.place); ({ submit: () => submitSheet(), pform: () => placeForm(), report: reportSheet })[el.dataset.next]?.(); break;
    case 'pform': form = { place: form.place }; placeForm(v); break;
    case 'pf-set': keepPlaceFields(); form[el.dataset.k] = v; placeForm(); break;
    case 'pf-send': pfSend('place'); break;
    case 'report': form = { place: form.place }; reportSheet(); break;
    case 'rp-set': form.note = $('#cr-note')?.value.trim(); form.reason = v; reportSheet(); break;
    case 'rp-send': form.note = $('#cr-note')?.value.trim(); if (!form.place) { const er = $('#cr-err'); er.hidden = false; er.textContent = tx('req_fields'); break; } pfSend('report'); break;
    case 'locked': ctx.toast(tx(v)); break;
    case 'lg-send': {
      const em = $('#cr-email').value.trim(), er = $('#cr-err');
      try { await api().signIn(em); loginEmail = em; codeSheet(); setTimeout(() => $('#cr-code')?.focus(), 350); } catch { er.hidden = false; er.textContent = tx('lg_bad_email'); }
      break;
    }
    case 'lg-code': {
      const c = $('#cr-code').value.trim(), er = $('#cr-err');
      try { P = await api().verifyCode(loginEmail, c); if (!P.adult_at && !P.minor) ageSheet(); else afterLogin(); } catch { er.hidden = false; er.textContent = tx('lg_bad_code'); }
      break;
    }
    case 'lg-age': {
      P = await api().confirmAge(v === '1');
      if (v === '1') afterLogin();
      else { loginNext = null; await renderHub(); ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('lg_minor_h'))}</h2><p class="sub">${esc(tx('lg_minor_sub'))}</p><button class="btn-primary" data-cr="sheet-close">${esc(tx('ok'))}</button></div>`, 'cr-sheet'); }
      break;
    }
    case 'withdraw': withdrawSheet(); break;
    case 'wd-send': {
      try { const r = await api().requestPayout(); ctx.openSheet(`<div class="cr-sh"><h2>${esc(tx('wd_ok_h'))}</h2><p class="sub">${money(r.amount_cents)}</p>${med()}<div class="cr-steps"><div class="on">${I.check}<span>${esc(tx('wd_ok_1'))}</span></div><div class="on">${I.check}<span>${esc(tx('wd_ok_2'))}</span></div><div>${I.clock}<span>${esc(tx('wd_ok_3', { d: dfmt(r.round_date) }))}</span></div></div><button class="btn-ghost" data-cr="sheet-close">${esc(tx('done'))}</button></div>`, 'cr-sheet'); rerender(); } catch { ctx.toast(tx('err')); }
      break;
    }
    case 'invite': inviteSheet(); break;
    case 'inv-send': {
      const er = $('#cr-err');
      try { await api().redeemInvite($('#cr-inv').value.trim()); P = await api().getProfile(); ctx.closeSheet(); ctx.toast(tx('inv_ok')); rerender(); renderHub(); }
      catch (x) { er.hidden = false; er.textContent = tx(x.code === 'expired' ? 'inv_old' : 'inv_bad'); }
      break;
    }
    case 'rv': { const s = stack[stack.length - 1]?.el; if (v === 'ok') decide(s, 'ok'); else askReason(s); break; }
    case 'rv-reason': { ctx.closeSheet(); decide(stack[stack.length - 1]?.el, 'no', v); break; }
    case 'rv-again': { const s = stack[stack.length - 1]; await rerender(); bindDeck(s.el); break; }
    case 'sheet-close': ctx.closeSheet(); break;
  }
}

// ───────── вход ─────────
export function init(c) {
  ctx = c;
  if (init.done) return; init.done = true;
  document.addEventListener('click', onClick);
}
/** Лента «Ролики об этом месте» — вызывает карточка места (сессия карты): window.SB.openPlaceVideos('gta6', 'gta6-…') */
export async function openPlaceVideos(world, placeId) { await load(); ctx?.closeSheet?.(); return push('feed', { source: 'place', world, id: placeId }); }
/** Любой экран креатора: league | earn | myvideos | mylink | review | rules */
export async function openCreator(id = 'league', args = {}) { await load(); return push(id, args); }
/** Сброс кэша профиля (смена языка, вход) — хаб перерисуется */
export async function refresh() { await load(true); return renderHub(); }
export function relang() { renderHub(); if (stack.length) rerender(); }
