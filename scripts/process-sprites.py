#!/usr/bin/env python3
"""Process sprite sheets: extract individual frames and generate JSON metadata.

Usage:
    python scripts/process-sprites.py \\
        --input sprites/Knight_sheet.png \\
        --output public/heroes/Knight \\
        --columns 8 --rows 6 --prefix Knight

Naming convention for extracted frames:
    {prefix}_{class}_{direction}_{frame}.png

If --columns and --rows are omitted, the script attempts to auto-detect
a uniform grid based on the sheet dimensions and an optional --frame-size.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

DIRECTIONS = ["down", "left", "right", "up"]
ANIMATION_FRAMES = ["idle", "walk", "run", "attack", "hurt", "dead"]


@dataclass
class FrameInfo:
    """Metadata for a single extracted frame."""

    filename: str
    frame_index: int
    x: int
    y: int
    width: int
    height: int
    row: int
    column: int
    direction: str | None = None
    animation: str | None = None


@dataclass
class SpriteMetadata:
    """Metadata for an entire processed sprite sheet."""

    source: str
    frame_width: int
    frame_height: int
    columns: int
    rows: int
    total_frames: int
    frames: list[FrameInfo] = field(default_factory=list)
    animations: dict[str, list[dict]] = field(default_factory=dict)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract frames from sprite sheets and generate JSON metadata."
    )
    parser.add_argument(
        "--input",
        "-i",
        required=True,
        help="Path to the input sprite sheet image (PNG recommended).",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="public/heroes",
        help="Output directory for extracted frames and metadata (default: public/heroes).",
    )
    parser.add_argument(
        "--columns",
        "-c",
        type=int,
        default=None,
        help="Number of columns in the sprite sheet grid.",
    )
    parser.add_argument(
        "--rows",
        "-r",
        type=int,
        default=None,
        help="Number of rows in the sprite sheet grid.",
    )
    parser.add_argument(
        "--frame-size",
        type=int,
        default=None,
        help="Pixel size of a square frame (used for auto-detection when columns/rows not given).",
    )
    parser.add_argument(
        "--prefix",
        "-p",
        default=None,
        help="Prefix for output filenames (e.g. hero class name).",
    )
    parser.add_argument(
        "--class-name",
        default=None,
        help="Hero or monster class name for naming convention (e.g. Knight, Goblin).",
    )
    parser.add_argument(
        "--directions",
        nargs="+",
        default=DIRECTIONS,
        help="List of directions (default: down left right up).",
    )
    parser.add_argument(
        "--animations",
        nargs="+",
        default=ANIMATION_FRAMES,
        help="List of animation names (default: idle walk run attack hurt dead).",
    )
    parser.add_argument(
        "--skip-json",
        action="store_true",
        help="Skip writing the JSON metadata file.",
    )
    parser.add_argument(
        "--format",
        choices=["png", "webp"],
        default="png",
        help="Output image format for extracted frames (default: png).",
    )
    return parser.parse_args()


def resolve_grid(
    sheet_width: int,
    sheet_height: int,
    columns: int | None,
    rows: int | None,
    frame_size: int | None,
) -> tuple[int, int, int, int]:
    """Resolve frame dimensions and grid size.

    Returns (frame_width, frame_height, columns, rows).
    """
    if columns is not None and rows is not None:
        fw = sheet_width // columns
        fh = sheet_height // rows
        return fw, fh, columns, rows

    if columns is not None:
        fw = sheet_width // columns
        rows = sheet_height // fw
        return fw, fw, columns, rows

    if rows is not None:
        fh = sheet_height // rows
        columns = sheet_width // fh
        return fh, fh, columns, rows

    if frame_size is not None:
        fw = frame_size
        fh = frame_size
        columns = sheet_width // fw
        rows = sheet_height // fh
        return fw, fh, columns, rows

    raise ValueError(
        "Cannot auto-detect grid. Provide --columns and --rows, or --frame-size."
    )


def build_frame_name(
    prefix: str | None,
    class_name: str | None,
    direction: str,
    frame_index: int,
    animation: str | None,
) -> str:
    """Build a filename following the hero_class_direction_frame convention."""
    parts: list[str] = []
    if prefix:
        parts.append(prefix)
    if class_name:
        parts.append(class_name)
    parts.append(direction)
    if animation:
        parts.append(animation)
    parts.append(f"frame_{frame_index}")
    return "_".join(parts)


def extract_frames(
    image: Image.Image,
    frame_width: int,
    frame_height: int,
    columns: int,
    rows: int,
    output_dir: Path,
    prefix: str | None,
    class_name: str | None,
    directions: list[str],
    animations: list[str],
    fmt: str,
) -> SpriteMetadata:
    """Extract individual frames from the sprite sheet and save them."""
    frames: list[FrameInfo] = []
    animations_map: dict[str, list[dict]] = {}

    frame_idx = 0
    for row in range(rows):
        for col in range(columns):
            x = col * frame_width
            y = row * frame_height

            if x + frame_width > image.width or y + frame_height > image.height:
                break

            frame = image.crop((x, y, x + frame_width, y + frame_height))

            direction = directions[row] if row < len(directions) else f"row_{row}"
            animation = animations[col] if col < len(animations) else None

            filename = build_frame_name(
                prefix, class_name, direction, frame_idx, animation
            )
            ext = "png" if fmt == "png" else "webp"
            filename = f"{filename}.{ext}"

            output_path = output_dir / filename
            save_kwargs = {"optimize": True}
            if fmt == "png":
                save_kwargs["compress_level"] = 9
            frame.save(output_path, **save_kwargs)

            fi = FrameInfo(
                filename=filename,
                frame_index=frame_idx,
                x=x,
                y=y,
                width=frame_width,
                height=frame_height,
                row=row,
                column=col,
                direction=direction,
                animation=animation,
            )
            frames.append(fi)

            if animation:
                animations_map.setdefault(animation, []).append(
                    {
                        "filename": filename,
                        "frame_index": frame_idx,
                        "x": x,
                        "y": y,
                        "width": frame_width,
                        "height": frame_height,
                        "direction": direction,
                    }
                )

            frame_idx += 1

    return SpriteMetadata(
        source=str(image.filename or "unknown"),
        frame_width=frame_width,
        frame_height=frame_height,
        columns=columns,
        rows=rows,
        total_frames=len(frames),
        frames=[
            {
                "filename": f.filename,
                "frame_index": f.frame_index,
                "x": f.x,
                "y": f.y,
                "width": f.width,
                "height": f.height,
                "row": f.row,
                "column": f.column,
                "direction": f.direction,
                "animation": f.animation,
            }
            for f in frames
        ],
        animations=animations_map,
    )


def write_metadata(metadata: SpriteMetadata, output_dir: Path) -> Path:
    """Write the JSON metadata file alongside extracted frames."""
    metadata_path = output_dir / "frames.json"
    data = {
        "source": metadata.source,
        "frame_width": metadata.frame_width,
        "frame_height": metadata.frame_height,
        "columns": metadata.columns,
        "rows": metadata.rows,
        "total_frames": metadata.total_frames,
        "frames": metadata.frames,
        "animations": metadata.animations,
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return metadata_path


def import_pil():
    """Lazily import Pillow so --help works without it installed."""
    try:
        from PIL import Image
    except ImportError:
        print(
            "Error: Pillow (PIL) is required. Install with: pip install Pillow",
            file=sys.stderr,
        )
        sys.exit(1)
    return Image


def process_sprite_sheet(args: argparse.Namespace) -> int:
    Image = import_pil()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        return 1

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(input_path)
    image = image.convert("RGBA")

    sheet_width, sheet_height = image.size

    try:
        fw, fh, cols, rws = resolve_grid(
            sheet_width, sheet_height, args.columns, args.rows, args.frame_size
        )
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    print(
        f"Processing {input_path.name} "
        f"({sheet_width}x{sheet_height}) -> {cols}x{rws} grid "
        f"({fw}x{fh} per frame)"
    )

    prefix = args.prefix or (
        args.class_name.lower() if args.class_name else None
    )
    class_name = args.class_name

    metadata = extract_frames(
        image=image,
        frame_width=fw,
        frame_height=fh,
        columns=cols,
        rows=rws,
        output_dir=output_dir,
        prefix=prefix,
        class_name=class_name,
        directions=args.directions,
        animations=args.animations,
        fmt=args.format,
    )

    print(f"Extracted {metadata.total_frames} frames to {output_dir}/")

    if not args.skip_json:
        meta_path = write_metadata(metadata, output_dir)
        print(f"Wrote metadata to {meta_path}")

    return 0


def main() -> None:
    args = parse_args()
    sys.exit(process_sprite_sheet(args))


if __name__ == "__main__":
    main()
