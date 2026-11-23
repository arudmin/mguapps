'use strict';
const assert = require('assert');
const { Game } = require('../package/javascript/src/game');
const g = new Game({ random: () => 0.5 });
assert.strictEqual(g.state, 'ready');
assert.strictEqual(g.score, 0);
g.resize(16 / 9);
g.action();
assert.strictEqual(g.state, 'playing');
assert(g.jumpY > 0);
const previousVy = g.vy;
g.action(); // no double jump in air
assert.strictEqual(g.vy, previousVy);
for (let i = 0; i < 100; i++) g.step(1 / 120);
assert.strictEqual(g.jumpY, 0);
assert(g.score > 0);
assert(g.obstacles.length > 0 || g.spawnIn > 0);
// Force an unavoidable collision to verify game-over and restart.
g.obstacles = [{x: g.x + 24, y: g.floor - 67, w: 43, h: 67, kind: 'cactus'}];
g.tick(1 / 120);
assert.strictEqual(g.state, 'over');
g.action();
assert.strictEqual(g.state, 'playing');
assert.strictEqual(g.score, 0);
assert(g.jumpY > 0);
console.log('Chrome Dino Game: physics, controller action and collision tests passed');
