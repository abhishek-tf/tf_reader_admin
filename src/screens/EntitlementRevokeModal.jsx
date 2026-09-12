import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

/**
 * Confirms before revoking a grant — DELETE .../entitlements/{id} has no undo, and no reason
 * field of its own to soften the click (unlike the institution status-change confirm, that
 * endpoint takes no request body at all).
 */
export default function EntitlementRevokeModal({ entitlement, onConfirm, onCancel, saving }) {
  return (
    <Modal
      open={entitlement !== null}
      onClose={onCancel}
      title={entitlement ? `Revoke ${entitlement.scopeLabel ?? entitlement.scopeId}?` : ''}
      footer={
        <div className="form-actions">
          <Button variant="dangerGhost" onClick={onConfirm} disabled={saving}>
            {saving ? 'Revoking...' : 'Revoke entitlement'}
          </Button>
          <Button onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      }
    >
      <p className="muted">
        This institution&rsquo;s readers lose access to everything this grant resolves to on their
        next request. This cannot be undone from here — a revoked grant can only be replaced by
        creating a new one.
      </p>
    </Modal>
  );
}
