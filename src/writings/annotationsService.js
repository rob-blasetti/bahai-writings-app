import { API_URL } from '../../config';
import { normalizeBaseUrl } from '../utils/urlUtils';

const resolveBase = () => {
  if (global?.LIQUID_SPIRIT_API_BASE) {
    return normalizeBaseUrl(global.LIQUID_SPIRIT_API_BASE);
  }

  return normalizeBaseUrl(API_URL);
};

export const resolveKaliBaseEndpoint = () => {
  if (global?.LIQUID_SPIRIT_KALI_ENDPOINT) {
    return normalizeBaseUrl(global.LIQUID_SPIRIT_KALI_ENDPOINT);
  }

  const base = resolveBase();
  if (!base) {
    return null;
  }

  return `${base}/api/kali`;
};

async function requestJson(url, { token, method = 'GET', body } = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

export async function createHighlight(payload, { token } = {}) {
  const base = resolveKaliBaseEndpoint();
  if (!base) {
    throw new Error(
      'Kali endpoint is not configured. Set API_URL or LIQUID_SPIRIT_KALI_ENDPOINT.',
    );
  }

  const result = await requestJson(`${base}/highlights`, {
    token,
    method: 'POST',
    body: payload,
  });

  return result?.highlight ?? null;
}

export async function listHighlights(
  { workId, version, unitId, startUnitId, endUnitId } = {},
  { token } = {},
) {
  const base = resolveKaliBaseEndpoint();
  if (!base) {
    throw new Error(
      'Kali endpoint is not configured. Set API_URL or LIQUID_SPIRIT_KALI_ENDPOINT.',
    );
  }

  const params = new URLSearchParams();
  if (workId) params.set('workId', String(workId));
  if (typeof version === 'number') params.set('version', String(version));
  if (unitId) params.set('unitId', String(unitId));
  if (startUnitId) params.set('startUnitId', String(startUnitId));
  if (endUnitId) params.set('endUnitId', String(endUnitId));

  const url = `${base}/highlights?${params.toString()}`;
  const result = await requestJson(url, { token });
  return Array.isArray(result?.highlights) ? result.highlights : [];
}

export async function deleteHighlight(highlightId, { token } = {}) {
  const base = resolveKaliBaseEndpoint();
  if (!base) {
    throw new Error(
      'Kali endpoint is not configured. Set API_URL or LIQUID_SPIRIT_KALI_ENDPOINT.',
    );
  }

  const safeId = encodeURIComponent(String(highlightId ?? '').trim());
  if (!safeId) {
    throw new Error('highlightId is required');
  }

  return requestJson(`${base}/highlights/${safeId}`, {
    token,
    method: 'DELETE',
  });
}

export async function createComment(payload, { token } = {}) {
  const base = resolveKaliBaseEndpoint();
  if (!base) {
    throw new Error(
      'Kali endpoint is not configured. Set API_URL or LIQUID_SPIRIT_KALI_ENDPOINT.',
    );
  }

  const result = await requestJson(`${base}/comments`, {
    token,
    method: 'POST',
    body: payload,
  });

  return result?.comment ?? null;
}

export async function listComments(
  { workId, version, targetType, sectionId, unitId, limit } = {},
  { token } = {},
) {
  const base = resolveKaliBaseEndpoint();
  if (!base) {
    throw new Error(
      'Kali endpoint is not configured. Set API_URL or LIQUID_SPIRIT_KALI_ENDPOINT.',
    );
  }

  const params = new URLSearchParams();
  if (workId) params.set('workId', String(workId));
  if (typeof version === 'number') params.set('version', String(version));
  if (targetType) params.set('targetType', String(targetType));
  if (sectionId) params.set('sectionId', String(sectionId));
  if (unitId) params.set('unitId', String(unitId));
  if (typeof limit === 'number') params.set('limit', String(limit));

  const url = `${base}/comments?${params.toString()}`;
  const result = await requestJson(url, { token });
  return Array.isArray(result?.comments) ? result.comments : [];
}

export async function deleteComment(commentId, { token } = {}) {
  const base = resolveKaliBaseEndpoint();
  if (!base) {
    throw new Error(
      'Kali endpoint is not configured. Set API_URL or LIQUID_SPIRIT_KALI_ENDPOINT.',
    );
  }

  const safeId = encodeURIComponent(String(commentId ?? '').trim());
  if (!safeId) {
    throw new Error('commentId is required');
  }

  return requestJson(`${base}/comments/${safeId}`, {
    token,
    method: 'DELETE',
  });
}

export default {
  resolveKaliBaseEndpoint,
  createHighlight,
  listHighlights,
  deleteHighlight,
  createComment,
  listComments,
  deleteComment,
};
