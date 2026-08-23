from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "icons"
OUTPUT.mkdir(parents=True, exist_ok=True)


def lerp(start: float, end: float, amount: float) -> int:
    return int(start + (end - start) * amount)


def make_icon(size: int = 1024, safe: bool = False) -> Image.Image:
    scale = size / 512
    image = Image.new("RGBA", (size, size), (8, 17, 31, 255))
    pixels = image.load()
    center_x, center_y = size * 0.5, size * 0.43
    radius = size * 0.72
    inner, outer = (16, 43, 66), (8, 17, 31)

    for y in range(size):
        for x in range(size):
            distance = min(1, math.hypot(x - center_x, y - center_y) / radius) ** 2
            pixels[x, y] = tuple(lerp(inner[i], outer[i], distance) for i in range(3)) + (255,)

    safe_scale = 0.84 if safe else 1
    offset = size * (1 - safe_scale) / 2

    def point(x: float, y: float) -> tuple[float, float]:
        return offset + x * scale * safe_scale, offset + y * scale * safe_scale

    points = [
        point(132, 382), point(239, 149), point(247, 141), point(260, 141),
        point(273, 149), point(364, 355), point(370, 367), point(383, 375),
        point(398, 375), point(416, 363)
    ]
    stroke_width = round(27 * scale * safe_scale)

    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).line(points, fill=(53, 191, 231, 130), width=round(42 * scale * safe_scale), joint="curve")
    image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(round(20 * scale))))

    mask = Image.new("L", image.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.line(points, fill=255, width=stroke_width, joint="curve")
    for x, y in (points[0], points[-1]):
        radius = stroke_width / 2
        mask_draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=255)

    gradient = Image.new("RGBA", image.size)
    gradient_pixels = gradient.load()
    top, middle, bottom = (244, 241, 232), (157, 232, 251), (53, 191, 231)
    for y in range(size):
        amount = y / (size - 1)
        if amount < 0.52:
            local = amount / 0.52
            color = tuple(lerp(top[i], middle[i], local) for i in range(3))
        else:
            local = (amount - 0.52) / 0.48
            color = tuple(lerp(middle[i], bottom[i], local) for i in range(3))
        for x in range(size):
            gradient_pixels[x, y] = color + (255,)
    image.alpha_composite(Image.composite(gradient, Image.new("RGBA", image.size), mask))

    draw = ImageDraw.Draw(image)
    bar_start, bar_end = point(191, 303), point(315, 303)
    bar_width = round(23 * scale * safe_scale)
    draw.line((bar_start, bar_end), fill=(242, 201, 76, 255), width=bar_width)
    for x, y in (bar_start, bar_end):
        radius = bar_width / 2
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(242, 201, 76, 255))
    draw.polygon((point(401, 367), point(418, 350), point(424, 373)), fill=(242, 201, 76, 255))
    return image


master = make_icon()
master.resize((512, 512), Image.Resampling.LANCZOS).save(OUTPUT / "aprova-ai-512.png", optimize=True)
master.resize((192, 192), Image.Resampling.LANCZOS).save(OUTPUT / "aprova-ai-192.png", optimize=True)
master.resize((180, 180), Image.Resampling.LANCZOS).save(OUTPUT / "aprova-ai-apple-touch.png", optimize=True)
master.resize((48, 48), Image.Resampling.LANCZOS).save(OUTPUT / "aprova-ai-tab-48.png", optimize=True)
make_icon(safe=True).resize((512, 512), Image.Resampling.LANCZOS).save(OUTPUT / "aprova-ai-maskable-512.png", optimize=True)
master.save(ROOT / "public" / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
