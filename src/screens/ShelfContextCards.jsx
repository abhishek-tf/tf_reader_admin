import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import Card from '../ui/Card.jsx';
import Icon from '../ui/Icon.jsx';
import { SORT_OPTIONS } from '../ui/shelfFormFields.js';

/** The institution picker plus the catalogueVersion/optimistic-version chips — Stitch's
 * "Institution Context & Optimistic Locking Bar", above the shelf cards. */
export function ShelfContextBar({
  isInstitutionAdmin,
  institutionPicker,
  setInstitutionPicker,
  feed,
}) {
  return (
    <Card>
      <div className="shelf-context-bar">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            flexWrap: 'wrap',
          }}
        >
          {!isInstitutionAdmin ? (
            <SelectField
              label="Institution"
              name="institutionId"
              compact
              value={institutionPicker.selectedId}
              onChange={(_name, value) =>
                setInstitutionPicker((c) => ({ ...c, selectedId: value }))
              }
              options={institutionPicker.list.map((inst) => ({ value: inst.id, label: inst.name }))}
              placeholder="Choose an institution"
              disabled={institutionPicker.loading}
            />
          ) : null}
          {feed.data ? (
            <span className="shelf-context-chip">
              <Icon name="sync" />
              catalogueVersion:{' '}
              <code className="code-chip-plain">{feed.data.catalogueVersion}</code>
            </span>
          ) : null}
        </div>
        {feed.data ? (
          <span className="shelf-context-chip">
            <Icon name="lock" />
            Optimistic version: <code className="code-chip-plain">rev {feed.data.version}</code>
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/** Feed title / page size / default sort — Stitch's "Feed Parameters" card. */
export function FeedParametersCard({ feed, errors, changeFeedField, saving }) {
  return (
    <Card>
      <div className="detail-section-title">
        <h2>
          <Icon name="tune" style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Feed parameters
        </h2>
      </div>
      <div className="field-grid-3">
        <TextField
          label="Feed title"
          name="feedTitle"
          value={feed.form.feedTitle}
          onChange={changeFeedField}
          error={errors.feedTitle}
          maxLength={80}
          hint="1-80 characters"
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
          hint="1-100"
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
      </div>
    </Card>
  );
}
