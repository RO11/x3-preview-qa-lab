from __future__ import annotations

from pathlib import Path
import textwrap

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
    ("MARKET · V1 SUMMARY", "daily-cards-v1-market-briefing-528x792.png"),
    ("OPENED MARKET REPORT", "daily-cards-v1-market-briefing-report-528x792.png"),
    ("PROJECT WATCHLIST", "inbox-v2-project-watchlist-open-528x792.png"),
    ("BUSINESS LEADS", "inbox-v2-business-opportunity-open-528x792.png"),
    ("HARDWARE RESEARCH", "inbox-v2-hardware-research-open-528x792.png"),
    ("READER GENOME", "inbox-v2-reader-genome-open-528x792.png"),
)

PRESENTATION_FILES = tuple(dict.fromkeys((
    *(name for _label, name in EXAMPLES),
    "x3-home-native-528x792.png",
    "inbox-v2-default-preview-528x792.png",
    "inbox-v2-feedback-actions-528x792.png",
    "inbox-v2-open-article-528x792.png",
    "inbox-v2-puzzle-preview-528x792.png",
    "inbox-v2-project-watchlist-preview-528x792.png",
)))

CONTENT_COLUMNS = (
    (
        "DAILY CARDS V1",
        "Four fixed, replace-in-place briefing cards",
        (
            ("Market Briefing", "ChatGPT + Interactive Brokers app pattern; bounded read-only analysis, no trades."),
            ("Opportunity Scan", "Weekday freelance leads, source coverage and the next useful check."),
            ("3D Job Search", "Weekly roles with WEEKLY cadence visible on the card and report."),
            ("Attention Watch", "Only same-day human attention; private message bodies stay off-device."),
        ),
    ),
    (
        "INBOX V2",
        "Longer immutable artifacts with per-item actions",
        (
            ("Reader Genome", "Exactly three source-backed long-form articles in one atomic batch."),
            ("E-Ink Serial", "Original 800-1,200-word episode with recap, stopping point and feedback."),
            ("Daily Puzzle", "Three to five puzzles, non-spoiling hints and complete answers."),
            ("Project Watchlist", "Observed changes, unknowns, risks and one bounded experiment."),
            ("Business Opportunities", "Fit, cost, effort, source notes and first action."),
            ("Hardware Research", "Compatibility, budgets, risks and physical-test boundaries."),
            ("Weekend City Guide", "Current planning details in a compact offline guide."),
        ),
    ),
    (
        "TODAY + SYSTEM",
        "One daily edition plus reliable offline mechanics",
        (
            ("Today / Radar EPUB", "Calendar, deadlines, plans, commitments, actions, proof, learning and diagnostics."),
            ("Feedback loop", "Like, dislike, keep, archive, open-phone and delete receipts use a retryable outbox."),
            ("Verified cache", "Bytes, SHA-256 and revisions are checked before atomic promotion on microSD."),
            ("Daily wake", "Bounded wake, refresh and retry windows support one deliberate check each day."),
            ("Sleep screen", "Native 528 x 792 four-gray full-bleed image delivery."),
        ),
    ),
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


def wrapped_lines(text: str, width: int) -> list[str]:
    return textwrap.wrap(text, width=width, break_long_words=False, break_on_hyphens=False)


def build_content_map() -> Path:
    width, height = 2400, 1740
    margin = 70
    gutter = 44
    header_height = 205
    footer_height = 145
    column_width = (width - margin * 2 - gutter * 2) // 3
    card_top = header_height
    card_bottom = height - footer_height
    sheet = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(sheet)

    draw.text((margin, 38), "XTINCT — IMPLEMENTED CONTENT MAP", fill=INK, font=font(70, bold=True))
    draw.text(
        (margin, 118),
        "Sanitized module inventory · fictional examples · V1 and V2 stay deliberately separate",
        fill=MUTED,
        font=font(32),
    )

    for column_index, (heading, subtitle, items) in enumerate(CONTENT_COLUMNS):
        x = margin + column_index * (column_width + gutter)
        draw.rounded_rectangle((x, card_top, x + column_width, card_bottom), radius=18, outline=INK, width=4)
        draw.rectangle((x, card_top, x + column_width, card_top + 118), fill=INK)
        draw.text((x + 28, card_top + 22), heading, fill=PAPER, font=font(39, bold=True))
        draw.text((x + 28, card_top + 132), subtitle, fill=MUTED, font=font(25))
        y = card_top + 202
        for item_heading, item_body in items:
            draw.text((x + 28, y), item_heading, fill=INK, font=font(30, bold=True))
            y += 40
            for line in wrapped_lines(item_body, 43):
                draw.text((x + 28, y), line, fill=MUTED, font=font(23))
                y += 31
            y += 25

    draw.text(
        (margin, height - footer_height + 28),
        "MARKET SOURCE PATTERN: ChatGPT + Interactive Brokers app · read-only analysis · no orders",
        fill=INK,
        font=font(30, bold=True),
    )
    draw.text(
        (margin, height - footer_height + 76),
        "Every company, ticker, price, role, event and article visible in the public demo is invented.",
        fill=MUTED,
        font=font(28),
    )
    output = OUT / "xtinct-implemented-content-map-2400x1740.png"
    sheet.save(output, optimize=True)
    return output


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    presentations: dict[str, tuple[str, Image.Image]] = {}
    for name in PRESENTATION_FILES:
        native = load_native(name)
        presentation = native.resize(
            (NATIVE_SIZE[0] * SCALE, NATIVE_SIZE[1] * SCALE),
            Image.Resampling.NEAREST,
        )
        output_name = name.replace("-528x792.png", "-2x-1056x1584.png")
        presentation.save(OUT / output_name, optimize=True)
        presentations[name] = (output_name, presentation)
    doubled = [
        (label, presentations[name][0], presentations[name][1])
        for label, name in EXAMPLES
    ]

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
    draw.text((gutter, 42), "XTINCT X3 — USEFUL CONTENT, OPENED", fill=INK, font=font(68, bold=True))
    draw.text(
        (gutter, 116),
        "Scheduled fictional briefings · exact 528 × 792 frames · sharp 2× presentation",
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
    content_map = build_content_map()
    print(
        f"Wrote {len(presentations)} 2x frames, {output.name} ({sheet.size[0]} x {sheet.size[1]}) "
        f"and {content_map.name}"
    )


if __name__ == "__main__":
    main()
