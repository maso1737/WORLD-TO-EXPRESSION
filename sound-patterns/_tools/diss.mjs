// Sethares (1993) dissonance of two complex tones; amplitudes multiplied (a1*a2)
const d=(f1,f2,a1,a2)=>{const fmin=Math.min(f1,f2),df=Math.abs(f2-f1),s=0.24/(0.0207*fmin+18.96);return a1*a2*(Math.exp(-3.51*s*df)-Math.exp(-5.75*s*df));};
const tone=(f,amps)=>amps.map((a,i)=>[f*(i+1),a]);
const D=(f,r,amps)=>{const p=[...tone(f,amps),...tone(f*r,amps)];let s=0;for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)s+=d(p[i][0],p[j][0],p[i][1],p[j][1]);return s;};
const R=[['1/1',1],['16/15',16/15],['9/8',9/8],['6/5',6/5],['5/4',5/4],['4/3',4/3],['45/32',45/32],['3/2',3/2],['8/5',8/5],['5/3',5/3],['16/9',16/9],['15/8',15/8],['2/1',2]];
const T={sine:[1],sl02:[1,.25,.08],rich:[1,.5,.33,.25,.2,.17]};
for(const f of [220]){console.log('f0',f,'ratio',Object.keys(T).join('  '));
 for(const [n,r] of R)console.log(n.padEnd(6),Object.values(T).map(a=>{const base=D(f,1.02,a);return (D(f,r,a)/base).toFixed(2).padStart(5)}).join('  '));}
// slope near just ratios: dissonance at +14 cents (ET major third)
for(const [k,a] of Object.entries(T)){const j=D(220,1.25,a),e=D(220,2**(4/12),a);console.log(k,'M3 just',j.toFixed(4),'ET',e.toFixed(4));}
// valley depth: min around ratio vs neighbors ±40 cents
for(const [k,a] of Object.entries(T)){const out=[];for(const [n,r] of R.slice(3,8)){const c=D(220,r,a),nb=(D(220,r*2**(40/1200),a)+D(220,r*2**(-40/1200),a))/2;out.push(n+':'+(nb>0?(c/nb).toFixed(2):'-'));}console.log(k,'valley(center/±40c)',out.join(' '));}
console.log('--- register check, sl02 / rich: ratio = D(r)/D(1.02)');
for(const f of [110,220,440,880]){const row=[];for(const [n,r] of [['6/5',1.2],['5/4',1.25],['4/3',4/3],['45/32',45/32],['3/2',1.5]])row.push(n+' '+(D(f,r,T.sl02)/D(f,1.02,T.sl02)).toFixed(2)+'/'+(D(f,r,T.rich)/D(f,1.02,T.rich)).toFixed(2));console.log(f,row.join('  '));}
