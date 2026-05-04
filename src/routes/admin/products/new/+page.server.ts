import { redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { createProduct, listCategoriesAdmin } from '$lib/server/admin-repos';
import { parseProductForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { categories: await listCategoriesAdmin() };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseProductForm(fd);
		if (!('input' in parsed)) return parsed;
		await createProduct(parsed.input);
		throw redirect(303, '/admin/products');
	}
};
