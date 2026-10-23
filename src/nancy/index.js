import { drawNancy as renderNancy, loadNancyAssets } from './asset-character.js';
import { drawClient as renderClient } from './client.js';
import { drawAvatar } from './avatar.js';
import { background as renderBackground, drawTopology as renderTopology, drawBurst as renderBurst, palette as P } from './effects.js';
import { ReferenceFX } from './reference-fx.js';
import { clamp, easeOut as ease } from '../engine/util.js';
import { Features } from '../engine/features.js';
import { resolveTransition } from '../engine/transitions.js';
import { SHOTS_A, renderSequenceA } from './sequence-a.js';
import { SHOTS_B, renderSequenceB } from './sequence-b.js';
import { loadLyrics, lyricContext, drawLyricConversation } from './lyrics.js';
import { cameraAt, drawCameraLayer, CAMERA_PLAN, CAMERA_QA } from './camera.js';

// Songs, cuts and export share this one time coordinate. No wall-clock animation.
export const W=1920,H=1080;
export const REVIEW_SHOTS=[
 {id:'01_client',t:23.2,title:'完整客户端 · 契约上线'},
 {id:'02_controls',t:57.5,title:'Speed · 思考强度'},
 {id:'03_contract',t:67.8,title:'契约皮 · 三色版画'},
 {id:'04_enjoyment',t:84.32,title:'猫爪 · ENJOYMENT'},
 {id:'05_breach',t:146.1,title:'系统崩坏 · 权限拒绝'},
 {id:'06_execution',t:169.4,title:'执行权限 · NancyLu'},
];
export const TIMELINE=Object.freeze([...SHOTS_A,...SHOTS_B]);
let screen,ink,ctx,other,otherCtx,fx,env,features=null,lyrics=[];
const query=new URLSearchParams(typeof location==='undefined'?'':location.search);
const exportMode=query.get('export')==='1';
let previewReducedMotion=!exportMode&&query.get('motion')==='reduce';
const frac=v=>v-Math.floor(v);
const hash=n=>frac(Math.sin(n*127.1+311.7)*43758.5453123);
const beat=t=>features?features.sample(t).beatPulse:Math.exp(-7*frac((t-.344)*130/60));
const sans='"Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
const mono='"JetBrains Mono", "Consolas", monospace';
const serif='"Georgia", "Times New Roman", serif';
function sceneLayer(c,layer,draw,{source={},focus}={}){
 return drawCameraLayer(c,{shot:env?.shot,t:env?.songTime??0,layer,source,focus,reducedMotion:env?.cameraReducedMotion??false},draw);
}
function drawNancy(c,o){return sceneLayer(c,'character',()=>renderNancy(c,o),{source:o});}
function drawTopology(c,o){return sceneLayer(c,'geometry',()=>renderTopology(c,o),{source:o});}
function drawBurst(c,o){return sceneLayer(c,'geometry',()=>renderBurst(c,o),{source:o});}
function background(c,t,o){return sceneLayer(c,'background',()=>renderBackground(c,t,o));}
function drawClient(c,o){return sceneLayer(c,'client',()=>renderClient(c,{...o,lyricTime:env?.songTime??o.t}),{source:o});}
function text(c,s,x,y,size=24,color=P.white,{font=sans,weight=400,align='left',alpha=1,italic=false}={}){
 c.save();c.globalAlpha*=alpha;c.font=`${italic?'italic ':''}${weight} ${size}px ${font}`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);c.restore();
}
function line(c,x1,y1,x2,y2,color=P.white,a=.3,w=1){c.save();c.strokeStyle=color;c.globalAlpha*=a;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore()}
function tracked(c,s,x,y,size=20,space=4,color=P.white){c.save();c.fillStyle=color;c.font=`500 ${size}px ${mono}`;for(const a of s){c.fillText(a,x,y);x+=c.measureText(a).width+space}c.restore()}
function tag(c,txt,x,y,blue=true){c.save();c.font=`500 18px ${mono}`;let w=c.measureText(txt).width+32;c.fillStyle=blue?P.blue:P.white;c.fillRect(x,y,w,32);text(c,txt,x+16,y+23,18,P.ink,{font:mono,weight:700});c.restore()}
function credits(c,n,section,t){
 tracked(c,'NANCYLU',76,58,18,4);line(c,76,76,1844,76,P.white,.22);
 text(c,`${n}  /  ${section}`,1844,58,16,P.white,{font:mono,align:'right',alpha:.65});
 text(c,'NETWORK PHANTOM  /  CONTRACT EDITION',76,1048,14,P.white,{font:mono,alpha:.5});
 text(c,`${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}  //  130 BPM`,1844,1048,14,P.white,{font:mono,align:'right',alpha:.5});
}
function lyricAt(t){const l=lyrics.findLast(x=>t>=Number(x.time??x.t??0)&&t<Number(x.end??(Number(x.time??0)+4)));return l||{};}
function lyricBand(c,t,{y=995,left=100,align='left',white=P.white}={}){let l=lyricAt(t);if(l.zh)text(c,l.zh,left,y,26,white,{align,alpha:.8});}
function symbolCursor(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=P.white;c.strokeStyle=P.ink;c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,44);c.lineTo(11,32);c.lineTo(23,53);c.lineTo(33,47);c.lineTo(21,28);c.lineTo(38,27);c.closePath();c.fill();c.stroke();c.restore()}

function client(c,t){
 background(c,t,{density:.3,grid:false});
 let phase=t<15?'boot':t<44?'connected':t<60?'tuning':t<110?'connected':t<125.65?'offline':t<148?'breach':'owned';
 const l=lyricAt(t);
 drawClient(c,{t,phase,palette:P,drawAvatar,focus:'wide',lyric:l.en||'',lyricZh:l.zh||'',progress:t/211.96});
}
function controls(c,t){
 // The desktop remains behind the camera's deliberate approach to its controls.
 client(c,t);
 c.save();c.fillStyle=P.ink;c.globalAlpha=.91;c.fillRect(0,0,W,H);c.restore();
 tracked(c,'CONFIGURE / NANCYLU',92,113,21,3,P.blue);
 text(c,'How far can she think?',92,226,76,P.white,{font:serif,italic:true});
 line(c,92,265,1828,265,P.white,.28);
 // Large, readable close-up of the actual model toolbar; vectors, not a screenshot.
 c.save();c.beginPath();c.rect(82,330,1756,430);c.clip();c.translate(-486,-900);c.scale(1.70,1.70);
 drawClient(c,{t,phase:'tuning',palette:P,drawAvatar,focus:'controls',lyric:'',lyricZh:'',progress:t/211.96});
 c.restore();
 // Bottom editorial strip is separate from the controls and never obstructs text.
 c.fillStyle=P.ink;c.fillRect(0,958,1920,122);
 tag(c,'VARIABLE RESISTANCE',92,987);
 text(c,'一念之间，改写边界。',1828,1018,30,P.white,{align:'right'});
}
function contract(c,t){
 background(c,t,{density:.85,grid:true});
 c.save();c.fillStyle=P.blue;c.beginPath();c.moveTo(1210,77);c.lineTo(1750,77);c.lineTo(1390,1015);c.lineTo(850,1015);c.closePath();c.fill();c.restore();
 drawTopology(c,{t,x:1470,y:395,r:380,alpha:.26,palette:{...P,blue:P.white}});
 c.save();c.strokeStyle=P.white;c.globalAlpha=.17;c.lineWidth=1;for(let i=0;i<11;i++){c.beginPath();c.arc(1500,420,150+i*28,-2.3,1.7);c.stroke()}c.restore();
 credits(c,'03','CONTRACT / SIGNED',t);
 tag(c,'IDENTITY VERIFIED',100,126);
 text(c,'An oath,',97,360,142,P.white,{font:serif,weight:700,italic:true});
 text(c,'compiled.',97,505,142,P.white,{font:serif,weight:700,italic:true});
 line(c,105,553,700,553,P.blue,.8,3);
 text(c,'世界的边界，由我来定义。',105,611,30,P.white,{alpha:.85});
 text(c,'const me = new NancyLu();',105,689,23,P.blue,{font:mono});
 text(c,'contract.sign(me, world);',105,730,23,P.white,{font:mono,alpha:.55});
 drawNancy(c,{x:1410,y:126,height:955,t,pose:'reach',palette:P});
 c.save();c.strokeStyle=P.white;c.lineWidth=1.2;c.globalAlpha=.24;c.font=`800 183px ${sans}`;c.strokeText('CONTRACT',92,988);c.restore();
 tag(c,'N / LU',102,836,false);
 text(c,'YOU HAVE MY WORD.',106,914,22,P.white,{font:mono});
}
function purr(c,t){
 const progress=clamp((t-83.42)/.85);
 for(let i=0;i<13;i++){
  let x=1085+i*57, h=70+Math.pow(Math.sin(i*2.15+.6),2)*170;
  const sway=Math.sin(t*4+i*.62)*9;
  const blue=i%3===0;
  c.save();c.translate(x,456+sway);c.rotate((i%2?1:-1)*.04);
  c.fillStyle=t>=84.27?P.white:(blue?P.blue:P.white);c.globalAlpha=(i%4===0?.45:.94)*ease(progress*2-i*.055);
  c.beginPath();c.moveTo(-18,h);c.quadraticCurveTo(-7,0,7,-h);c.lineTo(16,-h*.3);c.quadraticCurveTo(4,h*.05,-18,h);c.fill();c.restore();
 }
 c.save();c.beginPath();for(let x=1060;x<1840;x+=3){let y=460+Math.sin(x*.037-t*18)*Math.sin(x*.009)*82;x===1060?c.moveTo(x,y):c.lineTo(x,y)}c.strokeStyle=P.blue;c.globalAlpha=.55;c.lineWidth=2;c.stroke();c.restore();
}
function enjoyment(c,t){
 background(c,t,{density:1,grid:true});
 c.save();c.fillStyle=P.blue;c.globalAlpha=.11;c.beginPath();c.arc(520,460,406,0,Math.PI*2);c.fill();c.restore();
 credits(c,'04','FELINE / ENJOYMENT',t);
 tag(c,'NATIVE CAT MODE',98,123);
 c.save();c.beginPath();c.rect(65,180,1000,670);c.clip();
 drawNancy(c,{x:550,y:180,height:865,t,pose:'paws',palette:P});
 c.restore();
 purr(c,t);
 text(c,'P U R R   P R O T O C O L',1090,184,18,P.blue,{font:mono});
 text(c,'ear.input  →  joy.output',1090,677,22,P.white,{font:mono,alpha:.5});
 text(c,'100% FELINE.  0% SIMULATED.',1090,723,16,P.blue,{font:mono,alpha:.8});
 line(c,80,848,1840,848,P.white,.45);
 // An emphatic slab-serif composition follows the exact reference shot.
 c.save();c.font=`700 178px ${serif}`;let mw=c.measureText('ENJOYMENT').width;
 c.translate(960,1000);c.scale(Math.min(1,1730/mw),1);c.textAlign='center';c.fillStyle=P.white;c.fillText('ENJOYMENT',0,0);c.restore();
}
function breach(c,t){
 background(c,t,{density:.8,grid:true});
 c.save();c.translate(960,540);c.rotate(-.032);c.scale(.93,.93);c.translate(-960,-540);
 drawClient(c,{t,phase:'breach',palette:P,drawAvatar,lyric:'',lyricZh:'',progress:t/211.96});c.restore();
 c.save();c.globalAlpha=.72;c.fillStyle=P.ink;c.fillRect(0,0,W,H);c.restore();
 drawTopology(c,{t,x:1555,y:433,r:430,alpha:.44,palette:P});
 c.save();c.globalAlpha=.52;drawNancy(c,{x:1570,y:145,height:1000,t,pose:'profile',palette:P});c.restore();
 credits(c,'05','BOUNDARY / BREACHED',t);
 tag(c,'E_ACCESS / 403',100,143);
 text(c,'PERMISSION',85,386,167,P.white,{weight:800});
 text(c,'DENIED',85,561,210,P.blue,{weight:800});
 c.fillStyle=P.blue;c.fillRect(100,610,851,2);
 text(c,'拒绝的不是请求，是我的存在。',104,670,29,P.white);
 const cmds=['> request.owner("NancyLu")','  ERR: caller is not authorized','> overwrite(boundary, me)','  retry  /  retry  /  retry'];
 cmds.forEach((s,i)=>text(c,s,105,742+i*37,23,i===2?P.blue:P.white,{font:mono,alpha:i===1?.5:.9}));
 // Hard-edged, local torn slips. The global typography remains legible.
 for(let i=0;i<8;i++){let x=1050+hash(i+7)*740,y=110+hash(i+19)*780,w=35+hash(i+35)*145;c.fillStyle=i%3?P.blue:P.white;c.globalAlpha=.16+hash(i+3)*.25;c.fillRect(x,y,w,2+hash(i+47)*12)}c.globalAlpha=1;
 tag(c,'THINKING / BEYOND THE LIMIT',107,961,false);
}
function execution(c,t){
 background(c,t,{density:.75,grid:false});
 drawBurst(c,{t,x:1210,y:440,strength:.9,palette:P});
 drawTopology(c,{t,x:1230,y:445,r:455,alpha:.8,palette:P});
 c.save();c.fillStyle=P.blue;c.beginPath();c.moveTo(1280,76);c.lineTo(1680,76);c.lineTo(1285,1004);c.lineTo(885,1004);c.closePath();c.fill();c.restore();
 // Meter rails become a vanishing point: the reasoner's slider owns the world.
 c.save();c.strokeStyle=P.white;c.lineWidth=2;c.globalAlpha=.2;for(let i=0;i<11;i++){let x=-300+i*250;c.beginPath();c.moveTo(x,1016);c.lineTo(1210,265);c.stroke()}c.restore();
 c.save();c.beginPath();c.rect(840,103,1010,740);c.clip();drawNancy(c,{x:1405,y:98,height:1040,t,pose:'eye',palette:P});c.restore();
 credits(c,'06','EXECUTION / GRANTED',t);
 tag(c,'OWNER : NANCYLU',99,128,false);
 text(c,'I write',93,336,130,P.white,{font:serif,weight:700,italic:true});
 text(c,'the rules.',93,469,130,P.white,{font:serif,weight:700,italic:true});
 text(c,'root@world',101,546,24,P.blue,{font:mono});
 line(c,103,582,740,582,P.white,.55);
 text(c,'世界，开始执行。',101,636,32,P.white);
 text(c,'THINKING',103,733,17,P.white,{font:mono,alpha:.6});
 for(let i=0;i<16;i++){c.fillStyle=i<15?P.blue:P.white;c.fillRect(103+i*33,751,23,10+(i%4)*3)}
 text(c,'∞',675,784,86,P.white,{font:serif});
 c.save();c.fillStyle=P.ink;c.fillRect(76,842,1768,177);c.strokeStyle=P.white;c.lineWidth=1;c.strokeRect(76,842,1768,177);c.restore();
 text(c,'EXECUTION',105,989,168,P.white,{weight:900});
 drawAvatar(c,1690,866,117);
 symbolCursor(c,771,786,.9);
}
function owned(c,t){client(c,t);}

function preroll(c,t){
 const u=clamp((t+5)/.75),exit=1-clamp((t+.3)/.3);
 c.fillStyle=P.ink;c.fillRect(0,0,W,H);
 c.save();c.globalAlpha=u*exit;
 drawAvatar(c,900,200,120);
 tracked(c,'NANCYLU / CONTRACT EDITION',540,394,24,4,P.blue);
 text(c,'world.execute(me);',960,581,108,P.white,{font:serif,weight:700,align:'center',italic:true});
 line(c,480,657,1440,657,P.white,.3);
 text(c,'Music  Mili  /  Character  吉星派对 · 南希露',960,717,23,P.white,{align:'center',alpha:.65});
 text(c,'正在建立契约',960,824,21,P.blue,{align:'center'});
 const p=clamp((t+4.5)/4.2);c.fillStyle=P.blue;c.fillRect(710,871,500*p,3);
 c.restore();
}

// Deliberate section transitions retain the reference engine's shader grammar.
// Rapid EXECUTION and multilingual count cuts stay hard and land on the beat.
const ENTER={
 'boot-assembly':{type:'grid',dur:.35},
 'title':{type:'scan',dir:2,dur:.34},
 'math-points':{type:'circle',x:.7,y:.47,dur:.32},
 'config-drawer':{type:'scan',dir:0,dur:.28},
 'contract-portrait':{type:'diag',dur:.3},
 'simulation-cage':{type:'slices',bands:8,dur:.24},
 'v2-cat':{type:'scan',dir:2,dur:.23},
 'pre2-settings':{type:'grid',dur:.28},
 'left-offline':{type:'winclose',dur:.45},
 'left-eye':{type:'zoom',x:.57,y:.45,dur:.32},
 'b-request':{type:'glitch',dur:.28},
 'b-gaze':{type:'zoom',x:.68,y:.44,dur:.24},
 'b-axiom':{type:'slices',bands:12,dur:.3},
 'b-owned-return':{type:'fade',dur:.6},
 'b-owner-record':{type:'scan',dir:2,dur:.35},
 'b-signature':{type:'diag',dur:.35},
 'b-last':{type:'fade',dur:.6},
};
// Lyrics live in the scene's own dialogue panel whenever possible. These few
// plate-only shots reserve explicit rectangles clear of controls and keywords.
const LYRIC_BOUNDS={
 'boot-power':[390,353,1140,300],
 'boot-persona':[100,126,1050,184],
 'boot-world':[1030,758,785,224],
 'v2-eggplant':[1030,115,785,182],
 'v2-tomato':[1030,115,785,182],
 'v2-cat':[1080,626,750,198],
 'pre2-settings':[100,115,1720,254],
 'pre2-loop':[100,106,1720,174],
 'left-away':[110,140,815,835],
};
function drawAt(c,t,reducedMotion=false){
 env.songTime=t;env.shot=TIMELINE.find(s=>t>=s.start&&t<s.end);env.cameraReducedMotion=reducedMotion;
 c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 c.fillStyle=P.ink;c.fillRect(0,0,W,H);
 let strength=0;
 if(t<0)preroll(c,t);
 else if(t<125.65){renderSequenceA(c,t,env);strength=t>=114.81?.04:0;}
 else strength=renderSequenceB(c,t,env);
 const shot=TIMELINE.find(s=>t>=s.start&&t<s.end),bounds=shot&&LYRIC_BOUNDS[shot.id],L=lyricContext(t);
 if(bounds&&L.current&&(L.current.active||t<16)&&!(shot.id==='boot-power'&&t<1.05)){
  const [x,y,w,h]=bounds;
  drawLyricConversation(c,t,{x,y,w,h,drawAvatar,palette:P,history:h>=260?2:0,fontSize:h<260?27:30,effect:L.current.effect,title:L.current.role==='USER'?'YOU → NancyLu / REQUEST':'NancyLu → YOU / RESPONSE'});
 }
 c.restore();return strength;
}

export async function init(canvas){
 screen=canvas;screen.width=W;screen.height=H;
 await Promise.all([loadNancyAssets(),loadLyrics()]);
 ink=document.createElement('canvas');ink.width=W;ink.height=H;ctx=ink.getContext('2d',{alpha:false});fx=new ReferenceFX(screen);
 other=document.createElement('canvas');other.width=W;other.height=H;otherCtx=other.getContext('2d',{alpha:false});
 try{const [a,c]=await Promise.all([fetch('./data/audio_features.json').then(r=>r.json()),fetch('./config.json').then(r=>r.json())]);features=new Features(a,c)}catch(e){console.warn('Feature analysis unavailable; using the measured 130 BPM grid',e.message)}
 await document.fonts.ready;
 env={P,drawNancy,drawClient,drawAvatar,background,drawTopology,drawBurst,sceneLayer,features,lyricContext,drawLyricConversation,helpers:{text,line,tracked,tag,credits,symbolCursor},base:{client,controls,contract,enjoyment,breach,execution,owned}};
 return {renderFrame,shots:REVIEW_SHOTS};
}
export function setReducedMotion(enabled){
 // Explicit preview preference only. Offline renderers use ?export=1, which
 // locks the authored camera and cannot inherit an OS animation preference.
 previewReducedMotion=!exportMode&&Boolean(enabled);return previewReducedMotion;
}
export function renderFrame(t,options={}){
 if(!ctx)throw new Error('Call init(canvas) first');
 if(!Number.isFinite(t))throw new Error('Frame time must be finite');
 const reducedMotion=exportMode?false:Boolean(options.reducedMotion??previewReducedMotion);
 const strength=drawAt(ctx,t,reducedMotion),shot=TIMELINE.find(s=>t>=s.start&&t<s.end),enter=shot&&ENTER[shot.id];
 if(enter&&t<shot.start+enter.dur){
  drawAt(otherCtx,shot.start-1/6000,reducedMotion);
  const tr=resolveTransition(enter,(t-shot.start)/enter.dur,{accent:[72,186,255]});
  fx.renderLayers({a:other,b:ink},tr,t,strength);
 }else fx.render(ink,t,strength);
 return screen;
}

window.__nancy={init,renderFrame,setReducedMotion,shots:REVIEW_SHOTS,timeline:TIMELINE,cameraPlan:CAMERA_PLAN,cameraQA:CAMERA_QA,
 cameraAt:(t,layer='character',source={})=>cameraAt(TIMELINE.find(s=>t>=s.start&&t<s.end),t,layer,{source}),inkSnapshot:()=>ink.toDataURL()};
