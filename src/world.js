import * as THREE from 'three';
import { SAND_TILE } from './config.js';

function makeSandTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e3a960';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(150, 90, 40, 0.25)';
  ctx.lineWidth = 6;
  for (let row = 0; row < 4; row++) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 8) {
      const y = row * 64 + 32 + Math.sin((x / size) * Math.PI * 4) * 10;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255, 240, 210, ${Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(40, 40);
  return texture;
}

// Builds the renderer, sunset scene, lights, sun and scrolling sand.
export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const skyColor = new THREE.Color('#f4b46a');
  scene.background = skyColor;
  scene.fog = new THREE.Fog(skyColor, 40, 150);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  camera.position.set(0, 6, 9);

  scene.add(new THREE.HemisphereLight('#ffe2b0', '#8a5a2b', 1.3));
  const sunLight = new THREE.DirectionalLight('#fff1d6', 2.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunLight.shadow.camera, { left: -20, right: 20, top: 40, bottom: -20, near: 1, far: 80 });
  sunLight.position.set(-8, 30, 6);
  sunLight.target.position.set(0, 0, -10);
  scene.add(sunLight, sunLight.target);

  // Lights the side of the carpet facing the camera, which the sun leaves in shade.
  const fillLight = new THREE.DirectionalLight('#ffe6c4', 1.2);
  fillLight.position.set(0, 4, 12);
  scene.add(fillLight);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(18, 32, 16),
    new THREE.MeshBasicMaterial({ color: '#fff0c2', fog: false }),
  );
  sun.position.set(-60, 45, -320);
  scene.add(sun);

  const sandTexture = makeSandTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ map: sandTexture, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -150;
  ground.receiveShadow = true;
  scene.add(ground);

  function scrollGround(step) {
    sandTexture.offset.y += step / SAND_TILE;
  }

  function resize() {
    const { innerWidth: width, innerHeight: height } = window;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  return { renderer, scene, camera, scrollGround, resize };
}
