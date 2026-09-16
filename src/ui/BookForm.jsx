import { useRef, useState } from 'react';
import FormActions from './FormActions.jsx';
import BookCollectionPicker from './BookCollectionPicker.jsx';
import PendingAssetSection from './PendingAssetSection.jsx';
import ContentUploadPanel from './ContentUploadPanel.jsx';
import CoverUploadPanel from './CoverUploadPanel.jsx';
import PublisherField from './PublisherField.jsx';
import BookFormField from './BookFormField.jsx';
import {
  createCatalogueItem,
  updateCatalogueItem,
  uploadCatalogueItemContent,
  uploadCatalogueItemCover,
} from '../api/catalogueItems.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { useBeforeUnloadWarning } from './useBeforeUnloadWarning.js';
import { useDraftForm } from './useDraftForm.js';
import { usePublisherOptions } from './usePublisherOptions.js';
import { FIELDS, toFormState, validate, buildPayload, isIsbnLocked } from './bookFormFields.js';

const IMPRINT_FIELDS = FIELDS.filter((field) => field.section === 'imprint');
const BIBLIOGRAPHIC_FIELDS = FIELDS.filter((field) => field.section === 'bibliographic');

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
  const { user } = useAuth();
  const isEditing = Boolean(initialItem?.id);
  const isbnLocked = isEditing && isIsbnLocked(initialItem);

  // A reload mid-fill restores from here instead of coming back blank - see useDraftForm.js.
  // Only for create: an edit's data already comes from the server, so there's nothing to draft
  // and nothing this key should ever hold while editing.
  const [form, setForm, clearDraft] = useDraftForm(!isEditing, () => {
    const initial = toFormState(initialItem);
    // A PUBLISHER_ADMIN can only ever create/edit their own publisher's items, so this fills
    // itself in rather than asking them to find and type their own id - see PublisherField.
    if (!isEditing && user.role === 'PUBLISHER_ADMIN') initial.publisherId = user.scopePublisherId;
    return initial;
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // A PUBLISHER_ADMIN's picker is locked to their own scope and never shows this list, so this
  // skips the request entirely for that role.
  const publisherOptions = usePublisherOptions(user.role === 'SUPER_ADMIN');
  // Captured once, from the form's own starting values (a restored draft counts as "starting",
  // not "changed") - compared against on every render to decide whether the beforeunload guard
  // below should fire. Recomputing the JSON string each render is wasted work, not wrong work:
  // this form is small enough that it doesn't matter.
  const initialFormSnapshot = useRef(JSON.stringify(form)).current;
  // True from the moment publisherId changes until BookCollectionPicker's own prune has run
  // against it. Submit must stay blocked for that whole stretch - Save clicked before it
  // settles would still send whatever collection id was picked under the previous publisher.
  const [collectionsBusy, setCollectionsBusy] = useState(false);
  // Only ever set on create (PendingAssetSection doesn't render once isEditing), and sent
  // right after the create call returns an id — there is nowhere to upload either to before
  // that.
  const [stagedContent, setStagedContent] = useState(null);
  const [stagedCover, setStagedCover] = useState(null);

  // Typed metadata is already protected by useDraftForm's autosave above - this guard is for
  // what that can't cover: a staged file (never persistable across a reload) or a save/upload
  // already in flight. Cleared automatically once nothing has changed from what the form
  // started with, so closing an untouched or already-saved form never prompts.
  const isDirty =
    JSON.stringify(form) !== initialFormSnapshot || Boolean(stagedContent) || Boolean(stagedCover);
  useBeforeUnloadWarning(isDirty || saving);

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
      if (!isEditing) clearDraft();
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

  function handleCancel() {
    if (!isEditing) clearDraft();
    onCancel();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="drawer-section">
        <h3 className="drawer-section-title">Imprint &amp; rights</h3>
        <PublisherField
          user={user}
          form={form}
          errors={errors}
          saving={saving}
          publisherOptions={publisherOptions}
          onChange={change}
        />
        <div className="field-grid-2">
          {IMPRINT_FIELDS.map((field) => (
            <BookFormField key={field.name} field={field} {...fieldProps} />
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
          <BookFormField key={field.name} field={field} {...fieldProps} />
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
          onCancel={handleCancel}
          saving={saving}
          disabled={collectionsBusy}
          saveLabel={isEditing ? 'Save' : 'Create'}
        />
      </div>
    </form>
  );
}
