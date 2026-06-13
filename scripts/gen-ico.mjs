// Creates a modern PNG-in-ICO file from the 16px and 32px PNGs
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const p16 = readFileSync(join(root, "public/favicon-16.png"));
const p32 = readFileSync(join(root, "public/favicon-32.png"));

function writeUint16LE(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}
function writeUint32LE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}

const count = 2;
const headerSize = 6;
const entrySize = 16;
const dataOffset16 = headerSize + entrySize * count;
const dataOffset32 = dataOffset16 + p16.length;

const header = Buffer.concat([
  writeUint16LE(0),    // reserved
  writeUint16LE(1),    // type: 1 = ICO
  writeUint16LE(count),
]);

function entry(size, pngBuf, offset) {
  return Buffer.concat([
    Buffer.from([size === 256 ? 0 : size]),  // width (0 = 256)
    Buffer.from([size === 256 ? 0 : size]),  // height
    Buffer.from([0]),                        // color count
    Buffer.from([0]),                        // reserved
    writeUint16LE(1),                        // planes
    writeUint16LE(32),                       // bit count
    writeUint32LE(pngBuf.length),            // size of image data
    writeUint32LE(offset),                   // offset to image data
  ]);
}

const ico = Buffer.concat([
  header,
  entry(16, p16, dataOffset16),
  entry(32, p32, dataOffset32),
  p16,
  p32,
]);

writeFileSync(join(root, "public/favicon.ico"), ico);
console.log(`✓ public/favicon.ico (16×16 + 32×32)`);
