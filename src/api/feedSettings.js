// Talks to one institution's feed-settings endpoint: read the shelves, save the shelves.
import { api } from './client.js';

const BASE = '/institutions';

export function getFeedSettings(institutionId, opts) {
  return api.get(`${BASE}/${institutionId}/feed-settings`, opts);
}

export function setFeedSettings(institutionId, payload) {
  return api.put(`${BASE}/${institutionId}/feed-settings`, payload);
}
