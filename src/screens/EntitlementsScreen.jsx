import { useAuth } from '../auth/AuthContext.jsx';
import InstitutionEntitlementsScreen from './InstitutionEntitlementsScreen.jsx';
import NotFound from './NotFound.jsx';

/**
 * An institution admin sees their own entitlements, the items those grants resolve to, and can
 * request access to a book, collection, or publisher. A super admin manages entitlements from
 * the Institution Detail page instead (one institution, one ledger, already in context), so a
 * super admin — or a publisher admin, who has no business here at all — landing on this route
 * directly gets sent to NotFound rather than a blank screen.
 */
export default function EntitlementsScreen() {
  const { user } = useAuth();

  if (user.role === 'INSTITUTION_ADMIN') {
    return <InstitutionEntitlementsScreen institutionId={user.scopeInstitutionId} />;
  }
  return <NotFound />;
}
