/* Reproducible offline Gray–Scott snapshot builder. node tools/generate-patterns.cjs */
const fs=require('node:fs'),path=require('node:path');
const n=96,milestones=[0,40,100,180,280,400,550,700,850,1000,1200,1500,1800,2200,2600,3000,3400,4000];
// Retain every original integrated state; subdivide the faster early evolution
// six ways and later intervals five ways. All 96 entries are integer steps.
const steps=[0];
for(let i=1;i<milestones.length;i++){
  const divisions=i<=10?6:5;
  for(let j=1;j<=divisions;j++)steps.push(Math.round(milestones[i-1]+(milestones[i]-milestones[i-1])*j/divisions));
}
let a=new Float64Array(n*n).fill(1),b=new Float64Array(n*n),na=new Float64Array(n*n),nb=new Float64Array(n*n);
const angle=Math.PI*(3-Math.sqrt(5));
for(let i=0;i<19;i++){
  const r=32*Math.sqrt(i/18),cx=Math.round(n/2+Math.cos(i*angle)*r),cy=Math.round(n/2+Math.sin(i*angle)*r);
  for(let y=-4;y<4;y++)for(let x=-4;x<4;x++){const j=((cy+y+n)%n)*n+(cx+x+n)%n;b[j]=1;}
}
const frames=[],coverage=[];
for(let step=0;step<=4000;step++){
  if(steps.includes(step)){const packed=Buffer.alloc(n*n/8);let active=0;for(let j=0;j<b.length;j++)if(b[j]>.18){packed[j>>3]|=1<<(j&7);active++;}frames.push(packed.toString('base64'));coverage.push(active);}
  if(step===4000)break;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=y*n+x,l=y*n+(x+n-1)%n,r=y*n+(x+1)%n,u=((y+n-1)%n)*n,d=((y+1)%n)*n;
    const lap=v=>-v[i]+.2*(v[l]+v[r]+v[u+x]+v[d+x])+.05*(v[u+(x+n-1)%n]+v[u+(x+1)%n]+v[d+(x+n-1)%n]+v[d+(x+1)%n]);
    const reaction=a[i]*b[i]*b[i];na[i]=Math.max(0,Math.min(1,a[i]+lap(a)-reaction+.0545*(1-a[i])));nb[i]=Math.max(0,Math.min(1,b[i]+.5*lap(b)+reaction-(.062+.0545)*b[i]));
  }
  [a,na]=[na,a];[b,nb]=[nb,b];
}
if(coverage.some(n=>n===0)||new Set(frames).size<10)throw new Error('Reaction field died out or failed to evolve');
const file=path.join(__dirname,'../js/patterns.js');let text=fs.readFileSync(file,'utf8');
if(process.argv.includes('--verify')){
  const assert=require('node:assert/strict');
  assert.deepEqual(JSON.parse(text.match(/const reactionSteps = (\[.*\]);/)[1]),steps);
  assert.deepEqual(JSON.parse(text.match(/const reactionData = (\[.*\]);/)[1]),frames);
  const previous=fs.readFileSync(path.resolve(__dirname,'../../90_Log/backups/2026-10-21-motion-brushup/js/patterns.js'),'utf8');
  const oldData=JSON.parse(previous.match(/const reactionData = (\[.*\]);/)[1]);
  milestones.forEach((step,i)=>assert.equal(frames[steps.indexOf(step)],oldData[i]));
  const report={generated:new Date().toISOString(),model:'Gray-Scott',frames:frames.length,bitExactRegeneration:true,originalStatesPreserved:milestones.length,packedBytes:frames.length*n*n/8,coverage};
  const folder=path.resolve(__dirname,'../verification/motion-20261021');fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'reaction-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));process.exit(0);
}
text=text.replace(/const reactionSteps = \[[\s\S]*?\];/,'const reactionSteps = '+JSON.stringify(steps)+';')
  .replace(/const reactionData = \[[\s\S]*?\];/,'const reactionData = '+JSON.stringify(frames)+';').replace(/\r\n/g,'\n');fs.writeFileSync(file,text);
console.log(JSON.stringify({model:'Gray–Scott',size:n,steps:steps,frames:frames.length,coverage,packedBytes:frames.length*n*n/8}));
