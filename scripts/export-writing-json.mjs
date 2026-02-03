#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writingsDirectory = path.resolve(__dirname, '../assets/writings');

function normalizeWhitespace(text) {
  if (!text) {
    return '';
  }

  return String(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugify(value) {
  if (!value) {
    return '';
  }
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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

function prepareDocument($) {
  const body = $('body');

  body.find('script, style, link, svg, noscript').remove();
  body.find('div.wf').remove();
  body.find('nav').remove();

  // Remove footnote back-links
  body.find('a.jc').remove();

  // Convert footnote number links into [n]
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

  body.find('br').each((_, el) => {
    $(el).replaceWith('\n');
  });
}

function extractMetadata($, fileName) {
  const baseName = path.basename(fileName);
  const documentId = normalizeWhitespace(
    $('meta[name="document-id"]').attr('content'),
  );
  const author = normalizeWhitespace($('meta[name="author"]').attr('content'));

  const titleTag = normalizeWhitespace($('title').first().text());
  const h1Title = normalizeWhitespace($('h1').first().text());
  const fallbackTitle = baseName
    .replace(/\.xhtml$/i, '')
    .replace(/[_-]+/g, ' ');

  const resolvedTitle = h1Title || titleTag || fallbackTitle;
  const id = slugify(documentId) || slugify(fileName.replace(/\.xhtml$/i, ''));

  return {
    id,
    title: resolvedTitle,
    author: author || null,
  };
}

function collectInlineText($, node) {
  const $node = $(node);
  if ($node.length === 0) {
    return '';
  }

  // For lists, preserve bullets as newlines.
  if ($node.is('li')) {
    return normalizeWhitespace($node.text());
  }

  return normalizeWhitespace($node.text());
}

function collectBlocks($, root) {
  const blocks = [];

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

    const isBlock =
      ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(name);

    const hasNestedBlocks =
      $el.children('p,h1,h2,h3,h4,h5,h6,li,blockquote,div,table').length > 0 &&
      name !== 'table';

    if (isBlock && !hasNestedBlocks) {
      const text = normalizeWhitespace(collectInlineText($, node));
      if (!text) {
        return;
      }

      const type = name.startsWith('h') ? 'heading' : 'paragraph';
      blocks.push({ type, text });
      return;
    }

    $el.contents().each((_, child) => walk(child));
  };

  $(root)
    .contents()
    .each((_, child) => walk(child));

  return blocks;
}

function extractNotesFromDom($) {
  const body = $('body');
  const notesHeading = body
    .find('h1,h2,h3,h4,h5,h6,p')
    .filter((_, el) => /^notes?$/i.test(normalizeWhitespace($(el).text())))
    .first();

  if (!notesHeading || notesHeading.length === 0) {
    return null;
  }

  let found = false;
  const parts = [];
  body.find('*').each((_, el) => {
    if (el === notesHeading.get(0)) {
      found = true;
      return;
    }
    if (!found) {
      return;
    }
    const tag = el.name?.toLowerCase?.() ?? '';
    if (!tag) {
      return;
    }
    if (['p', 'li', 'div'].includes(tag)) {
      const text = normalizeWhitespace($(el).text());
      if (text) {
        parts.push(text);
      }
    }
  });

  const content = normalizeWhitespace(parts.join('\n\n'));
  if (!content) {
    return {};
  }

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

  return notes;
}

function buildNotesMapFromBlocks(blocks) {
  const notesHeadingIndex = blocks.findIndex(
    block =>
      (block?.type === 'heading' || block?.type === 'paragraph') &&
      /^notes?$/i.test(String(block.text ?? '').trim()),
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

function makeUnitId(index) {
  return `p:${String(index).padStart(6, '0')}`;
}


function convertNumericHeadings(blocks) {
  return blocks.map(block => {
    if (block.type === 'heading' && /^\d+$/.test(block.text.trim())) {
      return { ...block, type: 'partNumber' };
    }
    return block;
  });
}

function buildToc(units) {
  const toc = [];

  const headings = [];
  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    if (unit.type === 'heading') {
      const title = String(unit.text ?? '').trim();
      if (title) {
        headings.push({ index: i, title });
      }
    }
  }

  for (let i = 0; i < headings.length; i += 1) {
    const current = headings[i];
    const next = headings[i + 1];
    const startIndex = Math.min(current.index + 1, units.length - 1);
    const endIndex = next ? Math.max(next.index - 1, startIndex) : units.length - 1;

    const start = units[startIndex]?.id ?? units[current.index]?.id;
    const end = units[endIndex]?.id ?? start;

    toc.push({
      id: `sec:${slugify(current.title) || String(i + 1).padStart(3, '0')}`,
      title: current.title,
      start,
      end,
    });
  }

  return toc;
}

function dedupeAdjacentHeadings(units) {
  const out = [];
  let prev = null;
  for (const unit of units) {
    if (
      prev &&
      prev.type === 'heading' &&
      unit.type === 'heading' &&
      String(prev.text).trim() === String(unit.text).trim()
    ) {
      continue;
    }
    out.push(unit);
    prev = unit;
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const fileFlagIndex = args.indexOf('--file');
  const outFlagIndex = args.indexOf('--out');
  const versionFlagIndex = args.indexOf('--version');

  const fileName = fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : null;
  const outFile = outFlagIndex >= 0 ? args[outFlagIndex + 1] : null;
  const version = versionFlagIndex >= 0 ? Number(args[versionFlagIndex + 1]) : 1;

  if (!fileName) {
    console.error('Usage: node scripts/export-writing-json.mjs --file <xhtml> [--out <path>] [--version <n>]');
    process.exit(1);
  }

  const fullPath = path.join(writingsDirectory, fileName);
  const markup = await readFile(fullPath, 'utf8');
  const $ = load(markup, { decodeEntities: true });

  const meta = extractMetadata($, fileName);
  prepareDocument($);

  const domNotes = extractNotesFromDom($);

  const rawBlocks = collectBlocks($, $('body'));
  const { notes: blockNotes, notesStartIndex } = buildNotesMapFromBlocks(rawBlocks);
  const notes = (blockNotes && Object.keys(blockNotes).length > 0) ? blockNotes : (domNotes || null);
  const contentBlocks = notesStartIndex > 0 ? rawBlocks.slice(0, notesStartIndex) : rawBlocks;

  const normalizedBlocks = convertNumericHeadings(contentBlocks);

  const units = dedupeAdjacentHeadings(
    normalizedBlocks.map((block, index) => ({
      id: makeUnitId(index + 1),
      type: block.type,
      text: block.text,
    })),
  );

  const work = {
    workId: meta.id,
    version: Number.isFinite(version) ? version : 1,
    generatedAt: new Date().toISOString(),
    meta: {
      title: meta.title,
      author: meta.author,
      language: 'en',
      sourceFile: fileName,
    },
    toc: buildToc(units),
    units,
    notes: notes || {},
  };

  const resolvedOut = outFile
    ? path.resolve(process.cwd(), outFile)
    : path.resolve(process.cwd(), 'assets/examples', `${meta.id}.work.json`);

  await mkdir(path.dirname(resolvedOut), { recursive: true });
  await writeFile(resolvedOut, JSON.stringify(work, null, 2));

  console.log(`Wrote ${path.relative(process.cwd(), resolvedOut)}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
