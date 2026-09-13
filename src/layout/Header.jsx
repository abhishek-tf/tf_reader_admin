import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';

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

/** Whichever scope dimension the role uses - a full-access operator is confined to neither,
 * and there is nothing to show a second row for. */
function scopeOf(user) {
  if (user.scopePublisherId) return { label: 'Publisher scope', value: user.scopePublisherId };
  if (user.scopeInstitutionId)
    return { label: 'Institution scope', value: user.scopeInstitutionId };
  return null;
}

/**
 * The dropdown's own content: the signed-in operator's identity in full (name, email, role,
 * scope), not just Sign out underneath the same truncated name/role the toggle already showed.
 * Split out of Header, which was over the complexity budget with this inline.
 */
function ProfileMenu({ user, displayName, onSignOut, signingOut }) {
  const scope = scopeOf(user);
  return (
    <div className="profile-menu" role="menu">
      <div className="profile-menu-header">
        <span className="profile-avatar profile-avatar-lg" aria-hidden="true">
          {initialsOf(displayName)}
        </span>
        <span className="profile-menu-identity">
          <span className="profile-menu-name">{displayName}</span>
          {user.name ? <span className="profile-menu-email">{user.email}</span> : null}
        </span>
      </div>
      <dl className="profile-menu-details">
        <div className="profile-menu-detail-row">
          <dt>Role</dt>
          <dd>
            <span className="role-chip">{user.role}</span>
          </dd>
        </div>
        {scope ? (
          <div className="profile-menu-detail-row">
            <dt>{scope.label}</dt>
            <dd className="code-chip-plain">{scope.value}</dd>
          </div>
        ) : null}
      </dl>
      <div className="profile-menu-footer">
        <Button onClick={onSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out...' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
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
export default function Header({ menuCollapsed = false, fullWidth = false, onToggleMenu }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      // signOut only clears who we are; it does not move off whatever page we were looking
      // at. Left alone, RequireAuth catches the now-signed-out state on that same URL and
      // stores it as state.from, so the next sign-in — quite possibly a different operator —
      // would be sent back to a page their role has no business seeing. Leaving explicitly
      // closes that gap.
      navigate('/login', { replace: true });
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
  const headClassName = fullWidth ? 'head head-full' : 'head';
  const toggleLabel = menuCollapsed ? 'Show the menu' : 'Hide the menu';

  return (
    <header className={headClassName}>
      <div className="head-brand">
        {onToggleMenu ? (
          <button
            type="button"
            className="menu-toggle"
            onClick={onToggleMenu}
            aria-expanded={!menuCollapsed}
            aria-controls="side-menu"
            aria-label={toggleLabel}
            title={toggleLabel}
          >
            <Icon name="menu" />
          </button>
        ) : null}
        <span className="head-name">TF Reader admin console</span>
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
              <span className="profile-info">
                <span className="profile-name">{displayName}</span>
                <span className="profile-role">{ROLE_LABEL[user.role] ?? user.role}</span>
              </span>
              <Icon name="expand_more" style={{ fontSize: 18, color: 'var(--slate)' }} />
            </button>

            {menuOpen ? (
              <ProfileMenu
                user={user}
                displayName={displayName}
                onSignOut={handleSignOut}
                signingOut={signingOut}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
