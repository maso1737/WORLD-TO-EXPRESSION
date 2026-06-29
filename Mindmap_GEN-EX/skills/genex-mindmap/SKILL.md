---
name: genex-mindmap
description: >-
  Build or restyle an interactive mindmap UI in the GEN-EX visual language — an
  industrial, tDR-inspired aesthetic with a paper-white canvas, signal-yellow
  accent, monospace HUD overlays, ISO-style registration marks, and a measurement
  grid. Use this whenever the user asks for a "GEN-EX mindmap", a mind/concept map
  with this technical-blueprint look, or wants to add categories, nodes, pan/zoom,
  Markdown/JSON import-export, or the canvas glow/scanline ("Wipeout") effects.
  The skill ships a complete, runnable vanilla-JS reference app under app/.
---

# GEN-EX Mindmap

A self-contained, framework-free mindmap application in the **GEN-EX** design
language (originally "tDR-inspired"): high information density, industrial UI,
neon-on-paper accent, and graphic hierarchy. Everything needed to run or recreate
it lives in `app/`.

## What's in `app/`

| File | Role |
|------|------|
| `index.html` | The shell: header (tools), 280px sidebar (category index), stage (canvas), footer (status). All other files are referenced from here. |
| `styles.css` | Design tokens + full layout/component styling. The source of truth for the look. |
| `extras.css` | Tweaks panel, custom-category UI, extra overlays. |
| `app.js` | Core engine — categories, node tree, pan/zoom, drag/re-parent, inline edit, undo/redo, Markdown & JSON import/export, localStorage persistence. Runs `init()` on load. |
| `extras.js` | Custom categories, per-category default layouts, reordering. |
| `wipeout.css` / `wipeout.js` | Optional "Wipeout" canvas FX layer — drifting measurement grid, state-driven glow edges, scanlines. Load only if you want the animated background. |
| `data/*.md` | One Markdown file per default map. Indentation defines the node tree. |
| `fonts/` | Bank Gothic, Square 721 (display/sans). JetBrains Mono & IBM Plex Sans JP load from Google Fonts. |

## Run it

It is static — no build step. Serve the folder over http (fonts + `fetch()` of
`data/*.md` need a server, not `file://`):

```bash
cd app && python3 -m http.server 8000   # then open http://localhost:8000
```

## Design language (GEN-EX)

Pull these from `styles.css` `:root` — do not invent new values.

- **Palette**: bg `#f2f2ef` (paper), ink `#0a0a0a` (near-black), accent `--acc #ffd400`
  (signal yellow — used *sparingly* for meaning, never decoration), mutes `#999` / `#c8c8c4`.
- **Lines**: 1px solid `--line` (#0a0a0a) everywhere; `--shadow: 0 0 0 1px var(--ink)` (hard, no blur).
- **Grid**: faint measurement grid (`--grid` ~2.8% black, `--grid-major` ~5%). Hatching at `--hatch` 8%.
- **Type**: `--mono` JetBrains Mono (HUD/labels/data), `--display`/`--sans` Bank Gothic + Square 721
  (headings, node titles), `--jp` IBM Plex Sans JP (Japanese). `font-feature-settings: "ss01","ss02","tnum"`.
- **Motion**: `--ez cubic-bezier(0.2,0,0,1)` (fast-in, hard-stop). Durations `--t-hover 120ms`,
  `--t-click 240ms`, `--t-layout 380ms`.
- **Layout**: `.shell` is `grid-template-columns: 280px 1fr; grid-template-rows: 56px 1fr 32px`.
- **HUD detail**: registration `+` marks in corners, coordinate/timecode/ID readouts, ISO-216
  (A2) references, slash-separated tokens (`AR ⁄ DAILY ⁄ SERIES`). These are decorative HUD chrome —
  keep them; they carry the aesthetic.
- **Themes**: `data-theme="white"` on a wrapper overrides tokens for a pure-white variant.

## Customizing

**Maps / categories** — edit the `window.CATEGORIES` array near the top of `app.js`:

```js
window.CATEGORIES = [
  { id: "ZBRUSH", file: "data/ZBRUSH.md", label: "ZBRUSH", sub: "FLEE / ANIMATION", jp: "" },
  // id: stable key (localStorage + tree map)   file: source .md   label/sub: sidebar text
];
```

Then add a matching `data/<id>.md`. Map structure = Markdown headings/indented bullets:
deeper indentation = deeper nodes. Users can also IMPORT.MD / IMPORT.JSON at runtime.

**Theming** — change tokens in `styles.css` `:root` (and the `[data-theme="white"]` block).
Built-in **Tweaks** (gear button → `theme`, `accent`, `showCoords`, `nodeStyle`) are wired in
`extras.js`; their defaults live in the `__TWEAK_DEFAULTS` block in `index.html`.

**Persistence** — state is in localStorage under `tdr-mindmap-v4` (+ `tdr-mindmap-custom-cats-v1`,
`-cat-order-v1`, `-default-layouts-v1`). Rename these keys if you need a clean namespace.

## Recreating in a framework (React/Vue/etc.)

The `app/` files are a **reference implementation**, not a component library. To port:
1. Treat `styles.css` tokens as your design tokens (copy `:root` verbatim).
2. Rebuild the shell grid + HUD chrome as components; keep exact spacing, 1px lines, and the
   registration/coordinate overlays.
3. The node tree, pan/zoom transform math, and MD/JSON parsers in `app.js` are framework-agnostic
   logic you can lift directly.
4. Add the `wipeout.js` canvas layer last, behind the node layer, if you want the animated FX.

## Gotchas

- `app.js` `fetch()`es `data/*.md` relative to the page → must be served over http and the
  `data/` folder must sit beside the page.
- Fonts: Bank Gothic / Square 721 are local `.ttf` in `fonts/`; the rest come from Google Fonts
  (the `<link>` is in `index.html`'s `<head>`).
- The accent (`#ffd400`) should stay rare and meaningful — applying it broadly breaks the look.
