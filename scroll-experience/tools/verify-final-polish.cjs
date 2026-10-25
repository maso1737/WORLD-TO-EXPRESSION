/* Current-checkout before/after, same Chrome/backend. Run via serve-and-verify.cjs.
   WTE_POLISH_BASELINE=1 records the unedited checkout. Synthetic input only. */
const {chromium}=require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const app=path.resolve(__dirname,'..'),root=path.join(app,'verification/final-polish-20261025');
const baseline=process.env.WTE_POLISH_BASELINE==='1',out=path.join(root,baseline?'before':'after');
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
 const report={generated:new Date().toISOString(),browser:await browser.version(),backend:'headless Chrome --disable-gpu, DPR 1',baseline,checks:[],frames:[],errors:[]};
 const check=(name,passed,evidence)=>report.checks.push({name,passed,evidence});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:true});
  if(baseline)await page.route('**/scroll-experience/**',route=>{
   const relative=new URL(route.request().url()).pathname.split('/scroll-experience/')[1]||'index.html';
   const file=path.resolve(app,'../90_Log/backups/2026-10-25-final-polish',relative);
   if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
   return route.continue();
  });
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const jump=async(scene,p,proof=false)=>{
   await page.evaluate(({scene,p,proof})=>{WTE.engine.setProof(proof);WTE.engine.jump(scene,p);},{scene,p,proof});
   await page.waitForFunction(({scene,p})=>WTE.engine.state.index===scene&&Math.abs(WTE.engine.state.rawProgress-p)<.002,{scene,p});
   await page.waitForTimeout(50);
  };
  const samples=[[0,.48,false,'opening'],[1,.52,false,'cells'],[1,.58,true,'reaction'],[1,.9594,true,'bifurcation'],[2,.66,false,'threshold'],[3,.60,false,'group'],[4,.84,false,'focus'],[5,.50,true,'circles'],[5,.8625,true,'alignment'],[6,.16,false,'subtract'],[6,.53,false,'silence'],[6,.73,false,'break'],[6,.82,false,'recompose'],[6,.95,false,'finale']];
  for(const [width,height] of [[1440,900],[768,1024],[390,844],[390,650],[844,390],[519,900],[521,900],[599,900],[601,900],[799,900],[801,900]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(100);
   for(const [scene,p,proof,name] of (height===900&&width!==1440?samples.filter(s=>['bifurcation','circles','finale'].includes(s[3])):samples)){
    await jump(scene,p,proof);
    const file=`${width}x${height}-${name}.png`;
    await page.screenshot({path:path.join(out,file)});
    const geometry=await page.evaluate(()=>{
     const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
     return {box:WTE.box(innerWidth,innerHeight),header:rect(document.querySelector('.masthead')),footer:rect(document.querySelector('.console')),caption:document.getElementById('scene-caption').textContent,controls:[...document.querySelectorAll('.actions>*:not([hidden]),.chapter-nav a')].map(e=>({text:e.textContent,...rect(e),font:getComputedStyle(e).fontSize})),overflow:document.documentElement.scrollWidth>innerWidth,explore:document.getElementById('explore').textContent};
    });
    const canvasHash=hash(await page.evaluate(()=>document.getElementById('world').toDataURL()));
    report.frames.push({file,scene,p,proof,canvasHash,...geometry});
    check(file+' controls in viewport',!geometry.overflow&&geometry.controls.every(r=>r.x>=0&&r.right<=width&&r.y>=0&&r.bottom<=height),geometry);
    if(!baseline){
     check(file+' action labels >=10px and targets sized for viewport',geometry.controls.every(r=>r.height>=(height>width||width===1440?44:38))&&geometry.controls.slice(7).every(r=>parseFloat(r.font)>=10));
     if(name==='bifurcation'){
      const texts=await page.evaluate(({scene,p,proof})=>{
       const c=document.createElement('canvas');c.width=innerWidth;c.height=innerHeight;const ctx=c.getContext('2d'),texts=[];
       const fill=ctx.fillText.bind(ctx);
       ctx.fillText=(text,x,y,...rest)=>{const m=ctx.measureText(text),t=ctx.getTransform();texts.push({text,top:y-m.actualBoundingBoxAscent+t.f,bottom:y+m.actualBoundingBoxDescent+t.f,left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight});fill(text,x,y,...rest);};
       WTE.scenes[scene].render(ctx,innerWidth,innerHeight,p,{proof});return texts;
      },{scene,p,proof});
      check(file+' all text between header and console',texts.every(t=>t.top>=geometry.header.bottom&&t.bottom<geometry.footer.y),texts);
      check(file+' proof and axis labels separated',texts.every((t,i)=>texts.slice(i+1).every(b=>t.bottom<=b.top||b.bottom<=t.top||t.right<=b.left||b.right<=t.left)),texts);
     }
    }
   }
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  await jump(6,.95);
  await page.locator('.skip').focus();await page.keyboard.press('Enter');await page.waitForTimeout(100);
  report.skip=await page.evaluate(()=>({active:document.activeElement.tagName,activeId:document.activeElement.id,scrollY,state:{...WTE.engine.state}}));
  await jump(6,.95);
  const downloadPromise=page.waitForEvent('download');await page.locator('#capture').click();
  const download=await downloadPromise;await download.saveAs(path.join(out,'WORLD-TO-EXPRESSION-poster.png'));
  const bytes=fs.readFileSync(path.join(out,'WORLD-TO-EXPRESSION-poster.png'));
  report.poster={hash:hash(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length,status:await page.locator('#status').textContent()};
  check('download PNG 1800x2400',report.poster.width===1800&&report.poster.height===2400,report.poster);
  if(!baseline){
   const before=JSON.parse(fs.readFileSync(path.join(root,'before/report.json'),'utf8'));
   check('same comparison browser and backend',before.browser===report.browser&&before.backend===report.backend);
   check('poster byte-identical to current-checkout baseline',before.poster.hash===report.poster.hash);
   for(const f of report.frames.filter(f=>f.file.startsWith('1440x900-')))check(f.file+' desktop Canvas unchanged',f.canvasHash===before.frames.find(b=>b.file===f.file).canvasHash);
  }
 }finally{
  await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 }
 console.log(JSON.stringify({baseline,checks:report.checks.length,failed:report.checks.filter(c=>!c.passed).map(c=>c.name),errors:report.errors,frames:report.frames.length},null,2));
 if(report.errors.length||(!baseline&&report.checks.some(c=>!c.passed)))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
