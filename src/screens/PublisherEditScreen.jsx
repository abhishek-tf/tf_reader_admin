import { useNavigate, useParams } from 'react-router-dom';
import PublisherForm from './PublisherForm.jsx';
import { useRecord } from './useRecord.js';
import RecordLoadState from '../ui/RecordLoadState.jsx';
import { getPublisher } from '../api/publishers.js';

/**
 * Edit one publisher, at its own address, rendered as PublisherForm's own modal overlay
 * through PublishersScreen's `<Outlet/>` (see App.jsx's nested `/publishers` routes) — the
 * list stays mounted and blurred behind it.
 *
 * Both Cancel and a successful Save return to `/publishers` (the list), not to
 * `/publishers/:publisherId` (the detail page) — the same destination every other migrated
 * create/edit screen in this app returns to. Landing on the detail page instead would unmount
 * the list and its Outlet entirely, since the detail route sits outside it, which is exactly
 * the "closes the modal but changes what page I'm on" behaviour this once had.
 *
 * Creating is already a page of its own at /publishers/new, which renders PublisherForm
 * directly because there is nothing to load first. This is the other half.
 */
export default function PublisherEditScreen() {
  const { publisherId } = useParams();
  const navigate = useNavigate();
  const { record, loading, error, reload } = useRecord(getPublisher, publisherId);

  // Only while there's no record at all yet — once one has loaded, a stray re-fetch flipping
  // `loading` back to true must not blank out a form the operator is mid-edit on.
  // `RecordLoadState` renders bare (no modal chrome around it), so gating on `loading` alone
  // meant any re-render that revisited this branch made the whole panel appear to vanish.
  if (!record && (loading || error)) {
    return (
      <RecordLoadState
        loading={loading}
        error={error}
        onRetry={reload}
        backTo="/publishers"
        backLabel="Back to publishers"
      />
    );
  }

  return (
    <div className="stack">
      <PublisherForm
        publisher={record}
        onSaved={() => navigate('/publishers')}
        onCancel={() => navigate('/publishers')}
      />
    </div>
  );
}
