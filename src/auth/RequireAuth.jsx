import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import NotAuthorized from '../screens/NotAuthorized.jsx';

/**
 * The auth guard. Wraps every page that needs a signed-in operator.
 *
 * A signed-out visitor is sent to /login, and we remember where they were trying to go so
 * the login screen can send them back there afterwards. Without that, signing in always
 * dumps you on the dashboard and you lose your place.
 *
 * `replace` matters: without it the back button returns to the guarded page, which bounces
 * straight back to login and traps the user in a loop.
 *
 * `roles` is optional. Leave it off and this only checks that somebody is signed in, exactly
 * as before. Pass it and a signed-in operator whose role is not in the list gets NotAuthorized
 * rendered in place rather than sent somewhere else — redirecting to another protected route
 * just relocates the problem, and could land on a route that role cannot use either.
 */
export default function RequireAuth({ children, roles }) {
  const { user, signedIn, restoring } = useAuth();
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

  if (roles && !roles.includes(user.role)) {
    return <NotAuthorized />;
  }

  return children;
}
