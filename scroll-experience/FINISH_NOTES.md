# WORLD TO EXPRESSION — Finish pass

2026-10-22 / Asia/Tokyo

GPTからの FEEDBACK_FOR_NEXT_PASS.md / REVIEW_MOTION.md に対応。作品コードの変更は `js/scenes/01-emergence.js` と `js/scenes/03-group.js` の2ファイル。入力追従90ms、96状態の反応拡散、全560列×120サンプル、GROUPの96マークの対応、ACT05、EDITと完成ポスターの実装を保持した。

## 修正

| 指摘 | 対応 |
|---|---|
| P2 / 短い横画面の分岐図欠け | ACT01の作画領域が260px未満のときだけ見出しを高さに合わせ、式・図・軸・サンプル注記を順に予約。最低100px固定を外し、全サンプルを可用高さに描く |
| P3 / GROUPの文字残り | 共通の左→右ワイプを維持し、文字だけ .53〜.60で交代。図形のbendは従来の .53〜.64のまま。フェード・再配置は追加していない |
| P3 / マニフェスト | `verification/source-sha256.json` を最新ソースへ更新。READMEにZIPの正規照合先を明記。旧版は日付付きフォルダと既存ZIPに保持 |
| 画像検証で発見した通常デスクトップのPROOF | 旧版にも式とCHAOSの重なり、サンプル注記のフッター隠れがあった。式を見出し上、サンプル注記を軸端ラベル間に移した。図・見出し・軸の位置は維持 |

844×390では、ヘッダー下端78px／フッター上端266pxに対し、見出しの実字形上端90.72px、図の上端146.96px／ラスター下端218.96px、サンプル注記ベースライン258px。旧版の図下端328px・注記278pxの隠れを解消した。PROOFの表示有無で図の寸法は変わらない。

## 今回の検証

| 確認 | 結果・証拠 |
|---|---|
| ブラウザの対象確認 | [88項目すべて合格・45画像](verification/finish-20261022/browser-report.json)。Chrome 155.0.8059.79、headless、`--enable-gpu`で起動。今回GPU機種や有効状態の再測定・性能測定は行っていない |
| 必須の短画面 | 844×390のp=.84/.9594 × PROOF OFF/ON、reduced-motionの表示p=.86。文字の実字形境界と図の境界をDOMのヘッダー・フッターと照合。720×390も追加確認 |
| 通常画面の回帰 | 1440×900、390×844、390×650。PROOF OFFの分岐図は変更前とCanvas PNG完全一致。PROOF ONも文字を除いた図形が完全一致。PROOFは各文字の非重複・表示領域を別途確認 |
| GROUP | 5サイズ×.55/.58/.60/.64の20画像。文字を除く描画は変更前と完全一致、.60では旧見出しの描画なし。モバイルの途中構図を目視確認 |
| 再訪・回転 | 5サイズで別章から戻ったCanvas一致。reduced-motionで390×844→844×390へ変更してもraw≈.8 / 表示.86を維持 |
| 既存回帰 | [91項目すべて合格・78画像](verification/revision-report.json)。既存ツールのGPU無効headless Chrome。GROUP→FOCUSの接続、等長・等径、再訪、各章reduced-motion等を確認 |
| 分岐の数理 | [8条件合格](verification/finish-20261022/emergence-report.json)。120連続サンプルと周期2・4・3の枝を保持。これはNodeの数理・ラスター検証 |
| engine | [9条件合格](verification/finish-20261022/engine-report.json)。実engineと制御timestampによるNode VM検証。物理60/120Hzの評価ではない |
| 静的確認 | [構文・参照・LF・数理データ](verification/static-report.json)にエラーなし |

対象ブラウザ検証と既存回帰検証のJavaScript例外・確認対象HTTPエラーは0。最初のサンドボックス内実行は `ERR_NETWORK_ACCESS_DENIED`。許可された環境でローカルHTTPとChromeを同時起動し、再実行は成功した。

選択画像: [横画面PROOF](verification/finish-20261022/844x390-bifurcation-0.9594-proof.png) / [通常デスクトップPROOF](verification/finish-20261022/1440x900-bifurcation-0.9594-proof.png) / [縦画面PROOF](verification/finish-20261022/390x844-bifurcation-0.9594-proof.png) / [GROUP .60](verification/finish-20261022/390x844-group-0.6.png)。

## 検証の限界

実ホイール・実トラックパッドの90msの手触り、iPhone／Android／Safari、物理60/120Hzディスプレイ、低性能端末、長時間運用、スクリーンリーダー、配信ネットワーク、人による錯視評価は未検証。合成ナビゲーションとheadless Chromeを実機評価とは扱わない。完成ポスターのレンダラーは未変更で、CAPTUREの再検証は今回行っていない。以前の同一backend比較結果はMOTION_NOTES.mdの履歴を参照。

実機仕上げでは、ACT01の反応拡散〜分岐・ACT03の曲線化を低速で往復し、停止時の追従と文字の読み取りを確認する。実機で課題を確認した場合に限って90msを調整する。

## 引き継ぎ・再現

編集前バックアップ: `../90_Log/backups/2026-10-22-motion-finish/`。作業規約は `AGENTS.md` に保存。既存トップ・教材は未変更。公開・commit・pushなし。編集したテキストはUTF-8/LF。検証用のソースは `tools/` に残し、不要な一時ファイルは作っていない。

最新ZIPの照合先は **verification/source-sha256.json** のみ。制作ソースのキーは `scroll-experience/` 相対。梱包ツールはZIP内全ソースのハッシュとCRCを検証し、[package-report.json](verification/finish-20261022/package-report.json)をZIPの外に保存する。履歴フォルダのマニフェストは当時のソース専用。

```powershell
node scroll-experience/tools/verify-static.cjs
node scroll-experience/tools/verify-emergence.cjs
node scroll-experience/tools/serve-and-verify.cjs verify-finish.cjs verify-revisions.cjs
python scroll-experience/tools/package-finish-review.py
```

レビューに使った入力2文書も `verification/finish-20261022/incoming/` に保存した。
