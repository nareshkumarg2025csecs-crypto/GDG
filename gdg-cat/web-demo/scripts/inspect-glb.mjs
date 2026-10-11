// Decode the shipped GLB (meshopt + WebP) and report scene stats / bounds, to sanity-check camera framing.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2] ?? 'public/models/gdg-cat.glb');
const root = doc.getRoot();
let tris = 0, verts = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  verts += p.getAttribute('POSITION').getCount();
  tris += (p.getIndices()?.getCount() ?? 0) / 3;
}
const b = getBounds(root.listScenes()[0]);
console.log('meshes', root.listMeshes().length, 'materials', root.listMaterials().length, 'textures', root.listTextures().length);
console.log('verts', verts, 'tris', Math.round(tris));
console.log('bounds min', b.min.map((v) => +v.toFixed(3)), 'max', b.max.map((v) => +v.toFixed(3)));
console.log('size', b.max.map((v, i) => +(v - b.min[i]).toFixed(3)));
console.log('texture mime', [...new Set(root.listTextures().map((t) => t.getMimeType()))].join(','));
