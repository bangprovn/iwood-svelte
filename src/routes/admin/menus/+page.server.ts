import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { deleteMenu, listMenus } from '$lib/server/cms/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listMenus() };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		try {
			await deleteMenu(id);
		} catch (e) {
			return fail(500, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	}
};
