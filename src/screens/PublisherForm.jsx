import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';
import Icon from '../ui/Icon.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { ErrorCode } from '../api/errors.js';
import { createPublisher, updatePublisher } from '../api/publishers.js';

// Matches the contract's own pattern for a publisher code (wokay-api.yaml,
// PublisherWrite.code): lowercase letters, digits and hyphens, 2–40 characters. Checked here
// too, not just left to the server, so a bad code is a field message before Create is even
// clicked rather than a round trip that comes back as a trace id.
const CODE_PATTERN = /^[a-z0-9-]{2,40}$/;

function validatePublisherForm(values) {
  const found = {};
  const trimmedCode = values.code.trim();
  if (!trimmedCode) found.code = 'Enter a code.';
  else if (!CODE_PATTERN.test(trimmedCode)) {
    found.code = 'Code must be lowercase letters, digits and hyphens, 2–40 characters.';
  }
  if (!values.name.trim()) found.name = 'Enter a name.';
  else if (values.name.trim().length > 200) {
    found.name = 'A name can be at most 200 characters.';
  }
  if (values.description.trim().length > 1000) {
    found.description = 'A description can be at most 1000 characters.';
  }
  if (values.logoUrl.trim() && !values.logoUrl.includes('://')) {
    found.logoUrl = 'Enter a full address, including https://';
  }
  return found;
}

/**
 * Create and edit share this form. A null publisher means create.
 *
 * Rendered through PublishersScreen's own `<Outlet/>` (see App.jsx's nested `/publishers`
 * routes), not in place of it — the address is still real (create at /publishers/new, edit at
 * /publishers/:publisherId/edit), but the list stays mounted underneath, so `.modal-backdrop`
 * dims and blurs the real table, matching Stitch's own modal instead of a form floating in an
 * empty page.
 *
 * That same persistence is why this reloads the list itself on unmount: before the list
 * stayed mounted, returning to /publishers was always a fresh PublishersScreen, which fetched
 * fresh for free. Now it's the same PublishersScreen the whole time, so a status edit that
 * landed on the server would otherwise go on showing the row's old status until a manual
 * reload. Runs on unmount rather than only after a save so Cancel and the close button
 * reload it too — harmless (the same filters, re-asked), and one rule instead of several call
 * sites to keep in sync.
 */
// eslint-disable-next-line complexity
export default function PublisherForm({ publisher = null, onSaved, onCancel }) {
  const editing = publisher !== null;
  const toast = useToast();
  const navigate = useNavigate();
  const { reload: reloadList } = useOutletContext() ?? {};

  const [form, setForm] = useState({
    code: publisher?.code?.toLowerCase() ?? '',
    name: publisher?.name ?? '',
    description: publisher?.description ?? '',
    logoUrl: publisher?.logoUrl ?? '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => () => reloadList?.(), [reloadList]);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  // Publisher codes are sent to the backend lowercase, matching CODE_PATTERN above — any
  // character that pattern would reject (a space, an underscore, an uppercase letter typed
  // and not just auto-capitalised by a mobile keyboard) is dropped as it's typed, rather than
  // kept on screen and only rejected later at Create.
  function changeCode(name, value) {
    change(name, value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }

  // Optional fields are left out rather than sent empty: logoUrl is a uri in the contract.
  function buildWrite() {
    const write = { code: form.code.trim(), name: form.name.trim() };
    if (form.description.trim()) write.description = form.description.trim();
    if (form.logoUrl.trim()) write.logoUrl = form.logoUrl.trim();
    return write;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validatePublisherForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        const updated = await updatePublisher(publisher.id, buildWrite());
        toast.saved('Publisher saved.');
        onSaved(updated);
      } else {
        const created = await createPublisher(buildWrite());
        toast.saved('Publisher created.');
        navigate(`/publishers/${created.id}`, { replace: true });
      }
    } catch (failure) {
      if (failure.code === ErrorCode.CODE_TAKEN) {
        setErrors({ code: failure.friendly });
      } else {
        toast.failed(failure);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (editing) onCancel();
    else navigate('/publishers');
  }

  // The logo preview chip mirrors the row avatar on the publishers list: initials from the
  // code, since a code is always present and a name is neither guaranteed nor bounded.
  const previewInitials = (form.code || form.name).slice(0, 2).toUpperCase();

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="publisher-form-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title" id="publisher-form-title">
            {editing ? 'Edit publisher' : 'New publisher'}
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Cancel and go back"
            onClick={handleCancel}
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate aria-labelledby="publisher-form-title">
          <div className="modal-body">
            <div className="field-grid-2">
              <TextField
                label="Code"
                name="code"
                value={form.code}
                onChange={changeCode}
                error={errors.code}
                placeholder="rtlg"
                disabled={saving || editing}
                required
                autoFocus
                hint={editing ? undefined : 'Lowercase letters, digits and hyphens only.'}
              />
              <TextField
                label="Name"
                name="name"
                value={form.name}
                onChange={change}
                error={errors.name}
                placeholder="Routledge"
                disabled={saving}
                required
              />
            </div>
            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={change}
              error={errors.description}
              disabled={saving}
              multiline
              rows={3}
              maxLength={1000}
              hint={`${form.description.length} / 1000`}
            />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Logo address"
                  name="logoUrl"
                  value={form.logoUrl}
                  onChange={change}
                  error={errors.logoUrl}
                  placeholder="https://cdn.tf/logos/routledge.png"
                  disabled={saving}
                />
              </div>
              <span
                className="table-entity-avatar"
                aria-hidden="true"
                style={{ marginTop: 28 }}
              >
                {previewInitials}
              </span>
            </div>
            <p className="muted small">
              Suspending or delisting a publisher immediately pauses catalogue distribution
              across every institution&rsquo;s feed.
            </p>
          </div>

          <div className="modal-footer">
            <FormActions
              onCancel={handleCancel}
              saving={saving}
              saveLabel={editing ? 'Save changes' : 'Create publisher'}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
