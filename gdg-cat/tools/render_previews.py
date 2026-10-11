"""Render the eight turnaround views of gdg-cat.blend and build side-by-side comparisons.

Usage:  python3 -I tools/render_previews.py [samples] [outdir]
Writes assets/3d/gdg-cat/renders/<VIEW>.png and compare/<VIEW>_vs_ref.png, plus compare_sheet.png
"""
import math
import os
import sys

import bpy  # noqa: must come before mathutils
from mathutils import Vector
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET = os.path.join(ROOT, "assets", "3d", "gdg-cat")
REF = os.path.join(ROOT, "ref", "turnaround.png")
SAMPLES = int(sys.argv[1]) if len(sys.argv) > 1 else 24
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ASSET, "renders")
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, "compare"), exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ASSET, "gdg-cat.blend"))
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x = 384
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"

# lighting: soft key + fill + rim and a neutral world
world = bpy.data.worlds.new("W")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.9, 0.9, 0.92, 1)
bg.inputs["Strength"].default_value = 0.35
scene.world = world


def area(name, loc, energy, size):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc
    d = Vector((0, 0, 1.0)) - Vector(loc)
    lo.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


area("key", (-2.5, -3.5, 3.2), 230, 3.0)
area("fill", (3.0, -2.5, 1.5), 70, 3.0)
area("rim", (0.5, 3.5, 3.0), 110, 2.5)

cam_d = bpy.data.cameras.new("cam")
cam_d.type = "ORTHO"
cam_d.ortho_scale = 512 * 0.0045
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam

views = [  # name, azimuth (deg) measured from -Y toward +X (character's left)
    ("FRONT", 0), ("LEFT", 90), ("RIGHT", -90), ("BACK", 180),
    ("FRONT-LEFT", 45), ("FRONT-RIGHT", -45), ("BACK-LEFT", 135), ("BACK-RIGHT", -135),
]
TARGET_Z = (455 - 256) * 0.0045
ref_img = Image.open(REF).convert("RGB")
cells = {}
for i, (n, az) in enumerate(views):
    cx, cy = (i % 4) * 384, (i // 4) * 512
    cells[n] = ref_img.crop((cx, cy, cx + 384, cy + 512))

rendered = {}
for n, az in views:
    a = math.radians(az)
    dist = 6.0
    cam.location = (dist * math.sin(a), -dist * math.cos(a), TARGET_Z)
    d = Vector((0, 0, TARGET_Z)) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    path = os.path.join(OUT, f"{n}.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    r = Image.open(path).convert("RGBA")
    bgc = Image.new("RGBA", r.size, (235, 235, 235, 255))
    bgc.alpha_composite(r)
    comp = Image.new("RGB", (768, 512), (255, 255, 255))
    comp.paste(cells[n], (0, 0))
    comp.paste(bgc.convert("RGB"), (384, 0))
    comp.save(os.path.join(OUT, "compare", f"{n}_vs_ref.png"))
    rendered[n] = bgc.convert("RGB")
    print("rendered", n)

sheet = Image.new("RGB", (384 * 4, 512 * 2), (235, 235, 235))
for i, (n, _) in enumerate(views):
    sheet.paste(rendered[n], ((i % 4) * 384, (i // 4) * 512))
sheet.save(os.path.join(OUT, "turnaround_render.png"))
print("done")
