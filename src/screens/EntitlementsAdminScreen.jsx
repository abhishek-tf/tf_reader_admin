import { useState } from 'react';
import PageHeader from '../ui/PageHeader.jsx';
import Button from '../ui/Button.jsx';
import { useInFlightIds } from '../ui/entitlementFields.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { EntitlementsDecoration } from '../ui/pageDecorations.jsx';
import { useEntitlements } from './useEntitlements.js';
import { buildEntitlementColumns } from './entitlementLedgerColumns.jsx';
import EntitlementInstitutionChooser from './EntitlementInstitutionChooser.jsx';
import EntitlementLedgerPanel from './EntitlementLedgerPanel.jsx';
import EntitlementRevokeModal from './EntitlementRevokeModal.jsx';
import EntitlementAmendModal from './EntitlementAmendModal.jsx';
import GrantEntitlementWizard from './GrantEntitlementWizard.jsx';
import {
  changeEntitlementStatus,
  createEntitlement,
  revokeEntitlement,
  updateEntitlement,
} from '../api/entitlements.js';

/**
 * A super admin's entitlements ledger — Stitch's "Entitlements" page and its "Grant
 * Entitlement Wizard", one institution at a time (see useEntitlements.js for why). Replaces
 * the old pending-only queue: this shows every grant regardless of status, with the actions
 * each status actually supports.
 */
export default function EntitlementsAdminScreen() {
  const e = useEntitlements();
  const toast = useToast();
  const pendingIds = useInFlightIds();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [granting, setGranting] = useState(false);
  const [amendTarget, setAmendTarget] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const institution = e.institutionPicker.list.find((inst) => inst.id === e.institutionId) ?? null;

  async function handleDecision(entitlement, status) {
    if (pendingIds.has(entitlement.id)) return;
    pendingIds.start(entitlement.id);
    try {
      await changeEntitlementStatus(entitlement.id, { status });
      toast.saved(status === 'ACTIVE' ? 'Approved.' : 'Rejected.');
      e.reload();
    } catch (error) {
      toast.failed(error);
    } finally {
      pendingIds.finish(entitlement.id);
    }
  }

  async function handleAmendSubmit(entitlementId, payload) {
    pendingIds.start(entitlementId);
    try {
      await updateEntitlement(entitlementId, payload);
      toast.saved('Entitlement amended.');
      setAmendTarget(null);
      e.reload();
    } catch (error) {
      if (error.isStale) {
        toast.failed('Somebody amended this grant first. Reloading the latest version.');
        setAmendTarget(null);
        e.reload();
      } else {
        toast.failed(error);
      }
    } finally {
      pendingIds.finish(entitlementId);
    }
  }

  async function handleRevokeConfirm() {
    const target = revokeTarget;
    pendingIds.start(target.id);
    try {
      await revokeEntitlement(target.id);
      toast.saved('Entitlement revoked.');
      setRevokeTarget(null);
      e.reload();
    } catch (error) {
      toast.failed(error);
    } finally {
      pendingIds.finish(target.id);
    }
  }

  async function handleGrantSubmit(payload) {
    setGranting(true);
    try {
      await createEntitlement(e.institutionId, payload);
      toast.saved('Entitlement granted.');
      setWizardOpen(false);
      e.reload();
      return true;
    } catch (error) {
      toast.failed(error);
      return false;
    } finally {
      setGranting(false);
    }
  }

  const columns = buildEntitlementColumns({
    onApprove: (row) => handleDecision(row, 'ACTIVE'),
    onReject: (row) => handleDecision(row, 'REVOKED'),
    onAmend: setAmendTarget,
    onRevoke: setRevokeTarget,
    pendingIds,
  });

  return (
    <div className="stack">
      <PageHeader
        title="Entitlements"
        subtitle="Manage institutional content licences, DRM concurrency caps, loan policies, and subscription tiers."
        decoration={<EntitlementsDecoration />}
        actions={
          e.institutionId ? (
            <Button variant="primary" icon="add" onClick={() => setWizardOpen(true)}>
              Grant entitlement
            </Button>
          ) : null
        }
      />

      {!e.institutionId ? (
        <EntitlementInstitutionChooser
          institutionPicker={e.institutionPicker}
          onSelect={e.selectInstitution}
        />
      ) : (
        <EntitlementLedgerPanel e={e} columns={columns} />
      )}

      <GrantEntitlementWizard
        open={wizardOpen}
        institution={institution}
        onSubmit={handleGrantSubmit}
        onCancel={() => setWizardOpen(false)}
        saving={granting}
      />
      <EntitlementAmendModal
        key={amendTarget?.id ?? 'none'}
        entitlement={amendTarget}
        onSubmit={handleAmendSubmit}
        onCancel={() => setAmendTarget(null)}
        saving={amendTarget ? pendingIds.has(amendTarget.id) : false}
      />
      <EntitlementRevokeModal
        entitlement={revokeTarget}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setRevokeTarget(null)}
        saving={revokeTarget ? pendingIds.has(revokeTarget.id) : false}
      />
    </div>
  );
}
