import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { deleteNewsletter, listNewsletterAdmin } from '$lib/server/cms/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listNewsletterAdmin() };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = Number(fd.get('id'));
		if (!Number.isFinite(id)) return fail(400, { message: 'id required' });
		await deleteNewsletter(id);
		return { success: true };
	}
};
