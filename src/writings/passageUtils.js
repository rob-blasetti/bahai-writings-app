const SENTENCE_REGEX = /([^.!?]+[.!?]+[\])"'“”’]*)([\s\u00A0]*)/g;

export function cleanBlockText(block) {
  if (typeof block !== 'string') {
    return '';
  }

  const normalized = block
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();

  if (/^\d+\.\s*$/.test(normalized)) {
    return '';
  }

  return normalized;
}

export function extractPassageSentences(text) {
  if (!text) {
    return [];
  }

  const normalized = text.replace(/\r\n/g, '\n');
  const sentences = [];
  let lastIndex = 0;
  let match;

  SENTENCE_REGEX.lastIndex = 0;
  while ((match = SENTENCE_REGEX.exec(normalized)) !== null) {
    const sentenceText = match[1]?.trim() ?? '';
    const trailing = match[2] ?? '';

    if (sentenceText) {
      sentences.push({
        text: sentenceText,
        trailing,
      });
    }
    lastIndex = SENTENCE_REGEX.lastIndex;
  }

  if (lastIndex < normalized.length) {
    const remaining = normalized.slice(lastIndex);
    const trimmed = remaining.trim();
    if (trimmed) {
      const startIndex = remaining.search(/\S/);
      const endIndex =
        startIndex >= 0 ? startIndex + trimmed.length : trimmed.length;
      const trailingWhitespace =
        endIndex < remaining.length ? remaining.slice(endIndex) : '';
      sentences.push({
        text: trimmed,
        trailing: trailingWhitespace,
      });
    }
  }

  return sentences;
}

export function createPassageSnapshot({
  block,
  writingId,
  writingTitle,
  sectionId,
  sectionTitle,
}) {
  if (!block) {
    return null;
  }

  const baseText =
    typeof block.text === 'string' && block.text.length > 0 ? block.text : '';
  const shareSource =
    typeof block.shareText === 'string' && block.shareText.length > 0
      ? block.shareText
      : baseText;
  const normalizedText = cleanBlockText(shareSource || baseText || '');

  if (normalizedText.length === 0) {
    return null;
  }

  const timestamp = Date.now();
  const blockId = block.id ?? `block-${timestamp}`;

  const safeBlock = {
    id: blockId,
    text: baseText,
    shareText: shareSource || baseText,
    type: block.type ?? 'paragraph',
    sourceId: block.sourceId ?? null,
    attribution: block.attribution ?? null,
    footnotes: Array.isArray(block.footnotes) ? [...block.footnotes] : [],
  };

  return {
    block: safeBlock,
    writingId: writingId ?? null,
    writingTitle: writingTitle ?? 'Unknown writing',
    sectionId: sectionId ?? null,
    sectionTitle: sectionTitle ?? null,
  };
}
