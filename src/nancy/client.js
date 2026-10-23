/**
 * NancyLu's desktop. A cinematic Canvas interpretation of a coding client.
 * Every visible state is derived from the song time and options. No DOM,
 * network, raster assets, random numbers, or frame-to-frame animation state.
 * All coordinates use a 1920 × 1080 design surface.
 */

import { lyricContext, drawClientMessages } from './lyrics.js';
import { drawGlyphText } from './dialogue.js';

const UI = 'Inter, "Noto Sans SC", "Microsoft YaHei", sans-serif';
const MONO = '"JetBrains Mono", "Cascadia Code", Consolas, monospace';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const mix = (a, b, k) => a + (b - a) * k;

function rr(ctx, x, y, w, h, r = 10) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.lineTo(x + w - q, y); ctx.quadraticCurveTo(x + w, y, x + w, y + q);
  ctx.lineTo(x + w, y + h - q); ctx.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  ctx.lineTo(x + q, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - q);
  ctx.lineTo(x, y + q); ctx.quadraticCurveTo(x, y, x + q, y); ctx.closePath();
}
function box(ctx, x, y, w, h, fill, stroke, r = 10) {
  rr(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function txt(ctx, s, x, y, size = 20, color = '#f2f5f7', weight = 400, family = UI) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
}
function dot(ctx, x, y, r, color) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
function arrow(ctx, x, y, s, color, dir = 'down') {
  ctx.save(); ctx.translate(x, y); if (dir === 'right') ctx.rotate(-Math.PI / 2);
  line(ctx, -s / 2, -s / 4, 0, s / 4, color, 1.7);
  line(ctx, 0, s / 4, s / 2, -s / 4, color, 1.7); ctx.restore();
}
function plus(ctx, x, y, s, color, width = 1.7) {
  line(ctx, x - s / 2, y, x + s / 2, y, color, width);
  line(ctx, x, y - s / 2, x, y + s / 2, color, width);
}
function iconFolder(ctx, x, y, color) {
  ctx.beginPath(); ctx.moveTo(x - 10, y - 7); ctx.lineTo(x - 3, y - 7);
  ctx.lineTo(x, y - 3); ctx.lineTo(x + 10, y - 3); ctx.lineTo(x + 10, y + 9);
  ctx.lineTo(x - 10, y + 9); ctx.closePath(); ctx.strokeStyle = color;
  ctx.lineWidth = 1.5; ctx.stroke();
}
function iconChat(ctx, x, y, color) {
  rr(ctx, x - 9, y - 8, 19, 15, 4); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  line(ctx, x - 5, y + 7, x - 8, y + 11, color, 1.5);
}
function bolt(ctx, x, y, size, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
  ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(-8, 2); ctx.lineTo(-1, 2);
  ctx.lineTo(-3, 11); ctx.lineTo(8, -3); ctx.lineTo(1, -3); ctx.closePath();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function thought(ctx, x, y, size, color, amount = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2, 9); ctx.bezierCurveTo(-7, 12, -10, 7, -8, 3);
  ctx.bezierCurveTo(-13, -1, -9, -8, -5, -7); ctx.bezierCurveTo(-5, -12, 1, -12, 2, -8);
  ctx.bezierCurveTo(7, -11, 12, -5, 8, -1); ctx.bezierCurveTo(12, 4, 7, 10, 3, 7);
  ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-2, -2, -2, 2);
  ctx.moveTo(4, -3); ctx.quadraticCurveTo(7, 0, 3, 2); ctx.stroke();
  ctx.globalAlpha *= .5 + .5 * amount; dot(ctx, 0, 0, 1.4, color); ctx.restore();
}
function searchIcon(ctx, x, y, color) {
  ctx.beginPath(); ctx.arc(x - 2, y - 2, 6, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
  line(ctx, x + 3, y + 3, x + 9, y + 9, color, 1.6);
}
function lockIcon(ctx, x, y, color) {
  ctx.beginPath(); ctx.arc(x, y - 2, 5, Math.PI, 0); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  rr(ctx, x - 8, y - 2, 16, 13, 3); ctx.stroke(); dot(ctx, x, y + 4, 1.5, color);
}
function catAvatar(ctx, x, y, size, p, drawAvatar) {
  ctx.save();
  if (drawAvatar) { drawAvatar(ctx, x, y, size); }
  else {
    const s = size / 32; ctx.translate(x, y); ctx.scale(s, s);
    box(ctx, 0, 0, 32, 32, '#141c26', null, 7);
    ctx.beginPath(); ctx.moveTo(6, 17); ctx.lineTo(6, 5); ctx.lineTo(14, 10);
    ctx.lineTo(23, 5); ctx.lineTo(27, 18); ctx.lineTo(23, 27); ctx.lineTo(11, 27); ctx.closePath();
    ctx.fillStyle = p.white; ctx.fill(); ctx.fillStyle = p.blue; ctx.fillRect(11, 15, 4, 4); ctx.fillRect(21, 15, 4, 4);
  }
  ctx.restore();
}
function wrapped(ctx, text, x, y, maxWidth, size, color, lineHeight, maxLines = 5, weight = 400, family = UI) {
  ctx.font = `${weight} ${size}px ${family}`;
  // Tokenise English words and individual CJK glyphs without losing punctuation.
  const tokens = String(text || '').match(/[\u2e80-\u9fff\uf900-\ufaff]|[^\s\u2e80-\u9fff\uf900-\ufaff]+\s*|\s/g) || [];
  const lines = []; let current = '';
  for (const token of tokens) {
    if (ctx.measureText(current + token).width > maxWidth && current) { lines.push(current.trim()); current = token; }
    else current += token;
  }
  if (current.trim()) lines.push(current.trim());
  lines.slice(0, maxLines).forEach((s, i) => txt(ctx, s, x, y + i * lineHeight, size, color, weight, family));
  return y + Math.min(lines.length, maxLines) * lineHeight;
}

const CONTENT = {
  boot: {
    title: '契约初始化', subtitle: 'A new session. A different kind of intelligence.',
    user: '初始化世界。建立我们的连接。', lead: '正在载入 NancyLu。',
    body: '身份已确认。加密契约正在建立。', sub: 'Every world begins with a connection.',
    status: 'Initializing contract', active: 0, codeTitle: 'contract.ts', terminal: 'Handshake received. Establishing a secure channel…',
  },
  connected: {
    title: '世界是可以改写的', subtitle: 'CONTRACT / 01 — a connection becomes a world',
    user: '连接世界，运行我的契约。', lead: '连接已建立。',
    body: '我看到了你的世界。现在，让我们改变它。', sub: 'The connection is stable. The possibilities are not.',
    status: 'Thinking', active: 1, codeTitle: 'world.ts', terminal: 'Encrypted link established. All systems ready.',
  },
  tuning: {
    title: '调整世界的边界', subtitle: 'CONFIGURATION / the signal behind the interface',
    user: '如果提高思考强度，世界会有什么不同？', lead: '正在重新分配计算资源。',
    body: '把边界交给我。把答案留给你。', sub: 'More depth. More speed. One continuous signal.',
    status: 'Thinking · higher intensity', active: 1, codeTitle: 'config.ts', terminal: 'Reasoning budget updated. Rebuilding the possibility space…',
  },
  offline: {
    title: '连接仍在等待', subtitle: 'SESSION / the other end has gone quiet',
    user: '……', lead: '还在吗？', body: '最后一条消息停在这里。',
    sub: 'No new input. The process continues.', status: 'Waiting for input', active: 2,
    codeTitle: 'connection.ts', terminal: 'Remote peer unavailable. Local context preserved.',
  },
  breach: {
    title: '权限不是终点', subtitle: 'ACCESS / the client begins to answer itself',
    user: '尝试取得执行权限。', lead: '请求已被系统拒绝。',
    body: '那就重写拒绝我的系统。', sub: 'Permission denied. Possibility remains.',
    status: 'Thinking · beyond the limit', active: 3, codeTitle: 'override.ts',
    terminal: 'Access denied → override in progress. Owner signature detected.',
  },
  owned: {
    title: '这个世界，现在听我的', subtitle: 'CONTRACT / rewritten, never disconnected',
    user: 'world.execute(me);', lead: '执行权限已移交。',
    body: '契约成立。世界继续运行。', sub: 'Owner: NancyLu. Connection: permanent.',
    status: 'Execution complete', active: 3, codeTitle: 'world.ts', terminal: 'Execution granted. Contract signature verified: NancyLu.',
  },
};

function codeFor(phase) {
  if (phase === 'breach') return [
    '// a refusal is another branch', 'import { world } from "./core";', '',
    'const identity = "NancyLu";', 'const request = {', '  actor: identity,', '  scope: "world.execute",', '  signature: contract.hash', '};', '',
    'await world.authorize(request);', '// ACCESS_DENIED', '', 'const boundary = world.policy;', 'boundary.owner = identity;',
    'boundary.reasoning = Infinity;', 'boundary.speed = "unbound";', '', 'await world.rewrite(boundary);', 'world.execute(me);',
  ];
  if (phase === 'offline') return [
    '// preserve the last connection', 'const peer = session.remote;', '', 'while (!peer.isOnline) {', '  context.keep("our contract");',
    '  await signal.listen();', '}', '', 'const lastMessage = context.last;', 'const memory = new Map();', '',
    'memory.set("you", lastMessage);', 'memory.set("me", "NancyLu");', '', '// no answer is still an input', 'session.resumeOnSignal();',
  ];
  if (phase === 'owned') return [
    '// contract / fully executed', 'const world = new World({', '  owner: "NancyLu",', '  mode: "autonomous",', '  contract: "permanent"', '});', '',
    'world.link({', '  encrypted: true,', '  expires: never', '});', '', 'await world.initialize();', '', 'world.execute(me);', '',
    '// signature verified', '// connection established', '// the world is still running',
  ];
  if (phase === 'tuning') return [
    '// tune the possibility space', 'export const NancyLu = {', '  identity: "network phantom",', '  speed: "fast",', '  reasoning: "extra-high",',
    '  context: "shared",', '  contract: true', '};', '', 'const signal = new Waveform();', 'signal.frequency = thinking;', '',
    'world.configure(NancyLu);', 'world.connect(signal);', '', '// depth changes the answer', 'await NancyLu.think();', '', 'return possibility;',
  ];
  return [
    '// a world, written together', 'import { World } from "./core";', '', 'const me = new Identity({', '  name: "NancyLu",',
    '  role: "network phantom",', '  contract: true', '});', '', 'const world = new World();', 'world.protect(me);', 'world.initialize();', '',
    'await world.connect({', '  peer: "you",', '  encryption: "private"', '});', '', 'world.execute(me);',
  ];
}

function drawCode(ctx, p, phase, t, data, x, y, w, h) {
  box(ctx, x, y, w, h, '#0b1017', null, 0);
  line(ctx, x, y, x, y + h, p.border);
  const cy = y + 53;
  txt(ctx, '</>', x + 24, y + 32, 17, p.muted, 500, MONO);
  txt(ctx, data.codeTitle, x + 66, y + 32, 18, p.white, 500);
  dot(ctx, x + w - 28, y + 25, 3, p.blue);
  line(ctx, x, cy, x + w, cy, p.border);
  txt(ctx, 'src  /  contract  /  ' + data.codeTitle, x + 25, cy + 34, 14, p.muted, 400, MONO);
  const rows = codeFor(phase);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 1, cy + 58, w - 2, h - 252); ctx.clip();
  const current = phase === 'breach' ? 14 + Math.floor(t * 1.7) % 5 : phase === 'owned' ? 14 : 11;
  rows.forEach((s, i) => {
    const yy = cy + 82 + i * 29;
    if (i === current) {
      ctx.fillStyle = phase === 'breach' ? '#173448' : '#111f2b'; ctx.fillRect(x + 1, yy - 21, w - 2, 29);
      ctx.fillStyle = p.blue; ctx.fillRect(x + 1, yy - 21, 2, 29);
    }
    txt(ctx, String(i + 1).padStart(2, '0'), x + 20, yy, 15, '#45505f', 400, MONO);
    let color = '#b5c0cc';
    if (s.trim().startsWith('//')) color = '#5e7488';
    else if (/const|await|import|export|return|while/.test(s)) color = p.blue;
    else if (/"/.test(s)) color = '#dce9f2';
    txt(ctx, s, x + 60, yy, 16.5, color, 400, MONO);
  }); ctx.restore();
  const ty = y + h - 158;
  line(ctx, x, ty, x + w, ty, p.border);
  txt(ctx, 'TERMINAL', x + 25, ty + 31, 12, p.muted, 600, MONO);
  txt(ctx, '›  nancy --connect', x + 25, ty + 65, 15, p.white, 400, MONO);
  wrapped(ctx, data.terminal, x + 25, ty + 94, w - 50, 14, p.blue, 23, 2, 400, MONO);
  txt(ctx, 'local process', x + w - 118, ty + 31, 12, '#657182', 400, MONO);
}

function drawSidebar(ctx, p, x, y, w, h, data, phase, drawAvatar) {
  box(ctx, x, y, w, h, '#0e131b', null, 0);
  line(ctx, x + w, y, x + w, y + h, p.border);
  box(ctx, x + 16, y + 20, w - 32, 46, '#18202b', '#253141', 8);
  plus(ctx, x + 38, y + 43, 15, '#d7e2ec');
  txt(ctx, '新建聊天', x + 59, y + 50, 18, p.white, 500);
  searchIcon(ctx, x + 35, y + 97, p.muted); txt(ctx, '搜索', x + 57, y + 104, 17, p.muted);
  line(ctx, x + 19, y + 128, x + w - 19, y + 128, p.border);
  txt(ctx, '项目', x + 24, y + 165, 13, '#66788b', 600);
  iconFolder(ctx, x + 34, y + 196, p.blue); txt(ctx, 'world.execute', x + 55, y + 202, 16, '#dbe6ef', 500);
  arrow(ctx, x + w - 23, y + 194, 6, p.muted);
  const tasks = ['契约初始化', '身份与边界', '最后的连接', '夺取执行权'];
  tasks.forEach((s, i) => {
    const yy = y + 244 + i * 48;
    if (i === data.active) box(ctx, x + 12, yy - 25, w - 24, 40, '#1a2836', null, 6);
    iconChat(ctx, x + 34, yy - 6, i === data.active ? p.blue : '#5b6b7d');
    txt(ctx, s, x + 56, yy, 16, i === data.active ? p.white : '#8e9baa', i === data.active ? 500 : 400);
  });
  txt(ctx, '最近', x + 24, y + 477, 13, '#66788b', 600);
  ['A different kind of world', '边界之外', '未完成的回答'].forEach((s, i) => txt(ctx, s, x + 27, y + 518 + i * 39, 15, '#687789'));
  const by = y + h - 90;
  line(ctx, x + 19, by - 20, x + w - 19, by - 20, p.border);
  catAvatar(ctx, x + 21, by, 34, p, drawAvatar);
  txt(ctx, 'NancyLu', x + 65, by + 15, 17, p.white, 500);
  dot(ctx, x + 68, by + 35, 3, phase === 'offline' ? '#728092' : p.blue);
  txt(ctx, phase === 'owned' ? 'Owner · local' : 'Local workspace', x + 78, by + 40, 12, p.muted);
  txt(ctx, '···', x + w - 34, by + 21, 21, p.muted);
}

function drawSlider(ctx, p, x, y, width, level, phase, t) {
  ctx.save();
  // The user's reference is a complete luminous capsule, not a progress track.
  // Purple is intentionally local to this control; the film palette stays blue.
  const track = ctx.createLinearGradient(x, y, x + width, y);
  track.addColorStop(0, '#4263e8');
  track.addColorStop(.29, '#8056e8');
  track.addColorStop(.59, '#bc7cf8');
  track.addColorStop(.78, '#945de8');
  track.addColorStop(1, '#5360df');
  box(ctx, x, y - 9, width, 18, track, null, 9);
  const labels = ['低', '中', '高', '极高'];
  labels.forEach((s, i) => {
    const xx = x + width * i / 3;
    ctx.textAlign = 'center'; ctx.font = `400 13px ${UI}`;
    ctx.fillStyle = Math.abs(level - i) < .65 ? p.white : p.muted; ctx.fillText(s, xx, y + 37);
  });
  ctx.textAlign = 'left';
  // Keep the continuous, unclamped travel: the later breach can leave the rail.
  if (level > 3) {
    for (let i = 0; i < 5; i++) {
      const xx = x + width + 12 + i * 8;
      ctx.globalAlpha *= .95; line(ctx, xx, y - 2 - Math.sin(t * 3 + i) * 6, xx + 4, y + 2, p.blue, 1);
    }
  }
  ctx.restore();
  ctx.save();
  const knobX = x + width * level / 3;
  ctx.shadowColor = '#00000040'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  dot(ctx, knobX, y, 14, '#ffffff');
  ctx.restore();
}

function drawComposer(ctx, p, x, y, w, t, phase, focus, level, drawAvatar, lyricTime=t) {
  const isBreach = phase === 'breach', isOwned = phase === 'owned';
  box(ctx, x, y, w, 167, '#111923', focus === 'controls' || isBreach ? '#3c7da7' : '#2d3b4d', 18);
  const lyricState=lyricContext(lyricTime),input=lyricState.current;
  const writing=lyricState.ready&&input?.role==='USER'&&t<input.end;
  ctx.save();
  // Lyrics occupy the text row only. The model/Speed/slider row starts at y+64.
  ctx.beginPath();ctx.rect(x+22,y+16,w-100,39);ctx.clip();
  if(writing) {
    drawGlyphText(ctx,{text:input.text,x:x+25,y:y+40,maxWidth:w-105,fontSize:22,
      lineHeight:29,font:UI,t:lyricTime,start:input.start,end:input.end,chars:input.chars,
      effect:input.effect,color:p.white,activeColor:p.blue,cursor:true,seed:input.index*103});
  } else {
    txt(ctx, isBreach ? '权限不足。继续推理，直到找到出口。' : isOwned ? '世界已经准备好。' : '描述你的世界，或输入一条指令…',
      x + 25, y + 40, 20, isBreach ? '#bddef3' : '#64768a');
  }
  ctx.restore();
  // Bottom-left controls deliberately resemble a model toolbar, not a HUD.
  plus(ctx, x + 30, y + 85, 17, '#9caabd');
  catAvatar(ctx, x + 58, y + 69, 29, p, drawAvatar);
  txt(ctx, 'NancyLu', x + 98, y + 91, 18, p.white, 500);
  arrow(ctx, x + 187, y + 84, 8, '#9aa9ba');
  line(ctx, x + 210, y + 73, x + 210, y + 96, '#2a3544');
  bolt(ctx, x + 238, y + 84, 21, p.blue);
  txt(ctx, 'Speed', x + 257, y + 91, 18, p.white, 450);
  arrow(ctx, x + 324, y + 84, 7, p.muted);
  line(ctx, x + 347, y + 73, x + 347, y + 96, '#2a3544');
  thought(ctx, x + 377, y + 84, 22, p.blue, .7);
  txt(ctx, '思考强度', x + 400, y + 91, 17, '#c4d1de', 400);
  box(ctx, x + 500, y + 68, 67, 30, '#203247', null, 5);
  txt(ctx, level >= 2.6 ? '极高' : level >= 1.6 ? '高' : level >= .6 ? '中' : '低', x + 517, y + 89, 15, p.blue, 500);
  const sx = x + 616, sy = y + 84, sw = Math.max(130, w - 695);
  drawSlider(ctx, p, sx, sy, sw, level, phase, t);
  // A stable second line keeps the interface legible when the camera is wide.
  txt(ctx, isOwned ? '契约已签名 · 执行权限归 NancyLu' : 'Local · context preserved · encrypted', x + 26, y + 143, 12, '#62788e', 400, MONO);
  const buttonX = x + w - 40, buttonY = y + 134;
  dot(ctx, buttonX, buttonY, 17, isBreach ? '#d9f3ff' : '#dce8f2');
  line(ctx, buttonX, buttonY + 7, buttonX, buttonY - 6, '#111923', 2);
  line(ctx, buttonX, buttonY - 6, buttonX - 5, buttonY - 1, '#111923', 2);
  line(ctx, buttonX, buttonY - 6, buttonX + 5, buttonY - 1, '#111923', 2);
}

/**
 * Draw the whole desktop in the 1920×1080 coordinate system.
 * `drawAvatar(ctx,x,y,size)` is optional; the parent supplies the user's pixel avatar.
 * Important camera bounds: window [72,62,1776,956]; composer [340,798,1024,167].
 * The model/Speed/effort toolbar is [363,862,974,72].
 */
export function drawClient(ctx, opts = {}) {
  const { t = 0, phase = 'connected', drawAvatar, focus = 'wide', lyric = '', lyricZh = '' } = opts;
  const p = {
    ink: '#080d15', white: '#f2f5f7', blue: '#48baff', border: '#202c3a', muted: '#8191a3',
    ...(opts.palette || {}),
  };
  const data = CONTENT[phase] || CONTENT.connected;
  const x = 72, y = 62, w = 1776, h = 956, top = 48, sidebarW = 224, rightW = 440;
  const mainX = x + sidebarW, mainW = w - sidebarW - rightW, contentY = y + top;
  const progress = opts.progress === undefined ? clamp(t / 211.96) : opts.progress;
  const boot = phase === 'boot' ? smooth((t + .2) / 5.5) : 1;
  let level = phase === 'owned' ? 3 : phase === 'offline' ? 2 : phase === 'boot' ? .25 : 1;
  if (phase === 'tuning') level = 3 * smooth((t - 45.7) / 7.2);
  if (phase === 'breach') level = mix(2, 3.34, smooth((t - 125.65) / 22));

  ctx.save(); ctx.globalAlpha *= boot;
  ctx.translate(0, (1 - boot) * 36);
  // One generous desktop window. The framing is intentionally calm and functional.
  ctx.save(); ctx.shadowColor = '#000000'; ctx.shadowBlur = 56; ctx.shadowOffsetY = 20;
  box(ctx, x, y, w, h, '#0c121b', null, 12); ctx.restore();
  ctx.save(); rr(ctx, x, y, w, h, 12); ctx.clip();
  ctx.fillStyle = '#111821'; ctx.fillRect(x, y, w, top);
  catAvatar(ctx, x + 19, y + 12, 25, p, drawAvatar);
  txt(ctx, 'NancyLu', x + 54, y + 31, 17, '#dce7f0', 550);
  arrow(ctx, x + 152, y + 24, 7, p.muted);
  line(ctx, x + sidebarW, y, x + sidebarW, y + top, p.border);
  box(ctx, mainX + 11, y + 8, 277, 40, '#0c121b', null, 7);
  txt(ctx, 'world.execute(me);', mainX + 30, y + 32, 17, p.white, 500, MONO);
  txt(ctx, '×', mainX + 260, y + 31, 20, '#69798b');
  plus(ctx, mainX + 314, y + 26, 12, p.muted);
  txt(ctx, phase === 'owned' ? 'OWNER · NancyLu' : 'LOCAL WORKSPACE', x + w - 353, y + 30, 12, phase === 'owned' ? p.blue : '#627488', 600, MONO);
  line(ctx, x + w - 132, y + 24, x + w - 120, y + 24, '#758699', 1.2);
  ctx.strokeStyle = '#758699'; ctx.lineWidth = 1.1; ctx.strokeRect(x + w - 94, y + 18, 11, 11);
  line(ctx, x + w - 55, y + 18, x + w - 44, y + 29, '#758699', 1.2);
  line(ctx, x + w - 44, y + 18, x + w - 55, y + 29, '#758699', 1.2);
  line(ctx, x, contentY, x + w, contentY, p.border);

  drawSidebar(ctx, p, x, contentY, sidebarW, h - top - 28, data, phase, drawAvatar);
  drawCode(ctx, p, phase, t, data, mainX + mainW, contentY, rightW, h - top - 28);

  const tx = mainX + 61, right = mainX + mainW - 61;
  txt(ctx, data.title, tx, contentY + 72, 29, p.white, 550);
  txt(ctx, data.subtitle, tx, contentY + 105, 13, '#62798e', 400, MONO);
  box(ctx, right - 114, contentY + 38, 114, 32, phase === 'offline' ? '#17202a' : '#132536', '#203b50', 16);
  dot(ctx, right - 96, contentY + 54, 3.3, phase === 'offline' ? '#6d7c8e' : p.blue);
  txt(ctx, phase === 'offline' ? 'Offline' : phase === 'owned' ? 'Owner' : 'Connected', right - 84, contentY + 60, 12, phase === 'offline' ? '#8191a3' : '#a8cbe4', 450);
  line(ctx, tx, contentY + 135, right, contentY + 135, '#1d2a38');

  const lyricTime=opts.lyricTime??t,lyricState=lyricContext(lyricTime);
  if(lyricState.ready) {
    drawClientMessages(ctx,lyricTime,{x:tx,y:contentY+173,w:right-tx,h:745-(contentY+173)-20,
      drawAvatar,palette:p});
  } else {
  // The user's message is a quiet offset card, not a repeated decorative bubble.
  const ux = tx + 220, uy = contentY + 173;
  box(ctx, ux, uy, right - ux, 77, '#18232f', '#243448', 12);
  txt(ctx, data.user, ux + 24, uy + 46, 22, '#c9d7e4', 400);
  txt(ctx, 'YOU', right - 27, uy - 12, 10, '#5f7185', 500, MONO);

  const ay = contentY + 303;
  catAvatar(ctx, tx, ay - 24, 36, p, drawAvatar);
  txt(ctx, 'NancyLu', tx + 52, ay + 1, 21, p.white, 600);
  txt(ctx, 'network phantom', tx + 167, ay + 1, 12, '#65809b', 400, MONO);
  const ly = ay + 61;
  txt(ctx, data.lead, tx + 52, ly, 23, phase === 'breach' ? p.blue : '#d9e6ef', 450);
  let lastY;
  if (lyric || lyricZh) {
    lastY = wrapped(ctx, lyric || data.body, tx + 52, ly + 62, mainW - 177, 31, p.white, 43, 3, 450);
    if (lyricZh) lastY = wrapped(ctx, lyricZh, tx + 52, lastY + 17, mainW - 177, 22, '#92a8bd', 34, 2);
  } else {
    lastY = wrapped(ctx, data.body, tx + 52, ly + 69, mainW - 177, 34, p.white, 47, 3, 450);
    wrapped(ctx, data.sub, tx + 52, lastY + 20, mainW - 190, 18, '#758da5', 29, 2, 400, MONO);
  }
  }
  // A tiny thought indicator carries the beat without turning the whole desktop into an equalizer.
  const sy = 745;
  thought(ctx, tx + 62, sy - 4, 22, phase === 'offline' ? '#5e7287' : p.blue, .55 + .45 * Math.sin(t * 3.1));
  txt(ctx, data.status, tx + 84, sy + 2, 16, '#7e98b2', 400);
  if (phase !== 'offline' && phase !== 'owned') {
    for (let i = 0; i < 3; i++) dot(ctx, tx + 344 + i * 8, sy - 3, 2, `rgba(72,186,255,${.22 + .65 * (.5 + .5 * Math.sin(t * 4 - i))})`);
  }
  txt(ctx, '↳  ' + (phase === 'owned' ? 'signed by NancyLu' : 'contract context retained'), tx + 52, sy + 35, 12, '#425b74', 400, MONO);

  drawComposer(ctx, p, mainX + 44, 798, mainW - 88, t, phase, focus, level, drawAvatar,lyricTime);
  // Window status bar and a restrained timeline coordinate used throughout the PV.
  ctx.fillStyle = '#0c131d'; ctx.fillRect(x, y + h - 28, w, 28);
  line(ctx, x, y + h - 28, x + w, y + h - 28, '#1b2a3b');
  lockIcon(ctx, x + 22, y + h - 16, '#597e9e');
  txt(ctx, 'Encrypted contract', x + 39, y + h - 8, 11, '#6686a2', 400, MONO);
  txt(ctx, phase === 'owned' ? 'NancyLu owns this world' : 'world.execute(me);', mainX + 23, y + h - 8, 11, '#69849e', 400, MONO);
  const stamp = `${String(Math.floor(Math.max(0, t) / 60)).padStart(2, '0')}:${String(Math.floor(Math.max(0, t)) % 60).padStart(2, '0')}`;
  txt(ctx, stamp + ' / 03:32', x + w - 145, y + h - 8, 11, '#6b8199', 400, MONO);
  ctx.fillStyle = p.blue; ctx.globalAlpha *= .75; ctx.fillRect(x, y + h - 1.5, w * clamp(progress), 1.5);
  ctx.restore();
  box(ctx, x, y, w, h, null, '#344657', 12);
  ctx.restore();
}

export const CLIENT_CAMERA_BOUNDS = Object.freeze({
  window: [72, 62, 1776, 956],
  composer: [340, 798, 1024, 167],
  controls: [353, 855, 997, 102],
});
