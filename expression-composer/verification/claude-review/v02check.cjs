// v0.2 additions: ZOOM (view only), clickable process chips, COMPARE nudge, FOCUS radius spread. Usage: node v02check.cjs [url]
const { chromium } = require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url = process.argv[2] || 'file:///C:/Users/so173/Documents/Claude/Projects/WORLD%20TO%20EXPRESSION/expression-composer/index.html';
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(url); await p.waitForFunction(() => window.__EC);
  const R = {};
  const chips = () => p.$$eval('[data-chip]', els => els.map(e => ({ chip: e.dataset.chip, tag: e.tagName, disabled: e.disabled ?? e.getAttribute('aria-disabled'), current: e.getAttribute('aria-current'), done: e.classList.contains('done'), title: e.title })));
  R.chipsAtStart = await chips();
  await p.click('#begin'); await p.evaluate(() => __EC.pause(true));
  const zoomEl = await p.$('input[type=range][id*=zoom]'); R.zoomId = zoomEl && await zoomEl.getAttribute('id');
  const det0 = await p.evaluate(() => __EC.simDeterminism(42, 600));
  for (const v of ['1', '3']) {
    await p.$eval('#' + R.zoomId, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
    await p.waitForTimeout(150);
    R['zoom' + v] = await p.evaluate(() => ({ view: __EC.getState().view, det: __EC.simDeterminism(42, 600) }));
    await p.screenshot({ path: process.argv[3] ? `${process.argv[3]}/zoom${v}.png` : `zoom${v}.png`, clip: { x: 0, y: 200, width: 1100, height: 740 } });
  }
  R.det0 = det0;
  // nudge after touching ALIGN
  const nudgeBefore = await p.evaluate(() => [...document.querySelectorAll('[id*=nudge],[class*=nudge]')].map(e => ({ id: e.id, hidden: e.hidden, text: e.textContent.trim() })));
  await p.click('#align-toggle'); await p.waitForTimeout(200); await p.click('#align-toggle'); await p.waitForTimeout(200);
  R.nudge = { before: nudgeBefore, after: await p.evaluate(() => [...document.querySelectorAll('[id*=nudge],[class*=nudge]')].map(e => ({ id: e.id, hidden: e.hidden, text: e.textContent.trim() }))) };
  R.chipsInRule = await chips();
  // chip 3 -> COMPARE
  await p.click('[data-chip="PERCEPTION"]'); R.afterChip3 = await p.evaluate(() => __EC.getState().phase);
  await p.evaluate(() => __EC.step(300)); await p.click('#take-a'); await p.waitForTimeout(1500);
  R.chipsAfterTake = await chips();
  await p.click('[data-chip="EXPRESSION"]'); R.afterChip5 = await p.evaluate(() => __EC.getState().phase);
  await p.click('[data-chip="RULE"]'); R.afterChip1 = await p.evaluate(() => __EC.getState().phase);
  await p.click('[data-chip="EDIT"]'); R.afterChip4 = await p.evaluate(() => __EC.getState().phase);
  // FOCUS radius spread
  R.focus = await p.evaluate(() => {
    const g = a => { __EC.setEdit({ focusAmt: a }); const s = __EC.exportJSON(); const r = window.EC.composition.compositionGeometry(s.snapshot, s.edit, 'SIGNAL', 1800, 2400).points.filter(q => q.visible).map(q => q.radius); return [Math.min(...r).toFixed(2), Math.max(...r).toFixed(2)]; };
    __EC.setPreset('SIGNAL'); return { amt0: g(0), amt1: g(1) };
  });
  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
