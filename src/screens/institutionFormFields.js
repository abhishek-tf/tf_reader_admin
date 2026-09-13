import { INSTITUTION_TYPES } from '../api/institutionTypes';

export const TYPE_OPTIONS = INSTITUTION_TYPES.map((t) => ({ value: t, label: t }));

const EMPTY = {
  code: '',
  name: '',
  type: '',
  country: '',
  city: '',
  emailDomainsText: '',
  idpHint: '',
  logoUrl: '',
  primaryColor: '',
};

export function toFormState(institution) {
  if (!institution) return EMPTY;
  return {
    code: institution.code,
    name: institution.name,
    type: institution.type,
    country: institution.country,
    city: institution.city ?? '',
    emailDomainsText: (institution.emailDomains ?? []).join(', '),
    idpHint: institution.signIn?.idpHint ?? '',
    logoUrl: institution.branding?.logoUrl ?? '',
    primaryColor: institution.branding?.primaryColor ?? '',
  };
}

export function toPayload(form) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    type: form.type,
    country: form.country.trim(),
    city: form.city.trim() || null,
    // Trim, lower-case, drop blanks, de-dupe — mirrors the backend's own normalisation exactly
    // (it applies the same rules again, so this just avoids sending obvious duplicates).
    emailDomains: [
      ...new Set(
        form.emailDomainsText
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      ),
    ],
    signIn: { method: 'SAML', idpHint: form.idpHint.trim() || null },
    branding:
      form.logoUrl || form.primaryColor
        ? { logoUrl: form.logoUrl.trim() || null, primaryColor: form.primaryColor.trim() || null }
        : null,
  };
}
