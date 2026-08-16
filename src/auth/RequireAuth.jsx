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
  const { signedIn } = useAuth();
  const location = useLocation();

  if (!signedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
