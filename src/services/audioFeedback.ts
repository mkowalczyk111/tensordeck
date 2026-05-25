const getAudioCtx = (() => {
  let ctx: AudioContext | null = null;
  return () => {
    if (!ctx && typeof window !== 'undefined') {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctx?.state === 'suspended') ctx.resume();
    return ctx;
  };
})();

export function playMicOnSound(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.value = 0.15;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.stop(ctx.currentTime + 0.15);
}

export function playMicOffSound(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 440;
  gain.gain.value = 0.15;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.stop(ctx.currentTime + 0.12);
}

export function playSuccessSound(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.12;
    osc.start(ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.15);
    osc.stop(ctx.currentTime + i * 0.12 + 0.15);
  });
}

export function playErrorSound(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 220;
  osc.type = 'square';
  gain.gain.value = 0.1;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.stop(ctx.currentTime + 0.2);
}
