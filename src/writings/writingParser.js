import { cleanBlockText } from './passageUtils';
import { chunkSectionsBySize } from './sectionUtils';

const ATTRIBUTION_LINE_PATTERN = /^[\u2013\u2014-]\s*(.+)$/u;
const MAX_ATTRIBUTION_LENGTH = 80;
const SHORT_BLOCK_MAX_WORDS = 20;
const SHORT_BLOCK_MAX_CHARS = 120;

const extractStandaloneAttribution = text => {
  if (typeof text !== 'string') {
    return null;
  }
  const normalized = cleanBlockText(text);
  if (!normalized) {
    return null;
  }
  const match = normalized.match(ATTRIBUTION_LINE_PATTERN);
  if (!match) {
    return null;
  }
  const value = match[1]?.trim();
  if (!value || value.length > MAX_ATTRIBUTION_LENGTH) {
    return null;
  }
  if (!/\p{L}/u.test(value)) {
    return null;
  }
  return normalized;
};

const buildShareText = block =>
  [block.text, block.attribution, ...(block.footnotes ?? [])]
    .filter(Boolean)
    .join('\n\n');

const countWords = text =>
  typeof text === 'string' && text.trim().length > 0
    ? text.trim().split(/\s+/).length
    : 0;

const isShortPrefaceBlock = block => {
  if (!block || typeof block.text !== 'string') {
    return false;
  }
  if (block.type === 'heading') {
    return true;
  }
  const wordCount = countWords(block.text);
  return wordCount <= SHORT_BLOCK_MAX_WORDS || block.text.length <= SHORT_BLOCK_MAX_CHARS;
};

const mergeAttributionBlocks = blocks => {
  const merged = [];

  for (const block of blocks) {
    const attributionLine = extractStandaloneAttribution(block.text);
    const previous = merged[merged.length - 1];
    if (
      attributionLine &&
      previous &&
      previous.type !== 'heading' &&
      typeof previous.text === 'string' &&
      previous.text.trim().length > 0
    ) {
      previous.attribution = previous.attribution
        ? `${previous.attribution}\n${attributionLine}`
        : attributionLine;
      continue;
    }
    merged.push(block);
  }

  return merged;
};

const mergeLeadingPrefaceBlocks = blocks => {
  if (!Array.isArray(blocks) || blocks.length < 2) {
    return blocks;
  }

  const prefaceBlocks = [];
  let index = 0;

  for (; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (isShortPrefaceBlock(block)) {
      prefaceBlocks.push(block);
      continue;
    }
    break;
  }

  if (prefaceBlocks.length === 0 || index >= blocks.length) {
    return blocks;
  }

  const prefaceText = prefaceBlocks
    .map(block => block.text)
    .filter(Boolean)
    .join('\n\n');
  if (!prefaceText) {
    return blocks;
  }

  const bodyBlock = blocks[index];
  const mergedBlock = {
    ...bodyBlock,
    text: `${prefaceText}\n\n${bodyBlock.text}`.trim(),
    shareTextOverride: null,
  };

  return [mergedBlock, ...blocks.slice(index + 1)];
};

const finalizeBlocks = blocks =>
  blocks.map(block => {
    const { shareTextOverride, ...rest } = block;
    return {
      ...rest,
      shareText: shareTextOverride || buildShareText(rest),
    };
  });

export function normalizeSectionBlocks(
  section,
  fallbackSectionId,
  fallbackText = '',
) {
  const ensureId = (value, index) =>
    value ?? `${fallbackSectionId}-block-${index + 1}`;

  if (Array.isArray(section?.blocks) && section.blocks.length > 0) {
    const normalizedBlocks = section.blocks
      .map((block, index) => {
        const rawText = typeof block?.text === 'string' ? block.text : '';
        const text = cleanBlockText(rawText);
        const rawAttribution =
          typeof block?.attribution === 'string' ? block.attribution : '';
        const attribution = cleanBlockText(rawAttribution);
        const rawFootnotes = Array.isArray(block?.footnotes)
          ? block.footnotes
          : [];
        const footnotes = rawFootnotes
          .map(note => cleanBlockText(note))
          .filter(Boolean);
        const rawShareText =
          typeof block?.shareText === 'string' ? block.shareText : '';
        const shareText = cleanBlockText(rawShareText);

        const hasContent =
          text.length > 0 ||
          attribution.length > 0 ||
          footnotes.length > 0 ||
          shareText.length > 0;

        if (!hasContent) {
          return null;
        }
        return {
          id: ensureId(block?.id, index),
          type: block?.type ?? 'paragraph',
          text,
          sourceId: block?.sourceId ?? null,
          attribution: attribution.length > 0 ? attribution : null,
          footnotes,
          shareTextOverride: shareText.length > 0 ? shareText : null,
        };
      })
      .filter(Boolean);

    const withAttributions = mergeAttributionBlocks(normalizedBlocks);
    const withPrefaceMerged = mergeLeadingPrefaceBlocks(withAttributions);
    return finalizeBlocks(withPrefaceMerged);
  }

  if (Array.isArray(section?.paragraphs) && section.paragraphs.length > 0) {
    return section.paragraphs
      .map((paragraph, index) => {
        const text = cleanBlockText(paragraph);
        if (!text) {
          return null;
        }
        return {
          id: `${fallbackSectionId}-paragraph-${index + 1}`,
          type: 'paragraph',
          text,
          sourceId: null,
        };
      })
      .filter(Boolean);
  }

  if (typeof fallbackText === 'string' && fallbackText.trim().length > 0) {
    const text = cleanBlockText(fallbackText);
    if (text.length === 0) {
      return [];
    }
    return [
      {
        id: `${fallbackSectionId}-full`,
        type: 'paragraph',
        text,
        sourceId: null,
      },
    ];
  }

  return [];
}

export function getSectionsForWriting(writing) {
  if (!writing) {
    return [];
  }

  const ensureUniqueSectionIds = sections => {
    const seen = new Map();
    return sections.map(section => {
      const baseId = section.id ?? 'section';
      const count = seen.get(baseId) ?? 0;
      const nextCount = count + 1;
      seen.set(baseId, nextCount);
      if (count === 0) {
        return section;
      }
      return {
        ...section,
        id: `${baseId}-dup-${nextCount}`,
      };
    });
  };

  let baseSections = [];

  if (Array.isArray(writing.sections) && writing.sections.length > 0) {
    baseSections = writing.sections
      .map((section, index) => {
        const sectionId = section.id ?? `${writing.id}-section-${index + 1}`;
        const blocks = normalizeSectionBlocks(
          section,
          sectionId,
          writing.text ?? '',
        );
        return {
          id: sectionId,
          title: section.title ?? `Section ${index + 1}`,
          blocks,
        };
      })
      .filter(section => section.blocks.length > 0);
  } else {
    const fallbackId = `${writing.id}-full`;
    baseSections = [
      {
        id: fallbackId,
        title: 'Full Text',
        blocks: normalizeSectionBlocks(
          { blocks: [], paragraphs: [] },
          fallbackId,
          writing.text ?? '',
        ),
      },
    ].filter(section => section.blocks.length > 0);
  }

  return chunkSectionsBySize(ensureUniqueSectionIds(baseSections));
}
