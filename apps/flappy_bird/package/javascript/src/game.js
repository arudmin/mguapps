'use strict';
// Pure, deterministic simulation. World height is always 720 units; no browser APIs.
class Game {
    constructor(options) {
        this.random = options && options.random || Math.random;
        this.width = 1920;
        this.height = 720;
        this.reset();
    }
    resize(aspect) {
        if (!Number.isFinite(aspect) || aspect <= 0) return;
        this.width = 720 * aspect;
        this.x = Math.min(320, this.width * 0.22);
    }
    reset() {
        this.state = 'ready'; this.score = 0; this.y = 340; this.vy = 0;
        this.x = Math.min(320, this.width * 0.22);
        this.pipes = []; this.distance = 0; this.elapsed = 0;
        this.spawnIn = 1.15; this.accumulator = 0;
    }
    action() {
        if (this.state === 'over') this.reset();
        if (this.state === 'ready') this.state = 'playing';
        if (this.state === 'playing') this.vy = -350;
    }
    step(seconds) {
        if (this.state !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return;
        // Limit catch-up after scheduler stalls. Simulation stays at 120 Hz.
        this.accumulator += Math.min(seconds, 0.1);
        while (this.accumulator >= 1 / 120 && this.state === 'playing') {
            this.tick(1 / 120); this.accumulator -= 1 / 120;
        }
    }
    tick(dt) {
        const speed = 270, radius = 19, floor = 660, gap = 218, pipeWidth = 88;
        this.elapsed += dt; this.distance += speed * dt;
        this.vy += 960 * dt; this.y += this.vy * dt;
        this.spawnIn -= dt;
        if (this.spawnIn <= 0) {
            this.pipes.push({ x: this.width + pipeWidth, center: 195 + this.random() * 270, scored: false });
            this.spawnIn += 1.65;
        }
        if (this.y - radius <= 0 || this.y + radius >= floor) this.state = 'over';
        for (const p of this.pipes) {
            p.x -= speed * dt;
            // Circle vs rectangles: closest point test includes the pipe's corners.
            if (circleRect(this.x, this.y, radius, p.x, 0, pipeWidth, p.center - gap / 2) ||
                circleRect(this.x, this.y, radius, p.x, p.center + gap / 2, pipeWidth, floor - p.center - gap / 2)) this.state = 'over';
            if (!p.scored && p.x + pipeWidth < this.x - radius && this.state === 'playing') {
                p.scored = true; this.score++;
            }
        }
        this.pipes = this.pipes.filter(p => p.x > -pipeWidth);
    }
}
function circleRect(x, y, r, rx, ry, rw, rh) {
    const dx = x - Math.max(rx, Math.min(x, rx + rw));
    const dy = y - Math.max(ry, Math.min(y, ry + rh));
    return dx * dx + dy * dy <= r * r;
}
module.exports = { Game, circleRect };
