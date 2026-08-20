import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { ErrorCode } from '../api/errors.js';
import { createPublisher, updatePublisher } from '../api/publishers.js';

const EMPTY_PUBLISHER = { code: '', name: '', description: '', logoUrl: '' };

/** Create and edit share this form. A null publisher means create. */
export default function PublisherForm({ publisher = null, onSaved, onCancel }) {
  const editing = publisher !== null;
  const toast = useToast();
  const navigate = useNavigate();

  const source = publisher ?? EMPTY_PUBLISHER;
  const [form, setForm] = useState({
    code: source.code ?? '',
    name: source.name ?? '',
    description: source.description ?? '',
    logoUrl: source.logoUrl ?? '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  // Codes are uppercase on this project.
  function changeCode(name, value) {
    change(name, value);
  }

  function validate() {
    const found = {};
    if (!form.code.trim()) found.code = 'Enter a code.';
    if (!form.name.trim()) found.name = 'Enter a name.';
    else if (form.name.trim().length > 200) found.name = 'A name can be at most 200 characters.';
    if (form.description.trim().length > 1000) {
      found.description = 'A description can be at most 1000 characters.';
    }
    if (form.logoUrl.trim() && !form.logoUrl.includes('://')) {
      found.logoUrl = 'Enter a full address, including https://';
    }
    return found;
  }

  // Optional fields are left out rather than sent empty: logoUrl is a uri in the contract.
  function buildWrite() {
    const write = { code: form.code.trim(), name: form.name.trim() };
    if (form.description.trim()) write.description = form.description.trim();
    if (form.logoUrl.trim()) write.logoUrl = form.logoUrl.trim();
    return write;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        const updated = await updatePublisher(publisher.id, buildWrite());
        toast.saved('Publisher saved.');
        onSaved(updated);
      } else {
        const created = await createPublisher(buildWrite());
        toast.saved('Publisher created.');
        navigate(`/publishers/${created.id}`, { replace: true });
      }
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

  function handleCancel() {
    if (editing) onCancel();
    else navigate('/publishers');
  }

  return (
    <section className="card">
      <h1>{editing ? 'Edit publisher' : 'New publisher'}</h1>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Code"
          name="code"
          value={form.code}
          onChange={changeCode}
          error={errors.code}
          placeholder="rtlg"
          disabled={saving || editing}
          autoFocus
        />
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={change}
          error={errors.name}
          placeholder="Routledge"
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
        <TextField
          label="Logo address"
          name="logoUrl"
          value={form.logoUrl}
          onChange={change}
          error={errors.logoUrl}
          placeholder="https://cdn.tf/logos/routledge.png"
          disabled={saving}
        />

        <FormActions
          onCancel={handleCancel}
          saving={saving}
          saveLabel={editing ? 'Save changes' : 'Create publisher'}
        />
      </form>
    </section>
  );
}
