# Mindmap_GEN-EX（WTE 内の写し）＝デザイン素材置き場

**マインドマップのアプリ本体はここではない。**

| | 場所 |
|---|---|
| アプリ本体（ソース・修理する場所） | `Gen-EX_Realtime Expression Lab/Mindmap_GEN-EX/`（経緯は `_dev/HANDOFF_MINDMAP_V2.md`） |
| 公開版（ふだん開く） | https://maso1737.github.io/Mindmap/ （リポジトリ `maso1737/Mindmap`） |

このフォルダは 2026-06 に **GEN-EX のデザイン言語の見本**として入れた写しで、`app.js` / `index.html` などは
**古い版のまま（2026-10-26 の修理は入っていない）**。マインドマップを使う・直すときは上の本体へ。

## 消さない・動かさない理由（2026-10-26 確認）

WTE の作品がここを参照している。

- `scroll-experience/styles/main.css` … `../../Mindmap_GEN-EX/fonts/` のフォントを読む（**動かすと LP のフォントが落ちる**）
- `HANDOFF_top-index.md`・`scroll-experience/DESIGN_NOTES.md`・`expression-composer/` の計画書 … 色や値の「真実の源」として
  `styles.css` の `:root`、`skills/genex-mindmap/SKILL.md`、`Logo/`、`*.dc.html`（Button / Slider / Toggle / Segment）、`_ds_manifest.json` を指す

使うのは **`fonts/`・`styles.css`・`Logo/`・`*.dc.html`・`skills/`**。それ以外（`app.js` `extras.*` `index.html`
`Standalone` `Wipeout` `index-bundle`）は使っていない古いアプリ。
