# SCROLL_CONSONANCE_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_CONSONANCE_LP.html（SP-03・2026-11-03）

骨格・慣性・音の切替・検証フックは BEATS と同じ。状態はセント c と**音色 A（倍音 6 本の強さの配列）**で、章のあいだは要素ごとに混ぜる（純音 → RICH → SL-02 がなめらかに変わる）。法則は `../../_law/sp03_law.js`。

| 章 | id | 状態 | 図（PC） | 光る式の項 |
|---|---|---|---|---|
| 0 | CONSONANCE | 同度・RICH | LADDER | n·f |
| 1 | SINE | 純音で 0→1200¢ | LADDER・CURVE | rough |
| 2 | HARMONICS | 2/1 のまま 純音→RICH | LADDER・CURVE | n·f・aᵢaⱼ |
| 3 | VALLEYS | RICH で 1200→97¢（山で止まる） | LADDER・CURVE | rough・p/q |
| 4 | FIFTH | 3/2 ぴったり | LADDER・LISS・CURVE | p/q |
| 5 | TEMPERED | 3/2 → 平均律 700¢ → 5/4 → 400¢ | 同上 | うなり |
| 6 | TIMBRE | 400¢ のまま RICH→SL-02 | 同上 | aᵢaⱼ・うなり |
| 7 | SIMPLE | 5/4 → 45/32 → 3/2 → 2/1 | LISS・RULERS・LADDER | 周回 |
| 8 | BLUEPRINT | 2/1 | RULERS（立ち寄った所に章番号） | rough・周回 |

- RULERS＝横 ① ざらつき・縦 ② 閉じる周回 q（対数）。左下の黄の角＝FUSE。立ち寄った所は `STOPS`（各章が止まっている u を `CH.at` で評価）。
- 実測（330 Hz）：平均律 5 度のうなり 1.12 Hz、平均律長3度 13.10 Hz、SL-02 にすると長3度は耳では揺れない（図形は 13.10 Hz で回る）、45/32 はざらつき 0.23・APART。
