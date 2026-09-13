import Icon from './Icon.jsx';

/**
 * Shared expand/collapse chevron for a tree row (Journal/Volume/Issue, expanding into its
 * children), or a spacer so a leaf row's content still lines up with an expandable sibling at
 * the same depth. `bookColumns.jsx`'s title column keeps its own inline copy of this (a column
 * render function already gets `onToggleExpand` in the shape this expects) - this is for every
 * other flat-list-turned-tree screen: ShelfBookSearch, EntitlementItemPicker,
 * CollectionBookSearch, ItemRequestBrowser.
 */
export default function RowTreeToggle({ row, onToggleExpand }) {
  if (row.hasChildren) {
    return (
      <button
        type="button"
        className={`btn-icon-ghost row-tree-toggle${row.isExpanded ? ' row-tree-toggle-open' : ''}`}
        onClick={(event) => {
          event.preventDefault();
          onToggleExpand(row.id);
        }}
        aria-label={row.isExpanded ? `Collapse ${row.title}` : `Expand ${row.title}`}
        aria-expanded={row.isExpanded}
      >
        <Icon name="chevron_right" />
      </button>
    );
  }
  if (row.depth) return <span className="row-tree-spacer" aria-hidden="true" />;
  return null;
}
