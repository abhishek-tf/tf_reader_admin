import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAccessToken, setAuthFailureHandler } from '../api/client.js';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

/**
 * Holds the signed-in operator for the whole app.
 *
 * The tokens live in memory only, never in localStorage or sessionStorage, because an XSS
 * reads both. The consequence is real and worth knowing: a page reload signs you out. That
 * is the safe default for the prototype. The fix, when the backend is ready, is an httpOnly
 * cookie for the refresh token, which the browser will not hand to any script.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [signingIn, setSigningIn] = useState(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  // The API client calls this when the server answers 401, so an expired or revoked token
  // takes us to the login page instead of leaving a half-broken screen on display.
  //
  // Admin logout revokes the access token immediately, because every admin request
  // re-checks its adminSessions row. So expect exactly one 401 after signing out, and treat
  // it as "signed out" rather than as an error.
  useEffect(() => {
    setAuthFailureHandler(clearSession);
    return () => setAuthFailureHandler(null);
  }, [clearSession]);

  const signIn = useCallback(async (email, password) => {
    setSigningIn(true);
    try {
      const result = await authApi.login(email, password);
      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken ?? null);
      // login returns the user, so there is no need for a second /auth/me call here.
      setUser(result.user ?? null);
      return result.user ?? null;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    // Revoke server side first, but sign out locally whatever happens. Logout always
    // answers 204, so a failure here means the network, not a bad token.
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Deliberately ignored. Nothing useful to tell the operator, and staying signed in
        // because a revoke call failed would be worse than signing out locally.
      }
    }
    clearSession();
  }, [refreshToken, clearSession]);

  const value = useMemo(
    () => ({ user, signedIn: user !== null, signingIn, signIn, signOut }),
    [user, signingIn, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used inside AuthProvider. Check main.jsx.');
  }
  return context;
}
