/* SP-04 STANDING WAVE — law core（法則の正本）
   音と絵（弦）は両方ここから出す。描画・UI はこの関数を呼ぶだけで、数式を持たない。
   classic script（file:// でも読める）＋ Node でも require できる。

   弦：長さ 1・両端固定。固有振動は φₙ(x) = sin(nπx)、fₙ = n·F0（理想の弦＝倍音列そのもの）。
   揺らし方の近似：スピーカーで弦全体を揺らす＝どの固有振動にも同じ強さで効く（揺らす点の位置は選ばない）。
   指で軽く押さえる（フラジオレット）：押さえた点 xt で動こうとする振動ほど強く止められる。
     止める強さ ∝ sin²(nπ·xt)＝その振動の「押さえた点での揺れの大きさ」の 2 乗。節が xt にある振動だけが生き残る。 */
(function (root) {
  'use strict';

  const F0 = 110;          // 開放弦の基音（A2）
  const N = 16;            // 固有振動 n = 1..16
  const Q = 200;           // 揺らし続けたときの共鳴の鋭さ（半値幅 ≒ fₙ/Q＝約 4 セント）。
                           // 11-05：60 だと共鳴でも下の振動が m/Q ほど混ざり、n=9 以上で左側の節が止まりきらなかった（節 7/8・8/11）。200 で全部立つ
  const TOUCH_K = 0.6;     // 押さえの強さ（揺らす方）：1/Q_eff = 1/Q + TOUCH_K·sin²(nπ·xt)
  const DECAY0 = 0.6;      // はじいた音の減衰（1/秒）＝余韻 約 1.7 秒
  const TOUCH_G = 80;      // 押さえの強さ（はじく方）：γₙ = DECAY0 + TOUCH_G·sin²(nπ·xt)（節でない振動は 0.01 秒台で消える）
  const F_MIN = 40, F_MAX = F0 * 12.5;

  const fn = n => n * F0;
  const shape = (n, x) => Math.sin(n * Math.PI * x);
  // 押さえた点での揺れの 2 乗（0＝そこが節）。xt が null なら押さえていない
  const touchFactor = (n, xt) => xt == null ? 0 : Math.pow(Math.sin(n * Math.PI * xt), 2);
  const qEff = (n, xt) => 1 / (1 / Q + TOUCH_K * touchFactor(n, xt));

  // ── 揺らし続けたときの応え（複素数）。r = f/fₙ、H = 1/(1 − r² + i r/Q_eff)。
  //    振れ（変位）は 1/(ωₙ² − ω² + …) = (1/ω²)·r²H。1/ω² はどの振動にも共通なので、形は r²H で決まる。Q で割って「押さえなしの共鳴のてっぺん＝1」。
  //    （11-05：r² を落として H/Q にしたら、高い振動がみな 1/Q ずつ残って弦の形にさざ波が出た。r² があると高い振動は 1/n² で小さくなる）
  function response(n, f, xt = null) {
    const r = f / fn(n), q = qEff(n, xt), re = 1 - r * r, im = r / q, d = re * re + im * im, k = r * r / Q;
    return { re: k * re / d, im: -k * im / d };
  }
  const respAbs = (n, f, xt = null) => { const a = response(n, f, xt); return Math.hypot(a.re, a.im); };

  // 弦の各点の振れ（複素振幅）Y(x) = Σ aₙ sin(nπx)。M 点（両端を含む）
  function profile(f, xt = null, M = 241) {
    const re = new Float64Array(M), im = new Float64Array(M), A = [];
    for (let n = 1; n <= N; n++) A.push(response(n, f, xt));
    for (let j = 0; j < M; j++) {
      const x = j / (M - 1); let sr = 0, si = 0;
      for (let n = 1; n <= N; n++) { const s = shape(n, x), a = A[n - 1]; sr += a.re * s; si += a.im * s; }
      re[j] = sr; im[j] = si;
    }
    const amp = new Float64Array(M); let mx = 0;
    for (let j = 0; j < M; j++) { amp[j] = Math.hypot(re[j], im[j]); mx = Math.max(mx, amp[j]); }
    return { M, re, im, amp, max: mx };
  }
  // 時刻（位相 θ）での弦の形：y(x) = Re(Y(x)·e^{iθ})
  const displacement = (P, j, theta) => P.re[j] * Math.cos(theta) - P.im[j] * Math.sin(theta);

  // ── 形の純度：一番応えている振動が、弦の揺れ全体（各振動の強さの 2 乗の和）の何割を占めるか。
  //    共鳴では 1 に近い＝きれいな sin(nπx)・n−1 個の節が等間隔。外れるといくつもの振動が混ざった形になる。
  //    ⚠ 外れても「動かない点」自体はできる（揺らされた弦はその高さなりの形で揺れる）。違いは大きさと形の純度で、節の有無ではない（11-05 実測）。
  function purity(f, xt = null) {
    let s2 = 0, top = 0, n0 = 1;
    for (let n = 1; n <= N; n++) { const v = respAbs(n, f, xt), e = v * v * 0.5; s2 += e; if (e > top) { top = e; n0 = n; } }
    return { n: n0, purity: s2 > 0 ? top / s2 : 0 };
  }
  // 弦の内側で振れが一番小さい所の深さ（min/max）
  function nodeDepth(P) {
    const lo = Math.floor(P.M * 0.04), hi = Math.ceil(P.M * 0.96);
    let mn = Infinity; for (let j = lo; j < hi; j++) mn = Math.min(mn, P.amp[j]);
    return P.max > 0 ? mn / P.max : 1;
  }
  // 振れの谷（節の候補）の位置：内側の極小で、深さ（min/max）が lim 未満のもの。
  //   共鳴でも、下の振動が少し混ざるので節は完全には止まらない（330 Hz の 1/3 で 0.05 前後）→ lim は 0.1
  function nodesOf(P, lim = 0.1) {
    const out = [];
    for (let j = 2; j < P.M - 2; j++) if (P.amp[j] <= P.amp[j - 1] && P.amp[j] < P.amp[j + 1] && P.amp[j] / P.max < lim) out.push(j / (P.M - 1));
    return out;
  }

  // いま一番応えている振動
  function dominant(f, xt = null) {
    let best = 1, bv = -1;
    for (let n = 1; n <= N; n++) { const v = respAbs(n, f, xt); if (v > bv) { bv = v; best = n; } }
    return { n: best, resp: bv, cents: 1200 * Math.log2(f / fn(best)), free: respAbs(best, f, null) };
  }
  const nearestN = f => Math.min(N, Math.max(1, Math.round(f / F0)));
  const nextN = (f, dir) => { const k = f / F0; return Math.min(N, Math.max(1, dir > 0 ? Math.floor(k + 1e-6) + 1 : Math.ceil(k - 1e-6) - 1)); };

  // ── 境界の読み（READOUT）
  //    RING ：一番応えている振動が共鳴のてっぺんの半分以上＝弦が大きく鳴り、きれいな sin(nπx)（節が n−1 個・等間隔）
  //    MUTED：高さは合っている（押さえなしなら RING）のに、押さえた点が腹なので止められた
  //    OFF  ：固有振動から外れている＝揺れは小さく（てっぺんの 2 割前後）、いくつもの振動が混ざった形
  function zone(f, xt = null) {
    const d = dominant(f, xt), near = nearestN(f), freeNear = respAbs(near, f, null), held = respAbs(near, f, xt);
    if (d.resp >= 0.5) return { id: 'RING', jp: '鳴る・節が立つ', n: d.n, resp: d.resp, cents: d.cents };
    if (xt != null && freeNear >= 0.5 && held < 0.5) return { id: 'MUTED', jp: '押さえた点が腹で止められた', n: near, resp: held, cents: 1200 * Math.log2(f / fn(near)) };
    return { id: 'OFF', jp: '小さく、形が混ざる', n: d.n, resp: d.resp, cents: d.cents };
  }

  // ── PROOF：進む波と戻る波。弦を伝わる波の波数 k = π·f/F0（速さ c = 2·F0·長さ）。
  //    右へ進む波 ½sin(kx − θ) と、左へ戻る波 ½sin(kx + θ) の和 = sin(kx)·cos θ（止まって見える波）。
  //    x=0 では常に 0。x=1（向こうの壁）でも 0 になれるのは sin(k) = 0、つまり f = n·F0 のときだけ。
  const kOf = f => Math.PI * f / F0;
  const travel = (f, x, theta) => { const k = kOf(f); return { right: 0.5 * Math.sin(k * x - theta), left: 0.5 * Math.sin(k * x + theta), sum: Math.sin(k * x) * Math.cos(theta) }; };
  const endMismatch = f => Math.abs(Math.sin(kOf(f)));   // 向こうの壁での振れ（0＝ぴったり乗る）

  // ── はじく（PLUCK）：xp を三角形に引いて放す。n 番目の振動の強さ Aₙ = 2 sin(nπxp) / (n²π² xp(1−xp))
  //    押さえていれば、節が xt にない振動はすぐ消える（γₙ）。残った振動の並びが聞こえる高さを決める。
  function pluck(xp = 0.2, xt = null) {
    const out = [];
    for (let n = 1; n <= N; n++) out.push({ n, f: fn(n), amp: 2 * Math.sin(n * Math.PI * xp) / (n * n * Math.PI * Math.PI * xp * (1 - xp)), decay: DECAY0 + TOUCH_G * touchFactor(n, xt) });
    return out;
  }
  // はじいてから t 秒後に一番強く残っている振動（聞こえる高さの目安）
  function pluckPitch(xp, xt, t = 0.25) {
    let best = null;
    for (const p of pluck(xp, xt)) { const v = Math.abs(p.amp) * Math.exp(-p.decay * t); if (!best || v > best.v) best = { n: p.n, f: p.f, v }; }
    return best;
  }

  // ── 音（Web Audio）
  const hfAtt = f => f <= 1500 ? 1 : Math.sqrt(1500 / f);
  // 揺らし続ける音：純音 f。音量は弦の振れの最大（同じ profile から）で膨らむ
  const gainOf = (f, xt = null, level = 0.16) => level * (0.18 + 0.82 * Math.min(1, profile(f, xt, 61).max)) * hfAtt(f);
  function playDrive(ctx, dest, f, t0, dur, xt = null) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lv = gainOf(f, xt);
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(lv, t0 + 0.05);
    g.gain.setValueAtTime(lv, t0 + dur - 0.05); g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }
  // はじく音：振動ごとの正弦波を指数で減衰。
  //   音量合わせ（自動ゲイン）：押さえで生き残る振動（減衰が DECAY0 の 5 倍未満）だけの合計を level にそろえる。
  //   本物のハーモニクスは開放弦より小さい音だが、教材では「残った高さ」が聞こえることを優先する（11-05：1/4 押さえで開放弦の 1/16 だった）。
  //   すぐ消える振動は開放弦のときと同じ割合のまま（はじいた瞬間の「コツ」）＝ピークは level を大きく超えない。
  const SURVIVE = 5 * DECAY0;
  function playPluck(ctx, dest, t0, xp = 0.2, xt = null, level = 0.22, dur = 3) {
    const P = pluck(xp, xt), w = p => Math.abs(p.amp) * hfAtt(p.f);
    const sumAll = P.reduce((s, p) => s + w(p), 0) || 1, sumLive = P.reduce((s, p) => s + (p.decay < SURVIVE ? w(p) : 0), 0) || sumAll, nodes = [];
    for (const p of P) {
      const a = level * p.amp * hfAtt(p.f) / (p.decay < SURVIVE ? sumLive : sumAll); if (Math.abs(a) < 1e-5) continue;
      const o = ctx.createOscillator(), g = ctx.createGain(), end = Math.min(dur, 8 / p.decay);
      o.frequency.value = p.f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(a, t0 + 0.004);
      g.gain.setTargetAtTime(0, t0 + 0.004, 1 / p.decay);
      o.connect(g).connect(dest); o.start(t0); o.stop(t0 + end + 0.05); nodes.push(o);
    }
    return nodes;
  }
  async function renderOffline(kind, opt = {}, dur = 1.5, sr = 44100) {
    const ctx = new OfflineAudioContext(1, Math.ceil(dur * sr), sr);
    if (kind === 'pluck') playPluck(ctx, ctx.destination, 0, opt.xp ?? 0.2, opt.xt ?? null, 0.22, dur);
    else playDrive(ctx, ctx.destination, opt.f ?? F0, 0, dur, opt.xt ?? null);
    return ctx.startRendering();
  }
  const rms = (data, from = 0, to = data.length) => { let s = 0; for (let i = from; i < to; i++) s += data[i] * data[i]; return Math.sqrt(s / Math.max(1, to - from)); };
  // 書き出した音の、ある周波数の強さ（検証用：その周波数の正弦・余弦との内積）
  function partialAt(data, sr, f, from = 0, len = 4096) {
    let c = 0, s = 0; for (let i = 0; i < len; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / len), v = data[from + i] * w, a = 2 * Math.PI * f * (from + i) / sr; c += v * Math.cos(a); s += v * Math.sin(a); }
    return 4 * Math.hypot(c, s) / len;
  }

  const API = { F0, N, Q, TOUCH_K, DECAY0, TOUCH_G, SURVIVE, F_MIN, F_MAX,
    fn, shape, touchFactor, qEff, response, respAbs, profile, displacement, purity, nodeDepth, nodesOf, dominant, nearestN, nextN, zone,
    kOf, travel, endMismatch, pluck, pluckPitch, hfAtt, gainOf, playDrive, playPluck, renderOffline, rms, partialAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SP04 = API;
})(typeof window !== 'undefined' ? window : globalThis);
