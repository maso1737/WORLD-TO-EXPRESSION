const { fs, path, launch, saveImage, url } = require('./runtime.cjs');
async function run() {
  const runtime = await launch(), checks = [];
  try {
    const page = await runtime.browser.newPage(); await page.goto(url);
    for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(70);
      for (const preset of ['SILENCE', 'CURRENT', 'SIGNAL']) {
        const result = await page.evaluate(preset => {
          __EC.pause(true); __EC.setSeed(42); __EC.compare(true); __EC.step(600); __EC.setPreset(preset);
          __EC.take('B');
          const doc = __EC.exportJSON(), tr = __EC.diagnostics().transition;
          const c = document.getElementById('world'), w = c.getBoundingClientRect().width, h = c.getBoundingClientRect().height;
          const make = () => { const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; };
          const a = make(), b = make(), ca = a.getContext('2d'), cb = b.getContext('2d');
          const diff = () => { const aa = ca.getImageData(0, 0, a.width, a.height).data, bb = cb.getImageData(0, 0, b.width, b.height).data; let n = 0; for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) n++; return n; };
          ca.fillStyle = '#070707'; ca.fillRect(0, 0, w, h);
          EC.render.renderWorld(ca, { particles: doc.snapshot.particles }, EC.render.worldBox(w, h, 'B', true), tr.from.view);
          EC.render.renderFreeze(cb, doc, w, h, tr.source, 0, tr.from);
          const startDiff = diff();
          EC.render.renderFreeze(cb, doc, w, h, tr.source, 0.15, tr.from);
          const holdDiff = diff();
          const box = EC.render.paperBox(w, h), paper = document.createElement('canvas'); paper.width = Math.round(box.width); paper.height = Math.round(box.height);
          // Independent reference: do not composite a fractional final row over the source frame.
          ca.clearRect(0, 0, a.width, a.height);
          EC.render.renderComposition(doc, paper); ca.fillStyle = '#070707'; ca.fillRect(0, 0, w, h); ca.drawImage(paper, box.x, box.y, box.width, box.height);
          EC.render.renderFreeze(cb, doc, w, h, tr.source, 1, tr.from);
          const endDiff = diff();
          const percentages = [0, 15, 35, 60, 80, 90, 100], frames = [];
          const strip = document.createElement('canvas'), tileW = Math.round(w * (w > 600 ? 0.4 : 0.65)), tileH = Math.round(h * tileW / w);
          strip.width = tileW * 7; strip.height = tileH + 34;
          const sc = strip.getContext('2d'); sc.fillStyle = '#070707'; sc.fillRect(0, 0, strip.width, strip.height);
          percentages.forEach((pct, i) => {
            const p = pct / 100, g = EC.render.freezeGeometry(doc, w, h, tr.source, p);
            const primary = g.points.filter(q => q.primary);
            EC.render.renderFreeze(cb, doc, w, h, tr.source, p, tr.from);
            sc.drawImage(b, i * tileW, 34, tileW, tileH); sc.fillStyle = '#f2f2ef'; sc.font = '13px monospace'; sc.fillText(`${pct}% ${g.timing.beat}`, i * tileW + 8, 22);
            frames.push({ pct, ids: primary.map(q => q.id), positiveAlpha: primary.filter(q => q.alpha > 0).length,
              mapping: primary.every(q => { const src = tr.source.find(s => s.primary && s.id === q.id), target = g.composition.points[q.id]; return Math.abs(q.x - (src.x * w + (g.box.x + target.x - src.x * w) * g.timing.move)) < 1e-9; }) });
          });
          const stillA = EC.render.freezeGeometry(doc, w, h, tr.source, 0.70), stillB = EC.render.freezeGeometry(doc, w, h, tr.source, 0.88);
          return { startDiff, holdDiff, endDiff, duration: tr.duration, frames, still: JSON.stringify(stillA.points) === JSON.stringify(stillB.points), image: strip.toDataURL() };
        }, preset);
        saveImage(path.join(__dirname, `freeze_strip_${label}_${preset.toLowerCase()}.png`), result.image); delete result.image;
        checks.push({ name: `${label} ${preset} source / hold / endpoint pixels, 600 IDs, mapping, quiet`, pass: result.startDiff === 0 && result.holdDiff === 0 && result.endDiff === 0 && result.duration <= 1150 && result.still && result.frames.every(f => f.ids.length === 600 && new Set(f.ids).size === 600 && f.mapping && (f.pct === 100 || f.positiveAlpha === 600)), evidence: result });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
    const rm = await page.evaluate(() => { __EC.compare(true); __EC.take('A'); return { duration: __EC.diagnostics().transition.duration, hash: __EC.snapshotHash() }; });
    await page.waitForFunction(() => __EC.getState().phase === 'EDIT');
    checks.push({ name: 'reduced motion 100 ms keeps hash', pass: rm.duration === 100 && rm.hash === await page.evaluate(() => __EC.snapshotHash()), evidence: rm });
    const report = { checks, pass: checks.filter(c => c.pass).length, fail: checks.filter(c => !c.pass).length };
    fs.writeFileSync(path.join(__dirname, 'freeze-results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ pass: report.pass, fail: report.fail, results: checks.map(c => ({ name: c.name, pass: c.pass, start: c.evidence.startDiff, end: c.evidence.endDiff })) })); if (report.fail) process.exitCode = 1;
  } finally { await runtime.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
