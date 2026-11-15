"""Build preview.html from the Slides artifact source in project/.

Local preview only (screenshots, PDF export). The artifact itself is built
from project/deck.json, project/deck.css and project/slides/*.html.

Usage:  python build_preview.py
Export: msedge --headless --disable-gpu --no-pdf-header-footer
        --print-to-pdf=../StudyTrack-Deck-v2.pdf preview.html
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE / "project"

# Uploaded asset ids -> local copies of the same real screenshots.
BLOBS = {
    "/_blob/068b07c123610f0479823e748db64700": "../screenshots/normal.png",
    "/_blob/a04f098dcf3e5a7a18b30a95226d207c": "../screenshots/mendekati.png",
    "/_blob/534924195881513fc7dbec4585537c12": "../screenshots/overdue.png",
    "/_blob/8a16a88ae6884b2e50cb8ef6a65fd76c": "../screenshots/advice.png",
    # advice.png cropped to 1370x580 (right whitespace removed); copy in .impeccable/assets
    "/_blob/49b36851b7996ed4f99e6a30d0f33911": "../../../.impeccable/assets/advice-crop.png",
    # remade-UI screenshots (docs/submission/screenshots-v2); card crops are the left 880px
    "/_blob/df7141aaa93a60a5590aa7921cd118e8": "../../../.impeccable/assets/v2-normal-crop.png",
    "/_blob/3753582a0bf17ee6dd9589c9983007cb": "../../../.impeccable/assets/v2-mendekati-crop.png",
    "/_blob/d310accb7a3d392eb367d512e6fa21b5": "../../../.impeccable/assets/v2-overdue-crop.png",
    "/_blob/44743847729cbb8593e404d22758b630": "../screenshots-v2/advice.png",
}

# The type's viewer.md base CSS, plus print sizing and frozen motion.
BASE_CSS = """
* { margin: 0 }
html, body { background: #E2E2E0 }
body { font: 32px/1.2 sans-serif }
body > section { width: 1920px !important; height: 1080px !important; overflow: hidden !important; box-sizing: border-box !important; position: relative; isolation: isolate }
section[hidden], aside, noscript { display: none !important }
h1 { font-size: 96px; font-weight: 600 }
h2 { font-size: 64px; font-weight: 600 }
h3 { font-size: 44px; font-weight: 600 }
p, li, h1, h2, h3, td, th { overflow-wrap: break-word; text-wrap: pretty }
table { width: 100%; border-collapse: separate; border-spacing: 0; border: solid #0003; border-width: 2px 0 0 2px }
th, td { padding: .35em .6em; text-align: left; border: solid #0003; border-width: 0 2px 2px 0 }
x-shape, x-icon, x-embed { display: block }
@page { size: 1920px 1080px; margin: 0 }
body > section { break-after: page; page-break-after: always }
*, *::before, *::after { animation: none !important; transition: none !important }
body.one > section { display: none }
body.one > section.on { display: flex }
"""

PICK = """
<script>
  var n = parseInt(new URLSearchParams(location.search).get('s') || '0', 10);
  if (n > 0) {
    document.body.classList.add('one');
    var s = document.querySelectorAll('body > section')[n - 1];
    if (s) s.classList.add('on');
  }
</script>
"""


def main():
    deck = json.loads((PROJECT / "deck.json").read_text(encoding="utf-8"))
    links = "\n".join(
        f'<link rel="stylesheet" href="{f["href"]}">'
        for f in deck["faces"].values()
        if "href" in f
    )
    slides = []
    for sid in deck["order"]:
        html = (PROJECT / "slides" / f"{sid}.html").read_text(encoding="utf-8")
        for blob, local in BLOBS.items():
            html = html.replace(blob, local)
        slides.append(html)
    page = (
        "<!doctype html>\n<html lang=\"id\">\n<head>\n<meta charset=\"utf-8\">\n"
        f"<title>StudyTrack Deck v2</title>\n{links}\n"
        f"<style>{BASE_CSS}</style>\n"
        '<link rel="stylesheet" href="project/deck.css">\n'
        "</head>\n<body>\n" + "\n".join(slides) + PICK + "</body>\n</html>\n"
    )
    (HERE / "preview.html").write_text(page, encoding="utf-8")
    print(f"preview.html: {len(slides)} slides")


if __name__ == "__main__":
    main()
