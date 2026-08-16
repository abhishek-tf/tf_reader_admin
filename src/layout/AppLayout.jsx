import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import SideMenu from './SideMenu.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

/**
 * Header across the top, side menu on the left, content on the right.
 *
 * Rendered once and kept mounted while the routes change underneath, so the menu does not
 * flash on every navigation. `Outlet` is where react-router puts the current page.
 */
export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="shell">
      <Header />
      <div className="body">
        <SideMenu role={user?.role} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
