const { fs, path, launch, url } = require('./runtime.cjs');
const { isDeepStrictEqual } = require('node:util');
async function run() {
  const runtime = await launch(), checks = [], errors = [], metrics = [];
  const out = path.join(__dirname, 'screens'); fs.mkdirSync(out, { recursive: true });
  try {
    const page = await runtime.browser.newPage({ acceptDownloads: true });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.clock.install();
    for (const [width, height] of [[1440,900], [1280,800], [390,844], [844,390]]) {
      await page.setViewportSize({ width, height }); await page.goto(url); await page.clock.runFor(100);
      await page.locator('#begin').click();
      await page.evaluate(() => { __EC.pause(true); __EC.setSeed(42); __EC.step(600); });
      for (const phase of ['RULE','COMPARE','FREEZE','EDIT','OUTPUT']) {
        if (phase === 'COMPARE') { await page.locator('#compare').click(); await page.evaluate(() => { __EC.pause(true); __EC.step(600); }); }
        if (phase === 'FREEZE') await page.locator('#take-b').click();
        if (phase === 'EDIT') await page.clock.runFor(1200);
        if (phase === 'OUTPUT') await page.locator('#to-output').click();
        await page.clock.runFor(phase === 'FREEZE' ? 400 : 100);
        await page.evaluate(() => scrollTo(0, 0));
        const info = await page.evaluate(phase => {
          const ids = { RULE: ['compare','take-main'], COMPARE: ['take-a','take-b'], FREEZE: [], EDIT: ['to-output'], OUTPUT: ['export-png'] }[phase];
          const rect = e => { const r=e.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right }; };
          const ctas = ids.map(id => { const e=document.getElementById(id), r=rect(e); return { id, ...r, visible: r.width>0 && r.height>0 && r.y>=0 && r.bottom<=innerHeight && r.x>=0 && r.right<=innerWidth }; });
          const selectors = ['.note','.slider small','.slider > span','.text-label','.check span','.seed-row','.metric-note','.preset-row button','.process button','.process small','.transport button span','.compare-labels','.view-controls'];
          const fonts = selectors.flatMap(s => [...document.querySelectorAll(s)].filter(e => e.getBoundingClientRect().height>0 && e.getClientRects().length).map(e => ({ selector:s, size:parseFloat(getComputedStyle(e).fontSize) })));
          return { phase:__EC.getState().phase, scrollY, stage:rect(document.getElementById('stage')), overflow:document.documentElement.scrollWidth>innerWidth, ctas, minFont:Math.min(...fonts.map(f=>f.size)), fonts };
        }, phase);
        metrics.push({ width,height,phase,...info });
        checks.push({ name:`${width} ${phase} stage / fonts / overflow`, pass: info.phase===phase && !info.overflow && info.minFont >= (width===1440||width===1280?11:10) });
        if(width===1440) checks.push({ name:`1440 ${phase} initial CTA`, pass:info.ctas.every(c=>c.visible), evidence:info.ctas });
        await page.screenshot({ path:path.join(out,`${width}x${height}-${phase.toLowerCase()}.png`), fullPage:true });
        if(width===1440) await page.screenshot({ path:path.join(out,`1440x900-${phase.toLowerCase()}-viewport.png`) });
      }
    }
    // Full file:// path using actual controls and downloads; snapshot B, all three presets.
    await page.setViewportSize({width:1440,height:900}); await page.goto(url); await page.clock.runFor(100);
    await page.locator('#begin').click(); await page.locator('#compare').click();
    await page.evaluate(() => { __EC.pause(true); __EC.step(600); }); await page.locator('#take-b').click(); await page.clock.runFor(1300);
    for(const p of ['SILENCE','CURRENT','SIGNAL']) await page.locator(`#edit-controls [data-preset="${p}"]`).click();
    const before=await page.evaluate(async()=>({doc:__EC.exportJSON(),png:(await __EC.exportPNG({download:false})).dataURL}));
    await page.locator('#to-output').click();
    const pngWait=page.waitForEvent('download'); await page.locator('#export-png').click(); await (await pngWait).saveAs(path.join(__dirname,'file-path.png'));
    const jsonWait=page.waitForEvent('download'); await page.locator('#save-json').click(); await (await jsonWait).saveAs(path.join(__dirname,'file-path.json'));
    await page.locator('#json-file').setInputFiles(path.join(__dirname,'file-path.json')); await page.clock.runFor(100);
    const after=await page.evaluate(async()=>({doc:__EC.exportJSON(),png:(await __EC.exportPNG({download:false})).dataURL}));
    checks.push({name:'file begin / LOCK / B / 3 presets / PNG / JSON / load pixel identical',pass:isDeepStrictEqual(before.doc,after.doc)&&before.png===after.png,evidence:{hash:after.doc.snapshot.hash,side:after.doc.snapshot.side,documentEqual:isDeepStrictEqual(before.doc,after.doc),pngEqual:before.png===after.png}});
    checks.push({name:'file console errors zero',pass:!errors.length,evidence:errors});
    const report={browser:runtime.browser.version(),checks,metrics,pass:checks.filter(c=>c.pass).length,fail:checks.filter(c=>!c.pass).length};
    fs.writeFileSync(path.join(__dirname,'screen-results.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({pass:report.pass,fail:report.fail,failures:checks.filter(c=>!c.pass)})); if(report.fail)process.exitCode=1;
  } finally { await runtime.close(); }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
