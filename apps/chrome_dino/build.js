'use strict';
/**
 * Chrome Dino packer for mgu-store, Node >= 8.16, no npm / internet / BMW SDK.
 * Reuses the existing sibling apps/flappy_bird/package OAP shell, then overlays
 * Dino's game sources and metadata and invokes the proven Flappy offline packer.
 * The output is a standalone chrome_dino@<version>.tgz OAP source package.
 * No modifications are made to apps/flappy_bird.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const args = process.argv.slice(2);
const preview = args.indexOf('--preview-only') !== -1;
const values = args.filter(function (s) { return s !== '--preview-only'; });
const src = values[2] ? path.resolve(values[2]) : __dirname;
const donor = path.resolve(src, '..', 'flappy_bird');
const app = JSON.parse(fs.readFileSync(path.join(src, 'app.json'), 'utf8'));
const id = values[0] || app.id;
const version = values[1] || app.version;
if (!/^[a-z][a-z0-9_-]{0,63}$/.test(id) || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid id/version');
if (!fs.existsSync(path.join(donor, 'build.js')) || !fs.existsSync(path.join(donor, 'package', 'javascript', 'kit', 'mgu.js'))) {
    throw new Error('Missing sibling apps/flappy_bird; add this folder to the existing arudmin/mguapps repository');
}
function mkdir(p) {
    if (fs.existsSync(p)) return;
    mkdir(path.dirname(p)); fs.mkdirSync(p);
}
function copyTree(from, to) {
    mkdir(to);
    fs.readdirSync(from).forEach(function (name) {
        const source = path.join(from, name), target = path.join(to, name);
        const st = fs.lstatSync(source);
        if (st.isSymbolicLink()) throw new Error('Symlinks forbidden: ' + source);
        if (st.isDirectory()) copyTree(source, target);
        else if (st.isFile()) { mkdir(path.dirname(target)); fs.copyFileSync(source, target); }
        else throw new Error('Not a regular file: ' + source);
    });
}
function removeTree(p) {
    if (!fs.existsSync(p)) return;
    if (fs.lstatSync(p).isDirectory()) {
        fs.readdirSync(p).forEach(function (name) { removeTree(path.join(p, name)); });
        fs.rmdirSync(p);
    } else fs.unlinkSync(p);
}
function writeJson(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgu-chrome-dino-'));
try {
    copyTree(path.join(donor, 'package'), path.join(tmp, 'package'));
    // Overlay only the Dino-specific source code and icon over the donor's OAP shell.
    copyTree(path.join(src, 'package'), path.join(tmp, 'package'));
    const spec = Object.assign({}, app, { id: id, version: version });
    writeJson(path.join(tmp, 'app.json'), spec);
    const packageFile = path.join(tmp, 'package', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    // Keep donor's original package name so its packer renames IDs, resources and UUIDs.
    pkg.description = spec.description;
    pkg.version = version;
    pkg.oapAppSettings.loggingId = spec.loggingId;
    writeJson(packageFile, pkg);
    const kitSpecFile = path.join(tmp, 'package', 'javascript', 'kit', 'app-spec.json');
    const donorSpec = JSON.parse(fs.readFileSync(kitSpecFile, 'utf8'));
    donorSpec.id = id;
    donorSpec.version = version;
    donorSpec.title = spec.title;
    donorSpec.screens = spec.screens;
    donorSpec.settings = spec.settings;
    writeJson(kitSpecFile, donorSpec);
    // Update RHMI string IDs and entry-point labels. Names + UUIDs are finalized by the donor packer.
    function replaceText(dir) {
        fs.readdirSync(dir).forEach(function (name) {
            const file = path.join(dir, name);
            if (fs.statSync(file).isDirectory()) { replaceText(file); return; }
            if (!/\.(js|json|xml|txt|md|csv)$/.test(name)) return;
            let data = fs.readFileSync(file, 'utf8');
            data = data.replace(/FLAPPY_BIRD/g, 'CHROME_DINO')
                .replace(/Flappy Bird/g, 'Chrome Dino')
                .replace(/Flappy MGU/g, 'Chrome Dino')
                .replace(/\bFlap\b/g, 'Jump')
                .replace(/\bflap\b/g, 'jump');
            fs.writeFileSync(file, data);
        });
    }
    replaceText(path.join(tmp, 'package'));
    const env = Object.assign({}, process.env, {
        MGU_OUT: process.env.MGU_OUT || path.join(src, 'dist')
    });
    const childArgs = [path.join(donor, 'build.js'), id, version, tmp];
    if (preview) childArgs.push('--preview-only');
    const result = cp.spawnSync(process.execPath, childArgs, { stdio: 'inherit', env: env });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
    removeTree(tmp);
}
