"""Build the GDG kitten mascot procedurally in Blender (bpy) and export GLB + .blend.

Usage (from the project root):
    python3 -I tools/make_textures.py
    python3 -I tools/build_cat.py            # builds, saves gdg-cat.blend and gdg-cat.glb

Coordinates: +Z up, character faces -Y, +X is the wearer's LEFT (viewer's right in FRONT view).
All dimensions are derived from the turnaround sheet: 1 px = 0.0045 units, figure height = 2.0.
"""
import math
import os
import sys

import bpy  # noqa: must come before bmesh/mathutils
import bmesh
import numpy as np
from mathutils import Vector
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET = os.path.join(ROOT, "assets", "3d", "gdg-cat")
TEX = os.path.join(ASSET, "textures")
REF = os.path.join(ROOT, "ref", "turnaround.png")
S = 0.0045          # units per reference pixel
FACE_CX = 223.5     # face centre line in FRONT view (px)
BODY_CX = 227.0     # body centre line in FRONT view (px)


def px_x(px, cx=BODY_CX):
    return (px - cx) * S


def px_z(py):
    return (455.0 - py) * S


# --------------------------------------------------------------------------- scene helpers
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
root_coll = bpy.data.collections.new("GDG_Cat")
scene.collection.children.link(root_coll)
colls = {}
for n in ("Cat", "Jacket", "Jeans", "Decals"):
    c = bpy.data.collections.new(n)
    root_coll.children.link(c)
    colls[n] = c


def finish(obj, coll, smooth=True):
    colls[coll].objects.link(obj)
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.update()
    return bpy.data.objects.new(name, me)


def active(obj):
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def apply_mod(obj, mod):
    active(obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)


def recalc(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()


# --------------------------------------------------------------------------- lofting
def loft(name, path, rx, ry, segs=32, expo=2.0, ref=(1, 0, 0), cap0=False, cap1=False,
         closed_path=False, urep=1.0, vrep=1.0, uv_mode="around"):
    """Sweep an elliptical (super-ellipse) section along `path`.
    ex = ref projected perpendicular to the tangent, ey = T x ex (so ex x ey = T)."""
    P = np.asarray(path, float)
    n = len(P)
    rx = np.broadcast_to(np.asarray(rx, float), (n,))
    ry = np.broadcast_to(np.asarray(ry, float), (n,))
    if closed_path:
        T = np.roll(P, -1, 0) - np.roll(P, 1, 0)
    else:
        T = np.gradient(P, axis=0)
    T /= np.linalg.norm(T, axis=1)[:, None]
    refv = np.asarray(ref, float)
    seglen = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    total = seglen[-1] if seglen[-1] > 0 else 1.0
    bm = bmesh.new()
    rings = []
    for i in range(n):
        ex = refv - np.dot(refv, T[i]) * T[i]
        ex /= np.linalg.norm(ex)
        ey = np.cross(T[i], ex)
        ring = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            c, s = math.cos(a), math.sin(a)
            x = math.copysign(abs(c) ** (2.0 / expo), c)
            y = math.copysign(abs(s) ** (2.0 / expo), s)
            ring.append(bm.verts.new(P[i] + ex * rx[i] * x + ey * ry[i] * y))
        rings.append(ring)
    uv_for = []
    rng_i = range(n) if closed_path else range(n - 1)
    for i in rng_i:
        j = (i + 1) % n
        for k in range(segs):
            k2 = (k + 1) % segs
            f = bm.faces.new((rings[i][k], rings[i][k2], rings[j][k2], rings[j][k]))
            f.smooth = True
            if uv_mode == "around":
                u0, u1 = urep * k / segs, urep * (k + 1) / segs
                v0, v1 = vrep * seglen[i] / total, vrep * seglen[min(i + 1, n - 1) if not closed_path else (i + 1)] / total
                if closed_path and j == 0:
                    v1 = vrep
                uv_for.append([(u0, v0), (u1, v0), (u1, v1), (u0, v1)])
            else:  # "band": u along the path, v = height fraction of the section (for collar stripes)
                a0, a1 = 2 * math.pi * k / segs, 2 * math.pi * (k + 1) / segs
                va, vb = (math.cos(a0) + 1) / 2, (math.cos(a1) + 1) / 2
                u0 = urep * i / n
                u1 = urep * (i + 1) / n
                uv_for.append([(u0, va), (u0, vb), (u1, vb), (u1, va)])
    if cap0:
        c = bm.verts.new(P[0])
        for k in range(segs):
            bm.faces.new((c, rings[0][(k + 1) % segs], rings[0][k]))
            uv_for.append([(0.5, 0.5), (0.5, 0.5), (0.5, 0.5)])
    if cap1:
        c = bm.verts.new(P[-1])
        for k in range(segs):
            bm.faces.new((c, rings[-1][k], rings[-1][(k + 1) % segs]))
            uv_for.append([(0.5, 0.5), (0.5, 0.5), (0.5, 0.5)])
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f, uvs in zip(bm.faces, uv_for):
        for loop, uv in zip(f.loops, uvs):
            loop[uv_layer].uv = uv
    return mesh_from_bm(name, bm)


def box_uv(obj, tile=4.0):
    """Per-face dominant-axis projection in world units (tile = repeats per unit)."""
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    if me.uv_layers.active is None:
        me.uv_layers.active = me.uv_layers[0]
    uvl = me.uv_layers.active.data
    mw = obj.matrix_world
    for poly in me.polygons:
        nrm = poly.normal
        ax = max(range(3), key=lambda a: abs(nrm[a]))
        for li in poly.loop_indices:
            co = mw @ me.vertices[me.loops[li].vertex_index].co
            if ax == 0:
                uv = (co.y, co.z)
            elif ax == 1:
                uv = (co.x, co.z)
            else:
                uv = (co.x, co.y)
            uvl[li].uv = (uv[0] * tile, uv[1] * tile)


def ellipsoid(name, centre, radii, seg_u=48, seg_v=32):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg_u, v_segments=seg_v, radius=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2])) + Vector(centre)
    return mesh_from_bm(name, bm)


# --------------------------------------------------------------------------- materials
_imgs = {}


def img(name, colorspace="sRGB"):
    if name not in _imgs:
        im = bpy.data.images.load(os.path.join(TEX, name))
        im.colorspace_settings.name = colorspace
        im.pack()
        _imgs[name] = im
    return _imgs[name]


def material(name, albedo=None, color=(1, 1, 1, 1), normal=None, rough=0.8, metallic=0.0,
             tile=(1, 1), sheen=0.0, sheen_rough=0.5, clearcoat=0.0, normal_strength=0.6,
             alpha=False, spec=0.5, albedo_img=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = sheen
        bsdf.inputs["Sheen Roughness"].default_value = sheen_rough
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = spec
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = clearcoat
        bsdf.inputs["Coat Roughness"].default_value = 0.05
    bsdf.inputs["Base Color"].default_value = color
    uv = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (tile[0], tile[1], 1)
    nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])
    im = albedo_img or (img(albedo) if albedo else None)
    if im is not None:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = im
        t.interpolation = "Linear"
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
        if alpha:
            nt.links.new(t.outputs["Alpha"], bsdf.inputs["Alpha"])
            m.blend_method = "BLEND" if hasattr(m, "blend_method") else None
    if normal:
        tn = nt.nodes.new("ShaderNodeTexImage")
        tn.image = img(normal, "Non-Color")
        nt.links.new(mp.outputs["Vector"], tn.inputs["Vector"])
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = normal_strength
        nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def assign(obj, *mats):
    for m in mats:
        obj.data.materials.append(m)


# --------------------------------------------------------------------------- sampling helpers
def bilinear(arr, px, py):
    h, w = arr.shape[:2]
    px = np.clip(px, 0, w - 1.001)
    py = np.clip(py, 0, h - 1.001)
    x0, y0 = np.floor(px).astype(int), np.floor(py).astype(int)
    fx, fy = (px - x0)[..., None], (py - y0)[..., None]
    a = arr[y0, x0] * (1 - fx) + arr[y0, x0 + 1] * fx
    b = arr[y0 + 1, x0] * (1 - fx) + arr[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


# =========================================================================== MODEL
photo = np.asarray(Image.open(REF).convert("RGB")).astype(np.float32)
fur_tile = np.asarray(Image.open(os.path.join(TEX, "fur_orange_albedo.png")).convert("RGB")).astype(np.float32)

# ---------------------------------------------------------------- head
HEAD_C = np.array([0.0, 0.0, px_z(120.0)])
HEAD_R = np.array([0.47, 0.40, 0.36])


def head_shape(d):
    """d = unit direction -> deformed head surface point (relative to HEAD_C)."""
    x, y, z = d
    p = np.array([x * HEAD_R[0], y * HEAD_R[1], z * HEAD_R[2]])
    if z < 0:                                           # fuller kitten cheeks, rounder jaw
        p[0] *= 1.0 + 0.09 * min(1.0, -z * 1.6)
        p[2] *= 0.94
    p[2] *= 1.0 - 0.06 * max(0.0, z) ** 2              # slightly flatter crown
    # muzzle bump (front, below eye line)
    mx = (p[0] / 0.16) ** 2 + ((p[2] + 0.13) / 0.11) ** 2
    if y < 0:
        p[1] -= 0.045 * math.exp(-mx) * (-y)
    return p


bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=96, v_segments=64, radius=1.0)
dirs = {}
for v in bm.verts:
    d = np.array(v.co[:])
    dirs[v.index] = d / np.linalg.norm(d)
    v.co = Vector(head_shape(dirs[v.index]) + HEAD_C)
uvl = bm.loops.layers.uv.new("UVMap")
for f in bm.faces:
    us = []
    for lp in f.loops:
        d = dirs[lp.vert.index]
        u = math.atan2(d[0], -d[1]) / (2 * math.pi) + 0.5
        vv = 1.0 - math.acos(max(-1, min(1, d[2]))) / math.pi
        us.append([u, vv])
    ua = [a[0] for a in us]
    if max(ua) - min(ua) > 0.5:
        for a in us:
            if a[0] < 0.5:
                a[0] += 1.0
    for lp, a in zip(f.loops, us):
        lp[uvl].uv = (a[0], a[1])
head = mesh_from_bm("Cat_Head", bm)
finish(head, "Cat")


def bake_head_texture(obj, size=2048):
    """Project the FRONT photo onto the face, blend into tiled fur elsewhere (UV-space rasteriser)."""
    me = obj.data
    me.calc_loop_triangles()
    uvd = me.uv_layers.active.data
    nverts = len(me.vertices)
    pos = np.empty(nverts * 3, np.float32)
    me.vertices.foreach_get("co", pos)
    pos = pos.reshape(-1, 3)
    nrm = np.empty(nverts * 3, np.float32)
    me.vertex_normals.foreach_get("vector", nrm)
    nrm = nrm.reshape(-1, 3)
    albedo = np.zeros((size, size, 3), np.float32)
    filled = np.zeros((size, size), bool)
    for tri in me.loop_triangles:
        vi = [tri.vertices[0], tri.vertices[1], tri.vertices[2]]
        uvs = np.array([uvd[li].uv[:] for li in tri.loops])
        for shift in (0.0, -1.0, 1.0):
            uu = uvs[:, 0] + shift
            if uu.max() < 0 or uu.min() > 1:
                continue
            tx = uu * size
            ty = (1 - uvs[:, 1]) * size
            x0, x1 = int(max(0, math.floor(tx.min()))), int(min(size - 1, math.ceil(tx.max())))
            y0, y1 = int(max(0, math.floor(ty.min()))), int(min(size - 1, math.ceil(ty.max())))
            if x1 < x0 or y1 < y0:
                continue
            gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            d = (ty[1] - ty[2]) * (tx[0] - tx[2]) + (tx[2] - tx[1]) * (ty[0] - ty[2])
            if abs(d) < 1e-9:
                continue
            l0 = ((ty[1] - ty[2]) * (gx - tx[2]) + (tx[2] - tx[1]) * (gy - ty[2])) / d
            l1 = ((ty[2] - ty[0]) * (gx - tx[2]) + (tx[0] - tx[2]) * (gy - ty[2])) / d
            l2 = 1 - l0 - l1
            inside = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
            if not inside.any():
                continue
            p = l0[..., None] * pos[vi[0]] + l1[..., None] * pos[vi[1]] + l2[..., None] * pos[vi[2]]
            nn = l0[..., None] * nrm[vi[0]] + l1[..., None] * nrm[vi[1]] + l2[..., None] * nrm[vi[2]]
            nn /= (np.linalg.norm(nn, axis=-1, keepdims=True) + 1e-9)
            # fur everywhere
            u_img = (gx / size) * 3.0
            v_img = (gy / size) * 1.5
            fur = bilinear(fur_tile, (u_img * 1024) % 1023, (v_img * 1024) % 1023)
            # front photo projection (face)
            ppx = FACE_CX + p[..., 0] / S
            ppy = 455.0 - p[..., 2] / S
            ph = bilinear(photo, ppx, ppy)
            ex = (ppx - FACE_CX) / 96.0
            ey = (ppy - 142.0) / 70.0
            ell = np.clip(1.0 - np.sqrt(ex ** 2 + ey ** 2), 0, 1)
            wgt = np.clip(ell / 0.22, 0, 1)
            facing = np.clip((-nn[..., 1] - 0.30) / 0.25, 0, 1)
            wgt = wgt * facing
            col = fur * (1 - wgt[..., None]) + ph * wgt[..., None]
            m = inside
            albedo[y0:y1 + 1, x0:x1 + 1][m] = col[m]
            filled[y0:y1 + 1, x0:x1 + 1] |= m
    # dilate to pad seams
    for _ in range(6):
        grown = filled.copy()
        acc = np.zeros_like(albedo)
        cnt = np.zeros(filled.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh_f = np.roll(filled, (dy, dx), (0, 1))
            sh_a = np.roll(albedo, (dy, dx), (0, 1))
            acc += sh_a * sh_f[..., None]
            cnt += sh_f
        new = (~filled) & (cnt > 0)
        albedo[new] = acc[new] / cnt[new][:, None]
        filled = filled | new
    out = os.path.join(TEX, "head_albedo_baked.png")
    Image.fromarray(np.clip(albedo, 0, 255).astype(np.uint8)).save(out)
    return out


head_png = bake_head_texture(head)
m_head = material("Fur_Head", albedo="head_albedo_baked.png", normal="fur_normal.png", rough=0.82,
                  sheen=0.6, sheen_rough=0.4, tile=(1, 1), normal_strength=0.35)
# normal map tiles more densely than the baked albedo
for n in m_head.node_tree.nodes:
    if n.type == "MAPPING":
        pass
assign(head, m_head)

m_fur = material("Fur_Orange", albedo="fur_orange_albedo.png", normal="fur_normal.png", rough=0.85,
                 sheen=0.6, sheen_rough=0.4, tile=(3, 3), normal_strength=0.5)
m_fur_tabby = material("Fur_Tabby", albedo="fur_orange_tabby_albedo.png", normal="fur_normal.png", rough=0.85,
                       sheen=0.6, sheen_rough=0.4, tile=(2, 2), normal_strength=0.5)
m_pink = material("Pink_Pads", albedo="pink_pad_albedo.png", rough=0.55)
m_ear_in = material("Ear_Inner_Pink", albedo="ear_inner_albedo.png", rough=0.7, sheen=0.4)
m_nose = material("Nose_Pink", albedo="nose_albedo.png", rough=0.35, clearcoat=0.4)
m_whisk = material("Whisker_White", albedo="whisker_albedo.png", rough=0.4)
m_btn = material("Button_Dark", albedo="button_albedo.png", rough=0.3, metallic=0.1, clearcoat=0.5)
m_blk = material("Jacket_Black_Fabric", albedo="jacket_black_albedo.png", normal="jacket_black_normal.png",
                 rough=0.92, sheen=0.08, tile=(4, 4), normal_strength=0.8, spec=0.2)
m_wht = material("Jacket_White_Sleeve", albedo="jacket_white_albedo.png", normal="jacket_white_normal.png",
                 rough=0.85, sheen=0.5, tile=(4, 4), normal_strength=0.8)
m_rib = material("Jacket_Rib_Stripes", albedo="rib_stripe_albedo.png", normal="rib_normal.png",
                 rough=0.9, sheen=0.4, normal_strength=1.0)
m_denim = material("Black_Denim", albedo="denim_black_albedo.png", normal="denim_normal.png",
                   rough=0.78, tile=(5, 5), normal_strength=1.0)
m_pocket = material("Denim_Pocket", albedo="denim_pocket_albedo.png", normal=None, rough=0.78)
m_logo = material("GDG_Logo_Decal", albedo="gdg_logo_decal.png", rough=0.7, alpha=True)

# ---------------------------------------------------------------- ears
def make_ear(side):
    sx = 1 if side == "L" else -1
    base = np.array([sx * 0.25, 0.0, 1.60])
    tip = np.array([sx * 0.465, 0.02, px_z(8)])
    ts = np.linspace(0, 1, 14)
    path = [base + (tip - base) * t + np.array([0, 0.02 * math.sin(t * math.pi), 0]) for t in ts]
    path = [p - np.array([0, 0, 0.10 * (1 - t)]) if False else p for p, t in zip(path, ts)]
    w = [0.215 * (1 - t ** 1.5) ** 0.85 + 0.004 for t in ts]
    d = [0.085 * (1 - t ** 1.3) ** 0.9 + 0.004 for t in ts]
    outer = loft(f"Cat_Ear_{side}_outer", path, w, d, segs=24, ref=(1 if sx > 0 else -1, 0, 0), cap1=True, cap0=True)
    # inner (pink) part sits slightly forward, smaller
    path_i = [p + np.array([0, -0.050, 0]) for p in path[3:12]]
    wi = [x * 0.70 for x in w[3:12]]
    di = [x * 0.42 for x in d[3:12]]
    inner = loft(f"Cat_Ear_{side}_inner", path_i, wi, di, segs=20, ref=(1 if sx > 0 else -1, 0, 0), cap1=True)
    return outer, inner


ear_objs = []
for side in ("L", "R"):
    o, i = make_ear(side)
    ear_objs.append((o, i))
# join ears into one object "Cat_Ears" with two material slots
for o, i in ear_objs:
    box_uv(o, tile=2.0)
    box_uv(i, tile=2.0)
bpy.ops.object.select_all(action="DESELECT")
for o, i in ear_objs:
    colls["Cat"].objects.link(o)
    colls["Cat"].objects.link(i)
for o, i in ear_objs:
    assign(o, m_fur)
    assign(i, m_ear_in)
    for p in o.data.polygons:
        p.use_smooth = True
    for p in i.data.polygons:
        p.use_smooth = True
ears_all = [x for pair in ear_objs for x in pair]
active(ears_all[0])
for x in ears_all:
    x.select_set(True)
bpy.ops.object.join()
ears = bpy.context.view_layer.objects.active
ears.name = "Cat_Ears"
ears.data.name = "Cat_Ears"

# ---------------------------------------------------------------- eyes (textured from the photo, glossy)
eye_crop = Image.open(REF).convert("RGB").crop((160, 96, 290, 156))
eye_crop = eye_crop.resize((eye_crop.width * 4, eye_crop.height * 4), Image.LANCZOS)
eye_crop.save(os.path.join(TEX, "eye_crop.png"))
m_eye = material("Eye_Glossy", albedo="eye_crop.png", rough=0.12, clearcoat=1.0)
eyes = []
for side, sx in (("L", 1), ("R", -1)):
    ex_c = FACE_CX + sx * 36.5
    cx = px_x(ex_c, FACE_CX)
    cz = px_z(125.0)
    yfront = -0.40 * math.sqrt(max(0.0, 1 - (cx / 0.47) ** 2 - ((cz - HEAD_C[2]) / 0.36) ** 2)) - 0.0
    eye = ellipsoid(f"Cat_Eye_{side}", (cx, yfront + 0.032, cz), (0.074, 0.062, 0.078), 40, 28)
    # planar front projection UVs into eye_crop (x 160..290, y 96..156)
    me = eye.data
    me.uv_layers.new(name="UVMap")
    ud = me.uv_layers.active.data
    for poly in me.polygons:
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            ppx = FACE_CX + co.x / S
            ppy = 455.0 - co.z / S
            ud[li].uv = ((ppx - 160.0) / 130.0, 1.0 - (ppy - 96.0) / 60.0)
    for p in me.polygons:
        p.use_smooth = True
    assign(eye, m_eye)
    colls["Cat"].objects.link(eye)
    eyes.append(eye)
active(eyes[0])
for e in eyes:
    e.select_set(True)
bpy.ops.object.join()
eyes_obj = bpy.context.view_layer.objects.active
eyes_obj.name = "Cat_Eyes"
eyes_obj.data.name = "Cat_Eyes"

# ---------------------------------------------------------------- nose
nose_z = px_z(158.0)
ny = -0.40 * math.sqrt(max(0.0, 1 - (0.0 / 0.47) ** 2 - ((nose_z - HEAD_C[2]) / 0.36) ** 2)) - 0.045 * 1.0
nose = ellipsoid("Cat_Nose", (px_x(222, FACE_CX), ny + 0.012, nose_z), (0.036, 0.022, 0.026), 24, 16)
assign(nose, m_nose)
finish(nose, "Cat")

# ---------------------------------------------------------------- whiskers
wh_parts = []
for sx in (1, -1):
    for k, (dz, ang) in enumerate(((0.035, 0.30), (0.0, 0.0), (-0.035, -0.28))):
        p0 = np.array([sx * 0.10, ny + 0.0, nose_z - 0.025 + dz])
        L = 0.20
        pts = []
        for t in np.linspace(0, 1, 8):
            pts.append(p0 + np.array([sx * (t * L), -0.02 * t * (1 - t) * 4 - 0.02 * t, ang * t * 0.25 - 0.06 * t * t]))
        w = loft(f"wh_{sx}_{k}", pts, np.linspace(0.0030, 0.0006, 8), np.linspace(0.0030, 0.0006, 8),
                 segs=6, ref=(0, 0, 1), cap0=True, cap1=True)
        wh_parts.append(w)
for w in wh_parts:
    colls["Cat"].objects.link(w)
active(wh_parts[0])
for w in wh_parts:
    w.select_set(True)
bpy.ops.object.join()
whisk = bpy.context.view_layer.objects.active
whisk.name = "Cat_Whiskers"
whisk.data.name = "Cat_Whiskers"
box_uv(whisk, 1.0)
assign(whisk, m_whisk)
for p in whisk.data.polygons:
    p.use_smooth = True

# ---------------------------------------------------------------- torso + neck (fur, hidden under jacket)
JACKET_PROFILE = [  # z, rx, ry
    (0.37, 0.350, 0.285),
    (0.50, 0.352, 0.290),
    (0.70, 0.352, 0.290),
    (0.90, 0.345, 0.282),
    (1.02, 0.325, 0.262),
    (1.11, 0.285, 0.232),
    (1.17, 0.228, 0.200),
]
zs = [p[0] for p in JACKET_PROFILE]
rxs = np.array([p[1] for p in JACKET_PROFILE])
rys = np.array([p[2] for p in JACKET_PROFILE])


def dense(zs, rxs, rys, n):
    zz = np.linspace(zs[0], zs[-1], n)
    return zz, np.interp(zz, zs, rxs), np.interp(zz, zs, rys)


zz, rxx, ryy = dense(zs, rxs, rys, 22)
body_path = [(0, 0.0, z) for z in zz]
zt = np.r_[zz[zz >= 0.45], 1.30]
torso = loft("Cat_Body", [(0, 0.0, z) for z in zt], np.r_[np.interp(zt[:-1], zs, rxs) * 0.90, 0.17],
             np.r_[np.interp(zt[:-1], zs, rys) * 0.90, 0.15], segs=40, expo=2.2, ref=(1, 0, 0), cap0=True, cap1=True)
box_uv(torso, 3.0)
assign(torso, m_fur)
finish(torso, "Cat")

# ---------------------------------------------------------------- jacket body (black) with thickness
jb = loft("Jacket_Body", body_path, rxx, ryy, segs=64, expo=2.5, ref=(1, 0, 0))
_bm = bmesh.new()
_bm.from_mesh(jb.data)
_kill = [f for f in _bm.faces
         if f.calc_center_median().y < -0.02 and f.calc_center_median().z > 0.985 + 1.30 * abs(f.calc_center_median().x)]
bmesh.ops.delete(_bm, geom=_kill, context="FACES")
_bm.to_mesh(jb.data)
_bm.free()
box_uv(jb, 4.0)
sol = jb.modifiers.new("Solidify", "SOLIDIFY")
sol.thickness = 0.022
sol.offset = 1.0
finish(jb, "Jacket")
apply_mod(jb, sol)
assign(jb, m_blk)
box_uv(jb, 4.0)

# ---------------------------------------------------------------- hem band (rib stripes)
hem_z = np.linspace(0.37, 0.50, 6)
hem = loft("Jacket_Hem", [(0, 0.0, z) for z in hem_z], np.interp(hem_z, zs, rxs) + 0.027,
           np.interp(hem_z, zs, rys) + 0.027, segs=64, expo=2.5, urep=2.0)
assign(hem, m_rib)
finish(hem, "Jacket")

# ---------------------------------------------------------------- sleeves (white) + cuffs
sleeves, cuffs = [], []
for sx in (1, -1):
    sh = np.array([sx * 0.30, 0.0, 1.10])
    el = np.array([sx * 0.395, -0.060, 0.80])
    cu = np.array([sx * 0.395, -0.095, 0.60])
    pts_s = [sh + (el - sh) * t for t in np.linspace(0, 1, 6)] + [el + (cu - el) * t for t in np.linspace(0.2, 1, 5)]
    rads = np.interp(np.linspace(0, 1, len(pts_s)), [0, 0.5, 1], [0.125, 0.112, 0.098])
    sl = loft(f"sleeve_{sx}", pts_s, rads, rads * 0.98, segs=32, ref=(1, 0, 0), cap0=True)
    box_uv(sl, 4.0)
    sleeves.append(sl)
    cpts = [cu + np.array([0, -0.0045 * t, 0.0]) - np.array([0, 0, 0.09 * t]) for t in np.linspace(0, 1, 6)]
    cf = loft(f"cuff_{sx}", cpts, 0.104, 0.102, segs=32, ref=(1, 0, 0), cap0=False, cap1=False)
    cuffs.append(cf)
for s_ in sleeves:
    colls["Jacket"].objects.link(s_)
    for p in s_.data.polygons:
        p.use_smooth = True
active(sleeves[0])
for s_ in sleeves:
    s_.select_set(True)
bpy.ops.object.join()
sleeves_obj = bpy.context.view_layer.objects.active
sleeves_obj.name = "Jacket_Sleeves"
sleeves_obj.data.name = "Jacket_Sleeves"
sol2 = sleeves_obj.modifiers.new("Solidify", "SOLIDIFY")
sol2.thickness = 0.014
sol2.offset = 1.0
apply_mod(sleeves_obj, sol2)
assign(sleeves_obj, m_wht)
box_uv(sleeves_obj, 4.0)

for c in cuffs:
    colls["Jacket"].objects.link(c)
    for p in c.data.polygons:
        p.use_smooth = True
active(cuffs[0])
for c in cuffs:
    c.select_set(True)
bpy.ops.object.join()
cuffs_obj = bpy.context.view_layer.objects.active
cuffs_obj.name = "Jacket_Cuffs"
cuffs_obj.data.name = "Jacket_Cuffs"
assign(cuffs_obj, m_rib)

# ---------------------------------------------------------------- collar (V-dipping striped band)
N_C = 72
cpath, crx, cry = [], [], []
for i in range(N_C):
    th = 2 * math.pi * i / N_C                    # 0 = front (-Y), increasing CCW from above
    phi = abs(((th + math.pi) % (2 * math.pi)) - math.pi)     # angle from front
    dip = max(0.0, 1.0 - phi / 0.80)
    zc = 1.225 - 0.235 * dip
    r_x, r_y = 0.245, 0.212
    x = -r_x * math.sin(th)
    y = -r_y * math.cos(th)
    cpath.append((x, y, zc))
    crx.append(0.058)           # vertical half height (ex = up)
    cry.append(0.040)           # radial half thickness
collar = loft("Jacket_Collar", cpath, crx, cry, segs=16, expo=2.6, ref=(0, 0, 1), closed_path=True,
              urep=6.0, uv_mode="band")
assign(collar, m_rib)
finish(collar, "Jacket")

# ---------------------------------------------------------------- buttons + placket
btns = []
for k in range(5):
    z = 1.00 - 0.10 * k
    # surface y of jacket at height z (front)
    ry_here = float(np.interp(z, zs, rys))
    rx_here = float(np.interp(z, zs, rxs))
    y_front = -ry_here * 1.0 - 0.022
    b = loft(f"btn_{k}", [(0, y_front + 0.012, z), (0, y_front - 0.004, z)], 0.028, 0.028, segs=20,
             ref=(1, 0, 0), cap0=True, cap1=True)
    # loft along Y with ex=X, ey = T x ex: fine for a disc
    btns.append(b)
for b in btns:
    colls["Jacket"].objects.link(b)
    for p in b.data.polygons:
        p.use_smooth = True
active(btns[0])
for b in btns:
    b.select_set(True)
bpy.ops.object.join()
buttons = bpy.context.view_layer.objects.active
buttons.name = "Jacket_Buttons"
buttons.data.name = "Jacket_Buttons"
box_uv(buttons, 1.0)
assign(buttons, m_btn)

# ---------------------------------------------------------------- GDG logo decal on chest (projected on the jacket)
logo_w = 52 * S
logo_h = logo_w * 272 / 416
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=16, y_segments=12, size=1.0)
uvl = bm.loops.layers.uv.new("UVMap")
for v in bm.verts:
    v.co = Vector((v.co.x * logo_w / 2, v.co.y * logo_h / 2, 0))
for f in bm.faces:
    for lp in f.loops:
        lp[uvl].uv = (lp.vert.co.x / logo_w + 0.5, lp.vert.co.y / logo_h + 0.5)
logo = mesh_from_bm("GDG_Chest_Logo", bm)
# stand the grid up facing -Y at the chest position (front view px 274, 260)
logo.rotation_euler = (math.radians(90), 0, 0)
logo.location = (px_x(274), -0.45, px_z(260))
colls["Decals"].objects.link(logo)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action="DESELECT")
active(logo)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
sw = logo.modifiers.new("Shrinkwrap", "SHRINKWRAP")
sw.target = jb
sw.wrap_method = "PROJECT"
sw.use_project_y = True
sw.use_negative_direction = True
sw.use_positive_direction = True
sw.offset = 0.004
sw.cull_face = "OFF"
apply_mod(logo, sw)
for p in logo.data.polygons:
    p.use_smooth = True
assign(logo, m_logo)

# ---------------------------------------------------------------- jeans (voxel-unioned pelvis + legs + cuffs)
jparts = []
pz = np.linspace(0.46, 0.27, 6)
pelvis = loft("j_pelvis", [(0, 0.0, z) for z in pz], np.interp(pz, [0.27, 0.46], [0.335, 0.356]),
              np.interp(pz, [0.27, 0.46], [0.240, 0.282]), segs=40, expo=2.3, cap0=True, cap1=True)
jparts.append(pelvis)
for sx in (1, -1):
    lg = loft(f"j_leg_{sx}", [(sx * 0.185, -0.01, z) for z in np.linspace(0.34, 0.135, 7)],
              np.linspace(0.158, 0.146, 7), np.linspace(0.185, 0.165, 7), segs=32, expo=2.2,
              cap0=True, cap1=True)
    jparts.append(lg)
    cuffr = loft(f"j_cuff_{sx}", [(sx * 0.185, -0.01, z) for z in np.linspace(0.135, 0.19, 4)],
                 0.163, 0.178, segs=32, expo=2.2, cap0=True, cap1=True)
    jparts.append(cuffr)
for p_ in jparts:
    colls["Jeans"].objects.link(p_)
active(jparts[0])
for p_ in jparts:
    p_.select_set(True)
bpy.ops.object.join()
jeans = bpy.context.view_layer.objects.active
jeans.name = "Black_Denim_Jeans"
jeans.data.name = "Black_Denim_Jeans"
jeans.data.remesh_voxel_size = 0.011
bpy.ops.object.voxel_remesh()
for p in jeans.data.polygons:
    p.use_smooth = True
box_uv(jeans, 4.0)
assign(jeans, m_denim)

# pockets as shrink-wrapped patches
pockets = []
for (px_, pz_, side, yd) in ((0.20, 0.30, "B", 1), (-0.20, 0.30, "B", 1), (0.20, 0.31, "F", -1), (-0.20, 0.31, "F", -1)):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=6, y_segments=6, size=1.0)
    uvl = bm.loops.layers.uv.new("UVMap")
    w, h = (0.15, 0.14) if side == "B" else (0.11, 0.12)
    for v in bm.verts:
        v.co = Vector((v.co.x * w / 2, v.co.y * h / 2, 0))
    for f in bm.faces:
        for lp in f.loops:
            lp[uvl].uv = (lp.vert.co.x / w + 0.5, lp.vert.co.y / h + 0.5)
    pk = mesh_from_bm(f"pocket_{side}_{px_}", bm)
    pk.rotation_euler = (math.radians(90), 0, 0)
    pk.location = (px_, yd * 0.45, pz_)
    colls["Jeans"].objects.link(pk)
    bpy.context.view_layer.update()
    active(pk)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    s2 = pk.modifiers.new("Shrinkwrap", "SHRINKWRAP")
    s2.target = jeans
    s2.wrap_method = "PROJECT"
    s2.use_project_y = True
    s2.use_negative_direction = True
    s2.use_positive_direction = True
    s2.offset = 0.004
    apply_mod(pk, s2)
    assign(pk, m_pocket)
    pockets.append(pk)

# ---------------------------------------------------------------- tail
tpts = [(0.00, 0.25, 0.42), (-0.01, 0.37, 0.38), (-0.06, 0.45, 0.28), (-0.15, 0.46, 0.15), (-0.24, 0.40, 0.07),
        (-0.29, 0.31, 0.055)]
t_dense = []
tp = np.array(tpts)
for t in np.linspace(0, 1, 18):
    idx = t * (len(tp) - 1)
    i0 = int(min(len(tp) - 2, math.floor(idx)))
    f = idx - i0
    p0 = tp[max(i0 - 1, 0)]
    p1 = tp[i0]
    p2 = tp[i0 + 1]
    p3 = tp[min(i0 + 2, len(tp) - 1)]
    t_dense.append(0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f ** 2 +
                          (-p0 + 3 * p1 - 3 * p2 + p3) * f ** 3))
tr = np.interp(np.linspace(0, 1, 18), [0, 0.35, 0.8, 1.0], [0.075, 0.098, 0.088, 0.055])
tail = loft("Cat_Tail", t_dense, tr, tr * 0.95, segs=28, ref=(1, 0, 0), cap0=True, cap1=True, vrep=3.0)
assign(tail, m_fur_tabby)
box_uv(tail, 3.0)
finish(tail, "Cat")

# ---------------------------------------------------------------- paws: hind feet + front paws (with pink pads)
paw_parts, pad_parts = [], []
for sx in (1, -1):
    fx = sx * 0.19
    foot = ellipsoid(f"foot_{sx}", (fx, -0.065, 0.072), (0.115, 0.170, 0.078), 32, 20)
    paw_parts.append(foot)
    ankle = loft(f"ankle_{sx}", [(fx, -0.015, z) for z in np.linspace(0.07, 0.24, 5)], 0.092, 0.100,
                 segs=20, ref=(1, 0, 0), cap0=True, cap1=True)
    paw_parts.append(ankle)
    for k, off in enumerate((-0.062, 0.0, 0.062)):
        toe = ellipsoid(f"toe_{sx}_{k}", (fx + off, -0.215 + (0.012 if k != 1 else 0), 0.05), (0.036, 0.04, 0.035), 16, 12)
        paw_parts.append(toe)
        pad_t = ellipsoid(f"toepad_{sx}_{k}", (fx + off, -0.21, 0.012), (0.022, 0.026, 0.012), 12, 8)
        pad_parts.append(pad_t)
    pad_m = ellipsoid(f"mainpad_{sx}", (fx, -0.10, 0.004), (0.050, 0.060, 0.012), 16, 10)
    pad_parts.append(pad_m)
    # front paws just below the cuffs
    fp = ellipsoid(f"fpaw_{sx}", (sx * 0.385, -0.105, 0.475), (0.088, 0.100, 0.100), 28, 20)
    paw_parts.append(fp)
    for k, off in enumerate((-0.04, 0.0, 0.04)):
        t2 = ellipsoid(f"ftoe_{sx}_{k}", (sx * 0.385 + off, -0.185, 0.425), (0.030, 0.032, 0.030), 12, 8)
        paw_parts.append(t2)
for o in paw_parts:
    colls["Cat"].objects.link(o)
    for p in o.data.polygons:
        p.use_smooth = True
active(paw_parts[0])
for o in paw_parts:
    o.select_set(True)
bpy.ops.object.join()
paws = bpy.context.view_layer.objects.active
paws.name = "Cat_Paws"
paws.data.name = "Cat_Paws"
box_uv(paws, 3.0)
assign(paws, m_fur)
for o in pad_parts:
    colls["Cat"].objects.link(o)
    for p in o.data.polygons:
        p.use_smooth = True
active(pad_parts[0])
for o in pad_parts:
    o.select_set(True)
bpy.ops.object.join()
pads = bpy.context.view_layer.objects.active
pads.name = "Cat_PawPads"
pads.data.name = "Cat_PawPads"
box_uv(pads, 1.0)
assign(pads, m_pink)

# ---------------------------------------------------------------- finalize head UV material etc.
if not nose.data.uv_layers:
    box_uv(nose, 1.0)
if not eyes_obj.data.uv_layers:
    pass

# ---------------------------------------------------------------- normalise UV layers (exactly one, named UVMap,
# active + active_render) so the glTF exporter always resolves texCoord 0
for _o in root_coll.all_objects:
    _me = _o.data
    if not _me.uv_layers:
        _o.select_set(False)
        box_uv(_o, 1.0)
    while len(_me.uv_layers) > 1:
        _me.uv_layers.remove(_me.uv_layers[len(_me.uv_layers) - 1])
    _me.uv_layers[0].name = "UVMap"
    _me.uv_layers.active = _me.uv_layers[0]
    _me.uv_layers[0].active_render = True

# =========================================================================== SAVE + EXPORT
os.makedirs(ASSET, exist_ok=True)
blend_path = os.path.join(ASSET, "gdg-cat.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("saved", blend_path)

bpy.ops.object.select_all(action="DESELECT")
for o in root_coll.all_objects:
    o.select_set(True)
glb_path = os.path.join(ASSET, "gdg-cat.glb")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_image_format="AUTO",
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
    export_yup=True,
)
print("exported", glb_path, os.path.getsize(glb_path) // 1024, "KB")
for o in sorted(root_coll.all_objects, key=lambda o: o.name):
    print("  ", o.name, len(o.data.vertices), "verts")
