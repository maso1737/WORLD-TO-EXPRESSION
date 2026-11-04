"use strict";
/* EE-05 LENIA — the law, shared by 05_lenia.html and scroll/SCROLL_LENIA_LP.html (2026-11-04: moved out of the HTML verbatim).
   SIM block = the Lenia math (CPU version, used by Node checks) + SPECIES + VS / FS_STEP = the same step as a WebGL2 shader (what the app runs).
   makeRng is new here: the app's mulberry32 rnd() as a seedable factory, for reproducible records.
   Classic script: top-level names are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11)) */
/*SIM-BEGIN — pure Lenia math (no DOM). Node-verifiable: extract between the markers.
  The GPU shader below does the same arithmetic; leniaStepCPU is the reference it is checked against. */

/* kernel K(r): B concentric rings, each a smooth bump exp(4 − 1/(f(1−f))), peak height β_k; normalised to sum 1.
   Stored sparse as (dx, dy, w) — only the taps that matter. */
function buildKernel(R, beta){
  const taps = []; let sum = 0;
  for (let dy=-R; dy<=R; dy++) for (let dx=-R; dx<=R; dx++){
    const r = Math.hypot(dx, dy)/R; if (r >= 1) continue;
    const Br = r*beta.length, k = Math.min(beta.length-1, Math.floor(Br)), f = Br - k;
    const v = (f > 0 && f < 1) ? beta[k]*Math.exp(4 - 1/(f*(1-f))) : 0;
    if (v < 1e-5) continue;
    taps.push([dx, dy, v]); sum += v;
  }
  for (const t of taps) t[2] /= sum;
  return taps;
}
/* the radial profile, for the LOOK picture */
function kernelProfile(r, beta){
  if (r >= 1 || r <= 0) return 0;
  const Br = r*beta.length, k = Math.min(beta.length-1, Math.floor(Br)), f = Br - k;
  return (f > 0 && f < 1) ? beta[k]*Math.exp(4 - 1/(f*(1-f))) : 0;
}
/* growth G(u): +1 when the neighbourhood is exactly as crowded as it likes (μ), −1 far from it */
function growth(u, mu, sigma){ const d = (u-mu)/sigma; return 2*Math.exp(-0.5*d*d) - 1; }

/* one synchronous step on the torus — A is a Float32Array of densities, returns the new array */
function leniaStepCPU(A, w, h, taps, mu, sigma, dt){
  const B = new Float32Array(w*h);
  for (let y=0; y<h; y++) for (let x=0; x<w; x++){
    let u = 0;
    for (const [dx, dy, k] of taps) u += k*A[((y+dy+h)%h)*w + (x+dx+w)%w];
    const v = A[y*w+x] + dt*growth(u, mu, sigma);
    B[y*w+x] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return B;
}

/* Orbium — Lenia's best-known creature (Chan 2019): a 20×20 snapshot. It is not drawn, it was found:
   with R 13 · μ 0.15 · σ 0.015 · dt 0.1 it keeps its own shape and swims (measured: mass 71 for 800 steps). */
const ORBIUM = [
 [0,0,0,0,0,0,0.1,0.14,0.1,0,0,0.03,0.03,0,0,0.3,0,0,0,0],[0,0,0,0,0,0.08,0.24,0.3,0.3,0.18,0.14,0.15,0.16,0.15,0.09,0.2,0,0,0,0],
 [0,0,0,0,0,0.15,0.34,0.44,0.46,0.38,0.18,0.14,0.11,0.13,0.19,0.18,0.45,0,0,0],[0,0,0,0,0.06,0.13,0.39,0.5,0.5,0.37,0.06,0,0,0,0.02,0.16,0.68,0,0,0],
 [0,0,0,0.11,0.17,0.17,0.33,0.4,0.38,0.28,0.14,0,0,0,0,0,0.18,0.42,0,0],[0,0,0.09,0.18,0.13,0.06,0.08,0.26,0.32,0.32,0.27,0,0,0,0,0,0,0.82,0,0],
 [0.27,0,0.16,0.12,0,0,0,0.25,0.38,0.44,0.45,0.34,0,0,0,0,0,0.22,0.17,0],[0,0.07,0.2,0.02,0,0,0,0.31,0.48,0.57,0.6,0.57,0,0,0,0,0,0,0.49,0],
 [0,0.59,0.19,0,0,0,0,0.2,0.57,0.69,0.76,0.76,0.49,0,0,0,0,0,0.36,0],[0,0.58,0.19,0,0,0,0,0,0.67,0.83,0.9,0.92,0.87,0.12,0,0,0,0,0.22,0.07],
 [0,0,0.46,0,0,0,0,0,0.7,0.93,1,1,1,0.61,0,0,0,0,0.18,0.11],[0,0,0.82,0,0,0,0,0,0.47,1,1,0.98,1,0.96,0.27,0,0,0,0.19,0.1],
 [0,0,0.46,0,0,0,0,0,0.25,1,1,0.84,0.92,0.97,0.54,0.14,0.04,0.1,0.21,0.05],[0,0,0,0.4,0,0,0,0,0.09,0.8,1,0.82,0.8,0.85,0.63,0.31,0.18,0.19,0.2,0.01],
 [0,0,0,0.36,0.1,0,0,0,0.05,0.54,0.86,0.79,0.74,0.72,0.6,0.39,0.28,0.24,0.13,0],[0,0,0,0.01,0.3,0.07,0,0,0.08,0.36,0.64,0.7,0.64,0.6,0.51,0.39,0.29,0.19,0.04,0],
 [0,0,0,0,0.1,0.24,0.14,0.1,0.15,0.29,0.45,0.53,0.52,0.46,0.4,0.31,0.21,0.08,0,0],[0,0,0,0,0,0.08,0.21,0.21,0.22,0.29,0.36,0.39,0.37,0.33,0.26,0.18,0.09,0,0,0],
 [0,0,0,0,0,0,0.03,0.13,0.19,0.22,0.24,0.24,0.23,0.18,0.13,0.05,0,0,0,0],[0,0,0,0,0,0,0,0,0.02,0.06,0.08,0.09,0.07,0.05,0.01,0,0,0,0,0]];

/* stamp a pattern into A (max-blend) in one of 8 orientations (o: bit0 mirror x, bit1 mirror y, bit2 transpose),
   scaled so it matches radius R (the pattern was made at R 13). Only quarter turns and mirrors:
   at R 13 that copies the cells exactly — a freely rotated (resampled) Orbium dies at σ 0.014 (measured). */
function stamp(A, w, h, pat, cx, cy, o, R){
  const n = pat.length, s = R/13, half = Math.ceil(n*s/2);
  for (let y=-half; y<half; y++) for (let x=-half; x<half; x++){
    let px = x/s + n/2, py = y/s + n/2;
    if (o & 4){ const t = px; px = py; py = t; }
    if (o & 1) px = n-1 - px;
    if (o & 2) py = n-1 - py;
    if (px < 0 || py < 0 || px > n-1 || py > n-1) continue;
    const ix = Math.floor(px), iy = Math.floor(py), fx = px-ix, fy = py-iy, ix1 = Math.min(n-1, ix+1), iy1 = Math.min(n-1, iy+1);
    const v = (pat[iy][ix]*(1-fx) + pat[iy][ix1]*fx)*(1-fy) + (pat[iy1][ix]*(1-fx) + pat[iy1][ix1]*fx)*fy;
    const i = ((cy+y+h*4)%h)*w + (cx+x+w*4)%w;
    if (v > A[i]) A[i] = v;
  }
}
/* soup: square patches of uniform noise (the usual Lenia "primordial soup") */
function soup(A, w, h, rnd, patches, size, density){
  for (let p=0; p<patches; p++){
    const cx = Math.floor(rnd()*w), cy = Math.floor(rnd()*h);
    for (let y=0; y<size; y++) for (let x=0; x<size; x++){
      const i = ((cy+y)%h)*w + (cx+x)%w;
      A[i] = Math.max(A[i], rnd() < density ? rnd() : 0);
    }
  }
}
/* creatures = connected blobs of A > 0.1 at least minSize cells; returns [{n, x, y}] (centroid in cells) */
function findBlobs(A, w, h, minSize){
  const seen = new Uint8Array(w*h), out = [], st = new Int32Array(w*h);
  for (let i0=0; i0<w*h; i0++){
    if (seen[i0] || A[i0] < 0.1) continue;
    let top = 0, n = 0, sx = 0, sy = 0; st[top++] = i0; seen[i0] = 1;
    const x0 = i0 % w, y0 = (i0/w)|0;
    while (top){
      const j = st[--top], x = j % w, y = (j/w)|0; n++;
      let dx = x - x0; if (dx > w/2) dx -= w; else if (dx < -w/2) dx += w;     // unwrap around the seed cell
      let dy = y - y0; if (dy > h/2) dy -= h; else if (dy < -h/2) dy += h;
      sx += dx; sy += dy;
      const nb = [y*w + (x+1)%w, y*w + (x-1+w)%w, ((y+1)%h)*w + x, ((y-1+h)%h)*w + x];
      for (const k of nb) if (!seen[k] && A[k] >= 0.1){ seen[k] = 1; st[top++] = k; }
    }
    if (n >= minSize) out.push({ n, x:(x0 + sx/n + w) % w, y:(y0 + sy/n + h) % h });
  }
  return out;
}
/* six species — the same three lines of rule, only the numbers (and how the world begins) differ */
const SPECIES = [
  { name:'ORBIUM',  jp:'泳ぐ生きもの',         p:{ R:13, beta:[1],           mu:0.15, sigma:0.015, dt:0.1, seed:'orbium' } },
  { name:'TISSUE',  jp:'迷路の組織',           p:{ R:13, beta:[1],           mu:0.15, sigma:0.017, dt:0.1, seed:'soup' } },
  { name:'FROTH',   jp:'沸きつづける細胞',     p:{ R:13, beta:[0.5,1],       mu:0.15, sigma:0.02,  dt:0.1, seed:'soup' } },
  { name:'CRYSTAL', jp:'並んで止まる泡',       p:{ R:13, beta:[1,0.5],       mu:0.2,  sigma:0.03,  dt:0.1, seed:'soup' } },
  { name:'CORAL',   jp:'三重の輪の珊瑚',       p:{ R:18, beta:[0.5,1,0.667], mu:0.26, sigma:0.036, dt:0.1, seed:'soup' } },
  { name:'CONWAY',  jp:'祖先＝ライフゲーム',   p:{ R:13, beta:[1],           mu:0.15, sigma:0.015, dt:0.1, seed:'conway', conway:true } },
];
/* mulberry32 — the same generator as the app's rnd(), seedable */
function makeRng(seed){ let s = seed>>>0; return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/*SIM-END*/

/* GPU — ping-pong RGBA32F state: r = density A, g = growth G(u), b = neighbourhood u */
const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FS_STEP = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uA, uK;
uniform int uN, uMode;
uniform ivec2 uSize;
uniform float uMu, uSig, uDt, uSeed;
uniform vec4 uBrush;              // cell x, cell y, radius, +1 seed / −1 bite / 0 none
out vec4 o;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32+uSeed); return fract(p.x*p.y); }
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  float a = texelFetch(uA, c, 0).r, u = 0., g = 0., a2;
  if (uMode == 0){
    for (int i=0; i<uN; i++){
      vec3 k = texelFetch(uK, ivec2(i & 255, i >> 8), 0).xyz;
      u += k.z * texelFetch(uA, (c + ivec2(k.xy) + uSize) % uSize, 0).r;
    }
    float d = (u - uMu)/uSig;
    g = 2.*exp(-0.5*d*d) - 1.;
    a2 = clamp(a + uDt*g, 0., 1.);
  } else {
    // Conway's Life, the ancestor: count the 8 neighbours, birth on 3, survive on 2–3
    float n = 0.;
    for (int y=-1; y<=1; y++) for (int x=-1; x<=1; x++) if (x != 0 || y != 0) n += step(0.5, texelFetch(uA, (c + ivec2(x,y) + uSize) % uSize, 0).r);
    float alive = step(0.5, a);
    a2 = (n == 3. || (alive > 0.5 && n == 2.)) ? 1. : 0.;
    u = n/8.; g = a2 - alive;
  }
  if (uBrush.w != 0.){
    vec2 d = vec2(c) - uBrush.xy, S = vec2(uSize);
    d -= S*floor(d/S + 0.5);                                         // nearest copy on the torus
    float f = 1. - smoothstep(uBrush.z*0.55, uBrush.z, length(d));
    if (uBrush.w > 0.) a2 = max(a2, uMode == 1 ? step(0.5, f)*step(0.62, hash(vec2(c))) : f*step(0.4, hash(vec2(c))) * hash(vec2(c)+7.1));
    else a2 *= 1. - f;
  }
  o = vec4(a2, g, u, 1.);
}`;
