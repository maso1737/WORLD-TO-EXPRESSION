# WORLD TO EXPRESSION — DESIGN NOTES

**2026-10-20 更新:** 初版レビューへの対応と最新の検証結果は [BRUSHUP_NOTES.md](BRUSHUP_NOTES.md) を参照。以下は初版制作時の設計・検証履歴。リンク先の検証JSONと画像は更新版に差し替えており、初版の証拠は保存済み `verification/WORLD-TO-EXPRESSION-review.zip` に残している。

制作開始: 2026-10-15 / Asia/Tokyo  
ブラウザ検証: 2026-10-16 JST  
参照リポジトリ: `maso1737/WORLD-TO-EXPRESSION`  
監査時のコミット: `8a4c3fbd5aa66223602bb30d06d96cd4c570aab2`

**FROM RULES TO WORLDS.**  
**SCROLL THROUGH THE ACT OF CREATION.**

## 制作の判断

一つの点の意味が変わり続ける作品にする。前場面の図形、間隔、輪郭、面、密度を次場面へ渡し、各教材を同じカードや同じ時間割で紹介する構成は採らない。各章のタイトルよりも、画面内で何が変わったかを先に感じられるようにする。

共有する全画面 Canvas と控えめな固定マストヘッド・フッターにより、7シーンを一つの画面として扱う。native scroll に対応した文書内の7区間から進行値を求め、画面の主導権は常に観客のスクロールに置く。停止も逆行も作品の操作になる。

この文書は設計・原典監査と実装後の検証を記録する。ブラウザで確認した範囲と未確認の環境は、末尾の Phase 5 に区別して記す。

## Phase 1 — 原典の監査

指定された README、トップ引継書、知識ハブ、L1〜L7、認識4層仕様、認識教材改善仕様、自然パターン4教材、認識教材、Emergence Engine のコンセプトと分岐図、Mindmap のスタイルを確認した。別の既存ローカルコピーから開始した監査は、対象フォルダへ取得したリポジトリで主要ファイルを照合した。差異は CRLF / LF で、主要参照ファイルの本文は一致した。

### 重要な区別

`cognitive/DEMO-SPEC_gestalt.md` の4層は、プロジェクト全体の L1〜L7 とは別の分類。

| 認識の段階 | 問い | 主体 | 本作 |
|---|---|---|---|
| GROUP | 何が仲間か | 自動的な群化 | ACT 03 |
| FOCUS | 何が主役か | 自動的な注意 | ACT 04 |
| INTERPRET | 同じ入力にどの解釈が立つか | 自動的な意味の構築 | ACT 05 |
| EDIT | 何を捨てれば認識を操作できるか | 観客 / 制作者の作為 | ACT 06 |

原典の33–45行は、EDIT を他の3層を統合するキャップストーンとして位置づける。単なる階段でもなく、解釈が群化や焦点へ戻る循環でもある。本作では最後の減算と再構成に、それ以前の図形を再登場させてこの関係を示す。

### 実際に採る計算と条件

| 題材 | 原典と計算上の根拠 | 本作での扱い |
|---|---|---|
| Fibonacci / 葉序 | `natural-patterns/fibonacci.html` 369–370, 577–585: 黄金角 `π(3−√5)`、`r=c√k`、`θ=k×黄金角` | 同じ点の系列が成長する。黄金比を普遍的な美の法則とは呼ばない |
| 黄金比 | `natural-patterns/golden-ratio.html`: φ、矩形分割、構図の比率 | 成長と構造の資料として参照する |
| Voronoi | `natural-patterns/voronoi.html` 181–195: 最近傍の母点へのユークリッド距離、Lloyd 緩和 | 母点が細胞の領域を得る。見た目だけのランダムな多角形に置き換えない |
| 反応拡散 | `natural-patterns/reaction-diffusion.html` 183, 209–227: Gray–Scott、`Da=1`, `Db=.5`, `F=.0545`, `K=.062`。近傍ラプラシアンは直交 `.2`、対角 `.05`、中心 `−1` | 同モデルから生成する状態を事前計算・保存し、進行値から参照する。ノイズ模様を反応拡散と呼ばない |
| 分岐 | `Emergence Engine/01_bifurcation_walk.html` 506–521: `x←r×x×(1−x)`、固定初期値 `.31`、300回の過渡除去後に200回サンプル | 本作では初期値 `.3141592653589793`、700回の過渡除去後に120回サンプル。560列の固定サンプルから帯構造を描く |
| Few / Many | `cognitive/few-many.html`、`natural-patterns/voronoi.html` | 即時把握から見積もりへの変化を演出。4と5を普遍的な生理学的断崖とは断定しない |
| 等長 / 等径 | `cognitive/l3-01-muller-lyer.html`, `l3-02-ponzo.html`, `l3-03-ebbinghaus.html` | 対象線の長さ・中心円の直径は同一値を使う。PROOF はその値と端点を示す |
| Rubin | `cognitive/l3-07-rubin.html` 424–432、`cognitive/svg/PROFILE_face-vase.js`、改善仕様の固定輪郭方針 | 輪郭を保ったまま図と地のトーンを転換。原典の固定キューは95 |
| アナモルフォーシス | `cognitive/l3-08-anamorphosis.html` 50–59、固定平面図の proof | 同じ文字テクスチャを持つ平面を3D回転し、透視除算した頂点へ三角形メッシュで描画。中央で正面へ整列し、PROOF は回転角を示す |

`cognitive/DEMO-SPEC_gestalt.md` 317–329 は φ の成長数学と美的選好を明確に区別する。元教材の説明にある「4の壁」も、本依頼の慎重な表現へ読み替える。既存 README / CLAUDE の古い Git 状態や実装状況は、現在のファイルの実在を優先して判断した。

### 選択と除外

採用する柱は、自然パターン、量から質への知覚、認識4層、グラフィック編集。L1 は世界の規則という背景、L5 は明示的な構図制御、L7 は統合表現の根拠として参照する。`30_Levels/L7 EXPRESSION.md` は未着手の知識ノートであり、完成済みの独立教材として紹介しない。

L6 ANIMATION 12 PRINCIPLES、12個の独立デモ、「ONE MARK / TWELVE WAYS TO THINK」の構成は除外。`cognitive/tension-animacy.html` は主章に採用しない。Benham のコマ、動きの錯視、Café wall はそれぞれの成立条件・観察時間を尊重し、本編へ詰め込まず既存ラボで補足する。

### ブランド素材

`Mindmap_GEN-EX/styles.css` の PAPER `#F2F2EF`、INK `#0A0A0A`、SIGNAL YELLOW `#FFD400` を基盤にする。COGNITIVE LIME `#C8FF1A`、EMERGENCE ICE `#5AE9FF`、NOIR `#070707` は章の役割を持つ。SPECIAL PINK `#FF2D87` は本作限定で、ACT 05 の整列する瞬間へ集中させる。

`Mindmap_GEN-EX/fonts/` に Bank Gothic、Square 721、JetBrains Mono の WOFF2、IBM Plex Sans JP が存在する。本作の CSS は Bank Gothic、Square 721、JetBrains Mono を参照し、ブランドは Bank Gothic、精密なラベルは JetBrains Mono を使う。Canvas の大判文字は `Arial Black / Arial / sans-serif` の太字、和文はシステムの Arial / Yu Gothic 系で表示する。細かなラベルは補助情報とし、重要な語句は小さくしない。

## Phase 2 — 7シーンの設計

### 00 / OPENING — THE WORLD IS NOT AN IMAGE.

- **PRIMARY PHENOMENON:** 無に近い画面から一つの点の複製が始まり、世界を結果ではなく生成として捉え直す。
- **VISUAL METAPHOR:** 大きな紙の中央に小さな点。規則的な複製の隙間から巨大な文章が現れ、黒い文字の面積が画面を反転させる。
- **HERO FRAME:** PAPER 上の大胆にクロップされた `THE WORLD / IS NOT / AN IMAGE.`。
- **MOTION VERB:** 発生 → 複製 → 切断 → 反転。
- **REVEAL:** 白い余白が黒へ切り替わり、`IT IS A PROCESS.` と読める地点。
- **HANDOFF:** 最初の点と複製された点列を ACT 01 の母点へ渡す。
- **SOURCE:** `README.md`, `00_Hub/Gen-EX.md`, `Emergence Engine/PROJECT_CONCEPT.md`。

リズムは HOLD → BUILD → BREAK。冒頭に説明段落を置かず、最初の短いスクロールの中で構図を大きく変える。

### 01 / EMERGENCE — RULES MAKE WORLDS.

- **PRIMARY PHENOMENON:** 局所的な規則が、自然物に見える秩序や複雑性を生む。
- **VISUAL METAPHOR:** 継承した点が黄金角で増殖し、母点の領域が細胞となり、その密度が Gray–Scott の縞へ移る。黒と氷色の分岐帯へ展開する。
- **HERO FRAME:** NOIR の空間を横切る、一本から二本・四本・カオスへ割れる ICE の分岐図。
- **MOTION VERB:** 増殖 → 領域化 → 反応 → 分岐。
- **REVEAL:** 個別の点に見えていたものが規則の像となり、安定から複雑性へ達する瞬間。
- **HANDOFF:** 分岐の粒子を減らし、ACT 02 の4つの点へ収束させる。
- **SOURCE:** `natural-patterns/fibonacci.html`, `golden-ratio.html`, `voronoi.html`, `reaction-diffusion.html`; `Emergence Engine/01_bifurcation_walk.html`, `PROJECT_CONCEPT.md`。

リズムは BUILD を長く取り、細胞の境界で REVEAL、分岐で BREAK。反応拡散は保存された実計算状態を使い、逆行しても同じ状態へ戻る。創作への一言は `DESIGN THE RULE. NOT THE RESULT.`。

### 02 / THRESHOLD — WHEN DOES MANY BEGIN?

- **PRIMARY PHENOMENON:** 数える対象だった点が、密度・テクスチャ・面として見え始める。
- **VISUAL METAPHOR:** ICE の雲が4点へ減り、PAPER に `04`。5、8、16、32から数百へ増え、`MANY` のドットタイポグラフィが一つの黒い面になる。
- **HERO FRAME:** 微細な点からベタの面へ変化する、画面幅の `MANY`。
- **MOTION VERB:** 減少 → 増殖 → 閾値越え → 充填。
- **REVEAL:** `04` から `MANY` への短い切替で、見ている対象の意味が変わる。
- **HANDOFF:** 文字を構成した同じ点のマトリクスを、ACT 03 の群化の素材として残す。
- **SOURCE:** `cognitive/few-many.html`, `cognitive/l2-02-density.html`, `natural-patterns/voronoi.html`。

リズムは短い HOLD → 急な BREAK → 密度の BUILD。個数の境界は芸術的な誇張で、個人差や呈示条件を含む傾向として注釈する。創作への一言は `QUANTITY BECOMES QUALITY.`。

### 03 / GROUP — YOUR BRAIN DRAWS THE REST.

- **PRIMARY PHENOMENON:** 脳が関係を読み取り、描かれていないまとまりや輪郭まで完成する。
- **VISUAL METAPHOR:** 同じ点列を近接で束ね、類似で別の群を浮かべ、線の連続へ置き換える。欠けた円弧が巨大な O を生み、群れの動きと左右対称が中央の負形をつくる。
- **HERO FRAME:** COGNITIVE LIME の大きな面に、断片だけで成立する O と広い余白。
- **MOTION VERB:** 収束 → 分類 → 補完 → 同行 → 分割。
- **REVEAL:** 円弧の間を脳がつなぐ。短い区間、または PROOF 有効時に、点線の完全な輪郭を重ねて比較する。
- **HANDOFF:** 群れの対称分割がつくる中央の余白と整列軸を、ACT 04 の焦点へ渡す。
- **SOURCE:** `cognitive/01-proximity.html`, `02-similarity.html`, `03-continuity.html`, `04-closure.html`, `05-figure-ground.html`, `06-common-fate.html`, `07-symmetry.html`; `cognitive/DEMO-SPEC_gestalt.md`。

リズムは秩序への BUILD → 補完の HOLD → 群れの HANDOFF。7法則を同じ長さで解説せず、一続きの完成作用として編集する。創作への一言は `THE IMAGE IS FINISHED IN YOUR MIND.`。

### 04 / FOCUS — DIRECT THE EYE.

- **PRIMARY PHENOMENON:** 大きさ、差、密度、余白、方向が注意の重みを変える。
- **VISUAL METAPHOR:** LIME を YELLOW の面が切断。均質なグリッドの一つが大きくなり、黒い面への反転後は黄色い小点が視線を奪う。大きな余白、画面からはみ出す01、細い線が非対称の構図へ収束する。
- **HERO FRAME:** クロップされた巨大な `01`、黒い矩形、黄色い点、線が釣り合うポスター。
- **MOTION VERB:** 強調 → 反転 → 解放 → 誘導 → 均衡。
- **REVEAL:** 面積の大きい要素が退き、小さな黄色い点が最も強く見える瞬間。
- **HANDOFF:** 視線を導いた線を ACT 05 の比較する等長線と遠近法のガイドへ渡す。
- **SOURCE:** `cognitive/l2-01-size-weight.html`, `l2-02-density.html`, `l2-03-contrast.html`, `l2-04-visual-flow.html`, `l2-05-balance.html`, `l2-06-negative-space.html`; `30_Levels/L5 VISUAL LANGUAGE.md`。

リズムは短い REVEAL を複数置き、終盤の完成構図を HOLD。視線誘導の線や「重み」はデザイン上の手がかりとして扱い、実測の視線軌跡としては提示しない。創作への一言は `ATTENTION IS A COMPOSITION.`。

### 05 / INTERPRET — SEEING IS NOT KNOWING.

- **PRIMARY PHENOMENON:** 同一寸法や同一輪郭でも、文脈と視点により見え方が変わる。
- **VISUAL METAPHOR:** 等長線と矢羽根、収束線と同じ寸法、同径の円と異なる周囲。Rubin の輪郭を保ったまま図と地が反転し、歪んだ文字が仮想視点の一点で正しく整列する。
- **HERO FRAME:** 構造が平面へ整列する瞬間にだけ現れる SPECIAL PINK と巨大なタイポグラフィ。
- **MOTION VERB:** 文脈化 → 比較 → 反転 → 圧縮 → 整列。
- **REVEAL:** PROOF が同一の寸法を示す地点と、視点による整列の地点。作品の第二の大きな山場。
- **HANDOFF:** 解釈のために加えた線、文字、周囲の図形が密度を増し、ACT 06 の編集対象になる。
- **SOURCE:** `cognitive/l3-01-muller-lyer.html`, `l3-02-ponzo.html`, `l3-03-ebbinghaus.html`, `l3-07-rubin.html`, `l3-08-anamorphosis.html`; `cognitive/svg/PROFILE_face-vase.js`; `20_Design/BRUSHUP-SPEC_cognitive.md`。

リズムは観察の HOLD → 証明の REVEAL → 図地の BREAK → 視点の長い BUILD → 短い整列。ピンクはこの章の全背景を恒常的に彩る色にせず、一度の知覚反転へ集中する。創作への一言は `CHANGE THE CONTEXT. CHANGE THE REALITY.`。

### 06 / EDIT / EXPRESSION — LESS IS AN ACT OF CREATION.

- **PRIMARY PHENOMENON:** 自動的な知覚を体験した観客が、削る行為で注意と意味を制御する側へ移る。
- **VISUAL METAPHOR:** 過密な文字と図形に `YOUR TURN`。スクロールで情報を削り、残った大文字も取り去り、一つの図形とほぼ白い画面を長く保つ。極短いワイプで蓄積した視覚言語をポスターへまとめる。
- **HERO FRAME:** PAPER / BLACK / YELLOW に、成長曲線、細胞、ドット、余白、遠近、図地、文字、グリッドが一つの構図として収まる最終画面。
- **MOTION VERB:** 選択 → 減算 → 静止 → 切断 → 再構成。
- **REVEAL:** `YOUR TURN` で主客が逆転し、静寂のあとで編集の結果が一気に立ち上がる。
- **HANDOFF:** 完成ポスターから `EXPLORE THE INTERACTIVE LAB →` を通じて既存トップへ。CAPTURE が持ち帰る一枚になる。
- **SOURCE:** `cognitive/l4-01-ma.html`, `l4-02-restraint.html`, `l4-03-whitespace.html`, `l4-04-signal-noise.html`; `30_Levels/L5 VISUAL LANGUAGE.md`, `30_Levels/L7 EXPRESSION.md`; `cognitive/DEMO-SPEC_gestalt.md` 301–313。

リズムは RELEASE → 長い HOLD → 最短の BREAK → 完成構図の HOLD。長い静止区間を「コンテンツがない区間」として詰めず、観客の注意が余白へ向く時間にする。最後のコピーは `THE WORLD / IS WHAT / YOU MAKE / OF IT.`。

## Phase 3–4 — 接続と描画

### 主要な遷移 A–H

| ID | 遷移 | 形の因果関係 / 配置 |
|---|---|---|
| A | TOPOLOGY WIPE | ACT 01 の母点から Voronoi の領域境界を拡大し、細胞の面が画面を塗り替える |
| B | TYPOGRAPHIC CUT | Opening の文字の内部・輪郭が別世界を切り出す。ACT 02 のドット文字が面の文字へなる |
| C | INVERSION CUT | Opening の紙とインク、ACT 04 の主役と背景、ACT 05 の Rubin の図と地を反転する |
| D | MATCH SHAPE | 点→母点→細胞、ドット文字→群、閉合の O→負形、線→等長比較へ形を渡す |
| E | DENSITY DISSOLVE | ACT 02 の点が密集してテクスチャから面へ変わる |
| F | NEGATIVE SPACE WIPE | ACT 04 で余白を広げて一点を強め、ACT 06 で余白が情報を押し出す |
| G | PERSPECTIVE COLLAPSE | ACT 05 の視点による歪みが、一枚の平面として整列する |
| H | SILENCE TO IMPACT | ACT 06 の長い白い静止から、短い進行区間で完成ポスターへ組み替える |

透明度の補間は補助に限定する。場面の切替はマスク、面積、配置、輪郭、密度で読めるようにする。画面を止めたときにも、現在の場面の図形に役割が残ることを目標にする。

### 実装契約

- 新規 `scroll-experience/` のみを制作範囲とし、既存トップを保持する。
- シーンごとの責任を分け、共通描画・数理モデル・スクロール計測を分離する。
- 同じ画面サイズ・正規化進行値・操作状態に対して同じ描画結果を返す。時刻や非 seed 乱数を場面の形に使わない。
- Gray–Scott の事前計算状態をキャッシュする。逆スクロールを負の時間積分で実装しない。
- 描画要求があるときだけ RAF を予約し、静止・非表示時の不要な描画を抑える。
- リサイズでは表示寸法と進行の対応を更新する。高 DPR でも内部解像度とキャッシュの上限を管理する。
- HOLD は描画進行を固定し、ページの native scroll を奪わない。
- PROOF は見た目の補助線だけでなく、何が等しいか、何を変えたかを短く示す。
- 見出し・操作・章へのリンクは DOM に保持し、Canvas のみの操作にしない。
- reduced-motion では細かな運動を減らし、章内の安定したキーフレームを選ぶ。

### レスポンシブ方針

1440×900 を主要な構図基準とする。1280×800 は文字と操作の競合、768×1024 は縦方向の余白、390×844 は横幅を使う語句の改行・クロップ位置を重点的に確認する。意図的な巨大文字のクロップと、必読文字や操作の欠落を区別する。モバイルでは情報の並びと図形の重心を組み替え、デスクトップの単純縮小にしない。

## Phase 5 — 検証記録

検証日: **2026-10-16 JST**。Windows、headless Chrome **154.0.8037.98**、`--disable-gpu` による CPU 描画。基本記録は [browser-report.json](verification/browser-report.json)（最終生成12:36 JST）、詳細記録は [detail-report.json](verification/detail-report.json)。両試験の最終終了コードは0。描画の再現性は同じブラウザ・画面サイズ・フォント環境内で確認した。

### 章内の5位置と4画面サイズ

下表の各位置を **1440×900 / 1280×800 / 768×1024 / 390×844** の4サイズで撮影し、計140枚を保存した。`100%` は次章への境界を避けるため、その章の終端から **2 CSS px 手前**。数学的に厳密な `p=1` の画面ではない。

| Scene | 0% | 25% | 50% | 75% | 100%直前 |
|---|---|---|---|---|---|
| 00 OPENING | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 |
| 01 EMERGENCE | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 |
| 02 THRESHOLD | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 |
| 03 GROUP | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 |
| 04 FOCUS | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 |
| 05 INTERPRET | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 |
| 06 EDIT / EXPRESSION | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 | 4サイズ撮影 |

全4サイズで、文書の横方向のはみ出しなし。表示される操作と章リンクの外接矩形は画面内。これは DOM の寸法確認であり、Canvas の全描画内容を自動的に判定したものではない。

全140枚を [1440](verification/contact-sheet-1440.jpg)、[1280](verification/contact-sheet-1280.jpg)、[768](verification/contact-sheet-768.jpg)、[390](verification/contact-sheet-390.jpg) の4コンタクトシートで一覧目視した。追加で [モバイル整列](verification/detail-390-alignment.png)、[デスクトップ最終ポスター](verification/detail-1440-finale.png)、[GROUP の連続](verification/1440x900-act3-50.png)、[透視描画](verification/detail-1440-perspective.png) を原寸で確認した。小画面での縦配置、主要コピーと操作、最終ポスターの文字と円形図版の分離を確認。140枚すべてを個別の原寸画像として検査したわけではない。

一覧目視で見つけた GROUP の見出しの重なりは、文字サイズと行間の調整後に原寸で解消を確認した。透視テクスチャの三角形の継ぎ目は、正面での単一描画と斜め時のクリップ拡張後、モバイル正面・デスクトップ斜めの再撮影で解消を確認した。指定された5位置の間にある反応拡散、カオス、文字マスク、錯視の証明、整列などは、別途26枚の詳細スクリーンショットを保存した。

### ブラウザ操作と状態の確認

| 検証 | 結果 | 確認方法と範囲 |
|---|---|---|
| 途中停止 | 確認 | 450ms の静止中、追加の render 呼出し0回 |
| 逆行と再訪 | 確認 | ACT 01 の反応拡散から ACT 05 へ移り、同一位置へ戻した Canvas の画像ハッシュが一致 |
| 区間をまたぐ移動 | 確認 | 全7章へのジャンプと異なる章間の移動で、表示章を確認。手動の全速度域を網羅した試験ではない |
| HOLD | 確認 | HOLD 中にホイール操作しても Canvas の画像が一致。ページのスクロールは維持 |
| リサイズ | 確認 | 1440×900 から390×844へ変更し、章状態と描画幅が更新 |
| リロード位置復元 | 確認 | ACT 03 の途中でリロードし、スクロール位置が2px未満の差で復元 |
| PROOF | 確認 | 等長線で切替前後の画像が変化。寸法・固定条件を詳細画面に表示 |
| 章ナビ | 確認 | 全7章のクリック、390幅でのタップが対応章へ移動 |
| キーボード | 確認 | PageDown で native scroll が進行。スクリーンリーダーによる全操作は未確認 |
| タッチスクロール | 確認 | CDP の `dispatchTouchEvent` で上向き `touchMove` を12回送信。位置が13901→14222に進行 |
| EXPLORE | 確認 | 詳細試験で選んだ12リンク先がすべて HTTP 200。リンク先教材自体の全機能試験は対象外 |
| reduced-motion | 確認 | media 設定の変更によりシーン別の安定キーフレームへ切替 |
| CAPTURE | 確認 | 1800×2400 PNG を保存。確認時352,624 bytes |
| `file:` 起動 | 確認 | ローカルファイルを Chrome で読み込み、初期描画が成立 |
| 実行時エラー / HTTP | 確認 | 基本・詳細試験の記録で例外0、確認対象の通信エラー0 |

最初のタッチ試験では CDP の高水準 `synthesizeScrollGesture` がスクロールを発生させず、基本記録の `emulatedTouchScroll` が false となった。同じページを `touchStart` →12回の `touchMove` → `touchEnd` で操作した詳細試験は成功した。基本試験にも直接イベント方式を採用して再実行し、最終記録の `emulatedTouchScroll` は true。これは QA 入力方式の差として記録し、実機タッチの検証とは区別する。

### 描画コストと制約

7シーンそれぞれの20進行値で、`render()` の単一呼出しをサンプリング。最終記録の最大は ACT 01 の **約3.7ms**、ACT 05 は **約3.4ms**。これは描画命令を発行する JavaScript 側の計測で、スクロールの実測 FPS や描画完了時間を保証する数値ではない。

記録した JS heap は **9,228,347 bytes（約9.2MB）**。Canvas のネイティブメモリや GPU メモリを含む総メモリ量ではなく、長時間の増減も検証していない。

制作中の確認で、弱い初期種により消滅していた Gray–Scott の状態を原典に沿う強い種へ変更し、空のスナップショットを検出するチェックを追加した。固定位置の整数ピクセル丸めも考慮して、待機と撮影位置を調整した。最終記録は修正後の結果とし、初期失敗を合格に数えない。

### 静的・数理確認

[static-report.json](verification/static-report.json) では JavaScript 11ファイルの構文検査、23テキストファイルの LF 改行、HTML のアセットとシーンの原典リンクの実在を確認し、エラー0。Voronoi は89領域、正規化領域の総面積は浮動小数誤差の範囲で4.0、最近傍の母点に属する条件を確認した。Gray–Scott の18状態はすべて非空で、二値化後にも図と地の両方が存在する。これらは静的・数値検証であり、ブラウザの見た目の確認とは別の根拠である。

**未確認:** iOS / Safari / Android 実機、実 GPU の描画・メモリ、長時間セッション、スクリーンリーダーの実使用、全進行値を連続で追った人手の映像評価。変更は新規 `scroll-experience/` の範囲のみ。公開・Git コミットは実施していない。
