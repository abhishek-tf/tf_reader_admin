import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

// SUPER_ADMIN is not a phrase to show an operator.
const ROLE_LABEL = {
  SUPER_ADMIN: 'Full access',
  PUBLISHER_ADMIN: 'Publisher admin',
  INSTITUTION_ADMIN: 'Institution admin',
};

/**
 * The header: product name, who is signed in, and sign out.
 *
 * Sign out is disabled while it is running, because a second click during the request would
 * fire a second revoke against a token that is already gone.
 */
export default function Header() {
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
      <div className="head-name">
        TF Reader <span className="head-sub">admin console</span>
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
