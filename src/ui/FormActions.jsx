import Button from './Button.jsx';

/**
 * Save and cancel, in one place so every form behaves the same.
 *
 * Save is disabled while a request is in flight. Without that, a double click creates two
 * records, which is the most common bug in an admin console.
 */
export default function FormActions({
  onCancel,
  saving = false,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  disabled = false,
}) {
  return (
    <div className="form-actions">
      <Button type="submit" variant="primary" disabled={saving || disabled}>
        {saving ? 'Saving...' : saveLabel}
      </Button>
      <Button type="button" onClick={onCancel} disabled={saving}>
        {cancelLabel}
      </Button>
    </div>
  );
}
