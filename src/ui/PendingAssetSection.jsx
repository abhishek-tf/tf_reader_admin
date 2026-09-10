import Icon from './Icon.jsx';
import IngestStateBadge from './IngestStateBadge.jsx';

/**
 * The content file and cover picked before a book exists to upload them to — Stitch's own
 * "Create & Ingest" drawer lets both be chosen alongside the metadata, in the same form, so
 * this stages them the same way rather than making create pick metadata first and files
 * second. `onChangeContent`/`onChangeCover` just record the File objects; nothing is sent
 * until BookForm's own submit has a real item id to send it to.
 *
 * Deliberately the same two sections, same headings, same dropzone/cover-card markup as
 * ContentUploadPanel/CoverUploadPanel render once editing — down to the "Current state: None"
 * line, true of any book that doesn't exist yet either. The one difference neither section
 * can hide is what picking a file does next: edit's panels upload it immediately, because
 * they already have somewhere to send it; this can only hold onto it and say so, since the
 * book below hasn't been created yet.
 */
export default function PendingAssetSection({
  contentType,
  contentFile,
  coverFile,
  onChangeContent,
  onChangeCover,
  disabled,
}) {
  return (
    <>
      <div className="drawer-section">
        <h3 className="drawer-section-title">Content file</h3>
        <p className="muted">
          Current state: <IngestStateBadge state="NONE" />
        </p>

        <label className="upload-dropzone" htmlFor="staged-content-file">
          <Icon name="upload_file" style={{ fontSize: 28 }} />
          <span className="upload-dropzone-text">
            {contentFile ? (
              contentFile.name
            ) : (
              <>
                Drop a {contentType || 'content'} file here, or{' '}
                <span className="upload-dropzone-browse">browse</span>
              </>
            )}
          </span>
          <p className="muted small">
            Sent as {contentType || 'the chosen content type'}. Uploaded once the book is
            created.
          </p>
        </label>
        <input
          id="staged-content-file"
          type="file"
          className="file-input-hidden"
          disabled={disabled}
          onChange={(event) => onChangeContent(event.target.files?.[0] ?? null)}
        />
      </div>

      <div className="drawer-section">
        <h3 className="drawer-section-title">Cover image</h3>
        <div className="cover-upload-card">
          <div className="cover-upload-thumb">
            <Icon name="image" />
          </div>
          <div className="cover-upload-body">
            <span className="cover-upload-title">Upload cover image</span>
            <p className="muted small">JPEG, PNG or WebP, up to 5 MB.</p>
            <div className="cover-upload-choose">
              <label className="btn upload-choose-btn" htmlFor="staged-cover-file">
                Choose file
              </label>
              <input
                id="staged-cover-file"
                type="file"
                accept="image/*"
                className="file-input-hidden"
                disabled={disabled}
                onChange={(event) => onChangeCover(event.target.files?.[0] ?? null)}
              />
              <span className="muted small">{coverFile ? coverFile.name : 'No file chosen'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
