const SENTENCE_REGEX = /([^.!?]+[.!?]+[\])"'“”’]*)([\s\u00A0]*)/g;

export const extractPassageSentences = text => {
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
      const endIndex = startIndex >= 0 ? startIndex + trimmed.length : trimmed.length;
      const trailingWhitespace =
        endIndex < remaining.length ? remaining.slice(endIndex) : '';
      sentences.push({
        text: trimmed,
        trailing: trailingWhitespace,
      });
    }
  }

  return sentences;
};
