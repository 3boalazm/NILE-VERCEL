"""Crop real packaging from existing source photographs; never regenerate labels.
Requires Pillow as local image-preparation tooling, not a runtime dependency.
"""
from pathlib import Path
from PIL import Image, ImageDraw

POLYGONS = {
    "proxeed-plus": [(315, 653), (798, 650), (875, 656), (870, 1004), (807, 1045), (316, 1013)],
    "proxeed-men": [(294, 524), (757, 510), (871, 540), (866, 969), (413, 1008), (295, 933)],
    "proxeed-women": [(334, 628), (881, 632), (878, 971), (806, 1009), (337, 979)],
    "proxeed-women-inositol": [(246, 520), (649, 500), (754, 533), (754, 823), (338, 866), (245, 817)],
    "proxerex": [(318, 649), (779, 637), (882, 672), (873, 1008), (808, 1031), (325, 1008)],
    "ellamuselle": [(341, 736), (840, 733), (839, 1047), (800, 1081), (349, 1050)],
}
output = Path("public/concepts/care-atlas/packs")
output.mkdir(parents=True, exist_ok=True)
for slug, polygon in POLYGONS.items():
    image = Image.open(f"public/products/{slug}.jpg").convert("RGBA")
    alpha = Image.new("L", (image.width * 3, image.height * 3))
    ImageDraw.Draw(alpha).polygon([(x * 3, y * 3) for x, y in polygon], fill=255)
    alpha = alpha.resize(image.size, Image.Resampling.LANCZOS)
    image.putalpha(alpha)
    image = image.crop(alpha.getbbox())
    image.thumbnail((700, 600), Image.Resampling.LANCZOS)
    image.save(output / f"{slug}.webp", quality=93, method=6)
print(f"Prepared {len(POLYGONS)} original-image package cutouts.")
