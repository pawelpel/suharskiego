import os
from PIL import Image


def convert_image(filename):
    im = Image.open(filename)
    if im.mode != "RGB":
        im = im.convert("RGB")
    webp_filename = os.path.splitext(filename)[0] + ".jpg"
    im.save(webp_filename)
    os.remove(filename)


def convert_folder(path):
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".PNG") or file.endswith(".png") or file.endswith(".jpeg"):
                filename = os.path.join(root, file)
                convert_image(filename)


if __name__ == "__main__":
    convert_folder("./jokes")
