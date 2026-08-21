import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublisherForm from './PublisherForm.jsx';
import PublisherStatusActions from './PublisherStatusActions.jsx';
import PublisherCollections from './PublisherCollections.jsx';
import { getPublisher } from '../api/publishers.js';

const STATUS_LABEL = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  RETIRED: 'Retired',
};

export default function PublisherDetailScreen() {
  const { publisherId } = useParams();

  const [publisher, setPublisher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPublisher(publisherId)
      .then((loaded) => {
        if (cancelled) return;
        setPublisher(loaded);
        setLoading(false);
      })
      .catch((failure) => {
        if (cancelled) return;
        setError(failure);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publisherId, reloadCount]);

  function handleSaved(updated) {
    setPublisher(updated);
    setEditing(false);
  }

  if (loading) {
    return <p className="muted">Loading the publisher...</p>;
  }

  if (error) {
    return (
      <div className="card">
        <h1>Cannot show this publisher</h1>
        <p className="muted">{error.friendly}</p>
        {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
        <div className="row-buttons">
          <button
            type="button"
            className="btn"
            onClick={() => setReloadCount((count) => count + 1)}
          >
            Try again
          </button>
          <Link className="btn" to="/publishers">
            Back to publishers
          </Link>
        </div>
      </div>
    );
  }

  if (!publisher) {
    return null;
  }

  return (
    <div className="stack">
      {editing ? (
        <PublisherForm
          publisher={publisher}
          onSaved={handleSaved}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <section className="card">
          <Link className="muted small" to="/publishers">
            Back to publishers
          </Link>
          <h1>{publisher.name}</h1>
          <p className="muted">
            {publisher.code} · {STATUS_LABEL[publisher.status] ?? publisher.status}
          </p>
          {publisher.description ? <p>{publisher.description}</p> : null}
          {publisher.logoUrl ? (
            <p className="muted small">
              <a href={publisher.logoUrl} target="_blank" rel="noreferrer">
                {publisher.logoUrl}
              </a>
            </p>
          ) : null}
          <div className="row-buttons">
            <button type="button" className="btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          </div>
          <PublisherStatusActions publisher={publisher} onChanged={setPublisher} />
        </section>
      )}

      <PublisherCollections publisherId={publisher.id} />
    </div>
  );
}
