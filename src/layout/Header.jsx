import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import logo from '../assets/tf-logo-indigo.svg';

// SUPER_ADMIN is not a phrase to show an operator.
const ROLE_LABEL = {
  SUPER_ADMIN: 'Full access',
  PUBLISHER_ADMIN: 'Publisher admin',
  INSTITUTION_ADMIN: 'Institution admin',
};

/**
 * The header: the menu toggle, product name, who is signed in, and sign out.
 *
 * The toggle lives here rather than inside the menu it controls, because the menu collapses
 * to nothing and a button inside it would collapse with it, leaving no way back.
 *
 * Sign out is disabled while it is running, because a second click during the request would
 * fire a second revoke against a token that is already gone.
 */
export default function Header({ menuCollapsed = false, onToggleMenu }) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      // The component usually unmounts before this runs, because signing out sends us to
      // the login page. Resetting anyway keeps it correct if that ever changes.
      setSigningOut(false);
    }
  }

  return (
    <header className="head">
      <div className="head-brand">
        {onToggleMenu ? (
          <button
            type="button"
            className="menu-toggle"
            onClick={onToggleMenu}
            aria-expanded={!menuCollapsed}
            aria-controls="side-menu"
            aria-label={menuCollapsed ? 'Show the menu' : 'Hide the menu'}
            title={menuCollapsed ? 'Show the menu' : 'Hide the menu'}
          >
            <span aria-hidden="true">☰</span>
          </button>
        ) : null}
        <img src={logo} alt="Taylor & Francis" className="head-logo" />
        <div className="head-name">
          TF Reader <span className="head-sub">admin console</span>
        </div>
      </div>
      <div className="head-right">
        {user ? (
          <>
            <span className="head-who">
              {user.name || user.email}
              <span className="head-role">{ROLE_LABEL[user.role] ?? user.role}</span>
            </span>
            <button type="button" className="btn" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
