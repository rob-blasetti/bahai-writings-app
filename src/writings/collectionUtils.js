export const WRITING_COLLECTIONS = [
  {
    key: 'bahaullah',
    label: "Writings of Bahá’u’lláh",
  },
  {
    key: 'bab',
    label: 'Writings of the Báb',
  },
  {
    key: 'abdulbaha',
    label: "Writings and Talks of ‘Abdu’l‑Bahá",
  },
  {
    key: 'shoghi-effendi',
    label: 'Writings of Shoghi Effendi',
  },
  {
    key: 'prayers',
    label: 'Prayers',
  },
  {
    key: 'universal-house-of-justice',
    label: 'The Universal House of Justice',
  },
  {
    key: 'compilations',
    label: 'Compilations',
  },
];

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const APOSTROPHE_REGEX = /[’‘`´]/g;
const NON_ALNUM_REGEX = /[^a-z0-9']+/g;

function normalizeForMatch(value) {
  if (!value) {
    return '';
  }
  const normalized = typeof value.normalize === 'function'
    ? value.normalize('NFKD')
    : value;
  return normalized
    .toLowerCase()
    .replace(DIACRITICS_REGEX, '')
    .replace(APOSTROPHE_REGEX, "'")
    .replace(NON_ALNUM_REGEX, ' ')
    .trim();
}

function collectSourceText(writing) {
  return [
    writing?.author,
    writing?.keywords,
    writing?.fileName,
    writing?.title,
  ]
    .filter(Boolean)
    .join(' ');
}

export function inferCollectionKey(writing) {
  const normalized = normalizeForMatch(collectSourceText(writing));
  const compact = normalized.replace(/['\s]+/g, '');
  if (!normalized) {
    return 'bahaullah';
  }
  if (
    normalized.includes('universal house of justice') ||
    compact.includes('universalhouseofjustice') ||
    /\buhj\b/.test(normalized)
  ) {
    return 'universal-house-of-justice';
  }
  if (/\bprayers?\b/.test(normalized)) {
    return 'prayers';
  }
  if (/\bcompilation(s)?\b/.test(normalized)) {
    return 'compilations';
  }
  if (/\bbab\b/.test(normalized)) {
    return 'bab';
  }
  if (compact.includes('abdulbaha')) {
    return 'abdulbaha';
  }
  if (normalized.includes('shoghi') || normalized.includes('effendi')) {
    return 'shoghi-effendi';
  }
  if (compact.includes('bahaullah')) {
    return 'bahaullah';
  }
  return 'bahaullah';
}
