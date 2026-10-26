#!/usr/bin/env python3
"""Коды админа и приглашений для закрытого доступа креаторов (08 ТЗ §2.2), пока нет сервера.

В js/config.js кладутся только хэши (PBKDF2-SHA256), самих кодов в коде и в git нет:
- CREATOR.admin — хэш кода админа (вход на экран «Для админов»);
- CREATOR.invites — партии по 10 хэшей приглашений со сроком. Код приглашения i выводится из кода админа:
  'SB-' + 6 знаков из HMAC-SHA256(код админа, 'sb-invite:' + i). Поэтому экран «Для админов» после входа сам
  «создаёт» следующие 10 кодов, а любое устройство проверяет введённый код по хэшу.

Запуск (код админа — из файла вне git, например «06 вёрстка/админ-код.txt», первая строка):
  python3 tools/make_invites.py "<файл с кодом админа>" [--batches 20]
Печатает блок CREATOR для js/config.js. Партия 0 — с прошедшим сроком (для проверки «Срок приглашения закончился»).
"""
import hashlib, hmac, sys

ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # без 0/O, 1/I — коды диктуют голосом
ITER = 50000
SALT_ADMIN, SALT_INV = b"sb-admin-v1", b"sb-invite-v1"


def kdf(s, salt, n=32):
    return hashlib.pbkdf2_hmac("sha256", s.encode(), salt, ITER)[:n].hex()


def invite(admin, i):
    b = hmac.new(admin.encode(), f"sb-invite:{i}".encode(), hashlib.sha256).digest()
    return "SB-" + "".join(ALPHA[x % 32] for x in b[:6])


if __name__ == "__main__":
    admin = open(sys.argv[1], encoding="utf-8").readline().strip()
    batches = int(sys.argv[sys.argv.index("--batches") + 1]) if "--batches" in sys.argv else 20
    print(f"  admin: '{kdf(admin, SALT_ADMIN)}',")
    print("  invites: [   // партии по 10: срок, хэши (PBKDF2, 8 байт) через пробел; коды выводит экран «Для админов»")
    for k in range(batches):
        until = "2026-10-20" if k == 0 else "2026-12-31"
        hs = " ".join(kdf(invite(admin, k * 10 + j), SALT_INV, 8) for j in range(10))
        print(f"    ['{until}', '{hs}'],")
    print("  ],")
    if "--show" in sys.argv:   # для проверки: коды первой партии
        print([invite(admin, j) for j in range(20)], file=sys.stderr)
