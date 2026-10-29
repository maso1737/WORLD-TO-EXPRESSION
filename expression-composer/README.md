# EXPRESSION COMPOSER / L7 v0.3

**FROM SEEING TO MAKING.** 発見した法則を、観客自身が使って表現する。

600 個の Boids の局所ルールを変え、ALIGN ON/OFF を同じ初期条件で比較し、実在した瞬間を一枚のポスターへ編集する作品です。`scroll-experience/` は鑑賞の入口、`Emergence Engine/` は生成の研究、本作は観客が素材を採り、編集し、持ち帰る制作の場です。

## 起動

**このフォルダーの `index.html` をダブルクリックして開いてください。** Chrome の `file://` で制作・PNG保存・JSON保存／読込まで動作します。フォルダー構成（`js/`・`styles.css`）は保ってください。ビルド・サーバー・npm・CDN・外部 API は不要です。

HTTP で開きたい場合のみ、WORLD TO EXPRESSION のルートで次を実行できます。

```powershell
node expression-composer/verification/serve.cjs
```

表示された localhost URL を開き、終了時は Ctrl+C。フォントはインストール済みのものかシステムの代替フォントを使います。

## 操作

1. **BEGIN** → SEPARATE / ALIGN / COHERE / NOISE。プリセットも実際のルール値を変えます。SEED は 0〜4294967295 の整数。NEW は新しい seed を選びます。
2. **COMPARE** → 同じ seed・同じ初期位置と速度・step 0 から A=ALIGN ON / B=OFF を同時に進めます。Φ は平均進行方向の一致度で、黄金比ではありません。ON が常に高くなる保証はありません。
3. **PAUSE / STEP +1** で瞬間を選び、**TAKE STATE / TAKE A / TAKE B**。その粒子が紙面へ移ります。元の ID・位置・速度・seed・step・rules は固定されます。
4. **EDIT** → KEEP は ID 昇順の先頭から残す割合、FOCUS は強調量、SPACE は余白、TRACE は実速度方向の線。紙面のクリック／タップで注目位置を指定します。
5. **SILENCE / CURRENT / SIGNAL** を比較。切替は KEEP / SPACE / TRACE / FOCUS 強度をプリセット値に戻します。注目位置と文字は保持。下の3枚は同じ snapshot の出発点で、選択中の一枚は現在の編集値です。
6. **FINISH → EXPORT PNG / SAVE STATE JSON**。PNG は UI を含まない1800×2400。JSON は全粒子と編集を含み、LOAD STATE JSON で同じ構図へ戻せます。

上の工程チップも押せます。① RULE は調整、② EMERGENCE は同じ世界の観察、③ PERCEPTION は COMPARE。④ EDIT／⑤ EXPRESSION は採取後に使えます。①②を切り替えても世界を初期化しません。③への入場は従来の COMPARE と同じく A/B を step 0 から開始します。ALIGN操作またはRULE滞在約8秒で比較への案内を一度だけ表示。直接 TAKE STATE した場合も EDIT 内の小さなリンクから比較できます。

**ZOOM（1〜3、初期1.8）** は表示だけを拡大します。正方形トーラスをステージ全面に繰り返し、円周平均の重心をカメラが追います。尾は実速度の3ステップ分。COMPARE は初期状態の LOCK で左右共通のカメラ・ズームを使います。FOLLOW で従来の個別追跡へ切り替えられます。REPLAY A/B FROM ZERO は比較を step 0 から再開します。ZOOM・カメラは物理計算や採取粒子、JSON、ポスターを変えません。

BACK TO RULES / RESET WORLD / NEW SEED は採取済み素材と編集値を保持します。RETURN TO EDIT で戻れます。次の TAKE だけが素材を置き換えます。RESET は現在の seed と rules で世界を step 0 に戻します。ページ再読み込み時の自動保存はありません。継続する作品は JSON で保存してください。

スマホはステージの下に CONTROLS を畳みます。タップして展開できます。Tab / Enter / Space でボタン、矢印キーでスライダーを操作できます。編集時はステージへ Tab で移り、矢印で注目位置を0.01ずつ（Shift併用で0.05）移動できます。世界のステージ上で Space は PLAY / PAUSE。reduced-motion は初期停止・FREEZE 100ms。PLAY は明示的に選べます。

## 再現と検証

`window.__EC` は ORDER 01 の全 hook を提供します。`step(n)` は描画と無関係に同期実行（0〜10000 step／呼び出し）。`simDeterminism` は既定ルール・600粒子で新規計算。`take` の戻り値は粒子 hash。`loadJSON` は失敗時に `{ok:false,error}` を返し、画面にも理由を表示します。JSON は schemaVersion 1、UTF-8 で2 MiB以下。未知キーは捨て、NaN・範囲外値・不正 ID・hash不一致を拒否します。

v0.2 は `__EC.setZoom(value)` と `getState().view = {zoom, camX, camY}` を追加。比較中は `view.A` / `view.B` に各カメラと共通zoomも返します。既存メソッド・DOM ID は改名していません。classic script を依存順に読み、純粋関数は `window.EC.sim / compare / composition / snapshot / render / exporter` から参照できます。

```js
__EC.pause(true);
__EC.setSeed(42);
__EC.compare(true);
__EC.step(600);
__EC.compareStats();
__EC.take('A');
__EC.setPreset('SIGNAL');
await __EC.exportPNG({ download: false });
```

```powershell
Get-ChildItem expression-composer/js/*.js | ForEach-Object { node --check $_.FullName }
node expression-composer/verification/verify-static.cjs
node expression-composer/verification/verify-browser.cjs
```

ブラウザ検証スクリプトは既存 Playwright と Chrome を使います。必要なら `EC_PLAYWRIGHT`（インストール済みモジュールへの絶対パス）/ `EC_CHROME` を設定。本作に依存物をインストールしません。

`verify-browser.cjs` は HTTP の既存回帰に加え、通常の file:// で実ダウンロードと読込を検証します。ブラウザのセキュリティ緩和フラグは不要です。4画面サイズの RULE / COMPARE / EDIT / OUTPUT は `verification/screenshots/`、数値とステージ面積比は `verification/test-results.json` に記録します。

- [監査](docs/00_AUDIT.md) / [モデルとデータ契約](docs/01_MODEL_NOTES.md) / [制作判断](docs/02_CREATIVE_DECISIONS.md)
- [QA・未検証](docs/03_QA_REPORT.md) / [引き継ぎ・更新文案](docs/04_NEXT_ROADMAP.md)
- [同一素材の3構図](verification/contact-sheet.png) / [再現 JSON](verification/reproduction.json) / [実測結果](verification/test-results.json)

浮動小数点の三角関数はブラウザや実行エンジン間で微差があり、長時間の Boids で増幅します。決定性は同一実行環境内の完全一致として検証。JSON は計算済みの粒子座標そのものを保存するため、seed再計算の差を避けて復元できます。システムフォントの違いで文字幅は変わり得ます。実機の手触り・Safari・GPU性能は未検証です。

## v0.3 / 因果・変換・組版

TAKE の1150msは HOLD 0–15% → TRANSFER 15–70% → STILL 70–88% → PRINT 88–100%。reduced-motionは100msです。600個の実IDを連続写像し、最後は静止します。

各構図に3つの組版案を用意し、実粒子の外接範囲と密度から選びます。SILENCEは余白と対向する文字、CURRENTは速度線と読みやすい見出し、SIGNALは黄色の実粒子と干渉しない文字領域。プレビューとPNGは同じ案です。旧JSONは粒子hash・編集値を保持し、文字配置はv0.3の方式になります。

主要CTAはステージ上にあります。プリセット直下の注意のとおり、切替は4つの調整値を初期値へ戻します。画面の読みやすさ・45〜90秒の導線は人間による観察を別途行います。

API追加：__EC.setViewMode('LOCK' | 'FOLLOW')、getState().view.mode、getState().layout。layoutは選択案id、正規化rect、bounds、実focus ID、候補の密度と評価値。未採取時はnull。作品JSONへカメラや診断情報を保存しません。

詳細・画像・検証結果・未達・5人観察の手順は [v0.3レビュー](docs/05_V03_REVIEW.md)。新しい検証は verification/v03/verify-causal.cjs / verify-freeze.cjs / verify-posters.cjs / verify-screens.cjs。旧回帰の出力は環境変数EC_VERIFY_OUTにverification/v03/regressionの絶対パスを指定して分離できます。新規依存のインストールは不要です。
