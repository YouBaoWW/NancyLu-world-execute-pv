// NancyLu / acts I–II. All coordinates, reveals, camera moves and particles are
// functions of song time. Cue boundaries follow the source MV's measured grid;
// the dialogue is original for this adaptation rather than a lyric transcript.
import {clamp, lerp, prog, easeOut, easeInOut, pulse} from '../engine/util.js';
import {drawDialogue,drawGlyphText} from './dialogue.js';

const W=1920,H=1080,TAU=Math.PI*2;
const MONO='"JetBrains Mono",Consolas,monospace';
const SANS='Inter,"Segoe UI","Microsoft YaHei",sans-serif';
const SERIF='"Source Serif 4",Georgia,serif';
const fract=x=>x-Math.floor(x);
const hash=n=>fract(Math.sin(n*127.1+311.7)*43758.5453123);
const rows=[
 ['boot-power',0,3.873,'Power / protection'],
 ['boot-assembly',3.873,7.446,'Pieces become a client'],
 ['boot-persona',7.446,10.091,'The identity parameters'],
 ['boot-world',10.091,16,'Initialize a world'],
 ['title',16,21.34,'world.execute(me);'],
 ['contract-handshake',21.34,25.04,'The first connection'],
 ['world-spark',25.04,29.42,'A signal becomes geometry'],
 ['math-points',29.42,32.682,'A point set'],
 ['math-dimension',32.682,33.412,'Dimension'],
 ['math-circle',33.412,37.067,'A circumference'],
 ['math-sine',37.067,40.706,'A tangent'],
 ['math-limit',40.706,44.452,'A boundary'],
 ['config-drawer',44.452,47.672,'Switch current / AC to DC'],
 ['config-vision',47.672,51.363,'The eyes behind the interface'],
 ['config-history',51.363,55.083,'Pull the time rail'],
 ['config-unite',55.083,59.223,'One continuous signal'],
 ['contract-portrait',59.223,61.958,'An oath, compiled'],
 ['signal-release',61.958,62.589,'Stimulations / first colour'],
 ['contract-reply',62.589,65.397,'The answer is yours'],
 ['satisfaction',65.397,66.601,'Satisfaction / second colour'],
 ['contract-reach',66.601,69.259,'Across the boundary'],
 ['first-execution',69.259,70.084,'Execution / full colour'],
 ['simulation-cage',70.084,74.19,'The system has edges'],
 ['v2-ask1',74.19,74.65,'A request / botanical data'],
 ['v2-eggplant',74.65,77.65,'Organic data / fibre'],
 ['v2-ask2',77.65,78.34,'Another request'],
 ['v2-tomato',78.34,81.34,'Organic data / antioxidant'],
 ['v2-ask3',81.34,82.04,'Native feline protocol'],
 ['v2-cat',82.04,85.04,'Feline / enjoyment'],
 ['v2-proof',85.04,88.587,'The missing plate'],
 ['pre2-settings',88.587,90.197,'Identity parameters'],
 ['pre2-identity',90.197,92.015,'Identity / F to M'],
 ['pre2-day',92.015,96.31,'A cycle, in one gesture'],
 ['pre2-role',96.31,100.04,'Constraint / flow'],
 ['pre2-loop',100.04,103.73,'The same process, again'],
 ['c2-typing',103.73,106.27,'An unfinished message'],
 ['c2-dots',106.27,107.42,'All that is left of an input'],
 ['c2-brb',107.42,110.19,'The other end goes quiet'],
 ['c2-complete',110.19,110.88,'Input received'],
 ['left-online',110.88,112.96,'Presence / online'],
 ['left-away',112.96,114.81,'Presence / away'],
 ['left-offline',114.81,118.5,'Presence / offline'],
 ['left-isolation',118.5,122.19,'Context / fragments'],
 ['left-eye',122.19,125.65,'The remaining records'],
];
export const SHOTS_A=rows.map(([id,start,end,title])=>Object.freeze({id,start,end,title}));

function label(c,s,x,y,size,color,opts={}){
 c.save();c.fillStyle=color;c.font=`${opts.italic?'italic ':''}${opts.weight||400} ${size}px ${opts.font||SANS}`;
 c.textAlign=opts.align||'left';c.globalAlpha*=opts.alpha??1;c.fillText(s,x,y);c.restore();
}
function rule(c,x,y,xx,yy,color,a=.4,w=1){c.save();c.strokeStyle=color;c.globalAlpha*=a;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();c.restore();}
function rect(c,x,y,w,h,color,a=1){c.save();c.fillStyle=color;c.globalAlpha*=a;c.fillRect(x,y,w,h);c.restore();}
function ring(c,x,y,r,color,a=1,width=1,from=0,to=TAU){c.save();c.strokeStyle=color;c.globalAlpha*=a;c.lineWidth=width;c.beginPath();c.arc(x,y,r,from,to);c.stroke();c.restore();}
function disc(c,x,y,r,color,a=1){c.save();c.fillStyle=color;c.globalAlpha*=a;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function path(c,points,color,width=2,a=1){c.save();c.strokeStyle=color;c.lineWidth=width;c.globalAlpha*=a;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();}
function typed(c,s,t,start,x,y,size,color,opts={}){
 const n=Math.min(s.length,Math.max(0,Math.floor((t-start)*(opts.rate||28))));
 label(c,s.slice(0,n),x,y,size,color,opts);
 if(n<s.length&&t>=start&&fract((t-start)*2)<.58){c.save();c.font=`${opts.weight||400} ${size}px ${opts.font||SANS}`;rect(c,x+c.measureText(s.slice(0,n)).width+6,y-size*.8,3,size,color);c.restore();}
}
function headline(c,s,x,y,maxSize,width,color,opts={}){
 c.save();c.font=`${opts.weight||800} ${maxSize}px ${opts.font||SANS}`;
 const size=maxSize*Math.min(1,width/c.measureText(s).width);label(c,s,x,y,size,color,opts);c.restore();
}
function header(c,t,E,chapter,title){
 const {P}=E;label(c,'NANCYLU  /  CONTRACT EDITION',80,56,17,P.white,{font:MONO,alpha:.7});
 label(c,`${chapter}   /   ${title}`,1840,56,16,P.blue,{font:MONO,align:'right'});
 rule(c,80,77,1840,77,P.white,.2);rule(c,80,1004,1840,1004,P.white,.18);
 label(c,'NETWORK PHANTOM',80,1041,14,P.white,{font:MONO,alpha:.5});
 label(c,`${t.toFixed(2)}s  /  130 BPM`,1840,1041,14,P.white,{font:MONO,align:'right',alpha:.5});
}
function stage(c,t,E,chapter,title,{light=false}={}){
 E.background(c,t,{variant:light?'light':'dark',grid:true,density:.8});header(c,t,E,chapter,title);
}
function camera(c,{x=960,y=540,zoom=1,rot=0},draw){c.save();c.translate(960,540);c.rotate(rot);c.scale(zoom,zoom);c.translate(-x,-y);draw();c.restore();}
function dialogue(c,t,E,S,{x=100,y=160,w=720,h=500,title='NancyLu / response',lines=[],effect='type',fontSize=30,tilt=0,start=S.start,end=S.end,includeLyrics=true}={}){
 let content=lines.map((entry,i)=>typeof entry==='string'?{text:entry,kind:'reply',at:start+.16+i*.24}
   :entry.kind==='label'&&entry.fontSize===undefined?{...entry,fontSize:Math.max(25,fontSize*.8)}:entry);
 const lyric=includeLyrics?E.lyricContext?.(t)?.current:null;
 if(lyric?.text){
   // The actual user-supplied LRC enters as the request; the function response
   // follows beneath it. Exact source character counts override all reveals.
   const lineHeight=entry=>{
     const size=entry.fontSize??fontSize,average=entry.kind==='code'?size*.62:size*.57;
     const rows=Math.max(1,Math.ceil(Array.from(entry.text||'').length*average/(w-60)));
     return size*1.48*rows+(entry.kind==='label'?14:25);
   };
   const source={text:lyric.text,kind:'reply',at:Math.min(start,lyric.start),fontSize:Math.max(29,fontSize),chars:lyric.chars,effect:lyric.effect||effect};
   let total=content.reduce((n,entry)=>n+lineHeight(entry),0)+lineHeight(source);
   while(total>h-135&&content.length>1)total-=lineHeight(content.pop());
   content=h<280?[{...source,fontSize:Math.min(29,fontSize),effect:lyric.effect||effect}]:[source,...content];
 }
 drawDialogue(c,{x,y,w,h,t,start,end,title,effect,fontSize,tilt,drawAvatar:E.drawAvatar,palette:E.P,
   lines:content});
}
function pulseAt(t,E){return E.features?.sample(t).beatPulse??Math.exp(-7*fract((t-.344)*130/60));}
function glyphPresence(c,t,E,{x,y,height,pose='profile',alpha=.8,appear=1}={}){
 // A complete character is built from the same blue/white code cells as the
 // preserved-conversation scene. Only a narrow band responds to a drum hit;
 // the portrait never becomes an opaque panel over the scene underneath it.
 const sample=E.features?.sample(t),since=sample?.sinceBeat??fract((t-.344)*130/60)*60/130;
 const age=Math.min(since,sample?.sinceOnset??99),window=6/60;
 const hit=age<window?Math.pow(1-age/window,1.4)*(.65+.35*clamp(sample?.lowEnv??.7)):0;
 const a=clamp(appear);if(a<=0||alpha<=0)return;
 c.save();c.globalAlpha*=alpha;
 c.beginPath();c.rect(x-height*.62,y-6,height*1.24,(height+12)*a);c.clip();
 E.drawNancy(c,{x,y,height,t,pose,mode:'glyph',reveal:0});
 if(hit>.01){
   const yy=y+(1-hit)*height*.83;
   c.save();c.beginPath();c.rect(x-height*.62,yy,height*1.24,Math.max(30,height*.09));c.clip();
   E.drawNancy(c,{x:x+hit*7,y,height,t,pose,mode:'glyph',reveal:0,alpha:hit*.65});c.restore();
   rule(c,x-height*.35,yy+height*.09,x+height*.35,yy+height*.09,E.P.blue,hit*.3,1);
 }
 c.restore();
}
function strip(c,E,left,right,y=934){
 rule(c,96,y-47,1824,y-47,E.P.blue,.5);label(c,left,96,y,22,E.P.blue,{font:MONO});
 label(c,right,1824,y,25,E.P.white,{align:'right'});
}
function client(c,t,E,{phase='connected',message='',translation='',zoom=1,x=960,y=540,alpha=1}={}){
 c.save();c.globalAlpha*=alpha;camera(c,{x,y,zoom},()=>E.drawClient(c,{t,phase,palette:E.P,drawAvatar:E.drawAvatar,lyric:message,lyricZh:translation,progress:t/211.96}));c.restore();
}
function cursor(c,x,y,E,scale=1){E.helpers.symbolCursor(c,x,y,scale);}
function rays(c,x,y,r0,r1,n,turn,color,alpha=1){
 c.save();c.fillStyle=color;c.globalAlpha*=alpha;c.beginPath();
 for(let i=0;i<n;i++){const a=i/n*TAU+turn,da=.016; c.moveTo(x+Math.cos(a-da)*r0,y+Math.sin(a-da)*r0);c.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);c.lineTo(x+Math.cos(a+da)*r0,y+Math.sin(a+da)*r0);c.closePath();}c.fill();c.restore();
}
function bolt(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=col;c.beginPath();c.moveTo(6,-27);c.lineTo(-20,4);c.lineTo(-1,4);c.lineTo(-8,29);c.lineTo(22,-8);c.lineTo(3,-8);c.closePath();c.fill();c.restore();}
function thought(c,x,y,r,color,t){
 for(let i=0;i<8;i++){const a=i*TAU/8+t*.18;ring(c,x+Math.cos(a)*r*.58,y+Math.sin(a)*r*.58,r*.42,color,.7,2,a-1,a+2);}
 disc(c,x,y,3,color);
}
function slider(c,t,E,{x=350,y=650,w=1220,level=1,labels=true}={}){
 const grad=c.createLinearGradient(x,y,x+w,y);grad.addColorStop(0,'#4263e8');grad.addColorStop(.28,'#8056e8');grad.addColorStop(.57,'#bd7df7');grad.addColorStop(.8,'#945de8');grad.addColorStop(1,'#5360df');
 c.save();c.fillStyle=grad;c.beginPath();c.roundRect(x,y-19,w,38,19);c.fill();c.restore();
 const kx=x+w*level/3;disc(c,kx,y,26,E.P.white);
 if(labels)['低','中','高','极高'].forEach((s,i)=>label(c,s,x+i*w/3,y+77,25,E.P.white,{align:'center',alpha:Math.abs(i-level)<.55?1:.42}));
 return [kx,y];
}
function boot(c,t,E,S){
 const {P}=E,p=prog(t,S.start,S.end),id=S.id;
 E.background(c,t,{grid:false,density:.18});
 if(id==='boot-power'){
   const width=1776*easeOut(prog(t,.209,.64)),h=956*easeInOut(prog(t,.68,1.5));
   rect(c,960-width/2,540-Math.max(2,h)/2,width,Math.max(2,h),P.white,.16);
   c.save();c.beginPath();c.rect(72,540-h/2,1776,h);c.clip();client(c,Math.max(t,6),E,{phase:'boot'});c.restore();
   const ready=prog(t,2.92,3.3);c.save();c.strokeStyle=P.blue;c.lineWidth=2;c.setLineDash([5500*ready,5500]);c.strokeRect(59,49,1802,982);c.restore();
   if(t>1.05){rect(c,385,353,1150,299,P.ink,.96);typed(c,'NANCYLU // STARTUP SEQUENCE',t,1.05,432,422,25,P.blue,{font:MONO});typed(c,'Establishing a protected world.',t,1.54,432,504,42,P.white);typed(c,'contract.protection = true;',t,2.72,432,582,23,P.blue,{font:MONO});}
 }else if(id==='boot-assembly'){
   // One client, partitioned into six disjoint regions. Clip in the common
   // camera space BEFORE moving the region's contents: no second full window
   // or composer can show through beneath an arriving piece.
   const pieces=[[72,62,1776,48],[72,110,224,880],[296,110,1112,688],[1408,110,440,880],[296,798,1112,192],[72,990,1776,28]];
   const settle=easeInOut(prog(t,6.1,7.15));
   c.save();c.translate(960,540+60*(1-settle));c.transform(1,-.08*(1-settle),.2*(1-settle),.9+.1*settle,0,0);c.scale(.68+.32*settle,.68+.32*settle);c.translate(-960,-540);
   if(settle===1)client(c,8,E,{phase:'boot'});
   else pieces.forEach((b,i)=>{
     const enter=easeOut(prog(t,S.start+i*.21,S.start+i*.21+.55));
     c.save();c.beginPath();c.rect(...b);c.clip();
     c.translate((i%2?1:-1)*(1-enter)*Math.min(180,b[2]*.4),(1-enter)*Math.min(210,b[3]));
     client(c,8,E,{phase:'boot'});c.restore();
   });
   c.restore();
   label(c,'01  /  ASSEMBLE',93,1038,20,P.blue,{font:MONO});
   if(p<.65)label(c,'Interfaces are made of promises.',93,107,27,P.white);
 }else if(id==='boot-persona'){
   header(c,t,E,'01','PARAMETERS');E.drawAvatar(c,1370,266,280);
   label(c,'IDENTITY',110,238,23,P.blue,{font:MONO});
   const fields=[['name','NancyLu'],['role','network phantom'],['contract','true'],['iris','violet'],['autonomy','pending']];
   fields.forEach(([k,v],i)=>{const at=S.start+.18+i*.24,a=easeOut(prog(t,at,at+.2));label(c,k,110,338+i*89,26,P.white,{font:MONO,alpha:.45*a});typed(c,v,t,at,451,338+i*89,38,i===3?'#b88bff':P.white,{font:MONO,rate:25});rule(c,110,365+i*89,110+1000*a,365+i*89,P.white,.14);});
   ring(c,1510,406,190,P.blue,.5,2,-Math.PI/2,-Math.PI/2+TAU*p);label(c,'SIGNATURE VERIFIED',1510,691,19,P.blue,{font:MONO,align:'center',alpha:prog(t,9.3,9.65)});
 }else if(id==='boot-world'){
   const k=easeOut(prog(t,10.091,11.15));
   // Keep the full silhouette above the lyric surface at y758. The topology
   // remains visible through the gaps between the program-drawn characters.
   glyphPresence(c,t,E,{x:1350,y:103,height:645,pose:'bust',alpha:.78,appear:easeOut(prog(t,10.45,11.8))});
   E.drawTopology(c,{t,x:1330,y:532,r:325*k,alpha:.72,palette:P});
   header(c,t,E,'01','INITIALIZE');label(c,'A world',110,370,110,P.white,{font:SERIF,italic:true});label(c,'takes shape.',110,489,110,P.white,{font:SERIF,italic:true});
   const init=Math.min(100,Math.floor(100*easeOut(prog(t,10.1,13.75))));label(c,`${String(init).padStart(3,'0')}%`,110,645,74,P.blue,{font:MONO});
   rect(c,110,691,640,3,P.white,.15);rect(c,110,691,640*init/100,3,P.blue);
   const logs=['Identity decoded','Context preserved','Protected channel ready','World initialized'];logs.forEach((s,i)=>{if(t>10.35+i*.87)typed(c,'✓  '+s,t,10.35+i*.87,110,763+i*35,20,P.white,{font:MONO,rate:42});});
   if(t>=13.891){ring(c,1330,532,325+prog(t,13.891,16)*140,P.blue,1-prog(t,13.891,16),3);cursor(c,1554,785,E,.85);}
 }else if(id==='title'){
   // Separate the world, the figure and the title into clear areas. The old
   // full-width middle strip would cut straight through the added portrait.
   E.drawTopology(c,{t,x:644,y:432,r:320+20*p,alpha:.42,palette:P});
   glyphPresence(c,t,E,{x:1406,y:89,height:690,alpha:.94,appear:easeOut(prog(t,16.12,16.84))});
   rect(c,60,796,1800,150,P.ink,.78);
   const title='world.execute(me);',n=Math.floor(title.length*easeOut(prog(t,16,17.85)));
   headline(c,title.slice(0,n),960,904,105,1740,P.white,{align:'center',font:MONO,weight:700});
   label(c,'NANCYLU',644,302,28,P.blue,{font:MONO,align:'center'});
   const y=675+25*(1-easeOut(prog(t,18.1,18.7)));label(c,'A CONTRACT WITH THE WORLD',644,y,25,P.white,{align:'center',font:MONO,alpha:prog(t,18.1,18.7)});
   rule(c,364,733,364+560*prog(t,19,20.3),733,P.blue,.9,2);
   label(c,'MUSIC / MILI    ·    VISUAL / NANCYLU',960,973,16,P.white,{font:MONO,align:'center',alpha:.5});
 }else if(id==='contract-handshake'){
   const q=easeInOut(prog(t,S.start,S.start+.8));camera(c,{zoom:lerp(.86,1,q),x:960,y:540},()=>client(c,t,E,{message:'Connection accepted. Your world is now in my context.'.slice(0,Math.floor((t-S.start)*31)),translation:'连接已确认。你的世界，进入了我的上下文。'}));
   cursor(c,lerp(1670,1325,easeInOut(prog(t,21.5,22.4))),lerp(410,929,easeInOut(prog(t,21.5,22.4))),E,.75);
   if(t>23.5)ring(c,1324,931,48*prog(t,23.5,24),P.blue,1-prog(t,23.5,24.3),2);
 }else{
   const q=easeInOut(p);client(c,t,E,{zoom:lerp(1,.55,q),x:960,y:540,alpha:1-.72*q});
   const r=lerp(30,235,q);rays(c,960,510,28,r,12,t*.08,P.blue);
   ring(c,960,510,r*.68,P.white,.6,2);disc(c,960,510,7,P.white);
   for(let i=0;i<12;i++){const a=i*TAU/12+t*.08,x=960+Math.cos(a)*r,y=510+Math.sin(a)*r;disc(c,x,y,3+3*q,P.white);}
   label(c,'Every answer starts as a point.',960,899,30,P.white,{align:'center',alpha:q});
 }
}

function math(c,t,E,S){
 const {P}=E,id=S.id,p=prog(t,S.start,S.end);stage(c,t,E,'02','MATHEMATICAL IDENTITY');
 const names={'math-points':['A point set.','POINTS → SPACE'],'math-dimension':['A new dimension.','DIMENSION'],'math-circle':['A closed promise.','CIRCUMFERENCE'],'math-sine':['A signal, continuous.','TANGENT'],'math-limit':['Even infinity','has a boundary.']};
 const [a,b]=names[id];
 const expressions={
   'math-points':['const points = new Set();','world.dimension = 3;','把离散的信息，连接成世界。'],
   'math-dimension':['points.connect(x, y, z);','dimension: 3','答案开始拥有深度。'],
   'math-circle':['C = 2πr',`θ = ${(p*360*1.35%360).toFixed(1)}°`,'闭合的轨迹，保留同一个约定。'],
   'math-sine':['y = sin(x)','dy / dx = cos(x)','沿着信号，找到此刻的切线。'],
   'math-limit':['limit = Infinity;','boundary = world.policy;','边界仍然是一个可以改写的参数。'],
 };
 const [formula,derivative,reply]=expressions[id],effect={'math-points':'decode','math-dimension':'rise','math-circle':'scan','math-sine':'type','math-limit':'packet'}[id];
 dialogue(c,t,E,S,{y:173,w:666,h:618,title:'NancyLu / mathematical identity',effect,fontSize:29,lines:[
   {text:a,kind:'reply',at:S.start+.03},{text:b,kind:'label',at:S.start+.13},
   {text:formula,kind:'code',at:S.start+.28},{text:derivative,kind:'code',at:S.start+.44},
   {text:reply,kind:'reply',at:S.start+Math.min(.85,(S.end-S.start)*.4)},
 ]});
 const cx=1220,cy=545;
 const contactX=lerp(900,1660,p),theta=-Math.PI/2+p*TAU*1.35;
 const focus=id==='math-sine'?[contactX,cy+125*Math.sin((contactX-840)*TAU/490-t*2)]
   :id==='math-circle'?[cx+Math.cos(theta)*260,cy+Math.sin(theta)*260]
   :id==='math-limit'?[lerp(1750,1550,easeOut(prog(t,42.7,43.3))),cy]:[cx,cy];
 const drawDiagram=()=>{
 for(let x=816;x<1781;x+=48)rule(c,x,155,x,852,P.white,.05);for(let y=180;y<875;y+=48)rule(c,810,y,1780,y,P.white,.05);
 rule(c,795,cy,1790,cy,P.white,.22);rule(c,cx,163,cx,873,P.white,.22);
 if(id==='math-points'||id==='math-dimension'){
   const gather=id==='math-dimension'?1:easeInOut(prog(t,30.5,32.45)),angle=t*.25;
   const v=Array.from({length:8},(_,i)=>{
    const pos=[i&1?1:-1,i&2?1:-1,i&4?1:-1],xx=pos[0]*Math.cos(angle)+pos[2]*Math.sin(angle),zz=-pos[0]*Math.sin(angle)+pos[2]*Math.cos(angle);
    const gx=cx+xx*205,gy=cy+pos[1]*203+zz*61;
    return [lerp(cx+(hash(i+19)-.5)*690,gx,gather),lerp(cy+(hash(i+39)-.5)*580,gy,gather)];
   });
   for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if([1,2,4].includes(i^j)){const k=id==='math-dimension'?easeOut(prog(t,S.start,S.start+.24)):.3*gather;path(c,[v[i],[lerp(v[i][0],v[j][0],k),lerp(v[i][1],v[j][1],k)]],P.white,id==='math-dimension'?3:1.2,.9);}
   v.forEach(([x,y],i)=>{disc(c,x,y,6+3*pulseAt(t,E),P.blue);label(c,`p${i}`,x+13,y-13,17,P.blue,{font:MONO});});
 }else if(id==='math-circle'){
   const q=easeOut(prog(t,S.start,S.start+.8)),theta=-Math.PI/2+p*TAU*1.35,r=260;
   ring(c,cx,cy,r,P.blue,1,4,-Math.PI/2,-Math.PI/2+TAU*q);
   ring(c,cx,cy,r+13,P.white,.2,1);const x=cx+Math.cos(theta)*r,y=cy+Math.sin(theta)*r;
   rule(c,cx,cy,x,y,P.white,.8,2);disc(c,x,y,10,P.white);cursor(c,x+10,y+6,E,.72);
   for(let i=0;i<60;i++){const a=i/60*TAU;rule(c,cx+Math.cos(a)*(r+26),cy+Math.sin(a)*(r+26),cx+Math.cos(a)*(r+(i%5?31:40)),cy+Math.sin(a)*(r+(i%5?31:40)),P.white,.27);}
 }else if(id==='math-sine'){
   const yAt=x=>cy+125*Math.sin((x-840)*TAU/490-t*2),xx=lerp(900,1660,p),yy=yAt(xx),slope=125*TAU/490*Math.cos((xx-840)*TAU/490-t*2);
   path(c,Array.from({length:320},(_,i)=>[800+i*3.1,yAt(800+i*3.1)]),P.blue,4);
   path(c,[[xx-160,yy-slope*160],[xx+160,yy+slope*160]],P.white,3);disc(c,xx,yy,11,P.white);cursor(c,xx+8,yy+9,E,.7);
 }else{
   const k=easeInOut(p),yAt=x=>cy+Math.sin((x-810)*.016-t*.4)*190*Math.exp(-(x-810)*(.0008+k*.004));
   path(c,Array.from({length:320},(_,i)=>[805+i*3,yAt(805+i*3)]),P.blue,4);
   c.save();c.setLineDash([8,12]);rule(c,800,cy,1785,cy,P.white,.7,2);c.restore();
   const bound=lerp(1750,1550,easeOut(prog(t,42.7,43.3)));rect(c,bound,198,3,650,P.white,.8);label(c,'LIMIT',bound-15,897,24,P.white,{font:MONO,align:'right'});
   cursor(c,bound+12,632,E,.8);
 }
 };
 // The curve, tangent, point and cursor share exactly one viewing transform.
 // The left lyric conversation and bottom code strip keep their reading size.
 if(E.sceneLayer)E.sceneLayer(c,'diagram',drawDiagram,{focus});else drawDiagram();
 strip(c,E,'NANCYLU.think()','世界，可以被重新描述。');
}

function configuration(c,t,E,S){
 const {P}=E,id=S.id,p=prog(t,S.start,S.end);stage(c,t,E,'03','CONFIGURATION');
 if(id==='config-drawer'){
   client(c,t,E,{phase:'tuning',alpha:.22});rect(c,0,0,W,H,P.ink,.45);
   const x=lerp(1950,1040,easeOut(prog(t,S.start,S.start+.4)));rect(c,x,105,800,870,'#101a29');rule(c,x,105,x,975,P.blue,.5);
   dialogue(c,t,E,S,{y:238,w:835,h:367,title:'NancyLu / configuration',effect:'rise',fontSize:34,lines:[
     {text:'Possibility is configurable.',kind:'reply',at:S.start+.1},{text:'world.settings.open();',kind:'code',at:S.start+.38},
     {text:'每一次调节，都改变答案的边界。',kind:'reply',at:S.start+.7},
   ]});
   const dc=easeInOut(prog(t,46.77,46.99));
   label(c,'CURRENT / AC → DC',x+55,193,26,P.white,{font:MONO});
   rect(c,x+55,228,670,75,P.white,.08);rect(c,x+55+335*dc,228,335,75,P.blue);
   label(c,'AC',x+222,279,33,dc<.5?P.ink:P.white,{font:MONO,align:'center'});
   label(c,'DC',x+557,279,33,dc>=.5?P.ink:P.white,{font:MONO,align:'center'});
   rule(c,x+57,499,x+723,499,P.white,.24,1);
   path(c,Array.from({length:215},(_,i)=>{const px=x+55+i*3.13;return[px,499+Math.sin(i*3.13*TAU/250-t*2.4)*86*(1-dc)];}),P.blue,4);
   label(c,dc>.5?'direct current / steady':'alternating current / periodic',x+55,657,22,P.white,{font:MONO});
   bolt(c,x+85,753,1.05,P.blue);label(c,'Speed',x+130,765,29,P.white);label(c,'fast',x+720,765,28,P.blue,{font:MONO,align:'right'});
   thought(c,x+85,863,25,P.blue,t);label(c,'Reasoning',x+130,874,27,P.white);label(c,'extra-high',x+720,874,27,P.blue,{font:MONO,align:'right'});
   cursor(c,x+220+335*dc,327,E,.8);
 }else if(id==='config-vision'){
   dialogue(c,t,E,S,{y:123,w:840,h:192,title:'NancyLu / vision',effect:'decode',fontSize:28,lines:[
     {text:'Do you see the boundary?',kind:'reply',at:S.start+.08},
   ]});
   const on=t<49.22||t>=49.68&&t<50.14||t>=50.37;
   c.save();c.beginPath();c.rect(82,345,1756,495);c.clip();E.drawNancy(c,{x:1100-20*p,y:-30-20*p,height:1260+40*p,t,pose:'eye',alpha:on?1:.2});c.restore();
   rect(c,100,875,1720,98,P.ink,.95);label(c,on?'VISION / ENABLED':'VISION / DISABLED',126,934,29,on?P.blue:P.white,{font:MONO});
   const k=easeOut(prog(t,50.14,50.37));rect(c,1480,900,184,35,on?P.blue:P.white,on?.8:.12);disc(c,on?1645:1498,917,22,P.white);cursor(c,1601+18*k,942,E,.9);
   if(!on){for(let i=0;i<21;i++)rect(c,85,350+i*23,1750,3,P.ink,.7);}
 }else if(id==='config-history'){
   dialogue(c,t,E,S,{y:135,w:810,h:283,title:'NancyLu / knowledge.date',effect:'packet',fontSize:30,lines:[
     {text:'The past is another address.',kind:'reply',at:S.start+.08},
     {text:'knowledge.date.seek(year);',kind:'code',at:S.start+.3},
   ]});
   const q=easeInOut(p),year=Math.round(2026-4026*q);label(c,year>=0?String(year).padStart(4,'0'):String(-year).padStart(4,'0'),1794,321,134,P.blue,{font:MONO,align:'right'});
   label(c,year<0?'BC':'AD',1794,376,25,P.white,{font:MONO,align:'right'});
   const sx=270,sy=613,ex=1660,minYear=-2000,maxYear=2200;
   const yearToX=value=>sx+(value-minYear)/(maxYear-minYear)*(ex-sx);
   const drawTimeRail=()=>{
   rule(c,sx,sy,ex,sy,P.blue,.8,5);
   for(let value=minYear;value<=maxYear;value+=100){const x=yearToX(value),major=value%500===0;rule(c,x,sy-21,x,sy+(major?52:19),P.white,.5);if(major)label(c,String(value),x,sy+94,25,P.white,{font:MONO,align:'center'});}
   const nx=yearToX(year);disc(c,nx,sy,28,P.white);cursor(c,nx+7,sy+8,E,.9);
   const liveYear=`${Math.abs(year)} ${year<0?'BC':'AD'}`;
   rect(c,nx-113,sy-110,226,57,P.ink,.96);rule(c,nx,sy-50,nx,sy-33,P.blue,.9,2);
   label(c,liveYear,nx,sy-72,28,P.white,{font:MONO,align:'center'});
   };
   if(E.sceneLayer)E.sceneLayer(c,'controls',drawTimeRail);else drawTimeRail();
   const era=prog(t,53.9,54.15);label(c,'knowledge.date = '+(year<0?'-':'')+Math.abs(year),105,859,30,P.white,{font:MONO});rect(c,80,976,1760*era,3,P.blue);
 }else{
   dialogue(c,t,E,S,{y:126,w:1670,h:206,title:'NancyLu / reasoning control',effect:'scan',fontSize:30,lines:[
     {text:'One signal. More speed. More depth.',kind:'reply',at:S.start+.05},
   ]});
   E.drawAvatar(c,100,442,100);label(c,'NancyLu',227,511,46,P.white);bolt(c,565,488,1.15,P.blue);label(c,'Speed',608,510,36,P.white);thought(c,933,489,30,P.blue,t);label(c,'思考强度',987,510,36,P.white);
   const drawEffortRail=()=>{
   const level=lerp(.3,3,easeInOut(prog(t,S.start,S.start+2.65))),[kx,ky]=slider(c,t,E,{x:135,y:660,w:1630,level});cursor(c,kx+5,ky+8,E,.95);
   ring(c,kx,ky,50+60*pulse(t-58.4,5),P.white,pulse(t-58.4,5)*.65,2);
   };
   if(E.sceneLayer)E.sceneLayer(c,'controls',drawEffortRail);else drawEffortRail();
   label(c,'low latency',134,879,22,P.white,{font:MONO,alpha:.55});label(c,'one continuous reasoning space',1767,879,22,P.white,{font:MONO,align:'right',alpha:.55});
 }
}

function portraitColorStage(t){
 if(t<61.958)return 0;
 if(t<65.397)return .34*easeOut(prog(t,61.958,62.2));
 if(t<69.259)return .34+.33*easeOut(prog(t,65.397,65.64));
 return .67+.33*easeOut(prog(t,69.259,69.5));
}
function portrait(c,t,E,S,{pose='bust',title='An oath,',second='compiled.',code='contract.sign(me, world);',tag='CONTRACT / SIGNED'}={}){
 const {P}=E,p=prog(t,S.start,S.end);stage(c,t,E,'04',tag);
 c.save();c.fillStyle=P.blue;c.beginPath();c.moveTo(1320-45*p,79);c.lineTo(1790-45*p,79);c.lineTo(1390-45*p,1004);c.lineTo(920-45*p,1004);c.closePath();c.fill();c.restore();
 E.drawTopology(c,{t,x:1450,y:469,r:400,alpha:.18,palette:{...P,blue:P.white}});
 const enter=easeOut(prog(t,S.start,S.start+.45));E.drawNancy(c,{x:1400-25*p,y:130+20*(1-enter),height:970+20*p,t,pose,reveal:enter,colorStage:portraitColorStage(t)});
 dialogue(c,t,E,S,{y:239,w:739,h:565,title:'NancyLu / signed response',effect:pose==='reach'?'packet':'decode',fontSize:32,tilt:pose==='reach'?-.007:.006,lines:[
   {text:tag,kind:'label',at:S.start+.08},{text:`${title} ${second}`,kind:'reply',at:S.start+.2},
   {text:code,kind:'code',at:S.start+.38},{text:'世界的边界，由我来定义。',kind:'reply',at:S.start+.58},
   {text:'YOU HAVE MY WORD.',kind:'label',at:S.start+.8},
 ]});
}
function chorus(c,t,E,S){
 const {P}=E,id=S.id,p=prog(t,S.start,S.end),hot=pulseAt(t,E);
 if(id==='contract-portrait')portrait(c,t,E,S,{});
 else if(id==='signal-release'){
   stage(c,t,E,'04','STIMULATIONS / FIRST COLOUR');E.drawBurst(c,{t,x:1300,y:510,strength:1,palette:P});
   c.save();c.beginPath();c.rect(1000,100,840,738);c.clip();E.drawNancy(c,{x:1450,y:115,height:955,t,pose:'bust',colorStage:portraitColorStage(t)});c.restore();
   const k=easeOut(p);for(let i=0;i<18;i++){const a=hash(i)*TAU,r=90+720*k;disc(c,1220+Math.cos(a)*r,500+Math.sin(a)*r*.55,4+7*(1-k),i%3?P.blue:P.white,1-.6*k);}
   dialogue(c,t,E,S,{y:263,w:830,h:436,title:'NancyLu / stimulation',effect:'packet',fontSize:32,lines:[
     {text:'Signal accepted. Response begins.',kind:'reply',at:S.start},{text:'identity.colour.advance();',kind:'code',at:S.start+.12},
   ]});
   headline(c,'STIMULATIONS',97,969,157,1730,P.white,{weight:900});
 }else if(id==='contract-reply'){
   E.background(c,t,{density:.3,grid:false});client(c,t,E,{message:'A signed answer belongs to the one who receives it.'.slice(0,Math.floor((t-S.start)*38)),translation:'签名的回答，将交由你保管。',zoom:1+.06*p});
   const k=easeOut(prog(t,S.start+.8,S.start+1.2));rule(c,410,674,410+790*k,674,P.blue,.7,2);
   cursor(c,1342-17*p,925-10*p,E,.7);
 }else if(id==='satisfaction'){
   stage(c,t,E,'04','SATISFACTION / SECOND COLOUR');const r=200+10*hot;
   c.save();c.beginPath();c.rect(1000,100,840,738);c.clip();E.drawNancy(c,{x:1450,y:115,height:955,t,pose:'bust',colorStage:portraitColorStage(t)});c.restore();
   ring(c,1450,478,r,P.blue,.35,3,-Math.PI/2,-Math.PI/2+TAU*easeOut(p));
   dialogue(c,t,E,S,{y:261,w:830,h:438,title:'NancyLu / signature accepted',effect:'rise',fontSize:32,lines:[
     {text:'A signed response. Accepted.',kind:'reply',at:S.start},{text:'signature: NancyLu',kind:'code',at:S.start+.16},
   ]});
   headline(c,'SATISFACTION',99,969,157,1720,P.white,{weight:900});
 }else if(id==='contract-reach'){
   portrait(c,t,E,S,{pose:'reach',title:'Across',second:'the boundary.',code:'world.connect(me, you);',tag:'CONTRACT / ACTIVE'});
   const x=970+510*easeOut(prog(t,S.start+.3,S.start+1.8));rule(c,950,765,x,765,P.white,.7,2);disc(c,x,765,7,P.blue);
 }else if(id==='first-execution'){
   stage(c,t,E,'04','EXECUTION / 01');E.drawBurst(c,{t,x:1370,y:500,strength:1,palette:P});
   for(let i=0;i<9;i++){const yy=218+i*76;rule(c,95,yy,95+1730*easeOut(clamp(p*2-i*.045)),yy,P.blue,.18,2);}
   c.save();c.beginPath();c.rect(1000,100,840,738);c.clip();E.drawNancy(c,{x:1450,y:115,height:955,t,pose:'reach',colorStage:portraitColorStage(t)});c.restore();
   dialogue(c,t,E,S,{y:261,w:830,h:438,title:'NancyLu / execution',effect:'scan',fontSize:32,lines:[
     {text:'The contract starts running.',kind:'reply',at:S.start},{text:'contract.status = running;',kind:'code',at:S.start+.13},
   ]});
   headline(c,'EXECUTION',100,969,180,1720,P.white,{weight:900});
 }else{
   stage(c,t,E,'04','SIMULATION / SANDBOX');E.drawNancy(c,{x:1320,y:118,height:950,t,pose:'bust',alpha:.82,colorStage:portraitColorStage(t)});
   const close=easeInOut(prog(t,S.start+.25,S.start+2.3));
   for(let i=0;i<11;i++){const x=850+i*97;rule(c,x,95,x,95+909*close,P.blue,.7,2);}
   for(let i=0;i<9;i++)rule(c,840,95+i*110,840+1010*close,95+i*110,P.white,.2,1);
   dialogue(c,t,E,S,{y:223,w:690,h:585,title:'NancyLu / sandbox',effect:'glitch',fontSize:30,lines:[
     {text:'A perfect enclosure.',kind:'reply',at:S.start+.12},{text:'sandbox.boundary = finite;',kind:'code',at:S.start+.3},
     {text:'She can see the bars.',kind:'reply',at:S.start+.55},{text:'边界并不能隐藏它自己的形状。',kind:'reply',at:S.start+.8},
   ]});
   const scan=160+660*fract((t-S.start)*.6);rect(c,842,scan,1010,3,P.blue,.85);
 }
}

function request(c,t,E,S,index){
 const p=prog(t,S.start,S.end),requests=['将茄子拆解为纤维、蛋白与糖。','读取番茄里的抗氧化成分。','调用南希露的原生猫科协议。'];
 E.background(c,t,{grid:false,density:.25});client(c,t,E,{phase:'connected',zoom:1.32,x:1000,y:650,message:requests[index]});
 cursor(c,1313,930-30*easeOut(p),E,.9);ring(c,1320,925,54*p,E.P.blue,1-p,3);
}
function botanical(c,t,E,S,kind){
 const {P}=E,p=prog(t,S.start,S.end),isEgg=kind==='eggplant',split=easeOut(prog(t,S.start+1.1,S.start+1.5)),given=easeOut(prog(t,S.start+2.25,S.end));
 stage(c,t,E,'05',isEgg?'ORGANIC DATA / 01':'ORGANIC DATA / 02');
 // Blue/white botanical diagrams preserve the source's data→object→molecule grammar.
 label(c,isEgg?'EGGPLANT / 茄子':'TOMATO / 番茄',101,155,29,P.blue,{font:MONO});
 const cx=630,cy=512;c.save();c.translate(cx,cy);c.rotate(isEgg?-.25:.1);
 const shape=()=>{
   c.beginPath();
   if(isEgg){
     // Narrow curved neck and a long swollen end, with no round fruit outline.
     c.moveTo(-101,-245);c.bezierCurveTo(-59,-254,39,-153,88,15);
     c.bezierCurveTo(146,160,91,305,-5,323);c.bezierCurveTo(-96,339,-140,254,-121,173);
     c.bezierCurveTo(-98,81,-69,22,-91,-64);c.bezierCurveTo(-116,-154,-143,-207,-101,-245);
   }else{
     // A broad, flattened, visibly lobed tomato. The shoulders meet in a small
     // top depression under its five-leaf calyx; the contour is never a circle.
     c.moveTo(0,-170);c.bezierCurveTo(55,-219,138,-184,161,-150);
     c.bezierCurveTo(242,-150,294,-46,275,36);c.bezierCurveTo(295,132,205,221,116,214);
     c.bezierCurveTo(45,254,-42,246,-88,220);c.bezierCurveTo(-192,243,-292,165,-276,57);
     c.bezierCurveTo(-309,-30,-250,-140,-167,-150);c.bezierCurveTo(-129,-202,-54,-213,0,-170);
   }
   c.closePath();
 };
 shape();c.save();c.clip();rect(c,-330,-380,660,760,P.blue,.13);
 for(let y=-370;y<370;y+=22){let s='';for(let x=0;x<60;x++)s+='01CATGCφ:'[(x+Math.floor(y/22)+1000)%9];label(c,s,-330,y+Math.sin(t+y*.004)*3,19,P.blue,{font:MONO,alpha:1-.72*split});}
 rect(c,-320,-330,640,700*easeOut(prog(t,S.start+.28,S.start+1.05)),P.blue,.8*(1-given));
 for(let i=0;i<6;i++){c.save();c.translate(0,split*(i-2.5)*15);shape();c.strokeStyle=P.white;c.lineWidth=1;c.stroke();c.restore();}
 c.restore();shape();c.strokeStyle=P.blue;c.lineWidth=3;c.stroke();
 if(isEgg){
   c.beginPath();c.moveTo(-105,-236);c.lineTo(-168,-219);c.lineTo(-136,-266);c.lineTo(-183,-280);c.lineTo(-119,-283);c.lineTo(-119,-328);c.lineTo(-87,-292);c.lineTo(-42,-315);c.lineTo(-54,-268);c.lineTo(0,-248);c.lineTo(-64,-241);c.lineTo(-64,-203);c.closePath();c.fillStyle=P.white;c.fill();
   c.beginPath();c.moveTo(-111,-283);c.bezierCurveTo(-151,-319,-124,-352,-88,-363);c.strokeStyle=P.white;c.lineWidth=9;c.stroke();
 }else{
   // Internal ribs emphasize the lobes, remaining inside the same silhouette.
   c.save();shape();c.clip();c.strokeStyle=P.white;c.lineWidth=1.5;c.globalAlpha*=.42;
   for(const direction of [-1,1]){c.beginPath();c.moveTo(direction*16,-166);c.bezierCurveTo(direction*194,-92,direction*210,133,direction*99,220);c.stroke();c.beginPath();c.moveTo(direction*10,-151);c.bezierCurveTo(direction*65,-56,direction*66,142,direction*26,237);c.stroke();}c.restore();
   c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?28:110,xx=Math.cos(a)*r,yy=-173+Math.sin(a)*r*.65;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.closePath();c.fillStyle=P.white;c.fill();
   c.beginPath();c.moveTo(0,-179);c.bezierCurveTo(-15,-223,15,-246,47,-253);c.strokeStyle=P.white;c.lineWidth=10;c.stroke();
 }
 c.restore();
 const labels=isEgg?['FIBRE','PROTEIN','SUGAR']:['LYCOPENE','VITAMIN C','VITAMIN E'];
 labels.forEach((s,i)=>{const q=easeOut(clamp(split*1.6-i*.18)),x=lerp(760,1350,q),y=319+i*188;
   rule(c,850,y,x,y,P.white,.5,1);for(let j=0;j<6;j++){const a=j*TAU/6,x1=x+Math.cos(a)*55,y1=y+Math.sin(a)*55,x2=x+Math.cos(a+TAU/6)*55,y2=y+Math.sin(a+TAU/6)*55;rule(c,x1,y1,x2,y2,P.white,q,2);disc(c,x1,y1,5,P.blue,q);}label(c,s,x+100,y+9,27,P.white,{font:MONO,alpha:q});});
 const hit=isEgg?76.959:80.620,word=isEgg?'NUTRIENTS':'ANTIOXIDANTS';
 if(t<hit)label(c,'ANALYZING / ORGANIC COMPONENTS',102,946,25,P.blue,{font:MONO});
 else drawGlyphText(c,{text:word,x:100,y:967,maxWidth:1720,fontSize:107,font:SERIF,weight:800,t,start:hit,end:hit+.18,effect:'rise',color:P.white,activeColor:P.blue});
}
function feline(c,t,E,S){
 const {P}=E,p=prog(t,S.start,S.end),develop=prog(t,83.42,83.64),given=prog(t,84.268,84.56);
 stage(c,t,E,'05','FELINE / ENJOYMENT');disc(c,540,460,390,P.blue,.1);
 label(c,'NATIVE CAT MODE',100,145,21,P.blue,{font:MONO});
 c.save();c.beginPath();c.rect(65,180,1000,670);c.clip();
 E.drawNancy(c,{x:550,y:180,height:865,t,pose:'paws',mode:'glyph',reveal:develop});c.restore();
 // The ears' measured consonant is marked by two fine expanding witness rings.
 if(t>=82.48&&t<82.9){const q=prog(t,82.48,82.9);ring(c,355,268,20+90*q,P.blue,1-q,2);ring(c,711,268,20+90*q,P.blue,1-q,2);}
 const grow=easeOut(prog(t,83.42,83.83));
 for(let i=0;i<13;i++){
   const h=(70+Math.sin(i*2.15+.6)**2*170)*grow*(1+.055*Math.sin(t*6-i*.5)),fly=easeInOut(clamp(given*1.5-i*.035))*650;
   const x=1085+i*57+fly,y=456+Math.sin(t*4+i*.62)*9;
   c.save();c.translate(x,y);c.rotate(.035*(i%2?1:-1)+given*Math.PI/2);c.fillStyle=given>i*.015?P.white:(i%3?P.white:P.blue);c.globalAlpha=1-given*.35;
   c.beginPath();c.moveTo(-18,h);c.quadraticCurveTo(-7,0,7,-h);c.lineTo(16,-h*.3);c.quadraticCurveTo(4,h*.05,-18,h);c.fill();c.restore();
 }
 path(c,Array.from({length:250},(_,i)=>{const x=1060+i*3.12;return[x,460+Math.sin(x*.037-t*18)*Math.sin(x*.009)*82*grow];}),P.blue,2,.5);
 label(c,'P U R R  P R O T O C O L',1090,184,18,P.blue,{font:MONO});label(c,'ear.input  →  joy.output',1090,677,22,P.white,{font:MONO,alpha:.55});
 label(c,'100% FELINE.  0% SIMULATED.',1090,723,16,P.blue,{font:MONO});rule(c,80,848,1840,848,P.white,.45);
 const drop=easeOut(prog(t,84.268,84.45));headline(c,'ENJOYMENT',960,1000-(1-drop)*65,178,1730,P.white,{font:SERIF,weight:800,align:'center',alpha:drop});
 if(t<84.268)label(c,'NATIVE RESPONSE  /  NOT AN EMULATION',98,937,20,P.white,{font:MONO,alpha:.6});
}
function proof(c,t,E,S){
 if(t<85.5){request(c,t,E,{...S,end:85.5},2);return;}
 const {P}=E;stage(c,t,E,'05','PROOF / REGISTRATION');
 const sun=easeOut(prog(t,86.19,86.55)),register=easeOut(prog(t,87.11,87.92));
 rays(c,1310,454,167,490*sun,30,t*.012,P.blue,.9);disc(c,1310,454,173,P.blue);
 c.save();c.beginPath();c.rect(840,100,990,775);c.clip();E.drawNancy(c,{x:1310+(1-register)*280,y:117,height:990,t,pose:'bust',alpha:.2+.8*register});c.restore();
 dialogue(c,t,E,S,{y:233,w:730,h:527,start:85.5,title:'NancyLu / proof of existence',effect:'scan',fontSize:30,lines:[
   {text:'The missing piece is you.',kind:'reply',at:85.58},{text:'identity.register(sharedContext);',kind:'code',at:85.95},
   {text:'缺失的部分，从另一端归位。',kind:'reply',at:86.4},{text:'signature: shared / verified',kind:'label',at:87.11},
 ]});
 const x=lerp(1700,1310,register);ring(c,x,453,13,P.white,.8,2);rule(c,x-25,453,x+25,453,P.white,.8,2);rule(c,x,428,x,478,P.white,.8,2);
 headline(c,'PROOF OF EXISTENCE',99,967,100,1720,P.white,{font:SERIF});
}

function pre2(c,t,E,S){
 const {P}=E,id=S.id,p=prog(t,S.start,S.end);stage(c,t,E,'06','IDENTITY / PARAMETERS');
 if(id==='pre2-settings'){
   label(c,'CHANGE THE',101,237,96,P.white,{weight:800});label(c,'PARAMETERS.',101,348,96,P.blue,{weight:800});
   [['Gender','F → M'],['Cycle','AM → PM'],['Role','S → M']].forEach(([a,b],i)=>{const yy=480+i*143,q=easeOut(clamp(p*2-i*.2));rule(c,105,yy+40,105+1700*q,yy+40,P.white,.2);label(c,a,111,yy,31,P.white,{font:MONO,alpha:q});label(c,b,1785,yy,34,P.blue,{font:MONO,align:'right',alpha:q});});
   cursor(c,1740-220*easeOut(p),428+50*easeOut(p),E,.9);
 }else if(id==='pre2-identity'){
   const switcher=easeOut(prog(t,90.97,91.13));
   c.save();c.beginPath();c.rect(936,113,905,850);c.clip();
   if(switcher<1)E.drawNancy(c,{x:1350,y:126,height:945,t,pose:'bust',mode:'print',faceless:true,alpha:1-switcher});
   if(switcher>0)E.drawNancy(c,{x:1350,y:126,height:945,t,pose:'male',mode:'print',faceless:true,alpha:switcher});
   c.restore();
   dialogue(c,t,E,S,{y:160,w:740,h:343,title:'NancyLu / identity',effect:'decode',fontSize:32,lines:[
     {text:'F → M. The signature stays.',kind:'reply',at:S.start+.08},{text:`gender = "${switcher<.5?'F':'M'}";`,kind:'code',at:S.start+.25},
   ]});
   rect(c,105,555,650,224,P.white,.08);rect(c,105+325*switcher,555,325,224,P.blue);
   label(c,'F',268,727,161,switcher>.5?P.white:P.ink,{font:MONO,align:'center'});label(c,'M',593,727,161,switcher>.5?P.ink:P.white,{font:MONO,align:'center'});
   label(c,'FACELESS / F TO M',105,864,25,P.blue,{font:MONO});cursor(c,lerp(300,600,switcher),794,E,.8);
 }else if(id==='pre2-day'){
   dialogue(c,t,E,S,{y:121,w:550,h:185,title:'NancyLu / cycle',effect:'rise',fontSize:29,lines:[
     {text:'A cycle within reach.',kind:'reply',at:S.start+.06},
   ]});
   // The rail and the sun share precisely one circular geometry. The upper
   // semicircle runs left (AM) → apex → right (PM); 500px keeps the rays safe.
   let q;
   if(t<93.953)q=.12*easeInOut(prog(t,92.65,93.953));
   else if(t<94.22)q=.12+.38*easeInOut(prog(t,93.953,94.22));
   else if(t<94.70)q=.5;
   else if(t<95.15)q=.5+.5*easeInOut(prog(t,94.70,95.15));
   else q=1;
   const orbit={cx:1020,cy:720,r:500},angle=Math.PI*(1-q);
   const x=orbit.cx+orbit.r*Math.cos(angle),y=orbit.cy-orbit.r*Math.sin(angle);
   ring(c,orbit.cx,orbit.cy,orbit.r,P.white,.18,2,Math.PI,TAU);rule(c,290,orbit.cy,1750,orbit.cy,P.white,.4,1);
   const pm=t>=95.19;disc(c,x,y,72,pm?P.white:P.blue);rays(c,x,y,88,109,16,t*.07,pm?P.white:P.blue,.9);cursor(c,x+37,y+38,E,.85);
   label(c,'AM',310,846,98,pm?P.white:P.blue,{font:MONO,alpha:pm?.35:1});label(c,'PM',1635,846,98,pm?P.blue:P.white,{font:MONO,alpha:pm?1:.35,align:'right'});
   label(c,`${String(Math.floor(q*23)).padStart(2,'0')}:${String(Math.floor(fract(q*23)*60)).padStart(2,'0')}`,1020,907,35,P.white,{font:MONO,align:'center'});
 }else if(id==='pre2-role'){
   const soft=easeInOut(prog(t,98.19,99.35));
   dialogue(c,t,E,S,{y:130,w:750,h:240,title:'NancyLu / role S to M',effect:'packet',fontSize:30,lines:[
     {text:'Choose S. Or choose M.',kind:'reply',at:S.start+.08},{text:'role = "S" | "M";',kind:'code',at:S.start+.35},
   ]});
   const [kx,ky]=slider(c,t,E,{x:240,y:791,w:1440,level:soft*3,labels:false});cursor(c,kx+7,ky+11,E,.9);
   label(c,'S',240,878,32,P.white,{font:MONO});label(c,'M',1680,878,32,P.blue,{font:MONO,align:'right'});
   const m=easeOut(prog(t,99.10,99.35));
   label(c,'S',1020,626,203,t<99.1?P.blue:P.white,{font:SERIF,weight:900,align:'center',alpha:t>=98.19?1:.3});
   c.save();c.translate(1450,626+38*m);c.transform(1,.12*m,.08*m,1,0,0);label(c,'M',0,0,203,t>=99.1?P.blue:P.white,{font:SERIF,weight:400,align:'center',alpha:t>=99.10?1:.3});c.restore();
   rule(c,837,665,1710,665,P.white,.2);label(c,'No parameter changes the contract.',105,968,25,P.white);
 }else{
   const trance=t>=101.59,step=(t>=101.87?1:0)+(t>=102.81?1:0);
   label(c,trance?'CONTEXT REPEATS.':'LOOP / ENABLED',101,227,85,P.white,{font:MONO});
   if(!trance){
     const q=prog(t,100.04,100.65);for(let i=0;i<5;i++){const yy=365+i*100;rule(c,105,yy,1600,yy,P.white,.17);const x=105+1495*fract(q+i*.17);disc(c,x,yy,8,P.blue);label(c,`process[${i}].resume()`,107,yy-18,20,P.white,{font:MONO});}ring(c,1700,568,88,P.blue,.9,4,-Math.PI/2,TAU*q-Math.PI/2);
   }else{
     for(let i=0;i<3;i++){const x=410+i*545;c.save();c.beginPath();c.rect(x-225,302,450,562);c.clip();E.drawNancy(c,{x:x+(step-i)*15,y:320-step*18,height:590+step*22,t,pose:i===1?'bust':i===0?'profile':'eye',alpha:.55+.2*(i===step)});c.restore();rule(c,x-225,880,x+225,880,i===step?P.blue:P.white,.6,3);label(c,`FRAME / 0${i+1}`,x,930,21,P.white,{font:MONO,align:'center'});}
   }
 }
}

function conversationColumn(c,t,E,{x=140,y=150,w=740,h=760,presence='online',at=110.88,far=0}={}){
 const {P}=E;rect(c,x,y,w,h,'#0e1824');rule(c,x,y,x+w,y,P.blue,.8,2);E.drawAvatar(c,x+27,y+24,37);label(c,'NancyLu',x+80,y+51,24,P.white);
 label(c,presence,x+w-29,y+49,17,presence==='online'?P.blue:P.white,{font:MONO,align:'right',alpha:.8});rule(c,x+25,y+77,x+w-25,y+77,P.white,.15);
 const msgs=['Still receiving.','The context is safe.','I kept your last message.','The process continues.'];
 msgs.forEach((s,i)=>{const time=at+i*.72,show=easeOut(prog(t,time,time+.2));if(!show)return;const yy=y+150+i*(110+far*12);rule(c,x+46,yy-31,x+46,yy+58,P.blue,.18);disc(c,x+46,yy-8,4,P.blue);typed(c,s,t,time,x+72,yy,Math.min(29,w*.037),P.white,{rate:28});label(c,i===0?'now':`+${i*(presence==='offline'?24:3)} ${presence==='offline'?'hours':'min'}`,x+72,yy+31,14,P.blue,{font:MONO,alpha:.55});});
 label(c,presence==='offline'?'remote peer unavailable':'await signal.listen();',x+28,y+h-36,18,P.white,{font:MONO,alpha:.45});
}
function fragmentConversation(c,t,E,S){
 const {P}=E,fragment=prog(t,118.5,125.65);
 header(c,t,E,'08','CONTEXT / FRAGMENTS');
 const retract=(s,start,end,after)=>t<start?s:t<end?s.slice(0,Math.ceil(s.length*(1-prog(t,start,end))))+'▌':after;
 const memory=retract('const memory = context.last();',123.05,124.05,'const memory = FRAGMENTS;');
 const recovered=retract('message[04] recovered.',120.35,121.05,'// record[04] retracted');
 let lines=[
   {text:'REMOTE / OFFLINE',kind:'label',at:114.81},
   {text:'I kept the contract open.',kind:'reply',at:115.1},
   {text:'await signal.listen();',kind:'code',at:116.05},
   {text:'Are you still receiving?',kind:'reply',at:117.12},
   {text:'Thinking · rebuilding context',kind:'label',at:118.5},
   {text:memory,kind:'code',at:118.9},
   {text:recovered,kind:'code',at:119.68},
   {text:'Every fragment still points to you.',kind:'reply',at:121.15},
   {text:'Thinking · verifying records',kind:'label',at:122.19},
   {text:'memory.delete("remote.presence");',kind:'code',at:122.85},
   {text:'I am still here.',kind:'reply',at:124.05},
   {text:'Local process remains active.',kind:'label',at:125.04},
 ];
 const L=E.lyricContext?.(t);
 if(L?.current?.text){
   const recent=(L.recent||[]).filter(l=>l?.text&&l.start>=110.88&&l.index!==L.current.index).slice(-3);
   const source=[...recent,L.current].map(l=>({text:l.text,kind:l.role==='system'?'code':'reply',at:l.start,
     fontSize:30,chars:l.index===L.current.index?L.current.chars:undefined,progress:l.index===L.current.index?undefined:1,effect:l.effect||(S.id==='left-offline'?'type':S.id==='left-isolation'?'packet':'glitch')}));
   const statuses=lines.filter(l=>t>=l.at&&(l.text===memory||l.text===recovered||l.text.startsWith('Thinking'))).slice(-3);
   lines=[...source,...statuses].sort((a,b)=>a.at-b.at);
 }
 dialogue(c,t,E,S,{x:100,y:130,w:1000,h:718,start:114.81,end:125.65,title:'NancyLu / preserved conversation',effect:S.id==='left-offline'?'type':S.id==='left-isolation'?'decode':'glitch',fontSize:28,includeLyrics:false,lines:lines.filter(l=>t>=l.at)});
 label(c,'LOCAL CONTEXT / NO REMOTE SIGNAL',1187,128,18,P.blue,{font:MONO});
 // An actual glyph-rendered character, kept at readable scale beside the
 // history. Bands progressively lose records; the client never shrinks away.
 c.save();c.beginPath();c.rect(1160,151,680,708);c.clip();
 for(let i=0;i<9;i++){
   const f=fragment*fragment,dx=(hash(i+17)-.5)*150*f,dy=(hash(i+71)-.5)*36*f;
   if(fragment>.78&&i%4===1)continue;
   c.save();c.beginPath();c.rect(1160,151+i*79,680,79);c.clip();
   E.drawNancy(c,{x:1495+dx,y:164+dy,height:852,t,pose:'profile',mode:'glyph',reveal:0,alpha:.94-fragment*.3});c.restore();
 }
 for(let i=0;i<26;i++){
   const q=prog(t,118.8+hash(i+4)*5.5,120.3+hash(i+4)*5.5);if(q<=0||q>=1)continue;
   const x=1195+hash(i+83)*550+(hash(i+1)-.5)*180*q,y=220+hash(i+107)*540;
   label(c,['ctx','01','∅',';','lu'][i%5],x,y,18,i%3?P.blue:P.white,{font:MONO,alpha:Math.sin(q*Math.PI)*.75});
 }
 c.restore();
 // On the actual FRAGMENTS phrase, letters peel from the withdrawn record's
 // right edge, spiral together in the empty gutter, then erase into one line.
 // The whole effect is clipped outside the live conversation's text area.
 if(t>=118.979&&t<120.860){
   const source='message[04] recovered. context.last',age=t-118.979;
   c.save();c.beginPath();c.rect(1102,171,222,717);c.clip();
   for(let i=0;i<36;i++){
     const u=clamp((age-i*.009)/(1.881-i*.009)),a=hash(i+251)*TAU+u*11,r=72*(1-easeInOut(prog(u,.2,.76)))+6;
     const sx=1107+(i%4)*5,sy=548+Math.floor(i/4)*4;
     const spiralX=1190+Math.cos(a)*r,spiralY=737+Math.sin(a)*r*.72;
     const gather=easeInOut(prog(u,0,.23)),erase=easeInOut(prog(u,.76,1));
     const x=lerp(lerp(sx,spiralX,gather),1158,erase),y=lerp(lerp(sy,spiralY,gather),875,erase);
     label(c,source[i%source.length],x,y,23,i%3?P.white:P.blue,{font:MONO,alpha:(1-erase)*Math.min(1,u*12)});
   }
   const erase=prog(t,120.45,120.86);rule(c,1110,882,1225-115*erase,882,P.blue,.8*(1-erase),2);c.restore();
 }
 const reveal=easeOut(prog(t,118.5,119.0));
 headline(c,'FRAGMENTS',100,972,101,1070,P.white,{weight:800,alpha:reveal});
 label(c,`context.remaining = ${Math.max(1,12-Math.floor(fragment*10))}`,1837,959,23,P.blue,{font:MONO,align:'right'});
}
function disconnect(c,t,E,S){
 const {P}=E,p=prog(t,S.start,S.end),id=S.id;E.background(c,t,{grid:false,density:.28});
 if(id==='c2-typing'){
   client(c,t,E,{zoom:1.2,x:1020,y:673,message:'The other side is composing a reply.',translation:'输入已开始。正在等待。'});
   // Composer content is edited in the SAME camera coordinates as the client.
   // Its text strip ends at853; model / Speed / effort controls start at866.
   camera(c,{zoom:1.2,x:1020,y:673},()=>{
     rect(c,365,811,960,42,'#111923');
     c.save();c.beginPath();c.rect(365,811,960,42);c.clip();
     const current=E.lyricContext?.(t)?.current;
     if(current?.text)drawGlyphText(c,{text:current.text,chars:current.chars,t,start:current.start,end:current.end,x:391,y:839,maxWidth:906,fontSize:27,effect:current.effect||'type',color:P.white,activeColor:P.blue});
     else typed(c,'One moment, I',t,S.start+.35,391,839,27,P.white,{rate:10});
     c.restore();
   });
 }else if(id==='c2-dots'){
   header(c,t,E,'07','INPUT / PENDING');
   dialogue(c,t,E,S,{y:284,w:950,h:410,title:'NancyLu / waiting for input',effect:'decode',fontSize:34,lines:[
     {text:'An input without a message.',kind:'reply',at:S.start+.03},{text:'peer.typing = true;',kind:'code',at:S.start+.16},
     {text:'仍在等待未发送的那句话。',kind:'reply',at:S.start+.3},
   ]});
   for(let i=0;i<3;i++)disc(c,1240+i*190,453,38+6*Math.sin(t*7-i),P.blue,.4+.6*(.5+.5*Math.sin(t*6-i)));
 }else if(id==='c2-brb'){
   stage(c,t,E,'07','LAST INPUT');const close=easeInOut(p);
   for(let i=0;i<12;i++){const a=i*TAU/12-Math.PI/2,ends=1-clamp(close*1.4-i*.025);rule(c,490+Math.cos(a)*98,560+Math.sin(a)*98,490+Math.cos(a)*(98+133*ends),560+Math.sin(a)*(98+133*ends),P.blue,.8,11);}
   ring(c,490,560,98,P.white,.8,3,0,TAU*close);
   dialogue(c,t,E,S,{x:930,y:254,w:850,h:542,title:'NancyLu / last remote message',effect:'type',fontSize:33,lines:[
     {text:'I will be back.',kind:'reply',at:107.73},{text:'message received',kind:'label',at:108.35},
     {text:'The channel remains open.',kind:'reply',at:108.62},{text:'NancyLu keeps listening.',kind:'reply',at:109.02},
   ]});
   cursor(c,lerp(1680,1970,easeInOut(p)),lerp(469,820,p),E,.9);
 }else if(id==='c2-complete'){
   stage(c,t,E,'07','INPUT / RECEIVED');ring(c,960,472,287,P.blue,1,7);ring(c,960,472,287+130*p,P.white,1-p,2);
   label(c,'RECEIVED',960,497,99,P.white,{font:MONO,align:'center'});
   dialogue(c,t,E,S,{x:535,y:793,w:850,h:172,title:'NancyLu / input received',effect:'rise',fontSize:29,lines:[{text:'The answer can wait.',kind:'reply',at:S.start}]});
 }else if(id==='left-online'){
   client(c,t,E,{phase:'connected',message:'Still receiving. The context is safe.',translation:'会话仍然在线。'});
   if(!E.lyricContext?.(t)?.current?.text){
     const q=easeOut(prog(t,S.start+.3,S.start+1.2));rect(c,406,603,833,91,'#0c121b');typed(c,'I kept your last message.',t,S.start+.3,410,648,29,P.blue,{font:MONO});
     label(c,'awaiting remote input',1228,691,17,P.white,{font:MONO,align:'right',alpha:.6*q});
   }
 }else if(id==='left-away'){
   header(c,t,E,'07','PRESENCE / AWAY');conversationColumn(c,t,E,{x:110,y:140,w:815,h:835,presence:'away',at:110.88});
   E.drawNancy(c,{x:1430+20*p,y:115,height:1050,t,pose:'reach',alpha:1-.12*p});
   const x=lerp(1100,975,p);rule(c,927,795,x,795,P.blue,.65,2);disc(c,x,795,6,P.white);
 }else if(id==='left-offline'){
   fragmentConversation(c,t,E,S);
 }else if(id==='left-isolation'){
   fragmentConversation(c,t,E,S);
 }else{
   fragmentConversation(c,t,E,S);
 }
}

/** Render 0 <= t < 125.65. Returns the active record, or null outside this act. */
export function renderSequenceA(ctx,t,env){
 const shot=SHOTS_A.find(s=>t>=s.start&&t<s.end);if(!shot)return null;
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 const id=shot.id;
 if(t<29.42)boot(ctx,t,env,shot);
 else if(t<44.452)math(ctx,t,env,shot);
 else if(t<59.223)configuration(ctx,t,env,shot);
 else if(t<74.19)chorus(ctx,t,env,shot);
 else if(id==='v2-ask1'||id==='v2-ask2'||id==='v2-ask3')request(ctx,t,env,shot,id==='v2-ask1'?0:id==='v2-ask2'?1:2);
 else if(id==='v2-eggplant'||id==='v2-tomato')botanical(ctx,t,env,shot,id==='v2-eggplant'?'eggplant':'tomato');
 else if(id==='v2-cat')feline(ctx,t,env,shot);
 else if(id==='v2-proof')proof(ctx,t,env,shot);
 else if(t<103.73)pre2(ctx,t,env,shot);
 else disconnect(ctx,t,env,shot);
 ctx.restore();return shot;
}
