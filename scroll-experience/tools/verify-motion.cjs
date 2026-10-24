/* Engine lifecycle and timing tests with controlled RAF timestamps; no visual claims. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
function fixture(){
  let now=0,id=0;const queue=new Map(),events=new Map(),sections=Array.from({length:7},()=>({style:{}}));
  const add=(name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn);};
  const remove=(name,fn)=>events.get(name)?.delete(fn);
  const reduced={matches:false,addEventListener:(_,fn)=>add('reduced',fn),removeEventListener:(_,fn)=>remove('reduced',fn)};
  const ctx={setTransform(){},setLineDash(){},save(){},restore(){}};
  const env={innerWidth:1440,innerHeight:900,devicePixelRatio:1,scrollY:0,performance:{now:()=>now},
    document:{hidden:false,querySelectorAll:()=>sections,getElementById:()=>({style:{}}),addEventListener:add,removeEventListener:remove},
    matchMedia:()=>reduced,addEventListener:add,removeEventListener:remove,
    requestAnimationFrame:fn=>{queue.set(++id,fn);return id;},cancelAnimationFrame:n=>queue.delete(n)};
  env.scrollTo=(x,y)=>{env.scrollY=Math.round(typeof x==='object'?x.top:y);};env.window=env;
  const c=vm.createContext(env),frames=[];
  vm.runInContext(fs.readFileSync(path.join(root,'js/core.js'),'utf8'),c);
  c.WTE.scenes=Array.from({length:7},(_,index)=>({render:(_c,_w,_h,p)=>({index,p})}));
  vm.runInContext(fs.readFileSync(path.join(root,'js/scroll-engine.js'),'utf8'),c);
  const engine=c.WTE.createScrollEngine({style:{},getContext:()=>ctx},(meta,state)=>frames.push({meta,state:{...state}}));
  function fire(name,event={}){for(const fn of events.get(name)||[])fn(event);}
  function tick(ms){now=ms;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(now));}
  function scroll(y){env.scrollY=y;fire('scroll');}
  function settle(){for(let n=0;queue.size&&n<300;n++)tick(now+1000/60);assert.equal(queue.size,0,'RAF must converge and stop');}
  tick(0);
  return {engine,env,frames,queue,reduced,fire,tick,scroll,settle,get now(){return now;}};
}
function check(name,run){const evidence=run();checks.push({name,passed:true,evidence});}
check('120px inputs have intermediate frames; exact convergence and zero idle RAF',()=>{
  const f=fixture();
  for(let i=0;i<8;i++){f.scroll((i+1)*120);for(let j=1;j<=8;j++)f.tick((i*8+j)*1000/60);}
  f.settle();assert.equal(f.engine.state.displayY,960);assert(f.frames.length>8);
  const n=f.frames.length;f.tick(f.now+10000);assert.equal(f.frames.length,n);return {inputEvents:8,draws:n,idleDraws:0};
});
check('60/120Hz same timestamp trajectory',()=>{
  function run(hz){const f=fixture(),samples=[];f.scroll(960);for(let i=1;i<=hz/2;i++){f.tick(i*1000/hz);if(i%(hz/60)===0)samples.push(f.engine.state.displayY);}return samples;}
  const a=run(60),b=run(120),error=Math.max(...a.map((n,i)=>Math.abs(n-b[i])));assert(error<1e-9);return {maxCssPixelDifference:error};
});
check('direction reversal never overshoots current target',()=>{
  const f=fixture();f.scroll(1800);f.tick(100);let prev=f.engine.state.displayY;f.scroll(120);
  for(let i=0;i<20;i++){f.tick(f.now+16.67);const y=f.engine.state.displayY;assert(y<=prev&&y>=120);prev=y;}f.settle();return {settled:f.engine.state.displayY};
});
check('one display position drives canvas and chapter across boundary',()=>{
  const f=fixture();f.engine.jump(0,.99);f.settle();f.scroll(f.engine.bounds[1]+500);f.settle();
  f.frames.forEach(({state,meta})=>{assert.equal(state.index,meta.index);assert.equal(state.progress,meta.p);assert.equal(state.index,state.displayY>=f.engine.bounds[1]?1:0);});
});
check('HOLD during follow freezes visible frame; proof redraw does not resume; release rejoins',()=>{
  const f=fixture();f.scroll(9000);f.tick(45);const {index,rawProgress,displayY}=f.engine.state;
  f.engine.hold();f.settle();f.scroll(23000);f.tick(f.now+1000);f.engine.setProof(true);f.settle();
  assert.equal(f.engine.state.index,index);assert.equal(f.engine.state.rawProgress,rawProgress);assert.equal(f.engine.state.displayY,displayY);assert.equal(f.queue.size,0);
  f.engine.hold();f.tick(f.now+16.67);assert(f.engine.state.displayY>displayY&&f.engine.state.displayY<23000);f.settle();assert.equal(f.engine.state.displayY,23000);
});
check('resize preserves separate target, display and held logical positions',()=>{
  const f=fixture();f.scroll(16000);f.tick(90);const target=f.engine.state.targetY,display=f.engine.state.displayY;
  f.env.innerWidth=390;f.env.innerHeight=650;f.fire('resize');
  assert(Math.abs(f.engine.state.targetY-target*650/900)<1);assert(Math.abs(f.engine.state.displayY-display*650/900)<1e-8);
  f.engine.hold();f.settle();const raw=f.engine.state.rawProgress,index=f.engine.state.index;
  f.env.innerHeight=844;f.fire('resize');f.settle();assert.equal(f.engine.state.index,index);assert(Math.abs(f.engine.state.rawProgress-raw)<1e-10);
});
check('reduced motion has no follow and resize retains raw .20 / display .10',()=>{
  const f=fixture();f.reduced.matches=true;f.fire('reduced');f.engine.jump(5,.2);f.settle();
  assert.equal(f.engine.state.progress,.1);const raw=f.engine.state.rawProgress;
  f.env.innerWidth=390;f.env.innerHeight=844;f.fire('resize');f.settle();assert.equal(f.engine.state.progress,.1);assert(Math.abs(f.engine.state.rawProgress-raw)<.001);
  f.scroll(9000);f.tick(f.now+16.67);assert.equal(f.engine.state.targetY,f.engine.state.displayY);assert.equal(f.queue.size,0);
});
check('native touch inertia is direct; wheel on same device resumes follow',()=>{
  const f=fixture();f.fire('pointerdown',{pointerType:'touch'});f.scroll(800);f.tick(16);assert.equal(f.engine.state.displayY,800);
  f.fire('wheel');f.scroll(1000);f.tick(32);assert(f.engine.state.displayY>800&&f.engine.state.displayY<1000);f.settle();
});
check('jump/restoration synchronizes immediately; hidden stops and resets clock',()=>{
  const f=fixture();f.engine.jump(4,.5);assert.equal(f.engine.state.displayY,f.env.scrollY);f.settle();
  f.env.scrollY=18000;f.fire('pageshow');assert.equal(f.engine.state.displayY,18000);f.settle();
  f.scroll(22000);f.tick(f.now+16);const y=f.engine.state.displayY;f.env.document.hidden=true;f.fire('visibilitychange');assert.equal(f.queue.size,0);
  f.tick(f.now+60000);f.env.document.hidden=false;f.fire('visibilitychange');f.tick(f.now+16);assert(f.engine.state.displayY>y&&f.engine.state.displayY<y+1000);f.settle();
  f.engine.dispose();f.scroll(0);assert.equal(f.queue.size,0);
});
const out=path.join(root,'verification/motion-20261021');fs.mkdirSync(out,{recursive:true});
const report={generated:new Date().toISOString(),method:'Node VM with actual engine and controlled RAF; not hardware-display evidence',checks};
fs.writeFileSync(path.join(out,'engine-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
