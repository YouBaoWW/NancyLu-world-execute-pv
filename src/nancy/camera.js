/**
 * Scene cameras explain a subject before revealing its place in the world.
 * They transform one existing drawing layer, never a flattened finished frame.
 * Dialogue, lyrics and toolbar labels therefore keep their original reading size.
 */
import {clamp, easeInOut, lerp, prog} from '../engine/util.js';

const STEP=60/130;
const FULL=[0,0,1920,1080],DIAGRAM=[790,140,1048,730];
// A diagram's original drawing is wholly inside this aperture. Its left edge
// stays fixed beside the lyric window even while the lower margin opens out.
const DIAGRAM_WIDE=[790,140,1048,780];
// Free portraits use the frame edge as the aperture. Their conversation panels
// are painted afterwards, so hair may pass behind them without a hard internal
// crop line cutting the figure in half during a close shot.
const portrait=(zoom,target,extra={})=>({zoom,target,clip:FULL,...extra});

// Sparse editorial cues: a close hold, a medium view, then the exact original
// composition. Quiet conversations, counts and F/M changes remain stationary.
export const CAMERA_PLAN=Object.freeze({
 'boot-world':{character:portrait(1.42,[1370,365],{clip:[1040,86,790,666]})},
 'title':{character:portrait(1.72,[1410,369],{clip:[1050,80,790,713],normalClip:[1050,80,790,713]}),geometry:{zoom:1.18,clip:[85,82,960,710]}},
 'contract-handshake':{client:{zoom:1.018,focus:[960,540],clip:[30,30,1860,1020]}},
 'math-points':{diagram:{zoom:1.75,clip:DIAGRAM,normalClip:DIAGRAM_WIDE,target:[1285,510]}},
 'math-circle':{diagram:{zoom:1.85,clip:DIAGRAM,normalClip:DIAGRAM_WIDE,target:[1280,510]}},
 'math-sine':{diagram:{zoom:2.05,clip:DIAGRAM,normalClip:DIAGRAM_WIDE,target:[1280,510]}},
 'math-limit':{diagram:{zoom:1.65,clip:DIAGRAM,normalClip:DIAGRAM_WIDE,target:[1330,510]}},
 'config-history':{controls:{zoom:1.07,focus:[960,613],clip:[105,441,1715,345]}},
 'config-unite':{controls:{zoom:1.035,focus:[950,660],clip:[90,564,1740,255]}},
 'contract-portrait':{character:portrait(1.75,[1400,473])},
 'contract-reach':{character:portrait(1.60,[1400,554],{focus:'hand'})},
 'v2-cat':{character:portrait(1.60,[548,465],{focus:'paws',clip:[65,180,1000,670],normalClip:[65,180,1000,670]})},
 'v2-proof':{character:portrait(1.43,[1370,449],{clip:[840,100,990,775],normalClip:[840,100,990,775]})},
 'left-offline':{character:portrait(1.35,[1490,427],{clip:[1160,151,680,708]})},
 'b-breach':{character:portrait(1.58,[1480,447]),geometry:{zoom:1.18,clip:[1075,0,845,1080]}},
 'b-hand':{character:portrait(1.55,[1330,550],{focus:'hand'})},
 'b-vector':{
   character:{zoom:1.55,focus:[1300,488],target:[1345,485],clip:[918,151,870,737],normalClip:[918,151,870,737]},
   geometry:{zoom:1.55,focus:[1300,488],target:[1345,485],clip:[918,151,870,737]},
 },
 'b-grant':{character:portrait(1.36,[1450,450],{clip:[840,103,1010,740]})},
 'b-contract':{character:portrait(1.48,[1410,454])},
 'b-seal':{character:portrait(1.38,[1390,442])},
 'b-owned-return':{client:{zoom:1.018,focus:[960,540],clip:[30,30,1860,1020]}},
 'b-stable-link':{geometry:{zoom:1.45,focus:[1430,468],target:[1450,468],clip:[1110,276,690,430]}},
 'b-signature':{character:portrait(1.45,[1460,460])},
});

export const CAMERA_QA=Object.freeze([
 {id:'title',times:[16.45,17.10,18.05],purpose:'字符人物近景 → 世界与完整片名'},
 {id:'math-sine',times:[37.13,37.85,39.02],purpose:'切点近景 → 切线与完整函数'},
 {id:'config-history',times:[51.45,52.10,53.31],purpose:'完整年份滑块的轻推拉，数值与光标同轨'},
 {id:'contract-portrait',times:[59.38,60.03,61.12],purpose:'紫瞳与面部 → 契约人物全局'},
 {id:'v2-cat',times:[82.13,82.83,83.94],purpose:'猫爪近景 → 呼噜波形与 ENJOYMENT'},
 {id:'b-breach',times:[144.46,145.14,146.26],purpose:'拒绝权限时的人物近景 → 系统全局'},
 {id:'b-vector',times:[166.57,167.16,168.18],purpose:'人物与世界共用同一运镜 → NEW ORIGIN'},
 {id:'b-signature',times:[203.53,204.22,205.36],purpose:'署名人物近景 → 稳定尾声'},
]);

function focusFor(layer,source,cue,override){
 if(Array.isArray(override))return override;
 if(Array.isArray(cue.focus))return cue.focus;
 const {x=960,y=480,height=900,pose='bust'}=source;
 if(layer!=='character')return [x,y];
 if(cue.focus==='hand')return [x-height*.235,y+height*.79];
 if(cue.focus==='paws')return [x,y+height*.44];
 const face=pose==='eye'?[.14,.47]:pose==='reach'?[.07,.34]:pose==='profile'?[-.02,.39]:[0,.39];
 return [x+height*face[0],y+height*face[1]];
}

/** Pure, inspectable camera state. Normal framing is reached before every cut. */
export function cameraAt(shot,t,layer,{source={},focus,reducedMotion=false}={}){
 const rig=shot&&CAMERA_PLAN[shot.id];
 let cue=rig?.[layer];
 if(layer==='background'&&rig&&(rig.character||rig.diagram||rig.geometry))cue={zoom:1.012,focus:[960,540],target:[952,544]};
 const neutral={active:false,zoom:1,weight:0,focus:[0,0],target:[0,0],clip:null,phase:'wide'};
 if(!cue||reducedMotion||t<shot.start||t>=shot.end)return neutral;
 const duration=shot.end-shot.start,age=t-shot.start;
 const hold=Math.min(STEP*.5,duration*.14),medium=Math.min(STEP*2,duration*.48);
 const settle=Math.min(STEP*4,duration-.18);
 if(age>=settle)return neutral;
 const close=cue.zoom,mid=1+(close-1)*.20;
 const zoom=age<=hold?close:age<medium?lerp(close,mid,easeInOut(prog(age,hold,medium))):lerp(mid,1,easeInOut(prog(age,medium,settle)));
 const weight=clamp((zoom-1)/(close-1)),anchor=focusFor(layer,source,cue,focus);
 const destination=cue.target??anchor;
 // Release a close-up's aperture continuously as the camera settles. Free
 // portraits and geometry reach the full canvas before returning to the
 // untransformed draw; native subject windows retain their original clip.
 const aperture=easeInOut(prog(weight,0,.35));
 const clip=cue.clip?cue.clip.map((v,i)=>lerp((cue.normalClip??FULL)[i],v,aperture)):null;
 return {active:true,zoom,weight,focus:anchor,target:[lerp(anchor[0],destination[0],weight),lerp(anchor[1],destination[1],weight)],clip,
   phase:age<=hold?'close':age<medium?'pullback':'reveal'};
}

/** Apply one camera to the real vector/raster subject, without copying a frame. */
export function drawCameraLayer(c,{shot,t,layer,source,focus,reducedMotion=false},draw){
 const state=cameraAt(shot,t,layer,{source,focus,reducedMotion});
 if(!state.active)return draw();
 c.save();
 try{
  // Set the viewing aperture before moving the subject. This keeps geometric
  // detail off the adjacent lyrics and never creates a second image layer.
  if(state.clip){c.beginPath();c.rect(...state.clip);c.clip();}
  c.translate(...state.target);c.scale(state.zoom,state.zoom);c.translate(-state.focus[0],-state.focus[1]);
  return draw();
 }finally{c.restore();}
}
