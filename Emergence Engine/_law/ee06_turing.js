"use strict";
/* EE-06 TURING — the law, shared by 06_turing.html and scroll/SCROLL_TURING_LP.html (2026-11-04: moved out of the HTML verbatim).
   SIM block = the Gray-Scott math (CPU version, used by Node checks) + VS / FS_STEP = the same step as a WebGL2 shader (what the app runs).
   Classic script: top-level names (SPECIES, seedChem, grayScottStepCPU, VS, FS_STEP, …) are globals for the page that loads it.
   Node: vm.runInThisContext(src.slice(src.indexOf('/*SIM-BEGIN'), src.indexOf('/*SIM-END*'+'/')+11)) */
/*SIM-BEGIN — pure Gray-Scott math. RG = U,V; toroidal 9-point Laplacian, dt=1. */
const SPECIES = [
  {name:'MITOSIS',jp:'分裂する細胞',F:0.0367,k:0.0649,seed:'central'},
  {name:'SPOTS',jp:'ヒョウの斑点',F:0.030,k:0.062,seed:'scatter'},
  {name:'CORAL',jp:'伸びる珊瑚',F:0.0545,k:0.062,seed:'central'},
  {name:'MAZE',jp:'シマウマの迷路',F:0.029,k:0.057,seed:'scatter'},
  {name:'CHAOS',jp:'沸きつづける波',F:0.026,k:0.051,seed:'scatter'},
  {name:'U-SKATE',jp:'すべる粒',F:0.062,k:0.0609,seed:'scatter'},
  {name:'ATLAS',jp:'世界全体が地図になる',F:0.0367,k:0.0649,seed:'scatter',atlas:true}
];
const clamp = (v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
function makeRng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function emptyChem(w,h){ const a=new Float32Array(w*h*2); for(let i=0;i<a.length;i+=2)a[i]=1; return a; }
function seedSquare(a,w,h,cx,cy,size,rnd){
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(((Math.floor(cy-size/2)+y+h)%h)*w+(Math.floor(cx-size/2)+x+w)%w)*2;
    a[i]=0.5+(rnd()-.5)*.02; a[i+1]=0.25+(rnd()-.5)*.02;
  }
}
function seedChem(w,h,kind,rnd,one=false){
  const a=emptyChem(w,h), central=kind==='central';
  const n=one?1:central?3:Math.max(20,Math.round(w*h/180));
  for(let i=0;i<n;i++){
    const x=central?w*(.43+.14*rnd()):rnd()*w, y=central?h*(.43+.14*rnd()):rnd()*h;
    // 8 cells: measured on GPU — CORAL dies from a 6-cell drop, MITOSIS dies from a 14-cell one; 8 lets all of them start.
    seedSquare(a,w,h,x,y,8,rnd);
  }
  return a;
}
function grayScottStepCPU(a,w,h,F,k,atlas=false,b=new Float32Array(a.length)){
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*2, u=a[i],v=a[i+1]; let lu=-u,lv=-v;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const j=(((y+dy+h)%h)*w+(x+dx+w)%w)*2, weight=dx&&dy?.05:.2;
      lu+=weight*a[j]; lv+=weight*a[j+1];
    }
    const f=atlas?.09*(1-y/(h-1)):F, kill=atlas?.045+.025*x/(w-1):k, reaction=u*v*v;
    b[i]=clamp(u+lu-reaction+f*(1-u)); b[i+1]=clamp(v+.5*lv+reaction-(f+kill)*v);
  }
  return b;
}
/*SIM-END*/
/* the step the app actually runs on the GPU: RG = U,V, 9-point Laplacian, Du=1 Dv=.5, dt=1 (uRun 0 = brush only) */
const VS=`#version 300 es
in vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;
const FS_STEP=`#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uA; uniform ivec2 uSize; uniform float uF,uK,uAtlas,uRun,uSeed,uPulse; uniform vec4 uBrush;
out vec4 o;
vec2 at(ivec2 c){return texelFetch(uA,(c+uSize)%uSize,0).rg;}
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32+uSeed);return fract(p.x*p.y);}
void main(){
  ivec2 c=ivec2(gl_FragCoord.xy);vec2 a=at(c),lap=-a;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)if(x!=0||y!=0)lap+=at(c+ivec2(x,y))*((x!=0&&y!=0)?.05:.2);
  vec2 pos=vec2(c)/vec2(uSize-1);
  float F=uAtlas>.5?clamp(.09*(1.-pos.y)+uPulse,0.,.09):uF,k=uAtlas>.5?.045+.025*pos.x:uK,r=a.x*a.y*a.y;
  vec2 b=clamp(a+uRun*vec2(lap.x-r+F*(1.-a.x),.5*lap.y+r-(F+k)*a.y),0.,1.);
  if(uBrush.w!=0.){vec2 d=vec2(c)-uBrush.xy,S=vec2(uSize);d-=S*floor(d/S+.5);if(length(d)<=uBrush.z)b=uBrush.w>0.?vec2(.5,.25+.25*hash(vec2(c))):vec2(1.,0.);}
  o=vec4(b,b.x*b.y*b.y,1.);
}`;
