import Modal from '../ui/Modal.jsx';
import TextField from '../ui/TextField.jsx';
import Button from '../ui/Button.jsx';

/**
 * The Suspend/Reactivate confirmation, with an optional reason. Not a `window.prompt`: a native
 * browser prompt is silently blocked (returns null with no dialog shown at all) in several
 * embedded/preview browsers and webviews, which makes the button look like it does nothing.
 */
export default function InstitutionStatusModal({
  statusConfirm,
  onChangeReason,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={statusConfirm !== null}
      onClose={onCancel}
      title={
        statusConfirm
          ? `Change ${statusConfirm.institution.name} to ${
              statusConfirm.nextStatus === 'ACTIVE' ? 'Active' : 'Suspended'
            }?`
          : ''
      }
      footer={
        <div className="form-actions">
          <Button variant="primary" onClick={onConfirm}>
            Confirm
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      }
    >
      {statusConfirm ? (
        <TextField
          label="Reason (optional)"
          name="reason"
          value={statusConfirm.reason}
          onChange={(_name, value) => onChangeReason(value)}
        />
      ) : null}
    </Modal>
  );
}
