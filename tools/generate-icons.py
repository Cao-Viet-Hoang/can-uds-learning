"""Generate the favicon/PWA icon set from the brand chip mark.

Geometry mirrors assets/favicon.svg (64-unit design grid) and the brand
colour --c-brand in css/styles.css. Run from the repo root:

    python tools/generate-icons.py

Requires Pillow.
"""

from PIL import Image, ImageDraw

BRAND = (79, 70, 229, 255)   # #4f46e5 — indigo 600
WHITE = (255, 255, 255, 255)
S = 16                       # supersample factor, downscaled with LANCZOS

# Chip pins on the 64-unit grid: x, y, w, h
PINS = [(21, 8, 5, 9), (38, 8, 5, 9), (21, 47, 5, 9), (38, 47, 5, 9),
        (8, 21, 9, 5), (8, 38, 9, 5), (47, 21, 9, 5), (47, 38, 9, 5)]


def _tile(px, corner, bg):
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(corner * px)
    if r:
        d.rounded_rectangle([0, 0, px - 1, px - 1], radius=r, fill=bg)
    else:
        d.rectangle([0, 0, px - 1, px - 1], fill=bg)
    return img, d


def render(size, *, corner=0.22, pad=0.0, bg=BRAND):
    """Full mark. `corner` = tile radius as a fraction of size,
    `pad` = inset of the mark (safe zone for maskable icons)."""
    px = size * S
    img, d = _tile(px, corner, bg)
    ox = oy = px * pad
    sc = px * (1 - 2 * pad) / 64

    def box(x, y, w, h):
        return [ox + x * sc, oy + y * sc, ox + (x + w) * sc - 1, oy + (y + h) * sc - 1]

    for x, y, w, h in PINS:
        d.rounded_rectangle(box(x, y, w, h), radius=2 * sc, fill=WHITE)
    d.rounded_rectangle(box(15, 15, 34, 34), radius=7 * sc, fill=WHITE)
    d.rounded_rectangle(box(25, 25, 14, 14), radius=3 * sc, fill=BRAND)
    return img.resize((size, size), Image.LANCZOS)


def render_small(size):
    """Pins blur away below ~24px, so drop them and thicken the chip
    frame — keeps 16/32px tab icons legible."""
    px = size * S
    img, d = _tile(px, 0.22, BRAND)
    sc = px / 64
    d.rounded_rectangle([11 * sc, 11 * sc, 53 * sc - 1, 53 * sc - 1], radius=8 * sc, fill=WHITE)
    d.rounded_rectangle([24 * sc, 24 * sc, 40 * sc - 1, 40 * sc - 1], radius=3 * sc, fill=BRAND)
    return img.resize((size, size), Image.LANCZOS)


# Pillow's ICO writer takes its frame list from `sizes` and only keeps sizes
# no larger than the base image, so the base must be the biggest frame.
base = render(256)
extra = [render_small(16), render_small(32), render(48), render(64), render(128)]
base.save("assets/favicon.ico", format="ICO",
          sizes=[im.size for im in extra] + [base.size], append_images=extra)

render(192).save("assets/icon-192.png")
render(512).save("assets/icon-512.png")
# Android maskable: full-bleed background, mark inside the 80% safe zone
render(512, corner=0.0, pad=0.20).save("assets/icon-maskable-512.png")
# iOS applies its own mask, so ship a square, opaque tile
render(180, corner=0.0, pad=0.10).convert("RGB").save("assets/apple-touch-icon.png")

print("icons written to assets/")
