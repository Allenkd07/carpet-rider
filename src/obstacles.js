import * as THREE from 'three';
import { HALF_WIDTH, MIN_Y, MAX_Y, SPAWN_Z, DESPAWN_Z } from './config.js';

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Hit boxes are shrunk so near misses read as dodges rather than unfair hits.
function hitBox(object, box, factor, scratch) {
  box.setFromObject(object);
  box.getSize(scratch).multiplyScalar(-factor / 2);
  return box.expandByVector(scratch);
}

// Spawns towers, boulders, bridges and gem trails, and reuses them from a pool
// instead of cloning a new model each time.
export function createObstacles(scene, models) {
  const active = [];
  const pools = {};
  const playerBox = new THREE.Box3();
  const objectBox = new THREE.Box3();
  const scratch = new THREE.Vector3();

  function acquire(type) {
    const pool = (pools[type] ||= []);
    const object = pool.pop() || models[type].clone();
    object.userData.type = type;
    object.rotation.set(0, 0, 0);
    scene.add(object);
    active.push(object);
    return object;
  }

  function release(object) {
    scene.remove(object);
    pools[object.userData.type].push(object);
  }

  function spawnPattern() {
    const roll = Math.random();
    if (roll < 0.45) {
      // Towers stand taller than the corridor, so they must be dodged sideways.
      const tower = acquire('tower');
      tower.position.set(rand(-HALF_WIDTH, HALF_WIDTH), 6, SPAWN_Z);
      if (Math.random() < 0.4) {
        const second = acquire('tower');
        const side = tower.position.x > 0 ? -1 : 1;
        second.position.set(tower.position.x + side * rand(8, 9.5), 6, SPAWN_Z - rand(0, 6));
      }
    } else if (roll < 0.75) {
      const boulder = acquire('boulder');
      boulder.position.set(rand(-HALF_WIDTH, HALF_WIDTH), rand(MIN_Y, MAX_Y), SPAWN_Z);
      // One Vi3W rock, turned at random so repeats don't look identical.
      boulder.rotation.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), 0);
    } else {
      // Bridges span the full width, so they must be dodged vertically.
      const bridge = acquire('bridge');
      bridge.position.set(0, rand(MIN_Y + 1.5, MAX_Y - 1.5), SPAWN_Z);
    }

    if (Math.random() < 0.5) {
      const x = rand(-HALF_WIDTH, HALF_WIDTH);
      const y = rand(MIN_Y, MAX_Y);
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const gem = acquire('gem');
        gem.position.set(x, y, SPAWN_Z + 10 + i * 3);
      }
    }
  }

  function clear() {
    while (active.length) release(active.pop());
  }

  // Moves everything `step` closer and reports what the carpet touched:
  // 'crash' on an obstacle, otherwise the number of gems collected.
  function update(step, dt, time, carpet) {
    hitBox(carpet, playerBox, 0.25, scratch);
    let gems = 0;

    for (let i = active.length - 1; i >= 0; i--) {
      const object = active[i];
      object.position.z += step;
      const type = object.userData.type;
      if (type === 'gem') object.rotation.y = time * 3;
      if (type === 'boulder') object.rotation.x += dt;

      if (object.position.z > DESPAWN_Z) {
        active.splice(i, 1);
        release(object);
        continue;
      }
      if (object.position.z < -10) continue;

      if (hitBox(object, objectBox, type === 'gem' ? -0.5 : 0.2, scratch).intersectsBox(playerBox)) {
        if (type !== 'gem') return { crashed: true, gems };
        gems++;
        active.splice(i, 1);
        release(object);
      }
    }
    return { crashed: false, gems };
  }

  return { spawnPattern, clear, update };
}
