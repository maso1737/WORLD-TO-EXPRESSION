"use strict";
/* EE-08 SYNC — the law, shared by 08_sync.html and scroll/SCROLL_SYNC_LP.html (2026-11-03: moved out of the HTML verbatim).
   Classic script: top-level names (TAU, MODES, makeSync, stepSync, …) are globals for the page that loads it. */
/*SIM-BEGIN — deterministic coupled oscillators. No DOM, no wall clock.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11))  (src = this file)
   Then makeSync(mode, seed), stepSync(p, 1/60), order(p), defects(p), localOrder(p), rainbow(p).
   All phases are independent U[0,2pi) in every mode. No pre-arranged coherent domains / vortices / phase waves.
   FIREFLIES seed 1/2/3: r(0)=.021761/.017205/.018789; first r>.5 at 12.35/14.6333/13.9 s;
   first r>.9 at 20.95/22.9/23.9 s; r(40)=.979808/.979185/.976144.
   Same positions, K=.079788456 (= mean-field Gaussian Kc/2): r(60)=.015030/.045241/.027579;
   maxima throughout 60 s = .037565/.045262/.060654. Kc=sqrt(8/pi)*SPREAD is an estimate, not a fitted spatial threshold.
   WAVES seed 1, 70x44: defects 1024 initially, 30 at 20s, 22 at 60s, 20 at 120s.
   CHIMERA seed 1: fixed 65-member arcs centred at indices 121 and 240, every 1/60s from 20 to 80s:
   coherent min r=.9963345338; incoherent max r=.5983598953 (3601 samples; no imposed initial domain).
   SWARM seed 1: angle-phase correlation .050996 initially, .995842 at 30s, .996331 at 60s.
   TWO TRIBES seed 1, measured 40..60s: K=1.2 -> 2.091308 / 1.907958 Hz; K=8 -> both 1.996326 Hz.
   ENTRAIN (measured with the first strength .32 — now .06, see entrain()) seed 1, K=.6, BPM120, 64 beats: all crossing events mean beat error .00709046s (1.4181% of cycle),
   last 16 beats .00470692s. Crossing times linearly interpolated inside the fixed step; no beat-time flash resets.
   References: https://arxiv.org/abs/nlin/0407045 ; https://www.nature.com/articles/s41467-017-01190-3
*/
const TAU=Math.PI*2;
function makeRng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const MODES=[
 {name:'FIREFLIES',jp:'闇のホタル',n:2400,k:.6,spread:.1,radius:.28,j:1},
 {name:'THRESHOLD',jp:'臨界のきわ',n:2400,k:.18,spread:.1,radius:.28,j:1},
 {name:'WAVES',jp:'位相の波',n:3072,k:5,spread:0,radius:1,j:1},
 {name:'CHIMERA',jp:'そろう側、ほどける側',n:256,k:4,spread:0,radius:1,j:1},
 {name:'SWARM',jp:'動く同期',n:500,k:0,spread:0,radius:1,j:1},
 {name:'TWO TRIBES',jp:'二つの部族',n:2400,k:1.2,spread:.08,radius:.38,j:1}
];
const wrap=a=>((a%TAU)+TAU)%TAU;
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function makeSync(mode=0,seed=1,opt={}){
 const p={...MODES[mode],...opt,mode,seed,rng:makeRng(seed),time:0,steps:0,flashes:0,meanHz:0};
 if(mode===2){p.cols=opt.cols||Math.round(Math.sqrt(p.n*1.6));p.rows=opt.rows||Math.round(p.n/p.cols);p.n=p.cols*p.rows;}
 for(const key of ['x','y','theta','noise','s','c','v','dx','dy','light','turns','cx','sx'])p[key]=new Float64Array(p.n);
 for(let i=0;i<p.n;i++){
  p.x[i]=p.rng();p.y[i]=p.rng();p.theta[i]=p.rng()*TAU;
  p.noise[i]=Math.sqrt(-2*Math.log(Math.max(1e-12,p.rng())))*Math.cos(TAU*p.rng());
  if(mode===2){p.x[i]=(i%p.cols+.5)/p.cols;p.y[i]=((i/p.cols|0)+.5)/p.rows;}
  if(mode===3){const a=TAU*i/p.n;p.cx[i]=Math.cos(a);p.sx[i]=Math.sin(a);p.x[i]=.5+.4*p.cx[i];p.y[i]=.5+.4*p.sx[i];}
  if(mode===4){const a=p.rng()*TAU,r=Math.sqrt(p.rng());p.x[i]=r*Math.cos(a);p.y[i]=r*Math.sin(a);}
 }
 if(mode===0||mode===1||mode===5)buildNeighbours(p);
 return p;
}
/* Radius-sized hash, subdivided into R/4 bins: wholly enclosed bins use exact sums;
   boundary bins keep individual neighbours. No sampling or mean-field approximation. */
function buildNeighbours(p){
 const R=p.radius,B=R/4,side=Math.ceil(1/B),bins=Array.from({length:side*side},()=>[]);
 p.binOf=new Int32Array(p.n);p.binC=new Float64Array(bins.length);p.binS=new Float64Array(bins.length);
 for(let i=0;i<p.n;i++){const k=Math.floor(p.x[i]/B)+side*Math.floor(p.y[i]/B);bins[k].push(i);p.binOf[i]=k;}
 const all=[],full=[],offset=new Int32Array(p.n+1),fo=new Int32Array(p.n+1),degree=new Int32Array(p.n);
 for(let i=0;i<p.n;i++){offset[i]=all.length;fo[i]=full.length;const gx=Math.floor(p.x[i]/B),gy=Math.floor(p.y[i]/B);
  for(let y=Math.max(0,gy-4);y<=Math.min(side-1,gy+4);y++)for(let x=Math.max(0,gx-4);x<=Math.min(side-1,gx+4);x++){
   const k=y*side+x,dx=Math.max(Math.abs(x*B-p.x[i]),Math.abs((x+1)*B-p.x[i])),dy=Math.max(Math.abs(y*B-p.y[i]),Math.abs((y+1)*B-p.y[i]));
   if(dx*dx+dy*dy<=R*R){full.push(k);degree[i]+=bins[k].length;}
   else for(const j of bins[k])if((p.x[i]-p.x[j])**2+(p.y[i]-p.y[j])**2<=R*R){all.push(j);degree[i]++;}
  }degree[i]--; // self contributes zero to sin(theta_j-theta_i)
 }offset[p.n]=all.length;fo[p.n]=full.length;p.nb=Int32Array.from(all);p.offset=offset;p.full=Int32Array.from(full);p.fo=fo;p.degree=degree;
}
function order(p){let c=0,s=0;for(let i=0;i<p.n;i++){c+=Math.cos(p.theta[i]);s+=Math.sin(p.theta[i]);}return{r:Math.hypot(c,s)/p.n,psi:Math.atan2(s,c)};}
function scramble(p){for(let i=0;i<p.n;i++){p.theta[i]=p.rng()*TAU;p.light[i]=0;}}
function lantern(p,x,y,r=.12,mess=false){for(let i=0;i<p.n;i++)if((p.x[i]-x)**2+(p.y[i]-y)**2<r*r){p.theta[i]=mess?p.rng()*TAU:0;p.light[i]=mess?0:1;if(!mess)p.flashes++;}}
/* Weak phase correction; no resets. The same external clock acts on every oscillator. */
/* strength .06 (Claude, 2026-11-02): from scrambled FIREFLIES at BPM 100, r = .03 → .46 (4 beats) → .90 (8) → .98 (12);
   the old .32 reached .99 in 4 beats — a reset, not a pull. THRESHOLD at .06: .32 → .78 → .90 by 20 beats. */
function entrain(p,strength=.06){for(let i=0;i<p.n;i++)p.theta[i]=wrap(p.theta[i]-strength*angle(p.theta[i]));}
function stepSync(p,dt=1/60,opt={}){
 const n=p.n,{theta:t,s,c,v}=p,K=p.k*(1+(opt.mid||0)),omega=TAU*(opt.hz||2),lag=p.mode===3?Math.PI/2-.18:p.mode===2?.35:0,ca=Math.cos(lag),sa=Math.sin(lag);
 for(let i=0;i<n;i++){s[i]=Math.sin(t[i]);c[i]=Math.cos(t[i]);v[i]=omega+p.spread*p.noise[i]+(p.mode===5?(p.x[i]<.5?.65:-.65):0);}
 if(p.mode===3){
  let cr=0,ci=0,xr=0,xi=0,yr=0,yi=0;
  for(let i=0;i<n;i++){cr+=c[i];ci+=s[i];xr+=c[i]*p.cx[i];xi+=s[i]*p.cx[i];yr+=c[i]*p.sx[i];yi+=s[i]*p.sx[i];}
  for(let i=0;i<n;i++){const re=(cr+.995*(p.cx[i]*xr+p.sx[i]*yr))/n,im=(ci+.995*(p.cx[i]*xi+p.sx[i]*yi))/n;v[i]+=K*((im*c[i]-re*s[i])*ca-(re*c[i]+im*s[i])*sa);}
 }else if(p.mode===2){
  const w=p.cols,h=p.rows;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let re=0,im=0;const js=[y*w+(x+w-1)%w,y*w+(x+1)%w,((y+h-1)%h)*w+x,((y+1)%h)*w+x];for(const j of js){re+=c[j];im+=s[j];}v[i]+=K*((im*c[i]-re*s[i])*ca-(re*c[i]+im*s[i])*sa)/4;}
 }else if(p.mode===4){
  p.dx.fill(0);p.dy.fill(0);
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   const x=p.x[j]-p.x[i],y=p.y[j]-p.y[i],r2=Math.max(.0001,x*x+y*y),r=Math.sqrt(r2),co=c[i]*c[j]+s[i]*s[j],sn=s[j]*c[i]-c[j]*s[i],f=((1+p.j*co)/r-1/r2)/n;
   p.dx[i]+=x*f;p.dy[i]+=y*f;p.dx[j]-=x*f;p.dy[j]-=y*f;v[i]+=K*sn/r/n;v[j]-=K*sn/r/n;
  }
  for(let i=0;i<n;i++){p.x[i]+=dt*p.dx[i];p.y[i]+=dt*p.dy[i];}
 }else{
  p.binC.fill(0);p.binS.fill(0);for(let i=0;i<n;i++){p.binC[p.binOf[i]]+=c[i];p.binS[p.binOf[i]]+=s[i];}
  for(let i=0;i<n;i++){let re=0,im=0;for(let z=p.fo[i];z<p.fo[i+1];z++){const j=p.full[z];re+=p.binC[j];im+=p.binS[j];}for(let z=p.offset[i];z<p.offset[i+1];z++){const j=p.nb[z];re+=c[j];im+=s[j];}if(p.degree[i])v[i]+=K*(im*c[i]-re*s[i])/p.degree[i];}
 }
 let sum=0,count=0;const decay=Math.exp(-dt/(opt.trail||.075));
 for(let i=0;i<n;i++){const d=v[i]*dt,nt=t[i]+d;p.turns[i]+=d;sum+=v[i];p.light[i]*=decay;if(nt>=TAU||nt<0){p.light[i]=1;count++;}t[i]=wrap(nt);}
 p.flashes+=count;p.meanHz=sum/n/TAU;p.time+=dt;p.steps++;return count;
}
function defects(p){let count=0;const w=p.cols,h=p.rows;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=y*w+x,b=y*w+(x+1)%w,c=((y+1)%h)*w+(x+1)%w,d=((y+1)%h)*w+x;const z=angle(p.theta[b]-p.theta[a])+angle(p.theta[c]-p.theta[b])+angle(p.theta[d]-p.theta[c])+angle(p.theta[a]-p.theta[d]);if(Math.abs(z)>Math.PI)count++;}return count;}
function localOrder(p,half=32){const out=new Float64Array(p.n);for(let i=0;i<p.n;i++){let c=0,s=0;for(let j=-half;j<=half;j++){const a=p.theta[(i+j+p.n)%p.n];c+=Math.cos(a);s+=Math.sin(a);}out[i]=Math.hypot(c,s)/(2*half+1);}return out;}
function rainbow(p){let a=0,b=0,c=0,d=0,mx=0,my=0;for(let i=0;i<p.n;i++){mx+=p.x[i]/p.n;my+=p.y[i]/p.n;}for(let i=0;i<p.n;i++){const q=Math.atan2(p.y[i]-my,p.x[i]-mx);a+=Math.cos(q+p.theta[i]);b+=Math.sin(q+p.theta[i]);c+=Math.cos(q-p.theta[i]);d+=Math.sin(q-p.theta[i]);}return Math.max(Math.hypot(a,b),Math.hypot(c,d))/p.n;}
/* Readout only: connected coherent neighbourhoods, not peaks of a global phase histogram.
   Spatial radius <= .12 (SWARM .3, WAVES two cells), local r>.85, edge phase gap<.5,
   at least max(8, ceil(.003*N)) members. This operational count is deliberately labelled approximate. */
function coherentClusters(p){
 const R=p.mode===4?.3:p.mode===2?2/Math.max(p.cols,p.rows):Math.min(.12,p.radius);
 if(!p.clusterNb||p.clusterR!==R||p.mode===4){
  const grid=new Map(),key=(x,y)=>x+','+y;
  for(let i=0;i<p.n;i++){const k=key(Math.floor(p.x[i]/R),Math.floor(p.y[i]/R));if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);}
  p.clusterNb=Array.from({length:p.n},()=>[]);p.clusterR=R;
  for(let i=0;i<p.n;i++){const x=Math.floor(p.x[i]/R),y=Math.floor(p.y[i]/R);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const j of grid.get(key(x+dx,y+dy))||[])if(j!==i&&(p.x[i]-p.x[j])**2+(p.y[i]-p.y[j])**2<R*R)p.clusterNb[i].push(j);}
 }
 const c=Float64Array.from(p.theta,Math.cos),s=Float64Array.from(p.theta,Math.sin),on=new Uint8Array(p.n),parent=Int32Array.from({length:p.n},(_,i)=>i),size=new Int32Array(p.n);
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let i=0;i<p.n;i++){let re=c[i],im=s[i];for(const j of p.clusterNb[i]){re+=c[j];im+=s[j];}on[i]=p.clusterNb[i].length>=3&&Math.hypot(re,im)/(p.clusterNb[i].length+1)>.85;}
 for(let i=0;i<p.n;i++)if(on[i])for(const j of p.clusterNb[i])if(j>i&&on[j]&&c[i]*c[j]+s[i]*s[j]>Math.cos(.5)){const a=root(i),b=root(j);if(a!==b)parent[b]=a;}
 for(let i=0;i<p.n;i++)if(on[i])size[root(i)]++;
 let count=0;for(const n of size)if(n>=Math.max(8,Math.ceil(p.n*.003)))count++;return count;
}
/*SIM-END*/
