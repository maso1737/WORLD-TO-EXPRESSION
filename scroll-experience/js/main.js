(() => {
  const $=id=>document.getElementById(id),ids=['zero','emergence','threshold','group','focus','interpret','edit'];
  const nav=[...document.querySelectorAll('.chapter-nav a')];
  let previous=-1;
  const engine=WTE.createScrollEngine($('world'),(meta,state)=>{
    document.body.style.setProperty('--scene-bg',meta.bg);document.body.style.setProperty('--scene-ink',meta.ink);document.body.style.setProperty('--accent',meta.accent);
    $('scene-number').textContent=String(state.index).padStart(2,'0')+' / 06';
    $('scene-kicker').textContent=meta.kicker.replace(/^\d\d\s*\/\s*/,'');
    $('scene-caption').textContent=meta.caption;
    $('rhythm').textContent=state.held?'HELD / RELEASE TO REJOIN SCROLL':state.index===0&&state.progress<.08?'SCROLL TO BEGIN ↓':(state.reduced?'REDUCED MOTION / ':'')+meta.phase;
    $('percentage').textContent=(state.global*100).toFixed(1).padStart(5,'0')+'%';
    $('timeline-fill').style.width=state.global*100+'%';
    $('explore').href=meta.source;$('explore').title=meta.sourceLabel;
    $('explore').setAttribute('aria-label',meta.sourceLabel);
    $('capture').hidden=!meta.finale;
    $('hold').setAttribute('aria-pressed',String(state.held));
    $('hold').innerHTML=state.held?'RELEASE <span>▶</span>':'HOLD <span>Ⅱ</span>';
    nav.forEach((a,i)=>{i===state.index?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current');});
    if(previous!==state.index){$('status').textContent=meta.kicker;previous=state.index;}
    document.documentElement.dataset.scene=ids[state.index];
    document.documentElement.dataset.progress=state.progress.toFixed(4);
  });
  WTE.engine=engine;
  $('proof').addEventListener('click',()=>{const value=!engine.state.proof;engine.setProof(value);$('proof').setAttribute('aria-pressed',String(value));});
  $('hold').addEventListener('click',()=>engine.hold());
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{
    const index=ids.indexOf(a.hash.slice(1));if(index<0)return;
    event.preventDefault();history.replaceState(null,'',a.hash);engine.jump(index);
  }));
  $('capture').addEventListener('click',()=>{
    const c=document.createElement('canvas');c.width=1800;c.height=2400;
    WTE.drawPoster(c.getContext('2d'),c.width,c.height,true);
    c.toBlob(blob=>{
      if(!blob){$('status').textContent='保存できませんでした。もう一度お試しください。';return;}
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='WORLD-TO-EXPRESSION-poster.png';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),15000);$('status').textContent='完成ポスターをPNGで保存しました。';
    },'image/png');
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
