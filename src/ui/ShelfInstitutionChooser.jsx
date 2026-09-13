import SelectField from './SelectField.jsx';
import Card from './Card.jsx';
import Icon from './Icon.jsx';

/**
 * What a super admin sees before picking an institution — one focused card with the picker
 * itself as its whole point, instead of a thin, half-empty context bar sitting above an
 * equally thin "choose one above" message. Two nearly-blank cards stacked on an otherwise
 * empty page read as broken more than as "waiting for input"; one deliberate card reads as
 * a step in a flow.
 */
export default function ShelfInstitutionChooser({ institutionPicker, setInstitutionPicker }) {
  return (
    <Card className="shelf-chooser-card">
      <span className="shelf-chooser-icon" aria-hidden="true">
        <Icon name="shelves" />
      </span>
      <h2 style={{ margin: 0 }}>Choose an institution</h2>
      <p className="muted small" style={{ margin: 0, maxWidth: 420 }}>
        Its feed title, page size, sort order and three curated shelves will load here — pick one to
        get started.
      </p>
      <SelectField
        label="Institution"
        name="institutionId"
        value={institutionPicker.selectedId}
        onChange={(_name, value) => setInstitutionPicker((c) => ({ ...c, selectedId: value }))}
        options={institutionPicker.list.map((inst) => ({ value: inst.id, label: inst.name }))}
        placeholder={
          institutionPicker.loading ? 'Loading institutions...' : 'Choose an institution'
        }
        disabled={institutionPicker.loading}
      />
    </Card>
  );
}
