// Web Audio API synthesizer chimes & haptics for Alpacard Web & Demo

export function playRedemptionFanfare() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80, 40, 140, 60, 220, 80, 350]);
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1. Upward major fanfare arpeggio (C4, E4, G4, C5, E5, G5, C6)
    const arpeggio = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.065);

      const startTime = ctx.currentTime + idx * 0.065;
      const duration = 0.32;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // 2. Triumphant full chord impact at ~0.5s (C5 + E5 + G5 + C6)
    const chordTime = ctx.currentTime + 0.52;
    const chordDuration = 0.95;
    const chordFreqs = [523.25, 659.25, 783.99, 1046.5];

    chordFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);

      gain.gain.setValueAtTime(0.001, chordTime);
      gain.gain.linearRampToValueAtTime(0.14, chordTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + chordDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chordTime);
      osc.stop(chordTime + chordDuration);
    });

    // 3. Cascading fairy-dust chimes (sparkle shimmer)
    const sparkleFreqs = [2093.0, 2637.02, 3135.96, 4186.01, 3520.0];
    sparkleFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const time = ctx.currentTime + 0.85 + idx * 0.08;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.07, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.24);
    });
  } catch {
    // Audio context not allowed or unsupported
  }
}

export function playTapPopSound() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(750 + Math.random() * 350, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.085);
  } catch {
    // Audio unsupported
  }
}

export function playStampCelebrationSound(isEarn: boolean) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(isEarn ? [120, 60, 150] : [150, 80, 150, 80, 250]);
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = isEarn ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25, 880];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.32);
    });
  } catch {
    // Audio unsupported
  }
}
