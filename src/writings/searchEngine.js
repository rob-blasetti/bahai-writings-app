import { cleanBlockText } from './passageUtils';

export function buildSearchableSections(writings = []) {
  return writings.flatMap(writing => {
    const sections = writing.sectionsData ?? [];
    return sections
      .map(section => {
        const blockTexts = section.blocks
          .map(block => {
            const shareSource =
              typeof block?.shareText === 'string' && block.shareText.length > 0
                ? block.shareText
                : typeof block?.text === 'string'
                ? block.text
                : '';
            const normalized = cleanBlockText(shareSource);
            const fallbackText = typeof block?.text === 'string' ? block.text : '';
            const cleanedFallback = cleanBlockText(fallbackText);
            return normalized.length > 0 ? normalized : cleanedFallback;
          })
          .map(text => text ?? '');
        const normalizedBlockTexts = blockTexts.map(text => text.toLowerCase());
        const filteredBlockTexts = blockTexts.filter(text => text.length > 0);

        if (filteredBlockTexts.length === 0) {
          return null;
        }

        return {
          id: `${writing.id}__${section.id}`,
          writingId: writing.id,
          writingTitle: writing.title ?? 'Unknown writing',
          sectionId: section.id,
          sectionTitle: section.title,
          blocks: section.blocks,
          searchableText: normalizedBlockTexts
            .filter(text => text.length > 0)
            .join(' '),
          preview: filteredBlockTexts[0],
          blockSearchTexts: normalizedBlockTexts,
        };
      })
      .filter(Boolean);
  });
}

export function searchSectionsByTheme(
  searchableSections,
  theme,
  { limit = 8 } = {},
) {
  if (typeof theme !== 'string') {
    return [];
  }

  const normalizedQuery = cleanBlockText(theme).toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  const uniqueTerms = Array.from(
    new Set(
      normalizedQuery
        .split(/\s+/)
        .map(term => term.trim())
        .filter(Boolean),
    ),
  );

  if (uniqueTerms.length === 0) {
    return [];
  }

  const scoredSections = searchableSections
    .map(section => {
      if (!section?.searchableText) {
        return null;
      }

      let score = 0;

      uniqueTerms.forEach(term => {
        if (section.searchableText.includes(term)) {
          const occurrences = section.searchableText.split(term).length - 1;
          score += occurrences;
        }
      });

      if (score === 0) {
        return null;
      }

      return { ...section, score };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.sectionTitle.localeCompare(b.sectionTitle);
    });

  return scoredSections.slice(0, limit).map(section => ({
    id: section.id,
    writingId: section.writingId,
    writingTitle: section.writingTitle,
    sectionId: section.sectionId,
    sectionTitle: section.sectionTitle,
    blocks: section.blocks,
    preview: section.preview,
    score: section.score,
  }));
}
