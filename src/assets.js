import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Each entry with a `path` loads a GLB from public/; entries without one use the
// primitive placeholder below. `size` is the length of the model's longest side
// in world units, and `rotationY` turns the model before it is fitted.
export const MODELS = {
  carpet: { path: 'models/carpet.glb', size: 2.6, rotationY: Math.PI / 2 },
  tower: { path: 'models/tower.glb', size: 14 },
  boulder: { path: 'models/boulder.glb', size: 2.6 },
  bridge: { path: null, size: 16 },
  gem: { path: 'models/gem.glb', size: 0.9 },
};

// Drives the cloth ripple on the carpet's vertex shader.
export const rippleTime = { value: 0 };

const PLACEHOLDERS = {
  bridge() {
    const material = new THREE.MeshStandardMaterial({ color: '#b23a2a', roughness: 0.8 });
    return new THREE.Mesh(new THREE.BoxGeometry(16, 1.1, 1.1), material);
  },
};

// Wraps a loaded scene in a pivot so the model is centred on the origin and
// scaled to `size`, regardless of the units the exporter used.
function fitModel(scene, { size, rotationY = 0 }) {
  const pivot = new THREE.Group();
  scene.rotation.y = rotationY;
  pivot.add(scene);
  pivot.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(scene);
  const dims = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = size / Math.max(dims.x, dims.y, dims.z);

  scene.scale.setScalar(scale);
  scene.position.copy(center).multiplyScalar(-scale);
  return pivot;
}

// Vi3W exports have no normals, so they are computed here for smooth lighting.
function prepareMeshes(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (!child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
      child.material.flatShading = false;
      child.material.needsUpdate = true;
    }
  });
}

function addRipple(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = rippleTime;
      shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.y += sin(position.x * 9.0 + uTime * 8.0) * 0.025 * (0.5 - position.x);`,
      );
    };
  });
}

// The Vi3W gem's texture is a dark green, so it is lit from within by its own
// texture and given hard facets to read as a pickup from a distance.
function addGlow(object) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material.map) return;
    child.material.emissive.set('#ffffff');
    child.material.emissiveMap = child.material.map;
    child.material.emissiveIntensity = 2.5;
    child.material.roughness = 0.25;
    child.material.flatShading = true;
    child.material.needsUpdate = true;
  });
}

// `onProgress` gets the fraction (0 to 1) of model files downloaded so far.
export async function loadModels(onProgress = () => {}) {
  const loader = new GLTFLoader();
  const progress = {};
  const report = () => {
    const values = Object.values(progress);
    onProgress(values.reduce((sum, value) => sum + value, 0) / values.length);
  };
  for (const [name, config] of Object.entries(MODELS)) {
    if (config.path) progress[name] = 0;
  }
  report();

  const entries = await Promise.all(
    Object.entries(MODELS).map(async ([name, config]) => {
      const object = config.path
        ? fitModel(
            (
              await loader.loadAsync(config.path, (event) => {
                if (event.lengthComputable) progress[name] = event.loaded / event.total;
                report();
              })
            ).scene,
            config,
          )
        : PLACEHOLDERS[name]();
      if (config.path) {
        progress[name] = 1;
        report();
      }
      prepareMeshes(object);
      if (name === 'carpet') addRipple(object);
      if (name === 'gem') addGlow(object);
      return [name, object];
    }),
  );
  return Object.fromEntries(entries);
}
