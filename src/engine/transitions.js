// Transition library. A transition blends the OUTGOING shot (layer A) into the INCOMING
// shot (layer B) while both are live, i.e. during the overlap of their time ranges. The
// incoming shot names it:   enter: { type: 'scan', dur: 0.46, align: 'end', ...params }
//
//   align 'end'    overlap ends on the cut time   (lead-ins: zoom, wipes that land on the beat)
//   align 'start'  overlap starts on the cut time (things triggered by the beat: glitch, shatter)
//   align 'center' overlap straddles the cut time
//   plus, for any type (also plain 'cut'): flash / flashColor / flashDecay = colour flash on the cut
//
// When to use what (keep it motivated by the lyric, not decorative):
//   cut        hard cut; with `flash` = white / colour flash cut       hits, keyword slams
//   flashcut   cut hidden inside a colour bloom                        big section changes
//   fade       plain dissolve                                          fading, loss, the ending
//   glitch     blocks + torn rows swap between the shots               instability, errors
//   scan       scanline wipe with a hot edge (dir 0 down 1 up 2 right 3 left)   "printing", booting
//   circle     iris from a point (inverse: true closes it)             focus on / from an object
//   diag       slatted diagonal wipe                                   brisk change of topic
//   grid       cells flip in a diagonal cascade                        data, parameters
//   zoom       fly through the picture (out: true reverses)            going deeper / pulling out
//   shatter    picture breaks into falling shards                      breaking, fragments
//   dissolve   pixel blocks flip at random (size = block scale)        erasing, decay
//   winclose   outgoing picture collapses like a closed window / CRT   leaving, shutting down
//   winpop     incoming picture pops up as a window                    dialogs, errors, new process
//   push       both pictures slide (dir 0 left 1 right 2 up 3 down)    switching between two states
//   slices     horizontal slices slide apart                           tearing
// Shape-to-shape MATCH CUTS are done in the scenes themselves with shapes.js (the same
// outline is carried across a hard cut and morphed), not as an image-space blend.
import { clamp, easeInOut } from './util.js';

const TYPES = {
  cut: 0, fade: 1, glitch: 2, scan: 3, circle: 4, diag: 5, grid: 6, zoom: 7, shatter: 8,
  dissolve: 9, winclose: 10, winpop: 11, push: 12, slices: 13, flashcut: 14,
};

/** Types whose progress should ease in/out (the rest run linearly). */
const EASED = new Set(['fade', 'scan', 'circle', 'diag', 'push']);

/**
 * Resolve a shot's `enter` spec into uniforms for the mix pass.
 * @param k  raw progress 0..1 through the overlap
 */
export function resolveTransition(enter, k, pal) {
  const e = enter || { type: 'cut' };
  const type = TYPES[e.type] ?? 0;
  const p = [0, 0, 0, 0];
  const cx = e.x ?? 0.5, cy = e.y ?? 0.5;                    // focus point in screen coords (0..1, y down)
  switch (e.type) {
    case 'scan': case 'push': p[0] = e.dir ?? 0; break;
    case 'circle': {
      const asp = 16 / 9;
      p[0] = cx; p[1] = cy; p[2] = e.inverse ? 1 : 0;
      p[3] = Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => Math.hypot((x - cx) * asp, y - cy))) * 1.02;
      break;
    }
    case 'zoom': p[0] = cx; p[1] = cy; p[2] = e.out ? 1 : 0; break;
    case 'winclose': case 'winpop': p[0] = cx; p[1] = cy; break;
    case 'dissolve': p[0] = e.size ?? 1; break;
    case 'slices': p[0] = e.bands ?? 10; break;
    case 'flashcut': p[0] = e.strength ?? 0.85; break;
    default: break;
  }
  const edge = e.color ? (pal[e.color] ?? pal.accent) : pal.accent;
  return { type, k: EASED.has(e.type) ? easeInOut(clamp(k)) : clamp(k), p, edge: edge.map((v) => v / 255) };
}

/** GLSL for the mix pass (see post.js). A = outgoing, B = incoming, k = progress. */
export const TRANSITION_GLSL = `
float eback(float k) { float c = 1.70158; float x = k - 1.0; return 1.0 + (c + 1.0) * x * x * x + c * x * x; }

vec3 transition(vec2 uv, vec2 s, float k) {
  if (uType == 0) return A(uv);
  if (uType == 1) return mix(A(uv), B(uv), k);

  if (uType == 2) {                                   // glitch: blocks + torn rows
    // rows tear at ~8 Hz, but every block switches from A to B exactly once (no strobing between the shots)
    float tq = floor(uFrame / 8.0), amt = sin(k * 3.14159);
    float band = floor(s.y * 22.0 + h21(vec2(tq, 1.0)) * 22.0);
    float hb = h21(vec2(band, tq));
    float sh = (h21(vec2(band, tq + 5.0)) - 0.5) * 0.3 * amt * step(0.45, hb);
    vec2 u2 = vec2(fract(uv.x + sh), uv.y);
    vec2 cell = floor(s * vec2(12.0, 7.0));
    float pick = step(mix(h21(vec2(floor(s.y * 22.0), 7.0)), h21(cell), 0.5), k * 1.15 - 0.05);
    vec2 ca = vec2(0.012 * amt, 0.0);
    vec3 a = vec3(A(u2 + ca).r, A(u2).g, A(u2 - ca).b);
    vec3 b = vec3(B(u2 + ca).r, B(u2).g, B(u2 - ca).b);
    return mix(a, b, pick);
  }

  if (uType == 3) {                                   // scanline wipe
    float p = uP.x < 0.5 ? s.y : uP.x < 1.5 ? 1.0 - s.y : uP.x < 2.5 ? s.x : 1.0 - s.x;
    float e = k * 1.1 - 0.05, m = step(p, e);
    vec3 c = mix(A(uv), B(uv), m);
    c += uEdge * m * smoothstep(e - 0.12, e, p) * (0.2 + 0.25 * step(0.5, fract(p * 90.0)));
    return c + uEdge * smoothstep(0.006, 0.0, abs(p - e)) * 0.9;
  }

  if (uType == 4) {                                   // iris
    float d = length((s - uP.xy) * vec2(uAspect, 1.0));
    float R = (uP.z > 0.5 ? 1.0 - k : k) * uP.w;
    float m = uP.z > 0.5 ? 1.0 - step(d, R) : step(d, R);
    return mix(A(uv), B(uv), m) + uEdge * smoothstep(0.012, 0.0, abs(d - R)) * 0.9 * step(0.001, k) * step(k, 0.999);
  }

  if (uType == 5) {                                   // slatted diagonal wipe
    float p = (s.x * uAspect + s.y * 0.8) / (uAspect + 0.8);
    float th = p * 0.72 + fract(p * 16.0) * 0.28, e = k * 1.04 - 0.02;
    return mix(A(uv), B(uv), step(th, e)) + uEdge * smoothstep(0.012, 0.0, abs(th - e)) * 0.7;
  }

  if (uType == 6) {                                   // grid cascade
    vec2 n = vec2(16.0, 9.0), cell = floor(s * n), f = fract(s * n) - 0.5;
    float order = (cell.x / n.x + cell.y / n.y) * 0.325 + h21(cell) * 0.35;
    float lk = clamp((k - order * 0.8) / 0.2, 0.0, 1.0);
    float m = step(max(abs(f.x), abs(f.y)), lk * 0.5);
    return mix(A(uv), B(uv), m) + uEdge * m * (1.0 - lk) * 0.5;
  }

  if (uType == 7) {                                   // zoom through
    vec2 ctr = vec2(uP.x, 1.0 - uP.y);
    bool outw = uP.z > 0.5;
    float kk = outw ? 1.0 - k : k;
    float sBig = 1.0 + kk * kk * 9.0;
    vec3 big = vec3(0.0);
    for (int i = 0; i < 8; i++) {                      // radial blur: streaks instead of hard lines sweeping past
      vec2 u = (uv - ctr) / (sBig * (1.0 + float(i) * 0.09 * kk)) + ctr;
      big += outw ? B(u) : A(u);
    }
    big /= 8.0;
    float sSmall = mix(0.12, 1.0, kk * kk * (3.0 - 2.0 * kk));
    vec2 us = (uv - ctr) / sSmall + ctr;
    vec3 small = outw ? A(us) : B(us);
    float m = inside(us) * smoothstep(0.2, 0.7, kk);
    return mix(big * (1.0 - smoothstep(0.25, 0.8, kk)), small, m) + uEdge * sin(k * 3.14159) * 0.12;
  }

  if (uType == 8) {                                   // shatter: triangular shards fall away
    vec3 c = B(uv);
    vec2 n = vec2(9.0, 5.0), c0 = floor(s * n);
    for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) for (int tr = 0; tr < 2; tr++) {
      vec2 cell = c0 + vec2(float(i), float(j)), id = cell * 2.0 + float(tr);
      float lk = clamp(k * 1.5 - h21(id + 5.0) * 0.5, 0.0, 1.0);
      vec2 off = vec2(h21(id) - 0.5, h21(id + 3.0) * 0.9 + 0.1) * (0.25 + 0.5 * h21(id + 9.0)) * lk * lk * vec2(0.4, 0.75);
      vec2 src = s - off, gs = src * n;
      if (floor(gs) == cell && step(1.0, fract(gs.x) + fract(gs.y)) == float(tr) && lk < 1.0)
        c = mix(A(vec2(src.x, 1.0 - src.y)) * (1.0 + lk * 0.8), c, lk * lk);
    }
    return c;
  }

  if (uType == 9) {                                   // pixel dissolve
    vec2 n = vec2(96.0, 54.0) / max(uP.x, 0.25);
    float h = h21(floor(s * n)), e = k * 1.1 - 0.05;
    return mix(A(uv), B(uv), step(h, e)) + uEdge * step(h, e) * step(e - 0.05, h) * 0.5;
  }

  if (uType == 10) {                                  // window / CRT close
    vec2 ctr = vec2(uP.x, 1.0 - uP.y);
    float k1 = smoothstep(0.0, 0.55, k), k2 = smoothstep(0.55, 1.0, k);
    vec2 sc = vec2(mix(1.0, 0.0, k2 * k2), mix(1.0, 0.006, k1));
    vec2 ua = (uv - ctr) / max(sc, vec2(1e-4)) + ctr;
    return mix(B(uv) * smoothstep(0.15, 0.8, k), A(ua) + uEdge * k1 * 0.8, inside(ua) * step(k, 0.999));
  }

  if (uType == 11) {                                  // window pop-up
    vec2 ctr = vec2(uP.x, 1.0 - uP.y);
    float e = max(eback(k), 0.001);
    vec2 ub = (uv - ctr) / e + ctr, q = abs(ub - 0.5);
    float inB = inside(ub), border = step(0.5 - 0.004 / e, max(q.x, q.y)) * inB * step(k, 0.98);
    return mix(mix(A(uv) * (1.0 - 0.6 * k), B(ub), inB), uEdge, border);
  }

  if (uType == 12) {                                  // push / slide
    vec2 d = uP.x < 0.5 ? vec2(1.0, 0.0) : uP.x < 1.5 ? vec2(-1.0, 0.0) : uP.x < 2.5 ? vec2(0.0, -1.0) : vec2(0.0, 1.0);
    return A(uv + d * k) + B(uv - d * (1.0 - k));
  }

  if (uType == 13) {                                  // slices tear apart
    float band = floor(s.y * uP.x), dirn = mod(band, 2.0) * 2.0 - 1.0;
    float lk = clamp(k * 1.5 - h21(vec2(band, 1.0)) * 0.5, 0.0, 1.0);
    vec2 ua = vec2(uv.x + dirn * lk * lk * 1.15, uv.y);
    return inside(ua) > 0.5 ? A(ua) : B(uv);
  }

  // 14 flashcut: the cut happens under a colour bloom
  return mix(k < 0.5 ? A(uv) : B(uv), uEdge, pow(1.0 - abs(2.0 * k - 1.0), 1.5) * uP.x);
}
`;
