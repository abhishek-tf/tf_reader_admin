import { useCallback, useEffect, useState } from 'react';
import { listAdminUsers, deactivateAdminUser } from '../api/adminUsers.js';
import { listPublishers } from '../api/publishers.js';
import { listInstitutions } from '../api/institution.js';
import { fetchAllPages } from '../api/client.js';

const EMPTY_FILTERS = { q: '', role: '', status: '' };
const PAGE_SIZE = 20;

/**
 * All the state behind the Operators tab: the full operator roster (there is no q/role/status
 * filter on GET /admin-users — page and size are the whole query — so search and the two
 * dropdowns below are real, but client-side, over the complete list, the only way they can be
 * real at all against this contract), the scope-id-to-name lookups for the "Assigned scope"
 * column, and the KPI counts.
 */
export function useOperators() {
  const [operators, setOperators] = useState({ list: [], loading: true, error: null });
  const [scopeNames, setScopeNames] = useState({ publishers: {}, institutions: {} });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [pendingId, setPendingId] = useState(null);

  const load = useCallback(() => {
    setOperators((c) => ({ ...c, loading: true, error: null }));
    return fetchAllPages((walkPage) => listAdminUsers({ page: walkPage, size: 100 }))
      .then((list) => setOperators({ list, loading: false, error: null }))
      .catch((error) => setOperators((c) => ({ ...c, loading: false, error })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Resolves a publisher/institution scope id into its real name for the table, fetched once -
  // both lists are small enough to walk whole, and neither changes because of anything on this
  // screen. A lookup miss (a scope id for a record since deleted) just falls back to the id.
  useEffect(() => {
    fetchAllPages((walkPage) => listPublishers({ page: walkPage, size: 100 }))
      .then((items) =>
        setScopeNames((c) => ({
          ...c,
          publishers: Object.fromEntries(items.map((p) => [p.id, p.name])),
        }))
      )
      .catch(() => {});
    fetchAllPages((walkPage) => listInstitutions({ page: walkPage, size: 100 }))
      .then((items) =>
        setScopeNames((c) => ({
          ...c,
          institutions: Object.fromEntries(items.map((i) => [i.id, i.name])),
        }))
      )
      .catch(() => {});
  }, []);

  function changeFilter(name, value) {
    setFilters((c) => ({ ...c, [name]: value }));
    setPage(0);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }

  async function deactivate(operator) {
    setPendingId(operator.id);
    try {
      await deactivateAdminUser(operator.id);
      await load();
      return true;
    } finally {
      setPendingId(null);
    }
  }

  const needle = filters.q.trim().toLowerCase();
  const filtered = operators.list.filter((row) => {
    if (filters.role && row.role !== filters.role) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (!needle) return true;
    return [row.name, row.email].some((field) => field?.toLowerCase().includes(needle));
  });
  const rows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const kpis = {
    total: operators.list.length,
    active: operators.list.filter((o) => o.status === 'ACTIVE').length,
    superAdmins: operators.list.filter((o) => o.role === 'SUPER_ADMIN').length,
  };

  return {
    filters,
    changeFilter,
    clearFilters,
    searching: filters.q !== '' || filters.role !== '' || filters.status !== '',
    rows,
    total: filtered.length,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    loading: operators.loading,
    error: operators.error,
    reload: load,
    scopeNames,
    pendingId,
    deactivate,
    kpis,
  };
}
