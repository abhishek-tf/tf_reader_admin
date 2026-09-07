import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { homeRouteForRole } from '../layout/SideMenu.jsx';

/**
 * Shown by RequireAuth when a signed-in operator's role is not on a route's allow-list.
 *
 * Reaching this always means a direct URL: the side menu never links to a route a role cannot
 * use. Not NotFound, on purpose — the address is real, the operator just is not allowed here,
 * and those are different problems to report.
 */
export default function NotAuthorized() {
  const { user } = useAuth();
  const home = user ? homeRouteForRole(user.role) : '/login';

  return (
    <div className="card">
      <p className="muted small">403</p>
      <h1>Not Authorized</h1>
      <p className="muted">You don&apos;t have permission to access this page.</p>
      <Link className="btn" to={home}>
        Go to Home
      </Link>
    </div>
  );
}
