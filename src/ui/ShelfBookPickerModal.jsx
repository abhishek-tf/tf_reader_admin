import Modal from './Modal.jsx';
import ShelfBookTransferWorkspace from './ShelfBookTransferWorkspace.jsx';

/**
 * "Curate shelf: {title}" — Stitch's own dual-panel modal for building a shelf's book list,
 * rather than an always-open search block sitting under every shelf's picked list.
 */
export default function ShelfBookPickerModal({
  open,
  onClose,
  shelfTitle,
  institutionId,
  itemIds,
  onChange,
  maxItems,
  disabled,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Curate shelf: ${shelfTitle || 'Untitled shelf'}`}
      width="xwide"
    >
      <ShelfBookTransferWorkspace
        institutionId={institutionId}
        itemIds={itemIds}
        onChange={onChange}
        maxItems={maxItems}
        disabled={disabled}
      />
    </Modal>
  );
}
