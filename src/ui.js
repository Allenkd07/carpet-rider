// The HTML around the canvas: score, best score, start/game-over screen and
// the mute button.

const BEST_KEY = 'carpet-rider-best';

export function createUI() {
  const overlay = document.getElementById('overlay');
  const message = document.getElementById('message');
  const startButton = document.getElementById('start');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const muteButton = document.getElementById('mute');
  const flashEl = document.getElementById('flash');

  let best = 0;
  try {
    best = Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {}
  bestEl.textContent = `BEST ${best}`;

  return {
    startButton,
    muteButton,

    setScore(score) {
      scoreEl.textContent = score;
    },

    loadingProgress(fraction) {
      startButton.textContent = `Loading ${Math.round(fraction * 100)}%`;
    },

    ready() {
      startButton.disabled = false;
      startButton.textContent = 'Fly';
    },

    loadFailed() {
      message.textContent = 'Could not load the models.';
      startButton.textContent = 'Error';
    },

    // A bright flash over the whole screen on impact.
    flash() {
      flashEl.classList.remove('active');
      // Reading layout restarts the CSS animation if it is still running.
      void flashEl.offsetWidth;
      flashEl.classList.add('active');
    },

    hideOverlay() {
      overlay.classList.add('hidden');
    },

    // Shows the crash screen and saves a new best score.
    gameOver(score) {
      if (score > best) {
        best = score;
        try {
          localStorage.setItem(BEST_KEY, String(best));
        } catch {}
        bestEl.textContent = `BEST ${best}`;
      }
      message.textContent = `You crashed! Score ${score}`;
      startButton.textContent = 'Fly again';
      overlay.classList.remove('hidden');
    },

    setMuted(muted) {
      muteButton.textContent = muted ? 'Sound off' : 'Sound on';
      muteButton.setAttribute('aria-pressed', String(muted));
    },
  };
}
