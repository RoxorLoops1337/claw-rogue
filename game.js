(()=>{'use strict';
const $=s=>document.querySelector(s), machine=$('#machineCanvas'), battle=$('#battleCanvas'),ctx=machine.getContext('2d'),art=battle.getContext('2d');
const MW=420,MH=340,LEFT=12,RIGHT=408,FLOOR=326,STEP=1/120,CHUTE=84;
const P=ClawProgression, A=ClawArt;
const iconMark=mark=>window.ClawIcons?.mark(mark)??String(mark??'');
const engine=ClawPhysics.create({left:LEFT,right:RIGHT,floor:FLOOR,chuteRight:CHUTE,dividerTop:145});
let battleFx=[],delivered=[],totals={damage:0,block:0,heal:0,coins:0},contactInfo={},lastDelivery=0,gripCount=0;
let run,claw,balls=[],effects=[],floaters=[],phase='aim',phaseTime=0,clock=0,last=0,accumulator=0,paused=false,modalMode='',leftHeld=false,rightHeld=false,aimTarget=null,shake=0,battlePulse=0,enemyPulse=0,combo=0,comboTime=0,best=0,pendingDrop=false;
try{best=Number(localStorage.getItem('clawbound-best'))||0}catch{}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),rand=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t;
const TYPES={sword:{name:'Sword',color:'#ff9b88',rim:'#ffe2c4',dark:'#743948',damage:4},shield:{name:'Shield',color:'#81d7e6',rim:'#ccf8f2',dark:'#225a73',block:4},heart:{name:'Heart',color:'#f292bb',rim:'#ffdbdf',dark:'#7f385d',heal:3},spark:{name:'Spark',color:'#b9a0f1',rim:'#e9deff',dark:'#58427c',damage:6},coin:{name:'Coin',color:'#f3cd76',rim:'#fff0bc',dark:'#89613b',coins:2},stone:{name:'Scrap',color:'#91acb8',rim:'#ccdae0',dark:'#405a70',damage:1}};
const weighted=['sword','sword','sword','sword','shield','shield','heart','heart','spark','coin','stone'];
let audio=null,muted=false,saveClock=0,started=false,heroAttack=0,uiClock=0,fxSeed=1249;
// Cosmetic randomness never consumes the loot generator's random sequence.
function fxRand(a,b){fxSeed=(Math.imul(fxSeed,1664525)+1013904223)>>>0;return a+(b-a)*fxSeed/4294967296;}
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
try{muted=localStorage.getItem('clawbound-muted')==='true'}catch{}
function sound(kind,count=0){
 if(muted||document.hidden)return;
 try{
  audio=audio||new(window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  const tone=(freq,end,length,volume=.025,wave='sine',delay=0)=>{
   const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+delay;
   o.type=wave;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(end,t+length);
   g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.009);g.gain.exponentialRampToValueAtTime(.001,t+length);
   o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+length+.02);
  };
  if(kind==='drop'){tone(170,72,.24,.023,'triangle');tone(740,390,.06,.009,'sine');}
  if(kind==='grip'){tone(310,93,.08,.023,'triangle');tone(215,110,.08,.017,'triangle',.07);}
  if(kind==='lift')tone(110,190,.19,.014,'triangle');
  if(kind==='release'){tone(350,640,.12,.02);tone(170,120,.09,.012,'triangle',.045);}
  if(kind==='collect'){const notes=[523.25,587.33,659.25,783.99,880,1046.5],f=notes[Math.min(count-1,5)]||notes[0];tone(f,f,.16,.021);tone(f*2,f*2,.23,.008,'sine',.025);}
  if(kind==='hit'){tone(145,43,.14,.036,'triangle');tone(390,95,.035,.013,'sawtooth');}
  if(kind==='strike'){tone(280,70,.11,.022,'triangle');tone(720,220,.045,.009,'sine');}
  if(kind==='spark'){tone(880,220,.14,.016,'triangle');tone(1320,660,.1,.009,'sine',.035);}
  if(kind==='block'){tone(660,640,.2,.019);tone(998,960,.16,.011,'sine',.015);}
  if(kind==='heal'){tone(523,523,.28,.015);tone(784,784,.3,.01,'sine',.07);}
  if(kind==='win'){[392,494,587,784].forEach((f,i)=>tone(f,f,.55,.019,'triangle',i*.085));tone(196,196,.7,.023,'sine',.1);}
  if(kind==='haul'){[659,880,1047].forEach((f,i)=>tone(f,f,.3,.015,'sine',i*.065));}
  if(kind==='miss')tone(160,120,.09,.016,'triangle');
  if(kind==='upgrade'){[520,780,1040].forEach((f,i)=>tone(f,f,.28,.019,'sine',i*.07));}
  if(kind==='ui')tone(580,680,.045,.009);
 }catch{}
}
function toggleSound(){muted=!muted;try{localStorage.setItem('clawbound-muted',String(muted))}catch{}$('#sound').setAttribute('data-muted',String(muted));$('#sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');$('#sound').setAttribute('aria-pressed',String(!muted));if(!muted)sound('collect',1)}
function message(text){$('#status').textContent=text}
function updateUI(){
 $('#coins').textContent=run.coins;
 $('#floor').textContent='CHAMBER '+String(run.floor).padStart(2,'0');
 $('#zone').textContent=run.enemy.boss?'GUARDIAN CHAMBER':P.actFor(run.floor).name;
 $('#heroName').textContent='YOU · '+(P.LOADOUTS.find(l=>l.id===run.loadout)?.name||'The Scrapper').replace(/^The /,'').toUpperCase();
 $('#heroHp').textContent=`${run.hp}/${run.maxHp}`;
 $('#heroBar').style.width=(100*run.hp/run.maxHp)+'%';
 $('#enemyHp').textContent=`${Math.max(0,run.enemy.hp)}/${run.enemy.maxHp}`;
 $('#enemyBar').style.width=(100*Math.max(0,run.enemy.hp)/run.enemy.maxHp)+'%';
 $('#enemyName').textContent=run.enemy.name;
 $('#shield').textContent=`${run.shield} BLOCK`;
 const intent=P.intentFor(run.enemy,run.turn||0);
 $('#intent').textContent=intent.label+(run.enemy.armor?` · ${run.enemy.armor} ARMOR`:'');
 $('#drops').textContent=run.drops;
 $('#drop').disabled=!['aim','down'].includes(phase)||paused;
 $('#left').disabled=$('#right').disabled=phase!=='aim'||paused;
 $('#dropLabel').textContent=paused?'PAUSED':({aim:'GRAB',down:'CLOSE NOW',close:'SCOOPING',up:'LIFTING',carry:'DELIVERING',release:'LOOT!',resolve:'YOUR TURN',enemy:'INCOMING',return:'RETURNING',reward:'CHAMBER CLEAR',over:'RUN COMPLETE'}[phase]||'GRAB');
 $('#clawLabel').textContent=run.size>=2?'TITAN CLAW':run.size?'WIDE CLAW':'BRASS CLAW';
 $('#load').textContent=(phase==='close'||(phase==='up'&&phaseTime<.4))?'SETTLING…':claw.held.length+' IN SCOOP';
 $('#drop').classList.toggle('is-closing',phase==='down');
 $('#capacity').setAttribute('aria-label',`Grip strength: ${Math.round(run.grip*100)} percent`);
 $('#capacity').innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<Math.round(run.grip*3)?'loaded':''}"></i>`).join('');
 $('#routeDots').innerHTML=Array.from({length:12},(_,i)=>`<i class="route-dot ${i+1<run.floor?'done':i+1===run.floor?'current':''} ${(i+1)%4===0?'boss':''}"></i>`).join('');
 $('.hint').textContent='DRAG & RELEASE TO GRAB · TAP CLOSE NOW TO CHOOSE DEPTH';
 $('#inventory').replaceChildren();
 Object.entries(run.relics).slice(-3).forEach(([id,count])=>{
  const u=P.UPGRADES.find(u=>u.id===id); if(!u)return;
  const el=document.createElement('span');el.className='relic-tag';el.innerHTML=`${iconMark(u.mark)} <span>${u.name}${count>1?' ×'+count:''}</span>`;$('#inventory').append(el);
 });
 $('#build').textContent=`BUILD · ${Object.values(run.relics).reduce((a,b)=>a+b,0)}`;
}

const ITEM_SHAPES={sword:['cap',38,6],shield:['blob',14],heart:['blob',11.5],spark:['cap',26,8],coin:['ball',10],stone:['blob',12]};
function newBall(x,y,type){
 const parts=ClawPhysics.shapeParts(ITEM_SHAPES[type],1);
 return {x,y,oldX:x,oldY:y,vx:rand(-3,3),vy:0,r:Math.max(...parts.map(p=>Math.hypot(p.x,p.y)+p.r)),parts,
 density:{sword:1,shield:1,heart:.75,spark:.8,coin:1.4,stone:1.8}[type],
 type,angle:rand(-Math.PI,Math.PI),spin:rand(-.4,.4),alive:true};
}
function fillPile(){
 balls=[];
 for(let row=0;row<6;row++)for(let col=0;col<8;col++){
  const type=row===5&&col%3===0?'sword':weighted[Math.floor(Math.random()*weighted.length)];
  balls.push(newBall(112+col*39+(row%2)*3,FLOOR-22-row*30,type));
 }
}
function setPhase(value){phase=value;phaseTime=0;machine.setAttribute('data-phase',value);$('#drop').setAttribute('data-phase',value);updateUI()}
function startFloor(){
 run.stage='battle'; run.turn=0; run.enemy=P.enemyFor(run.floor,run.routeKind||'combat');
 run.drops=6+run.extraDrops+(run.enemy.boss?2:0);
 run.shield=Math.min(run.shield,12)+(run.startShield||0);
 claw={x:210,y:40,open:1,pL:.62,pR:.62,haltL:false,haltR:false,held:[],prevX:210,prevY:40,depth:FLOOR-60*clawScale()-4,contactTime:0,vx:0,vy:0};pendingDrop=false;
 delivered=[];totals={damage:0,block:0,heal:0,coins:0};gripCount=0;
 effects=[];floaters=[];battleFx=[];heroAttack=0;combo=0;leftHeld=rightHeld=false;aimTarget=null;
 fillPile();engine.reset(jawSegments());for(let i=0;i<160;i++)physics(STEP);
 setPhase('aim');message(run.enemy.boss?'Guardian ahead. Watch its next move.':'Aim for the loot your build needs.');checkpoint();
}
function newRun(loadout='scrapper'){
 closeModal();started=true;P.clearRun();run=P.createRun(loadout);startFloor();
}

// The reference game uses rigid rotating fingers rather than morphing a carrying basket.
const PRONG=[[0,0],[14,28],[9,48],[1,57]],PHI_OPEN=.62,PHI_CLOSED=-.10;
function clawScale(){return 1.28*(1+Math.min(run.size,3)*.12)}
function halfWidth(){return 40*clawScale()}
function aimBounds(){return [CHUTE+halfWidth()*.75+4,RIGHT-halfWidth()*.75-4]}
function jawPoints(){
 const scale=clawScale();
 return [-1,1].map(side=>{
  const phi=side<0?claw.pL:claw.pR,angle=-side*phi,c=Math.cos(angle),n=Math.sin(angle);
  const hx=claw.x+side*7*scale,hy=claw.y+7*scale;
  return PRONG.map(([px,py])=>{const x=side*px*scale,y=py*scale;return{x:hx+x*c-y*n,y:hy+x*n+y*c}});
 });
}
function jawSegments(){
 const segments=[];
 jawPoints().forEach((jaw,index)=>{for(let i=0;i<jaw.length-1;i++)segments.push({ax:jaw[i].x,ay:jaw[i].y,bx:jaw[i+1].x,by:jaw[i+1].y,r:3.6*clawScale(),side:index===0?-1:1,id:`jaw-${index}-${i}`})});
 segments.push({ax:claw.x-6,ay:claw.y,bx:claw.x+6,by:claw.y,r:9*clawScale(),side:0,id:'hub'});return segments;
}
function closeGrip(){
 if(phase!=='down'||paused)return;
 claw.haltL=claw.haltR=false;setPhase('close');sound('grip');haptic(12);message('The fingers close around the pile.');
}
function drop(){
 if(phase==='down'){closeGrip();return;}
 if(phase!=='aim'||paused||run.drops<1)return;
 if(aimTarget!==null&&Math.abs(claw.x-aimTarget)>2){pendingDrop=true;return;}
 pendingDrop=false;run.drops--;leftHeld=rightHeld=false;aimTarget=null;
 claw.open=1;claw.pL=claw.pR=PHI_OPEN;claw.haltL=claw.haltR=false;claw.contactTime=0;
 claw.depth=FLOOR-60*clawScale()-4;claw.homeX=claw.x;claw.vx=claw.vy=0;
 delivered=[];totals={damage:0,block:0,heal:0,coins:0};lastDelivery=clock;gripCount=0;
 setPhase('down');checkpoint();sound('drop');haptic(8);message('Tap CLOSE NOW to choose your grabbing depth.');
}
function haptic(duration){if(!muted&&window.navigator?.vibrate)window.navigator.vibrate(duration)}
function physics(dt){engine.config.jawFriction=run.grip||.85;contactInfo=engine.step(dt,balls,jawSegments());for(const b of balls){if(!b.alive)continue;if(b.x<CHUTE&&b.y-b.r>MH+6)collectBall(b)}if(['up','carry','release'].includes(phase)){claw.held=balls.filter(b=>b.alive&&Math.abs(b.x-claw.x)<halfWidth()+b.r&&b.y>claw.y+8&&b.y<claw.y+72*clawScale());if(claw.held.length!==gripCount){gripCount=claw.held.length;updateUI()}}else claw.held=[];}
function capture(){// Feedback only: every token remains a free physical body.
claw.held=balls.filter(b=>b.alive&&Math.abs(b.x-claw.x)<halfWidth()&&b.y>claw.y+10&&b.y<claw.y+72*clawScale());combo=0;comboTime=0;message('Lifting carefully. Loose items can slip.');sound('lift');updateUI()}
function hurtEnemy(amount){
 const blocked=Math.min(run.enemy.armor||0,amount);run.enemy.armor=Math.max(0,(run.enemy.armor||0)-blocked);
 const damage=amount-blocked;run.enemy.hp=Math.max(0,run.enemy.hp-damage);return damage;
}
function collectBall(b){
 b.alive=false;delivered.push(b);lastDelivery=clock;
 const t=TYPES[b.type];
 let damage=(t.damage||0)+(b.type==='sword'?run.blade:0)+(b.type==='spark'?run.spark:0)+(b.type==='stone'?(run.salvage||0):0);
 const block=(t.block||0)+(b.type==='shield'?run.block:0),heal=(t.heal||0)+(b.type==='heart'?(run.healBonus||0):0),coins=(t.coins||0)+(b.type==='coin'?(run.coinBonus||0):0);
 if(b.type==='spark'&&run.chain)damage+=Math.min(3,delivered.filter(x=>x.type==='spark').length-1)*run.chain;
 const attackPower=damage;
 damage=hurtEnemy(damage);totals.damage+=damage;totals.block+=block;totals.heal+=heal;totals.coins+=coins;
 run.totalCollected++;run.shield+=block;run.hp=Math.min(run.maxHp,run.hp+heal);run.coins+=coins;
 burst(48,MH-15,t.color,6);
 // Damage remains committed at delivery for save integrity. Presentation lands
 // on the projectile's contact frame, rather than before it reaches its target.
 if(attackPower){addBattleFx({kind:'attack',type:b.type,color:t.color,damage,blocked:attackPower-damage,impactAt:.19,duration:.53});heroAttack=.3;}
 if(block)addBattleFx({kind:'shield',color:t.color,value:block,impactAt:.06,duration:.7});
 if(heal)addBattleFx({kind:'heal',color:t.color,value:heal,impactAt:.12,duration:.85});
 if(coins)addBattleFx({kind:'coin',color:t.color,value:coins,impactAt:.08,duration:.65});
 message(`${delivered.length} TREASURES · ${totals.damage} damage · ${totals.block} block${totals.heal?' · '+totals.heal+' heal':''}`);sound('collect',delivered.length);haptic(6);updateUI();
}

function burst(x,y,color,count=12){
 for(let i=0;i<(reducedMotion?Math.min(count,3):count);i++)effects.push({x,y,vx:fxRand(-65,65),vy:fxRand(-95,10),life:fxRand(.28,.55),max:.55,color});
 if(effects.length>72)effects.splice(0,effects.length-72);
}
function float(text,x,y,color,kind='neutral',value=0){
 // Merge simultaneous matching results: numbers stay legible during a big haul.
 const prior=floaters.find(f=>f.kind===kind&&kind!=='neutral'&&f.life>1.04);
 if(prior&&value){prior.value+=value;prior.text=(kind==='damage'?'-':'+')+prior.value+(kind==='block'?' BLOCK':kind==='heal'?' HP':kind==='coin'?' COINS':'');prior.life=1.35;return;}
 const lane=floaters.filter(f=>Math.abs(f.x-x)<70&&f.life>.4).length;
 floaters.push({text,x,y:y-Math.min(lane,3)*15,startY:y-Math.min(lane,3)*15,color,life:1.35,kind,value});
 if(floaters.length>10)floaters.shift();
}
function addBattleFx(fx){battleFx.push({...fx,age:0,impacted:false,seed:fxSeed++});if(battleFx.length>24)battleFx.shift();}
function impactFx(fx){
 if(fx.kind==='attack'){
  if(fx.damage){float('-'+fx.damage,316,63,fx.color,'damage',fx.damage);enemyPulse=.3;shake=Math.max(shake,fx.type==='spark'?2.6:1.8);sound(fx.type==='spark'?'spark':'strike');}
  else{float('ARMOURED',316,62,'#bdd9e9');sound('block');}
 }else if(fx.kind==='shield'){float('+'+fx.value+' BLOCK',95,59,fx.color,'block',fx.value);sound('block');}
 else if(fx.kind==='heal'){float('+'+fx.value+' HP',95,78,fx.color,'heal',fx.value);sound('heal');}
 else if(fx.kind==='coin')float('+'+fx.value+' COINS',210,48,fx.color,'coin',fx.value);
 else if(fx.kind==='enemy'){
  battlePulse=.34;shake=fx.damage?3.8:1.2;sound(fx.damage?'hit':'block');haptic(fx.damage?[12,25,8]:8);
  float(fx.damage?'-'+fx.damage:'BLOCKED',95,65,fx.damage?'#ffc2a9':'#b8f2ec');
 }
}
function resolveLoot(){
 if(!delivered.length)sound('miss');
 if(delivered.length>=4){sound('haul');haptic([8,35,12]);}
 if(delivered.length>=4&&run.haul){totals.damage+=hurtEnemy(run.haul);float('HAUL +'+run.haul,315,50,'#d8ff9f');}
 claw.held=[];combo=delivered.length;comboTime=1.6;
 const {damage,block,heal,coins}=totals;
 const summary=[damage?damage+' damage':'',block?block+' block':'',heal?heal+' healing':'',coins?coins+' coins':''].filter(Boolean).join(' · ');
 message(summary||'Empty scoop. Watch the enemy, then choose your next cluster.');setPhase('resolve');
}
function enemyAttack(){
 const intent=P.intentFor(run.enemy,run.turn||0);run.turn=(run.turn||0)+1;
 if(intent.type==='guard'){
  run.enemy.armor=(run.enemy.armor||0)+intent.armor;
  float('+'+intent.armor+' GUARD',315,66,'#96dadb');message(run.enemy.name+' reinforces its armour.');
 }else if(intent.type==='mend'){
  run.enemy.hp=Math.min(run.enemy.maxHp,run.enemy.hp+intent.heal);float('REPAIR +'+intent.heal,315,66,'#b3e2a5');message('The guardian repairs itself. Press the attack.');
 
 }else{
  let incoming=intent.damage,blocked=Math.min(run.shield,incoming),damage=incoming-blocked;
  run.shield-=blocked;run.hp=Math.max(0,run.hp-damage);
  addBattleFx({kind:'enemy',color:damage?'#ffb38e':'#a8efe5',damage,blocked,impactAt:.16,duration:.5});
  if(blocked&&run.thorns)hurtEnemy(run.thorns);
  message(damage?`Enemy hit for ${damage}${blocked?' · '+blocked+' blocked':''}.`:'Your shields absorbed the attack.');
 }
 setPhase('enemy');checkpoint();
}
function mapMarkup(){
 return `<div class="chapter-map" aria-label="Campaign progress">${Array.from({length:12},(_,i)=>`<span class="map-node ${i+1<run.floor?'done':i+1===run.floor?'current':''} ${(i+1)%4===0?'boss':''}">${i+1<run.floor?iconMark('✓'):(i+1)%4===0?iconMark('♜'):i+1}</span>`).join('')}</div>`;
}
function reward(){
 if(run.stage!=='reward'){
  sound('win');haptic([12,45,20]);const loot=P.clearReward(run);run.rewardsLeft=loot.choices;
  run.cleared=run.floor;
  run.hp=Math.min(run.maxHp,run.hp+(run.onWinHeal||0));
  if(run.floor>=12){gameOver(true);return;}
  run.stage='reward';run.pendingUpgrades=P.upgradeChoices(run,3).map(u=>u.id);
 }
 setPhase('reward');checkpoint();
 const picks=run.pendingUpgrades.map(id=>P.UPGRADES.find(u=>u.id===id)).filter(Boolean);
 openModal('reward',run.enemy.boss?'GUARDIAN DEFEATED':'CHAMBER CLEARED','Build something powerful.','Choose one permanent upgrade for this expedition.',picks.map(u=>({mark:u.mark,title:u.name,desc:u.desc,action:()=>{
  P.applyUpgrade(run,u.id);sound('upgrade');haptic([8,30,12]);run.rewardsLeft--;run.pendingUpgrades=[];closeModal();if(run.rewardsLeft>0){run.pendingUpgrades=P.upgradeChoices(run,3).map(u=>u.id);reward()}else{run.stage='route';showRoute()}
 }})),mapMarkup());
}
function showRoute(){
 run.stage='route';checkpoint();
 const choices=P.routeChoices(run);
 openModal('route','THE EXPEDITION','Choose your next path.',`Chamber ${run.floor+1} awaits. ${run.hp}/${run.maxHp} health · ${run.coins} coins`,choices.map(r=>({mark:r.mark,title:r.name,desc:r.desc,action:()=>{
  const result=P.applyRoute(run,r.id);if(!result)return;run.floor++;run.act=Math.ceil(run.floor/4);closeModal();
  if(result.opensShop){showShop();return;}
  startFloor();
 }})),mapMarkup());
}
function showShop(){
 run.stage='shop';checkpoint();
 const offers=P.shopOffers(run);
 openModal('shop','THE TINKER’S WORKSHOP','Make every coin count.',`Your purse: ${run.coins} coins. Repairs and upgrades last for this run.`,[
  ...offers.map(o=>({mark:o.mark||'✦',title:`${o.name} · ${o.price} coins`,desc:o.desc,disabled:run.coins<o.price||o.disabled,action:()=>{P.buy(run,o.id);showShop()}})),
  {mark:'→',title:'Enter the next chamber',desc:'Leave the workshop and continue.',action:()=>{closeModal();run.stage='battle';startFloor()}}
 ],mapMarkup());
}
function gameOver(won){
 if(won)sound('win');
 run.stage='over';run.won=won;P.finishRun(run,won);P.clearRun();setPhase('over');
 const meta=P.loadMeta();
 openModal('over',won?'THE VAULT IS YOURS':'EXPEDITION COMPLETE',won?'A little machine. A mighty legend.':'Back to the workshop.',`Chamber ${run.floor}/12 · ${run.totalCollected} treasures collected<br>${won?'All three guardians defeated.':'Every expedition teaches you a better build.'}`, [
  {mark:'⚙',title:'Workshop',desc:'Spend earned embers on permanent improvements.',action:showWorkshop},
  {mark:'↻',title:'Choose a new expedition',desc:'Try a different loadout and a different build.',action:showLoadouts}
 ],`<div class="stat-grid"><div class="stat-card"><b>${meta.bestFloor||run.floor}</b><small>DEEPEST CHAMBER</small></div><div class="stat-card"><b>${meta.wins||0}</b><small>VAULTS OPENED</small></div></div>`);
}
function credit(){
 if(run.coins<8){gameOver(false);return;}
 openModal('credit','POWER DEPLETED','Keep the machine running?',`Spend 8 coins for 3 more drops. You have ${run.coins} coins.`,[
  {mark:'ϟ',title:'Refuel · 8 coins',desc:'Add three drops to this chamber.',action:()=>{run.coins-=8;run.drops=3;closeModal();setPhase('return');checkpoint()}},
  {mark:'↗',title:'Retire this expedition',desc:'Keep your expedition record and unlocks.',action:()=>gameOver(false)}
 ]);
}
function checkpoint(){
 if(!started||!run||run.stage==='over')return;
 P.saveRun({run,claw:{...claw,held:[]},balls,phase,phaseTime,clock,delivered,totals,lastDelivery});
}
function restore(snapshot){
 run=snapshot.run;claw={...snapshot.claw,held:[],pL:snapshot.claw.pL??(-.1+.72*snapshot.claw.open),pR:snapshot.claw.pR??(-.1+.72*snapshot.claw.open),haltL:!!snapshot.claw.haltL,haltR:!!snapshot.claw.haltR,vx:snapshot.claw.vx||0,vy:snapshot.claw.vy||0};pendingDrop=false;balls=snapshot.balls;phase=snapshot.phase;phaseTime=snapshot.phaseTime||0;
 clock=snapshot.clock||0;delivered=snapshot.delivered||[];totals=snapshot.totals||{damage:0,block:0,heal:0,coins:0};lastDelivery=snapshot.lastDelivery||0;
 effects=[];floaters=[];battleFx=[];heroAttack=0;engine.reset(jawSegments());started=true;closeModal();updateUI();
 if(run.stage==='reward')reward();else if(run.stage==='route')showRoute();else if(run.stage==='shop')showShop();else if(phase==='enemy'&&run.drops<=0&&phaseTime>.5)credit();
 else message('Expedition restored. Your next move awaits.');
}
function showLoadouts(){
 const options=P.loadouts?P.loadouts(P.loadMeta()):[{id:'scrapper',name:'The Scrapper',mark:'⚙',desc:'Balanced equipment. A dependable start.',unlocked:true}];
 openModal('loadouts','PREPARE YOUR EXPEDITION','Choose your machine.','Twelve chambers. Three guardians. One priceless power core.',options.map(l=>({mark:l.mark||'⚙',title:l.name,desc:l.unlocked?l.desc:l.requirement,disabled:l.unlocked===false,action:()=>{newRun(l.id);sound('collect');}})));
}
function welcome(snapshot){
 openModal('welcome','CLAWBOUND · THE SUNKEN VAULT','Fortune favours the claw.','Pilot a tiny salvager into a forgotten mechanical kingdom. Scoop your weapons. Forge your build. Crack the vault.',[
 ...(snapshot?[{mark:'▶',title:`Continue · chamber ${snapshot.run.floor}`,desc:'Resume your saved expedition.',action:()=>restore(snapshot)}]:[]),
 {mark:'✦',title:snapshot?'New expedition':'Begin expedition',desc:'Choose your machine and descend into the vault.',action:showLoadouts},
 {mark:'⚙',title:'Workshop',desc:'Permanent improvements and expedition records.',action:()=>showWorkshop(()=>welcome(snapshot))},
 {mark:'?',title:'How to play',desc:'Learn the claw, loot, and enemy intentions.',action:()=>help(()=>welcome(snapshot))}
 ],'<canvas class="modal-art" id="titleArt" width="420" height="180" aria-label="A brass salvager waits at the vault"></canvas>');
 drawTitleArt();
}

function drawTitleArt(){const c=$('#titleArt');if(c&&modalMode==='welcome'){const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,420,180);A.battle(g,1,reducedMotion?0:uiClock);A.hero(g,210,120,1.2,reducedMotion?0:uiClock,{reducedMotion});}}
function update(dt){if(paused)return;clock+=dt;phaseTime+=dt;claw.prevX=claw.x;claw.prevY=claw.y;
if(phase==='aim'){
 const [lo,hi]=aimBounds();
 if(leftHeld||rightHeld){pendingDrop=false;aimTarget=null;claw.x+=((rightHeld?1:0)-(leftHeld?1:0))*260*dt}
 else if(aimTarget!==null)claw.x+=clamp(aimTarget-claw.x,-360*dt,360*dt);
 claw.x=clamp(claw.x,lo,hi);claw.pL=Math.min(PHI_OPEN,claw.pL+3*dt);claw.pR=Math.min(PHI_OPEN,claw.pR+3*dt);
 if(pendingDrop&&(aimTarget===null||Math.abs(aimTarget-claw.x)<2))drop();
}
if(phase==='return'){
 const [lo,hi]=aimBounds(),goal=clamp(aimTarget??claw.homeX??210,lo,hi);
 claw.x+=clamp(goal-claw.x,-310*dt,310*dt);
 claw.pL=Math.min(PHI_OPEN,claw.pL+3.2*dt);claw.pR=Math.min(PHI_OPEN,claw.pR+3.2*dt);
 if(Math.abs(goal-claw.x)<.1){setPhase('aim');message('Drag and release to grab. Choose a cluster you can wrap around.');if(pendingDrop)drop()}
}
if(phase==='down'){
 claw.vy=Math.min(230,(claw.vy||0)+1800*dt);claw.y=Math.min(claw.depth,claw.y+claw.vy*dt);
 claw.contactTime=(contactInfo.touchedIds||[]).includes('hub')?claw.contactTime+dt:0;
 if(claw.y>=claw.depth||claw.contactTime>.018)closeGrip();
}
if(phase==='close'){
 const pressure=contactInfo.jawPressure||{};
 // Each motor yields under its own load, then continues as the pile settles.
 // A first-impact latch would freeze both fingers open after the descent.
 const leftSpeed=2.6/(1+Math.max(0,(pressure.left||0)-1)*.25);
 const rightSpeed=2.6/(1+Math.max(0,(pressure.right||0)-1)*.25);
 claw.pL=Math.max(PHI_CLOSED,claw.pL-leftSpeed*dt);
 claw.pR=Math.max(PHI_CLOSED,claw.pR-rightSpeed*dt);
 claw.haltL=claw.pL<=PHI_CLOSED;claw.haltR=claw.pR<=PHI_CLOSED;
 const done=(claw.haltL||claw.pL<=PHI_CLOSED)&&(claw.haltR||claw.pR<=PHI_CLOSED);
 if((done&&phaseTime>.19)||phaseTime>.55){capture();claw.vy=0;setPhase('up');}
}
if(phase==='up'){
 claw.vy=Math.min(175,(claw.vy||0)+950*dt);claw.y=Math.max(40,claw.y-claw.vy*dt);
 // A small deterministic relaxation lets unsupported pieces slip; grip upgrades reduce it.
 if(phaseTime<.24){const relax=Math.max(0,1.2-run.grip)*.12;claw.pL+=relax*dt;claw.pR+=relax*dt;}
 if(claw.y<=40){claw.vx=0;setPhase('carry');message('Hold on… delivering your catch.');}
}
if(phase==='carry'){
 const distance=claw.x-48;claw.vx=Math.min(280,(claw.vx||0)+1250*dt,Math.sqrt(Math.max(0,distance)*1600));
 claw.x=Math.max(48,claw.x-Math.max(30,claw.vx)*dt);
 if(claw.x<=48){setPhase('release');sound('release');}
}
if(phase==='release'){
 claw.pL=Math.min(PHI_OPEN,claw.pL+3.2*dt);claw.pR=Math.min(PHI_OPEN,claw.pR+3.2*dt);
 const pending=balls.some(b=>b.alive&&b.x<CHUTE&&b.y<MH+25);
 if((phaseTime>.55&&!pending&&clock-lastDelivery>.15)||phaseTime>2.4)resolveLoot();
}
claw.open=clamp(((claw.pL+claw.pR)/2-PHI_CLOSED)/(PHI_OPEN-PHI_CLOSED),0,1);
if(phase==='resolve'&&phaseTime>.55){if(run.enemy.hp<=0)reward();else enemyAttack()}
if(phase==='enemy'&&phaseTime>.5){if(run.hp<=0)gameOver(false);else if(run.enemy.hp<=0)reward();else if(run.drops<=0)credit();else{setPhase('return');message('Returning to your last aim.')}}
if(paused)return;
for(const fx of battleFx){fx.age+=dt;if(!fx.impacted&&fx.age>=fx.impactAt){fx.impacted=true;impactFx(fx);}}
heroAttack=Math.max(0,heroAttack-dt);battleFx=battleFx.filter(fx=>fx.age<fx.duration);
physics(dt);comboTime=Math.max(0,comboTime-dt);shake*=Math.pow(.9,dt*60);battlePulse=Math.max(0,battlePulse-dt);enemyPulse=Math.max(0,enemyPulse-dt);for(const p of effects){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;p.life-=dt}effects=effects.filter(p=>p.life>0);for(const f of floaters){if(!reducedMotion)f.y-=12*dt;f.life-=dt}floaters=floaters.filter(f=>f.life>0);saveClock+=dt;if(saveClock>=1){saveClock=0;checkpoint()}
}
function rounded(g,x,y,w,h,r,fill,stroke){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.stroke()}}
function ellipse(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()}
function line(g,pts,color,width){g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke()}
function drawBall(g,b){if(b.parts)ClawLoot.draw(g,b,TYPES[b.type]);else A.ball(g,b,TYPES[b.type]);}
function drawMachine(){const g=ctx;g.clearRect(0,0,MW,MH);A.machine(g,{width:MW,height:MH,floor:FLOOR,chute:CHUTE,time:reducedMotion?0:clock});
if(phase==='aim'){g.save();g.setLineDash([3,6]);line(g,[{x:claw.x,y:claw.y+76},{x:claw.x,y:FLOOR-12}],'#c8f29b35',1);g.restore();ellipse(g,claw.x,FLOOR-8,halfWidth()*.9,6,'#b6ed7825')}
for(const b of balls)if(b.alive)drawBall(g,b);
A.claw(g,{x:claw.x,y:claw.y,jaws:jawPoints(),time:reducedMotion?0:clock,phase,load:claw.held.length,reducedMotion});
for(const p of effects){g.globalAlpha=p.life/p.max;ellipse(g,p.x,p.y,2.4,2.4,p.color)}g.globalAlpha=1;
if(comboTime>0&&combo>0){
 g.save();g.globalAlpha=Math.min(1,comboTime*3);
 const big=combo>=4,entrance=clamp((1.6-comboTime)/.16,0,1),y=reducedMotion?55:55+(1-entrance)*8;
 const label=big?'TREASURE HAUL':'SCOOP DELIVERED';
 g.font='800 11px "Manrope", system-ui';g.textAlign='center';
 const w=big?174:162;
 rounded(g,(MW-w)/2,y-19,w,39,12,'#09272fee',big?'#e4be73':'#75bfb888');
 g.fillStyle=big?'#f7dc9a':'#d4eee4';g.fillText(label,MW/2-10,y-3);
 g.font='800 17px "Manrope", system-ui';g.fillText('×'+combo,MW/2+w/2-24,y+2);
 g.restore();
}
g.textAlign='left';g.fillStyle='#ffffff04';g.beginPath();g.moveTo(20,0);g.lineTo(83,0);g.lineTo(173,MH);g.lineTo(141,MH);g.fill();
}
function robot(g,x,y,s,t,state={}){A.hero(g,x,y,s,reducedMotion?0:t,{...state,reducedMotion})}
function monster(g,x,y,s,t,kind,state={}){A.enemy(g,x,y,s,reducedMotion?0:t,kind,run.enemy.act,{...state,reducedMotion})}
function sparkRays(g,x,y,p,color,seed=0,size=1){
 g.strokeStyle=color;g.lineCap='round';
 for(let i=0;i<7;i++){
  const a=i*Math.PI*2/7+seed*.11,r=(7+p*20)*size,l=(1-p)*11*size;
  g.lineWidth=i%2?1.4:2.4;g.beginPath();g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.lineTo(x+Math.cos(a)*(r+l),y+Math.sin(a)*(r+l));g.stroke();
 }
}
function drawBattleFx(g,fx){
 const p=fx.age/fx.duration,after=clamp((fx.age-fx.impactAt)/(fx.duration-fx.impactAt),0,1);
 g.save();g.lineCap='round';g.lineJoin='round';
 if(fx.kind==='attack'){
  if(fx.age<fx.impactAt&&!reducedMotion){
   const travel=fx.age/fx.impactAt,x=lerp(130,308,travel),y=105-Math.sin(travel*Math.PI)*(fx.type==='spark'?31:16);
   g.globalAlpha=.8;g.strokeStyle=fx.color;g.lineWidth=fx.type==='spark'?4:2;
   g.beginPath();g.moveTo(x-24,y+5);g.quadraticCurveTo(x-10,y+2,x,y);g.stroke();
   g.globalAlpha=1;
   if(fx.type==='sword'){g.translate(x,y);g.rotate(-.24);rounded(g,-13,-2,26,4,2,'#fff4d0');line(g,[{x:-6,y:-6},{x:-6,y:6}],fx.color,3);}
   else if(fx.type==='spark'){ellipse(g,x,y,5,5,'#f7eaff');g.strokeStyle=fx.color;g.lineWidth=1;g.beginPath();g.arc(x,y,9,0,Math.PI*2);g.stroke();}
   else{g.translate(x,y);g.rotate(travel*5);rounded(g,-4,-4,8,8,2,fx.color);}
  }else if(fx.impacted){
   g.globalAlpha=(1-after)*(fx.damage?1:.65);
   if(fx.damage){
    if(!reducedMotion)sparkRays(g,316,106,after,fx.color,fx.seed,fx.type==='spark'?1.25:1);
    g.strokeStyle=after<.25?'#fff3d0':fx.color;g.lineWidth=(1-after)*4+1;
    if(fx.type==='spark'){g.beginPath();g.arc(316,106,9+after*28,0,Math.PI*2);g.stroke();}
    else {g.beginPath();g.moveTo(305-after*10,120+after*4);g.quadraticCurveTo(309,101,332+after*10,90-after*4);g.stroke();}
   }else{g.strokeStyle='#c5e3e5';g.lineWidth=3;g.beginPath();g.ellipse(303,109,20+after*8,32,0,Math.PI*.55,Math.PI*1.45);g.stroke();}
  }
 }else if(fx.kind==='enemy'){
  if(fx.age<fx.impactAt){
   g.globalAlpha=.5*(fx.age/fx.impactAt);g.strokeStyle='#ffd8ad';g.lineWidth=2;g.beginPath();g.ellipse(299,112,22,31,0,Math.PI*.7,Math.PI*1.4);g.stroke();
  }else{
   g.globalAlpha=1-after;g.strokeStyle=fx.color;g.lineWidth=fx.damage?3:2;
   if(fx.damage){if(!reducedMotion)sparkRays(g,103,109,after,fx.color,3,.9);g.beginPath();g.moveTo(79,94);g.lineTo(121,122);g.stroke();}
   else{g.beginPath();g.ellipse(113,109,27+after*12,38+after*6,0,-1.35,1.35);g.stroke();}
  }
 }else if(fx.kind==='shield'){
  g.globalAlpha=Math.sin(p*Math.PI)*.8;g.strokeStyle=fx.color;g.lineWidth=2.5*(1-p)+1;
  const r=26+(reducedMotion?0:p*13);g.beginPath();g.moveTo(101,78-p*5);g.lineTo(101+r,91);g.lineTo(101+r*.8,119);g.quadraticCurveTo(114,138,101,145);g.quadraticCurveTo(88,138,101-r*.8,119);g.lineTo(101-r,91);g.closePath();g.stroke();
 }else if(fx.kind==='heal'){
  g.globalAlpha=Math.sin(p*Math.PI)*.85;
  for(let i=0;i<4;i++){const x=79+i*14,y=134-(reducedMotion?15:p*44)-i%2*10;g.fillStyle=fx.color;g.fillRect(x-1.5,y-4,3,8);g.fillRect(x-4,y-1.5,8,3);}
  g.strokeStyle=fx.color;g.lineWidth=1.5;g.beginPath();g.ellipse(101,146,26+p*8,5,0,0,Math.PI*2);g.stroke();
 }else if(fx.kind==='coin'){
  g.globalAlpha=Math.sin(p*Math.PI);const y=109-(reducedMotion?15:p*34);g.strokeStyle=fx.color;g.lineWidth=2;g.beginPath();g.ellipse(210,y,6,8,0,0,Math.PI*2);g.stroke();g.fillStyle='#fff2c4';g.fillRect(209,y-4,2,8);
 }
 g.restore();
}
function drawBattle(){
 const g=art;g.clearRect(0,0,420,180);A.battle(g,run.floor,reducedMotion?0:clock);
 const attacking=phase==='enemy'&&phaseTime<.4&&P.intentFor(run.enemy,Math.max(0,run.turn-1)).damage>0;
 g.save();if(shake>.15&&!reducedMotion)g.translate(Math.sin(clock*73)*shake*.55,Math.cos(clock*59)*shake*.18);
 robot(g,101,116,.94,clock,{attack:heroAttack/.3,hit:battlePulse/.34,dead:run.hp<=0&&!battleFx.some(f=>f.kind==='enemy'&&!f.impacted)});
 monster(g,316,117,run.enemy.boss?.96:.92,clock,run.enemy.kind,{attack:attacking?Math.sin(phaseTime/.4*Math.PI):0,hit:enemyPulse/.3,dead:run.enemy.hp<=0&&!battleFx.some(f=>f.kind==='attack'&&!f.impacted)});
 if(run.shield>0){g.strokeStyle='#a8eefa65';g.lineWidth=1.5;g.beginPath();g.ellipse(101,113,40,43,0,-1.2,1.2);g.stroke();}
 if(run.enemy.armor>0){g.strokeStyle='#d2c2ef88';g.lineWidth=1.5;g.beginPath();g.ellipse(316,113,42,44,0,Math.PI-1.2,Math.PI+1.2);g.stroke();}
 for(const fx of battleFx)drawBattleFx(g,fx);
 g.restore();
 for(const f of floaters){
  g.save();const age=1.35-f.life,pop=reducedMotion?1:1+.12*Math.sin(clamp(age/.15,0,1)*Math.PI);
  g.globalAlpha=clamp(f.life*3,0,1);g.translate(f.x,f.y);g.scale(pop,pop);
  g.font=f.kind==='damage'?'700 23px "Barlow Condensed", sans-serif':'700 13px "Manrope", sans-serif';g.textAlign='center';g.lineJoin='round';g.lineWidth=4;
  g.strokeStyle='#08232cf0';g.strokeText(f.text,0,0);g.fillStyle=f.color;g.fillText(f.text,0,0);g.restore();
 }
}
function resizeCanvas(canvas,g,w,h){const dpr=Math.min(window.devicePixelRatio||1,2);const width=Math.round(w*dpr),height=Math.round(h*dpr);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}g.setTransform(dpr,0,0,dpr,0,0)}
function render(){resizeCanvas(machine,ctx,MW,MH);resizeCanvas(battle,art,420,180);drawMachine();drawBattle();if(modalMode==='welcome')drawTitleArt()}
function frame(t){if(document.hidden){last=t;requestAnimationFrame(frame);return;}const dt=Math.min(.05,(t-last)/1000||STEP);last=t;uiClock+=dt;accumulator+=dt;while(accumulator>=STEP){update(STEP);accumulator-=STEP}render();requestAnimationFrame(frame)}
function closeModal(){if($('#modal').open)$('#modal').close();paused=false;modalMode='';leftHeld=rightHeld=false;aimTarget=null;$('#pause').setAttribute('aria-label','Pause expedition')}
function openModal(mode,eyebrow,title,copy,choices,extra=''){paused=true;pendingDrop=false;modalMode=mode;$('#modal').setAttribute('data-mode',mode);leftHeld=rightHeld=false;aimTarget=null;$('#modalEyebrow').textContent=eyebrow;$('#modalTitle').textContent=title;$('#modalCopy').innerHTML=copy;$('#modalExtra').innerHTML=extra;$('#choices').replaceChildren();for(const choice of choices){const b=document.createElement('button');b.className='choice';b.innerHTML=`<span class="choice-mark">${iconMark(choice.mark)}</span><span><b>${choice.title}</b><small>${choice.desc||''}</small></span><span class="arrow">${iconMark('→')}</span>`;b.disabled=!!choice.disabled;b.style.setProperty?.('--choice-index',$('#choices').children.length);b.onclick=()=>{sound('ui');choice.action()};$('#choices').append(b)}if(!$('#modal').open)$('#modal').showModal();updateUI()}
function help(back){
 if(paused&&!back)return;
 openModal('help','THE SALVAGER’S FIELD GUIDE','Aim. Scoop. Survive.','Drag across the glass and release to grab, or aim with the arrows and press Grab. While descending, tap Close Now to choose the depth. Swords, shields, gems, and coins tumble differently. Each finger slows under resistance as it wraps around the pile; loose pieces can slip. Only treasure delivered down the left chute powers your machine.',[
 {mark:'✓',title:back?'Back to the vault':'Keep playing',desc:'Watch the enemy’s next move before you grab.',action:back||(()=>{closeModal();updateUI()})}
 ],`<div class="legend">${Object.entries(TYPES).map(([id,t])=>`<div class="legend-row"><span class="sample" style="background:${t.color};color:${t.dark}">${iconMark({sword:'⚔',shield:'◇',heart:'♥',spark:'ϟ',coin:'●',stone:'▪'}[id])}</span><span>${t.name} · ${{sword:4+run.blade+' damage',shield:4+run.block+' block',heart:3+(run.healBonus||0)+' healing',spark:6+run.spark+' damage',coin:2+(run.coinBonus||0)+' coins',stone:1+(run.salvage||0)+' damage'}[id]}</span></div>`).join('')}</div><p class="modal-copy">Shields carry between attacks. Clear chambers to choose upgrades. Routes offer healing, merchants, or tougher enemies with better rewards. Defeat the guardians in chambers 4, 8, and 12.</p>`);
}
function showWorkshop(back=showLoadouts){
 const meta=P.loadMeta();
 openModal('workshop','PERMANENT PROGRESSION','The salvager’s workshop.',`You have ${meta.embers} embers. Earn more by completing expeditions. Improvements apply to new runs.`,[
 ...P.workshopOffers().map(o=>({mark:o.mark,title:`${o.name} · ${o.level}/${o.max}`,desc:o.level>=o.max?'Fully upgraded':`${o.price} embers · ${o.desc}`,disabled:o.level>=o.max||meta.embers<o.price,action:()=>{P.buyWorkshop(o.id);showWorkshop(back)}})),
 {mark:'→',title:'Back',desc:`${meta.runs} expeditions · ${meta.wins} victories · ${meta.totalCollected} treasures`,action:back}
 ]);
}
function showBuild(){
 if(paused)return;
 openModal('build','YOUR MACHINE','Anatomy of a salvager.',`Health ${run.hp}/${run.maxHp} · Grip ${Math.round(run.grip*100)}%`,[
 {mark:'✓',title:'Return to the machine',action:()=>{closeModal();updateUI()}}
 ],`<div class="legend">${Object.entries(run.relics).map(([id,count])=>{const u=P.upgradeById(id);return u?`<div class="legend-row"><span class="choice-mark">${iconMark(u.mark)}</span><span><b>${u.name} ×${count}</b><br>${u.desc}</span></div>`:''}).join('')||'<p class="modal-copy">Clear your first chamber to choose an upgrade.</p>'}</div>`);
}
function showMap(){
 if(paused)return;
 openModal('map','YOUR EXPEDITION','Three acts. One vault.',`Chamber ${run.floor} of 12 · ${P.actFor(run.floor).subtitle}`,[
 {mark:'✓',title:'Return to the machine',action:()=>{closeModal();updateUI()}}
 ],mapMarkup()+`<div class="legend">${P.ACTS.map((a,i)=>`<div class="legend-row"><span class="choice-mark">${i+1}</span><span><b>${a.short}</b><br>Chambers ${i*4+1}–${i*4+4} · ${a.subtitle}</span></div>`).join('')}</div>`);
}
function pause(){
 if(paused)return;checkpoint();
 openModal('pause','TAKE A BREATHER','The vault can wait.','Your expedition is saved on this device.',[
 {mark:'▶',title:'Keep playing',desc:'Return to the machine.',action:()=>{closeModal();updateUI()}},
 {mark:'?',title:'Field guide',desc:'Review loot and enemy intentions.',action:()=>help(()=>{closeModal();pause()})},
 {mark:'◇',title:'Privacy & support',desc:'Your progress stays on this device.',action:()=>openModal('privacy','CLAWBOUND 1.1','Your vault. Your progress.','No accounts, advertising, analytics, or in-app purchases. Your saved expedition, workshop, and sound preference are stored on this device. Clearing app or browser data erases them.',[{mark:'←',title:'Back',action:()=>{closeModal();pause()}}],'<p class="modal-copy"><a href="privacy.html">Read the privacy policy</a> · <a href="https://github.com/RoxorLoops1337/claw-rogue/issues" target="_blank" rel="noopener">Get support</a></p>')},
 {mark:'↗',title:'Retire expedition',desc:'End this run and bank your earned embers.',action:()=>openModal('retire','RETURN TO THE WORKSHOP','Finish this expedition?', 'Your current run will end. Earned embers and unlocks will be kept.',[
 {mark:'▶',title:'Keep exploring',action:()=>{closeModal();updateUI()}},
 {mark:'↗',title:'Finish expedition',action:()=>gameOver(false)}])}
 ]);
}
function hold(button,key){button.addEventListener('pointerdown',e=>{if(paused||phase!=='aim')return;e.preventDefault();button.setPointerCapture(e.pointerId);if(key==='left')leftHeld=true;else rightHeld=true;aimTarget=null});const stop=()=>{if(key==='left')leftHeld=false;else rightHeld=false};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>button.addEventListener(ev,stop))}
hold($('#left'),'left');hold($('#right'),'right');
let dragging=false,dragStart=0,dragMoved=false;
function aim(e){
 if(paused||!['aim','up','carry','release','return'].includes(phase))return;
 const rect=machine.getBoundingClientRect(),[lo,hi]=aimBounds();
 aimTarget=clamp((e.clientX-rect.left)/rect.width*MW,lo,hi);
}
machine.addEventListener('pointerdown',e=>{
 if(paused)return;
 if(phase==='down'){closeGrip();return;}
 if(!['aim','up','carry','release','return'].includes(phase))return;
 e.preventDefault();dragging=true;dragStart=e.clientX;dragMoved=false;machine.setPointerCapture(e.pointerId);aim(e);
});
machine.addEventListener('pointermove',e=>{if(dragging){dragMoved ||= Math.abs(e.clientX-dragStart)>8;aim(e)}});
machine.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;if(dragMoved){pendingDrop=true;if(phase==='aim')drop()}});
['pointercancel','lostpointercapture'].forEach(ev=>machine.addEventListener(ev,()=>{dragging=false;}));
$('#sound').onclick=toggleSound;$('#sound').setAttribute('data-muted',String(muted));$('#sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');$('#sound').setAttribute('aria-pressed',String(!muted));$('#drop').onclick=drop;$('#help').onclick=()=>help();$('#build').onclick=showBuild;$('#map').onclick=showMap;$('#pause').onclick=pause;$('#modal').addEventListener('cancel',e=>{e.preventDefault();if(['pause','build','map'].includes(modalMode)){closeModal();updateUI()}});window.addEventListener('keydown',e=>{if(paused)return;if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='ArrowLeft'||e.code==='KeyA'){leftHeld=true;aimTarget=null}if(e.code==='ArrowRight'||e.code==='KeyD'){rightHeld=true;aimTarget=null}if(e.code==='Space'&&!e.repeat)drop();if(e.code==='Escape')pause()});window.addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')leftHeld=false;if(e.code==='ArrowRight'||e.code==='KeyD')rightHeld=false});window.addEventListener('blur',()=>{leftHeld=rightHeld=false;dragging=false});document.addEventListener('visibilitychange',()=>{if(document.hidden){checkpoint();leftHeld=rightHeld=false;last=0;accumulator=0;if(!paused&&started)pause()}});window.addEventListener('pagehide',checkpoint);
const saved=P.loadRun();run=P.createRun();startFloor();paused=true;requestAnimationFrame(frame);
let loadingFinished=false;
function finishLoading(){
 if(loadingFinished)return;loadingFinished=true;
 // A native dialog occupies the top layer, above the branded loading screen.
 // Open it only when the first illustrated frame is ready, and never reopen it
 // if an expedition has already begun while a late resource finishes loading.
 const boot=$('#bootScreen');if(boot)boot.hidden=true;
 if(!started)welcome(saved);
}
if(typeof Image==='undefined')finishLoading();
else if(A.ready)A.ready.then(()=>{finishLoading();drawTitleArt();},finishLoading);
else finishLoading();
document.fonts?.ready.then(drawTitleArt);
setTimeout(finishLoading,2500);
})();
