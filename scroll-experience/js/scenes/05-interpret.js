/* INTERPRET — identical geometry, changing context. No perceptual-size claims. */
(() => {
  'use strict';
  const { C, clamp, lerp, smooth, range, circle, line, label, display } = WTE;
  const TAU = Math.PI * 2;
  // Every fourth sample of the existing PROFILE_face-vase.js, at its fixed
  // BISTABLE_CUE=95. The contour never changes during figure/ground inversion.
  const PROFILE = [0.230400,0.225020,0.219580,0.213990,0.208320,0.202340,0.195950,0.189640,0.184370,0.179760,0.175590,0.171730,0.168310,0.165255,0.162595,0.160250,0.158230,0.156730,0.157625,0.158895,0.159880,0.161115,0.162790,0.165125,0.168050,0.170840,0.173380,0.175795,0.177975,0.179785,0.181190,0.182015,0.181500,0.177175,0.170665,0.162815,0.154300,0.145115,0.135645,0.125885,0.116030,0.106075,0.096020,0.086155,0.076380,0.066985,0.058155,0.050270,0.044560,0.046260,0.055835,0.071955,0.095840,0.129575,0.147010,0.147015,0.145745,0.143300,0.139490,0.134225,0.143270,0.157980,0.170465,0.162870,0.156705,0.153370,0.163230,0.175170,0.182455,0.187790,0.192225,0.195945,0.199485,0.203090,0.206300,0.209400,0.212375,0.215680,0.219360,0.224575,0.234305];

  function layout(w, h) {
    const mobile = w < 760 || w < h * .82;
    // Reserve the fixed CSS masthead and the console's multiline layout.
    // Do not measure the current caption: it belongs to the previous frame and
    // would make the same progress depend on the direction of travel.
    const masthead = w <= 520 ? 63 : 78;
    const bottom = Math.max(masthead + 1, h - (mobile ? 198 : 155));
    const compact = bottom - (mobile ? 100 : 118) < 240;
    const top = Math.min(bottom - 1, compact ? masthead + 20 : mobile ? 100 : 118);
    const height = bottom - top;
    return { mobile, compact, top, bottom, height, x: w * (mobile ? .5 : .705), y: top + height * (mobile ? .64 : .50), margin: w * (mobile ? .055 : .045) };
  }
  WTE.interpretLayout = layout;
  function background(ctx, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }
  function heading(ctx, w, h, g, first, second, small, ink = C.ink) {
    const size = Math.min(w * (g.mobile ? .152 : .107), g.height * (g.mobile ? .12 : .18));
    const y = g.top + size * .93;
    display(ctx, first, g.margin, y, size, ink, { maxWidth: w * (g.mobile ? .9 : .44) });
    display(ctx, second, g.margin, y + size * .89, size, ink, { maxWidth: w * (g.mobile ? .9 : .44) });
    label(ctx, small, g.margin + 2, y + size * .89 + (g.compact ? 16 : 28), ink, g.mobile ? 9 : 10);
  }
  function measurement(ctx, x1, x2, y, text, color = C.ink, compact = false) {
    line(ctx, x1, y, x2, y, color, 1);
    const tick = compact ? 3 : 5;
    line(ctx, x1, y - tick, x1, y + tick, color, 1);
    line(ctx, x2, y - tick, x2, y + tick, color, 1);
    label(ctx, text, (x1 + x2) / 2, y + (compact ? 12 : 18), color, compact ? 9 : 10, 'center');
  }
  function equality(ctx, x1, x2, y1, y2, length, color, compact) {
    const pad = compact ? 10 : 20;
    ctx.save();
    ctx.setLineDash([3, 5]);
    line(ctx, x1, y1 - pad, x1, y2 + pad, color, 1);
    line(ctx, x2, y1 - pad, x2, y2 + pad, color, 1);
    ctx.restore();
    measurement(ctx, x1, x2, y2 + (compact ? 15 : 36), `A = B = ${length.toFixed(1)} CSS px`, color, compact);
  }

  const textures = new Map();
  function projectedText(ctx, cx, cy, width, height, d, color) {
    if (!textures.has(color)) {
      const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 640;
      const c = canvas.getContext('2d');
      display(c, 'SEE', 450, 304, 395, color, {align: 'center', maxWidth: 880});
      display(c, 'ING', 450, 630, 395, color, {align: 'center', maxWidth: 880});
      textures.set(color, canvas);
    }
    if (Math.abs(d) < .02) d = 0;
    const texture = textures.get(color), ax = d * .65, ay = d * 1.22;
    if (d === 0) {ctx.drawImage(texture,cx-width/2,cy-height/2,width,height);return {ax,ay};}
    function project(u, v) {
      const x = u - .5, y = v - .5;
      const X = x * Math.cos(ay), z = -x * Math.sin(ay);
      const Y = y * Math.cos(ax) - z * Math.sin(ax);
      const Z = y * Math.sin(ax) + z * Math.cos(ax);
      const perspective = 1 / (1 + Z * .92);
      return {x: cx + X * width * perspective, y: cy + Y * height * perspective};
    }
    function triangle(uv, dest) {
      const [a,b,c] = uv.map(p=>({x:p[0]*900,y:p[1]*640}));
      const [A,B,D] = dest, dx1=b.x-a.x, dy1=b.y-a.y, dx2=c.x-a.x, dy2=c.y-a.y;
      const det=dx1*dy2-dx2*dy1;
      const xx=((B.x-A.x)*dy2-(D.x-A.x)*dy1)/det;
      const xy=((D.x-A.x)*dx1-(B.x-A.x)*dx2)/det;
      const yx=((B.y-A.y)*dy2-(D.y-A.y)*dy1)/det;
      const yy=((D.y-A.y)*dx1-(B.y-A.y)*dx2)/det;
      const center={x:(A.x+B.x+D.x)/3,y:(A.y+B.y+D.y)/3};
      const expanded=dest.map(p=>{const dx=p.x-center.x,dy=p.y-center.y,length=Math.hypot(dx,dy);return {x:p.x+dx/length*2.5,y:p.y+dy/length*2.5};});
      ctx.save();ctx.beginPath();expanded.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
      ctx.transform(xx,yx,xy,yy,A.x-xx*a.x-xy*a.y,A.y-yx*a.x-yy*a.y);ctx.drawImage(texture,0,0);ctx.restore();
    }
    // A fixed plane, rotated in 3D and perspective-divided. Triangles only
    // approximate texture sampling; the projected vertices use the camera model.
    for(let row=0;row<10;row++)for(let col=0;col<16;col++){
      const uv=[[col/16,row/10],[(col+1)/16,row/10],[(col+1)/16,(row+1)/10],[col/16,(row+1)/10]];
      const q=uv.map(v=>project(...v));
      triangle([uv[0],uv[1],uv[2]],[q[0],q[1],q[2]]);triangle([uv[0],uv[2],uv[3]],[q[0],q[2],q[3]]);
    }
    return {ax,ay};
  }

  // Shared with EDIT: deterministic positions make the act boundary seamless.
  WTE.drawInterpretField = function (ctx, w, h, amount = 1) {
    const g = layout(w, h), cols = g.mobile ? 3 : 7, rows = 7;
    const cw = w / cols, rh = g.height / rows;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, g.top - 12, w, g.height + 28); ctx.clip();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col;
        const threshold = ((id * 17 + 3) % (rows * cols)) / (rows * cols);
        if (threshold > amount) continue;
        const x = col * cw + cw * .06 + Math.sin(id * 2.17) * cw * .14;
        const y = g.top + (row + .8) * rh;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((id * 7) % 5 - 2) * .075);
        display(ctx, id % 2 ? 'ING' : 'SEE', 0, 0, Math.min(cw * .45, rh * .92), C.ink, { maxWidth: cw * 1.1 });
        if (id % 3 === 0) {
          line(ctx, -cw * .1, -rh * .32, cw * .95, rh * .16, C.ink, 1);
          label(ctx, `${String(id + 1).padStart(2, '0')} / CONTEXT`, 2, 16, C.ink, 8);
        }
        if (id % 5 === 0) {
          ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
          ctx.strokeRect(cw * .45, -rh * .68, cw * .39, rh * .56);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  };

  WTE.scenes[5] = {
    render(ctx, w, h, p, env = {}) {
      const g = layout(w, h), proof = !!env.proof;
      let bg = C.paper, ink = C.ink, accent = C.ink;
      let phase = 'CONTEXT', kicker = '05 / INTERPRET', caption = '同じ情報でも、文脈が変わると見え方が変わる。';
      let source = '../cognitive/l3-01-muller-lyer.html', sourceLabel = 'MÜLLER–LYER / ORIGINAL LAB';
      background(ctx, w, h, bg);

      if (p < .23) {
        phase = p < .045 ? 'DUPLICATE' : p < .16 ? 'MISREAD' : 'MEASURE';
        heading(ctx, w, h, g, 'SAME', 'LINE.', '01 / MÜLLER–LYER');
        const length = Math.min(w * (g.mobile ? .52 : .34), g.height * .67);
        const spread = Math.min(g.height * .15, w * .13) * range(p, .004, .045);
        const y1 = g.y - spread, y2 = g.y + spread;
        const x1 = g.x - length / 2, x2 = g.x + length / 2;
        const fins = range(p, .025, .065) * (1 - range(p, .16, .205));
        const fin = length * .19 * fins;
        [y1, y2].forEach((y, index) => {
          line(ctx, x1, y, x2, y, ink, g.mobile ? 3 : 4);
          const direction = index === 0 ? 1 : -1;
          for (const sy of [-1, 1]) {
            line(ctx, x1, y, x1 + direction * fin * .78, y + sy * fin * .63, ink, g.mobile ? 3 : 4);
            line(ctx, x2, y, x2 - direction * fin * .78, y + sy * fin * .63, ink, g.mobile ? 3 : 4);
          }
        });
        if (proof || p > .2) equality(ctx, x1, x2, y1, y2, length, ink, g.compact);
        if (!g.mobile && !g.compact) label(ctx, 'TWO SHAFTS. ONE LENGTH.', g.x, g.top + g.height * .91, ink, 10, 'center');
        caption = proof ? `線分 A = B = ${length.toFixed(1)} px。矢羽根だけが変わり、端点間の距離は同じ。` : '違って見える、同じ長さ。周囲を取り去ると、もう一つの事実が現れる。';
      } else if (p < .42) {
        phase = 'PERSPECTIVE';
        source = '../cognitive/l3-02-ponzo.html'; sourceLabel = 'PONZO / ORIGINAL LAB';
        heading(ctx, w, h, g, 'SAME', 'SCALE.', '02 / PONZO');
        const length = Math.min(w * (g.mobile ? .39 : .23), g.height * .42);
        const halfNear = length * .96, halfFar = length * .12;
        const top = g.y - g.height * .24, bottom = g.y + g.height * .24;
        const convergence = range(p, .23, .285);
        const far = lerp(halfNear, halfFar, convergence);
        for (const side of [-1, 1]) line(ctx, g.x + side * far, top, g.x + side * halfNear, bottom, ink, 1.5);
        for (let i = 1; i < 10; i++) {
          const t = (i / 10) ** 1.7;
          const y = lerp(top, bottom, t), half = lerp(far, halfNear, t);
          line(ctx, g.x - half, y, g.x + half, y, 'rgba(10,10,10,.16)', 1);
        }
        const y1 = lerp(top, bottom, .27), y2 = lerp(top, bottom, .78);
        const x1 = g.x - length / 2, x2 = g.x + length / 2;
        line(ctx, x1, y1, x2, y1, ink, g.mobile ? 6 : 8);
        line(ctx, x1, y2, x2, y2, ink, g.mobile ? 6 : 8);
        if (proof) equality(ctx, x1, x2, y1, y2, length, ink, g.compact);
        caption = proof ? `A = B = ${length.toFixed(1)} CSS px。収束線の奥行き手がかりだけが変化する。` : '奥行きの手がかりは、同じ寸法に別のスケールを与える。';
      } else if (p < .60) {
        phase = 'RELATIVITY';
        source = '../cognitive/l3-03-ebbinghaus.html'; sourceLabel = 'EBBINGHAUS / ORIGINAL LAB';
        heading(ctx, w, h, g, 'SAME', 'CIRCLE.', '03 / EBBINGHAUS');
        const r = Math.min(w * (g.mobile ? .037 : .018), g.height * (g.mobile ? .028 : .044));
        const spread = g.mobile ? g.height * .17 : w * .12;
        const centers = g.mobile ? [[g.x, g.y - spread], [g.x, g.y + spread]] : [[g.x - spread, g.y], [g.x + spread, g.y]];
        const build = range(p, .42, .455);
        centers.forEach(([x, y], j) => {
          const sr = r * (j === 0 ? .52 : 2.1);
          const ring = j === 0 ? r + sr + r * .48 : r * 4.3;
          const neighbors = j === 0 ? 8 : 6;
          for (let k = 0; k < neighbors; k++) {
            const a = k * TAU / neighbors;
            circle(ctx, x + Math.cos(a) * ring, y + Math.sin(a) * ring, sr * build, ink);
          }
          circle(ctx, x, y, r, ink);
        });
        if (proof) {
          // Finish both groups before annotations. In the vertical composition,
          // reserve a side column outside the largest ring for both dimensions.
          const measureX = g.mobile ? (g.margin + g.x - r * 6.4) / 2 : 0;
          centers.forEach(([x, y]) => {
            circle(ctx, x, y, 1.7, C.paper);
            line(ctx, x - r, y, x + r, y, C.paper, 1);
            const mx = g.mobile ? measureX : x, my = g.mobile ? y : y + r * 6.6;
            measurement(ctx, mx - r, mx + r, my, `d = ${(2*r).toFixed(1)} px`, ink, g.mobile || g.compact);
          });
        }
        caption = proof ? `中心円は等径（半径 ${r.toFixed(1)} px）。周囲の円の大きさ・数・間隔が異なる。` : '小さな隣人と、大きな隣人。中心にある二つの円は、同じ大きさ。';
      } else if (p < .78) {
        phase = p < .68 ? 'FIGURE' : 'GROUND';
        source = '../cognitive/l3-07-rubin.html'; sourceLabel = 'RUBIN / ORIGINAL LAB';
        const inverted = p >= .68;
        bg = inverted ? C.ink : C.paper; ink = inverted ? C.paper : C.ink;
        background(ctx, w, h, bg);
        heading(ctx, w, h, g, inverted ? 'TWO' : 'ONE', inverted ? 'FACES.' : 'VASE.', '04 / FIGURE ↔ GROUND', ink);
        const vh = Math.min(g.height * (g.mobile ? .57 : .81), w * (g.mobile ? .95 : .36));
        const vx = g.x, vy = g.y - vh / 2, scale = vh / .9025;
        ctx.beginPath();
        PROFILE.forEach((v, i) => {
          const x = vx + v * scale, y = vy + i / (PROFILE.length - 1) * vh;
          if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        for (let i = PROFILE.length - 1; i >= 0; i--) ctx.lineTo(vx - PROFILE[i] * scale, vy + i / (PROFILE.length - 1) * vh);
        ctx.closePath(); ctx.fillStyle = ink; ctx.fill();
        if (proof) {
          line(ctx, vx - 10, g.y, vx + 10, g.y, bg, 1);
          line(ctx, vx, g.y - 10, vx, g.y + 10, bg, 1);
          label(ctx, 'FIXED CONTOUR / REVERSED POLARITY', vx, vy + vh + (g.compact ? 10 : 26), ink, g.mobile ? 8 : 10, 'center');
        }
        caption = proof ? '輪郭座標は固定。色の極性だけを反転し、中央と左右のどちらを図として見るかを揺さぶる。' : '壺を見る。二つの顔を見る。同じ輪郭の、こちら側と向こう側。';
      } else if (p < .945) {
        phase = 'ALIGNMENT';
        source = '../cognitive/l3-08-anamorphosis.html'; sourceLabel = 'ANAMORPHOSIS / ORIGINAL LAB';
        const t = clamp((p - .78) / .165), d = (t - .5) * 2;
        const aligned = Math.abs(d) < .13;
        bg = aligned ? C.pink : C.ink; ink = aligned ? C.ink : C.paper; accent = aligned ? C.pink : C.paper;
        background(ctx, w, h, bg);
        const cx = w * .5, cy = g.top + g.height * .52;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, g.top - 10, w, g.height + 20); ctx.clip();
        const angles = projectedText(ctx,cx,cy,Math.min(w*.9,g.height*1.25),g.height*.76,d,ink);
        ctx.restore();
        label(ctx, aligned ? 'ONE ALIGNMENT. ANOTHER REALITY.' : '04 → 05 / FIND THE ALIGNMENT', w * .055, g.top + 2, ink, g.mobile ? 9 : 10);
        line(ctx, w * .055, g.top + g.height - 15, w * .945, g.top + g.height - 15, ink, 1);
        circle(ctx, lerp(w * .055, w * .945, t), g.top + g.height - 15, 4, ink);
        if (proof) label(ctx, `FIXED PLANE / ROT X ${(angles.ax*180/Math.PI).toFixed(1)}° / Y ${(angles.ay*180/Math.PI).toFixed(1)}°`, w * .5, g.bottom + (g.compact ? -2 : 8), ink, g.mobile ? 8 : 10, 'center');
        caption = proof ? '同じ文字平面を3D回転し透視投影。中央では両回転角0°となり、正面像に戻る。' : '文字は同じ。変わるのは読み取るための視点。ほんの一瞬、すべてが整う。';
      } else {
        phase = 'OVERLOAD';
        source = '../cognitive/l4-04-signal-noise.html'; sourceLabel = 'SIGNAL / NOISE → EDIT';
        const amount = lerp(.45, 1, range(p, .945, .99));
        WTE.drawInterpretField(ctx, w, h, amount);
        caption = '見え方は脳がつくる。ここから、残すものを決めるのはあなた。';
      }
      return { bg, ink, accent, phase, kicker, caption, source, sourceLabel };
    }
  };
})();
