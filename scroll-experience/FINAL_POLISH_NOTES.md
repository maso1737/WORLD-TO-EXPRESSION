# WORLD TO EXPRESSION — Final polish

2026-10-25 / Asia/Tokyo

> この仕上げの元になった修正要件 → [FINAL_REVIEW_REQUEST_20261025.md](FINAL_REVIEW_REQUEST_20261025.md)（すべて現行の index.html で対応済み）

終幕を「スクロールで編集を追体験し、既存ラボで原理を試す」出口として仕上げた。新しい編集機能・章・エフェクトは追加していない。大判コピー、静寂、完成ポスター、入力エンジンと数理モデルを維持した。

## 変更と根拠

| 対象 | 変更 | 確認 |
|---|---|---|
| ACT06補助文 | SUBTRACT「スクロールで取り去る。残る形に、意味が生まれる。」／RELEASE「何も足さずに、この余白を見る。」／BREAK・再構成「削った先に、次の世界をつくる。」／完成「次は、ラボでルールを変えてみる。」 | 5必須サイズで折返しと表示を確認。YOUR TURN、MAKE OF IT、最終英語は保持 |
| 終幕の出口 | `meta.finale`のときだけOPEN LAB ↗とCAPTUREを表示。既存`../index.html`へ接続 | 境界.849/.851、逆行、再到達、実クリックを確認。通常の原典リンクを保持 |
| DOM・フォーカス | 出口・HOLDの子要素を置換せず状態変化時に更新。skipは最初の章リンクへ`preventScroll`でフォーカス。フォーカス中のCAPTUREが消えるときは出口へ移す | 変更前skipはbodyに残った。修正後Tab→Enter、フォーカスリング、再描画時のノード維持を確認 |
| PNG | 完成ポスターのPNG保存とtitle/aria-labelに明記。JetBrains Monoのロードとfont readinessを待つ。処理中の重複クリックを防止し、失敗後は再試行可能 | 実ダウンロード・再表示・失敗注入と再試行。statusは「PNGのダウンロードを開始しました。」 |
| 操作領域 | 操作ラベル10px。縦画面は44pxの操作・均等割付の章セル。800px以下の縦画面は2行transport | 初回521px終幕の画面外リンクを解消。短横画面は38pxを保持して情報領域を確保 |
| Canvas予約 | 共通boxの縦画面予約を210pxへ。前フレームのcaption実測には依存しない | 順逆再訪一致。通常1440×900のCanvasは変更前と一致 |
| 分岐図の注記 | 縦画面のサンプル数を軸端ラベルの間へ。中間幅の式を見出し上へ。799px付近の縦画面で図が新コンソールに隠れない予約を適用 | 599/601/768pxで式とCHAOSの重なり、799pxで下端隠れを再現したため限定修正。全560列×120サンプルは保持 |
| 通常デスクトップ | 44px化で増えた6pxをコンソール内の上paddingで調整 | 元の図の座標と下部注記の余白を保持。短横画面の分岐図レイアウトは変更なし |

作品ソースの編集は`index.html`、`styles/main.css`、`js/main.js`、`js/core.js`、`js/scenes/01-emergence.js`、`js/scenes/06-edit.js`。READMEを更新し、検証ツール4本と本記録を追加した。既存のテスト条件・アサーションは変更していない。

## 現行版の同定と比較

着手時は`scroll-experience/`全体がGit未追跡、追跡済みファイルの差分なし。ユーザーの現在のファイルを基準にした。編集前バックアップと未編集ファイルを10月22日のマニフェストに照合し、38件すべて一致した。詳細は[ソース照合](verification/final-polish-20261025/source-audit.json)。既存トップ・教材・AGENTS.md・過去ZIPは未変更。

編集前バックアップ: `../90_Log/backups/2026-10-25-final-polish/`。編集した既存7ファイルのみを退避した。入力指示書は[今回の記録フォルダ](verification/final-polish-20261025/incoming-review.md)へ保存した。

変更前後は同一Chrome **155.0.8059.79**、headless、`--disable-gpu`、DPR 1で描画。1440×900、768×1024、390×844、390×650、844×390と、519/521/599/601/799/801×900の変更関連場面を計88枚ずつ保存した。

- [88場面の比較ビュー](verification/final-polish-20261025/compare.html)：選択してBEFORE/AFTERを並べ、原寸画像を開ける。
- [通常デスクトップ終幕](verification/final-polish-20261025/compare-1440x900-finale.jpg)
- [短い縦画面終幕](verification/final-polish-20261025/compare-390x650-finale.jpg)
- [521pxの出口修正](verification/final-polish-20261025/compare-521x900-finale.jpg)
- [短横画面の分岐図](verification/final-polish-20261025/compare-844x390-bifurcation.jpg)

必須5サイズの7章代表構図をコンタクトシートで目視した。変更箇所は390×650終幕、521px終幕、768pxの等径PROOFと分岐図、799px分岐図、844×390分岐図などを個別表示した。全88枚の全細部を原寸で人が検査した、という意味ではない。

1440×900の代表14フレームは**Canvas本体が変更前と完全一致**。変更したフッターはこの比較から分離している。中間幅と縦画面の予約変更による位置・サイズ調整は比較画像で確認できる。完成ポスターPNGは画面比率に依存せず、変更前後でバイト一致した。

## 今回実行した検証

| 検証 | 結果 | 証拠 |
|---|---|---|
| 変更箇所・全章代表・UI境界 | 215項目合格、88画像。操作が画面内、10pxラベルと対象高さ、分岐図の文字境界・非重複、同一backend比較 | [after/report.json](verification/final-polish-20261025/after/report.json) |
| 追加操作・状態 | 99項目合格。Tab/Enter/Space/PageDown/Home/End、7章リンク、aria-current/pressed、skip、HOLD→PROOF→CAPTURE→RELEASE、逆行・再到達 | [controls-report.json](verification/final-polish-20261025/controls-report.json) |
| 既存finish回帰 | 88項目合格、45画像。短横分岐図・PROOF、GROUPの文字退出、幾何比較、reduced-motion回転 | [finish/browser-report.json](verification/final-polish-20261025/regression/finish/browser-report.json) |
| 既存revision回帰 | 91項目合格、78画像。GROUP→FOCUSの同じ96マーク、細胞境界、等長/等径、EDITの一点継承、再訪・reduced-motion | [revision-report.json](verification/final-polish-20261025/regression/revision-report.json) |
| 分岐の数理 | 8条件合格。120連続サンプル、周期2/4/3、旧間引き回帰の検出を維持 | [emergence-report.json](verification/final-polish-20261025/regression/emergence-report.json) |
| 静的・データ | JS構文、参照先、UTF-8/LF、Voronoi89領域、Gray–Scott96状態。errorsなし | [static-report.json](verification/final-polish-20261025/regression/static-report.json) |

通常・reduced-motionで390×844→390×650→844×390→768×1024→390×844を確認。raw進行の保持とreduced表示進行の分離を確認し、元位置へ再同期したCanvasが一致した。高さ変更はブラウザバー変動を想定したviewportエミュレーションであり、実機ブラウザバーの試験ではない。

ACT01細胞→反応拡散→分岐、ACT03 .53〜.64、ACT05整列付近、ACT06静寂→BREAK→再構成を、3サイズで順逆の離散位置へ移動しCanvas一致を確認した。時間的な気持ちよさを評価する試験ではない。native scrollのキーボード進行とHOLD中の実スクロール位置変更も自動入力で確認した。停止中350msの不要RAFなし。90ms追従、native scroll、タッチの直接追従、静寂の区間とBREAKの区間は未変更のため、入力エンジンの追加モーション試験は行っていない。

対象ブラウザ検証のJavaScript例外・確認対象HTTPエラーは0。原典リンクは追加試験で13場面から抽出し、重複を除いてHTTP確認した。OPEN LABは実際にクリックして既存トップへの遷移を確認した。

## PNGの実保存と再表示

[今回保存した完成ポスター](verification/final-polish-20261025/after/WORLD-TO-EXPRESSION-poster.png)は**1800×2400 / 352,624 bytes**。ブラウザのdownloadイベントからファイルへ保存し、別のブラウザページで開いて画像としてdecodeされたことを確認した。画像を目視し、大判文字、余白、エンブレム、上下罫線を確認した。画面UI・PROOFは含まない。

SHA-256: `920fed9682c4de06f9a1c55aebd977a91b115003194445a3fcf99c1b44843472`

変更前PNG、変更後PNG、HOLD中PROOF表示から保存したPNGが一致。フォント待機、フォント失敗、PNGエンコード失敗をテスト内で注入し、待機・再試行を確認した。アプリ内通知は端末への保存完了とは断定しない。

## 試行中に検出した問題

- 最初のsandbox内HTTP検証は`ERR_NETWORK_ACCESS_DENIED`。許可された実行環境でローカルサーバーとChromeを同時起動して成功した。
- 初回変更前の521px終幕で出口が画面外。変更前skipのフォーカスはbody。これらを修正した。
- 最初の比較はCanvas要素のスクリーンショットに固定DOMが重なっていたため、比較ハッシュをCanvas本体の`toDataURL()`へ修正した。初回記録は`initial-baseline/`に保持。`before/`は編集前バックアップを配信した同一版の再描画で、旧版画像を現行ソースと取り違えていない。
- 操作領域拡大の初回で分岐図注記の隠れを既存テストが検出。境界追加テストで式の重なりと799pxの下端隠れも検出し、修正した。最終結果は上表の合格記録。過去の検証画像・JSONを上書きせず、既存テストは実行時に出力先だけ今回フォルダへ変更した。

## 未確認・実機で見る場所

実ホイール・トラックパッド、iPhone/Android/iPad/Safari、ノッチやsafe-area、実機ブラウザバー、物理60/120Hz、低性能端末、スクリーンリーダーの実使用、人による錯視の強さは未確認。今回のviewport・media・自動入力・headlessの合格を実機の手触りと同一視しない。safe-areaに関する再現根拠がないため、新しいpaddingは追加していない。

実機では次の3点を見る。

1. ACT01の細胞→反応拡散→分岐を低速で往復する。
2. ACT05の整列付近を低速で往復し、停止時の読み取りを確かめる。
3. ACT06の静寂から終幕へ進み、OPEN LAB・PNG保存・逆行を試す。

## 再実行と保存範囲

リポジトリルートから実行する。既存回帰の出力だけを日付付きフォルダへ分離するwrapperを使用する。

```powershell
node scroll-experience/tools/serve-and-verify.cjs verify-final-polish.cjs verify-final-regressions.cjs verify-final-controls.cjs
python scroll-experience/tools/build-final-polish-contact.py
```

`WTE_POLISH_BASELINE=1`は編集前バックアップを配信して変更前資料を再生成するためのオプション。通常の再実行では設定しない。回帰wrapperは既存テスト4本の出力パスだけをメモリ内で置き換え、元のファイル・アサーションは保持する。

新しいレビューZIPは作成していない。`verification/source-sha256.json`は10月22日ZIP用として保持し、READMEもその対象を明記した。変更・生成テキストはUTF-8/LF。検証サーバーは試験終了時に停止し、一時サーバー・ブラウザを残さない。生成画像・ツール・試行記録は意図した納品物として保持した。commit・push・公開なし。
