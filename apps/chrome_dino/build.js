'use strict';
/** Offline OAP packer. Node >=8.16; no npm, Python, BMW SDK or network.
 * From repository root: node apps/chrome_dino/build.js --preview-only
 * Store supplies MGU_OUT and optional id/version/app-directory arguments.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const args = process.argv.slice(2);
const preview = args.indexOf('--preview-only') >= 0;
const values = args.filter(function (a) { return a !== '--preview-only'; });
const appDir = values[2] ? path.resolve(values[2]) : __dirname;
const tree = path.join(appDir, 'package');
const pkg = JSON.parse(fs.readFileSync(path.join(tree, 'package.json'), 'utf8'));
const spec = JSON.parse(fs.readFileSync(path.join(appDir, 'app.json'), 'utf8'));
const id = values[0] || spec.id;
const version = values[1] || spec.version;
if (!/^[a-z][a-z0-9_-]{0,63}$/.test(id) || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid id/version');
if (pkg.version !== spec.version) throw new Error('app.json and package/package.json versions differ');
const oldId = pkg.name;
const renamed = oldId !== id;
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
    if (renamed) text = text.split(oldId).join(id).replace(/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi, uuidAlias);
    return text;
}
const entries = [];
function walk(dir, prefix) {
    fs.readdirSync(dir).sort().forEach(function (name) {
        if (name === '.DS_Store' || name.indexOf('._') === 0) return;
        const file = path.join(dir, name), rel = prefix ? prefix + '/' + name : name;
        const st = fs.lstatSync(file);
        if (st.isSymbolicLink()) throw new Error('No symlinks allowed: ' + rel);
        if (name === 'node_modules' || name === 'oap-sdk') throw new Error('Do not redistribute dependencies or BMW SDK');
        if (st.isDirectory()) { walk(file, rel); return; }
        if (!st.isFile()) throw new Error('Not a regular file: ' + rel);
        let data = fs.readFileSync(file);
        if (/\.(json|xml|js)$/.test(rel)) data = Buffer.from(adapt(data.toString('utf8')));
        const outputName = renamed ? rel.split(oldId).join(id) : rel;
        if (rel === 'package.json') {
            const p = JSON.parse(data.toString('utf8'));
            p.name = id; p.version = version;
            data = Buffer.from(JSON.stringify(p, null, 2) + '\n');
        } else if (rel === 'npm-shrinkwrap.json' || rel === 'javascript/kit/app-spec.json') {
            const p = JSON.parse(data.toString('utf8')); p.version = version;
            data = Buffer.from(JSON.stringify(p, null, 2) + '\n');
        } else if (rel === 'rhmiData/application.json') {
            const p = JSON.parse(data.toString('utf8')); p.application.version = version;
            data = Buffer.from(JSON.stringify(p, null, 2) + '\n');
        }
        entries.push({name: outputName, data: data});
    });
}
walk(tree, '');
const byName = Object.create(null);
entries.forEach(function (e) { if (byName[e.name]) throw new Error('Duplicate file: ' + e.name); byName[e.name] = e; });
['package.json', 'manifest.json', 'permissions.json', 'javascript/app.js',
 'javascript/src/game.js', 'javascript/src/input.js', 'javascript/src/render.js',
 'javascript/kit/mgu.js', 'javascript/kit/record.js', 'javascript/kit/app-spec.json',
 'rhmiData/uiDescriptions/ID7/application.xml', 'rhmiData/uiDescriptions/ID8/application.xml',
 'LICENSE', 'NOTICE', 'third-party/idrive7-apps-LICENSE'].forEach(function (name) {
    if (!byName[name]) throw new Error('Missing required file: ' + name);
});
// Resolve all literal local requires without running the SDK-dependent application.
entries.forEach(function (e) {
    if (!/\.js$/.test(e.name)) return;
    const code = e.data.toString('utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const rx = /require\(['"](\.[^'"]+)['"]\)/g;
    let match;
    while ((match = rx.exec(code))) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(e.name), match[1]));
        if (!byName[target] && !byName[target + '.js'] && !byName[target + '.json']) throw new Error('Missing local require: ' + e.name + ' -> ' + match[1]);
    }
});
if (preview) {
    console.log('OFFLINE CHECK OK: ' + id + '@' + version + ', ' + entries.length + ' files, ID7 + ID8, no BMW SDK; no archive written');
} else {
    const parts = [];
    function octal(n, len) { return n.toString(8).padStart(len - 1, '0') + '\0'; }
    entries.forEach(function (e) {
        const h = Buffer.alloc(512), bytes = Buffer.byteLength(e.name);
        if (bytes > 100) throw new Error('Archive path too long: ' + e.name);
        h.write(e.name, 0, 100); h.write(octal(420,8),100);
        h.write(octal(0,8),108); h.write(octal(0,8),116);
        h.write(octal(e.data.length,12),124); h.write(octal(0,12),136);
        h.fill(32,148,156); h.write('0',156); h.write('ustar\0',257); h.write('00',263);
        let checksum = 0; for (let i=0;i<h.length;i++) checksum += h[i];
        h.write(octal(checksum,7) + ' ',148);
        parts.push(h,e.data);
        const padding = (512-e.data.length%512)%512;
        if (padding) parts.push(Buffer.alloc(padding));
    });
    parts.push(Buffer.alloc(1024));
    const result = zlib.gzipSync(Buffer.concat(parts), {level:9});
    result[9] = 3; // stable gzip OS marker
    const outDir = process.env.MGU_OUT ? path.resolve(process.env.MGU_OUT) : path.join(appDir, 'dist');
    function mkdir(dir) { if (!fs.existsSync(dir)) { mkdir(path.dirname(dir)); fs.mkdirSync(dir); } }
    mkdir(outDir);
    const out = path.join(outDir, id + '@' + version + '.tgz');
    fs.writeFileSync(out, result);
    console.log('Built ' + out + ' (' + entries.length + ' files, SDK supplied by Store on the head unit)');
}
