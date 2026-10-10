// Service weapon concept v1 · ammo-type morph — source. Built into DESYNC_ServiceWeapon_v1.html (three.js inlined)
// by `node src/build.mjs sw1`.
// The pistol grip + frame never move. Changing the round type lifts the upper shell apart into floating segments that
// re-seat into a new silhouette: STD (compact slide) · AP (split rail channel + heat-sink bridges) · EMP (coil rings + prongs).
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const fail = msg => { $('err').textContent = msg; $('fallback').hidden = false; $('fallback').textContent = msg; };
const MONO = '"Share Tech Mono", ui-monospace, Consolas, monospace';
const D2R = Math.PI/180, clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a)*k;
const ease = k => k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------- round types ----------------
const TYPES = [
  {id: 'STD', name: '표준탄', col: 0x78ECD6, max: 18, muzzle: -0.183},
  {id: 'AP',  name: '관통탄', col: 0xFFB45A, max: 6,  muzzle: -0.326},
  {id: 'EMP', name: 'EMP탄',  col: 0x7FA8FF, max: 4,  muzzle: -0.256},
];

let renderer;
try { renderer = new THREE.WebGLRenderer({canvas: $('c'), antialias: true}); }
catch (e) { fail('WebGL을 시작할 수 없어요. 하드웨어 가속을 켠 브라우저(Chrome/Edge)에서 열어 주세요.'); throw e; }
const cv = $('c'), stage = cv.parentElement;
renderer.setPixelRatio(Math.min(1.75, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x04070a); scene.fog = new THREE.FogExp2(0x04070a, 0.22);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(32, 1, 0.005, 40); scene.add(camera);
scene.add(new THREE.HemisphereLight(0x9fbfd0, 0x07090b, 0.35));
const key = new THREE.DirectionalLight(0xe6eef5, 1.6); key.position.set(1.5, 3, 2); scene.add(key);
const rimA = new THREE.PointLight(0x78ECD6, 0.6, 2, 2); rimA.position.set(-0.4, 1.15, 0.2); scene.add(rimA);
const rimB = new THREE.PointLight(0x78ECD6, 0.35, 2, 2); rimB.position.set(0.3, 1.0, 0.25); scene.add(rimB);

// ---------------- armory plinth ----------------
const G0 = new THREE.Vector3(0, 1.2, 0);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.165, 0.02, 64), new THREE.MeshStandardMaterial({color: 0x15191d, roughness: .5, metalness: .6}));
plinth.position.set(0, 1.03, -0.1); scene.add(plinth);
const ringM = new THREE.MeshBasicMaterial({color: 0x78ECD6, toneMapped: false, transparent: true, opacity: .45});
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.0009, 8, 128), ringM); ring.rotation.x = Math.PI/2; ring.position.set(0, 1.041, -0.1); scene.add(ring);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.0005, 8, 128), ringM); ring2.rotation.x = Math.PI/2; ring2.position.set(0, 1.041, -0.1); scene.add(ring2);
const grid = new THREE.GridHelper(4, 80, 0x1d3b37, 0x0f1c1b); grid.position.y = 1.0; scene.add(grid);

// ---------------- materials ----------------
const shellM = new THREE.MeshPhysicalMaterial({color: 0xa9b0b6, roughness: .46, metalness: .08, clearcoat: .6, clearcoatRoughness: .35});
const graphM = new THREE.MeshPhysicalMaterial({color: 0x1d2227, roughness: .55, metalness: .35, clearcoat: .2});
const metalM = new THREE.MeshStandardMaterial({color: 0x3a4149, roughness: .28, metalness: .9});
const accM = new THREE.MeshBasicMaterial({color: 0x78ECD6, toneMapped: false});

// ---------------- fixed core: grip + frame (never move) ----------------
const gun = new THREE.Group(); gun.position.copy(G0); scene.add(gun);
const body = new THREE.Group(); gun.add(body);   // recoil moves this
function extrude(shape, depth, mat, holes){ if (holes) shape.holes.push(...holes);
  const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0018, bevelSegments: 3, curveSegments: 16});
  g.translate(0, 0, -depth/2); g.rotateY(Math.PI/2);   // shape x → gun forward (−z), extrusion → width (x)
  const m = new THREE.Mesh(g, mat); body.add(m); return m; }
{ const s = new THREE.Shape(); s.moveTo(-0.012, 0.033); s.lineTo(0.036, 0.031); s.lineTo(0.031, -0.008); s.lineTo(0.019, -0.071);
  s.quadraticCurveTo(0.002, -0.079, -0.016, -0.071); s.lineTo(-0.007, -0.010); s.quadraticCurveTo(-0.016, 0.012, -0.012, 0.033); extrude(s, 0.024, graphM); }
{ const s = new THREE.Shape(); s.moveTo(0.028, 0.034); s.lineTo(0.176, 0.034); s.lineTo(0.176, 0.022); s.lineTo(0.088, 0.020);
  s.quadraticCurveTo(0.084, -0.013, 0.060, -0.015); s.lineTo(0.034, -0.013); s.lineTo(0.029, 0.0); s.closePath();
  const h = new THREE.Path(); h.moveTo(0.040, 0.015); h.quadraticCurveTo(0.041, -0.006, 0.056, -0.007); h.quadraticCurveTo(0.074, -0.006, 0.076, 0.015); h.closePath();
  extrude(s, 0.022, graphM, [h]); }
const trig = new THREE.Mesh(new RoundedBoxGeometry(0.005, 0.02, 0.006, 2, 0.002), metalM); trig.position.set(0, 0.006, -0.052); trig.rotation.x = -0.25; body.add(trig);
const coreSlit = new THREE.Mesh(new THREE.BoxGeometry(0.0285, 0.0035, 0.024), accM); coreSlit.position.set(0, 0.027, -0.006); body.add(coreSlit);
const magBand = new THREE.Mesh(new THREE.BoxGeometry(0.0285, 0.003, 0.03), accM); magBand.position.set(0, -0.068, 0.002); magBand.rotation.x = -0.2; body.add(magBand);
const magBase = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.008, 0.038, 2, 0.003), graphM); magBase.position.set(0, -0.076, 0.002); magBase.rotation.x = -0.2; body.add(magBase);

// rear-facing ammo screen — the counter the player reads over the sights
const dc = document.createElement('canvas'); dc.width = 256; dc.height = 296; const dg = dc.getContext('2d');
const dTex = new THREE.CanvasTexture(dc); dTex.colorSpace = THREE.SRGBColorSpace;
const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.0278), new THREE.MeshBasicMaterial({map: dTex, toneMapped: false, transparent: true}));
disp.position.set(0, 0.052, 0.0185); body.add(disp);
const dispBack = new THREE.Mesh(new RoundedBoxGeometry(0.028, 0.032, 0.004, 2, 0.0015), graphM); dispBack.position.set(0, 0.052, 0.0158); body.add(dispBack);

// ---------------- morphing shell: one pool of segments, each round type is a pose of the pool ----------------
const unitBox = new RoundedBoxGeometry(1, 1, 1, 3, 0.06);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 24).rotateX(Math.PI/2);
const torusD = new THREE.TorusGeometry(1, 0.2, 10, 48), torusG = new THREE.TorusGeometry(1, 0.08, 8, 48);
const SPEC = [
  ['Lr', unitBox, shellM], ['Rr', unitBox, shellM], ['Lf', unitBox, shellM], ['Rf', unitBox, shellM],
  ['chan', unitBox, accM], ['seam', unitBox, accM], ['barrel', unitCyl, metalM], ['cap', unitBox, graphM],
  ['under', unitBox, graphM], ['optic', unitBox, graphM], ['lens', unitBox, accM],
  ['f0', unitBox, graphM], ['f1', unitBox, graphM], ['f2', unitBox, graphM],
  ['c0', torusD, metalM], ['c1', torusD, metalM], ['c2', torusD, metalM],
  ['g0', torusG, accM], ['g1', torusG, accM], ['g2', torusG, accM],
];
const parts = SPEC.map(([n, geo, mat]) => { const m = new THREE.Mesh(geo, mat); m.name = n; body.add(m); return m; });
const Q0 = new THREE.Quaternion();
const P = (x, y, z, sx, sy, sz, q=Q0) => ({p: new THREE.Vector3(x, y, z), q: q.clone(), s: new THREE.Vector3(sx, sy, sz)});
const HIDE = (x=0, y=0.05, z=-0.11) => P(x, y, z, 0, 0, 0);
function prongQ(a, tilt){ const qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
  const qt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-Math.sin(a), Math.cos(a), 0), -tilt); return qt.multiply(qz); }
const prong = (deg, r=0.019, z=-0.232) => { const a = deg*D2R; return P(r*Math.cos(a), 0.05 + r*Math.sin(a), z, 0.005, 0.005, 0.04, prongQ(a, 0.1)); };
const FORMS = [
  // STD · compact two-piece slide, a hairline seam, short barrel
  [P(-0.0078, 0.051, -0.030, 0.0145, 0.034, 0.082), P(0.0078, 0.051, -0.030, 0.0145, 0.034, 0.082),
   P(-0.0078, 0.051, -0.118, 0.0145, 0.032, 0.086), P(0.0078, 0.051, -0.118, 0.0145, 0.032, 0.086),
   P(0, 0.051, -0.085, 0.0016, 0.030, 0.15), P(0, 0.051, -0.0725, 0.0292, 0.030, 0.0018),
   P(0, 0.05, -0.170, 0.0055, 0.0055, 0.024), P(0, 0.05, -0.1675, 0.03, 0.03, 0.009),
   P(0, 0.017, -0.140, 0.02, 0.008, 0.06), P(0, 0.0715, -0.006, 0.018, 0.008, 0.012), P(0, 0.0716, 0.0005, 0.012, 0.003, 0.0012),
   HIDE(), HIDE(), HIDE(), HIDE(0, 0.05, -0.17), HIDE(0, 0.05, -0.17), HIDE(0, 0.05, -0.17), HIDE(0, 0.05, -0.17), HIDE(0, 0.05, -0.17), HIDE(0, 0.05, -0.17)],
  // AP · the slide splits open into two long rails around a lit channel, heat-sink bridges over it, tall optic
  [P(-0.012, 0.052, -0.040, 0.0145, 0.030, 0.11), P(0.012, 0.052, -0.040, 0.0145, 0.030, 0.11),
   P(-0.0115, 0.054, -0.212, 0.011, 0.022, 0.222), P(0.0115, 0.054, -0.212, 0.011, 0.022, 0.222),
   P(0, 0.047, -0.16, 0.004, 0.026, 0.32), P(0, 0.052, -0.0975, 0.037, 0.028, 0.0022),
   P(0, 0.05, -0.17, 0.0035, 0.0035, 0.30), P(0, 0.040, -0.321, 0.035, 0.008, 0.01),
   P(0, 0.020, -0.200, 0.012, 0.008, 0.21), P(0, 0.078, -0.035, 0.016, 0.018, 0.064), P(0, 0.078, -0.0025, 0.011, 0.011, 0.0012),
   P(0, 0.0675, -0.145, 0.034, 0.0035, 0.005), P(0, 0.0675, -0.195, 0.034, 0.0035, 0.005), P(0, 0.0675, -0.245, 0.034, 0.0035, 0.005),
   HIDE(0, 0.05, -0.2), HIDE(0, 0.05, -0.2), HIDE(0, 0.05, -0.2), HIDE(0, 0.05, -0.2), HIDE(0, 0.05, -0.2), HIDE(0, 0.05, -0.2)],
  // EMP · a taller, shorter body ending in an emitter face, three coil rings on a fat barrel, three discharge prongs
  [P(-0.0078, 0.054, -0.035, 0.0145, 0.040, 0.094), P(0.0078, 0.054, -0.035, 0.0145, 0.040, 0.094),
   P(-0.0078, 0.051, -0.105, 0.0145, 0.030, 0.040), P(0.0078, 0.051, -0.105, 0.0145, 0.030, 0.040),
   P(0, 0.054, -0.07, 0.0016, 0.036, 0.11), P(0, 0.052, -0.0835, 0.0292, 0.034, 0.0022),
   P(0, 0.05, -0.178, 0.0075, 0.0075, 0.115), P(0, 0.05, -0.127, 0.034, 0.034, 0.006),
   P(0, 0.011, -0.100, 0.024, 0.018, 0.06), P(0, 0.079, -0.022, 0.02, 0.01, 0.016), P(0, 0.0795, -0.0135, 0.014, 0.004, 0.0012),
   prong(90), prong(210), prong(330),
   P(0, 0.05, -0.144, 0.021, 0.021, 0.021), P(0, 0.05, -0.168, 0.021, 0.021, 0.021), P(0, 0.05, -0.192, 0.021, 0.021, 0.021),
   P(0, 0.05, -0.140, 0.0172, 0.0172, 0.0172), P(0, 0.05, -0.164, 0.0172, 0.0172, 0.0172), P(0, 0.05, -0.188, 0.0172, 0.0172, 0.0172)],
];
const prongIdx = [11, 12, 13];
const cur = parts.map(() => P(0, 0, 0, 0, 0, 0)), from = parts.map(() => P(0, 0, 0, 0, 0, 0)), dirs = parts.map(() => new THREE.Vector3());
const apply = () => parts.forEach((m, i) => { const c = cur[i]; m.position.copy(c.p); m.quaternion.copy(c.q);
  m.scale.set(Math.max(c.s.x, 1e-4), Math.max(c.s.y, 1e-4), Math.max(c.s.z, 1e-4)); m.visible = Math.max(c.s.x, c.s.y, c.s.z) > 2e-4; });
FORMS[0].forEach((f, i) => { cur[i].p.copy(f.p); cur[i].q.copy(f.q); cur[i].s.copy(f.s); }); apply();

// sweep ring that runs down the barrel while the shell re-seats
const sweepM = new THREE.MeshBasicMaterial({color: 0x78ECD6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
const sweep = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.0007, 6, 64), sweepM); sweep.position.y = 0.045; body.add(sweep);

// EMP arcs between the prong tips (idle crackle, burst on fire)
const ARCN = 3, ARCSEG = 6;
const arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARCN*ARCSEG*2*3), 3));
const arcM = new THREE.LineBasicMaterial({color: 0x7FA8FF, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
const arcs = new THREE.LineSegments(arcGeo, arcM); arcs.frustumCulled = false; body.add(arcs);
const tip = (i, out) => { const m = parts[prongIdx[i]]; return out.set(0, 0, -0.5).multiply(m.scale).applyQuaternion(m.quaternion).add(m.position); };
const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tmp = new THREE.Vector3();
function jitterArcs(amp){ const a = arcGeo.attributes.position.array; let w = 0;
  for (let n = 0; n < ARCN; n++){ tip(n, tA); tip((n + 1)%ARCN, tB); let prev = tA.clone();
    for (let k = 1; k <= ARCSEG; k++){ const t = k/ARCSEG; tmp.lerpVectors(tA, tB, t);
      if (k < ARCSEG) tmp.add(new THREE.Vector3((Math.random() - .5)*amp, (Math.random() - .5)*amp, (Math.random() - .5)*amp*0.6));
      a[w++] = prev.x; a[w++] = prev.y; a[w++] = prev.z; a[w++] = tmp.x; a[w++] = tmp.y; a[w++] = tmp.z; prev = tmp.clone(); } }
  arcGeo.attributes.position.needsUpdate = true; }

// ---------------- fire FX ----------------
const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.05, TYPES[0].muzzle); body.add(muzzle);
const flashT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const flashM = new THREE.SpriteMaterial({map: flashT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
const flash = new THREE.Sprite(flashM); flash.scale.setScalar(0.07); muzzle.add(flash);
const tracerM = new THREE.MeshBasicMaterial({color: 0xFFB45A, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
const tracer = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 4, 8).rotateX(Math.PI/2).translate(0, 0, -2), tracerM); muzzle.add(tracer);
const shockM = new THREE.MeshBasicMaterial({color: 0x7FA8FF, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide});
const shock = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 64), shockM); muzzle.add(shock);

// ---------------- state ----------------
const S = {type: 0, to: 0, t: 1, dur: RM ? 0.25 : 0.85, ammo: TYPES.map(t => t.max), fx: 0, recoil: 0, reload: 0, arcT: 0, arcK: 0, dry: 0,
  yaw: 62*D2R, pitch: 14*D2R, view: 0, auto: !RM, drag: null, freeze: false};
const VIEWS = [{name: '3/4', yaw: 62, pitch: 14, R: 0.6, tz: -0.1}, {name: '측면', yaw: 90, pitch: 3, R: 0.6, tz: -0.1}, {name: '시선', yaw: 9, pitch: 13, R: 0.34, tz: -0.16}];
const cA = new THREE.Color(), cB = new THREE.Color(), cMix = new THREE.Color();

function setType(i){ i = ((i % TYPES.length) + TYPES.length) % TYPES.length; if (i === S.to) return;
  cA.copy(accNow()); S.type = S.to; S.to = i; S.t = 0;
  parts.forEach((m, k) => { from[k].p.copy(cur[k].p); from[k].q.copy(cur[k].q); from[k].s.copy(cur[k].s);
    const f = FORMS[i][k]; tmp.addVectors(from[k].p, f.p).multiplyScalar(0.5); const d = new THREE.Vector3(tmp.x, tmp.y - 0.05, 0);
    dirs[k].copy(d.length() < 0.004 ? new THREE.Vector3(0, 1, 0) : d.normalize()).add(new THREE.Vector3(0, 0.3, (k % 3 - 1)*0.25)).normalize(); });
  decodeTag(TYPES[i].id + ' · ' + TYPES[i].name); $('tag').style.color = '#' + new THREE.Color(TYPES[i].col).getHexString(); syncUI(); }
const accNow = () => cMix;
const morphing = () => S.t < 1;

function fire(){ const ty = TYPES[S.to];
  if (morphing() || S.reload > 0) return;
  if (S.ammo[S.to] <= 0){ S.dry = 0.4; return; }
  S.ammo[S.to]--; S.fx = 1; S.recoil = S.to === 1 ? 1.3 : S.to === 2 ? 0.8 : 1; if (S.to === 2) S.arcK = 1; drawDisp(); }
function reload(){ if (morphing() || S.reload > 0 || S.ammo[S.to] === TYPES[S.to].max) return; S.reload = 1; }

// ---------------- ammo screen ----------------
function drawDisp(){ const W = dc.width, Hh = dc.height, ty = TYPES[S.to], hex = '#' + cMix.clone().multiplyScalar(1/Math.max(1, cMix.r, cMix.g, cMix.b)).getHexString();
  dg.clearRect(0, 0, W, Hh); dg.fillStyle = 'rgba(4,8,10,.92)'; dg.fillRect(0, 0, W, Hh);
  dg.strokeStyle = hex; dg.globalAlpha = .5; dg.lineWidth = 3; dg.strokeRect(10, 10, W - 20, Hh - 20); dg.globalAlpha = 1;
  dg.fillStyle = hex; dg.textAlign = 'center'; dg.textBaseline = 'middle';
  if (morphing()){ const chars = '0123456789ABCDEF<>/#'; let s = ''; for (let i = 0; i < 3; i++) s += chars[Math.floor(Math.random()*chars.length)];
    dg.font = `600 40px ${MONO}`; dg.globalAlpha = .7; dg.fillText(s, W/2, 64); dg.font = `600 120px ${MONO}`; dg.fillText('--', W/2, 168); dg.globalAlpha = 1; }
  else { dg.font = `600 44px ${MONO}`; dg.fillText(ty.id.split('').join(' '), W/2, 62);
    const n = S.ammo[S.to]; dg.font = `600 128px ${MONO}`; dg.globalAlpha = S.reload > 0 ? 0.35 : 1; dg.fillText(String(n).padStart(2, '0'), W/2, 168); dg.globalAlpha = 1;
    dg.font = `400 30px ${MONO}`; dg.globalAlpha = .6; dg.fillText('/' + ty.max, W/2, 238); dg.globalAlpha = 1; }
  const k = morphing() ? S.t : S.reload > 0 ? 1 - S.reload : S.ammo[S.to]/ty.max;
  dg.globalAlpha = .25; dg.fillRect(30, Hh - 34, W - 60, 6); dg.globalAlpha = 1; dg.fillRect(30, Hh - 34, (W - 60)*k, 6);
  dTex.needsUpdate = true; }

// ---------------- post ----------------
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.35, 0.92); composer.addPass(bloom); composer.addPass(new OutputPass());
function resize(){ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
  camera.aspect = w/h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage); resize();

// ---------------- camera: orbit around the plinth ----------------
const T = new THREE.Vector3();
function placeCamera(){ const v = VIEWS[S.view], half = Math.tan(camera.fov*D2R/2);
  const need = v.R < 0.5 ? v.R : Math.max(v.R, (camera.aspect < 1 ? 0.19 : 0.23)/(half*camera.aspect) + 0.04, 0.2/half);
  const R = camera.aspect < 1 && v.R < 0.5 ? v.R*1.35 : need;
  T.set(0, G0.y + 0.03, v.tz);
  camera.position.set(T.x + R*Math.sin(S.yaw)*Math.cos(S.pitch), T.y + R*Math.sin(S.pitch), T.z + R*Math.cos(S.yaw)*Math.cos(S.pitch)); camera.lookAt(T); }
function setView(i){ S.view = i; const v = VIEWS[i]; S.yaw = v.yaw*D2R; S.pitch = v.pitch*D2R; if (i === 2) S.auto = false; syncUI(); }
cv.addEventListener('pointerdown', e => { S.drag = {x: e.clientX, y: e.clientY, yaw: S.yaw, pitch: S.pitch, moved: false}; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { const d = S.drag; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
  if (Math.abs(dx) + Math.abs(dy) > 5){ d.moved = true; S.auto = false; syncUI(); }
  S.yaw = d.yaw - dx*0.008; S.pitch = clamp(d.pitch + dy*0.006, -0.35, 1.2); });
cv.addEventListener('pointerup', () => { if (S.drag && !S.drag.moved) fire(); S.drag = null; });

// ---------------- UI ----------------
let tagTimer = 0;
function decodeTag(text){ const el = $('tag'), chars = 'ABCDEF0123456789#/<>', start = performance.now(), dur = RM ? 0 : 520;
  const lock = text.split('').map((_, i) => (0.25 + Math.random()*0.75)*dur);
  cancelAnimationFrame(tagTimer);
  const step = now => { const e = now - start; el.textContent = text.split('').map((c, i) => c === ' ' || e >= lock[i] ? c : chars[Math.floor(Math.random()*chars.length)]).join('');
    if (e < dur) tagTimer = requestAnimationFrame(step); else el.textContent = text; };
  tagTimer = requestAnimationFrame(step); }
function syncUI(){ document.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.t === S.to)));
  document.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === S.view)));
  document.querySelectorAll('[data-a="auto"]').forEach(b => b.setAttribute('aria-pressed', String(S.auto))); }
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.t) setType(+b.dataset.t); else if (b.dataset.v) setView(+b.dataset.v);
  else if (b.dataset.a === 'fire') fire(); else if (b.dataset.a === 'reload') reload(); else if (b.dataset.a === 'next') setType(S.to + 1);
  else if (b.dataset.a === 'auto'){ S.auto = !S.auto; syncUI(); } });
addEventListener('keydown', e => { if (e.repeat) return; const k = e.key.toLowerCase();
  if (k === '1' || k === '2' || k === '3') setType(+k - 1); else if (k === 't' || k === 'q') setType(S.to + 1);
  else if (k === 'f' || k === ' ') { e.preventDefault(); fire(); } else if (k === 'r') reload(); else if (k === 'c') setView((S.view + 1) % VIEWS.length); });

// ---------------- loop ----------------
const qSpin = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
let last = performance.now(), clock = 0;
function frame(now){ requestAnimationFrame(frame);
  const dt = S.freeze ? 0 : clamp((now - last)/1000, 0, 0.05); last = now; clock += dt;
  // morph
  if (S.t < 1){ S.t = Math.min(1, S.t + dt/S.dur); const N = parts.length;
    parts.forEach((m, i) => { const d0 = (i/(N - 1))*0.32, k = clamp((S.t - d0)/0.68), e = ease(k), lift = Math.sin(Math.PI*k), f = FORMS[S.to][i], c = cur[i];
      c.p.lerpVectors(from[i].p, f.p, e).addScaledVector(dirs[i], lift*(i < 4 ? 0.03 : 0.02));
      c.q.slerpQuaternions(from[i].q, f.q, e); qSpin.setFromAxisAngle(zAxis, lift*0.55*(i % 2 ? 1 : -1)); c.q.premultiply(qSpin);
      c.s.lerpVectors(from[i].s, f.s, e); });
    apply(); }
  const e = ease(S.t), pulse = Math.sin(Math.PI*S.t);
  cB.setHex(TYPES[S.to].col); cMix.copy(cA).lerp(cB, e);
  const glow = 0.85 + pulse*1.4 + S.fx*1.5 - S.reload*0.6 + (S.dry > 0 ? Math.sin(clock*60)*0.5 : 0);
  accM.color.copy(cMix).multiplyScalar(glow);
  ringM.color.copy(cMix); sweepM.color.copy(cMix).multiplyScalar(2); rimA.color.copy(cMix); rimB.color.copy(cMix);
  rimA.intensity = 0.6 + pulse*1.5; flashM.color.copy(cMix).lerp(new THREE.Color(1, 1, 1), 0.5);
  sweepM.opacity = pulse*0.9; sweep.position.z = lerp(0.02, TYPES[S.to].muzzle, ease(S.t)); sweep.scale.setScalar(1 + pulse*0.3);
  muzzle.position.z = lerp(TYPES[S.type].muzzle, TYPES[S.to].muzzle, e);
  // fx
  S.fx = Math.max(0, S.fx - dt*7); flashM.opacity = S.fx; flash.scale.setScalar(0.04 + S.fx*(S.to === 1 ? 0.07 : 0.05));
  tracerM.opacity = S.to === 1 ? S.fx*0.9 : 0;
  shockM.opacity = S.to === 2 ? S.fx*0.8 : 0; shock.scale.setScalar(0.01 + (1 - S.fx)*0.06);
  S.recoil = Math.max(0, S.recoil - dt*9); body.position.z = S.recoil*0.012; body.rotation.x = S.recoil*0.06;
  if (S.reload > 0){ S.reload = Math.max(0, S.reload - dt/1.1); if (S.reload === 0) S.ammo[S.to] = TYPES[S.to].max; }
  S.dry = Math.max(0, S.dry - dt);
  // EMP arcs
  const empK = S.to === 2 ? e : (S.type === 2 ? 1 - e : 0);
  S.arcK = Math.max(0, S.arcK - dt*3); S.arcT -= dt;
  if (empK > 0.9 && S.arcT <= 0){ S.arcT = 0.05; jitterArcs(0.006 + S.arcK*0.01); arcM.opacity = S.arcK > 0 ? 0.6 + S.arcK*0.4 : (Math.random() < 0.12 ? 0.55 : 0); }
  if (empK < 0.9) arcM.opacity = 0;
  arcM.color.copy(cMix).multiplyScalar(1.5);
  // float + turntable
  gun.position.y = G0.y + (RM ? 0 : Math.sin(clock*1.1)*0.003);
  if (S.auto && !S.drag) S.yaw += dt*0.22;
  ring.rotation.z += dt*0.2;
  placeCamera();
  if (morphing() || S.reload > 0 || S.fx > 0.9 || (now|0) % 3 === 0) drawDisp();
  composer.render(); }
cA.setHex(TYPES[0].col); cMix.copy(cA); syncUI(); decodeTag('STD · 표준탄'); drawDisp();
requestAnimationFrame(frame);

window.__sw = {S, setType, fire, reload, setView, snap: () => { S.t = 0.9999; }, at: t => { S.t = t; }, freeze: v => { S.freeze = v; }};
