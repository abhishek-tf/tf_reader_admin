import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import PageHeader from '../ui/PageHeader.jsx';
import KpiCard from '../ui/KpiCard.jsx';
import Button from '../ui/Button.jsx';
import Tabs from '../ui/Tabs.jsx';
import RouteErrorBoundary from '../ui/RouteErrorBoundary.jsx';
import { OperatorsAuditDecoration } from '../ui/pageDecorations.jsx';
import { useOperators } from './useOperators.js';
import { useAuditLog } from './useAuditLog.js';
import OperatorsTabPanel from './OperatorsTabPanel.jsx';
import AuditLogTabPanel from './AuditLogTabPanel.jsx';

function KpiRow({ operatorKpis, recentAuditTotal }) {
  return (
    <div className="kpi-grid">
      <KpiCard
        label="Total Operators"
        value={operatorKpis.total}
        icon="group"
        helper="registered profiles"
      />
      <KpiCard
        label="Active Operators"
        value={operatorKpis.active}
        icon="lock_open"
        accent
        helper="able to sign in"
      />
      <KpiCard
        label="Super Admins"
        value={operatorKpis.superAdmins}
        icon="shield_person"
        helper="global scope"
      />
      <KpiCard
        label="Audit Events / 7d"
        value={recentAuditTotal ?? '—'}
        icon="history"
        helper="pruned after 90d"
      />
    </div>
  );
}

/**
 * "Operators & Audit Log" — one Stitch-designed page for what used to be two: a super admin's
 * roster of console operators, and the read-only audit trail, as sub-tabs of the same screen
 * rather than two side-menu entries. Both hooks are owned here (not inside their tab panels) so
 * the create/edit operator modal — rendered through this screen's own `<Outlet/>`, the same
 * nested-route pattern every other migrated list page uses — can reload the same operator list
 * instance on close, and so the KPI row reads real, current counts rather than a second,
 * independent fetch of the same data.
 */
export default function OperatorsAuditScreen() {
  const [activeTab, setActiveTab] = useState('operators');
  const o = useOperators();
  const a = useAuditLog();
  const location = useLocation();

  return (
    <div className="stack">
      <PageHeader
        title="Operators & Audit Log"
        subtitle="Manage administrator roles, catalogue operators, authentication permissions, and immutable security audit logs."
        decoration={<OperatorsAuditDecoration />}
        actions={
          activeTab === 'operators' ? (
            <Button as={Link} variant="primary" icon="add" to="/operators/new">
              Add operator
            </Button>
          ) : null
        }
      />

      <KpiRow operatorKpis={o.kpis} recentAuditTotal={a.recentTotal} />

      <Tabs
        tabs={[
          { key: 'operators', label: 'Admin Operators', count: o.kpis.total },
          { key: 'audit', label: 'Security & Activity Audit Log' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'operators' ? <OperatorsTabPanel o={o} /> : <AuditLogTabPanel a={a} />}

      {/* Filled by the /operators/new and /operators/:adminUserId/edit child routes — the same
          modal-over-the-blurred-list pattern every other migrated create/edit form in this app
          uses. `context` hands it this screen's own operator-list reload, since the list stays
          mounted across a create/edit instead of remounting on the way back to /operators. */}
      <RouteErrorBoundary resetKey={location.pathname} fallbackTo="/operators">
        <Outlet context={{ reload: o.reload }} />
      </RouteErrorBoundary>
    </div>
  );
}
