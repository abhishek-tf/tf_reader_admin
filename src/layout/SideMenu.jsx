import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';

/**
 * The side menu.
 *
 * Every entry names the role that may see it, and the menu is filtered by the signed-in
 * operator's role. The three roles are SUPER_ADMIN, PUBLISHER_ADMIN and INSTITUTION_ADMIN.
 *
 * Hiding a link is not security. The server checks permission on every request, and it has
 * to, because anybody can type a URL. This only stops the console offering an operator
 * something they will be refused.
 *
 * An entry marked `soon` renders as greyed-out text rather than a link, so the shape of the
 * console is visible without pretending a screen is there.
 */
export const ENTRIES = [
  {
    to: '/publishers',
    label: 'Publishers',
    icon: 'menu_book',
    roles: ['SUPER_ADMIN', 'PUBLISHER_ADMIN'],
  },
  { to: '/books', label: 'Books', icon: 'auto_stories', roles: ['SUPER_ADMIN', 'PUBLISHER_ADMIN'] },
  {
    to: '/institutions',
    label: 'Institutions',
    icon: 'account_balance',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  {
    to: '/shelves',
    label: 'Shelves',
    icon: 'shelves',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  {
    to: '/entitlements',
    label: 'Entitlements',
    icon: 'verified_user',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  { to: '/operators', label: 'Operators', icon: 'admin_panel_settings', roles: ['SUPER_ADMIN'] },
  { to: '/audit', label: 'Audit log', icon: 'history', roles: ['SUPER_ADMIN'] },
];

// Where "/" sends a role the moment it signs in, and where NotAuthorized's "Go to Home" sends
// it back to. Each value is that role's first entry above, spelled out rather than derived, so
// the landing page does not silently change if the list is ever reordered.
const HOME_ROUTE = {
  SUPER_ADMIN: '/publishers',
  PUBLISHER_ADMIN: '/publishers',
  INSTITUTION_ADMIN: '/institutions',
};

export function homeRouteForRole(role) {
  return HOME_ROUTE[role] ?? '/login';
}

export default function SideMenu({ role, collapsed = false, onNavigate }) {
  const visible = ENTRIES.filter((entry) => entry.roles === null || entry.roles.includes(role));

  return (
    <nav
      id="side-menu"
      className={collapsed ? 'side side-collapsed' : 'side'}
      aria-label="Sections"
    >
      {/* The list is dropped rather than hidden with CSS. A zero-width menu whose links are
          still in the document keeps them reachable by Tab, which puts focus somewhere the
          operator cannot see. */}
      {collapsed ? null : (
        <ul>
          {visible.map((entry) => (
            <li key={entry.to}>
              {entry.soon ? (
                <span className="side-soon" title="Not built yet">
                  {entry.icon ? <Icon name={entry.icon} className="side-icon" /> : null}
                  {entry.label}
                </span>
              ) : (
                <NavLink
                  to={entry.to}
                  className={({ isActive }) => (isActive ? 'side-on' : undefined)}
                  onClick={onNavigate}
                >
                  {entry.icon ? <Icon name={entry.icon} className="side-icon" /> : null}
                  {entry.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
