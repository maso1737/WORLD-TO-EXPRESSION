// Run only before v0.3 app edits. Refuses to replace the fixed baseline.
const { fs, path, app, launch, saveImage, url } = require('./runtime.cjs');
const crypto = require('node:crypto');
const out = path.join(__dirname, 'baseline');
async function run() {
  if (fs.existsSync(path.join(out, 'baseline.json'))) throw Error('Baseline already fixed');
  const hashes = {};
  for (const file of ['index.html', 'styles.css', ...fs.readdirSync(path.join(app, 'js')).map(f => 'js/' + f)]) {
    const bytes = fs.readFileSync(path.join(app, file));
    if (!bytes.equals(fs.readFileSync(path.join(app, '_backup_v02', file)))) throw Error('Backup mismatch: ' + file);
    hashes[file] = crypto.createHash('sha256').update(bytes).digest('hex');
  }
  // Preserve the prior run's artifacts before any regression runner can write results.
  for (const name of fs.readdirSync(path.join(app, 'verification'))) {
    if (name === 'v03' || name === 'claude-review' || name === 'browser-temp') continue;
    fs.cpSync(path.join(app, 'verification', name), path.join(out, 'previous', name), { recursive: true });
  }
  const runtime = await launch();
  try {
    const page = await runtime.browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url); await page.evaluate(() => __EC.pause(true));
    await page.locator('#begin').click();
    await page.evaluate(() => { __EC.pause(true); __EC.setSeed(42); __EC.step(600); });
    await page.screenshot({ path: path.join(out, 'rule.png'), fullPage: true });
    const data = await page.evaluate(() => { __EC.compare(true); __EC.step(600); return { deterministic: __EC.simDeterminism(42, 600), stats: __EC.compareStats(), view: __EC.getState().view }; });
    await page.screenshot({ path: path.join(out, 'compare.png'), fullPage: true });
    await page.evaluate(() => { __EC.take('A'); __EC.setPreset('SILENCE'); });
    data.document = await page.evaluate(() => __EC.exportJSON());
    for (const preset of ['SILENCE', 'CURRENT', 'SIGNAL']) {
      saveImage(path.join(out, preset + '.png'), await page.evaluate(async p => { __EC.setPreset(p); return (await __EC.exportPNG({ download: false })).dataURL; }, preset));
    }
    await page.screenshot({ path: path.join(out, 'edit.png'), fullPage: true });
    fs.writeFileSync(path.join(out, 'baseline.json'), JSON.stringify({ browser: runtime.browser.version(), hashes, ...data }, null, 2) + '\n');
    console.log(JSON.stringify({ deterministic: data.deterministic, stats: data.stats, backupFiles: Object.keys(hashes).length }));
  } finally { await runtime.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
