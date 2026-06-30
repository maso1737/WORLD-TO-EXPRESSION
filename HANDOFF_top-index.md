# HANDOFF — WORLD TO EXPRESSION トップページ index.html

> Claude Design 向け申し送り。**プロジェクト全体の入口となるトップ・ランディングページ**を作ってほしい。
> 出力先は **リポジトリ直下の `/index.html`**（GitHub Pages のルート = この1枚になる）。
> 公開URL: https://maso1737.github.io/WORLD-TO-EXPRESSION/

---

## 1. これは何か

**Gen-EX Realtime Expression Lab** — 「触れば再現できる理解」を目的とした階層的知覚・表現教材シリーズ。
物理世界 → 知覚 → 認識 → デザイン → アニメーション → 表現 までを **7階層** に体系化し、各原理を「操作可能なスライダー」を持つ単一HTML教材にしている。

トップページの役割 = **7階層の地図**。来訪者が「世界の見え方がどう分解されているか」を一望し、各教材へ飛べる。

---

## 2. デザイン言語（GEN-EX）— 既存DSに準拠

真実の源 = `Mindmap_GEN-EX/styles.css` の `:root` と `Mindmap_GEN-EX/skills/genex-mindmap/SKILL.md`。**新しい色や値を発明しない**。

- **パレット**: 紙白 `--bg #f2f2ef` / 近黒 `--ink #0a0a0a` / シグナルイエロー `--acc #ffd400`（**意味のある所だけ・装飾で多用しない**） / mute `#999` `#c8c8c4`
- **線**: 1px solid `#0a0a0a`、影は `0 0 0 1px ink`（ボケなし・ハード）
- **グリッド**: 極薄の計測グリッド（`--grid` 2.8% / `--grid-major` 5%）、ハッチング 8%
- **タイポ**: `--mono` JetBrains Mono（HUD/ラベル/数値）/ `--display` Bank Gothic + Square 721（見出し）/ `--jp` IBM Plex Sans JP（和文）。`font-feature-settings:"ss01","ss02","tnum"`
- **モーション**: `--ez cubic-bezier(0.2,0,0,1)`（速く入ってピタッと止まる）、120/240/380ms
- **HUDディテール**: 四隅の登録 `+` マーク、座標/ID/タイムコード読み出し、ISO-216参照、スラッシュ区切りトークン（`AR ⁄ DAILY ⁄ SERIES`）。これらは"らしさ"を担うので残す。
- フォント実体: `Mindmap_GEN-EX/fonts/`（Bank Gothic / Square 721 はローカルttf、他はGoogle Fonts）。トップページからは相対パスで読めるよう `fonts/` を用意するか CDN を使う。

> 基調は**紙白（ブランド既定）**を推奨（既存の `cognitive/index.html` と揃う）。
> ※個々の教材は内容に応じて暗ベースの派生もある（光を見せる系）。トップは紙白で良い。

---

## 3. 7階層モデル（ページの背骨）

| LV | レイヤー名 | 核心的な問い | 状態 |
|----|----------|------------|------|
| 1 | PHYSICAL WORLD | なぜ動く？ | 🔒 教材未着手 |
| 2 | NATURAL PATTERNS | なぜその形になる？ | ● 3本 |
| 3 | PERCEPTION | なぜ気づく？ | ● 多数 |
| 4 | GESTALT | なぜまとまって見える？ | ● 7本 |
| 5 | VISUAL LANGUAGE | なぜ伝わる？ | ● 10本 |
| 6 | ANIMATION 12 PRINCIPLES | なぜ生きて見える？ | ● 12本（別リポジトリ・公開済み） |
| 7 | EXPRESSION | どう表現する？ | 🔒 教材未着手 |

各レイヤーをセクション（または横スクロールの帯）にし、配下の教材カードを並べる。空のL1/L7は「COMING SOON / LOCKED」表示。

---

## 4. 教材インベントリ（全リンク・相対パス）

リンクはトップが `/index.html` 前提の相対パス。各カード = タイトル(EN) + 和名 + 1行説明 + status。

### ▸ L2 NATURAL PATTERNS（`natural-patterns/`）
- `natural-patterns/golden-ratio.html` — **GOLDEN RATIO ⁄ 黄金比** — 黄金角137.5°でグリッドが立ち上がる
- `natural-patterns/fibonacci.html` — **FIBONACCI ⁄ フィボナッチ** — 螺旋と数列
- `natural-patterns/reaction-diffusion.html` — **ORDER × CHAOS ⁄ 反応拡散** — FEED/KILLで均一→縞→混沌の相転移（L2×L3クロス）🆕
- （近日: VORONOI 個×密度 D-3）

### ▸ L3 PERCEPTION
- `cognitive/few-many.html` — **FEW ⁄ MANY ⁄ サビタイジング** — 一瞬提示で「4の壁」を体感 🆕
- 視覚重力（FOCUS）: `cognitive/l2-01-size-weight.html` サイズ＝重み / `cognitive/l2-02-density.html` 密度 / `cognitive/l2-03-contrast.html` コントラスト / `cognitive/l2-04-visual-flow.html` 視線誘導 / `cognitive/l2-05-balance.html` バランス / `cognitive/l2-06-negative-space.html` ネガティブスペース
- 錯視（INTERPRET）: `cognitive/l3-01-muller-lyer.html` ミュラー・リヤー / `l3-02-ponzo.html` ポンゾ / `l3-03-ebbinghaus.html` エビングハウス / `l3-04-cafe-wall.html` カフェウォール / `l3-05-benhams-top.html` ベンハムのコマ / `l3-06-motion-illusion.html` モーション錯視 / `l3-07-rubin.html` ルビンの壺 / `l3-08-anamorphosis.html` アナモルフォーシス

### ▸ L4 GESTALT（`cognitive/` GROUP）
- `cognitive/01-proximity.html` 近接 / `02-similarity.html` 類同 / `03-continuity.html` 連続 / `04-closure.html` 閉合 / `05-figure-ground.html` 図と地 / `06-common-fate.html` 共通運命 / `07-symmetry.html` 対称

### ▸ L5 VISUAL LANGUAGE（`cognitive/` EDIT）
- `cognitive/l4-01-ma.html` 間(Ma) / `l4-02-restraint.html` 抑制 / `l4-03-whitespace.html` 余白 / `l4-04-signal-noise.html` 情報量 S/N

### ▸ L6 ANIMATION 12 PRINCIPLES（`12-Principles-of-Animation/`・別リポジトリ）
- `12-Principles-of-Animation/index.html`（この階層は独自の一覧ページが既にある → そこへ飛ばすのが楽）
- 個別: `01-squash` … `12-pose-to-pose`（squash/anticipation/staging/arc/follow-through/easing/secondary-action/timing/exaggeration/appeal/solid-drawing/pose-to-pose）

### ▸ クロスレベル（特別枠で目立たせると良い）
- `cognitive/tension-animacy.html` — **TENSION × ANIMACY**（L3×L6）— 形の緊張×動きの生命感で「生き物」が立ち上がる
- `natural-patterns/reaction-diffusion.html` — **ORDER × CHAOS**（L2×L3）

### ▸ 既存サブハブ（深い入口）
- `cognitive/index.html` — 「認識エンジン」4層マップ（GROUP/FOCUS/INTERPRET/EDIT）。L3〜L5の教材群はここにまとまっている
- `12-Principles-of-Animation/index.html` — 12原則一覧

> 注: `cognitive/` は内部的に独自の4層（GROUP/FOCUS/INTERPRET/EDIT）で組まれている。トップでは上の **Gen-EX 7階層** に振り分けて並べてOK（対応は上記の通り）。迷ったら各サブハブへのリンクで束ねる方式でも良い。

---

## 5. 構成の提案（自由に料理してOK）

- **ヒーロー**: 「WORLD → EXPRESSION」「Gen-EX Realtime Expression Lab」。サブコピー＝"触れば再現できる理解 / I can reproduce it by touching." HUDっぽい座標・ISO参照を散らす。
- **7階層マップ**: L1→L7 を縦に積む or 環(ループ)で描く。各レイヤー見出し＝番号＋EN＋和名＋核心の問い。配下に教材カード。
- **カード**: タイトル・和名・1行・statusバッジ（LIVE / CROSS / SOON）。hoverでアクセント。クリックで該当HTMLへ。
- **空レイヤー(L1/L7)**: ロック表示で「これから」を示す（全体像として重要）。
- **フッター**: GitHub / 公開URL / "Gen-EX" マーク。

---

## 6. 制約
- 単一HTML（または最小アセット）で `/index.html` として動く。外部依存は Google Fonts ＋ ローカル `fonts/` 程度。
- リンク先は上記の相対パスを厳守（GitHub Pages ルート基準）。
- 絵文字は使わず unicode 記号（✦ ▸ ✓ ▶ + など）。
- `.nojekyll` 済みなので素のHTMLがそのまま配信される。

---

## 7. ブランド資産
- ロゴ: `Mindmap_GEN-EX/Logo/Gen-EX Logo.dc.html` / `GenexMark.dc.html`（G マーク）
- コンポーネント参照: `Mindmap_GEN-EX/Button.dc.html` / `Slider.dc.html` / `Toggle.dc.html` / `Segment.dc.html`
- DSマニフェスト: `Mindmap_GEN-EX/_ds_manifest.json`
