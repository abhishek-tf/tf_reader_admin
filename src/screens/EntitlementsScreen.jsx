import { useAuth } from '../auth/AuthContext.jsx';
import InstitutionCatalogueBrowser from '../ui/InstitutionCatalogueBrowser.jsx';
import EntitlementsAdminScreen from './EntitlementsAdminScreen.jsx';
import NotFound from './NotFound.jsx';

/**
 * One route, two entirely different screens, per InstituteEntilimentFlow.md.
 *
 * An institution admin browses their own catalogue and requests access. A super admin sees
 * every institution's full entitlement ledger — every grant regardless of status, not just
 * pending ones — and can approve, reject, amend, revoke, or grant a new one. A publisher admin
 * has no business here at all — the side menu already hides this entry for them, but a direct
 * URL visit still needs to land somewhere other than a blank screen.
 */
export default function EntitlementsScreen() {
  const { user } = useAuth();

  if (user.role === 'INSTITUTION_ADMIN') {
    return <InstitutionCatalogueBrowser institutionId={user.scopeInstitutionId} />;
  }
  if (user.role === 'SUPER_ADMIN') {
    return <EntitlementsAdminScreen />;
  }
  return <NotFound />;
}
