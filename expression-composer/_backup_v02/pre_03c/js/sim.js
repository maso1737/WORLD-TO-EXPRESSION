(() => {
'use strict';
window.EC = window.EC || {};
// Normalized toroidal world. One update is exactly 1/60 simulation second.
const DT = 1 / 60;
const COUNT = 600;
const RULE_PRESETS = Object.freeze({
  COHERE: Object.freeze({ separate: 1.4, align: 1.5, cohere: 0.65, noise: 0.03, alignOn: true }),
  DRIFT: Object.freeze({ separate: 1.2, align: 2.6, cohere: 0.12, noise: 0.02, alignOn: true }),
  FRACTURE: Object.freeze({ separate: 2.4, align: 0.45, cohere: 0.3, noise: 0.3, alignOn: true }),
});
const DEFAULT_RULES = RULE_PRESETS.COHERE;
function finite(value, min, max, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name}: ${min}〜${max} の有限数が必要です。`);
  }
  return value;
}
function integer(value, min, max, name) {
  finite(value, min, max, name);
  if (!Number.isInteger(value)) throw new Error(`${name}: 整数が必要です。`);
  return value;
}
function sanitizeRules(partial, base = DEFAULT_RULES) {
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) throw new Error('rules: オブジェクトが必要です。');
  const r = { ...base };
  for (const k of ['separate', 'align', 'cohere', 'noise']) {
    if (Object.hasOwn(partial, k)) r[k] = finite(partial[k], 0, k === 'noise' ? 1 : 3, k);
  }
  if (Object.hasOwn(partial, 'alignOn')) {
    if (typeof partial.alignOn !== 'boolean') throw new Error('alignOn: boolean が必要です。');
    r.alignOn = partial.alignOn;
  }
  return r;
}
function random(sim) {
  sim.rng = (sim.rng + 0x6D2B79F5) >>> 0;
  let t = Math.imul(sim.rng ^ sim.rng >>> 15, 1 | sim.rng);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function createSim(seed = 42, rules = DEFAULT_RULES, count = COUNT) {
  integer(seed, 0, 4294967295, 'seed');
  integer(count, 300, 800, 'count');
  const sim = { seed, rng: seed, step: 0, rules: sanitizeRules(rules), particles: [],
    head: new Int32Array(64), next: new Int32Array(count), velocities: new Float64Array(count * 2) };
  for (let id = 0; id < count; id++) {
    const x = random(sim), y = random(sim), a = random(sim) * Math.PI * 2;
    sim.particles.push({ id, x, y, vx: Math.cos(a) * 0.0035, vy: Math.sin(a) * 0.0035 });
  }
  return sim;
}
const wrapDelta = x => x > 0.5 ? x - 1 : x < -0.5 ? x + 1 : x;
const SPEED = 0.0035, FORCE = SPEED * 0.06, VIEW2 = 0.12 ** 2, SEP2 = 0.023 ** 2;
function steering(dx, dy, vx, vy) {
  const l = Math.hypot(dx, dy);
  if (l < 1e-12) return [0, 0];
  let x = dx / l * SPEED - vx, y = dy / l * SPEED - vy;
  const k = Math.min(1, FORCE / (Math.hypot(x, y) || 1));
  return [x * k, y * k];
}
function stepSim(sim, steps = 1) {
  integer(steps, 0, 10000, 'steps');
  const p = sim.particles, r = sim.rules, { head, next, velocities } = sim;
  for (let tick = 0; tick < steps; tick++) {
    head.fill(-1);
    for (let i = 0; i < p.length; i++) {
      const cell = Math.floor(p[i].y * 8) * 8 + Math.floor(p[i].x * 8);
      next[i] = head[cell]; head[cell] = i;
    }
    for (let i = 0; i < p.length; i++) {
      const a = p[i], ix = Math.floor(a.x * 8), iy = Math.floor(a.y * 8);
      const speed = Math.hypot(a.vx, a.vy);
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, neighbors = 0, near = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const cell = ((iy + oy + 8) % 8) * 8 + (ix + ox + 8) % 8;
        for (let j = head[cell]; j !== -1; j = next[j]) {
          if (j === i) continue;
          const b = p[j], dx = wrapDelta(b.x - a.x), dy = wrapDelta(b.y - a.y), d2 = dx * dx + dy * dy;
          if (d2 === 0 || d2 > VIEW2 || dx * a.vx + dy * a.vy < -Math.SQRT1_2 * Math.sqrt(d2) * speed) continue;
          neighbors++; ax += b.vx; ay += b.vy; cx += dx; cy += dy;
          if (d2 < SEP2) { sx -= dx / d2; sy -= dy / d2; near++; }
        }
      }
      const sep = near ? steering(sx, sy, a.vx, a.vy) : [0, 0];
      const ali = neighbors ? steering(ax, ay, a.vx, a.vy) : [0, 0];
      const coh = neighbors ? steering(cx, cy, a.vx, a.vy) : [0, 0];
      let vx = a.vx + sep[0] * r.separate + ali[0] * (r.alignOn ? r.align : 0) + coh[0] * r.cohere;
      let vy = a.vy + sep[1] * r.separate + ali[1] * (r.alignOn ? r.align : 0) + coh[1] * r.cohere;
      // Always consume one noise sample per id per step, including when noise=0.
      const angle = (random(sim) * 2 - 1) * Math.PI * r.noise;
      const c = Math.cos(angle), s = Math.sin(angle), nx = vx * c - vy * s;
      vy = vx * s + vy * c; vx = nx;
      const length = Math.hypot(vx, vy);
      if (length < 1e-15) { vx = SPEED * 0.45; vy = 0; }
      else { const k = Math.max(SPEED * 0.45, Math.min(SPEED, length)) / length; vx *= k; vy *= k; }
      velocities[i * 2] = vx; velocities[i * 2 + 1] = vy;
    }
    for (let i = 0; i < p.length; i++) {
      const a = p[i]; a.vx = velocities[i * 2]; a.vy = velocities[i * 2 + 1];
      a.x = (a.x + a.vx + 1) % 1; a.y = (a.y + a.vy + 1) % 1;
    }
    sim.step++;
  }
  return sim;
}
function polarization(sim) {
  let x = 0, y = 0;
  for (const p of sim.particles) { const v = Math.hypot(p.vx, p.vy) || 1; x += p.vx / v; y += p.vy / v; }
  return Math.hypot(x, y) / sim.particles.length;
}
function hashParticles(particles) {
  const bytes = new ArrayBuffer(36), view = new DataView(bytes), u8 = new Uint8Array(bytes);
  let hash = 2166136261;
  for (const p of particles) {
    view.setUint32(0, p.id, true);
    ['x', 'y', 'vx', 'vy'].forEach((k, i) => view.setFloat64(4 + i * 8, p[k], true));
    for (const byte of u8) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

window.EC.sim = Object.freeze({ DT, COUNT, RULE_PRESETS, DEFAULT_RULES, finite, integer, sanitizeRules, random, createSim, stepSim, polarization, hashParticles });
})();
