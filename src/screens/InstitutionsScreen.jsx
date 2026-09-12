import { useAuth } from '../auth/AuthContext.jsx';
import InstitutionCatalogueScreen from './InstitutionCatalogueScreen.jsx';
import MyInstitutionScreen from './MyInstitutionScreen.jsx';

/**
 * One route, two entirely different screens, same split as DashboardScreen and
 * EntitlementsScreen: a SUPER_ADMIN browses every institution; an INSTITUTION_ADMIN has exactly
 * one, so they get a page built for that instead of a catalogue table scaled down to one row —
 * and, not incidentally, one with no "Create institution" button, since creating a second
 * institution isn't something this role can do.
 */
export default function InstitutionsScreen() {
  const { user } = useAuth();

  if (user.role === 'INSTITUTION_ADMIN') {
    return <MyInstitutionScreen institutionId={user.scopeInstitutionId} />;
  }
  return <InstitutionCatalogueScreen />;
}
