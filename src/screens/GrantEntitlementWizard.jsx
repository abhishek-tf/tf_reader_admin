import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';
import EntitlementScopeTargetField from './EntitlementScopeTargetField.jsx';

const CONCURRENCY_OPTIONS = [
  { value: 'UNLIMITED', label: 'Unlimited access', hint: 'Unmetered campus simultaneous readers' },
  {
    value: 'COPY_LIMITED',
    label: 'Copy-limited concurrency',
    hint: 'Fixed simultaneous circulation cap',
  },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  scopeType: 'COLLECTION',
  scopeId: '',
  scopeLabel: '',
  concurrencyModel: 'UNLIMITED',
  copies: '',
  loanPeriodDays: '14',
  validFrom: today(),
  perpetual: true,
  validTo: '',
};

function validate(form) {
  const found = {};
  if (!form.scopeId) found.scopeId = `Choose a ${form.scopeType.toLowerCase()}.`;
  if (form.concurrencyModel === 'COPY_LIMITED') {
    const copies = Number(form.copies);
    if (!form.copies.trim() || !Number.isInteger(copies) || copies < 1) {
      found.copies = 'Enter a whole number of at least 1.';
    }
  }
  const loanPeriodDays = Number(form.loanPeriodDays);
  if (!form.loanPeriodDays.trim() || !Number.isInteger(loanPeriodDays) || loanPeriodDays < 1) {
    found.loanPeriodDays = 'Enter a whole number of at least 1.';
  }
  if (!form.validFrom) found.validFrom = 'Enter a start date.';
  if (!form.perpetual && !form.validTo)
    found.validTo = 'Enter an end date, or mark this perpetual.';
  return found;
}

/**
 * "Grant Content Licence" — Stitch's own wizard for POST .../institutions/{id}/entitlements.
 * One institution at a time, matching the page it opens from: the modal's own subtitle names
 * that institution, same as the Stitch design, rather than asking again.
 */
export default function GrantEntitlementWizard({ open, institution, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  function change(name, value) {
    setForm((c) => ({ ...c, [name]: value }));
    setErrors((c) => (c[name] ? { ...c, [name]: undefined } : c));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      scopeType: form.scopeType,
      scopeId: form.scopeId,
      copies: form.concurrencyModel === 'UNLIMITED' ? null : Number(form.copies),
      loanPeriodDays: Number(form.loanPeriodDays),
      validFrom: form.validFrom,
      validTo: form.perpetual ? null : form.validTo,
    }).then((ok) => {
      if (ok) setForm(EMPTY_FORM);
    });
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setErrors({});
    onCancel();
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleCancel} title="Grant content licence" width="wide">
      <p className="muted small" style={{ margin: '-8px 0 0' }}>
        Institution: <strong>{institution?.name}</strong>
        {institution?.code ? ` • ${institution.code}` : ''}
      </p>
      <form onSubmit={handleSubmit} noValidate className="stack">
        <EntitlementScopeTargetField
          scopeType={form.scopeType}
          scopeId={form.scopeId}
          onChangeScopeType={(scopeType) => change('scopeType', scopeType)}
          onChangeTarget={(scopeId, scopeLabel) => setForm((c) => ({ ...c, scopeId, scopeLabel }))}
          error={errors.scopeId}
          disabled={saving}
        />

        <div className="field">
          <span className="field-label">Concurrency model</span>
          <div className="field-grid-2">
            {CONCURRENCY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`radio-card${form.concurrencyModel === option.value ? ' radio-card-active' : ''}`}
              >
                <div className="shelf-card-title-row" style={{ justifyContent: 'space-between' }}>
                  <span className="row-link-emphasis">{option.label}</span>
                  <input
                    type="radio"
                    name="concurrencyModel"
                    value={option.value}
                    checked={form.concurrencyModel === option.value}
                    disabled={saving}
                    onChange={() => change('concurrencyModel', option.value)}
                  />
                </div>
                <span className="muted small">{option.hint}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field-grid-2">
          {form.concurrencyModel === 'COPY_LIMITED' ? (
            <TextField
              label="Concurrent copies"
              name="copies"
              type="number"
              value={form.copies}
              onChange={change}
              error={errors.copies}
              disabled={saving}
              required
            />
          ) : null}
          <TextField
            label="Loan period (days)"
            name="loanPeriodDays"
            type="number"
            value={form.loanPeriodDays}
            onChange={change}
            error={errors.loanPeriodDays}
            disabled={saving}
            required
          />
        </div>

        <div className="field-grid-2">
          <TextField
            label="Valid from"
            name="validFrom"
            type="date"
            value={form.validFrom}
            onChange={change}
            error={errors.validFrom}
            disabled={saving}
            required
          />
          <div className="field">
            <label
              className="field-label"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              Valid to
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2xs)',
                  fontWeight: 400,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.perpetual}
                  disabled={saving}
                  onChange={(event) => change('perpetual', event.target.checked)}
                />
                Perpetual
              </span>
            </label>
            {!form.perpetual ? (
              <input
                type="date"
                className={errors.validTo ? 'input input-invalid' : 'input'}
                value={form.validTo}
                disabled={saving}
                onChange={(event) => change('validTo', event.target.value)}
              />
            ) : null}
            {errors.validTo ? <p className="field-error">{errors.validTo}</p> : null}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
          <FormActions onCancel={handleCancel} saving={saving} saveLabel="Grant entitlement" />
        </div>
      </form>
    </Modal>
  );
}
