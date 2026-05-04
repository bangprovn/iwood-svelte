import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { deleteCategory, listCategoriesAdmin } from '$lib/server/admin-repos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listCategoriesAdmin() };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		try {
			await deleteCategory(id);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	}
};
