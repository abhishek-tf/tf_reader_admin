import { useAuth } from '../auth/AuthContext.jsx';
import SuperAdminDashboard from './SuperAdminDashboard.jsx';
import PublisherAdminDashboard from './PublisherAdminDashboard.jsx';
import InstitutionAdminDashboard from './InstitutionAdminDashboard.jsx';

/**
 * One route, three entirely different dashboards, same as EntitlementsScreen's own role split.
 *
 * There is no cross-scope aggregate anywhere on this page: each role gets its own screen,
 * built from its own real, already-scoped API calls, and never sees another scope's numbers
 * even added together into one total.
 */
export default function DashboardScreen() {
  const { user } = useAuth();

  if (user.role === 'PUBLISHER_ADMIN') {
    return <PublisherAdminDashboard publisherId={user.scopePublisherId} />;
  }
  if (user.role === 'INSTITUTION_ADMIN') {
    return <InstitutionAdminDashboard institutionId={user.scopeInstitutionId} />;
  }
  return <SuperAdminDashboard />;
}
