import { createHash, randomBytes } from 'crypto';

/**
 * Computes SHA-256 hash in hex format.
 */
export function sha256Hex(data: Buffer | Uint8Array | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf-8') : Buffer.from(data);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Computes SHA-256 hash as Uint8Array bytes.
 */
export function sha256Buffer(data: Buffer | Uint8Array | string): Uint8Array {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf-8') : Buffer.from(data);
  return new Uint8Array(createHash('sha256').update(buf).digest());
}

/**
 * Verifies that data matches an expected SHA-256 hex string.
 */
export function verifyHash(data: Buffer | Uint8Array | string, expectedSha256Hex: string): boolean {
  if (!expectedSha256Hex || expectedSha256Hex.length !== 64) return false;
  const computed = sha256Hex(data);
  return computed.toLowerCase() === expectedSha256Hex.toLowerCase();
}

/**
 * Generates a unique deal ID.
 */
export function generateDealId(buyerPubkey: string, sellerPubkey: string, timestamp = Date.now()): string {
  const seed = `${buyerPubkey}:${sellerPubkey}:${timestamp}:${randomBytes(4).toString('hex')}`;
  return `deal_${sha256Hex(seed).slice(0, 16)}`;
}
