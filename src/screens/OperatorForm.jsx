import { useState } from 'react';
import { ErrorCode } from '../api/errors.js';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import FormActions from '../ui/FormActions.jsx';

// The same wording Header.jsx shows for a role. SUPER_ADMIN is not a phrase to show an
// operator, but it is exactly what the value has to be, which is what SelectField separates.
const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Full access' },
  { value: 'PUBLISHER_ADMIN', label: 'Publisher admin' },
  { value: 'INSTITUTION_ADMIN', label: 'Institution admin' },
];

const MIN_PASSWORD = 12;

const EMPTY = {
  email: '',
  name: '',
  role: '',
  password: '',
  scopePublisherId: '',
  scopeInstitutionId: '',
};

/**
 * Create and edit form for one console operator. A null `initial` means create.
 *
 * `onSubmit` is given the finished payload and does the request, so this file makes no API
 * call of its own. A rejected save re-enables the form; a taken email becomes a message on
 * the email field and anything else is rethrown for the screen's toast.
 *
 * Which scope field is on screen is computed from the role during render, never synced in an
 * effect, because the role is the only thing it depends on.
 */
export default function OperatorForm({ initial = null, onSubmit, onCancel }) {
  const editing = initial !== null;
  const [form, setForm] = useState(() => toFormState(initial));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={change}
        error={errors.email}
        placeholder="ops@tandf.com"
        // An email is the operator's identity: changing it means deactivating this one and
        // creating another, so it is shown but locked once the record exists.
        hint={editing ? 'An email cannot be changed after the operator is created.' : undefined}
        disabled={saving || editing}
        required={!editing}
        autoFocus={!editing}
      />

      <TextField
        label="Name"
        name="name"
        value={form.name}
        onChange={change}
        error={errors.name}
        placeholder="Priya Ops"
        disabled={saving}
        required
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

      <TextField
        label={editing ? 'New password' : 'Password'}
        name="password"
        type="password"
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
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
        saveLabel={editing ? 'Save changes' : 'Create operator'}
      />
    </form>
  );
}

function toFormState(operator) {
  if (!operator) return EMPTY;
  return {
    email: operator.email,
    name: operator.name ?? '',
    role: operator.role,
    password: '',
    scopePublisherId: operator.scopePublisherId ?? '',
    scopeInstitutionId: operator.scopeInstitutionId ?? '',
  };
}

function validate(form, editing) {
  const found = {};

  if (!editing) {
    if (!form.email.trim()) found.email = 'Enter an email address.';
    else if (!form.email.includes('@')) found.email = 'Enter a full email address.';
  }
  if (!form.name.trim()) found.name = 'Enter a name.';
  if (!form.role) found.role = 'Choose a role.';

  // Required on create, optional on edit, and the same minimum whenever one is sent.
  if (!editing && !form.password) found.password = 'Enter a password.';
  else if (form.password && form.password.length < MIN_PASSWORD) {
    found.password = `A password must be at least ${MIN_PASSWORD} characters.`;
  }

  return { ...found, ...validateScope(form) };
}

/** The one scope the role requires, and nothing at all for a role that owns neither. */
function validateScope(form) {
  if (form.role === 'PUBLISHER_ADMIN' && !form.scopePublisherId.trim()) {
    return { scopePublisherId: 'Enter the publisher this operator manages.' };
  }
  if (form.role === 'INSTITUTION_ADMIN' && !form.scopeInstitutionId.trim()) {
    return { scopeInstitutionId: 'Enter the institution this operator manages.' };
  }
  return {};
}

/**
 * Builds an AdminUserCreate or an AdminUserUpdate. Update carries no email, and a field that
 * does not apply is left out of the object rather than sent as null or as an empty string.
 */
function toPayload(form, editing) {
  const payload = { name: form.name.trim(), role: form.role };

  if (!editing) payload.email = form.email.trim();

  // Blank on edit means "leave the stored password alone", which the server reads from the
  // key being absent. Sending "" would reset it to an empty password instead.
  if (form.password) payload.password = form.password;

  // Exactly one scope per role, and never the other one.
  if (form.role === 'PUBLISHER_ADMIN') payload.scopePublisherId = form.scopePublisherId.trim();
  if (form.role === 'INSTITUTION_ADMIN') {
    payload.scopeInstitutionId = form.scopeInstitutionId.trim();
  }
  return payload;
}
