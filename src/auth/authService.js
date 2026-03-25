import { API_URL, AUTH_API_URL } from '../../config';
import { normalizeBaseUrl } from '../utils/urlUtils';

const DEFAULT_AUTH_BASE = 'https://liquid-spirit-auth.vercel.app';

const normalizeAuthBase = value => {
  const normalizedValue = normalizeBaseUrl(value);
  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
};

const resolveAuthBase = () => {
  if (global?.LIQUID_SPIRIT_AUTH_ENDPOINT) {
    return normalizeAuthBase(global.LIQUID_SPIRIT_AUTH_ENDPOINT);
  }

  const configuredAuthBase = normalizeAuthBase(AUTH_API_URL);
  if (configuredAuthBase) {
    return configuredAuthBase;
  }

  const normalizedBase = normalizeBaseUrl(API_URL);
  if (normalizedBase) {
    return normalizedBase;
  }

  return DEFAULT_AUTH_BASE;
};

const LIQUID_SPIRIT_AUTH_BASE = resolveAuthBase();

const resolveAuthEndpoint = path => {
  if (!LIQUID_SPIRIT_AUTH_BASE) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${LIQUID_SPIRIT_AUTH_BASE}${normalizedPath}`;
};

async function requestAuthJson(path, { method = 'POST', body } = {}) {
  const endpoint = resolveAuthEndpoint(path);

  if (!endpoint) {
    throw new Error('Auth endpoint is not configured. Set AUTH_API_URL.');
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const defaultMessage = `Request failed with status ${response.status}`;
    const message =
      (payload &&
        (payload.error?.message || payload.error || payload.message)) ||
      defaultMessage;
    throw new Error(message);
  }

  return payload ?? {};
}

export async function authenticateLiquidSpirit({ email, password } = {}) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const normalizedPassword = String(password ?? '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('Email and password are required to sign in.');
  }

  return requestAuthJson('/api/auth/kali/login-ls', {
    method: 'POST',
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
    },
  });
}

export async function registerLiquidSpirit({
  bahaiId,
  email,
  eulaAcceptedAt,
} = {}) {
  const normalizedBahaiId = String(bahaiId ?? '').trim();
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!normalizedBahaiId || !normalizedEmail) {
    throw new Error('Bahai ID and email are required to register.');
  }

  return requestAuthJson('/api/auth/register', {
    method: 'POST',
    body: {
      bahaiId: normalizedBahaiId,
      email: normalizedEmail,
      eulaAcceptedAt: eulaAcceptedAt || new Date().toISOString(),
    },
  });
}

export async function verifyLiquidSpiritRegistration({
  bahaiId,
  verificationCode,
  password,
} = {}) {
  const normalizedBahaiId = String(bahaiId ?? '').trim();
  const normalizedVerificationCode = String(verificationCode ?? '').trim();
  const normalizedPassword = String(password ?? '');

  if (!normalizedBahaiId || !normalizedVerificationCode || !normalizedPassword) {
    throw new Error('Bahai ID, verification code, and password are required.');
  }

  return requestAuthJson('/api/auth/verify', {
    method: 'POST',
    body: {
      bahaiId: normalizedBahaiId,
      verificationCode: normalizedVerificationCode,
      password: normalizedPassword,
    },
  });
}

export async function requestLiquidSpiritPasswordReset({ email } = {}) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }

  return requestAuthJson('/api/auth/forgot-password', {
    method: 'POST',
    body: {
      email: normalizedEmail,
    },
  });
}

export async function validateLiquidSpiritResetToken(token) {
  const normalizedToken = String(token ?? '').trim();

  if (!normalizedToken) {
    throw new Error('Reset token is required.');
  }

  return requestAuthJson(
    `/api/auth/validate-reset-token/${encodeURIComponent(normalizedToken)}`,
    { method: 'GET' },
  );
}

export async function resetLiquidSpiritPassword({
  token,
  newPassword,
} = {}) {
  const normalizedToken = String(token ?? '').trim();
  const normalizedPassword = String(newPassword ?? '');

  if (!normalizedToken || !normalizedPassword) {
    throw new Error('Reset token and new password are required.');
  }

  return requestAuthJson('/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: normalizedToken,
      newPassword: normalizedPassword,
    },
  });
}

export default {
  authenticateLiquidSpirit,
  registerLiquidSpirit,
  verifyLiquidSpiritRegistration,
  requestLiquidSpiritPasswordReset,
  validateLiquidSpiritResetToken,
  resetLiquidSpiritPassword,
};
