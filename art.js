/* Clawbound's resolution-independent art. All visible claw geometry follows the solver. */
(function(root){
'use strict';
const TAU=Math.PI*2;
function ellipse(g,x,y,rx,ry,fill){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=fill;g.fill()}
function round(g,x,y,w,h,r,fill,stroke){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke()}}
function line(g,pts,c,w){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke()}
function gradient(g,x,y,x2,y2,stops){const q=g.createLinearGradient(x,y,x2,y2);stops.forEach(s=>q.addColorStop(s[0],s[1]));return q}
function glow(g,x,y,r,c){const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,c);q.addColorStop(1,'#00000000');ellipse(g,x,y,r,r,q)}
function bolt(g,x,y,r=2){ellipse(g,x,y,r+1,r+1,'#07191c');ellipse(g,x-.2,y-.3,r,r,'#a48b62');line(g,[{x:x-r*.45,y:y+.4},{x:x+r*.45,y:y-.4}],'#3e4037',.8)}
function gear(g,x,y,r,t){g.save();g.translate(x,y);g.rotate(t);g.strokeStyle='#9da99813';g.lineWidth=r*.25;g.beginPath();g.arc(0,0,r*.68,0,TAU);g.stroke();for(let i=0;i<12;i++){g.rotate(TAU/12);g.fillStyle='#9da99813';g.fillRect(-r*.11,-r,r*.22,r*.28)}g.restore()}
function machine(g,o={}){
 const w=o.width||420,h=o.height||340,f=o.floor||326,c=o.chute||84,t=o.time||0;
 g.save();g.clearRect(0,0,w,h);g.fillStyle=gradient(g,0,0,0,h,[[0,'#12343c'],[.55,'#102b32'],[1,'#081a24']]);g.fillRect(0,0,w,h);
 glow(g,w*.65,110,190,'#3c7c6527');gear(g,329,111,85,t*.02);gear(g,185,97,51,-t*.035);
 // Riveted recessed back panels.
 for(let x=112;x<w;x+=91){round(g,x,42,78,h-71,9,'#0b202923','#5d8a8420');line(g,[{x:x+5,y:49},{x:x+71,y:49}],'#9dc0a412',1);bolt(g,x+7,49,1);bolt(g,x+71,49,1)}
 g.strokeStyle='#81bfa50a';g.lineWidth=1;for(let y=64;y<h;y+=18){g.beginPath();g.moveTo(103,y);g.lineTo(w-12,y);g.stroke()}
 // The left lane is genuinely open at its bottom, exactly matching the physics.
 round(g,12,145,c-12,h-145,0,'#040e17');g.fillStyle=gradient(g,12,0,c,0,[[0,'#0d2630'],[.5,'#163e3d'],[1,'#081d27']]);g.fillRect(15,145,c-17,h-145);
 glow(g,47,h,82,'#8de3a139');g.fillStyle='#08191ddd';g.fillRect(20,154,55,26);g.font='700 9px system-ui';g.textAlign='center';g.fillStyle='#b7d6b0';g.fillText('DELIVERY',48,169);
 for(let i=0;i<4;i++){const yy=190+i*35+(t*16)%35;line(g,[{x:40,y:yy},{x:48,y:yy+5},{x:56,y:yy}],'#9cd4a33a',2)}
 line(g,[{x:c,y:147},{x:c,y:h+8}],'#061317',9);line(g,[{x:c,y:147},{x:c,y:h+8}],'#a68b58',5);line(g,[{x:c-1.3,y:148},{x:c-1.3,y:h+8}],'#ead5a1',1.2);bolt(g,c,148,3);
 round(g,8,15,w-16,15,4,'#06161b','#587570');round(g,13,18,w-26,4,2,gradient(g,0,18,0,22,[[0,'#e0c78f'],[.5,'#9a834f'],[1,'#443e2c']]));
 for(let x=20;x<w-15;x+=15){g.fillStyle='#06171d';g.fillRect(x,25,7,3)}
 round(g,c,f,w-c-8,h-f,2,gradient(g,0,f,0,h,[[0,'#c1a46f'],[.2,'#6f6a4d'],[.3,'#38433e'],[1,'#1b2e30']]));
 for(let x=c+12;x<w-10;x+=17){line(g,[{x,y:f+7},{x:x+5,y:f+7}],'#0b2024',3)}
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
function claw(g,o){g.save();const {x,y,jaws}=o;
 line(g,[{x,y:26},{x,y}],'#020e15',6);line(g,[{x:x-1,y:26},{x:x-1,y}],'#9aaead',2.4);line(g,[{x:x+1.3,y:26},{x:x+1.3,y}],'#435f64',1);
 round(g,x-24,10,48,22,5,gradient(g,0,10,0,32,[[0,'#e4c587'],[.5,'#a98b51'],[1,'#756540']]),'#f2dca3');round(g,x-13,14,26,9,3,'#193139','#eddaaa55');for(let a=-1;a<=1;a++)round(g,x+a*7-2,17,4,3,1,'#a2e3c1');bolt(g,x-18,26);bolt(g,x+18,26);
 for(const jaw of jaws){line(g,jaw,'#020e15',10);line(g,jaw,'#9a7c49',7);line(g,jaw.map(p=>({x:p.x-1,y:p.y-1})),'#e5d1a0',3);for(let i=1;i<jaw.length-1;i++)bolt(g,jaw[i].x,jaw[i].y,3);const p=jaw[jaw.length-1],q=jaw[jaw.length-2];line(g,[{x:p.x+(q.x-p.x)*.24,y:p.y+(q.y-p.y)*.24},p],'#274c4d',5);line(g,[{x:p.x-1,y:p.y-1},{x:p.x+(q.x-p.x)*.18-1,y:p.y+(q.y-p.y)*.18-1}],'#77a798',1)}
 round(g,x-18,y-11,36,24,7,gradient(g,0,y-11,0,y+13,[[0,'#f0d399'],[.5,'#b29a63'],[1,'#736442']]),'#ffe4ad');round(g,x-10,y-6,20,13,4,'#172f35','#756e50');ellipse(g,x,y,3.5,3.5,'#9ee8c2');ellipse(g,x-1,y-1,1.2,1.2,'#e1ffee');bolt(g,x-14,y+1,1.5);bolt(g,x+14,y+1,1.5);g.restore()}
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
root.ClawArt={machine,ball,claw,battle,hero,enemy,symbol};
})(typeof window!=='undefined'?window:globalThis);
