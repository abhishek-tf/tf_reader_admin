import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';

function toFormState(entitlement) {
  return {
    unlimited: !entitlement.copyLimited,
    copies: entitlement.copyLimited ? String(entitlement.copies) : '',
    loanPeriodDays: String(entitlement.loanPeriodDays),
    validFrom: entitlement.validFrom,
    perpetual: !entitlement.validTo,
    validTo: entitlement.validTo ?? '',
  };
}

function validate(form) {
  const found = {};
  if (!form.unlimited) {
    const copies = Number(form.copies);
    if (!form.copies.trim() || !Number.isInteger(copies) || copies < 1) {
      found.copies = 'Enter a whole number of at least 1, or mark this unlimited.';
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
 * "Amend" — PUT /entitlements/{id}, a full replace of the grant's terms (not its scope, not
 * its status; those have their own endpoints). Requires the `version` already on the row for
 * optimistic locking, so a stale amend reloads rather than silently overwriting somebody
 * else's more recent change.
 */
export default function EntitlementAmendModal({ entitlement, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(() => (entitlement ? toFormState(entitlement) : null));
  const [errors, setErrors] = useState({});

  if (!entitlement || !form) return null;

  function change(name, value) {
    setForm((c) => ({ ...c, [name]: value }));
    setErrors((c) => (c[name] ? { ...c, [name]: undefined } : c));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit(entitlement.id, {
      copies: form.unlimited ? null : Number(form.copies),
      loanPeriodDays: Number(form.loanPeriodDays),
      validFrom: form.validFrom,
      validTo: form.perpetual ? null : form.validTo,
      version: entitlement.version,
    });
  }

  return (
    <Modal open onClose={onCancel} title={`Amend ${entitlement.scopeLabel ?? entitlement.scopeId}`}>
      <form onSubmit={handleSubmit} noValidate>
        {entitlement.status === 'REVOKED' ? (
          <p className="muted small" style={{ marginTop: 0 }}>
            This grant is revoked. Saving updates its terms only — there is no way to reactivate a
            revoked grant from here, so it stays REVOKED. To restore access, use{' '}
            <strong>Grant entitlement</strong> to create a new one for this scope.
          </p>
        ) : null}
        <label
          className="field"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
        >
          <input
            type="checkbox"
            checked={form.unlimited}
            disabled={saving}
            onChange={(event) => change('unlimited', event.target.checked)}
          />
          <span className="field-label" style={{ margin: 0 }}>
            Unlimited concurrent copies
          </span>
        </label>
        {!form.unlimited ? (
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

        <div
          className="modal-footer"
          style={{ padding: 0, border: 'none', marginTop: 'var(--space-md)' }}
        >
          <FormActions onCancel={onCancel} saving={saving} saveLabel="Save changes" />
        </div>
      </form>
    </Modal>
  );
}
