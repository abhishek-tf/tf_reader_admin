import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CollectionBookPicker from '../ui/CollectionBookPicker.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { listCollections } from '../api/collections.js';

/**
 * Manage one collection's book membership. There is no GET for a single collection, so its
 * name is resolved the same way ShelfPickedBooks resolves a book's title - list the publisher's
 * collections and match the id, rather than inventing a new backend call for one field.
 */
export default function CollectionItemsScreen() {
  const { publisherId, collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listCollections(publisherId, { size: 100 })
      .then((data) => {
        if (cancelled) return;
        setCollection(data.items.find((item) => item.id === collectionId) ?? null);
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
  }, [publisherId, collectionId]);

  const backToPublisher = `/publishers/${publisherId}`;

  if (loading) {
    return <p className="muted">Loading the collection...</p>;
  }

  if (error) {
    return (
      <Card>
        <h1>Cannot show this collection</h1>
        <p className="muted">{error.friendly}</p>
        {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
        <Link className="btn" to={backToPublisher}>
          Back to the publisher
        </Link>
      </Card>
    );
  }

  if (!collection) {
    return (
      <Card>
        <h1>No such collection</h1>
        <Link className="btn" to={backToPublisher}>
          Back to the publisher
        </Link>
      </Card>
    );
  }

  return (
    <div className="stack">
      <Card>
        <div className="detail-hero-top">
          <Button as={Link} variant="ghost" size="sm" icon="arrow_back" to={backToPublisher}>
            Back to the publisher
          </Button>
        </div>
        <div className="detail-hero-main">
          <span className="table-entity-avatar detail-hero-avatar" aria-hidden="true">
            <Icon name="collections_bookmark" />
          </span>
          <div className="detail-hero-body">
            <h1 className="detail-hero-title">{collection.name}</h1>
            <div className="detail-hero-meta">
              <span className="code-chip">{collection.code}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="detail-section-title">
          <h2>Books in this collection</h2>
        </div>
        <CollectionBookPicker collectionId={collectionId} publisherId={publisherId} />
      </Card>
    </div>
  );
}
