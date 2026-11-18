# SCROLL_STANDING_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_STANDING_LP.html（SP-04・2026-11-06）

骨格・CSS・慣性・音の切替・FORMULA RAIL・REWIND・`fitText`・検証フックは CHLADNI の複製（砂の SIM は無し）。法則は `../../_law/sp04_law.js`（変更なし）。
状態は `{ f, xt（押さえ・null＝なし）, proof（0..1）, pw（はじいた弦の重み 0..1）, pluck: null | { xp, xt, tau } }` で、すべてスクロールの純関数。

| 章 | id | 状態 | 図（PC） | 光る式の項 |
|---|---|---|---|---|
| 0 | STANDING WAVE | 330 Hz・押さえなし | STRING（大） | fₙ = n·F0 |
| 1 | DRIVE | 60→100 Hz（対数） | STRING・RES | f |
| 2 | RESONANCE | 100→110（u 0.7 から 110 ちょうど） | STRING・RES・ZOOM（110 Hz の山 ±30¢） | r²·H/Q・Q |
| 3 | HARMONICS | 110→220→330→440（1 つに 1.2 ぶん止まり・0.8 ぶんで次へ） | STRING・RES・LADDER（今の応え） | fₙ = n·F0・sin(nπx) |
| 4 | BETWEEN | 275 Hz で止まる | STRING（形だけ拡大の点線つき）・PURITY | Σ aₙ sin(nπx) |
| 5 | TWO WAVES | 330 Hz・PROOF が u 0→0.35 でフェードイン | STRING＋進む波（黄）・戻る波（橙）・和（白） | travel |
| 6 | WALL | PROOF のまま 275→330（対数） | STRING・WALL（\|sin(πf/F0)\| の曲線と針） | sin(πf/F0)=0 |
| 7 | TOUCH | 330 Hz・指 0.15→1/3（止まる）→2/3（止まる）→0.85 | STRING（指）・TOUCHMAP（`zone(330,xt).resp`） | sin²(nπxt) |
| 8 | PLUCK | 押さえなし・xp 0.2・τ 0→2.0 秒 | STRING・LADDER（\|Aₙ\|e^(−γτ)・枠＝はじいた瞬間） | Aₙ・e^(−γτ) |
| 9 | FLAGEOLET | 押さえ 1/2 → 1/3 → 1/4（各 1/3 区間・はじき直して τ 0→1.2） | STRING・LADDER（消える n は灰） | e^(−γτ)・γₙ ∝ sin² |
| 10 | BLUEPRINT | 330 Hz | RES（立ち寄った高さに章番号）・LADDER | — |

#### 作り
- 台本は `CH[i].at(u)`。章のあいだ（つなぎ k）は f を対数・xt／proof／pw を線形で混ぜる。押さえあり⇔なしの境は xt を k＝0.5 で切り替え、指の絵だけ `fa` で薄める。はじき直し（8→9・9 の区間の境）も k＝0.5／区間の境で τ が 0 に戻る。
- **時間で動くのは弦の位相だけ**（スローモーション 1.2 Hz・はじいた弦は n×1.2 Hz）。はじいてからの時間 τ はスクロールで決まる＝逆走で巻き戻る。
- 弦の形：揺らす＝`profile`＋`displacement`、はじく＝`pluck` の Aₙ・γₙ と `shape` で Σ Aₙe^(−γₙτ)sin(nπx)cos(nθ)。2 つを pw で混ぜる。振れが 0.15 未満のときは「形だけ ×N 拡大」の細い点線を重ねる（275 Hz の動かない点が見えるように）。
- 図の数値はすべて law から：RES＝`profile(f,null,121).max`（各 n·110 のまわりは ±0.5〜64¢ で細かく取る）・ZOOM＝`respAbs(1,f)`・PURITY＝`purity` と各 n の |aₙ|²・WALL＝`endMismatch`・TOUCHMAP＝`zone(f,xt).resp`・LADDER＝`respAbs`／`pluck`。
- 音：揺らす章は純音 f（`gainOf(f,xt)`×(1−pw)）。はじく章は n＝1..16 の正弦波を常に回し、各音量＝`playPluck` と同じ音量合わせ（`SURVIVE` で生き残る振動の合計を level 0.22 に）× e^(−γₙτ)×pw。τ はスクロールなので、巻き戻すと音も戻る。
- 「聞こえる高さ」の読みは `pluckPitch(xp, xt, τ)`（いまの τ）。はじいた直後（1/4 なら τ < 0.07 秒）は n＝1 が強い。本文の 220／330／440 は law の既定 τ＝0.25 秒。

#### 実測（Node・stub DOM でページの script をそのまま実行）
- 章 1：振れの最大 0.0021（60 Hz）→ 0.0235（100 Hz）。
- 章 2：110 Hz で 1.00。±4.35¢ でてっぺんの 0.71 倍・+10¢ で 0.400（−10¢ 0.395）・+30¢ で 0.145。音量 gainOf 0.0319→0.160（5.0 倍）。
- 章 3：220／330／440 Hz で節 1／2／3 個（0.5／0.333・0.667／0.25・0.5・0.75）。
- 章 4：275 Hz＝振れの最大 0.0227・純度 0.517（n＝2）・動かない点 0.154 と 0.613・zone OFF。
- 章 6：壁での振れ 1.000（275）→ 0.756（300）→ 0.541（310）→ 0.282（320）→ 0（330）。
- 章 7：RING は xt 0.324〜0.343 と 0.657〜0.676 だけ（1/3・2/3 で resp 1.00）。1/2 は 0.008・0.15／0.85 は 0.0085（MUTED）。
- 章 8：A₁..₄＝0.744・0.301・0.134・0.047、A₅＝0（0.2 が節）。τ 2.0 で n＝1 は 0.224。聞こえる n＝1（110 Hz）。
- 章 9：生き残る n＝{2,4,…,16}／{3,6,…,15}／{4,8,12,16}。聞こえる高さ（τ 0.25）220／330／440 Hz。消える振動は 0.03 秒で最大でも 0.30 倍。
- 音：τ＝0 のはじく音の 16 本の音量が law の `playPluck` の初期値と一致（3 つの押さえ・押さえなし）。
- 決定論：4,001 か所を前から・後ろから通って `state()` が完全一致（1440×900・390×844）。描画に NaN／Infinity なし。

#### 検証フック `window.__LP`
既存と同じ（`goto(章, u)`・`manual(true)`＋`step(秒, fps)`・`audio()`・`wheel(dy)`・`rewind()`・`loc()`）に加えて：
- `state()`：章・u・k・f・xt・proof・pw・n・zone（はじく章は PLUCK）・zoneDrive・resp・cents・振れの最大（max）・純度（purity）・動かない点（nodes）・壁での振れ（end）・gain・pluck（xp・xt・τ）・聞こえる高さ（pitch）・各 n の今の強さ（strengths）。
- `audio()`：揺らす音の f・gain・target と、はじく音 16 本の今の音量（pluck）と目標（pluckTarget）。
- `stateAt(loc)`・`locate(y)`・`CH`・`STOPS`・`read()`（law の読みの束）。
