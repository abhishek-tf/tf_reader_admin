import { NavLink } from 'react-router-dom';

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
const ENTRIES = [
  { to: '/publishers', label: 'Publishers', roles: ['SUPER_ADMIN', 'PUBLISHER_ADMIN'] },
  { to: '/books', label: 'Books', roles: ['SUPER_ADMIN', 'PUBLISHER_ADMIN'] },
  {
    to: '/institutions',
    label: 'Institutions',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  { to: '/shelves', label: 'Shelves', roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'] },
  {
    to: '/entitlements',
    label: 'Entitlements',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  { to: '/operators', label: 'Operators', roles: ['SUPER_ADMIN'] },
  { to: '/audit', label: 'Audit log', roles: ['SUPER_ADMIN'] },
];

export default function SideMenu({ role, collapsed = false }) {
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
                  {entry.label}
                </span>
              ) : (
                <NavLink
                  to={entry.to}
                  className={({ isActive }) => (isActive ? 'side-on' : undefined)}
                >
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
