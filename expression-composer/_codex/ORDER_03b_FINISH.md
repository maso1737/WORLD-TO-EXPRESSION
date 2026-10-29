# ORDER 03b — v0.3 の続き（前回 ORDER_03 は使用量上限で途中停止）

発注: Claude Code → 受注: Codex（gpt-6-astra / high）
**まず読む:** `expression-composer/_codex/ORDER_03_CAUSALITY_COMPOSITION.md`（HARD RULES はすべてそのまま有効）と正本 `expression-composer/20261027_back/EXPRESSION_COMPOSER_v02_REVIEW_AND_CODEX_ORDER_v03.md`。

## 前回どこまで進んだか（Claude が確認済み）

- `_backup_v02/` と `verification/v03/baseline/` は作成済み。**触らない**。
- **P1-01 CAUSAL VIEW（LOCK / FOLLOW）**：`js/main.js` `js/render.js` `index.html` `styles.css` に実装済み。`verification/v03/verify-causal.cjs` 7/7 PASS。→ 壊さない。
- **P1-02 TRANSFORMATION**：`render.js` の `freezeGeometry` / `renderFreeze` に 0–15 HOLD / 15–70 TRANSFER / 70–88 STILL / 88–100 PRINT を実装済み。`verification/v03/verify-freeze.cjs` は desktop 3 PASS・reduced-motion PASS、**mobile 3 件 FAIL**：`holdDiff: 356`（mobile だけ HOLD 区間の画が source と 356 px ずれる。start/end は 0）。原因を調べて直す（DPR・キャンバス寸法の丸め・HOLD 中の印のどれか）。テストを緩めて通すのは禁止。
- **未着手**：P1-03 ART-DIRECTED POSTER（`composition.js` は未変更）、§4 小さな UI 修正、`docs/05_V03_REVIEW.md`、README/docs 01〜04 の更新、全テストの最終実行。

## 今回やること（順番）

1. mobile HOLD の 356 px を直す。
2. **P1-03**（ORDER_03 の「Claude からの補足」P1-03 とレビュー §3 P1-03 のとおり）：各プリセット 2〜3 の組版案を snapshot の外接位置・密度から決定的に選ぶ。SIGNAL の黄色点は文字と重ならない。CURRENT はタイトルが読める。SILENCE は余白を保ったまま「狙った省略」に。プレビューと PNG は同じ組版。選ばれた案を `__EC.getState()`（例 `layout`）で取れるように。コンタクトシート `verification/v03/posters_seed{7,42,2026}_{A,B}_step{400,600,900}.png` と「最も見づらい例」の指摘。
3. **§4 UI**：操作説明 ≥ 11px（desktop）／重要ラベル ≥ 10px（mobile）。プリセット切替で値が戻ることをプリセットボタンの直近に 1 行。1440×900 の初期表示で主要 CTA が見えるか確認し、必要なら置き方で解決（ステージは削らない）。
4. `docs/05_V03_REVIEW.md`（実装一覧 / 画像比較 / PASS・FAIL・NOT TESTED / 互換性 / 未達 / Claude への確認事項 / 5 人観察の手順＝ユーザーが実施）と README・docs 01〜04 更新。
5. 最終実行：`node --check` 全 JS、`verify-model.mjs`、`verify-static.cjs`、`verify-browser.cjs`、`v03/verify-causal.cjs`、`v03/verify-freeze.cjs`、新しい poster 検証。4 画面幅 × RULE/COMPARE/FREEZE/EDIT/OUTPUT のスクショを `verification/v03/screens/`。file:// 全工程でコンソールエラー 0。

最終メッセージ（-o で `_codex/REPORT_03b.md` に保存）は日本語 1500 字以内の要約で、詳細は docs/05 を指すこと。使用量が尽きそうなら、作業途中でも先に docs/05 に「どこまで済んだか」を書いておくこと。
