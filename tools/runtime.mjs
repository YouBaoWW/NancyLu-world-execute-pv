/** Portable runtime discovery. Importing this file never installs software. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function isMain(metaUrl,argv=process.argv) {
  if(!argv[1]) return false;
  try {return fs.realpathSync(path.resolve(argv[1]))===fs.realpathSync(fileURLToPath(metaUrl));} catch {return false;}
}
export const projectPath=(value,fallback,root=ROOT)=>path.resolve(root,value??fallback);
export const defaultGpu=(platform=process.platform)=>platform==='win32'?'d3d11':'default';
export const gpuMode=(value='auto',platform=process.platform)=>value==='auto'?defaultGpu(platform):value;
export const benchmarkGpuModes=(value='auto',platform=process.platform)=>value==='auto'?[...new Set([defaultGpu(platform),'swiftshader'])]:[value];

export function loadPlaywright({root=ROOT,env=process.env}={}) {
  try {return createRequire(path.join(root,'package.json'))('playwright-core');} catch(error) {
    if(env.NANCY_NODE_MODULES) {
      const modules=path.resolve(env.NANCY_NODE_MODULES);
      try {return createRequire(path.join(modules,'nancy-loader.cjs'))('playwright-core');} catch(cause) {
        throw new Error(`Cannot load playwright-core from NANCY_NODE_MODULES (${modules}).`,{cause});
      }
    }
    throw new Error('playwright-core is missing. Run npm install in this project, or set NANCY_NODE_MODULES to an existing node_modules directory.',{cause:error});
  }
}

function pathCandidates(names,env,platform) {
  const delimiter=platform==='win32'?';':':';
  return (env.PATH??env.Path??'').split(delimiter).filter(Boolean).flatMap(dir=>names.map(name=>path.join(dir,name)));
}

export function browserCandidates({env=process.env,platform=process.platform,home=os.homedir()}={}) {
  if(platform==='win32') {
    const programFiles=env.PROGRAMFILES||'C:/Program Files',programFilesX86=env['PROGRAMFILES(X86)']||'C:/Program Files (x86)';
    return [
      path.join(programFiles,'Google/Chrome/Application/chrome.exe'),
      path.join(programFilesX86,'Google/Chrome/Application/chrome.exe'),
      path.join(programFiles,'Microsoft/Edge/Application/msedge.exe'),
      path.join(programFilesX86,'Microsoft/Edge/Application/msedge.exe'),
      ...(env.LOCALAPPDATA?[path.join(env.LOCALAPPDATA,'Google/Chrome/Application/chrome.exe'),path.join(env.LOCALAPPDATA,'Microsoft/Edge/Application/msedge.exe')]:[]),
      ...pathCandidates(['chrome.exe','msedge.exe','chromium.exe'],env,platform),
    ];
  }
  if(platform==='darwin') return [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    path.join(home,'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    path.join(home,'Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'),
    ...pathCandidates(['google-chrome','chromium','chromium-browser'],env,platform),
  ];
  return [...pathCandidates(['google-chrome','google-chrome-stable','microsoft-edge','microsoft-edge-stable','chromium','chromium-browser'],env,platform),
    '/usr/bin/google-chrome','/usr/bin/microsoft-edge','/usr/bin/chromium','/usr/bin/chromium-browser','/snap/bin/chromium'];
}

export function resolveBrowser(chromium,{env=process.env,platform=process.platform,exists=fs.existsSync,home=os.homedir()}={}) {
  if(env.NANCY_CHROME) {
    const explicit=path.resolve(env.NANCY_CHROME);
    if(!exists(explicit)) throw new Error(`NANCY_CHROME does not exist: ${explicit}`);
    return explicit;
  }
  const system=browserCandidates({env,platform,home}).find(exists);
  if(system) return system;
  let installed;
  try {installed=chromium?.executablePath();} catch {}
  if(installed&&exists(installed)) return installed;
  throw new Error('No browser found. Install Chrome/Edge, set NANCY_CHROME to its executable, or explicitly run npx playwright-core install chromium.');
}

export function browserLaunchOptions({chromium,gpu='auto',headed=false,env=process.env,platform=process.platform}={}) {
  const mode=gpuMode(gpu,platform);
  return {headless:!headed,executablePath:resolveBrowser(chromium,{env,platform}),args:[
    '--ignore-gpu-blocklist','--enable-gpu',`--use-angle=${mode}`,
    '--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows',
    '--disable-lcd-text','--font-render-hinting=none',...(mode==='swiftshader'?['--enable-unsafe-swiftshader']:[]),
  ]};
}

export function findFfmpeg({root=ROOT,env=process.env,probe=spawnSync}={}) {
  const works=file=>probe(file,['-version'],{windowsHide:true,encoding:'utf8',timeout:10000}).status===0;
  if(env.NANCY_FFMPEG) {
    const explicit=path.resolve(env.NANCY_FFMPEG);
    if(!works(explicit)) throw new Error(`NANCY_FFMPEG cannot run: ${explicit}`);
    return explicit;
  }
  const candidates=[path.join(root,'toolchain/ffmpeg'),path.join(root,'toolchain/ffmpeg.exe'),path.join(root,'toolchain/ffmpeg-win-x86_64-v7.1.exe'),'ffmpeg'];
  for(const file of candidates) if(works(file)) return file;
  throw new Error('FFmpeg is unavailable. Set NANCY_FFMPEG to its executable, place it in toolchain/, or add ffmpeg to PATH.');
}
