import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import { listPublishers } from '../api/publishers.js';
import { useAuth } from '../auth/AuthContext.jsx';

const STATUS_LABEL = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  RETIRED: 'Retired',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }));

// Not sortable: the contract's list endpoint takes no sort parameter.
const COLUMNS = [
  {
    key: 'name',
    label: 'Name',
    render: (row) => <Link to={`/publishers/${row.id}`}>{row.name}</Link>,
  },
  { key: 'code', label: 'Code' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'collectionCount', label: 'Collections' },
  { key: 'itemCount', label: 'Books' },
];

const EMPTY_PAGE = { items: [], page: 0, size: 0, total: 0 };

export default function PublishersScreen() {
  const { user } = useAuth();
  // Only a super admin creates publishers. Hiding the button is not the check: the server
  // refuses the POST either way. It just stops the console offering what would be refused.
  const canCreate = user.role === 'SUPER_ADMIN';

  // `filters` is what is typed. `query` is what was submitted and is on screen.
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [query, setQuery] = useState({ q: '', status: '', page: 0 });
  const [pageResult, setPageResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listPublishers(query)
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
  }, [query]);

  function change(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setQuery({ q: filters.q.trim(), status: filters.status, page: 0 });
  }

  function handleClear() {
    setFilters({ q: '', status: '' });
    setQuery({ q: '', status: '', page: 0 });
  }

  // A fresh object re-runs the load effect without changing the query.
  function handleRetry() {
    setQuery((current) => ({ ...current }));
  }

  function goToPage(page) {
    setQuery((current) => ({ ...current, page }));
  }

  const result = pageResult ?? EMPTY_PAGE;
  const rows = result.items;
  const total = result.total;
  const size = result.size;
  const currentPage = pageResult ? result.page : query.page;
  const lastPage = size > 0 ? Math.ceil(total / size) - 1 : 0;
  const searching = query.q !== '' || query.status !== '';

  return (
    <div className="stack">
      <section className="card">
        <h1>Publishers</h1>
        <p className="muted">Every publisher in the catalogue, and the collections they sell.</p>
        {canCreate ? (
          <Link className="btn btn-primary" to="/publishers/new">
            New publisher
          </Link>
        ) : null}
      </section>

      <section className="card">
        <h2>All publishers</h2>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="Search"
            name="q"
            value={filters.q}
            onChange={change}
            placeholder="Name"
            disabled={loading}
          />
          <SelectField
            label="Status"
            name="status"
            value={filters.status}
            onChange={change}
            options={STATUS_OPTIONS}
            placeholder="Any status"
            disabled={loading}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button type="button" className="btn" onClick={handleClear} disabled={loading}>
              Clear
            </button>
          </div>
        </form>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={loading}
          error={error}
          emptyMessage={
            searching
              ? 'No publishers match that search.'
              : 'No publishers yet. Create one to see it here.'
          }
          onRetry={handleRetry}
        />

        {!error && total > 0 ? (
          <div className="row-buttons">
            <button
              type="button"
              className="btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={loading || currentPage === 0}
            >
              Previous
            </button>
            <span className="small">
              Page {currentPage + 1} of {lastPage + 1}
            </span>
            <button
              type="button"
              className="btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={loading || currentPage >= lastPage}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
