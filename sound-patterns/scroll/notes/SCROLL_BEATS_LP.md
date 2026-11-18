# SCROLL_BEATS_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_BEATS_LP.html（SP-02・2026-11-03）

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

#### 作り
- 法則は `../../_law/sp02_law.js` をそのまま読む（アプリと同じ式・同じ数字）。LP 側に式は持たない。
- 骨格：章＝縦長の `section.ch`（高さ vh）＋ `position:sticky` のカード。絵は固定の canvas 1 枚。
  `locate(y)` が章 i・章の中の進み u（カードが止まっている間 0→1）・次の章へのつなぎ k（最後の 1 画面ぶん）を返す。
  状態は `stateAt(loc)` だけで決まる（Δf は平方根、音域は対数で混ぜる）。図の置き場所も k で混ぜる。
- **時間で動くのは波の位相だけ**（矢印の回転・波の流れ・うなりのランプ）。うなりは時間の現象なので、音と同じ実時間で動かす。それ以外はすべてスクロールの純関数＝逆走・REWIND がそのまま成立する。
- BLUEPRINT の線（`PATH`）は `stateAt` を章の中とつなぎで細かく取ったもの。スクロールで実際に通る道と同じ。
- 慣性：ホイールだけ目標位置を作って毎コマ近づける（6/秒）。キー・スクロールバー・タッチはブラウザのまま。`prefers-reduced-motion` では切る。
- 音：OFF ／ ♪ ON（鳴りっぱなし・周波数がスクロールを追う）／ BOW（スクロールの速さで鳴る。速さ 900 px/秒で全開、止めると約 0.5 秒の時定数で消える）。`S` キーで循環。
- スマホ（880px 未満）：図（〜36vh）→ 式の帯（光っている行だけ）→ カード の順に積む。

#### 検証フック `window.__LP`
`goto(章, u)`・`manual(true)`＋`step(秒, fps)`（裏の内蔵ブラウザは rAF が止まるので必ず手で進める）・`audio()`・`wheel(dy)`・`rewind()`・`PATH`。
内蔵ブラウザが隠れていると screenshot が真っ黒になる（`document.visibilityState === 'hidden'`）。そのときは要素の位置を数値で確かめる。
