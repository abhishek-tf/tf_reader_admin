/**
 * True when `value` is valid base64 that decodes to exactly 32 bytes (256 bits) - the length
 * setTenantVaultKey's `keyBase64` requires (confirmed against the backend's own decode check).
 * Checked here first so a bad key is a field message before Save is even clicked, not a round
 * trip that comes back as 400 VALIDATION_FAILED.
 *
 * Decodes and measures the actual byte length rather than checking `value.length === 44`:
 * padding varies with how a key was encoded elsewhere, so a plain character count is the wrong
 * check. `atob` returns a binary string with one JS character per decoded byte, so its
 * `.length` is already the byte count - no need to build a Uint8Array. `atob` throws on
 * non-base64 input (stray whitespace, url-safe characters), which is treated as invalid.
 */
export function isValid32ByteKey(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return false;
  try {
    return atob(trimmed).length === 32;
  } catch {
    return false;
  }
}
