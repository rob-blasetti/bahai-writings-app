import { API_URL } from '../config';

const DEFAULT_AUTH_ENDPOINT =
  'https://liquidspirit.example.com/api/kali/login-ls';

const normalizeBaseUrl = value => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const resolveAuthEndpoint = () => {
  if (global?.LIQUID_SPIRIT_AUTH_ENDPOINT) {
    return global.LIQUID_SPIRIT_AUTH_ENDPOINT;
  }

  const normalizedBase = normalizeBaseUrl(API_URL);
  if (normalizedBase) {
    return `${normalizedBase}/api/kali/login-ls`;
  }

  return DEFAULT_AUTH_ENDPOINT;
};

const LIQUID_SPIRIT_AUTH_ENDPOINT = resolveAuthEndpoint();

/**
 * Authenticate the user against the Liquid Spirit API.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<Object>} Parsed JSON response from the API.
 */
export async function authenticateLiquidSpirit({ email, password } = {}) {
  const normalizedEmail = String(email ?? '').trim();
  const normalizedPassword = String(password ?? '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('Email and password are required to sign in.');
  }

  if (!LIQUID_SPIRIT_AUTH_ENDPOINT) {
    throw new Error(
      'Liquid Spirit auth endpoint is not configured. Set LIQUID_SPIRIT_AUTH_ENDPOINT.',
    );
  }

  const response = await fetch(LIQUID_SPIRIT_AUTH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const defaultMessage =
      'Unable to sign in to Liquid Spirit. Check your credentials and try again.';
    const message =
      (payload && (payload.error || payload.message)) || defaultMessage;
    throw new Error(message);
  }

  if (!payload) {
    return {};
  }

  return payload;
}

export default {
  authenticateLiquidSpirit,
};
