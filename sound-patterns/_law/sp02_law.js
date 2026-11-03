/* SP-02 BEATS — law core（法則の正本）
   音と絵は両方ここから出す。描画・UI はこの関数を呼ぶだけで、数式を持たない。
   classic script（file:// でも読める）＋ Node でも require できる。
   2 音とも純音（倍音なし）。倍音が入ると SP-03 の話になる。 */
(function (root) {
  'use strict';

  // ── ざらつき（Sethares 1993。SP-03 の roughPair と同じ式・同じ定数）
  //    s が音域で変わる＝低い所ほど同じ Δf でも「近い」
  const sOf = f0 => 0.24 / (0.0207 * f0 + 18.96);
  const B1 = 3.51, B2 = 5.75;
  const roughRaw = (f0, df) => { const x = sOf(f0) * Math.abs(df); return Math.exp(-B1 * x) - Math.exp(-B2 * x); };
  // 山の頂上：d/dx = 0 → x* = ln(B2/B1)/(B2−B1)。高さは音域によらない
  const X_PEAK = Math.log(B2 / B1) / (B2 - B1);
  const R_PEAK = Math.exp(-B1 * X_PEAK) - Math.exp(-B2 * X_PEAK);
  const dfPeak = f0 => X_PEAK / sOf(f0);                 // いちばん粗い Δf（330 Hz で約 24 Hz）
  const critBand = f0 => 4 * dfPeak(f0);                 // 臨界帯域：いちばん粗いのはその 1/4 あたり（Plomp & Levelt）
  const roughNorm = (f0, df) => roughRaw(f0, df) / R_PEAK; // 頂上＝1

  // ── 境界の読み（READOUT）
  //    ONE  ：揺れが 5 秒に 1 回より遅い＝ほぼ 1 つの音
  //    BEAT ：Δf 回/秒 の揺れとして数えられる（〜15 Hz）
  //    ROUGH：速すぎて数えられず、ざらつきになる（〜臨界帯域）
  //    TWO  ：臨界帯域を超えて、2 つの音に分かれる
  const ONE_MAX = 0.2, BEAT_MAX = 15;
  function zone(f0, df) {
    const a = Math.abs(df), cb = critBand(f0), rough = roughNorm(f0, a);
    if (a < ONE_MAX) return { id: 'ONE', jp: '1 つの音', rough, cb };
    if (a < BEAT_MAX) return { id: 'BEAT', jp: '揺れる', rough, cb };
    if (a < cb) return { id: 'ROUGH', jp: 'ざらつく', rough, cb };
    return { id: 'TWO', jp: '2 つに分かれる', rough, cb };
  }

  // ── 和を積に（PROOF）：sin a + sin b = 2 cos((a−b)/2) · sin((a+b)/2)
  //    → 2 音の和 ＝ 平均の高さ f̄ の音 × ゆっくり変わる音量 2|cos(π Δf t)|。くびれは 1 秒に Δf 回
  const sum = (f1, f2, t) => Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t);
  const envelope = (df, t) => 2 * Math.abs(Math.cos(Math.PI * df * t));
  const envelopeSigned = (df, t) => 2 * Math.cos(Math.PI * df * t);
  const mean = (f1, f2) => (f1 + f2) / 2;

  // ── 音程（平均律）→ Δf。低い所ほど同じ半音でも Δf が小さい＝山に近い
  const INTERVALS = [
    { k: 1, name: 'm2', jp: '半音' },
    { k: 2, name: 'M2', jp: '全音' },
    { k: 3, name: 'm3', jp: '短3度' },
    { k: 4, name: 'M3', jp: '長3度' },
  ];
  const dfOfInterval = (f0, k) => f0 * (Math.pow(2, k / 12) - 1);
  const centsOf = (f0, df) => 1200 * Math.log2((f0 + df) / f0);

  // ── 音（Web Audio）。純音 2 つ。ctx は AudioContext でも OfflineAudioContext でもよい
  function playPair(ctx, dest, f0, df, t0, dur, level = 0.18) {
    const nodes = [];
    for (const f of [f0, f0 + df]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(level, t0 + 0.05);
      g.gain.setValueAtTime(level, t0 + dur - 0.05); g.gain.linearRampToValueAtTime(0, t0 + dur);
      o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.02); nodes.push(o);
    }
    return nodes;
  }
  async function renderOffline(f0, df, dur = 4, sr = 44100) {
    const ctx = new OfflineAudioContext(1, Math.ceil(dur * sr), sr);
    playPair(ctx, ctx.destination, f0, df, 0, dur);
    return ctx.startRendering();
  }
  // 書き出した音の「くびれ」を数える（検証用）：短い窓の RMS が 15% を下回ってから 50% に戻るまでを 1 つのくびれとし、
  //   その真ん中の時刻の間隔から 1 秒あたりの回数を出す（ヒステリシスで、ゆっくりした底のぶれを 1 つに数える）
  //   win は f̄ の周期の整数倍にする（4/f̄ など）。半端な窓だと RMS が波打ち、1 Hz で 4 倍に数えてしまう（実測）
  function countDips(data, sr, from = 0.3, to = null, win = 0.004) {
    const n = Math.round(win * sr), end = Math.floor((to == null ? data.length / sr - 0.3 : to) * sr);
    const env = [];
    for (let i = Math.floor(from * sr); i + n <= end; i += n) { let s = 0; for (let k = 0; k < n; k++) s += data[i + k] * data[i + k]; env.push(Math.sqrt(s / n)); }
    const mx = Math.max(...env), dips = [];
    let low = -1;
    for (let i = 0; i < env.length; i++) {
      if (low < 0 && env[i] < mx * 0.15) low = i;
      else if (low >= 0 && env[i] > mx * 0.5) { if (low > 0) dips.push((low + i) / 2); low = -1; }
    }
    if (dips.length < 2) return { dips: dips.length, rate: 0, max: mx };
    return { dips: dips.length, rate: (dips.length - 1) / ((dips[dips.length - 1] - dips[0]) * win), max: mx };
  }

  const F0_DEFAULT = 330, F0_MIN = 110, F0_MAX = 880, DF_MAX = 240;
  const API = { F0_DEFAULT, F0_MIN, F0_MAX, DF_MAX, ONE_MAX, BEAT_MAX, X_PEAK, R_PEAK, sOf, roughRaw, roughNorm, dfPeak, critBand, zone, sum, envelope, envelopeSigned, mean, INTERVALS, dfOfInterval, centsOf, playPair, renderOffline, countDips };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SP02 = API;
})(typeof window !== 'undefined' ? window : globalThis);
