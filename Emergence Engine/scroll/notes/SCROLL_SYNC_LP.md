# SCROLL_SYNC_LP — 記録（作り・実測・検証）

> 2026-11-18 に `../CLAUDE.md` から移した。共通の作り方は `../CLAUDE.md`。

### SCROLL_SYNC_LP.html（EE-08・2026-11-03）

法則は `../../_law/ee08_sync.js`（11-03 に 08_sync.html から**そのまま**切り出した。アプリもこれを読む）。

| 章 | id | 状態（スクロールの純関数） | 図 | 光る式の項 |
|---|---|---|---|---|
| 0 | SYNC | ign の t=0 | FIELD | ωᵢ |
| 1 | CLOCK | ign の t=0・1 匹目 | CLOCK（ふつう／2 Hz で回って見る）・FIELD | ωᵢ |
| 2 | SPREAD | dephase（全員 θ=0・K 0）t 0→30 | FIELD・RING・RTRACE | ωᵢ・σ |
| 3 | PULL | 2 匹（毎コマ 0 から積分）t 0→22・K 0→0.6→1.5 | PAIR（円＋差 Δ の帯） | K |
| 4 | IGNITION | ign t 0→12 | FIELD・RING・RTRACE | K・avg・r |
| 5 | FEEDBACK | ign t 12→30 | FIELD・RING（赤＝引く力 K·r·sin）・RTRACE | r・K·r |
| 6 | THRESHOLD | k08／k18／ign を同じ t 0→60 | TRIO・RTRACE・CURVE（r(K) 実測） | K・Kc・σ |
| 7 | NEIGHBORS | waves・chim t 0→40 | WAVES・CHIM | avg（見える相手） |
| 8 | ENTRAIN | ent（120 BPM＝30 歩ごとに entrain）t 0→8 | FIELD・RING・RTRACE（拍なしと比較） | 0.06 |
| 9 | BLUEPRINT | — | CURVE（立ち寄った世界に章番号） | r・K・Kc |

#### 作り（この LP 特有）
- **時間＝スクロール**。重い計算（2400 匹）は Web Worker 3 本で起動直後に全部回して記録する（ブラウザで約 10 秒・`#calc` に進み）。
  記録は 2 歩に 1 コマ（30 コマ/秒）、位相は「2 Hz の基準からのずれ ψ＝θ−ωt」を 1/256 周で Uint8 に。
- **実時間で動くのは共通の針 ωT だけ**：表示の位相＝ψ＋ωT。全員に同じ角度を足すだけなので r は変わらない。だから止まっていても光り、逆走・REWIND もそのまま成立する。光は「針が真上を過ぎてからの時間」の exp(−τ/0.075)（アプリの TRAIL と同じ）。
- 円（RING・PAIR・CLOCK 右）は「2 Hz で一緒に回って見る」：点は止まり、光る位置の線が逆に回る。
- Worker の中身は法則の関数を `String(fn)` でつないで作る（file:// でも Blob Worker で動く）。Worker が使えなければ同じ `runner` を本体で 10 ms ずつ回す。
- 2 匹（PULL）はアプリと同じ 1 対 1 の引く力 `K·sin(θj−θi)`（degree 1）。軽いので毎コマ 0 から積分。
- 音：光の平均（ばらばら ≈ 0.15 で一定、そろうと 1 秒に 2 回 0.7 前後まで跳ねる）で帯域ノイズ（さざめき）とサイン 988 Hz（そろった鈴）を鳴らす。ENTRAIN だけ実時間の拍にキック。BOW＝スクロールの速さで鳴る（BEATS と同じ）。
- 光っていない点の明るさはアプリ（.045）より明るい .16（解説の読みやすさ優先）。
- r(K) の曲線 `RK` は Node でアプリの式を回して焼き込んだ値（FIREFLIES の位置・seed 1〜3・50〜60 秒の r の平均）。測り直しは scratchpad の `rk.js` 相当：`_law/ee08_sync.js` の SIM-BEGIN〜END を `vm.runInThisContext` で読み、`makeSync(0, seed, {k})` を 60 秒。

#### 実測（ブラウザの記録・Node と一致）
- ign：r 0.02（0 s）→ 0.32（10 s）→ 0.47（12 s）→ 0.89（20 s）→ 0.96（30 s）。0.5 越え 12.37 s・0.9 越え 20.97 s（アプリのコメントは 12.35／20.95。差は 1/30 秒の記録刻み）。
- dephase：1 → 0.61（10 s）→ 0.14（20 s）→ 0.01（30 s）。理論 exp(−σ²t²/2) と同じ形。
- k08：60 s で 0.015。k18：0.075（20 s）→ 0.156（60 s）。
- ent：拍 4 で 0.47・拍 8 で 0.87・拍 12 で 0.98（拍の直後に記録しているので Node の「拍の前」より少し高い）。
- waves：ねじれ 1024 → 30（20 s）→ 24（40 s）。
- pair：K 1.5 で差 30.0°（sin Δ* ＝ Δω⁄2K と一致）。

#### 検証フック `window.__LP`
`goto(章, u)`・`manual(true)`＋`step(秒)`（内蔵ブラウザが裏だと rAF が止まる。screenshot の前に `step` で 1 回描く）・`ready()`（各ランの記録の進み）・`DATA`・`frameOf(id, t)`・`pairAt(t)`・`lightOf(st)`・`audio()`。
