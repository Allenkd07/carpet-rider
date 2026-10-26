import * as THREE from 'three';
import { loadModels, rippleTime } from './assets.js';
import { START_SPEED, MAX_SPEED, ACCELERATION, GEM_POINTS } from './config.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createObstacles } from './obstacles.js';
import { createAudio } from './audio.js';
import { createDebris } from './debris.js';
import { createUI } from './ui.js';

const canvas = document.getElementById('game');
const world = createWorld(canvas);
const { scene, camera, renderer } = world;
const ui = createUI();
const audio = createAudio();
const player = createPlayer(scene);
const debris = createDebris(scene);
const input = createInput(canvas, { onStart: start, onMute: toggleMute });

let obstacles;
let state = 'loading';
let speed = START_SPEED;
let distance = 0;
let gems = 0;
let gemStreak = 0;
let streakGap = 0;
let sinceSpawn = 0;
// Camera shake strength (0 to 1) and time since the crash.
let shake = 0;
let crashTime = 0;

// How long the crash plays before the retry screen appears, in seconds.
const CRASH_DURATION = 1.2;

function score() {
  return Math.floor(distance / 2) + gems * GEM_POINTS;
}

function reset() {
  obstacles?.clear();
  speed = START_SPEED;
  distance = 0;
  gems = 0;
  gemStreak = 0;
  streakGap = 0;
  sinceSpawn = 0;
  shake = 0;
  debris.clear();
  player.reset();
  ui.setScore(0);
}

function start() {
  if (state !== 'ready' && state !== 'over') return;
  audio.unlock();
  audio.start();
  reset();
  state = 'playing';
  ui.hideOverlay();
}

// The world freezes while the carpet tumbles; the retry screen comes after.
function crash() {
  state = 'crashing';
  crashTime = 0;
  shake = 1;
  audio.crash();
  audio.setWind(0);
  input.clear();
  ui.setScore(score());
  ui.flash();
  debris.burst(player.group.position);
  player.crash();
}

function updateCrash(dt) {
  player.updateCrash(dt);
  crashTime += dt;
  if (crashTime > CRASH_DURATION) {
    state = 'over';
    ui.gameOver(score());
  }
}

function toggleMute() {
  audio.unlock();
  ui.setMuted(audio.toggleMute());
}

function updateWorld(dt, time) {
  speed = Math.min(MAX_SPEED, speed + ACCELERATION * dt);
  const step = speed * dt;
  distance += step;
  world.scrollGround(step);

  // Obstacles come closer together as the carpet speeds up.
  const difficulty = (speed - START_SPEED) / (MAX_SPEED - START_SPEED);
  audio.setWind(difficulty);
  sinceSpawn += step;
  if (sinceSpawn > THREE.MathUtils.lerp(30, 15, difficulty)) {
    sinceSpawn = 0;
    obstacles.spawnPattern();
  }

  player.group.updateMatrixWorld(true);
  const result = obstacles.update(step, dt, time, player.carpet);
  for (let i = 0; i < result.gems; i++) audio.gem(gemStreak++);
  gems += result.gems;
  // The streak resets once the carpet has flown a gem trail's length without a pickup.
  if (result.gems) streakGap = 0;
  else if ((streakGap += step) > 6) gemStreak = 0;

  if (result.crashed) crash();
  else ui.setScore(score());
}
const cameraBase = camera.position.clone();
const cameraGoal = new THREE.Vector3();
const lookGoal = new THREE.Vector3();

function updateCamera(dt) {
  const { position } = player.group;
  cameraGoal.set(position.x * 0.6, position.y * 0.6 + 3.2, 8);
  cameraBase.lerp(cameraGoal, Math.min(1, dt * 4));
  camera.position.copy(cameraBase);
  // The shake is added on top of the smoothed position so it doesn't drift.
  if (shake > 0) {
    const amount = shake * shake * 0.6;
    camera.position.x += (Math.random() * 2 - 1) * amount;
    camera.position.y += (Math.random() * 2 - 1) * amount;
    shake = Math.max(0, shake - dt * 1.8);
  }
  lookGoal.set(position.x * 0.8, position.y * 0.8 + 0.5, -10);
  camera.lookAt(lookGoal);
}

const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  rippleTime.value = time;

  if (player.carpet) {
    player.bob(time);
    if (state === 'playing') {
      player.update(dt, input);
      updateWorld(dt, time);
    } else if (state === 'crashing') {
      updateCrash(dt);
    }
    debris.update(dt);
    updateCamera(dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', world.resize);
ui.startButton.addEventListener('click', start);
ui.muteButton.addEventListener('click', (event) => {
  toggleMute();
  // Keep Space from re-pressing the button instead of starting a run.
  event.currentTarget.blur();
});
ui.setMuted(audio.isMuted());

world.resize();
reset();
frame();

loadModels(ui.loadingProgress)
  .then((models) => {
    obstacles = createObstacles(scene, models);
    player.setCarpet(models.carpet);
    state = 'ready';
    ui.ready();
  })
  .catch((error) => {
    console.error(error);
    ui.loadFailed();
  });
