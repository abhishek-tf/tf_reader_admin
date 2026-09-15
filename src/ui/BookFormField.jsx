import TextField from './TextField.jsx';
import SelectField from './SelectField.jsx';

/**
 * One data-driven field from bookFormFields.js's FIELDS list, rendered as a TextField or
 * SelectField per its own `kind`. Everything not driven by that list (the publisher picker,
 * the staged/real content and cover panels) is rendered directly by BookForm itself instead.
 */
export default function BookFormField({ field, form, errors, saving, isbnLocked, onChange }) {
  if (field.showIf && !field.showIf(form)) return null;

  const required =
    typeof field.required === 'function' ? field.required(form) : Boolean(field.required);

  const shared = {
    label: field.label,
    name: field.name,
    value: form[field.name],
    onChange,
    error: errors[field.name],
    disabled: saving || (field.lockOnceSet && isbnLocked),
    required,
    compact: true,
  };

  if (field.kind === 'select') {
    return <SelectField {...shared} options={field.options} />;
  }
  return (
    <TextField
      {...shared}
      type={field.inputType}
      placeholder={field.placeholder}
      hint={field.hint}
      multiline={field.multiline}
      maxLength={field.maxLength}
    />
  );
}
