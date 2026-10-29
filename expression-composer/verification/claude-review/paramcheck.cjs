// param-check: drive the real DOM controls min↔max and measure the effect through window.__EC.
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto((process.argv[3] || 'http://localhost:8126/expression-composer/index.html')); await p.waitForFunction(() => window.__EC);
  const R = {};
  await p.click('#begin'); await p.waitForTimeout(200);
  // helper in page: measure sim after N steps with current rules
  await p.evaluate(() => {
    window.__measure = (steps = 400) => {
      const E = __EC; E.pause(true); E.reset(); E.pause(true); E.step(steps); E.take('main');
      const ps = E.exportJSON().snapshot.particles; let sx = 0, sy = 0, nn = 0;
      for (const a of ps) { const s = Math.hypot(a.vx, a.vy) || 1; sx += a.vx / s; sy += a.vy / s; }
      for (let i = 0; i < ps.length; i += 6) { let m = 9; for (const q of ps) if (q !== ps[i]) { let dx = Math.abs(q.x - ps[i].x), dy = Math.abs(q.y - ps[i].y); dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy); m = Math.min(m, Math.hypot(dx, dy)); } nn += m; }
      const sp = ps.reduce((n, a) => n + Math.hypot(a.vx, a.vy), 0) / ps.length;
      document.getElementById('back').click();
      return { phi: +(Math.hypot(sx, sy) / ps.length).toFixed(3), nn: +(nn / Math.ceil(ps.length / 6) * 1000).toFixed(2), speed: +(sp * 1000).toFixed(3), rules: E.getState().snapshot.rules };
    };
  });
  const back = async () => { await p.evaluate(() => { const b = document.getElementById('back'); if (!b.hidden) b.click(); }); await p.waitForTimeout(30); };
  const ranges = await p.$$eval('#rule-controls input[type=range]', els => els.map(e => ({ id: e.id, label: e.closest('label,div')?.textContent.trim().slice(0, 24), min: e.min, max: e.max })));
  R.ruleRanges = ranges;
  for (const r of ranges) {
    const res = {};
    for (const v of [r.min, r.max]) {
      await back();
      await p.$eval('#' + r.id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
      res[v] = await p.evaluate(() => __measure(400));
    }
    // restore defaults by preset COHERE
    await back(); await p.click('[data-rule-preset="COHERE"]');
    R['rule:' + r.id] = res;
  }
  await back(); await p.click('[data-rule-preset="COHERE"]');
  const alignBefore = await p.evaluate(() => __measure(400)); await back();
  await p.click('#align-toggle'); const alignAfter = await p.evaluate(() => __measure(400)); await back(); await p.click('#align-toggle');
  R.alignToggle = { on: alignBefore, off: alignAfter };
  for (const n of ['COHERE', 'DRIFT', 'FRACTURE']) { await back(); await p.click(`[data-rule-preset="${n}"]`); R['rulePreset:' + n] = await p.evaluate(() => __measure(400)); }
  await back(); await p.click('[data-rule-preset="COHERE"]');
  // seed
  await back(); const s0 = await p.evaluate(() => __EC.getState().seed); await p.click('#new-seed'); const s1 = await p.evaluate(() => __EC.getState().seed);
  await p.fill('#seed-input', '7'); await p.press('#seed-input', 'Enter'); await p.$eval('#seed-input', e => e.dispatchEvent(new Event('change', { bubbles: true }))); const s2 = await p.evaluate(() => __EC.getState().seed);
  R.seed = { s0, newSeed: s1, typed7: s2 };
  // play / step / reset
  const st = async () => p.evaluate(() => __EC.getState());
  await p.evaluate(() => __EC.pause(true)); const a = (await st()).step; await p.click('#step'); const bStep = (await st()).step;
  await p.click('#play'); await p.waitForTimeout(600); const c = await st(); await p.click('#play'); const d = await st();
  await p.click('#reset'); const e = await st();
  R.transport = { stepBefore: a, afterStepBtn: bStep, afterPlay600ms: c.step, pausedAfterToggle: d.paused, playingWasPaused: c.paused, afterReset: e.step };
  // compare
  await p.click('#compare'); await p.evaluate(() => { __EC.pause(true); __EC.step(400); });
  R.compare = await p.evaluate(() => ({ phase: __EC.getState().phase, stats: __EC.compareStats(), alignDisabled: document.getElementById('align-toggle').disabled }));
  await p.click('#take-b'); await p.waitForTimeout(1500);
  R.takeB = await p.evaluate(() => __EC.getState().snapshot);
  // edit controls
  if (await p.isVisible('#to-output') === false) await p.waitForTimeout(500);
  const editRanges = await p.$$eval('#edit-controls input[type=range]', els => els.map(e => ({ id: e.id, min: e.min, max: e.max })));
  R.editRanges = editRanges;
  await p.click('#edit-controls [data-preset="SIGNAL"]');
  for (const r of editRanges) {
    const res = {};
    for (const v of [r.min, r.max]) {
      await p.$eval('#' + r.id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
      res[v] = await p.evaluate(async () => {
        const { compositionGeometry } = window.EC.composition; const s = __EC.exportJSON(); const g = compositionGeometry(s.snapshot, s.edit, s.preset, 1800, 2400);
        const vis = g.points.filter(q => q.visible); const big = vis.filter(q => q.radius > 1800 * 0.0025).length;
        const tr = vis.reduce((n, q) => n + Math.hypot(q.dx, q.dy), 0) / vis.length; const png = await __EC.exportPNG({ download: false });
        let h = 0; for (let i = 0; i < png.dataURL.length; i += 97) h = (h * 31 + png.dataURL.charCodeAt(i)) | 0;
        return { edit: s.edit, visible: vis.length, enlarged: big, scale: +g.scale.toFixed(1), traceLen: +tr.toFixed(2), focusId: g.focus?.id, pngHash: h, hash: __EC.snapshotHash() };
      });
    }
    R['edit:' + r.id] = res;
  }
  // focus by clicking the paper
  const box = await p.$eval('#stage canvas, canvas', c => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const f0 = (await st()).edit; await p.mouse.click(box.x + box.w * 0.45, box.y + box.h * 0.75); await p.waitForTimeout(100); const f1 = (await st()).edit;
  await p.keyboard.press('ArrowRight'); const f2 = (await st()).edit;
  R.focusClick = { before: [f0.focusX, f0.focusY], afterClick: [f1.focusX, f1.focusY], afterArrowRight: [f2.focusX, f2.focusY] };
  // type
  await p.uncheck('#type-on'); const t0 = (await st()).edit.typeOn; await p.check('#type-on');
  await p.fill('#title-input', 'SIGNAL/NOISE<script>'); await p.fill('#sub-input', 'x'.repeat(200));
  const t1 = (await st()).edit; R.type = { typeOnAfterUncheck: t0, title: t1.title, subLen: t1.sub.length, injected: await p.evaluate(() => !!document.querySelector('script:not([type=module]):not([src])')) };
  await p.fill('#title-input', 'EMER/GENCE');
  // presets & strip
  for (const n of ['SILENCE', 'CURRENT', 'SIGNAL']) { await p.click(`#edit-controls [data-preset="${n}"]`); R['editPreset:' + n] = await p.evaluate(() => ({ preset: __EC.getState().preset, edit: __EC.getState().edit, hash: __EC.snapshotHash() })); }
  // output
  await p.click('#to-output'); await p.waitForTimeout(200);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#export-png')]); const pngPath = path.join(out, 'export.png'); await dl.saveAs(pngPath);
  const [dj] = await Promise.all([p.waitForEvent('download'), p.click('#save-json')]); const jsonPath = path.join(out, 'state.json'); await dj.saveAs(jsonPath);
  R.downloads = { png: dl.suggestedFilename(), pngBytes: fs.statSync(pngPath).size, json: dj.suggestedFilename(), jsonBytes: fs.statSync(jsonPath).size };
  const hashBefore = await p.evaluate(() => __EC.snapshotHash());
  await p.click('#back'); await p.evaluate(() => { __EC.setSeed(99); __EC.step(50); __EC.take('main'); __EC.setEdit({ title: 'OTHER' }); });
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#load-json')]); await fc.setFiles(jsonPath); await p.waitForTimeout(300);
  R.loadJSON = { hashBefore, hashAfter: await p.evaluate(() => __EC.snapshotHash()), title: (await st()).edit.title, phase: (await st()).phase };
  fs.writeFileSync(path.join(out, 'bad.json'), '{"schemaVersion":1,'); const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.click('#load-json')]); await fc2.setFiles(path.join(out, 'bad.json')); await p.waitForTimeout(300);
  R.badFileMessage = await p.evaluate(() => document.getElementById('status')?.textContent || [...document.querySelectorAll('[aria-live]')].map(e => e.textContent).join(' | '));
  R.errors = errors;
  fs.writeFileSync(path.join(out, 'paramcheck.json'), JSON.stringify(R, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
