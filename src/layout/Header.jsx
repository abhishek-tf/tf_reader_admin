import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import logo from '../assets/tf-logo-indigo.svg';

// SUPER_ADMIN is not a phrase to show an operator.
const ROLE_LABEL = {
  SUPER_ADMIN: 'Full access',
  PUBLISHER_ADMIN: 'Publisher admin',
  INSTITUTION_ADMIN: 'Institution admin',
};

/**
 * Up to two letters for the avatar.
 *
 * A name gives the first letter of its first two words. An email, which is the fallback when
 * an operator has no name, has no words to split, so it gives its first two characters.
 */
function initialsOf(label) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return label.trim().slice(0, 2).toUpperCase();
}

/**
 * The header: the menu toggle, product name, and who is signed in.
 *
 * The toggle lives here rather than inside the menu it controls, because the menu collapses
 * to nothing and a button inside it would collapse with it, leaving no way back.
 *
 * The operator's role and Sign out sit behind the profile control rather than on the bar
 * itself. Sign out is disabled while it is running, because a second click during the request
 * would fire a second revoke against a token that is already gone.
 */
export default function Header({ menuCollapsed = false, onToggleMenu }) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

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

  // Listens only while the menu is open. The cleanup runs when it closes AND when the header
  // unmounts, so no listener is ever left on the document.
  //
  // mousedown rather than click: it fires before the toggle's own click, so pressing the
  // toggle while the menu is open closes it once rather than closing and reopening.
  useEffect(() => {
    if (!menuOpen) return undefined;

    function closeOnOutsidepress(event) {
      if (!profileRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsidepress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsidepress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const displayName = user ? user.name || user.email : '';

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
          <div className="head-profile" ref={profileRef}>
            <button
              type="button"
              className="profile-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <span className="profile-avatar" aria-hidden="true">
                {initialsOf(displayName)}
              </span>
              <span className="profile-name">{displayName}</span>
            </button>

            {menuOpen ? (
              <div className="profile-menu">
                <p className="muted small">{ROLE_LABEL[user.role] ?? user.role}</p>
                <button type="button" className="btn" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
