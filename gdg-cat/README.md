# GDG Kitten Mascot — 3D asset + React component

Procedurally built in Blender (`bpy`), reconstructed from the supplied turnaround sheet
(`ref/turnaround.png`). The face is projected from the reference photo onto the head mesh.

```
assets/3d/gdg-cat/
  gdg-cat.blend      editable Blender scene (collections: Cat, Jacket, Jeans, Decals)
  gdg-cat.glb        full-quality export (≈16 MB, PNG textures)
  textures/          source + baked textures (head_albedo_baked.png is the projected face)
  renders/           8 turnaround renders, compare/ (reference vs render), turnaround_render.png
tools/
  make_textures.py   fur / fabric / denim / logo textures (colours sampled from the sheet)
  build_cat.py       builds the model, bakes the face, saves .blend, exports GLB
  render_previews.py renders the 8 views + side-by-side comparison with the reference
web-demo/            standalone Vite + React + TS demo (component is drop-in for your repo)
  src/components/3d/GdgCatMascot.tsx   public component (lazy, poster fallback, reduced motion)
  src/components/3d/GdgCatScene.tsx    R3F canvas, lights, controls (lazy-loaded chunk)
  scripts/optimize-glb.mjs             WebP textures + meshopt → public/models/gdg-cat.glb (≈2.8 MB)
  public/models/gdg-cat.glb, gdg-cat-poster.png
```

## Regenerate the model

```bash
pip install --break-system-packages bpy numpy pillow     # bpy needs Python 3.13 for bpy 5.x wheels
python3 -I tools/make_textures.py
python3 -I tools/build_cat.py                            # → .blend + .glb
python3 -I tools/render_previews.py 24                   # → renders/ (24 samples, CPU Cycles)
cd web-demo && npm install && npm run optimize:glb       # → public/models/gdg-cat.glb
```

## Run / build the demo

```bash
cd web-demo
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build
```

## Use in your site (React + TS + Tailwind + Framer Motion)

```bash
npm i three @react-three/fiber@8 @react-three/drei@9      # match your React version (R3F 8 ↔ React 18)
npm i -D @types/three
```

Copy `web-demo/src/components/3d/` to `src/components/3d/` and
`web-demo/public/models/*` to `public/models/` in your repo, then:

```tsx
import GdgCatMascot from '@/components/3d/GdgCatMascot';

<GdgCatMascot className="w-72 md:w-96" />                       // interactive, drag to rotate
<GdgCatMascot interactive={false} animate />                    // decorative hero: gentle sway, no controls
<GdgCatMascot cameraPosition={[3.7, 1.15, -3.7]} animate={false} /> // fixed camera angle
```

| Want to change | Prop |
| --- | --- |
| Camera angle / distance | `cameraPosition` (default `[0, 1.15, 5.2]`; kitten faces the camera along +Z), `target`, `fov` |
| Model size in frame | `scale` (or just size the wrapper; it is responsive, 3:4 aspect) |
| Lighting | `lightIntensity` multiplier (three directional lights + procedural studio environment, no HDR download) |
| Motion | `animate` (auto-disabled by `prefers-reduced-motion`), `interactive` |
| Shadow | `shadow={false}` |

The component shows `gdg-cat-poster.png` until the 3D scene is ready and permanently if WebGL or the GLB
fails, so the page never depends on it. The three.js bundle is a separate lazy chunk that loads only when
the mascot is within 200 px of the viewport; rendering pauses when scrolled away and GPU resources are
disposed on unmount.

## Known limitations (see final report)

* Logo: only the multicolour mark is reproduced (cropped from the sheet, ~50 px source). The
  "Google Developer Groups" caption is illegible in the sheet and is intentionally **not** reproduced.
  Supply the official SVG/PNG to get a crisp logo + caption.
* Fur is texture/normal-map/sheen based (no strand geometry), so silhouettes are smoother than the photo.
* Face resolution is limited by the ~200 px head in the reference photo.
