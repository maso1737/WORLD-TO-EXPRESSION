(() => {
'use strict';
window.EC = window.EC || {};
const { finite } = window.EC.sim;
const PRESETS = Object.freeze({
  SILENCE: Object.freeze({ keep: 0.3, space: 0.72, trace: 0, focusAmt: 0.15 }),
  CURRENT: Object.freeze({ keep: 1, space: 0.04, trace: 0.85, focusAmt: 0.25 }),
  SIGNAL: Object.freeze({ keep: 0.85, space: 0.04, trace: 0.18, focusAmt: 0.8 }),
});
const DEFAULT_EDIT = Object.freeze({ ...PRESETS.SILENCE, focusX: 0.62, focusY: 0.52, typeOn: true, title: 'EMER/GENCE', sub: 'A FLOCK BECOMES A COMPOSITION.' });
function safeText(s, length) {
  if (typeof s !== 'string') throw new Error('テキストは文字列で指定してください。');
  return Array.from(s.replace(/[\u0000-\u001f\u007f]/g, ' ')).slice(0, length).join('');
}
function sanitizeEdit(partial, base = DEFAULT_EDIT) {
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) throw new Error('edit: オブジェクトが必要です。');
  const edit = { ...base };
  for (const k of ['keep', 'focusX', 'focusY', 'focusAmt', 'space', 'trace']) {
    if (Object.hasOwn(partial, k)) edit[k] = finite(partial[k], k === 'keep' ? 0.05 : 0, 1, k);
  }
  if (Object.hasOwn(partial, 'typeOn')) {
    if (typeof partial.typeOn !== 'boolean') throw new Error('typeOn: boolean が必要です。');
    edit.typeOn = partial.typeOn;
  }
  if (Object.hasOwn(partial, 'title')) edit.title = safeText(partial.title, 32);
  if (Object.hasOwn(partial, 'sub')) edit.sub = safeText(partial.sub, 80);
  return edit;
}
function presetEdit(name, edit) {
  if (!Object.hasOwn(PRESETS, name)) throw new Error('不明な PRESET です。');
  return { ...edit, ...PRESETS[name] };
}
// Art area [x0, y0, x1, y1] on the sheet and where the flock sits inside it (0 = left/top, 1 = right/bottom).
const FRAMES = Object.freeze({
  SILENCE: { box: [0.07, 0.42, 0.6, 0.86], ax: 0, ay: 1 },
  CURRENT: { box: [0.035, 0.13, 0.965, 0.87], ax: 0.5, ay: 0.5 },
  SIGNAL: { box: [0.05, 0.10, 0.95, 0.87], ax: 0.5, ay: 0.5 },
});
const TRACE_STEPS = 21;
const densityCache = new WeakMap();
function particleDensity(snapshot) {
  if (densityCache.has(snapshot)) return densityCache.get(snapshot);
  const ps = snapshot.particles, counts = new Uint16Array(ps.length);
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const ax = Math.abs(ps[i].x - ps[j].x), ay = Math.abs(ps[i].y - ps[j].y);
    const dx = Math.min(ax, 1 - ax), dy = Math.min(ay, 1 - ay);
    if (dx * dx + dy * dy < 0.045 ** 2) { counts[i]++; counts[j]++; }
  }
  const peak = Math.max(1, ...counts), density = Array.from(counts, n => Math.sqrt(n / peak));
  densityCache.set(snapshot, density); return density;
}
// The world is a torus. Put the widest empty band of an axis on the seam so a flock is not cut in two.
// A translation mod 1 of the whole axis: every particle keeps its exact relative position.
function seamOffset(values, bins = 72) {
  const filled = new Uint8Array(bins);
  for (const v of values) filled[Math.min(bins - 1, Math.floor(v * bins))] = 1;
  let best = 0, start = 0;
  for (let i = 0; i < bins; i++) {
    let n = 0;
    while (n < bins && !filled[(i + n) % bins]) n++;
    if (n > best) { best = n; start = i; }
  }
  return best ? (start + best / 2) / bins : 0;
}
// An affine projection only (unwrap, rotate, scale, translate). Never generates or repositions individual particles.
// Framing uses all particles, so KEEP / TRACE / FOCUS never move the dots that remain.
function compositionGeometry(snapshot, edit, preset, width, height) {
  const ps = snapshot.particles, frame = FRAMES[preset], density = particleDensity(snapshot);
  const ox = seamOffset(ps.map(p => p.x)), oy = seamOffset(ps.map(p => p.y));
  let mvx = 0, mvy = 0;
  for (const p of ps) { mvx += p.vx; mvy += p.vy; }
  // CURRENT turns the flock's own mean heading to run left → right across the sheet.
  const angle = preset === 'CURRENT' && Math.hypot(mvx, mvy) > 1e-9 ? -Math.atan2(mvy, mvx) : 0;
  const c = Math.cos(angle), s = Math.sin(angle);
  const local = ps.map(p => {
    const u = (p.x - ox + 1) % 1 - 0.5, v = (p.y - oy + 1) % 1 - 0.5;
    return { x: u * c - v * s, y: u * s + v * c, vx: p.vx * c - p.vy * s, vy: p.vx * s + p.vy * c };
  });
  // Bounds include the longest possible trace, so TRACE never shifts the framing.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const q of local) for (const k of [0, TRACE_STEPS]) {
    const x = q.x - q.vx * k, y = q.y - q.vy * k;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  // Inset by the largest dot radius (see radius below) so no dot crosses the art area.
  const pad = width * 0.0065, boxW = (frame.box[2] - frame.box[0]) * width - pad * 2, boxH = (frame.box[3] - frame.box[1]) * height - pad * 2;
  const bx0 = frame.box[0] + pad / width, by0 = frame.box[1] + pad / height;
  const bw = Math.max(maxX - minX, 0.02), bh = Math.max(maxY - minY, 0.02);
  const scale = Math.min(boxW / bw, boxH / bh, width * 4) * (1 - edit.space * 0.6);
  const tx = bx0 * width + (boxW - bw * scale) * frame.ax - minX * scale;
  const ty = by0 * height + (boxH - bh * scale) * frame.ay - minY * scale;
  const count = Math.max(1, Math.floor(snapshot.count * edit.keep));
  const points = ps.map((p, index) => {
    const q = local[index], x = tx + q.x * scale, y = ty + q.y * scale;
    const distance = Math.hypot(x / width - edit.focusX, (y / height - edit.focusY) * height / width);
    const influence = Math.exp(-distance * distance / 0.025) * edit.focusAmt;
    return { id: p.id, x, y, dx: q.vx * scale * edit.trace * TRACE_STEPS, dy: q.vy * scale * edit.trace * TRACE_STEPS,
      radius: width * (0.0028 + 0.0015 * density[index] + 0.0022 * influence),
      alpha: Math.min(1, 0.38 + 0.47 * density[index] + 0.15 * influence), visible: index < count, distance };
  });
  let focus = null;
  for (const p of points) if (p.visible && (!focus || p.distance < focus.distance)) focus = p;
  return { points, focus, count, scale };
}

window.EC.composition = Object.freeze({ PRESETS, DEFAULT_EDIT, safeText, sanitizeEdit, presetEdit, FRAMES, compositionGeometry });
})();
