// Write only the explicitly authorized report exception, via -o.
const fs = require('node:fs'), path = require('node:path');
const app = path.resolve(__dirname, '..'), args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '-o') throw new Error('Usage: node verification/report-v02.cjs -o _codex/REPORT_02.md');
const target = path.resolve(app, args[1]);
if (target !== path.join(app, '_codex', 'REPORT_02.md')) throw new Error('Only _codex/REPORT_02.md is authorized.');
const r = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-results.json'), 'utf8'));
if (r.summary.fail || r.summary.errors) throw new Error('Browser verification has not passed.');
const report = `EXPRESSION COMPOSER v0.2 実装・検証完了。

やった
- index.html／js全7ファイル：strict IIFE＋依存順classic deferへ移行。file://で制作・PNG／JSON保存・読込が動作。ビルド・npm・CDN不要。
- render.js：worldBox／worldPoints／renderWorldでトーラスを全面タイル表示。followCameraで円周平均を滑らかに追跡。実速度3step分の尾とズーム比例半径。
- main.js：cameraFor／advance／setZoom／getStateで表示を物理から分離。ZOOM=1〜3、既定1.8。A/B共通ズーム・個別カメラ。take／render.js:renderFreezeは採取時のタイル位置から紙へ集約。黒い紙と終盤22%の焼き付けを維持。
- composition.js：PRESETS／FRAMES／compositionGeometryを調整、particleDensityで実近傍密度を半径・濃度へ反映。seed42・step600の群れ幅はCURRENT84.62%、SIGNAL71.67%。SILENCEは左下の余白を維持。seamOffset・平均進行方向回転・全粒子bounds-fitを保持。
- styles.css：1440×900のstage高さ720px。index.html／main.js:setPhaseに工程ボタン、未採取④⑤disabled、③への導線、ALIGN操作／8秒の一度だけ案内、直接採取EDITの比較リンク。①調整／②同じ世界の観察／③比較／④採取・編集／⑤出力。
- 既存__EC全メソッド・指定DOM IDは維持、改名なし。setZoomとviewを追加。.process li.done維持。README／docs01〜04更新。

検証
- node --check 全JS成功。verify-browser.cjs：${r.summary.pass}/${r.summary.pass + r.summary.fail} PASS、エラー0。file://でも実PNG／JSONダウンロードとファイル読込成功。
- simDeterminism(42,600)×2=${r.checks[0].evidence[0]}。A/B同歩数、snapshot不変、3構図同一hash、ZOOM非干渉、JSON往復後PNG一致。
- FREEZE：600実ID＋68タイルコピーを検査。開始時の点・尾の内部画素差0。停止時の再描画なし。
- 指定4サイズ×RULE／COMPARE／EDIT／OUTPUTの16枚をscreenshotsへ上書き。stage面積比は1440×900:58.67%、1280×800:57.63%、390×844:54.16%、844×390:76.97%。横overflowなし。
- テスト変更は動的import→EC参照、面積記録、file://等21項目追加。既存55項目維持。verify-modelはclassic読込へ変更し4/4 PASS。

簡略化
尾は速度ベクトルで履歴ではない。細長い群れの縦横比を維持し、全seedで幅70〜90%は保証しない。600粒子固定、縦スクロールあり。

やってない・未検証
実機の手触り、iOS/Safari、GPU性能は未検証。claude-reviewは未変更・未実行（import移行はClaude側）。保護パス・範囲外の編集、git操作なし。UTF-8／LF、検証一時フォルダー削除済み。詳細はdocs/03_QA_REPORT.mdとverification/test-results.json。
`;
if (report.length > 2000) throw new Error('Report exceeds 2000 characters: ' + report.length);
fs.writeFileSync(target, report, 'utf8');
console.log(JSON.stringify({ output: target, characters: report.length }));
