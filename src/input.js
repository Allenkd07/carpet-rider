import { HALF_WIDTH, MIN_Y, MAX_Y } from './config.js';

// Tracks held keys and the corridor point a touch or mouse drag is aiming at.
export function createInput(canvas, { onStart, onMute }) {
  const pressed = new Set();
  const input = { pointerTarget: null };

  input.axis = (negative, positive) => {
    const neg = negative.some((key) => pressed.has(key));
    const pos = positive.some((key) => pressed.has(key));
    return (pos ? 1 : 0) - (neg ? 1 : 0);
  };

  window.addEventListener('keydown', (event) => {
    pressed.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') onStart();
    if (event.code === 'KeyM' && !event.repeat) onMute();
    if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();
  });
  window.addEventListener('keyup', (event) => pressed.delete(event.code));
  window.addEventListener('blur', () => pressed.clear());

  // Touch and mouse drags steer the carpet toward the matching point in the corridor.
  function pointerToCorridor(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = 1 - event.clientY / window.innerHeight;
    input.pointerTarget = {
      x: x * HALF_WIDTH * 1.2,
      y: MIN_Y + y * (MAX_Y - MIN_Y),
    };
  }
  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId);
    pointerToCorridor(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (input.pointerTarget) pointerToCorridor(event);
  });
  canvas.addEventListener('pointerup', () => (input.pointerTarget = null));
  canvas.addEventListener('pointercancel', () => (input.pointerTarget = null));

  input.clear = () => pressed.clear();
  return input;
}
