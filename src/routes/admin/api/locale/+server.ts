import { error, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { getI18nSnapshot } from '$lib/server/i18n';
import type { RequestHandler } from './$types';

const COOKIE_NAME = 'LOCALE';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);

	const fd = await event.request.formData();
	const code = fd.get('code')?.toString().trim() ?? '';
	const next = fd.get('next')?.toString() ?? '/admin';

	const snap = await getI18nSnapshot();
	const valid = snap.locales.some((l) => l.code === code);
	if (!valid) throw error(400, 'Unknown locale');

	event.cookies.set(COOKIE_NAME, code, { path: '/', maxAge: COOKIE_MAX_AGE });

	const safe = next.startsWith('/admin') ? next : '/admin';
	throw redirect(303, safe);
};
