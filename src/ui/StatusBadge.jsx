// A small coloured label for a record's status, so ACTIVE/SUSPENDED/RETIRED are easy to tell apart
// at a glance in any table. Uses the same `.badge`/`.badge-X` classes the console already uses for
// the catalogue item tier badge, rather than inventing a second badge scheme.
const LABEL = { ACTIVE: 'Active', SUSPENDED: 'Suspended', RETIRED: 'Retired' };

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABEL[status] ?? status}</span>;
}
