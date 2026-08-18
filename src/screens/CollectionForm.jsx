import { useState } from 'react';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { ErrorCode } from '../api/errors.js';
import { createCollection } from '../api/collections.js';

const EMPTY_FORM = { code: '', name: '', description: '' };

export default function CollectionForm({ publisherId, onCreated }) {
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
      <h2>New collection</h2>
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

        <FormActions
          onCancel={() => setForm(EMPTY_FORM)}
          saving={saving}
          saveLabel="Create collection"
          cancelLabel="Clear"
        />
      </form>
    </section>
  );
}
