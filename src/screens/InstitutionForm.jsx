import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ErrorCode } from '../api/errors';
import FormActions from '../ui/FormActions';
import Icon from '../ui/Icon.jsx';
import { toFormState, toPayload } from './institutionFormFields.js';
import {
  InstitutionDetailsSection,
  AccessIdentitySection,
  BrandingSection,
} from './InstitutionFormFieldSections.jsx';

/**
 * Create and edit form for an institution. One object holds the whole form, checked only when
 * the operator submits, not on every keystroke — the same pattern LoginScreen and FrameCheck
 * use. The code stays exactly as typed — it is never upper-cased, unlike other codes in this
 * console.
 *
 * Rendered through InstitutionsScreen's own `<Outlet/>` (see App.jsx's nested `/institutions`
 * routes), not in place of it — the address is still real (create at /institutions/new, edit at
 * /institutions/:institutionId/edit), but the list stays mounted underneath, so
 * `.modal-backdrop` dims and blurs the real table, matching Stitch's own "Add Institution"
 * modal instead of a form floating in an empty page. Reloads the list on unmount for the same
 * reason Publishers/Books do: a status/detail edit that landed on the server would otherwise go
 * on showing the row's old values until a manual reload.
 */
export default function InstitutionForm({ initial, onSubmit, onCancel }) {
  const editing = initial != null;
  const { reload: reloadList } = useOutletContext() ?? {};
  const [form, setForm] = useState(() => toFormState(initial));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => () => reloadList?.(), [reloadList]);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  function validate() {
    const found = {};
    if (!form.code.trim()) found.code = 'Enter a code.';
    else if (!/^[a-z0-9-]{2,40}$/.test(form.code.trim())) {
      found.code = 'Lowercase letters, digits and hyphens only, 2–40 characters.';
    }
    if (!form.name.trim()) found.name = 'Enter a name.';
    if (!form.type) found.type = 'Choose a type.';
    if (!form.country.trim()) found.country = 'Enter a country.';
    if (form.idpHint.trim().length > 60) found.idpHint = 'At most 60 characters.';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(toPayload(form));
    } catch (err) {
      // A taken code is the one failure worth pointing at its field directly — every other
      // failure here is not something the operator can fix by looking at one input.
      if (err.code === ErrorCode.CODE_TAKEN) {
        setErrors({ code: err.friendly });
      } else {
        throw err; // let the screen's own toast report it
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="institution-form-title"
    >
      <div className="modal-card modal-card-wide">
        <div className="modal-header">
          <h2 className="modal-title" id="institution-form-title">
            {editing ? 'Edit institution' : 'Add institutional partner'}
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Cancel and go back"
            onClick={onCancel}
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate aria-labelledby="institution-form-title">
          <div className="modal-body">
            <InstitutionDetailsSection
              form={form}
              errors={errors}
              change={change}
              saving={saving}
              editing={editing}
            />
            <div className="form-section-divider" />
            <AccessIdentitySection form={form} errors={errors} change={change} saving={saving} />
            <div className="form-section-divider" />
            <BrandingSection form={form} errors={errors} change={change} saving={saving} />
          </div>

          <div className="modal-footer">
            <FormActions
              onCancel={onCancel}
              saving={saving}
              saveLabel={editing ? 'Save changes' : 'Create institution'}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
