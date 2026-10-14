#!/usr/bin/env python3
"""Собирает data/gta6.json — ПРОГНОЗ читов GTA 6 (игра выходит 19.11.2026, PS5 / Xbox Series X|S).

На 14.10.2026 подтверждённых кодов GTA 6 нет (GTA BOOM: «Confirmed GTA 6 cheat codes: 0»).
Все сайты «GTA 6 cheats» переносят коды GTA 5 с пометкой «не подтверждено» —
делаем так же, но честно: у каждого чита status=forecast и уверенность.
После релиза: поменять status на "confirmed" и вписать настоящие коды.

Запуск (после build_gta5.py):  python3 tools/build_gta6.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
gta5 = {c["id"]: c for c in json.loads((ROOT / "data" / "gta5.json").read_text("utf-8"))["cheats"]}

# Перенос из GTA 5: id, уверенность (high/medium/low)
CARRY = [
    ("health", "high"), ("invincible", "high"), ("weapons", "high"), ("wanted_down", "high"),
    ("wanted_up", "high"), ("parachute", "medium"), ("superjump", "medium"), ("fastrun", "medium"),
    ("fastswim", "medium"), ("skyfall", "medium"), ("drunk", "low"), ("recharge", "low"),
    ("flaming", "medium"), ("explosive_ammo", "medium"), ("explosive_melee", "medium"), ("slowmo_aim", "medium"),
    ("weather", "high"), ("gravity", "medium"), ("slidey", "medium"), ("slowmo", "medium"),
]

# Транспорт: в GTA 6 другие модели, поэтому даём тип машины и код-аналог из GTA 5
VEHICLES = [
    ("v_super", "comet", "🏎️", "Спорткар", "Spawn Sports Car", "medium"),
    ("v_bike", "pcj600", "🏍️", "Мотоцикл", "Spawn Motorbike", "medium"),
    ("v_heli", "buzzard", "🚁", "Боевой вертолёт", "Spawn Attack Helicopter", "medium"),
    ("v_plane", "mallard", "🛩️", "Трюковой самолёт", "Spawn Stunt Plane", "low"),
    ("v_limo", "stretch", "🚘", "Лимузин", "Spawn Limo", "low"),
    ("v_dirt", "sanchez", "🏍️", "Кроссовый мотоцикл", "Spawn Dirt Bike", "medium"),
]

# Новые эффекты, которых не было в GTA 5 (прогноз по механикам GTA 6), — кода пока нет
NEW = [
    ("n_stamina", "player", "💪", "Бесконечная выносливость", "Infinite Stamina",
     "Ожидаемый чит: бег и плавание без усталости.", "Expected: run and swim without getting tired.", "medium"),
    ("n_boat", "vehicle", "🚤", "Катер", "Spawn Speedboat",
     "В Леониде много воды — катер почти наверняка будет.", "Leonida is full of water — a boat spawn is likely.", "medium"),
    ("n_gator", "world", "🐊", "Аллигаторы повсюду", "Gator Swarm",
     "Фанатская идея: болота Леониды полны аллигаторов.", "Fan idea: Leonida swamps full of gators.", "low"),
]

CONF = {"high": ("Высокая", "High"), "medium": ("Средняя", "Medium"), "low": ("Низкая", "Low")}


def forecast(src, conf):
    codes = dict(src["codes"])
    codes["pc"] = None  # ПК-версии на старте нет
    return codes


def main():
    out = []
    for cid, conf in CARRY:
        s = gta5[cid]
        out.append({**s, "id": "g6_" + cid, "status": "forecast", "confidence": conf,
                    "codes": forecast(s, conf), "pro": s["pro"],
                    "note": {"ru": "Прогноз: код из GTA 5. Проверим в день релиза.",
                             "en": "Forecast: GTA 5 code. We'll verify on launch day."}})
    for cid, src_id, icon, ru, en, conf in VEHICLES:
        s = gta5[src_id]
        out.append({"id": "g6_" + cid, "category": "vehicle", "icon": icon,
                    "name": {"ru": ru, "en": en},
                    "desc": {"ru": f"Модели GTA 6 ещё неизвестны. В GTA 5 этот код давал {s['name']['ru']}.",
                             "en": f"GTA 6 models are unknown yet. In GTA 5 this code spawned {s['name']['en'].replace('Spawn ', '')}."},
                    "note": {"ru": "Прогноз: код-аналог из GTA 5.", "en": "Forecast: GTA 5 equivalent."},
                    "pro": s["pro"], "status": "forecast", "confidence": conf,
                    "codes": forecast(s, conf), "media": None})
    for cid, cat, icon, ru, en, dru, den, conf in NEW:
        out.append({"id": "g6_" + cid, "category": cat, "icon": icon,
                    "name": {"ru": ru, "en": en}, "desc": {"ru": dru, "en": den},
                    "note": {"ru": "Код появится после выхода игры.", "en": "Code will appear after launch."},
                    "pro": False, "status": "forecast", "confidence": conf,
                    "codes": {"playstation": None, "xbox": None, "pc": None, "phone": None}, "media": None})
    data = {
        "game": "gta6",
        "source": "Прогноз: коды GTA 5 + ожидаемые эффекты. Подтверждённых кодов GTA 6 на 14.10.2026 нет.",
        "updated": "2026-10-14",
        "confidenceLabels": CONF,
        "cheats": out,
    }
    path = ROOT / "data" / "gta6.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{path.name}: {len(out)} читов (прогноз)")


if __name__ == "__main__":
    main()
