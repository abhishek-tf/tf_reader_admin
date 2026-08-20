import { api, pageQuery } from './client.js';

// The five publisher endpoints from wokay-api.yaml. Paths are relative to /api/admin/v1,
// which client.js prepends, so nothing here repeats the prefix.
//
// Shapes, exactly as the contract defines them:
//
//   Publisher       { id, code, name, status, description?, logoUrl?, itemCount?,
//                     collectionCount?, createdAt? }
//   PublisherWrite  { code, name, description?, logoUrl? }        code and name required
//   PublisherPage   { items: Publisher[], page, size, total }     page is ZERO based
//   StatusChange    { status, reason? }                           reason is max 500 chars
//
// `status` is a RecordStatus: ACTIVE, SUSPENDED or RETIRED. Send the enum value, never a label.
//
// ── About the publisher code ─────────────────────────────────────────────────────────────
// The team has settled this: publisher codes are UPPERCASE, matching the seeded data
// (RTLG, CRCP). Note that PublisherWrite in wokay-api.yaml still documents
// `pattern: '^[a-z0-9-]{2,40}$'`, so the YAML and the seed data disagree and the team has
// chosen the seed. Nothing in this file lowercases, uppercases or validates a code: the
// create form normalises what the operator types, and the server has the final say. Recorded
// here because the next person to read the YAML will wonder.
//
// No function here catches anything. Every failure arrives as the ApiError from errors.js,
// and the screen decides whether it is a field message, a table error or a toast.

/**
 * A page of publishers, newest filters first.
 *
 * `q` searches, `status` narrows to one RecordStatus. Both are optional, and pageQuery drops
 * an empty one, so a screen can pass its filter state straight through without checking it.
 *
 * There is deliberately no sort argument: the contract's list endpoint accepts only q, status,
 * page and size.
 */
export function listPublishers({ q, status, page, size } = {}) {
  return api.get(`/publishers${pageQuery({ page, size, q, status })}`);
}

/** One publisher. Answers 404 NOT_FOUND for an id that does not exist. */
export function getPublisher(publisherId) {
  return api.get(`/publishers/${publisherId}`);
}

/**
 * Creates a publisher from a PublisherWrite.
 *
 * Answers 409 CODE_TAKEN when the code is already in use, which is a message for the code
 * field rather than a page-level failure.
 */
export function createPublisher(publisher) {
  return api.post('/publishers', publisher);
}

/**
 * Replaces a publisher with a PublisherWrite.
 *
 * `code` is required by the contract even though the console does not offer renaming, so send
 * back the code that was loaded.
 */
export function updatePublisher(publisherId, publisher) {
  return api.put(`/publishers/${publisherId}`, publisher);
}

/**
 * Activates or suspends a publisher, and answers the updated Publisher.
 *
 * Suspending removes that publisher's content from every institution's feed on the next
 * request, which is why the contract offers a reason worth recording. It is optional, so a
 * blank one is left out of the body rather than sent as an empty string.
 */
export function setPublisherStatus(publisherId, status, reason = null) {
  const body = reason ? { status, reason } : { status };
  return api.patch(`/publishers/${publisherId}/status`, body);
}
