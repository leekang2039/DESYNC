// Heart Tag · Wrist HUD v4 — source. Built into HeartTag_WristHUD_v4.html (three.js inlined, opens offline)
// by `node src/build_wrist_hud_v4.mjs`.
// v4: minimal single-arc HUD beside the right wrist while aiming; door / hack / scan keys make the
// bracelet itself put out the UI + effect (wrist turns up, seams go cyan, rings play around the cuff).
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
const cuffGlow = new THREE.PointLight(HOLO, 0, 0.6, 2); camera.add(cuffGlow);   // lights the glove while the bracelet projects

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
gbox(0.036, 0.056, 0.31, gunM, 0, 0.048, -0.15); gbox(0.03, 0.085, 0.04, gunM2, 0, -0.004, -0.02, 0.28); gbox(0.026, 0.075, 0.034, gunM2, 0, -0.006, -0.12, 0.08);
gbox(0.018, 0.008, 0.2, gunM2, 0, 0.08, -0.15); gbox(0.012, 0.016, 0.01, gunM2, 0, 0.09, -0.05); gbox(0.008, 0.018, 0.008, gunM2, 0, 0.09, -0.24);
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.14, 14), gunM); barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.056, -0.36); gun.add(barrel);
gbox(0.002, 0.005, 0.17, new THREE.MeshBasicMaterial({color: HOLO, toneMapped: false}), 0.0185, 0.05, -0.17);
const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.056, -0.44); gun.add(muzzle);
const flashT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,250,235,1)'); r.addColorStop(.25, 'rgba(255,200,130,.8)'); r.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const flash = new THREE.Sprite(new THREE.SpriteMaterial({map: flashT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})); flash.scale.setScalar(0.09); muzzle.add(flash);

// bracelet: white armour strips round a dark core, LED lines in the seams (parallel to the arm), brass latches
const cuff = new THREE.Group(); cuff.position.z = 0.065; rig.add(cuff);
const CR = 0.05, CL = 0.066, NS = 14, sw = 2*Math.PI*CR/NS;
const core = new THREE.Mesh(new THREE.CylinderGeometry(CR - 0.004, CR - 0.004, CL, 40, 1, true), M(0x0c0e11, .6, .3, {side: THREE.DoubleSide})); core.rotation.x = Math.PI/2; cuff.add(core);
const armorM = new THREE.MeshPhysicalMaterial({color: 0xb3b9bf, roughness: .5, metalness: .05, clearcoat: .35, clearcoatRoughness: .4});
const armorM2 = new THREE.MeshPhysicalMaterial({color: 0xaeb4ba, roughness: .48, metalness: .05, clearcoat: .3});
const LED_RED = new THREE.Color(0xff2030), LED_CY = new THREE.Color(HOLO);
const ledM = new THREE.MeshStandardMaterial({color: 0x10080a, emissive: LED_RED.clone(), emissiveIntensity: 1.5});
const brassM = M(0xc08a42, .35, .85);
for (let i=0;i<NS;i++){ const pv = new THREE.Group(); pv.rotation.z = i/NS*Math.PI*2; cuff.add(pv);
  if (i % 3 === 1){ [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(sw*0.8, 0.008, CL*0.46), s > 0 ? armorM : armorM2); p.position.set(0, CR + 0.002, s*CL*0.26); pv.add(p); }); }
  else { const p = new THREE.Mesh(new THREE.BoxGeometry(sw*0.8, 0.008 + (i%2)*0.002, CL*0.96), armorM); p.position.y = CR + 0.002; pv.add(p); }
  const lv = new THREE.Group(); lv.rotation.z = Math.PI/NS; pv.add(lv);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.004, CL*0.86), ledM); led.position.y = CR; lv.add(led);
  if (i % 4 === 0){ const b = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.006), brassM); b.position.set(0, CR + 0.003, CL*0.42); lv.add(b); }
  if (i % 5 === 2){ const sq = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0015, 0.007), ledM); sq.position.set(0, CR + 0.0065, -CL*0.1); pv.add(sq); } }
[-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.TorusGeometry(CR + 0.001, 0.0022, 8, 64), M(0x15181c, .5, .6)); r.position.z = s*CL/2; cuff.add(r); });

// ---------------- wrist display: one camera-facing canvas centred on the cuff ----------------
// Both the aim HUD and the door / hack / scan read-outs are drawn here, so everything comes off the bracelet.
const N = 1024, C = N/2, PLANE = 0.4;              // canvas px, centre, plane size in rig units (≈2560 px / unit)
const wc = document.createElement('canvas'); wc.width = wc.height = N; const g = wc.getContext('2d');
const wTex = new THREE.CanvasTexture(wc); wTex.colorSpace = THREE.SRGBColorSpace; wTex.anisotropy = 4;
const wrist = new THREE.Mesh(new THREE.PlaneGeometry(PLANE, PLANE), new THREE.MeshBasicMaterial({map: wTex, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}));
wrist.renderOrder = 10; wrist.position.z = 0.065; rig.add(wrist);

const P = (r, a) => [C + Math.cos(a*D2R)*r, C - Math.sin(a*D2R)*r];
function arc(r, a0, a1, w, col){ if (Math.abs(a0 - a1) < 0.1) return; g.strokeStyle = col; g.lineWidth = w; g.beginPath();
  a0 > a1 ? g.arc(C, C, r, -a0*D2R, -a1*D2R, false) : g.arc(C, C, r, -a0*D2R, -a1*D2R, true); g.stroke(); }
function glowArc(r, a0, a1, w, a=1){ arc(r, a0, a1, w*4, H(0.10*a)); arc(r, a0, a1, w, E(0.95*a)); }
function tick(r, a, len, w, col){ const [x0, y0] = P(r - len/2, a), [x1, y1] = P(r + len/2, a); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
function dot(r, a, s, fillIt, col){ const [x, y] = P(r, a); g.beginPath(); g.arc(x, y, s, 0, Math.PI*2); if (fillIt){ g.fillStyle = col; g.fill(); } else { g.strokeStyle = col; g.lineWidth = 1.5; g.stroke(); } }
function diamond(r, a, s, fillIt, col){ const [x, y] = P(r, a); g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath();
  if (fillIt){ g.fillStyle = col; g.fill(); } else { g.strokeStyle = col; g.lineWidth = 1.5; g.stroke(); } }
function text(s, x, y, size, col, align='left', glow=false){ g.font = `400 ${size}px ${MONO}`; g.textAlign = align; g.textBaseline = 'middle';
  if (glow){ g.shadowColor = H(0.9); g.shadowBlur = 12; } g.fillStyle = col; g.fillText(s, x, y); g.shadowBlur = 0; }

// ---------------- state ----------------
const S = {aim: false, ammo: 24, max: 30, mags: 3, type: 0, reload: 0, dAmmo: 2, dMax: 2, batt: 76, mark: 2, recoil: 0, flash: 0, glitch: 0};
const TYPES = ['STD', 'AP', 'EMP'];
const GEAR = [{cd: 8, left: 0, ready: 0}, {cd: 5, left: 0, ready: 0}, {cd: 14, left: 0, ready: 0}];
const ACT = {kind: '', t: 0};                       // active bracelet action: 'door' | 'hack' | 'scan'
const ACT_LEN = {door: 2.6, hack: 3.4, scan: 3.6};
let hudK = 0, aimK = 0, actK = 0, doorOpen = 0, doorHold = 0, hackLit = 0;

// ---- shared arc language: segmented band + fading hairline with end caps + caret ----
// Every arc on the bracelet is built from these, so the aim HUD and the door / hack / scan read-outs feel like one instrument.
function segBand(r, a0, a1, n, w, colOf, gap=0.28){             // n curved blocks from a0 to a1; colOf(i) → colour or null
  const step = (a0 - a1)/n;
  for (let i=0;i<n;i++){ const c = colOf(i); if (!c) continue; const s0 = a0 - i*step - step*gap/2, s1 = s0 - step*(1 - gap);
    g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'butt'; g.beginPath(); g.arc(C, C, r, -s0*D2R, -s1*D2R, false); g.stroke(); } }
function hair(r, a0, a1, a=1, ticks=0){                          // hairline whose ends fade out, end caps, optional minor ticks
  const n = Math.max(2, Math.ceil(Math.abs(a0 - a1)/2));
  for (let i=0;i<n;i++){ const k0 = i/n, k1 = (i + 1)/n, fadeK = Math.min(1, Math.min(k0, 1 - k1)*6 + 0.15);
    arc(r, lerp(a0, a1, k0), lerp(a0, a1, k1), 1.2, E(0.75*a*fadeK)); }
  if (ticks) for (let t = a0; t >= a1; t -= ticks) tick(r + 3, t, 4, 1, H(0.35*a));
  tick(r, a0, 12, 1.5, E(0.9*a)); tick(r, a1, 12, 1.5, E(0.9*a)); }
function caret(r, a, s, col){ const [x, y] = P(r, a), [ix, iy] = P(r - s*1.4, a), t = (a + 90)*D2R, dx = Math.cos(t)*s*0.7, dy = -Math.sin(t)*s*0.7;
  g.fillStyle = col; g.beginPath(); g.moveTo(ix, iy); g.lineTo(x + dx, y + dy); g.lineTo(x - dx, y - dy); g.closePath(); g.fill(); }
function spaced(px){ if ('letterSpacing' in g) g.letterSpacing = px + 'px'; }
function readout(x, y, label, big, sub, a=1){                       // small spaced caps label · big value · sub line
  g.globalAlpha *= a; spaced(4); text(label, x, y - 34, 15, E(0.75)); spaced(0);
  text(big, x - 2, y, 38, W(1), 'left', true); if (sub) text(sub, x, y + 32, 17, H(0.8)); g.globalAlpha /= a; }

// ---- rotary parts: every value reads through a fixed window, like a revolver cylinder or a cipher wheel ----
const SPRINGS = [];
class Spring { constructor(k=260, c=20){ Object.assign(this, {pos: 0, vel: 0, target: 0, k, c}); SPRINGS.push(this); }
  step(dt){ this.vel += ((this.target - this.pos)*this.k - this.vel*this.c)*dt; this.pos += this.vel*dt;   // slight overshoot = the click
    if (Math.abs(this.target - this.pos) < 0.002 && Math.abs(this.vel) < 0.02){ this.pos = this.target; this.vel = 0; } }
  get moving(){ return this.pos !== this.target || this.vel !== 0; }
  snap(v){ this.pos = this.target = v; this.vel = 0; } }
class Drum {   // labels on a circle round the cuff; only the one in the window shows at rest, neighbours appear while it turns
  constructor(labels, r, a, step, size, o={}){ Object.assign(this, {labels, r, a, step, size, forward: false, align: 'left', space: 0, dots: false}, o); this.s = new Spring(o.k ?? 260, o.c ?? 20); }
  set(i){ const n = this.labels.length, p = this.s.target; let t;
    if (this.forward){ t = i + n*Math.floor(p/n); while (t < p - 1e-6) t += n; if (Math.abs(t - n - p) < 1e-6) t -= n; }   // revolver: only turns forward
    else t = i + n*Math.round((p - i)/n);                                                                                 // odometer: nearest way
    this.s.target = t; }
  reset(i=0){ this.s.snap(i); }
  draw(al=1, hotCol=W(1)){ const n = this.labels.length, p = this.s.pos, turning = this.s.moving;
    if (this.dots && turning) for (let c=-2;c<=2;c++){ const ca = this.a + (c - (((p % 1) + 1) % 1))*this.step*0.45;
      dot(this.r - 14, ca, 2.4, true, H(0.55*al*clamp(1 - Math.abs(ca - this.a)/24))); }
    for (let k=Math.floor(p) - 1; k<=Math.floor(p) + 2; k++){ const d = k - p, vis = clamp(1 - Math.abs(d)*0.95);
      if (vis <= 0.01 || (!turning && Math.abs(d) > 0.5)) continue;
      const a = this.a - d*this.step, [x, y] = P(this.r, a), hot = Math.abs(d) < 0.5;
      g.save(); g.translate(x, y); g.rotate(-(a - this.a)*D2R); g.globalAlpha = al*vis;
      spaced(this.space); text(this.labels[((k % n) + n) % n], 0, 0, this.size, hot ? hotCol : E(0.75), this.align, hot); spaced(0); g.restore(); }
    g.globalAlpha = 1; } }
function windowMarks(a, half, r0, r1, al=1){ [a + half, a - half].forEach(b => { const [x0, y0] = P(r0, b), [x1, y1] = P(r1, b);
  g.strokeStyle = E(0.95*al); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }); }
const fall = (a, w, span) => clamp(1 - Math.max(0, Math.abs(a - w) - 4)/span);     // fade away from a window
const DIGITS = '0123456789'.split('');

// ---- aim HUD: an ammo cylinder track turning through a window, odometer count, revolver round-type ----
const AW = 2;                                        // reading window (degrees, 0 = right, 90 = up)
const R_TRK = 192, R_RULE = 208, R_UP = 226, STEP_R = 5.5;
const ammoTrack = new Spring(300, 22);
const dTens = new Drum(DIGITS, 230, AW, 26, 58, {align: 'center'}), dOnes = new Drum(DIGITS, 264, AW, 26, 58, {align: 'center'});
const dMags = new Drum(DIGITS, 304, AW + 11, 30, 20, {align: 'center'});
const dType = new Drum(TYPES, 228, AW - 21, 22, 24, {forward: true, dots: true, space: 3});
const PEEK = {drone: 0, mark: 0};
function spinIn(){ ammoTrack.snap(Math.max(0, S.ammo - 9)); ammoTrack.target = S.ammo; dTens.reset(0); dOnes.reset(0); }
function drawAim(T){
  const kA = ease(clamp(hudK/0.6)), kT = ease(clamp((hudK - 0.25)/0.5));
  const low = S.ammo <= 10 && S.reload <= 0, blink = low && Math.floor(T*4) % 2 === 0;
  ammoTrack.target = S.ammo; dTens.set(Math.floor(S.ammo/10)); dOnes.set(S.ammo % 10); dMags.set(S.mags); dType.set(S.type);
  // cylinder track: one tick per round, remaining rounds stacked above the window, spent ones roll out below
  hair(R_RULE, AW + 78, AW - 16, kA, 6);
  const p = ammoTrack.pos, top = lerp(AW - 18, AW + 80, kA), rl = S.reload > 0;
  for (let i=0;i<S.max;i++){ const a = AW + (p - 1 - i)*STEP_R; if (a > top || a < AW - 18) continue;
    const live = i < S.ammo, head = i === S.ammo - 1 && !rl;
    g.globalAlpha = fall(a, AW, 74)*(rl ? 0.45 + 0.3*Math.sin(T*16) : 1);
    tick(R_TRK, a, head ? 24 : live ? 14 : 8, head ? 3.5 : 2.5, head ? W(1) : live ? (blink ? H(0.4) : E(0.9)) : H(0.2)); }
  g.globalAlpha = 1;
  windowMarks(AW, 4.6, R_TRK - 20, R_TRK + 18, kA); caret(R_RULE + 10, AW, 5, W(kA));
  // count (two odometer drums) · spare mags · round type (revolver)
  if (kT > 0){ const al = kT*(blink ? 0.5 : 1); dTens.draw(al); dOnes.draw(al);
    g.globalAlpha = kT; { const [x, y] = P(288, AW + 11); text('×', x, y, 18, E(0.85), 'center'); } dMags.draw(kT, E(1));
    dType.draw(kT); }
  // drone: a cipher strip above that scrolls, then freezes into battery blocks + rounds (only after a drone shot / low battery)
  const dA = Math.max(clamp(PEEK.drone/0.4), S.batt <= 20 ? 1 : 0)*kT;
  if (dA > 0){ g.globalAlpha = dA; const tt = 2.5 - PEEK.drone, frozen = tt > 0.45 || S.batt <= 20, lit = Math.round(S.batt/10), sh = Math.floor(T*22);
    segBand(R_UP, 84, 48, 10, 4, i => frozen ? (i < lit ? (S.batt <= 20 ? W(1) : E(0.95)) : H(0.15)) : ((i*7 + sh) % 5 < 2 ? E(0.7) : H(0.12)), 0.3);
    for (let i=0;i<S.dMax;i++) diamond(R_UP, 42 - i*7, 4.5, i < S.dAmmo, E(1)); g.globalAlpha = 1; }
  // gear: chambers above the window while cooling (ring fills), blink once when ready
  GEAR.forEach((G, i) => { if (G.left <= 0 && G.ready <= 0) return; const a = 30 - i*7, [x, y] = P(R_UP, a); g.globalAlpha = kT;
    if (G.left > 0){ g.strokeStyle = H(0.3); g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6, 0, Math.PI*2); g.stroke();
      g.strokeStyle = E(1); g.beginPath(); g.arc(x, y, 6, -Math.PI/2, -Math.PI/2 + (1 - G.left/G.cd)*Math.PI*2); g.stroke(); }
    else dot(R_UP, a, 5, true, W(Math.floor(G.ready*8) % 2 ? 1 : 0.3));
    g.globalAlpha = 1; });
  // marks: three blocks at the top of the track for a moment after marking
  const mA = clamp(PEEK.mark/0.4)*kT;
  if (mA > 0){ g.globalAlpha = mA; segBand(R_UP, 100, 88, 3, 5, i => i < S.mark ? E(1) : H(0.2), 0.3); g.globalAlpha = 1; } }

// ---- bracelet actions: tracks turning through a window at the middle of the outer half-ring ----
const HEX = '0123456789ABCDEF';
const B0 = 110, B1 = -50, BM = (B0 + B1)/2;          // action half-ring and its window
const along = k => lerp(B0, B1, k);
const R_STAT = 280;
const doorState = new Drum(['LOCKED', 'UNLOCK', 'OPEN'], R_STAT, BM, 18, 34, {forward: true, dots: true});
const hackState = new Drum(['SYNC 0/3', 'SYNC 1/3', 'SYNC 2/3', 'ACCESS'], R_STAT, BM, 18, 32, {forward: true, dots: true});
const scanState = new Drum(['SCANNING', 'OBJECT 03'], R_STAT, BM, 18, 32, {forward: true, dots: true});
function statLabel(s, al=1){ const [x, y] = P(R_STAT, BM + 9); g.save(); g.translate(x, y); g.globalAlpha *= al; spaced(4); text(s, 0, 0, 15, E(0.75)); spaced(0); g.restore(); }
function statSub(s){ const [x, y] = P(R_STAT, BM - 8); text(s, x, y, 17, H(0.85)); }
// a cipher track: blocks scroll until `locked`, then only the window stays lit
function cipher(r, t, speed, seed, locked, w=5){ const n = 40, sh = Math.floor(t*speed);
  segBand(r, B0, B1, n, w, j => { const a = along((j + 0.5)/n), f = fall(a, BM, 80), inWin = Math.abs(a - BM) < 6.5;
    if (locked) return inWin ? W(1) : H(0.1*f);
    return ((j*7 + sh*3 + seed*11) % 5) < 2 ? E(0.15 + 0.6*f) : H(0.06 + 0.06*f); }, 0.3); }
function drawDoor(t){ const PIN = [0.35, 0.55, 0.75, 0.95], R = [184, 198, 212, 226], fade = 1 - clamp((t - 2.2)/0.4);
  g.globalAlpha = fade;
  // pin tumblers: four tracks spin and set into the window one by one
  R.forEach((r, i) => { const set = t > PIN[i]; cipher(r, t, 16 + i*6, i, set, 4);
    const fl = set ? clamp(1 - (t - PIN[i])*4) : 0; if (fl > 0) arc(r, BM + 6.5, BM - 6.5, 12, W(0.45*fl)); });
  windowMarks(BM, 7.5, 174, 236); hair(244, B0, B1, 1, 10);
  doorState.set(t < 0.95 ? 0 : t < 1.3 ? 1 : 2); g.globalAlpha = fade; statLabel('DOOR B-12'); doorState.draw(fade);
  g.globalAlpha = fade; statSub(PIN.filter(p => t > p).length + '/4 PINS'); g.globalAlpha = 1; }
function drawHack(t){ const LOCK = [0.9, 1.6, 2.3], R = [186, 202, 218], fade = 1 - clamp((t - 3.0)/0.4);
  g.globalAlpha = fade;
  R.forEach((r, i) => { const locked = t > LOCK[i]; cipher(r, t, 14 + i*6, i, locked);
    const fl = locked ? clamp(1 - (t - LOCK[i])*4) : 0; if (fl > 0) arc(r, BM + 6.5, BM - 6.5, 14, W(0.4*fl)); });
  windowMarks(BM, 7.5, 176, 228); hair(236, B0, B1, 1, 10);
  for (let j=0;j<12;j++){ const a = B0 - 6 - j*13 - (t*26 % 13); const [x, y] = P(250, a); g.globalAlpha = fade*fall(a, BM, 90); text(HEX[(Math.random()*16)|0], x, y, 13, H(0.6), 'center'); }
  const n = LOCK.filter(l => t > l).length; hackState.set(t > 2.45 ? 3 : n);
  g.globalAlpha = fade; statLabel('NODE 04'); hackState.draw(fade); g.globalAlpha = fade; statSub(Math.floor(clamp(t/2.4)*100) + '%'); g.globalAlpha = 1; }
function drawScan(t){ const p = clamp(t/2.0), k = ease(clamp((t - 2.0)/0.4)), fade = 1 - clamp((t - 3.2)/0.4);
  g.globalAlpha = fade;
  // ruler wheel: spins fast while scanning, settles with a click when the object is identified
  const rot = t < 2 ? t*70 : 140 + (1 - Math.exp(-(t - 2)*7))*12;
  for (let m=-40;m<=40;m++){ const a = BM + m*4 + (rot % 4); if (a > B0 || a < B1) continue; g.globalAlpha = fade*fall(a, BM, 80);
    tick(204, a, m % 5 ? 7 : 16, m % 5 ? 1.5 : 2.5, E(0.85)); }
  g.globalAlpha = fade;
  // progress fills out of the window both ways
  const spread = p*(B0 - BM); segBand(188, B0, B1, 36, 7, j => { const a = along((j + 0.5)/36); return Math.abs(a - BM) <= spread ? E(0.25 + 0.65*fall(a, BM, 90)) : H(0.08); }, 0.3);
  windowMarks(BM, 6, 178, 222); hair(230, B0, B1, 1);
  scanState.set(p < 1 ? 0 : 1); statLabel(p < 1 ? 'PHASE SCAN' : 'IDENTIFIED'); scanState.draw(fade);
  g.globalAlpha = fade; statSub(p < 1 ? Math.floor(p*100) + '%' : '위상 결정 파편 · RECIPE +1');
  if (k > 0){ const [x, y] = P(R_STAT, BM - 8); g.globalAlpha = fade*k;
    [['Fe-Ni', .62], ['PHASE', .28], ['POLY', .10]].forEach(([n, v], i) => { const yy = y + 34 + i*22; text(n, x, yy, 14, H(0.8));
      for (let b=0;b<10;b++){ g.fillStyle = b < Math.round(v*10*k) ? E(1) : H(0.18); g.fillRect(x + 66 + b*12, yy - 3, 9, 5); } }); }
  g.globalAlpha = 1; }

// ---------------- world effects driven by the bracelet ----------------
function beam(n){ const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n*6).fill(0), 3));
  const l = new THREE.LineSegments(geo, lineMat()); l.frustumCulled = false; l.renderOrder = 6; scene.add(l); return l; }
const ray = beam(1), cone = beam(8), tracer = beam(1), dTracer = beam(1);
tracer.material.color.setHex(0xffe0b0);
function seg(l, i, a, b){ const p = l.geometry.attributes.position; p.setXYZ(i*2, a.x, a.y, a.z); p.setXYZ(i*2 + 1, b.x, b.y, b.z); p.needsUpdate = true; }

const markC = document.createElement('canvas'); markC.width = markC.height = 256; const markT = new THREE.CanvasTexture(markC); markT.colorSpace = THREE.SRGBColorSpace;
const markS = new THREE.Sprite(new THREE.SpriteMaterial({map: markT, transparent: true, depthWrite: false, toneMapped: false})); markS.scale.setScalar(0.75); markS.position.y = 1.35; dummy.add(markS);
function drawMark(n){ const m = markC.getContext('2d'); m.clearRect(0, 0, 256, 256); if (!n){ markT.needsUpdate = true; return; }
  m.strokeStyle = E(0.95); m.lineWidth = 5; const s = 44, o = 30;
  [[o, o, 1, 1], [256 - o, o, -1, 1], [o, 256 - o, 1, -1], [256 - o, 256 - o, -1, -1]].forEach(([x, y, sx, sy]) => { m.beginPath(); m.moveTo(x, y + sy*s); m.lineTo(x, y); m.lineTo(x + sx*s, y); m.stroke(); });
  m.font = `400 26px ${MONO}`; m.fillStyle = W(1); m.textAlign = 'center'; m.fillText('MK ' + n, 128, 250); markT.needsUpdate = true; }

// ---------------- input ----------------
function setAim(on){ if (on && ACT.kind) return; if (on && !S.aim && hudK < 0.05) spinIn(); S.aim = on; document.querySelectorAll('[data-a="aim"]').forEach(b => b.setAttribute('aria-pressed', String(on))); $('xh').classList.toggle('ads', on); }
function fire(){ if (!S.aim || S.reload > 0 || S.ammo <= 0) return; S.ammo--; S.recoil = 1; S.flash = 1; S.glitch = 0.08; tr.t = 0.07; }
function reload(){ if (S.reload > 0 || S.mags <= 0 || S.ammo === S.max) return; S.reload = 1.4; S.mags--; }
const cycleType = () => { S.type = (S.type + 1) % 3; };   // dType turns to it
const mark = () => { S.mark = S.mark >= 3 ? 0 : S.mark + 1; PEEK.mark = 2; drawMark(S.mark); };
const droneFire = () => { PEEK.drone = 2.5; if (S.dAmmo > 0){ S.dAmmo--; S.batt = Math.max(0, S.batt - 6); dtr.t = 0.12; } else S.dAmmo = S.dMax; };
const gear = i => { if (GEAR[i].left <= 0) GEAR[i].left = GEAR[i].cd; };
function act(kind){ if (ACT.kind) return; ACT.kind = kind; ACT.t = 0; setAim(false); doorState.reset(); hackState.reset(); scanState.reset(); }
const tr = {t: 0}, dtr = {t: 0};
// buttons (side rail on desktop, the on-screen dock on phones) share data-a names
const BTN = {aim: () => setAim(!S.aim), fire: () => { if (!S.aim) setAim(true); fire(); }, reload, type: cycleType, mark, drone: droneFire,
  door: () => act('door'), hack: () => act('hack'), scan: () => act('scan'), g0: () => gear(0), g1: () => gear(1), g2: () => gear(2)};
document.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => BTN[b.dataset.a]?.()));
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => { if (e.button === 2) setAim(true); else if (e.button === 0) fire(); });
addEventListener('pointerup', e => { if (e.button === 2) setAim(false); });
const look = {x: 0, y: 0, tx: 0, ty: 0};
cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); look.tx = ((e.clientX - r.left)/r.width - .5)*2; look.ty = ((e.clientY - r.top)/r.height - .5)*2; });
cv.addEventListener('pointerleave', () => { look.tx = look.ty = 0; });
addEventListener('keydown', e => { if (e.repeat) return;
  ({r: reload, t: cycleType, f: mark, g: droneFire, e: () => act('door'), h: () => act('hack'), q: () => act('scan'),
    '1': () => gear(0), '2': () => gear(1), '3': () => gear(2)})[e.key.toLowerCase()]?.(); });

// ---------------- poses ----------------
const POSE = {
  hip:   {p: new THREE.Vector3(0.2, -0.17, -0.5),    r: new THREE.Euler(0.3, 0.42, 0.08)},
  ads:   {p: new THREE.Vector3(0.08, -0.112, -0.46), r: new THREE.Euler(0.22, 0.3, 0.02)},
  wrist: {p: new THREE.Vector3(0.11, -0.14, -0.52),  r: new THREE.Euler(0.42, 0.5, 0.32)},    // forearm raised a little, cuff turned to the eye
};
const _q = [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()], _v = new THREE.Vector3(), _w = new THREE.Vector3(), _u = new THREE.Vector3();
const _p = new THREE.Vector3(), _qa = new THREE.Quaternion();

function resize(){ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage); resize();

// ---------------- loop ----------------
let last = performance.now(), T = 0;
function frame(now){
  const dt = clamp((now - last)/1000, 0, 0.05); last = now; T += dt;   // rAF can stamp the first frame before `last`
  if (S.reload > 0){ S.reload -= dt; if (S.reload <= 0){ S.ammo = S.max; S.glitch = .1; } }
  S.recoil = Math.max(0, S.recoil - dt*9); S.flash = Math.max(0, S.flash - dt*18); S.glitch = Math.max(0, S.glitch - dt);
  GEAR.forEach(G => { if (G.left > 0 && G.left <= dt) G.ready = 0.8; G.left = Math.max(0, G.left - dt); G.ready = Math.max(0, G.ready - dt); });
  PEEK.drone = Math.max(0, PEEK.drone - dt); PEEK.mark = Math.max(0, PEEK.mark - dt);
  SPRINGS.forEach(sp => sp.step(dt));
  if (ACT.kind){ ACT.t += dt; if (ACT.t > ACT_LEN[ACT.kind]) ACT.kind = ''; }

  // pose blend: hip ↔ ads, then ↔ wrist-up while the bracelet is working
  look.x = lerp(look.x, look.tx, 1 - Math.exp(-dt*4)); look.y = lerp(look.y, look.ty, 1 - Math.exp(-dt*4));
  camera.rotation.set(-look.y*0.1, -look.x*0.16, 0, 'YXZ');
  aimK = lerp(aimK, S.aim ? 1 : 0, 1 - Math.exp(-dt*14));
  actK = lerp(actK, ACT.kind ? 1 : 0, 1 - Math.exp(-dt*(ACT.kind ? 9 : 6)));
  hudK = clamp(hudK + (S.aim ? dt/0.4 : -dt/0.16));
  const portrait = camera.aspect < 1, nar = portrait ? 0.18 : clamp(camera.aspect/1.6, 0.42, 1);   // phones: wider view, arm pulled in so cuff + arcs stay on screen
  const fov0 = portrait ? 66 : 55; camera.fov = lerp(fov0, fov0 - 8, aimK); camera.updateProjectionMatrix();
  _p.lerpVectors(POSE.hip.p, POSE.ads.p, aimK).lerp(POSE.wrist.p, actK);
  _q[0].setFromEuler(POSE.hip.r); _q[1].setFromEuler(POSE.ads.r); _q[2].setFromEuler(POSE.wrist.r);
  _qa.slerpQuaternions(_q[0], _q[1], aimK).slerp(_q[2], actK);
  const sway = RM ? 0 : (1 - aimK*0.75);
  rig.scale.setScalar(portrait ? 0.44 : 0.62); rig.position.copy(_p); rig.position.x *= nar; if (portrait) rig.position.y += 0.02;
  rig.position.x += Math.sin(T*1.1)*0.003*sway - (look.tx - look.x)*0.02; rig.position.y += Math.sin(T*2.2)*0.002*sway + (look.ty - look.y)*0.015;
  const rl = S.reload > 0 ? Math.sin(clamp(1 - S.reload/1.4)*Math.PI) : 0;
  rig.position.z += S.recoil*0.022; rig.position.y -= rl*0.05;
  rig.quaternion.copy(_qa); rig.rotateX(S.recoil*0.07 - rl*0.35); rig.rotateZ(rl*0.5);
  wrist.quaternion.copy(rig.quaternion).invert();                  // display faces the eye, centred on the cuff
  wrist.scale.setScalar(lerp(1.0, 1.35, actK)*(portrait ? lerp(1.55, 1.02, actK) : 1));                     // action rings sit clear of the (closer) cuff
  flash.material.opacity = S.flash; flash.material.rotation = Math.random()*6; flash.scale.setScalar(0.06 + S.flash*0.06);
  crystal.rotation.y += dt*0.4;

  // bracelet seams: red at rest, cyan while it projects
  const proj = Math.max(actK, hudK*0.35);
  ledM.emissive.copy(LED_RED).lerp(LED_CY, actK); ledM.emissiveIntensity = 1.5 - actK*0.5 + (ACT.kind ? Math.sin(T*18)*0.15 : 0);
  cuff.getWorldPosition(_v); camera.worldToLocal(_u.copy(_v)); cuffGlow.position.copy(_u).add(new THREE.Vector3(0.03, 0.03, 0.02)); cuffGlow.intensity = proj*0.12;

  // ---- wrist display ----
  g.clearRect(0, 0, N, N);
  if (hudK > 0.001 && !ACT.kind) drawAim(T);
  if (ACT.kind === 'door') drawDoor(ACT.t); else if (ACT.kind === 'hack') drawHack(ACT.t); else if (ACT.kind === 'scan') drawScan(ACT.t);
  wTex.needsUpdate = true; wrist.visible = hudK > 0.001 || !!ACT.kind;

  // ---- world side of each action (the bracelet's beam / cone, and the result) ----
  const t = ACT.t; let rayOp = 0;
  if (ACT.kind === 'door'){ doorAnchor.getWorldPosition(_w); seg(ray, 0, _v, _w); rayOp = clamp(t/0.25)*(1 - clamp((t - 1.1)/0.25))*(0.6 + Math.random()*0.4); if (t > 1.1) doorHold = 4; }
  if (ACT.kind === 'hack'){ termAnchor.getWorldPosition(_w); seg(ray, 0, _v, _w); rayOp = clamp(t/0.25)*(1 - clamp((t - 2.45)/0.25))*(0.5 + Math.random()*0.5);
    tScreenM.color.setHex(t > 2.45 ? 0x5fd6c2 : (Math.floor(t*14) % 2 ? 0x2a6c62 : 0x173c37)); if (t > 2.45) hackLit = 4; }
  ray.material.opacity = rayOp;
  doorHold = Math.max(0, doorHold - dt); doorOpen = lerp(doorOpen, doorHold > 0 ? 1 : 0, 1 - Math.exp(-dt*5));
  leafL.position.x = -0.35 - doorOpen*0.66; leafR.position.x = 0.35 + doorOpen*0.66; doorLockM.color.setHex(doorHold > 0 ? 0x2e8f80 : 0x3a1418);
  hackLit = Math.max(0, hackLit - dt); if (!ACT.kind || ACT.kind !== 'hack') tScreenM.color.setHex(hackLit > 0 ? 0x5fd6c2 : 0x1d4a44);
  const scanning = ACT.kind === 'scan' && t < 2.1;
  if (ACT.kind === 'scan'){ const sh = 0.78 + clamp(t/2.0)*0.62, rr = 0.3*(1 - 0.5*clamp((sh - 0.9)/0.5));
    scanRing.position.y = sh; scanRing.scale.setScalar(rr/0.3);
    for (let i=0;i<8;i++){ const a = i/8*Math.PI*2 + t*2; seg(cone, i, _v, _w.set(relic.position.x + Math.cos(a)*rr, sh, relic.position.z + Math.sin(a)*rr)); }
    crystalWire.material.opacity = clamp(t/2.0)*0.55*(1 - clamp((t - 3.2)/0.4)); }
  else crystalWire.material.opacity = 0;
  scanRing.material.opacity = scanning ? 0.9 : 0; cone.material.opacity = scanning ? 0.28 : 0;

  muzzle.getWorldPosition(_w); tr.t = Math.max(0, tr.t - dt); seg(tracer, 0, _w, AIM_PT); tracer.material.opacity = tr.t > 0 ? 0.9 : 0;
  dtr.t = Math.max(0, dtr.t - dt); seg(dTracer, 0, _w.set(-2.5, 4.2, -3), AIM_PT); dTracer.material.opacity = dtr.t > 0 ? 1 : 0;
  markS.material.opacity = S.mark ? 0.9 : 0;

  $('state').textContent = ACT.kind ? 'BRACELET · ' + ACT.kind.toUpperCase() : S.aim ? 'AIM' : 'HIP';
  composer.render();
  requestAnimationFrame(frame);
}
drawMark(S.mark);
requestAnimationFrame(frame);
window.__wrist = {S, ACT, dType, GEAR, PEEK, setAim, fire, act, gear};   // capture / debug hook
