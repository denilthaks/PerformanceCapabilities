// The obsidian world behind the home and journey screens: monoliths, fog,
// four glowing zone beacons joined by crimson pathways, and drifting embers.
// Decorative only; every interaction lives in the HTML layer above it.

import * as THREE from 'three';

export interface AmbientOptions {
  reducedMotion: boolean;
  lowPower: boolean;
  /** 0–4: how many zone beacons are lit (complete or open). */
  litBeacons: number;
  onContextLost(): void;
}

export interface AmbientHandle {
  setLit(n: number): void;
  dispose(): void;
}

const BEACONS: [number, number][] = [[-9, 4], [-3, -4], [4, 2], [9, -6]];

export function createAmbient(canvas: HTMLCanvasElement, opts: AmbientOptions): AmbientHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.lowPower, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.lowPower ? 1 : 1.75));
  renderer.setClearColor(0x07080c);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080c, 0.045);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  camera.position.set(0, 9, 20);
  camera.lookAt(0, 0, -2);

  scene.add(new THREE.AmbientLight(0x404050, 0.6));
  const key = new THREE.PointLight(0xff303f, 60, 40, 1.6);
  key.position.set(0, 6, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8899ff, 0.35);
  rim.position.set(-10, 12, -8);
  scene.add(rim);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => { disposables.push(x); return x; };

  // Ground and grid
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(120, 120)), track(new THREE.MeshStandardMaterial({ color: 0x0b0c11, roughness: 0.4, metalness: 0.6 })));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const grid = new THREE.GridHelper(120, 60, 0x8f1026, 0x22121a);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.35;
  grid.position.y = 0.01;
  scene.add(grid);
  track(grid.geometry);
  track(grid.material as THREE.Material);

  // Obsidian monoliths, placed deterministically
  const monoGeo = track(new THREE.BoxGeometry(1, 1, 1));
  const monoMat = track(new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.25, metalness: 0.85 }));
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const count = opts.lowPower ? 22 : 40;
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(monoGeo, monoMat);
    const h = 1.5 + rnd() * 7;
    const x = (rnd() - 0.5) * 50;
    const z = -6 - rnd() * 30;
    m.scale.set(0.6 + rnd() * 1.6, h, 0.6 + rnd() * 1.6);
    m.position.set(x, h / 2, z);
    m.rotation.y = rnd() * Math.PI;
    scene.add(m);
  }

  // Zone beacons and the pathways between them
  const beaconGeo = track(new THREE.OctahedronGeometry(0.55, 0));
  const litMat = track(new THREE.MeshStandardMaterial({ color: 0xff303f, emissive: 0xff303f, emissiveIntensity: 1.6 }));
  const dimMat = track(new THREE.MeshStandardMaterial({ color: 0x2a2d38, emissive: 0x8f1026, emissiveIntensity: 0.15 }));
  const beacons = BEACONS.map(([x, z]) => {
    const b = new THREE.Mesh(beaconGeo, dimMat);
    b.position.set(x, 1.2, z);
    scene.add(b);
    return b;
  });
  const pathMat = track(new THREE.LineBasicMaterial({ color: 0xff303f, transparent: true, opacity: 0.55 }));
  for (let i = 0; i < BEACONS.length - 1; i++) {
    const [ax, az] = BEACONS[i];
    const [bx, bz] = BEACONS[i + 1];
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(ax, 0.05, az), new THREE.Vector3((ax + bx) / 2, 0.05, (az + bz) / 2 + 3), new THREE.Vector3(bx, 0.05, bz));
    const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40))), pathMat);
    scene.add(line);
  }

  // Embers
  const emberCount = opts.lowPower ? 160 : 400;
  const positions = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    positions[i * 3] = (rnd() - 0.5) * 50;
    positions[i * 3 + 1] = rnd() * 12;
    positions[i * 3 + 2] = (rnd() - 0.5) * 40 - 6;
  }
  const emberGeo = track(new THREE.BufferGeometry());
  emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const embers = new THREE.Points(emberGeo, track(new THREE.PointsMaterial({ color: 0xff5a64, size: 0.08, transparent: true, opacity: 0.7, depthWrite: false })));
  scene.add(embers);

  function setLit(n: number) {
    beacons.forEach((b, i) => { b.material = i < n ? litMat : dimMat; });
  }
  setLit(opts.litBeacons);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // A still scene (reduced motion) must be redrawn after a resize clears it.
    if (ready && opts.reducedMotion) render();
  }
  let ready = false;
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let pointerX = 0;
  const onPointer = (e: PointerEvent) => { pointerX = (e.clientX / window.innerWidth - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const onLost = (e: Event) => { e.preventDefault(); stop(); opts.onContextLost(); };
  canvas.addEventListener('webglcontextlost', onLost);

  let frame = 0;
  let running = true;
  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    if (!opts.reducedMotion) {
      camera.position.x = Math.sin(t * 0.05) * 3 + pointerX * 1.2;
      camera.lookAt(0, 0, -2);
      const p = emberGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < emberCount; i++) {
        let y = p.getY(i) + 0.006 + (i % 5) * 0.001;
        if (y > 12) y = 0;
        p.setY(i, y);
      }
      p.needsUpdate = true;
      beacons.forEach((b, i) => { b.rotation.y = t * 0.6 + i; b.position.y = 1.2 + Math.sin(t * 1.2 + i) * 0.15; });
    }
    renderer.render(scene, camera);
  }
  function loop() {
    if (!running) return;
    render();
    if (!opts.reducedMotion) frame = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }
  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!running) { running = true; loop(); }
  };
  document.addEventListener('visibilitychange', onVisibility);
  ready = true;
  loop();

  return {
    setLit(n) {
      setLit(n);
      if (opts.reducedMotion) render();
    },
    dispose() {
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
