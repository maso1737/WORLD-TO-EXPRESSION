const { chromium } = require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:8126/expression-composer/index.html'); await p.waitForFunction(() => window.__EC);
  await p.evaluate(() => { __EC.setSeed(42); __EC.reset(); __EC.pause(true); __EC.step(600); });
  await p.waitForTimeout(200);
  await p.screenshot({ path: 'fr_0.png', clip: { x: 0, y: 130, width: 1100, height: 720 } });
  await p.evaluate(() => __EC.take('main'));
  for (const t of [250, 550, 850]) { await p.waitForTimeout(t === 250 ? 250 : 300); await p.screenshot({ path: `fr_${t}.png`, clip: { x: 0, y: 130, width: 1100, height: 720 } }); }
  await p.waitForTimeout(600); await p.screenshot({ path: 'fr_end.png', clip: { x: 0, y: 130, width: 1100, height: 720 } });
  await b.close();
})();
