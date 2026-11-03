/* SP-03 CONSONANCE — law core（法則の正本）
   音と絵は両方ここから出す。描画・UI はこの関数を呼ぶだけで、数式を持たない。
   classic script（file:// でも読める）＋ Node でも require できる。 */
(function (root) {
  'use strict';

  // ── 音色（倍音の強さ。index 0 = 基音）
  const TIMBRES = {
    sine: { name: 'SINE 純音', amps: [1] },
    sl02: { name: 'SL-02 結晶', amps: [1, 0.25, 0.08] },          // GENEX_NEXT 06_SL02 §5
    rich: { name: 'RICH 倍音6本', amps: [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6] },
  };

  // ── 純正の比（表示・吸着の候補。1 オクターブ内）
  const JUST = [
    { p: 1, q: 1, name: '1/1', jp: '同度' },
    { p: 16, q: 15, name: '16/15', jp: '短2度' },
    { p: 9, q: 8, name: '9/8', jp: '長2度' },
    { p: 6, q: 5, name: '6/5', jp: '短3度' },
    { p: 5, q: 4, name: '5/4', jp: '長3度' },
    { p: 4, q: 3, name: '4/3', jp: '完全4度' },
    { p: 45, q: 32, name: '45/32', jp: '増4度' },
    { p: 3, q: 2, name: '3/2', jp: '完全5度' },
    { p: 8, q: 5, name: '8/5', jp: '短6度' },
    { p: 5, q: 3, name: '5/3', jp: '長6度' },
    { p: 16, q: 9, name: '16/9', jp: '短7度' },
    { p: 15, q: 8, name: '15/8', jp: '長7度' },
    { p: 2, q: 1, name: '2/1', jp: 'オクターブ' },
  ];

  const cents = r => 1200 * Math.log2(r);
  const ratioOf = c => Math.pow(2, c / 1200);

  // 一番近い純正の比と、そこからのずれ（セント）
  function nearestJust(r) {
    let best = JUST[0], d = Infinity;
    for (const j of JUST) { const x = cents(r) - cents(j.p / j.q); if (Math.abs(x) < Math.abs(d)) { d = x; best = j; } }
    return { ...best, off: d };
  }

  // SL-02 の協和度 cons（06_SL02 §4.1 の表をそのまま）：1 オクターブに畳んで ±18 セント以内なら表の値、外れたら 0.05
  const CONS = [[1, 1], [2, 1], [1.5, .9], [4 / 3, .8], [5 / 4, .7], [8 / 5, .7], [6 / 5, .6], [5 / 3, .6],
    [9 / 8, .25], [16 / 9, .25], [9 / 5, .25], [15 / 8, .05], [16 / 15, .05], [45 / 32, .05]];
  function cons(r) {
    while (r >= 2 + 1e-9) r /= 2; while (r < 1 - 1e-9) r *= 2;
    let v = .05, d = 18;
    for (const [x, c] of CONS) { const e = Math.abs(cents(r) - cents(x)); if (e <= d) { d = e; v = c; } }
    return v;
  }

  // ── 倍音
  const partials = (f, amps) => amps.map((a, i) => ({ f: f * (i + 1), a, n: i + 1 }));

  // ── ざらつき（Sethares 1993：Plomp & Levelt の曲線を式にしたもの。振幅は掛け算）
  function roughPair(f1, f2, a1, a2) {
    const fmin = Math.min(f1, f2), df = Math.abs(f2 - f1), s = 0.24 / (0.0207 * fmin + 18.96);
    return a1 * a2 * (Math.exp(-3.51 * s * df) - Math.exp(-5.75 * s * df));
  }
  function roughness(f0, r, amps) {
    const p = [...partials(f0, amps), ...partials(f0 * r, amps)];
    let s = 0;
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) s += roughPair(p[i].f, p[j].f, p[i].a, p[j].a);
    return s;
  }
  // 基準＝ほぼ同じ高さの 2 音（比 1.02）。PLAN §0 の表と同じ物差し
  const roughRel = (f0, r, amps) => roughness(f0, r, amps) / roughness(f0, 1.02, amps);
  // 基準＝その音域・音色でいちばん粗い所（0〜400 セントの頂上）＝ 1。画面の物差しはこちら
  const _peak = new Map();
  function roughPeak(f0, amps) {
    const key = f0 + '|' + amps.join(',');
    if (!_peak.has(key)) { let m = 0; for (let c = 1; c <= 400; c += 2) m = Math.max(m, roughness(f0, ratioOf(c), amps)); _peak.set(key, m); }
    return _peak.get(key);
  }
  const roughNorm = (f0, r, amps) => roughness(f0, r, amps) / roughPeak(f0, amps);

  // 0〜1200 セントの曲線（roughNorm）
  function curve(f0, amps, n = 601) {
    const out = [];
    for (let i = 0; i < n; i++) { const c = 1200 * i / (n - 1); out.push({ c, d: roughNorm(f0, ratioOf(c), amps) }); }
    return out;
  }
  // 谷：±40 セントの両隣のどちらよりも 3% 以上低い所（同度・オクターブ以外）。下り坂の途中は谷にしない
  function valleys(f0, amps) {
    return JUST.filter(j => j.p !== j.q && !(j.p === 2 && j.q === 1)).map(j => {
      const r = j.p / j.q, c = roughNorm(f0, r, amps);
      const nb = Math.min(roughNorm(f0, r * ratioOf(40), amps), roughNorm(f0, r * ratioOf(-40), amps));
      return { ...j, depth: nb > 0 ? 1 - c / nb : 0 };
    }).filter(v => v.depth >= 0.03);
  }

  // ── ゆっくりしたうなり：近いのに重ならない倍音の組（|Δf| < 20 Hz）
  //    強さ＝小さい方の振幅（大きい方に対して揺れの深さが決まる）
  function beats(f0, r, amps) {
    const A = partials(f0, amps), B = partials(f0 * r, amps), out = [];
    for (const a of A) for (const b of B) {
      const df = Math.abs(a.f - b.f);
      if (df < 20) out.push({ low: a.n, high: b.n, f: (a.f + b.f) / 2, rate: df, depth: Math.min(a.a, b.a) });
    }
    return out.sort((x, y) => y.depth - x.depth);
  }

  // ── 境界の読み（READOUT）：ざらつく ROUGH ／ 揺れる BEAT ／ 溶け合う FUSE ／ 溶け合わない APART
  //    ROUGH：① が頂上の 0.45 以上。BEAT：0.3〜15 Hz の揺れで深さ 0.04 以上。
  //    残りは ②：閉じるまで 5 周以内（1 本の倍音列に乗る）なら FUSE、それより複雑なら APART
  const ROUGH_TH = 0.45, SIMPLE_TURNS = 5;
  function zone(f0, r, amps) {
    const rough = roughNorm(f0, r, amps), simple = simplicity(r);
    if (rough >= ROUGH_TH) return { id: 'ROUGH', jp: 'ざらつく', rough, simple };
    const b = beats(f0, r, amps).find(x => x.rate >= 0.3 && x.rate <= 15 && x.depth >= 0.04);
    if (b) return { id: 'BEAT', jp: '揺れる', rough, simple, beat: b };
    if (simple.turns <= SIMPLE_TURNS) return { id: 'FUSE', jp: '溶け合う', rough, simple };
    return { id: 'APART', jp: '溶け合わない', rough, simple };
  }

  // ── 比の単純さ（もう一つの協和の物差し・音色によらない）
  //    p/q の 2 音は、周波数 f/q の 1 本の倍音列に乗る。q が小さいほど「1 つの音の部分」に聞こえやすい。
  //    リサジューは q 周で閉じる。Tenney height = log2(p·q)（小さいほど単純）。SL-02 の cons の表はほぼこの順
  function simplicity(r, tol = 18) {
    const j = nearestJust(r);
    if (Math.abs(j.off) > tol) return { p: null, q: null, turns: Infinity, tenney: Infinity, name: '—' };
    return { p: j.p, q: j.q, turns: j.q, tenney: Math.log2(j.p * j.q), name: j.name };
  }

  // ── リサジュー：x = 下の音、y = 上の音。p/q にぴったりなら閉じた図形。
  //    ずれると図形の形が |q·f上 − p·f下| Hz で一周する（＝重なるはずの倍音どうしのうなりと同じ速さ）
  function lissajous(r, phase, n = 1200, turns) {
    const j = nearestJust(r), T = turns || Math.max(j.q, 1) * 2 * Math.PI, pts = [];
    for (let i = 0; i <= n; i++) { const t = T * i / n; pts.push([Math.sin(t), Math.sin(r * t + phase)]); }
    return pts;
  }
  const lissajousRate = (f0, r) => { const j = nearestJust(r); return Math.abs(j.q * f0 * r - j.p * f0); };

  // ── 平均律
  const et = semis => Math.pow(2, semis / 12);

  // ── 音（Web Audio）。2 音を同時に鳴らす。ctx は AudioContext でも OfflineAudioContext でもよい
  function playPair(ctx, dest, f0, r, amps, t0, dur, level = 0.18) {
    const nodes = [];
    const norm = 1 / amps.reduce((s, a) => s + a, 0);
    for (const f of [f0, f0 * r]) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(level * norm, t0 + 0.08);
      g.gain.setValueAtTime(level * norm, t0 + dur - 0.25);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      g.connect(dest);
      amps.forEach((a, i) => {
        if (f * (i + 1) > 16000 || a <= 0) return;
        const o = ctx.createOscillator(), ga = ctx.createGain();
        o.frequency.value = f * (i + 1); ga.gain.value = a;
        o.connect(ga).connect(g); o.start(t0); o.stop(t0 + dur + 0.02); nodes.push(o);
      });
    }
    return nodes;
  }
  // 測るための書き出し（ブラウザのみ）
  async function renderOffline(f0, r, amps, dur = 3, sr = 44100) {
    const ctx = new OfflineAudioContext(1, Math.ceil(dur * sr), sr);
    playPair(ctx, ctx.destination, f0, r, amps, 0, dur);
    return ctx.startRendering();
  }

  const F0_DEFAULT = 330;   // E4。220 Hz だと長3度の基音どうしが臨界帯域に入ってざらつき、協和の谷が埋もれる（実測 0.54）
  const API = { TIMBRES, JUST, F0_DEFAULT, ROUGH_TH, SIMPLE_TURNS, cents, ratioOf, nearestJust, cons, partials, roughPair, roughness, roughRel, roughPeak, roughNorm, curve, valleys, beats, zone, simplicity, lissajous, lissajousRate, et, playPair, renderOffline };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SP03 = API;
})(typeof window !== 'undefined' ? window : globalThis);
