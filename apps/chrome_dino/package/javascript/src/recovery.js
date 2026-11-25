'use strict';
const MODES = ['easy', 'normal', 'hard', 'extreme'];
const CODE = /^[a-f0-9]{32}$/;

function readProfile(result) {
    const profile = result && result.profile;
    if (!profile || typeof profile.nickname !== 'string' || !/^[A-Za-z0-9_-]{3,16}$/.test(profile.nickname) ||
        !profile.records) return null;
    const records = MODES.map(mode => profile.records[mode]);
    if (!records.every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000)) return null;
    return { nickname: profile.nickname, originalNickname: profile.original_nickname, records };
}

function buttons(screen, pending) {
    const button = (id, x, w) => ({ id, x, y: 345, w, h: 58 });
    if (screen === 'keyboard') return [];
    if (screen === 'code') return [button('done', 420, 330)];
    if (screen === 'found') return [button('startNew', 242, 328), button('restore', 600, 328)];
    if (pending) return [button('later', 420, 330)];
    return [button('later', 242, 214), button('startNew', 478, 214), button('enter', 714, 214)];
}

const keys = [];
['01234567','89ABCDEF'].forEach((row, y) => {
    row.split('').forEach((id, x) => keys.push({ id, x: 261 + x * 82, y: 194 + y * 58, w: 74, h: 50, row: y }));
});
['LEFT', 'RIGHT', 'DEL', 'SAVE', 'BACK'].forEach((id, x) => {
    keys.push({ id, x: 261 + x * 132, y: 312, w: 120, h: 52, row: 2 });
});

module.exports = { CODE, readProfile, buttons, keys };
