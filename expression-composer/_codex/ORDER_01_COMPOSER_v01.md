# ORDER 01 — L7 EXPRESSION COMPOSER v0.1（実装発注）

発注: Claude Code（司令塔・レビューと最終判断） → 受注: Codex（実装）
モデル: gpt-6-astra / reasoning high（設計判断を一部任せるため）

## HARD RULES (read first, obey literally)

- Files you may CREATE / EDIT: only under `expression-composer/` → `index.html`, `styles.css`, `README.md`, `js/**`, `docs/**`, `verification/**`, `assets/fonts/**` (only if a font license allows redistribution; otherwise use system/fallback stacks).
- Do NOT touch: `expression-composer/WORLD_TO_EXPRESSION_CODEX_MASTERPLAN_20261025.md`, `expression-composer/_Archive/`, `expression-composer/images/`, `expression-composer/_codex/` (except your report file), the `.lnk` shortcut, and EVERYTHING outside `expression-composer/` (root `index.html`, `README.md`, `30_Levels/`, `scroll-experience/`, `Emergence Engine/`, `cognitive/`, etc. are read-only for you. Claude will do the README / L7 note / root link updates after review).
- NO git commands at all (no add / commit / stash / checkout / restore / reset).
- Line endings: LF. UTF-8. No build step, no npm dependencies, no CDN. Must run from a static HTTP server (`python -m http.server` at `WORLD TO EXPRESSION/`). ES modules are fine.
- Do not fake the passing picture. No hand-placed particles, no swapping in a different random point cloud, no image-only crossfade "transitions". Every poster must be rendered from the real snapshot data. The A/B difference must come from the rule alone.
- No glow / bloom / neon / green. No decorative HUD (no meaningless corner marks, rulers, grids). Every mark must mean something.
- Verification hook (required, Claude will call it in acceptance): `window.__EC` with at least
  - `getState()` → `{ phase, seed, step, rules, particleCount, snapshot: {seed, step, rules, side, count, hash} | null, edit, preset }`
  - `setRules(partial)` / `setSeed(n)` / `reset()` / `pause(bool)` / `step(n)` (n fixed sim steps, synchronous, no rAF needed)
  - `compare(bool)` (ALIGN ON vs OFF, same seed / same step count) and `compareStats()` → `{ stepA, stepB, phiA, phiB }`
  - `take(side)` ('A' | 'B' | 'main') → freezes snapshot, returns its hash
  - `snapshotHash()` (stable hash of id/x/y/vx/vy; must not change when rules change after freeze)
  - `setEdit(partial)` (keep, focusX, focusY, focusAmt, space, trace, typeOn, title, sub) / `setPreset(name)`
  - `exportPNG({download:false})` → resolves `{width, height, dataURL}` (1800×2400), `exportJSON()` → object, `loadJSON(objOrString)` → `{ok, error?}`
  - `simDeterminism(seed, steps)` → hash of particle state after `steps` from fresh init (call twice → identical)
- Before finishing run a syntax check on every JS file (`node --check js/*.js`) and, if possible, a headless run of the hooks. Report results honestly.
- Final report in Japanese, max 2000 characters, write to `expression-composer/_codex/REPORT_01.md` (via -o). List changes as file + function names. Do not paste diffs. Separate: やった / 簡略化した / やってない・未検証.

## 1. 目的と芸術的意図（正本）

正本の仕様は `expression-composer/WORLD_TO_EXPRESSION_CODEX_MASTERPLAN_20261025.md`。**全部読むこと**。PHASE 0〜3 を実行。PHASE 4 はやらない。
ただし同書 §9 のうち **ルート README・`30_Levels/L7 EXPRESSION.md`・ルート `index.html` の更新は今回やらない**（Claude が受け入れ後に行う）。代わりに `docs/04_NEXT_ROADMAP.md` に「Claude に頼む更新内容」として文案を書いておく。

核：**Boidsのルールを変える → ALIGN ON/OFF を同条件で比較 → 実在した粒子状態を TAKE STATE → 同じデータから SILENCE / CURRENT / SIGNAL の3構図 → 1800×2400 PNG と再現 JSON**。

## 2. アートディレクション（添付画像 `expression-composer/images/a_wide_high_contrast_modern_ui_portfolio_style_c.png`）

画像は**見た目の方向性の参考**。描かれている機能（REACTION / L-SYSTEM / ERASE / MASK / JPG / SVG / 4K / GALLERY / AGENT 3000 等）は**実装しない**。機能はマスタープランが優先。

画像から取り入れるもの：
- 黒地（NOIR #070707）に、細いライン枠のパネル。角丸は小さく（2〜4px）、線は 1px の低コントラスト灰。
- 見出しは**ワイドトラッキングの大文字**（letter-spacing 0.3em 前後）。`EXPRESSION` を白、`COMPOSER` を SIGNAL YELLOW #FFD400。直下に日本語サブ（「発見した法則を、観客自身が使って表現する。」）、さらに小さく `FROM SEEING TO MAKING.`。
- 上部の工程チップ：`① RULE 法則 → ② EMERGENCE 現象 → ③ PERCEPTION 知覚 → ④ EDIT 編集 → ⑤ EXPRESSION 表現`。**現在の段階だけ黄色塗り**（画像では 5 が塗り）。工程は本作の 6 シーン（SEED/RULE/COMPARE/FREEZE/EDIT/OUTPUT）に対応づけて実際の状態を表示すること（飾りにしない）。
- 番号付き丸（細い円の中の数字）＋英語大文字＋日本語小見出し＋1 行の説明、という見出しの型。
- スライダー：細いトラック、値の部分だけ黄色、右端に等幅の数値（0.62 のような 2 桁小数）。
- ポスター：PAPER #F2F2EF 地に墨の点描の群れ、黄色は**小さく意味のある 1 点**（SIGNAL の注目点）か細い縦線のみ。大きなワイドトラッキングの文字（例 `EMER / GENCE` を 2 行に割る）、左下に小さく `FROM / RULES / TO / WORLDS` 縦積み、右下に通し番号 `01`。CURRENT は黒地に白い点と速度の細い線。
- 下段「OUTPUT EXAMPLES — 同じ生成現象から、まったく違うグラフィック作品が生まれる。」の 3 枚並び（A MINIMAL / B TYPOGRAPHIC / C STRUCTURE の位置づけ）→ 本作では **SILENCE / CURRENT / SIGNAL の 3 枚を、同じスナップショットから並べて見せる比較ストリップ**として採用。これがマスタープランの「同じデータに由来することを観客が実感できる」の答えになる。
- 右の EXPORT パネルの型（細枠のトグル、選択中は黄枠、黄色の太い EXPORT ボタン、JSON に含める内容のチェック表示）。ただし形式は PNG（1800×2400）と JSON のみ。

レイアウト方針：大画面ではステージ（作品）が約 70%。画像のような「全工程を一画面に並べたカタログ」にはしない（マスタープラン §3.1「1 画面の連続体験・作業段階だけを移行」が優先）。情報密度と品位は画像に合わせ、構成はマスタープランに合わせる。スマホではステージ優先・操作は畳む。

フォント：`Mindmap_GEN-EX/styles.css` の参照方法を調べ、再配布可能なもののみ使う（JetBrains Mono / IBM Plex Sans JP は OFL のはず。ファイルがあればライセンスを確認してコピー可、なければフォールバック）。

## 3. 実装範囲

マスタープラン §4.1〜4.5 の必須すべて、§5、§6 の責任分割、§8 の QA。要点だけ再掲：
- Boids：seed 付き PRNG、固定時間刻み（描画と分離、タブ復帰時に追いつき計算を上限で打ち切る）、粒子 300〜800、SEPARATE / ALIGN(+ON/OFF) / COHERE / NOISE、SEED / RESET / PLAY-PAUSE / STEP、プリセット 3 個（実数値）。`Emergence Engine/04_flock.html` を読み、モデル差は `docs/01_MODEL_NOTES.md` に明記。
- COMPARE：左右同時刻、Φ（平均進行方向の一致度 |Σv̂|/N）を定義と測定 step 付きで表示。φ（黄金比）と混同しない表記。
- FREEZE：immutable snapshot（Object.freeze 等）。WORLD → PAPER の転換は**同じ粒子が動いて紙面へ移る**ことで見せる（点の連続性）。reduced-motion では短縮。
- EDIT：KEEP（安定な ID 順の間引き）、FOCUS（クリックで位置）、SPACE、TRACE（実速度方向）、TYPE（textContent 等で安全に、長文は切り詰め）、PRESET 3 種。
- OUTPUT：`renderComposition(state, target)` をプレビューと書き出しで共用。1800×2400 で再レイアウト。JSON 保存／読込（schema version・サイズ上限・数値範囲・NaN 除外・未知キー無視、理由を UI に表示）。
- `prefers-reduced-motion`、キーボード操作、1440×900 / 1280×800 / 390×844 / 844×390 で崩れない。

## 4. 保持すべき既存機能

既存ファイルは一切変更しない（HARD RULES 参照）。読むのは自由。

## 5. 技術的な制約

静的 HTML + CSS + ES modules。Canvas 2D で十分なはず（WebGL を使うなら理由を docs に）。外部ライブラリなし。

## 6. 検証項目と合格条件（Codex 側）

- `node --check` 全 JS が通る。
- `__EC.simDeterminism(42, 600)` を 2 回 → 同一 hash。
- `compare(true)` 後 `compareStats()` の stepA === stepB、Φ は ON 側が高い**かどうかを実測して報告**（結果を捏造・誘導しない。もし差が出ない条件があれば正直に書く）。
- `take('A')` → `setRules({align:0, cohere:2})` → `snapshotHash()` 不変。
- 3 プリセットで同じ snapshot hash のまま描画が変わる。
- `exportPNG` が 1800×2400。`exportJSON` → `reset()` → `loadJSON` で snapshotHash・edit・title が一致。
- 壊れた JSON / 巨大文字列 / NaN 入りで `{ok:false, error}` と UI 表示。
- 可能ならヘッドレスブラウザでスクショを `verification/screenshots/` に（無理なら NOT TESTED と書く。Claude が内蔵ブラウザで撮る）。
- `docs/03_QA_REPORT.md` は PASS / FAIL / NOT TESTED / 理由 / 証拠。実機（人の手触り）は NOT TESTED のままでよい。

## 7. 提出成果物

マスタープラン §10 の 1〜8（README・docs 00〜04・verification）。§10 の 9（README・L7 更新）は文案のみ（上記）。最終報告は `_codex/REPORT_01.md`（日本語・2000 字以内）。
