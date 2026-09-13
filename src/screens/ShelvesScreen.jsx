import { useEffect, useState } from 'react';
import FormActions from '../ui/FormActions.jsx';
import ShelfFields from '../ui/ShelfFields.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { ShelvesDecoration } from '../ui/pageDecorations.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { getFeedSettings, setFeedSettings } from '../api/feedSettings.js';
import { listInstitutions } from '../api/institution.js';
import { toFormState, validate, buildPayload } from '../ui/shelfFormFields.js';
import { ShelfContextBar, FeedParametersCard } from './ShelfContextCards.jsx';
import ShelfInstitutionChooser from '../ui/ShelfInstitutionChooser.jsx';

const FORM_ID = 'shelves-form';

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
        <Card>
          <p className="muted">Choose an institution above to curate its shelves.</p>
        </Card>
      );
    }
    if (feed.loading) {
      return (
        <Card>
          <p className="muted">Loading...</p>
        </Card>
      );
    }
    if (feed.error) {
      return (
        <Card>
          <p className="field-error">{feed.error.friendly}</p>
          {feed.error.traceId ? <p className="trace">Trace {feed.error.traceId}</p> : null}
          <button type="button" className="btn" onClick={() => loadFeedSettings(institutionId)}>
            Try again
          </button>
        </Card>
      );
    }
    if (!feed.form) return null;

    return (
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="stack">
        <FeedParametersCard
          feed={feed}
          errors={errors}
          changeFeedField={changeFeedField}
          saving={saving}
        />

        <div className="detail-section-title">
          <h2>Curated institutional shelves</h2>
          <span className="muted small">
            Exactly 3 fixed slots &middot; max 50 entitled books per shelf &middot; hidden when
            empty
          </span>
        </div>

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

        <Card>
          <FormActions
            onCancel={() => loadFeedSettings(institutionId)}
            saving={saving}
            saveLabel="Save shelves"
            cancelLabel="Discard changes"
          />
        </Card>
      </form>
    );
  }

  const header = (
    <PageHeader
      title="Feed settings & shelves"
      subtitle="Configure reader feed parameters and curate the 3 fixed institutional shelves."
      decoration={<ShelvesDecoration />}
      actions={
        institutionId && feed.form ? (
          <Button type="submit" form={FORM_ID} variant="primary" icon="save" disabled={saving}>
            {saving ? 'Saving...' : 'Save feed settings'}
          </Button>
        ) : null
      }
    />
  );

  // A super admin who has not picked an institution yet gets one focused chooser card, not
  // the context bar (nothing to show yet: no catalogueVersion, no optimistic version) sitting
  // above a second, equally empty "choose one above" card.
  if (!isInstitutionAdmin && !institutionId) {
    return (
      <div className="stack">
        {header}
        <ShelfInstitutionChooser
          institutionPicker={institutionPicker}
          setInstitutionPicker={setInstitutionPicker}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      {header}

      <ShelfContextBar
        isInstitutionAdmin={isInstitutionAdmin}
        institutionPicker={institutionPicker}
        setInstitutionPicker={setInstitutionPicker}
        feed={feed}
      />

      {renderBody()}
    </div>
  );
}
