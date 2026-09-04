import { useState } from 'react';
import TextField from './TextField.jsx';
import SelectField from './SelectField.jsx';
import FormActions from './FormActions.jsx';
import { createCatalogueItem, updateCatalogueItem } from '../api/catalogueItems.js';
import { useToast } from './ToastContext.jsx';
import { FIELDS, toFormState, validate, buildPayload, isIsbnLocked } from './bookFormFields.js';

function Field({ field, form, errors, saving, isbnLocked, onChange }) {
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

/**
 * Create and edit, in one form. `initialItem` is null for create, or the row from the list
 * for edit — the list response already carries every field this form needs, so there is no
 * separate fetch before editing.
 */
export default function BookForm({ initialItem, onSaved, onCancel }) {
  const toast = useToast();
  const isEditing = Boolean(initialItem?.id);
  const isbnLocked = isEditing && isIsbnLocked(initialItem);

  const [form, setForm] = useState(() => toFormState(initialItem));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const payload = buildPayload(form);
      const saved = isEditing
        ? await updateCatalogueItem(initialItem.id, payload)
        : await createCatalogueItem(payload);
      toast.saved(isEditing ? 'Book updated.' : 'Book created.');
      onSaved(saved);
    } catch (error) {
      if (error.isValidation) {
        setErrors({
          form: error.traceId ? `${error.friendly} (trace ${error.traceId})` : error.friendly,
        });
      } else {
        toast.failed(error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}

      {FIELDS.map((field) => (
        <Field
          key={field.name}
          field={field}
          form={form}
          errors={errors}
          saving={saving}
          isbnLocked={isbnLocked}
          onChange={change}
        />
      ))}

      <FormActions onCancel={onCancel} saving={saving} saveLabel={isEditing ? 'Save' : 'Create'} />
    </form>
  );
}
