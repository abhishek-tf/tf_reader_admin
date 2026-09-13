import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import OperatorForm from './OperatorForm.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { createAdminUser, updateAdminUser } from '../api/adminUsers.js';

/**
 * Create or edit one console operator, at its own address, rendered as OperatorForm's own
 * modal overlay through OperatorsAuditScreen's `<Outlet/>` (see App.jsx's nested `/operators`
 * routes) — the operator list stays mounted and blurred behind it.
 *
 * The operator being edited is handed over in the link's state, because **there is no
 * GET /admin-users/{id} in the contract** — list, create, update and deactivate are the whole
 * admin user surface. So unlike the other edit screens this one cannot fetch its own record,
 * and arriving without that state (a reload, or a pasted link) goes back to the list rather
 * than guessing. Adding an endpoint, or scanning the list to fake one, would both be worse.
 */
export default function OperatorFormScreen() {
  const { adminUserId } = useParams();
  const editing = adminUserId !== undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const operator = location.state?.operator ?? null;

  // Rethrown, not swallowed: OperatorForm turns a taken email into a message on the email
  // field, and re-enables itself either way.
  async function handleSubmit(payload) {
    try {
      if (editing) {
        await updateAdminUser(adminUserId, payload);
        toast.saved('Operator saved.');
      } else {
        await createAdminUser(payload);
        toast.saved('Operator created.');
      }
      navigate('/operators');
    } catch (failure) {
      toast.failed(failure);
      throw failure;
    }
  }

  if (editing && !operator) {
    return <Navigate to="/operators" replace />;
  }

  return (
    <OperatorForm
      initial={operator}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/operators')}
    />
  );
}
