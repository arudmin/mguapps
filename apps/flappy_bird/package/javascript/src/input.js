'use strict';

const PUSH = {
    KEINE_BETAETIGUNG: 0,
    DREHGEBER_KURZ_GEDRUECKT: 1,
    DREHGEBER_LANG_GEDRUECKT: 2,
};

/** Single rising edge; no synthetic release on timeout (a held knob must not repeat). */
class Controls {
    constructor(action, opts) {
        this.action = action;
        this.now = opts && opts.now || Date.now;
        this.enabled = false;
        this.pressed = false;
        this.rendererAt = -Infinity;
        this.liveAt = -Infinity;
        this.actionAt = -Infinity;
    }
    enable(on) { this.enabled = !!on; }
    raw(value, source) {
        if (!value) return;
        let push = value.frontRotaryEncoderPushButton;
        if (typeof push === 'string' && Object.prototype.hasOwnProperty.call(PUSH, push)) push = PUSH[push];
        if (push !== 0 && push !== 1 && push !== 2) return;
        const now = this.now();
        if (source === 'renderer') this.rendererAt = now;
        else if (now - this.rendererAt <= 1000) return;
        this.liveAt = now;
        const down = push === 1 || push === 2;
        if (down && !this.pressed) this.fire(now);
        this.pressed = down;
    }
    fire(now) {
        if (!this.enabled || now - this.actionAt < 80) return;
        this.actionAt = now;
        this.action();
    }
    barClick() {
        const now = this.now();
        // Native CCU copies and the HMI action can describe the same physical press.
        if (now - this.liveAt <= 1500) return;
        this.fire(now);
    }
}

module.exports = { Controls, PUSH };
