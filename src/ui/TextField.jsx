import FieldLabel from './FieldLabel.jsx';

function describedBy(hintId, errorId, hint, error) {
  return [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
}

function fieldClassName(error, endAdornment) {
  const base = error ? 'input input-invalid' : 'input';
  return endAdornment ? `${base} input-with-adornment` : base;
}

// Split out of TextField so an adornment (today, only the password toggle) does not add
// branches to TextField itself — every other field takes neither path below and renders
// exactly as before.
function FieldControl({ multiline, rows, sharedProps, type, autoFocus, endAdornment }) {
  if (multiline) return <textarea rows={rows} {...sharedProps} />;

  const input = <input type={type} autoFocus={autoFocus} {...sharedProps} />;
  if (!endAdornment) return input;

  return (
    <div className="input-group">
      {input}
      {endAdornment}
    </div>
  );
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
 *
 * `endAdornment` is an optional control rendered inside the field, on the right — the password
 * visibility toggle is the one caller today. Passing it wraps the input so the control has
 * somewhere to sit; leaving it out renders exactly as before, so every other field is
 * unaffected.
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
  endAdornment,
  compact = false,
}) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const sharedProps = {
    id,
    name,
    className: fieldClassName(error, endAdornment),
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
      <FieldLabel id={id} label={label} required={required} compact={compact} />
      <FieldControl
        multiline={multiline}
        rows={rows}
        sharedProps={sharedProps}
        type={type}
        autoFocus={autoFocus}
        endAdornment={endAdornment}
      />
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
