// Render SILENCE/CURRENT/SIGNAL sheets for several seeds via window.__EC. Usage: node sheets.cjs <outdir> [baseURL]
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = process.argv[2], base = process.argv[3] || 'http://localhost:8126/expression-composer/index.html';
const cases = JSON.parse(process.argv[4] || '[[42,600,"A"],[2026,900,"A"],[7,400,"A"],[2026,900,"B"]]');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base); await page.waitForFunction(() => window.__EC);
  for (const [seed, steps, side] of cases) {
    const url = await page.evaluate(async ([seed, steps, side]) => {
      const E = __EC; E.setSeed(seed); E.reset(); E.pause(true); E.compare(true); E.step(steps); E.take(side); E.setEdit({});
      const imgs = [];
      for (const p of ['SILENCE', 'CURRENT', 'SIGNAL']) { E.setPreset(p); const r = await E.exportPNG({ download: false }); const im = new Image(); im.src = r.dataURL; await im.decode(); imgs.push(im); }
      const c = document.createElement('canvas'); c.width = 1400; c.height = 660; const g = c.getContext('2d');
      g.fillStyle = '#333'; g.fillRect(0, 0, 1400, 660); imgs.forEach((im, i) => g.drawImage(im, 20 + i * 460, 20, 450, 600));
      g.fillStyle = '#fff'; g.font = '14px monospace'; g.fillText(`seed ${seed} step ${steps} side ${side} hash ${E.snapshotHash()} phi ${JSON.stringify(E.compareStats())}`, 20, 645);
      return c.toDataURL('image/png');
    }, [seed, steps, side]);
    fs.writeFileSync(path.join(out, `sheet_${seed}_${steps}_${side}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
