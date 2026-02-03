export function normalizeBaseUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}
