import { api, pageQuery } from './client.js';

// The one audit trail endpoint from wokay-api.yaml. The path is relative to /api/admin/v1,
// which client.js prepends, so nothing here repeats the prefix.
//
// Shapes, as the backend actually answers them:
//
//   AuditLog      { id, actorId, actorEmail, action, entityType, entityId,
//                   before, after, meta, at }
//   AuditLogPage  { items: AuditLog[], page, size, total }      page is ZERO based
//
// `before`, `after` and `meta` are free-form objects and any of them can be null. The first
// two carry only the fields that CHANGED, not the whole document either side, and `meta` is
// where a content access records its device key fingerprint, intent and format.
//
// Two things that are unlike the rest of the console:
//
//   1. SUPER_ADMIN only. Every other admin list narrows itself to the caller's scope; this one
//      refuses outright with a 403 FORBIDDEN_ROLE, because an audit row names other operators.
//   2. Always newest first, and there is no sort parameter to change that.
//
// Records are removed automatically after 90 days, so an empty answer for an old range is the
// trail working as designed rather than a failure worth reporting.
//
// No function here catches anything. Every failure arrives as the ApiError from errors.js.

/**
 * The AuditLog.Action values, for a dropdown.
 *
 * `action` is a real enum server side even though the contract documents it as a plain string,
 * so a value outside this list is a 400 rather than an empty result. **It has to be a
 * dropdown, never a free text box.**
 *
 * LOGIN, INGEST and CONTENT_ACCESS are part of the enum but nothing writes them yet, so
 * filtering on one of those three legitimately finds nothing.
 */
export const ACTION_OPTIONS = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'STATUS', label: 'Status change' },
  { value: 'LOGIN', label: 'Sign in' },
  { value: 'INGEST', label: 'Ingest' },
  { value: 'CONTENT_ACCESS', label: 'Content access' },
];

/**
 * Every entityType the backend writes today.
 *
 * Unlike `action` this really is a free string server side, so an unrecognised value is an
 * empty result rather than an error. The list is here to save an operator typing one exactly.
 *
 * The label is deliberately the value. The contract defines no display name for an entityType,
 * so inventing one would put a word on screen that appears nowhere in the API, and an operator
 * reading the trail has to be able to match what they see against what they filter on.
 */
const ENTITY_TYPES = [
  'ADMIN_USER',
  'PUBLISHER',
  'COLLECTION',
  'CATALOGUE_ITEM',
  'INSTITUTION',
  'ENTITLEMENT',
  'FEED_SETTINGS',
];

export const ENTITY_TYPE_OPTIONS = ENTITY_TYPES.map((value) => ({ value, label: value }));

/**
 * Widens a bare date into the instant the server can actually parse.
 *
 * `from` and `to` bind to an Instant, so `2026-08-15` is a 400 and `2026-08-15T00:00:00Z` is
 * fine. A date input answers with the bare form, so this fills in the rest of it: the start of
 * the day for the lower bound and the end of it for the upper, which is what an operator means
 * by "the 15th to the 20th". Both bounds are inclusive server side.
 *
 * Anything already carrying a time is passed through untouched.
 */
function toInstant(value, endOfDay) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}Z`;
}

/**
 * A page of audit records, newest first.
 *
 * Every filter is optional and they combine. pageQuery drops the empty ones, so a screen can
 * pass its whole filter state straight through without checking each field.
 *
 * `size` is capped at 100, and a larger one is a 400 VALIDATION_FAILED.
 */
export function listAuditLogs(
  { entityType, entityId, actorId, action, from, to, page, size } = {},
  opts
) {
  const query = pageQuery({
    page,
    size,
    entityType,
    entityId,
    actorId,
    action,
    from: toInstant(from, false),
    to: toInstant(to, true),
  });
  return api.get(`/audit-logs${query}`, opts);
}
