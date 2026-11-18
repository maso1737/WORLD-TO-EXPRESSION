# SCROLL_HARMONIC_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_HARMONIC_LP.html（SP-01・2026-11-09）

骨格・CSS・慣性・音の切替・FORMULA RAIL・REWIND・`fitText`・検証フックは STANDING の複製。法則は `../../_law/sp01_law.js`（変更なし）。
状態は `{ amps[12], shifts[12], proof（0..1）, solo（0..1＝3 倍音だけを鳴らす重み） }` で、すべてスクロールの純関数。章のあいだ（k）は要素ごとに線形で混ぜる。

| 章 | id | 状態 | 図（PC） | 光る式の項 |
|---|---|---|---|---|
| 0 | HARMONIC LADDER | のこぎり波 | LADDER（大）・WAVE | fₙ = n·F0 |
| 1 | ONE | 純音 | LADDER・WAVE・PERIOD | Σ・r(τ) |
| 2 | STACK | 2〜12 を 1 本ずつ足す（AUTO と同じ足し方）→のこぎり波 | 同上 | Σ |
| 3 | REPEAT | のこぎり波・PROOF が u 0.05→0.4 でフェードイン | 同上 | T = 1/F0・fₙ |
| 4 | HEAR OUT | solo 1（u < 0.28）→ 0（0.62）＝3 倍音だけ → 全体 | LADDER（ほかは薄く）・WAVE（1 本の正弦波へ寄せる） | fₙ |
| 5 | WOBBLE | 3 倍音 0 → +1.9 % | LADDER（◆・ダイヤル）・WAVE（形が回る）・POPMAP | dₙ・n·F0·\|d\| |
| 6 | POP | +1.9 → +4 %（u 0.6 から止まる） | 同上 | \|d\| ≥ 2 % |
| 7 | MISSING | 基音 1 → 0 | LADDER・WAVE・PERIOD | r(τ) |
| 8 | SPACING | 2・3 も消す → 4〜12 だけ・PROOF（間隔の弧・音の無い 1 段目に点線の棒） | LADDER・PERIOD | gcd(n)·F0 |
| 9 | OCTAVE | 4〜12 → 偶数番（440）→ 3 の倍数（660）。入れ替えの途中は 220 に戻る | LADDER・PERIOD | gcd(n)·F0 |
| 10 | BLUEPRINT | のこぎり波 | LADDER・MAP（立ち寄った 8 つの音：小さな梯子・聞こえる高さ・読み・間隔） | — |

#### 作り
- **時間で動くのは波形とダイヤルの位相だけ**（実時間の 1/4・アプリの SHOW と同じ）。ずれた倍音があると WAVE の形が n·F0·|d| Hz で回る。それ以外はスクロールの純関数。
- 図の数値はすべて law から：LADDER の色＝`zone`、PROOF＝`spacing`、WAVE＝`wave`、PERIOD＝`autocorr`／`pitch`、POPMAP＝`popThreshold`／`popScore`、MAP＝各章の止まる u を `CH.at` で評価して `pitch`・`zone`・`spacing`（`STOPS`）。
- ずれの横位置はアプリと同じ √ 目盛りの拡大表示（`SHIFT_VIS` 0.45）。
- 音：倍音 12 本の正弦波（`gains`＝全体の強さをそろえる）×(1−solo) ＋ 3 倍音 1 本（`playPing` と同じ音量 `PING_LEVEL·hfAtt`）×solo。
- 低い枠（スマホ・高さ 230 未満）では LADDER の上下の余白を詰める（詰めないと棒の高さが 0 になる）。

#### 実測（11-09・ブラウザ）
- 章ごとの聞こえる高さ：純音・足す途中・のこぎり波・基音なし・4〜12 だけ＝220.0、+1 %（u 0.48 前後）220.2・+1.9 % 220.35 WOBBLE（12.54 Hz）・+4 % 220.71 POP（26.4 Hz）、偶数番 440.0、3 の倍数 660.0、偶数→3 の倍数の途中 220.0。
- 音：12 本の周波数・ゲインが law の目標と一致（solo 中は 0・3 倍音 1 本 0.1）。+4 % で 3 本目 686.4 Hz。偶数番で奇数のゲイン 0。BOW はスクロールで 0.35 → 止めて約 2 秒で 0.01。
- 決定論：1,501 か所を前から・後ろから通って `stateAt` が完全一致、NaN なし。REWIND で 0 まで戻る。スマホ 375 px で横スクロールなし。

#### 検証フック `window.__LP`
既存と同じ（`goto`・`manual`＋`step`・`audio()`・`wheel`・`rewind`・`loc`）に加えて `state()`：章・u・k・amps・shifts・proof・solo・zone（solo 中は SOLO）・zoneLaw・score・drift・pitch・tau・spacing・live。
