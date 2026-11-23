'use strict';

/* Offline preview validator for FX Drive.
 * It never loads oap-sdk, talks to a HU, or opens a network connection.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'apps', 'fx_drive');
const packageDir = path.join(appDir, 'package');
const failures = [];
const checks = [];

function file(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { failures.push('missing file: ' + rel); return null; }
  checks.push(rel);
  return p;
}
function json(rel) {
  const p = file(rel);
  if (!p) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { failures.push('invalid JSON: ' + rel + ': ' + e.message); return null; }
}
function assert(condition, message) { if (!condition) failures.push(message); }

const repo = json('mgu-repo.json');
const manifest = json('apps/fx_drive/mgu-app.json');
const pkg = json('apps/fx_drive/package/package.json');
const app = json('apps/fx_drive/package/rhmiData/application.json');
const release = json('apps/fx_drive/release.json');

assert(repo && repo.schema === 1, 'mgu-repo.json must have schema 1');
const component = repo && repo.components && repo.components.filter((x) => x.id === 'fx_drive')[0];
assert(component && component.kind === 'app' && component.path === 'apps/fx_drive' && component.build === 'unit', 'mgu-repo.json must catalog fx_drive as a unit app');
assert(manifest && manifest.id === 'fx_drive' && manifest.tree === 'package' && manifest.internet === true, 'mgu-app.json must enable unit build and internet');
assert(pkg && pkg.name === 'fx_drive' && pkg.version === '0.1.0', 'package/package.json must name fx_drive@0.1.0');
assert(pkg && pkg.mguInternet === true && pkg.mguLocalOnly === true, 'package/package.json must declare mguInternet and mguLocalOnly');
assert(pkg && Array.isArray(pkg.mguHmi) && pkg.mguHmi.indexOf('ID7') >= 0 && pkg.mguHmi.indexOf('ID8') >= 0, 'package/package.json must target ID7 and ID8');
assert(manifest && Array.isArray(manifest.modules), 'mgu-app.json modules must be an array');
(manifest && manifest.modules || []).forEach((m) => assert(file(path.join('apps', 'fx_drive', m).replace(/\\/g, '/')), 'module is not present: ' + m));
assert(app && app.application && app.application.name === 'fx_drive', 'RHMI application name must be fx_drive');
assert(app && app.application && app.application.entryPoints && app.application.entryPoints[0] && app.application.entryPoints[0].icon === 'fx_drive.png', 'RHMI entry point must use fx_drive.png');
assert(release && release.requires && typeof release.requires === 'object', 'release.json must contain requires');

['ID7', 'ID8'].forEach((hmi) => {
  file(path.join('apps', 'fx_drive', 'package', 'rhmiData', 'uiDescriptions', hmi, 'application.xml').replace(/\\/g, '/'));
  const ui = json(path.join('apps', 'fx_drive', 'package', 'rhmiData', 'uiDescriptions', hmi, 'uiDescription.json').replace(/\\/g, '/'));
  assert(ui && ui.schemaVersion === '1.3.0', hmi + ' uiDescription must use schema 1.3.0');
});
const icon = file('apps/fx_drive/package/rhmiData/variantGroups/Common/images/fx_drive.png');
if (icon) checks.push('icon sha256=' + crypto.createHash('sha256').update(fs.readFileSync(icon)).digest('hex'));
const source = file('apps/fx_drive/src/fx_drive.js');
if (source) {
  try { new vm.Script(fs.readFileSync(source, 'utf8'), { filename: source }); checks.push('source syntax'); }
  catch (e) { failures.push('source syntax: ' + e.message); }
}
assert(!fs.existsSync(path.join(root, 'oap-sdk')), 'oap-sdk must not be present in offline preview');
assert(!fs.existsSync(path.join(packageDir, 'javascript')), 'generated javascript/ must not be committed');

console.log('FX Drive offline preview');
console.log('  root: ' + root);
console.log('  checks: ' + checks.length);
console.log('  sdk: not required');
console.log('  network: not used');
if (failures.length) {
  console.error('FAILED');
  failures.forEach((x) => console.error('  - ' + x));
  process.exitCode = 1;
} else {
  console.log('  result: PASS (static preview only)');
  console.log('  note: donor oap-sdk and a physical HU are required for Store installation testing');
}
