/**
 * Floating NancyLu conversation plates for the PV.
 * Time values (`t`, `start`, `end`, line `at`/`until`) are absolute song seconds.
 * No frame counter, random generator, DOM, or wall clock is used here.
 */

const MONO = '"JetBrains Mono",Consolas,"Microsoft YaHei",monospace';
const SANS = '"Inter","Segoe UI","Microsoft YaHei",sans-serif';
const DEFAULT = { ink:'#080d15', white:'#f2f5f7', blue:'#48baff' };
const EFFECTS = new Set(['type','decode','scan','rise','packet','glitch']);
const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
const fract = x => x-Math.floor(x);
const hash = n => fract(Math.sin(n*127.1+311.7)*43758.5453123);
const alphabet = '01{}[]<>/=+;:_';
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter(undefined,{granularity:'grapheme'}) : null;
const graphemes = text => segmenter
  ? [...segmenter.segment(String(text))].map(p=>p.segment) : Array.from(String(text));
const layouts = new Map();

// CSS ease-out cubic-bezier(.23,1,.32,1), evaluated for absolute-time Canvas.
function easeOut(p) {
  if(p<=0) return 0;
  if(p>=1) return 1;
  const x = clamp(p); let lo=0,hi=1,u=x;
  for(let i=0;i<12;i++) {
    const a=1-u, bx=3*a*a*u*.23+3*a*u*u*.32+u*u*u;
    if(bx<x) lo=u; else hi=u;
    u=(lo+hi)*.5;
  }
  return 1-(1-u)**3;
}

function stroke(c,x,y,xx,yy,color,alpha=1,width=1) {
  c.save(); c.globalAlpha*=alpha; c.strokeStyle=color; c.lineWidth=width;
  c.beginPath(); c.moveTo(x,y); c.lineTo(xx,yy); c.stroke(); c.restore();
}
function disc(c,x,y,r,color,alpha=1) {
  c.save(); c.globalAlpha*=alpha; c.fillStyle=color;
  c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); c.restore();
}
function label(c,text,x,y,size,color,font=MONO) {
  c.font=`400 ${size}px ${font}`; c.fillStyle=color; c.fillText(text,x,y);
}

/** Measure and wrap once, retaining source indices for exact seekable reveals. */
function layout(c,text,font,width,lineHeight) {
  const key=`${font}\u0000${width}\u0000${lineHeight}\u0000${text}`;
  if(layouts.has(key)) return layouts.get(key);
  const chars=graphemes(text), glyphs=[];
  c.save(); c.font=font;
  const sizes=chars.map(s=>s==='\n'?0:c.measureText(s).width);
  c.restore();
  let x=0,row=0,index=0;
  while(index<chars.length) {
    if(chars[index]==='\n') { row++; x=0; index++; continue; }
    // Keep a word together when it fits. Long code tokens break at glyphs.
    let stop=index+1;
    const space=/\s/u.test(chars[index]);
    while(stop<chars.length && chars[stop]!=='\n' && /\s/u.test(chars[stop])===space) stop++;
    const tokenWidth=sizes.slice(index,stop).reduce((s,v)=>s+v,0);
    if(!space && x>0 && tokenWidth<=width && x+tokenWidth>width) { row++; x=0; }
    for(;index<stop;index++) {
      const ch=chars[index],advance=sizes[index];
      if(x>0 && x+advance>width) { row++; x=0; }
      // A wrapped leading space still consumes source time, but no screen space.
      if(x===0 && /\s/u.test(ch)) continue;
      glyphs.push({char:ch,index,x,y:row*lineHeight,width:advance,row});
      x+=advance;
    }
  }
  const result={glyphs,count:chars.length,rows:row+1,height:(row+1)*lineHeight,
    width:glyphs.reduce((n,g)=>Math.max(n,g.x+g.width),0)};
  layouts.set(key,result);
  if(layouts.size>160) layouts.delete(layouts.keys().next().value);
  return result;
}

/**
 * Individually revealed glyphs. Exported for captions already inside a client.
 * `progress` (0..1) or `chars` (source glyph count) may drive LRC-aligned reveals.
 * `start`/`end` remain the fallback timing, with no accumulated frame state.
 */
export function drawGlyphText(c,{
  text='',x=0,y=0,maxWidth=600,fontSize=30,lineHeight=fontSize*1.48,
  font=SANS,weight=400,t=0,start=0,end=start+3,effect='type',
  progress,chars,color=DEFAULT.white,activeColor=DEFAULT.blue,
  alpha=1,seed=0,cursor=true,
}={}) {
  const face=`${weight} ${fontSize}px ${font}`;
  const L=layout(c,String(text),face,Math.max(1,maxWidth),lineHeight);
  const duration=Math.max(.001,end-start), phase=clamp((t-start)/duration);
  const position=Number.isFinite(chars)?clamp(chars,0,L.count)
    : Number.isFinite(progress)?clamp(progress)*L.count : phase*L.count;
  const perGlyph=duration/Math.max(1,L.count);
  const active=EFFECTS.has(effect)?effect:'type';
  let cursorGlyph=null;
  c.save(); c.globalAlpha*=clamp(alpha); c.font=face;
  c.textAlign='left'; c.textBaseline='alphabetic';
  if('fontKerning' in c) c.fontKerning='none';
  for(const g of L.glyphs) {
    const visible=position-g.index;
    // Decode previews only two glyphs ahead. Everything else stays absent.
    if(visible<=0 && !(active==='decode' && visible>-2 && t>=start)) continue;
    const age=visible*perGlyph;
    const settled=position>=L.count || age>=.18;
    let dx=0,dy=0,a=1,ch=g.char;
    if(active==='decode' && !settled) {
      const tick=Math.floor((t-start)*24);
      const lock=age>=.105;
      ch=lock?ch:alphabet[Math.floor(hash(seed+g.index*13+tick)*alphabet.length)];
      a=visible>0?1:.24;
    } else if(visible<=0) continue;
    const entry=easeOut(age/.18);
    if(active==='rise') { dy=(1-entry)*fontSize*.36; a=entry; }
    else if(active==='packet') {
      dx=(1-entry)*fontSize*(Math.floor(g.index/3)%2?-.55:.55);
      a=clamp(age/.07);
    } else if(active==='type') a=clamp(age/.045);
    else if(active==='scan') a=clamp(age/.075);
    else if(active==='glitch') {
      const disturbance=age>=0 && age<.075;
      dx=disturbance?(Math.floor(g.index)%2?1:-1)*fontSize*.14*(1-age/.075):0;
      a=clamp(age/.025);
    }
    const gx=x+g.x+dx,gy=y+g.y+dy;
    c.save(); c.globalAlpha*=clamp(a);
    c.fillStyle=settled?color:activeColor;
    if(active==='scan' && !settled) {
      const open=clamp(age/.16);
      c.beginPath(); c.rect(gx-1,gy-fontSize*1.05,
        Math.max(1,g.width+2)*open,fontSize*1.35); c.clip();
    }
    if(active==='glitch' && age>=0 && age<.075) {
      c.save(); c.globalAlpha*=.25; c.fillStyle=color;
      c.fillText(ch,gx-2*dx,gy-1); c.restore();
    }
    c.fillText(ch,gx,gy);
    if(active==='rise' && !settled) {
      c.globalAlpha*=.45*(1-entry); c.fillRect(gx,gy+5,g.width,1);
    }
    if(active==='packet' && !settled && g.index%3===0) {
      c.globalAlpha*=.24*(1-entry); c.strokeStyle=activeColor;
      c.lineWidth=1; c.strokeRect(gx-4,gy-fontSize,Math.max(g.width,1)*2.7,fontSize*1.28);
    }
    c.restore();
    if(visible>0) cursorGlyph=g;
  }
  if(cursor && cursorGlyph && position<L.count && t>=start) {
    const g=cursorGlyph;
    // A soft breathing caret; never turns the whole line on and off.
    c.globalAlpha*=.62+.2*Math.sin((t-start)*Math.PI*2);
    c.fillStyle=activeColor;
    c.fillRect(x+g.x+g.width+4,y+g.y-fontSize*.82,2,fontSize);
  }
  c.restore();
  return {...L,visibleCount:Math.floor(position),complete:position>=L.count,
    bottom:y+(L.rows-1)*lineHeight+fontSize*.28};
}

function schedule(lines,start,end) {
  const normalized=lines.map(line=>typeof line==='string'?{text:line}:line||{text:''});
  const weights=normalized.map(line=>Math.max(6,graphemes(line.text??'').length));
  const total=weights.reduce((a,b)=>a+b,0)||1;
  let consumed=0;
  const starts=normalized.map((line,i)=>{
    const at=Number.isFinite(line.at)?line.at:start+(end-start)*consumed/total;
    consumed+=weights[i]; return at;
  });
  // Explicit line anchors define the pace of the next reply.
  for(let i=1;i<starts.length;i++) starts[i]=Math.max(starts[i-1],starts[i]);
  return normalized.map((line,i)=>{
    const next=starts[i+1]??end;
    const available=Math.max(.15,next-starts[i]);
    return {...line,text:String(line.text??''),at:starts[i],
      typedBy:starts[i]+available*.82,
      until:Number.isFinite(line.until)?line.until:Infinity};
  });
}

/**
 * Blue/white Codex-style dialogue plate. Height stays explicit so callers can
 * reserve a composition-safe region; overflowing conversation scrolls upward.
 * A line's `at` is when it begins typing, `until` optionally removes it.
 * Per-line `effect`, `kind`, `fontSize`, `chars`, and `progress` override defaults.
 */
export function drawDialogue(c,{
  x=90,y=180,w=700,h=540,t=0,start=0,end=start+4,title='NancyLu',lines=[],
  effect='type',fontSize=30,tilt=0,alpha=1,palette=DEFAULT,drawAvatar,
  footer='contract context retained',progress,chars,
}={}) {
  const P={...DEFAULT,...palette};
  const width=Math.max(180,w),height=Math.max(164,h),header=38,pad=30;
  const compact=height<260;
  const contentTop=header+(compact?20:34),contentBottom=height-(compact?42:58),contentHeight=contentBottom-contentTop;
  const q=schedule(lines,start,end);
  const active=q.filter(line=>t>=line.at && t<line.until);
  const measured=active.map((line,i)=>{
    const size=line.fontSize??(line.kind==='label'?fontSize*.64:fontSize);
    const family=line.kind==='code'||line.kind==='label'?MONO:SANS;
    const leading=size*(line.kind==='code'?1.48:1.42);
    const L=layout(c,line.text,`400 ${size}px ${family}`,width-pad*2,leading);
    return {line,size,family,leading,L,gap:compact?8:line.kind==='label'?14:25,index:i};
  });
  const bodyHeight=measured.reduce((n,m)=>n+m.L.height+m.gap,0);
  const overflow=Math.max(0,bodyHeight-contentHeight);
  c.save(); c.globalAlpha*=clamp(alpha);
  c.translate(x+width*.5,y+height*.5); c.rotate(tilt);
  c.translate(-width*.5,-height*.5);
  c.fillStyle=P.ink; c.fillRect(0,0,width,height);
  c.fillStyle='rgba(72,186,255,.045)'; c.fillRect(0,0,width,header);
  c.strokeStyle='rgba(242,245,247,.27)'; c.lineWidth=1.3;
  c.strokeRect(.65,.65,width-1.3,height-1.3);
  stroke(c,0,header,width,header,P.blue,.43);
  // Traffic lights remain neutral/blue to preserve the film's three-ink palette.
  for(let i=0;i<3;i++) disc(c,19+i*14,19,3,i===0?P.blue:P.white,i===0?.85:.3);
  let hx=70;
  if(drawAvatar) { drawAvatar(c,hx,7,24); hx+=35; }
  c.textBaseline='alphabetic'; c.textAlign='left';
  label(c,title,hx,25,17,P.white);
  const status=t<end?'STREAMING':'CONTEXT SAVED';
  c.font=`400 11px ${MONO}`;
  const statusWidth=c.measureText(status).width;
  if(width>360) label(c,status,width-statusWidth-23,24,11,P.blue);
  c.save();
  c.beginPath(); c.rect(pad,header+9,width-pad*2,contentBottom-header-3); c.clip();
  let cy=contentTop-overflow;
  for(const {line,size,family,leading,L,gap,index} of measured) {
    const lineProgress=Number.isFinite(line.progress)?line.progress
      : Number.isFinite(progress)?progress:undefined;
    const lineChars=Number.isFinite(line.chars)?line.chars
      : Number.isFinite(chars)&&measured.length===1?chars:undefined;
    drawGlyphText(c,{
      text:line.text,x:pad,y:cy+size,maxWidth:width-pad*2,fontSize:size,
      lineHeight:leading,font:family,t,start:line.at,end:line.typedBy,
      effect:line.effect??effect,progress:lineProgress,chars:lineChars,
      color:line.kind==='label'?P.blue:P.white,activeColor:P.blue,
      alpha:line.kind==='label'?.8:1,seed:index*101+Math.floor(start*130),
      cursor:index===measured.length-1&&line.kind!=='label',
    });
    cy+=L.height+gap;
  }
  c.restore();
  const railY=height-24;
  stroke(c,pad,railY,width-pad,railY,P.white,.2);
  const meter=Number.isFinite(progress)?clamp(progress):clamp((t-start)/Math.max(.001,end-start));
  stroke(c,pad,railY,pad+(width-pad*2)*meter,railY,P.blue,.86,1.5);
  if(footer) {
    c.save(); c.globalAlpha*=.52; c.beginPath(); c.rect(pad,height-56,width-pad*2,22); c.clip();
    label(c,footer,pad,height-40,11,P.white); c.restore();
  }
  c.restore();
  return {x,y,w:width,h:height,bottom:y+height,contentBottom:y+contentBottom,
    lineCount:active.length,overflow};
}
