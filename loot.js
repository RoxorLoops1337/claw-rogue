/* Physical loot silhouettes. These share the compound bodies used by the solver. */
(function(root){'use strict';
const TAU=Math.PI*2;
function compound(g,parts){g.beginPath();for(const p of parts){g.moveTo(p.x+p.r,p.y);g.arc(p.x,p.y,p.r,0,TAU)}}
function stroke(g,points,color,width){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke()}
function draw(g,b,t){
 g.save();g.translate(b.x,b.y);g.rotate(b.angle||0);
 const parts=b.parts||[{x:0,y:0,r:b.r}],r=b.r;
 g.save();g.translate(1,2);compound(g,parts);g.fillStyle='#020a12aa';g.fill();g.restore();
 const palette={sword:['#f8f4d7','#94afbb','#334c5b'],shield:['#c6fff3','#4d9daa','#224856'],heart:['#ffdadd','#d96781','#683148'],spark:['#e9d8ff','#9872ca','#443767'],coin:['#fff0a8','#dba646','#7a512a'],stone:['#cad8d0','#82918d','#38484c']}[b.type];
 const grad=g.createLinearGradient(0,-r*.7,0,r*.7);grad.addColorStop(0,palette[0]);grad.addColorStop(.38,palette[1]);grad.addColorStop(1,palette[2]);
 compound(g,parts);g.lineWidth=2.3;g.strokeStyle='#06131f';g.stroke();g.fillStyle=grad;g.fill();
 g.lineCap='round';g.lineJoin='round';
 if(b.type==='sword'){
  g.beginPath();g.moveTo(18,0);g.lineTo(10,-4.5);g.lineTo(-9,-4.5);g.lineTo(-9,4.5);g.lineTo(10,4.5);g.closePath();g.fillStyle='#d8e3de';g.fill();
  stroke(g,[[-8,0],[15,0]],'#ffffe9',1.2);stroke(g,[[-11,-5],[-11,5]],'#d7a75d',3.5);stroke(g,[[-17,0],[-13,0]],'#6a423b',4);
 }else if(b.type==='shield'){
  g.beginPath();g.moveTo(0,-8);g.lineTo(7,-4);g.lineTo(5,4);g.lineTo(0,9);g.lineTo(-5,4);g.lineTo(-7,-4);g.closePath();g.fillStyle='#133c54';g.fill();g.strokeStyle='#dcf4c4';g.lineWidth=1.2;g.stroke();stroke(g,[[0,-5],[0,5]],'#9af0e4',1.7);
 }else if(b.type==='heart'){
  g.beginPath();g.moveTo(0,6);g.bezierCurveTo(-12,-2,-5,-10,0,-4);g.bezierCurveTo(5,-10,12,-2,0,6);g.fillStyle='#7c244e';g.fill();stroke(g,[[-4,-3],[-2,-4]],'#fff3df',1.5);
 }else if(b.type==='spark'){
  stroke(g,[[-8,-6],[-8,6]],'#ccb889',2.5);stroke(g,[[8,-6],[8,6]],'#ccb889',2.5);
  g.beginPath();g.moveTo(2,-6);g.lineTo(-5,1);g.lineTo(0,1);g.lineTo(-2,7);g.lineTo(6,-1);g.lineTo(1,-1);g.closePath();g.fillStyle='#fff3a1';g.fill();
 }else if(b.type==='coin'){
  g.beginPath();g.arc(0,0,6.8,0,TAU);g.strokeStyle='#8e6229';g.lineWidth=1.3;g.stroke();stroke(g,[[1,-4],[-2,-4],[-3,-1],[2,1],[2,4],[-2,4]],'#754a24',1.5);
 }else{
  g.beginPath();g.arc(0,0,5.5,0,TAU);g.fillStyle='#263e47';g.fill();g.strokeStyle='#d7dcc6';g.lineWidth=1.5;g.stroke();g.beginPath();g.arc(0,0,2.4,0,TAU);g.fillStyle='#849994';g.fill();
 }
 g.restore();
}
root.ClawLoot={draw};
})(typeof window!=='undefined'?window:globalThis);
