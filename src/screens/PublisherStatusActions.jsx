import { useState } from 'react';
import TextField from '../ui/TextField.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { setPublisherStatus } from '../api/publishers.js';

/** Suspend or activate one publisher. Renders nothing for a retired one. */
export default function PublisherStatusActions({ publisher, onChanged }) {
  const toast = useToast();

  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function changeReason(_name, value) {
    setReason(value);
    setError(null);
  }

  async function changeStatus(nextStatus, nextReason) {
    setSaving(true);
    setError(null);
    try {
      const updated = await setPublisherStatus(publisher.id, nextStatus, nextReason);
      setReason('');
      onChanged(updated);
      toast.saved(nextStatus === 'ACTIVE' ? 'Publisher activated.' : 'Publisher suspended.');
    } catch (failure) {
      toast.failed(failure);
    } finally {
      setSaving(false);
    }
  }

  function handleSuspend() {
    const trimmed = reason.trim();
    if (trimmed.length > 500) {
      setError('A reason can be at most 500 characters.');
      return;
    }
    changeStatus('SUSPENDED', trimmed || null);
  }

  function handleActivate() {
    changeStatus('ACTIVE', null);
  }

  if (publisher.status === 'ACTIVE') {
    return (
      <>
        <TextField
          label="Reason for suspending (optional)"
          name="reason"
          value={reason}
          onChange={changeReason}
          error={error}
          disabled={saving}
        />
        <button type="button" className="btn" onClick={handleSuspend} disabled={saving}>
          {saving ? 'Suspending...' : 'Suspend'}
        </button>
      </>
    );
  }

  if (publisher.status === 'SUSPENDED') {
    return (
      <button type="button" className="btn" onClick={handleActivate} disabled={saving}>
        {saving ? 'Activating...' : 'Activate'}
      </button>
    );
  }

  return null;
}
