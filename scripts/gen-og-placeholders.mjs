import fs from 'node:fs';
import zlib from 'node:zlib';

// Generates simple 1200x630 white PNGs as OG placeholders.
// This is a stopgap until we have designed OG images.

const WIDTH = 1200;
const HEIGHT = 630;

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function makePng({ width, height }) {
  const header = Buffer.from('89504e470d0a1a0a', 'hex');

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw scanlines: filter byte (0) + RGBA pixels per row.
  const raw = Buffer.alloc((width * 4 + 1) * height, 0xff);
  for (let y = 0; y < height; y++) raw[y * (width * 4 + 1)] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = new URL('../public/og/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });

const png = makePng({ width: WIDTH, height: HEIGHT });
const names = ['home', 'zyn-australia', 'nicotine-pouches-australia'];

for (const name of names) {
  const outPath = new URL(`./${name}.png`, outDir);
  fs.writeFileSync(outPath, png);
}

console.log(`Wrote ${names.length} OG placeholders (${WIDTH}x${HEIGHT}) to public/og/*.png`);
