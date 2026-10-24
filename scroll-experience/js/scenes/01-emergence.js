(() => {
  'use strict';
  const {C, clamp, lerp, range, circle, line, label, display} = WTE;
  const P = WTE.patterns;
  const seeds = P.phyllotaxis(610);
  let chartCache, movingChart;
  function chart(width, height, mobile, collapse = null) {
    const shiftY = collapse ? Math.min(0, Math.floor(collapse.y - 43)) : 0;
    const w = Math.ceil(width) + 2, h = Math.ceil(Math.max(height, collapse ? collapse.y + 43 : 0)) - shiftY + 2;
    const key = `${w}:${h}:${mobile}`;
    if (!collapse && chartCache?.key === key) return {canvas:chartCache.canvas, shiftY:0};
    let canvas, context, pixels;
    if (collapse && movingChart?.key === key) ({canvas,context,pixels}=movingChart);
    else {
      canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      context = canvas.getContext('2d'); pixels = context.createImageData(w, h);
      if (collapse) movingChart={key,canvas,context,pixels};
    }
    pixels.data.fill(0);
    P.bifurcation.forEach((column, i) => {
      const sourceX = i / (P.bifurcation.length - 1) * width;
      const x = Math.floor(collapse ? lerp(sourceX, collapse.x + (i % 2 - .5) * 80, collapse.t) : sourceX);
      const alpha = i < 300 ? .55 : .30;
      for (let j = 0; j < column.values.length; j++) {
        const sourceY = (1 - column.values[j]) * height;
        const y = Math.floor(collapse ? lerp(sourceY, collapse.y + (Math.floor(i / 2) % 2 - .5) * 80, collapse.t) : sourceY) - shiftY;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const offset = ((y + dy) * w + x + dx) * 4;
          pixels.data[offset] = 90; pixels.data[offset + 1] = 233; pixels.data[offset + 2] = 255;
          pixels.data[offset + 3] += Math.round((255 - pixels.data[offset + 3]) * alpha);
        }
      }
    });
    context.putImageData(pixels, 0, 0);
    if (!collapse) chartCache = {key, canvas};
    return {canvas,shiftY};
  }
  function polygon(ctx, points, cx, cy, scale, site, growth = 1, append = false) {
    if (!append) ctx.beginPath();
    points.forEach((pt, i) => {
      const x = cx + (site.x + (pt.x - site.x) * growth) * scale;
      const y = cy + (site.y + (pt.y - site.y) * growth) * scale;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath();
  }
  function cellField(ctx, x, y, scale, growth, mobile, showSeeds) {
    P.cells.forEach((cell, i) => {
      polygon(ctx, cell.polygon, x, y, scale, cell.site, growth);
      ctx.fillStyle = i % 7 === 0 ? C.ink : C.yellow; ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = mobile ? 1.3 : 2; ctx.stroke();
      if (showSeeds) circle(ctx, x + cell.site.x * scale, y + cell.site.y * scale, 2.8, i % 7 === 0 ? C.yellow : C.ink);
    });
  }
  function cellTitle(ctx, w, m, top, bottom, mobile, proof) {
    const font = mobile ? w * .2 : w * .155;
    ctx.fillStyle = C.yellow; ctx.fillRect(m - 4, top + 8, mobile ? w - 2 * m + 8 : w * .48, font * 1.1);
    display(ctx, 'BELONG.', m - font * .04, top + font, font, C.ink, {maxWidth: mobile ? w - 2 * m : w * .47});
    if (proof) {
      ctx.fillStyle = C.yellow; ctx.fillRect(m - 5, bottom - 20, mobile ? w - 2 * m + 10 : 370, 35);
      label(ctx, '89 SEEDS / EACH CELL = ITS NEAREST SEED', m, bottom, C.ink, mobile ? 8 : 10);
    }
  }
  WTE.scenes[1] = {
    render(ctx, w, h, p, env) {
      const mobile = w < 600 || w < h * .82, m = mobile ? Math.max(24, w * .055) : 48;
      const top = mobile ? 98 : 120, bottom = h - (mobile ? 198 : 155);
      const artH = bottom - top;
      const cx = mobile ? w * .5 : w * .67;
      const cy = mobile ? top + artH * .64 : top + artH * .51;
      const radius = mobile ? Math.min(w * .43, artH * .30) : Math.min(w * .29, artH * .49);
      let bg = C.yellow, ink = C.ink, phase = 'BUILD', caption = 'DESIGN THE RULE. NOT THE RESULT.';
      let source = '../natural-patterns/fibonacci.html', sourceLabel = 'FIBONACCI / GOLDEN ANGLE';
      ctx.fillStyle = C.noir; ctx.fillRect(0, 0, w, h);
      if (p < .045) {
        const t = range(p, 0, .045);
        // The opening's final seed travels into the new field before the cut.
        circle(ctx, lerp(w * .5, cx, t), lerp(h * .47, cy, t), lerp(2.8, 5, t), C.yellow);
        bg = C.noir; ink = C.paper;
      } else if (p < .67) {
        ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, w, h);
        if (p < .31) {
          const t = range(p, .045, .275);
          const count = Math.max(1, Math.floor(1 + t * 609));
          const size = mobile ? 3.8 : 5.5;
          const retain = range(p, .275, .31);
          for (let i = 0; i < count; i++) {
            const target = i < 89 ? P.sites[i] : seeds[i];
            circle(ctx, cx + lerp(seeds[i].x, target.x, retain) * radius, cy + lerp(seeds[i].y, target.y, retain) * radius, size * lerp(1, .52, i / 610) * (i < 89 ? 1 : 1 - retain), C.ink);
          }
          const font = mobile ? Math.min(w * .164, artH * .115) : Math.min(w * .106, artH * .27);
          const textY = mobile ? top + font * .75 : top + font * .8;
          display(ctx, 'RULES', m - font * .04, textY, font, C.ink, {maxWidth: mobile ? w - 2 * m : w * .45});
          display(ctx, 'MAKE', m - font * .04, textY + font * .89, font, C.ink, {maxWidth: mobile ? w - 2 * m : w * .45});
          display(ctx, 'WORLDS.', m - font * .04, textY + font * 1.78, font, C.ink, {maxWidth: mobile ? w - 2 * m : w * .50});
          label(ctx, retain > 0 ? '610 → 089 SEEDS' : String(count).padStart(3, '0') + ' / 610', m, bottom - (mobile ? 13 : 25), C.ink, 11);
          label(ctx, '137.5078°', mobile ? w - m : cx + radius, bottom - (mobile ? 13 : 25), C.ink, 11, 'right');
          if (env.proof) {
            ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, radius * .25, 0, P.goldenAngle); ctx.stroke();
            line(ctx, cx, cy, cx + radius * .25, cy, C.ink);
            line(ctx, cx, cy, cx + Math.cos(P.goldenAngle) * radius * .25, cy + Math.sin(P.goldenAngle) * radius * .25, C.ink);
            label(ctx, 'r = c√n / θ = n × 137.5078°', m, bottom + 9, C.ink, mobile ? 8 : 10);
          }
        } else if (p < .49) {
          source = '../natural-patterns/voronoi.html'; sourceLabel = 'VORONOI / NEAREST NEIGHBOUR';
          phase = 'REVEAL';
          const t = range(p, .31, .475), scale = lerp(radius, Math.max(w, h) * .73, t * t);
          const x = lerp(cx, w * .5, t), y = lerp(cy, h * .47, t);
          const grow = range(p, .31, .365);
          cellField(ctx, x, y, scale, grow, mobile, env.proof || t < .45);
          cellTitle(ctx, w, m, top, bottom, mobile, env.proof);
        } else {
          source = '../natural-patterns/reaction-diffusion.html'; sourceLabel = 'GRAY–SCOTT / REACTION–DIFFUSION';
          phase = 'BUILD';
          const t = range(p, .49, .65);
          const aperture = range(p, .49, .545);
          const titleOut = range(p, .49, .505), titleIn = range(p, .505, .52);
          const cellScale = Math.max(w, h) * .73;
          const square = mobile ? Math.max(w, artH) : Math.max(w * .65, artH * 1.22);
          const x = mobile ? (w - square) / 2 : w * .42, y = mobile ? top + 105 : (h - square) / 2;
          // Retain the exact final cells. Their own polygons open from each
          // seed onto the saved Gray-Scott field, then release the boundaries.
          if (aperture < 1) {
            ctx.save(); ctx.globalAlpha = 1 - range(p, .535, .545);
            cellField(ctx, w * .5, h * .47, cellScale, 1, mobile, env.proof);
            ctx.restore();
          }
          if (aperture > 0) {
            ctx.save();
            if (aperture < 1) {
              ctx.beginPath();
              P.cells.forEach(cell => polygon(ctx, cell.polygon, w * .5, h * .47, cellScale, cell.site, aperture, true));
              ctx.clip();
            }
            ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, w, h);
            ctx.beginPath(); ctx.rect(x, top, square, bottom - top); ctx.clip();
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(P.reactionFrame(t), x, y, square, square);
            ctx.restore();
          }
          const titleEnd = mobile ? w - m + 6 : m + w * .48;
          if (titleOut < 1) {
            ctx.save();
            if (titleOut > 0) {
              const edge = lerp(m - 6, titleEnd, titleOut);
              ctx.beginPath(); ctx.rect(edge, 0, w - edge, h); ctx.clip();
            }
            cellTitle(ctx, w, m, top, bottom, mobile, env.proof);
            ctx.restore();
          }
          // Complete the outgoing wipe before revealing the next title.
          // The cells stay in view throughout; no mixed or translucent words.
          if (titleIn > 0) {
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, lerp(m - 6, titleEnd, titleIn), h); ctx.clip();
            const font = mobile ? w * .17 : Math.min(w * .115, artH * .28);
            const words = mobile ? ['GROW.', 'DIVIDE.'] : ['GROW.', 'DIVIDE.', 'REPEAT.'];
            words.forEach((word, i) => {
              const baseline = top + font * .78 + i * font * .91;
              ctx.fillStyle = C.yellow; ctx.fillRect(m - 4, baseline - font * .79, mobile ? w * .74 : w * .43, font * .89);
              display(ctx, word, m - font * .04, baseline, font, C.ink, {maxWidth: mobile ? w - 2 * m : w * .42});
            });
            if (env.proof) {
              ctx.fillStyle = C.yellow; ctx.fillRect(m - 5, bottom - 29, mobile ? w - 2 * m + 10 : 420, 42);
              label(ctx, 'GRAY–SCOTT / F .0545 / K .062', m, bottom - 11, C.ink, mobile ? 8 : 10);
              label(ctx, 'ITERATION ' + P.reactionState(t).iteration + ' / B > .18', m, bottom + 5, C.ink, mobile ? 8 : 10);
            }
            ctx.restore();
          }
        }
      } else {
        bg = C.noir; ink = C.paper; source = '../Emergence Engine/01_bifurcation_walk.html'; sourceLabel = 'EMERGENCE ENGINE / LOGISTIC MAP';
        const t = range(p, .67, .95), erase = range(p, .96, 1);
        const plotX = m, plotW = w - m * 2;
        // Short viewports reserve every row inside the masthead/console gap.
        // Keep the full chart, equation, axis and sample count; never crop data.
        const compact = artH < 260;
        const titleTop = compact ? (w <= 520 ? 75 : 90) : top;
        const sampleY = compact ? bottom + (mobile || w <= 800 ? 0 : 23) : bottom + (mobile ? 43 : 25);
        const font = Math.min(mobile ? w * .19 : Math.min(w * .151, 182), compact ? (sampleY - titleTop) * .22 : Infinity);
        const plotY = compact ? titleTop + font + 20 : mobile ? top + 105 : top + 108;
        const axisY = compact ? sampleY - 34 : bottom + 5;
        const tickY = compact ? sampleY - 18 : bottom + 25;
        const plotH = Math.max(1, compact ? axisY - plotY - 8 : bottom - plotY - 12);
        const shown = Math.max(1, Math.floor(t * P.bifurcation.length));
        const currentR = P.bifurcation[shown - 1].r;
        const headline = currentR < 3 ? 'ONE.' : currentR < 3.449489743 ? 'TWO.' : currentR < 3.54409036 ? 'FOUR.' : currentR < 3.569946 ? 'MORE.' : 'CHAOS.';
        ctx.save(); ctx.translate(0, -erase * h * .55);
        display(ctx, headline, m - font * .035, titleTop + font * .75, font, C.ice, {maxWidth: w - m * 2});
        ctx.restore();
        ctx.fillStyle = C.ice;
        if (erase === 0) {
          ctx.save(); ctx.beginPath(); ctx.rect(plotX, plotY, Math.max(2, plotW * shown / P.bifurcation.length), plotH + 2); ctx.clip();
          ctx.drawImage(chart(plotW, plotH, mobile).canvas, plotX, plotY); ctx.restore();
        } else {
          // Every r keeps all 120 samples. A fixed four-way correspondence
          // moves the full raster, avoiding both density loss and 67k draw calls.
          const merge = range(erase,.92,1);
          if (merge < 1) {
            const image=chart(plotW,plotH,mobile,{x:w*.5-plotX,y:h*.47-plotY,t:erase});
            ctx.save();ctx.globalAlpha=1-merge;ctx.drawImage(image.canvas,plotX,plotY+image.shiftY);ctx.restore();
          }
          if (merge > 0) for (let i=0;i<4;i++) circle(ctx,w*.5+(i%2-.5)*80,h*.47+(Math.floor(i/2)-.5)*80,3*merge,C.ice);
        }
        if (erase < .5) {
          line(ctx, plotX, axisY, plotX + plotW, axisY, '#375052');
          label(ctx, 'r  2.800', plotX, tickY, C.ice, 9);
          label(ctx, '4.000', plotX + plotW, tickY, C.ice, 9, 'right');
        }
        if (env.proof) {
          const equationY = compact ? plotY - 9 : mobile ? plotY - 17 : top - 14;
          label(ctx, 'x[n+1] = r × x[n] × (1 − x[n])', m, equationY, C.paper, mobile ? 8 : 10);
          // Desktop proof shares the axis row between its endpoint labels.
          const sharedRow = !compact && !mobile;
          label(ctx, '700 TRANSIENTS DISCARDED / 120 SAMPLES PER r', sharedRow ? w / 2 : m, sampleY, C.paper, mobile ? 7 : 9, sharedRow ? 'center' : 'left');
        }
        phase = t < .61 ? 'BUILD' : erase > 0 ? 'HANDOFF' : 'BREAK';
        caption = 'ONE RULE. MORE THAN ONE FUTURE.';
      }
      return {bg, ink, accent: bg === C.noir ? C.ice : C.ink, phase,
        kicker: '01 / EMERGENCE', caption, source, sourceLabel};
    }
  };
})();
