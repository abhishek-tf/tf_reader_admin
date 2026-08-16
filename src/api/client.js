import { toApiError, ApiError } from './errors.js';

// Every admin path starts here. Vite proxies /api to localhost:8080 in dev, so there is
// one origin, no CORS to configure, and no base URL to swap at build time.
const BASE = '/api/admin/v1';

// The access token lives in this module, in memory only.
//
// Not localStorage and not sessionStorage: an XSS reads both, and the pre-commit hook
// blocks writing a token to either. The cost is that a page reload signs you out. That is
// deliberate for the prototype. The proper fix is for the backend to set the refresh token
// as an httpOnly cookie, which the browser cannot read at all.
let accessToken = null;

// Called when the server says the session is over, so the app can show the login page.
// Set once by AuthProvider. Kept as a callback rather than importing React state, so this
// file stays plain JavaScript with no React dependency.
let onAuthFailure = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setAuthFailureHandler(fn) {
  onAuthFailure = fn;
}

/**
 * One request. Returns parsed JSON, or null for 204.
 * Throws ApiError for anything that is not 2xx, and for a network failure.
 *
 * On 401 it clears the token and calls the auth failure handler once, then still throws so
 * the caller knows the request did not happen.
 */
/** Builds the headers for one request. Separate so `request` stays readable. */
function buildHeaders(hasBody) {
  const headers = { Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (hasBody) headers['Content-Type'] = 'application/json';
  return headers;
}

/**
 * Reads the body and parses it if it is JSON.
 *
 * Defensive on purpose. A proxy, a gateway or a crash can answer with HTML or with nothing,
 * and the console must report that rather than throwing a parse error at the operator.
 */
async function parseBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(method, path, { body, signal } = {}) {
  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers: buildHeaders(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    // An aborted request is the caller's own doing, so pass it through untouched and let
    // them ignore it. Turning it into an ApiError would show the operator a false failure.
    if (cause?.name === 'AbortError') throw cause;
    throw new ApiError({
      status: 0,
      code: null,
      message: 'Cannot reach the server. Is the backend running on port 8080?',
      path,
    });
  }

  const parsed = await parseBody(response);
  if (response.ok) return parsed;

  const error = toApiError(response.status, parsed, path);
  if (error.isAuthFailure) {
    // Go through the setter rather than assigning the module variable here. Assigning an
    // outer-scope variable after an await is the pattern that produces a stale-value race,
    // and ESLint's require-atomic-updates is right to object to it.
    setAccessToken(null);
    if (onAuthFailure) onAuthFailure();
  }
  throw error;
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  del: (path, opts) => request('DELETE', path, opts),
};

/**
 * Turns page state into the query string every list endpoint expects.
 * `page` is zero based, matching the contract.
 */
export function pageQuery({ page = 0, size = 20, ...rest } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return `?${params.toString()}`;
}
