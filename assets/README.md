# assets/ — Graphic Catalog Pipeline

This directory contains the graphic catalog data and the Python pipeline used to produce it.

## Files

| File | Description |
|---|---|
| `catalog.json` | Canonical source of truth read by the engine (`BACK_GRAPHIC_CATALOG`, `PLACEMENT_GRAPHIC_CATALOG`). 33 back + 94 placement graphics. |
| `extract.py` | Step 1: crops logos from source PDFs and samples dominant colours. |
| `build_catalog.py` | Step 2: merges human-verified labels with extracted data and writes `catalog.json`. |
| `extract_raw.json` | Intermediate output of `extract.py` (dominant colours + file paths before labelling). |
| `contact_back.png` | Contact sheet of all 33 back graphics (visual inspection reference). |
| `contact_placement_1.png`, `contact_placement_2.png`, `contact_placement_3.png` | Contact sheets of all 94 placement graphics. |

## Pipeline

```
Source PDFs  →  extract.py  →  extract_raw.json + PNGs
                                         ↓
                             build_catalog.py  →  catalog.json
```

### Step 1: `extract.py`

Reads two source-of-truth PDFs (NBA partnership materials, NOT committed):

- `"Summer League Colors and Back Graphics.pdf"` — back graphics 1..33
- `"NBA Summer League 2026 Grid for Approval.pdf"` — placement graphics 1..94

Per cell it:

1. Crops the logo region from the grid (number strip excluded).
2. Flood-fills outer white pixels to transparent (preserving interior whites — teams with white in their logos remain correct).
3. Auto-trims to the tight bounding box and pads to a square canvas.
4. Resizes to the output resolution and saves as PNG.
5. Quantizes the image to sample 5 dominant colours (non-transparent pixels only).

Outputs raw files into `public/logos/{back,placement}/` as numbered PNGs (`01.png`, `02.png`, …) and writes `assets/extract_raw.json` with the sampled colours.

**Grid geometry** (verified at 300 DPI render):

- **Back** (8 columns × 5 rows, 33 cells used):
  - Vertical lines: `[195, 494, 770, 1046, 1321, 1597, 1873, 2148, 2464]`
  - Row bands (y_top, y_bot): `[(1605,1834), (1943,2154), (2255,2479), (2575,2812), (2898,3126)]`

- **Placement** (8 columns × 12 rows, 94 cells used):
  - Vertical lines: `[76, 464, 853, 1242, 1630, 2019, 2408, 2796, 3185]`
  - Row bands (y_top, y_bot): 12 bands at ~389 px pitch

### Step 2: `build_catalog.py`

Reads `extract_raw.json`, merges with the `BACK` and `PLACEMENT` label tables authored by visual inspection of the contact sheets, then:

1. Renames numbered PNGs to self-descriptive names matching their `id` (e.g. `back_01_las-vegas-summer-league.png`).
2. Writes `assets/catalog.json` with the full schema including `id`, `num`, `file`, `label`, `category`, `mood`, `dominantColors`, and optional `team`.

### Optimization

The raw extraction produces 1024 × 1024 px PNGs for all graphics. After extraction the PNGs were downscaled and quantized:

- **Back graphics**: retained at 1024 × 1024 (hero back, larger render target).
- **Placement graphics**: downscaled to 512 × 512 (patches at smaller scale, halves storage).

This reduced total asset size from ~46 MB to ~6.2 MB while preserving visual fidelity at all render sizes used by the engine.

## Regenerating

> **Source PDFs are not committed** — they are NBA partnership materials provided under a limited license.

To regenerate from scratch you need:

1. The two source PDFs in a local folder.
2. Python 3.11+ with `pymupdf`, `pillow`, `numpy` installed (`pip install pymupdf pillow numpy`).

```bash
# Step 1: extract PNGs + colour samples
python3 assets/extract.py --src "/path/to/pdf/folder"

# Step 2: build catalog.json + rename PNGs
python3 assets/build_catalog.py
```

After regeneration, run `npm test` to verify the catalog integrity (see `tests/catalog-full.test.ts`).

## Catalog Schema

Each entry in `catalog.json` conforms to the `Graphic` TypeScript type (`lib/catalog/types.ts`):

```ts
interface Graphic {
  id: string;           // stable slug, e.g. "back_05_hawks"
  num: number;          // position in the source PDF grid (1-based)
  file: string;         // path under public/, e.g. "/logos/back/back_05_hawks.png"
  label: string;        // human-readable display name
  category: GraphicCategory;
  mood: Mood[];         // one or more of: classic | vegas | streetwear | playful
  dominantColors: string[]; // ≥1 six-digit hex colours, e.g. "#E13A3E"
  team?: string;        // franchise slug, set on exactly one placement per franchise
}
```

### Notable facts

- **33 back graphics**: 4 non-team (Summer League, NBA, city text) + 29 team logos.
- **94 placement graphics**: 30 franchise logos (one `team`-tagged each) + 64 non-team patches.
- **Chicago Bulls (`bulls`) is intentionally absent from the back catalog** — no Bulls back graphic appeared in the source PDF. Bulls fans get the Summer League fallback logo on the back; the Bulls placement patch is still available for hoodie placement zones.
- All `dominantColors` are 6-digit hex strings (`#RRGGBB`). The engine's `luminance()` function throws on non-6-hex input.
