import { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

// Shared labels for the entitlement flow screens.

export const CONTENT_TYPE_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EPUB', label: 'EPUB' },
  { value: 'AUDIO', label: 'Audio' },
];

export const TIER_OPTIONS = [
  { value: 'OPEN_ACCESS', label: 'Open access' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'ELITE', label: 'Elite' },
];

export const TIER_LABEL = {
  OPEN_ACCESS: 'Open access',
  SUBSCRIPTION: 'Subscription',
  ELITE: 'Elite',
};

/**
 * A request can be made again once it isn't already live or waiting on a decision. Works for
 * any scope's entitlementStatus - an item's, a collection's, or a publisher's. A missing status
 * (null for a caller the backend doesn't scope to an institution) is treated the same as
 * 'NONE', since there is nothing on record to block a fresh request. Uppercase, matching the
 * EntitlementStatus enum it mirrors - the backend stopped lowercasing this in Workstream 1.
 */
export function canRequestScope(entitlementStatus) {
  return !entitlementStatus || entitlementStatus === 'NONE' || entitlementStatus === 'REVOKED';
}

/**
 * "Request again" specifically for a REVOKED scope, so asking after a rejection reads
 * differently from a first-ever request - same button, same createEntitlement call,
 * canRequestScope already allows both. Workstream 1's re-request fix is what makes this
 * button actually succeed for a REVOKED row instead of 409ing.
 */
export function requestLabel(entitlementStatus) {
  return entitlementStatus === 'REVOKED' ? 'Request again' : 'Request';
}

/**
 * The "Your status" column the books, collections and publishers tables all render: a plain
 * label when nothing has been requested, a badge otherwise. One place for this so a future
 * fix to the null/'NONE' case cannot be applied to one table and not the others.
 */
export function renderEntitlementStatus(entitlementStatus) {
  if (!entitlementStatus || entitlementStatus === 'NONE') {
    return <span className="muted">Not requested</span>;
  }
  return <StatusBadge status={entitlementStatus} />;
}

/**
 * Tracks which row ids currently have a request in flight, so a button can disable itself the
 * instant it's clicked rather than allowing a second click to fire a second network call. Three
 * screens needed this exact Set-add/Set-delete pattern, which is STYLE.md's own threshold for
 * when a custom hook stops being premature.
 */
export function useInFlightIds() {
  const [ids, setIds] = useState(() => new Set());

  function start(id) {
    setIds((prev) => new Set(prev).add(id));
  }

  function finish(id) {
    setIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return { has: (id) => ids.has(id), start, finish };
}
