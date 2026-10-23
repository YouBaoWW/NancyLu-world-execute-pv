import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parseLrc,ensureDemoLyrics,writeLyrics,createDemoLyrics} from '../tools/prepare-lyrics.mjs';
import {projectPath,defaultGpu,gpuMode,benchmarkGpuModes,resolveBrowser,findFfmpeg,isMain} from '../tools/runtime.mjs';

test('LRC preserves Unicode/BOM, expands timestamps, sorts and combines signed offsets',()=>{
  const data=parseLrc('\uFEFF[ar:Test]\r\n[offset:-100]\r\n[00:03.50][00:01.250]白色信号\r\n[00:02.00]\r\n[00:00.50]Start here\r\n',{offset:.2,end:5});
  assert.deepEqual(data.lines.map(l=>[l.start,l.end,l.text]),[[.6,1.325,'Start here'],[1.35,3.575,'白色信号'],[3.6,5,'白色信号']]);
  assert.deepEqual(data.lines.map(l=>l.role),['USER','NancyLu','USER']);
  assert.equal(data.demo,false);
});

test('LRC merges simultaneous translations, skips invalid/empty/outside lines and keeps short cues ordered',()=>{
  const data=parseLrc('[00:01]Alpha\n[00:01]Alpha\n[00:01]第二行\n[00:01.01]Beta\n[00:61]invalid\n[00:05]outside\n[00:02]',{end:5});
  assert.equal(data.lines.length,2);
  assert.equal(data.lines[0].text,'Alpha / 第二行');
  assert.equal(data.lines[0].end,1.001);
  assert.equal(data.lines[1].end,4.81);
  assert.throws(()=>parseLrc('[ar:only metadata]'),/No non-empty/);
  assert.throws(()=>parseLrc('[00:01]text',{offset:NaN}),/finite/);
});

test('reviewed layout applies as a whole, preserving presentation metadata and shifted/clipped durations',()=>{
  const layout={lines:[
    {index:0,start:1,end:1.55,role:'NancyLu',effect:'glitch',keyword:true},
    {index:1,start:10,end:13.8,role:'USER',effect:'packet',keyword:false},
  ]};
  const data=parseLrc('[offset:200]\n[00:01]Placeholder one\n[00:10]Placeholder two',{end:12,offset:.3,layout});
  assert.equal(data.layoutMatched,true);
  assert.deepEqual(data.lines.map(({text,...metadata})=>metadata),[
    {index:0,start:1.5,end:2.05,role:'NancyLu',effect:'glitch',keyword:true},
    {index:1,start:10.5,end:12,role:'USER',effect:'packet',keyword:false},
  ]);
  assert.deepEqual(data.warnings,[]);
  const clipped=parseLrc('[00:01]Placeholder one\n[00:10]Placeholder two',{offset:-1.2,end:20,layout});
  assert.equal(clipped.layoutMatched,true);assert.equal(clipped.lines[0].start,0);assert.equal(clipped.lines[0].end,.35);
});

test('one mismatched anchor or row count rejects the complete layout and generic lines never linger across long gaps',()=>{
  const layout={lines:[
    {index:0,start:1,end:7,role:'NancyLu',effect:'glitch',keyword:true},
    {index:1,start:10,end:18,role:'USER',effect:'packet',keyword:false},
  ]};
  const data=parseLrc('[00:01]SIGNAL\n[00:11]An original placeholder sentence',{layout,end:30});
  assert.equal(data.layoutMatched,false);assert.equal(data.lines[0].end,1.55);assert.equal(data.lines[1].end,14.8);
  assert.equal(data.lines[0].effect,'type');assert.equal(data.warnings.length,1);
  const fewer=parseLrc('[00:01]SIGNAL',{layout,end:30});assert.equal(fewer.layoutMatched,false);
  assert.ok(data.lines.every(line=>line.end>line.start));
});

test('published text-free layout reconstructs every reviewed duration and display attribute',()=>{
  const layout=JSON.parse(fs.readFileSync(new URL('../data/lyric-layout.json',import.meta.url),'utf8'));
  const keys=['index','start','end','role','effect','keyword'];
  assert.equal(layout.lines.length,129);
  assert.ok(layout.lines.every(line=>Object.keys(line).length===keys.length&&keys.every(key=>key in line)));
  // Synthetic text verifies all 129 anchors without including the song lyrics.
  const lrc=layout.lines.map((line,index)=>{
    const minutes=Math.floor(line.start/60),seconds=(line.start-minutes*60).toFixed(3).padStart(6,'0');
    return `[${String(minutes).padStart(2,'0')}:${seconds}]Original placeholder ${index}`;
  }).join('\n');
  const data=parseLrc(lrc,{layout});assert.equal(data.layoutMatched,true);
  assert.deepEqual(data.lines.map(line=>Object.fromEntries(keys.map(key=>[key,line[key]]))),layout.lines);
  assert.equal(data.lines.find(line=>line.start===16).end,19.8);
  assert.equal(data.lines.find(line=>line.start===131.224).end,131.774);
  assert.equal(data.lines.find(line=>line.start===191.356).end,191.906);
});

test('startup creates only original demo data and never replaces user or malformed files',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nancy-portable-test-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const first=ensureDemoLyrics({root:dir});assert.equal(first.created,true);
  assert.equal(JSON.parse(fs.readFileSync(first.file,'utf8')).demo,true);
  fs.writeFileSync(first.file,'private user bytes');
  assert.equal(ensureDemoLyrics({root:dir}).created,false);
  assert.equal(fs.readFileSync(first.file,'utf8'),'private user bytes');
  assert.throws(()=>writeLyrics(first.file,createDemoLyrics()),/preserved/);
  writeLyrics(first.file,createDemoLyrics(),{force:true});
  writeLyrics(first.file,parseLrc('[00:00]My local dialogue',{end:5}));
  assert.equal(JSON.parse(fs.readFileSync(first.file,'utf8')).demo,false);
});

test('output paths stay rooted in the project even when caller uses another cwd',()=>{
  const root=path.resolve('a portable project');
  assert.equal(projectPath(undefined,'outputs/keyframes',root),path.join(root,'outputs/keyframes'));
  assert.equal(projectPath('my renders','ignored',root),path.join(root,'my renders'));
  const absolute=path.resolve('another destination');
  assert.equal(projectPath(absolute,'ignored',root),absolute);
  assert.equal(defaultGpu('win32'),'d3d11');assert.equal(defaultGpu('darwin'),'default');
  assert.equal(gpuMode('auto','linux'),'default');
  assert.deepEqual(benchmarkGpuModes('auto','linux'),['default','swiftshader']);
});

test('CLI entry detection resolves directory aliases and ignores imports',()=>{
  const moduleUrl=new URL('../tools/prepare-lyrics.mjs',import.meta.url);
  assert.equal(isMain(moduleUrl,['node',path.resolve('tools/prepare-lyrics.mjs')]),true);
  assert.equal(isMain(moduleUrl,['node',path.resolve('tools/runtime.mjs')]),false);
  assert.equal(isMain(moduleUrl,['node','does-not-exist.mjs']),false);
});

test('browser discovery honors explicit selection and installed Playwright fallback without downloading',()=>{
  const explicit=path.resolve('custom browser');
  assert.equal(resolveBrowser(null,{env:{NANCY_CHROME:explicit},exists:file=>file===explicit}),explicit);
  assert.throws(()=>resolveBrowser(null,{env:{NANCY_CHROME:explicit},exists:()=>false}),/NANCY_CHROME does not exist/);
  const installed=path.resolve('portable chromium');
  assert.equal(resolveBrowser({executablePath:()=>installed},{env:{PATH:''},platform:'linux',exists:file=>file===installed}),installed);
});

test('FFmpeg resolution tests executable usability and respects environment/local/PATH precedence',()=>{
  const root=path.resolve('portable project'),calls=[];
  const local=path.join(root,'toolchain/ffmpeg.exe');
  assert.equal(findFfmpeg({root,env:{},probe:file=>{calls.push(file);return {status:file===local?0:1};}}),local);
  assert.deepEqual(calls,[path.join(root,'toolchain/ffmpeg'),local]);
  assert.equal(findFfmpeg({root,env:{},probe:file=>({status:file==='ffmpeg'?0:1})}),'ffmpeg');
  assert.throws(()=>findFfmpeg({root,env:{NANCY_FFMPEG:'missing'},probe:()=>({status:1})}),/NANCY_FFMPEG cannot run/);
});
