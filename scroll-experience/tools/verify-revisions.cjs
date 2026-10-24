/* Targeted regressions from the 2026-10-16 external review. Run via serve-and-verify.cjs. */
const {chromium} = require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const out = path.resolve(__dirname, '../verification');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--disable-gpu']});
  const report = {generated:new Date().toISOString(), browser:await browser.version(), renderer:'headless Chrome, GPU disabled', checks:[], errors:[], frames:[]};
  const check = (name, passed, evidence) => report.checks.push({name, passed, evidence});
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('response', response => {if(response.status() >= 400) report.errors.push(response.status()+' '+response.url());});
  await page.goto('http://127.0.0.1:4173/scroll-experience/', {waitUntil:'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  const jump = async (scene,p,proof=false) => {
    await page.evaluate(({scene,p,proof}) => {
      const length=[2.4,5.7,3.2,4.6,3.8,5.5,4.9][scene]*innerHeight;
      WTE.engine.setProof(proof); WTE.engine.jump(scene,Math.min(p,(length-2)/length));
    }, {scene,p,proof});
    await page.waitForFunction(scene => WTE.engine.state.index === scene, scene);
    await page.waitForTimeout(65);
  };
  const shot = async name => {const file = 'revision-'+name+'.png'; await page.screenshot({path:path.join(out,file)}); report.frames.push(file);};
  const canvasHash = async () => hash(await page.locator('#world').screenshot());
  for (const [width,height] of [[1440,900],[390,844],[844,390],[390,650]]) {
    await page.setViewportSize({width,height}); await page.waitForTimeout(100);
    for (const [scene,p,proof,name] of [
      [1,.4898,false,'cells-before'],[1,.4902,false,'cells-after'],[1,.52,false,'cells-opening'],[1,.545,false,'reaction'],
      [1,.95,true,'bifurcation'],[3,.9999,false,'group-end'],[4,0,false,'focus-start'],[4,.04,false,'focus-merge'],
      [2,.4898,false,'count-before'],[2,.4902,false,'count-after'],[2,.56,false,'count-forming'],
      [4,.84,false,'focus-poster'],[5,.10,true,'equal-lines'],[5,.32,true,'ponzo'],[5,.50,true,'equal-circles'],
      [6,.53,false,'silence'],[6,.73,false,'break'],[6,.82,false,'recompose'],[6,.95,false,'finale']
    ]) {await jump(scene,p,proof); await shot(`${width}x${height}-${name}`);}
    // Exact scene endpoints isolate geometry continuity from footer/caption updates.
    const geometry = await page.evaluate(() => {
      function render(scene,p,proof=false) {
        const canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;
        const ctx=canvas.getContext('2d'), arcs=[],texts=[],lines=[];
        const arc=ctx.arc.bind(ctx), fillText=ctx.fillText.bind(ctx), move=ctx.moveTo.bind(ctx), line=ctx.lineTo.bind(ctx);
        let start;
        ctx.arc=(x,y,r,...rest)=>{arcs.push({x,y,r,color:ctx.fillStyle});arc(x,y,r,...rest);};
        ctx.moveTo=(x,y)=>{start={x,y};move(x,y);};
        ctx.lineTo=(x,y)=>{if(start)lines.push({x1:start.x,y1:start.y,x2:x,y2:y,color:ctx.strokeStyle});start={x,y};line(x,y);};
        ctx.fillText=(text,x,y,...rest)=>{const a=ctx.measureText(text);texts.push({text,x,y,left:x-a.actualBoundingBoxLeft,right:x+a.actualBoundingBoxRight,top:y-a.actualBoundingBoxAscent,bottom:y+a.actualBoundingBoxDescent});fillText(text,x,y,...rest);};
        const meta=WTE.scenes[scene].render(ctx,innerWidth,innerHeight,p,{proof});
        return {arcs,texts,lines,meta,pixels:canvas.toDataURL()};
      }
      const group=render(3,1), focus=render(4,0), circles=render(5,.5,true), lengths=render(5,.1,true);
      const countBefore=render(2,.489999),countAfter=render(2,.49);
      const dimensions=circles.texts.filter(t=>t.text.startsWith('d = '));
      const overlaps=dimensions.flatMap(t=>circles.arcs.filter(a=>{
        const x=Math.max(t.left,Math.min(a.x,t.right)), y=Math.max(t.top,Math.min(a.y,t.bottom));
        return Math.hypot(x-a.x,y-a.y)<a.r+2;
      }).map(a=>({label:t.text,circle:a})));
      const consoleTop=document.querySelector('.console').getBoundingClientRect().top;
      const headerBottom=document.querySelector('.masthead').getBoundingClientRect().bottom;
      const marks=[.53,.67,.68,.73,.80,.82,.849,.95].map(p=>({p,mark:render(6,p).arcs.at(-1)}));
      const cellA=render(1,.49).pixels,cellB=render(1,.489999).pixels;
      return {
        groupArcs:group.arcs.length,focusArcs:focus.arcs.length,
        sameHandoffGeometry:JSON.stringify(group.arcs)===JSON.stringify(focus.arcs),
        sameCellBoundaryPixels:cellA===cellB,
        thresholdSeeds:countBefore.arcs.length,
        sameThresholdSeeds:JSON.stringify(countBefore.arcs)===JSON.stringify(countAfter.arcs),
        dimensions,overlaps,proofCaption:circles.meta.caption,
        lengthLines:lengths.lines.filter(l=>l.y1===l.y2&&Math.abs(l.x2-l.x1)>50),
        lengthLabels:lengths.texts.filter(t=>t.text.startsWith('A = B')),
        consoleTop,headerBottom,marks,
        controls:[...document.querySelectorAll('.actions>*:not([hidden]),.chapter-nav a')].every(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight;})
      };
    });
    const label=`${width}x${height}`;
    check(label+' GROUP→FOCUS same 96 circles',geometry.groupArcs===96&&geometry.focusArcs===96&&geometry.sameHandoffGeometry,{group:geometry.groupArcs,focus:geometry.focusArcs});
    check(label+' Voronoi .49 exact boundary',geometry.sameCellBoundaryPixels);
    check(label+' THRESHOLD .49 preserves 233 seeds',geometry.thresholdSeeds===233&&geometry.sameThresholdSeeds,geometry.thresholdSeeds);
    check(label+' circle dimensions avoid all circles',geometry.dimensions.length===2&&geometry.overlaps.length===0,geometry.dimensions);
    check(label+' truthful circle PROOF',geometry.proofCaption.includes('数')&&geometry.proofCaption.includes('間隔'),geometry.proofCaption);
    check(label+' proof visible between masthead and console',geometry.lengthLines.every(l=>l.y1>geometry.headerBottom&&l.y1<geometry.consoleTop)&&geometry.lengthLabels.every(t=>t.top>geometry.headerBottom&&t.bottom<geometry.consoleTop),{headerBottom:geometry.headerBottom,consoleTop:geometry.consoleTop,lines:geometry.lengthLines,labels:geometry.lengthLabels});
    check(label+' EDIT mark retains final center',geometry.marks.every(({mark})=>mark&&Math.abs(mark.x-geometry.marks[0].mark.x)<1e-8&&Math.abs(mark.y-geometry.marks[0].mark.y)<1e-8),geometry.marks);
    check(label+' controls in bounds',geometry.controls);
    if(width===1440||width===390) for(const [scene,p,proof] of [[1,.52,false],[1,.95,true],[2,.56,false],[3,.98,false],[4,.04,false],[4,.84,false],[5,.1,true],[5,.5,true],[6,.53,false],[6,.82,false]]) {
      await jump(scene,p,proof);const before=await canvasHash();await jump(0,.3);await jump(scene,p,proof);
      check(label+` reverse revisit act${scene} p${p} proof${proof}`,before===await canvasHash());
    }
  }
  // The original failure: .20 raw progress -> .10 still, then resize must stay .10.
  await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  await jump(5,.2);const before=await page.evaluate(()=>({...WTE.engine.state}));await shot('reduced-before-resize');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  const after=await page.evaluate(()=>({...WTE.engine.state}));await shot('reduced-after-resize');
  check('reduced-motion resize .20 raw/.10 drawn',before.progress===.1&&after.progress===.1&&Math.abs(before.rawProgress-after.rawProgress)<.001,{before,after});
  for(let scene=0;scene<7;scene++) for(const p of [.12,.34,.56,.82]) {
    await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(35);await jump(scene,p);
    const a=await page.evaluate(()=>({...WTE.engine.state}));
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(65);
    const b=await page.evaluate(()=>({...WTE.engine.state}));
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(65);
    const c=await page.evaluate(()=>({...WTE.engine.state}));
    check(`reduced resize act${scene} raw${p}`,a.index===b.index&&b.index===c.index&&a.progress===b.progress&&b.progress===c.progress&&Math.abs(a.rawProgress-c.rawProgress)<.001,{before:a.progress,portrait:b.progress,landscape:c.progress,raw:c.rawProgress});
  }
  await browser.close();
  report.passed=report.errors.length===0&&report.checks.every(c=>c.passed);
  fs.writeFileSync(path.join(out,'revision-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,failed:report.checks.filter(c=>!c.passed),errors:report.errors,frames:report.frames.length},null,2));
  if(!report.passed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exit(1);});
