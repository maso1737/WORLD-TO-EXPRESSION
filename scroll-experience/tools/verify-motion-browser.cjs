/* Actual Chrome Canvas, synthetic input, deterministic seeks and transition images.
   Run via serve-and-verify.cjs. Physical wheel/trackpad/phone feel is not tested. */
const {chromium}=require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const app=path.resolve(__dirname,'..'),out=path.join(app,'verification/motion-20261021');fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
  const report={generated:new Date().toISOString(),browser:await browser.version(),method:'GPU-enabled headless Chrome, real Canvas and synthetic input; not physical device feel',checks:[],frames:[],errors:[]};
  const check=(name,passed,evidence)=>report.checks.push({name,passed,evidence});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  const settled=()=>page.waitForFunction(()=>WTE.engine.state.displayY===WTE.engine.state.targetY&&!WTE.engine.state.held);
  const jump=async(s,p,proof=false)=>{await page.evaluate(({s,p,proof})=>{WTE.engine.setProof(proof);WTE.engine.jump(s,p);},{s,p,proof});await page.waitForFunction(({s,p})=>WTE.engine.state.index===s&&Math.abs(WTE.engine.state.rawProgress-p)<.002,{s,p});await page.waitForTimeout(50);};
  const canvasHash=async()=>hash(await page.locator('#world').screenshot());
  await jump(3,.06);
  const before=await page.evaluate(()=>WTE.engine.state.draws);
  for(let i=0;i<8;i++){await page.mouse.wheel(0,120);await page.waitForTimeout(125);}
  await settled();const wheel=await page.evaluate(n=>({draws:WTE.engine.state.draws-n,target:WTE.engine.state.targetY,display:WTE.engine.state.displayY}),before);
  check('8 synthetic 120px wheel events produce intermediate frames and settle exactly',wheel.draws>8&&wheel.target===wheel.display,wheel);
  const idle=await page.evaluate(()=>WTE.engine.state.draws);await page.waitForTimeout(350);
  check('zero idle frames after follow',await page.evaluate(n=>WTE.engine.state.draws===n,idle));
  await page.evaluate(()=>scrollBy(0,1100));await page.waitForTimeout(35);
  const held=await page.evaluate(()=>{WTE.engine.hold();return {...WTE.engine.state};});await page.waitForTimeout(50);
  const heldPixels=await canvasHash();await page.mouse.wheel(0,4000);await page.waitForTimeout(200);
  check('HOLD captures in-flight displayed composition and allows native scroll',heldPixels===await canvasHash()&&await page.evaluate(y=>scrollY>y,held.targetY));
  await page.evaluate(()=>WTE.engine.setProof(true));await page.waitForTimeout(50);
  const proof=await page.evaluate(()=>({...WTE.engine.state}));
  check('PROOF while held retains displayed progress',proof.rawProgress===held.rawProgress&&proof.index===held.index&&heldPixels!==await canvasHash());
  await page.evaluate(()=>WTE.engine.hold());await settled();
  check('RELEASE converges to native position',await page.evaluate(()=>WTE.engine.state.displayY===scrollY));
  await page.evaluate(()=>WTE.engine.setProof(false));
  for(const speed of [12,360]){
    await jump(3,.985);const boundary=await page.evaluate(()=>WTE.engine.bounds[4]);
    const samples=await page.evaluate(async({speed,boundary})=>{
      const result=[];
      for(const direction of [1,-1])for(let i=0;i<20;i++){
        scrollBy(0,speed*direction);await new Promise(requestAnimationFrame);
        const s=WTE.engine.state;result.push({index:s.index,display:s.displayY,nav:Number(document.querySelector('.chapter-nav [aria-current]').textContent.trim()),dom:document.documentElement.dataset.scene});
      }
      return result;
    },{speed,boundary});await settled();
    check(`chapter boundary forward/reverse ${speed}px/frame`,samples.every(s=>s.index===s.nav&&s.dom===['zero','emergence','threshold','group','focus','interpret','edit'][s.index]),{frames:samples.length});
  }
  for(const [w,h] of [[1440,900],[390,844],[390,650],[844,390]]){
    await page.setViewportSize({width:w,height:h});await page.waitForTimeout(100);
    for(const [scene,points] of [[1,[.9599,.9601,.967,.98,.995]],[3,[.32,.36,.40,.46,.55,.60,.66,.78,.82,.9,.999]],[6,[.53,.80,.81,.82,.835,.849,.95]]]){
      for(const p of points){await jump(scene,p);const file=`motion-${w}x${h}-act${scene}-p${p}.png`;await page.screenshot({path:path.join(out,file)});report.frames.push(file);}
    }
    for(const p of [.545,.58,.65]){
      await jump(1,p,true);const file=`motion-${w}x${h}-reaction-proof-${p}.png`;await page.screenshot({path:path.join(out,file)});report.frames.push(file);
    }
    const boundaries=await page.evaluate(()=>{
      const canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;const c=canvas.getContext('2d',{willReadFrequently:true});
      function pixels(scene,p){c.save();WTE.scenes[scene].render(c,innerWidth,innerHeight,p,{proof:false});c.restore();return c.getImageData(0,0,canvas.width,canvas.height).data;}
      return [[1,.96],[3,.36],[3,.55],[3,.78],[3,.82],[6,.85]].map(([scene,p])=>{
        const a=pixels(scene,p-1e-7),b=pixels(scene,p+1e-7);let changed=0,delta=0;
        for(let i=0;i<a.length;i+=4){const d=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);if(d>12)changed++;delta+=d;}
        return {scene,p,changedRatio:changed/(canvas.width*canvas.height),meanRgbDelta:delta/(canvas.width*canvas.height*3)};
      });
    });
    for(const b of boundaries)check(`${w}x${h} continuous geometry at act${b.scene} p${b.p}`,b.changedRatio<.005,b);
    for(const [s,p] of [[1,.58],[1,.965],[1,.98],[3,.36],[3,.55],[3,.78],[6,.82]]){
      await jump(s,p);const a=await canvasHash();await jump(0,.3);await jump(s,p);
      check(`${w}x${h} settled revisit act${s} p${p}`,a===await canvasHash());
    }
  }
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(150);await jump(6,.95);
  await page.locator('#capture').waitFor({state:'visible'});
  const downloadPromise=page.waitForEvent('download');await page.locator('#capture').click();const download=await downloadPromise;
  const poster=path.join(out,'WORLD-TO-EXPRESSION-poster.png');await download.saveAs(poster);
  const baselineSource=fs.readFileSync(path.resolve(app,'../90_Log/backups/2026-10-21-motion-brushup/js/scenes/06-edit.js'),'utf8');
  const baselinePng=await page.evaluate(source=>{
    const currentPoster=WTE.drawPoster,currentScene=WTE.scenes[6];
    try{
      (0,eval)(source);const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=2400;
      WTE.drawPoster(canvas.getContext('2d'),1800,2400,true);return canvas.toDataURL();
    }finally{WTE.drawPoster=currentPoster;WTE.scenes[6]=currentScene;}
  },baselineSource);
  const baselineBytes=Buffer.from(baselinePng.split(',')[1],'base64');
  fs.writeFileSync(path.join(out,'baseline-poster-same-browser.png'),baselineBytes);
  check('CAPTURE byte-identical to pre-edit renderer in same browser/backend',hash(fs.readFileSync(poster))===hash(baselineBytes),{bytes:fs.statSync(poster).size,hash:hash(fs.readFileSync(poster)),previousDeliveredHash:hash(fs.readFileSync(path.join(app,'verification/WORLD-TO-EXPRESSION-poster.png'))),note:'The previous delivered PNG used GPU-disabled Chrome; backend rasterization can change its bytes.'});
  const performanceData=await page.evaluate(async()=>{
    const c=document.getElementById('world').getContext('2d'),measurements=[];
    for(const [scene,a,b] of [[1,.545,.65],[1,.96,.999],[3,.32,.82]]){
      const times=[],intervals=[];let previous=await new Promise(requestAnimationFrame);
      for(let i=0;i<80;i++){const t=await new Promise(requestAnimationFrame);intervals.push(t-previous);previous=t;
        const start=performance.now();c.save();WTE.scenes[scene].render(c,innerWidth,innerHeight,a+(b-a)*i/79,{proof:false});c.restore();times.push(performance.now()-start);
      }
      const stat=v=>{v.sort((x,y)=>x-y);return {p95:v[Math.floor(v.length*.95)],max:v.at(-1)};};
      measurements.push({scene,from:a,to:b,renderMs:stat(times),rafMs:stat(intervals)});
    }WTE.engine.request();return measurements;
  });report.performance=performanceData;
  await browser.close();fs.writeFileSync(path.join(out,'browser-motion-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({checks:report.checks.length,failed:report.checks.filter(c=>!c.passed),errors:report.errors,frames:report.frames.length,performance:performanceData},null,2));
  if(report.errors.length||report.checks.some(c=>!c.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
