import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import { listCollections } from '../api/collections.js';

// Not sortable: the contract's collections list takes no sort parameter.
const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'itemCount', label: 'Books' },
];

const EMPTY_PAGE = { items: [], page: 0, size: 0, total: 0 };

export default function PublisherCollections({ publisherId }) {
  const [pageResult, setPageResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listCollections(publisherId)
      .then((loaded) => {
        if (cancelled) return;
        setPageResult(loaded);
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

  function reload() {
    setReloadCount((count) => count + 1);
  }

  const result = pageResult ?? EMPTY_PAGE;
  const rows = result.items;

  return (
    <section className="card">
      <div className="row-buttons" style={{ justifyContent: 'space-between' }}>
        <h2>Collections</h2>
        <Link className="btn btn-primary" to={`/publishers/${publisherId}/collections/new`}>
          New collection
        </Link>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        error={error}
        emptyMessage="No collections yet."
        onRetry={reload}
      />
      {result.total > rows.length ? (
        <p className="muted small">
          Showing the first {rows.length} of {result.total}.
        </p>
      ) : null}
    </section>
  );
}
