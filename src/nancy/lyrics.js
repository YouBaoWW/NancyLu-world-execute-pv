/** User-supplied LRC, rendered as a conversation rather than a subtitle strip. */
import { drawDialogue, drawGlyphText } from './dialogue.js';

const SANS='"Inter","Segoe UI","Microsoft YaHei",sans-serif';
const MONO='"JetBrains Mono",Consolas,"Microsoft YaHei",monospace';
const P0={ink:'#080d15',white:'#f2f5f7',blue:'#48baff'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
let entries=[],ready=false,pending=null;

/** Line anchors come from the user's file. Character timing is an estimate. */
export async function loadLyrics() {
  if(ready) return entries;
  if(pending) return pending;
  pending=(async()=>{
    const response=await fetch(new URL('../../data/lyrics-user.json',import.meta.url));
    if(!response.ok) throw new Error(`User lyric data unavailable (${response.status})`);
    const data=await response.json();
    entries=(data.lines??data).map((line,index)=>{
      const glyphs=Array.from(line.text);
      // Vowels carry the melodic hold; spaces and word boundaries pass quickly.
      const weights=glyphs.map(ch=>/\s/u.test(ch)?.22:/[aeiouy]/iu.test(ch)?1.22:/[.,;:!?\-]/u.test(ch)?.4:.76);
      const stops=[0];
      for(const weight of weights) stops.push(stops[stops.length-1]+weight);
      return {...line,index,glyphs,stops,total:stops[stops.length-1]||1};
    }).sort((a,b)=>a.start-b.start);
    ready=true;
    return entries;
  })();
  try { return await pending; } catch(error) { pending=null; throw error; }
}

function charsAt(line,t) {
  const p=clamp((t-line.start)/Math.max(.001,line.end-line.start));
  if(p>=1) return line.glyphs.length;
  const target=p*line.total;
  let low=0,high=line.stops.length-1;
  while(low+1<high) {
    const mid=(low+high)>>1;
    if(line.stops[mid]<=target) low=mid; else high=mid;
  }
  return low+clamp((target-line.stops[low])/Math.max(.001,line.stops[low+1]-line.stops[low]));
}

function expose(line,t,complete=false) {
  return {index:line.index,text:line.text,start:line.start,end:line.end,
    chars:complete?line.glyphs.length:charsAt(line,t),
    role:line.role,effect:line.effect,keyword:line.keyword,
    active:t>=line.start&&t<line.end};
}

/** Previous five complete lines plus the current line; safe at every seek. */
export function lyricContext(t) {
  if(!ready||!entries.length) return {ready,current:null,recent:[]};
  let low=0,high=entries.length;
  while(low<high) {
    const mid=(low+high)>>1;
    if(entries[mid].start<=t) low=mid+1; else high=mid;
  }
  const index=low-1;
  if(index<0) return {ready,current:null,recent:[]};
  return {ready,current:expose(entries[index],t),
    recent:entries.slice(Math.max(0,index-5),index).map(line=>expose(line,t,true))};
}

/** A floating terminal/conversation plate for mathematical and portrait scenes. */
export function drawLyricConversation(ctx,t,{
  x=90,y=180,w=700,h=540,drawAvatar,palette=P0,effect,title='NancyLu / CONTRACT',
  tilt=-.012,fontSize=30,history=3,footer='encrypted conversation / context retained',
}={}) {
  const context=lyricContext(t),current=context.current;
  if(!current) return null;
  const messages=h<260?[current]:[...context.recent.slice(-Math.max(0,history)),current];
  const lines=[];
  messages.forEach((message,index)=>{
    const live=index===messages.length-1;
    if(h>=260)lines.push({text:message.role==='USER'?'YOU / REQUEST':'NancyLu / RESPONSE',kind:'label',
      at:message.start,chars:100,fontSize:13});
    lines.push({text:message.text,kind:message.keyword?'code':'reply',at:message.start,
      chars:live?message.chars:Array.from(message.text).length,
      effect:live?(effect??message.effect):'type',fontSize:live?fontSize:Math.max(19,fontSize*.73)});
  });
  return drawDialogue(ctx,{x,y,w,h,t,start:messages[0].start,end:current.end,
    title,lines,effect:effect??current.effect,palette,drawAvatar,tilt,footer});
}

function rounded(ctx,x,y,w,h,r) {
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function label(ctx,text,x,y,size,color,font=MONO) {
  ctx.fillStyle=color;ctx.font=`400 ${size}px ${font}`;
  ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(text,x,y);
}

// Same word/glyph wrapping rules as the reveal helper, used only to reserve room.
function rowsFor(ctx,text,width,size) {
  ctx.save();ctx.font=`400 ${size}px ${SANS}`;
  const tokens=String(text).match(/\S+|\s+/gu)||[];
  let rows=1,x=0;
  for(const token of tokens) {
    const tokenWidth=ctx.measureText(token).width;
    if(!/^\s+$/u.test(token)&&x>0&&tokenWidth<=width&&x+tokenWidth>width) {rows++;x=0;}
    for(const ch of Array.from(token)) {
      const advance=ctx.measureText(ch).width;
      if(x>0&&x+advance>width) {rows++;x=0;}
      if(x===0&&/\s/u.test(ch)) continue;
      x+=advance;
    }
  }
  ctx.restore();return rows;
}

/**
 * Conversation body only. It fits inside an existing client, with no duplicate
 * title/composer/toolbars. A USER line types in the real composer, then sends.
 */
export function drawClientMessages(ctx,t,{
  x=357,y=283,w=990,h=432,drawAvatar,palette=P0,
}={}) {
  const P={...P0,...palette},context=lyricContext(t),current=context.current;
  if(!context.ready) return false;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  if(!current) {
    ctx.globalAlpha*=.5;label(ctx,'Waiting for the first instruction…',x+4,y+42,20,P.white,SANS);
    ctx.restore();return true;
  }
  const composing=current.role==='USER'&&t<current.end;
  const messages=[...context.recent.slice(-4),...(composing?[]:[current])];
  const items=messages.map(message=>{
    const live=message.index===current.index;
    const user=message.role==='USER',size=live?29:23;
    const leading=size*1.42,bw=user?w*.79:w-64,tw=user?bw-44:bw-15;
    const rows=rowsFor(ctx,message.text,tw,size);
    return {message,live,user,size,leading,bw,tw,height:rows*leading+(user?47:49),gap:23};
  });
  const body=items.reduce((s,item)=>s+item.height+item.gap,0);
  const lastHeight=items.length&&items[items.length-1].live?items[items.length-1].height+items[items.length-1].gap:0;
  const nextOverflow=Math.max(0,body-h+8),oldOverflow=Math.max(0,body-lastHeight-h+8);
  const addedAt=current.role==='USER'?current.end:current.start;
  const p=clamp((t-addedAt)/.22),ease=1-(1-p)**3;
  let yy=y-(oldOverflow+(nextOverflow-oldOverflow)*ease);
  for(const item of items) {
    const {message,live,user,size,leading,bw,tw,height,gap}=item;
    ctx.save();ctx.globalAlpha*=live?1:.62;
    const bx=user?x+w-bw-2:x+53;
    if(user) {
      ctx.fillStyle='#152332';ctx.strokeStyle='#2b4861';ctx.lineWidth=1;
      rounded(ctx,bx,yy+18,bw,height-11,11);ctx.fill();ctx.stroke();
      label(ctx,'YOU',bx+18,yy+10,10,P.blue);
    } else {
      if(drawAvatar) drawAvatar(ctx,x,yy+1,34);
      else {ctx.fillStyle=P.blue;ctx.fillRect(x+8,yy+8,17,17);}
      label(ctx,'NancyLu',bx,yy+18,15,P.white,SANS);
      label(ctx,live&&current.active?'REPLYING':'CONTEXT',bx+93,yy+17,9,P.blue);
    }
    drawGlyphText(ctx,{text:message.text,x:bx+(user?22:0),y:yy+size+37,
      maxWidth:tw,fontSize:size,lineHeight:leading,font:SANS,t,
      start:message.start,end:message.end,
      chars:live?message.chars:Array.from(message.text).length,
      effect:live?message.effect:'type',color:P.white,activeColor:P.blue,
      cursor:live&&!user&&current.active,seed:message.index*103});
    ctx.restore();yy+=height+gap;
  }
  if(composing) {
    ctx.globalAlpha*=.65;
    label(ctx,'YOU · composing an instruction',x+w-300,y+h-8,12,P.blue);
  }
  ctx.restore();return true;
}
