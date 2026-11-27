// Synthesised Web Audio effects — no asset files, no network.
// Created lazily on the first user gesture; silent when audio is unavailable.
export function createAudio() {
  let ctx = null;
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch { return null; }
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    const c = ensure();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.08, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(); osc.stop(c.currentTime + dur);
    } catch { /* audio is best-effort */ }
  }
  return {
    unlock() { ensure(); },
    ring() { tone(880, 0.12, 'sine', 0.09); setTimeout(() => tone(1320, 0.18, 'sine', 0.09), 90); },
    hit() { tone(160, 0.25, 'sawtooth', 0.1, 60); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.09), i * 130)); },
    over() { [392, 311, 233].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.08), i * 160)); },
  };
}
