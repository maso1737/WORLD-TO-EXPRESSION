/* Shared drawing vocabulary. All scene state is a function of scroll position. */
window.WTE = (() => {
  const C={paper:'#F2F2EF',ink:'#0A0A0A',yellow:'#FFD400',lime:'#C8FF1A',ice:'#5AE9FF',noir:'#070707',pink:'#FF2D87'};
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const range=(p,a,b)=>smooth((p-a)/(b-a));
  function circle(c,x,y,r,color=C.ink){if(r<=0)return;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function line(c,x1,y1,x2,y2,color=C.ink,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function label(c,text,x,y,color=C.ink,size=11,align='left'){c.fillStyle=color;c.font=`${size}px "JetBrains Mono",monospace`;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(text,x,y);}
  function display(c,text,x,y,size,color=C.ink,opts={}){c.fillStyle=color;c.font=`${opts.weight||900} ${size}px "Arial Black",Arial,sans-serif`;c.textAlign=opts.align||'left';c.textBaseline='alphabetic';if(opts.maxWidth)c.fillText(text,x,y,opts.maxWidth);else c.fillText(text,x,y);}
  function bg(c,w,h,color){c.fillStyle=color;c.fillRect(0,0,w,h);}
  function hash(i){const n=Math.sin(i*127.1+311.7)*43758.5453123;return n-Math.floor(n);}
  function box(w,h){
    const mobile=w<600,m=mobile?26:Math.max(55,w*.055),top=mobile?91:119;
    // Matches the stacked 44px controls in CSS. A fixed viewport-based reserve
    // keeps forward/reverse composition independent of the previous caption.
    const stacked=w<=520||(w<=800&&h>=w),bottom=h-(stacked?210:mobile?198:155);
    return {mobile,m,top,bottom,cx:w/2,cy:(top+bottom)/2,aw:w-2*m,ah:bottom-top};
  }
  const scenes=[];
  return {C,clamp,lerp,smooth,range,circle,line,label,display,bg,hash,box,scenes};
})();
