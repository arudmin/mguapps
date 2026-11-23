'use strict';

const mgu = require('./kit/mgu');
const { Recorder } = require('./kit/record');
const Parked = require('./kit/parked');
const { Game } = require('./src/game');
const { draw } = require('./src/render');
const { Controls } = require('./src/input');
const { langOf, tr, languageChoices, languageNames } = require('./src/i18n');

const W = 1600, H = 520, STEP = 1 / 120, SPEED_TTL = 5000;

mgu.run({
    start(ctx) {
        const { ui, log, settings } = ctx;
        const game = new Game();
        const savedDifficulty = Number(settings.get('difficulty'));
        game.setDifficulty(Number.isFinite(savedDifficulty) ? savedDifficulty : 1);
        let best = Math.max(0, Number(settings.get('best')) || 0);
        let systemLanguage = 'en';
        const savedLanguage = settings.get('language');
        let languageChoice = languageChoices.indexOf(savedLanguage) >= 0 ? savedLanguage : 'auto';
        const currentLanguage = () => languageChoice === 'auto' ? systemLanguage : languageChoice;
        const phrases = () => tr(currentLanguage());
        let speedAt = -Infinity, speedValid = false;
        let going = false, closed = false, last = null, accumulator = 0, frameAt = -Infinity;
        let screenRecorder = null;

        // Parked.watch exposes speed(), but treats unknown as parked and permits <=3 km/h.
        // Observe its real polling callback to reject invalid, unknown and stale data too.
        const safetyCtx = Object.assign({}, ctx, {
            signals: {
                watch(service, instance, callbacks, logger, options) {
                    const original = callbacks.statusCarSpeed2;
                    const wrapped = Object.assign({}, callbacks, {
                        statusCarSpeed2(value) {
                            const k = value && value.speedVehicleCentreOfGravity;
                            speedValid = typeof k === 'number' && isFinite(k) && k >= 0 && k < 65535;
                            speedAt = Date.now();
                            original(value);
                            sync();
                        },
                    });
                    return ctx.signals.watch(service, instance, wrapped, logger, options);
                },
            },
        });
        let parked = null;
        const ctl = new Controls(() => {
            sync();
            if (going) game.action();
        });
        function safe() {
            return parked && speedValid && Date.now() - speedAt <= SPEED_TTL && parked.speed() === 0;
        }
        function shown() { return ui.isVisible('GAME') && (!ui.hasFocus || ui.hasFocus('GAME')); }
        function saveBest() {
            if (game.score > best) { best = game.score; settings.set('best', best); }
        }
        function menu() {
            const t = phrases();
            const reason = !safe() ? t.parked : t.ready;
            ui.text('MENU_INFO', reason + '  ' + t.best + ': ' + best);
            ui.text('BTN_PLAY', game.state === 'playing' ? t.continue_ : t.play);
            ui.text('BTN_DIFFICULTY', t.difficulty + ': ' + t.levels[game.difficulty] + ' (' + t.change + ')');
            ui.text('BTN_LANGUAGE', t.language + ': ' + (languageChoice === 'auto' ? t.auto : languageNames[languageChoice]) + ' (' + t.change + ')');
            ui.text('MENU_HELP', t.help);
        }
        function sync() {
            const go = !closed && shown() && !!safe();
            if (go !== going) {
                going = go;
                last = null; accumulator = 0; frameAt = -Infinity;
                ctl.enable(go);
                if (ctx.controller && ctx.controller.grab) ctx.controller.grab(go);
                if (!go) { saveBest(); menu(); }
            }
            if (!closed && shown() && !safe()) ui.open('MAIN');
        }
        // Do not add HMIContext/HMIContext2 proxies to the installation manifest:
        // on some ID7 firmwares their generation fails and blocks installation.
        // Auto is a best-effort locale fallback; manual language always works.
        try {
            const envLocale = String(process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || 'en');
            systemLanguage = langOf(envLocale.split('.')[0]);
        } catch (_) { systemLanguage = 'en'; }
        parked = Parked.watch(safetyCtx, log);
        ui.onClick('BTN_PLAY', () => {
            if (!safe()) { menu(); return; }
            if (game.state === 'over') game.reset();
            return ui.open('GAME');
        });
        ui.onClick('BTN_DIFFICULTY', () => {
            if (!safe()) { menu(); return; }
            saveBest();
            game.nextDifficulty();
            settings.set('difficulty', game.difficulty);
            menu();
        });
        ui.onClick('BTN_LANGUAGE', () => {
            const index = languageChoices.indexOf(languageChoice);
            languageChoice = languageChoices[(index + 1) % languageChoices.length];
            settings.set('language', languageChoice);
            menu();
        });
        ui.onClick('BTN_JUMP', () => { sync(); ctl.barClick(); });
        if (ctx.controller && ctx.controller.onInput) {
            ctx.controller.onInput((value) => { sync(); ctl.raw(value, 'renderer'); });
        }
        ctx.signals.watch('de.bmw.infotainment.controlelements.FrontCCU', '1', {
            statusRotaryEncoderState(value) { sync(); ctl.raw(value, 'signals'); },
        }, log).then((s) => { if (s.error) log.warn('controller: ' + s.error); });
        if (ui.onFocus) ui.onFocus(sync);
        if (ui.onVisible) ui.onVisible(() => { sync(); if (ui.isVisible('MAIN')) menu(); });
        const safetyTimer = setInterval(sync, 100);
        function stop() {
            if (closed) return;
            closed = true; going = false; ctl.enable(false);
            last = null; accumulator = 0;
            clearInterval(safetyTimer);
            if (ctx.controller && ctx.controller.grab) ctx.controller.grab(false);
            saveBest();
        }
        if (ctx.app && ctx.app.on) ctx.app.on('shutdown', stop);
        process.on('exit', stop);
        process.on('SIGTERM', () => { stop(); process.exit(0); });
        process.on('SIGINT', () => { stop(); process.exit(0); });

        ctx.loop('GAME', 30, () => {
            sync();
            if (!going) return;
            const now = Date.now();
            const cv = ctx.canvas(W, H).clear('#000000');
            const pl = cv.place;
            const full = pl && pl.full && pl.w > 0 && pl.h > 0;
            const w = full ? pl.w : W, h = full ? pl.h : H;
            game.resize(w / h);
            if (last !== null) accumulator += Math.max(0, Math.min((now - last) / 1000, 0.1));
            last = now;
            while (accumulator >= STEP) {
                if (game.state === 'playing') game.step(STEP);
                accumulator -= STEP;
            }
            saveBest();
            // ctx.loop's GPU path may tick at 60 Hz; explicitly limit presentation to 30.
            if (now - frameAt < 1000 / 30) return;
            frameAt = now;
            if (full) {
                if (!screenRecorder || screenRecorder.w !== w || screenRecorder.h !== h) screenRecorder = new Recorder(w, h);
                screenRecorder.reset();
                draw(screenRecorder, game, w, h, best);
                cv.xf(1, 0, 0).append(screenRecorder).xf();
            } else draw(cv, game, w, h, best);
            return ui.image('GAME_GFX', cv);
        });
        menu();
        log.info('Chrome Dino Game: strict stationary gate; 120 Hz physics, 30 fps presentation');
    },
});
