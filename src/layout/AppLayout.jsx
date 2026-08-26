import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import SideMenu from './SideMenu.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

/**
 * Header across the top, side menu on the left, content on the right.
 *
 * Rendered once and kept mounted while the routes change underneath, so the menu does not
 * flash on every navigation. `Outlet` is where react-router puts the current page.
 *
 * Whether the menu is collapsed lives here rather than in SideMenu, because it changes the
 * width of both the menu and the content beside it, and this is the only component that
 * renders both. It is deliberately not persisted: one boolean that resets on reload is the
 * whole feature, and storing it would be more code than the thing it remembers.
 */
export default function AppLayout() {
  const { user } = useAuth();
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  return (
    <div className="shell">
      <Header
        menuCollapsed={menuCollapsed}
        onToggleMenu={() => setMenuCollapsed((collapsed) => !collapsed)}
      />
      <div className="body">
        <SideMenu role={user?.role} collapsed={menuCollapsed} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
