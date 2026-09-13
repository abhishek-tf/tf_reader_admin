import { useEffect, useState } from 'react';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import Icon from './Icon.jsx';
import CoverThumb from './CoverThumb.jsx';
import RowTreeToggle from './RowTreeToggle.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';
import { buildCatalogueTree, flattenVisible } from '../screens/bookTree.js';

const PAGE_SIZE = 10;
// Server-side page size for the walk below - deliberately larger than PAGE_SIZE, matching
// useBooks.js's own WALK_PAGE_SIZE: this walks the whole matching set once per filter change,
// not one small page at a time, so a Journal and its Volumes/Issues/Articles are never split
// across pages of the walk.
const WALK_PAGE_SIZE = 100;
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
 *
 * A container (JOURNAL/VOLUME/ISSUE) has no content of its own - contentState is always NONE
 * - so this already returns 'Not ready' for one without any extra case: a container can be
 * expanded to reach its articles, but never added to a shelf itself.
 */
function ineligibleReason(row) {
  if (row.entitlementStatus !== 'ACTIVE') return 'Not entitled';
  if (row.status !== 'PUBLISHED' || row.contentState !== 'READY') return 'Not ready';
  return null;
}

function AvailableRow({ row, picked, checked, onToggle, onToggleExpand }) {
  const reason = picked ? null : ineligibleReason(row);
  const disabled = picked || reason !== null;

  return (
    <label className="shelf-available-row" style={{ paddingLeft: row.depth ? row.depth * 20 : 0 }}>
      <RowTreeToggle row={row} onToggleExpand={onToggleExpand} />
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
 *
 * Catalogue items are a flat collection (Journal/Volume/Issue/Article/Book all in one), so the
 * whole matching set is walked and grouped into a tree the same way the Books page does
 * (bookTree.js), then paginated over root nodes rather than raw items - a Journal and its
 * subtree never split across a page boundary this way, and it shows as one collapsed row
 * instead of a Journal, its Volumes, its Issues, and its Articles all as flat siblings.
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
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((c) => ({ ...c, loading: true, error: null }));
    fetchAllPages((walkPage) =>
      listCatalogueItems(
        { q, contentType, institutionId, page: walkPage, size: WALK_PAGE_SIZE },
        { signal: controller.signal }
      )
    )
      .then((items) => setState({ items, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [q, contentType, institutionId]);

  function toggleExpand(id) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const roots = buildCatalogueTree(state.items);
  const total = roots.length;
  const pageRoots = roots.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageItems = flattenVisible(pageRoots, expandedIds);

  const selectableIds = pageItems
    .filter((row) => !itemIds.includes(row.id) && ineligibleReason(row) === null)
    .map((row) => row.id);

  return (
    <div className="shelf-panel">
      <div className="shelf-panel-header">
        <span className="shelf-panel-title">
          Available entitled titles <span className="shelf-panel-count">({total})</span>
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

      {state.loading ? (
        <p className="muted small">Loading...</p>
      ) : state.error ? (
        <p className="field-error">{state.error.friendly ?? 'Could not load the catalogue.'}</p>
      ) : pageItems.length === 0 ? (
        <p className="muted small">No books match this search.</p>
      ) : (
        <div className="shelf-panel-list">
          {pageItems.map((row) => (
            <AvailableRow
              key={row.id}
              row={row}
              picked={itemIds.includes(row.id)}
              checked={selectedIds.has(row.id)}
              onToggle={onToggleSelect}
              onToggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
      <Pagination page={page} size={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
