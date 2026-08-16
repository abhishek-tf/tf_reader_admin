/**
 * One text input, its label, and its validation message.
 *
 * The message sits with the field rather than in a list at the top of the form, because a
 * message next to the box is the one people actually read.
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
}) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className={error ? 'input input-invalid' : 'input'}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
