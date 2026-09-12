import TextField from '../ui/TextField';
import SelectField from '../ui/SelectField';
import { TYPE_OPTIONS } from './institutionFormFields.js';

/** The "Institution details" section of the create/edit modal — name, immutable-once-created
 * code, type, and country/city. Split out of InstitutionForm, which was over the line budget
 * once every field section lived in one file. */
export function InstitutionDetailsSection({ form, errors, change, saving, editing }) {
  return (
    <div className="form-section">
      <h3 className="form-section-title">Institution details</h3>
      <p className="muted small">
        Core registry identification for catalogue licensing and discovery.
      </p>
      <div className="field-grid-2">
        <TextField
          label="Institution name"
          name="name"
          value={form.name}
          onChange={change}
          error={errors.name}
          placeholder="e.g. University of Oxford"
          disabled={saving}
          required
          autoFocus
        />
        <TextField
          label="Institution code"
          name="code"
          value={form.code}
          onChange={change}
          error={errors.code}
          placeholder="oxf-uk"
          disabled={saving || editing}
          required
          hint={
            editing
              ? undefined
              : 'Lowercase letters, digits and hyphens only. Immutable once created.'
          }
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
          required
        />
        <div className="field-grid-2">
          <TextField
            label="Country"
            name="country"
            value={form.country}
            onChange={change}
            error={errors.country}
            disabled={saving}
            required
          />
          <TextField
            label="City"
            name="city"
            value={form.city}
            onChange={change}
            error={errors.city}
            placeholder="Optional"
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}

/** The "Access & identity" section — email domains and the SAML IdP hint. */
export function AccessIdentitySection({ form, errors, change, saving }) {
  return (
    <div className="form-section">
      <h3 className="form-section-title">Access &amp; identity</h3>
      <p className="muted small">Federated SSO endpoint routing and domain recognition.</p>
      <div className="field-grid-2">
        <TextField
          label="Email domains"
          name="emailDomainsText"
          value={form.emailDomainsText}
          onChange={change}
          placeholder="ox.ac.uk, bodleian.ox.ac.uk"
          disabled={saving}
          hint="Assists patron discovery; does not bypass SAML."
        />
        <TextField
          label="SAML IdP hint"
          name="idpHint"
          value={form.idpHint}
          onChange={change}
          error={errors.idpHint}
          placeholder="saml.domain.auth.org"
          disabled={saving}
          hint="Optional entity ID for discovery redirect. Sign-in method is fixed to SAML."
        />
      </div>
    </div>
  );
}

/** The "Branding (optional)" section — logo URL and a primary colour with a live swatch. */
export function BrandingSection({ form, errors, change, saving }) {
  return (
    <div className="form-section">
      <h3 className="form-section-title">Branding (optional)</h3>
      <p className="muted small">Institutional shelf presentation and brand styling.</p>
      <div className="field-grid-2">
        <TextField
          label="Logo URL"
          name="logoUrl"
          value={form.logoUrl}
          onChange={change}
          error={errors.logoUrl}
          disabled={saving}
        />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
          <div style={{ flex: 1 }}>
            <TextField
              label="Primary colour"
              name="primaryColor"
              value={form.primaryColor}
              onChange={change}
              error={errors.primaryColor}
              placeholder="#002147"
              disabled={saving}
            />
          </div>
          <span
            className="color-swatch"
            aria-hidden="true"
            style={{
              marginTop: 28,
              background: form.primaryColor || 'var(--surface-container-low)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
