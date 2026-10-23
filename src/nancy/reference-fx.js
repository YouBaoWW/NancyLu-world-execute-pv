/**
 * NancyLu adapter for the reference film's ORIGINAL WebGL2 post engine.
 *
 * The mix shader, five-level bloom pyramid and final camera/damage/light pass
 * are imported unchanged from ../engine/post.js (Nyankomint, MIT; see LICENSE).
 * This file only supplies complete per-frame parameters and the blue ink look.
 * No original character PNGs are loaded or used.
 */
import { Post } from '../engine/post.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const BLUE = [72 / 255, 186 / 255, 1];
const BG = [8 / 255, 13 / 255, 21 / 255];
const CUT = Object.freeze({ type: 0, k: 0, p: [0, 0, 0, 0], edge: BLUE });
const BEAT = 60 / 130;
const FIRST_BEAT = 0.344;

const DEFAULT_CONFIG = {
  glow: { base: 0.55, lowGain: 0.2, flashGain: 0.8, threshold: 0, satKnee: [0.28, 0.62], radius: 1 },
  post: { scanlines: 0.03, scanlineCount: 360, vignette: 0.34, grain: 0.014, aberration: 0, flicker: 0, zoomOnLow: 0.005, flashStrength: 0.5 },
  safety: { maxFlash: 0.7, preroll: 5 },
};

function decaySince(t, step, decay) {
  if (t < FIRST_BEAT) return 0;
  const age = (t - FIRST_BEAT) % step;
  return Math.exp(-age * decay);
}

/**
 * Complete original-engine fx object. All times are SONG seconds, not file time.
 * Strength raises the reference-style finish without changing the shot schedule.
 * Exposed for parameter inspection; it never reads or changes a previous frame.
 */
export function referenceFxAt(t, strength = 0) {
  t = Number.isFinite(t) ? t : 0;
  const s = clamp(Number.isFinite(strength) ? strength : 0);
  const beat = decaySince(t, BEAT, 9);
  const bar = decaySince(t, BEAT * 4, 8);
  const error = t >= 125.65 && t < 148.04;
  const execution = t >= 148.04 && t < 162.81;
  const climax = t >= 162.81 && t < 192.34;
  const broken = error ? clamp((t - 125.65) / (148.04 - 125.65)) : 0;
  // The 6–8-frame local event follows the reference's short fault envelopes.
  const faultAge = t >= FIRST_BEAT ? (t - FIRST_BEAT) % (BEAT * 2) : 1;
  const fault = faultAge < 7 / 60 ? Math.pow(1 - faultAge / (7 / 60), 1.4) : 0;
  const light = climax ? 1 : execution ? 0.35 : 0;

  const fx = {
    flash: 0, flashColor: null,
    glow: 0.16 + s * 0.16,
    bloomAll: 0, bloomThreshold: 0.35,
    rays: 0, raysAt: [1130, 420],
    streak: 0,
    zoomBlur: 0, zoomAt: [1130, 420],
    zoom: 1, rot: 0, shake: [0, 0],
    // Channel separation would introduce other hues: keep both at zero.
    aberration: 0, rgbSplit: 0,
    glitch: 0, mosh: 0,
    mosaic: 0, mosaicRect: null,
    invert: 0, desat: 0,
    scan: 0.5, vignette: 0.65,
    bright: 1, hud: 1,
  };

  if (error) {
    fx.glow = 0.22 + broken * 0.18 + s * 0.2;
    fx.glitch = (0.14 + broken * 0.4) * bar * (0.75 + s * 0.5);
    fx.mosh = broken * (0.045 + s * 0.10) * fault;
    fx.scan = 1 + broken * 0.65;
    fx.shake = [Math.sin(t * 79.3) * fault * (1 + s * 3), Math.sin(t * 53.7) * fault * (0.5 + s * 1.5)];
  }
  if (light) {
    // Same v4 optical vocabulary as the original final chorus: broad light,
    // an origin-centred ray pass, horizontal streak, and a restrained push.
    fx.glow = (execution ? 0.28 : 0.68) + light * beat * 0.16 + s * 0.4;
    fx.bloomAll = light * (0.2 + beat * 0.10 + s * 0.2);
    fx.rays = light * (0.12 + beat * 0.06 + s * 0.52);
    fx.streak = light * (0.2 + s * 0.28);
    fx.zoomBlur = light * fault * (0.004 + s * 0.014);
    fx.zoom = 1 + light * beat * (0.002 + s * 0.004);
    fx.glitch = light * fault * (0.04 + s * 0.13);
    fx.mosh = light * fault * s * 0.045;
    fx.scan = execution ? 2.2 : 1;
    fx.vignette = 0.8;
  }
  if (t >= 192.34) {
    fx.glow = 0.12; fx.scan = 0.5; fx.vignette = 0.65;
  }
  if (t < 0) { fx.glow = 0; fx.scan = 0; fx.vignette = 0; }
  return fx;
}

export class ReferenceFX {
  constructor(canvas, cfg = {}) {
    this.canvas = canvas;
    // Keep caller values (including reference config's bloom kernel and finish),
    // filling missing keys because Post.render expects complete nested objects.
    this.cfg = {
      ...cfg,
      glow: { ...DEFAULT_CONFIG.glow, ...(cfg.glow || {}) },
      post: { ...DEFAULT_CONFIG.post, ...(cfg.post || {}), aberration: 0 },
      safety: { ...DEFAULT_CONFIG.safety, ...(cfg.safety || {}) },
    };
    this.look = {
      tint: [...BLUE], flashCol: [...BLUE], moshCol: [...BLUE],
      bg: BG.map(v => v * 1.03), glow: 1,
    };
    const makeCanvas = () => {
      if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(1, 1);
      const c = canvas.ownerDocument.createElement('canvas'); c.width = c.height = 1; return c;
    };
    this.hud = makeCanvas();
    this.hud.getContext('2d').clearRect(0, 0, 1, 1);
    this.post = new Post(canvas, this.cfg);
    this.width = this.height = 0;
  }

  /** Canvas2D source -> reference mix/bloom/final pipeline, for normal display. */
  render(sourceCanvas, t, strength = 0) {
    if (sourceCanvas === this.canvas) throw new Error('ReferenceFX needs a separate source Canvas2D layer');
    this.renderLayers({ a: sourceCanvas, b: null, hud: this.hud }, CUT, t, strength);
  }

  /**
   * Optional direct route for overlapping shots. `transition` is the unmodified
   * result of engine/transitions.js resolveTransition(); render() uses a cut.
   */
  renderLayers(layers, transition = CUT, t = 0, strength = 0) {
    const w = layers.a.width, h = layers.a.height;
    if (!w || !h) throw new Error('ReferenceFX source canvas has zero dimensions');
    if (w !== this.width || h !== this.height) {
      this.post.resize(w, h); this.width = w; this.height = h;
    }
    const fx = referenceFxAt(t, strength);
    const tr = {
      type: transition?.type ?? 0,
      k: transition?.k ?? 0,
      p: transition?.p ?? [0, 0, 0, 0],
      // All transition edge light uses the NancyLu electric-blue ink.
      edge: [...BLUE],
    };
    this.lastFx = fx;
    this.post.render({ a: layers.a, b: layers.b ?? null, hud: layers.hud ?? this.hud }, tr, fx, this.look, Math.round(t * 60), false);
  }

  rendererInfo() { return this.post.rendererInfo(); }
}
