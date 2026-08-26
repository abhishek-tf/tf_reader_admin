import { api, pageQuery } from './client.js';

// The four admin user endpoints from wokay-api.yaml. Paths are relative to /api/admin/v1,
// which client.js prepends, so nothing here repeats the prefix.
//
// Shapes, as the backend actually answers them:
//
//   AdminUser        { id, email, name, role, scopePublisherId, scopeInstitutionId, status }
//   AdminUserPage    { items: AdminUser[], page, size, total }      page is ZERO based
//   AdminUserCreate  { email, name, password, role, scopePublisherId?, scopeInstitutionId? }
//                    email, name, password and role are all required
//   AdminUserUpdate  { name, role, password?, scopePublisherId?, scopeInstitutionId? }
//                    name and role are required, and there is deliberately no email
//
// `role` is an AdminRole: SUPER_ADMIN, PUBLISHER_ADMIN or INSTITUTION_ADMIN. Send the enum
// value, never a label.
//
// ── About `status` ───────────────────────────────────────────────────────────────────────
// It is ACTIVE, SUSPENDED or DISABLED, and deactivating sets DISABLED. Note that
// wokay-api.yaml documents this field as a RecordStatus (ACTIVE, SUSPENDED, RETIRED), which
// the backend does not implement: AdminUser carries its own AdminStatus enum with DISABLED in
// place of RETIRED. The server is the one to trust here. Recorded because the next person to
// read the YAML will wonder, and because RETIRED will never arrive on this shape.
//
// ── About scope ──────────────────────────────────────────────────────────────────────────
// Each role owns exactly one scope dimension and the server rejects the other one, in both
// directions, on create AND on update:
//
//   SUPER_ADMIN         both scope fields must be absent
//   PUBLISHER_ADMIN     scopePublisherId required, scopeInstitutionId must be absent
//   INSTITUTION_ADMIN   scopeInstitutionId required, scopePublisherId must be absent
//
// A scope field sent for the wrong role is a 400 VALIDATION_FAILED, not a field the server
// quietly ignores. So a form that changes the role has to clear the scope that no longer
// applies rather than leaving it in the body. Nothing here does that: this file sends what it
// is given, and the caller builds the body.
//
// No function here catches anything. Every failure arrives as the ApiError from errors.js,
// and the screen decides whether it is a field message, a table error or a toast.

/**
 * A page of operators, sorted by email ascending. That ordering is the server's and there is
 * no sort parameter to change it.
 *
 * `page` and `size` are the only things this endpoint accepts. There is deliberately no q,
 * status or role filter, so the arguments are destructured rather than spread: anything else
 * a caller passes is dropped here instead of becoming a query parameter the server ignores.
 * `size` is capped at 100, and a larger one is a 400 VALIDATION_FAILED.
 *
 * Any signed-in operator may call this, but a scoped one sees only the operators inside their
 * own scope. Only a SUPER_ADMIN sees everybody.
 */
export function listAdminUsers({ page, size } = {}) {
  return api.get(`/admin-users${pageQuery({ page, size })}`);
}

/**
 * Creates an operator from an AdminUserCreate, and answers the new AdminUser.
 *
 * `password` is required and must be at least 12 characters. It is hashed before storage and
 * never returned by any endpoint, so the created record comes back without it.
 *
 * Answers 409 CODE_TAKEN when the email is already in use, which is a message for the email
 * field rather than a page-level failure, and 403 FORBIDDEN_ROLE for anybody but a
 * SUPER_ADMIN.
 */
export function createAdminUser(adminUser) {
  return api.post('/admin-users', adminUser);
}

/**
 * Replaces an operator's editable fields with an AdminUserUpdate, and answers the updated
 * AdminUser.
 *
 * `email` is not part of the shape: it is the operator's identity, and changing it means
 * deactivating this one and creating another.
 *
 * **Leave `password` out of the body to keep the current one.** Sending it resets the
 * password, so an empty string is not the same as omitting the key and must not be sent.
 *
 * Answers 404 NOT_FOUND for an id that does not exist, and 403 FORBIDDEN_ROLE for anybody
 * but a SUPER_ADMIN.
 */
export function updateAdminUser(adminUserId, adminUser) {
  return api.put(`/admin-users/${adminUserId}`, adminUser);
}

/**
 * Deactivates an operator, setting their status to DISABLED.
 *
 * The record is kept rather than removed, so the audit trail can still name who did what.
 *
 * Answers 204 with no body, so this resolves to null: there is no updated AdminUser to read.
 * A list showing this operator therefore has to be reloaded, or have the one row patched to
 * DISABLED by hand.
 *
 * Nothing stops an operator deactivating their own account, so the caller is the one that
 * has to decide whether to offer that.
 *
 * Answers 404 NOT_FOUND for an id that does not exist, and 403 FORBIDDEN_ROLE for anybody
 * but a SUPER_ADMIN.
 */
export function deactivateAdminUser(adminUserId) {
  return api.del(`/admin-users/${adminUserId}`);
}
