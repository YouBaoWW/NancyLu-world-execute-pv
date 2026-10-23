// NancyLu assets are generated from a stable identity sheet and source poses.
// The user authorized ImageGen for character art; UI/effects remain procedural.
const FILES={bust:'bust-v1.png',paws:'paws-v2.png',profile:'profile-v1.png',reach:'reach-v1.png',eye:'eye-v1.png',male:'male-v1.png'};
const ART=new Map();
const INK=[8,13,21],WHITE=[242,245,247],BLUE=[72,186,255];
const PURPLE=[180,106,239];
// Anatomical iris masks in each locked source asset. Only blue iris pixels are
// graded; blue hair, ears, gloves and the user's avatar retain their colours.
const IRIS={bust:[[532,526,29,21],[699,501,28,24]],paws:[[532,526,29,21],[699,501,28,24]],profile:[[490,544,19,17],[590,497,23,19]],reach:[[582,469,25,18],[725,424,24,20]],eye:[[781,628,41,32]]};
function printPlate(image,name){
 const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
 const q=c.getContext('2d',{willReadFrequently:true});q.drawImage(image,0,0);
 const pixels=q.getImageData(0,0,c.width,c.height),d=pixels.data;
 for(let i=0;i<d.length;i+=4){
   if(d[i+3]<24){d[i+3]=0;continue;}
   const r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b;
   const cold=b-r>27&&g-r>13;
   // The half-tone matrix gives greys using the same white and black inks.
   let color;
   const px=(i/4)%c.width,py=Math.floor(i/4/c.width);
   const iris=(IRIS[name]||[]).some(([x,y,rx,ry])=>((px-x)/rx)**2+((py-y)/ry)**2<=1);
   if(cold&&l>65)color=iris?PURPLE:BLUE;
   else if(l>165)color=WHITE;
   else if(l>78){
     color=((px&3)+((py&3)*3))%8<2?WHITE:INK;
   }else color=INK;
   d[i]=color[0];d[i+1]=color[1];d[i+2]=color[2];
 }
 q.putImageData(pixels,0,0);return c;
}
function glyphPlate(plate){
 const c=document.createElement('canvas');c.width=plate.width;c.height=plate.height;
 const q=c.getContext('2d'),src=plate.getContext('2d').getImageData(0,0,c.width,c.height).data;
 q.font='600 14px Consolas,monospace';q.textBaseline='middle';
 const chars='01{}[]<>/;:+=';
 for(let y=7;y<c.height;y+=14)for(let x=4;x<c.width;x+=9){
  const i=(Math.floor(y)*c.width+Math.floor(x))*4;if(src[i+3]<40)continue;
  q.fillStyle=`rgb(${src[i]},${src[i+1]},${src[i+2]})`;q.fillText(chars[((x*73+y*31)|0)%chars.length],x-4,y);
 }
 q.globalCompositeOperation='destination-in';q.drawImage(plate,0,0);return c;
}
function canvasLike(source){
 const c=document.createElement('canvas');c.width=source.width;c.height=source.height;return c;
}
// These vertices follow the exposed face below the locked bust's fringe.
// The hair/ears, skull clip and jaw outline remain part of the same source asset.
const BUST_FACE=[[454,505],[480,495],[509,494],[531,498],[552,510],[576,533],[595,510],[613,472],[629,501],[644,469],[661,452],[685,459],[711,467],[743,461],[780,450],[784,491],[775,535],[762,573],[742,606],[714,635],[687,657],[658,681],[620,698],[588,681],[551,659],[519,635],[493,609],[478,581],[463,548]];
const FOREHEAD_GAPS=[
 [[471,495],[479,452],[490,424],[500,458],[506,496]],
 [[514,498],[518,452],[522,412],[533,456],[548,498]],
 [[639,497],[646,447],[660,431],[678,440],[698,460],[716,469],[744,462],[770,450],[767,481],[738,500],[703,520],[672,532]],
];
function facelessPlate(plate,name){
 if(name!=='bust'&&name!=='paws')return plate;
 const c=canvasLike(plate),q=c.getContext('2d');q.drawImage(plate,0,0);
 q.save();q.globalCompositeOperation='source-atop';q.fillStyle=`rgb(${INK})`;
 q.beginPath();BUST_FACE.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.closePath();q.fill();
 // Cover the exposed skin and eyebrows between fringe locks as well as both
 // eye sockets. The white locks themselves remain outside these traced gaps.
 for(const gap of FOREHEAD_GAPS){q.beginPath();gap.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.closePath();q.fill();}
 q.restore();return c;
}
function printStages(plate,name){
 const base=canvasLike(plate),q=base.getContext('2d'),src=plate.getContext('2d').getImageData(0,0,plate.width,plate.height);
 const layers=Array.from({length:3},()=>canvasLike(plate));
 const data=layers.map(c=>c.getContext('2d').createImageData(c.width,c.height));
 const b=q.createImageData(base.width,base.height),d=src.data;
 for(let i=0;i<d.length;i+=4){
  if(!d[i+3])continue;
  const x=(i/4)%plate.width,y=Math.floor(i/4/plate.width),nx=x/plate.width,ny=y/plate.height;
  const white=d[i]>200&&d[i+1]>200&&d[i+2]>200;
  const blue=d[i+2]-d[i]>65&&d[i+1]>110;
  const purple=d[i]>130&&d[i+2]>150&&d[i+1]<160;
  // The complete silhouette and all dark linework exist from the first plate.
  // Colour changes only occupy source ink pixels; no rectangular anatomy
  // approximation can turn the face or torso into an opaque black slab.
  // Keep every normal white-ink pixel (including all skin) unchanged from the
  // finished portrait. Only blue source accents participate in colour builds.
  const baseColor=purple?PURPLE:(white||blue)?WHITE:INK;
  b.data.set([...baseColor,255],i);
  if(!blue)continue;
  // Register head/hair accents, central outfit, then outer hair/hand details.
  // These masks contain blue ink only, so no step can tint the white skin.
  const head=ny<.51;
  const outfit=((nx-.55)/.26)**2+((ny-.78)/.32)**2<1;
  const k=head?0:outfit?1:2;
  data[k].data.set([d[i],d[i+1],d[i+2],255],i);
 }
 q.putImageData(b,0,0);layers.forEach((c,i)=>c.getContext('2d').putImageData(data[i],0,0));
 return {base,layers,paint:canvasLike(plate),stage:NaN};
}
function drawStages(ctx,variant,x,y,w,h,stage){
 if(stage>=1){ctx.drawImage(variant.plate,x,y,w,h);return;}
 const s=Math.max(0,Math.min(1,stage)),st=variant.stages,{base,layers,paint}=st;
 if(st.stage!==s){
  const q=paint.getContext('2d');q.clearRect(0,0,paint.width,paint.height);q.globalCompositeOperation='source-over';q.globalAlpha=1;q.drawImage(base,0,0);
  for(let i=0;i<3;i++){const p=Math.max(0,Math.min(1,s*3-i));if(p>0){q.globalAlpha=p;q.drawImage(layers[i],0,0);}}
  // Apply the source alpha exactly once. Repeated semi-transparent ink plates
  // must not build opaque rims around hair, fingers or the face contour.
  q.globalAlpha=1;q.globalCompositeOperation='destination-in';q.drawImage(variant.plate,0,0);q.globalCompositeOperation='source-over';st.stage=s;
 }
 ctx.drawImage(paint,x,y,w,h);
}
export async function loadNancyAssets(){
 await Promise.all(Object.entries(FILES).map(async([name,file])=>{
   const image=new Image();image.src=new URL('../../assets/nancy/'+file,import.meta.url);await image.decode();
   const plate=printPlate(image,name),blank=facelessPlate(plate,name);
   const normal={plate,glyph:glyphPlate(plate),stages:printStages(plate,name)};
   const faceless=blank===plate?normal:{plate:blank,glyph:glyphPlate(blank),stages:printStages(blank,name)};
   ART.set(name,{raw:image,...normal,faceless,ratio:image.naturalWidth/image.naturalHeight});
 }));
}
export function drawNancy(ctx,{x=960,y=100,height=900,t=0,pose='bust',alpha=1,mode='print',reveal=1,faceless=false,colorStage=1}={}){
 const asset=ART.get(pose)||ART.get('bust');if(!asset)throw new Error('NancyLu assets not loaded');
 const variant=faceless?asset.faceless:asset;
 const source=mode==='raw'&&!faceless?asset.raw:variant.plate,w=height*asset.ratio;
 const drift=Math.sin(t*.63)*2;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x+drift,y);ctx.rotate(Math.sin(t*.41)*.002);
 if(mode==='glyph')ctx.drawImage(variant.glyph,-w/2,0,w,height);
 if(reveal>0){ctx.save();if(reveal<1){ctx.beginPath();ctx.rect(-w/2,0,w,height*Math.max(0,reveal));ctx.clip();}if(colorStage<1&&mode!=='raw')drawStages(ctx,variant,-w/2,0,w,height,colorStage);else ctx.drawImage(source,-w/2,0,w,height);ctx.restore();}
 ctx.restore();
 return {left:x-w/2,top:y,width:w,height};
}
