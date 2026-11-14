class RizzSound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ctx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  tone(freq, dur = 0.1, type = 'sine', vol = 0.08, delay = 0) {
    const ctx = this._ctx();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  send() {
    this.tone(520, 0.07, 'triangle', 0.07);
  }

  receive() {
    this.tone(660, 0.08, 'sine', 0.07, 0);
    this.tone(820, 0.1, 'sine', 0.06, 0.06);
  }

  combo() {
    this.tone(587.33, 0.09, 'triangle', 0.09, 0);
    this.tone(783.99, 0.12, 'triangle', 0.09, 0.07);
  }

  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone(f, 0.2, 'triangle', 0.1, i * 0.09);
    });
  }

  fail() {
    this.tone(330, 0.14, 'sawtooth', 0.05, 0);
    this.tone(246.94, 0.24, 'sawtooth', 0.05, 0.12);
  }
}

window.rizzSound = new RizzSound();
