import { Link, useNavigate, useParams } from 'react-router-dom';
import InstitutionForm from './InstitutionForm.jsx';
import { useRecord } from './useRecord.js';
import RecordLoadState from '../ui/RecordLoadState.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { createInstitution, getInstitution, updateInstitution } from '../api/institution.js';

/**
 * Create or edit one institution, at its own address.
 *
 * `/institutions/new` creates. `/institutions/:institutionId/edit` edits, and fetches the
 * institution itself rather than being handed a row, so a reload or a pasted link works.
 */
export default function InstitutionFormScreen() {
  const { institutionId } = useParams();
  const editing = institutionId !== undefined;
  const navigate = useNavigate();
  const toast = useToast();
  const { record, loading, error, reload } = useRecord(getInstitution, institutionId);

  // Rethrown, not swallowed: InstitutionForm turns a taken code into a message on the code
  // field, and re-enables itself either way.
  async function handleSubmit(payload) {
    try {
      if (editing) await updateInstitution(institutionId, payload);
      else await createInstitution(payload);
      toast.saved();
      navigate('/institutions');
    } catch (failure) {
      toast.failed(failure);
      throw failure;
    }
  }

  if (editing && (loading || error)) {
    return (
      <RecordLoadState
        loading={loading}
        error={error}
        onRetry={reload}
        backTo="/institutions"
        backLabel="Back to institutions"
      />
    );
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="row-buttons">
          <Link className="btn" to="/institutions">
            Back to institutions
          </Link>
        </div>
        <h1>{editing ? 'Edit institution' : 'New institution'}</h1>
      </section>

      <InstitutionForm
        initial={record}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/institutions')}
      />
    </div>
  );
}
