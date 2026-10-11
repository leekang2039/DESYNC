// DS-01 modular weapon v1 — source. Built into DESYNC_DS01_Modular_v1.html (three.js inlined) by `node src/build.mjs ds01`.
// Only the grip + trigger group is fixed. Everything above it is a pool of 17 armoured modules (DS-01 language: white
// chipped ceramic plates with hexagonal chamfers over a black frame, orange light rings and slits). Each form is a pose
// of the same pool; switching lifts the modules apart, spins them and re-seats them (Control-style), staggered.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const fail = msg => { $('err').textContent = msg; $('fallback').hidden = false; $('fallback').textContent = msg; };
const D2R = Math.PI/180, clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a)*k;
const ease = k => k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({canvas: $('c'), antialias: true}); }
catch (e) { fail('WebGL을 시작할 수 없어요. 하드웨어 가속을 켠 브라우저(Chrome/Edge)에서 열어 주세요.'); throw e; }
const cv = $('c'), stage = cv.parentElement;
renderer.setPixelRatio(Math.min(1.75, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1d21); scene.fog = new THREE.FogExp2(0x1a1d21, 0.35);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(30, 1, 0.005, 40); scene.add(camera);
scene.add(new THREE.HemisphereLight(0xc9d6e0, 0x101215, 0.45));
const key = new THREE.DirectionalLight(0xfff4ea, 1.7); key.position.set(1.2, 2.4, 1.6); scene.add(key);
const rim = new THREE.DirectionalLight(0xa8c2dc, 0.8); rim.position.set(-1.5, 0.8, -1.2); scene.add(rim);
const warm = new THREE.PointLight(0xff8a3a, 0.6, 1.4, 2); warm.position.set(0.25, 1.15, -0.25); scene.add(warm);

// ---------------- studio plinth ----------------
const G0 = new THREE.Vector3(0, 1.2, 0);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.215, 0.025, 64), new THREE.MeshStandardMaterial({color: 0x2a2e33, roughness: .35, metalness: .7}));
plinth.position.set(0, 1.0, -0.06); scene.add(plinth);
const plinthTop = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.004, 64), new THREE.MeshStandardMaterial({color: 0x3a3f45, roughness: .25, metalness: .85}));
plinthTop.position.set(0, 1.0145, -0.06); scene.add(plinthTop);
const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({color: 0x15171a, roughness: .9}));
floor.rotation.x = -Math.PI/2; floor.position.y = 0.987; scene.add(floor);

// ---------------- materials: DS-01 language ----------------
const grungeT = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, 512, 512); let s = 11; const r = () => (s = (s*16807) % 2147483647)/2147483647;
  for (let i=0;i<7000;i++){ const v = 205 + r()*50 | 0; g.fillStyle = `rgba(${v},${v},${v},0.35)`; g.fillRect(r()*512, r()*512, 1 + r()*2, 1 + r()*2); }
  for (let i=0;i<120;i++){ g.fillStyle = `rgba(40,40,42,${0.35 + r()*0.5})`; const x = r()*512, y = r()*512, w = 2 + r()*9, h = 1 + r()*4; g.fillRect(x, y, w, h); }   // paint chips
  for (let i=0;i<80;i++){ g.strokeStyle = `rgba(110,110,110,${0.15 + r()*0.25})`; g.lineWidth = 0.7; g.beginPath(); const x = r()*512, y = r()*512, a = r()*Math.PI*2, L = 10 + r()*40; g.moveTo(x, y); g.lineTo(x + Math.cos(a)*L, y + Math.sin(a)*L); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const M = {
  white: new THREE.MeshPhysicalMaterial({color: 0xd6d9dc, map: grungeT, roughness: .48, metalness: .05, clearcoat: .35, clearcoatRoughness: .4}),
  black: new THREE.MeshStandardMaterial({color: 0x191c20, roughness: .55, metalness: .45}),
  gun:   new THREE.MeshStandardMaterial({color: 0x3c4148, roughness: .3, metalness: .85}),
  copper:new THREE.MeshStandardMaterial({color: 0xb5713a, roughness: .28, metalness: .95}),
  glass: new THREE.MeshPhysicalMaterial({color: 0xffc89a, roughness: .05, metalness: 0, transparent: true, opacity: .28, clearcoat: 1, depthWrite: false}),
  void:  new THREE.MeshPhysicalMaterial({color: 0x020203, roughness: .08, metalness: .2, clearcoat: 1}),
  glow:  new THREE.MeshBasicMaterial({color: 0xff7a1a, toneMapped: false}),
  glowS: new THREE.MeshBasicMaterial({color: 0xff9a40, toneMapped: false}),
};
const GLOW_BASE = new THREE.Color(0xff7a1a);

// ---------------- geometry helpers ----------------
const add = (par, geo, mat, x=0, y=0, z=0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); par.add(m); return m; };
const rbox = (w, h, d, r=0.0025) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w/2.2, h/2.2, d/2.2));
// hexagonal-chamfer side plate (length along z, height along y), extruded outward along x
function plateGeo(len, h, cf=0.008, cb=0.006, t=0.0024){
  const s = new THREE.Shape(), L = len/2, H = h/2;
  s.moveTo(-L + cb, -H); s.lineTo(L, -H); s.lineTo(L, H - cf); s.lineTo(L - cf, H); s.lineTo(-L, H); s.lineTo(-L, -H + cb); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: t, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1});
  g.rotateY(Math.PI/2);   // shape x (length) → −z, extrusion → +x
  return g; }
function sidePlates(g, len, h, w, {cf, cb, inset=true, stripe=false, stripeY=-0.35} = {}){
  [-1, 1].forEach(sx => {
    const p = add(g, plateGeo(len*0.92, h*0.84, cf, cb), M.white, sx > 0 ? w/2 : -w/2 - 0.0024, 0, 0); if (sx < 0) { p.scale.x = -1; p.position.x = -w/2; }
    if (inset) add(g, new THREE.BoxGeometry(0.0008, h*0.08, len*0.5), M.black, sx*(w/2 + 0.0026), h*0.18, len*0.04);
    if (stripe) add(g, new THREE.BoxGeometry(0.0008, 0.0016, len*0.42), M.glow, sx*(w/2 + 0.0027), h*stripeY, -len*0.1); }); }
const W = 0.032;   // body width
function armored(len, h, opts = {}){ const g = new THREE.Group();
  add(g, rbox(W, h, len), M.black);
  sidePlates(g, len, h, W, opts);
  if (opts.window){ [-1, 1].forEach(sx => { add(g, new THREE.BoxGeometry(0.001, h*0.32, len*0.55), M.glow, sx*(W/2 + 0.0028), -h*0.12, 0);
    add(g, new THREE.BoxGeometry(0.0012, h*0.42, len*0.62), M.black, sx*(W/2 + 0.002), -h*0.12, 0); }); }
  if (opts.top) add(g, rbox(W*0.7, 0.003, len*0.8, 0.001), M.white, 0, h/2 + 0.0012, 0);
  if (opts.vents) for (let i=0;i<4;i++) [-1, 1].forEach(sx => add(g, new THREE.BoxGeometry(0.0008, h*0.36, 0.0018), M.black, sx*(W/2 + 0.0027), h*0.06, -len*0.22 + i*0.0045));
  return g; }
function muzzle(h, ringR){ const g = new THREE.Group(), len = 0.03;
  add(g, rbox(W + 0.003, h, len, 0.003), M.black);
  sidePlates(g, len*0.8, h*0.7, W + 0.003, {cf: 0.004, cb: 0.003, inset: false});
  const ring = add(g, new THREE.TorusGeometry(ringR, 0.0026, 10, 40), M.glow, 0, 0, -len/2 - 0.0008);
  add(g, new THREE.CircleGeometry(ringR - 0.002, 32).rotateY(Math.PI), M.void, 0, 0, -len/2 - 0.0005);
  [-1, 1].forEach(sx => add(g, new THREE.BoxGeometry(0.0009, h*0.45, 0.002), M.glow, sx*(W/2 + 0.0035), 0, len*0.25));
  return g; }
function rail(len){ const g = new THREE.Group(); add(g, rbox(W*0.62, 0.006, len, 0.0015), M.black);
  const n = Math.floor(len/0.008), tg = new THREE.BoxGeometry(W*0.58, 0.004, 0.0035), im = new THREE.InstancedMesh(tg, M.gun, n), o = new THREE.Object3D();
  for (let i=0;i<n;i++){ o.position.set(0, 0.004, -len/2 + 0.004 + i*0.008); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im);
  add(g, new THREE.BoxGeometry(0.004, 0.0015, 0.016), M.glow, 0, 0.0035, len*0.38);
  return g; }
function gill(){ const g = new THREE.Group(); const p = add(g, plateGeo(0.046, 0.02, 0.007, 0.005, 0.003), M.white, -0.0015, 0, 0);
  add(g, new THREE.BoxGeometry(0.004, 0.0016, 0.032), M.glow, 0.0004, -0.006, 0); add(g, new THREE.BoxGeometry(0.004, 0.0035, 0.012), M.black, 0.0004, 0.004, 0.01); return g; }
function capsule(){ const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.0125, 0.0125, 0.042, 28, 1, true).rotateX(Math.PI/2), M.glass);
  add(g, new THREE.CylinderGeometry(0.0065, 0.0065, 0.038, 20).rotateX(Math.PI/2), M.glowS);
  for (let i=0;i<5;i++) add(g, new THREE.TorusGeometry(0.0085, 0.0007, 6, 24), M.glow, 0, 0, -0.015 + i*0.0075);
  [-1, 1].forEach(s => add(g, new THREE.CylinderGeometry(0.0145, 0.0145, 0.006, 24).rotateX(Math.PI/2), M.gun, 0, 0, s*0.024));
  return g; }
function coil(){ const g = new THREE.Group(); add(g, new THREE.TorusGeometry(0.0145, 0.0034, 12, 40), M.copper); add(g, new THREE.TorusGeometry(0.0105, 0.0012, 8, 40), M.glow, 0, 0, -0.002); return g; }
function core(){ const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(0.0055, 0.0055, 0.12, 18).rotateX(Math.PI/2), M.gun);
  for (let i=0;i<6;i++) add(g, new THREE.CylinderGeometry(0.0068, 0.0068, 0.004, 18).rotateX(Math.PI/2), M.black, 0, 0, -0.05 + i*0.02); return g; }
function voidOrb(){ const g = new THREE.Group(); add(g, new THREE.SphereGeometry(0.013, 32, 20), M.void); add(g, new THREE.TorusGeometry(0.0138, 0.0011, 8, 48), M.glow);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.014, 0.024, 48), new THREE.MeshBasicMaterial({color: 0xff7a1a, transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false})); g.add(halo); return g; }
function labelPlate(len, h){ const g = armored(len, h, {cf: 0.01, cb: 0.006, top: true});
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#1b1d20'; x.font = '700 64px "Share Tech Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DS-01', 128, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  [-1, 1].forEach(sx => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.0112), new THREE.MeshBasicMaterial({map: t, transparent: true})); p.position.set(sx*(W/2 + 0.0027), h*0.12, 0); p.rotation.y = sx*Math.PI/2; g.add(p); });
  return g; }
function rearBlock(len, h){ const g = armored(len, h, {cf: 0.012, cb: 0.004, stripe: true, stripeY: 0.3});
  add(g, new THREE.TorusGeometry(0.0085, 0.0022, 10, 36), M.glow, 0, 0.004, len/2 + 0.0008); add(g, new THREE.CircleGeometry(0.0062, 28), M.glowS, 0, 0.004, len/2 + 0.0009);
  [-1, 1].forEach(sx => { add(g, new THREE.TorusGeometry(0.0055, 0.0015, 8, 28).rotateY(Math.PI/2), M.glow, sx*(W/2 + 0.003), 0.006, len*0.18); });
  return g; }

// ---------------- fixed: grip + trigger + lower frame ----------------
const gun = new THREE.Group(); gun.position.copy(G0); scene.add(gun);
const body = new THREE.Group(); gun.add(body);
{ const s = new THREE.Shape(); s.moveTo(-0.004, 0.0); s.lineTo(0.052, 0.0); s.lineTo(0.06, -0.03); s.lineTo(0.066, -0.098); s.quadraticCurveTo(0.064, -0.112, 0.048, -0.114);
  s.lineTo(0.022, -0.114); s.quadraticCurveTo(0.012, -0.112, 0.012, -0.1); s.lineTo(0.004, -0.03); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {depth: 0.028, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0016, bevelSegments: 2}); geo.translate(0, 0, -0.014); geo.rotateY(-Math.PI/2);
  const grip = add(body, geo, M.black, 0, -0.006, 0);   // shape x → +z (rear), y down
  // white side plates on the grip
  [-1, 1].forEach(sx => { const ps = new THREE.Shape(); ps.moveTo(0.016, -0.03); ps.lineTo(0.05, -0.03); ps.lineTo(0.058, -0.085); ps.lineTo(0.03, -0.1); ps.lineTo(0.02, -0.06); ps.closePath();
    const pg = new THREE.ExtrudeGeometry(ps, {depth: 0.002, bevelEnabled: false}); pg.rotateY(-Math.PI/2); const m = add(body, pg, M.black, sx > 0 ? 0.0178 : -0.0156, -0.006, 0); m.material = M.gun;
    add(body, new THREE.BoxGeometry(0.0012, 0.05, 0.0022), M.glow, sx*0.0166, -0.07, 0.0635).rotation.x = -0.12; }); }
{ const s = new THREE.Shape(); s.moveTo(0.0, 0.0); s.lineTo(-0.052, 0.0); s.lineTo(-0.056, -0.008); s.quadraticCurveTo(-0.05, -0.034, -0.026, -0.036); s.lineTo(0.0, -0.034); s.closePath();
  const h = new THREE.Path(); h.moveTo(-0.008, -0.006); h.lineTo(-0.044, -0.006); h.quadraticCurveTo(-0.042, -0.026, -0.024, -0.028); h.lineTo(-0.008, -0.026); h.closePath(); s.holes.push(h);
  const geo = new THREE.ExtrudeGeometry(s, {depth: 0.018, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0012, bevelSegments: 2}); geo.translate(0, 0, -0.009); geo.rotateY(-Math.PI/2);
  add(body, geo, M.black, 0, -0.006, 0.004);
  const trig = add(body, rbox(0.004, 0.016, 0.005, 0.0015), M.gun, 0, -0.016, -0.018); trig.rotation.x = 0.25;
  for (let i=0;i<4;i++) add(body, new THREE.BoxGeometry(0.0035, 0.0018, 0.0025), M.glow, 0, -0.012 - i*0.004, -0.04); }
add(body, rbox(W*0.9, 0.024, 0.075, 0.002), M.black, 0, 0.005, 0.025);   // lower frame rail joining the grip

// ---------------- module pool ----------------
const MOD = {};   // id → {obj, base pose}
const def = (id, obj, label) => { body.add(obj); MOD[id] = {obj, label}; };
def('RB', rearBlock(0.06, 0.05), '후면 블록');
def('RT', labelPlate(0.06, 0.05), 'DS-01 판');
def('UB', armored(0.06, 0.05, {window: true, cf: 0.006, cb: 0.01}), '상단 중앙');
def('UA', armored(0.06, 0.05, {vents: true, stripe: true, cf: 0.012, cb: 0.005}), '상단 전방');
def('LB', armored(0.07, 0.028, {stripe: true, stripeY: 0.1, cf: 0.006, cb: 0.008}), '하단 후방');
def('LA', armored(0.06, 0.028, {window: true, cf: 0.008, cb: 0.004}), '하단 전방');
def('MU', muzzle(0.05, 0.0135), '총구 위');
def('ML', muzzle(0.028, 0.0075), '총구 아래');
def('RL', rail(0.22), '상단 레일');
['G1', 'G2', 'G3', 'G4'].forEach((id, i) => def(id, gill(), '아가미 판 ' + (i + 1)));
def('CP', capsule(), '에너지 캡슐');
def('C1', coil(), '코일 A'); def('C2', coil(), '코일 B');
def('BR', core(), '총열 코어');
def('VO', voidOrb(), '보이드 코어');
const IDS = Object.keys(MOD);

// pose helper: position, euler degrees, scale
const Q = (rx=0, ry=0, rz=0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rx*D2R, ry*D2R, rz*D2R, 'XYZ'));
const P = (x, y, z, rx=0, ry=0, rz=0, s=1) => ({p: new THREE.Vector3(x, y, z), q: Q(rx, ry, rz), s: new THREE.Vector3().setScalar(1).multiplyScalar(1).fromArray(Array.isArray(s) ? s : [s, s, s])});
const YU = 0.042, YL = 0.004;   // upper / lower stack centre heights
// gill side positions (x = ±(W/2 + plate)), flush in the pistol
const gx = W/2 + 0.0026;
const PISTOL = {
  RB: P(0, YU, 0.045), RT: P(0, YU, -0.015), UB: P(0, YU, -0.075), UA: P(0, YU, -0.135), MU: P(0, YU, -0.18),
  LB: P(0, YL, -0.08), LA: P(0, YL, -0.145), ML: P(0, YL, -0.18),
  RL: P(0, YU + 0.028, -0.055),
  G1: P(gx, YU - 0.004, -0.13), G2: P(-gx, YU - 0.004, -0.13, 0, 180), G3: P(gx, YL + 0.001, -0.1), G4: P(-gx, YL + 0.001, -0.1, 0, 180),
  CP: P(0, YU, -0.075, 0, 0, 0, 0.8), C1: P(0, YU, -0.12, 0, 0, 0, 0.7), C2: P(0, YU, -0.15, 0, 0, 0, 0.7), BR: P(0, YU, -0.12, 0, 0, 0, 0.9), VO: P(0, YU, 0.045, 0, 0, 0, 0.5),
};
const F = (over) => Object.assign({}, PISTOL, over);
const FORMS = [
  {id: 'PISTOL', name: 'DS-01 · 권총', desc: '기본 지급 형태. 상단 슬라이드와 하단 총열이 겹친 2단 구조, 코어·코일·캡슐은 내부에 수납', pose: PISTOL},
  {id: 'LANCE', name: 'LANCE · 관통', desc: '하단이 위로 합류하고 모듈이 일렬로 늘어서 긴 창형 총열. 가운데서 에너지 캡슐과 코일 2개가 드러나고, 아가미 판은 상단 핀으로 섬', pose: F({
    RB: P(0, YU, 0.055), RT: P(0, YU, -0.005), UB: P(0, YU, -0.065), CP: P(0, YU - 0.004, -0.122), C1: P(0, YU - 0.004, -0.102), C2: P(0, YU - 0.004, -0.142),
    BR: P(0, YU - 0.004, -0.13, 0, 0, 0, [1, 1, 1.5]), UA: P(0, YU, -0.19), MU: P(0, YU, -0.235, 0, 0, 0, [1, 0.8, 1.4]),
    LB: P(0, YL + 0.004, -0.06), LA: P(0, YL + 0.006, -0.19, 0, 0, 0, [0.9, 0.9, 1]), ML: P(0, YL + 0.006, -0.232, 0, 0, 0, [0.9, 0.9, 1.3]),
    RL: P(0, YU + 0.03, -0.09, 0, 0, 0, [1, 1, 1.3]),
    G1: P(0.006, YU + 0.036, -0.185, 0, 0, -78), G2: P(-0.006, YU + 0.036, -0.185, 0, 180, -78), G3: P(0.006, YU + 0.036, -0.215, 0, 0, -78, 0.8), G4: P(-0.006, YU + 0.036, -0.215, 0, 180, -78, 0.8)})},
  {id: 'TWIN', name: 'TWIN · 산탄', desc: '상단과 하단이 위아래로 크게 벌어져 굵은 이중 총열. 총구가 커지고 코일이 각 총구 링이 되며, 아가미 판이 열 차폐판처럼 바깥으로 펼쳐짐', pose: F({
    UA: P(0, YU + 0.012, -0.125), UB: P(0, YU + 0.006, -0.068), MU: P(0, YU + 0.012, -0.165, 0, 0, 0, [1.15, 1.1, 1.2]),
    LB: P(0, YL - 0.014, -0.075, 0, 0, 0, [1, 1.35, 1]), LA: P(0, YL - 0.016, -0.13, 0, 0, 0, [1, 1.45, 1]), ML: P(0, YL - 0.016, -0.165, 0, 0, 0, [1.15, 1.5, 1.2]),
    C1: P(0, YU + 0.012, -0.184, 0, 0, 0, 1.15), C2: P(0, YL - 0.016, -0.184, 0, 0, 0, 1.0),
    G1: P(0.03, YU + 0.006, -0.125, 0, 50, 0), G2: P(-0.03, YU + 0.006, -0.125, 0, 130, 0), G3: P(0.03, YL - 0.016, -0.12, 0, 50, 0), G4: P(-0.03, YL - 0.016, -0.12, 0, 130, 0),
    RL: P(0, YU + 0.042, -0.06, 0, 0, 0, [1, 1, 0.8])})},
  {id: 'CANNON', name: 'CANNON · 런처', desc: '전방 모듈이 축 둘레로 모여 짧고 굵은 포신. 측면 모듈이 90° 돌아 포신 벽이 되고, 코일 2개가 큰 총구 링으로 앞에 섬', pose: F({
    UA: P(0, YU + 0.026, -0.12, 0, 0, 0, [1.1, 0.5, 1]), LA: P(0, YL - 0.012, -0.12, 0, 0, 0, [1.1, 0.9, 1]),
    UB: P(0.028, (YU + YL)/2 + 0.007, -0.12, 0, 0, 90, [1, 0.62, 1]), LB: P(-0.028, (YU + YL)/2 + 0.007, -0.12, 0, 0, -90, [1, 1.1, 0.86]),
    C1: P(0, (YU + YL)/2 + 0.007, -0.158, 0, 0, 0, 2.0), C2: P(0, (YU + YL)/2 + 0.007, -0.174, 0, 0, 0, 1.75),
    CP: P(0, (YU + YL)/2 + 0.007, -0.12, 0, 0, 0, 1.1), BR: P(0, (YU + YL)/2 + 0.007, -0.11, 0, 0, 0, [3, 3, 0.5]),
    MU: P(0, YU + 0.03, -0.165, 0, 0, 0, [1.1, 0.4, 0.6]), ML: P(0, YL - 0.016, -0.165, 0, 0, 0, [1.1, 0.7, 0.6]),
    G1: P(0.036, YU + 0.02, -0.1, 0, 30, 20), G2: P(-0.036, YU + 0.02, -0.1, 0, 150, 20), G3: P(0.036, YL - 0.006, -0.1, 0, 30, -20), G4: P(-0.036, YL - 0.006, -0.1, 0, 150, -20),
    RL: P(0, YU + 0.03, -0.03, 0, 0, 0, [1, 1, 0.5])})},
  {id: 'COIL', name: 'COIL · 에너지', desc: '전방 상·하단이 조개처럼 벌어지고 그 사이에 에너지 캡슐·코일·총열 코어가 일렬로 드러남. 총구 블록은 방전 프롱으로 벌어짐', pose: F({
    UA: P(0, YU + 0.018, -0.13, -14, 0, 0), LA: P(0, YL - 0.014, -0.14, 12, 0, 0),
    CP: P(0, (YU + YL)/2 + 0.004, -0.112), C1: P(0, (YU + YL)/2 + 0.004, -0.145), C2: P(0, (YU + YL)/2 + 0.004, -0.165), BR: P(0, (YU + YL)/2 + 0.004, -0.14, 0, 0, 0, [1, 1, 1.15]),
    MU: P(0, YU + 0.03, -0.185, -24, 0, 0, [1, 0.7, 1.1]), ML: P(0, YL - 0.024, -0.188, 22, 0, 0, [1, 1, 1.1]),
    G1: P(gx + 0.012, YU + 0.006, -0.12, 0, 22, 0), G2: P(-gx - 0.012, YU + 0.006, -0.12, 0, 158, 0), G3: P(gx + 0.012, YL - 0.008, -0.12, 0, 22, 0), G4: P(-gx - 0.012, YL - 0.008, -0.12, 0, 158, 0),
    RL: P(0, YU + 0.048, -0.06, -4, 0, 0)})},
  {id: 'GRAVITY', name: 'GRAVITY · 중력', desc: '전방 모듈 4개가 축 둘레에 방사형 프롱으로 벌어지고 그 사이에 검은 보이드 코어가 떠오름(간츠 중력총 느낌). 코일은 보이드 뒤에서 회전', pose: F({
    UA: P(0, YU + 0.022, -0.155, -16, 0, 0, [0.8, 0.6, 1]), LA: P(0, YL - 0.012, -0.155, 16, 0, 0, [0.8, 1.1, 1]),
    UB: P(0.026, (YU + YL)/2 + 0.006, -0.155, 0, 16, 90, [0.6, 0.62, 1]), LB: P(-0.026, (YU + YL)/2 + 0.006, -0.155, 0, -16, -90, [0.6, 1.1, 0.86]),
    VO: P(0, (YU + YL)/2 + 0.006, -0.2, 0, 0, 0, 1.3), C1: P(0, (YU + YL)/2 + 0.006, -0.17, 0, 0, 0, 1.25), C2: P(0, (YU + YL)/2 + 0.006, -0.135, 0, 0, 0, 1.0),
    CP: P(0, (YU + YL)/2 + 0.006, -0.1), MU: P(0, YU + 0.006, -0.075, 0, 0, 0, [1, 0.5, 0.8]), ML: P(0, YL, -0.075, 0, 0, 0, [1, 0.8, 0.8]),
    BR: P(0, (YU + YL)/2 + 0.006, -0.12, 0, 0, 0, [0.8, 0.8, 0.6]),
    G1: P(gx, YU - 0.004, -0.04), G2: P(-gx, YU - 0.004, -0.04, 0, 180), G3: P(gx, YL + 0.001, -0.05), G4: P(-gx, YL + 0.001, -0.05, 0, 180)})},
  {id: 'DESYNC', name: 'DESYNC · 탈동조', desc: '권총 배치 그대로 모든 모듈이 몇 mm씩 떨어져 어긋난 채 떠 있음. 틈마다 빛이 새고, 코일은 총구 앞에서 천천히 공전', pose: F({
    RB: P(0.002, YU + 0.006, 0.05, 0, 3, 0), RT: P(-0.003, YU + 0.01, -0.012, 2, 0, 0), UB: P(0.004, YU + 0.016, -0.078, -3, 0, 2), UA: P(-0.004, YU + 0.022, -0.146, 4, -3, 0),
    MU: P(0.003, YU + 0.03, -0.2, 0, 6, 4), LB: P(-0.003, YL - 0.008, -0.083, -2, 0, 0), LA: P(0.004, YL - 0.014, -0.152, 3, 4, 0), ML: P(-0.004, YL - 0.022, -0.198, -5, 0, -3),
    RL: P(0.002, YU + 0.05, -0.062, 0, 0, 2), CP: P(0, (YU + YL)/2 + 0.004, -0.11), C1: P(0, (YU + YL)/2 + 0.004, -0.235, 0, 20, 0), C2: P(0, (YU + YL)/2 + 0.004, -0.26, 0, -20, 0),
    G1: P(gx + 0.012, YU - 0.004, -0.136, 0, 10, 4), G2: P(-gx - 0.012, YU - 0.004, -0.136, 0, 170, -4), G3: P(gx + 0.01, YL - 0.008, -0.106, 0, 8, 0), G4: P(-gx - 0.01, YL - 0.008, -0.106, 0, 172, 0)})},
];
// exploded parts layout (the "분해" view): two shelves above and in front of the fixed grip
const EXPLODED = (() => { const o = {}; const row1 = ['RB', 'RT', 'UB', 'UA', 'MU'], row2 = ['LB', 'LA', 'ML', 'RL'], row3 = ['CP', 'C1', 'C2', 'BR', 'VO'], row4 = ['G1', 'G2', 'G3', 'G4'];
  row1.forEach((id, i) => o[id] = P(0, 0.115, 0.06 - i*0.072));
  row2.forEach((id, i) => o[id] = id === 'RL' ? P(0, 0.075, -0.12, 0, 0, 0, 0.8) : P(0, 0.035, -0.07 - i*0.075));
  row3.forEach((id, i) => o[id] = P(0, 0.17, 0.05 - i*0.06, 0, id === 'BR' ? 0 : 90, 0, id === 'BR' ? [1, 1, 0.5] : 1));
  row4.forEach((id, i) => o[id] = P(0, -0.03, -0.08 - i*0.05, 0, i%2 ? 180 : 0, 0));
  return o; })();
FORMS.push({id: 'EXPLODED', name: '분해 · 모듈 펼침', desc: '손잡이·방아쇠 고정부를 제외한 모듈 17개를 한눈에. 이 모듈들을 다른 배치로 결합한 것이 각 형태예요', pose: EXPLODED});

// ---------------- morph state ----------------
const cur = {}, from = {}, dirs = {};
IDS.forEach(id => { const b = PISTOL[id]; cur[id] = {p: b.p.clone(), q: b.q.clone(), s: b.s.clone()}; from[id] = {p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3()}; dirs[id] = new THREE.Vector3(); });
const S = {form: 0, to: 0, t: 1, dur: RM ? 0.3 : 1.15, yaw: 58*D2R, pitch: 14*D2R, view: 0, auto: !RM, drag: null, freeze: false, clock: 0};
const apply = () => IDS.forEach(id => { const o = MOD[id].obj, c = cur[id]; o.position.copy(c.p); o.quaternion.copy(c.q); o.scale.copy(c.s); });
apply();
const labels = new THREE.Group(); gun.add(labels);
IDS.forEach(id => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = 'rgba(14,16,19,.82)'; x.fillRect(0, 8, 256, 48); x.fillStyle = '#ffb27a'; x.font = '500 30px "IBM Plex Sans KR", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(id + ' · ' + MOD[id].label, 128, 33);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: t, transparent: true, depthTest: false, opacity: 0})); sp.scale.set(0.06, 0.015, 1); sp.renderOrder = 10; labels.add(sp); MOD[id].label3 = sp; });

function setForm(i){ i = ((i % FORMS.length) + FORMS.length) % FORMS.length; if (i === S.to && S.t >= 1) return;
  S.form = S.to; S.to = i; S.t = 0; const target = FORMS[i].pose;
  IDS.forEach((id, k) => { from[id].p.copy(cur[id].p); from[id].q.copy(cur[id].q); from[id].s.copy(cur[id].s);
    const mid = from[id].p.clone().add(target[id].p).multiplyScalar(0.5); const d = new THREE.Vector3(0, mid.y - 0.03, mid.z + 0.08);
    dirs[id].copy(d.lengthSq() < 1e-6 ? new THREE.Vector3(0, 1, 0) : d.normalize()).add(new THREE.Vector3((k % 3 - 1)*0.6, 0.5, 0)).normalize(); });
  $('fname').textContent = FORMS[i].name; $('fdesc').textContent = FORMS[i].desc; syncUI(); }

// ---------------- render setup ----------------
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.35, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
function resize(){ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage); resize();
const VIEWS = [{name: '3/4', yaw: 58, pitch: 14, R: 0.62}, {name: '측면', yaw: 90, pitch: 2, R: 0.6}, {name: '정면', yaw: 18, pitch: 8, R: 0.55}, {name: '위', yaw: 90, pitch: 70, R: 0.6}];
const T = new THREE.Vector3();
function placeCamera(){ const v = VIEWS[S.view], half = Math.tan(camera.fov*D2R/2), span = FORMS[S.to].id === 'EXPLODED' ? 0.2 : 0.17;
  const R = Math.max(v.R, span/(half*Math.min(1, camera.aspect)) + 0.05);
  T.set(0, G0.y + 0.03, -0.08);
  camera.position.set(T.x + R*Math.sin(S.yaw)*Math.cos(S.pitch), T.y + R*Math.sin(S.pitch), T.z + R*Math.cos(S.yaw)*Math.cos(S.pitch)); camera.lookAt(T); }
function setView(i){ S.view = i; S.yaw = VIEWS[i].yaw*D2R; S.pitch = VIEWS[i].pitch*D2R; syncUI(); }
cv.addEventListener('pointerdown', e => { S.drag = {x: e.clientX, y: e.clientY, yaw: S.yaw, pitch: S.pitch}; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { const d = S.drag; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 4 && S.auto){ S.auto = false; syncUI(); }
  S.yaw = d.yaw - dx*0.008; S.pitch = clamp(d.pitch + dy*0.006, -0.4, 1.3); });
cv.addEventListener('pointerup', () => { S.drag = null; });
function syncUI(){ document.querySelectorAll('[data-f]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.f === S.to)));
  document.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === S.view)));
  document.querySelectorAll('[data-a="auto"]').forEach(b => b.setAttribute('aria-pressed', String(S.auto))); }
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.f !== undefined) setForm(+b.dataset.f); else if (b.dataset.v !== undefined) setView(+b.dataset.v);
  else if (b.dataset.a === 'next') setForm(S.to + 1); else if (b.dataset.a === 'auto'){ S.auto = !S.auto; syncUI(); } });
addEventListener('keydown', e => { const k = e.key; if (/^[1-8]$/.test(k)) setForm(+k - 1); else if (k === ' ' || k.toLowerCase() === 't'){ e.preventDefault(); setForm(S.to + 1); } else if (k.toLowerCase() === 'c') setView((S.view + 1) % VIEWS.length); });

// ---------------- loop ----------------
const qSpin = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0), tmp = new THREE.Vector3(), qTmp = new THREE.Quaternion(), qBob = new THREE.Quaternion();
let last = performance.now();
function frame(now){ requestAnimationFrame(frame);
  const dt = S.freeze ? 0 : clamp((now - last)/1000, 0, 0.05); last = now; S.clock += dt;
  const pulse = S.t < 1 ? Math.sin(Math.PI*S.t) : 0;
  if (S.t < 1){ S.t = Math.min(1, S.t + dt/S.dur); const target = FORMS[S.to].pose, N = IDS.length;
    IDS.forEach((id, i) => { const d0 = (i/(N - 1))*0.35, k = clamp((S.t - d0)/0.65), e = ease(k), lift = Math.sin(Math.PI*k), f = target[id], c = cur[id];
      c.p.lerpVectors(from[id].p, f.p, e).addScaledVector(dirs[id], lift*0.045);
      c.q.slerpQuaternions(from[id].q, f.q, e); qSpin.setFromAxisAngle(i % 2 ? ax : new THREE.Vector3(0, 0, 1), lift*0.9*(i % 3 ? 1 : -1)); c.q.multiply(qSpin);
      c.s.lerpVectors(from[id].s, f.s, e); }); }
  apply();
  // idle life: floating forms drift, coils/void spin, glow breathes
  const id = FORMS[S.to].id, settled = S.t >= 1;
  if (settled && (id === 'DESYNC' || id === 'GRAVITY')){ IDS.forEach((m, i) => { const o = MOD[m].obj; o.position.y += Math.sin(S.clock*1.6 + i)*0.0012*(id === 'DESYNC' ? 1 : 0.4); }); }
  if (settled && (id === 'DESYNC')){ ['C1', 'C2'].forEach((m, i) => { const o = MOD[m].obj, a = S.clock*0.9 + i*Math.PI; o.position.x += Math.cos(a)*0.012; o.position.y += Math.sin(a)*0.012; }); }
  ['C1', 'C2'].forEach((m, i) => MOD[m].obj.rotateZ((i ? -1 : 1)*dt*(id === 'PISTOL' ? 0 : 2.2)));
  MOD.VO.obj.children[2].scale.setScalar(1 + Math.sin(S.clock*3)*0.08);
  const glowK = 1 + pulse*2.2 + (id === 'DESYNC' && settled ? (Math.random() < 0.08 ? -0.6 : 0) : 0) + Math.sin(S.clock*2.4)*0.08;
  M.glow.color.copy(GLOW_BASE).multiplyScalar(glowK); M.glowS.color.set(0xff9a40).multiplyScalar(glowK*1.2);
  warm.intensity = 0.6 + pulse*1.6;
  // labels only in the exploded layout
  const showL = id === 'EXPLODED' ? ease(clamp((S.t - 0.6)/0.4)) : 0;
  IDS.forEach(m => { const sp = MOD[m].label3, o = MOD[m].obj; sp.material.opacity = showL; sp.visible = showL > 0.01; sp.position.copy(o.position).add(tmp.set(0, 0.034, 0)); });
  gun.position.y = G0.y + (RM ? 0 : Math.sin(S.clock*1.1)*0.002);
  if (S.auto && !S.drag) S.yaw += dt*0.2;
  placeCamera(); composer.render(); }
setForm(0); S.t = 1; requestAnimationFrame(frame);
window.__ds = {S, FORMS, setForm, setView, snap: () => { S.t = 0.9999; }, at: t => { S.t = t; }, freeze: v => { S.freeze = v; }};
