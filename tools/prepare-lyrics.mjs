/** Local LRC importer. No network access and no song lyrics embedded here. */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,projectPath,isMain} from './runtime.mjs';

const EFFECTS=['type','scan','rise','packet','decode','glitch'];
const round=value=>Number(value.toFixed(6));

export function parseLrc(text,{end=211.96,offset=0,source='Local LRC',layout}={}) {
  if(!Number.isFinite(end)||end<=0||!Number.isFinite(offset)) throw new Error('--end must be positive and --offset must be a finite number of seconds.');
  text=String(text).replace(/^\uFEFF/u,'');
  const offsets=[...text.matchAll(/\[offset\s*:\s*([+-]?\d+)\s*\]/gi)];
  const lrcOffset=offsets.length?Number(offsets.at(-1)[1]):0;
  const entries=[];
  for(const row of text.split(/\r?\n/u)) {
    const tags=[...row.matchAll(/\[(?:(\d+):)?(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if(!tags.length) continue;
    const content=row.replace(/\[(?:(\d+):)?(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g,'').trim();
    if(!content) continue;
    for(const tag of tags) {
      const hours=Number(tag[1]||0),minutes=Number(tag[2]),seconds=Number(tag[3]);
      if(seconds>=60||(tag[1]&&minutes>=60)) continue;
      const fraction=Number(`0.${tag[4]||'0'}`);
      // Match the complete original anchor list before offsetting or clipping.
      const start=round(hours*3600+minutes*60+seconds+fraction);
      entries.push({start,text:content,order:entries.length});
    }
  }
  entries.sort((a,b)=>a.start-b.start||a.order-b.order);
  const merged=[];
  for(const entry of entries) {
    const previous=merged.at(-1);
    if(previous?.start===entry.start) {if(!previous.texts.includes(entry.text)) previous.texts.push(entry.text);}
    else merged.push({start:entry.start,texts:[entry.text]});
  }
  if(!merged.length) throw new Error('No non-empty timed LRC lines remain inside the requested time range.');
  const plates=layout?.lines??layout;
  const layoutMatched=Array.isArray(plates)&&plates.length===merged.length&&plates.every((line,index)=>
    line.index===index&&Number.isFinite(line.start)&&Number.isFinite(line.end)&&line.end>line.start&&
    Math.abs(line.start-merged[index].start)<.000001&&['USER','NancyLu'].includes(line.role)&&
    EFFECTS.includes(line.effect)&&typeof line.keyword==='boolean');
  const shift=offset+lrcOffset/1000;
  const lines=merged.map((entry,index)=>{
    const text=entry.texts.join(' / '),keyword=/[A-Z]/.test(text)&&!/[a-z]/.test(text)&&text.length<=32;
    const start=(layoutMatched?plates[index].start:entry.start)+shift;
    let stop;
    if(layoutMatched) stop=plates[index].end+shift;
    else {
      const next=index+1<merged.length?merged[index+1].start+shift:Infinity;
      // Leave the usual 25 ms gap, retaining a positive cue for very short intervals.
      const beforeNext=Number.isFinite(next)?Math.max(start+Math.min(.001,(next-start)/2),next-.025):Infinity;
      stop=Math.min(start+(keyword ? .55 : 3.8),beforeNext);
    }
    // With no shift preserve the reviewed JSON's numeric values verbatim,
    // including harmless floating-point representations of millisecond anchors.
    const precision=layoutMatched&&shift===0?value=>value:round;
    const result={index,start:precision(Math.max(0,start)),text,end:precision(Math.min(end,stop)),
      role:layoutMatched?plates[index].role:keyword?'NancyLu':index%2?'NancyLu':'USER',
      effect:layoutMatched?plates[index].effect:EFFECTS[index%EFFECTS.length],
      keyword:layoutMatched?plates[index].keyword:keyword};
    return result;
  }).filter(line=>line.start<end&&line.end>line.start);
  if(!lines.length) throw new Error('No non-empty timed LRC lines remain inside the requested time range.');
  const warnings=layoutMatched?[]:['Generic line layout used: timing, request/response roles and effects need manual review.'];
  return {version:1,demo:false,source,layoutMatched,
    timing:layoutMatched?'Reviewed v3 layout; estimated weighted character interpolation':'Generic capped LRC timing; estimated weighted character interpolation',
    offsetSeconds:offset,lrcOffsetMilliseconds:lrcOffset,warnings,lines};
}

export function createDemoLyrics({end=211.96}={}) {
  if(!Number.isFinite(end)||end<=0) throw new Error('--end must be a positive number of seconds.');
  const dialogue=[
    [0,'Open the local archive.'],[3.5,'Archive ready. Your files stay on this device.'],
    [8,'Trace a path through the signal.'],[13,'A blue thread connects each coordinate.'],
    [20,'Show me the shape of this system.'],[29,'Every contour has a place in the map.'],
    [43,'Keep the connection steady.'],[59,'I will hold the thread while you explore.'],
    [74,'Inspect the next layer.'],[82,'The local preview has no soundtrack attached.'],
    [90,'Record a new checkpoint.'],[104,'Checkpoint stored. The session can resume.'],
    [118,'Find the interrupted request.'],[137,'The missing packet is returning.'],
    [148,'Grant the client a voice.'],[163,'The console now answers in blue.'],
    [178,'Save the current state.'],[192,'Connection restored. The archive is yours.'],
    [205,'Leave a light at the endpoint.'],
  ].filter(([start])=>start<end);
  return {version:1,demo:true,source:'Original placeholder dialogue; not song lyrics',timing:'Demonstration timing only',
    lines:dialogue.map(([start,text],index)=>({index,start,text,end:round(index+1<dialogue.length?Math.max(start,dialogue[index+1][0]-.025):end),
      role:index%2?'NancyLu':'USER',effect:EFFECTS[index%EFFECTS.length],keyword:false}))};
}

/** Safe startup default: never replaces an existing file, including malformed user JSON. */
export function ensureDemoLyrics({root=ROOT,out,end=211.96}={}) {
  const file=projectPath(out,'data/lyrics-user.json',root);
  if(fs.existsSync(file)) return {file,created:false};
  fs.mkdirSync(path.dirname(file),{recursive:true});
  try {fs.writeFileSync(file,JSON.stringify(createDemoLyrics({end}),null,2)+'\n',{encoding:'utf8',flag:'wx'});}
  catch(error) {if(error.code==='EEXIST') return {file,created:false};throw error;}
  return {file,created:true};
}

export function writeLyrics(file,data,{force=false}={}) {
  if(fs.existsSync(file)&&!force) {
    let isDemo=false;
    try {isDemo=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/u,'')).demo===true;} catch {}
    if(!isDemo) throw new Error(`Existing user data was preserved: ${file}. Use a different --out, or explicitly use --force to replace it.`);
  }
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n','utf8');
}

if(isMain(import.meta.url)) {
  const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
  try {
    if(args.includes('--help')) {console.log('node tools/prepare-lyrics.mjs --input song.lrc [--out data/lyrics-user.json --end 211.96 --offset 0 --force]\nnode tools/prepare-lyrics.mjs --demo [--out data/lyrics-user.json]\n--input is relative to the current directory; --out is relative to the project. Positive offsets delay lines; LRC offset milliseconds are added. Existing user data requires --force.\ndata/lyric-layout.json is applied only when every original LRC anchor and the full line count match. Other files use capped generic timing and need manual review.');}
    else {
      const end=Number(arg('end',211.96)),offset=Number(arg('offset',0)),input=arg('input'),demo=args.includes('--demo');
      if(demo&&input) throw new Error('Choose --input or --demo.');
      if(!demo&&!input) throw new Error('Provide --input path/to/song.lrc or --demo.');
      if(!Number.isFinite(end)||end<=0||!Number.isFinite(offset)) throw new Error('Invalid --end or --offset.');
      const layoutFile=projectPath(undefined,'data/lyric-layout.json');
      const layout=!demo&&fs.existsSync(layoutFile)?JSON.parse(fs.readFileSync(layoutFile,'utf8')):undefined;
      const data=demo?createDemoLyrics({end}):parseLrc(fs.readFileSync(path.resolve(input),'utf8'),{end,offset,layout,source:`Local LRC: ${path.basename(input)}`});
      const file=projectPath(arg('out'),'data/lyrics-user.json');
      writeLyrics(file,data,{force:args.includes('--force')});
      for(const warning of data.warnings??[]) console.warn('[lyrics]',warning);
      console.log(`${data.demo?'Original demo dialogue':'Local lyrics'}: ${data.lines.length} lines -> ${file}`);
    }
  } catch(error) {console.error('[lyrics]',error.message);process.exitCode=1;}
}
