/** Verify the delivered MP4's sample timing, decode every frame and check H.264/AAC/color tags.
 * node tools/verify-nancy.mjs [file.mp4] [--frames 13018 --fps 60 --width 1920 --height 1080]
 * Uses project toolchain/ffmpeg.exe or NANCY_FFMPEG; ffprobe is not required.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ROOT,findFfmpeg} from './runtime.mjs';
const args=process.argv.slice(2),arg=(n,d)=>{const i=args.indexOf('--'+n);return i<0?d:args[i+1]};
const input=path.resolve(ROOT,args[0]&&!args[0].startsWith('--')?args[0]:'outputs/NancyLu_world_execute_1080p60.mp4');
const manifest=fs.existsSync(input+'.render.json')?JSON.parse(fs.readFileSync(input+'.render.json','utf8')):{};
const expected={width:Number(arg('width',manifest.width??1920)),height:Number(arg('height',manifest.height??1080)),fps:Number(arg('fps',manifest.fps??60)),frames:Number(arg('frames',manifest.frames??13018))};
const ffmpeg=findFfmpeg();
const bytes=fs.readFileSync(input),u32=(p)=>bytes.readUInt32BE(p);
function boxes(start,end){const result=[];for(let p=start;p+8<=end;){const short=u32(p),size=short===1?Number(bytes.readBigUInt64BE(p+8)):short===0?end-p:short,header=short===1?16:8;if(size<header||p+size>end)throw new Error('Invalid MP4 box at '+p);result.push({name:bytes.toString('ascii',p+4,p+8),start:p,body:p+header,end:p+size,size});p+=size}return result}
const children=b=>boxes(b.body,b.end),child=(b,n)=>children(b).find(x=>x.name===n);
const top=boxes(0,bytes.length),moov=top.find(x=>x.name==='moov');if(!moov)throw new Error('MP4 moov is absent');
if(top.findIndex(x=>x.name==='moov')>top.findIndex(x=>x.name==='mdat'))throw new Error('MP4 is missing faststart');
const tracks=children(moov).filter(x=>x.name==='trak').map(trak=>{
 const mdia=child(trak,'mdia'),hdlr=child(mdia,'hdlr'),mdhd=child(mdia,'mdhd'),minf=child(mdia,'minf'),stbl=child(minf,'stbl'),stts=child(stbl,'stts'),stsd=child(stbl,'stsd');
 const kind=bytes.toString('ascii',hdlr.body+8,hdlr.body+12),v=bytes[mdhd.body],timescale=u32(mdhd.body+(v===1?20:12));
 const count=u32(stts.body+4),timing=[];let samples=0,ticks=0;
 for(let i=0;i<count;i++){const n=u32(stts.body+8+i*8),delta=u32(stts.body+12+i*8);timing.push({samples:n,delta});samples+=n;ticks+=n*delta}
 const sample=stsd.body+8,codec=bytes.toString('ascii',sample+4,sample+8);
 const details={kind,codec,samples,timescale,duration:ticks/timescale,timing};
 if(kind==='vide'){details.width=bytes.readUInt16BE(sample+32);details.height=bytes.readUInt16BE(sample+34);details.fps=timescale/timing[0].delta;details.constantFrameRate=timing.every(x=>x.delta===timing[0].delta)}
 return details;
});
const video=tracks.find(x=>x.kind==='vide'),audio=tracks.find(x=>x.kind==='soun');
function require(condition,message){if(!condition)throw new Error(message)}
require(video&&audio,'Video or audio track missing');
require(video.codec==='avc1','Expected H.264/avc1 video');require(audio.codec==='mp4a','Expected AAC/mp4a audio');
require(video.width===expected.width&&video.height===expected.height,`Dimensions ${video.width}×${video.height}`);
require(video.samples===expected.frames,`Frame count ${video.samples}; expected ${expected.frames}`);
require(video.constantFrameRate&&Math.abs(video.fps-expected.fps)<1e-7,'Video is not constant '+expected.fps+'fps');
require(Math.abs(video.duration-audio.duration)<.05,'Audio/video durations differ by more than 50ms');
const ff=spawn(ffmpeg,['-hide_banner','-threads','4','-err_detect','explode','-xerror','-i',input,'-map','0:v:0','-map','0:a:0','-vf','vfrdet','-progress','pipe:1','-nostats','-f','null','-'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let progress='',diagnostics='';ff.stdout.on('data',d=>progress+=d);ff.stderr.on('data',d=>diagnostics+=d);
const exit=await new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('exit',resolve)});
require(exit===0,'Decode failed: '+diagnostics.slice(-5000));
require(!/corrupt|invalid data|error while decoding/i.test(diagnostics),'Decoder reported corruption');
const decodedFrames=Number([...progress.matchAll(/^frame=(\d+)$/gm)].at(-1)?.[1]);
require(decodedFrames===expected.frames,`Decoded ${decodedFrames}/${expected.frames} frames`);
require(/VFR:0\.000000/.test(diagnostics),'Decoded timestamps are not CFR');
require(/yuv420p\(tv, bt709(?:\/bt709\/bt709)?[,)]/.test(diagnostics),'Expected limited-range BT.709 yuv420p');

// Compare independently decoded PCM, including MP4 edit-list/AAC priming handling.
// Four source windows are searched around their predicted file time (songTime - mv_start).
async function pcm(file){
 const process=spawn(ffmpeg,['-v','error','-i',file,'-map','0:a:0','-vn','-ac','1','-ar','8000','-f','f32le','pipe:1'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 const chunks=[];let error='';process.stdout.on('data',d=>chunks.push(d));process.stderr.on('data',d=>error+=d);
 const code=await new Promise((resolve,reject)=>{process.on('error',reject);process.on('exit',resolve)});require(code===0,'PCM decode failed: '+error);
 const b=Buffer.concat(chunks);return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
}
let audioAlignment=null;
if(manifest.audio&&fs.existsSync(manifest.audio)&&Number.isFinite(manifest.start)){
 const [source,movie]=await Promise.all([pcm(manifest.audio),pcm(input)]),sr=8000;
 const padding=manifest.audioSourcePadding||0;
 const sourceStart=Math.max(0,manifest.start-padding),sourceEnd=Math.min(source.length/sr,manifest.end-padding),span=sourceEnd-sourceStart;
 const length=Math.min(3,span*.4),count=Math.floor(length*sr),stride=4,radius=1600;
 const windows=[];
 for(const f of [.1,.33,.66,.9]){
  const sourceTime=sourceStart+(span-length)*f,si=Math.round(sourceTime*sr),expectedIndex=Math.round((sourceTime+padding-manifest.start)*sr);
  let sourceMean=0,sourceSq=0,n=0;for(let i=0;i<count;i+=stride){sourceMean+=source[si+i];n++}sourceMean/=n;
  for(let i=0;i<count;i+=stride)sourceSq+=(source[si+i]-sourceMean)**2;
  let best={score:-1,delta:0};
  for(let delta=-radius;delta<=radius;delta++){
   const mi=expectedIndex+delta;if(mi<0||mi+count>movie.length)continue;
   let sum=0,sq=0,dot=0;
   for(let i=0;i<count;i+=stride){const s=source[si+i]-sourceMean,m=movie[mi+i];sum+=m;sq+=m*m;dot+=s*m}
   const score=dot/Math.sqrt(Math.max(1e-20,sourceSq*(sq-sum*sum/n)));
   if(score>best.score)best={score,delta};
  }
  require(best.score>.85,`Audio match confidence too low (${best.score.toFixed(3)} at song ${sourceTime.toFixed(2)}s)`);
  require(Math.abs(best.delta/sr)<.01,`Audio offset ${(best.delta/sr).toFixed(5)}s exceeds10ms at song${sourceTime.toFixed(2)}s`);
  windows.push({sourceTime:Number(sourceTime.toFixed(4)),referenceSongTime:Number((sourceTime+padding).toFixed(4)),expectedFileTime:Number((sourceTime+padding-manifest.start).toFixed(4)),offsetSeconds:best.delta/sr,correlation:Number(best.score.toFixed(6))});
 }
 let leadRms=0;
 if(manifest.audioDelay>.1){const n=Math.floor((manifest.audioDelay-.1)*sr);for(let i=0;i<n;i++)leadRms+=movie[i]**2;leadRms=Math.sqrt(leadRms/n);require(leadRms<1e-5,'Expected silent preroll has audible PCM');}
 audioAlignment={passed:true,visualPreroll:manifest.visualPreroll??Math.max(0,-manifest.start),audioSourcePadding:padding,leadSeconds:manifest.audioDelay||0,leadRms,windows};
}
const report={file:input,bytes:bytes.length,passed:true,decodedFrames,expected,video,audio,faststart:true,decodeErrors:0,audioAlignment};
fs.writeFileSync(input+'.verify.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
