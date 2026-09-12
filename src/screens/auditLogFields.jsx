import KeyValueList from '../ui/KeyValueList.jsx';
import { ACTION_OPTIONS } from '../api/auditLogs.js';

export const ACTION_LABEL = Object.fromEntries(ACTION_OPTIONS.map((o) => [o.value, o.label]));

/**
 * One of before, after or meta, as a list of key and value rather than one JSON blob.
 *
 * `before` and `after` carry only the fields that CHANGED, not the whole document either
 * side, so these lists are short and reading them field by field is what an operator wants.
 *
 * A leaf that is itself an object or an array is still stringified: there is no fixed shape
 * to lay out, and flattening a nested object into more rows would invent a key like
 * `branding.logoUrl` that appears nowhere in the record. Null is not an error, and neither is
 * an object with no keys — the backend writes one when an action changed nothing.
 */
export function renderKeyValues(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value !== 'object' || Array.isArray(value)) {
    return <span className="trace">{JSON.stringify(value)}</span>;
  }

  const pairs = Object.entries(value).map(([key, entry]) => [
    key,
    typeof entry === 'string' ? entry : JSON.stringify(entry),
  ]);
  if (pairs.length === 0) return '—';

  return <KeyValueList pairs={pairs} />;
}

/** Whether a row has anything worth opening a diff for — an empty before/after/meta still
 * renders "—" rather than hiding the button, so the button's own label can tell the two apart. */
export function hasDiff(row) {
  return Boolean(row.before) || Boolean(row.after);
}

function relativeTime(at) {
  const seconds = Math.round((Date.now() - new Date(at).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatAuditTimestamp(at) {
  return { relative: relativeTime(at), absolute: new Date(at).toLocaleString() };
}
