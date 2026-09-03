import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CollectionBookPicker from '../ui/CollectionBookPicker.jsx';
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
      <div className="card">
        <h1>Cannot show this collection</h1>
        <p className="muted">{error.friendly}</p>
        {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
        <Link className="btn" to={backToPublisher}>
          Back to the publisher
        </Link>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="card">
        <h1>No such collection</h1>
        <Link className="btn" to={backToPublisher}>
          Back to the publisher
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="row-buttons">
          <Link className="btn" to={backToPublisher}>
            Back to the publisher
          </Link>
        </div>
        <h1>{collection.name}</h1>
        <p className="muted">{collection.code}</p>
      </section>

      <section className="card">
        <CollectionBookPicker collectionId={collectionId} />
      </section>
    </div>
  );
}
