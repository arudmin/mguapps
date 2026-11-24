'use strict';
// BMW HMIContext currentDisplayLanguage uses CommonTypes.Language enum names,
// e.g. RUSSISCH, ENGLISCH__UK. Modeled on robertn_waze_cluster.
const languageNames={ru:'Русский',en:'English',de:'Deutsch',es:'Español',fr:'Français',it:'Italiano',pt:'Português',nl:'Nederlands',pl:'Polski',uk:'Українська',zh:'中文',ja:'日本語'};
const dict={
 en:{updateNotice:'UPDATE AVAILABLE',play:'Play',continue_:'Continue',difficulty:'Difficulty',language:'Language',auto:'Auto (BMW)',change:'change',version:'Chrome Dino v',best:'Best',help:'Controller = jump; BACK = menu. Parked only.',parked:'Parked only: waiting for zero speed.',levels:['NORMAL','HARD','EXTREME'],title:'CHROME DINO GAME',hi:'HI',jump:'CONTROLLER = JUMP    BACK = MENU',over:'GAME OVER',start:'PRESS CONTROLLER TO START',score:'SCORE',parkedOnly:'PARKED ONLY'},
 ru:{updateNotice:'ДОСТУПНО ОБНОВЛЕНИЕ',play:'Играть',continue_:'Продолжить',difficulty:'Сложность',language:'Язык',auto:'Авто (BMW)',change:'сменить',version:'Chrome Dino v',best:'Рекорд',help:'Контроллер — прыжок; BACK — меню. Только на стоянке.',parked:'Только на стоянке: ожидается нулевая скорость.',levels:['НОРМА','СЛОЖНО','ЭКСТРИМ'],title:'ИГРА CHROME DINO',hi:'РЕКОРД',jump:'КОНТРОЛЛЕР — ПРЫЖОК    BACK — МЕНЮ',over:'КОНЕЦ ИГРЫ',start:'НАЖМИТЕ КОНТРОЛЛЕР ДЛЯ СТАРТА',score:'ОЧКИ',parkedOnly:'ТОЛЬКО НА СТОЯНКЕ'},
 de:{play:'Spielen',continue_:'Fortsetzen',difficulty:'Schwierigkeit',language:'Sprache',auto:'Auto (BMW)',change:'ändern',version:'Chrome Dino v',best:'Rekord',help:'Controller = Springen; BACK = Menü. Nur im Stand.',parked:'Nur im Stand: warte auf Geschwindigkeit 0.',levels:['NORMAL','SCHWER','EXTREM'],title:'CHROME DINO SPIEL',hi:'BEST',jump:'CONTROLLER = SPRINGEN    BACK = MENÜ',over:'SPIEL VORBEI',start:'CONTROLLER DRÜCKEN ZUM START',score:'PUNKTE',parkedOnly:'NUR IM STAND'},
 fr:{play:'Jouer',continue_:'Continuer',difficulty:'Difficulté',language:'Langue',auto:'Auto (BMW)',change:'changer',version:'Chrome Dino v',best:'Record',help:'Contrôleur = saut; BACK = menu. À l’arrêt.',parked:'À l’arrêt uniquement : vitesse zéro.',levels:['NORMAL','DIFFICILE','EXTRÊME'],title:'JEU CHROME DINO',hi:'RECORD',jump:'CONTRÔLEUR = SAUT    BACK = MENU',over:'PARTIE TERMINÉE',start:'APPUYEZ POUR COMMENCER',score:'SCORE',parkedOnly:'À L’ARRÊT'},
 es:{play:'Jugar',continue_:'Continuar',difficulty:'Dificultad',language:'Idioma',auto:'Auto (BMW)',change:'cambiar',version:'Chrome Dino v',best:'Récord',help:'Mando = salto; BACK = menú. Solo parado.',parked:'Solo parado: esperando velocidad cero.',levels:['NORMAL','DIFÍCIL','EXTREMO'],title:'JUEGO CHROME DINO',hi:'RÉCORD',jump:'MANDO = SALTO    BACK = MENÚ',over:'FIN DEL JUEGO',start:'PULSA EL MANDO PARA EMPEZAR',score:'PUNTOS',parkedOnly:'SOLO PARADO'},
 it:{play:'Gioca',continue_:'Continua',difficulty:'Difficoltà',language:'Lingua',auto:'Auto (BMW)',change:'cambia',version:'Chrome Dino v',best:'Record',help:'Controller = salto; BACK = menu. Solo da fermi.',parked:'Solo da fermi: attesa velocità zero.',levels:['NORMALE','DIFFICILE','ESTREMO'],title:'GIOCO CHROME DINO',hi:'RECORD',jump:'CONTROLLER = SALTO    BACK = MENU',over:'FINE PARTITA',start:'PREMI IL CONTROLLER PER INIZIARE',score:'PUNTI',parkedOnly:'SOLO DA FERMI'}
};
const hmiNames={RUSSISCH:'ru',ENGLISCH__UK:'en',ENGLISCH__US:'en',ENGLISCH:'en',DEUTSCH:'de',FRANZOESISCH:'fr',SPANISCH:'es',ITALIENISCH:'it',PORTUGIESISCH:'pt',NIEDERLAENDISCH:'nl',POLNISCH:'pl',UKRAINISCH:'uk',CHINESISCH:'zh',JAPANISCH:'ja'};
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
const pauseText={"en":{"pauseTitle":"PAUSE","continue_":"Continue","restartRun":"Start over","hudBack":"BACK: PAUSE"},"ru":{"pauseTitle":"ПАУЗА","continue_":"Продолжить","restartRun":"Начать сначала","hudBack":"BACK: ПАУЗА"},"de":{"pauseTitle":"PAUSE","continue_":"Fortsetzen","restartRun":"Neu starten","hudBack":"ZURÜCK: PAUSE"},"fr":{"pauseTitle":"PAUSE","continue_":"Continuer","restartRun":"Recommencer","hudBack":"RETOUR: PAUSE"},"es":{"pauseTitle":"PAUSA","continue_":"Continuar","restartRun":"Reiniciar","hudBack":"ATRÁS: PAUSA"},"it":{"pauseTitle":"PAUSA","continue_":"Continua","restartRun":"Ricomincia","hudBack":"INDIETRO: PAUSA"},"pt":{"pauseTitle":"PAUSA","continue_":"Continuar","restartRun":"Recomeçar","hudBack":"VOLTAR: PAUSA"},"nl":{"pauseTitle":"PAUZE","continue_":"Doorgaan","restartRun":"Opnieuw","hudBack":"TERUG: PAUZE"},"pl":{"pauseTitle":"PAUZA","continue_":"Kontynuuj","restartRun":"Od nowa","hudBack":"WSTECZ: PAUZA"},"uk":{"pauseTitle":"ПАУЗА","continue_":"Продовжити","restartRun":"Почати спочатку","hudBack":"НАЗАД: ПАУЗА"},"zh":{"pauseTitle":"暂停","continue_":"继续","restartRun":"重新开始","hudBack":"返回：暂停"},"ja":{"pauseTitle":"一時停止","continue_":"続ける","restartRun":"最初から","hudBack":"戻る：一時停止"}};
function words(l){return Object.assign({},dict.en,dict[l]||{},dashboardText.en,dashboardText[l]||{},pauseText[l]||pauseText.en);}

// Dashboard/menu additions in all 12 app languages. Other HMI strings still use existing fallbacks.
const dashboardText={
 en:{levels:["EASY","NORMAL","HARD","EXTREME"],style:'Style',styleDashboard:'Dashboard',styleClassic:'Classic',online:'ONLINE TOP 10',onlineInactive:'NOT CONNECTED',offlineNotice:'ONLINE RANKING NOT ACTIVE',hudParked:'PARKED ONLY',hudJump:'CONTROLLER: JUMP',hudBack:'BACK: MENU'},
 ru:{levels:["ЛЕГКО","НОРМА","СЛОЖНО","ЭКСТРИМ"],style:'Стиль',styleDashboard:'Панель',styleClassic:'Классика',online:'ОНЛАЙН ТОП-10',onlineInactive:'НЕ ПОДКЛЮЧЁН',offlineNotice:'РЕЙТИНГ ПОКА НЕДОСТУПЕН',hudParked:'ТОЛЬКО НА СТОЯНКЕ',hudJump:'КОНТРОЛЛЕР: ПРЫЖОК',hudBack:'BACK: МЕНЮ'},
 de:{levels:["LEICHT","NORMAL","SCHWER","EXTREM"],style:'Stil',styleDashboard:'Dashboard',styleClassic:'Klassisch',online:'ONLINE TOP 10',onlineInactive:'NICHT VERBUNDEN',offlineNotice:'RANGLISTE NOCH INAKTIV',hudParked:'NUR IM STAND',hudJump:'CONTROLLER: SPRUNG',hudBack:'ZURÜCK: MENÜ'},
 fr:{levels:["FACILE","NORMAL","DIFFICILE","EXTRÊME"],style:'Style',styleDashboard:'Tableau de bord',styleClassic:'Classique',online:'TOP 10 EN LIGNE',onlineInactive:'NON CONNECTÉ',offlineNotice:'CLASSEMENT INACTIF',hudParked:'À L’ARRÊT',hudJump:'MOLETTE : SAUT',hudBack:'RETOUR : MENU'},
 es:{levels:["FÁCIL","NORMAL","DIFÍCIL","EXTREMO"],style:'Estilo',styleDashboard:'Panel',styleClassic:'Clásico',online:'TOP 10 EN LÍNEA',onlineInactive:'SIN CONEXIÓN',offlineNotice:'CLASIFICACIÓN INACTIVA',hudParked:'SOLO PARADO',hudJump:'MANDO: SALTO',hudBack:'ATRÁS: MENÚ'},
 it:{levels:["FACILE","NORMALE","DIFFICILE","ESTREMO"],style:'Stile',styleDashboard:'Cruscotto',styleClassic:'Classico',online:'TOP 10 ONLINE',onlineInactive:'NON CONNESSO',offlineNotice:'CLASSIFICA NON ATTIVA',hudParked:'SOLO DA FERMI',hudJump:'CONTROLLER: SALTO',hudBack:'INDIETRO: MENU'},
 pt:{levels:["FÁCIL","NORMAL","DIFÍCIL","EXTREMO"],style:'Estilo',styleDashboard:'Painel',styleClassic:'Clássico',online:'TOP 10 ONLINE',onlineInactive:'NÃO LIGADO',offlineNotice:'CLASSIFICAÇÃO INATIVA',hudParked:'APENAS ESTACIONADO',hudJump:'COMANDO: SALTAR',hudBack:'VOLTAR: MENU'},
 nl:{levels:["MAKKELIJK","NORMAAL","MOEILIJK","EXTREEM"],style:'Stijl',styleDashboard:'Dashboard',styleClassic:'Klassiek',online:'ONLINE TOP 10',onlineInactive:'NIET VERBONDEN',offlineNotice:'RANGLIJST NOG UIT',hudParked:'ALLEEN GEPARKEERD',hudJump:'CONTROLLER: SPRINGEN',hudBack:'TERUG: MENU'},
 pl:{levels:["ŁATWY","NORMALNY","TRUDNY","EKSTREMALNY"],style:'Styl',styleDashboard:'Panel',styleClassic:'Klasyczny',online:'TOP 10 ONLINE',onlineInactive:'BRAK POŁĄCZENIA',offlineNotice:'RANKING NIEAKTYWNY',hudParked:'TYLKO NA POSTOJU',hudJump:'POKRĘTŁO: SKOK',hudBack:'WSTECZ: MENU'},
 uk:{levels:["ЛЕГКО","НОРМА","СКЛАДНО","ЕКСТРИМ"],style:'Стиль',styleDashboard:'Панель',styleClassic:'Класичний',online:'ОНЛАЙН ТОП-10',onlineInactive:'НЕ ПІДКЛЮЧЕНО',offlineNotice:'РЕЙТИНГ ЩЕ НЕАКТИВНИЙ',hudParked:'ЛИШЕ НА СТОЯНЦІ',hudJump:'КОНТРОЛЕР: СТРИБОК',hudBack:'НАЗАД: МЕНЮ'},
 zh:{levels:["简单","普通","困难","极限"],style:'界面风格',styleDashboard:'仪表盘',styleClassic:'经典',online:'在线前十',onlineInactive:'未连接',offlineNotice:'在线排名尚未启用',hudParked:'仅限停车',hudJump:'旋钮：跳跃',hudBack:'返回：菜单'},
 ja:{levels:["イージー","ノーマル","ハード","エクストリーム"],style:'画面スタイル',styleDashboard:'ダッシュボード',styleClassic:'クラシック',online:'オンライン上位10',onlineInactive:'未接続',offlineNotice:'ランキングは未接続',hudParked:'停車中のみ',hudJump:'コントローラー：ジャンプ',hudBack:'戻る：メニュー'}
};

module.exports={langOf,detect,words,languageNames,raw,hmiNames};
