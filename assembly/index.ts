// AssemblyScript module compiled to WebAssembly.
//
// Stores a sorted, non-overlapping list of IPv4 ranges (as u32 start/end pairs)
// each tagged with a confidence "weight" (0-255), and exposes a binary-search
// lookup so the JS side can check "is this IP inside a known VPN/hosting range"
// in O(log n) even with tens of thousands of entries.

let starts: Uint32Array = new Uint32Array(0);
let ends: Uint32Array = new Uint32Array(0);
let weights: Uint8Array = new Uint8Array(0);
let count: i32 = 0;

/** Allocate storage for `n` ranges. Call once before setRange(). */
export function allocRanges(n: i32): void {
  starts = new Uint32Array(n);
  ends = new Uint32Array(n);
  weights = new Uint8Array(n);
  count = n;
}

/**
 * Write range i. Ranges MUST be inserted in ascending order of `start`,
 * and must not overlap (the data-build script guarantees this).
 */
export function setRange(i: i32, start: u32, end: u32, weight: u8): void {
  starts[i] = start;
  ends[i] = end;
  weights[i] = weight;
}

/**
 * Binary search for the range containing `ip`.
 * Returns the weight (0-255) of the matching range, or -1 if no match.
 */
export function lookup(ip: u32): i32 {
  let lo = 0;
  let hi = count - 1;
  let candidate = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= ip) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (candidate == -1) return -1;
  if (ip <= ends[candidate]) return weights[candidate];
  return -1;
}

/** How many ranges are currently loaded (sanity-check helper for the UI). */
export function rangeCount(): i32 {
  return count;
}
