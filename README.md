# Carpet Rider

A 3D endless runner in the browser: fly a magic carpet over a desert at
sunset, dodging towers, bridges and boulders and collecting gems. It's like
the Chrome offline dinosaur game, but in 3D with a chase camera.

The game's 3D models were generated with [Vi3W](https://app.vi3w.in), a
sketch-to-3D tool.

**Play it: <https://carpet-rider.vercel.app/>** (keyboard or touch, no
install needed)

## How to play

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Start / fly again | Space or Enter | Tap **Fly** |
| Move | Arrow keys or WASD | Drag |
| Mute | M | **Sound** button |

- **Towers** are taller than you can fly, so dodge them sideways.
- **Bridges** span the whole width, so go over or under them.
- **Boulders** float anywhere; dodge them whichever way is clear.
- **Gems** are worth 25 points each. Your score is distance plus gems, and
  your best score is saved in the browser.
- The carpet speeds up over time, and obstacles come closer together.

## Running it locally

You need [Node.js](https://nodejs.org) 18 or later.

```bash
npm install
npm run dev
```

Then open the address it prints (<http://localhost:5173> by default).

To build for production, run `npm run build`. The output goes to `dist/`,
and `npm run preview` serves it.

## How Vi3W was used

| Model | In the game |
| --- | --- |
| Flying carpet | The player |
| Sandstone tower | Obstacle, dodged sideways |
| Boulder | Floating obstacle, randomly rotated on each spawn |
| Gem | Pickup |

Each model was generated on Vi3W and exported as a `.glb`. They're in
`public/models/`. Vi3W exports static meshes, so the game adds what they
don't have:

- **Size:** exports use arbitrary units, so each model is centered and
  scaled to a set size when it loads.
- **Lighting:** the exports have no normals, so they're computed on load
  for smooth shading.
- **Motion:** there's no rig or animation, so the carpet's cloth ripple is
  a vertex shader, and the bobbing, banking and spinning are done in code.
- **The gem:** its texture came out very dark, so it's made to glow with
  its own texture and given hard facets to stand out as a pickup.

What's not from Vi3W:

- **Rider:** Vi3W couldn't generate the carpet with a person on it, so the
  rider is a stand-in built from simple shapes in code.
- **Bridge:** a simple shape for now.
- **Desert and sky:** these are built in code. A landscape image on Vi3W
  came out as a thin slab rather than terrain; the tool turns one image
  into one object, so it suits props better than scenery.

## Built with

- [Three.js](https://threejs.org) for 3D rendering and loading `.glb`
  models
- [Vite](https://vitejs.dev) for the dev server and build
- Sound is synthesized with the Web Audio API, so there are no audio files

Developed with Claude Code as an AI pair programmer.

## Project structure

```text
index.html          page: canvas, score, start and game-over screen
public/models/      Vi3W models (.glb)
src/
  main.js           game state, score, camera and the game loop
  config.js         tuning constants (speeds, corridor size, points)
  assets.js         loads and prepares the Vi3W models
  world.js          scene, lights, sun and scrolling sand
  player.js         carpet movement, banking and the crash tumble
  rider.js          the stand-in rider
  obstacles.js      spawning, object pooling and collisions
  debris.js         crash debris and sparks
  input.js          keyboard and touch controls
  audio.js          synthesized sound effects
  ui.js             score, menus and the mute button
  style.css         styles
```
