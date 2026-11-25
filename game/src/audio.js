// All sounds are synthesised with WebAudio oscillators — no audio files,
// no network. The context is created on the first user gesture, so a quiet
// title screen never trips the browser's autoplay rules.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type, volume, when = 0, slideTo = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') void ac.resume();
      const start = ac.currentTime + when;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + seconds + 0.05);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    pickup() {
      tone(520, 0.09, 'sine', 0.12, 0, 760);
    },
    drop() {
      tone(340, 0.08, 'sine', 0.1, 0, 240);
    },
    chop() {
      tone(190, 0.06, 'square', 0.08);
      tone(150, 0.06, 'square', 0.07, 0.05);
    },
    chopped() {
      tone(660, 0.1, 'triangle', 0.12, 0, 880);
    },
    sizzle() {
      tone(1200, 0.25, 'sawtooth', 0.03, 0, 900);
    },
    cooked() {
      tone(740, 0.12, 'triangle', 0.12);
      tone(990, 0.14, 'triangle', 0.12, 0.1);
    },
    burnt() {
      tone(220, 0.3, 'sawtooth', 0.1, 0, 110);
    },
    serve() {
      tone(880, 0.12, 'sine', 0.14);
      tone(1174, 0.16, 'sine', 0.14, 0.1);
      tone(1568, 0.22, 'sine', 0.12, 0.2);
    },
    ding() {
      tone(1240, 0.18, 'sine', 0.12);
    },
    expire() {
      tone(330, 0.2, 'sawtooth', 0.1, 0, 165);
      tone(220, 0.3, 'sawtooth', 0.09, 0.18, 110);
    },
    error() {
      tone(180, 0.12, 'square', 0.08);
    },
  };
}
