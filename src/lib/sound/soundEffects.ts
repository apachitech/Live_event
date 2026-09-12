// Web Audio API Synthesizer for live broadcast sound effects
// 100% in-browser, zero external mp3/wav files required

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Classic high-frequency double coin chime
  playCoinChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(987.77, now, 0.4); // B5
    playTone(1318.51, now + 0.1, 0.6); // E6
  }

  // Iconic DJ Airhorn blast (3 harmonic brass square/saw oscillators)
  playAirhorn() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreqs = [466.16, 622.25, 783.99]; // Bb4, Eb5, G5 chord

    const blast = (offset: number, dur: number) => {
      baseFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + offset + 0.05);
        osc.frequency.setValueAtTime(freq, now + offset + 0.1);

        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + dur);
      });
    };

    // Staccato DJ blast rhythm: Ba-ba-ba-baaam!
    blast(0, 0.15);
    blast(0.18, 0.15);
    blast(0.36, 0.15);
    blast(0.54, 0.5);
  }

  // Uplifting victory/fanfare chime
  playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0, d: 0.15 }, // C5
      { f: 659.25, t: 0.15, d: 0.15 }, // E5
      { f: 783.99, t: 0.3, d: 0.15 }, // G5
      { f: 1046.5, t: 0.45, d: 0.5 }, // C6
    ];

    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.25, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }

  // Dramatic sub-bass drop / impact
  playBassDrop() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }
}

export const soundEffects = new SoundEffectsEngine();
