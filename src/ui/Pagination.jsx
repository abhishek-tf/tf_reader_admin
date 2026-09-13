import Icon from './Icon.jsx';

/**
 * Previous/next paging for a list, alongside a DataTable rather than inside it.
 *
 * `page` is zero based, matching the contract and `pageQuery()` in api/client.js. Rendered as
 * Stitch's chevron-button stepper with the current page number pinned between them, rather
 * than a full page-number list — this component only ever knows the current page and total,
 * not every page in between, so a numbered strip would have nothing to put on it.
 *
 * `pageSize`/`onPageSizeChange` are optional: giving both adds the "Rows per page" dropdown
 * on the left, matching Stitch's footer. Leaving them out renders exactly as before, so every
 * existing caller is unaffected.
 */
export default function Pagination({
  page,
  size,
  total,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  return (
    <div className="pagination">
      {onPageSizeChange ? (
        <div className="pagination-size">
          <span className="pagination-status">Rows per page</span>
          <div className="input-group">
            <select
              aria-label="Rows per page"
              className="input filter-bar-select"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      <div className="pagination-steps">
        <button
          type="button"
          className="pagination-step-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <Icon name="chevron_left" style={{ fontSize: 16 }} />
        </button>
        <span className="pagination-current" aria-current="page">
          {page + 1}
        </span>
        <button
          type="button"
          className="pagination-step-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <Icon name="chevron_right" style={{ fontSize: 16 }} />
        </button>
      </div>
      <span className="pagination-status">
        Page {page + 1} of {totalPages} ({total} total)
      </span>
    </div>
  );
}
