import { cleanBlockText, extractPassageSentences } from '../writings/passageUtils';

export const getShareableBlockText = block => {
  if (!block) {
    return '';
  }

  const primary =
    typeof block?.text === 'string' && block.text.trim().length > 0
      ? block.text
      : '';
  if (primary) {
    return primary;
  }

  const shareText =
    typeof block?.shareText === 'string' ? block.shareText : '';
  return cleanBlockText(shareText) || shareText;
};

export { extractPassageSentences };
