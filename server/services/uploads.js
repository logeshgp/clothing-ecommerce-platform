import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { db, now } from '../db.js';

/**
 * Image uploads for product photography.
 *
 * Files are validated by *magic bytes*, not by the client-supplied MIME type or
 * extension, then written with a generated name so nothing user-controlled ever
 * touches the filesystem path.
 */

const SIGNATURES = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) => b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mime: 'image/avif',
    ext: 'avif',
    test: (b) => b.slice(4, 8).toString('ascii') === 'ftyp' && b.slice(8, 12).toString('ascii').startsWith('avif'),
  },
];

export function detectImage(buffer) {
  if (!buffer || buffer.length < 16) return null;
  return SIGNATURES.find((signature) => signature.test(buffer)) ?? null;
}

/**
 * Parses a single-file multipart/form-data body without a dependency.
 * Returns `{ filename, content }` or null.
 */
export function parseSingleFile(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!boundaryMatch) return null;

  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const parts = splitBuffer(buffer, Buffer.from(boundary));

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headers = part.slice(0, headerEnd).toString('utf8');
    if (!/name="file"/i.test(headers)) continue;

    const filenameMatch = /filename="([^"]*)"/i.exec(headers);
    let content = part.slice(headerEnd + 4);
    // Trim the trailing CRLF that precedes the next boundary.
    if (content.slice(-2).toString() === '\r\n') content = content.slice(0, -2);

    return { filename: filenameMatch?.[1] ?? 'upload', content };
  }

  return null;
}

function splitBuffer(buffer, delimiter) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(delimiter, start);

  while (index !== -1) {
    if (index > start) parts.push(buffer.slice(start, index));
    start = index + delimiter.length;
    index = buffer.indexOf(delimiter, start);
  }
  return parts;
}

export function saveImage(buffer, { actor } = {}) {
  const detected = detectImage(buffer);
  if (!detected) {
    throw Object.assign(new Error('Only JPEG, PNG, WebP or AVIF images are allowed.'), {
      status: 415,
    });
  }
  if (!config.uploads.allowedMime.includes(detected.mime)) {
    throw Object.assign(new Error('That image type is not allowed.'), { status: 415 });
  }
  if (buffer.length > config.uploads.maxBytes) {
    throw Object.assign(new Error('Image is larger than the 4 MB limit.'), { status: 413 });
  }

  const id = randomUUID();
  const filename = `${id}.${detected.ext}`;
  const target = path.join(config.paths.uploads, filename);

  // Defence in depth: ensure the resolved path is still inside the upload dir.
  if (!target.startsWith(path.resolve(config.paths.uploads) + path.sep)) {
    throw Object.assign(new Error('Invalid upload path.'), { status: 400 });
  }

  fs.writeFileSync(target, buffer, { mode: 0o644 });

  db.prepare(
    'INSERT INTO uploads (id, filename, mime, size, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, filename, detected.mime, buffer.length, now());

  return { id, filename, mime: detected.mime, size: buffer.length, url: `/uploads/${filename}` };
}

export function readUpload(filename) {
  const safe = path.basename(String(filename));
  const target = path.join(config.paths.uploads, safe);
  if (!fs.existsSync(target)) return null;

  const row = db.prepare('SELECT mime FROM uploads WHERE filename = ?').get(safe);
  return { buffer: fs.readFileSync(target), mime: row?.mime ?? 'application/octet-stream' };
}

export function deleteUpload(id) {
  const row = db.prepare('SELECT filename FROM uploads WHERE id = ?').get(id);
  if (!row) return false;

  const target = path.join(config.paths.uploads, path.basename(row.filename));
  if (fs.existsSync(target)) fs.unlinkSync(target);
  db.prepare('DELETE FROM uploads WHERE id = ?').run(id);
  return true;
}
