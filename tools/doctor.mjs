import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT,loadPlaywright,resolveBrowser,findFfmpeg,defaultGpu} from './runtime.mjs';

let requiredFailures=0;
function item(status,name,detail) {console.log(`[${status}] ${name}: ${detail}`);if(status==='FAIL')requiredFailures++;}
item(Number(process.versions.node.split('.')[0])>=20?'OK':'FAIL','Node',`${process.version}; Node 20+ required`);
try {const {chromium}=loadPlaywright();item('OK','Browser',resolveBrowser(chromium));} catch(error) {item('FAIL','Browser',error.message);}
try {const ff=findFfmpeg();const version=spawnSync(ff,['-version'],{windowsHide:true,encoding:'utf8'}).stdout?.split(/\r?\n/)[0];item('OK','FFmpeg',`${ff} (${version})`);} catch(error) {item('WARN','FFmpeg',`${error.message} Needed for MP4 export/verify, not preview.`);}
const expected=['bust.png','profile.png','reach.png','paws-v2.png','eye.png','male-bust.png','faceless-female.png'];
// The installed asset names are read from the renderer rather than inferred from these labels.
const loader=fs.readFileSync(path.join(ROOT,'src/nancy/asset-character.js'),'utf8');
const listed=[...loader.matchAll(/['"]([\w-]+\.png)['"]/g)].map(m=>m[1]);
const names=[...new Set(listed.length?listed:expected)];
const missing=names.filter(name=>!fs.existsSync(path.join(ROOT,'assets/nancy',name)));
item(missing.length?'FAIL':'OK','Character assets',missing.length?`Missing: ${missing.join(', ')}`:`${names.length} PNG files present`);
item(fs.existsSync(path.join(ROOT,'data/audio_features.json'))?'OK':'WARN','Audio analysis','data/audio_features.json (a 130 BPM fallback is available)');
const lyrics=path.join(ROOT,'data/lyrics-user.json');
if(!fs.existsSync(lyrics)) item('WARN','Dialogue','No local lyrics yet; npm start/render/export will create original demo dialogue.');
else try {const data=JSON.parse(fs.readFileSync(lyrics,'utf8').replace(/^\uFEFF/u,''));if(!Array.isArray(data.lines??data)) throw new Error('Expected a lines array');item('OK','Dialogue',data.demo?'Original demo dialogue; not song lyrics':`${(data.lines??data).length} local lyric lines`);} catch(error) {item('FAIL','Dialogue',`${error.message}; existing file was not changed.`);}
item(fs.existsSync(path.join(ROOT,'media/song.mp3'))?'OK':'WARN','Music',fs.existsSync(path.join(ROOT,'media/song.mp3'))?'Local media/song.mp3 exists':'Not included. Scrub preview works; playback and export require your own media/song.mp3.');
item('INFO','GPU default',`${defaultGpu()} on ${process.platform}; use --gpu swiftshader if hardware rendering fails.`);
process.exitCode=requiredFailures?1:0;
