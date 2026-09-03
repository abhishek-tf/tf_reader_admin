import { api, pageQuery } from './client.js';

// The two collection endpoints Task 9 needs, from wokay-api.yaml. Both hang off a publisher,
// because a collection only exists within one. Paths are relative to /api/admin/v1, which
// client.js prepends.
//
// Shapes, exactly as the contract defines them:
//
//   Collection       { id, publisherId, code, name, description?, itemCount? }
//   CollectionWrite  { code, name, description? }        code and name required
//   CollectionPage   { items: Collection[], page, size, total }   page is ZERO based
//
// `publisherId` is NOT part of CollectionWrite. It comes from the path, so a create sends only
// the collection's own fields.
//
// Two things the contract is explicit about, and both make a field read-only in a form:
//
//   `itemCount` is derived, not stored. It is counted from catalogueItems.collectionIds on
//   read, so there is nothing to send back.
//
//   A collection carries no membership array at all. Which books belong to it lives on the
//   books. Membership is written through PUT /collections/{collectionId}/items, below - a full
//   replace of the set, not an add/remove delta, so the caller always sends the whole list.
//
// Collection codes are UPPERCASE, matching the seeded data (LAW2024, ENV2024), per the same
// team decision that settled publisher codes. CollectionWrite in the YAML still documents
// `pattern: '^[a-z0-9-]{2,40}$'`; the team chose the seed. Nothing here validates or changes a
// code. See the same note in publishers.js.
//
// Unlike a publisher code, a collection code is unique WITHIN ITS PUBLISHER rather than
// globally, so the same code may exist under two publishers without a clash.
//
// No function here catches anything. Failures arrive as the ApiError from errors.js and the
// screen decides what to do with them.

/**
 * A page of one publisher's collections.
 *
 * The contract offers only page and size here: there is no search and no status filter on
 * this list, because a collection has neither.
 *
 * Answers 404 NOT_FOUND for a publisher that does not exist, so a missing publisher and an
 * empty collection list are two different outcomes and read differently on screen.
 */
export function listCollections(publisherId, { page, size } = {}) {
  return api.get(`/publishers/${publisherId}/collections${pageQuery({ page, size })}`);
}

/**
 * Creates a collection under a publisher, from a CollectionWrite.
 *
 * Answers 409 CODE_TAKEN when that code is already used by this publisher, which belongs on
 * the code field rather than in a page-level message.
 */
export function createCollection(publisherId, collection) {
  return api.post(`/publishers/${publisherId}/collections`, collection);
}

/**
 * Every collection across every publisher, from GET /api/admin/v1/collections — not the
 * publisher-nested endpoint above. For an institution admin (or a super admin who passes
 * institutionId), each collection carries entitlementStatus, resolved from that institution's
 * COLLECTION- and PUBLISHER-scoped entitlements only. Null for any other caller, not "none".
 */
export function listAllCollections(params, opts) {
  return api.get(`/collections${pageQuery(params)}`, opts);
}

/**
 * Sets a collection's membership to exactly this list of catalogue item ids. Not validated
 * against the collection's own publisher - CollectionAdminService.setItems only checks that
 * every id is a real catalogue item, nothing about which publisher it belongs to.
 */
export function setCollectionItems(collectionId, itemIds) {
  return api.put(`/collections/${collectionId}/items`, { itemIds });
}
