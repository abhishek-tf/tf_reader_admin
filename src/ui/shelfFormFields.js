export const SORT_OPTIONS = [
  { value: 'publishedAt.desc', label: 'Newest first' },
  { value: 'publishedAt.asc', label: 'Oldest first' },
  { value: 'title.asc', label: 'Title, A to Z' },
  { value: 'title.desc', label: 'Title, Z to A' },
];

export const SHELF_LABEL = {
  shelf_1: 'Shelf 1',
  shelf_2: 'Shelf 2',
  shelf_3: 'Shelf 3',
};

/** Reshapes a loaded FeedSettings into the plain strings and arrays the controlled inputs hold. */
export function toFormState(settings) {
  return {
    feedTitle: settings.feedTitle,
    pageSize: String(settings.pageSize),
    defaultSort: settings.defaultSort ?? '',
    version: settings.version,
    shelves: settings.shelves
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((shelf) => ({
        id: shelf.id,
        order: shelf.order,
        title: shelf.title,
        itemIds: shelf.itemIds,
      })),
  };
}

export function validate(form) {
  const found = {};
  if (!form.feedTitle.trim()) found.feedTitle = 'Enter a feed title.';
  const size = Number(form.pageSize);
  if (!form.pageSize.trim() || !Number.isInteger(size) || size < 1 || size > 100) {
    found.pageSize = 'Enter a whole number from 1 to 100.';
  }
  form.shelves.forEach((shelf) => {
    if (!shelf.title.trim())
      found[`${shelf.id}-title`] = 'Every shelf needs a title, even one with no books on it.';
    if (shelf.itemIds.length > 50) found[`${shelf.id}-items`] = 'Up to 50 items per shelf.';
  });
  return found;
}

/** Turns the form's plain strings and arrays back into the shape FeedSettingsWrite expects. */
export function buildPayload(form) {
  return {
    feedTitle: form.feedTitle.trim(),
    pageSize: Number(form.pageSize),
    defaultSort: form.defaultSort || undefined,
    version: form.version,
    shelves: form.shelves.map((shelf) => ({
      id: shelf.id,
      order: shelf.order,
      title: shelf.title.trim(),
      itemIds: shelf.itemIds,
    })),
  };
}
