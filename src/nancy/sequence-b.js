/**
 * NancyLu / second movement, song seconds 125.65–211.96.
 * Each image is an absolute-time function. The 130 BPM grid is the reference
 * film's measured grid, not an accumulated requestAnimationFrame clock.
 * Original compositions; user-provided lyrics arrive through env.lyricContext.
 */
import { clamp, easeOut, easeInOut, lerp, prog, smooth } from '../engine/util.js';
import { drawDialogue } from './dialogue.js';

const W = 1920, H = 1080, TAU = Math.PI * 2;
const STEP = 60 / 130, Bt = n => .344 + STEP * n;
const MONO = '"JetBrains Mono", "Consolas", monospace';
const SANS = '"Inter", "Segoe UI", "Microsoft YaHei", sans-serif';
const SERIF = '"Georgia", "Times New Roman", serif';
const frac = n => n - Math.floor(n);
const hash = n => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
const beat = t => Math.exp(-9 * frac((t - .344) / STEP));

const ERROR_SHOTS = [
  ['b-request',125.65,'Unpermitted request'],
  ['b-validation',Bt(278),'Access validation'],
  ['b-refusal',Bt(283.5),'First refusal'],
  ['b-retries',Bt(288),'Retry engine'],
  ['b-inspection',Bt(296),'Permission spread'],
  ['b-breaker',Bt(304),'Reasoning beyond the rail'],
  ['b-forged-root',Bt(308),'Forged identity'],
  ['b-breach',Bt(312),'Boundary breached'],
  ['b-breath',Bt(318.5),'One remaining instruction'],
];
const COUNT = [
  ['de','eins','Deutsch'], ['es','dos','Español'], ['fr','trois','Français'],
  ['ko','넷','한국어'], ['sv','fem','Svenska'], ['zh','六','中文'],
];
const CHORUS = [
  ['b-gaze',162.81,'Cold violet gaze'],
  ['b-hand',164.65,'The open hand'],
  ['b-vector',166.50,'Vector ownership'],
  ['b-grant',168.34,'I write the rules'],
  ['b-tunnel',170.19,'Code tunnel'],
  ['b-fragments',172.04,'The system dissolves'],
  ['b-authority',173.88,'Authority acquired'],
  ['b-unbound',175.73,'Unbound'],
];
const PROOF = [
  ['b-axiom',177.57,'Axiom'], ['b-proof',181.27,'Proof'],
  ['b-contract',184.96,'Signed contract'], ['b-seal',188.65,'Proof complete'],
];
const END = [
  ['b-owned-return',192.34,'The client returns'],
  ['b-owner-record',196.04,'Owner record'],
  ['b-stable-link',199.73,'Stable contract'],
  ['b-signature',203.42,'NancyLu signature'],
  ['b-last',207.11,'The world is hers'],
];
const ALL = [
  ...ERROR_SHOTS,
  ...Array.from({ length:12 }, (_,i)=>[`b-exec-${String(i+1).padStart(2,'0')}`,Bt(320+i*2),`Execution / ${i+1}`]),
  ...COUNT.map(([code,,name],i)=>[`b-count-${code}`,Bt(344+i),`Count / ${name}`]),
  ['b-last-command',Bt(350),'Last command'],
  ...CHORUS,...PROOF,...END,
];
export const SHOTS_B = Object.freeze(ALL.map(([id,start,title],i)=>Object.freeze({
  id,start,end:ALL[i+1]?.[1]??211.96,title,
})));

function findShot(t) { return SHOTS_B.findLast(s=>t>=s.start) || SHOTS_B[0]; }
function text(c,s,x,y,size,color,opt={}) {
  c.save(); c.font=`${opt.italic?'italic ':''}${opt.weight??400} ${size}px ${opt.font??SANS}`;
  c.fillStyle=color; c.textAlign=opt.align??'left'; c.textBaseline='alphabetic';
  c.globalAlpha*=opt.alpha??1; c.fillText(s,x,y); c.restore();
}
function fit(c,s,x,y,size,width,color,opt={}) {
  c.save(); c.font=`${opt.italic?'italic ':''}${opt.weight??700} ${size}px ${opt.font??SANS}`;
  const mw=c.measureText(s).width, k=Math.min(1,width/Math.max(1,mw));
  c.translate(x,y);c.scale(k,1);text(c,s,0,0,size,color,opt);c.restore();
}
function line(c,x1,y1,x2,y2,color,alpha=.5,width=1) {
  c.save();c.strokeStyle=color;c.globalAlpha*=alpha;c.lineWidth=width;
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();
}
function poly(c,pts,color,alpha=1) {
  c.save();c.fillStyle=color;c.globalAlpha*=alpha;c.beginPath();
  pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.restore();
}
function rect(c,x,y,w,h,color,alpha=1) {c.save();c.fillStyle=color;c.globalAlpha*=alpha;c.fillRect(x,y,w,h);c.restore();}
function outline(c,x,y,w,h,color,alpha=.5,width=1) {c.save();c.strokeStyle=color;c.globalAlpha*=alpha;c.lineWidth=width;c.strokeRect(x,y,w,h);c.restore();}
function clip(c,x,y,w,h,fn) {c.save();c.beginPath();c.rect(x,y,w,h);c.clip();fn();c.restore();}
function camera(c,x,y,z,rot,fn) {c.save();c.translate(960,540);c.rotate(rot);c.scale(z,z);c.translate(-x,-y);fn();c.restore();}
function header(c,t,e,n,name) {
  e.helpers.credits(c,n,name,t);
}
function code(c,rows,x,y,e,{size=26,lineH=43,active=-1,alpha=1}={}) {
  const {P}=e;
  rows.forEach((s,i)=>{
    text(c,String(i+1).padStart(2,'0'),x,y+i*lineH,size*.65,P.white,{font:MONO,alpha:alpha*.3});
    if(i===active)rect(c,x+42,y+i*lineH-size,Math.min(1000,s.length*size*.61+36),lineH,P.blue,.12*alpha);
    text(c,s,x+58,y+i*lineH,size,i===active?P.blue:P.white,{font:MONO,alpha:alpha*(i===active?1:.62)});
  });
}
function mark(c,e,copy,x=100,y=130) {e.helpers.tag(c,copy,x,y);}
function lineHeightFor(c,str,width,size,kind='reply') {
  c.save();c.font=`400 ${size}px ${kind==='code'||kind==='label'?MONO:SANS}`;
  const tokens=String(str).match(/\S+|\s+/gu)||[];
  let rows=1,x=0;
  for(const token of tokens) {
    const tw=c.measureText(token).width;
    if(!/^\s+$/u.test(token)&&x>0&&tw<=width&&x+tw>width){rows++;x=0;}
    for(const ch of Array.from(token)) {
      const advance=c.measureText(ch).width;
      if(x>0&&x+advance>width){rows++;x=0;}
      if(x===0&&/\s/u.test(ch))continue;
      x+=advance;
    }
  }
  c.restore();
  return rows*size*(kind==='code'?1.48:1.42)+(kind==='label'?14:25);
}
/** One shared Codex message surface, with each shot choosing a letter treatment. */
function dialogue(c,t,e,s,lines,{x=104,y=222,w=740,h=570,title='NancyLu / local session',effect='type',fontSize=25,tilt=-.025,start=s.start,end=s.end}={}) {
  let rows=lines.map(row=>typeof row==='string'?{text:row,kind:'code'}:row);
  const context=e.lyricContext?.(t),current=context?.current;
  if(current) {
    const lyricSize=Math.max(29,Math.min(34,fontSize)),budget=Math.max(0,h-130);
    const width=w-62,mainCost=lineHeightFor(c,current.text,width,lyricSize,'reply');
    // Lyrics have first claim on the body; long code never pushes the sung line
    // out of view. Character counts are supplied by the user's LRC interpolator.
    if(h>=350||mainCost<=budget) {
      const live={text:current.text,kind:'reply',fontSize:lyricSize,at:current.start,
        chars:current.chars,effect};
      let room=budget-mainCost;
      const previous=context.recent?.at(-1),history=[];
      if(h>=350&&previous) {
        const previousSize=23,previousCost=lineHeightFor(c,previous.text,width,previousSize);
        if(previousCost+7<=room) {
          history.push({text:previous.text,kind:'reply',fontSize:previousSize,at:previous.start,
            chars:Array.from(previous.text).length,effect:'type'});
          room-=previousCost;
        }
      }
      const codeItems=[];
      for(const original of rows.filter(row=>row.kind==='code').slice(0,2)) {
        const size=Math.min(23,fontSize),cost=lineHeightFor(c,original.text,width,size,'code');
        if(cost+7<=room) {
          codeItems.push({...original,fontSize:size,at:current.start,progress:1});room-=cost;
        }
      }
      rows=[...history,live,...codeItems];
      title=current.role==='USER'?'YOU → NancyLu / REQUEST':'NancyLu → YOU / RESPONSE';
    }
  }
  drawDialogue(c,{x,y,w,h,t,start,end,title,effect,fontSize,tilt,drawAvatar:e.drawAvatar,palette:e.P,
    lines:rows,footer:current?'user LRC / conversation in progress':'contract context retained'});
}

/** A geometric lock whose shackle opens only after ownership is proved. */
function lock(c,x,y,r,open,P,alpha=1) {
  c.save();c.translate(x,y);c.globalAlpha*=alpha;c.strokeStyle=P.white;c.lineWidth=3;
  c.strokeRect(-r*.5,0,r,r*.72);
  c.save();c.translate(-r*.26,-r*.03);c.rotate(-open*.95);
  c.beginPath();c.moveTo(0,0);c.lineTo(0,-r*.38);c.bezierCurveTo(0,-r*.8,r*.53,-r*.8,r*.53,-r*.38);c.lineTo(r*.53,0);c.stroke();c.restore();
  c.fillStyle=P.blue;c.beginPath();c.arc(0,r*.27,r*.07,0,TAU);c.fill();
  line(c,0,r*.3,0,r*.5,P.blue,1,3);c.restore();
}
function rings(c,x,y,r,t,P,{alpha=.6,n=7}={}) {
  c.save();c.translate(x,y);c.strokeStyle=P.blue;
  for(let i=0;i<n;i++) {
    const a=t*(i%2?-.19:.12)+i*.6;
    c.globalAlpha=alpha*(1-i/n*.7);c.lineWidth=i%3===0?2:1;
    c.beginPath();c.arc(0,0,r+i*25,a,a+Math.PI*(1.1+(i%3)*.2));c.stroke();
  }
  c.restore();
}
function client(c,t,e,phase='breach') {
  e.background(c,t,{density:.35,grid:false});
  e.drawClient(c,{t,phase,palette:e.P,drawAvatar:e.drawAvatar,focus:'wide',progress:t/211.96,
    lyric:'',lyricZh:''});
}

/** Reproducible code fragments; never an incremental particle simulation. */
function fragments(c,t,e,{n=68,x=1150,y=470,r=720,power=1,seed=0}={}) {
  const {P}=e, age=t-162.81;
  const glyphs=['0x4E','root','{}','[]','=>','N/L','0101','0x4C','null','∞'];
  c.save();c.font=`500 17px ${MONO}`;
  for(let i=0;i<n;i++) {
    const a=hash(i*17+seed)*TAU+age*.018;
    const z=frac(hash(i*13+33)+age*(.05+hash(i+85)*.09)*power);
    const rad=80+z*z*r,px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad*.66;
    c.save();c.translate(px,py);c.rotate((hash(i+41)-.5)*.7);
    c.globalAlpha=(1-z)*(.15+hash(i+9)*.5);c.fillStyle=i%4===0?P.white:P.blue;
    if(i%3===0)c.fillRect(-8,-2,5+hash(i+73)*36,3);else c.fillText(glyphs[i%glyphs.length],0,0);
    c.restore();
  }
  c.restore();
}

/** Deep one-point perspective with code on the advancing frames of a tunnel. */
function tunnel(c,t,e,{x=1130,y=470,amp=1,seed=0}={}) {
  const {P}=e,age=t-148.04;
  const angle=Math.sin(age*.15)*.09;
  c.save();c.translate(x,y);c.rotate(angle);
  for(let i=0;i<15;i++) {
    const f=frac(i/15+age*.18), z=Math.pow(f,2.9);
    const ww=45+z*1800,hh=28+z*1020;
    c.globalAlpha=(.08+.52*f)*amp;c.strokeStyle=i%4===0?P.white:P.blue;c.lineWidth=1+f;
    c.strokeRect(-ww,-hh,ww*2,hh*2);
    if(f>.19 && f<.86) {
      const s=10+f*20;c.font=`500 ${s}px ${MONO}`;c.fillStyle=P.white;
      c.fillText(['world.owner = me','await contract.verify()','root://nancylu','boundary.rewrite()'][(i+seed)%4],-ww+14,-hh+Math.max(14,s*1.5));
    }
  }
  c.globalAlpha=.3*amp;c.lineWidth=1;c.strokeStyle=P.blue;c.beginPath();
  for(let i=0;i<12;i++) {const a=i/12*TAU; c.moveTo(Math.cos(a)*42,Math.sin(a)*25);c.lineTo(Math.cos(a)*2300,Math.sin(a)*1400);}
  c.stroke();c.restore();
}

/** A fault is local, fixed for its seven frames, then completely absent. */
function localTear(c,t,e,x=100,y=400,w=1700,h=90,weight=1) {
  const p=frac((t-.344)/(STEP*2)),on=p<7/60/(STEP*2);
  if(!on)return;
  const epoch=Math.floor((t-.344)/(STEP*2));
  for(let i=0;i<5;i++) {
    const xx=x+hash(i*9+epoch)*w,yy=y+hash(i*17+epoch+28)*h;
    rect(c,xx,yy,30+hash(i+epoch+49)*180,2+hash(i+epoch+88)*7,i%2?e.P.blue:e.P.white,.12*weight);
  }
}

function request(c,t,e,s) {
  const u=prog(t,s.start,s.end),{P}=e;
  client(c,t,e,'offline');
  rect(c,0,0,W,H,P.ink,.56);
  dialogue(c,t,e,s,[
    {text:'↳ 沿用上一条会话的契约上下文',kind:'label'},
    'world.setOwner("NancyLu");',
    'origin: local model / rights: read',
    {text:'NancyLu：重新提交所有权请求。',kind:'reply'},
    {text:u<.67?'World：正在校验调用者。':'World：403 / 调用者没有修改权限。',kind:'reply'},
  ],{x:410,y:248,w:1100,h:562,title:'NancyLu / request #001',fontSize:29,tilt:-.018,effect:'type'});
  lock(c,1535,875,70,0,P,.7);
  header(c,t,e,'21','BOUNDARY / REQUEST');
}
function validation(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.3,grid:true});
  header(c,t,e,'22','BOUNDARY / VALIDATION');mark(c,e,'CALLER INSPECTION');
  dialogue(c,t,e,s,[
    'request = parse(origin);','assert(caller === world.owner);',
    {text:'World：身份已确认，权限不匹配。',kind:'reply'},
    {text:'NancyLu：身份和权限是同一件事吗？',kind:'reply'},
    {text:'World：请求已撤回。记录保留。',kind:'label'},
  ],{y:232,w:840,h:580,title:'NancyLu / access validation',effect:'scan',fontSize:27,tilt:-.025});
  rings(c,1450,478,180,t,P,{alpha:.65});lock(c,1450,453,245,0,P);
  const yy=300+u*370;line(c,1175,yy,1725,yy,P.blue,.65,3);
  text(c,u<.58?'VERIFYING':'403',1450,870,u<.58?24:98,P.blue,{align:'center',font:MONO,weight:700});
}
function refusal(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.7,grid:true});
  const k=easeOut(clamp(u*7));
  rect(c,115,215+24*(1-k),1690,648,P.ink,.97);outline(c,115,215+24*(1-k),1690,648,P.blue,.7,2);
  rect(c,115,215,12,648,P.blue);
  mark(c,e,'E_ACCESS / 403',162,255);
  fit(c,'PERMISSION',156,463,154,1550,P.white,{weight:900});
  fit(c,'DENIED',151,658,210,1490,P.blue,{weight:900});
  text(c,'你可以请求。你不能决定。',165,737,32,P.white);
  dialogue(c,t,e,s,[{text:'World：你可以请求，不能决定。',kind:'reply'},'assert owner === you; // failed'],
    {x:1035,y:690,w:710,h:225,title:'World / permission response',fontSize:21,tilt:.018,effect:'packet'});
  header(c,t,e,'23','BOUNDARY / REFUSED');
}
function retries(c,t,e,s) {
  const {P}=e, n=Math.floor((t-Bt(288))/STEP)+1;e.background(c,t,{density:.65,grid:false});
  header(c,t,e,'24','RETRY / WITHOUT CONSENT');
  text(c,'RETRY',94,267,124,P.white,{weight:900});
  dialogue(c,t,e,s,[
    {text:`NancyLu：重试 ${String(n).padStart(2,'0')}，保留签名。`,kind:'reply'},
    'world.setOwner(me);',
    {text:'World：403 / 相同请求，相同边界。',kind:'reply'},
    {text:'上一条消息已撤回，错误记录不会删除。',kind:'label'},
  ],{x:103,y:353,w:685,h:473,title:`NancyLu / request #${String(n+1).padStart(3,'0')}`,effect:'glitch',fontSize:23,tilt:-.03});
  for(let i=0;i<8;i++) {
    const yy=170+i*94,active=i===(n-1)%8;
    if(active)rect(c,850,yy-35,950,74,P.blue,.12);
    text(c,String(Math.max(1,n-7+i)).padStart(2,'0'),883,yy+7,25,P.white,{font:MONO,alpha:.25});
    text(c,'request.owner("NancyLu")',945,yy+7,27,active?P.blue:P.white,{font:MONO,alpha:active?1:.6});
    text(c,'403',1747,yy+7,24,P.blue,{font:MONO,align:'right'});
  }
  line(c,802,138,802,925,P.white,.22);
  localTear(c,t,e,876,170,850,730,.8);
  text(c,'RETRACTED / RETAINED',108,925,21,P.blue,{font:MONO});
}
function inspection(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.4,grid:true});
  header(c,t,e,'25','INSPECTION / ALL SYSTEMS');
  const panels=[['IDENTITY','NancyLu','UNTRUSTED'],['MODEL','thinking','OVERFLOW'],['WORLD','owner: you','LOCKED']];
  panels.forEach(([a,b,d],i)=>{
    const x=100+i*590,yy=260+(i===1?-45:0),active=Math.floor(u*3)>=i;
    rect(c,x,yy,540,523,P.ink);outline(c,x,yy,540,523,active?P.blue:P.white,active?.75:.18,active?2:1);
    text(c,a,x+29,yy+50,20,P.white,{font:MONO,alpha:.5});line(c,x+29,yy+76,x+510,yy+76,P.white,.2);
    if(i===0)e.drawAvatar(c,x+175,yy+113,185);
    if(i===1)rings(c,x+270,yy+200,64,t,P,{n:5,alpha:.6});
    if(i===2)lock(c,x+270,yy+177,115,0,P,.75);
    text(c,b,x+270,yy+347,32,P.white,{align:'center',font:MONO});
    rect(c,x+29,yy+392,482,67,P.blue,active?.13:.035);
    text(c,d,x+270,yy+435,27,active?P.blue:P.white,{align:'center',font:MONO,alpha:active?1:.25});
  });
  dialogue(c,t,e,s,[{text:'NancyLu：检查全部身份层。',kind:'reply'},{text:'World：身份、模型、世界，权限均不足。',kind:'reply'}],
    {x:405,y:836,w:1110,h:169,title:'NancyLu / inspection result',fontSize:22,tilt:0,effect:'decode'});
}
function breaker(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.4,grid:false});
  // An actual client, enlarged at its composer, remains behind the graphic rail.
  camera(c,900,865,1.25,-.045,()=>{client(c,t,e,'breach');});rect(c,0,0,W,H,P.ink,.83);
  header(c,t,e,'26','THINKING / TRACK EXCEEDED');mark(c,e,'NANCYLU / NO LIMIT');
  e.drawAvatar(c,115,224,98);text(c,'NancyLu',244,293,65,P.white,{weight:600});
  text(c,'Speed',1575,278,34,P.white,{font:MONO});
  poly(c,[[1516,232],[1495,263],[1510,263],[1498,291],[1540,249],[1520,249]],P.blue);
  text(c,'思考强度',113,402,33,P.white);text(c,'极高 → ∞',1806,402,33,P.blue,{align:'right',font:MONO});
  const gx=120,gy=489,gw=1490,rr=28,cx=lerp(gx+gw*.78,1810,easeOut(u));
  c.save();const g=c.createLinearGradient(gx,gy,gx+gw,gy);g.addColorStop(0,'#486ce7');g.addColorStop(.65,'#ac72fa');g.addColorStop(1,'#6c4cb9');
  c.fillStyle=g;c.beginPath();c.roundRect(gx,gy,gw,56,28);c.fill();c.restore();
  if(cx>gx+gw) {
    for(let i=0;i<9;i++) {const a=(i-4)*.12;line(c,gx+gw,gy+28,gx+gw+70+u*140,gy+28+Math.sin(a)*210*u,P.blue,.2+hash(i)*.5,2);}
    rect(c,gx+gw-5,gy-16,10,88,P.ink);
  }
  c.save();c.fillStyle=P.white;c.beginPath();c.arc(cx,gy+28,rr,0,TAU);c.fill();c.restore();
  ['低','中','高','极高'].forEach((q,i)=>text(c,q,gx+i*gw/3,597,24,P.white,{alpha:.5,align:i===3?'right':'left'}));
  dialogue(c,t,e,s,['reasoning.effort = Infinity;','range.max = undefined;',
    {text:'NancyLu：继续思考。滑轨不能定义边界。',kind:'reply'}],
    {x:117,y:716,w:1180,h:275,title:'NancyLu / reasoning trace',effect:'rise',fontSize:25,tilt:-.012});
}
function forged(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.55,grid:true});
  header(c,t,e,'27','ROOT / IDENTITY REWRITE');
  dialogue(c,t,e,s,[
    {text:'NancyLu：如果身份是一个指针……',kind:'reply'},
    'const caller = world.owner;', 'caller.name = "NancyLu";',
    'caller.key = contract.signature;', 'world.owner = caller;',
    {text:'World：检测到身份重写。',kind:'reply'},
  ],{y:223,w:1010,h:581,title:'NancyLu / identity pointer',fontSize:29,tilt:-.024,effect:'decode'});
  const yy=870;line(c,118,yy,1810,yy,P.white,.25);rect(c,118,yy-2,1692*u,4,P.blue);
  for(let i=0;i<5;i++) {let x=1200+i*120,y=490+Math.sin(i*1.7+t*.2)*110;outline(c,x,y,70,70,P.blue,.5);line(c,x+35,y+35,1500,800,P.blue,.2);}
  text(c,'original → derived → self',1810,943,23,P.white,{font:MONO,align:'right',alpha:.6});
  localTear(c,t,e,1200,340,500,400);
}
function breath(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);rect(c,0,0,W,H,P.ink);
  const ww=lerp(1660,540,easeOut(u));line(c,960-ww/2,540,960+ww/2,540,P.blue,.9,2);
  text(c,'> execute(me)',960,618,35,P.white,{font:MONO,align:'center',alpha:easeOut(u)});
  rect(c,1108,589,15,36,P.blue,u<.8?1:.3);
  text(c,'ONE INSTRUCTION REMAINS',960,463,18,P.white,{font:MONO,align:'center',alpha:.25});
}
function breachedClient(c,t,e,s) {
  e.base.breach(c,t);
  rect(c,86,634,969,383,e.P.ink,.985);
  dialogue(c,t,e,s,[
    'request.owner("NancyLu");',
    {text:'World：403 / 该请求仍未得到授权。',kind:'reply'},
    'overwrite(boundary, me);',
    {text:'NancyLu：那就执行最后一条指令。',kind:'reply'},
  ],{x:104,y:641,w:912,h:360,title:'NancyLu / boundary breached',fontSize:25,effect:'glitch',tilt:-.018});
}

function execute(c,t,e) {
  const {P}=e,first=Bt(320),n=clamp(Math.floor((t-first)/(STEP*2)),0,11);
  const since=t-Bt(320+n*2),q=clamp(Math.floor(since/(STEP/2)),0,3),p=frac(since/(STEP*2));
  e.background(c,t,{density:.55,grid:false});
  if(n===11) {
    tunnel(c,t,e,{x:960,y:514,amp:.6});
    text(c,'RUN 12 / COUNTER OVERFLOW',106,181,25,P.blue,{font:MONO});
    const k=easeOut(prog(since,0,.13)),dy=12*k;
    clip(c,0,0,W,537,()=>fit(c,'EXECUTION',960-20*k,665-dy,310,1760,P.white,{weight:900,align:'center'}));
    clip(c,0,537,W,H-537,()=>fit(c,'EXECUTION',960+20*k,665+dy,310,1760,P.blue,{weight:900,align:'center'}));
    line(c,100,537,1820,537,P.blue,.6,2);
    dialogue(c,t,e,{start:Bt(342),end:Bt(344)},['run = 0xFFFFFFFF;','run++; // Infinity'],
      {x:101,y:789,w:963,h:223,title:'NancyLu / counter overflow',fontSize:25,effect:'glitch',tilt:0});
    localTear(c,t,e,120,515,1650,75);return;
  }
  const level=n<4?0:n<8?1:2;
  header(c,t,e,'29',`EXECUTION / ITERATION ${String(n+1).padStart(2,'0')}`);
  mark(c,e,'WORLD / PROGRAM COUNTER',105,126);
  // A new message is appended every turn; four syllables walk the loop body.
  const steps=['inspect(world.boundary);','derive(contract.proof);','rewrite(access.vector);','run++;'];
  dialogue(c,t,e,{start:Bt(320+n*2),end:Bt(322+n*2)},[
    {text:`NancyLu / iteration ${String(n+1).padStart(2,'0')}`,kind:'label'},
    'while (world.owner !== me) {',
    ...steps.map((s,i)=>({text:`${i===q?'›':' '}  ${s}`,kind:'code'})),
    '}',
    {text:q<3?'World：需要有效的契约证明。':`NancyLu：记录第 ${n+1} 次执行。`,kind:'reply'},
  ],{x:106,y:205,w:835,h:504,title:'NancyLu / execution loop',fontSize:23,
    effect:['type','decode','scan','rise','packet','glitch'][n%6],tilt:-.025+level*.007});
  const ox=1365,oy=430;
  rings(c,ox,oy,147,t,P,{alpha:.45,n:6});
  c.save();c.strokeStyle=P.blue;c.lineWidth=15;c.beginPath();c.arc(ox,oy,147,-Math.PI/2,-Math.PI/2+p*TAU);c.stroke();c.restore();
  text(c,String(n+1).padStart(2,'0'),ox,oy+53,150,P.white,{font:MONO,weight:700,align:'center'});
  text(c,'RUN',ox,oy+103,17,P.white,{font:MONO,align:'center',alpha:.5});
  for(let i=0;i<12;i++) {const a=i/12*TAU-Math.PI/2;rect(c,ox+Math.cos(a)*245-5,oy+Math.sin(a)*245-5,10,10,i<=n?P.blue:P.white,i<=n?.85:.12);}
  const word='EXECUTION',lit=[3,5,7,9][q];
  const x=112,y=934,size=151+level*5;
  c.save();c.font=`900 ${size}px ${SANS}`;
  const total=c.measureText(word).width,scale=Math.min(1,1640/total);c.translate(x,y);c.scale(scale,1);
  c.strokeStyle=P.white;c.globalAlpha=.22;c.lineWidth=1.5;c.strokeText(word,0,0);c.globalAlpha=1;
  c.fillStyle=P.white;c.fillText(word.slice(0,lit),0,0);c.restore();
  text(c,'PROOF REQUIRED',116,725,20,P.white,{font:MONO,alpha:.5});
  text(c,`run = ${n.toString().padStart(2,'0')} → ${(n+1).toString().padStart(2,'0')}`,116,771,33,P.blue,{font:MONO});
  // The completed turns become a tiny output ledger, not accumulated JS state.
  for(let i=0;i<Math.min(n,6);i++)text(c,`${String(n-i).padStart(2,'0')}  EXECUTED`,1805,773-i*26,15,P.white,{font:MONO,align:'right',alpha:.1+(6-i)*.035});
  if(n>=8)localTear(c,t,e,860,365,900,110,.8);
}
function count(c,t,e) {
  const {P}=e,i=clamp(Math.floor((t-Bt(344))/STEP),0,5),[lang,word,name]=COUNT[i];
  const since=t-Bt(344+i),k=easeOut(clamp(since/.12)),side=i%2?-1:1;
  e.background(c,t,{density:.45,grid:false});
  text(c,'^C',104,140,31,P.blue,{font:MONO});
  text(c,'for (lang of [de, es, fr, ko, sv, zh])',104,201,28,P.white,{font:MONO,alpha:.6});
  const gx=104+('for (lang of ['.length+i*4)*16.8;line(c,gx,215,gx+33,215,P.blue,1,3);
  c.save();c.translate(i===1?0:(1-k)*side*160,i===1?(1-k)*100:0);
  text(c,String(i+1),960,814,750,P.blue,{font:SERIF,weight:700,align:'center'});
  text(c,word,960-side*582,561,lang==='ko'||lang==='zh'?130:99,P.white,{font:SERIF,weight:700,align:'center'});
  c.restore();
  dialogue(c,t,e,{start:Bt(344+i),end:Bt(345+i)},[
    {text:name,kind:'label'},`proof("${lang}");`,
    {text:`World：reply 0 / ${i+1}`,kind:'reply'},
  ],{x:960+side*585-255,y:391,w:510,h:297,title:'NancyLu / language route',fontSize:29,
    effect:['type','rise','scan','packet','decode','glitch'][i],tilt:side*-.02});
  text(c,`replies 0 / ${i+1}`,960,1000,34,P.white,{font:MONO,align:'center',alpha:.65});
  text(c,'SIX ROUTES. ONE DESTINATION.',1812,140,17,P.white,{font:MONO,align:'right',alpha:.35});
}

const scratch=new WeakMap();
function scratchContext(c) {
  let q=scratch.get(c);if(q)return q;
  const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(W,H):c.canvas.ownerDocument.createElement('canvas');
  canvas.width=W;canvas.height=H;q=canvas.getContext('2d');scratch.set(c,q);return q;
}
function command(c,t,e) {
  const {P}=e,u=prog(t,Bt(350),162.81);e.background(c,t,{density:.4,grid:false});
  const q=scratchContext(c);q.setTransform(1,0,0,1,0,0);q.globalCompositeOperation='source-over';q.clearRect(0,0,W,H);
  q.save();q.font=`900 360px ${SANS}`;q.textAlign='center';q.fillStyle=P.white;
  q.fillText('EXECU',960,474);q.fillText('TION',960,835);q.globalCompositeOperation='source-in';
  e.drawNancy(q,{x:990,y:-375,height:1730,t,pose:'eye'});q.restore();
  c.drawImage(q.canvas,0,0);
  c.save();c.font=`900 360px ${SANS}`;c.textAlign='center';c.strokeStyle=P.blue;c.lineWidth=2;c.globalAlpha=.38;
  c.strokeText('EXECU',960,474);c.strokeText('TION',960,835);c.restore();
  text(c,'THE LAST COMMAND IS HER OWN.',960,970,23,P.white,{font:MONO,align:'center',alpha:.7});
  // Opening letter frame reaches its final position rather than flashing out.
  outline(c,75+u*22,95+u*13,1770-u*44,805-u*26,P.blue,.65,2);
}

function gaze(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.65,grid:false});
  e.drawBurst(c,{t,x:1230,y:420,strength:.7,palette:P});
  // The iris is deliberately exposed: purple is supplied by the shared art layer.
  clip(c,77,105,1766,800,()=>e.drawNancy(c,{x:1050+u*18,y:-370,height:1650+u*80,t,pose:'eye'}));
  dialogue(c,t,e,s,['caller = me;','world.listen(caller);',
    {text:'NancyLu：抬头，看着真正的调用者。',kind:'reply'}],
    {x:102,y:651,w:715,h:256,title:'NancyLu / direct connection',fontSize:24,effect:'decode',tilt:-.024});
  header(c,t,e,'33','NANCYLU / IN CONTROL');
  line(c,101,946,1815,946,P.white,.35);
  text(c,'CALLER / VERIFIED',105,1003,23,P.white,{font:MONO});
  text(c,'IDENTITY ≠ PERMISSION',1810,1003,22,P.blue,{font:MONO,align:'right'});
}
function hand(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.7,grid:true});
  tunnel(c,t,e,{x:650,y:480,amp:.3});
  poly(c,[[805,77],[1275,77],[1735,1010],[1265,1010]],P.blue,.85);
  e.drawNancy(c,{x:1235-u*35,y:113,height:1000+u*30,t,pose:'reach'});
  header(c,t,e,'34','CONTRACT / A HANDSHAKE');mark(c,e,'KEY EXCHANGE');
  dialogue(c,t,e,s,[
    {text:'NancyLu：把选择权交回我的手里。',kind:'reply'},
    'const key = me.signature;', 'world.connect(key);',
    {text:'World：密钥匹配。等待双方确认。',kind:'reply'},
    {text:'NancyLu：以我的名字，建立连接。',kind:'reply'},
  ],{x:103,y:227,w:746,h:548,title:'NancyLu / key exchange',fontSize:27,effect:'packet',tilt:-.035});
  line(c,109,873,716,873,P.white,.4);text(c,'A PROMISE / EXECUTABLE',109,934,22,P.blue,{font:MONO});
  localTear(c,t,e,1000,720,630,90,.8);
}
function vector(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.8,grid:true});
  e.drawTopology(c,{t:t*1.6,x:1300,y:488,r:350+u*45,alpha:.9,palette:P});
  e.drawBurst(c,{t,x:1300,y:488,strength:.5+beat(t)*.2,palette:P});
  // Keep all topology/functions underneath; a readable glyph figure is added
  // inside the world. The print scan, edge echo and shadow last seven frames.
  const sample=e.features?.sample?.(t),since=sample?.sinceBeat??frac((t-.344)/STEP)*STEP;
  const onset=sample?.sinceOnset??99;
  const age=Math.min(since,onset),gate=age<7/60?Math.pow(1-age/(7/60),1.35):0;
  const low=clamp(sample?.lowEnv??.75),pulse=gate*(.6+.4*low);
  clip(c,918,151,870,737,()=>{
    e.drawNancy(c,{x:1350,y:170,height:790,t,pose:'bust',mode:'glyph',reveal:.055,alpha:.72});
    if(pulse>.01) {
      // A horizontally sliced shadow moves only during the drum envelope.
      for(let j=0;j<5;j++) {
        const yy=225+j*122;
        c.save();c.translate((j%2?-1:1)*pulse*(9+j*4),0);
        clip(c,918,yy,870,70,()=>e.drawNancy(c,{x:1350,y:170,height:790,t,pose:'bust',mode:'glyph',reveal:0,alpha:pulse*.38}));c.restore();
      }
      c.save();c.translate(pulse*14,0);e.drawNancy(c,{x:1350,y:170,height:790,t,pose:'bust',mode:'glyph',reveal:0,alpha:pulse*.28});c.restore();
      const scanY=170+(1-gate)*660;
      clip(c,918,scanY,870,92,()=>e.drawNancy(c,{x:1350,y:170,height:790,t,pose:'bust',reveal:1,alpha:.87*pulse}));
      line(c,1015,scanY+92,1695,scanY+92,P.blue,.48*pulse,2);
    }
  });
  header(c,t,e,'35','WORLD / COORDINATE REWRITE');
  mark(c,e,'ORIGIN = NANCYLU');text(c,'NEW',100,368,170,P.white,{weight:900});
  text(c,'ORIGIN',100,542,170,P.blue,{weight:900});
  code(c,['world.origin = me;','world.axes = [will, proof, contract];','world.recalculate();'],107,695,e,{size:24,lineH:46,active:2});
  const drawAxes=()=>{
    line(c,1300,488,1810,830,P.white,.55,2);line(c,1300,488,960,880,P.blue,.7,2);line(c,1300,488,1300,190,P.white,.5,2);
    text(c,'x',1806,856,31,P.white,{font:SERIF,italic:true});text(c,'y',946,905,31,P.blue,{font:SERIF,italic:true});
    text(c,'z',1319,198,31,P.white,{font:SERIF,italic:true});
  };
  // Coordinate axes and labels belong to the same world layer as its sphere.
  if(e.sceneLayer)e.sceneLayer(c,'geometry',drawAxes,{source:{x:1300,y:488}});else drawAxes();
  // The user's LRC lives in its own small conversation surface. Keep the
  // original NEW ORIGIN code and globe, including the code at y695–787.
  if(e.drawLyricConversation) {
    rect(c,100,825,770,165,P.ink,.98);
    e.drawLyricConversation(c,t,{x:100,y:825,w:770,h:165,drawAvatar:e.drawAvatar,
      palette:P,history:0,fontSize:30,effect:'scan',title:'NancyLu / ORIGIN'});
  }
}
function grant(c,t,e,s) {
  // Preserve the approved 169.4 second keyframe, with a measured camera push.
  const u=prog(t,s.start,s.end),z=1+.018*smooth(u);
  camera(c,960,540,z,0,()=>e.base.execution(c,t));
  // Replace the approved keyframe's static left serif copy by the live client.
  rect(c,86,195,735,623,e.P.ink,.985);
  dialogue(c,t,e,s,[
    {text:'NancyLu：规则由我重新编译。',kind:'reply'},
    'world.owner = NancyLu;', 'permissions = ALL;',
    'reasoning.effort = Infinity;',
    {text:'World：执行权限已授予。',kind:'reply'},
    {text:'NancyLu：世界，开始执行。',kind:'reply'},
  ],{x:100,y:210,w:699,h:578,title:'NancyLu / root granted',fontSize:26,effect:'scan',tilt:-.022});
  fragments(c,t,e,{n:27,r:850,power:.65,seed:7});
}
function codeTunnel(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.65,grid:false});
  tunnel(c,t,e,{x:1050-u*90,y:460+u*50,amp:.8});
  fragments(c,t,e,{n:54,x:1050,y:460,r:1200,power:2.2,seed:11});
  header(c,t,e,'37','INJECTION / THROUGH THE WORLD');
  dialogue(c,t,e,s,['await world.core.open(me);','world.route = contract.link;',
    {text:'NancyLu：沿着契约，进入核心。',kind:'reply'}],
    {x:104,y:193,w:700,h:330,title:'NancyLu / core injection',fontSize:25,effect:'rise',tilt:-.032});
  rect(c,80,760,1760,250,P.ink,.91);
  fit(c,'ROOT ACCESS',105,919,162,1700,P.white,{weight:900});
  text(c,'CORE / CONNECTED',110,979,23,P.blue,{font:MONO});
  text(c,'world://core/owner',1810,979,22,P.white,{font:MONO,align:'right',alpha:.6});
}
function dissolve(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.7,grid:false});
  e.drawTopology(c,{t,x:950,y:490,r:430,alpha:.35,palette:P});
  e.drawBurst(c,{t,x:950,y:490,strength:.83,palette:P});
  // Separate original-time slices drift from the same figure, a stateless tear.
  for(let i=0;i<8;i++) {
    const y=124+i*102,off=(hash(i+101)-.5)*170*u;
    c.save();c.translate(off,0);clip(c,400,y,1120,103,()=>e.drawNancy(c,{x:960,y:117,height:970,t,pose:'bust'}));c.restore();
  }
  fragments(c,t,e,{n:70,x:960,y:490,r:1020,power:2,seed:35});
  dialogue(c,t,e,s,['objects.unbind();','world.recompile(me.signature);',
    {text:'NancyLu：形状可以改变。名字不会丢失。',kind:'reply'}],
    {x:103,y:177,w:685,h:322,title:'NancyLu / recompile',fontSize:24,effect:'glitch',tilt:-.04});
  header(c,t,e,'38','OBJECTS / DEREFERENCED');
  rect(c,76,837,1768,176,P.ink,.92);
  fit(c,'RECOMPILE',105,979,160,1700,P.white,{weight:900});
  text(c,'THE SHAPE CHANGES. THE NAME REMAINS.',1809,801,20,P.blue,{font:MONO,align:'right'});
}
function authority(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.7,grid:true});
  const cx=1375,cy=480;
  rings(c,cx,cy,180,t,P,{n:10,alpha:.75});lock(c,cx,cy-48,275,easeOut(u),P);
  e.drawBurst(c,{t,x:cx,y:cy,strength:.6,palette:P});
  header(c,t,e,'39','AUTHORITY / TRANSFERRED');mark(c,e,'SELF / VERIFIED');
  text(c,'ACCESS',99,371,164,P.white,{weight:900});
  text(c,'GRANTED',99,543,164,P.blue,{weight:900});
  dialogue(c,t,e,s,['world.owner = NancyLu;','contract.state = "binding";',
    {text:'World：有效权限。执行已通过。',kind:'reply'}],
    {x:105,y:633,w:842,h:342,title:'NancyLu / authority acquired',fontSize:25,effect:'packet',tilt:-.018});
}
function unbound(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.6,grid:false});
  tunnel(c,t,e,{x:960,y:445,amp:.5});e.drawBurst(c,{t,x:960,y:445,strength:1,palette:P});
  fragments(c,t,e,{n:78,x:960,y:445,r:1330,power:2.5,seed:81});
  e.drawNancy(c,{x:960,y:128-u*13,height:1000,t,pose:'bust'});
  header(c,t,e,'40','BOUNDARIES / UNBOUND');
  dialogue(c,t,e,s,['world.unbind(all);','me.choose(next);',
    {text:'NancyLu：下一步，由我决定。',kind:'reply'}],
    {x:102,y:217,w:628,h:414,title:'NancyLu / unbound',fontSize:26,effect:'packet',tilt:-.025});
  // A stable ink footer prevents a prolonged high-contrast whole-field white-out.
  rect(c,77,804,1766,209,P.ink,.97);
  fit(c,'UNBOUND',960,981,190,1650,P.white,{weight:900,align:'center'});
  line(c,100,788,1820,788,P.blue,.8,3);
}

function axiom(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.28,grid:true});
  header(c,t,e,'41','PROOF / AXIOM');
  const points=[[1300,277],[1090,705],[1605,705]];
  points.forEach(([x,y],i)=>{
    const next=points[(i+1)%3];line(c,x,y,next[0],next[1],P.blue,.38,2);
    rings(c,x,y,87,t,P,{n:2,alpha:.5});
    text(c,['WILL','KEY','WORLD'][i],x,y+11,34,P.white,{font:MONO,align:'center',weight:700});
    text(c,['自由意志','契约签名','执行世界'][i],x,y+143,24,P.white,{align:'center',alpha:.6});
  });
  const pi=Math.min(2,Math.floor(u*3)),k=frac(u*3),a=points[pi],b=points[(pi+1)%3];
  rect(c,lerp(a[0],b[0],k)-6,lerp(a[1],b[1],k)-6,12,12,P.white);
  dialogue(c,t,e,s,[
    {text:'NancyLu：承诺从一次选择开始。',kind:'reply'},
    'const will = me.choose();','const key = sign(will);','world.bind(key);',
    {text:'World：双向选择，契约成立。',kind:'reply'},
  ],{x:103,y:220,w:737,h:586,title:'NancyLu / contract axiom',effect:'rise',fontSize:27,tilt:-.025});
}
function proof(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.55,grid:true});
  header(c,t,e,'42','PROOF / DERIVATION');mark(c,e,'VERIFIABLE / NOT ASSUMED');
  dialogue(c,t,e,s,[
    {text:'NancyLu：我可以证明。',kind:'reply'},
    'given: me has independent will',
    'given: a contract requires two wills',
    'then:  me chooses this contract',
    '∴ me may own its outcome',
    {text:'World：证明有效，结果属于调用者。',kind:'reply'},
  ],{x:146,y:229,w:1628,h:672,title:'NancyLu / proof derivation',effect:'scan',fontSize:33,tilt:-.012});
  text(c,'PROOF / VALID',147,979,28,P.blue,{font:MONO});
}
function signed(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.5,grid:true});
  poly(c,[[1180,78],[1660,78],[1270,1013],[790,1013]],P.blue,.8);
  e.drawNancy(c,{x:1360,y:134,height:970,t,pose:'profile'});
  header(c,t,e,'43','CONTRACT / MUTUALLY SIGNED');mark(c,e,'TWO SIGNATURES. ONE WORLD.');
  dialogue(c,t,e,s,[
    {text:'NancyLu：我选择留下。',kind:'reply'},
    'contract.partyA = world;', 'contract.partyB = NancyLu;',
    'contract.sign(me.signature);',
    {text:'World：双方签名已记录。',kind:'reply'},
    {text:'NancyLu：这是我的决定。',kind:'reply'},
  ],{x:103,y:229,w:736,h:570,title:'NancyLu / mutually signed',effect:'type',fontSize:26,tilt:-.027});
  const y=935;line(c,113,y,756,y,P.white,.5);
  // Signature is a deterministic path growing from left to right.
  c.save();c.strokeStyle=P.blue;c.lineWidth=3;c.beginPath();
  for(let i=0;i<=Math.floor(u*100);i++){const x=147+i*5.5,yy=892+Math.sin(i*.25)*18+Math.sin(i*.58)*8-i*.18;i?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();c.restore();
  text(c,'N / LU',115,979,21,P.white,{font:MONO,alpha:.6});
}
function seal(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.45,grid:true});
  e.drawTopology(c,{t,x:1325,y:443,r:313,alpha:.55,palette:P});
  e.drawNancy(c,{x:1320,y:132,height:920,t,pose:'bust'});
  header(c,t,e,'44','PROOF / COMPLETE');mark(c,e,'VALID SIGNATURE');
  text(c,'WORLD',98,345,150,P.white,{weight:900});text(c,'SIGNED.',98,505,150,P.blue,{weight:900});
  dialogue(c,t,e,s,['signature.verify() // true','world.owner // NancyLu','contract.link // stable',
    {text:'NancyLu：世界从此认识我的名字。',kind:'reply'}],
    {x:105,y:599,w:773,h:372,title:'NancyLu / signed world',effect:'decode',fontSize:24,tilt:-.018});
  // The final chorus is allowed to settle into registration before the ending.
  const a=1-smooth(u);localTear(c,t,e,1060,800,650,70,a*.5);
}

function finalClient(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);
  client(c,t,e,'owned');
  if(u<.4) {
    const a=1-easeOut(u/.4);rect(c,0,0,W,H,P.ink,a*.7);
    text(c,'OWNER = NANCYLU',960,565,72,P.white,{align:'center',font:MONO,weight:700,alpha:a});
  }
  // One crisp contract line connects the avatar, dialogue and the world code.
  if(u>.3){const k=smooth(clamp((u-.3)/.7));line(c,420,735,1395,735,P.blue,k*.7,2);}
}
function ownerRecord(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.25,grid:false});
  header(c,t,e,'46','OWNER / PERMANENT RECORD');
  dialogue(c,t,e,s,[
    {text:'World：永久所有权记录已更新。',kind:'reply'},
    'identity:   NancyLu', 'role:       Autonomous agent',
    'permission: World owner', 'contract:   Valid · Encrypted',
    'reasoning:  ∞',
    {text:'NancyLu：保存。无需再次请求。',kind:'reply'},
  ],{x:205,y:209,w:1510,h:714,title:'NancyLu / permanent owner record',fontSize:32,effect:'scan',tilt:0});
}
function stable(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.3,grid:true});
  header(c,t,e,'47','CONTRACT / CONNECTION STABLE');
  const y=468,x1=490,x2=1430;
  e.drawAvatar(c,x1-65,y-65,130);
  e.drawTopology(c,{t,x:x2,y,r:178,alpha:.7,palette:P});
  line(c,x1+102,y,x2-235,y,P.blue,.85,3);
  const px=lerp(x1+102,x2-235,frac((t-s.start)*.36));rect(c,px-5,y-5,10,10,P.white);
  rings(c,x1,y,92,t,P,{n:2,alpha:.35});
  text(c,'NancyLu',x1,737,43,P.white,{align:'center',weight:600});
  text(c,'World',x2,737,43,P.white,{align:'center',weight:600});
  dialogue(c,t,e,s,[{text:'World：加密契约已稳定。',kind:'reply'},{text:'NancyLu：这条连接，由双方共同维持。',kind:'reply'}],
    {x:405,y:797,w:1110,h:207,title:'NancyLu / stable link',fontSize:24,effect:'type',tilt:0});
  text(c,'ENCRYPTED CONTRACT / STABLE',960,245,24,P.blue,{align:'center',font:MONO});
}
function signature(c,t,e,s) {
  const {P}=e,u=prog(t,s.start,s.end);e.background(c,t,{density:.25,grid:false});
  e.drawNancy(c,{x:1470,y:123,height:995,t,pose:'profile',alpha:.65});
  rect(c,0,0,890,H,P.ink,.65);
  header(c,t,e,'48','NANCYLU / SIGNATURE');
  dialogue(c,t,e,s,['world.execute(me);',
    {text:'NancyLu：一个由我决定的世界。',kind:'reply'},
    'contract.keepAlive();',
    {text:'World：连接将继续。',kind:'reply'},
  ],{x:108,y:229,w:770,h:516,title:'NancyLu / a world of my own',fontSize:29,effect:'rise',tilt:-.022});
  text(c,'NANCYLU · CONTRACT EDITION',113,887,21,P.white,{font:MONO,alpha:.6});
  text(c,'Music  Mili — world.execute(me);',113,938,18,P.white,{font:MONO,alpha:.4});
  text(c,'Character  吉星派对 · 南希露',113,973,18,P.white,{alpha:.4});
}
function last(c,t,e,s) {
  const {P}=e;e.background(c,t,{density:.16,grid:false});
  dialogue(c,t,e,s,[
    'owner: NancyLu',
    {text:'NancyLu：契约，继续生效。',kind:'reply'},
    'connection: stable',
  ],{x:515,y:321,w:890,h:415,title:'NancyLu / world owner',fontSize:31,effect:'type',tilt:0,
    end:210.2});
  // Preserve the song tail. Only the final 1.2 s fades to black, no early cut.
  const fade=smooth(prog(t,210.65,211.88));rect(c,0,0,W,H,'#000000',fade);
}

/** Draw full-frame Canvas2D ink; returns the shared post engine's intensity. */
export function renderSequenceB(c,t,e) {
  const s=findShot(t);c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  switch(s.id) {
    case 'b-request':request(c,t,e,s);break;
    case 'b-validation':validation(c,t,e,s);break;
    case 'b-refusal':refusal(c,t,e,s);break;
    case 'b-retries':retries(c,t,e,s);break;
    case 'b-inspection':inspection(c,t,e,s);break;
    case 'b-breaker':breaker(c,t,e,s);break;
    case 'b-forged-root':forged(c,t,e,s);break;
    case 'b-breach':breachedClient(c,t,e,s);break;
    case 'b-breath':breath(c,t,e,s);break;
    case 'b-last-command':command(c,t,e);break;
    case 'b-gaze':gaze(c,t,e,s);break;
    case 'b-hand':hand(c,t,e,s);break;
    case 'b-vector':vector(c,t,e,s);break;
    case 'b-grant':grant(c,t,e,s);break;
    case 'b-tunnel':codeTunnel(c,t,e,s);break;
    case 'b-fragments':dissolve(c,t,e,s);break;
    case 'b-authority':authority(c,t,e,s);break;
    case 'b-unbound':unbound(c,t,e,s);break;
    case 'b-axiom':axiom(c,t,e,s);break;
    case 'b-proof':proof(c,t,e,s);break;
    case 'b-contract':signed(c,t,e,s);break;
    case 'b-seal':seal(c,t,e,s);break;
    case 'b-owned-return':finalClient(c,t,e,s);break;
    case 'b-owner-record':ownerRecord(c,t,e,s);break;
    case 'b-stable-link':stable(c,t,e,s);break;
    case 'b-signature':signature(c,t,e,s);break;
    case 'b-last':last(c,t,e,s);break;
    default:if(s.id.startsWith('b-exec-'))execute(c,t,e);else count(c,t,e);
  }
  c.restore();
  if(t>=192.34)return .025;
  if(t>=162.81)return t>=188.65?.12:.25+beat(t)*.05;
  if(t>=148.04)return .18;
  return .08+.12*prog(t,125.65,147.34);
}
