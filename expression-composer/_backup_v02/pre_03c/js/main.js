(() => {
'use strict';
window.EC = window.EC || {};
const { COUNT, DT, DEFAULT_RULES, RULE_PRESETS, createSim, stepSim, hashParticles, sanitizeRules, integer } = window.EC.sim;
const { createComparison, stepComparison, updateComparison, comparisonStats } = window.EC.compare;
const { takeSnapshot, snapshotMeta, validateDocument } = window.EC.snapshot;
const { DEFAULT_EDIT, PRESETS, presetEdit, sanitizeEdit, posterLayout } = window.EC.composition;
const { COLORS, renderWorld, worldBox, worldPoints, followCamera, paperBox, renderComposition, renderPaper, renderFreeze } = window.EC.render;
const { exportPNG, exportDocument, saveJSON, readJSONFile } = window.EC.exporter;

const $ = id => document.getElementById(id);
const canvas = $('world'), ctx = canvas.getContext('2d', { alpha: false });
const paper = document.createElement('canvas');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 680px), (max-height: 500px) and (max-width: 1000px)');
const state = { phase: 'SEED', seed: 42, rules: { ...DEFAULT_RULES }, paused: reduced.matches,
  snapshot: null, edit: { ...DEFAULT_EDIT }, preset: 'SILENCE' };
let main = createSim(state.seed), pair = null, transition = null;
const cameras = new WeakMap();
const sharedCameras = new WeakMap();
let viewMode = 'LOCK', zoom = 1.8, worldChip = 'RULE', hintShown = false, hintTimer = null;
function cameraFor(sim) {
  if (!cameras.has(sim)) cameras.set(sim, followCamera(sim, { camX: 0.5, camY: 0.5 }, 1));
  return cameras.get(sim);
}
function sharedCamera() {
  if (!sharedCameras.has(pair)) sharedCameras.set(pair, followCamera({ particles: [...pair.A.particles, ...pair.B.particles] }, { camX: 0.5, camY: 0.5 }, 1));
  return sharedCameras.get(pair);
}
function viewFor(sim) { return { zoom, ...(pair && viewMode === 'LOCK' && (sim === pair.A || sim === pair.B) ? sharedCamera() : cameraFor(sim)) }; }
function setViewMode(mode) {
  if (!['LOCK', 'FOLLOW'].includes(mode)) throw new Error('VIEW: LOCK / FOLLOW を指定してください。');
  viewMode = mode; syncControls(); requestDraw(); return getState().view;
}
function setZoom(value) {
  if (!Number.isFinite(value) || value < 1 || value > 3) throw new Error('ZOOM: 1〜3 の有限数が必要です。');
  zoom = value; syncControls(); requestDraw(); return getState().view;
}
function revealCompareHint() {
  if (hintShown || state.phase !== 'RULE') return;
  hintShown = true; $('compare-hint').hidden = false;
}
let width = 1, height = 1, dpr = 1, raf = 0, last = null, accumulator = 0;
let dirty = true, compositionDirty = true, stripDirty = true, frameCount = 0;
const scenes = {
  SEED: ['01', 'RULE / SEED', 'はじまり', '形を決めずに、法則から始める。', 'RULE'],
  RULE: ['01', 'RULE', '法則', 'ひとつ変えると、群れのふるまいが変わる。', 'RULE'],
  COMPARE: ['03', 'PERCEPTION / COMPARE', '知覚・比較', '変えるのは ALIGN だけ。違いを、自分の目で見る。', 'PERCEPTION'],
  FREEZE: ['04', 'EDIT / FREEZE', '採取', '今ここにあった点を、一枚の紙へ。', 'EDIT'],
  EDIT: ['04', 'EDIT', '編集', '同じ点から、何を残し、何を主役にする？', 'EDIT'],
  OUTPUT: ['05', 'OUTPUT', '表現', '発見した法則が、あなたの一枚になる。', 'EXPRESSION'],
};
const isWorld = () => ['SEED', 'RULE', 'COMPARE'].includes(state.phase);
const isPaper = () => ['EDIT', 'OUTPUT'].includes(state.phase);
function status(message, error = false) {
  $('status').textContent = message; $('status').classList.toggle('error', error);
  if (error) $('controls').open = true;
}
function requestDraw(composition = false) {
  dirty = true;
  if (composition) { compositionDirty = true; stripDirty = true; }
  if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
}
function setPhase(phase) {
  state.phase = phase;
  $('stage').dataset.phase = phase;
  const [num, en, jp, copy, chip] = phase === 'RULE' && worldChip === 'EMERGENCE'
    ? ['02', 'EMERGENCE', '現象', '①と同じ世界。動きを観察して、③で比較する。', 'EMERGENCE'] : scenes[phase];
  $('scene-number').textContent = num;
  $('scene-title').replaceChildren(document.createTextNode(en + ' '));
  const small = document.createElement('small'); small.textContent = jp; $('scene-title').append(small);
  $('scene-copy').textContent = copy;
  const chips = [...document.querySelectorAll('[data-chip]')], at = chips.findIndex(el => el.dataset.chip === chip);
  chips.forEach((el, i) => {
    if (i === at) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    el.parentElement.classList.toggle('done', i < at);
    const needsSnapshot = ['EDIT', 'EXPRESSION'].includes(el.dataset.chip) && !state.snapshot;
    el.disabled = needsSnapshot;
    const label = el.textContent.trim();
    el.title = needsSnapshot ? '先に TAKE STATE / TAKE A / TAKE B で素材を採取してください。' : `${label} へ移動`;
    el.setAttribute('aria-label', needsSnapshot ? `${label}：先に素材の採取が必要です` : `${label} へ移動`);
  });
  for (const [id, show] of Object.entries({ 'seed-controls': phase === 'SEED', 'rule-controls': ['RULE', 'COMPARE'].includes(phase),
    'freeze-controls': phase === 'FREEZE', 'edit-controls': phase === 'EDIT', 'output-controls': phase === 'OUTPUT',
    intro: phase === 'SEED', 'compare-labels': phase === 'COMPARE', 'compare-note': phase === 'COMPARE',
    'view-controls': isWorld(), 'compare-view-note': phase === 'COMPARE', 'compare-camera-controls': phase === 'COMPARE',
    'edit-compare-link': phase === 'EDIT' && state.snapshot?.side === 'main',
    transport: ['RULE', 'COMPARE'].includes(phase), 'take-main': phase === 'RULE', 'take-a': phase === 'COMPARE', 'take-b': phase === 'COMPARE',
    'edit-actions': isPaper() || Boolean(state.snapshot && isWorld()), 'to-output': phase === 'EDIT', 'to-edit': phase === 'OUTPUT',
    back: isPaper(), 'resume-snapshot': Boolean(state.snapshot && isWorld()), 'paper-caption': isPaper(), examples: isPaper() })) $(id).hidden = !show;
  $('compare').textContent = phase === 'COMPARE' ? 'SINGLE / 比較を閉じる' : 'COMPARE / 同条件で比較 →';
  $('controls-summary').textContent = phase === 'OUTPUT' ? '作品を書き出す' : phase === 'EDIT' ? '構図を編集する' : '法則を変える';
  $('align-toggle').disabled = phase === 'COMPARE';
  $('snapshot-note').textContent = state.snapshot ? `採取済み ${state.snapshot.side} / STEP ${state.snapshot.step} / ${state.snapshot.hash}。BACK・RESET 後も保持。次の TAKE で置き換え。` : 'まだ素材は採取されていません。';
  clearTimeout(hintTimer);
  $('compare-hint').hidden = true;
  if (phase === 'RULE' && !hintShown) hintTimer = setTimeout(revealCompareHint, 8000);
  accumulator = 0; last = null; syncControls(); requestDraw(true);
}
function getState() {
  return { phase: state.phase, seed: state.seed, step: pair ? pair.A.step : main.step, rules: { ...state.rules }, particleCount: main.particles.length,
    snapshot: snapshotMeta(state.snapshot), edit: { ...state.edit }, preset: state.preset, paused: state.paused, reducedMotion: reduced.matches,
    layout: state.snapshot ? posterLayout(state.snapshot, state.edit, state.preset) : null,
    view: { mode: viewMode, ...viewFor(main), ...(pair ? { A: viewFor(pair.A), B: viewFor(pair.B) } : {}) } };
}
function setRules(partial) {
  if (Object.hasOwn(partial, 'align') || Object.hasOwn(partial, 'alignOn')) revealCompareHint();
  state.rules = sanitizeRules(partial, state.rules); main.rules = { ...state.rules };
  if (pair) updateComparison(pair, state.rules);
  syncControls(); requestDraw(); return getState();
}
function reset() {
  transition = null; main = createSim(state.seed, state.rules, main.particles.length);
  pair = state.phase === 'COMPARE' ? createComparison(state.seed, state.rules, main.particles.length) : null;
  setPhase(pair ? 'COMPARE' : 'RULE'); status('同じ seed で step 0 に戻しました。採取済み素材と編集値は保持しています。');
  return getState();
}
function setSeed(n) { state.seed = integer(n, 0, 4294967295, 'seed'); return reset(); }
function pause(value) {
  if (typeof value !== 'boolean') throw new Error('pause: boolean が必要です。');
  state.paused = value; last = null; accumulator = 0; syncControls(); requestDraw(); return getState();
}
function advance(n) {
  // Following advances with real simulation steps, never with a render or a zoom event.
  const sims = pair ? [pair.A, pair.B] : [main];
  sims.forEach(cameraFor);
  if (pair) sharedCamera();
  for (let i = 0; i < n; i++) {
    if (pair) stepComparison(pair, 1); else stepSim(main, 1);
    for (const sim of sims) followCamera(sim, cameraFor(sim));
    if (pair) followCamera({ particles: [...pair.A.particles, ...pair.B.particles] }, sharedCamera());
  }
}
function step(n = 1) { integer(n, 0, 10000, 'steps'); advance(n); requestDraw(); return getState(); }
function compare(on) {
  if (typeof on !== 'boolean') throw new Error('compare: boolean が必要です。');
  transition = null;
  pair = on ? createComparison(state.seed, state.rules, main.particles.length) : null;
  if (on) viewMode = 'LOCK';
  setPhase(on ? 'COMPARE' : 'RULE');
  status(on ? 'A/B を同じ初期状態・step 0 から開始しました。ALIGN の ON/OFF だけが異なります。' : '単独の世界へ戻りました。');
  return comparisonStats(pair);
}
function currentBox(side = 'main') {
  return worldBox(width, height, side, side !== 'main' && Boolean(pair));
}
function take(side = 'main') {
  if (!['A', 'B', 'main'].includes(side)) throw new Error('take: A / B / main を指定してください。');
  if (side !== 'main' && !pair) throw new Error('A/B の採取には COMPARE を開始してください。');
  const sourceSim = side === 'main' ? main : pair[side];
  const box = currentBox(side);
  const source = worldPoints(sourceSim, box, viewFor(sourceSim)).map(p => ({ ...p, x: p.x / width, y: p.y / height, dx: p.dx / width, dy: p.dy / height }));
  state.snapshot = takeSnapshot(sourceSim, side); state.paused = true;
  transition = { source, from: { x: box.x / width, y: box.y / height, w: box.width / width, h: box.height / height, view: viewFor(sourceSim) }, start: null, duration: reduced.matches ? 100 : 1150, progress: 0 };
  setPhase('FREEZE'); status(`${side} / STEP ${state.snapshot.step} を採取。粒子 ${state.snapshot.hash} を固定しました。`);
  return state.snapshot.hash;
}
function finishFreeze() { if (transition) { transition = null; setPhase('EDIT'); } }
function setEdit(partial) {
  const edit = sanitizeEdit(partial, state.edit); finishFreeze(); state.edit = edit;
  syncControls(); requestDraw(true); return { ...state.edit };
}
function setPreset(name) {
  const edit = presetEdit(name, state.edit); finishFreeze(); state.preset = name; state.edit = edit;
  syncControls(); requestDraw(true); return getState();
}
function restoreDocument(doc) {
  transition = null; pair = null; state.snapshot = doc.snapshot; state.seed = doc.snapshot.seed;
  state.rules = { ...doc.snapshot.rules }; state.edit = { ...doc.edit }; state.preset = doc.preset; state.paused = true;
  main = createSim(state.seed, state.rules, doc.snapshot.count);
  main.particles = doc.snapshot.particles.map(p => ({ ...p })); main.step = doc.snapshot.step; main.rng = doc.snapshot.rng;
  setPhase('EDIT'); status(`復元しました。${doc.snapshot.hash} / ${doc.snapshot.count} 粒子。`);
  return { ok: true };
}
function loadJSON(input) {
  try { return restoreDocument(validateDocument(input)); }
  catch (e) { status(e.message, true); return { ok: false, error: e.message }; }
}
function simDeterminism(seed, steps) { return hashParticles(stepSim(createSim(seed, DEFAULT_RULES, COUNT), steps).particles); }
window.__EC = Object.freeze({ getState, setRules, setSeed, reset, pause, step, compare, compareStats: () => comparisonStats(pair), take, setZoom, setViewMode,
  snapshotHash: () => state.snapshot ? hashParticles(state.snapshot.particles) : null,
  setEdit, setPreset, exportPNG: options => exportPNG(state, options), exportJSON: () => exportDocument(state), loadJSON, simDeterminism,
  diagnostics: () => ({ frames: frameCount, transition: transition ? { progress: transition.progress, duration: transition.duration,
    ids: transition.source.filter(p => p.primary).map(p => p.id), source: transition.source.map(p => ({ ...p })), from: { ...transition.from } } : null,
    frozen: state.snapshot ? Object.isFrozen(state.snapshot) && Object.isFrozen(state.snapshot.rules) && Object.isFrozen(state.snapshot.particles) && state.snapshot.particles.every(Object.isFrozen) : false }) });

const sliderNodes = [];
function addSlider(container, key, label, jp, max, value, edit = false) {
  const labelNode = document.createElement('label'); labelNode.className = 'slider';
  const row = document.createElement('span'), title = document.createElement('span'), detail = document.createElement('small'), output = document.createElement('output');
  title.textContent = label; detail.textContent = jp; title.append(detail); row.append(title, output);
  const input = document.createElement('input'); input.type = 'range'; input.id = `${edit ? 'edit' : 'rule'}-${key}`;
  input.min = key === 'keep' ? '0.05' : '0'; input.max = String(max); input.step = '0.01'; input.value = String(value);
  output.htmlFor = input.id; labelNode.append(row, input); $(container).append(labelNode);
  input.addEventListener('input', () => { (edit ? setEdit : setRules)({ [key]: Number(input.value) }); });
  sliderNodes.push({ input, output, key, edit });
}
for (const [key, label, jp, max] of [['separate', 'SEPARATE', '離れる', 3], ['align', 'ALIGN', '向きを揃える', 3], ['cohere', 'COHERE', '中心へ寄る', 3], ['noise', 'NOISE', 'ゆらぐ', 1]]) addSlider('rule-sliders', key, label, jp, max, state.rules[key]);
for (const [key, label, jp] of [['keep', 'KEEP', '残す割合'], ['focusAmt', 'FOCUS', '注目点の強調'], ['space', 'SPACE', '余白'], ['trace', 'TRACE', '速度の痕跡']]) addSlider('edit-sliders', key, label, jp, 1, state.edit[key], true);
function syncControls() {
  $('view-lock').setAttribute('aria-pressed', String(viewMode === 'LOCK'));
  $('view-follow').setAttribute('aria-pressed', String(viewMode === 'FOLLOW'));
  $('compare-view-note').textContent = viewMode === 'LOCK'
    ? 'SAME INITIAL WORLD / ONLY ALIGN DIFFERS — 同じ世界の窓・同じズーム。変えるのは ALIGN だけ。'
    : 'FOLLOW — 各群れを個別に追跡。同 seed・同歩数・同ズーム、ALIGN 以外のルールは共通。';
  $('view-zoom').value = String(zoom); $('zoom-value').value = `${zoom.toFixed(2)}×`;
  $('view-zoom').style.setProperty('--value', `${(zoom - 1) * 50}%`);
  for (const { input, output, key, edit } of sliderNodes) {
    const value = (edit ? state.edit : state.rules)[key]; input.value = String(value); output.value = value.toFixed(2);
    input.style.setProperty('--value', `${(value - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
  }
  $('seed-input').value = String(state.seed); $('type-on').checked = state.edit.typeOn;
  $('title-input').value = state.edit.title; $('sub-input').value = state.edit.sub;
  $('focus-readout').textContent = `FOCUS ${state.edit.focusX.toFixed(2)} / ${state.edit.focusY.toFixed(2)} · KEEP ${Math.floor((state.snapshot?.count || COUNT) * state.edit.keep)}/${state.snapshot?.count || COUNT}`;
  $('align-toggle').setAttribute('aria-pressed', String(state.rules.alignOn)); $('align-toggle').querySelector('span').textContent = state.rules.alignOn ? 'ON' : 'OFF';
  $('play').textContent = state.paused ? 'PLAY' : 'PAUSE'; $('step').disabled = !state.paused;
  for (const b of document.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset));
  for (const b of document.querySelectorAll('[data-rule-preset]')) b.setAttribute('aria-pressed', String(Object.entries(RULE_PRESETS[b.dataset.rulePreset]).every(([k, v]) => state.rules[k] === v)));
}
function renderReadout() {
  const s = state.snapshot && !isWorld() ? state.snapshot : pair ? pair.A : main;
  $('readout').textContent = `SEED ${s.seed} / STEP ${s.step} / ${s.count || s.particles.length} PARTICLES`;
  $('play-state').textContent = state.phase === 'SEED' ? (state.paused ? 'READY / PAUSED' : 'READY / LIVE') : isWorld() ? (state.paused ? 'PAUSED' : 'LIVE · 60 STEPS/S') : 'FROZEN';
  if (state.phase === 'COMPARE') {
    const stats = comparisonStats(pair); $('phi-a').textContent = `Φ ${stats.phiA.toFixed(3)}`; $('phi-b').textContent = `Φ ${stats.phiB.toFixed(3)}`;
  }
}
function renderStrip() {
  if (!stripDirty || !isPaper()) return;
  for (const card of document.querySelectorAll('.poster-card')) {
    const preset = card.dataset.preset, edit = preset === state.preset ? state.edit : presetEdit(preset, state.edit);
    renderComposition({ snapshot: state.snapshot, edit, preset }, card.querySelector('canvas'));
  }
  $('shared-hash').textContent = `ONE SNAPSHOT / ${state.snapshot.hash}`; stripDirty = false;
}
function renderStage() {
  frameCount++; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.noir; ctx.fillRect(0, 0, width, height);
  if (transition) renderFreeze(ctx, state, width, height, transition.source, transition.progress, transition.from);
  else if (isPaper()) {
    renderPaper(ctx, state, width, height, paper, compositionDirty); compositionDirty = false;
  } else if (state.phase === 'COMPARE') {
    renderWorld(ctx, pair.A, currentBox('A'), viewFor(pair.A)); renderWorld(ctx, pair.B, currentBox('B'), viewFor(pair.B));
  } else renderWorld(ctx, main, currentBox(), viewFor(main));
  renderReadout(); renderStrip(); dirty = false;
}
function frame(time) {
  raf = 0; if (document.hidden) { last = null; return; }
  if (transition) {
    if (transition.start === null) transition.start = time;
    transition.progress = Math.min(1, (time - transition.start) / transition.duration);
    $('freeze-beat').textContent = transition.progress < 0.15 ? 'HOLD / この瞬間を固定' : transition.progress < 0.70 ? 'TRANSFER / 同じ点を紙面へ' : transition.progress < 0.88 ? 'STILL / 配置を見つめる' : 'PRINT / 表現になる';
    if (transition.progress === 1) { transition = null; setPhase('EDIT'); }
    dirty = true;
  } else if (!state.paused && isWorld()) {
    if (last !== null) accumulator += Math.min(0.1, Math.max(0, (time - last) / 1000));
    let steps = 0;
    while (accumulator >= DT && steps < 5) { advance(1); accumulator -= DT; steps++; }
    if (steps === 5) accumulator = 0;
    if (steps) dirty = true;
  }
  last = time; if (dirty) renderStage();
  if (transition || (!state.paused && isWorld())) { if (!raf) raf = requestAnimationFrame(frame); } else last = null;
}
function resize() {
  const rect = $('stage').getBoundingClientRect(); width = Math.max(1, rect.width - 2); height = Math.max(1, rect.height - 2);
  dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); requestDraw(true);
}
function safeAction(fn) { return async () => { try { await fn(); } catch (e) { status(e.message, true); } }; }
$('view-zoom').addEventListener('input', () => setZoom(Number($('view-zoom').value)));
$('view-lock').addEventListener('click', () => setViewMode('LOCK'));
$('view-follow').addEventListener('click', () => setViewMode('FOLLOW'));
$('replay-compare').addEventListener('click', () => compare(true));
for (const chip of document.querySelectorAll('[data-chip]')) chip.addEventListener('click', () => {
  const target = chip.dataset.chip;
  if (['EDIT', 'EXPRESSION'].includes(target)) {
    if (!state.snapshot) return;
    transition = null; setPhase(target === 'EDIT' ? 'EDIT' : 'OUTPUT');
  } else if (target === 'PERCEPTION') { if (state.phase !== 'COMPARE') compare(true); }
  else {
    worldChip = target; transition = null; pair = null; setPhase('RULE');
    if (target === 'RULE' && mobile.matches) $('controls').open = true;
  }
});
$('compare-hint-link').addEventListener('click', () => compare(true));
$('edit-compare-link').addEventListener('click', () => compare(true));
$('begin').addEventListener('click', () => { setPhase('RULE'); pause(reduced.matches); status('まず ALIGN を ON / OFF。次に COMPARE で同じ条件を比べてみてください。'); $('play').focus({ preventScroll: true }); });
$('play').addEventListener('click', () => pause(!state.paused));
$('step').addEventListener('click', () => step(1));
$('compare').addEventListener('click', () => compare(!pair));
$('align-toggle').addEventListener('click', () => setRules({ alignOn: !state.rules.alignOn }));
$('reset').addEventListener('click', reset);
$('seed-input').addEventListener('change', safeAction(() => setSeed(Number($('seed-input').value))));
$('new-seed').addEventListener('click', () => setSeed(crypto.getRandomValues(new Uint32Array(1))[0]));
for (const [id, side] of [['take-main', 'main'], ['take-a', 'A'], ['take-b', 'B']]) $(id).addEventListener('click', safeAction(() => { take(side); canvas.focus({ preventScroll: true }); }));
for (const button of document.querySelectorAll('[data-rule-preset]')) button.addEventListener('click', () => setRules(RULE_PRESETS[button.dataset.rulePreset]));
for (const button of document.querySelectorAll('[data-preset]')) button.addEventListener('click', () => setPreset(button.dataset.preset));
$('type-on').addEventListener('change', () => setEdit({ typeOn: $('type-on').checked }));
$('title-input').addEventListener('input', () => setEdit({ title: $('title-input').value }));
$('sub-input').addEventListener('input', () => setEdit({ sub: $('sub-input').value }));
$('back').addEventListener('click', () => { pair = null; setPhase('RULE'); status('素材と編集を保持しています。新しい TAKE STATE で素材を置き換えます。'); $('play').focus({ preventScroll: true }); });
$('resume-snapshot').addEventListener('click', () => { setPhase('EDIT'); canvas.focus({ preventScroll: true }); });
$('to-output').addEventListener('click', () => { setPhase('OUTPUT'); if (mobile.matches) $('controls').open = true; $('export-png').focus(); });
$('to-edit').addEventListener('click', () => { setPhase('EDIT'); canvas.focus({ preventScroll: true }); });
$('export-png').addEventListener('click', safeAction(async () => { $('export-png').disabled = true; status('PNG を描いています…'); try { await exportPNG(state); status('1800 × 2400 PNG を書き出しました。'); } finally { $('export-png').disabled = false; } }));
$('save-json').addEventListener('click', safeAction(() => { saveJSON(state); status('再現用 JSON を保存しました。'); }));
$('load-json').addEventListener('click', () => $('json-file').click());
$('json-file').addEventListener('change', safeAction(async () => { const file = $('json-file').files[0]; $('json-file').value = ''; if (file) restoreDocument(await readJSONFile(file)); }));
canvas.addEventListener('pointerdown', e => {
  if (!isPaper() || state.phase !== 'EDIT') return;
  const rect = canvas.getBoundingClientRect(), box = paperBox(width, height), x = e.clientX - rect.left - box.x, y = e.clientY - rect.top - box.y;
  if (x < 0 || y < 0 || x > box.width || y > box.height) return;
  setEdit({ focusX: x / box.width, focusY: y / box.height });
});
canvas.addEventListener('keydown', e => {
  if (state.phase !== 'EDIT' || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault(); const delta = e.shiftKey ? 0.05 : 0.01;
  setEdit({ focusX: Math.max(0, Math.min(1, state.edit.focusX + (e.key === 'ArrowRight' ? delta : e.key === 'ArrowLeft' ? -delta : 0))),
    focusY: Math.max(0, Math.min(1, state.edit.focusY + (e.key === 'ArrowDown' ? delta : e.key === 'ArrowUp' ? -delta : 0))) });
});
document.addEventListener('keydown', e => {
  if (e.key !== ' ' || ['INPUT', 'BUTTON', 'SUMMARY', 'TEXTAREA'].includes(e.target.tagName) || !isWorld()) return;
  e.preventDefault(); pause(!state.paused);
});
document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); raf = 0; last = null; accumulator = 0; if (!document.hidden) requestDraw(); });
reduced.addEventListener('change', () => { if (reduced.matches) { pause(true); if (transition) { transition.duration = 100; transition.start = null; } } requestDraw(); });
mobile.addEventListener('change', () => { $('controls').open = !mobile.matches; });
$('controls').open = !mobile.matches;
new ResizeObserver(resize).observe($('stage'));
setPhase('SEED'); resize();
})();
