import { useEffect, useState } from 'react';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import Icon from './Icon.jsx';
import CoverThumb from './CoverThumb.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';

const PAGE_SIZE = 10;
const FORMAT_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PDF', label: 'PDF' },
  { value: 'EPUB', label: 'EPUB' },
  { value: 'AUDIO', label: 'Audio' },
];

/**
 * Mirrors EntitlementQueryImpl.check(), the real gate the save endpoint enforces: an active
 * entitlement is necessary but not sufficient. A book stuck in DRAFT or whose content failed
 * to process can never go on a shelf either, regardless of what the institution has bought -
 * entitlementStatus alone does not say that. Returns why a book cannot be added, or null when
 * it can - the one place that rule is written, so the checkbox and its disabled reason can
 * never disagree.
 */
function ineligibleReason(row) {
  if (row.entitlementStatus !== 'ACTIVE') return 'Not entitled';
  if (row.status !== 'PUBLISHED' || row.contentState !== 'READY') return 'Not ready';
  return null;
}

function AvailableRow({ row, picked, checked, onToggle }) {
  const reason = picked ? null : ineligibleReason(row);
  const disabled = picked || reason !== null;

  return (
    <label className="shelf-available-row">
      {picked ? (
        <Icon name="check" style={{ color: 'var(--mint-dark)', width: 16, flexShrink: 0 }} />
      ) : (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle(row.id)}
        />
      )}
      <CoverThumb
        id={row.id}
        coverUrl={row.coverUrl}
        contentType={row.contentType}
        updatedAt={row.updatedAt}
      />
      <div className="table-entity-text" style={{ flex: 1, minWidth: 0 }}>
        <span className="row-link-emphasis">{row.title}</span>
        <span className="table-entity-sub">
          {[row.authors?.join(', '), row.isbn].filter(Boolean).join(' • ')}
        </span>
        {picked ? (
          <span className="shelf-book-meta">Already on this shelf</span>
        ) : reason ? (
          <span className="shelf-book-meta">{reason}</span>
        ) : null}
      </div>
      {row.contentType ? <span className="format-chip">{row.contentType}</span> : null}
    </label>
  );
}

/**
 * The "Available entitled titles" left panel of the shelf book picker: search, a format
 * filter, and a checkbox per eligible row for the one real bulk action above it — "Add
 * selected to shelf". Split out of ShelfBookPicker, which was over the line budget once this
 * and the picked-list half were both in one file.
 */
export default function ShelfBookSearch({
  institutionId,
  itemIds,
  selectedIds,
  onToggleSelect,
  onSelectVisible,
}) {
  const [q, setQ] = useState('');
  const [contentType, setContentType] = useState('');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState({ list: [], total: 0, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResults((c) => ({ ...c, loading: true, error: null }));
    listCatalogueItems(
      { q, contentType, institutionId, page, size: PAGE_SIZE },
      { signal: controller.signal }
    )
      .then((data) =>
        setResults({ list: data.items, total: data.total, loading: false, error: null })
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [q, contentType, page, institutionId]);

  const selectableIds = results.list
    .filter((row) => !itemIds.includes(row.id) && ineligibleReason(row) === null)
    .map((row) => row.id);

  return (
    <div className="shelf-panel">
      <div className="shelf-panel-header">
        <span className="shelf-panel-title">
          Available entitled titles <span className="shelf-panel-count">({results.total})</span>
        </span>
        {selectableIds.length > 0 ? (
          <button
            type="button"
            className="btn-reset-link"
            onClick={() => onSelectVisible(selectableIds)}
          >
            Select all on page
          </button>
        ) : null}
      </div>

      <FilterBar
        searchValue={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(0);
        }}
        searchPlaceholder="Filter by ISBN, title, or author..."
        trailing={
          <div className="format-filter-chips">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`format-filter-chip${contentType === option.value ? ' format-filter-chip-active' : ''}`}
                onClick={() => {
                  setContentType(option.value);
                  setPage(0);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {results.loading ? (
        <p className="muted small">Loading...</p>
      ) : results.error ? (
        <p className="field-error">{results.error.friendly ?? 'Could not load the catalogue.'}</p>
      ) : results.list.length === 0 ? (
        <p className="muted small">No books match this search.</p>
      ) : (
        <div className="shelf-panel-list">
          {results.list.map((row) => (
            <AvailableRow
              key={row.id}
              row={row}
              picked={itemIds.includes(row.id)}
              checked={selectedIds.has(row.id)}
              onToggle={onToggleSelect}
            />
          ))}
        </div>
      )}
      <Pagination page={page} size={PAGE_SIZE} total={results.total} onPageChange={setPage} />
    </div>
  );
}
