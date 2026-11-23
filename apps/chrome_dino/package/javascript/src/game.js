'use strict';
/** Deterministic, graphics-independent Chrome-style runner for a 720-unit world. */
class Game {
    constructor(options) {
        this.random = options && options.random || Math.random;
        this.width = 1920;
        this.height = 720;
        this.floor = 606;
        this.reset();
    }
    resize(aspect) {
        if (!Number.isFinite(aspect) || aspect <= 0) return;
        this.width = 720 * aspect;
        this.x = Math.max(80, Math.min(235, this.width * 0.16));
    }
    reset() {
        this.state = 'ready';
        this.x = Math.max(80, Math.min(235, this.width * 0.16));
        this.score = 0;
        this.distance = 0;
        this.elapsed = 0;
        this.jumpY = 0;
        this.vy = 0;
        this.obstacles = [];
        this.spawnIn = 1.15;
        this.speed = 360;
    }
    action() {
        if (this.state === 'over') this.reset();
        if (this.state === 'ready') this.state = 'playing';
        if (this.state === 'playing' && this.jumpY <= 0) {
            this.jumpY = 0.01;
            this.vy = 710;
        }
    }
    step(dt) {
        if (this.state !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
        this.tick(Math.min(dt, 0.05));
    }
    tick(dt) {
        this.elapsed += dt;
        this.speed = Math.min(700, 360 + this.score * 0.65);
        this.distance += this.speed * dt;
        this.score = Math.floor(this.distance / 50);
        if (this.jumpY > 0 || this.vy > 0) {
            this.jumpY += this.vy * dt;
            this.vy -= 1850 * dt;
            if (this.jumpY <= 0) { this.jumpY = 0; this.vy = 0; }
        }
        this.spawnIn -= dt;
        if (this.spawnIn <= 0) {
            const r = this.random();
            let kind = 'cactus';
            if (this.score >= 110 && r < 0.22) kind = 'bird';
            else if (r > 0.73) kind = 'double';
            const width = kind === 'double' ? 83 : kind === 'bird' ? 68 : 43;
            const height = kind === 'bird' ? 30 : kind === 'double' ? 78 : 67;
            const high = kind === 'bird' && this.random() > 0.75;
            const top = kind === 'bird' ? this.floor - (high ? 123 : 56) : this.floor - height;
            this.obstacles.push({ x: this.width + 30, y: top, w: width, h: height, kind: kind });
            // Spacing in world units, so jump timing stays consistent as speed grows.
            this.spawnIn += (560 + this.random() * 310) / this.speed;
        }
        const dx = this.x + 13, dy = this.floor - 78 - this.jumpY + 7;
        const dw = 52, dh = 67;
        for (const o of this.obstacles) {
            o.x -= this.speed * dt;
            // Slightly generous hitboxes are more forgiving than the visible artwork.
            if (dx + dw - 7 > o.x + 5 && dx + 8 < o.x + o.w - 5 &&
                dy + dh - 3 > o.y + 4 && dy + 9 < o.y + o.h - 3) {
                this.state = 'over';
            }
        }
        this.obstacles = this.obstacles.filter(o => o.x + o.w > -50);
    }
}
module.exports = { Game };
