import { useState } from 'react';
import DataTable from '../ui/DataTable.jsx';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import FormActions from '../ui/FormActions.jsx';
import { useToast } from '../ui/ToastContext.jsx';

/**
 * Not a real screen. This is the proof that the frame works.
 *
 * The task's definition of done was: the console runs, a signed-out visitor is sent to the
 * login page, a sample table with fake rows renders with a working empty state, and a sample
 * form validates and shows an error. The first two are the router and the guard. The last
 * two are here, with buttons so they can be checked by hand in a browser.
 *
 * Delete this file the day the first real screen lands.
 */

// Fake rows. Shaped like a real catalogue item so the table is exercised the way it will be
// used: an enum that needs a badge, a nullable field, a number to sort.
const FAKE_ROWS = [
  { id: 'item_42', title: 'Rights for Robots', tier: 'ELITE', pages: 212, isbn: '9780367211745' },
  {
    id: 'item_ab6',
    title: 'Ethnographies of Waiting',
    tier: 'OPEN_ACCESS',
    pages: 264,
    isbn: null,
  },
  {
    id: 'item_77',
    title: 'Listening to Law',
    tier: 'SUBSCRIPTION',
    pages: 0,
    isbn: '9781032118420',
  },
];

const TIER_LABEL = {
  OPEN_ACCESS: 'Free to read',
  SUBSCRIPTION: 'Included',
  ELITE: 'Limited copies',
};

// The real AccessTier enum. Three values, and the API accepts only these.
const TIER_OPTIONS = [
  { value: 'OPEN_ACCESS', label: 'Open access' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'ELITE', label: 'Elite' },
];

const COLUMNS = [
  { key: 'title', label: 'Title', sortable: true },
  {
    key: 'tier',
    label: 'Tier',
    sortable: true,
    render: (row) => <span className={`badge badge-${row.tier}`}>{TIER_LABEL[row.tier]}</span>,
  },
  { key: 'pages', label: 'Pages', sortable: true, render: (row) => row.pages || '—' },
  { key: 'isbn', label: 'ISBN' },
];

export default function FrameCheck() {
  const toast = useToast();

  const [tableState, setTableState] = useState('rows');
  const [form, setForm] = useState({ title: '', tier: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  function validate() {
    const found = {};
    if (!form.title.trim()) found.title = 'Enter a title.';
    else if (form.title.trim().length < 3) found.title = 'A title needs at least 3 characters.';
    if (!form.tier) found.tier = 'Choose a tier.';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      // No endpoint to call yet. The pause stands in for a request so the disabled state on
      // the save button can actually be seen.
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      toast.saved('Saved. Nothing was sent, there is no endpoint yet.');
      setForm({ title: '', tier: '' });
    } finally {
      setSaving(false);
    }
  }

  const fakeError = {
    friendly: 'Could not load the list.',
    traceId: 'b7c1f2a9',
  };

  return (
    <div className="stack">
      <section className="card">
        <h1>Frame check</h1>
        <p className="muted">
          Not a real screen. It exists so the table, the form and the messages can be checked by
          hand. It goes when the first real screen arrives.
        </p>
      </section>

      <section className="card">
        <h2>Table</h2>
        <p className="muted">Click a heading to sort. Use the buttons to see the other states.</p>
        <div className="row-buttons">
          {['rows', 'loading', 'empty', 'error'].map((state) => (
            <button
              key={state}
              type="button"
              className={tableState === state ? 'btn btn-primary' : 'btn'}
              onClick={() => setTableState(state)}
            >
              {state}
            </button>
          ))}
        </div>
        <DataTable
          columns={COLUMNS}
          rows={tableState === 'rows' ? FAKE_ROWS : []}
          loading={tableState === 'loading'}
          error={tableState === 'error' ? fakeError : null}
          emptyMessage="No books yet. Add one to see it here."
          onRetry={() => setTableState('rows')}
        />
      </section>

      <section className="card">
        <h2>Form</h2>
        <p className="muted">Press Save with the fields empty to see validation.</p>
        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={change}
            error={errors.title}
            placeholder="Rights for Robots"
            disabled={saving}
          />
          <SelectField
            label="Tier"
            name="tier"
            value={form.tier}
            onChange={change}
            options={TIER_OPTIONS}
            error={errors.tier}
            placeholder="Choose a tier"
            disabled={saving}
          />
          <FormActions onCancel={() => setForm({ title: '', tier: '' })} saving={saving} />
        </form>
      </section>

      <section className="card">
        <h2>Messages</h2>
        <div className="row-buttons">
          <button type="button" className="btn" onClick={() => toast.saved()}>
            Show saved
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => toast.failed({ friendly: 'That failed.', traceId: 'b7c1f2a9' })}
          >
            Show failed
          </button>
        </div>
        <p className="muted small">
          A success message clears itself after four seconds. A failure stays until dismissed,
          because it carries the trace id somebody needs for a bug report.
        </p>
      </section>
    </div>
  );
}
