// Converts data/ranges/*.json into public/ranges.bin for WASM binary search.
//
// Binary format (big-endian), per range: u32 start, u32 end, u8 weight.
// Run: npm run build:data  (also in predev/prebuild)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rangesDir = path.join(__dirname, '..', 'data', 'ranges');
const legacyPath = path.join(__dirname, '..', 'data', 'ranges.json');
const outPath = path.join(__dirname, '..', 'public', 'ranges.bin');

function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function cidrToRange(cidr) {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = Number(prefixStr);
  if (prefix < 0 || prefix > 32) throw new Error(`Invalid prefix in ${cidr}`);
  const base = ipToInt(ip);
  const hostBits = 32 - prefix;
  const mask = hostBits === 32 ? 0 : (0xffffffff << hostBits) >>> 0;
  const start = (base & mask) >>> 0;
  const end = (start | (hostBits === 32 ? 0xffffffff : ~mask >>> 0)) >>> 0;
  return { start, end };
}

function loadAllRanges() {
  const entries = [];

  if (readdirSync(path.join(__dirname, '..', 'data')).includes('ranges')) {
    for (const file of readdirSync(rangesDir)) {
      if (!file.endsWith('.json')) continue;
      const chunk = JSON.parse(readFileSync(path.join(rangesDir, file), 'utf-8'));
      entries.push(...chunk);
      console.log(`[build-ranges] +${chunk.length} from ${file}`);
    }
  }

  try {
    const legacy = JSON.parse(readFileSync(legacyPath, 'utf-8'));
    entries.push(...legacy);
    console.log(`[build-ranges] +${legacy.length} from legacy ranges.json`);
  } catch {
    /* legacy file removed */
  }

  return entries;
}

function main() {
  const raw = loadAllRanges();

  const ranges = raw
    .filter((entry) => entry.cidr && !entry.cidr.includes(':'))
    .map((entry) => {
      const { start, end } = cidrToRange(entry.cidr);
      return { start, end, weight: entry.weight, label: entry.label };
    })
    .sort((a, b) => a.start - b.start);

  const clean = [];
  for (const r of ranges) {
    const prev = clean[clean.length - 1];
    if (prev && r.start <= prev.end) {
      if (r.end <= prev.end) continue;
      r.start = prev.end + 1;
    }
    clean.push(r);
  }

  const buf = Buffer.alloc(clean.length * 9);
  clean.forEach((r, i) => {
    const o = i * 9;
    buf.writeUInt32BE(r.start, o);
    buf.writeUInt32BE(r.end, o + 4);
    buf.writeUInt8(r.weight, o + 8);
  });

  writeFileSync(outPath, buf);
  console.log(`[build-ranges] wrote ${clean.length} ranges (${buf.length} bytes) -> ${outPath}`);
}

main();
