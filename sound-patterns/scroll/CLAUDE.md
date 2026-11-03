# CLAUDE.md — sound-patterns/scroll（解説スクロール LP）

教材アプリ（`../0x_*.html`）と 1 対 1 で対になる「読む版」。方針は `../../20_Design/PLAN_SCROLL_EXPLAINER.md`。
入口は `../index.html`（APP と SCROLL を横に並べている）。

## SCROLL_BEATS_LP.html（SP-02・2026-11-03）

| 章 | id | 状態（スクロールの純関数） | 図 | 光る式の項 |
|---|---|---|---|---|
| 0 | BEATS | Δf 0・330 Hz | WAVES | f₁ f₂ |
| 1 | ONE | Δf 0 | PHASE・WAVES・SUM | f₁ f₂ |
| 2 | DRIFT | Δf 0→1 | 同上 | f₂・2cos |
| 3 | PROOF | Δf 1→3（平方根で補間） | PROOF（3 段＋20 ms 拡大窓） | 2cos・sin |
| 4 | BEAT | Δf 3→14 | PHASE・WAVES・SUM | 2cos |
| 5 | ROUGH | 14→いちばん粗い 23.7（止まる）→40 | SUM・CURVE | rough |
| 6 | TWO | 40→150（平方根） | EAR（模式図）・CURVE | Δf*・CB |
| 7 | REGISTER | 長3度のまま 110→440 Hz（対数） | MAP・CURVE | s・f₀・CB |
| 8 | BLUEPRINT | 長3度 440 Hz で止まる | MAP（歩いた道） | rough・s |

### 作り
- 法則は `../_law/sp02_law.js` をそのまま読む（アプリと同じ式・同じ数字）。LP 側に式は持たない。
- 骨格：章＝縦長の `section.ch`（高さ vh）＋ `position:sticky` のカード。絵は固定の canvas 1 枚。
  `locate(y)` が章 i・章の中の進み u（カードが止まっている間 0→1）・次の章へのつなぎ k（最後の 1 画面ぶん）を返す。
  状態は `stateAt(loc)` だけで決まる（Δf は平方根、音域は対数で混ぜる）。図の置き場所も k で混ぜる。
- **時間で動くのは波の位相だけ**（矢印の回転・波の流れ・うなりのランプ）。うなりは時間の現象なので、音と同じ実時間で動かす。それ以外はすべてスクロールの純関数＝逆走・REWIND がそのまま成立する。
- BLUEPRINT の線（`PATH`）は `stateAt` を章の中とつなぎで細かく取ったもの。スクロールで実際に通る道と同じ。
- 慣性：ホイールだけ目標位置を作って毎コマ近づける（6/秒）。キー・スクロールバー・タッチはブラウザのまま。`prefers-reduced-motion` では切る。
- 音：OFF ／ ♪ ON（鳴りっぱなし・周波数がスクロールを追う）／ BOW（スクロールの速さで鳴る。速さ 900 px/秒で全開、止めると約 0.5 秒の時定数で消える）。`S` キーで循環。
- スマホ（880px 未満）：図（〜36vh）→ 式の帯（光っている行だけ）→ カード の順に積む。

### 検証フック `window.__LP`
`goto(章, u)`・`manual(true)`＋`step(秒, fps)`（裏の内蔵ブラウザは rAF が止まるので必ず手で進める）・`audio()`・`wheel(dy)`・`rewind()`・`PATH`。
内蔵ブラウザが隠れていると screenshot が真っ黒になる（`document.visibilityState === 'hidden'`）。そのときは要素の位置を数値で確かめる。

## SCROLL_CONSONANCE_LP.html（SP-03・2026-11-03）

骨格・慣性・音の切替・検証フックは BEATS と同じ。状態はセント c と**音色 A（倍音 6 本の強さの配列）**で、章のあいだは要素ごとに混ぜる（純音 → RICH → SL-02 がなめらかに変わる）。法則は `../_law/sp03_law.js`。

| 章 | id | 状態 | 図（PC） | 光る式の項 |
|---|---|---|---|---|
| 0 | CONSONANCE | 同度・RICH | LADDER | n·f |
| 1 | SINE | 純音で 0→1200¢ | LADDER・CURVE | rough |
| 2 | HARMONICS | 2/1 のまま 純音→RICH | LADDER・CURVE | n·f・aᵢaⱼ |
| 3 | VALLEYS | RICH で 1200→97¢（山で止まる） | LADDER・CURVE | rough・p/q |
| 4 | FIFTH | 3/2 ぴったり | LADDER・LISS・CURVE | p/q |
| 5 | TEMPERED | 3/2 → 平均律 700¢ → 5/4 → 400¢ | 同上 | うなり |
| 6 | TIMBRE | 400¢ のまま RICH→SL-02 | 同上 | aᵢaⱼ・うなり |
| 7 | SIMPLE | 5/4 → 45/32 → 3/2 → 2/1 | LISS・RULERS・LADDER | 周回 |
| 8 | BLUEPRINT | 2/1 | RULERS（立ち寄った所に章番号） | rough・周回 |

- RULERS＝横 ① ざらつき・縦 ② 閉じる周回 q（対数）。左下の黄の角＝FUSE。立ち寄った所は `STOPS`（各章が止まっている u を `CH.at` で評価）。
- 実測（330 Hz）：平均律 5 度のうなり 1.12 Hz、平均律長3度 13.10 Hz、SL-02 にすると長3度は耳では揺れない（図形は 13.10 Hz で回る）、45/32 はざらつき 0.23・APART。

## 共通（2 本とも）
- 音の既定は **BOW**（11-03 ユーザーの好み）：最初のクリックで BOW が入る（自分で OFF を押したら入れない）。ボタンは OFF／BOW／♪ ON、`S` で同じ順に循環。
- `?ch=章&u=0..1` でその場面から開く（共有・検証用）。内蔵ブラウザが隠れているとき、`goto` だけでは screenshot が古いままなので、この URL で開き直すと撮れる。
- スマホは各章の `PM`（図 1〜2 枚）に切り替える。
