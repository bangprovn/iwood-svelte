import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Storage, StoredObject } from './index';

const ROOT = path.resolve('static', 'uploads');
const PUBLIC_PREFIX = '/uploads';

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'image/svg+xml': '.svg',
	'image/avif': '.avif'
};

function safeExt(contentType: string, hint?: string): string {
	const fromMime = EXT_BY_MIME[contentType.toLowerCase()];
	if (fromMime) return fromMime;
	if (hint) {
		const ext = path.extname(hint).toLowerCase();
		if (/^\.[a-z0-9]{2,5}$/i.test(ext)) return ext;
	}
	return '.bin';
}

export const localStorage: Storage = {
	async put({ buffer, contentType, filenameHint, prefix }) {
		const cleanPrefix = (prefix ?? 'misc').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'misc';
		const year = new Date().getFullYear();
		const dir = path.join(ROOT, cleanPrefix, String(year));
		if (!existsSync(dir)) await mkdir(dir, { recursive: true });

		const ext = safeExt(contentType, filenameHint);
		const id = randomUUID();
		const filename = `${id}${ext}`;
		const fullPath = path.join(dir, filename);

		await writeFile(fullPath, buffer);

		const key = `${cleanPrefix}/${year}/${filename}`;
		const obj: StoredObject = {
			key,
			url: `${PUBLIC_PREFIX}/${key}`,
			size: buffer.byteLength,
			contentType
		};
		return obj;
	},

	async delete(key) {
		// Only allow deletes within ROOT — guard against traversal.
		const target = path.resolve(ROOT, key);
		if (!target.startsWith(ROOT + path.sep)) return;
		try {
			await unlink(target);
		} catch {
			// ignore missing
		}
	},

	urlFor(key) {
		return `${PUBLIC_PREFIX}/${key}`;
	}
};
