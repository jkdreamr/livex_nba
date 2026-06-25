#!/usr/bin/env python3
"""
Asset extraction pipeline — NBA Summer League × LiveX hoodie designer.

Crops every catalog graphic out of the two source-of-truth PDF grids into
transparent-background PNGs (decal textures), samples each logo's dominant
colours (for the engine's colour-harmony gate), and emits a raw manifest that
the labelling pass merges into the final `catalog.json`.

  Source PDFs (provided under the NBA partnership, NOT committed to the repo):
    - "Summer League Colors and Back Graphics.pdf"      -> back graphics 1..33
    - "NBA Summer League 2026 Grid for Approval.pdf"     -> placement 1..94

Pipeline per cell: crop logo region (grid lines exclude the number strip) ->
edge flood-fill alpha (outer white -> transparent, interior whites preserved)
-> auto-trim -> square pad -> 1024x1024 PNG -> sample dominant colours.

Run:  python3 assets/extract.py --src "/path/to/pdf/folder"
Outputs: public/logos/{back,placement}/NN.png + assets/extract_raw.json + contact sheets.

Requires: pymupdf, pillow, numpy.
"""
from __future__ import annotations
import argparse, json, os
from collections import deque, Counter
import fitz
import numpy as np
from PIL import Image, ImageDraw

# --- verified grid geometry (px @ 300 DPI render); see assets/README.md ----------
BACK_VLINES = [195, 494, 770, 1046, 1321, 1597, 1873, 2148, 2464]  # 8 columns
BACK_ROWS = [(1605, 1834), (1943, 2154), (2255, 2479), (2575, 2812), (2898, 3126)]  # 5 rows
BACK_COUNT = 33

PLC_VLINES = [76, 464, 853, 1242, 1630, 2019, 2408, 2796, 3185]  # 8 columns
PLC_ROWS = [(401, 788), (973, 1361), (1546, 1933), (2118, 2506), (2691, 3079),
            (3264, 3651), (3836, 4224), (4409, 4797), (4982, 5369), (5554, 5942),
            (6127, 6514), (6701, 7087)]  # 12 rows
PLC_COUNT = 94

DPI = 300
INSET = 12  # px inset inside each cell to avoid the border lines


def render_page(pdf_path: str) -> Image.Image:
    doc = fitz.open(pdf_path)
    pix = doc[0].get_pixmap(dpi=DPI)
    doc.close()
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def edge_flood_to_alpha(im: Image.Image, tol: int = 22) -> Image.Image:
    """Make the OUTER white background transparent via flood-fill from all 4 edges.
       Interior whites (inside the logo) are preserved."""
    im = im.convert("RGBA")
    a = np.array(im)
    h, w = a.shape[:2]
    rgb = a[:, :, :3].astype(int)
    near_white = np.all(np.abs(rgb - 255) <= tol, axis=2)
    visited = np.zeros((h, w), bool)
    dq: deque = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x]:
                dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x]:
                dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        if visited[y, x]:
            continue
        visited[y, x] = True
        a[y, x, 3] = 0
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and near_white[ny, nx]:
                dq.append((ny, nx))
    return Image.fromarray(a)


def autotrim_square(im: Image.Image, size: int = 1024, pad: float = 0.06) -> Image.Image:
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    side = int(max(im.size) * (1 + pad)) or 1
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return canvas.resize((size, size), Image.LANCZOS)


def dominant_colors(rgba: Image.Image, k: int = 4) -> list[str]:
    a = np.array(rgba)
    opaque = a[a[:, :, 3] > 200][:, :3]
    if len(opaque) == 0:
        return ["#808080"]
    not_white = ~np.all(opaque > 234, axis=1)
    px = opaque[not_white] if not_white.sum() > 40 else opaque
    q = (px // 32 * 32 + 16).astype(int)
    cnt = Counter(map(tuple, q))
    return ["#%02X%02X%02X" % tuple(int(v) for v in c) for c, _ in cnt.most_common(k)]


def cell(img: Image.Image, vlines, rows, r: int, c: int) -> Image.Image:
    x0, x1 = vlines[c] + INSET, vlines[c + 1] - INSET
    y0, y1 = rows[r][0] + INSET, rows[r][1] - INSET
    return img.crop((x0, y0, x1, y1))


def extract_grid(page: Image.Image, vlines, rows, count: int, out_dir: str, prefix: str):
    os.makedirs(out_dir, exist_ok=True)
    cols = len(vlines) - 1
    manifest = {}
    thumbs = []
    for idx in range(count):
        r, c = divmod(idx, cols)
        num = idx + 1
        raw = cell(page, vlines, rows, r, c)
        png = autotrim_square(edge_flood_to_alpha(raw))
        fname = f"{num:02d}.png"
        png.save(os.path.join(out_dir, fname))
        manifest[num] = {
            "file": f"/logos/{prefix}/{fname}",
            "dominantColors": dominant_colors(png),
        }
        t = png.copy()
        t.thumbnail((220, 220))
        thumbs.append((num, t))
    return manifest, thumbs


def contact_sheet(thumbs, cols: int, path: str):
    cw = ch = 240
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cw * cols, ch * rows), (235, 235, 235))
    d = ImageDraw.Draw(sheet)
    for i, (num, t) in enumerate(thumbs):
        x, y = (i % cols) * cw, (i // cols) * ch
        # checker so transparency is visible
        d.rectangle([x, y, x + cw, y + ch], fill=(255, 255, 255))
        sheet.paste(t, (x + (cw - t.width) // 2, y + 24 + (ch - 24 - t.height) // 2), t)
        d.text((x + 6, y + 6), f"#{num}", fill=(200, 0, 0))
    sheet.save(path)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="folder containing the two source PDFs")
    ap.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    args = ap.parse_args()

    back_pdf = os.path.join(args.src, "Summer League Colors and Back Graphics.pdf")
    plc_pdf = os.path.join(args.src, "NBA Summer League 2026 Grid for Approval.pdf")

    back_page = render_page(back_pdf)
    plc_page = render_page(plc_pdf)

    back_manifest, back_thumbs = extract_grid(
        back_page, BACK_VLINES, BACK_ROWS, BACK_COUNT,
        os.path.join(args.repo, "public/logos/back"), "back")
    plc_manifest, plc_thumbs = extract_grid(
        plc_page, PLC_VLINES, PLC_ROWS, PLC_COUNT,
        os.path.join(args.repo, "public/logos/placement"), "placement")

    raw = {"back": back_manifest, "placement": plc_manifest}
    raw_path = os.path.join(args.repo, "assets/extract_raw.json")
    with open(raw_path, "w") as f:
        json.dump(raw, f, indent=2)

    cs_dir = os.path.join(args.repo, "assets")
    contact_sheet(back_thumbs, 8, os.path.join(cs_dir, "contact_back.png"))
    for i in range(0, len(plc_thumbs), 32):
        contact_sheet(plc_thumbs[i:i + 32], 8,
                      os.path.join(cs_dir, f"contact_placement_{i // 32 + 1}.png"))

    print(f"back: {len(back_manifest)} PNGs, placement: {len(plc_manifest)} PNGs")
    print(f"raw manifest -> {raw_path}")
    print("contact sheets -> assets/contact_back.png, assets/contact_placement_*.png")


if __name__ == "__main__":
    main()
