/**
 * A field's label, with an optional asterisk for a required field. Shared by TextField and
 * SelectField so the two never drift on how "required" is shown.
 *
 * `compact`, if true, renders Stitch's other label treatment — a small uppercase slate label,
 * the one its drawers use, instead of the bold sentence-case one its modals use. Leaving it
 * out renders exactly as before, so every existing field is unaffected.
 */
export default function FieldLabel({ id, label, required, compact = false }) {
  return (
    <label className={compact ? 'field-label field-label-compact' : 'field-label'} htmlFor={id}>
      {label}
      {required ? (
        <span className="field-required" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </label>
  );
}
