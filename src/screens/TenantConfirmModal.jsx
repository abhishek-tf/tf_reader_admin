import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

const COPY = {
  database: {
    title: (isRevert) => (isRevert ? 'Revert to the shared database?' : 'Switch database?'),
    body: (isRevert) =>
      isRevert
        ? "This publisher's data will read from T&F's shared database again. This does not move any data out of the dedicated database - nothing already there is deleted, but this console will stop pointing at it."
        : "This publisher's data will start reading from the dedicated database you're entering. Existing data is NOT migrated: anything already saved under the previous connection (shared or dedicated) stays there and becomes invisible through this publisher.",
  },
  vaultKey: {
    title: (isRevert) => (isRevert ? "Revert to T&F's shared key?" : 'Set a new encryption key?'),
    body: (isRevert) =>
      isRevert
        ? "This publisher's content will be encrypted with T&F's shared master key again. Anything already encrypted with the dedicated key becomes unreadable until that same key is set again - this cannot be undone by reverting."
        : "This publisher's content will be encrypted with the new key you're entering. Anything already encrypted with the previous key (shared or dedicated) becomes unreadable once this is saved - this cannot be undone.",
  },
};

/**
 * The shared warning-confirm for both the database switch and the vault-key change/clear - same
 * shape as InstitutionStatusModal.jsx (a Modal, dynamic title, Confirm/Cancel footer), but with
 * copy that actually warns rather than a neutral confirm, since both actions here can make
 * existing data unreachable or unreadable. `confirm.kind` picks which field's copy to show;
 * `confirm.isRevert` picks the "reverting to shared" phrasing over "setting a new one".
 */
export default function TenantConfirmModal({ confirm, onConfirm, onCancel, saving }) {
  const copy = confirm ? COPY[confirm.kind] : null;
  return (
    <Modal
      open={confirm !== null}
      onClose={onCancel}
      title={copy ? copy.title(confirm.isRevert) : ''}
      footer={
        <div className="form-actions">
          <Button variant="primary" onClick={onConfirm} disabled={saving}>
            {saving ? 'Saving...' : 'Confirm'}
          </Button>
          <Button onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      }
    >
      {copy ? <p>{copy.body(confirm.isRevert)}</p> : null}
    </Modal>
  );
}
