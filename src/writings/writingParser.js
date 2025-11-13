import { cleanBlockText } from './passageUtils';
import { chunkSectionsBySize } from './sectionUtils';

export function normalizeSectionBlocks(
  section,
  fallbackSectionId,
  fallbackText = '',
) {
  const ensureId = (value, index) =>
    value ?? `${fallbackSectionId}-block-${index + 1}`;

  if (Array.isArray(section?.blocks) && section.blocks.length > 0) {
    return section.blocks
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
          shareText:
            shareText.length > 0
              ? shareText
              : [text, attribution, ...footnotes]
                  .filter(Boolean)
                  .join('\n\n'),
        };
      })
      .filter(Boolean);
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

  return chunkSectionsBySize(baseSections);
}
