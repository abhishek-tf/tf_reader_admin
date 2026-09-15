import TextField from '../ui/TextField.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';

/**
 * One field's worth of "already set, so don't hand over an editable box by default" behavior,
 * shared by PublisherDatabaseVaultSection's database connection and vault key fields - same
 * shape, different copy. `configured` false (nothing set yet, or the tenant hasn't loaded)
 * always shows the plain input: there's nothing to protect against overwriting yet.
 * `configured` true collapses to just Edit/Revert until Edit is clicked, and shows a warning
 * ahead of the input once it is - standard practice for a field whose current value is real
 * and whose change has a real, unmigrated consequence, not something to hand over open and
 * typeable by default.
 */
export default function TenantField({
  configured,
  editing,
  onStartEdit,
  onCancelEdit,
  saving,
  warning,
  textFieldProps,
  onSet,
  setLabel,
  onRevert,
  revertLabel,
}) {
  if (configured && !editing) {
    return (
      <div className="row-buttons">
        <Button onClick={onStartEdit}>Edit</Button>
        <Button onClick={onRevert} disabled={saving}>
          {revertLabel}
        </Button>
      </div>
    );
  }
  return (
    <div>
      {configured ? (
        <div className="callout-warning" role="alert">
          <Icon name="warning" style={{ color: 'var(--saffron-dark)' }} />
          <span>{warning}</span>
        </div>
      ) : null}
      <TextField {...textFieldProps} disabled={saving} />
      <div className="row-buttons">
        <Button variant="primary" onClick={onSet} disabled={saving}>
          {saving ? 'Saving...' : setLabel}
        </Button>
        {configured ? (
          <Button onClick={onCancelEdit} disabled={saving}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
