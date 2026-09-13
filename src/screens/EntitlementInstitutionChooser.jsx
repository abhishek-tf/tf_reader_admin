import SelectField from '../ui/SelectField.jsx';
import Card from '../ui/Card.jsx';
import Icon from '../ui/Icon.jsx';

/** What a super admin sees before picking an institution — one focused card, same reasoning
 * as ShelvesScreen's own chooser: the contract has no cross-institution entitlements list, so
 * there is nothing to show at all until one institution is picked. */
export default function EntitlementInstitutionChooser({ institutionPicker, onSelect }) {
  return (
    <Card className="shelf-chooser-card">
      <span className="shelf-chooser-icon" aria-hidden="true">
        <Icon name="verified_user" />
      </span>
      <h2 style={{ margin: 0 }}>Choose an institution</h2>
      <p className="muted small" style={{ margin: 0, maxWidth: 420 }}>
        Its entitlement ledger — every grant, pending request, and licence term — will load here,
        and you can grant it a new one.
      </p>
      <SelectField
        label="Institution"
        name="institutionId"
        value={institutionPicker.selectedId}
        onChange={(_name, value) => onSelect(value)}
        options={institutionPicker.list.map((inst) => ({ value: inst.id, label: inst.name }))}
        placeholder={
          institutionPicker.loading ? 'Loading institutions...' : 'Choose an institution'
        }
        disabled={institutionPicker.loading}
      />
    </Card>
  );
}
