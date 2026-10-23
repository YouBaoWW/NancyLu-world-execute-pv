// Tiny static file server (no dependencies) used by both preview and export.
//   node export/server.mjs --open        -> preview at http://localhost:5173/
// Supports HTTP Range (audio seeking) and a WebSocket upgrade hook the exporter uses to receive frames.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureDemoLyrics } from '../tools/prepare-lyrics.mjs';
import { isMain } from '../tools/runtime.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.wav': 'audio/wav',
  '.woff2': 'font/woff2', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.lrc': 'text/plain; charset=utf-8',
};

function serveFile(req, res) {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (rel === '/') rel = '/nancy-preview.html';
  if (rel === '/favicon.ico') { res.writeHead(204).end(); return; }
  if (rel === '/__nancy-status.json') {
    let demo=null;
    try {demo=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lyrics-user.json'),'utf8')).demo===true;} catch {}
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify({audioAvailable:fs.existsSync(path.join(ROOT,'media/song.mp3')),demo}));
    return;
  }
  const file = path.resolve(ROOT, '.' + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }   // stay inside the project
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('not found'); return; }
    const head = {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store',
    };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), st.size - 1) : st.size - 1;
      if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }).end(); return; }
      res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { ...head, 'Content-Length': st.size });
      fs.createReadStream(file).pipe(res);
    }
  });
}

/** Start the server. `onUpgrade(req, socket)` handles the exporter's frame WebSocket. Tries following ports if busy. */
export function startServer({ port = 5173, onUpgrade = null } = {}) {
  ensureDemoLyrics({root:ROOT});
  return new Promise((resolve, reject) => {
    const server = http.createServer(serveFile);
    server.on('upgrade', (req, socket) => (onUpgrade ? onUpgrade(req, socket) : socket.destroy()));
    let tries = 0;
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE' && tries++ < 20) server.listen(++port, '127.0.0.1');
      else reject(e);
    });
    server.on('listening', () => resolve({ server, port, url: `http://localhost:${port}` }));
    server.listen(port, '127.0.0.1');
  });
}

// ---- run directly: preview server -------------------------------------------------
if (isMain(import.meta.url)) {
  // Original demo dialogue is created only when the local lyric data is absent.
  const audio = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).paths.audio;
  if (!fs.existsSync(path.join(ROOT, audio))) console.warn(`[audio] "${audio}" not found (config.json -> paths.audio): the preview can be scrubbed but will not play; an export needs the file.`);
  const { url } = await startServer({ port: +process.env.PORT || 5173 });   // PORT lets a launcher pick a free port
  console.log(`preview: ${url}/   (Ctrl+C to stop)`);
  if (process.argv.includes('--open')) {
    const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref();
  }
}
