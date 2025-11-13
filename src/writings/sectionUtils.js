export const LARGE_SECTION_CHUNK_SIZE = 25;

export function getSectionChunkSize(
  blockCount,
  defaultSize = LARGE_SECTION_CHUNK_SIZE,
) {
  if (blockCount >= 800) {
    return Math.min(10, defaultSize);
  }
  if (blockCount >= 500) {
    return Math.min(15, defaultSize);
  }
  if (blockCount >= 200) {
    return Math.min(20, defaultSize);
  }
  return defaultSize;
}

export function chunkSectionsBySize(
  sections,
  chunkSize = LARGE_SECTION_CHUNK_SIZE,
) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [];
  }

  return sections.flatMap(section => {
    const blocks = Array.isArray(section?.blocks) ? section.blocks : [];
    const effectiveChunkSize = getSectionChunkSize(blocks.length, chunkSize);
    if (blocks.length <= effectiveChunkSize) {
      return section;
    }

    const chunkCount = Math.ceil(blocks.length / effectiveChunkSize);
    const sectionTitle = section.title ?? 'Section';

    return Array.from({ length: chunkCount }).map((_, index) => {
      const start = index * effectiveChunkSize;
      const end = Math.min(blocks.length, start + effectiveChunkSize);
      const rangeLabel = `Passages ${start + 1}-${end}`;
      const partLabel = chunkCount > 1 ? `Part ${index + 1}` : null;
      const chunkTitle = partLabel
        ? `${sectionTitle} · ${partLabel} (${rangeLabel})`
        : `${sectionTitle} · ${rangeLabel}`;
      return {
        ...section,
        id: `${section.id}-part-${index + 1}`,
        title: chunkTitle,
        blocks: blocks.slice(start, end),
      };
    });
  });
}
