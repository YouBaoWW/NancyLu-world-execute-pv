/** NancyLu / deterministic print, diagram and optical effects.
 * All animation is a function of song time. No external images are used.
 */
export const palette = Object.freeze({ ink: '#080d15', white: '#f2f5f7', blue: '#48baff' });

const TAU = Math.PI * 2;
const W = 1920, H = 1080;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function hash(n) {
  n = Math.imul((n | 0) ^ 0x68bc21eb, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function line(ctx, x1, y1, x2, y2) {
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
}
function polygon(ctx, pts) {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

// A small, fixed print matrix is cached per drawing context, not per frame.
const patternCache = new WeakMap();
function printPatterns(ctx) {
  if (patternCache.has(ctx)) return patternCache.get(ctx);
  const makeCanvas = (w, h) => {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = ctx.canvas.ownerDocument.createElement('canvas'); c.width = w; c.height = h; return c;
  };
  const dots = makeCanvas(20, 20), d = dots.getContext('2d');
  d.fillStyle = '#ffffff';
  d.beginPath(); d.arc(4.5, 4.5, 0.7, 0, TAU); d.fill();
  d.beginPath(); d.arc(14.5, 14.5, 0.7, 0, TAU); d.fill();
  const grain = makeCanvas(256, 256), g = grain.getContext('2d');
  for (let i = 0; i < 3300; i++) {
    const x = Math.floor(hash(i * 5) * 256), y = Math.floor(hash(i * 5 + 1) * 256);
    g.fillStyle = `rgba(255,255,255,${(0.15 + hash(i * 5 + 2) * 0.65).toFixed(3)})`;
    g.fillRect(x, y, hash(i * 5 + 3) > 0.93 ? 2 : 1, 1);
  }
  const darken = source => {
    const c = makeCanvas(source.width, source.height), q = c.getContext('2d');
    q.drawImage(source, 0, 0); q.globalCompositeOperation = 'source-in';
    q.fillStyle = palette.ink; q.fillRect(0, 0, c.width, c.height); return c;
  };
  const value = {
    dots: ctx.createPattern(dots, 'repeat'), grain: ctx.createPattern(grain, 'repeat'),
    dotsDark: ctx.createPattern(darken(dots), 'repeat'), grainDark: ctx.createPattern(darken(grain), 'repeat'),
  };
  patternCache.set(ctx, value);
  return value;
}

/** Flat ink ground with optical grey, registration marks and mechanical rules. */
export function background(ctx, t, { variant = 'dark', density = 1, grid = true } = {}) {
  const light = variant === 'light', blue = variant === 'blue';
  const base = light ? palette.white : blue ? palette.blue : palette.ink;
  const opposite = light || blue ? palette.ink : palette.white;
  const patterns = printPatterns(ctx);
  ctx.save();
  ctx.globalAlpha = 1; ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  // Broad, almost subliminal planes give the print a composed depth.
  ctx.fillStyle = opposite; ctx.globalAlpha = light ? 0.025 : 0.032;
  const drift = Math.sin(t * 0.085) * 12;
  polygon(ctx, [[920 + drift, -100], [1570 + drift, -100], [510 + drift, 1180], [-140 + drift, 1180]]); ctx.fill();
  ctx.globalAlpha = light ? 0.035 : 0.028;
  polygon(ctx, [[1520, -50], [2020, -50], [2020, 600], [970, 1080], [810, 1080]]); ctx.fill();

  ctx.globalAlpha = (light ? 0.045 : 0.065) * clamp(density, 0, 2);
  ctx.fillStyle = light || blue ? patterns.grainDark : patterns.grain; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = (light ? 0.11 : 0.15) * clamp(density, 0, 2);
  ctx.fillStyle = light || blue ? patterns.dotsDark : patterns.dots;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(1170, 410, 790, 670, -0.18, 0, TAU); ctx.clip();
  ctx.fillRect(0, 0, W, H); ctx.restore();

  // Etched circular witness marks, rather than a neon perspective grid.
  if (grid) {
    ctx.strokeStyle = opposite; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.09;
    ctx.beginPath(); ctx.arc(1190, 490, 485, Math.PI * 0.78, Math.PI * 1.85); ctx.stroke();
    ctx.globalAlpha = 0.035;
    ctx.beginPath(); ctx.arc(1190, 490, 625, Math.PI * 0.8, Math.PI * 1.85); ctx.stroke();
    ctx.globalAlpha = 0.14; ctx.beginPath();
    for (let x = 72; x < W - 72; x += 24) line(ctx, x, 53, x, x % 120 === 0 ? 64 : 58);
    for (let y = 80; y < H - 80; y += 24) line(ctx, 51, y, y % 120 === 8 ? 62 : 57, y);
    ctx.stroke();
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    for (const [x, y, dx, dy] of [[72, 72, 1, 1], [W - 72, 72, -1, 1], [72, H - 72, 1, -1], [W - 72, H - 72, -1, -1]]) {
      line(ctx, x, y, x + dx * 19, y); line(ctx, x, y, x, y + dy * 19);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** An orthographic/perspective spherical mesh with code-labelled vertices. */
export function drawTopology(ctx, { t = 0, x = 960, y = 480, r = 340, alpha = 1, palette: p = palette } = {}) {
  const ay = t * 0.11 + 0.48, ax = -0.28 + Math.sin(t * 0.065) * 0.12, az = 0.20;
  const ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax), cc = Math.cos(az), sc = Math.sin(az);
  const project = (px, py, pz) => {
    const xx = px * ca + pz * sa, zz = -px * sa + pz * ca;
    const yy = py * cb - zz * sb, z2 = py * sb + zz * cb;
    const x2 = xx * cc - yy * sc, y2 = xx * sc + yy * cc;
    const perspective = 3.8 / (3.8 - z2);
    return [x + x2 * r * perspective, y + y2 * r * perspective, z2];
  };
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineWidth = 1;
  const trace = (points, color, opacity, width = 1) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha * opacity;
    ctx.beginPath(); points.forEach((p0, i) => i ? ctx.lineTo(p0[0], p0[1]) : ctx.moveTo(p0[0], p0[1])); ctx.stroke();
  };
  // Rear-facing and forward-facing portions get separate inks/opacities.
  const traceDepth = points => {
    for (let side = 0; side < 2; side++) {
      let run = [];
      const flush = () => { if (run.length > 1) trace(run, side ? p.blue : p.white, side ? 0.52 : 0.105, side ? 1.15 : 0.7); run = []; };
      points.forEach(v => { if ((v[2] >= 0) === Boolean(side)) run.push(v); else { if (run.length) { run.push(v); flush(); } } });
      flush();
    }
  };
  for (let j = 1; j < 12; j++) {
    const lat = -Math.PI / 2 + j * Math.PI / 12, rr = Math.cos(lat), yy = Math.sin(lat);
    const pts = Array.from({ length: 97 }, (_, i) => { const a = i / 96 * TAU; return project(rr * Math.cos(a), yy, rr * Math.sin(a)); });
    traceDepth(pts);
  }
  for (let j = 0; j < 18; j++) {
    const a = j / 18 * TAU;
    const pts = Array.from({ length: 97 }, (_, i) => { const b = i / 96 * TAU; return project(Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)); });
    traceDepth(pts);
  }
  // Elliptical survey orbits have intentional gaps and precise ticks.
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.22);
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = k === 0 ? p.white : p.blue; ctx.globalAlpha = alpha * (k === 0 ? 0.55 : 0.22);
    ctx.lineWidth = k === 0 ? 1.6 : 0.8; ctx.beginPath();
    ctx.ellipse(0, 0, r * (1.28 + k * 0.10), r * (0.34 + k * 0.035), 0, 0.15 + k, 5.7 + k); ctx.stroke();
  }
  ctx.restore();
  ctx.font = '12px Consolas, monospace'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 78; i++) {
    const u = 1 - 2 * (i + 0.5) / 78, a = i * 2.399963229728653;
    const q = Math.sqrt(1 - u * u), v = project(q * Math.cos(a), u, q * Math.sin(a));
    if (v[2] < -0.25) continue;
    const size = i % 9 === 0 ? 5 : 2.6;
    ctx.globalAlpha = alpha * (v[2] > 0 ? 0.9 : 0.3); ctx.fillStyle = i % 3 === 0 ? p.white : p.blue;
    ctx.fillRect(v[0] - size / 2, v[1] - size / 2, size, size);
    if (i % 9 === 0) {
      ctx.strokeStyle = p.white; ctx.lineWidth = 0.8; ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath(); line(ctx, v[0] + 7, v[1], v[0] + 28, v[1] - 16); line(ctx, v[0] + 28, v[1] - 16, v[0] + 80, v[1] - 16); ctx.stroke();
      ctx.fillStyle = p.white; ctx.fillText(`0x${(64 + i * 7).toString(16).toUpperCase()}`, v[0] + 32, v[1] - 25);
    }
  }
  ctx.restore();
}

/** Graphic expansion: ink shards and rigid speed lines, all time-addressable. */
export function drawBurst(ctx, { t = 0, x = 960, y = 480, strength = 1, palette: p = palette } = {}) {
  strength = clamp(strength); if (!strength) return;
  ctx.save(); ctx.translate(x, y);
  const turn = Math.sin(t * 0.09) * 0.06;
  for (let i = 0; i < 34; i++) {
    const a = i / 34 * TAU + (hash(i + 10) - 0.5) * 0.09 + turn;
    const near = 155 + hash(i + 50) * 300;
    const far = near + 260 + hash(i + 70) * 940;
    const half = 0.001 + hash(i + 80) * 0.017 * strength;
    const off = Math.sin(t * 0.5 + i * 2.8) * 10;
    ctx.fillStyle = i % 5 === 0 ? p.white : p.blue;
    ctx.globalAlpha = strength * (i % 5 === 0 ? 0.62 : 0.13 + hash(i + 30) * 0.20);
    polygon(ctx, [[Math.cos(a) * (near + off), Math.sin(a) * (near + off)], [Math.cos(a - half) * far, Math.sin(a - half) * far], [Math.cos(a + half) * far, Math.sin(a + half) * far]]); ctx.fill();
  }
  ctx.lineWidth = 0.9; ctx.strokeStyle = p.white; ctx.globalAlpha = strength * 0.40; ctx.beginPath();
  for (let i = 0; i < 66; i++) {
    const a = hash(i + 313) * TAU + turn, rr = 270 + hash(i + 427) * 740;
    const length = 14 + hash(i + 818) * 160;
    line(ctx, Math.cos(a) * rr, Math.sin(a) * rr, Math.cos(a) * (rr + length), Math.sin(a) * (rr + length));
  }
  ctx.stroke();
  for (let i = 0; i < 36; i++) {
    const a = hash(i + 730) * TAU + turn;
    const rr = 290 + hash(i + 632) * 620, size = 5 + hash(i + 312) * 25;
    ctx.save(); ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr); ctx.rotate(a + 0.3);
    ctx.globalAlpha = strength * (0.25 + hash(i + 8) * 0.6); ctx.fillStyle = i % 4 === 0 ? p.white : p.blue;
    ctx.fillRect(-size, -size * 0.25, size * 2, size * 0.5);
    if (i % 3 === 0) { ctx.strokeStyle = p.blue; ctx.lineWidth = 1; ctx.strokeRect(-size - 5, -size * 0.25 - 5, size * 2 + 10, size * 0.5 + 10); }
    ctx.restore();
  }
  ctx.restore();
}

const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() { gl_Position=vec4(aPosition,0.,1.); vUv=vec2(aPosition.x*.5+.5,.5-aPosition.y*.5); }
`;
const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform vec2 uResolution;
uniform float uTime;
uniform float uStrength;
in vec2 vUv;
out vec4 fragColor;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
float lum(vec3 c) { return dot(c,vec3(.2126,.7152,.0722)); }
void main() {
  vec2 uv=vUv;
  float frame=floor(uTime*60.);
  float band=floor(uv.y*64.);
  float epoch=floor(uTime*12.);
  float event=step(.955,hash(vec2(band,epoch)));
  float gate=event*uStrength;
  float displacement=(hash(vec2(band+19.,epoch))-.5)*.028*gate;
  uv.x=clamp(uv.x+displacement,0.,1.);
  vec3 c=texture(uImage,uv).rgb;
  // A monochrome-blue optical ghost, never an RGB channel split.
  float left=lum(texture(uImage,clamp(uv+vec2(-.006*uStrength,0.),0.,1.)).rgb);
  float edge=max(left-lum(c),0.);
  c+=vec3(.282,.729,1.)*edge*.22*uStrength;
  float scan=sin(uv.y*uResolution.y*3.14159265)*(.0008+.003*uStrength);
  float noise=(hash(floor(vUv*uResolution)+vec2(mod(frame,251.),mod(frame*3.,239.)))-.5)*(.003+.008*uStrength);
  c=c*(1.+scan)+noise;
  // Sparse horizontal print skips provide damage without blocking the frame.
  float thinLine=step(.993,fract(vUv.y*127.+hash(vec2(epoch,0.))));
  c=mix(c,vec3(.282,.729,1.),thinLine*event*uStrength*.26);
  fragColor=vec4(clamp(c,0.,1.),1.);
}
`;

/** A WebGL2 finish for a Canvas2D frame. The output is also screenshot-safe. */
export class PrintFX {
  constructor(outputCanvas) {
    this.canvas = outputCanvas;
    this.gl = outputCanvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) { this.fallback = outputCanvas.getContext('2d', { alpha: false }); return; }
    const gl = this.gl;
    const compile = (type, source) => {
      const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`PrintFX shader: ${gl.getShaderInfoLog(s)}`);
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX), fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`PrintFX link: ${gl.getProgramInfoLog(program)}`);
    gl.deleteShader(vs); gl.deleteShader(fs);
    this.program = program; gl.useProgram(program);
    this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(program, 'aPosition'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    this.texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.uniforms = Object.fromEntries(['uImage','uResolution','uTime','uStrength'].map(n => [n, gl.getUniformLocation(program,n)]));
    gl.uniform1i(this.uniforms.uImage, 0);
  }
  render(sourceCanvas, t = 0, strength = 0) {
    if (this.canvas.width !== sourceCanvas.width) this.canvas.width = sourceCanvas.width;
    if (this.canvas.height !== sourceCanvas.height) this.canvas.height = sourceCanvas.height;
    if (!this.gl) {
      const ctx = this.fallback; if (!ctx) throw new Error('Neither WebGL2 nor Canvas2D is available');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); ctx.drawImage(sourceCanvas, 0, 0); return;
    }
    const gl = this.gl;
    gl.useProgram(this.program); gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    gl.uniform2f(this.uniforms.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.uTime, Number.isFinite(t) ? t : 0); gl.uniform1f(this.uniforms.uStrength, clamp(strength));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  destroy() {
    if (!this.gl) return;
    this.gl.deleteTexture(this.texture); this.gl.deleteBuffer(this.buffer); this.gl.deleteProgram(this.program);
  }
}
