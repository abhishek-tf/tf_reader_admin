import FieldLabel from './FieldLabel.jsx';

/**
 * One dropdown, its label, and its validation message.
 *
 * `options` is an array of { value, label }. Send the API the value, show the operator the
 * label. The API accepts only the exact enum value, for example ELITE, so the value the
 * operator reads and the value we send have to stay separate.
 */
export default function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  placeholder = 'Choose one',
  disabled = false,
  required = false,
}) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <FieldLabel id={id} label={label} required={required} />
      <select
        id={id}
        name={name}
        className={error ? 'input input-invalid' : 'input'}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
