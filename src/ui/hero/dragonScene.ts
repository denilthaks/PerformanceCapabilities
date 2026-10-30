// The homepage hero's 3D scene: the black and white dragons and the yin-yang
// (animated GLBs from the dragon-anim project), with layered smoke, embers, a
// gold energy swirl and a dark, gold-and-crimson light rig. Ported from the
// tested `cinematic-fx.js`; see docs/DRAGON-HERO.md for the assets.
//
// The three GLBs share one space (metres, Y up): the yin-yang rests at
// (0, 2.6, 0), the black dragon to its left, the white dragon circling. Each
// has an `Entrance` clip (7 s) that ends exactly on the first frame of a
// seamless 12 s `Idle` loop.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { ENTRANCE_S, IDLE_S } from './timing';

export interface DragonScene {
  /** Seconds since the entrance started (keeps counting through the idle loops). */
  readonly time: number;
  /** Run the entrance from the start, or jump straight into the idle loop. */
  start(fromEntrance: boolean): void;
  /** Stop rendering and freeze the clock (hidden tab, scrolled away). */
  setPaused(paused: boolean): void;
  /** Called every rendered frame with the scene time, for sound sync. */
  onFrame?: (time: number) => void;
  /** For tests: is the white dragon's skinned body inside the camera view? */
  whiteDragonInView(): boolean;
  /** For tests: the yin-yang node's world scale (0.4 once fully present). */
  yinYangScale(): number;
  /** For tests: the scene graph. */
  readonly root: THREE.Scene;
  dispose(): void;
}

export interface SceneOptions {
  /** Draw one still frame of the idle pose, no animation. */
  still: boolean;
}

/** Small deterministic RNG so the layout is the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------------------------------------------------------------- smoke

const smokeVert = /* glsl */`
  #include <fog_pars_vertex>
  uniform float uTime;
  attribute vec4 aSeed;   // x: spin speed, y: start angle, z: bob, w: texture index
  varying vec2 vUv;
  varying float vSeed;
  varying float vSide;
  void main() {
    vUv = uv;
    vSeed = aSeed.y;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float a = aSeed.y + uTime * aSeed.x;
    vec2 c = mat2(cos(a), -sin(a), sin(a), cos(a)) * position.xy;
    vSide = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).x;
    mv.xy += c;
    mv.y += sin(uTime * 0.21 + aSeed.y * 9.0) * aSeed.z;
    gl_Position = projectionMatrix * mv;
    vec4 mvPosition = mv;
    #include <fog_vertex>
  }
`;

const smokeFrag = /* glsl */`
  #include <fog_pars_fragment>
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uShadow;
  varying vec2 vUv;
  varying float vSeed;
  varying float vSide;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    float t = uTime * 0.06 + vSeed * 17.0;
    vec2 warp = vec2(noise(vUv * 3.0 + t), noise(vUv * 3.0 - t + 4.3)) - 0.5;
    vec4 s = texture2D(uMap, vUv + warp * 0.07);
    float churn = 0.75 + 0.5 * noise(vUv * 5.0 + vec2(t * 1.7, -t));
    float lum = dot(s.rgb, vec3(0.333));
    vec3 light = mix(uCool, uWarm, smoothstep(2.5, -2.5, vSide));
    vec3 col = mix(uShadow, light, clamp(pow(lum, 1.1) * 1.5, 0.0, 1.0));
    float alpha = s.a * uOpacity * churn;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col, alpha);
    #include <fog_fragment>
  }
`;

const SMOKE_FILES = ['smoke_puff_01', 'smoke_puff_02', 'smoke_puff_03', 'smoke_puff_04', 'smoke_wisp_01', 'smoke_wisp_02'];

interface Fx { update(dt: number): void; setOpacity(v: number): void }

/** Dense and low in front, thin in the middle, faint far behind; the faces and yin-yang stay clear. */
function createSmoke(scene: THREE.Scene, maps: THREE.Texture[]): Fx {
  const group = new THREE.Group();
  const rand = rng(7);
  const layers = [
    { n: 10, c: [0.8, 1.5, -11.0], s: [24, 6, 4], size: [7, 12], o: 0.32, rot: 0.015, wisps: true },
    { n: 10, c: [0.6, 0.6, -3.0], s: [15, 3.5, 5], size: [3.5, 6], o: 0.3, rot: 0.03, wisps: false },
    { n: 16, c: [1.2, -1.1, 2.6], s: [17, 1.4, 3], size: [3.5, 7.5], o: 0.85, rot: 0.025, wisps: true },
  ];
  const clear = (p: THREE.Vector3) => (p.x / 3.2) ** 2 + ((p.y - 3.0) / 2.2) ** 2 < 1;
  const sprites: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  layers.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      let idx = Math.floor(rand() * maps.length);
      if (!L.wisps && idx >= 4) idx -= 2;
      const wisp = idx >= 4;
      const size = L.size[0] + rand() * (L.size[1] - L.size[0]);
      const geo = new THREE.PlaneGeometry(size, size * (wisp ? 0.5 : 1));
      const angle = wisp ? (rand() - 0.5) * 0.3 : rand() * Math.PI * 2;
      const sv = [(rand() - 0.5) * L.rot * 2 * (wisp ? 0.3 : 1), angle, 0.15 + rand() * 0.35, idx];
      const seed = new Float32Array(16);
      for (let k = 0; k < 4; k++) seed.set(sv, k * 4);
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          ...THREE.UniformsLib.fog,
          uMap: { value: maps[idx] }, uTime: { value: 0 }, uOpacity: { value: L.o * (0.6 + rand() * 0.4) },
          uWarm: { value: new THREE.Color(0.78, 0.52, 0.26) },
          uCool: { value: new THREE.Color(0.52, 0.48, 0.52) },
          uShadow: { value: new THREE.Color(0.03, 0.022, 0.02) },
        },
        vertexShader: smokeVert, fragmentShader: smokeFrag,
        transparent: true, depthWrite: false, fog: true,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(L.c[0] + (rand() - 0.5) * L.s[0], L.c[1] + (rand() - 0.5) * L.s[1], L.c[2] + (rand() - 0.5) * L.s[2]);
      if (li > 0 && clear(m.position)) m.position.y -= 2.6;
      m.userData.base = mat.uniforms.uOpacity.value;
      m.userData.home = m.position.clone();
      m.userData.drift = (rand() - 0.5) * 0.12;
      m.frustumCulled = false;
      group.add(m);
      sprites.push(m);
    }
  });
  scene.add(group);
  let time = 0, master = 1;
  return {
    update(dt) {
      time += dt;
      for (const s of sprites) {
        const h = s.userData.home as THREE.Vector3;
        s.material.uniforms.uTime.value = time;
        s.material.uniforms.uOpacity.value = (s.userData.base as number) * master;
        s.position.set(
          h.x + Math.sin(time * 0.05 + h.y) * 1.2 + (s.userData.drift as number) * Math.sin(time * 0.3),
          h.y + Math.sin(time * 0.07 + h.x) * 0.5,
          h.z + Math.cos(time * 0.04 + h.x) * 0.8,
        );
      }
    },
    setOpacity(v) { master = v; },
  };
}

// ---------------------------------------------------------------- embers

function createEmbers(scene: THREE.Scene, tex: THREE.Texture, count: number): Fx {
  const rand = rng(11);
  const pos = new Float32Array(count * 3), seed = new Float32Array(count * 2);
  const reset = (i: number, anywhere: boolean) => {
    pos[i * 3] = (rand() - 0.5) * 16 + 0.5;
    pos[i * 3 + 1] = anywhere ? -2 + rand() * 11 : -2.5 - rand() * 1.5;
    pos[i * 3 + 2] = (rand() - 0.5) * 14 - 2;
  };
  for (let i = 0; i < count; i++) { reset(i, true); seed[i * 2] = rand(); seed[i * 2 + 1] = 0.4 + rand() * 1.2; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uTime: { value: 0 }, uOpacity: { value: 1 }, uScale: { value: 300 } },
    vertexShader: /* glsl */`
      attribute vec2 aSeed; uniform float uTime; uniform float uScale; varying float vFlicker;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFlicker = 0.55 + 0.45 * sin(uTime * (3.0 + aSeed.x * 6.0) + aSeed.x * 40.0);
        gl_PointSize = uScale * (0.025 + 0.05 * aSeed.y) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uOpacity; varying float vFlicker;
      void main() { vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(c.rgb * 1.6, c.a * vFlicker * uOpacity); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  let time = 0;
  return {
    update(dt) {
      time += dt; mat.uniforms.uTime.value = time;
      for (let i = 0; i < count; i++) {
        const s = seed[i * 2 + 1], ph = seed[i * 2] * 50;
        pos[i * 3] += Math.sin(time * 0.7 + ph) * 0.25 * dt;
        pos[i * 3 + 1] += (0.25 + 0.35 * s) * dt;
        pos[i * 3 + 2] += Math.cos(time * 0.5 + ph) * 0.2 * dt;
        if (pos[i * 3 + 1] > 9.5) reset(i, false);
      }
      geo.attributes.position.needsUpdate = true;
    },
    setOpacity(v) { mat.uniforms.uOpacity.value = v; },
  };
}

// ---------------------------------------------------------------- yin-yang energy

/** Gold sparks on three tilted orbits plus a soft glow; grows with the yin-yang. */
function createEnergy(scene: THREE.Scene, spark: THREE.Texture, glow: THREE.Texture, target: THREE.Object3D): Fx {
  const group = new THREE.Group();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffb860, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(halo);
  const N = 1100, rand = rng(23);
  const orbitOf = new Uint8Array(N), ang = new Float32Array(N), rad = new Float32Array(N), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) { orbitOf[i] = i % 3; ang[i] = rand() * Math.PI * 2; rad[i] = 1.05 + rand() * 0.22; spd[i] = 0.5 + rand() * 0.9; }
  const pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ map: spark, color: 0xffcf80, size: 0.1, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const sparks = new THREE.Points(geo, mat); sparks.frustumCulled = false;
  group.add(sparks);
  const tilts = [new THREE.Euler(1.25, 0.2, 0), new THREE.Euler(1.55, -0.5, 0.4), new THREE.Euler(1.0, 0.7, -0.3)].map((e) => new THREE.Quaternion().setFromEuler(e));
  scene.add(group);
  const wp = new THREE.Vector3(), ws = new THREE.Vector3(), v = new THREE.Vector3();
  let time = 0;
  return {
    update(dt) {
      time += dt;
      target.getWorldPosition(wp); target.getWorldScale(ws);
      const k = THREE.MathUtils.clamp(ws.x / 0.4, 0, 1);
      group.position.copy(wp);
      const r = 1.55 * k;
      halo.scale.setScalar(5.2 * k + 0.001);
      halo.position.set(0, 0, -0.35);
      halo.material.opacity = 0.32 * k * (0.85 + 0.15 * Math.sin(time * 2.1));
      mat.opacity = 0.9 * k * k;
      for (let i = 0; i < N; i++) {
        ang[i] += spd[i] * dt * (orbitOf[i] === 1 ? -1 : 1);
        const wob = 1 + 0.06 * Math.sin(time * 2 + i);
        v.set(Math.cos(ang[i]) * rad[i] * r * wob, Math.sin(ang[i]) * rad[i] * r * 0.98 * wob, 0).applyQuaternion(tilts[orbitOf[i]]);
        pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
      }
      geo.attributes.position.needsUpdate = true;
    },
    setOpacity() {},
  };
}

// ---------------------------------------------------------------- clips

interface Clips { mixer: THREE.AnimationMixer; entrance: THREE.AnimationAction; idle: THREE.AnimationAction }

function clipsFor(gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] }): Clips {
  // Skinned meshes move far from their bind-pose bounds; default culling would hide them.
  gltf.scene.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) o.frustumCulled = false; });
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const clip = (name: string) => {
    const c = THREE.AnimationClip.findByName(gltf.animations, name);
    if (!c) throw new Error(`Dragon model is missing its ${name} clip`);
    return c;
  };
  const entrance = mixer.clipAction(clip('Entrance'));
  const idle = mixer.clipAction(clip('Idle'));
  entrance.setLoop(THREE.LoopOnce, 1);
  entrance.clampWhenFinished = true;
  idle.setLoop(THREE.LoopRepeat, Infinity);
  // Entrance ends on Idle's first frame: start Idle before releasing Entrance
  // (stopping every action would snap the nodes to their stored transforms).
  mixer.addEventListener('finished', (e) => {
    if (e.action !== entrance) return;
    idle.reset().play();
    entrance.stop();
  });
  return { mixer, entrance, idle };
}

// ---------------------------------------------------------------- scene

export async function createDragonScene(host: HTMLElement, opts: SceneOptions): Promise<DragonScene> {
  const base = `${import.meta.env.BASE_URL}dragons/`;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x030202, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.className = 'dragon-canvas';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040203, 0.034);
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 300);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.55, 0.8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Lights: gold rim and key for the black dragon, soft white and crimson for the white one.
  scene.add(new THREE.HemisphereLight(0x2a2630, 0x050203, 0.35));
  const dir = (color: number, intensity: number, x: number, y: number, z: number) => {
    const l = new THREE.DirectionalLight(color, intensity); l.position.set(x, y, z); scene.add(l);
  };
  dir(0xffb347, 5.2, -7, 7, -5);
  dir(0xffc27a, 2.5, -6, 3.5, 7);
  dir(0xeef2ff, 1.25, 6, 5, 7);
  dir(0xff2a3a, 3.0, 7, 3, -7);
  const yyLight = new THREE.PointLight(0xffcf7a, 0, 9, 1.6);
  yyLight.position.set(0, 2.9, 2.4);
  scene.add(yyLight);

  const loader = new GLTFLoader();
  const tex = new THREE.TextureLoader();
  const [gltfs, smokeMaps, ember, glow] = await Promise.all([
    Promise.all(['black-dragon', 'white-dragon', 'yin-yang'].map((n) => loader.loadAsync(`${base}${n}.glb`))),
    Promise.all(SMOKE_FILES.map((n) => tex.loadAsync(`${base}fx/${n}.png`))),
    tex.loadAsync(`${base}fx/ember.png`),
    tex.loadAsync(`${base}fx/glow_gold.png`),
  ]);
  for (const t of [...smokeMaps, ember, glow]) t.colorSpace = THREE.SRGBColorSpace;
  gltfs.forEach((g) => scene.add(g.scene));
  const clips = gltfs.map(clipsFor);
  const yinYang = gltfs[2].scene.getObjectByName('YinYang_Stage') ?? gltfs[2].scene;
  const white = gltfs[1].scene.getObjectByName('Object_2') as THREE.SkinnedMesh | undefined;
  const smoke = createSmoke(scene, smokeMaps);
  const embers = createEmbers(scene, ember, 700);
  const energy = createEnergy(scene, ember, glow, yinYang);

  // Layout: the dragons sit to the right of the hero text on wide screens and
  // behind it, pulled back, on narrow ones.
  function layout() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 700 ? 1.25 : 1.5));
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    const aspect = w / h;
    camera.aspect = aspect;
    const narrow = aspect < 1;
    camera.fov = narrow ? 44 : 34;
    camera.position.set(0.6, narrow ? 3.9 : 3.6, narrow ? 17.5 : 15.5);
    camera.lookAt(0.6, narrow ? 3.3 : 3.3, -1);
    // Shift the picture right so the hero text keeps the left side.
    if (narrow) camera.clearViewOffset();
    else camera.setViewOffset(w, h, -w * 0.24, 0, w, h);
    camera.updateProjectionMatrix();
  }
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(host);

  let time = 0;
  let paused = false;
  let started = false;
  let raf = 0;
  const clock = new THREE.Clock(false);
  const ws = new THREE.Vector3();

  function poseAt(t: number) {
    for (const c of clips) {
      if (t < ENTRANCE_S) { c.entrance.reset().play(); c.entrance.paused = true; c.entrance.time = t; c.idle.stop(); }
      else { c.idle.reset().play(); c.idle.time = (t - ENTRANCE_S) % IDLE_S; c.entrance.stop(); }
      c.mixer.update(0);
    }
  }

  function step(dt: number) {
    time += dt;
    for (const c of clips) c.mixer.update(dt);
    const fadeIn = THREE.MathUtils.smoothstep(time, 0, 3);
    smoke.setOpacity(0.35 + 0.65 * fadeIn);
    embers.setOpacity(fadeIn);
    smoke.update(dt); embers.update(dt); energy.update(dt);
    yyLight.intensity = 2.6 * THREE.MathUtils.clamp(yinYang.getWorldScale(ws).x / 0.4, 0, 1);
  }

  function frame() {
    raf = 0;
    if (paused || !started) return;
    step(Math.min(clock.getDelta(), 1 / 15));
    composer.render();
    api.onFrame?.(time);
    raf = requestAnimationFrame(frame);
  }

  const api: DragonScene = {
    get time() { return time; },
    root: scene,
    start(fromEntrance) {
      started = true;
      if (opts.still) {
        // Reduced motion: one still frame of the settled pose, effects fully in.
        poseAt(ENTRANCE_S); time = 3; smoke.setOpacity(1); embers.setOpacity(1);
        smoke.update(0); embers.update(0); energy.update(0);
        yyLight.intensity = 2.6;
        composer.render();
        return;
      }
      time = fromEntrance ? 0 : ENTRANCE_S;
      if (fromEntrance) for (const c of clips) { c.idle.stop(); c.entrance.reset().play(); }
      else poseAt(ENTRANCE_S);
      clock.start();
      if (!raf && !paused) raf = requestAnimationFrame(frame);
    },
    setPaused(p) {
      if (p === paused) return;
      paused = p;
      if (!p && started && !opts.still) { clock.getDelta(); if (!raf) raf = requestAnimationFrame(frame); }
      if (!p && opts.still && started) composer.render();
    },
    whiteDragonInView() {
      if (!white) return false;
      camera.updateMatrixWorld();
      const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      white.computeBoundingBox();
      return frustum.intersectsBox(white.boundingBox!.clone().applyMatrix4(white.matrixWorld));
    },
    yinYangScale() { return yinYang.getWorldScale(ws).x; },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; started = false;
      ro.disconnect();
      for (const c of clips) c.mixer.stopAllAction();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
        for (const m of mats) {
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
          m.dispose();
        }
      });
      for (const t of [...smokeMaps, ember, glow]) t.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  return api;
}
