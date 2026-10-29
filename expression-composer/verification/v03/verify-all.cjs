// Final run: retain historical outputs, run v0.3 browsers sequentially (shared temp folder).
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const app = path.resolve(__dirname, '../..'), out = path.join(__dirname, 'regression');
fs.mkdirSync(out, { recursive: true });
const runs = [], env = { ...process.env, EC_VERIFY_OUT: out };
function run(args) {
  const r = cp.spawnSync(process.execPath, args, { cwd: app, env, encoding: 'utf8', windowsHide: true, timeout: 240000 });
  runs.push({ command: 'node ' + args.join(' '), pass: r.status === 0, stdout: r.stdout, stderr: r.stderr, error: r.error?.message });
  console.log(args.join(' '), r.status === 0 ? 'PASS' : 'FAIL');
}
for (const name of fs.readdirSync(path.join(app, 'js')).filter(n => n.endsWith('.js'))) run(['--check', 'js/' + name]);
for (const test of ['verify-model.mjs','verify-browser.cjs','v03/verify-causal.cjs','v03/verify-freeze.cjs','v03/verify-posters.cjs','v03/verify-screens.cjs']) run(['verification/' + test]);
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline/baseline.json'), 'utf8'));
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const integrity = Object.entries(baseline.hashes).map(([file, sha]) => ({ file, backupMatchesBaseline: digest(path.join(app, '_backup_v02', file)) === sha, appMatchesBaseline: digest(path.join(app, file)) === sha }));
const report = { date: new Date().toISOString(), runs, integrity, pass: runs.every(r => r.pass) && integrity.every(r => r.backupMatchesBaseline), temporaryFolders: [path.join(__dirname,'browser-temp'),path.join(out,'browser-temp')].filter(p => fs.existsSync(p)) };
fs.writeFileSync(path.join(__dirname,'final-results.json'), JSON.stringify(report,null,2)+'\n');
// Static last includes final generated reports as well as all JS syntax and local links.
run(['verification/verify-static.cjs']);
report.pass = report.pass && runs.at(-1).pass && !report.temporaryFolders.length;
fs.writeFileSync(path.join(__dirname,'final-results.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,failures:runs.filter(r=>!r.pass).map(r=>r.command),integrity}));
if(!report.pass)process.exitCode=1;
