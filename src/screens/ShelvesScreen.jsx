import { useEffect, useState } from 'react';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import FormActions from '../ui/FormActions.jsx';
import ShelfFields from '../ui/ShelfFields.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { getFeedSettings, setFeedSettings } from '../api/feedSettings.js';
import { listInstitutions } from '../api/institution.js';
import { SORT_OPTIONS, toFormState, validate, buildPayload } from '../ui/shelfFormFields.js';

/**
 * Curate one institution's three fixed shelves against the feed-settings backend.
 *
 * An institution admin always edits their own institution, from `user.scopeInstitutionId`.
 * A super admin has no institution of their own, so they pick one first from a plain list —
 * kept local to this screen rather than reusing another screen's UI, since Institutions is
 * someone else's file.
 */
export default function ShelvesScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const isInstitutionAdmin = user.role === 'INSTITUTION_ADMIN';

  const [institutionPicker, setInstitutionPicker] = useState({
    list: [],
    loading: !isInstitutionAdmin,
    selectedId: '',
  });
  const [feed, setFeed] = useState({ data: null, form: null, loading: false, error: null });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const institutionId = isInstitutionAdmin ? user.scopeInstitutionId : institutionPicker.selectedId;

  useEffect(() => {
    if (isInstitutionAdmin) return;
    listInstitutions({ status: 'ACTIVE', size: 100 })
      .then((page) => setInstitutionPicker((c) => ({ ...c, list: page.items, loading: false })))
      .catch(() => setInstitutionPicker((c) => ({ ...c, loading: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; role never changes mid-session
  }, []);

  function loadFeedSettings(id, signal) {
    setFeed((c) => ({ ...c, loading: true, error: null }));
    return getFeedSettings(id, { signal })
      .then((data) => setFeed({ data, form: toFormState(data), loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setFeed((c) => ({ ...c, loading: false, error }));
      });
  }

  useEffect(() => {
    if (!institutionId) return;
    const controller = new AbortController();
    loadFeedSettings(institutionId, controller.signal);
    return () => controller.abort();
  }, [institutionId]);

  function changeFeedField(name, value) {
    setFeed((c) => ({ ...c, form: { ...c.form, [name]: value } }));
    setErrors((c) => (c[name] ? { ...c, [name]: undefined } : c));
  }

  function updateShelf(shelfId, field, value) {
    setFeed((c) => ({
      ...c,
      form: {
        ...c.form,
        shelves: c.form.shelves.map((shelf) =>
          shelf.id === shelfId ? { ...shelf, [field]: value } : shelf
        ),
      },
    }));
    const key = `${shelfId}-${field === 'title' ? 'title' : 'items'}`;
    setErrors((c) => (c[key] ? { ...c, [key]: undefined } : c));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(feed.form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const saved = await setFeedSettings(institutionId, buildPayload(feed.form));
      setFeed({ data: saved, form: toFormState(saved), loading: false, error: null });
      toast.saved('Shelves saved.');
    } catch (error) {
      if (error.isStale) {
        toast.failed(
          "Somebody saved changes while you were editing. We've reloaded the latest version — redo your changes and save again."
        );
        loadFeedSettings(institutionId);
      } else {
        toast.failed(error);
      }
    } finally {
      setSaving(false);
    }
  }

  function renderBody() {
    if (!institutionId) {
      return (
        <section className="card">
          <p className="muted">Choose an institution above to curate its shelves.</p>
        </section>
      );
    }
    if (feed.loading) {
      return (
        <section className="card">
          <p className="muted">Loading...</p>
        </section>
      );
    }
    if (feed.error) {
      return (
        <section className="card">
          <p className="field-error">{feed.error.friendly}</p>
          {feed.error.traceId ? <p className="trace">Trace {feed.error.traceId}</p> : null}
          <button type="button" className="btn" onClick={() => loadFeedSettings(institutionId)}>
            Try again
          </button>
        </section>
      );
    }
    if (!feed.form) return null;

    return (
      <form onSubmit={handleSubmit} noValidate>
        <section className="card">
          <h2>Feed</h2>
          <TextField
            label="Feed title"
            name="feedTitle"
            value={feed.form.feedTitle}
            onChange={changeFeedField}
            error={errors.feedTitle}
            maxLength={80}
            required
            disabled={saving}
          />
          <TextField
            label="Page size"
            name="pageSize"
            type="number"
            value={feed.form.pageSize}
            onChange={changeFeedField}
            error={errors.pageSize}
            required
            disabled={saving}
          />
          <SelectField
            label="Default sort"
            name="defaultSort"
            value={feed.form.defaultSort}
            onChange={changeFeedField}
            options={SORT_OPTIONS}
            placeholder="Contract default"
            disabled={saving}
          />
        </section>

        {feed.form.shelves.map((shelf) => (
          <ShelfFields
            key={shelf.id}
            institutionId={institutionId}
            shelf={shelf}
            titleError={errors[`${shelf.id}-title`]}
            itemsError={errors[`${shelf.id}-items`]}
            saving={saving}
            onChange={updateShelf}
          />
        ))}

        <section className="card">
          <FormActions
            onCancel={() => loadFeedSettings(institutionId)}
            saving={saving}
            saveLabel="Save shelves"
            cancelLabel="Discard changes"
          />
        </section>
      </form>
    );
  }

  return (
    <div className="stack">
      <section className="card">
        <h1>Shelves</h1>
        <p className="muted">Curate the three shelves an institution&apos;s readers see first.</p>
        {!isInstitutionAdmin ? (
          <SelectField
            label="Institution"
            name="institutionId"
            value={institutionPicker.selectedId}
            onChange={(_name, value) => setInstitutionPicker((c) => ({ ...c, selectedId: value }))}
            options={institutionPicker.list.map((inst) => ({ value: inst.id, label: inst.name }))}
            placeholder="Choose an institution"
            disabled={institutionPicker.loading}
          />
        ) : null}
      </section>

      {renderBody()}
    </div>
  );
}
