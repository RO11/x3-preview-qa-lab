from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "docs" / "images"
OUT = IMAGES / "engagement"
NATIVE_SIZE = (528, 792)
SCALE = 2
PAPER = "#f4f1e8"
INK = "#151713"
MUTED = "#5b5d56"

EXAMPLES = (
    ("HOME", "x3-home-native-528x792.png"),
    ("DAILY CARDS V1", "daily-cards-v1-project-watch-528x792.png"),
    ("INBOX V2", "inbox-v2-default-preview-528x792.png"),
    ("LIKE / DISLIKE", "inbox-v2-feedback-actions-528x792.png"),
    ("OPEN ARTICLE", "inbox-v2-open-article-528x792.png"),
    ("DAILY PUZZLE", "inbox-v2-puzzle-preview-528x792.png"),
)


def font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    windows = Path("C:/Windows/Fonts")
    candidate = windows / ("segoeuib.ttf" if bold else "segoeui.ttf")
    return ImageFont.truetype(str(candidate), size=size)


def load_native(name: str) -> Image.Image:
    image = Image.open(IMAGES / name).convert("RGB")
    if image.size != NATIVE_SIZE:
        raise SystemExit(f"{name} is {image.size}, expected native X3 {NATIVE_SIZE}")
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    doubled: list[tuple[str, str, Image.Image]] = []
    for label, name in EXAMPLES:
        native = load_native(name)
        presentation = native.resize(
            (NATIVE_SIZE[0] * SCALE, NATIVE_SIZE[1] * SCALE),
            Image.Resampling.NEAREST,
        )
        output_name = name.replace("-528x792.png", "-2x-1056x1584.png")
        presentation.save(OUT / output_name, optimize=True)
        doubled.append((label, output_name, presentation))

    gutter = 72
    title_height = 170
    label_height = 76
    footer_height = 110
    row_gap = 88
    cell_width = NATIVE_SIZE[0] * SCALE
    cell_height = label_height + NATIVE_SIZE[1] * SCALE
    width = gutter * 4 + cell_width * 3
    height = title_height + cell_height * 2 + row_gap + footer_height
    sheet = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(sheet)
    draw.text((gutter, 42), "XTINCT X3 — MODELED NATIVE SCREENS", fill=INK, font=font(68, bold=True))
    draw.text(
        (gutter, 116),
        "Fictional content · exact 528 × 792 frames · 2× nearest-neighbor presentation",
        fill=MUTED,
        font=font(32),
    )

    for index, (label, _name, image) in enumerate(doubled):
        column = index % 3
        row = index // 3
        x = gutter + column * (cell_width + gutter)
        y = title_height + row * (cell_height + row_gap)
        draw.text((x, y + 8), label, fill=INK, font=font(42, bold=True))
        image_y = y + label_height
        sheet.paste(image, (x, image_y))
        draw.rectangle((x - 2, image_y - 2, x + cell_width + 1, image_y + NATIVE_SIZE[1] * SCALE + 1), outline=INK, width=2)

    draw.text(
        (gutter, height - footer_height + 36),
        "MODELED / SYNTHETIC — not a photograph or physical E-Ink validation",
        fill=MUTED,
        font=font(34),
    )
    output = OUT / "xtinct-x3-native-showcase-2x.png"
    sheet.save(output, optimize=True)
    print(f"Wrote {len(doubled)} 2x frames and {output.name} ({sheet.size[0]} x {sheet.size[1]})")


if __name__ == "__main__":
    main()
