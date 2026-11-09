# CLAUDE.md — sound-patterns/scroll（解説スクロール LP）

教材アプリ（`../0x_*.html`）と 1 対 1 で対になる「読む版」。方針は `../../20_Design/PLAN_SCROLL_EXPLAINER.md`。
入口は `../index.html`（APP と SCROLL を横に並べている）。

## SCROLL_BEATS_LP.html（SP-02・2026-11-03）

| 章 | id | 状態（スクロールの純関数） | 図 | 光る式の項 |
|---|---|---|---|---|
| 0 | BEATS | Δf 0・330 Hz | WAVES | f₁ f₂ |
| 1 | ONE | Δf 0 | PHASE・WAVES・SUM | f₁ f₂ |
| 2 | DRIFT | Δf 0→1 | 同上 | f₂・2cos |
| 3 | PROOF | Δf 1→3（平方根で補間） | PROOF（3 段＋20 ms 拡大窓） | 2cos・sin |
| 4 | BEAT | Δf 3→14 | PHASE・WAVES・SUM | 2cos |
| 5 | ROUGH | 14→いちばん粗い 23.7（止まる）→40 | SUM・CURVE | rough |
| 6 | TWO | 40→150（平方根） | EAR（模式図）・CURVE | Δf*・CB |
| 7 | REGISTER | 長3度のまま 110→440 Hz（対数） | MAP・CURVE | s・f₀・CB |
| 8 | BLUEPRINT | 長3度 440 Hz で止まる | MAP（歩いた道） | rough・s |

### 作り
- 法則は `../_law/sp02_law.js` をそのまま読む（アプリと同じ式・同じ数字）。LP 側に式は持たない。
- 骨格：章＝縦長の `section.ch`（高さ vh）＋ `position:sticky` のカード。絵は固定の canvas 1 枚。
  `locate(y)` が章 i・章の中の進み u（カードが止まっている間 0→1）・次の章へのつなぎ k（最後の 1 画面ぶん）を返す。
  状態は `stateAt(loc)` だけで決まる（Δf は平方根、音域は対数で混ぜる）。図の置き場所も k で混ぜる。
- **時間で動くのは波の位相だけ**（矢印の回転・波の流れ・うなりのランプ）。うなりは時間の現象なので、音と同じ実時間で動かす。それ以外はすべてスクロールの純関数＝逆走・REWIND がそのまま成立する。
- BLUEPRINT の線（`PATH`）は `stateAt` を章の中とつなぎで細かく取ったもの。スクロールで実際に通る道と同じ。
- 慣性：ホイールだけ目標位置を作って毎コマ近づける（6/秒）。キー・スクロールバー・タッチはブラウザのまま。`prefers-reduced-motion` では切る。
- 音：OFF ／ ♪ ON（鳴りっぱなし・周波数がスクロールを追う）／ BOW（スクロールの速さで鳴る。速さ 900 px/秒で全開、止めると約 0.5 秒の時定数で消える）。`S` キーで循環。
- スマホ（880px 未満）：図（〜36vh）→ 式の帯（光っている行だけ）→ カード の順に積む。

### 検証フック `window.__LP`
`goto(章, u)`・`manual(true)`＋`step(秒, fps)`（裏の内蔵ブラウザは rAF が止まるので必ず手で進める）・`audio()`・`wheel(dy)`・`rewind()`・`PATH`。
内蔵ブラウザが隠れていると screenshot が真っ黒になる（`document.visibilityState === 'hidden'`）。そのときは要素の位置を数値で確かめる。

## SCROLL_CONSONANCE_LP.html（SP-03・2026-11-03）

骨格・慣性・音の切替・検証フックは BEATS と同じ。状態はセント c と**音色 A（倍音 6 本の強さの配列）**で、章のあいだは要素ごとに混ぜる（純音 → RICH → SL-02 がなめらかに変わる）。法則は `../_law/sp03_law.js`。

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

## SCROLL_CHLADNI_LP.html（SP-05・2026-11-05）

骨格・CSS・慣性・音の切替・FORMULA RAIL・REWIND・検証フックは CONSONANCE の複製。法則は `../_law/sp05_law.js`（変更なし）。
状態は f・drive と**砂**。砂は履歴で決まるので「スクロール＝シミュレーションの時間」にした（下の「作り」）。

| 章 | id | シナリオ（章の時間 τ） | 図（PC） | 光る式の項 |
|---|---|---|---|---|
| 0 | CHLADNI | (2,5)+ ぴったり・τ 4→8（起動時に 0→4 を作る＝できあがった後から） | PLATE（大） | φ |
| 1 | PLATE | (0,3)+ と (1,3)+ の真ん中 455.1 Hz で 8 秒 | PLATE・SPECTRUM | f |
| 2 | RESONANCE | 章 1 の砂の続き。0.5→4.5 秒で (1,3)+ へ・あとは止まる | PLATE・SPECTRUM・RESP | r²H/Q・Q |
| 3 | STILL | 章 2 の続き。(1,3)+ のまま 4 秒・揺れの地図と節線（黄）がフェードイン | PLATE＋地図・ACCEL | DRIVE·\|A\|・> 1 |
| 4 | WALK | まき直し・(1,3)+・8 粒の軌跡（四角＝いま・黄＝止まっている） | PLATE（粒は暗く） | (acc−1)・でたらめ |
| 5 | SHAPE | (2,5)+ τ 3→4.5 → (2,5)− に切り替えて 9 まで | PLATE・TERMS（項 1・項 2・和・差） | φ・± |
| 6 | HIGHER | 章 3 の続き。(1,3)+→(2,4)+→(2,5)+→(3,6)+→(2,7)+（各 1.2 秒止まる・0.8 秒で次へ） | PLATE・LADDER・SPECTRUM | f・n²+m² |
| 7 | MISS | 章 0 の続き。1 秒で +30¢ → まき直し → 5 秒まで → 0.5 秒で戻す → 7.5 秒 | PLATE・RESP・SPECTRUM | r＝f/fₙₘ |
| 8 | DRIVE | まき直し・(2,5)+・drive 8（0〜3 秒）→ 12（〜6）→ 24（〜9）。まき直さずに続ける | PLATE・ACCEL＋DRIVE の目盛り | DRIVE・1/DRIVE |
| 9 | BLUEPRINT | 章 0 の続き・(2,5)+ | SPECTRUM（立ち寄った高さに章番号）・PATTERNS（各章の節目の砂 6 枚） | — |

### 作り
- **砂はスクロールの純関数**：各章のシナリオ（`SC`：T・t0・seed・from・resets・f(τ)・drive(τ)）を `<script>` の `SIM-BEGIN`〜`SIM-END` に置いた（DOM を触らないので Node で切り出して検証できる）。u → τ = t0 + u·(T − t0) → 歩 s = round(τ·60)。
- 砂を動かすのは `SP05.stepSand` と `SP05.scatter` だけ。乱数は law の `makeRng` と**同じ式の xorshift** を LP 側で持つ（law の rng は状態を取り出せないため。10 万回で law と一致を確認）。
- **節目**：0.25 秒（15 歩）ごとと章の終わりに、砂の座標（Float32Array）と rng の状態を保存。表示はいちばん近い手前の節目に戻して進め直し、1 コマ最大 6 歩で追いかける（`view`）。裏で 1 コマ 4 ms まで節目を前へ延ばす（いまの章→次の章・BLUEPRINT ではサムネイルの章 3・5・6）。前の章の続きの章（from）は、その章の終わりができるまで「砂を用意しています…」。
- field（G=160）は f ごとに 1 回（グライド中は偶数コマの f＝2 コマに 1 回）。
- 時間で動くのは PLATE の描画のぶれ（サブピクセル）だけ。
- 章のあいだ（つなぎ k）は 2 つの章の砂を重ねて入れ替え、音の f は対数で混ぜる。
- TERMS の 2 つの項は law の `shape`×`norm` の和と差から作る（式を持たない）。ACCEL と止まる帯の「1」（重力）だけは表示用に LP が持つ（law に定数が無い）。
- メモリ：全章の節目を作ると約 300 個×160 KB ≒ 49 MB（PC）。

### 実測（Node・20,000 粒・ページと同じ SIM ブロック）
- 章 1：線の上（(1,3)+ の線）18.7% → 20.4%（ばらまき 18.7%）。(0,3)+ の線で数えると 26.5% → 25.9%（ばらまき 26.1%）。resp 0.123・STIR。
- 章 2：99%（τ 8 で 98.8%）。音は gainOf で 3.16 倍。
- 章 4：19% → 1 秒 74% → 2 秒 90% → 8 秒 99.7%。
- 章 5：(2,5)− に切り替えた瞬間 25.4% → 0.5 秒で 82.3% → 98.9%。(2,5)± は 1399.3／1304.7 Hz（121 セント）。
- 章 6：各共鳴の止まり際 91.3%（(2,4)+）・94.5%・95.3%・97.4%（(2,7)+）。
- 章 7：+30¢ で resp 0.311・4 秒後 36.5%（ばらまき 22.4%）→ 戻して 2 秒で 97.0%。
- 章 8：止まる帯（板の面積）15.1% → 7.4% → 2.1%。線の芯（|φ|<0.05）11.8% → 34.4% → 90.0%。別に drive 6 を 3 秒：線の上 42%。
- 決定論：前進（1 コマ 6 歩の追いかけ）・逆走・別の順でのジャンプ 907 か所で座標がバイト単位で一致。起動時に作る章 0 は Node で 0.29 秒。

### 検証フック `window.__LP`
既存 2 本と同じ（`goto(章, u)`・`manual(true)`＋`step(秒, fps)`・`audio()`・`wheel(dy)`・`rewind()`）に加えて：
- `sand()`：いまの章・τ・歩（step／target／ready＝追いついた）・f・drive・mode・resp・cents・zone・線の上（lines）・ばらまきの割合（base）・跳ねた割合（moved）・線の芯（core）・止まる帯（stopBand）・座標のハッシュ（hash）。
- `onLines()`・`settle()`（待たずに追いつかせて `sand()` を返す。`goto` のあとに使う）・`grains()`・`hash()`・`snaps()`（章ごとの節目の数）・`boot()`（起動時の章 0 の計算 ms）・`sim`（SIM 本体）。
- 逆走の確認：`goto(i,u)`→`settle()`→`hash()` と、前／後ろから `step` で来たときの `hash()` が同じになる。

## SCROLL_STANDING_LP.html（SP-04・2026-11-06）

骨格・CSS・慣性・音の切替・FORMULA RAIL・REWIND・`fitText`・検証フックは CHLADNI の複製（砂の SIM は無し）。法則は `../_law/sp04_law.js`（変更なし）。
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

### 作り
- 台本は `CH[i].at(u)`。章のあいだ（つなぎ k）は f を対数・xt／proof／pw を線形で混ぜる。押さえあり⇔なしの境は xt を k＝0.5 で切り替え、指の絵だけ `fa` で薄める。はじき直し（8→9・9 の区間の境）も k＝0.5／区間の境で τ が 0 に戻る。
- **時間で動くのは弦の位相だけ**（スローモーション 1.2 Hz・はじいた弦は n×1.2 Hz）。はじいてからの時間 τ はスクロールで決まる＝逆走で巻き戻る。
- 弦の形：揺らす＝`profile`＋`displacement`、はじく＝`pluck` の Aₙ・γₙ と `shape` で Σ Aₙe^(−γₙτ)sin(nπx)cos(nθ)。2 つを pw で混ぜる。振れが 0.15 未満のときは「形だけ ×N 拡大」の細い点線を重ねる（275 Hz の動かない点が見えるように）。
- 図の数値はすべて law から：RES＝`profile(f,null,121).max`（各 n·110 のまわりは ±0.5〜64¢ で細かく取る）・ZOOM＝`respAbs(1,f)`・PURITY＝`purity` と各 n の |aₙ|²・WALL＝`endMismatch`・TOUCHMAP＝`zone(f,xt).resp`・LADDER＝`respAbs`／`pluck`。
- 音：揺らす章は純音 f（`gainOf(f,xt)`×(1−pw)）。はじく章は n＝1..16 の正弦波を常に回し、各音量＝`playPluck` と同じ音量合わせ（`SURVIVE` で生き残る振動の合計を level 0.22 に）× e^(−γₙτ)×pw。τ はスクロールなので、巻き戻すと音も戻る。
- 「聞こえる高さ」の読みは `pluckPitch(xp, xt, τ)`（いまの τ）。はじいた直後（1/4 なら τ < 0.07 秒）は n＝1 が強い。本文の 220／330／440 は law の既定 τ＝0.25 秒。

### 実測（Node・stub DOM でページの script をそのまま実行）
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

### 検証フック `window.__LP`
既存と同じ（`goto(章, u)`・`manual(true)`＋`step(秒, fps)`・`audio()`・`wheel(dy)`・`rewind()`・`loc()`）に加えて：
- `state()`：章・u・k・f・xt・proof・pw・n・zone（はじく章は PLUCK）・zoneDrive・resp・cents・振れの最大（max）・純度（purity）・動かない点（nodes）・壁での振れ（end）・gain・pluck（xp・xt・τ）・聞こえる高さ（pitch）・各 n の今の強さ（strengths）。
- `audio()`：揺らす音の f・gain・target と、はじく音 16 本の今の音量（pluck）と目標（pluckTarget）。
- `stateAt(loc)`・`locate(y)`・`CH`・`STOPS`・`read()`（law の読みの束）。

## SCROLL_HARMONIC_LP.html（SP-01・2026-11-09）

骨格・CSS・慣性・音の切替・FORMULA RAIL・REWIND・`fitText`・検証フックは STANDING の複製。法則は `../_law/sp01_law.js`（変更なし）。
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

### 作り
- **時間で動くのは波形とダイヤルの位相だけ**（実時間の 1/4・アプリの SHOW と同じ）。ずれた倍音があると WAVE の形が n·F0·|d| Hz で回る。それ以外はスクロールの純関数。
- 図の数値はすべて law から：LADDER の色＝`zone`、PROOF＝`spacing`、WAVE＝`wave`、PERIOD＝`autocorr`／`pitch`、POPMAP＝`popThreshold`／`popScore`、MAP＝各章の止まる u を `CH.at` で評価して `pitch`・`zone`・`spacing`（`STOPS`）。
- ずれの横位置はアプリと同じ √ 目盛りの拡大表示（`SHIFT_VIS` 0.45）。
- 音：倍音 12 本の正弦波（`gains`＝全体の強さをそろえる）×(1−solo) ＋ 3 倍音 1 本（`playPing` と同じ音量 `PING_LEVEL·hfAtt`）×solo。
- 低い枠（スマホ・高さ 230 未満）では LADDER の上下の余白を詰める（詰めないと棒の高さが 0 になる）。

### 実測（11-09・ブラウザ）
- 章ごとの聞こえる高さ：純音・足す途中・のこぎり波・基音なし・4〜12 だけ＝220.0、+1 %（u 0.48 前後）220.2・+1.9 % 220.35 WOBBLE（12.54 Hz）・+4 % 220.71 POP（26.4 Hz）、偶数番 440.0、3 の倍数 660.0、偶数→3 の倍数の途中 220.0。
- 音：12 本の周波数・ゲインが law の目標と一致（solo 中は 0・3 倍音 1 本 0.1）。+4 % で 3 本目 686.4 Hz。偶数番で奇数のゲイン 0。BOW はスクロールで 0.35 → 止めて約 2 秒で 0.01。
- 決定論：1,501 か所を前から・後ろから通って `stateAt` が完全一致、NaN なし。REWIND で 0 まで戻る。スマホ 375 px で横スクロールなし。

### 検証フック `window.__LP`
既存と同じ（`goto`・`manual`＋`step`・`audio()`・`wheel`・`rewind`・`loc`）に加えて `state()`：章・u・k・amps・shifts・proof・solo・zone（solo 中は SOLO）・zoneLaw・score・drift・pitch・tau・spacing・live。

## SCROLL_UPDOWN_LP.html（SP-06・2026-11-10）

骨格・CSS・慣性・音の切替・FORMULA RAIL・REWIND・`fitText`・検証フックは HARMONIC の複製。法則は `../_law/sp06_law.js`（アプリと共有）。
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

### 作り
- **時間で動くのは三全音のくり返しだけ**（A 0.5 秒・間 0.1・B 0.5 秒・間 0.5＝1.6 秒周期）。音は間のうちに周波数を切り替える（bus を 0 に）。ほかはスクロールの純関数。
- 音：8 本の正弦波の「席」（law の `slots`）。上の端を越えた部品は下の端へ席ごと移る（窓で無音なので周波数を飛ばしてよい）。
- 図の数値はすべて law から：HELIX の光＝`env`、足あと（1 周回したときの聞こえる高さ）＝`height`、STAIRS＝`height`＋`step`、CLARITY＝`clarity`（LINE／CIRCLE の帯も law の LINE_H・CIRCLE_H から探す）、EAR＝`step`・`earPredict`。

### 実測（11-10・ブラウザ）
- 章 1：C4 261.6 → C6 1046.5 Hz・H 1。章 2：σ 0.71 で BLEND（H 0.23）→ 2.0 で CIRCLE。
- 章 3：12 段とも UP・聞こえる高さ 523.25 Hz のまま。章 6：D♯ で 622 Hz・F♯ で 523 Hz に落ちる・DOWN は 2 歩（F→F♯・F♯→G）。
- 章 7：σ 0.38 H 0.98・0.67 H 0.31（BLEND）・1.2 H 0.0015。章 8：EITHER（score 0.000）・耳の型 D＝UP／G♯＝DOWN。章 9：σ 0.25 で UP（440 → 622 Hz）。
- 音（♪ ON）：8 本の周波数・ゲインが law の `slots` と一致（相対 1e-5）。三全音で A1・A（間 0）・B1・B が 1.6 秒周期で回る。BOW はスクロールで 0.29 → 止めて約 2 秒で 0.005。
- 決定論：1,501 か所を前から・後ろから通って `stateAt` が完全一致・NaN なし。REWIND で 0 まで戻る。スマホ 390 px で横スクロールなし。

### 検証フック `window.__LP`
既存と同じ（`goto`・`manual`＋`step`・`audio()`・`wheel`・`rewind`・`loc`）に加えて `state()`：章・u・k・P・name・sigma・mu・proof・pair・zone・H・h・hz・tri・triScore・stairs（n・last・dirs・downs）・shown（いま鳴っている A／B と gate）。`shown()`・`time()`。

## 共通（6 本とも）
- 音の既定は **BOW**（11-03 ユーザーの好み）：最初のクリックで BOW が入る（自分で OFF を押したら入れない）。ボタンは OFF／BOW／♪ ON、`S` で同じ順に循環。
- `?ch=章&u=0..1` でその場面から開く（共有・検証用）。内蔵ブラウザが隠れているとき、`goto` だけでは screenshot が古いままなので、この URL で開き直すと撮れる。
- スマホは各章の `PM`（図 1〜2 枚）に切り替える。
