// The entitlement endpoints this console's request/approve flow needs. Update and revoke
// (PUT/DELETE on one entitlement) exist in the contract too, but nothing here uses them yet.
import { api, pageQuery } from './client.js';

export function listEntitlements(institutionId, params, opts) {
  return api.get(`/institutions/${institutionId}/entitlements${pageQuery(params)}`, opts);
}

export function createEntitlement(institutionId, payload) {
  return api.post(`/institutions/${institutionId}/entitlements`, payload);
}

export function changeEntitlementStatus(entitlementId, payload) {
  return api.patch(`/entitlements/${entitlementId}/status`, payload);
}
