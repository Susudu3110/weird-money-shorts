// Extra sets and props for THE $18,000,000 MAPLE SYRUP HEIST (Tall Tale 3D).
// Built from the Tall Tale world's own textures and light rig, in the same bright, saturated cartoon look.
import * as THREE from 'three';
import { T, mat, canvasTex, signBoard, sky, sunlight, clouds, hills, barrel, crate, car, fence, tree, extras } from './world.js';
import { Toon } from './toon.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const box = (w, h, d, m, x = 0, y = 0, z = 0, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (parent) parent.add(b); return b; };
const cyl = (r1, r2, h, m, x, y, z, parent, seg = 18) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; if (parent) parent.add(c); return c; };

// ---------- a syrup barrel: wooden, iron hoops, a bung on top, an optional brass tap ----------
export function syrupBarrel({ label = 'SIROP', tint = '#A0663A' } = {}) {
  const g = new THREE.Group();
  const wood = mat({ map: T.planks(tint, [2, 1]) });
  cyl(0.5, 0.5, 1.12, wood, 0, 0.56, 0, g, 20);
  const hoop = mat({ color: '#3A3A40', metalness: 0.45, roughness: 0.5 });
  [0.16, 0.56, 0.96].forEach((y) => cyl(0.515, 0.515, 0.06, hoop, 0, y, 0, g, 20));
  cyl(0.1, 0.1, 0.08, hoop, 0.22, 1.14, 0.1, g, 10);
  const t = canvasTex('barrelabel' + label + tint, 256, 160, (c, w, h) => {
    c.fillStyle = '#F2E6CF'; c.fillRect(0, 0, w, h); c.strokeStyle = '#5A3A26'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = '#8A2E2E'; c.font = '900 44px Caladea, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, w / 2, h / 2 - 12);
    c.fillStyle = '#5A3A26'; c.font = '700 24px Inter'; c.fillText('QUEBEC', w / 2, h / 2 + 32);
  });
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.29), mat({ map: t }));
  lm.position.set(0, 0.62, 0.505); g.add(lm);
  const tap = new THREE.Group(); tap.position.set(0, 0.38, 0.5); g.add(tap); g.tap = tap;
  cyl(0.06, 0.06, 0.16, mat({ color: '#C9A13B', metalness: 0.7, roughness: 0.3 }), 0, 0, 0.05, tap, 10).rotation.x = Math.PI / 2;
  cyl(0.035, 0.045, 0.12, mat({ color: '#C9A13B', metalness: 0.7, roughness: 0.3 }), 0, -0.07, 0.1, tap, 10);
  return g;
}

/** a wooden pallet (barrels sit on these) */
export function pallet() {
  const g = new THREE.Group(), m = mat({ map: T.planks('#B08050', [1, 1]) });
  for (let i = 0; i < 5; i++) box(1.3, 0.04, 0.16, m, 0, 0.14, -0.5 + i * 0.25, g);
  [-0.5, 0, 0.5].forEach((x) => box(0.14, 0.12, 1.3, m, x, 0.06, 0, g));
  return g;
}

// ---------- the strategic reserve: a big brick warehouse full of barrels ----------
export function warehouse(E, { sign = "RESERVE DE SIROP D'ERABLE" } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#171310');
  scene.environment = E.envMap; scene.environmentIntensity = 0.22;
  const W = 28, D = 34, H = 9;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat({ map: T.dirt('#9C9E9A', [9, 9], false) }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -D / 2 + 8; floor.receiveShadow = true; scene.add(floor);
  const brick = (len) => mat({ map: T.brick('#8E6A52', [len / 3, 2]) });
  const back = box(W, H, 0.4, brick(W), 0, H / 2, -D + 8, scene);
  [-1, 1].forEach((s) => box(0.4, H, D, brick(D), s * W / 2, H / 2, -D / 2 + 8, scene));
  const ceil = box(W, 0.3, D, mat({ color: '#3A3028' }), 0, H, -D / 2 + 8, scene); ceil.castShadow = false;
  // roof trusses
  const steel = mat({ color: '#4A4640', metalness: 0.5, roughness: 0.5 });
  for (let z = 6; z > -D + 8; z -= 4) box(W, 0.16, 0.16, steel, 0, H - 0.5, z, scene);
  // high windows on the left wall: daylight slabs
  const winMat = new THREE.MeshBasicMaterial({ color: '#FFF3D0', toneMapped: false });
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), winMat); w.position.set(-W / 2 + 0.22, 6.2, -2 - i * 6); w.rotation.y = Math.PI / 2; scene.add(w); }
  // sign over the back wall
  const sb = signBoard(sign, { w: 7.2, h: 1.0, bg: '#2E4E3F', fg: '#F2D37A' }); sb.position.set(0, 6.3, -D + 8.25); scene.add(sb);
  // barrel stacks: two blocks with a wide aisle down the middle (x -2..2)
  const stacks = [];
  const proto = syrupBarrel();
  const rows = [-13, -10.4, -7.8, -5.2, -2.6, 0, 2.4];
  [-1, 1].forEach((side) => rows.forEach((z, ri) => {
    [0, 1].forEach((c) => {
      for (let h = 0; h < 3; h++) {
        if (rnd(ri * 7 + c * 13 + h * 3 + (side > 0 ? 40 : 0)) < 0.08 && h === 2) continue;   // a gap up top
        const b = proto.clone(); b.position.set(side * (3.4 + c * 1.15), h * 1.14, z); b.rotation.y = rnd(ri + c * 5 + h) * 6.28; scene.add(b); stacks.push(b);
      }
    });
  }));
  // pallets under the bottom row
  rows.forEach((z) => [-1, 1].forEach((s) => { const p = pallet(); p.position.set(s * 4.0, 0, z); scene.add(p); }));
  // a couple of loose barrels + crates near the front
  [[-4.6, 5.6], [4.8, 5.2]].forEach(([x, z]) => { const b = syrupBarrel(); b.position.set(x, 0, z); b.rotation.y = rnd(x) * 6; scene.add(b); });
  [[-6.2, 6.2], [6.4, 6.6]].forEach(([x, z], i) => { const c = crate(0.7); c.position.set(x, 0, z); c.rotation.y = i; scene.add(c); });
  // lights: daylight from the front + warm bulbs
  const sun = new THREE.DirectionalLight('#FFF0D2', 2.6); sun.position.set(6, 12, 14); sun.target.position.set(0, 0, -6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 }); sun.shadow.bias = -0.0006; sun.shadow.camera.updateProjectionMatrix(); sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#FFE9CC', '#4A3A2A', 1.0));
  const bulbs = [];
  [[-5, 4], [5, 4], [-5, -6], [5, -6], [0, -12]].forEach(([x, z], i) => {
    const cord = cyl(0.008, 0.008, 2.2, new THREE.MeshBasicMaterial({ color: '#1A1714' }), x, H - 1.1, z, scene, 4);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshStandardMaterial({ color: '#FFF6DA', emissive: '#FFD98A', emissiveIntensity: 1.4 }));
    b.position.set(x, H - 2.25, z); scene.add(b);
    const pl = new THREE.PointLight('#FFCE8A', 0, 16, 1.5); pl.position.set(x, H - 2.35, z); scene.add(pl);
    bulbs.push({ mesh: b, light: pl, base: 2.2 + rnd(i) * 0.4 });
  });
  const api = {
    scene, sun, bulbs,
    setTime(k) {    // k = 0 day, 1 night
      sun.intensity = 2.6 * (1 - k) + 0.08 * k;
      sun.color.set(k > 0.5 ? '#8FA8D8' : '#FFF0D2');
      bulbs.forEach((b) => { b.light.intensity = b.base * (0.15 + 0.95 * k); b.mesh.material.emissiveIntensity = 0.6 + 1.6 * k; });
      scene.environmentIntensity = 0.22 + 0.06 * (1 - k);
    },
    stacks,
  };
  api.setTime(0);
  return api;
}

// ---------- the reserve from the street, at night ----------
export function nightYard(E) {
  const scene = new THREE.Scene();
  sky(scene, { top: '#0A1230', horizon: '#2B4A78', ground: '#0C1224' });
  const moon = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshBasicMaterial({ color: '#F4F1DC', toneMapped: false }));
  moon.position.set(-26, 34, -90); scene.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex('moonhalo', 128, 128, (c) => { const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(240,244,255,0.85)'); g.addColorStop(1, 'rgba(200,220,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, toneMapped: false }));
  halo.position.copy(moon.position); halo.scale.set(34, 34, 1); scene.add(halo);
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 260; i++) { const a = rnd(i) * 6.28, r = 120 + rnd(i * 3) * 120; sp.push(Math.cos(a) * r, 40 + rnd(i * 7) * 90, Math.sin(a) * r - 60); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.9, sizeAttenuation: true, toneMapped: false })));
  const sun = new THREE.DirectionalLight('#9DB6E8', 0.85); sun.position.set(-16, 20, 12); sun.target.position.set(0, 0, -6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 20, bottom: -16, near: 1, far: 70 }); sun.shadow.bias = -0.0008; sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target); scene.add(new THREE.HemisphereLight('#3A4E7A', '#0E1018', 0.55));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat({ map: T.dirt('#4A4E52', [24, 24], false) }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  // the reserve: a long brick building with a steel door and one lit window
  const B = new THREE.Group(); B.position.set(0, 0, -10); scene.add(B);
  const body = box(28, 9, 16, mat({ map: T.brick('#7A5A48', [9, 3]) }), 0, 4.5, 0, B);
  const roof = box(29, 0.5, 17, mat({ color: '#2A2622' }), 0, 9.2, 0, B);
  const sb = signBoard("RESERVE DE SIROP D'ERABLE", { w: 9.0, h: 1.2, bg: '#22362C', fg: '#E2B33C' }); sb.position.set(0, 7.2, 8.08); B.add(sb);
  const doorFrame = box(5.4, 4.6, 0.4, mat({ color: '#3A3A3E', metalness: 0.4, roughness: 0.5 }), 0, 2.3, 8.05, B);
  const door = box(4.8, 4.2, 0.25, mat({ color: '#5A5E64', metalness: 0.5, roughness: 0.45 }), 0, 2.1, 8.22, B);
  box(4.0, 0.12, 0.1, mat({ color: '#2E3238' }), 0, 3.4, 8.36, B);
  box(4.0, 0.12, 0.1, mat({ color: '#2E3238' }), 0, 1.4, 8.36, B);
  // the padlock: hasp + body + shackle
  const lock = new THREE.Group(); lock.position.set(0, 2.2, 8.4); B.add(lock); B.lock = lock;
  box(0.6, 0.5, 0.12, mat({ color: '#2A2A2E', metalness: 0.6, roughness: 0.4 }), 0, 0, 0, lock);
  const bodyL = box(0.5, 0.6, 0.22, mat({ color: '#C9A13B', metalness: 0.75, roughness: 0.3 }), 0, -0.5, 0.05, lock);
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 20, Math.PI), mat({ color: '#B8BCC4', metalness: 0.8, roughness: 0.25 })); sh.position.set(0, -0.2, 0.05); lock.add(sh);
  // one warm window
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ color: '#FFD98A', toneMapped: false })); lit.position.set(-9, 5.2, 8.06); B.add(lit);
  const wl = new THREE.PointLight('#FFC978', 8, 12, 1.6); wl.position.set(-9, 5.0, 10); scene.add(wl);
  // yard clutter: fence, poles, a parked truck, trees
  const f = fence(24); f.position.set(-12, 0, 6); scene.add(f);
  const pole = new THREE.Group(); cyl(0.12, 0.16, 9, mat({ color: '#3A3028' }), 0, 4.5, 0, pole, 8); box(2.4, 0.14, 0.14, mat({ color: '#3A3028' }), 0, 8.4, 0, pole); pole.position.set(12, 0, 4); scene.add(pole);
  const yardLamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: '#FFF3C8', emissive: '#FFD98A', emissiveIntensity: 2 })); yardLamp.position.set(12, 8.6, 4); scene.add(yardLamp);
  const yl = new THREE.PointLight('#FFD9A0', 14, 20, 1.5); yl.position.set(12, 8.4, 4); scene.add(yl);
  const van = vanTruck('#2C3A4A'); van.position.set(-7.5, 0, 6.5); van.rotation.y = 0.12; scene.add(van);
  [[-16, -4, 1.3], [16, -6, 1.1]].forEach(([x, z, s], i) => { const t = tree(s, '#2E5A34', 'round'); t.position.set(x, 0, z); scene.add(t); });
  return { scene, sun, door, lock, van };
}

/** a boxy delivery truck (cab + box body), faces +x */
export function vanTruck(col = '#2C3A4A') {
  const g = new THREE.Group(), m = mat({ color: col, roughness: 0.45, metalness: 0.25 }), dark = mat({ color: '#16161A', roughness: 0.7 });
  box(3.0, 2.0, 2.0, m, -1.3, 1.5, 0, g);          // box body
  box(1.7, 1.5, 1.9, m, 1.4, 1.15, 0, g);          // cab
  box(1.2, 0.7, 0.06, mat({ color: '#9CC7E4', roughness: 0.15, metalness: 0.2 }), 1.75, 1.45, 0.96, g);
  box(2.6, 0.3, 1.9, dark, -1.2, 0.55, 0, g);
  [[1.5, 0.9], [-0.4, 0.9], [-2.0, 0.9]].forEach(([x, z]) => [-1, 1].forEach((s) => { const w = cyl(0.42, 0.42, 0.24, dark, x, 0.42, s * z, g, 16); w.rotation.x = Math.PI / 2; }));
  const t = canvasTex('truckside', 256, 128, (c) => { c.fillStyle = '#F2E6CF'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#8A2E2E'; c.font = '900 40px Caladea, serif'; c.textAlign = 'center'; c.fillText('SIROP', 128, 56); c.fillStyle = '#5A3A26'; c.font = '700 22px Inter'; c.fillText('DE QUEBEC', 128, 92); });
  const side = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), mat({ map: t })); side.position.set(-1.3, 1.6, 1.01); g.add(side);
  return g;
}

// ---------- a wall map of eastern Canada / the north-east, for the police beat ----------
export function mapBoard(w = 6.4, h = 3.6) {
  const t = canvasTex('mapboard', 1024, 576, (c, W, H) => {
    c.fillStyle = '#E9DFC4'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#B9A98A'; c.lineWidth = 3;
    for (let x = 0; x < W; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y < H; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    // land mass
    c.fillStyle = '#C9D9B0'; c.beginPath(); c.moveTo(40, 420); c.bezierCurveTo(160, 300, 240, 360, 330, 250); c.bezierCurveTo(420, 150, 560, 210, 640, 130); c.lineTo(700, 300); c.bezierCurveTo(620, 420, 420, 470, 300, 500); c.closePath(); c.fill(); c.strokeStyle = '#7A8A66'; c.lineWidth = 6; c.stroke();
    // water
    c.fillStyle = '#A8CBE0'; c.fillRect(0, 470, W, H - 470);
    // markers
    const pin = (x, y, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill(); c.strokeStyle = '#1F1C33'; c.lineWidth = 4; c.stroke(); };
    pin(330, 300, '#D8343F'); pin(470, 380, '#3C6FB6'); pin(590, 430, '#2E8A5A');
    c.fillStyle = '#1F1C33'; c.font = '900 30px Inter'; c.fillText('QUEBEC', 250, 250); c.fillText('ONTARIO', 420, 350); c.fillText('NEW BRUNSWICK', 540, 470);
    c.fillStyle = '#8A2E2E'; c.font = '900 40px Caladea, serif'; c.fillText('STOLEN SYRUP', 60, 70);
    c.fillStyle = '#1F1C33'; c.font = '700 24px Inter'; c.fillText('2,700 TONNES  ·  $18,000,000', 60, 108);
    // dashed routes
    c.strokeStyle = '#D8343F'; c.lineWidth = 6; c.setLineDash([16, 12]); c.beginPath(); c.moveTo(330, 300); c.bezierCurveTo(400, 340, 430, 360, 470, 380); c.stroke(); c.beginPath(); c.moveTo(470, 380); c.lineTo(590, 430); c.stroke(); c.setLineDash([]);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat({ map: t })); m.castShadow = true; return m;
}

/** a plate with a tall stack of pancakes, a pat of butter and a jug of syrup */
export function pancakeStack() {
  const g = new THREE.Group();
  cyl(0.42, 0.42, 0.03, mat({ color: '#F4EFE4' }), 0, 0.02, 0, g, 28);
  const cake = mat({ color: '#D9A05A', roughness: 0.85 }), cake2 = mat({ color: '#C98A44', roughness: 0.9 });
  for (let i = 0; i < 9; i++) { const c = cyl(0.3 - i * 0.006, 0.3 - i * 0.006, 0.055, i % 2 ? cake : cake2, 0, 0.06 + i * 0.058, 0, g, 24); c.rotation.y = rnd(i) * 2; }
  box(0.16, 0.1, 0.16, mat({ color: '#F6E7A8', roughness: 0.5 }), 0, 0.62, 0, g);
  // syrup jug
  const jug = new THREE.Group(); jug.position.set(0.44, 0, 0.12); g.add(jug);
  cyl(0.11, 0.13, 0.3, mat({ color: '#C9822E', roughness: 0.35 }), 0, 0.15, 0, jug, 14);
  cyl(0.05, 0.07, 0.1, mat({ color: '#8A4A1E' }), 0, 0.34, 0, jug, 10);
  // a pour (thin amber cylinder) from the jug lip toward the stack
  const pour = cyl(0.018, 0.026, 0.34, new THREE.MeshStandardMaterial({ color: '#B86A18', roughness: 0.15, metalness: 0.1, emissive: '#5A2A00', emissiveIntensity: 0.25 }), 0.3, 0.5, 0.06, g, 8);
  pour.rotation.z = -0.7; g.pour = pour;
  return g;
}

/** a big painted maple leaf for the reserve wall */
export function mapleSign(size = 4.2) {
  const t = canvasTex('mapleleaf', 512, 512, (c, W, H) => {
    c.clearRect(0, 0, W, H);
    c.translate(W / 2, H / 2); c.scale(1.05, 1.05);
    c.beginPath();
    c.moveTo(0, -210);
    c.bezierCurveTo(30, -150, 44, -120, 36, -86);
    c.bezierCurveTo(86, -104, 128, -96, 150, -66);
    c.bezierCurveTo(112, -44, 96, -16, 100, 14);
    c.bezierCurveTo(150, 6, 186, 26, 198, 62);
    c.bezierCurveTo(140, 74, 104, 100, 84, 136);
    c.bezierCurveTo(96, 170, 88, 200, 66, 224);
    c.lineTo(12, 224); c.lineTo(12, 300); c.lineTo(-12, 300); c.lineTo(-12, 224); c.lineTo(-66, 224);
    c.bezierCurveTo(-88, 200, -96, 170, -84, 136);
    c.bezierCurveTo(-104, 100, -140, 74, -198, 62);
    c.bezierCurveTo(-186, 26, -150, 6, -100, 14);
    c.bezierCurveTo(-96, -16, -112, -44, -150, -66);
    c.bezierCurveTo(-128, -96, -86, -104, -36, -86);
    c.bezierCurveTo(-44, -120, -30, -150, 0, -210);
    c.closePath();
    c.fillStyle = '#C8283A'; c.fill();
    c.lineWidth = 10; c.strokeStyle = '#7A1A24'; c.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
  m.castShadow = false; return m;
}

/** a police evidence pinboard: photos, string, a big red circle */
export function evidenceBoard() {
  const t = canvasTex('evidence', 640, 420, (c, W, H) => {
    c.fillStyle = '#8A6A46'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(60,40,20,${0.05 + rnd(i) * 0.12})`; c.fillRect(rnd(i * 3) * W, rnd(i * 7) * H, 3, 3); }
    const note = (x, y, w, h, rot, txt, col = '#F2E6CF') => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-w / 2 + 4, -h / 2 + 5, w, h); c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#1F1C33'; c.font = '800 22px Inter'; c.textAlign = 'center'; c.fillText(txt, 0, 6); c.restore(); };
    note(120, 110, 180, 120, -0.08, 'WAREHOUSE');
    note(330, 90, 180, 120, 0.06, '9,600 BARRELS');
    note(520, 130, 150, 110, -0.04, 'TRUCK');
    note(200, 280, 200, 110, 0.05, 'R. VALLIERES', '#F2C9C0');
    note(430, 290, 190, 110, -0.06, '$18.7M', '#F2E6B0');
    c.strokeStyle = '#C8283A'; c.lineWidth = 5; c.beginPath(); c.moveTo(120, 110); c.lineTo(330, 90); c.lineTo(520, 130); c.stroke();
    c.beginPath(); c.moveTo(200, 280); c.lineTo(330, 90); c.stroke(); c.beginPath(); c.moveTo(200, 280); c.lineTo(430, 290); c.stroke();
    c.beginPath(); c.arc(330, 90, 78, 0, 7); c.stroke();
    c.fillStyle = '#C8283A'; c.font = '900 26px Inter'; c.fillText('CASE 12-114', 320, 385);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.1), mat({ map: t })); m.castShadow = true; return m;
}

/** simple steel bars for a cell (in front of the camera) */
export function jailBars(n = 9, h = 3.4, span = 4.6) {
  const g = new THREE.Group(), m = mat({ color: '#6E7278', metalness: 0.7, roughness: 0.35 });
  for (let i = 0; i < n; i++) cyl(0.035, 0.035, h, m, -span / 2 + (i * span) / (n - 1), h / 2, 0, g, 8);
  [0.2, h - 0.2].forEach((y) => box(span + 0.2, 0.07, 0.07, m, 0, y, 0, g));
  return g;
}