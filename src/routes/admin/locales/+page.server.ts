import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { setDefaultLocale } from '$lib/server/i18n/admin';
import { localesResource } from '$lib/server/cms/locales';

export const load = localesResource.list.load;

export const actions = {
	...localesResource.list.actions,
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
