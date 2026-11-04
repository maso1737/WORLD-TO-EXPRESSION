"use strict";
/* EE-02 HIGHWAY — the law, shared by 02_highway.html and scroll/SCROLL_HIGHWAY_LP.html (2026-11-04: moved out of the HTML verbatim).
   SIM block = Langton's ant / turmites (parseRule, makeWorld, makeAnt, stepAnt, detectHighway, buildPalette, paint) + PRESETS.
   Classic script: top-level names are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11)) */
/*SIM-BEGIN — pure simulation core (no DOM). Node-verifiable: extract between the markers. */
const DX=[0,1,0,-1], DY=[-1,0,1,0];      // 0=up 1=right 2=down 3=left
const HBUF=8192;                          // per-ant position history (ring)
function parseRule(rule){ return Int8Array.from(rule, c=> c==='R'?1:-1); }
function makeWorld(gw, gh, rule){
  return { gw, gh, grid:new Uint8Array(gw*gh), heat:new Uint8Array(gw*gh),
           rule, turns:parseRule(rule), k:rule.length, ants:[], steps:0, heatVal:255 };
}
function makeAnt(x, y, dir){
  return { x, y, dir, ux:0, uy:0, n:0, buf:new Int32Array(HBUF*2), hw:null };
}
/* the whole rule: read the colour, turn, advance the colour, step forward (torus) */
function stepAnt(w, a){
  const i = a.y*w.gw + a.x, s = w.grid[i];
  a.dir = (a.dir + w.turns[s] + 4) & 3;
  w.grid[i] = (s+1 === w.k) ? 0 : s+1;
  w.heat[i] = w.heatVal;
  const dx = DX[a.dir], dy = DY[a.dir];
  a.x += dx; a.y += dy; a.ux += dx; a.uy += dy;
  if (a.x < 0) a.x = w.gw-1; else if (a.x >= w.gw) a.x = 0;
  if (a.y < 0) a.y = w.gh-1; else if (a.y >= w.gh) a.y = 0;
  const j = (a.n % HBUF)*2; a.buf[j] = a.ux; a.buf[j+1] = a.uy; a.n++;
}
/* highway = the ant's displacement over p steps is the same nonzero vector,
   repeated for the last max(3p, 600) steps. The 600-step floor stops short zigzags
   in the chaos from passing as roads. Unwrapped coords, so the torus doesn't fool it. */
const HW_MIN = 600;
function detectHighway(a){
  const n = a.n, last = n-1, have = Math.min(n, HBUF);
  const b = a.buf, at = t => (t % HBUF)*2;
  for (let p=1; p<=2000; p++){
    const span = Math.max(3*p, HW_MIN);
    if (span + p >= have) break;
    const i0 = at(last), i1 = at(last-p);
    const dx = b[i0]-b[i1], dy = b[i0+1]-b[i1+1];
    if (dx===0 && dy===0) continue;
    let ok = true;
    for (let j=1; j<span; j++){
      const k0 = at(last-j), k1 = at(last-j-p);
      if (b[k0]-b[k1] !== dx || b[k0+1]-b[k1+1] !== dy){ ok=false; break; }
    }
    if (ok) return { p, dx, dy };
  }
  return null;
}
function lerp(a,b,t){ return a+(b-a)*t; }
/* state 0 = noir, then dim ice → bright ice. 95% of the screen stays black & ice. */
function buildPalette(k){
  const pal = new Uint8Array(k*3);
  pal[0]=7; pal[1]=7; pal[2]=7;
  for (let s=1; s<k; s++){
    const t = k===2 ? 0.42 : (s-1)/(k-2);
    pal[s*3]  = Math.round(lerp(12, 130, t));
    pal[s*3+1]= Math.round(lerp(52, 232, t));
    pal[s*3+2]= Math.round(lerp(78, 255, t));
  }
  return pal;
}
/* base image (state colours, heat lifts toward white) + heat-only image for the bloom */
function paint(w, data, hdata, pal, decay){
  const g = w.grid, h = w.heat, n = g.length;
  for (let i=0, o=0; i<n; i++, o+=4){
    const s = g[i]*3;
    let r = pal[s], gg = pal[s+1], bb = pal[s+2];
    const hv = h[i];
    if (hv){
      const t = hv/255*0.6;
      r += (248-r)*t; gg += (252-gg)*t; bb += (255-bb)*t;
      h[i] = hv > decay ? hv-decay : 0;
      hdata[o]=150; hdata[o+1]=240; hdata[o+2]=255; hdata[o+3]=hv;
    } else hdata[o+3]=0;
    data[o]=r; data[o+1]=gg; data[o+2]=bb; data[o+3]=255;
  }
}
/* six rules — one ant, only the turn string differs */
const PRESETS = [
  { name:'LANGTON',    rule:'RL',           jp:'一万歩目に道が出る' },
  { name:'SYMMETRY',   rule:'LLRR',         jp:'左右対称に育つ' },
  { name:'CHAOS',      rule:'RLR',          jp:'秩序が来ない' },
  { name:'SQUARE',     rule:'LRRRRRLLR',    jp:'四角を塗り広げる' },
  { name:'TRIANGLE',   rule:'RRLLLRLLLRRR', jp:'三角に育つ' },
  { name:'SPIRAL HWY', rule:'LLRRRLRLRLLR', jp:'渦の奥から道' },
];
/*SIM-END*/
