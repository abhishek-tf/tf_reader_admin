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
 * The screens themselves do not exist yet, which is why every entry except the first is
 * marked `soon`. Those render as greyed-out text rather than links, so the shape of the
 * console is visible without pretending a screen is there.
 */
const ENTRIES = [
  { to: '/', label: 'Frame check', roles: null },
  { to: '/publishers', label: 'Publishers', roles: ['SUPER_ADMIN', 'PUBLISHER_ADMIN'], soon: true },
  { to: '/books', label: 'Books', roles: ['SUPER_ADMIN', 'PUBLISHER_ADMIN'], soon: true },
  {
    to: '/institutions',
    label: 'Institutions',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
    soon: true,
  },
  { to: '/shelves', label: 'Shelves', roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'], soon: true },
  { to: '/operators', label: 'Operators', roles: ['SUPER_ADMIN'], soon: true },
  { to: '/audit', label: 'Audit log', roles: ['SUPER_ADMIN'], soon: true },
];

export default function SideMenu({ role }) {
  const visible = ENTRIES.filter((entry) => entry.roles === null || entry.roles.includes(role));

  return (
    <nav className="side" aria-label="Sections">
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
    </nav>
  );
}
