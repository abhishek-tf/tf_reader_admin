import { api } from './client.js';

// The four tenant endpoints from wokay-api.yaml, under /api/admin/v1/tenants (client.js
// prepends the /api/admin/v1 prefix). T&F's own infrastructure view of a publisher - which
// database and vault key it uses, and whether that database connection is healthy - as opposed
// to Publisher's business-data view (publishers.js), which has no such fields at all.
//
// Shapes, exactly as the contract (and the real backend DTOs) define them:
//
//   Tenant                 { id, code, name, vaultRef: string|null, connectionHealth }
//                           vaultRef is opaque - it only ever tells you a key is configured,
//                           never anything worth rendering as content. There is deliberately no
//                           mongoUri anywhere on this shape: the contract gives no way to read
//                           back a publisher's current connection string, only whether one is
//                           configured. Confirmed intentional (never round-tripped on the
//                           backend either), not a gap to work around with a guess.
//   DatabaseWrite          { mongoUri: string|null }   null reverts to T&F's shared database
//   VaultKeyWrite          { keyBase64: string|null }  null reverts to T&F's shared master key;
//                           must decode to exactly 32 bytes or the server answers 400
//                           VALIDATION_FAILED
//   VaultConnectionHealth  NOT_CONFIGURED | HEALTHY | UNREACHABLE
//                           Despite the name, this reflects the DATABASE connection's health,
//                           not the vault's - a known naming mismatch in the contract.
//
// listTenants/getTenant are SUPER_ADMIN only - no self-service carve-out for either GET. The
// two PUT calls are self-service: that publisher's own PUBLISHER_ADMIN, or any SUPER_ADMIN.
// Every 403 from any of these four endpoints is FORBIDDEN_ROLE, never FORBIDDEN_SCOPE. The
// server enforces all of this; nothing here does.
const BASE = '/tenants';

/** Every tenant, unpaged, unfiltered - the endpoint takes no parameters. SUPER_ADMIN only. */
export function listTenants() {
  return api.get(BASE);
}

/** One tenant by publisher id. SUPER_ADMIN only. 404 NOT_FOUND if it doesn't exist. */
export function getTenant(publisherId) {
  return api.get(`${BASE}/${publisherId}`);
}

/**
 * Points this publisher at its own MongoDB database, or `null` to revert to T&F's shared
 * database. Does not migrate existing data - the caller must warn about that before calling
 * this, not after. Answers the updated Tenant, with connectionHealth computed synchronously.
 */
export function setTenantDatabase(publisherId, mongoUri) {
  return api.put(`${BASE}/${publisherId}/database`, { mongoUri });
}

/**
 * Sets this publisher's encryption key, or `null` to revert to T&F's shared master key.
 * `keyBase64` must decode to exactly 32 bytes - validate that client-side first (see
 * tenantVaultKeyValidation.js) so a bad key is a field message before this call, not a round
 * trip that comes back as 400 VALIDATION_FAILED. Write-only: this call's own response never
 * echoes the key back. Answers the updated Tenant (vaultRef becomes non-null once a key is set).
 */
export function setTenantVaultKey(publisherId, keyBase64) {
  return api.put(`${BASE}/${publisherId}/vault-key`, { keyBase64 });
}
