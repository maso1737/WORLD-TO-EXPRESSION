/* Numerical/render-command regression for the reviewed period-2/4/3 branches.
   Uses the real model and scene, isolating three columns so neighboring r values
   cannot hide a lost branch. This is not a browser or visual-layout test. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const app = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(app, file), 'utf8');
const sceneSource = read('js/scenes/01-emergence.js');
const expectedPeriods = [2, 4, 3];
const viewports = [[1440, 900], [390, 844], [844, 390], [390, 650]];

function context2d() {
  const stack = [];
  return {
    fillStyle: '', globalAlpha: 1, rectangles: [], images: [],
    fillRect(x, y, w, h) { this.rectangles.push({x, y, w, h, color: this.fillStyle}); },
    drawImage(canvas) { this.images.push(canvas); },
    createImageData(width, height) { return {width, height, data: new Uint8ClampedArray(width * height * 4)}; },
    putImageData(pixels) { this.pixels = pixels; },
    save() { stack.push({fillStyle: this.fillStyle, globalAlpha: this.globalAlpha}); },
    restore() { Object.assign(this, stack.pop()); },
    translate() {}, beginPath() {}, rect() {}, clip() {}, fillText() {},
    moveTo() {}, lineTo() {}, stroke() {}
  };
}

function fixture(source) {
  const context = vm.createContext({
    document: {createElement() {
      const ctx = context2d();
      return {getContext: () => ctx};
    }}
  });
  context.window = context;
  for (const file of ['js/core.js', 'js/patterns.js']) vm.runInContext(read(file), context, {filename: file});
  const WTE = context.WTE, accesses = [[], [], []];
  const columns = [3.1, 3.5, 3.83].map((r, i) => {
    const column = WTE.patterns.bifurcation.reduce((a, b) => Math.abs(a.r - r) < Math.abs(b.r - r) ? a : b);
    assert.equal(new Set(column.values).size, expectedPeriods[i], `model period near r=${r}`);
    return {
      r: column.r,
      values: new Proxy(column.values, {get(target, key) {
        if (typeof key === 'string' && /^\d+$/.test(key)) accesses[i].push(Number(key));
        return Reflect.get(target, key, target);
      }})
    };
  });
  WTE.patterns.bifurcation = columns;
  vm.runInContext(source, context, {filename: '01-emergence.js'});
  return {WTE, accesses, columns};
}

function checkViewport(width, height, progress, source = sceneSource) {
  const {WTE, accesses, columns} = fixture(source), ctx = context2d();
  WTE.scenes[1].render(ctx, width, height, progress, {proof: false});
  const mode = progress < .96 ? 'cached-raster' : 'handoff';
  accesses.forEach((indices, i) => assert.deepEqual(indices, Array.from({length: 120}, (_, j) => j),
    `${width}x${height} ${mode}, r=${columns[i].r}: consume all 120 consecutive samples`));
  let branches;
  {
    assert.equal(ctx.images.length, 1, 'chart image is drawn');
    const pixels = ctx.images[0].getContext('2d').pixels;
    branches = columns.map((_, i) => {
      const mobile=width<600||width<height*.82,m=mobile?Math.max(24,width*.055):48;
      const plotW=width-m*2,t=WTE.range(progress,.96,1);
      const x = Math.floor(WTE.lerp(i/(columns.length-1)*plotW,width*.5-m+(i%2-.5)*80,t));
      let bands = 0, previous = false;
      for (let y = 0; y < pixels.height; y++) {
        const occupied = pixels.data[(y * pixels.width + x) * 4 + 3] > 0;
        if (occupied && !previous) bands++;
        previous = occupied;
      }
      return bands;
    });
  }
  assert.deepEqual(branches, expectedPeriods, `${width}x${height} ${mode}: retain period-2/4/3 branches`);
  return {viewport: `${width}x${height}`, mode, samplesPerColumn: accesses.map(a => a.length), branches,
    r: columns.map(column => column.r)};
}

const checks = viewports.flatMap(([w, h]) => [.95, .97].map(p => checkViewport(w, h, p)));
// Confirm the test rejects the original stride bug in each render path.
const loop = 'j < column.values.length; j++';
assert.equal(sceneSource.split(loop).length - 1, 1, 'one shared sample loop covers both paths');
const first = sceneSource.indexOf(loop);
for (const [offset, progress] of [[first, .95], [first, .97]]) {
  const regressed = sceneSource.slice(0, offset) + loop.replace('j++', 'j += mobile ? 3 : 2') + sceneSource.slice(offset + loop.length);
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    assert.throws(() => checkViewport(w, h, progress, regressed), /consume all 120 consecutive samples/,
      'the historical desktop/mobile stride regression must be detected');
  }
}
const report = {generated: new Date().toISOString(), passed: true,
  evidence: 'Node: real model, scene raster buffer and draw commands',
  checks, historicalStrideRegressionsRejected: 4};
fs.writeFileSync(path.join(app, 'verification/emergence-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
