// Where a book's uploaded file has got to: NONE, QUEUED, PROCESSING, READY or FAILED.
//
// Separate from StatusBadge on purpose. That one shows a record's own status — ACTIVE,
// SUSPENDED, RETIRED — and a catalogue item already has two other enums beside this one
// (`status` is DRAFT/PUBLISHED/ARCHIVED, `accessTier` is the three tiers). Passing a
// contentState into a component whose prop is called `status`, on a row that has a real
// `status` field meaning something else, is the kind of thing nobody notices until it is
// wrong. Hence a second component with a prop called `state`, and the same `.badge`/`.badge-X`
// classes rather than a second badge scheme.
const LABEL = {
  NONE: 'None',
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
};

export default function IngestStateBadge({ state }) {
  // Anything we were not given — undefined before the first load, or a value added to the enum
  // after this shipped — reads as "None", which is the no-content state and so the honest
  // thing to show. `Object.hasOwn` rather than `LABEL[state] ?? …`, because an inherited key
  // such as 'constructor' would otherwise pass the check and render as a function.
  const known = Object.hasOwn(LABEL, state) ? state : 'NONE';
  // The label carries the meaning on its own, so the colour is decoration and nobody who
  // cannot tell the colours apart loses anything.
  return <span className={`badge badge-${known}`}>{LABEL[known]}</span>;
}
