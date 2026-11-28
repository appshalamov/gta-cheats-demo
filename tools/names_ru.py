#!/usr/bin/env python3
"""Русские названия и адреса реальных мест (21.11.2026, «языки не смешивать»): в data/map/<игра>.json у мест и пасхалок,
где в n / a (реальное), g (игровое), ga (адрес в игре → gar) и p (реальное место пасхалки) есть английские пояснения («former…», «and…»), появляются nr / ar / gr / pn из (pr занято реальным фото — не трогать) tools/names_ru.json (англ. строка → русская;
имена собственные в ней — латиницей). Приложение показывает их в русском интерфейсе (js/i18n.js rn/ra).
build_map.py вызывает apply() перед записью; отдельно: python3 tools/names_ru.py — дописать в готовые файлы.
Новые места с пояснениями ловит tools/lang_scan.py (статика): добавьте строку в names_ru.json и запустите этот скрипт.
"""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
RU = json.loads((ROOT / "tools" / "names_ru.json").read_text("utf-8"))


def apply(data):
    n = 0
    # + пасхалки внутри карточек мест (p.eggs): до 28.11 их пропускали — «реальное место» показывалось по-английски
    for p in (data.get("places") or []) + (data.get("eggs") or []) + [e for pl in data.get("places") or [] for e in pl.get("eggs") or []]:
        for f, fr in (("n", "nr"), ("a", "ar"), ("g", "gr"), ("p", "pn"), ("ga", "gar")):
            v = p.get(f)
            if fr in p and not isinstance(p[fr], str):   # предохранитель: чужое поле (фото, объект) не трогаем
                raise SystemExit(f"names_ru: поле {fr} у {p.get('id')} занято не текстом — выберите другое имя поля")
            if isinstance(v, str) and v in RU and RU[v] != v:
                p[fr] = RU[v]; n += 1
            elif fr in p and not (isinstance(v, str) and v in RU):
                del p[fr]
    return n


def gtadb(pts):
    """Точки сообщества gtadb (data-tails 28.11: «Leonida Straits» показывал в RU «Straits of Florida south of the Lower Keys»):
    точка — массив [id, name, district, real, …], место в массиве занято, поэтому русские названия — словарями рядом:
    rn {id: имя в игре по-русски}, rr {id: реальное место по-русски}. Только где перевод отличается от оригинала."""
    rn, rr = {}, {}
    for q in pts:
        for i, out in ((1, rn), (3, rr)):
            v = q[i] if len(q) > i else None
            if isinstance(v, str) and v in RU and RU[v] != v:
                out[q[0]] = RU[v]
    return rn, rr


if __name__ == "__main__":
    for g in ("gta6", "gta5"):
        fp = ROOT / "data" / "map" / f"{g}.json"
        d = json.loads(fp.read_text("utf-8")); n = apply(d)
        fp.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), "utf-8")
        fg = ROOT / "data" / "map" / f"gtadb_{g}.json"
        dg = json.loads(fg.read_text("utf-8")); dg.pop("rn", None); dg.pop("rr", None)
        rn, rr = gtadb(dg["points"]); dg.update({**({"rn": rn} if rn else {}), **({"rr": rr} if rr else {})})
        fg.write_text(json.dumps(dg, ensure_ascii=False, separators=(",", ":")), "utf-8")
        print(g, n, "gtadb:", len(rn), len(rr))
