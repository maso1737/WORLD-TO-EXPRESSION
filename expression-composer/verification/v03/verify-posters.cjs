const { fs, path, app, launch, saveImage, url } = require('./runtime.cjs');
async function run() {
  const runtime = await launch(), checks = [], samples = [], errors = [];
  try {
    const page = await runtime.browser.newPage();
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url);
    for (const seed of [7, 42, 2026]) for (const side of ['A', 'B']) for (const step of [400, 600, 900]) {
      const result = await page.evaluate(async ({ seed, side, step }) => {
        __EC.pause(true); __EC.setRules(EC.sim.DEFAULT_RULES); __EC.setSeed(seed); __EC.compare(true); __EC.step(step); __EC.take(side);
        const hash = __EC.snapshotHash(), rows = [], sheet = document.createElement('canvas'); sheet.width = 1080; sheet.height = 520;
        const sc = sheet.getContext('2d'); sc.fillStyle = '#070707'; sc.fillRect(0, 0, 1080, 520);
        for (const [index, preset] of ['SILENCE', 'CURRENT', 'SIGNAL'].entries()) {
          __EC.setPreset(preset); const doc = __EC.exportJSON(), layout = __EC.getState().layout;
          const one = await __EC.exportPNG({ download: false }), two = await __EC.exportPNG({ download: false });
          const preview = document.createElement('canvas'); preview.width = 360; preview.height = 480;
          const g = EC.render.renderComposition(doc, preview);
          const full = document.createElement('canvas'); full.width = 1800; full.height = 2400; const fg = EC.render.renderComposition(doc, full);
          // Observe the actual drawing calls, including per-glyph tracking, fallback fonts,
          // textBaseline, fitted long lines, title keyline, metadata and footer.
          const glyphs = [], ctx = full.getContext('2d');
          const fillText = ctx.fillText, strokeText = ctx.strokeText;
          for (const method of ['fillText', 'strokeText']) ctx[method] = function(text, x, y, ...args) {
            const m = this.measureText(text), pad = full.width * 0.005 + (method === 'strokeText' ? this.lineWidth / 2 : 0);
            if (m.actualBoundingBoxRight + m.actualBoundingBoxLeft > 0 && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 0) glyphs.push({
              text, title: this.textBaseline === 'top', x0: x - m.actualBoundingBoxLeft - pad, x1: x + m.actualBoundingBoxRight + pad,
              y0: y - m.actualBoundingBoxAscent - pad, y1: y + m.actualBoundingBoxDescent + pad });
            return (method === 'fillText' ? fillText : strokeText).call(this, text, x, y, ...args);
          };
          EC.render.drawTypography(ctx, doc, full.width, full.height);
          ctx.fillText = fillText; ctx.strokeText = strokeText;
          // Restore a clean rendering for the independent yellow-pixel comparison below.
          EC.render.renderComposition(doc, full);
          const visible = fg.points.filter(p => p.visible);
          const distance = (x, y, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1));
          const touches = (x, y, radius = 0) => glyphs.some(r => distance(x, y, r) <= radius);
          const pointHits = visible.filter(p => touches(p.x, p.y)).map(p => p.id);
          const dotHits = visible.filter(p => touches(p.x, p.y, p.radius)).map(p => p.id);
          const midpointHits = doc.edit.trace > 0 ? visible.filter(p => touches(p.x - p.dx / 2, p.y - p.dy / 2)).map(p => p.id) : [];
          const minClearance = Math.min(...visible.map(p => Math.min(...glyphs.map(r => distance(p.x, p.y, r))) - p.radius)) / full.width;
          const minTitleClearance = Math.min(...visible.map(p => Math.min(...glyphs.filter(r => r.title).map(r => distance(p.x, p.y, r))) - p.radius)) / full.width;
          const widthRatio = (Math.max(...visible.map(p => p.x)) - Math.min(...visible.map(p => p.x))) / full.width;
          const heightRatio = (Math.max(...visible.map(p => p.y)) - Math.min(...visible.map(p => p.y))) / full.height;
          const yellowTouches = preset === 'SIGNAL' && touches(fg.focus.x, fg.focus.y, full.width * (0.006 + doc.edit.focusAmt * 0.008));
          const frameGaps = layout.candidates.map(c => {
            const [x, y, w, h] = c.rect, [x0, y0, x1, y1] = c.frame.box;
            return Math.max(x0 - x - w, x - x1, (y0 - y - h) * 4 / 3, (y - y1) * 4 / 3);
          });
          const frozen = document.createElement('canvas'), reference = document.createElement('canvas');
          frozen.width = reference.width = 480; frozen.height = reference.height = 640;
          const box = EC.render.paperBox(480, 640), paper = document.createElement('canvas');
          paper.width = Math.round(box.width); paper.height = Math.round(box.height);
          EC.render.renderComposition(doc, paper);
          const rc = reference.getContext('2d'); rc.fillStyle = '#070707'; rc.fillRect(0, 0, 480, 640); rc.drawImage(paper, box.x, box.y, box.width, box.height);
          EC.render.renderFreeze(frozen.getContext('2d'), doc, 480, 640, [], 1);
          const a = reference.getContext('2d').getImageData(0, 0, 480, 640).data, b = frozen.getContext('2d').getImageData(0, 0, 480, 640).data;
          let freezeDiff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) freezeDiff++;
          let yellowDiff = 0;
          if (preset === 'SIGNAL') {
            const typed = full.getContext('2d').getImageData(0, 0, 1800, 2400).data;
            EC.render.renderComposition({ ...doc, edit: { ...doc.edit, typeOn: false } }, full);
            const plain = full.getContext('2d').getImageData(0, 0, 1800, 2400).data;
            for (let i = 0; i < plain.length; i += 4) if (plain[i] > 240 && plain[i+1] > 180 && plain[i+2] < 40) {
              if (plain[i] !== typed[i] || plain[i+1] !== typed[i+1] || plain[i+2] !== typed[i+2]) yellowDiff++;
            }
          }
          sc.drawImage(preview, index * 360, 40); sc.fillStyle = '#f2f2ef'; sc.font = '12px monospace'; sc.fillText(`${preset} / ${layout.id}`, index * 360 + 8, 17); sc.fillText(`seed ${seed} ${side} step ${step}`, index * 360 + 8, 33);
          rows.push({ preset, layout, glyphCount: glyphs.length, pointHits, dotHits, midpointHits, minClearance, minTitleClearance, widthRatio, heightRatio, yellowTouches, frameGaps, freezeDiff,
            noLayoutInJSON: !('layout' in doc) && !('layout' in doc.edit),
            deterministic: one.dataURL === two.dataURL, dimensions: [one.width, one.height], sameLayout: JSON.stringify(layout) === JSON.stringify(g.layout) && JSON.stringify(layout) === JSON.stringify(fg.layout), yellowDiff, hashUnchanged: __EC.snapshotHash() === hash });
        }
        return { rows, image: sheet.toDataURL(), hash };
      }, { seed, side, step });
      const file = `posters_seed${seed}_${side}_step${step}.png`; saveImage(path.join(__dirname, file), result.image);
      samples.push({ seed, side, step, file, hash: result.hash, rows: result.rows });
      for (const row of result.rows) checks.push({ name: `${seed}/${side}/${step}/${row.preset}`, pass: row.deterministic && row.sameLayout && row.yellowDiff === 0 && !row.yellowTouches && row.hashUnchanged && row.dimensions[0] === 1800 && row.dimensions[1] === 2400 && row.glyphCount > 0 && !row.pointHits.length && !row.dotHits.length && !row.midpointHits.length && row.frameGaps.every(g => g >= 0.03 - 1e-12) && row.freezeDiff === 0 && row.noLayoutInJSON && (row.preset === 'SILENCE' || Math.max(row.widthRatio, row.heightRatio) >= 0.55) });
    }
    const thumbnails = samples.map(s => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, s.file)).toString('base64'));
    const overview = await page.evaluate(async urls => {
      const c = document.createElement('canvas'); c.width = 1620; c.height = 1560; const ctx = c.getContext('2d');
      for (let i = 0; i < urls.length; i++) { const img = new Image(); img.src = urls[i]; await img.decode(); ctx.drawImage(img, (i % 3) * 540, Math.floor(i / 3) * 260, 540, 260); }
      return c.toDataURL();
    }, thumbnails);
    saveImage(path.join(__dirname, 'poster-overview.png'), overview);
    // Exercise typography edits and all focus corners without changing particle coordinates.
    const stress = await page.evaluate(() => {
      const results = [];
      for (const title of ['MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM', '静かな世界の構造を観察して自分の表現を発見する/生成する現象']) for (const x of [0, 0.5, 1]) for (const y of [0, 0.5, 1]) {
        __EC.setPreset('SIGNAL'); __EC.setEdit({ title, focusX: x, focusY: y, focusAmt: 1, space: 0, keep: 1 });
        const l = __EC.getState().layout, chosen = l.candidates.find(c => c.id === l.id);
        results.push({ title, x, y, layout: l.id, safe: !chosen.overlapsFocus });
      }
      return results;
    });
    checks.push({ name: 'long titles / focus grid reserved clear area', pass: stress.every(s => s.safe), evidence: stress });
    const old = JSON.parse(fs.readFileSync(path.join(app, 'verification/reproduction.json'), 'utf8'));
    const restored = await page.evaluate(old => { const result = __EC.loadJSON(old); return { result, hash: __EC.snapshotHash(), edit: __EC.getState().edit }; }, old);
    checks.push({ name: 'v0.2 JSON hash and edit compatibility', pass: restored.result.ok && restored.hash === old.snapshot.hash && JSON.stringify(restored.edit) === JSON.stringify(old.edit), evidence: restored });
    checks.push({ name: 'file console errors zero', pass: !errors.length, evidence: errors });
    const rows = samples.flatMap(s => s.rows.map(r => ({ seed: s.seed, side: s.side, step: s.step, file: s.file, ...r })));
    const summarize = r => ({ seed: r.seed, side: r.side, step: r.step, preset: r.preset, file: r.file, minClearance: r.minClearance, minTitleClearance: r.minTitleClearance, widthRatio: r.widthRatio, heightRatio: r.heightRatio, midpointHits: r.midpointHits });
    const metrics = {
      posters: rows.length, pointHits: rows.reduce((n, r) => n + r.pointHits.length, 0), dotHits: rows.reduce((n, r) => n + r.dotHits.length, 0), midpointHits: rows.reduce((n, r) => n + r.midpointHits.length, 0),
      smallestExtent: Math.min(...rows.filter(r => r.preset !== 'SILENCE').map(r => Math.max(r.widthRatio, r.heightRatio))),
      tightest: summarize(rows.reduce((a, b) => a.minClearance < b.minClearance ? a : b)),
      tightestTitle: summarize(rows.reduce((a, b) => a.minTitleClearance < b.minTitleClearance ? a : b)),
      worstMidpoint: summarize(rows.reduce((a, b) => a.midpointHits.length >= b.midpointHits.length ? a : b))
    };
    const report = { browser: runtime.browser.version(), metrics, checks, samples, pass: checks.filter(c => c.pass).length, fail: checks.filter(c => !c.pass).length };
    fs.writeFileSync(path.join(__dirname, 'poster-results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ pass: report.pass, fail: report.fail, metrics, failures: checks.filter(c => !c.pass), variants: Object.fromEntries(['SILENCE','CURRENT','SIGNAL'].map(p => [p, [...new Set(samples.flatMap(s => s.rows.filter(r => r.preset === p).map(r => r.layout.id)))]])) }));
    if (report.fail) process.exitCode = 1;
  } finally { await runtime.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
