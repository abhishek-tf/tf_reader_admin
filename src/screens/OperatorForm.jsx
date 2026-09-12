import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ErrorCode } from '../api/errors.js';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import FormActions from '../ui/FormActions.jsx';
import Icon from '../ui/Icon.jsx';
import { MIN_PASSWORD, toFormState, validate, toPayload } from './operatorFormFields.js';

// The same wording Header.jsx shows for a role. SUPER_ADMIN is not a phrase to show an
// operator, but it is exactly what the value has to be, which is what SelectField separates.
const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Full access' },
  { value: 'PUBLISHER_ADMIN', label: 'Publisher admin' },
  { value: 'INSTITUTION_ADMIN', label: 'Institution admin' },
];

/**
 * Create and edit form for one console operator, as Stitch's own centred modal (its "Add
 * Operator" screen) rather than a plain page. A null `initial` means create.
 *
 * Rendered through OperatorsAuditScreen's own `<Outlet/>` (see App.jsx's nested `/operators`
 * routes), not in place of it — the address is still real (create at /operators/new, edit at
 * /operators/:adminUserId/edit), but the operator list stays mounted underneath, blurred behind
 * `.modal-backdrop`. Reloads that list on unmount for the same reason every other migrated
 * create/edit modal does: a status/detail change would otherwise go on showing what it said
 * before the edit until a manual reload.
 *
 * `onSubmit` is given the finished payload and does the request, so this file makes no API
 * call of its own. A rejected save re-enables the form; a taken email becomes a message on
 * the email field and anything else is rethrown for the screen's toast.
 */
// eslint-disable-next-line complexity
export default function OperatorForm({ initial = null, onSubmit, onCancel }) {
  const editing = initial !== null;
  const { reload: reloadList } = useOutletContext() ?? {};
  const [form, setForm] = useState(() => toFormState(initial));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => () => reloadList?.(), [reloadList]);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  // Both scopes are cleared in the SAME update as the new role, so a value typed for the
  // previous role can never survive into the payload. The server rejects a scope field sent
  // for the wrong role rather than ignoring it, which makes this correctness, not tidiness.
  function changeRole(_name, value) {
    setForm((current) => ({
      ...current,
      role: value,
      scopePublisherId: '',
      scopeInstitutionId: '',
    }));
    setErrors((current) => ({
      ...current,
      role: undefined,
      scopePublisherId: undefined,
      scopeInstitutionId: undefined,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(form, editing);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(toPayload(form, editing));
    } catch (failure) {
      // A taken email is the one failure the operator can fix by looking at one input.
      if (failure.code === ErrorCode.CODE_TAKEN) {
        setErrors({ email: failure.friendly });
      } else {
        throw failure; // let the screen's own toast report it
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
      aria-labelledby="operator-form-title"
    >
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title" id="operator-form-title">
            {editing ? 'Edit operator' : 'Add console operator'}
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

        <form onSubmit={handleSubmit} noValidate aria-labelledby="operator-form-title">
          <div className="modal-body">
            <div className="field-grid-2">
              <TextField
                label="Full name"
                name="name"
                value={form.name}
                onChange={change}
                error={errors.name}
                placeholder="Priya Ops"
                disabled={saving}
                required
                autoFocus
              />
              <TextField
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                error={errors.email}
                placeholder="ops@tandf.com"
                hint={
                  editing ? 'An email cannot be changed after the operator is created.' : undefined
                }
                disabled={saving || editing}
                required={!editing}
              />
            </div>

            <TextField
              label={editing ? 'New password' : 'Initial password'}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={change}
              error={errors.password}
              hint={
                editing
                  ? 'Leave blank to keep the current password.'
                  : `At least ${MIN_PASSWORD} characters.`
              }
              disabled={saving}
              required={!editing}
              endAdornment={
                <button
                  type="button"
                  className="input-adornment-btn"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              }
            />

            <SelectField
              label="Role"
              name="role"
              value={form.role}
              onChange={changeRole}
              options={ROLE_OPTIONS}
              error={errors.role}
              placeholder="Choose a role"
              disabled={saving}
              required
            />

            {form.role === 'PUBLISHER_ADMIN' ? (
              <TextField
                label="Scope publisher ID"
                name="scopePublisherId"
                value={form.scopePublisherId}
                onChange={change}
                error={errors.scopePublisherId}
                placeholder="pub_rtlg"
                hint="The one publisher this operator may manage."
                disabled={saving}
                required
              />
            ) : null}

            {form.role === 'INSTITUTION_ADMIN' ? (
              <TextField
                label="Scope institution ID"
                name="scopeInstitutionId"
                value={form.scopeInstitutionId}
                onChange={change}
                error={errors.scopeInstitutionId}
                placeholder="inst_7f3"
                hint="The one institution this operator may manage."
                disabled={saving}
                required
              />
            ) : null}
          </div>

          <div className="modal-footer">
            <FormActions
              onCancel={onCancel}
              saving={saving}
              saveLabel={editing ? 'Save changes' : 'Create operator'}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
