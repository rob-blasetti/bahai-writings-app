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

  return sections;
}
