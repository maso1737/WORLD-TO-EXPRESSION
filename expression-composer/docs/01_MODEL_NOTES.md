# 01 / MODEL & DATA

## 原典との差

参照：`Emergence Engine/04_flock.html` の `makeFlock / buildGrid / steer / stepFlock / polarization`。三つの局所力を同期計算し、近傍をバケットで探す考え方を踏襲。巨大 HTML や UI はコピーせず独立実装した。同一モデル・同一係数・同一結果とは称さない。

| 項目 | 原典 | EC v0.1 |
|---|---|---|
| 世界 | 初期ウィンドウ寸法のpxトーラス | 正規化 `[0,1)²`、表示サイズと無関係 |
| 粒子 | 100〜4000 UI、画面面積で初期数を調整 | 600固定。読込は300〜800、リサイズで増減しない |
| 数値 | Float32位置・速度 | JS Number / Float64、安定 ID 0…N−1 |
| 近傍 | 可変 view / personal / FOV | view=0.12、personal=0.023、FOV=270° |
| 速度 | 可変px/update | 最大0.0035、最小は45%、最大steer力は速度の6% |
| ノイズ | 非ゼロ時PRNG消費、角度回転 | 常に ID ごと1サンプル消費、角度±π×noise |
| 外力 | hawk / lure、音入力・自動演出 | 外力・音・自動パラメータ演出なし |
| 観測 | Φ、mill、群数、近傍数 | Φ のみ。GAS / LIFE 等の閾値判定なし |

## 更新

`sim.js:createSim` は uint32 seed の Mulberry32。各 ID の x/y/初期角度を一様乱数で決める。手置きの絵や見栄えに合わせた別点群は使わない。

`stepSim` は8×8空間バケットと隣接9セル。トーラス最短差分、270°視野の中の個体から、逆距離の分離、速度和の整列、相対位置和の結合を求める。各方向を最大速度へ正規化し現速度を引いた Reynolds steering を上限で切る。重みを合成し、角度ノイズを回し、速度を範囲に制限。全員の次速度を計算してから位置を一斉更新する。境界はトーラス。時間は1 step = 1/60秒。

`main.js:frame` は rAF と固定更新を分離。1フレームの経過時間を100ms、更新を5回で上限とし、残りを捨てる。visibilitychange で時間蓄積を消去。低速端末では世界の時間が遅れるが A/B は常に同じ歩数。停止／編集では描画要求がなくなると rAF を止める。

| Rule preset | separate | align | cohere | noise | alignOn |
|---|---:|---:|---:|---:|---|
| COHERE | 1.40 | 1.50 | 0.65 | 0.03 | true |
| DRIFT | 1.20 | 2.60 | 0.12 | 0.02 | true |
| FRACTURE | 2.40 | 0.45 | 0.30 | 0.30 | true |

## 比較

`compare.js:createComparison` は同じ seed/count/rules から2世界を step 0 で作る。差は alignOn の true / false だけ。PRNG消費回数も等しい。比較開始前の操作履歴は引き継がず、現在のルールから新しい実験を始める。比較中の係数変更は両側に適用し、ON/OFF トグルは固定する。Aの係数align=0なら両側は完全一致する。

`Φ = |Σ(vᵢ / |vᵢ|)| / N`。表示された STEP の瞬間値。速度の大きさを重みにしない。回転する群れは方向が相殺され低くなり得るため、秩序全般や生命の指標とは呼ばない。黄金比の小文字φとは無関係。

## 不変素材と構図

`snapshot.js:takeSnapshot` は全粒子を複製して seed/step/rules/rng/side/count/hash とともに再帰的 Object.freeze。`hashParticles` は ID(uint32)と x/y/vx/vy(float64) のlittle-endianバイト列を FNV-1a 32bit で積算。暗号署名ではなく同一性検査用。UI/API に内部参照を返さず、JSONへはコピーする。

`compositionGeometry` はトーラスの空き帯で unwrap し、同じ粒子に共通の回転・拡大・並進を適用。CURRENT は群れの平均進行方向を水平へ回す（Claude レビュー修正を維持）。全粒子と最大TRACEの外接矩形を `FRAMES` に収め、KEEP／TRACE／FOCUSでフレームを動かさない。SPACE は全体縮尺。KEEP は昇順IDの先頭 floor(N×keep) を残し、割合を増やすと集合が包含される。FOCUS は紙面正規化座標からの距離に応じ半径・濃度を変える。SIGNAL の黄色は、残った粒子のうち指定位置に最も近い実在 ID 一点。TRACE は実速度を同じ回転・縮尺で写した過去方向の短い線。軌跡履歴を装わない。

最大TRACEと点半径の分も安全領域に予約し、TRACE操作では点の位置を動かさない。プレビュー・例・PNGは `renderComposition(state, canvas)` を共用し、出力寸法から再レイアウトする。

## JSON / 再現範囲

schemaVersion=1、model=ec-boids-1。粒子を含む snapshot、preset、edit（title/sub含む）を保存。全粒子に id/x/y/vx/vy があり、seed/step/rules/rng はsnapshot内。ルール変更履歴がなくても作品を復元できる。凍結後のライブ世界の別設定は保存対象にしない。読込後は採取世界から停止状態で再開する。

2 MiB（UTF-8実バイト）上限、深さ16、値ノード20000、粒子300〜800、有限数・座標・速度・ID順・必須キー・hash・schema検証。NaN/Infinityは stringify 前にも拒否する。未知キーは採用しない。文字は制御文字を空白化、title32/sub80コードポイントに切詰め、DOMはtextContent、描画はfillText。検証は原子的で、不正な読込では現作品を変えず理由をUI表示。

同一JSエンジン内は完全一致で検証した。Node と Chrome の600step計算には三角関数などの浮動小数差によるhash差を実測したため、エンジンを跨ぐseed再演算の一致は保証しない。JSONの粒子を直接復元すればその差を持ち込まない。UIに採取時ルールを含む全履歴は表示しないがJSONに採取時値を保持する。

## v0.2 / 表示と物理の分離

- `index.html` は sim → compare → composition → snapshot → render → export → main の classic defer script。各ファイルは strict IIFE に閉じ、`window.EC` に公開関数だけを登録。import / fetch / Worker なし。PNG の Blob URL と JSON File.text は file:// でも利用できる。
- `main.js:cameraFor / advance` は simulation ごとのカメラを WeakMap に保持。`render.js:followCamera` は x/y 各軸の円周平均へ最短周期差分の7.5%を1物理stepごとに追従する。円周平均ベクトルの長さ/Nが0.015以下ならその軸を保持し、散らばった世界での不定な重心を追い回さない。初期カメラは平均位置へ置く。停止中はカメラも動かない。
- `worldBox / worldPoints / renderWorld` はパネル全体をクリップし、`min(panel幅, panel高さ) × zoom` を1世界の表示幅にする。各点は実座標の整数周期コピー。半径は世界幅の0.002、尾は `(vx,vy) × 表示幅 × 3`。装飾点・別乱数・粒子の再配置なし。
- `main.js:take` は採取時のタイル位置・実速度尾・半径を表示用sourceとして保持。FREEZEでは同じIDのコピーを同じ紙面上の点へ集め、余分なコピーを徐々に消す。画面外のIDも最寄りの周期位置から入る。source/fromはsnapshotやJSONに保存しない。紙は採取パネルから育ち、黒の移動と終盤の焼き付けを維持。
- `getState().view` は単独世界の zoom/camX/camY、比較中は追加の A/B を返す。`setZoom` は1〜3の有限数のみ受け付ける。viewは物理・PRNG・snapshot・構図・JSONに含めず、600粒子固定を継続。
- `composition.js:particleDensity` は採取座標のトーラス距離0.045以内の近傍数を使う。最大数に対する平方根で半径・濃度を変え、immutable snapshotごとにWeakMapキャッシュ。半径上限0.0065×紙面幅を全構図で予約するため、強調を変えても点は移動しない。

工程は① RULE（SEED入口と調整）、② EMERGENCE（同じ世界の観察）、③ PERCEPTION（COMPARE）、④ EDIT（FREEZEを含む）、⑤ EXPRESSION（OUTPUT）。①②はAPI上どちらもphase=RULE。③はphase=COMPARE、⑤はphase=OUTPUTを維持し、既存フックの意味を変えない。

## v0.3 / 共通視点と派生組版

main.jsのsharedCameraはA/B全粒子の円周平均から共通の窓を決め、LOCKではviewForが同じ値を返す。FOLLOWは既存カメラ。物理規則・PRNG・snapshot・JSONは変更しない。

composition.jsのLAYOUTSは各3案、posterLayoutは900×1200の固定比率で幾何を算出し、可視点と実速度線の標本密度・外接矩形から決定する。SIGNALは実focusの半径と文字領域の交差を禁止。SILENCEは外接縦横比も静かな不均衡の選択に使う。寸法依存の丸めやフォント計測は案選択に入らない。compositionGeometryの点座標計算とFRAMESはv0.2のまま。getState().layoutは複製された診断値でJSONの必須キーではない。

FREEZEは0–15/15–70/70–88/88–100%の4区間。転写率と印刷率を分離し、選択による非表示はPRINTで行う。描画先の全バッファを消去し、小数CSS寸法の端でアルファを重畳しない。詳細と互換性は[05](05_V03_REVIEW.md)。
