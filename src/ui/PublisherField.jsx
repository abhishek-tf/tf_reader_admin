import TextField from './TextField.jsx';
import SelectField from './SelectField.jsx';

/**
 * Which publisher a book belongs to, ahead of every other imprint field on BookForm: a dropdown
 * of every publisher for SUPER_ADMIN, or locked to the signed-in admin's own publisher for
 * PUBLISHER_ADMIN - never a free-text box either role could type any id into. Not data-driven
 * through bookFormFields.js's FIELDS/Field like the rest of the form: it needs an async-loaded
 * option list and a role check, neither of which that generic schema supports.
 */
export default function PublisherField({ user, form, errors, saving, publisherOptions, onChange }) {
  if (user.role === 'PUBLISHER_ADMIN') {
    return (
      <TextField
        label="Publisher"
        name="publisherId"
        value={form.publisherId}
        onChange={onChange}
        disabled
        compact
        hint="Locked to your own publisher."
      />
    );
  }
  return (
    <SelectField
      label="Publisher"
      name="publisherId"
      value={form.publisherId}
      onChange={onChange}
      options={publisherOptions.map((publisher) => ({
        value: publisher.id,
        label: `${publisher.name} (${publisher.code})`,
      }))}
      error={errors.publisherId}
      disabled={saving}
      required
      compact
    />
  );
}
