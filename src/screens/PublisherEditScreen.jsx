import { useNavigate, useParams } from 'react-router-dom';
import PublisherForm from './PublisherForm.jsx';
import { useRecord } from './useRecord.js';
import RecordLoadState from '../ui/RecordLoadState.jsx';
import { getPublisher } from '../api/publishers.js';

/**
 * Edit one publisher, at its own address.
 *
 * Creating is already a page of its own at /publishers/new, which renders PublisherForm
 * directly because there is nothing to load first. This is the other half.
 */
export default function PublisherEditScreen() {
  const { publisherId } = useParams();
  const navigate = useNavigate();
  const { record, loading, error, reload } = useRecord(getPublisher, publisherId);

  const backToPublisher = `/publishers/${publisherId}`;

  if (loading || error) {
    return (
      <RecordLoadState
        loading={loading}
        error={error}
        onRetry={reload}
        backTo={backToPublisher}
        backLabel="Back to the publisher"
      />
    );
  }

  return (
    <div className="stack">
      <PublisherForm
        publisher={record}
        backTo={backToPublisher}
        backLabel="Back to the publisher"
        onSaved={() => navigate(backToPublisher)}
        onCancel={() => navigate(backToPublisher)}
      />
    </div>
  );
}
