/* SP-06 UP & DOWN — law core（法則の正本）
   音と絵（螺旋・スペクトル・高さのゲージ）は両方ここから出す。描画・UI はこの関数を呼ぶだけで、数式を持たない。
   classic script（file:// でも読める）＋ Node でも require できる。

   音の高さには 2 つの成分がある：
     ① 音名（クロマ）＝ド→レ→…→シ→ドで一周する「輪」（角度）
     ② 高さ（ハイト）＝低い⇄高いの「線」（縦）
   ふつうの音では 2 つが一緒に動くので、音は螺旋を登る（1 オクターブ＝1 周＋1 段上）。

   シェパード音（Shepard 1964）：オクターブ違いの正弦波 K 本を、山形の音量（envelope）で重ねた音。
     x＝BASE からのオクターブ数。部品 k の位置 xₖ = k + c/12（c＝音名 0..12）・周波数 fₖ = BASE·2^xₖ・強さ aₖ = env(xₖ)。
     山の位置（mu）を止めたまま音名を上げると、部品は全部上へ動くが、上の端で消えて下の端から生まれる。
     12 半音上げると部品はちょうど 1 つずつ隣へ移る＝元と同じ音（輪だけが回る）。
   境界：山の幅 σ（オクターブ）。
     狭い山＝1 本だけが鳴る＝高さがはっきりある → 上がり続けると、どこかでストンと 1 オクターブ落ちる（線）
     広い山＝聞こえる高さ（重心）が動かない＝高さの成分が消える → 落ちる所がない＝上がり続けて聞こえる（輪だけ）
   聞こえる高さの目安＝強さの 2 乗（エネルギー）で重みづけした部品の位置の重心。
   1 歩の向き＝「輪の近い方へ回った」手がかりと「重心が動いた」手がかりの混ぜ合わせ（step）。
     6 半音（三全音）は輪のどちら回りでも同じ距離 → 広い山では音の中に答えが無い（三全音のパラドックス Deutsch 1986）。 */
(function (root) {
  'use strict';

  const BASE = 32.70319566257483;  // C1
  const K = 8;                     // 部品の数＝8 オクターブ（32.7 Hz〜8.4 kHz）
  const MU = 4;                    // 山の真ん中＝BASE から 4 オクターブ上＝C5（523.25 Hz）
  const SIG_MIN = 0.15, SIG_MAX = 2.5;      // 山の幅の範囲（オクターブ・ガウスの σ）
  const SIG_NARROW = 0.25, SIG_MID = 0.6, SIG_WIDE = 2.0;
  const MU_RANGE = 2;              // FOLLOW（山が音についていく）で動ける幅 ±2 オクターブ
  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const NAMES_JP = ['ド', 'ド♯', 'レ', 'レ♯', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ソ♯', 'ラ', 'ラ♯', 'シ'];

  const mod = (a, m) => ((a % m) + m) % m;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const freq = x => BASE * Math.pow(2, x);
  const xOf = f => Math.log2(f / BASE);
  const name = c => NAMES[mod(Math.round(c), 12)];
  const nameJp = c => NAMES_JP[mod(Math.round(c), 12)];
  // 音名の近い方の距離（半音）：−6 < d ≤ 6
  const chromaDist = (cA, cB) => { const d = mod(cB - cA, 12); return d > 6 + 1e-9 ? d - 12 : d; };

  // ── 山形の音量。ガウス（幅 σ・中心 mu）× 全体の窓（両端 0 のコサイン窓＝部品が端で生まれ・消えるときは無音）
  const win = x => (x <= 0 || x >= K) ? 0 : 0.5 - 0.5 * Math.cos(2 * Math.PI * x / K);
  const env = (x, sigma, mu = MU) => win(x) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));

  // ── 部品の並び（音名 p は何周しても良い。使うのは p mod 12）
  function partials(p, sigma, mu = MU) {
    const c = mod(p, 12), out = [];
    for (let k = 0; k < K; k++) { const x = k + c / 12; out.push({ k, x, f: freq(x), a: env(x, sigma, mu) }); }
    return out;
  }

  // ── 聞こえる高さ（重心）：Σ aₖ² xₖ / Σ aₖ²（オクターブ）。spread＝重心のまわりの広がり（標準偏差）
  function height(p, sigma, mu = MU) {
    let s = 0, w = 0, s2 = 0;
    for (const q of partials(p, sigma, mu)) { const e = q.a * q.a; s += e * q.x; s2 += e * q.x * q.x; w += e; }
    if (!(w > 0)) return { h: mu, f: freq(mu), spread: 0 };
    const h = s / w;
    return { h, f: freq(h), spread: Math.sqrt(Math.max(0, s2 / w - h * h)) };
  }

  // ── 高さの成分 H（0..1）：山の真ん中で、音名を 1 オクターブぶん動かすと聞こえる高さが何オクターブ動くか（重心の傾き）。
  //    狭い山＝部品 1 本についていく＝1。広い山＝重心が動かない＝0。
  function clarity(sigma, mu = MU) {
    const c0 = mod(12 * (mu - Math.floor(mu)), 12), dl = 0.25;
    const s = (height(c0 + dl, sigma, mu).h - height(c0 - dl, sigma, mu).h) / (2 * dl / 12);
    return clamp(s, 0, 1);
  }

  // ── 境界の読み
  //    LINE  ：高さがある（H ≥ 0.5）— 上がり続けると、どこかで落ちる
  //    BLEND ：どっちつかず
  //    CIRCLE：高さがない（H ≤ 0.05）— 輪だけ・上がり続けて聞こえる
  const LINE_H = 0.5, CIRCLE_H = 0.05;
  function zone(sigma, mu = MU) {
    const H = clarity(sigma, mu);
    if (H >= LINE_H) return { id: 'LINE', jp: '高さがある — 上がると、どこかで落ちる', H };
    if (H <= CIRCLE_H) return { id: 'CIRCLE', jp: '高さがない — 輪だけ・上がり続ける', H };
    return { id: 'BLEND', jp: '高さが薄い — どっちつかず', H };
  }

  // ── 1 歩（A→B）の向き。
  //    輪の手がかり：近い方へ回った向き。強さ 1 − |d|/6（1 半音で 0.83、6 半音でちょうど 0＝どちら回りでもない）
  //    高さの手がかり：重心が動いた向き。重み w＝重心の動き ÷ 音名の動き（0..1）＝高さがどれだけ音名についてきたか
  //    score = (1 − w)·輪 + w·sign(Δh)。|score| < AMBI なら EITHER（音の中に答えが無い）
  const AMBI = 0.05;
  function step(pA, pB, sigma, muA = MU, muB = muA) {
    const d = chromaDist(pA, pB), tri = Math.abs(Math.abs(d) - 6) < 1e-9;
    const ring = tri || !d ? 0 : Math.sign(d) * (1 - Math.abs(d) / 6);
    const hA = height(pA, sigma, muA).h, hB = height(pB, sigma, muB).h, dh = hB - hA;
    const w = d ? clamp(Math.abs(dh) / (Math.abs(d) / 12), 0, 1) : (Math.abs(dh) > 1e-6 ? 1 : 0);
    const score = (1 - w) * ring + w * Math.sign(dh);
    const dir = score > AMBI ? 'UP' : score < -AMBI ? 'DOWN' : 'EITHER';
    return { dir, score, d, tri, ring, dh, w, hA, hB };
  }

  // ── 三全音の耳の型（仮の模型・Deutsch 1986 の結果の形をなぞる）。
  //    人はそれぞれ輪のどこかに「上」を持っていて（top）、その近くの音名を高く聞く。A→A+6 は、A が top から遠い半分にいれば「上がった」。
  //    実際に top が人によって違い、育った土地の話し声の高さと関係するという報告がある。ここの top は答えから逆算するだけ。
  const earPredict = (a, top) => { const v = Math.cos(2 * Math.PI * (a - top) / 12); return Math.abs(v) < 1e-9 ? null : v < 0; };   // true＝UP
  function earFit(answers) {
    // answers: [{ a: A の音名, up: true/false }]
    const rows = [];
    for (let i = 0; i < 24; i++) {
      const top = i / 2; let agree = 0, total = 0;
      for (const r of answers) { const p = earPredict(r.a, top); if (p === null) continue; total++; if (p === !!r.up) agree++; }
      rows.push({ top, agree, total, rate: total ? agree / total : 0 });
    }
    const best = Math.max(...rows.map(r => r.rate));
    const tops = rows.filter(r => r.rate >= best - 1e-9).map(r => r.top);
    // いちばん合う top が並んだときは円の平均
    let sx = 0, sy = 0; tops.forEach(t => { sx += Math.cos(2 * Math.PI * t / 12); sy += Math.sin(2 * Math.PI * t / 12); });
    const top = mod(Math.atan2(sy, sx) * 12 / (2 * Math.PI), 12);
    const n = answers.length, ups = answers.filter(r => r.up).length;
    return { top, rate: best, tops, rows, n, ups, consistent: best >= 0.8 && ups > 0 && ups < n };
  }

  // ── 音（Web Audio）。部品ごとの正弦波の和。
  //    音量合わせ：全体の強さ（2 乗和の平方根）を level にそろえる＝山の幅を変えても音量は変わらない。高い部品は耳に強いので少し下げる。
  const hfAtt = f => f <= 1500 ? 1 : Math.sqrt(1500 / f);
  // 鳴らし続ける音のための「席」j = 0..K−1：席 j の部品は x = (j + P/12) mod K（P＝音名を何周もした通しの値）。
  //   上の端を越えた部品は下の端へ席ごと移る（そこでは窓で無音なので、周波数が飛んでもクリックしない）
  function slots(P, sigma, mu = MU, level = 0.14) {
    const x = [], f = [], w = [];
    for (let j = 0; j < K; j++) { const xj = mod(j + P / 12, K); x.push(xj); f.push(freq(xj)); w.push(env(xj, sigma, mu) * hfAtt(freq(xj))); }
    const norm = Math.sqrt(w.reduce((s, v) => s + v * v, 0));
    return { x, f, g: w.map(v => norm > 0 ? level * v / norm : 0) };
  }
  const gains = (p, sigma, mu = MU, level = 0.14) => slots(mod(p, 12), sigma, mu, level).g;   // 席 j = 部品 k（P が 0..12 のとき）
  function playShepard(ctx, dest, p, sigma, t0, dur, mu = MU, level = 0.14) {
    const S = slots(mod(p, 12), sigma, mu, level), nodes = [];
    for (let j = 0; j < K; j++) {
      if (!(S.g[j] > 1e-5)) continue;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = S.f[j];
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(S.g[j], t0 + 0.03);
      g.gain.setValueAtTime(S.g[j], t0 + dur - 0.06); g.gain.linearRampToValueAtTime(0, t0 + dur);
      o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.02); nodes.push(o);
    }
    return nodes;
  }
  // 三全音の組：A（dur）→ 少し間 → B＝A+6（dur）。Deutsch の実験と同じく 1 音 0.5 秒
  const PAIR_DUR = 0.5, PAIR_GAP = 0.1;
  function playPair(ctx, dest, a, sigma, t0, mu = MU, interval = 6) {
    playShepard(ctx, dest, a, sigma, t0, PAIR_DUR, mu);
    playShepard(ctx, dest, a + interval, sigma, t0 + PAIR_DUR + PAIR_GAP, PAIR_DUR, mu);
    return t0 + 2 * PAIR_DUR + PAIR_GAP;
  }
  async function renderOffline(p, sigma, dur = 1, mu = MU, sr = 44100) {
    const ctx = new OfflineAudioContext(1, Math.ceil(dur * sr), sr);
    playShepard(ctx, ctx.destination, p, sigma, 0, dur, mu);
    return ctx.startRendering();
  }
  // 書き出した音の、ある周波数の強さ（検証用：その周波数の正弦・余弦との内積）
  function partialAt(data, sr, f, from = 0, len = 8192) {
    let c = 0, s = 0; for (let i = 0; i < len; i++) { const ww = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / len), v = data[from + i] * ww, a = 2 * Math.PI * f * (from + i) / sr; c += v * Math.cos(a); s += v * Math.sin(a); }
    return 4 * Math.hypot(c, s) / len;
  }

  const API = { BASE, K, MU, SIG_MIN, SIG_MAX, SIG_NARROW, SIG_MID, SIG_WIDE, MU_RANGE, NAMES, NAMES_JP, LINE_H, CIRCLE_H, AMBI, PAIR_DUR, PAIR_GAP,
    mod, clamp, freq, xOf, name, nameJp, chromaDist, win, env, partials, height, clarity, zone, step, earPredict, earFit,
    hfAtt, slots, gains, playShepard, playPair, renderOffline, partialAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SP06 = API;
})(typeof window !== 'undefined' ? window : globalThis);
