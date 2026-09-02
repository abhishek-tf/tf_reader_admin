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
 * any scope's entitlementStatus - an item's, or a collection's. A missing status (null for a
 * caller the backend doesn't scope to an institution) is treated the same as 'none', since
 * there is nothing on record to block a fresh request.
 */
export function canRequestScope(entitlementStatus) {
  return !entitlementStatus || entitlementStatus === 'none' || entitlementStatus === 'revoked';
}

/**
 * The "Your status" column both the books table and the collections table render: a plain
 * label when nothing has been requested, a badge otherwise. One place for this so a future
 * fix to the null/'none' case cannot be applied to one table and not the other.
 */
export function renderEntitlementStatus(entitlementStatus) {
  if (!entitlementStatus || entitlementStatus === 'none') {
    return <span className="muted">Not requested</span>;
  }
  return <StatusBadge status={entitlementStatus.toUpperCase()} />;
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
