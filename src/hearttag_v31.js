// Heart Tag v31 · core reactor matched to the reference sheet — source. Built into HeartTag_CoreReactor_v31.html (three.js
// inlined) by `node src/build.mjs v31`. Same fixed base as v30 (ported from the v24/v25 device); the top is rebuilt to the
// reference layout: outer ring of 20 gray blocks + black clamp channel (rotates) · middle ring of 16 blocks (counter-rotates)
// · black ring with red arcs · inner gray ring split by 4 cardinal + 4 diagonal radial modules · recessed red target core.
// States: 01 IDLE → 02 ACTIVATION (core energy → outer panel separation → inner module deploy → energy lines → core rise
// + lock). v30's full deployment (flipped covers) is dropped. Spins stay independent of the timeline.
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
  ceramic: new THREE.MeshPhysicalMaterial({color: 0xaeb1b5, map: grungeT, roughness: .5, metalness: .05, clearcoat: .35, clearcoatRoughness: .4}),
  ceramicL:new THREE.MeshPhysicalMaterial({color: 0x9a9ea3, map: grungeT, roughness: .52, metalness: .05, clearcoat: .3, clearcoatRoughness: .45}),
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

const ROOT = grp(scene, 'HeartTag_CoreReactor_v31');

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
// ledge glow ring under the outer armour (lights up as the panels separate)
const ledgeGlow = add(FIXED, ring(6.2, 6.55, 0.02, 0), RED.line.clone(), 0, Y_LEDGE + 0.005, 0, 'Ledge_GlowRing'); ledgeGlow.castShadow = false;
add(FIXED, ring(1.0, 6.72, 0.1, 0), MAT.black, 0, 0.0, 0, 'Deck_Floor');
add(FIXED, ring(6.0, 6.7, 0.48, 0.01), MAT.frame, 0, 0.1, 0, 'Outer_Bearing_Housing');
add(FIXED, ring(6.3, 6.6, 0.05, 0.01), MAT.steel, 0, 0.58, 0, 'OuterRace_Fixed');
{ const ms = []; for (let i=0;i<72;i++) ms.push(Mx(P(6.45, i/72*Math.PI*2, 0.66))); var BALLS = grp(ROOT, 'OuterBearing_Cage'); inst(BALLS, new THREE.SphereGeometry(0.045, 8, 6), MAT.steel, ms, 'Balls'); }
MAT.braid = MT(0x4a0a0c, 0.7, 0.2);
// outer drive (2 motors set into the ledge; couplings spin with the ring) + inner drive under the black channel
const drives = [];
const OUT_GEAR_R = 5.75;
[35, 215].forEach(d => { const a = d*D2, m = grp(FIXED, 'OuterDrive_Motor');
  rbox(m, 0.28, 0.12, 0.7, MAT.frame, 7.21, a, Y_LEDGE + 0.06); rbox(m, 0.3, 0.03, 0.6, MAT.bronze, 7.21, a, Y_LEDGE + 0.135); rbox(m, 0.04, 0.05, 0.2, RED.pip, 7.36, a, Y_LEDGE + 0.06);
  const cpl = add(m, cylGeo(0.08, 0.05, 6), MAT.steel); cpl.position.copy(P(7.21, a, Y_LEDGE + 0.17));
  const pin = pinion(m, 0.18, 0.1, 10, MAT.steel); pin.position.copy(P(OUT_GEAR_R - 0.22, a, 0.55));
  drives.push({pin, cpl, ratio: OUT_GEAR_R/0.18, ring: 'outer'}); });

// =====================================================================================================================
// OUTER RING (rotates) — reference: thick outermost ring of chunky gray blocks + black channel with bronze clamps
// =====================================================================================================================
const OUTER = grp(ROOT, 'OUTER_Ring_Pivot');
const O_R0 = 5.95, O_R1 = 7.02, O_Y0 = 0.78, O_Y1 = 1.32;
add(OUTER, ring(5.3, 6.4, 0.12, 0.01), MAT.frame, 0, O_Y0 - 0.14, 0, 'Outer_Carrier');
gear(OUTER, OUT_GEAR_R, 0.1, 150, MAT.steel, -1, 'Outer_RingGear').position.y = 0.5;
const OBLK = [], ON = 20;
for (let i=0;i<ON;i++){ const a0 = i/ON*Math.PI*2 + 0.022, a1 = (i + 1)/ON*Math.PI*2 - 0.022, am = (a0 + a1)/2;
  const pv = grp(OUTER, 'OuterBlock_' + i); pv.userData.am = am; OBLK.push(pv);
  const b = grp(pv, 'Block');
  add(b, sector(O_R0, O_R1, a0, a1, O_Y1 - O_Y0, 0.06), i%5 === 2 ? MAT.ceramicL : MAT.ceramic, 0, O_Y0, 0, 'Armor');
  add(b, sector(O_R0 + 0.18, O_R1 - 0.2, a0 + 0.04, a1 - 0.04, 0.03, 0.008), MAT.ceramicL, 0, O_Y1 - 0.01, 0, 'TopInset');
  add(b, sector(O_R0 + 0.16, O_R0 + 0.19, a0 + 0.04, a1 - 0.04, 0.012, 0), MAT.deep, 0, O_Y1 + 0.018, 0, 'PanelLine');
  rbox(b, 0.035, 0.05, (a1 - a0)*O_R1*0.55, RED.line, O_R1 + 0.005, am, O_Y1 - 0.16, 'SideRedLine');
  rbox(b, 0.035, 0.18, 0.2, MAT.black, O_R1 + 0.01, a0 + 0.05, O_Y0 + 0.25, 'SideLatch');
  if (i%2 === 0) rbox(b, 0.42, 0.02, 0.05, RED.line, (O_R0 + O_R1)/2, a1 - 0.05, O_Y1 + 0.03, 'TopRedSlit');
  else { rbox(b, 0.3, 0.025, 0.2, MAT.black, 6.55, am, O_Y1 + 0.025, 'TopVent'); [-0.06, 0.06].forEach(t => add(b, cylGeo(0.035, 0.02, 10), RED.pip, 0, 0, 0).position.copy(P(6.2, am + t, O_Y1 + 0.03))); }
  rbox(b, 0.05, 0.1, 0.3, MAT.black, O_R0 - 0.01, am, O_Y1 - 0.2, 'InnerFaceSlot'); rbox(b, 0.03, 0.04, 0.24, RED.ring, O_R0 - 0.03, am, O_Y1 - 0.2, 'InnerFaceGlow');
  // two lift pistons under each block (rods extend as the panel separates)
  pv.userData.rods = [-0.25, 0.25].map(t => { const r = add(OUTER, cylGeo(0.05, 1, 10), MAT.steel); r.userData.pos = P(6.45, am + t/6.45, 0); return r; });
  // black spacer with red pip in the seam
  rbox(OUTER, 0.6, 0.42, 0.1, MAT.black, 6.5, a1 + 0.022, O_Y0 + 0.2, 'SeamSpacer'); rbox(OUTER, 0.04, 0.05, 0.05, RED.pip, 7.0, a1 + 0.022, O_Y0 + 0.32); }
// black channel between the outer and middle rings: bronze clamps, red dashes, braided self-repair line, flow windows
const CH = grp(OUTER, 'Outer_Channel');
add(CH, ring(5.32, 5.93, 0.42, 0.02), MAT.black, 0, O_Y0 - 0.02, 0, 'Channel_Floor');
for (let i=0;i<24;i++){ const a = i/24*Math.PI*2;
  rbox(CH, 0.36, 0.22, 0.16, i%3 === 0 ? MAT.bronze : MAT.frame, 5.62, a, O_Y0 + 0.5, 'Clamp');
  if (i%3 === 0) rbox(CH, 0.12, 0.05, 0.05, RED.pip, 5.62, a, O_Y0 + 0.63); }
{ const ms = []; for (let d=0; d<360; d+=2.4) ms.push(Mx(P(5.38, d*D2, O_Y0 + 0.41), d*D2 + Math.PI/2)); inst(CH, new THREE.BoxGeometry(0.07, 0.015, 0.03), RED.line, ms, 'Channel_RedDashes'); }
{ const pts = []; for (let i=0;i<96;i++){ const a = i/96*Math.PI*2; pts.push(P(5.78 + 0.03*Math.sin(a*9), a, O_Y0 + 0.47)); }
  add(CH, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 480, 0.05, 8, true), MAT.braid || MAT.black, 0, 0, 0, 'Repair_Line');
  for (let i=0;i<8;i++){ const a = (i + 0.25)/8*Math.PI*2; const w = rod(CH, P(5.5, a - 0.05, O_Y0 + 0.47), P(5.5, a + 0.05, O_Y0 + 0.47), 0.06, RED.flow, 10); w.name = 'Repair_FlowWindow'; } }

// =====================================================================================================================
// INNER RING (counter-rotates) — reference: middle ring of 16 gray blocks, bronze cylinders in alternate seams
// =====================================================================================================================
const INNER = grp(ROOT, 'INNER_Ring_Pivot');
const M_R0 = 4.25, M_R1 = 5.3, M_Y0 = 0.62, M_Y1 = 1.18, IN_GEAR_R = 4.3;
add(INNER, ring(4.2, 5.3, 0.1, 0.01), MAT.frame, 0, M_Y0 - 0.1, 0, 'Inner_Carrier');
gear(INNER, IN_GEAR_R, 0.1, 90, MAT.steel, -1, 'Inner_RingGear').position.y = 0.3;
const IBLK = [], MN = 16;
for (let i=0;i<MN;i++){ const a0 = i/MN*Math.PI*2 + 0.02, a1 = (i + 1)/MN*Math.PI*2 - 0.02, am = (a0 + a1)/2;
  const b = grp(INNER, 'MiddleBlock_' + i); b.userData.am = am; IBLK.push(b);
  add(b, sector(M_R0, M_R1, a0, a1, M_Y1 - M_Y0, 0.05), i%4 === 1 ? MAT.ceramicL : MAT.ceramic, 0, M_Y0, 0);
  add(b, sector(M_R0 + 0.15, M_R1 - 0.15, a0 + 0.04, a1 - 0.04, 0.025, 0.006), MAT.frame, 0, M_Y1 - 0.004, 0, 'TopInset');
  rbox(b, 0.035, 0.07, 0.4, RED.ring, M_R0 - 0.01, am, M_Y1 - 0.14, 'InnerFaceGlow');
  if (i%2) rbox(b, 0.36, 0.02, 0.04, RED.line, (M_R0 + M_R1)/2, am, M_Y1 + 0.022, 'RadialLED');
  else add(b, cylGeo(0.04, 0.02, 10), RED.pip, 0, 0, 0).position.copy(P(M_R1 - 0.22, am, M_Y1 + 0.025));
  if (i%2 === 0){ const A = P(4.75, a1 + 0.02, M_Y1 - 0.12); rod(INNER, P(4.45, a1 + 0.02, M_Y1 - 0.12), P(5.1, a1 + 0.02, M_Y1 - 0.12), 0.09, MAT.bronze, 16);
    rod(INNER, P(4.42, a1 + 0.02, M_Y1 - 0.12), P(4.5, a1 + 0.02, M_Y1 - 0.12), 0.1, MAT.black, 16); } }
const inPin = pinion(FIXED, 0.16, 0.1, 9, MAT.steel); inPin.position.copy(P(IN_GEAR_R - 0.2, 120*D2, 0.35));
drives.push({pin: inPin, cpl: inPin, ratio: IN_GEAR_R/0.16, ring: 'inner', inner: true});

// =====================================================================================================================
// CORE FRAME (fixed) — black ring with red arcs · inner gray ring · 4 cardinal + 4 diagonal radial modules (slide out)
// =====================================================================================================================
const CN = [0, 90, 180, 270].map(d => d*D2), DG = [45, 135, 225, 315].map(d => d*D2), C_GAP = 9*D2;
const CORE_FIXED = grp(ROOT, 'CORE_Fixed_Frame');
CN.forEach(c => add(CORE_FIXED, sector(3.72, 4.22, c + 8*D2, c + 82*D2, 0.75, 0.02), MAT.black, 0, 0.1, 0, 'Core_BlackRing'));   // cut at the cardinals: the big modules slide into these slots
CN.forEach(c => add(CORE_FIXED, sector(3.72, 4.22, c - 8*D2, c + 8*D2, 0.5, 0.01), MAT.frame, 0, 0.1, 0, 'Core_BlackRing_Slot'));
[[20, 70], [110, 160], [200, 250], [290, 340]].forEach(([d0, d1]) => { for (let d=d0; d<=d1; d+=3){ const a = d*D2; rbox(CORE_FIXED, 0.16, 0.025, 0.08, RED.line, 3.97, a, 0.86, 'RedArc'); } });
for (let i=0;i<16;i++){ if (i%4 === 0) continue; const a = i/16*Math.PI*2; rbox(CORE_FIXED, 0.14, 0.12, 0.2, i%2 ? MAT.bronze : MAT.frame, 4.12, a, 0.9, 'BlackRingClamp'); }
// inner gray ring between the cardinal modules
CN.forEach((c, q) => { const a0 = c + C_GAP, a1 = c + Math.PI/2 - C_GAP, am = (a0 + a1)/2;
  [[a0, am - 0.13], [am + 0.13, a1]].forEach(([s0, s1], k) => { const g = grp(CORE_FIXED, 'InnerGrayBlock');
    add(g, sector(2.72, 3.68, s0, s1, 0.55, 0.05), (q + k)%3 === 1 ? MAT.ceramicL : MAT.ceramic, 0, 0.62, 0);
    add(g, sector(2.85, 3.55, s0 + 0.04, s1 - 0.04, 0.02, 0.005), MAT.frame, 0, 1.165, 0);
    rbox(g, 0.035, 0.06, 0.4, RED.ring, 2.71, (s0 + s1)/2, 1.0, 'InnerFaceGlow'); }); });
add(CORE_FIXED, ring(1.38, 2.72, 0.5, 0.02), MAT.frame, 0, 0.1, 0, 'Core_InnerDeck');
for (let i=0;i<32;i++){ const a = i/32*Math.PI*2; rbox(CORE_FIXED, 0.8, 0.06, 0.05, MAT.black, 2.05, a, 0.62, 'DeckRib'); }
// red radial energy channels (lit during activation, exposed when the modules slide out)
const CHAN = [...CN, ...DG].map((a, i) => { const m = rbox(CORE_FIXED, i < 4 ? 2.3 : 1.1, 0.02, 0.07, RED.line.clone(), i < 4 ? 2.5 : 2.0, a, 0.615, 'EnergyChannel'); m.castShadow = false; return m; });
// radial modules: gray housing + black inset + red strip + twin bronze actuators; each rides a rail and a hydraulic ram
function radialModule(a, big, idx){ const L = big ? 2.35 : 1.15, W = big ? 0.86 : 0.56, r0 = big ? 1.42 : 1.48, H = big ? 0.66 : 0.5;
  const base = grp(CORE_FIXED, 'RadialModule_' + idx); base.rotation.y = a;   // local +x = outward
  [-1, 1].forEach(s => box(base, L + 0.4, 0.04, 0.06, MAT.steel, r0 + L/2 + 0.1, 0.63, s*(W/2 - 0.08), 'Rail'));
  const S = grp(base, 'Slide');
  box(S, L, H, W, MAT.ceramic, r0 + L/2, 0.62 + H/2 + 0.03, 0, 'Housing');
  box(S, L - 0.25, 0.04, W - 0.3, MAT.black, r0 + L/2 + 0.05, 0.62 + H + 0.04, 0, 'TopInset');
  box(S, L - 0.45, 0.02, 0.06, RED.line, r0 + L/2 + 0.05, 0.62 + H + 0.07, 0, 'TopRedStrip');
  box(S, 0.06, H*0.6, W*0.7, MAT.black, r0 - 0.02, 0.62 + H/2 + 0.03, 0, 'NoseFace'); box(S, 0.03, 0.06, W*0.5, RED.ring, r0 - 0.05, 0.62 + H/2 + 0.05, 0, 'NoseGlow');
  [-1, 1].forEach(s => { const z = s*(W/2 + 0.09); add(S, cylGeo(big ? 0.11 : 0.08, L*0.62, 16).rotateZ(Math.PI/2), MAT.bronze, r0 + L*0.45, 0.62 + H*0.55, z, 'Actuator');
    add(S, cylGeo(big ? 0.125 : 0.095, 0.08, 16).rotateZ(Math.PI/2), MAT.black, r0 + L*0.14, 0.62 + H*0.55, z); add(S, cylGeo(big ? 0.125 : 0.095, 0.08, 16).rotateZ(Math.PI/2), MAT.black, r0 + L*0.76, 0.62 + H*0.55, z);
    add(S, cylGeo(0.045, L*0.3, 10).rotateZ(Math.PI/2), MAT.steel, r0 + L*0.9, 0.62 + H*0.55, z); });
  if (big){ box(S, 0.3, 0.12, 0.3, MAT.frame, r0 + L - 0.35, 0.62 + H + 0.1, 0, 'TopBlock'); box(S, 0.06, 0.05, 0.2, RED.pip, r0 + L - 0.52, 0.62 + H + 0.12, 0); }
  return {S, r0, L, big}; }
const RMOD = [...CN.map((a, i) => radialModule(a, true, i)), ...DG.map((a, i) => radialModule(a, false, i + 4))];

// =====================================================================================================================
// CORE — lift → rotor (target rings) → inner tick ring · lens. Locked by 4 pins until the lift completes
// =====================================================================================================================
const CORE_LIFT = grp(ROOT, 'CORE_LIFT');
add(CORE_FIXED, cylGeo(1.4, 0.1, 64), MAT.black, 0, -0.05, 0, 'Core_WellFloor');
{ const w = add(CORE_FIXED, new THREE.CylinderGeometry(1.4, 1.4, 0.7, 64, 1, true), MAT.frame.clone(), 0, 0.3, 0, 'Core_WellWall'); w.material.side = THREE.DoubleSide; }
const CORE_ROTOR = grp(CORE_LIFT, 'CORE_ROTOR');
add(CORE_ROTOR, cylGeo(1.32, 0.12, 64), MAT.black, 0, 0.0, 0, 'Rotor_Disc');
add(CORE_ROTOR, ring(1.08, 1.32, 0.1, 0.02), MAT.gun, 0, 0.06, 0, 'Rotor_OuterBand');
for (let i=0;i<24;i++){ const a = i/24*Math.PI*2; rbox(CORE_ROTOR, 0.12, 0.03, 0.04, i%6 ? MAT.steel : RED.pip, 1.2, a, 0.17, 'Tick'); }
const glowA = add(CORE_ROTOR, new THREE.TorusGeometry(1.0, 0.03, 8, 128), RED.ring, 0, 0.12, 0, 'Core_GlowRing_A'); glowA.rotation.x = Math.PI/2; glowA.castShadow = false;
const CORE_INNER = grp(CORE_ROTOR, 'CORE_INNER_Ring');
add(CORE_INNER, ring(0.62, 0.9, 0.1, 0.015), MAT.black, 0, 0.06, 0, 'RingB');
for (let i=0;i<12;i++){ const a = i/12*Math.PI*2; rbox(CORE_INNER, 0.2, 0.025, 0.035, RED.line, 0.76, a, 0.165, 'RingB_Tick'); }
const glowB = add(CORE_INNER, new THREE.TorusGeometry(0.56, 0.022, 8, 96), RED.ring, 0, 0.12, 0, 'Core_GlowRing_B'); glowB.rotation.x = Math.PI/2; glowB.castShadow = false;
const lensCore = add(CORE_ROTOR, cylGeo(0.26, 0.06, 48), RED.core, 0, 0.13, 0, 'Lens_Emitter'); lensCore.castShadow = false;
const lensRing = add(CORE_ROTOR, new THREE.TorusGeometry(0.36, 0.018, 8, 64), RED.ring, 0, 0.14, 0); lensRing.rotation.x = Math.PI/2;
// crosshair hairlines over the target (reference: thin red cross through the core)
const cross = grp(CORE_ROTOR, 'Core_Crosshair');
[0, Math.PI/2].forEach(r => { const m = box(cross, 2.2, 0.008, 0.02, RED.line, 0, 0.18, 0); m.rotation.y = r; m.castShadow = false; });
const CLOCK = [22.5, 112.5, 202.5, 292.5].map(d => { const g = grp(CORE_FIXED, 'CoreLock'); g.rotation.y = d*D2;
  box(g, 0.24, 0.2, 0.26, MAT.frame, 1.55, 0.72, 0, 'LockHousing'); box(g, 0.04, 0.05, 0.12, RED.pip, 1.68, 0.8, 0);
  return add(g, cylGeo(0.04, 0.3, 10).rotateZ(Math.PI/2), MAT.bronze, 1.5, 0.66, 0, 'LockPin'); });
const RAMS = [30, 150, 270].map(d => { const a = d*D2; const sl = add(CORE_FIXED, cylGeo(0.09, 0.3, 12), MAT.black); sl.position.copy(P(0.95, a, 0.1));
  const r = add(CORE_FIXED, cylGeo(0.055, 1, 10), MAT.steel); return {a, r}; });
const coreLight = new THREE.PointLight(0xff3020, 6, 9, 1.6); coreLight.position.set(0, 1.2, 0); CORE_LIFT.add(coreLight);
const Y_CORE0 = 0.12, CORE_RISE = 0.52;

// =====================================================================================================================
// STATE: activation timeline + independent spins
// =====================================================================================================================
const S = {p: 0, dir: 0, rate: 1, dur: 4.5, freeze: false, view: 'q34', repair: -1,
  spin: {core: {on: true, k: 1, ang: 0, v: 0}, coreIn: {on: true, k: 1, ang: 0, v: 0}, inner: {on: true, k: 1, ang: 0, v: 0}, outer: {on: true, k: 1, ang: 0, v: 0}}};
const SPD = {core: [0.25, 1.1], coreIn: [-0.4, -1.8], inner: [-0.05, -0.28], outer: [0.03, 0.12]};
const seg = (a, b) => sm(clamp((S.p - a)/(b - a)));
const stateName = () => S.p <= 0.001 ? 'IDLE · STANDBY' : S.p >= 0.999 ? 'ACTIVATION · SYNC READY' : 'ACTIVATION';
const STEPS = ['코어 에너지 상승', '외곽 패널 분리', '내부 모듈 전개', '에너지 라인 활성화', '코어 상승 및 고정'];
const stepOf = () => S.p <= 0.001 ? -1 : S.p < 0.15 ? 0 : S.p < 0.4 ? 1 : S.p < 0.6 ? 2 : S.p < 0.78 ? 3 : 4;

function applyPose(){
  // ① core energy rises
  const glow = 0.2 + 0.5*seg(0, 0.15) + 0.3*seg(0.78, 1);
  RED.core.emissiveIntensity = 1 + glow*5; RED.ring.emissiveIntensity = 0.6 + glow*2.6; coreLight.intensity = 1 + glow*8;
  // ② outer panel separation: each block lifts + steps out on two pistons, staggered round the ring
  OBLK.forEach((pv, i) => { const k = seg(0.12 + i*0.006, 0.3 + i*0.006), am = pv.userData.am, d = 0.14*k;
    pv.position.set(Math.cos(am)*d, 0.16*k, -Math.sin(am)*d);
    pv.userData.rods.forEach(r => { const top = O_Y0 + pv.position.y, bot = O_Y0 - 0.12, h = Math.max(0.02, top - bot);
      r.position.copy(r.userData.pos).add(new THREE.Vector3(Math.cos(am)*d*0.5, bot + h/2, -Math.sin(am)*d*0.5)); r.scale.y = h; r.visible = k > 0.02; }); });
  ledgeGlow.material.emissiveIntensity = 0.2 + 2.2*seg(0.15, 0.4);
  // ③ inner modules deploy: radial modules slide out on their rails (rams extend), middle blocks lift in alternation
  RMOD.forEach((M, i) => { const k = seg(0.38 + (i%4)*0.02 + (M.big ? 0 : 0.05), 0.58 + (i%4)*0.02), d = (M.big ? 0.42 : 0.3)*k;
    M.S.position.set(d, 0.08*k, 0);
 });
  IBLK.forEach((b, i) => { const k = seg(0.42 + (i%2)*0.04, 0.6 + (i%2)*0.04); b.position.y = (i%2 ? 0.18 : 0.09)*k; });
  // ④ energy lines: radial channels, then the arcs
  CHAN.forEach((m, i) => { m.material.emissiveIntensity = 0.15 + 2.4*seg(0.58 + (i%4)*0.02, 0.72 + (i%4)*0.02); });
  // ⑤ core rises and locks: pins out → lift → pins back in under the raised rotor
  const pinsOut = seg(0.74, 0.8), rise = seg(0.78, 0.92), pinsIn = seg(0.92, 1);
  CLOCK.forEach(pin => pin.position.x = 1.5 + 0.22*pinsOut - 0.22*pinsIn);
  CORE_LIFT.position.y = Y_CORE0 + CORE_RISE*rise;
  RAMS.forEach(R => { const top = CORE_LIFT.position.y - 0.06, bot = 0.1, h = Math.max(0.05, top - bot); R.r.scale.y = h; R.r.position.copy(P(0.95, R.a, bot + h/2)); });
  RED.flow.emissiveIntensity = 0.6 + 1.8*seg(0.05, 0.3);
}
function spinStep(dt){ const dep = sm(clamp(S.p));
  for (const k in S.spin){ const s = S.spin[k], target = s.on ? lerp(SPD[k][0], SPD[k][1], dep)*s.k : 0; s.v += (target - s.v)*Math.min(1, dt*1.6); s.ang += s.v*dt; }
  OUTER.rotation.y = S.spin.outer.ang; BALLS.rotation.y = S.spin.outer.ang*0.5; INNER.rotation.y = S.spin.inner.ang; CORE_ROTOR.rotation.y = S.spin.core.ang; CORE_INNER.rotation.y = S.spin.coreIn.ang;
  drives.forEach(d => { const ang = (d.ring === 'outer' ? S.spin.outer.ang : S.spin.inner.ang)*d.ratio; d.pin.rotation.y = ang; if (d.cpl !== d.pin) d.cpl.rotation.y = ang; });
  RED.flow.emissiveMap.offset.x -= dt*(0.2 + 1.4*sm(clamp(S.p/0.3))); }

// ---------------- post + resize ----------------
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.3, 1.0); composer.addPass(bloom); composer.addPass(new OutputPass());
function resize(){ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage); resize();
const VIEWS = {q34: [[0, 15.5, 19.5], [0, 0.2, 0.5]], top: [[0, 28, 0.01], [0, 0, 0]], low: [[0, 4.2, 25], [0, 0.6, 0]], core: [[0, 6.8, 5.2], [0, 0.8, 0]]};
let camTween = null;
function setView(v){ S.view = v; const [pos, tgt] = VIEWS[v]; const fit = camera.aspect < 1 ? 1.65 : 1;
  camTween = {t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos).multiplyScalar(v === 'core' ? Math.sqrt(fit) : fit), t1: new THREE.Vector3(...tgt)}; syncUI(); }
camera.position.set(...VIEWS.q34[0]).multiplyScalar(camera.aspect < 1 ? 1.65 : 1); controls.target.set(...VIEWS.q34[1]); controls.update();

// ---------------- UI ----------------
function play(d){ S.dir = d; syncUI(); }
function syncUI(){
  document.querySelectorAll('[data-a="deploy"]').forEach(b => b.setAttribute('aria-pressed', String(S.dir > 0)));
  document.querySelectorAll('[data-a="fold"]').forEach(b => b.setAttribute('aria-pressed', String(S.dir < 0)));
  document.querySelectorAll('[data-a="slow"]').forEach(b => b.setAttribute('aria-pressed', String(S.rate < 1)));
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  document.querySelectorAll('[data-spin]').forEach(b => b.setAttribute('aria-pressed', String(S.spin[b.dataset.spin].on)));
  const st = stepOf(); document.querySelectorAll('#steps li').forEach((li, i) => li.classList.toggle('on', i <= st)); }
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
  if (a === 'deploy') play(1); else if (a === 'fold') play(-1); else if (a === 'toggle') play(S.p > 0.5 ? -1 : 1);
  else if (a === 'pause') { S.dir = 0; syncUI(); } else if (a === 'slow') { S.rate = S.rate < 1 ? 1 : 0.25; syncUI(); }
  else if (b.dataset.phase) { S.p = b.dataset.phase === 'IDLE' ? 0 : 1; S.dir = 0; applyPose(); syncUI(); }
  else if (b.dataset.view) setView(b.dataset.view);
  else if (b.dataset.spin) { const s = S.spin[b.dataset.spin]; s.on = !s.on; syncUI(); } });
const scrub = $('scrub'); scrub.addEventListener('input', () => { S.p = +scrub.value/1000; S.dir = 0; applyPose(); syncUI(); });
document.querySelectorAll('input[data-k]').forEach(inp => inp.addEventListener('input', () => { S.spin[inp.dataset.k].k = +inp.value; $('v_' + inp.dataset.k).textContent = (+inp.value).toFixed(1) + '×'; }));
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); if (S.dir) { S.dir = 0; syncUI(); } else play(S.p > 0.5 ? -1 : 1); }
  else if (k === 'd') play(1); else if (k === 'f') play(-1); else if (k === 's') { S.rate = S.rate < 1 ? 1 : 0.25; syncUI(); } });

// ---------------- loop ----------------
let last = performance.now(), lastStep = -2;
function frame(now){ requestAnimationFrame(frame);
  const dt = S.freeze ? 0 : clamp((now - last)/1000, 0, 0.05); last = now;
  if (S.dir){ S.p = clamp(S.p + S.dir*dt*S.rate/S.dur); if (S.p === 0 || S.p === 1){ S.dir = 0; syncUI(); } }
  spinStep(dt); applyPose();
  if (camTween){ camTween.t = Math.min(1, camTween.t + dt*1.6); const k = sm(camTween.t); camera.position.lerpVectors(camTween.p0, camTween.p1, k); controls.target.lerpVectors(camTween.t0, camTween.t1, k); if (camTween.t >= 1) camTween = null; }
  controls.update();
  const st = stepOf(); if (st !== lastStep){ lastStep = st; syncUI(); }
  $('state').textContent = 'HEART TAG · ' + stateName() + ' · CORE POWER ' + Math.round(20 + 80*S.p) + '%';
  if (document.activeElement !== scrub) scrub.value = Math.round(S.p*1000);
  composer.render(); }
applyPose(); syncUI(); requestAnimationFrame(frame);

window.__ht31 = {S, OUTER, INNER, CORE_ROTOR, CORE_INNER, CORE_LIFT, RMOD, setView, play, applyPose, freeze: v => { S.freeze = v; },
  angles: () => ({outer: OUTER.rotation.y, inner: INNER.rotation.y, core: CORE_ROTOR.rotation.y, coreIn: CORE_INNER.rotation.y}),
  mesh: () => { let n = 0; ROOT.traverse(o => { if (o.isMesh) n++; }); return n; }};
