let audio: AudioContext | undefined;
export const SOUND_KEY = 'minebench-workspace-sound';
export function soundEnabled() {
  try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
}

export function beginHoldSound(entering: boolean) {
  if (!soundEnabled() || typeof AudioContext === 'undefined') return () => {};
  try {
    audio ??= new AudioContext();
    const context = audio;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    let cancelled = false;
    let started = false;
    oscillator.connect(gain).connect(context.destination);
    oscillator.type = 'sine';
    // resume() is called synchronously from the trusted pointer event.
    void context.resume().then(() => {
      if (cancelled) { oscillator.disconnect(); gain.disconnect(); return; }
      const now = context.currentTime;
      oscillator.frequency.setValueAtTime(entering ? 140 : 380, now);
      oscillator.frequency.exponentialRampToValueAtTime(entering ? 560 : 160, now + .9);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0, now + .18);
      gain.gain.linearRampToValueAtTime(.035, now + .45);
      gain.gain.linearRampToValueAtTime(.05, now + .9);
      gain.gain.linearRampToValueAtTime(0, now + 1.15);
      oscillator.start(); started = true;
      oscillator.stop(now + 1.2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }).catch(() => { oscillator.disconnect(); gain.disconnect(); });
    return () => {
      cancelled = true;
      if (!started) return;
      const now = context.currentTime;
      if (typeof gain.gain.cancelAndHoldAtTime === 'function') gain.gain.cancelAndHoldAtTime(now);
      else { gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now); }
      gain.gain.linearRampToValueAtTime(0, now + .025);
      try { oscillator.stop(now + .03); } catch { /* Already ended. */ }
    };
  } catch { return () => {}; }
}
