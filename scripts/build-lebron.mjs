import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.argv.find(a => a.startsWith('--src='))?.slice(6);
if (!SRC) { console.error('build-lebron: --src=<path/to/source.fbx> is required'); process.exit(1); }
const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender';
mkdirSync('public/models', { recursive: true });

const py = `
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=r"${SRC}")
bpy.ops.export_scene.gltf(filepath="/tmp/lebron_raw.glb", export_format='GLB', export_yup=True)
`;
writeFileSync('/tmp/_blender_lebron.py', py);
execFileSync(BLENDER, ['--background', '--python', '/tmp/_blender_lebron.py'], { stdio: 'inherit' });
// Draco + WebP + prune; keep it conservative (no aggressive simplify — preserve silhouette).
execFileSync('npx', ['@gltf-transform/cli', 'optimize', '/tmp/lebron_raw.glb',
  'public/models/lebron.glb', '--texture-compress', 'webp', '--compress', 'draco'], { stdio: 'inherit' });
writeFileSync('public/models/lebron-LICENSE.txt',
  'Hero model: AI-generated via Tripo (tripo_pbr_model). Placeholder hero asset — replace with a licensed model before any public/commercial launch.\n');
console.log('built public/models/lebron.glb');
