import { canRequestScope, requestLabel } from './entitlementFields.jsx';

/**
 * The Request/Request again action every request-browser table renders in its actions column -
 * identical across items, collections and publishers except which handler fires. Three copies
 * of this exact JSX is what STYLE.md calls a pattern rather than a coincidence.
 */
export default function RequestButton({ row, requestingIds, onRequest }) {
  if (!canRequestScope(row.entitlementStatus)) return null;
  return (
    <button
      type="button"
      className="btn"
      disabled={requestingIds.has(row.id)}
      onClick={() => onRequest(row)}
    >
      {requestLabel(row.entitlementStatus)}
    </button>
  );
}
