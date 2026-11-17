export const scenes = [
  {name:'Koi no oto',subtitle:'The sound of water',headline:['Beneath','the surface.'],jp:'水音',label:'Pearl and apricot koi swimming in an indigo pond, with delicate gold ripples'},
  {name:'Fuji no hibiki',subtitle:'Echoes of the mountain',headline:['Where the','mountain sings.'],jp:'山響',label:'Layered indigo Mount Fuji beneath a pearl sun on an apricot print'},
  {name:'Torii no yume',subtitle:'A gateway to dreaming',headline:['A moment','between worlds.'],jp:'鳥居',label:'An apricot torii gate and its flowing reflection beneath an indigo moon'}
];
const palettes=[
  {bg:'#18223e',ink:'#f0e9d9',muted:'#aeb7c9',line:'#b7a38a',water:'#27365b',deep:'#1c2948',coral:'#e7a18b',sun:'#dfad82',pearl:'#f2e8d4'},
  {bg:'#e8ad97',ink:'#2b2f4e',muted:'#53445d',line:'#766582',water:'#34405f',deep:'#29314f',coral:'#c37466',sun:'#f2e6cc',pearl:'#f4e9d2'},
  {bg:'#e8e6df',ink:'#283451',muted:'#5d6576',line:'#8f9aab',water:'#344866',deep:'#263650',coral:'#dc9d85',sun:'#aebbd0',pearl:'#e8e6df'}
];
const TAU=Math.PI*2;
export function artworkBackground(scene){return palettes[scene].bg;}
export function createMotion(){return {swimTime:0,moonPhase:0,moonEnergy:0,moonAngle:0,moonX:0,moonY:0,pulse:0,beats:[]};}
export function advanceMotion(motion,dt,bass,mid,playing){
 // Swimming follows elapsed time; the separate moon response eases over several beats.
 motion.swimTime+=dt*.75;
 const target=playing?Math.tanh(Math.max(0,bass)*.8+Math.max(0,mid)*.25):0;
 motion.moonEnergy+=(target-motion.moonEnergy)*(1-Math.exp(-dt*1.25));
 motion.moonPhase+=dt*(.32+motion.moonEnergy*.1);
 const angle=Math.sin(motion.moonPhase)*motion.moonEnergy*Math.PI/45;
 motion.moonAngle+=(angle-motion.moonAngle)*(1-Math.exp(-dt*2));
 motion.moonX=Math.sin(motion.moonPhase*.72)*motion.moonEnergy*6;
 motion.moonY=Math.sin(motion.moonPhase*.58)*motion.moonEnergy*4;
}
const makeCanvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
let seed=414;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
const grain=makeCanvas(540,960),gx=grain.getContext('2d'),gi=gx.createImageData(540,960);
for(let i=0;i<gi.data.length;i+=4){const light=random()>.5;gi.data[i]=light?246:22;gi.data[i+1]=light?237:28;gi.data[i+2]=light?219:46;gi.data[i+3]=random()*15;}
gx.putImageData(gi,0,0);
const lakeTextures=palettes.map(p=>{
 const c=makeCanvas(900,900),x=c.getContext('2d');x.fillStyle=p.water;x.fillRect(0,0,900,900);
 for(let i=0;i<12000;i++){x.fillStyle=i%2?p.deep:p.line;x.globalAlpha=random()*.035;x.beginPath();x.ellipse(random()*900,random()*900,random()*38+1,random()*12+1,random()*TAU,0,TAU);x.fill();}
 x.globalAlpha=.18;x.drawImage(grain,0,0,900,900);return c;
});
function line(x,pts,color,width=1){x.beginPath();pts.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.strokeStyle=color;x.lineWidth=width;x.stroke();}
function shape(x,pts,color){x.beginPath();pts.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.closePath();x.fillStyle=color;x.fill();}
function circle(x,cx,cy,r,color){x.beginPath();x.arc(cx,cy,r,0,TAU);x.fillStyle=color;x.fill();}
const fujiMoon=makeCanvas(350,350);
circle(fujiMoon.getContext('2d'),175,175,173,palettes[1].sun);
function ring(x,cx,cy,r,color,width=1){x.beginPath();x.arc(cx,cy,r,0,TAU);x.strokeStyle=color;x.lineWidth=width;x.stroke();}
function wakeFade(beat,duration){const phase=Math.min(1,beat.age/duration);return Math.sin(Math.min(1,beat.age/.12)*Math.PI/2)*(1-phase)**1.4;}
function disk(x,cx,cy,r,index){x.save();x.beginPath();x.arc(cx,cy,r,0,TAU);x.clip();x.drawImage(lakeTextures[index],cx-r,cy-r,r*2,r*2);x.restore();}
function wave(x,y,t,amplitude,p,phase=0,left=40,right=1040){x.beginPath();for(let j=0;j<=150;j++){const px=left+(right-left)*j/150,py=y+Math.sin(px*.008+t*.3+phase)*amplitude+Math.sin(px*.021-t*.12+phase)*amplitude*.25;j?x.lineTo(px,py):x.moveTo(px,py);}x.strokeStyle=p;x.stroke();}
function koiFish(x,px,py,a,size,t,p,red=false){
 x.save();x.translate(px,py);x.rotate(a);x.scale(size,size);
 const bend=Math.sin(t*1.7)*12;
 const body=new Path2D();body.moveTo(0,-101);body.bezierCurveTo(21,-101,34,-70,30,-34);body.bezierCurveTo(28,11,11,54,bend,94);body.bezierCurveTo(bend-5,115,bend-12,128,bend-16,137);body.bezierCurveTo(bend-14,96,-12,65,-24,24);body.bezierCurveTo(-38,-20,-35,-63,-23,-85);body.bezierCurveTo(-16,-97,-8,-103,0,-101);body.closePath();
 // Translucent flowing fins have curved edges and fine engraved rays.
 x.fillStyle=p.pearl;x.globalAlpha=.8;
 x.beginPath();x.moveTo(-27,-45);x.bezierCurveTo(-49,-36,-65,-7,-67,15);x.bezierCurveTo(-50,7,-36,-1,-23,-10);x.closePath();x.fill();
 x.beginPath();x.moveTo(29,-42);x.bezierCurveTo(51,-30,63,-4,62,17);x.bezierCurveTo(46,7,35,3,24,-10);x.closePath();x.fill();
 x.beginPath();x.moveTo(bend-10,100);x.bezierCurveTo(bend+15,112,bend+40,147,bend+25,176);x.bezierCurveTo(bend+8,151,bend-7,150,bend-20,174);x.bezierCurveTo(bend-41,158,bend-34,119,bend-10,100);x.fill();x.globalAlpha=1;
 x.fillStyle=p.pearl;x.fill(body);x.save();x.clip(body);
 if(red){x.fillStyle=p.coral;x.beginPath();x.ellipse(1,-73,19,24,-.4,0,TAU);x.fill();x.beginPath();x.ellipse(-10,-7,22,33,-.3,0,TAU);x.fill();x.beginPath();x.ellipse(8,53,13,22,.3,0,TAU);x.fill();}
 x.globalAlpha=.16;x.strokeStyle=p.deep;x.lineWidth=.7;
 for(let row=0;row<18;row++){for(let col=0;col<7;col++){const sx=-36+col*12+(row%2)*6,sy=-58+row*8;x.beginPath();x.arc(sx,sy,7,.15,Math.PI-.15);x.stroke();}}
 x.restore();x.globalAlpha=.3;x.strokeStyle=p.deep;x.lineWidth=.8;
 for(let i=0;i<6;i++){line(x,[[-27,-31+i*4],[-57+i*3,5]],p.deep,.7);line(x,[[28,-31+i*4],[56-i*3,7]],p.deep,.7);}
 line(x,[[-2,-52],[-2,14],[bend-10,89]],p.deep,.8);
 for(let i=0;i<5;i++)line(x,[[bend-11,113],[bend-23+i*10,162]],p.deep,.7);
 x.globalAlpha=.8;circle(x,-15,-79,2,p.deep);circle(x,14,-79,2,p.deep);x.globalAlpha=.4;line(x,[[-9,-97],[2,-95],[10,-98]],p.deep,.8);x.restore();
}
function pond(x,t,b,m,h,p,motion){
 const low=Math.tanh(Math.max(0,b)),melody=Math.tanh(Math.max(0,m));
 const swimTime=motion.swimTime??t;
 const cy=1024,R=447;disk(x,540,cy,R,0);
 x.save();x.beginPath();x.arc(540,cy,R,0,TAU);x.clip();
 // Ripples bend gently, rather than forming a perfectly mechanical record.
 for(let i=0;i<26;i++){const r=112+i*13;x.beginPath();for(let j=0;j<=180;j++){const a=j/180*TAU,rr=r+Math.sin(a*3+t*.4+i*.13)*(3+low*10)+Math.sin(a*7-t*.2)*(2+melody*2),px=540+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;j?x.lineTo(px,py):x.moveTo(px,py);}x.globalAlpha=i%5===0?.5+low*.18:.18+melody*.08;x.strokeStyle=p.line;x.lineWidth=i%5===0?1.4+low*1.3:.75;x.stroke();}
 for(const beat of (motion.beats??[]).slice(-5)){const phase=Math.min(1,beat.age/3);x.globalAlpha=wakeFade(beat,3)*beat.strength*.85;ring(x,540,cy,105+phase*335,p.pearl,2.5+beat.strength*2);}
 x.globalAlpha=1;circle(x,540,cy,91,p.sun);ring(x,540,cy,78,p.deep,.8);circle(x,540,cy,4,p.deep);
 for(let i=0;i<3;i++){const a=-2.5+i*TAU/3+swimTime*.05,r=285+Math.sin(swimTime*.4+i)*8;koiFish(x,540+Math.cos(a)*r,cy+Math.sin(a)*r,a+Math.PI,1.03,swimTime+i,p,i!==1);}
 for(let i=0;i<10;i++){const a=i*2.399+t*.06,r=340+(i%3)*22;x.globalAlpha=.25+Math.sin(i)*.1;x.fillStyle=p.pearl;x.save();x.translate(540+Math.cos(a)*r,cy+Math.sin(a)*r);x.rotate(a);x.beginPath();x.ellipse(0,0,2,5+h*2,0,0,TAU);x.fill();x.restore();}
 x.restore();ring(x,540,cy,R+10,p.line,.8);ring(x,540,cy,R+18,p.line,.6);
}
const pineGrove=new Image();
pineGrove.src=new URL('./assets/pine-grove.png',import.meta.url).href;
let pineGroveLoaded=false;
const typeReady=Promise.all([
 document.fonts.load('400 104px "DM Sans"'),
 document.fonts.load('500 36px "DM Sans"'),
 document.fonts.load('400 64px "Zen Kaku Gothic New"','水音山響鳥居音楽と風景')
]);
export const artworkReady=Promise.all([typeReady,pineGrove.decode().then(()=>{pineGroveLoaded=true;}).catch(()=>{})]);
function fujiPine(x,p){
 // A detailed three-pine illustration anchors the foreground; all motion stays in code.
 if(pineGroveLoaded)x.drawImage(pineGrove,110,998,435,435);
}
function fuji(x,t,b,m,h,p,motion){
 const low=Math.tanh(Math.max(0,b)),melody=Math.tanh(Math.max(0,m));
 const arch=new Path2D();arch.moveTo(105,1436);arch.lineTo(105,1000);arch.bezierCurveTo(105,741,297,574,540,574);arch.bezierCurveTo(783,574,975,741,975,1000);arch.lineTo(975,1436);arch.closePath();
 x.save();x.clip(arch);x.fillStyle=p.coral;x.fillRect(80,550,920,950);x.drawImage(fujiMoon,499+(motion.moonX??0),636+(motion.moonY??0));
 const mountain=new Path2D();mountain.moveTo(62,1304);mountain.bezierCurveTo(222,1247,342,1031,474,826);mountain.quadraticCurveTo(487,806,496,796);mountain.quadraticCurveTo(530,802,563,797);mountain.bezierCurveTo(685,984,802,1218,1015,1304);mountain.lineTo(1015,1480);mountain.lineTo(62,1480);mountain.closePath();
 x.fillStyle=p.deep;x.fill(mountain);x.save();x.clip(mountain);
 // Snow and slope shading are painted inside the exact mountain silhouette.
 x.fillStyle=p.water;x.beginPath();x.moveTo(548,799);x.bezierCurveTo(578,995,731,1180,914,1328);x.lineTo(1050,1480);x.lineTo(1050,750);x.closePath();x.fill();
 const snow=new Path2D();snow.moveTo(270,650);snow.lineTo(810,650);snow.lineTo(810,965);snow.bezierCurveTo(742,935,680,915,646,917);snow.bezierCurveTo(626,920,624,955,608,951);snow.bezierCurveTo(591,947,583,904,568,915);snow.bezierCurveTo(553,930,548,953,536,948);snow.bezierCurveTo(520,944,518,911,501,924);snow.bezierCurveTo(481,941,469,957,455,943);snow.bezierCurveTo(430,921,389,923,345,947);snow.lineTo(270,965);snow.closePath();x.fillStyle=p.pearl;x.fill(snow);
 // Music travels across the mountain in visible, bounded contour waves.
 x.strokeStyle=p.pearl;
 for(let i=0;i<11;i++){const crest=i%3===0;x.globalAlpha=crest?.36+low*.2:.16+melody*.12;x.lineWidth=crest?2.2+low*1.2:1.1+melody*.5;x.beginPath();for(let j=0;j<=150;j++){const px=55+j*6.5;const peak=Math.exp(-(((px-534)/(155+i*14))**2));const drift=Math.sin(px*.009-t*.85+i*.28)*(2+melody*9)+Math.sin(px*.021+t*.3+i*.2)*melody*2;const py=1030+i*24-peak*(55+i*1.8)+drift;j?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();}
 for(const beat of (motion.beats??[]).slice(-5)){const phase=Math.min(1,beat.age/3.2);x.globalAlpha=wakeFade(beat,3.2)*beat.strength*.8;x.lineWidth=2.5+beat.strength*1.8;x.beginPath();for(let j=0;j<=120;j++){const px=65+j*8,py=1000+phase*360-Math.exp(-(((px-534)/260)**2))*28+Math.sin(px*.012-t*.4)*4;j?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();}
 x.globalAlpha=.11;x.drawImage(lakeTextures[1],80,780,950,680);x.restore();
 const hillColors=['#53637d','#455973','#354d68','#263e59'];
 for(let i=0;i<4;i++){
  const ridge=new Path2D();for(let j=0;j<=120;j++){const px=70+j*8;const py=1268+i*48+Math.sin(px*.005+i*.45)*(23)+Math.sin(px*.01-i*.2)*5;j?ridge.lineTo(px,py):ridge.moveTo(px,py);}
  const fill=new Path2D(ridge);fill.lineTo(1030,1480);fill.lineTo(70,1480);fill.closePath();x.fillStyle=hillColors[i];x.fill(fill);x.globalAlpha=.2;x.strokeStyle=p.line;x.lineWidth=.9;x.stroke(ridge);x.globalAlpha=1;
  x.save();x.clip(fill);for(let band=0;band<2;band++){x.globalAlpha=(band===0?.22:.12)+low*.13;x.lineWidth=band===0?2.4:1.4;wave(x,1290+i*48+band*20,t*2.2,3+melody*6,p.pearl,i*.4+band*.5,70,1030);}x.restore();
 }
 fujiPine(x,p);x.restore();
}
function gate(x,cx,y,s,p){x.save();x.translate(cx,y);x.scale(s,s);x.fillStyle=p;const top=new Path2D();top.moveTo(-245,-10);top.quadraticCurveTo(-105,22,0,16);top.quadraticCurveTo(105,22,245,-10);top.lineTo(234,21);top.quadraticCurveTo(110,49,0,44);top.quadraticCurveTo(-110,49,-234,21);top.closePath();x.fill(top);x.fillRect(-210,77,420,19);x.fillRect(-155,33,25,328);x.fillRect(130,33,25,328);x.fillRect(-168,348,52,13);x.fillRect(116,348,52,13);x.fillRect(-12,43,24,34);x.restore();}
const gateReflection=makeCanvas(620,450);
gate(gateReflection.getContext('2d'),310,20,1.18,palettes[2].coral);
function torii(x,t,b,m,h,p,motion){
 const low=Math.tanh(Math.max(0,b)),melody=Math.tanh(Math.max(0,m));
 const R=450,cy=1024;disk(x,540,cy,R,2);x.save();x.beginPath();x.arc(540,cy,R,0,TAU);x.clip();
 // Rotate the rigid crescent a few degrees around its center; its size never changes.
 x.save();x.translate(607,816);x.rotate(motion.moonAngle??0);x.translate(-607,-816);x.beginPath();x.arc(607,816,209,0,TAU);x.clip();const crescent=new Path2D();crescent.arc(607,816,209,0,TAU);crescent.moveTo(849,782);crescent.arc(651,782,198,0,TAU);x.fillStyle=p.sun;x.fill(crescent,'evenodd');x.restore();
 for(let i=0;i<6;i++){x.globalAlpha=.12;x.strokeStyle=p.pearl;x.lineWidth=1;ring(x,607,816,227+i*16,p.pearl,.8);}x.globalAlpha=1;
 shape(x,[[40,1114],[210,1084],[380,1105],[550,1087],[720,1102],[990,1070],[1040,1150],[40,1150]],p.deep);
 gate(x,540,767,1.18,p.coral);
 // A second pass on the timber keeps the gate from feeling like an icon.
 line(x,[[363,830],[363,1176]],p.pearl,1);line(x,[[700,830],[700,1176]],p.pearl,1);line(x,[[317,870],[765,870]],p.pearl,.8);
 // Continuous, overlapping scanlines keep the reflection connected as it bends.
 for(let row=0;row<270;row+=2){const depth=row/270,width=620*(1+depth*.12+melody*.08);const shift=Math.sin(row*.17-t*1.4)*(2+depth*8)*(0.6+melody*.6)+Math.sin(row*.4+t*.8)*low*3;x.globalAlpha=.56*(1-row/330);x.drawImage(gateReflection,0,447-row*1.5,620,3.5,540-width/2+shift,1194+row,width,2.5);}x.globalAlpha=1;
 // Broad light-catching crests read clearly at phone size.
 for(let i=0;i<13;i++){const crest=i%3===0;x.lineWidth=crest?2.4+low*1.6:1.1;x.globalAlpha=crest?.3+low*.2:.11+melody*.09;wave(x,1145+i*25,t*2.5,3+melody*8+low*3,p.pearl,i*.3);}x.globalAlpha=1;
 // Each measured audio onset launches a new wake; silence never invents beats.
 for(const origin of [371,708])for(const beat of (motion.beats??[]).slice(-5)){
  const phase=Math.min(1,beat.age/3),rx=18+phase*230,ry=4+phase*37,cy=1198+phase*114;
  x.globalAlpha=wakeFade(beat,3)*beat.strength*.9;x.strokeStyle=p.pearl;x.lineWidth=2.2+beat.strength*2.8;
  x.beginPath();x.ellipse(origin,cy,rx,ry,0,0,Math.PI);x.stroke();
  x.globalAlpha*=.35;x.lineWidth=1;x.beginPath();x.ellipse(origin,cy,rx,ry,0,Math.PI,TAU);x.stroke();
 }x.globalAlpha=1;
 x.restore();ring(x,540,cy,R+13,p.ink,.8);
}
// Fullscreen scenes use screen coordinates, with no poster frame or typography.
// Scale uniformly by height so fish, moons and timber retain their proportions.
function screenPond(x,w,t,b,m,h,p,motion){
 const low=Math.tanh(Math.max(0,b)),melody=Math.tanh(Math.max(0,m));
 x.drawImage(lakeTextures[0],0,0,w,1000);
 const cx=w*.5,cy=520,spread=w/1500;
 for(let i=0;i<30;i++){
  const rx=(115+i*25)*spread,ry=88+i*19;
  x.beginPath();for(let j=0;j<=180;j++){
   const a=j/180*TAU,ripple=Math.sin(a*3+t*.4+i*.13)*(3+low*10)+Math.sin(a*7-t*.2)*(2+melody*2);
   const px=cx+Math.cos(a)*(rx+ripple),py=cy+Math.sin(a)*(ry+ripple);
   j?x.lineTo(px,py):x.moveTo(px,py);
  }
  x.globalAlpha=i%5===0?.44+low*.15:.14+melody*.08;
  x.strokeStyle=p.line;x.lineWidth=i%5===0?1.5+low: .8;x.stroke();
 }
 for(const beat of (motion.beats??[]).slice(-5)){
  const phase=Math.min(1,beat.age/3);x.globalAlpha=wakeFade(beat,3)*beat.strength*.85;
  x.beginPath();x.ellipse(cx,cy,(100+phase*740)*spread,80+phase*490,0,0,TAU);
  x.strokeStyle=p.pearl;x.lineWidth=2.5+beat.strength*2;x.stroke();
 }
 x.globalAlpha=1;const label=Math.min(87,w*.09);
 circle(x,cx,cy,label,p.sun);ring(x,cx,cy,label*.86,p.deep,.8);circle(x,cx,cy,3,p.deep);
 const swim=motion.swimTime??t,rx=w*.31,ry=280,size=Math.min(1.04,w/1000);
 for(let i=0;i<3;i++){
  const a=-2.5+i*TAU/3+swim*.05,drift=Math.sin(swim*.4+i)*7;
  const angle=Math.atan2(ry*Math.cos(a),-rx*Math.sin(a))+Math.PI/2;
  koiFish(x,cx+Math.cos(a)*(rx+drift),cy+Math.sin(a)*(ry+drift),angle,size,swim+i,p,i!==1);
 }
 x.globalAlpha=1;
}
function screenFuji(x,w,t,b,m,h,p,motion){
 const low=Math.tanh(Math.max(0,b)),melody=Math.tanh(Math.max(0,m));
 x.fillStyle=p.coral;x.fillRect(0,0,w,1000);
 const center=w*.57,base=860,peak=278,half=Math.max(w*.39,440);
 const summit=center-60,moonX=center+half*.32+(motion.moonX??0),moonY=290+(motion.moonY??0);
 x.drawImage(fujiMoon,moonX-196,moonY-196,392,392);
 // A broad, continuous silhouette gives the mountain room across a desktop.
 const mountain=new Path2D();mountain.moveTo(center-half,base);
 mountain.bezierCurveTo(center-half*.5,795,summit-150,460,summit-36,peak);
 mountain.quadraticCurveTo(summit,peak+5,summit+40,peak);
 mountain.bezierCurveTo(center+half*.4,645,center+half*.53,792,center+half,base);
 mountain.lineTo(w+100,1100);mountain.lineTo(-100,1100);mountain.closePath();
 x.fillStyle=p.deep;x.fill(mountain);x.save();x.clip(mountain);
 shape(x,[[summit+15,peak],[center+half*.7,base],[w+100,1100],[w+100,200]],p.water);
 const snow=new Path2D();snow.moveTo(summit-240,170);snow.lineTo(summit+260,170);snow.lineTo(summit+260,447);
 snow.bezierCurveTo(summit+177,417,summit+126,420,summit+100,429);
 snow.bezierCurveTo(summit+80,437,summit+82,468,summit+64,460);
 snow.bezierCurveTo(summit+47,451,summit+40,421,summit+26,435);
 snow.bezierCurveTo(summit+8,452,summit+4,467,summit-10,454);
 snow.bezierCurveTo(summit-25,436,summit-30,429,summit-48,445);
 snow.bezierCurveTo(summit-73,467,summit-81,451,summit-109,442);
 snow.lineTo(summit-240,457);snow.closePath();x.fillStyle=p.pearl;x.fill(snow);
 for(let i=0;i<14;i++){
  x.globalAlpha=i%3===0?.38+low*.18:.17+melody*.1;x.lineWidth=i%3===0?2.3+low:1.1;x.strokeStyle=p.pearl;x.beginPath();
  for(let j=0;j<=150;j++){
   const px=w*j/150,crest=Math.exp(-(((px-center)/(half*.43+i*10))**2));
   const py=535+i*24-crest*(66+i*2)+Math.sin(px*.008-t*.85+i*.28)*(3+melody*9);
   j?x.lineTo(px,py):x.moveTo(px,py);
  }x.stroke();
 }
 for(const beat of (motion.beats??[]).slice(-5)){
  const phase=Math.min(1,beat.age/3.2);x.globalAlpha=wakeFade(beat,3.2)*beat.strength*.8;x.lineWidth=3;x.strokeStyle=p.pearl;x.beginPath();
  for(let j=0;j<=120;j++){const px=w*j/120,py=480+phase*430-Math.exp(-(((px-center)/(half*.5))**2))*40+Math.sin(px*.012-t*.4)*4;j?x.lineTo(px,py):x.moveTo(px,py);}x.stroke();
 }
 x.globalAlpha=.1;x.drawImage(lakeTextures[1],0,170,w,930);x.restore();
 const colors=['#53637d','#455973','#354d68','#263e59'];
 for(let i=0;i<4;i++){
  const ridge=new Path2D();for(let j=0;j<=150;j++){const px=w*j/150,py=817+i*57+Math.sin(px*.003+i*.6)*26+Math.sin(px*.009-i*.2)*5;j?ridge.lineTo(px,py):ridge.moveTo(px,py);}
  const fill=new Path2D(ridge);fill.lineTo(w,1050);fill.lineTo(0,1050);fill.closePath();x.fillStyle=colors[i];x.fill(fill);
  x.save();x.clip(fill);x.globalAlpha=.22+low*.13;x.lineWidth=2;wave(x,841+i*57,t*2.2,4+melody*6,p.pearl,i*.4,0,w);x.restore();
 }
 if(pineGroveLoaded){const size=Math.min(570,w*.55);x.drawImage(pineGrove,w*.015,1000-size,size,size);}
}
function screenTorii(x,w,t,b,m,h,p,motion){
 const low=Math.tanh(Math.max(0,b)),melody=Math.tanh(Math.max(0,m));
 x.drawImage(lakeTextures[2],0,0,w,1000);
 const cx=w*.5,scale=Math.min(1.4,w/690),y=240,foot=y+361*scale;
 const moonX=w*.59,moonY=286,r=Math.min(210,w*.25);
 x.save();x.translate(moonX,moonY);x.rotate(motion.moonAngle??0);
 x.beginPath();x.arc(0,0,r,0,TAU);x.clip();const crescent=new Path2D();crescent.arc(0,0,r,0,TAU);
 crescent.moveTo(r*1.16,r*-.16);crescent.arc(r*.21,r*-.16,r*.95,0,TAU);
 x.fillStyle=p.sun;x.fill(crescent,'evenodd');x.restore();
 for(let i=0;i<6;i++){x.globalAlpha=.09;ring(x,moonX,moonY,r+20+i*16,p.pearl,.8);}x.globalAlpha=1;
 const ridge=[[0,650],[w*.14,602],[w*.28,632],[w*.43,611],[w*.59,635],[w*.77,598],[w,629],[w,710],[0,710]];
 shape(x,ridge,p.deep);
 for(let i=0;i<15;i++){
  x.globalAlpha=i%3===0?.3+low*.2:.11+melody*.09;x.lineWidth=i%3===0?2.4+low*1.6:1.1;
  wave(x,665+i*26,t*2.5,3+melody*8+low*3,p.pearl,i*.3,0,w);
 }x.globalAlpha=1;
 gate(x,cx,y,scale,p.coral);
 line(x,[[cx-150*scale,y+54*scale],[cx-150*scale,foot-4]],p.pearl,1);
 line(x,[[cx+135*scale,y+54*scale],[cx+135*scale,foot-4]],p.pearl,1);
 line(x,[[cx-210*scale,y+83*scale],[cx+210*scale,y+83*scale]],p.pearl,.8);
 for(let row=0;row<270;row+=2){
  const depth=row/270,width=620*scale/1.18*(1+depth*.12+melody*.08);
  const shift=Math.sin(row*.17-t*1.4)*(2+depth*8)*(.6+melody*.6)+Math.sin(row*.4+t*.8)*low*3;
  x.globalAlpha=.56*(1-row/330);x.drawImage(gateReflection,0,447-row*1.5,620,3.5,cx-width/2+shift,foot+row,width,2.5);
 }x.globalAlpha=1;
 for(const origin of [cx-142.5*scale,cx+142.5*scale])for(const beat of (motion.beats??[]).slice(-5)){
  const phase=Math.min(1,beat.age/3);x.globalAlpha=wakeFade(beat,3)*beat.strength*.85;
  x.strokeStyle=p.pearl;x.lineWidth=2.2+beat.strength*2.8;x.beginPath();x.ellipse(origin,foot+phase*110,18+phase*w*.16,4+phase*38,0,0,Math.PI);x.stroke();
 }x.globalAlpha=1;
}
export function renderFullscreenArtwork(x,scene,t=0,b=0,m=0,h=0,motion={}){
 const scale=x.canvas.height/1000,w=x.canvas.width/scale,p=palettes[scene];
 x.save();x.setTransform(scale,0,0,scale,0,0);x.fillStyle=p.bg;x.fillRect(0,0,w,1000);
 [screenPond,screenFuji,screenTorii][scene](x,w,t,b,m,h,p,motion);
 x.globalAlpha=.55;x.drawImage(grain,0,0,w,1000);x.restore();
}
export function renderArtwork(x,scene,t=0,b=0,m=0,h=0,withType=true,motion={}){
 x.save();x.setTransform(x.canvas.width/1080,0,0,x.canvas.height/1920,0,0);const p=palettes[scene],s=scenes[scene];x.fillStyle=p.bg;x.fillRect(0,0,1080,1920);
 if(withType){
  x.fillStyle=p.ink;x.textAlign='left';x.font='500 32px "DM Sans", sans-serif';x.fillText('oto',72,94);
  x.fillStyle=p.muted;x.font='400 22px "DM Sans", sans-serif';x.fillText('Japan in sound',148,94);x.textAlign='right';x.font='400 20px "DM Sans", sans-serif';x.fillText('Art 0'+(scene+1),1008,94);line(x,[[72,132],[1008,132]],p.line,.6);
  x.textAlign='left';x.fillStyle=p.ink;x.font='400 104px "DM Sans", sans-serif';if('letterSpacing' in x)x.letterSpacing='-2px';s.headline.forEach((word,i)=>x.fillText(word,72,280+i*108));if('letterSpacing' in x)x.letterSpacing='0px';
  x.textAlign='right';x.fillStyle=p.muted;x.font='400 64px "Zen Kaku Gothic New", sans-serif';[...s.jp].forEach((char,i)=>x.fillText(char,1008,268+i*82));
 }
 [pond,fuji,torii][scene](x,t,b,m,h,p,motion);
 if(withType){
  line(x,[[72,1570],[1008,1570]],p.line,.7);x.fillStyle=p.ink;x.textAlign='left';x.font='500 36px "DM Sans", sans-serif';x.fillText(s.name,72,1650);x.fillStyle=p.muted;x.font='400 24px "DM Sans", sans-serif';x.fillText(s.subtitle,72,1698);
  x.textAlign='right';x.fillStyle=p.ink;x.font='400 32px "Zen Kaku Gothic New",sans-serif';x.fillText(s.jp,1008,1650);x.fillStyle=p.muted;x.font='400 22px "Zen Kaku Gothic New",sans-serif';x.fillText('音の風景',1008,1698);
  // A quiet engraved waveform is part of the print, and responds to the treble.
  x.strokeStyle=p.line;x.lineWidth=1;for(let i=0;i<90;i++){const xx=74+i*10.4,amp=2+Math.sin(i*.48)**2*(5+h*20)+Math.sin(i*.15+t*.3)**2*8;line(x,[[xx,1796-amp],[xx,1796+amp]],p.line,.8);}
  x.textAlign='left';x.font='400 20px "DM Sans",sans-serif';x.fillStyle=p.muted;x.fillText('Slow art. Your soundtrack.',72,1853);x.textAlign='right';x.font='500 24px "DM Sans",sans-serif';x.fillText('oto',1008,1853);
 }
 x.globalAlpha=.55;x.drawImage(grain,0,0,1080,1920);x.restore();
}
