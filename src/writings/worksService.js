import { API_URL } from '../../config';
import { normalizeBaseUrl } from '../utils/urlUtils';

const resolveBase = () => {
  if (global?.LIQUID_SPIRIT_API_BASE) {
    return normalizeBaseUrl(global.LIQUID_SPIRIT_API_BASE);
  }

  return normalizeBaseUrl(API_URL);
};

export const resolveWorksBaseEndpoint = () => {
  if (global?.LIQUID_SPIRIT_WORKS_ENDPOINT) {
    return normalizeBaseUrl(global.LIQUID_SPIRIT_WORKS_ENDPOINT);
  }

  const base = resolveBase();
  if (!base) {
    return null;
  }

  return `${base}/api/kali/works`;
};

async function requestJson(url, { token, method = 'GET' } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { method, headers });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function listWorks({ token } = {}) {
  const endpoint = resolveWorksBaseEndpoint();
  if (!endpoint) {
    throw new Error(
      'Works endpoint is not configured. Set API_URL or LIQUID_SPIRIT_WORKS_ENDPOINT.',
    );
  }

  const payload = await requestJson(endpoint, { token });
  // backend returns { works }
  return Array.isArray(payload?.works) ? payload.works : [];
}

export async function getWork(workId, { token } = {}) {
  const endpoint = resolveWorksBaseEndpoint();
  if (!endpoint) {
    throw new Error(
      'Works endpoint is not configured. Set API_URL or LIQUID_SPIRIT_WORKS_ENDPOINT.',
    );
  }

  const safeId = encodeURIComponent(String(workId ?? '').trim());
  if (!safeId) {
    throw new Error('workId is required');
  }

  const payload = await requestJson(`${endpoint}/${safeId}`, { token });
  return payload?.work ?? null;
}

export async function getWorkUnits(
  workId,
  { token, start, startId, limit } = {},
) {
  const endpoint = resolveWorksBaseEndpoint();
  if (!endpoint) {
    throw new Error(
      'Works endpoint is not configured. Set API_URL or LIQUID_SPIRIT_WORKS_ENDPOINT.',
    );
  }

  const safeId = encodeURIComponent(String(workId ?? '').trim());
  if (!safeId) {
    throw new Error('workId is required');
  }

  const params = new URLSearchParams();
  if (typeof limit === 'number') params.set('limit', String(limit));
  if (typeof start === 'number') params.set('start', String(start));
  if (typeof startId === 'string' && startId.trim()) {
    params.set('startId', startId.trim());
  }

  const url = `${endpoint}/${safeId}/units?${params.toString()}`;
  return requestJson(url, { token });
}

export default {
  listWorks,
  getWork,
  getWorkUnits,
  resolveWorksBaseEndpoint,
};
