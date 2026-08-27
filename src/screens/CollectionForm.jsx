import { useState } from 'react';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { ErrorCode } from '../api/errors.js';
import { createCollection } from '../api/collections.js';

const EMPTY_FORM = { code: '', name: '', description: '' };

/**
 * The fields for a new collection. Create only: the contract has no endpoint for changing a
 * collection's name or code once it exists.
 *
 * `onCancel` is where the screen wants to go when the operator backs out. It is a prop rather
 * than a local "clear the fields" because this form now has an address of its own, and on a
 * page of its own Cancel means leave, not empty the boxes.
 */
export default function CollectionForm({ publisherId, onCreated, onCancel }) {
  const toast = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  // Codes are uppercase on this project.
  function changeCode(name, value) {
    change(name, value.toUpperCase());
  }

  function validate() {
    const found = {};
    if (!form.code.trim()) found.code = 'Enter a code.';
    if (!form.name.trim()) found.name = 'Enter a name.';
    else if (form.name.trim().length > 200) found.name = 'A name can be at most 200 characters.';
    if (form.description.trim().length > 1000) {
      found.description = 'A description can be at most 1000 characters.';
    }
    return found;
  }

  function buildWrite() {
    const write = { code: form.code.trim(), name: form.name.trim() };
    if (form.description.trim()) write.description = form.description.trim();
    return write;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await createCollection(publisherId, buildWrite());
      toast.saved('Collection created.');
      setForm(EMPTY_FORM);
      onCreated();
    } catch (failure) {
      if (failure.code === ErrorCode.CODE_TAKEN) {
        setErrors({ code: failure.friendly });
      } else {
        toast.failed(failure);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Code"
          name="code"
          value={form.code}
          onChange={changeCode}
          error={errors.code}
          placeholder="LAW2024"
          disabled={saving}
        />
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={change}
          error={errors.name}
          placeholder="Law and Technology 2024"
          disabled={saving}
        />
        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={change}
          error={errors.description}
          disabled={saving}
        />

        <FormActions onCancel={onCancel} saving={saving} saveLabel="Create collection" />
      </form>
    </section>
  );
}
