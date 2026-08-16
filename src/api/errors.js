// The eleven error codes from wokay-api.yaml. There are no others, so a handler for a
// code not in this list is dead code.
//
// Switch on `code`, never on `message`. The message is written for a human and will change.
export const ErrorCode = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN_SCOPE: 'FORBIDDEN_SCOPE',
  FORBIDDEN_INSTITUTION_MISMATCH: 'FORBIDDEN_INSTITUTION_MISMATCH',
  NO_ENTITLEMENT: 'NO_ENTITLEMENT',
  CONTENT_NOT_READY: 'CONTENT_NOT_READY',
  DOWNLOAD_NOT_PERMITTED: 'DOWNLOAD_NOT_PERMITTED',
  NOT_FOUND: 'NOT_FOUND',
  CODE_TAKEN: 'CODE_TAKEN',
  TOO_MANY_IDS: 'TOO_MANY_IDS',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  STALE_VERSION: 'STALE_VERSION',
};

// What an operator should see. The server's own message is often more specific, so we
// prefer it and fall back to these when it is missing.
const FRIENDLY = {
  UNAUTHENTICATED: 'Your session has ended. Please sign in again.',
  FORBIDDEN_SCOPE: 'You do not have permission to change this record.',
  FORBIDDEN_INSTITUTION_MISMATCH: 'That record belongs to a different institution.',
  NO_ENTITLEMENT: 'This institution is not entitled to that title.',
  CONTENT_NOT_READY: 'The file is still being processed. Try again shortly.',
  DOWNLOAD_NOT_PERMITTED: 'This title can be read online only.',
  NOT_FOUND: 'That record no longer exists. It may have been archived.',
  CODE_TAKEN: 'That code is already in use. Choose another.',
  TOO_MANY_IDS: 'Too many items requested at once. The limit is 100.',
  VALIDATION_FAILED: 'Some fields need fixing.',
  STALE_VERSION: 'Somebody else saved this first. Reload and reapply your change.',
};

/**
 * The one error type this app throws. Every failed request produces one of these, so a
 * caller never has to guess whether it got an Error, a Response or a string.
 */
export class ApiError extends Error {
  constructor({ status, code, message, path, traceId }) {
    super(message || FRIENDLY[code] || 'Something went wrong.');
    this.name = 'ApiError';
    this.status = status ?? 0;
    this.code = code ?? null;
    this.path = path ?? null;
    // Quote this in a bug report. Without it, nobody can find the request in the logs.
    this.traceId = traceId ?? null;
  }

  /** True when the session is over and the user must sign in again. */
  get isAuthFailure() {
    return this.status === 401 || this.code === ErrorCode.UNAUTHENTICATED;
  }

  /** True when a form should show field errors rather than a page-level message. */
  get isValidation() {
    return this.code === ErrorCode.VALIDATION_FAILED;
  }

  /**
   * True when somebody else saved first. Never retry automatically on this: reload,
   * let the operator reapply the change, and save again. Retrying silently destroys
   * their work.
   */
  get isStale() {
    return this.code === ErrorCode.STALE_VERSION;
  }

  /** What to show the operator. */
  get friendly() {
    return this.message || FRIENDLY[this.code] || 'Something went wrong.';
  }
}

/**
 * Builds an ApiError from a response body, tolerating a body that is not our envelope.
 * A proxy, a gateway or a crash can return HTML or nothing at all, and the console must
 * not fall over when that happens.
 */
export function toApiError(status, body, fallbackPath) {
  const isEnvelope = body && typeof body === 'object' && typeof body.code === 'string';
  if (isEnvelope) {
    return new ApiError({
      status: body.status ?? status,
      code: body.code,
      message: body.message,
      path: body.path ?? fallbackPath,
      traceId: body.traceId,
    });
  }
  return new ApiError({
    status,
    code: null,
    message: `Request failed with status ${status}.`,
    path: fallbackPath,
    traceId: null,
  });
}
