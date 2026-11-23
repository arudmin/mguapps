'use strict';
// Contract-level regression tests: no BMW SDK, network or vehicle required.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const EventEmitter = require('events');
const root = path.resolve(__dirname, '..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'apps/fx_drive/package/rhmiData/application.json'), 'utf8')).application;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
[app.uuid, app.stringBundleUuid, app.resourceBundleUuid].concat(app.entryPoints.map(e => e.uuid)).forEach(v => assert(uuid.test(v), 'Invalid UUID: ' + v));

async function scenario(reason) {
  const calls = [], errors = [];
  let instance;
  const comp = { on() {}, updateResources() { return Promise.resolve(); }, setValue() { return Promise.resolve(); }, setRowCount() { return Promise.resolve(); } };
  class MockOnlineApp extends EventEmitter {
    constructor() { super(); instance = this; this.startReason = reason; this.appDescription = { application: app }; this.rhmiApplication = {
      getByName() { return comp; }, mapEntryState() { calls.push('map'); return Promise.resolve(); },
      openEntryState() { calls.push('open'); return Promise.resolve(); }
    }; }
    getEntryPoints() { return [{ getDescription() { return app.entryPoints[0]; }, init() { calls.push('entry-init'); return Promise.resolve(); }, setAvailability() { calls.push('enabled'); return Promise.resolve(); } }]; }
    registerActive() { calls.push('active'); return Promise.resolve(); }
    initialized() { calls.push('ready'); return Promise.resolve(); }
    start() { this.emit('initialized'); return Promise.resolve(); }
  }
  const logger = { info() {}, warn() {}, error(e) { errors.push(e); } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'apps/fx_drive/src/fx_drive.js'), 'utf8'), {
    require(id) {
      if (id.indexOf('OnlineApp') >= 0) return MockOnlineApp;
      if (id.indexOf('logging') >= 0) return { getSDKLogger() { return logger; } };
      if (id === 'https') return { get() { throw new Error('offline test'); } };
      if (id === 'fs') return { readFileSync() { throw new Error('no cache'); } };
      return require(id);
    }, __dirname: path.join(root, 'apps/fx_drive/src'), setInterval() { return 1; }, clearInterval() {}
  });
  for (let i = 0; i < 40; i++) await Promise.resolve();
  assert.deepStrictEqual(errors, [], 'startup errors');
  assert(calls.includes('ready'), 'must notify initialized without network');
  if (reason === 'ENTRY_POINT') {
    assert(calls.includes('active'), 'foreground must registerActive');
    assert(calls.includes('open'), 'foreground must open the RHMI entry state');
  }
  instance.emit('entryPointExecute', app.entryPoints[0].uuid);
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert(calls.includes('open'), 'tile press must open entry state');
  console.log('PASS startup + tile activation + offline: ' + reason);
}
scenario('ENTRY_POINT').then(() => scenario('BACKGROUND')).then(() => console.log('PASS UUID validation')).catch(e => { console.error(e); process.exitCode = 1; });
