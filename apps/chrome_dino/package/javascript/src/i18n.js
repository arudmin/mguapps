'use strict';
// Only UI labels are localized: signals, IDs and saved settings remain stable.
const languageNames={ru:'Русский',en:'English'};
const dict={
 en:{play:'Play',continue_:'Continue',difficulty:'Difficulty',language:'Language',auto:'Auto (BMW)',change:'change',version:'Chrome Dino v',best:'Best',help:'Press Play; controller = jump. BACK = menu. Parked only.',parked:'Parked only: waiting for valid zero speed.',levels:['EASY','NORMAL','HARD','EXTREME']},
 ru:{play:'Играть',continue_:'Продолжить',difficulty:'Сложность',language:'Язык',auto:'Авто (BMW)',change:'сменить',version:'Chrome Dino v',best:'Рекорд',help:'Играть: нажмите контроллер для прыжка. BACK — меню. Только на стоянке.',parked:'Только на стоянке: ожидается нулевая скорость.',levels:['ЛЁГКО','НОРМА','СЛОЖНО','ЭКСТРИМ']}
};
function langOf(value) {
 if(value && typeof value==='object') value=value.language||value.currentDisplayLanguage||value.displayLanguage||value.value||value.id||'';
 const code=String(value||'').toLowerCase().replace(/[^a-z]/g,'');
 if(code.indexOf('ru')===0||code.indexOf('russian')>=0)return 'ru';
 if(code.indexOf('en')===0||code.indexOf('english')>=0)return 'en';
 return null;
}
function detect(ctx) {
 const vals=[ctx && ctx.language,ctx && ctx.locale,ctx && ctx.app && ctx.app.language,
  process.env.MGU_LANGUAGE,process.env.HEAD_UNIT_LANGUAGE,process.env.LC_ALL,process.env.LANG];
 for(const value of vals){const lang=langOf(value);if(lang)return lang;}
 return 'en';
}
function words(language){return dict[language]||dict.en;}
module.exports={langOf,detect,words,languageNames};
