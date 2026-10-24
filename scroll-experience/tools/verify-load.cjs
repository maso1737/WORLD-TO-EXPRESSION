/* Local cold-context startup observation, not a deployed-network benchmark. */
const {chromium}=require('C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu']});
  const report={generated:new Date().toISOString(),method:'Fresh browser contexts, local HTTP, GPU enabled; not internet/mobile-network load time',cases:[]};
  for(const [width,height] of [[1440,900],[390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    await page.addInitScript(()=>{
      function observe(){if(window.WTE?.engine?.state.draws>0)window.firstDrawMs=performance.now();else requestAnimationFrame(observe);}requestAnimationFrame(observe);
    });
    await page.goto('http://127.0.0.1:4173/scroll-experience/',{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    report.cases.push(await page.evaluate(()=>{
      const navigation=performance.getEntriesByType('navigation')[0],patterns=performance.getEntriesByType('resource').find(e=>e.name.endsWith('/patterns.js'));
      return {width:innerWidth,height:innerHeight,firstObservedDrawMs:window.firstDrawMs,domContentLoadedMs:navigation.domContentLoadedEventEnd,loadEventMs:navigation.loadEventEnd,patterns:{durationMs:patterns.duration,encodedBytes:patterns.encodedBodySize},heapBytes:performance.memory?.usedJSHeapSize||null};
    }));await page.close();
  }
  await browser.close();fs.writeFileSync(path.resolve(__dirname,'../verification/motion-20261021/load-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1);});
