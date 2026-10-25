# WORLD TO EXPRESSION — SCROLL EXPERIENCE

**FROM RULES TO WORLDS.**  
**SCROLL THROUGH THE ACT OF CREATION.**

点から始まり、生成・密度・群化・注意・解釈・編集を経て、一枚のグラフィックへ到達するスクロール作品。既存教材を参照した独立した入口です。

## 起動

リポジトリのルートで PowerShell を開きます。

```powershell
Set-Location 'C:\Users\so173\Documents\Codex\Project\WORLD TO EXPRESSION'
python -m http.server 4173 --bind 127.0.0.1
```

[http://127.0.0.1:4173/scroll-experience/](http://127.0.0.1:4173/scroll-experience/) を開いてください。サーバーは `Ctrl+C` で終了できます。

クラシック JavaScript と相対アセットで構成し、`index.html` のダブルクリックでも開けます。Chrome の `file:` 起動と、HTTP での起動を確認しました。

## 操作

- **SCROLL** — 通常のホイール、タッチ、キーボードで進行・逆行します。ホイールとキーボードには短い表示追従を加え、タッチはOSの慣性に直接追従します。
- **ACT NAVIGATION** — 各章へジャンプします。
- **PROOF** — 等長・等径や、変化しているパラメータの注釈を表示します。
- **HOLD** — 押した瞬間に見えている構図を固定します。文書のスクロールは維持され、解除すると現在の実位置へ短く追従します。
- **EXPLORE / OPEN LAB** — 各章では対応する既存教材、完成ポスターではラボのトップを開きます。
- **CAPTURE** — 完成ポスター（画面UIを含まない1800×2400）のPNGダウンロードを開始します。

OS / ブラウザの「視差効果を減らす」設定では、細かな連続変形を抑え、安定したキーフレームを表示する設計です。

## 構成と実装方針

新規の `scroll-experience/` に実装しています。既存のルート `index.html` と教材群は変更していません。主要描画は Canvas 2D、ナビゲーション・操作・アクセス可能な本文は HTML / CSS で構成しています。

7つのスクロール区間を共通の全画面ステージに接続し、各シーンに正規化した進行値 `0–1` を渡します。native scrollの実位置と表示位置を分け、ページ全体の表示位置を90msの時定数で追従させます。差が0.15 CSS px未満になれば実位置へ正確に同期し、RAFを停止します。章名・背景・Canvas・PROOF・フッターは同じ表示状態を使用します。

乱数のseed、固定サンプリング、実計算した96状態の反応拡散により、同一画面サイズ・同一表示進行値・同一操作状態では同じ構図を再現します。追従中は入力履歴によって表示位置が異なり得ますが、同じ実位置へ収束した後は同じ構図へ戻ります。章ナビと検証用の `WTE.engine.jump()` / `sync()` は直接同期します。reduced-motionでは時間補間を使わず、実進行と安定キーフレームを分離して保持します。

原典、各章の構図、遷移、科学的な扱いは [DESIGN_NOTES.md](DESIGN_NOTES.md) を参照してください。

最新の制作・検証記録: [FINAL_POLISH_NOTES.md](FINAL_POLISH_NOTES.md)（2026-10-25）。終幕コピーとOPEN LAB、操作領域、PNG保存・フォーカスを仕上げました。[変更前後の比較](verification/final-polish-20261025/compare.html) / [今回保存したPNG](verification/final-polish-20261025/after/WORLD-TO-EXPRESSION-poster.png)。前回の仕上げ記録は [FINISH_NOTES.md](FINISH_NOTES.md)（2026-10-22）です。

レビュー用: [10月22日仕上げ版 ZIP](verification/WORLD-TO-EXPRESSION-finish-review-20261022.zip)、[完成ポスター PNG](verification/motion-20261021/WORLD-TO-EXPRESSION-poster.png)。

**10月22日ZIPの照合には [verification/source-sha256.json](verification/source-sha256.json) を使用してください。** キーのパスは `scroll-experience/` 相対です。今回の10月25日ローカル完成版は新しいZIPを作成しておらず、このマニフェストは現行ソース全体の照合用ではありません。`verification/motion-20261021/source-sha256.json` は10月21日版の履歴です。

モーション改善の履歴: [MOTION_NOTES.md](MOTION_NOTES.md)、[10月21日ZIP](verification/WORLD-TO-EXPRESSION-motion-review-20261021.zip)。過去のZIPはローカルに保持し、新しいZIPには重複して内包しません。

前版の資料は [GPT_REVIEW.md](GPT_REVIEW.md)、[10月20日レビュー ZIP](verification/WORLD-TO-EXPRESSION-brushup-review.zip) に保存しています。以下は10月20日時点の記録です。現在のJSON・画像は10月21日の再検証で更新しています。

## ブラッシュアップ版 — 2026-10-20

10月16日のレビューを受けた修正を検証し、細胞→反応拡散の見出し切替と、233点→MANYの素材継承をさらに調整しました。静寂から最終エンブレムへ一点を引き継ぐ演出を含め、9項目の対応と検証範囲は [BRUSHUP_NOTES.md](BRUSHUP_NOTES.md) にまとめています。

| 確認 | 結果 |
|---|---|
| 全章の基本確認 | 7章×5位置×4サイズ、140枚。文書の横はみ出しなし、操作は画面内 |
| 修正点の回帰検証 | 91チェック合格、78枚。章境界・寸法・逆行再訪・reduced-motionリサイズを確認 |
| 分岐図 | 4サイズ×2経路で120サンプル、周期2・4・3の枝を保持 |
| 操作 | HOLD、PROOF、全章ナビ、リロード復元、PageDown、タッチエミュレーション |
| 保存・原典 | 1800×2400 PNGを保存。確認した12リンクがHTTP 200。file起動も確認 |
| 実行環境 | Windows / headless Chrome 155.0.8059.79 / GPU無効、実行時エラー0 |

[デスクトップ修正点一覧](verification/revision-contact-1440x900.jpg) / [モバイル修正点一覧](verification/revision-contact-390x844.jpg)

[基本記録](verification/browser-report.json) / [詳細記録](verification/detail-report.json) / [修正点の記録](verification/revision-report.json) / [分岐図](verification/emergence-report.json) / [静的検証](verification/static-report.json)

100%画像は次章境界の2 CSS px手前です。境界の幾何一致は別途厳密な終点・始点を描画して確認しています。iOS・Android・Safari実機、実機タッチ、GPUのFPS・メモリ、長時間運用、スクリーンリーダーの実使用、全速度域での連続スクロール評価は未検証です。

初版レビューZIPは保存し、更新版を別名で作成しました。既存トップ・教材は未変更。編集前バックアップと作業ログは `../90_Log/` に保存。公開・コミットは実施していません。
