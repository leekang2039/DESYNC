// Bundles a prototype source with three.js inlined into a single offline-safe HTML page.
//   node src/build.mjs v5        → HeartTag_Cartridge_v5.html  (src/hearttag_v5.js + src/hearttag_v5.shell.html)
//   node src/build.mjs v4        → HeartTag_WristHUD_v4.html   (src/wrist_hud_v4.js + src/wrist_hud_v4.shell.html)
// Needs `three@0.160.0` and `esbuild` resolvable from here (npm i three@0.160.0 esbuild).
import {build} from 'esbuild';
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const TARGETS = {
  v4: {src: 'wrist_hud_v4.js', shell: 'wrist_hud_v4.shell.html', out: 'HeartTag_WristHUD_v4.html'},
  v5: {src: 'hearttag_v5.js', shell: 'hearttag_v5.shell.html', out: 'HeartTag_Cartridge_v5.html'},
};
const t = TARGETS[process.argv[2] || 'v5']; if (!t) throw new Error('unknown target: ' + process.argv[2]);
const here = dirname(fileURLToPath(import.meta.url));
const res = await build({entryPoints: [join(here, t.src)], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', legalComments: 'none'});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
writeFileSync(join(here, '..', t.out), readFileSync(join(here, t.shell), 'utf8').replace('/*BUNDLE*/', () => js));
console.log(t.out, (js.length/1024).toFixed(0) + ' KB script');
