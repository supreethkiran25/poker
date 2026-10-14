/**
 * Realistic Casino Audio Engine for Texas Hold'em
 * Synthesizes physical acoustic clay poker chips, metallic gold coins,
 * felt sliding, and authentic table interactions using Web Audio API.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastSoundTimes: Record<string, number> = {};

  constructor() {
    this.isMuted = typeof localStorage !== 'undefined' && localStorage.getItem('poker_muted') === 'true';
  }

  private init(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
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

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('poker_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('poker_muted', String(this.isMuted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Prevents spamming duplicate sounds within a few milliseconds
   */
  private canPlay(key: string, minIntervalMs: number = 80): boolean {
    const now = Date.now();
    const last = this.lastSoundTimes[key] || 0;
    if (now - last < minIntervalMs) return false;
    this.lastSoundTimes[key] = now;
    return true;
  }

  /**
   * Synthesizes an authentic single heavy clay poker chip click.
   * Model: Sharp noise transient + high-Q resonant ceramic body + felt dampening.
   */
  private synthesizeChipClick(
    ctx: AudioContext,
    time: number,
    pitchMod: number = 1.0,
    volume: number = 0.25
  ): void {
    // 1. Noise transient (the initial sharp impact crack)
    const bufferSize = Math.floor(ctx.sampleRate * 0.025);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005));
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2400 * pitchMod, time);
    noiseFilter.Q.setValueAtTime(3.5, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(time);

    // 2. Tonal body resonance (heavy 14g compression-molded ceramic body)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820 * pitchMod, time);
    osc.frequency.exponentialRampToValueAtTime(340 * pitchMod, time + 0.035);

    oscGain.gain.setValueAtTime(volume * 0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.035);
  }

  /**
   * Synthesizes a high-pitch metallic gold coin chime / ring.
   */
  public playCoinClink(): void {
    if (!this.canPlay('coin', 100)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Dual inharmonic metallic bell frequencies for authentic coin ping
    const frequencies = [3450, 5280];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12 / (i + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /**
   * Sound when a player CALLS or places a modest bet.
   * A crisp, authentic 2-3 chip clatter onto felt with slight metallic shimmer.
   */
  public playCallChips(amount?: number): void {
    if (!this.canPlay('callChips', 120)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    const delays = [0, 0.032, 0.068];
    const pitchMods = [1.05, 0.96, 1.12];

    delays.forEach((delay, idx) => {
      this.synthesizeChipClick(ctx, t + delay, pitchMods[idx], 0.24);
    });

    // Subtle metallic accent for high bets or coins
    if (amount && amount >= 500) {
      setTimeout(() => this.playCoinClink(), 50);
    }
  }

  /**
   * Sound when a player RAISES or BETS heavily.
   * A rich cascade of 5 to 7 tumbling clay casino chips clattering forward!
   */
  public playRaiseChips(amount?: number): void {
    if (!this.canPlay('raiseChips', 180)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    const delays = [0, 0.022, 0.045, 0.068, 0.095, 0.125, 0.155];
    const pitchMods = [1.08, 0.94, 1.15, 0.88, 1.02, 1.18, 0.96];

    delays.forEach((delay, idx) => {
      const vol = 0.18 + (idx % 2 === 0 ? 0.08 : 0.03);
      this.synthesizeChipClick(ctx, t + delay, pitchMods[idx], vol);
    });

    // Add gold coin ring in the cascade
    setTimeout(() => this.playCoinClink(), 60);
  }

  /**
   * Sound when a player goes ALL-IN!
   * Heavy felt push friction + dramatic cascading chip shower.
   */
  public playAllInChips(): void {
    if (!this.canPlay('allIn', 300)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Heavy sliding felt friction
    const bufferSize = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);

    // 2. Torrent of chips falling
    const delays = [0.04, 0.07, 0.095, 0.12, 0.15, 0.18, 0.21, 0.25, 0.28];
    delays.forEach((d, i) => {
      this.synthesizeChipClick(ctx, t + d, 0.85 + (i * 0.06), 0.22);
    });

    setTimeout(() => this.playCoinClink(), 120);
  }

  /**
   * General chip sound (backward compatibility for clicks and interactions)
   */
  public playChips(): void {
    this.playCallChips();
  }

  /**
   * Table check: Solid double knuckle tap on the wooden rail / felt.
   */
  public playCheck(): void {
    if (!this.canPlay('check', 150)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    [0, 0.085].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t + delay);
      osc.frequency.exponentialRampToValueAtTime(55, t + delay + 0.055);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t + delay);

      gain.gain.setValueAtTime(0.35, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.055);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.055);
    });
  }

  /**
   * Card deal / slide across wool felt
   */
  public playCardDeal(): void {
    if (!this.canPlay('cardDeal', 70)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.08);
    filter.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  /**
   * Player folds cards into muck
   */
  public playFold(): void {
    if (!this.canPlay('fold', 150)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Sound when chips are pulled from betting zone into the main pot at street change
   */
  public playPotCollect(): void {
    if (!this.canPlay('potCollect', 250)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    const delays = [0, 0.03, 0.06, 0.09, 0.13];
    delays.forEach((d, i) => {
      this.synthesizeChipClick(ctx, t + d, 0.95 + i * 0.04, 0.16);
    });
  }

  /**
   * Turn reminder: Warm soft casino bell (non-irritating, gentle reminder)
   */
  public playTurnAlert(): void {
    if (!this.canPlay('turnAlert', 1000)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Warm chime chord (D5 - A5 with soft harmonics)
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.12, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }

  /**
   * Hand win / Pot awarded: Celebratory chip sweep and warm major chime
   */
  public playWin(): void {
    if (!this.canPlay('win', 1000)) return;
    const ctx = this.init();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Chip sliding sweep
    const chipDelays = [0, 0.025, 0.05, 0.078, 0.11, 0.15, 0.19];
    chipDelays.forEach((d, i) => {
      this.synthesizeChipClick(ctx, t + d, 1.0 + (i * 0.04), 0.18);
    });

    // Metallic gold coin ring
    setTimeout(() => this.playCoinClink(), 80);

    // Warm ascending casino reward chime: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + 0.12 + idx * 0.09);

      gain.gain.setValueAtTime(0.16, t + 0.12 + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + idx * 0.09 + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + 0.12 + idx * 0.09);
      osc.stop(t + 0.12 + idx * 0.09 + 0.38);
    });
  }
}

export const soundManager = new SoundManager();
