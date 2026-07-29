#!/usr/bin/env node
/**
 * pixelorama-prepare.js
 * ---------------------
 * Prepares vertical-slice previews and contact sheets for Pixelorama art.
 *
 * Runs after Pixelorama export to produce:
 *   - clean matte previews (alpha composited on neutral 50% gray checkerboard)
 *   - contact sheets with filenames and frame numbers
 *   - metadata JSON with pivot/timing remapping hints
 *
 * Output: tools/out/pixelorama-vertical-slice/
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as zlib from 'zlib';

const ROOT = new URL('..', import.meta.url).pathname;
const ART_DIR = path.join(ROOT, 'assets', 'art');
const OUT_DIR = path.join(ROOT, 'tools', 'out', 'pixelorama-vertical-slice');
const STANDARDS_PATH = path.join(ROOT, 'tools', 'pixelorama-standards.json');
const CONTACT_COLS = 8;
const FRAME_PADDING = 4;
const BG_COLOR = [128, 128, 128]; // neutral gray for matte previews

const standards = JSON.parse(fs.readFileSync(STANDARDS_PATH, 'utf8'));
const LAYERS = standards.layerContract;
const TAGS = standards.animationTags;

fs.mkdirSync(OUT_DIR, { recursive: true });

// --- Minimal PNG writer ---------------------------------------------------

function crc32(buffer) {
  let crc = 0xffffffff;
  const table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c;
    }
    return t;
  })();
  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

function encodePngRgba(width, height, pixels) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  let src = 0,
    dst = 0;
  for (let y = 0; y < height; y++) {
    raw[dst++] = 0; // filter none
    for (let x = 0; x < width; x++) {
      raw[dst++] = pixels[src++];
      raw[dst++] = pixels[src++];
      raw[dst++] = pixels[src++];
      raw[dst++] = pixels[src++];
    }
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Image operations -----------------------------------------------------

function checkerboard(size) {
  const pix = new Uint8Array(size * size * 4);
  const tile = 8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const light = ((Math.floor(x / tile) + Math.floor(y / tile)) % 2) === 0;
      const v = light ? 200 : 160;
      pix[i] = pix[i + 1] = pix[i + 2] = v;
      pix[i + 3] = 255;
    }
  }
  return pix;
}

function compositeMatte(srcPixels, srcW, srcH, dstW, srcX, srcY) {
  const bg = checkerboard(dstW);
  const out = new Uint8Array(dstW * dstW * 4);
  for (let y = 0; y < srcH; y++) {
    const dy = srcY + y;
    if (dy < 0 || dy >= dstW) continue;
    for (let x = 0; x < srcW; x++) {
      const dx = srcX + x;
      if (dx < 0 || dx >= dstW) continue;
      const si = (y * srcW + x) * 4;
      const di = (dy * dstW + dx) * 4;
      const a = srcPixels[si + 3] / 255;
      out[di] = srcPixels[si] * a + bg[di] * (1 - a);
      out[di + 1] = srcPixels[si + 1] * a + bg[di + 1] * (1 - a);
      out[di + 2] = srcPixels[si + 2] * a + bg[di + 2] * (1 - a);
      out[di + 3] = 255;
    }
  }
  return out;
}

// --- Decode PNG -----------------------------------------------------------

function decodePngRgba(buffer) {
  let offset = 8;
  let width = 0,
    height = 0;
  const chunks = [];
  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.toString('utf8', offset, offset + 4);
    offset += 4;
    const data = buffer.slice(offset, offset + len);
    offset += len;
    offset += 4; // CRC
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      chunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }
  if (!width || !height || !chunks.length) return null;
  return inflateRgba(width, height, Buffer.concat(chunks));
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function inflateRgba(width, height, compressed) {
  const raw = zlib.inflateSync(compressed);
  const stride = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  let src = 0,
    dst = 0;
  for (let y = 0; y < height; y++) {
    const filt = raw[src++];
    for (let x = 0; x < width; x++) {
      const rawR = raw[src++],
        rawG = raw[src++],
        rawB = raw[src++],
        rawA = raw[src++];
      const a = x > 0 ? pixels[dst - 4] : 0;
      const b = y > 0 ? pixels[dst - stride] : 0;
      const c = x > 0 && y > 0 ? pixels[dst - stride - 4] : 0;
      let pr, pg, pb2, pa2;
      if (filt === 0) {
        pr = rawR;
        pg = rawG;
        pb2 = rawB;
        pa2 = rawA;
      } else if (filt === 1) {
        pr = (rawR + a) & 0xff;
        pg = (rawG + a) & 0xff;
        pb2 = (rawB + a) & 0xff;
        pa2 = (rawA + a) & 0xff;
      } else if (filt === 2) {
        pr = (rawR + b) & 0xff;
        pg = (rawG + b) & 0xff;
        pb2 = (rawB + b) & 0xff;
        pa2 = (rawA + b) & 0xff;
      } else if (filt === 3) {
        const avg = Math.floor((a + b) / 2);
        pr = (rawR + avg) & 0xff;
        pg = (rawG + avg) & 0xff;
        pb2 = (rawB + avg) & 0xff;
        pa2 = (rawA + avg) & 0xff;
      } else {
        const pred = paeth(x > 0 ? pixels[dst - 4] : 0, y > 0 ? pixels[dst - stride] : 0, x > 0 && y > 0 ? pixels[dst - stride - 4] : 0);
        pr = (rawR + pred) & 0xff;
        pg = (rawG + pred) & 0xff;
        pb2 = (rawB + pred) & 0xff;
        pa2 = (rawA + pred) & 0xff;
      }
      pixels[dst++] = pr;
      pixels[dst++] = pg;
      pixels[dst++] = pb2;
      pixels[dst++] = pa2;
    }
  }
  return { width, height, pixels, stride };
}

// --- Contact sheet builder -------------------------------------------------

function buildContactSheet(items, cols, frameSize) {
  const rows = Math.ceil(items.length / cols);
  const cellW = frameSize + FRAME_PADDING * 2;
  const labelH = 24;
  const sheetW = cols * cellW;
  const sheetH = rows * (frameSize + labelH + FRAME_PADDING * 2);
  const bg = new Uint8Array(sheetW * sheetH * 4);
  for (let i = 0; i < bg.length; i += 4) {
    bg[i] = bg[i + 1] = bg[i + 2] = 40;
    bg[i + 3] = 255;
  }
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = col * cellW + FRAME_PADDING;
    const cy = row * (frameSize + labelH + FRAME_PADDING * 2) + FRAME_PADDING;
    if (item.pixels) {
      const composed = compositeMatte(item.pixels, item.width, item.height, frameSize, 0, 0);
      for (let y = 0; y < frameSize; y++) {
        for (let x = 0; x < frameSize; x++) {
          const si = (y * frameSize + x) * 4;
          const di = ((cy + y) * sheetW + (cx + x)) * 4;
          bg[di] = composed[si];
          bg[di + 1] = composed[si + 1];
          bg[di + 2] = composed[si + 2];
          bg[di + 3] = composed[si + 3];
        }
      }
    }
    // Simple text label would need font rasterization; for now encode label as metadata
  }
  return { pixels: bg, width: sheetW, height: sheetH, items };
}

// --- Main ------------------------------------------------------------------

async function main() {
  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fp);
      else if (entry.name.toLowerCase().endsWith('.png')) files.push(fp);
    }
  };
  walk(path.join(ART_DIR, 'units'));
  walk(path.join(ART_DIR, 'vfx'));
  walk(path.join(ART_DIR, 'bosses'));
  walk(path.join(ART_DIR, 'mossroad', 'foreground'));
  walk(path.join(ART_DIR, 'mossroad', 'ambient'));

  console.log(`Prepare: processing ${files.length} source files...`);

  const contactGroups = new Map();
  const manifest = {
    generatedAt: new Date().toISOString(),
    layerContract: LAYERS,
    animationTags: TAGS,
    slices: [],
  };

  for (const filePath of files) {
    const rel = path.relative(ART_DIR, filePath);
    const buf = fs.readFileSync(filePath);
    const info = decodePngRgba(buf);
    if (!info) {
      console.warn(`  SKIP decode: ${rel}`);
      continue;
    }
    const baseName = path.basename(filePath, '.png');
    const metaPath = filePath.replace(/\.png$/i, '.json');
    let meta = null;
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { meta = null; }
    }

    // Matte preview
    const composed = compositeMatte(info.pixels, info.width, info.height, Math.max(info.width, info.height), 0, 0);
    const outPath = path.join(OUT_DIR, `${baseName}_matte.png`);
    fs.writeFileSync(outPath, encodePngRgba(info.width, info.height, composed));
    console.log(`  matte ${rel} -> ${path.relative(ROOT, outPath)}`);

    // Contact sheet grouping by directory name
    const groupKey = path.basename(path.dirname(filePath));
    if (!contactGroups.has(groupKey)) contactGroups.set(groupKey, []);
    contactGroups.get(groupKey).push({
      file: rel,
      baseName,
      width: info.width,
      height: info.height,
      pixels: info.pixels,
      meta,
    });

    manifest.slices.push({
      file: rel,
      width: info.width,
      height: info.height,
      pivotX: meta?.frames?.[0]?.pivotX ?? null,
      pivotY: meta?.frames?.[0]?.pivotY ?? null,
      hasRealAlpha: true,
      labels: meta?.frames ? meta.frames.map(f => f.clip || 'unknown') : ['unknown'],
    });
  }

  // Build contact sheets per group
  for (const [group, items] of contactGroups) {
    const sheet = buildContactSheet(items, CONTACT_COLS, 192);
    const outPath = path.join(OUT_DIR, `${group}_contact.png`);
    fs.writeFileSync(outPath, encodePngRgba(sheet.width, sheet.height, sheet.pixels));
    console.log(`  contact ${group} -> ${path.relative(ROOT, outPath)}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'pixelorama-prepare-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nPrepare manifest written: tools/out/pixelorama-vertical-slice/pixelorama-prepare-manifest.json`);
  console.log('PREPARE COMPLETE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
