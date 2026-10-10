// Heart Tag v5 · cartridges + auto-decode — source. Built into HeartTag_Cartridge_v5.html (three.js inlined)
// by `node src/build.mjs v5`.
// v5: no bracelet. The shoulder-worn Heart Tag carries three swappable cartridges and does the work when the player
// interacts (E) — the projected pattern simply shows it is happening. It also listens (T, "Hey T / Hey H / Para"):
// ask where things are or for a route and it marks the floor, since there is no full map. The gun folds pistol ↔ rifle on V.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const fail = msg => { $('err').textContent = msg; $('fallback').hidden = false; $('fallback').textContent = msg; };

// ---------------- palette: city-map hologram cyan ----------------
const HOLO = 0x78ECD6, EDGE = 0xB8FFF0;
const H = a => `rgba(120,236,214,${a})`, E = a => `rgba(184,255,240,${a})`, W = a => `rgba(230,255,249,${a})`;
const MONO = '"Share Tech Mono", ui-monospace, Consolas, monospace';
const D2R = Math.PI/180, clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a)*k;
const ease = k => k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({canvas: $('c'), antialias: true}); }
catch (e) { fail('WebGL을 시작할 수 없어요. 하드웨어 가속을 켠 브라우저(Chrome/Edge)에서 열어 주세요.'); throw e; }
const cv = $('c'), stage = cv.parentElement;
renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05080b); scene.fog = new THREE.FogExp2(0x05080b, 0.055);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;
const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 200); camera.position.set(0, 1.6, 0); scene.add(camera);
scene.add(new THREE.HemisphereLight(0x8fb6c8, 0x0b0f12, 0.35));
const key = new THREE.DirectionalLight(0xdfe9f2, 1.0); key.position.set(-3, 6, 3); scene.add(key);
const fillL = new THREE.PointLight(HOLO, 6, 9, 2); fillL.position.set(2.2, 2.4, -5.5); scene.add(fillL);
const warm = new THREE.PointLight(0xffb070, 3, 10, 2); warm.position.set(-3, 2.8, -8); scene.add(warm);
const camLight = new THREE.PointLight(0xcfe3ee, 0.12, 1.5, 2); camLight.position.set(-0.2, 0.25, 0.1); camera.add(camLight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.65, 0.4, 0.9); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------- environment: dark service hall (blockout) ----------------
const M = (c, r=.8, m=.1, extra={}) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: m, ...extra});
const box = (w, h, d, mat, x, y, z, ry=0, parent=scene) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); o.rotation.y = ry; parent.add(o); return o; };
const floorTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#0b1014'; g.fillRect(0, 0, 512, 512); g.strokeStyle = H(0.10); g.lineWidth = 2;
  for (let i=0;i<=512;i+=128){ g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.03)'; g.lineWidth = 1; for (let i=0;i<512;i+=32){ g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t; })();
const floor = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), M(0xffffff, .55, .3, {map: floorTex})); floor.rotation.x = -Math.PI/2; scene.add(floor);
const wallM = M(0x10161c, .9, .05), trimM = M(0x1a232c, .6, .4), stripM = new THREE.MeshBasicMaterial({color: new THREE.Color(HOLO).multiplyScalar(0.5)});
box(0.3, 6, 40, wallM, -4.2, 3, -10); box(0.3, 6, 40, wallM, 4.6, 3, -10); box(10, 6, 0.3, wallM, 0, 3, -18);
for (let z=-2; z>-18; z-=4){ box(0.5, 6, 0.5, trimM, -3.9, 3, z); box(0.5, 6, 0.5, trimM, 4.3, 3, z); box(0.04, 3.2, 0.06, stripM, -3.62, 3.1, z); }
box(1.2, 0.9, 1.2, M(0x161d24, .7, .2), -2.6, 0.45, -10); box(0.9, 1.4, 0.9, M(0x141a20, .7, .2), 3.2, 0.7, -11.5); box(2.6, 0.5, 0.8, M(0x182028, .7, .3), 0.8, 0.25, -14);

// target dummy
const dummy = new THREE.Group(); dummy.position.set(-0.25, 0, -12); scene.add(dummy);
const dumM = M(0x2a333c, .6, .3);
const dBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.8, 6, 16), dumM); dBody.position.y = 1.0; dummy.add(dBody);
const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), dumM); dHead.position.y = 1.72; dummy.add(dHead);
const AIM_PT = new THREE.Vector3(-0.25, 1.45, -12);

// door (left)
const door = new THREE.Group(); door.position.set(-3.0, 0, -6.2); door.rotation.y = 0.9; scene.add(door);
const frameM = M(0x2a333d, .45, .6);
box(0.12, 2.6, 0.25, frameM, -0.75, 1.3, 0, 0, door); box(0.12, 2.6, 0.25, frameM, 0.75, 1.3, 0, 0, door); box(1.62, 0.14, 0.25, frameM, 0, 2.65, 0, 0, door);
const leafM = M(0x6f7880, .42, .6);
const leafL = box(0.69, 2.5, 0.08, leafM, -0.35, 1.25, 0, 0, door), leafR = box(0.69, 2.5, 0.08, leafM, 0.35, 1.25, 0, 0, door);
const doorLockM = new THREE.MeshBasicMaterial({color: 0x3a1418}); const doorLock = box(0.08, 0.12, 0.1, doorLockM, 0.62, 1.3, 0.09, 0, door);
const doorAnchor = new THREE.Object3D(); doorAnchor.position.set(0.62, 1.3, 0.15); door.add(doorAnchor);

// terminal (right)
const term = new THREE.Group(); term.position.set(2.7, 0, -6.6); term.rotation.y = -0.75; scene.add(term);
box(0.7, 1.25, 0.45, M(0x1b232b, .5, .5), 0, 0.62, 0, 0, term);
const tScreenM = new THREE.MeshBasicMaterial({color: 0x1d4a44}); const tScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), tScreenM); tScreen.position.set(0, 1.0, 0.231); term.add(tScreen);
const termAnchor = new THREE.Object3D(); termAnchor.position.set(0, 1.0, 0.24); term.add(termAnchor);

// scan relic
const relic = new THREE.Group(); relic.position.set(0.95, 0, -4.4); scene.add(relic);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.75, 24), M(0x1d252d, .5, .5)); plinth.position.y = 0.375; relic.add(plinth);
const crystalGeo = new THREE.OctahedronGeometry(0.17, 0); crystalGeo.scale(0.8, 1.8, 0.8);
const crystal = new THREE.Mesh(crystalGeo, new THREE.MeshPhysicalMaterial({color: 0x6d7f8b, roughness: .28, metalness: .25, clearcoat: .6, emissive: 0x0b2a26}));
crystal.position.y = 1.08; relic.add(crystal);
const lineMat = (c=EDGE) => new THREE.LineBasicMaterial({color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
const crystalWire = new THREE.LineSegments(new THREE.EdgesGeometry(crystalGeo), lineMat()); crystal.add(crystalWire);
const scanRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.31, 64), new THREE.MeshBasicMaterial({color: EDGE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false}));
scanRing.rotation.x = -Math.PI/2; relic.add(scanRing);

// ---------------- first-person rig (wrist at origin, forearm back along +Z) ----------------
const rig = new THREE.Group(); rig.scale.setScalar(0.62); camera.add(rig);
const sleeveM = M(0x1a1f25, .92, .02), gloveM = M(0x22282e, .75, .05), gunM = M(0x15191e, .42, .7), gunM2 = M(0x0f1215, .55, .6);
const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.054, 0.52, 28), sleeveM); forearm.rotation.x = Math.PI/2; forearm.position.z = 0.3; rig.add(forearm);
box(0.05, 0.012, 0.2, M(0x2b333b, .5, .5), 0, 0.05, 0.24, 0, rig);
const glove = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), gloveM); glove.scale.set(0.044, 0.038, 0.058); glove.position.set(0, -0.004, -0.04); rig.add(glove);
const gun = new THREE.Group(); gun.position.z = -0.05; rig.add(gun);
const gbox = (w, h, d, mat, x, y, z, rx=0) => { const o = box(w, h, d, mat, x, y, z, 0, gun); o.rotation.x = rx; return o; };
// modular gun: a pistol core; on demand the chassis unfolds into a rifle (shroud slides out, barrel extends, rails drop,
// stock swings back from under the frame, optic flips up, the magazine extends) — manual, when the player wants it
const GUN = {k: 0, target: 0};
gbox(0.03, 0.034, 0.17, gunM, 0, 0.05, -0.08);                       // slide
gbox(0.028, 0.02, 0.15, gunM2, 0, 0.028, -0.07);                     // frame
gbox(0.03, 0.085, 0.036, gunM2, 0, -0.012, -0.0, 0.25);              // grip
gbox(0.006, 0.02, 0.03, gunM2, 0, 0.008, -0.045);                    // trigger guard
const shroud = gbox(0.032, 0.03, 0.2, gunM, 0, 0.05, -0.09);
const rBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.12, 12), gunM); rBarrel.rotation.x = Math.PI/2; gun.add(rBarrel);
const rails = [-1, 1].map(sx => gbox(0.004, 0.022, 0.16, gunM2, sx*0.018, 0.04, -0.2));
const stockPv = new THREE.Group(); stockPv.position.set(0, 0.03, 0.01); gun.add(stockPv);
const stockArm = box(0.008, 0.012, 0.2, gunM2, 0, 0, 0.1, 0, stockPv), stockArm2 = box(0.008, 0.012, 0.2, gunM2, 0, -0.03, 0.1, 0, stockPv); box(0.03, 0.06, 0.012, gunM2, 0, -0.015, 0.2, 0, stockPv);
const opticPv = new THREE.Group(); opticPv.position.set(0, 0.067, -0.05); gun.add(opticPv);
box(0.02, 0.022, 0.06, gunM2, 0, 0.011, -0.03, 0, opticPv); const lens = box(0.016, 0.016, 0.002, new THREE.MeshBasicMaterial({color: 0x173c37, toneMapped: false}), 0, 0.012, 0.0005, 0, opticPv);
const mag = gbox(0.024, 0.07, 0.03, gunM2, 0, -0.02, -0.11, 0.08);
gbox(0.002, 0.005, 0.12, new THREE.MeshBasicMaterial({color: HOLO, toneMapped: false}), 0.0155, 0.05, -0.08);
const muzzle = new THREE.Object3D(); gun.add(muzzle);
// ammo display on the back of the slide, tilted toward the eye (replaces the wrist read-out)
const gc = document.createElement('canvas'); gc.width = 256; gc.height = 128; const gg = gc.getContext('2d');
const gTex = new THREE.CanvasTexture(gc); gTex.colorSpace = THREE.SRGBColorSpace;
const gDisp = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.015), new THREE.MeshBasicMaterial({map: gTex, transparent: true, toneMapped: false}));
gDisp.position.set(0, 0.0685, 0.004); gDisp.rotation.x = -1.05; gun.add(gDisp);
function poseGun(k){ const s1 = ease(clamp(k/0.5)), s2 = ease(clamp((k - 0.2)/0.5)), s3 = ease(clamp((k - 0.3)/0.6)), s4 = ease(clamp((k - 0.6)/0.4));
  shroud.position.z = lerp(-0.09, -0.24, s1); shroud.scale.z = lerp(0.85, 1, s1);
  rBarrel.position.set(0, 0.05, lerp(-0.12, -0.38, s1)); rBarrel.visible = s1 > 0.02;
  rails.forEach(r => { r.position.y = lerp(0.05, 0.026, s2); r.position.z = lerp(-0.1, -0.22, s2); r.scale.y = lerp(0.2, 1, s2); });
  stockPv.rotation.x = lerp(Math.PI*0.98, 0, s3); stockPv.visible = true;
  opticPv.rotation.x = lerp(-1.45, 0, s4); lens.material.color.setHex(s4 > 0.9 ? 0x5fd6c2 : 0x173c37);
  mag.scale.y = lerp(1, 1.55, s2); mag.position.y = lerp(-0.02, -0.04, s2);
  muzzle.position.set(0, 0.05, lerp(-0.17, -0.45, s1)); }
poseGun(0);
const flashT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,250,235,1)'); r.addColorStop(.25, 'rgba(255,200,130,.8)'); r.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const flash = new THREE.Sprite(new THREE.SpriteMaterial({map: flashT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})); flash.scale.setScalar(0.09); muzzle.add(flash);

// ---------------- DESYNC door at the end of the hall: opens into another space with the ANCHOR cartridge ----------------
const dsync = new THREE.Group(); dsync.position.set(0, 0, -16.6); scene.add(dsync);
const dFrameM = M(0x2b343e, .4, .6);
box(0.18, 3.0, 0.3, dFrameM, -0.95, 1.5, 0, 0, dsync); box(0.18, 3.0, 0.3, dFrameM, 0.95, 1.5, 0, 0, dsync); box(2.08, 0.2, 0.3, dFrameM, 0, 3.05, 0, 0, dsync);
const dLeafM = M(0x59626b, .45, .55); const dLeaf = box(1.72, 2.9, 0.1, dLeafM, 0, 1.45, 0, 0, dsync);
const dSeamM = new THREE.MeshBasicMaterial({color: new THREE.Color(HOLO).multiplyScalar(0.35), toneMapped: false});
box(0.02, 2.7, 0.12, dSeamM, 0, 1.45, 0, 0, dsync); box(1.5, 0.02, 0.12, dSeamM, 0, 2.6, 0, 0, dsync);
const portalM = new THREE.MeshBasicMaterial({color: 0xffb070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 2.9), portalM); portal.position.set(0, 1.45, -0.06); dsync.add(portal);
const dAnchor = new THREE.Object3D(); dAnchor.position.set(0, 1.5, 0.2); dsync.add(dAnchor);

// ---------------- cartridges: three bays on the Heart Tag ----------------
const POOL = {
  DECODER: {tag: 'DEC', note: '문 · 단말 근접 자동 해독'},
  PULSE:   {tag: 'PLS', note: '물체 근접 자동 스캔'},
  ANCHOR:  {tag: 'ANC', note: 'DESYNC 문 → 다른 공간 (X)'},
  SHUNT:   {tag: 'SHT', note: '기계 정지 (프로토타입 미구현)'},
  TETHER:  {tag: 'TTH', note: '그래플 · 강제 개방 (미구현)'},
  SCOUT:   {tag: 'SCT', note: '투척 센서 (미구현)'},
};
const SLOTS = ['DECODER', 'PULSE', 'ANCHOR'];
const has = c => SLOTS.includes(c);
function cycleSlot(i){ const names = Object.keys(POOL); let k = names.indexOf(SLOTS[i]);
  for (let n=0;n<names.length;n++){ k = (k + 1) % names.length; if (!SLOTS.includes(names[k])){ SLOTS[i] = names[k]; break; } }
  slotSwap[i] = T; renderSlotList(); }
const slotSwap = [-9, -9, -9];

// ---------------- projection over the left shoulder (same grammar as the map: lasers, then the pattern) ----------------
const N = 1024, C = N/2, PLANE = 0.36;
const pc = document.createElement('canvas'); pc.width = pc.height = N; const g = pc.getContext('2d');
const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace; pTex.anisotropy = 4;
const proj = new THREE.Mesh(new THREE.PlaneGeometry(PLANE, PLANE), new THREE.MeshBasicMaterial({map: pTex, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}));
proj.renderOrder = 10; camera.add(proj);
const EMIT = new THREE.Vector3(-0.3, -0.34, -0.14);             // the Heart Tag on the left shoulder, just below the view
const lasers = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Array(24).fill(0), 3)), lineMat(0xE6FFF9));
lasers.frustumCulled = false; lasers.renderOrder = 9; lasers.material.depthTest = false; camera.add(lasers);

const P = (r, a) => [C + Math.cos(a*D2R)*r, C - Math.sin(a*D2R)*r];
function arc(r, a0, a1, w, col){ if (Math.abs(a0 - a1) < 0.1) return; g.strokeStyle = col; g.lineWidth = w; g.beginPath();
  a0 > a1 ? g.arc(C, C, r, -a0*D2R, -a1*D2R, false) : g.arc(C, C, r, -a0*D2R, -a1*D2R, true); g.stroke(); }
function tick(r, a, len, w, col){ const [x0, y0] = P(r - len/2, a), [x1, y1] = P(r + len/2, a); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
function segBand(r, a0, a1, n, w, colOf, gap=0.28){ const step = (a0 - a1)/n;
  for (let i=0;i<n;i++){ const c = colOf(i); if (!c) continue; const s0 = a0 - i*step - step*gap/2, s1 = s0 - step*(1 - gap);
    g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'butt'; g.beginPath(); g.arc(C, C, r, -s0*D2R, -s1*D2R, false); g.stroke(); } }
function hair(r, a0, a1, a=1, ticks=0){ const n = Math.max(2, Math.ceil(Math.abs(a0 - a1)/2));
  for (let i=0;i<n;i++){ const k0 = i/n, k1 = (i + 1)/n, f = Math.min(1, Math.min(k0, 1 - k1)*6 + 0.15); arc(r, lerp(a0, a1, k0), lerp(a0, a1, k1), 1.2, E(0.75*a*f)); }
  if (ticks) for (let t = a0; t >= a1; t -= ticks) tick(r + 3, t, 4, 1, H(0.35*a)); }
function windowMarks(a, half, r0, r1, al=1){ [a + half, a - half].forEach(b => { const [x0, y0] = P(r0, b), [x1, y1] = P(r1, b);
  g.strokeStyle = E(0.95*al); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }); }
const fall = (a, w, span) => clamp(1 - Math.max(0, Math.abs(a - w) - 4)/span);

// the decode ring: the Heart Tag is round, so the patterns run round a ring with the reading window at the top
const B0 = 240, B1 = -60, BM = 90;
const along = k => lerp(B0, B1, k);
function cipher(r, t, speed, seed, locked, w=6, n=64){ const sh = Math.floor(t*speed);
  segBand(r, B0, B1, n, w, j => { const a = along((j + 0.5)/n), f = fall(a, BM, 110), inWin = Math.abs(a - BM) < 4;
    if (locked) return inWin ? W(1) : H(0.1*f);
    return ((j*7 + sh*3 + seed*11) % 5) < 2 ? E(0.12 + 0.65*f) : H(0.05 + 0.06*f); }, 0.3); }
function lockFlash(t, at, r0, r1){ const k = clamp(1 - (t - at)/0.35); if (t < at || k <= 0) return; for (let r = r0; r <= r1; r += 6) arc(r, B0, B1, 4, W(0.16*k)); }
function core(t, al){ g.globalAlpha = al; arc(140, 0, 359.9, 1, H(0.3));                          // the Heart Tag core: a slow inner bezel
  for (let k=0;k<36;k++){ const a = k*10 + t*20; tick(150, a, k % 3 ? 4 : 9, 1, H(k % 3 ? 0.3 : 0.6)); } g.globalAlpha = 1; }

function drawDoor(t){ const PIN = [0.35, 0.55, 0.75, 0.95], R = [180, 200, 220, 240];
  R.forEach((r, i) => { const set = t > PIN[i]; cipher(r, t, 16 + i*6, i, set, 10);
    const fl = set ? clamp(1 - (t - PIN[i])*4) : 0; if (fl > 0) arc(r, BM + 4, BM - 4, 18, W(0.5*fl)); });
  windowMarks(BM, 5, 166, 254); hair(266, B0, B1, 1, 6); lockFlash(t, PIN[3], 176, 244); }
function drawHack(t){ const LOCK = [0.9, 1.6, 2.3], R = [186, 210, 234];
  R.forEach((r, i) => { const locked = t > LOCK[i]; cipher(r, t, 14 + i*6, i, locked, 13);
    const fl = locked ? clamp(1 - (t - LOCK[i])*4) : 0; if (fl > 0) arc(r, BM + 4, BM - 4, 22, W(0.45*fl)); });
  const sh = Math.floor(t*30); segBand(258, B0, B1, 100, 3, j => t > 2.45 ? H(0.06) : ((j*13 + sh*5) % 7) < 2 ? E(0.55*fall(along((j + 0.5)/100), BM, 110)) : null, 0.4);
  windowMarks(BM, 5, 172, 248); hair(268, B0, B1, 1, 6); lockFlash(t, 2.45, 180, 240); }
function drawScan(t){ const p = clamp(t/2.0), rot = t < 2 ? t*70 : 140 + (1 - Math.exp(-(t - 2)*7))*12;
  for (let m=-75;m<=75;m++){ const a = BM + m*4 + (rot % 4); if (a > B0 || a < B1) continue; g.globalAlpha = g.globalAlpha0*fall(a, BM, 110);
    tick(226, a, m % 5 ? 12 : 28, m % 5 ? 2 : 3.5, E(0.9)); }
  g.globalAlpha = g.globalAlpha0;
  const spread = p*(B0 - BM); segBand(194, B0, B1, 60, 14, j => { const a = along((j + 0.5)/60); return Math.abs(a - BM) <= spread ? E(0.3 + 0.65*fall(a, BM, 110)) : H(0.08); }, 0.3);
  windowMarks(BM, 4.5, 178, 252); hair(262, B0, B1, 1); lockFlash(t, 2.0, 186, 246); }
function drawAnchor(t){   // DESYNC: two coordinate rings counter-rotate until their notches meet in the window, then fold inward
  const lockA = 1.0, lockB = 1.4, fold = ease(clamp((t - 1.6)/0.4));
  [[200, 1, lockA], [236, -1, lockB]].forEach(([r0, dir, lk], i) => { const r = lerp(r0, 120, fold), locked = t > lk;
    const rot = locked ? 0 : dir*(lk - t)*220;
    segBand(r, B0 + rot, B1 + rot, 72, 9 - i*2, j => { const a = along((j + 0.5)/72) + rot, notch = Math.abs(((a - BM) % 360 + 540) % 360 - 180) < 6;
      return notch ? W(1) : (j % 3 === 0 ? E(0.7) : H(0.15)); }, 0.35);
    const fl = locked ? clamp(1 - (t - lk)*4) : 0; if (fl > 0) arc(r, 0, 359.9, 16, W(0.3*fl)); });
  windowMarks(BM, 5, 180, 252, 1 - fold); hair(266, B0, B1, 1 - fold, 6);
  if (fold > 0){ g.fillStyle = W(0.35*fold*(1 - clamp((t - 1.9)/0.2))); g.beginPath(); g.arc(C, C, 120*fold, 0, Math.PI*2); g.fill(); } }
function drawKnown(t){   // already decoded: one quick ring passes through the window, nothing else
  const k = clamp(t/0.5); arc(lerp(160, 250, ease(k)), B0, B1, 3, W(0.9*(1 - k))); windowMarks(BM, 5, 176, 250, 1 - k); }
function drawDenied(t){ const k = clamp(t/0.5);  // the required cartridge isn't fitted: the ring tries, stutters, and lets go
  segBand(200, B0, B1, 40, 6, j => (j + Math.floor(t*20)) % 4 === 0 ? H(0.5*(1 - k)) : null, 0.5); }

// ---------------- state ----------------
const S = {walk: true, z: 4, aim: false, flash: 0, recoil: 0, sync: 82, space: 0, listen: false, voice: true, reload: 0, ammo: {P: 15, R: 30}, max: {P: 15, R: 30}};
const gunMode = () => GUN.target > 0.5 ? 'R' : 'P';
const ACT = {kind: '', t: 0, target: null, len: 0};
const KNOWN = new Set();
const LEN = {door: 2.6, hack: 3.4, scan: 3.6, anchor: 2.1, known: 0.6, denied: 0.5};
let NEAR = null;
const TARGETS = [
  {id: 'relic', kind: 'scan', need: 'PULSE', obj: relic, range: 3.4, label: '스캔'},
  {id: 'door-b12', kind: 'door', need: 'DECODER', obj: doorAnchor, range: 5.0, label: '문 열기'},
  {id: 'node-04', kind: 'hack', need: 'DECODER', obj: termAnchor, range: 4.6, label: '단말 접속'},
];
const DSYNC_T = {id: 'dsync', kind: 'anchor', label: 'DESYNC 문', obj: null};
let doorHold = 0, doorOpen = 0, hackLit = 0, scanLit = 0, portalK = 0, flashK = 0, projK = 0;
function start(kind, target){ ACT.kind = kind; ACT.t = 0; ACT.target = target; ACT.len = LEN[kind]; }
function finish(){ const tg = ACT.target; if (tg && ['door', 'hack', 'scan', 'known'].includes(ACT.kind)) KNOWN.add(tg.id); ACT.kind = ''; ACT.target = null; }
function interact(){ if (ACT.kind || !NEAR || NEAR === DSYNC_T) return; const tg = NEAR; start(!has(tg.need) ? 'denied' : KNOWN.has(tg.id) ? 'known' : tg.kind, tg); }
function desyncKey(){ if (ACT.kind || S.z > -11) return; if (!has('ANCHOR')){ start('denied', null); return; } start('anchor', {id: 'dsync', obj: dAnchor}); }
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _w = new THREE.Vector3();

// ---------------- Heart Tag inset (bottom-left): the device with its three cartridge bays ----------------
const ht = $('ht'), hg = ht.getContext('2d'); const HTS = 220, HTC = HTS/2;
const BAY = [210, 330, 90];   // bay angles round the device
function bayPos(i){ const a = BAY[i]*D2R; return [HTC + Math.cos(a)*74, HTC - Math.sin(a)*74]; }
function drawInset(){ const dpr = ht.width/HTS; hg.setTransform(dpr, 0, 0, dpr, 0, 0); hg.clearRect(0, 0, HTS, HTS);
  const busy = ACT.kind && !['denied'].includes(ACT.kind), needIdx = ACT.kind ? SLOTS.indexOf({door: 'DECODER', hack: 'DECODER', known: ACT.target ? ACT.target.need : '', scan: 'PULSE', anchor: 'ANCHOR'}[ACT.kind] || '') : -1;
  hg.lineWidth = 1; hg.strokeStyle = H(0.5); hg.beginPath(); hg.arc(HTC, HTC, 52, 0, Math.PI*2); hg.stroke();
  hg.strokeStyle = H(0.2); hg.lineWidth = 8; hg.beginPath(); hg.arc(HTC, HTC, 44, 0, Math.PI*2); hg.stroke();
  hg.strokeStyle = E(0.95); hg.lineWidth = 2; hg.beginPath(); hg.arc(HTC, HTC, 44, -Math.PI/2, -Math.PI/2 + S.sync/100*Math.PI*2); hg.stroke();   // sync rate
  for (let k=0;k<24;k++){ const a = k/24*Math.PI*2 + (busy ? T*2 : 0); hg.strokeStyle = H(busy && k % 2 ? 0.9 : 0.35); hg.beginPath();
    hg.moveTo(HTC + Math.cos(a)*30, HTC + Math.sin(a)*30); hg.lineTo(HTC + Math.cos(a)*34, HTC + Math.sin(a)*34); hg.stroke(); }
  hg.fillStyle = busy ? W(0.9) : H(0.6); hg.beginPath(); hg.arc(HTC, HTC, busy ? 6 + Math.sin(T*12) : 5, 0, Math.PI*2); hg.fill();
  hg.font = `400 10px ${MONO}`; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillStyle = H(0.7); hg.fillText('SYNC ' + S.sync, HTC, HTC + 18);
  SLOTS.forEach((c, i) => { const [x, y] = bayPos(i), on = i === needIdx, sw = clamp((T - slotSwap[i])/0.35);
    hg.save(); hg.translate(x, y); hg.rotate(-(BAY[i] - 90)*D2R);
    const pull = (1 - ease(sw))*10; hg.translate(0, -pull);                                       // cartridge slides into its bay
    hg.strokeStyle = on ? W(1) : E(0.8); hg.lineWidth = 1.4; hg.strokeRect(-17, -12, 34, 24);
    hg.fillStyle = on ? H(0.35 + 0.25*Math.sin(T*14)) : H(0.08); hg.fillRect(-17, -12, 34, 24);
    hg.fillStyle = on ? W(1) : E(0.9); hg.font = `400 10px ${MONO}`; hg.fillText(POOL[c].tag, 0, 1);
    hg.fillStyle = on ? W(1) : H(0.5); hg.fillRect(-12, 8, 24*(on ? 1 : 0.35), 2);
    hg.restore(); });
  hg.font = `400 9px ${MONO}`; hg.fillStyle = H(0.55); hg.fillText('HEART TAG', HTC, 12); }
ht.addEventListener('pointerdown', e => { const r = ht.getBoundingClientRect(), x = (e.clientX - r.left)/r.width*HTS, y = (e.clientY - r.top)/r.height*HTS;
  let best = -1, bd = 1e9; [0, 1, 2].forEach(i => { const [bx, by] = bayPos(i), d = Math.hypot(bx - x, by - y); if (d < bd){ bd = d; best = i; } });
  if (bd < 34) cycleSlot(best); e.stopPropagation(); });
function renderSlotList(){ const el = $('slots'); if (!el) return;
  el.innerHTML = SLOTS.map((c, i) => `<button data-slot="${i}">${i + 1} · ${c}<kbd>${POOL[c].note}</kbd></button>`).join('');
  el.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => cycleSlot(+b.dataset.slot)); }

// ---------------- gun-mounted display ----------------
function drawGunDisplay(){ const m = gunMode(), moving = Math.abs(GUN.k - GUN.target) > 0.02, n = S.ammo[m], mx = S.max[m];
  gg.clearRect(0, 0, 256, 128); gg.fillStyle = 'rgba(4,10,12,0.92)'; gg.fillRect(0, 0, 256, 128);
  gg.font = `400 72px ${MONO}`; gg.textBaseline = 'middle'; gg.textAlign = 'left';
  gg.fillStyle = n <= mx*0.25 && Math.floor(T*4) % 2 ? H(0.5) : W(1); gg.fillText(S.reload > 0 ? '--' : moving ? '..' : String(n).padStart(2, '0'), 16, 60);
  gg.font = `400 30px ${MONO}`; gg.fillStyle = E(0.9); gg.textAlign = 'right'; gg.fillText(moving ? '<>' : m === 'R' ? 'RFL' : 'PST', 240, 40);
  gg.fillStyle = H(0.6); gg.fillText('/' + mx, 240, 84);
  gg.fillStyle = H(0.25); gg.fillRect(16, 110, 224, 6); gg.fillStyle = E(1); gg.fillRect(16, 110, 224*(S.reload > 0 ? 1 - S.reload/1.2 : n/mx), 6); gTex.needsUpdate = true; }

// ---------------- listening mode: talk to the Heart Tag ("Hey T" / "Hey H" / "Para"), it navigates and answers ----------------
const INFO = [
  {keys: ['크리스털', '결정', '파편', '유물', 'relic', 'crystal'], id: 'relic', name: '위상 결정 파편', obj: relic, info: 'Fe-Ni 62 · 위상 결정 28 · 폴리머 10. 소음흡수 핀을 만드는 재료예요.'},
  {keys: ['b-12', 'b12', '보안문', '왼쪽 문', 'door'], id: 'door-b12', name: '보안 문 B-12', obj: door, info: '구역 B로 이어지는 문이에요. 해독하면 키가 저장돼요.'},
  {keys: ['단말', '노드', '터미널', 'node', 'terminal'], id: 'node-04', name: '단말 NODE 04', obj: term, info: '구역 전력망 노드예요. 접속하면 이 구역 기록을 받을 수 있어요.'},
  {keys: ['desync', '디싱크', '탈출', '출구', '다른 공간', '앵커', '끝 문'], id: 'dsync', name: 'DESYNC 문', obj: dsync, info: 'ANCHOR 카트리지로 다른 공간과 이어지는 문이에요.', always: true},
];
const REPLY = {text: '', t0: -9, lock: []};
function say(text){ REPLY.text = text; REPLY.t0 = T; REPLY.lock = [...text].map((_, i) => 0.05 + i*0.018 + Math.random()*0.25);
  if (S.voice && 'speechSynthesis' in window){ try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[·]/g, ',')); u.lang = 'ko-KR'; u.rate = 1.05; u.pitch = 0.9; speechSynthesis.speak(u); } catch (e) {} } }
function drawReply(){ const el = $('reply'); const e = T - REPLY.t0; if (!REPLY.text || e > 9){ el.hidden = true; return; } el.hidden = false;
  el.style.opacity = String(1 - clamp((e - 8)/1));
  el.textContent = [...REPLY.text].map((c, i) => c === ' ' || e > REPLY.lock[i] ? c : GLYPHS[(Math.random()*GLYPHS.length)|0]).join(''); }
const GLYPHS = '0123456789ABCDEF#%/<>';
function dirOf(v){ camera.getWorldDirection(_a); _a.y = 0; _a.normalize(); _b.set(v.x - camera.position.x, 0, v.z - camera.position.z); const d = _b.length(); _b.normalize();
  const ang = Math.atan2(_a.x*_b.z - _a.z*_b.x, _a.dot(_b))/D2R, s = Math.abs(ang) < 25 ? '정면' : Math.abs(ang) > 140 ? '뒤쪽' : ang > 0 ? (Math.abs(ang) < 70 ? '오른쪽 앞' : '오른쪽') : (Math.abs(ang) < 70 ? '왼쪽 앞' : '왼쪽');
  return [s, d.toFixed(0)]; }
function respond(raw){ const q = raw.toLowerCase().replace(/^(hey\s*[th]|헤이\s*[티에이치]+|para|파라)[,\s]*/, '').trim();
  const item = INFO.find(it => it.keys.some(k => q.includes(k)));
  const known = item && (item.always || KNOWN.has(item.id));
  const at = it => it.obj.getWorldPosition(new THREE.Vector3());
  if (/(길|경로|안내|가는 ?법|어떻게 가|데려|route|way)/.test(q)){ const it = item || INFO[3]; const p = at(it); const [d, m] = dirOf(p);
    navTo(p, known || !item); return say(`${it.name}까지 경로 표시할게요. ${d} ${m}m.`); }
  if (item && /(어디|위치|where|찾아|있어)/.test(q)){ const p = at(item); const [d, m] = dirOf(p);
    if (known){ navTo(p, true); return say(`${item.name}, ${d} ${m}m에 있어요. 바닥에 표시했어요.`); }
    navTo(p, false); return say(`${item.name}은 아직 분석 전이라 정확한 위치는 몰라요. 신호는 ${d} 쪽이에요.`); }
  if (item){ return known ? say(`${item.name}. ${item.info}`) : say(`${item.name}은 아직 분석하지 않았어요. 가까이 가서 확인해 주세요.`); }
  if (/(카트리지|슬롯|장착)/.test(q)) return say(`지금 장착한 카트리지는 ${SLOTS.join(', ')}이에요.`);
  if (/(동기화|싱크|sync|상태|괜찮)/.test(q)) return say(`동기화율 ${S.sync}%. 안정적이에요.`);
  if (/(누구|이름|who are)/.test(q)) return say('Heart Tag예요. 당신 심박에 맞춰 돌아가는 보조 장치죠. 짧게 T라고 불러도 돼요.');
  if (/(파라|para)/.test(raw.toLowerCase()) && !q) return say('파라… 그건 제 개발 코드네임이었는데. 어떻게 아셨어요?');
  if (/(노래|sing)/.test(q)) return say('삐— 빕, 삐— 빕. 음정은 아직 동기화가 안 됐어요.');
  if (/(사랑|love)/.test(q)) return say('심박이 7 올라갔네요. 기록해 둘게요.');
  if (/(심심|재밌|농담|joke)/.test(q)) return say('이 복도, 어제도 똑같이 생겼었어요. 아니면 내일이었나.');
  if (/(몇 ?시|시간|time)/.test(q)) return say(`지금 ${new Date().toTimeString().slice(0, 5)}. 이 공간 기준으로는요.`);
  if (!q) return say('네, 듣고 있어요.');
  return say('잘 못 알아들었어요. "길 찾아줘"나 "크리스털 어디 있어?"처럼 말해 주세요.'); }
// navigation: chevrons on the floor from the player to the target, and a beacon at the target (no full map — the Heart Tag guides)
const NAV = {to: null, t0: -9, sure: true};
const chevGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.12, 0, 0.06), new THREE.Vector3(0, 0, -0.08), new THREE.Vector3(0.12, 0, 0.06)]);
const CHEV = Array.from({length: 26}, () => { const l = new THREE.Line(chevGeo, lineMat(EDGE)); l.frustumCulled = false; scene.add(l); return l; });
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4, 8, 1, true), new THREE.MeshBasicMaterial({color: HOLO, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false})); scene.add(beacon);
function navTo(p, sure){ NAV.to = p.clone(); NAV.to.y = 0; NAV.t0 = T; NAV.sure = sure; }
function drawNav(){ const e = T - NAV.t0, on = NAV.to && e < 10, fade = on ? clamp(e/0.3)*(1 - clamp((e - 9)/1)) : 0;
  beacon.material.opacity = fade*(NAV.sure ? 0.5 : 0.2)*(0.7 + 0.3*Math.sin(T*6)); if (NAV.to) beacon.position.set(NAV.to.x, 2, NAV.to.z);
  const from = _a.set(camera.position.x, 0.03, camera.position.z), dir = _b.set(NAV.to ? NAV.to.x - from.x : 0, 0, NAV.to ? NAV.to.z - from.z : 1), len = dir.length(); dir.normalize();
  const yaw = Math.atan2(-dir.x, -dir.z);
  CHEV.forEach((c, i) => { const d = 1.2 + ((i*0.7 + T*1.4) % (26*0.7)); const vis = on && d < len - 0.4;
    c.visible = vis; if (!vis) return; c.position.set(from.x + dir.x*d, 0.03, from.z + dir.z*d); c.rotation.y = yaw;
    c.material.opacity = fade*(NAV.sure ? 0.85 : 0.35)*clamp(1 - d/(len + 0.01))*clamp((d - 1.2)/0.8 + 0.2); }); }
// listening: a mic if the browser gives one, typed words otherwise
let recog = null;
function setListen(on){ S.listen = on; $('listen').hidden = !on; document.querySelectorAll('[data-a="listen"]').forEach(b => b.setAttribute('aria-pressed', String(on)));
  if (on){ $('ask').value = ''; setTimeout(() => $('ask').focus(), 30);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR){ try { recog = new SR(); recog.lang = 'ko-KR'; recog.interimResults = false; recog.onresult = ev => { const t = ev.results[0][0].transcript; $('ask').value = t; ask(t); };
        recog.onerror = () => { $('micState').textContent = '마이크를 쓸 수 없어 글자로 받을게요'; }; recog.start(); $('micState').textContent = '듣는 중… (Hey T · Hey H · Para)'; }
      catch (e) { $('micState').textContent = '글자로 말해 주세요'; } }
    else $('micState').textContent = '이 브라우저는 음성 인식이 없어 글자로 받을게요'; }
  else if (recog){ try { recog.stop(); } catch (e) {} recog = null; } }
function ask(text){ if (!text.trim()) return; respond(text); setListen(false); }
$('askForm').addEventListener('submit', e => { e.preventDefault(); ask($('ask').value); });
document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { setListen(true); $('ask').value = b.dataset.q; ask(b.dataset.q); }));
function drawListen(t){ // the ring turns into a listening waveform
  for (let k=0;k<120;k++){ const a = B0 - k*2.5, amp = 6 + 22*Math.abs(Math.sin(k*0.37 + t*9))*Math.abs(Math.sin(k*0.11 - t*4)); tick(205, a, amp, 2.5, E(0.25 + 0.6*fall(a, BM, 140))); }
  windowMarks(BM, 5, 176, 240); hair(256, B0, B1, 1, 6); }

// ---------------- input ----------------
const look = {x: 0, y: 0, tx: 0, ty: 0};
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => { if (e.button === 2) S.aim = true; else if (e.button === 0) fire(); });
addEventListener('pointerup', e => { if (e.button === 2) S.aim = false; });
cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); look.tx = ((e.clientX - r.left)/r.width - .5)*2; look.ty = ((e.clientY - r.top)/r.height - .5)*2; });
cv.addEventListener('pointerleave', () => { look.tx = look.ty = 0; });
function fire(){ const m = gunMode(); if (S.reload > 0 || Math.abs(GUN.k - GUN.target) > 0.02 || S.ammo[m] <= 0) return; S.ammo[m]--; S.flash = 1; S.recoil = m === 'R' ? 0.6 : 1; }
function reload(){ const m = gunMode(); if (S.reload > 0 || S.ammo[m] === S.max[m]) return; S.reload = 1.2; }
function transform(){ if (S.reload > 0) return; GUN.target = GUN.target > 0.5 ? 0 : 1; }
const BTN = {walk: () => { S.walk = !S.walk; syncBtns(); }, desync: desyncKey, interact: () => interact(), aim: () => { S.aim = !S.aim; }, reset: () => { KNOWN.clear(); },
  fire, reload, transform, listen: () => setListen(!S.listen), voice: () => { S.voice = !S.voice; document.querySelectorAll('[data-a="voice"]').forEach(b => b.setAttribute('aria-pressed', String(S.voice))); }};
function syncBtns(){ document.querySelectorAll('[data-a="walk"]').forEach(b => b.setAttribute('aria-pressed', String(S.walk))); }
document.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => BTN[b.dataset.a]?.()));
addEventListener('keydown', e => { if (e.repeat) return; const k = e.key.toLowerCase();
  if (document.activeElement === $('ask')) return;
  if (k === 'x') desyncKey(); else if (k === 'e') interact(); else if (k === 'v') transform(); else if (k === 'r') reload(); else if (k === 't') setListen(!S.listen);
  else if (k === 'w' || k === ' ') BTN.walk(); else if ('123'.includes(k)) cycleSlot(+k - 1); });
renderSlotList(); syncBtns();

// ---------------- loop ----------------
const HIP = {p: new THREE.Vector3(0.2, -0.17, -0.5), r: new THREE.Euler(0.3, 0.42, 0.08)}, ADS = {p: new THREE.Vector3(0.08, -0.112, -0.46), r: new THREE.Euler(0.22, 0.3, 0.02)};
const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion();
let aimK = 0;
function resize(){ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix();
  const d = Math.min(2, devicePixelRatio); ht.width = ht.height = HTS*d; }
new ResizeObserver(resize).observe(stage); resize();
const SPACES = [{bg: 0x05080b, fog: 0x05080b}, {bg: 0x0d0805, fog: 0x0d0805}];   // the hall, and the "other" hall past the DESYNC door
let last = performance.now(), T = 0, frozen = false;
function frame(now){
  const dt = frozen ? 0 : clamp((now - last)/1000, 0, 0.05); last = now; T += dt;
  const portrait = camera.aspect < 1;
  // walk the hall; stop at the DESYNC door
  const stopZ = -13.2; if (S.walk && !(ACT.kind === 'anchor')) S.z = Math.max(stopZ, S.z - dt*1.2);
  const moving = S.walk && S.z > stopZ + 0.01;
  camera.position.set(0, 1.6 + (moving ? Math.sin(T*8.5)*0.012 : 0), S.z);
  look.x = lerp(look.x, look.tx, 1 - Math.exp(-dt*4)); look.y = lerp(look.y, look.ty, 1 - Math.exp(-dt*4));
  camera.rotation.set(-look.y*0.1, -look.x*0.25, 0, 'YXZ');
  aimK = lerp(aimK, S.aim ? 1 : 0, 1 - Math.exp(-dt*14));
  const fov0 = portrait ? 66 : 55; camera.fov = lerp(fov0, fov0 - 8, aimK); camera.updateProjectionMatrix();
  rig.scale.setScalar(portrait ? 0.44 : 0.62);
  rig.position.lerpVectors(HIP.p, ADS.p, aimK); if (portrait){ rig.position.x *= 0.18; rig.position.y += 0.02; }
  rig.position.y += moving ? Math.abs(Math.sin(T*4.25))*-0.006 : 0; S.recoil = Math.max(0, S.recoil - dt*9); rig.position.z += S.recoil*0.022;
  _q0.setFromEuler(HIP.r); _q1.setFromEuler(ADS.r); rig.quaternion.slerpQuaternions(_q0, _q1, aimK); rig.rotateX(S.recoil*0.07);
  S.flash = Math.max(0, S.flash - dt*18); flash.material.opacity = S.flash; flash.scale.setScalar(0.06 + S.flash*0.06);
  GUN.k = GUN.target > GUN.k ? Math.min(GUN.target, GUN.k + dt/0.45) : Math.max(GUN.target, GUN.k - dt/0.35); poseGun(GUN.k);
  if (S.reload > 0){ S.reload -= dt; if (S.reload <= 0){ const m = gunMode(); S.ammo[m] = S.max[m]; } }
  drawGunDisplay();
  crystal.rotation.y += dt*0.4;

  // auto: the nearest target in range runs with whatever cartridge fits it — no input
  // interaction is manual (E): the pattern only shows while the Heart Tag is actually doing the job
  NEAR = null; for (const tg of TARGETS){ tg.obj.getWorldPosition(_w); if (Math.hypot(_w.x - camera.position.x, _w.z - camera.position.z) < tg.range){ NEAR = tg; break; } }
  if (!NEAR && S.z <= -11) NEAR = DSYNC_T;
  $('prompt').hidden = !NEAR || !!ACT.kind || S.listen; if (NEAR) $('prompt').textContent = (NEAR === DSYNC_T ? 'X' : 'E') + ' · ' + NEAR.label;
  if (ACT.kind){ ACT.t += dt;
    const t = ACT.t, kd = ACT.kind;
    if ((kd === 'door' && t > 0.95) || (kd === 'known' && ACT.target?.kind === 'door' && t > 0.15)) doorHold = 6;
    if ((kd === 'hack' && t > 2.45) || (kd === 'known' && ACT.target?.kind === 'hack' && t > 0.15)) hackLit = 6;
    if ((kd === 'scan' && t > 2.0) || (kd === 'known' && ACT.target?.kind === 'scan' && t > 0.15)) scanLit = 3;
    if (kd === 'anchor' && t > 1.6) portalK = Math.max(portalK, clamp((t - 1.6)/0.4));
    if (t > ACT.len){ if (kd === 'anchor') flashK = 1; finish(); } }
  // world: door, terminal, relic, the DESYNC portal and the jump to the other space
  doorHold = Math.max(0, doorHold - dt); doorOpen = lerp(doorOpen, doorHold > 0 ? 1 : 0, 1 - Math.exp(-dt*5));
  leafL.position.x = -0.35 - doorOpen*0.66; leafR.position.x = 0.35 + doorOpen*0.66; doorLockM.color.setHex(doorHold > 0 ? 0x2e8f80 : has('DECODER') ? 0x3a1418 : 0x241015);
  hackLit = Math.max(0, hackLit - dt); tScreenM.color.setHex(ACT.kind === 'hack' ? (Math.floor(T*14) % 2 ? 0x2a6c62 : 0x173c37) : hackLit > 0 ? 0x5fd6c2 : 0x1d4a44);
  scanLit = Math.max(0, scanLit - dt); crystalWire.material.opacity = ACT.kind === 'scan' ? clamp(ACT.t/2)*0.55 : scanLit > 0 ? 0.55*clamp(scanLit) : 0;
  scanRing.material.opacity = ACT.kind === 'scan' && ACT.t < 2 ? 0.9 : 0; if (ACT.kind === 'scan'){ const sh = 0.78 + clamp(ACT.t/2)*0.62; scanRing.position.y = sh; scanRing.scale.setScalar(1 - 0.5*clamp((sh - 0.9)/0.5)); }
  dSeamM.color.copy(new THREE.Color(HOLO)).multiplyScalar(has('ANCHOR') ? 0.55 + 0.25*Math.sin(T*3) : 0.15);
  portalM.opacity = portalK*0.55; dLeaf.position.y = 1.45 + ease(portalK)*2.9;
  if (flashK > 0){ flashK = Math.max(0, flashK - dt*1.6); if (flashK < 0.5 && portalK > 0){                // through the door: arrive in the other space
      S.space = 1 - S.space; const sp = SPACES[S.space]; scene.background.setHex(sp.bg); scene.fog.color.setHex(sp.fog); warm.color.setHex(S.space ? 0xffc890 : 0xffb070);
      S.z = 4; portalK = 0; dLeaf.position.y = 1.45; TARGETS.forEach(tg => tg.done = false); } }
  $('flash').style.opacity = flashK.toFixed(3);

  // projection: lasers off the shoulder, then the pattern
  const kd = ACT.kind || (S.listen ? 'listen' : ''); projK = lerp(projK, kd ? 1 : 0, 1 - Math.exp(-dt*(kd ? 12 : 8)));
  const pScale = portrait ? 0.82 : 1; proj.scale.setScalar(pScale);
  proj.position.set(portrait ? -0.05 : -0.2, portrait ? 0.17 : 0.07, -0.62);
  const kL = ACT.kind ? ease(clamp(ACT.t/0.15)) : projK, half = PLANE*pScale/2;
  const pos = lasers.geometry.attributes.position;
  [135, 45, 225, 315].forEach((deg, i) => { const rr = half*(262/512), da = deg*D2R;     // lasers land on the ring itself, not the empty corners
    _a.copy(EMIT); _b.set(proj.position.x + Math.cos(da)*rr, proj.position.y + Math.sin(da)*rr, proj.position.z); _b.lerpVectors(_a, _b, kL);
    pos.setXYZ(i*2, _a.x, _a.y, _a.z); pos.setXYZ(i*2 + 1, _b.x, _b.y, _b.z); });
  pos.needsUpdate = true; lasers.material.opacity = projK*(ACT.kind ? (ACT.t < 0.3 ? 0.8 : 0.25) : 0.25);
  g.clearRect(0, 0, N, N);
  if (projK > 0.01){ const open = ACT.kind ? ease(clamp((ACT.t - 0.1)/0.25)) : projK, fade = ACT.kind ? 1 - clamp((ACT.t - (ACT.len - 0.4))/0.4) : projK;
    g.globalAlpha = g.globalAlpha0 = open*fade; g.save(); g.translate(C, C); g.scale(lerp(0.6, 1, open), lerp(0.6, 1, open)); g.translate(-C, -C);
    core(T, open*fade); g.globalAlpha = g.globalAlpha0;
    const t = ACT.t;
    if (kd === 'door') drawDoor(t); else if (kd === 'hack') drawHack(t); else if (kd === 'scan') drawScan(t);
    else if (kd === 'anchor') drawAnchor(t); else if (kd === 'known') drawKnown(t); else if (kd === 'denied') drawDenied(t); else if (kd === 'listen') drawListen(T);
    g.restore(); g.globalAlpha = 1; }
  pTex.needsUpdate = true; proj.visible = projK > 0.01;
  if (ACT.target && kd !== 'denied'){ ACT.target.obj.getWorldPosition(_w); }   // (beam to target reserved for the 3rd-person view)

  drawInset(); drawNav(); drawReply();
  $('state').textContent = (kd ? 'HEART TAG · ' + kd.toUpperCase() : moving ? 'WALK' : S.z <= stopZ + 0.01 ? 'DESYNC DOOR · X' : 'HOLD') + (S.space ? '  ·  OTHER SPACE' : '');
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__ht = {S, ACT, SLOTS, KNOWN, TARGETS, GUN, start, desyncKey, cycleSlot, interact, respond, setListen, transform, fire, now: () => T, freeze: v => { frozen = v; }};   // capture / debug hook
