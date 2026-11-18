# SCROLL_FLOCK_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_FLOCK_LP.html（EE-04・2026-11-04）

正本は SCROLL_SYNC_LP.html。CSS・HUD・FORMULA RAIL・採寸 measure/locate・パネル遷移・慣性・REWIND・音の入力・?ch=&u= を複製。法則は外部 classic script ../../_law/ee04_flock.js。ボイドの式は LP に持たず、記録も Worker も law の stepFlock を使う。

| 章 | id | 状態（スクロールの純関数） | 図 | 光る項 |
|---|---|---|---|---|
| 0 | FLOCK | murm 30 s | FIELD | — |
| 1 | ONE BIRD | murm 30→33 s、1 羽目の F.dbg | FIELD・視野・隣への線・3 力・SEES | view・fov |
| 2 | GAS | gas 0→20 s | FIELD・PHI | 規則なし |
| 3 | THREE RULES | murm 0→30 s | FIELD・PHI・群れの数 | wSep・wAli・wCoh |
| 4 | WITHOUT ONE | noAli／noCoh／noSep 0→30 s | TRIO・Φ・平均の隣 | 金枠の世界で消した項だけ暗くする |
| 5 | TEMPERATURE | sw0..12、各 26→30 s | FIELD・実測 CURVE | η |
| 6 | MELT | melt 0→60 s | FIELD・PHI・η 点線 | η |
| 7 | HAWK | 10 s 育成→鷹 4 s→12 s | FIELD・rouge の輪・PHI・群れの数 | 鷹 |
| 8 | MILL | 10 s 育成→pull／ring 0→20 s | DUO・Ω・Φ | Ω |
| 9 | SPECIES | 6 種 0→20 s | 3×2 FIELD・重み・Φ | 同じ 3 項 |
| 10 | BLUEPRINT | 温度曲線＋GAS／6 種の20 s、章番号つき | CURVE | Φ |

#### 作り（この LP 特有）

- 960×600 のトーラス、800 羽。makeFlock(960,600)→setCount(F,800,p.speed,makeRng(seed))。**全26ラン seed＝1 固定**。murm と gas の記録は SPECIES にも再利用する。鳥の配置・向きの手置き、seed の選び直し、記録を美しくする並べ替えはない。
- P={...BEHAVIORS[mode].p,on:{sep:true,ali:true,coh:true}}。noAli/noCoh/noSep は対応する on だけ false。GAS は BEHAVIORS[5]（全重み 0、noise .15）。noise sweep は i*.05（i=0..12）で作る。温度以外は MURMURATION のまま。
- 1 s＝60 歩。単画面は2歩おきの30 fps、noAli/noCoh/noSep・pull/ring・sp1..4 は4歩おきの15 fps。合計8,606コマ。x と y はそれぞれ世界の幅・高さを65535で分割した Uint16、向きは256分割 Uint8、隣の数は law の Uint8（255で飽和）を保存する。鳥の線の長さは各種の speed を基準に統一し、向き・位置・明るさはすべて記録から描く。
- Φ・中心(480,300)に対するΩ・群れの数・平均の隣・noise は量子化前の世界から Float64 で保存。**平均の隣はアプリ同様 F.nb の平均なので、255で飽和した個体を含む**。noSep の255付近は人数を無制限に数えた値ではない。群れの数は countFlocks(F,view*.8,8)、5コマおき（最後も計測）で直前値を保つ。距離の連結成分なので、まとまった飛行の数と必ずしも一致しない。
- スナップショットを保存してから law を1歩進め、そこで得た nb/F.dbg を進める前のスナップショットに対応づける。ONE BIRD の30〜33 sだけは、1羽目の位置・向き・見えた相手の位置・ID・3力も保存。扇と線は**同じ計算前状態**を示す。表示のために力や視野判定を再実装しない。
- 最後のスナップショットの視界を得るため、各ランの終了時に1歩だけ追加で law を呼ぶ。その更新後の世界は記録しない。warm の時間には鷹・餌を入れない。
- MELT はアプリ idle と同じ27→37 sのsmoothで .05→.55、39 sまで保持、39→49 sで .05へ戻す。HAWK は育成後のローカル時刻0〜4 sに hx=w*(-.05+1.1*t/4), hy=h*(.62-.25*t/4)。位置を群れに合わせ直さない。MILL の餌は中央固定、pullだけ ext.lurePull=true。
- 通常の章は v=clamp((u-.04)/.90)。TEMPERATURE は z=13*v、j=min(12,floor(z))、そのランの時刻4*(z-j)。各温度の帯を進むごとに最後の4秒を再生し、温度が替わると次の記録へ戻る。実時間ではループしない。CURVE は13ラン各121コマ（26〜30 s、両端を含む）の Φ 平均で、未完了の点を推測しない。
- BLUEPRINT の種族の点は各20 sの瞬間値。曲線は MURMURATION の26〜30 s平均なので、違う条件の点が曲線に乗るとは主張しない。GAS は02と09の両章に対応する。
- Worker 3本。workerSource() は law の関数を String(fn) でつなぎ、必要な DEG・_st・BEHAVIORS と記録関数を含める。TypedArray を transfer し、完了時は terminate／Blob URL revoke。作成不可・実行エラーなら全 Worker を停止して同じ runner を本体で10 msずつ実行する。yield は原則1歩おき（育成中は2歩おき）で、遅い1歩自体は分割しない。
- frameOf(id,コマ番号) は未計算の要求コマなら null。途中の絵で代用しない。比較パネルは全世界の同じ時刻がそろうまで待機。計算終了後、スクロール位置が同じなら絵も数値も同じ。HUD の複数世界の値は合計せず、本文末尾の data-live に各世界を列挙。
- 見た目はアプリの3段の ice（隣 <3／<20／それ以上）、SEP金・ALI ice・COH紫、鷹rougeの半径130、餌goldの菱形。描画の実時間パルスや残像の蓄積は入れず、逆走でも同じ絵。トーラスの鷹の輪は端に見えるコピーも描く。
- 音は既定 BOW（最初からボタン点灯）、最初の pointerdown で AudioContext を起こす。OFF／BOW／♪ON・Sキー・音量。コマ間の量子化前の向きの最短角差 Σ|Δθ| を累積し、往復とも累積差の絶対値を読む。羽音は帯域ノイズ、低音は110 Hzサイン1本に Φ²で音量を掛ける。鷹が実際に鳥へ近いとき短い高音。ONも停止後は減衰して無音。音用 Math.random は law の makeRng から独立。

#### Node 実測（ブラウザ実測ではない）

- murm：Φ 0.00753（0 s）→0.31810（10 s）→0.88911（20 s）→0.88348（30 s）。30 sの群れ1、平均の隣76.83。gas は20 sで Φ 0.05185、平均の隣5.67。
- WITHOUT ONE の30 s：noAli Φ **0.00656**・隣 **34.64**・群れ5、noCoh Φ **0.98436**・隣 **6.79**・群れ2、noSep Φ **0.99225**・隣 **254.96**（255飽和を含む）・群れ1。noAli の最後の4秒平均 Φ は0.05029で、瞬間値とは違う。
- TEMPERATURE の26〜30 s平均：

| η | 0 | .05 | .10 | .15 | .20 | .25 | .30 | .35 | .40 | .45 | .50 | .55 | .60 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Φ平均 | .9121 | .8682 | .7598 | .8034 | .4335 | .4670 | .2490 | .0594 | .0487 | .0459 | .0355 | .0295 | .0330 |

- **温度曲線は単調ではなかった**（.10→.15、.20→.25などで上がる）。単一seed・有限時間の記録をそのままつなぎ、滑らかな理論曲線へ直していない。「0.3ちょうどで必ず溶ける」と断定せず、境目近くでそろいが失われる本文にした。参考値と期間・個体数が違い、.30は0.2490、.35は0.0594。
- MELT：27 s Φ .86853→37 s .00214→39 s .02914→49 s .17834→60 s .78612。冷やし終わっても即座には戻らない。
- **HAWK は「割れて戻る」という単純な増減ではなかった**。育成後のローカル0／4／10／16 sで群れ **4／2／1／1**、Φ **.31810／.52501／.82902／.75568**。固定した直線・seedを維持し、本文は「近い鳥が避け、その後の数を追う」に変更した。この記録だけで鷹による分裂を断言しない。
- MILL：ring は4／10／20 sで Ω **−.99474／−.99463／−.99429**、20 sの Φ **.51770**。pull は同時刻 Ω **−.65513／+.26532／+.13412**、全20秒のΩ範囲 **−.87609〜+.89250**、20 sの Φ **.91169**。台本の「−.06の塊」にはならず、向きを保った群れの往復。発注書の修正方針どおり、安定した渦と区別した。
- SPECIES の20 sの Φ：MURMURATION .88911／SCHOOL .94738／GNATS .03636／STREAMS .96003／BAIT BALL .55786／GAS .05185。
- 同じ記録係を Node で同期実行した全26ランの初回所要64.73秒（直列）。ブラウザ Worker 3本の20秒目安は未確認。記録配列本体41,790,736 bytes、スポットライト込み **41,816,478 bytes（約41.82 MB）**。computeTiming() で容量・起動時間を取得できる。

#### 検証フックと引き継ぎ

window.__LP.goto(章,u)・manual(bool)・step(秒)・ready()・DATA・frameOf(id,コマ番号)・CH・RUNS・summary()・audio()。追加：atTime(id,秒)・locate/measure/metrics/loc/maxY・workerMode()・workerSource()・computeError()・computeTiming()・setMode()・rewind/rewinding/wheel。

DATA[id].xy/q/nb はコマ順の連続配列、phi/omega/flocks/mean/noise/travel/near はFloat64、dbg[コマ] はONE BIRD用。summary() は各ラン0／4／10／20／末尾などのΦ・Ω・群れの数・隣、最後の4秒の平均Φ、Ω範囲。murmには30 s、meltには27／37／39／49 sも含む。hawk/pull/ringの時刻は10 sの育成後を0とする。sweepは26 sの育成後を0とする。

検証済み（Nodeのみ）：
- HTML の inline script と生成 Worker source を vm.Script で構文確認。一時 SCROLL_FLOCK_LP.tmp.html に fs.writeFileSync(path,str,'utf8') で全文を書き、読み直して構文確認後に rename。日本語を PowerShell のコマンド文字列・引数に渡さず、Nodeの標準入力へASCIIのUnicodeエスケープとして渡した。
- Worker不可のDOM/canvasスタブで、ページ自身の fallback／onMsg から全26ランを完走（分割待機込み96.86秒）。同期実測と summary が一致。
- ページが生成した Worker source を Node worker_threads 3本で実行：**19.69秒**。全8,606コマの xy/q/nb と7種類の数値が本体記録と完全一致、比較エラー0。これはブラウザ起動時間の保証ではない。
- 1280×900／375×812のスタブで174通りの章端点・途中・パネル遷移を実行し、描画引数に NaN／Infinity なし。BLUEPRINT 凡例を小画面2列に調整した後も66通りを再確認。これは実レイアウト検証ではない。
- ONE BIRDの30〜33 sのdbg保存と、30 sで見えた全相手の半径・fovを照合。逆走で記録不変、未計算要求はnull、音の累積差は順逆同量、停止後の音入力motion=0を確認。AudioContextの実動作・音量・聴感は未検証。
- 開始時に記録した他の Emergence Engine 配下24ファイルのSHA-256は全て不変。HTMLはUTF-8・LF、CLAUDE.mdの既存部分をバイト同一で保持して末尾だけ追加。一時HTMLは残さず、commitなし。

Claude 側でブラウザ確認してほしい点：
1. file:// と http:// のBlob Worker実動作、ready()が全完了するまでの時間、Worker不可時の分割実行。
2. ?ch=1&u=.5 の視野・3本の矢印、375pxでTRIO／DUO／3×2の鳥と数値、BLUEPRINTの密集した低noiseの印と凡例、カードとFORMULA RAILの重なり。
3. 往復スクロール・REWIND・タッチ・リサイズ・reduced-motionで、同じ位置に同じ記録が戻ること。
4. 初回クリックでBOWが鳴ること、Sキー／音量／OFF、♪ONも停止すると無音になること。羽音と低いサイン、HAWKの短い高音の聴感。

#### Claude のブラウザ検証（11-04）
- 法則は Claude が先に `04_flock.html` の SIM ブロック＋BEHAVIORS を `_law/ee04_flock.js` へ**そのまま**切り出した（アプリも読む・ブラウザでエラーなし）。足したのは `makeRng(seed)` と LP 専用の `ext.lurePull`（アプリは使わない＝アプリの動きは同じ）。
- 実装は Codex（astra high・12.6 万トークン・上限には届かず完走）。掟「Node の fs で UTF-8・PowerShell に日本語を入れない」で今回は化けなかった。
- 全 26 ランの記録：内蔵ブラウザ（裏のタブ）で 31〜46 秒（Node の Worker 3 本は 19.7 秒）。**ほかの LP（4〜10 秒）より長い**＝前に出ているタブならもっと早いはずだが、未確認。
- 直したもの：ONE BIRD は 1 羽目が画面の端に小さく出ていた → その 1 羽を中心に 2.6 倍に拡大して追う（トーラスを回り込ませて描く）。MILL の 2 枚が縦長の枠で小さかった → 枠が縦長なら上下 2 段。
- 1280×800 と 375×812 で全章を目視。横スクロールなし。音の聴感は未確認。
