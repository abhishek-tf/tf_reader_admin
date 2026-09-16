import { useState } from 'react';
import Card from '../ui/Card.jsx';
import DataTable from '../ui/DataTable.jsx';
import KpiCard from '../ui/KpiCard.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import Tabs from '../ui/Tabs.jsx';
import ItemRequestBrowser from '../ui/ItemRequestBrowser.jsx';
import CollectionRequestBrowser from '../ui/CollectionRequestBrowser.jsx';
import PublisherRequestBrowser from '../ui/PublisherRequestBrowser.jsx';
import { EntitlementsDecoration } from '../ui/pageDecorations.jsx';
import { useInstitutionEntitlements } from './useInstitutionEntitlements.js';
import { ENTITLEMENT_COLUMNS } from './entitlementColumns.jsx';
import { getColumns } from './bookColumns.jsx';

function KpiRow({ total, pending, accessibleItems }) {
  return (
    <div className="kpi-grid">
      <KpiCard
        label="Total Requests"
        value={total}
        icon="verified_user"
        helper="every grant made"
      />
      <KpiCard
        label="Pending Requests"
        value={pending}
        icon="hourglass_top"
        helper="awaiting a super admin"
      />
      <KpiCard
        label="Entitled Items"
        value={accessibleItems}
        icon="auto_stories"
        helper="books you can reach"
      />
    </div>
  );
}

/**
 * An institution admin's own Entitlements page: what they already hold, what those grants
 * resolve to, and how to ask for more — Stitch's institution-scoped counterpart to the super
 * admin's ledger (EntitlementsAdminScreen). No approve/reject here, since that action is
 * SUPER_ADMIN only; this screen's own job is asking and tracking, not deciding.
 */
export default function InstitutionEntitlementsScreen({ institutionId }) {
  const [activeTab, setActiveTab] = useState('current');
  const e = useInstitutionEntitlements(institutionId);

  const pending = e.entitlements.filter((row) => row.status === 'PENDING');

  return (
    <div className="stack">
      <PageHeader
        title="Entitlements"
        subtitle="Request access to books, collections, and publishers, and track where each request stands."
        decoration={<EntitlementsDecoration />}
      />

      <KpiRow
        total={e.entitlements.length}
        pending={pending.length}
        accessibleItems={e.books.length}
      />

      <Tabs
        tabs={[
          { key: 'current', label: 'Current Entitlements', count: e.entitlements.length },
          { key: 'request', label: 'Request Access' },
        ]}
        active={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          // A request made on the other tab only updates that browser's own local list — this
          // tab's own entitlements/books fetch has no way to know, so refetch on the way back
          // in rather than showing what was true before the switch.
          if (tab === 'current') e.reload();
        }}
      />

      {activeTab === 'current' ? (
        <div className="stack">
          {pending.length > 0 ? (
            <Card>
              <div className="detail-section-title">
                <h2>Pending your approval queue</h2>
              </div>
              <p className="muted small">
                Sent to a super admin and not yet decided. Nothing more to do here until they act.
              </p>
              <DataTable columns={ENTITLEMENT_COLUMNS} rows={pending} />
            </Card>
          ) : null}

          <Card>
            <div className="detail-section-title">
              <h2>All entitlements</h2>
            </div>
            <DataTable
              columns={ENTITLEMENT_COLUMNS}
              rows={e.entitlements}
              loading={e.loadingEntitlements}
              error={e.entitlementsError}
              emptyMessage="You haven't requested any access yet. Use Request Access to ask for a book, collection, or publisher."
              onRetry={e.reload}
            />
          </Card>

          <Card>
            <div className="detail-section-title">
              <h2>Items you can access</h2>
            </div>
            {e.unresolvedItemCount > 0 ? (
              <p className="muted small">
                {e.unresolvedItemCount} item-level entitlement
                {e.unresolvedItemCount === 1 ? '' : 's'} can&apos;t be shown here yet - ask the
                platform team to check on this. Books reached through a publisher or collection
                grant are unaffected and still listed below.
              </p>
            ) : null}
            <DataTable
              columns={getColumns(e.toggleExpand)}
              rows={e.books}
              loading={e.loadingEntitlements || e.loadingBooks}
              error={e.booksError}
              emptyMessage="No books are reachable through your entitlements yet."
              onRetry={e.reload}
            />
          </Card>
        </div>
      ) : (
        <div className="stack">
          <ItemRequestBrowser institutionId={institutionId} />
          <CollectionRequestBrowser institutionId={institutionId} />
          <PublisherRequestBrowser institutionId={institutionId} />
        </div>
      )}
    </div>
  );
}
