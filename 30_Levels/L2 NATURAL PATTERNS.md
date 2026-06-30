---
tags: [level, gen-ex]
level: 2
question: なぜその形になる？
status: 未着手
---

# L2 — NATURAL PATTERNS（なぜその形になる？）

戻る → [[Gen-EX]] ｜ 前 → [[L1 PHYSICAL WORLD]] ｜ 次 → [[L3 PERCEPTION]]

## ✅ 試作HTML
`natural-patterns/` フォルダ（数理パターンのインタラクティブ教材・試作中）。
- [黄金比](../natural-patterns/golden-ratio.html) / [フィボナッチ](../natural-patterns/fibonacci.html)
- [ORDER × CHAOS 反応拡散](../natural-patterns/reaction-diffusion.html) 🆕 … **L2×[[L3 PERCEPTION]] クロス**。Gray-Scott反応拡散を FEED/KILL の2スライダーで操作し「均一(無)→斑点→縞→混沌」の相転移を体感。空間エントロピー＝①認知負荷を数値化（VOID/ORDER/COMPLEX）。ドラッグで種まき・二値化proof。由来=[[2026-06-23 NotebookLM ①②差分統合分析]] D-2
- [INDIVIDUAL × TEXTURE (Voronoi)](../natural-patterns/voronoi.html) 🆕 … **L2×[[L3 PERCEPTION]] クロス**。ボロノイ細胞数を増やすと「数えられる個体(SUBITIZE/COUNT)→テクスチャ(密度)」へ変わる境界を体感。①サビタイジングの4の壁×②プロシージャル生成。RELAX(Lloyd緩和)・クリック追加・番号proof。由来=[[2026-06-23 NotebookLM ①②差分統合分析]] D-3
- 今後ここに fractal / L-system / noise を追加予定。

## 核心
自然界が自律的に形成する数理的規則性。美しさの根底にある幾何学的・動的アルゴリズム。

## 触れるパラメータ / トピック
- フィボナッチ / 黄金角 137.5°
- フラクタル（再帰深度 n）
- ボロノイ（母点数・位置）
- L-system（書き換えルール・分岐確率）
- 反応拡散（F, k）＝チューリング・パターン
- ノイズ（Perlin/Simplex：周波数 f・振幅 A）

## 関連プリミティブ
- P-04 Fibonacci Angle / P-05 Fractal Depth / P-06 Voronoi Density / P-07 Turing Wave / P-08 Noise Frequency / P-27 L-System Branch

## 出典
- [[②Gen-EX Realtime Expression Lab 設計ドキュメント]] §LEVEL 2

## 教材化メモ
- 実装候補①「反応拡散の相転移シミュレータ」(GLSL)
- ✅ **統合強化テーマ TOP2 = 実装済み**: 「秩序・混沌・自己組織化シミュレーター」→ [reaction-diffusion.html](../natural-patterns/reaction-diffusion.html)（①空間エントロピー × ②反応拡散）。→ 詳細: [[2026-06-23 NotebookLM ①②差分統合分析]]
- 🔥 **統合強化テーマ TOP3**: 「サビタイジング × Proceduralデザイン」→ ①の4個の壁（サビタイジング）× ②のボロノイ・L-system無限生成。
