'use strict';
// Original offline dinosaur runner, fixed-step physics; no browser dependencies.
class Game {
  constructor(options) { this.random = options && options.random || Math.random; this.width = 1920; this.height = 720; this.reset(); }
  resize(aspect) { if (!Number.isFinite(aspect) || aspect <= 0) return; this.width = 720 * aspect; this.x = Math.min(260, this.width * 0.18); }
  reset() {
    this.state = 'ready'; this.score = 0; this.elapsed = 0; this.distance = 0;
    this.floor = 622; this.x = Math.min(260, this.width * 0.18); this.y = this.floor;
    this.vy = 0; this.speed = 440; this.obstacles = []; this.clouds = [];
    this.spawnIn = 1.3; this.cloudIn = 0.5; this.accumulator = 0;
  }
  action() {
    if (this.state === 'over') { this.reset(); this.state = 'playing'; return; }
    if (this.state === 'ready') { this.state = 'playing'; return; }
    if (this.state === 'playing' && this.y >= this.floor - 0.1) this.vy = -850;
  }
  step(seconds) {
    if (this.state !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return;
    this.accumulator += Math.min(0.1, seconds);
    while (this.accumulator >= 1 / 120 && this.state === 'playing') { this.tick(1 / 120); this.accumulator -= 1 / 120; }
  }
  tick(dt) {
    this.elapsed += dt;
    this.speed = Math.min(890, 440 + this.elapsed * 9);
    this.distance += this.speed * dt;
    this.vy += 2250 * dt; this.y += this.vy * dt;
    if (this.y > this.floor) { this.y = this.floor; this.vy = 0; }
    this.cloudIn -= dt;
    if (this.cloudIn <= 0) {
      this.clouds.push({ x: this.width + 100, y: 130 + this.random() * 175 });
      this.cloudIn = 1.5 + this.random() * 1.7;
    }
    this.clouds.forEach(c => { c.x -= this.speed * dt * 0.18; });
    this.clouds = this.clouds.filter(c => c.x > -100);
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const bird = this.elapsed > 13 && this.random() < 0.24;
      const height = bird ? 32 : (this.random() < 0.5 ? 48 : 72);
      const offset = bird ? (this.random() < 0.5 ? 43 : 100) : 0;
      this.obstacles.push({ x: this.width + 60, y: this.floor - offset, w: bird ? 58 : (height > 60 ? 32 : 25), h: height, type: bird ? 'bird' : 'cactus', scored: false });
      this.spawnIn = Math.max(0.78, 1.5 - this.elapsed * 0.011) + this.random() * 0.55;
    }
    const d = { x: this.x - 17, y: this.y - 54, w: 42, h: 52 };
    for (const o of this.obstacles) {
      o.x -= this.speed * dt;
      if (!o.scored && o.x + o.w < this.x - 20) { o.scored = true; this.score++; }
      if (rectsOverlap(d, { x: o.x + 4, y: o.y - o.h + 4, w: o.w - 8, h: o.h - 5 })) this.state = 'over';
    }
    this.obstacles = this.obstacles.filter(o => o.x > -100);
  }
}
function rectsOverlap(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
module.exports = { Game, rectsOverlap };
