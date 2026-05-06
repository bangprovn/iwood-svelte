import { error } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { exportLocaleDictionary } from '$lib/server/i18n/admin';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const locale = event.url.searchParams.get('locale')?.trim();
	if (!locale) throw error(400, 'locale query parameter is required');

	const dict = await exportLocaleDictionary(locale);
	const body = JSON.stringify(dict, null, 2);

	return new Response(body, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="${locale}.json"`
		}
	});
};
