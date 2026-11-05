"""Скриншоты зацикленных анимаций: для каждого слайда — кадры в заданные моменты.
Использование: python3 shots.py dist/lecture.html outdir "2@0,2@5000,7@3000,..."
(момент в мс от открытия слайда)."""
import sys, pathlib
from playwright.sync_api import sync_playwright

html, out, spec = sys.argv[1], pathlib.Path(sys.argv[2]), sys.argv[3]
out.mkdir(parents=True, exist_ok=True)
want = {}
for item in spec.split(","):
    sl, ms = item.split("@")
    want.setdefault(int(sl), []).append(int(ms))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    url = f"file://{pathlib.Path(html).resolve()}"
    for sl, times in sorted(want.items()):
        pg.goto(f"{url}#{sl}")
        pg.reload()
        pg.wait_for_timeout(300)
        t = 0
        for ms in sorted(times):
            pg.wait_for_timeout(max(0, ms - t)); t = ms
            pg.screenshot(path=str(out / f"s{sl:02d}_{ms:05d}.png"))
    print("errors:", len(errs), sorted(set(errs))[:8])
    b.close()
