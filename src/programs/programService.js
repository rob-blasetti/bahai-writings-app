import { API_URL } from '../../config';
import { normalizeBaseUrl } from '../utils/urlUtils';

export const resolveDevotionalEndpoint = () => {
  if (global?.LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT) {
    return global.LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT;
  }

  const normalizedBase = normalizeBaseUrl(API_URL);
  if (normalizedBase) {
    return `${normalizedBase}/api/kali/create/devotional`;
  }

  return null;
};

export async function createDevotionalActivity(payload = {}, options = {}) {
  const endpoint = resolveDevotionalEndpoint();
  if (!endpoint) {
    throw new Error(
      'Liquid Spirit devotional endpoint is not configured. Set API_URL or LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT.',
    );
  }

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const token =
    typeof options.token === 'string' && options.token.trim().length > 0
      ? options.token.trim()
      : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) {
    console.log('[DevotionalService] submitting devotional', {
      endpoint,
      hasToken: Boolean(token),
      payloadSummary: {
        title: payload.title,
        passageCount: Array.isArray(payload.passages) ? payload.passages.length : 0,
        sessionDate: payload.sessionDate,
        timeZone: payload.timeZone,
        frequency: payload.frequency,
      },
    });
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.warn('[DevotionalService] network error submitting devotional', {
      endpoint,
      error: networkError?.message,
    });
    throw networkError;
  }

  let responseBody = null;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    const message =
      responseBody?.message ||
      responseBody?.error ||
      `Request failed with status ${response.status}`;
    console.warn('[DevotionalService] submission failed', {
      endpoint,
      status: response.status,
      responseBody,
    });
    throw new Error(message);
  }

  if (__DEV__) {
    console.log('[DevotionalService] submission succeeded', {
      endpoint,
      responseBody,
    });
  }

  return responseBody;
}

export default {
  createDevotionalActivity,
  resolveDevotionalEndpoint,
};
