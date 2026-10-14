#!/usr/bin/env python3
"""Собирает data/gta5.json — базу читов GTA 5.

Источник комбинаций: GTA Wiki «Cheats in GTA V» (сверено с IGN/Kotaku/Red Bull).
Номер телефона НЕ вписывается руками: он считается из слова (1-999 + слово на
кнопочной клавиатуре) — так в GTA 5 устроены все телефонные читы.
Xbox-комбинация тоже не вписывается: выводится из PlayStation заменой кнопок.

Запуск:  python3 tools/build_gta5.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

KEYPAD = {c: d for d, letters in {
    "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL",
    "6": "MNO", "7": "PQRS", "8": "TUV", "9": "WXYZ"}.items() for c in letters}

PS_TO_XBOX = {"O": "B", "X": "A", "T": "Y", "S": "X",
              "L1": "LB", "R1": "RB", "L2": "LT", "R2": "RT"}


def phone_digits(word):
    return "".join(KEYPAD.get(c, c) for c in word.upper())


def phone_format(word):
    d = phone_digits(word)
    parts = [d[i:i + 3] for i in range(0, len(d), 3)]
    if len(parts) > 1 and len(parts[-1]) == 1:
        last = parts.pop()
        parts[-1] += last
    return "1-999-" + "-".join(parts)


def seq(s):
    return s.split() if s else []


def xbox(ps):
    return [PS_TO_XBOX.get(b, b) for b in ps]


# id, категория, слово (PC / телефон), PC-консоль есть?, PS-комбинация,
# иконка, ru-название, en-название, ru-описание, en-описание, бесплатный?, примечание ru/en
C = [
    # ── Транспорт ──
    ("sanchez", "vehicle", "OFFROAD", True, "O X L1 O O L1 O R1 R2 L2 L1 L1", "🏍️",
     "Мотоцикл Sanchez", "Spawn Sanchez",
     "Кроссовый мотоцикл — для бездорожья, гор и трюков.", "Dirt bike for off-road, hills and stunts.", True),
    ("pcj600", "vehicle", "ROCKET", True, "R1 → ← → R2 ← → S → L2 L1 L1", "🏍️",
     "Мотоцикл PCJ-600", "Spawn PCJ-600",
     "Быстрый спортбайк для погонь по городу.", "Fast sport bike for city chases.", True),
    ("caddy", "vehicle", "HOLEIN1", True, "O L1 ← R1 L2 X R1 L1 O X", "⛳",
     "Гольф-кар Caddy", "Spawn Caddy",
     "Тихий гольф-кар — для смешных роликов и прогулок.", "Golf cart for laughs and slow rides.", True),
    ("rapidgt", "vehicle", "RAPIDGT", True, "R2 L1 O → L1 R1 → ← O R2", "🏎️",
     "Спорткар Rapid GT", "Spawn Rapid GT",
     "Кабриолет-спорткар с отличным разгоном.", "Convertible sports car with strong acceleration.", False),
    ("comet", "vehicle", "COMET", True, "R1 O R2 → L1 L2 X X S R1", "🏎️",
     "Спорткар Comet", "Spawn Comet",
     "Классический спорткар в стиле Porsche 911.", "Classic sports car styled after a 911.", False),
    ("stretch", "vehicle", "VINEWOOD", True, "R2 → L2 ← ← R1 L1 O →", "🚘",
     "Лимузин Stretch", "Spawn Stretch Limo",
     "Длинный лимузин — для «звёздных» роликов.", "Stretch limo for celebrity-style rides.", False),
    ("trashmaster", "vehicle", "TRASHED", True, "O R1 O R1 ← ← R1 L1 O →", "🚛",
     "Мусоровоз Trashmaster", "Spawn Trashmaster",
     "Тяжёлый мусоровоз — таранит всё на пути.", "Heavy garbage truck that rams through traffic.", False),
    ("bmx", "vehicle", "BANDIT", True, "← ← → → ← → S O T R1 R2", "🚲",
     "Велосипед BMX", "Spawn BMX",
     "Трюковой велосипед для прыжков и парков.", "Stunt bike for jumps and skate parks.", False),
    ("buzzard", "vehicle", "BUZZOFF", True, "O O L1 O O O L1 L2 R1 T O T", "🚁",
     "Вертолёт Buzzard", "Spawn Buzzard",
     "Боевой вертолёт с пулемётами и ракетами.", "Attack helicopter with miniguns and rockets.", False),
    ("duster", "vehicle", "FLYSPRAY", True, "→ ← R1 R1 R1 ← T T X O L1 L1", "🛩️",
     "Самолёт Duster", "Spawn Crop Duster",
     "Кукурузник — медленный, но очень послушный.", "Crop duster plane — slow but easy to fly.", False),
    ("mallard", "vehicle", "BARNSTORM", True, "O → L1 L2 ← R1 L1 L1 ← ← X T", "🛩️",
     "Трюковой самолёт Mallard", "Spawn Stunt Plane",
     "Пилотажный самолёт для бочек и петель.", "Aerobatic plane for rolls and loops.", False),
    ("dodo", "vehicle", "EXTINCT", True, "", "🛬",
     "Гидроплан Dodo", "Spawn Dodo",
     "Самолёт, который садится на воду.", "Seaplane that lands on water.", False,
     "Только PC и телефон. Нужно открыть: задание Sea Plane.",
     "PC and phone only. Unlock: Sea Plane."),
    ("duke", "vehicle", "DEATHCAR", True, "", "🚙",
     "Бронемашина Duke O'Death", "Spawn Duke O'Death",
     "Бронированный маслкар — почти неуязвим.", "Armored muscle car that shrugs off damage.", False,
     "Только PC и телефон. Нужно открыть: событие Duel.",
     "PC and phone only. Unlock: the Duel random event."),
    ("kraken", "vehicle", "BUBBLES", True, "", "🐙",
     "Подлодка Kraken", "Spawn Kraken Sub",
     "Мини-субмарина для глубоководных съёмок.", "Mini submarine for deep-sea exploring.", False,
     "Только PC и телефон. Нужно открыть: испытание Wildlife Photography.",
     "PC and phone only. Unlock: Wildlife Photography Challenge."),

    # ── Оружие ──
    ("weapons", "weapon", "TOOLUP", True, "T R2 ← L1 X → T ↓ S L1 L1 L1", "🔫",
     "Оружие и патроны", "Weapons & Ammo",
     "Дробовик, РПГ, гранаты, SMG и автомат с патронами.", "Pump shotgun, RPG, grenades, SMG and rifle with ammo.", True),
    ("flaming", "weapon", "INCENDIARY", True, "L1 R1 S R1 ← R2 R1 ← S → L1 L1", "🔥",
     "Огненные пули", "Flaming Bullets",
     "Пули поджигают всё, во что попадают.", "Bullets set targets on fire.", True),
    ("explosive_ammo", "weapon", "HIGHEX", True, "→ S X ← R1 R2 ← → → L1 L1 L1", "💥",
     "Взрывные пули", "Explosive Ammo",
     "Каждое попадание — взрыв.", "Every hit explodes.", False),
    ("explosive_melee", "weapon", "HOTHANDS", True, "→ ← X T R1 O O O L2", "👊",
     "Взрывные удары", "Explosive Punches",
     "Удар кулаком отправляет врага в полёт.", "Punches send enemies flying.", False),
    ("slowmo_aim", "weapon", "DEADEYE", True, "S L2 R1 T ← S L2 → X", "🎯",
     "Замедление при прицеливании", "Slow Motion Aim",
     "Время замедляется, пока целитесь. До 3 раз — сильнее; 4-й ввод выключает.",
     "Time slows while aiming. Stack up to 3x; the 4th entry turns it off.", False),

    # ── Игрок ──
    ("invincible", "player", "PAINKILLER", True, "→ X → ← → R1 → ← X T", "🛡️",
     "Бессмертие", "Invincibility",
     "Неуязвимость на 5 минут.", "God mode for 5 minutes.", True),
    ("health", "player", "TURTLE", True, "O L1 T R2 X S O → S L1 L1 L1", "❤️",
     "Здоровье и броня", "Max Health & Armor",
     "Полное здоровье и броня. В машине ещё и чинит её.", "Full health and armor; also repairs your car.", True),
    ("parachute", "player", "SKYDIVE", True, "← → L1 L2 R1 R2 R2 ← ← → L1", "🪂",
     "Парашют", "Give Parachute",
     "Выдаёт парашют.", "Gives you a parachute.", True),
    ("superjump", "player", "HOPTOIT", True, "← ← T T → → ← → S R1 R2", "🦘",
     "Суперпрыжок", "Super Jump",
     "Прыжок на высоту дома.", "Jump as high as a house.", False),
    ("fastrun", "player", "CATCHME", True, "T ← → → L2 L1 S", "🏃",
     "Быстрый бег", "Fast Run",
     "Персонаж бегает заметно быстрее.", "Run noticeably faster.", False),
    ("fastswim", "player", "GOTGILLS", True, "← ← L1 → → R2 ← L2 →", "🏊",
     "Быстрое плавание", "Fast Swim",
     "Плавает быстрее любого катера.", "Swim faster than a jet ski.", False),
    ("recharge", "player", "POWERUP", True, "X X S R1 L1 X → ← X", "⚡",
     "Заряд способности", "Recharge Special Ability",
     "Полностью заряжает особую способность героя.", "Refills your character's special ability.", False),
    ("skyfall", "player", "SKYFALL", True, "L1 L2 R1 R2 ← → ← → L1 L2 R1 R2 ← → ← →", "🌤️",
     "Прыжок с неба", "Skyfall",
     "Забрасывает героя высоко в небо — свободное падение.", "Launches you into the sky for a free fall.", False),
    ("drunk", "player", "LIQUOR", True, "T → → ← → S O ←", "🍺",
     "Пьяный режим", "Drunk Mode",
     "Походка и камера как после бара.", "Wobbly walk and camera.", False),
    ("wanted_up", "player", "FUGITIVE", True, "R1 R1 O R2 ← → ← → ← →", "🚨",
     "Повысить розыск", "Raise Wanted Level",
     "+1 звезда розыска за каждый ввод.", "+1 wanted star per use.", False),
    ("wanted_down", "player", "LAWYERUP", True, "R1 R1 O R2 → ← → ← → ←", "👮",
     "Снизить розыск", "Lower Wanted Level",
     "−1 звезда розыска за каждый ввод.", "−1 wanted star per use.", True),

    # ── Мир ──
    ("weather", "world", "MAKEITRAIN", True, "R2 X L1 L1 L2 L2 L2 S", "🌦️",
     "Смена погоды", "Change Weather",
     "Перебирает погоду: солнце, смог, дождь, гроза, снег.", "Cycles weather: sun, smog, rain, storm, snow.", True),
    ("gravity", "world", "FLOATER", True, "← ← L1 R1 L1 → ← L1 ←", "🌙",
     "Лунная гравитация", "Moon Gravity",
     "Низкая гравитация — машины и люди летают.", "Low gravity — cars and people float.", True),
    ("slidey", "world", "SNOWDAY", True, "T R1 R1 ← R1 L1 R2 L1", "🧊",
     "Скользкие машины", "Slidey Cars",
     "Машины скользят, как по льду.", "Cars slide like on ice.", False),
    ("slowmo", "world", "SLOWMO", True, "T ← → → S R2 R1", "⏱️",
     "Замедление времени", "Slow Motion",
     "Весь мир замедляется. До 3 раз — сильнее; 4-й ввод выключает.",
     "Slows the whole world. Stack up to 3x; the 4th entry turns it off.", False),
    ("cellphone", "world", "EMPEROR", False, "", "📱",
     "Чёрный телефон", "Black Cellphone",
     "Меняет телефон на чёрный и вызывает взрыв над головой.", "Black phone skin plus an explosion overhead.", False,
     "Только через телефон.", "Phone only."),
    ("director", "world", "LSTALENT", False, "", "🎬",
     "Режиссёрский режим", "Director Mode",
     "Открывает режиссёрский режим для съёмки роликов.", "Opens Director Mode for making videos.", False,
     "Только через телефон.", "Phone only."),
]


def main():
    out = []
    for row in C:
        (cid, cat, word, pc_console, ps, icon, ru, en, dru, den, free, *note) = row
        ps_seq = seq(ps)
        out.append({
            "id": cid,
            "category": cat,
            "icon": icon,
            "name": {"ru": ru, "en": en},
            "desc": {"ru": dru, "en": den},
            "note": {"ru": note[0], "en": note[1]} if note else None,
            "pro": not free,
            "codes": {
                "playstation": ps_seq or None,
                "xbox": xbox(ps_seq) or None,
                "pc": word if pc_console else None,
                "phone": phone_format(word),
            },
            "media": None,  # сюда: "media/<id>.mp4" — видео-демонстрация
        })
    data = {
        "game": "gta5",
        "source": "GTA Wiki «Cheats in GTA V», сверено с IGN / Kotaku / Red Bull; номера посчитаны из слов",
        "updated": "2026-10-14",
        "cheats": out,
    }
    path = ROOT / "data" / "gta5.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{path.name}: {len(out)} читов")


if __name__ == "__main__":
    main()
