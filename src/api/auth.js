import { api } from './client.js';

// The four auth endpoints from wokay-api.yaml.
//
// Response shape of login, exactly as the contract defines it:
//   { accessToken, expiresIn, refreshToken, refreshExpiresIn, user }
// where user is { id, email, name, role, scopePublisherId, scopeInstitutionId, status }
// and role is SUPER_ADMIN | PUBLISHER_ADMIN | INSTITUTION_ADMIN.

export function login(email, password) {
  return api.post('/auth/login', { email, password });
}

export function refresh(refreshToken) {
  return api.post('/auth/refresh', { refreshToken });
}

/**
 * Revokes the refresh token server side.
 *
 * Always answers 204, even for a token that never existed, so nobody can probe which
 * tokens are live. That means a failure here is a network problem, never "wrong token",
 * so the caller should sign out locally regardless of the outcome.
 */
export function logout(refreshToken) {
  return api.post('/auth/logout', { refreshToken });
}

/** Who am I. The console draws its menu from the role this returns. */
export function me() {
  return api.get('/auth/me');
}
