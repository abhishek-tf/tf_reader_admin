import { useAuth } from '../auth/AuthContext.jsx';
import InstitutionEntitlementsScreen from './InstitutionEntitlementsScreen.jsx';
import EntitlementsAdminScreen from './EntitlementsAdminScreen.jsx';
import NotFound from './NotFound.jsx';

/**
 * One route, two entirely different screens.
 *
 * An institution admin sees their own entitlements, the items those grants resolve to, and can
 * request access to a book, collection, or publisher. A super admin sees every institution's
 * full entitlement ledger — every grant regardless of status, not just pending ones — and can
 * approve, reject, amend, revoke, or grant a new one. A publisher admin has no business here at
 * all — the side menu already hides this entry for them, but a direct URL visit still needs to
 * land somewhere other than a blank screen.
 */
export default function EntitlementsScreen() {
  const { user } = useAuth();

  if (user.role === 'INSTITUTION_ADMIN') {
    return <InstitutionEntitlementsScreen institutionId={user.scopeInstitutionId} />;
  }
  if (user.role === 'SUPER_ADMIN') {
    return <EntitlementsAdminScreen />;
  }
  return <NotFound />;
}
