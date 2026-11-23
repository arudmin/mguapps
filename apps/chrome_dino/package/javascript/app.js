'use strict';

const mgu = require('./kit/mgu');
const { Recorder } = require('./kit/record');
const Parked = require('./kit/parked');
const { Game } = require('./src/game');
const { draw } = require('./src/render');
const { Controls } = require('./src/input');
const APP_VERSION = require('./kit/app-spec.json').version;
const i18n = require('./src/i18n');
const { Diag } = require('./kit/diag');
const { findVin } = require('./src/vin');

const W = 1600, H = 520, STEP = 1 / 120, SPEED_TTL = 5000;

mgu.run({
    start(ctx) {
        const { ui, log, settings } = ctx;
        const game = new Game();
        const savedDifficulty = Number(settings.get('difficulty'));
        game.setDifficulty(Number.isFinite(savedDifficulty) ? savedDifficulty : 1);
        let best = Math.max(0, Number(settings.get('best')) || 0);
        let languageChoice=settings.get('language')||'auto';
        if (['auto','ru','en'].indexOf(languageChoice)<0) languageChoice='auto';
        let systemLanguage=i18n.detect(ctx);
        let headLanguageRaw='';
        let headLanguageState='waiting';
        let headLanguageSource='not yet received';
        let vinState='checking...';
        function language(){return languageChoice==='auto'?systemLanguage:languageChoice;}
        function t(){return i18n.words(language());}
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
            const w=t();
            ui.text('BTN_PLAY', game.state==='playing'?w.continue_:w.play);
            if (ui.id8) {
                ui.text('BTN_DIFFICULTY',w.difficulty+': '+w.levels[game.difficulty]+' ('+w.change+')');
                ui.text('BTN_LANGUAGE',w.language+': '+(languageChoice==='auto'?w.auto:i18n.languageNames[languageChoice])+' ('+w.change+')');
                // ID8 has no RHMI drop-down widget; its buttons open dedicated option lists.
                w.levels.forEach((label,idx)=>ui.text('DIF_'+idx,(idx===game.difficulty?'✓ ':'')+label));
                ['auto','ru','en'].forEach((code,idx)=>{
                    const value=idx===0?w.auto:i18n.languageNames[code];
                    ui.text('LANG_'+idx,(code===languageChoice?'✓ ':'')+value);
                });
            } else {
                // ID7: the native HMI localizes drop-down headers and options
                // from StringId resources according to BMW's *actual* HMI locale.
                // Do NOT replace them using RHMI Text: this did not update the
                // Unicode HeaderText/ItemText cells on the user's ID7 firmware.
                // Only the selected numeric indices change dynamically.
                const diff=ui.comp('BTN_DIFFICULTY'),lng=ui.comp('BTN_LANGUAGE');
                if(diff)Promise.resolve(diff.setValue(0,'SelectedItem',game.difficulty,'UInt')).catch(e=>log.warn('difficulty selected: '+e));
                if(lng)Promise.resolve(lng.setValue(0,'SelectedItem',Math.max(0,['auto','ru','en'].indexOf(languageChoice)),'UInt')).catch(e=>log.warn('language selected: '+e));
            }
            ui.text('MENU_INFO',w.version+' '+APP_VERSION);
            ui.text('MENU_BEST',w.best+': '+best);
            ui.text('MENU_HELP',safe()?w.help:w.parked);
            const detected=headLanguageRaw||headLanguageState;
            const current=language();
            ui.text('MENU_BMW','BMW HMI: '+detected+'  ->  '+systemLanguage+'  |  UI: '+current);
            ui.text('MENU_VIN','VIN: '+vinState);
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
        // Exact BMW CommonTypes.Language via HMI_CID; signal read and subscription.
        // Manifest includes HMIContext so the unit generates its SOME/IP definition.
        // No guessed language from option 6UD; only real signal values are reported.
        try {
            ctx.signals.watch('de.bmw.infotainment.hmi.hmicontext.HMIContext','HMI_CID',{
                currentDisplayLanguage(value){
                    const raw=i18n.raw(value);
                    const next=i18n.langOf(value);
                    headLanguageRaw=raw;
                    headLanguageState=next?'received':'unrecognized';
                    headLanguageSource='HMIContext.currentDisplayLanguage';
                    if(next)systemLanguage=next;
                    log.info('BMW display language raw='+JSON.stringify(raw)+' resolved='+(next||'unknown'));
                    menu();
                }
            },log).then(function(sub){
                if(sub && sub.error) {
                    headLanguageState='error: '+String(sub.error).slice(0,52);
                    log.warn('BMW HMIContext: '+sub.error);
                } else if(sub && !sub.available && !headLanguageRaw){
                    headLanguageState='provider unavailable';
                }
                menu();
            }).catch(function(err){
                headLanguageState='error: '+String(err).slice(0,52);
                log.warn('BMW HMI language: '+err);
                menu();
            });
        } catch(err){
            headLanguageState='error: '+String(err).slice(0,52);
            log.warn('BMW HMI language setup: '+err);
        }
        // One read-only UDS request (22 F190) through BMW's existing TASU link.
        // Never transmit or log the VIN. Unsupported ECUs show a status instead.
        (async function probeVin() {
            try {
                const diag = await new Diag(ctx.signals, log).init();
                if (!diag.p) { vinState='diagnostics unavailable'; menu(); return; }
                const replies = await diag.functional(0x22,[0xF1,0x90],{idleMs:1800,maxMs:9000});
                const found=findVin(replies);
                vinState=found || 'not available (F190)';
                log.info('VIN read-only probe: '+(found?'available':'not available'));
            } catch(e) {
                vinState='read failed';
                log.warn('VIN read-only probe failed (no vehicle identifiers logged): '+String(e).slice(0,90));
            }
            menu();
        })();
        log.info('initial UI language='+systemLanguage+' selected='+languageChoice);
        parked = Parked.watch(safetyCtx, log);
        ui.onClick('BTN_PLAY', () => {
            if (!safe()) { menu(); return; }
            if (game.state === 'over') game.reset();
            return ui.open('GAME');
        });
        function chooseDifficulty(index) {
            if (!Number.isInteger(index)||index<0||index>3)return;
            if (!safe()) { menu(); return; }
            saveBest();
            game.setDifficulty(index);
            settings.set('difficulty',game.difficulty);
            menu();
        }
        function chooseLanguage(index) {
            const choices=['auto','ru','en'];
            if (!Number.isInteger(index)||index<0||index>=choices.length)return;
            languageChoice=choices[index];
            settings.set('language',languageChoice);
            log.info('language selected: '+languageChoice);
            menu();
        }
        if(ui.id8){
            ui.onClick('BTN_DIFFICULTY',()=>ui.open('SELECT_DIFFICULTY'));
            ui.onClick('BTN_LANGUAGE',()=>ui.open('SELECT_LANGUAGE'));
            for(let i=0;i<4;i++)ui.onClick('DIF_'+i,()=>{chooseDifficulty(i);return ui.open('MAIN');});
            for(let i=0;i<3;i++)ui.onClick('LANG_'+i,()=>{chooseLanguage(i);return ui.open('MAIN');});
        } else {
            ui.onClick('BTN_DIFFICULTY',ev=>chooseDifficulty(Number(ev.row)));
            ui.onClick('BTN_LANGUAGE',ev=>chooseLanguage(Number(ev.row)));
        }
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
                draw(screenRecorder, game, w, h, best, t());
                cv.xf(1, 0, 0).append(screenRecorder).xf();
            } else draw(cv, game, w, h, best, t());
            return ui.image('GAME_GFX', cv);
        });
        menu();
        log.info('Chrome Dino Game: strict stationary gate; 120 Hz physics, 30 fps presentation');
    },
});
