(() => {
'use strict';
window.EC = window.EC || {};
const { compositionGeometry } = window.EC.composition;
const COLORS = { paper: '#f2f2ef', ink: '#0a0a0a', noir: '#070707', yellow: '#ffd400' };
const MONO = '"JetBrains Mono", "Consolas", monospace';
const SANS = '"IBM Plex Sans JP", "Helvetica Neue", Arial, "Yu Gothic", sans-serif';
function dot(ctx, x, y, radius) { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
function tracked(ctx, text, x, y, size, spacing, maxWidth, font = SANS, outline = false) {
  ctx.font = `400 ${size}px ${font}`;
  const chars = Array.from(text), measure = () => chars.reduce((n, ch) => n + ctx.measureText(ch).width, 0) + Math.max(0, chars.length - 1) * spacing;
  const actual = measure();
  if (actual > maxWidth) { const k = maxWidth / actual; size *= k; spacing *= k; ctx.font = `400 ${size}px ${font}`; }
  for (const ch of chars) { if (outline) ctx.strokeText(ch, x, y); ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + spacing; }
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
  const layout = window.EC.composition.posterLayout(snapshot, edit, preset);
  const [x, y, w, h] = layout.rect;
  const size = Math.min(width * layout.size, height * h / 2.4);
  ctx.save(); ctx.textBaseline = 'top'; ctx.strokeStyle = COLORS.noir; ctx.lineWidth = width * 0.004; ctx.lineJoin = 'round';
  // A narrow ink keyline belongs to the letters; the real particle geometry stays untouched.
  lines.forEach((line, i) => tracked(ctx, line, x * width + width * 0.004, y * height + width * 0.004 + i * size * 1.12, size, size * 0.17, w * width - width * 0.008, SANS, preset === 'CURRENT'));
  ctx.restore();
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
const worldBuffers = new WeakMap();
function renderWorld(ctx, sim, box, view) {
  // Rasterize each world's local coordinates before placing its panel. This avoids
  // translated-path antialias rounding making identical A/B worlds look different.
  if (!worldBuffers.has(ctx)) worldBuffers.set(ctx, document.createElement('canvas'));
  const buffer = worldBuffers.get(ctx), dpr = Math.abs(ctx.getTransform().a) || 1;
  const w = Math.max(1, Math.round(box.width * dpr)), h = Math.max(1, Math.round(box.height * dpr));
  if (buffer.width !== w || buffer.height !== h) { buffer.width = w; buffer.height = h; }
  const local = buffer.getContext('2d'); local.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Clear the entire rounded backing store, including fractional CSS edge pixels.
  local.save(); local.setTransform(1, 0, 0, 1, 0, 0); local.clearRect(0, 0, w, h); local.restore();
  drawWorld(local, sim, { ...box, x: 0, y: 0 }, view);
  ctx.drawImage(buffer, box.x, box.y, box.width, box.height);
}
function drawWorld(ctx, sim, box, view) {
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
// Both EDIT and the last FREEZE frame use this exact backing canvas and placement.
const paperBuffers = new WeakMap();
function renderPaper(ctx, state, width, height, buffer = null, redraw = true) {
  if (!buffer) {
    if (!paperBuffers.has(ctx)) paperBuffers.set(ctx, document.createElement('canvas'));
    buffer = paperBuffers.get(ctx);
  }
  const box = paperBox(width, height), dpr = Math.abs(ctx.getTransform().a) || 1;
  const pw = Math.max(1, Math.round(box.width * dpr)), ph = Math.max(1, Math.round(box.height * dpr));
  if (buffer.width !== pw || buffer.height !== ph) { buffer.width = pw; buffer.height = ph; redraw = true; }
  if (redraw) renderComposition(state, buffer);
  ctx.drawImage(buffer, box.x, box.y, box.width, box.height);
}
const clamp01 = n => Math.max(0, Math.min(1, n));
const smooth = t => t * t * (3 - 2 * t);
function freezeTiming(progress) {
  return { move: smooth(clamp01((progress - 0.15) / 0.55)), print: smooth(clamp01((progress - 0.88) / 0.12)),
    beat: progress <= 0.15 ? 'HOLD' : progress < 0.70 ? 'TRANSFER' : progress < 0.88 ? 'STILL' : 'PRINT' };
}
// One primary per real ID. Copies converge and fade; selection occurs only at PRINT.
function freezeGeometry(state, width, height, source, progress) {
  const box = paperBox(width, height), timing = freezeTiming(progress);
  const g = compositionGeometry(state.snapshot, state.edit, state.preset, box.width, box.height);
  const { move, print } = timing;
  const points = source.map(src => {
    const p = g.points[src.id];
    return { id: src.id, primary: src.primary,
      x: src.x * width + (box.x + p.x - src.x * width) * move,
      y: src.y * height + (box.y + p.y - src.y * height) * move,
      dx: src.dx * width + (p.dx - src.dx * width) * move,
      dy: src.dy * height + (p.dy - src.dy * height) * move,
      radius: src.radius + (p.radius - src.radius) * move,
      alpha: (1 + ((p.visible ? p.alpha : 0) - 1) * print) * (src.primary ? 1 : 1 - move),
      lineWidth: src.radius * 0.65 + (box.width * 0.0009 - src.radius * 0.65) * move };
  });
  return { box, timing, points, composition: g };
}
function renderFreeze(ctx, state, width, height, source, progress, from = null) {
  // CSS height can be fractional. Repainting its partial last row would accumulate alpha.
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  ctx.globalAlpha = 1; ctx.fillStyle = COLORS.noir; ctx.fillRect(0, 0, width, height);
  if (progress >= 1) { renderPaper(ctx, state, width, height); return; }
  const { box, timing, points, composition } = freezeGeometry(state, width, height, source, progress);
  const { move, print } = timing;
  const f = from ? { x: from.x * width, y: from.y * height, width: from.w * width, height: from.h * height } : box;
  if (progress <= 0.15 && from?.view) {
    // Exactly the sampled screen, stationary for 172.5 ms. No overlay shapes.
    renderWorld(ctx, { particles: state.snapshot.particles }, { ...f, size: Math.min(f.width, f.height) }, from.view);
    return;
  }
  const area = { x: f.x + (box.x - f.x) * move, y: f.y + (box.y - f.y) * move,
    width: f.width + (box.width - f.width) * move, height: f.height + (box.height - f.height) * move };
  const dark = state.preset === 'CURRENT';
  // A hard printing front changes paper AND ink in the same spatial region.
  // Unlike interpolated greys, neither side ever loses particle/background contrast.
  const front = box.y + box.height * print;
  if (!dark && print > 0) { ctx.fillStyle = COLORS.paper; ctx.fillRect(box.x, box.y, box.width, box.height * print); }
  function drawPass(ink, top, bottom) {
    ctx.save(); ctx.beginPath(); ctx.rect(area.x, top, area.width, Math.max(0, bottom - top)); ctx.clip();
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineCap = 'round';
    for (const p of points) {
      ctx.globalAlpha = p.alpha * (0.42 + 0.58 * move); ctx.lineWidth = p.lineWidth;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.dx, p.y - p.dy); ctx.stroke();
      ctx.globalAlpha = p.alpha; dot(ctx, p.x, p.y, p.radius);
    }
    ctx.restore();
  }
  if (!dark && print > 0) {
    drawPass(COLORS.ink, area.y, front); drawPass(COLORS.paper, front, area.y + area.height);
  } else drawPass(COLORS.paper, area.y, area.y + area.height);
  ctx.globalAlpha = 1;
  if (print > 0) {
    if (state.preset === 'SIGNAL' && composition.focus) {
      ctx.fillStyle = COLORS.yellow; ctx.globalAlpha = print;
      dot(ctx, box.x + composition.focus.x, box.y + composition.focus.y, box.width * (0.006 + state.edit.focusAmt * 0.008));
    }
    ctx.save(); ctx.translate(box.x, box.y); ctx.globalAlpha = print; drawTypography(ctx, state, box.width, box.height); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

window.EC.render = Object.freeze({ COLORS, drawTypography, renderComposition, worldBox, worldPoints, followCamera, renderWorld, paperBox, renderPaper, freezeTiming, freezeGeometry, renderFreeze });
})();
