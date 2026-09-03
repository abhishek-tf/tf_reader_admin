import { api, pageQuery } from './client.js';

// The catalogue-items endpoints from wokay-api.yaml. List returns a summary projection;
// getCatalogueItem returns the same shape with assets included, which this console does
// not edit, so the list response is enough to populate the edit form.

export function listCatalogueItems(filters, opts) {
  return api.get(`/catalogue-items${pageQuery(filters)}`, opts);
}

export function getCatalogueItem(itemId, opts) {
  return api.get(`/catalogue-items/${itemId}`, opts);
}

export function createCatalogueItem(body) {
  return api.post('/catalogue-items', body);
}

export function updateCatalogueItem(itemId, body) {
  return api.put(`/catalogue-items/${itemId}`, body);
}

// The two ingest endpoints. `file` and `format` are the exact multipart field names the
// backend binds, and `format` is one of PDF, EPUB or AUDIO — the book's own contentType,
// which the server rejects if it does not match. The client sends the FormData as it is and
// lets fetch write the Content-Type, so there is nothing to set here.
export function uploadCatalogueItemContent(itemId, file, format) {
  const form = new FormData();
  form.append('file', file);
  form.append('format', format);
  return api.post(`/catalogue-items/${itemId}/content`, form);
}

// Answers 202's QUEUED, then PROCESSING, then READY or FAILED. Takes `opts` so a caller
// watching one can abort the request in flight, the same as the two reads above.
export function getIngestStatus(itemId, opts) {
  return api.get(`/catalogue-items/${itemId}/ingest-status`, opts);
}
