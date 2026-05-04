import { redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	createProject,
	listProductsAdmin,
	listProjectCategoriesAdmin
} from '$lib/server/admin-repos';
import { parseProjectForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [categories, products] = await Promise.all([
		listProjectCategoriesAdmin(),
		listProductsAdmin()
	]);
	return {
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
		await createProject(parsed.input);
		throw redirect(303, '/admin/projects');
	}
};
