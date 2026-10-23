/** NancyLu offline exporter. One deterministic render per output frame; no PNG intermediates.
 * node tools/export-nancy.mjs [--start -5 --end 211.96 --fps 60 --width 1920 --height 1080]
 *   [--out outputs/NancyLu_world_execute_1080p60.mp4] [--codec auto|h264_nvenc|libx264]
 *   [--cq 17] [--gpu auto|d3d11|swiftshader] [--chunk 120] [--benchmark --samples 18]
 *   [--audio-offset 0.0250566893424] (MP3 encoder padding relative to reference WAV grid)
 * Environment: NANCY_FFMPEG, NANCY_CHROME, NANCY_NODE_MODULES. No personal browser profile is used.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {startServer} from '../export/server.mjs';
import {frameSocketHandler} from '../export/wsframes.mjs';
import {ROOT,projectPath,loadPlaywright,browserLaunchOptions,findFfmpeg,gpuMode,benchmarkGpuModes} from './runtime.mjs';
import {ensureDemoLyrics} from './prepare-lyrics.mjs';

const argv=process.argv.slice(2);
const arg=(n,d)=>{const i=argv.indexOf('--'+n);return i<0?d:argv[i+1]};
const has=n=>argv.includes('--'+n);
const W=Number(arg('width',1920)),H=Number(arg('height',1080)),FPS=Number(arg('fps',60));
const START=Number(arg('start',-5)),END=Number(arg('end',211.96));
const TOTAL=Math.ceil((END-START)*FPS-1e-8),DURATION=TOTAL/FPS;
const OUT=projectPath(arg('out'),'outputs/NancyLu_world_execute_1080p60.mp4');
const AUDIO=path.resolve(ROOT,arg('audio','media/song.mp3'));
const QUALITY=Number(arg('cq',17)),CHUNK=Number(arg('chunk',120));
// Cross-correlation of source-MP3 RMS against reference-WAV features measured a constant +25ms.
// FFmpeg trims this MP3's 1105 encoder-delay samples; restore that lead on the reference timeline.
const AUDIO_OFFSET=Number(arg('audio-offset',1105/44100));
const SOURCE_W=1920,SOURCE_H=1080;
if(![W,H,FPS,START,END,QUALITY,CHUNK].every(Number.isFinite)||W<=0||H<=0||W%2||H%2||FPS<=0||TOTAL<=0||CHUNK<1)throw new Error('Invalid dimensions, frame rate, time range or quality.');
if(has('workers')&&Number(arg('workers',1))!==1)throw new Error('This lossless-stream exporter uses one renderer; run disjoint --start/--end segments explicitly.');

ensureDemoLyrics();
const {chromium}=loadPlaywright();
const FFMPEG=findFfmpeg();
function chooseCodec(){
 const want=arg('codec','auto');
 if(!['auto','h264_nvenc','libx264'].includes(want))throw new Error('Supported codecs: auto, h264_nvenc, libx264');
 if(want==='libx264')return want;
 const probe=spawnSync(FFMPEG,['-hide_banner','-loglevel','error','-f','lavfi','-i',`color=black:s=${W}x${H}:r=${FPS}`,'-frames:v','5','-c:v','h264_nvenc','-f','null','-'],{windowsHide:true,encoding:'utf8'});
 if(probe.status===0)return 'h264_nvenc';
 if(want==='h264_nvenc')throw new Error('NVENC probe failed: '+probe.stderr);
 return 'libx264';
}
const CODEC=chooseCodec();
let browser=null,server=null,ff=null,wsSockets=new Set(),failure=null,received=0,abort=false;
const fail=e=>{failure??=e instanceof Error?e:new Error(String(e))};
const closeSockets=()=>{for(const s of wsSockets)s.destroy();wsSockets.clear()};
process.on('SIGINT',()=>{abort=true;fail(new Error('Export interrupted'));ff?.kill();browser?.close().catch(()=>{});closeSockets()});
process.on('SIGTERM',()=>{abort=true;fail(new Error('Export terminated'));ff?.kill();browser?.close().catch(()=>{});closeSockets()});

async function open(mode,url){
 browser=await chromium.launch(browserLaunchOptions({chromium,gpu:mode,headed:has('headed')}));
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 page.on('pageerror',fail);
 page.on('console',m=>{if(m.type()==='error')fail(new Error(m.text()))});
 await page.goto(`${url}/nancy-preview.html?export=1`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__nancy?.ready,null,{timeout:60000});
 const info=await page.evaluate(()=>{
  const canvas=document.querySelector('#film'),gl=canvas.getContext('webgl2');
  if(!gl)throw new Error('NancyLu output canvas must expose WebGL2.');
  const ext=gl.getExtension('WEBGL_debug_renderer_info');
  return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),width:canvas.width,height:canvas.height};
 });
 if(info.width!==SOURCE_W||info.height!==SOURCE_H)throw new Error(`Source canvas changed to ${info.width}×${info.height}; update SOURCE_W/H.`);
 await page.evaluate(()=>{
  // readPixels returns bottom row first. FFmpeg vflip restores the display orientation.
  const gl=document.querySelector('#film').getContext('webgl2');
  const bytes=new Uint8Array(1920*1080*4);
  let ws,opened;
  window.__nancyExport={
   async connect(){ws=new WebSocket(`ws://${location.host}/__frames`);opened=new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=()=>reject(new Error('Frame socket unavailable'))});await opened},
   async range(times,send=true){
    if(send)await opened;
    const ms={render:0,read:0,send:0};
    for(const t of times){
     const a=performance.now();window.__nancy.renderFrame(t);const b=performance.now();
     gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readPixels(0,0,1920,1080,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
     const c=performance.now();
     if(gl.getError()!==gl.NO_ERROR)throw new Error('WebGL readback failed');
     if(send)await new Promise((resolve,reject)=>{ws.onmessage=e=>e.data==='ok'?resolve():reject(new Error('Bad frame acknowledgment'));ws.onclose=()=>reject(new Error('Frame socket closed'));ws.onerror=()=>reject(new Error('Frame socket error'));ws.send(bytes)});
     ms.render+=b-a;ms.read+=c-b;ms.send+=performance.now()-c;
    }
    for(const k in ms)ms[k]=Number((ms[k]/times.length).toFixed(2));
    return ms;
   }
  };
 });
 return {page,info};
}

async function benchmark(){
 const samples=Math.max(6,Number(arg('samples',18))),results=[];
 const times=Array.from({length:samples},(_,i)=>[23.2,50.65,67.8,84.32,137.3,169.4][i%6]+Math.floor(i/6)/FPS);
 const {server:s,url}=await startServer({port:5196,onUpgrade:frameSocketHandler({frameBytes:SOURCE_W*SOURCE_H*4,onFrame:async()=>{received++},onError:fail})});server=s;
 server.on('connection',s=>{wsSockets.add(s);s.on('close',()=>wsSockets.delete(s))});
 const modes=benchmarkGpuModes(arg('gpu','auto'));
 for(const mode of modes){
  failure=null;
  try{
   const {page,info}=await open(mode,url);
   await page.evaluate(()=>window.__nancyExport.range([23.2,84.32,169.4],false));
   await page.evaluate(()=>window.__nancyExport.connect());
   const started=Date.now(),ms=await page.evaluate(ts=>window.__nancyExport.range(ts),times),seconds=(Date.now()-started)/1000;
   if(failure)throw failure;
   const r={mode,...info,samples,seconds,framesPerSecond:Number((samples/seconds).toFixed(2)),milliseconds:ms,estimatedFullMinutes:Number((TOTAL*seconds/samples/60).toFixed(1)),codec:CODEC};
   results.push(r);console.log(JSON.stringify(r));
  }catch(e){results.push({mode,error:e.message});console.error(`[benchmark ${mode}] ${e.message}`)}
  finally{await browser?.close();browser=null;closeSockets()}
 }
 return results;
}

async function render(){
 if(!fs.existsSync(AUDIO))throw new Error('Song audio missing: '+AUDIO);
 fs.mkdirSync(path.dirname(OUT),{recursive:true});
 const partial=OUT.replace(/\.mp4$/i,'')+'.rendering.mp4';
 const lead=Math.max(0,AUDIO_OFFSET-START),audioStart=Math.max(0,START-AUDIO_OFFSET);
 const vf=['vflip',...(W!==SOURCE_W||H!==SOURCE_H?[`scale=${W}:${H}:flags=lanczos:out_color_matrix=bt709:out_range=limited`]:['scale=out_color_matrix=bt709:out_range=limited']),'format=yuv420p','setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709'].join(',');
 // Delay is expressed AFTER a fixed-rate resample, so it remains exact for any input sample rate.
 const audioFilter=['aresample=48000',...(lead>0?[`adelay=${Math.round(lead*48000)}S:all=1`]:[]),'apad',`atrim=duration=${DURATION.toFixed(9)}`].join(',');
 const encoder=CODEC==='h264_nvenc'?['-preset','p7','-tune','hq','-rc','vbr','-cq',String(QUALITY),'-b:v','0','-spatial_aq','1','-temporal_aq','1','-rc-lookahead','32']:['-preset','slow','-crf',String(QUALITY)];
 const ffArgs=['-y','-hide_banner','-loglevel','warning','-f','rawvideo','-pix_fmt','rgba','-s',`${SOURCE_W}x${SOURCE_H}`,'-framerate',String(FPS),'-i','pipe:0',
  '-ss',String(audioStart),'-i',AUDIO,'-map','0:v:0','-map','1:a:0','-vf',vf,'-af',audioFilter,'-c:v',CODEC,...encoder,
  '-profile:v','high','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
  '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv','-fps_mode','cfr',
  '-c:a','aac','-b:a','320k','-ar','48000','-t',DURATION.toFixed(9),'-movflags','+faststart',
  '-metadata','title=NancyLu · world.execute(me);','-metadata',`comment=mv_start=${START.toFixed(6)}; audio_source_padding=${AUDIO_OFFSET.toFixed(9)}; deterministic; violet irises; 1080p60`,partial];
 ff=spawn(FFMPEG,ffArgs,{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let ffErrors='';ff.stderr.on('data',d=>{ffErrors=(ffErrors+d).slice(-10000)});
 ff.stdin.on('error',fail);
 const ffDone=new Promise(resolve=>{ff.once('error',e=>{fail(e);resolve({code:-1})});ff.once('exit',(code,signal)=>resolve({code,signal}))});
 const onUpgrade=frameSocketHandler({frameBytes:SOURCE_W*SOURCE_H*4,onFrame:frame=>new Promise((resolve,reject)=>{
  if(failure)return reject(failure);
  ff.stdin.write(frame,e=>{if(e)reject(e);else{received++;resolve()}});
 }),onError:fail});
 const {server:s,url}=await startServer({port:5196,onUpgrade});server=s;
 server.on('connection',s=>{wsSockets.add(s);s.on('close',()=>wsSockets.delete(s))});
 const mode=gpuMode(arg('gpu','auto'));
 let info,elapsed;
 try{
  const opened=await open(mode,url);const page=opened.page;info=opened.info;
  if(/swiftshader|llvmpipe|basic render/i.test(info.renderer)&&mode!=='swiftshader')console.warn('[export] Hardware backend requested, but software renderer reported; --benchmark compares alternatives.');
  console.log(`[export] ${W}×${H} ${FPS}fps; ${TOTAL} frames; song ${START}..${END}s; ${CODEC} quality ${QUALITY}`);
  console.log(`[export] ${info.renderer}`);
  await page.evaluate(()=>window.__nancyExport.connect());
  const started=Date.now();
  for(let a=0;a<TOTAL;a+=CHUNK){
   if(abort||failure)throw failure||new Error('Export aborted');
   const b=Math.min(TOTAL,a+CHUNK),ts=Array.from({length:b-a},(_,i)=>START+(a+i)/FPS);
   const ms=await page.evaluate(times=>window.__nancyExport.range(times),ts);
   if(failure)throw failure;
   elapsed=(Date.now()-started)/1000;const rate=b/elapsed;
   console.log(`[export] ${b}/${TOTAL}; ${rate.toFixed(2)}fps; ETA ${Math.ceil((TOTAL-b)/rate)}s; render/read/send ${ms.render}/${ms.read}/${ms.send}ms`);
  }
  ff.stdin.end();
  const result=await ffDone;
  if(result.code!==0)throw new Error(`FFmpeg ${result.code}/${result.signal||''}: ${ffErrors}`);
  if(received!==TOTAL)throw new Error(`Missing frames: ${received}/${TOTAL}`);
  fs.renameSync(partial,OUT);
  const manifest={file:OUT,width:W,height:H,fps:FPS,frames:TOTAL,start:START,end:END,duration:DURATION,visualPreroll:Math.max(0,-START),audioSourcePadding:AUDIO_OFFSET,audioDelay:lead,audioSeek:audioStart,audio:AUDIO,codec:CODEC,quality:QUALITY,pixelFormat:'yuv420p',colorSpace:'bt709',renderer:info,elapsedSeconds:elapsed,bytes:fs.statSync(OUT).size,ffmpegArguments:ffArgs.map(x=>x===partial?OUT:x)};
  fs.writeFileSync(OUT+'.render.json',JSON.stringify(manifest,null,2));
  console.log(`[export] COMPLETE ${OUT}; ${(manifest.bytes/1e6).toFixed(1)}MB; ${elapsed.toFixed(1)}s`);
  return manifest;
 }catch(e){ff?.kill();await ffDone;throw e}
}

try{if(has('benchmark'))await benchmark();else await render()}
catch(e){console.error('[export] FAILED:',e.stack||e);process.exitCode=1}
finally{if(ff&&ff.exitCode===null)ff.kill();await browser?.close().catch(()=>{});closeSockets();if(server)await new Promise(resolve=>server.close(resolve))}
