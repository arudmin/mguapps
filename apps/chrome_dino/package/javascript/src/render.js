'use strict';
/** All-vector pixel art: no external image fetches or browser APIs. */
function draw(cv, game, w, h, best) {
    const sx = w / game.width, sy = h / 720;
    const ink = '#535353', pale = '#f7f7f7', mid = '#949494';
    function rect(x, y, ww, hh, color) {
        if (ww > 0 && hh > 0) cv.fillRect(x * sx, y * sy, ww * sx, hh * sy, color);
    }
    function text(s, x, y, size, color, align) {
        cv.text(String(s), x * sx, y * sy, size * sy, color, { align: align || 'left', font: 'bold' });
    }
    const floor = game.floor;
    rect(0, 0, game.width, 720, pale);
    // Sparse clouds, drifting slower than the ground.
    for (let i = 0; i < Math.ceil(game.width / 350) + 2; i++) {
        const cx = i * 350 + 70 - (game.distance * 0.09 % 350), cy = 125 + (i % 3) * 43;
        rect(cx, cy + 10, 81, 4, '#cdcdcd'); rect(cx + 13, cy + 6, 20, 4, '#cdcdcd');
        rect(cx + 32, cy, 30, 6, '#cdcdcd'); rect(cx + 59, cy + 6, 18, 4, '#cdcdcd');
    }
    rect(0, floor, game.width, 4, ink);
    for (let i = 0; i < Math.ceil(game.width / 68) + 2; i++) {
        const x = i * 68 - game.distance % 68;
        rect(x, floor + 21 + (i % 3) * 5, 18 + (i * 7 % 19), 3, mid);
        if (i % 5 === 0) rect(x + 28, floor + 32, 7, 3, mid);
    }
    for (const o of game.obstacles) {
        if (o.kind === 'bird') {
            const wing = Math.floor(game.elapsed * 9) % 2 === 0;
            rect(o.x + 11, o.y + 10, 46, 15, ink);
            rect(o.x + 53, o.y + 15, 15, 7, ink);
            rect(o.x + 8, o.y + 15, 12, 7, ink);
            rect(o.x + 47, o.y + 12, 4, 4, pale);
            rect(o.x + 45, o.y + 12, 2, 2, ink);
            if (wing) {
                rect(o.x + 24, o.y, 20, 12, ink); rect(o.x + 19, o.y + 2, 9, 9, ink);
            } else {
                rect(o.x + 19, o.y + 24, 28, 6, ink); rect(o.x + 24, o.y + 29, 18, 6, ink);
            }
        } else {
            // Pixel cacti, with branches; double obstacles contain two different stems.
            function cactus(x, top, height, ww) {
                rect(x + 10, top, ww - 19, height, ink);
                rect(x + 5, top + 5, ww - 9, 9, ink);
                rect(x + 1, top + height * 0.50, 10, 10, ink);
                rect(x - 4, top + height * 0.30, 9, height * 0.26, ink);
                rect(x + ww - 12, top + height * 0.36, 13, 9, ink);
                rect(x + ww - 3, top + height * 0.17, 9, height * 0.25, ink);
            }
            if (o.kind === 'double') {
                cactus(o.x + 5, floor - 57, 57, 32);
                cactus(o.x + 43, floor - 78, 78, 35);
            } else cactus(o.x + 5, o.y, o.h, 33);
        }
    }
    const x = game.x, y = floor - 78 - game.jumpY;
    // Original pixel-dino silhouette (not copied sprite assets).
    rect(x + 33, y, 38, 10, ink);
    rect(x + 33, y + 8, 44, 22, ink);
    rect(x + 29, y + 26, 42, 12, ink);
    rect(x + 30, y + 35, 22, 14, ink);
    rect(x + 13, y + 42, 42, 22, ink);
    rect(x + 7, y + 50, 12, 10, ink);
    rect(x + 1, y + 45, 8, 9, ink);
    rect(x + 19, y + 60, 33, 8, ink);
    rect(x + 58, y + 19, 19, 9, ink);
    rect(x + 62, y + 29, 8, 4, ink);
    rect(x + 45, y + 13, 6, 6, pale);
    rect(x + 48, y + 14, 3, 3, ink);
    rect(x + 49, y + 43, 5, 8, ink); // little arm
    const running = Math.floor(game.elapsed * 13) % 2 === 0;
    if (game.jumpY > 0 || game.state !== 'playing') {
        rect(x + 23, y + 66, 10, 12, ink);
        rect(x + 43, y + 66, 10, 12, ink);
    } else if (running) {
        rect(x + 21, y + 65, 10, 13, ink);
        rect(x + 41, y + 65, 17, 7, ink);
    } else {
        rect(x + 22, y + 65, 15, 7, ink);
        rect(x + 44, y + 65, 10, 13, ink);
    }
    text('CHROME DINO GAME / MGU', 35, 50, 24, ink);
    text(String(game.score).padStart(5, '0'), game.width - 34, 55, 31, ink, 'right');
    text('HI ' + String(Math.max(best, game.score)).padStart(5, '0'), game.width - 235, 55, 28, mid, 'right');
    text('PUSH iDRIVE = JUMP    |    BACK = MENU', game.width / 2, 689, 21, mid, 'center');
    if (game.state !== 'playing') {
        const cx = game.width / 2;
        const pw = Math.min(700, game.width - 20);
        rect(cx - pw / 2, 191, pw, 248, pale);
        rect(cx - pw / 2, 191, pw, 3, ink);
        text(game.state === 'over' ? 'GAME OVER' : 'T-REX RUNNER', cx, 262, 43, ink, 'center');
        text(game.state === 'over' ? 'SCORE ' + game.score + '   BEST ' + Math.max(best, game.score) : 'JUMP OVER CACTI AND BIRDS', cx, 316, 24, mid, 'center');
        text('PRESS CENTRAL iDRIVE CONTROLLER', cx, 375, 25, ink, 'center');
        text('PLAY ONLY WHILE PARKED', cx, 415, 18, mid, 'center');
    }
    return cv;
}
module.exports = { draw };
