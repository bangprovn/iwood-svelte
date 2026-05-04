import { error, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { getCategory } from '$lib/server/repos';
import { updateCategory } from '$lib/server/admin-repos';
import { parseCategoryForm } from '../_form';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	// Read raw row so we have the persisted English fields & sortOrder.
	const [row] = await db.select().from(category).where(eq(category.id, event.params.id));
	if (!row) throw error(404, 'Not found');
	return { row };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseCategoryForm(fd);
		if (!('input' in parsed)) return parsed;
		await updateCategory(event.params.id, parsed.input);
		throw redirect(303, '/admin/categories');
	}
};
