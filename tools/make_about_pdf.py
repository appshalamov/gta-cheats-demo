#!/usr/bin/env python3
"""PDF-презентация для кнопки «Скачать презентацию» на sbgta.app/about/ (22.11.2026).

Снимает каждую секцию страницы about/?deck картинкой 16:9 (Playwright, плотность 2) и собирает PDF из картинок —
по скиллу pdf-dlya-iphone (без серых квадратов на iPhone). Нужен локальный сервер корня репозитория.
Запуск: ~/.video-venv/bin/python tools/make_about_pdf.py http://127.0.0.1:8967/about/
Пишет about/Secret-Base-presentation-RU.pdf и -EN.pdf; после — proverka_pdf_apple.py (итог «проблем 0»).
"""
import sys, pathlib, subprocess, tempfile, asyncio
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKILL = pathlib.Path.home() / '.claude/skills/pdf-dlya-iphone/scripts/kartinki_v_pdf.py'
W, H = 1600, 900


async def shots(url, lang, out):
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1.5, reduced_motion='reduce')
        pg = await ctx.new_page()
        await pg.goto(f'{url}?deck&lang={lang}', wait_until='networkidle')
        await pg.wait_for_function('document.documentElement.dataset.ready')
        hgt = await pg.evaluate('document.body.scrollHeight')
        for y in range(0, hgt, H):
            await pg.evaluate(f'scrollTo(0,{y})'); await pg.wait_for_timeout(150)
        await pg.wait_for_function('[...document.images].filter(i => i.offsetParent).every(i => i.complete)', timeout=60000)
        await pg.wait_for_timeout(800)
        files = []
        for i, sec in enumerate(await pg.query_selector_all('main > section')):
            f = out / f'{lang}-{i + 1:02d}.png'
            await sec.screenshot(path=str(f), animations='disabled')
            files.append(str(f))
        await br.close()
        return files


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8967/about/'
    for lang in ('ru', 'en'):
        tmp = pathlib.Path(tempfile.mkdtemp(prefix=f'about-{lang}-'))
        files = asyncio.run(shots(url, lang, tmp))
        pdf = ROOT / 'about' / f'Secret-Base-presentation-{lang.upper()}.pdf'
        subprocess.run([sys.executable, '-I', str(SKILL), str(pdf), *files], check=True)
        print(pdf.name, len(files), 'стр.', pdf.stat().st_size // 1024, 'КБ', '| кадры:', tmp)


if __name__ == '__main__':
    main()
