const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const app = path.resolve(__dirname, '..');
const files = ['index.html', 'styles.css', 'README.md'];
function walk(dir) { if (!fs.existsSync(path.join(app, dir))) return; for (const e of fs.readdirSync(path.join(app, dir), { withFileTypes: true })) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) { if (e.name !== 'screenshots' && e.name !== 'browser-temp') walk(rel); } else if (e.name !== 'static-results.json' && /\.(js|cjs|mjs|md|html|css|json)$/.test(e.name)) files.push(rel); } }
for (const dir of ['js', 'docs', 'verification']) walk(dir);
if (fs.existsSync(path.join(app, '_codex/REPORT_01.md'))) files.push('_codex/REPORT_01.md');
const report = { date: new Date().toISOString(), files: [], errors: [] };
for (const relative of [...new Set(files)]) {
  const file = path.join(app, relative);
  if (!fs.existsSync(file)) { report.errors.push('Missing ' + relative); continue; }
  const bytes = fs.readFileSync(file);
  let utf8 = true; try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { utf8 = false; }
  const row = { file: relative, utf8, cr: bytes.includes(13), bom: bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  if (!utf8 || row.cr || row.bom) report.errors.push('Encoding ' + relative);
  if (/\.(js|cjs|mjs)$/.test(relative)) { const r = cp.spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true }); row.syntax = r.status === 0; if (!row.syntax) report.errors.push(relative + ': ' + r.stderr); }
  report.files.push(row);
}
const html = fs.readFileSync(path.join(app, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(data:|https?:|#)/.test(m[1])) continue;
  if (!fs.existsSync(path.resolve(app, m[1]))) report.errors.push('Missing link: ' + m[1]);
}
report.summary = { files: report.files.length, syntax: report.files.filter(x => x.syntax).length, errors: report.errors.length };
fs.writeFileSync(path.join(__dirname, 'static-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary)); if (report.errors.length) { console.log(report.errors); process.exitCode = 1; }
