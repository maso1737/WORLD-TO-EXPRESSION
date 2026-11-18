# SCROLL_TURING_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_TURING_LP.html（EE-06・2026-11-04）

正本 `SCROLL_SANDPILE_LP.html` の CSS・HUD・FORMULA RAIL・採寸 `measure/locate`・パネル遷移・慣性・REWIND・音の入力・`?ch=&u=` を複製。法則は `../../_law/ee06_turing.js` の外部 classic script。LP に反応拡散の式を再実装せず、law の `VS` と `FS_STEP` をそのままコンパイルする。

| 章 | id | 状態（u の純関数） | 図 |
|---|---|---|---|
| 0 | TURING | spots の 8,000 歩 | FIELD |
| 1 | DROP | drop の 0→3,000 歩 | FIELD・PROFILE（最大 V のマスを通る横一行） |
| 2 | DOUBLE | drop の 3,000→16,000 歩 | FIELD・COUNT（log₂） |
| 3 | WHY | spots の 8,000 歩、断面の行 0→127 | FIELD・PROFILE |
| 4 | RECIPES | 6 種を同じ 0→8,000 歩 | 3×2 FIELD |
| 5 | ATLAS | atlas の 0→5,000 歩 | MAP・6 種の位置 |
| 6 | HEAL | MAZE を 6,000 歩育成→中央半径 14 を wash→0→1,500 歩 | FIELD・穴内の面積率 |
| 7 | BLUEPRINT | atlas の 5,000 歩、01·02→03→04→06 の札を順に表示 | MAP |

- 進行章の通常の時間は `v=clamp((u-.04)/.90)` を使い、要求歩数を記録間隔で割って丸める。WHY の行は `round(127*v)`。BLUEPRINT は `floor(4*clamp(u/.8))` 段階。共通の針や実時間で動く模様は無い。
- 計算用の非表示 WebGL2 canvas 1 枚、RGBA32F ピンポン、`EXT_color_buffer_float`。各ランの `seedChem`・SPECIES・seed は発注どおり。1 rAF 約 8 ms の時間枠、最大 8 歩ごとに時計を見る。現在章の要求コマを優先し、RECIPES は進みの少ない種を優先。`readPixels` の同期・記録処理は分割できないため、遅い GPU では 8 ms を超える場合がある。
- drop は 401 コマ、6 種は各 201 コマ、atlas は 201 コマ、heal は 151 コマ。U は `round(clamp(u)*255)`、V は `round(clamp(v/.5)*255)` の Uint8。PROFILE は復号した同一スケールの濃さ。FIELD は LOOK INK の `smoothstep(.02,.36,V)` と黒 .015→白 .97、2D ImageData をぼかさず拡大する。
- ATLAS はアプリ `drawMap` と同じく、readPixels の先頭行を ImageData の上に置く。上 F=.09、下 F=0、左 k=.045、右 k=.070。点は SPECIES の F,k から配置。模様の手置き・並べ替えは無い。
- 粒の数＝量子化前の V>.2 の 4 近傍連結成分（上下左右の端もつながる）。面積率・半径 14 の穴内面積率も量子化前に計測。表示の数値は `data-live` で記録から出す。`first` は指定粒数以上に初めて達した記録歩数、倍増間隔は 2→4→8→16 の 3 間隔の平均。最大値・最後の値はラン完了まで伏せる。
- HEAL は洗う直前の穴内面積率を `baseline` に保存し、`uBrush=(64,64,14,-1), uRun=0` を一度だけ適用。`recovery` は baseline へ初めて戻る記録歩数。元の線形状の完全復元や、その後ずっと baseline 以上を保つ意味ではない。
- 未計算の要求コマは途中のコマで代用せず「計算中…」。RECIPES は同じ要求歩数が全種揃うまで待つ。記録が完成した後は同じスクロール位置で必ず同じ絵。GPU 非対応・float 読み込み失敗・context lost は「この環境では計算できません」と明示する方式を選択（CPU 縮小代替は実装しない）。
- 音は既定 BOW、最初の pointerdown で AudioContext を起こす。OFF／BOW／♪ON・S キー・音量は正本と同じ。コマ間の `Σ|ΔV|` を量子化した記録から累計し、逆走でもその区間の変化量で帯域ノイズ。DROP／DOUBLE は `min(1760,55*粒数)` Hz のサインを重ね、倍増すると 1 オクターブ上がる。停止後は短い減衰で無音。音用の乱数はシミュレーションから独立。

Node CPU 実測（law の `grayScottStepCPU`、128²、seed 1、V>.2。ブラウザの GPU 実測ではない）：

- drop：歩数 0／2,000／3,000／4,000／5,000／7,000／10,000／12,000／16,000 に対して、粒数 1／2／4／8／16／24／44／48／48。最大 48。初めて 2／4／8／16 粒に達する記録は 1,600／2,480／3,600／4,840 歩、初期の倍増間隔平均 1,080 歩。発注の CPU 参考値と一致。
- 各種 8,000 歩の面積率：MITOSIS 19.45%、SPOTS 22.99%、CORAL 52.16%、MAZE 42.32%、CHAOS 51.12%、U-SKATE 83.07%。最終の連結成分数は順に 45／57／1／2／2／1。広がった縞や波がつながると「粒」は少なくなる。
- HEAL：洗う前の穴内 48.61%→洗った直後 0%→250 歩 54.81%→500 歩 49.59%→1,500 歩 50.73%。初回回復は 190 歩（10 歩おきの記録）。
- ATLAS（160²・seed 1993）：5,000 歩で面積率 51.30%、連結成分数 12。
- CPU は JavaScript の数値演算後 Float32 に保存、GPU は shader の highp float 演算。長時間の分裂時刻・閾値付近の連結・CHAOS や ATLAS の細部は一致を保証しない。LP には上記 CPU 値を焼き込まず GPU 記録を表示する。

検証口：`window.__LP.goto(章,u)`・`manual(bool)`・`step(秒)`・`ready()`・`DATA`・`frameOf(id,コマ番号)`・`CH`・`RUNS`・`summary()`・`computeMode()`・`computeError()`・`computeTiming()`・`priority()`・`audio()`。`DATA[id].u/v` はコマ順の連続配列、`count/area/hole/peakRow` は各コマの実測、`travel` は音の累積変化量。`manual(true)` 中も実 rAF の計算は進むが描画時刻は止まり、`step()` で描画する。

`node -e`＋`vm.Script` の構文確認を実施。Node の DOM/canvas スタブでも、GPU 非対応表示・章の端点・現在章の計算優先・全ランの CPU 記録・375/1280 幅での描画引数の有限性・逆走時の記録不変・未計算コマの待機・トーラス連結計測を確認した。これは実レイアウトの検証ではない。Chrome は開かず、GPU 数値の CPU との比較・file/http 実動作・375px の実レイアウト・音の聴感・実 GPU の時間枠は Claude 側のブラウザ検証として残す。外部参照は同梱 law と正本と同じ Google Fonts のみ。HTML とこの節以外は変更せず、commit なし。

#### Claude のブラウザ検証（11-04）
- GPU の記録は約 4 秒で全部そろう（内蔵ブラウザが裏のときは rAF が止まるので `__LP.manual(true)`＋`step(0.5)` を回して進める。screenshot は `?ch=&u=` で開き直してから）。
- GPU と CPU（Node）の一致：drop の粒の数 1／2／4／8／16／24／44／48 はすべて同じ、heal が戻るのも同じ 190 歩、6 種の面積も CHAOS 以外は 0.1% 以内。**CHAOS だけ GPU 91%・CPU 51%**＝小さな差が育つ種族なので一致しないのが正しい。
- 直したもの：BLUEPRINT の印が 2.5 px の点で読めなかった → 縁取りの輪＋印の横に章番号。RECIPES の HUD が「6 種の粒の合計」（意味の違う数の足し算）だった → 共通の歩数。
- 音の既定は最初から BOW が光った状態（最初のクリックで音が入る）。ほかの 2 本は OFF 表示から BOW に切り替わる。動きは同じなので、そのままにした。
