/**
 * Previous/next paging for a list, alongside a DataTable rather than inside it.
 *
 * `page` is zero based, matching the contract and `pageQuery()` in api/client.js.
 */
export default function Pagination({ page, size, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn"
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
      >
        Previous
      </button>
      <span className="pagination-status">
        Page {page + 1} of {totalPages} · {total} total
      </span>
      <button
        type="button"
        className="btn"
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
      >
        Next
      </button>
    </div>
  );
}
