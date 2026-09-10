import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublisherStatusActions from './PublisherStatusActions.jsx';
import PublisherCollections from './PublisherCollections.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { getPublisher } from '../api/publishers.js';

// Same rule as the publishers table's row avatar: up to three letters from the code, since a
// code is always present and short where a name is neither.
function initialsOf(code) {
  return (code ?? '').slice(0, 3).toUpperCase();
}

export default function PublisherDetailScreen() {
  const { publisherId } = useParams();

  const [publisher, setPublisher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  if (loading) {
    return <p className="muted">Loading the publisher...</p>;
  }

  if (error) {
    return (
      <Card>
        <h1>Cannot show this publisher</h1>
        <p className="muted">{error.friendly}</p>
        {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
        <div className="row-buttons">
          <Button onClick={() => setReloadCount((count) => count + 1)}>Try again</Button>
          <Link className="btn" to="/publishers">
            Back to publishers
          </Link>
        </div>
      </Card>
    );
  }

  if (!publisher) {
    return null;
  }

  return (
    <div className="stack">
      <Card>
        <div className="detail-hero-top">
          <Button as={Link} variant="ghost" size="sm" icon="arrow_back" to="/publishers">
            Back to publishers
          </Button>
        </div>
        <div className="detail-hero-main">
          <span className="table-entity-avatar detail-hero-avatar" aria-hidden="true">
            {initialsOf(publisher.code)}
          </span>
          <div className="detail-hero-body">
            <h1 className="detail-hero-title">{publisher.name}</h1>
            <div className="detail-hero-meta">
              <span className="code-chip">{publisher.code}</span>
              <StatusBadge status={publisher.status} />
            </div>
            {publisher.description ? (
              <p className="detail-hero-description">{publisher.description}</p>
            ) : null}
            {publisher.logoUrl ? (
              <p className="muted small">
                <a href={publisher.logoUrl} target="_blank" rel="noreferrer">
                  {publisher.logoUrl}
                </a>
              </p>
            ) : null}
          </div>
          <div className="detail-hero-actions">
            <Button as={Link} variant="primary" icon="edit" to={`/publishers/${publisher.id}/edit`}>
              Edit
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="detail-section-title">
          <h2>
            <Icon name="toggle_on" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Publisher status
          </h2>
        </div>
        <PublisherStatusActions publisher={publisher} onChanged={setPublisher} />
      </Card>

      <PublisherCollections publisherId={publisher.id} />
    </div>
  );
}
