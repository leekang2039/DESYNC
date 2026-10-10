// Builds HeartTag_WristHUD_v4.html: bundles src/wrist_hud_v4.js with three.js inlined so the page opens
// offline / in sandboxed previews (no CDN). Needs `npm i three@0.160.0 esbuild` somewhere on NODE_PATH or here.
//   node src/build_wrist_hud_v4.mjs
import {build} from 'esbuild';
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = await build({entryPoints: [join(here, 'wrist_hud_v4.js')], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', legalComments: 'none'});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const shell = readFileSync(join(here, 'wrist_hud_v4.shell.html'), 'utf8');
writeFileSync(join(here, '..', 'HeartTag_WristHUD_v4.html'), shell.replace('/*BUNDLE*/', () => js));
console.log('HeartTag_WristHUD_v4.html', (js.length/1024).toFixed(0) + ' KB script');
