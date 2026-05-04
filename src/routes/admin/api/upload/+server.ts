import { error, json } from '@sveltejs/kit';
import { storage } from '$lib/server/storage';
import { requireAdmin } from '$lib/server/admin-guard';
import type { RequestHandler } from './$types';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/svg+xml',
	'image/avif'
]);

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);

	const form = await event.request.formData();
	const file = form.get('file');
	const prefix = (form.get('prefix') ?? 'misc').toString();

	if (!(file instanceof File)) throw error(400, 'file is required');
	if (!ALLOWED.has(file.type)) throw error(415, `Unsupported type: ${file.type}`);
	if (file.size > MAX_BYTES) throw error(413, 'File too large (max 8 MB)');

	const buf = new Uint8Array(await file.arrayBuffer());
	const obj = await storage.put({
		buffer: buf,
		contentType: file.type,
		filenameHint: file.name,
		prefix
	});

	return json(obj);
};
