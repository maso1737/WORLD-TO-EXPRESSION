# SCROLL_UPDOWN_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_UPDOWN_LP.html（SP-06・2026-11-10）

骨格・CSS・慣性・音の切替・FORMULA RAIL・REWIND・`fitText`・検証フックは HARMONIC の複製。法則は `../../_law/sp06_law.js`（アプリと共有）。
状態は `{ P（音名の通しの値・半音）, sigma（山の幅・オクターブ）, mu（山の真ん中）, proof（0..1）, pair（0..1＝三全音をくり返す） }` で、すべてスクロールの純関数。つなぎ k は sigma だけ対数、ほかは線形。

| 章 | id | 状態 | 図（PC） | 光る式の項 |
|---|---|---|---|---|
| 0 | UP & DOWN | C・σ 2.0 | HELIX（大）・SPEC | fₖ |
| 1 | HELIX | σ 0.2・山が音についていく（mu = 3 + P/12）・P 0→24＝C4→C6 | HELIX・SPEC | fₖ・c |
| 2 | STACK | C のまま σ 0.2→2.0（対数） | HELIX・SPEC | aₖ・σ |
| 3 | STAIRS | σ 2.0・半音ずつ 12 段（P 24→36） | HELIX・STAIRS・SPEC | c・1 歩 |
| 4 | SAME | P 36・PROOF（12 段上げた部品＝点線の ○）が u 0.05→0.4 で | HELIX・STAIRS・SPEC | c+12 |
| 5 | NARROW | σ 2.0→0.25 | HELIX・CLARITY・SPEC | σ |
| 6 | DROP | σ 0.25・半音ずつ 12 段（P 36→48）・F→F♯・F♯→G が DOWN | HELIX・STAIRS・SPEC | h・1 歩 |
| 7 | SQUASH | σ 0.25→2.0 | HELIX・CLARITY・SPEC | H |
| 8 | TRITONE | A→D♯ をくり返す・σ 2.0 | HELIX・EAR（輪の ±6 の弧・音の中の答え・耳の型の例 D／G♯） | 6 半音で輪 = 0 |
| 9 | DECIDED | A→D♯ のまま σ 2.0→0.25（UP に決まる） | HELIX・EAR | h・1 歩 |
| 10 | BLUEPRINT | σ 2.0 | CLARITY（立ち寄った 7 か所＝章番号）・HELIX | — |

#### 作り
- **時間で動くのは三全音のくり返しだけ**（A 0.5 秒・間 0.1・B 0.5 秒・間 0.5＝1.6 秒周期）。音は間のうちに周波数を切り替える（bus を 0 に）。ほかはスクロールの純関数。
- 音：8 本の正弦波の「席」（law の `slots`）。上の端を越えた部品は下の端へ席ごと移る（窓で無音なので周波数を飛ばしてよい）。
- 図の数値はすべて law から：HELIX の光＝`env`、足あと（1 周回したときの聞こえる高さ）＝`height`、STAIRS＝`height`＋`step`、CLARITY＝`clarity`（LINE／CIRCLE の帯も law の LINE_H・CIRCLE_H から探す）、EAR＝`step`・`earPredict`。

#### 実測（11-10・ブラウザ）
- 章 1：C4 261.6 → C6 1046.5 Hz・H 1。章 2：σ 0.71 で BLEND（H 0.23）→ 2.0 で CIRCLE。
- 章 3：12 段とも UP・聞こえる高さ 523.25 Hz のまま。章 6：D♯ で 622 Hz・F♯ で 523 Hz に落ちる・DOWN は 2 歩（F→F♯・F♯→G）。
- 章 7：σ 0.38 H 0.98・0.67 H 0.31（BLEND）・1.2 H 0.0015。章 8：EITHER（score 0.000）・耳の型 D＝UP／G♯＝DOWN。章 9：σ 0.25 で UP（440 → 622 Hz）。
- 音（♪ ON）：8 本の周波数・ゲインが law の `slots` と一致（相対 1e-5）。三全音で A1・A（間 0）・B1・B が 1.6 秒周期で回る。BOW はスクロールで 0.29 → 止めて約 2 秒で 0.005。
- 決定論：1,501 か所を前から・後ろから通って `stateAt` が完全一致・NaN なし。REWIND で 0 まで戻る。スマホ 390 px で横スクロールなし。

#### 検証フック `window.__LP`
既存と同じ（`goto`・`manual`＋`step`・`audio()`・`wheel`・`rewind`・`loc`）に加えて `state()`：章・u・k・P・name・sigma・mu・proof・pair・zone・H・h・hz・tri・triScore・stairs（n・last・dirs・downs）・shown（いま鳴っている A／B と gate）。`shown()`・`time()`。
