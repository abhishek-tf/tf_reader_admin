import { useEffect, useState } from 'react';

const KEY = 'bookForm.newItem.draft';

// Best-effort: sessionStorage can throw (private browsing, storage disabled, quota) - a failed
// load/save here should never break the form itself, just skip persistence for that session.
function loadDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistDraft(form) {
  try {
    // That rule exists to keep an auth token out of storage (see client.js), not to ban
    // storage outright. This is a catalogue item's typed form fields, never a token - nothing
    // this file touches can hold one.
    // eslint-disable-next-line no-restricted-properties
    sessionStorage.setItem(KEY, JSON.stringify(form));
  } catch {
    // best-effort, see above
  }
}

function removeDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // best-effort, see above
  }
}

/**
 * Restores and continuously saves a create-only form's typed field values across a reload, so
 * a mid-fill New Catalogue Item doesn't come back blank. `enabled` is false while editing an
 * existing item - that data already comes from the server, so there is nothing to draft.
 *
 * Chosen files are never part of `form` and cannot be restored this way regardless - no browser
 * persists a real `File` object across a reload - so the caller's own UI should say so near
 * the file inputs rather than let a restored draft imply otherwise.
 *
 * Returns `[form, setForm, clearDraft]`, the same shape as `useState` plus one extra function:
 * call `clearDraft()` once the draft has served its purpose (a successful create, or an
 * explicit Cancel) so a later, unrelated New Catalogue Item doesn't open pre-filled with it.
 */
export function useDraftForm(enabled, buildInitial) {
  const [form, setForm] = useState(() => (enabled && loadDraft()) || buildInitial());

  useEffect(() => {
    if (enabled) persistDraft(form);
  }, [enabled, form]);

  return [form, setForm, removeDraft];
}
