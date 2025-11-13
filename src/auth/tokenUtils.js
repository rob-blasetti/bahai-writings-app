import { jwtDecode } from 'jwt-decode';

const MEMBER_REF_FIELDS = [
  'memberRef',
  'member_ref',
  'memberID',
  'memberId',
  'member_id',
  'memberNumber',
  'member_number',
  'userId',
  'user_id',
  'id',
  '_id',
  'actorId',
  'actor_id',
  'sub',
];

export function normalizeDisplayString(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.replace(/\s+/g, ' ');
}

function joinNameParts(...parts) {
  const normalizedParts = parts
    .map(part => normalizeDisplayString(part))
    .filter(Boolean);
  if (normalizedParts.length === 0) {
    return null;
  }
  return normalizedParts.join(' ');
}

function collectNameCandidates(target, addCandidate) {
  if (!target || typeof target !== 'object') {
    return;
  }

  addCandidate(target.name);
  addCandidate(target.fullName);
  addCandidate(target.full_name);
  addCandidate(target.displayName);
  addCandidate(target.display_name);
  addCandidate(target.preferredName);
  addCandidate(target.preferred_name);

  const constructed = joinNameParts(
    target.firstName ?? target.first_name ?? target.givenName ?? target.given_name,
    target.lastName ?? target.last_name ?? target.familyName ?? target.family_name ?? target.surname,
  );
  if (constructed) {
    addCandidate(constructed);
  }
}

export function resolveUserDisplayName(
  payload,
  fallbackName = 'Kali',
  fallbackEmail = null,
) {
  const candidates = [];
  const addCandidate = value => {
    const normalized = normalizeDisplayString(value);
    if (!normalized) {
      return;
    }
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  collectNameCandidates(payload, addCandidate);
  collectNameCandidates(payload?.user, addCandidate);
  collectNameCandidates(payload?.profile, addCandidate);
  collectNameCandidates(payload?.data, addCandidate);
  collectNameCandidates(payload?.data?.user, addCandidate);
  collectNameCandidates(payload?.data?.profile, addCandidate);
  collectNameCandidates(payload?.auth, addCandidate);
  collectNameCandidates(payload?.auth?.user, addCandidate);
  collectNameCandidates(payload?.auth?.profile, addCandidate);

  if (candidates.length > 0) {
    return candidates[0];
  }

  const fallbackFromEmail = normalizeDisplayString(fallbackEmail);
  if (fallbackFromEmail) {
    return fallbackFromEmail;
  }

  const normalizedFallbackName = normalizeDisplayString(fallbackName);
  if (normalizedFallbackName) {
    return normalizedFallbackName;
  }

  return 'Friend';
}

function normalizeEmail(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!trimmed.includes('@')) {
    return null;
  }
  return trimmed;
}

function collectEmailCandidates(target, addCandidate) {
  if (!target || typeof target !== 'object') {
    return;
  }
  addCandidate(target.email);
  addCandidate(target.userEmail);
  addCandidate(target.contactEmail);
  addCandidate(target.primaryEmail);
  addCandidate(target.login);
  addCandidate(target.username);
  addCandidate(target.handle);
  addCandidate(target.user?.email);
}

export function resolveUserEmail(payload, fallbackEmail = null) {
  const candidates = [];
  const addCandidate = value => {
    const normalized = normalizeEmail(value);
    if (!normalized) {
      return;
    }
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  collectEmailCandidates(payload, addCandidate);
  collectEmailCandidates(payload?.user, addCandidate);
  collectEmailCandidates(payload?.profile, addCandidate);
  collectEmailCandidates(payload?.data, addCandidate);
  collectEmailCandidates(payload?.data?.user, addCandidate);
  collectEmailCandidates(payload?.auth, addCandidate);
  collectEmailCandidates(payload?.auth?.user, addCandidate);

  if (candidates.length > 0) {
    return candidates[0];
  }

  const normalizedFallback = normalizeEmail(fallbackEmail);
  if (normalizedFallback) {
    return normalizedFallback;
  }

  return null;
}

function normalizeObjectIdValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) {
      return null;
    }
    return `${value}`;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function collectMemberRefCandidates(target, addCandidate) {
  if (!target || typeof target !== 'object') {
    return;
  }

  MEMBER_REF_FIELDS.forEach(field => {
    const normalized = normalizeObjectIdValue(target[field]);
    if (normalized) {
      addCandidate(normalized);
    }
  });
}

export function resolveUserId(payload, token = null) {
  const candidates = [];
  const addCandidate = value => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed || candidates.includes(trimmed)) {
      return;
    }
    candidates.push(trimmed);
  };

  collectMemberRefCandidates(payload, addCandidate);
  collectMemberRefCandidates(payload?.user, addCandidate);
  collectMemberRefCandidates(payload?.profile, addCandidate);
  collectMemberRefCandidates(payload?.data, addCandidate);
  collectMemberRefCandidates(payload?.data?.user, addCandidate);
  collectMemberRefCandidates(payload?.auth, addCandidate);
  collectMemberRefCandidates(payload?.auth?.user, addCandidate);

  if (candidates.length === 0 && typeof token === 'string' && token.length > 0) {
    try {
      const decoded = jwtDecode(token);
      collectMemberRefCandidates(decoded, addCandidate);
    } catch (error) {
      console.warn('[Auth] Unable to decode token while resolving user ID', error);
    }
  }

  return candidates[0] ?? null;
}

export function resolveAuthToken(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidateTokens = [
    payload.token,
    payload.accessToken,
    payload.jwt,
    payload?.data?.token,
    payload?.data?.accessToken,
    payload?.auth?.token,
    payload?.auth?.accessToken,
  ];

  for (const candidate of candidateTokens) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function coerceTimestamp(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) {
      return null;
    }
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return coerceTimestamp(numericValue);
    }
    const parsedDate = Date.parse(value);
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
    }
  }

  return null;
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);

  if (typeof globalThis?.atob === 'function') {
    try {
      return globalThis.atob(padded);
    } catch (error) {
      return null;
    }
  }

  if (typeof globalThis?.Buffer?.from === 'function') {
    try {
      return globalThis.Buffer.from(padded, 'base64').toString('utf8');
    } catch (error) {
      return null;
    }
  }

  return null;
}

function getJwtExpirationMs(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  const payloadText = decodeBase64Url(segments[1]);
  if (!payloadText) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadText);
    if (typeof payload?.exp === 'number' && Number.isFinite(payload.exp)) {
      return payload.exp > 0 ? payload.exp * 1000 : null;
    }
  } catch (error) {
    return null;
  }

  return null;
}

export function inferAuthExpirationMs(authResult, token) {
  const directTimestamp = coerceTimestamp(
    authResult?.tokenExpiresAt ??
      authResult?.expiresAt ??
      authResult?.tokenExpiry ??
      authResult?.expiry ??
      authResult?.expires ??
      authResult?.expiration,
  );

  if (directTimestamp) {
    return directTimestamp;
  }

  const expiresInCandidates = [
    authResult?.tokenExpiresIn,
    authResult?.expiresIn,
    authResult?.tokenTtl,
    authResult?.ttl,
  ];

  for (const candidate of expiresInCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      if (candidate <= 0) {
        continue;
      }
      const now = Date.now();
      const candidateMs = candidate > 1e6 ? candidate : candidate * 1000;
      return now + candidateMs;
    }
  }

  return getJwtExpirationMs(token);
}
