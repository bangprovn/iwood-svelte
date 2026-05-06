import { error, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { importLocaleDictionary } from '$lib/server/i18n/admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);

	const ctype = event.request.headers.get('content-type') ?? '';
	let locale: string;
	let mode: 'merge' | 'replace';
	let dict: Record<string, string>;
	let comesFromForm = false;

	if (
		ctype.includes('multipart/form-data') ||
		ctype.includes('application/x-www-form-urlencoded')
	) {
		comesFromForm = true;
		const fd = await event.request.formData();
		locale = (fd.get('locale')?.toString() ?? event.url.searchParams.get('locale') ?? '').trim();
		const modeRaw = (
			fd.get('mode')?.toString() ??
			event.url.searchParams.get('mode') ??
			'merge'
		).trim();
		mode = modeRaw === 'replace' ? 'replace' : 'merge';
		const file = fd.get('file');
		if (!(file instanceof File)) throw error(400, 'file is required');
		const text = await file.text();
		dict = parseDict(text);
	} else {
		locale = (event.url.searchParams.get('locale') ?? '').trim();
		const modeRaw = event.url.searchParams.get('mode') ?? 'merge';
		mode = modeRaw === 'replace' ? 'replace' : 'merge';
		const text = await event.request.text();
		dict = parseDict(text);
	}

	if (!locale) throw error(400, 'locale is required');

	let result;
	try {
		result = await importLocaleDictionary(locale, dict, mode);
	} catch (e) {
		throw error(409, e instanceof Error ? e.message : String(e));
	}

	if (comesFromForm) {
		throw redirect(303, '/admin/translations');
	}
	return new Response(JSON.stringify(result), {
		headers: { 'content-type': 'application/json; charset=utf-8' }
	});
};

function parseDict(text: string): Record<string, string> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw error(400, 'Body is not valid JSON');
	}
	if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw error(400, 'Expected a JSON object of { "key": "value" } pairs');
	}
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
		if (k.startsWith('$')) continue; // skip $schema and similar metadata
		out[k] = typeof v === 'string' ? v : v == null ? '' : String(v);
	}
	return out;
}
