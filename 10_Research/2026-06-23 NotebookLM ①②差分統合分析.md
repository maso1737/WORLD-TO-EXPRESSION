---
tags: [research, notebooklm, gen-ex, synthesis]
sources: ["[[①Gen-EX Interactive Curriculum Research]]", "[[②Gen-EX Realtime Expression Lab 設計ドキュメント]]"]
notebook_id: fedb41c0-c666-464a-be7e-79013df56af8
date: 2026-06-23
---

# NotebookLM ①②差分・統合分析（2026-06-23）

戻る → [[Gen-EX]] ｜ 前回リサーチ → [[2026-06-23 NotebookLMリサーチ ①整理]]

---

## (A) ①固有の概念・知見（深い理論的裏付け側）

①は「なぜそのように感じるか」の**認知科学・神経科学ベースの理論**に特化。

| 概念 | 内容 | 教材への示唆 |
|---|---|---|
| **イメージ・スキーマ（身体図式）** | CONTAINER / PATH / FORCE などの幼児期の身体経験がデザイン解釈のメタファーとして機能 | [[L4 GESTALT]]「INSIDE/OUTSIDE」はCONTAINERスキーマの体験として組み立て直せる |
| **視覚的緊張の数理モデル** | マルコ・コスタ研究。鋭角さ・偏位 → 精神的覚醒(Arousal)の数式 $S_{\text{tension}}$ | 角テンション・非対称性のスライダーに直結（P-30系）|
| **サビタイジング & FINST** | 4個以下は瞬時正確カウント → 超えたら「見積もりモード」への不連続な切り替え | **FEW/MANY教材のコア仕様**（100ms固定提示も）|
| **境界拡張（Boundary Extension）** | 視野制限画像を記憶するとき脳が枠外を補完・拡張するエラー | CROPテーマの認知的裏付けに使える |
| **ゲシュタルトの4大メタ原理** | 創発・具現化・多安定性・不変性 — 体制化の背後にある脳の処理原則 | [[L4 GESTALT]]に追記すべき深層理論 |

## (B) ②固有の概念・知見（実装可能な体系化側）

②は**自然界の数理パターンとアニメーション技法をパラメータとして体系化**することに特化。

| 概念 | 内容 | 教材への示唆 |
|---|---|---|
| **7階層アーキテクチャ** | 物理→自然→知覚→ゲシュタルト→視覚言語→12原則→表現 | ①の4階層にない「物理世界(L1)」「自然パターン(L2)」「表現(L7)」の3層が固有 |
| **自然界の数理パターン** | フィボナッチ・フラクタル・ボロノイ・L-system・反応拡散・Perlinノイズ | [[L2 NATURAL PATTERNS]]で試作中（`natural-patterns/`）|
| **アニメーション12原則の数理化** | Squash & Stretch / Anticipation をベクトル・ディレイで再定義 | [[L6 ANIMATION 12 PRINCIPLES]]（`12-Principles-of-Animation/`完成済）|
| **物理法則の直接操作** | 重力(g)・摩擦(μ)が「違和感」「現実感」を生む根源変数 | [[L1 PHYSICAL WORLD]]（未着手）の実装指針 |
| **拡張ロードマップ（Phase2・3）** | Phase2=生成的エコシステム、Phase3=音・時間軸 | [[L7 EXPRESSION]]の方向性 |

## (C) 名称・フレームの対応表

| 概念 | ①の名称・枠組み | ②の名称・枠組み |
|---|---|---|
| 知覚層 | LEVEL 1: PERCEPTION | LEVEL 3: PERCEPTION |
| 組織化層 | LEVEL 2: GESTALT | LEVEL 4: GESTALT |
| 設計パラメータ層 | LEVEL 3: VISUAL LANGUAGE | LEVEL 5: VISUAL LANGUAGE |
| 混沌の指標 | 空間的シャノン・エントロピー | ノイズ周波数・振幅・カオス |
| 生命感の創出 | バネ物理の実装 (K / C / M) | 12原則（Squash / Anticipation） |
| 図と地 | ゲシュタルト原則 Figure Ground | Visual Language内の「Space / Figure Depth」|

**重要な気づき**: ①は4階層（知覚・ゲシュタルト・視覚言語・グラフィックデザイン）、②は7階層（物理・自然・知覚・ゲシュタルト・視覚言語・12原則・表現）。①にない「物理」「自然パターン」「アニメーション」「表現」の4層は②が補完している。

---

## (D) 統合で最も強化される教材テーマ TOP3

### 🥇 1位: 視覚的緊張と生命感の力学ラボ（Tension & Animacy Mechanics）
- **①から**: 視覚的緊張の数理モデル（鋭角さ・偏位 → $S_{\text{tension}}$）
- **②から**: 12原則（予備動作・引き伸ばし）
- **体験**: 静止画の「刺突的な緊張」 ＋ アニメの「タメ・変形」が合致した瞬間に、図形が「意志を持つ生命体」へ昇華する臨界点。
- **対応Level**: [[L3 PERCEPTION]] × [[L6 ANIMATION 12 PRINCIPLES]]

### 🥈 2位: 秩序・混沌・自己組織化シミュレーター（Entropy & Morphogenesis）
- **①から**: 空間エントロピーによる認知負荷測定
- **②から**: 反応拡散系・フラクタルの数理パターン
- **体験**: スライダーでパターンが「均一（無）」→「シマウマ（秩序）」→「混沌」と相転移する際、脳の組織化がどこで失敗し緊張感が高まるかを数値で理解。
- **対応Level**: [[L2 NATURAL PATTERNS]] × [[L3 PERCEPTION]]

### 🥉 3位: 認知限界ハック（サビタイジング × Proceduralデザイン）
- **①から**: サビタイジング（4個の壁）・境界拡張バイアス
- **②から**: ボロノイ・L-systemによる無限要素生成
- **体験**: アルゴリズム生成ビジュアルの中で「個」として認識できる限界と「テクスチャ（密度）」として認識し始める境界をインタラクティブに探索。
- **対応Level**: [[L2 NATURAL PATTERNS]] × [[L3 PERCEPTION]]

---

## ✅ 次のアクション
- [ ] D-1「Tension & Animacy」→ [[L3 PERCEPTION]] と [[L6 ANIMATION 12 PRINCIPLES]] のノートに「統合教材候補」として追記
- [ ] D-2「Entropy & Morphogenesis」→ [[L2 NATURAL PATTERNS]] に `natural-patterns/` の次の試作候補として追記
- [ ] D-3「サビタイジング」→ [[40_Primitives]] に新規プリミティブ個票（P-31候補）として追記
- [ ] C列「①の4階層 vs ②の7階層」の差分を [[Gen-EX]] のMOCに注釈として追加
