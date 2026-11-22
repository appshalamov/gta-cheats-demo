// Secret Base — сайт-презентация (sbgta.app/about/). v2, 22.11.2026: тексты и структура — «Презентация — смыслы/05 Fable — финальный
// текст и ТЗ.md». Данные мест — about/places.json (tools/build_about.py из data/map приложения), коды — data/gta6.json и gta5.json,
// новости — data/news.json. Язык: английский по умолчанию, ?lang=ru или переключатель RU (выбор запоминается). ?deck — режим слайдов для PDF, ?nopay — без слов о программе.
(() => {
  const T = {
    ru: {
      h1: 'Места из GTA —<br>в реальной жизни',
      lead: 'Secret Base — гид по миру GTA в реальной жизни. Показывает, где место из игры находится на самом деле, как туда попасть и что там снять. И держит под рукой чит-коды — кнопками вашего контроллера.',
      roles_l: 'Гид для троих:', r1: 'играю', r2: 'снимаю', r3: 'еду',
      b_open: 'Открыть приложение', b_pdf: 'Скачать презентацию', b_contact: 'Связаться',
      qr_p: 'Смотрите с компьютера? Наведите камеру телефона — откроется sbgta.app.',
      cmp_game: 'В игре', cmp_life: 'В жизни',
      disc_s: 'Неофициальное приложение. Не связано с Rockstar Games и Take-Two Interactive.',
      ins_h: 'Поставьте за минуту — прямо с сайта',
      ins_p: 'App Store — скоро. Google Play — скоро. Сейчас — с сайта sbgta.app.',
      ins1: 'Откройте sbgta.app в Safari, нажмите «•••» у адресной строки, затем «Поделиться».',
      ins2: 'Выберите «На экран „Домой“».',
      ins3: 'Нажмите «Добавить». Переключатель «Открыть как веб-приложение» оставьте включённым.',
      ins4: 'Значок Secret Base появится среди ваших приложений.',
      ins_n: 'Android: Chrome, меню с тремя точками, «Добавить на главный экран». iOS 18 и раньше: «Поделиться» в нижней панели Safari.',
      cmp_h: 'Один жест: слева игра, справа то же место сегодня',
      cmp_p: 'Потяните ручку — кадр из игры сменится фотографией настоящего места, снятой с того же ракурса. Так устроена карточка каждого места. Сравнений в приложении больше четырёхсот.',
      cmp_pick: 'Выберите место',
      st_h: 'Города GTA списаны с настоящих',
      st_p: 'GTA 6 вышла 19 ноября 2026 года. Её улицы, отели и мосты повторяют Майами и Флориду, а GTA 5 — Лос‑Анджелес. Secret Base знает, где именно: около 500 мест на настоящей карте.',
      st_q: 'Гид один, а пользуются им по-разному. Зачем пришли вы?',
      st_r1: 'Играю', st_r2: 'Снимаю ролики', st_r3: 'Еду посмотреть',
      pl_h: 'Игроку: код под рукой и всё, что спрятано в игре',
      pl_p: 'Задача простая: быстро ввести код и ничего не пропустить в открытом мире.',
      pl1_h: 'Чит-коды кнопками вашего контроллера', pl1_p: '54 кода для GTA 6 и GTA 5. Выбираете PlayStation или Xbox — код показан вашими кнопками. Для GTA 5 есть ещё ПК и телефон в игре.',
      pl2_h: '«Озвучить»', pl2_p: 'Приложение читает код вслух и подсвечивает кнопки по очереди. Руки остаются на контроллере.',
      pl3_h: 'Пасхалки', pl3_p: 'Около 50 пасхалок на карте. У каждой — что это, где искать и какое настоящее место за ней стоит.',
      pl4_h: 'Карта игры и коллекции', pl4_p: 'Переключатель «Жизнь ⇄ Игра» показывает ту же точку в мире игры. В GTA 5 — коллекции: отмечаете найденное, счёт ведётся сам.',
      pl5_h: 'Избранное и работа без сети', pl5_p: 'Сердечко на коде — и он на вкладке «Избранное». Коды открываются и без интернета.',
      pl_src: 'Каждый код GTA 6 подтверждён двумя независимыми источниками.',
      pl_try: 'Попробуйте: выберите платформу и нажмите «Озвучить».',
      pl_s1: 'Пасхалка: что это и где настоящее место', pl_s2: 'Коллекции GTA 5: найденное отмечено',
      say: 'Озвучить', saying: 'Читаю…',
      tr_h: 'Путешественнику: приехать и встать на то самое место',
      tr_p: 'Вы в Майами или Лос‑Анджелесе — или только собираетесь. Гид отвечает на четыре вопроса: где это, пустят ли, откуда смотреть и что рядом.',
      tr1_h: 'Настоящий адрес', tr1_p: 'Около 500 мест на карте Майами, Флориды и Лос‑Анджелеса. В карточке — настоящее название и адрес, а не игровое.',
      tr2_h: '«Открыть в Картах»', tr2_p: 'Одно нажатие — и точка в Google Maps или Apple Maps. Дальше ведёт ваш навигатор.',
      tr3_h: '«Осмотреться 360°»', tr3_p: 'Вид с улицы ещё до поездки: понятно, стоит ли ехать и где встать.',
      tr4_h: 'Доступ и совет', tr4_p: 'Сразу видно: открыто для всех, только для гостей, смотреть с улицы или вход закрыт. И совет — как подъехать и откуда снять «как в игре».',
      tr5_h: 'Насколько похоже', tr5_p: '«Точная копия», «очень похоже» или «версия фанатов» — отметка и источники есть у каждого места.',
      tr6_h: 'Сохранить место', tr6_p: 'Сердечко на карточке — место на вкладке «Избранное». Список хранится на вашем устройстве, регистрация не нужна.',
      tr_try: 'Нажмите на место — откроется сравнение. Сердечко сохранит его в список ниже: так же работает избранное в приложении.',
      tr_fav: 'Ваш список', tr_fav0: 'Пока пусто. Отметьте сердечком любое место.',
      tr_all: 'Показать все места', tr_map: 'На карте каждая точка — место из игры в настоящем городе.',
      tr_s1: 'Карточка места: доступ, сходство и совет', tr_s2: 'Избранное: сохранённые места',
      mia: 'Майами', la: 'Лос‑Анджелес', keys: 'Флорида‑Кис', map_wait: 'Загружаем карту…',
      m_app: 'Открыть в приложении', m_maps: 'Открыть в Картах', m_cmp: 'Сравнить', save: 'Сохранить', saved: 'Сохранено',
      ac_public: 'Можно свободно', ac_business: 'Для гостей', ac_view_from_street: 'Смотреть с улицы', ac_restricted: 'Вход закрыт', ac_gone: 'Закрыто / снесено',
      cf_confirmed: 'Точная копия', cf_likely: 'Очень похоже', cf_speculative: 'Версия фанатов', tip: 'Совет',
      cr_h: 'Автору роликов: сюжет уже найден',
      cr_p: 'Тему «GTA в реальной жизни» зрители любят, но место в ролике видно пять секунд, а адрес потом ищут в комментариях. Здесь у каждого места есть и сюжет, и адрес.',
      cr1_h: 'Готовая пара', cr1_p: 'Кадр игры и то же место в жизни с одного ракурса. Понятно, что снимать и с чем сравнивать.',
      cr2_h: 'Разведка без поездки', cr2_p: 'Вид 360°, отметка о доступе и совет, откуда снимать, — раньше, чем вы достали камеру.',
      cr3_h: 'Ссылка на каждое место', cr3_p: 'В мессенджере и под роликом она выглядит как картинка «игра | жизнь» и открывает сразу это место.',
      cr4_h: 'Поводы каждую неделю', cr4_p: 'Лента «Новое» показывает, что нашли в игре и какие места только что появились на карте.',
      cr_soon: 'На подходе',
      cr5_h: 'Личная ссылка с кодом — <mark>скоро</mark>', cr5_p: 'Будет видно, сколько зрителей пришло с каждого ролика.',
      cr6_h: 'Партнёрская программа — <mark>запускаем</mark>', cr6_p: 'Доля с покупок, сделанных по вашей ссылке. Участие бесплатное, с 18 лет. Выплат ещё не было; условия публикуем заранее и без мелкого шрифта.',
      cr7_h: 'Кабинет автора — <mark>закрытая бета</mark>', cr7_p: 'Ролики, ссылки и статистика в одном месте.',
      cr_try: 'Выберите место — увидите, как его ссылка выглядит в переписке.',
      cr_msg: 'Смотри, это же из GTA', cr_sch: 'Ссылка под роликом открывает зрителю это место',
      og_t: '{p} — в игре и в жизни',
      nw_h: 'Игра вышла — гид растёт каждую неделю',
      nw_p: 'В игре постоянно находят новое. Команда проверяет находки и переносит их на карту — так новость становится местом, куда можно приехать.',
      nw1_h: 'Новость', nw1_p: 'Лента «Новое» на главном экране: что нашли, когда и кто об этом написал.',
      nw2_h: 'Проверка', nw2_p: 'Место или пасхалка попадает в гид только после двух независимых источников и сверки точки на карте.',
      nw3_h: 'Точка на карте', nw3_p: 'Новая пасхалка или место получает метку «Новое» и неделю стоит первой в подборках.',
      nw_last: 'Недавно добавлено',
      nw4_h: 'Фото мест от игроков — <mark>скоро</mark>',
      nw4_p: 'Не у каждой точки есть пара «игра | жизнь». Скоро её сможет прислать тот, кто оказался рядом, — за вознаграждение. Каждое фото проверяет человек.',
      nw4_np: 'Не у каждой точки есть пара «игра | жизнь». Скоро её сможет прислать тот, кто оказался рядом. Каждое фото проверяет человек.',
      nw_s1: 'Главная: лента «Новое»', d_new: 'Новое', d_game: 'В игре', d_life: 'В жизни',
      now_h: 'Что работает сегодня и что на подходе',
      now_l: 'Сегодня, у всех пользователей', soon_l: 'Скоро',
      now: ['Чит-коды GTA 6 и GTA 5 кнопками контроллера, с озвучкой', 'Карта настоящих мест и карта игры, переключатель «Жизнь ⇄ Игра»',
        'Сравнение «в игре ⇄ в жизни», вид 360°, «Открыть в Картах»', 'Избранное: места, пасхалки, коды', 'Пасхалки и лента «Новое»',
        'Ссылка на каждое место с картинкой «игра | жизнь»', 'Русский и английский, iPhone и Android, пробный доступ — три дня'],
      soon: ['App Store и Google Play', 'Личная ссылка автора и статистика переходов', '!pay Партнёрская программа для авторов', 'Фото мест от игроков',
        'Карта GTA 6 из самой игры; сейчас — карта сообщества', 'Коды для прежних частей серии'],
      end_h: 'Из игры —<br>в жизнь',
      end_p: 'Работает уже сейчас на iPhone и Android. Пробный доступ — три дня.',
      end_s: 'App Store — скоро. Google Play — скоро. Сейчас — с сайта.',
      end_b2b: 'Партнёрам и инвесторам: напишите — покажем продукт и планы.',
      disc: 'Неофициальное приложение. Не связано с Rockstar Games и Take-Two Interactive. Кадры игры — © Rockstar Games; фото — с автором и лицензией.',
      cap_g: 'Кадр игры', cap_r: 'Фото', close: 'Закрыть',
      wa_text: 'Здравствуйте! Пишу по поводу Secret Base.',
      title: 'Secret Base — места из GTA в реальной жизни',
    },
    en: {
      h1: 'GTA places<br>in real life',
      lead: 'Secret Base is a guide to the world of GTA in real life. It shows where a place from the game actually is, how to get there and what to film. And it keeps cheat codes at hand, shown as the buttons on your controller.',
      roles_l: 'One guide, three ways in:', r1: 'I play', r2: 'I film', r3: 'I travel',
      b_open: 'Open the app', b_pdf: 'Download the deck', b_contact: 'Get in touch',
      qr_p: 'On a computer? Point your phone camera here to open sbgta.app.',
      cmp_game: 'In game', cmp_life: 'In real life',
      disc_s: 'Unofficial app. Not affiliated with Rockstar Games or Take-Two Interactive.',
      ins_h: 'Install in a minute, straight from the site',
      ins_p: 'App Store: coming soon. Google Play: coming soon. For now, from sbgta.app.',
      ins1: 'Open sbgta.app in Safari, tap “•••” by the address bar, then Share.',
      ins2: 'Choose Add to Home Screen.',
      ins3: 'Tap Add. Leave “Open as Web App” switched on.',
      ins4: 'The Secret Base icon appears among your apps.',
      ins_n: 'Android: in Chrome, open the three-dot menu and choose Add to Home screen. iOS 18 and earlier: Share is in Safari’s bottom bar.',
      cmp_h: 'One gesture: the game on the left, the same place today on the right',
      cmp_p: 'Drag the handle and the game frame gives way to a photo of the real place, taken from the same angle. Every place card works this way. The app has more than 400 comparisons.',
      cmp_pick: 'Pick a place',
      st_h: 'GTA’s cities are copied from real ones',
      st_p: 'GTA 6 came out on November 19, 2026. Its streets, hotels and bridges follow Miami and Florida; GTA 5 follows Los Angeles. Secret Base knows exactly where: about 500 places on the real map.',
      st_q: 'One guide, used three different ways. What brings you here?',
      st_r1: 'I play', st_r2: 'I make videos', st_r3: 'I’m going to see it',
      pl_h: 'For players: codes at hand, and everything the game hides',
      pl_p: 'The job is simple: enter a code fast and miss nothing in the open world.',
      pl1_h: 'Cheat codes as your controller’s buttons', pl1_p: '54 codes for GTA 6 and GTA 5. Pick PlayStation or Xbox and the code appears as your own buttons. GTA 5 also covers PC and the in-game phone.',
      pl2_h: 'Read aloud', pl2_p: 'The app reads the code out loud and lights up each button in turn. Your hands stay on the controller.',
      pl3_h: 'Easter eggs', pl3_p: 'About 50 easter eggs on the map. Each one says what it is, where to look and which real place is behind it.',
      pl4_h: 'Game map and collectibles', pl4_p: 'The Real life ⇄ Game switch shows the same spot in the game world. In GTA 5 there are collectibles: mark what you’ve found and the count keeps itself.',
      pl5_h: 'Favorites and offline', pl5_p: 'Tap the heart on a code and it’s in your Favorites tab. Codes open without a connection too.',
      pl_src: 'Every GTA 6 code is confirmed by two independent sources.',
      pl_try: 'Try it: pick a platform and tap Read aloud.',
      pl_s1: 'Easter egg: what it is and where the real place is', pl_s2: 'GTA 5 collectibles: found ones are marked',
      say: 'Read aloud', saying: 'Reading…',
      tr_h: 'For travelers: get there and stand on the exact spot',
      tr_p: 'You’re in Miami or Los Angeles, or about to be. The guide answers four questions: where it is, whether you can get in, where to stand and what’s nearby.',
      tr1_h: 'The real address', tr1_p: 'About 500 places across Miami, Florida and Los Angeles. Each card gives the real name and address, not the in-game one.',
      tr2_h: 'Open in Maps', tr2_p: 'One tap puts the spot in Google Maps or Apple Maps. Your own navigation takes it from there.',
      tr3_h: 'Look around 360°', tr3_p: 'A street-level view before you go, so you know if it’s worth the trip and where to stand.',
      tr4_h: 'Access and a tip', tr4_p: 'You see at once: open to all, guests only, view from the street, or closed. Plus a tip on how to get there and where to shoot it “like in the game”.',
      tr5_h: 'How close the match is', tr5_p: 'Exact copy, very similar or fan theory: every place carries its rating and its sources.',
      tr6_h: 'Save a place', tr6_p: 'Tap the heart on a card and the place is in your Favorites tab. The list lives on your device, no sign-up needed.',
      tr_try: 'Tap a place to open its comparison. The heart saves it to the list below, just as Favorites work in the app.',
      tr_fav: 'Your list', tr_fav0: 'Nothing yet. Tap the heart on any place.',
      tr_all: 'Show all places', tr_map: 'On the map, every dot is a place from the game in a real city.',
      tr_s1: 'Place card: access, match and a tip', tr_s2: 'Favorites: saved places',
      mia: 'Miami', la: 'Los Angeles', keys: 'Florida Keys', map_wait: 'Loading the map…',
      m_app: 'Open in the app', m_maps: 'Open in Maps', m_cmp: 'Compare', save: 'Save', saved: 'Saved',
      ac_public: 'Free to visit', ac_business: 'Open to guests', ac_view_from_street: 'View from street', ac_restricted: 'No entry', ac_gone: 'Closed / gone',
      cf_confirmed: 'Exact copy', cf_likely: 'Very similar', cf_speculative: 'Fan theory', tip: 'Tip',
      cr_h: 'For creators: the story is already found',
      cr_p: 'Viewers love “GTA in real life”, but a place is on screen for five seconds and then people hunt for the address in the comments. Here every place comes with both the story and the address.',
      cr1_h: 'A ready-made pair', cr1_p: 'The game frame and the same place in real life, from the same angle. You know what to shoot and what to compare it with.',
      cr2_h: 'Scouting without the trip', cr2_p: 'A 360° view, the access note and a tip on where to shoot from, before the camera comes out.',
      cr3_h: 'A link for every place', cr3_p: 'In a chat or under a video it shows up as a “game | real life” picture and opens that exact place.',
      cr4_h: 'Fresh topics every week', cr4_p: 'The New feed shows what’s been found in the game and which places have just reached the map.',
      cr_soon: 'Coming up',
      cr5_h: 'Your own link with a code — <mark>soon</mark>', cr5_p: 'You’ll see how many viewers each video brought in.',
      cr6_h: 'Partner program — <mark>launching</mark>', cr6_p: 'A share of purchases made through your link. Free to join, 18 and over. No payouts have been made yet; the terms are published in advance, with no fine print.',
      cr7_h: 'Creator dashboard — <mark>closed beta</mark>', cr7_p: 'Your videos, links and stats in one place.',
      cr_try: 'Pick a place to see how its link looks in a chat.',
      cr_msg: 'Look, this one’s from GTA', cr_sch: 'The link under your video opens that place for the viewer',
      og_t: '{p}, in the game and in real life',
      nw_h: 'The game is out, and the guide grows every week',
      nw_p: 'People keep finding new things in the game. The team checks each find and puts it on the map, so a piece of news becomes a place you can visit.',
      nw1_h: 'The news', nw1_p: 'The New feed on the home screen: what was found, when, and who reported it.',
      nw2_h: 'The check', nw2_p: 'A place or easter egg enters the guide only after two independent sources and a check of its spot on the map.',
      nw3_h: 'A dot on the map', nw3_p: 'A new easter egg or place gets a New label and leads the collections for a week.',
      nw_last: 'Recently added',
      nw4_h: 'Place photos from players — <mark>soon</mark>',
      nw4_p: 'Not every dot has its “game | real life” pair yet. Soon anyone who happens to be nearby will be able to send one in, for a reward. Every photo is reviewed by a person.',
      nw4_np: 'Not every dot has its “game | real life” pair yet. Soon anyone who happens to be nearby will be able to send one in. Every photo is reviewed by a person.',
      nw_s1: 'Home: the New feed', d_new: 'New', d_game: 'In game', d_life: 'In real life',
      now_h: 'What works today and what’s coming',
      now_l: 'Today, for every user', soon_l: 'Soon',
      now: ['Cheat codes for GTA 6 and GTA 5 as controller buttons, read aloud', 'A map of real places and a game map, with the Real life ⇄ Game switch',
        'In game ⇄ in real life comparison, 360° view, Open in Maps', 'Favorites: places, easter eggs, codes', 'Easter eggs and the New feed',
        'A link for every place with a “game | real life” picture', 'Russian and English, iPhone and Android, three-day trial'],
      soon: ['App Store and Google Play', 'Creator links with visit stats', '!pay Partner program for creators', 'Place photos from players',
        'GTA 6 map from the game itself; for now, a community map', 'Codes for earlier games in the series'],
      end_h: 'From the game<br>to real life',
      end_p: 'Works right now on iPhone and Android. Three-day trial.',
      end_s: 'App Store: coming soon. Google Play: coming soon. For now, from the site.',
      end_b2b: 'Partners and investors: get in touch and we’ll walk you through the product and the plans.',
      disc: 'Unofficial app. Not affiliated with Rockstar Games or Take-Two Interactive. Game frames © Rockstar Games; photos credited with author and license.',
      cap_g: 'Game frame', cap_r: 'Photo', close: 'Close',
      wa_text: 'Hi! I am writing about Secret Base.',
      title: 'Secret Base — GTA places in real life',
    },
  };
  const q = new URLSearchParams(location.search);
  const html = document.documentElement;
  const DECK = q.has('deck');
  // Россия и Беларусь — без слов о программе и вознаграждении (Выжимка §10 п. 10)
  const RU_TZ = /^(Europe\/(Moscow|Minsk|Kaliningrad|Samara|Volgograd|Saratov|Ulyanovsk|Astrakhan|Kirov|Simferopol)|Asia\/(Yekaterinburg|Omsk|Novosibirsk|Barnaul|Tomsk|Novokuznetsk|Krasnoyarsk|Irkutsk|Chita|Yakutsk|Khandyga|Vladivostok|Ust-Nera|Magadan|Sakhalin|Srednekolymsk|Kamchatka|Anadyr))$/;
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { }
  const NOPAY = q.has('nopay') || RU_TZ.test(tz);
  if (DECK) html.classList.add('deck');
  if (NOPAY) html.classList.add('nopay');
  // английский — главный язык страницы (Игорь, 22.11.2026: «англ в приоритете»); русский — переключателем RU или ?lang=ru
  let lang = q.get('lang') === 'ru' || q.get('lang') === 'en' ? q.get('lang') : 'en';
  try { if (!q.get('lang')) lang = localStorage.getItem('sb.about.lang') || lang; } catch { }
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const nb = (s) => String(s).replace(/ —/g, ' —');   // тире не уходит в начало строки
  const t = (k) => { const v = T[lang][k] ?? T.ru[k] ?? k; return typeof v === 'string' ? nb(v) : v; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const credit = (s) => lang === 'ru' ? s : String(s).replace(/Трейлер/g, 'Trailer').replace(/официальный скриншот/g, 'official screenshot')
    .replace(/кадр через/g, 'frame via').replace(/через/g, 'via').replace(/автор не указан/g, 'author unknown');
  const APP = 'https://sbgta.app/';
  const placeUrl = (k) => `${APP}?open=place:${k}`;
  const mapsUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
  const nameOf = (p) => (lang === 'ru' ? p.ru : p.en);
  const gameOf = (p) => (p.g === 'gta6' ? 'GTA 6' : 'GTA 5');
  let D = { dots: [], top: [] }, NEWS = [];

  // ───── ползунок «в игре ⇄ в жизни» ─────
  const KNOB = '<svg viewBox="0 0 24 24"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg>';
  function setCmp(el, p, x = 50) {
    if (!el || !p) return;
    el.innerHTML = `<img class="r" src="${esc(p.real.f)}" alt="${esc(t('cmp_life'))}" draggable="false">
      <img class="g" src="${esc(p.game.f)}" alt="${esc(t('cmp_game'))}" draggable="false">
      <div class="line"><span class="knob">${KNOB}</span></div>
      <span class="lab lg">${esc(t('cmp_game'))}</span><span class="lab lr">${esc(t('cmp_life'))}</span>`;
    el.style.setProperty('--x', x + '%');
    Object.entries({ role: 'slider', 'aria-label': `${t('cmp_game')} ⇄ ${t('cmp_life')}`, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(x) })
      .forEach(([k, v]) => el.setAttribute(k, v));
    el.tabIndex = 0;
  }
  const capHTML = (p) => `${esc(t('cap_g'))}: ${esc(credit(p.game.c))}. ${esc(t('cap_r'))}: ${esc(credit(p.real.c))}.`;
  function bindCmp(el) {
    if (!el) return;
    let id = null;
    const set = (x) => { el.style.setProperty('--x', x.toFixed(2) + '%'); el.setAttribute('aria-valuenow', String(Math.round(x))); el.dataset.touched = '1'; };
    const at = (e) => { const r = el.getBoundingClientRect(); set(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))); };
    el.addEventListener('pointerdown', (e) => { if (e.button > 0) return; id = e.pointerId; el.setPointerCapture?.(id); at(e); });
    el.addEventListener('pointermove', (e) => { if (e.pointerId === id) at(e); });
    const up = (e) => { if (e.pointerId === id) id = null; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0; if (!d) return;
      e.preventDefault(); set(Math.max(0, Math.min(100, (parseFloat(el.style.getPropertyValue('--x')) || 50) + d)));
    });
  }
  function hint(el) {   // ручка один раз сама сходит влево-вправо, пока человек не трогал
    if (DECK || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const keys = [50, 22, 78, 50], dur = 2600, t0 = performance.now();
    const step = (now) => {
      if (el.dataset.touched) return;
      const k = Math.min(1, (now - t0) / dur), seg = k * (keys.length - 1), i = Math.min(keys.length - 2, Math.floor(seg)), f = seg - i;
      const e = f < .5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
      el.style.setProperty('--x', (keys[i] + (keys[i + 1] - keys[i]) * e).toFixed(2) + '%');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function onceVisible(el, fn) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(el);
  }

  // ───── блок 3: пары; блок 7: превью ссылки ─────
  let pairI = 1, crI = 0;   // в первом экране — Ocean Drive, в блоке 3 — следующая пара, чтобы не повторяться
  const heroes = () => D.top.filter((p) => p.hero);
  function renderPairs() {
    const H = heroes(); if (!H.length) return;
    setCmp($('#cmp-hero'), H[0]); $('#cap-hero').innerHTML = `${esc(nameOf(H[0]))}, ${esc(H[0].city)}. ${capHTML(H[0])}`;
    const big = H[Math.min(pairI, H.length - 1)];
    setCmp($('#cmp-big'), big); $('#cap-big').innerHTML = capHTML(big);
    if (DECK) { setCmp($('#cmp-m1'), big, 12); setCmp($('#cmp-m2'), big, 88); }
    $('#pairs').innerHTML = H.map((p, i) => `<button role="tab" aria-selected="${i === pairI}" class="${i === pairI ? 'on' : ''}" data-pair="${i}">${esc(nameOf(p))}<small>${esc(p.city)}</small></button>`).join('');
    $('#cr-pick').innerHTML = H.map((p, i) => `<button class="${i === crI ? 'on' : ''}" data-cr="${i}">${esc(nameOf(p))}</button>`).join('');
    const o = H[crI];
    $('#og-img').innerHTML = `<img src="${esc(o.game.t)}" alt=""><img src="${esc(o.real.t)}" alt=""><span class="lab lg">${esc(t('cmp_game'))}</span><span class="lab lr">${esc(t('cmp_life'))}</span><i class="og-c">© Rockstar Games</i>`;
    $('#og-title').textContent = t('og_t').replace('{p}', nameOf(o));
  }

  // ───── блок 6: плашки, избранное, окно места ─────
  const FKEY = 'sb.about.favs';
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FKEY) || '[]'); } catch { }
  if (DECK) favs = ['gta6:gta6-ocean-drive-art-deco', 'gta6:gta6-brickell-key', 'gta5:gta5-vinewood-sign'];
  const isFav = (k) => favs.includes(k);
  function toggleFav(k) {
    favs = isFav(k) ? favs.filter((x) => x !== k) : [...favs, k];
    if (!DECK) try { localStorage.setItem(FKEY, JSON.stringify(favs)); } catch { }
    renderTiles(); renderFavs();
    const ov = $('#ov-fav'); if (ov && ov.dataset.k === k) heartBtn(ov, k);
  }
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>';
  function heartBtn(el, k) {
    el.dataset.k = k; el.innerHTML = HEART; el.classList.toggle('on', isFav(k));
    el.setAttribute('aria-pressed', String(isFav(k))); el.setAttribute('aria-label', t(isFav(k) ? 'saved' : 'save'));
  }
  function renderTiles() {
    $('#tiles').innerHTML = D.top.map((p, i) => `<div class="tile">
      <button class="tile-open" data-tile="${i}" aria-label="${esc(nameOf(p))}"><span class="pic"><img src="${esc(p.game.t)}" alt="" loading="lazy"><img src="${esc(p.real.t)}" alt="" loading="lazy"></span>
      <b>${esc(nameOf(p))}</b><span>${esc(p.city)}, ${gameOf(p)}</span></button>
      <button class="heart${isFav(p.k) ? ' on' : ''}" data-fav="${esc(p.k)}" aria-pressed="${isFav(p.k)}" aria-label="${esc(t(isFav(p.k) ? 'saved' : 'save'))}">${HEART}</button></div>`).join('')
      + (D.top.length > 12 && !$('#tiles').classList.contains('all') ? `<button class="b b-line more" id="more">${esc(t('tr_all'))}</button>` : '');
  }
  function renderFavs() {
    const L = favs.map((k) => D.top.find((p) => p.k === k)).filter(Boolean);
    $('#fav-list').innerHTML = L.length ? L.map((p) => `<button class="fav-it" data-open="${esc(p.k)}"><img src="${esc(p.real.t)}" alt=""><span>${esc(nameOf(p))}</span></button>`).join('')
      : `<p class="fav0">${esc(t('tr_fav0'))}</p>`;
  }
  let lastFocus = null;
  function openPlace(p) {
    if (!p) return;
    lastFocus = document.activeElement;
    setCmp($('#cmp-ov'), p); $('#ov-name').textContent = nameOf(p);
    $('#ov-city').textContent = `${p.city}, ${gameOf(p)}`;
    $('#ov-meta').textContent = [p.ac && t('ac_' + p.ac), p.cf && t('cf_' + p.cf)].filter((x) => x && !/^(ac|cf)_/.test(x)).join('. ');
    const tip = p.tip && p.tip[lang];
    $('#ov-tip').innerHTML = tip ? `<b>${esc(t('tip'))}</b> ${esc(tip)}` : ''; $('#ov-tip').hidden = !tip;
    heartBtn($('#ov-fav'), p.k);
    $('#ov-open').href = placeUrl(p.k); $('#ov-maps').href = mapsUrl(p); $('#ov-cap').innerHTML = capHTML(p);
    $('#ov-x').setAttribute('aria-label', t('close'));
    $('#ov').hidden = false; document.body.style.overflow = 'hidden'; $('#ov-x').focus();
  }
  function closePlace() { $('#ov').hidden = true; document.body.style.overflow = ''; lastFocus?.focus?.(); }

  // ───── карта (MapLibre приложения, чистая подложка без меток сообщества) ─────
  const VIEWS = { mia: { center: [-80.19, 25.79], zoom: 10.3 }, la: { center: [-118.32, 34.04], zoom: 9.6 }, keys: { center: [-81.0, 24.85], zoom: 7.9 } };
  let map = null;
  function loadMap() {
    if (map) return;
    map = 'loading';
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '../vendor/maplibre/maplibre-gl.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = '../vendor/maplibre/maplibre-gl.js';
    s.onload = () => {
      $('#map').innerHTML = '';
      map = new maplibregl.Map({ container: 'map', style: 'https://tiles.openfreemap.org/styles/dark', ...VIEWS.mia,
        attributionControl: { compact: true }, cooperativeGestures: !DECK, dragRotate: false, pitchWithRotate: false, fadeDuration: 0 });
      map.touchZoomRotate.disableRotation();
      if (!DECK) map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => {
        map.addSource('pl', { type: 'geojson', data: { type: 'FeatureCollection', features: D.dots.map((d, i) => ({ type: 'Feature', properties: { i }, geometry: { type: 'Point', coordinates: [d[2], d[1]] } })) } });
        map.addLayer({ id: 'pl', type: 'circle', source: 'pl', paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3.5, 12, 7, 15, 10], 'circle-color': '#ff8aa0',
          'circle-stroke-color': '#1c1b20', 'circle-stroke-width': 1.4 } });
        map.on('click', 'pl', (e) => showDot(e.features[0].properties.i));
        map.on('mouseenter', 'pl', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'pl', () => { map.getCanvas().style.cursor = ''; });
        map.once('idle', () => { html.dataset.map = '1'; });
      });
    };
    s.onerror = () => { const w = $('#map .map-wait'); if (w) w.textContent = ''; html.dataset.map = '1'; };
    document.head.appendChild(s);
  }
  function showDot(i) {
    const d = D.dots[i]; if (!d) return;
    const [k, , , en, ru, city, img] = d, top = D.top.findIndex((p) => p.k === k);
    $('#map-info').innerHTML = `${img ? `<img src="${esc(img)}" alt="">` : ''}<div><b>${esc(lang === 'ru' ? ru : en)}</b>${city ? `<span>${esc(city)}</span>` : ''}
      <a href="${esc(placeUrl(k))}">${esc(t('m_app'))}</a>${top >= 0 ? ` <a href="#" data-top="${top}">${esc(t('m_cmp'))}</a>` : ''}</div>`;
  }

  // ───── блок 5: пример кода с кнопками контроллера ─────
  const ARROW = { '←': 'M19 12H5m6-6-6 6 6 6', '→': 'M5 12h14m-6-6 6 6-6 6', '↑': 'M12 19V5m-6 6 6-6 6 6', '↓': 'M12 5v14m-6-6 6 6 6-6' };
  const PSF = {
    O: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>', X: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    T: '<svg viewBox="0 0 24 24"><path d="M12 5.5l6.5 11.5h-13z"/></svg>', S: '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/></svg>',
  };
  const XBF = { A: 'xa', B: 'xb', X: 'xx', Y: 'xy' };
  const SAY = {
    ru: { '↑': 'вверх', '↓': 'вниз', '←': 'влево', '→': 'вправо', O: 'круг', X: 'крест', T: 'треугольник', S: 'квадрат' },
    en: { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right', O: 'circle', X: 'cross', T: 'triangle', S: 'square' },
  };
  const PLAT = { playstation: 'PlayStation', xbox: 'Xbox', pc: { ru: 'ПК', en: 'PC' }, phone: { ru: 'Телефон', en: 'Phone' } };
  let CODES = [], ci = 0, plat = 'playstation';
  function keyHTML(tk) {
    if (ARROW[tk]) return `<span class="k"><svg viewBox="0 0 24 24"><path d="${ARROW[tk]}"/></svg></span>`;
    if (plat === 'playstation' && PSF[tk]) return `<span class="k">${PSF[tk]}</span>`;
    if (plat === 'xbox' && XBF[tk]) return `<span class="k ${XBF[tk]}">${tk}</span>`;
    return `<span class="k txt">${esc(tk)}</span>`;
  }
  function renderCode() {
    const c = CODES[ci]; if (!c) return;
    const plats = ['playstation', 'xbox', 'pc', 'phone'].filter((p) => c.codes[p]);
    if (!plats.includes(plat)) plat = plats[0];
    $('#code-pick').innerHTML = CODES.map((x, i) => `<button class="${i === ci ? 'on' : ''}" data-c="${i}">${x.game}</button>`).join('');
    $('#plat-pick').innerHTML = plats.map((p) => `<button class="${p === plat ? 'on' : ''}" data-p="${p}">${esc(typeof PLAT[p] === 'string' ? PLAT[p] : PLAT[p][lang])}</button>`).join('');
    $('#code-name').textContent = c.name[lang] || c.name.ru;
    $('#code-hold').textContent = c.hold ? c.hold[lang][plat] || '' : '';
    const seq = c.codes[plat];
    $('#combo').innerHTML = Array.isArray(seq) ? seq.map(keyHTML).join('') : `<span class="k txt">${esc(seq)}</span>`;
    $('#say span').textContent = t('say');
  }
  let saying = 0;
  function sayCode() {
    const c = CODES[ci], seq = c && c.codes[plat]; if (!seq) return;
    const run = ++saying, keys = $$('#combo .k'), list = Array.isArray(seq) ? seq : [seq];
    const synth = window.speechSynthesis, voice = synth?.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    $('#say span').textContent = t('saying');
    let i = 0;
    const next = () => {
      if (run !== saying) return;
      keys.forEach((k) => k.classList.remove('now'));
      if (i >= list.length) { $('#say span').textContent = t('say'); return; }
      keys[i]?.classList.add('now');
      const word = SAY[lang][list[i]] && (plat === 'playstation' || ARROW[list[i]]) ? SAY[lang][list[i]] : String(list[i]).replace(/(\D)(\d)/, '$1 $2');
      i++;
      if (synth && typeof SpeechSynthesisUtterance === 'function') {
        const u = new SpeechSynthesisUtterance(word); u.lang = lang === 'ru' ? 'ru-RU' : 'en-US'; if (voice) u.voice = voice; u.rate = 1.05;
        let done = false; const go = () => { if (!done) { done = true; setTimeout(next, 90); } };
        u.onend = go; u.onerror = go; setTimeout(go, 1600); synth.speak(u);
      } else setTimeout(next, 650);
    };
    synth?.cancel(); next();
  }

  // ───── блок 8: рисунки (свои, без кадров игры) и лента ─────
  const ink = 'currentColor', pk = '#ff8aa0';
  function drawings() {
    const sv = (body) => `<svg viewBox="0 0 240 150" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    $('#draw-1').innerHTML = sv(`<rect x="60" y="14" width="120" height="122" rx="14"/><rect x="76" y="30" width="88" height="38" rx="6" stroke-dasharray="5 6"/>
      <path d="M76 84h88M76 98h66M76 112h76"/><rect x="138" y="22" width="34" height="14" rx="4" fill="${pk}" stroke="${pk}"/>`);
    $('#draw-2').innerHTML = sv(`<path d="M28 30h184M28 75h184M28 120h184M60 12v126M120 12v126M180 12v126" stroke-opacity=".35"/>
      <path d="M38 48l10 10 20-22M38 98l10 10 20-22"/><circle cx="150" cy="75" r="20"/><path d="M150 45v14M150 91v14M120 75h14M166 75h14"/><circle cx="150" cy="75" r="6" fill="${pk}" stroke="${pk}"/>`);
    $('#draw-3').innerHTML = sv(`<path d="M24 120l50-20 50 20 50-20 42 16V40l-42-16-50 20-50-20-50 20z" stroke-opacity=".5"/><path d="M74 24v76M124 44v76M174 24v76" stroke-opacity=".3"/>
      <path d="M124 92s-24-22-24-40a24 24 0 0 1 48 0c0 18-24 40-24 40z" fill="${pk}" stroke="${pk}"/><circle cx="124" cy="52" r="8" fill="#1c1b20" stroke="none"/>`)
      .replace('</svg>', `<text x="160" y="30" fill="${ink}" stroke="none" font-size="17" font-weight="800" font-family="Onest, sans-serif">${esc(t('d_new'))}</text></svg>`);
    $('#draw-4').innerHTML = `<svg viewBox="0 0 300 150" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="8" y="10" width="134" height="130" rx="14"/><rect x="158" y="10" width="134" height="130" rx="14" stroke="${pk}"/>
      <path d="M36 116V62l20-14 20 14v54M76 116V44h40v72M28 116h96M48 78h16M48 94h16M88 58h16M88 74h16M88 90h16" stroke-dasharray="6 6"/>
      <path d="M196 64h14l8-10h20l8 10h14v44h-64z" stroke="${pk}"/><circle cx="228" cy="86" r="11" stroke="${pk}"/><path d="M262 36v20M252 46h20" stroke="${pk}"/>
      <text x="22" y="34" fill="${ink}" stroke="none" font-size="15" font-weight="800" font-family="Onest, sans-serif">${esc(t('d_game'))}</text>
      <text x="172" y="34" fill="${ink}" stroke="none" font-size="15" font-weight="800" font-family="Onest, sans-serif">${esc(t('d_life'))}</text></svg>`;
  }
  function renderNews() {
    const fmt = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });
    const L = NEWS.filter((n) => n.t && n.t[lang]).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4);
    $('#news').innerHTML = L.map((n) => `<li><time>${esc(fmt.format(new Date(n.date + 'T12:00:00')))}</time><span>${esc(n.t[lang])}</span></li>`).join('');
  }
  function renderNow() {
    const li = (a) => a.filter((s) => !(NOPAY && s.startsWith('!pay'))).map((s) => `<li>${esc(nb(s.replace(/^!pay /, '')))}</li>`).join('');
    $('#now-list').innerHTML = li(t('now')); $('#soon-list').innerHTML = li(t('soon'));
  }

  // ───── язык ─────
  function applyLang() {
    html.lang = lang;
    $$('[data-i]').forEach((el) => { const k = el.dataset.i; if (T.ru[k] !== undefined) el.innerHTML = t(k); });
    $('#nw4_p').textContent = t(NOPAY ? 'nw4_np' : 'nw4_p');
    $$('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    $$('img[data-src]').forEach((im) => { im.src = im.dataset.src.replace('{l}', lang); });
    const pdf = `Secret-Base-presentation-${lang.toUpperCase()}${NOPAY ? '-nopay' : ''}.pdf`;
    $$('.js-pdf').forEach((a) => { a.href = pdf; a.setAttribute('download', pdf); });
    const wa = `https://wa.me/17473448896?text=${encodeURIComponent(t('wa_text'))}`;
    $$('.js-wa').forEach((a) => { a.href = wa; });
    document.title = t('title');
    drawings(); renderNow();
    if (D.top.length) { renderPairs(); renderTiles(); renderFavs(); }
    if (NEWS.length) renderNews();
    if (CODES.length) renderCode();
  }

  // ───── события ─────
  document.addEventListener('click', (e) => {
    const g = (s) => e.target.closest(s);
    let el;
    if ((el = g('.lang button'))) { lang = el.dataset.lang; try { localStorage.setItem('sb.about.lang', lang); } catch { } const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u); applyLang(); return; }
    if ((el = g('[data-pair]'))) { pairI = +el.dataset.pair; renderPairs(); return; }
    if ((el = g('[data-cr]'))) { crI = +el.dataset.cr; renderPairs(); return; }
    if ((el = g('#more'))) { $('#tiles').classList.add('all'); el.remove(); return; }
    if ((el = g('[data-fav]'))) { toggleFav(el.dataset.fav); return; }
    if ((el = g('#ov-fav'))) { toggleFav(el.dataset.k); return; }
    if ((el = g('[data-tile]'))) { openPlace(D.top[+el.dataset.tile]); return; }
    if ((el = g('[data-open]'))) { openPlace(D.top.find((p) => p.k === el.dataset.open)); return; }
    if ((el = g('[data-top]'))) { e.preventDefault(); openPlace(D.top[+el.dataset.top]); return; }
    if (g('#ov-x') || e.target.id === 'ov') { closePlace(); return; }
    if ((el = g('#map-tabs button'))) { $$('#map-tabs button').forEach((b) => b.classList.toggle('on', b === el)); if (map && map !== 'loading') map.flyTo({ ...VIEWS[el.dataset.c], duration: 900 }); return; }
    if ((el = g('#code-pick button'))) { saying++; ci = +el.dataset.c; renderCode(); return; }
    if ((el = g('#plat-pick button'))) { saying++; plat = el.dataset.p; renderCode(); return; }
    if (g('#say')) sayCode();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#ov').hidden) closePlace(); });
  ['#cmp-hero', '#cmp-big', '#cmp-ov'].forEach((s) => bindCmp($(s)));

  // ───── данные ─────
  const codeOf = async (g, id) => { const d = await fetch(`../data/${g}.json`).then((r) => r.json()); return d.cheats.find((x) => x.id === id); };
  applyLang();
  Promise.all([
    fetch('places.json').then((r) => r.json()),
    codeOf('gta6', 'g6_money').catch(() => null),
    codeOf('gta5', 'bmx').catch(() => null),
    fetch('../data/news.json').then((r) => r.json()).catch(() => ({ items: [] })),
  ]).then(([pl, c6, c5, nw]) => {
    D = pl; NEWS = nw.items || [];
    CODES = [];
    if (c6) CODES.push({ game: 'GTA 6', name: c6.name, codes: { playstation: c6.codes.playstation, xbox: c6.codes.xbox },
      hold: { ru: { playstation: 'Сначала ↑ — телефон, затем зажать L1 + R1 и набрать стрелки.', xbox: 'Сначала ↑ — телефон, затем зажать LB + RB и набрать стрелки.' },
        en: { playstation: 'First ↑ for the phone, then hold L1 + R1 and enter the arrows.', xbox: 'First ↑ for the phone, then hold LB + RB and enter the arrows.' } } });
    if (c5) CODES.push({ game: 'GTA 5', name: c5.name, codes: c5.codes });
    applyLang();
    onceVisible($('#cmp-hero'), () => setTimeout(() => hint($('#cmp-hero')), 500));
    onceVisible($('#cmp-big'), () => hint($('#cmp-big')));
    if (!DECK) onceVisible($('#map'), loadMap);   // в PDF карты нет: страница 6 — плашки, список и функции
    html.dataset.ready = '1';
  }).catch(() => { html.dataset.ready = '1'; });
})();
