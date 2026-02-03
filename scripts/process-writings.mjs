#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writingsDirectory = path.resolve(__dirname, '../assets/writings');
const outputDirectory = path.resolve(__dirname, '../assets/generated');
const outputFile = path.join(outputDirectory, 'writings.json');

const INLINE_UNWRAP_TAGS = new Set([
  'span',
  'u',
  'cite',
  'abbr',
  'em',
  'strong',
  'b',
  'i',
  'small',
  'sup',
  'sub',
  'font',
]);
const BLOCK_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'div',
  'blockquote',
]);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const TOC_SELECTOR = 'nav';
const EXCLUDE_SECTION_PATTERN = /^(notes?|endnotes?|index|glossary|bibliography|key to)/i;
const SECTION_LABEL_PATTERN = /^(preface|foreword|introduction|prologue|epilogue|appendix|synopsis|questions and answers|part|book|chapter|section|tablet|prayer|valley|poem|supplementary)/i;
const ROMAN_HEADING_PATTERN = /^[\u2013\u2014\-\s]*[IVXLCDM]+[\u2013\u2014\-\s]*$/i;
const DASH_STRIP_PATTERN = /^[\u2013\u2014\-\s]+|[\u2013\u2014\-\s]+$/g;

function normalizeWhitespace(text) {
  if (!text) {
    return '';
  }

  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stableBlockId({ sourceId, anchorIds, type, text }) {
  if (sourceId) {
    return `src:${sourceId}`;
  }
  const anchor = Array.isArray(anchorIds) && anchorIds.length > 0 ? anchorIds[0] : null;
  if (anchor) {
    return `a:${anchor}`;
  }
  const hash = createHash('sha1')
    .update(String(type ?? ''))
    .update('\n')
    .update(String(text ?? ''))
    .digest('hex')
    .slice(0, 12);
  return `h:${hash}`;
}


function slugify(value) {
  if (!value) {
    return '';
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeHeadingText(text) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return '';
  }
  return normalized.replace(DASH_STRIP_PATTERN, '').trim();
}

function isRomanHeading(text) {
  return ROMAN_HEADING_PATTERN.test(normalizeHeadingText(text));
}

function isLikelyStandaloneHeading(text) {
  const normalized = normalizeHeadingText(text);
  if (!normalized) {
    return false;
  }
  if (normalized.length > 80) {
    return false;
  }
  if (/^[\d.]+$/.test(normalized)) {
    return false;
  }
  if (/[.!?]$/.test(normalized)) {
    return false;
  }
  if (isRomanHeading(normalized)) {
    return true;
  }
  return SECTION_LABEL_PATTERN.test(normalized);
}

function extractMetadata($, fileName) {
  const baseName = path.basename(fileName);
  const documentId = normalizeWhitespace(
    $('meta[name="document-id"]').attr('content'),
  );
  const author = normalizeWhitespace($('meta[name="author"]').attr('content'));
  const keywords = normalizeWhitespace($('meta[name="keywords"]').attr('content'));
  const description = normalizeWhitespace(
    $('meta[name="description"]').attr('content'),
  );
  const lastModified = normalizeWhitespace(
    $('meta[name="last-modified"]').attr('content'),
  );

  const titleTag = normalizeWhitespace($('title').first().text());
  const h1Title = normalizeWhitespace($('h1').first().text());
  const fallbackTitle = baseName
    .replace(/\.xhtml$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

  const id = documentId || baseName.replace(/\.xhtml$/i, '');
  const title = titleTag || h1Title || fallbackTitle;

  return {
    id,
    title,
    author: author.length > 0 ? author : null,
    keywords: keywords.length > 0 ? keywords : null,
    description: description.length > 0 ? description : null,
    lastModified: lastModified.length > 0 ? lastModified : null,
  };
}

function extractTocEntries($) {
  const entries = [];
  const excludedIds = new Set();
  const seen = new Set();

  $(TOC_SELECTOR)
    .find('a[href^="#"]')
    .each((_, el) => {
      const href = $(el).attr('href') || '';
      const id = href.startsWith('#') ? href.slice(1).trim() : '';
      const label = normalizeWhitespace($(el).text());
      if (!id || !label) {
        return;
      }
      if (EXCLUDE_SECTION_PATTERN.test(label)) {
        excludedIds.add(id);
        return;
      }
      if (seen.has(id)) {
        return;
      }
      seen.add(id);
      entries.push({ id, label });
    });

  return { entries, excludedIds: Array.from(excludedIds) };
}

function prepareDocument($) {
  const body = $('body');

  body.find('script, style, link, svg, noscript').remove();
  body.find('div.wf').remove();
  body.find(TOC_SELECTOR).remove();

  body.find('a.jc').remove();

  body.find('a.td').each((_, el) => {
    const text = normalizeWhitespace($(el).text());
    if (/^[0-9]+$/.test(text)) {
      $(el).replaceWith(` [${text}]`);
    } else {
      $(el).replaceWith('');
    }
  });

  body.find('sup.ye, sup.af').each((_, el) => {
    const number = normalizeWhitespace($(el).text());
    $(el).replaceWith(number ? ` [${number}]` : '');
  });

  INLINE_UNWRAP_TAGS.forEach(tag => {
    body.find(tag).each((_, el) => {
      $(el).replaceWith($(el).contents());
    });
  });

  // Keep anchor tags with IDs so TOC anchors can be matched later.

  body.find('br').each((_, el) => {
    $(el).replaceWith('\n');
  });

  body.find('hr.fc').each((_, el) => {
    $(el).replaceWith('<p data-separator="true">\n\n</p>');
  });

  body.find('table').each((_, el) => {
    const text = flattenTable($, el);
    $(el).replaceWith(`<p>${text}</p>`);
  });
}

function collectInlineText($, element) {
  let output = '';

  $(element)
    .contents()
    .each((_, node) => {
      if (node.type === 'text') {
        output += node.data;
        return;
      }

      if (node.type !== 'tag') {
        return;
      }

      const name = node.name?.toLowerCase();
      if (name === 'br') {
        output += '\n';
        return;
      }
      if (name === 'hr' && $(node).hasClass('fc')) {
        output += '\n\n';
        return;
      }

      output += collectInlineText($, node);
    });

  return output;
}

function flattenTable($, element) {
  const rows = [];

  $(element)
    .find('tr')
    .each((_, row) => {
      const cells = [];
      $(row)
        .children('th,td')
        .each((_, cell) => {
          const text = normalizeWhitespace(collectInlineText($, cell));
          if (text.length > 0) {
            cells.push(text);
          }
        });
      if (cells.length > 0) {
        rows.push(cells.join(' – '));
      }
    });

  return rows.join('\n');
}

function collectAnchorIds($, element) {
  const ids = new Set();
  const ownId = $(element).attr('id');
  if (ownId) {
    ids.add(ownId);
  }

  $(element)
    .find('a[id]')
    .each((_, anchor) => {
      const id = $(anchor).attr('id');
      if (id) {
        ids.add(id);
      }
    });

  return ids.size > 0 ? Array.from(ids).sort((a, b) => a.localeCompare(b)) : null;
}

function collectBlocks($, root) {
  const blocks = [];
  let counter = 0;

  const walk = node => {
    if (!node || !node.type) {
      return;
    }

    if (node.type === 'text') {
      return;
    }

    if (node.type !== 'tag') {
      return;
    }

    const name = node.name?.toLowerCase() ?? '';
    const $el = $(node);
    const isSeparator = Boolean($el.attr('data-separator'));
    const hasNestedBlocks =
      $el.children('p,h1,h2,h3,h4,h5,h6,li,div,table,blockquote').length > 0 &&
      name !== 'table';

    if (
      isSeparator ||
      name === 'table' ||
      (BLOCK_TAGS.has(name) && !hasNestedBlocks)
    ) {
      const rawText = normalizeWhitespace(collectInlineText($, node));
      const sourceId = $el.attr('id') || null;
      const anchorIds = collectAnchorIds($, $el);

      if (rawText.length === 0 && !isSeparator) {
        return;
      }

      counter += 1;
      const headingLevel = HEADING_TAGS.has(name)
        ? Number.parseInt(name.replace('h', ''), 10)
        : null;
      const type = isSeparator
        ? 'separator'
        : HEADING_TAGS.has(name)
        ? 'heading'
        : 'paragraph';

      blocks.push({
        id: stableBlockId({ sourceId, anchorIds, type, text: rawText }),
        type,
        text: rawText,
        sourceId,
        sourceTag: name,
        level: headingLevel,
        anchorIds,
      });
      return;
    }

    $el.contents().each((_, child) => walk(child));
  };

  $(root)
    .contents()
    .each((_, child) => walk(child));

  return blocks;
}

function formatNumberedParagraphs(blocks) {
  return blocks.map(block => {
    if (block.type !== 'paragraph') {
      return block;
    }

    const match = block.text.match(/^(\d+)[\s.]+(.*)$/);
    if (!match || !match[2]) {
      return block;
    }

    return {
      ...block,
      text: `${match[1]}. ${match[2].trim()}`,
    };
  });
}

function combineNumberedParagraphs(blocks) {
  const combined = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const numberMatch = block.text && /^\d+\.$/.test(block.text);

    if (numberMatch) {
      const number = block.text.replace(/\D/g, '');
      const next = blocks[index + 1];
      const nextText = next ? next.text : '';
      const stripped = normalizeWhitespace(nextText.replace(/^\d+\s*/, ''));
      const text = normalizeWhitespace(`${number}. ${stripped}`);
      const mergedAnchorIds = new Set([
        ...(block.anchorIds || []),
        ...(next?.anchorIds || []),
      ]);
      combined.push({
        ...next,
        id: next?.id || block.id,
        type: 'paragraph',
        text,
        anchorIds: mergedAnchorIds.size > 0 ? Array.from(mergedAnchorIds) : null,
      });
      index += 1;
      continue;
    }

    combined.push(block);
  }

  return combined.filter(block => block.text && block.text.length > 0);
}

function postProcessBlocks(blocks) {
  const normalized = blocks.map(block => {
    if (block.type === 'heading') {
      return {
        ...block,
        text: normalizeHeadingText(block.text),
      };
    }

    if (block.type === 'paragraph' && isLikelyStandaloneHeading(block.text)) {
      return {
        ...block,
        type: 'heading',
        level: 2,
        text: normalizeHeadingText(block.text),
      };
    }

    return block;
  });

  const withoutTitle = normalized.filter(
    block => !(block.type === 'heading' && block.level === 1),
  );

  const processed = combineNumberedParagraphs(formatNumberedParagraphs(withoutTitle));

  // Treat numeric-only headings (e.g. '1', '2') as part markers rather than headings.
  return processed.map(block => {
    if (block.type === 'heading' && /^\d+$/.test(block.text.trim())) {
      return { ...block, type: 'partNumber' };
    }
    return block;
  });
}

function buildSectionsFromToc(
  blocks,
  tocEntries,
  excludedIds,
  writingId,
  fallbackTitle,
) {
  if (!Array.isArray(tocEntries) || tocEntries.length === 0) {
    return null;
  }

  const tocMap = new Map(tocEntries.map(entry => [entry.id, entry]));
  const tocIds = new Set(tocEntries.map(entry => entry.id));
  const excludedSet = new Set(excludedIds || []);
  const sections = [];
  let current = null;
  let sectionIndex = 0;
  const prefaceBlocks = [];

  const flush = () => {
    if (current && current.blocks.length > 0) {
      sections.push(current);
    }
  };

  for (const block of blocks) {
    const anchorMatch = block.anchorIds
      ? block.anchorIds.find(id => tocIds.has(id))
      : null;
    const excludedMatch = block.anchorIds
      ? block.anchorIds.find(id => excludedSet.has(id))
      : null;

    if (excludedMatch) {
      flush();
      break;
    }

    if (anchorMatch) {
      const entry = tocMap.get(anchorMatch);
      if (!current && prefaceBlocks.length > 0) {
        sections.push({
          id: `${writingId}-front-matter`,
          title: 'Front Matter',
          blocks: prefaceBlocks,
        });
      }
      flush();
      sectionIndex += 1;
      const baseTitle = entry?.label || `Section ${sectionIndex}`;
      const title = normalizeHeadingText(baseTitle) || baseTitle;
      const slug = slugify(title) || `section-${sectionIndex}`;
      current = {
        id: `${writingId}-${slug}`,
        title,
        blocks: [],
      };
      const headingText = normalizeHeadingText(block.text).toLowerCase();
      if (block.type !== 'heading' || headingText !== title.toLowerCase()) {
        current.blocks.push(block);
      }
      continue;
    }

    if (!current) {
      prefaceBlocks.push(block);
    } else {
      current.blocks.push(block);
    }
  }

  flush();

  return sections.length > 0
    ? sections
    : [
        {
          id: `${writingId}-full`,
          title: fallbackTitle || 'Full Text',
          blocks,
        },
      ];
}

function buildSectionsFromHeadings(blocks, writingId, fallbackTitle) {
  const headingBlocks = blocks.filter(
    block => block.type === 'heading' && Number.isFinite(block.level) && block.level >= 2,
  );

  if (headingBlocks.length === 0) {
    return [
      {
        id: `${writingId}-full`,
        title: fallbackTitle || 'Full Text',
        blocks,
      },
    ];
  }

  const sectionLevel = Math.min(...headingBlocks.map(block => block.level));
  const sections = [];
  let current = null;
  let sectionIndex = 0;
  const prefaceBlocks = [];

  const flush = () => {
    if (current && current.blocks.length > 0) {
      sections.push(current);
    }
  };

  for (const block of blocks) {
    if (block.type === 'heading' && block.level === sectionLevel) {
      const title = normalizeHeadingText(block.text);
      if (EXCLUDE_SECTION_PATTERN.test(title)) {
        flush();
        break;
      }
      if (!current && prefaceBlocks.length > 0) {
        sections.push({
          id: `${writingId}-front-matter`,
          title: 'Front Matter',
          blocks: prefaceBlocks,
        });
      }
      flush();
      sectionIndex += 1;
      const finalTitle = title || `Section ${sectionIndex}`;
      const slug = slugify(finalTitle) || `section-${sectionIndex}`;
      current = {
        id: `${writingId}-${slug}`,
        title: finalTitle,
        blocks: [],
      };
      continue;
    }

    if (!current) {
      prefaceBlocks.push(block);
    } else {
      current.blocks.push(block);
    }
  }

  flush();

  return sections.length > 0
    ? sections
    : [
        {
          id: `${writingId}-full`,
          title: fallbackTitle || 'Full Text',
          blocks,
        },
      ];
}

function buildSections({
  blocks,
  tocEntries,
  excludedIds,
  writingId,
  fallbackTitle,
}) {
  const fromToc = buildSectionsFromToc(
    blocks,
    tocEntries,
    excludedIds,
    writingId,
    fallbackTitle,
  );
  if (fromToc) {
    return fromToc;
  }
  return buildSectionsFromHeadings(blocks, writingId, fallbackTitle);
}

function stripInternalFields(block) {
  const { anchorIds, level, sourceId, ...rest } = block;
  return rest;
}

function buildNotesMapFromBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { notes: null, notesStartIndex: -1 };
  }

  const notesHeadingIndex = blocks.findIndex(
    block =>
      block?.type === 'heading' && /^notes?$/i.test(String(block.text ?? '').trim()),
  );
  if (notesHeadingIndex < 0) {
    return { notes: null, notesStartIndex: -1 };
  }

  const notesBlocks = blocks.slice(notesHeadingIndex + 1);
  const content = notesBlocks.map(block => block.text).join('\n\n');

  const notes = {};
  const pattern = /\[(\d+)\]([^\[]+)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const key = match[1];
    const value = normalizeWhitespace(match[2]);
    if (key && value) {
      notes[key] = value;
    }
  }

  return {
    notes: Object.keys(notes).length > 0 ? notes : null,
    notesStartIndex: notesHeadingIndex,
  };
}

function buildNotesMapFromSection(section) {
  if (!section || !Array.isArray(section.blocks)) {
    return null;
  }
  const content = section.blocks.map(block => block.text).join('\n\n');
  const notes = {};
  const pattern = /\[(\d+)\]([^\[]+)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const key = match[1];
    const value = normalizeWhitespace(match[2]);
    if (key && value) {
      notes[key] = value;
    }
  }
  return Object.keys(notes).length > 0 ? notes : null;
}

function dedupeSections(sections) {
  const seen = new Set();
  const result = [];

  for (const section of sections) {
    const titleKey = String(section.title ?? '').trim().toLowerCase();
    const sample = Array.isArray(section.blocks)
      ? section.blocks
          .slice(0, 3)
          .map(block => String(block.text ?? '').trim())
          .join('\n')
      : '';

    const fingerprint = createHash('sha1')
      .update(titleKey)
      .update('\n')
      .update(sample)
      .digest('hex');

    if (seen.has(fingerprint)) {
      continue;
    }
    seen.add(fingerprint);
    result.push(section);
  }

  return result;
}

async function readWritingFile(fileName) {
  const fullPath = path.join(writingsDirectory, fileName);
  const markup = await readFile(fullPath, 'utf8');
  const $ = load(markup, { decodeEntities: true });

  const metadata = extractMetadata($, fileName);
  const { entries: tocEntries, excludedIds } = extractTocEntries($);

  prepareDocument($);

  const rawBlocks = collectBlocks($, $('body'));
  const blocks = postProcessBlocks(rawBlocks);

  const { notes, notesStartIndex } = buildNotesMapFromBlocks(blocks);
  const contentBlocks = notesStartIndex > 0 ? blocks.slice(0, notesStartIndex) : blocks;
  const writingId = slugify(metadata.id) || slugify(fileName.replace(/\.xhtml$/i, ''));
  const sections = buildSections({
    blocks,
    tocEntries,
    excludedIds,
    writingId,
    fallbackTitle: metadata.title,
  }).map(section => ({
    ...section,
    blocks: section.blocks.map(stripInternalFields),
  }));

  const dedupedSections = dedupeSections(sections);

  const wordCount = contentBlocks.reduce((total, block) => {
    const text = String(block.text ?? '').trim();
    return total + (text ? text.split(/\s+/).length : 0);
  }, 0);

  const excerpt = normalizeWhitespace(
    contentBlocks.slice(0, 6).map(block => block.text).join('\n\n'),
  ).slice(0, 500);

  return {
    id: metadata.id,
    title: metadata.title,
    fileName,
    author: metadata.author,
    keywords: metadata.keywords,
    schemaVersion: 2,
    excerpt,
    wordCount,
    notes,
    sections: dedupedSections,
  };
}

async function ensureOutputDirectory() {
  await mkdir(outputDirectory, { recursive: true });
}

async function collectXhtmlFiles(dir = writingsDirectory) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectXhtmlFiles(fullPath);
      files.push(...nested);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.xhtml')) {
      files.push(path.relative(writingsDirectory, fullPath));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function buildManifest({ files = null } = {}) {
  const items = [];
  const xhtmlFiles = files ?? (await collectXhtmlFiles());

  for (const fileName of xhtmlFiles) {
    try {
      const writing = await readWritingFile(fileName);
      items.push(writing);
      console.log(`Processed ${fileName}`);
    } catch (error) {
      console.error(`Failed to process ${fileName}:`, error.message);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    items,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const fileFlagIndex = args.indexOf('--file');
  const outFlagIndex = args.indexOf('--out');
  const requestedFile = fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : null;
  const requestedOut = outFlagIndex >= 0 ? args[outFlagIndex + 1] : null;

  await ensureOutputDirectory();

  if (requestedFile) {
    const writing = await readWritingFile(requestedFile);
    const singleManifest = {
      generatedAt: new Date().toISOString(),
      items: [writing],
    };

    const outPath = requestedOut
      ? path.resolve(process.cwd(), requestedOut)
      : path.join(
          outputDirectory,
          `${path.basename(requestedFile, path.extname(requestedFile))}.json`,
        );

    await writeFile(outPath, JSON.stringify(singleManifest, null, 2));
    console.log(`Wrote 1 item(s) to ${path.relative(process.cwd(), outPath)}`);
    return;
  }

  const manifest = await buildManifest();
  await writeFile(outputFile, JSON.stringify(manifest, null, 2));
  console.log(
    `Wrote ${manifest.items.length} item(s) to ${path.relative(
      process.cwd(),
      outputFile,
    )}`,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
