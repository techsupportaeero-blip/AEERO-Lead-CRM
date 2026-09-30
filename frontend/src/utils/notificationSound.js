// Short two-note notification chime, synthesized with the Web Audio API
// instead of an audio file - no asset to fetch/host, works everywhere.
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Browsers suspend a freshly-created AudioContext until a user gesture
    // has happened somewhere on the page - by the time a notification
    // arrives the user has already logged in/clicked around, so this
    // resolves immediately in practice.
    if (ctx.state === 'suspended') ctx.resume();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.15); // A5
    playTone(1318.5, now + 0.12, 0.2); // E6
  } catch {
    // Sound is a nice-to-have - never let it break the notification itself.
  }
}
