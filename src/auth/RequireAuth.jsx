import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/**
 * The auth guard. Wraps every page that needs a signed-in operator.
 *
 * A signed-out visitor is sent to /login, and we remember where they were trying to go so
 * the login screen can send them back there afterwards. Without that, signing in always
 * dumps you on the dashboard and you lose your place.
 *
 * `replace` matters: without it the back button returns to the guarded page, which bounces
 * straight back to login and traps the user in a loop.
 */
export default function RequireAuth({ children }) {
  const { signedIn, restoring } = useAuth();
  const location = useLocation();

  // On a page load we do not yet know whether there is a session to restore. Redirecting
  // during that gap is what makes a reload flash the login screen and then jump away again,
  // so wait for the answer instead. It is one request, and usually invisible.
  if (restoring) {
    return <p className="muted">Checking your session...</p>;
  }

  if (!signedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
