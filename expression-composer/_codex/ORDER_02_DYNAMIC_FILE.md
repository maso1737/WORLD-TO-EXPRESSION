# ORDER 02 — EXPRESSION COMPOSER v0.2：ダイナミックに・ダブルクリックで開く・PERCEPTION へ迷わず行ける

発注: Claude Code → 受注: Codex（gpt-6-astra / high）
前回: `_codex/ORDER_01_COMPOSER_v01.md`（実装済み・Claude 受け入れ済み）。現状の記録は `docs/03_QA_REPORT.md` 末尾「Claude 受け入れ検査」と `docs/02_CREATIVE_DECISIONS.md` 末尾。

## HARD RULES (read first, obey literally)

- Files you may CREATE / EDIT: only under `expression-composer/` → `index.html`, `styles.css`, `README.md`, `js/**`, `docs/**`, `verification/**` (but NOT `verification/claude-review/**`).
- Do NOT touch: the masterplan md, `images/`, `_Archive/`, `_codex/` (except your report via -o), the `.lnk`, `verification/claude-review/`, and EVERYTHING outside `expression-composer/`.
- NO git commands at all.
- LF, UTF-8. No build step that the user must run, no npm deps, no CDN.
- Keep `window.__EC` with every existing method and the same semantics (Claude re-runs its acceptance scripts in `verification/claude-review/` — they call `__EC` and drive DOM ids such as `#begin #play #step #compare #take-main #take-a #take-b #back #to-output #export-png #save-json #load-json #json-file #type-on #title-input #sub-input #align-toggle #seed-input #new-seed #reset`, range inputs `#rule-separate #rule-align #rule-cohere #rule-noise #edit-keep #edit-focusAmt #edit-space #edit-trace`, `[data-rule-preset]`, `#edit-controls [data-preset]`). Keep these ids, or report every rename explicitly.
- Keep Claude's review fixes (do not revert): `composition.js` `FRAMES` / `seamOffset` / bounds-fit framing (torus unwrap, CURRENT rotated by the flock's mean heading, frame independent of KEEP/TRACE/FOCUS); `render.js renderFreeze` (sheet grows from the world square, stays dark, then "prints" in the last 22%); `.process li.done`. You may tune values, not the principles.
- Do not fake the picture. Every dot drawn = a real particle (or a real tile copy of the torus, see B). No decorative particles, no random re-placement. Same seed → same picture.
- No glow / bloom / neon / green, no decorative HUD.
- At the end: `node --check` every JS file; run `node verification/verify-browser.cjs` (update its checks only where this order changes behavior, and say which). Must also verify the file:// load (A) with headless Chrome.
- Report in Japanese, max 2000 chars, via -o. Changes as file + function. やった / 簡略化 / やってない・未検証.

## ユーザーの感想（今回の起点）

1. 「3 PERCEPTION 知覚 にはアクセスしなかった。なにかある？」→ COMPARE を通らずに TAKE STATE へ行けてしまい、比較（＝知覚の段）に気づかなかった。
2. 「面積的に、せっかくの中の粒子の素材が小さかった。もっとダイナミックに見えてよい」
3. 「html ダブルクリックで見られるように」→ 今は ES modules なので file:// で CORS エラーになり開かない。

## A. ダブルクリック（file://）で開く

- `index.html` を file:// で開いて全機能（PNG / JSON 保存・読込を含む）が動くこと。
- 方法は任意だが推奨：ES modules をやめ、classic script（各ファイルを IIFE にして `window.EC = {sim, compare, snapshot, composition, render, exporter}` のような名前空間へ登録）を依存順に `<script defer src>` で読む。fetch / import() / Worker(file) を使わない。
- `verification/verify-browser.cjs` の `import('./js/composition.js')` 等は新方式に合わせて直す（例 `window.EC.composition.compositionGeometry`）。`verification/claude-review/*.cjs` は触らない（Claude が直す）。ただし `__EC` と DOM id が保たれていれば動くはず。
- フォントはローカル無しのフォールバック前提でよい（現状どおり）。

## B. ダイナミックに見せる（今回の主題）

参考画像 `images/a_wide_high_contrast_modern_ui_portfolio_style_c.png` の上段 1〜4 のパネルのように、**粒子の群れそのものが画面いっぱいの主役**になるように。

1. **ステージ（RULE / COMPARE / SEED）を大きく**：ステージの高さをビューポート基準に（目安 1440×900 で現状 610px → 720px 前後、`min(… vh)`）。ページを開いて最初の画面でステージがもっとも大きい要素であること。390×844 / 844×390 で崩さない。
2. **世界の見せ方**：今は正方形の世界（トーラス）を小さく置いているため、群れが画面の数%しかない。
   - 世界をステージ全面に**タイル状に敷いて**（トーラスなので端がつながる＝実際の物理と一致）、カメラが**群れの重心（円周平均）を滑らかに追う**。
   - **ZOOM**（例 1.0〜3.0、既定 1.8 前後）をビュー操作として追加。ズームは表示だけで、シミュレーションにも snapshot にも影響しない（`__EC.getState()` に `view: {zoom, camX, camY}` を足す）。
   - 点の大きさをズームに比例させ、**実速度方向の短い尾**（数ステップ分、`vx, vy` から描く）で動きを見せる。点の濃さは近傍密度で変えてよい（実データ由来に限る）。
   - COMPARE では A/B に**同じズーム**を使い、カメラはそれぞれの群れを追う（左右が違う場所を映しても、比較条件＝同 seed・同歩数・同ルールは変わらない旨を 1 行表示）。
   - FREEZE の転換は、採取した瞬間の**画面上の点の位置**（タイル・ズーム込み）から紙面へ移ること（点の連続性を保つ）。`renderFreeze` の `source` / `from` をこの新しい見た目に合わせる。
3. **ポスターでの存在感**：プリセットの既定値を見直し、SIGNAL と CURRENT は群れが紙面の主役になる大きさに（目安：群れの外接矩形が紙面幅の 70〜90%）。SILENCE は今の「左下に小さく」を保つ（意図的な余白）。点の半径も紙面サイズに対して一段大きく、密な所と疎な所の差が出るように。
4. 静止しているときは描画を止める（既存の方針どおり）。粒子数は 600 のまま（増やすなら性能を測って理由を docs に）。

## C. PERCEPTION（COMPARE）へ迷わず行ける

1. 上の工程チップ `① RULE ② EMERGENCE ③ PERCEPTION ④ EDIT ⑤ EXPRESSION` を**押せるボタン**に：今行ける段だけ押せる（EDIT / EXPRESSION は採取済みのときだけ。押せないものは disabled で理由を title / aria に）。③ を押すと COMPARE へ。
2. RULE 画面で、ALIGN を触った後（または 8 秒程度たったら）**一度だけ**「同じ条件で、ALIGN だけ違う世界と比べる → COMPARE」の 1 行を COMPARE ボタンの近くに出す。点滅させない。
3. RULE から直接 TAKE STATE したときも、EDIT 画面に「比べてから採ることもできる（③ PERCEPTION）」の小さな導線を 1 つ置く。
4. 文言の現在地：見出し `01 RULE` などと工程チップの対応をはっきりさせる（今はシーン 6 つ・チップ 5 つで、RULE 画面で ② EMERGENCE が光るのが分かりにくい）。対応の仕方は任意。docs に書く。

## 検証と合格条件（Codex 側）

- file:// で `index.html` を headless Chrome で開き、`__EC` があり、begin → compare → take('A') → setPreset ×3 → exportPNG(1800×2400) → exportJSON → loadJSON が通ること。コンソールエラー 0。
- `simDeterminism(42,600)` ×2 一致、`compareStats()` の stepA === stepB、snapshot 不変、3 構図同一 hash（前回と同じ）。
- ZOOM を変えても `simDeterminism` と snapshot hash が変わらない。
- 1440×900 / 1280×800 / 390×844 / 844×390 のスクショ（RULE・COMPARE・EDIT・OUTPUT）を `verification/screenshots/` に上書き。ステージの面積比（stage の width×height ÷ viewport）を数値で報告。
- 工程チップ：未採取で ④⑤ が disabled、採取後に押せる。③ で COMPARE に入る。
- `docs/01〜04` と README を更新（file:// で開けること、ZOOM、チップ）。

## 提出

最終報告は `_codex/REPORT_02.md`（-o・日本語 2000 字以内）。
