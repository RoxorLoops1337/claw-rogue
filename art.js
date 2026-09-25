/* Painted sprites with a vector fallback. Claw geometry always follows the solver. */
(function(root){
'use strict';
const TAU=Math.PI*2;
// These optional images are presentation only: physics starts immediately, and a
// failed or slow request keeps the original vector characters fully playable.
function loadArt(url){
 if(typeof root.Image!=='function')return {image:null,ready:Promise.resolve(false)};
 const image=new root.Image();image.decoding='async';
 const ready=new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false)});
 image.src=url;return {image,ready};
}
const paintedCharacters=loadArt('assets/characters-v3.webp');
const paintedVault=loadArt('assets/art-v4/vault.webp');
const actorNames=['hero','slime','beetle','ghost','golem','root','prism','astral'];
const sculptedActors=actorNames.map(name=>loadArt('assets/art-v4/'+name+'.webp'));
// Source rectangles were reviewed against the actual generated atlas. Its
// row spacing is irregular, so no assumption of uniform grid crops is made.
const portraitFrames=[
 [49,8,353,393], [470,84,384,311], [894,37,420,365], [1376,0,389,402],
 [0,441,447,443], [450,397,450,488], [906,397,420,489], [1325,396,449,489]
];
function isReady(asset){return asset.image&&asset.image.complete&&asset.image.naturalWidth>0}
const actorFlashes=new WeakMap();
function flashImage(image){
 if(actorFlashes.has(image))return actorFlashes.get(image);
 let canvas;
 if(typeof root.OffscreenCanvas==='function')canvas=new root.OffscreenCanvas(image.naturalWidth,image.naturalHeight);
 else if(root.document&&typeof root.document.createElement==='function'){canvas=root.document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight}
 if(!canvas)return null;
 const g=canvas.getContext('2d');if(!g)return null;
 g.drawImage(image,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#fff8db';g.fillRect(0,0,canvas.width,canvas.height);
 actorFlashes.set(image,canvas);return canvas;
}
function contactShadow(g,x,y,rx,ry,alpha){
 g.save();g.translate(x,y);g.scale(rx,ry);const q=g.createRadialGradient(0,0,0,0,0,1);
 q.addColorStop(0,'rgba(0,7,15,'+alpha+')');q.addColorStop(.4,'rgba(0,7,15,'+(alpha*.65)+')');q.addColorStop(1,'rgba(0,7,15,0)');ellipse(g,0,0,1,1,q);g.restore();
}
// Presentation is driven by normalized attack/hit envelopes from the game.
// No animation owns combat timing, saves, or physical body positions.
function actorPose(index,t,state={}){
 const calm=!!state.reducedMotion,attack=Math.max(0,Math.min(1,state.attack||0)),hit=Math.max(0,Math.min(1,state.hit||0));
 const pose={x:0,y:0,rotation:0,sx:1,sy:1,shadow:1,attack,hit,dead:!!state.dead};
 if(calm){pose.hit=hit;return pose}
 const slow=Math.sin(t*2.2+index),fast=Math.sin(t*5.3+index);
 if(index===0){ // Heavy feet stay planted; chest and head settle as one rigid unit.
  pose.rotation=slow*.012+attack*.11-hit*.10;pose.x=attack*13-hit*7;pose.y=-(Math.sin(t*2.2)**2)*.65;
 }else if(index===1){ // A soft creature conserves apparent volume around its contact point.
  const breath=Math.sin(t*3.5);pose.sx=1+breath*.037+hit*.11-attack*.035;
  pose.sy=1-breath*.037-hit*.13+attack*.10;pose.x=-attack*21+hit*8;pose.y=-attack*5;
 }else if(index===2){ // Beetle shell remains rigid; six feet scuttle below it.
  pose.rotation=fast*.017-attack*.065+hit*.08;pose.x=Math.sin(t*2.65)*.8-attack*22+hit*6;
  pose.y=-Math.abs(fast)*1.25-attack*2;
 }else if(index===3){ // Ghost floats above its shadow, with a slow sideways drift.
  pose.x=Math.sin(t*1.7)*2.2-attack*18+hit*8;pose.y=-7-Math.sin(t*2.1)*3.2-attack*4;
  pose.rotation=Math.sin(t*1.7)*.026-attack*.06;pose.shadow=.75+Math.sin(t*2.1)*.08;
 }else if(index===4){ // Rock creature has a slow, weighty heel-to-toe sway.
  pose.rotation=Math.sin(t*1.6)*.014-attack*.09+hit*.055;pose.x=-attack*15+hit*3;
  pose.y=-Math.max(0,Math.sin(t*1.6))*.6;
 }else{ // Guardians barely idle. Their attack has deliberate mass, not toy-like bobbing.
  pose.rotation=Math.sin(t*1.2)*.007-attack*.075+hit*.035;pose.x=-attack*18+hit*3;
  pose.y=index===6?-2-Math.sin(t*1.5)*1.2:0;
 }
 if(pose.dead){pose.rotation+=(index===0?-1:1)*.20;pose.y+=7;pose.sx*=1.035;pose.sy*=.94}
 return pose;
}
function actorAtmosphere(g,index,x,base,s,t,pose,front){
 if(pose.dead)return;
 const attack=pose.attack;
 if(!front&&index===3){
  glow(g,x,base-39*s,45*s,'#a894ff20');
  for(let i=0;i<3;i++){const q=t*.9+i*2.1,xx=x+Math.sin(q)*30*s,yy=base-24*s+Math.cos(q*1.3)*7*s;
   glow(g,xx,yy,8*s,'#beb4ff24');ellipse(g,xx,yy,1.1*s,1.7*s,'#dacbff88')}
 }
 if(!front&&index>=5){
  const color=index===5?'#a4efad':index===6?'#b7a0ff':'#ffdc8c',r=(index===7?47:42)*s;
  glow(g,x,base-53*s,69*s,color+'14');
  g.save();g.translate(x,base-51*s);g.rotate(t*(index===6?-.09:.055));g.strokeStyle=color+'35';g.lineWidth=.7;
  g.beginPath();g.arc(0,0,r,0,TAU);g.stroke();
  for(let i=0;i<8;i++){const a=i*TAU/8;line(g,[{x:Math.cos(a)*(r-2),y:Math.sin(a)*(r-2)},{x:Math.cos(a)*(r+3),y:Math.sin(a)*(r+3)}],color+'77',1)}
  if(index===7){g.rotate(-t*.11);g.strokeStyle=color+'21';g.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;i?g.lineTo(Math.cos(a)*(r+6),Math.sin(a)*(r+6)):g.moveTo(Math.cos(a)*(r+6),Math.sin(a)*(r+6))}g.closePath();g.stroke()}
  g.restore();
 }
 if(front&&index===2){
  // Small contact scuffs sell the shell's weight without painting fake limbs over the artwork.
  for(let i=0;i<3;i++){const q=(t*1.4+i*.34)%1;g.globalAlpha=(1-q)*.25;ellipse(g,x+(i-1)*18*s+q*5*s,base-q*3*s,(1+q*2)*s,.65*s,'#e5d4ac')}
  g.globalAlpha=1;
 }
 if(front&&index===0){
  // The core reflects on the ground; it does not add an unrelated second face.
  glow(g,x+4*s,base-2*s,(16+attack*9)*s,'#66e9e520');
 }
}
function paintedActor(g,index,x,y,s,t,state={}){
 const sculpted=isReady(sculptedActors[index]);
 if(!sculpted&&!isReady(paintedCharacters))return false;
 const im=sculpted?sculptedActors[index].image:paintedCharacters.image;
 const [sx,sy,sw,sh]=sculpted?[0,0,im.naturalWidth,im.naturalHeight]:portraitFrames[index];
 const unitX=sculpted?1:im.naturalWidth/1774,unitY=sculpted?1:im.naturalHeight/887;
 const height=(index>=5?116:index===1?78:index===2?84:index===4?94:103)*s;
 const width=height*sw/sh,base=y+40*s;
 const calm=!!state.reducedMotion,animTime=calm?0:t,pose=actorPose(index,animTime,state);
 g.save();if(pose.dead)g.globalAlpha=.38;
 const shadowWidth=Math.min(36,width*.35)*pose.shadow;
 contactShadow(g,x+pose.x*.25,base-1,shadowWidth*s,4*s,.56);
 actorAtmosphere(g,index,x,base,s,animTime,pose,false);
 g.translate(x+pose.x*s,base+pose.y*s);g.rotate(pose.rotation);g.scale(pose.sx,pose.sy);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.drawImage(im,sx*unitX,sy*unitY,sw*unitX,sh*unitY,-width/2,-height,width,height);
 if(pose.hit>.01){const flash=flashImage(im);if(flash){g.globalAlpha=pose.hit*.56;g.drawImage(flash,sx*unitX,sy*unitY,sw*unitX,sh*unitY,-width/2,-height,width,height)}}
 g.restore();
 g.save();actorAtmosphere(g,index,x+pose.x*s,base,s,animTime,pose,true);g.restore();
 return true;
}
function ellipse(g,x,y,rx,ry,fill){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=fill;g.fill()}
function round(g,x,y,w,h,r,fill,stroke){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke()}}
function line(g,pts,c,w){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke()}
function gradient(g,x,y,x2,y2,stops){const q=g.createLinearGradient(x,y,x2,y2);stops.forEach(s=>q.addColorStop(s[0],s[1]));return q}
function glow(g,x,y,r,c){const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,c);q.addColorStop(1,'#00000000');ellipse(g,x,y,r,r,q)}
function bolt(g,x,y,r=2){ellipse(g,x,y,r+1,r+1,'#06191d');ellipse(g,x,y,r,r,gradient(g,x-r,y-r,x+r,y+r,[[0,'#ffe6aa'],[.42,'#c0a064'],[1,'#6f5a35']]));line(g,[{x:x-r*.45,y:y+.4},{x:x+r*.45,y:y-.4}],'#4b442e',.8);ellipse(g,x-r*.25,y-r*.43,r*.24,r*.13,'#fff4d8a0')}
function gear(g,x,y,r,t){g.save();g.translate(x,y);g.rotate(t);g.strokeStyle='#9da99813';g.lineWidth=r*.25;g.beginPath();g.arc(0,0,r*.68,0,TAU);g.stroke();for(let i=0;i<12;i++){g.rotate(TAU/12);g.fillStyle='#9da99813';g.fillRect(-r*.11,-r,r*.22,r*.28)}g.restore()}
function machine(g,o={}){
 const w=o.width||420,h=o.height||340,f=o.floor||326,c=o.chute||84,t=o.time||0;
 g.save();g.clearRect(0,0,w,h);
 // An uncluttered deep cabinet lets the actual treasure silhouettes carry the detail.
 g.fillStyle=gradient(g,0,0,0,h,[[0,'#07191f'],[.45,'#102f36'],[1,'#071b25']]);g.fillRect(0,0,w,h);
 glow(g,w*.65,132,183,'#64cbb11a');
 // Quiet inset architecture and a low-intensity glass reflection.
 round(g,c+19,41,w-c-38,h-62,14,'#07192335','#83cdb016');
 round(g,c+24,46,w-c-48,h-72,10,'#07192300','#08171d88');
 g.strokeStyle='#99d7be0c';g.lineWidth=1;
 for(let i=0;i<3;i++){g.beginPath();g.moveTo(c+51+i*65,300);g.lineTo(c+51+i*65,95);g.quadraticCurveTo(c+51+i*65,58,c+79+i*65,57);g.stroke()}
 g.fillStyle=gradient(g,109,0,190,0,[[0,'#cbfff407'],[1,'#cbfff400']]);g.beginPath();g.moveTo(112,34);g.lineTo(173,34);g.lineTo(143,f);g.lineTo(104,f);g.closePath();g.fill();
 // Recessed walls match the solver boundaries at x12 / x408.
 g.fillStyle=gradient(g,0,0,14,0,[[0,'#020d14'],[.5,'#314d4c'],[.83,'#8caa8b'],[1,'#142b2f']]);g.fillRect(0,31,12,h-31);
 g.fillStyle=gradient(g,w-12,0,w,0,[[0,'#142b2f'],[.17,'#8caa8b'],[.5,'#314d4c'],[1,'#020d14']]);g.fillRect(w-12,31,12,h-31);
 line(g,[{x:14,y:37},{x:14,y:132}],'#72cbb348',1);line(g,[{x:w-14,y:37},{x:w-14,y:f-6}],'#72cbb332',1);
 // The delivery well is open underneath, exactly like the physical chute.
 round(g,12,145,c-12,h-145,0,'#031018');
 g.fillStyle=gradient(g,12,0,c,0,[[0,'#05151f'],[.5,'#103331'],[1,'#061a22']]);g.fillRect(15,146,c-18,h-146);
 glow(g,47,h,83,'#79efb331');
 round(g,24,154,47,23,6,'#133830','#80cba524');g.font='700 8px "Manrope",system-ui';g.textAlign='center';g.fillStyle='#a6d7bc';g.fillText('DELIVER',47.5,169);
 for(let i=0;i<3;i++){const q=(t*.32+i/3)%1,yy=194+q*102;g.globalAlpha=Math.sin(q*Math.PI)*.52;line(g,[{x:40,y:yy},{x:48,y:yy+5},{x:56,y:yy}],'#96f0bd',1.7)}g.globalAlpha=1;
 line(g,[{x:c,y:149},{x:c,y:h+8}],'#020e15',9);line(g,[{x:c,y:149},{x:c,y:h+8}],'#927b4e',5);
 line(g,[{x:c-1.2,y:151},{x:c-1.2,y:h+8}],'#ead5a1',1.1);bolt(g,c,149,3);
 // Machined rail: metal top bevel, black belt, narrow jade service light.
 round(g,8,10,w-16,23,6,'#020e16','#42716b55');
 round(g,13,14,w-26,5,2,gradient(g,0,14,0,19,[[0,'#e9d39a'],[.45,'#c3a369'],[1,'#665738']]));
 round(g,17,23,w-34,5,2,'#06131a');
 for(let x=21;x<w-17;x+=16){g.fillStyle='#41606166';g.fillRect(x,24,6,2)}
 line(g,[{x:21,y:31},{x:w-21,y:31}],'#8adcc62a',.7);bolt(g,13,25,1.7);bolt(g,w-13,25,1.7);
 // Solid tray lip remains exactly on the collision floor. No fake glass floor in the chute.
 round(g,c,f,w-c-8,h-f,2,gradient(g,0,f,0,h,[[0,'#e0c88b'],[.16,'#ad945e'],[.24,'#52644f'],[.39,'#142f35'],[1,'#0a1c25']]));
 for(let x=c+15;x<w-17;x+=21)line(g,[{x,y:f+8},{x:x+6,y:f+8}],'#061923',2.2);
 g.restore();
}
function symbol(g,type,r,color,light){g.save();g.scale(r/14,r/14);g.lineWidth=1.8;g.lineCap='round';g.lineJoin='round';g.strokeStyle=color;g.fillStyle=color;g.beginPath();
 if(type==='sword'){g.moveTo(-5,5);g.lineTo(4,-8);g.lineTo(8,-9);g.lineTo(8,-5);g.lineTo(-2,7);g.closePath();g.fill();line(g,[{x:-7,y:2},{x:1,y:8}],color,2);line(g,[{x:-4,y:6},{x:-7,y:10}],color,2.8);line(g,[{x:0,y:0},{x:6,y:-7}],light,.8)}
 else if(type==='shield'){g.moveTo(0,-9);g.lineTo(7,-5);g.lineTo(6,3);g.quadraticCurveTo(4,7,0,9);g.quadraticCurveTo(-4,7,-6,3);g.lineTo(-7,-5);g.closePath();g.fill();line(g,[{x:0,y:-5},{x:0,y:5}],light,1.2)}
 else if(type==='heart'){g.moveTo(0,8);g.bezierCurveTo(-16,-3,-5,-13,0,-5);g.bezierCurveTo(5,-13,16,-3,0,8);g.fill();line(g,[{x:-6,y:-4},{x:-4,y:-6}],light,1)}
 else if(type==='spark'){g.moveTo(2,-10);g.lineTo(-7,2);g.lineTo(-1,2);g.lineTo(-3,10);g.lineTo(8,-3);g.lineTo(2,-3);g.closePath();g.fill()}
 else if(type==='coin'){g.arc(0,0,7,0,TAU);g.stroke();g.font='900 11px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText('C',0,.5)}
 else{round(g,-6,-6,12,12,3,color);round(g,-2.5,-2.5,5,5,1,light);for(let i=-1;i<=1;i+=2){line(g,[{x:i*8,y:-3},{x:i*8,y:3}],color,1.7)}}g.restore()}
function ball(g,b,p){g.save();g.translate(b.x,b.y);const r=b.r;ellipse(g,1,2,r+.4,r+.3,'#00000060');
 let q=g.createRadialGradient(-r*.36,-r*.45,0,r*.1,r*.2,r*1.3);q.addColorStop(0,p.rim);q.addColorStop(.28,p.color);q.addColorStop(.77,p.color);q.addColorStop(1,p.dark);ellipse(g,0,0,r,r,q);
 g.strokeStyle=p.rim;g.lineWidth=.7;g.beginPath();g.arc(0,0,r-.8,0,TAU);g.stroke();g.rotate(b.angle||0);ellipse(g,0,0,r*.65,r*.65,p.dark+'22');symbol(g,b.type,r*.88,p.dark,p.rim);g.rotate(-(b.angle||0));
 g.strokeStyle='#ffffff66';g.lineWidth=1.25;g.beginPath();g.arc(-.4,-.3,r*.77,Math.PI*1.05,Math.PI*1.5);g.stroke();ellipse(g,-r*.35,-r*.46,r*.2,r*.095,'#ffffff9a');g.restore()}
function claw(g,o){g.save();const {x,y,jaws}=o;const powered=o.phase==='close'||o.phase==='down',delivering=o.phase==='release',carrying=(o.load||0)>0;const lamp=powered?'#ffd687':delivering?'#bdff9b':carrying?'#8dfff0':'#9ee8c2';
 line(g,[{x,y:26},{x,y}],'#020e15',6);line(g,[{x:x-1,y:26},{x:x-1,y}],'#9aaead',2.4);line(g,[{x:x+1.3,y:26},{x:x+1.3,y}],'#435f64',1);
 round(g,x-24,10,48,22,5,gradient(g,0,10,0,32,[[0,'#fff4d6'],[.32,'#e6d6af'],[.72,'#c3ae7c'],[1,'#7e7151']]),'#f2dca3');round(g,x-13,14,26,9,3,'#193139','#eddaaa55');for(let a=-1;a<=1;a++)round(g,x+a*7-2,17,4,3,1,'#a2e3c1');bolt(g,x-18,26);bolt(g,x+18,26);
 for(const jaw of jaws){line(g,jaw,'#020e15',10);line(g,jaw,'#a28b54',7);line(g,jaw.map(p=>({x:p.x-1,y:p.y-1})),'#f4e5bd',3.4);for(let i=1;i<jaw.length-1;i++)bolt(g,jaw[i].x,jaw[i].y,3);const p=jaw[jaw.length-1],q=jaw[jaw.length-2];line(g,[{x:p.x+(q.x-p.x)*.24,y:p.y+(q.y-p.y)*.24},p],'#274c4d',5);line(g,[{x:p.x-1,y:p.y-1},{x:p.x+(q.x-p.x)*.18-1,y:p.y+(q.y-p.y)*.18-1}],'#77a798',1)}
 round(g,x-18,y-11,36,24,7,gradient(g,0,y-11,0,y+13,[[0,'#fff5d5'],[.34,'#e8d8b1'],[.68,'#c3b38c'],[1,'#81785b']]),'#ffe4ad');round(g,x-10,y-6,20,13,4,'#172f35','#756e50');glow(g,x,y,powered||carrying?12:8,lamp+'32');ellipse(g,x,y,3.5,3.5,lamp);ellipse(g,x-1,y-1,1.2,1.2,'#f3ffe9');bolt(g,x-14,y+1,1.5);bolt(g,x+14,y+1,1.5);g.restore()}
function battle(g,floor=1,time=0){g.save();const icy=floor>6;g.fillStyle=gradient(g,0,0,0,180,[[0,icy?'#17243e':'#102e35'],[.6,icy?'#243444':'#234443'],[1,'#12252b']]);g.fillRect(0,0,420,180);
 // Layered vaulted architecture stays dark behind the health labels.
 glow(g,214,70,150,icy?'#7469bf22':'#70ba9230');for(let i=0;i<5;i++){const x=i*100-40;round(g,x,0,18,143,0,'#071c2580');g.strokeStyle='#79a29a15';g.lineWidth=7;g.beginPath();g.moveTo(x+13,146);g.lineTo(x+13,74);g.bezierCurveTo(x+13,28,x+88,28,x+88,74);g.lineTo(x+88,146);g.stroke();round(g,x-4,132,27,11,2,'#314c49');}
 g.fillStyle='#11282bd0';g.beginPath();g.moveTo(0,144);g.lineTo(420,144);g.lineTo(420,180);g.lineTo(0,180);g.fill();g.strokeStyle='#72978c20';g.lineWidth=1;for(let y=149;y<180;y+=11){g.beginPath();g.moveTo(0,y);g.lineTo(420,y);g.stroke()}for(let x=0;x<420;x+=44){line(g,[{x:x+13,y:145},{x,y:180}],'#6f92891b',1)}
 ellipse(g,104,157,54,9,'#020f1955');ellipse(g,317,157,57,9,'#020f1955');
 for(const x of [36,384]){round(g,x-3,66,6,22,2,'#83694b');glow(g,x,65,34,'#ffc16a28');ellipse(g,x,63,3,7+Math.sin(time*6+x),'#eeb66b');ellipse(g,x,64,1.5,4,'#fff0b5')}
 for(let i=0;i<15;i++){const x=(i*79+time*(i%2?1:-1))%420,y=55+(i*31)%91+Math.sin(time*.6+i)*4;ellipse(g,x,y,i%3?.6:1,.8,'#c3e8b445')}
 // Small foreground fern silhouettes frame the fighters.
 for(const x of [0,408]){for(let i=0;i<5;i++)line(g,[{x:x+5,y:176},{x:x-13+i*9,y:151+(i%2)*8}],'#071c22',3)}g.restore()}
function hero(g,x,y,s,t){g.save();g.translate(x,y+Math.sin(t*2.7)*1.5);g.scale(s,s);ellipse(g,0,40,29,5,'#020f1955');
 // Leather gaiters, articulated brass limbs, enamel torso.
 for(const d of [-1,1]){line(g,[{x:d*12,y:19},{x:d*16,y:32}],'#253d41',11);bolt(g,d*12,23,4);round(g,d<0?-28:7,31,22,10,4,'#8c7954','#c6ad76');round(g,d<0?-27:8,37,20,4,2,'#233c3b')}
 line(g,[{x:-20,y:-1},{x:-29,y:13},{x:-29,y:21}],'#263b3c',12);line(g,[{x:20,y:-1},{x:30,y:9},{x:32,y:19}],'#263b3c',12);for(const p of [[-28,10],[29,7]])bolt(g,p[0],p[1],5);round(g,-36,16,15,13,5,'#c3a66f','#f0d494');round(g,24,14,15,13,5,'#c3a66f','#f0d494');
 round(g,-22,-9,44,39,9,gradient(g,-22,0,22,0,[[0,'#53695b'],[.35,'#93a681'],[1,'#536e63']]),'#c7cb9d');round(g,-15,-1,30,25,6,'#314c46','#afac7955');ellipse(g,0,10,10,10,'#b99b61');ellipse(g,0,10,7.5,7.5,'#133a40');glow(g,0,10,10,'#b8ffe333');ellipse(g,0,10,4,4,'#acf1d1');ellipse(g,-1,8.5,1.5,1.5,'#efffe3');for(const xx of [-17,17])bolt(g,xx,-3,1.5);
 // Asymmetric scarf gives the silhouette a memorable direction.
 g.fillStyle='#be7257';g.beginPath();g.moveTo(-18,-10);g.lineTo(-36,-3);g.lineTo(-47,12);g.lineTo(-35,9);g.lineTo(-26,15);g.lineTo(-22,-4);g.fill();round(g,-21,-11,44,7,3,'#db9369');
 line(g,[{x:3,y:-34},{x:8,y:-48}],'#b69c70',2.5);ellipse(g,8,-49,3.6,3.6,'#bce6b1');
 round(g,-29,-38,58,33,10,gradient(g,0,-38,0,-5,[[0,'#eee0ad'],[.35,'#bea573'],[1,'#8c7955']]),'#f4e3b7');round(g,-24,-31,48,20,7,'#14343a','#756c4b');round(g,-17,-25,11,7,3,'#b4f3d0');round(g,7,-25,11,7,3,'#b4f3d0');line(g,[{x:-3,y:-15},{x:4,y:-15}],'#609c91',1);round(g,-35,-29,7,18,3,'#7f7959','#c3b787');round(g,29,-29,7,18,3,'#7f7959','#c3b787');bolt(g,-22,-35,1);bolt(g,22,-35,1);g.restore()}
function eyes(g,y=-8,color='#e9cc7d'){for(const d of [-1,1]){ellipse(g,d*12,y,7,8,'#11212d');ellipse(g,d*12+1,y,2.7,4,color);ellipse(g,d*12+1.5,y-1.5,1,1,'#fff9df')}}
function enemy(g,x,y,s,t,kind=0,act=1){g.save();g.translate(x,y+Math.sin(t*2.5+kind)*1.5);g.scale(s,s);ellipse(g,0,40,32,6,'#020f1955');
 if(kind===4){
  const palettes=[null,{dark:'#3d655c',mid:'#739379',light:'#b7c998',edge:'#cad7a2',gem:'#b8ecc1'},{dark:'#484564',mid:'#8179a2',light:'#bba7cc',edge:'#d7c1ec',gem:'#e1bdff'},{dark:'#5b594f',mid:'#a7976d',light:'#dccb95',edge:'#ffebb5',gem:'#fff1b9'}];
  const p=palettes[Math.max(1,Math.min(3,act))];
  if(act===3){glow(g,0,-24,63,'#eaca6020');g.strokeStyle='#e5c97d';g.lineWidth=1.4;g.beginPath();g.arc(0,-20,48,0,TAU);g.stroke();g.strokeStyle='#dac17655';g.beginPath();g.arc(0,-20,52,0,TAU);g.stroke();for(let i=0;i<7;i++){const q=i*TAU/7+t*.12,xx=Math.sin(q)*50,yy=-20+Math.cos(q)*50;line(g,[{x:xx-3,y:yy},{x:xx+3,y:yy}],'#fff1bd',1.3);line(g,[{x:xx,y:yy-3},{x:xx,y:yy+3}],'#fff1bd',1.3)}}
  for(const d of [-1,1]){round(g,d<0?-29:10,24,20,17,4,p.mid,p.edge);line(g,[{x:d*27,y:-24},{x:d*39,y:-3},{x:d*36,y:25}],p.dark,16);round(g,d<0?-45:28,14,17,16,4,p.light,p.edge);ellipse(g,d*27,-22,13,12,p.mid);bolt(g,d*28,-25,3)}
  round(g,-29,-29,58,59,8,gradient(g,-29,0,29,0,[[0,p.dark],[.45,p.light],[1,p.dark]]),p.edge);g.fillStyle=act===1?'#a1b37c':act===2?'#a293c7':'#d9b86e';g.beginPath();g.moveTo(0,-22);g.lineTo(20,-9);g.lineTo(13,13);g.lineTo(0,24);g.lineTo(-13,13);g.lineTo(-20,-9);g.closePath();g.fill();round(g,-16,-17,32,28,6,p.dark);ellipse(g,0,-3,6,8,p.gem);
  round(g,-24,-44,48,33,7,p.mid,p.edge);round(g,-19,-34,38,14,4,'#182938');line(g,[{x:-13,y:-28},{x:-5,y:-26}],p.gem,3);line(g,[{x:5,y:-26},{x:13,y:-28}],p.gem,3);
  if(act===1){
   // Living root antlers and curling vines distinguish the first guardian.
   for(const d of [-1,1]){line(g,[{x:d*15,y:-42},{x:d*21,y:-51},{x:d*20,y:-61}],'#839b64',4);line(g,[{x:d*21,y:-51},{x:d*33,y:-55},{x:d*36,y:-62}],'#839b64',2.5);g.fillStyle='#b0c584';g.beginPath();g.moveTo(d*20,-54);g.quadraticCurveTo(d*37,-69,d*35,-51);g.quadraticCurveTo(d*26,-47,d*20,-54);g.fill();g.strokeStyle='#b9ce8b';g.lineWidth=2.4;g.beginPath();g.moveTo(d*22,-18);g.bezierCurveTo(d*44,-12,d*9,8,d*27,24);g.stroke();for(let i=0;i<3;i++){const xx=d*(24+(i%2)*8),yy=-8+i*13;ellipse(g,xx,yy,5,2.5,'#96b67d')}}
   line(g,[{x:-21,y:-44},{x:0,y:-48},{x:21,y:-44}],'#b1c388',3)
  }else if(act===2){
   // Faceted shoulder fans and crown catch a cool violet rim light.
   for(const d of [-1,1])for(let i=0;i<3;i++){const xx=d*(25+i*6),yy=-24+i*6;g.fillStyle=i%2?'#b6a1d9':'#8e83bd';g.beginPath();g.moveTo(xx-d*7,yy+8);g.lineTo(xx+d*(6+i*2),yy-23+i*3);g.lineTo(xx+d*9,yy+9);g.closePath();g.fill();line(g,[{x:xx+d*(6+i*2),y:yy-23+i*3},{x:xx+d*2,y:yy+6}],'#e3d0fa',1)}
   for(let i=-1;i<=1;i++){g.fillStyle=i?'#ae9bd5':'#d1b6ef';g.beginPath();g.moveTo(i*14-6,-43);g.lineTo(i*14,-66+(i?9:0));g.lineTo(i*14+6,-43);g.closePath();g.fill();line(g,[{x:i*14,y:-63+(i?8:0)},{x:i*14,y:-45}],'#eddbff',1)}
  }else{
   for(let i=-1;i<=1;i++){g.fillStyle='#ead292';g.beginPath();g.moveTo(i*16-7,-44);g.lineTo(i*16,-61+(i?6:0));g.lineTo(i*16+7,-44);g.fill()}line(g,[{x:-21,y:-44},{x:21,y:-44}],'#f4dfaa',3);g.fillStyle='#fff2bb';g.beginPath();g.moveTo(0,-15);g.lineTo(3,-5);g.lineTo(10,-3);g.lineTo(3,0);g.lineTo(0,10);g.lineTo(-3,0);g.lineTo(-10,-3);g.lineTo(-3,-5);g.closePath();g.fill()
  }
 }else if(kind===2){
  g.fillStyle=gradient(g,0,-42,0,39,[[0,'#8578b3'],[1,'#3e476b']]);g.beginPath();g.moveTo(0,-43);g.quadraticCurveTo(-31,-30,-30,5);g.lineTo(-39,38);g.lineTo(-17,32);g.lineTo(0,40);g.lineTo(15,33);g.lineTo(36,39);g.quadraticCurveTo(26,2,25,-17);g.closePath();g.fill();g.strokeStyle='#b8a6da';g.lineWidth=1;g.stroke();ellipse(g,0,-8,19,24,'#172737');eyes(g,-9,'#c4b7ff');line(g,[{x:-2,y:15},{x:3,y:15}],'#b799da',3);for(const d of [-1,1]){ellipse(g,d*27,17+Math.sin(t*3)*3,8,7,'#7c73a4');glow(g,d*29,12,16,'#b1a0ff30');ellipse(g,d*29,12,3,3,'#dfd4ff')}
 }else if(kind===1){
  for(const d of [-1,1])for(let i=0;i<3;i++)line(g,[{x:d*22,y:-7+i*13},{x:d*(38-i*2),y:i*10},{x:d*36,y:8+i*11}],'#806344',5);
  ellipse(g,0,5,29,34,gradient(g,-28,0,28,0,[[0,'#9a654f'],[.35,'#d2a671'],[1,'#916048']]));line(g,[{x:0,y:-24},{x:0,y:36}],'#705046',2);for(const d of [-1,1]){ellipse(g,d*13,12,7,10,'#ad7454');line(g,[{x:d*12,y:-25},{x:d*21,y:-41},{x:d*29,y:-38}],'#b59b72',3)}ellipse(g,0,-17,23,19,'#aa9368');eyes(g,-19);line(g,[{x:-8,y:-3},{x:0,y:1},{x:8,y:-3}],'#534338',2)
 }else if(kind===3){
  const pts=[{x:-26,y:32},{x:-33,y:9},{x:-22,y:-15},{x:0,y:-34},{x:25,y:-20},{x:34,y:8},{x:25,y:34}];g.fillStyle='#638f89';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill();g.strokeStyle='#abd0b3';g.lineWidth=1.4;g.stroke();g.fillStyle='#92b6a2';g.beginPath();g.moveTo(0,-33);g.lineTo(19,-11);g.lineTo(8,10);g.lineTo(-18,-5);g.closePath();g.fill();line(g,[{x:8,y:10},{x:-1,y:21},{x:6,y:35}],'#3d6969',2);eyes(g,-6,'#acf4d5');for(const d of [-1,1]){g.fillStyle='#92d8bc';g.beginPath();g.moveTo(d*18,-24);g.lineTo(d*27,-45);g.lineTo(d*33,-17);g.closePath();g.fill();ellipse(g,d*23,33,13,7,'#497a76')}
 }else{
  g.fillStyle=gradient(g,0,-30,0,39,[[0,'#aec58c'],[.55,'#739e70'],[1,'#386861']]);g.beginPath();g.moveTo(-34,30);g.bezierCurveTo(-36,9,-25,-29,0,-31);g.bezierCurveTo(23,-32,31,1,35,29);g.quadraticCurveTo(27,42,15,36);g.quadraticCurveTo(0,43,-13,36);g.quadraticCurveTo(-27,42,-34,30);g.fill();g.strokeStyle='#bfcc9855';g.lineWidth=1;g.stroke();ellipse(g,-13,-11,10,6,'#cadca44d');for(const d of [-1,1]){g.fillStyle=d<0?'#a8bc76':'#78a372';g.beginPath();g.moveTo(0,-28);g.quadraticCurveTo(d*8,-55,d*29,-42);g.quadraticCurveTo(d*31,-27,0,-28);g.fill();line(g,[{x:0,y:-29},{x:d*21,y:-38}],'#4e7960',1)}eyes(g,-5);line(g,[{x:-8,y:13},{x:0,y:17},{x:9,y:12}],'#365b52',2);g.fillStyle='#e4dfb8';g.beginPath();g.moveTo(-6,14);g.lineTo(-2,20);g.lineTo(0,16);g.fill();for(let i=0;i<5;i++)ellipse(g,-20+i*9,25+(i%2)*5,2,2,'#c1d19a40')
 }
 g.restore()}
function paintedBattle(g,floor=1,time=0){
 if(!isReady(paintedVault)){battle(g,floor,time);return}
 const act=floor>8?3:floor>4?2:1;
 const light=act===1?'#9bf1c7':act===2?'#bba7ff':'#ffd894';
 g.save();const backdrop=paintedVault.image;const sourceWidth=Math.min(backdrop.naturalWidth,backdrop.naturalHeight*420/180);g.drawImage(backdrop,(backdrop.naturalWidth-sourceWidth)/2,0,sourceWidth,backdrop.naturalHeight,0,0,420,180);
 // Three quiet planes: distant painted vault, lit combat floor, dark foreground.
 g.fillStyle=gradient(g,0,0,0,180,[[0,'#050d23a8'],[.29,'#0b153522'],[.69,'#06122910'],[1,'#04102268']]);g.fillRect(0,0,420,180);
 if(act>1){g.fillStyle=act===3?'#d89b2515':'#796ae72c';g.fillRect(0,0,420,180)}
 // Long, soft diagonal shafts frame the fighters without flickering on them.
 for(let i=0;i<3;i++){g.fillStyle=gradient(g,110+i*120,15,30+i*120,161,[[0,light+'0c'],[1,light+'00']]);g.beginPath();g.moveTo(90+i*132,0);g.lineTo(121+i*132,0);g.lineTo(70+i*112,169);g.lineTo(11+i*112,169);g.closePath();g.fill()}
 ellipse(g,103,156,63,10,'#c3dcbd08');ellipse(g,316,156,68,10,'#c3dcbd08');
 line(g,[{x:39,y:163},{x:166,y:163}],'#bacba214',.6);line(g,[{x:252,y:163},{x:382,y:163}],'#bacba214',.6);
 // Slow motes stay in the empty center and upper vault, never obscure the HUD.
 for(let i=0;i<10;i++){const xx=((i*79+time*(i%2?2:-2))%420+420)%420,yy=44+(i*31)%92+Math.sin(time*.6+i)*4;
  const alpha=.18+Math.sin(time*.8+i)*.09;g.globalAlpha=alpha;ellipse(g,xx,yy,i%3?.65:1,.7,light)}
 g.globalAlpha=1;
 // Foreground corner silhouettes establish depth. Keep the floor unobstructed.
 g.fillStyle=gradient(g,0,158,0,180,[[0,'#05121b00'],[1,'#04121ba8']]);g.fillRect(0,158,420,22);
 g.restore();
}
function paintedHero(g,x,y,s,t,state={}){if(!paintedActor(g,0,x,y,s,t,state))hero(g,x,y,s,t)}
function paintedEnemy(g,x,y,s,t,kind=0,act=1,state={}){const index=kind===4?4+Math.max(1,Math.min(3,act)):Math.max(0,Math.min(3,kind))+1;if(!paintedActor(g,index,x,y,s,t,state))enemy(g,x,y,s,t,kind,act)}
root.ClawArt={machine,ball,claw,battle:paintedBattle,hero:paintedHero,enemy:paintedEnemy,symbol,
 ready:Promise.all([paintedCharacters.ready,paintedVault.ready,...sculptedActors.map(asset=>asset.ready)])};
})(typeof window!=='undefined'?window:globalThis);
