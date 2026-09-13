import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { listCollections } from '../api/collections.js';

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

  // Not sortable: the contract's collections list takes no sort parameter. A function of
  // publisherId rather than a module-level constant, since the actions column's link needs it.
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code', render: (row) => <span className="code-chip">{row.code}</span> },
    {
      key: 'itemCount',
      label: 'Books',
      render: (row) => (row.itemCount == null ? '—' : `${row.itemCount} item${row.itemCount === 1 ? '' : 's'}`),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link
          className="btn btn-ghost btn-sm"
          to={`/publishers/${publisherId}/collections/${row.id}/items`}
        >
          Manage books
        </Link>
      ),
    },
  ];

  return (
    <Card>
      <div className="detail-section-title">
        <h2>Collections</h2>
        <Button as={Link} variant="primary" size="sm" icon="add" to={`/publishers/${publisherId}/collections/new`}>
          New collection
        </Button>
      </div>
      <DataTable
        columns={columns}
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
    </Card>
  );
}
