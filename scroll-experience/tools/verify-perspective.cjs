/* Isolated real Canvas / RAF benchmark. HTTP and Chrome share one process context.
 * GPU is requested, but CDP reports the actual backend; software fallback is not
 * hardware-GPU evidence. Run: node tools/verify-perspective.cjs baseline|current
 */
const {chromium} = require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'verification/motion-20261021/perspective');
const variant = process.argv[2] || 'current';
if (!['baseline','current'].includes(variant)) throw new Error('Expected baseline or current');
const source = variant === 'baseline' ? path.resolve(root, '../90_Log/backups/2026-10-21-motion-brushup/js/scenes/05-interpret.js') : path.join(root, 'js/scenes/05-interpret.js');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
fs.mkdirSync(out, {recursive:true});
const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#0a0a0a;overflow:hidden}canvas{display:block;width:100vw;height:100vh}</style><canvas id="test"></canvas><script src="/core.js"></script><script src="/scene.js"></script>');
  } else if (url.pathname === '/core.js' || url.pathname === '/scene.js') {
    res.writeHead(200, {'Content-Type':'text/javascript; charset=utf-8'}).end(fs.readFileSync(url.pathname === '/core.js' ? path.join(root,'js/core.js') : source));
  } else res.writeHead(404).end();
});
(async () => {
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(4177,'127.0.0.1',resolve);});
  let browser;
  const report={generated:new Date().toISOString(),variant,sourceHash:hash(fs.readFileSync(source)),method:'Visible Canvas, direct scene render once per requestAnimationFrame; no engine smoothing or pixel readback during timing. JS duration excludes GPU completion. 120 forward/reverse frames per warm pass.',args:['--enable-gpu'],cases:[],errors:[]};
  try {
    browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:report.args});
    report.browser=await browser.version();
    const cdp=await browser.newBrowserCDPSession();
    report.gpu=(await cdp.send('SystemInfo.getInfo')).gpu;
    for (const [width,height,dpr] of [[1440,900,1],[1440,900,2],[390,844,1],[390,844,2]]) {
      const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
      page.on('pageerror',e=>report.errors.push(String(e)));
      await page.goto('http://127.0.0.1:4177/',{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      const result=await page.evaluate(async ({width,height,dpr})=>{
        const canvas=document.querySelector('canvas');canvas.width=width*dpr;canvas.height=height*dpr;
        const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
        const longTasks=[];
        const observer=new PerformanceObserver(entries=>longTasks.push(...entries.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));
        observer.observe({type:'longtask',buffered:false});
        const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
        const coldStamp=await frame();
        let t=performance.now();WTE.scenes[5].render(ctx,width,height,.79,{proof:true});
        const coldRenderMs=performance.now()-t;
        const coldNextRafMs=(await frame())-coldStamp;
        const summarize=values=>{const a=[...values].sort((x,y)=>x-y);return {n:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1),mean:a.reduce((x,y)=>x+y,0)/a.length};};
        const passes=[];
        for(let pass=0;pass<2;pass++){
          for(let i=0;i<20;i++){await frame();WTE.scenes[5].render(ctx,width,height,.79+i/19*.15,{proof:true});}
          const render=[],raf=[];let previous=await frame();
          const started=performance.now();
          for(let i=0;i<120;i++){
            const stamp=await frame();raf.push(stamp-previous);previous=stamp;
            const p=.79+(i<60?i/59:(119-i)/59)*.15;
            const begin=performance.now();WTE.scenes[5].render(ctx,width,height,p,{proof:true});render.push(performance.now()-begin);
          }
          await frame();
          passes.push({renderMs:summarize(render),rafMs:summarize(raf),longTasks:longTasks.filter(e=>e.start>=started)});
        }
        const drawCounts=[];
        for(const p of [.79,.82,.8625,.90,.94]){
          let calls=0,sourcePixels=0;
          const draw=ctx.drawImage.bind(ctx);
          ctx.drawImage=(...a)=>{calls++;sourcePixels+=a.length===9?a[3]*a[4]:a[0].width*a[0].height;draw(...a);};
          const meta=WTE.scenes[5].render(ctx,width,height,p,{proof:true});
          ctx.drawImage=draw;drawCounts.push({p,calls,sourcePixels,meta});
        }
        observer.disconnect();
        return {width,height,dpr,coldRenderMs,coldNextRafMs,passes,drawCounts};
      },{width,height,dpr});
      result.frames=[];
      for(const p of [.79,.82,.8625,.90,.94]){
        const details=await page.evaluate(p=>{
          const ctx=document.querySelector('canvas').getContext('2d'),texts=[];
          const fill=ctx.fillText.bind(ctx);ctx.fillText=(text,...rest)=>{texts.push(text);fill(text,...rest);};
          WTE.scenes[5].render(ctx,innerWidth,innerHeight,p,{proof:true});ctx.fillText=fill;
          return {texts,pixels:document.querySelector('canvas').toDataURL()};
        },p);
        const name=`${variant}-${width}x${height}-dpr${dpr}-p${p}.png`;
        const bytes=Buffer.from(details.pixels.split(',')[1],'base64');fs.writeFileSync(path.join(out,name),bytes);
        result.frames.push({name,p,hash:hash(bytes),proof:details.texts.find(t=>t.startsWith('FIXED PLANE'))});
      }
      report.cases.push(result);await page.close();
      console.log(JSON.stringify({variant,width,height,dpr,cold:result.coldRenderMs,passes:result.passes}));
    }
    report.hardwareCaveat='GPU was enabled at launch; SystemInfo GPU device and featureStatus are authoritative. Headless results do not verify physical-display FPS or real wheel/touch feel.';
    fs.writeFileSync(path.join(out,variant+'-report.json'),JSON.stringify(report,null,2)+'\n');
    if(report.errors.length)process.exitCode=1;
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
