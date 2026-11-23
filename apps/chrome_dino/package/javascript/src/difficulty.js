'use strict';
const BEST_KEYS=['best_easy','best_normal','best_hard','best_extreme'];
function value(settings,key){return Math.max(0,Number(settings.get(key))||0);}
function migrateDifficulty(settings){
 const scores=BEST_KEYS.map(key=>value(settings,key));let index=Number(settings.get('difficulty'));
 if(Number(settings.get('difficultySchema'))!==2){
  const old=Number.isInteger(index)&&index>=0&&index<3?index:0,oldBest=value(settings,'best');
  const existing=Number(settings.get('bestSchema'))===1||oldBest>0||scores.some(v=>v>0);
  if(existing){
   if(Number(settings.get('bestSchema'))!==1){const target=[0,2,3][old];scores[target]=Math.max(scores[target],oldBest);}
   scores[0]=Math.max(scores[0],scores[1]);scores[1]=0;index=[0,2,3][old];
  }else index=1;
  BEST_KEYS.forEach((key,i)=>settings.set(key,scores[i]));
  settings.set('best',Math.max.apply(null,scores));settings.set('difficulty',index);settings.set('difficultySchema',2);settings.set('bestSchema',2);
 }else if(Number(settings.get('bestSchema'))!==2)settings.set('bestSchema',2);
 index=Number.isInteger(index)&&index>=0&&index<4?index:1;
 return {index,bestKeys:BEST_KEYS,bestModes:scores};
}
module.exports={migrateDifficulty,BEST_KEYS};
