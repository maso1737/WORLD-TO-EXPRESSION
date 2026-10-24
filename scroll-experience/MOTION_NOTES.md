# WORLD TO EXPRESSION — Motion Brushup

2026-10-21 制作開始 / 2026-10-22 最終確認（Asia/Tokyo）

MOTION_HANDOFF.md と REVIEW_BRUSHUP.md の6項目を受け、スクロールの短い追従と、同じ形が次の場面へ渡る接続を実装した。native scroll、数理モデル、鋭い反転、ACT06の長い静寂、完成ポスターを保っている。

## 対応内容

| レビュー項目 | 実装・判断 |
|---|---|
| 全ACT：入力追従 | 実位置 `targetY` と表示位置 `displayY` を分離。ページ全体の位置に `1-exp(-dt/.09)` を適用し、差が0.15 CSS px未満で正確に同期、RAF停止。章・Canvas・背景・操作表示を同じ状態から更新 |
| ACT01：反応拡散 | 実Gray–Scott状態を18→96へ増量。0〜4000の整数iterationを保存し、元の18状態も完全保持。PROOFは実際に選択したiterationを表示。濃度場の補間や画像のクロスフェードは行わない |
| ACT01：カオス収束 | 560列すべての120サンプルを保持。各列から4点への対応を固定し、全サンプルを同じラスターへ移動。開始直後の約80%の列消失を解消。移動用バッファを再利用し、大量のCanvas命令を避けた |
| ACT03：点→線→円弧→点 | 同じ96個のマークを25線分へ、さらに4円弧へ対応付け。円弧の断片をその位置で点へ縮め、共通運命・対称の配置へ渡す。見出しも共通のワイプで切り替える。GROUP→FOCUSの96点は完全維持 |
| ACT05：透視負荷 | GPU有効・DPR1/2で初回とwarmの計測を実施。約347msの停止は未再現。現条件では負荷集中を確認できなかったため、320三角形・透視モデル・字形・PROOFを維持。描画方式の変更は加えていない |
| ACT06：再構成 | .40〜.68の静寂と.68〜.704のBREAKを維持。.80〜.842で一点から円・細胞・点群・螺旋・罫線が形成され、.85までにタイポワイプが完了。最終ポスターとCAPTUREは元の構図と一致 |

HOLDは押した瞬間の表示位置を固定する。固定中もnative scrollは動き、PROOFは同じ構図へ適用される。解除後は現在の実位置へ追従する。章ナビ・初期復元は直接同期。resizeは実位置・表示位置・HOLDをそれぞれ論理位置で維持する。非表示中はRAF停止、復帰時は時間基準をリセットする。

タッチ入力は実際のpointer/touchイベントで判定し、OSの慣性へ直接追従する。画面幅でタッチを推測しない。reduced-motionは時間補間を無効にし、実進行とキーフレームを分離する。

## 合格条件と根拠

| 引継ぎ条件 | 確認結果 |
|---|---|
| 1 入力間フレーム・収束・停止 | 実Chromeで合成120px×8入力に104描画。実位置へ完全収束し、停止後の追加描画0 |
| 2 60/120Hzの時間整合 | 実engineをNode VM内の制御timestampで比較。同時刻の最大差 `1.14e-13 CSS px`。実120Hzディスプレイは未検証 |
| 3 逆行・同じ位置の再訪 | 4サイズ×7地点の28ケースでCanvas画像ハッシュ一致。方向転換のオーバーシュートなしはロジック検証 |
| 4 章境界・HOLD・各操作 | 12/360px毎フレームの合成前進・逆行で章名と表示章が一致。HOLD途中固定、PROOF、RELEASE、章ナビ、PageDown、リロード復元を実Chromeで確認。非表示復帰は制御イベントによるロジック検証 |
| 5 reduced-motion | ACT05 raw .20 / 表示 .10をresize後も保持。全7章の既存回帰検証も通過 |
| 6 反応拡散 | 96状態を4000stepまで再積分し全ビット一致、元の18状態とも一致。保存状態の間隔は約5.6倍密になった。各状態は離散的であり、連続濃度場ではない |
| 7 形の受け渡し | ACT01 .96、ACT03 .36/.55/.78/.82を4サイズで境界画像比較。前後の画面差分を確認し、96点→25線分→4円弧→96点の画像を保存 |
| 8 透視計測 | RTX 4070 SUPER / GPU有効 / DPR1/2の初回・warm・RAF間隔・long taskを分離して記録。約347msは未再現 |
| 9 既存検証・モバイル・保存 | 91回帰チェック＋分岐図8条件を維持。390×844、390×650、844×390を含む画像を確認。CAPTUREは同じbackendで変更前とバイト一致 |
| 10 実機の手触り | 実ホイール、実トラックパッド、iPhone/Android、Safari、実60/120Hzディスプレイは未検証。合成入力・タッチエミュレーションを実機評価とは扱わない |

今回追加した[ブラウザモーション検証60項目](verification/motion-20261021/browser-motion-report.json)は全件合格、104枚を撮影。[既存回帰検証91項目](verification/revision-report.json)も全件合格、78枚を撮影。[基本検証](verification/browser-report.json)は7章×5地点×4サイズの140枚、文書の横はみ出しなし、操作は画面内。[詳細検証](verification/detail-report.json)は26枚、原典12リンクがHTTP 200、file起動とタッチエミュレーションを確認。最終実行でJavaScript・HTTPエラーなし。

[engineの9条件](verification/motion-20261021/engine-report.json)、[分岐図8条件](verification/emergence-report.json)、[Gray–Scott再生成](verification/motion-20261021/reaction-report.json)、[静的検証](verification/static-report.json)は、ブラウザ画像・実機評価と別の証拠として保存した。

## 性能とデータ量

Windows / Chrome 155.0.8059.79。透視計測は `--enable-gpu`。CDPで NVIDIA GeForce RTX 4070 SUPER、2D Canvas・GPU compositing・rasterization有効を確認した。headless環境のため、物理ディスプレイ上のFPSを保証する測定ではない。

| 透視区間 | 初回JS描画 ms | warm JS p95 ms（2試行） | RAF間隔 p95 ms |
|---|---:|---:|---:|
| 1440×900 / DPR1 | 12.1 | 0.9 / 1.0 | 16.8 |
| 1440×900 / DPR2 | 12.7 | 1.0 / 0.8 | 16.8 |
| 390×844 / DPR1 | 9.8 | 0.9 / 1.3 | 16.8 |
| 390×844 / DPR2 | 9.8 | 0.9 / 0.8 | 16.8 |

初回直後のRAF間隔は16.6〜16.8ms、warm中のlong taskは0。変更前と現行の20画像は一致した。描画命令発行時間はGPU完了時間ではない。[変更前](verification/motion-20261021/perspective/baseline-report.json) / [現行](verification/motion-20261021/perspective/current-report.json)

1440×900 / DPR1の新しい区間計測では、反応拡散のrender p95 1.0ms、全列のカオス収束3.5ms、GROUP接続0.4ms。各区間のRAF p95は16.8msだった。これらは今回の短い試行の値で、全デバイスへの性能保証ではない。

`patterns.js` は31,529→152,219 bytes（LF換算）。Gray–Scottのpackedデータは110,592 bytes。復号した96×96 Canvasの保持を最大16枚に制限した。ローカルHTTPの新規contextで初回描画を約138ms／73ms、patterns読込を約8ms／5msで観測した。配信ネットワークの評価ではない。[ロード記録](verification/motion-20261021/load-report.json)

## 画像と保存結果

- [ACT01 デスクトップ](verification/motion-20261021/contact-1440x900-act1.jpg)
- [ACT03 デスクトップ](verification/motion-20261021/contact-1440x900-act3.jpg) / [モバイル](verification/motion-20261021/contact-390x844-act3.jpg)
- [ACT06 デスクトップ](verification/motion-20261021/contact-1440x900-act6.jpg) / [短いモバイル](verification/motion-20261021/contact-390x650-act6.jpg)
- [完成ポスター](verification/motion-20261021/WORLD-TO-EXPRESSION-poster.png)

GPU有効のCAPTUREは1800×2400 / 370,569 bytes。変更前レンダラーを同じbrowser/backendで描いたPNGとバイト一致。GPU無効の検証では旧納品PNGと同じ352,624 bytes、SHA-256 `920fed9682c4de06f9a1c55aebd977a91b115003194445a3fcf99c1b44843472`。backend間のラスタライズ差を、構図の変更と混同しない。

## 作業範囲・途中で検出した問題

意味のある作品コード変更は `scroll-engine.js`、`patterns.js`、`01-emergence.js`、`03-group.js`、`06-edit.js`。対象フォルダ内のテキストをLFへ統一し、検証ツールと資料を更新した。既存トップ・教材は変更していない。公開・コミット・pushなし。

編集前バックアップ: `../90_Log/backups/2026-10-21-motion-brushup/`。レビュー用ZIPにはソース、受領資料、検証結果、比較に必要な変更前3ソースと原典を含める。前版ZIPは保持する。

最初のローカル接続は `ERR_NETWORK_ACCESS_DENIED` で失敗し、許可された同一環境でHTTPとChromeを起動して解消。途中の自動承認レビューは利用上限で実行前に停止したが、継続後に再実行した。

追加検証で、円弧が点へ縮む直前にCanvasが極短strokeを省略する問題を発見。丸い端点を明示描画し、.82前後の消失を修正した。短い横画面では円弧径・線幅を使える高さへ合わせて注記と分離した。保存テストの最初のtimeoutはviewport変更後の待機を足して解消し、GPU有効/無効のPNG比較を同一backend比較へ訂正した。最終結果は修正後の再実行によるもの。

## 再検証

プロジェクトルートで実行する。ブラウザツールのChrome・PlaywrightパスはこのWindows環境向け。

```powershell
node scroll-experience/tools/verify-static.cjs
node scroll-experience/tools/verify-motion.cjs
node scroll-experience/tools/verify-emergence.cjs
node scroll-experience/tools/generate-patterns.cjs --verify
node scroll-experience/tools/serve-and-verify.cjs verify-motion-browser.cjs verify-browser.cjs verify-details.cjs verify-revisions.cjs verify-load.cjs
node scroll-experience/tools/verify-perspective.cjs baseline
node scroll-experience/tools/verify-perspective.cjs current
python scroll-experience/tools/contact-sheets.py
python scroll-experience/tools/motion-contact-sheets.py
python scroll-experience/tools/package-motion-review.py
```

未検証は実機の入力感、Safari/iOS/Android、実120Hz、長時間運用、スクリーンリーダーの実使用、人による錯視効果、配信ネットワーク上のロード。時間追従は調整可能な初期値90msであり、実機で最適化済みとは主張しない。
