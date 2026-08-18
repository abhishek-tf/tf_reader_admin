// Talks to the institutions endpoints: list, create, look up one, update, and change status.
import { api, pageQuery } from './client.js';

const BASE = '/institutions';

/**
 * @param {{q?: string, status?: string, page?: number, size?: number}} params
 */
export function listInstitutions({ q, status, page = 0, size = 20 } = {}) {
  return api.get(`${BASE}${pageQuery({ page, size, q, status })}`);
}

export function getInstitution(id) {
  return api.get(`${BASE}/${id}`);
}

export function createInstitution(payload) {
  return api.post(BASE, payload);
}

export function updateInstitution(id, payload) {
  return api.put(`${BASE}/${id}`, payload);
}

/**
 * @param {string} id
 * @param {{status: string, reason?: string}} body
 */
export function setInstitutionStatus(id, { status, reason }) {
  return api.patch(`${BASE}/${id}/status`, { status, reason });
}
