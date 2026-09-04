// The real enum values, sent to the API exactly as the contract defines them. Labels below
// are what the operator reads; only the value is ever sent.
export const CONTENT_TYPE_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EPUB', label: 'EPUB' },
  { value: 'AUDIO', label: 'Audio' },
];
export const TIER_OPTIONS = [
  { value: 'OPEN_ACCESS', label: 'Open access' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'ELITE', label: 'Elite' },
];
export const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

// One row per field, in display order. `kind` picks TextField vs SelectField; `showIf` hides
// a field until it applies, so numberOfPages and contentState — both server-derived — are
// simply never listed here rather than shown disabled.
export const FIELDS = [
  {
    name: 'publisherId',
    label: 'Publisher ID',
    kind: 'text',
    placeholder: 'pub_rtlg',
    required: true,
  },
  {
    name: 'collectionIds',
    label: 'Collection IDs',
    kind: 'text',
    placeholder: 'col_law2024, col_env2024',
    hint: 'Comma separated. Leave blank for none.',
  },
  { name: 'title', label: 'Title', kind: 'text', maxLength: 300, required: true },
  { name: 'subtitle', label: 'Subtitle', kind: 'text', maxLength: 300 },
  { name: 'authors', label: 'Authors', kind: 'text', hint: 'Comma separated.' },
  {
    name: 'editors',
    label: 'Editors',
    kind: 'text',
    hint: 'Comma separated. Edited volumes have editors and no authors.',
  },
  { name: 'narrators', label: 'Narrators', kind: 'text', hint: 'Comma separated. Audio only.' },
  {
    name: 'isbn',
    label: 'ISBN',
    kind: 'text',
    placeholder: '9780367211745',
    hint: 'Optional. Audiobooks frequently have none.',
    lockOnceSet: true,
  },
  {
    name: 'contentType',
    label: 'Content type',
    kind: 'select',
    options: CONTENT_TYPE_OPTIONS,
    required: true,
  },
  {
    name: 'accessTier',
    label: 'Access tier',
    kind: 'select',
    options: TIER_OPTIONS,
    required: true,
  },
  {
    name: 'duration',
    label: 'Duration (seconds)',
    kind: 'text',
    inputType: 'number',
    showIf: (form) => form.contentType === 'AUDIO',
    required: (form) => form.contentType === 'AUDIO',
  },
  { name: 'subjects', label: 'Subjects', kind: 'text', hint: 'Comma separated.' },
  { name: 'language', label: 'Language', kind: 'text', placeholder: 'en', maxLength: 20 },
  { name: 'description', label: 'Description', kind: 'text', multiline: true, maxLength: 4000 },
  { name: 'publishedAt', label: 'Published date', kind: 'text', inputType: 'date' },
  { name: 'coverUrl', label: 'Cover URL', kind: 'text', inputType: 'url' },
  { name: 'status', label: 'Status', kind: 'select', options: STATUS_OPTIONS },
];

const ISBN_PATTERN = /^(97[89])?[0-9]{9}[0-9X]$/;

// Comma-separated text is the plain, obvious stand-in for the array fields the contract
// wants. Empty entries from stray commas are dropped rather than sent as blank strings.
const ARRAY_FIELDS = ['collectionIds', 'authors', 'editors', 'narrators', 'subjects'];
const SCALAR_FIELDS = [
  'publisherId',
  'title',
  'subtitle',
  'isbn',
  'contentType',
  'accessTier',
  'language',
  'description',
  'publishedAt',
  'coverUrl',
];

/** The list response already carries every field this form needs, so there is no separate
 * fetch before editing: this just reshapes it into what the controlled inputs hold. */
export function toFormState(item) {
  const form = { status: item?.status ?? 'DRAFT' };
  for (const field of SCALAR_FIELDS) form[field] = item?.[field] ?? '';
  for (const field of ARRAY_FIELDS) form[field] = (item?.[field] ?? []).join(', ');
  form.duration = item?.duration != null ? String(item.duration) : '';
  return form;
}

// The server rejects a changed ISBN on an existing book outright, so this only saves the
// operator a round trip: locked once the record they opened already had one, checked
// against the record as loaded rather than the live form value.
export function isIsbnLocked(item) {
  return Boolean(item?.isbn?.trim());
}

export function splitList(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function validate(form) {
  const found = {};
  if (!form.publisherId.trim()) found.publisherId = 'Enter the publisher ID.';
  if (!form.title.trim()) found.title = 'Enter a title.';
  if (!form.contentType) found.contentType = 'Choose a content type.';
  if (!form.accessTier) found.accessTier = 'Choose an access tier.';
  if (form.contentType === 'AUDIO' && !form.duration.trim()) {
    found.duration = 'Duration is required for audio.';
  }
  if (form.isbn.trim() && !ISBN_PATTERN.test(form.isbn.replace(/[-\s]/g, ''))) {
    found.isbn = 'That does not look like a valid ISBN.';
  }
  return found;
}

/** Turns the form's plain strings back into the shape CatalogueItemWrite expects. */
export function buildPayload(form) {
  return {
    publisherId: form.publisherId.trim(),
    collectionIds: splitList(form.collectionIds),
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || undefined,
    authors: splitList(form.authors),
    editors: splitList(form.editors),
    narrators: splitList(form.narrators),
    isbn: form.isbn.trim() ? form.isbn.replace(/[-\s]/g, '') : undefined,
    contentType: form.contentType,
    accessTier: form.accessTier,
    subjects: splitList(form.subjects),
    language: form.language.trim() || undefined,
    description: form.description.trim() || undefined,
    publishedAt: form.publishedAt || null,
    duration: form.contentType === 'AUDIO' ? Number(form.duration) : undefined,
    coverUrl: form.coverUrl.trim() || undefined,
    status: form.status,
  };
}
