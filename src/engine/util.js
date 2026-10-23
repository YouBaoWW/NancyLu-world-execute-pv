// Small math / easing helpers shared by engine and scenes.

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
/** 0..1 progress of t inside [a,b], clamped. */
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (k) => k * k * (3 - 2 * k);
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k) => k * k * k;
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
/** Overshooting ease (for things that "snap" into place). */
export const easeBack = (k) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
/** Exponential decay envelope: 1 at since=0, 0 before the event. */
export const pulse = (since, decay) => (since < 0 ? 0 : Math.exp(-decay * since));
/** Fade-in over [a, a+fin] and fade-out over [b-fout, b]. */
export const window01 = (t, a, b, fin = 0.2, fout = 0.2) => Math.min(prog(t, a, a + fin), 1 - prog(t, b - fout, b));

export const pad = (n, len, ch = '0') => String(n).padStart(len, ch);
/** mm:ss.mmm (song time; negative = the warning page before the song) */
export function timecode(t) {
  const a = Math.abs(t), m = Math.floor(a / 60), s = a - m * 60;
  return `${t < 0 ? '-' : ''}${pad(m, 2)}:${pad(s.toFixed(3), 6)}`;
}
