/* Real browser input/PNG checks. Keyboard and scroll are automated, not physical. */
const {chromium}=require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out=path.resolve(__dirname,'../verification/final-polish-20261025');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
 const report={browser:await browser.version(),method:'Headless Chrome, automated keyboard/native scroll, viewport/media emulation; no physical-device test',checks:[],errors:[],links:[],motion:[]};
 const check=(name,passed,evidence)=>report.checks.push({name,passed,evidence});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,acceptDownloads:true});
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  const jump=async(scene,p,proof=false)=>{
   await page.evaluate(({scene,p,proof})=>{WTE.engine.setProof(proof);WTE.engine.jump(scene,p);},{scene,p,proof});
   await page.waitForFunction(({scene,p})=>WTE.engine.state.index===scene&&Math.abs(WTE.engine.state.rawProgress-p)<.002,{scene,p});await page.waitForTimeout(40);
  };
  const settle=()=>page.waitForFunction(()=>WTE.engine.state.displayY===WTE.engine.state.targetY);
  const png=()=>page.evaluate(()=>document.getElementById('world').toDataURL());
  await page.keyboard.press('Tab');check('first Tab reaches skip',await page.locator('.skip').evaluate(e=>e===document.activeElement));
  const startY=await page.evaluate(()=>scrollY);await page.keyboard.press('Enter');
  check('skip Enter focuses first control without scrolling',await page.evaluate(y=>document.activeElement===document.querySelector('.chapter-nav a')&&scrollY===y,startY));
  check('keyboard focus ring retained',await page.locator('.chapter-nav a').first().evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));
  await page.keyboard.press('Tab');await page.keyboard.press('Enter');await page.waitForTimeout(80);
  check('Tab Enter activates next chapter',await page.evaluate(()=>WTE.engine.state.index===1));
  for(let i=0;i<7;i++){
   await page.locator('.chapter-nav a').nth(i).click();await page.waitForTimeout(60);
   check('chapter '+i+' click/current',await page.evaluate(i=>WTE.engine.state.index===i&&document.querySelectorAll('.chapter-nav a[aria-current]').length===1&&document.querySelectorAll('.chapter-nav a')[i].getAttribute('aria-current')==='step',i));
  }
  await jump(5,.5);await page.locator('#proof').focus();await page.keyboard.press('Space');await page.waitForTimeout(70);
  check('Space toggles PROOF and pressed state',await page.evaluate(()=>WTE.engine.state.proof&&document.getElementById('proof').getAttribute('aria-pressed')==='true'));
  await page.keyboard.press('Enter');await page.waitForTimeout(70);
  check('Enter toggles PROOF off',await page.evaluate(()=>!WTE.engine.state.proof));
  await jump(6,.95);await page.locator('#hold').focus();await page.keyboard.press('Space');await page.waitForTimeout(70);
  const held=await png();await page.evaluate(()=>scrollTo(0,WTE.engine.bounds[5]+innerHeight));await page.waitForTimeout(200);
  check('HOLD preserves visible frame while native scroll moves',held===await png()&&await page.evaluate(()=>WTE.engine.state.held&&WTE.engine.state.targetY!==WTE.engine.state.displayY));
  await page.locator('#proof').click();await page.waitForTimeout(60);
  check('PROOF while held retains finale and raw position',await page.evaluate(()=>WTE.engine.state.held&&WTE.engine.state.index===6&&WTE.engine.state.progress>.94&&!document.getElementById('capture').hidden));
  const downloadEvent=page.waitForEvent('download');await page.locator('#capture').click();const download=await downloadEvent;
  await download.saveAs(path.join(out,'held-proof-poster.png'));
  check('HOLD + PROOF export equals clean poster',hash(fs.readFileSync(path.join(out,'held-proof-poster.png')))===hash(fs.readFileSync(path.join(out,'after/WORLD-TO-EXPRESSION-poster.png'))));
  await page.locator('#hold').focus();await page.keyboard.press('Enter');await settle();
  check('RELEASE rejoins current position and resets exit',await page.evaluate(()=>!WTE.engine.state.held&&WTE.engine.state.index===5&&document.getElementById('capture').hidden&&document.getElementById('explore').textContent==='EXPLORE ↗'));
  for(const [p,finale] of [[.849,false],[.851,true],[.82,false],[.95,true],[.53,false],[.95,true]]){
   await jump(6,p);
   check('finale state at '+p,await page.evaluate(finale=>document.getElementById('capture').hidden===!finale&&document.getElementById('explore').textContent===(finale?'OPEN LAB ↗':'EXPLORE ↗')&&(!finale||document.getElementById('explore').getAttribute('href')==='../index.html'),finale));
  }
  await page.locator('#capture').focus();await jump(6,.53);
  check('reverse from focused CAPTURE moves focus to visible exit',await page.locator('#explore').evaluate(e=>e===document.activeElement));
  await jump(6,.95);
  const labNavigation=page.waitForURL('**/index.html');await page.locator('#explore').click();await labNavigation;
  check('OPEN LAB click resolves existing root',page.url()==='http://127.0.0.1:4173/index.html');
  await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await jump(6,.95);
  // Simulate pending font readiness and encoding failure without changing app code.
  await page.evaluate(()=>{
   window.realFontLoad=document.fonts.load.bind(document.fonts);window.posterCalls=0;window.realPoster=WTE.drawPoster;
   WTE.drawPoster=(...a)=>{posterCalls++;return realPoster(...a);};
   document.fonts.load=()=>new Promise(resolve=>{window.releaseFont=resolve;});
  });
  await page.locator('#capture').click();await page.waitForTimeout(100);
  check('export waits for font load and disables duplicate click',await page.evaluate(()=>posterCalls===0&&document.getElementById('capture').disabled));
  const delayedDownload=page.waitForEvent('download');await page.evaluate(()=>releaseFont([]));await delayedDownload;
  check('export resumes after font readiness',await page.evaluate(()=>posterCalls===1&&!document.getElementById('capture').disabled));
  await page.evaluate(()=>{document.fonts.load=realFontLoad;WTE.drawPoster=realPoster;window.realToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(cb){cb(null);};});
  await page.locator('#capture').click();await page.waitForTimeout(100);
  check('encoding failure allows retry with truthful status',await page.evaluate(()=>!document.getElementById('capture').disabled&&document.getElementById('status').textContent.includes('もう一度')));
  await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=realToBlob;document.fonts.load=()=>Promise.reject(new Error('simulated font error'));});
  await page.locator('#capture').click();await page.waitForTimeout(100);
  check('font failure allows retry',await page.evaluate(()=>!document.getElementById('capture').disabled&&document.getElementById('status').textContent.includes('もう一度')));
  await page.evaluate(()=>{document.fonts.load=realFontLoad;});
  const retryDownload=page.waitForEvent('download');await page.locator('#capture').click();await retryDownload;
  check('retry starts download with accurate status',await page.locator('#status').textContent()==='PNGのダウンロードを開始しました。');
  await page.evaluate(()=>{window.holdText=document.getElementById('hold').firstChild;window.exitText=document.getElementById('explore').firstChild;});
  for(let i=0;i<5;i++){await page.evaluate(()=>WTE.engine.request());await page.waitForTimeout(20);}
  check('unchanged frames retain action text nodes',await page.evaluate(()=>holdText===document.getElementById('hold').firstChild&&exitText===document.getElementById('explore').firstChild));
  await jump(2,.4);await page.evaluate(()=>document.activeElement.blur());
  const keyY=await page.evaluate(()=>scrollY);await page.keyboard.press('PageDown');await page.waitForTimeout(900);await settle();
  check('PageDown advances native scroll',await page.evaluate(y=>scrollY>y,keyY));
  await page.keyboard.press('Home');await page.waitForTimeout(900);await settle();check('Home reaches opening',await page.evaluate(()=>scrollY===0&&WTE.engine.state.index===0));
  await page.keyboard.press('End');await page.waitForTimeout(900);await settle();check('End reaches finale',await page.evaluate(()=>WTE.engine.state.index===6&&!document.getElementById('capture').hidden));
  for(const reduced of [false,true])for(const [scene,p] of [[1,.8],[3,.60],[5,.8625],[6,.53],[6,.95]]){
   await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);await jump(scene,p);
   const first=await png(),state=await page.evaluate(()=>({...WTE.engine.state}));
   for(const [width,height] of [[390,650],[844,390],[768,1024],[390,844]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(150);await settle();
    check(`resize ${scene}/${p} reduced=${reduced} ${width}x${height}`,await page.evaluate(({scene,raw,display,reduced})=>WTE.engine.state.index===scene&&Math.abs(WTE.engine.state.rawProgress-raw)<.002&&(!reduced||WTE.engine.state.progress===display),{scene,raw:state.rawProgress,display:state.progress,reduced}));
   }
   // Re-seek removes native integer scroll rounding introduced by resizing.
   await jump(scene,p);check(`resize return/revisit ${scene}/${p} reduced=${reduced}`,first===await png());
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const [width,height] of [[1440,900],[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(100);
   for(const [scene,points] of [[1,[.4898,.49,.50,.52,.54,.58,.73,.75,.77,.79,.82]],[3,[.53,.55,.58,.60,.62,.64]],[5,[.83,.85,.86,.8625,.865,.875,.89]],[6,[.40,.49,.53,.67,.68,.69,.704,.80,.82,.842,.85,.95]]]){
    const frames=[];
    for(const p of points){await jump(scene,p);frames.push({p,hash:hash(await png())});}
    let matches=true;
    for(const f of [...frames].reverse()){await jump(scene,f.p);matches&&=f.hash===hash(await png());}
    check(`bidirectional transition ${width}x${height} act${scene}`,matches);
    report.motion.push({width,height,scene,frames,reverseIdentical:matches});
   }
  }
  const draws=await page.evaluate(()=>WTE.engine.state.draws);await page.waitForTimeout(350);
  check('idle RAF stops',await page.evaluate(n=>WTE.engine.state.draws===n,draws));
  for(const [scene,p] of [[0,.5],[1,.2],[1,.4],[1,.58],[1,.95],[2,.5],[3,.6],[4,.84],[5,.1],[5,.5],[5,.86],[6,.53],[6,.95]]){
   await jump(scene,p);const href=await page.locator('#explore').getAttribute('href');
   if(!report.links.some(l=>l.href===href)){const response=await page.request.get(new URL(href,page.url()).href);report.links.push({href,status:response.status()});}
  }
  check('sampled relative source links resolve',report.links.every(l=>l.status===200),report.links);
  const posterPage=await browser.newPage();await posterPage.goto('file:///'+path.join(out,'after/WORLD-TO-EXPRESSION-poster.png').replaceAll('\\','/'));
  check('saved PNG reopened and decoded in browser',await posterPage.locator('img').evaluate(i=>i.complete&&i.naturalWidth===1800&&i.naturalHeight===2400));
  await posterPage.close();
 }finally{await browser.close();fs.writeFileSync(path.join(out,'controls-report.json'),JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify({checks:report.checks.length,failed:report.checks.filter(c=>!c.passed),errors:report.errors},null,2));
 if(report.errors.length||report.checks.some(c=>!c.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
