import { api } from './client.js';

// The auth endpoints from wokay-api.yaml, minus /auth/refresh, which client.js calls itself
// when an access token expires. One refresh path, so two of them cannot race.
//
// Response shape of login, exactly as the contract defines it:
//   { accessToken, expiresIn, refreshToken, refreshExpiresIn, user }
// where user is { id, email, name, role, scopePublisherId, scopeInstitutionId, status }
// and role is SUPER_ADMIN | PUBLISHER_ADMIN | INSTITUTION_ADMIN.

// `allowRefresh: false` on all three below. A 401 from one of these is the answer, not an
// expired access token, so retrying it after a refresh would be wrong. Refreshing a failed
// sign in makes no sense, and the client refreshes for itself, so routing /auth/refresh back
// through here would recurse.

export function login(email, password) {
  return api.post('/auth/login', { email, password }, { allowRefresh: false });
}

/**
 * Revokes the refresh token server side.
 *
 * Always answers 204, even for a token that never existed, so nobody can probe which
 * tokens are live. That means a failure here is a network problem, never "wrong token",
 * so the caller should sign out locally regardless of the outcome.
 *
 * The argument is optional and goes away with the cookie: with nothing to pass, the browser
 * sends the cookie and the server revokes what it finds.
 */
export function logout(refreshToken = null) {
  const body = refreshToken === null ? undefined : { refreshToken };
  return api.post('/auth/logout', body, { allowRefresh: false });
}

/** Who am I. The console draws its menu from the role this returns. */
export function me() {
  return api.get('/auth/me');
}
