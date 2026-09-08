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
 *
 * Starts collapsed on a mobile/tablet width, since index.css turns the menu into an overlay
 * below 768px - starting expanded there would cover the whole screen on first load. Starts
 * expanded everywhere else, same as before this existed. Checked once at mount, not kept in
 * sync with a resize afterward: an admin console window is not one an operator resizes
 * mid-session, so that is not a case worth a listener for.
 *
 * The 768px below has to match index.css's own `@media (max-width: 768px)` on `.side` -
 * that rule is what "collapsed" and "expanded" actually look like at this width; this is
 * only what decides which one to start in. Change one, change the other.
 */
export default function AppLayout() {
  const { user } = useAuth();
  const [menuCollapsed, setMenuCollapsed] = useState(
    () => window.matchMedia('(max-width: 768px)').matches
  );

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
