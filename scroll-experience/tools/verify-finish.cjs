/* Real Chrome layout measurements and before/after raster comparisons.
   Run through serve-and-verify.cjs. Synthetic navigation is not device feel. */
const {chromium}=require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const app=path.resolve(__dirname,'..'),out=path.join(app,'verification/finish-20261022');
const backup=path.resolve(app,'../90_Log/backups/2026-10-22-motion-finish/js/scenes');
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
  const report={generated:new Date().toISOString(),browser:await browser.version(),method:'Real headless Chrome Canvas and DOM; synthetic navigation, no physical input/device assessment',checks:[],frames:[],errors:[]};
  const check=(name,passed,evidence)=>report.checks.push({name,passed,evidence});
  try{
    const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1});
    page.on('pageerror',e=>report.errors.push(String(e)));
    page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
    await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(sources=>{
      window.finishBaseline={};
      for(const [id,source] of sources){const current=WTE.scenes[id];(0,eval)(source);finishBaseline[id]=WTE.scenes[id];WTE.scenes[id]=current;}
      window.finishMeasure=(scene,p,proof,baseline=false,hideText=false)=>{
        const canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;
        const c=canvas.getContext('2d'),texts=[],images=[],lines=[];
        const ctx=new Proxy(c,{get(target,key){
          if(key==='fillText')return (text,x,y,maxWidth)=>{
            const m=c.measureText(text),t=c.getTransform();
            texts.push({text,left:x-m.actualBoundingBoxLeft,top:y-m.actualBoundingBoxAscent+t.f,right:x+m.actualBoundingBoxRight,bottom:y+m.actualBoundingBoxDescent+t.f});
            if(!hideText){if(maxWidth===undefined)c.fillText(text,x,y);else c.fillText(text,x,y,maxWidth);}
          };
          if(key==='drawImage')return (...args)=>{images.push({x:args[1],y:args[2],width:args[0].width,height:args[0].height});c.drawImage(...args);};
          const value=target[key];return typeof value==='function'?value.bind(target):value;
        },set(target,key,value){target[key]=value;return true;}});
        (baseline?finishBaseline[scene]:WTE.scenes[scene]).render(ctx,innerWidth,innerHeight,p,{proof});
        return {texts,images,png:canvas.toDataURL()};
      };
    },[[1,fs.readFileSync(path.join(backup,'01-emergence.js'),'utf8')],[3,fs.readFileSync(path.join(backup,'03-group.js'),'utf8')]]);
    const jump=async(scene,p,proof)=>{
      await page.evaluate(({scene,p,proof})=>{WTE.engine.setProof(proof);WTE.engine.jump(scene,p);},{scene,p,proof});
      await page.waitForFunction(({scene,p,proof})=>WTE.engine.state.index===scene&&Math.abs(WTE.engine.state.rawProgress-p)<.002&&WTE.engine.state.proof===proof,{scene,p,proof});
      await page.waitForTimeout(50);
    };
    for(const [w,h] of [[844,390],[720,390],[1440,900],[390,844],[390,650]]){
      await page.setViewportSize({width:w,height:h});await page.waitForTimeout(100);
      for(const p of [.84,.9594])for(const proof of [false,true]){
        await jump(1,p,proof);
        const frame=`${w}x${h}-bifurcation-${p}-${proof?'proof':'plain'}.png`;
        await page.screenshot({path:path.join(out,frame)});report.frames.push(frame);
        const result=await page.evaluate(({p,proof})=>{
          const {texts,images}=finishMeasure(1,p,proof);
          return {texts,images,headerBottom:document.querySelector('.masthead').getBoundingClientRect().bottom,footerTop:document.querySelector('.console').getBoundingClientRect().top};
        },{p,proof});
        {
          const rows=result.texts.every(t=>t.top>=result.headerBottom&&t.bottom<result.footerTop);
          const picture=result.images.every(i=>i.y>=result.headerBottom&&i.y+i.height<result.footerTop);
          const ordered=result.texts.slice().sort((a,b)=>a.top-b.top);
          const disjoint=ordered.every((t,i)=>ordered.slice(i+1).every(b=>t.bottom<=b.top||t.right<=b.left||b.right<=t.left));
          const title=result.texts[0],equation=result.texts.find(t=>t.text.startsWith('x[n+1]'));
          check(`${w}x${h} p${p} proof=${proof}: all data and text between header/footer`,rows&&picture,result);
          check(`${w}x${h} p${p} proof=${proof}: text separated from chart and each other`,disjoint&&(h!==390||title.bottom<result.images[0].y)&&(!equation||equation.bottom<result.images[0].y),result);
        }
        if(h!==390){
          check(`${w}x${h} p${p} proof=${proof}: normal ${proof?'geometry':'composition'} byte-identical`,await page.evaluate(({p,proof})=>finishMeasure(1,p,proof,false,proof).png===finishMeasure(1,p,proof,true,proof).png,{p,proof}));
        }
      }
      await page.emulateMedia({reducedMotion:'reduce'});await jump(1,.8,true);
      check(`${w}x${h}: reduced-motion selects bifurcation .86`,await page.evaluate(()=>WTE.engine.state.progress===.86));
      const reducedFrame=`${w}x${h}-bifurcation-reduced-proof.png`;
      await page.screenshot({path:path.join(out,reducedFrame)});report.frames.push(reducedFrame);
      await page.emulateMedia({reducedMotion:'no-preference'});
      for(const p of [.55,.58,.60,.64]){
        await jump(3,p,false);
        const frame=`${w}x${h}-group-${p}.png`;
        await page.screenshot({path:path.join(out,frame)});report.frames.push(frame);
        check(`${w}x${h} GROUP p${p}: geometry byte-identical without typography`,await page.evaluate(p=>finishMeasure(3,p,false,false,true).png===finishMeasure(3,p,false,true,true).png,p));
      }
      check(`${w}x${h} GROUP p.60: outgoing title fully removed`,await page.evaluate(()=>!finishMeasure(3,.60,false).texts.some(t=>['FOLLOW','THE LINE.'].includes(t.text))));
      // Return from another chapter through the real engine and compare Canvas bytes.
      await jump(1,.9594,true);const first=await page.locator('#world').screenshot();
      await jump(5,.86,false);await jump(1,.9594,true);
      check(`${w}x${h}: reverse revisit is deterministic`,first.equals(await page.locator('#world').screenshot()));
    }
    // Native reduced-motion resize must keep raw progress, then choose the same still.
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
    await page.emulateMedia({reducedMotion:'reduce'});await jump(1,.8,true);
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);
    const resized=await page.evaluate(()=>({...WTE.engine.state}));
    check('reduced-motion rotate retains raw .8 and display .86',resized.index===1&&Math.abs(resized.rawProgress-.8)<.002&&resized.progress===.86,resized);
  }finally{
    await browser.close();fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  }
  console.log(JSON.stringify({checks:report.checks.length,failed:report.checks.filter(c=>!c.passed),errors:report.errors,frames:report.frames.length},null,2));
  if(report.errors.length||report.checks.some(c=>!c.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
