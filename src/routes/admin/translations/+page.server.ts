import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { deleteTranslationKey, listLocales, listTranslationKeys } from '$lib/server/admin-i18n';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const search = event.url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(1, Number(event.url.searchParams.get('page') ?? '1') || 1);
	const offset = (page - 1) * PAGE_SIZE;

	const [{ rows, total }, locales] = await Promise.all([
		listTranslationKeys({ search, limit: PAGE_SIZE, offset }),
		listLocales()
	]);

	return { rows, total, page, pageSize: PAGE_SIZE, search, locales };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const key = fd.get('key')?.toString();
		if (!key) return fail(400, { message: 'key required' });
		try {
			await deleteTranslationKey(key);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	}
};
