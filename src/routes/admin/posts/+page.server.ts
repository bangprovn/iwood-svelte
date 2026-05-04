import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { deletePost, listPostsAdmin } from '$lib/server/admin-repos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listPostsAdmin() };
};

export const actions: Actions = {
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		await deletePost(id);
		return { success: true };
	}
};
