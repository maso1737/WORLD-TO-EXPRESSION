"use strict";
/* EE-07 SANDPILE — the law, shared by 07_sandpile.html and scroll/SCROLL_SANDPILE_LP.html (2026-11-03: moved out of the HTML verbatim).
   Classic script: top-level names (MODES, THR, makePile, addGrains, relax, …) are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11))  (src = this file) */
/*SIM-BEGIN — pure sandpile math (Bak–Tang–Wiesenfeld). Int32 heights, open edges: a grain pushed past the edge is gone.
   relax() topples in waves: every unstable cell of the wave sheds floor(h/thr)·thr grains at once (parallel toppling).
   Toppling is abelian, so the order inside a wave never changes the final state or the topple count. */
const MODES = [
  {name:'DRIP',jp:'一粒ずつ、どこかに',lat:'sq',drive:'drip'},
  {name:'TOWER',jp:'一か所に注ぎつづける',lat:'sq',drive:'tower'},
  {name:'TWIN',jp:'二か所から',lat:'sq',drive:'twin'},
  {name:'HEX',jp:'六角のとなり',lat:'hex',drive:'tower'},
  {name:'EIGHT',jp:'八方のとなり',lat:'moore',drive:'tower'},
  {name:'IDENTITY',jp:'何もしない砂山',lat:'sq',drive:'identity'}
];
const THR = {sq:4,hex:6,moore:8};
/* a free pile of N grains spans about c·√N cells (x, y) — measured in Node on piles of 20k–80k grains.
   Used only to stop pouring before the pile reaches the edge (so nothing falls off and the shape stays whole). */
const SPAN = {sq:[.74,.74],hex:[.58,.668],moore:[.52,.52]};
function pourCap(lat,w,h){ const [cx,cy]=SPAN[lat]; return Math.floor(Math.min(((w-8)/cx)**2,((h-8)/cy)**2,2**20)); }
function makeRng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function makePile(w,h,lat){
  const n=w*h;
  return {w,h,lat,thr:THR[lat],hgt:new Int32Array(n),nb:neighbours(w,h,lat),q:new Int32Array(n),qi:0,qn:0,nq:new Int32Array(n),nqn:0,flag:new Uint8Array(n),
    glow:new Float32Array(n),added:0,lost:0,topples:0,
    av:{on:false,size:0,single:false},bins:new Float64Array(48),nAv:0,lastAv:0,maxAv:0};
}
function pileGrains(p){ return p.added-p.lost; }
function mark(p,i){ if(!p.flag[i]&&p.hgt[i]>=p.thr){ p.flag[i]=1; p.nq[p.nqn++]=i; } }
/* add k grains at cell i. single=true only for one grain on a quiet board — those avalanches are the ones we count. */
function addGrains(p,i,k){
  if(!p.av.on){ p.av.on=true; p.av.size=0; p.av.single=k===1; } else p.av.single=false;
  p.hgt[i]+=k; p.added+=k; mark(p,i);
  if(p.qi>=p.qn&&p.nqn===0) endAvalanche(p);
}
function setHeight(p,i,v){ p.added+=v-p.hgt[i]; p.hgt[i]=v; mark(p,i); }
function busy(p){ return p.qi<p.qn||p.nqn>0; }
function endAvalanche(p){
  if(!p.av.on)return null;
  const a={size:p.av.size,single:p.av.single};
  p.av.on=false;
  if(a.single&&a.size>0){ p.bins[Math.floor(Math.log2(a.size))]++; p.nAv++; p.lastAv=a.size; if(a.size>p.maxAv)p.maxAv=a.size; }
  return a;
}
/* neighbour table: deg entries per cell, -1 = off the edge (that grain is lost) */
function neighbours(w,h,lat){
  const deg=THR[lat], nb=new Int32Array(w*h*deg);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const c=[[x-1,y],[x+1,y]];
    if(lat==='hex'){ const o=y&1; c.push([x-1+o,y-1],[x+o,y-1],[x-1+o,y+1],[x+o,y+1]); }   // odd-r rows sit half a cell right
    else{ c.push([x,y-1],[x,y+1]); if(lat==='moore')c.push([x-1,y-1],[x+1,y-1],[x-1,y+1],[x+1,y+1]); }
    const b=(y*w+x)*deg; c.forEach(([u,v],k)=>{ nb[b+k]=(u>=0&&u<w&&v>=0&&v<h)?v*w+u:-1; });
  }
  return nb;
}
/* topple at most `budget` cells (each visit sheds floor(h/thr) at once). Returns visits used. */
/* budget = topples; waves = toppling generations (a front moves one cell per wave) */
function relax(p,budget,waves=Infinity){
  const {thr,hgt,flag,glow,nb}=p; let used=0, top=0, lost=0; p.wv=0;
  while(used<budget){
    if(p.qi>=p.qn){
      if(p.nqn===0||p.wv>=waves)break;
      p.wv++;
      const t=p.q; p.q=p.nq; p.nq=t; p.qn=p.nqn; p.nqn=0; p.qi=0;
    }
    const q=p.q, nq=p.nq; let nqn=p.nqn, qi=p.qi; const qn=p.qn;
    while(qi<qn&&used<budget){
      const i=q[qi++]; flag[i]=0; used++;
      const k=(hgt[i]/thr)|0; if(k<=0)continue;
      hgt[i]-=k*thr; top+=k; glow[i]=glow[i]+k>1.2?1.2:glow[i]+k;   // capped: light means 'toppled just now', not 'toppled many times'
      for(let a=i*thr,e=a+thr;a<e;a++){ const j=nb[a]; if(j<0){lost+=k;continue;}
        hgt[j]+=k; if(!flag[j]&&hgt[j]>=thr){flag[j]=1;nq[nqn++]=j;} }
    }
    p.qi=qi; p.nqn=nqn;
  }
  p.lost+=lost; p.topples+=top; if(p.av.on)p.av.size+=top;
  return used;
}
/* run to rest (tests / posters) */
function stabilize(p){ let n=0; while(busy(p))n+=relax(p,1<<24); endAvalanche(p); return n; }
/* the identity of the sandpile group on this rectangle: e = ( 2·max − (2·max)° )°, max = thr−1 everywhere */
function identityStart(p){ for(let i=0;i<p.hgt.length;i++)setHeight(p,i,2*(p.thr-1)); p.av.on=true; p.av.single=false; p.av.size=0; }
function identityFlip(p){ for(let i=0;i<p.hgt.length;i++)setHeight(p,i,2*(p.thr-1)-p.hgt[i]); p.av.on=true; p.av.single=false; p.av.size=0; }
/* avalanche sizes in log2 bins [2^b, 2^(b+1)); density = count / bin width / avalanches. Least-squares slope of log10 density
   over the bins that hold ≥ minCount avalanches — whatever it comes out as. */
function sizeHistogram(p,minCount=10){
  const pts=[];
  for(let b=0;b<p.bins.length;b++){ const c=p.bins[b]; if(!c)continue; const lo=2**b, wd=2**b, s=Math.sqrt(lo*(lo+wd-1));
    pts.push({s,count:c,x:Math.log10(s),y:Math.log10(c/wd/p.nAv)}); }
  const fit=pts.filter(q=>q.count>=minCount); let slope=NaN,icpt=NaN;
  if(fit.length>=3){ let sx=0,sy=0,sxx=0,sxy=0; for(const q of fit){sx+=q.x;sy+=q.y;sxx+=q.x*q.x;sxy+=q.x*q.y;} const m=fit.length; slope=(m*sxy-sx*sy)/(m*sxx-sx*sx); icpt=(sy-slope*sx)/m; }
  return {pts,slope,icpt,fitN:fit.length};
}
/* empty the board; the avalanche statistics are kept */
function clearPile(p){ p.hgt.fill(0); p.glow.fill(0); p.flag.fill(0); p.qi=p.qn=p.nqn=0; p.added=p.lost=0; p.av.on=false; }
/*SIM-END*/
