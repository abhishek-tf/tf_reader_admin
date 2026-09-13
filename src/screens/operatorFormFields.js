export const MIN_PASSWORD = 12;

export const EMPTY_OPERATOR_FORM = {
  email: '',
  name: '',
  role: '',
  password: '',
  scopePublisherId: '',
  scopeInstitutionId: '',
};

export function toFormState(operator) {
  if (!operator) return EMPTY_OPERATOR_FORM;
  return {
    email: operator.email,
    name: operator.name ?? '',
    role: operator.role,
    password: '',
    scopePublisherId: operator.scopePublisherId ?? '',
    scopeInstitutionId: operator.scopeInstitutionId ?? '',
  };
}

/** The one scope the role requires, and nothing at all for a role that owns neither. */
function validateScope(form) {
  if (form.role === 'PUBLISHER_ADMIN' && !form.scopePublisherId.trim()) {
    return { scopePublisherId: 'Enter the publisher this operator manages.' };
  }
  if (form.role === 'INSTITUTION_ADMIN' && !form.scopeInstitutionId.trim()) {
    return { scopeInstitutionId: 'Enter the institution this operator manages.' };
  }
  return {};
}

export function validate(form, editing) {
  const found = {};

  if (!editing) {
    if (!form.email.trim()) found.email = 'Enter an email address.';
    else if (!form.email.includes('@')) found.email = 'Enter a full email address.';
  }
  if (!form.name.trim()) found.name = 'Enter a name.';
  if (!form.role) found.role = 'Choose a role.';

  // Required on create, optional on edit, and the same minimum whenever one is sent.
  if (!editing && !form.password) found.password = 'Enter a password.';
  else if (form.password && form.password.length < MIN_PASSWORD) {
    found.password = `A password must be at least ${MIN_PASSWORD} characters.`;
  }

  return { ...found, ...validateScope(form) };
}

/**
 * Builds an AdminUserCreate or an AdminUserUpdate. Update carries no email, and a field that
 * does not apply is left out of the object rather than sent as null or as an empty string.
 */
export function toPayload(form, editing) {
  const payload = { name: form.name.trim(), role: form.role };

  if (!editing) payload.email = form.email.trim();

  // Blank on edit means "leave the stored password alone", which the server reads from the
  // key being absent. Sending "" would reset it to an empty password instead.
  if (form.password) payload.password = form.password;

  // Exactly one scope per role, and never the other one.
  if (form.role === 'PUBLISHER_ADMIN') payload.scopePublisherId = form.scopePublisherId.trim();
  if (form.role === 'INSTITUTION_ADMIN') {
    payload.scopeInstitutionId = form.scopeInstitutionId.trim();
  }
  return payload;
}
