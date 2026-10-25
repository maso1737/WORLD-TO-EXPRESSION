(() => {
  const $=id=>document.getElementById(id),ids=['zero','emergence','threshold','group','focus','interpret','edit'];
  const nav=[...document.querySelectorAll('.chapter-nav a')];
  const text=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
  let previous=-1,previousFinale=null,previousHeld=null,previousSource=null,previousLabel=null;
  const engine=WTE.createScrollEngine($('world'),(meta,state)=>{
    document.body.style.setProperty('--scene-bg',meta.bg);document.body.style.setProperty('--scene-ink',meta.ink);document.body.style.setProperty('--accent',meta.accent);
    text('scene-number',String(state.index).padStart(2,'0')+' / 06');
    text('scene-kicker',meta.kicker.replace(/^\d\d\s*\/\s*/,''));
    text('scene-caption',meta.caption);
    text('rhythm',state.held?'HELD / RELEASE TO REJOIN SCROLL':state.index===0&&state.progress<.08?'SCROLL TO BEGIN ↓':(state.reduced?'REDUCED MOTION / ':'')+meta.phase);
    $('percentage').textContent=(state.global*100).toFixed(1).padStart(5,'0')+'%';
    $('timeline-fill').style.width=state.global*100+'%';
    const finale=!!meta.finale;
    if(previousSource!==meta.source){$('explore').href=meta.source;previousSource=meta.source;}
    if(previousLabel!==meta.sourceLabel){$('explore').title=meta.sourceLabel;$('explore').setAttribute('aria-label',meta.sourceLabel);previousLabel=meta.sourceLabel;}
    if(previousFinale!==finale){
      $('explore').firstChild.nodeValue=finale?'OPEN LAB ':'EXPLORE ';
      if(!finale&&document.activeElement===$('capture'))$('explore').focus({preventScroll:true});
      $('capture').hidden=!finale;previousFinale=finale;
    }
    if(previousHeld!==state.held){
      $('hold').setAttribute('aria-pressed',String(state.held));
      $('hold').firstChild.nodeValue=state.held?'RELEASE ':'HOLD ';
      $('hold').querySelector('span').textContent=state.held?'▶':'Ⅱ';previousHeld=state.held;
    }
    if(previous!==state.index){
      nav.forEach((a,i)=>{i===state.index?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current');});
      $('status').textContent=meta.kicker;previous=state.index;
    }
    document.documentElement.dataset.scene=ids[state.index];
    document.documentElement.dataset.progress=state.progress.toFixed(4);
  });
  WTE.engine=engine;
  $('proof').addEventListener('click',()=>{const value=!engine.state.proof;engine.setProof(value);$('proof').setAttribute('aria-pressed',String(value));});
  $('hold').addEventListener('click',()=>engine.hold());
  document.querySelector('.skip').addEventListener('click',event=>{
    event.preventDefault();nav[0].focus({preventScroll:true});
  });
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{
    const index=ids.indexOf(a.hash.slice(1));if(index<0)return;
    event.preventDefault();history.replaceState(null,'',a.hash);engine.jump(index);
  }));
  $('capture').addEventListener('click',async()=>{
    $('capture').disabled=true;
    try{
      await document.fonts.load('12px "JetBrains Mono"');
      await document.fonts.ready;
      const c=document.createElement('canvas');c.width=1800;c.height=2400;
      WTE.drawPoster(c.getContext('2d'),c.width,c.height,true);
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
      if(!blob)throw new Error('PNG encoding failed');
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='WORLD-TO-EXPRESSION-poster.png';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),15000);$('status').textContent='PNGのダウンロードを開始しました。';
    }catch{
      $('status').textContent='保存できませんでした。もう一度お試しください。';
    }finally{$('capture').disabled=false;}
  });
  document.fonts.ready.then(()=>engine.request());
  addEventListener('pageshow',()=>engine.request());
  addEventListener('hashchange',()=>{const i=ids.indexOf(location.hash.slice(1));if(i>=0)engine.jump(i);});
  // Native history restores scroll on reload. Only new hash navigation needs a jump.
  const navigation=performance.getEntriesByType('navigation')[0];
  if(location.hash&&navigation?.type!=='reload'&&navigation?.type!=='back_forward'){
    const i=ids.indexOf(location.hash.slice(1));if(i>=0)requestAnimationFrame(()=>engine.jump(i));
  }
})();
