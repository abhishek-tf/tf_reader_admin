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
 * any scope's entitlementStatus - an item's, or a collection's.
 */
export function canRequestScope(entitlementStatus) {
  return entitlementStatus === 'none' || entitlementStatus === 'revoked';
}
