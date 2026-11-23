'use strict';
/**
 * Chrome Dino Game offline OAP packer.
 * Uses apps/flappy_bird/package as a donor shell for BMW runtime / RHMI files,
 * overlays Chrome Dino's own sources and metadata, then packs a standalone .tgz.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const crypto = require('crypto');

const BASE_ID = 'flappy_bird';
// The donor provides only BMW/OAP transport glue; Dino's application logic is always replaced.
const OWN = ['javascript/app.js','javascript/src/game.js','javascript/src/render.js','javascript/src/input.js','javascript/kit/app-spec.json','package.json','rhmiData/application.json'];
const args = process.argv.slice(2);
const preview = args.indexOf('--preview-only') >= 0;
const values = args.filter((a) => a !== '--preview-only');
const srcDir = values[2] ? path.resolve(values[2]) : __dirname;
const app = JSON.parse(fs.readFileSync(path.join(srcDir, 'app.json'), 'utf8'));
const id = values[0] || app.id;
const version = values[1] || app.version;
const donorDir = path.resolve(srcDir, '..', 'flappy_bird', 'package');
if (!/^[a-z][a-z0-9_-]{0,63}$/.test(id) || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid id/version');
if (!fs.existsSync(path.join(donorDir, 'javascript', 'kit', 'mgu.js'))) throw new Error('Missing donor shell: apps/flappy_bird/package');
function mkdir(dir) { if (fs.existsSync(dir)) return; mkdir(path.dirname(dir)); fs.mkdirSync(dir); }
function copyTree(from, to) {
  mkdir(to);
  fs.readdirSync(from).forEach((name) => {
    const source = path.join(from, name), target = path.join(to, name);
    const st = fs.lstatSync(source);
    if (st.isSymbolicLink()) throw new Error('No symlinks allowed: ' + source);
    if (st.isDirectory()) copyTree(source, target);
    else if (st.isFile()) { mkdir(path.dirname(target)); fs.copyFileSync(source, target); }
    else throw new Error('Not a regular file: ' + source);
  });
}
function removeTree(p) { if (!fs.existsSync(p)) return; if (fs.lstatSync(p).isDirectory()) { fs.readdirSync(p).forEach((n) => removeTree(path.join(p, n))); fs.rmdirSync(p); } else fs.unlinkSync(p); }
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); }
const uuids = Object.create(null);
function uuidAlias(uuid) {
  if (!uuids[uuid]) {
    const b = crypto.createHash('sha1').update('chrome-dino:' + id + ':' + uuid).digest().slice(0, 16);
    b[6] = (b[6] & 15) | 80; b[8] = (b[8] & 63) | 128;
    const h = b.toString('hex');
    uuids[uuid] = h.slice(0,8) + '-' + h.slice(8,12) + '-' + h.slice(12,16) + '-' + h.slice(16,20) + '-' + h.slice(20);
  }
  return uuids[uuid];
}
function adapt(text) {
  return text
    .split(BASE_ID).join(id)
    .split('FLAPPY_BIRD').join(id.toUpperCase())
    .split('Flappy Bird').join('Chrome Dino Game')
    .split('Flappy MGU').join('Chrome Dino Game')
    .replace(/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi, uuidAlias);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgu-chrome-dino-'));
try {
  const tree = path.join(tmp, 'package');
  copyTree(donorDir, tree);
  copyTree(path.join(srcDir, 'package'), tree);
  OWN.forEach(function(rel) {
    if (!fs.existsSync(path.join(srcDir, 'package', rel))) throw new Error('Missing Dino-owned source: ' + rel);
  });
  const spec = Object.assign({}, app, { id: id, version: version });
  writeJson(path.join(tmp, 'app.json'), spec);
  const pkgFile = path.join(tree, 'package.json');
  if (fs.existsSync(pkgFile)) {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    pkg.name = id; pkg.version = version; pkg.description = spec.description;
    if (pkg.oapAppSettings) pkg.oapAppSettings.loggingId = spec.loggingId;
    writeJson(pkgFile, pkg);
  }
  const appSpecFile = path.join(tree, 'javascript', 'kit', 'app-spec.json');
  if (fs.existsSync(appSpecFile)) {
    const appSpec = JSON.parse(fs.readFileSync(appSpecFile, 'utf8'));
    appSpec.id = id; appSpec.title = spec.title; appSpec.version = version; appSpec.screens = spec.screens; appSpec.settings = spec.settings;
    writeJson(appSpecFile, appSpec);
  }
  const appRhmiFile = path.join(tree, 'rhmiData', 'application.json');
  if (fs.existsSync(appRhmiFile)) {
    const rhmi = JSON.parse(fs.readFileSync(appRhmiFile, 'utf8'));
    rhmi.application.name = id; rhmi.application.version = version;
    if (rhmi.application.entryPoints && rhmi.application.entryPoints[0]) { rhmi.application.entryPoints[0].name = 'CHROME_DINO_ENTRY'; rhmi.application.entryPoints[0].textId = 'SID_CHROME_DINO_TITLE'; rhmi.application.entryPoints[0].icon = 'chrome_dino_icon.png'; }
    writeJson(appRhmiFile, rhmi);
  }
  // Guard against shipping the old Flappy Bird game logic under Dino's application ID.
  ['javascript/app.js','javascript/src/game.js','javascript/src/render.js'].forEach(function(rel) {
    const data = fs.readFileSync(path.join(tree,rel),'utf8');
    if (/FLAPPY \/ MGU|FLIGHT COMPLETE|READY TO FLY|ONE CLICK\. ONE FLAP|class.*Flappy/i.test(data))
      throw new Error('Flappy game code leaked into Dino package: ' + rel);
  });
  const entries = [];
  function walk(dir, prefix) {
    fs.readdirSync(dir).sort().forEach((name) => {
      if (name === '.DS_Store' || name.indexOf('._') === 0) return;
      const file = path.join(dir, name), rel = prefix ? prefix + '/' + name : name;
      const st = fs.lstatSync(file);
      if (st.isSymbolicLink()) throw new Error('No symlinks allowed: ' + rel);
      if (name === 'node_modules' || name === 'oap-sdk') throw new Error('Do not redistribute dependencies or BMW SDK');
      if (st.isDirectory()) return walk(file, rel);
      if (!st.isFile()) throw new Error('Not a regular file: ' + rel);
      let data = fs.readFileSync(file);
      if (/\.(json|xml|js|txt|md)$/.test(rel)) data = Buffer.from(adapt(data.toString('utf8')));
      if (rel === 'package.json') {
        const p = JSON.parse(data.toString('utf8')); p.name = id; p.version = version; data = Buffer.from(JSON.stringify(p, null, 2) + '\n');
      } else if (rel === 'npm-shrinkwrap.json' || rel === 'javascript/kit/app-spec.json') {
        const p = JSON.parse(data.toString('utf8')); p.version = version; data = Buffer.from(JSON.stringify(p, null, 2) + '\n');
      } else if (rel === 'rhmiData/application.json') {
        const p = JSON.parse(data.toString('utf8')); p.application.version = version; data = Buffer.from(JSON.stringify(p, null, 2) + '\n');
      }
      entries.push({ name: rel, data: data });
    });
  }
  walk(tree, '');
  const byName = Object.create(null);
  entries.forEach((e) => { if (byName[e.name]) throw new Error('Duplicate file: ' + e.name); byName[e.name] = e; });
  ['package.json', 'manifest.json', 'permissions.json', 'javascript/app.js', 'javascript/src/game.js', 'javascript/src/input.js', 'javascript/src/render.js', 'javascript/kit/mgu.js', 'javascript/kit/record.js', 'javascript/kit/app-spec.json', 'rhmiData/uiDescriptions/ID7/application.xml', 'rhmiData/uiDescriptions/ID8/application.xml', 'LICENSE', 'NOTICE', 'third-party/idrive7-apps-LICENSE'].forEach((name) => { if (!byName[name]) throw new Error('Missing required file: ' + name); });
  entries.forEach((e) => {
    if (!/\.js$/.test(e.name)) return;
    const code = e.data.toString('utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const rx = /require\(['"](\.[^'"]+)['"]\)/g;
    let match; while ((match = rx.exec(code))) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(e.name), match[1]));
      if (!byName[target] && !byName[target + '.js'] && !byName[target + '.json']) throw new Error('Missing local require: ' + e.name + ' -> ' + match[1]);
    }
  });
  if (preview) console.log('OFFLINE CHECK OK: ' + id + '@' + version + ', ' + entries.length + ' files; no archive written');
  else {
    const parts = [];
    function octal(n, len) { return n.toString(8).padStart(len - 1, '0') + '\0'; }
    entries.forEach((e) => {
      const h = Buffer.alloc(512), bytes = Buffer.byteLength(e.name);
      if (bytes > 100) throw new Error('Archive path too long: ' + e.name);
      h.write(e.name, 0, 100); h.write(octal(420,8),100); h.write(octal(0,8),108); h.write(octal(0,8),116); h.write(octal(e.data.length,12),124); h.write(octal(0,12),136); h.fill(32,148,156); h.write('0',156); h.write('ustar\0',257); h.write('00',263);
      let checksum = 0; for (let i = 0; i < h.length; i++) checksum += h[i];
      h.write(octal(checksum,7) + ' ',148); parts.push(h, e.data); const padding = (512 - e.data.length % 512) % 512; if (padding) parts.push(Buffer.alloc(padding));
    });
    parts.push(Buffer.alloc(1024));
    const result = zlib.gzipSync(Buffer.concat(parts), { level: 9 }); result[9] = 3;
    const outDir = process.env.MGU_OUT ? path.resolve(process.env.MGU_OUT) : path.join(srcDir, 'dist'); mkdir(outDir);
    const out = path.join(outDir, id + '@' + version + '.tgz'); fs.writeFileSync(out, result); console.log('Built ' + out + ' (' + entries.length + ' files)');
  }
} finally { removeTree(tmp); }
