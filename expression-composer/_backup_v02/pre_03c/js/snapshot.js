(() => {
'use strict';
window.EC = window.EC || {};
const { hashParticles, sanitizeRules, finite, integer } = window.EC.sim;
const { sanitizeEdit, PRESETS } = window.EC.composition;
const SCHEMA_VERSION = 1;
const MAX_JSON_BYTES = 2 * 1024 * 1024;
function deepFreeze(obj) {
  for (const v of Object.values(obj)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(obj);
}
function takeSnapshot(sim, side) {
  const particles = sim.particles.map(p => ({ ...p }));
  return deepFreeze({ seed: sim.seed, step: sim.step, rules: { ...sim.rules }, rng: sim.rng,
    side, count: particles.length, hash: hashParticles(particles), particles });
}
function snapshotMeta(s) {
  if (!s) return null;
  return { seed: s.seed, step: s.step, rules: { ...s.rules }, side: s.side, count: s.count, hash: s.hash };
}
// Check before JSON.stringify: stringify silently changes NaN/Infinity to null.
function inspectJSON(value, depth = 0, budget = { nodes: 0, chars: 0 }) {
  if (++budget.nodes > 20000 || depth > 16) throw new Error('JSON の構造が大きすぎます。');
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('NaN / Infinity は読み込めません。');
  if (typeof value === 'string') budget.chars += value.length;
  else if (value && typeof value === 'object') {
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new Error('JSON オブジェクトが必要です。');
    for (const [k, v] of Object.entries(value)) { budget.chars += k.length; inspectJSON(v, depth + 1, budget); }
  } else if (!['number', 'boolean'].includes(typeof value) && value !== null) throw new Error('JSON に保存できない値です。');
  if (budget.chars > MAX_JSON_BYTES) throw new Error('JSON は 2 MiB 以下にしてください。');
}
function requireKeys(obj, keys, name) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || keys.some(k => !Object.hasOwn(obj, k))) throw new Error(`${name}: 必須項目がありません。`);
}
function validateDocument(input) {
  let obj = input;
  if (typeof input === 'string') {
    if (input.length > MAX_JSON_BYTES || new TextEncoder().encode(input).length > MAX_JSON_BYTES) throw new Error('JSON は 2 MiB 以下にしてください。');
    try { obj = JSON.parse(input); } catch { throw new Error('JSON の構文が壊れています。'); }
  }
  inspectJSON(obj);
  if (new TextEncoder().encode(JSON.stringify(obj)).length > MAX_JSON_BYTES) throw new Error('JSON は 2 MiB 以下にしてください。');
  requireKeys(obj, ['schemaVersion', 'snapshot', 'preset', 'edit'], 'document');
  if (obj.schemaVersion !== SCHEMA_VERSION) throw new Error('対応していない schemaVersion です。');
  if (typeof obj.preset !== 'string' || !Object.hasOwn(PRESETS, obj.preset)) throw new Error('不明な PRESET です。');
  const s = obj.snapshot;
  requireKeys(s, ['seed', 'step', 'rules', 'rng', 'side', 'count', 'hash', 'particles'], 'snapshot');
  const seed = integer(s.seed, 0, 4294967295, 'seed'), step = integer(s.step, 0, 1e9, 'step');
  const rng = integer(s.rng, 0, 4294967295, 'rng'), count = integer(s.count, 300, 800, 'count');
  if (!['A', 'B', 'main'].includes(s.side)) throw new Error('不明な採取元です。');
  requireKeys(s.rules, ['separate', 'align', 'cohere', 'noise', 'alignOn'], 'rules');
  const rules = sanitizeRules(s.rules);
  if (!Array.isArray(s.particles) || s.particles.length !== count) throw new Error('粒子数が一致しません。');
  const particles = s.particles.map((p, i) => {
    requireKeys(p, ['id', 'x', 'y', 'vx', 'vy'], 'particle');
    if (p.id !== i) throw new Error('粒子 ID は 0 から連続した昇順である必要があります。');
    const x = finite(p.x, 0, 1, 'x'), y = finite(p.y, 0, 1, 'y');
    if (x === 1 || y === 1) throw new Error('粒子座標は 1 未満で指定してください。');
    const vx = finite(p.vx, -0.003501, 0.003501, 'vx'), vy = finite(p.vy, -0.003501, 0.003501, 'vy');
    const speed = Math.hypot(vx, vy);
    if (speed < 0.001574 || speed > 0.003501) throw new Error('粒子速度がモデルの範囲外です。');
    return { id: i, x, y, vx, vy };
  });
  const hash = hashParticles(particles);
  if (s.hash !== hash) throw new Error('snapshot hash が粒子データと一致しません。');
  requireKeys(obj.edit, ['keep', 'focusX', 'focusY', 'focusAmt', 'space', 'trace', 'typeOn', 'title', 'sub'], 'edit');
  return { snapshot: deepFreeze({ seed, step, rng, rules, side: s.side, count, hash, particles }),
    edit: sanitizeEdit(obj.edit), preset: obj.preset };
}

window.EC.snapshot = Object.freeze({ SCHEMA_VERSION, MAX_JSON_BYTES, deepFreeze, takeSnapshot, snapshotMeta, validateDocument });
})();
