import { error, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	getProjectAdmin,
	listProductsAdmin,
	listProjectCategoriesAdmin,
	updateProject
} from '$lib/server/admin-repos';
import { parseProjectForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [row, categories, products] = await Promise.all([
		getProjectAdmin(event.params.id),
		listProjectCategoriesAdmin(),
		listProductsAdmin()
	]);
	if (!row) throw error(404, 'Not found');
	return {
		row,
		categories,
		products: products.map((p) => ({ id: p.id, code: p.code, nameVi: p.nameVi }))
	};
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseProjectForm(fd);
		if (!('input' in parsed)) return parsed;
		await updateProject(event.params.id, parsed.input);
		throw redirect(303, '/admin/projects');
	}
};
