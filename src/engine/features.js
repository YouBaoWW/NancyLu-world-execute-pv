// Audio features sampler. All lookups are pure functions of t (seconds).
import { clamp, pulse } from './util.js';

export class Features {
  constructor(data, cfg) {
    this.d = data;
    this.fps = data.meta.fps;
    this.n = data.meta.frames;
    this.duration = data.meta.duration;
    this.bpm = data.bpm;
    this.period = data.grid.period;       // seconds per beat (constant-tempo grid)
    this.t0 = data.grid.t0;               // time of beat 0
    this.downPhase = data.downbeatPhase;  // beat i starts a bar when i % 4 === downPhase
    this.onT = data.onsets.t;
    this.onS = data.onsets.s;
    this.nb = data.meta.spectrumBands;
    this.spec = Uint8Array.from(data.spectrum);
    this.r = cfg.reactive;
  }

  /** Linear-interpolated per-frame series: 'rms' | 'low' | 'mid' | 'high'. */
  series(name, t) {
    const a = this.d[name], x = clamp(t * this.fps, 0, this.n - 1);
    const i = Math.floor(x), k = x - i;
    return a[i] * (1 - k) + a[Math.min(i + 1, this.n - 1)] * k;
  }

  /** Peak-hold envelope: max over the recent past of value * exp(-release * age). Smooth but stateless. */
  env(name, t, release = 8, windowSec = 0.5) {
    const a = this.d[name], end = Math.floor(clamp(t * this.fps, 0, this.n - 1));
    const start = Math.max(0, end - Math.ceil(windowSec * this.fps));
    let m = 0;
    for (let i = start; i <= end; i++) m = Math.max(m, a[i] * Math.exp(-release * (t - i / this.fps)));
    return Math.max(m, this.series(name, t));
  }

  /** Spectrum (0..1 per band) written into `out`. */
  spectrum(t, out = new Float32Array(this.nb)) {
    const x = clamp(t * this.fps, 0, this.n - 1), i = Math.floor(x), k = x - i, j = Math.min(i + 1, this.n - 1);
    for (let b = 0; b < this.nb; b++) {
      out[b] = (this.spec[i * this.nb + b] * (1 - k) + this.spec[j * this.nb + b] * k) / 255;
    }
    return out;
  }

  beatTime(i) { return this.t0 + i * this.period; }
  beatIndex(t) { return Math.floor((t - this.t0) / this.period + 1e-6); }
  /** Bar n starts on beat downPhase + 4n. */
  barTime(n) { return this.beatTime(this.downPhase + 4 * n); }
  barIndex(t) { return Math.floor((this.beatIndex(t) - this.downPhase) / 4); }
  /** Nearest half-beat (eighth note) to t: cut points for shots that follow a lyric line. */
  snapHalf(t) { return this.t0 + Math.round((t - this.t0) / (this.period / 2)) * (this.period / 2); }
  /** Nearest beat time if within tol seconds, else t itself. */
  snapToBeat(t, tol = 0.09) {
    const b = this.beatTime(Math.round((t - this.t0) / this.period));
    return Math.abs(b - t) <= tol ? b : t;
  }

  /** Index of the last onset with time <= t (or -1). */
  onsetIndex(t) {
    let lo = 0, hi = this.onT.length - 1, r = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (this.onT[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; }
    return r;
  }
  /** Onsets in (t0, t1] with strength >= minS, as [{i, t, s}]. */
  onsetsIn(t0, t1, minS = 0) {
    const out = [];
    for (let i = this.onsetIndex(t1); i >= 0 && this.onT[i] > t0; i--) {
      if (this.onS[i] >= minS) out.push({ i, t: this.onT[i], s: this.onS[i] });
    }
    return out;
  }

  /**
   * Everything a scene usually needs at time t. Before the song (t < 0: the warning page) there is no audio:
   * the levels are those of the first instant and nothing has pulsed yet.
   */
  sample(time) {
    const t = time < 0 ? 0 : time;
    if (time < 0) {
      return {
        t: time, src: this, rms: 0, low: 0, mid: 0, high: 0, lowEnv: 0, rmsEnv: 0,
        beat: this.beatIndex(time), beatPhase: 0, sinceBeat: 0, beatInBar: 0, bar: this.barIndex(time), sinceBar: 0, barPhase: 0,
        beatPulse: 0, barPulse: 0, onset: -1, sinceOnset: 1e9, onsetStrength: 0, onsetPulse: 0,
      };
    }
    const beat = this.beatIndex(t);
    const sinceBeat = t - this.beatTime(beat);
    const rel = beat - this.downPhase;
    const bar = Math.floor(rel / 4), beatInBar = ((rel % 4) + 4) % 4;
    const sinceBar = t - this.barTime(bar);
    const started = t >= this.t0;                // no beat reactions before the first beat

    const oi = this.onsetIndex(t);
    const sinceOnset = oi >= 0 ? t - this.onT[oi] : 1e9;
    const onsetStrength = oi >= 0 ? this.onS[oi] : 0;

    return {
      t, src: this,
      rms: this.series('rms', t), low: this.series('low', t), mid: this.series('mid', t), high: this.series('high', t),
      lowEnv: this.env('low', t, 7), rmsEnv: this.env('rms', t, 5),
      beat, beatPhase: sinceBeat / this.period, sinceBeat, beatInBar,
      bar, sinceBar, barPhase: sinceBar / (this.period * 4),
      beatPulse: started ? pulse(sinceBeat, this.r.beatDecay) : 0,
      barPulse: started ? pulse(sinceBar, this.r.beatDecay * 0.6) : 0,
      onset: oi, sinceOnset, onsetStrength,
      onsetPulse: onsetStrength * pulse(sinceOnset, this.r.onsetDecay),
    };
  }
}
