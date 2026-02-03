#!/usr/bin/env node

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { createHash } from 'crypto';
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
function stableUnitId({ sourceId, anchorIds, type, text }) {
  if (sourceId) return `src:${sourceId}`;
  const anchor = Array.isArray(anchorIds) && anchorIds.length > 0 ? anchorIds[0] : null;
  if (anchor) return `a:${anchor}`;
  const hash = createHash('sha1')
    .update(String(type ?? ''))
    .update('\n')
    .update(String(text ?? ''))
    .digest('hex')
    .slice(0, 12);
  return `h:${hash}`;
}

function isSubtitleHeading(title) {
  const t = String(title ?? '').trim();
  return /^\(.+\)$/.test(t);
}

function extractNavToc($) {
  const entries = [];
  const seen = new Set();

  $('body')
    .find('nav a[href^="#"]')
    .each((_, el) => {
      const href = $(el).attr('href') || '';
      const id = href.startsWith('#') ? href.slice(1).trim() : '';
      const title = normalizeWhitespace($(el).text());
      if (!id || id === '#' || !title) return;
      if (/^list of sections$/i.test(title)) return;
      if (seen.has(id)) return;
      seen.add(id);
      entries.push({ id, title });
    });

  return entries;
}


function prepareDocument($) {
  const body = $('body');

  body.find('script, style, link, svg, noscript').remove();
  body.find('div.wf').remove();
  // nav removal handled after TOC extraction

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

  return normalizeWhitespace($node.text());
}

function collectAnchorIds($, $el) {
  const ids = new Set();
  const ownId = $el.attr('id');
  if (ownId) ids.add(ownId);

  $el.find('a[id]').each((_, a) => {
    const id = $(a).attr('id');
    if (id) ids.add(id);
  });

  return ids.size > 0 ? Array.from(ids).sort((a, b) => a.localeCompare(b)) : null;
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

    const isBlock = [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'li',
      'blockquote',
    ].includes(name);

    const hasNestedBlocks =
      $el.children('p,h1,h2,h3,h4,h5,h6,li,blockquote,div,table').length > 0 &&
      name !== 'table';

    if (isBlock && !hasNestedBlocks) {
      const text = normalizeWhitespace(collectInlineText($, node));
      if (!text) {
        return;
      }

      const type = name.startsWith('h') ? 'heading' : 'paragraph';
      const sourceId = $el.attr('id') || null;
      const anchorIds = collectAnchorIds($, $el);

      blocks.push({ type, text, sourceId, anchorIds });
      return;
    }

    $el.contents().each((_, child) => walk(child));
  };

  $(root)
    .contents()
    .each((_, child) => walk(child));

  return blocks;
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

  return { notes: null, notesStartIndex: notesHeadingIndex };
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

  const notesContainer = notesHeading.parent().nextAll('div.df').first();
  if (!notesContainer || notesContainer.length === 0) {
    return {};
  }

  const notes = {};

  // After prepareDocument(), note markers become literal text like "[1]".
  // In the Bahá’í Reference Library DOM, each note is typically contained in `li > div`.
  notesContainer.find('li > div').each((_, el) => {
    const raw = normalizeWhitespace($(el).text());
    const match = raw.match(/^\[(\d+)\]\s*(.*)$/s);
    if (!match) {
      return;
    }

    const key = match[1];
    const rawValue = normalizeWhitespace(match[2]);
    if (!key || !rawValue) {
      return;
    }

    // Dedupe repeated paragraphs inside a single note.
    const paras = rawValue
      .split(/\n\n+/)
      .map(p => normalizeWhitespace(p))
      .filter(Boolean);

    const seen = new Set();
    const uniq = [];
    for (const para of paras) {
      if (seen.has(para)) {
        continue;
      }
      seen.add(para);
      uniq.push(para);
    }

    notes[key] = uniq.join('\n\n');
  });

  return notes;
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

function shouldPromoteParagraphToHeading(text) {
  const t = String(text ?? '').trim();
  if (!t) return false;
  if (t.length > 80) return false;
  if (/^[\d.]+$/.test(t)) return false;
  if (/^[IVXLCDM]+$/i.test(t)) return true;
  if (/^[A-Z][A-Z\s\-’’]+$/.test(t) && t.length >= 6) return true;
  if (!/[.!?]$/.test(t) && /\p{L}/u.test(t)) {
    const words = t.split(/\s+/);
    if (words.length >= 2 && words.length <= 10) return true;
  }
  return false;
}

function promoteStandaloneHeadings(blocks) {
  return blocks.map(block => {
    if (block.type === 'paragraph' && shouldPromoteParagraphToHeading(block.text)) {
      return { ...block, type: 'heading' };
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
      if (!title) continue;
      if (isSubtitleHeading(title)) continue;
      headings.push({ index: i, title });
    }
  }

  for (let i = 0; i < headings.length; i += 1) {
    const current = headings[i];
    const next = headings[i + 1];
    const startIndex = current.index;
    const endIndex = next ? Math.max(next.index - 1, startIndex) : units.length - 1;

    toc.push({
      id: `sec:${slugify(current.title) || String(i + 1).padStart(3, '0')}`,
      title: current.title,
      start: units[startIndex].id,
      end: units[endIndex].id,
    });
  }

  return toc;
}

function buildTocFromNav(navEntries, units) {
  if (!Array.isArray(navEntries) || navEntries.length === 0) return null;

  const anchorToIndex = new Map();
  for (let i = 0; i < units.length; i += 1) {
    const anchors = units[i].sourceAnchorIds;
    if (Array.isArray(anchors)) {
      for (const a of anchors) {
        if (!anchorToIndex.has(a)) anchorToIndex.set(a, i);
      }
    }
  }

  const resolved = navEntries
    .map(entry => ({ ...entry, index: anchorToIndex.get(entry.id) }))
    .filter(entry => typeof entry.index === 'number');

  if (resolved.length === 0) return null;

  const toc = [];
  for (let i = 0; i < resolved.length; i += 1) {
    const current = resolved[i];
    const next = resolved[i + 1];
    const startIndex = current.index;
    const endIndex = next ? Math.max(next.index - 1, startIndex) : units.length - 1;

    toc.push({
      id: `sec:${slugify(current.title) || String(i + 1).padStart(3, '0')}`,
      title: current.title,
      start: units[startIndex].id,
      end: units[endIndex].id,
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

async function exportOne({ fileName, outPath, version }) {
  const fullPath = path.join(writingsDirectory, fileName);
  const markup = await readFile(fullPath, 'utf8');
  const $ = load(markup, { decodeEntities: true });

  const meta = extractMetadata($, fileName);
  const navTocEntries = extractNavToc($);
  prepareDocument($);
  $("body").find("nav").remove();

  const domNotes = extractNotesFromDom($);

  const rawBlocks = collectBlocks($, $('body'));
  const { notesStartIndex } = buildNotesMapFromBlocks(rawBlocks);
  const contentBlocks = notesStartIndex > 0 ? rawBlocks.slice(0, notesStartIndex) : rawBlocks;

  const normalizedBlocks = convertNumericHeadings(promoteStandaloneHeadings(contentBlocks));

  const units = dedupeAdjacentHeadings(
    normalizedBlocks.map((block, index) => ({
      id: makeUnitId(index + 1),
      stableId: stableUnitId({ sourceId: block.sourceId, anchorIds: block.anchorIds, type: block.type, text: block.text }),
      type: block.type,
      text: block.text,
      sourceAnchorIds: block.anchorIds,
    })),
  );

  const work = {
    workId: meta.id,
    version,
    generatedAt: new Date().toISOString(),
    meta: {
      title: meta.title,
      author: meta.author,
      language: 'en',
      sourceFile: fileName,
    },
    toc: buildTocFromNav(navTocEntries, units) || buildToc(units),
    units,
    notes: domNotes || {},
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(work, null, 2));
}

async function listXhtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listXhtmlFiles(fullPath);
      files.push(...nested);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.xhtml')) {
      files.push(path.relative(dir, fullPath));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function main() {
  const args = process.argv.slice(2);

  const allFlag = args.includes('--all');
  const fileFlagIndex = args.indexOf('--file');
  const outFlagIndex = args.indexOf('--out');
  const outDirFlagIndex = args.indexOf('--out-dir');
  const versionFlagIndex = args.indexOf('--version');

  const fileName = fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : null;
  const outFile = outFlagIndex >= 0 ? args[outFlagIndex + 1] : null;
  const outDir = outDirFlagIndex >= 0 ? args[outDirFlagIndex + 1] : null;
  const version = versionFlagIndex >= 0 ? Number(args[versionFlagIndex + 1]) : 1;

  if (!allFlag && !fileName) {
    console.error(
      'Usage: node scripts/export-writing-json.mjs --file <xhtml> [--out <path>] [--version <n>]\n' +
        '       node scripts/export-writing-json.mjs --all --out-dir <dir> [--version <n>]',
    );
    process.exit(1);
  }

  const resolvedVersion = Number.isFinite(version) ? version : 1;

  if (allFlag) {
    const resolvedOutDir = outDir
      ? path.resolve(process.cwd(), outDir)
      : path.resolve(process.cwd(), 'assets/exports');

    await mkdir(resolvedOutDir, { recursive: true });

    const relativeFiles = await listXhtmlFiles(writingsDirectory);
    let successCount = 0;
    let failCount = 0;

    for (const relFile of relativeFiles) {
      try {
        const outPath = path.join(
          resolvedOutDir,
          `${path.basename(relFile, path.extname(relFile))}.json`,
        );
        await exportOne({ fileName: relFile, outPath, version: resolvedVersion });
        successCount += 1;
        console.log(
          `Exported ${relFile} → ${path.relative(process.cwd(), outPath)}`,
        );
      } catch (error) {
        failCount += 1;
        console.error(`Failed ${relFile}: ${error?.message ?? error}`);
      }
    }

    console.log(
      `Done. Success: ${successCount}. Failed: ${failCount}. Output dir: ${path.relative(
        process.cwd(),
        resolvedOutDir,
      )}`,
    );

    process.exit(failCount > 0 ? 1 : 0);
  }

  const resolvedOut = outFile
    ? path.resolve(process.cwd(), outFile)
    : path.resolve(
        process.cwd(),
        'assets/examples',
        `${path.basename(fileName, path.extname(fileName))}.json`,
      );

  await exportOne({ fileName, outPath: resolvedOut, version: resolvedVersion });
  console.log(`Wrote ${path.relative(process.cwd(), resolvedOut)}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
