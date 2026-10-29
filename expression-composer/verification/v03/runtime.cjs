const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const app = path.resolve(__dirname, '../..');
async function launch() {
  const temp = path.join(__dirname, 'browser-temp');
  fs.mkdirSync(temp, { recursive: true });
  process.env.TEMP = temp; process.env.TMP = temp;
  const { chromium } = require(process.env.EC_PLAYWRIGHT || 'C:/Users/so173/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.EC_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-gpu'] });
  return { browser, async close() { await browser.close(); if (path.resolve(temp).startsWith(__dirname + path.sep)) fs.rmSync(temp, { recursive: true, force: true }); } };
}
const saveImage = (file, url) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
module.exports = { fs, path, app, launch, saveImage, url: pathToFileURL(path.join(app, 'index.html')).href };
