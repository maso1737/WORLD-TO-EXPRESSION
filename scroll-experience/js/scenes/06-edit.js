/* EDIT is the deliberate capstone: automatic seeing becomes a chosen composition. */
(() => {
  const {C,clamp,lerp,range,circle,line,label,display,bg,box}=WTE;
  function emblem(c,x,y,r,build=1){
    if(build===0){circle(c,x,y,3,C.paper);return;}
    circle(c,x,y,r*build,C.yellow);
    c.save();c.beginPath();c.arc(x,y,r*build,0,Math.PI*2);c.clip();
    // Each half uses material generated in EMERGENCE, resolved into one figure.
    c.save();c.beginPath();c.rect(x,y-r,r,r*2);c.clip();
    WTE.patterns.cells.forEach(({polygon})=>{
      c.beginPath();polygon.forEach((a,i)=>{const px=x+a.x*r*build,py=y+a.y*r*build;i?c.lineTo(px,py):c.moveTo(px,py);});c.closePath();c.lineWidth=Math.max(1,r*.004);c.strokeStyle=C.ink;c.stroke();
    });c.restore();
    const points=WTE.patterns.phyllotaxis(233,r*.98);
    points.forEach((a,i)=>{if(a.x<0)circle(c,x+a.x*build,y+a.y*build,Math.max(1.5,r*.009)*build,C.ink);});
    c.strokeStyle=C.ink;c.lineWidth=r*.016;c.beginPath();
    for(let i=0;i<=300;i++){const a=i/300*Math.PI*4.6*build,rr=r*.014*Math.pow(WTE.patterns.phi,a/(Math.PI/2));const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();
    c.restore();
    line(c,x-r*1.13*build,y,x+r*1.13*build,y,C.ink,1);
    line(c,x,y-r*1.13*build,x,y+r*1.13*build,C.ink,1);
    circle(c,x,y,lerp(3,r*.045,build),C.paper);
  }
  function posterLayout(w,h,exportMode=false){
    const portrait=w<h*.84,b=box(w,h);
    const m=w*.055,top=exportMode?h*.10:b.top,bottom=exportMode?h*.91:b.bottom,ah=bottom-top;
    const fs=portrait?Math.min(w*.176,ah*.139):Math.min(w*.133,ah*.255);
    const r=portrait?Math.min(w*.235,ah*.215):Math.min(w*.17,ah*.30);
    const x=portrait?w*.64:w*.80,y=portrait?bottom-r*1.09:top+ah*.57;
    return {portrait,m,top,bottom,ah,fs,r,x,y};
  }
  WTE.drawPoster=function(c,w,h,exportMode=false,showEmblem=true){
    bg(c,w,h,C.paper);
    const {portrait,m,top,bottom,ah,fs,r,x,y}=posterLayout(w,h,exportMode);
    if(exportMode){label(c,'GEN–EX / WORLD TO EXPRESSION',m,h*.045,C.ink,w*.012);label(c,'FROM RULES TO WORLDS.',w-m,h*.045,C.ink,w*.010,'right');line(c,m,h*.06,w-m,h*.06,C.ink,w*.001);}
    ['THE WORLD','IS WHAT','YOU MAKE','OF IT.'].forEach((t,i)=>display(c,t,m-fs*.025,top+fs*.82+i*fs*.89,fs,C.ink,{maxWidth:portrait?w-2*m:w*.56}));
    if(showEmblem)emblem(c,x,y,r);
    if(portrait){
      label(c,'01 — 06',m,y-r*.60,C.ink,w*.025);
      label(c,'RULE',m,y-r*.28,C.ink,w*.025);
      label(c,'FORM',m,y-r*.03,C.ink,w*.025);
      label(c,'MEANING',m,y+r*.22,C.ink,w*.025);
      label(c,'EXPRESSION',m,y+r*.47,C.ink,w*.025);
    }else{
      label(c,'A RULE BECOMES A WORLD.',w-m,top+16,C.ink,10,'right');
      label(c,'137.5078° / 233 SEEDS',w-m,bottom-27,C.ink,10,'right');
      label(c,'AN ACT OF CHOICE.',w-m,bottom-10,C.ink,10,'right');
      // Perspective lines collapse toward the same axis as the final circular form.
      for(let i=0;i<5;i++)line(c,w*.60+i*w*.045,bottom-54,x+r*.30,y+r*.57,'#8B8B85',.7);
    }
    if(exportMode){line(c,m,h*.935,w-m,h*.935,C.ink,w*.001);label(c,'WORLD TO EXPRESSION',m,h*.961,C.ink,w*.012);label(c,'THE WORLD IS WHAT YOU MAKE OF IT.',w-m,h*.961,C.ink,w*.009,'right');}
  };
  WTE.scenes[6]={poster:WTE.drawPoster,render(c,w,h,p,env){
    const {mobile,m,top,bottom,cx,cy,aw,ah}=box(w,h);bg(c,w,h,C.paper);
    const mark=posterLayout(w,h);
    let phase='SUBTRACT',caption='スクロールで取り去る。残る形に、意味が生まれる。';
    if(p<.23){
      WTE.drawInterpretField(c,w,h,1-range(p,0,.22));
      if(p>.06){
        const fs=mobile?w*.15:Math.min(w*.15,ah*.28);
        const t=range(p,.06,.11);c.save();c.beginPath();c.rect(m,cy-fs*1.25,aw*t,fs*2.25);c.clip();
        c.fillStyle=C.paper;c.fillRect(m,cy-fs*1.25,aw,fs*2.25);
        display(c,'YOUR',m,cy-fs*.20,fs,C.ink,{maxWidth:aw});display(c,'TURN.',m,cy+fs*.72,fs,C.ink,{maxWidth:aw});c.restore();
      }
    }else if(p<.40){
      const t=range(p,.23,.36),fs=mobile?w*.15:Math.min(w*.15,ah*.28);
      c.save();c.beginPath();c.rect(m+aw*t,top,aw*(1-t),ah);c.clip();
      display(c,'YOUR',m,cy-fs*.20,fs,C.ink,{maxWidth:aw});display(c,'TURN.',m,cy+fs*.72,fs,C.ink,{maxWidth:aw});c.restore();
      // The last mark arrives at the future emblem before the long still interval.
      const settle=range(p,.23,.40);
      circle(c,lerp(cx,mark.x,settle),lerp(cy,mark.y,settle),3,C.ink);
    }else if(p<.68){
      // Intentional 1.4-screen rest. Scroll changes almost nothing here.
      circle(c,mark.x,mark.y,3,C.ink);phase='RELEASE';caption='何も足さずに、この余白を見る。';
      if(p>.49)label(c,'LESS IS AN ACT OF CREATION.',cx,bottom-22,C.ink,mobile?8:10,'center');
      if(env.proof)label(c,'HOLD THE SPACE / THE MARK DOES NOT MOVE',cx,top+24,C.ink,mobile?7:10,'center');
    }else if(p<.80){
      const t=range(p,.68,.704);bg(c,w,h,C.yellow);
      const fs=mobile?w*.24:Math.min(w*.24,ah*.48);
      c.save();c.beginPath();c.rect(0,0,w*t,h);c.clip();
      display(c,'MAKE',m,cy-fs*.07,fs,C.ink,{maxWidth:aw});display(c,'OF IT.',m,cy+fs*.84,fs,C.ink,{maxWidth:aw});c.restore();
      circle(c,mark.x,mark.y,3,C.paper);
      phase='BREAK';caption='削った先に、次の世界をつくる。';
    }else{
      const t=range(p,.80,.85);
      WTE.drawPoster(c,w,h,false,t===1);
      if(t<1){c.fillStyle=C.yellow;c.fillRect(w*t,0,w*(1-t),h);}
      // The held point constructs the emblem just ahead of the typography wipe.
      // The completed poster/export uses exactly the original full geometry.
      if(t<1)emblem(c,mark.x,mark.y,mark.r,range(p,.80,.842));
      phase=t<1?'RECOMPOSE':'EXPRESSION';caption=t<1?'削った先に、次の世界をつくる。':'次は、ラボでルールを変えてみる。';
      if(env.proof){c.fillStyle=C.paper;c.fillRect(m,bottom-5,Math.min(aw,540),22);label(c,'GOLDEN ANGLE + VORONOI + DENSITY → ONE COMPOSITION',m,bottom+8,C.ink,mobile?6.5:9);}
    }
    return {bg:p>=.68&&p<.80?C.yellow:C.paper,ink:C.ink,accent:C.ink,phase,kicker:'06 / EDIT → EXPRESSION',caption,source:p<.8?'../cognitive/l4-03-whitespace.html':'../index.html',sourceLabel:p<.8?'WHITESPACE / ORIGINAL LAB':'EXPLORE THE INTERACTIVE LAB',finale:p>=.85};
  }};
})();
