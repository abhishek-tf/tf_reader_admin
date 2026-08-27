// A small coloured label for a record's or entitlement's status (ACTIVE/SUSPENDED/RETIRED/
// PENDING/REVOKED), so they are easy to tell apart at a glance in any table. Uses the same
// `.badge`/`.badge-X` classes the console already uses for the catalogue item tier badge,
// rather than inventing a second badge scheme. Expects the uppercase enum value.
// DISABLED is an admin user's inactive state, where every other record says RETIRED.
const LABEL = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  RETIRED: 'Retired',
  PENDING: 'Pending',
  REVOKED: 'Revoked',
  DISABLED: 'Disabled',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABEL[status] ?? status}</span>;
}
