import { error, fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	deleteTranslationKey,
	getTranslationKey,
	listLocales,
	renameTranslationKey,
	setTranslationValues,
	updateTranslationKeyMeta
} from '$lib/server/admin-i18n';
import { parseValuesForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const key = decodeURIComponent(event.params.key);
	const [row, locales] = await Promise.all([getTranslationKey(key), listLocales()]);
	if (!row) throw error(404, 'Key not found');
	return { row, locales };
};

export const actions: Actions = {
	save: async (event) => {
		requireAdmin(event);
		const key = decodeURIComponent(event.params.key);
		const fd = await event.request.formData();
		const parsed = parseValuesForm(fd);
		try {
			await updateTranslationKeyMeta(key, { description: parsed.description });
			await setTranslationValues(key, parsed.valuesByLocale);
			if (parsed.renameTo && parsed.renameTo !== key) {
				await renameTranslationKey(key, parsed.renameTo);
				throw redirect(303, `/admin/translations/${encodeURIComponent(parsed.renameTo)}`);
			}
		} catch (e) {
			if (e instanceof Response) throw e;
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	},
	delete: async (event) => {
		requireAdmin(event);
		const key = decodeURIComponent(event.params.key);
		try {
			await deleteTranslationKey(key);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		throw redirect(303, '/admin/translations');
	}
};
