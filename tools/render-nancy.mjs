import fs from 'node:fs';
import path from 'node:path';
import {startServer} from '../export/server.mjs';
import {ROOT,projectPath,loadPlaywright,browserLaunchOptions} from './runtime.mjs';
import {ensureDemoLyrics} from './prepare-lyrics.mjs';
const args=process.argv.slice(2);
function arg(name,fallback){const p=args.indexOf(name);return p<0?fallback:args[p+1]}
const output=projectPath(arg('--out'),'outputs/keyframes');
fs.mkdirSync(output,{recursive:true});
ensureDemoLyrics();
const {chromium}=loadPlaywright();
const {server,url}=await startServer({port:5191});
const gpu=arg('--gpu','auto');
let browser;
try{
 browser=await chromium.launch(browserLaunchOptions({chromium,gpu}));
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(`${url}/nancy-preview.html?export=1`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__nancy?.ready,null,{timeout:60000});
 let shots=await page.evaluate(()=>window.__nancy.shots);
 const times=arg('--times','');if(times)shots=times.split(',').map((v,i)=>({id:`audit_${String(i+1).padStart(3,'0')}`,t:Number(v),title:`Song time ${Number(v).toFixed(3)}s`}));
 if(args.includes('--timeline'))shots=await page.evaluate(()=>window.__nancy.timeline.map((s,i)=>({id:`shot_${String(i+1).padStart(3,'0')}_${s.id}`,t:s.start+(s.end-s.start)*.58,title:s.title})));
 const only=arg('--only','');if(only)shots=shots.filter(s=>s.id.includes(only));
 const meta=[];
 for(const shot of shots){
   const start=Date.now();
   const result=await page.evaluate(t=>{window.__nancy.renderFrame(t);const c=document.querySelector('#film');return c.toDataURL('image/png')},shot.t);
   const file=path.join(output,`${shot.id}.png`);fs.writeFileSync(file,Buffer.from(result.split(',')[1],'base64'));
   console.log(`${shot.id}: ${Date.now()-start}ms -> ${file}`);meta.push({...shot,file:path.basename(file)});
 }
 // Canvas ink must be exact after seeking. The upstream GPU bloom documents
 // sub-LSB roundoff on hardware drivers; measure and bound that independently.
 const determinism=await page.evaluate(()=>{
   const c=document.querySelector('#film'),gl=c.getContext('webgl2');
   const read=()=>{const a=new Uint8Array(c.width*c.height*4);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,a);return a};
   window.__nancy.renderFrame(84.32);const ink=window.__nancy.inkSnapshot(),a=read();
   window.__nancy.renderFrame(169.4);window.__nancy.renderFrame(84.32);const b=read();let changed=0,maxDelta=0;
   for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d){changed++;maxDelta=Math.max(maxDelta,d)}}
   return {inkExact:ink===window.__nancy.inkSnapshot(),gpuExact:!changed,changedBytes:changed,changedFraction:changed/a.length,maxChannelDelta:maxDelta};
 });
 console.log('Seek verification:',JSON.stringify(determinism));
 const deterministic=determinism.inkExact&&determinism.maxChannelDelta<=1&&determinism.changedFraction<.002;
 if(!deterministic)throw new Error('Seek changed frame content beyond GPU rounding tolerance');
 if(errors.length)throw new Error(errors.join('\n'));
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({version:'final-violet',width:1920,height:1080,fps:60,deterministic,determinism,shots:meta},null,2));
 console.log(`PASS: ${shots.length} frames, no browser errors, deterministic seek`);
} finally{await browser?.close();await new Promise(r=>server.close(r))}
