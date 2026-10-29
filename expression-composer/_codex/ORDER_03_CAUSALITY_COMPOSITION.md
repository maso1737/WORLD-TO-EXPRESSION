# ORDER 03 — EXPRESSION COMPOSER v0.3：BETTER CAUSALITY. STRONGER COMPOSITION.

発注: Claude Code → 受注: Codex（gpt-6-astra / high）
**正本の仕様:** `expression-composer/20261027_back/EXPRESSION_COMPOSER_v02_REVIEW_AND_CODEX_ORDER_v03.md`（外部レビュー＝v0.3 制作指示）。**全部読み、§3 P1-01 → P1-02 → P1-03 → §4 の順で実装する。** §7「今回は制作しない」を守る。
前回までの記録: `_codex/ORDER_01*.md` `ORDER_02*.md`、`docs/03_QA_REPORT.md` 末尾の Claude 受け入れ v0.1 / v0.2。

## HARD RULES (read first, obey literally)

- Files you may CREATE / EDIT: only under `expression-composer/` → `index.html`, `styles.css`, `README.md`, `js/**`, `docs/**`, `verification/**` (NOT `verification/claude-review/**`), and a new backup folder `_backup_v02/`.
- FIRST action before editing: copy the current `index.html`, `styles.css`, `js/` into `expression-composer/_backup_v02/` (unchanged). Save v0.2 baseline images/hashes into `verification/v03/baseline/`.
- Do NOT touch: masterplan md, `images/`, `20261027_back/`, `_Archive/`, `_out/`, `_codex/` (except your summary via -o), `.lnk`, `verification/claude-review/`, `REVIEW_REQUEST_FOR_GPT.md`, and EVERYTHING outside `expression-composer/` (root `index.html`, README, `30_Levels/`, other works).
- NO git commands at all.
- LF, UTF-8. No npm deps, no CDN, no build. `file://` double-click must keep working (classic scripts, `window.EC` namespace, no fetch/import()/Worker).
- Keep `window.__EC` (all existing methods, same semantics) and all existing DOM ids (Claude's acceptance scripts in `verification/claude-review/` drive them: `#begin #play #step #compare #take-main #take-a #take-b #back #to-output #to-edit #export-png #save-json #load-json #json-file #type-on #title-input #sub-input #align-toggle #seed-input #new-seed #reset #view-zoom #compare-hint #compare-hint-link`, ranges `#rule-separate #rule-align #rule-cohere #rule-noise #edit-keep #edit-focusAmt #edit-space #edit-trace`, `[data-rule-preset]`, `#edit-controls [data-preset]`, `[data-chip]` buttons with `.done` on the parent `li`). New ids are fine; report them.
- JSON `schemaVersion: 1` files saved by v0.1/v0.2 must still load and restore the same snapshot hash and edit values. View-only state (camera, LOCK/FOLLOW, zoom) is NOT part of the artwork JSON (or lives in a clearly separate optional `view` field that loading ignores safely).
- Simulation rules, 600 particles, fixed step, PRNG unchanged. Regression baseline (headless Chrome, as in v0.2): `__EC.simDeterminism(42,600) === '5828ce7f'`. (Note: Claude's in-app Chromium gave a different hash for the same seed in v0.1 — cross-engine float differences are expected; do not "fix" them.)
- Do not fake the picture: no invented particles, no decorative trails, no point swapping in the transition. Poster layout choices may pick among predefined typesetting variants by the snapshot's geometry, but never move the dots to suit the type.
- No glow / bloom / neon / green, no decorative HUD.
- The first-use observation with ~5 people (§4 last bullet) is NOT yours: write the observation protocol (task, what to note) into `docs/05_V03_REVIEW.md` for the user to run; mark results NOT TESTED.
- At the end run: `node --check` on all JS, `node verification/verify-model.mjs`, `node verification/verify-static.cjs` (in the real repo — the `../index.html` link exists here), `node verification/verify-browser.cjs`, plus your new v0.3 checks. Explain every test you change; never hide an old FAIL.
- Reporting: the full report goes to `docs/05_V03_REVIEW.md` (as the spec §6 asks — implementation list / image comparison / PASS·FAIL·NOT TESTED / compatibility / not achieved / questions for Claude). Your final chat message (saved via -o to `_codex/REPORT_03.md`) must be a Japanese summary ≤ 1500 chars that points to that doc. List changes as file + function names; no diffs.

## Claude からの補足（レビューの解釈）

- **P1-01 LOCK:** A と B は同じ seed・同じ初期配置なので、LOCK では「同じカメラ座標＝同じ世界の窓」を左右に並べる。カメラは A/B 両群れの円周平均の中点などで決め、両側に同じ値を使う。step 0 で左右の絵が画素レベルで一致すること（検証で差分 0 を確認）。`REPLAY A/B FROM ZERO` は既存 `compare(true)` 相当の小ボタンで足りる。
- **P1-02:** 0–15% 停止の明示（例：採取した瞬間の点に短い静止の印＝点自身の扱いだけで、新しい図形を足さない）／15–70% 移送／70–88% 静寂／88–100% 反転＋タイポ成立。総時間 ≤ 1150ms。中間で点が背景と同色にならないこと（v0.2 で Claude が直した点）。`verification/v03/freeze_strip_*.png` に 0/15/35/60/80/90/100% を desktop と mobile で。最終フレームが `renderComposition` と一致することを画素比較で確認。
- **P1-03:** 組版案（例：タイトル上／タイトル下／タイトル縦の分割など）を各プリセット 2〜3 個定義し、snapshot の外接位置・密度から決定的に選ぶ。同じ snapshot と edit なら必ず同じ案（プレビュー＝PNG）。案の選択結果は `__EC.getState()` かレイアウト情報で取得可能にする。SIGNAL の黄色点は文字と重ならない（重なるなら組版案の側を変える）。コンタクトシート `verification/v03/posters_seed{7,42,2026}_{A,B}_step{400,600,900}.png`（18 枚程度）と、もっとも見づらい例の指摘を docs に。
- **§4 UI:** 操作説明の文字 ≥ 11px（desktop）／重要ラベル ≥ 10px（mobile）。プリセット切替で値が戻ることをプリセットボタンの直近に 1 行で。1440×900 の初期表示で、現在段階の主要 CTA が見えるか（見えないなら、ステージを削らずに CTA の置き方・視線誘導で）。

## 検証項目と合格条件（Codex 側・最低限）

1. `simDeterminism(42,600) === '5828ce7f'`（headless Chrome）・A/B stepA===stepB・Φ ON/OFF が v0.2 と一致。
2. LOCK の step 0 で A/B 画素差 0、LOCK/FOLLOW/ZOOM 切替で sim・Φ・snapshot hash 不変。
3. FREEZE の最終フレーム＝`renderComposition` の画素一致、途中で 600 ID がすべて描かれている。
4. 同 snapshot・同 edit で PNG が 2 回とも同一（組版の決定性）。v0.2 の JSON（`verification/claude-review/v02/` の export 時と同条件、または `verification/reproduction.json`）を読み込めて hash 一致。
5. 4 画面幅 × RULE/COMPARE/FREEZE/EDIT/OUTPUT のスクショを `verification/v03/screens/`。
6. file:// で全工程（begin→compare(LOCK)→take B→3 構図→PNG→JSON→load）がコンソールエラー 0。
