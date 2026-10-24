/* THRESHOLD — the same marks become a number, then a material. */
(() => {
  const {C,clamp,lerp,range,circle,line,label,display,bg,box}=WTE;
  let glyph,glyphCanvas,maskedWorld;
  function glyphPoints(){
    if(glyph)return glyph;
    const c=document.createElement('canvas');c.width=700;c.height=190;
    const g=c.getContext('2d',{willReadFrequently:true});
    display(g,'MANY',350,155,188,C.ink,{align:'center',maxWidth:680});glyphCanvas=c;
    const pixels=g.getImageData(0,0,700,190).data;glyph=[];
    for(let y=9;y<174;y+=7)for(let x=9;x<690;x+=7)if(pixels[(y*700+x)*4+3]>180)glyph.push({x:x/700,y:y/190});
    return glyph;
  }
  function letterWorld(){
    if(maskedWorld)return maskedWorld;glyphPoints();
    maskedWorld=document.createElement('canvas');maskedWorld.width=700;maskedWorld.height=190;
    const g=maskedWorld.getContext('2d');g.drawImage(glyphCanvas,0,0);
    g.globalCompositeOperation='source-in';g.fillStyle=C.lime;g.fillRect(0,0,700,190);
    g.globalCompositeOperation='source-atop';
    for(let y=5;y<190;y+=13)for(let x=5;x<700;x+=13)circle(g,x,y,2.2,C.ink);
    g.globalCompositeOperation='source-over';return maskedWorld;
  }
  WTE.gridPoint=(i,w,h)=>{const b=box(w,h),cols=b.mobile?8:12,rows=b.mobile?12:8;return {x:b.m+(i%cols+.5)*b.aw/cols,y:b.top+(Math.floor(i/cols)+.5)*b.ah/rows};};
  function countPoint(i,count,w,b){
    const px=b.mobile?b.cx:w*.76,py=b.mobile?b.top+b.ah*.65:b.cy;
    const radius=b.mobile?Math.min(b.aw*.42,b.ah*.23):Math.min(w*.18,b.ah*.40);
    const a=i*2.399963229728653,r=count<=5?radius*.45:radius*Math.sqrt((i+.5)/count);
    return {x:px+Math.cos(a)*r,y:py+Math.sin(a)*r};
  }
  WTE.scenes[2]={render(c,w,h,p,env){
    const b=box(w,h),{mobile,m,top,bottom,cx,cy,aw,ah}=b;
    let color=p<.045?C.noir:C.paper,ink=p<.045?C.ice:C.ink;
    bg(c,w,h,color);
    let phase='HOLD';
    if(p<.10){
      const t=range(p,0,.1);
      for(let i=0;i<4;i++)circle(c,cx+(i%2-.5)*lerp(80,mobile?85:110,t),lerp(h*.47,cy,t)+(Math.floor(i/2)-.5)*lerp(80,mobile?85:110,t),lerp(3,8,t),ink);
    } else if(p<.49){
      const t=range(p,.10,.49),counts=[4,5,8,16,32,64,144,233],count=counts[Math.min(7,Math.floor(t*8))];
      const n=count<5?'04':count<16?String(count).padStart(2,'0'):'MANY';
      const fs=mobile?w*.25:Math.min(w*.24,ah*.60);
      display(c,n,m-fs*.035,top+fs*.82,fs,C.ink,{maxWidth:mobile?aw:w*.58});
      for(let i=0;i<count;i++){
        const a=countPoint(i,count,w,b);
        circle(c,a.x,a.y,count<8?7:count<64?5:3,C.ink);
      }
      label(c,'WHEN DOES MANY BEGIN?',m,bottom-22,C.ink,mobile?9:11);
      label(c,`${String(count).padStart(3,'0')} MARKS / ONE FIELD`,m,bottom-4,C.ink,mobile?8:10);
      if(env.proof)label(c,mobile?'A TENDENCY, NOT A FIXED 4/5 CLIFF':'SMALL SETS → ESTIMATION / NO UNIVERSAL 4–5 BOUNDARY',m,top+fs+28,C.ink,mobile?8:10);
      phase=count<8?'HOLD':'BUILD';
    } else if(p<.91){
      const points=glyphPoints(),t=range(p,.49,.68),solid=range(p,.72,.83);
      const tw=aw,th=mobile?aw*.40:Math.min(aw*.30,ah*.56),tx=m,ty=cy-th*.42;
      label(c,'QUANTITY BECOMES QUALITY.',m,top+12,C.ink,mobile?9:11);
      if(solid<.99){
        points.forEach((a,i)=>{
          // The 233 counted seeds split into the letter's dots, keeping their
          // actual positions at the threshold instead of resetting the field.
          const seed=countPoint(i%233,233,w,b),split=range(p,.49,.60);
          const radius=lerp(i<233?3:0,mobile?1.5:2.3,split);
          circle(c,lerp(seed.x,tx+a.x*tw,t),lerp(seed.y,ty+a.y*th,t),lerp(radius,mobile?3.3:5.5,solid),C.ink);
        });
      }else {
        c.drawImage(glyphCanvas,tx,ty,tw,th);
        const reveal=range(p,.84,.90);
        if(reveal>0){c.save();c.beginPath();c.rect(m,ty,aw*reveal,th);c.clip();c.drawImage(letterWorld(),tx,ty,tw,th);c.restore();}
      }
      line(c,m,bottom-45,w-m,bottom-45,C.ink);
      label(c,solid>.5?'NOT A COUNT. A TEXTURE.':t<1?'233 SEEDS → '+points.length+' MARKS':'ONE MARK × '+points.length,m,bottom-24,C.ink,mobile?9:11);
      phase=solid>.5?'REVEAL':'BUILD';
      if(env.proof)label(c,'ONE GLYPH / DENSITY BECOMES A MASK',m,bottom-6,C.ink,mobile?7:9);
    }else{
      const t=range(p,.91,1);color=p>.955?C.lime:C.paper;bg(c,w,h,color);
      const points=glyphPoints(),th=mobile?aw*.40:Math.min(aw*.30,ah*.56),ty=cy-th*.42;
      for(let i=0;i<96;i++){
        const a=WTE.gridPoint(i,w,h),seed=points[Math.floor(i*points.length/96)];
        circle(c,lerp(m+seed.x*aw,a.x,t),lerp(ty+seed.y*th,a.y,t),lerp(3,5,t),C.ink);
      }
      phase='HANDOFF';
    }
    return {bg:color,ink:color===C.noir?C.paper:C.ink,accent:color===C.noir?C.ice:C.ink,phase,kicker:'02 / THRESHOLD',caption:env.proof?'少数の即時把握から量の見積もりへ。境界には個人差・配置・提示条件の影響があります。':'数えていたものが、いつのまにか「模様」になる。',source:'../cognitive/few-many.html',sourceLabel:'FEW / MANY — ORIGINAL LAB'};
  }};
})();
