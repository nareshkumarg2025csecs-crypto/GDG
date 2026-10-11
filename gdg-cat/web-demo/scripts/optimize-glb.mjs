// Optimise the Blender-exported GLB for the web: dedup/prune, WebP textures, meshopt compression.
// Usage: node scripts/optimize-glb.mjs [input.glb] [output.glb]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt, quantize } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const input = resolve(process.argv[2] ?? '../assets/3d/gdg-cat/gdg-cat.glb');
const output = resolve(process.argv[3] ?? 'public/models/gdg-cat.glb');
mkdirSync(dirname(output), { recursive: true });

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const doc = await io.read(input);
await doc.transform(
  dedup(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88 }),
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 14 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(output, doc);

const kb = (p) => (statSync(p).size / 1024).toFixed(0);
console.log(`optimised: ${kb(input)} KB -> ${kb(output)} KB  (${output})`);
