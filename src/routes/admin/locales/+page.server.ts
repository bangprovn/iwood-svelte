import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { deleteLocale, listLocales, setDefaultLocale } from '$lib/server/admin-i18n';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listLocales() };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const code = fd.get('code')?.toString();
		if (!code) return fail(400, { message: 'code required' });
		try {
			await deleteLocale(code);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	},
	setDefault: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const code = fd.get('code')?.toString();
		if (!code) return fail(400, { message: 'code required' });
		try {
			await setDefaultLocale(code);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	}
};
