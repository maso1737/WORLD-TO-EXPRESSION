/* Native scroll with a short, time-based display follow; no idle animation loop. */
(() => {
  const {clamp}=WTE;
  WTE.createScrollEngine=function(canvas,onFrame){
    const c=canvas.getContext('2d',{alpha:false});
    const sections=[...document.querySelectorAll('.scroll-section')];
    const lengths=[2.4,5.7,3.2,4.6,3.8,5.5,4.9];
    const stills=[[0,.26,.48,.77,1],[0,.19,.39,.58,.86,1],[0,.2,.37,.66,.86,1],[0,.17,.29,.46,.66,.86,.98],[0,.28,.50,.64,.86,1],[0,.10,.32,.50,.64,.72,.8625,1],[0,.16,.31,.53,.73,.94,1]];
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const tau=.09,epsilon=.15;
    const state={index:0,rawProgress:0,progress:0,global:0,targetY:0,displayY:0,proof:false,held:false,reduced:reduced.matches,width:0,height:0,draws:0};
    let bounds=[],total=1,raf=0,heldFrame=null,disposed=false,lastTime=null,directTouch=false;
    function position(y){
      y=clamp(y,0,total);let index=0;
      for(let i=1;i<bounds.length;i++)if(y>=bounds[i])index=i;
      const rawProgress=clamp((y-bounds[index])/(lengths[index]*state.height));
      let p=rawProgress;
      if(state.reduced){const keys=stills[index];p=keys[Math.min(keys.length-1,Math.floor(p*keys.length))];}
      return {index,rawProgress,progress:p,global:y/total};
    }
    const toY=at=>bounds[at.index]+at.rawProgress*lengths[at.index]*state.height;
    function stop(){cancelAnimationFrame(raf);raf=0;lastTime=null;}
    function request(){
      if(raf||disposed||document.hidden)return;
      if(lastTime===null)lastTime=performance.now();
      raf=requestAnimationFrame(draw);
    }
    function draw(timestamp){
      raf=0;if(disposed||document.hidden){lastTime=null;return;}
      if(!state.held){
        const dt=Math.max(0,(timestamp-lastTime)/1000);
        if(state.reduced||directTouch)state.displayY=state.targetY;
        else state.displayY+=(state.targetY-state.displayY)*(-Math.expm1(-dt/tau));
        if(Math.abs(state.targetY-state.displayY)<epsilon)state.displayY=state.targetY;
      }
      lastTime=timestamp;
      Object.assign(state,state.held?heldFrame:position(state.displayY));
      const dpr=Math.min(devicePixelRatio||1,2);
      c.setTransform(dpr,0,0,dpr,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.setLineDash([]);
      c.save();const meta=WTE.scenes[state.index].render(c,state.width,state.height,state.progress,{proof:state.proof,reduced:state.reduced});c.restore();
      state.draws++;onFrame(meta,{...state});
      if(!state.held&&state.displayY!==state.targetY)request();
      else lastTime=null;
    }
    function onScroll(){
      const y=clamp(scrollY,0,total),changed=y!==state.targetY;
      state.targetY=y;
      if(!state.held&&(changed||state.displayY!==y))request();
    }
    // Restoration and explicit seeks bypass follow; ordinary input never does.
    function sync(){
      stop();state.targetY=clamp(scrollY,0,total);
      if(!state.held)state.displayY=state.targetY;
      request();
    }
    function resize(){
      const real=state.height?position(state.targetY):null;
      const visible=state.height?position(state.displayY):null;
      stop();state.width=innerWidth;state.height=innerHeight;
      const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(state.width*dpr);canvas.height=Math.round(state.height*dpr);
      canvas.style.width=state.width+'px';canvas.style.height=state.height+'px';
      let offset=0;bounds=lengths.map((v,i)=>{sections[i].style.height=v*state.height+'px';const n=offset;offset+=v*state.height;return n;});
      total=offset;document.getElementById('end-space').style.height=state.height+'px';
      if(real)scrollTo({top:toY(real),behavior:'instant'});
      state.targetY=clamp(scrollY,0,total);
      state.displayY=visible?toY(visible):state.targetY;
      if(heldFrame){state.displayY=toY(heldFrame);heldFrame=position(state.displayY);}
      request();
    }
    function jump(index,progress=0){
      index=Math.round(clamp(index,0,lengths.length-1));
      state.held=false;heldFrame=null;
      scrollTo({top:Math.ceil(bounds[index]+clamp(progress)*lengths[index]*state.height),behavior:'instant'});
      sync();
    }
    function hold(){
      stop();state.held=!state.held;
      heldFrame=state.held?{index:state.index,rawProgress:state.rawProgress,progress:state.progress,global:state.global}:null;
      state.targetY=clamp(scrollY,0,total);
      // RELEASE is an explicit rejoin even after a native touch gesture.
      if(!state.held)directTouch=false;
      request();return state.held;
    }
    function onReduced(){
      state.reduced=reduced.matches;
      if(heldFrame)heldFrame=position(state.displayY);
      sync();
    }
    function onVisibility(){
      stop();
      if(!document.hidden){state.targetY=clamp(scrollY,0,total);request();}
    }
    // Touch keeps the OS's own inertia. Detect actual input, never viewport width.
    const onTouch=()=>{directTouch=true;};
    const onPointer=e=>{directTouch=e.pointerType==='touch';};
    const onWheel=()=>{directTouch=false;};
    const onKey=e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))directTouch=false;};
    addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',resize);
    addEventListener('pageshow',sync);addEventListener('pointerdown',onPointer,{passive:true});
    addEventListener('touchstart',onTouch,{passive:true});addEventListener('wheel',onWheel,{passive:true});addEventListener('keydown',onKey);
    document.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',onReduced);
    resize();
    return {state,request,sync,jump,hold,setProof(value){state.proof=value;request();},get bounds(){return [...bounds];},get total(){return total;},dispose(){
      disposed=true;stop();removeEventListener('scroll',onScroll);removeEventListener('resize',resize);removeEventListener('pageshow',sync);
      removeEventListener('pointerdown',onPointer);removeEventListener('touchstart',onTouch);removeEventListener('wheel',onWheel);removeEventListener('keydown',onKey);
      document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onReduced);
    }};
  };
})();