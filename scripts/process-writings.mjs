#!/usr/bin/env node

import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writingsDirectory = path.resolve(__dirname, '../assets/writings');
const outputDirectory = path.resolve(__dirname, '../assets/generated');
const outputFile = path.join(outputDirectory, 'writings.json');
const SECTION_ORDER = [
  'Preface',
  'Rashḥ-i-‘Amá (The Clouds of the Realms Above)',
  'The Seven Valleys',
  'From the Letter Bá’ to the Letter Há’',
  'Three Other Tablets',
  'The Four Valleys',
  'Notes',
];

function filenameToTitle(filename) {
  const baseName = filename.replace(/\.xhtml$/i, '');
  return baseName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

function normalizeWhitespace(text) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim());

  const normalized = [];

  for (const line of lines) {
    if (line.length === 0) {
      if (normalized.length === 0 || normalized[normalized.length - 1] === '') {
        continue;
      }
      normalized.push('');
    } else {
      normalized.push(line);
    }
  }

  return normalized.join('\n').trim();
}

async function ensureOutputDirectory() {
  await mkdir(outputDirectory, { recursive: true });
}

async function collectXhtmlFiles() {
  const entries = await readdir(writingsDirectory, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.xhtml'))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeTitle(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function detectBlockType($node) {
  if (!$node || $node.length === 0) {
    return 'paragraph';
  }

  if ($node.is('blockquote')) {
    return 'quote';
  }

  if ($node.is('h4') || $node.is('h5') || $node.is('h6')) {
    return 'heading';
  }

  if ($node.is('ul') || $node.is('ol')) {
    return 'list';
  }

  if ($node.is('p') && $node.find('span.ce').length > 1) {
    return 'poetry';
  }

  return 'paragraph';
}

function findSourceId($node) {
  if (!$node || $node.length === 0) {
    return null;
  }

  if ($node.attr('id')) {
    return $node.attr('id');
  }

  const descendantWithId = $node.find('[id]').filter((_, el) => {
    const value = el.attribs?.id;
    return typeof value === 'string' && value.length > 0;
  });

  if (descendantWithId.length > 0) {
    return descendantWithId.first().attr('id');
  }

  return null;
}

function collectSectionContent(anchor, nextAnchor, sectionId, $) {
  const wrap = node => $(node);
  const blocks = [];
  let fallbackCounter = 0;

  const pushBlock = (rawText, type, sourceId) => {
    const text = normalizeWhitespace(rawText ?? '');
    if (!text) {
      return;
    }
    fallbackCounter += 1;
    blocks.push({
      id: sourceId ?? `${sectionId}-block-${fallbackCounter}`,
      type,
      text,
      sourceId: sourceId ?? null,
    });
  };

  const processNode = $node => {
    if (!$node || $node.length === 0) {
      return;
    }

    const { type } = $node[0];
    if (type === 'text') {
      const text = normalizeWhitespace($node.text());
      if (text) {
        pushBlock(text, 'paragraph', null);
      }
      return;
    }

    if (type !== 'tag') {
      return;
    }

    const blockType = detectBlockType($node);

    if ($node.is('p') || $node.is('h4') || $node.is('h5') || $node.is('h6')) {
      pushBlock($node.text(), blockType, findSourceId($node));
      return;
    }

    if ($node.is('blockquote')) {
      $node.find('p').each((_, p) => {
        const paragraph = wrap(p);
        pushBlock(paragraph.text(), 'quote', findSourceId(paragraph));
      });
      return;
    }

    if ($node.is('ul') || $node.is('ol')) {
      const prefix = $node.is('ol') ? '•' : '•';
      const lines = [];
      $node.children('li').each((_, li) => {
        const text = normalizeWhitespace(wrap(li).text());
        if (text) {
          lines.push(`${prefix} ${text}`);
        }
      });
      if (lines.length > 0) {
        pushBlock(lines.join('\n'), 'list', findSourceId($node));
      }
      return;
    }

    if ($node.is('div') || $node.is('section') || $node.is('article')) {
      $node.contents().each((_, child) => {
        processNode(wrap(child));
      });
      return;
    }

    // Fallback: process children if they exist, otherwise treat as text.
    const children = $node.contents();
    if (children.length > 0) {
      children.each((_, child) => {
        processNode(wrap(child));
      });
    } else {
      pushBlock($node.text(), blockType, findSourceId($node));
    }
  };

  const headingNames = new Set(['h1', 'h2', 'h3']);
  anchor.contents().each((_, childNode) => {
    if (childNode.type === 'tag' && headingNames.has(childNode.name)) {
      return;
    }
    processNode(wrap(childNode));
  });

  let sibling = anchor.next();
  while (sibling && sibling.length) {
    if (nextAnchor && nextAnchor.length && sibling[0] === nextAnchor[0]) {
      break;
    }
    processNode(sibling);
    sibling = sibling.next();
  }

  return blocks;
}

function extractSectionsFromDocument($) {
  const sections = [];
  const anchors = $('body div.ic').filter((_, element) => $(element).find('h2').length > 0);

  anchors.each((index, element) => {
    const anchor = $(element);
    const h2 = anchor.find('h2').first();
    const baseTitle = normalizeTitle(h2.text());
    let combinedTitle = baseTitle;
    const possibleSubtitles = anchor.find('h3').toArray();
    for (const element of possibleSubtitles) {
      const subtitleText = normalizeTitle($(element).text());
      if (/^\(.*\)$/.test(subtitleText)) {
        combinedTitle = `${baseTitle} ${subtitleText}`;
        break;
      }
    }

    const slugId = slugify(combinedTitle || baseTitle || `section-${index + 1}`);
    const nextAnchor = anchors.eq(index + 1);
    const blocks = collectSectionContent(anchor, nextAnchor, slugId, $);

    sections.push({
      id: slugId,
      title: combinedTitle || baseTitle || `Section ${sections.length + 1}`,
      blocks,
      paragraphs: blocks.map(block => block.text),
    });
  });

  return sections;
}

async function extractTextFromXhtml(filePath) {
  const markup = await readFile(filePath, 'utf8');
  const $ = load(markup, { xmlMode: true, decodeEntities: true });
  const body = $('body');
  if (body.length === 0) {
    const rawText = $.root().text();
    return {
      text: normalizeWhitespace(rawText),
      sections: [],
    };
  }

  const allText = normalizeWhitespace(body.text());
  const extractedSections = extractSectionsFromDocument($);

  const orderedSections = SECTION_ORDER.map(desiredTitle => {
    const matchIndex = extractedSections.findIndex(
      section => normalizeTitle(section.title) === normalizeTitle(desiredTitle),
    );
    if (matchIndex === -1) {
      return null;
    }
    return extractedSections.splice(matchIndex, 1)[0];
  }).filter(Boolean);

  const remainingSections = extractedSections;

  return {
    text: allText,
    sections: [...orderedSections, ...remainingSections],
  };
}

async function buildManifest(xhtmlFiles) {
  const items = [];

  for (const fileName of xhtmlFiles) {
    const fullPath = path.join(writingsDirectory, fileName);
    try {
      const { text, sections } = await extractTextFromXhtml(fullPath);
      items.push({
        id: fileName.replace(/\.xhtml$/i, ''),
        title: filenameToTitle(fileName),
        fileName,
        text,
        sections,
      });
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
  await ensureOutputDirectory();
  const xhtmlFiles = await collectXhtmlFiles();

  if (xhtmlFiles.length === 0) {
    console.warn('No XHTML files found in assets/writings.');
  }

  const manifest = await buildManifest(xhtmlFiles);
  await writeFile(outputFile, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.items.length} item(s) to ${path.relative(process.cwd(), outputFile)}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
