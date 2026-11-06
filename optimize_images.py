"""Prepare images for the site. Run from the repo root after adding drawings to jokes/.

Converts new PNG/JPEG drawings to JPG, then writes resized WebP variants next to
each source image. Existing variants are only rebuilt if the source is newer.

Requires Pillow: pip install Pillow
"""
from pathlib import Path

from PIL import Image

JOKES_DIR = Path("jokes")
CONVERTIBLE_SUFFIXES = {".png", ".jpeg"}

# Keep in sync with VARIANT_WIDTHS in script.js.
JOKE_WIDTHS = (720, 1080, 1440)
# Keep in sync with the srcset attributes of the logos in index.html.
LOGO_WIDTHS = {
    Path("logo.PNG"): (96, 256),
    Path("logo_text.PNG"): (640, 1385),
}
WEBP_QUALITY = 80


def convert_to_jpg(path):
    with Image.open(path) as image:
        image.convert("RGB").save(path.with_suffix(".jpg"))
    path.unlink()


def write_variant(source, width):
    variant = source.with_name(f"{source.stem}-{width}.webp")
    if variant.exists() and variant.stat().st_mtime >= source.stat().st_mtime:
        return

    with Image.open(source) as image:
        if width < image.width:
            height = round(image.height * width / image.width)
            image = image.resize((width, height), Image.Resampling.LANCZOS)
        image.save(variant, quality=WEBP_QUALITY, method=6)
    print(f"{variant} ({variant.stat().st_size // 1024} KiB)")


def main():
    for path in JOKES_DIR.rglob("*"):
        if path.suffix.lower() in CONVERTIBLE_SUFFIXES:
            convert_to_jpg(path)

    for source in sorted(JOKES_DIR.rglob("*.jpg")):
        for width in JOKE_WIDTHS:
            write_variant(source, width)

    for source, widths in LOGO_WIDTHS.items():
        for width in widths:
            write_variant(source, width)


if __name__ == "__main__":
    main()
