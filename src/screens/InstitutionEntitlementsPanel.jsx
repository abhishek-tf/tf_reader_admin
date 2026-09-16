import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { useInFlightIds } from '../ui/entitlementFields.jsx';
import { useEntitlements } from './useEntitlements.js';
import { buildEntitlementColumns } from './entitlementLedgerColumns.jsx';
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
 * The Institution Detail page's own entitlements ledger — one institution, already known from
 * the route, so there's no picker to choose it (see EntitlementLedgerPanel's
 * `showInstitutionPicker`). Split out of InstitutionDetailScreen so that page stays about the
 * institution itself, not the full grant/approve/reject/amend/revoke flow this pulls in.
 */
export default function InstitutionEntitlementsPanel({ institutionId, institution }) {
  const ledger = useEntitlements(institutionId);
  const toast = useToast();
  const pendingIds = useInFlightIds();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [granting, setGranting] = useState(false);
  const [amendTarget, setAmendTarget] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);

  async function handleDecision(entitlement, status) {
    if (pendingIds.has(entitlement.id)) return;
    pendingIds.start(entitlement.id);
    try {
      await changeEntitlementStatus(entitlement.id, { status });
      toast.saved(status === 'ACTIVE' ? 'Approved.' : 'Rejected.');
      ledger.reload();
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
      ledger.reload();
    } catch (error) {
      if (error.isStale) {
        toast.failed('Somebody amended this grant first. Reloading the latest version.');
        setAmendTarget(null);
        ledger.reload();
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
      ledger.reload();
    } catch (error) {
      toast.failed(error);
    } finally {
      pendingIds.finish(target.id);
    }
  }

  async function handleGrantSubmit(payload) {
    setGranting(true);
    try {
      await createEntitlement(institutionId, payload);
      toast.saved('Entitlement granted.');
      setWizardOpen(false);
      ledger.reload();
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
    <>
      <Card>
        <div className="detail-section-title">
          <h2>Entitlements</h2>
          <Button variant="primary" size="sm" icon="add" onClick={() => setWizardOpen(true)}>
            Grant entitlement
          </Button>
        </div>
        <EntitlementLedgerPanel e={ledger} columns={columns} showInstitutionPicker={false} />
      </Card>

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
    </>
  );
}
