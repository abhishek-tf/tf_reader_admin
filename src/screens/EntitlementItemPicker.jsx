import { useEffect, useState } from 'react';
import FilterBar from '../ui/FilterBar.jsx';
import CoverThumb from '../ui/CoverThumb.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';

const PAGE_SIZE = 8;

/** The "Single Book" scope target: search the catalogue, click one row to select it — the
 * ITEM-scope equivalent of the Collection/Publisher dropdowns, since a catalogue is too large
 * for a plain `<select>`. */
export default function EntitlementItemPicker({ scopeId, onSelect, disabled }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState({ list: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResults((c) => ({ ...c, loading: true, error: null }));
    listCatalogueItems({ q, page: 0, size: PAGE_SIZE }, { signal: controller.signal })
      .then((data) => setResults({ list: data.items, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [q]);

  return (
    <div className="stack" style={{ gap: 'var(--space-2xs)' }}>
      <FilterBar
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Search title, author or ISBN..."
      />
      {results.loading ? (
        <p className="muted small">Loading...</p>
      ) : results.list.length === 0 ? (
        <p className="muted small">No books match this search.</p>
      ) : (
        <div className="shelf-panel-list" style={{ maxHeight: 220 }}>
          {results.list.map((row) => (
            <label key={row.id} className="shelf-available-row">
              <input
                type="radio"
                name="entitlement-item"
                checked={scopeId === row.id}
                disabled={disabled}
                onChange={() => onSelect(row.id, row.title)}
              />
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
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
