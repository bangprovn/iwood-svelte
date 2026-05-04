import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	deleteProject,
	listProjectCategoriesAdmin,
	listProjectsAdmin
} from '$lib/server/admin-repos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [rows, cats] = await Promise.all([listProjectsAdmin(), listProjectCategoriesAdmin()]);
	return { rows, cats };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		await deleteProject(id);
		return { success: true };
	}
};
