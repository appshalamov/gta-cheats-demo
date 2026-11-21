#!/usr/bin/env python3
"""Русские названия и адреса реальных мест (21.11.2026, «языки не смешивать»): в data/map/<игра>.json у мест и пасхалок,
где в n / a есть английские пояснения («former…», «and…»), появляются nr / ar из tools/names_ru.json (англ. строка → русская;
имена собственные в ней — латиницей). Приложение показывает их в русском интерфейсе (js/i18n.js rn/ra).
build_map.py вызывает apply() перед записью; отдельно: python3 tools/names_ru.py — дописать в готовые файлы.
Новые места с пояснениями ловит tools/lang_scan.py (статика): добавьте строку в names_ru.json и запустите этот скрипт.
"""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
RU = json.loads((ROOT / "tools" / "names_ru.json").read_text("utf-8"))


def apply(data):
    n = 0
    for k in ("places", "eggs"):
        for p in data.get(k) or []:
            for f, fr in (("n", "nr"), ("a", "ar")):
                v = p.get(f)
                if isinstance(v, str) and v in RU and RU[v] != v:
                    p[fr] = RU[v]; n += 1
                elif fr in p and not (isinstance(v, str) and v in RU):
                    del p[fr]
    return n


if __name__ == "__main__":
    for g in ("gta6", "gta5"):
        fp = ROOT / "data" / "map" / f"{g}.json"
        d = json.loads(fp.read_text("utf-8")); n = apply(d)
        fp.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), "utf-8")
        print(g, n)
