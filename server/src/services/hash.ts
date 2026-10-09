import { createHash } from 'node:crypto';

/**
 * Hashing strategy (documented in the README):
 *   canonical JSON  ->  SHA-256  ->  0x-prefixed 32 bytes  ->  stored on-chain as bytes32
 * Canonical JSON = keys sorted recursively, no whitespace, dates as ISO strings, undefined dropped.
 * The same data therefore always yields the same hash, regardless of key order.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) {
      const val = (v as Record<string, unknown>)[k];
      if (val !== undefined) out[k] = sortValue(val);
    }
    return out;
  }
  return v;
}

export function sha256Hex(input: string): string {
  return '0x' + createHash('sha256').update(input, 'utf8').digest('hex');
}

export const hashRecord = (data: unknown): string => sha256Hex(canonicalize(data));

/** Deterministic on-chain id for a (type, database id) pair. */
export const recordIdFor = (recordType: string, referenceId: string): string =>
  sha256Hex(`jeevanbindu:${recordType}:${referenceId}`);

/** Hash of a related database reference (e.g. the blood request a donation belongs to). */
export const referenceHashFor = (referenceId?: string): string =>
  referenceId ? sha256Hex(`jeevanbindu:ref:${referenceId}`) : '0x' + '0'.repeat(64);
