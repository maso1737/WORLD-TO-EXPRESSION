# CLAUDE.md — sound-patterns/scroll（解説スクロール LP）

教材アプリ（`../0x_*.html`）と 1 対 1 で対になる「読む版」。方針は `../../20_Design/PLAN_SCROLL_EXPLAINER.md`。
入口は `../index.html`（APP と SCROLL を横に並べている）。

## LP ごとの記録（作り・実測・検証フック・Claude のブラウザ検証）

新しい LP を作るときは、その LP の記録を最初から `notes/SCROLL_XXX_LP.md` に書き、ここには表の 1 行だけ足す。

| LP | 番号・日付 | 記録 |
|---|---|---|
| [SCROLL_BEATS_LP.html](SCROLL_BEATS_LP.html) | SP-02・2026-11-03 | [notes/SCROLL_BEATS_LP.md](notes/SCROLL_BEATS_LP.md) |
| [SCROLL_CONSONANCE_LP.html](SCROLL_CONSONANCE_LP.html) | SP-03・2026-11-03 | [notes/SCROLL_CONSONANCE_LP.md](notes/SCROLL_CONSONANCE_LP.md) |
| [SCROLL_CHLADNI_LP.html](SCROLL_CHLADNI_LP.html) | SP-05・2026-11-05 | [notes/SCROLL_CHLADNI_LP.md](notes/SCROLL_CHLADNI_LP.md) |
| [SCROLL_STANDING_LP.html](SCROLL_STANDING_LP.html) | SP-04・2026-11-06 | [notes/SCROLL_STANDING_LP.md](notes/SCROLL_STANDING_LP.md) |
| [SCROLL_HARMONIC_LP.html](SCROLL_HARMONIC_LP.html) | SP-01・2026-11-09 | [notes/SCROLL_HARMONIC_LP.md](notes/SCROLL_HARMONIC_LP.md) |
| [SCROLL_UPDOWN_LP.html](SCROLL_UPDOWN_LP.html) | SP-06・2026-11-10 | [notes/SCROLL_UPDOWN_LP.md](notes/SCROLL_UPDOWN_LP.md) |

## 共通（6 本とも）
- 音の既定は **BOW**（11-03 ユーザーの好み）：最初のクリックで BOW が入る（自分で OFF を押したら入れない）。ボタンは OFF／BOW／♪ ON、`S` で同じ順に循環。
- `?ch=章&u=0..1` でその場面から開く（共有・検証用）。内蔵ブラウザが隠れているとき、`goto` だけでは screenshot が古いままなので、この URL で開き直すと撮れる。
- スマホは各章の `PM`（図 1〜2 枚）に切り替える。
