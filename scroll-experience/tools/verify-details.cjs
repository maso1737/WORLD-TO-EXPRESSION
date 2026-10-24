const {chromium}=require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../verification');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
 const report={errors:[],links:[],touch:{},frames:[]};
 for(const [width,height] of [[1440,900],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width===390,hasTouch:width===390});const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  for(const [scene,p,proof,name] of [[1,.58,true,'reaction'],[1,.93,false,'chaos'],[2,.88,false,'type-mask'],[3,.66,true,'closure'],[3,.86,false,'common-fate'],[4,.86,false,'focus-poster'],[5,.10,true,'equal-lines'],[5,.32,true,'ponzo'],[5,.50,true,'equal-circles'],[5,.64,true,'rubin'],[5,.82,true,'perspective'],[5,.8625,true,'alignment'],[6,.94,false,'finale']]){
   await page.evaluate(({scene,p,proof})=>{WTE.engine.setProof(proof);WTE.engine.jump(scene,p);},{scene,p,proof});await page.waitForTimeout(50);
   const filename=`detail-${width}-${name}.png`;await page.screenshot({path:path.join(out,filename)});report.frames.push(filename);
   const href=await page.locator('#explore').getAttribute('href');if(!report.links.some(l=>l.href===href)){const response=await page.request.get(new URL(href,page.url()).href);report.links.push({href,status:response.status()});}
  }
  if(width===390){
   await page.evaluate(()=>{WTE.engine.setProof(false);WTE.engine.jump(4,.15);});await page.waitForTimeout(80);
   const session=await context.newCDPSession(page),before=await page.evaluate(()=>scrollY);
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:600,id:1}]});
   for(let i=1;i<=12;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:600-i*28,id:1}]});await page.waitForTimeout(22);}
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
   report.touch={method:'CDP dispatchTouchEvent: 12 upward moves',before,after:await page.evaluate(()=>scrollY)};
   report.touch.passed=report.touch.after>before;
  }
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto('file:///'+path.resolve(__dirname,'../index.html').replaceAll('\\','/'));await page.waitForFunction(()=>WTE.engine.state.draws>0);await page.evaluate(()=>WTE.engine.jump(6,.94));await page.waitForTimeout(60);report.fileProtocol=await page.evaluate(()=>WTE.engine.state.index===6);
 await page.screenshot({path:path.join(out,'file-protocol.png')});await browser.close();
 fs.writeFileSync(path.join(out,'detail-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(report.errors.length||report.links.some(l=>l.status!==200)||!report.touch.passed||!report.fileProtocol)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
