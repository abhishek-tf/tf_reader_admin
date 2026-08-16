import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearTokens,
  getRefreshToken,
  restoreSession,
  setAuthFailureHandler,
  setTokens,
} from '../api/client.js';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

/**
 * Holds the signed-in operator for the whole app.
 *
 * The tokens live in memory only, never in localStorage or sessionStorage, because an XSS
 * reads both. Surviving a page reload is therefore not the console's job to solve in
 * JavaScript: anything this file could read back after a reload, injected script could read
 * too. It is solved by the refresh token being an httpOnly cookie, which the browser holds
 * across a reload and hands to nobody. See docs/refresh-cookie-spec.md.
 *
 * So on every page load this asks the server to rebuild the session from that cookie. Until
 * the backend sets one the attempt fails quietly and you land on the login page, exactly as
 * before.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  // Starts true, because on the first render we genuinely do not know yet whether there is a
  // session. Rendering the login page during that gap is the bug this exists to prevent: it
  // makes every reload flash the login screen before landing you back where you were.
  const [restoring, setRestoring] = useState(true);

  const clearSession = useCallback(() => {
    clearTokens();
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

  // Rebuild the session once, on page load.
  //
  // A successful refresh returns tokens and no user, deliberately: refreshing proves nothing
  // new about who is calling. So who the operator is has to come from /auth/me, which is what
  // that endpoint is for.
  useEffect(() => {
    let cancelled = false;

    restoreSession()
      .then((restored) => (restored ? authApi.me() : null))
      .catch(() => null)
      .then((profile) => {
        if (cancelled) return;
        if (profile) setUser(profile);
        setRestoring(false);
      });

    // Guards against setting state after unmount. restoreSession itself is deliberately not
    // cancelled: it is one call per page load, and abandoning it half way would leave the
    // client holding a rotated token nobody recorded.
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    setSigningIn(true);
    try {
      const result = await authApi.login(email, password);
      setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken ?? null });
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
    //
    // Read the token at call time rather than closing over it. It is rotated by every
    // refresh, and a captured copy would be the dead one from before the last rotation.
    //
    // Once the token is a cookie there is nothing to read here and nothing to pass: the
    // browser sends it, and the server clears it on the way out.
    try {
      await authApi.logout(getRefreshToken());
    } catch {
      // Deliberately ignored. Nothing useful to tell the operator, and staying signed in
      // because a revoke call failed would be worse than signing out locally.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, signedIn: user !== null, signingIn, restoring, signIn, signOut }),
    [user, signingIn, restoring, signIn, signOut]
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
