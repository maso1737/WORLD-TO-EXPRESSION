"use strict";
/* EE-04 FLOCK — the law, shared by 04_flock.html and scroll/SCROLL_FLOCK_LP.html (2026-11-04: moved out of the HTML verbatim).
   SIM block = Reynolds boids (makeFlock, setCount, scatter, stepFlock, polarization, rotation, countFlocks) + BEHAVIORS.
   makeRng is new here: the app's mulberry32 rnd() as a seedable factory, for reproducible records.
   Classic script: top-level names are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11)) */
/*SIM-BEGIN — pure simulation core (no DOM). Node-verifiable: extract between the markers. */
const DEG = Math.PI/180;
function makeFlock(w, h){
  return { w, h, n:0, x:new Float32Array(0), y:new Float32Array(0), vx:new Float32Array(0), vy:new Float32Array(0),
           nvx:null, nvy:null, nb:null, next:null, head:null, gx:0, gy:0, cw:1, ch:1, steps:0, dbg:null };
}
/* resize the population; survivors keep flying, newcomers appear anywhere facing anywhere */
function setCount(F, n, speed, rnd){
  const keep = Math.min(n, F.n);
  const x = new Float32Array(n), y = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n);
  x.set(F.x.subarray(0, keep)); y.set(F.y.subarray(0, keep)); vx.set(F.vx.subarray(0, keep)); vy.set(F.vy.subarray(0, keep));
  for (let i=keep; i<n; i++){
    const a = rnd()*2*Math.PI;
    x[i] = rnd()*F.w; y[i] = rnd()*F.h; vx[i] = Math.cos(a)*speed; vy[i] = Math.sin(a)*speed;
  }
  F.x = x; F.y = y; F.vx = vx; F.vy = vy; F.n = n;
  F.nvx = new Float32Array(n); F.nvy = new Float32Array(n); F.nb = new Uint8Array(n); F.next = new Int32Array(n);
}
function scatter(F, speed, rnd){
  for (let i=0; i<F.n; i++){
    const a = rnd()*2*Math.PI;
    F.x[i] = rnd()*F.w; F.y[i] = rnd()*F.h; F.vx[i] = Math.cos(a)*speed; F.vy[i] = Math.sin(a)*speed;
  }
}
/* bucket grid with cells at least one view-radius wide, so a 3×3 block covers everyone in sight */
function buildGrid(F, R){
  const cs = Math.min(Math.max(8, R), F.w/3, F.h/3);
  const gx = Math.max(3, Math.floor(F.w/cs)), gy = Math.max(3, Math.floor(F.h/cs));
  if (!F.head || F.head.length !== gx*gy) F.head = new Int32Array(gx*gy);
  F.gx = gx; F.gy = gy; F.cw = F.w/gx; F.ch = F.h/gy;
  F.head.fill(-1);
  for (let i=0; i<F.n; i++){
    let cx = (F.x[i]/F.cw)|0, cy = (F.y[i]/F.ch)|0;
    if (cx >= gx) cx = gx-1; if (cy >= gy) cy = gy-1;
    const c = cy*gx + cx; F.next[i] = F.head[c]; F.head[c] = i;
  }
}
const _st = [0, 0];
/* Reynolds steering: desired = direction × max speed, steer = desired − velocity, clamped */
function steer(dx, dy, vx, vy, maxS, maxF){
  const l = Math.hypot(dx, dy);
  if (l < 1e-9){ _st[0] = 0; _st[1] = 0; return _st; }
  let sx = dx/l*maxS - vx, sy = dy/l*maxS - vy;
  const m = Math.hypot(sx, sy);
  if (m > maxF){ sx *= maxF/m; sy *= maxF/m; }
  _st[0] = sx; _st[1] = sy; return _st;
}
/* the whole rule, for every boid at once (synchronous update):
   1 separate from the too-close, 2 align with the visible, 3 move toward their centre */
function stepFlock(F, P, rnd, ext, wantDbg){
  buildGrid(F, P.view);
  const w = F.w, h = F.h, n = F.n, hw = w/2, hh = h/2;
  const x = F.x, y = F.y, vx = F.vx, vy = F.vy, nvx = F.nvx, nvy = F.nvy, head = F.head, next = F.next, nb = F.nb;
  const gx = F.gx, gy = F.gy, cw = F.cw, ch = F.ch;
  const R2 = P.view*P.view, S2 = P.sep*P.sep;
  const cosF = Math.cos(P.fov*DEG/2), useF = P.fov < 359;
  const maxS = P.speed, minS = P.speed*0.45, maxF = P.speed*0.06;
  const wS = P.on.sep ? P.wSep : 0, wA = P.on.ali ? P.wAli : 0, wC = P.on.coh ? P.wCoh : 0;
  const HAWK_R = 130, HAWK_R2 = HAWK_R*HAWK_R, LURE_R = 90;
  F.dbg = null;
  for (let i=0; i<n; i++){
    const xi = x[i], yi = y[i], vxi = vx[i], vyi = vy[i];
    const sp = Math.hypot(vxi, vyi) || 1e-6;
    let sx=0, sy=0, ax=0, ay=0, cx=0, cy=0, cnt=0, scnt=0;
    const dbgN = (wantDbg && i === 0) ? [] : null;
    let ci = (xi/cw)|0, cj = (yi/ch)|0; if (ci >= gx) ci = gx-1; if (cj >= gy) cj = gy-1;
    for (let oy=-1; oy<=1; oy++){
      let ry = cj+oy; if (ry < 0) ry += gy; else if (ry >= gy) ry -= gy;
      for (let ox=-1; ox<=1; ox++){
        let rx = ci+ox; if (rx < 0) rx += gx; else if (rx >= gx) rx -= gx;
        for (let j = head[ry*gx + rx]; j !== -1; j = next[j]){
          if (j === i) continue;
          let dx = x[j]-xi; if (dx > hw) dx -= w; else if (dx < -hw) dx += w;
          let dy = y[j]-yi; if (dy > hh) dy -= h; else if (dy < -hh) dy += h;
          const d2 = dx*dx + dy*dy;
          if (d2 > R2 || d2 === 0) continue;
          if (useF && (dx*vxi + dy*vyi) < cosF*Math.sqrt(d2)*sp) continue;   // behind me: unseen
          cnt++; ax += vx[j]; ay += vy[j]; cx += dx; cy += dy;
          if (d2 < S2){ sx -= dx/d2; sy -= dy/d2; scnt++; }
          if (dbgN) dbgN.push(j);
        }
      }
    }
    let fx = 0, fy = 0, s;
    const dS = [0,0], dA = [0,0], dC = [0,0];
    if (scnt && wS){ s = steer(sx, sy, vxi, vyi, maxS, maxF); dS[0] = s[0]*wS; dS[1] = s[1]*wS; }
    if (cnt){
      if (wA){ s = steer(ax, ay, vxi, vyi, maxS, maxF); dA[0] = s[0]*wA; dA[1] = s[1]*wA; }
      if (wC){ s = steer(cx, cy, vxi, vyi, maxS, maxF); dC[0] = s[0]*wC; dC[1] = s[1]*wC; }
    }
    fx = dS[0] + dA[0] + dC[0]; fy = dS[1] + dA[1] + dC[1];
    if (ext && ext.hawk){
      let dx = xi-ext.hx; if (dx > hw) dx -= w; else if (dx < -hw) dx += w;
      let dy = yi-ext.hy; if (dy > hh) dy -= h; else if (dy < -hh) dy += h;
      const d2 = dx*dx + dy*dy;
      if (d2 < HAWK_R2){ s = steer(dx, dy, vxi, vyi, maxS*1.6, maxF*5); const k = 1 - Math.sqrt(d2)/HAWK_R; fx += s[0]*k*1.5; fy += s[1]*k*1.5; }
    }
    if (ext && ext.lure){
      // pulled toward a ring around the lure and nudged along it → the flock turns into a mill
      let dx = ext.lx-xi; if (dx > hw) dx -= w; else if (dx < -hw) dx += w;
      let dy = ext.ly-yi; if (dy > hh) dy -= h; else if (dy < -hh) dy += h;
      const d = Math.hypot(dx, dy) || 1e-6, rx = dx/d, ry = dy/d;
      const kr = Math.max(-1, Math.min(1, (d - LURE_R)/LURE_R));
      // ext.lurePull (scroll LP only, off in the app): head straight for the lure instead → a clump, not a mill
      s = ext.lurePull ? steer(rx, ry, vxi, vyi, maxS, maxF) : steer(rx*kr*1.4 - ry, ry*kr*1.4 + rx, vxi, vyi, maxS, maxF); fx += s[0]*1.2; fy += s[1]*1.2;
    }
    let nx = vxi + fx, ny = vyi + fy;
    if (P.noise){
      const a = (rnd()*2-1)*Math.PI*P.noise, c = Math.cos(a), sn = Math.sin(a);
      const tx = nx*c - ny*sn; ny = nx*sn + ny*c; nx = tx;
    }
    const m = Math.hypot(nx, ny) || 1e-6;
    if (m > maxS){ nx *= maxS/m; ny *= maxS/m; } else if (m < minS){ nx *= minS/m; ny *= minS/m; }
    nvx[i] = nx; nvy[i] = ny; nb[i] = cnt > 255 ? 255 : cnt;
    if (dbgN) F.dbg = { nbrs:dbgN, sep:dS, ali:dA, coh:dC };
  }
  for (let i=0; i<n; i++){
    vx[i] = nvx[i]; vy[i] = nvy[i];
    let px = x[i] + vx[i], py = y[i] + vy[i];
    if (px < 0) px += w; else if (px >= w) px -= w;
    if (py < 0) py += h; else if (py >= h) py -= h;
    x[i] = px; y[i] = py;
  }
  F.steps++;
}
/* order parameter Φ = |mean heading| — 0 for a gas, 1 when everyone flies the same way */
function polarization(F){
  let sx = 0, sy = 0;
  for (let i=0; i<F.n; i++){ const m = Math.hypot(F.vx[i], F.vy[i]) || 1; sx += F.vx[i]/m; sy += F.vy[i]/m; }
  return F.n ? Math.hypot(sx, sy)/F.n : 0;
}
/* mill Ω = mean signed rotation around a point — ±1 when everyone circles it the same way.
   A mill has Φ≈0 (headings cancel) yet it is the opposite of a gas. */
function rotation(F, cx, cy){
  let s = 0; const w = F.w, h = F.h;
  for (let i=0; i<F.n; i++){
    let dx = F.x[i]-cx; if (dx > w/2) dx -= w; else if (dx < -w/2) dx += w;
    let dy = F.y[i]-cy; if (dy > h/2) dy -= h; else if (dy < -h/2) dy += h;
    const d = Math.hypot(dx, dy) || 1, v = Math.hypot(F.vx[i], F.vy[i]) || 1;
    s += (dx*F.vy[i] - dy*F.vx[i])/(d*v);
  }
  return F.n ? s/F.n : 0;
}
/* flocks = connected groups of boids within view of each other (union-find over the grid) */
function countFlocks(F, R, minSize){
  buildGrid(F, R);
  const n = F.n, par = new Int32Array(n), w = F.w, h = F.h, hw = w/2, hh = h/2, R2 = R*R;
  for (let i=0; i<n; i++) par[i] = i;
  const find = a => { while (par[a] !== a){ par[a] = par[par[a]]; a = par[a]; } return a; };
  for (let i=0; i<n; i++){
    let ci = (F.x[i]/F.cw)|0, cj = (F.y[i]/F.ch)|0; if (ci >= F.gx) ci = F.gx-1; if (cj >= F.gy) cj = F.gy-1;
    for (let oy=-1; oy<=1; oy++){
      const ry = (cj+oy+F.gy) % F.gy;
      for (let ox=-1; ox<=1; ox++){
        const rx = (ci+ox+F.gx) % F.gx;
        for (let j = F.head[ry*F.gx + rx]; j !== -1; j = F.next[j]){
          if (j <= i) continue;
          let dx = F.x[j]-F.x[i]; if (dx > hw) dx -= w; else if (dx < -hw) dx += w;
          let dy = F.y[j]-F.y[i]; if (dy > hh) dy -= h; else if (dy < -hh) dy += h;
          if (dx*dx + dy*dy <= R2){ const a = find(i), b = find(j); if (a !== b) par[a] = b; }
        }
      }
    }
  }
  const size = new Int32Array(n);
  for (let i=0; i<n; i++) size[find(i)]++;
  let k = 0; for (let i=0; i<n; i++) if (size[i] >= minSize) k++;
  return k;
}
/* six behaviours — the same three rules, only the numbers differ */
const BEHAVIORS = [
  { name:'MURMURATION', jp:'ムクドリの大群',       p:{ wSep:1.5, wAli:1.0, wCoh:0.8, view:42,  fov:270, sep:16, speed:3.0, noise:0.05 } },
  { name:'SCHOOL',      jp:'イワシの群れ',         p:{ wSep:1.8, wAli:2.2, wCoh:0.6, view:34,  fov:300, sep:11, speed:2.4, noise:0.02 } },
  { name:'GNATS',       jp:'蚊柱（向きがない）',   p:{ wSep:0.8, wAli:0.0, wCoh:1.6, view:60,  fov:360, sep:8,  speed:2.6, noise:0.35 } },
  { name:'STREAMS',     jp:'川のような列',         p:{ wSep:1.2, wAli:2.6, wCoh:0.1, view:30,  fov:200, sep:12, speed:3.4, noise:0.03 } },
  { name:'BAIT BALL',   jp:'固く丸まる',           p:{ wSep:1.6, wAli:0.4, wCoh:1.4, view:90,  fov:360, sep:14, speed:2.2, noise:0.04 } },
  { name:'GAS',         jp:'ルールなし＝ただの粒', p:{ wSep:0.0, wAli:0.0, wCoh:0.0, view:42,  fov:270, sep:16, speed:3.0, noise:0.15 } },
];
function makeRng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/*SIM-END*/
