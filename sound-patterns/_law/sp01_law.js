/* SP-01 HARMONIC LADDER — law core（法則の正本）
   音と絵（梯子・波形・周期の山）は両方ここから出す。描画・UI はこの関数を呼ぶだけで、数式を持たない。
   classic script（file:// でも読める）＋ Node でも require できる。

   1 つの音＝n = 1..N 本の正弦波（倍音）の和。n 本目の高さ fₙ = n·F0·(1 + dₙ)、強さ aₙ（0..1）。
     dₙ＝その倍音の「ずれ」（0 なら梯子の段にぴったり＝整数倍）。
   境界：全部が整数倍にそろうと 1 つの音に溶ける。1 本だけ数 % ずらすと、その 1 本が別の音として浮き出る。
   聞こえる高さの目安＝波形の自己相関（周期の山）。基音（n=1）を 0 にしても、残りが整数倍なら波形は 1/F0 ごとに繰り返す
     ＝高さは下がらない（基音の欠落）。耳は倍音どうしの「間隔」から高さを決めている。 */
(function (root) {
  'use strict';

  const F0 = 220;            // 基音（A3）
  const N = 12;              // 倍音 n = 1..12（最高 2640 Hz）
  const SHIFT_MAX = 0.08;    // ずらせる幅 ±8 %（約 ±133 セント）

  const fn = (n, d = 0) => n * F0 * (1 + d);
  const cents = d => 1200 * Math.log2(1 + d);
  const zeros = () => new Array(N).fill(0);

  // ── 音色の型（強さの並び a₁..a_N）
  const PRESETS = {
    SINE:  zeros().map((_, i) => i === 0 ? 1 : 0),                    // 純音＝1 本だけ
    SAW:   zeros().map((_, i) => 1 / (i + 1)),                        // のこぎり波＝全部を 1/n で
    ODD:   zeros().map((_, i) => (i % 2 === 0 ? 1 / (i + 1) : 0)),    // 矩形波＝奇数だけを 1/n で
    'SL-02': zeros().map((_, i) => [1, 0.25, 0.08][i] || 0)           // GENEX_NEXT SL-02 の結晶の音（§0）
  };

  // ── 聞こえる倍音：一番強い倍音の 6 % 以上（弱すぎる倍音は、ずれても浮き出ない。のこぎり波の 1/n なら 12 本とも入る）
  const AUDIBLE = 0.06;
  const audible = (amps, n) => { const mx = Math.max(...amps); return mx > 0 && amps[n - 1] > 0.02 && amps[n - 1] >= AUDIBLE * mx; };

  // ── ずれた倍音の「うねり」の速さ：梯子の段からはみ出した分 nF0·|d|（Hz）。
  //    F0 に同期させたオシロスコープでは、波形の形がこの速さで 1 周ずつ変わり続ける（整数倍なら止まって見える）。
  const drift = (n, d) => n * F0 * Math.abs(d);
  const WOBBLE_HZ = 0.25;    // 4 秒に 1 周より遅い変化は「止まっている」とみなす

  // ── 浮き出るずれの目安（％）。Moore, Glasberg & Peters (1986) の傾向をなぞった仮の線：
  //    低い倍音（n ≤ 6）はおよそ 2 % で別の音として聞こえ始める。高い倍音ほど聞き分けにくく、必要なずれが増える。
  //    個人差・音の長さで変わる。最後に決めるのは耳（READOUT は「目安」と出す）。
  const popThreshold = n => n <= 6 ? 0.02 : 0.02 * Math.pow(n / 6, 2);
  const popScore = (amps, shifts, n) => audible(amps, n) ? Math.abs(shifts[n - 1]) / popThreshold(n) : 0;

  // ── 境界の読み（READOUT）
  //    FUSED ：全部が整数倍（または、ずれた倍音が弱すぎる）＝1 つの音に溶けている。波形は止まって見える
  //    WOBBLE：ずれはあるが目安より小さい＝まだ 1 つの音だが、音色がうねる（波形の形が nF0·|d| Hz で変わる）
  //    POP   ：目安を超えてずれた倍音がある＝その 1 本が別の音として浮き出る
  function zone(amps, shifts) {
    let top = null;
    for (let n = 1; n <= N; n++) {
      if (!audible(amps, n) || shifts[n - 1] === 0) continue;
      const s = popScore(amps, shifts, n), r = drift(n, shifts[n - 1]);
      if (!top || s > top.score) top = { n, score: s, drift: r, shift: shifts[n - 1] };
    }
    if (top && top.score >= 1) return { id: 'POP', jp: '1 本が浮き出る', ...top };
    if (top && top.drift >= WOBBLE_HZ) return { id: 'WOBBLE', jp: '1 つの音のまま、うねる', ...top };
    return { id: 'FUSED', jp: '1 つの音に溶ける', ...(top || { n: 0, score: 0, drift: 0, shift: 0 }) };
  }

  // ── 周期の山：波形の自己相関（長い時間で平均した形）。r(τ) = Σ aₙ² cos(2π fₙ τ) / Σ aₙ²。
  //    τ だけずらした波形が元の波形とどれだけ重なるか。全部の倍音が同時に 1 周する τ で 1 になる。
  function autocorr(amps, shifts, tau) {
    let s = 0, w = 0;
    for (let n = 1; n <= N; n++) { const a2 = amps[n - 1] * amps[n - 1]; if (!a2) continue; s += a2 * Math.cos(2 * Math.PI * fn(n, shifts[n - 1]) * tau); w += a2; }
    return w > 0 ? s / w : 0;
  }
  const TAU_MIN = 1 / (N * F0 * (1 + SHIFT_MAX) * 1.05), TAU_MAX = 1 / 55;
  // 聞こえる高さの目安：周期の山のうち一番高いもの。高さがほぼ同じ（差 0.02 以内）なら一番早い山（＝オクターブの取り違えを避ける）
  function pitch(amps, shifts) {
    const step = 2e-6, M = Math.ceil((TAU_MAX - TAU_MIN) / step), r = new Float64Array(M + 1);
    for (let i = 0; i <= M; i++) r[i] = autocorr(amps, shifts, TAU_MIN + i * step);
    const peaks = [];
    for (let i = 1; i < M; i++) if (r[i] >= r[i - 1] && r[i] > r[i + 1]) peaks.push(i);
    if (!peaks.length) return null;
    const best = Math.max(...peaks.map(i => r[i]));
    const i = peaks.find(k => r[k] >= best - 0.02);
    // 放物線で山のてっぺんを細かく
    const y0 = r[i - 1], y1 = r[i], y2 = r[i + 1], den = y0 - 2 * y1 + y2, off = den ? 0.5 * (y0 - y2) / den : 0;
    const tau = TAU_MIN + (i + off) * step;
    return { f: 1 / tau, tau, strength: y1 };
  }

  // ── 間隔：ずれていない聞こえる倍音の番号の最大公約数 × F0。基音が無くても、間隔が F0 なら高さは F0。
  //    偶数番だけ残すと間隔は 2F0＝1 オクターブ上に聞こえる（＝耳が読んでいるのは「間隔」）
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  function spacing(amps, shifts) {
    const ns = []; for (let n = 1; n <= N; n++) if (audible(amps, n) && Math.abs(shifts[n - 1]) < 1e-9) ns.push(n);
    if (!ns.length) return null;
    const g = ns.reduce(gcd);
    return { k: g, f: g * F0, members: ns, fundPresent: ns.includes(g) };
  }

  // ── 波形（F0 に同期させたオシロスコープの見え方）。
  //    時刻 T＝k/F0（同期の瞬間）から τ 後の波形：Σ aₙ sin(2π fₙ τ + 2π nF0 dₙ T)。整数倍の倍音は T によらず同じ形。
  function wave(amps, shifts, tau, T = 0) {
    let y = 0;
    for (let n = 1; n <= N; n++) { const a = amps[n - 1]; if (!a) continue; const d = shifts[n - 1]; y += a * Math.sin(2 * Math.PI * fn(n, d) * tau + 2 * Math.PI * n * F0 * d * T); }
    return y;
  }

  // ── 音（Web Audio）。倍音ごとの正弦波の和。
  //    音量合わせ：全体の強さ（2 乗和の平方根）を level にそろえる＝基音を消しても音量は落ちない（高さだけを比べられる）。
  const hfAtt = f => f <= 1500 ? 1 : Math.sqrt(1500 / f);
  function gains(amps, shifts, level = 0.14) {
    const w = amps.map((a, i) => a * hfAtt(fn(i + 1, shifts[i])));
    const norm = Math.sqrt(w.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? w.map(v => level * v / norm) : zeros();
  }
  function playTone(ctx, dest, amps, shifts, t0, dur) {
    const G = gains(amps, shifts), nodes = [];
    for (let n = 1; n <= N; n++) {
      if (!G[n - 1]) continue;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = fn(n, shifts[n - 1]);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(G[n - 1], t0 + 0.04);
      g.gain.setValueAtTime(G[n - 1], t0 + dur - 0.04); g.gain.linearRampToValueAtTime(0, t0 + dur);
      o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.02); nodes.push(o);
    }
    return nodes;
  }
  // 聞き分けの手がかり（Helmholtz の共鳴器の代わり）：その倍音 1 本だけを短く鳴らす。直後は、溶けた音の中でもその 1 本を追える
  const PING_LEVEL = 0.1, PING_DUR = 0.7;
  function playPing(ctx, dest, n, d, t0, level = PING_LEVEL, dur = PING_DUR) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lv = level * hfAtt(fn(n, d));
    o.frequency.value = fn(n, d);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(lv, t0 + 0.02);
    g.gain.setValueAtTime(lv, t0 + dur - 0.15); g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }
  async function renderOffline(amps, shifts, dur = 1.5, sr = 44100) {
    const ctx = new OfflineAudioContext(1, Math.ceil(dur * sr), sr);
    playTone(ctx, ctx.destination, amps, shifts, 0, dur);
    return ctx.startRendering();
  }
  const rms = (data, from = 0, to = data.length) => { let s = 0; for (let i = from; i < to; i++) s += data[i] * data[i]; return Math.sqrt(s / Math.max(1, to - from)); };
  // 書き出した音の、ある周波数の強さ（検証用：その周波数の正弦・余弦との内積）
  function partialAt(data, sr, f, from = 0, len = 8192) {
    let c = 0, s = 0; for (let i = 0; i < len; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / len), v = data[from + i] * w, a = 2 * Math.PI * f * (from + i) / sr; c += v * Math.cos(a); s += v * Math.sin(a); }
    return 4 * Math.hypot(c, s) / len;
  }

  const API = { F0, N, SHIFT_MAX, AUDIBLE, WOBBLE_HZ, TAU_MIN, TAU_MAX, PING_LEVEL, PING_DUR, PRESETS,
    fn, cents, zeros, audible, drift, popThreshold, popScore, zone, autocorr, pitch, spacing, wave,
    hfAtt, gains, playTone, playPing, renderOffline, rms, partialAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SP01 = API;
})(typeof window !== 'undefined' ? window : globalThis);
