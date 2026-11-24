'use strict';

const mgu = require('./kit/mgu');
const { Recorder } = require('./kit/record');
const Parked = require('./kit/parked');
const { Game } = require('./src/game');
const { migrateDifficulty } = require('./src/difficulty');
const { drawDashboard, WORLD_ASPECT } = require('./src/dashboard');
const { Controls } = require('./src/input');
const APP_VERSION = require('./kit/app-spec.json').version;
const i18n = require('./src/i18n');
const { Diag } = require('./kit/diag');
const { findVin } = require('./src/vin');
const { checkUpdate } = require('./src/update');

const W = 1600, H = 520, STEP = 1 / 120, SPEED_TTL = 5000;

mgu.run({
    start(ctx) {
        const { ui, log, settings } = ctx;
        const game = new Game();
        const migrated=migrateDifficulty(settings);
        game.setDifficulty(migrated.index);
        const bestKeys=migrated.bestKeys,bestModes=migrated.bestModes;
        let best=bestModes[game.difficulty];
        game.resize(WORLD_ASPECT);
        let languageChoice=settings.get('language')||'auto';
        const languageChoices=['auto','ru','en','de','fr','es','it','pt','nl','pl','uk','zh','ja'];
        if (languageChoices.indexOf(languageChoice)<0) languageChoice='auto';
        let systemLanguage=i18n.detect(ctx);
        let headLanguageRaw='';
        let headLanguageState='waiting';
        let headLanguageSource='not yet received';
        
        let updateState={available:false,latest:null,checked:false};
        function language(){return languageChoice==='auto'?systemLanguage:languageChoice;}
        function t(){return i18n.words(language());}
        let speedAt = -Infinity, speedValid = false;
        let going = false, closed = false, last = null, accumulator = 0, frameAt = -Infinity;
        let screenRecorder = null;
        let selectedControl='play', paused=false, exitDialog=false, exiting=false, tiltHeld=false, rendererTiltAt=-Infinity;
        let rotaryPosition=null,rendererRotaryAt=-Infinity;
        let fpsAt=0,fpsFrames=0,actualFPS=0;

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
            if(!going)return;
            if(exitDialog){exitAction(selectedControl);return;}
            if(paused){pauseAction(selectedControl);return;}
            if(game.state==='playing'||selectedControl==='play')game.action();
            else if(selectedControl==='mode')chooseDifficulty((game.difficulty+1)%4);
            else if(selectedControl==='language')chooseLanguage((languageChoices.indexOf(languageChoice)+1)%languageChoices.length);
        });
        function safe() {
            return parked && speedValid && Date.now() - speedAt <= SPEED_TTL && parked.speed() === 0;
        }
        function shown() { return ui.isVisible('GAME') && (!ui.hasFocus || ui.hasFocus('GAME')); }
        function saveBest() {
            if (game.score > best) {
                best=game.score;
                bestModes[game.difficulty]=best;
                settings.set(bestKeys[game.difficulty],best);
                settings.set('best',Math.max.apply(null,bestModes));
            }
        }
        function pauseRun() {
            if(game.state==='playing'&&!paused){paused=true;selectedControl='resume';saveBest();}
            last=null;accumulator=0;
        }
        function pauseAction(choice){
            if(!paused||!going||!safe())return;
            if(choice==='menu'){saveBest();game.reset();}
            else if(choice!=='resume')return;
            paused=false;selectedControl='play';last=null;accumulator=0;
        }
        function backAction(){
            if(!shown()||closed||exiting)return;
            if(exitDialog){exitDialog=false;selectedControl=paused?'resume':'play';return;}
            if(game.state==='playing'&&!paused){pauseRun();return;}
            exitDialog=true;selectedControl='cancel';
        }
        function exitAction(choice){
            if(!exitDialog)return;
            if(choice==='cancel'){exitDialog=false;selectedControl=paused?'resume':'play';return;}
            if(choice!=='exit'||exiting)return;
            exiting=true;exitDialog=false;saveBest();sync();
            Promise.resolve(ui.close('GAME')).catch(e=>{log.warn('close dashboard '+e);exiting=false;exitDialog=true;selectedControl='cancel';sync();});
        }
        function backTilt(value,source){
            if(!value)return;
            const raw=value.frontRotaryEncoderDeflection;
            if(raw===undefined)return;
            const now=Date.now();
            if(source==='renderer')rendererTiltAt=now;
            else if(now-rendererTiltAt<1000)return;
            const left=raw===10||raw===11||raw==='10'||raw==='11'||raw==='DREHGEBER_KURZ_LINKS'||raw==='DREHGEBER_LANG_LINKS';
            if(left&&!tiltHeld)backAction();
            tiltHeld=left;
        }
        function sync() {
            const go = !closed && !exiting && shown() && !!safe();
            if (go !== going) {
                going = go;
                last = null; accumulator = 0; frameAt = -Infinity; fpsAt=0; fpsFrames=0; actualFPS=0;
                ctl.enable(go);
                if (ctx.controller && ctx.controller.grab) ctx.controller.grab(go);
                if (!go) { saveBest(); if(!safe()){game.reset();paused=false;exitDialog=false;selectedControl='play';}else pauseRun();  }
            }
            // On unsafe/unknown speed the dashboard remains visible with a warning; gameplay is disabled.
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
                    
                }
            },log).then(function(sub){
                if(sub && sub.error) {
                    headLanguageState='error: '+String(sub.error).slice(0,52);
                    log.warn('BMW HMIContext: '+sub.error);
                } else if(sub && !sub.available && !headLanguageRaw){
                    headLanguageState='provider unavailable';
                }
                
            }).catch(function(err){
                headLanguageState='error: '+String(err).slice(0,52);
                log.warn('BMW HMI language: '+err);
                
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
                if (!diag.p) { return; }
                const replies = await diag.functional(0x22,[0xF1,0x90],{idleMs:1800,maxMs:9000});
                const found=findVin(replies);
                
                log.info('VIN read-only probe: '+(found?'available':'not available'));
            } catch(e) {
                
                log.warn('VIN read-only probe failed (no vehicle identifiers logged): '+String(e).slice(0,90));
            }
            
        })();
        checkUpdate(APP_VERSION, function(result) {
            updateState=result;
            log.info('version check: '+(result.checked?(result.available?'update available':'current'):'offline'));
            
        });
        log.info('initial UI language='+systemLanguage+' selected='+languageChoice);
        parked = Parked.watch(safetyCtx, log);
        function chooseDifficulty(index) {
            if (!Number.isInteger(index)||index<0||index>=4)return;
            if (!safe()) {  return; }
            saveBest();
            game.setDifficulty(index);
            best=bestModes[index];
            settings.set('difficulty',game.difficulty);
            
        }
        function chooseLanguage(index) {
            if (!Number.isInteger(index)||index<0||index>=languageChoices.length)return;
            languageChoice=languageChoices[index];
            settings.set('language',languageChoice);
            log.info('language selected: '+languageChoice);
            
        }
        function rotary(value,source){
            const raw=value&&value.frontRotaryEncoderOperation;
            const nRaw=typeof raw==='number'?raw:(typeof raw==='string'&&raw.trim()?Number(raw):NaN);
            if(!Number.isFinite(nRaw))return;
            const n=(Math.floor(nRaw)%65536+65536)%65536,now=Date.now();
            if(source==='renderer')rendererRotaryAt=now;
            const prev=rotaryPosition;rotaryPosition=n;
            if(source==='signals'&&now-rendererRotaryAt<700)return;
            if(prev===null||!going||(game.state==='playing'&&!paused&&!exitDialog))return;
            const diff=((n-prev+32768)%65536)-32768;
            if(!diff||Math.abs(diff)>16)return;
            const items=exitDialog?['cancel','exit']:paused?['resume','menu']:['play','mode','language'];
            selectedControl=items[(Math.max(0,items.indexOf(selectedControl))+(diff>0?1:items.length-1))%items.length];
        }
        // Touch areas use the 1600x520 dashboard coordinates.
        if(ctx.onTap)ctx.onTap((x,y)=>{
            sync();
            if(x>=890&&x<=1150&&y>=489&&shown()){backAction();return;}
            if(!going)return;
            if(exitDialog){if(y>=275&&y<=337){if(x>=242&&x<=570)exitAction('cancel');else if(x>=600&&x<=928)exitAction('exit');}return;}
            if(paused){if(y>=275&&y<=337){if(x>=242&&x<=570)pauseAction('resume');else if(x>=600&&x<=928)pauseAction('menu');}return;}
            if(x>=1180&&x<=1580&&game.state!=='playing'){
                if(y>=227&&y<=305){selectedControl='mode';chooseDifficulty((game.difficulty+1)%4);}
                else if(y>=336&&y<=410){selectedControl='language';chooseLanguage((languageChoices.indexOf(languageChoice)+1)%languageChoices.length);}
            }else if(x>=0&&x<1155){selectedControl='play';game.action();}
        });
        if(ctx.hideButton)ctx.hideButton('BTN_JUMP');
        ui.onClick('BTN_JUMP', () => { sync(); ctl.barClick(); });
        if (ctx.controller && ctx.controller.onInput) {
            ctx.controller.onInput((value) => { sync(); backTilt(value,'renderer'); rotary(value,'renderer'); ctl.raw(value,'renderer'); });
        }
        ctx.signals.watch('de.bmw.infotainment.controlelements.FrontCCU', '1', {
            statusRotaryEncoderState(value) { sync(); backTilt(value,'signals'); rotary(value,'signals'); ctl.raw(value,'signals'); },
        }, log).then((s) => { if (s.error) log.warn('controller: ' + s.error); });
        if (ui.onFocus) ui.onFocus(sync);
        if (ui.onVisible) ui.onVisible((name,visible) => {
            if(name!=='GAME')return;
            if(!visible){pauseRun();exitDialog=false;tiltHeld=false;}
            else {if(exiting){game.reset();paused=false;selectedControl='play';}exiting=false;last=null;accumulator=0;}
            sync();
        });
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

        ctx.loop('GAME', 8, () => {
            sync();
            if (closed || exiting || !shown()) return;
            const now = Date.now();
            const cv = ctx.canvas(W, H).clear('#000000');
            const pl = cv.place;
            const full = pl && pl.full && pl.w > 0 && pl.h > 0;
            const w = full ? pl.w : W, h = full ? pl.h : H;
            game.resize(WORLD_ASPECT); // Fixed collision/spawn world for both styles and screen sizes.
            if (last !== null && going && !paused && !exitDialog) accumulator += Math.max(0, Math.min((now - last) / 1000, 0.2));
            last = now;
            while (accumulator >= STEP) {
                if (game.state === 'playing' && !paused && !exitDialog) game.step(STEP);
                accumulator -= STEP;
            }
            saveBest();
            if(!fpsAt)fpsAt=now;
            if(now-fpsAt>=1000){actualFPS=Math.round(fpsFrames*1000/(now-fpsAt));fpsFrames=0;fpsAt=now;}
            // GPU path is paced by renderd at up to 60 Hz; PNG fallback is capped by ctx.loop at 8 Hz.
            if (now - frameAt + 2 < 1000 / 60) return; // Allow 16 ms tick rounding on 60 Hz displays.
            frameAt = now;fpsFrames++;
            const options={paused,exitDialog,selectedControl,languageLabel:languageChoice==='auto'?'Auto ('+systemLanguage.toUpperCase()+')':i18n.languageNames[languageChoice]||languageChoice,parked:!!safe(),fps:actualFPS};
            if(full){
                if(!screenRecorder||screenRecorder.w!==w||screenRecorder.h!==h)screenRecorder=new Recorder(w,h);
                screenRecorder.reset();drawDashboard(screenRecorder,game,w,h,best,t(),updateState,options);
                cv.xf(1,0,0).append(screenRecorder).xf();
            }else drawDashboard(cv,game,w,h,best,t(),updateState,options);
            return ui.image('GAME_GFX', cv);
        });
        
        log.info('Chrome Dino '+APP_VERSION+' Dashboard-only, right-side controls, strict zero speed; GPU 60 Hz target, PNG fallback 8 Hz');
    },
});
