import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	deleteProduct,
	listCategoriesAdmin,
	listProductsAdmin
} from '$lib/server/admin-repos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const search = event.url.searchParams.get('q') ?? '';
	const categoryId = event.url.searchParams.get('cat') ?? 'all';
	const [rows, categories] = await Promise.all([
		listProductsAdmin({ search, categoryId }),
		listCategoriesAdmin()
	]);
	return { rows, categories, search, categoryId };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		try {
			await deleteProduct(id);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	}
};
