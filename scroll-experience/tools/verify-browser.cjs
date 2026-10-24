/* Local Chromium QA. Uses the bundled Playwright; never installs packages. */
const {chromium}=require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification');fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
 const report={browser:await browser.version(),viewports:[],errors:[],checks:{},generated:new Date().toISOString()};
 const sizes=[[1440,900],[1280,800],[768,1024],[390,844]];
 for(const [width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>window.WTE?.engine?.state.draws>0);
  const v={width,height,frames:[],overflow:false,controlsInBounds:true};
  for(let scene=0;scene<7;scene++)for(const p of [0,.25,.5,.75,1]){
    await page.evaluate(({scene,p})=>{const e=WTE.engine;const length=[2.4,5.7,3.2,4.6,3.8,5.5,4.9][scene]*innerHeight;e.jump(scene,p===1?(length-2)/length:p);},{scene,p});
    await page.waitForFunction(s=>WTE.engine.state.index===s,scene,{timeout:5000}).catch(async e=>{throw new Error(`Scene jump ${width}x${height} scene=${scene} p=${p}: `+JSON.stringify(await page.evaluate(()=>({state:WTE.engine.state,y:scrollY,bounds:WTE.engine.bounds})))+' '+e.message);});await page.waitForTimeout(35);
    const name=`${width}x${height}-act${scene}-${Math.round(p*100)}.png`;await page.screenshot({path:path.join(out,name)});
    v.frames.push(name);
    const check=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,controls:[...document.querySelectorAll('.actions>*:not([hidden]),.chapter-nav a')].every(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})}));
    v.overflow||=check.overflow;v.controlsInBounds&&=check.controls;
  }
  if(width===1440){
   await page.evaluate(()=>WTE.engine.jump(1,.575));await page.waitForTimeout(70);const before=hash(await page.locator('canvas').screenshot());
   await page.evaluate(()=>WTE.engine.jump(5,.5));await page.waitForTimeout(70);await page.evaluate(()=>WTE.engine.jump(1,.575));await page.waitForTimeout(70);
   report.checks.reversePixelIdentical=before===hash(await page.locator('canvas').screenshot());
   const idle=await page.evaluate(()=>WTE.engine.state.draws);await page.waitForTimeout(450);report.checks.idleDraws=await page.evaluate(n=>WTE.engine.state.draws-n,idle);
   await page.locator('#hold').click();await page.waitForTimeout(50);const holdBefore=hash(await page.locator('canvas').screenshot());await page.mouse.wheel(0,1100);await page.waitForTimeout(80);report.checks.holdPixelIdentical=holdBefore===hash(await page.locator('canvas').screenshot());await page.locator('#hold').click();
   await page.evaluate(()=>WTE.engine.jump(5,.10));await page.waitForTimeout(60);const proofBefore=hash(await page.locator('canvas').screenshot());await page.locator('#proof').click();await page.waitForTimeout(60);report.checks.proofChangesFrame=proofBefore!==hash(await page.locator('canvas').screenshot());await page.screenshot({path:path.join(out,'1440-proof-muller.png')});await page.locator('#proof').click();
   for(let i=0;i<7;i++){await page.locator('.chapter-nav a').nth(i).click();await page.waitForTimeout(25);if(await page.evaluate(()=>WTE.engine.state.index)!==i)report.errors.push('Navigation mismatch '+i);}
   report.checks.chapterNavigation=true;
   await page.evaluate(()=>WTE.engine.jump(3,.62));await page.waitForTimeout(50);const y=await page.evaluate(()=>scrollY);await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(80);report.checks.reloadRestoresPosition=Math.abs(await page.evaluate(()=>scrollY)-y)<2;
   await page.keyboard.press('PageDown');await page.waitForTimeout(350);report.checks.keyboardScroll=await page.evaluate(n=>scrollY>n,y);
   await page.evaluate(()=>WTE.engine.jump(6,.95));await page.waitForTimeout(80);const downloadPromise=page.waitForEvent('download');await page.locator('#capture').click();const download=await downloadPromise;await download.saveAs(path.join(out,'WORLD-TO-EXPRESSION-poster.png'));report.checks.captureBytes=fs.statSync(path.join(out,'WORLD-TO-EXPRESSION-poster.png')).size;
   report.checks.heapBytes=await page.evaluate(()=>performance.memory?.usedJSHeapSize||null);
   const times=await page.evaluate(()=>{const c=document.getElementById('world').getContext('2d'),out=[];for(let s=0;s<7;s++){let max=0;for(let i=0;i<20;i++){const start=performance.now();c.save();WTE.scenes[s].render(c,innerWidth,innerHeight,i/19,{proof:false});c.restore();max=Math.max(max,performance.now()-start);}out.push({scene:s,maxRenderMs:max});}WTE.engine.request();return out;});report.checks.renderTimes=times;
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);report.checks.resizeKeepsScene=await page.evaluate(()=>WTE.engine.state.index===6&&WTE.engine.state.width===390);await page.setViewportSize({width,height});
   await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>WTE.engine.jump(3,.34));await page.waitForTimeout(60);report.checks.reducedMotion=await page.evaluate(()=>WTE.engine.state.reduced&&WTE.engine.state.progress===.29);
   await page.screenshot({path:path.join(out,'1440-reduced-motion.png')});
  }
  if(width===390){
   await page.locator('.chapter-nav a').nth(4).tap();await page.waitForTimeout(80);report.checks.touchNavigation=await page.evaluate(()=>WTE.engine.state.index===4);
   const session=await context.newCDPSession(page),y=await page.evaluate(()=>scrollY);
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:600,id:1}]});
   for(let i=1;i<=12;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:600-i*28,id:1}]});await page.waitForTimeout(22);}
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
   report.checks.emulatedTouchScroll=await page.evaluate(n=>scrollY>n,y);
  }
  report.viewports.push(v);await context.close();
 }
 await browser.close();fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(report.errors.length||report.viewports.some(v=>v.overflow||!v.controlsInBounds)||Object.values(report.checks).some(v=>v===false))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
