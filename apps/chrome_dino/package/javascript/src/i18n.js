'use strict';
// BMW HMIContext currentDisplayLanguage uses CommonTypes.Language enum names,
// e.g. RUSSISCH, ENGLISCH__UK. Modeled on robertn_waze_cluster.
const languageNames={ru:'Русский',en:'English'};
const dict={
 en:{play:'Play',continue_:'Continue',difficulty:'Difficulty',language:'Language',auto:'Auto (BMW)',change:'change',version:'Chrome Dino v',best:'Best',help:'Controller = jump; BACK = menu. Parked only.',parked:'Parked only: waiting for zero speed.',levels:['EASY','NORMAL','HARD','EXTREME'],title:'CHROME DINO GAME',hi:'HI',jump:'CONTROLLER = JUMP    BACK = MENU',over:'GAME OVER',start:'PRESS CONTROLLER TO START',score:'SCORE',parkedOnly:'PARKED ONLY'},
 ru:{play:'Играть',continue_:'Продолжить',difficulty:'Сложность',language:'Язык',auto:'Авто (BMW)',change:'сменить',version:'Chrome Dino v',best:'Рекорд',help:'Контроллер — прыжок; BACK — меню. Только на стоянке.',parked:'Только на стоянке: ожидается нулевая скорость.',levels:['ЛЁГКО','НОРМА','СЛОЖНО','ЭКСТРИМ'],title:'ИГРА CHROME DINO',hi:'РЕКОРД',jump:'КОНТРОЛЛЕР — ПРЫЖОК    BACK — МЕНЮ',over:'КОНЕЦ ИГРЫ',start:'НАЖМИТЕ КОНТРОЛЛЕР ДЛЯ СТАРТА',score:'ОЧКИ',parkedOnly:'ТОЛЬКО НА СТОЯНКЕ'},
 de:{play:'Spielen',continue_:'Fortsetzen',difficulty:'Schwierigkeit',language:'Sprache',auto:'Auto (BMW)',change:'ändern',version:'Chrome Dino v',best:'Rekord',help:'Controller = Springen; BACK = Menü. Nur im Stand.',parked:'Nur im Stand: warte auf Geschwindigkeit 0.',levels:['LEICHT','NORMAL','SCHWER','EXTREM'],title:'CHROME DINO SPIEL',hi:'BEST',jump:'CONTROLLER = SPRINGEN    BACK = MENÜ',over:'SPIEL VORBEI',start:'CONTROLLER DRÜCKEN ZUM START',score:'PUNKTE',parkedOnly:'NUR IM STAND'},
 fr:{play:'Jouer',continue_:'Continuer',difficulty:'Difficulté',language:'Langue',auto:'Auto (BMW)',change:'changer',version:'Chrome Dino v',best:'Record',help:'Contrôleur = saut; BACK = menu. À l’arrêt.',parked:'À l’arrêt uniquement : vitesse zéro.',levels:['FACILE','NORMAL','DIFFICILE','EXTRÊME'],title:'JEU CHROME DINO',hi:'RECORD',jump:'CONTRÔLEUR = SAUT    BACK = MENU',over:'PARTIE TERMINÉE',start:'APPUYEZ POUR COMMENCER',score:'SCORE',parkedOnly:'À L’ARRÊT'},
 es:{play:'Jugar',continue_:'Continuar',difficulty:'Dificultad',language:'Idioma',auto:'Auto (BMW)',change:'cambiar',version:'Chrome Dino v',best:'Récord',help:'Mando = salto; BACK = menú. Solo parado.',parked:'Solo parado: esperando velocidad cero.',levels:['FÁCIL','NORMAL','DIFÍCIL','EXTREMO'],title:'JUEGO CHROME DINO',hi:'RÉCORD',jump:'MANDO = SALTO    BACK = MENÚ',over:'FIN DEL JUEGO',start:'PULSA EL MANDO PARA EMPEZAR',score:'PUNTOS',parkedOnly:'SOLO PARADO'},
 it:{play:'Gioca',continue_:'Continua',difficulty:'Difficoltà',language:'Lingua',auto:'Auto (BMW)',change:'cambia',version:'Chrome Dino v',best:'Record',help:'Controller = salto; BACK = menu. Solo da fermi.',parked:'Solo da fermi: attesa velocità zero.',levels:['FACILE','NORMALE','DIFFICILE','ESTREMO'],title:'GIOCO CHROME DINO',hi:'RECORD',jump:'CONTROLLER = SALTO    BACK = MENU',over:'FINE PARTITA',start:'PREMI IL CONTROLLER PER INIZIARE',score:'PUNTI',parkedOnly:'SOLO DA FERMI'}
};
const hmiNames={RUSSISCH:'ru',ENGLISCH__UK:'en',ENGLISCH__US:'en',ENGLISCH:'en',DEUTSCH:'de',FRANZOESISCH:'fr',SPANISCH:'es',ITALIENISCH:'it',UKRAINISCH:'ru'};
function raw(value){
 if(value && typeof value==='object') {
   if(Object.prototype.hasOwnProperty.call(value,'value'))return raw(value.value);
   if(Object.prototype.hasOwnProperty.call(value,'currentDisplayLanguage'))return raw(value.currentDisplayLanguage);
   if(Object.prototype.hasOwnProperty.call(value,'language'))return raw(value.language);
   if(Object.prototype.hasOwnProperty.call(value,'id'))return raw(value.id);
 }
 return value===undefined||value===null?'':String(value);
}
function langOf(value) {
 const code=raw(value).trim();
 const upper=code.toUpperCase().replace(/-/g,'_');
 if(Object.prototype.hasOwnProperty.call(hmiNames,upper))return hmiNames[upper];
 if(/^RU(?:_|$)/.test(upper)||upper==='RUSSIAN')return 'ru';
 if(/^EN(?:_|$)/.test(upper)||upper==='ENGLISH')return 'en';
 if(/^DE(?:_|$)/.test(upper)||upper==='GERMAN')return 'de';
 if(/^FR(?:_|$)/.test(upper)||upper==='FRENCH')return 'fr';
 if(/^ES(?:_|$)/.test(upper)||upper==='SPANISH')return 'es';
 if(/^IT(?:_|$)/.test(upper)||upper==='ITALIAN')return 'it';
 return null;
}
function detect(ctx){
 const vals=[ctx && ctx.language,ctx && ctx.locale,ctx && ctx.app && ctx.app.language,process.env.MGU_LANGUAGE,process.env.HEAD_UNIT_LANGUAGE];
 for(const v of vals){const l=langOf(v);if(l)return l;}
 return 'en';
}
function words(l){return dict[l]||dict.en;}
module.exports={langOf,detect,words,languageNames,raw,hmiNames};
