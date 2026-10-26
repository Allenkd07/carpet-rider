import * as THREE from 'three';

const GRAVITY = 18;
const GROUND_Y = 0.1;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// A burst of chips and sparks thrown out on a crash. The pieces are created
// once and reused on every crash.
export function createDebris(scene, count = 36) {
  const geometry = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const materials = [
    new THREE.MeshStandardMaterial({ color: '#ffd36b', emissive: '#ff9a2e', emissiveIntensity: 1.5 }),
    new THREE.MeshStandardMaterial({ color: '#e08a3c', flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#8a4b22', flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#fff3dc', flatShading: true }),
  ];

  const pieces = Array.from({ length: count }, (_, i) => {
    const mesh = new THREE.Mesh(geometry, materials[i % materials.length]);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, velocity: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 };
  });

  function burst(origin) {
    for (const piece of pieces) {
      piece.mesh.position.copy(origin);
      piece.velocity.randomDirection().multiplyScalar(rand(4, 12));
      piece.velocity.y += 4;
      piece.spin.set(rand(-10, 10), rand(-10, 10), rand(-10, 10));
      piece.life = rand(0.8, 1.4);
      piece.mesh.visible = true;
    }
  }

  function update(dt) {
    for (const piece of pieces) {
      if (!piece.mesh.visible) continue;
      piece.life -= dt;
      if (piece.life <= 0) {
        piece.mesh.visible = false;
        continue;
      }
      const { mesh, velocity, spin } = piece;
      velocity.y -= GRAVITY * dt;
      mesh.position.addScaledVector(velocity, dt);
      if (mesh.position.y < GROUND_Y) {
        mesh.position.y = GROUND_Y;
        velocity.y *= -0.3;
        velocity.x *= 0.6;
        velocity.z *= 0.6;
      }
      mesh.rotation.x += spin.x * dt;
      mesh.rotation.y += spin.y * dt;
      mesh.rotation.z += spin.z * dt;
      // Shrinks away over its last half second.
      mesh.scale.setScalar(Math.min(1, piece.life * 2));
    }
  }

  function clear() {
    for (const piece of pieces) piece.mesh.visible = false;
  }

  return { burst, update, clear };
}
