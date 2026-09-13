import { useState } from 'react';
import TextField from './TextField.jsx';
import SelectField from './SelectField.jsx';
import FormActions from './FormActions.jsx';
import BookCollectionPicker from './BookCollectionPicker.jsx';
import PendingAssetSection from './PendingAssetSection.jsx';
import ContentUploadPanel from './ContentUploadPanel.jsx';
import CoverUploadPanel from './CoverUploadPanel.jsx';
import {
  createCatalogueItem,
  updateCatalogueItem,
  uploadCatalogueItemContent,
  uploadCatalogueItemCover,
} from '../api/catalogueItems.js';
import { useToast } from './ToastContext.jsx';
import { FIELDS, toFormState, validate, buildPayload, isIsbnLocked } from './bookFormFields.js';

const IMPRINT_FIELDS = FIELDS.filter((field) => field.section === 'imprint');
const BIBLIOGRAPHIC_FIELDS = FIELDS.filter((field) => field.section === 'bibliographic');
const PUBLISHER_FIELD = IMPRINT_FIELDS.find((field) => field.name === 'publisherId');
const TIER_FIELDS = IMPRINT_FIELDS.filter((field) => field.name !== 'publisherId');

function Field({ field, form, errors, saving, isbnLocked, onChange }) {
  if (field.showIf && !field.showIf(form)) return null;

  const required =
    typeof field.required === 'function' ? field.required(form) : Boolean(field.required);

  const shared = {
    label: field.label,
    name: field.name,
    value: form[field.name],
    onChange,
    error: errors[field.name],
    disabled: saving || (field.lockOnceSet && isbnLocked),
    required,
    compact: true,
  };

  if (field.kind === 'select') {
    return <SelectField {...shared} options={field.options} />;
  }
  return (
    <TextField
      {...shared}
      type={field.inputType}
      placeholder={field.placeholder}
      hint={field.hint}
      multiline={field.multiline}
      maxLength={field.maxLength}
    />
  );
}

/**
 * Create and edit, in one form. `initialItem` is null for create, or the row from the list
 * for edit — the list response already carries every field this form needs, so there is no
 * separate fetch before editing.
 *
 * Rendered inside BookFormScreen's drawer-shaped chrome, grouped into the same sections
 * Stitch's "Create & Ingest Book" drawer uses — "Imprint & rights" (publisher, its
 * collections, format and tier), "Bibliographic metadata" (everything else), and, on create
 * only, "Content and cover" (`PendingAssetSection`) — via each FIELDS entry's own `section`,
 * not a second copy of the field list.
 */
export default function BookForm({ initialItem, onSaved, onCancel }) {
  const toast = useToast();
  const isEditing = Boolean(initialItem?.id);
  const isbnLocked = isEditing && isIsbnLocked(initialItem);

  const [form, setForm] = useState(() => toFormState(initialItem));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // True from the moment publisherId changes until BookCollectionPicker's own prune has run
  // against it. Submit must stay blocked for that whole stretch - Save clicked before it
  // settles would still send whatever collection id was picked under the previous publisher.
  const [collectionsBusy, setCollectionsBusy] = useState(false);
  // Only ever set on create (PendingAssetSection doesn't render once isEditing), and sent
  // right after the create call returns an id — there is nowhere to upload either to before
  // that.
  const [stagedContent, setStagedContent] = useState(null);
  const [stagedCover, setStagedCover] = useState(null);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  // Best-effort: a failed upload here does not undo the book that was just created, the same
  // way a failed upload from the real ContentUploadPanel/CoverUploadPanel never has. It just
  // toasts, and the operator retries from the upload panels this same screen shows next.
  //
  // Returns the item to actually hand onward, folding in what each upload answered — the
  // ingest status's contentState/contentError/updatedAt for content, the whole refreshed item
  // for a cover — rather than the pre-upload `saved`. Without this, the upload panels this
  // screen shows immediately after would open already stale: still reading "no content yet"
  // against an item that, a moment ago, was already sent for ingest.
  async function uploadStagedAssets(saved) {
    let latest = saved;
    if (stagedContent) {
      try {
        const status = await uploadCatalogueItemContent(saved.id, stagedContent, saved.contentType);
        latest = {
          ...latest,
          contentState: status.contentState,
          contentError: status.contentError,
          updatedAt: status.updatedAt,
        };
      } catch (uploadError) {
        toast.failed(uploadError);
      }
    }
    if (stagedCover) {
      try {
        const refreshed = await uploadCatalogueItemCover(saved.id, stagedCover);
        latest = { ...latest, ...refreshed };
      } catch (uploadError) {
        toast.failed(uploadError);
      }
    }
    return latest;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Belt and suspenders alongside FormActions' own disabled state: the button being
    // disabled is what an operator actually sees, this is what stops a submit that somehow
    // still fires while a publisher change is still being reconciled.
    if (collectionsBusy) return;

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const payload = buildPayload(form);
      const saved = isEditing
        ? await updateCatalogueItem(initialItem.id, payload)
        : await createCatalogueItem(payload);
      toast.saved(isEditing ? 'Book updated.' : 'Book created.');
      const finalSaved =
        !isEditing && (stagedContent || stagedCover) ? await uploadStagedAssets(saved) : saved;
      onSaved(finalSaved);
    } catch (error) {
      if (error.isValidation) {
        setErrors({
          form: error.traceId ? `${error.friendly} (trace ${error.traceId})` : error.friendly,
        });
      } else {
        toast.failed(error);
      }
    } finally {
      setSaving(false);
    }
  }

  const fieldProps = { form, errors, saving, isbnLocked, onChange: change };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="drawer-section">
        <h3 className="drawer-section-title">Imprint &amp; rights</h3>
        <Field field={PUBLISHER_FIELD} {...fieldProps} />
        <div className="field-grid-2">
          {TIER_FIELDS.map((field) => (
            <Field key={field.name} field={field} {...fieldProps} />
          ))}
        </div>
        <BookCollectionPicker
          publisherId={form.publisherId}
          collectionIds={form.collectionIds}
          onChange={(collectionIds) => change('collectionIds', collectionIds)}
          onBusyChange={setCollectionsBusy}
          disabled={saving}
        />
      </div>

      <div className="drawer-section">
        <h3 className="drawer-section-title">Bibliographic metadata</h3>
        {BIBLIOGRAPHIC_FIELDS.map((field) => (
          <Field key={field.name} field={field} {...fieldProps} />
        ))}
      </div>

      {!isEditing ? (
        <PendingAssetSection
          contentType={form.contentType}
          contentFile={stagedContent}
          coverFile={stagedCover}
          onChangeContent={setStagedContent}
          onChangeCover={setStagedCover}
          disabled={saving}
        />
      ) : null}

      {isEditing ? (
        <>
          <div className="drawer-section">
            <h3 className="drawer-section-title">Content file</h3>
            <ContentUploadPanel item={initialItem} />
          </div>

          <div className="drawer-section">
            <h3 className="drawer-section-title">Cover image</h3>
            <CoverUploadPanel item={initialItem} />
          </div>
        </>
      ) : null}

      <div className="drawer-footer" style={{ margin: '0 calc(-1 * var(--space-xl))' }}>
        <FormActions
          onCancel={onCancel}
          saving={saving}
          disabled={collectionsBusy}
          saveLabel={isEditing ? 'Save' : 'Create'}
        />
      </div>
    </form>
  );
}
