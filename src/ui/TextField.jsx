import FieldLabel from './FieldLabel.jsx';

function describedBy(hintId, errorId, hint, error) {
  return [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
}

/**
 * One text input, its label, and its validation message.
 *
 * The message sits with the field rather than in a list at the top of the form, because a
 * message next to the box is the one people actually read.
 *
 * `multiline` swaps the input for a textarea, for the one or two fields per form that need
 * more than a line. `hint` is a quiet instruction under the box, for fields like a
 * comma-separated list where the format is not obvious from the label alone.
 */
export default function TextField({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  disabled = false,
  autoFocus = false,
  multiline = false,
  rows = 4,
  maxLength,
  hint,
  required = false,
}) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const sharedProps = {
    id,
    name,
    className: error ? 'input input-invalid' : 'input',
    value,
    placeholder,
    disabled,
    maxLength,
    required,
    onChange: (event) => onChange(name, event.target.value),
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy(hintId, errorId, hint, error),
  };

  return (
    <div className="field">
      <FieldLabel id={id} label={label} required={required} />
      {multiline ? (
        <textarea rows={rows} {...sharedProps} />
      ) : (
        <input type={type} autoFocus={autoFocus} {...sharedProps} />
      )}
      {hint ? (
        <p className="muted small" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
