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

function normalizeShareParts(parts) {
  return parts
    .map(part => normalizeWhitespace(part))
    .filter(part => part.length > 0);
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

function buildFootnoteMap($) {
  const map = new Map();

  $('li').each((_, li) => {
    const container = $(li);
    const numberAnchor = container.find('a.td').first();
    const contentAnchor = container.find('a.sf[id]').first();
    const backLink = container.find('a.jc[href^="#"]').first();

    if (!numberAnchor.length || !contentAnchor.length || !backLink.length) {
      return;
    }

    const id = contentAnchor.attr('id');
    if (!id) {
      return;
    }

    let textSource = contentAnchor.parent('p');
    if (!textSource || !textSource.length) {
      textSource = container;
    }

    const text = normalizeWhitespace(textSource.text() ?? '');
    if (!text) {
      return;
    }

    const number = normalizeWhitespace(numberAnchor.text() ?? '') || null;

    map.set(id, {
      id,
      number,
      text,
      targetId: backLink.attr('href')?.replace(/^#/, '') ?? null,
    });
  });

  return map;
}

function collectSectionContent(anchor, nextAnchor, sectionId, $, footnoteMap) {
  const wrap = node => $(node);
  const blocks = [];
  let fallbackCounter = 0;

  const collectFootnoteRefs = $node => {
    if (
      !$node ||
      !$node.length ||
      !footnoteMap ||
      typeof footnoteMap.size !== 'number' ||
      footnoteMap.size === 0
    ) {
      return [];
    }

    const refs = [];
    const seen = new Set();
    $node.find('sup a[href^=\"#\"]').each((_, anchor) => {
      const href = anchor.attribs?.href ?? '';
      if (typeof href !== 'string' || href.length === 0) {
        return;
      }
      const id = href.replace(/^#/, '');
      if (!id || seen.has(id)) {
        return;
      }
      const entry = footnoteMap.get(id);
      if (!entry) {
        return;
      }
      seen.add(id);
      refs.push(entry);
    });

    return refs;
  };

  const pushBlock = ($node, rawText, type, sourceId) => {
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
      sourceClass:
        ($node && typeof $node.attr === 'function'
          ? ($node.attr('class') ?? '').trim()
          : '') || null,
      sourceTag:
        ($node && $node[0] && typeof $node[0].name === 'string'
          ? $node[0].name
          : null) || null,
      footnoteRefs: collectFootnoteRefs($node),
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
        pushBlock(null, text, 'paragraph', null);
      }
      return;
    }

    if (type !== 'tag') {
      return;
    }

    const blockType = detectBlockType($node);

    if ($node.is('p') || $node.is('h4') || $node.is('h5') || $node.is('h6')) {
      pushBlock($node, $node.text(), blockType, findSourceId($node));
      return;
    }

    if ($node.is('blockquote')) {
      $node.find('p').each((_, p) => {
        const paragraph = wrap(p);
        pushBlock(
          paragraph,
          paragraph.text(),
          'quote',
          findSourceId(paragraph),
        );
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
        pushBlock($node, lines.join('\n'), 'list', findSourceId($node));
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
      pushBlock($node, $node.text(), blockType, findSourceId($node));
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

function isSeparatorText(text) {
  const normalized = normalizeWhitespace(text).replace(/\s+/g, ' ');
  return normalized === '* * *';
}

function isStandaloneNumber(text) {
  return /^[IVXLCDM0-9]+$/.test(text.trim());
}

function isAttributionText(text) {
  const trimmed = text.trim();
  return /^[-–—]\s*/.test(trimmed) || /^--\s*/.test(trimmed);
}

function postProcessBlocks(blocks) {
  const processed = [];

  const ensureShareParts = block => {
    if (!Array.isArray(block.shareParts)) {
      block.shareParts = [];
    }
    if (block.shareParts.length === 0 && block.text?.length) {
      block.shareParts.push(block.text);
    }
  };

  for (const block of blocks) {
    const text = typeof block.text === 'string' ? block.text.trim() : '';
    const hasFootnoteRefs = Array.isArray(block.footnoteRefs) && block.footnoteRefs.length > 0;

    if (!text && !hasFootnoteRefs) {
      continue;
    }

    if (text && isSeparatorText(text)) {
      continue;
    }

    if (text && isStandaloneNumber(text)) {
      continue;
    }

    if (text && isAttributionText(text)) {
      const target = processed[processed.length - 1];
      if (target) {
        ensureShareParts(target);
        target.attribution = target.attribution
          ? `${target.attribution}
${text}`
          : text;
        target.shareParts.push(text);
      } else {
        processed.push({
          ...block,
          text: '',
          attribution: text,
          shareParts: [text],
        });
      }
      continue;
    }

    const nextBlock = {
      ...block,
      text,
    };

    ensureShareParts(nextBlock);

    if (hasFootnoteRefs) {
      const formattedFootnotes = block.footnoteRefs
        .map(ref => {
          const value = typeof ref?.text === 'string' ? normalizeWhitespace(ref.text) : '';
          if (!value) {
            return null;
          }
          const number = typeof ref?.number === 'string' && ref.number.trim().length > 0
            ? ref.number.trim()
            : null;
          return number ? `${number}. ${value}` : value;
        })
        .filter(Boolean);

      if (formattedFootnotes.length > 0) {
        nextBlock.footnotes = formattedFootnotes;
        nextBlock.shareParts.push(...formattedFootnotes);
      }
    }

    processed.push(nextBlock);
  }

  return processed.map(block => {
    const shareParts = normalizeShareParts(block.shareParts ?? []);
    const cleanFootnotes = Array.isArray(block.footnotes)
      ? normalizeShareParts(block.footnotes)
      : [];
    const cleanAttribution =
      typeof block.attribution === 'string'
        ? normalizeWhitespace(block.attribution)
        : null;
    const cleanText =
      typeof block.text === 'string' ? normalizeWhitespace(block.text) : '';

    const shareTextParts = shareParts.length
      ? shareParts
      : [cleanText, cleanAttribution, ...cleanFootnotes];
    const shareText = normalizeWhitespace(
      shareTextParts.filter(Boolean).join('\n\n'),
    );

    const result = {
      ...block,
      text: cleanText,
      shareText: shareText.length > 0 ? shareText : cleanText,
    };

    if (cleanFootnotes.length > 0) {
      result.footnotes = cleanFootnotes;
    } else {
      delete result.footnotes;
    }

    if (cleanAttribution && cleanAttribution.length > 0) {
      result.attribution = cleanAttribution;
    } else {
      delete result.attribution;
    }

    delete result.shareParts;
    delete result.sourceClass;
    delete result.sourceTag;
    delete result.footnoteRefs;

    return result;
  });
}

function extractSectionsFromDocument($) {
  const sections = [];
  const anchors = $('body div.ic').filter((_, element) => $(element).find('h2').length > 0);
  const footnoteMap = buildFootnoteMap($);

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
    const blocks = postProcessBlocks(
      collectSectionContent(anchor, nextAnchor, slugId, $, footnoteMap),
    );

    sections.push({
      id: slugId,
      title: combinedTitle || baseTitle || `Section ${sections.length + 1}`,
      blocks,
      paragraphs: blocks.map(block =>
        normalizeWhitespace(block.shareText ?? block.text ?? ''),
      ),
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
