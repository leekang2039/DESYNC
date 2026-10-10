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
const LEDS = [];                                    // seam LEDs keep their own material so light can chase round the cuff
for (let i=0;i<NS;i++){ const pv = new THREE.Group(); pv.rotation.z = i/NS*Math.PI*2; cuff.add(pv);
  if (i % 3 === 1){ [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(sw*0.8, 0.008, CL*0.46), s > 0 ? armorM : armorM2); p.position.set(0, CR + 0.002, s*CL*0.26); pv.add(p); }); }
  else { const p = new THREE.Mesh(new THREE.BoxGeometry(sw*0.8, 0.008 + (i%2)*0.002, CL*0.96), armorM); p.position.y = CR + 0.002; pv.add(p); }
  const lv = new THREE.Group(); lv.rotation.z = Math.PI/NS; pv.add(lv);
  const lm = ledM.clone(); LEDS.push({m: lm, a: (i + 0.5)/NS}); const led = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.004, CL*0.86), lm); led.position.y = CR; lv.add(led);
  if (i % 4 === 0){ const b = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.006), brassM); b.position.set(0, CR + 0.003, CL*0.42); lv.add(b); }
  if (i % 5 === 2){ const sq = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0015, 0.007), ledM); sq.position.set(0, CR + 0.0065, -CL*0.1); pv.add(sq); } }
[-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.TorusGeometry(CR + 0.001, 0.0022, 8, 64), M(0x15181c, .5, .6)); r.position.z = s*CL/2; cuff.add(r); });
// quick-action pulse: a thin light ring that leaves the cuff (seen from behind / when the arm is in view)
const pulseRing = new THREE.Mesh(new THREE.TorusGeometry(CR + 0.004, 0.0012, 6, 96), new THREE.MeshBasicMaterial({color: HOLO, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false}));
cuff.add(pulseRing);

// ---------------- wrist display: one camera-facing canvas centred on the cuff ----------------
// Both the aim HUD and the door / hack / scan read-outs are drawn here, so everything comes off the bracelet.
const N = 1024, C = N/2, PLANE = 0.4;              // canvas px, centre, plane size in rig units (≈2560 px / unit)
const wc = document.createElement('canvas'); wc.width = wc.height = N; const gMain = wc.getContext('2d'); let g = gMain;
const ac = document.createElement('canvas'); ac.width = ac.height = N; const gAct = ac.getContext('2d');   // actions draw here, then fold in
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
const ACT = {kind: '', t: 0, cached: false};                       // active bracelet action: 'door' | 'hack' | 'scan'
const ACT_LEN = {door: 2.6, hack: 3.4, scan: 3.6}, ACT_LEN_CACHED = {door: 0.6, hack: 0.6, scan: 0.6};
const KNOWN = new Set();                            // targets decoded once: later uses only confirm the cached key
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

// ---- decoder text: each character flickers at its own rate, flashes false hits, resolves in random order, may glitch once ----
const GLYPH = '0123456789ABCDEF#%/<>*';
const hash = (a, b) => { const x = Math.sin(a*127.1 + b*311.7)*43758.5453; return x - Math.floor(x); };
class Decoder { constructor(s='', o={}){ this.cur = s; this.prev = s; this.t0 = -1; this.base = o.base ?? 0.12; this.span = o.span ?? 0.7; this.plan(); }
  plan(){ this.cells0 = [...this.cur].map(() => ({lock: this.base + Math.random()*this.span, rate: 7 + Math.random()*26,
      relapse: Math.random() < 0.35 ? 0.05 + Math.random()*0.12 : -1, seed: Math.random()*99})); }
  set(s){ if (s === this.cur) return; this.prev = this.cur; this.cur = s; this.t0 = T; this.plan(); }
  scramble(){ this.prev = ''; this.t0 = T; this.plan(); }
  cells(){ const e = this.t0 < 0 ? 1e9 : T - this.t0; let busy = false;
    const out = [...this.cur].map((ch, i) => { const p = this.cells0[i] || {lock: 0, rate: 10, relapse: -1, seed: 0};
      if (ch === ' ' || this.prev[i] === ch) return {ch, k: 1, fl: 0};
      const step = Math.floor(e*p.rate), r = hash(p.seed, step);
      if (e < p.lock){ busy = true;
        if (r < 0.12) return {ch, k: 0.5, fl: 0};                                   // false hit: the right glyph shows for a tick
        return {ch: GLYPH[Math.floor(hash(p.seed + 7, step)*GLYPH.length)], k: 0, fl: 0, a: 0.25 + 0.5*hash(p.seed + 3, step), dy: (hash(p.seed + 5, step) - 0.5)*5}; }
      const after = e - p.lock;
      if (p.relapse > 0 && after > p.relapse && after < p.relapse + 0.06){ busy = true; return {ch: GLYPH[Math.floor(r*GLYPH.length)], k: 0, fl: 0, a: 0.8, dy: 0}; }   // one glitch back
      const fl = clamp(1 - after/0.25); if (fl > 0 || (p.relapse > 0 && after < p.relapse + 0.06)) busy = true;
      return {ch, k: 1, fl}; });
    if (!busy) this.t0 = -1; return out; }
  get busy(){ return this.t0 >= 0; } }
function drawDecode(dec, x, y, size, al=1){
  const cells = dec.cells(); g.font = `400 ${size}px ${MONO}`; const cw = g.measureText('0').width;
  cells.forEach((c, i) => { const cx = x + i*cw;
    if (c.k === 0){ text(c.ch, cx, y + (c.dy || 0), size, H((c.a ?? 0.5)*al)); return; }
    if (c.k === 0.5){ text(c.ch, cx, y, size, E(0.55*al)); return; }
    if (c.fl > 0){ g.fillStyle = W(0.45*c.fl*al); g.fillRect(cx - 1, y - size*0.45, cw*0.9, size*0.9*c.fl*0.25); }      // flash as it resolves
    text(c.ch, cx, y, size, W(al), 'left', true); });
  if (dec.busy){ const w = cw*cells.length, h = size*0.62; g.strokeStyle = E(0.6*al); g.lineWidth = 1.2;      // corner brackets while decoding
    [[x - 6, y - h, 1, 1], [x + w + 4, y - h, -1, 1], [x - 6, y + h, 1, -1], [x + w + 4, y + h, -1, -1]].forEach(([bx, by, sx, sy]) => {
      g.beginPath(); g.moveTo(bx, by + sy*8); g.lineTo(bx, by); g.lineTo(bx + sx*8, by); g.stroke(); }); } }

// ---- aim HUD: analysis tone, kept minimal — one precise arc for the magazine, and a bracketed read-out
//      led off its end, set like the CORE ANALYSIS panel (spaced caps, a rule, one big figure, quiet data rows).
const A0 = 64, A1 = 6, R_A = 200;
const PEEK = {drone: 0, mark: 0};
const AIMD = {t0: 0, rl: false, pulse: -9};
const countDec = new Decoder('24', {base: 0.04, span: 0.22}), magDec = new Decoder('3', {base: 0.06, span: 0.25});
const droneDec = new Decoder(''), gearDec = new Decoder(''), markDec = new Decoder('');
const roll = new Spring(240, 19);                    // round-type roller: turns forward, overshoots into place
let portraitUI = false;
function aimIn(){ AIMD.t0 = T; countDec.scramble(); magDec.scramble(); }
function drawRoller(x, y, size, al, sp=3){ const n = TYPES.length, p = roll.pos, moving = roll.moving;
  for (let k=Math.floor(p) - 1; k<=Math.floor(p) + 2; k++){ const d = k - p, ang = d*Math.PI/3, cs = Math.cos(ang);
    if (cs <= 0.05 || (!moving && Math.abs(d) > 0.5)) continue;
    g.save(); g.translate(x, y + Math.sin(ang)*size*1.25); g.scale(1, cs); g.globalAlpha = al*cs;
    spaced(sp); text(TYPES[((k % n) + n) % n], 0, 0, size, Math.abs(d) < 0.5 ? W(1) : E(0.7), 'left', Math.abs(d) < 0.5); spaced(0); g.restore(); }
  g.globalAlpha = 1; }
function corners(x, y, w, h, s, col){ g.strokeStyle = col; g.lineWidth = 1.5;
  [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.beginPath(); g.moveTo(cx, cy + sy*s); g.lineTo(cx, cy); g.lineTo(cx + sx*s, cy); g.stroke(); }); }
function label(s, x, y, al=1, size=12){ spaced(4); text(s, x, y, size, E(0.62*al)); spaced(0); }
const EMIT_R = 158, EMIT_A = 30;                      // laser emitter on the cuff (like the puck's eye for the map panel)
function laser(x1, y1, k, al){ if (k <= 0) return; const [ex, ey] = P(EMIT_R, EMIT_A), x = lerp(ex, x1, k), y = lerp(ey, y1, k);
  g.strokeStyle = W(al); g.lineWidth = 1; g.beginPath(); g.moveTo(ex, ey); g.lineTo(x, y); g.stroke();
  if (k < 1){ g.fillStyle = W(al); g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI*2); g.fill(); } }
// ---- aim HUD in the map's tone, minimal: four lasers off the cuff → corner brackets → a gridded glass pane opens → the figure ----
function drawAim(T){
  if (hudK <= 0) return;
  const e = T - AIMD.t0, vis = clamp(hudK/0.25);
  const kL = ease(clamp(e/0.18)), kB = ease(clamp((e - 0.14)/0.2)), kG = ease(clamp((e - 0.26)/0.22)), kT = ease(clamp((e - 0.4)/0.25));
  const rl = S.reload > 0;
  if (rl) AIMD.rl = true; else if (AIMD.rl){ AIMD.rl = false; countDec.scramble(); }
  const low = S.ammo <= 10 && !rl, pulse = low ? 0.55 + 0.45*Math.sin(T*9) : 1, shot = clamp(1 - (T - AIMD.pulse)/0.18);
  const bw = 176, bh = 104, bx = portraitUI ? C + 10 : C + 188, by = portraitUI ? C - 268 : C - 92;
  const cs = [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]];
  g.globalAlpha = vis;
  // lasers to the four corners; they stay on faintly once the pane is up, as on the map
  const lasAl = 0.75*(1 - kT) + 0.16*kT;
  cs.forEach(([x, y], i) => laser(x, y, ease(clamp((e - i*0.025)/0.18)), lasAl));
  { const [ex, ey] = P(EMIT_R, EMIT_A); g.fillStyle = W(0.9); g.beginPath(); g.arc(ex, ey, 3, 0, Math.PI*2); g.fill(); }
  if (kB > 0){ g.globalAlpha = vis*kB; corners(bx, by, bw, bh, 12*kB, shot > 0 ? W(0.6 + 0.4*shot) : W(0.9)); }
  // glass pane opening from its centre line, with the map's fine grid inside
  if (kG > 0){ const hh = bh*kG, y0 = by + bh/2 - hh/2; g.globalAlpha = vis;
    g.fillStyle = H(0.06); g.fillRect(bx + 2, y0, bw - 4, hh);
    g.save(); g.beginPath(); g.rect(bx + 2, y0, bw - 4, hh); g.clip(); g.fillStyle = H(0.07);
    for (let x = bx + 14; x < bx + bw; x += 16) g.fillRect(x, by, 1, bh);
    for (let y = by + 12; y < by + bh; y += 16) g.fillRect(bx, y, bw, 1); g.restore();
    g.fillStyle = H(0.5*(1 - kT)); g.fillRect(bx + 2, y0, bw - 4, 1); g.fillRect(bx + 2, y0 + hh - 1, bw - 4, 1); }
  if (kT <= 0){ g.globalAlpha = 1; return; }
  g.globalAlpha = vis*kT;
  // inside, laid out like the map's CORE ANALYSIS panel: a progress ring with the figure in it, a spaced-caps word, quiet rows
  label('AIM', bx + 12, by + 14, kT, 10); { g.textAlign = 'right'; spaced(3); g.font = `400 10px ${MONO}`; g.fillStyle = E(0.55*kT); g.fillText('P-07', bx + bw - 12, by + 14); spaced(0); g.textAlign = 'left'; }
  g.fillStyle = E(0.3); g.fillRect(bx + 12, by + 23, bw - 24, 1);
  // ring: the magazine as one continuous arc, a slow hexagon round it, the count decoded in its centre
  const cx = bx + 44, cy = by + 64, rr = 27, frac = rl ? clamp(1 - S.reload/1.4) : S.ammo/S.max;
  g.strokeStyle = H(0.22); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI*2); g.stroke();
  g.strokeStyle = H(0.12); g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI*2); g.stroke();
  if (frac > 0){ g.strokeStyle = (shot > 0 ? W(0.7 + 0.3*shot) : E(0.95*pulse)); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rr, -Math.PI/2, -Math.PI/2 + frac*Math.PI*2); g.stroke(); }
  g.save(); g.translate(cx, cy); g.rotate(T*0.6); g.strokeStyle = H(0.3); g.lineWidth = 1; g.beginPath();
  for (let k=0;k<6;k++){ const a = k/6*Math.PI*2; g.lineTo(Math.cos(a)*36, Math.sin(a)*36); } g.closePath(); g.stroke(); g.restore();
  countDec.set(rl ? '--' : String(S.ammo).padStart(2, '0'));
  g.font = `400 26px ${MONO}`; const cw = g.measureText('0').width;
  drawDecode(countDec, cx - cw - S.recoil*1.5, cy + 1, 26, vis*kT*(low ? pulse : 1));
  g.globalAlpha = vis*kT; text('/' + S.max, cx, cy + 19, 10, H(0.6), 'center');
  // right column: the round type as a spaced word (still the roller), a rule, two data rows
  const rx = bx + 92;
  roll.target = (() => { let t = S.type + TYPES.length*Math.floor(roll.target/TYPES.length); while (t < roll.target - 1e-6) t += TYPES.length; return t; })();
  drawRoller(rx, by + 46, 17, vis*kT, 7);
  g.globalAlpha = vis*kT; g.fillStyle = H(0.3); g.fillRect(rx, by + 60, bw - 104, 1);
  magDec.set(String(S.mags)); label('MAG', rx, by + 74, kT, 10); drawDecode(magDec, rx + 38, by + 74, 13, vis*kT);
  const rng = camera.position.distanceTo(AIM_PT).toFixed(1);
  g.globalAlpha = vis*kT; label('RNG', rx, by + 90, kT, 10); text(rng + 'm', rx + 38, by + 90, 13, W(0.9*kT));
  // contextual rows stack under the pane only while they matter (decode in, then fade)
  const rows = [];
  if (PEEK.drone > 0 || S.batt <= 20) rows.push([droneDec, 'P-07', 'BATT ' + Math.round(S.batt) + '  RD ' + S.dAmmo, Math.max(clamp(PEEK.drone/0.4), S.batt <= 20 ? 1 : 0)]); else droneDec.cur = droneDec.prev = '';
  const cool = GEAR.map((G, i) => G.left > 0 ? ['GRP', 'TAG', 'SHD'][i] + ' ' + Math.ceil(G.left) + 's' : '').filter(Boolean).join('  ');
  if (cool) rows.push([gearDec, 'GEAR', cool, 1]); else gearDec.cur = gearDec.prev = '';
  if (PEEK.mark > 0) rows.push([markDec, 'MARK', S.mark + '/3', clamp(PEEK.mark/0.4)]); else markDec.cur = markDec.prev = '';
  rows.forEach(([dec, l, v, a], i) => { const ry = by + bh + 14 + i*20; dec.set(v); g.globalAlpha = vis*kT*a;
    label(l, bx + 12, ry, kT*a, 11); drawDecode(dec, bx + 58, ry, 14, vis*kT*a); });
  g.globalAlpha = 1; }

// ---- bracelet actions: tracks freezing into a window on a short arc over the outer side of the wrist ----
const HEX = '0123456789ABCDEF';
const B0 = 80, B1 = -12, BM = (B0 + B1)/2;           // short arc (92°) and its window
const along = k => lerp(B0, B1, k);
const R_STAT = 286;
const statDec = new Decoder('');
function statLabel(s){ const [x, y] = P(R_STAT, BM + 9); spaced(4); text(s, x, y, 16, E(0.75)); spaced(0); }
function statBig(s){ statDec.set(s); const [x, y] = P(R_STAT, BM); drawDecode(statDec, x, y, 36, g.globalAlpha); }
const subDec = new Decoder('', {base: 0.05, span: 0.45});
function statSub(s){ subDec.set(s); const [x, y] = P(R_STAT, BM - 9); drawDecode(subDec, x, y + 6, 17, g.globalAlpha); }
// a cipher track: blocks scroll until `locked`, then only the window stays lit
function cipher(r, t, speed, seed, locked, w=6){ const n = 24, sh = Math.floor(t*speed);
  segBand(r, B0, B1, n, w, j => { const a = along((j + 0.5)/n), f = fall(a, BM, 44), inWin = Math.abs(a - BM) < 5;
    if (locked) return inWin ? W(1) : H(0.1*f);
    return ((j*7 + sh*3 + seed*11) % 5) < 2 ? E(0.15 + 0.6*f) : H(0.06 + 0.06*f); }, 0.3); }
// first-time decode: only the pattern, drawn large — text would not read at this distance anyway
function lockFlash(t, at, r0, r1){ const k = clamp(1 - (t - at)/0.35); if (t < at || k <= 0) return;      // the whole pattern flares once when it resolves
  for (let r = r0; r <= r1; r += 6) arc(r, B0, B1, 4, W(0.18*k)); }
function drawDoorFull(t){ const PIN = [0.35, 0.55, 0.75, 0.95], R = [180, 200, 220, 240], fade = clamp(t/0.15)*(1 - clamp((t - 2.2)/0.4));
  g.globalAlpha = fade;
  R.forEach((r, i) => { const set = t > PIN[i]; cipher(r, t, 16 + i*6, i, set, 10);
    const fl = set ? clamp(1 - (t - PIN[i])*4) : 0; if (fl > 0) arc(r, BM + 5, BM - 5, 18, W(0.5*fl)); });
  windowMarks(BM, 6.5, 166, 254); hair(264, B0, B1, 1, 6); lockFlash(t, PIN[3], 176, 244); g.globalAlpha = 1; }
function drawHackFull(t){ const LOCK = [0.9, 1.6, 2.3], R = [186, 210, 234], fade = clamp(t/0.15)*(1 - clamp((t - 3.0)/0.4));
  g.globalAlpha = fade;
  R.forEach((r, i) => { const locked = t > LOCK[i]; cipher(r, t, 14 + i*6, i, locked, 13);
    const fl = locked ? clamp(1 - (t - LOCK[i])*4) : 0; if (fl > 0) arc(r, BM + 5, BM - 5, 22, W(0.45*fl)); });
  // carrier noise riding outside the tracks until access
  const sh = Math.floor(t*30); segBand(256, B0, B1, 48, 3, j => t > 2.45 ? H(0.06) : ((j*13 + sh*5) % 7) < 2 ? E(0.55*fall(along((j + 0.5)/48), BM, 50)) : null, 0.4);
  windowMarks(BM, 6.5, 172, 248); hair(266, B0, B1, 1, 6); lockFlash(t, 2.45, 180, 240); g.globalAlpha = 1; }
function drawScanFull(t){ const p = clamp(t/2.0), fade = clamp(t/0.15)*(1 - clamp((t - 3.2)/0.4));
  g.globalAlpha = fade;
  const rot = t < 2 ? t*70 : 140 + (1 - Math.exp(-(t - 2)*7))*12;
  for (let m=-24;m<=24;m++){ const a = BM + m*4 + (rot % 4); if (a > B0 || a < B1) continue; g.globalAlpha = fade*fall(a, BM, 44);
    tick(226, a, m % 5 ? 12 : 28, m % 5 ? 2 : 3.5, E(0.9)); }
  g.globalAlpha = fade;
  const spread = p*(B0 - BM); segBand(194, B0, B1, 24, 14, j => { const a = along((j + 0.5)/24); return Math.abs(a - BM) <= spread ? E(0.3 + 0.65*fall(a, BM, 50)) : H(0.08); }, 0.3);
  windowMarks(BM, 5.5, 178, 252); hair(262, B0, B1, 1); lockFlash(t, 2.0, 186, 246); g.globalAlpha = 1; }

// already-decoded targets skip the read-out entirely (see the LED chase / pulse ring in the loop)
const drawDoor = drawDoorFull, drawHack = drawHackFull, drawScan = drawScanFull;
function drawMini(al){ const len = ACT_LEN[ACT.kind], p = clamp(ACT.t/(len*0.75)), fade = 1 - clamp((ACT.t - len + 0.3)/0.3);   // folded: just a progress arc above the HUD
  g.globalAlpha = al*fade; arc(214, 86, 72, 1, H(0.3)); arc(214, 86, lerp(86, 72, p), 3, E(0.95)); g.globalAlpha = 1; }
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
function setAim(on){ if (on && !S.aim && hudK < 0.05) aimIn(); S.aim = on; document.querySelectorAll('[data-a="aim"]').forEach(b => b.setAttribute('aria-pressed', String(on))); $('xh').classList.toggle('ads', on); }
function fire(){ if (!S.aim || S.reload > 0 || S.ammo <= 0) return; S.ammo--; AIMD.pulse = T; S.recoil = 1; S.flash = 1; S.glitch = 0.08; tr.t = 0.07; }
function reload(){ if (S.reload > 0 || S.mags <= 0 || S.ammo === S.max) return; S.reload = 1.4; S.mags--; }
const cycleType = () => { S.type = (S.type + 1) % 3; };   // dType turns to it
const mark = () => { S.mark = S.mark >= 3 ? 0 : S.mark + 1; PEEK.mark = 2; drawMark(S.mark); };
const droneFire = () => { PEEK.drone = 2.5; if (S.dAmmo > 0){ S.dAmmo--; S.batt = Math.max(0, S.batt - 6); dtr.t = 0.12; } else S.dAmmo = S.dMax; };
const gear = i => { if (GEAR[i].left <= 0) GEAR[i].left = GEAR[i].cd; };
function act(kind){ if (ACT.kind) return; ACT.kind = kind; ACT.t = 0; ACT.cached = KNOWN.has(kind);   // never takes the gun away: aiming stays live
  statDec.cur = statDec.prev = ''; subDec.cur = subDec.prev = ''; statDec.span = ACT.cached ? 0.25 : 0.7; }
const tr = {t: 0}, dtr = {t: 0};
// buttons (side rail on desktop, the on-screen dock on phones) share data-a names
const BTN = {aim: () => setAim(!S.aim), fire: () => { if (!S.aim) setAim(true); fire(); }, reload, type: cycleType, mark, drone: droneFire,
  door: () => act('door'), hack: () => act('hack'), scan: () => act('scan'), g0: () => gear(0), g1: () => gear(1), g2: () => gear(2), forget: () => KNOWN.clear()};
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
  const dt = frozen ? 0 : clamp((now - last)/1000, 0, 0.05); last = now; T += dt;   // rAF can stamp the first frame before `last`
  if (S.reload > 0){ S.reload -= dt; if (S.reload <= 0){ S.ammo = S.max; S.glitch = .1; } }
  S.recoil = Math.max(0, S.recoil - dt*9); S.flash = Math.max(0, S.flash - dt*18); S.glitch = Math.max(0, S.glitch - dt);
  GEAR.forEach(G => { if (G.left > 0 && G.left <= dt) G.ready = 0.8; G.left = Math.max(0, G.left - dt); G.ready = Math.max(0, G.ready - dt); });
  PEEK.drone = Math.max(0, PEEK.drone - dt); PEEK.mark = Math.max(0, PEEK.mark - dt);
  SPRINGS.forEach(sp => sp.step(dt));
  if (ACT.kind){ ACT.t += dt; if (ACT.t > (ACT.cached ? ACT_LEN_CACHED : ACT_LEN)[ACT.kind]){ KNOWN.add(ACT.kind); ACT.kind = ''; } }

  // pose blend: hip ↔ ads, then ↔ wrist-up while the bracelet is working
  look.x = lerp(look.x, look.tx, 1 - Math.exp(-dt*4)); look.y = lerp(look.y, look.ty, 1 - Math.exp(-dt*4));
  camera.rotation.set(-look.y*0.1, -look.x*0.16, 0, 'YXZ');
  aimK = lerp(aimK, S.aim ? 1 : 0, 1 - Math.exp(-dt*14));
  actK = lerp(actK, ACT.kind && !ACT.cached ? 1 : 0, 1 - Math.exp(-dt*(ACT.kind ? 9 : 6)));
  hudK = clamp(hudK + (S.aim ? dt/0.4 : -dt/0.16));
  const portrait = camera.aspect < 1, nar = portrait ? 0.18 : clamp(camera.aspect/1.6, 0.42, 1);   // phones: wider view, arm pulled in so cuff + arcs stay on screen
  portraitUI = portrait; const fov0 = portrait ? 66 : 55; camera.fov = lerp(fov0, fov0 - 8, aimK); camera.updateProjectionMatrix();
  _p.lerpVectors(POSE.hip.p, POSE.ads.p, aimK).lerp(POSE.wrist.p, actK*0.45*(1 - aimK));
  _q[0].setFromEuler(POSE.hip.r); _q[1].setFromEuler(POSE.ads.r); _q[2].setFromEuler(POSE.wrist.r);
  _qa.slerpQuaternions(_q[0], _q[1], aimK).slerp(_q[2], actK*0.45*(1 - aimK));   // a small wrist turn, none while aiming: the hands stay on the gun
  const sway = RM ? 0 : (1 - aimK*0.75);
  rig.scale.setScalar(portrait ? 0.44 : 0.62); rig.position.copy(_p); rig.position.x *= nar; if (portrait) rig.position.y += 0.02;
  rig.position.x += Math.sin(T*1.1)*0.003*sway - (look.tx - look.x)*0.02; rig.position.y += Math.sin(T*2.2)*0.002*sway + (look.ty - look.y)*0.015;
  const rl = S.reload > 0 ? Math.sin(clamp(1 - S.reload/1.4)*Math.PI) : 0;
  rig.position.z += S.recoil*0.022; rig.position.y -= rl*0.05;
  rig.quaternion.copy(_qa); rig.rotateX(S.recoil*0.07 - rl*0.35); rig.rotateZ(rl*0.5);
  wrist.quaternion.copy(rig.quaternion).invert();                  // display faces the eye, centred on the cuff
  const actFull = actK*(1 - aimK); wrist.scale.setScalar(lerp(1.0, 1.42, actFull)*(portrait ? lerp(1.45, 1.1, actFull) : 1));                     // action rings sit clear of the (closer) cuff
  flash.material.opacity = S.flash; flash.material.rotation = Math.random()*6; flash.scale.setScalar(0.06 + S.flash*0.06);
  crystal.rotation.y += dt*0.4;

  // bracelet seams: red at rest, cyan while it projects
  const proj = Math.max(actK, hudK*0.35);
  // repeat actions show only here: seams flash cyan with a light chasing round the cuff, and a ring pulses off it
  const quick = ACT.kind && ACT.cached, qt = quick ? ACT.t : 0, qk = quick ? clamp(qt/0.06)*(1 - clamp((qt - 0.32)/0.25)) : 0;
  const cyan = Math.max(actK, qk);
  ledM.emissive.copy(LED_RED).lerp(LED_CY, cyan); ledM.emissiveIntensity = 1.5 - cyan*0.5;
  LEDS.forEach(L => { L.m.emissive.copy(LED_RED).lerp(LED_CY, cyan); let I = 1.5 - cyan*0.5;
    if (quick && qt < 0.42){ const ph = ((qt*2.6 - L.a) % 1 + 1) % 1; const dd = Math.min(ph, 1 - ph); I += Math.exp(-dd*dd*90)*3.2; }
    else if (ACT.kind) I += Math.sin(T*18)*0.15; L.m.emissiveIntensity = I; });
  const pk = quick ? clamp((qt - 0.05)/0.45) : 1; pulseRing.scale.setScalar(1 + ease(pk)*0.9); pulseRing.material.opacity = quick ? (1 - pk)*0.9 : 0;
  cuff.getWorldPosition(_v); camera.worldToLocal(_u.copy(_v)); cuffGlow.position.copy(_u).add(new THREE.Vector3(0.03, 0.03, 0.02)); cuffGlow.intensity = proj*0.12;

  // ---- wrist display ----
  g.clearRect(0, 0, N, N);
  if (hudK > 0.001) drawAim(T);
  if (ACT.kind){   // the action keeps running while aiming; its full read-out folds into one line above the plates
    gAct.clearRect(0, 0, N, N); g = gAct;
    if (!ACT.cached){ if (ACT.kind === 'door') drawDoor(ACT.t); else if (ACT.kind === 'hack') drawHack(ACT.t); else drawScan(ACT.t); }   // repeats: no read-out at all
    g = gMain; const full = 1 - aimK; if (full > 0.02 && !ACT.cached){ g.globalAlpha = full; g.drawImage(ac, 0, 0); g.globalAlpha = 1; }
    if (aimK > 0.02 && !ACT.cached) drawMini(aimK); }
  wTex.needsUpdate = true; wrist.visible = hudK > 0.001 || !!ACT.kind;

  // ---- world side of each action (the bracelet's beam / cone, and the result) ----
  const t = ACT.t; let rayOp = 0;
  if (ACT.kind === 'door'){ doorAnchor.getWorldPosition(_w); seg(ray, 0, _v, _w); const tOpen = ACT.cached ? 0.15 : 0.95; rayOp = clamp(t/0.15)*(1 - clamp((t - tOpen)/0.2))*(0.6 + Math.random()*0.4); if (t > tOpen) doorHold = 4; }   // the door opens the moment the pins set
  if (ACT.kind === 'hack'){ termAnchor.getWorldPosition(_w); seg(ray, 0, _v, _w); const tAcc = ACT.cached ? 0.2 : 2.45; rayOp = clamp(t/0.15)*(1 - clamp((t - tAcc)/0.2))*(0.5 + Math.random()*0.5);
    tScreenM.color.setHex(t > tAcc ? 0x5fd6c2 : (Math.floor(t*14) % 2 ? 0x2a6c62 : 0x173c37)); if (t > tAcc) hackLit = 4; }
  ray.material.opacity = rayOp;
  doorHold = Math.max(0, doorHold - dt); doorOpen = lerp(doorOpen, doorHold > 0 ? 1 : 0, 1 - Math.exp(-dt*5));
  leafL.position.x = -0.35 - doorOpen*0.66; leafR.position.x = 0.35 + doorOpen*0.66; doorLockM.color.setHex(doorHold > 0 ? 0x2e8f80 : 0x3a1418);
  hackLit = Math.max(0, hackLit - dt); if (!ACT.kind || ACT.kind !== 'hack') tScreenM.color.setHex(hackLit > 0 ? 0x5fd6c2 : 0x1d4a44);
  const tScan = ACT.cached ? 0.25 : 2.0, scanning = ACT.kind === 'scan' && t < tScan + 0.05;
  if (ACT.kind === 'scan'){ const sh = 0.78 + clamp(t/tScan)*0.62, rr = 0.3*(1 - 0.5*clamp((sh - 0.9)/0.5));
    scanRing.position.y = sh; scanRing.scale.setScalar(rr/0.3);
    for (let i=0;i<8;i++){ const a = i/8*Math.PI*2 + t*2; seg(cone, i, _v, _w.set(relic.position.x + Math.cos(a)*rr, sh, relic.position.z + Math.sin(a)*rr)); }
    crystalWire.material.opacity = clamp(t/tScan)*0.55*(1 - clamp((t - tScan - 1.0)/0.4)); }
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
let frozen = false;
window.__wrist = {S, ACT, KNOWN, roll, GEAR, PEEK, AIMD, setAim, fire, act, gear, now: () => T, freeze: v => { frozen = v; }};   // capture / debug hook   // capture / debug hook
