import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import SideMenu from './SideMenu.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import logo from '../assets/tf-logo-indigo.svg';

// Has to match index.css's own `@media (max-width: 768px)` on `.side` - that rule is what
// "collapsed" and "expanded" actually look like at this width; everything below only
// decides which one applies and when. Change one, change the other.
const MOBILE_QUERY = '(max-width: 768px)';

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
 * `isMobileWidth` is a second, separate boolean rather than reusing `menuCollapsed` for two
 * things: whether the menu is presented as an overlay at all is a fact about the viewport,
 * not about whether the operator currently wants it open. Conflating the two is what made
 * a plain resize desync a real bug - crossing the 768px line without a reload used to leave
 * the drawer's open/closed state stuck at whatever it was on the previous width.
 */
export default function AppLayout() {
  const { user } = useAuth();
  const [isMobileWidth, setIsMobileWidth] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [menuCollapsed, setMenuCollapsed] = useState(isMobileWidth);

  // Fires only when the viewport actually crosses the 768px line, not on every resize pixel
  // - matchMedia's own change event, not a window resize listener recomputing this by hand.
  // Forces the menu to match the new width's default (closed on mobile, open on desktop)
  // rather than leaving it stuck at whatever it was on the previous side of the line, which
  // otherwise left a phone-width screen with the drawer wide open and untouched, or a
  // desktop window suddenly missing its sidebar after being resized down and back up.
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    function handleChange(event) {
      setIsMobileWidth(event.matches);
      setMenuCollapsed(event.matches);
    }
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // Closing on navigation only matters at a mobile width, where the menu is an overlay
  // sitting on top of the page rather than a permanent column beside it - on desktop it is
  // meant to stay open across navigation, same as it always has.
  function handleNavigate() {
    if (isMobileWidth) setMenuCollapsed(true);
  }

  // The content behind an open mobile drawer is covered, not gone - without `inert` it is
  // still fully reachable by Tab or a screen reader, focusably invisible behind the overlay.
  // Desktop never sets this: there the menu is beside the content, not over it, and both are
  // meant to stay usable at once.
  const contentInert = isMobileWidth && !menuCollapsed;
  const contentRef = useRef(null);

  // Set as a real DOM property, not a JSX attribute: React 18 does not yet recognise `inert`
  // and silently drops it rather than rendering it, so `inert={contentInert}` on the element
  // below would do nothing. Assigning it directly is what the browser actually reads.
  useEffect(() => {
    if (contentRef.current) contentRef.current.inert = contentInert;
  }, [contentInert]);

  // One fixed sidebar element throughout, never two different layouts: `menuCollapsed` slides
  // it off-screen (translateX) on both desktop and mobile. What differs by width is what
  // "visible" costs the rest of the page — on desktop the content's left padding makes room
  // for it, on mobile the sidebar overlays on top of unindented content instead.
  const sidebarVisible = !menuCollapsed;

  return (
    <div className="shell">
      <aside className={sidebarVisible ? 'app-sidebar app-sidebar-open' : 'app-sidebar'}>
        <div className="app-sidebar-top">
          <div className="app-sidebar-brand">
            {/* The logo art already reads "Taylor & Francis, by informa" on its own — the
                header already says "TF Reader admin console" — so this is the mark alone,
                once, rather than repeating either name next to it. It's a two-tone mark (navy
                circle and wordmark, white ship-and-lamp detail inside the circle) rather than
                one flat colour, so a CSS invert to "make it white" turns both tones white and
                erases the detail — that was the solid white blob. A small white plate behind
                it instead shows the real logo, in its real colours, regardless of the dark
                sidebar around it. */}
            <span className="app-sidebar-brand-plate">
              <img src={logo} alt="Taylor & Francis, by Informa" className="app-sidebar-brand-logo" />
            </span>
          </div>
          <div className="app-sidebar-section-label">Catalogue Operations</div>
          <SideMenu role={user?.role} collapsed={false} onNavigate={handleNavigate} />
        </div>
      </aside>
      <div className={sidebarVisible && !isMobileWidth ? 'app-shell-offset' : undefined}>
        <Header
          menuCollapsed={menuCollapsed}
          fullWidth={!sidebarVisible || isMobileWidth}
          onToggleMenu={() => setMenuCollapsed((collapsed) => !collapsed)}
        />
        <main className="content" ref={contentRef}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
