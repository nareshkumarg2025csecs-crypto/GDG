"""
frame_team_photo.py

Utility script to process team member portrait photos for GDG on Campus.
- Converts to exact 4:5 aspect ratio (1000 x 1250 HD resolution)
- Places the photo strictly INSIDE the inner window of the cyber HUD border
- Completely eliminates any background outside the cyber border (transparent RGBA)
- Renders the cyber border lines in crisp white/silver (or domain theme color)
- Integrates seamlessly with GDG card animations (scanlines, holographic foil, 3D tilt)
- Outputs high-quality HD image ready for public/team/
"""

import sys
import os
import argparse
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

BORDER_TEMPLATE = os.path.join(
    os.path.dirname(__file__),
    '..', 'public', 'team', 'border_template.png'
)

# Department colors
DEPARTMENT_COLORS = {
    'leads': (235, 242, 250),       # Crisp Cyber White/Silver
    'techops': (66, 133, 244),     # Google Blue #4285F4
    'design': (234, 67, 53),       # Google Red #EA4335
    'media': (251, 188, 4),        # Google Yellow #FBBC04
    'logistics': (52, 168, 83),    # Google Green #34A853
}

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def process_member_photo(
    photo_path: str,
    output_path: str,
    border_path: str = None,
    color_rgb: tuple = None,
    target_size: tuple = (1000, 1250),
    crop_box: tuple = None
):
    if border_path is None:
        border_path = BORDER_TEMPLATE
    
    if not os.path.exists(photo_path):
        raise FileNotFoundError(f"Photo not found: {photo_path}")
    if not os.path.exists(border_path):
        raise FileNotFoundError(f"Border template not found: {border_path}")

    TARGET_W, TARGET_H = target_size

    # 1. Load photo
    photo_raw = Image.open(photo_path).convert('RGB')
    pw, ph = photo_raw.size

    # Inner window where the photo lives (proportional to 1000x1250)
    INNER_LEFT = 110
    INNER_TOP = 135
    INNER_RIGHT = 890
    INNER_BOTTOM = 1115
    INNER_W = INNER_RIGHT - INNER_LEFT
    INNER_H = INNER_BOTTOM - INNER_TOP

    target_inner_ratio = INNER_W / INNER_H
    current_ratio = pw / ph

    if crop_box is not None:
        photo_cropped = photo_raw.crop(crop_box)
    elif current_ratio > target_inner_ratio:
        new_pw = int(ph * target_inner_ratio)
        left = (pw - new_pw) // 2
        photo_cropped = photo_raw.crop((left, 0, left + new_pw, ph))
    else:
        new_ph = int(pw / target_inner_ratio)
        top = int((ph - new_ph) * 0.2)
        photo_cropped = photo_raw.crop((0, top, pw, top + new_ph))

    # Scale photo to fit the inner frame
    photo_inner = photo_cropped.resize((INNER_W, INNER_H), Image.Resampling.LANCZOS)
    photo_inner = ImageEnhance.Sharpness(photo_inner).enhance(1.22)
    photo_inner = ImageEnhance.Contrast(photo_inner).enhance(1.05)

    # 2. Scale border template to TARGET_W x TARGET_H
    border_raw = Image.open(border_path).convert('L')
    border_scaled = border_raw.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)

    # Extract border alpha (lines are opaque, white is transparent)
    arr_border = np.array(border_scaled).astype(float)
    alpha = np.clip((248.0 - arr_border) / 248.0 * 255.0, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode='L')

    # 3. Create transparent RGBA canvas
    canvas = Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))

    # Mask photo inside inner boundary with chamfered / rounded corners
    inner_mask = Image.new('L', (INNER_W, INNER_H), 255)
    canvas.paste(photo_inner, (INNER_LEFT, INNER_TOP), inner_mask)

    # 4. Color tint the cyber border
    if color_rgb is None:
        color_rgb = (235, 242, 250)  # default crisp white/silver

    border_layer = Image.new('RGBA', (TARGET_W, TARGET_H), (color_rgb[0], color_rgb[1], color_rgb[2], 0))
    border_layer.putalpha(alpha_img)

    # Dark shadow/glow for contrast
    shadow_layer = Image.new('RGBA', (TARGET_W, TARGET_H), (10, 15, 25, 0))
    shadow_layer.putalpha(alpha_img.filter(ImageFilter.GaussianBlur(radius=2.5)))

    # Composite layers
    canvas.alpha_composite(shadow_layer)
    canvas.alpha_composite(border_layer)

    # 5. Save output (PNG for transparency support)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    canvas.save(output_path, format='PNG', optimize=True)
    print(f"Successfully framed photo saved to: {output_path} ({TARGET_W}x{TARGET_H})")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Frame team photo inside cyber border in 4:5 HD')
    parser.add_argument('--photo', required=True, help='Path to input member photo')
    parser.add_argument('--output', required=True, help='Path to output framed photo')
    parser.add_argument('--border', default=None, help='Path to border template image')
    parser.add_argument('--dept', default='leads', choices=['leads', 'techops', 'design', 'media', 'logistics'])
    parser.add_argument('--color', default=None, help='Hex color override, e.g. #4285F4')
    parser.add_argument('--crop-box', nargs=4, type=int, default=None, help='Custom crop box: left top right bottom')

    args = parser.parse_args()

    tint = DEPARTMENT_COLORS.get(args.dept.lower())
    if args.color:
        tint = hex_to_rgb(args.color)

    process_member_photo(
        photo_path=args.photo,
        output_path=args.output,
        border_path=args.border,
        color_rgb=tint,
        crop_box=tuple(args.crop_box) if args.crop_box else None
    )
