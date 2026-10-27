// Настройки приложения: игры, платформы, категории.
// Добавить игру = добавить запись в GAMES и файл data/<id>.json.

export const APP = {
  name: 'Secret Base: карта и чит-коды',   // 32 §3.1; «GTA» в имени нельзя (ASRG 4.1(c), 00 §14)
  shortName: 'Secret Base',
  version: '0.3.1 demo',
  // домен ссылок креаторов домен/КОД/мир/место?v=<ролик> — ЗАГЛУШКА: настоящий покупает и вписывает feature/foundation
  domain: 'secretbase.example',
};

// icon — id значка из I (js/icons.js), не эмодзи
export const CATEGORIES = [
  { id: 'world', icon: 'catWorld', ru: 'Мир', en: 'World' },
  { id: 'player', icon: 'catPlayer', ru: 'Игрок', en: 'Player' },
  { id: 'weapon', icon: 'catWeapon', ru: 'Оружие', en: 'Weapon' },
  { id: 'vehicle', icon: 'catVehicle', ru: 'Транспорт', en: 'Vehicle' },
];
export const DEFAULT_CATEGORY = 'vehicle';

export const PLATFORMS = {
  playstation: { ru: 'PlayStation', en: 'PlayStation', icon: 'ps' },
  xbox: { ru: 'Xbox', en: 'Xbox', icon: 'xbox' },
  pc: { ru: 'ПК', en: 'PC', icon: 'pc' },
  phone: { ru: 'Телефон в игре', en: 'In-game phone', icon: 'phone' },
};

// Порядок — как в списках и переключателях интерфейса: GTA 6 первой (решение Игоря №15, 16.10.2026).
// Игра по умолчанию — store.game в app.js (GTA 5), от порядка не зависит.
// Другие части (status 'soon') — только коды, без карты: карта и места есть только у GTA 6 и GTA 5 (places.js MAP_GAMES).
// status: 'live' — коды проверены; 'forecast' — игра ещё не вышла, коды-прогноз; 'soon' — раздел в разработке
export const GAMES = [
  {
    id: 'gta6', title: 'GTA 6', header: { ru: 'Коды GTA 6', en: 'GTA 6 codes' },
    status: 'forecast', release: '2026-11-19',
    platforms: ['playstation', 'xbox', 'phone', 'pc'],
    platformNote: {
      playstation: { ru: 'PS5', en: 'PS5' },
      xbox: { ru: 'Series X|S', en: 'Series X|S' },
      pc: { ru: 'ожидается в 2027', en: 'expected in 2027' },
    },
  },
  {
    id: 'gta5', title: 'GTA 5', header: { ru: 'Коды GTA 5', en: 'GTA 5 codes' },
    status: 'live',
    platforms: ['playstation', 'xbox', 'pc', 'phone'],
    platformNote: {},
  },
  { id: 'gtasa', title: 'GTA San Andreas', status: 'soon' },
  { id: 'gtavc', title: 'GTA Vice City', status: 'soon' },
  { id: 'gta4', title: 'GTA 4', status: 'soon' },
  { id: 'gta3', title: 'GTA 3', status: 'soon' },
];

// Фото эпохи на Главной (04 дизайн-система/tokens.json → skins.<id>.photos): порядок листания, фокус обрезки 50% 0%.
// Файлы — img/ui/<скин>/<имя>.avif и .webp. Обложки категорий и карточки игр не используются.
// load — «вид» во весь экран (860×1864, фокус по центру): пейвол и онбординг «Игра» (бриф §7).
// В вебе — кадры игр (Rockstar Games, решение Игоря 27.10; источники — 05 картинки/кадры-игр.md), подпись на баннере и в «О приложении».
// Флаг сборки «свои картинки»: iOS (App Store, правило 5.2.1) — true, берём свои генерации из img/ui/<скин>/own/ с теми же именами.
export const OWN_ART = false;
const ui = (sk, n) => `img/ui/${sk}/${OWN_ART ? 'own/' : ''}${n}`;
export const HERO = {
  gta6: { city: { ru: 'Майами', en: 'Miami' }, banners: [ui('gta6', 'gta6-banner-01'), ui('gta6', 'gta6-banner-02'), ui('gta6', 'gta6-banner-03')], load: ui('gta6', 'gta6-load-02') },
  gta5: { city: { ru: 'Лос-Анджелес', en: 'Los Angeles' }, banners: [ui('gta5', 'gta5-banner-01'), ui('gta5', 'gta5-banner-02'), ui('gta5', 'gta5-banner-03')], load: ui('gta5', 'gta5-load-01') },
};

// Тарифы — только платные (Ресерч 31 §1, §4.4–4.6; решение Игоря №14; 28 §6.0 «Файл 31 принят»).
// Пробный доступ 72 часа с первого открытия: все коды; без карты игр, Лиги и «Моего заработка», без банковской карты.
// Дальше один Pro в трёх сроках: год (автопродление), «Пропуск релиза» 3 месяца одним платежом, месяц (автопродление).
// На пейволе две карточки (год, 3 месяца) и строка «Помесячно». Без недели, «навсегда», вводной цены, процентных скидок,
// пробного Paddle и Apple ID. «Поездки» в Pro нет (решение №15).
// Пояса цен — 31 §1 п. 2 и §4.6. Месяц в поясах 2–4 — только в App Store и Google Play (на сайте Paddle съедает мелкий
// платёж), поэтому в PWA строка «Помесячно» есть только в поясе 1.
// Пояс задаёт страна карты оплаты, не язык и не IP. НАСТОЯЩУЮ СТРАНУ ДАСТ СЕРВЕР (профиль SB.api country, Paddle);
// до него — мок-профиль или регион navigator.language, только для показа. Цены — в долларах, на сайте с налогами внутри.
export const PAYWALL = {
  trialHours: 72,
  release: '2026-11-19',        // пропуск, купленный до этой даты, отсчитывает 3 месяца с неё (31 §4.4)
  giftDays: 30,                 // код креатора и ссылка друга: +30 дней к первой покупке (31 §4.4)
  scouts: 0,                    // строка «Новые пары Скаутов: N, +M за неделю» — только при N > 0
  zones: {
    1: { year: 29.99, pass: 12.99, month: 5.99 },   // США, Европа, Залив
    2: { year: 17.99, pass: 7.99, month: null },    // Мексика, Польша, Чили
    3: { year: 11.99, pass: 4.99, month: null },    // Бразилия, Казахстан, Филиппины
    4: { year: 7.49, pass: 3.49, month: null },     // Индия, Индонезия, Турция
  },
  // только страны, названные в 31 §1 и §4.6; остальные — пояс 1, пока сервер не отдаст свою таблицу (T13ц)
  countries: { MX: 2, PL: 2, CL: 2, BR: 3, KZ: 3, PH: 3, IN: 4, ID: 4, TR: 4 },
  noPay: ['RU', 'BY'],          // оплата не принимается: вместо тарифов — «Стать партнёром» (31 §4.5 nopay)
};

// ───────── креаторский раздел: режимы и закрытый доступ (Дизайн Secret Base/08 MVP/08 ТЗ §1, §2) ─────────
// Режим площадки: 'beta' — закрытый доступ по приглашениям, суммы «предварительные», выплат нет; 'live' — боевой (сервер).
// 'demo' («демо для съёмки») не ставится здесь: его включает экран «Для админов» после кода админа (localStorage sb.demo).
// С сервером режим и дата открытия придут из GET /rules (mode, open_at) — экраны берут их только из SB.api.getRules().
export const CREATOR_MODE = 'beta';
export const CREATOR = {
  open_at: '2026-11-19',        // программа открывается для всех в день выхода GTA 6; меняется только здесь (§2.3)
  waitlist_count: 0,            // записавшихся до этого устройства (из почты Cloudflare-формы); номер в списке = +1 (§6)
  waitlist_endpoint: null,      // адрес Cloudflare-формы для записи в список; null — запись только на устройстве
  // хэши PBKDF2-SHA256 (50 000 повторов), не сами коды — tools/make_invites.py; код админа — вне git
  admin: '588ac994828a4e2e24aa12d2fb078d4c965056243f6bd86ad65942814ec47165',
  invites: [   // партии по 10: срок, хэши (PBKDF2, 8 байт) через пробел; коды выводит экран «Для админов»
    ['2026-10-20', 'e3cbd5ba681234d2 1776e7a6891238f3 0ba01e5d1c54ae19 a816ef79236cc623 78a2d0fc25f0dfcc 7e7c59521d40ca33 7091c240f087e141 ec5b7ec9defb71da 3f95975ab259e141 94c872ae65ea5baa'],
    ['2026-12-31', 'c947227b98c06cb0 8c8e7926b0184907 90d501230923332c 0944af11e000a3f4 0775f58b9889df01 4de6a72e52f3a719 310c1994b65ba2fa ebe2819306137507 22c7cbeedc16bba4 4b63c09e36ee0666'],
    ['2026-12-31', '4cdb24c899ca3f16 33a3c5d7d9781306 0730755b81c85bb5 d5ae6f4985d7daf3 c17f1247572a3099 552ad94fbab1ef85 e29bba3d4706c11a 60dcdf3c28c8e735 2602252cef777be8 69931012c82fa8ea'],
    ['2026-12-31', 'e7bfd017c854b26f 51157d849acc09af c7ec7ecc2b228730 502734e5a9f56a78 34a6af2b00c7a170 465172ecc9ef157f e9956c9f7834a4f8 a1fd033f8e137f6d bb9357d638bb6205 24c1271471ae2fd1'],
    ['2026-12-31', 'ceb9a640b5233f2b 1a34e8d06b90ed04 ff9226e083368bb3 46234b34cfd46c8c 4a152189be49cf63 782184a7d80ad927 ead4a2617df40570 a07bff602913c060 41e066dc483a4e08 910c1730f9ef4837'],
    ['2026-12-31', '14b7b44ca9bb34cc ee414e919dfef4b6 a00966a1905a0ab2 8a7a218b65973e5e f072fb3b7e93d265 914ce767468721ab 20bc61d1dcf78f95 8f13d0c77a5839e2 c9194660bb2e4b4a 53c1735f4c57f90d'],
    ['2026-12-31', '099e6e78c0d90bda 80d8079f58d2b8c6 71096de3bd6ed37c f2687e5eeb622f14 c61e1c88fd15a272 ce8a38f615d6af47 ad4c14fce808aa5f 563f1b6f893230d5 9ce1e3f1ec7b27d9 0e541aaefc935a85'],
    ['2026-12-31', '253af8439652622f ddd087c244d7fb87 80915542627ee74c 5c058bd2b3df1796 8eeafdfb47481eb6 d28a69f7bf3d90b7 c0f406910df38d85 1c3fee0f485f26e9 9324c1def06d1065 a61238fc92cf31dd'],
    ['2026-12-31', 'ab8e416f39a1ad8d c84dfd05dfe6064f c3e47f9c03ed3d32 4036ead8fcc0fae3 3c2d25e329dd3528 9471a94488a7218e 31653fadc6ad7881 0c0558ca8cebcf45 9e9f1c7522a950a0 ae985624b5c985ee'],
    ['2026-12-31', '63b65c7be08a629d 278df8cdefc2f72d 584a09cd1122fe3d 60455965961d4c04 bfb9487e4a1fbd6b 2c8248f7664b9f90 4757f963415438f7 507ced63a45f0dd2 76500abb4c4587f5 247cad61ad630598'],
    ['2026-12-31', '0d1416b6d7630ca1 e9468534a9b06c3c 32a9472efeac592a 524bb3cd0683b818 3bc6ce09d733fd88 0d9ba074e84f8caf 68ef297d01a81a74 8c29dbe38fbb0b88 1345a39fb16d609c e90ed23039271947'],
    ['2026-12-31', 'b89b8c219ab33a8c d920f9c0695330d9 d7d9fefd2fdcfb65 623c8fc3dc80056a 9f2b80a0098a3d5c 6790ba87b5ecfbbc ab67846220084144 8506a15bcc28b89d c5982dc61fda1db1 74bf1b60fa96c696'],
    ['2026-12-31', 'b9e32d0c577d50f3 6567a0a2bca23edd fee1f7687e836553 db8389774c6adfe9 b7d7ca9d54866914 00413fa651a2bfd1 2de11712e2f5e261 8e127297f495d610 1a1c3daf0691cf65 4bf7b46b54301fde'],
    ['2026-12-31', '09d4e47747a087a8 7afb7d38d940cd8a a7c64c2411a3e328 21b227fbbec656f8 5d24d59e1ea691f6 79fc355691df61ec f6f05b2fa6b70ac8 40720d866102f73e 66cdcd8c60afeee3 4957c9fba7f95d3d'],
    ['2026-12-31', '904cf2f9756e5491 5785ef5c6e7f9342 f72bc9259cfb555d 3e3b05a48455052f 1b25b08272e49c7b 4d3131fa157a7528 6f12b76da664c3ec c48e99162863db2d edef069a46978563 eb7c762676836418'],
    ['2026-12-31', 'ca7f19267d7128ba fa693337aafd2ddd 4201d348c9a5e737 8ff340f129f61a48 59695e2c238736eb e27b481b7160ffa8 ca7a976d6d5d5c4a a02e324fc9b41548 bf7af8723daaf119 7c9c9c0b6778ca72'],
    ['2026-12-31', '77b0c34083463def 596586f6de13a2e4 28c905fbe5a1eb7d 5771f0aee4e88585 011c726895a65361 92d5b00eb41e9e96 b42c56a1fdfac050 6bec2bd0441244d8 dc5193a9ff72ec81 b42d40c4d4839c68'],
    ['2026-12-31', '4b2308265baa3499 33c5cc31347a9637 d5de4afeab4893da e6da3b695a8743a3 90b0fea884920663 52f268f8b26f1647 4caa9bc971deb6c5 6c39287dbbb544f9 282d10fa9ae8869b 1b98b0bc779b04cb'],
    ['2026-12-31', 'ab788d1382c59d33 2c036d140dbebdea e1177d0151251a0b c89a5c43934b2429 419062c58118a7e3 5fef6e794253c3a2 f1a4babe7e6f546e dd5af614ac897920 3a16fc0400daa37e e2e9389aa51963d9'],
    ['2026-12-31', '1c19c6d36a17f0e4 9174507454ed5392 d6f784772098faab 1e783db5c1043900 18b9fb58139f9959 d703c1460d706463 732c5216f8759e30 87f72f1c700bbea3 53e77e200096afc6 3a1f63f0ee994c06'],
  ],
};
