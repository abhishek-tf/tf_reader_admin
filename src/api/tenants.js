import { api, pageQuery } from './client.js';

// Talks to the tenants endpoint, ahead of the backend's multi-tenancy migration. There is no
// /tenants path or Tenant schema in wokay-api.yaml yet (checked: neither "tenant" nor "kms"
// appears anywhere in the contract), so everything below is provisional and every field on the
// response must be read defensively until the backend ships this for real.
//
// Proposed shape, not yet contracted:
//
//   Tenant      { id, publisherId?, publisherName?, publisherCode?, databaseRef?,
//                 keyVaultRef?, healthStatus?, region?, createdAt? }
//   TenantPage  { items: Tenant[], page, size, total }     page is ZERO based
//
// `healthStatus` is expected to be a status string (e.g. HEALTHY/DEGRADED/UNREACHABLE);
// StatusBadge already falls back to the raw value for anything it doesn't recognise, so an
// unexpected string here does not need a client-side guard.
const BASE = '/tenants';

/**
 * A page of tenants. `q` searches, `status` narrows by health status. Both optional, and
 * pageQuery drops an empty one.
 */
export function listTenants({ q, status, page = 0, size = 20 } = {}) {
  return api.get(`${BASE}${pageQuery({ page, size, q, status })}`);
}
