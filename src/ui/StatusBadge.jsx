// A small coloured label for a record's status (ACTIVE/SUSPENDED/RETIRED/PENDING/REVOKED, or
// a catalogue item's own DRAFT/PUBLISHED/ARCHIVED), so they are easy to tell apart at a glance
// in any table. Uses the same `.badge`/`.badge-X` classes the console already uses for the
// tier badge, rather than inventing a second badge scheme. Expects the uppercase enum value.
// DISABLED is an admin user's inactive state, where every other record says RETIRED.
const LABEL = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  RETIRED: 'Retired',
  PENDING: 'Pending',
  REVOKED: 'Revoked',
  DISABLED: 'Disabled',
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  // Not contract enums — a shelf has no `status` field. Derived from the one fact the
  // contract itself calls out (Shelf: "An empty itemIds hides the shelf"), for the Shelves page.
  VISIBLE: 'Visible',
  HIDDEN: 'Hidden',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABEL[status] ?? status}</span>;
}
