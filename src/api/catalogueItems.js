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
