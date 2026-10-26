import * as THREE from 'three';

// A stand-in rider built from primitives, until Vi3W can make one on its own
// (it couldn't make the carpet with a rider on it). Sits cross-legged facing
// -z, the direction of travel. Origin is the seat.

function mesh(geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  return m;
}

export function createRider() {
  const lowPoly = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true });
  const skin = lowPoly('#c68a5b');
  const tunic = lowPoly('#2e6f8e');
  const trousers = lowPoly('#f2e6cf');
  const sash = lowPoly('#d4a72c');
  const turban = lowPoly('#f7efe0');
  const scarfMaterial = lowPoly('#b8322a');
  scarfMaterial.side = THREE.DoubleSide;

  const rider = new THREE.Group();

  // Crossed legs: two capsules lying sideways, angled across each other.
  for (const side of [-1, 1]) {
    const leg = mesh(new THREE.CapsuleGeometry(0.1, 0.42, 4, 8), trousers);
    leg.rotation.set(0, side * 0.35, Math.PI / 2);
    leg.position.set(0, 0.1, -0.12 + side * 0.03);
    rider.add(leg);
  }

  // Everything above the hips hangs off this pivot so the rider can lean.
  const body = new THREE.Group();
  body.position.y = 0.12;
  rider.add(body);

  const torso = mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.55, 8), tunic);
  torso.position.y = 0.3;
  const belt = mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.08, 8), sash);
  belt.position.y = 0.1;
  const head = mesh(new THREE.SphereGeometry(0.14, 10, 8), skin);
  head.position.y = 0.7;
  const wrap = mesh(new THREE.SphereGeometry(0.17, 10, 8), turban);
  wrap.scale.set(1, 0.75, 1);
  wrap.position.y = 0.8;
  body.add(torso, belt, head, wrap);

  // Arms reach forward and down to grip the front of the carpet.
  for (const side of [-1, 1]) {
    const arm = mesh(new THREE.CapsuleGeometry(0.055, 0.36, 4, 6), tunic);
    arm.rotation.x = -1.0;
    arm.position.set(side * 0.21, 0.38, -0.16);
    body.add(arm);
  }

  // A scarf that streams out behind the rider; its pivot is at the neck.
  const scarf = new THREE.Group();
  scarf.position.set(0, 0.6, 0.12);
  const cloth = mesh(new THREE.BoxGeometry(0.14, 0.015, 0.6), scarfMaterial);
  cloth.position.z = 0.3;
  scarf.add(cloth);
  body.add(scarf);

  // `velocity` is the carpet's (x, y) velocity in units per second.
  function update(time, velocity) {
    // Leans forward into dives, back on climbs, and into turns.
    body.rotation.x = -0.12 + velocity.y * 0.025;
    body.rotation.z = -velocity.x * 0.02;
    scarf.rotation.x = 0.25 + Math.sin(time * 13) * 0.12;
    scarf.rotation.y = Math.sin(time * 9) * 0.25 - velocity.x * 0.02;
  }

  return { object: rider, update };
}
