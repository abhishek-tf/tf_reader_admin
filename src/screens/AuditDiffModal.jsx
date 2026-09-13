import Modal from '../ui/Modal.jsx';
import { ACTION_LABEL, renderKeyValues } from './auditLogFields.jsx';

/** "View diff" — Stitch's own compact-row-plus-expandable-diff pattern for the audit table,
 * rather than three wide before/after/meta columns on every row. Same data the old inline
 * columns showed; just reached with one click instead of a very wide table. */
export default function AuditDiffModal({ row, onClose }) {
  return (
    <Modal
      open={row !== null}
      onClose={onClose}
      title={row ? `${ACTION_LABEL[row.action] ?? row.action} — ${row.entityType ?? 'record'}` : ''}
      width="wide"
    >
      {row ? (
        <div className="stack">
          <dl className="kv">
            <div className="kv-row">
              <dt className="kv-key">Date and time</dt>
              <dd className="kv-value">{new Date(row.at).toLocaleString()}</dd>
            </div>
            <div className="kv-row">
              <dt className="kv-key">Actor</dt>
              <dd className="kv-value">{row.actorEmail ?? row.actorId ?? '—'}</dd>
            </div>
            <div className="kv-row">
              <dt className="kv-key">Entity ID</dt>
              <dd className="kv-value trace">{row.entityId ?? '—'}</dd>
            </div>
          </dl>
          <div>
            <p className="field-label field-label-compact">Before</p>
            {renderKeyValues(row.before)}
          </div>
          <div>
            <p className="field-label field-label-compact">After</p>
            {renderKeyValues(row.after)}
          </div>
          <div>
            <p className="field-label field-label-compact">Metadata</p>
            {renderKeyValues(row.meta)}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
