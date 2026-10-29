(() => {
'use strict';
window.EC = window.EC || {};
const { compositionGeometry } = window.EC.composition;
const COLORS = { paper: '#f2f2ef', ink: '#0a0a0a', noir: '#070707', yellow: '#ffd400' };
const MONO = '"JetBrains Mono", "Consolas", monospace';
const SANS = '"IBM Plex Sans JP", "Helvetica Neue", Arial, "Yu Gothic", sans-serif';
function dot(ctx, x, y, radius) { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
function tracked(ctx, text, x, y, size, spacing, maxWidth, font = SANS) {
  ctx.font = `400 ${size}px ${font}`;
  const chars = Array.from(text), measure = () => chars.reduce((n, ch) => n + ctx.measureText(ch).width, 0) + Math.max(0, chars.length - 1) * spacing;
  const actual = measure();
  if (actual > maxWidth) { const k = maxWidth / actual; size *= k; spacing *= k; ctx.font = `400 ${size}px ${font}`; }
  for (const ch of chars) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + spacing; }
}
function drawTypography(ctx, state, width, height) {
  const { edit, preset, snapshot } = state;
  if (!edit.typeOn) return;
  ctx.fillStyle = preset === 'CURRENT' ? COLORS.paper : COLORS.ink;
  const margin = width * 0.07;
  tracked(ctx, `${preset} / ${snapshot.side} / SEED ${snapshot.seed}`, margin, height * 0.055, width * 0.012, width * 0.002, width * 0.86, MONO);
  tracked(ctx, `STEP ${snapshot.step} · ${snapshot.hash}`, margin, height * 0.075, width * 0.01, width * 0.001, width * 0.86, MONO);
  const raw = edit.title.split('/');
  const lines = raw.length > 1 ? [raw[0], raw.slice(1).join(' ')] : Array.from(edit.title).length > 9 ? [Array.from(edit.title).slice(0, Math.ceil(Array.from(edit.title).length / 2)).join(''), Array.from(edit.title).slice(Math.ceil(Array.from(edit.title).length / 2)).join('')] : [edit.title];
  const size = width * (preset === 'SILENCE' ? 0.075 : preset === 'CURRENT' ? 0.165 : 0.15);
  lines.forEach((line, i) => tracked(ctx, line, margin, height * (preset === 'CURRENT' ? 0.2 : 0.18) + i * size * 1.12, size, size * 0.17, width * 0.86));
  tracked(ctx, edit.sub, margin, height * 0.895, width * 0.012, width * 0.002, width * 0.86, MONO);
  ['FROM', 'RULES', 'TO', 'WORLDS'].forEach((line, i) => tracked(ctx, line, margin, height * 0.93 + i * height * 0.012, width * 0.009, width * 0.003, width * 0.6, MONO));
  ctx.font = `300 ${width * 0.047}px ${SANS}`; ctx.textAlign = 'right';
  ctx.fillText({ SILENCE: '01', CURRENT: '02', SIGNAL: '03' }[preset], width - margin, height * 0.965);
  ctx.textAlign = 'left';
}
// target is a canvas. All geometry is recomputed from target dimensions.
function renderComposition(state, target) {
  const ctx = target.getContext('2d'), w = target.width, h = target.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const dark = state.preset === 'CURRENT';
  ctx.fillStyle = dark ? COLORS.noir : COLORS.paper; ctx.fillRect(0, 0, w, h);
  if (!state.snapshot) return;
  const geometry = compositionGeometry(state.snapshot, state.edit, state.preset, w, h);
  // Keep every dot/trace inside the paper's art area. No intentional cropping.
  ctx.save(); ctx.beginPath(); ctx.rect(w * 0.035, h * 0.035, w * 0.93, h * 0.85); ctx.clip();
  ctx.fillStyle = dark ? COLORS.paper : COLORS.ink; ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = w * 0.0009; ctx.lineCap = 'round';
  for (const p of geometry.points) {
    if (!p.visible) continue;
    ctx.globalAlpha = p.alpha;
    if (state.edit.trace > 0) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.dx, p.y - p.dy); ctx.stroke(); }
    dot(ctx, p.x, p.y, p.radius);
  }
  if (state.preset === 'SIGNAL' && geometry.focus) {
    ctx.globalAlpha = 1; ctx.fillStyle = COLORS.yellow;
    dot(ctx, geometry.focus.x, geometry.focus.y, w * (0.006 + state.edit.focusAmt * 0.008));
  }
  ctx.restore(); ctx.globalAlpha = 1; drawTypography(ctx, state, w, h);
  return geometry;
}
function worldBox(width, height, side = 'main', compare = false) {
  const panelW = compare ? width / 2 : width;
  return { x: side === 'B' ? panelW : 0, y: 0, width: panelW, height, size: Math.min(panelW, height) };
}
const wrap = x => (x % 1 + 1) % 1;
const shortDelta = x => wrap(x + 0.5) - 0.5;
// Circular means have no discontinuity at the world's seam. An indeterminate mean holds its axis.
function followCamera(sim, camera, amount = 0.075) {
  for (const [axis, key] of [['x', 'camX'], ['y', 'camY']]) {
    let c = 0, s = 0;
    for (const p of sim.particles) { c += Math.cos(p[axis] * Math.PI * 2); s += Math.sin(p[axis] * Math.PI * 2); }
    if (Math.hypot(c, s) / sim.particles.length > 0.015) {
      const target = wrap(Math.atan2(s, c) / (Math.PI * 2));
      camera[key] = wrap(camera[key] + shortDelta(target - camera[key]) * amount);
    }
  }
  return camera;
}
function worldPoints(sim, box, view = { zoom: 1.8, camX: 0.5, camY: 0.5 }) {
  const scale = box.size * view.zoom, points = [], radius = box.size * 0.002 * view.zoom;
  for (const p of sim.particles) {
    const x = box.x + box.width / 2 + shortDelta(p.x - view.camX) * scale;
    const y = box.y + box.height / 2 + shortDelta(p.y - view.camY) * scale;
    const dx = p.vx * scale * 3, dy = p.vy * scale * 3;
    const margin = Math.max(Math.abs(dx), Math.abs(dy)) + radius;
    // Keep the nearest representative even off-screen: it can enter the sheet during FREEZE.
    points.push({ id: p.id, x, y, radius, dx, dy, primary: true, tileX: 0, tileY: 0 });
    const left = Math.ceil((box.x - margin - x) / scale), right = Math.floor((box.x + box.width + margin - x) / scale);
    const top = Math.ceil((box.y - margin - y) / scale), bottom = Math.floor((box.y + box.height + margin - y) / scale);
    for (let ty = top; ty <= bottom; ty++) for (let tx = left; tx <= right; tx++) {
      if (tx || ty) points.push({ id: p.id, x: x + tx * scale, y: y + ty * scale, radius, dx, dy, primary: false, tileX: tx, tileY: ty });
    }
  }
  return points;
}
function renderWorld(ctx, sim, box, view) {
  ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.width, box.height); ctx.clip();
  ctx.fillStyle = COLORS.paper; ctx.strokeStyle = COLORS.paper; ctx.lineCap = 'round';
  for (const p of worldPoints(sim, box, view)) {
    ctx.lineWidth = p.radius * 0.65; ctx.globalAlpha = 0.42;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.dx, p.y - p.dy); ctx.stroke();
    ctx.globalAlpha = 1; dot(ctx, p.x, p.y, p.radius);
  }
  ctx.restore();
}
function paperBox(w, h) {
  const height = Math.min(h - 28, (w - 32) * 4 / 3), width = height * 3 / 4;
  return { x: (w - width) / 2, y: (h - height) / 2, width, height };
}
function mix(a, b, t) {
  const ca = parseInt(a.slice(1), 16), cb = parseInt(b.slice(1), 16);
  const ch = sh => Math.round(((ca >> sh) & 255) + (((cb >> sh) & 255) - ((ca >> sh) & 255)) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}
// from: the visible world panel (normalized to the stage). The sheet grows out of this sampled view.
function renderFreeze(ctx, state, width, height, source, progress, from = null) {
  const box = paperBox(width, height), t = Math.max(0, Math.min(1, (progress - 0.16) / 0.84));
  const ease = t * t * (3 - 2 * t), g = compositionGeometry(state.snapshot, state.edit, state.preset, box.width, box.height);
  const dark = state.preset === 'CURRENT', f = from ? { x: from.x * width, y: from.y * height, w: from.w * width, h: from.h * height } : { x: box.x, y: box.y, w: box.width, h: box.height };
  ctx.fillStyle = COLORS.noir; ctx.fillRect(0, 0, width, height);
  const sx = f.x + (box.x - f.x) * ease, sy = f.y + (box.y - f.y) * ease, sw = f.w + (box.width - f.w) * ease, sh = f.h + (box.height - f.h) * ease;
  // The sheet travels while still dark, then prints: sheet and dots invert together at the very end,
  // so the low-contrast midpoint lasts only a moment.
  const u = Math.max(0, Math.min(1, (ease - 0.72) / 0.22)), print = u * u * (3 - 2 * u);
  ctx.fillStyle = dark ? COLORS.noir : mix(COLORS.noir, COLORS.paper, print); ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeStyle = mix(COLORS.noir, COLORS.paper, 0.28 * (1 - print)); ctx.lineWidth = 1; ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
  const ink = dark ? COLORS.paper : mix(COLORS.paper, COLORS.ink, print);
  ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
  for (const src of source) {
    const p = g.points[src.id], x = src.x * width + (box.x + p.x - src.x * width) * ease;
    const y = src.y * height + (box.y + p.y - src.y * height) * ease;
    const alpha = (p.visible ? 1 + (p.alpha - 1) * ease : 1 - ease) * (src.primary ? 1 : 1 - ease);
    const radius = src.radius + (p.radius - src.radius) * ease;
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineCap = 'round';
    ctx.lineWidth = src.radius * 0.65 + (box.width * 0.0009 - src.radius * 0.65) * ease;
    ctx.globalAlpha = alpha * (0.42 + 0.58 * ease);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - (src.dx * width + (p.dx - src.dx * width) * ease), y - (src.dy * height + (p.dy - src.dy * height) * ease)); ctx.stroke();
    ctx.globalAlpha = alpha; dot(ctx, x, y, radius);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  if (ease > 0.8) { ctx.save(); ctx.translate(box.x, box.y); ctx.globalAlpha = (ease - 0.8) * 5; drawTypography(ctx, state, box.width, box.height); ctx.restore(); }
}

window.EC.render = Object.freeze({ COLORS, drawTypography, renderComposition, worldBox, worldPoints, followCamera, renderWorld, paperBox, renderFreeze });
})();
