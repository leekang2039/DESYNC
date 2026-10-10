// Heart Tag v30 · transformable mechanical core — source. Built into HeartTag_CoreReactor_v30.html (three.js inlined)
// by `node src/build.mjs v30`.
// Derived from the v24/v25 circular time-sync device in HeartTag_TimeSync_Device_v29.html: the stepped base (plinth →
// side wall → ledge, LED dashes) is carried over as the FIXED FRAME; everything above it is rebuilt as real mechanisms.
//
// Hierarchy (every moving part has its own pivot; nothing is animated by swapping meshes):
//   ROOT
//   ├─ FIXED      base, trench floor, bearing races, rotary-union stator, drive motors (+ spinning couplings), feed pipes
//   ├─ OUTER      ← rotates on Y (outer drive)          carrier deck, ring gear, rotary-union rotor, 8 × MOD
//   │   └─ MOD[i] (angle a)  → LIFT (y, guide posts + ram) → SLIDE (radial x, rails + 3-stage arm) → BODY
//   │                            └─ HINGE (cover pivot on the body's outer top edge, rot z) → COVER (ceramic armour)
//   │        cover ram: barrel pinned in BODY, rod pinned on COVER (solved every frame) · flexible hose carrier→BODY
//   ├─ INNER      ← rotates on Y (inner drive, counter)  8 containment blocks (lock-lift, rise + spread), gear, rollers
//   └─ CORE_FIXED housing, 4 lock pins, 3 lift rams     → CORE_LIFT (y) → CORE_ROTOR (rot Y) → ring A (6 segments)
//                                                                                          → CORE_INNER (rot Y) ring B
// Timeline p ∈ [0,1]: ACTIVATION 0–.22 (unlock) · TRANSFORMATION .22–.88 (lift → slide → hinge) · LOCK/DEPLOYED .88–1.
// Spins are integrated separately from p, so they never stop while deploying, and p can run backward / be scrubbed.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const fail = msg => { $('err').textContent = msg; $('fallback').hidden = false; $('fallback').textContent = msg; };
const D2 = Math.PI/180, clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a)*k;
const sm = k => k*k*(3 - 2*k);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({canvas: $('c'), antialias: true}); }
catch (e) { fail('WebGL을 시작할 수 없어요. 하드웨어 가속을 켠 브라우저(Chrome/Edge)에서 열어 주세요.'); throw e; }
const cv = $('c'), stage = cv.parentElement;
renderer.setPixelRatio(Math.min(1.75, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.82;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x15181c);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.38;
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
const controls = new OrbitControls(camera, cv); controls.enableDamping = true; controls.minDistance = 6; controls.maxDistance = 90; controls.target.set(0, 0.8, 0);
scene.add(new THREE.HemisphereLight(0xdfe8f2, 0x23272c, 0.5));
const key = new THREE.DirectionalLight(0xfff3e6, 1.9); key.position.set(10, 18, 8); scene.add(key);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
Object.assign(key.shadow.camera, {left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60});
const rimL = new THREE.DirectionalLight(0xa9c4e0, 0.7); rimL.position.set(-12, 6, -10); scene.add(rimL);
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 96), new THREE.MeshStandardMaterial({color: 0x1b1e22, roughness: .9, metalness: .1}));
floor.rotation.x = -Math.PI/2; floor.position.y = -0.62; floor.receiveShadow = true; scene.add(floor);

// ---------------- materials (brief: off-white ceramic armour · matte black frame · dark gunmetal · brushed metal · a little bronze · red energy) ----------------
const grungeT = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#ededed'; g.fillRect(0, 0, 512, 512); let s = 7; const r = () => (s = (s*16807) % 2147483647)/2147483647;
  for (let i=0;i<9000;i++){ const v = 200 + r()*55 | 0; g.fillStyle = `rgba(${v},${v},${v},0.3)`; g.fillRect(r()*512, r()*512, 1 + r()*3, 1 + r()*3); }
  for (let i=0;i<90;i++){ g.strokeStyle = `rgba(120,120,120,${0.1 + r()*0.2})`; g.lineWidth = 0.6 + r(); g.beginPath(); const x = r()*512, y = r()*512, a = r()*Math.PI*2, L = 8 + r()*50; g.moveTo(x, y); g.lineTo(x + Math.cos(a)*L, y + Math.sin(a)*L); g.stroke(); }
  for (let i=0;i<16;i++){ g.fillStyle = `rgba(90,90,90,${0.03 + r()*0.05})`; g.beginPath(); g.arc(r()*512, r()*512, 10 + r()*30, 0, Math.PI*2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.4, 0.4); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const noiseT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const im = g.createImageData(128, 128);
  for (let i=0;i<128*128;i++){ const v = 150 + (Math.random()*70|0); im.data[i*4] = im.data[i*4+1] = im.data[i*4+2] = v; im.data[i*4+3] = 255; } g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; })();
const MT = (c, r, m, o) => new THREE.MeshStandardMaterial(Object.assign({color: c, roughness: r, metalness: m, roughnessMap: noiseT}, o || {}));
const MAT = {
  ceramic: new THREE.MeshPhysicalMaterial({color: 0xc4c0b8, map: grungeT, roughness: .5, metalness: .05, clearcoat: .35, clearcoatRoughness: .4}),
  ceramicL:new THREE.MeshPhysicalMaterial({color: 0xb2aea6, map: grungeT, roughness: .52, metalness: .05, clearcoat: .3, clearcoatRoughness: .45}),
  black:   MT(0x141619, 0.62, 0.5),
  frame:   MT(0x222529, 0.5, 0.75),
  gun:     MT(0x33383f, 0.38, 0.85),
  deep:    MT(0x0a0b0d, 0.85, 0.3),
  steel:   MT(0xa3aab2, 0.26, 0.95),
  bronze:  MT(0x8f6a3c, 0.32, 0.92),
  glass:   new THREE.MeshPhysicalMaterial({color: 0x220406, roughness: .05, metalness: 0, transparent: true, opacity: .55, clearcoat: 1}),
};
const RED = {   // emissive materials — the only lit parts: core + energy paths (+ status pips)
  core:  new THREE.MeshStandardMaterial({color: 0xff2a1c, emissive: 0xff2010, emissiveIntensity: 2}),
  ring:  new THREE.MeshStandardMaterial({color: 0xd0100c, emissive: 0xff1a10, emissiveIntensity: 1.2}),
  line:  new THREE.MeshStandardMaterial({color: 0x900808, emissive: 0xff1a10, emissiveIntensity: 1.4}),
  pip:   new THREE.MeshStandardMaterial({color: 0x700808, emissive: 0xff2010, emissiveIntensity: 1.6}),
  lock:  new THREE.MeshStandardMaterial({color: 0x400404, emissive: 0xff3020, emissiveIntensity: 0.2}),
};
const flowT = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 8; const g = c.getContext('2d'); g.fillStyle = '#1a0202'; g.fillRect(0, 0, 128, 8);
  for (let x=0;x<128;x+=32){ const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, '#300000'); gr.addColorStop(.7, '#ff3020'); gr.addColorStop(1, '#300000'); g.fillStyle = gr; g.fillRect(x, 1, 32, 6); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.colorSpace = THREE.SRGBColorSpace; return t; })();
RED.flow = new THREE.MeshStandardMaterial({color: 0x000000, emissive: 0xffffff, emissiveMap: flowT, emissiveIntensity: 0.6});

// ---------------- helpers ----------------
const P = (r, a, y) => new THREE.Vector3(Math.cos(a)*r, y, -Math.sin(a)*r);
const grp = (par, name, x=0, y=0, z=0) => { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); par.add(g); return g; };
const add = (par, geo, mat, x=0, y=0, z=0, name) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (name) m.name = name; par.add(m); return m; };
const box = (par, w, h, d, mat, x, y, z, name) => add(par, new THREE.BoxGeometry(w, h, d), mat, x, y, z, name);
// annular sector, angle a ↔ P(r, a), spans y 0..h (same convention as the v24 device)
const sector = (r0, r1, a0, a1, h, bev = 0.04) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.lineTo(r0*Math.cos(a1), r0*Math.sin(a1)); s.absarc(0, 0, r0, a1, a0, true); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: Math.max(0.001, h - 2*bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: Math.max(6, Math.round((a1 - a0)/D2/2))});
  g.rotateX(-Math.PI/2); g.translate(0, bev, 0); return g; };
const ring = (r0, r1, h, bev) => sector(r0, r1, 0, Math.PI*2 - 1e-4, h, bev);
const rbox = (par, w, h, d, mat, r, a, y, name) => { const m = box(par, w, h, d, mat, 0, 0, 0, name); m.position.copy(P(r, a, y)); m.rotation.y = a; return m; };
const UP = new THREE.Vector3(0, 1, 0);
const cylGeo = (r, L, seg = 16) => new THREE.CylinderGeometry(r, r, L, seg);
// static rod between two points
const rod = (par, A, B, r, mat, seg = 14) => { const d = B.clone().sub(A); const m = add(par, cylGeo(r, d.length(), seg), mat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; };
// dynamic: place a fixed-length cylinder starting at A pointing at B
const placeFrom = (m, A, B, L) => { const d = B.clone().sub(A).normalize(); m.position.copy(A).addScaledVector(d, L/2); m.quaternion.setFromUnitVectors(UP, d); };
const inst = (par, geo, mat, mats, name) => { const im = new THREE.InstancedMesh(geo, mat, mats.length); mats.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = im.receiveShadow = true; im.name = name; par.add(im); return im; };
const Mx = (pos, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1));
// gear: hub ring + instanced teeth on the outside (out = 1) or inside (out = -1)
function gear(par, r, h, teeth, mat, out = 1, name){ const g = grp(par, name);
  add(g, ring(out > 0 ? r - 0.12 : r, out > 0 ? r : r + 0.12, h, 0.01), mat);
  const tg = new THREE.BoxGeometry(0.07, h*0.9, 0.06), ms = [];
  for (let i=0;i<teeth;i++){ const a = i/teeth*Math.PI*2; ms.push(Mx(P(r + out*0.03, a, h/2), a)); }
  inst(g, tg, mat, ms, (name || 'gear') + '_teeth'); return g; }
function pinion(par, r, h, teeth, mat){ const g = grp(par, 'Pinion'); add(g, cylGeo(r - 0.03, h, 20), mat);
  const ms = []; for (let i=0;i<teeth;i++){ const a = i/teeth*Math.PI*2; ms.push(Mx(P(r, a, 0), a)); } inst(g, new THREE.BoxGeometry(0.07, h*0.9, 0.05), mat, ms, 'pinion_teeth'); return g; }

const ROOT = grp(scene, 'HeartTag_CoreReactor_v30');

// =====================================================================================================================
// FIXED FRAME — base ported from the v24/v25 device (plinth → side wall → ledge), recoloured to the brief
// =====================================================================================================================
const FIXED = grp(ROOT, 'FIXED_Frame');
const Y_BOT = -0.6, Y_PL = -0.2, Y_LEDGE = 0.72, Y_FL = 0.1;
add(FIXED, cylGeo(7.6, 0.1, 128).translate(0, 0, 0), MAT.black, 0, Y_BOT + 0.05, 0, 'Base_BottomPlate');
{ const PL = grp(FIXED, 'Base_Plinth');
  for (let i=0;i<30;i++){ const a0 = i/30*Math.PI*2 + 0.017, a1 = (i + 1)/30*Math.PI*2 - 0.017, am = (a0 + a1)/2;
    add(PL, sector(7.02, 7.74, a0, a1, Y_PL - Y_BOT - 0.08, 0.05), i%6 === 4 ? MAT.ceramicL : MAT.ceramic, 0, Y_BOT + 0.08, 0);
    rbox(PL, 0.32, 0.36, 0.16, MAT.black, 7.6, a0 - 0.017, Y_BOT + 0.26);
    if (i%3 === 0) rbox(PL, 0.03, 0.05, 0.05, RED.pip, 7.77, a0 - 0.017, Y_BOT + 0.33); } }
{ const SW = grp(FIXED, 'Base_SideWall'), N = 24;
  for (let i=0;i<N;i++){ const a0 = i/N*Math.PI*2 + 0.008, a1 = (i + 1)/N*Math.PI*2 - 0.008, am = (a0 + a1)/2, k = i%4;
    add(SW, sector(6.72, 7.36, a0, a1, Y_LEDGE - Y_PL, 0.045), i%5 === 3 ? MAT.ceramicL : MAT.ceramic, 0, Y_PL, 0);
    if (k === 0){ rbox(SW, 0.06, 0.4, 1.05, MAT.black, 7.36, am, 0.25); for (let s=0;s<4;s++) rbox(SW, 0.075, 0.018, 0.78, MAT.frame, 7.375, am, 0.15 + s*0.07); }
    if (k === 1){ rbox(SW, 0.1, 0.4, 0.16, MAT.bronze, 7.42, a0 + 0.05, 0.22); rbox(SW, 0.05, 0.06, 0.14, RED.pip, 7.45, a0 + 0.05, 0.45); }
    if (k === 3){ rbox(SW, 0.22, 0.56, 0.2, MAT.black, 7.4, a0 + 0.012, 0.2); }
    rbox(SW, 0.3, 0.12, 0.12, MAT.black, 7.12, a0 - 0.008, Y_LEDGE + 0.06); } }
{ const ms = []; for (let d=0; d<360; d+=1.7){ const a = d*D2; ms.push(Mx(P(7.24, a, Y_LEDGE + 0.008), a + Math.PI/2)); }
  inst(FIXED, new THREE.BoxGeometry(0.075, 0.014, 0.035), RED.line, ms, 'LED_LedgeDashes'); }
// trench: floor + walls + fixed lower bearing races (outer r 6.45, inner r 3.1)
add(FIXED, ring(2.45, 6.72, 0.1, 0), MAT.black, 0, Y_FL - 0.1, 0, 'Trench_Floor');
{ const w = add(FIXED, new THREE.CylinderGeometry(6.71, 6.71, Y_LEDGE - Y_FL, 128, 1, true), MAT.frame.clone(), 0, (Y_LEDGE + Y_FL)/2, 0, 'Trench_Wall'); w.material.side = THREE.DoubleSide; }
add(FIXED, ring(6.3, 6.6, 0.08, 0.01), MAT.steel, 0, Y_FL, 0, 'OuterRace_Fixed');
add(FIXED, ring(2.95, 3.25, 0.08, 0.01), MAT.steel, 0, Y_FL, 0, 'InnerRace_Fixed');
// rotary-union stator (fixed half of the fluid coupling that feeds the rotating outer ring) + 4 feed pipes up from below
const UNION_R = 4.05;
{ const t = add(FIXED, new THREE.TorusGeometry(UNION_R, 0.09, 12, 128), MAT.gun, 0, 0.24, 0, 'RotaryUnion_Stator'); t.rotation.x = Math.PI/2;
  [20, 110, 200, 290].forEach(d => { const a = d*D2; rod(FIXED, P(UNION_R, a, Y_FL), P(UNION_R, a, 0.2), 0.06, MAT.steel);
    const v = add(FIXED, cylGeo(0.09, 0.08, 14), MAT.bronze); v.position.copy(P(UNION_R, a, 0.16)); add(FIXED, cylGeo(0.05, 0.05, 10), RED.pip).position.copy(P(UNION_R + 0.12, a, 0.16)); }); }
// outer drive: 2 motors on the ledge, vertical shafts down to pinions meshing the outer ring gear
const OUT_GEAR_R = 6.62, IN_GEAR_R = 2.46;
const drives = [];
[35, 215].forEach(d => { const a = d*D2, m = grp(FIXED, 'OuterDrive_Motor');
  rbox(m, 0.5, 0.12, 0.7, MAT.frame, 7.05, a, Y_LEDGE + 0.06); rbox(m, 0.52, 0.03, 0.6, MAT.bronze, 7.05, a, Y_LEDGE + 0.135);
  rbox(m, 0.04, 0.05, 0.2, RED.pip, 6.79, a, Y_LEDGE + 0.08);
  const sh = add(m, cylGeo(0.05, Y_LEDGE - 0.27, 10), MAT.steel); sh.position.copy(P(6.86, a, (Y_LEDGE + 0.27)/2 + 0.02));
  const pin = pinion(m, 0.2, 0.1, 10, MAT.steel); pin.position.copy(P(OUT_GEAR_R + 0.24, a, 0.27));
  const cpl = add(m, cylGeo(0.09, 0.05, 6), MAT.steel); cpl.position.copy(P(7.05, a, Y_LEDGE + 0.17));     // visible spinning coupling
  drives.push({pin, cpl, ratio: OUT_GEAR_R/0.2, ring: 'outer'}); });

// =====================================================================================================================
// OUTER RING (rotates) — carrier deck + ring gear + union rotor + 8 deployment modules
// =====================================================================================================================
const OUTER = grp(ROOT, 'OUTER_Ring_Pivot');
const Y_DECK = 0.36;
add(OUTER, ring(4.22, 6.6, 0.1, 0.02), MAT.frame, 0, Y_DECK, 0, 'Carrier_Deck');
add(OUTER, ring(6.32, 6.58, Y_DECK - Y_FL - 0.08, 0.01), MAT.gun, 0, Y_FL + 0.08, 0, 'Carrier_Skirt');
gear(OUTER, OUT_GEAR_R, 0.1, 160, MAT.steel, 1, 'Outer_RingGear').position.y = 0.22;
{ const t = add(OUTER, new THREE.TorusGeometry(UNION_R, 0.085, 12, 128), MAT.steel, 0, 0.36, 0, 'RotaryUnion_Rotor'); t.rotation.x = Math.PI/2;
  const s = add(OUTER, new THREE.TorusGeometry(UNION_R, 0.012, 6, 160), RED.line, 0, 0.3, 0, 'RotaryUnion_Seal'); s.rotation.x = Math.PI/2; }
// bearing balls between the fixed race and the carrier skirt (the cage turns at half the ring speed)
const BALLS = grp(ROOT, 'OuterBearing_Cage'); { const ms = []; for (let i=0;i<72;i++) ms.push(Mx(P(6.45, i/72*Math.PI*2, Y_FL + 0.13))); inst(BALLS, new THREE.SphereGeometry(0.05, 10, 8), MAT.steel, ms, 'Balls'); }

const NMOD = 8, HW = 22.5*D2 - 0.012;   // 45° per module, small seam
// clearances: body floor 0.70 sits above the plate (0.53) and arm (≤0.69); after LIFT (+0.30) it clears the ledge
// clamps (0.84) and the drive motors (0.88) before sliding out over the base; the hinge sits on the cover's outer edge
// (brackets reach out to it under the plate), so the whole cover swings up and never sweeps through the body
const B_R0 = 4.9, B_R1 = 6.62, B_Y0 = 0.70, B_Y1 = 1.05, C_R0 = 4.82, C_R1 = 6.95, C_T = 0.2;
const LIFT_MAX = 0.3, SLIDE_MAX = 1.95, FLIP_MAX = -100*D2, HINGE_X = 6.97, AY = 0.61, PLATE_Y = 0.5;
const MODS = [];
for (let i=0;i<NMOD;i++){
  const a = (i + 0.5)/NMOD*Math.PI*2, MOD = grp(OUTER, 'MOD_' + i); MOD.rotation.y = a;
  // ---- on the carrier: lift guide tubes, lift ram barrel (under the deck), idle latches, manifold + rigid feed with flow window
  const GUIDES = [[4.55, 0.6], [4.55, -0.6], [6.45, 0.6], [6.45, -0.6]];
  GUIDES.forEach(([x, z]) => add(MOD, cylGeo(0.075, 0.14, 12), MAT.black, x, Y_DECK + 0.17, z, 'GuideTube'));
  add(MOD, cylGeo(0.11, 0.22, 14), MAT.black, 5.5, Y_DECK - 0.11, 0, 'LiftRam_Barrel');
  const latches = [-1, 1].map(s => { const pv = grp(MOD, 'IdleLatch', 4.7, Y_DECK + 0.1, s*0.95);
    box(pv, 0.12, 0.12, 0.06, MAT.bronze, 0, 0.06, 0); box(pv, 0.12, 0.04, 0.16, MAT.bronze, 0, 0.1, -s*0.06); pv.userData.s = s; return pv; });
  const man = box(MOD, 0.28, 0.18, 0.5, MAT.gun, 4.48, Y_DECK + 0.19, 1.15, 'Manifold');
  box(MOD, 0.05, 0.05, 0.2, RED.pip, 4.33, Y_DECK + 0.22, 1.15);
  { const A = new THREE.Vector3(UNION_R + 0.05, 0.4, 0.95), B = new THREE.Vector3(4.36, Y_DECK + 0.19, 1.15); rod(MOD, A, B, 0.045, MAT.steel);
    rod(MOD, A.clone().lerp(B, 0.3), A.clone().lerp(B, 0.75), 0.055, RED.flow, 10).name = 'FlowWindow'; }
  // ---- LIFT: plate, guide columns (slide in the tubes), ram rod, fixed rails, arm stage-1 sleeve
  const LIFT = grp(MOD, 'LIFT');
  box(LIFT, 2.35, 0.06, 1.7, MAT.gun, 5.5, PLATE_Y, 0, 'LiftPlate');
  GUIDES.forEach(([x, z]) => add(LIFT, cylGeo(0.05, 0.38, 10), MAT.steel, x, PLATE_Y - 0.19, z, 'GuideColumn'));
  add(LIFT, cylGeo(0.07, 0.3, 12), MAT.steel, 5.5, PLATE_Y - 0.17, 0, 'LiftRam_Rod');
  [-0.62, 0.62].forEach(z => box(LIFT, 2.25, 0.05, 0.08, MAT.steel, 5.525, 0.555, z, 'Rail'));
  const slideLockPin = add(LIFT, cylGeo(0.035, 0.16, 10).rotateX(Math.PI/2), RED.lock, 6.5, 0.555, 0.78, 'SlideLockPin');
  add(LIFT, cylGeo(0.08, 1.0, 18).rotateZ(Math.PI/2), MAT.black, 4.8, AY, 0, 'Arm_Stage1');
  add(LIFT, cylGeo(0.09, 0.06, 18).rotateZ(Math.PI/2), MAT.bronze, 5.28, AY, 0);
  box(LIFT, 0.24, 0.1, 0.24, MAT.frame, 4.42, AY - 0.06, 0, 'Arm_Clevis');
  const s2 = add(LIFT, cylGeo(0.062, 1.0, 16).rotateZ(Math.PI/2), MAT.gun, 4.82, AY, 0, 'Arm_Stage2');
  const mids = [-0.52, 0.52].map(z => box(LIFT, 2.15, 0.04, 0.07, MAT.gun, 5.525, 0.565, z, 'Rail_Middle'));   // drawer-slide middle stage
  // ---- SLIDE: carriages, arm rod + energy strip, body mount, BODY
  const SLIDE = grp(LIFT, 'SLIDE');
  [-0.52, 0.52].forEach(z => box(SLIDE, 0.5, 0.07, 0.14, MAT.frame, 4.95, 0.62, z, 'Carriage'));
  const s3 = add(SLIDE, cylGeo(0.042, 1.05, 14).rotateZ(Math.PI/2), MAT.steel, 4.83, AY, 0, 'Arm_Rod');
  const stripM = RED.line.clone(); const strip = box(SLIDE, 1.0, 0.012, 0.03, stripM, 4.83, AY + 0.045, 0, 'Arm_EnergyStrip');
  box(SLIDE, 0.22, 0.09, 0.3, MAT.frame, 5.42, 0.655, 0, 'Arm_BodyMount');
  const BODY = grp(SLIDE, 'BODY');
  add(BODY, sector(B_R0, B_R1, -HW, HW, 0.07, 0.015), MAT.frame, 0, B_Y0, 0, 'Body_Floor');
  add(BODY, sector(B_R0, B_R0 + 0.14, -HW, HW, B_Y1 - B_Y0, 0.02), MAT.ceramicL, 0, B_Y0, 0, 'Body_InnerWall');
  add(BODY, sector(B_R1 - 0.14, B_R1, -HW, HW, B_Y1 - B_Y0 - 0.02, 0.02), MAT.ceramicL, 0, B_Y0, 0, 'Body_OuterWall');
  [-HW + 0.03, 0, HW - 0.03].forEach((t, k) => { const m = box(BODY, B_R1 - B_R0 - 0.3, B_Y1 - B_Y0 - 0.1, 0.08, k === 1 ? MAT.gun : MAT.black, 0, 0, 0, 'Body_Rib'); m.position.copy(P((B_R0 + B_R1)/2, -t, (B_Y0 + B_Y1)/2 - 0.02)); m.rotation.y = -t; });
  [-0.9, 0, 0.9].forEach(z => box(BODY, 0.36, 0.06, 0.28, MAT.frame, 6.8, B_Y1 - 0.04, z, 'HingeBracket'));
  // internals: two cover rams (barrels pinned in the body), self-repair reservoir + status window, floor port, cable tray
  const RAM_A = new THREE.Vector3(5.12, 0.82, 0.38), RAM_L = 1.2;
  [-1, 1].forEach(s => add(BODY, cylGeo(0.09, 0.12, 12).rotateX(Math.PI/2), MAT.bronze, RAM_A.x, RAM_A.y, s*RAM_A.z, 'CoverRam_Pin'));
  const ramB = add(BODY, cylGeo(0.07, RAM_L, 14), MAT.black, 0, 0, 0, 'CoverRam_Barrel'), ramR = add(BODY, cylGeo(0.04, RAM_L, 12), MAT.steel, 0, 0, 0, 'CoverRam_Rod');
  const ramB2 = add(BODY, cylGeo(0.07, RAM_L, 14), MAT.black, 0, 0, 0, 'CoverRam_Barrel'), ramR2 = add(BODY, cylGeo(0.04, RAM_L, 12), MAT.steel, 0, 0, 0, 'CoverRam_Rod');
  add(BODY, cylGeo(0.13, 0.8, 18).rotateZ(Math.PI/2), MAT.gun, 5.75, 0.92, 0.85, 'Repair_Reservoir');
  add(BODY, cylGeo(0.135, 0.36, 18).rotateZ(Math.PI/2), MAT.glass, 5.75, 0.92, 0.85);
  add(BODY, cylGeo(0.08, 0.34, 12).rotateZ(Math.PI/2), RED.flow, 5.75, 0.92, 0.85, 'Repair_StatusWindow');
  [5.3, 6.2].forEach(x => add(BODY, cylGeo(0.06, 0.1, 10).rotateZ(Math.PI/2), MAT.bronze, x, 0.92, 0.85));
  add(BODY, cylGeo(0.07, 0.06, 12), MAT.bronze, 5.3, B_Y0 - 0.01, 0.9, 'FloorPort');
  rod(BODY, new THREE.Vector3(5.3, B_Y0 + 0.05, 0.9), new THREE.Vector3(5.32, 0.92, 0.86), 0.035, MAT.steel);
  rod(BODY, new THREE.Vector3(6.2, 0.92, 0.85), new THREE.Vector3(6.4, 0.85, 0.2), 0.03, MAT.steel);
  box(BODY, 1.2, 0.04, 0.22, MAT.black, 5.7, B_Y0 + 0.09, -0.75, 'CableTray');
  const coverLockPin = add(BODY, cylGeo(0.04, 0.2, 10).rotateX(Math.PI/2), RED.lock, 6.86, B_Y1 - 0.05, 0.62, 'CoverLockPin');
  // ---- HINGE + COVER (ceramic armour: plate + raised outer rim + panel lines + red seam + vent; ram brackets underneath)
  const HINGE = grp(BODY, 'HINGE', HINGE_X, B_Y1, 0);
  [-0.9, 0, 0.9].forEach(z => add(HINGE, cylGeo(0.065, 0.3, 14).rotateX(Math.PI/2), MAT.steel, 0, 0, z, 'HingeKnuckle'));
  const COVER = grp(HINGE, 'COVER', -HINGE_X, -B_Y1, 0);
  add(COVER, sector(C_R0, C_R1, -HW, HW, C_T, 0.05), i%3 === 1 ? MAT.ceramicL : MAT.ceramic, 0, B_Y1, 0, 'Cover_Plate');
  add(COVER, sector(C_R1 - 0.22, C_R1 - 0.02, -HW + 0.01, HW - 0.01, 0.12, 0.03), MAT.ceramicL, 0, B_Y1 + C_T - 0.02, 0, 'Cover_Rim');
  add(COVER, sector(C_R0 + 0.3, C_R0 + 0.33, -HW + 0.05, HW - 0.05, 0.012, 0), MAT.deep, 0, B_Y1 + C_T, 0, 'PanelLine');
  add(COVER, sector(C_R1 - 0.48, C_R1 - 0.45, -HW + 0.05, HW - 0.05, 0.012, 0), MAT.deep, 0, B_Y1 + C_T, 0, 'PanelLine');
  { const m = box(COVER, 0.9, 0.012, 0.04, RED.line, 0, 0, 0, 'Cover_RedSeam'); m.position.copy(P((C_R0 + C_R1)/2, HW - 0.04, B_Y1 + C_T + 0.006)); m.rotation.y = HW - 0.04; }
  { const m = box(COVER, 0.36, 0.02, 0.26, MAT.black, 0, 0, 0, 'Cover_Vent'); m.position.copy(P(5.9, -0.12, B_Y1 + C_T + 0.01)); m.rotation.y = -0.12; }
  const LEVER = [new THREE.Vector3(HINGE_X - 0.62, B_Y1 - 0.08, 0.38), new THREE.Vector3(HINGE_X - 0.62, B_Y1 - 0.08, -0.38)];
  LEVER.forEach(v => { box(COVER, 0.1, 0.1, 0.05, MAT.frame, v.x, v.y + 0.04, v.z + 0.07); box(COVER, 0.1, 0.1, 0.05, MAT.frame, v.x, v.y + 0.04, v.z - 0.07);
    add(COVER, cylGeo(0.05, 0.16, 10).rotateX(Math.PI/2), MAT.bronze, v.x, v.y, v.z, 'CoverRam_Eye'); });
  // ---- flexible self-repair hose: carrier manifold → body floor port (both ends in MOD space, rebuilt as the body moves)
  const hose = add(MOD, new THREE.BufferGeometry(), MAT.black, 0, 0, 0, 'Repair_Hose');
  const sleeve = add(MOD, new THREE.BufferGeometry(), MAT.steel, 0, 0, 0, 'Hose_Sleeve');
  MODS.push({MOD, LIFT, SLIDE, BODY, HINGE, COVER, latches, s2, s3, mids, strip: stripM, stripMesh: strip, ramB, ramR, ramB2, ramR2, RAM_A, LEVER, RAM_L, hose, sleeve, slideLockPin, coverLockPin, man, key: ''});
}

// =====================================================================================================================
// INNER RING (rotates, counter) — 8 containment blocks on an inner-toothed gear, rollers on the fixed race
// =====================================================================================================================
const INNER = grp(ROOT, 'INNER_Ring_Pivot');
const IR0 = 2.55, IR1 = 3.7, I_Y0 = 0.45, I_Y1 = 1.05;
add(INNER, ring(IR0 - 0.05, IR1 - 0.05, 0.12, 0.01), MAT.frame, 0, 0.3, 0, 'Inner_Carrier');
gear(INNER, IN_GEAR_R, 0.12, 80, MAT.steel, -1, 'Inner_RingGear').position.y = 0.16;
{ const ms = []; for (let i=0;i<24;i++){ const a = i/24*Math.PI*2; ms.push(Mx(P(3.1, a, Y_FL + 0.14), a, 0, Math.PI/2)); } inst(INNER, cylGeo(0.06, 0.16, 10), MAT.steel, ms, 'Inner_Rollers'); }
const IBLK = [];
for (let i=0;i<8;i++){ const a0 = i/8*Math.PI*2 + 0.025, a1 = (i + 1)/8*Math.PI*2 - 0.025, am = (a0 + a1)/2;
  const b = grp(INNER, 'InnerBlock_' + i); b.userData.am = am; IBLK.push(b);
  add(b, sector(IR0, IR1, a0, a1, I_Y1 - I_Y0, 0.07), i%4 === 1 ? MAT.ceramicL : MAT.ceramic, 0, I_Y0, 0);
  add(b, sector(IR0 + 0.2, IR1 - 0.2, a0 + 0.04, a1 - 0.04, 0.02, 0.005), MAT.frame, 0, I_Y1 - 0.004, 0);
  rbox(b, 0.035, 0.08, 0.55, RED.ring, IR0 - 0.01, am, I_Y1 - 0.12, 'InnerFaceGlow');
  rbox(b, 0.4, 0.02, 0.04, RED.line, (IR0 + IR1)/2, am, I_Y1 + 0.02, 'RadialLED');
  [a0 + 0.06, a1 - 0.06].forEach(a => rbox(b, 0.18, 0.4, 0.12, MAT.black, IR1 - 0.02, a, I_Y0 + 0.2, 'BlockGuide')); }

// =====================================================================================================================
// CORE — fixed housing with lock pins + lift rams; CORE_LIFT → CORE_ROTOR (ring A, 6 segments) → CORE_INNER (ring B) + lens
// =====================================================================================================================
const CORE_FIXED = grp(ROOT, 'CORE_Fixed_Housing');
const Y_CF = -0.25;
add(CORE_FIXED, cylGeo(2.42, 0.1, 96), MAT.black, 0, Y_CF, 0, 'Core_Floor');
add(CORE_FIXED, ring(2.12, 2.4, 0.95, 0.03), MAT.gun, 0, Y_CF, 0, 'Core_HousingWall');
add(CORE_FIXED, ring(2.05, 2.15, 0.06, 0.01), MAT.steel, 0, Y_CF + 0.94, 0, 'Core_BearingLip');
const inPin = pinion(CORE_FIXED, 0.16, 0.1, 9, MAT.steel); inPin.position.copy(P(IN_GEAR_R - 0.2, 120*D2, 0.22));
{ const m = grp(CORE_FIXED, 'InnerDrive_Motor'); rbox(m, 0.32, 0.22, 0.5, MAT.frame, 2.26, 120*D2, Y_CF + 1.06); rbox(m, 0.04, 0.05, 0.18, RED.pip, 2.1, 120*D2, Y_CF + 1.1); }
const inCpl = add(CORE_FIXED, cylGeo(0.07, 0.07, 6), MAT.steel); inCpl.position.copy(P(2.26, 120*D2, Y_CF + 1.21));
drives.push({pin: inPin, cpl: inCpl, ratio: IN_GEAR_R/0.16, ring: 'inner', inner: true});
const CLOCK = [45, 135, 225, 315].map(d => { const a = d*D2, g = grp(CORE_FIXED, 'CoreLock_' + d); g.rotation.y = a;
  box(g, 0.3, 0.26, 0.34, MAT.frame, 2.26, 0.15, 0, 'LockHousing'); box(g, 0.04, 0.05, 0.16, RED.pip, 2.42, 0.22, 0);
  const pin = add(g, cylGeo(0.05, 0.5, 12).rotateZ(Math.PI/2), MAT.bronze, 1.95, 0.15, 0, 'LockPin'); return pin; });
const RAMS = [0, 120, 240].map(d => { const a = d*D2;
  const sl = add(CORE_FIXED, cylGeo(0.12, 0.5, 14), MAT.black); sl.position.copy(P(0.95, a, Y_CF + 0.3));
  const r1 = add(CORE_FIXED, cylGeo(0.085, 0.5, 14), MAT.gun), r2 = add(CORE_FIXED, cylGeo(0.06, 0.5, 12), MAT.steel); return {a, r1, r2}; });
const CORE_LIFT = grp(ROOT, 'CORE_LIFT');
const CORE_ROTOR = grp(CORE_LIFT, 'CORE_ROTOR');
add(CORE_ROTOR, cylGeo(2.0, 0.16, 96), MAT.frame, 0, 0.1, 0, 'Rotor_Base');
{ const ms = []; for (let i=0;i<40;i++) ms.push(Mx(P(1.98, i/40*Math.PI*2, 0.1))); inst(CORE_ROTOR, new THREE.SphereGeometry(0.035, 8, 6), MAT.steel, ms, 'Rotor_Bearing'); }
const RINGA = [];
for (let i=0;i<6;i++){ const a0 = i/6*Math.PI*2 + 0.06, a1 = (i + 1)/6*Math.PI*2 - 0.06, am = (a0 + a1)/2, g = grp(CORE_ROTOR, 'RingA_Seg_' + i); g.userData.am = am; RINGA.push(g);
  add(g, sector(1.45, 1.92, a0, a1, 0.36, 0.05), MAT.ceramic, 0, 0.18, 0);
  add(g, sector(1.5, 1.55, a0 + 0.04, a1 - 0.04, 0.012, 0), MAT.deep, 0, 0.54, 0);
  rbox(g, 0.12, 0.2, 0.14, MAT.deep, 1.9, a0 - 0.0, 0.35, 'LockNotch');   // pin seats here when locked
  rbox(g, 0.3, 0.06, 0.1, MAT.bronze, 1.7, am, 0.56, 'Clamp'); }
const glowA = add(CORE_ROTOR, new THREE.TorusGeometry(1.38, 0.03, 8, 128), RED.ring, 0, 0.52, 0, 'Core_GlowRing_A'); glowA.rotation.x = Math.PI/2; glowA.castShadow = false;
const CORE_INNER = grp(CORE_ROTOR, 'CORE_INNER_Ring');
add(CORE_INNER, sector(0.82, 1.3, 0, Math.PI*2 - 1e-4, 0.3, 0.04), MAT.gun, 0, 0.2, 0, 'RingB');
for (let i=0;i<12;i++){ const a = i/12*Math.PI*2; rbox(CORE_INNER, 0.36, 0.05, 0.06, i%3 ? MAT.black : MAT.bronze, 1.06, a, 0.52, 'RingB_Rib'); }
const glowB = add(CORE_INNER, new THREE.TorusGeometry(0.78, 0.022, 8, 96), RED.ring, 0, 0.5, 0, 'Core_GlowRing_B'); glowB.rotation.x = Math.PI/2; glowB.castShadow = false;
const LENS = grp(CORE_ROTOR, 'Core_Lens');
add(LENS, cylGeo(0.6, 0.3, 48), MAT.black, 0, 0.3, 0, 'Lens_Housing');
const lensCore = add(LENS, new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI*2, 0, Math.PI/2), RED.core, 0, 0.45, 0, 'Lens_Emitter'); lensCore.castShadow = false;
const lensGlass = add(LENS, new THREE.SphereGeometry(0.46, 32, 16, 0, Math.PI*2, 0, Math.PI/2), MAT.glass, 0, 0.45, 0); lensGlass.castShadow = false;
const coreLight = new THREE.PointLight(0xff3020, 6, 9, 1.6); coreLight.position.set(0, 1.2, 0); CORE_LIFT.add(coreLight);

// =====================================================================================================================
// STATE: timeline + independent spins
// =====================================================================================================================
const S = {p: 0, dir: 0, rate: 1, dur: 6, paused: false,
  spin: {core: {on: true, k: 1, ang: 0, v: 0}, coreIn: {on: true, k: 1, ang: 0, v: 0}, inner: {on: true, k: 1, ang: 0, v: 0}, outer: {on: true, k: 1, ang: 0, v: 0}},
  repair: -1, repairMod: 0, view: 'q34', freeze: false};
// rad/s at IDLE → DEPLOYED (signs = direction; inner counter-rotates against outer)
const SPD = {core: [0.25, 1.4], coreIn: [-0.35, -2.2], inner: [-0.06, -0.42], outer: [0.035, 0.16]};
const seg = (a, b) => sm(clamp((S.p - a)/(b - a)));
const stateName = () => S.p <= 0.001 ? 'IDLE' : S.p < 0.22 ? 'ACTIVATION' : S.p < 0.88 ? 'TRANSFORMATION' : S.p >= 0.999 ? 'FULL DEPLOYMENT' : 'LOCKING';
const PH = {IDLE: 0, ACTIVATION: 0.2, TRANSFORMATION: 0.6, DEPLOYED: 1};

const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3(), tmpV = new THREE.Vector3();
function applyPose(){
  const p = S.p;
  // ---- ACTIVATION: core locks out, latches open, inner blocks lift off their seats, covers crack
  const unlock = seg(0.02, 0.12);
  CLOCK.forEach(pin => { pin.position.x = lerp(1.95, 2.3, unlock); });
  const glowK = 0.15 + 0.45*seg(0.0, 0.2) + 0.4*seg(0.86, 1.0);
  RED.core.emissiveIntensity = 1.2 + glowK*5; RED.ring.emissiveIntensity = 0.8 + glowK*2.6; coreLight.intensity = 1 + glowK*9;
  IBLK.forEach((b, i) => { const lockLift = 0.12*seg(0.08, 0.18), rise = seg(0.4 + i*0.01, 0.6 + i*0.01), am = b.userData.am;
    const out = 0.32*rise; b.position.set(Math.cos(am)*out, lockLift + 0.4*rise, -Math.sin(am)*out); });
  // ---- core lift + ring A spread
  const lift = seg(0.5, 0.72); CORE_LIFT.position.y = Y_CF + 0.05 + 1.0*lift;
  RINGA.forEach(g => { const d = 0.22*seg(0.6, 0.78), am = g.userData.am; g.position.set(Math.cos(am)*d, 0, -Math.sin(am)*d); });
  RAMS.forEach(R => { const top = CORE_LIFT.position.y + 0.02, bot = Y_CF + 0.05, h = top - bot;
    R.r1.scale.y = Math.max(0.1, h*0.55)/0.5; R.r1.position.copy(P(0.95, R.a, bot + h*0.55/2 + 0.2*lift));
    R.r2.scale.y = Math.max(0.1, h*0.6)/0.5; R.r2.position.copy(P(0.95, R.a, top - h*0.3)); });
  // ---- modules: lift → slide → hinge, staggered around the ring
  MODS.forEach((M, i) => { const o = i*0.012;
    const latch = seg(0.06 + o*0.5, 0.14 + o*0.5), up = seg(0.22 + o, 0.38 + o), out = seg(0.36 + o, 0.58 + o), crack = seg(0.14, 0.22), flip = seg(0.54 + o, 0.74 + o), lock = seg(0.88, 0.96);
    M.latches.forEach(pv => pv.rotation.x = pv.userData.s*latch*1.1);
    M.LIFT.position.y = LIFT_MAX*up;
    const sx = SLIDE_MAX*out; M.SLIDE.position.x = sx;
    M.s2.position.x = 4.82 + sx*0.5; M.mids.forEach(m => m.position.x = 5.525 + sx*0.5);
    M.HINGE.rotation.z = lerp(-4*D2*crack, FLIP_MAX, flip);
    // cover rams: barrel pinned at RAM_A (body), rod pinned at the lever eye (cover) — solve in body space
    [[M.ramB, M.ramR, 1], [M.ramB2, M.ramR2, -1]].forEach(([b, r, s], k) => {
      tA.copy(M.RAM_A); tA.z *= s; const th = M.HINGE.rotation.z, lx = M.LEVER[k].x - HINGE_X, ly = M.LEVER[k].y - B_Y1;   // lever eye: cover space → body space
      tB.set(HINGE_X + lx*Math.cos(th) - ly*Math.sin(th), B_Y1 + lx*Math.sin(th) + ly*Math.cos(th), M.LEVER[k].z);
      placeFrom(b, tA, tB, M.RAM_L); placeFrom(r, tB, tA, M.RAM_L); });
    // locks: slide pin drops into the carriage, cover pin shoots into the hinge knuckle
    M.slideLockPin.position.z = 0.78 - 0.16*lock; M.coverLockPin.position.z = 0.62 + 0.24*lock;
    M.slideLockPin.material = M.coverLockPin.material = lock > 0.9 ? RED.pip : RED.lock;
    // energy strip along the arm: travels outward after the slide
    const e = seg(0.6 + i*0.01, 0.85); M.strip.emissiveIntensity = 0.1 + 1.6*e + (S.repair >= 0 && S.repairMod === i ? 2*Math.sin(Math.PI*S.repair) : 0);
    // hose: rebuild only when the body moved
    const key = (M.LIFT.position.y).toFixed(3) + '/' + sx.toFixed(3);
    if (key !== M.key){ M.key = key;
      const ly = M.LIFT.position.y, A = new THREE.Vector3(4.62, Y_DECK + 0.19, 1.2), B = new THREE.Vector3(5.3 + sx, B_Y0 - 0.04 + ly, 0.9);
      const mid = new THREE.Vector3(lerp(A.x, B.x, 0.5), 0.52 + ly*0.5, 1.4), B2 = new THREE.Vector3(B.x - 0.05, B.y - 0.14, 1.0);
      const curve = new THREE.CatmullRomCurve3([A, new THREE.Vector3(4.85, 0.52, 1.3), mid, B2, B]);
      M.hose.geometry.dispose(); M.hose.geometry = new THREE.TubeGeometry(curve, 36, 0.05, 8, false);
      const sub = new THREE.CatmullRomCurve3(curve.getPoints(12).slice(0, 4)); M.sleeve.geometry.dispose(); M.sleeve.geometry = new THREE.TubeGeometry(sub, 10, 0.062, 8, false); }
  });
}
function spinStep(dt){
  const dep = sm(clamp(S.p/0.3));
  for (const k in S.spin){ const s = S.spin[k], target = s.on ? lerp(SPD[k][0], SPD[k][1], dep)*s.k : 0;
    s.v += (target - s.v)*Math.min(1, dt*1.6); s.ang += s.v*dt; }
  OUTER.rotation.y = S.spin.outer.ang; BALLS.rotation.y = S.spin.outer.ang*0.5;
  INNER.rotation.y = S.spin.inner.ang;
  CORE_ROTOR.rotation.y = S.spin.core.ang; CORE_INNER.rotation.y = S.spin.coreIn.ang;
  drives.forEach(d => { const ang = (d.ring === 'outer' ? S.spin.outer.ang : S.spin.inner.ang)*d.ratio*(d.inner ? 1 : -1); d.pin.rotation.y = ang; d.cpl.rotation.y = ang; });
  RED.flow.emissiveMap.offset.x -= dt*(0.2 + 1.6*sm(clamp(S.p/0.2)));
  RED.flow.emissiveIntensity = 0.8 + 1.6*sm(clamp(S.p/0.2));
}

// ---------------- post + resize ----------------
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.3, 1.05); composer.addPass(bloom); composer.addPass(new OutputPass());
function resize(){ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage); resize();
const VIEWS = {q34: [[0, 15, 22], [0, 0.6, 0]], top: [[0, 30, 0.01], [0, 0, 0]], low: [[0, 3.2, 21], [0, 1.0, 0]], core: [[3.2, 6.2, 5.6], [0, 1.0, 0]], mod: [[11, 5.5, 4], [6.5, 1.0, 0]]};
let camTween = null;
function setView(v){ S.view = v; const [pos, tgt] = VIEWS[v]; const fit = camera.aspect < 1 ? 1.55 : 1;
  camTween = {t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos).multiplyScalar(v === 'core' || v === 'mod' ? Math.sqrt(fit) : fit), t1: new THREE.Vector3(...tgt)}; syncUI(); }
camera.position.set(0, 15, 22).multiplyScalar(camera.aspect < 1 ? 1.55 : 1); controls.update();

// ---------------- UI ----------------
function play(d){ S.dir = d; S.paused = false; syncUI(); }
function jump(name){ S.p = PH[name]; S.dir = 0; applyPose(); syncUI(); }
function syncUI(){
  document.querySelectorAll('[data-a="deploy"]').forEach(b => b.setAttribute('aria-pressed', String(S.dir > 0)));
  document.querySelectorAll('[data-a="fold"]').forEach(b => b.setAttribute('aria-pressed', String(S.dir < 0)));
  document.querySelectorAll('[data-a="pause"]').forEach(b => b.setAttribute('aria-pressed', String(S.dir === 0 && S.p > 0 && S.p < 1)));
  document.querySelectorAll('[data-a="slow"]').forEach(b => b.setAttribute('aria-pressed', String(S.rate < 1)));
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  document.querySelectorAll('[data-spin]').forEach(b => b.setAttribute('aria-pressed', String(S.spin[b.dataset.spin].on)));
}
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
  if (a === 'deploy') play(1); else if (a === 'fold') play(-1); else if (a === 'toggle') play(S.p > 0.5 ? -1 : 1);
  else if (a === 'pause') { S.dir = 0; syncUI(); } else if (a === 'slow') { S.rate = S.rate < 1 ? 1 : 0.25; syncUI(); }
  else if (a === 'repair') { S.repair = 0; S.repairMod = (S.repairMod + 3) % NMOD; }
  else if (b.dataset.phase) jump(b.dataset.phase);
  else if (b.dataset.view) setView(b.dataset.view);
  else if (b.dataset.spin) { const s = S.spin[b.dataset.spin]; s.on = !s.on; syncUI(); } });
const scrub = $('scrub'); scrub.addEventListener('input', () => { S.p = +scrub.value/1000; S.dir = 0; applyPose(); syncUI(); });
document.querySelectorAll('input[data-k]').forEach(inp => inp.addEventListener('input', () => { S.spin[inp.dataset.k].k = +inp.value; $('v_' + inp.dataset.k).textContent = (+inp.value).toFixed(1) + '×'; }));
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); if (S.dir) { S.dir = 0; syncUI(); } else play(S.p > 0.5 ? -1 : 1); }
  else if (k === 'd') play(1); else if (k === 'f') play(-1); else if (k === 's') { S.rate = S.rate < 1 ? 1 : 0.25; syncUI(); } });

// ---------------- loop ----------------
let last = performance.now();
function frame(now){ requestAnimationFrame(frame);
  const dt = S.freeze ? 0 : clamp((now - last)/1000, 0, 0.05); last = now;
  if (S.dir){ S.p = clamp(S.p + S.dir*dt*S.rate/S.dur); if (S.p === 0 || S.p === 1){ S.dir = 0; syncUI(); } }
  if (S.repair >= 0){ S.repair += dt*0.8; if (S.repair > 1) S.repair = -1; }
  spinStep(dt); applyPose();
  if (camTween){ camTween.t = Math.min(1, camTween.t + dt*1.6); const k = sm(camTween.t); camera.position.lerpVectors(camTween.p0, camTween.p1, k); controls.target.lerpVectors(camTween.t0, camTween.t1, k); if (camTween.t >= 1) camTween = null; }
  controls.update();
  $('state').textContent = 'HEART TAG · ' + stateName() + ' · ' + Math.round(S.p*100) + '%';
  if (document.activeElement !== scrub) scrub.value = Math.round(S.p*1000);
  composer.render(); }
applyPose(); syncUI(); requestAnimationFrame(frame);

window.__ht30 = {S, MODS, OUTER, INNER, CORE_ROTOR, CORE_INNER, CORE_LIFT, setView, jump, play, freeze: v => { S.freeze = v; }, applyPose,
  angles: () => ({outer: OUTER.rotation.y, inner: INNER.rotation.y, core: CORE_ROTOR.rotation.y, coreIn: CORE_INNER.rotation.y}),
  mesh: () => { let n = 0; ROOT.traverse(o => { if (o.isMesh) n++; }); return n; }};
