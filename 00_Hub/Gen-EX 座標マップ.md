---
tags: [hub, gen-ex, map]
status: v1（2026-10-31・「？」を中身で確定。草案 v0 は同日の Claude 相談セッション）
---

# Gen-EX 座標マップ — 実験室のアプリを WTE の階層に置く

戻る → [[Gen-EX]]

## これは何か

`Gen-EX_Realtime Expression Lab/` のアプリは、思いついたものから作ってきたので一覧（projects.js・DNA タグ）はあるが、**「どの基礎の上に立っているか」の座標が無い**。
WORLD TO EXPRESSION の 7 階層（L1〜L7）はもともと Gen-EX の理論側（[[②Gen-EX Realtime Expression Lab 設計ドキュメント]]）なので、そこへ置き直す。

- 目的は**整理**ではなく、**空白（まだ基礎の無い場所）を見えるようにする**こと。
- アプリは動かさない。projects.js も変えない。このノートが「地図」になるだけ。
- ✅＝中身（CLAUDE.md・AUDIT・HTML のパラメータ）で確認済み ／ ？＝名前と分類からの推定。
- **主を決める物差し：そのアプリが中で計算している法則。** 見た目の題材（爆発・衝撃波）ではなく、中身の仕組みで置く。
- 2026-10-31：v0 の「？」14 件をすべて ✅ にした。置き場所が変わったものは下の「確定の記録」に理由を残した。

## 階層（おさらい）

| 階層 | 問い | WTE 側の基礎 |
|---|---|---|
| [[L1 PHYSICAL WORLD]] | なぜ動く？ | ノートは**力学だけ**（g・μ・e・m）。教材なし |
| [[L2 NATURAL PATTERNS]] | なぜその形になる？ | natural-patterns（黄金比・フィボナッチ・反応拡散・ボロノイ）＋ Emergence Engine（7本） |
| [[L3 PERCEPTION]] | — | cognitive の錯視系 |
| [[L4 GESTALT]] | — | cognitive 01〜07（近接〜対称） |
| [[L5 VISUAL LANGUAGE]] | — | cognitive の構図系（大きさ・密度・コントラスト・余白…） |
| [[L6 ANIMATION 12 PRINCIPLES]] | — | 12-Principles-of-Animation（12本） |
| [[L7 EXPRESSION]] | — | Expression Physics Playground・expression-composer |

---

## 地図

**主**＝いちばん深く立っている階層。**副**＝借りている階層。

### L1 PHYSICAL WORLD — いちばん混んでいる。でも基礎ノートは力学しかない

L1 は中身で 4 つに割れる。ノートが書いているのは **1a だけ**。

| 小区分 | アプリ | 主/副 | 確度 |
|---|---|---|---|
| **1a 力学**（重さ・衝突・衝撃） | EP-01 Multiplication／EP-02 One Sphere（重力・風・温度の法則） | 主 | ✅ |
| | CUBE FALL REVERSE（重力の向きを反転して落ちる・粉砕して道を作る） | 主（副 L6） | ✅ |
| | DOT Motion Player（描いたドットがそのまま粉砕される） | 副（主 L6） | ✅ |
| | Explosion Effect Generator（煙が昇る・破片） | 副（主 L6） | ✅ |
| **1b 光学**（屈折・分散・散乱・発光） | Crystal Metamorphosis／Crystal Metamorphosis VJ／Diamond LP・Diamond LP_DR | 主 | ✅（屈折・ファセット） |
| | Optical physics of lens flare | 主（副 L3：レンズは「見え方」の装置） | ✅ |
| | Star Core Trail FX（「レンズ越しの光学現象」を描く：回折・虹色収差・光条） | 主（副 L6：祈願演出のような見せ場） | ✅ |
| | Lumina Particle VJ（光の粒 3 層：星屑・光条・ボケ） | 主（副 L6） | ✅ |
| | Aurora Paint／Aurora VJ | 主（副 L7） | ✅ |
| | **光ブラシ族**：LIGHT_BRUSH_LAB／Light Blend System／Cut Light／Shockwave FX | 主（副 L5） | ✅ |
| **1c 流体**（粘性・混ざる・流れる） | VPG Fluid Paint／VJ Fluid Paint | 主（副 L7） | ✅ |
| | Stardust Conductor（粒を動かしているのは渦の流れ場＝curl drift） | 副（主 L7） | ✅ |
| **1d 音響**（振動・共鳴・倍音） | GENEX_NEXT SL-01 SEDIMENT／SL-02 RESONANT LATTICE | 主 | ✅ |
| | Bauhaus Grid・Typo Lab・Glitch Extreme の音解析部分 | 副 | ✅（mp3 解析） |

**光ブラシ族**＝LIGHT_BRUSH_LAB/CLAUDE.md の発見どおり、「1 本の線を、ある軸に伸ばして、密度を積み上げて加算で光にする」装置。
違うのは伸ばす軸だけ（Light Blend＝ブレンド軸／Cut Light＝距離軸／Shockwave＝角度軸：直線のノイズを極座標で丸める）。
**1b の中でも「屈折・分散」（Crystal・Diamond・レンズフレア）と「発光の積み上げ」（光ブラシ族・Lumina・Aurora）は別の話**。L1b のノートを書くときはこの 2 つに分ける。

### L2 NATURAL PATTERNS

| アプリ | 主/副 | 確度 |
|---|---|---|
| 形成す経緯 KEII（ぬくもり場・履歴が形になる） | 副（主 L7） | ✅ |
| Stained Glass Generator（分割・鉛線＝等高線） | 主（副 L5） | ✅ |
| ONE RULE（Boids＝群れの規則 1 つ） | 副（主 L3） | ✅ |
| Explosion Effect Generator（煙の塊をボロノイで割る） | 副（主 L6） | ✅ |
| Causal Corruption Engine（イベント・残留） | 副（主 L7） | ✅ |

→ Gen-EX 側は少ない（v0 で置いていた Lumina・Stardust は、中身を読むと群れではなかった → L1b・L1c へ）。
**ここは WTE 側（Emergence Engine）が厚いので、借りに行ける場所**。

### L3 PERCEPTION

| アプリ | 主/副 | 確度 |
|---|---|---|
| Anamorphosis（視点が揃うと形が立つ） | 主 | ✅ |
| Interior Mapping／Room Atlas Editor（疑似的な奥行き） | 主 | ✅ |
| Camera Map FX（投影・カメラワーク） | 主（副 L6 演出） | ✅ |
| ONE RULE（視界の半径 1 つで認知が変わる） | 主（副 L4・L2） | ✅ |
| LIVE_LED_BRUSH（凸型 LED の辺を感じさせない・奥行と飛び出しの錯覚） | 主（副 L1b） | ✅ |
| Glitch Extreme | 副（見え方の破綻） | ✅ |

### L4 GESTALT

| アプリ | 主/副 | 確度 |
|---|---|---|
| （主として立つものは無い） | — | — |

→ 空白。ただし WTE の cognitive 01〜07 がそのまま基礎になっている。

### L5 VISUAL LANGUAGE

| アプリ | 主/副 | 確度 |
|---|---|---|
| Bauhaus Grid／Typo Lab／LOGO GD Maker | 主 | ✅ |
| Glitch Extreme（素材全体の質感＝デジタルの壊れ方を語彙にする） | 主（副 L3） | ✅ |
| Poster BG（明度計画：空・遠景・中景・近景を 4 段で） | 副（主 L6） | ✅ |

### L6 ANIMATION 12 PRINCIPLES（＋手描きの感覚）

| アプリ | 主/副 | 確度 |
|---|---|---|
| EFX Anime Paint／EFX Anime Creator（作画エフェクト・手描きの手触り） | 主 | ✅ |
| Inbetween Warp Lab（中割り） | 主 | ✅ |
| DOT Motion Player（ドット絵のコマを描いて再生・GO で粉砕） | 主（副 L1a） | ✅ |
| Explosion Effect Generator（作画の爆発の型：白コマ・セル煙・破片・火の粉） | 主（副 L1a・L2） | ✅ |
| Sumi Cat（墨の手描き） | 主（副 L5） | ✅ |
| Poster BG（ポスターカラーの刷毛：水消し・一発仕上げ・最後の光の点） | 主（副 L5） | ✅ |

→ 12 原則は「動きの法則」まで。**「手で描いた感じがどこから来るか」（線の揺れ・筆圧・塗りむら・撮影処理）は基礎ノートが無い**。
v1 でここに Poster BG と Explosion が加わり、**L6 の「手描き・作画の型」はアプリが 6 本になった**（EFX×2・Inbetween・Sumi Cat・Poster BG・Explosion）。空白の大きさは L1d に次ぐ。
EFX Anime Paint を「わけわからずやっていた」のはここ。ANIxOBNxCOM 側の brush-lab・depth-brush-lab が一番近い基礎。

### L7 EXPRESSION（法則どうしを組んで作品にする）

| アプリ | 主/副 | 確度 |
|---|---|---|
| 形成す経緯 KEII／Causal Corruption Engine | 主 | ✅ |
| Stardust Conductor（手の追跡→身体が入力） | 主 | ✅ |
| GENEX_NEXT（SOUND IS A LAW シリーズ全体） | 主 | ✅ |

### 座標の外（道具）

GEN-EX Mindmap・Model Maker Z（ZBrush のエクステンダー的な 3D モデリング）— 表現の階層ではなく、作る・整理するための道具。✅

### 確定の記録（2026-10-31・v0 → v1）

| アプリ | v0（推定） | v1（確定） | 理由（読んだもの） |
|---|---|---|---|
| Shockwave FX | L1a 主 | **L1b 主**（光ブラシ族） | 衝撃の物理は計算していない。フラクタルノイズを極座標で丸めて加算で光らせる（`Shockwave/Shockwave.md`・LIGHT_BRUSH_LAB の「角度軸」） |
| Explosion Effect Generator | L1a 主 | **L6 主**（副 L1a・L2） | パラメータが白コマ・セル煙・破片・火の粉＝作画の爆発の型。煙はボロノイで割る（`cel_explosion_sandbox.html`） |
| CUBE FALL REVERSE | L1a 主 | 変わらず | 重力の向きを反転して落ちる・身体を砕いて道を作る（`cube-fall.html`） |
| DOT Motion Player | L6 主 | 変わらず（副 L1a を追加） | 「描いた絵が、そのまま壊れる」（`SPEC_CREATE_AND_PLAY_v1.md`） |
| Light Blend／Cut Light／LIGHT_BRUSH_LAB | L1b 主 | 変わらず | 線を軸に伸ばして密度を加算する（LIGHT_BRUSH_LAB/CLAUDE.md・Light Blend の DeepResearch：SDF＋非対称フォールオフ＋ブルーム＋ACES） |
| Star Core Trail FX | L1b 主（副 L5） | L1b 主（**副 L6**） | 仕様書が「レンズ越しの光学現象」を目的に掲げる。見本は祈願演出・ライブ照明（`STAR CORE TRAIL FX.txt`） |
| LIVE_LED_BRUSH | L1b 主 | **L3 主**（副 L1b） | 中心の問いは「LED の辺（すき間）を感じさせない」「奥行・飛び出しの錯覚」＝見え方の設計（CLAUDE.md・CONSULT_2_奥行と錯覚） |
| Lumina Particle VJ | L2 副 | **L1b 主** | 群れの規則は無い。円軌道の光の粒 3 層（星屑・光条・ボケ）＋ブルーム |
| Stardust Conductor | L2 副 | **L1c 副**（主 L7 は変わらず） | 群れではなく、GPGPU の粒を渦の流れ場（curl drift）と手の力で動かす（`SPEC_v2_BRUSHUP.md`） |
| Glitch Extreme | L3 副 | **L5 主**（副 L3） | 素材全体の質感を壊す側（場所と時間で壊すのは CCE）（`Glitch Extreme/CLAUDE.md` の役割分担） |
| Poster BG | L5 主（副 L6） | **L6 主**（副 L5） | 中心は刷毛の手触り・水消し・一発仕上げ。明度計画は借りている（`PLAN_POSTER_BG.md`） |
| Model Maker Z | 道具（？） | 道具 | ZBrush の Extender デフォーマーを参考にしたモデリング（`エクステンダー.txt`） |

---

## 空白と、そこから出てくる次の一手

| 空白 | 症状として出ていたこと | 埋め方の案 |
|---|---|---|
| **L1d 音響**（基礎ゼロ） | GENEX_NEXT がピンと来ない。SL-02 の「協和/不協和が聞き分けられないと因果が見えない」不安 | **音の教材 5〜6 本**：倍音列／うなり／定在波／クラドニ図形／協和比（純正律）／音の高さと上下の対応 |
| **L1b 光学**（ノート無し・アプリ最多＝v1 で 13 本） | レンズフレア・オーロラで「急にリアルへ」振れた | アプリはもうある。**ノートだけ書く**。節は 2 つ：①屈折・分散・散乱・レンズの不完全さ ②発光の積み上げ（加算・ブルーム・トーンマップ＝光ブラシ族の共通文法）。教材化は不要かも |
| **L1c 流体** | — | 優先度低。VPG で足りている |
| **L6 手描きの感覚** | EFX Anime Paint を手探りで作っていた | ANIxOBNxCOM（brush-lab）を基礎として紐づける。新しく作るより「つなぐ」 |
| **L4 GESTALT（Gen-EX 側）** | — | 空白のままで良い。WTE 側が厚い |

**いちばん効くのは L1d 音響。** Emergence Engine が natural-patterns の上で生まれたのと同じ道を、音でもう一度通る。

## 運用

- 新しいアプリを Gen-EX に足したら、このマップの該当階層に 1 行足す（projects.js と同じタイミング）。
- 「？」を ✅ にするのは中身を読んだとき。分類を変えたら理由を 1 行残す。
- P 番号（[[40_Primitives]]）は Primitive カードを書いたときに足す。カードには「**この数式・法則の核＝何が見えたら成功か**」を書く。カスタムして遊ぶときは、この核だけ守る（GENEX_NEXT 07_LOOKDEV の「法則は変えず、描画だけ差し替える」と同じ考え方）。
