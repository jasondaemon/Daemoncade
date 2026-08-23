export class SoundEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.musicGain.gain.value = 0.4;
    this.sfxGain.gain.value = 0.7;
    this.musicMuted = false;
    this.sfxMuted = false;
    this.musicTimer = null;
    this.bassStep = 0;
  }

  resume() {
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolumeMusic(value) {
    this.musicGain.gain.value = value;
  }

  setVolumeSfx(value) {
    this.sfxGain.gain.value = value;
  }

  setMutedMusic(muted) {
    this.musicMuted = muted;
  }

  setMutedSfx(muted) {
    this.sfxMuted = muted;
  }

  playTone(freq, duration, gain, type = "square") {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(this.sfxGain);
    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  playSfx(name) {
    if (this.sfxMuted) return;
    if (name === "pellet") this.playTone(420, 0.08, 0.18, "square");
    if (name === "power") this.playTone(280, 0.4, 0.22, "sawtooth");
    if (name === "bonus") {
      this.playTone(520, 0.12, 0.2, "triangle");
      setTimeout(() => this.playTone(640, 0.12, 0.2, "triangle"), 80);
    }
    if (name === "eat") this.playTone(180, 0.2, 0.3, "square");
    if (name === "death") {
      this.playTone(180, 0.3, 0.3, "sawtooth");
      setTimeout(() => this.playTone(120, 0.3, 0.2, "sawtooth"), 180);
    }
    if (name === "level") {
      this.playTone(440, 0.15, 0.2, "triangle");
      setTimeout(() => this.playTone(660, 0.15, 0.2, "triangle"), 140);
    }
  }

  startMusic(speedFactor = 1) {
    if (this.musicTimer) return;
    const sequence = [110, 110, 147, 110, 98, 110, 147, 110];
    const lead = [220, 247, 262, 220, 196, 220, 262, 220];
    let step = 0;
    this.musicTimer = setInterval(() => {
      if (this.musicMuted) return;
      const freq = sequence[step % sequence.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(this.musicGain);
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.2);

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = "triangle";
      leadOsc.frequency.value = lead[step % lead.length];
      leadGain.gain.value = 0.05;
      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGain);
      leadGain.gain.setValueAtTime(0.001, now);
      leadGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      leadOsc.start(now);
      leadOsc.stop(now + 0.22);
      step += 1;
    }, 300 / speedFactor);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
