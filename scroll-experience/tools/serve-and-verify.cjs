/* Run local browser checks with a server in the same process/security context. */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end(); }
});
server.on('error', error => {console.error(error); process.exitCode = 1;});
server.listen(4173, '127.0.0.1', async () => {
  try {
    const names = process.argv.slice(2);
    for (const name of names.length ? names : ['verify-browser.cjs', 'verify-details.cjs', 'verify-revisions.cjs']) {
      if (!/^verify-[\w-]+\.cjs$/.test(name)) throw new Error('Expected a local verify-*.cjs script');
      const code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(__dirname, name)], {stdio:'inherit', windowsHide:true});
        child.on('error', reject); child.on('exit', resolve);
      });
      if (code !== 0) throw new Error(name + ' exited ' + code);
    }
  } catch (error) {console.error(error); process.exitCode = 1;}
  finally {server.close();}
});
