import { useCallback, useEffect, useState } from 'react';
import { listInstitutions } from '../api/institution.js';
import { listEntitlements } from '../api/entitlements.js';
import { fetchAllPages } from '../api/client.js';

const EMPTY_FILTERS = { q: '', scopeType: '', status: '' };

/**
 * A super admin's entitlements ledger for one institution at a time — the same institution-
 * scoped shape ShelvesScreen and the old pending-requests queue already use, since the
 * contract has no cross-institution entitlements list to page through instead.
 *
 * The whole institution's entitlement set is walked once per institution (or per reload), not
 * paginated server-side: GET .../entitlements takes no `q`/`scopeType`/`status` filter, so
 * search and the two dropdowns below are real, but client-side, over the complete set — the
 * only way they can be real at all against this contract. That is also what keeps the KPI
 * counts honest: they are exact counts of this institution's own grants, not an estimate from
 * one page of them.
 */
export function useEntitlements() {
  const [institutionPicker, setInstitutionPicker] = useState({
    list: [],
    loading: true,
    selectedId: '',
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [entitlements, setEntitlements] = useState({ list: [], loading: false, error: null });
  const pageSize = 20;

  useEffect(() => {
    listInstitutions({ status: 'ACTIVE', size: 100 })
      .then((loaded) => setInstitutionPicker((c) => ({ ...c, list: loaded.items, loading: false })))
      .catch(() => setInstitutionPicker((c) => ({ ...c, loading: false })));
  }, []);

  const institutionId = institutionPicker.selectedId;

  const load = useCallback(
    (signal) => {
      if (!institutionId) return undefined;
      setEntitlements((c) => ({ ...c, loading: true, error: null }));
      return fetchAllPages((walkPage) =>
        listEntitlements(institutionId, { page: walkPage, size: 100 }, { signal })
      )
        .then((list) => setEntitlements({ list, loading: false, error: null }))
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setEntitlements((c) => ({ ...c, loading: false, error }));
        });
    },
    [institutionId]
  );

  useEffect(() => {
    if (!institutionId) return undefined;
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [institutionId, load]);

  function selectInstitution(id) {
    setInstitutionPicker((c) => ({ ...c, selectedId: id }));
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }

  function changeFilter(name, value) {
    setFilters((c) => ({ ...c, [name]: value }));
    setPage(0);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  }

  const needle = filters.q.trim().toLowerCase();
  const filteredRows = entitlements.list.filter((row) => {
    if (filters.scopeType && row.scopeType !== filters.scopeType) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (!needle) return true;
    return [row.scopeLabel, row.scopeId, row.id].some((field) =>
      field?.toLowerCase().includes(needle)
    );
  });
  const rows = filteredRows.slice(page * pageSize, page * pageSize + pageSize);

  const kpis = {
    active: entitlements.list.filter((e) => e.status === 'ACTIVE').length,
    pending: entitlements.list.filter((e) => e.status === 'PENDING').length,
    suspended: entitlements.list.filter((e) => e.status === 'SUSPENDED').length,
    revoked: entitlements.list.filter((e) => e.status === 'REVOKED').length,
  };

  return {
    institutionPicker,
    selectInstitution,
    institutionId,
    filters,
    changeFilter,
    clearFilters,
    searching: filters.q !== '' || filters.scopeType !== '' || filters.status !== '',
    rows,
    total: filteredRows.length,
    page,
    setPage,
    pageSize,
    loading: entitlements.loading,
    error: entitlements.error,
    reload: load,
    kpis,
  };
}
