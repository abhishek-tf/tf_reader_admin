import { useAuth } from '../auth/AuthContext.jsx';
import PublisherCatalogueScreen from './PublisherCatalogueScreen.jsx';
import MyPublisherScreen from './MyPublisherScreen.jsx';

/**
 * One route, two entirely different screens, same split as DashboardScreen and
 * EntitlementsScreen: a SUPER_ADMIN browses every publisher; a PUBLISHER_ADMIN has exactly one,
 * so they get a page built for that instead of a catalogue table scaled down to one row — and,
 * not incidentally, one with no "New publisher" button, since creating a second publisher isn't
 * something this role can do.
 */
export default function PublishersScreen() {
  const { user } = useAuth();

  if (user.role === 'PUBLISHER_ADMIN') {
    return <MyPublisherScreen publisherId={user.scopePublisherId} />;
  }
  return <PublisherCatalogueScreen />;
}
