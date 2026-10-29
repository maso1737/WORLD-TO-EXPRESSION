# 03 / QA REPORT

2026-10-26 / ORDER 01 / PHASE 0〜3。実行日時は各JSONの date。静的確認、実ブラウザの自動入力、画像の目視確認、人間による実機評価を分けて記す。

## 最終実測

- Headless Chrome 155.0.8059.79、Windows、--disable-gpu、DPR 1。ローカルHTTPとChromeを同一Nodeプロセスから起動。合成入力。
- ブラウザ **PASS 55 / FAIL 0 / アプリのJS・HTTP・外部通信エラー 0**。[test-results.json](../verification/test-results.json) / [再実行スクリプト](../verification/verify-browser.cjs)。
- Node v24.14.1：モデル **PASS 4 / FAIL 0**。[node-results.json](../verification/node-results.json)。
- アプリJS 7ファイルを各々 node --check。PASS。全新規テキストの UTF-8 / LF / BOMなし / 構文 / ローカル参照は [static-results.json](../verification/static-results.json) を正とする。

| 対象 | 結果 | 理由・証拠 |
|---|---|---|
| ローカルHTTPで起動・外部依存なし | PASS | appの例外/404/外部要求0、static server、test-results |
| RULE / SEED / 同期step | PASS | キーボードで係数変更、100step時点の粒子hash差を実測 |
| simDeterminism(42,600)×2 | PASS | Chrome: 5828ce7f / 5828ce7f、Node: 772e5451 / 772e5451 |
| 同条件A/B | PASS | 初期粒子hash一致、stepA=stepB=600。以下のΦを参照 |
| A/Bから実粒子を採取 | PASS | Bのside/rules/step、Aの全600IDを照合 |
| Freeze後の不変性 | PASS | align=0 / cohere=2 + 追加step後もhash・metadata不変、各階層Object.freeze |
| KEEP / SPACE / TRACE | PASS | ID集合の包含、SPACE全域の単調縮尺、TRACEが速度方向で点の位置を変えない |
| FOCUS / TYPE | PASS | pointer座標・矢印入力、合成touch。32/80文字制限、HTMLを実行しない |
| 3構図と出力 | PASS | 同一snapshot hash、異なる画像hash、3枚とも1800×2400 |
| PNG / JSON保存・読込 | PASS | UIで実ファイル保存、file inputで復元、snapshot/edit/title一致。同じブラウザのPNGも完全一致 |
| 異常JSON | PASS | 構文破損・2MiB超文字列/ファイル・NaN・schema違い・範囲外・不足キー・hash不一致・拡張子違いを拒否。UIに理由、旧作品を保持 |
| 未知キー | PASS | 読込後に捨てられることを確認 |
| 1440×900 / 1280×800 / 390×844 / 844×390 | PASS | EDIT/OUTPUT/RULE/COMPAREの横はみ出し、操作位置、工程チップと文字の収まり。短画面は縦スクロール |
| キーボード・タッチ相当 | PASS | nativeボタン/スライダー/Canvas矢印、390幅のhasTouch合成タップ |
| reduced-motion | PASS | 初期停止、100ms転換後のhash保持。機能は維持 |
| FREEZEの粒子継承 | PASS | 元ID600件一致。before/start/mid/after画像、同一ID位置補間コードの確認 |
| 実出力の見た目 | PASS | 3枚contact-sheet、CURRENT注記と見出しの分離、SILENCE余白、SIGNALの実粒子一点を画像で確認。長い和文/英字の文字境界も検査 |
| 停止中の描画 | PASS | EDIT idle 200msで追加描画0 |
| 固定刻み・復帰上限 | PASS（コード確認） | frameは1/60秒、100ms/5step上限、visibilitychangeで蓄積を消去。実タブ長時間復帰は未試験 |
| 既存LP・近接教材・04_flock起動 | PASS（smokeのみ） | 3ページHTTP200、例外0。外部フォント遮断。全機能回帰ではない |
| 既存ルート起動（外部通信遮断） | FAIL（既存依存） | HTTP200だがunpkgのReactが遮断され描画失敗。既存ファイルは変更せず、既存ページ専用記録に分離 |
| 全リンク・公開サイト・12原則リンク | NOT TESTED | 全件検証・更新は未実施。04_NEXT_ROADMAPでClaudeへ引継ぎ |
| 実機の手触り・Safari/iOS/Android | NOT TESTED | headless入力と人間の操作感は同等ではない |
| スクリーンリーダー・長時間運用・実GPU | NOT TESTED | ARIA/キーボードの実装と合成確認のみ。実GPUは無効 |

## Φ の観測（結果を選別しない）

Chrome / COHERE / seed42 / step600: **ON 0.994978 / OFF 0.046102**。3プリセット×seed42/7/2026の9条件は今回ON側が高かったが、FRACTUREは差が小さい。align係数0の対照条件は両側完全一致。これらは必然的優劣の保証ではない。全10条件は test-results.json の Unfiltered comparison sweep。

Nodeの同条件値はON 0.996714 / OFF 0.098883。エンジンを跨ぐseed再演算はhashが異なるため、**完全一致の保証は同一実行環境内**。作品再現は計算済み粒子を保存したJSONを使用する。

## 性能（約1秒ずつの合成測定）

| Mode | rAF samples | p95間隔ms | TaskDuration ms | ScriptDuration ms | JS heap MB |
|---|---:|---:|---:|---:|---:|
| PLAY | 61 | 16.70 | 107.17 | 44.48 | 11.55 |
| COMPARE | 61 | 16.80 | 161.62 | 87.65 | 19.70 |
| PAUSE | 61 | 16.70 | 8.45 | 0.95 | 19.77 |
| EXPORT | 61 | 16.70 | 50.75 | 5.31 | 10.93 |

PNG描画＋dataURL化は 32.50 ms。rAF間隔は実GPUの描画完了FPSではなく、CDP TaskDurationもプロセス全体のCPU使用率ではない。GPU使用率はNOT TESTED。CPU処理量はCOMPAREで増え、停止時に減ることを観測した。常時60fpsは宣言しない。

600粒子固定、同条件比較中に個数を減らさない。近傍は8×8バケット、描画DPR上限2。輸出CanvasのRGBAだけで約17.3MB、dataURLとCanvasネイティブ領域はJS heap値に全て含まれない。EXPORT時だけ別Canvasを作り、プレビューはキャッシュする。適応的粒子数変更は採用しない。

## 確認画像・経過

screenshotsに33枚。SEED / COMPARE / FREEZE前中後 / 3構図 / 指定4サイズ / reduced-motion / JSONエラー / 既存ページsmoke。画像は最終検証で生成し、外部参考画像を成果物に混ぜていない。

- [同一素材3構図](../verification/contact-sheet.png)
- [PNG実出力](../verification/downloaded-artwork.png) / [再現JSON](../verification/reproduction.json)
- [Desktop](../verification/screenshots/1440x900-signal.png) / [Mobile](../verification/screenshots/390x844-edit.png) / [Short landscape](../verification/screenshots/844x390-seed.png)

制作中の画像確認でCURRENTの注記接近、SPACEの変化しない区間、モバイルstrip上端、短横画面チップ幅を修正した。初回テストはJSONのキー順を文字列比較して失敗し、構造値比較へ訂正。mobile rangeも開閉状態と上限値に依存した入力手順を訂正した。最終結果は修正後ソースでの再実行値であり、失敗をPASSへ書き換えていない。

既存資産・保護パスへの編集なし。gitコマンド、commit、公開なし。検証用browser-tempは終了時に削除。制作/検証ソースと証拠だけを許可範囲内に残す。

## Claude 受け入れ検査（2026-10-26）

Codex の報告だけでは承認せず、`__EC` で数値を叩き、実 UI のコントロールを最小⇔最大で動かして確かめた（証拠は [claude-review/](../verification/claude-review/)）。

| 項目 | 結果 | 証拠 |
|---|---|---|
| 決定性 `simDeterminism(42,600)` ×2 | PASS（c0ca4a98 一致・seed 43 は別値） | 内蔵ブラウザ |
| A/B 同条件 | PASS（seed 1/7/42/99/2026 で stepA=stepB、Φ ON 0.996〜0.997 / OFF 0.03〜0.08） | 同上 |
| 採取後にルール変更 → snapshot 不変 | PASS | 同上 |
| 3 構図が同一 hash | PASS | sheet_*.png |
| JSON 往復（別 seed で採取し直した後に読込 → 元の hash・title に復帰） | PASS | paramcheck.json |
| 壊れた JSON / 2MiB 超 / NaN / 範囲外 / 粒子数不一致 / 未知キー | PASS（理由を UI に表示・未知キーは無視） | 同上 |
| 全コントロールの配線 | PASS（動作チェック表は下） | 同上 |
| 回帰：Codex の verify-browser.cjs | 55/55 PASS（構図の枠の判定を新しい FRAMES に合わせて更新） | test-results.json |
| 実機の手触り・iOS/Safari・GPU 負荷 | NOT TESTED | — |

### Claude による手直し（レビューで見つけたもの）

1. **ポスターの群れが小さすぎた**（世界の正方形全体を狭い帯に押し込んでいた）→ `composition.js compositionGeometry` を、粒子の実際の外接矩形に合わせる方式へ。トーラスの継ぎ目は「一番広い空き帯」へ平行移動（各軸 mod 1 の並進のみ）。CURRENT は群れ自身の平均進行方向を左→右へ回す（データ由来の回転）。KEEP / TRACE / FOCUS では枠が動かない（全粒子と最長 TRACE で枠を決める）。プリセットごとの紙面の枠 `FRAMES` を公開。
2. **FREEZE の中間で紙と点が同じ灰色になり点が消えた**／紙が左からワイプで出ていた → `render.js renderFreeze`：紙が採取した世界の正方形から育ち、黒いまま移動 → 最後の 22% で紙と点が同時に反転（焼き付け）。
3. 工程チップ：通過済みの段に印（`.process li.done`）。

## ORDER 02 / v0.2 Codex 検証（2026-10-27）

以下はv0.2の再実行値。上記のv0.1／Claude検査記録は履歴として保持する。

`node verification/verify-browser.cjs`：**76 PASS / 0 FAIL / 0 errors**。Chrome 155.0.8059.79 headless、DPR=1、`--disable-gpu`、セキュリティ制限の緩和なし。`verify-model.mjs`：4/4 PASS。全アプリJSの`node --check`成功。UTF-8 / LF / BOMなしは`verify-static.cjs`で確認。

| 合格条件 | 実測・証拠 |
|---|---|
| file:// 起動・全制作経路 | BEGIN→COMPARE→take('A')→3 preset→1800×2400 PNG→JSON→loadJSON PASS。コンソール／page／読込エラー0 |
| file:// 実保存・読込 | UIのPNG／JSONを実ダウンロードし、ファイル入力から再読込。`file-download.png` / `file-download.json` |
| 決定性 | Chrome `simDeterminism(42,600)` ×2 = `5828ce7f`。Node内の×2 = `772e5451`。エンジン間一致は従来どおり保証しない |
| 比較 | stepA=stepB=600。複数seed／presetの既存sweepも全件同期 |
| snapshot不変 | 凍結後のrule／step／ZOOM変更で同一hash・同一meta。3構図は同一hash、PNG画素は別。JSON復元後PNG完全一致 |
| ZOOM | 1→3で歩数・snapshot・カメラ不変、再計算hashも一致。A/B共通ズーム、別々のカメラを確認 |
| FREEZE | ZOOM=1のCOMPAREで668描画元（600実ID＋68周期コピー）。元の実座標＋整数周期と全件一致。実速度尾も一致。開始時の選択パネル内部画素差0（紙の1px枠のみ除外） |
| 工程 | 未採取④⑤disabled＋理由、採取後enabled。③でCOMPARE、④EDIT、⑤OUTPUT。①②の番号対応、比較案内の8秒／ALIGN起動／再表示なし、直接採取EDITの導線を検証 |
| 静止 | EDITと停止中のZOOM操作後、描画回数増分0 |
| 構図 | seed42・既定ルール・step600・Aで群れの幅／紙幅：SILENCE 24.01%、CURRENT 84.62%、SIGNAL 71.67%。全seedでの幅保証はしない |

### 画面サイズとステージ面積

`stage.width × stage.height ÷ viewport`。RULE / COMPARE / EDIT / OUTPUTの各4画面で同値。横overflowなし、全ボタン横幅内、現在地チップは常に1つ。指定16枚を `verification/screenshots/` へ上書きした。撮影はfullPageのため操作部まで含む。縦スクロールは許容する。

| Viewport | Stage px | 面積比 |
|---|---:|---:|
| 1440×900 | 1056×720 | 58.67% |
| 1280×800 | 922×640 | 57.63% |
| 390×844 | 358×497.953125 | 54.16% |
| 844×390 | 812×312 | 76.97% |

画像を開き、デスクトップの粒子拡大、COMPARE分割、モバイル縦／横の導線と構図、3構図contact-sheetを目視確認した。SEEDも全面タイル表示。PNGは実粒子から再描画し、参照画像の流用なし。

### テストの変更点

- `verify-browser.cjs` の動的importを `window.EC.*` 参照へ移行。従来55項目の合格条件を維持（FREEZEのidsは従来どおり600個の主コピーID）。コンソールエラー監視、ステージ面積記録、`verify-v02.cjs` 呼出しを追加。
- `verify-v02.cjs` はfile://、タイルFREEZEの座標と画素、ZOOM非干渉、チップ／案内、ポスター幅の21項目を追加。既存テストを都合よく緩めていない。
- `verify-model.mjs` はclassic IIFEをNode VMで読み、同じ4項目を維持。
- `verification/claude-review/**` は変更も実行もしていない。既存`__EC`と指定DOM IDの改名なし。レビュー側のimportはClaudeで移行する必要がある。

初回は案内の再表示とSIGNAL幅65.13%の2件がFAIL。工程遷移時の案内非表示とSIGNAL枠拡張で実装修正し、全スイートを再実行して76/76 PASSになった。

### 性能・残る範囲

600粒子固定。約1秒のheadless測定：PLAY / COMPARE / PAUSE / EXPORTのrAF間隔p95は16.7 / 16.7 / 16.7 / 16.8ms。CDP TaskDurationは154.29 / 228.04 / 19.57 / 78.01ms。PNG生成39.2ms。rAFサンプルはテスト側の観測ループであり、PAUSE中にアプリが再描画していることを意味しない。実GPUのFPS／使用率、実機の手触り、iOS/Safariは未検証。

簡略化：尾は3stepの速度ベクトルで履歴ではない。カメラは物理step時だけ追従し、低い円周平均では軸を保持する。細長い群れの縦横比は維持し、紙幅を満たすために歪めない。

README / docs01〜04更新。gitコマンド未使用。保護されたimages・masterplan・_Archive・.lnk・claude-reviewと範囲外ファイルを編集していない。検証用browser-tempはスクリプト終了時に削除済み。

## Claude 受け入れ検査 v0.2（2026-10-27）

ORDER_02（ダイナミックに・file:// で開く・PERCEPTION への導線）を **file:// で**検査した（証拠 [claude-review/v02/](../verification/claude-review/v02/)、スクリプト `claude-review/paramcheck.cjs` `v02check.cjs`）。

| 項目 | 結果 |
|---|---|
| ダブルクリック（file://）で起動・PNG/JSON の保存と読込 | PASS（コンソールエラー 0） |
| ルール 4 本・ALIGN・プリセット 3・SEED・PLAY/STEP/RESET | PASS（測定値は v0.1 と完全一致＝シミュレーションは不変） |
| ZOOM 1⇔3 | PASS（表示だけ変わり `simDeterminism` 5828ce7f は不変） |
| 工程チップ | PASS（未採取で ④⑤ disabled＋理由、③ → COMPARE、採取後に ④⑤ へ移動可、通過した段に印） |
| COMPARE への 1 行（ALIGN を触った後／8 秒後、一度だけ） | PASS |
| EDIT の「比べてから採ることもできる（③）」 | PASS |
| KEEP / FOCUS / SPACE / TRACE / TYPE / 3 構図 | PASS（同一 hash のまま描画が変わる） |
| Codex の verify-browser.cjs | 76/76 PASS |
| 実機の手触り・iOS/Safari・GPU 負荷 | NOT TESTED |

メモ：`codex exec -o` は最後のメッセージで報告ファイルを上書きするため、REPORT_02.md は要約だけ残った（詳細は docs 01〜04 に反映済み）。次の発注では詳細報告を別ファイル名で書かせる。

## ORDER 03b / v0.3 継続検証

この文書のv0.1/v0.2結果は履歴として保持する。v0.3の全結果・FAIL経緯・画像・未検証事項は[05_V03_REVIEW.md](05_V03_REVIEW.md)、新規証拠はverification/v03/。旧回帰の出力先はEC_VERIFY_OUTでverification/v03/regressionへ分離した。既存verificationの結果、claude-review、baselineは上書きしない。

mobile HOLDの356成分差は小数高さの境界アルファ蓄積を修正。FREEZEの厳密画素差0を維持し、汚れたendpoint参照キャンバスの初期化を訂正した。既存の個別カメラ回帰はFOLLOWを明示して検査する。初回FAILを消さず05に経緯を記録する。

5人の初回観察はユーザー実施のためNOT TESTED。実機/Safari/GPUも未検証。

## Claude 受け入れ v0.3（2026-10-27）

発注：ORDER_03（途中で Codex 使用量上限）→ ORDER_03b（残り）→ ORDER_03c（Claude の目視で出た組版の直し）。Codex 側の詳細は `docs/05_V03_REVIEW.md`。

- **Claude が見つけて直させたこと**：03b 時点のポスター一覧で、SIGNAL の大半と CURRENT B 群のタイトルが群れの真上に乗っていた。原因は組版案の文字矩形と群れの枠（FRAMES）が最初から重なる設計。03c で各組版案が「文字を避けた残りの紙面」を群れの枠として持つ形に（点は個別に動かさず、枠＝カメラだけ）。54 枚で文字への点の衝突 0、CURRENT/SIGNAL の群れは紙面の 55% 以上。
- `node verification/v03/verify-all.cjs` を Claude が再実行：全 PASS（03b 時点・03c 後とも）。
- `verification/claude-review/paramcheck.cjs` を file:// で再実行（結果 `claude-review/v03/`）：ルール 4 本・ALIGN・プリセット 3・seed・再生/STEP/RESET・COMPARE・TAKE B・編集 4 本・焦点クリック/矢印・TYPE・編集プリセット 3・PNG/JSON 書き出し・読み込み・壊れた JSON のメッセージ、すべて最小⇔最大で変化。測定値は v0.2 と一致（Φ ON .995 / OFF .073、takeB ecd77ad0）、コンソールエラー 0。
- LOCK の step 0 で A/B 画素差 0（3 画面幅）。FREEZE は desktop/mobile とも開始・HOLD・終端の画素一致。
- 未確認：実機の手触り、iPad Safari、5 人の初回観察（手順は docs/05、ユーザーが実施）。
