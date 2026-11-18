# SCROLL_SLIME_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_SLIME_LP.html（EE-03・2026-11-04）

正本は SCROLL_FLOCK_LP.html。CSS・HUD・FORMULA RAIL・measure/locate・パネルの補間・慣性・REWIND・OFF/BOW/♪ON（既定 BOW）・URL の ?ch=&u=・Worker 失敗時の本体10 ms分割実行を複製した。法則は外部 classic script ../../_law/ee03_slime.js。ブラウザは開いていない。

| 章 | id | 状態（u の純関数） | 図 | 光る項 |
|---|---|---|---|---|
| 0 | SLIME | net 10 s | FIELD | — |
| 1 | SNIFF | net 10→12 s、36匹の先頭を中心に2.6倍 | FIELD・3点の棒・実際の旋回 | sa・so・ra |
| 2 | DUST → NET | net 0→10 s | FIELD・COVER | dep・decay |
| 3 | FADE | decay .01/.10/.30、0→10 s | TRIO | decay |
| 4 | FOOD | food 0→34 s | FIELD・COVER・餌の階段 | 餌 |
| 5 | LET GO | 同じfood 34→58 s | FIELD・COVER・餌の階段 | 餌 |
| 6 | HEAL | food 30 sを再現→cutAtの列→0→6 s | FIELD・COVER・接続0/1 | — |
| 7 | MORPH | net 10 sを再現→LABYRINTH/HONEYCOMB/CELLS、0→10 s | TRIO | sa・ra・so |
| 8 | SPECIES | 同じdustから6種、0→10 s | 横長3×2／縦長2×3 | 同じ1行・違う数 |
| 9 | BLUEPRINT | 00〜08の最後の記録 | 3×3、比較章は全種の小図 | — |

#### このLP特有の作り

- 世界256×160・トーラス・6,144粒・dep=5・全13ランseed=1固定。dustをseedAgentsで作った直後、アプリpickSniffers同様に同じmakeRngから36回引いてIDを選ぶ。全ランでこの36回を消費するので、初期状態とNETWORK育成は一致する。seedを選び直していない。
- 1秒=60歩。各歩は餌の更新→各餌にdepositDisc(x,y,3,60)→stepAgents→diffuse。s秒のコマは、その時刻まで完了した状態。餌は6/9.2/12.4/15.6/18.8/22秒に追加、34秒で先頭2個を除き、40秒で2個追加。58秒で記録終了。アプリの「境界を越えたら」を固定60Hzの境界ステップに置く。idleFoodSpotの24候補・既存の餌から最も遠い点・最初は中心から最も遠い点・内側の配置域をそのまま使用。
- 記録配分：netは12秒×30fps+1=361コマ。foodは58秒×10fps+1=581コマ。HEALは6秒×60fps+1=361コマ。fade2本・morph3本・sp1〜5の10本は各10秒×10fps+1=101コマ、128×80。合計2,313コマ。FADEの.10とSPECIESのNETWORKはnetを再利用し、比較時刻を0.1秒に丸めて全世界を同じ歩数にそろえる。
- trail記録はTONE[min(1023,(trail*256/(dep*7))|0)]のUint8。比較は量子化前の2×2平均をTONEへ渡す。描画時にlawのbuildLUTを引き、1/4解像度blur(2px)をlighter・alpha .4で重ねる。金の餌・rougeの傷は実際に投入した位置だけに描く。実時間のパルスや残像は使わず、傷の輪の減衰も記録時刻の関数。
- coverはlawのcover(sim,dep*2.2)を毎コマ量子化前に計測。アプリと同じ5セルおきの標本率であり、全セルを厳密に数えた面積ではない。餌数・粒数・累積Σ|Δtrail|・接続もFloat64。本文の末尾はdata-liveから記録を読む。
- SNIFFは位置x/y、向きa、F/FL/FR、実際の旋回Δaを36匹×7値のFloat64で保存。lawは粒を順に動かしてtrailへ置くので、単に全員を動かす前に嗅ぐと判断とずれる。observeStepは選んだIDの直前／本人／以後に配列ビューを分割し、同じlaw.stepAgentsを順番に呼ぶ。本人の直前の量子化前trailを、lawと同じTRIG添字・整数化で読む。旋回はlaw実行前後の角差。運動・旋回の式は再実装していない。背景はそのコマの開始状態、各センサーは同じ歩の本人の番の状態（先行粒のdepositを含む）。赤は最大値とは限らず実際に選んだ向き。トーラスを回り込ませて先頭の粒を追う。
- MORPHはNETWORKで10秒育てた粒・trail・RNG状態を保持し、pだけを替える。独立ランで同じseedを再生して分岐する。HEALもfoodの30秒を同じ手順で再生して分岐し、その6秒は6個の餌を保つ。
- HEALの位置決定：量子化前trail>11の4近傍、上下左右をトーラスで連結するBFS。接続した全餌ペアのうち最短トーラス距離が最大の組を選ぶ。BFS経路の中点で、前後5セルから得た接線に直交する長さ48セルの線を作り、3セルおきに整数化した17中心でアプリと同じ半径7のcutAtを実行。trailを0にし、中心から距離²<49*2.2の粒の向きを乱数にする。傷を大きくする再試行・接続を切るための位置変更はしていない。
- 選ばれた餌はA=(213,132)、B=(86,38)。BFS経路194セル、中点(143,159)。傷は端を回り込み、中心列は(149,22)から(137,136)まで。完全な17座標はDATA.heal.wound.cutsとsummary()に保存。端を回り込む傷の輪も描く。
- HEALは1コマ1歩で記録。v=clamp((u-.04)/.90)の前半55%を0〜0.5秒、残りを0.5〜6秒に割り当てる。他章は正本のv。未計算コマはnullで待機し、比較は同時刻が全てそろうまで描かない。
- Worker sourceはlawの関数をString(fn)で渡し、TRIG・TONEの初期化とLUTの初期化も含める。3本のBlob WorkerからTypedArrayをtransfer。作成・実行失敗なら全Workerを止めてDATAをクリアし、同じrunner/onMsgを本体で10msずつ進める。
- 音は量子化前trailのコマ間Σ|Δ|を累積し、往復とも区間の累積差の絶対値を読む。帯域ノイズとcoverで高さが少し変わる低いサイン。餌の増減を横切ると短い鈴。BOWはスクロール速度を掛け、ONも停止後は減衰して無音。音用Math.randomはシミュレーションと独立。初回pointerdown・Sキー・音量入力は正本の型。

#### Node実測・想定との差

Node v24.14.1。ブラウザ実測ではない。

- 3 worker_threadsでページ生成のWorker sourceをそのまま実行：初回1.379秒、再検証1.504秒。全13ラン。記録TypedArray本体64,589,088 bytes、検証フックのメタデータ見積もり込み64,595,112 bytes（約64.60 MB）。目安の80 MB／20秒以内をNodeでは満たした。
- Worker不可のページ自身のfallback/onMsgをDOM/canvasスタブで完走：初回29.635秒、再検証24.178秒（10ms分割の待機込み）。全2,313コマの全TypedArrayと傷メタデータをSHA-256で比較し、Workerとの差0。
- NETWORK cover：0.5秒18.38%、1秒24.57%、5秒17.37%、10秒11.76%、12秒11.80%。最大24.62%は0.967秒。「粉が2秒で網」より早く太り、その後細る記録。320×200の参考値14〜16%へ数値を合わせず、この世界の値を表示する。
- FADE 10秒：decay .01/.10/.30で48.88%／11.76%／4.46%。
- FOOD：6秒（1個）15.37%、10秒（2個）12.83%、22秒（6個）14.07%、30秒（6個）14.03%。単調な増加でも減少でもない。「餌を足すと網がぐっと伸びる」と書かず、組み替わりと面積を分けて読む本文にした。
- LET GO：33.9秒6個・12.84%→34秒4個・12.96%。39.9秒4個・12.49%→40秒6個・12.56%。58秒6個・13.60%。
- **HEALは切っても接続が失われなかった**。切る前のfood30秒cover14.03%→直後13.53%。A-B接続は直前も直後もtrue、その後6秒の361コマ全てtrue。firstDisconnected=null、reconnected=null。「0秒で治った」ではなく「切断されなかったので再接続時刻なし」。別経路が残った記録に本文を合わせ、seed・ペア選定規則・傷をやり直していない。
- MORPH 10秒：LABYRINTH 8.96%、HONEYCOMB 14.34%、CELLS 16.03%。全て0秒ではnet10秒の11.75537109375%と一致。
- SPECIES 10秒：NETWORK 11.76%、VEINS 23.45%、LABYRINTH 17.41%、HONEYCOMB 26.83%、CELLS 17.61%、BEADS 10.94%。MORPHと同種でも、育った網を引き継ぐかdustから始めるかで異なる。

#### 検証フック・検証境界

window.__LP.goto(章,u)・manual(bool)・step(秒)・ready()・DATA・frameOf(id,コマ)・atTime(id,秒)・CH・RUNS・summary()・computeTiming()・workerMode()・audio()。追加でworkerSource()・computeError()・measure/locate・metrics/loc/maxY・setMode/rewind/rewinding/wheel。

DATA[id].pixelsはコマ順の連続Uint8、foodXYは各コマ最大6個の整数座標、net.sniffは各コマ36匹×[x,y,a,F,FL,FR,Δa]。cover/foods/agents/travel/connectedはFloat64。接続を測らないランはconnected=-1。summary()は要所のcover・餌・粒・接続、ピークと時刻、傷の根拠と初回切断／再接続時刻を返す。

Node検証済み：
- inline scriptと生成Worker sourceのvm.Script構文確認。UTF-8・LF。HTML／追記本文の日本語はASCIIのUnicodeエスケープにしてNodeの標準入力へ渡した。全文をfs.writeFileSync(path,str,'utf8')でSCROLL_SLIME_LP.tmp.htmlへ書き、構文確認後rename。
- observeStepと分割しないlaw.stepAgentsを720歩比較し、trail・全粒の位置と向き・次の乱数まで完全一致。
- 1280×900／375×812のスタブで章端点・途中・章間遷移158通り。描画引数NaN/Infinityなし。小図も同じ記録を使用。これは実レイアウトの目視検証ではない。
- FADE/MORPH/SPECIESの中間時刻で全比較図の歩数一致。未計算要求はnull。往復後の全記録ハッシュ不変。停止後motion=0。WebAudioの実動作・聴感は未検証。
- 既存のlaw・アプリ・他LP等26ファイルの開始時SHA-256を保持。CLAUDE.mdは既存部分をバイト同一で保持して末尾だけ追記。一時HTMLは残さず、commitなし。

Claude側でブラウザ確認してほしい点：
1. file://とhttp://でBlob Workerが完走すること、実時間、Worker不可時の分割実行。
2. SNIFFの追従・端の回り込み・3点と棒・選んだ向き。HEALの端をまたぐ傷と「再接続時刻なし」表示。
3. 375pxのTRIO/6種/BLUEPRINT、カードと長いFORMULA RAILの重なり。1280幅でも全章の実レイアウト。
4. 往復・REWIND・タッチ・resize・reduced-motion・?ch=&u=で同じ記録へ戻ること。
5. 最初のクリックでBOW、OFF/Sキー/音量、ONでも停止後無音、餌の増減の鈴、ざわめきと低音の聴感。

作業上の例外：最終の保護ファイル照合で、一覧に含まれた日本語ファイル名をASCII化し忘れ、PowerShell経由のパスが「?」になって読み取りに失敗した。書き込みは発生していない。照合コード全体をUnicodeエスケープへ変換して再実行し、既存26ファイル不変とCLAUDE.mdの元の38,299 bytes不変を確認した。HTML／本文の書き込みは全てNodeのfs.writeFileSyncによるUTF-8。

#### Claude のブラウザ検証と手直し（11-04）
- 法則は Claude が先に `03_slime_network.html` の SIM ブロック＋SPECIES を `_law/ee03_slime.js` へ**そのまま**切り出した（アプリも読む・ブラウザでエラーなし）。足したのは `makeRng(seed)` と `cover(sim, th)`（アプリの coverNow と同じ数え方）。
- 実装は Codex astra high（9.3 万トークン）。そのあと Claude がブラウザで見て、**256×160 では網の目が画面に 3 つほどしか入らずアプリの細かい網に見えない** → Codex sol に直させようとしたら使用上限（14:54 まで）で何も書かずに止まった → Claude が直した：
  - 世界を **400×250・15,000 粒**に（`GW/GH/GA` 定数。Worker の中にも渡す）。記録は net store 4（15 コマ/秒）・food store 12（5 コマ/秒）・heal store 2（30 コマ/秒）・比較は 200×125。**計 91.0 MB・内蔵ブラウザの Worker 3 本で 6.2 秒**。HEAL の傷の線は 73 セル（256 幅の 48 セルを比例で伸ばした・3 セルおきの 25 個）。
  - SNIFF の拡大で 3×3 のタイルの継ぎ目に黒い四角が出ていた → 一度 3×3 に並べた作業用 canvas（smoothing なし）に描いてから 1 回だけ拡大。
- **HEAL は世界を広げたら記録が変わった**：餌 A（73,96）と B（235,43）の間を切ると**つながりが切れ**、0.27 秒で結び直し、0.57 秒まで切れたりつながったりして落ち着く。4.00〜5.87 秒にも網の組み替えで一度ほどけ、5.90 秒にまた結ぶ。本文をこの記録に書き換えた（256×160 の時の「切っても別の道でつながっていた」は消した。上の Node 実測の節は 256×160 の値なので注意）。
- 400×250 の cover（ブラウザの記録）：NETWORK 23.1%（0.93 s・最大）→ 15.2%（5 s）→ 13.5%（10 s）。FADE 10 s：decay .01＝48.6%／.10＝13.5%／.30＝5.6%。FOOD：13.7%（10 s・餌 2）→ 10.2%（22 s・餌 6）→ 9.4%（30 s）→ 9.2%（58 s）＝餌が増えるほど網は細くなる（餌どうしを結ぶ太い道だけが残る）。SPECIES 10 s：NETWORK 13.5／VEINS 25.5／LABYRINTH 14.7／HONEYCOMB 27.9／CELLS 20.3／BEADS 11.0 %。MORPH 10 s：LABYRINTH 9.5／HONEYCOMB 16.7／CELLS 14.4 %。
- 1280×800 と 375×812 で全章を目視。横スクロールなし。音の聴感は未確認。
