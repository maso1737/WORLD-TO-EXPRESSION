"use strict";
/* EE-03 SLIME NETWORK — the law, shared by 03_slime_network.html and scroll/SCROLL_SLIME_LP.html (2026-11-04: moved out of the HTML verbatim).
   SIM block = Jones 2010 agents (makeSim, seedAgents, stepAgents, diffuse, depositDisc, buildLUT, TONE, paintTrail) + SPECIES.
   makeRng / cover are new here: the app's mulberry32 rnd() as a seedable factory, and the app's coverNow() (share of every 5th cell above dep·2.2) as a pure function.
   Classic script: top-level names are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11)) */
/*SIM-BEGIN — pure simulation core (no DOM). Node-verifiable: extract between the markers. */
const DEG = Math.PI/180, TAU = Math.PI*2;
/* cos/sin lookup — 8 trig calls per agent per step is the bottleneck otherwise */
const TRIG_N = 4096, TRIG_K = TRIG_N/TAU, COS = new Float32Array(TRIG_N), SIN = new Float32Array(TRIG_N);
for (let i=0; i<TRIG_N; i++){ COS[i] = Math.cos(i/TRIG_K); SIN[i] = Math.sin(i/TRIG_K); }
function makeSim(gw, gh){
  return { gw, gh, trail:new Float32Array(gw*gh), tmp:new Float32Array(gw*gh), n:0, ax:null, ay:null, aa:null, steps:0 };
}
/* dust = scattered everywhere (noise → network in ~2 s, the default birth)
   spore = a disc at the centre facing outward — it tends to contract into a single ring */
function seedAgents(sim, n, mode, rnd){
  sim.n = n; sim.ax = new Float32Array(n); sim.ay = new Float32Array(n); sim.aa = new Float32Array(n);
  const cx = sim.gw/2, cy = sim.gh/2, R = Math.min(sim.gw, sim.gh)*0.1;
  for (let i=0; i<n; i++){
    if (mode === 'spore'){
      const t = rnd()*2*Math.PI, r = Math.sqrt(rnd())*R;
      sim.ax[i] = cx + Math.cos(t)*r; sim.ay[i] = cy + Math.sin(t)*r; sim.aa[i] = t;
    } else {
      sim.ax[i] = rnd()*sim.gw; sim.ay[i] = rnd()*sim.gh; sim.aa[i] = rnd()*2*Math.PI;
    }
  }
}
/* the whole rule (Jones 2010): sniff three points, turn toward the strongest, step, deposit */
function stepAgents(sim, P, rnd){
  const gw = sim.gw, gh = sim.gh, tr = sim.trail, ax = sim.ax, ay = sim.ay, aa = sim.aa, n = sim.n;
  const sa = P.sa*DEG, ra = P.ra*DEG, so = P.so, ss = P.ss, dep = P.dep, jit = P.jit;
  const smp = (px, py) => {
    let ix = px|0, iy = py|0;
    if (ix < 0) ix += gw; else if (ix >= gw) ix -= gw;
    if (iy < 0) iy += gh; else if (iy >= gh) iy -= gh;
    return tr[iy*gw + ix];
  };
  for (let i=0; i<n; i++){
    const x = ax[i], y = ay[i];
    let a = aa[i];
    const ia = (a*TRIG_K)|0, is = (sa*TRIG_K)|0;
    const f  = smp(x + COS[ia & 4095]*so,      y + SIN[ia & 4095]*so);
    const fl = smp(x + COS[(ia-is) & 4095]*so, y + SIN[(ia-is) & 4095]*so);
    const fr = smp(x + COS[(ia+is) & 4095]*so, y + SIN[(ia+is) & 4095]*so);
    if (f > fl && f > fr){ /* straight on */ }
    else if (f < fl && f < fr) a += (rnd() < 0.5 ? -ra : ra);
    else if (fl < fr) a += ra;
    else if (fr < fl) a -= ra;
    if (jit) a += (rnd()-0.5)*jit;
    if (a < 0) a += TAU; else if (a >= TAU) a -= TAU;
    const ib = ((a*TRIG_K)|0) & 4095;
    let nx = x + COS[ib]*ss, ny = y + SIN[ib]*ss;
    if (nx < 0) nx += gw; else if (nx >= gw) nx -= gw;
    if (ny < 0) ny += gh; else if (ny >= gh) ny -= gh;
    ax[i] = nx; ay[i] = ny; aa[i] = a;
    let ix = nx|0, iy = ny|0; if (ix >= gw) ix = gw-1; if (iy >= gh) iy = gh-1;
    tr[iy*gw + ix] += dep;
  }
  sim.steps++;
}
/* 3×3 mean (separable, torus) then decay — the scent spreads and fades */
function diffuse(sim, decay){
  const gw = sim.gw, gh = sim.gh, tr = sim.trail, tmp = sim.tmp, k = (1-decay)/9;
  for (let y=0; y<gh; y++){
    const row = y*gw;
    tmp[row] = tr[row+gw-1] + tr[row] + tr[row+1];
    for (let x=1; x<gw-1; x++) tmp[row+x] = tr[row+x-1] + tr[row+x] + tr[row+x+1];
    tmp[row+gw-1] = tr[row+gw-2] + tr[row+gw-1] + tr[row];
  }
  for (let y=0; y<gh; y++){
    const up = (y ? y-1 : gh-1)*gw, row = y*gw, dn = (y < gh-1 ? y+1 : 0)*gw;
    for (let x=0; x<gw; x++) tr[row+x] = (tmp[up+x] + tmp[row+x] + tmp[dn+x])*k;
  }
}
function depositDisc(sim, cx, cy, r, amt){
  const gw = sim.gw, gh = sim.gh, tr = sim.trail, r2 = r*r;
  for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++){
    if (dx*dx+dy*dy > r2) continue;
    let x = (cx+dx)|0, y = (cy+dy)|0;
    x = ((x%gw)+gw)%gw; y = ((y%gh)+gh)%gh;
    tr[y*gw+x] += amt;
  }
}
/* noir → deep blue → ice → white. Tone-mapped (1−e^−v) so dense veins never clip flat */
function buildLUT(){
  const stops = [[0,7,7,7],[0.18,6,26,44],[0.45,30,120,160],[0.75,90,233,255],[1,248,250,255]];
  const lut = new Uint8Array(256*3);
  for (let i=0; i<256; i++){
    const t = i/255; let k = 1; while (k < stops.length-1 && stops[k][0] < t) k++;
    const a = stops[k-1], b = stops[k], u = (t-a[0])/(b[0]-a[0]);
    for (let c=0; c<3; c++) lut[i*3+c] = Math.round(a[c+1] + (b[c+1]-a[c+1])*u);
  }
  return lut;
}
const TONE = new Uint8Array(1024);
for (let i=0; i<1024; i++) TONE[i] = Math.round((1 - Math.exp(-i/256*1.6)) / (1 - Math.exp(-4*1.6)) * 255);
function paintTrail(sim, data, lut, gain){
  const tr = sim.trail, n = tr.length, s = 256*gain;
  for (let i=0, o=0; i<n; i++, o+=4){
    let q = (tr[i]*s)|0; if (q > 1023) q = 1023;
    const c = TONE[q]*3;
    data[o] = lut[c]; data[o+1] = lut[c+1]; data[o+2] = lut[c+2]; data[o+3] = 255;
  }
}
/* six species — the same rule, only the numbers differ */
const SPECIES = [
  { name:'NETWORK',   jp:'餌を最短でつなぐ', p:{ sa:45,   ra:45,   so:15, ss:1,   decay:0.10, jit:0    } },
  { name:'VEINS',     jp:'太い葉脈',         p:{ sa:45,   ra:22.5, so:20, ss:1.4, decay:0.06, jit:0.05 } },
  { name:'LABYRINTH', jp:'迷路を編む',       p:{ sa:45,   ra:22.5, so:5,  ss:1,   decay:0.10, jit:0    } },
  { name:'HONEYCOMB', jp:'蜂の巣の六角',     p:{ sa:70,   ra:22.5, so:15, ss:1,   decay:0.10, jit:0    } },
  { name:'CELLS',     jp:'泡のような細胞',   p:{ sa:40,   ra:60,   so:26, ss:1.2, decay:0.08, jit:0    } },
  { name:'BEADS',     jp:'ちぎれて粒になる', p:{ sa:10,   ra:70,   so:5,  ss:1,   decay:0.10, jit:0    } },
];
function makeRng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function cover(sim, th){ let on = 0; const tr = sim.trail; for (let i=0; i<tr.length; i+=5) if (tr[i] > th) on++; return on/(tr.length/5); }
/*SIM-END*/
