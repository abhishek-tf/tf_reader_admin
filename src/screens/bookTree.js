/**
 * Groups a flat list of catalogue items into a Journal → Volume → Issue → Article tree, for
 * the Books page only. Pure, no React — the item shape is whatever listCatalogueItems()
 * already returns: `workType` (absent means BOOK), `parentId`, `sequence`, plus everything
 * else the columns already read.
 *
 * A standalone BOOK has no parentId and no children, so it comes back as a childless root and
 * renders exactly as it always has.
 */

/**
 * An item is a root either because it really has no parent, or because its parent isn't in
 * this set at all — a filter (accessTier, contentType, q, ...) can match a child without
 * matching its container. Testing "does `byId` have this parentId" rather than "is parentId
 * null" is what promotes that orphan to a root instead of silently dropping it, and it also
 * covers a transitively-orphaned chain for free: a promoted orphan's own children still find
 * it in `childrenByParentId`, keyed by the literal parentId they carry.
 */
function bySequence(a, b) {
  if (a.sequence == null && b.sequence == null) return 0;
  if (a.sequence == null) return 1;
  if (b.sequence == null) return -1;
  return a.sequence - b.sequence;
}

export function buildCatalogueTree(items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const childrenByParentId = new Map();
  for (const item of items) {
    if (item.parentId != null && byId.has(item.parentId)) {
      const list = childrenByParentId.get(item.parentId) ?? [];
      list.push(item);
      childrenByParentId.set(item.parentId, list);
    }
  }

  function toNode(item) {
    const children = (childrenByParentId.get(item.id) ?? []).sort(bySequence).map(toNode);
    return { ...item, children };
  }

  return items
    .filter((item) => item.parentId == null || !byId.has(item.parentId))
    .sort(bySequence)
    .map(toNode);
}

/**
 * Depth-first flatten of root nodes, respecting which ones are expanded — exactly the rows
 * DataTable should render for whichever roots are on the current page. Collapsed by default:
 * a node's children are only visited when its own id is in `expandedIds`.
 *
 * Spreads each node onto a new object rather than mutating it, so React sees the same `id` it
 * always did (DataTable's default rowKey) plus the new depth/hasChildren/isExpanded fields
 * every existing column render function can ignore.
 */
export function flattenVisible(rootNodes, expandedIds) {
  const rows = [];
  function visit(node, depth) {
    const hasChildren = node.children.length > 0;
    const isExpanded = hasChildren && expandedIds.has(node.id);
    rows.push({ ...node, depth, hasChildren, isExpanded });
    if (isExpanded) node.children.forEach((child) => visit(child, depth + 1));
  }
  rootNodes.forEach((node) => visit(node, 0));
  return rows;
}
