"""Generate the tileable PBR source textures for the GDG kitten.

Colours are sampled from the supplied turnaround sheet (ref/turnaround.png).
Run:  python3 -I tools/make_textures.py
Writes to assets/3d/gdg-cat/textures/
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "3d", "gdg-cat", "textures")
REF = os.path.join(ROOT, "ref", "turnaround.png")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def periodic_noise(n, sigma_x, sigma_y):
    """Tileable gaussian-filtered noise (anisotropic), range ~[-1, 1]."""
    w = rng.standard_normal((n, n))
    f = np.fft.fft2(w)
    fx = np.fft.fftfreq(n)[None, :]
    fy = np.fft.fftfreq(n)[:, None]
    g = np.exp(-2 * (np.pi ** 2) * ((sigma_x * fx) ** 2 + (sigma_y * fy) ** 2))
    out = np.real(np.fft.ifft2(f * g))
    out -= out.mean()
    out /= (np.abs(out).max() + 1e-9)
    return out


def save(arr, name):
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr).save(os.path.join(OUT, name))


def normal_from_height(h, strength):
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1)
    gy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(h)
    l = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    n = np.stack([nx / l, ny / l, nz / l], -1)
    return (n * 0.5 + 0.5) * 255


# ------------------------------------------------------------------ fur
N = 1024
base = np.array([228, 158, 87], float)           # forehead fur, sampled
dark = np.array([196, 128, 62], float)
light = np.array([245, 190, 118], float)

# fine hair strands (elongated vertically so they read as combed fur)
fine = periodic_noise(N, 0.8, 5.0)
mid = periodic_noise(N, 2.5, 14.0)
big = periodic_noise(N, 40, 40)
t = np.clip(0.5 + 0.55 * fine + 0.35 * mid, 0, 1)
col = dark[None, None] * (1 - t[..., None]) + light[None, None] * t[..., None]
col = col * (0.93 + 0.07 * big[..., None])
save(col, "fur_orange_albedo.png")
save(normal_from_height(fine * 0.7 + mid * 0.3, 3.0), "fur_normal.png")

# tabby streaks version (slightly darker, long vertical stripes) for forehead / tail
stripe = periodic_noise(N, 3.0, 60.0)
mask = np.clip((stripe - 0.35) * 3.0, 0, 1)
col2 = col * (1 - 0.18 * mask[..., None])
save(col2, "fur_orange_tabby_albedo.png")

# ------------------------------------------------------------------ fabrics
def fabric(n, rgb, weave=0.06, fleece=0.05):
    a = periodic_noise(n, 0.7, 0.7)
    b = periodic_noise(n, 3, 3)
    c = np.array(rgb, float)[None, None] * (1 + weave * a[..., None] + fleece * b[..., None])
    return c, a * 0.5 + b * 0.5


blk, h = fabric(N, (14, 14, 15))
save(blk, "jacket_black_albedo.png")
save(normal_from_height(h, 2.0), "jacket_black_normal.png")
wht, h = fabric(N, (224, 213, 205))
save(wht, "jacket_white_albedo.png")
save(normal_from_height(h, 2.0), "jacket_white_normal.png")

# rib-knit stripes: bands run along U; V is across.  black / white / black / white / black
S = 512
rib = np.zeros((S, S, 3))
bands = [(0.00, 0.22, 0), (0.22, 0.34, 1), (0.34, 0.50, 0), (0.50, 0.62, 1), (0.62, 1.00, 0)]
for a, b_, w in bands:
    y0, y1 = int(a * S), int(b_ * S)
    rib[y0:y1] = (226, 218, 210) if w else (14, 14, 15)
ribs = (np.sin(np.arange(S) * 2 * np.pi / 8.0)[None, :] * 0.5 + 0.5)  # vertical rib lines
rib = rib * (0.88 + 0.12 * ribs[..., None])
rib = rib * (1 + 0.04 * periodic_noise(S, 0.8, 0.8)[..., None])
save(rib, "rib_stripe_albedo.png")
save(normal_from_height(np.tile(ribs, (S, 1)) - 0.5, 2.5), "rib_normal.png")

# ------------------------------------------------------------------ denim (dark, twill)
yy, xx = np.mgrid[0:N, 0:N]
twill = np.sin((xx + yy) * 2 * np.pi / 6.0) * 0.5 + 0.5
speck = periodic_noise(N, 0.6, 0.6)
dn = np.array([26, 27, 29], float)[None, None] * (0.80 + 0.35 * twill[..., None] + 0.12 * speck[..., None])
save(dn, "denim_black_albedo.png")
save(normal_from_height(twill + 0.2 * speck, 2.2), "denim_normal.png")

# back pocket patch with stitched outline (alpha-less, used as a small mesh patch)
P = 256
pk = np.tile(dn[:P, :P], (1, 1, 1)).copy()
for i in range(P):
    for j in range(P):
        pass
st = np.zeros((P, P), bool)
for k in range(10, P - 10, 12):
    st[8:11, k:k + 7] = True
    st[P - 11:P - 8, k:k + 7] = True
    st[k:k + 7, 8:11] = True
    st[k:k + 7, P - 11:P - 8] = True
# decorative arc stitch
for k in range(24, P - 24, 12):
    yv = int(P * 0.55 + 0.35 * (P / 2 - abs(k - P / 2)) * 0.5)
    st[min(yv, P - 2):min(yv + 3, P), k:k + 7] = True
pk[st] = (120, 118, 112)
save(pk, "denim_pocket_albedo.png")

# ------------------------------------------------------------------ small solids
def solid(name, rgb, n=64):
    save(np.ones((n, n, 3)) * np.array(rgb, float), name)


solid("pink_pad_albedo.png", (222, 140, 138))
solid("ear_inner_albedo.png", (236, 168, 160))
solid("nose_albedo.png", (221, 122, 112))
solid("button_albedo.png", (24, 24, 26))
solid("whisker_albedo.png", (244, 238, 230))

# ------------------------------------------------------------------ GDG logo decal
# Cropped from the FRONT view of the turnaround sheet.  Black background -> transparent.
ref = Image.open(REF).convert("RGB")
crop = ref.crop((248, 243, 300, 277))      # logo MARK only (caption is illegible at this resolution)
crop.save(os.path.join(OUT, "gdg_logo_ref_crop.png"))
big_ = crop.resize((crop.width * 8, crop.height * 8), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.8))
a = np.array(big_).astype(float)
lum = a.max(-1)
alpha = np.clip((lum - 28) / 70.0, 0, 1)
rgba = np.dstack([a, alpha * 255])
Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA").save(os.path.join(OUT, "gdg_logo_decal.png"))
print("textures written to", OUT)
