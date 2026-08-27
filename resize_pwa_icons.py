from PIL import Image
from pathlib import Path

public = Path("public")

for filename, size in [
    ("pwa-192.png", 192),
    ("pwa-512.png", 512),
]:
    path = public / filename

    image = Image.open(path).convert("RGBA")

    # Preserve the logo's aspect ratio
    image.thumbnail((size, size), Image.Resampling.LANCZOS)

    # Create an exact square transparent canvas
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))

    # Center the logo
    x = (size - image.width) // 2
    y = (size - image.height) // 2

    canvas.paste(image, (x, y), image)

    # Save with exact dimensions
    canvas.save(path, "PNG")

    print(f"{filename}: {canvas.size[0]} x {canvas.size[1]}")

