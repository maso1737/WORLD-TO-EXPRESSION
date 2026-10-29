# ORDER 03c — POSTER CLEARANCE（タイトルと群れを重ねない）

発注: Claude Code → 受注: Codex（gpt-6-astra / high）
**HARD RULES は `_codex/ORDER_03_CAUSALITY_COMPOSITION.md` のまま全部有効**（git コマンド禁止＝`git status` も不可。前回の違反は docs/05 に記録済み）。

## Claude の受け入れで見つかったこと

`verification/v03/poster-overview.png` を目視：**SIGNAL（03）の大半と CURRENT（02）の B 群で、タイトル EMER/GENCE が群れの真上に乗っている。**
原因：`composition.js` の `LAYOUTS` の文字矩形と、群れを当てはめる `FRAMES[preset].box` が最初から重なっている。3 案どれを選んでも点の上に文字が来る。最小値を選んでいるだけで「空いている案」が存在しない。

## 直し方（指定）

点を個別に動かすのは禁止のまま。**群れ全体の枠（カメラ）を組版に合わせるのは可**（既存の外接矩形フィットと同じ扱い）。

1. `LAYOUTS` の各案に `frame`（群れを当てはめる箱、`FRAMES` と同じ形式 `{box:[x0,y0,x1,y1], ax, ay}`）を持たせる。`frame` は文字矩形＋余白（紙幅の 3% 以上）と重ならない、残りの紙面。例：SIGNAL `above-signal` なら文字 y0.11–0.35 → 群れ y0.39–0.88。`beside-signal` なら文字左 → 群れは右側の縦長域。CURRENT・SILENCE も同様。SILENCE は「狙った省略」なので群れの枠は小さいままでよい（今の余白の性格を保つ）。
2. `compositionGeometry` は選ばれた案の `frame` を使う。選択は「各候補の frame で実際に幾何を計算 → スコア」で、循環しない（候補ごとに独立計算）。スコア＝文字矩形内の点・速度線分の重み（主）＋群れの縮小ペナルティ（大きく見せる方を好む：ユーザーは「粒子が小さい、もっとダイナミックに」と言っている）＋ SIGNAL の黄色点が文字に触れたら +1000。同じ snapshot と edit なら必ず同じ案、プレビュー＝PNG＝FREEZE 終端。
3. `FRAMES` 定数と `__EC` の既存の意味は残す（`claude-review` の検査が `window.EC.composition.FRAMES` を読む。値の参照先が変わるなら、`getState().layout` に実際に使った `frame` を含めて読めるようにする）。

## 合格条件（verify-posters.cjs を更新して数値で）

- 54 枚（seed 7/42/2026 × A/B × step 400/600/900 × 3 プリセット）すべてで、**文字のグリフ矩形（実測の measureText 外接＋紙幅 0.5% の余白）に入る可視点が 0**（速度線分の中点も 0 が目標、超えたら件数と最悪例を報告）。
- CURRENT と SIGNAL の群れの外接が紙幅または紙高の 55% 以上（大きく見せる）。SILENCE は対象外。
- 黄色点と文字の非衝突、PNG 2 回一致、FREEZE 終端＝renderComposition の画素一致、旧 JSON の hash・edit 一致（組版は JSON に入れない。旧 JSON の絵が v0.3 前半から変わるのは可、docs に明記）。
- コンタクトシート 18 枚と `poster-overview.png` を作り直す。
- 最後に `node verification/v03/verify-all.cjs` 全 PASS。

## 報告

docs/05_V03_REVIEW.md に「03c」節を追記（変更 file＋関数名・合格数値・いちばん窮屈な例の画像リンク）。最終メッセージ（-o で `_codex/REPORT_03c.md`）は日本語 800 字以内。
