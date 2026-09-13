// The entitlement endpoints this console's request/approve/grant/amend/revoke flows need.
import { api, pageQuery } from './client.js';

export function listEntitlements(institutionId, params, opts) {
  return api.get(`/institutions/${institutionId}/entitlements${pageQuery(params)}`, opts);
}

export function createEntitlement(institutionId, payload) {
  return api.post(`/institutions/${institutionId}/entitlements`, payload);
}

/**
 * Approve (PENDING -> ACTIVE) or reject (PENDING -> REVOKED) a request. SUPER_ADMIN only, and
 * only from PENDING - anything else is 400 VALIDATION_FAILED. Not how an already-ACTIVE grant
 * is revoked; that is `revokeEntitlement` below.
 */
export function changeEntitlementStatus(entitlementId, payload) {
  return api.patch(`/entitlements/${entitlementId}/status`, payload);
}

/**
 * Amends a grant's terms - copies, loan period, validity window. A full replace, not a patch:
 * the caller sends every field every time, including `version` for optimistic locking.
 */
export function updateEntitlement(entitlementId, payload) {
  return api.put(`/entitlements/${entitlementId}`, payload);
}

/**
 * Revokes a grant outright - SUPER_ADMIN only, and the one path that works regardless of the
 * grant's current status (ACTIVE or SUSPENDED), unlike the PENDING-only status endpoint above.
 * Soft: the grant moves to REVOKED: no request body, no reason field on this endpoint.
 */
export function revokeEntitlement(entitlementId) {
  return api.del(`/entitlements/${entitlementId}`);
}
