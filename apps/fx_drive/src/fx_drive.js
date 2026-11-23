'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const OnlineApp = require('oap-sdk/src/core/OnlineApp.js');
const logging = require('oap-sdk/src/logging/logging');

const log = logging.getSDKLogger();
const BASE = 'EUR';
const CACHE = 'fx_drive_cache.json';
const DEMO = [
  ['USD / RUB', '92.18'],
  ['EUR / RUB', '101.42'],
  ['GBP / RUB', '118.64'],
  ['EUR / USD', '1.0990'],
  ['BTC / USD', '67 240'],
  ['ETH / USD', '3 520']
];

function requestJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'user-agent': 'FX-Drive/0.1', accept: 'application/json' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error('HTTP ' + res.statusCode));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

class FxDrive extends OnlineApp {
  constructor() {
    super();
    this._components = {};
    this._entry = null;
    this._cache = null;
    this._status = 'Connecting…';
    this._source = 'Frankfurter / ECB';
    this._updated = '';
    this.on('initialized', () => this._onInitialized().catch((e) => log.error('init: ' + e.message)));
    this.on('entryPointExecute', (uuid) => {
      if (this.rhmiApplication && this._entry && uuid === this._entry.uuid) {
        Promise.resolve(this.rhmiApplication.openEntryState(uuid)).catch((e) => log.warn('open: ' + e.message));
      }
    });
    this.on('shutdown', () => { if (this._timer) clearInterval(this._timer); });
  }

  async _onInitialized() {
    if (!this.rhmiApplication) return this.initialized();
    const rhmi = this.rhmiApplication;
    const root = rhmi.getByName('ST_OnlineApps_Store');
    if (!root) throw new Error('missing root RHMI state');
    ['ST_OnlineApps_Store', 'storeStatus', 'storeCheck', 'storeNavApps', 'storeNavTools', 'storeNavSources', 'storeNavPhone', 'storeAppList']
      .forEach((name) => { this._components[name] = rhmi.getByName(name); });
    const check = this._components.storeCheck;
    if (check) check.on('action', () => this.refresh());
    const apps = this._components.storeNavApps;
    if (apps) apps.on('action', () => this.refresh());
    await Promise.all(['ST_OnlineApps_Store'].map((name) => this._components[name].updateResources()));

    const description = this.appDescription && this.appDescription.application && this.appDescription.application.entryPoints && this.appDescription.application.entryPoints[0];
    const entry = this.getEntryPoints().find((item) => description && item.getDescription().uuid === description.uuid);
    if (!entry) throw new Error('entry point not handed over by manager');
    await entry.init();
    await rhmi.mapEntryState(description.uuid, root);
    await entry.setAvailability('ENABLED');
    this._entry = description;
    this._render();
    const ready = this.initialized();
    this.refresh().catch((e) => log.warn('refresh: ' + e.message));
    this._timer = setInterval(() => this.refresh(), 15 * 60 * 1000);
    return ready;
  }

  _dataFile() {
    return path.join(__dirname, '..', '..', 'data', CACHE);
  }

  _loadCache() {
    try { return JSON.parse(fs.readFileSync(this._dataFile(), 'utf8')); } catch (e) { return null; }
  }

  _saveCache(data) {
    try {
      const dir = path.dirname(this._dataFile());
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this._dataFile(), JSON.stringify(data));
    } catch (e) { log.warn('cache: ' + e.message); }
  }

  async refresh() {
    if (this._busy) return;
    this._busy = true;
    this._status = 'Updating…';
    this._render();
    try {
      const json = await requestJson('https://api.frankfurter.dev/v1/latest?base=' + BASE + '&symbols=USD,RUB,GBP', 6000);
      const rates = json.rates || {};
      let crypto = {};
      try { crypto = await requestJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd', 6000); } catch (e) { log.warn('crypto unavailable: ' + e.message); }
      const rows = [
        ['USD / RUB', rates.RUB && rates.USD ? rates.RUB / rates.USD : null],
        ['EUR / RUB', rates.RUB],
        ['GBP / RUB', rates.RUB && rates.GBP ? rates.RUB / rates.GBP : null],
        ['EUR / USD', rates.USD],
        ['BTC / USD', crypto.bitcoin && crypto.bitcoin.usd],
        ['ETH / USD', crypto.ethereum && crypto.ethereum.usd]
      ];
      const cache = { rows, date: json.date || new Date().toISOString(), source: 'Frankfurter / ECB' };
      this._cache = cache; this._updated = cache.date; this._source = cache.source; this._status = 'LIVE REFERENCE'; this._saveCache(cache);
    } catch (e) {
      this._cache = this._cache || this._loadCache();
      this._status = this._cache ? 'CACHED / OFFLINE' : 'DEMO / OFFLINE';
      if (this._cache) { this._updated = this._cache.date || ''; this._source = this._cache.source || 'Local cache'; }
      log.warn('rates unavailable: ' + e.message);
    }
    this._busy = false;
    this._render();
  }

  _rows() {
    if (!this._cache || !Array.isArray(this._cache.rows)) return DEMO;
    return this._cache.rows.map((row, index) => [row[0], row[1] == null ? DEMO[index][1] : Number(row[1]).toFixed(index === 3 ? 4 : 2)]);
  }

  _set(name, row, cell, value, type) {
    const component = this._components[name];
    if (component) Promise.resolve(component.setValue(row || 0, cell, value, type)).catch((e) => log.warn('ui: ' + e.message));
  }

  _render() {
    const status = [this._status, this._updated].filter(Boolean).join(' · ');
    this._set('storeStatus', 0, 'Text', status, 'Text');
    this._set('storeCheck', 0, 'Text', 'Refresh rates', 'Text');
    this._set('storeNavApps', 0, 'Text1stCol', 'FX Drive', 'Text');
    this._set('storeNavApps', 0, 'Text2ndCol', this._source, 'Text');
    this._set('storeNavTools', 0, 'Text1stCol', 'Primary', 'Text');
    this._set('storeNavTools', 0, 'Text2ndCol', 'EUR / RUB', 'Text');
    this._set('storeNavSources', 0, 'Text1stCol', 'Updated', 'Text');
    this._set('storeNavSources', 0, 'Text2ndCol', this._updated || 'waiting', 'Text');
    const list = this._components.storeAppList;
    const rows = this._rows();
    if (!list) return;
    Promise.resolve(list.setRowCount(rows.length)).then(() => rows.forEach((row, i) => {
      this._set('storeAppList', i, 'Text1stCol', row[0], 'Text');
      this._set('storeAppList', i, 'Text2ndCol', row[1], 'Text');
    })).catch((e) => log.warn('rows: ' + e.message));
  }
}

new FxDrive().start().catch((e) => log.error('start: ' + e.message));
