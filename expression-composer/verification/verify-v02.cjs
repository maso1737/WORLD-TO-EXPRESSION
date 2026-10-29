// ORDER 02 acceptance in an ordinary file:// origin; no relaxed browser security flags.
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
module.exports = async function verifyV02(browser, report, check, out) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure()?.errorText));
  const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
  await page.goto(url); await page.waitForFunction(() => window.__EC);
  await page.evaluate(() => __EC.pause(true));
  check('file:// classic scripts initialize __EC', await page.evaluate(() => location.protocol === 'file:' && Object.keys(EC).length === 6));
  check('Chips 4/5 disabled before sampling with reasons', await page.evaluate(() => ['EDIT', 'EXPRESSION'].every(n => {
    const b = document.querySelector(`[data-chip="${n}"]`); return b.disabled && b.title && b.getAttribute('aria-label').includes('採取');
  })));
  await page.locator('#begin').click(); await page.evaluate(() => __EC.pause(true));
  await page.waitForTimeout(8100);
  check('RULE timed comparison hint appears', await page.locator('#compare-hint').isVisible());
  await page.locator('[data-chip="EMERGENCE"]').click();
  check('Chip 2 observation shares unchanged world', await page.evaluate(() => __EC.getState().phase === 'RULE' && document.getElementById('scene-number').textContent === '02'));
  await page.locator('[data-chip="RULE"]').click();
  await page.locator('#rule-align').fill('2');
  check('Comparison hint does not reappear after first visit', !await page.locator('#compare-hint').isVisible());
  await page.evaluate(() => { __EC.setRules(EC.sim.DEFAULT_RULES); __EC.step(600); __EC.take('main'); __EC.setPreset('SIGNAL'); });
  check('Direct TAKE exposes EDIT comparison link', await page.locator('#edit-compare-link').isVisible());
  await page.locator('#edit-compare-link').click();
  check('EDIT comparison link enters PERCEPTION', await page.evaluate(() => __EC.getState().phase === 'COMPARE'));
  await page.locator('[data-chip="RULE"]').click();
  await page.locator('[data-chip="PERCEPTION"]').click();
  check('Chip 3 enters COMPARE with matching heading', await page.evaluate(() => __EC.getState().phase === 'COMPARE' && document.getElementById('scene-number').textContent === '03'));
  await page.evaluate(() => { __EC.pause(true); __EC.step(600); });
  const view = await page.evaluate(() => {
    // v0.3 defaults to LOCK. Exercise the preserved v0.2 independent-camera mode explicitly.
    __EC.setViewMode('FOLLOW');
    const a = __EC.getState(); __EC.setZoom(1); const b = __EC.getState(); __EC.setZoom(3); const c = __EC.getState();
    const deterministic = [__EC.simDeterminism(42, 600)]; __EC.setZoom(1.8); deterministic.push(__EC.simDeterminism(42, 600));
    return { a, b, c, deterministic, stats: __EC.compareStats() };
  });
  check('ZOOM isolated from simulation, snapshot and cameras', view.a.step === view.c.step && view.a.snapshot.hash === view.c.snapshot.hash && view.b.view.A.camX === view.c.view.A.camX && view.b.view.B.camY === view.c.view.B.camY && view.deterministic[0] === view.deterministic[1], view);
  check('COMPARE shared zoom / independent cameras / synchronized steps', view.c.view.A.zoom === 3 && view.c.view.B.zoom === 3 && view.stats.stepA === view.stats.stepB && (view.c.view.A.camX !== view.c.view.B.camX || view.c.view.A.camY !== view.c.view.B.camY), view.stats);
  // Capture and compare in the browser at the exact same stopped simulation state.
  const freeze = await page.evaluate(() => {
    __EC.setZoom(1); // Force visible tile copies in the tall comparison panel.
    const camera = __EC.getState().view.A;
    const stage = document.getElementById('world'), w = stage.width, h = stage.height;
    const taken = __EC.take('A'), doc = __EC.exportJSON(), tr = __EC.diagnostics().transition;
    const { worldBox, renderWorld, renderFreeze } = EC.render;
    const a = document.createElement('canvas'), b = document.createElement('canvas');
    a.width = b.width = w; a.height = b.height = h;
    const ca = a.getContext('2d'), cb = b.getContext('2d');
    ca.fillStyle = '#070707'; ca.fillRect(0, 0, w, h);
    renderWorld(ca, { particles: doc.snapshot.particles }, worldBox(w, h, 'A', true), camera);
    renderFreeze(cb, doc, w, h, tr.source, 0, tr.from);
    // Exclude only the one-pixel outline of the growing paper.
    const pa = ca.getImageData(2, 2, Math.floor(w / 2) - 4, h - 4).data;
    const pb = cb.getImageData(2, 2, Math.floor(w / 2) - 4, h - 4).data;
    let different = 0; for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) different++;
    const scale = Math.min(w / 2, h) * camera.zoom, wrap = x => (x % 1 + 1) % 1;
    const actual = tr.source.every(p => {
      const q = doc.snapshot.particles[p.id];
      return Math.abs(p.x * w - (w / 4 + (wrap(q.x - camera.camX + 0.5) - 0.5 + p.tileX) * scale)) < 1e-8 &&
        Math.abs(p.y * h - (h / 2 + (wrap(q.y - camera.camY + 0.5) - 0.5 + p.tileY) * scale)) < 1e-8 &&
        Math.abs(p.dx * w - q.vx * scale * 3) < 1e-8 && Math.abs(p.dy * h - q.vy * scale * 3) < 1e-8;
    });
    return { taken, different, actual, sources: tr.source.length, unique: new Set(tr.source.map(p => p.id)).size, from: tr.from };
  });
  check('FREEZE exact screen positions and real velocity tails / torus copies', freeze.actual && freeze.unique === 600 && freeze.sources > 600 && freeze.different === 0, freeze);
  await page.waitForFunction(() => __EC.getState().phase === 'EDIT');
  check('Chips 4/5 enabled after sampling', await page.evaluate(() => ['EDIT', 'EXPRESSION'].every(n => !document.querySelector(`[data-chip="${n}"]`).disabled)));
  const exports = await page.evaluate(async () => {
    const rows = [];
    for (const name of ['SILENCE', 'CURRENT', 'SIGNAL']) {
      __EC.setPreset(name); const png = await __EC.exportPNG({ download: false });
      const doc = __EC.exportJSON(), g = EC.composition.compositionGeometry(doc.snapshot, doc.edit, name, 1800, 2400);
      const ps = g.points.filter(p => p.visible);
      rows.push({ name, width: png.width, height: png.height, hash: __EC.snapshotHash(),
        widthRatio: (Math.max(...ps.map(p => p.x + p.radius)) - Math.min(...ps.map(p => p.x - p.radius))) / 1800,
        heightRatio: (Math.max(...ps.map(p => p.y + p.radius)) - Math.min(...ps.map(p => p.y - p.radius))) / 2400 });
    }
    const doc = __EC.exportJSON(), image = (await __EC.exportPNG({ download: false })).dataURL;
    __EC.setZoom(3); const unchanged = JSON.stringify(doc) === JSON.stringify(__EC.exportJSON());
    const loaded = __EC.loadJSON(JSON.stringify(doc));
    return { rows, unchanged, loaded, imageEqual: image === (await __EC.exportPNG({ download: false })).dataURL };
  });
  check('file:// presets x3 / 1800x2400 PNG / JSON roundtrip / zoom invariant', exports.rows.every(r => r.width === 1800 && r.height === 2400) && new Set(exports.rows.map(r => r.hash)).size === 1 && exports.unchanged && exports.loaded.ok && exports.imageEqual, exports);
  // ORDER 03c replaces the v0.2 width-only 70% requirement with either paper axis >= 55%.
  // The previous failing result is retained in v03/regression-03c-initial-fail.json.
  check('CURRENT and SIGNAL span at least 55% of one paper axis on seed42 step600', exports.rows.filter(r => r.name !== 'SILENCE').every(r => Math.max(r.widthRatio, r.heightRatio) >= 0.55 && Math.max(r.widthRatio, r.heightRatio) <= 0.9), exports.rows);
  await page.locator('[data-chip="EXPRESSION"]').click();
  check('Chip 5 opens OUTPUT', await page.evaluate(() => __EC.getState().phase === 'OUTPUT'));
  let download = page.waitForEvent('download'); await page.locator('#export-png').click(); const png = await download;
  await png.saveAs(path.join(out, 'file-download.png'));
  download = page.waitForEvent('download'); await page.locator('#save-json').click(); const json = await download;
  await json.saveAs(path.join(out, 'file-download.json'));
  await page.locator('#json-file').setInputFiles(path.join(out, 'file-download.json'));
  await page.waitForFunction(() => __EC.getState().phase === 'EDIT');
  check('file:// actual PNG / JSON downloads and file picker import', !await png.failure() && !await json.failure() && await page.evaluate(hash => __EC.snapshotHash() === hash, freeze.taken));
  await page.locator('[data-chip="EXPRESSION"]').click(); await page.locator('[data-chip="EDIT"]').click();
  check('Chip 4 restores EDIT', await page.evaluate(() => __EC.getState().phase === 'EDIT'));
  const cameraMath = await page.evaluate(() => {
    const sim = { particles: [{ x: 0.01, y: 0.99 }, { x: 0.03, y: 0.01 }] }, c = { camX: 0.99, camY: 0.98 };
    EC.render.followCamera(sim, c);
    return { c, shortPath: c.camX > 0.99 && c.camX < 1 && c.camY > 0.98 && c.camY < 1 };
  });
  check('Circular camera follows seam by shortest path', cameraMath.shortPath, cameraMath);
  await page.locator('[data-chip="RULE"]').click(); await page.evaluate(() => { __EC.pause(true); __EC.setZoom(2); });
  await page.waitForTimeout(80); const f1 = await page.evaluate(() => __EC.diagnostics().frames);
  await page.waitForTimeout(200); const f2 = await page.evaluate(() => __EC.diagnostics().frames);
  check('Paused camera and zoom settle without idle draws', f1 === f2, { f1, f2 });
  // A second fresh page exercises the ALIGN trigger before the timer.
  await page.reload(); await page.locator('#begin').click(); await page.locator('#rule-align').fill('2.1');
  check('ALIGN immediately reveals one-time comparison hint', await page.locator('#compare-hint').isVisible());
  check('file:// zero console / page / load errors', errors.length === 0, errors);
  report.fileProtocol = { url, errors, freeze, exports };
  await page.close();
};
