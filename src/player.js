import * as THREE from 'three';
import { HALF_WIDTH, MIN_Y, MAX_Y, MOVE_SPEED, RIDER_SEAT } from './config.js';
import { createRider } from './rider.js';

// The carpet's pivot: moves within the corridor and banks into turns.
export function createPlayer(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const velocity = new THREE.Vector2();
  const fall = new THREE.Vector3();
  const spin = new THREE.Vector3();
  const rider = createRider();
  const player = { group, carpet: null };

  // The rider is a child of the carpet, so it bobs with it and is part of
  // the carpet's hit box.
  player.setCarpet = (carpet) => {
    player.carpet = carpet;
    rider.object.position.set(RIDER_SEAT.x, RIDER_SEAT.y, RIDER_SEAT.z);
    carpet.add(rider.object);
    group.add(carpet);
  };

  player.reset = () => {
    velocity.set(0, 0);
    group.position.set(0, 3.5, 0);
    group.rotation.set(0, 0, 0);
  };

  player.update = (dt, input) => {
    let targetX = input.axis(['ArrowLeft', 'KeyA'], ['ArrowRight', 'KeyD']) * MOVE_SPEED.x;
    let targetY = input.axis(['ArrowDown', 'KeyS'], ['ArrowUp', 'KeyW']) * MOVE_SPEED.y;
    const target = input.pointerTarget;
    if (target) {
      targetX = THREE.MathUtils.clamp((target.x - group.position.x) * 6, -MOVE_SPEED.x, MOVE_SPEED.x);
      targetY = THREE.MathUtils.clamp((target.y - group.position.y) * 6, -MOVE_SPEED.y, MOVE_SPEED.y);
    }

    const response = Math.min(1, dt * 8);
    velocity.x += (targetX - velocity.x) * response;
    velocity.y += (targetY - velocity.y) * response;

    group.position.x = THREE.MathUtils.clamp(group.position.x + velocity.x * dt, -HALF_WIDTH, HALF_WIDTH);
    group.position.y = THREE.MathUtils.clamp(group.position.y + velocity.y * dt, MIN_Y, MAX_Y);
    group.rotation.z = -velocity.x * 0.04;
    group.rotation.x = velocity.y * 0.03;
  };

  // Knocks the carpet back and up, spinning, when it hits something.
  player.crash = () => {
    fall.set(velocity.x * 0.3 + THREE.MathUtils.randFloat(-2, 2), 5, 3);
    spin.set(THREE.MathUtils.randFloat(-6, -3), THREE.MathUtils.randFloat(-3, 3), THREE.MathUtils.randFloat(-5, 5));
    velocity.set(0, 0);
  };

  // Tumbles to the sand under gravity, bouncing a little before settling.
  player.updateCrash = (dt) => {
    fall.y -= 20 * dt;
    group.position.addScaledVector(fall, dt);
    group.rotation.x += spin.x * dt;
    group.rotation.y += spin.y * dt;
    group.rotation.z += spin.z * dt;
    if (group.position.y < 0.5) {
      group.position.y = 0.5;
      fall.set(fall.x * 0.5, -fall.y * 0.3, fall.z * 0.5);
      spin.multiplyScalar(0.4);
    }
  };

  // Gentle hover bob and rider motion, also shown on the start screen.
  player.bob = (time) => {
    if (player.carpet) player.carpet.position.y = Math.sin(time * 2) * 0.08;
    rider.update(time, velocity);
  };

  return player;
}
