"use strict";
/* EE-09 GROWTH — the law, shared by 09_growth.html (and a future scroll/SCROLL_GROWTH_LP.html).
   Diffusion-limited aggregation (Witten & Sander 1981): a particle wanders at random until it touches the
   cluster, then it stays. Nothing else. Branches, screening and the fractal dimension ≈ 1.7 all come from that.
   Classic script: top-level names are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11)) */
/*SIM-BEGIN — pure DLA on a square lattice.
   occ  : 0 empty, 1 cluster
   age  : the order in which a cell joined (1, 2, 3, …) — the colour of time
   own  : which seed a cell grew from (TOWNS colours territories with it)
   dist : Chebyshev distance to the nearest cluster cell, capped at DCAP. A walker with dist d ≥ 3 may jump
          anywhere within Euclidean radius d−2 in one go: it cannot touch the cluster on the way, so the
          statistics are the same as walking one cell at a time — only faster. Near the cluster it walks cell by cell. */
const GMODES = [
  {name:'SEED',   jp:'一点から',          seed:'point', spawn:'circle', nb:8, stick:1,   m:1, wind:0, cap:.24},
  {name:'FOREST', jp:'地面から・粒は上から', seed:'floor', spawn:'top',    nb:8, stick:1,   m:1, wind:.12, cap:.5},
  {name:'CRYSTAL',jp:'四本の腕',          seed:'point', spawn:'circle', nb:4, stick:1,   m:6, wind:0, cap:.09},
  {name:'TOWNS',  jp:'七つの町',          seed:'towns', spawn:'open',   nb:8, stick:1,   m:1, wind:0, cap:.22},
  {name:'CORAL',  jp:'くっつきにくい',     seed:'point', spawn:'circle', nb:8, stick:.08, m:1, wind:0, cap:.24},
  {name:'EDEN',   jp:'歩かない粒',         seed:'point', spawn:'eden',   nb:8, stick:1,   m:1, wind:0, cap:.45}
];
const DCAP = 40;
function makeRng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const NB8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
function makeWorld(w,h,mode,rnd){
  const n=w*h, M=GMODES[mode];
  const g={w,h,mode,M,rnd,occ:new Uint8Array(n),age:new Int32Array(n),own:new Uint8Array(n),hits:new Uint8Array(n),
    dist:new Uint8Array(n).fill(DCAP),glow:new Float32Array(n),
    wx:new Int32Array(0),wy:new Int32Array(0),nw:0,
    count:0,cap:Math.floor(n*M.cap),seeds:0,cx:w>>1,cy:h>>1,rmax:0,top:h,minx:w,maxx:-1,full:false,
    stick:M.stick,m:M.m,wind:M.wind,nb:M.nb,spawn:M.spawn,jumps:0,lastJoin:-1,cells:[]};
  if(M.seed==='point') addSeed(g,w>>1,h>>1);
  else if(M.seed==='floor'){ for(let x=0;x<w;x++) join(g,x,h-1,0); g.seeds=1; }
  else if(M.seed==='towns'){
    // seven towns, not too close to each other or to the edge
    const pts=[]; let tries=0;
    while(pts.length<7&&tries++<4000){ const x=Math.floor(w*(.14+.72*rnd())), y=Math.floor(h*(.16+.68*rnd()));
      if(pts.every(p=>Math.hypot(p[0]-x,p[1]-y)>Math.min(w,h)*.24)) pts.push([x,y]); }
    for(const [x,y] of pts) addSeed(g,x,y);
  }
  return g;
}
/* particles come down from the top edge: FOREST, or any species once WIND blows */
function rains(g){ return g.spawn==='top'||(g.wind>=.04&&g.spawn!=='eden'); }
function inside(g,x,y){ return x>=0&&y>=0&&x<g.w&&y<g.h; }
/* a new nucleus (hand or TOWNS): its own territory id */
function addSeed(g,x,y){ if(!inside(g,x,y)||g.occ[y*g.w+x])return false; const id=Math.min(255,++g.seeds); join(g,x,y,id); return true; }
function join(g,x,y,own){
  const {w,h}=g, i=y*w+x; if(g.occ[i])return;
  g.occ[i]=1; g.age[i]=++g.count; g.own[i]=own; g.glow[i]=1; g.lastJoin=i; g.cells.push(i);
  const r=Math.hypot(x-g.cx,y-g.cy); if(r>g.rmax)g.rmax=r; if(y<g.top)g.top=y; if(x<g.minx)g.minx=x; if(x>g.maxx)g.maxx=x;
  if(rains(g)?y<=2:g.count>=g.cap) g.full=true;   // rain (FOREST / wind): a branch reached the sky · others: the world is full enough
  const R=DCAP-1, d=g.dist;
  for(let yy=Math.max(0,y-R);yy<=Math.min(h-1,y+R);yy++){ const dy=Math.abs(yy-y), row=yy*w;
    for(let xx=Math.max(0,x-R);xx<=Math.min(w-1,x+R);xx++){ const c=Math.max(dy,Math.abs(xx-x)); if(c<d[row+xx])d[row+xx]=c; } }
}
/* after cells are removed (the hand cuts), rebuild the distance field in two passes (chamfer, Chebyshev) */
function rebuildDist(g){
  const {w,h,occ,dist}=g;
  for(let i=0;i<w*h;i++) dist[i]=occ[i]?0:DCAP;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const i=y*w+x; let v=dist[i];
    if(x>0)v=Math.min(v,dist[i-1]+1); if(y>0){ v=Math.min(v,dist[i-w]+1); if(x>0)v=Math.min(v,dist[i-w-1]+1); if(x<w-1)v=Math.min(v,dist[i-w+1]+1); } dist[i]=v; }
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){ const i=y*w+x; let v=dist[i];
    if(x<w-1)v=Math.min(v,dist[i+1]+1); if(y<h-1){ v=Math.min(v,dist[i+w]+1); if(x<w-1)v=Math.min(v,dist[i+w+1]+1); if(x>0)v=Math.min(v,dist[i+w-1]+1); } dist[i]=v; }
  g.rmax=0; g.top=h; g.minx=w; g.maxx=-1; g.cells=[];
  for(let i=0;i<w*h;i++) if(occ[i]){ g.cells.push(i); const x=i%w,y=(i/w)|0; g.rmax=Math.max(g.rmax,Math.hypot(x-g.cx,y-g.cy)); if(y<g.top)g.top=y; if(x<g.minx)g.minx=x; if(x>g.maxx)g.maxx=x; }
  g.full=false;
}
function cut(g,cx,cy,r){
  const {w,h}=g; let n=0;
  for(let y=Math.max(0,cy-r);y<=Math.min(h-1,cy+r);y++)for(let x=Math.max(0,cx-r);x<=Math.min(w-1,cx+r);x++){
    const i=y*w+x; if(g.occ[i]&&(x-cx)**2+(y-cy)**2<=r*r&&!(g.M.seed==='floor'&&y===h-1)){ g.occ[i]=0; g.age[i]=0; g.own[i]=0; g.hits[i]=0; n++; } }
  if(n){ rebuildDist(g); for(let k=0;k<g.nw;k++)respawn(g,k); }
  return n;
}
/* where a new walker starts */
function launchPos(g){
  const {w,h,rnd}=g;
  // with wind, particles come from upwind: they are released along the top edge, whatever the seed
  if(rains(g)){
    // rain falls over the cluster's width (± a margin): rain far to the side would fall past it anyway
    const a=Math.max(0,g.minx-DCAP), b=Math.min(w-1,g.maxx+DCAP);
    return [a+Math.floor(rnd()*(b-a+1)), Math.max(0,Math.min(g.top-DCAP,Math.floor(rnd()*4)))];
  }
  if(g.spawn==='circle'){
    const R=g.rmax+6;
    if(R<Math.min(w,h)/2-3){ const a=rnd()*Math.PI*2; return [Math.round(g.cx+Math.cos(a)*R), Math.round(g.cy+Math.sin(a)*R)]; }
  }
  // open: anywhere in the open — a cell at least DCAP from the cluster (a gas that fills the world).
  // Used by TOWNS, and by one-seed modes once the launch circle no longer fits in the world.
  for(let t=0;t<60;t++){ const x=Math.floor(rnd()*w), y=Math.floor(rnd()*h); if(g.dist[y*w+x]>=DCAP-1)return [x,y]; }
  for(let t=0;t<200;t++){ const x=Math.floor(rnd()*w), y=Math.floor(rnd()*h); if(g.dist[y*w+x]>=10)return [x,y]; }
  g.full=true; return [Math.floor(rnd()*w),Math.floor(rnd()*h)];
}
function setWalkers(g,n){
  const ox=g.wx, oy=g.wy, k=Math.min(n,g.nw);
  g.wx=new Int32Array(n); g.wy=new Int32Array(n); g.wx.set(ox.subarray(0,k)); g.wy.set(oy.subarray(0,k));
  const old=g.nw; g.nw=n; for(let i=old;i<n;i++) respawn(g,i);
}
function respawn(g,k){ let p=launchPos(g), t=0; while(g.occ[p[1]*g.w+p[0]]&&t++<20)p=launchPos(g); g.wx[k]=p[0]; g.wy[k]=p[1]; }
/* is any (4- or 8-) neighbour part of the cluster? returns that neighbour's index, or -1 */
function touching(g,x,y){
  const {w,h,occ}=g, nn=g.nb===4?4:8;
  for(let k=0;k<nn;k++){ const u=x+NB8[k][0], v=y+NB8[k][1]; if(u>=0&&v>=0&&u<w&&v<h&&occ[v*w+u])return v*w+u; }
  return -1;
}
/* move one walker one "event": a long safe jump if far, otherwise one lattice step. Returns true if it joined. */
function stepWalker(g,k){
  const {w,h,rnd,dist}=g; let x=g.wx[k], y=g.wy[k];
  const d=dist[y*w+x], wind=g.wind;
  if(d>=3){
    // a jump of radius r stands for ≈ r² lattice steps, so the wind adds a drift of wind·r².
    // r is kept ≤ 1/|wind| (drift ≤ the diffusive spread) and the sum ≤ d−2 (still cannot touch the cluster).
    let r=d-2; if(wind) r=Math.max(1,Math.min((d-2)/2,1/Math.abs(wind)));
    const a=rnd()*Math.PI*2; let dx=Math.cos(a)*r, dy=Math.sin(a)*r+wind*r*r;
    const L=Math.hypot(dx,dy); if(L>d-2){ dx*=(d-2)/L; dy*=(d-2)/L; }
    x=Math.round(x+dx); y=Math.round(y+dy);
  }else{
    let dir;
    if(wind&&rnd()<Math.abs(wind)) dir=wind>0?2:3; else dir=(rnd()*4)|0;   // dir 2 = down (+y), 3 = up
    x+=NB8[dir][0]; y+=NB8[dir][1];
  }
  // walls: reflect. TOP spawn falls through the floor of the sky → start again
  if(x<0)x=-x; if(x>=w)x=2*w-2-x; if(y<0)y=-y;
  if(y>=h){ if(rains(g)){ respawn(g,k); return false; } y=2*h-2-y; }   // rain that missed falls away
  x=Math.max(0,Math.min(w-1,x)); y=Math.max(0,Math.min(h-1,y));
  g.jumps++;
  if(g.occ[y*w+x]){ respawn(g,k); return false; }                // (only possible right after a cut)
  g.wx[k]=x; g.wy[k]=y;
  if(dist[y*w+x]<=1){
    const nbi=touching(g,x,y);
    if(nbi>=0&&rnd()<g.stick){
      const i=y*w+x; let ok=true;
      if(g.m>1){ g.hits[i]++; ok=g.hits[i]>=g.m; }               // noise reduction: a site needs m visits
      if(ok) join(g,x,y,g.own[nbi]);
      respawn(g,k); return ok;
    }
  }
  return false;
}
/* EDEN: no walking at all — a random empty neighbour of a random cluster cell is filled */
function edenStep(g){
  const {w,h,rnd}=g; if(!g.cells.length)return false;
  for(let t=0;t<16;t++){
    const i=g.cells[(rnd()*g.cells.length)|0], x=i%w, y=(i/w)|0, k=(rnd()*(g.nb===4?4:8))|0, u=x+NB8[k][0], v=y+NB8[k][1];
    if(u>=0&&v>=0&&u<w&&v<h&&!g.occ[v*w+u]){ join(g,u,v,g.own[i]); return true; }
  }
  return false;
}
/* run up to `budget` walker events; stop early after `maxJoin` joins. Returns joins. */
function grow(g,budget,maxJoin=Infinity){
  if(g.full)return 0;
  let joins=0;
  if(g.spawn==='eden'){ for(let b=0;b<budget&&joins<maxJoin&&!g.full;b+=40) if(edenStep(g))joins++; return joins; }
  const n=g.nw; if(!n)return 0;
  let k=(g._rr||0)%n;
  for(let b=0;b<budget&&joins<maxJoin&&!g.full;b++){ if(stepWalker(g,k))joins++; k++; if(k>=n)k=0; }
  g._rr=k; return joins;
}
/* box-counting dimension of the cluster: boxes of side 2..64 that hold a cluster cell.
   (side 1 is skipped — at one cell every set looks like a set of dots.) */
function boxDim(g){
  const {w,h,occ}=g, pts=[];
  if(g.count<200) return {D:NaN,pts};
  for(let s=2;s<=64;s*=2){
    const bw=Math.ceil(w/s), bh=Math.ceil(h/s), seen=new Uint8Array(bw*bh); let c=0;
    for(let y=0;y<h;y++){ const by=((y/s)|0)*bw, row=y*w; for(let x=0;x<w;x++) if(occ[row+x]){ const b=by+((x/s)|0); if(!seen[b]){seen[b]=1;c++;} } }
    pts.push({s,n:c,x:Math.log10(1/s),y:Math.log10(c)});
  }
  // least squares on the boxes small enough to see structure (2..32)
  const f=pts.filter(p=>p.s<=32); const mx=f.reduce((a,p)=>a+p.x,0)/f.length, my=f.reduce((a,p)=>a+p.y,0)/f.length;
  let sxy=0,sxx=0; for(const p of f){ sxy+=(p.x-mx)*(p.y-my); sxx+=(p.x-mx)**2; }
  const D=sxy/sxx; return {D,pts,icpt:my-D*mx};
}
/* mass–radius from the world centre (for one-seed modes): N(r) ∝ r^D */
function massRadius(g){
  const {w,occ}=g, R=Math.floor(g.rmax); if(R<16)return NaN;
  const bins=new Float64Array(R+2); for(const i of g.cells){ const r=Math.hypot(i%w-g.cx,((i/w)|0)-g.cy); bins[Math.min(R+1,Math.ceil(r))]++; }
  let acc=0; const xs=[],ys=[]; for(let r=1;r<=R;r++){ acc+=bins[r]; if(r>=4&&r<=R*.6){ xs.push(Math.log(r)); ys.push(Math.log(acc+1)); } }
  const mx=xs.reduce((a,b)=>a+b,0)/xs.length,my=ys.reduce((a,b)=>a+b,0)/ys.length; let sxy=0,sxx=0; for(let i=0;i<xs.length;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sxx+=(xs[i]-mx)**2;}
  return sxy/sxx;
}
/*SIM-END*/
