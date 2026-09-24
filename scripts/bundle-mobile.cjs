'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'mobile', 'www');
const required = ['index.html', 'styles.css', 'physics.js', 'progression.js', 'art.js', 'loot.js', 'game.js', 'privacy.html', 'manifest.webmanifest', 'icon.svg'];
for (const name of required) {
  if (!fs.existsSync(path.join(root, name))) throw new Error(`Required release asset missing: ${name}`);
}
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const manifest = [];
function copy(name) {
  const src = path.join(root, name), dest = path.join(out, name);
  if (fs.statSync(src).isDirectory()) {
    for (const child of fs.readdirSync(src).sort()) copy(path.posix.join(name, child));
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  manifest.push({ path: name, sha256: crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex'), bytes: fs.statSync(dest).size });
}
required.forEach(copy);
for (const dir of ['assets', 'fonts']) if (fs.existsSync(path.join(root, dir))) copy(dir);
// Native assets are shipped together. A browser service worker is unnecessary here;
// keeping it outside the bundle prevents a previous web cache replacing an app update.
fs.writeFileSync(path.join(out, 'release-manifest.json'), JSON.stringify({ version: require('../mobile/package.json').version, files: manifest }, null, 2) + '\n');
const bytes = manifest.reduce((sum, file) => sum + file.bytes, 0);
console.log(`Bundled ${manifest.length} local assets (${(bytes / 1048576).toFixed(2)} MiB) into mobile/www.`);
