# 05 / v0.3 REVIEW

2026-10-27 / ORDER 03b。今回の実測と判断を記す。v0.1/v0.2の記録はdocs/03と既存verificationに保持する。

## 実装一覧

| 項目 | ファイル / 関数 | 内容 |
|---|---|---|
| CAUSAL VIEW（前回実装を保持） | js/main.js `sharedCamera / viewFor / setViewMode / compare`、js/render.js `renderWorld` | 比較開始はLOCK。同じカメラ・ズームでA/Bを描画。FOLLOWは個別追跡。REPLAYはstep 0に戻る |
| TRANSFORMATION | js/render.js `freezeTiming / freezeGeometry / renderFreeze / renderPaper`、js/main.js `take / frame` | HOLD 0–15、TRANSFER 15–70、STILL 70–88、PRINT 88–100%。1150ms、reduced-motion 100ms。600実IDの連続写像と周期コピー集約 |
| mobile HOLD修正 | js/render.js `renderFreeze / renderWorld` | 小数CSS高さと丸めたバッファの差を全画素消去で処理。端のアルファ蓄積を解消 |
| 組版 | js/composition.js `LAYOUTS / posterLayout / compositionGeometry` | 各3案。900×1200の基準紙面で外接範囲と実速度線を含む局所密度から決定。粒子座標は変更しない |
| 文字描画 | js/render.js `tracked / drawTypography` | 選択領域に二行までを縮小配置。CURRENTは細い墨縁で可読性を補助。SIGNALは黄色実粒子の半径と交差する案を除外 |
| 診断 | js/main.js `getState` | layoutにid / rect / bounds / focus / density / candidates。未採取時null |
| UI | index.html / styles.css | COMPARE・TAKE・FINISHをステージ上へ。ステージ高さ維持。操作説明11px、mobile重要ラベル10px以上。プリセット直下に値リセットを明示 |

追加DOM ID：前回 compare-camera-controls / view-lock / view-follow / replay-compare / compare-view-note / freeze-beat、今回 preset-reset-note。既存ID・APIは改名しない。

## 画像比較

- [v0.2固定資料](../verification/v03/baseline/)。_backup_v02とbaselineは今回変更していない。[旧CURRENT・seed42 A step600](../verification/v03/baseline/CURRENT.png)と下の同条件シートを比較できる。
- [seed42 A step600](../verification/v03/posters_seed42_A_step600.png)：SILENCEは左下の小群と右の静かな二行、CURRENTは上部見出しと水平の速度線、SIGNALは実粒子一点と側方見出し。
- [seed2026 B step400](../verification/v03/posters_seed2026_B_step400.png)：CURRENTがside-channelを選ぶ例。
- 全18条件：verification/v03/posters_seed{7,42,2026}_{A,B}_step{400,600,900}.png。各3構図、合計54作品。seed・step・sideを上端に併記。
- [全18条件の一覧](../verification/v03/poster-overview.png)。全体一覧、個別シート4例、desktop/mobileのFREEZE strip、desktop/mobile縦横のUIを画像として開いて確認した。
- FREEZE：verification/v03/freeze_strip_{desktop,mobile}_{silence,current,signal}.png。0/15/35/60/80/90/100%の7コマ。空間的な印刷前線で紙と墨を同時反転し、背景と点を同じ灰色へ補間しない。
- 4幅×RULE/COMPARE/FREEZE/EDIT/OUTPUT：verification/v03/screens/。fullPageに加え1440×900の初期viewportも保存。FREEZEは仮想時計で約400msを固定。

### 最も見づらい例

[seed7 B step900のSIGNAL](../verification/v03/posters_seed7_B_step900.png)は標準54作品で見出し領域の重み付き密度が最大（約110.13）。黄色点は文字から離れるが、黒い群れがEMER/GENCE周辺を通り、文字と素材が競合する。黄色点の非衝突と全体の読みやすさは別評価であり、完全な可読性を主張しない。

CURRENTの厳しい例は[seed42 B step900](../verification/v03/posters_seed42_B_step900.png)（約89.67）。細い墨縁があっても縮小時には線と文字が近い。三つの事前定義領域から選ぶため、すべての素材で完全な空白を確保する方式ではない。SILENCEは紙面を埋めずKEEP .3 / SPACE .72を維持。

標準18条件ではSILENCEがopposite-column / low-counterweight、CURRENTがupstream / side-channel、SIGNALがabove-signal / beside-signalを選択。未選択の第三案も定義済み。案を均等に出すためのseed分岐や乱数は使わない。

## PASS / FAIL / NOT TESTED

Windows / Node v24.14.1 / Headless Chrome 155.0.8059.79、DPR 1、GPU無効、合成操作。実機の触感・人間の理解はこの検証に含まない。再実行入口は `node verification/v03/verify-all.cjs`。詳細ログ：[final-results.json](../verification/v03/final-results.json)。

| 検証 | 状態 | 証拠 |
|---|---|---|
| FREEZE source/HOLD/endpoint全画素一致、600ID、写像、静寂、reduced-motion | PASS 7/7 | [freeze-results](../verification/v03/freeze-results.json) |
| 18条件×3構図、PNG同一再生成、preview/PNG同じlayout、黄色点実画素非衝突 | PASS 54/54 | poster-results.json |
| 長い英字/和文・9焦点の安全領域、旧JSON hash/edit、file console | PASS 3/3 | poster-results.json |
| CAUSAL：4幅のLOCK step0画素差0、視点切替の非干渉、FOLLOW | PASS 7/7 | [causal-results](../verification/v03/causal-results.json) |
| 既存browser回帰 | PASS 76/76、errors 0 | [test-results](../verification/v03/regression/test-results.json) |
| model | PASS 4/4 | [node-results](../verification/v03/regression/node-results.json) |
| 4幅×5段階、CTA、フォント、file全工程 | PASS 27/27 | [screen-results](../verification/v03/screen-results.json) |
| 全アプリJS node --check / static | PASS、staticは69テキスト・32構文検査・errors 0 | [static-results](../verification/v03/regression/static-results.json) |
| 人間5人の初回観察 | NOT TESTED | 下記をユーザーが実施 |
| 実機タッチ/ホイール、iPad Safari、低速端末、実GPU、スクリーンリーダー | NOT TESTED | headless合成入力では代替しない |

数値チェック合計178 PASS / 0 FAIL（静的・構文検査は別）。ChromeのsimDeterminism(42,600)=5828ce7f。stepA=stepB=600、Φ ON=0.9949783491582183 / OFF=0.04610160222900489で固定v0.2 baselineと一致。Node内の再計算は772e5451で一致し、異なるエンジン間のhash一致は要求しない。

file://でBEGIN→COMPARE(LOCK)→TAKE B→SILENCE/CURRENT/SIGNAL→実PNG保存→実JSON保存→file input読込を実行。全粒子・編集の構造値一致、PNG完全一致、console/page errors 0。旧reproduction.jsonもhashと編集値が一致。54作品すべてで同条件のPNGを2回出力し完全一致、SIGNALの黄色画素はTYPE ON/OFFで差0。

### UI実測

1440×900、scrollY=0でCOMPARE/TAKE A/B/FINISHはy=211〜251、EXPORT PNGは約y=460〜500に収まる。ステージは1056×720のまま。1280×800では922×640、390×844では358×497.953125、844×390では812×312。全20画面で横overflowなし。desktop操作説明は11px以上、mobile重要ラベルは10px以上。プリセット注意はdesktop画像でボタン直下の一行を確認。mobileの編集パネルは従来どおり開閉式で、必要に応じてスクロールする。

## 修正前FAILとテスト変更

1. 引継ぎのmobile HOLDは3構図とも356成分差。既存diffは画素数でなくRGBA成分数。論理高さ495.953125とバッファ496の最下行へアルファが蓄積。内部worldバッファ消去だけでは直らず、renderFreezeの描画先全体を消去してHOLD=0。
2. 修正後、endpoint参照側にも同じ蓄積が判明。verify-freeze.cjsではsourceに使った参照キャンバスをendpoint描画前に消去し独立した参照画像とした。開始/HOLD/終了の許容差は全て0。暗黙global labelWidthも削除。端を比較から除外せず閾値も緩和しない。
3. verify-browser.cjs / verify-model.mjs / verify-static.cjsにEC_VERIFY_OUTを追加。今回の出力だけverification/v03/regression/へ保存。verify-v02.cjsの入力HTMLパスを出力先と分離。既存合否条件は維持。
4. 新規verify-posters.cjs / verify-screens.cjsを追加。初回screensはCOMPAREラベル10pxで2FAIL→11pxへ修正。JSON比較はキー順まで比較して1FAIL→Node isDeepStrictEqualによる構造値比較へ訂正。PNGの完全一致判定は維持。
5. 既存browser初回は75 PASS / 1 FAIL。v0.2の「比較入場から個別カメラ」という前提がLOCK開始と矛盾していた。verify-v02.cjsでFOLLOWを明示し、ズーム・個別カメラ・同期stepの元のアサートをそのまま実行。LOCKはverify-causalで別途検証。[初回FAIL記録](../verification/v03/regression-initial-fail.json)を保持。
6. 最終画像確認でTYPE補助文とSEEDラベルにも11pxを適用し、フォント検査対象を追加。変更後に全スイートを再実行。

## 互換性・依存

schemaVersion 1、全粒子snapshot hashと編集値を保持。旧JSONを読むとv0.3組版になるため、v0.2の文字位置まで同一とはしない。v0.3内のPNG再生成・JSON往復は完全一致を検証。view/LOCK/FOLLOW/zoom/layout診断は作品JSONに追加しない。sim.js / compare.js / snapshot.js / export.jsは変更なし。新規ライブラリ・CDN・ビルド・フォント配布なし。file://、classic script、window.ECを維持。

フォント：ローカルIBM Plex Sans JP → Helvetica Neue → Arial → Yu Gothic → sans-serif、JetBrains Mono → Consolas → monospace。別OS/フォントでは字幅とラスタが変わる。組版案の選択はフォント計測に依存しない。OS間のPNG画素一致は保証しない。

## 未達・Claudeへの確認事項

- 実装と指定の自動検証・画像保存・文書更新は完了。人間の初回観察と実機評価は未実施。
- SIGNAL最密例のタイポと群れの競合を許容できるか。黄色点の非衝突だけで造形の合格とはしない。
- HOLDとSTILLの短い静止が実機で意味として伝わるか。数値検証と印象評価は別。
- 実機読みやすさと初回観察、Safari/低速端末評価を依頼。公開導線の更新は別発注。

## 5人の初回観察手順（ユーザーが実施）

未使用の協力者約5人に操作説明をせず「③比較を観る→AまたはBを採る→3構図を試す→PNGとJSONを持ち帰る」を提示。端末/viewport/ブラウザ/文字倍率を記録。BEGINから書出し完了まで計測し、比較到達/採取/3構図/PNG/JSONの各時刻と、止まった場所・戻った操作・発言・支援の有無を記録する。45〜90秒は目標であり測定結果ではない。

終了後「A/Bの何が同じで何が違ったか」「TAKEで何が固定されたか」「プリセットでどの値が戻ったか」「PNGとJSONの役割」を本人の言葉で確認。誘導せず回答を記録。人数、完遂数、時間の中央値と範囲、支援件数、迷い箇所を別途追記し、未完遂も残す。

## 作業範囲・手順逸脱

開始時、発注書の読取結果を確認する前にgit status --shortを実行した。NO git commandsに違反。以後Gitを使わず、commit/push/公開なし。許可範囲外のソース編集なし。

UTF-8 / LF / BOMなしはstaticでPASS。バックアップ9ファイルは固定baselineのSHA-256と一致。sim.js / compare.js / snapshot.js / export.jsもv0.2と同一。_backup_v02・baseline・images・20261027_back・_Archive・_out・claude-review・ルート資料は未編集。検証用browser-tempは終了時削除済み。最終要約は-oでREPORT_03b.mdへ保存する想定で、この作業から_codexへ直接書き込んでいない。

## 03c — POSTER CLEARANCE（2026-10-27）

前節までの03bでは、候補の文字領域が共通の群れ枠と重なり、最小密度の候補でもタイトルを群れから離せなかった。03cでは各組版案に専用の群れ枠を設けた。03bの「最も見づらい例」「SIGNALの競合を許容できるか」はこの節の結果で更新する。

### 変更ファイル・関数

| ファイル / 関数 | 変更内容 |
|---|---|
| js/composition.js `LAYOUTS` | 各9案に `{box, ax, ay}` のframeを追加。文字予約矩形から紙幅3%以上離れた枠を定義。CURRENTの上下見出し、SIGNALの下・横見出しは文字領域を調整して群れの面積を確保。SILENCEの小群と余白は維持 |
| js/composition.js `framedGeometry / compositionGeometry` | 候補のframe内に全600粒子と最大TRACEを一括フィット。個々の点を押しのけず、既存のunwrap・回転・等方拡縮・平行移動を使う。SIGNALは最大黄色半径0.014紙幅も枠内に確保 |
| js/composition.js `posterLayout` | 900×1200で候補ごとに独立計算し、文字矩形内の可視点・実速度線上3標本のalpha重み×10＋相対縮小ペナルティ（最大0.25）＋SIGNAL焦点衝突1000で採点。SILENCEの既存の縦横比による優先と決定的な同点順序も保持。再帰・乱数なし |
| verification/v03/verify-posters.cjs `run` | 実描画のfillText/strokeTextを観測し、measureTextのactualBoundingBoxと紙幅0.5%余白（縁取り分も加算）で衝突判定。タイトルに加えメタデータ・副題・番号も対象。54作品の寸法、黄色点、FREEZE終端、JSON非混入を検査し18シートと一覧を再生成 |
| verification/verify-browser.cjs `run` | 点・最大速度線の枠内収容を旧FRAMESの外枠ではなく実際の `g.layout.frame.box` で検査。端を除外せず従来の半径・許容差を保持 |
| verification/verify-v02.cjs `verifyV02` | 旧「紙幅70〜90%」を03c指定の「紙幅または紙高55%以上」に更新。従来の90%上限は保持。変更前の不合格結果も保存 |
| docs/05_V03_REVIEW.md | この03c節を追記 |

`FRAMES` の既存値と公開名は変更していない。実際の枠は `__EC.getState().layout.frame` で取得でき、候補にもframe / scale / shrinkPenaltyを返す。既存__ECメソッド・DOM IDはそのまま、追加IDなし。render.js / main.js / sim.js / compare.js / snapshot.js / export.jsは03c着手前と同一。

### 合格数値・画像

Windows / Headless Chrome 155.0.8059.79、file://、DPR 1、GPU無効。[poster-results.json](../verification/v03/poster-results.json)に54作品の個別数値、候補、衝突ID、最接近例を保存。

| 検証 | 結果 |
|---|---|
| seed 7/42/2026 × A/B × step400/600/900 × 3構図 | 54/54 PASS |
| 実測グリフ矩形＋紙幅0.5%余白内の可視点中心 | 全54作品で0件 |
| 可視点の半径まで含めた同矩形との接触 | 全54作品で0件 |
| 実速度線分の中点が同矩形に入る件数 | 全54作品で0件、超過例なし |
| CURRENT/SIGNALの可視点外接（点中心のみ、線・半径を加算しない） | 36/36が一方の紙面軸55%以上。CURRENT最小55.9576%、SIGNAL最小55.0628% |
| 各候補の文字予約矩形とframeの離隔 | すべて紙幅3%以上 |
| 黄色点のグリフ矩形接触／TYPE ON/OFF黄色画素差 | SIGNAL 18/18で接触0、画素差0 |
| PNG 1800×2400を2回生成 | 54/54完全一致、snapshot hash不変 |
| getState / 360×480描画 / 1800×2400描画のlayout | 54/54完全一致 |
| FREEZE終端と独立renderComposition参照 | 54/54、RGBA成分差0（480×640のステージ） |
| 長い英字・和文 × 焦点9位置／旧JSON／console | 3/3 PASS。旧JSONのhash・edit一致、console error 0 |

- [再生成した全54作品の一覧](../verification/v03/poster-overview.png)。18枚の `posters_seed{7,42,2026}_{A,B}_step{400,600,900}.png` も再生成した。
- **全描画文字に対する最接近例：** [seed7 B step400 / CURRENT](../verification/v03/posters_seed7_B_step400.png)。余白と文字の縁取りを含むグリフ矩形から可視点円周まで、最短距離は紙幅 **4.0228%**。接触は0。タイトルと群れは別領域に収まる。一覧とこの個別シートを画像として開いて確認した。
- **タイトルに対して最も窮屈な例：** [seed2026 A step400 / SIGNAL](../verification/v03/posters_seed2026_A_step400.png)。タイトルの実測グリフ矩形＋余白から可視点円周まで紙幅 **5.9354%**。beside-signalの右側に群れを収容し、縦55.8671%。個別画像でも非重複を確認した。
- **群れの寸法が最小の例：** [seed42 A step600 / SIGNAL](../verification/v03/posters_seed42_A_step600.png)。横55.0628%、下見出しbelow-signal。最大TRACEの予約も維持したまま55%条件を満たす。
- 最終 `node verification/v03/verify-all.cjs` は **全PASS**。[最終実行記録](../verification/v03/final-results.json)：全7アプリJS構文、model 4/4、browser 76/76、causal 7/7、freeze 7/7、posters 57/57、screens 27/27、static errors 0。数値検証計 **178 PASS / 0 FAIL**。v0.2バックアップ9ファイルのbaseline一致、sim hash `5828ce7f` を確認。desktop/mobileのFREEZEストリップと4幅の画面も再生成、検証用browser-tempの残存なし。

### 不合格履歴と検査変更の理由

1. 最初の専用枠では全54作品で点・点半径・線中点の衝突0だったが、6作品で55%に不足（最小45.7143%）。[初回poster検証：51 PASS / 6 FAIL](../verification/v03/poster-03c-initial-fail.json)を保持。最大速度線予約や粒子写像は維持し、CURRENTの上下、SIGNALの下・横の文字領域と群れ枠を調整した。合格閾値は下げていない。
2. 旧browser検証は75 PASS / 1 FAIL、errors 0。seed42 A step600 SIGNALが旧仕様の紙幅70%を満たさず不合格（半径込み55.7040%）。[変更前の結果](../verification/v03/regression-03c-initial-fail.json)を保持し、03cの55%・いずれかの軸という指定に更新した。54作品の新検査は半径を加えない点中心外接でさらに確認する。
3. 枠内収容はFRAMESより狭い実使用frameで調べるよう強化した。旧チェックを削除して問題を隠したものではない。freezeの画素一致・旧JSON復元・決定性の閾値は変更していない。

### 互換性・作業範囲

組版とframeはJSONに保存しない。旧schemaVersion 1のhash・editは維持するが、旧JSONの絵はv0.3前半（03b以前）から変わる。旧版の群れ枠・文字位置・黄色粒子の選択位置まで再現する約束ではなく、03c内では同一snapshot/editの案とPNGを再現する。フォント計測は検証時だけに使用し、案の選択は従来どおりフォントに依存しない。

編集前にindex.html / styles.css / jsを `_backup_v02/pre_03c/` へそのまま複製。既存v0.2バックアップとbaselineは保持。03cではgitコマンドを一切使用せず、claude-review・禁止ディレクトリ・プロジェクト外の編集なし。UTF-8 / LF / BOMなし、新規依存・CDN・ビルドなし。最終要約の保存先は実行側の `-o _codex/REPORT_03c.md` とし、直接書き込まない。

人間5人の初回観察、実機タッチ・Safari・低速端末・実GPU評価は引き続きNOT TESTED。03cの数値とheadless画像の確認でこれらを代替しない。
