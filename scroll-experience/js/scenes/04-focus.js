/* FOCUS — area, polarity, counterweight and the space around a single mark. */
(() => {
  const {C,lerp,range,circle,line,label,display,bg,box}=WTE;
  WTE.scenes[4]={render(c,w,h,p,env){
    const {mobile,m,top,bottom,cx,cy,aw,ah}=box(w,h);
    let color=p<.08?C.lime:p<.40?C.yellow:p<.70?C.ink:C.yellow,ink=color===C.ink?C.paper:C.ink;
    bg(c,w,h,color);
    let phase='BUILD',name='SIZE / WEIGHT',source='../cognitive/l2-01-size-weight.html';
    if(p<.40){
      const t=range(p,.08,.32),cols=mobile?4:6,rows=4,unit=Math.min(aw/cols,ah/rows)*.18;
      const merge=range(p,.012,.08),sourceCols=mobile?8:12,sourceRows=96/sourceCols;
      for(let i=0;i<96;i++){
        const a=WTE.groupHandoffPoint(i,w,h),half=cols/2,band=Math.floor((Math.floor(i/2)%6)*half/6);
        const x=i%2?half+band:half-1-band,y=Math.floor(Math.floor(i/sourceCols)*rows/sourceRows);
        const px=m+(x+.5)*aw/cols,py=top+(y+.5)*ah/rows,hero=x===half&&y===1;
        const radius=hero?lerp(unit,Math.min(aw*.28,ah*.34),t):unit*(1-t*.6);
        circle(c,lerp(a.x,px,merge),lerp(a.y,py,merge),lerp(a.r,radius,merge),C.ink);
      }
      if(p<.08)phase='HANDOFF';
      if(p>.15){
        display(c,'LOOK.',m,top+ah*.91,mobile?w*.22:w*.20,C.ink,{maxWidth:aw});
        label(c,'ONE ELEMENT CHANGES THE WHOLE.',m,bottom-3,C.ink,mobile?8:10);
      }
      if(env.proof)label(c,p<.08?'SAME 96 DOTS / THE CENTER STAYS EMPTY':'ONLY ONE RADIUS INCREASES / AREA = πr²',m,top+14,C.ink,mobile?8:10);
    }else if(p<.70){
      name='CONTRAST / SPACE';source='../cognitive/l2-06-negative-space.html';phase='RELEASE';
      const t=range(p,.40,.54),space=range(p,.54,.66);
      const px=mobile?cx:w*.72,py=mobile?cy:top+ah*.45;
      for(let i=0;i<30;i++){
        const a=i*2.4,rr=lerp(50+(i%6)*19,Math.max(w,h)*1.3,space);
        circle(c,px+Math.cos(a)*rr,py+Math.sin(a)*rr,3,'#565654');
      }
      circle(c,px,py,lerp(Math.min(aw*.28,ah*.34),6,t),C.yellow);
      if(space<.7){display(c,'HERE.',m,top+ah*.93,mobile?w*.22:w*.20,C.paper,{maxWidth:aw});}
      else {label(c,'NOTHING ELSE.',m,top+16,C.paper,mobile?9:11);label(c,'MORE SPACE. MORE PRESENCE.',m,bottom-14,C.paper,mobile?8:10);}
      if(env.proof)label(c,'THE YELLOW MARK STAYS IN PLACE / CONTEXT RETREATS',m,bottom+6,C.paper,mobile?7:9);
    }else if(p<.93){
      name='ASYMMETRIC BALANCE';source='../cognitive/l2-05-balance.html';phase='REVEAL';
      const t=range(p,.70,.78),fs=mobile?w*1.03:Math.min(w*.63,ah*1.13);
      c.save();c.beginPath();c.rect(0,top-22,w,bottom-top+38);c.clip();
      let numberY=top+ah*.94;
      if(mobile){
        // Keep an upper yellow field even on shorter phones, without shrinking 01.
        c.font=`900 ${fs}px "Arial Black",Arial,sans-serif`;
        numberY=Math.max(numberY,top+166+c.measureText('01').actualBoundingBoxAscent);
      }
      display(c,'01',lerp(-w,w*(mobile?-.11:-.04),t),numberY,fs,C.ink,{maxWidth:mobile?w*.94:w*.82});c.restore();
      const x=mobile?w*.59:w*.65,y=mobile?top+ah*.10:top+ah*.12;
      display(c,'DIRECT',x,y+24,mobile?28:44,C.ink,{maxWidth:w-x-m});
      display(c,'THE EYE.',x,y+(mobile?51:66),mobile?28:44,C.ink,{maxWidth:w-x-m});
      const lx=mobile?m+9:w*.73,ly=mobile?top+112:top+ah*.64;
      line(c,lx,ly,w-m,mobile?top+148:top+ah*.40,C.ink,1);
      circle(c,lx,ly,mobile?9:12,C.ink);
      label(c,'ATTENTION IS',mobile?m:w*.65,mobile?top+25:bottom-30,C.ink,mobile?9:11);
      label(c,'A COMPOSITION.',mobile?m:w*.65,mobile?top+42:bottom-13,C.ink,mobile?9:11);
      if(env.proof)label(c,'VISUAL BALANCE ≠ MIRROR SYMMETRY',m,top+7,C.ink,mobile?8:10);
    }else{
      const t=range(p,.93,1);color=C.paper;ink=C.ink;bg(c,w,h,color);
      const g=WTE.interpretLayout(w,h),len=Math.min(w*(g.mobile?.52:.34),g.height*.67);
      line(c,lerp(m,g.x-len/2,t),g.y,lerp(w-m,g.x+len/2,t),g.y,C.ink,g.mobile?3:4);
      phase='HANDOFF';
    }
    return {bg:color,ink,accent:color===C.ink?C.yellow:C.ink,phase,kicker:'04 / FOCUS — '+name,caption:'大きさ、コントラスト、余白。視線の行き先は、構図が決める。',source,sourceLabel:name+' / ORIGINAL LAB'};
  }};
})();
