/* Existing test-runtime only; the artwork has no dependencies or build step.
   Run: node expression-composer/verification/verify-browser.cjs
   Optional EC_PLAYWRIGHT / EC_CHROME point to already installed tools. */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const crypto = require('node:crypto');
const out = process.env.EC_VERIFY_OUT ? path.resolve(process.env.EC_VERIFY_OUT) : __dirname, root = path.resolve(__dirname, '../..');
const temp = path.join(out, 'browser-temp');
fs.mkdirSync(temp, { recursive: true });
process.env.TEMP = temp; process.env.TMP = temp;
const { chromium } = require(process.env.EC_PLAYWRIGHT || 'C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const shots = path.join(out, 'screenshots'); fs.mkdirSync(shots, { recursive: true });
const report = { date: new Date().toISOString(), backend: 'Headless Chrome / --disable-gpu / synthetic input / DPR 1', checks: [], metrics: [], errors: [], screenshots: [] };
const check = (name, pass, evidence) => { report.checks.push({ name, result: pass ? 'PASS' : 'FAIL', evidence }); if (!pass) console.log('FAIL', name, JSON.stringify(evidence)); };
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end(); }
});
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.EC_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] });
    report.browser = browser.version();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true });
    page.on('pageerror', e => report.errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
    page.on('request', r => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) report.errors.push('External request: ' + r.url()); });
    await page.goto(base + '/expression-composer/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__EC);
    await page.evaluate(() => { __EC.pause(true); });
    async function shot(name) {
      await page.screenshot({ path: path.join(shots, name + '.png'), fullPage: true }); report.screenshots.push(name + '.png');
    }
    await shot('1440x900-seed');
    const deterministic = await page.evaluate(() => [__EC.simDeterminism(42, 600), __EC.simDeterminism(42, 600)]);
    check('simDeterminism(42,600) exact equality', deterministic[0] === deterministic[1], deterministic);
    await page.getByRole('button', { name: 'BEGIN', exact: false }).click();
    await page.evaluate(() => { __EC.pause(true); __EC.setSeed(42); });
    const ruleBefore = await page.evaluate(() => __EC.getState().rules.align);
    await page.locator('#rule-align').focus(); await page.keyboard.press('ArrowRight');
    check('RULE keyboard slider updates coefficient', await page.evaluate(() => __EC.getState().rules.align) > ruleBefore);
    await page.evaluate(() => __EC.setRules({ align: 1.5 }));
    const ruleChange = await page.evaluate(() => {
      __EC.reset(); __EC.step(100); const a = __EC.take('main');
      __EC.setRules({ alignOn: false }); __EC.reset(); __EC.step(100); const b = __EC.take('main');
      return { a, b };
    });
    check('Rule changes alter real particle state', ruleChange.a !== ruleChange.b, ruleChange);
    await page.evaluate(() => { __EC.setRules({ separate: 1.4, align: 1.5, cohere: 0.65, noise: 0.03, alignOn: true }); __EC.compare(true); __EC.pause(true); });
    const initial = await page.evaluate(() => { const a = __EC.take('A'), b = __EC.take('B'); __EC.compare(true); return { a, b }; });
    check('A/B initial particle state identical', initial.a === initial.b, initial);
    const stats = await page.evaluate(() => { __EC.step(600); return __EC.compareStats(); });
    check('A/B same step', stats.stepA === stats.stepB && stats.stepA === 600, stats);
    report.metrics.push({ name: 'Phi seed42 default step600', ...stats, onHigher: stats.phiA > stats.phiB });
    await shot('compare-step600');
    const selectedB = await page.evaluate(() => { const h = __EC.take('B'); return { h, snapshot: __EC.exportJSON().snapshot }; });
    check('TAKE B records actual side / rules', selectedB.snapshot.side === 'B' && !selectedB.snapshot.rules.alignOn && selectedB.snapshot.step === 600, { hash: selectedB.h });
    // Recreate the same comparison and sample the particle-preserving transition.
    await page.evaluate(() => { __EC.compare(true); __EC.step(600); });
    await shot('freeze-before-A');
    await page.locator('#take-a').click();
    const transition = await page.evaluate(() => __EC.diagnostics());
    check('FREEZE retains all 600 source IDs', transition.transition?.ids.length === 600 && transition.transition.ids.every((id, i) => id === i) && transition.frozen, transition.transition && { count: transition.transition.ids.length, duration: transition.transition.duration });
    await shot('freeze-start'); await page.waitForTimeout(350); await shot('freeze-mid');
    await page.waitForFunction(() => __EC.getState().phase === 'EDIT'); await shot('freeze-after');
    const immutable = await page.evaluate(() => {
      const before = __EC.snapshotHash(), meta = __EC.getState().snapshot;
      __EC.setRules({ align: 0, cohere: 2 }); __EC.step(3);
      return { before, after: __EC.snapshotHash(), meta, afterMeta: __EC.getState().snapshot, frozen: __EC.diagnostics().frozen };
    });
    check('Snapshot immutable after rule and simulation changes', immutable.before === immutable.after && JSON.stringify(immutable.meta) === JSON.stringify(immutable.afterMeta) && immutable.frozen, immutable);
    const posterData = {};
    for (const preset of ['SILENCE', 'CURRENT', 'SIGNAL']) {
      await page.evaluate(preset => __EC.setPreset(preset), preset);
      const png = await page.evaluate(() => __EC.exportPNG({ download: false }));
      const snapshot = await page.evaluate(() => __EC.snapshotHash());
      fs.writeFileSync(path.join(out, `poster-${preset.toLowerCase()}.png`), Buffer.from(png.dataURL.split(',')[1], 'base64'));
      posterData[preset] = { width: png.width, height: png.height, hash: hash(png.dataURL), snapshot };
      await shot(`1440x900-${preset.toLowerCase()}`);
    }
    check('Three posters: same snapshot, distinct pixels', new Set(Object.values(posterData).map(x => x.snapshot)).size === 1 && new Set(Object.values(posterData).map(x => x.hash)).size === 3, posterData);
    check('PNG 1800x2400', Object.values(posterData).every(x => x.width === 1800 && x.height === 2400), posterData);
    const contact = await page.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = 1350; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      for (let i = 0; i < 3; i++) {
        __EC.setPreset(['SILENCE', 'CURRENT', 'SIGNAL'][i]);
        const p = await __EC.exportPNG({ download: false }); const image = new Image(); image.src = p.dataURL; await image.decode();
        ctx.drawImage(image, i * 450, 0, 450, 600);
      }
      return canvas.toDataURL();
    });
    fs.writeFileSync(path.join(out, 'contact-sheet.png'), Buffer.from(contact.split(',')[1], 'base64'));
    const roundTrip = await page.evaluate(() => {
      __EC.setEdit({ keep: 0.63, focusX: 0.42, focusY: 0.61, focusAmt: 0.7, space: 0.55, trace: 0.44, typeOn: true, title: '同じ/世界', sub: 'SAME PARTICLES. MY DECISIONS.' });
      const before = __EC.exportJSON(); __EC.reset(); const loaded = __EC.loadJSON(JSON.stringify(before)); const after = __EC.exportJSON();
      const canonical = value => value && typeof value === 'object' ? Array.isArray(value) ? value.map(canonical) : Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
      return { before, after, loaded, equal: JSON.stringify(canonical(before)) === JSON.stringify(canonical(after)) };
    });
    check('JSON round trip exact snapshot / edit / title', roundTrip.loaded.ok && roundTrip.equal, { before: roundTrip.before.snapshot.hash, after: roundTrip.after.snapshot.hash, edit: roundTrip.after.edit });
    fs.writeFileSync(path.join(out, 'reproduction.json'), JSON.stringify(roundTrip.before, null, 2) + '\n');
    const invalid = await page.evaluate(() => {
      const good = __EC.exportJSON(), results = [];
      const cases = [ ['broken', '{'], ['oversized', ' '.repeat(2 * 1024 * 1024 + 1)], ['NaN', { ...good, edit: { ...good.edit, keep: NaN } }],
        ['version', { ...good, schemaVersion: 9 }], ['range', { ...good, edit: { ...good.edit, focusX: 2 } }],
        ['missing', { schemaVersion: 1 }], ['hash', { ...good, snapshot: { ...good.snapshot, hash: 'bad' } }] ];
      for (const [name, input] of cases) {
        const result = __EC.loadJSON(input);
        results.push({ name, ...result, ui: document.getElementById('status').textContent, unchanged: __EC.snapshotHash() === good.snapshot.hash });
      }
      return results;
    });
    for (const x of invalid) check('Reject ' + x.name + ' with UI reason', !x.ok && x.error === x.ui && x.unchanged, x);
    await shot('json-validation-error');
    const unknown = await page.evaluate(() => { const doc = __EC.exportJSON(); doc.unknown = { harmless: true }; doc.edit.unknown = 4; const result = __EC.loadJSON(doc); return { result, ignored: !('unknown' in __EC.exportJSON()) && !('unknown' in __EC.getState().edit) }; });
    check('Unknown keys ignored', unknown.result.ok && unknown.ignored, unknown);
    const textSafety = await page.evaluate(() => {
      __EC.setEdit({ title: '<img src=x onerror=alert(1)>'.repeat(10), sub: '長'.repeat(1000) });
      return { title: __EC.getState().edit.title, subLength: Array.from(__EC.getState().edit.sub).length, injected: document.querySelector('img[src="x"]') !== null };
    });
    check('Text safety and truncation', !textSafety.injected && Array.from(textSafety.title).length === 32 && textSafety.subLength === 80, textSafety);
    await page.evaluate(doc => { __EC.loadJSON(doc); __EC.setEdit({ title: 'EMER/GENCE', sub: 'A FLOCK BECOMES A COMPOSITION.' }); __EC.setPreset('SIGNAL'); }, roundTrip.before);
    // Independent geometry checks include extreme SPACE / TRACE and long text.
    const geometry = await page.evaluate(async () => {
      const { compositionGeometry } = window.EC.composition;
      const results = [];
      for (const preset of ['SILENCE', 'CURRENT', 'SIGNAL']) for (const space of [0, 1]) for (const trace of [0, 1]) {
        const doc = __EC.exportJSON(); doc.preset = preset; doc.edit = { ...doc.edit, keep: 1, space, trace };
        const g = compositionGeometry(doc.snapshot, doc.edit, preset, 1800, 2400);
        const [x0, y0, x1, y1] = g.layout.frame.box, e = 0.5;
        results.push({ preset, space, trace, inside: g.points.every(p => [p.x - p.radius, p.x - p.dx - p.radius].every(x => x >= x0 * 1800 - e) && [p.x + p.radius, p.x - p.dx + p.radius].every(x => x <= x1 * 1800 + e) && [p.y - p.radius, p.y - p.dy - p.radius].every(y => y >= y0 * 2400 - e) && [p.y + p.radius, p.y - p.dy + p.radius].every(y => y <= y1 * 2400 + e)) });
      }
      return results;
    });
    check('No particle/trace cropping at extreme edit settings', geometry.every(x => x.inside), geometry);
    const editContract = await page.evaluate(async () => {
      const { compositionGeometry } = window.EC.composition;
      const doc = __EC.exportJSON(), g = edit => compositionGeometry(doc.snapshot, { ...doc.edit, ...edit }, 'SIGNAL', 1800, 2400);
      const sparse = g({ keep: 0.2 }), dense = g({ keep: 0.8 });
      const noTrace = g({ trace: 0 }), fullTrace = g({ trace: 1 });
      const spaces = [0, 0.1, 0.2, 0.5, 0.8, 1].map(space => g({ space }).scale);
      return { nestedIDs: sparse.points.filter(p => p.visible).every(p => dense.points[p.id].visible),
        tracePositions: noTrace.points.every((p, i) => p.x === fullTrace.points[i].x && p.y === fullTrace.points[i].y),
        traceDirections: fullTrace.points.every((p, i) => { const v = doc.snapshot.particles[i]; return Math.abs(p.dx * v.vy - p.dy * v.vx) < 1e-12; }),
        spaces, monotonicSpace: spaces.every((x, i) => i === 0 || x < spaces[i - 1]) };
    });
    check('KEEP nested IDs, TRACE actual velocities without moving dots, SPACE monotonic', editContract.nestedIDs && editContract.tracePositions && editContract.traceDirections && editContract.monotonicSpace, editContract);
    const rendererText = await page.evaluate(async () => {
      const { renderComposition } = window.EC.render; const results = [];
      for (const preset of ['SILENCE', 'CURRENT', 'SIGNAL']) for (const title of ['EMER/GENCE', '漢'.repeat(32), 'W'.repeat(32)]) {
        const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 2400;
        const ctx = canvas.getContext('2d'), texts = [], original = ctx.fillText.bind(ctx);
        ctx.fillText = (text, x, y, ...args) => { const m = ctx.measureText(text); texts.push({ text, left: x - m.actualBoundingBoxLeft, right: x + m.actualBoundingBoxRight, top: y - m.actualBoundingBoxAscent, bottom: y + m.actualBoundingBoxDescent }); original(text, x, y, ...args); };
        const doc = __EC.exportJSON(); doc.preset = preset; doc.edit.title = title; renderComposition(doc, canvas);
        results.push({ preset, title, inside: texts.every(t => t.left >= 0 && t.right <= 1800 && t.top >= 0 && t.bottom <= 2400),
          noVerticalCollision: texts.every((t, i) => texts.slice(i + 1).every(u => Math.abs(t.bottom - u.bottom) < 2 || t.bottom <= u.top || u.bottom <= t.top || t.right <= u.left || u.right <= t.left)) });
      }
      return results;
    });
    check('Poster typography inside paper, no line collisions', rendererText.every(x => x.inside && x.noVerticalCollision), rendererText);
    const imageRoundTrip = await page.evaluate(async () => { const doc = __EC.exportJSON(), before = (await __EC.exportPNG({ download: false })).dataURL; __EC.reset(); __EC.loadJSON(doc); return before === (await __EC.exportPNG({ download: false })).dataURL; });
    check('PNG exact equality after JSON restore on same browser', imageRoundTrip);
    // Pointer targeting uses paper coordinates, independently of backing DPR.
    const pointer = await page.evaluate(async () => { const { paperBox } = window.EC.render; const r = document.getElementById('world').getBoundingClientRect(), b = paperBox(r.width, r.height); return { x: r.x + b.x + b.width * 0.3, y: r.y + b.y + b.height * 0.6 }; });
    await page.mouse.click(pointer.x, pointer.y);
    check('Pointer FOCUS maps to paper coordinates', await page.evaluate(() => Math.abs(__EC.getState().edit.focusX - 0.3) < 0.005 && Math.abs(__EC.getState().edit.focusY - 0.6) < 0.005));
    const beforeFocus = await page.evaluate(() => __EC.getState().edit.focusX);
    await page.locator('#world').focus(); await page.keyboard.press('ArrowRight');
    check('Keyboard focus control', await page.evaluate(() => __EC.getState().edit.focusX) > beforeFocus);
    await page.locator('#to-output').click();
    const pngDownload = page.waitForEvent('download'); await page.locator('#export-png').click(); const pngFile = await pngDownload;
    await pngFile.saveAs(path.join(out, 'downloaded-artwork.png'));
    check('PNG download via UI', (await pngFile.failure()) === null, pngFile.suggestedFilename());
    const jsonDownload = page.waitForEvent('download'); await page.locator('#save-json').click(); const jsonFile = await jsonDownload;
    await jsonFile.saveAs(path.join(out, 'downloaded-state.json'));
    check('JSON download via UI', (await jsonFile.failure()) === null, jsonFile.suggestedFilename());
    await page.locator('#json-file').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('{}') });
    await page.waitForTimeout(50);
    check('Wrong file extension rejected in UI', (await page.locator('#status').textContent()).includes('拡張子'));
    await page.locator('#json-file').setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 32) });
    await page.waitForTimeout(50); check('Oversized file rejected before reading', (await page.locator('#status').textContent()).includes('2 MiB'));
    await page.locator('#json-file').setInputFiles(path.join(out, 'reproduction.json'));
    await page.waitForFunction(() => __EC.getState().phase === 'EDIT');
    check('JSON file input restores title', await page.evaluate(() => __EC.getState().edit.title) === '同じ/世界');
    for (const [w, h] of [[1440, 900], [1280, 800], [390, 844], [844, 390]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.evaluate(() => { __EC.setEdit({ title: 'EMER/GENCE', sub: 'A FLOCK BECOMES A COMPOSITION.' }); __EC.setPreset('SIGNAL'); });
      await page.waitForTimeout(60);
      for (const phase of ['EDIT', 'OUTPUT', 'RULE', 'COMPARE']) {
        if (phase === 'OUTPUT') await page.locator('#to-output').click();
        if (phase === 'RULE') await page.locator('#back').click();
        if (phase === 'COMPARE') await page.evaluate(() => { __EC.compare(true); __EC.pause(true); __EC.step(120); });
        await page.waitForTimeout(40);
        const bounds = await page.evaluate(() => {
          const controls = [...document.querySelectorAll('button, input, summary')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(e => { const r = e.getBoundingClientRect(); return { id: e.id || e.textContent.trim(), x: r.x, right: r.right, y: r.y, bottom: r.bottom, width: r.width, height: r.height }; });
          const chipsFit = [...document.querySelectorAll('.process li')].every(li => { const r = li.getBoundingClientRect(), t = li.querySelector('span').getBoundingClientRect(); return t.left >= r.left && t.right <= r.right; });
          const stage = document.getElementById('stage').getBoundingClientRect();
          return { overflow: document.documentElement.scrollWidth > innerWidth, controls, chipsFit, chipCount: document.querySelectorAll('[aria-current="step"]').length,
            stage: { width: stage.width, height: stage.height, areaRatio: stage.width * stage.height / (innerWidth * innerHeight) } };
        });
        check(`${w}x${h} ${phase} horizontal fit / current chip`, !bounds.overflow && bounds.controls.every(x => x.x >= -1 && x.right <= w + 1) && bounds.chipsFit && bounds.chipCount === 1, bounds);
        await shot(`${w}x${h}-${phase.toLowerCase()}`);
      }
      await page.evaluate(() => __EC.take('A')); await page.waitForFunction(() => __EC.getState().phase === 'EDIT');
      if (w === 390) {
        if (!await page.locator('#controls').evaluate(el => el.open)) await page.locator('#controls > summary').click();
        await shot('390x844-controls-open');
        const before = await page.evaluate(() => __EC.getState().edit.keep);
        await page.locator('#edit-keep').focus(); await page.keyboard.press('ArrowLeft');
        const after = await page.evaluate(() => __EC.getState().edit.keep);
        check('Mobile keyboard range input', after < before, { before, after });
      }
    }
    // Reduced-motion: initial pause, short transition, same snapshot and all controls.
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload({ waitUntil: 'networkidle' });
    check('Reduced motion starts paused', await page.evaluate(() => __EC.getState().paused));
    await shot('844x390-seed');
    const rm = await page.evaluate(() => { __EC.compare(true); __EC.step(120); const hash = __EC.take('A'); return { hash, duration: __EC.diagnostics().transition.duration }; });
    await page.waitForFunction(() => __EC.getState().phase === 'EDIT');
    check('Reduced motion shortens transition, keeps snapshot', rm.duration === 100 && rm.hash === await page.evaluate(() => __EC.snapshotHash()), rm);
    await shot('844x390-reduced-motion');
    const idle1 = await page.evaluate(() => __EC.diagnostics().frames); await page.waitForTimeout(200); const idle2 = await page.evaluate(() => __EC.diagnostics().frames);
    check('EDIT idle stops drawing', idle1 === idle2, { idle1, idle2 });
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage(); await touchPage.goto(base + '/expression-composer/', { waitUntil: 'networkidle' });
    await touchPage.locator('#begin').tap(); await touchPage.evaluate(() => { __EC.pause(true); __EC.step(100); __EC.take('main'); });
    await touchPage.waitForFunction(() => __EC.getState().phase === 'EDIT');
    const tapPoint = await touchPage.evaluate(async () => { const { paperBox } = window.EC.render; const r = document.getElementById('world').getBoundingClientRect(), b = paperBox(r.width, r.height); return { x: r.x + b.x + b.width * 0.25, y: r.y + b.y + b.height * 0.5 }; });
    await touchPage.touchscreen.tap(tapPoint.x, tapPoint.y);
    check('Synthetic touch BEGIN / FOCUS', await touchPage.evaluate(() => Math.abs(__EC.getState().edit.focusX - 0.25) < 0.01));
    await touchContext.close();
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.setViewportSize({ width: 1440, height: 900 });
    // Short synthetic timing sample; not physical-device FPS or GPU utilization.
    const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
    for (const mode of ['PLAY', 'COMPARE', 'PAUSE', 'EXPORT']) {
      const cpuBefore = await cdp.send('Performance.getMetrics');
      const timing = await page.evaluate(async mode => {
        __EC.compare(mode === 'COMPARE'); __EC.pause(mode === 'PAUSE' || mode === 'EXPORT');
        if (mode === 'EXPORT') { __EC.take('main'); __EC.setPreset('CURRENT'); }
        const frames = [], begin = performance.now(); let last = begin;
        let exportMs = null;
        if (mode === 'EXPORT') { const t = performance.now(); await __EC.exportPNG({ download: false }); exportMs = performance.now() - t; }
        await new Promise(resolve => { function tick(now) { frames.push(now - last); last = now; if (now - begin < 1000) requestAnimationFrame(tick); else resolve(); } requestAnimationFrame(tick); });
        __EC.pause(true); const sorted = frames.slice().sort((a, b) => a - b);
        return { mode, samples: frames.length, ms: performance.now() - begin, p95ms: sorted[Math.floor(sorted.length * 0.95)], heap: performance.memory?.usedJSHeapSize, exportMs };
      }, mode);
      const cpuAfter = await cdp.send('Performance.getMetrics');
      for (const name of ['TaskDuration', 'ScriptDuration']) timing[name + 'Ms'] = (cpuAfter.metrics.find(x => x.name === name).value - cpuBefore.metrics.find(x => x.name === name).value) * 1000;
      report.metrics.push(timing);
    }
    // All names are measured, not selected to guarantee an ON advantage.
    const sweep = await page.evaluate(async () => {
      const { createComparison, stepComparison, comparisonStats } = window.EC.compare;
      const { RULE_PRESETS } = window.EC.sim; const rows = [];
      for (const [name, rules] of Object.entries(RULE_PRESETS)) for (const seed of [42, 7, 2026]) {
        const p = createComparison(seed, rules, 600); stepComparison(p, 600); rows.push({ name, seed, ...comparisonStats(p) });
      }
      const zero = createComparison(42, { ...RULE_PRESETS.COHERE, align: 0 }, 600); stepComparison(zero, 600);
      rows.push({ name: 'ALIGN strength 0', seed: 42, ...comparisonStats(zero) }); return rows;
    });
    report.metrics.push({ name: 'Unfiltered comparison sweep', rows: sweep });
    check('All swept comparisons synchronized', sweep.every(x => x.stepA === x.stepB), sweep);
    check('Zero ALIGN coefficient removes A/B difference', sweep.at(-1).phiA === sweep.at(-1).phiB, sweep.at(-1));
    check('No application JS / HTTP / external-request errors', report.errors.length === 0, report.errors);
    await require('./verify-v02.cjs')(browser, report, check, out);
    // Read-only smoke inspection of existing entries, with network fonts blocked.
    report.existingPages = [];
    for (const relative of ['/index.html', '/scroll-experience/', '/cognitive/01-proximity.html', '/Emergence%20Engine/04_flock.html']) {
      const existing = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
      existing.on('pageerror', e => errors.push(String(e)));
      await existing.route('**/*', route => route.request().url().startsWith(base) || route.request().url().startsWith('data:') ? route.continue() : route.abort());
      const response = await existing.goto(base + relative, { waitUntil: 'domcontentloaded', timeout: 15000 }); await existing.waitForTimeout(400);
      const name = 'reference-' + relative.replace(/[^a-z0-9]/gi, '-');
      await existing.screenshot({ path: path.join(shots, name + '.png') });
      report.existingPages.push({ relative, status: response.status(), title: await existing.title(), errors, note: 'External network blocked; smoke only, not full regression.' }); await existing.close();
    }
  } catch (error) { report.errors.push(String(error.stack || error)); console.error(error); }
  finally {
    if (browser) await browser.close(); server.close();
    report.summary = { pass: report.checks.filter(x => x.result === 'PASS').length, fail: report.checks.filter(x => x.result === 'FAIL').length, errors: report.errors.length };
    fs.writeFileSync(path.join(out, 'test-results.json'), JSON.stringify(report, null, 2) + '\n');
    // Chromium may create temporary files only under the verified task directory.
    if (path.resolve(temp).startsWith(path.resolve(out) + path.sep)) fs.rmSync(temp, { recursive: true, force: true });
    console.log(JSON.stringify(report.summary));
    if (report.summary.fail || report.summary.errors) process.exitCode = 1;
  }
}
run();
