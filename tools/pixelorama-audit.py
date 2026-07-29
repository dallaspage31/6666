#!/usr/bin/env python3
"""
Pixelorama Audit Tool
=====================
Scans art asset directories and produces a quality inventory report.

Reads: assets/art/{units,vfx,bosses,backgrounds}*
Writes: tools/out/pixelorama-audit.json

No external dependencies — uses stdlib only (struct, zlib, hashlib, json, os, pathlib).
Full 8-bit RGBA PNG scanline decoder is included.
"""

import struct
import zlib
import hashlib
import json
import os
import sys
from pathlib import Path
from collections import defaultdict

# --- PNG scanline decoder (8-bit truecolor + alpha) ------------------------

def _paeth_predictor(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c

def decode_png_rgba(path):
    with open(path, 'rb') as f:
        sig = f.read(8)
        if sig != b'\x89PNG\r\n\x1a\n':
            return None
        width = height = bit_depth = color_type = None
        idat_chunks = []
        while True:
            length_bytes = f.read(4)
            if len(length_bytes) < 4:
                break
            length = struct.unpack('>I', length_bytes)[0]
            chunk_type = f.read(4)
            data = f.read(length)
            crc = f.read(4)
            if chunk_type == b'IHDR':
                width, height, bit_depth, color_type, comp, filt, inter = struct.unpack('>IIBBBBB', data)
            elif chunk_type == b'IDAT':
                idat_chunks.append(data)
            elif chunk_type == b'IEND':
                break
        if width is None or not idat_chunks:
            return None
        raw = zlib.decompress(b''.join(idat_chunks))
        stride = width * 4
        pixels = bytearray(width * height * 4)
        src = 0
        dst = 0
        for y in range(height):
            filter_type = raw[src]
            src += 1
            for x in range(width):
                if filter_type == 0:
                    val = raw[src:src + 4]
                elif filter_type == 1:
                    val = bytes(
                        (raw[src + i] + (pixels[dst - 4] if x > 0 else 0)) & 0xFF
                        for i in range(4)
                    )
                elif filter_type == 2:
                    val = bytes(
                        (raw[src + i] + (pixels[dst - stride] if y > 0 else 0)) & 0xFF
                        for i in range(4)
                    )
                elif filter_type == 3:
                    val = bytes(
                        (raw[src + i] + (
                            ((pixels[dst - 4] if x > 0 else 0) +
                             (pixels[dst - stride] if y > 0 else 0)) // 2
                        )) & 0xFF
                        for i in range(4)
                    )
                elif filter_type == 4:
                    val = bytes(
                        (raw[src + i] + _paeth_predictor(
                            pixels[dst - 4] if x > 0 else 0,
                            pixels[dst - stride] if y > 0 else 0,
                            pixels[dst - stride - 4] if x > 0 and y > 0 else 0,
                        )) & 0xFF
                        for i in range(4)
                    )
                else:
                    return None
                pixels[dst:dst + 4] = val
                src += 4
                dst += 4
        return {
            'width': width,
            'height': height,
            'bit_depth': bit_depth,
            'color_type': color_type,
            'pixels': bytes(pixels),
            'stride': stride,
        }

# --- Helpers ---------------------------------------------------------------

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()

def corner_pixels(info, margin=2):
    w, h = info['width'], info['height']
    px = info['pixels']
    stride = info['stride']
    corners = []
    for y in (0, h - margin):
        for x in (0, w - margin):
            base = (y * stride) + (x * 4)
            corners.append(px[base:base + 4])
    return corners

def has_alpha(info):
    px = info['pixels']
    return any(px[i + 3] != 0 for i in range(0, len(px), 4))

def bbox_of_alpha(info):
    px = info['pixels']
    stride = info['stride']
    w, h = info['width'], info['height']
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            a = px[(y * stride) + (x * 4) + 3]
            if a != 0:
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
    if max_x == -1:
        return None
    return {'x': min_x, 'y': min_y, 'w': max_x - min_x + 1, 'h': max_y - min_y + 1}

def unique_pixel_set(info, sample_every=4):
    px = info['pixels']
    stride = info['stride']
    w, h = info['width'], info['height']
    seen = set()
    for y in range(0, h, sample_every):
        for x in range(0, w, sample_every):
            base = (y * stride) + (x * 4)
            seen.add(bytes(px[base:base + 4]))
    return seen

def detect_fake_alpha(info, tolerance=8):
    px = info['pixels']
    stride = info['stride']
    w, h = info['width'], info['height']
    if not has_alpha(info):
        return False
    sample = unique_pixel_set(info)
    for rgba in sample:
        a = rgba[3]
        if a == 0:
            continue
        r, g, b = rgba[0], rgba[1], rgba[2]
        # Check if color channels are suspiciously uniform for a "fake" transparent plate
        if (r + g + b) == 0:
            continue
        # A real alpha asset should have color variation within opaque regions;
        # a legacy checkerboard fake-transparency asset often has uniform color
        # with only alpha varying. We flag if > 85% of opaque pixels share nearly
        # identical RGB.
        count = 0
        total_opaque = 0
        for y in range(h):
            for x in range(w):
                base = (y * stride) + (x * 4)
                if px[base + 3] != 0:
                    total_opaque += 1
                    if abs(px[base] - r) <= tolerance and abs(px[base + 1] - g) <= tolerance and abs(px[base + 2] - b) <= tolerance:
                        count += 1
        if total_opaque > 0 and (count / total_opaque) > 0.85:
            return True
    return False

# --- Main audit -------------------------------------------------------------

def audit_art(root_dirs, standards_path='tools/pixelorama-standards.json'):
    with open(standards_path, 'r', encoding='utf-8') as f:
        standards = json.load(f)

    unit_w = standards['masterStandard']['unitCoreVFX']['width']
    unit_h = standards['masterStandard']['unitCoreVFX']['height']
    boss_w = standards['masterStandard']['uniqueBossStill']['width']
    boss_h = standards['masterStandard']['uniqueBossStill']['height']

    files = []
    for root in root_dirs:
        p = Path(root)
        if not p.exists():
            continue
        files.extend(p.rglob('*.png'))

    total = len(files)
    non_transparent_corner = 0
    alpha_border_touch = 0
    full_canvas_alpha_bbox = 0
    runtime_oversized = 0
    fake_transparency = 0
    exact_duplicates = 0
    duplicate_groups = []
    dimension_errors = []
    decode_failures = []

    hash_map = defaultdict(list)

    categorized = {
        'unit_vfx': {'expected_w': unit_w, 'expected_h': unit_h, 'count': 0},
        'boss': {'expected_w': boss_w, 'expected_h': boss_h, 'count': 0},
        'other': {'expected_w': None, 'expected_h': None, 'count': 0},
    }

    for i, path in enumerate(files):
        rel = str(path)
        category = 'other'
        if '/bosses/' in rel or '\\bosses\\' in rel:
            category = 'boss'
        elif '/units/' in rel or '\\units\\' in rel or '/vfx/' in rel or '\\vfx\\' in rel:
            category = 'unit_vfx'

        info = None
        try:
            info = decode_png_rgba(path)
        except Exception:
            decode_failures.append(rel)
            continue

        if info is None:
            decode_failures.append(rel)
            continue

        w, h = info['width'], info['height']
        expected = (categorized[category]['expected_w'], categorized[category]['expected_h'])
        if expected[0] and (w != expected[0] or h != expected[1]):
            dimension_errors.append({'file': rel, 'expected': expected, 'actual': (w, h)})

        categorized[category]['count'] += 1

        hsh = sha256_file(path)
        hash_map[hsh].append(rel)

        corners = corner_pixels(info)
        has_nontransparent_corner = any(c[3] != 0 for c in corners)
        if has_nontransparent_corner:
            non_transparent_corner += 1

        bbox = bbox_of_alpha(info)
        if bbox is None:
            full_canvas_alpha_bbox += 1
        else:
            if bbox['x'] == 0 and bbox['y'] == 0 and bbox['w'] == w and bbox['h'] == h:
                full_canvas_alpha_bbox += 1

        alpha_border = False
        if bbox and has_alpha(info):
            if bbox['x'] == 0 or bbox['y'] == 0 or bbox['x'] + bbox['w'] == w or bbox['y'] + bbox['h'] == h:
                alpha_border = True
        if alpha_border:
            alpha_border_touch += 1

        if w > unit_w or h > unit_h:
            runtime_oversized += 1

        if detect_fake_alpha(info):
            fake_transparency += 1

    for hsh, members in hash_map.items():
        if len(members) > 1:
            exact_duplicates += len(members)
            duplicate_groups.append({'hash': hsh, 'files': members})

    report = {
        'meta': {
            'scannedAt': '2026-07-29T02:56:24Z',
            'rootDirs': root_dirs,
            'standardsFile': standards_path,
            'totalFiles': total,
        },
        'summary': {
            'inspectedUnitVfxFiles': categorized['unit_vfx']['count'],
            'inspectedBossFiles': categorized['boss']['count'],
            'inspectedOtherFiles': categorized['other']['count'],
            'nonTransparentCorner': non_transparent_corner,
            'alphaBorderTouch': alpha_border_touch,
            'fullCanvasAlphaBbox': full_canvas_alpha_bbox,
            'runtimeOversizedFrame': runtime_oversized,
            'fakeTransparencyVfx': fake_transparency,
            'exactDuplicateGroups': len(duplicate_groups),
            'exactDuplicateFiles': exact_duplicates,
            'decodeFailures': len(decode_failures),
            'dimensionErrors': len(dimension_errors),
        },
        'findings': {
            'decodeFailures': decode_failures[:100],
            'dimensionErrors': dimension_errors[:100],
            'duplicateGroups': duplicate_groups[:50],
        },
    }
    return report

def write_report(report, out_path='tools/out/pixelorama-audit.json'):
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f'Audit written to {out_path}')

def main():
    roots = [
        'assets/art/units',
        'assets/art/vfx',
        'assets/art/bosses',
        'assets/art/backgrounds',
        'assets/art/mossroad',
    ]
    report = audit_art(roots)
    write_report(report)
    s = report['summary']
    print(f"Files scanned: {report['meta']['totalFiles']}")
    print(f"Unit/VFX: {s['inspectedUnitVfxFiles']}  Boss: {s['inspectedBossFiles']}  Other: {s['inspectedOtherFiles']}")
    print(f"Non-transparent corner: {s['nonTransparentCorner']}")
    print(f"Alpha border touch: {s['alphaBorderTouch']}")
    print(f"Full-canvas alpha bbox: {s['fullCanvasAlphaBbox']}")
    print(f"Runtime oversized: {s['runtimeOversizedFrame']}")
    print(f"Fake transparency: {s['fakeTransparencyVfx']}")
    print(f"Duplicate groups: {s['exactDuplicateGroups']}  duplicate files: {s['exactDuplicateFiles']}")
    if s['decodeFailures'] or s['dimensionErrors']:
        print('ISSUES FOUND — check tools/out/pixelorama-audit.json')
        sys.exit(1)
    print('CLEAN')

if __name__ == '__main__':
    main()
