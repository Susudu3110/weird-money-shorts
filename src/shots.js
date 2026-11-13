// THE $18,000,000 MAPLE SYRUP HEIST — shot list (Tall Tale 3D).
// A shot: { id, at, note, draw(lt, d, t, blit) }. Times come from the voice: cut(i) = just before line i,
// Wd('word', i) = when that word is said. Every shot moves the camera; cuts land on the line before the picture changes.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import * as LC from './core/locals.js';
import { Toon, PROPS } from './core/toon.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const talk = (t, on = 1) => (on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 5.3)) : 0);
const blink = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);

const LOOK = {
  thief1: { body: '#4A6FA5', hat: 'beanie', hatCol: '#26313F', pattern: 'stripes', patCol: '#26313F' },
  thief2: { body: '#6E7A4A', hat: 'cap', hatCol: '#3A3A2A', neck: 'scarf', neckCol: '#B5372E' },
  thief3: { body: '#8A4A5A', hat: 'beanie', hatCol: '#4A2A38' },
  chief: { body: '#3E3A52', hat: 'none', neck: 'scarf', neckCol: '#B5372E', extra: ['mustache'], dots: 0 },
  inspector: { body: '#C9A227', hat: 'cap', hatCol: '#2E4E8A', neck: 'tie', neckCol: '#2E4E8A', extra: ['glasses', 'mustache'] },
  cop1: { body: '#3A4E7A', hat: 'cap', hatCol: '#22304E', neck: 'tie', neckCol: '#16161E' },
  cop2: { body: '#2E3E5A', hat: 'cap', hatCol: '#1A2438', neck: 'tie', neckCol: '#16161E', extra: ['mustache'] },
  judge: { body: '#1F1C33', neck: 'collar', extra: ['glasses'] },
  cook: { body: '#E8734A', hat: 'none', pattern: 'apron', neck: 'none', extra: ['mustache'] },
};
const person = (k, opts) => new Toon({ ...LOOK[k], extra: [...(LOOK[k].extra || [])] }, opts);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);
  const cam = camera(38);
  const LOOKS = {
    street: { bloom: 0.15, aperture: 0.0012, maxblur: 0.008 },
    room: { bloom: 0.28, aperture: 0.001, maxblur: 0.008 },
    night: { bloom: 0.5, aperture: 0.0014, maxblur: 0.009 },
    yard: { bloom: 0.42, aperture: 0.0011, maxblur: 0.008 },
  };
  const shoot = (scene, people, from, to, at, at2, k, look, focus) => {
    if (cam.fov !== (look.fov || 38)) { cam.fov = look.fov || 38; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k)); cam.lookAt(at2 ? mix(at, at2, k) : at);
    people.forEach((p) => p && p.face(cam));
    E.render(scene, cam, { ...look, focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at) });
  };
  const label = (txt, x, y, size, col = '#FFFFFF', rot = 0, sc = 1, bg = null) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (bg) { const w = ctx.measureText(txt).width; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2 - 34, -size * 0.72, w + 68, size * 1.44, 18); ctx.fill(); }
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = '#0B0B10'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore();
  };

  // ══ sets ════════════════════════════════════════════════════════════════
  // 1. the town
  const SHOPS = [['SIROP', '#C9603F', 'brick', '#D8343F'], ['GENERAL STORE', '#6FA3B8', 'wood', null], ['BARBER', '#E3C16F', 'wood', '#3C6FB6'],
    ['GRAIN', '#9E4A3A', 'brick', null], ['GARAGE', '#B5553C', 'brick', '#F2C230'], ['CAFE', '#E58A6A', 'wood', '#2E4E3F'],
    ['HARDWARE', '#7FA36A', 'brick', null], ['BANK', '#C7B79A', 'brick', null]];
  const ST = WD.mainStreet(E, { shops: SHOPS });
  ST.sun.key.target.position.set(-3, 0, -2); ST.sun.key.position.set(7, 14, 7);
  const townPerson = (k, h) => { const p = person(k, { height: h }); ST.scene.add(p.group); return p; };
  const tA = townPerson('thief1'), tB = townPerson('thief2'), tC = townPerson('cook');

  // 2. the reserve (one set, day + night)
  const WH = LC.warehouse(E);
  const leaf = LC.mapleSign(4.6); leaf.position.set(0, 4.0, -25.7); WH.scene.add(leaf);
  const wPeople = [person('inspector'), person('thief1'), person('thief2'), person('thief3'), person('chief')];
  wPeople.forEach((p) => WH.scene.add(p.group));
  const wInspector = wPeople[0], wThief1 = wPeople[1], wThief2 = wPeople[2], wThief3 = wPeople[3], wChief = wPeople[4];

  // 3. the street outside, at night
  const NY = LC.nightYard(E);
  const townSign = WD.signBoard('SAINT-LOUIS-DE-BLANDFORD', { w: 7.6, h: 0.9, bg: '#22362C', fg: '#F2E6CF' });
  townSign.position.set(-8.5, 3.4, 2.2); townSign.rotation.y = 0.5; NY.scene.add(townSign);
  const nPeople = [person('thief1'), person('thief2'), person('thief3')];
  nPeople.forEach((p) => NY.scene.add(p.group));
  const nA = nPeople[0], nB = nPeople[1], nC = nPeople[2];

  // 4. the police room
  const PD = WD.interior(E, { w: 9, depth: 7, h: 4.4, wall: '#5C6B5A', motif: '#68785F', floor: '#6B5A44', ceiling: '#3A3A34', signText: null, counterOn: false, litter: false,
    view: null });
  const board = LC.evidenceBoard(); board.position.set(-1.6, 2.55, -6.9); board.scale.set(0.78, 0.78, 1); PD.scene.add(board);
  const map = LC.mapBoard(3.4, 2.0); map.position.set(2.55, 2.5, -6.88); PD.scene.add(map);
  const pdSign = WD.signBoard('SURETE DU QUEBEC', { w: 3.0, h: 0.5, bg: '#22304E', fg: '#F2E6CF' }); pdSign.position.set(2.6, 3.6, -6.86); PD.scene.add(pdSign);
  const dk = PR.desk(2.6); dk.position.set(0.2, 0, -3.6); PD.scene.add(dk);
  const pCop1 = person('cop1'), pCop2 = person('cop2'), pSus = person('thief3');
  pCop1.at(1.05, 0, -4.15); pCop2.at(-0.9, 0, -4.15); pSus.at(0.1, 0, -1.9);
  [pCop1, pCop2, pSus].forEach((p) => PD.scene.add(p.group));
  const pPeople = [pCop1, pCop2, pSus];

  // 5. the courtroom
  const CT = WD.interior(E, { w: 10, depth: 8, h: 5, wall: '#7A5A3A', motif: '#8A6A46', floor: '#6B3E26', ceiling: '#3A2A20', signText: null, counterOn: false, litter: false });
  const ctSign = WD.signBoard('COUR DU QUEBEC', { w: 3.4, h: 0.6, bg: '#3A2A20', fg: '#E2B33C' }); ctSign.position.set(0, 4.2, -7.86); CT.scene.add(ctSign);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.3, 1.6), new THREE.MeshStandardMaterial({ map: WD.T.planks('#5A3A26', [3, 1]) }));
  bench.position.set(0, 1.05, -6.2); bench.castShadow = bench.receiveShadow = true; CT.scene.add(bench);
  const jSeat = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.5, 1.2), new THREE.MeshStandardMaterial({ color: '#3A2A20' }));
  jSeat.position.set(0, 0.25, -6.3); CT.scene.add(jSeat);
  const pJudge = person('judge'); pJudge.at(0, 1.68, -6.2); CT.scene.add(pJudge.group);
  const defs = [person('thief1'), person('thief2'), person('thief3'), person('chief')];
  defs.forEach((p, i) => { p.at(-1.15 + i * 0.77, 0, -4.2); CT.scene.add(p.group); });
  const cPeople = [pJudge, ...defs];

  // 6. the jail cell
  const JL = WD.interior(E, { w: 8, depth: 6, h: 4.4, wall: '#6E6A60', motif: '#7A766A', floor: '#4A4740', ceiling: '#2E2C28', signText: null, counterOn: false, litter: false, bulbs: false });
  const bars = LC.jailBars(10, 3.6, 5.4); bars.position.set(0, 0, -2.6); JL.scene.add(bars);
  const bench2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.7), new THREE.MeshStandardMaterial({ map: WD.T.planks('#6B5A44', [2, 1]) }));
  bench2.position.set(0.9, 0.55, -4.3); JL.scene.add(bench2);
  const pPris = person('chief'); pPris.at(-0.3, 0, -4.2); JL.scene.add(pPris.group);
  const jPeople = [pPris];

  // 7. the kitchen (ending)
  const KT = WD.interior(E, { w: 9, depth: 7, h: 4.4, wall: '#E8C77A', motif: '#F0D48C', floor: '#C98A52', ceiling: '#F2E6CF', signText: null, counterOn: false, litter: false });
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 1.8), new THREE.MeshStandardMaterial({ map: WD.T.planks('#C08A52', [2, 1]) }));
  table.position.set(0, 0.8, -2.6); table.castShadow = table.receiveShadow = true; KT.scene.add(table);
  [[-1.4, -2.6], [1.4, -2.6]].forEach(([x, z]) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), new THREE.MeshStandardMaterial({ color: '#8A5A36' })); leg.position.set(x, 0.4, z); KT.scene.add(leg); });
  const pan = LC.pancakeStack(); pan.position.set(-0.1, 0.86, -2.5); KT.scene.add(pan);
  const pCook = person('cook'); pCook.at(1.25, 0, -1.75); KT.scene.add(pCook.group);
  const kPeople = [pCook];
  const kSun = KT.sun.key; kSun.position.set(-4, 7, -12); kSun.target.position.set(0, 0, -2); kSun.target.updateMatrixWorld();

  // ══ shots ══════════════════════════════════════════════════════════════
  // 1 · HOOK — "In 2012, someone stole eighteen million dollars of maple syrup."
  { const st = cut(0), w = Wd('eighteen', 0);
    add({ id: 'S01', at: st, note: 'crane down the main street to the SIROP shop', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      tA.at(-4.6, 0.18, -2.4); tA.set({ legs: 'walk', phase: t * 7, mood: 'happy', armL: [30, -20] });
      tB.at(-4.0, 0.18, -3.0); tB.set({ legs: 'walk', phase: t * 7 + 2, mood: 'happy' });
      tC.group.visible = false;
      shoot(ST.scene, [tA, tB, ...ST.people], V3(1.5, 11.0, 15.0), V3(0.4, 2.6, 5.0), V3(-2.4, 2.0, -6), V3(-4.6, 1.35, -2.2), k, { ...LOOKS.street, fov: 46 });
      blit();
      const p = clamp((t - w + 0.18) / 0.2);
      if (p > 0) label('$18,000,000', 540, 470, 104, '#FFD43B', -0.03, lerp(2.4, 1, eo(p)));
    } });
    cue(st, 'whoosh', { gain: 0.6 }); cue(w, 'stamp', { gain: 0.9 }); cue(w + 0.04, 'slam', { gain: 0.5 }); }

  // 2 · "And for almost a year, nobody noticed." — the padlock, then the calendar pages
  { const st = cut(1), wn = Wd('noticed', 1);
    add({ id: 'S02', at: st, note: 'night: the padlocked door; calendar pages blow away', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      shoot(NY.scene, [], V3(2.6, 2.9, 6.4), V3(1.1, 2.5, 4.4), V3(0, 2.2, -1.8), null, k, { ...LOOKS.night, fov: 40 });
      blit();
      const page = (txt, x, y, rot, a, sc) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
        ctx.fillStyle = '#F2E6CF'; ctx.fillRect(-110, -70, 220, 140); ctx.strokeStyle = '#1F1C33'; ctx.lineWidth = 7; ctx.strokeRect(-110, -70, 220, 140);
        ctx.fillStyle = '#8A2E2E'; ctx.font = '900 30px Inter'; ctx.textAlign = 'center'; ctx.fillText('2011', 0, -22);
        ctx.fillStyle = '#1F1C33'; ctx.font = '900 62px Inter'; ctx.fillText(txt, 0, 40); ctx.restore(); };
      const f = clamp((t - st - 0.35) / 2.2);
      page('OCT', 540 + f * 240, 700 - f * 320, -0.2 + f * 1.6, 1 - f, 1 - f * 0.3);
      page('JAN', 380 - f * 120, 820 - f * 200, 0.15 - f * 1.2, 0.9 - f, 0.9 - f * 0.3);
      const p = clamp((t - wn) / 0.22);
      if (p > 0) label('NOBODY NOTICED', 540, 1180, 76, '#FFFFFF', -0.02, lerp(1.6, 1, eo(p)), 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh', { gain: 0.6 }); cue(wn, 'pop', { gain: 0.8 }); cue(st + 0.5, 'slide', { dur: 1.6, gain: 0.35 }); }

  // 3 · "See, Quebec makes most of the world's maple syrup."
  { const st = cut(2);
    add({ id: 'S03', at: st, note: 'inside the reserve: the maple leaf wall, barrels left and right', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      shoot(WH.scene, [], V3(-1.4, 2.3, 7.0), V3(-0.4, 2.0, 4.6), V3(0, 3.0, -25), V3(0, 3.4, -25), k, { ...LOOKS.room, fov: 52 }, 24);
      blit();
      label('QUEBEC', 540, 380, 92, '#FFD43B', -0.02, 1);
      label("MOST OF THE WORLD'S SYRUP", 540, 470, 44, '#FFFFFF', -0.02, 1, 'rgba(20,16,24,0.45)');
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'ding', { gain: 0.6 }); }

  // 4 · "So the federation keeps a strategic reserve:"
  { const st = cut(3);
    add({ id: 'S04', at: st, note: 'push down the aisle: barrels on both sides, deep into the warehouse', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      shoot(WH.scene, [], V3(0, 2.1, 8.5), V3(0, 1.85, 3.6), V3(0, 1.9, -14), null, k, { ...LOOKS.room, fov: 60 }, 18);
      blit();
      label('STRATEGIC RESERVE', 540, 330, 60, '#FFFFFF', 0, 1, 'rgba(20,16,24,0.5)');
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: 1.4, gain: 0.4 }); }

  // 5 · "a warehouse stacked with barrels, in Saint-Louis-de-Blandford."
  { const st = cut(4), wb = Wd('barrels', 4);
    add({ id: 'S05', at: st, note: 'tracking sideways along a wall of barrels; one wobbles on "barrels"', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      const x = lerp(-1.2, 1.2, k);
      shoot(WH.scene, [], V3(x, 1.55, 1.6), V3(x + 0.2, 1.5, 1.0), V3(x - 3.6, 1.15, -2.2), null, k, LOOKS.room, 3.2);
      blit();
      const p = clamp((t - wb) / 0.25);
      if (p > 0) label('SAINT-LOUIS-DE-BLANDFORD', 540, 300, 50, '#FFFFFF', 0, lerp(1.3, 1, eo(p)), 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh'); cue(wb, 'pop', { gain: 0.7 }); }

  // 6 · "in Saint-Louis-de-Blandford." — the town sign outside the reserve, night
  { const st = cut(5), ws = Wd('saint', 5);
    add({ id: 'S06', at: st, note: 'night wide: the reserve and the SAINT-LOUIS-DE-BLANDFORD sign, camera drifts in', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      nA.group.visible = nB.group.visible = nC.group.visible = false;
      shoot(NY.scene, [], V3(7.0, 4.0, 15.0), V3(2.6, 3.0, 11.0), V3(-3.0, 3.4, -2.2), null, k, { ...LOOKS.yard, fov: 46 }, 9);
      blit();
      const p = clamp((t - ws) / 0.22);
      if (p > 0) label('SAINT-LOUIS-DE-BLANDFORD', 540, 1490, 46, '#FFFFFF', 0, lerp(1.25, 1, eo(p)), 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh'); cue(ws, 'ding', { gain: 0.6 }); }

  // 6 · "A full barrel weighs about six hundred pounds."
  { const st = cut(6), wp = Wd('pounds', 6);
    add({ id: 'S06', at: st, note: 'a barrel on the scale: the 600 LB stamp lands on "pounds"; the worker strains', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      wInspector.at(0.05, 0, -1.4); wInspector.set({ mood: t > wp ? 'shock' : 'worried', armL: [70, -40], holdL: PROPS.paper('WEIGHT'), armR: [40, -60], sweat: 1, v: 'w' + (Math.floor(t * 3) % 2) });
      wThief1.group.visible = wThief2.group.visible = wThief3.group.visible = wChief.group.visible = false;
      shoot(WH.scene, [wInspector], V3(0.5, 1.35, 1.9), V3(0.35, 1.3, 1.45), V3(0.05, 1.05, -1.5), null, k, LOOKS.room, 1.8);
      blit();
      const p = clamp((t - wp + 0.12) / 0.22);
      if (p > 0) label('600 LB', 540, 560, 132, '#FFD43B', -0.06, lerp(2.6, 1, eo(p)));
    } });
    cue(st, 'whoosh'); cue(wp, 'stamp', { gain: 1 }); cue(wp + 0.03, 'thud', { gain: 0.7 }); cue(wp + 0.3, 'boing', { gain: 0.35 }); }

  // 7 · "The thieves never broke in."
  { const st = cut(7);
    add({ id: 'S08', at: st, note: 'night: three thieves in front of the shut, padlocked door; they shrug', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      nA.at(-1.5, 0, 4.2); nB.at(0.1, 0, 4.6); nC.at(1.6, 0, 4.2);
      nA.set({ mood: 'sly', armL: [24, 10], armR: [30, -10], look: [-0.4, 0.2], blink: blink(t) });
      nB.set({ mood: 'smug', armL: [60, -80], armR: [24, 10], talk: talk(t, lt > 0.5 && lt < 1.4), look: [0.3, 0] });
      nC.set({ mood: 'neutral', armL: [24, 10], armR: [24, 10], look: [0, -0.2] });
      shoot(NY.scene, nPeople, V3(-3.2, 1.9, 8.6), V3(-2.6, 1.7, 7.2), V3(0, 2.1, -1.6), null, k, LOOKS.night);
      blit();
      label('NO BREAK-IN', 540, 330, 64, '#FFFFFF', 0, 1, 'rgba(20,16,24,0.5)');
    } });
    cue(st, 'whoosh'); cue(st + 0.4, 'chirp', { gain: 0.4 }); }

  // 8 · "They worked in the same industrial park."
  { const st = cut(8), wp = Wd('park', 8);
    add({ id: 'S09', at: st, note: 'wide night pan: their low building on the left, the reserve on the right, one lamp between', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      const shed = new THREE.Group(); // a small neighbouring workshop (built once per draw is fine at this size)
      shoot(NY.scene, [], V3(-9.5, 4.2, 16.0), V3(9.0, 3.4, 14.0), V3(-6, 3.0, -4), V3(7, 3.0, -6), k, LOOKS.yard, 22);
      blit();
      const p = clamp((t - wp) / 0.22);
      if (p > 0) label('SAME INDUSTRIAL PARK', 540, 320, 52, '#FFFFFF', 0, lerp(1.4, 1, eo(p)), 'rgba(20,16,24,0.5)');
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: 1.8, gain: 0.45 }); cue(wp, 'ding', { gain: 0.7 }); }

  // 10 · "Every night, they rolled a barrel out,"
  { const st = cut(9);
    add({ id: 'S10', at: st, note: 'night aisle: a barrel rolls out of the stack toward camera, the crew walks it', draw(lt, d, t, blit) {
      const k = clamp(lt / d); WH.setTime(1);
      const z = lerp(-3.4, 1.6, eio(k));
      const b = LC.syrupBarrel(); b.position.set(0.0, 0, z); b.rotation.y = k * 2.2; b.rotation.x = Math.PI / 2 * 0; WH.scene.add(b);
      wThief1.at(0.95, 0, z - 0.35); wThief2.at(-0.95, 0, z - 0.35);
      wThief1.set({ legs: 'walk', phase: t * 6, mood: 'sly', armL: [50, -30], armR: [50, -30], lean: -6 });
      wThief2.set({ legs: 'walk', phase: t * 6 + 2, mood: 'sly', armL: [50, -30], armR: [50, -30], lean: 6 });
      wInspector.group.visible = wThief3.group.visible = wChief.group.visible = false;
      shoot(WH.scene, [wThief1, wThief2], V3(0.2, 1.5, 4.6), V3(0.1, 1.35, 3.2), V3(0, 0.9, z), null, k, LOOKS.night, 3.2);
      blit();
      WH.scene.remove(b);
    } });
    cue(st, 'whoosh'); cue(st, 'slide', { dur: 2.6, gain: 0.4 }); }

  // 10 · "siphoned the syrup into their own barrels,"
  { const st = cut(10), ws = Wd('siphoned', 10);
    add({ id: 'S11', at: st, note: 'close on the brass tap: a thick amber stream into an open barrel', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(1);
      const b = LC.syrupBarrel(); b.position.set(0.2, 0, -1.2); b.rotation.y = 0.5; WH.scene.add(b);
      const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.75, 10), new THREE.MeshStandardMaterial({ color: '#B86A18', roughness: 0.12, metalness: 0.05, emissive: '#5A2A00', emissiveIntensity: 0.35 }));
      const on = t > ws; stream.visible = on; stream.position.set(0.62, 0.62, -0.75); WH.scene.add(stream);
      wThief2.group.visible = false; wInspector.group.visible = false; wThief3.group.visible = false; wChief.group.visible = false;
      wThief1.at(1.35, 0, -0.9); wThief1.set({ mood: 'smug', armL: [70, -60], armR: [30, -20], look: [-0.6, 0.3], blink: blink(t) });
      shoot(WH.scene, [wThief1], V3(1.15, 1.25, 0.95), V3(1.0, 1.15, 0.6), V3(0.35, 0.6, -1.2), null, k, { ...LOOKS.night, fov: 44 }, 1.6);
      blit();
      WH.scene.remove(b); WH.scene.remove(stream);
    } });
    cue(st, 'whoosh'); if (1) cue(ws, 'slide', { dur: 2.0, gain: 0.7 }); }

  // 11 · "filled the empty one with water,"
  { const st = cut(11);
    add({ id: 'S12', at: st, note: 'the hose: a thin blue stream into the empty barrel, the thief holding it', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(1);
      const b = LC.syrupBarrel(); b.position.set(0.2, 0, -1.2); b.rotation.y = 0.5; WH.scene.add(b);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.7, 10), new THREE.MeshStandardMaterial({ color: '#8FD3F4', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85 }));
      water.position.set(0.55, 0.95, -0.85); WH.scene.add(water);
      const hose = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 24, Math.PI * 0.9), new THREE.MeshStandardMaterial({ color: '#2E5A44', roughness: 0.7 }));
      hose.position.set(1.0, 1.5, -0.9); hose.rotation.set(0.3, 0.4, -0.4); WH.scene.add(hose);
      wThief1.at(1.35, 0, -0.9); wThief1.set({ mood: 'smug', armL: [80, -40], armR: [60, -20], holdR: PROPS.cup, look: [-0.6, 0.2] });
      shoot(WH.scene, [wThief1], V3(1.0, 1.35, 1.1), V3(1.05, 1.25, 0.75), V3(0.4, 1.0, -1.2), null, k, { ...LOOKS.night, fov: 46 }, 1.6);
      blit();
      label('JUST WATER', 540, 380, 64, '#8FD3F4', -0.03, 1, 'rgba(20,16,24,0.45)');
      WH.scene.remove(b); WH.scene.remove(water); WH.scene.remove(hose);
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: 2.2, gain: 0.5 }); }

  // 12 · "and rolled it back."
  { const st = cut(12);
    add({ id: 'S13', at: st, note: 'barrel rolls back into the stack; camera pulls back with it', draw(lt, d, t, blit) {
      const k = clamp(lt / d); WH.setTime(1);
      const z = lerp(1.6, -3.4, eio(k));
      const b = LC.syrupBarrel(); b.position.set(0.0, 0, z); b.rotation.y = -k * 2.2; WH.scene.add(b);
      wThief1.at(0.95, 0, z - 0.35); wThief2.at(-0.95, 0, z - 0.35);
      wThief1.set({ legs: 'walk', phase: t * 6, mood: 'sly', armL: [50, -30], armR: [50, -30], lean: -6 });
      wThief2.set({ legs: 'walk', phase: t * 6 + 2, mood: 'sly', armL: [50, -30], armR: [50, -30], lean: 6 });
      wInspector.group.visible = wThief3.group.visible = wChief.group.visible = false;
      shoot(WH.scene, [wThief1, wThief2], V3(0.2, 1.5, 4.8), V3(0.1, 1.4, 5.6), V3(0, 0.9, z), null, k, LOOKS.night, 3.4);
      blit();
      WH.scene.remove(b);
    } });
    cue(st, 'whoosh'); cue(st, 'slide', { dur: 2.4, gain: 0.4 }); cue(cut(12), 'thud', { gain: 0.7 }); }

  // 13 · "Ten months. Nobody checked."
  { const st = cut(13);
    add({ id: 'S14', at: st, note: 'day: the aisle with a hole in the stack; months tear off', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      shoot(WH.scene, [], V3(1.2, 2.4, 6.4), V3(0.6, 1.9, 4.4), V3(2.2, 1.6, -4.2), null, k, { ...LOOKS.room, fov: 48 }, 7);
      blit();
      label('TEN MONTHS', 540, 380, 88, '#FFD43B', -0.03, 1, 'rgba(20,16,24,0.5)');
      const f = (t - st) % 1.1;
      ctx.save(); ctx.globalAlpha = clamp(1 - f * 1.4); ctx.translate(760, 560 + f * 80); ctx.rotate(0.2 + f);
      ctx.fillStyle = '#F2E6CF'; ctx.fillRect(-60, -40, 120, 80); ctx.fillStyle = '#8A2E2E'; ctx.font = '900 28px Inter'; ctx.textAlign = 'center'; ctx.fillText('NO CHECK', 0, 8); ctx.restore();
    } });
    cue(st, 'whoosh'); cue(st + 0.15, 'pop', { gain: 0.7 }); cue(st + 1.0, 'slide', { dur: 0.5, gain: 0.35 }); }

  // 14 · "Then, July 2012: an inspector climbs the stack,"
  { const st = cut(14), wj = Wd('July', 14);
    add({ id: 'S15', at: st, note: 'the inspector climbs a stack of barrels, camera cranes up with him', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      // a climbing stack at the aisle edge
      const climb = new THREE.Group(); WH.scene.add(climb);
      [[2.4, 0, -2.2], [2.4, 1.14, -2.2], [2.4, 2.28, -2.2], [3.0, 0, -2.2], [3.0, 1.14, -2.2]].forEach(([x, y, z], i) => { const b = LC.syrupBarrel(); b.position.set(x, y, z); b.rotation.y = i * 0.7; climb.add(b); });
      const up = clamp((lt - 0.15) / (d * 0.75));
      wInspector.at(2.35, 0.1 + up * 1.1, -1.35); wInspector.set({ legs: up < 1 ? 'walk' : 'stand', phase: t * 6, mood: 'worried', armL: [120, 20], armR: [140, 10], look: [0, -0.4], sweat: 1, lean: -4 });
      wThief1.group.visible = wThief2.group.visible = wThief3.group.visible = wChief.group.visible = false;
      shoot(WH.scene, [wInspector], V3(0.4, 1.3, 1.6), V3(0.8, 2.3, 0.9), V3(2.6, 1.4 + up * 1.2, -2.2), null, k, LOOKS.room, 3.4);
      blit();
      const p = clamp((t - wj) / 0.2);
      if (p > 0) label('JULY 2012', 540, 330, 64, '#FFFFFF', 0, lerp(1.5, 1, eo(p)), 'rgba(20,16,24,0.55)');
      WH.scene.remove(climb);
    } });
    cue(st, 'whoosh'); cue(wj, 'ding', { gain: 0.8 }); }

  // 15 · "and one barrel almost falls over."
  { const st = cut(15);
    add({ id: 'S16', at: st, note: 'the top barrel tips, the inspector grabs it, camera punches in', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      const tilt = Math.sin(clamp(lt / d) * Math.PI) * 0.34;
      const b = LC.syrupBarrel(); b.position.set(2.4, 2.28, -2.2); b.rotation.z = tilt; WH.scene.add(b);
      const base = LC.syrupBarrel(); base.position.set(2.4, 1.14, -2.2); WH.scene.add(base);
      wInspector.at(1.7, 1.2, -1.5); wInspector.set({ mood: 'shock', armL: [150, 10], armR: [150, 20], look: [0.4, -0.2], sweat: 1, legs: 'stand' });
      shoot(WH.scene, [wInspector], V3(0.9, 2.1, 0.2), V3(1.35, 2.2, -0.5), V3(2.4, 2.8, -2.2), null, k, { ...LOOKS.room, fov: 44 }, 1.6);
      blit();
      WH.scene.remove(b); WH.scene.remove(base);
    } });
    cue(st, 'whoosh'); cue(st + 0.25, 'slide', { dur: 0.7, gain: 0.5 }); cue(st + 0.5, 'boing', { gain: 0.7 }); }

  // 16 · "Too light. He opens it. It's water."
  { const st = cut(16), ww = Wd('water', 16);
    add({ id: 'S17', at: st, note: 'close on the bung: he pulls it, water glugs out; "WATER" label', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      const b = LC.syrupBarrel(); b.position.set(0.1, 0.95, -1.3); b.rotation.z = 1.2; b.rotation.y = 0.3; WH.scene.add(b);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.9, 10), new THREE.MeshStandardMaterial({ color: '#8FD3F4', roughness: 0.05, transparent: true, opacity: 0.85 }));
      water.position.set(0.42, 0.55, -0.7); water.rotation.z = 0.4; water.visible = t > ww; WH.scene.add(water);
      wInspector.at(0.95, 0, -0.55); wInspector.set({ mood: 'shock', armL: [120, -30], armR: [100, -50], holdR: PROPS.paper('WATER'), look: [-0.3, 0.2], sweat: 1, v: 'wt' });
      shoot(WH.scene, [wInspector], V3(0.75, 1.35, 1.1), V3(0.7, 1.28, 0.8), V3(0.15, 1.0, -1.2), null, k, { ...LOOKS.room, fov: 42 }, 1.5);
      blit();
      const p = clamp((t - ww) / 0.22);
      if (p > 0) label("IT'S WATER", 540, 420, 104, '#8FD3F4', -0.04, lerp(2.2, 1, eo(p)));
      WH.scene.remove(b); WH.scene.remove(water);
    } });
    cue(st, 'whoosh'); cue(ww, 'plop', { gain: 0.8 }); cue(ww + 0.02, 'pop', { gain: 0.6 }); }

  // 17 · "Police interview three hundred people, and search forty locations."
  { const st = cut(17), w3 = Wd('three', 17), w4 = Wd('forty', 18);
    add({ id: 'S18', at: st, note: 'police room: two detectives, the suspect, the evidence board behind', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      pCop1.set({ mood: 'angry', talk: talk(t, t < w4), armR: [60, -70], holdR: PROPS.paper('WHERE?'), look: [0.3, 0], v: 'q' });
      pCop2.set({ mood: 'neutral', armL: [30, -40], holdL: PROPS.book('FILE', 0), look: [0.4, 0], v: 'f' });
      pSus.set({ mood: 'worried', sweat: 1, armL: [30, 20], armR: [40, 30], look: [0.2, 0.4], talk: talk(t, t > 1.2 && t < 2.0) });
      shoot(PD.scene, pPeople, V3(-2.1, 1.8, 1.95), V3(-1.7, 1.72, 1.55), V3(0.2, 1.45, -3.8), null, k, LOOKS.room);
      blit();
      const n = t > w3 ? 300 : 0;
      label('300 INTERVIEWS', 320, 360, 52, '#FFFFFF', -0.02, 1, 'rgba(20,16,24,0.55)');
      if (t > w4) label('40 SEARCHES', 780, 360, 52, '#FFD43B', 0.02, 1, 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh'); cue(w3, 'pop', { gain: 0.7 }); cue(w4, 'pop', { gain: 0.7 }); }

  // 18 · "They recover about four hundred and fifty tonnes."
  { const st = cut(19);
    add({ id: 'S19', at: st, note: 'the reserve with police tape: recovered barrels, an officer counting', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      // tape
      const tape = (y, z, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.26), new THREE.MeshBasicMaterial({ map: WD.canvasTex('tape' + y + z, 512, 24, (c, w, h) => { c.fillStyle = '#F2D23A'; c.fillRect(0, 0, w, h); c.fillStyle = '#1F1C33'; c.font = '900 15px Inter'; for (let x = 0; x < w; x += 150) c.fillText('POLICE LINE', x + 6, 18); }), side: THREE.DoubleSide, toneMapped: false })); m.position.set(0, y, z); m.rotation.z = rot; WH.scene.add(m); return m; };
      const t1 = tape(1.15, 3.2, 0.04), t2 = tape(1.2, 2.6, -0.05);
      const rec = new THREE.Group(); WH.scene.add(rec);
      [[-1.6, 0.9], [-0.5, 1.2], [0.7, 1.0]].forEach(([x, z], i) => { const b = LC.syrupBarrel(); b.position.set(x, 0, z); b.rotation.y = i; rec.add(b); });
      wInspector.at(2.1, 0, 1.6); wInspector.set({ mood: 'proud', armL: [30, -60], holdL: PROPS.paper('450 t'), armR: [20, 10], v: 'r' });
      wThief1.group.visible = wThief2.group.visible = wThief3.group.visible = wChief.group.visible = false;
      shoot(WH.scene, [wInspector], V3(-2.2, 1.8, 5.2), V3(-1.6, 1.7, 4.2), V3(0, 1.0, 1.2), null, k, LOOKS.room, 4.4);
      blit();
      label('450 TONNES BACK', 540, 330, 58, '#FFFFFF', -0.01, 1, 'rgba(20,16,24,0.55)');
      WH.scene.remove(rec); WH.scene.remove(t1); WH.scene.remove(t2);
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'pop', { gain: 0.6 }); }

  // 19 · "The rest was sold in Ontario and the United States."
  { const st = cut(20), wo = Wd('Ontario', 20);
    add({ id: 'S20', at: st, note: 'the map board: routes light up from Quebec to Ontario and the U.S.', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      pCop1.group.visible = pCop2.group.visible = pSus.group.visible = false;
      board.visible = true;
      shoot(PD.scene, [], V3(-0.4, 2.05, 1.1), V3(0.1, 1.98, 0.7), V3(2.55, 2.45, -6.88), null, k, { ...LOOKS.room, fov: 46 }, 8.2);
      blit();
      const p = clamp((t - wo) / 0.25);
      if (p > 0) label('ONTARIO  ·  USA', 540, 1500, 62, '#FFD43B', -0.02, lerp(1.4, 1, eo(p)), 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh'); cue(wo, 'ding', { gain: 0.8 }); cue(wo + 0.15, 'pop', { gain: 0.5 }); }

  // 20 · "Four men went to prison."
  { const st = cut(21);
    add({ id: 'S21', at: st, note: 'court: four men in a row, the judge behind the bench', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      defs.forEach((p, i) => p.set({ mood: i === 3 ? 'sad' : 'worried', look: [0, 0.2], armL: [14, 6], armR: [14, 6], blink: blink(t, i) }));
      pJudge.set({ mood: 'angry', armR: [150, 10], holdR: PROPS.rubberStamp, v: 'g' + (Math.floor(lt * 2) % 2), lean: Math.sin(t * 5) * 1.5 });
      shoot(CT.scene, cPeople, V3(-2.4, 1.9, 0.9), V3(2.2, 1.75, 0.6), V3(0, 1.45, -4.4), null, eio(k), { ...LOOKS.room, fov: 50 }, 5);
      blit();
      label('FOUR MEN', 540, 330, 76, '#FFD43B', -0.02, 1, 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh'); cue(st + 0.3, 'stamp', { gain: 0.9 }); cue(st + 0.34, 'slam', { gain: 0.6 }); }

  // 21 · "The ringleader got nearly eight years."
  { const st = cut(22), w8 = Wd('eight', 22);
    add({ id: 'S22', at: st, note: 'the cell: the ringleader behind bars, "8 YEARS" stamps on', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      pPris.set({ mood: 'sad', look: [0, 0.3], armL: [16, 8], armR: [16, 8], blink: blink(t) });
      shoot(JL.scene, jPeople, V3(0.4, 1.7, 1.0), V3(0.2, 1.6, 0.2), V3(-0.3, 1.3, -4.2), null, k, { ...LOOKS.room, fov: 46 }, 4.2);
      blit();
      const p = clamp((t - w8) / 0.22);
      if (p > 0) label('8 YEARS', 540, 470, 120, '#FFD43B', -0.05, lerp(2.4, 1, eo(p)));
    } });
    cue(st, 'whoosh'); cue(w8, 'stamp', { gain: 1 }); cue(w8 + 0.04, 'thud', { gain: 0.6 }); }

  // 22 · "And the reserve is still there."
  { const st = cut(23);
    add({ id: 'S23', at: st, note: 'day, wide: the full aisle, camera cranes up to the reserve sign', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); WH.setTime(0);
      shoot(WH.scene, [], V3(0, 1.8, 7.4), V3(0, 2.2, 5.6), V3(0, 1.8, -20), V3(0, 6.0, -25.5), k, { ...LOOKS.room, fov: 62 }, 20);
      blit();
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: 1.6, gain: 0.45 }); }

  // 23 · "The locks are better now."
  { const st = cut(24), wl = Wd('locks', 24);
    add({ id: 'S24', at: st, note: 'close on the new padlock and a camera above the door', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d));
      NY.lock.visible = true; NY.lock.scale.setScalar(1);
      shoot(NY.scene, [], V3(0.95, 2.65, 2.2), V3(0.3, 2.4, 1.5), V3(0, 2.25, -1.65), null, k, { ...LOOKS.night, fov: 38 }, 1.4);
      blit();
      const p = clamp((t - wl) / 0.22);
      if (p > 0) label('BETTER LOCKS', 540, 360, 70, '#8FD3F4', -0.02, lerp(1.5, 1, eo(p)), 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh'); cue(wl, 'ding', { gain: 0.8 }); cue(wl + 0.1, 'pop', { gain: 0.6 }); }

  // 24 · "Which means somewhere out there, someone is still eating the world's most expensive pancakes."
  { const st = cut(25), wp = Wd('pancakes', 25);
    add({ id: 'S25', at: st, note: 'kitchen: syrup poured on a tall stack, the cook grins at camera', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / Math.min(d, 3.2)));
      const pour = clamp((t - wp + 0.35) / 0.6);
      pan.pour.visible = pour > 0 && pour < 1.05;
      pan.pour.scale.y = 0.4 + pour * 0.9;
      pCook.set({ mood: t > wp ? 'laugh' : 'happy', talk: talk(t, lt > 0.3 && lt < 1.6), armL: [40, -80], armR: [120, -20], look: [0, -0.3], bob: Math.sin(t * 6) * 2 });
      shoot(KT.scene, kPeople, V3(-0.75, 1.72, 2.1), V3(-0.4, 1.58, 1.5), V3(-0.05, 1.15, -2.5), null, k, { ...LOOKS.room, fov: 52 }, 3.4);
      blit();
      const p = clamp((t - wp) / 0.25);
      if (p > 0) label('$18,000,000 PANCAKES', 540, 330, 54, '#FFD43B', -0.02, lerp(1.35, 1, eo(p)), 'rgba(20,16,24,0.55)');
    } });
    cue(st, 'whoosh'); cue(wp, 'slide', { dur: 1.4, gain: 0.55 }); cue(wp + 0.4, 'ding', { gain: 0.7 }); }

  return { shots: S, cues: CUES };
}