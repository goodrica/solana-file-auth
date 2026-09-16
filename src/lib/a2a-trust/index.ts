// src/lib/a2a-trust/index.ts

// Export everything from the submodules
export * from './types';
export * from './crypto';
export * from './client';

// Import the FilmAuthTrustClient class from the client module
import { FilmAuthTrustClient } from './client';

// Define and export the helper factory function
export function createFilmAuthTrustClient(rpcUrl?: string, payerSecretKey?: Uint8Array): FilmAuthTrustClient {
  return new FilmAuthTrustClient(rpcUrl, payerSecretKey);
}
