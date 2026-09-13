import { useEffect, useState } from 'react';
import FilterBar from '../ui/FilterBar.jsx';
import CoverThumb from '../ui/CoverThumb.jsx';
import RowTreeToggle from '../ui/RowTreeToggle.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';
import { buildCatalogueTree, flattenVisible } from './bookTree.js';

// Same walk size useBooks.js/ShelfBookSearch.jsx use: this walks every matching page once per
// search change rather than one small page at a time, so a Journal and its Volumes/Issues/
// Articles are never split apart before the tree is built.
const WALK_PAGE_SIZE = 100;

/** The "Single Book" scope target: search the catalogue, click one row to select it — the
 * ITEM-scope equivalent of the Collection/Publisher dropdowns, since a catalogue is too large
 * for a plain `<select>`.
 *
 * Catalogue items are a flat collection (Journal/Volume/Issue/Article/Book all in one), so
 * results are grouped into a Journal -> Volume -> Issue -> Article tree the same way the Books
 * page does (bookTree.js) rather than shown as unrelated flat rows. Only a leaf (BOOK/ARTICLE)
 * can be an ITEM-scope target - a container has no content of its own to grant - so a
 * container row gets an expand toggle instead of a radio button. */
export default function EntitlementItemPicker({ scopeId, onSelect, disabled }) {
  const [q, setQ] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [results, setResults] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResults((c) => ({ ...c, loading: true, error: null }));
    fetchAllPages((page) =>
      listCatalogueItems({ q, page, size: WALK_PAGE_SIZE }, { signal: controller.signal })
    )
      .then((items) => setResults({ items, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [q]);

  function toggleExpand(id) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const rows = flattenVisible(buildCatalogueTree(results.items), expandedIds);

  return (
    <div className="stack" style={{ gap: 'var(--space-2xs)' }}>
      <FilterBar
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Search title, author or ISBN..."
      />
      {results.loading ? (
        <p className="muted small">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="muted small">No books match this search.</p>
      ) : (
        <div className="shelf-panel-list" style={{ maxHeight: 220 }}>
          {rows.map((row) => (
            <label
              key={row.id}
              className="shelf-available-row"
              style={{ paddingLeft: row.depth ? row.depth * 20 : 0 }}
            >
              <RowTreeToggle row={row} onToggleExpand={toggleExpand} />
              {row.hasChildren ? (
                <span className="row-tree-spacer" aria-hidden="true" style={{ width: 16 }} />
              ) : (
                <input
                  type="radio"
                  name="entitlement-item"
                  checked={scopeId === row.id}
                  disabled={disabled}
                  onChange={() => onSelect(row.id, row.title)}
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
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
