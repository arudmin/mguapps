"""Bake the recovery dialog's glyph atlas with Noto Sans and Noto Sans CJK Bold (OFL)."""
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import zlib

from PIL import Image, ImageFont

javascript = Path(__file__).resolve().parents[1] / "package" / "javascript"
strings = subprocess.check_output(["node", "-e", """
const { languageNames, words } = require('./src/i18n');
for (const lang of Object.keys(languageNames)) {
    const w = words(lang);
    console.log(...Object.values(w.recovery), ...w.levels, w.keyBack, w.keyDelete, w.doneSettings);
}
"""], cwd=javascript, encoding="utf-8")
cjk = ImageFont.truetype(sys.argv[1], 32, index=0)
sans = ImageFont.truetype(sys.argv[2], 32)
width = 512
x, y, row = 0, 0, 0
glyphs = {}
masks = []
for char in sorted(set(strings.replace("\n", "") + "0123456789abcdef_?-<>")):
    font = cjk if ord(char) >= 0x3000 else sans
    mask, (left, top) = font.getmask2(char, mode="L", anchor="ls")
    w, h = mask.size
    if x + w > width:
        x, y, row = 0, y + row + 1, 0
    glyphs[ord(char)] = [x, y, w, h, left, top, round(font.getlength(char), 3)]
    if w and h:
        masks.append((x, y, bytes(mask), (w, h)))
        x += w + 1
        row = max(row, h)
height = y + row
atlas = Image.new("L", (width, height))
for x, y, mask, size in masks:
    atlas.paste(Image.frombytes("L", size, mask), (x, y))
pixels = atlas.tobytes()
ascent, descent = cjk.getmetrics()
data = {
    "cacheKey": hashlib.sha256(pixels).hexdigest()[:16],
    "sizes": [{
        "size": 32, "ascent": ascent, "descent": descent, "atlasW": width, "atlasH": height,
        "glyphs": glyphs, "alpha": base64.b64encode(zlib.compress(pixels, 9)).decode("ascii"),
    }],
}
(javascript / "kit" / "fonts" / "dino-recovery.json").write_text(
    json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8"
)
