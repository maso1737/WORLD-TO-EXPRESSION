"use strict";
/* EE-01 BIFURCATION WALK — the law, shared by 01_bifurcation_walk.html and scroll/SCROLL_BIFURCATION_LP.html (2026-11-04).
   01 had no SIM block, so this file gathers the app's math as it was (same numbers, same loops):
   logistic map · period detector of the hero particle · Lyapunov term · one column of the bifurcation map · Feigenbaum marks.
   makeRng is new: the app's particles use Math.random; the LP needs reproducible seeds.
   Classic script: top-level names are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11)) */
/*SIM-BEGIN — pure math (no DOM). */
const R_MIN = 2.5, R_MAX = 4.0;
/* the whole rule: x_{n+1} = r·x_n·(1 − x_n) */
function logistic(r, x){ return r * x * (1 - x); }
/* hero period: the smallest p ≤ 32 for which the last 3p values repeat within 1e-4 (0 = none → chaos/edge) */
function detectPeriodOf(hist){
  const n = hist.length;
  for (let p=1; p<=32; p++){
    if (n < 3*p+1) break;
    let ok = true;
    for (let k=1; k<=3*p; k++){
      if (Math.abs(hist[n-k] - hist[n-k-p]) > 1e-4){ ok=false; break; }
    }
    if (ok) return p;
  }
  return 0;
}
/* one term of the Lyapunov average: ln|f'(x)| = ln|r(1 − 2x)| */
function lyapTerm(r, x){ return Math.log(Math.abs(r*(1-2*x)) + 1e-12); }
/* one column of the map: from x 0.31, 300 warm-up steps, then 200 visits binned into MH rows (row 0 = x 1) */
function mapCounts(r, MH, counts){
  counts = counts || new Uint16Array(MH); counts.fill(0);
  let x = 0.31;
  for (let i=0;i<300;i++) x = r*x*(1-x);
  let maxc = 1;
  for (let i=0;i<200;i++){
    x = r*x*(1-x);
    let yi = ((1-x)*MH)|0; if (yi<0)yi=0; else if(yi>=MH)yi=MH-1;
    counts[yi]++; if (counts[yi]>maxc) maxc=counts[yi];
  }
  return counts;
}
/* period-doubling points (r₁…r∞) and the period-3 window 1+√8 */
const FEIG = [
  {r:3.0,     l:'r₁'}, {r:3.44949, l:'r₂'}, {r:3.54409, l:'r₃'},
  {r:3.56441, l:'r₄'}, {r:3.569946,l:'r∞'}
];
const WINDOW3 = 3.8284;
function makeRng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/*SIM-END*/
