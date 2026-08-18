import { useState } from 'react';
import { INSTITUTION_TYPES } from '../api/institutionTypes';
import { ErrorCode } from '../api/errors';
import TextField from '../ui/TextField';
import SelectField from '../ui/SelectField';
import FormActions from '../ui/FormActions';

const TYPE_OPTIONS = INSTITUTION_TYPES.map((t) => ({ value: t, label: t }));

const EMPTY = {
  code: '',
  name: '',
  type: '',
  country: '',
  city: '',
  emailDomainsText: '',
  idpHint: '',
  logoUrl: '',
  primaryColor: '',
};

/**
 * Create and edit form for an institution. One object holds the whole form, checked only when the
 * operator submits, not on every keystroke — the same pattern LoginScreen and FrameCheck use. The
 * code stays exactly as typed — it is never upper-cased, unlike other codes in this console.
 */
export default function InstitutionForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} noValidate className="card institution-form">
      <TextField
        label="Code"
        name="code"
        value={form.code}
        onChange={change}
        error={errors.code}
        placeholder="imperial"
        disabled={saving}
      />

      <TextField
        label="Name"
        name="name"
        value={form.name}
        onChange={change}
        error={errors.name}
        disabled={saving}
      />

      <SelectField
        label="Type"
        name="type"
        value={form.type}
        onChange={change}
        options={TYPE_OPTIONS}
        error={errors.type}
        placeholder="Choose a type"
        disabled={saving}
      />

      <TextField
        label="Country"
        name="country"
        value={form.country}
        onChange={change}
        error={errors.country}
        disabled={saving}
      />

      <TextField
        label="City"
        name="city"
        value={form.city}
        onChange={change}
        error={errors.city}
        disabled={saving}
      />

      <div className="field">
        <label className="field-label" htmlFor="field-emailDomainsText">
          Email domains (comma separated)
        </label>
        <textarea
          id="field-emailDomainsText"
          className="input"
          value={form.emailDomainsText}
          onChange={(e) => change('emailDomainsText', e.target.value)}
          placeholder="imperial.ac.uk, ic.ac.uk"
          disabled={saving}
        />
      </div>

      <p className="muted small">Sign-in method: SAML (fixed — not configurable).</p>
      <TextField
        label="IdP hint"
        name="idpHint"
        value={form.idpHint}
        onChange={change}
        error={errors.idpHint}
        disabled={saving}
      />

      <TextField
        label="Logo URL"
        name="logoUrl"
        value={form.logoUrl}
        onChange={change}
        error={errors.logoUrl}
        disabled={saving}
      />

      <TextField
        label="Primary colour"
        name="primaryColor"
        value={form.primaryColor}
        onChange={change}
        error={errors.primaryColor}
        disabled={saving}
      />

      <FormActions onCancel={onCancel} saving={saving} />
    </form>
  );
}

export function toFormState(institution) {
  if (!institution) return EMPTY;
  return {
    code: institution.code,
    name: institution.name,
    type: institution.type,
    country: institution.country,
    city: institution.city ?? '',
    emailDomainsText: (institution.emailDomains ?? []).join(', '),
    idpHint: institution.signIn?.idpHint ?? '',
    logoUrl: institution.branding?.logoUrl ?? '',
    primaryColor: institution.branding?.primaryColor ?? '',
  };
}

export function toPayload(form) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    type: form.type,
    country: form.country.trim(),
    city: form.city.trim() || null,
    // Trim, lower-case, drop blanks, de-dupe — mirrors the backend's own normalisation exactly
    // (it applies the same rules again, so this just avoids sending obvious duplicates).
    emailDomains: [
      ...new Set(
        form.emailDomainsText
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      ),
    ],
    signIn: { method: 'SAML', idpHint: form.idpHint.trim() || null },
    branding:
      form.logoUrl || form.primaryColor
        ? { logoUrl: form.logoUrl.trim() || null, primaryColor: form.primaryColor.trim() || null }
        : null,
  };
}
