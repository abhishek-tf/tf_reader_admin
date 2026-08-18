/**
 * Previous/next paging for a list endpoint's `{ page, size, total }` response.
 *
 * Not a stub — there is no shared pagination control in the console yet, so this is a real,
 * small addition in the same shape as the console's other `ui/` primitives (plain props in,
 * the existing `.btn`/`.muted` classes for styling, nothing new introduced). `page` is zero
 * based, matching the API contract everywhere else in this app.
 */
export default function Pagination({ page, size, total, onPageChange }) {
  const lastPage = Math.max(0, Math.ceil(total / size) - 1);
  return (
    <div className="pagination">
      <button
        type="button"
        className="btn"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className="muted pagination-status">
        Page {page + 1} of {lastPage + 1} ({total} total)
      </span>
      <button
        type="button"
        className="btn"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
