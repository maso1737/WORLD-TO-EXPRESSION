(() => {
  'use strict';
  const {C, clamp, lerp, range, circle, line, label, display} = WTE;
  WTE.scenes[0] = {
    render(ctx, w, h, p, env) {
      const mobile = w < 600, m = mobile ? 24 : 48;
      const cy = h * .47, cx = w * .5;
      const wipe = range(p, .64, .71);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      if (p < .08) {
        circle(ctx, cx, cy, 2.8, C.ink);
        if (p > .025) {
          line(ctx, cx + 14, cy, cx + 52, cy, '#A5A5A2');
          label(ctx, '0,0', cx + 60, cy + 4, '#777774', 9);
        }
      } else {
        const grow = range(p, .08, .35), tighten = range(p, .35, .46);
        const total = Math.max(1, Math.floor(1 + grow * 143));
        const gap = mobile ? 29 : 45;
        const cols = mobile ? 8 : 16;
        const rows = Math.ceil(total / cols);
        for (let i = 0; i < total; i++) {
          const col = i % cols, row = Math.floor(i / cols);
          const x = cx + (col - (cols - 1) / 2) * gap;
          const y = cy + (row - (rows - 1) / 2) * gap;
          circle(ctx, x, y, lerp(3.5, 1.8, tighten), C.ink);
        }
      }
      if (p > .30 && p < .71) {
        // Hard typographic strips physically replace the point field.
        const font = mobile ? Math.min(w * .155, 70) : Math.min(w * .132, h * .19);
        const leading = font * .94, y0 = cy - leading * .78;
        ['THE WORLD', 'IS NOT', 'AN IMAGE.'].forEach((text, i) => {
          const reveal = range(p, .30 + i * .035, .38 + i * .035);
          const y = y0 + leading * i;
          ctx.save(); ctx.beginPath(); ctx.rect(m, y - font, (w - m * 2) * reveal, font * 1.13); ctx.clip();
          ctx.fillStyle = C.paper; ctx.fillRect(m, y - font * .84, w - m * 2, font * 1.03);
          display(ctx, text, m - font * .04, y, font, C.ink, {maxWidth: w - m * 2});
          ctx.restore();
        });
      }
      if (wipe > 0) {
        ctx.save(); ctx.beginPath();
        ctx.moveTo(-w * .25, 0); ctx.lineTo(w * wipe * 1.5, 0);
        ctx.lineTo(w * wipe * 1.5 - w * .25, h); ctx.lineTo(-w * .25, h); ctx.closePath(); ctx.clip();
        ctx.fillStyle = C.noir; ctx.fillRect(0, 0, w, h);
        const out = range(p, .87, .96);
        const font = mobile ? w * .172 : Math.min(w * .175, h * .26);
        ctx.save();
        ctx.translate(0, -out * h * .8);
        display(ctx, 'IT IS A', m - font * .04, cy - font * .15, font, C.paper, {maxWidth: w - m * 2});
        display(ctx, 'PROCESS.', m - font * .04, cy + font * .8, font, C.paper, {maxWidth: w - m * 2});
        if (p > .72) label(ctx, 'FROM RULES TO WORLDS.', m, cy + font * 1.13, C.yellow, mobile ? 10 : 12);
        ctx.restore();
        if (p > .87) circle(ctx, cx, cy, 2.8 + (1 - out) * 3, C.yellow);
        ctx.restore();
      }
      if (env.proof) {
        label(ctx, 'ONE POINT / ONE RULE / EVERY POSITION REPRODUCIBLE', m, h - (mobile ? 174 : 142), wipe > .5 ? C.paper : C.ink, mobile ? 8 : 10);
      }
      return {bg: wipe > .5 ? C.noir : C.paper, ink: wipe > .5 ? C.paper : C.ink,
        accent: wipe > .5 ? C.yellow : C.ink,
        phase: p < .08 ? 'HOLD' : p < .30 ? 'BUILD' : p < .64 ? 'REVEAL' : p < .87 ? 'BREAK' : 'HANDOFF',
        kicker: '00 / ZERO', caption: p < .08 ? 'SCROLL THROUGH THE ACT OF CREATION.' : p < .64 ? 'THE WORLD DOES NOT APPEAR FULLY FORMED.' : 'A WORLD BEGINS WITH A RULE.',
        source: '../natural-patterns/fibonacci.html', sourceLabel: 'FIBONACCI / PHYLLOTAXIS'};
    }
  };
})();
