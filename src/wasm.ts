// Thin wrapper around the AssemblyScript-generated bindings (src/generated/module.js)
// so the rest of the app deals with a plain TS interface instead of raw wasm exports.

import * as wasmBindings from './generated/module.js';

export interface VpnLookupModule {
  memory: WebAssembly.Memory;
  allocRanges(n: number): void;
  setRange(i: number, start: number, end: number, weight: number): void;
  lookup(ip: number): number;
  rangeCount(): number;
}

/**
 * Parses the binary ranges table (see scripts/build-ranges.mjs for the format)
 * and loads it into the WASM module's memory via allocRanges/setRange.
 */
export async function buildRangeIndex(rangesBuf: ArrayBuffer): Promise<VpnLookupModule> {
  const mod = wasmBindings as VpnLookupModule;
  const RECORD_SIZE = 9; // u32 start + u32 end + u8 weight
  const n = Math.floor(rangesBuf.byteLength / RECORD_SIZE);
  const view = new DataView(rangesBuf);

  mod.allocRanges(n);
  for (let i = 0; i < n; i++) {
    const o = i * RECORD_SIZE;
    const start = view.getUint32(o, false); // big-endian, see build-ranges.mjs
    const end = view.getUint32(o + 4, false);
    const weight = view.getUint8(o + 8);
    mod.setRange(i, start, end, weight);
  }
  return mod;
}

/** "1.2.3.4" -> unsigned 32-bit integer (network byte order semantics) */
export function ipToUint32(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Not a valid IPv4 address: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
