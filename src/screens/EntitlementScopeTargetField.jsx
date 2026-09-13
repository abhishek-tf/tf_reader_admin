import { useEffect, useState } from 'react';
import SelectField from '../ui/SelectField.jsx';
import EntitlementItemPicker from './EntitlementItemPicker.jsx';
import { listPublishers } from '../api/publishers.js';
import { listAllCollections } from '../api/collections.js';
import { fetchAllPages } from '../api/client.js';

const SCOPE_OPTIONS = [
  { value: 'COLLECTION', label: 'Collection', hint: 'Full batch digital catalogue' },
  { value: 'PUBLISHER', label: 'Publisher', hint: 'Imprint-wide catalog rights' },
  { value: 'ITEM', label: 'Single book', hint: 'Specific monograph or DOI' },
];

function ScopeTypeCards({ value, onChange, disabled }) {
  return (
    <div className="field">
      <span className="field-label">Licence scope</span>
      <div className="field-grid-3">
        {SCOPE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`radio-card${value === option.value ? ' radio-card-active' : ''}`}
          >
            <div className="shelf-card-title-row" style={{ justifyContent: 'space-between' }}>
              <span className="row-link-emphasis">{option.label}</span>
              <input
                type="radio"
                name="scopeType"
                value={option.value}
                checked={value === option.value}
                disabled={disabled}
                onChange={() => onChange(option.value)}
              />
            </div>
            <span className="muted small">{option.hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Loads a publisher's or collection's options once per scope type, since either is a plain
 * catalogue-wide dropdown - a search-driven picker like ITEM's only earns its keep once a
 * list has too many rows for a `<select>`, and neither of those does. Walked with
 * `fetchAllPages` rather than one big request: `size` is capped at 100 by the contract, and a
 * catalogue can easily hold more publishers or collections than that. */
function useTargetOptions(scopeType) {
  const [state, setState] = useState({ options: [], loading: false, error: null });

  useEffect(() => {
    if (scopeType !== 'PUBLISHER' && scopeType !== 'COLLECTION') {
      setState({ options: [], loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState({ options: [], loading: true, error: null });

    const walk =
      scopeType === 'PUBLISHER'
        ? fetchAllPages((page) => listPublishers({ page, size: 100 })).then((items) =>
            items.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))
          )
        : fetchAllPages((page) => listAllCollections({ page, size: 100 })).then((items) =>
            items.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.code})${c.itemCount != null ? ` — ${c.itemCount} items` : ''}`,
            }))
          );

    walk
      .then((options) => {
        if (!cancelled) setState({ options, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ options: [], loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [scopeType]);

  return state;
}

/** The wizard's "Licence Scope" + target picker, Stitch's own two-part scope selection: a
 * radio card for COLLECTION/PUBLISHER/ITEM, then a target picker shaped to whichever is
 * chosen - a dropdown for the first two, a search-and-pick list for a single book. */
export default function EntitlementScopeTargetField({
  scopeType,
  scopeId,
  onChangeScopeType,
  onChangeTarget,
  error,
  disabled,
}) {
  const { options, loading, error: loadError } = useTargetOptions(scopeType);

  return (
    <>
      <ScopeTypeCards
        value={scopeType}
        onChange={(next) => {
          onChangeScopeType(next);
          onChangeTarget('', '');
        }}
        disabled={disabled}
      />
      {scopeType === 'ITEM' ? (
        <div className="field">
          <span className="field-label">Target book</span>
          <EntitlementItemPicker scopeId={scopeId} onSelect={onChangeTarget} disabled={disabled} />
          {error ? <p className="field-error">{error}</p> : null}
        </div>
      ) : (
        <SelectField
          label={`Target ${scopeType.toLowerCase()}`}
          name="scopeId"
          value={scopeId}
          onChange={(_name, value) =>
            onChangeTarget(value, options.find((o) => o.value === value)?.label ?? '')
          }
          options={options}
          error={error}
          placeholder={
            loading
              ? 'Loading...'
              : loadError
                ? 'Could not load the list — try again'
                : options.length === 0
                  ? `No ${scopeType.toLowerCase()}s exist yet`
                  : `Choose a ${scopeType.toLowerCase()}`
          }
          disabled={disabled || loading || options.length === 0}
          required
        />
      )}
    </>
  );
}
