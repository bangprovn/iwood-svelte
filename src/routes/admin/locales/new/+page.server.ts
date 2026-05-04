import { fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { createLocale } from '$lib/server/admin-i18n';
import { parseLocaleForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	requireAdmin(event);
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseLocaleForm(fd);
		if (!('input' in parsed)) return parsed;
		try {
			await createLocale(parsed.input);
		} catch (e) {
			return fail(409, {
				errors: { code: e instanceof Error ? e.message : String(e) },
				values: parsed.input
			});
		}
		throw redirect(303, '/admin/locales');
	}
};
