const { fs, path, launch, url } = require('./runtime.cjs');
async function run() {
  const runtime = await launch(), checks = [];
  const check = (name, pass, evidence) => checks.push({ name, pass, evidence });
  try {
    const page = await runtime.browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url);
    for (const [width, height] of [[1440, 900], [1280, 800], [390, 844], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { __EC.pause(true); __EC.setSeed(42); __EC.compare(true); });
      await page.waitForTimeout(80);
      const initial = await page.evaluate(() => {
        const c = document.getElementById('world'), ctx = c.getContext('2d'), half = c.width / 2;
        const a = ctx.getImageData(0, 0, half, c.height).data, b = ctx.getImageData(half, 0, half, c.height).data;
        let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
        const view = __EC.getState().view;
        const simA = EC.sim.createSim(42), simB = EC.sim.createSim(42, { ...EC.sim.DEFAULT_RULES, alignOn: false });
        const box = EC.render.worldBox(half, c.height);
        return { diff, half, view, sameWorld: JSON.stringify(simA.particles) === JSON.stringify(simB.particles),
          sameProjection: JSON.stringify(EC.render.worldPoints(simA, box, view.A)) === JSON.stringify(EC.render.worldPoints(simB, box, view.B)) };
      });
      check(`${width}x${height} LOCK step0 identical world / projection / pixels`, initial.diff === 0 && initial.sameWorld && initial.sameProjection && JSON.stringify(initial.view.A) === JSON.stringify(initial.view.B), initial);
    }
    const invariant = await page.evaluate(() => {
      __EC.step(600); __EC.take('A'); __EC.setPreset('SILENCE');
      const before = { stats: __EC.compareStats(), doc: __EC.exportJSON() };
      const views = [];
      for (const mode of ['FOLLOW', 'LOCK']) for (const z of [1, 3, 1.8]) { __EC.setViewMode(mode); __EC.setZoom(z); views.push(__EC.getState().view); }
      return { before, after: { stats: __EC.compareStats(), doc: __EC.exportJSON() }, views, hash: __EC.simDeterminism(42, 600) };
    });
    const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline/baseline.json')));
    check('step600 hash and Phi match live v02 baseline', invariant.hash === '5828ce7f' && JSON.stringify(invariant.before.stats) === JSON.stringify(baseline.stats), invariant.before.stats);
    check('LOCK FOLLOW ZOOM preserve sim stats and artwork document', JSON.stringify(invariant.before) === JSON.stringify(invariant.after), { views: invariant.views });
    check('FOLLOW keeps independent tracking', invariant.views[0].A.camX !== invariant.views[0].B.camX || invariant.views[0].A.camY !== invariant.views[0].B.camY);
    const report = { browser: runtime.browser.version(), checks, pass: checks.filter(c => c.pass).length, fail: checks.filter(c => !c.pass).length };
    fs.writeFileSync(path.join(__dirname, 'causal-results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report)); if (report.fail) process.exitCode = 1;
  } finally { await runtime.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
