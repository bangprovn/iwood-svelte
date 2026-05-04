import { error, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	getProductAdmin,
	listCategoriesAdmin,
	updateProduct
} from '$lib/server/admin-repos';
import { parseProductForm } from '../_form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [row, categories] = await Promise.all([
		getProductAdmin(event.params.id),
		listCategoriesAdmin()
	]);
	if (!row) throw error(404, 'Not found');
	return { row, categories };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseProductForm(fd);
		if (!('input' in parsed)) return parsed;
		await updateProduct(event.params.id, parsed.input);
		throw redirect(303, '/admin/products');
	}
};
