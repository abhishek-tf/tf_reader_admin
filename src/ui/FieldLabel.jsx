/**
 * A field's label, with an optional asterisk for a required field. Shared by TextField and
 * SelectField so the two never drift on how "required" is shown.
 */
export default function FieldLabel({ id, label, required }) {
  return (
    <label className="field-label" htmlFor={id}>
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
