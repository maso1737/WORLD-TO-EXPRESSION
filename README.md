# WORLD TO EXPRESSION

**Gen-EX Realtime Expression Lab** — 「触れば再現できる理解」を目的とした階層的知覚・表現教材プロジェクトの知識ベース兼制作リポジトリ。

物理世界から人間の知覚・認識、数理パターン、そして最終的な表現（Expression）までを **7階層** に体系化し、各原理を「操作可能なパラメータ」を持つインタラクティブ教材（HTML / Three.js / GLSL / Remotion）へ変換していく。

## 構成

| パス | 内容 |
|---|---|
| `00_Hub/` | 入口ノート(MOC)。`Gen-EX.md` から全体を辿れる |
| `10_Research/` | NotebookLM等の調査・要約（① DeepResearch ほか） |
| `20_Design/` | 設計ドキュメント（② 設計コンパニオン＝本体） |
| `30_Levels/` | 7階層ごとの知識ノート L1〜L7 |
| `40_Primitives/` | Perception Primitive P-01〜P-30 の個票 |
| `90_Log/` | 日付ごとの作業ログ／申し送り |
| `cognitive/` | 完成HTML — 認識エンジン（ゲシュタルト/錯視/視覚重力/余白）＋ FEW/MANY |
| `natural-patterns/` | 試作HTML — 黄金比・フィボナッチ（Level 2） |
| `scroll-experience/` | 鑑賞作品 — From rules to worlds.（世界の生成から知覚・編集へ進むスクロール体験） |
| `Emergence Engine/` | 生成作品 — 局所ルールから秩序が生じる現象を観察・操作する連作 |
| `expression-composer/` | L7 制作体験 — Boids のルールを A/B 比較 → 実粒子を採取 → 同じ素材から 3 構図 → PNG / 再現 JSON |
| `12-Principles-of-Animation/` | アニメーション12原則（独立リポジトリ・Level 6） |
| `Mindmap_GEN-EX/` | GEN-EX デザイン言語の本体＋マインドマップ・アプリ |

## 公開サイト（GitHub Pages）

https://maso1737.github.io/WORLD-TO-EXPRESSION/

- 認識エンジン: `/cognitive/index.html`
- FEW / MANY（サビタイジング）: `/cognitive/few-many.html`
- EXPRESSION COMPOSER（L7 v0.3）: `/expression-composer/`

## ツール連携

- **NotebookLM** = 調査・制作部（リサーチ/要約 → `10_Research/`）
- **Obsidian** = 記憶・知識ベース（この vault 自体・`[[wikilink]]` で接続）
- **Claude Code** = 司令塔（md編集・HTML実装・git運用）

詳細は [`CLAUDE.md`](CLAUDE.md) を参照。
