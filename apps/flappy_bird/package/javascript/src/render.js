'use strict';
// Original vector artwork. Shared by the MGU Recorder and the desktop preview.
function draw(cv, game, w, h, best) {
    const sx = w / game.width, sy = h / 720;
    function rect(x, y, a, b, color) { cv.fillRect(x * sx, y * sy, a * sx, b * sy, color); }
    function circle(x, y, r, color) { cv.circle(x * sx, y * sy, r * sy, color); }
    function text(s, x, y, size, color, align) { cv.text(s, x * sx, y * sy, size * sy, color, { align: align || 'left', font: 'bold' }); }
    rect(0, 0, game.width, 720, '#071827');
    // Distant city: deterministic, moving slowly, no textures or downloads.
    for (let i = 0; i < Math.ceil(game.width / 95) + 2; i++) {
        const x = i * 95 - (game.distance * 0.15 % 95);
        const bh = 50 + (i * 37 % 100);
        rect(x, 660 - bh, 70, bh, '#112e40');
        rect(x + 10, 675 - bh, 4, 8, '#1b5260');
    }
    for (const p of game.pipes) {
        const top = p.center - 109, bottom = p.center + 109;
        rect(p.x, 0, 88, top, '#087d86'); rect(p.x + 8, 0, 8, top, '#16b6bb');
        rect(p.x - 4, top - 22, 96, 22, '#43e0c6');
        rect(p.x, bottom, 88, 660 - bottom, '#087d86');
        rect(p.x + 8, bottom, 8, 660 - bottom, '#16b6bb');
        rect(p.x - 4, bottom, 96, 22, '#43e0c6');
    }
    rect(0, 660, game.width, 4, '#43e0c6'); rect(0, 664, game.width, 56, '#0c2535');
    for (let i = 0; i < game.width / 60 + 2; i++) rect(i * 60 - game.distance % 60, 680, 26, 3, '#1b4659');
    const by = game.y, bx = game.x;
    circle(bx, by, 23, '#ffcc55'); circle(bx - 9, by + 5, 12, '#f59a38');
    circle(bx + 10, by - 8, 8, '#ffffff'); circle(bx + 13, by - 8, 4, '#071827');
    rect(bx + 19, by + 2, 17, 8, '#ff794b');
    text('FLAPPY / MGU', 32, 48, 24, '#82b7cc');
    text(String(game.score), game.width / 2, 85, 64, '#ffffff', 'center');
    text('BEST ' + best, game.width - 32, 48, 24, '#82b7cc', 'right');
    text('PRESS CONTROLLER = FLAP   /   BACK = MENU', game.width / 2, 704, 18, '#82b7cc', 'center');
    if (game.state !== 'playing') {
        const cx = game.width / 2, panelW = Math.min(640, game.width - 32);
        rect(cx - panelW / 2, 200, panelW, 260, '#102d40');
        rect(cx - panelW / 2, 200, panelW, 3, '#43e0c6');
        text(game.state === 'over' ? 'FLIGHT COMPLETE' : 'READY TO FLY?', cx, 270, 38, '#ffffff', 'center');
        text(game.state === 'over' ? 'SCORE ' + game.score + '   /   BEST ' + best : 'ONE CLICK. ONE FLAP.', cx, 325, 26, '#43e0c6', 'center');
        text('PRESS THE CENTRAL CONTROLLER', cx, 385, 23, '#ffffff', 'center');
        text('Parked use only', cx, 425, 19, '#82b7cc', 'center');
    }
    return cv;
}
module.exports = { draw };
