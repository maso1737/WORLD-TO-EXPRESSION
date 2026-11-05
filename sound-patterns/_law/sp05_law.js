/* SP-05 CHLADNI — law core（法則の正本）
   音と絵（砂）は両方ここから出す。描画・UI はこの関数を呼ぶだけで、数式を持たない。
   classic script（file:// でも読める）＋ Node でも require できる。

   ⚠ 模様の「型」だけ借りている：本物の自由端の正方形板の振動は解析解が無い。
     ここでは Chladni 図形の定番の近似 φ = cos(nπx)cos(mπy) ± cos(mπx)cos(nπy)（x,y ∈ [0,1]）を使い、
     固有振動数は板の曲げ波の分散 f ∝ k² ∝ (n²+m²) に、± の分裂と「板の個体差」の小さなずれを足して決める。
     （ずれが無いと (0,5) と (3,4) のように n²+m² が同じ組が同じ高さで鳴り、模様が混ざって読めない） */
(function (root) {
  'use strict';

  // ── 板の固有振動（モード）
  const N_MAX = 9;          // n, m = 0..9
  const F_UNIT = 45;        // Hz：n²+m² = 1 の高さ（いちばん低いモードが 45 Hz 前後）
  const SPLIT = 0.035;      // ± の組の分裂（+ が少し高い）
  const IMP = 0.012;        // 個体差：m−n が大きいほど少し高い（同じ n²+m² の組を離す）
  const Q = 90;             // 共鳴の鋭さ（半値幅 ≒ f/Q）

  // 候補を全部作り、低い方から「すでに残したモードと MIN_GAP 以上離れたものだけ」残す。
  // 本物の板も高い所ほどモードが密集するが、教材では 1 つの共鳴＝1 つの模様が読めることを優先する（近すぎる組は片方だけ）。
  const MIN_GAP = 0.04;     // 隣のモードと最低 4%（≒ 68 セント・半値幅の約 5 倍）離す
  const CAND = [];
  for (let n = 0; n <= N_MAX; n++) for (let m = n + 1; m <= N_MAX; m++) for (const s of [1, -1]) {
    const k2 = n * n + m * m;
    CAND.push({ n, m, s, k2, f: F_UNIT * k2 * (1 + s * SPLIT) * (1 + IMP * (m - n)), name: `(${n},${m})${s > 0 ? '+' : '−'}` });
  }
  CAND.sort((a, b) => a.f - b.f);
  const MODES = [];
  for (const md of CAND) if (!MODES.length || md.f >= MODES[MODES.length - 1].f * (1 + MIN_GAP)) MODES.push(md);
  MODES.forEach((md, i) => { md.i = i; });
  const F_MIN = MODES[0].f * 0.8, F_MAX = MODES[MODES.length - 1].f * 1.05;
  // 1 つのモードの形（正規化前）。x,y ∈ [0,1]
  const shapeRaw = (md, x, y) => Math.cos(md.n * Math.PI * x) * Math.cos(md.m * Math.PI * y) + md.s * Math.cos(md.m * Math.PI * x) * Math.cos(md.n * Math.PI * y);
  // 正規化：板の上の φ の RMS を 0.5 に（cos·cos 1 項の RMS と同じ。最大でなく RMS でそろえるのは、
  //   低いモードは角だけ大きく揺れて中が静か＝最大でそろえると中の砂がほとんど跳ばないため）。格子 128 のセル中心で数える
  for (const md of MODES) {
    let s2 = 0, mx = 0;
    for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const v = shapeRaw(md, (i + 0.5) / 128, (j + 0.5) / 128); s2 += v * v; mx = Math.max(mx, Math.abs(v)); }
    md.norm = Math.sqrt(s2 / (128 * 128)) / 0.5 || 1;
    md.peak = mx / md.norm;   // 正規化後の |φ| の最大（角で 1〜2）
  }
  const shape = (md, x, y) => shapeRaw(md, x, y) / md.norm;

  // ── 共鳴（周波数 f で板を揺らしたとき、モードがどれだけ応えるか）
  //    砂を跳ばすのは加速度。一定の力で揺らすと、モード i の加速度 ∝ r²·H(r)、r = f/fᵢ、H = 1/(1 − r² + i r/Q)。
  //    ちょうど共鳴（r=1）で |r²H| = Q → Q で割って「共鳴のてっぺん＝1」にそろえる。
  function response(md, f) {
    const r = f / md.f, re = 1 - r * r, im = r / Q, d = re * re + im * im, k = r * r / Q;
    return { re: k * re / d, im: -k * im / d };   // 複素数（位相つき）
  }
  const respAbs = (md, f) => { const a = response(md, f); return Math.hypot(a.re, a.im); };

  // いま一番応えているモード（READOUT の主役）
  function dominant(f) {
    let best = null, bv = -1;
    for (const md of MODES) { const v = respAbs(md, f); if (v > bv) { bv = v; best = md; } }
    return { mode: best, resp: bv, cents: 1200 * Math.log2(f / best.f) };
  }
  // 次／前の共鳴（← → でモードへ飛ぶ）
  function nextMode(f, dir) {
    if (dir > 0) return MODES.find(md => md.f > f * 1.0005) || MODES[MODES.length - 1];
    for (let i = MODES.length - 1; i >= 0; i--) if (MODES[i].f < f / 1.0005) return MODES[i];
    return MODES[0];
  }
  const nearestMode = f => MODES.reduce((a, b) => Math.abs(Math.log(b.f / f)) < Math.abs(Math.log(a.f / f)) ? b : a);

  // ── 揺れの地図：板の各点の加速度の大きさ |A(x,y)| = |Σ aᵢ(f)·φᵢ(x,y)|
  //    G×G の格子（セル中心）に書く。cos の表を軸ごとに作るので 1 モードあたり掛け算 2 回。
  const _tabs = new Map();
  function cosTab(G) {
    if (_tabs.has(G)) return _tabs.get(G);
    const t = [];
    for (let n = 0; n <= N_MAX; n++) { const a = new Float32Array(G); for (let i = 0; i < G; i++) a[i] = Math.cos(n * Math.PI * (i + 0.5) / G); t.push(a); }
    _tabs.set(G, t); return t;
  }
  function field(f, G = 192, out = null, minRel = 2e-3) {
    out = out || new Float32Array(G * G);
    const C = cosTab(G), re = new Float32Array(G * G), im = new Float32Array(G * G);
    let top = 0; const act = [];
    for (const md of MODES) { const a = response(md, f), v = Math.hypot(a.re, a.im); top = Math.max(top, v); act.push([md, a, v]); }
    for (const [md, a, v] of act) {
      if (v < top * minRel) continue;
      const cn = C[md.n], cm = C[md.m], ar = a.re / md.norm, ai = a.im / md.norm, s = md.s;
      for (let j = 0; j < G; j++) {
        const cmy = cm[j], cny = cn[j], row = j * G;
        for (let i = 0; i < G; i++) { const p = cn[i] * cmy + s * cm[i] * cny; re[row + i] += ar * p; im[row + i] += ai * p; }
      }
    }
    let mx = 0;
    for (let k = 0; k < G * G; k++) { const v = Math.hypot(re[k], im[k]); out[k] = v; if (v > mx) mx = v; }
    return { G, A: out, max: mx };
  }
  // 格子からの読み出し（双一次補間）。x,y ∈ [0,1]
  function sample(F, x, y) {
    const G = F.G, gx = Math.min(G - 1.001, Math.max(0, x * G - 0.5)), gy = Math.min(G - 1.001, Math.max(0, y * G - 0.5));
    const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, A = F.A, k = j * G + i;
    return (A[k] * (1 - fx) + A[k + 1] * fx) * (1 - fy) + (A[k + G] * (1 - fx) + A[k + G + 1] * fx) * fy;
  }

  // ── 砂（境界の本体）
  //    1 粒ごとに：加速度 acc = DRIVE·|A|。acc が 1（重力）を超えた所の粒だけ跳ねる。
  //    跳ぶ距離は (acc−1) に比例・向きはでたらめ。→ 揺れの大きい所ほどよく跳ね、揺れの無い所（節線）で止まる。
  //    これだけで砂は節線に集まる（拡散の速さが場所で違うと、遅い所に溜まる）。勾配の力は入れていない。
  const DRIVE_DEFAULT = 12, JUMP = 0.010, ACC_CAP = 4;
  // DRIVE の幅：8 未満だと「止まる帯」（|A| < 1/DRIVE）が広すぎて、砂は節線でなく帯のふちに二重線で溜まる（11-05 実測）。
  //   8〜12 は節線に 1 本で集まる（12 がいちばん細い線）。16 を超えると線がちぎれて点の列になる：
  //   となりの共鳴が少し混ざるので節線の上も完全には止まっておらず、|A| < 1/DRIVE の「本当に止まる所」が線の上の点だけになるため。
  //   （|φ|<0.05 にいる粒：DRIVE 8 で 0.1 前後 → 24 で 0.9 以上＝線の芯の点に集まる）
  const DRIVE_MIN = 8, DRIVE_MAX = 24;
  function makeRng(seed = 1) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function scatter(xy, n, rand = Math.random) { for (let k = 0; k < n; k++) { xy[2 * k] = rand(); xy[2 * k + 1] = rand(); } }
  // dt 秒進める（60 fps の 1 コマ＝1/60）。戻り値：跳ねた粒の割合
  function stepSand(xy, n, F, drive, dt, rand = Math.random) {
    const sc = (F.max > 0 ? 1 : 0), stepK = JUMP * Math.sqrt(dt * 60);
    let moved = 0;
    for (let k = 0; k < n; k++) {
      const x = xy[2 * k], y = xy[2 * k + 1];
      const acc = drive * sample(F, x, y) * sc;
      if (acc <= 1) continue;
      moved++;
      const L = stepK * Math.min(acc - 1, ACC_CAP), th = rand() * 2 * Math.PI, r = L * Math.sqrt(rand());
      let nx = x + r * Math.cos(th), ny = y + r * Math.sin(th);
      if (nx < 0) nx = -nx; if (nx > 1) nx = 2 - nx;          // 縁で跳ね返る（板から落とさない）
      if (ny < 0) ny = -ny; if (ny > 1) ny = 2 - ny;
      xy[2 * k] = nx; xy[2 * k + 1] = ny;
    }
    return moved / n;
  }
  // 模様の読み（検証・READOUT）：粒のうち「いちばん応えているモードの節線の近く（|φ| < 0.15）」にいる割合。
  //   ばらまいた直後は板の面積のうちその帯が占める割合（BASE）くらい。集まると 1 に近づく。
  const LINE_W = 0.15;
  function onLines(xy, n, md) {
    let c = 0;
    for (let k = 0; k < n; k++) if (Math.abs(shape(md, xy[2 * k], xy[2 * k + 1])) < LINE_W) c++;
    return c / n;
  }
  function lineArea(md, G = 200) {
    let c = 0;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (Math.abs(shape(md, (i + 0.5) / G, (j + 0.5) / G)) < LINE_W) c++;
    return c / (G * G);
  }

  // ── 境界の読み（READOUT）
  //    いちばん揺れる所の加速度 peak = DRIVE·max|A|
  //    RING ：peak > 1 かつ 主役のモードが共鳴の半分以上 → 砂が跳ね、節線へ集まる（模様）
  //    STIR ：peak > 1 だが共鳴から外れている → 砂は動くが、決まった形にならない（いくつものモードが混ざる）
  //    STILL：peak ≤ 1 → 砂は跳ねない（ばらばらのまま震えるだけ）
  function zone(f, drive = DRIVE_DEFAULT, F = null) {
    const d = dominant(f), mx = F ? F.max : field(f, 64).max, peak = drive * mx;
    let id, jp;
    if (peak <= 1) { id = 'STILL'; jp = '砂は跳ねない'; }
    else if (d.resp >= 0.5) { id = 'RING'; jp = '模様になる'; }
    else { id = 'STIR'; jp = '動くが形にならない'; }
    return { id, jp, peak, mode: d.mode, resp: d.resp, cents: d.cents };
  }

  // ── 音（Web Audio）
  //    板を揺らす音（純音 f）＋板が応えた分だけ大きくなる。音量は同じ resp から出す。
  //    高い音は自動で絞る（2 kHz を超えたら 1/√ で下げる・6 kHz で約 0.58）。
  const hfAtt = f => f <= 2000 ? 1 : Math.sqrt(2000 / f);
  const gainOf = (f, drive = DRIVE_DEFAULT, level = 0.16) => {
    const d = dominant(f), ring = Math.min(1, d.resp);
    return level * (0.22 + 0.78 * ring) * Math.min(1.5, drive / DRIVE_DEFAULT) * hfAtt(f);
  };
  function playTone(ctx, dest, f, t0, dur, drive = DRIVE_DEFAULT) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lv = gainOf(f, drive);
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(lv, t0 + 0.05);
    g.gain.setValueAtTime(lv, t0 + dur - 0.05); g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }
  async function renderOffline(f, dur = 1, drive = DRIVE_DEFAULT, sr = 44100) {
    const ctx = new OfflineAudioContext(1, Math.ceil(dur * sr), sr);
    playTone(ctx, ctx.destination, f, 0, dur, drive);
    return ctx.startRendering();
  }
  const rms = (data, from = 0, to = data.length) => { let s = 0; for (let i = from; i < to; i++) s += data[i] * data[i]; return Math.sqrt(s / Math.max(1, to - from)); };

  // ── 声で揺らす（任意）：AnalyserNode の時間波形から基本周波数を拾う（自己相関）。拾えなければ 0。
  function detectPitch(buf, sr, fmin = 70, fmax = 1100) {
    const N = buf.length; let e = 0; for (let i = 0; i < N; i++) e += buf[i] * buf[i];
    if (Math.sqrt(e / N) < 0.01) return 0;
    const lo = Math.floor(sr / fmax), hi = Math.min(N - 1, Math.ceil(sr / fmin));
    let best = -1, bv = 0; const c = new Float32Array(hi + 2);
    for (let L = lo; L <= hi + 1; L++) { let s = 0; for (let i = 0; i + L < N; i++) s += buf[i] * buf[i + L]; c[L] = s; }
    for (let L = lo + 1; L <= hi; L++) if (c[L] > c[L - 1] && c[L] >= c[L + 1] && c[L] > bv) { bv = c[L]; best = L; }
    if (best < 0 || bv < 0.3 * e) return 0;
    const a = c[best - 1], b = c[best], d = c[best + 1], p = (a - d) / (2 * (a - 2 * b + d) || 1);
    return sr / (best + p);
  }

  const API = { N_MAX, F_UNIT, SPLIT, IMP, Q, MIN_GAP, CAND, MODES, F_MIN, F_MAX, DRIVE_DEFAULT, DRIVE_MIN, DRIVE_MAX, JUMP, ACC_CAP, LINE_W,
    shape, response, respAbs, dominant, nextMode, nearestMode, field, sample,
    makeRng, scatter, stepSand, onLines, lineArea, zone, hfAtt, gainOf, playTone, renderOffline, rms, detectPitch };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SP05 = API;
})(typeof window !== 'undefined' ? window : globalThis);
