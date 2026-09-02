import { useState } from 'react';
import TextField from './TextField.jsx';
import FormActions from './FormActions.jsx';
import { useToast } from './ToastContext.jsx';
import { createEntitlement } from '../api/entitlements.js';

const EMPTY_FORM = { scopeId: '', submitting: false, error: null };

/** Requests a whole publisher by id. There is still no browsable "every publisher, tagged
 * with status" list the way books and collections have, so this stays a plain id field.
 * Split out of InstitutionCatalogueBrowser since that file was over the line budget; this
 * form has no reason to know about the books table next to it. */
export default function RequestScopeForm({ institutionId, onRequested }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.scopeId.trim()) {
      setForm((c) => ({ ...c, error: 'Enter an id.' }));
      return;
    }
    setForm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await createEntitlement(institutionId, {
        scopeType: 'PUBLISHER',
        scopeId: form.scopeId.trim(),
      });
      toast.saved('Requested.');
      setForm(EMPTY_FORM);
      onRequested();
    } catch (error) {
      toast.failed(error);
      setForm((c) => ({ ...c, submitting: false }));
    }
  }

  return (
    <section className="card">
      <h2>Request a publisher</h2>
      <p className="muted">
        There is no browsable list for publishers yet, so enter the id directly.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Publisher id"
          name="scopeId"
          value={form.scopeId}
          onChange={(_name, value) => setForm((c) => ({ ...c, scopeId: value, error: undefined }))}
          error={form.error}
          placeholder="pub_rtlg"
          disabled={form.submitting}
        />
        <FormActions
          onCancel={() => setForm(EMPTY_FORM)}
          saving={form.submitting}
          saveLabel="Request"
          cancelLabel="Clear"
        />
      </form>
    </section>
  );
}
