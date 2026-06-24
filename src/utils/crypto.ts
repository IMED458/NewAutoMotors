/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A simple, fast, and deterministic string hashing function (similar to murmurhash or fnv1a)
 * that produces a solid hex representation of any password string.
 * This runs fully client-side and avoids bloated, environment-dependent crypto libraries.
 */
export function hashPassword(password: string): string {
  let hash = 2166136261;
  for (let i = 0; i < password.length; i++) {
    hash ^= password.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Convert to absolute hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}
