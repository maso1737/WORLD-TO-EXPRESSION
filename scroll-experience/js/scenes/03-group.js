/* GROUP — proximity, similarity, continuity, closure, common fate, symmetry. */
(() => {
  const {C,lerp,range,circle,label,display,bg,box}=WTE;
  // Shared with FOCUS: the same 96 dots bound an undrawn central axis.
  WTE.groupHandoffPoint=(i,w,h)=>{
    const {cx,aw}=box(w,h),side=i%2?1:-1;
    return {x:cx+side*(aw*.10+(Math.floor(i/2)%6)*aw*.065),y:WTE.gridPoint(i,w,h).y,r:6};
  };
  const arcRadius=({aw,ah})=>Math.min(aw*.35,ah*.34,Math.max(8,(ah-64)/2));
  // Each of the 96 marks owns a fixed piece of one of 25 segments. Those
  // segments in turn own adjacent pieces of four arcs; no boundary swaps IDs.
  function mark(i,w,h,p,b){
    const {mobile,m,top,cx,cy,aw,ah}=b,cols=mobile?8:12;
    const group=range(p,.02,.15),join=range(p,.32,.43),stretch=range(p,.355,.46);
    const bend=range(p,.53,.64),release=range(p,.76,.82),flock=range(p,.79,.86);
    const travel=range(p,.86,.92),split=range(p,.92,1);
    const a=WTE.gridPoint(i,w,h),col=i%cols,row=Math.floor(i/cols);
    const cluster=Math.floor(col/4),within=col%4;
    const dotX=lerp(a.x,m+(cluster+.5)*aw/(cols/4)+(within-1.5)*aw/cols*.43,group);
    const segment=Math.floor(i*25/96),first=Math.ceil(segment*96/25),count=Math.ceil((segment+1)*96/25)-first;
    const u0=(i-first)/count,u1=(i-first+1)/count,um=(u0+u1)/2;
    const sx=m+(segment+.5)*aw/25,sy=top+ah*.65+Math.sin(segment*.24)*ah*.12;
    const angle=lerp(Math.sin(segment*2.3)*2,Math.atan(Math.cos(segment*.24)*ah*.12*.24/(aw/25)),range(p,.37,.49));
    const arc=Math.floor(segment*4/25),arcFirst=Math.ceil(arc*25/4),arcCount=Math.ceil((arc+1)*25/4)-arcFirst;
    const radius=arcRadius(b),gap=lerp(.5,.16,range(p,.60,.69));
    const arcAngle=u=>arc*Math.PI/2+gap+(segment-arcFirst+u)/arcCount*(Math.PI/2-2*gap);
    const mid=arcAngle(um),target=WTE.groupHandoffPoint(i,w,h),rows=96/cols;
    const fx=m+aw*.1+(i%cols+.5)*aw*.7/cols+travel*aw*.12;
    const fy=top+ah*.1+(row+.5)*ah*.7/rows+travel*ah*.05;
    const point=t=>{
      const u=lerp(u0,u1,t),offset=(um-.5+(u-um)*stretch)*aw/33;
      const theta=lerp(arcAngle(u),mid,release);
      let x=lerp(lerp(dotX,sx+Math.cos(angle)*offset,join),cx+Math.cos(theta)*radius,bend);
      let y=lerp(lerp(a.y,sy+Math.sin(angle)*offset,join),cy+Math.sin(theta)*radius,bend);
      x=lerp(x,fx,flock);y=lerp(y,fy,flock);
      return {x:split===1?target.x:lerp(x,target.x,split),y:split===1?target.y:lerp(y,target.y,split)};
    };
    const dotRadius=lerp(5,mobile?5.5:7,group),width=lerp(lerp(dotRadius*2,mobile?3:5,join),mobile?10:Math.min(18,ah*.04),bend);
    const recolor=range(p,.31,.40),white=range(p,.20,.28)>.15&&row%2===0;
    const color=white&&recolor<1?`rgb(${Math.round(lerp(242,10,recolor))},${Math.round(lerp(242,10,recolor))},${Math.round(lerp(239,10,recolor))})`:C.ink;
    return {point,r:lerp(width/2,target.r,release),dot:stretch===0||release===1,color};
  }
  function clipped(c,x,y,w,h,draw){
    if(w<=0||h<=0)return;
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();draw();c.restore();
  }
  WTE.scenes[3]={render(c,w,h,p,env){
    const b=box(w,h),{mobile,m,top,bottom,cx,cy,aw,ah}=b;bg(c,w,h,C.lime);
    const typeChange=range(p,.32,.43),bend=range(p,.53,.64),release=range(p,.76,.82);
    const titleBend=range(p,.53,.60);
    for(let i=0;i<96;i++){
      const q=mark(i,w,h,p,b),start=q.point(0);
      if(q.dot){circle(c,start.x,start.y,q.r,q.color);continue;}
      c.strokeStyle=q.color;c.lineWidth=q.r*2;c.lineCap='round';c.beginPath();c.moveTo(start.x,start.y);
      for(let j=1;j<=4;j++){const next=q.point(j/4);c.lineTo(next.x,next.y);}
      c.stroke();
      // Canvas can discard an almost-zero-length stroke. Keep its round cap
      // explicitly so arc fragments arrive at dots without disappearing first.
      circle(c,start.x,start.y,q.r,q.color);
    }
    // One left-to-right edge hands the central word to the upper headline,
    // then trades the headline for the closure caption as its line bends.
    if(p>.10&&typeChange<1)clipped(c,m-6+(aw+12)*typeChange,top+ah*.35,(aw+12)*(1-typeChange),ah*.28,()=>{
      c.fillStyle=C.lime;c.fillRect(m-6,top+ah*.35,aw+12,ah*.28);
      display(c,range(p,.20,.28)>.5?'SAME?':'TOGETHER.',cx,top+ah*.58,mobile?w*.158:Math.min(w*.145,ah*.23),C.ink,{align:'center',maxWidth:aw});
    });
    const font=mobile?w*.155:Math.min(w*.14,ah*.22);
    clipped(c,m+aw*titleBend,top-4,aw*Math.max(0,typeChange-titleBend),font*2+8,()=>{
      display(c,'FOLLOW',m,top+font*.9,font,C.ink,{maxWidth:aw});
      display(c,'THE LINE.',m,top+font*1.85,font,C.ink,{maxWidth:aw});
    });
    clipped(c,m+aw*release,top-4,aw*Math.max(0,titleBend-release),ah+8,()=>{
      label(c,'YOUR BRAIN DRAWS THE REST.',m,top+15,C.ink,mobile?9:11);
      if(bend===1&&!env.proof&&!(p>.692&&p<.707))label(c,'NO CIRCLE WAS DRAWN.',cx,bottom-16,C.ink,mobile?9:11,'center');
    });
    let phase='CONVERGE',source='../cognitive/01-proximity.html',name='PROXIMITY';
    if(p<.36){
      const similar=range(p,.20,.28);
      name=similar>.5?'SIMILARITY':'PROXIMITY';source=similar>.5?'../cognitive/02-similarity.html':source;
      if(env.proof)label(c,p>=.32?'96 MARKS / FIXED SEGMENT CORRESPONDENCE':similar>.5?'SAME POSITIONS / ALTERNATING ROW COLOR':'WITHIN-GROUP GAP < BETWEEN-GROUP GAP',m,bottom-5,C.ink,mobile?8:10);
    }else if(p<.55){
      name='CONTINUITY';source='../cognitive/03-continuity.html';phase='ALIGN';
      if(env.proof)label(c,p<.46?'96 MARKS JOIN 25 SEGMENTS':'25 SEPARATE SEGMENTS / TANGENTS ALIGN',m,bottom-5,C.ink,mobile?8:10);
    }else if(p<.78){
      name='CLOSURE';source='../cognitive/04-closure.html';phase='COMPLETE';
      if(bend===1&&release===0&&(env.proof||(p>.692&&p<.707))){
        c.strokeStyle=C.paper;c.lineWidth=2;c.setLineDash([4,6]);c.beginPath();c.arc(cx,cy,arcRadius(b),0,Math.PI*2);c.stroke();c.setLineDash([]);
        label(c,'THE MISSING CONTOUR / ADDED FOR PROOF',cx,bottom-16,C.ink,mobile?8:10,'center');
      }else if(env.proof)label(c,release>0?'ARC FRAGMENTS CONTRACT INTO THE SAME 96 MARKS':'THE SAME 25 SEGMENTS BEND INTO FOUR ARCS',m,bottom-5,C.ink,mobile?7:10);
    }else{
      const split=range(p,.92,1);name=split>.1?'SYMMETRY':'COMMON FATE';phase=split>.1?'HANDOFF':'MOVE';source=split>.1?'../cognitive/07-symmetry.html':'../cognitive/06-common-fate.html';
      if(env.proof)label(c,split>.1?'MIRRORED GROUPS / THE CENTER IS EMPTY':'SCROLL TRANSLATES THE GROUP IN ONE DIRECTION',m,bottom-5,C.ink,mobile?7:10);
    }
    return {bg:C.lime,ink:C.ink,accent:C.ink,phase,kicker:'03 / GROUP — '+name,caption:'形がまとまる。まだ、あなたは何も決めていない。',source,sourceLabel:name+' / ORIGINAL LAB'};
  }};
})();
