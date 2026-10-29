// Write the requested Japanese report with an explicit -o destination.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const app = path.resolve(__dirname, '..');
const flag = process.argv.indexOf('-o');
if (flag < 0 || !process.argv[flag + 1]) throw new Error('Use -o expression-composer/_codex/REPORT_01.md');
const output = path.resolve(process.argv[flag + 1]);
if (output !== path.join(app, '_codex', 'REPORT_01.md')) throw new Error('Only _codex/REPORT_01.md is an allowed report destination.');
const browser = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-results.json'), 'utf8'));
const node = JSON.parse(fs.readFileSync(path.join(__dirname, 'node-results.json'), 'utf8'));
const js = fs.readdirSync(path.join(app, 'js')).filter(x => x.endsWith('.js'));
for (const name of js) {
  const result = cp.spawnSync(process.execPath, ['--check', path.join(app, 'js', name)], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr);
}
const phi = browser.metrics.find(x => x.name === 'Phi seed42 default step600');
const deterministic = browser.checks.find(x => x.name.startsWith('simDeterminism')).evidence;
const timing = browser.metrics.filter(x => x.mode);
const screenshotCount = fs.readdirSync(path.join(__dirname, 'screenshots')).filter(x => x.endsWith('.png')).length;
const qa = `# 03 / QA REPORT

2026-10-26 / ORDER 01 / PHASE 0〜3。実行日時は各JSONの date。静的確認、実ブラウザの自動入力、画像の目視確認、人間による実機評価を分けて記す。

## 最終実測

- Headless Chrome ${browser.browser}、Windows、--disable-gpu、DPR 1。ローカルHTTPとChromeを同一Nodeプロセスから起動。合成入力。
- ブラウザ **PASS ${browser.summary.pass} / FAIL ${browser.summary.fail} / アプリのJS・HTTP・外部通信エラー ${browser.summary.errors}**。[test-results.json](../verification/test-results.json) / [再実行スクリプト](../verification/verify-browser.cjs)。
- Node ${node.node}：モデル **PASS ${node.summary.pass} / FAIL ${node.summary.fail}**。[node-results.json](../verification/node-results.json)。
- アプリJS ${js.length}ファイルを各々 node --check。PASS。全新規テキストの UTF-8 / LF / BOMなし / 構文 / ローカル参照は [static-results.json](../verification/static-results.json) を正とする。

| 対象 | 結果 | 理由・証拠 |
|---|---|---|
| ローカルHTTPで起動・外部依存なし | PASS | appの例外/404/外部要求0、static server、test-results |
| RULE / SEED / 同期step | PASS | キーボードで係数変更、100step時点の粒子hash差を実測 |
| simDeterminism(42,600)×2 | PASS | Chrome: ${deterministic.join(' / ')}、Node: ${node.checks[0].hashes.join(' / ')} |
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

Chrome / COHERE / seed42 / step600: **ON ${phi.phiA.toFixed(6)} / OFF ${phi.phiB.toFixed(6)}**。3プリセット×seed42/7/2026の9条件は今回ON側が高かったが、FRACTUREは差が小さい。align係数0の対照条件は両側完全一致。これらは必然的優劣の保証ではない。全10条件は test-results.json の Unfiltered comparison sweep。

Nodeの同条件値はON ${node.comparison.phiA.toFixed(6)} / OFF ${node.comparison.phiB.toFixed(6)}。エンジンを跨ぐseed再演算はhashが異なるため、**完全一致の保証は同一実行環境内**。作品再現は計算済み粒子を保存したJSONを使用する。

## 性能（約1秒ずつの合成測定）

| Mode | rAF samples | p95間隔ms | TaskDuration ms | ScriptDuration ms | JS heap MB |
|---|---:|---:|---:|---:|---:|
${timing.map(x => `| ${x.mode} | ${x.samples} | ${x.p95ms.toFixed(2)} | ${x.TaskDurationMs.toFixed(2)} | ${x.ScriptDurationMs.toFixed(2)} | ${(x.heap / 1e6).toFixed(2)} |`).join('\n')}

PNG描画＋dataURL化は ${timing.find(x => x.mode === 'EXPORT').exportMs.toFixed(2)} ms。rAF間隔は実GPUの描画完了FPSではなく、CDP TaskDurationもプロセス全体のCPU使用率ではない。GPU使用率はNOT TESTED。CPU処理量はCOMPAREで増え、停止時に減ることを観測した。常時60fpsは宣言しない。

600粒子固定、同条件比較中に個数を減らさない。近傍は8×8バケット、描画DPR上限2。輸出CanvasのRGBAだけで約17.3MB、dataURLとCanvasネイティブ領域はJS heap値に全て含まれない。EXPORT時だけ別Canvasを作り、プレビューはキャッシュする。適応的粒子数変更は採用しない。

## 確認画像・経過

screenshotsに${screenshotCount}枚。SEED / COMPARE / FREEZE前中後 / 3構図 / 指定4サイズ / reduced-motion / JSONエラー / 既存ページsmoke。画像は最終検証で生成し、外部参考画像を成果物に混ぜていない。

- [同一素材3構図](../verification/contact-sheet.png)
- [PNG実出力](../verification/downloaded-artwork.png) / [再現JSON](../verification/reproduction.json)
- [Desktop](../verification/screenshots/1440x900-signal.png) / [Mobile](../verification/screenshots/390x844-edit.png) / [Short landscape](../verification/screenshots/844x390-seed.png)

制作中の画像確認でCURRENTの注記接近、SPACEの変化しない区間、モバイルstrip上端、短横画面チップ幅を修正した。初回テストはJSONのキー順を文字列比較して失敗し、構造値比較へ訂正。mobile rangeも開閉状態と上限値に依存した入力手順を訂正した。最終結果は修正後ソースでの再実行値であり、失敗をPASSへ書き換えていない。

既存資産・保護パスへの編集なし。gitコマンド、commit、公開なし。検証用browser-tempは終了時に削除。制作/検証ソースと証拠だけを許可範囲内に残す。
`;
fs.writeFileSync(path.join(app, 'docs', '03_QA_REPORT.md'), qa, 'utf8');
const report = `# REPORT 01 — L7 EXPRESSION COMPOSER v0.1

## やった

入口：expression-composer/index.html。静的HTTPでRULE→COMPARE→FREEZE→EDIT→OUTPUTを実装。600粒子の実Boidsを採取し、同じID/位置/速度からSILENCE・CURRENT・SIGNALへ。WORLD→PAPERは粒子ごとの位置補間。1800×2400 PNG・再現JSONと必須window.__ECを実装した。

変更（すべて新規、既存資産は未変更）：
- index.html / styles.css：6シーン、工程チップ、段階別操作、スマホ折畳み、同一素材3枚strip。
- js/sim.js：createSim / stepSim / hashParticles / polarization。
- js/compare.js：createComparison / stepComparison / comparisonStats。
- js/snapshot.js：takeSnapshot / deepFreeze / validateDocument。
- js/composition.js：compositionGeometry / sanitizeEdit / presetEdit。
- js/render.js：renderComposition / renderFreeze / drawTypography。
- js/export.js：exportPNG / exportDocument / saveJSON / readJSONFile。
- js/main.js：setPhase / take / setRules / setEdit / loadJSON / frame、window.__EC。
- README.md、docs/00〜04、verification/：起動・モデル差・制作判断・QA・引継ぎ文案、検証スクリプト・画像・JSON。

検証：全JS ${js.length}本のnode --check合格。Chrome ${browser.browser} headless ${browser.summary.pass}項目PASS、FAIL ${browser.summary.fail}、アプリ例外/HTTPエラー${browser.summary.errors}。seed42/600stepを2回でhash ${deterministic[0]}一致。A/B step600、Φ ON=${phi.phiA.toFixed(4)} / OFF=${phi.phiB.toFixed(4)}。align係数0なら差なし。凍結後のrule変更でhash不変、3構図も同じhash。PNG寸法・実保存、JSON往復の粒子/編集/文字/PNG一致、不正JSON拒否・理由表示を確認。指定4サイズ、合成touch/keyboard、reduced-motionを確認。UTF-8/LF。画像はverification/、詳細はdocs/03_QA_REPORT.md。

## 簡略化した

Canvas 2D、600粒子固定、正規化トーラス、可変視野・外力なし。文字は見出し2行＋sub。フォントライセンス文書を確認できず複製せずlocal/system fallback。短画面は縦スクロールを許容。NodeとChromeの再演算hashは異なるため決定性は同一エンジン内、作品は座標入りJSONで復元する。

## やってない・未検証

実機の手触り、Safari/iOS/Android、実GPU、長時間運用、スクリーンリーダー、全リンク。既存トップは外部通信を遮断したsmokeでReact読込失敗（本作のエラーではない）。既存LP/近接/04_flockの起動は確認。PHASE4、ルートREADME/index/L7更新は未実施、docs/04にClaude向け文案。gitコマンドなし、公開なし。browser-temp削除済み。

次の一手：Claudeの実機レビュー→入口/L7更新→公開対象と画像容量の判断。
`;
if (Array.from(report).length > 2000) throw new Error('Report exceeds 2000 characters: ' + Array.from(report).length);
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, report, 'utf8');
console.log(JSON.stringify({ report: output, characters: Array.from(report).length, qa: 'docs/03_QA_REPORT.md' }));
